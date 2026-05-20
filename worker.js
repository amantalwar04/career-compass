/**
 * Career Compass — AI Gateway Worker
 * ====================================
 * A single Cloudflare Worker that routes requests across multiple LLM
 * providers with automatic fallback, unified response format, and
 * per-provider health logging.
 *
 * Provider priority (configurable below):
 *   1. Anthropic Claude  — primary
 *   2. OpenRouter        — same Claude model, different billing
 *   3. Google Gemini     — generous free tier, strong fallback
 *   4. OpenAI GPT-4o     — broad availability, last resort
 *
 * ── Secrets (Workers → Settings → Variables → Encrypt each) ────────────
 *   ANTHROPIC_API_KEY    console.anthropic.com          (recommended)
 *   OPENROUTER_API_KEY   openrouter.ai/keys             (recommended)
 *   GEMINI_API_KEY       aistudio.google.com/apikey     (free tier!)
 *   OPENAI_API_KEY       platform.openai.com/api-keys   (optional)
 *
 * Any key that is absent causes that provider to be skipped silently.
 * At least one key must be present.
 *
 * ── Models (edit to taste) ──────────────────────────────────────────────
 *   ANTHROPIC  : claude-sonnet-4-20250514
 *   OPENROUTER : anthropic/claude-sonnet-4   (same model via OR)
 *   GEMINI     : gemini-2.0-flash            (fast + free tier)
 *   OPENAI     : gpt-4o-mini                 (cost-effective)
 */

// ── Model config ─────────────────────────────────────────────────────────
const MODELS = {
  anthropic:   'claude-sonnet-4-20250514',
  openrouter:  'anthropic/claude-sonnet-4',
  gemini:      'gemini-2.0-flash',
  openai:      'gpt-4o-mini',
};

// ── API endpoints ────────────────────────────────────────────────────────
const ENDPOINTS = {
  anthropic:  'https://api.anthropic.com/v1/messages',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  gemini:     'https://generativelanguage.googleapis.com/v1beta/models',
  openai:     'https://api.openai.com/v1/chat/completions',
};

// ── Status codes / error types that trigger fallback ─────────────────────
const FALLBACK_HTTP    = new Set([429, 503, 529, 500]);
const FALLBACK_ERRORS  = new Set([
  'rate_limit_error', 'overloaded_error', 'quota_exceeded',
  'server_error',     'service_unavailable',
]);

// ── CORS headers ─────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ═════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════

function jsonResp(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });
}

/** Extract plain text from an Anthropic-format messages array */
function extractText(messages) {
  return (messages || []).map(m =>
    typeof m.content === 'string' ? m.content
    : (m.content || []).map(c => c.text || '').join('')
  );
}

/** Normalise any provider response → Anthropic message shape */
function normalise(text, provider, model, usage = {}) {
  return {
    id:      `cc-${provider}-${Date.now()}`,
    type:    'message',
    role:    'assistant',
    model,
    content: [{ type: 'text', text }],
    _provider: provider,
    usage: {
      input_tokens:  usage.input  || usage.prompt_tokens     || usage.promptTokenCount     || 0,
      output_tokens: usage.output || usage.completion_tokens || usage.candidatesTokenCount || 0,
    },
  };
}

/** Decide whether to fall back based on HTTP status and/or body */
function isFallbackWorthy(status, data) {
  if (FALLBACK_HTTP.has(status)) return true;
  const errType = data?.error?.type || data?.error?.status || '';
  return FALLBACK_ERRORS.has(errType);
}

// ═════════════════════════════════════════════════════════════════════════
// Provider callers  — each returns { ok, text, usage, rawStatus, rawData }
// ═════════════════════════════════════════════════════════════════════════

async function callAnthropic(body, apiKey) {
  const res = await fetch(ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODELS.anthropic,
      max_tokens: body.max_tokens || 1000,
      messages:   body.messages,
    }),
  });
  const data = await res.json();
  if (!res.ok || isFallbackWorthy(res.status, data)) {
    return { ok: false, rawStatus: res.status, rawData: data };
  }
  const text = data.content?.map(b => b.text || '').join('') || '';
  return { ok: true, text, usage: data.usage || {}, model: data.model };
}

async function callOpenRouter(body, apiKey) {
  const messages = (body.messages || []).map(m => ({
    role:    m.role,
    content: typeof m.content === 'string' ? m.content
           : (m.content || []).map(c => c.text || '').join(''),
  }));
  const res = await fetch(ENDPOINTS.openrouter, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer':  'https://amantalwar04.github.io/career-compass',
      'X-Title':       'Career Compass',
    },
    body: JSON.stringify({
      model:      MODELS.openrouter,
      max_tokens: body.max_tokens || 1000,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok || isFallbackWorthy(res.status, data)) {
    return { ok: false, rawStatus: res.status, rawData: data };
  }
  const text = data.choices?.[0]?.message?.content || '';
  return { ok: true, text, usage: data.usage || {}, model: MODELS.openrouter };
}

async function callGemini(body, apiKey) {
  // Gemini uses a different message format — combine into a single prompt
  const textParts = extractText(body.messages);
  const contents = (body.messages || []).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content
                  : (m.content || []).map(c => c.text || '').join('') }],
  }));

  const url = `${ENDPOINTS.gemini}/${MODELS.gemini}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: body.max_tokens || 1000 },
    }),
  });
  const data = await res.json();
  if (!res.ok || isFallbackWorthy(res.status, data)) {
    return { ok: false, rawStatus: res.status, rawData: data };
  }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  const usage = data.usageMetadata || {};
  return { ok: true, text, usage, model: MODELS.gemini };
}

async function callOpenAI(body, apiKey) {
  const messages = (body.messages || []).map(m => ({
    role:    m.role,
    content: typeof m.content === 'string' ? m.content
           : (m.content || []).map(c => c.text || '').join(''),
  }));
  const res = await fetch(ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      MODELS.openai,
      max_tokens: body.max_tokens || 1000,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok || isFallbackWorthy(res.status, data)) {
    return { ok: false, rawStatus: res.status, rawData: data };
  }
  const text = data.choices?.[0]?.message?.content || '';
  return { ok: true, text, usage: data.usage || {}, model: MODELS.openai };
}

// ═════════════════════════════════════════════════════════════════════════
// Main handler
// ═════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return jsonResp({ error: 'Method not allowed' }, 405);
    }

    let body;
    try { body = await request.json(); }
    catch { return jsonResp({ error: { message: 'Invalid JSON body.' } }, 400); }

    // Build the provider queue — only include providers whose key is set
    const queue = [
      env.ANTHROPIC_API_KEY   && { name: 'anthropic',  fn: () => callAnthropic(body,  env.ANTHROPIC_API_KEY)  },
      env.OPENROUTER_API_KEY  && { name: 'openrouter', fn: () => callOpenRouter(body, env.OPENROUTER_API_KEY) },
      env.GEMINI_API_KEY      && { name: 'gemini',     fn: () => callGemini(body,     env.GEMINI_API_KEY)     },
      env.OPENAI_API_KEY      && { name: 'openai',     fn: () => callOpenAI(body,     env.OPENAI_API_KEY)     },
    ].filter(Boolean);

    if (queue.length === 0) {
      return jsonResp({
        error: { message: 'No API keys configured. Add at least ANTHROPIC_API_KEY or OPENROUTER_API_KEY in Worker secrets.' }
      }, 500);
    }

    const attempts = [];
    for (const provider of queue) {
      let result;
      try {
        result = await provider.fn();
      } catch (e) {
        result = { ok: false, rawStatus: 503, rawData: { error: { message: e.message } } };
      }

      attempts.push({ provider: provider.name, ok: result.ok, status: result.rawStatus });

      if (result.ok) {
        const payload = normalise(result.text, provider.name, result.model, result.usage);
        // Add a debug header so you can see which provider answered in DevTools
        return jsonResp(payload, 200, {
          'X-Provider': provider.name,
          'X-Attempts': attempts.map(a => a.provider).join(' → '),
        });
      }
      // Not ok — log and try next provider
      console.warn(`[career-compass] ${provider.name} failed (${result.rawStatus}), trying next…`);
    }

    // All providers exhausted
    return jsonResp({
      error: {
        message: 'All AI providers failed or are rate-limited. Try again in a moment.',
        attempts,
      }
    }, 503);
  },
};

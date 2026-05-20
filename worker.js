/**
 * Career Compass — Cloudflare Worker Proxy
 * =========================================
 * Sits between the GitHub Pages frontend and the Anthropic API.
 * Keeps your API key server-side and handles CORS.
 *
 * Deploy steps (5 minutes, free):
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create
 *   2. Click "Create Worker", paste this entire file, click "Deploy"
 *   3. Go to Settings → Variables → add secret:
 *        Name:  ANTHROPIC_API_KEY
 *        Value: sk-ant-...   (your key from console.anthropic.com)
 *   4. Copy the worker URL (e.g. https://career-compass-proxy.YOUR-NAME.workers.dev)
 *   5. Paste it into the Career Compass app → Profile tab → setup banner
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Check API key is configured
    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY secret not set in Worker settings.' } }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: { message: 'Invalid JSON body.' } }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Forward to Anthropic
    const upstream = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      body.model      || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        messages:   body.messages,
      }),
    });

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};

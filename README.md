# Career Compass 🧭

> Your AI-powered Career Growth Command Center

**Live App → [amantalwar04.github.io/career-compass](https://amantalwar04.github.io/career-compass)**

---

## How the AI works

All AI features route through a single **Cloudflare Worker** that acts as a smart gateway across four LLM providers. Every request tries providers in priority order and automatically falls back if one is rate-limited, overloaded, or has exhausted its quota:

```
Request → Anthropic Claude   ✅ respond
                             ❌ rate-limit / quota
               → OpenRouter  ✅ respond  (same Claude model, different billing)
                             ❌ rate-limit
               → Gemini      ✅ respond  (fast, generous free tier)
                             ❌ rate-limit
               → OpenAI      ✅ respond  (last resort)
```

The frontend always receives the same response shape regardless of which provider answered. A `X-Provider` header in the response tells you which one fired.

---

## Setup (≈ 5 minutes)

### Step 1 — Deploy the Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Click **Create Worker**, delete the placeholder code
3. Paste the contents of [`worker.js`](./worker.js) → **Deploy**
4. Copy your worker URL:
   `https://career-compass-proxy.YOUR-NAME.workers.dev`

### Step 2 — Add API keys as secrets

In your Worker dashboard → **Settings** → **Variables** → **Add variable** → **Encrypt** each one.

| Secret name | Where to get it | Cost | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Pay per use | Primary — best quality |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | Pay per use | Same Claude model, 2nd billing pool |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | **Free tier** ✨ | Gemini 2.0 Flash, generous limits |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Pay per use | GPT-4o-mini, last resort |

**You don't need all four** — any key that's absent is silently skipped. At minimum, add `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY`.

> 💡 **Recommended combo for zero-downtime:** `ANTHROPIC_API_KEY` + `GEMINI_API_KEY` (free) gives you two independent billing pools that are unlikely to hit limits simultaneously.

### Step 3 — Connect the app

1. Open [amantalwar04.github.io/career-compass](https://amantalwar04.github.io/career-compass)
2. **Profile tab** → paste your Worker URL into the setup banner → **Save**
3. URL is stored in your browser — one-time setup per device ✅

---

## Customising models

Edit the `MODELS` object at the top of `worker.js`:

```js
const MODELS = {
  anthropic:  'claude-sonnet-4-20250514',   // or claude-opus-4-20250514
  openrouter: 'anthropic/claude-sonnet-4',  // or openai/gpt-4o, google/gemini-pro-1.5
  gemini:     'gemini-2.0-flash',           // or gemini-1.5-pro
  openai:     'gpt-4o-mini',               // or gpt-4o
};
```

---

## Project Structure

```
career-compass/
├── index.html    # Full app — all HTML, CSS, JS in one file (no build step)
├── worker.js     # Cloudflare Worker AI gateway (deploy separately)
└── README.md
```

---

## Tech Stack

- **HTML / CSS / Vanilla JS** — zero dependencies, zero build step
- **Cloudflare Workers** — free serverless proxy (100k requests/day free tier)
- **Providers:** Anthropic Claude · OpenRouter · Google Gemini · OpenAI
- **GitHub Pages** — static hosting from `main` branch

---

Built with ❤️ using [Claude](https://claude.ai) by Anthropic.

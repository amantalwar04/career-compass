# Career Compass 🧭

> Your AI-powered Career Growth Command Center

**Live App → [amantalwar04.github.io/career-compass](https://amantalwar04.github.io/career-compass)**

---

## Setup (5 minutes to enable AI features)

The app is a static GitHub Pages site. Because browsers block direct calls to `api.anthropic.com` (CORS), you need a free Cloudflare Worker as a proxy. It takes 5 minutes and costs nothing.

### Step 1 — Deploy the Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Click **Create Worker**
3. Delete the placeholder code, paste the contents of [`worker.js`](./worker.js), click **Deploy**
4. Copy your worker URL — it looks like:  
   `https://career-compass-proxy.YOUR-NAME.workers.dev`

### Step 2 — Add your Anthropic API key

1. In your Worker dashboard → **Settings** → **Variables**
2. Under **Environment Variables** click **Add variable**:
   - **Variable name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com)
   - Click **Encrypt** then **Save**

### Step 3 — Connect the app

1. Open [amantalwar04.github.io/career-compass](https://amantalwar04.github.io/career-compass)
2. On the **Profile** tab, paste your worker URL into the setup banner
3. Click **Save** — AI features are now live ✅

The URL is saved in your browser so you only need to do this once per device.

---

## What it does

| Tab | Feature |
|---|---|
| **Profile** | Enter your background, skills, and target role. Get AI career coaching instantly. |
| **Roles** | Curated opportunities with profile match scores. AI advice for each role. |
| **LinkedIn** | Generate posts, articles, newsletters, or carousel hooks tailored to your voice. |
| **Planner** | Weekly calendar nudges + personalized Mon–Fri AI action plan. |
| **Progress** | Visibility score across 5 dimensions with AI growth coaching. |

---

## Project Structure

```
career-compass/
├── index.html    # Full app — all HTML, CSS, JS in one file
├── worker.js     # Cloudflare Worker proxy (deploy separately)
└── README.md
```

---

## Tech Stack

- **HTML / CSS / Vanilla JS** — zero build step, zero dependencies
- **Claude Sonnet 4** via Anthropic API
- **Cloudflare Workers** — free serverless proxy for CORS + API key security
- **Font Awesome 6** · **Google Fonts** (Playfair Display + DM Sans)
- **GitHub Pages** — static hosting on `main` branch

---

Built with ❤️ using [Claude](https://claude.ai) by Anthropic.

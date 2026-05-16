# Career Compass 🧭

> Your AI-powered Career Growth Command Center

**Live App → [amantalwar04.github.io/career-compass](https://amantalwar04.github.io/career-compass)**

---

## What it does

Career Compass is a single-page web app that helps professionals at any stage:

| Feature | Description |
|---|---|
| **Profile Builder** | Fill in your background, skills, and target role — Claude AI gives you personalized career coaching instantly |
| **Role Matcher** | See curated opportunities with profile match scores; get AI advice on how to position yourself for each |
| **LinkedIn Content Studio** | Generate short posts, articles, newsletters, or carousel hooks tailored to your voice and target audience |
| **Weekly Nudge Planner** | A calendar-driven action tracker with 5 weekly nudges; Claude generates a personalized Mon–Fri plan |
| **Visibility Score** | Track progress across 5 dimensions: profile completeness, posting consistency, network growth, engagement, and applications |

---

## Tech Stack

- **Pure HTML / CSS / Vanilla JS** — no build step, no framework
- **Claude Sonnet 4** via Anthropic API for all AI features
- **Font Awesome 6** for icons
- **Google Fonts** — Playfair Display + DM Sans

---

## Project Structure

```
career-compass/
├── index.html          # Main app shell
├── src/
│   ├── css/
│   │   └── styles.css  # All styles (CSS variables, components)
│   └── js/
│       └── app.js      # All interactivity + Claude API calls
└── README.md
```

---

## Local Development

No build step needed — just open `index.html` in your browser.

```bash
git clone https://github.com/amantalwar04/career-compass.git
cd career-compass
open index.html
```

---

## Deployment

The app is deployed via **GitHub Pages** from the `gh-pages` branch.

---

Built with Claude by Anthropic.

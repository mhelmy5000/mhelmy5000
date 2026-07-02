- 👋 Hi, I’m @MohamedHelmy
- 👀 I’m interested in Enterprise Architecture 
- 🌱 I’m currently learning LeaderShip
- 💞️ I’m looking to collaborate on with any one


## 📊 KPI Monitoring Dashboard

A self-contained, single-file monitoring dashboard for tracking service KPIs —
uptime, response-time percentiles, throughput, error rates, resource
utilization, and per-service health. Built with plain HTML/CSS/SVG and no
external dependencies, so it works offline.

- **File:** [`dashboard/index.html`](dashboard/index.html)
- **View it:** open the file in any browser, or serve it with
  `python3 -m http.server` and browse to `/dashboard/`. If GitHub Pages is
  enabled for this repo, it is available at `/dashboard/`.

Features: live streaming updates (with a pause/resume control), an active
alerts panel derived from service health and latency/error-rate SLO
thresholds, one-click CSV export of the selected range, light/dark theme
toggle, 24h/7d/30d time ranges, interactive crosshair and hover tooltips,
and an accessible color palette that stays colorblind-safe in both themes.

## 🏛️ Helm EPM — Enterprise Performance Management platform

A larger, enterprise-grade work-in-progress: a multi-tenant EPM platform
covering Strategy, KPIs, KRIs, Initiatives, Portfolio, Projects and OKRs, with a
provider-agnostic AI copilot.

- **Folder:** [`epm-platform/`](epm-platform/) · start with its
  [README](epm-platform/README.md)
- **Premium UI prototype:** [`epm-platform/prototype/index.html`](epm-platform/prototype/index.html)
  — enterprise shell, 7 modules, command palette (⌘K), dark/light, Arabic RTL.
- **AI abstraction layer:** [`epm-platform/packages/ai-core`](epm-platform/packages/ai-core)
  — Claude / OpenAI / Gemini / Ollama / Azure with priority fallback + RAG
  (typechecked and unit-verified).

See [`epm-platform/docs/`](epm-platform/docs) for architecture, the AI layer, and
the delivery roadmap.

---

## 🏗️ EA Strategy Builder

A lightweight, zero-dependency web app for building an **Enterprise Architecture strategy**. It runs entirely in the browser — no backend, no build step.

**Open `index.html`** in any browser, or host it on GitHub Pages.

What it does:
- **Drivers** — capture the business/technology forces shaping the architecture and rate their impact.
- **Capabilities** — map business capabilities and score current vs. target maturity (1–5); the app surfaces the biggest gaps.
- **Initiatives** — define programs of work, ranked automatically by priority (value ÷ effort).
- **Roadmap** — sequence initiatives across Now / Next / Later horizons.
- **Export** — save your work as JSON (re-importable) or a Markdown strategy report.

All data is stored locally in your browser (`localStorage`); nothing is sent anywhere.

| File | Purpose |
|---|---|
| `index.html` | App layout and structure |
| `styles.css` | Styling and responsive layout |
| `app.js` | State, persistence, and rendering logic |

<!---
mhelmy5000/mhelmy5000 is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->

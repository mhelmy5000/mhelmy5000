# @mizan/web — Mizan EPM frontend (Phase 2)

Next.js 15 (App Router) + React 19 web app, built from the prototype's design
system and wired to the Mizan API through a typed, tested data layer.

## What's here

```
apps/web/
├─ app/
│  ├─ layout.tsx          # root: fonts, providers, metadata
│  ├─ globals.css         # Mizan design tokens (light/dark) — ported from the prototype
│  ├─ providers.tsx       # TanStack Query + next-themes
│  └─ (app)/
│     ├─ layout.tsx       # app shell (sidebar + topbar)
│     ├─ page.tsx         # Executive Dashboard
│     ├─ kpis/            # KPI Scorecards  ─┐
│     ├─ strategy/        # Strategy Map     │ live, wired to the API
│     ├─ okrs/            # OKRs & Goals      │ via TanStack Query hooks
│     ├─ risk/            # Risk & KRIs       │
│     ├─ portfolio/       # Portfolio matrix ─┘
│     └─ ai|projects|reports|admin/  # Phase-3 placeholders (no dead links)
├─ components/
│  ├─ shell/              # sidebar, topbar, nav model
│  └─ ui/primitives.tsx   # Card, StatTile, Bar, Sparkline, RagBadge, PageHeader…
├─ hooks/use-queries.ts   # one TanStack hook per module
└─ lib/
   ├─ types.ts            # API DTO contract (mirrors the NestJS responses)
   ├─ api.ts              # typed MizanApi client (framework-agnostic)
   └─ format.ts           # fmt / compact / RAG helpers
```

## Design system

`app/globals.css` defines the same tokens as the prototype (brand indigo/violet,
the validated categorical + status palette, surfaces, ink) as CSS custom
properties for light and dark. `tailwind.config.ts` maps them to Tailwind
colours, so components use `bg-surface`, `text-ink-2`, `bg-brand`, etc. and both
themes swap in one place. Dark mode is class-based via `next-themes`.

## Data layer (verified)

`lib/api.ts` is a small, dependency-free client (just `fetch` + a base URL) that
returns the typed DTOs in `lib/types.ts`. It is exercised end-to-end against the
reference server — see the repo's verification: all of `kpiScorecard`,
`strategyMap`, `strategyOkrs`, `riskRegister`, `portfolioMatrix`, `analyzeKpis`
and `login` return correctly-shaped, correct-valued data.

In the browser the app calls **same-origin `/api/*`**, which `next.config.mjs`
rewrites to the Mizan API (`API_URL`, default `http://localhost:3001`) — so the
running NestJS API *or* the zero-dependency reference server both work.

## Run

```bash
pnpm install                 # from the repo root (installs the workspace)
# start a backend on :3001 — either:
node ../api/dev-server.mjs   # zero-dep reference server, or
(cd ../api && pnpm start:dev)# the full NestJS API
pnpm --filter @mizan/web dev # http://localhost:3000
```

## Status

Config, design system, shell, and the five data-driven module pages are
authored and typed. The framework-agnostic data layer (`lib/`) is unit-verified
against the API contract. The React app itself builds/runs once dependencies are
installed (`pnpm install`) — those binaries aren't available in the CI sandbox,
so the running app is not screenshotted here; the prototype
(`../../prototype/index.html`) is the pixel reference the components reproduce.

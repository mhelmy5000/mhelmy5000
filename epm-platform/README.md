<div align="center">

# Mizan EPM

**Enterprise Performance Management platform** — Strategy, KPIs, KRIs,
Initiatives, Portfolio, Projects and OKRs, unified with a provider-agnostic AI
copilot. Built for multi-tenant SaaS and sovereign / on-prem deployment.

</div>

---

## ⚠️ Read this first — status & honesty

A complete commercial EPM suite (full NestJS backend + Next.js frontend, 10
module suites, 6-provider AI with RAG, K8s/Terraform/CI, full test + docs
matrix) is a multi-team, multi-quarter build. **This repository is a real,
verified _foundation_ — not a finished product.** It deliberately ships working,
tested pieces instead of a wall of empty stubs.

| Delivered here | Proof |
|---|---|
| **Premium UX prototype** — enterprise shell, 7 modules (Exec Dashboard, Strategy Map/BSC, KPI Scorecards, Risk heatmap, Portfolio matrix, OKRs, AI Copilot), command palette (⌘K), dark/light, English + Arabic (RTL), interactive charts. | Rendered & driven in headless Chromium — all views, both themes, RTL, chat, and command palette verified with **0 console errors**. |
| **`@mizan/ai-core`** — provider-agnostic AI layer: router with priority + cross-provider fallback, adapters for **Claude / OpenAI / Gemini / Ollama / Azure OpenAI** (+ Bedrock stub), RAG (vector store + retriever), versioned prompt templates, EPM insight service. | Compiles under TS `strict`; **12/12 runtime assertions pass** (chain ordering, live reconfigure, fallback, RAG tenant isolation, prompt grounding). |
| **`@mizan/domain`** — pure evaluation cores: **KPI** (attainment, direction-aware RAG, scorecard rollups, forecast), **Strategy/OKR** (key-result progress, objective scoring/status, Balanced-Scorecard rollups), **Risk** (likelihood×impact scoring, severity bands, appetite breach, heatmap, register aggregation), **Portfolio** (value/risk quadrants, prioritization, rollups). | **78/78 unit tests pass** (`packages/domain`). |
| **`@mizan/api`** — NestJS backend (Phase 1): JWT auth + RBAC/ABAC guards; **KPI, Strategy/OKR, Risk/KRI and Portfolio** modules end-to-end (CRUD, scorecard, BSC, OKRs, heatmap, matrix); AI endpoint wired to `@mizan/ai-core`; Prisma repos + seed. Plus a **zero-dependency reference server** mirroring the endpoints. | Reference server exercised end-to-end; prototype KPI, Strategy, OKR, Risk and Portfolio views read **live data** from it (verified in-browser). |
| **Prisma schema** — multi-tenant core domains, RBAC/ABAC, audit, AI provider config. | Authored & reviewed (`prisma/schema.prisma`). |
| **Local infra** — Postgres + pgvector, Redis, RabbitMQ, Ollama. | `infra/docker-compose.yml`. |
| **Docs** — architecture (C4, DDD, CQRS, security), AI layer, phased roadmap. | `docs/`. |

Everything still to build is sequenced honestly in **[docs/ROADMAP.md](docs/ROADMAP.md)**.

## 🚀 Try the prototype now

No build step — it's a self-contained file:

```bash
# from repo root
python3 -m http.server 8080
# open http://localhost:8080/epm-platform/prototype/
```

Then: press **⌘K / Ctrl-K** for the command palette, toggle the **moon** (theme)
and **ع** (Arabic RTL) buttons, click **AI Copilot**, and explore every module.

**See live data** — start the zero-dependency backend and the KPI Scorecard,
Strategy Map, OKRs, Risk & KRIs, and Portfolio views flip their badge to “Live API”:

```bash
node epm-platform/apps/api/dev-server.mjs   # serves http://localhost:3001/api
```


## 🧠 The AI layer in 20 lines

```ts
import { AiRouter, EpmInsightService, defaultProviderConfigs } from '@mizan/ai-core';

const router = new AiRouter(defaultProviderConfigs(process.env), {
  onFailover: (e) => log.warn(`AI failover ${e.from} → ${e.to} (${e.reason})`),
});
const insights = new EpmInsightService(router /*, retriever */);

// Business code never names a model or a vendor SDK:
const summary = await insights.executiveSummary(
  { entity: 'Ministry of Government', period: 'FY2026 Q2' },
  { tenantId, userId },
);
```

Admins configure providers (enable, priority, keys, endpoints, models, fallback,
rate limits) at runtime → `router.configure(newConfigs)`, no redeploy. Details in
**[docs/AI_LAYER.md](docs/AI_LAYER.md)**.

## 🏛️ Architecture

Clean/Hexagonal architecture, DDD bounded contexts per module, CQRS for read-heavy
dashboards, event-driven projections on RabbitMQ, multi-tenancy via `tenantId` +
Postgres RLS, RBAC + ABAC, immutable audit. Full write-up and C4 diagram in
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

**Target stack:** Next.js 15 · React 19 · TypeScript · Tailwind · Shadcn/UI ·
Framer Motion · TanStack · Recharts/D3/React Flow — NestJS · Prisma · PostgreSQL ·
Redis · RabbitMQ · GraphQL + REST — Docker · Kubernetes/Helm · Terraform ·
OpenTelemetry/Prometheus/Grafana.

## 📁 Layout

```
epm-platform/
├─ prototype/            # ✅ self-contained premium UI (open in a browser)
├─ packages/ai-core/     # ✅ provider-agnostic AI layer (TS, typechecked + tested)
├─ prisma/schema.prisma  # ✅ multi-tenant core data model
├─ infra/                # ✅ docker-compose (Postgres+pgvector, Redis, RabbitMQ, Ollama)
├─ docs/                 # ✅ architecture · ai-layer · roadmap
└─ .env.example          # provider keys & connection strings
```

## 🧭 Next step

Phase 1 stands up the NestJS spine (IAM + the KPI module end-to-end) against this
schema and `@mizan/ai-core`, so the prototype's KPI Scorecard can be pointed at
live data. See the roadmap — or ask and we build that module next.

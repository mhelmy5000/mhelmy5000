# Helm EPM — Delivery Roadmap

An honest, phased plan. A complete commercial EPM platform is a multi-team,
multi-quarter build; this sequences it so every phase ships something usable and
verifiable rather than a wall of stubs.

**Legend:** ✅ done in this repo · 🔨 next · ⏳ planned

## Phase 0 — Foundation (this repository)
- ✅ Premium UX prototype: enterprise shell, 7 modules, command palette,
  dark/light, EN/AR RTL, interactive charts (verified in-browser).
- ✅ `@helm/ai-core`: provider-agnostic router, 5 adapters (+Bedrock stub), RAG
  ports, prompt templates, insight service (typechecks under `strict`).
- ✅ Prisma schema for core domains (multi-tenant, RBAC/ABAC, audit).
- ✅ Local infra compose (Postgres+pgvector, Redis, RabbitMQ, Ollama).
- ✅ Architecture + AI-layer documentation.

## Phase 1 — Backend spine (in progress)
- ✅ NestJS app skeleton (`apps/api`): bootstrap, config, Swagger, global
  validation, Helmet/CORS, `PrismaModule`.
- ✅ IAM: JWT auth (Passport) with a global guard (`@Public()` opt-out), **RBAC**
  via `@RequirePermissions` + `PermissionsGuard`, **ABAC** org-unit scopes on the
  principal, token issuance resolving roles→permissions from the DB.
- ✅ **KPI module end-to-end**: CRUD, measurement upsert, weighted scorecard,
  RAG evaluation — delegated to `@helm/domain` (pure core, **24/24 unit tests**).
- ✅ AI endpoint (`/api/ai/kpi-analysis`) wired to `@helm/ai-core`, grounded on
  the live scorecard.
- ✅ Seed data (`prisma/seed.ts`): demo tenant, 3 roles, 2 users, 6 KPIs × 7
  months of measurements.
- ✅ Zero-dependency **reference API server** mirroring the KPI/AI endpoints; the
  prototype's KPI Scorecard now reads **live data** from it (verified).
- 🔨 Prisma migrations + Postgres RLS policies; wire the full NestJS app against
  a live database (needs `pnpm install` — deps unavailable in the CI sandbox).
- 🔨 Strategy module; transactional outbox on RabbitMQ; audit + notifications.
- 🔨 GraphQL resolvers alongside REST; integration tests.

## Phase 2 — Frontend spine (4–6 wks)
- ⏳ Next.js 15 app: auth, tenant switch, i18n (EN/AR), theming from prototype.
- ⏳ Shared `@helm/ui` component + chart library (Recharts/D3/React Flow) built
  from the prototype's design system.
- ⏳ Executive Dashboard, Strategy Map, KPI Scorecards wired to the live API via
  TanStack Query; Zustand for client state; forms via RHF+Zod.

## Phase 3 — Remaining modules (6–10 wks)
- ⏳ KRI/Risk, Portfolio, Project/PMO, OKR, Reviews modules (API + UI).
- ⏳ Reporting studio: PDF/PPTX/XLSX/Word export, scheduled + interactive reports.
- ⏳ Visualization set: gauge, bullet, waterfall, treemap, radar, Sankey, Gantt,
  strategy map, risk heatmap, portfolio matrix, drill-down + cross-filter.

## Phase 4 — AI depth (parallel, 4–8 wks)
- ⏳ PgVectorStore + document ingestion/embeddings pipeline; semantic search.
- ⏳ AI agents + MCP tool-calling; NL→query; what-if & forecasting on real data.
- ⏳ Admin AI-provider screen bound to `AiProviderConfig`; per-tenant policy.
- ⏳ AI memory; automatic board presentations + action plans.

## Phase 5 — Enterprise hardening & delivery (ongoing)
- ⏳ Multi-tenant load/perf, caching strategy, rate limiting, backups/DR.
- ⏳ Kubernetes manifests + Helm chart; Terraform modules; GitHub Actions CI/CD.
- ⏳ E2E tests (Playwright), security review, WCAG audit, pen-test.
- ⏳ Admin/User/Developer guides; ER/sequence/component diagrams.

## Suggested next step
Phase 1's IAM + KPI slice is done and the prototype consumes it live. Next:
extend the same patterns to the **Risk/KRI** and **Portfolio** modules (domain
core + repository + controller + prototype wiring), and stand the full NestJS app
up against Postgres with migrations + RLS.

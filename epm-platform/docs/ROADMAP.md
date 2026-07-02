# Mizan EPM — Delivery Roadmap

An honest, phased plan. A complete commercial EPM platform is a multi-team,
multi-quarter build; this sequences it so every phase ships something usable and
verifiable rather than a wall of stubs.

**Legend:** ✅ done in this repo · 🔨 next · ⏳ planned

## Phase 0 — Foundation (this repository)
- ✅ Premium UX prototype: enterprise shell, 7 modules, command palette,
  dark/light, EN/AR RTL, interactive charts (verified in-browser).
- ✅ `@mizan/ai-core`: provider-agnostic router, 5 adapters (+Bedrock stub), RAG
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
  RAG evaluation — delegated to `@mizan/domain` (pure core, **24/24 unit tests**).
- ✅ AI endpoint (`/api/ai/kpi-analysis`) wired to `@mizan/ai-core`, grounded on
  the live scorecard.
- ✅ Seed data (`prisma/seed.ts`): demo tenant, 3 roles, 2 users, 6 KPIs × 7
  months of measurements.
- ✅ Zero-dependency **reference API server** mirroring the KPI/AI endpoints; the
  prototype's KPI Scorecard now reads **live data** from it (verified).
- ✅ **Risk/KRI module**: scoring (likelihood×impact), severity bands, appetite
  breaches, 5×5 heatmap, register aggregation — via `@mizan/domain`. Prototype
  Risk view reads live data.
- ✅ **Portfolio module**: value/risk quadrant classification, prioritization
  scoring, portfolio rollups — via `@mizan/domain`. Prototype Portfolio view reads
  live data.
- ✅ **Strategy / OKR module**: key-result progress (increase & decrease goals),
  objective scoring & status, Balanced-Scorecard rollups (objective → perspective
  → strategy) — via `@mizan/domain`. Prototype Strategy Map + OKR views read live
  data. (Domain now **78 unit tests** total.)
- ✅ **Database migration + Row-Level Security**: full DDL (20 tables) in
  `prisma/migrations/0001_init`, forced RLS policies in `infra/postgres/rls.sql`,
  wired into NestJS via a tenant-context interceptor + Prisma RLS extension
  (`set_config('app.tenant_id', …)`). **Verified on real Postgres 16** —
  isolation + cross-tenant write-block asserted by `infra/postgres/verify-rls.sh`.
- 🔨 Wire the full NestJS app process against the live DB (needs `pnpm install`
  — deps unavailable in the CI sandbox); connect as `mizan_app`/`mizan_system`.
- 🔨 Transactional outbox on RabbitMQ; audit + notifications.
- 🔨 GraphQL resolvers alongside REST; integration tests.

## Phase 2 — Frontend spine (in progress)
- ✅ Next.js 15 (App Router) + React 19 app scaffolded (`apps/web`): root layout,
  providers (TanStack Query + next-themes), Mizan design tokens ported to
  `globals.css` + Tailwind, app shell (sidebar + topbar).
- ✅ Typed, **verified** data layer: `lib/api.ts` (framework-agnostic `MizanApi`
  client) + `lib/types.ts` (DTO contract) — exercised end-to-end against the API
  (8/8 assertions across all module endpoints + login).
- ✅ Five data-driven module pages wired via TanStack Query hooks: Executive
  Dashboard, KPI Scorecards, Strategy Map, OKRs, Risk & KRIs, Portfolio matrix.
- 🔨 Auth flow (login → JWT), tenant switch, i18n (EN/AR RTL), forms (RHF+Zod).
- 🔨 Extract shared `@mizan/ui` package; richer charts (D3/React Flow).

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
IAM + KPI + Strategy/OKR + Risk/KRI + Portfolio are done, each with a tested
domain core and the prototype consuming them live. Next: stand the full NestJS
app up against Postgres (migrations + RLS + the seed) so every module runs on a
real database, add integration/e2e tests, then move to Phase 2 (the Next.js
frontend built from the prototype's design system).

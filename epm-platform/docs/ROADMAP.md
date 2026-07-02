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

## Phase 1 — Backend spine (4–6 wks)
- 🔨 NestJS app skeleton; config, logging, OpenTelemetry, health checks.
- 🔨 IAM: OIDC/SAML/Entra login, JWT, RBAC guard + ABAC policy engine.
- 🔨 Tenant + audit + notification modules; transactional outbox on RabbitMQ.
- 🔨 Prisma migrations + RLS policies; seed data (sample org, strategy, KPIs…).
- 🔨 KPI + Strategy modules end-to-end (CRUD, measurements, RAG calc) with REST +
  GraphQL and Swagger; unit + integration tests.

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
Stand up **Phase 1** starting with IAM + the KPI module end-to-end against the
existing Prisma schema and `@helm/ai-core`, so the prototype's KPI Scorecard can
be pointed at real data. Say the word and we build that module next.

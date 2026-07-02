# Mizan EPM — Architecture

> Enterprise Performance Management platform: Strategy → KPI/KRI → Initiatives →
> Portfolio → Projects → OKRs, with a provider-agnostic AI layer. Designed for
> multi-tenant SaaS and sovereign/on-prem deployment.

## 1. Guiding principles

| Principle | How it shows up |
|---|---|
| **Clean Architecture / Hexagonal** | Domain logic depends on *ports* (interfaces); infrastructure (Prisma, AI SDKs, queues) are *adapters* plugged in at the edges. |
| **Domain-Driven Design** | One bounded context per module (Strategy, KPI, Risk, Portfolio, Project, OKR, AI). Aggregates own their invariants. |
| **CQRS where it pays** | Heavy read models (dashboards, scorecards, heatmaps) are denormalized/materialized; writes go through command handlers with validation + audit. |
| **API-first** | REST + GraphQL generated from the same application services; OpenAPI/Swagger published. |
| **Event-driven** | Domain events (`kpi.measurement.recorded`, `risk.escalated`) on RabbitMQ drive projections, notifications, and AI re-analysis. |
| **Multi-tenant by construction** | `tenantId` on every row + Postgres RLS; secrets per tenant; branding/feature-flags per tenant. |
| **Secure by default** | RBAC + ABAC, encrypted secrets (KMS/Vault), immutable audit trail, least privilege. |

## 2. C4 — container view

```
                          ┌────────────────────────────────────────────┐
        Browser  ────────▶│  Web App (Next.js 15 / React 19)            │
        (SPA/SSR)         │  Shadcn UI · Framer Motion · TanStack ·     │
                          │  Recharts/D3/React Flow · i18n (EN/AR RTL)  │
                          └───────────────┬────────────────────────────┘
                                          │ REST + GraphQL (JWT/OIDC)
                          ┌───────────────▼────────────────────────────┐
                          │  API Gateway (NestJS)                       │
                          │  Auth · RBAC/ABAC · rate limit · Swagger    │
                          └───┬───────────┬───────────┬────────────────┘
             ┌────────────────┘           │           └───────────────────┐
   ┌─────────▼─────────┐      ┌───────────▼──────────┐        ┌───────────▼──────────┐
   │ Domain modules    │      │  @mizan/ai-core       │        │  Projections/Reports │
   │ Strategy·KPI·KRI· │      │  Router · adapters · │        │  CQRS read models ·  │
   │ Portfolio·Project·│      │  RAG · prompts ·     │        │  PDF/PPTX/XLSX       │
   │ OKR (DDD)         │      │  agents · MCP        │        │                      │
   └───┬──────────┬────┘      └───┬────────┬─────────┘        └──────────┬───────────┘
       │          │               │        │                             │
 ┌─────▼───┐ ┌────▼────┐   ┌──────▼──┐ ┌───▼──────────┐          ┌───────▼───────┐
 │Postgres │ │ Redis   │   │ Vector  │ │ AI providers │          │ RabbitMQ      │
 │(+RLS,   │ │ cache/  │   │ store   │ │ Claude·GPT·  │          │ events/jobs   │
 │ pgvector)│ │ jobs    │   │(pgvector│ │ Gemini·Ollama│          │               │
 └─────────┘ └─────────┘   │/Qdrant) │ │ Azure·Bedrock│          └───────────────┘
                           └─────────┘ └──────────────┘
```

Cross-cutting: OpenTelemetry traces → Prometheus/Grafana; structured logs;
health checks; audit log; feature flags; secrets via Vault/KMS.

## 3. Monorepo layout (target)

```
epm-platform/
├─ apps/
│  ├─ web/                 # Next.js 15 frontend  (prototype/ shows the UX today)
│  └─ api/                 # NestJS backend (modules below)
├─ packages/
│  ├─ ai-core/             # ✅ provider-agnostic AI layer (implemented here)
│  ├─ ui/                  # shared Shadcn-based component library + charts
│  ├─ config/              # eslint/tsconfig/tailwind presets
│  └─ contracts/           # shared DTOs / Zod schemas / OpenAPI types
├─ prisma/                 # ✅ schema.prisma (core domains)
├─ infra/                  # ✅ docker-compose, k8s/helm, terraform, otel
└─ docs/                   # ✅ architecture, AI layer, roadmap, guides
```

### NestJS module map (`apps/api/src/modules`)
`strategy` · `kpi` · `kri` · `initiative` · `portfolio` · `project` · `okr`
· `review` · `dashboard` · `report` · `ai` · `iam` (auth/RBAC/ABAC) · `tenant`
· `audit` · `notification` · `integration`. Each module = controller (REST) +
resolver (GraphQL) + application services (commands/queries) + domain +
Prisma repository adapter.

## 4. Request lifecycle (write path)

1. Controller/resolver validates input (Zod/class-validator) and resolves the
   auth context (tenant, user, roles, ABAC scope).
2. A **command handler** loads the aggregate via a repository *port*, enforces
   invariants, and persists through the Prisma adapter inside a transaction.
3. An **audit entry** and one or more **domain events** are written in the same
   unit of work (transactional outbox).
4. The outbox relay publishes events to RabbitMQ; subscribers update CQRS read
   models, fire notifications (Teams/Slack/email/SMS), and enqueue AI re-analysis.

## 5. Security architecture

- **AuthN:** OIDC / SAML / Azure AD / Entra ID / Google; short-lived JWT access
  tokens + rotating refresh; per-tenant IdP config.
- **AuthZ:** RBAC (roles → permission keys) plus ABAC (policies scoped to an
  org-unit subtree via `UserRole.scopeOrgUnitId`). Enforced by a guard + a
  policy engine; the DB adds Postgres RLS as defense-in-depth.
- **Secrets:** provider API keys stored as references to Vault/KMS; never
  plaintext (see `AiProviderConfig.apiKeyRef`).
- **Data:** soft delete, immutable `AuditLog`, field-level encryption for PII,
  configurable retention (e.g. 7 years for gov).
- **Tenant isolation:** `tenantId` on every row + RLS policy per table.

## 6. Data model

See [`prisma/schema.prisma`](../prisma/schema.prisma) and
[`docs/DATA_MODEL` notes]. Core aggregates: `Tenant`, `User/Role/OrgUnit`,
`Perspective/Objective/KeyResult`, `Kpi/KpiMeasurement`, `Risk/Kri/Mitigation`,
`Portfolio/Initiative/Project/Milestone`, `AiProviderConfig`, `AuditLog`.

## 7. What is implemented in this repository today

| Area | State |
|---|---|
| Premium UX prototype (7 modules, shell, command palette, dark/light, RTL) | ✅ working, verified in-browser (`prototype/index.html`) |
| AI abstraction layer (router, 5 adapters, RAG, prompts, insight service) | ✅ implemented + typechecks strict (`packages/ai-core`) |
| Prisma schema (core domains, multi-tenant, RBAC, audit) | ✅ authored (`prisma/schema.prisma`) |
| SQL migration (20 tables) + **forced Row-Level Security** | ✅ verified on real Postgres 16 (`infra/postgres/verify-rls.sh`) |
| NestJS API (IAM + KPI/Strategy/Risk/Portfolio + AI) + tenant-context RLS wiring | ✅ authored, typed; runs once deps installed |
| Local infra (Postgres+pgvector, Redis, RabbitMQ, Ollama) | ✅ `infra/docker-compose.yml` |
| Next.js app, integration/e2e tests, k8s/helm, CI | ⏳ see [ROADMAP](./ROADMAP.md) |

This is an honest foundation, not a finished product. The roadmap sequences the
remaining build.

# @helm/api — Helm EPM backend (Phase 1)

NestJS API implementing **IAM** (JWT auth + RBAC/ABAC) and the **KPI module**
end-to-end, plus an **AI** endpoint wired to `@helm/ai-core`. KPI judgement
(attainment, RAG, scorecard rollups) is delegated to the pure, unit-tested
`@helm/domain` core.

## Architecture

```
HTTP ─▶ JwtAuthGuard (global, @Public opt-out)
     ─▶ PermissionsGuard (global, @RequirePermissions RBAC)
     ─▶ Controller (DTO validation via class-validator)
     ─▶ Service  ──uses──▶ @helm/domain  (attainment / RAG / rollup)
                └─▶ Repository (tenant-scoped Prisma) ─▶ Postgres (+RLS)
AiController ─▶ AiService ─▶ @helm/ai-core (router + fallback) + KpiService
```

- **Secure by default:** every route needs a valid JWT unless `@Public()`; RBAC
  permissions are declared per route with `@RequirePermissions('kpi:update')`.
- **Multi-tenant:** repositories take `tenantId` explicitly on every call;
  Postgres RLS is defense-in-depth.
- **DTO = contract:** global `ValidationPipe` with `whitelist` + `transform`.

## Endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Exchange identity for a JWT (federation stub) |
| GET | `/api/auth/me` | authed | Current principal |
| GET | `/api/kpis` | `kpi:read` | List KPIs with evaluated attainment + RAG |
| GET | `/api/kpis/scorecard` | `kpi:read` | Weighted scorecard + overall + RAG counts |
| GET | `/api/kpis/:id` | `kpi:read` | KPI detail |
| POST | `/api/kpis` | `kpi:create` | Create a KPI |
| PATCH | `/api/kpis/:id` | `kpi:update` | Update a KPI |
| POST | `/api/kpis/:id/measurements` | `kpi:update` | Record/upsert a measurement |
| DELETE | `/api/kpis/:id` | `kpi:delete` | Soft-delete (archive) |
| POST | `/api/ai/kpi-analysis` | `kpi:read`,`ai:use` | AI analysis of the scorecard |
| POST | `/api/ai/executive-summary` | `ai:use` | AI executive summary |

Swagger/OpenAPI is served at `/api/docs`.

## Run — full stack (production shape)

```bash
# from repo root: install workspaces, then
docker compose -f infra/docker-compose.yml up -d          # Postgres, Redis, RabbitMQ, Ollama
cd apps/api
cp ../../.env.example .env
pnpm prisma:generate && pnpm prisma:migrate && pnpm seed  # schema + demo tenant/KPIs
pnpm start:dev                                            # http://localhost:3001/api
```

Login with the seeded admin (`minister@gov.example`) to get a JWT, then call the
KPI endpoints with `Authorization: Bearer <token>`.

## Run — zero-dependency reference server (no install needed)

For sandboxes/CI/demos without the NestJS+Prisma+Postgres stack, a
dependency-free server mirrors the KPI + AI endpoints over Node's `http`, using
the same seed data and an inline mirror of `@helm/domain`:

```bash
node apps/api/dev-server.mjs          # http://localhost:3001/api  (health: /api/health)
```

The prototype's **KPI Scorecard** auto-connects to `http://localhost:3001/api`
and flips its badge to **“Live API”** when this (or the full API) is running;
otherwise it shows demo data. Override the base URL in the browser console:
`localStorage.setItem('helm.apiBase', 'http://host:port/api')`.

## Status

Implemented & verified: domain core (24/24 unit tests), reference server
(all endpoints exercised), prototype live-data wiring. The NestJS code is
production-shaped and typed but requires `pnpm install` (NestJS/Prisma) to build
and run — it is not compiled in the CI sandbox where those binaries are
unavailable. Next: risk/KRI + portfolio modules (see `../../docs/ROADMAP.md`).

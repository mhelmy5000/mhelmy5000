# Database & Row-Level Security

Multi-tenancy is enforced in two layers (defense-in-depth):

1. **Application** — every repository filters by `tenantId` explicitly.
2. **Database** — Postgres **row-level security** scopes every read/write to the
   current tenant, so a missing `WHERE` clause can never leak another tenant's
   data. This is the backstop.

## Files

| File | What it is |
|---|---|
| `../../prisma/schema.prisma` | The source-of-truth data model (Prisma). |
| `../../prisma/migrations/0001_init/migration.sql` | The DDL (enums, 20 tables, FKs, indexes). Hand-authored to match the schema so the DB can be stood up without Prisma engine binaries; `prisma migrate` produces the same shape. |
| `rls.sql` | Enables + **forces** RLS on every tenant table and adds `tenant_isolation` policies keyed on the `app.tenant_id` GUC. Creates the `mizan_app` (RLS-enforced) and `mizan_system` (BYPASSRLS) roles. |
| `verify-rls.sh` | Spins up a throwaway Postgres cluster, applies the migration + RLS, seeds two tenants, and asserts isolation end-to-end. |

## How isolation works

Each request runs inside a transaction that first sets the tenant GUC:

```sql
SELECT set_config('app.tenant_id', '<tenantId>', true);  -- true = SET LOCAL
```

The NestJS side does this automatically: `TenantInterceptor` puts the JWT's
tenant into an `AsyncLocalStorage`, and the Prisma **RLS client extension**
(`apps/api/src/prisma/rls.extension.ts`) issues the `set_config` in the same
transaction as each query. Policies then match `tenant_id = app_current_tenant()`.

## Connection roles

- **`mizan_app`** — tenant feature traffic. Non-superuser, so RLS is enforced.
  Sets `app.tenant_id` per request → sees exactly one tenant.
- **`mizan_system`** — `BYPASSRLS`. Used **only** by migrations/seed and the
  pre-auth bootstrap (login's user/tenant lookup, which must run *before* a
  tenant context exists). Never used for tenant-scoped feature traffic.

## Apply

```bash
# Option A — Prisma (in a full dev env with deps installed)
cd apps/api && pnpm prisma:migrate && psql "$DATABASE_URL" -f ../../infra/postgres/rls.sql

# Option B — raw SQL (no Prisma engine needed)
psql "$DATABASE_URL" -f prisma/migrations/0001_init/migration.sql
psql "$DATABASE_URL" -f infra/postgres/rls.sql
```

## Verify (no external services required)

Requires a local Postgres 16 install (`/usr/lib/postgresql/16/bin`). Creates a
temporary cluster under `/tmp/mizan-pg`, runs the assertions, and shuts down:

```bash
bash infra/postgres/verify-rls.sh
```

Expected: `ALL RLS ASSERTIONS PASSED` — no tenant context → 0 rows; T1 sees only
T1's rows; T2 sees only T2's; and a cross-tenant insert is rejected by the
`WITH CHECK` policy.

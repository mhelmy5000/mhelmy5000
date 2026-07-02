import { Prisma } from '@prisma/client';
import { getTenantId } from '../common/tenant/tenant-context';

/**
 * Prisma client extension that enforces Postgres RLS. Before each operation it
 * sets the `app.tenant_id` GUC *inside the same transaction* (via
 * `set_config(..., true)` = SET LOCAL), so the policies in
 * `infra/postgres/rls.sql` scope the query to the current tenant. The tenant is
 * read from the request-scoped async context (see tenant-context.ts).
 *
 * When no tenant is in context (e.g. the pre-auth login lookup) the query runs
 * unchanged — those paths use the base client via a system role.
 *
 * The value is passed as a bound parameter to `set_config`, so it is not
 * string-interpolated into SQL (no injection surface).
 */
export const rlsExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'tenant-rls',
    query: {
      async $allOperations({ args, query }) {
        const tenantId = getTenantId();
        if (!tenantId) return query(args);
        const [, result] = await client.$transaction([
          client.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
          query(args),
        ]);
        return result;
      },
    },
  }),
);

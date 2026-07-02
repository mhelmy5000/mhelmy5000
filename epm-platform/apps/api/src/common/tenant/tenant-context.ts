import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped tenant context. The auth layer resolves the tenant from the
 * JWT and stashes it here; the Prisma RLS extension reads it to set the
 * `app.tenant_id` GUC on every query, so Postgres row-level security scopes all
 * access even if a repository forgets a WHERE clause.
 */
export interface TenantStore {
  tenantId: string;
  userId?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export const getTenantId = (): string | undefined => tenantStorage.getStore()?.tenantId;

/** Run `fn` with the given tenant bound to the async context. */
export const runWithTenant = <T>(store: TenantStore, fn: () => T): T =>
  tenantStorage.run(store, fn);

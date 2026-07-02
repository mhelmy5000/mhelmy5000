import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { rlsExtension } from './rls.extension';

/**
 * Prisma lifecycle wrapper. Connects on module init and disconnects on
 * shutdown. Multi-tenancy is defense-in-depth:
 *   1. repositories filter by `tenantId` explicitly, and
 *   2. `db` — the RLS-extended client — sets `app.tenant_id` per query so
 *      Postgres row-level security enforces isolation even if (1) is missed.
 *
 * Tenant-scoped repositories use `prisma.db.<model>`; pre-auth/system paths
 * (e.g. login's user lookup) use the base client directly.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** RLS-enforced client (sets app.tenant_id from the request tenant context). */
  readonly db = this.$extends(rlsExtension);

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

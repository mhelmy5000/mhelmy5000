import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma lifecycle wrapper. Connects on module init and disconnects on
 * shutdown. Row-level multi-tenancy is enforced by Postgres RLS plus explicit
 * `tenantId` filters in repositories (defense in depth).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

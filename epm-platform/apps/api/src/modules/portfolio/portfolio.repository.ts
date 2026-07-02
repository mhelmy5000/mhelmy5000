import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Tenant-scoped data access for portfolio initiatives. */
@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, where: Prisma.InitiativeWhereInput = {}) {
    return this.prisma.initiative.findMany({
      where: { tenantId, deletedAt: null, ...where },
      orderBy: { strategicValue: 'desc' },
    });
  }

  create(tenantId: string, data: Prisma.InitiativeCreateInput) {
    return this.prisma.initiative.create({
      data: { ...data, tenant: { connect: { id: tenantId } } },
    });
  }

  update(tenantId: string, id: string, data: Prisma.InitiativeUpdateInput) {
    return this.prisma.initiative.updateMany({ where: { tenantId, id, deletedAt: null }, data });
  }
}

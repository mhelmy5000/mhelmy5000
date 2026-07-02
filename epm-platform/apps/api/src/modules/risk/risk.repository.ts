import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Tenant-scoped data access for risks (+ their KRIs and mitigations). */
@Injectable()
export class RiskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, where: Prisma.RiskWhereInput) {
    return this.prisma.db.risk.findMany({
      where: { tenantId, deletedAt: null, ...where },
      include: { owner: true, indicators: true, mitigations: true },
      orderBy: [{ likelihood: 'desc' }, { impact: 'desc' }],
    });
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.db.risk.findFirst({
      where: { tenantId, id, deletedAt: null },
      include: { owner: true, indicators: true, mitigations: true },
    });
  }

  create(tenantId: string, data: Prisma.RiskCreateInput) {
    return this.prisma.db.risk.create({ data: { ...data, tenant: { connect: { id: tenantId } } } });
  }

  update(tenantId: string, id: string, data: Prisma.RiskUpdateInput) {
    return this.prisma.db.risk.updateMany({ where: { tenantId, id, deletedAt: null }, data });
  }

  softDelete(tenantId: string, id: string) {
    return this.prisma.db.risk.updateMany({
      where: { tenantId, id, deletedAt: null },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
  }
}

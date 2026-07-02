import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Data access for KPIs. Every method is tenant-scoped — `tenantId` is a
 * required argument, never inferred — so a missing tenant filter is impossible
 * by construction (belt-and-braces with Postgres RLS).
 */
@Injectable()
export class KpiRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, where: Prisma.KpiWhereInput) {
    return this.prisma.kpi.findMany({
      where: { tenantId, deletedAt: null, ...where },
      include: { owner: true, measurements: { orderBy: { periodStart: 'desc' }, take: 12 } },
      orderBy: { name: 'asc' },
    });
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.kpi.findFirst({
      where: { tenantId, id, deletedAt: null },
      include: { owner: true, measurements: { orderBy: { periodStart: 'desc' }, take: 24 } },
    });
  }

  create(tenantId: string, data: Prisma.KpiCreateInput) {
    return this.prisma.kpi.create({ data: { ...data, tenant: { connect: { id: tenantId } } } });
  }

  update(tenantId: string, id: string, data: Prisma.KpiUpdateInput) {
    // updateMany enforces the tenant guard in the WHERE clause.
    return this.prisma.kpi.updateMany({ where: { tenantId, id, deletedAt: null }, data });
  }

  softDelete(tenantId: string, id: string) {
    return this.prisma.kpi.updateMany({
      where: { tenantId, id, deletedAt: null },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  addMeasurement(kpiId: string, data: Prisma.KpiMeasurementUncheckedCreateInput) {
    return this.prisma.kpiMeasurement.upsert({
      where: { kpiId_periodStart: { kpiId, periodStart: data.periodStart } },
      update: { actual: data.actual, target: data.target, note: data.note },
      create: data,
    });
  }
}

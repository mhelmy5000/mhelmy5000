import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Tenant-scoped data access for perspectives, objectives and key results. */
@Injectable()
export class StrategyRepository {
  constructor(private readonly prisma: PrismaService) {}

  perspectivesWithObjectives(tenantId: string) {
    return this.prisma.perspective.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      include: {
        objectives: {
          where: { deletedAt: null, type: 'STRATEGIC' },
          include: { keyResults: true },
        },
      },
    });
  }

  objectives(tenantId: string, where: Prisma.ObjectiveWhereInput) {
    return this.prisma.objective.findMany({
      where: { tenantId, deletedAt: null, ...where },
      include: { keyResults: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  createObjective(tenantId: string, data: Prisma.ObjectiveCreateInput) {
    return this.prisma.objective.create({ data: { ...data, tenant: { connect: { id: tenantId } } } });
  }

  updateObjective(tenantId: string, id: string, data: Prisma.ObjectiveUpdateInput) {
    return this.prisma.objective.updateMany({ where: { tenantId, id, deletedAt: null }, data });
  }

  findKeyResult(tenantId: string, objectiveId: string, krId: string) {
    return this.prisma.keyResult.findFirst({
      where: { id: krId, objectiveId, objective: { tenantId, deletedAt: null } },
    });
  }

  updateKeyResult(id: string, data: Prisma.KeyResultUpdateInput) {
    return this.prisma.keyResult.update({ where: { id }, data });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  evaluateKpi, latestActual, trendSeries, weightedScore,
  type KpiDirection, type RagStatus,
} from '@helm/domain';
import { KpiRepository } from './kpi.repository';
import { AuthUser } from '../../common/auth/auth-user';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { QueryKpiDto } from './dto/query-kpi.dto';
import { RecordMeasurementDto } from './dto/record-measurement.dto';

/** The read model returned to clients — a KPI plus its evaluated performance. */
export interface KpiView {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string | null;
  direction: KpiDirection;
  owner: string | null;
  weight: number;
  target: number | null;
  actual: number | null;
  attainmentPct: number | null;
  status: RagStatus;
  trend: number[];
}

export interface Scorecard {
  items: KpiView[];
  overallAttainmentPct: number | null;
  statusCounts: Record<RagStatus, number>;
}

/**
 * KPI application service. Persistence goes through the repository; *judgement*
 * (attainment, RAG, rollups) is delegated to the pure `@helm/domain` core, so
 * the same logic is used by the API, jobs and reports and is unit-tested in
 * isolation.
 */
@Injectable()
export class KpiService {
  constructor(private readonly repo: KpiRepository) {}

  async list(user: AuthUser, query: QueryKpiDto): Promise<KpiView[]> {
    const rows = await this.repo.findMany(user.tenantId, {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    });
    return rows.map((r) => this.toView(r));
  }

  async get(user: AuthUser, id: string): Promise<KpiView> {
    const row = await this.repo.findOne(user.tenantId, id);
    if (!row) throw new NotFoundException(`KPI ${id} not found`);
    return this.toView(row);
  }

  async create(user: AuthUser, dto: CreateKpiDto): Promise<KpiView> {
    const created = await this.repo.create(user.tenantId, {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      direction: dto.direction,
      frequency: dto.frequency,
      weight: dto.weight ?? 1,
      target: dto.target,
      thresholdGreen: dto.thresholdGreen,
      thresholdRed: dto.thresholdRed,
      status: 'ACTIVE',
      createdBy: user.sub,
      ...(dto.ownerId ? { owner: { connect: { id: dto.ownerId } } } : {}),
    });
    return this.get(user, created.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateKpiDto): Promise<KpiView> {
    const res = await this.repo.update(user.tenantId, id, { ...dto });
    if (res.count === 0) throw new NotFoundException(`KPI ${id} not found`);
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string): Promise<{ deleted: boolean }> {
    const res = await this.repo.softDelete(user.tenantId, id);
    if (res.count === 0) throw new NotFoundException(`KPI ${id} not found`);
    return { deleted: true };
  }

  async recordMeasurement(user: AuthUser, id: string, dto: RecordMeasurementDto): Promise<KpiView> {
    const kpi = await this.repo.findOne(user.tenantId, id);
    if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
    await this.repo.addMeasurement(id, {
      kpiId: id,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      actual: dto.actual,
      target: dto.target,
      note: dto.note,
    });
    return this.get(user, id);
  }

  async scorecard(user: AuthUser, query: QueryKpiDto): Promise<Scorecard> {
    const items = await this.list(user, query);
    const overall = weightedScore(
      items.map((i) => ({ weight: i.weight, attainment: i.attainmentPct == null ? null : i.attainmentPct / 100 })),
    );
    const statusCounts = items.reduce(
      (acc, i) => ((acc[i.status] = (acc[i.status] ?? 0) + 1), acc),
      { ON_TRACK: 0, AT_RISK: 0, OFF_TRACK: 0, NOT_STARTED: 0 } as Record<RagStatus, number>,
    );
    return {
      items,
      overallAttainmentPct: overall == null ? null : Math.round(overall * 100),
      statusCounts,
    };
  }

  /** Maps a persisted KPI (+measurements) to the evaluated read model. */
  private toView(row: KpiRow): KpiView {
    const actual = latestActual(row.measurements);
    const evalResult = evaluateKpi({
      actual,
      target: row.target,
      direction: row.direction as KpiDirection,
      thresholds: { green: row.thresholdGreen, red: row.thresholdRed },
    });
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      unit: row.unit,
      direction: row.direction as KpiDirection,
      owner: row.owner?.displayName ?? null,
      weight: row.weight,
      target: row.target,
      actual,
      attainmentPct: evalResult.attainmentPct,
      status: evalResult.status,
      trend: trendSeries(row.measurements),
    };
  }
}

/** Structural type of a repository row (avoids importing generated Prisma types here). */
interface KpiRow {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string | null;
  direction: string;
  weight: number;
  target: number | null;
  thresholdGreen: number | null;
  thresholdRed: number | null;
  owner: { displayName: string } | null;
  measurements: { periodStart: Date; actual: number }[];
}

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  evaluateRisk, aggregateRisks, heatGrid, riskScore,
  type RiskLevel, type HeatCell,
} from '@mizan/domain';
import { RiskRepository } from './risk.repository';
import { AuthUser } from '../../common/auth/auth-user';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { QueryRiskDto } from './dto/query-risk.dto';

export interface RiskView {
  id: string;
  code: string;
  title: string;
  category: string | null;
  owner: string | null;
  status: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  appetite: number | null;
  appetiteBreached: boolean;
  residualReductionPct: number | null;
  kriBreaches: number;
}

export interface HeatmapCell extends HeatCell {
  /** Risk codes plotted in this cell. */
  risks: string[];
}

export interface RiskRegister {
  risks: RiskView[];
  heatmap: HeatmapCell[][];
  summary: {
    total: number;
    byLevel: Record<RiskLevel, number>;
    appetiteBreaches: number;
  };
}

/** Risk application service — persistence via repository, scoring via @mizan/domain. */
@Injectable()
export class RiskService {
  constructor(private readonly repo: RiskRepository) {}

  async list(user: AuthUser, query: QueryRiskDto): Promise<RiskView[]> {
    const rows = await this.repo.findMany(user.tenantId, {
      ...(query.status ? { status: query.status } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.category ? { category: query.category } : {}),
    });
    return rows.map((r) => this.toView(r));
  }

  async get(user: AuthUser, id: string): Promise<RiskView> {
    const row = await this.repo.findOne(user.tenantId, id);
    if (!row) throw new NotFoundException(`Risk ${id} not found`);
    return this.toView(row);
  }

  /** The full register: evaluated risks + 5×5 heatmap + RAG summary. */
  async register(user: AuthUser, query: QueryRiskDto): Promise<RiskRegister> {
    const risks = await this.list(user, query);
    const grid: HeatmapCell[][] = heatGrid().map((row) =>
      row.map((cell) => ({
        ...cell,
        risks: risks.filter((r) => r.likelihood === cell.likelihood && r.impact === cell.impact).map((r) => r.code),
      })),
    );
    const agg = aggregateRisks(
      risks.map((r) => ({ key: r.code, likelihood: r.likelihood, impact: r.impact, appetite: r.appetite })),
    );
    return {
      risks,
      heatmap: grid,
      summary: { total: agg.total, byLevel: agg.byLevel, appetiteBreaches: agg.breaches },
    };
  }

  async create(user: AuthUser, dto: CreateRiskDto): Promise<RiskView> {
    const score = riskScore(dto.likelihood, dto.impact);
    const created = await this.repo.create(user.tenantId, {
      code: dto.code,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      likelihood: dto.likelihood,
      impact: dto.impact,
      inherentScore: score,
      residualScore: score,
      appetite: dto.appetite,
      status: 'OPEN',
      ...(dto.ownerId ? { owner: { connect: { id: dto.ownerId } } } : {}),
    });
    return this.get(user, created.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateRiskDto): Promise<RiskView> {
    // Recompute residual score when likelihood/impact change.
    const patch: Record<string, unknown> = { ...dto };
    if (dto.likelihood != null && dto.impact != null) {
      patch.residualScore = riskScore(dto.likelihood, dto.impact);
    }
    const res = await this.repo.update(user.tenantId, id, patch);
    if (res.count === 0) throw new NotFoundException(`Risk ${id} not found`);
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string): Promise<{ deleted: boolean }> {
    const res = await this.repo.softDelete(user.tenantId, id);
    if (res.count === 0) throw new NotFoundException(`Risk ${id} not found`);
    return { deleted: true };
  }

  private toView(row: RiskRow): RiskView {
    const ev = evaluateRisk({
      likelihood: row.likelihood,
      impact: row.impact,
      inherentScore: row.inherentScore,
      residualScore: row.residualScore,
      appetite: row.appetite,
    });
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      category: row.category,
      owner: row.owner?.displayName ?? null,
      status: row.status,
      likelihood: row.likelihood,
      impact: row.impact,
      score: ev.score,
      level: ev.level,
      appetite: row.appetite,
      appetiteBreached: ev.appetiteBreached,
      residualReductionPct: ev.residualReductionPct,
      kriBreaches: row.indicators.filter((k) => k.breached).length,
    };
  }
}

interface RiskRow {
  id: string;
  code: string;
  title: string;
  category: string | null;
  status: string;
  likelihood: number;
  impact: number;
  inherentScore: number | null;
  residualScore: number | null;
  appetite: number | null;
  owner: { displayName: string } | null;
  indicators: { breached: boolean }[];
}

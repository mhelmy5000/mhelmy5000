import { Injectable } from '@nestjs/common';
import {
  quadrant, summarize, rankByPriority, valueToRiskRatio,
  type Quadrant, type PortfolioSummary,
} from '@helm/domain';
import { PortfolioRepository } from './portfolio.repository';
import { AuthUser } from '../../common/auth/auth-user';
import { CreateInitiativeDto } from './dto/create-initiative.dto';

export interface PortfolioItemView {
  id: string;
  name: string;
  value: number;
  risk: number;
  budget: number;
  quadrant: Quadrant;
  valueToRisk: number;
  progress: number;
  status: string;
}

export interface PortfolioMatrix {
  items: PortfolioItemView[];
  summary: PortfolioSummary;
  /** Demand ranked best-first by prioritization score. */
  priorityOrder: { name: string; score: number; quadrant: Quadrant }[];
}

/** Portfolio application service — persistence via repository, scoring via @helm/domain. */
@Injectable()
export class PortfolioService {
  constructor(private readonly repo: PortfolioRepository) {}

  async matrix(user: AuthUser): Promise<PortfolioMatrix> {
    const rows = await this.repo.findMany(user.tenantId);
    const items = rows.map((r) => this.toView(r));
    const summary = summarize(items.map((i) => ({ value: i.value, risk: i.risk, budget: i.budget })));
    const ranked = rankByPriority(
      rows.map((r) => ({ key: r.title, value: r.strategicValue, risk: r.executionRisk, budget: r.budget })),
    );
    return {
      items,
      summary,
      priorityOrder: ranked.map((r) => ({ name: r.key, score: r.score, quadrant: r.quadrant })),
    };
  }

  async create(user: AuthUser, dto: CreateInitiativeDto): Promise<PortfolioItemView> {
    const created = await this.repo.create(user.tenantId, {
      title: dto.title,
      strategicValue: dto.strategicValue,
      executionRisk: dto.executionRisk,
      budget: dto.budget ?? 0,
      businessCase: dto.businessCase,
      status: 'ON_TRACK',
      ...(dto.portfolioId ? { portfolio: { connect: { id: dto.portfolioId } } } : {}),
    });
    return this.toView(created);
  }

  private toView(row: InitiativeRow): PortfolioItemView {
    return {
      id: row.id,
      name: row.title,
      value: row.strategicValue,
      risk: row.executionRisk,
      budget: row.budget,
      quadrant: quadrant(row.strategicValue, row.executionRisk),
      valueToRisk: Math.round(valueToRiskRatio(row.strategicValue, row.executionRisk) * 100) / 100,
      progress: row.progress,
      status: row.status,
    };
  }
}

interface InitiativeRow {
  id: string;
  title: string;
  strategicValue: number;
  executionRisk: number;
  budget: number;
  progress: number;
  status: string;
}

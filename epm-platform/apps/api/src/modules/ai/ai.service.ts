import { Injectable, Logger } from '@nestjs/common';
import {
  AiRouter, EpmInsightService, defaultProviderConfigs,
} from '@helm/ai-core';
import { KpiService } from '../kpi/kpi.service';
import { AuthUser } from '../../common/auth/auth-user';
import { QueryKpiDto } from '../kpi/dto/query-kpi.dto';

/**
 * Bridges EPM data to the provider-agnostic AI layer. It builds the router from
 * environment config (admins can override per-tenant via AiProviderConfig) and
 * grounds each capability on the tenant's live KPI data.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly insights: EpmInsightService;

  constructor(private readonly kpi: KpiService) {
    const router = new AiRouter(defaultProviderConfigs(process.env), {
      onFailover: (e) => this.logger.warn(`AI failover ${e.from} → ${e.to} (${e.reason})`),
      onError: (e) => this.logger.error(`AI provider ${e.provider} error: ${e.error.message}`),
    });
    // A production Retriever (pgvector) is injected here to ground on documents;
    // for KPI analysis we ground inline on the live scorecard below.
    this.insights = new EpmInsightService(router);
  }

  async analyzeKpis(user: AuthUser, query: QueryKpiDto) {
    const scorecard = await this.kpi.scorecard(user, query);
    const compact = scorecard.items.map((k) => ({
      name: k.name,
      actual: k.actual,
      target: k.target,
      unit: k.unit,
      attainmentPct: k.attainmentPct,
      status: k.status,
    }));
    const result = await this.insights.analyzeKpis(
      { kpis: compact },
      { tenantId: user.tenantId, userId: user.sub },
    );
    return { ...result, overallAttainmentPct: scorecard.overallAttainmentPct };
  }

  async executiveSummary(user: AuthUser, period?: string) {
    return this.insights.executiveSummary(
      { entity: user.tenantId, period },
      { tenantId: user.tenantId, userId: user.sub },
    );
  }
}

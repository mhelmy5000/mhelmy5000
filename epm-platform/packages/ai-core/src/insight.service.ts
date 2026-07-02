import { AiRouter } from './router';
import { Retriever } from './rag/retriever';
import { PROMPTS } from './prompts';
import { AiProviderId } from './types';

/**
 * EpmInsightService — the domain-facing AI capability surface consumed by the
 * NestJS API. It composes RAG retrieval + prompt templates + the router, and
 * exposes one method per EPM capability. Business code calls these; it never
 * touches a provider SDK, a model name, or a prompt string directly.
 */
export class EpmInsightService {
  constructor(
    private readonly router: AiRouter,
    private readonly retriever?: Retriever,
  ) {}

  private async run(
    templateId: keyof typeof PROMPTS,
    vars: Record<string, unknown>,
    ctx: { tenantId: string; userId?: string; traceId?: string; preferred?: AiProviderId; ragFilter?: Record<string, unknown> },
  ): Promise<{ text: string; provider: AiProviderId; model: string; grounded: boolean; sources: unknown[] }> {
    const tpl = PROMPTS[templateId];

    // Ground the prompt on tenant data when a retriever is wired up.
    let context: string | undefined;
    let sources: unknown[] = [];
    if (this.retriever) {
      const q = tpl.build(vars);
      const { hits, context: c } = await this.retriever.retrieve(q, ctx.tenantId, {
        filter: ctx.ragFilter,
      });
      context = c;
      sources = hits.map((h) => h.metadata.source ?? h.id);
    }

    const res = await this.router.complete(
      {
        messages: [
          { role: 'system', content: tpl.system },
          { role: 'user', content: tpl.build(vars, context) },
        ],
        temperature: 0.3,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        traceId: ctx.traceId,
      },
      ctx.preferred,
    );

    return {
      text: res.content,
      provider: res.provider,
      model: res.model,
      grounded: Boolean(context),
      sources,
    };
  }

  executiveSummary = (vars: { entity?: string; period?: string }, ctx: Ctx) =>
    this.run('executiveSummary', vars, ctx);

  analyzeKpis = (vars: { kpis: unknown }, ctx: Ctx) => this.run('kpiAnalysis', vars, ctx);

  predictRisks = (vars: { horizon?: string }, ctx: Ctx) => this.run('riskPrediction', vars, ctx);

  forecast = (vars: { metric: string; horizon: string }, ctx: Ctx) =>
    this.run('forecast', vars, { ...ctx, ragFilter: { module: 'kpi' } });

  rootCause = (vars: { observation: string }, ctx: Ctx) => this.run('rootCause', vars, ctx);

  boardNarrative = (vars: { entity?: string; reportType?: string }, ctx: Ctx) =>
    this.run('boardNarrative', vars, ctx);
}

type Ctx = {
  tenantId: string;
  userId?: string;
  traceId?: string;
  preferred?: AiProviderId;
  ragFilter?: Record<string, unknown>;
};

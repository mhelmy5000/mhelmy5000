/**
 * Prompt template registry. Templates are versioned and parameterised so the
 * EPM capabilities (executive summary, KPI analysis, risk prediction, forecast,
 * root-cause, board narrative) stay consistent, auditable and A/B-testable —
 * and can be overridden per tenant without a code change.
 */
export interface PromptTemplate {
  id: string;
  version: string;
  system: string;
  /** Build the user message from typed variables + optional RAG context. */
  build: (vars: Record<string, unknown>, context?: string) => string;
}

const ground = (context?: string): string =>
  context
    ? `\n\nUse ONLY the grounded enterprise data below. Cite sources as [n]. If the data is insufficient, say so explicitly.\n---\n${context}\n---`
    : '';

export const PROMPTS: Record<string, PromptTemplate> = {
  executiveSummary: {
    id: 'executiveSummary',
    version: '1.2.0',
    system:
      'You are the executive performance analyst for an enterprise EPM platform. ' +
      'Write for a C-suite / board audience: concise, decision-oriented, quantified. ' +
      'Lead with the headline, name the 1–2 items needing attention, and end with a recommended action. Never invent numbers.',
    build: (v, ctx) =>
      `Produce an executive summary for ${v.entity ?? 'the enterprise'} covering the period ${v.period ?? 'the current quarter'}.` +
      ground(ctx),
  },

  kpiAnalysis: {
    id: 'kpiAnalysis',
    version: '1.1.0',
    system:
      'You are a KPI performance analyst. Explain attainment vs target, trend direction, ' +
      'and the drivers behind the movement. Flag KPIs breaching thresholds. Be specific and numeric.',
    build: (v, ctx) =>
      `Analyze the following KPI(s): ${JSON.stringify(v.kpis)}. Targets and thresholds are included.` +
      ground(ctx),
  },

  riskPrediction: {
    id: 'riskPrediction',
    version: '1.0.0',
    system:
      'You are an enterprise risk analyst. Assess likelihood×impact, identify emerging/escalating risks, ' +
      'and propose mitigations with owners. Distinguish inherent vs residual risk.',
    build: (v, ctx) =>
      `Given the risk register and KRI trends, identify the top emerging risks for ${v.horizon ?? 'the next quarter'} and recommend mitigations.` +
      ground(ctx),
  },

  forecast: {
    id: 'forecast',
    version: '1.0.0',
    system:
      'You are a forecasting analyst. Produce a point estimate with a confidence interval and state your assumptions and confidence level. Do not fabricate precision.',
    build: (v, ctx) =>
      `Forecast ${v.metric} for ${v.horizon} using the historical series and any leading indicators provided.` +
      ground(ctx),
  },

  rootCause: {
    id: 'rootCause',
    version: '1.0.0',
    system:
      'You are a root-cause analyst. Use structured reasoning (e.g. 5-whys / driver decomposition). ' +
      'Separate correlation from likely causation and quantify each driver\'s contribution where possible.',
    build: (v, ctx) => `Perform root-cause analysis for: ${v.observation}.` + ground(ctx),
  },

  boardNarrative: {
    id: 'boardNarrative',
    version: '1.0.0',
    system:
      'You are drafting a board-ready narrative. Formal register, structured sections ' +
      '(Performance, Delivery, Risk, Decisions Required). Every claim must trace to the grounded data.',
    build: (v, ctx) =>
      `Draft the ${v.reportType ?? 'quarterly board'} narrative for ${v.entity ?? 'the organization'}.` +
      ground(ctx),
  },
};

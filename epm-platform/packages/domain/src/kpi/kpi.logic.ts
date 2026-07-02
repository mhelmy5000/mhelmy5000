/**
 * KPI domain core — pure, framework-free business logic.
 *
 * This is the single source of truth for how a KPI's performance is judged:
 * attainment, RAG (red/amber/green) status, and weighted scorecard rollups.
 * It has zero dependencies (no Nest, no Prisma) so it can be unit-tested in
 * isolation and reused by the API, background jobs, and reports alike.
 */

export type KpiDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'TARGET_IS_BEST';
export type RagStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'NOT_STARTED';

export interface KpiThresholds {
  /** Value at/above (or at/below, per direction) which the KPI is green. */
  green?: number | null;
  /** Value at/below (or at/above) which the KPI is red. */
  red?: number | null;
}

export interface KpiEvaluationInput {
  actual: number | null | undefined;
  target: number | null | undefined;
  direction: KpiDirection;
  thresholds?: KpiThresholds;
}

export interface KpiEvaluation {
  /** 0..1+ ratio (1 = target met). Null when it can't be computed. */
  attainment: number | null;
  /** Attainment as a rounded percentage for display. */
  attainmentPct: number | null;
  status: RagStatus;
}

const clampNonNeg = (n: number): number => (n < 0 ? 0 : n);

/**
 * Attainment as a ratio where 1.0 means "target met".
 * - HIGHER_IS_BETTER: actual / target
 * - LOWER_IS_BETTER:  target / actual  (lower actual → higher attainment)
 * - TARGET_IS_BEST:   1 - |actual - target| / target  (peak at the target)
 */
export function computeAttainment(input: KpiEvaluationInput): number | null {
  const { actual, target, direction } = input;
  if (actual == null || target == null) return null;
  if (target === 0) {
    // Avoid divide-by-zero: only "lower is better" has a sensible answer at 0.
    if (direction === 'LOWER_IS_BETTER') return actual <= 0 ? 1 : 0;
    return null;
  }
  switch (direction) {
    case 'HIGHER_IS_BETTER':
      return clampNonNeg(actual / target);
    case 'LOWER_IS_BETTER':
      return actual <= 0 ? 1 : clampNonNeg(target / actual);
    case 'TARGET_IS_BEST':
      return clampNonNeg(1 - Math.abs(actual - target) / Math.abs(target));
  }
}

/**
 * RAG status. Uses explicit thresholds when provided; otherwise derives sensible
 * defaults from attainment (green ≥ 95% of target, red < 85%). Direction is
 * respected so "lower is better" KPIs are judged the right way round.
 */
export function evaluateRag(input: KpiEvaluationInput): RagStatus {
  const { actual, target, direction, thresholds } = input;
  if (actual == null) return 'NOT_STARTED';
  if (target == null) return 'NOT_STARTED';

  const g = thresholds?.green;
  const r = thresholds?.red;

  if (g != null && r != null) {
    if (direction === 'LOWER_IS_BETTER') {
      if (actual <= g) return 'ON_TRACK';
      if (actual >= r) return 'OFF_TRACK';
      return 'AT_RISK';
    }
    // HIGHER_IS_BETTER (and a reasonable default for TARGET_IS_BEST bands)
    if (actual >= g) return 'ON_TRACK';
    if (actual <= r) return 'OFF_TRACK';
    return 'AT_RISK';
  }

  // Threshold-free fallback: judge by attainment against the target.
  const att = computeAttainment(input);
  if (att == null) return 'NOT_STARTED';
  if (att >= 0.95) return 'ON_TRACK';
  if (att >= 0.85) return 'AT_RISK';
  return 'OFF_TRACK';
}

export function evaluateKpi(input: KpiEvaluationInput): KpiEvaluation {
  const attainment = computeAttainment(input);
  return {
    attainment,
    attainmentPct: attainment == null ? null : Math.round(attainment * 100),
    status: evaluateRag(input),
  };
}

export interface WeightedItem {
  weight?: number | null;
  attainment: number | null;
}

/**
 * Weighted scorecard rollup: the weighted mean of item attainments, ignoring
 * items that have no measurement yet. Returns null when nothing is measurable.
 */
export function weightedScore(items: WeightedItem[]): number | null {
  let num = 0;
  let den = 0;
  for (const it of items) {
    if (it.attainment == null) continue;
    const w = it.weight == null || it.weight <= 0 ? 1 : it.weight;
    num += it.attainment * w;
    den += w;
  }
  return den === 0 ? null : num / den;
}

export interface Measurement {
  periodStart: string | Date;
  actual: number;
}

/** Sorts measurements ascending and returns the actual values (the trend series). */
export function trendSeries(measurements: Measurement[]): number[] {
  return [...measurements]
    .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
    .map((m) => m.actual);
}

/** The most recent actual, or null if there are no measurements. */
export function latestActual(measurements: Measurement[]): number | null {
  if (measurements.length === 0) return null;
  const sorted = [...measurements].sort(
    (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
  );
  return sorted[0].actual;
}

/**
 * Naive linear-trend forecast (least-squares slope) for a quick next-period
 * projection. Real forecasting is delegated to the AI layer; this is the cheap,
 * deterministic baseline used for sparkline projections and sanity checks.
 */
export function linearForecast(series: number[], periodsAhead = 1): number | null {
  const n = series.length;
  if (n < 2) return n === 1 ? series[0] : null;
  const xs = series.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = series.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (series[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return intercept + slope * (n - 1 + periodsAhead);
}

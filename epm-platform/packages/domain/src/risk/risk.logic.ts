/**
 * Risk / KRI domain core — pure, framework-free.
 *
 * Single source of truth for how enterprise risk is scored and classified:
 * likelihood × impact scoring, severity bands, risk-appetite breaches, KRI
 * threshold breaches, heat-map cell classification and register aggregation.
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

/** 5×5 score = likelihood × impact, clamped to the 1..5 rating scale. */
export function riskScore(likelihood: number, impact: number): number {
  const l = clampRating(likelihood);
  const i = clampRating(impact);
  return l * i;
}

/**
 * Severity band for a 1..25 score:
 *  CRITICAL ≥ 15 · HIGH 10–14 · MODERATE 5–9 · LOW < 5.
 */
export function riskLevel(score: number): RiskLevel {
  if (score >= 15) return 'CRITICAL';
  if (score >= 10) return 'HIGH';
  if (score >= 5) return 'MODERATE';
  return 'LOW';
}

/** True when residual score exceeds the tolerated appetite threshold. */
export function appetiteBreached(score: number, appetite: number | null | undefined): boolean {
  if (appetite == null) return false;
  return score > appetite;
}

/**
 * Residual-risk reduction achieved by mitigations, as a percentage of the
 * inherent score. Null when inherent isn't known.
 */
export function residualReduction(
  inherent: number | null | undefined,
  residual: number | null | undefined,
): number | null {
  if (inherent == null || residual == null || inherent === 0) return null;
  return Math.round(((inherent - residual) / inherent) * 100);
}

export type KriDirection = 'HIGHER_IS_WORSE' | 'LOWER_IS_WORSE';

/**
 * KRI breach test. By default a higher reading is worse (breach when current ≥
 * threshold); flip for indicators where a low reading is the danger.
 */
export function kriBreached(
  current: number | null | undefined,
  threshold: number | null | undefined,
  direction: KriDirection = 'HIGHER_IS_WORSE',
): boolean {
  if (current == null || threshold == null) return false;
  return direction === 'HIGHER_IS_WORSE' ? current >= threshold : current <= threshold;
}

export interface HeatCell {
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
}

/** Classifies a single heat-map cell. */
export function heatCell(likelihood: number, impact: number): HeatCell {
  const score = riskScore(likelihood, impact);
  return { likelihood, impact, score, level: riskLevel(score) };
}

/** Full 5×5 grid, row 5 (highest likelihood) first — display order. */
export function heatGrid(): HeatCell[][] {
  const rows: HeatCell[][] = [];
  for (let l = 5; l >= 1; l--) {
    const row: HeatCell[] = [];
    for (let i = 1; i <= 5; i++) row.push(heatCell(l, i));
    rows.push(row);
  }
  return rows;
}

export interface RiskInput {
  likelihood: number;
  impact: number;
  inherentScore?: number | null;
  residualScore?: number | null;
  appetite?: number | null;
}

export interface RiskEvaluation {
  score: number;
  level: RiskLevel;
  appetiteBreached: boolean;
  residualReductionPct: number | null;
}

export function evaluateRisk(r: RiskInput): RiskEvaluation {
  const score = r.residualScore ?? riskScore(r.likelihood, r.impact);
  return {
    score,
    level: riskLevel(score),
    appetiteBreached: appetiteBreached(score, r.appetite),
    residualReductionPct: residualReduction(r.inherentScore, r.residualScore),
  };
}

export interface RiskAggregate {
  total: number;
  byLevel: Record<RiskLevel, number>;
  breaches: number;
  /** Ids/keys of the highest-scoring risks, most severe first. */
  topRiskOrder: { key: string; score: number; level: RiskLevel }[];
}

/** Aggregates a register into RAG counts + a severity-ranked order. */
export function aggregateRisks(
  risks: (RiskInput & { key: string })[],
): RiskAggregate {
  const byLevel: Record<RiskLevel, number> = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
  let breaches = 0;
  const scored = risks.map((r) => {
    const ev = evaluateRisk(r);
    byLevel[ev.level] += 1;
    if (ev.appetiteBreached) breaches += 1;
    return { key: r.key, score: ev.score, level: ev.level };
  });
  scored.sort((a, b) => b.score - a.score);
  return { total: risks.length, byLevel, breaches, topRiskOrder: scored };
}

function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

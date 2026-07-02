/**
 * Portfolio domain core — pure, framework-free.
 *
 * Investment prioritization: value/risk quadrant classification, value-to-risk
 * ratio, a prioritization score for ranking demand, and portfolio-level rollups
 * used by the matrix and summary views.
 */

export type Quadrant = 'PRIORITIZE' | 'STRATEGIC_BET' | 'QUICK_WIN' | 'RECONSIDER';

export interface PortfolioItemInput {
  /** Strategic value 0..10 (matrix Y). */
  value: number;
  /** Execution risk 0..10 (matrix X). */
  risk: number;
  budget?: number | null;
}

/**
 * Assigns the value/risk quadrant relative to a midpoint (default 5 on a 0..10
 * scale):
 *   high value + low risk  → PRIORITIZE   (do first)
 *   high value + high risk → STRATEGIC_BET (govern closely)
 *   low value  + low risk  → QUICK_WIN
 *   low value  + high risk → RECONSIDER   (candidate to cut)
 */
export function quadrant(value: number, risk: number, midpoint = 5): Quadrant {
  const highValue = value >= midpoint;
  const lowRisk = risk < midpoint;
  if (highValue && lowRisk) return 'PRIORITIZE';
  if (highValue && !lowRisk) return 'STRATEGIC_BET';
  if (!highValue && lowRisk) return 'QUICK_WIN';
  return 'RECONSIDER';
}

/** Value delivered per unit of risk; higher is better. Guards divide-by-zero. */
export function valueToRiskRatio(value: number, risk: number): number {
  if (risk <= 0) return value; // no risk → ratio is just the value
  return value / risk;
}

/**
 * Prioritization score for ranking demand: rewards value, penalizes risk, and
 * gives a mild efficiency bonus for smaller budgets. Returns a 0..100-ish score.
 */
export function prioritizationScore(item: PortfolioItemInput): number {
  const value = clamp01to10(item.value);
  const risk = clamp01to10(item.risk);
  const base = (value * 10) - (risk * 4); // value-weighted, risk-penalized
  const budget = item.budget ?? 0;
  const efficiency = budget > 0 ? Math.min(10, 400 / budget) : 5; // cheaper → higher
  return Math.round(Math.max(0, base + efficiency));
}

export interface PortfolioSummary {
  count: number;
  totalBudget: number;
  avgValue: number | null;
  avgRisk: number | null;
  highRiskCount: number;
  byQuadrant: Record<Quadrant, number>;
}

export function summarize(items: PortfolioItemInput[], midpoint = 5): PortfolioSummary {
  const count = items.length;
  const byQuadrant: Record<Quadrant, number> = {
    PRIORITIZE: 0, STRATEGIC_BET: 0, QUICK_WIN: 0, RECONSIDER: 0,
  };
  let totalBudget = 0;
  let sumValue = 0;
  let sumRisk = 0;
  let highRiskCount = 0;
  for (const it of items) {
    totalBudget += it.budget ?? 0;
    sumValue += it.value;
    sumRisk += it.risk;
    if (it.risk > midpoint) highRiskCount += 1;
    byQuadrant[quadrant(it.value, it.risk, midpoint)] += 1;
  }
  return {
    count,
    totalBudget: round1(totalBudget),
    avgValue: count ? round1(sumValue / count) : null,
    avgRisk: count ? round1(sumRisk / count) : null,
    highRiskCount,
    byQuadrant,
  };
}

/** Ranks items best-first by prioritization score. Returns indices + scores. */
export function rankByPriority(
  items: (PortfolioItemInput & { key: string })[],
): { key: string; score: number; quadrant: Quadrant }[] {
  return items
    .map((it) => ({ key: it.key, score: prioritizationScore(it), quadrant: quadrant(it.value, it.risk) }))
    .sort((a, b) => b.score - a.score);
}

const clamp01to10 = (n: number): number => Math.max(0, Math.min(10, n));
const round1 = (n: number): number => Math.round(n * 10) / 10;

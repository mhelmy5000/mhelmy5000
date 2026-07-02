/**
 * Strategy / OKR domain core — pure, framework-free.
 *
 * Single source of truth for objective & key-result scoring, OKR/objective
 * status, and Balanced-Scorecard rollups (objective → perspective → strategy).
 */

export type ObjectiveStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'NOT_STARTED';

export interface KeyResultInput {
  startValue: number;
  currentValue: number;
  targetValue: number;
  weight?: number | null;
}

/**
 * Key-result progress as 0..100. Works for both increase and decrease goals
 * (the sign cancels): a "reduce 48→24, now 36" KR reads 50%. Clamped to 0..100.
 */
export function krProgress(start: number, current: number, target: number): number {
  if (target === start) return current >= target ? 100 : 0;
  const raw = ((current - start) / (target - start)) * 100;
  return Math.round(clamp(raw, 0, 100));
}

/** Objective score = weighted mean of its key-results' progress (0..100), or null if none. */
export function objectiveScore(krs: KeyResultInput[]): number | null {
  if (krs.length === 0) return null;
  let num = 0;
  let den = 0;
  for (const kr of krs) {
    const w = kr.weight == null || kr.weight <= 0 ? 1 : kr.weight;
    num += krProgress(kr.startValue, kr.currentValue, kr.targetValue) * w;
    den += w;
  }
  return den === 0 ? null : Math.round(num / den);
}

/**
 * Objective/OKR status using the standard OKR bands:
 *  ON_TRACK ≥ 70 · AT_RISK 40–69 · OFF_TRACK 1–39 · NOT_STARTED (null / 0).
 */
export function objectiveStatus(score: number | null | undefined): ObjectiveStatus {
  if (score == null || score <= 0) return 'NOT_STARTED';
  if (score >= 70) return 'ON_TRACK';
  if (score >= 40) return 'AT_RISK';
  return 'OFF_TRACK';
}

export interface ObjectiveRollupInput {
  progress: number | null;
  weight?: number | null;
}

/** Perspective score = weighted mean of its objectives' progress (0..100). */
export function perspectiveScore(objectives: ObjectiveRollupInput[]): number | null {
  return weightedMean(objectives.map((o) => ({ value: o.progress, weight: o.weight })));
}

export interface PerspectiveRollupInput {
  score: number | null;
  weight?: number | null;
}

/** Overall strategy score = weighted mean of perspective scores (0..100). */
export function strategyScore(perspectives: PerspectiveRollupInput[]): number | null {
  return weightedMean(perspectives.map((p) => ({ value: p.score, weight: p.weight })));
}

export interface ObjectiveAggregate {
  total: number;
  byStatus: Record<ObjectiveStatus, number>;
  averageProgress: number | null;
}

/** Counts objectives by status and reports mean progress. */
export function aggregateObjectives(
  objectives: { progress: number | null }[],
): ObjectiveAggregate {
  const byStatus: Record<ObjectiveStatus, number> = {
    ON_TRACK: 0, AT_RISK: 0, OFF_TRACK: 0, NOT_STARTED: 0,
  };
  for (const o of objectives) byStatus[objectiveStatus(o.progress)] += 1;
  return {
    total: objectives.length,
    byStatus,
    averageProgress: weightedMean(objectives.map((o) => ({ value: o.progress }))),
  };
}

function weightedMean(items: { value: number | null; weight?: number | null }[]): number | null {
  let num = 0;
  let den = 0;
  for (const it of items) {
    if (it.value == null) continue;
    const w = it.weight == null || it.weight <= 0 ? 1 : it.weight;
    num += it.value * w;
    den += w;
  }
  return den === 0 ? null : Math.round(num / den);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

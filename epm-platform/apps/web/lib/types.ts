/**
 * Shared API DTO types — mirror the NestJS responses (apps/api) and the
 * reference server. These are the contract between the Mizan web app and the
 * Mizan API; the client in `api.ts` returns exactly these shapes.
 */

export type RagStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'NOT_STARTED';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Quadrant = 'PRIORITIZE' | 'STRATEGIC_BET' | 'QUICK_WIN' | 'RECONSIDER';

// ── KPI ──
export interface KpiView {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string | null;
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

// ── Strategy / OKR ──
export interface StrategyObjective {
  id: string;
  title: string;
  progress: number | null;
  status: RagStatus;
}
export interface StrategyPerspective {
  id: string;
  name: string;
  color: string | null;
  desc?: string;
  score: number | null;
  objectives: StrategyObjective[];
}
export interface StrategyMap {
  perspectives: StrategyPerspective[];
  overall: number | null;
}
export interface KeyResultView {
  id: string;
  title: string;
  current: number;
  target: number;
  progress: number;
}
export interface OkrView {
  id: string;
  objective: string;
  owner: string | null;
  score: number | null;
  status: RagStatus;
  keyResults: KeyResultView[];
}
export interface OkrResponse {
  okrs: OkrView[];
  summary: { total: number; byStatus: Record<RagStatus, number>; averageProgress: number | null };
}

// ── Risk ──
export interface RiskView {
  code: string;
  title: string;
  owner: string | null;
  category?: string | null;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  appetite: number | null;
  appetiteBreached: boolean;
}
export interface HeatCell {
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  risks: string[];
}
export interface RiskRegister {
  risks: RiskView[];
  heatmap: HeatCell[][];
  summary: { total: number; byLevel: Record<RiskLevel, number>; appetiteBreaches: number };
}

// ── Portfolio ──
export interface PortfolioItem {
  name: string;
  value: number;
  risk: number;
  budget: number;
  quadrant: Quadrant;
  valueToRisk?: number;
}
export interface PortfolioMatrix {
  items: PortfolioItem[];
  summary: {
    count: number;
    totalBudget: number;
    avgValue: number | null;
    avgRisk: number | null;
    highRiskCount: number;
    byQuadrant: Record<Quadrant, number>;
  };
  priorityOrder: { name: string; score: number; quadrant: Quadrant }[];
}

// ── AI ──
export interface AiResult {
  text: string;
  provider: string;
  model: string;
  grounded: boolean;
  sources: unknown[];
  overallAttainmentPct?: number | null;
}

// ── Auth ──
export interface LoginResult {
  accessToken: string;
  user: { id?: string; email: string; displayName?: string; tenantId?: string; roles: string[] };
}

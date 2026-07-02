#!/usr/bin/env node
/**
 * Mizan EPM — zero-dependency reference API server.
 *
 * Mirrors the NestJS KPI + AI endpoints (apps/api/src) over Node's built-in
 * http, backed by the same seed data as prisma/seed.ts. It exists so the whole
 * request path is runnable in environments without the full NestJS/Prisma/
 * Postgres stack installed (CI sandboxes, quick demos) and so the prototype's
 * KPI Scorecard can point at *live* data.
 *
 * The evaluation logic below is a faithful, dependency-free mirror of
 * `@mizan/domain` (packages/domain/src/kpi/kpi.logic.ts) — the NestJS app imports
 * that shared package directly; this file cannot (it must run with no build).
 *
 *   Run:  node apps/api/dev-server.mjs      (PORT env optional, default 3001)
 */
import { createServer } from 'node:http';

// ── domain mirror (see packages/domain) ────────────────────────────────────
function computeAttainment({ actual, target, direction }) {
  if (actual == null || target == null) return null;
  if (target === 0) return direction === 'LOWER_IS_BETTER' ? (actual <= 0 ? 1 : 0) : null;
  const nn = (n) => (n < 0 ? 0 : n);
  if (direction === 'HIGHER_IS_BETTER') return nn(actual / target);
  if (direction === 'LOWER_IS_BETTER') return actual <= 0 ? 1 : nn(target / actual);
  return nn(1 - Math.abs(actual - target) / Math.abs(target)); // TARGET_IS_BEST
}
function evaluateRag({ actual, target, direction, thresholds }) {
  if (actual == null || target == null) return 'NOT_STARTED';
  const g = thresholds?.green, r = thresholds?.red;
  if (g != null && r != null) {
    if (direction === 'LOWER_IS_BETTER') return actual <= g ? 'ON_TRACK' : actual >= r ? 'OFF_TRACK' : 'AT_RISK';
    return actual >= g ? 'ON_TRACK' : actual <= r ? 'OFF_TRACK' : 'AT_RISK';
  }
  const att = computeAttainment({ actual, target, direction });
  if (att == null) return 'NOT_STARTED';
  return att >= 0.95 ? 'ON_TRACK' : att >= 0.85 ? 'AT_RISK' : 'OFF_TRACK';
}
function weightedScore(items) {
  let num = 0, den = 0;
  for (const it of items) {
    if (it.attainment == null) continue;
    const w = it.weight == null || it.weight <= 0 ? 1 : it.weight;
    num += it.attainment * w; den += w;
  }
  return den === 0 ? null : num / den;
}

// ── seed (mirrors prisma/seed.ts) ───────────────────────────────────────────
const KPIS = [
  { id: 'k1', code: 'STRAT-01', name: 'Strategy execution', category: 'STRATEGIC', unit: '%', direction: 'HIGHER_IS_BETTER', target: 90, tg: 90, tr: 80, weight: 3, owner: 'Strategy Office', series: [80, 82, 81, 84, 85, 86, 87] },
  { id: 'k2', code: 'CSAT-01', name: 'Customer satisfaction (CSAT)', category: 'ENTERPRISE', unit: '%', direction: 'HIGHER_IS_BETTER', target: 92, tg: 92, tr: 85, weight: 2, owner: 'Service Excellence', series: [89, 90, 91, 92, 93, 93, 94] },
  { id: 'k3', code: 'DIGI-01', name: 'Digital adoption rate', category: 'STRATEGIC', unit: '%', direction: 'HIGHER_IS_BETTER', target: 85, tg: 85, tr: 75, weight: 2, owner: 'Digital Transformation', series: [70, 72, 73, 74, 75, 77, 78] },
  { id: 'k4', code: 'FIN-01', name: 'Operating cost ratio', category: 'ENTERPRISE', unit: '%', direction: 'LOWER_IS_BETTER', target: 38, tg: 38, tr: 45, weight: 2, owner: 'Finance', series: [46, 45, 44, 43, 42, 41, 41] },
  { id: 'k5', code: 'HR-01', name: 'Employee engagement', category: 'DEPARTMENT', unit: '%', direction: 'HIGHER_IS_BETTER', target: 80, tg: 80, tr: 70, weight: 1, owner: 'People & Culture', series: [76, 78, 79, 80, 81, 82, 83] },
  { id: 'k6', code: 'OPS-01', name: 'Time-to-service', category: 'OPERATIONAL', unit: 'd', direction: 'LOWER_IS_BETTER', target: 3, tg: 3, tr: 4, weight: 1, owner: 'Operations', series: [4.1, 3.8, 3.4, 3, 2.8, 2.5, 2.4] },
];

function toView(k) {
  const actual = k.series.at(-1) ?? null;
  const attainment = computeAttainment({ actual, target: k.target, direction: k.direction });
  return {
    id: k.id, code: k.code, name: k.name, category: k.category, unit: k.unit,
    direction: k.direction, owner: k.owner, weight: k.weight, target: k.target, actual,
    attainmentPct: attainment == null ? null : Math.round(attainment * 100),
    status: evaluateRag({ actual, target: k.target, direction: k.direction, thresholds: { green: k.tg, red: k.tr } }),
    trend: k.series,
  };
}
function scorecard() {
  const items = KPIS.map(toView);
  const overall = weightedScore(items.map((i) => ({ weight: i.weight, attainment: i.attainmentPct == null ? null : i.attainmentPct / 100 })));
  const statusCounts = items.reduce((a, i) => ((a[i.status] = (a[i.status] ?? 0) + 1), a), { ON_TRACK: 0, AT_RISK: 0, OFF_TRACK: 0, NOT_STARTED: 0 });
  return { items, overallAttainmentPct: overall == null ? null : Math.round(overall * 100), statusCounts };
}

// A grounded, deterministic KPI analysis (real deployments call @mizan/ai-core;
// here there is no external key, so we synthesize from the live scorecard).
function kpiAnalysis() {
  const sc = scorecard();
  const off = sc.items.filter((i) => i.status === 'OFF_TRACK');
  const risk = sc.items.filter((i) => i.status === 'AT_RISK');
  const worst = [...sc.items].sort((a, b) => (a.attainmentPct ?? 0) - (b.attainmentPct ?? 0))[0];
  const text =
    `Overall weighted attainment is ${sc.overallAttainmentPct}%. ` +
    `${sc.statusCounts.ON_TRACK} KPI(s) on track, ${risk.length} at risk, ${off.length} off track. ` +
    (worst ? `The primary drag is "${worst.name}" at ${worst.attainmentPct}% of target — recommend a targeted intervention and a revised trajectory to close the gap.` : '');
  return { text, provider: 'reference', model: 'domain-core', grounded: true, sources: sc.items.map((i) => i.code), overallAttainmentPct: sc.overallAttainmentPct };
}

// ── risk domain mirror + seed (see packages/domain/src/risk) ────────────────
const riskScore = (l, i) => Math.max(1, Math.min(5, l)) * Math.max(1, Math.min(5, i));
const riskLevel = (s) => (s >= 15 ? 'CRITICAL' : s >= 10 ? 'HIGH' : s >= 5 ? 'MODERATE' : 'LOW');
const RISKS = [
  { code: 'R-01', title: 'Cyber breach of citizen data', owner: 'CISO', l: 4, i: 5, appetite: 8, category: 'Security' },
  { code: 'R-04', title: 'Vendor / supply concentration', owner: 'Procurement', l: 3, i: 4, appetite: 9, category: 'Operational' },
  { code: 'R-07', title: 'Talent attrition (key roles)', owner: 'CHRO', l: 4, i: 3, appetite: 9, category: 'People' },
  { code: 'R-09', title: 'Budget overrun on flagship', owner: 'CFO', l: 3, i: 3, appetite: 9, category: 'Financial' },
  { code: 'R-12', title: 'Regulatory change exposure', owner: 'Legal', l: 2, i: 4, appetite: 8, category: 'Compliance' },
  { code: 'R-15', title: 'Legacy system failure', owner: 'CIO', l: 2, i: 5, appetite: 8, category: 'Technology' },
  { code: 'R-18', title: 'Change fatigue', owner: 'PMO', l: 3, i: 2, appetite: 9, category: 'Delivery' },
];
function riskRegister() {
  const risks = RISKS.map((r) => {
    const score = riskScore(r.l, r.i);
    return { code: r.code, title: r.title, owner: r.owner, category: r.category, likelihood: r.l, impact: r.i,
      score, level: riskLevel(score), appetite: r.appetite, appetiteBreached: score > r.appetite };
  });
  const heatmap = [];
  for (let l = 5; l >= 1; l--) {
    const row = [];
    for (let i = 1; i <= 5; i++) {
      const score = riskScore(l, i);
      row.push({ likelihood: l, impact: i, score, level: riskLevel(score),
        risks: risks.filter((r) => r.likelihood === l && r.impact === i).map((r) => r.code) });
    }
    heatmap.push(row);
  }
  const byLevel = risks.reduce((a, r) => ((a[r.level] = (a[r.level] ?? 0) + 1), a), { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 });
  return { risks, heatmap, summary: { total: risks.length, byLevel, appetiteBreaches: risks.filter((r) => r.appetiteBreached).length } };
}

// ── portfolio domain mirror + seed (see packages/domain/src/portfolio) ───────
const quadrant = (v, r, m = 5) => (v >= m ? (r < m ? 'PRIORITIZE' : 'STRATEGIC_BET') : (r < m ? 'QUICK_WIN' : 'RECONSIDER'));
const prioScore = (v, r, b) => Math.round(Math.max(0, v * 10 - r * 4 + (b > 0 ? Math.min(10, 400 / b) : 5)));
const INITIATIVES = [
  { name: 'Digital Government Platform', value: 9.2, risk: 3.1, budget: 48 },
  { name: 'Smart City Program', value: 8.4, risk: 6.2, budget: 72 },
  { name: 'National Data Fabric', value: 7.8, risk: 4.6, budget: 36 },
  { name: 'Citizen Experience Overhaul', value: 6.9, risk: 2.4, budget: 22 },
  { name: 'Cloud Migration Wave 2', value: 5.6, risk: 5.8, budget: 31 },
  { name: 'AI Center of Excellence', value: 8.9, risk: 3.9, budget: 18 },
];
function portfolioMatrix() {
  const items = INITIATIVES.map((it) => ({ ...it, quadrant: quadrant(it.value, it.risk),
    valueToRisk: Math.round((it.risk <= 0 ? it.value : it.value / it.risk) * 100) / 100 }));
  const byQuadrant = items.reduce((a, i) => ((a[i.quadrant] = (a[i.quadrant] ?? 0) + 1), a), { PRIORITIZE: 0, STRATEGIC_BET: 0, QUICK_WIN: 0, RECONSIDER: 0 });
  const summary = {
    count: items.length,
    totalBudget: Math.round(items.reduce((a, i) => a + i.budget, 0) * 10) / 10,
    avgValue: Math.round((items.reduce((a, i) => a + i.value, 0) / items.length) * 10) / 10,
    avgRisk: Math.round((items.reduce((a, i) => a + i.risk, 0) / items.length) * 10) / 10,
    highRiskCount: items.filter((i) => i.risk > 5).length,
    byQuadrant,
  };
  const priorityOrder = INITIATIVES.map((i) => ({ name: i.name, score: prioScore(i.value, i.risk, i.budget), quadrant: quadrant(i.value, i.risk) }))
    .sort((a, b) => b.score - a.score);
  return { items, summary, priorityOrder };
}

// ── strategy / OKR domain mirror + seed (see packages/domain/src/strategy) ──
function krProgress(start, current, target) {
  if (target === start) return current >= target ? 100 : 0;
  return Math.round(Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100)));
}
const objectiveStatus = (s) => (s == null || s <= 0 ? 'NOT_STARTED' : s >= 70 ? 'ON_TRACK' : s >= 40 ? 'AT_RISK' : 'OFF_TRACK');
const meanRound = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

const PERSPECTIVES = [
  { id: 'p1', name: 'Financial', color: 'linear-gradient(135deg,#199e70,#22d3ee)', desc: 'Sustainable value & fiscal stewardship',
    objectives: [{ title: 'Optimize operating cost ratio', progress: 78 }, { title: 'Grow non-oil revenue', progress: 85 }, { title: 'Maximize benefit realization', progress: 83 }] },
  { id: 'p2', name: 'Customer', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', desc: 'Citizen & stakeholder experience',
    objectives: [{ title: 'Raise citizen satisfaction', progress: 94 }, { title: 'Accelerate digital adoption', progress: 78 }, { title: 'Reduce time-to-service', progress: 92 }] },
  { id: 'p3', name: 'Internal Process', color: 'linear-gradient(135deg,#c98500,#f59e0b)', desc: 'Operational & delivery excellence',
    objectives: [{ title: 'Digitize core services', progress: 82 }, { title: 'Strengthen governance', progress: 80 }, { title: 'Improve project delivery', progress: 73 }] },
  { id: 'p4', name: 'Learning & Growth', color: 'linear-gradient(135deg,#9085e9,#d55181)', desc: 'People, culture & capability',
    objectives: [{ title: 'Build data & AI capability', progress: 58 }, { title: 'Raise engagement', progress: 83 }, { title: 'Retain critical talent', progress: 82 }] },
];
function strategyMap() {
  const perspectives = PERSPECTIVES.map((p, pi) => ({
    id: p.id, name: p.name, color: p.color, desc: p.desc,
    score: meanRound(p.objectives.map((o) => o.progress)),
    objectives: p.objectives.map((o, oi) => ({ id: `${p.id}-o${oi}`, title: o.title, progress: o.progress, status: objectiveStatus(o.progress) })),
  }));
  const overall = meanRound(perspectives.map((p) => p.score));
  return { perspectives, overall };
}

const OKRS = [
  { id: 'okr1', objective: "Become the region's most trusted digital government", owner: 'H.E. the Minister', krs: [
    { title: 'Raise citizen trust index from 68 → 80', s: 68, c: 77, t: 80 },
    { title: '90% of services fully digital', s: 55, c: 84, t: 90 },
    { title: 'Reduce complaint resolution to < 48h', s: 96, c: 76, t: 48 } ] },
  { id: 'okr2', objective: 'Build a high-performance, future-ready workforce', owner: 'CHRO', krs: [
    { title: 'Upskill 5,000 staff on data & AI', s: 0, c: 2900, t: 5000 },
    { title: 'Engagement score ≥ 82', s: 76, c: 81, t: 82 },
    { title: 'Fill 95% of critical roles', s: 70, c: 84, t: 95 } ] },
];
function strategyOkrs() {
  const okrs = OKRS.map((o) => {
    const keyResults = o.krs.map((k, i) => ({ id: `${o.id}-kr${i}`, title: k.title, current: k.c, target: k.t, progress: krProgress(k.s, k.c, k.t) }));
    const score = meanRound(keyResults.map((k) => k.progress));
    return { id: o.id, objective: o.objective, owner: o.owner, score, status: objectiveStatus(score), keyResults };
  });
  const byStatus = okrs.reduce((a, o) => ((a[o.status] = (a[o.status] ?? 0) + 1), a), { ON_TRACK: 0, AT_RISK: 0, OFF_TRACK: 0, NOT_STARTED: 0 });
  return { okrs, summary: { total: okrs.length, byStatus, averageProgress: meanRound(okrs.map((o) => o.score)) } };
}

// ── http ────────────────────────────────────────────────────────────────────
const json = (res, code, body) => {
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (pathname === '/api/health') return json(res, 200, { status: 'ok', kpis: KPIS.length });
  if (pathname === '/api/auth/login' && req.method === 'POST')
    return json(res, 201, { accessToken: 'dev.reference.token', user: { email: 'minister@gov.example', roles: ['epm.admin'] } });
  if (pathname === '/api/kpis' && req.method === 'GET') return json(res, 200, KPIS.map(toView));
  if (pathname === '/api/kpis/scorecard' && req.method === 'GET') return json(res, 200, scorecard());
  if (pathname === '/api/risks/register' && req.method === 'GET') return json(res, 200, riskRegister());
  if (pathname === '/api/portfolio/matrix' && req.method === 'GET') return json(res, 200, portfolioMatrix());
  if (pathname === '/api/strategy/map' && req.method === 'GET') return json(res, 200, strategyMap());
  if (pathname === '/api/strategy/okrs' && req.method === 'GET') return json(res, 200, strategyOkrs());
  if (pathname === '/api/ai/kpi-analysis' && req.method === 'POST') return json(res, 200, kpiAnalysis());

  json(res, 404, { statusCode: 404, message: `no route for ${req.method} ${pathname}` });
});

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => console.log(`Mizan EPM reference API on http://localhost:${port}/api  (health: /api/health)`));

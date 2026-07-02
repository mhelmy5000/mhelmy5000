#!/usr/bin/env node
/**
 * Helm EPM — zero-dependency reference API server.
 *
 * Mirrors the NestJS KPI + AI endpoints (apps/api/src) over Node's built-in
 * http, backed by the same seed data as prisma/seed.ts. It exists so the whole
 * request path is runnable in environments without the full NestJS/Prisma/
 * Postgres stack installed (CI sandboxes, quick demos) and so the prototype's
 * KPI Scorecard can point at *live* data.
 *
 * The evaluation logic below is a faithful, dependency-free mirror of
 * `@helm/domain` (packages/domain/src/kpi/kpi.logic.ts) — the NestJS app imports
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

// A grounded, deterministic KPI analysis (real deployments call @helm/ai-core;
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
  if (pathname === '/api/ai/kpi-analysis' && req.method === 'POST') return json(res, 200, kpiAnalysis());

  json(res, 404, { statusCode: 404, message: `no route for ${req.method} ${pathname}` });
});

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => console.log(`Helm EPM reference API on http://localhost:${port}/api  (health: /api/health)`));

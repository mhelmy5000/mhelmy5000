import { PrismaClient } from '@prisma/client';

/**
 * Seeds a demo tenant (Ministry of Government) with roles, users, and the KPI
 * set shown in the prototype — including 7 months of measurements so RAG status
 * and trends are populated. Idempotent: safe to re-run.
 */
const prisma = new PrismaClient();

const KPIS = [
  { code: 'STRAT-01', name: 'Strategy execution', category: 'STRATEGIC', unit: '%', direction: 'HIGHER_IS_BETTER', target: 90, thresholdGreen: 90, thresholdRed: 80, weight: 3, series: [80, 82, 81, 84, 85, 86, 87] },
  { code: 'CSAT-01', name: 'Customer satisfaction (CSAT)', category: 'ENTERPRISE', unit: '%', direction: 'HIGHER_IS_BETTER', target: 92, thresholdGreen: 92, thresholdRed: 85, weight: 2, series: [89, 90, 91, 92, 93, 93, 94] },
  { code: 'DIGI-01', name: 'Digital adoption rate', category: 'STRATEGIC', unit: '%', direction: 'HIGHER_IS_BETTER', target: 85, thresholdGreen: 85, thresholdRed: 75, weight: 2, series: [70, 72, 73, 74, 75, 77, 78] },
  { code: 'FIN-01', name: 'Operating cost ratio', category: 'ENTERPRISE', unit: '%', direction: 'LOWER_IS_BETTER', target: 38, thresholdGreen: 38, thresholdRed: 45, weight: 2, series: [46, 45, 44, 43, 42, 41, 41] },
  { code: 'HR-01', name: 'Employee engagement', category: 'DEPARTMENT', unit: '%', direction: 'HIGHER_IS_BETTER', target: 80, thresholdGreen: 80, thresholdRed: 70, weight: 1, series: [76, 78, 79, 80, 81, 82, 83] },
  { code: 'OPS-01', name: 'Time-to-service', category: 'OPERATIONAL', unit: 'd', direction: 'LOWER_IS_BETTER', target: 3, thresholdGreen: 3, thresholdRed: 4, weight: 1, series: [4.1, 3.8, 3.4, 3, 2.8, 2.5, 2.4] },
];

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ministry-of-gov' },
    update: {},
    create: { slug: 'ministry-of-gov', name: 'Ministry of Government', locale: 'en', timezone: 'Asia/Riyadh' },
  });

  const adminRole = await prisma.role.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'epm.admin' } },
    update: { permissions: ['*'] },
    create: { tenantId: tenant.id, key: 'epm.admin', name: 'EPM Administrator', isSystem: true, permissions: ['*'] },
  });
  await prisma.role.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'kpi.viewer' } },
    update: { permissions: ['kpi:read'] },
    create: { tenantId: tenant.id, key: 'kpi.viewer', name: 'KPI Viewer', permissions: ['kpi:read'] },
  });
  const analystRole = await prisma.role.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'kpi.analyst' } },
    update: { permissions: ['kpi:read', 'kpi:create', 'kpi:update', 'risk:read', 'portfolio:read', 'strategy:read', 'strategy:update', 'ai:use'] },
    create: { tenantId: tenant.id, key: 'kpi.analyst', name: 'Performance Analyst', permissions: ['kpi:read', 'kpi:create', 'kpi:update', 'risk:read', 'portfolio:read', 'strategy:read', 'strategy:update', 'ai:use'] },
  });

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'minister@gov.example' } },
    update: {},
    create: { tenantId: tenant.id, email: 'minister@gov.example', displayName: 'H.E. the Minister', status: 'ACTIVE' },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  const analyst = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'analyst@gov.example' } },
    update: {},
    create: { tenantId: tenant.id, email: 'analyst@gov.example', displayName: 'Performance Analyst', status: 'ACTIVE' },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: analyst.id, roleId: analystRole.id } },
    update: {},
    create: { userId: analyst.id, roleId: analystRole.id },
  });

  for (const k of KPIS) {
    const kpi = await prisma.kpi.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: k.code } },
      update: { target: k.target, thresholdGreen: k.thresholdGreen, thresholdRed: k.thresholdRed, weight: k.weight, status: 'ACTIVE' },
      create: {
        tenantId: tenant.id, code: k.code, name: k.name, category: k.category as never,
        unit: k.unit, direction: k.direction as never, frequency: 'MONTHLY',
        weight: k.weight, target: k.target, thresholdGreen: k.thresholdGreen, thresholdRed: k.thresholdRed,
        status: 'ACTIVE', ownerId: admin.id, createdBy: admin.id,
      },
    });
    for (let i = 0; i < k.series.length; i++) {
      const periodStart = new Date(Date.UTC(2025, i, 1));
      const periodEnd = new Date(Date.UTC(2025, i + 1, 0));
      await prisma.kpiMeasurement.upsert({
        where: { kpiId_periodStart: { kpiId: kpi.id, periodStart } },
        update: { actual: k.series[i], target: k.target },
        create: { kpiId: kpi.id, periodStart, periodEnd, actual: k.series[i], target: k.target },
      });
    }
  }

  // ── Risks ──
  const RISKS = [
    { code: 'R-01', title: 'Cyber breach of citizen data', category: 'Security', l: 4, i: 5, appetite: 8, ownerId: admin.id },
    { code: 'R-04', title: 'Vendor / supply concentration', category: 'Operational', l: 3, i: 4, appetite: 9 },
    { code: 'R-07', title: 'Talent attrition (key roles)', category: 'People', l: 4, i: 3, appetite: 9 },
    { code: 'R-09', title: 'Budget overrun on flagship', category: 'Financial', l: 3, i: 3, appetite: 9 },
    { code: 'R-12', title: 'Regulatory change exposure', category: 'Compliance', l: 2, i: 4, appetite: 8 },
    { code: 'R-15', title: 'Legacy system failure', category: 'Technology', l: 2, i: 5, appetite: 8 },
    { code: 'R-18', title: 'Change fatigue', category: 'Delivery', l: 3, i: 2, appetite: 9 },
  ];
  for (const r of RISKS) {
    const score = r.l * r.i;
    await prisma.risk.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: r.code } },
      update: { likelihood: r.l, impact: r.i, inherentScore: score, residualScore: score, appetite: r.appetite },
      create: {
        tenantId: tenant.id, code: r.code, title: r.title, category: r.category,
        likelihood: r.l, impact: r.i, inherentScore: score, residualScore: score,
        appetite: r.appetite, status: 'OPEN', ownerId: r.ownerId,
      },
    });
  }

  // ── Portfolio initiatives ──
  const portfolio = await prisma.portfolio.upsert({
    where: { id: `${tenant.id}-strategic` },
    update: {},
    create: { id: `${tenant.id}-strategic`, tenantId: tenant.id, name: 'Strategic Portfolio', type: 'STRATEGIC' },
  });
  const INITIATIVES = [
    { title: 'Digital Government Platform', value: 9.2, risk: 3.1, budget: 48 },
    { title: 'Smart City Program', value: 8.4, risk: 6.2, budget: 72 },
    { title: 'National Data Fabric', value: 7.8, risk: 4.6, budget: 36 },
    { title: 'Citizen Experience Overhaul', value: 6.9, risk: 2.4, budget: 22 },
    { title: 'Cloud Migration Wave 2', value: 5.6, risk: 5.8, budget: 31 },
    { title: 'AI Center of Excellence', value: 8.9, risk: 3.9, budget: 18 },
  ];
  for (const it of INITIATIVES) {
    await prisma.initiative.upsert({
      where: { id: `${tenant.id}-${it.title}` },
      update: { strategicValue: it.value, executionRisk: it.risk, budget: it.budget },
      create: {
        id: `${tenant.id}-${it.title}`, tenantId: tenant.id, portfolioId: portfolio.id,
        title: it.title, strategicValue: it.value, executionRisk: it.risk, budget: it.budget, status: 'ON_TRACK',
      },
    });
  }

  // ── Strategy: Balanced Scorecard perspectives + objectives ──
  const PERSPECTIVES = [
    { key: 'financial', name: 'Financial', order: 1, color: 'linear-gradient(135deg,#199e70,#22d3ee)',
      objectives: [['Optimize operating cost ratio', 78], ['Grow non-oil revenue', 85], ['Maximize benefit realization', 83]] },
    { key: 'customer', name: 'Customer', order: 2, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      objectives: [['Raise citizen satisfaction', 94], ['Accelerate digital adoption', 78], ['Reduce time-to-service', 92]] },
    { key: 'process', name: 'Internal Process', order: 3, color: 'linear-gradient(135deg,#c98500,#f59e0b)',
      objectives: [['Digitize core services', 82], ['Strengthen governance', 80], ['Improve project delivery', 73]] },
    { key: 'learning', name: 'Learning & Growth', order: 4, color: 'linear-gradient(135deg,#9085e9,#d55181)',
      objectives: [['Build data & AI capability', 58], ['Raise engagement', 83], ['Retain critical talent', 82]] },
  ];
  const rag = (p: number) => (p >= 70 ? 'ON_TRACK' : p >= 40 ? 'AT_RISK' : 'OFF_TRACK');
  for (const p of PERSPECTIVES) {
    const pid = `${tenant.id}-p-${p.key}`;
    await prisma.perspective.upsert({
      where: { id: pid },
      update: { name: p.name, order: p.order, color: p.color },
      create: { id: pid, tenantId: tenant.id, name: p.name, order: p.order, color: p.color },
    });
    for (const [title, progress] of p.objectives) {
      const oid = `${tenant.id}-obj-${String(title).slice(0, 24)}`;
      await prisma.objective.upsert({
        where: { id: oid },
        update: { progress: progress as number, status: rag(progress as number) as never },
        create: {
          id: oid, tenantId: tenant.id, perspectiveId: pid, title: title as string,
          type: 'STRATEGIC', progress: progress as number, status: rag(progress as number) as never, weight: 1,
        },
      });
    }
  }

  // ── OKRs (objectives with key results) ──
  const OKRS = [
    { title: "Become the region's most trusted digital government", ownerId: admin.id, krs: [
      ['Raise citizen trust index from 68 → 80', 68, 77, 80], ['90% of services fully digital', 55, 84, 90], ['Reduce complaint resolution to < 48h', 96, 76, 48] ] },
    { title: 'Build a high-performance, future-ready workforce', ownerId: analyst.id, krs: [
      ['Upskill 5,000 staff on data & AI', 0, 2900, 5000], ['Engagement score ≥ 82', 76, 81, 82], ['Fill 95% of critical roles', 70, 84, 95] ] },
  ];
  const krPct = (s: number, c: number, t: number) => (t === s ? (c >= t ? 100 : 0) : Math.round(Math.max(0, Math.min(100, ((c - s) / (t - s)) * 100))));
  for (const o of OKRS) {
    const oid = `${tenant.id}-okr-${o.title.slice(0, 24)}`;
    const scores = o.krs.map(([, s, c, t]) => krPct(s as number, c as number, t as number));
    const objScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    await prisma.objective.upsert({
      where: { id: oid },
      update: { progress: objScore, status: rag(objScore) as never },
      create: { id: oid, tenantId: tenant.id, title: o.title, type: 'OKR', ownerId: o.ownerId, progress: objScore, status: rag(objScore) as never, weight: 1 },
    });
    for (let i = 0; i < o.krs.length; i++) {
      const [title, s, c, t] = o.krs[i];
      await prisma.keyResult.upsert({
        where: { id: `${oid}-kr${i}` },
        update: { currentValue: c as number, targetValue: t as number, progress: krPct(s as number, c as number, t as number) },
        create: { id: `${oid}-kr${i}`, objectiveId: oid, title: title as string, startValue: s as number, currentValue: c as number, targetValue: t as number, progress: krPct(s as number, c as number, t as number) },
      });
    }
  }

  console.log(
    `Seeded tenant "${tenant.name}": ${KPIS.length} KPIs, ${RISKS.length} risks, ` +
    `${INITIATIVES.length} initiatives, ${PERSPECTIVES.length} perspectives + objectives, ` +
    `${OKRS.length} OKRs, 3 roles, 2 users.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

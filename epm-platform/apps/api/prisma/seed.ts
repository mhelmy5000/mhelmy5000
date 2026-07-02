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
    update: { permissions: ['kpi:read', 'kpi:create', 'kpi:update', 'risk:read', 'portfolio:read', 'ai:use'] },
    create: { tenantId: tenant.id, key: 'kpi.analyst', name: 'Performance Analyst', permissions: ['kpi:read', 'kpi:create', 'kpi:update', 'risk:read', 'portfolio:read', 'ai:use'] },
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

  console.log(
    `Seeded tenant "${tenant.name}": ${KPIS.length} KPIs, ${RISKS.length} risks, ` +
    `${INITIATIVES.length} initiatives, 3 roles, 2 users.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

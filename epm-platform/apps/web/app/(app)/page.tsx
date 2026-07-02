'use client';

import { Sparkles, Compass, BarChart3, Briefcase, TriangleAlert, Download } from 'lucide-react';
import { useScorecard, useRiskRegister, usePortfolioMatrix, useStrategyMap } from '@/hooks/use-queries';
import { Card, CardTitle, PageHeader, StatTile, Bar } from '@/components/ui/primitives';
import { compact } from '@/lib/format';

export default function DashboardPage() {
  const sc = useScorecard();
  const risk = useRiskRegister();
  const pf = usePortfolioMatrix();
  const strat = useStrategyMap();

  const onTarget = sc.data ? sc.data.statusCounts.ON_TRACK : 0;
  const total = sc.data?.items.length ?? 0;
  const critical = risk.data?.summary.byLevel.CRITICAL ?? 0;

  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Enterprise performance at a glance — strategy, delivery and risk for the Ministry of Government, FY2026 Q2."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold">
              <Download className="h-4 w-4" /> Board pack
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_22px_-8px_rgba(99,102,241,0.7)]">
              <Sparkles className="h-4 w-4" /> Ask AI
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={<Compass className="h-5 w-5" />} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
          label="Strategy execution" value={strat.data?.overall != null ? `${strat.data.overall}` : '—'} unit="%"
          delta="3.1 pts vs last quarter" deltaGood />
        <StatTile icon={<BarChart3 className="h-5 w-5" />} gradient="linear-gradient(135deg,#199e70,#22d3ee)"
          label="KPIs on target" value={`${onTarget}/${total}`} delta="improved QoQ" deltaGood />
        <StatTile icon={<Briefcase className="h-5 w-5" />} gradient="linear-gradient(135deg,#c98500,#f59e0b)"
          label="Portfolio budget" value={pf.data ? `$${compact(pf.data.summary.totalBudget * 1_000_000)}` : '—'}
          delta="6 programs active" deltaGood />
        <StatTile icon={<TriangleAlert className="h-5 w-5" />} gradient="linear-gradient(135deg,#d03b3b,#ec835a)"
          label="Critical risks" value={`${critical}`} delta="1 escalated" deltaGood={false} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-line-2" >
          <CardTitle
            title={<span className="flex items-center gap-2"><Sparkles className="h-[18px] w-[18px] text-brand-2" /> AI Executive Summary</span>}
            sub="Auto-generated · grounded on live enterprise data"
            right={<span className="pill pill-n">Claude Opus 4.8</span>}
          />
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            Overall enterprise performance is <strong className="text-good">trending positive (+3.1 pts QoQ)</strong>,
            led by customer satisfaction and employee engagement. Two watch items:{' '}
            <strong className="text-ink-1">digital adoption (78% vs 85% target)</strong> is the primary drag on the
            Customer perspective, and <strong className="text-critical">the cyber-breach risk (R-01) is in the critical
            zone</strong>. Recommended action: reallocate $2M contingency to adoption enablement and approve the R-01
            mitigation plan.
          </p>
        </Card>

        <Card>
          <CardTitle title="Top risks requiring attention" sub="Ranked by residual exposure" />
          {(risk.data?.risks ?? []).slice(0, 4).map((r) => (
            <div key={r.code} className="flex items-center justify-between border-b border-line py-2.5 text-[12.5px] last:border-0">
              <span className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.level === 'CRITICAL' ? 'var(--critical)' : r.level === 'HIGH' ? 'var(--warning)' : 'var(--good)' }} />
                {r.title}
              </span>
              <span className={`pill ${r.score >= 15 ? 'pill-r' : r.score >= 8 ? 'pill-w' : 'pill-g'}`}>{r.score}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle title="Enterprise performance index" sub="Weighted KPI attainment across all perspectives" />
        {sc.data && (
          <div className="flex items-center gap-4">
            <div className="text-[34px] font-bold tracking-tight">{sc.data.overallAttainmentPct}%</div>
            <div className="flex-1"><Bar pct={sc.data.overallAttainmentPct} gradient /></div>
          </div>
        )}
      </Card>
    </>
  );
}

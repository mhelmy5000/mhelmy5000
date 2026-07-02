'use client';

import { usePortfolioMatrix } from '@/hooks/use-queries';
import { Card, CardTitle, PageHeader, SourceBadge } from '@/components/ui/primitives';
import type { Quadrant } from '@/lib/types';

const QUAD_LABEL: Record<Quadrant, string> = {
  PRIORITIZE: 'Prioritize', STRATEGIC_BET: 'Strategic bet', QUICK_WIN: 'Quick win', RECONSIDER: 'Reconsider',
};
const SERIES = ['--c1', '--c4', '--c2', '--c3', '--c6', '--c5'];

export default function PortfolioPage() {
  const { data, isLoading, isError } = usePortfolioMatrix();
  const items = data?.items ?? [];
  const W = 620, H = 380, m = { t: 20, r: 24, b: 40, l: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = (v: number) => m.l + (v / 10) * iw;
  const y = (v: number) => m.t + ih - (v / 10) * ih;

  return (
    <>
      <PageHeader
        title="Portfolio"
        badge={<SourceBadge isLoading={isLoading} isError={isError} note={data ? `$${data.summary.totalBudget}M` : undefined} />}
        subtitle="Strategic investment portfolio by value vs. execution risk (bubble size = budget). Quadrants & prioritization from @mizan/domain."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Value / Risk matrix" sub="Strategic value (y) vs execution risk (x) · size = budget ($M)" />
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 1, 2, 3, 4, 5].map((g) => (
              <g key={g}>
                <line x1={m.l + (iw / 5) * g} y1={m.t} x2={m.l + (iw / 5) * g} y2={m.t + ih} stroke="var(--line)" />
                <line x1={m.l} y1={m.t + (ih / 5) * g} x2={m.l + iw} y2={m.t + (ih / 5) * g} stroke="var(--line)" />
              </g>
            ))}
            <rect x={m.l} y={m.t} width={iw / 2} height={ih / 2} fill="var(--good)" opacity={0.06} />
            <text x={m.l + iw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--ink-3)">Execution risk →</text>
            <text x={14} y={m.t + ih / 2} textAnchor="middle" fontSize={11} fill="var(--ink-3)" transform={`rotate(-90 14 ${m.t + ih / 2})`}>Strategic value →</text>
            {items.map((it, i) => (
              <circle key={it.name} cx={x(it.risk)} cy={y(it.value)} r={8 + it.budget / 6}
                fill={`var(${SERIES[i % SERIES.length]})`} opacity={0.82} stroke="var(--surface)" strokeWidth={2}>
                <title>{`${it.name} — value ${it.value}, risk ${it.risk}, $${it.budget}M`}</title>
              </circle>
            ))}
          </svg>
        </Card>

        <Card>
          <CardTitle title="Portfolio summary" sub="FY2026 investment" />
          {data && (
            <div className="text-[12.5px]">
              {[
                ['Total budget', `$${data.summary.totalBudget}M`],
                ['Programs', `${data.summary.count}`],
                ['Avg strategic value', `${data.summary.avgValue}/10`],
                ['High-risk programs', `${data.summary.highRiskCount}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line py-2.5 last:border-0">
                  <span className="text-ink-2">{k}</span><b>{v}</b>
                </div>
              ))}
              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-3">Top priority (by score)</div>
              {data.priorityOrder.slice(0, 4).map((p) => (
                <div key={p.name} className="flex items-center justify-between py-1.5 text-[12.5px]">
                  <span className="text-ink-1">{p.name}</span>
                  <span className="pill pill-n">{QUAD_LABEL[p.quadrant]} · {p.score}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

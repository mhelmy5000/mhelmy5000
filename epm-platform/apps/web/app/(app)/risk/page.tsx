'use client';

import { Fragment } from 'react';
import { useRiskRegister } from '@/hooks/use-queries';
import { Card, CardTitle, PageHeader, SourceBadge } from '@/components/ui/primitives';
import type { RiskLevel } from '@/lib/types';

const levelColor = (l: RiskLevel) =>
  l === 'CRITICAL' ? 'var(--critical)' : l === 'HIGH' ? 'var(--serious)' : l === 'MODERATE' ? 'var(--warning)' : 'var(--good)';

export default function RiskPage() {
  const { data, isLoading, isError } = useRiskRegister();
  const heatmap = data?.heatmap ?? [];

  return (
    <>
      <PageHeader
        title="Risk & KRIs"
        badge={<SourceBadge isLoading={isLoading} isError={isError} note={data ? `${data.summary.byLevel.CRITICAL} critical` : undefined} />}
        subtitle="Enterprise risk heat map (5×5 residual exposure) with Key Risk Indicators — scored and classified by @mizan/domain."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Residual risk heat map" sub="Colour = likelihood × impact · badge = risks in cell" />
          <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1.5">
            <div />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`h${i}`} className="grid place-items-center text-[10.5px] font-bold text-ink-3">Impact {i}</div>
            ))}
            {heatmap.map((row) => (
              <Fragment key={`row-${row[0]?.likelihood}`}>
                <div className="grid place-items-center text-[10.5px] font-bold text-ink-3">L{row[0]?.likelihood}</div>
                {row.map((cell) => (
                  <div
                    key={`${cell.likelihood}-${cell.impact}`}
                    className="relative grid aspect-[1.6/1] place-items-center rounded-lg text-[11px] font-bold text-[#0a0a12]"
                    style={{ background: levelColor(cell.level) }}
                    title={cell.risks.join(', ') || 'No risks in this cell'}
                  >
                    {cell.score}
                    {cell.risks.length > 0 && (
                      <span className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-[9px] font-bold text-white">
                        {cell.risks.length}
                      </span>
                    )}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle title="Risk register" sub="Top exposures & owners" />
          {(data?.risks ?? []).map((r) => (
            <div key={r.code} className="flex items-center justify-between border-b border-line py-2.5 text-[12.5px] last:border-0">
              <span>
                <b className="text-ink-1">{r.code}</b> · {r.title}
                {r.appetiteBreached && <span className="pill pill-r ml-1.5 !px-1.5 !py-0.5 !text-[9px]">over appetite</span>}
                <br />
                <small className="text-ink-3">{r.owner ?? '—'}</small>
              </span>
              <span className={`pill ${r.score >= 15 ? 'pill-r' : r.score >= 8 ? 'pill-w' : 'pill-g'}`}>{r.score}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

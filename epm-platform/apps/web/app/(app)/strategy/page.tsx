'use client';

import { useStrategyMap } from '@/hooks/use-queries';
import { PageHeader, SourceBadge } from '@/components/ui/primitives';
import { ragColorVar } from '@/lib/format';

export default function StrategyPage() {
  const { data, isLoading, isError } = useStrategyMap();
  return (
    <>
      <PageHeader
        title="Strategy Map — Balanced Scorecard"
        badge={<SourceBadge isLoading={isLoading} isError={isError} note={data?.overall != null ? `${data.overall}% overall` : undefined} />}
        subtitle="National strategy 2026–2030 cascaded across the four perspectives. Perspective % and objective health are rolled up by @mizan/domain."
      />
      <div className="flex flex-col gap-3.5">
        {(data?.perspectives ?? []).map((p) => (
          <div key={p.id} className="grid grid-cols-1 gap-3.5 md:grid-cols-[180px_1fr]">
            <div className="relative flex flex-col justify-center overflow-hidden rounded-xl p-4 text-white" style={{ background: p.color ?? 'var(--brand-grad)' }}>
              <span className="absolute right-3.5 top-3 rounded-full bg-white/20 px-2 py-0.5 text-xs font-extrabold">{p.score ?? '—'}%</span>
              <h4 className="pr-12 text-[15px] font-bold">{p.name}</h4>
              {p.desc && <p className="mt-1 text-[11.5px] opacity-90">{p.desc}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              {p.objectives.map((o) => (
                <div key={o.id} className="min-w-[170px] flex-1 rounded-xl border border-line bg-surface-2 p-3.5 transition hover:-translate-y-0.5 hover:border-line-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold text-ink-1">{o.title}</span>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `var(${ragColorVar(o.status)})` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
                    <span>Attainment</span>
                    <span className="font-bold text-ink-1">{o.progress == null ? '—' : `${o.progress}%`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

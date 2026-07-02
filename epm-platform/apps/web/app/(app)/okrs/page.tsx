'use client';

import { Target } from 'lucide-react';
import { useOkrs } from '@/hooks/use-queries';
import { PageHeader, Bar, SourceBadge } from '@/components/ui/primitives';

const scoreColor = (s: number) => (s >= 70 ? '--good' : s >= 40 ? '--warning' : '--critical');

export default function OkrsPage() {
  const { data, isLoading, isError } = useOkrs();
  return (
    <>
      <PageHeader
        title="OKRs & Goals"
        badge={<SourceBadge isLoading={isLoading} isError={isError} note={data?.summary.averageProgress != null ? `avg ${data.summary.averageProgress}%` : undefined} />}
        subtitle="Objectives and Key Results aligned top-down from the ministerial vision. Scores roll up from key-result progress via @mizan/domain."
      />
      <div className="flex flex-col gap-3.5">
        {(data?.okrs ?? []).map((o) => (
          <div key={o.id} className="card p-4">
            <div className="mb-3.5 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-white"><Target className="h-4 w-4" /></div>
              <div>
                <div className="text-[14.5px] font-bold">{o.objective}</div>
                <div className="text-[11.5px] text-ink-3">Owner: {o.owner ?? '—'} · {o.keyResults.length} key results</div>
              </div>
              <div className="ml-auto text-xl font-extrabold" style={{ color: `var(${scoreColor(o.score ?? 0)})` }}>{o.score ?? '—'}%</div>
            </div>
            {o.keyResults.map((k) => (
              <div key={k.id} className="grid grid-cols-[1fr_130px_54px] items-center gap-3.5 border-t border-dashed border-line py-2.5">
                <div className="text-[12.5px] text-ink-2">{k.title}</div>
                <Bar pct={k.progress} colorVar={scoreColor(k.progress)} />
                <div className="text-right text-xs font-bold">{k.progress}%</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

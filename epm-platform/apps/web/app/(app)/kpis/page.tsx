'use client';

import { Sparkles, Plus } from 'lucide-react';
import { useScorecard } from '@/hooks/use-queries';
import { Card, PageHeader, Bar, Sparkline, RagBadge, SourceBadge } from '@/components/ui/primitives';
import { ragColorVar } from '@/lib/format';

const unitSuffix = (u: string | null) => (u === '%' ? '%' : u === 'd' ? 'd' : '');

export default function KpisPage() {
  const { data, isLoading, isError } = useScorecard();

  return (
    <>
      <PageHeader
        title="KPI Scorecards"
        badge={<SourceBadge isLoading={isLoading} isError={isError} note={data ? `overall ${data.overallAttainmentPct}%` : undefined} />}
        subtitle="Enterprise KPI library with targets, thresholds, weighting and RAG status — evaluated by the shared @mizan/domain core."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-xl border border-line-2 bg-surface px-4 py-2.5 text-[13px] font-semibold">
              <Sparkles className="h-4 w-4" /> Analyze KPIs
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white">
              <Plus className="h-4 w-4" /> New KPI
            </button>
          </>
        }
      />

      <Card className="p-2">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-ink-3">
              <th className="border-b border-line px-3 pb-3 text-left font-semibold">KPI</th>
              <th className="border-b border-line px-3 pb-3 text-left font-semibold">Owner</th>
              <th className="border-b border-line px-3 pb-3 text-right font-semibold">Actual</th>
              <th className="border-b border-line px-3 pb-3 text-right font-semibold">Target</th>
              <th className="border-b border-line px-3 pb-3 text-left font-semibold">Attainment</th>
              <th className="border-b border-line px-3 pb-3 text-left font-semibold">Trend</th>
              <th className="border-b border-line px-3 pb-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((k) => (
              <tr key={k.id} className="transition-colors hover:bg-surface-2">
                <td className="border-b border-line px-3 py-3 font-semibold text-ink-1">{k.name}</td>
                <td className="border-b border-line px-3 py-3 text-ink-2">{k.owner ?? '—'}</td>
                <td className="border-b border-line px-3 py-3 text-right font-bold text-ink-1">{k.actual ?? '—'}{unitSuffix(k.unit)}</td>
                <td className="border-b border-line px-3 py-3 text-right text-ink-2">{k.target ?? '—'}{unitSuffix(k.unit)}</td>
                <td className="border-b border-line px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Bar pct={k.attainmentPct} colorVar={ragColorVar(k.status)} />
                    <span className="text-[11.5px] font-bold text-ink-2">{k.attainmentPct == null ? '—' : `${k.attainmentPct}%`}</span>
                  </div>
                </td>
                <td className="border-b border-line px-3 py-3"><Sparkline data={k.trend} colorVar={ragColorVar(k.status)} /></td>
                <td className="border-b border-line px-3 py-3"><RagBadge status={k.status} /></td>
              </tr>
            ))}
            {isError && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-ink-3">API offline — start the Mizan API (or reference server) to load KPIs.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

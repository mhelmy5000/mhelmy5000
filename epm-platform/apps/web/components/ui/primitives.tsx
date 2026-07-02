import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { RagStatus } from '@/lib/types';
import { ragPill, ragColorVar } from '@/lib/format';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('card p-5', className)}>{children}</div>;
}

export function CardTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[14.5px] font-bold text-ink-1">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function RagBadge({ status }: { status: RagStatus }) {
  const { cls, label } = ragPill(status);
  return <span className={clsx('pill', cls)}>{label}</span>;
}

/** A thin attainment/progress bar coloured by RAG (or the brand gradient). */
export function Bar({ pct, colorVar, gradient }: { pct: number | null; colorVar?: string; gradient?: boolean }) {
  const w = pct == null ? 0 : Math.min(100, Math.max(0, pct));
  return (
    <div className="h-[7px] min-w-[80px] flex-1 overflow-hidden rounded-md bg-surface-2">
      <div
        className="h-full rounded-md"
        style={{ width: `${w}%`, background: gradient ? 'var(--brand-grad)' : `var(${colorVar ?? '--brand-1'})` }}
      />
    </div>
  );
}

/** Inline SVG sparkline (no chart lib) — mirrors the prototype. */
export function Sparkline({ data, colorVar = '--brand-1', w = 78, h = 26 }: { data: number[]; colorVar?: string; w?: number; h?: number }) {
  if (!data?.length) return null;
  const mx = Math.max(...data), mn = Math.min(...data), r = mx - mn || 1;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - 2 - ((v - mn) / r) * (h - 4);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const stroke = `var(${colorVar})`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="align-middle">
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.6} fill={stroke} />
    </svg>
  );
}

export function StatTile({
  label, value, unit, gradient, delta, deltaGood, icon,
}: {
  label: string; value: string; unit?: string; gradient: string;
  delta?: string; deltaGood?: boolean; icon: ReactNode;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: gradient }}>
          {icon}
        </div>
      </div>
      <div className="mt-3.5 text-[12.5px] font-semibold text-ink-2">{label}</div>
      <div className="mt-0.5 text-[30px] font-bold leading-none tracking-tight">
        {value}
        {unit && <span className="ml-0.5 text-[15px] font-semibold text-ink-2">{unit}</span>}
      </div>
      {delta && (
        <div className={clsx('mt-2 text-[12.5px] font-bold', deltaGood ? 'text-good' : 'text-critical')}>
          {deltaGood ? '▲' : '▼'} {delta}
        </div>
      )}
    </Card>
  );
}

export function PageHeader({ title, subtitle, badge, actions }: { title: string; subtitle?: string; badge?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          {title} {badge}
        </h2>
        {subtitle && <p className="mt-1 max-w-[70ch] text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Data-source badge: “Live API” when loaded, else a loading/offline state. */
export function SourceBadge({ isLoading, isError, note }: { isLoading: boolean; isError: boolean; note?: string }) {
  if (isLoading) return <span className="pill pill-n">Loading…</span>;
  if (isError) return <span className="pill pill-n">API offline</span>;
  return <span className="pill pill-g">Live API{note ? ` · ${note}` : ''}</span>;
}

export { ragColorVar };

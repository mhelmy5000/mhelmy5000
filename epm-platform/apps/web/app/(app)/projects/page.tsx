'use client';
import { PageHeader } from '@/components/ui/primitives';
export default function Page() {
  return (
    <>
      <PageHeader title="Projects & PMO" subtitle="Delivery portfolio with stage-gate status, schedule, budget and RAG health." badge={<span className="pill pill-n">Phase 3</span>} />
      <div className="card p-8 text-center text-ink-3">
        This module is scaffolded in the roadmap. The design & data patterns follow the live modules
        (KPIs, Strategy, Risk, Portfolio, OKRs). See <code>docs/ROADMAP.md</code>.
      </div>
    </>
  );
}

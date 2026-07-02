'use client';
import { PageHeader } from '@/components/ui/primitives';
export default function Page() {
  return (
    <>
      <PageHeader title="Administration & Governance" subtitle="Multi-tenant configuration, identity, RBAC/ABAC, AI providers, integrations, audit and feature flags." badge={<span className="pill pill-n">Phase 3</span>} />
      <div className="card p-8 text-center text-ink-3">
        This module is scaffolded in the roadmap. The design & data patterns follow the live modules
        (KPIs, Strategy, Risk, Portfolio, OKRs). See <code>docs/ROADMAP.md</code>.
      </div>
    </>
  );
}

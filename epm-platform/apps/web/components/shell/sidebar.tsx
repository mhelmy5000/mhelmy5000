'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Scale } from 'lucide-react';
import { NAV, NAV_GROUPS } from './nav';

/** Mizan sidebar — balance-scale brand, grouped nav, active-route highlight. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-[264px] flex-col border-r border-line bg-[var(--page)]">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-[0_6px_18px_-6px_rgba(99,102,241,0.7)]">
          <Scale className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <div className="text-[16px] font-bold tracking-tight">
            Mizan <span className="bg-brand bg-clip-text text-transparent">EPM</span>
            <b className="ml-1 align-[2px] text-xs font-bold text-ink-3">ميزان</b>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            Enterprise · Balanced performance
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-5">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <div className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-3">
              {group}
            </div>
            {NAV.filter((n) => n.group === group).map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                    active ? 'text-ink-1' : 'text-ink-2 hover:bg-surface hover:text-ink-1',
                  )}
                  style={active ? { background: 'color-mix(in srgb, var(--brand-1) 16%, transparent)' } : undefined}
                >
                  <Icon className="h-[18px] w-[18px] opacity-85" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

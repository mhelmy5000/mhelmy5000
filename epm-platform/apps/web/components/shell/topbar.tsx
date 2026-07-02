'use client';

import { useTheme } from 'next-themes';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Top bar — global search affordance, theme toggle, tenant + user. */
export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3.5 border-b border-line bg-[var(--surface)]/70 px-6 backdrop-blur-xl">
      <button className="flex h-10 w-[min(340px,32vw)] items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 text-ink-3 transition hover:border-line-2">
        <Search className="h-4 w-4" />
        <span className="text-sm">Search or ask AI…</span>
        <kbd className="ml-auto rounded-md border border-line-2 px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-line bg-surface text-ink-1 transition hover:bg-surface-2"
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button aria-label="Notifications" className="relative grid h-[38px] w-[38px] place-items-center rounded-xl border border-line bg-surface text-ink-1 transition hover:bg-surface-2">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-critical" />
        </button>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-2 pr-2.5">
          <div className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 text-[12px] font-extrabold text-[#04121a]">MG</div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-semibold">Ministry of Gov</div>
            <div className="text-[10px] font-semibold text-ink-3">Tenant · 4,120 users</div>
          </div>
        </div>
        <div className="grid h-[38px] w-[38px] place-items-center rounded-full border-2 border-line-2 bg-gradient-to-br from-amber-500 to-red-500 text-sm font-extrabold text-white">MH</div>
      </div>
    </header>
  );
}

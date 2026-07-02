import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

/** Authenticated app shell: fixed sidebar + sticky topbar + scrolling content. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-[1] grid h-screen grid-cols-[264px_1fr] overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-7 pb-14 pt-6">{children}</main>
      </div>
    </div>
  );
}

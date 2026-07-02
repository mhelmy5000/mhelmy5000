import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mizan EPM — Enterprise Performance Management',
  description:
    'Mizan EPM (ميزان) — strategy, KPIs, KRIs, portfolio and OKRs, unified with an AI copilot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import {
  LayoutDashboard, Sparkles, Compass, Target, BarChart3, TriangleAlert,
  Briefcase, FolderKanban, FileText, Settings, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  badge?: string;
}

/** Navigation model — mirrors the prototype's grouped sidebar. */
export const NAV: NavItem[] = [
  { group: 'Overview', href: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { group: 'Overview', href: '/ai', label: 'AI Copilot', icon: Sparkles, badge: 'AI' },
  { group: 'Strategy', href: '/strategy', label: 'Strategy Map', icon: Compass },
  { group: 'Strategy', href: '/okrs', label: 'OKRs & Goals', icon: Target },
  { group: 'Performance & Risk', href: '/kpis', label: 'KPI Scorecards', icon: BarChart3 },
  { group: 'Performance & Risk', href: '/risk', label: 'Risk & KRIs', icon: TriangleAlert, badge: '3' },
  { group: 'Delivery', href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { group: 'Delivery', href: '/projects', label: 'Projects & PMO', icon: FolderKanban },
  { group: 'System', href: '/reports', label: 'Reports', icon: FileText },
  { group: 'System', href: '/admin', label: 'Administration', icon: Settings },
];

export const NAV_GROUPS = [...new Set(NAV.map((n) => n.group))];

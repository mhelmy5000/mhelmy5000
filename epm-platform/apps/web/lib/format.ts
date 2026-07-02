import type { RagStatus } from './types';

export const fmt = (n: number, d = 0): string =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const compact = (n: number): string =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;

/** RAG status → pill class + human label. */
export const ragPill = (s: RagStatus): { cls: string; label: string } => ({
  ON_TRACK: { cls: 'pill-g', label: 'On track' },
  AT_RISK: { cls: 'pill-w', label: 'At risk' },
  OFF_TRACK: { cls: 'pill-r', label: 'Off track' },
  NOT_STARTED: { cls: 'pill-n', label: 'Not started' },
}[s]);

/** RAG status → CSS var name for a colour (bars, dots). */
export const ragColorVar = (s: RagStatus): string =>
  s === 'ON_TRACK' ? '--good' : s === 'AT_RISK' ? '--warning' : s === 'OFF_TRACK' ? '--critical' : '--ink-3';

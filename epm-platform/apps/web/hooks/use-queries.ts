'use client';

import { useQuery } from '@tanstack/react-query';
import { createApi } from '@/lib/api';

/**
 * TanStack Query hooks — one per module, all backed by the typed MizanApi
 * client. Components stay declarative: `const { data, isLoading } = useScorecard()`.
 * The base URL is same-origin `/api` in the browser (Next rewrites → API).
 */
const api = () => createApi();

export const useScorecard = () =>
  useQuery({ queryKey: ['kpi', 'scorecard'], queryFn: () => api().kpiScorecard() });

export const useStrategyMap = () =>
  useQuery({ queryKey: ['strategy', 'map'], queryFn: () => api().strategyMap() });

export const useOkrs = () =>
  useQuery({ queryKey: ['strategy', 'okrs'], queryFn: () => api().strategyOkrs() });

export const useRiskRegister = () =>
  useQuery({ queryKey: ['risk', 'register'], queryFn: () => api().riskRegister() });

export const usePortfolioMatrix = () =>
  useQuery({ queryKey: ['portfolio', 'matrix'], queryFn: () => api().portfolioMatrix() });

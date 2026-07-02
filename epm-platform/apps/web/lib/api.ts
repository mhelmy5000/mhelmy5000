/**
 * Mizan API client — the web app's single data-access surface.
 *
 * Framework-agnostic (depends only on `fetch` + a base URL), so it is used by
 * server components, client hooks, and unit tests alike. Every method returns
 * a typed DTO from `types.ts`, matching the NestJS API and the reference server.
 */
import type {
  Scorecard, StrategyMap, OkrResponse, RiskRegister, PortfolioMatrix,
  AiResult, LoginResult,
} from './types';

export interface ApiOptions {
  baseUrl: string;
  /** Bearer token; attached as Authorization when present. */
  token?: string;
  /** Injectable fetch (defaults to global fetch) — handy for tests/SSR. */
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class MizanApi {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly f: typeof fetch;

  constructor(opts: ApiOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
    this.f = opts.fetchImpl ?? fetch;
  }

  private headers(json = false): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h['content-type'] = 'application/json';
    if (this.token) h.authorization = `Bearer ${this.token}`;
    return h;
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.f(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(body != null),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ApiError(res.status, detail || res.statusText);
    }
    return (await res.json()) as T;
  }

  // ── auth ──
  login(email: string, tenantSlug?: string) {
    return this.req<LoginResult>('POST', '/auth/login', { email, tenantSlug });
  }

  // ── modules ──
  kpiScorecard(query: Record<string, string> = {}) {
    return this.req<Scorecard>('GET', `/kpis/scorecard${qs(query)}`);
  }
  strategyMap() {
    return this.req<StrategyMap>('GET', '/strategy/map');
  }
  strategyOkrs() {
    return this.req<OkrResponse>('GET', '/strategy/okrs');
  }
  riskRegister() {
    return this.req<RiskRegister>('GET', '/risks/register');
  }
  portfolioMatrix() {
    return this.req<PortfolioMatrix>('GET', '/portfolio/matrix');
  }

  // ── AI ──
  analyzeKpis() {
    return this.req<AiResult>('POST', '/ai/kpi-analysis');
  }
}

const qs = (q: Record<string, string>): string => {
  const s = new URLSearchParams(q).toString();
  return s ? `?${s}` : '';
};

/** Base URL from env (browser: NEXT_PUBLIC_API_URL; falls back to local dev). */
export const apiBaseUrl = (): string => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

/** Convenience factory for an anonymous client (dev / public reads). */
export const createApi = (token?: string): MizanApi =>
  new MizanApi({ baseUrl: apiBaseUrl(), token });

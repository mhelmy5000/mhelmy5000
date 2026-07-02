import {
  AiError,
  AiProvider,
  AiProviderId,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
  StreamChunk,
} from '../types';

/**
 * Shared adapter scaffolding: config storage, a token-bucket rate limiter and
 * a fetch helper with timeout + retryable-error classification. Concrete
 * adapters implement only the provider-specific request/response mapping.
 */
export abstract class BaseAdapter implements AiProvider {
  abstract readonly id: AiProviderId;
  protected readonly cfg: ProviderConfig;
  private readonly limiter: TokenBucket;

  constructor(cfg: ProviderConfig) {
    this.cfg = cfg;
    this.limiter = new TokenBucket(cfg.rateLimit?.requestsPerMinute ?? 600);
  }

  abstract isConfigured(): boolean;
  abstract complete(req: CompletionRequest): Promise<CompletionResponse>;
  abstract stream(req: CompletionRequest): AsyncIterable<StreamChunk>;
  abstract embed(req: EmbeddingRequest): Promise<EmbeddingResponse>;

  async healthCheck(): Promise<{ healthy: boolean; detail?: string }> {
    if (!this.isConfigured()) return { healthy: false, detail: 'not configured' };
    try {
      await this.complete({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { healthy: true };
    } catch (e) {
      return { healthy: false, detail: (e as Error).message };
    }
  }

  /** Acquire a rate-limit slot before every outbound call. */
  protected async gate(): Promise<void> {
    await this.limiter.take();
  }

  /** fetch with timeout + uniform error mapping to AiError. */
  protected async request<T>(url: string, init: RequestInit): Promise<T> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs ?? 60_000);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      if (!res.ok) throw this.mapHttpError(res.status, await safeText(res));
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof AiError) throw e;
      if ((e as Error).name === 'AbortError')
        throw new AiError('request timed out', this.id, 'timeout', true, e);
      throw new AiError((e as Error).message, this.id, 'unavailable', true, e);
    } finally {
      clearTimeout(timeout);
    }
  }

  protected mapHttpError(status: number, body: string): AiError {
    if (status === 401 || status === 403)
      return new AiError(`auth failed: ${body}`, this.id, 'auth', false);
    if (status === 429)
      return new AiError('rate limited', this.id, 'rate_limit', true);
    if (status === 400)
      return new AiError(`bad request: ${body}`, this.id, 'bad_request', false);
    if (status >= 500)
      return new AiError(`server error ${status}`, this.id, 'server', true);
    return new AiError(`http ${status}: ${body}`, this.id, 'unavailable', true);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '<no body>';
  }
}

/** Simple refill-per-minute token bucket for request-rate limiting. */
class TokenBucket {
  private tokens: number;
  private last = 0; // ms; injected clock keeps this deterministic in tests

  constructor(private readonly perMinute: number) {
    this.tokens = perMinute;
  }

  async take(now: () => number = () => Date.now()): Promise<void> {
    const t = now();
    if (this.last === 0) this.last = t;
    const refill = ((t - this.last) / 60_000) * this.perMinute;
    this.tokens = Math.min(this.perMinute, this.tokens + refill);
    this.last = t;
    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / this.perMinute) * 60_000;
      await new Promise((r) => setTimeout(r, waitMs));
      this.tokens = 1;
    }
    this.tokens -= 1;
  }
}

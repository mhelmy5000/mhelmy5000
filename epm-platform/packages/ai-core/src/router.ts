import {
  AiError,
  AiProvider,
  AiProviderId,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
} from './types';
import { AnthropicAdapter } from './providers/anthropic.adapter';
import { GeminiAdapter } from './providers/gemini.adapter';
import {
  AzureOpenAiAdapter,
  OllamaAdapter,
  OpenAiCompatibleAdapter,
} from './providers/openai-compatible.adapter';

export interface RouterTelemetry {
  onSuccess?(e: {
    provider: AiProviderId;
    model: string;
    latencyMs: number;
    usage: CompletionResponse['usage'];
    tenantId?: string;
    traceId?: string;
  }): void;
  onFailover?(e: { from: AiProviderId; to: AiProviderId; reason: string }): void;
  onError?(e: { provider: AiProviderId; error: AiError }): void;
}

/**
 * AiRouter — the single entry point business logic uses. It builds the
 * enabled-provider chain (ordered by `priority`), executes the request against
 * the highest-priority healthy provider, and on a *retryable* failure fails
 * over to the next provider transparently. Non-retryable errors (bad request,
 * auth) short-circuit — failing over would just repeat the mistake.
 *
 * Config is injected, so an admin screen can rebuild the router at runtime
 * (enable/disable providers, reorder priority, rotate keys) with zero code
 * changes and no restart.
 */
export class AiRouter {
  private providers = new Map<AiProviderId, AiProvider>();

  constructor(
    configs: ProviderConfig[],
    private readonly telemetry: RouterTelemetry = {},
  ) {
    this.configure(configs);
  }

  /** Rebuild adapters from fresh config (called on admin save). */
  configure(configs: ProviderConfig[]): void {
    this.providers.clear();
    for (const cfg of configs) {
      if (!cfg.enabled) continue;
      const provider = AiRouter.instantiate(cfg);
      if (provider.isConfigured()) this.providers.set(cfg.id, provider);
    }
    this.chain = configs
      .filter((c) => c.enabled && this.providers.has(c.id))
      .sort((a, b) => a.priority - b.priority)
      .map((c) => c.id);
  }

  private chain: AiProviderId[] = [];

  private static instantiate(cfg: ProviderConfig): AiProvider {
    switch (cfg.id) {
      case 'anthropic':
        return new AnthropicAdapter(cfg);
      case 'openai':
        return new OpenAiCompatibleAdapter(cfg);
      case 'azure-openai':
        return new AzureOpenAiAdapter(cfg);
      case 'ollama':
        return new OllamaAdapter(cfg);
      case 'gemini':
        return new GeminiAdapter(cfg);
      case 'aws-bedrock':
        // Bedrock adapter is future-ready; until shipped it is never in-chain.
        throw new AiError('bedrock adapter not yet implemented', cfg.id, 'unavailable', false);
      default:
        throw new AiError(`unknown provider ${cfg.id}`, cfg.id, 'bad_request', false);
    }
  }

  /** Ordered list of providers that will actually be tried. */
  get activeChain(): AiProviderId[] {
    return [...this.chain];
  }

  /**
   * Complete with automatic cross-provider fallback.
   * @param preferred pin a provider first (e.g. tenant policy or admin override).
   */
  async complete(
    req: CompletionRequest,
    preferred?: AiProviderId,
  ): Promise<CompletionResponse> {
    const order = this.order(preferred);
    if (order.length === 0)
      throw new AiError('no AI providers enabled/configured', 'anthropic', 'unavailable', false);

    let lastErr: AiError | undefined;
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const provider = this.providers.get(id)!;
      const startedAt = Date.now();
      try {
        const res = await provider.complete(req);
        res.latencyMs = Date.now() - startedAt;
        this.telemetry.onSuccess?.({
          provider: id,
          model: res.model,
          latencyMs: res.latencyMs,
          usage: res.usage,
          tenantId: req.tenantId,
          traceId: req.traceId,
        });
        return res;
      } catch (e) {
        const err = e instanceof AiError ? e : new AiError((e as Error).message, id, 'unavailable', true, e);
        this.telemetry.onError?.({ provider: id, error: err });
        lastErr = err;
        // Non-retryable → stop; retrying elsewhere wastes tokens on a bad input.
        if (!err.retryable) throw err;
        const next = order[i + 1];
        if (next)
          this.telemetry.onFailover?.({ from: id, to: next, reason: err.code });
      }
    }
    throw lastErr ?? new AiError('all providers failed', 'anthropic', 'unavailable', true);
  }

  /** Embeddings route to the first enabled provider that supports them. */
  async embed(req: EmbeddingRequest, preferred?: AiProviderId): Promise<EmbeddingResponse> {
    const order = this.order(preferred).filter((id) => id !== 'anthropic'); // no embeddings
    for (const id of order) {
      try {
        return await this.providers.get(id)!.embed(req);
      } catch (e) {
        if (e instanceof AiError && !e.retryable) throw e;
      }
    }
    throw new AiError('no embedding-capable provider available', 'openai', 'unavailable', false);
  }

  async health(): Promise<Record<string, { healthy: boolean; detail?: string }>> {
    const out: Record<string, { healthy: boolean; detail?: string }> = {};
    await Promise.all(
      [...this.providers].map(async ([id, p]) => {
        out[id] = await p.healthCheck();
      }),
    );
    return out;
  }

  private order(preferred?: AiProviderId): AiProviderId[] {
    if (preferred && this.providers.has(preferred))
      return [preferred, ...this.chain.filter((id) => id !== preferred)];
    return this.chain;
  }
}

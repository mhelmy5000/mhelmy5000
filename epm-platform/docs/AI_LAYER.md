# Mizan EPM — AI Abstraction Layer (`@mizan/ai-core`)

The AI layer is provider-agnostic: business logic depends only on the
`AiRouter` and `EpmInsightService`. Providers are adapters selected from
runtime configuration, so you can add, reorder, enable/disable, or swap
providers with **zero changes to domain code and no redeploy**.

## Design at a glance

```
 Domain services (NestJS)
        │  executiveSummary() · analyzeKpis() · predictRisks() · forecast() …
        ▼
 EpmInsightService ──uses──▶ Retriever ──▶ VectorStore (pgvector/Qdrant/…)
        │                        │
        │                     embeds via
        ▼                        ▼
 AiRouter  ──priority order + cross-provider fallback + telemetry──┐
        │                                                          │
        ├─ AnthropicAdapter        (Claude — default primary)      │
        ├─ OpenAiCompatibleAdapter (OpenAI)                        │  all implement
        ├─ AzureOpenAiAdapter      (Azure OpenAI)                  ├─ AiProvider
        ├─ OllamaAdapter           (local/on-prem, no key)         │
        ├─ GeminiAdapter           (Google)                        │
        └─ (AWS Bedrock — future-ready stub)                       ┘
```

Key files (all in `packages/ai-core/src`):

| File | Responsibility |
|---|---|
| `types.ts` | The contracts: `AiProvider`, `CompletionRequest/Response`, `ProviderConfig`, `AiError`. |
| `providers/base.adapter.ts` | Shared: config, token-bucket rate limiting, fetch w/ timeout + error mapping, health check. |
| `providers/*.adapter.ts` | One adapter per wire protocol. OpenAI/Azure/Ollama share one base (they speak the same API). |
| `router.ts` | Builds the enabled+configured chain by `priority`; executes with transparent fallback; emits telemetry. |
| `rag/vector-store.ts` | `VectorStore` port + in-memory reference impl (cosine, tenant + metadata filtered). |
| `rag/retriever.ts` | Embed query → search tenant namespace → citation-ready context block. |
| `prompts.ts` | Versioned, parameterised prompt templates per capability. |
| `insight.service.ts` | Domain-facing capability API (RAG + prompt + router composed). |

## Administrator control (maps to `AiProviderConfig` + the Admin UI)

Per tenant, an administrator can configure: **enabled**, **priority**, **API
key** (stored as a Vault/KMS reference, never plaintext), **endpoint/baseUrl**,
**model** + **fallback models**, **embedding model**, and **rate limits**. Saving
calls `router.configure(freshConfigs)` which rebuilds the adapter chain live.

## Fallback semantics

- The router tries providers in ascending `priority`.
- A **retryable** failure (`rate_limit`, `timeout`, `server`, `unavailable`)
  fails over to the next provider and emits an `onFailover` telemetry event.
- A **non-retryable** failure (`auth`, `bad_request`) short-circuits — retrying
  elsewhere would just repeat a client mistake and burn tokens.
- `preferred` pins a provider first (tenant policy / admin override) while
  keeping the rest of the chain as backup.
- Embeddings route to the first embedding-capable provider (Anthropic is skipped
  — it has no embeddings endpoint).

## Capabilities exposed

`executiveSummary` · `analyzeKpis` · `predictRisks` · `forecast` · `rootCause`
· `boardNarrative`. Each is grounded on tenant data via RAG when a `Retriever`
is wired, and returns `{ text, provider, model, grounded, sources }` so the UI
can show provenance and citations. Additional capabilities (what-if, target
recommendation, NL→query, agents/MCP tool-calling) extend the same pattern.

## Example wiring

```ts
import {
  AiRouter, EpmInsightService, Retriever, InMemoryVectorStore,
  defaultProviderConfigs,
} from '@mizan/ai-core';

const router = new AiRouter(defaultProviderConfigs(process.env), {
  onFailover: (e) => logger.warn(`AI failover ${e.from}→${e.to} (${e.reason})`),
  onSuccess: (e) => metrics.observe('ai.latency', e.latencyMs, { provider: e.provider }),
});

const insights = new EpmInsightService(
  router,
  new Retriever(router, new InMemoryVectorStore()), // → PgVectorStore in prod
);

const summary = await insights.executiveSummary(
  { entity: 'Ministry of Government', period: 'FY2026 Q2' },
  { tenantId, userId, traceId },
);
// summary.provider === 'anthropic' (or the next healthy provider on failover)
```

## Extending

- **New provider:** implement `AiProvider` (usually by extending `BaseAdapter`),
  register it in `AiRouter.instantiate`, add a `ProviderConfig`. Nothing else changes.
- **New capability:** add a versioned template to `prompts.ts` and a thin method
  to `EpmInsightService`.
- **Agents / MCP / tool-calling:** `ToolDefinition`/`ToolCall` are already in the
  contracts; an agent loop calls `router.complete` with `tools`, executes returned
  `toolCalls` (including MCP tools), and feeds results back as `tool` messages.

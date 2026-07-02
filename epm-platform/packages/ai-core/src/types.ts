/**
 * Helm EPM — AI Core: provider-agnostic type contracts.
 *
 * These interfaces are the *only* thing business logic (NestJS services,
 * agents, RAG pipelines) depends on. Concrete SDKs (Anthropic, OpenAI,
 * Google, Ollama, Azure, Bedrock) are hidden behind adapters that implement
 * `AiProvider`, so swapping or adding a provider never touches domain code.
 */

export type AiProviderId =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'ollama'
  | 'azure-openai'
  | 'aws-bedrock';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Present on assistant messages that requested tool calls. */
  toolCalls?: ToolCall[];
  /** Present on `tool` messages returning a result to a prior call. */
  toolCallId?: string;
  name?: string;
}

/** JSON-Schema-described tool the model may call (function calling / MCP). */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool's input arguments. */
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  /** Parsed arguments object (adapters parse provider-specific payloads). */
  arguments: Record<string, unknown>;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  /** Overrides the provider's default model when set. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools?: ToolDefinition[];
  /** Force JSON output where the provider supports it. */
  responseFormat?: 'text' | 'json';
  /** Enable extended reasoning where the model/provider supports it. */
  reasoning?: boolean;
  /** Multi-tenant + observability metadata (never sent to the model). */
  tenantId?: string;
  userId?: string;
  traceId?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CompletionResponse {
  provider: AiProviderId;
  model: string;
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  /** Wall-clock latency in ms, filled in by the router. */
  latencyMs?: number;
  raw?: unknown;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
  tenantId?: string;
}

export interface EmbeddingResponse {
  provider: AiProviderId;
  model: string;
  vectors: number[][];
  usage: TokenUsage;
}

/** Per-provider configuration, editable at runtime by an administrator. */
export interface ProviderConfig {
  id: AiProviderId;
  enabled: boolean;
  /** Lower number = higher priority in the fallback chain. */
  priority: number;
  apiKey?: string;
  /** Custom endpoint (self-hosted Ollama, Azure resource, gateway). */
  baseUrl?: string;
  /** Azure deployment name / Bedrock inference profile, etc. */
  deployment?: string;
  defaultModel: string;
  /** Ordered fallback models *within* this provider. */
  fallbackModels?: string[];
  embeddingModel?: string;
  rateLimit?: RateLimitConfig;
  timeoutMs?: number;
  /** Free-form extras an adapter may need (region, apiVersion…). */
  options?: Record<string, unknown>;
}

export interface RateLimitConfig {
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  maxConcurrent?: number;
}

/** The contract every provider adapter implements. */
export interface AiProvider {
  readonly id: AiProviderId;
  /** True only when required config (keys/endpoint) is present. */
  isConfigured(): boolean;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  stream(req: CompletionRequest): AsyncIterable<StreamChunk>;
  embed(req: EmbeddingRequest): Promise<EmbeddingResponse>;
  /** Lightweight liveness probe used by health checks and the router. */
  healthCheck(): Promise<{ healthy: boolean; detail?: string }>;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly provider: AiProviderId,
    readonly code:
      | 'auth'
      | 'rate_limit'
      | 'timeout'
      | 'server'
      | 'bad_request'
      | 'unavailable',
    readonly retryable: boolean,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

/**
 * @helm/ai-core — provider-agnostic AI layer for Helm EPM.
 *
 * Public surface: import the router + insight service and the types; concrete
 * adapters are wired by the router from ProviderConfig, so consumers rarely
 * import them directly.
 */
export * from './types';
export * from './router';
export * from './prompts';
export * from './insight.service';
export * from './rag/vector-store';
export * from './rag/retriever';

// Adapters (exported for advanced/custom wiring & testing)
export * from './providers/base.adapter';
export * from './providers/anthropic.adapter';
export * from './providers/openai-compatible.adapter';
export * from './providers/gemini.adapter';

import { ProviderConfig } from './types';

/**
 * Default provider configuration for a fresh Helm EPM install. Keys are read
 * from the environment; an administrator can override everything at runtime via
 * the Administration → AI Providers screen (persisted per tenant).
 */
export const defaultProviderConfigs = (
  env: Record<string, string | undefined> = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {},
): ProviderConfig[] => [
  {
    id: 'anthropic',
    enabled: Boolean(env.ANTHROPIC_API_KEY),
    priority: 1,
    apiKey: env.ANTHROPIC_API_KEY,
    defaultModel: env.ANTHROPIC_MODEL ?? 'claude-opus-4-8',
    fallbackModels: ['claude-sonnet-5', 'claude-haiku-4-5-20251001'],
    rateLimit: { requestsPerMinute: 1000 },
    timeoutMs: 60_000,
  },
  {
    id: 'openai',
    enabled: Boolean(env.OPENAI_API_KEY),
    priority: 2,
    apiKey: env.OPENAI_API_KEY,
    defaultModel: env.OPENAI_MODEL ?? 'gpt-4o',
    embeddingModel: 'text-embedding-3-small',
    rateLimit: { requestsPerMinute: 3500 },
  },
  {
    id: 'gemini',
    enabled: Boolean(env.GEMINI_API_KEY),
    priority: 3,
    apiKey: env.GEMINI_API_KEY,
    defaultModel: env.GEMINI_MODEL ?? 'gemini-1.5-pro',
    embeddingModel: 'text-embedding-004',
  },
  {
    id: 'azure-openai',
    enabled: Boolean(env.AZURE_OPENAI_API_KEY),
    priority: 4,
    apiKey: env.AZURE_OPENAI_API_KEY,
    baseUrl: env.AZURE_OPENAI_ENDPOINT,
    deployment: env.AZURE_OPENAI_DEPLOYMENT,
    defaultModel: env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o',
    options: { apiVersion: env.AZURE_OPENAI_API_VERSION ?? '2024-06-01' },
  },
  {
    id: 'ollama',
    enabled: Boolean(env.OLLAMA_BASE_URL),
    priority: 5,
    baseUrl: env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
    defaultModel: env.OLLAMA_MODEL ?? 'llama3.1',
    embeddingModel: 'nomic-embed-text',
  },
];

import { BaseAdapter } from './base.adapter';
import {
  AiProviderId,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamChunk,
  ToolCall,
} from '../types';

/**
 * Anthropic Claude adapter (Messages API). System prompts are hoisted to the
 * top-level `system` field; `tools` map to Claude's tool-use schema. This is
 * the default primary provider for Helm EPM.
 */
export class AnthropicAdapter extends BaseAdapter {
  readonly id: AiProviderId = 'anthropic';

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey);
  }

  private url(path: string): string {
    return `${this.cfg.baseUrl ?? 'https://api.anthropic.com'}${path}`;
  }

  private headers(): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-api-key': this.cfg.apiKey ?? '',
      'anthropic-version': (this.cfg.options?.apiVersion as string) ?? '2023-06-01',
    };
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    await this.gate();
    const system = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const messages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const body: Record<string, unknown> = {
      model: req.model ?? this.cfg.defaultModel,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.4,
      messages,
      ...(system ? { system } : {}),
      ...(req.tools
        ? {
            tools: req.tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters,
            })),
          }
        : {}),
    };

    type Resp = {
      model: string;
      stop_reason: string;
      content: { type: string; text?: string; id?: string; name?: string; input?: unknown }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    const data = await this.request<Resp>(this.url('/v1/messages'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    const text = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    const toolCalls: ToolCall[] = data.content
      .filter((c) => c.type === 'tool_use')
      .map((c) => ({
        id: c.id ?? '',
        name: c.name ?? '',
        arguments: (c.input as Record<string, unknown>) ?? {},
      }));

    return {
      provider: this.id,
      model: data.model,
      content: text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      raw: data,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    // Production impl consumes the SSE `text/event-stream`; simplified here to
    // a single terminal chunk so the interface stays honest without an SDK.
    const full = await this.complete(req);
    yield { delta: full.content, done: true, usage: full.usage, toolCalls: full.toolCalls };
  }

  async embed(_req: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Anthropic has no first-party embeddings endpoint; the router falls back
    // to the configured embedding provider (OpenAI / Ollama) automatically.
    throw new Error('anthropic: embeddings not supported — route to an embedding provider');
  }
}

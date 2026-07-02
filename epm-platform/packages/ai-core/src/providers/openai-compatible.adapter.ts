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
 * One adapter for every OpenAI-compatible Chat Completions API. OpenAI, Azure
 * OpenAI and Ollama all speak this wire format — they differ only in base URL,
 * auth header and how the model/deployment is addressed. Subclasses set `id`
 * and override `url()` / `headers()`; the request mapping is shared.
 */
export class OpenAiCompatibleAdapter extends BaseAdapter {
  readonly id: AiProviderId = 'openai';

  isConfigured(): boolean {
    // Ollama needs only a base URL; hosted providers need a key.
    return this.id === 'ollama' ? Boolean(this.cfg.baseUrl) : Boolean(this.cfg.apiKey);
  }

  protected url(path: string): string {
    const base = this.cfg.baseUrl ?? 'https://api.openai.com/v1';
    return `${base}${path}`;
  }

  protected headers(): Record<string, string> {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (this.cfg.apiKey) h.authorization = `Bearer ${this.cfg.apiKey}`;
    return h;
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    await this.gate();
    const body: Record<string, unknown> = {
      model: req.model ?? this.cfg.deployment ?? this.cfg.defaultModel,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 2048,
      ...(req.topP ? { top_p: req.topP } : {}),
      ...(req.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
      ...(req.tools
        ? {
            tools: req.tools.map((t) => ({
              type: 'function',
              function: { name: t.name, description: t.description, parameters: t.parameters },
            })),
          }
        : {}),
    };

    type Resp = {
      model: string;
      choices: {
        finish_reason: string;
        message: {
          content: string | null;
          tool_calls?: { id: string; function: { name: string; arguments: string } }[];
        };
      }[];
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    const data = await this.request<Resp>(this.url('/chat/completions'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    const choice = data.choices[0];
    const toolCalls: ToolCall[] | undefined = choice.message.tool_calls?.map((c) => ({
      id: c.id,
      name: c.function.name,
      arguments: parseJson(c.function.arguments),
    }));

    return {
      provider: this.id,
      model: data.model,
      content: choice.message.content ?? '',
      toolCalls,
      finishReason:
        choice.finish_reason === 'tool_calls'
          ? 'tool_calls'
          : choice.finish_reason === 'length'
            ? 'length'
            : 'stop',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      raw: data,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const full = await this.complete(req);
    yield { delta: full.content, done: true, usage: full.usage, toolCalls: full.toolCalls };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    await this.gate();
    type Resp = {
      model: string;
      data: { embedding: number[] }[];
      usage?: { prompt_tokens: number; total_tokens: number };
    };
    const data = await this.request<Resp>(this.url('/embeddings'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: req.model ?? this.cfg.embeddingModel ?? 'text-embedding-3-small',
        input: req.input,
      }),
    });
    return {
      provider: this.id,
      model: data.model,
      vectors: data.data.map((d) => d.embedding),
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }
}

/** Ollama — local/on-prem OpenAI-compatible server. No API key required. */
export class OllamaAdapter extends OpenAiCompatibleAdapter {
  readonly id: AiProviderId = 'ollama';
  protected url(path: string): string {
    return `${this.cfg.baseUrl ?? 'http://localhost:11434/v1'}${path}`;
  }
}

/** Azure OpenAI — key in `api-key` header, deployment addressed via URL. */
export class AzureOpenAiAdapter extends OpenAiCompatibleAdapter {
  readonly id: AiProviderId = 'azure-openai';
  protected url(path: string): string {
    const version = (this.cfg.options?.apiVersion as string) ?? '2024-06-01';
    const dep = this.cfg.deployment ?? this.cfg.defaultModel;
    return `${this.cfg.baseUrl}/openai/deployments/${dep}${path}?api-version=${version}`;
  }
  protected headers(): Record<string, string> {
    return { 'content-type': 'application/json', 'api-key': this.cfg.apiKey ?? '' };
  }
}

function parseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

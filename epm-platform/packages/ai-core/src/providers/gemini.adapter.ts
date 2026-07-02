import { BaseAdapter } from './base.adapter';
import {
  AiProviderId,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamChunk,
} from '../types';

/** Google Gemini adapter (generateContent API). */
export class GeminiAdapter extends BaseAdapter {
  readonly id: AiProviderId = 'gemini';

  isConfigured(): boolean {
    return Boolean(this.cfg.apiKey);
  }

  private base(): string {
    return this.cfg.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    await this.gate();
    const model = req.model ?? this.cfg.defaultModel;
    const systemInstruction = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    type Resp = {
      candidates: { content: { parts: { text: string }[] }; finishReason: string }[];
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };
    const data = await this.request<Resp>(
      `${this.base()}/models/${model}:generateContent?key=${this.cfg.apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemInstruction
            ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
            : {}),
          generationConfig: {
            temperature: req.temperature ?? 0.4,
            maxOutputTokens: req.maxTokens ?? 2048,
            ...(req.responseFormat === 'json'
              ? { responseMimeType: 'application/json' }
              : {}),
          },
        }),
      },
    );

    const cand = data.candidates?.[0];
    return {
      provider: this.id,
      model,
      content: cand?.content?.parts?.map((p) => p.text).join('') ?? '',
      finishReason: cand?.finishReason === 'MAX_TOKENS' ? 'length' : 'stop',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      raw: data,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const full = await this.complete(req);
    yield { delta: full.content, done: true, usage: full.usage };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    await this.gate();
    const model = req.model ?? this.cfg.embeddingModel ?? 'text-embedding-004';
    const inputs = Array.isArray(req.input) ? req.input : [req.input];
    type Resp = { embedding: { values: number[] } };
    const vectors: number[][] = [];
    for (const text of inputs) {
      const data = await this.request<Resp>(
        `${this.base()}/models/${model}:embedContent?key=${this.cfg.apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: { parts: [{ text }] } }),
        },
      );
      vectors.push(data.embedding.values);
    }
    return {
      provider: this.id,
      model,
      vectors,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}

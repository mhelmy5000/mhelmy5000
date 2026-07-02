import { AiRouter } from '../router';
import { SearchHit, VectorStore } from './vector-store';

/**
 * Retriever — embeds a query via the AiRouter, searches the tenant's vector
 * namespace, and returns hits plus a formatted, citation-ready context block
 * to inject into a grounded prompt.
 */
export class Retriever {
  constructor(
    private readonly router: AiRouter,
    private readonly store: VectorStore,
  ) {}

  async retrieve(
    query: string,
    tenantId: string,
    opts: { topK?: number; filter?: Record<string, unknown> } = {},
  ): Promise<{ hits: SearchHit[]; context: string }> {
    const { vectors } = await this.router.embed({ input: query, tenantId });
    const hits = await this.store.search(vectors[0], {
      tenantId,
      topK: opts.topK ?? 6,
      filter: opts.filter,
      minScore: 0.2,
    });
    const context = hits
      .map((h, i) => `[${i + 1}] (${h.metadata.source ?? h.id}) ${h.content}`)
      .join('\n\n');
    return { hits, context };
  }
}

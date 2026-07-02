/**
 * RAG layer — vector store abstraction. The concrete store (pgvector, Qdrant,
 * Pinecone, Weaviate) sits behind this interface so the retrieval pipeline and
 * agents never bind to a specific database. Multi-tenancy is enforced by a
 * mandatory `tenantId` namespace on every operation.
 */
export interface VectorRecord {
  id: string;
  tenantId: string;
  vector: number[];
  content: string;
  /** Source metadata for citations: documentId, module, entityId, url… */
  metadata: Record<string, unknown>;
}

export interface SearchHit {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  tenantId: string;
  topK?: number;
  /** Minimum cosine similarity to include a hit. */
  minScore?: number;
  /** Metadata equality filters (e.g. { module: 'kpi' }). */
  filter?: Record<string, unknown>;
}

export interface VectorStore {
  upsert(records: VectorRecord[]): Promise<void>;
  search(queryVector: number[], opts: SearchOptions): Promise<SearchHit[]>;
  delete(ids: string[], tenantId: string): Promise<void>;
}

/**
 * In-memory reference implementation (dev/tests). Cosine similarity with
 * tenant + metadata filtering. Swap for a PgVectorStore in production.
 */
export class InMemoryVectorStore implements VectorStore {
  private records: VectorRecord[] = [];

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      const i = this.records.findIndex((x) => x.id === r.id);
      if (i >= 0) this.records[i] = r;
      else this.records.push(r);
    }
  }

  async search(queryVector: number[], opts: SearchOptions): Promise<SearchHit[]> {
    const min = opts.minScore ?? 0;
    return this.records
      .filter((r) => r.tenantId === opts.tenantId && matches(r.metadata, opts.filter))
      .map((r) => ({
        id: r.id,
        content: r.content,
        score: cosine(queryVector, r.vector),
        metadata: r.metadata,
      }))
      .filter((h) => h.score >= min)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.topK ?? 6);
  }

  async delete(ids: string[], tenantId: string): Promise<void> {
    const set = new Set(ids);
    this.records = this.records.filter((r) => !(r.tenantId === tenantId && set.has(r.id)));
  }
}

function matches(meta: Record<string, unknown>, filter?: Record<string, unknown>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => meta[k] === v);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

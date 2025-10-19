// ============================================
// Embedding-Based Dense Retrieval
// ============================================

import type { CourseMaterial } from "@/lib/models/types";
import type {
  IRetriever,
  RetrievalResult,
  Embedding,
  IVectorStore,
} from "./types";

/**
 * Embedding generation function type
 *
 * In production, use:
 * - Transformers.js with all-MiniLM-L6-v2
 * - OpenAI text-embedding-3-small
 * - Cohere embed-english-v3.0
 */
export type EmbeddingFunction = (text: string) => Promise<Embedding>;

/**
 * Embedding Retriever
 *
 * Implements dense retrieval using semantic embeddings.
 * Uses cosine similarity to find relevant materials.
 *
 * Architecture:
 * 1. Materials are embedded and stored in vector store (pre-computed)
 * 2. Query is embedded at search time
 * 3. Vector store returns top-K by cosine similarity
 * 4. Results are enriched with material metadata
 *
 * For production:
 * - Use real embedding model (Transformers.js, OpenAI, etc.)
 * - Pre-compute embeddings offline and cache
 * - Use pgvector or dedicated vector DB
 */
export class EmbeddingRetriever implements IRetriever {
  private materials: CourseMaterial[];
  private vectorStore: IVectorStore;
  private embedFn: EmbeddingFunction;
  private initialized: boolean = false;

  constructor(
    materials: CourseMaterial[],
    vectorStore: IVectorStore,
    embedFn: EmbeddingFunction
  ) {
    this.materials = materials;
    this.vectorStore = vectorStore;
    this.embedFn = embedFn;
  }

  /**
   * Initialize by embedding all materials
   *
   * Call this once before first retrieval.
   * In production, embeddings would be pre-computed.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`[EmbeddingRetriever] Embedding ${this.materials.length} materials...`);

    for (const material of this.materials) {
      // Check if already embedded
      const exists = await this.vectorStore.has(material.id);

      if (!exists) {
        // Combine title, content, and keywords for embedding
        const text = `${material.title}\n${material.content}\nKeywords: ${material.keywords.join(", ")}`;

        // Generate embedding
        const embedding = await this.embedFn(text);

        // Store in vector store
        await this.vectorStore.add(material.id, embedding, {
          courseId: material.courseId,
          type: material.type,
          title: material.title,
        });
      }
    }

    this.initialized = true;
    console.log(`[EmbeddingRetriever] Initialization complete`);
  }

  /**
   * Retrieve relevant materials using semantic search
   */
  async retrieve(query: string, limit: number = 10): Promise<RetrievalResult[]> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Embed query
    const queryEmbedding = await this.embedFn(query);

    // Search vector store
    const vectorResults = await this.vectorStore.search(queryEmbedding, limit);

    // Enrich with material metadata
    const results: RetrievalResult[] = [];

    for (const vectorResult of vectorResults) {
      const material = this.materials.find(m => m.id === vectorResult.id);

      if (material) {
        results.push({
          material,
          score: vectorResult.score,
          metadata: {
            retriever: "embedding",
            similarity: vectorResult.score,
            ...vectorResult.metadata,
          },
        });
      }
    }

    return results;
  }

  /**
   * Check if retriever is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get vector store (for debugging/monitoring)
   */
  getVectorStore(): IVectorStore {
    return this.vectorStore;
  }
}

/**
 * Create simple keyword-based pseudo-embedding for demo
 *
 * NOTE: This is NOT a real embedding! For production, use:
 * - Transformers.js: @xenova/transformers with all-MiniLM-L6-v2
 * - OpenAI: text-embedding-3-small via API
 * - Cohere: embed-english-v3.0 via API
 *
 * This creates a 384-dimensional vector (matching all-MiniLM-L6-v2)
 * based on simple keyword hashing. Purely for demo purposes.
 */
export function createSimpleEmbedding(text: string): Embedding {
  const dimensions = 384; // Match all-MiniLM-L6-v2
  const vector = new Array(dimensions).fill(0);

  // Simple hash-based pseudo-embedding
  // This is NOT semantically meaningful, just for demo
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);

  for (const token of tokens) {
    // Simple hash to distribute tokens across dimensions
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % dimensions;
    vector[index] += 1;
  }

  // Normalize to unit vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return {
    vector,
    dimensions,
  };
}

/**
 * Async wrapper for simple embedding (matches EmbeddingFunction signature)
 */
export async function simpleEmbedFn(text: string): Promise<Embedding> {
  return createSimpleEmbedding(text);
}

/**
 * Load pre-computed embeddings from JSON file
 *
 * For production deployment:
 * 1. Pre-compute embeddings offline using real model
 * 2. Store in JSON or database
 * 3. Load at startup
 *
 * Expected format:
 * {
 *   "material-id-1": { "vector": [0.1, 0.2, ...], "dimensions": 384 },
 *   "material-id-2": { "vector": [...], "dimensions": 384 }
 * }
 */
export async function loadPrecomputedEmbeddings(
  vectorStore: IVectorStore,
  embeddingsPath: string
): Promise<void> {
  try {
    const response = await fetch(embeddingsPath);
    const embeddings = await response.json() as Record<string, Embedding>;

    for (const [id, embedding] of Object.entries(embeddings)) {
      await vectorStore.add(id, embedding);
    }

    console.log(`[EmbeddingRetriever] Loaded ${Object.keys(embeddings).length} pre-computed embeddings`);
  } catch (error) {
    console.warn(`[EmbeddingRetriever] Failed to load pre-computed embeddings:`, error);
    throw error;
  }
}

// ============================================
// In-Memory Vector Store
// ============================================

import type { IVectorStore, Embedding, VectorSearchResult } from "./types";

/**
 * In-Memory Vector Store
 *
 * Simple vector store for demo purposes with cosine similarity search.
 * For production, use pgvector, Pinecone, Weaviate, or similar.
 *
 * Features:
 * - In-memory storage with Map
 * - Cosine similarity for distance metric
 * - Optional persistence to localStorage
 */
export class InMemoryVectorStore implements IVectorStore {
  private vectors: Map<string, { embedding: Embedding; metadata?: Record<string, unknown> }> = new Map();
  private storageKey: string | null = null;

  constructor(options?: { persistToLocalStorage?: boolean; storageKey?: string }) {
    if (options?.persistToLocalStorage) {
      this.storageKey = options.storageKey || "vector-store";
      this.loadFromLocalStorage();
    }
  }

  /**
   * Add embedding to store
   */
  async add(id: string, embedding: Embedding, metadata?: Record<string, unknown>): Promise<void> {
    this.vectors.set(id, { embedding, metadata });

    if (this.storageKey) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Search for similar embeddings using cosine similarity
   */
  async search(queryEmbedding: Embedding, limit: number): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const [id, { embedding, metadata }] of this.vectors) {
      const similarity = this.cosineSimilarity(queryEmbedding.vector, embedding.vector);

      results.push({
        id,
        score: similarity,
        metadata,
      });
    }

    // Sort by similarity (highest first) and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get embedding by ID
   */
  async get(id: string): Promise<{ embedding: Embedding; metadata?: Record<string, unknown> } | null> {
    return this.vectors.get(id) || null;
  }

  /**
   * Check if embedding exists
   */
  async has(id: string): Promise<boolean> {
    return this.vectors.has(id);
  }

  /**
   * Clear all embeddings
   */
  async clear(): Promise<void> {
    this.vectors.clear();

    if (this.storageKey && typeof localStorage !== "undefined") {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get number of vectors in store
   */
  size(): number {
    return this.vectors.size;
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
   * Returns value between -1 and 1 (higher is more similar)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have same dimensions");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Save vectors to localStorage (for demo persistence)
   */
  private saveToLocalStorage(): void {
    if (!this.storageKey || typeof localStorage === "undefined") {
      return;
    }

    try {
      const data: Record<string, { embedding: Embedding; metadata?: Record<string, unknown> }> = {};

      for (const [id, value] of this.vectors) {
        data[id] = value;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save vectors to localStorage:", error);
    }
  }

  /**
   * Load vectors from localStorage
   */
  private loadFromLocalStorage(): void {
    if (!this.storageKey || typeof localStorage === "undefined") {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);

      if (stored) {
        const data = JSON.parse(stored) as Record<string, { embedding: Embedding; metadata?: Record<string, unknown> }>;

        for (const [id, value] of Object.entries(data)) {
          this.vectors.set(id, value);
        }
      }
    } catch (error) {
      console.warn("Failed to load vectors from localStorage:", error);
    }
  }
}

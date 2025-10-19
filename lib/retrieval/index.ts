// ============================================
// Retrieval Module Public API
// ============================================

// Types
export type {
  IRetriever,
  RetrievalResult,
  IVectorStore,
  Embedding,
  VectorSearchResult,
  BM25Params,
  DocumentStats,
  CorpusStats,
  RRFParams,
  RankedResult,
  MMRParams,
  IReranker,
  HybridRetrievalConfig,
  RetrievalMetrics,
} from "./types";

// Retrievers
export { BM25Retriever } from "./BM25Retriever";
export {
  EmbeddingRetriever,
  createSimpleEmbedding,
  simpleEmbedFn,
  loadPrecomputedEmbeddings,
} from "./EmbeddingRetriever";
export type { EmbeddingFunction } from "./EmbeddingRetriever";
export { HybridRetriever } from "./HybridRetriever";

// Utilities
export { InMemoryVectorStore } from "./VectorStore";
export { MMRDiversifier } from "./MMRDiversifier";

// Factory function for easy setup
import type { CourseMaterial } from "@/lib/models/types";
import type { HybridRetrievalConfig } from "./types";
import { BM25Retriever } from "./BM25Retriever";
import { EmbeddingRetriever, simpleEmbedFn } from "./EmbeddingRetriever";
import { HybridRetriever } from "./HybridRetriever";
import { InMemoryVectorStore } from "./VectorStore";
import { MMRDiversifier } from "./MMRDiversifier";

/**
 * Create a hybrid retriever with default configuration
 *
 * Convenience factory function that sets up:
 * - BM25 retriever for sparse search
 * - Embedding retriever for dense search
 * - Hybrid retriever with RRF fusion
 * - MMR diversification
 *
 * @param materials - Course materials to index
 * @param config - Optional configuration
 * @returns Configured hybrid retriever
 *
 * @example
 * ```typescript
 * const retriever = createHybridRetriever(materials, {
 *   useRRF: true,
 *   rrfK: 60,
 *   useMMR: true,
 *   mmrLambda: 0.7,
 * });
 *
 * const results = await retriever.retrieve("How does binary search work?", 10);
 * ```
 */
export async function createHybridRetriever(
  materials: CourseMaterial[],
  config?: HybridRetrievalConfig
): Promise<{ retriever: HybridRetriever; mmr: MMRDiversifier }> {
  // Create BM25 retriever
  const bm25Retriever = new BM25Retriever(materials, {
    k1: config?.bm25K1 ?? 1.5,
    b: config?.bm25B ?? 0.75,
  });

  // Create embedding retriever
  const vectorStore = new InMemoryVectorStore({
    persistToLocalStorage: true,
    storageKey: "quokka-vectors",
  });

  const embeddingRetriever = new EmbeddingRetriever(
    materials,
    vectorStore,
    simpleEmbedFn // Use simple embedding for demo (replace with real model in production)
  );

  // Initialize embedding retriever (embed all materials)
  await embeddingRetriever.initialize();

  // Create hybrid retriever
  const hybridRetriever = new HybridRetriever(
    bm25Retriever,
    embeddingRetriever,
    materials,
    config
  );

  // Create MMR diversifier
  const mmr = new MMRDiversifier({
    lambda: config?.mmrLambda ?? 0.7,
  });

  return { retriever: hybridRetriever, mmr };
}

/**
 * Create a simple BM25-only retriever
 *
 * Use when you don't need semantic search or want faster performance.
 *
 * @param materials - Course materials to index
 * @param config - Optional BM25 parameters
 * @returns Configured BM25 retriever
 */
export function createBM25Retriever(
  materials: CourseMaterial[],
  config?: { k1?: number; b?: number }
): BM25Retriever {
  return new BM25Retriever(materials, config);
}

/**
 * Create an embedding-only retriever
 *
 * Use when you want semantic search without keyword matching.
 *
 * @param materials - Course materials to index
 * @param embedFn - Optional custom embedding function
 * @returns Configured embedding retriever (needs initialization)
 */
export async function createEmbeddingRetriever(
  materials: CourseMaterial[],
  embedFn = simpleEmbedFn
): Promise<EmbeddingRetriever> {
  const vectorStore = new InMemoryVectorStore({
    persistToLocalStorage: true,
    storageKey: "quokka-vectors",
  });

  const retriever = new EmbeddingRetriever(materials, vectorStore, embedFn);

  // Initialize (embed all materials)
  await retriever.initialize();

  return retriever;
}

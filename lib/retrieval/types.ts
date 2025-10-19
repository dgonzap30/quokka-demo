// ============================================
// Retrieval Module Types
// ============================================

import type { CourseMaterial } from "@/lib/models/types";

/**
 * Retrieval result with score
 */
export interface RetrievalResult {
  material: CourseMaterial;
  score: number;
  matchedTerms?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Base retriever interface
 */
export interface IRetriever {
  /**
   * Retrieve relevant materials for a query
   * @param query - User's query string
   * @param limit - Maximum number of results to return
   * @returns Sorted results (highest score first)
   */
  retrieve(query: string, limit?: number): Promise<RetrievalResult[]>;
}

/**
 * BM25 parameters
 */
export interface BM25Params {
  k1: number;  // Term frequency saturation parameter (typical: 1.2-2.0)
  b: number;   // Length normalization parameter (typical: 0.75)
}

/**
 * Document statistics for BM25
 */
export interface DocumentStats {
  docId: string;
  docLength: number;
  termFrequencies: Map<string, number>;
}

/**
 * Corpus statistics for BM25
 */
export interface CorpusStats {
  numDocuments: number;
  avgDocLength: number;
  documentFrequencies: Map<string, number>; // How many docs contain each term
}

/**
 * Embedding vector
 */
export interface Embedding {
  vector: number[];
  dimensions: number;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Vector store interface
 */
export interface IVectorStore {
  /**
   * Add embedding to store
   */
  add(id: string, embedding: Embedding, metadata?: Record<string, unknown>): Promise<void>;

  /**
   * Search for similar embeddings
   */
  search(queryEmbedding: Embedding, limit: number): Promise<VectorSearchResult[]>;

  /**
   * Get embedding by ID
   */
  get(id: string): Promise<{ embedding: Embedding; metadata?: Record<string, unknown> } | null>;

  /**
   * Check if embedding exists
   */
  has(id: string): Promise<boolean>;

  /**
   * Clear all embeddings
   */
  clear(): Promise<void>;
}

/**
 * Reciprocal Rank Fusion (RRF) parameters
 */
export interface RRFParams {
  k: number; // Constant for RRF formula (typical: 60)
}

/**
 * Ranked result for fusion
 */
export interface RankedResult {
  id: string;
  rank: number;
  score: number;
  source: string; // Which retriever produced this result
  material: CourseMaterial;
}

/**
 * MMR (Maximal Marginal Relevance) parameters
 */
export interface MMRParams {
  lambda: number; // Balance between relevance and diversity (0-1, typical: 0.7)
}

/**
 * Reranker interface
 */
export interface IReranker {
  /**
   * Rerank results using cross-encoder or other method
   * @param query - Original query
   * @param results - Results to rerank
   * @param limit - Maximum number of results to return
   */
  rerank(query: string, results: RetrievalResult[], limit?: number): Promise<RetrievalResult[]>;
}

/**
 * Hybrid retrieval configuration
 */
export interface HybridRetrievalConfig {
  bm25Weight?: number;        // Weight for BM25 results (0-1, default: 0.5)
  embeddingWeight?: number;   // Weight for embedding results (0-1, default: 0.5)
  useRRF?: boolean;           // Use RRF fusion (default: true)
  rrfK?: number;              // RRF k parameter (default: 60)
  useMMR?: boolean;           // Apply MMR diversification (default: true)
  mmrLambda?: number;         // MMR lambda parameter (default: 0.7)
  useReranker?: boolean;      // Apply reranking (default: false, adds latency)
  bm25K1?: number;            // BM25 k1 parameter (default: 1.5)
  bm25B?: number;             // BM25 b parameter (default: 0.75)
}

/**
 * Retrieval metrics for monitoring
 */
export interface RetrievalMetrics {
  queryTime: number;          // Total query time in ms
  bm25Time?: number;          // Time spent in BM25 retrieval
  embeddingTime?: number;     // Time spent in embedding retrieval
  fusionTime?: number;        // Time spent in fusion
  mmrTime?: number;           // Time spent in MMR
  rerankTime?: number;        // Time spent in reranking
  resultsCount: number;       // Number of results returned
  cacheHit?: boolean;         // Whether cache was hit (if caching enabled)
}

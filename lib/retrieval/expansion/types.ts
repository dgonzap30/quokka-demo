// ============================================
// PRF (Query Expansion) Types
// ============================================

import type { CourseMaterial } from "@/lib/models/types";

/**
 * Expansion algorithm type
 */
export type ExpansionAlgorithm = "rocchio" | "relevance-model" | "query-biased-tfidf";

/**
 * Term weighting method
 */
export type TermWeightingMethod = "tfidf" | "bm25" | "query-biased";

/**
 * Query expansion configuration
 */
export interface QueryExpansionConfig {
  /** Expansion algorithm */
  algorithm: ExpansionAlgorithm;

  /** Term weighting method */
  termWeighting: TermWeightingMethod;

  /** Number of top documents to use for expansion (pseudo-relevance feedback) */
  topK: number;

  /** Number of expansion terms to add */
  expansionTerms: number;

  /** Original query weight (Rocchio alpha) */
  originalQueryWeight: number;

  /** Relevant documents weight (Rocchio beta) */
  relevantDocsWeight: number;

  /** MMR diversity parameter (0 = max relevance, 1 = max diversity) */
  mmrLambda: number;

  /** Minimum term frequency threshold */
  minTermFrequency: number;

  /** Maximum term frequency threshold (filter stop words) */
  maxTermFrequency: number;

  /** Enable stemming/lemmatization */
  enableStemming: boolean;
}

/**
 * Candidate expansion term with scoring
 */
export interface ExpansionTerm {
  /** The term */
  term: string;

  /** Relevance score (0-1) */
  relevance: number;

  /** Frequency in top-K documents */
  frequency: number;

  /** IDF score */
  idf: number;

  /** Combined weight (relevance * IDF) */
  weight: number;

  /** Source material IDs where term appears */
  sourceMaterialIds: string[];
}

/**
 * Query expansion result
 */
export interface QueryExpansionResult {
  /** Original query */
  originalQuery: string;

  /** Expanded query (original + expansion terms) */
  expandedQuery: string;

  /** Selected expansion terms (sorted by weight DESC) */
  expansionTerms: ExpansionTerm[];

  /** Number of documents used for expansion */
  documentsUsed: number;

  /** Expansion algorithm used */
  algorithm: ExpansionAlgorithm;

  /** Expansion timestamp */
  expandedAt: string;

  /** Expansion metrics */
  metrics: ExpansionMetrics;
}

/**
 * Query expansion metrics
 */
export interface ExpansionMetrics {
  /** Expansion time (ms) */
  expansionTime: number;

  /** Number of candidate terms considered */
  candidateTermsCount: number;

  /** Number of terms added to query */
  termsAdded: number;

  /** Average term weight */
  avgTermWeight: number;

  /** Average term relevance */
  avgTermRelevance: number;
}

/**
 * Document relevance for expansion
 */
export interface RelevantDocument {
  /** Material */
  material: CourseMaterial;

  /** Relevance score (0-1) */
  relevance: number;

  /** Terms extracted from this document */
  terms: string[];
}

/**
 * Term statistics for TF-IDF
 */
export interface TermStatistics {
  /** Term */
  term: string;

  /** Term frequency in document */
  tf: number;

  /** Document frequency across corpus */
  df: number;

  /** Inverse document frequency */
  idf: number;

  /** TF-IDF score */
  tfidf: number;
}

/**
 * Default configuration
 */
export const DEFAULT_QUERY_EXPANSION_CONFIG: QueryExpansionConfig = {
  algorithm: "rocchio",
  termWeighting: "query-biased",
  topK: 5, // Use top 5 documents for expansion
  expansionTerms: 3, // Add 3 expansion terms
  originalQueryWeight: 1.0, // Rocchio alpha
  relevantDocsWeight: 0.8, // Rocchio beta
  mmrLambda: 0.7, // 70% relevance, 30% diversity
  minTermFrequency: 2, // Term must appear at least twice
  maxTermFrequency: 0.5, // Term can't appear in >50% of docs (stop word filter)
  enableStemming: false, // Simple implementation, no stemming
};

// ============================================
// PRF (Query Expansion) Module Exports
// ============================================

/**
 * Public API for lib/retrieval/expansion
 *
 * PRF (Pseudo-Relevance Feedback) System:
 * Expands queries using Rocchio algorithm and top-K retrieved documents.
 *
 * Algorithm Flow:
 * 1. Retrieve top-K documents for initial query
 * 2. Extract candidate expansion terms from top-K docs
 * 3. Compute term weights (TF-IDF or query-biased)
 * 4. Select top-N terms using MMR (relevance + diversity)
 * 5. Append expansion terms to original query
 *
 * @example
 * ```typescript
 * import { QueryExpander } from "@/lib/retrieval/expansion";
 * import type { QueryExpansionResult } from "@/lib/retrieval/expansion";
 *
 * // 1. Initialize expander and corpus
 * const expander = new QueryExpander({
 *   algorithm: "rocchio",
 *   termWeighting: "query-biased",
 *   topK: 5,
 *   expansionTerms: 3,
 *   mmrLambda: 0.7, // 70% relevance, 30% diversity
 * });
 *
 * expander.initializeCorpus(courseMaterials);
 *
 * // 2. Expand query using top-K retrieved documents
 * const result = expander.expandQuery(
 *   "What is quicksort?",
 *   topKMaterials
 * );
 *
 * console.log(`Original: ${result.originalQuery}`);
 * console.log(`Expanded: ${result.expandedQuery}`);
 * console.log(`Added ${result.expansionTerms.length} terms:`);
 * result.expansionTerms.forEach((term) => {
 *   console.log(`  - ${term.term} (weight: ${term.weight.toFixed(2)})`);
 * });
 *
 * // 3. Use expanded query for second-round retrieval
 * const secondRoundResults = await retrieve(result.expandedQuery);
 * ```
 */

// Export types
export type {
  // Configuration
  ExpansionAlgorithm,
  TermWeightingMethod,
  QueryExpansionConfig,

  // Results
  QueryExpansionResult,
  ExpansionTerm,
  RelevantDocument,
  TermStatistics,

  // Metrics
  ExpansionMetrics,
} from "./types";

// Export default configuration
export { DEFAULT_QUERY_EXPANSION_CONFIG } from "./types";

// Export classes
export { QueryExpander } from "./QueryExpander";

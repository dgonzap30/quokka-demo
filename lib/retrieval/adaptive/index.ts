// ============================================
// Adaptive Retrieval (Self-RAG) Module Exports
// ============================================

/**
 * Public API for lib/retrieval/adaptive
 *
 * Self-RAG (Adaptive Retrieval) System:
 * Routes queries based on confidence scoring to optimize cost/quality trade-off.
 *
 * Three-tier routing:
 * - High confidence (80+): Cache or standard retrieval
 * - Medium confidence (50-79): Standard or expanded retrieval
 * - Low confidence (<50): Aggressive retrieval with multiple strategies
 *
 * @example
 * ```typescript
 * import { ConfidenceScorer, AdaptiveRouter } from "@/lib/retrieval/adaptive";
 *
 * // 1. Initialize scorer and router
 * const scorer = new ConfidenceScorer();
 * scorer.initializeCorpus(courseMaterials);
 *
 * const router = new AdaptiveRouter(scorer);
 *
 * // 2. Route a query
 * const decision = await router.routeQuery("What is quicksort?");
 *
 * // 3. Execute based on routing decision
 * if (decision.action === "use-cache") {
 *   // Use cached result
 *   const cached = router.getFromCache(decision.cacheKey!);
 * } else if (decision.shouldUseAggressiveRetrieval) {
 *   // Aggressive retrieval
 * } else if (decision.shouldExpand) {
 *   // Query expansion
 * } else {
 *   // Standard retrieval
 * }
 *
 * // 4. Cache successful results
 * router.cacheResult(query, result, decision.confidenceScore.score);
 *
 * // 5. Monitor metrics
 * const metrics = router.getMetrics();
 * console.log(`Cache hit rate: ${metrics.cache.hitRate * 100}%`);
 * console.log(`Cost savings: $${metrics.costSavings.estimatedDollarsSaved}`);
 * ```
 */

// Export types
export type {
  ConfidenceLevel,
  ConfidenceScore,
  LexicalFeatures,
  SemanticFeatures,
  HistoricalFeatures,
  FeatureBreakdown,
  RoutingAction,
  RoutingDecision,
  CacheEntry,
  CacheStats,
  ConfidenceScorerConfig,
  AdaptiveRouterConfig,
  SelfRAGMetrics,
  QueryHistoryEntry,
} from "./types";

// Export default configurations
export {
  DEFAULT_CONFIDENCE_SCORER_CONFIG,
  DEFAULT_ADAPTIVE_ROUTER_CONFIG,
} from "./types";

// Export classes
export { ConfidenceScorer } from "./ConfidenceScorer";
export { AdaptiveRouter } from "./AdaptiveRouter";

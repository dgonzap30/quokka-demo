// ============================================
// AdaptiveRouter: Confidence-Based Query Routing
// ============================================

import type {
  RoutingDecision,
  RoutingAction,
  AdaptiveRouterConfig,
  CacheEntry,
  CacheStats,
  SelfRAGMetrics,
  QueryHistoryEntry,
  ConfidenceScore,
} from "./types";
import { DEFAULT_ADAPTIVE_ROUTER_CONFIG } from "./types";
import { ConfidenceScorer } from "./ConfidenceScorer";

/**
 * AdaptiveRouter: Routes queries based on confidence scores
 *
 * Three-tier routing strategy:
 * - High confidence (80+): Use cache or standard retrieval
 * - Medium confidence (50-79): Standard or expanded retrieval
 * - Low confidence (<50): Aggressive retrieval with multiple strategies
 *
 * Maintains query cache and tracks metrics for monitoring.
 */
export class AdaptiveRouter {
  private config: AdaptiveRouterConfig;
  private scorer: ConfidenceScorer;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private metrics: SelfRAGMetrics;

  constructor(
    scorer: ConfidenceScorer,
    config: Partial<AdaptiveRouterConfig> = {}
  ) {
    this.config = { ...DEFAULT_ADAPTIVE_ROUTER_CONFIG, ...config };
    this.scorer = scorer;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Route a query based on confidence score
   */
  public async routeQuery(
    query: string,
    queryHistory?: QueryHistoryEntry[]
  ): Promise<RoutingDecision> {
    // 1. Score query confidence
    const confidenceScore = this.scorer.scoreQuery(query, queryHistory);

    // 2. Check cache for high-confidence queries
    if (this.config.routing.enableCache && confidenceScore.level === "high") {
      const cacheKey = this.generateCacheKey(query);
      const cachedEntry = this.getFromCache<unknown>(cacheKey);

      if (cachedEntry) {
        // Cache hit!
        this.updateMetrics("use-cache", confidenceScore);

        return {
          action: "use-cache",
          shouldRetrieve: false,
          shouldExpand: false,
          shouldUseAggressiveRetrieval: false,
          cacheKey,
          reasoning: "High confidence query with cache hit. Using cached result.",
          confidenceScore,
          decidedAt: new Date().toISOString(),
        };
      }
    }

    // 3. Route based on confidence level
    const action = this.determineAction(confidenceScore);
    const decision = this.createRoutingDecision(action, confidenceScore, query);

    // 4. Update metrics
    this.updateMetrics(action, confidenceScore);

    return decision;
  }

  /**
   * Cache a query result
   */
  public cacheResult<T>(query: string, result: T, confidence: number): void {
    if (!this.config.cache.enabled) return;

    const cacheKey = this.generateCacheKey(query);

    // Determine TTL based on confidence level
    const level = confidence >= 75 ? "high" : confidence >= 50 ? "medium" : "low";
    const ttl = this.config.cache.ttlByConfidence[level];

    const entry: CacheEntry<T> = {
      value: result,
      confidence,
      cachedAt: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };

    this.cache.set(cacheKey, entry as CacheEntry<unknown>);

    // Enforce max cache size (LRU eviction)
    if (this.cache.size > this.config.cache.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Get result from cache
   */
  public getFromCache<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now - entry.cachedAt > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = now;

    return entry.value;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): CacheStats {
    const stats: CacheStats = {
      size: this.cache.size,
      hits: this.metrics.cache.hits,
      misses: this.metrics.cache.misses,
      hitRate: this.metrics.cache.hitRate,
      memoryUsage: this.estimateCacheMemoryUsage(),
      evictions: this.metrics.cache.evictions,
    };

    return stats;
  }

  /**
   * Get Self-RAG metrics
   */
  public getMetrics(): SelfRAGMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // ============================================
  // Private Methods
  // ============================================

  private determineAction(confidenceScore: ConfidenceScore): RoutingAction {
    const { score, level } = confidenceScore;

    // High confidence: standard retrieval (cache checked earlier)
    if (level === "high" || score >= this.config.thresholds.high) {
      return "retrieve-standard";
    }

    // Medium confidence: check if expansion is needed
    if (level === "medium" || score >= this.config.thresholds.low) {
      if (
        this.config.routing.enableExpansion &&
        score < this.config.routing.expansionConfidenceThreshold
      ) {
        return "retrieve-expanded";
      }
      return "retrieve-standard";
    }

    // Low confidence: aggressive retrieval
    if (this.config.routing.enableAggressiveRetrieval) {
      return "retrieve-aggressive";
    }

    // Fallback to expanded if aggressive disabled
    return this.config.routing.enableExpansion
      ? "retrieve-expanded"
      : "retrieve-standard";
  }

  private createRoutingDecision(
    action: RoutingAction,
    confidenceScore: ConfidenceScore,
    query: string
  ): RoutingDecision {
    const shouldRetrieve = action !== "use-cache";
    const shouldExpand = action === "retrieve-expanded" || action === "retrieve-aggressive";
    const shouldUseAggressiveRetrieval = action === "retrieve-aggressive";

    const reasoning = this.generateRoutingReasoning(action, confidenceScore);

    const decision: RoutingDecision = {
      action,
      shouldRetrieve,
      shouldExpand,
      shouldUseAggressiveRetrieval,
      reasoning,
      confidenceScore,
      decidedAt: new Date().toISOString(),
    };

    // Add cache key for high-confidence queries
    if (confidenceScore.level === "high") {
      decision.cacheKey = this.generateCacheKey(query);
    }

    return decision;
  }

  private generateRoutingReasoning(
    action: RoutingAction,
    confidenceScore: ConfidenceScore
  ): string {
    const { score, level } = confidenceScore;

    switch (action) {
      case "use-cache":
        return `High confidence (${score}) with cache hit. Using cached result to save costs and reduce latency.`;

      case "retrieve-standard":
        if (level === "high") {
          return `High confidence (${score}). Standard retrieval is sufficient. Result will be cached.`;
        }
        return `Medium confidence (${score}). Standard retrieval without query expansion.`;

      case "retrieve-expanded":
        return `Medium confidence (${score} < ${this.config.routing.expansionConfidenceThreshold}). Using query expansion to improve recall.`;

      case "retrieve-aggressive":
        return `Low confidence (${score}). Using aggressive retrieval with multiple strategies (BM25 + embeddings + expansion + reranking).`;

      default:
        return `Routing to ${action} based on confidence score ${score}.`;
    }
  }

  private generateCacheKey(query: string): string {
    // Simple normalization for cache key
    const normalized = query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, "-"); // Replace spaces with hyphens

    return `query:${normalized}`;
  }

  private evictLRU(): void {
    // Find entry with oldest lastAccessedAt
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.cache.evictions++;
    }
  }

  private estimateCacheMemoryUsage(): number {
    // Rough estimate: each entry ~1KB
    return this.cache.size * 1024;
  }

  private initializeMetrics(): SelfRAGMetrics {
    return {
      totalQueries: 0,
      routing: {
        cacheHits: 0,
        standardRetrievals: 0,
        expandedRetrievals: 0,
        aggressiveRetrievals: 0,
      },
      confidence: {
        high: 0,
        medium: 0,
        low: 0,
      },
      cache: {
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryUsage: 0,
        evictions: 0,
      },
      avgConfidenceScore: 0,
      costSavings: {
        queriesSaved: 0,
        estimatedDollarsSaved: 0,
      },
      performance: {
        avgScoringTime: 0,
        avgRoutingTime: 0,
        avgCacheLookupTime: 0,
      },
    };
  }

  private updateMetrics(action: RoutingAction, confidenceScore: ConfidenceScore): void {
    this.metrics.totalQueries++;

    // Update routing counts
    switch (action) {
      case "use-cache":
        this.metrics.routing.cacheHits++;
        this.metrics.cache.hits++;
        this.metrics.costSavings.queriesSaved++;
        break;
      case "retrieve-standard":
        this.metrics.routing.standardRetrievals++;
        this.metrics.cache.misses++;
        break;
      case "retrieve-expanded":
        this.metrics.routing.expandedRetrievals++;
        this.metrics.cache.misses++;
        break;
      case "retrieve-aggressive":
        this.metrics.routing.aggressiveRetrievals++;
        this.metrics.cache.misses++;
        break;
    }

    // Update confidence distribution
    switch (confidenceScore.level) {
      case "high":
        this.metrics.confidence.high++;
        break;
      case "medium":
        this.metrics.confidence.medium++;
        break;
      case "low":
        this.metrics.confidence.low++;
        break;
    }

    // Update average confidence score
    this.metrics.avgConfidenceScore =
      (this.metrics.avgConfidenceScore * (this.metrics.totalQueries - 1) +
        confidenceScore.score) /
      this.metrics.totalQueries;

    // Update cache stats
    this.metrics.cache.size = this.cache.size;
    this.metrics.cache.hitRate =
      this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses);
    this.metrics.cache.memoryUsage = this.estimateCacheMemoryUsage();

    // Estimate cost savings (rough estimate: $0.001 per query)
    this.metrics.costSavings.estimatedDollarsSaved =
      this.metrics.costSavings.queriesSaved * 0.001;
  }
}

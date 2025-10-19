// ============================================
// Self-RAG (Adaptive Retrieval) Types
// ============================================

/**
 * Confidence level classification
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Confidence score with reasoning
 */
export interface ConfidenceScore {
  /** Overall confidence score (0-100) */
  score: number;

  /** Confidence level classification */
  level: ConfidenceLevel;

  /** Feature breakdown showing contribution of each component */
  features: FeatureBreakdown;

  /** Human-readable reasoning for the score */
  reasoning: string;

  /** Timestamp of scoring */
  scoredAt: string;
}

/**
 * Feature breakdown for confidence scoring
 */
export interface FeatureBreakdown {
  /** Lexical features contribution (0-100) */
  lexical: LexicalFeatures;

  /** Semantic features contribution (0-100) */
  semantic: SemanticFeatures;

  /** Historical features contribution (0-100) */
  historical: HistoricalFeatures;

  /** Weighted scores */
  weights: {
    lexical: number;    // Weight for lexical features (default: 0.4)
    semantic: number;   // Weight for semantic features (default: 0.4)
    historical: number; // Weight for historical features (default: 0.2)
  };
}

/**
 * Lexical features extracted from query text
 */
export interface LexicalFeatures {
  /** Query length in words */
  queryLength: number;

  /** Query specificity score (0-100) */
  specificity: number;

  /** Has course code (e.g., "CS101") */
  hasCourseCode: boolean;

  /** Has week number (e.g., "week 3") */
  hasWeekNumber: boolean;

  /** Count of technical terms */
  technicalTermCount: number;

  /** Count of generic pronouns (it, this, that) */
  genericPronounCount: number;

  /** Lexical confidence score (0-100) */
  score: number;
}

/**
 * Semantic features extracted from query meaning
 */
export interface SemanticFeatures {
  /** Keyword coverage: % of query terms found in corpus (0-1) */
  keywordCoverage: number;

  /** Ambiguity score: lower = less ambiguous (0-1) */
  ambiguity: number;

  /** Topic focus: single topic (low) vs multi-topic (high) (0-1) */
  topicFocus: number;

  /** Semantic confidence score (0-100) */
  score: number;
}

/**
 * Historical features from past interactions
 */
export interface HistoricalFeatures {
  /** Past query success rate for similar queries (0-1) */
  pastSuccessRate: number;

  /** Similarity to past successful queries (0-1) */
  similarityToPast: number;

  /** User familiarity with topic (0-1) */
  userFamiliarity: number;

  /** Cache hit probability (0-1) */
  cacheHitProbability: number;

  /** Historical confidence score (0-100) */
  score: number;
}

/**
 * Routing action to take
 */
export type RoutingAction =
  | "use-cache"           // Use cached result (high confidence + cache hit)
  | "retrieve-standard"   // Standard retrieval (high/medium confidence)
  | "retrieve-expanded"   // Retrieval with query expansion (medium confidence)
  | "retrieve-aggressive"; // Aggressive retrieval with multiple strategies (low confidence)

/**
 * Routing decision with metadata
 */
export interface RoutingDecision {
  /** Action to take */
  action: RoutingAction;

  /** Should perform retrieval? */
  shouldRetrieve: boolean;

  /** Should expand query? */
  shouldExpand: boolean;

  /** Should use aggressive retrieval? */
  shouldUseAggressiveRetrieval: boolean;

  /** Cache key (if using cache) */
  cacheKey?: string;

  /** Reasoning for decision */
  reasoning: string;

  /** Confidence score that led to this decision */
  confidenceScore: ConfidenceScore;

  /** Timestamp of decision */
  decidedAt: string;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;

  /** Confidence score when cached */
  confidence: number;

  /** Timestamp when cached */
  cachedAt: number;

  /** Time-to-live in milliseconds */
  ttl: number;

  /** Number of times accessed */
  accessCount: number;

  /** Last accessed timestamp */
  lastAccessedAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache entries */
  size: number;

  /** Cache hit count */
  hits: number;

  /** Cache miss count */
  misses: number;

  /** Cache hit rate (0-1) */
  hitRate: number;

  /** Total memory usage (bytes) */
  memoryUsage: number;

  /** Eviction count */
  evictions: number;
}

/**
 * Confidence scorer configuration
 */
export interface ConfidenceScorerConfig {
  /** Feature weights */
  weights: {
    lexical: number;    // Default: 0.4
    semantic: number;   // Default: 0.4
    historical: number; // Default: 0.2
  };

  /** Lexical thresholds */
  lexical: {
    minQueryLength: number;           // Default: 3 words
    maxQueryLength: number;           // Default: 50 words
    minSpecificity: number;           // Default: 0.3 (0-1)
    technicalTermWeight: number;      // Default: 0.2
    genericPronounPenalty: number;    // Default: 0.1
  };

  /** Semantic thresholds */
  semantic: {
    minKeywordCoverage: number;  // Default: 0.3 (30%)
    maxAmbiguity: number;        // Default: 0.7 (0-1)
    minTopicFocus: number;       // Default: 0.4 (0-1)
  };

  /** Historical thresholds */
  historical: {
    minPastSuccessRate: number;    // Default: 0.5 (50%)
    similarityThreshold: number;   // Default: 0.8 (cosine similarity)
    minUserFamiliarity: number;    // Default: 0.3 (0-1)
  };

  /** Enable historical features (may not have data initially) */
  enableHistorical: boolean; // Default: true
}

/**
 * Adaptive router configuration
 */
export interface AdaptiveRouterConfig {
  /** Confidence thresholds for routing */
  thresholds: {
    high: number;   // Default: 80 (score >= 80)
    low: number;    // Default: 50 (score < 50)
  };

  /** Cache configuration */
  cache: {
    enabled: boolean;              // Default: true
    maxSize: number;               // Default: 1000 entries
    ttlByConfidence: {
      high: number;                // Default: 24h (86400000ms)
      medium: number;              // Default: 12h (43200000ms)
      low: number;                 // Default: 6h (21600000ms)
    };
    enableFuzzyMatching: boolean;  // Default: false (exact key match)
    fuzzySimilarityThreshold: number; // Default: 0.95 (cosine similarity)
  };

  /** Routing rules */
  routing: {
    enableCache: boolean;                  // Default: true
    enableExpansion: boolean;              // Default: true
    enableAggressiveRetrieval: boolean;    // Default: true
    expansionConfidenceThreshold: number;  // Default: 65 (expand if < 65)
  };
}

/**
 * Self-RAG metrics for monitoring
 */
export interface SelfRAGMetrics {
  /** Total queries processed */
  totalQueries: number;

  /** Routing decisions breakdown */
  routing: {
    cacheHits: number;
    standardRetrievals: number;
    expandedRetrievals: number;
    aggressiveRetrievals: number;
  };

  /** Confidence distribution */
  confidence: {
    high: number;
    medium: number;
    low: number;
  };

  /** Cache statistics */
  cache: CacheStats;

  /** Average confidence score */
  avgConfidenceScore: number;

  /** Routing accuracy (if ground truth available) */
  routingAccuracy?: number;

  /** Cost savings from caching */
  costSavings: {
    queriesSaved: number;
    estimatedDollarsSaved: number;
  };

  /** Performance metrics */
  performance: {
    avgScoringTime: number;     // ms
    avgRoutingTime: number;     // ms
    avgCacheLookupTime: number; // ms
  };
}

/**
 * Query history entry for learning
 */
export interface QueryHistoryEntry {
  /** Original query */
  query: string;

  /** Normalized query (for matching) */
  normalizedQuery: string;

  /** Course context */
  courseId?: string;

  /** Confidence score at query time */
  confidence: ConfidenceScore;

  /** Routing decision made */
  routing: RoutingDecision;

  /** Was retrieval successful? */
  success: boolean;

  /** User feedback (if available) */
  userFeedback?: "positive" | "negative" | "neutral";

  /** Timestamp */
  timestamp: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIDENCE_SCORER_CONFIG: ConfidenceScorerConfig = {
  weights: {
    lexical: 0.4,
    semantic: 0.4,
    historical: 0.2,
  },
  lexical: {
    minQueryLength: 3,
    maxQueryLength: 50,
    minSpecificity: 0.3,
    technicalTermWeight: 0.2,
    genericPronounPenalty: 0.1,
  },
  semantic: {
    minKeywordCoverage: 0.3,
    maxAmbiguity: 0.7,
    minTopicFocus: 0.4,
  },
  historical: {
    minPastSuccessRate: 0.5,
    similarityThreshold: 0.8,
    minUserFamiliarity: 0.3,
  },
  enableHistorical: true,
};

export const DEFAULT_ADAPTIVE_ROUTER_CONFIG: AdaptiveRouterConfig = {
  thresholds: {
    high: 80,
    low: 50,
  },
  cache: {
    enabled: true,
    maxSize: 1000,
    ttlByConfidence: {
      high: 86400000,  // 24 hours
      medium: 43200000, // 12 hours
      low: 21600000,    // 6 hours
    },
    enableFuzzyMatching: false,
    fuzzySimilarityThreshold: 0.95,
  },
  routing: {
    enableCache: true,
    enableExpansion: true,
    enableAggressiveRetrieval: true,
    expansionConfidenceThreshold: 65,
  },
};

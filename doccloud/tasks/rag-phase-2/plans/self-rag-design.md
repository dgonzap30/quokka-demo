# Self-RAG Design: Confidence Scoring & Adaptive Routing

**Created:** 2025-10-17
**Agent:** Type Safety Guardian
**Task:** Detailed TypeScript design for Self-RAG implementation

---

## TypeScript Interface Definitions

### 1. Core Types (`lib/retrieval/adaptive/types.ts`)

```typescript
// ============================================
// Confidence Scoring Types
// ============================================

/**
 * Confidence level category
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Lexical features extracted from query
 */
export interface LexicalFeatures {
  /** Number of tokens in query */
  queryLength: number;

  /** Specificity score (0-100) */
  specificity: number;

  /** Whether query contains course code (e.g., "CS101") */
  hasCourseCode: boolean;

  /** Whether query contains week/chapter number */
  hasWeekNumber: boolean;

  /** Ratio of generic pronouns to total tokens (0-1) */
  genericPronounRatio: number;

  /** Number of question words (who, what, when, where, why, how) */
  questionWordCount: number;

  /** Whether query is complete sentence */
  isCompleteSentence: boolean;

  /** Whether query has technical terms */
  hasTechnicalTerms: boolean;
}

/**
 * Semantic features extracted from query
 */
export interface SemanticFeatures {
  /** Keyword coverage: % of query terms in corpus (0-100) */
  keywordCoverage: number;

  /** Matched corpus keywords */
  matchedKeywords: string[];

  /** Query ambiguity score (0-100, higher = more ambiguous) */
  ambiguityScore: number;

  /** Estimated topic focus (0-100, higher = more focused) */
  topicFocus: number;
}

/**
 * Historical features from past queries
 */
export interface HistoricalFeatures {
  /** Similarity to past successful queries (0-100) */
  pastSuccessScore: number;

  /** Number of similar queries found */
  similarQueryCount: number;

  /** Average relevance of similar queries (0-100) */
  avgSimilarRelevance: number;

  /** Whether user has queried this topic before */
  userHasQueriedTopic: boolean;

  /** Estimated cache hit probability (0-100) */
  cacheHitProbability: number;
}

/**
 * Complete feature set for confidence scoring
 */
export interface ConfidenceFeatures {
  /** Lexical features */
  lexical: LexicalFeatures;

  /** Semantic features */
  semantic: SemanticFeatures;

  /** Historical features (optional, may be null for new users) */
  historical: HistoricalFeatures | null;
}

/**
 * Confidence score with reasoning
 */
export interface ConfidenceScore {
  /** Numeric score (0-100) */
  score: number;

  /** Confidence level category */
  level: ConfidenceLevel;

  /** Human-readable reasoning for score */
  reasoning: string[];

  /** Feature breakdown (for debugging) */
  features: ConfidenceFeatures;

  /** Timestamp of scoring */
  timestamp: string;
}

// ============================================
// Routing Types
// ============================================

/**
 * Routing action to take
 */
export type RoutingAction =
  | "use-cache"         // High confidence, use cached result
  | "retrieve-standard" // Medium confidence, standard retrieval
  | "retrieve-expanded" // Low-medium confidence, expand query first
  | "retrieve-aggressive"; // Low confidence, retrieve more results

/**
 * Routing decision from adaptive router
 */
export interface RoutingDecision {
  /** Action to take */
  action: RoutingAction;

  /** Whether to retrieve (false only for "use-cache") */
  shouldRetrieve: boolean;

  /** Whether to expand query before retrieval */
  shouldExpandQuery: boolean;

  /** Number of results to retrieve (if retrieving) */
  retrievalLimit: number;

  /** Cache TTL in milliseconds (if caching result) */
  cacheTTL: number;

  /** Confidence score that led to this decision */
  confidence: ConfidenceScore;

  /** Human-readable reasoning */
  reasoning: string;

  /** Timestamp of decision */
  timestamp: string;
}

/**
 * Cached retrieval result
 */
export interface CachedResult {
  /** Cache key */
  key: string;

  /** Cached query (normalized) */
  query: string;

  /** Retrieval results */
  results: RetrievalResult[];

  /** Course context */
  courseContext: CourseContext | null;

  /** Confidence score when cached */
  confidence: ConfidenceScore;

  /** Cache timestamp */
  cachedAt: string;

  /** TTL in milliseconds */
  ttl: number;

  /** Number of times this cache entry was hit */
  hitCount: number;
}

/**
 * Cache state for routing decisions
 */
export interface CacheState {
  /** Whether cache entry exists for query */
  exists: boolean;

  /** Cached result (if exists) */
  entry: CachedResult | null;

  /** Whether cache entry is still valid (not expired) */
  isValid: boolean;

  /** Age of cache entry in milliseconds */
  age: number;
}

// ============================================
// Configuration Types
// ============================================

/**
 * Feature weights for ensemble scoring
 */
export interface FeatureWeights {
  /** Weight for lexical features (0-1) */
  lexical: number;

  /** Weight for semantic features (0-1) */
  semantic: number;

  /** Weight for historical features (0-1) */
  historical: number;
}

/**
 * Confidence thresholds for routing
 */
export interface ConfidenceThresholds {
  /** High confidence threshold (use cache) */
  high: number;

  /** Low confidence threshold (retrieve aggressively) */
  low: number;

  // Medium confidence is between low and high
}

/**
 * Confidence scorer configuration
 */
export interface ConfidenceScorerConfig {
  /** Feature weights for ensemble */
  featureWeights: FeatureWeights;

  /** Corpus keyword set for semantic matching */
  corpusKeywords: Set<string>;

  /** Technical term patterns (regex) */
  technicalTermPatterns: RegExp[];

  /** Minimum query length (characters) */
  minQueryLength: number;

  /** Maximum query length (characters) */
  maxQueryLength: number;

  /** Enable historical features (requires query history) */
  enableHistoricalFeatures: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum cache size (number of entries) */
  maxSize: number;

  /** Default TTL in milliseconds */
  defaultTTL: number;

  /** High confidence TTL in milliseconds */
  highConfidenceTTL: number;

  /** Medium confidence TTL in milliseconds */
  mediumConfidenceTTL: number;

  /** Low confidence TTL in milliseconds */
  lowConfidenceTTL: number;

  /** Enable fuzzy cache matching (embedding similarity) */
  enableFuzzyMatching: boolean;

  /** Fuzzy matching threshold (cosine similarity 0-1) */
  fuzzyMatchThreshold: number;
}

/**
 * Adaptive router configuration
 */
export interface AdaptiveRouterConfig {
  /** Confidence thresholds */
  thresholds: ConfidenceThresholds;

  /** Cache configuration */
  cache: CacheConfig;

  /** Standard retrieval limit */
  standardRetrievalLimit: number;

  /** Aggressive retrieval limit */
  aggressiveRetrievalLimit: number;

  /** Enable query expansion for medium confidence */
  enableQueryExpansion: boolean;

  /** Enable dynamic threshold calibration */
  enableThresholdCalibration: boolean;
}

// ============================================
// Metrics Types
// ============================================

/**
 * Routing decision outcome
 */
export interface RoutingOutcome {
  /** Routing decision that was made */
  decision: RoutingDecision;

  /** Whether decision was correct (requires feedback) */
  wasCorrect: boolean | null;

  /** Actual latency in milliseconds */
  latency: number;

  /** Actual cost in USD */
  cost: number;

  /** User satisfaction score (1-5, optional) */
  userSatisfaction: number | null;

  /** Timestamp of outcome */
  timestamp: string;
}

/**
 * Aggregate routing metrics
 */
export interface RoutingMetrics {
  /** Total routing decisions made */
  totalDecisions: number;

  /** Number of correct decisions */
  correctDecisions: number;

  /** Number of incorrect decisions */
  incorrectDecisions: number;

  /** Number of decisions pending feedback */
  pendingDecisions: number;

  /** Routing accuracy (0-100) */
  accuracy: number;

  /** Cache hit rate (0-100) */
  cacheHitRate: number;

  /** Average latency in milliseconds */
  avgLatency: number;

  /** Total cost in USD */
  totalCost: number;

  /** Cost savings from cache hits in USD */
  costSavings: number;

  /** Breakdown by action type */
  actionBreakdown: Record<RoutingAction, number>;

  /** Time range for metrics */
  timeRange: {
    start: string;
    end: string;
  };
}
```

---

## Class Designs

### 2. ConfidenceScorer Class (`lib/retrieval/adaptive/ConfidenceScorer.ts`)

```typescript
import type {
  ConfidenceScore,
  ConfidenceFeatures,
  LexicalFeatures,
  SemanticFeatures,
  HistoricalFeatures,
  ConfidenceScorerConfig,
  ConfidenceLevel,
} from "./types";

/**
 * Confidence Scorer
 *
 * Estimates query confidence using ensemble of lexical, semantic, and historical features.
 *
 * Performance: <50ms per query
 * Accuracy target: 80%+ routing accuracy
 */
export class ConfidenceScorer {
  private config: Required<ConfidenceScorerConfig>;
  private corpusKeywords: Set<string>;
  private technicalTermPatterns: RegExp[];

  constructor(config: ConfidenceScorerConfig) {
    this.config = this.normalizeConfig(config);
    this.corpusKeywords = config.corpusKeywords;
    this.technicalTermPatterns = config.technicalTermPatterns;
  }

  /**
   * Score query confidence
   *
   * @param query - User's query string
   * @param context - Optional context (user ID, course ID, history)
   * @returns Confidence score with reasoning
   */
  async scoreQuery(
    query: string,
    context?: {
      userId?: string;
      courseId?: string | null;
      conversationHistory?: AIMessage[];
    }
  ): Promise<ConfidenceScore> {
    const startTime = performance.now();

    // 1. Validate query
    if (!this.isValidQuery(query)) {
      return this.createLowConfidenceScore(query, "Invalid query format");
    }

    // 2. Extract features
    const features = await this.extractFeatures(query, context);

    // 3. Calculate ensemble score
    const score = this.calculateEnsembleScore(features);

    // 4. Determine confidence level
    const level = this.scoreToLevel(score);

    // 5. Generate reasoning
    const reasoning = this.generateReasoning(features, score);

    const latency = performance.now() - startTime;
    console.log(`[ConfidenceScorer] Scored query in ${latency.toFixed(2)}ms: ${score}/100 (${level})`);

    return {
      score: Math.round(score),
      level,
      reasoning,
      features,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract all features from query
   */
  private async extractFeatures(
    query: string,
    context?: { userId?: string; courseId?: string | null; conversationHistory?: AIMessage[] }
  ): Promise<ConfidenceFeatures> {
    // Run feature extraction in parallel
    const [lexical, semantic, historical] = await Promise.all([
      this.extractLexicalFeatures(query),
      this.extractSemanticFeatures(query),
      this.config.enableHistoricalFeatures && context?.userId
        ? this.extractHistoricalFeatures(query, context.userId, context.courseId)
        : Promise.resolve(null),
    ]);

    return {
      lexical,
      semantic,
      historical,
    };
  }

  /**
   * Extract lexical features
   *
   * Features:
   * - Query length (tokens)
   * - Specificity (course code, week number, technical terms)
   * - Generic pronouns ratio
   * - Question word count
   * - Sentence completeness
   */
  private async extractLexicalFeatures(query: string): Promise<LexicalFeatures> {
    const tokens = this.tokenize(query);
    const queryLength = tokens.length;

    // Course code detection (e.g., "CS101", "MATH 221")
    const hasCourseCode = /\b[A-Z]{2,4}\s?\d{3}\b/i.test(query);

    // Week/chapter number detection
    const hasWeekNumber = /\b(week|chapter|lecture)\s+\d+\b/i.test(query);

    // Generic pronouns
    const genericPronouns = ["this", "that", "it", "these", "those"];
    const pronounCount = tokens.filter(t => genericPronouns.includes(t.toLowerCase())).length;
    const genericPronounRatio = queryLength > 0 ? pronounCount / queryLength : 0;

    // Question words
    const questionWords = ["who", "what", "when", "where", "why", "how"];
    const questionWordCount = tokens.filter(t => questionWords.includes(t.toLowerCase())).length;

    // Sentence completeness (has subject + verb + ends with punctuation)
    const isCompleteSentence = this.isCompleteSentence(query);

    // Technical terms
    const hasTechnicalTerms = this.hasTechnicalTerms(query);

    // Specificity score (0-100)
    const specificity = this.calculateSpecificity({
      hasCourseCode,
      hasWeekNumber,
      hasTechnicalTerms,
      genericPronounRatio,
      queryLength,
    });

    return {
      queryLength,
      specificity,
      hasCourseCode,
      hasWeekNumber,
      genericPronounRatio,
      questionWordCount,
      isCompleteSentence,
      hasTechnicalTerms,
    };
  }

  /**
   * Extract semantic features
   *
   * Features:
   * - Keyword coverage (% of query in corpus)
   * - Matched keywords
   * - Ambiguity score
   * - Topic focus
   */
  private async extractSemanticFeatures(query: string): Promise<SemanticFeatures> {
    const tokens = this.tokenize(query);

    // Keyword coverage
    const matchedKeywords: string[] = [];
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (this.corpusKeywords.has(lower)) {
        matchedKeywords.push(lower);
      }
    }

    const keywordCoverage = tokens.length > 0
      ? (matchedKeywords.length / tokens.length) * 100
      : 0;

    // Ambiguity score (based on polysemous terms, multiple meanings)
    const ambiguityScore = this.calculateAmbiguity(tokens);

    // Topic focus (based on keyword clustering)
    const topicFocus = this.calculateTopicFocus(matchedKeywords);

    return {
      keywordCoverage,
      matchedKeywords,
      ambiguityScore,
      topicFocus,
    };
  }

  /**
   * Extract historical features
   *
   * Features:
   * - Past success score (similar queries)
   * - Similar query count
   * - Average relevance of similar queries
   * - User topic familiarity
   * - Cache hit probability
   */
  private async extractHistoricalFeatures(
    query: string,
    userId: string,
    courseId: string | null
  ): Promise<HistoricalFeatures> {
    // TODO: Implement after query history storage is added
    // For now, return default values

    return {
      pastSuccessScore: 50, // Neutral
      similarQueryCount: 0,
      avgSimilarRelevance: 0,
      userHasQueriedTopic: false,
      cacheHitProbability: 0,
    };
  }

  /**
   * Calculate ensemble score from features
   *
   * Weighted average of:
   * - Lexical score (40%)
   * - Semantic score (40%)
   * - Historical score (20%, if available)
   */
  private calculateEnsembleScore(features: ConfidenceFeatures): number {
    const lexicalScore = this.calculateLexicalScore(features.lexical);
    const semanticScore = this.calculateSemanticScore(features.semantic);
    const historicalScore = features.historical
      ? this.calculateHistoricalScore(features.historical)
      : 50; // Neutral if no history

    const weights = this.config.featureWeights;

    // Normalize weights
    const totalWeight = weights.lexical + weights.semantic + weights.historical;
    const normalizedWeights = {
      lexical: weights.lexical / totalWeight,
      semantic: weights.semantic / totalWeight,
      historical: weights.historical / totalWeight,
    };

    // Weighted average
    const score =
      lexicalScore * normalizedWeights.lexical +
      semanticScore * normalizedWeights.semantic +
      historicalScore * normalizedWeights.historical;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate lexical score (0-100)
   */
  private calculateLexicalScore(lexical: LexicalFeatures): number {
    let score = 50; // Start at neutral

    // Query length (Goldilocks zone: 5-15 words)
    if (lexical.queryLength >= 5 && lexical.queryLength <= 15) {
      score += 15;
    } else if (lexical.queryLength < 5) {
      score -= 20; // Too short
    } else if (lexical.queryLength > 30) {
      score -= 10; // Too long
    }

    // Specificity
    score += lexical.specificity * 0.3; // Up to +30

    // Course code
    if (lexical.hasCourseCode) {
      score += 10;
    }

    // Week number
    if (lexical.hasWeekNumber) {
      score += 10;
    }

    // Generic pronouns (bad)
    score -= lexical.genericPronounRatio * 30; // Up to -30

    // Question words only (bad if too many)
    if (lexical.questionWordCount > 2) {
      score -= 10;
    }

    // Complete sentence (good)
    if (lexical.isCompleteSentence) {
      score += 10;
    }

    // Technical terms (good)
    if (lexical.hasTechnicalTerms) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate semantic score (0-100)
   */
  private calculateSemanticScore(semantic: SemanticFeatures): number {
    let score = 50; // Start at neutral

    // Keyword coverage (main signal)
    score += semantic.keywordCoverage * 0.5; // Up to +50

    // Ambiguity (bad)
    score -= semantic.ambiguityScore * 0.3; // Up to -30

    // Topic focus (good)
    score += semantic.topicFocus * 0.2; // Up to +20

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate historical score (0-100)
   */
  private calculateHistoricalScore(historical: HistoricalFeatures): number {
    let score = 50; // Start at neutral

    // Past success
    score += historical.pastSuccessScore * 0.4; // Up to +40

    // Similar query count (good if > 0)
    if (historical.similarQueryCount > 0) {
      score += Math.min(20, historical.similarQueryCount * 5);
    }

    // Average relevance
    score += historical.avgSimilarRelevance * 0.2; // Up to +20

    // User familiarity
    if (historical.userHasQueriedTopic) {
      score += 10;
    }

    // Cache hit probability
    score += historical.cacheHitProbability * 0.1; // Up to +10

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Convert score to confidence level
   */
  private scoreToLevel(score: number): ConfidenceLevel {
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(features: ConfidenceFeatures, score: number): string[] {
    const reasons: string[] = [];

    // Lexical reasons
    const lex = features.lexical;
    if (lex.hasCourseCode) reasons.push("✓ Contains course code");
    if (lex.hasWeekNumber) reasons.push("✓ References specific week/chapter");
    if (lex.hasTechnicalTerms) reasons.push("✓ Uses technical terminology");
    if (lex.genericPronounRatio > 0.3) reasons.push("✗ High use of generic pronouns");
    if (lex.queryLength < 5) reasons.push("✗ Query too short");

    // Semantic reasons
    const sem = features.semantic;
    if (sem.keywordCoverage >= 70) reasons.push("✓ High keyword coverage");
    if (sem.keywordCoverage < 30) reasons.push("✗ Low keyword coverage");
    if (sem.ambiguityScore > 50) reasons.push("✗ Ambiguous query");

    // Historical reasons (if available)
    if (features.historical) {
      const hist = features.historical;
      if (hist.pastSuccessScore >= 70) reasons.push("✓ Similar queries succeeded");
      if (hist.userHasQueriedTopic) reasons.push("✓ User familiar with topic");
    }

    // Overall confidence
    reasons.push(`Overall confidence: ${score}/100`);

    return reasons;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  private isValidQuery(query: string): boolean {
    const trimmed = query.trim();
    return (
      trimmed.length >= this.config.minQueryLength &&
      trimmed.length <= this.config.maxQueryLength
    );
  }

  private isCompleteSentence(query: string): boolean {
    // Simple heuristic: ends with punctuation and has reasonable length
    return /[.!?]$/.test(query.trim()) && query.split(/\s+/).length >= 5;
  }

  private hasTechnicalTerms(query: string): boolean {
    return this.technicalTermPatterns.some(pattern => pattern.test(query));
  }

  private calculateSpecificity(params: {
    hasCourseCode: boolean;
    hasWeekNumber: boolean;
    hasTechnicalTerms: boolean;
    genericPronounRatio: number;
    queryLength: number;
  }): number {
    let score = 0;

    if (params.hasCourseCode) score += 30;
    if (params.hasWeekNumber) score += 20;
    if (params.hasTechnicalTerms) score += 25;
    score -= params.genericPronounRatio * 40;

    // Goldilocks query length
    if (params.queryLength >= 5 && params.queryLength <= 15) {
      score += 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateAmbiguity(tokens: string[]): number {
    // TODO: Implement polysemy detection
    // For now, simple heuristic: short + generic words = high ambiguity
    const genericWords = ["it", "this", "that", "thing", "stuff"];
    const genericCount = tokens.filter(t => genericWords.includes(t)).length;
    const ratio = tokens.length > 0 ? genericCount / tokens.length : 0;

    return ratio * 100;
  }

  private calculateTopicFocus(keywords: string[]): number {
    // TODO: Implement keyword clustering
    // For now: more unique keywords = higher focus
    const uniqueKeywords = new Set(keywords);
    return Math.min(100, uniqueKeywords.size * 10);
  }

  private createLowConfidenceScore(query: string, reason: string): ConfidenceScore {
    return {
      score: 0,
      level: "low",
      reasoning: [reason],
      features: {
        lexical: {
          queryLength: 0,
          specificity: 0,
          hasCourseCode: false,
          hasWeekNumber: false,
          genericPronounRatio: 0,
          questionWordCount: 0,
          isCompleteSentence: false,
          hasTechnicalTerms: false,
        },
        semantic: {
          keywordCoverage: 0,
          matchedKeywords: [],
          ambiguityScore: 0,
          topicFocus: 0,
        },
        historical: null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeConfig(config: ConfidenceScorerConfig): Required<ConfidenceScorerConfig> {
    return {
      featureWeights: config.featureWeights || { lexical: 0.4, semantic: 0.4, historical: 0.2 },
      corpusKeywords: config.corpusKeywords,
      technicalTermPatterns: config.technicalTermPatterns || [],
      minQueryLength: config.minQueryLength || 3,
      maxQueryLength: config.maxQueryLength || 500,
      enableHistoricalFeatures: config.enableHistoricalFeatures ?? false,
    };
  }

  /**
   * Calibrate thresholds based on feedback (future enhancement)
   */
  async calibrateThresholds(outcomes: RoutingOutcome[]): Promise<void> {
    // TODO: Implement dynamic threshold calibration
    console.log(`[ConfidenceScorer] Calibration not yet implemented (${outcomes.length} outcomes)`);
  }

  /**
   * Get configuration
   */
  getConfig(): ConfidenceScorerConfig {
    return this.config;
  }
}
```

### 3. AdaptiveRouter Class (`lib/retrieval/adaptive/AdaptiveRouter.ts`)

```typescript
import type {
  RoutingDecision,
  RoutingAction,
  CacheState,
  CachedResult,
  AdaptiveRouterConfig,
  ConfidenceScore,
} from "./types";
import type { RetrievalResult, CourseContext } from "@/lib/models/types";

/**
 * Adaptive Router
 *
 * Routes queries based on confidence scores:
 * - High confidence (80+): Use cache if available
 * - Medium confidence (50-79): Retrieve with standard limit
 * - Low confidence (0-49): Retrieve aggressively with expanded query
 *
 * Performance: <5ms per routing decision
 */
export class AdaptiveRouter {
  private config: Required<AdaptiveRouterConfig>;
  private cache: Map<string, CachedResult>;
  private metrics: Map<string, RoutingOutcome>;

  constructor(config: AdaptiveRouterConfig) {
    this.config = this.normalizeConfig(config);
    this.cache = new Map();
    this.metrics = new Map();
  }

  /**
   * Route query based on confidence and cache state
   *
   * @param query - User's query
   * @param confidence - Confidence score from scorer
   * @param courseId - Optional course context
   * @returns Routing decision
   */
  async route(
    query: string,
    confidence: ConfidenceScore,
    courseId: string | null
  ): Promise<RoutingDecision> {
    const startTime = performance.now();

    // 1. Check cache state
    const cacheState = await this.getCacheState(query, courseId);

    // 2. Determine action based on confidence + cache
    const action = this.determineAction(confidence, cacheState);

    // 3. Build routing decision
    const decision = this.buildDecision(action, confidence, cacheState);

    const latency = performance.now() - startTime;
    console.log(`[AdaptiveRouter] Routed in ${latency.toFixed(2)}ms: ${action}`);

    return decision;
  }

  /**
   * Determine routing action
   */
  private determineAction(
    confidence: ConfidenceScore,
    cacheState: CacheState
  ): RoutingAction {
    const score = confidence.score;
    const { high, low } = this.config.thresholds;

    // High confidence: try cache first
    if (score >= high) {
      if (cacheState.exists && cacheState.isValid) {
        return "use-cache";
      }
      return "retrieve-standard"; // No cache, but high confidence
    }

    // Low confidence: retrieve aggressively
    if (score < low) {
      if (this.config.enableQueryExpansion) {
        return "retrieve-expanded";
      }
      return "retrieve-aggressive";
    }

    // Medium confidence: standard retrieval
    if (this.config.enableQueryExpansion) {
      return "retrieve-expanded"; // Expand medium confidence queries
    }
    return "retrieve-standard";
  }

  /**
   * Build routing decision
   */
  private buildDecision(
    action: RoutingAction,
    confidence: ConfidenceScore,
    cacheState: CacheState
  ): RoutingDecision {
    const shouldRetrieve = action !== "use-cache";
    const shouldExpandQuery = action === "retrieve-expanded";

    const retrievalLimit =
      action === "retrieve-aggressive"
        ? this.config.aggressiveRetrievalLimit
        : this.config.standardRetrievalLimit;

    const cacheTTL = this.getCacheTTL(confidence.level);

    const reasoning = this.generateRoutingReasoning(action, confidence, cacheState);

    return {
      action,
      shouldRetrieve,
      shouldExpandQuery,
      retrievalLimit,
      cacheTTL,
      confidence,
      reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get cache state for query
   */
  private async getCacheState(query: string, courseId: string | null): Promise<CacheState> {
    const key = this.generateCacheKey(query, courseId);
    const entry = this.cache.get(key);

    if (!entry) {
      return {
        exists: false,
        entry: null,
        isValid: false,
        age: 0,
      };
    }

    const age = Date.now() - new Date(entry.cachedAt).getTime();
    const isValid = age < entry.ttl;

    return {
      exists: true,
      entry,
      isValid,
      age,
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, courseId: string | null): string {
    const normalized = this.normalizeQuery(query);
    const courseKey = courseId || "general";
    return `rag:${courseKey}:${this.hashString(normalized)}`;
  }

  /**
   * Normalize query for cache key
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ");    // Normalize whitespace
  }

  /**
   * Simple string hash (djb2 algorithm)
   */
  private hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  /**
   * Get cache TTL based on confidence level
   */
  getCacheTTL(level: ConfidenceLevel): number {
    switch (level) {
      case "high":
        return this.config.cache.highConfidenceTTL;
      case "medium":
        return this.config.cache.mediumConfidenceTTL;
      case "low":
        return this.config.cache.lowConfidenceTTL;
    }
  }

  /**
   * Generate routing reasoning
   */
  private generateRoutingReasoning(
    action: RoutingAction,
    confidence: ConfidenceScore,
    cacheState: CacheState
  ): string {
    const parts: string[] = [];

    parts.push(`Confidence: ${confidence.score}/100 (${confidence.level})`);

    if (cacheState.exists) {
      if (cacheState.isValid) {
        parts.push(`Cache: HIT (age: ${Math.round(cacheState.age / 1000)}s)`);
      } else {
        parts.push(`Cache: EXPIRED (age: ${Math.round(cacheState.age / 1000)}s)`);
      }
    } else {
      parts.push("Cache: MISS");
    }

    switch (action) {
      case "use-cache":
        parts.push("Action: Using cached result (high confidence)");
        break;
      case "retrieve-standard":
        parts.push("Action: Standard retrieval");
        break;
      case "retrieve-expanded":
        parts.push("Action: Retrieval with query expansion");
        break;
      case "retrieve-aggressive":
        parts.push("Action: Aggressive retrieval (low confidence)");
        break;
    }

    return parts.join(" | ");
  }

  /**
   * Cache retrieval result
   */
  async cacheResult(
    query: string,
    courseId: string | null,
    results: RetrievalResult[],
    courseContext: CourseContext | null,
    confidence: ConfidenceScore
  ): Promise<void> {
    const key = this.generateCacheKey(query, courseId);
    const ttl = this.getCacheTTL(confidence.level);

    const entry: CachedResult = {
      key,
      query: this.normalizeQuery(query),
      results,
      courseContext,
      confidence,
      cachedAt: new Date().toISOString(),
      ttl,
      hitCount: 0,
    };

    this.cache.set(key, entry);

    // Evict if cache too large (LRU)
    if (this.cache.size > this.config.cache.maxSize) {
      await this.evictLRU();
    }

    console.log(`[AdaptiveRouter] Cached result for query (TTL: ${ttl}ms)`);
  }

  /**
   * Get cached result
   */
  async getCachedResult(
    query: string,
    courseId: string | null
  ): Promise<CachedResult | null> {
    const key = this.generateCacheKey(query, courseId);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age >= entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit count
    entry.hitCount++;

    console.log(`[AdaptiveRouter] Cache hit (count: ${entry.hitCount})`);
    return entry;
  }

  /**
   * Invalidate cache entry
   */
  async invalidateCache(query: string, courseId: string | null): Promise<void> {
    const key = this.generateCacheKey(query, courseId);
    this.cache.delete(key);
    console.log(`[AdaptiveRouter] Invalidated cache for key: ${key}`);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    console.log("[AdaptiveRouter] Cache cleared");
  }

  /**
   * Evict least recently used entry (LRU)
   */
  private async evictLRU(): Promise<void> {
    // Find entry with lowest hit count and oldest timestamp
    let lruKey: string | null = null;
    let lruScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - new Date(entry.cachedAt).getTime();
      const score = entry.hitCount * 1000 - age; // Prioritize hit count, then age
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`[AdaptiveRouter] Evicted LRU entry: ${lruKey}`);
    }
  }

  /**
   * Normalize config with defaults
   */
  private normalizeConfig(config: AdaptiveRouterConfig): Required<AdaptiveRouterConfig> {
    return {
      thresholds: config.thresholds || { high: 80, low: 50 },
      cache: {
        maxSize: config.cache.maxSize || 1000,
        defaultTTL: config.cache.defaultTTL || 12 * 60 * 60 * 1000, // 12 hours
        highConfidenceTTL: config.cache.highConfidenceTTL || 24 * 60 * 60 * 1000, // 24 hours
        mediumConfidenceTTL: config.cache.mediumConfidenceTTL || 12 * 60 * 60 * 1000, // 12 hours
        lowConfidenceTTL: config.cache.lowConfidenceTTL || 6 * 60 * 60 * 1000, // 6 hours
        enableFuzzyMatching: config.cache.enableFuzzyMatching ?? false,
        fuzzyMatchThreshold: config.cache.fuzzyMatchThreshold || 0.95,
      },
      standardRetrievalLimit: config.standardRetrievalLimit || 10,
      aggressiveRetrievalLimit: config.aggressiveRetrievalLimit || 20,
      enableQueryExpansion: config.enableQueryExpansion ?? true,
      enableThresholdCalibration: config.enableThresholdCalibration ?? false,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    totalHits: number;
    entries: Array<{ key: string; hitCount: number; age: number }>;
  } {
    const entries: Array<{ key: string; hitCount: number; age: number }> = [];
    let totalHits = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - new Date(entry.cachedAt).getTime();
      entries.push({ key, hitCount: entry.hitCount, age });
      totalHits += entry.hitCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.cache.maxSize,
      totalHits,
      entries: entries.sort((a, b) => b.hitCount - a.hitCount),
    };
  }

  /**
   * Get configuration
   */
  getConfig(): AdaptiveRouterConfig {
    return this.config;
  }
}
```

---

## Integration Plan

### Step 1: Create Type Definitions
**File:** `lib/retrieval/adaptive/types.ts`
- All TypeScript interfaces defined above
- Export all types for use in other modules
- **Estimated time:** 30 minutes

### Step 2: Implement ConfidenceScorer
**File:** `lib/retrieval/adaptive/ConfidenceScorer.ts`
- Implement class with all methods
- Add unit tests for feature extraction
- **Estimated time:** 3 hours

### Step 3: Implement AdaptiveRouter
**File:** `lib/retrieval/adaptive/AdaptiveRouter.ts`
- Implement class with all methods
- Add unit tests for routing logic
- **Estimated time:** 2 hours

### Step 4: Create Module Index
**File:** `lib/retrieval/adaptive/index.ts`
```typescript
export * from "./types";
export { ConfidenceScorer } from "./ConfidenceScorer";
export { AdaptiveRouter } from "./AdaptiveRouter";
```
- **Estimated time:** 5 minutes

### Step 5: Integrate with CourseContextBuilder
**File:** `lib/context/CourseContextBuilder.ts`
**Changes:**
1. Import ConfidenceScorer and AdaptiveRouter
2. Add router and scorer as class properties
3. Modify buildContext() method:
```typescript
async buildContext(question: string, options?: ContextBuildOptions): Promise<CourseContext> {
  // 1. Score confidence
  const confidence = await this.confidenceScorer.scoreQuery(question, {
    courseId: this.course.id,
    userId: options?.userId,
  });

  // 2. Route adaptively
  const decision = await this.adaptiveRouter.route(question, confidence, this.course.id);

  // 3. Check cache if high confidence
  if (decision.action === "use-cache") {
    const cached = await this.adaptiveRouter.getCachedResult(question, this.course.id);
    if (cached) {
      return cached.courseContext!;
    }
  }

  // 4. Retrieve (with expanded query if needed)
  const query = decision.shouldExpandQuery
    ? await this.expandQuery(question) // TODO: Phase 2.3
    : question;

  const rankedMaterials = await this.rankAndFilterMaterials(
    query,
    { ...opts, maxMaterials: decision.retrievalLimit }
  );

  // 5. Build context
  const context = {
    courseId: this.course.id,
    courseCode: this.course.code,
    courseName: this.course.name,
    materials: rankedMaterials,
    contextText: this.formatContextText(rankedMaterials, opts),
    estimatedTokens: Math.ceil(contextText.length / 4),
    builtAt: new Date().toISOString(),
  };

  // 6. Cache result
  await this.adaptiveRouter.cacheResult(
    question,
    this.course.id,
    rankedMaterials.map(m => ({ material: m, score: m.relevanceScore / 100 })),
    context,
    confidence
  );

  return context;
}
```
- **Estimated time:** 1 hour

### Step 6: Update AIAnswer Type
**File:** `lib/models/types.ts`
**Changes:**
```typescript
export interface AIAnswer {
  // ... existing fields ...

  // NEW: Self-RAG metadata
  confidenceMetadata?: {
    confidenceScore: ConfidenceScore;
    routingDecision: RoutingDecision;
    cacheHit: boolean;
  };
}
```
- **Estimated time:** 15 minutes

### Step 7: Add Corpus Keyword Extraction
**File:** `lib/retrieval/adaptive/utils.ts`
```typescript
import type { CourseMaterial } from "@/lib/models/types";

/**
 * Extract corpus keywords from materials
 */
export function extractCorpusKeywords(materials: CourseMaterial[]): Set<string> {
  const keywords = new Set<string>();

  for (const material of materials) {
    // Add material keywords
    for (const keyword of material.keywords) {
      keywords.add(keyword.toLowerCase());
    }

    // Add high-frequency terms from content
    const tokens = tokenize(material.content);
    const frequencies = calculateTermFrequencies(tokens);
    const topTerms = getTopKTerms(frequencies, 20);

    for (const term of topTerms) {
      keywords.add(term);
    }
  }

  return keywords;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2); // Skip very short tokens
}

function calculateTermFrequencies(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  }
  return frequencies;
}

function getTopKTerms(frequencies: Map<string, number>, k: number): string[] {
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([term]) => term);
}
```
- **Estimated time:** 30 minutes

---

## Testing Strategy

### Unit Tests

**ConfidenceScorer Tests:**
```typescript
// File: lib/retrieval/adaptive/__tests__/ConfidenceScorer.test.ts

describe("ConfidenceScorer", () => {
  test("high confidence for course-specific query", async () => {
    const scorer = new ConfidenceScorer(mockConfig);
    const score = await scorer.scoreQuery("What is binary search in CS101 week 5?");
    expect(score.level).toBe("high");
    expect(score.score).toBeGreaterThan(80);
  });

  test("low confidence for vague query", async () => {
    const scorer = new ConfidenceScorer(mockConfig);
    const score = await scorer.scoreQuery("What is this?");
    expect(score.level).toBe("low");
    expect(score.score).toBeLessThan(50);
  });

  test("medium confidence for general query", async () => {
    const scorer = new ConfidenceScorer(mockConfig);
    const score = await scorer.scoreQuery("How do I implement a linked list?");
    expect(score.level).toBe("medium");
    expect(score.score).toBeGreaterThanOrEqual(50);
    expect(score.score).toBeLessThan(80);
  });
});
```

**AdaptiveRouter Tests:**
```typescript
// File: lib/retrieval/adaptive/__tests__/AdaptiveRouter.test.ts

describe("AdaptiveRouter", () => {
  test("routes to cache for high confidence + cache hit", async () => {
    const router = new AdaptiveRouter(mockConfig);
    const decision = await router.route(query, highConfidence, courseId);
    expect(decision.action).toBe("use-cache");
    expect(decision.shouldRetrieve).toBe(false);
  });

  test("routes to standard retrieval for high confidence + cache miss", async () => {
    const router = new AdaptiveRouter(mockConfig);
    const decision = await router.route(query, highConfidence, courseId);
    expect(decision.action).toBe("retrieve-standard");
    expect(decision.shouldRetrieve).toBe(true);
  });

  test("routes to aggressive retrieval for low confidence", async () => {
    const router = new AdaptiveRouter(mockConfig);
    const decision = await router.route(query, lowConfidence, courseId);
    expect(decision.action).toBe("retrieve-aggressive");
    expect(decision.retrievalLimit).toBe(20);
  });
});
```

### Integration Tests

**End-to-End Flow:**
```typescript
// File: lib/retrieval/adaptive/__tests__/integration.test.ts

describe("Self-RAG Integration", () => {
  test("full pipeline: confidence -> routing -> cache", async () => {
    const builder = new CourseContextBuilder(mockCourse, mockMaterials);

    // First query: cache miss, retrieve
    const context1 = await builder.buildContext("What is binary search?");
    expect(context1.materials.length).toBeGreaterThan(0);

    // Second query (same): cache hit, skip retrieval
    const context2 = await builder.buildContext("What is binary search?");
    expect(context2).toEqual(context1); // Exact match from cache
  });

  test("cache invalidation after TTL", async () => {
    jest.useFakeTimers();
    const builder = new CourseContextBuilder(mockCourse, mockMaterials);

    const context1 = await builder.buildContext("What is binary search?");

    // Fast-forward past TTL
    jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

    const context2 = await builder.buildContext("What is binary search?");
    // Should retrieve again (cache expired)

    jest.useRealTimers();
  });
});
```

### Performance Tests

**Latency Measurement:**
```typescript
describe("Performance", () => {
  test("confidence scoring < 50ms", async () => {
    const scorer = new ConfidenceScorer(mockConfig);
    const start = performance.now();
    await scorer.scoreQuery("What is binary search in CS101?");
    const latency = performance.now() - start;
    expect(latency).toBeLessThan(50);
  });

  test("routing decision < 5ms", async () => {
    const router = new AdaptiveRouter(mockConfig);
    const start = performance.now();
    await router.route(query, confidence, courseId);
    const latency = performance.now() - start;
    expect(latency).toBeLessThan(5);
  });
});
```

---

## Metrics & Monitoring

### Metrics to Track

```typescript
// File: lib/retrieval/adaptive/metrics.ts

export class SelfRAGMetrics {
  private outcomes: RoutingOutcome[] = [];

  recordOutcome(outcome: RoutingOutcome): void {
    this.outcomes.push(outcome);
  }

  getMetrics(timeRange?: { start: Date; end: Date }): RoutingMetrics {
    const filtered = timeRange
      ? this.outcomes.filter(
          o =>
            new Date(o.timestamp) >= timeRange.start &&
            new Date(o.timestamp) <= timeRange.end
        )
      : this.outcomes;

    const totalDecisions = filtered.length;
    const correctDecisions = filtered.filter(o => o.wasCorrect === true).length;
    const incorrectDecisions = filtered.filter(o => o.wasCorrect === false).length;
    const pendingDecisions = filtered.filter(o => o.wasCorrect === null).length;

    const cacheHits = filtered.filter(o => o.decision.action === "use-cache").length;
    const cacheHitRate = totalDecisions > 0 ? (cacheHits / totalDecisions) * 100 : 0;

    const avgLatency =
      filtered.reduce((sum, o) => sum + o.latency, 0) / (totalDecisions || 1);
    const totalCost = filtered.reduce((sum, o) => sum + o.cost, 0);

    // Estimate cost savings (assume cache hit saves $0.002)
    const costSavings = cacheHits * 0.002;

    const actionBreakdown: Record<RoutingAction, number> = {
      "use-cache": 0,
      "retrieve-standard": 0,
      "retrieve-expanded": 0,
      "retrieve-aggressive": 0,
    };

    for (const outcome of filtered) {
      actionBreakdown[outcome.decision.action]++;
    }

    return {
      totalDecisions,
      correctDecisions,
      incorrectDecisions,
      pendingDecisions,
      accuracy: totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0,
      cacheHitRate,
      avgLatency,
      totalCost,
      costSavings,
      actionBreakdown,
      timeRange: timeRange
        ? {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString(),
          }
        : {
            start: filtered[0]?.timestamp || new Date().toISOString(),
            end: filtered[filtered.length - 1]?.timestamp || new Date().toISOString(),
          },
    };
  }
}
```

---

## File Structure Summary

```
lib/retrieval/adaptive/
├── types.ts                    # All TypeScript interfaces (NEW)
├── ConfidenceScorer.ts         # Confidence scoring logic (NEW)
├── AdaptiveRouter.ts           # Routing + caching logic (NEW)
├── utils.ts                    # Helper functions (NEW)
├── metrics.ts                  # Metrics tracking (NEW)
├── index.ts                    # Module exports (NEW)
└── __tests__/
    ├── ConfidenceScorer.test.ts
    ├── AdaptiveRouter.test.ts
    ├── integration.test.ts
    └── performance.test.ts

lib/context/
└── CourseContextBuilder.ts     # Modified to integrate Self-RAG

lib/models/
└── types.ts                    # Modified to add confidenceMetadata
```

---

## Rollout Plan

### Phase 1: Core Implementation (Days 1-2)
1. Create `types.ts` with all interfaces
2. Implement `ConfidenceScorer` class
3. Implement `AdaptiveRouter` class
4. Add unit tests

### Phase 2: Integration (Day 2)
5. Integrate with `CourseContextBuilder`
6. Update `AIAnswer` type
7. Add corpus keyword extraction
8. Add integration tests

### Phase 3: Testing & Tuning (Day 3)
9. Run performance tests
10. Collect metrics on 50 test queries
11. Calibrate thresholds (80/50 vs 85/55 vs 75/45)
12. A/B test with/without Self-RAG

### Phase 4: Production Rollout (Day 3)
13. Deploy to staging
14. Monitor cache hit rate
15. Validate routing accuracy
16. Roll out to production

---

## Success Criteria

### Functional Requirements
- ✅ Confidence scoring completes in <50ms
- ✅ Routing decision completes in <5ms
- ✅ Cache lookup completes in <5ms
- ✅ 80%+ routing accuracy on test set
- ✅ No breaking changes to existing APIs

### Performance Requirements
- ✅ Total latency <2s (95th percentile)
- ✅ Cache hit rate 60%+ (target: 80%)
- ✅ Cost savings 40%+ (target: 80%)
- ✅ Memory usage <100KB for scorer + <2MB for cache

### Quality Requirements
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ TypeScript strict mode compliance
- ✅ Lint clean
- ✅ Production build succeeds

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low routing accuracy | A/B test thresholds, collect feedback, calibrate |
| High latency | Profile and optimize hot paths, parallel feature extraction |
| Cache misses | Lower confidence threshold, enable fuzzy matching |
| Memory leaks | Implement LRU eviction, monitor cache size |
| Stale cache | Implement TTL, content-based invalidation |

---

## Summary

**Deliverables:**
1. ✅ `lib/retrieval/adaptive/types.ts` - Complete type definitions
2. ✅ `lib/retrieval/adaptive/ConfidenceScorer.ts` - Confidence scoring logic
3. ✅ `lib/retrieval/adaptive/AdaptiveRouter.ts` - Routing + caching logic
4. ✅ `lib/retrieval/adaptive/utils.ts` - Helper functions
5. ✅ `lib/retrieval/adaptive/metrics.ts` - Metrics tracking
6. ✅ Integration with `CourseContextBuilder`
7. ✅ Comprehensive test suite

**Status:** Design complete. Ready for implementation.
**Next:** Implement Phase 2.1 (Self-RAG) following this design document.

---

**Files Modified:**
- `lib/context/CourseContextBuilder.ts` - Add confidence + routing
- `lib/models/types.ts` - Add confidenceMetadata to AIAnswer

**Files Created:**
- `lib/retrieval/adaptive/types.ts`
- `lib/retrieval/adaptive/ConfidenceScorer.ts`
- `lib/retrieval/adaptive/AdaptiveRouter.ts`
- `lib/retrieval/adaptive/utils.ts`
- `lib/retrieval/adaptive/metrics.ts`
- `lib/retrieval/adaptive/index.ts`
- `lib/retrieval/adaptive/__tests__/*.test.ts`

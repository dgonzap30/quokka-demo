// ============================================
// ConfidenceScorer: Ensemble Confidence Scoring
// ============================================

import type {
  ConfidenceScore,
  ConfidenceScorerConfig,
  LexicalFeatures,
  SemanticFeatures,
  HistoricalFeatures,
  QueryHistoryEntry,
} from "./types";
import { DEFAULT_CONFIDENCE_SCORER_CONFIG } from "./types";
import type { CourseMaterial } from "@/lib/models/types";

/**
 * ConfidenceScorer: Ensemble-based query confidence scoring
 *
 * Combines three feature types:
 * - Lexical: Query text analysis (40% weight)
 * - Semantic: Query meaning analysis (40% weight)
 * - Historical: Past query patterns (20% weight)
 *
 * Output: ConfidenceScore (0-100) with level classification
 */
export class ConfidenceScorer {
  private config: ConfidenceScorerConfig;
  private corpusKeywords: Set<string> = new Set();

  constructor(config: Partial<ConfidenceScorerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIDENCE_SCORER_CONFIG, ...config };
  }

  /**
   * Initialize corpus keywords for semantic analysis
   */
  public initializeCorpus(materials: CourseMaterial[]): void {
    this.corpusKeywords.clear();

    for (const material of materials) {
      // Extract keywords from material keywords array
      if (material.keywords) {
        material.keywords.forEach((kw) => this.corpusKeywords.add(kw.toLowerCase()));
      }

      // Extract keywords from content
      const contentWords = this.extractKeywords(material.content);
      contentWords.forEach((word) => this.corpusKeywords.add(word));

      // Extract keywords from title
      const titleWords = this.extractKeywords(material.title);
      titleWords.forEach((word) => this.corpusKeywords.add(word));
    }
  }

  /**
   * Score query confidence
   */
  public scoreQuery(
    query: string,
    queryHistory?: QueryHistoryEntry[]
  ): ConfidenceScore {
    const lexicalFeatures = this.extractLexicalFeatures(query);
    const semanticFeatures = this.extractSemanticFeatures(query);
    const historicalFeatures = this.extractHistoricalFeatures(query, queryHistory);

    // Ensemble scoring (weighted combination)
    const { weights } = this.config;
    const ensembleScore =
      lexicalFeatures.score * weights.lexical +
      semanticFeatures.score * weights.semantic +
      historicalFeatures.score * weights.historical;

    // Classify confidence level
    const level =
      ensembleScore >= 75 ? "high" : ensembleScore >= 50 ? "medium" : "low";

    // Generate reasoning
    const reasoning = this.generateReasoning(
      ensembleScore,
      lexicalFeatures,
      semanticFeatures,
      historicalFeatures
    );

    return {
      score: Math.round(ensembleScore),
      level,
      features: {
        lexical: lexicalFeatures,
        semantic: semanticFeatures,
        historical: historicalFeatures,
        weights,
      },
      reasoning,
      scoredAt: new Date().toISOString(),
    };
  }

  // ============================================
  // Lexical Feature Extraction
  // ============================================

  private extractLexicalFeatures(query: string): LexicalFeatures {
    const words = this.tokenize(query);
    const queryLength = words.length;

    // Query specificity (0-100)
    const specificity = this.calculateSpecificity(query, words);

    // Course code detection (e.g., "CS101", "MATH210")
    const hasCourseCode = /\b[A-Z]{2,4}\s?\d{2,4}\b/i.test(query);

    // Week number detection (e.g., "week 3", "week03")
    const hasWeekNumber = /\bweek\s?\d{1,2}\b/i.test(query);

    // Technical term count
    const technicalTermCount = this.countTechnicalTerms(words);

    // Generic pronoun count (it, this, that, these, those)
    const genericPronounCount = this.countGenericPronouns(words);

    // Lexical score (0-100)
    let score = 50; // Baseline

    // Length scoring
    if (
      queryLength >= this.config.lexical.minQueryLength &&
      queryLength <= this.config.lexical.maxQueryLength
    ) {
      score += 10;
    } else if (queryLength < this.config.lexical.minQueryLength) {
      score -= 15; // Penalty for too short
    } else {
      score -= 5; // Slight penalty for too long
    }

    // Specificity scoring
    if (specificity >= this.config.lexical.minSpecificity * 100) {
      score += 15;
    } else {
      score -= 10;
    }

    // Course code bonus
    if (hasCourseCode) {
      score += 10;
    }

    // Week number bonus
    if (hasWeekNumber) {
      score += 5;
    }

    // Technical terms bonus
    score += technicalTermCount * this.config.lexical.technicalTermWeight * 100;

    // Generic pronoun penalty
    score -= genericPronounCount * this.config.lexical.genericPronounPenalty * 100;

    // Clamp score to [0, 100]
    score = Math.max(0, Math.min(100, score));

    return {
      queryLength,
      specificity: Math.round(specificity),
      hasCourseCode,
      hasWeekNumber,
      technicalTermCount,
      genericPronounCount,
      score: Math.round(score),
    };
  }

  private calculateSpecificity(query: string, words: string[]): number {
    // Specificity heuristics:
    // 1. Longer queries are more specific
    // 2. Proper nouns are more specific
    // 3. Numbers and dates are more specific
    // 4. Questions words (what, how, why) reduce specificity

    let specificity = 50; // Baseline

    // Length factor (normalized to 0-1)
    const lengthFactor = Math.min(words.length / 10, 1);
    specificity += lengthFactor * 20;

    // Proper noun detection (capitalized words)
    const properNounCount = words.filter((w) => /^[A-Z]/.test(w)).length;
    specificity += properNounCount * 5;

    // Number/date detection
    const hasNumbers = /\d/.test(query);
    if (hasNumbers) specificity += 10;

    // Question word penalty
    const questionWords = ["what", "how", "why", "when", "where", "who"];
    const hasQuestionWord = questionWords.some((qw) =>
      words.map((w) => w.toLowerCase()).includes(qw)
    );
    if (hasQuestionWord) specificity -= 10;

    // Clamp to [0, 100]
    return Math.max(0, Math.min(100, specificity));
  }

  private countTechnicalTerms(words: string[]): number {
    // Technical term patterns (heuristics)
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/, // Acronyms (HTTP, API, SQL)
      /\b\w+\(\)/, // Function calls (foo())
      /\b\w+\.\w+/, // Dot notation (obj.prop)
      /\b[a-z]+[A-Z]\w*/, // camelCase
      /\b[A-Z][a-z]+[A-Z]\w*/, // PascalCase
    ];

    let count = 0;
    for (const word of words) {
      if (technicalPatterns.some((pattern) => pattern.test(word))) {
        count++;
      }
    }

    return count;
  }

  private countGenericPronouns(words: string[]): number {
    const genericPronouns = ["it", "this", "that", "these", "those"];
    return words.filter((w) => genericPronouns.includes(w.toLowerCase())).length;
  }

  // ============================================
  // Semantic Feature Extraction
  // ============================================

  private extractSemanticFeatures(query: string): SemanticFeatures {
    const queryKeywords = this.extractKeywords(query);

    // Keyword coverage: % of query terms found in corpus (0-1)
    const keywordCoverage = this.calculateKeywordCoverage(queryKeywords);

    // Ambiguity score: lower = less ambiguous (0-1)
    const ambiguity = this.calculateAmbiguity(query, queryKeywords);

    // Topic focus: single topic (low) vs multi-topic (high) (0-1)
    const topicFocus = this.calculateTopicFocus(queryKeywords);

    // Semantic score (0-100)
    let score = 50; // Baseline

    // Keyword coverage bonus
    if (keywordCoverage >= this.config.semantic.minKeywordCoverage) {
      score += 20;
    } else {
      score -= 15;
    }

    // Ambiguity penalty
    if (ambiguity <= this.config.semantic.maxAmbiguity) {
      score += 15;
    } else {
      score -= 10;
    }

    // Topic focus bonus
    if (topicFocus >= this.config.semantic.minTopicFocus) {
      score += 15;
    } else {
      score -= 10;
    }

    // Clamp score to [0, 100]
    score = Math.max(0, Math.min(100, score));

    return {
      keywordCoverage: Math.round(keywordCoverage * 100) / 100,
      ambiguity: Math.round(ambiguity * 100) / 100,
      topicFocus: Math.round(topicFocus * 100) / 100,
      score: Math.round(score),
    };
  }

  private calculateKeywordCoverage(queryKeywords: string[]): number {
    if (queryKeywords.length === 0) return 0;

    const matchedCount = queryKeywords.filter((kw) =>
      this.corpusKeywords.has(kw.toLowerCase())
    ).length;

    return matchedCount / queryKeywords.length;
  }

  private calculateAmbiguity(query: string, queryKeywords: string[]): number {
    // Ambiguity heuristics:
    // 1. Vague words increase ambiguity
    // 2. Shorter queries are more ambiguous
    // 3. Generic terms increase ambiguity

    let ambiguity = 0.5; // Baseline

    const vageWords = [
      "thing",
      "stuff",
      "something",
      "anything",
      "everything",
      "some",
      "any",
      "all",
      "general",
      "basic",
      "simple",
      "complex",
    ];

    // Vague word penalty
    const vagueness = queryKeywords.filter((kw) =>
      vageWords.includes(kw.toLowerCase())
    ).length;
    ambiguity += vagueness * 0.1;

    // Length factor (shorter = more ambiguous)
    if (queryKeywords.length < 3) {
      ambiguity += 0.2;
    } else if (queryKeywords.length > 6) {
      ambiguity -= 0.1;
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, ambiguity));
  }

  private calculateTopicFocus(queryKeywords: string[]): number {
    // Topic focus heuristic: fewer distinct keywords = higher focus
    // Normalized to 0-1 (higher = more focused)

    if (queryKeywords.length === 0) return 0;

    // Simple heuristic: inverse of normalized keyword count
    const normalizedCount = Math.min(queryKeywords.length / 10, 1);
    return 1 - normalizedCount;
  }

  // ============================================
  // Historical Feature Extraction
  // ============================================

  private extractHistoricalFeatures(
    query: string,
    queryHistory?: QueryHistoryEntry[]
  ): HistoricalFeatures {
    if (!this.config.enableHistorical || !queryHistory || queryHistory.length === 0) {
      // No historical data - return neutral scores
      return {
        pastSuccessRate: 0.5,
        similarityToPast: 0.5,
        userFamiliarity: 0.5,
        cacheHitProbability: 0.5,
        score: 50,
      };
    }

    const normalizedQuery = this.normalizeQuery(query);

    // Past success rate for similar queries (0-1)
    const pastSuccessRate = this.calculatePastSuccessRate(
      normalizedQuery,
      queryHistory
    );

    // Similarity to past successful queries (0-1)
    const similarityToPast = this.calculateSimilarityToPast(
      normalizedQuery,
      queryHistory
    );

    // User familiarity with topic (0-1)
    const userFamiliarity = this.calculateUserFamiliarity(normalizedQuery, queryHistory);

    // Cache hit probability (0-1)
    const cacheHitProbability = this.calculateCacheHitProbability(
      normalizedQuery,
      queryHistory
    );

    // Historical score (0-100)
    let score = 50; // Baseline

    // Past success bonus
    if (pastSuccessRate >= this.config.historical.minPastSuccessRate) {
      score += 15;
    } else {
      score -= 10;
    }

    // Similarity bonus
    if (similarityToPast >= this.config.historical.similarityThreshold) {
      score += 20;
    } else {
      score -= 5;
    }

    // Familiarity bonus
    if (userFamiliarity >= this.config.historical.minUserFamiliarity) {
      score += 10;
    }

    // Cache probability bonus
    score += cacheHitProbability * 15;

    // Clamp score to [0, 100]
    score = Math.max(0, Math.min(100, score));

    return {
      pastSuccessRate: Math.round(pastSuccessRate * 100) / 100,
      similarityToPast: Math.round(similarityToPast * 100) / 100,
      userFamiliarity: Math.round(userFamiliarity * 100) / 100,
      cacheHitProbability: Math.round(cacheHitProbability * 100) / 100,
      score: Math.round(score),
    };
  }

  private calculatePastSuccessRate(
    normalizedQuery: string,
    queryHistory: QueryHistoryEntry[]
  ): number {
    // Find similar past queries
    const similarQueries = queryHistory.filter(
      (entry) => this.querySimilarity(normalizedQuery, entry.normalizedQuery) > 0.8
    );

    if (similarQueries.length === 0) return 0.5; // Neutral default

    const successCount = similarQueries.filter((entry) => entry.success).length;
    return successCount / similarQueries.length;
  }

  private calculateSimilarityToPast(
    normalizedQuery: string,
    queryHistory: QueryHistoryEntry[]
  ): number {
    if (queryHistory.length === 0) return 0.5;

    // Calculate max similarity to any past query
    let maxSimilarity = 0;
    for (const entry of queryHistory) {
      const similarity = this.querySimilarity(normalizedQuery, entry.normalizedQuery);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    return maxSimilarity;
  }

  private calculateUserFamiliarity(
    normalizedQuery: string,
    queryHistory: QueryHistoryEntry[]
  ): number {
    // Familiarity = frequency of similar queries
    const similarQueries = queryHistory.filter(
      (entry) => this.querySimilarity(normalizedQuery, entry.normalizedQuery) > 0.6
    );

    // Normalize by total history length
    return Math.min(similarQueries.length / 10, 1);
  }

  private calculateCacheHitProbability(
    normalizedQuery: string,
    queryHistory: QueryHistoryEntry[]
  ): number {
    // Find exact or near-exact matches
    const exactMatches = queryHistory.filter(
      (entry) => this.querySimilarity(normalizedQuery, entry.normalizedQuery) > 0.95
    );

    if (exactMatches.length === 0) return 0.1; // Low probability

    // Higher probability if recently queried
    const recentMatches = exactMatches.filter(
      (entry) => Date.now() - entry.timestamp < 86400000 // 24 hours
    );

    return recentMatches.length > 0 ? 0.9 : 0.6;
  }

  // ============================================
  // Utilities
  // ============================================

  private querySimilarity(query1: string, query2: string): number {
    // Simple Jaccard similarity on word sets
    const words1 = new Set(this.tokenize(query1));
    const words2 = new Set(this.tokenize(query2));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\s+/g, " "); // Collapse whitespace
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  private extractKeywords(text: string): string[] {
    const words = this.tokenize(text);

    // Remove stopwords
    const stopwords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "them",
      "their",
      "what",
      "which",
      "who",
      "when",
      "where",
      "why",
      "how",
    ]);

    return words.filter((word) => !stopwords.has(word) && word.length > 2);
  }

  private generateReasoning(
    ensembleScore: number,
    lexical: LexicalFeatures,
    semantic: SemanticFeatures,
    historical: HistoricalFeatures
  ): string {
    const reasons: string[] = [];

    // Lexical reasoning
    if (lexical.score >= 70) {
      reasons.push(
        `Strong lexical features (specificity: ${lexical.specificity}, length: ${lexical.queryLength} words)`
      );
    } else if (lexical.score < 40) {
      reasons.push(
        `Weak lexical features (too ${lexical.queryLength < 3 ? "short" : "vague"})`
      );
    }

    if (lexical.hasCourseCode) {
      reasons.push("Contains course code");
    }

    if (lexical.technicalTermCount > 0) {
      reasons.push(`${lexical.technicalTermCount} technical terms detected`);
    }

    // Semantic reasoning
    if (semantic.score >= 70) {
      reasons.push(
        `Good semantic match (coverage: ${(semantic.keywordCoverage * 100).toFixed(0)}%)`
      );
    } else if (semantic.score < 40) {
      reasons.push(
        `Poor semantic match (ambiguity: ${(semantic.ambiguity * 100).toFixed(0)}%)`
      );
    }

    // Historical reasoning
    if (this.config.enableHistorical && historical.score >= 70) {
      reasons.push(
        `High success rate from similar past queries (${(historical.pastSuccessRate * 100).toFixed(0)}%)`
      );
    }

    if (historical.cacheHitProbability > 0.8) {
      reasons.push("High cache hit probability");
    }

    // Overall assessment
    if (ensembleScore >= 75) {
      reasons.unshift("High confidence query");
    } else if (ensembleScore >= 50) {
      reasons.unshift("Medium confidence query");
    } else {
      reasons.unshift("Low confidence query");
    }

    return reasons.join(". ") + ".";
  }
}

// ============================================
// QueryExpander: Pseudo-Relevance Feedback (PRF)
// ============================================

import type {
  QueryExpansionConfig,
  QueryExpansionResult,
  ExpansionTerm,
  RelevantDocument,
  TermStatistics,
  ExpansionMetrics,
} from "./types";
import { DEFAULT_QUERY_EXPANSION_CONFIG } from "./types";
import type { CourseMaterial } from "@/lib/models/types";

/**
 * QueryExpander: Expands queries using pseudo-relevance feedback
 *
 * Rocchio Algorithm:
 * Q' = α * Q + β * (1/|R|) * Σ(d ∈ R)
 *
 * Where:
 * - Q' = expanded query vector
 * - Q = original query vector
 * - R = set of relevant documents (top-K retrieved)
 * - α = original query weight
 * - β = relevant documents weight
 *
 * Steps:
 * 1. Retrieve top-K documents using initial query
 * 2. Extract candidate terms from top-K docs
 * 3. Compute term weights (TF-IDF or query-biased)
 * 4. Select top-N terms using MMR (relevance + diversity)
 * 5. Append expansion terms to original query
 */
export class QueryExpander {
  private config: QueryExpansionConfig;
  private corpusSize: number = 0;
  private termDocumentFrequencies: Map<string, number> = new Map();

  constructor(config: Partial<QueryExpansionConfig> = {}) {
    this.config = { ...DEFAULT_QUERY_EXPANSION_CONFIG, ...config };
  }

  /**
   * Initialize corpus statistics for IDF computation
   */
  public initializeCorpus(materials: CourseMaterial[]): void {
    this.corpusSize = materials.length;
    this.termDocumentFrequencies.clear();

    // Compute document frequencies for all terms
    for (const material of materials) {
      const terms = this.tokenize(material.content);
      const uniqueTerms = new Set(terms);

      uniqueTerms.forEach((term) => {
        this.termDocumentFrequencies.set(
          term,
          (this.termDocumentFrequencies.get(term) || 0) + 1
        );
      });
    }
  }

  /**
   * Expand query using top-K relevant documents
   */
  public expandQuery(
    query: string,
    topKMaterials: CourseMaterial[]
  ): QueryExpansionResult {
    const startTime = Date.now();

    // 1. Prepare relevant documents
    const relevantDocs = this.prepareRelevantDocuments(topKMaterials);

    // 2. Extract and rank candidate terms
    const candidateTerms = this.extractCandidateTerms(query, relevantDocs);

    // 3. Select expansion terms using MMR
    const expansionTerms = this.selectExpansionTerms(
      query,
      candidateTerms,
      this.config.expansionTerms
    );

    // 4. Build expanded query
    const expandedQuery = this.buildExpandedQuery(query, expansionTerms);

    // 5. Compute metrics
    const expansionTime = Date.now() - startTime;
    const metrics = this.computeMetrics(
      candidateTerms,
      expansionTerms,
      expansionTime
    );

    return {
      originalQuery: query,
      expandedQuery,
      expansionTerms,
      documentsUsed: relevantDocs.length,
      algorithm: this.config.algorithm,
      expandedAt: new Date().toISOString(),
      metrics,
    };
  }

  // ============================================
  // Private Methods: Document Preparation
  // ============================================

  private prepareRelevantDocuments(
    materials: CourseMaterial[]
  ): RelevantDocument[] {
    return materials.slice(0, this.config.topK).map((material, idx) => ({
      material,
      relevance: 1.0 - idx / materials.length, // Linear decay by rank
      terms: this.tokenize(material.content),
    }));
  }

  // ============================================
  // Private Methods: Term Extraction & Weighting
  // ============================================

  private extractCandidateTerms(
    query: string,
    relevantDocs: RelevantDocument[]
  ): ExpansionTerm[] {
    // Get query terms for filtering
    const queryTerms = new Set(this.tokenize(query));

    // Aggregate term statistics across all relevant docs
    const termStats = new Map<string, TermStatistics>();

    for (const doc of relevantDocs) {
      const termFrequencies = this.computeTermFrequencies(doc.terms);

      for (const [term, tf] of termFrequencies.entries()) {
        // Skip query terms (already in query)
        if (queryTerms.has(term)) continue;

        // Skip terms outside frequency thresholds
        if (tf < this.config.minTermFrequency) continue;

        const df = this.termDocumentFrequencies.get(term) || 1;
        const dfRatio = df / this.corpusSize;
        if (dfRatio > this.config.maxTermFrequency) continue;

        // Compute IDF
        const idf = Math.log((this.corpusSize + 1) / (df + 1));

        // Aggregate statistics
        if (!termStats.has(term)) {
          termStats.set(term, {
            term,
            tf: 0,
            df,
            idf,
            tfidf: 0,
          });
        }

        const stats = termStats.get(term)!;
        stats.tf += tf * doc.relevance; // Weight by document relevance
        stats.tfidf += tf * idf * doc.relevance;
      }
    }

    // Convert to ExpansionTerm format
    const candidateTerms: ExpansionTerm[] = [];

    for (const stats of termStats.values()) {
      // Compute final weight based on algorithm
      let weight = 0;

      switch (this.config.termWeighting) {
        case "tfidf":
          weight = stats.tfidf;
          break;

        case "query-biased":
          // Query-biased: boost terms that appear in multiple relevant docs
          const docCount = Math.min(stats.tf, relevantDocs.length);
          weight = stats.tfidf * (docCount / relevantDocs.length);
          break;

        case "bm25":
          // Simplified BM25 (k1=1.2, b=0.75)
          const avgDocLength = 1000; // Rough approximation
          const docLength = 1000;
          const k1 = 1.2;
          const b = 0.75;
          const bm25 =
            (stats.idf *
              (stats.tf * (k1 + 1))) /
            (stats.tf + k1 * (1 - b + b * (docLength / avgDocLength)));
          weight = bm25;
          break;
      }

      // Find source materials for this term
      const sourceMaterialIds = relevantDocs
        .filter((doc) => doc.terms.includes(stats.term))
        .map((doc) => doc.material.id);

      candidateTerms.push({
        term: stats.term,
        relevance: stats.tfidf / (1 + stats.tfidf), // Normalize to 0-1
        frequency: Math.round(stats.tf),
        idf: stats.idf,
        weight,
        sourceMaterialIds,
      });
    }

    // Sort by weight (descending)
    candidateTerms.sort((a, b) => b.weight - a.weight);

    return candidateTerms;
  }

  private computeTermFrequencies(terms: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const term of terms) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }

    return frequencies;
  }

  // ============================================
  // Private Methods: Term Selection (MMR)
  // ============================================

  private selectExpansionTerms(
    query: string,
    candidates: ExpansionTerm[],
    maxTerms: number
  ): ExpansionTerm[] {
    if (candidates.length === 0) return [];

    const selected: ExpansionTerm[] = [];
    const remaining = [...candidates];

    // MMR: Maximal Marginal Relevance
    // Score(term) = λ * relevance - (1-λ) * max_similarity(term, selected)
    const lambda = this.config.mmrLambda;

    while (selected.length < maxTerms && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Relevance component
        const relevance = candidate.weight;

        // Diversity component (similarity to already-selected terms)
        let maxSimilarity = 0;
        if (selected.length > 0) {
          for (const selectedTerm of selected) {
            const similarity = this.termSimilarity(
              candidate.term,
              selectedTerm.term
            );
            maxSimilarity = Math.max(maxSimilarity, similarity);
          }
        }

        // MMR score
        const score = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      // Add best candidate to selected
      selected.push(remaining[bestIndex]);
      remaining.splice(bestIndex, 1);
    }

    return selected;
  }

  private termSimilarity(term1: string, term2: string): number {
    // Simple character-level similarity (Jaccard)
    const chars1 = new Set(term1.split(""));
    const chars2 = new Set(term2.split(""));

    const intersection = new Set(
      [...chars1].filter((c) => chars2.has(c))
    );
    const union = new Set([...chars1, ...chars2]);

    return intersection.size / union.size;
  }

  // ============================================
  // Private Methods: Query Building
  // ============================================

  private buildExpandedQuery(
    originalQuery: string,
    expansionTerms: ExpansionTerm[]
  ): string {
    const expansionString = expansionTerms.map((t) => t.term).join(" ");
    return `${originalQuery} ${expansionString}`.trim();
  }

  // ============================================
  // Private Methods: Text Processing
  // ============================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && word.length < 20); // Filter stop words and very long words
  }

  // ============================================
  // Private Methods: Metrics
  // ============================================

  private computeMetrics(
    candidateTerms: ExpansionTerm[],
    expansionTerms: ExpansionTerm[],
    expansionTime: number
  ): ExpansionMetrics {
    const avgTermWeight =
      expansionTerms.length > 0
        ? expansionTerms.reduce((sum, t) => sum + t.weight, 0) /
          expansionTerms.length
        : 0;

    const avgTermRelevance =
      expansionTerms.length > 0
        ? expansionTerms.reduce((sum, t) => sum + t.relevance, 0) /
          expansionTerms.length
        : 0;

    return {
      expansionTime,
      candidateTermsCount: candidateTerms.length,
      termsAdded: expansionTerms.length,
      avgTermWeight,
      avgTermRelevance,
    };
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  /**
   * Get current configuration
   */
  public getConfig(): QueryExpansionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<QueryExpansionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get corpus statistics
   */
  public getCorpusStats(): { size: number; uniqueTerms: number } {
    return {
      size: this.corpusSize,
      uniqueTerms: this.termDocumentFrequencies.size,
    };
  }
}

// ============================================
// Maximal Marginal Relevance (MMR) Diversification
// ============================================

import type { RetrievalResult, MMRParams, Embedding } from "./types";

/**
 * MMR Diversifier
 *
 * Implements Maximal Marginal Relevance to reduce redundancy in results.
 * Balances relevance (to query) and diversity (from already selected results).
 *
 * MMR Formula:
 * MMR = argmax[D_i ∈ R \ S] [λ * Sim1(D_i, Q) - (1-λ) * max[D_j ∈ S] Sim2(D_i, D_j)]
 *
 * Where:
 * - R = ranked list of results
 * - S = already selected results
 * - Q = query
 * - λ = balance parameter (0-1, typical: 0.7)
 * - Sim1 = similarity to query (relevance)
 * - Sim2 = similarity to selected results (redundancy)
 *
 * Benefits:
 * - Reduces near-duplicate results
 * - Ensures coverage of different aspects
 * - Maintains high relevance while adding diversity
 *
 * Reference: "The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries"
 * Carbonell and Goldstein (1998)
 */
export class MMRDiversifier {
  private params: Required<MMRParams>;

  constructor(params?: Partial<MMRParams>) {
    this.params = {
      lambda: params?.lambda ?? 0.7,
    };
  }

  /**
   * Apply MMR to diversify results
   *
   * @param results - Results to diversify (should already be scored by relevance)
   * @param limit - Maximum number of results to return
   * @param getEmbedding - Function to get embedding for a result (optional, uses content similarity if not provided)
   * @returns Diversified results
   */
  diversify<T extends RetrievalResult>(
    results: T[],
    limit: number,
    getEmbedding?: (result: T) => Embedding | null
  ): T[] {
    if (results.length <= limit) {
      // No need to diversify if we're returning all results
      return results;
    }

    const selected: T[] = [];
    const remaining = [...results];

    // Always select the top result (highest relevance)
    if (remaining.length > 0) {
      selected.push(remaining.shift()!);
    }

    // Iteratively select remaining results using MMR
    while (selected.length < limit && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Calculate MMR score
        const mmrScore = this.calculateMMRScore(
          candidate,
          selected,
          getEmbedding
        );

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      // Select best candidate
      const [selectedResult] = remaining.splice(bestIndex, 1);
      selected.push(selectedResult);
    }

    return selected;
  }

  /**
   * Calculate MMR score for a candidate
   *
   * MMR = λ * Relevance - (1-λ) * MaxSimilarity
   */
  private calculateMMRScore<T extends RetrievalResult>(
    candidate: T,
    selected: T[],
    getEmbedding?: (result: T) => Embedding | null
  ): number {
    const { lambda } = this.params;

    // Relevance component (use original score)
    const relevance = candidate.score;

    // Diversity component (max similarity to already selected results)
    let maxSimilarity = 0;

    for (const selectedResult of selected) {
      const similarity = getEmbedding
        ? this.cosineSimilarityFromEmbeddings(candidate, selectedResult, getEmbedding)
        : this.contentSimilarity(candidate, selectedResult);

      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Combine with lambda parameter
    const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

    return mmrScore;
  }

  /**
   * Calculate cosine similarity using embeddings
   */
  private cosineSimilarityFromEmbeddings<T extends RetrievalResult>(
    a: T,
    b: T,
    getEmbedding: (result: T) => Embedding | null
  ): number {
    const embeddingA = getEmbedding(a);
    const embeddingB = getEmbedding(b);

    if (!embeddingA || !embeddingB) {
      return 0;
    }

    return this.cosineSimilarity(embeddingA.vector, embeddingB.vector);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Calculate content similarity using Jaccard coefficient
   *
   * Fallback when embeddings are not available.
   * Uses keywords and content for simple similarity measure.
   */
  private contentSimilarity<T extends RetrievalResult>(a: T, b: T): number {
    // Extract tokens from both materials
    const tokensA = new Set(this.extractTokens(a.material.content));
    const tokensB = new Set(this.extractTokens(b.material.content));

    // Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|
    const intersection = new Set([...tokensA].filter(t => tokensB.has(t)));
    const union = new Set([...tokensA, ...tokensB]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Extract tokens from text
   */
  private extractTokens(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Get current lambda parameter
   */
  getLambda(): number {
    return this.params.lambda;
  }

  /**
   * Set lambda parameter
   */
  setLambda(lambda: number): void {
    if (lambda < 0 || lambda > 1) {
      throw new Error("Lambda must be between 0 and 1");
    }

    this.params.lambda = lambda;
  }
}

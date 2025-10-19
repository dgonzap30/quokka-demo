// ============================================
// Hybrid Retrieval with RRF Fusion
// ============================================

import type { CourseMaterial } from "@/lib/models/types";
import type {
  IRetriever,
  RetrievalResult,
  HybridRetrievalConfig,
  RetrievalMetrics,
} from "./types";

/**
 * Hybrid Retriever
 *
 * Combines sparse (BM25) and dense (embedding) retrieval using Reciprocal Rank Fusion (RRF).
 *
 * RRF Formula:
 * RRFscore(d) = Σ 1 / (k + rank_i(d))
 *
 * Where:
 * - d = document
 * - rank_i(d) = rank of document d in result set i
 * - k = constant (typical: 60)
 * - Σ = sum over all result sets (BM25, embeddings)
 *
 * Benefits of RRF:
 * - No score normalization needed (rank-based)
 * - Robust to different score scales
 * - Simple and effective
 * - Well-established in information retrieval
 *
 * Reference: "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods"
 * Cormack, Clarke, and Buettcher (2009)
 */
export class HybridRetriever implements IRetriever {
  private bm25Retriever: IRetriever;
  private embeddingRetriever: IRetriever;
  private config: Required<HybridRetrievalConfig>;
  private materials: CourseMaterial[];

  constructor(
    bm25Retriever: IRetriever,
    embeddingRetriever: IRetriever,
    materials: CourseMaterial[],
    config?: HybridRetrievalConfig
  ) {
    this.bm25Retriever = bm25Retriever;
    this.embeddingRetriever = embeddingRetriever;
    this.materials = materials;

    // Normalize config with defaults
    this.config = {
      bm25Weight: config?.bm25Weight ?? 0.5,
      embeddingWeight: config?.embeddingWeight ?? 0.5,
      useRRF: config?.useRRF ?? true,
      rrfK: config?.rrfK ?? 60,
      useMMR: config?.useMMR ?? false, // MMR added later
      mmrLambda: config?.mmrLambda ?? 0.7,
      useReranker: config?.useReranker ?? false,
      bm25K1: config?.bm25K1 ?? 1.5,
      bm25B: config?.bm25B ?? 0.75,
    };
  }

  /**
   * Retrieve using hybrid approach
   */
  async retrieve(query: string, limit: number = 10): Promise<RetrievalResult[]> {
    const startTime = performance.now();
    const metrics: Partial<RetrievalMetrics> = {
      resultsCount: 0,
    };

    try {
      // 1. Retrieve from both sources in parallel
      const bm25Start = performance.now();
      const embeddingStart = performance.now();

      const [bm25Results, embeddingResults] = await Promise.all([
        this.bm25Retriever.retrieve(query, limit * 2), // Get more candidates for fusion
        this.embeddingRetriever.retrieve(query, limit * 2),
      ]);

      metrics.bm25Time = performance.now() - bm25Start;
      metrics.embeddingTime = performance.now() - embeddingStart;

      // 2. Fuse results
      const fusionStart = performance.now();
      const fusedResults = this.config.useRRF
        ? this.fuseWithRRF(bm25Results, embeddingResults, this.config.rrfK)
        : this.fuseWithWeightedScores(bm25Results, embeddingResults);

      metrics.fusionTime = performance.now() - fusionStart;

      // 3. Limit and return
      const finalResults = fusedResults.slice(0, limit);

      metrics.resultsCount = finalResults.length;
      metrics.queryTime = performance.now() - startTime;

      // Log metrics for monitoring
      console.log(`[HybridRetriever] Query: "${query.substring(0, 50)}..." | Results: ${finalResults.length} | Time: ${metrics.queryTime.toFixed(2)}ms`);

      return finalResults;
    } catch (error) {
      console.error(`[HybridRetriever] Error during retrieval:`, error);
      throw error;
    }
  }

  /**
   * Fuse results using Reciprocal Rank Fusion (RRF)
   *
   * RRF is score-agnostic and works purely on ranks.
   * This makes it robust to different score scales from BM25 vs embeddings.
   */
  private fuseWithRRF(
    bm25Results: RetrievalResult[],
    embeddingResults: RetrievalResult[],
    k: number = 60
  ): RetrievalResult[] {
    const rrfScores = new Map<string, { score: number; material: CourseMaterial }>();

    // Process BM25 results
    bm25Results.forEach((result, rank) => {
      const materialId = result.material.id;
      const rrfScore = 1 / (k + rank + 1); // +1 because ranks are 0-indexed

      rrfScores.set(materialId, {
        score: rrfScore * this.config.bm25Weight,
        material: result.material,
      });
    });

    // Add embedding results
    embeddingResults.forEach((result, rank) => {
      const materialId = result.material.id;
      const rrfScore = 1 / (k + rank + 1);

      const existing = rrfScores.get(materialId);

      if (existing) {
        // Material appears in both result sets - add scores
        existing.score += rrfScore * this.config.embeddingWeight;
      } else {
        rrfScores.set(materialId, {
          score: rrfScore * this.config.embeddingWeight,
          material: result.material,
        });
      }
    });

    // Convert to results and sort
    const fusedResults: RetrievalResult[] = [];

    for (const [_materialId, { score, material }] of rrfScores) {
      fusedResults.push({
        material,
        score,
        metadata: {
          retriever: "hybrid-rrf",
          rrfScore: score,
        },
      });
    }

    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Fuse results using weighted score combination
   *
   * Alternative to RRF. Requires score normalization.
   * Less robust but more interpretable.
   */
  private fuseWithWeightedScores(
    bm25Results: RetrievalResult[],
    embeddingResults: RetrievalResult[]
  ): RetrievalResult[] {
    // Normalize scores to 0-1 range
    const normalizedBM25 = this.normalizeScores(bm25Results);
    const normalizedEmbedding = this.normalizeScores(embeddingResults);

    const combinedScores = new Map<string, { score: number; material: CourseMaterial }>();

    // Add BM25 scores
    normalizedBM25.forEach(result => {
      const materialId = result.material.id;
      combinedScores.set(materialId, {
        score: result.score * this.config.bm25Weight,
        material: result.material,
      });
    });

    // Add embedding scores
    normalizedEmbedding.forEach(result => {
      const materialId = result.material.id;
      const existing = combinedScores.get(materialId);

      if (existing) {
        existing.score += result.score * this.config.embeddingWeight;
      } else {
        combinedScores.set(materialId, {
          score: result.score * this.config.embeddingWeight,
          material: result.material,
        });
      }
    });

    // Convert to results and sort
    const fusedResults: RetrievalResult[] = [];

    for (const [_materialId, { score, material }] of combinedScores) {
      fusedResults.push({
        material,
        score,
        metadata: {
          retriever: "hybrid-weighted",
          combinedScore: score,
        },
      });
    }

    return fusedResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Normalize scores to 0-1 range using min-max normalization
   */
  private normalizeScores(results: RetrievalResult[]): RetrievalResult[] {
    if (results.length === 0) {
      return [];
    }

    const scores = results.map(r => r.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;

    if (range === 0) {
      // All scores are the same
      return results.map(r => ({ ...r, score: 1.0 }));
    }

    return results.map(r => ({
      ...r,
      score: (r.score - minScore) / range,
    }));
  }

  /**
   * Get configuration
   */
  getConfig(): HybridRetrievalConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<HybridRetrievalConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

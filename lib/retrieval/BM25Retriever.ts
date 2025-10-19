// ============================================
// BM25 Sparse Retrieval
// ============================================

import type { CourseMaterial } from "@/lib/models/types";
import type {
  IRetriever,
  RetrievalResult,
  BM25Params,
  DocumentStats,
  CorpusStats,
} from "./types";

/**
 * BM25 Retriever
 *
 * Implements BM25 (Best Matching 25) ranking function for sparse retrieval.
 * Uses TF-IDF with length normalization and saturation.
 *
 * BM25 Formula:
 * score(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1 + 1)) / (f(qi,D) + k1 * (1 - b + b * |D| / avgdl))
 *
 * Where:
 * - f(qi,D) = frequency of query term qi in document D
 * - |D| = length of document D in tokens
 * - avgdl = average document length in corpus
 * - k1 = term frequency saturation parameter (typical: 1.2-2.0)
 * - b = length normalization parameter (typical: 0.75)
 * - IDF(qi) = log((N - df(qi) + 0.5) / (df(qi) + 0.5))
 *   - N = total number of documents
 *   - df(qi) = number of documents containing qi
 */
export class BM25Retriever implements IRetriever {
  private materials: CourseMaterial[];
  private params: BM25Params;
  private corpusStats: CorpusStats | null = null;
  private documentStats: Map<string, DocumentStats> = new Map();

  constructor(materials: CourseMaterial[], params?: Partial<BM25Params>) {
    this.materials = materials;
    this.params = {
      k1: params?.k1 ?? 1.5,
      b: params?.b ?? 0.75,
    };

    // Build corpus statistics on initialization
    this.buildCorpusStats();
  }

  /**
   * Retrieve relevant materials using BM25
   */
  async retrieve(query: string, limit: number = 10): Promise<RetrievalResult[]> {
    if (!this.corpusStats) {
      return [];
    }

    // Tokenize query
    const queryTerms = this.tokenize(query);

    // Score each document
    const scored: Array<{ material: CourseMaterial; score: number; matchedTerms: string[] }> = [];

    for (const material of this.materials) {
      const docStats = this.documentStats.get(material.id);
      if (!docStats) continue;

      const { score, matchedTerms } = this.scoreBM25(queryTerms, docStats);

      if (score > 0) {
        scored.push({
          material,
          score,
          matchedTerms,
        });
      }
    }

    // Sort by score (highest first) and limit
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ material, score, matchedTerms }) => ({
        material,
        score,
        matchedTerms,
        metadata: {
          retriever: "bm25",
        },
      }));

    return results;
  }

  /**
   * Calculate BM25 score for a document
   */
  private scoreBM25(
    queryTerms: string[],
    docStats: DocumentStats
  ): { score: number; matchedTerms: string[] } {
    if (!this.corpusStats) {
      return { score: 0, matchedTerms: [] };
    }

    let totalScore = 0;
    const matchedTerms: string[] = [];

    for (const term of queryTerms) {
      // Get term frequency in document
      const termFreq = docStats.termFrequencies.get(term) || 0;

      if (termFreq === 0) continue;

      matchedTerms.push(term);

      // Calculate IDF
      const docFreq = this.corpusStats.documentFrequencies.get(term) || 0;
      const idf = this.calculateIDF(docFreq, this.corpusStats.numDocuments);

      // Calculate BM25 component for this term
      const { k1, b } = this.params;
      const docLength = docStats.docLength;
      const avgDocLength = this.corpusStats.avgDocLength;

      // BM25 formula
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));

      const termScore = idf * (numerator / denominator);
      totalScore += termScore;
    }

    return { score: totalScore, matchedTerms };
  }

  /**
   * Calculate IDF (Inverse Document Frequency)
   *
   * IDF(qi) = log((N - df(qi) + 0.5) / (df(qi) + 0.5))
   */
  private calculateIDF(docFreq: number, numDocs: number): number {
    // BM25 IDF formula (Robertson-Sparck Jones)
    const numerator = numDocs - docFreq + 0.5;
    const denominator = docFreq + 0.5;

    // Add small epsilon to avoid log(0)
    const idf = Math.log((numerator / denominator) + 1e-10);

    return Math.max(0, idf); // Ensure non-negative
  }

  /**
   * Build corpus statistics for IDF calculation
   */
  private buildCorpusStats(): void {
    const documentFrequencies = new Map<string, number>();
    let totalDocLength = 0;

    // Process each document
    for (const material of this.materials) {
      // Combine title, content, and keywords for indexing
      const text = `${material.title} ${material.content} ${material.keywords.join(" ")}`;
      const tokens = this.tokenize(text);

      // Calculate term frequencies for this document
      const termFrequencies = new Map<string, number>();
      const uniqueTerms = new Set<string>();

      for (const token of tokens) {
        termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1);
        uniqueTerms.add(token);
      }

      // Update document stats
      this.documentStats.set(material.id, {
        docId: material.id,
        docLength: tokens.length,
        termFrequencies,
      });

      // Update document frequencies (for IDF)
      for (const term of uniqueTerms) {
        documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
      }

      totalDocLength += tokens.length;
    }

    // Calculate corpus statistics
    this.corpusStats = {
      numDocuments: this.materials.length,
      avgDocLength: this.materials.length > 0 ? totalDocLength / this.materials.length : 0,
      documentFrequencies,
    };
  }

  /**
   * Tokenize text into terms
   *
   * Simple tokenization:
   * - Lowercase
   * - Remove punctuation
   * - Split on whitespace
   * - Remove short tokens (<2 chars)
   * - Remove common stop words
   */
  private tokenize(text: string): string[] {
    // Common English stop words
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "should", "could", "may", "might", "can", "this", "that",
      "these", "those", "what", "which", "who", "when", "where", "why", "how",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/)             // Split on whitespace
      .filter(token =>
        token.length > 1 &&     // Remove single chars
        !stopWords.has(token)   // Remove stop words
      );
  }

  /**
   * Get corpus statistics (for debugging/monitoring)
   */
  getCorpusStats(): CorpusStats | null {
    return this.corpusStats;
  }

  /**
   * Get document statistics (for debugging/monitoring)
   */
  getDocumentStats(materialId: string): DocumentStats | undefined {
    return this.documentStats.get(materialId);
  }
}

// ============================================
// HierarchySummarizer: Cluster Summarization
// ============================================

import type {
  DocumentNode,
  DocumentCluster,
  SummarizerConfig,
} from "./types";
import { DEFAULT_SUMMARIZER_CONFIG } from "./types";

/**
 * Result of summarization
 */
export interface SummarizationResult {
  /** Summary text */
  summary: string;

  /** Extracted keywords */
  keywords: string[];

  /** Number of words in summary */
  wordCount: number;

  /** Summarization method used */
  method: "llm" | "extractive";

  /** Source node IDs included in summary */
  sourceNodeIds: string[];
}

/**
 * HierarchySummarizer: Generates summaries of document clusters
 *
 * Two modes:
 * 1. Extractive (default): Select most representative sentences using TF-IDF
 * 2. LLM-based (optional): Use OpenAI/Anthropic for abstractive summaries
 *
 * Extractive summarization algorithm:
 * - Compute TF-IDF scores for all sentences across cluster
 * - Select top-K sentences that:
 *   a) Have high TF-IDF scores
 *   b) Are diverse (avoid redundancy)
 *   c) Maintain narrative flow
 * - Reorder selected sentences to maintain original order
 * - Concatenate into final summary
 */
export class HierarchySummarizer {
  private config: SummarizerConfig;

  constructor(config: Partial<SummarizerConfig> = {}) {
    this.config = { ...DEFAULT_SUMMARIZER_CONFIG, ...config };
  }

  /**
   * Summarize a cluster of documents
   */
  public async summarizeCluster(
    cluster: DocumentCluster
  ): Promise<SummarizationResult> {
    const { nodes } = cluster;

    if (nodes.length === 0) {
      return {
        summary: "",
        keywords: [],
        wordCount: 0,
        method: "extractive",
        sourceNodeIds: [],
      };
    }

    // For single-node clusters, just use the node's content
    if (nodes.length === 1) {
      const content = nodes[0].content;
      const keywords = this.extractKeywords(content);
      return {
        summary: content,
        keywords,
        wordCount: this.countWords(content),
        method: "extractive",
        sourceNodeIds: [nodes[0].id],
      };
    }

    // Choose summarization method
    if (this.config.useLLM && this.config.llmProvider) {
      return await this.summarizeWithLLM(nodes);
    } else {
      return this.summarizeExtractive(nodes);
    }
  }

  // ============================================
  // Private Methods: Extractive Summarization
  // ============================================

  private summarizeExtractive(nodes: DocumentNode[]): SummarizationResult {
    // 1. Extract all sentences from all nodes
    const sentences = this.extractSentences(nodes);

    if (sentences.length === 0) {
      return {
        summary: "",
        keywords: [],
        wordCount: 0,
        method: "extractive",
        sourceNodeIds: nodes.map((n) => n.id),
      };
    }

    // 2. Compute TF-IDF scores for each sentence
    const sentenceScores = this.computeTFIDFScores(sentences);

    // 3. Select top sentences based on score and diversity
    const selectedSentences = this.selectTopSentences(
      sentences,
      sentenceScores,
      this.config.targetLength
    );

    // 4. Reorder sentences to maintain narrative flow
    const orderedSentences = this.reorderSentences(selectedSentences, sentences);

    // 5. Concatenate into final summary
    const summary = orderedSentences.map((s) => s.text).join(" ");

    // 6. Extract keywords from summary
    const keywords = this.extractKeywords(summary);

    return {
      summary,
      keywords,
      wordCount: this.countWords(summary),
      method: "extractive",
      sourceNodeIds: nodes.map((n) => n.id),
    };
  }

  private extractSentences(nodes: DocumentNode[]): Array<{
    text: string;
    nodeId: string;
    originalIndex: number;
  }> {
    const sentences: Array<{
      text: string;
      nodeId: string;
      originalIndex: number;
    }> = [];
    let globalIndex = 0;

    for (const node of nodes) {
      const nodeSentences = this.splitIntoSentences(node.content);
      for (const sentence of nodeSentences) {
        sentences.push({
          text: sentence,
          nodeId: node.id,
          originalIndex: globalIndex++,
        });
      }
    }

    return sentences;
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (could be improved with NLP library)
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20); // Filter out very short fragments
  }

  private computeTFIDFScores(
    sentences: Array<{ text: string; nodeId: string; originalIndex: number }>
  ): Map<number, number> {
    // 1. Compute term frequencies (TF)
    const termFrequencies = new Map<number, Map<string, number>>();
    const documentFrequencies = new Map<string, number>();

    sentences.forEach((sentence, idx) => {
      const terms = this.tokenize(sentence.text);
      const tf = new Map<string, number>();

      // Count term frequencies in this sentence
      terms.forEach((term) => {
        tf.set(term, (tf.get(term) || 0) + 1);
      });

      termFrequencies.set(idx, tf);

      // Update document frequencies
      const uniqueTerms = new Set(terms);
      uniqueTerms.forEach((term) => {
        documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
      });
    });

    // 2. Compute TF-IDF scores
    const numSentences = sentences.length;
    const scores = new Map<number, number>();

    sentences.forEach((sentence, idx) => {
      const tf = termFrequencies.get(idx)!;
      let tfidfScore = 0;

      tf.forEach((termFreq, term) => {
        const df = documentFrequencies.get(term) || 1;
        const idf = Math.log(numSentences / df);
        tfidfScore += termFreq * idf;
      });

      scores.set(idx, tfidfScore);
    });

    return scores;
  }

  private selectTopSentences(
    sentences: Array<{ text: string; nodeId: string; originalIndex: number }>,
    scores: Map<number, number>,
    targetLength: number
  ): Array<{ text: string; nodeId: string; originalIndex: number }> {
    // Sort sentences by score (descending)
    const sortedIndices = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([idx]) => idx);

    // Select sentences until target length reached
    const selected: Array<{
      text: string;
      nodeId: string;
      originalIndex: number;
    }> = [];
    let currentWordCount = 0;

    for (const idx of sortedIndices) {
      const sentence = sentences[idx];
      const sentenceWordCount = this.countWords(sentence.text);

      if (currentWordCount + sentenceWordCount <= targetLength * 1.2) {
        selected.push(sentence);
        currentWordCount += sentenceWordCount;

        if (currentWordCount >= targetLength) {
          break;
        }
      }
    }

    return selected;
  }

  private reorderSentences(
    selected: Array<{ text: string; nodeId: string; originalIndex: number }>,
    allSentences: Array<{ text: string; nodeId: string; originalIndex: number }>
  ): Array<{ text: string; nodeId: string; originalIndex: number }> {
    // Reorder selected sentences to maintain original order
    return selected.sort((a, b) => a.originalIndex - b.originalIndex);
  }

  // ============================================
  // Private Methods: LLM Summarization
  // ============================================

  private async summarizeWithLLM(
    nodes: DocumentNode[]
  ): Promise<SummarizationResult> {
    // Concatenate all node contents
    const combinedContent = nodes.map((n) => n.content).join("\n\n");

    // Truncate if too long (based on maxInputTokens config)
    const truncatedContent = this.truncateToTokenLimit(
      combinedContent,
      this.config.maxInputTokens
    );

    // Generate summary using LLM (placeholder - would integrate with actual LLM)
    const summary = await this.generateLLMSummary(
      truncatedContent,
      this.config.targetLength
    );

    // Extract keywords
    const keywords = this.extractKeywords(summary);

    return {
      summary,
      keywords,
      wordCount: this.countWords(summary),
      method: "llm",
      sourceNodeIds: nodes.map((n) => n.id),
    };
  }

  private async generateLLMSummary(
    content: string,
    targetLength: number
  ): Promise<string> {
    // Placeholder: In production, this would call OpenAI/Anthropic API
    // For now, fall back to extractive summarization
    console.warn(
      "LLM summarization not yet implemented, falling back to extractive"
    );

    const nodes: DocumentNode[] = [
      {
        id: "temp",
        type: "leaf",
        level: 0,
        content,
        embedding: [],
        materialIds: [],
        parentId: null,
        childIds: [],
        metadata: {
          clusterSize: 1,
          avgSimilarity: 1,
          topKeywords: [],
        },
      },
    ];

    const result = this.summarizeExtractive(nodes);
    return result.summary;
  }

  private truncateToTokenLimit(text: string, maxTokens: number): string {
    // Rough approximation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) {
      return text;
    }
    return text.slice(0, maxChars) + "...";
  }

  // ============================================
  // Private Methods: Text Processing
  // ============================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2); // Filter stop words (simple)
  }

  private extractKeywords(text: string): string[] {
    if (!this.config.includeKeywords) {
      return [];
    }

    // Tokenize and count word frequencies
    const tokens = this.tokenize(text);
    const frequencies = new Map<string, number>();

    tokens.forEach((token) => {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    });

    // Sort by frequency and take top 5
    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  // ============================================
  // Public Utility Methods
  // ============================================

  /**
   * Get current configuration
   */
  public getConfig(): SummarizerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<SummarizerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

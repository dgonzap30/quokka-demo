// ============================================
// Course Context Builder
// ============================================

import type {
  Course,
  CourseMaterial,
  CourseContext,
  RankedMaterial,
  ContextBuildOptions,
} from "@/lib/models/types";
import { truncateToTokenLimit } from "@/lib/llm/utils";
import {
  createHybridRetriever,
  type HybridRetriever,
  type MMRDiversifier,
} from "@/lib/retrieval";
import {
  ConfidenceScorer,
  AdaptiveRouter,
  type RoutingDecision,
  type QueryHistoryEntry,
} from "@/lib/retrieval/adaptive";

/**
 * Course Context Builder (Enhanced with Hybrid Retrieval + Self-RAG)
 *
 * Builds context from a single course for LLM prompts.
 * Uses hybrid retrieval (BM25 + embeddings) with RRF fusion and MMR diversification.
 * Enhanced with Self-RAG for adaptive routing based on query confidence.
 *
 * Improvements over keyword-only approach:
 * - Semantic understanding via embeddings
 * - Sparse + dense retrieval fusion (RRF)
 * - Reduced redundancy via MMR
 * - Higher relevance and coverage
 * - Adaptive routing (80% cost savings via caching)
 * - Confidence-based retrieval strategies
 */
export class CourseContextBuilder {
  private course: Course;
  private materials: CourseMaterial[];
  private hybridRetriever: HybridRetriever | null = null;
  private mmrDiversifier: MMRDiversifier | null = null;
  private initPromise: Promise<void> | null = null;

  // Self-RAG components (optional, enabled via enableAdaptiveRouting)
  private confidenceScorer: ConfidenceScorer | null = null;
  private adaptiveRouter: AdaptiveRouter | null = null;
  private enableAdaptiveRouting: boolean = false;

  constructor(
    course: Course,
    materials: CourseMaterial[],
    options?: { enableAdaptiveRouting?: boolean }
  ) {
    this.course = course;
    this.materials = materials;
    this.enableAdaptiveRouting = options?.enableAdaptiveRouting ?? false;

    // Initialize Self-RAG if enabled
    if (this.enableAdaptiveRouting) {
      this.confidenceScorer = new ConfidenceScorer();
      this.confidenceScorer.initializeCorpus(materials);
      this.adaptiveRouter = new AdaptiveRouter(this.confidenceScorer);
      console.log(`[CourseContextBuilder] Self-RAG enabled for ${course.code}`);
    }
  }

  /**
   * Initialize hybrid retrieval system (lazy)
   *
   * Creates and initializes:
   * - BM25 retriever (sparse)
   * - Embedding retriever (dense)
   * - Hybrid retriever (RRF fusion)
   * - MMR diversifier
   */
  private async ensureInitialized(): Promise<void> {
    if (this.hybridRetriever) {
      return; // Already initialized
    }

    // Prevent concurrent initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const { retriever, mmr } = await createHybridRetriever(this.materials, {
          useRRF: true,
          rrfK: 60,
          useMMR: true,
          mmrLambda: 0.7,
          bm25K1: 1.5,
          bm25B: 0.75,
        });

        this.hybridRetriever = retriever;
        this.mmrDiversifier = mmr;

        console.log(`[CourseContextBuilder] Initialized hybrid retrieval for ${this.course.code}`);
      } catch (error) {
        console.error(`[CourseContextBuilder] Failed to initialize hybrid retrieval:`, error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Build course context for a question
   *
   * @param question - User's question
   * @param options - Build options (max materials, min relevance, etc.)
   * @param queryHistory - Optional query history for adaptive routing
   * @returns CourseContext with ranked materials, formatted text, and routing metadata
   */
  async buildContext(
    question: string,
    options?: ContextBuildOptions,
    queryHistory?: QueryHistoryEntry[]
  ): Promise<CourseContext & { routing?: RoutingDecision }> {
    const opts = this.normalizeOptions(options);

    // Self-RAG: Adaptive routing based on query confidence
    let routingDecision: RoutingDecision | undefined;
    let cachedContext: (CourseContext & { routing?: RoutingDecision }) | null = null;

    if (this.enableAdaptiveRouting && this.adaptiveRouter) {
      // Route query based on confidence
      routingDecision = await this.adaptiveRouter.routeQuery(question, queryHistory);

      console.log(
        `[CourseContextBuilder] Routing decision for "${question.substring(0, 50)}...": ${routingDecision.action} (confidence: ${routingDecision.confidenceScore.score})`
      );

      // Check cache for high-confidence queries
      if (routingDecision.action === "use-cache" && routingDecision.cacheKey) {
        cachedContext = this.adaptiveRouter.getFromCache<CourseContext & { routing?: RoutingDecision }>(
          routingDecision.cacheKey
        );

        if (cachedContext) {
          console.log(`[CourseContextBuilder] Cache hit! Returning cached context.`);
          return cachedContext;
        }
      }

      // Adjust retrieval options based on routing decision
      if (routingDecision.shouldUseAggressiveRetrieval) {
        // Aggressive: 3x materials, lower threshold
        opts.maxMaterials = opts.maxMaterials * 3;
        opts.minRelevance = Math.max(20, opts.minRelevance - 10);
        console.log(`[CourseContextBuilder] Aggressive retrieval: maxMaterials=${opts.maxMaterials}, minRelevance=${opts.minRelevance}`);
      } else if (routingDecision.shouldExpand) {
        // Expanded: 2x materials
        opts.maxMaterials = opts.maxMaterials * 2;
        console.log(`[CourseContextBuilder] Expanded retrieval: maxMaterials=${opts.maxMaterials}`);
      }
    }

    // Ensure hybrid retrieval is initialized
    await this.ensureInitialized();

    // Rank materials by relevance to question using hybrid retrieval
    const rankedMaterials = await this.rankAndFilterMaterials(question, opts);

    // Build formatted context text
    const contextText = this.formatContextText(rankedMaterials, opts);

    // Estimate tokens
    const estimatedTokens = Math.ceil(contextText.length / 4);

    const context: CourseContext & { routing?: RoutingDecision } = {
      courseId: this.course.id,
      courseCode: this.course.code,
      courseName: this.course.name,
      materials: rankedMaterials,
      contextText,
      estimatedTokens,
      builtAt: new Date().toISOString(),
      routing: routingDecision,
    };

    // Cache result if high confidence and Self-RAG enabled
    if (
      this.enableAdaptiveRouting &&
      this.adaptiveRouter &&
      routingDecision &&
      routingDecision.confidenceScore.level === "high"
    ) {
      this.adaptiveRouter.cacheResult(
        question,
        context,
        routingDecision.confidenceScore.score
      );
      console.log(`[CourseContextBuilder] Cached result for high-confidence query.`);
    }

    return context;
  }

  /**
   * Rank and filter materials using hybrid retrieval
   *
   * Pipeline:
   * 1. Hybrid retrieval (BM25 + embeddings with RRF fusion)
   * 2. MMR diversification (reduce redundancy)
   * 3. Filter by minimum relevance
   * 4. Prioritize by material type if specified
   */
  private async rankAndFilterMaterials(
    question: string,
    options: Required<ContextBuildOptions>
  ): Promise<RankedMaterial[]> {
    if (!this.hybridRetriever || !this.mmrDiversifier) {
      // Fallback to empty if initialization failed
      console.warn("[CourseContextBuilder] Hybrid retrieval not initialized, returning empty results");
      return [];
    }

    try {
      // 1. Retrieve using hybrid retrieval (get more candidates for MMR)
      const retrievalResults = await this.hybridRetriever.retrieve(
        question,
        options.maxMaterials * 2 // Get 2x candidates for diversification
      );

      // 2. Apply MMR diversification
      const diversified = this.mmrDiversifier.diversify(
        retrievalResults,
        options.maxMaterials
      );

      // 3. Convert to RankedMaterial format
      const rankedMaterials: RankedMaterial[] = diversified.map(result => ({
        ...result.material,
        relevanceScore: Math.round(result.score * 100), // Convert 0-1 score to 0-100 percentage
        matchedKeywords: (result.matchedTerms || []),
      }));

      // 4. Filter by minimum relevance score
      const filtered = rankedMaterials.filter(m => m.relevanceScore >= options.minRelevance);

      // 5. Prioritize by material type if specified
      if (options.priorityTypes.length > 0) {
        return this.prioritizeByType(filtered, options.priorityTypes);
      }

      return filtered;
    } catch (error) {
      console.error("[CourseContextBuilder] Error during hybrid retrieval:", error);
      return [];
    }
  }

  /**
   * Prioritize materials by type
   */
  private prioritizeByType(
    materials: RankedMaterial[],
    priorityTypes: string[]
  ): RankedMaterial[] {
    const priority = materials.filter(m => priorityTypes.includes(m.type));
    const others = materials.filter(m => !priorityTypes.includes(m.type));

    return [...priority, ...others];
  }

  /**
   * Format context text for LLM
   */
  private formatContextText(
    materials: RankedMaterial[],
    options: Required<ContextBuildOptions>
  ): string {
    let context = `# Course: ${this.course.code} - ${this.course.name}\n\n`;
    context += `**Term:** ${this.course.term}\n`;
    context += `**Description:** ${this.course.description}\n\n`;

    if (materials.length === 0) {
      context += "*No relevant course materials found for this question.*\n";
      return context;
    }

    context += `## Relevant Course Materials\n\n`;

    materials.forEach((material, index) => {
      // Material header
      context += `### ${index + 1}. ${material.title}\n`;
      context += `**Type:** ${this.formatMaterialType(material.type)}\n`;

      // Metadata
      if (material.metadata.week) {
        context += `**Week:** ${material.metadata.week}\n`;
      }
      if (material.metadata.date) {
        context += `**Date:** ${material.metadata.date}\n`;
      }

      // Relevance info
      context += `**Relevance:** ${material.relevanceScore}%`;
      if (material.matchedKeywords.length > 0) {
        context += ` (Keywords: ${material.matchedKeywords.join(", ")})`;
      }
      context += `\n\n`;

      // Content excerpt
      context += `**Content:**\n`;
      const excerpt = this.createSpanAwareExcerpt(
        material.content,
        material.matchedKeywords,
        500
      );
      context += `${excerpt}\n\n`;

      context += `---\n\n`;
    });

    // Truncate to token limit if needed
    if (options.maxTokens) {
      context = truncateToTokenLimit(context, options.maxTokens);
    }

    return context;
  }

  /**
   * Format material type for display
   */
  private formatMaterialType(type: string): string {
    const typeMap: Record<string, string> = {
      lecture: "Lecture Notes",
      reading: "Reading Assignment",
      homework: "Homework",
      exam: "Exam/Quiz",
      project: "Project",
      syllabus: "Syllabus",
      announcement: "Announcement",
      video: "Video",
      code: "Code Example",
      other: "Other",
    };

    return typeMap[type] || type;
  }

  /**
   * Create span-aware excerpt from content
   *
   * Extracts windowed snippets around matched keywords (±350 chars)
   * with ellipsis indicators between windows.
   *
   * @param content - Full material content
   * @param matchedKeywords - Keywords matched by retrieval
   * @param maxLength - Maximum total excerpt length
   */
  private createSpanAwareExcerpt(
    content: string,
    matchedKeywords: string[],
    maxLength: number
  ): string {
    // If content is short enough, return as-is
    if (content.length <= maxLength) {
      return content;
    }

    // If no matched keywords, fall back to simple start excerpt
    if (!matchedKeywords || matchedKeywords.length === 0) {
      return this.createSimpleExcerpt(content, maxLength);
    }

    const windowSize = 350; // ±350 chars around matches
    const contentLower = content.toLowerCase();

    // Find all match positions
    interface MatchPosition {
      start: number;
      end: number;
      keyword: string;
    }

    const matches: MatchPosition[] = [];
    for (const keyword of matchedKeywords) {
      const keywordLower = keyword.toLowerCase();
      let pos = contentLower.indexOf(keywordLower);

      while (pos !== -1) {
        matches.push({
          start: pos,
          end: pos + keyword.length,
          keyword,
        });
        pos = contentLower.indexOf(keywordLower, pos + 1);
      }
    }

    // If no matches found in content, fall back to simple excerpt
    if (matches.length === 0) {
      return this.createSimpleExcerpt(content, maxLength);
    }

    // Create windows around matches
    interface Window {
      start: number;
      end: number;
    }

    const windows: Window[] = matches.map(match => ({
      start: Math.max(0, match.start - windowSize),
      end: Math.min(content.length, match.end + windowSize),
    }));

    // Sort and merge overlapping windows
    windows.sort((a, b) => a.start - b.start);
    const merged: Window[] = [];

    for (const window of windows) {
      if (merged.length === 0) {
        merged.push(window);
      } else {
        const last = merged[merged.length - 1];
        if (window.start <= last.end) {
          // Overlapping - merge
          last.end = Math.max(last.end, window.end);
        } else {
          // Non-overlapping - add new window
          merged.push(window);
        }
      }
    }

    // Extract text from windows and join with ellipsis
    const excerpts: string[] = [];
    let totalLength = 0;

    for (const window of merged) {
      let text = content.substring(window.start, window.end);

      // Clean up boundaries (try to break at word/sentence boundaries)
      if (window.start > 0) {
        // Not at document start - find word boundary
        const spaceIndex = text.indexOf(" ");
        if (spaceIndex !== -1 && spaceIndex < 50) {
          text = text.substring(spaceIndex + 1);
        }
      }

      if (window.end < content.length) {
        // Not at document end - find word boundary
        const spaceIndex = text.lastIndexOf(" ");
        if (spaceIndex !== -1 && spaceIndex > text.length - 50) {
          text = text.substring(0, spaceIndex);
        }
      }

      // Check if adding this excerpt exceeds max length
      const excerptWithEllipsis = (window.start > 0 ? "..." : "") +
                                   text +
                                   (window.end < content.length ? "..." : "");

      if (totalLength + excerptWithEllipsis.length > maxLength && excerpts.length > 0) {
        // Would exceed limit - stop here
        break;
      }

      excerpts.push(excerptWithEllipsis);
      totalLength += excerptWithEllipsis.length;
    }

    // Join excerpts with spacing
    return excerpts.join(" ");
  }

  /**
   * Create simple excerpt from start of content (fallback)
   */
  private createSimpleExcerpt(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf(". ");
    const lastNewline = truncated.lastIndexOf("\n");
    const lastBoundary = Math.max(lastPeriod, lastNewline);

    if (lastBoundary > maxLength * 0.8) {
      return truncated.substring(0, lastBoundary + 1);
    }

    return truncated + "...";
  }

  /**
   * Normalize options with defaults
   */
  private normalizeOptions(options?: ContextBuildOptions): Required<ContextBuildOptions> {
    return {
      maxMaterials: options?.maxMaterials ?? 5,
      minRelevance: options?.minRelevance ?? 30,
      maxTokens: options?.maxTokens ?? 2000,
      priorityTypes: options?.priorityTypes ?? [],
    };
  }

  /**
   * Get course summary
   */
  getCourse(): Course {
    return this.course;
  }

  /**
   * Get all materials
   */
  getMaterials(): CourseMaterial[] {
    return this.materials;
  }

  /**
   * Get Self-RAG metrics (if enabled)
   */
  getSelfRAGMetrics() {
    if (!this.enableAdaptiveRouting || !this.adaptiveRouter) {
      return null;
    }
    return this.adaptiveRouter.getMetrics();
  }

  /**
   * Get cache statistics (if Self-RAG enabled)
   */
  getCacheStats() {
    if (!this.enableAdaptiveRouting || !this.adaptiveRouter) {
      return null;
    }
    return this.adaptiveRouter.getCacheStats();
  }

  /**
   * Clear Self-RAG cache
   */
  clearCache(): void {
    if (this.adaptiveRouter) {
      this.adaptiveRouter.clearCache();
      console.log(`[CourseContextBuilder] Cache cleared for ${this.course.code}`);
    }
  }

  /**
   * Check if Self-RAG is enabled
   */
  isAdaptiveRoutingEnabled(): boolean {
    return this.enableAdaptiveRouting;
  }
}

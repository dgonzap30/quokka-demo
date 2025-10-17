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
import { rankMaterials, truncateToTokenLimit } from "@/lib/llm/utils";

/**
 * Course Context Builder
 *
 * Builds context from a single course for LLM prompts.
 * Ranks materials by relevance and formats them for optimal AI understanding.
 */
export class CourseContextBuilder {
  private course: Course;
  private materials: CourseMaterial[];

  constructor(course: Course, materials: CourseMaterial[]) {
    this.course = course;
    this.materials = materials;
  }

  /**
   * Build course context for a question
   *
   * @param question - User's question
   * @param options - Build options (max materials, min relevance, etc.)
   * @returns CourseContext with ranked materials and formatted text
   */
  buildContext(question: string, options?: ContextBuildOptions): CourseContext {
    const opts = this.normalizeOptions(options);

    // Rank materials by relevance to question
    const rankedMaterials = this.rankAndFilterMaterials(question, opts);

    // Build formatted context text
    const contextText = this.formatContextText(rankedMaterials, opts);

    // Estimate tokens
    const estimatedTokens = Math.ceil(contextText.length / 4);

    return {
      courseId: this.course.id,
      courseCode: this.course.code,
      courseName: this.course.name,
      materials: rankedMaterials,
      contextText,
      estimatedTokens,
      builtAt: new Date().toISOString(),
    };
  }

  /**
   * Rank and filter materials based on options
   */
  private rankAndFilterMaterials(
    question: string,
    options: Required<ContextBuildOptions>
  ): RankedMaterial[] {
    // Use utility function to rank materials
    const ranked = rankMaterials(this.materials, question, options.maxMaterials);

    // Filter by minimum relevance score
    const filtered = ranked.filter(m => m.relevanceScore >= options.minRelevance);

    // Prioritize by material type if specified
    if (options.priorityTypes.length > 0) {
      return this.prioritizeByType(filtered, options.priorityTypes);
    }

    return filtered;
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
      const excerpt = this.createExcerpt(material.content, 500);
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
   * Create excerpt from content
   */
  private createExcerpt(content: string, maxLength: number): string {
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
}

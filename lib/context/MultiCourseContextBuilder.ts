// ============================================
// Multi-Course Context Builder
// ============================================

import type {
  Course,
  CourseMaterial,
  MultiCourseContext,
  CourseContext,
  ContextBuildOptions,
} from "@/lib/models/types";
import { CourseContextBuilder } from "./CourseContextBuilder";

/**
 * Simple keyword extraction for course detection
 * Removes common words and returns meaningful keywords
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "may", "might", "can", "this", "that",
    "these", "those", "what", "which", "who", "when", "where", "why", "how",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
}

/**
 * Multi-Course Context Builder
 *
 * Builds context from multiple courses for LLM prompts.
 * Automatically detects relevant courses and aggregates context.
 */
export class MultiCourseContextBuilder {
  private courses: Course[];
  private materialsByCourse: Map<string, CourseMaterial[]>;

  constructor(courses: Course[], materials: CourseMaterial[]) {
    this.courses = courses;
    this.materialsByCourse = this.groupMaterialsByCourse(materials);
  }

  /**
   * Build multi-course context for a question
   *
   * Automatically detects relevant courses and builds aggregated context.
   *
   * @param userId - Current user ID
   * @param question - User's question
   * @param options - Build options
   * @returns MultiCourseContext with detected courses and combined text
   */
  async buildContext(
    userId: string,
    question: string,
    options?: ContextBuildOptions
  ): Promise<MultiCourseContext> {
    const opts = this.normalizeOptions(options);

    // Auto-detect relevant courses
    const relevantCourses = this.detectRelevantCourses(question);

    // Build context for each course
    const courseContexts: CourseContext[] = [];
    let totalTokens = 0;

    for (const course of relevantCourses) {
      const materials = this.materialsByCourse.get(course.id) || [];
      const builder = new CourseContextBuilder(course, materials);

      // Adjust token limit proportionally
      const remainingTokens = opts.maxTokens - totalTokens;
      const perCourseTokenLimit = Math.floor(remainingTokens / (relevantCourses.length - courseContexts.length));

      const context = await builder.buildContext(question, {
        ...opts,
        maxTokens: perCourseTokenLimit,
      });

      courseContexts.push(context);
      totalTokens += context.estimatedTokens;

      // Stop if we've exceeded token limit
      if (totalTokens >= opts.maxTokens) {
        break;
      }
    }

    // Combine context text
    const combinedContextText = this.combineContexts(courseContexts);

    return {
      userId,
      courseIds: courseContexts.map(c => c.courseId),
      courseContexts,
      combinedContextText,
      estimatedTokens: totalTokens,
      builtAt: new Date().toISOString(),
    };
  }

  /**
   * Build context for a specific set of courses
   *
   * Use this when course selection is predetermined (e.g., course-specific page).
   *
   * @param userId - Current user ID
   * @param question - User's question
   * @param courseIds - Specific course IDs to include
   * @param options - Build options
   */
  async buildContextForCourses(
    userId: string,
    question: string,
    courseIds: string[],
    options?: ContextBuildOptions
  ): Promise<MultiCourseContext> {
    const opts = this.normalizeOptions(options);

    // Filter to specified courses
    const selectedCourses = this.courses.filter(c => courseIds.includes(c.id));

    // Build context for each course
    const courseContexts: CourseContext[] = [];
    let totalTokens = 0;

    for (const course of selectedCourses) {
      const materials = this.materialsByCourse.get(course.id) || [];
      const builder = new CourseContextBuilder(course, materials);

      // Adjust token limit proportionally
      const remainingTokens = opts.maxTokens - totalTokens;
      const perCourseTokenLimit = Math.floor(remainingTokens / (selectedCourses.length - courseContexts.length));

      const context = await builder.buildContext(question, {
        ...opts,
        maxTokens: perCourseTokenLimit,
      });

      courseContexts.push(context);
      totalTokens += context.estimatedTokens;

      // Stop if we've exceeded token limit
      if (totalTokens >= opts.maxTokens) {
        break;
      }
    }

    // Combine context text
    const combinedContextText = this.combineContexts(courseContexts);

    return {
      userId,
      courseIds: courseContexts.map(c => c.courseId),
      courseContexts,
      combinedContextText,
      estimatedTokens: totalTokens,
      builtAt: new Date().toISOString(),
    };
  }

  /**
   * Auto-detect relevant courses based on question
   *
   * Scores courses by:
   * 1. Course code/name mentioned in question
   * 2. Material keyword matches
   * 3. Recent activity (if metadata available)
   */
  private detectRelevantCourses(question: string): Course[] {
    const questionLower = question.toLowerCase();
    const queryKeywords = extractKeywords(question);

    // Score each course
    const scored = this.courses.map(course => {
      let score = 0;

      // Direct course mention (highest weight)
      if (questionLower.includes(course.code.toLowerCase())) {
        score += 100;
      }
      if (questionLower.includes(course.name.toLowerCase())) {
        score += 50;
      }

      // Material keyword matches
      const materials = this.materialsByCourse.get(course.id) || [];
      const materialKeywords = materials.flatMap(m => m.keywords);

      const keywordMatches = queryKeywords.filter(q =>
        materialKeywords.some(m => m.toLowerCase().includes(q) || q.includes(m.toLowerCase()))
      );

      score += keywordMatches.length * 10;

      // Content matches (lower weight)
      const contentMatches = materials.filter(m =>
        queryKeywords.some(q => m.content.toLowerCase().includes(q))
      );

      score += contentMatches.length * 5;

      return { course, score };
    });

    // Sort by score and filter out zero-score courses
    const ranked = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // If no courses scored, return all active courses (fallback)
    if (ranked.length === 0) {
      return this.courses.filter(c => c.status === "active");
    }

    // Return top courses (max 3 for context efficiency)
    return ranked.slice(0, 3).map(s => s.course);
  }

  /**
   * Combine multiple course contexts into single text
   */
  private combineContexts(contexts: CourseContext[]): string {
    if (contexts.length === 0) {
      return "*No relevant course materials found.*\n";
    }

    if (contexts.length === 1) {
      return contexts[0].contextText;
    }

    let combined = `# Multi-Course Context\n\n`;
    combined += `*This question may relate to multiple courses. Here is relevant context from each:*\n\n`;
    combined += `---\n\n`;

    contexts.forEach((context, index) => {
      combined += `## Course ${index + 1}: ${context.courseCode} - ${context.courseName}\n\n`;

      // Add material summaries
      if (context.materials.length > 0) {
        combined += `**${context.materials.length} relevant material(s) found**\n\n`;

        context.materials.forEach((material, mIndex) => {
          combined += `${mIndex + 1}. **${material.title}** (${material.type}) - `;
          combined += `${material.relevanceScore}% relevance\n`;

          // Brief excerpt
          const excerpt = material.content.substring(0, 200);
          combined += `   *${excerpt}${material.content.length > 200 ? "..." : ""}*\n\n`;
        });
      } else {
        combined += `*No relevant materials found for this course.*\n\n`;
      }

      combined += `---\n\n`;
    });

    return combined;
  }

  /**
   * Group materials by course ID
   */
  private groupMaterialsByCourse(materials: CourseMaterial[]): Map<string, CourseMaterial[]> {
    const grouped = new Map<string, CourseMaterial[]>();

    materials.forEach(material => {
      const existing = grouped.get(material.courseId) || [];
      existing.push(material);
      grouped.set(material.courseId, existing);
    });

    return grouped;
  }

  /**
   * Normalize options with defaults
   */
  private normalizeOptions(options?: ContextBuildOptions): Required<ContextBuildOptions> {
    return {
      maxMaterials: options?.maxMaterials ?? 5,
      minRelevance: options?.minRelevance ?? 30,
      maxTokens: options?.maxTokens ?? 3000, // Higher default for multi-course
      priorityTypes: options?.priorityTypes ?? [],
    };
  }

  /**
   * Get all courses
   */
  getCourses(): Course[] {
    return this.courses;
  }

  /**
   * Get materials for specific course
   */
  getMaterialsForCourse(courseId: string): CourseMaterial[] {
    return this.materialsByCourse.get(courseId) || [];
  }

  /**
   * Get all materials
   */
  getAllMaterials(): CourseMaterial[] {
    return Array.from(this.materialsByCourse.values()).flat();
  }
}

// ============================================
// Context Builder Public API
// ============================================

import type {
  Course,
  CourseMaterial,
  CourseContext,
  MultiCourseContext,
  ContextBuildOptions,
} from "@/lib/models/types";
import { CourseContextBuilder } from "./CourseContextBuilder";
import { MultiCourseContextBuilder } from "./MultiCourseContextBuilder";

// Re-export builders
export { CourseContextBuilder } from "./CourseContextBuilder";
export { MultiCourseContextBuilder } from "./MultiCourseContextBuilder";

/**
 * Build context for a single course
 *
 * Convenience function for building single-course context.
 *
 * @param course - Course to build context for
 * @param materials - Course materials
 * @param question - User's question
 * @param options - Build options
 */
export async function buildCourseContext(
  course: Course,
  materials: CourseMaterial[],
  question: string,
  options?: ContextBuildOptions
): Promise<CourseContext> {
  const builder = new CourseContextBuilder(course, materials);
  return await builder.buildContext(question, options);
}

/**
 * Build context from multiple courses with auto-detection
 *
 * Convenience function for building multi-course context with
 * automatic course detection.
 *
 * @param userId - Current user ID
 * @param courses - All available courses
 * @param materials - All course materials
 * @param question - User's question
 * @param options - Build options
 */
export async function buildMultiCourseContext(
  userId: string,
  courses: Course[],
  materials: CourseMaterial[],
  question: string,
  options?: ContextBuildOptions
): Promise<MultiCourseContext> {
  const builder = new MultiCourseContextBuilder(courses, materials);
  return await builder.buildContext(userId, question, options);
}

/**
 * Build context for specific courses
 *
 * Use this when course selection is predetermined (e.g., course-specific page).
 *
 * @param userId - Current user ID
 * @param courses - All available courses
 * @param materials - All course materials
 * @param question - User's question
 * @param courseIds - Specific course IDs to include
 * @param options - Build options
 */
export async function buildContextForCourses(
  userId: string,
  courses: Course[],
  materials: CourseMaterial[],
  question: string,
  courseIds: string[],
  options?: ContextBuildOptions
): Promise<MultiCourseContext> {
  const builder = new MultiCourseContextBuilder(courses, materials);
  return await builder.buildContextForCourses(userId, question, courseIds, options);
}

/**
 * Auto-detect relevant courses for a question
 *
 * Returns course IDs ranked by relevance to the question.
 *
 * @param courses - All available courses
 * @param materials - All course materials
 * @param question - User's question
 * @param limit - Maximum number of courses to return (default: 3)
 */
export async function detectRelevantCourses(
  courses: Course[],
  materials: CourseMaterial[],
  question: string,
  limit: number = 3
): Promise<string[]> {
  const builder = new MultiCourseContextBuilder(courses, materials);
  const context = await builder.buildContext("system", question, { maxMaterials: 1 });
  return context.courseIds.slice(0, limit);
}

/**
 * Estimate context size in tokens
 *
 * Provides quick token estimation without building full context.
 *
 * @param text - Context text to estimate
 */
export function estimateContextTokens(text: string): number {
  // Simple estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Check if context fits within token budget
 *
 * @param context - Course or multi-course context
 * @param maxTokens - Maximum allowed tokens
 */
export function fitsTokenBudget(
  context: CourseContext | MultiCourseContext,
  maxTokens: number
): boolean {
  return context.estimatedTokens <= maxTokens;
}

/**
 * Merge multiple course contexts
 *
 * Combines individual course contexts into a multi-course context.
 *
 * @param userId - Current user ID
 * @param contexts - Individual course contexts to merge
 */
export function mergeCourseContexts(
  userId: string,
  contexts: CourseContext[]
): MultiCourseContext {
  const courseIds = contexts.map(c => c.courseId);
  const estimatedTokens = contexts.reduce((sum, c) => sum + c.estimatedTokens, 0);

  let combinedContextText = `# Multi-Course Context\n\n`;

  contexts.forEach((context, index) => {
    combinedContextText += `## Course ${index + 1}: ${context.courseCode} - ${context.courseName}\n\n`;
    combinedContextText += context.contextText;
    combinedContextText += `\n---\n\n`;
  });

  return {
    userId,
    courseIds,
    courseContexts: contexts,
    combinedContextText,
    estimatedTokens,
    builtAt: new Date().toISOString(),
  };
}

/**
 * Filter materials by course
 *
 * Utility to filter materials for a specific course.
 *
 * @param materials - All course materials
 * @param courseId - Course ID to filter by
 */
export function filterMaterialsByCourse(
  materials: CourseMaterial[],
  courseId: string
): CourseMaterial[] {
  return materials.filter(m => m.courseId === courseId);
}

/**
 * Default context build options
 *
 * Provides sensible defaults for most use cases.
 */
export const DEFAULT_CONTEXT_OPTIONS: Required<ContextBuildOptions> = {
  maxMaterials: 5,
  minRelevance: 30,
  maxTokens: 2000,
  priorityTypes: [],
};

/**
 * Strict context build options
 *
 * For high-relevance, low-token scenarios.
 */
export const STRICT_CONTEXT_OPTIONS: Required<ContextBuildOptions> = {
  maxMaterials: 3,
  minRelevance: 60,
  maxTokens: 1000,
  priorityTypes: ["lecture", "reading", "slide"],
};

/**
 * Comprehensive context build options
 *
 * For deep analysis with more materials.
 */
export const COMPREHENSIVE_CONTEXT_OPTIONS: Required<ContextBuildOptions> = {
  maxMaterials: 10,
  minRelevance: 20,
  maxTokens: 4000,
  priorityTypes: [],
};

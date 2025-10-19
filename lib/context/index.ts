// ============================================
// Context Builder Public API
// ============================================
//
// Note: CourseContextBuilder and MultiCourseContextBuilder removed in Phase 3 cleanup.
// These systems were never used in production.
//
// Production architecture uses tool-based retrieval:
// - /api/chat uses kb_search and kb_fetch tools
// - Tools call handleKBSearch() which uses HybridRetriever directly
// - No need for pre-built context objects
//
// Restore from git if needed:
// - CourseContextBuilder.ts (562 lines) - Single-course context with Self-RAG
// - MultiCourseContextBuilder.ts (~400 lines) - Multi-course context with auto-detection
//
// Related deletions:
// - lib/retrieval/adaptive/ - Self-RAG confidence routing (never enabled)
// - lib/retrieval/hierarchical/ - RAPTOR tree-based retrieval (never wired up)
// - lib/retrieval/expansion/ - Query expansion PRF (never integrated)
//

import type {
  CourseContext,
  MultiCourseContext,
  ContextBuildOptions,
  CourseMaterial,
} from "@/lib/models/types";

/**
 * Estimate context size in tokens
 *
 * Provides quick token estimation without building full context.
 * Simple rule: 1 token ≈ 4 characters
 *
 * @param text - Context text to estimate
 */
export function estimateContextTokens(text: string): number {
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
  return materials.filter((m) => m.courseId === courseId);
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

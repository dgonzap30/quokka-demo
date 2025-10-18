// ============================================
// AI SDK Tool Handlers (Phase 2: RAG Implementation)
// ============================================
//
// Implements tool execution logic for kb.search and kb.fetch.
// Uses existing hybrid retrieval system (CourseContextBuilder)
// with hard caps on tool usage per turn.

import { CourseContextBuilder } from "@/lib/context/CourseContextBuilder";
import type { CourseMaterial, Course } from "@/lib/models/types";
import { TOOL_LIMITS } from "./index";

// Import mock data directly for server-side access
import coursesData from "@/mocks/courses.json";
import courseMaterialsData from "@/mocks/course-materials.json";

/**
 * Track tool usage per turn (server-side state)
 * In production, this should use request context or session storage
 */
const toolUsageStore = new Map<string, { searches: number; fetches: number }>();

/**
 * Get or initialize tool usage for a turn
 * Uses a simple timestamp-based turn ID
 */
function getToolUsage(turnId: string) {
  if (!toolUsageStore.has(turnId)) {
    toolUsageStore.set(turnId, { searches: 0, fetches: 0 });
  }
  return toolUsageStore.get(turnId)!;
}

/**
 * Clean up old turn usage data (keep last hour)
 */
function cleanupOldUsage() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [turnId] of toolUsageStore) {
    const timestamp = parseInt(turnId.split("-")[0]);
    if (timestamp < oneHourAgo) {
      toolUsageStore.delete(turnId);
    }
  }
}

/**
 * kb.search handler - Search course materials
 *
 * Uses hybrid retrieval (BM25 + embeddings) from CourseContextBuilder
 * to find relevant materials with semantic understanding.
 *
 * @param params - Search parameters (query, courseId, maxResults, turnId)
 * @returns Array of materials with relevance scores
 */
export async function handleKBSearch(params: {
  query: string;
  courseId?: string;
  maxResults: number;
  turnId: string;
}): Promise<{
  materials: Array<{
    id: string;
    title: string;
    type: string;
    excerpt: string;
    relevanceScore: number;
    matchedKeywords: string[];
  }>;
  totalFound: number;
  searchParams: {
    query: string;
    courseId: string | null;
    maxResults: number;
  };
}> {
  const { query, courseId, maxResults, turnId } = params;

  // Cleanup old usage data periodically
  cleanupOldUsage();

  // Check tool usage limits (using turnId from caller)
  const usage = getToolUsage(turnId);
  if (usage.searches >= TOOL_LIMITS.maxSearchesPerTurn) {
    throw new Error(
      `Tool usage limit exceeded: Maximum ${TOOL_LIMITS.maxSearchesPerTurn} kb.search call(s) per turn`
    );
  }

  // Increment search count
  usage.searches++;

  console.log(`[kb.search] Query: "${query}", courseId: ${courseId || "all"}, maxResults: ${maxResults}`);

  try {
    if (courseId) {
      // Course-specific search using hybrid retrieval
      const courses = coursesData as Course[];
      const course = courses.find((c) => c.id === courseId);
      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      const allMaterials = courseMaterialsData as CourseMaterial[];
      const materials = allMaterials.filter((m) => m.courseId === courseId);

      // Use CourseContextBuilder for semantic search
      const builder = new CourseContextBuilder(course, materials);
      const context = await builder.buildContext(query, {
        maxMaterials: maxResults,
        minRelevance: 0, // No threshold - return all ranked results
        maxTokens: 4000, // Larger context for tool responses
      });

      // Format results for AI
      const formattedMaterials = context.materials.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        excerpt: m.content.substring(0, 300) + (m.content.length > 300 ? "..." : ""),
        relevanceScore: m.relevanceScore,
        matchedKeywords: m.matchedKeywords,
      }));

      console.log(`[kb.search] Found ${formattedMaterials.length} results for course ${course.code}`);

      return {
        materials: formattedMaterials,
        totalFound: formattedMaterials.length,
        searchParams: {
          query,
          courseId,
          maxResults,
        },
      };
    } else {
      // Multi-course search - aggregate from all courses
      const courses = coursesData as Course[];
      const allMaterials = courseMaterialsData as CourseMaterial[];
      const allResults: Array<{
        id: string;
        title: string;
        type: string;
        excerpt: string;
        relevanceScore: number;
        matchedKeywords: string[];
      }> = [];

      // Search each course and collect results
      for (const course of courses) {
        const materials = allMaterials.filter((m) => m.courseId === course.id);
        const builder = new CourseContextBuilder(course, materials);
        const context = await builder.buildContext(query, {
          maxMaterials: Math.ceil(maxResults / courses.length), // Distribute across courses
          minRelevance: 0, // No threshold - return all ranked results
          maxTokens: 2000,
        });

        // Add course prefix to titles for multi-course results
        const formatted = context.materials.map((m) => ({
          id: m.id,
          title: `[${course.code}] ${m.title}`,
          type: m.type,
          excerpt: m.content.substring(0, 200) + (m.content.length > 200 ? "..." : ""),
          relevanceScore: m.relevanceScore,
          matchedKeywords: m.matchedKeywords,
        }));

        allResults.push(...formatted);
      }

      // Sort by relevance and limit
      const sortedResults = allResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      console.log(`[kb.search] Found ${sortedResults.length} results across ${courses.length} courses`);

      return {
        materials: sortedResults,
        totalFound: sortedResults.length,
        searchParams: {
          query,
          courseId: null,
          maxResults,
        },
      };
    }
  } catch (error) {
    console.error("[kb.search] Error:", error);
    throw error;
  }
}

/**
 * kb.fetch handler - Fetch specific material by ID
 *
 * Retrieves full content of a course material for detailed citation.
 * Used after kb.search to get complete material details.
 *
 * @param params - Fetch parameters (materialId, turnId)
 * @returns Full material with content and metadata
 */
export async function handleKBFetch(params: {
  materialId: string;
  turnId: string;
}): Promise<{
  material: {
    id: string;
    title: string;
    type: string;
    content: string;
    keywords: string[];
    metadata: CourseMaterial["metadata"];
    createdAt: string;
    updatedAt: string;
  };
}> {
  const { materialId, turnId } = params;

  // Cleanup old usage data periodically
  cleanupOldUsage();

  // Check tool usage limits (using turnId from caller)
  const usage = getToolUsage(turnId);
  if (usage.fetches >= TOOL_LIMITS.maxFetchesPerTurn) {
    throw new Error(
      `Tool usage limit exceeded: Maximum ${TOOL_LIMITS.maxFetchesPerTurn} kb.fetch call(s) per turn`
    );
  }

  // Increment fetch count
  usage.fetches++;

  console.log(`[kb.fetch] Fetching material: ${materialId}`);

  try {
    // Extract courseId from materialId (format: mat-{courseId}-{type}-{number})
    const courseIdMatch = materialId.match(/^mat-([^-]+)-/);
    if (!courseIdMatch) {
      throw new Error(`Invalid material ID format: ${materialId}`);
    }

    const coursePrefix = courseIdMatch[1]; // e.g., "cs101", "math221"

    // Get all courses and find matching one
    const courses = coursesData as Course[];
    const matchingCourse = courses.find((c) => c.id.includes(coursePrefix));

    if (!matchingCourse) {
      throw new Error(`Course not found for material: ${materialId}`);
    }

    // Get all materials for the course
    const allMaterials = courseMaterialsData as CourseMaterial[];
    const materials = allMaterials.filter((m) => m.courseId === matchingCourse.id);
    const material = materials.find((m) => m.id === materialId);

    if (!material) {
      throw new Error(`Material not found: ${materialId}`);
    }

    console.log(`[kb.fetch] Found material: ${material.title} (${material.type})`);

    return {
      material: {
        id: material.id,
        title: material.title,
        type: material.type,
        content: material.content,
        keywords: material.keywords,
        metadata: material.metadata,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
      },
    };
  } catch (error) {
    console.error("[kb.fetch] Error:", error);
    throw error;
  }
}

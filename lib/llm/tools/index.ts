// ============================================
// AI SDK Tool Definitions (Phase 2: RAG Tools)
// ============================================
//
// Defines tools for course material retrieval with Zod validation.
// Used by AI SDK's streamText() function for tool calling.
//
// Tools:
// - kb.search: Search course materials by query
// - kb.fetch: Fetch specific material by ID
//
// Constraints:
// - Max 1 kb.search + 1 kb.fetch per turn (enforced in handlers)
// - Course-specific searches when courseId provided
// - Returns structured results with citations

import { tool } from "ai";
import { z } from "zod";

/**
 * kb_search - Search course materials by query
 *
 * Uses hybrid retrieval (BM25 + embeddings) to find relevant materials.
 * Returns top-k results with relevance scores and excerpts.
 */
export const kbSearchTool = tool({
  description:
    "Search course materials by query. Returns relevant lecture notes, slides, assignments, and readings with relevance scores. Use this when you need to find information about course topics. Limit: 1 search per turn.",
  inputSchema: z.object({
    query: z
      .string()
      .min(3, "Query must be at least 3 characters")
      .max(200, "Query must be less than 200 characters")
      .describe("The search query (e.g., 'binary search algorithm', 'integration by parts')"),
    courseId: z
      .string()
      .optional()
      .describe(
        "Optional course ID to limit search scope (e.g., 'course-cs101'). If omitted, searches all courses."
      ),
    maxResults: z
      .number()
      .int()
      .min(1, "Must retrieve at least 1 result")
      .max(10, "Cannot retrieve more than 10 results")
      .default(4)
      .describe("Maximum number of results to return (default: 4)"),
  }),
  execute: async ({ query, courseId, maxResults }) => {
    // Import handler dynamically to avoid circular dependencies
    const { handleKBSearch } = await import("./handlers");

    // Generate turnId: timestamp rounded to nearest second
    // This groups all tool calls within the same second as part of the same turn
    const turnId = Math.floor(Date.now() / 1000).toString();

    return handleKBSearch({
      query,
      courseId,
      maxResults,
      turnId,
    });
  },
});

/**
 * kb_fetch - Fetch specific material by ID
 *
 * Retrieves full content of a specific course material by its ID.
 * Use after kb_search to get complete material content for citation.
 */
export const kbFetchTool = tool({
  description:
    "Fetch full content of a specific course material by ID. Use this after kb_search to get complete material details for citation. Returns title, type, content, and metadata. Limit: 1 fetch per turn.",
  inputSchema: z.object({
    materialId: z
      .string()
      .min(1, "Material ID is required")
      .describe(
        "Unique material identifier from kb_search results (e.g., 'mat-cs101-lecture-1')"
      ),
  }),
  execute: async ({ materialId }) => {
    // Import handler dynamically to avoid circular dependencies
    const { handleKBFetch } = await import("./handlers");

    // Generate turnId: timestamp rounded to nearest second
    // This groups all tool calls within the same second as part of the same turn
    const turnId = Math.floor(Date.now() / 1000).toString();

    return handleKBFetch({ materialId, turnId });
  },
});

/**
 * Export all tools as a registry for AI SDK
 *
 * Usage in streamText():
 * ```typescript
 * import { ragTools } from '@/lib/llm/tools';
 *
 * const result = streamText({
 *   model,
 *   messages,
 *   tools: ragTools,
 * });
 * ```
 */
export const ragTools = {
  "kb_search": kbSearchTool,
  "kb_fetch": kbFetchTool,
};

/**
 * Tool call usage limits (enforced in handlers)
 */
export const TOOL_LIMITS = {
  maxSearchesPerTurn: 1,
  maxFetchesPerTurn: 1,
} as const;

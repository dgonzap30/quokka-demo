// ============================================
// Materials API Module
// ============================================
//
// Handles course materials retrieval and search

import type {
  CourseMaterial,
  SearchCourseMaterialsInput,
  CourseMaterialSearchResult,
} from "@/lib/models/types";

import {
  seedData,
  getCourseMaterialsByCourse,
} from "@/lib/store/localStore";

import { delay, extractKeywords, generateSnippet } from "./utils";

/**
 * Materials API methods
 */
export const materialsAPI = {
  /**
   * Get all materials for a course
   *
   * Returns materials sorted by type (lecture, slide, assignment, reading, lab, textbook),
   * then alphabetically by title within each type.
   *
   * @param courseId - ID of the course
   * @returns Array of course materials sorted by type and title
   *
   * @example
   * ```ts
   * const materials = await materialsAPI.getCourseMaterials("course-cs101");
   * // Returns: [
   * //   { type: "lecture", title: "Intro to Algorithms", ... },
   * //   { type: "lecture", title: "Sorting Algorithms", ... },
   * //   { type: "slide", title: "Week 1 Slides", ... },
   * //   ...
   * // ]
   * ```
   */
  async getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
    await delay(); // 200-500ms
    seedData();

    // Get materials from store
    const materials = getCourseMaterialsByCourse(courseId);

    // Sort by type order, then title
    const typeOrder: CourseMaterial["type"][] = [
      "lecture",
      "slide",
      "assignment",
      "reading",
      "lab",
      "textbook",
    ];
    return materials.sort((a, b) => {
      const typeComparison =
        typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      if (typeComparison !== 0) return typeComparison;
      return a.title.localeCompare(b.title);
    });
  },

  /**
   * Search course materials by keywords
   *
   * Performs keyword-based search across material titles and content.
   * Returns results scored by relevance with matched keywords highlighted.
   *
   * @param input - Search parameters including query, course ID, type filters, and limits
   * @returns Array of search results with relevance scores and snippets
   *
   * @throws Error if query is less than 3 characters
   *
   * @example
   * ```ts
   * const results = await materialsAPI.searchCourseMaterials({
   *   courseId: "course-cs101",
   *   query: "binary search algorithm",
   *   types: ["lecture", "slide"],
   *   limit: 10,
   *   minRelevance: 30
   * });
   * // Returns: [
   * //   {
   * //     material: { ... },
   * //     relevanceScore: 85,
   * //     matchedKeywords: ["binary", "search", "algorithm"],
   * //     snippet: "...explanation of binary search algorithm which..."
   * //   },
   * //   ...
   * // ]
   * ```
   */
  async searchCourseMaterials(
    input: SearchCourseMaterialsInput
  ): Promise<CourseMaterialSearchResult[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const { courseId, query, types, limit = 20, minRelevance = 20 } = input;

    // Validate query length
    if (query.trim().length < 3) {
      throw new Error("Search query must be at least 3 characters");
    }

    // Extract keywords from query
    const queryKeywords = extractKeywords(query);

    // Get all materials for course
    const allMaterials = await materialsAPI.getCourseMaterials(courseId);

    // Filter by type if specified
    const materialsToSearch =
      types && types.length > 0
        ? allMaterials.filter((m) => types.includes(m.type))
        : allMaterials;

    // Score each material
    const results: CourseMaterialSearchResult[] = materialsToSearch.map(
      (material) => {
        // Combine title and content for matching
        const materialText =
          `${material.title} ${material.content}`.toLowerCase();
        const materialKeywords = material.keywords; // Pre-computed keywords

        // Count matches
        const matchedKeywords = queryKeywords.filter(
          (k) => materialKeywords.includes(k) || materialText.includes(k)
        );

        // Calculate relevance score
        const relevanceScore =
          queryKeywords.length > 0
            ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
            : 0;

        // Generate snippet (first 150 chars with matched keywords)
        const snippet = generateSnippet(material.content, matchedKeywords, 150);

        return {
          material,
          relevanceScore,
          matchedKeywords,
          snippet,
        };
      }
    );

    // Filter by minimum relevance and sort
    return results
      .filter((r) => r.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },
};

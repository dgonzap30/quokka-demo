/**
 * Course Materials Repository
 *
 * Data access layer for course_materials table
 */

import { eq, and, type SQL, inArray } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courseMaterials, type CourseMaterial, type NewCourseMaterial } from "../db/schema.js";
import { db } from "../db/client.js";
import type { MaterialMetadata } from "../schemas/materials.schema.js";

/**
 * Search result type
 */
export interface MaterialSearchResult {
  material: CourseMaterial & { keywords: string[] };
  relevanceScore: number;
  matchedKeywords: string[];
  snippet: string;
}

export class CourseMaterialsRepository extends BaseRepository<
  typeof courseMaterials,
  CourseMaterial,
  NewCourseMaterial
> {
  constructor() {
    super(courseMaterials);
  }

  /**
   * Implement abstract method: ID equality check
   */
  protected idEquals(id: string): SQL {
    return eq(this.table.id, id);
  }

  /**
   * Implement abstract method: Field equality check
   */
  protected fieldEquals<K extends keyof typeof this.table>(
    field: K,
    value: any
  ): SQL {
    const column = this.table[field];
    // Type guard: ensure we have a column, not a method or undefined
    if (!column || typeof column === 'function') {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return eq(column as any, value);
  }

  /**
   * Find all materials for a course
   */
  async findByCourse(courseId: string): Promise<Array<CourseMaterial & { keywords: string[] }>> {
    const results = await db
      .select()
      .from(courseMaterials)
      .where(eq(courseMaterials.courseId, courseId));

    // Parse metadata and extract keywords
    return results.map((material) => {
      let keywords: string[] = [];

      if (material.metadata) {
        try {
          const parsedMetadata = JSON.parse(material.metadata) as MaterialMetadata;
          keywords = parsedMetadata.keywords || [];
        } catch (error) {
          console.error("[Materials] Failed to parse metadata:", error);
        }
      }

      return {
        ...material,
        keywords,
      };
    });
  }

  /**
   * Find materials by type
   */
  async findByType(
    courseId: string,
    types: string[]
  ): Promise<Array<CourseMaterial & { keywords: string[] }>> {
    if (types.length === 0) {
      return this.findByCourse(courseId);
    }

    const results = await db
      .select()
      .from(courseMaterials)
      .where(
        and(
          eq(courseMaterials.courseId, courseId),
          inArray(courseMaterials.type, types)
        )
      );

    // Parse metadata and extract keywords
    return results.map((material) => {
      let keywords: string[] = [];

      if (material.metadata) {
        try {
          const parsedMetadata = JSON.parse(material.metadata) as MaterialMetadata;
          keywords = parsedMetadata.keywords || [];
        } catch (error) {
          console.error("[Materials] Failed to parse metadata:", error);
        }
      }

      return {
        ...material,
        keywords,
      };
    });
  }

  /**
   * Search materials by keywords (simple keyword matching)
   */
  async searchMaterials(
    courseId: string,
    query: string,
    types?: string[],
    limit: number = 20,
    minRelevance: number = 20
  ): Promise<MaterialSearchResult[]> {
    // Get materials to search
    const materials =
      types && types.length > 0
        ? await this.findByType(courseId, types)
        : await this.findByCourse(courseId);

    // Extract keywords from query
    const queryKeywords = this.extractKeywords(query);

    // Score each material
    const results: MaterialSearchResult[] = materials.map((material) => {
      // Combine title and content for matching
      const materialText = `${material.title} ${material.content}`.toLowerCase();
      const materialKeywords = material.keywords;

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
      const snippet = this.generateSnippet(material.content, matchedKeywords, 150);

      return {
        material,
        relevanceScore,
        matchedKeywords,
        snippet,
      };
    });

    // Filter by minimum relevance and sort
    return results
      .filter((r) => r.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Extract keywords from text (simple tokenization)
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word.length > 2) // Min 3 chars
      .filter((word) => !this.isStopWord(word)); // Remove stop words
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "her",
      "was",
      "one",
      "our",
      "out",
      "this",
      "that",
      "with",
      "from",
      "have",
      "has",
    ]);
    return stopWords.has(word);
  }

  /**
   * Generate snippet with matched keywords highlighted
   */
  private generateSnippet(
    content: string,
    matchedKeywords: string[],
    maxLength: number
  ): string {
    if (matchedKeywords.length === 0) {
      return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
    }

    // Find first occurrence of any matched keyword
    const contentLower = content.toLowerCase();
    let firstMatchIndex = -1;

    for (const keyword of matchedKeywords) {
      const index = contentLower.indexOf(keyword.toLowerCase());
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index;
      }
    }

    if (firstMatchIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
    }

    // Extract snippet around first match
    const start = Math.max(0, firstMatchIndex - 50);
    const end = Math.min(content.length, firstMatchIndex + maxLength);
    let snippet = content.substring(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  }
}

// Export singleton instance
export const courseMaterialsRepository = new CourseMaterialsRepository();

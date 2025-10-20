import { eq, and, inArray } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courseMaterials } from "../db/schema.js";
import { db } from "../db/client.js";
export class CourseMaterialsRepository extends BaseRepository {
    constructor() {
        super(courseMaterials);
    }
    idEquals(id) {
        return eq(this.table.id, id);
    }
    fieldEquals(field, value) {
        const column = this.table[field];
        if (!column || typeof column === 'function') {
            throw new Error(`Invalid field: ${String(field)}`);
        }
        return eq(column, value);
    }
    async findByCourse(courseId) {
        const results = await db
            .select()
            .from(courseMaterials)
            .where(eq(courseMaterials.courseId, courseId));
        return results.map((material) => {
            let keywords = [];
            if (material.metadata) {
                try {
                    const parsedMetadata = JSON.parse(material.metadata);
                    keywords = parsedMetadata.keywords || [];
                }
                catch (error) {
                    console.error("[Materials] Failed to parse metadata:", error);
                }
            }
            return {
                ...material,
                keywords,
            };
        });
    }
    async findByType(courseId, types) {
        if (types.length === 0) {
            return this.findByCourse(courseId);
        }
        const results = await db
            .select()
            .from(courseMaterials)
            .where(and(eq(courseMaterials.courseId, courseId), inArray(courseMaterials.type, types)));
        return results.map((material) => {
            let keywords = [];
            if (material.metadata) {
                try {
                    const parsedMetadata = JSON.parse(material.metadata);
                    keywords = parsedMetadata.keywords || [];
                }
                catch (error) {
                    console.error("[Materials] Failed to parse metadata:", error);
                }
            }
            return {
                ...material,
                keywords,
            };
        });
    }
    async searchMaterials(courseId, query, types, limit = 20, minRelevance = 20) {
        const materials = types && types.length > 0
            ? await this.findByType(courseId, types)
            : await this.findByCourse(courseId);
        const queryKeywords = this.extractKeywords(query);
        const results = materials.map((material) => {
            const materialText = `${material.title} ${material.content}`.toLowerCase();
            const materialKeywords = material.keywords;
            const matchedKeywords = queryKeywords.filter((k) => materialKeywords.includes(k) || materialText.includes(k));
            const relevanceScore = queryKeywords.length > 0
                ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
                : 0;
            const snippet = this.generateSnippet(material.content, matchedKeywords, 150);
            return {
                material,
                relevanceScore,
                matchedKeywords,
                snippet,
            };
        });
        return results
            .filter((r) => r.relevanceScore >= minRelevance)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
    extractKeywords(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .split(/\s+/)
            .filter((word) => word.length > 2)
            .filter((word) => !this.isStopWord(word));
    }
    isStopWord(word) {
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
    generateSnippet(content, matchedKeywords, maxLength) {
        if (matchedKeywords.length === 0) {
            return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
        }
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
        const start = Math.max(0, firstMatchIndex - 50);
        const end = Math.min(content.length, firstMatchIndex + maxLength);
        let snippet = content.substring(start, end);
        if (start > 0)
            snippet = "..." + snippet;
        if (end < content.length)
            snippet = snippet + "...";
        return snippet;
    }
}
export const courseMaterialsRepository = new CourseMaterialsRepository();
//# sourceMappingURL=materials.repository.js.map
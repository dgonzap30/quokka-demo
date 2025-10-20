import { z } from "zod";
export const materialMetadataSchema = z.object({
    week: z.number().optional(),
    date: z.string().optional(),
    authorId: z.string().optional(),
    topic: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    url: z.string().url().optional(),
});
export const materialTypeSchema = z.enum([
    "lecture",
    "slide",
    "reading",
    "video",
    "assignment",
    "lab",
    "textbook",
]);
export const courseMaterialSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    title: z.string(),
    type: materialTypeSchema,
    content: z.string(),
    metadata: z.union([z.string(), materialMetadataSchema]).optional(),
    keywords: z.array(z.string()).optional(),
    createdAt: z.string(),
    tenantId: z.string(),
}).passthrough();
export const getMaterialsQuerySchema = z.object({
    type: materialTypeSchema.optional(),
});
export const searchMaterialsBodySchema = z.object({
    query: z.string().min(3, "Search query must be at least 3 characters"),
    types: z.array(materialTypeSchema).optional(),
    limit: z.number().min(1).max(100).default(20),
    minRelevance: z.number().min(0).max(100).default(20),
});
export const courseMaterialSearchResultSchema = z.object({
    material: courseMaterialSchema,
    relevanceScore: z.number().min(0).max(100),
    matchedKeywords: z.array(z.string()),
    snippet: z.string(),
});
export const listMaterialsResponseSchema = z.object({
    items: z.array(courseMaterialSchema),
});
export const searchMaterialsResponseSchema = z.object({
    results: z.array(courseMaterialSearchResultSchema),
});
export const getCourseIdParamsSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
});
//# sourceMappingURL=materials.schema.js.map
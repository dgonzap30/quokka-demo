/**
 * Course Materials Schemas
 *
 * Zod validation schemas for course materials endpoints
 */

import { z } from "zod";

/**
 * Material metadata (stored as JSON in database)
 */
export const materialMetadataSchema = z.object({
  week: z.number().optional(),
  date: z.string().optional(),
  authorId: z.string().optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  url: z.string().url().optional(),
});

/**
 * Course material type
 */
export const materialTypeSchema = z.enum([
  "lecture",
  "slide",
  "reading",
  "video",
  "assignment",
  "lab",
  "textbook",
]);

/**
 * Course material object
 */
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

export type CourseMaterial = z.infer<typeof courseMaterialSchema>;
export type MaterialMetadata = z.infer<typeof materialMetadataSchema>;

/**
 * Get materials query params
 */
export const getMaterialsQuerySchema = z.object({
  type: materialTypeSchema.optional(),
});

/**
 * Search materials request body
 */
export const searchMaterialsBodySchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters"),
  types: z.array(materialTypeSchema).optional(),
  limit: z.number().min(1).max(100).default(20),
  minRelevance: z.number().min(0).max(100).default(20),
});

/**
 * Course material search result
 */
export const courseMaterialSearchResultSchema = z.object({
  material: courseMaterialSchema,
  relevanceScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  snippet: z.string(),
});

/**
 * List materials response
 */
export const listMaterialsResponseSchema = z.object({
  items: z.array(courseMaterialSchema),
});

/**
 * Search materials response
 */
export const searchMaterialsResponseSchema = z.object({
  results: z.array(courseMaterialSearchResultSchema),
});

/**
 * Route params
 */
export const getCourseIdParamsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

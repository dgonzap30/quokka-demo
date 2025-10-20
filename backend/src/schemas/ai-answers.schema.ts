/**
 * AI Answers Schemas
 *
 * Zod validation schemas for AI answers endpoints
 */

import { z } from "zod";

/**
 * Confidence level enum
 */
export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

/**
 * AI answer citation
 */
export const aiAnswerCitationSchema = z.object({
  id: z.string(),
  aiAnswerId: z.string(),
  materialId: z.string(),
  excerpt: z.string(),
  relevanceScore: z.number().min(0).max(100),
  citationNumber: z.number().min(1),
});

export type AIAnswerCitation = z.infer<typeof aiAnswerCitationSchema>;

/**
 * AI answer endorsement
 */
export const aiAnswerEndorsementSchema = z.object({
  id: z.string(),
  aiAnswerId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});

export type AIAnswerEndorsement = z.infer<typeof aiAnswerEndorsementSchema>;

/**
 * AI answer object (with computed fields)
 */
export const aiAnswerSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  courseId: z.string(),
  content: z.string(),
  confidenceLevel: confidenceLevelSchema,
  routing: z.string().nullable().optional(), // JSON string
  endorsementCount: z.number().default(0),
  generatedAt: z.string(),
  // Computed fields
  citations: z.array(aiAnswerCitationSchema).default([]),
  endorsedBy: z.array(z.string()).default([]),
  totalEndorsements: z.number().default(0),
  instructorEndorsements: z.number().default(0),
  studentEndorsements: z.number().default(0),
  instructorEndorsed: z.boolean().default(false),
});

export type AIAnswer = z.infer<typeof aiAnswerSchema>;

/**
 * Endorse AI answer request body
 */
export const endorseAIAnswerBodySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  isInstructor: z.boolean().default(false),
});

/**
 * Bulk endorse AI answers request body
 */
export const bulkEndorseAIAnswersBodySchema = z.object({
  aiAnswerIds: z.array(z.string()).min(1, "At least one AI answer ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Bulk action result
 */
export const bulkActionResultSchema = z.object({
  actionType: z.literal("endorse"),
  successCount: z.number(),
  failedCount: z.number(),
  errors: z.array(
    z.object({
      itemId: z.string(),
      reason: z.string(),
      code: z.string().optional(),
    })
  ),
  timestamp: z.string(),
});

export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;

/**
 * Route params
 */
export const getThreadIdParamsSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
});

export const getAIAnswerIdParamsSchema = z.object({
  id: z.string().min(1, "AI answer ID is required"),
});

/**
 * Response schemas
 */
export const getAIAnswerResponseSchema = z.object({
  aiAnswer: aiAnswerSchema.nullable(),
});

export const endorseAIAnswerResponseSchema = aiAnswerSchema;

export const bulkEndorseResponseSchema = bulkActionResultSchema;

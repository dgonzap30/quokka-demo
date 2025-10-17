// ============================================
// Zod Schemas for Structured AI Outputs
// ============================================
//
// Type-safe schemas for AI-generated content using Zod validation.
// Used with AI SDK's generateObject() for guaranteed structure.

import { z } from 'zod';

/**
 * Citation Schema
 *
 * Represents a single citation to course material.
 * Used in AI answers to provide source attribution.
 */
export const CitationSchema = z.object({
  source: z.string().describe('The title or identifier of the source material'),
  sourceType: z.enum(['lecture', 'textbook', 'slides', 'lab', 'assignment', 'reading'])
    .describe('The type of course material being cited'),
  excerpt: z.string().describe('A brief excerpt or summary from the source (50-150 words)'),
  relevance: z.number().min(0).max(100)
    .describe('Relevance score from 0-100 indicating how well this citation supports the answer'),
});

/**
 * Confidence Level Schema
 *
 * AI's confidence in the answer accuracy.
 */
export const ConfidenceSchema = z.object({
  level: z.enum(['low', 'medium', 'high'])
    .describe('Qualitative confidence level'),
  score: z.number().min(0).max(100)
    .describe('Quantitative confidence score (0-100)'),
  reasoning: z.string().optional()
    .describe('Brief explanation of confidence level (optional)'),
});

/**
 * AI Answer Schema
 *
 * Complete structure for an AI-generated answer with citations.
 * This schema ensures all AI answers have consistent structure.
 */
export const AIAnswerSchema = z.object({
  content: z.string()
    .describe('The main answer content in markdown format'),

  confidence: ConfidenceSchema
    .describe('AI confidence in the answer'),

  citations: z.array(CitationSchema)
    .describe('List of citations to course materials that support this answer'),

  suggestedFollowUp: z.array(z.string()).optional()
    .describe('Suggested follow-up questions (optional, 2-3 questions)'),

  topics: z.array(z.string()).optional()
    .describe('Main topics covered in this answer (optional, for tagging)'),
});

/**
 * AI Preview Schema
 *
 * Similar to AIAnswerSchema but for preview purposes (before creating thread).
 * Slightly different structure to indicate it's a preview.
 */
export const AIPreviewSchema = z.object({
  content: z.string()
    .describe('Preview of AI answer content in markdown'),

  confidence: ConfidenceSchema
    .describe('AI confidence in this preview'),

  citations: z.array(CitationSchema)
    .describe('Citations that would be included in the full answer'),

  estimatedQuality: z.enum(['low', 'medium', 'high'])
    .describe('Estimated quality of the answer based on available context'),
});

/**
 * Type exports for use in application code
 */
export type Citation = z.infer<typeof CitationSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type AIAnswerStructured = z.infer<typeof AIAnswerSchema>;
export type AIPreviewStructured = z.infer<typeof AIPreviewSchema>;

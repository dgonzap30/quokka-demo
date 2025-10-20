/**
 * Posts Schemas (Zod)
 *
 * Validation schemas for post endpoints
 */

import { z } from "zod";
import { authorSchema } from "./threads.schema.js";

/**
 * Post response schema
 * Full post with author details
 */
export const postSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  authorId: z.string(),
  content: z.string(),
  isInstructorAnswer: z.boolean(),
  endorsementCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tenantId: z.string(),
  author: authorSchema,
});

export type PostResponse = z.infer<typeof postSchema>;

/**
 * Create post request
 */
export const createPostSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * List posts query params
 */
export const listPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

/**
 * List posts response
 */
export const listPostsResponseSchema = z.object({
  items: z.array(postSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export type ListPostsResponse = z.infer<typeof listPostsResponseSchema>;

/**
 * Thread ID params (for list posts by thread)
 */
export const threadIdParamsSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
});

export type ThreadIdParams = z.infer<typeof threadIdParamsSchema>;

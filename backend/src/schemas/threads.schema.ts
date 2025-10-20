/**
 * Threads Schemas (Zod)
 *
 * Validation schemas for thread endpoints
 */

import { z } from "zod";

/**
 * Author schema (embedded in thread responses)
 */
export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "instructor", "ta"]),
  avatar: z.string().nullable(),
});

/**
 * Thread response schema
 * Full thread with author details, counts, and flags
 */
export const threadSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.string(),
  views: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: authorSchema,
  upvoteCount: z.number(),
  postCount: z.number(),
  hasAiAnswer: z.boolean(),
});

export type ThreadResponse = z.infer<typeof threadSchema>;

/**
 * Create thread request
 */
export const createThreadSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

/**
 * List threads query params
 */
export const listThreadsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;

/**
 * List threads response
 */
export const listThreadsResponseSchema = z.object({
  items: z.array(threadSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export type ListThreadsResponse = z.infer<typeof listThreadsResponseSchema>;

/**
 * Get thread params
 */
export const getThreadParamsSchema = z.object({
  id: z.string().min(1, "Thread ID is required"),
});

export type GetThreadParams = z.infer<typeof getThreadParamsSchema>;

/**
 * Upvote thread params
 */
export const upvoteThreadParamsSchema = z.object({
  id: z.string().min(1, "Thread ID is required"),
});

export type UpvoteThreadParams = z.infer<typeof upvoteThreadParamsSchema>;

/**
 * Upvote response
 */
export const upvoteResponseSchema = z.object({
  success: z.boolean(),
  upvoted: z.boolean(),
  message: z.string(),
});

export type UpvoteResponse = z.infer<typeof upvoteResponseSchema>;

/**
 * Course ID params (for list threads by course)
 */
export const courseIdParamsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export type CourseIdParams = z.infer<typeof courseIdParamsSchema>;

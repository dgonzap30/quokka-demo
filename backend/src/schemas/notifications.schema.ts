/**
 * Notifications Schemas
 *
 * Zod validation schemas for notification endpoints
 */

import { z } from "zod";

/**
 * Notification types
 */
export const notificationTypeSchema = z.enum([
  "thread_reply",
  "ai_answer",
  "endorsement",
  "mention",
  "new_thread",
  "endorsed",
  "ai_answer_ready",
]);

/**
 * Notification object
 */
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  threadId: z.string().nullable().optional(),
  postId: z.string().nullable().optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
  tenantId: z.string(),
}).passthrough();

export type Notification = z.infer<typeof notificationSchema>;

/**
 * Route params
 */
export const getUserIdParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const getNotificationIdParamsSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
});

/**
 * Query params
 */
export const getNotificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
});

/**
 * Response schemas
 */
export const listNotificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
});

export const markReadResponseSchema = notificationSchema;

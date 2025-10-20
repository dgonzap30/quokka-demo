/**
 * Conversations Schemas
 *
 * Zod validation schemas for AI conversations endpoints
 */

import { z } from "zod";

/**
 * AI message role
 */
export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

/**
 * AI message object
 */
export const aiMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  materialReferences: z.string().nullable().optional(), // JSON string
  confidenceScore: z.number().nullable().optional(),
  createdAt: z.string(),
});

export type AIMessage = z.infer<typeof aiMessageSchema>;

/**
 * AI conversation object
 */
export const aiConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string().nullable(),
  title: z.string(),
  lastMessageAt: z.string(),
  messageCount: z.number().default(0),
  convertedThreadId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type AIConversation = z.infer<typeof aiConversationSchema>;

/**
 * Create conversation request body
 */
export const createConversationBodySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required"),
});

/**
 * Send message request body
 */
export const sendMessageBodySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: messageRoleSchema,
  content: z.string().min(1, "Content is required"),
});

/**
 * Convert to thread request body
 */
export const convertToThreadBodySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
});

/**
 * Route params
 */
export const getUserIdParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const getConversationIdParamsSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

/**
 * Response schemas
 */
export const listConversationsResponseSchema = z.object({
  conversations: z.array(aiConversationSchema),
});

export const createConversationResponseSchema = aiConversationSchema;

export const listMessagesResponseSchema = z.object({
  messages: z.array(aiMessageSchema),
});

export const sendMessageResponseSchema = z.object({
  userMessage: aiMessageSchema,
  aiMessage: aiMessageSchema.nullable(),
});

export const convertToThreadResponseSchema = z.object({
  threadId: z.string(),
  aiAnswerId: z.string().nullable(),
});

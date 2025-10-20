import { z } from "zod";
import { createConversationBodySchema, sendMessageBodySchema, convertToThreadBodySchema, getUserIdParamsSchema, getConversationIdParamsSchema, listConversationsResponseSchema, createConversationResponseSchema, listMessagesResponseSchema, sendMessageResponseSchema, convertToThreadResponseSchema, } from "../../schemas/conversations.schema.js";
import { conversationsRepository } from "../../repositories/conversations.repository.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";
import { db } from "../../db/client.js";
import { aiAnswers } from "../../db/schema.js";
export async function conversationsRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/conversations", {
        schema: {
            querystring: z.object({
                userId: z.string(),
            }),
            response: {
                200: listConversationsResponseSchema,
            },
            tags: ["conversations"],
            description: "List all conversations for a user",
        },
    }, async (request, reply) => {
        const { userId } = request.query;
        const conversations = await conversationsRepository.findByUserId(userId);
        return {
            conversations,
        };
    });
    server.get("/conversations/:conversationId", {
        schema: {
            params: getConversationIdParamsSchema,
            response: {
                200: z.object({
                    id: z.string(),
                    userId: z.string(),
                    courseId: z.string().nullable(),
                    title: z.string(),
                    messageCount: z.number(),
                    lastMessageAt: z.string(),
                    convertedThreadId: z.string().nullable(),
                    createdAt: z.string(),
                    tenantId: z.string(),
                }).passthrough(),
            },
            tags: ["conversations"],
            description: "Get single conversation by ID",
        },
    }, async (request, reply) => {
        const { conversationId } = request.params;
        const conversation = await conversationsRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation");
        }
        return conversation;
    });
    server.post("/conversations", {
        schema: {
            body: createConversationBodySchema,
            response: {
                201: createConversationResponseSchema,
            },
            tags: ["conversations"],
            description: "Create a new AI conversation",
        },
    }, async (request, reply) => {
        const { userId, courseId, title } = request.body;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const conversation = await conversationsRepository.create({
            id,
            userId,
            courseId: courseId || null,
            title,
            lastMessageAt: now,
            messageCount: 0,
            convertedThreadId: null,
            createdAt: now,
            tenantId: user.tenantId,
        });
        reply.code(201);
        return conversation;
    });
    server.get("/users/:userId/conversations", {
        schema: {
            params: getUserIdParamsSchema,
            response: {
                200: listConversationsResponseSchema,
            },
            tags: ["conversations"],
            description: "List all conversations for a user",
        },
    }, async (request, reply) => {
        const { userId } = request.params;
        const conversations = await conversationsRepository.findByUserId(userId);
        return {
            conversations,
        };
    });
    server.get("/conversations/:conversationId/messages", {
        schema: {
            params: getConversationIdParamsSchema,
            response: {
                200: listMessagesResponseSchema,
            },
            tags: ["conversations"],
            description: "Get messages for a conversation",
        },
    }, async (request, reply) => {
        const { conversationId } = request.params;
        const conversation = await conversationsRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation");
        }
        const messages = await conversationsRepository.findMessages(conversationId);
        return {
            messages: messages,
        };
    });
    server.post("/conversations/:conversationId/messages", {
        schema: {
            params: getConversationIdParamsSchema,
            body: sendMessageBodySchema,
            response: {
                201: sendMessageResponseSchema,
            },
            tags: ["conversations"],
            description: "Send a message in a conversation",
        },
    }, async (request, reply) => {
        const { conversationId } = request.params;
        const { userId, role, content } = request.body;
        const conversation = await conversationsRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation");
        }
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const userMessage = await conversationsRepository.createMessage({
            id: messageId,
            conversationId,
            role,
            content,
            materialReferences: null,
            confidenceScore: null,
            createdAt: now,
            tenantId: user.tenantId,
        });
        reply.code(201);
        return {
            userMessage: userMessage,
            aiMessage: null,
        };
    });
    server.delete("/conversations/:conversationId", {
        schema: {
            params: getConversationIdParamsSchema,
            response: {
                204: z.void(),
            },
            tags: ["conversations"],
            description: "Delete a conversation",
        },
    }, async (request, reply) => {
        const { conversationId } = request.params;
        const conversation = await conversationsRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation");
        }
        await conversationsRepository.deleteConversation(conversationId);
        reply.code(204);
    });
    server.post("/conversations/:conversationId/convert-to-thread", {
        schema: {
            params: getConversationIdParamsSchema,
            body: convertToThreadBodySchema,
            response: {
                201: convertToThreadResponseSchema,
            },
            tags: ["conversations"],
            description: "Convert conversation to public thread",
        },
    }, async (request, reply) => {
        const { conversationId } = request.params;
        const { userId, courseId } = request.body;
        const conversation = await conversationsRepository.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError("Conversation");
        }
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const messages = await conversationsRepository.findMessages(conversationId);
        if (messages.length === 0) {
            throw new Error("Cannot convert empty conversation to thread");
        }
        const firstUserMessage = messages.find((m) => m.role === "user");
        const threadTitle = firstUserMessage
            ? firstUserMessage.content.substring(0, 100) +
                (firstUserMessage.content.length > 100 ? "..." : "")
            : conversation.title;
        const threadContent = messages
            .map((msg) => {
            const role = msg.role === "user" ? "Student" : "AI Assistant";
            return `**${role}:** ${msg.content}`;
        })
            .join("\n\n---\n\n");
        const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const thread = await threadsRepository.create({
            id: threadId,
            courseId,
            authorId: userId,
            title: threadTitle,
            content: threadContent,
            tags: '["from-conversation"]',
            status: "open",
            hasAIAnswer: false,
            aiAnswerId: null,
            replyCount: 0,
            viewCount: 0,
            endorsementCount: 0,
            upvoteCount: 0,
            duplicatesOf: null,
            mergedInto: null,
            createdAt: now,
            updatedAt: now,
            tenantId: user.tenantId,
        });
        const aiMessages = messages.filter((m) => m.role === "assistant");
        let aiAnswerId = null;
        if (aiMessages.length > 0) {
            const lastAIMessage = aiMessages[aiMessages.length - 1];
            aiAnswerId = `ai-answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await db.insert(aiAnswers).values({
                id: aiAnswerId,
                threadId: thread.id,
                courseId,
                content: lastAIMessage.content,
                confidenceLevel: "medium",
                routing: null,
                endorsementCount: 0,
                generatedAt: lastAIMessage.createdAt,
                tenantId: user.tenantId,
            });
            await threadsRepository.update(thread.id, {
                hasAIAnswer: true,
                aiAnswerId,
            });
        }
        await conversationsRepository.markAsConverted(conversationId, thread.id);
        reply.code(201);
        return {
            threadId: thread.id,
            aiAnswerId,
        };
    });
}
//# sourceMappingURL=conversations.routes.js.map
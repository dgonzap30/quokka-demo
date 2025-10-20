import { z } from "zod";
import { threadSchema, createThreadSchema, listThreadsQuerySchema, listThreadsResponseSchema, courseIdParamsSchema, getThreadParamsSchema, upvoteThreadParamsSchema, upvoteResponseSchema, } from "../../schemas/threads.schema.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
export async function threadsRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/threads", {
        schema: {
            querystring: listThreadsQuerySchema.extend({
                courseId: z.string(),
            }),
            response: {
                200: listThreadsResponseSchema,
            },
            tags: ["threads"],
            description: "List threads for a course",
        },
    }, async (request, reply) => {
        const { courseId, cursor, limit } = request.query;
        const result = await threadsRepository.findByCourse(courseId, {
            cursor,
            limit,
        });
        return result;
    });
    server.get("/courses/:courseId/threads", {
        schema: {
            params: courseIdParamsSchema,
            querystring: listThreadsQuerySchema,
            response: {
                200: listThreadsResponseSchema,
            },
            tags: ["threads"],
            description: "List threads for a course",
        },
    }, async (request, reply) => {
        const { courseId } = request.params;
        const { cursor, limit } = request.query;
        const result = await threadsRepository.findByCourse(courseId, {
            cursor,
            limit,
        });
        return result;
    });
    server.get("/threads/:id", {
        schema: {
            params: getThreadParamsSchema,
            response: {
                200: threadSchema,
            },
            tags: ["threads"],
            description: "Get thread by ID",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        threadsRepository.incrementViews(id).catch(() => {
        });
        const thread = await threadsRepository.findByIdWithDetails(id);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        return thread;
    });
    server.post("/threads", {
        schema: {
            body: createThreadSchema,
            response: {
                201: threadSchema,
            },
            tags: ["threads"],
            description: "Create new thread",
        },
    }, async (request, reply) => {
        if (!request.session) {
            throw new UnauthorizedError("Not authenticated");
        }
        const { courseId, title, content } = request.body;
        const userId = request.session.userId;
        const newThread = await threadsRepository.createThread({
            id: crypto.randomUUID(),
            courseId,
            authorId: userId,
            title,
            content,
            tags: null,
            status: "open",
            hasAIAnswer: false,
            aiAnswerId: null,
            replyCount: 0,
            viewCount: 0,
            endorsementCount: 0,
            upvoteCount: 0,
            duplicatesOf: null,
            mergedInto: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tenantId: "tenant-demo-001",
        });
        const threadWithDetails = await threadsRepository.findByIdWithDetails(newThread.id);
        if (!threadWithDetails) {
            throw new Error("Failed to fetch created thread");
        }
        reply.code(201);
        return threadWithDetails;
    });
    server.post("/threads/:id/upvote", {
        schema: {
            params: upvoteThreadParamsSchema,
            response: {
                200: upvoteResponseSchema,
            },
            tags: ["threads"],
            description: "Toggle upvote on thread",
        },
    }, async (request, reply) => {
        if (!request.session) {
            throw new UnauthorizedError("Not authenticated");
        }
        const { id } = request.params;
        const userId = request.session.userId;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const thread = await threadsRepository.findById(id);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        const hasUpvoted = await threadsRepository.hasUserUpvoted(id, userId);
        if (hasUpvoted) {
            await threadsRepository.removeUpvote(id, userId);
            return {
                success: true,
                upvoted: false,
                message: "Upvote removed",
            };
        }
        else {
            await threadsRepository.addUpvote(id, userId, user.tenantId);
            return {
                success: true,
                upvoted: true,
                message: "Thread upvoted",
            };
        }
    });
    server.post("/threads/:id/endorse", {
        schema: {
            params: z.object({
                id: z.string(),
            }),
            body: z.object({
                userId: z.string(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                    endorsed: z.boolean(),
                    message: z.string(),
                }),
            },
            tags: ["threads"],
            description: "Endorse a thread",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { userId } = request.body;
        const thread = await threadsRepository.findById(id);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        return {
            success: true,
            endorsed: true,
            message: "Thread endorsed (placeholder)",
        };
    });
}
//# sourceMappingURL=threads.routes.js.map
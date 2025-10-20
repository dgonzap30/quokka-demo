import { z } from "zod";
import { postSchema, createPostSchema, listPostsQuerySchema, listPostsResponseSchema, threadIdParamsSchema, } from "../../schemas/posts.schema.js";
import { postsRepository } from "../../repositories/posts.repository.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
export async function postsRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/posts", {
        schema: {
            querystring: listPostsQuerySchema.extend({
                threadId: z.string(),
            }),
            response: {
                200: listPostsResponseSchema,
            },
            tags: ["posts"],
            description: "List posts for a thread",
        },
    }, async (request, reply) => {
        const { threadId, cursor, limit } = request.query;
        const thread = await threadsRepository.findById(threadId);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        const result = await postsRepository.findByThread(threadId, {
            cursor,
            limit,
        });
        return result;
    });
    server.get("/threads/:threadId/posts", {
        schema: {
            params: threadIdParamsSchema,
            querystring: listPostsQuerySchema,
            response: {
                200: listPostsResponseSchema,
            },
            tags: ["posts"],
            description: "List posts for a thread",
        },
    }, async (request, reply) => {
        const { threadId } = request.params;
        const { cursor, limit } = request.query;
        const thread = await threadsRepository.findById(threadId);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        const result = await postsRepository.findByThread(threadId, {
            cursor,
            limit,
        });
        return result;
    });
    server.post("/posts", {
        schema: {
            body: createPostSchema,
            response: {
                201: postSchema,
            },
            tags: ["posts"],
            description: "Create new post",
        },
    }, async (request, reply) => {
        if (!request.session) {
            throw new UnauthorizedError("Not authenticated");
        }
        const { threadId, content } = request.body;
        const userId = request.session.userId;
        const userRole = request.session.role;
        const thread = await threadsRepository.findById(threadId);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        const isInstructorAnswer = userRole === "instructor" || userRole === "ta";
        const newPost = await postsRepository.createPost({
            id: crypto.randomUUID(),
            threadId,
            authorId: userId,
            content,
            isInstructorAnswer,
            endorsementCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tenantId: "tenant-demo-001",
        });
        const postResults = await postsRepository.findByThread(threadId);
        const postWithAuthor = postResults.items.find((p) => p.id === newPost.id);
        if (!postWithAuthor) {
            throw new Error("Failed to fetch created post");
        }
        reply.code(201);
        return postWithAuthor;
    });
}
//# sourceMappingURL=posts.routes.js.map
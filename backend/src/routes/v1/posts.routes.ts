/**
 * Posts Routes
 *
 * Post endpoints (list, create)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  postSchema,
  createPostSchema,
  listPostsQuerySchema,
  listPostsResponseSchema,
  threadIdParamsSchema,
} from "../../schemas/posts.schema.js";
import { postsRepository } from "../../repositories/posts.repository.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
import type { SessionData } from "../../plugins/session.plugin.js";

export async function postsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/posts?threadId=<id>
   * List posts for a thread with pagination (query param version)
   */
  server.get(
    "/posts",
    {
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
    },
    async (request, reply) => {
      const { threadId, cursor, limit } = request.query;

      // Verify thread exists
      const thread = await threadsRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError("Thread");
      }

      const result = await postsRepository.findByThread(threadId, {
        cursor,
        limit,
      });

      return result;
    }
  );

  /**
   * GET /api/v1/threads/:threadId/posts
   * List posts for a thread with pagination (legacy path param version)
   */
  server.get(
    "/threads/:threadId/posts",
    {
      schema: {
        params: threadIdParamsSchema,
        querystring: listPostsQuerySchema,
        response: {
          200: listPostsResponseSchema,
        },
        tags: ["posts"],
        description: "List posts for a thread",
      },
    },
    async (request, reply) => {
      const { threadId } = request.params;
      const { cursor, limit } = request.query;

      // Verify thread exists
      const thread = await threadsRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError("Thread");
      }

      const result = await postsRepository.findByThread(threadId, {
        cursor,
        limit,
      });

      return result;
    }
  );

  /**
   * POST /api/v1/posts
   * Create new post (reply to thread)
   * Requires authentication
   */
  server.post(
    "/posts",
    {
      schema: {
        body: createPostSchema,
        response: {
          201: postSchema,
        },
        tags: ["posts"],
        description: "Create new post",
      },
    },
    async (request, reply) => {
      // Check if user is authenticated
      if (!request.session) {
        throw new UnauthorizedError("Not authenticated");
      }

      const { threadId, content } = request.body;
      const userId = request.session.userId;
      const userRole = request.session.role;

      // Verify thread exists
      const thread = await threadsRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError("Thread");
      }

      // Determine if this is an instructor answer
      const isInstructorAnswer = userRole === "instructor" || userRole === "ta";

      // Create post
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

      // Fetch author details
      const postResults = await postsRepository.findByThread(threadId);
      const postWithAuthor = postResults.items.find((p) => p.id === newPost.id);

      if (!postWithAuthor) {
        throw new Error("Failed to fetch created post");
      }

      reply.code(201);
      return postWithAuthor;
    }
  );
}

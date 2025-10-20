/**
 * Threads Routes
 *
 * Thread endpoints (list, get, create, upvote)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  threadSchema,
  createThreadSchema,
  listThreadsQuerySchema,
  listThreadsResponseSchema,
  courseIdParamsSchema,
  getThreadParamsSchema,
  upvoteThreadParamsSchema,
  upvoteResponseSchema,
} from "../../schemas/threads.schema.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
import type { SessionData } from "../../plugins/session.plugin.js";

export async function threadsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/threads?courseId=<id>
   * List threads for a course with pagination (query param version)
   */
  server.get(
    "/threads",
    {
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
    },
    async (request, reply) => {
      const { courseId, cursor, limit } = request.query;

      const result = await threadsRepository.findByCourse(courseId, {
        cursor,
        limit,
      });

      return result;
    }
  );

  /**
   * GET /api/v1/courses/:courseId/threads
   * List threads for a course with pagination (legacy path param version)
   */
  server.get(
    "/courses/:courseId/threads",
    {
      schema: {
        params: courseIdParamsSchema,
        querystring: listThreadsQuerySchema,
        response: {
          200: listThreadsResponseSchema,
        },
        tags: ["threads"],
        description: "List threads for a course",
      },
    },
    async (request, reply) => {
      const { courseId } = request.params;
      const { cursor, limit } = request.query;

      const result = await threadsRepository.findByCourse(courseId, {
        cursor,
        limit,
      });

      return result;
    }
  );

  /**
   * GET /api/v1/threads/:id
   * Get single thread with full details
   * Auto-increments view count
   */
  server.get(
    "/threads/:id",
    {
      schema: {
        params: getThreadParamsSchema,
        response: {
          200: threadSchema,
        },
        tags: ["threads"],
        description: "Get thread by ID",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Increment view count (fire and forget)
      threadsRepository.incrementViews(id).catch(() => {
        // Ignore errors for view tracking
      });

      const thread = await threadsRepository.findByIdWithDetails(id);

      if (!thread) {
        throw new NotFoundError("Thread");
      }

      return thread as any;
    }
  );

  /**
   * POST /api/v1/threads
   * Create new thread
   * Requires authentication
   */
  server.post(
    "/threads",
    {
      schema: {
        body: createThreadSchema,
        response: {
          201: threadSchema,
        },
        tags: ["threads"],
        description: "Create new thread",
      },
    },
    async (request, reply) => {
      // Check if user is authenticated
      if (!request.session) {
        throw new UnauthorizedError("Not authenticated");
      }

      const { courseId, title, content } = request.body;
      const userId = request.session.userId;

      // Create thread
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

      // Fetch full thread details to return
      const threadWithDetails = await threadsRepository.findByIdWithDetails(newThread.id);

      if (!threadWithDetails) {
        throw new Error("Failed to fetch created thread");
      }

      reply.code(201);
      return threadWithDetails as any;
    }
  );

  /**
   * POST /api/v1/threads/:id/upvote
   * Toggle upvote on thread
   * Requires authentication
   * If already upvoted, removes upvote. Otherwise adds upvote.
   */
  server.post(
    "/threads/:id/upvote",
    {
      schema: {
        params: upvoteThreadParamsSchema,
        response: {
          200: upvoteResponseSchema,
        },
        tags: ["threads"],
        description: "Toggle upvote on thread",
      },
    },
    async (request, reply) => {
      // Check if user is authenticated
      if (!request.session) {
        throw new UnauthorizedError("Not authenticated");
      }

      const { id } = request.params;
      const userId = request.session.userId;

      // Get user to determine tenant
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      // Check if thread exists
      const thread = await threadsRepository.findById(id);
      if (!thread) {
        throw new NotFoundError("Thread");
      }

      // Check if user has already upvoted
      const hasUpvoted = await threadsRepository.hasUserUpvoted(id, userId);

      if (hasUpvoted) {
        // Remove upvote
        await threadsRepository.removeUpvote(id, userId);
        return {
          success: true,
          upvoted: false,
          message: "Upvote removed",
        };
      } else {
        // Add upvote
        await threadsRepository.addUpvote(id, userId, user.tenantId);
        return {
          success: true,
          upvoted: true,
          message: "Thread upvoted",
        };
      }
    }
  );

  /**
   * POST /api/v1/threads/:id/endorse
   * Endorse a thread (instructor/TA only)
   * Placeholder - returns 404 until full implementation
   */
  server.post(
    "/threads/:id/endorse",
    {
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
    },
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;

      // Check if thread exists
      const thread = await threadsRepository.findById(id);
      if (!thread) {
        throw new NotFoundError("Thread");
      }

      // TODO: Implement endorsement logic
      // - Check if user is instructor/TA
      // - Add endorsement record
      // - Update thread endorsement count

      return {
        success: true,
        endorsed: true,
        message: "Thread endorsed (placeholder)",
      };
    }
  );
}

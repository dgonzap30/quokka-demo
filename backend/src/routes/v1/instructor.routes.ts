/**
 * Instructor Routes
 *
 * Response template endpoints (list, create, delete)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  createResponseTemplateBodySchema,
  getUserIdParamsSchema,
  getTemplateIdParamsSchema,
  listResponseTemplatesResponseSchema,
  createResponseTemplateResponseSchema,
} from "../../schemas/instructor.schema.js";
import { instructorRepository } from "../../repositories/instructor.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { threadsRepository } from "../../repositories/threads.repository.js";
import { aiAnswersRepository } from "../../repositories/ai-answers.repository.js";
import { postsRepository } from "../../repositories/posts.repository.js";
import { NotFoundError, serializeDates } from "../../utils/errors.js";
import { db } from "../../db/client.js";
import { threads, posts, aiAnswers } from "../../db/schema.js";
import { eq, and, count, sql } from "drizzle-orm";

export async function instructorRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/instructor/templates?userId=<id>
   * List all response templates for a user (query param version)
   */
  server.get(
    "/instructor/templates",
    {
      schema: {
        querystring: z.object({
          userId: z.string(),
        }),
        response: {
          200: listResponseTemplatesResponseSchema,
        },
        tags: ["instructor"],
        description: "List all response templates for a user",
      },
    },
    async (request, reply) => {
      const { userId } = request.query;

      const templates = await instructorRepository.findByUserId(userId);

      return {
        templates: templates.map(t => serializeDates(t)) as any,
      };
    }
  );

  /**
   * POST /api/v1/instructor/templates
   * Create a new response template (instructor namespace)
   */
  server.post(
    "/instructor/templates",
    {
      schema: {
        body: createResponseTemplateBodySchema,
        response: {
          201: createResponseTemplateResponseSchema,
        },
        tags: ["instructor"],
        description: "Create a new response template",
      },
    },
    async (request, reply) => {
      const { userId, courseId, title, content, tags } = request.body;

      // Get user to determine tenant
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const template = await instructorRepository.create({
        id,
        userId,
        courseId,
        title,
        content,
        tags: JSON.stringify(tags),
        usageCount: 0,
        lastUsedAt: null,
        createdAt: now,
        tenantId: user.tenantId,
      });

      reply.code(201);
      return serializeDates({
        ...template,
        tags: tags,
      });
    }
  );

  /**
   * DELETE /api/v1/instructor/templates/:id
   * Delete a response template (instructor namespace)
   */
  server.delete(
    "/instructor/templates/:id",
    {
      schema: {
        params: getTemplateIdParamsSchema,
        response: {
          204: z.void(),
        },
        tags: ["instructor"],
        description: "Delete a response template",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Verify template exists
      const template = await instructorRepository.findById(id);
      if (!template) {
        throw new NotFoundError("Response template");
      }

      await instructorRepository.deleteTemplate(id);

      reply.code(204);
    }
  );

  /**
   * GET /api/v1/instructor/metrics?courseId=<id>&timeRange=<range>
   * Get instructor metrics (placeholder - needs full implementation)
   */
  server.get(
    "/instructor/metrics",
    {
      schema: {
        querystring: z.object({
          courseId: z.string(),
          timeRange: z.string().optional(),
        }),
        response: {
          200: z.object({
            totalThreads: z.number(),
            answeredThreads: z.number(),
            unansweredThreads: z.number(),
            aiAnsweredThreads: z.number(),
          }).passthrough(),
        },
        tags: ["instructor"],
        description: "Get instructor metrics for a course",
      },
    },
    async (request, reply) => {
      const { courseId } = request.query;

      // Get total threads for the course
      const [totalResult] = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${threads.id})`.as('count')
        })
        .from(threads)
        .where(eq(threads.courseId, courseId));

      const totalThreads = totalResult?.count || 0;

      // Get threads with AI answers
      const [aiAnsweredResult] = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${threads.id})`.as('count')
        })
        .from(threads)
        .leftJoin(aiAnswers, eq(threads.id, aiAnswers.threadId))
        .where(and(
          eq(threads.courseId, courseId),
          sql`${aiAnswers.id} IS NOT NULL`
        ));

      const aiAnsweredThreads = aiAnsweredResult?.count || 0;

      // Get threads with any posts (human answered)
      const [answeredResult] = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${threads.id})`.as('count')
        })
        .from(threads)
        .leftJoin(posts, eq(threads.id, posts.threadId))
        .where(and(
          eq(threads.courseId, courseId),
          sql`${posts.id} IS NOT NULL`
        ));

      const answeredThreads = answeredResult?.count || 0;

      const unansweredThreads = totalThreads - answeredThreads;

      return {
        totalThreads,
        answeredThreads,
        unansweredThreads,
        aiAnsweredThreads,
      };
    }
  );

  /**
   * GET /api/v1/instructor/unanswered?courseId=<id>
   * Get unanswered threads (placeholder - needs full implementation)
   */
  server.get(
    "/instructor/unanswered",
    {
      schema: {
        querystring: z.object({
          courseId: z.string(),
        }),
        response: {
          200: z.array(z.any()),
        },
        tags: ["instructor"],
        description: "Get unanswered threads for a course",
      },
    },
    async (request, reply) => {
      const { courseId } = request.query;

      // Get threads without any posts
      const unansweredThreads = await db
        .select({
          id: threads.id,
          title: threads.title,
          content: threads.content,
          authorId: threads.authorId,
          courseId: threads.courseId,
          status: threads.status,
          createdAt: threads.createdAt,
        })
        .from(threads)
        .leftJoin(posts, eq(threads.id, posts.threadId))
        .where(and(
          eq(threads.courseId, courseId),
          sql`${posts.id} IS NULL`
        ))
        .orderBy(sql`${threads.createdAt} DESC`)
        .limit(50);

      return unansweredThreads.map(t => serializeDates(t));
    }
  );

  /**
   * GET /api/v1/instructor/moderation-queue?courseId=<id>
   * Get moderation queue (placeholder - needs full implementation)
   */
  server.get(
    "/instructor/moderation-queue",
    {
      schema: {
        querystring: z.object({
          courseId: z.string(),
        }),
        response: {
          200: z.array(z.any()),
        },
        tags: ["instructor"],
        description: "Get moderation queue for a course",
      },
    },
    async (request, reply) => {
      const { courseId } = request.query;

      // Get recent threads needing attention (last 7 days, open status)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const needsAttention = await db
        .select()
        .from(threads)
        .where(and(
          eq(threads.courseId, courseId),
          eq(threads.status, 'open'),
          sql`${threads.createdAt} >= ${sevenDaysAgo}`
        ))
        .orderBy(sql`${threads.createdAt} DESC`)
        .limit(20);

      return needsAttention.map(t => serializeDates(t));
    }
  );

  /**
   * GET /api/v1/users/:userId/response-templates
   * List all response templates for a user (legacy path param version)
   */
  server.get(
    "/users/:userId/response-templates",
    {
      schema: {
        params: getUserIdParamsSchema,
        response: {
          200: listResponseTemplatesResponseSchema,
        },
        tags: ["instructor"],
        description: "List all response templates for a user",
      },
    },
    async (request, reply) => {
      const { userId } = request.params;

      const templates = await instructorRepository.findByUserId(userId);

      return {
        templates: templates.map(t => serializeDates(t)) as any,
      };
    }
  );

  /**
   * POST /api/v1/response-templates
   * Create a new response template
   */
  server.post(
    "/response-templates",
    {
      schema: {
        body: createResponseTemplateBodySchema,
        response: {
          201: createResponseTemplateResponseSchema,
        },
        tags: ["instructor"],
        description: "Create a new response template",
      },
    },
    async (request, reply) => {
      const { userId, courseId, title, content, tags } = request.body;

      // Get user to determine tenant
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const template = await instructorRepository.create({
        id,
        userId,
        courseId,
        title,
        content,
        tags: JSON.stringify(tags),
        usageCount: 0,
        lastUsedAt: null,
        createdAt: now,
        tenantId: user.tenantId,
      });

      reply.code(201);
      return serializeDates({
        ...template,
        tags: tags,
      });
    }
  );

  /**
   * DELETE /api/v1/response-templates/:id
   * Delete a response template
   */
  server.delete(
    "/response-templates/:id",
    {
      schema: {
        params: getTemplateIdParamsSchema,
        response: {
          204: z.void(),
        },
        tags: ["instructor"],
        description: "Delete a response template",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Verify template exists
      const template = await instructorRepository.findById(id);
      if (!template) {
        throw new NotFoundError("Response template");
      }

      await instructorRepository.deleteTemplate(id);

      reply.code(204);
    }
  );
}

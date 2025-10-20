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
import { NotFoundError } from "../../utils/errors.js";

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
        templates: templates as any,
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
      const now = new Date().toISOString();

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
      return {
        ...template,
        tags: tags,
      };
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
      // TODO: Implement proper metrics calculation
      return {
        totalThreads: 0,
        answeredThreads: 0,
        unansweredThreads: 0,
        aiAnsweredThreads: 0,
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
      // TODO: Implement proper unanswered threads query
      return [];
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
      // TODO: Implement proper moderation queue logic
      return [];
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
        templates: templates as any,
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
      const now = new Date().toISOString();

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
      return {
        ...template,
        tags: tags,
      };
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

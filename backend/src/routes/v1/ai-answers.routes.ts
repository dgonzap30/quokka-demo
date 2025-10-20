/**
 * AI Answers Routes
 *
 * AI answer endpoints (get, endorse, bulk endorse)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  getThreadIdParamsSchema,
  getAIAnswerIdParamsSchema,
  endorseAIAnswerBodySchema,
  bulkEndorseAIAnswersBodySchema,
  getAIAnswerResponseSchema,
  endorseAIAnswerResponseSchema,
  bulkEndorseResponseSchema,
  type BulkActionResult,
} from "../../schemas/ai-answers.schema.js";
import { aiAnswersRepository } from "../../repositories/ai-answers.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";

export async function aiAnswersRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/ai-answers?threadId=<id>
   * Get AI answer for a thread (query param version)
   */
  server.get(
    "/ai-answers",
    {
      schema: {
        querystring: z.object({
          threadId: z.string(),
        }),
        response: {
          200: getAIAnswerResponseSchema,
        },
        tags: ["ai-answers"],
        description: "Get AI answer for a thread",
      },
    },
    async (request, reply) => {
      const { threadId } = request.query;

      const aiAnswer = await aiAnswersRepository.findByThreadId(threadId);

      return {
        aiAnswer,
      };
    }
  );

  /**
   * GET /api/v1/ai-answers/:id
   * Get single AI answer by ID
   */
  server.get(
    "/ai-answers/:id",
    {
      schema: {
        params: getAIAnswerIdParamsSchema,
        response: {
          200: z.object({
            id: z.string(),
            threadId: z.string(),
            courseId: z.string(),
            content: z.string(),
            confidenceLevel: z.string(),
            routing: z.any().nullable(),
            endorsementCount: z.number(),
            generatedAt: z.string(),
            tenantId: z.string(),
          }).passthrough(),
        },
        tags: ["ai-answers"],
        description: "Get single AI answer by ID",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const aiAnswer = await aiAnswersRepository.findByIdWithDetails(id);
      if (!aiAnswer) {
        throw new NotFoundError("AI answer");
      }

      return aiAnswer;
    }
  );

  /**
   * GET /api/v1/ai-answers/:id/citations
   * Get citations for an AI answer
   */
  server.get(
    "/ai-answers/:id/citations",
    {
      schema: {
        params: getAIAnswerIdParamsSchema,
        response: {
          200: z.array(z.object({
            id: z.string(),
            aiAnswerId: z.string(),
            materialId: z.string(),
            excerpt: z.string(),
            relevanceScore: z.number(),
            citationNumber: z.number(),
            tenantId: z.string(),
          }).passthrough()),
        },
        tags: ["ai-answers"],
        description: "Get citations for an AI answer",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Verify AI answer exists
      const aiAnswer = await aiAnswersRepository.findById(id);
      if (!aiAnswer) {
        throw new NotFoundError("AI answer");
      }

      const citations = await aiAnswersRepository.getCitations(id);

      return citations;
    }
  );

  /**
   * GET /api/v1/threads/:threadId/ai-answer
   * Get AI answer for a thread (legacy path param version)
   */
  server.get(
    "/threads/:threadId/ai-answer",
    {
      schema: {
        params: getThreadIdParamsSchema,
        response: {
          200: getAIAnswerResponseSchema,
        },
        tags: ["ai-answers"],
        description: "Get AI answer for a thread",
      },
    },
    async (request, reply) => {
      const { threadId } = request.params;

      const aiAnswer = await aiAnswersRepository.findByThreadId(threadId);

      return {
        aiAnswer,
      };
    }
  );

  /**
   * POST /api/v1/ai-answers/:id/endorse
   * Endorse an AI answer
   */
  server.post(
    "/ai-answers/:id/endorse",
    {
      schema: {
        params: getAIAnswerIdParamsSchema,
        body: endorseAIAnswerBodySchema,
        response: {
          200: endorseAIAnswerResponseSchema,
        },
        tags: ["ai-answers"],
        description: "Endorse an AI answer",
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;

      // Check if AI answer exists
      const aiAnswer = await aiAnswersRepository.findByIdWithDetails(id);
      if (!aiAnswer) {
        throw new NotFoundError("AI answer");
      }

      // Check if user already endorsed (idempotent - return existing)
      const hasEndorsed = await aiAnswersRepository.hasUserEndorsed(id, userId);
      if (hasEndorsed) {
        // Return existing AI answer with endorsements (idempotent)
        const existing = await aiAnswersRepository.findByIdWithDetails(id);
        if (!existing) {
          throw new NotFoundError("AI answer");
        }
        return existing;
      }

      // Get user to determine tenant
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      // Create endorsement
      await aiAnswersRepository.createEndorsement(id, userId, user.tenantId);

      // Return updated AI answer
      const updated = await aiAnswersRepository.findByIdWithDetails(id);
      if (!updated) {
        throw new NotFoundError("AI answer");
      }

      return updated;
    }
  );

  /**
   * POST /api/v1/ai-answers/bulk-endorse
   * Bulk endorse AI answers
   */
  server.post(
    "/ai-answers/bulk-endorse",
    {
      schema: {
        body: bulkEndorseAIAnswersBodySchema,
        response: {
          200: bulkEndorseResponseSchema,
        },
        tags: ["ai-answers"],
        description: "Bulk endorse AI answers",
      },
    },
    async (request, reply) => {
      const { aiAnswerIds, userId } = request.body;

      const errors: BulkActionResult["errors"] = [];
      let successCount = 0;

      // Get user to determine tenant
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      // Validate all AI answers exist and user hasn't endorsed
      for (const aiAnswerId of aiAnswerIds) {
        const aiAnswer = await aiAnswersRepository.findByIdWithDetails(aiAnswerId);

        if (!aiAnswer) {
          errors.push({
            itemId: aiAnswerId,
            reason: "AI answer not found",
            code: "NOT_FOUND",
          });
        } else {
          const hasEndorsed = await aiAnswersRepository.hasUserEndorsed(
            aiAnswerId,
            userId
          );
          if (hasEndorsed) {
            errors.push({
              itemId: aiAnswerId,
              reason: "Already endorsed by this user",
              code: "ALREADY_ENDORSED",
            });
          }
        }
      }

      // If any validation failed, return errors
      if (errors.length > 0) {
        return {
          actionType: "endorse" as const,
          successCount: 0,
          failedCount: errors.length,
          errors,
          timestamp: new Date().toISOString(),
        };
      }

      // Perform bulk endorsement
      for (const aiAnswerId of aiAnswerIds) {
        try {
          await aiAnswersRepository.createEndorsement(
            aiAnswerId,
            userId,
            user.tenantId
          );
          successCount++;
        } catch (error) {
          errors.push({
            itemId: aiAnswerId,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        actionType: "endorse" as const,
        successCount,
        failedCount: errors.length,
        errors,
        timestamp: new Date().toISOString(),
      };
    }
  );
}

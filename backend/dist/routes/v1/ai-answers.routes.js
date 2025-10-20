import { z } from "zod";
import { getThreadIdParamsSchema, getAIAnswerIdParamsSchema, endorseAIAnswerBodySchema, bulkEndorseAIAnswersBodySchema, getAIAnswerResponseSchema, endorseAIAnswerResponseSchema, bulkEndorseResponseSchema, } from "../../schemas/ai-answers.schema.js";
import { aiAnswersRepository } from "../../repositories/ai-answers.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";
export async function aiAnswersRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/ai-answers", {
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
    }, async (request, reply) => {
        const { threadId } = request.query;
        const aiAnswer = await aiAnswersRepository.findByThreadId(threadId);
        return {
            aiAnswer: aiAnswer,
        };
    });
    server.get("/ai-answers/:id", {
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
    }, async (request, reply) => {
        const { id } = request.params;
        const aiAnswer = await aiAnswersRepository.findByIdWithDetails(id);
        if (!aiAnswer) {
            throw new NotFoundError("AI answer");
        }
        return aiAnswer;
    });
    server.get("/ai-answers/:id/citations", {
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
    }, async (request, reply) => {
        const { id } = request.params;
        const aiAnswer = await aiAnswersRepository.findById(id);
        if (!aiAnswer) {
            throw new NotFoundError("AI answer");
        }
        const citations = await aiAnswersRepository.getCitations(id);
        return citations;
    });
    server.get("/threads/:threadId/ai-answer", {
        schema: {
            params: getThreadIdParamsSchema,
            response: {
                200: getAIAnswerResponseSchema,
            },
            tags: ["ai-answers"],
            description: "Get AI answer for a thread",
        },
    }, async (request, reply) => {
        const { threadId } = request.params;
        const aiAnswer = await aiAnswersRepository.findByThreadId(threadId);
        return {
            aiAnswer: aiAnswer,
        };
    });
    server.post("/ai-answers/:id/endorse", {
        schema: {
            params: getAIAnswerIdParamsSchema,
            body: endorseAIAnswerBodySchema,
            response: {
                200: endorseAIAnswerResponseSchema,
            },
            tags: ["ai-answers"],
            description: "Endorse an AI answer",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { userId } = request.body;
        const aiAnswer = await aiAnswersRepository.findByIdWithDetails(id);
        if (!aiAnswer) {
            throw new NotFoundError("AI answer");
        }
        const hasEndorsed = await aiAnswersRepository.hasUserEndorsed(id, userId);
        if (hasEndorsed) {
            const existing = await aiAnswersRepository.findByIdWithDetails(id);
            if (!existing) {
                throw new NotFoundError("AI answer");
            }
            return existing;
        }
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        await aiAnswersRepository.createEndorsement(id, userId, user.tenantId);
        const updated = await aiAnswersRepository.findByIdWithDetails(id);
        if (!updated) {
            throw new NotFoundError("AI answer");
        }
        return updated;
    });
    server.post("/ai-answers/bulk-endorse", {
        schema: {
            body: bulkEndorseAIAnswersBodySchema,
            response: {
                200: bulkEndorseResponseSchema,
            },
            tags: ["ai-answers"],
            description: "Bulk endorse AI answers",
        },
    }, async (request, reply) => {
        const { aiAnswerIds, userId } = request.body;
        const errors = [];
        let successCount = 0;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        for (const aiAnswerId of aiAnswerIds) {
            const aiAnswer = await aiAnswersRepository.findByIdWithDetails(aiAnswerId);
            if (!aiAnswer) {
                errors.push({
                    itemId: aiAnswerId,
                    reason: "AI answer not found",
                    code: "NOT_FOUND",
                });
            }
            else {
                const hasEndorsed = await aiAnswersRepository.hasUserEndorsed(aiAnswerId, userId);
                if (hasEndorsed) {
                    errors.push({
                        itemId: aiAnswerId,
                        reason: "Already endorsed by this user",
                        code: "ALREADY_ENDORSED",
                    });
                }
            }
        }
        if (errors.length > 0) {
            return {
                actionType: "endorse",
                successCount: 0,
                failedCount: errors.length,
                errors,
                timestamp: new Date().toISOString(),
            };
        }
        for (const aiAnswerId of aiAnswerIds) {
            try {
                await aiAnswersRepository.createEndorsement(aiAnswerId, userId, user.tenantId);
                successCount++;
            }
            catch (error) {
                errors.push({
                    itemId: aiAnswerId,
                    reason: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        return {
            actionType: "endorse",
            successCount,
            failedCount: errors.length,
            errors,
            timestamp: new Date().toISOString(),
        };
    });
}
//# sourceMappingURL=ai-answers.routes.js.map
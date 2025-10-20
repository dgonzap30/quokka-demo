import { z } from "zod";
import { createResponseTemplateBodySchema, getUserIdParamsSchema, getTemplateIdParamsSchema, listResponseTemplatesResponseSchema, createResponseTemplateResponseSchema, } from "../../schemas/instructor.schema.js";
import { instructorRepository } from "../../repositories/instructor.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";
export async function instructorRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/instructor/templates", {
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
    }, async (request, reply) => {
        const { userId } = request.query;
        const templates = await instructorRepository.findByUserId(userId);
        return {
            templates: templates,
        };
    });
    server.post("/instructor/templates", {
        schema: {
            body: createResponseTemplateBodySchema,
            response: {
                201: createResponseTemplateResponseSchema,
            },
            tags: ["instructor"],
            description: "Create a new response template",
        },
    }, async (request, reply) => {
        const { userId, courseId, title, content, tags } = request.body;
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
    });
    server.delete("/instructor/templates/:id", {
        schema: {
            params: getTemplateIdParamsSchema,
            response: {
                204: z.void(),
            },
            tags: ["instructor"],
            description: "Delete a response template",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const template = await instructorRepository.findById(id);
        if (!template) {
            throw new NotFoundError("Response template");
        }
        await instructorRepository.deleteTemplate(id);
        reply.code(204);
    });
    server.get("/instructor/metrics", {
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
    }, async (request, reply) => {
        return {
            totalThreads: 0,
            answeredThreads: 0,
            unansweredThreads: 0,
            aiAnsweredThreads: 0,
        };
    });
    server.get("/instructor/unanswered", {
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
    }, async (request, reply) => {
        return [];
    });
    server.get("/instructor/moderation-queue", {
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
    }, async (request, reply) => {
        return [];
    });
    server.get("/users/:userId/response-templates", {
        schema: {
            params: getUserIdParamsSchema,
            response: {
                200: listResponseTemplatesResponseSchema,
            },
            tags: ["instructor"],
            description: "List all response templates for a user",
        },
    }, async (request, reply) => {
        const { userId } = request.params;
        const templates = await instructorRepository.findByUserId(userId);
        return {
            templates: templates,
        };
    });
    server.post("/response-templates", {
        schema: {
            body: createResponseTemplateBodySchema,
            response: {
                201: createResponseTemplateResponseSchema,
            },
            tags: ["instructor"],
            description: "Create a new response template",
        },
    }, async (request, reply) => {
        const { userId, courseId, title, content, tags } = request.body;
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
    });
    server.delete("/response-templates/:id", {
        schema: {
            params: getTemplateIdParamsSchema,
            response: {
                204: z.void(),
            },
            tags: ["instructor"],
            description: "Delete a response template",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const template = await instructorRepository.findById(id);
        if (!template) {
            throw new NotFoundError("Response template");
        }
        await instructorRepository.deleteTemplate(id);
        reply.code(204);
    });
}
//# sourceMappingURL=instructor.routes.js.map
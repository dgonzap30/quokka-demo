import { z } from "zod";
export const responseTemplateSchema = z.object({
    id: z.string(),
    userId: z.string(),
    courseId: z.string().nullable(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).default([]),
    usageCount: z.number().default(0),
    lastUsedAt: z.string().nullable().optional(),
    createdAt: z.string(),
    tenantId: z.string(),
}).passthrough();
export const createResponseTemplateBodySchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    courseId: z.string().min(1, "Course ID is required"),
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    content: z.string().min(1, "Content is required"),
    tags: z.array(z.string()).default([]),
});
export const getUserIdParamsSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});
export const getTemplateIdParamsSchema = z.object({
    id: z.string().min(1, "Template ID is required"),
});
export const listResponseTemplatesResponseSchema = z.object({
    templates: z.array(responseTemplateSchema),
});
export const createResponseTemplateResponseSchema = responseTemplateSchema;
//# sourceMappingURL=instructor.schema.js.map
import { z } from "zod";
import { authorSchema } from "./threads.schema.js";
export const postSchema = z.object({
    id: z.string(),
    threadId: z.string(),
    authorId: z.string(),
    content: z.string(),
    isInstructorAnswer: z.boolean(),
    endorsementCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    tenantId: z.string(),
    author: authorSchema,
});
export const createPostSchema = z.object({
    threadId: z.string().min(1, "Thread ID is required"),
    content: z.string().min(1, "Content is required").max(10000, "Content too long"),
});
export const listPostsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
});
export const listPostsResponseSchema = z.object({
    items: z.array(postSchema),
    nextCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
});
export const threadIdParamsSchema = z.object({
    threadId: z.string().min(1, "Thread ID is required"),
});
//# sourceMappingURL=posts.schema.js.map
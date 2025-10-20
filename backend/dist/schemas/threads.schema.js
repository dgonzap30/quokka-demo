import { z } from "zod";
export const authorSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["student", "instructor", "ta"]),
    avatar: z.string().nullable(),
});
export const threadSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    authorId: z.string(),
    title: z.string(),
    content: z.string(),
    status: z.string(),
    views: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    author: authorSchema,
    upvoteCount: z.number(),
    postCount: z.number(),
    hasAiAnswer: z.boolean(),
});
export const createThreadSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
    content: z.string().min(10, "Content must be at least 10 characters"),
});
export const listThreadsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
});
export const listThreadsResponseSchema = z.object({
    items: z.array(threadSchema),
    nextCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
});
export const getThreadParamsSchema = z.object({
    id: z.string().min(1, "Thread ID is required"),
});
export const upvoteThreadParamsSchema = z.object({
    id: z.string().min(1, "Thread ID is required"),
});
export const upvoteResponseSchema = z.object({
    success: z.boolean(),
    upvoted: z.boolean(),
    message: z.string(),
});
export const courseIdParamsSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
});
//# sourceMappingURL=threads.schema.js.map
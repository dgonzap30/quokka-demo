import { z } from "zod";
export declare const authorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    avatar: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "ta";
    avatar: string | null;
}, {
    id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "ta";
    avatar: string | null;
}>;
export declare const threadSchema: z.ZodObject<{
    id: z.ZodString;
    courseId: z.ZodString;
    authorId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    status: z.ZodString;
    views: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    author: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        avatar: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    }, {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    }>;
    upvoteCount: z.ZodNumber;
    postCount: z.ZodNumber;
    hasAiAnswer: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    courseId: string;
    authorId: string;
    title: string;
    content: string;
    status: string;
    upvoteCount: number;
    updatedAt: string;
    author: {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
    views: number;
    postCount: number;
    hasAiAnswer: boolean;
}, {
    id: string;
    createdAt: string;
    courseId: string;
    authorId: string;
    title: string;
    content: string;
    status: string;
    upvoteCount: number;
    updatedAt: string;
    author: {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
    views: number;
    postCount: number;
    hasAiAnswer: boolean;
}>;
export type ThreadResponse = z.infer<typeof threadSchema>;
export declare const createThreadSchema: z.ZodObject<{
    courseId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    title: string;
    content: string;
}, {
    courseId: string;
    title: string;
    content: string;
}>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export declare const listThreadsQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;
export declare const listThreadsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        courseId: z.ZodString;
        authorId: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        status: z.ZodString;
        views: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        author: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            email: z.ZodString;
            role: z.ZodEnum<["student", "instructor", "ta"]>;
            avatar: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        }, {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        }>;
        upvoteCount: z.ZodNumber;
        postCount: z.ZodNumber;
        hasAiAnswer: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        courseId: string;
        authorId: string;
        title: string;
        content: string;
        status: string;
        upvoteCount: number;
        updatedAt: string;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
        views: number;
        postCount: number;
        hasAiAnswer: boolean;
    }, {
        id: string;
        createdAt: string;
        courseId: string;
        authorId: string;
        title: string;
        content: string;
        status: string;
        upvoteCount: number;
        updatedAt: string;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
        views: number;
        postCount: number;
        hasAiAnswer: boolean;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
    hasNextPage: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        createdAt: string;
        courseId: string;
        authorId: string;
        title: string;
        content: string;
        status: string;
        upvoteCount: number;
        updatedAt: string;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
        views: number;
        postCount: number;
        hasAiAnswer: boolean;
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}, {
    items: {
        id: string;
        createdAt: string;
        courseId: string;
        authorId: string;
        title: string;
        content: string;
        status: string;
        upvoteCount: number;
        updatedAt: string;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
        views: number;
        postCount: number;
        hasAiAnswer: boolean;
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}>;
export type ListThreadsResponse = z.infer<typeof listThreadsResponseSchema>;
export declare const getThreadParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type GetThreadParams = z.infer<typeof getThreadParamsSchema>;
export declare const upvoteThreadParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type UpvoteThreadParams = z.infer<typeof upvoteThreadParamsSchema>;
export declare const upvoteResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    upvoted: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    upvoted: boolean;
}, {
    message: string;
    success: boolean;
    upvoted: boolean;
}>;
export type UpvoteResponse = z.infer<typeof upvoteResponseSchema>;
export declare const courseIdParamsSchema: z.ZodObject<{
    courseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    courseId: string;
}, {
    courseId: string;
}>;
export type CourseIdParams = z.infer<typeof courseIdParamsSchema>;
//# sourceMappingURL=threads.schema.d.ts.map
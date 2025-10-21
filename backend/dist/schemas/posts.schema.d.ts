import { z } from "zod";
export declare const postSchema: z.ZodObject<{
    id: z.ZodString;
    threadId: z.ZodString;
    authorId: z.ZodString;
    content: z.ZodString;
    isInstructorAnswer: z.ZodBoolean;
    endorsementCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    tenantId: z.ZodString;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    createdAt: string;
    authorId: string;
    content: string;
    endorsementCount: number;
    updatedAt: string;
    threadId: string;
    isInstructorAnswer: boolean;
    author: {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
}, {
    id: string;
    tenantId: string;
    createdAt: string;
    authorId: string;
    content: string;
    endorsementCount: number;
    updatedAt: string;
    threadId: string;
    isInstructorAnswer: boolean;
    author: {
        id: string;
        name: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
}>;
export type PostResponse = z.infer<typeof postSchema>;
export declare const createPostSchema: z.ZodObject<{
    threadId: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    threadId: string;
}, {
    content: string;
    threadId: string;
}>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export declare const listPostsQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
export declare const listPostsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        threadId: z.ZodString;
        authorId: z.ZodString;
        content: z.ZodString;
        isInstructorAnswer: z.ZodBoolean;
        endorsementCount: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        tenantId: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        id: string;
        tenantId: string;
        createdAt: string;
        authorId: string;
        content: string;
        endorsementCount: number;
        updatedAt: string;
        threadId: string;
        isInstructorAnswer: boolean;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
    }, {
        id: string;
        tenantId: string;
        createdAt: string;
        authorId: string;
        content: string;
        endorsementCount: number;
        updatedAt: string;
        threadId: string;
        isInstructorAnswer: boolean;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
    hasNextPage: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        tenantId: string;
        createdAt: string;
        authorId: string;
        content: string;
        endorsementCount: number;
        updatedAt: string;
        threadId: string;
        isInstructorAnswer: boolean;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}, {
    items: {
        id: string;
        tenantId: string;
        createdAt: string;
        authorId: string;
        content: string;
        endorsementCount: number;
        updatedAt: string;
        threadId: string;
        isInstructorAnswer: boolean;
        author: {
            id: string;
            name: string;
            email: string;
            role: "student" | "instructor" | "ta";
            avatar: string | null;
        };
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}>;
export type ListPostsResponse = z.infer<typeof listPostsResponseSchema>;
export declare const threadIdParamsSchema: z.ZodObject<{
    threadId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    threadId: string;
}, {
    threadId: string;
}>;
export type ThreadIdParams = z.infer<typeof threadIdParamsSchema>;
//# sourceMappingURL=posts.schema.d.ts.map
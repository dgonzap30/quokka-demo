import { z } from "zod";
export declare const messageRoleSchema: z.ZodEnum<["user", "assistant", "system"]>;
export declare const aiMessageSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    materialReferences: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    confidenceScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "user" | "assistant" | "system";
    createdAt: string;
    content: string;
    conversationId: string;
    materialReferences?: string | null | undefined;
    confidenceScore?: number | null | undefined;
}, {
    id: string;
    role: "user" | "assistant" | "system";
    createdAt: string;
    content: string;
    conversationId: string;
    materialReferences?: string | null | undefined;
    confidenceScore?: number | null | undefined;
}>;
export type AIMessage = z.infer<typeof aiMessageSchema>;
export declare const aiConversationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    lastMessageAt: z.ZodString;
    messageCount: z.ZodDefault<z.ZodNumber>;
    convertedThreadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    courseId: string | null;
    title: string;
    lastMessageAt: string;
    messageCount: number;
    convertedThreadId?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    userId: string;
    courseId: string | null;
    title: string;
    lastMessageAt: string;
    messageCount?: number | undefined;
    convertedThreadId?: string | null | undefined;
}>;
export type AIConversation = z.infer<typeof aiConversationSchema>;
export declare const createConversationBodySchema: z.ZodObject<{
    userId: z.ZodString;
    courseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    title: string;
    courseId?: string | null | undefined;
}, {
    userId: string;
    title: string;
    courseId?: string | null | undefined;
}>;
export declare const sendMessageBodySchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: "user" | "assistant" | "system";
    userId: string;
    content: string;
}, {
    role: "user" | "assistant" | "system";
    userId: string;
    content: string;
}>;
export declare const convertToThreadBodySchema: z.ZodObject<{
    userId: z.ZodString;
    courseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    courseId: string;
}, {
    userId: string;
    courseId: string;
}>;
export declare const getUserIdParamsSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const getConversationIdParamsSchema: z.ZodObject<{
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
}, {
    conversationId: string;
}>;
export declare const listConversationsResponseSchema: z.ZodObject<{
    conversations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        lastMessageAt: z.ZodString;
        messageCount: z.ZodDefault<z.ZodNumber>;
        convertedThreadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        userId: string;
        courseId: string | null;
        title: string;
        lastMessageAt: string;
        messageCount: number;
        convertedThreadId?: string | null | undefined;
    }, {
        id: string;
        createdAt: string;
        userId: string;
        courseId: string | null;
        title: string;
        lastMessageAt: string;
        messageCount?: number | undefined;
        convertedThreadId?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    conversations: {
        id: string;
        createdAt: string;
        userId: string;
        courseId: string | null;
        title: string;
        lastMessageAt: string;
        messageCount: number;
        convertedThreadId?: string | null | undefined;
    }[];
}, {
    conversations: {
        id: string;
        createdAt: string;
        userId: string;
        courseId: string | null;
        title: string;
        lastMessageAt: string;
        messageCount?: number | undefined;
        convertedThreadId?: string | null | undefined;
    }[];
}>;
export declare const createConversationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    lastMessageAt: z.ZodString;
    messageCount: z.ZodDefault<z.ZodNumber>;
    convertedThreadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    courseId: string | null;
    title: string;
    lastMessageAt: string;
    messageCount: number;
    convertedThreadId?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    userId: string;
    courseId: string | null;
    title: string;
    lastMessageAt: string;
    messageCount?: number | undefined;
    convertedThreadId?: string | null | undefined;
}>;
export declare const listMessagesResponseSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        materialReferences: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        confidenceScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }[];
}, {
    messages: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }[];
}>;
export declare const sendMessageResponseSchema: z.ZodObject<{
    userMessage: z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        materialReferences: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        confidenceScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }>;
    aiMessage: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        materialReferences: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        confidenceScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }, {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userMessage: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    };
    aiMessage: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    } | null;
}, {
    userMessage: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    };
    aiMessage: {
        id: string;
        role: "user" | "assistant" | "system";
        createdAt: string;
        content: string;
        conversationId: string;
        materialReferences?: string | null | undefined;
        confidenceScore?: number | null | undefined;
    } | null;
}>;
export declare const convertToThreadResponseSchema: z.ZodObject<{
    threadId: z.ZodString;
    aiAnswerId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    aiAnswerId: string | null;
    threadId: string;
}, {
    aiAnswerId: string | null;
    threadId: string;
}>;
//# sourceMappingURL=conversations.schema.d.ts.map
import { z } from "zod";
export declare const notificationTypeSchema: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type Notification = z.infer<typeof notificationSchema>;
export declare const getUserIdParamsSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const getNotificationIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const getNotificationsQuerySchema: z.ZodObject<{
    unreadOnly: z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>;
    limit: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    unreadOnly: boolean;
}, {
    limit?: string | undefined;
    unreadOnly?: string | undefined;
}>;
export declare const listNotificationsResponseSchema: z.ZodObject<{
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
        title: z.ZodString;
        message: z.ZodString;
        threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        read: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
        title: z.ZodString;
        message: z.ZodString;
        threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        read: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
        title: z.ZodString;
        message: z.ZodString;
        threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        read: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    unreadCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    notifications: z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
        title: z.ZodString;
        message: z.ZodString;
        threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        read: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
    unreadCount: number;
}, {
    notifications: z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
        title: z.ZodString;
        message: z.ZodString;
        threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        read: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
    unreadCount: number;
}>;
export declare const markReadResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["thread_reply", "ai_answer", "endorsement", "mention", "new_thread", "endorsed", "ai_answer_ready"]>;
    title: z.ZodString;
    message: z.ZodString;
    threadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    postId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    read: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=notifications.schema.d.ts.map
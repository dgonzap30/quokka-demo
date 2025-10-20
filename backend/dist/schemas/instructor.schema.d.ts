import { z } from "zod";
export declare const responseTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type ResponseTemplate = z.infer<typeof responseTemplateSchema>;
export declare const createResponseTemplateBodySchema: z.ZodObject<{
    userId: z.ZodString;
    courseId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    courseId: string;
    title: string;
    content: string;
    tags: string[];
}, {
    userId: string;
    courseId: string;
    title: string;
    content: string;
    tags?: string[] | undefined;
}>;
export declare const getUserIdParamsSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const getTemplateIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const listResponseTemplatesResponseSchema: z.ZodObject<{
    templates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usageCount: z.ZodDefault<z.ZodNumber>;
        lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usageCount: z.ZodDefault<z.ZodNumber>;
        lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usageCount: z.ZodDefault<z.ZodNumber>;
        lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    templates: z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usageCount: z.ZodDefault<z.ZodNumber>;
        lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    templates: z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        content: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usageCount: z.ZodDefault<z.ZodNumber>;
        lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
}>;
export declare const createResponseTemplateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=instructor.schema.d.ts.map
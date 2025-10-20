import { z } from "zod";
export declare const confidenceLevelSchema: z.ZodEnum<["high", "medium", "low"]>;
export declare const aiAnswerCitationSchema: z.ZodObject<{
    id: z.ZodString;
    aiAnswerId: z.ZodString;
    materialId: z.ZodString;
    excerpt: z.ZodString;
    relevanceScore: z.ZodNumber;
    citationNumber: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    aiAnswerId: string;
    materialId: string;
    excerpt: string;
    relevanceScore: number;
    citationNumber: number;
}, {
    id: string;
    aiAnswerId: string;
    materialId: string;
    excerpt: string;
    relevanceScore: number;
    citationNumber: number;
}>;
export type AIAnswerCitation = z.infer<typeof aiAnswerCitationSchema>;
export declare const aiAnswerEndorsementSchema: z.ZodObject<{
    id: z.ZodString;
    aiAnswerId: z.ZodString;
    userId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    aiAnswerId: string;
}, {
    id: string;
    createdAt: string;
    userId: string;
    aiAnswerId: string;
}>;
export type AIAnswerEndorsement = z.infer<typeof aiAnswerEndorsementSchema>;
export declare const aiAnswerSchema: z.ZodObject<{
    id: z.ZodString;
    threadId: z.ZodString;
    courseId: z.ZodString;
    content: z.ZodString;
    confidenceLevel: z.ZodEnum<["high", "medium", "low"]>;
    routing: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endorsementCount: z.ZodDefault<z.ZodNumber>;
    generatedAt: z.ZodString;
    citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        aiAnswerId: z.ZodString;
        materialId: z.ZodString;
        excerpt: z.ZodString;
        relevanceScore: z.ZodNumber;
        citationNumber: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }, {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }>, "many">>;
    endorsedBy: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    totalEndorsements: z.ZodDefault<z.ZodNumber>;
    instructorEndorsements: z.ZodDefault<z.ZodNumber>;
    studentEndorsements: z.ZodDefault<z.ZodNumber>;
    instructorEndorsed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    courseId: string;
    content: string;
    endorsementCount: number;
    threadId: string;
    confidenceLevel: "high" | "medium" | "low";
    generatedAt: string;
    citations: {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }[];
    endorsedBy: string[];
    totalEndorsements: number;
    instructorEndorsements: number;
    studentEndorsements: number;
    instructorEndorsed: boolean;
    routing?: string | null | undefined;
}, {
    id: string;
    courseId: string;
    content: string;
    threadId: string;
    confidenceLevel: "high" | "medium" | "low";
    generatedAt: string;
    endorsementCount?: number | undefined;
    routing?: string | null | undefined;
    citations?: {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }[] | undefined;
    endorsedBy?: string[] | undefined;
    totalEndorsements?: number | undefined;
    instructorEndorsements?: number | undefined;
    studentEndorsements?: number | undefined;
    instructorEndorsed?: boolean | undefined;
}>;
export type AIAnswer = z.infer<typeof aiAnswerSchema>;
export declare const endorseAIAnswerBodySchema: z.ZodObject<{
    userId: z.ZodString;
    isInstructor: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    isInstructor: boolean;
}, {
    userId: string;
    isInstructor?: boolean | undefined;
}>;
export declare const bulkEndorseAIAnswersBodySchema: z.ZodObject<{
    aiAnswerIds: z.ZodArray<z.ZodString, "many">;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    aiAnswerIds: string[];
}, {
    userId: string;
    aiAnswerIds: string[];
}>;
export declare const bulkActionResultSchema: z.ZodObject<{
    actionType: z.ZodLiteral<"endorse">;
    successCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    errors: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        reason: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }, {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }>, "many">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    actionType: "endorse";
    successCount: number;
    failedCount: number;
    errors: {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }[];
}, {
    timestamp: string;
    actionType: "endorse";
    successCount: number;
    failedCount: number;
    errors: {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }[];
}>;
export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;
export declare const getThreadIdParamsSchema: z.ZodObject<{
    threadId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    threadId: string;
}, {
    threadId: string;
}>;
export declare const getAIAnswerIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const getAIAnswerResponseSchema: z.ZodObject<{
    aiAnswer: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        threadId: z.ZodString;
        courseId: z.ZodString;
        content: z.ZodString;
        confidenceLevel: z.ZodEnum<["high", "medium", "low"]>;
        routing: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        endorsementCount: z.ZodDefault<z.ZodNumber>;
        generatedAt: z.ZodString;
        citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            aiAnswerId: z.ZodString;
            materialId: z.ZodString;
            excerpt: z.ZodString;
            relevanceScore: z.ZodNumber;
            citationNumber: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }, {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }>, "many">>;
        endorsedBy: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        totalEndorsements: z.ZodDefault<z.ZodNumber>;
        instructorEndorsements: z.ZodDefault<z.ZodNumber>;
        studentEndorsements: z.ZodDefault<z.ZodNumber>;
        instructorEndorsed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        courseId: string;
        content: string;
        endorsementCount: number;
        threadId: string;
        confidenceLevel: "high" | "medium" | "low";
        generatedAt: string;
        citations: {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }[];
        endorsedBy: string[];
        totalEndorsements: number;
        instructorEndorsements: number;
        studentEndorsements: number;
        instructorEndorsed: boolean;
        routing?: string | null | undefined;
    }, {
        id: string;
        courseId: string;
        content: string;
        threadId: string;
        confidenceLevel: "high" | "medium" | "low";
        generatedAt: string;
        endorsementCount?: number | undefined;
        routing?: string | null | undefined;
        citations?: {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }[] | undefined;
        endorsedBy?: string[] | undefined;
        totalEndorsements?: number | undefined;
        instructorEndorsements?: number | undefined;
        studentEndorsements?: number | undefined;
        instructorEndorsed?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    aiAnswer: {
        id: string;
        courseId: string;
        content: string;
        endorsementCount: number;
        threadId: string;
        confidenceLevel: "high" | "medium" | "low";
        generatedAt: string;
        citations: {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }[];
        endorsedBy: string[];
        totalEndorsements: number;
        instructorEndorsements: number;
        studentEndorsements: number;
        instructorEndorsed: boolean;
        routing?: string | null | undefined;
    } | null;
}, {
    aiAnswer: {
        id: string;
        courseId: string;
        content: string;
        threadId: string;
        confidenceLevel: "high" | "medium" | "low";
        generatedAt: string;
        endorsementCount?: number | undefined;
        routing?: string | null | undefined;
        citations?: {
            id: string;
            aiAnswerId: string;
            materialId: string;
            excerpt: string;
            relevanceScore: number;
            citationNumber: number;
        }[] | undefined;
        endorsedBy?: string[] | undefined;
        totalEndorsements?: number | undefined;
        instructorEndorsements?: number | undefined;
        studentEndorsements?: number | undefined;
        instructorEndorsed?: boolean | undefined;
    } | null;
}>;
export declare const endorseAIAnswerResponseSchema: z.ZodObject<{
    id: z.ZodString;
    threadId: z.ZodString;
    courseId: z.ZodString;
    content: z.ZodString;
    confidenceLevel: z.ZodEnum<["high", "medium", "low"]>;
    routing: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endorsementCount: z.ZodDefault<z.ZodNumber>;
    generatedAt: z.ZodString;
    citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        aiAnswerId: z.ZodString;
        materialId: z.ZodString;
        excerpt: z.ZodString;
        relevanceScore: z.ZodNumber;
        citationNumber: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }, {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }>, "many">>;
    endorsedBy: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    totalEndorsements: z.ZodDefault<z.ZodNumber>;
    instructorEndorsements: z.ZodDefault<z.ZodNumber>;
    studentEndorsements: z.ZodDefault<z.ZodNumber>;
    instructorEndorsed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    courseId: string;
    content: string;
    endorsementCount: number;
    threadId: string;
    confidenceLevel: "high" | "medium" | "low";
    generatedAt: string;
    citations: {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }[];
    endorsedBy: string[];
    totalEndorsements: number;
    instructorEndorsements: number;
    studentEndorsements: number;
    instructorEndorsed: boolean;
    routing?: string | null | undefined;
}, {
    id: string;
    courseId: string;
    content: string;
    threadId: string;
    confidenceLevel: "high" | "medium" | "low";
    generatedAt: string;
    endorsementCount?: number | undefined;
    routing?: string | null | undefined;
    citations?: {
        id: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }[] | undefined;
    endorsedBy?: string[] | undefined;
    totalEndorsements?: number | undefined;
    instructorEndorsements?: number | undefined;
    studentEndorsements?: number | undefined;
    instructorEndorsed?: boolean | undefined;
}>;
export declare const bulkEndorseResponseSchema: z.ZodObject<{
    actionType: z.ZodLiteral<"endorse">;
    successCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    errors: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        reason: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }, {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }>, "many">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    actionType: "endorse";
    successCount: number;
    failedCount: number;
    errors: {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }[];
}, {
    timestamp: string;
    actionType: "endorse";
    successCount: number;
    failedCount: number;
    errors: {
        itemId: string;
        reason: string;
        code?: string | undefined;
    }[];
}>;
//# sourceMappingURL=ai-answers.schema.d.ts.map
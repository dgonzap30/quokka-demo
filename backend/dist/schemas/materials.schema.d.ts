import { z } from "zod";
export declare const materialMetadataSchema: z.ZodObject<{
    week: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
    authorId: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    keywords: string[];
    date?: string | undefined;
    authorId?: string | undefined;
    url?: string | undefined;
    week?: number | undefined;
    topic?: string | undefined;
}, {
    date?: string | undefined;
    authorId?: string | undefined;
    url?: string | undefined;
    week?: number | undefined;
    topic?: string | undefined;
    keywords?: string[] | undefined;
}>;
export declare const materialTypeSchema: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
export declare const courseMaterialSchema: z.ZodObject<{
    id: z.ZodString;
    courseId: z.ZodString;
    title: z.ZodString;
    type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        week: z.ZodOptional<z.ZodNumber>;
        date: z.ZodOptional<z.ZodString>;
        authorId: z.ZodOptional<z.ZodString>;
        topic: z.ZodOptional<z.ZodString>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        keywords: string[];
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
    }, {
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
        keywords?: string[] | undefined;
    }>]>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    courseId: z.ZodString;
    title: z.ZodString;
    type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        week: z.ZodOptional<z.ZodNumber>;
        date: z.ZodOptional<z.ZodString>;
        authorId: z.ZodOptional<z.ZodString>;
        topic: z.ZodOptional<z.ZodString>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        keywords: string[];
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
    }, {
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
        keywords?: string[] | undefined;
    }>]>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    courseId: z.ZodString;
    title: z.ZodString;
    type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        week: z.ZodOptional<z.ZodNumber>;
        date: z.ZodOptional<z.ZodString>;
        authorId: z.ZodOptional<z.ZodString>;
        topic: z.ZodOptional<z.ZodString>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        keywords: string[];
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
    }, {
        date?: string | undefined;
        authorId?: string | undefined;
        url?: string | undefined;
        week?: number | undefined;
        topic?: string | undefined;
        keywords?: string[] | undefined;
    }>]>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type CourseMaterial = z.infer<typeof courseMaterialSchema>;
export type MaterialMetadata = z.infer<typeof materialMetadataSchema>;
export declare const getMaterialsQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook" | undefined;
}, {
    type?: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook" | undefined;
}>;
export declare const searchMaterialsBodySchema: z.ZodObject<{
    query: z.ZodString;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>, "many">>;
    limit: z.ZodDefault<z.ZodNumber>;
    minRelevance: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    minRelevance: number;
    types?: ("lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook")[] | undefined;
}, {
    query: string;
    types?: ("lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook")[] | undefined;
    limit?: number | undefined;
    minRelevance?: number | undefined;
}>;
export declare const courseMaterialSearchResultSchema: z.ZodObject<{
    material: z.ZodObject<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    relevanceScore: z.ZodNumber;
    matchedKeywords: z.ZodArray<z.ZodString, "many">;
    snippet: z.ZodString;
}, "strip", z.ZodTypeAny, {
    relevanceScore: number;
    material: {
        id: string;
        tenantId: string;
        createdAt: string;
        type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
        courseId: string;
        title: string;
        content: string;
        metadata?: string | {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        } | undefined;
        keywords?: string[] | undefined;
    } & {
        [k: string]: unknown;
    };
    matchedKeywords: string[];
    snippet: string;
}, {
    relevanceScore: number;
    material: {
        id: string;
        tenantId: string;
        createdAt: string;
        type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
        courseId: string;
        title: string;
        content: string;
        metadata?: string | {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        } | undefined;
        keywords?: string[] | undefined;
    } & {
        [k: string]: unknown;
    };
    matchedKeywords: string[];
    snippet: string;
}>;
export declare const listMaterialsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    items: z.objectOutputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    items: z.objectInputType<{
        id: z.ZodString;
        courseId: z.ZodString;
        title: z.ZodString;
        type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            week: z.ZodOptional<z.ZodNumber>;
            date: z.ZodOptional<z.ZodString>;
            authorId: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            keywords: string[];
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
        }, {
            date?: string | undefined;
            authorId?: string | undefined;
            url?: string | undefined;
            week?: number | undefined;
            topic?: string | undefined;
            keywords?: string[] | undefined;
        }>]>>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodString;
        tenantId: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
}>;
export declare const searchMaterialsResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        material: z.ZodObject<{
            id: z.ZodString;
            courseId: z.ZodString;
            title: z.ZodString;
            type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
            content: z.ZodString;
            metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                week: z.ZodOptional<z.ZodNumber>;
                date: z.ZodOptional<z.ZodString>;
                authorId: z.ZodOptional<z.ZodString>;
                topic: z.ZodOptional<z.ZodString>;
                keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                url: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                keywords: string[];
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
            }, {
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
                keywords?: string[] | undefined;
            }>]>>;
            keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            createdAt: z.ZodString;
            tenantId: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            courseId: z.ZodString;
            title: z.ZodString;
            type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
            content: z.ZodString;
            metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                week: z.ZodOptional<z.ZodNumber>;
                date: z.ZodOptional<z.ZodString>;
                authorId: z.ZodOptional<z.ZodString>;
                topic: z.ZodOptional<z.ZodString>;
                keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                url: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                keywords: string[];
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
            }, {
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
                keywords?: string[] | undefined;
            }>]>>;
            keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            createdAt: z.ZodString;
            tenantId: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            courseId: z.ZodString;
            title: z.ZodString;
            type: z.ZodEnum<["lecture", "slide", "reading", "video", "assignment", "lab", "textbook"]>;
            content: z.ZodString;
            metadata: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                week: z.ZodOptional<z.ZodNumber>;
                date: z.ZodOptional<z.ZodString>;
                authorId: z.ZodOptional<z.ZodString>;
                topic: z.ZodOptional<z.ZodString>;
                keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                url: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                keywords: string[];
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
            }, {
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
                keywords?: string[] | undefined;
            }>]>>;
            keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            createdAt: z.ZodString;
            tenantId: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
        relevanceScore: z.ZodNumber;
        matchedKeywords: z.ZodArray<z.ZodString, "many">;
        snippet: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        relevanceScore: number;
        material: {
            id: string;
            tenantId: string;
            createdAt: string;
            type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
            courseId: string;
            title: string;
            content: string;
            metadata?: string | {
                keywords: string[];
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
            } | undefined;
            keywords?: string[] | undefined;
        } & {
            [k: string]: unknown;
        };
        matchedKeywords: string[];
        snippet: string;
    }, {
        relevanceScore: number;
        material: {
            id: string;
            tenantId: string;
            createdAt: string;
            type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
            courseId: string;
            title: string;
            content: string;
            metadata?: string | {
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
                keywords?: string[] | undefined;
            } | undefined;
            keywords?: string[] | undefined;
        } & {
            [k: string]: unknown;
        };
        matchedKeywords: string[];
        snippet: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    results: {
        relevanceScore: number;
        material: {
            id: string;
            tenantId: string;
            createdAt: string;
            type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
            courseId: string;
            title: string;
            content: string;
            metadata?: string | {
                keywords: string[];
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
            } | undefined;
            keywords?: string[] | undefined;
        } & {
            [k: string]: unknown;
        };
        matchedKeywords: string[];
        snippet: string;
    }[];
}, {
    results: {
        relevanceScore: number;
        material: {
            id: string;
            tenantId: string;
            createdAt: string;
            type: "lecture" | "slide" | "reading" | "video" | "assignment" | "lab" | "textbook";
            courseId: string;
            title: string;
            content: string;
            metadata?: string | {
                date?: string | undefined;
                authorId?: string | undefined;
                url?: string | undefined;
                week?: number | undefined;
                topic?: string | undefined;
                keywords?: string[] | undefined;
            } | undefined;
            keywords?: string[] | undefined;
        } & {
            [k: string]: unknown;
        };
        matchedKeywords: string[];
        snippet: string;
    }[];
}>;
export declare const getCourseIdParamsSchema: z.ZodObject<{
    courseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    courseId: string;
}, {
    courseId: string;
}>;
//# sourceMappingURL=materials.schema.d.ts.map
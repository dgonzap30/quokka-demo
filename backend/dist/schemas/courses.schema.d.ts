import { z } from "zod";
export declare const courseSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    term: z.ZodString;
    description: z.ZodString;
    status: z.ZodString;
    enrollmentCount: z.ZodNumber;
    tenantId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenantId: string;
    createdAt: string;
    description: string;
    status: string;
    code: string;
    term: string;
    enrollmentCount: number;
}, {
    id: string;
    name: string;
    tenantId: string;
    createdAt: string;
    description: string;
    status: string;
    code: string;
    term: string;
    enrollmentCount: number;
}>;
export type CourseResponse = z.infer<typeof courseSchema>;
export declare const listCoursesResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        term: z.ZodString;
        description: z.ZodString;
        status: z.ZodString;
        enrollmentCount: z.ZodNumber;
        tenantId: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        tenantId: string;
        createdAt: string;
        description: string;
        status: string;
        code: string;
        term: string;
        enrollmentCount: number;
    }, {
        id: string;
        name: string;
        tenantId: string;
        createdAt: string;
        description: string;
        status: string;
        code: string;
        term: string;
        enrollmentCount: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        name: string;
        tenantId: string;
        createdAt: string;
        description: string;
        status: string;
        code: string;
        term: string;
        enrollmentCount: number;
    }[];
}, {
    items: {
        id: string;
        name: string;
        tenantId: string;
        createdAt: string;
        description: string;
        status: string;
        code: string;
        term: string;
        enrollmentCount: number;
    }[];
}>;
export type ListCoursesResponse = z.infer<typeof listCoursesResponseSchema>;
export declare const getCourseParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type GetCourseParams = z.infer<typeof getCourseParamsSchema>;
//# sourceMappingURL=courses.schema.d.ts.map
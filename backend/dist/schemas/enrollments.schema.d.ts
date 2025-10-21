import { z } from "zod";
export declare const enrollmentSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
export declare const enrollmentWithCourseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
    course: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        term: z.ZodString;
        description: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
    course: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        term: z.ZodString;
        description: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    enrolledAt: z.ZodString;
    tenantId: z.ZodString;
    course: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        term: z.ZodString;
        description: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }, {
        id: string;
        name: string;
        description: string;
        status: string;
        code: string;
        term: string;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
export type EnrollmentWithCourse = z.infer<typeof enrollmentWithCourseSchema>;
export declare const getEnrollmentsQuerySchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export type GetEnrollmentsQuery = z.infer<typeof getEnrollmentsQuerySchema>;
export declare const listEnrollmentsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        enrolledAt: z.ZodString;
        tenantId: z.ZodString;
        course: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            name: z.ZodString;
            term: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        enrolledAt: z.ZodString;
        tenantId: z.ZodString;
        course: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            name: z.ZodString;
            term: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        enrolledAt: z.ZodString;
        tenantId: z.ZodString;
        course: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            name: z.ZodString;
            term: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    items: z.objectOutputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        enrolledAt: z.ZodString;
        tenantId: z.ZodString;
        course: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            name: z.ZodString;
            term: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    items: z.objectInputType<{
        id: z.ZodString;
        userId: z.ZodString;
        courseId: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        enrolledAt: z.ZodString;
        tenantId: z.ZodString;
        course: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            name: z.ZodString;
            term: z.ZodString;
            description: z.ZodString;
            status: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }, {
            id: string;
            name: string;
            description: string;
            status: string;
            code: string;
            term: string;
        }>>;
    }, z.ZodTypeAny, "passthrough">[];
}>;
export type ListEnrollmentsResponse = z.infer<typeof listEnrollmentsResponseSchema>;
//# sourceMappingURL=enrollments.schema.d.ts.map
import { z } from "zod";
export const enrollmentSchema = z.object({
    id: z.string(),
    userId: z.string(),
    courseId: z.string(),
    role: z.enum(["student", "instructor", "ta"]),
    enrolledAt: z.string(),
    tenantId: z.string(),
}).passthrough();
export const enrollmentWithCourseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    courseId: z.string(),
    role: z.enum(["student", "instructor", "ta"]),
    enrolledAt: z.string(),
    tenantId: z.string(),
    course: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        term: z.string(),
        description: z.string(),
        status: z.string(),
    }).nullable(),
}).passthrough();
export const getEnrollmentsQuerySchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});
export const listEnrollmentsResponseSchema = z.object({
    items: z.array(enrollmentWithCourseSchema),
});
//# sourceMappingURL=enrollments.schema.js.map
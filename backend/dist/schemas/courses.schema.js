import { z } from "zod";
export const courseSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    term: z.string(),
    description: z.string(),
    status: z.string(),
    enrollmentCount: z.number(),
    tenantId: z.string(),
    createdAt: z.string(),
});
export const listCoursesResponseSchema = z.object({
    items: z.array(courseSchema),
});
export const getCourseParamsSchema = z.object({
    id: z.string().min(1, "Course ID is required"),
});
//# sourceMappingURL=courses.schema.js.map
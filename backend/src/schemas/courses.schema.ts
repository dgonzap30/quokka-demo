/**
 * Courses Schemas (Zod)
 *
 * Validation schemas for course endpoints
 */

import { z } from "zod";

/**
 * Course response schema
 */
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

export type CourseResponse = z.infer<typeof courseSchema>;

/**
 * List courses response
 */
export const listCoursesResponseSchema = z.object({
  items: z.array(courseSchema),
});

export type ListCoursesResponse = z.infer<typeof listCoursesResponseSchema>;

/**
 * Get course params
 */
export const getCourseParamsSchema = z.object({
  id: z.string().min(1, "Course ID is required"),
});

export type GetCourseParams = z.infer<typeof getCourseParamsSchema>;

/**
 * Enrollments Schemas
 *
 * Zod validation schemas for enrollment endpoints
 */

import { z } from "zod";
import { courseSchema } from "./courses.schema.js";

/**
 * Enrollment object schema
 */
export const enrollmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  role: z.enum(["student", "instructor", "ta"]),
  enrolledAt: z.string(),
  tenantId: z.string(),
}).passthrough();

export type Enrollment = z.infer<typeof enrollmentSchema>;

/**
 * Enrollment with course details
 */
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

export type EnrollmentWithCourse = z.infer<typeof enrollmentWithCourseSchema>;

/**
 * Query params for get enrollments
 */
export const getEnrollmentsQuerySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type GetEnrollmentsQuery = z.infer<typeof getEnrollmentsQuerySchema>;

/**
 * List enrollments response
 */
export const listEnrollmentsResponseSchema = z.object({
  items: z.array(enrollmentWithCourseSchema),
});

export type ListEnrollmentsResponse = z.infer<typeof listEnrollmentsResponseSchema>;

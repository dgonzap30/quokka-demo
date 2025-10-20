/**
 * Enrollments Repository
 *
 * Data access layer for enrollments table
 */

import { eq, and, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { enrollments, courses, type Enrollment, type NewEnrollment } from "../db/schema.js";
import { db } from "../db/client.js";

export class EnrollmentsRepository extends BaseRepository<
  typeof enrollments,
  Enrollment,
  NewEnrollment
> {
  constructor() {
    super(enrollments);
  }

  /**
   * Implement abstract method: ID equality check
   */
  protected idEquals(id: string): SQL {
    return eq(this.table.id, id);
  }

  /**
   * Implement abstract method: Field equality check
   */
  protected fieldEquals<K extends keyof typeof this.table>(
    field: K,
    value: any
  ): SQL {
    const column = this.table[field];
    // Type guard: ensure we have a column, not a method or undefined
    if (!column || typeof column === 'function') {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return eq(column as any, value);
  }

  /**
   * Find all enrollments for a user (with course details)
   */
  async findByUserId(userId: string) {
    const results = await db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        role: enrollments.role,
        enrolledAt: enrollments.enrolledAt,
        tenantId: enrollments.tenantId,
        // Include course details
        course: {
          id: courses.id,
          code: courses.code,
          name: courses.name,
          term: courses.term,
          description: courses.description,
          status: courses.status,
        },
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));

    return results;
  }

  /**
   * Find all enrollments for a course
   */
  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  }

  /**
   * Find specific enrollment by user and course
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const results = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Check if user is enrolled in course
   */
  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.findByUserAndCourse(userId, courseId);
    return !!enrollment;
  }
}

// Export singleton instance
export const enrollmentsRepository = new EnrollmentsRepository();

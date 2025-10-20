/**
 * Courses Repository
 *
 * Data access layer for courses table
 */

import { eq, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courses, type Course, type NewCourse } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

export class CoursesRepository extends BaseRepository<typeof courses, Course, NewCourse> {
  constructor() {
    super(courses);
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
  protected fieldEquals(field: string, value: any): SQL {
    return eq(this.table[field as keyof typeof this.table], value);
  }

  /**
   * Find all courses (active only by default)
   */
  async findAll(includeArchived: boolean = false): Promise<Course[]> {
    if (includeArchived) {
      return await db.select().from(courses);
    }

    return await db.select().from(courses).where(eq(courses.status, "active"));
  }

  /**
   * Find course by code
   */
  async findByCode(code: string): Promise<Course | null> {
    const results = await db.select().from(courses).where(eq(courses.code, code)).limit(1);

    return results[0] || null;
  }

  /**
   * Find course by ID (throws if not found)
   */
  async findByIdOrThrow(id: string): Promise<Course> {
    const course = await this.findById(id);

    if (!course) {
      throw new NotFoundError("Course");
    }

    return course;
  }
}

// Export singleton instance
export const coursesRepository = new CoursesRepository();

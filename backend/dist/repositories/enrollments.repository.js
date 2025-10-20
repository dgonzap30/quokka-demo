import { eq, and } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { enrollments, courses } from "../db/schema.js";
import { db } from "../db/client.js";
export class EnrollmentsRepository extends BaseRepository {
    constructor() {
        super(enrollments);
    }
    idEquals(id) {
        return eq(this.table.id, id);
    }
    fieldEquals(field, value) {
        const column = this.table[field];
        if (!column || typeof column === 'function') {
            throw new Error(`Invalid field: ${String(field)}`);
        }
        return eq(column, value);
    }
    async findByUserId(userId) {
        const results = await db
            .select({
            id: enrollments.id,
            userId: enrollments.userId,
            courseId: enrollments.courseId,
            role: enrollments.role,
            enrolledAt: enrollments.enrolledAt,
            tenantId: enrollments.tenantId,
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
    async findByCourseId(courseId) {
        return await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.courseId, courseId));
    }
    async findByUserAndCourse(userId, courseId) {
        const results = await db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
            .limit(1);
        return results[0] || null;
    }
    async isUserEnrolled(userId, courseId) {
        const enrollment = await this.findByUserAndCourse(userId, courseId);
        return !!enrollment;
    }
}
export const enrollmentsRepository = new EnrollmentsRepository();
//# sourceMappingURL=enrollments.repository.js.map
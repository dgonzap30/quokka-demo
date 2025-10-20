import { eq } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courses } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";
export class CoursesRepository extends BaseRepository {
    constructor() {
        super(courses);
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
    async findAll(includeArchived = false) {
        if (includeArchived) {
            return await db.select().from(courses);
        }
        return await db.select().from(courses).where(eq(courses.status, "active"));
    }
    async findByCode(code) {
        const results = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
        return results[0] || null;
    }
    async findByIdOrThrow(id) {
        const course = await this.findById(id);
        if (!course) {
            throw new NotFoundError("Course");
        }
        return course;
    }
}
export const coursesRepository = new CoursesRepository();
//# sourceMappingURL=courses.repository.js.map
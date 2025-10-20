import { eq } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { responseTemplates, } from "../db/schema.js";
import { db } from "../db/client.js";
export class InstructorRepository extends BaseRepository {
    constructor() {
        super(responseTemplates);
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
            .select()
            .from(responseTemplates)
            .where(eq(responseTemplates.userId, userId))
            .orderBy(responseTemplates.createdAt);
        return results.map((template) => ({
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
        }));
    }
    async deleteTemplate(id) {
        await db.delete(responseTemplates).where(eq(responseTemplates.id, id));
    }
}
export const instructorRepository = new InstructorRepository();
//# sourceMappingURL=instructor.repository.js.map
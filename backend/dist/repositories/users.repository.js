import { eq } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { users } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";
export class UsersRepository extends BaseRepository {
    constructor() {
        super(users);
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
    async findByEmail(email) {
        const results = await db
            .select()
            .from(this.table)
            .where(eq(this.table.email, email))
            .limit(1);
        return results[0] || null;
    }
    async findByIdOrThrow(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundError("User");
        }
        return user;
    }
    async findByRole(role) {
        const results = await db
            .select()
            .from(this.table)
            .where(eq(this.table.role, role));
        return results;
    }
    async findByTenant(tenantId) {
        const results = await db
            .select()
            .from(this.table)
            .where(eq(this.table.tenantId, tenantId));
        return results;
    }
}
export const usersRepository = new UsersRepository();
//# sourceMappingURL=users.repository.js.map
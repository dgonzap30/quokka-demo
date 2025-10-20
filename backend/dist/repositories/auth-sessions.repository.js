import { eq, lt, gt, and } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { authSessions } from "../db/schema.js";
import { db } from "../db/client.js";
export class AuthSessionsRepository extends BaseRepository {
    constructor() {
        super(authSessions);
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
    async findByToken(token) {
        const results = await db
            .select()
            .from(this.table)
            .where(eq(this.table.token, token))
            .limit(1);
        return results[0] || null;
    }
    async findValidSession(token) {
        const now = new Date().toISOString();
        const results = await db
            .select()
            .from(this.table)
            .where(and(eq(this.table.token, token), gt(this.table.expiresAt, now)))
            .limit(1);
        return results[0] || null;
    }
    async findByUserId(userId) {
        const results = await db
            .select()
            .from(this.table)
            .where(eq(this.table.userId, userId));
        return results;
    }
    async deleteByToken(token) {
        const result = await db
            .delete(this.table)
            .where(eq(this.table.token, token));
        return result.changes > 0;
    }
    async deleteByUserId(userId) {
        const result = await db
            .delete(this.table)
            .where(eq(this.table.userId, userId));
        return result.changes;
    }
    async deleteExpiredSessions() {
        const now = new Date().toISOString();
        const result = await db
            .delete(this.table)
            .where(lt(this.table.expiresAt, now));
        return result.changes;
    }
}
export const authSessionsRepository = new AuthSessionsRepository();
//# sourceMappingURL=auth-sessions.repository.js.map
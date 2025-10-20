import { eq, and, desc } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { notifications, } from "../db/schema.js";
import { db } from "../db/client.js";
export class NotificationsRepository extends BaseRepository {
    constructor() {
        super(notifications);
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
    async findByUserId(userId, unreadOnly = false, limit = 50) {
        const conditions = unreadOnly
            ? and(eq(notifications.userId, userId), eq(notifications.read, false))
            : eq(notifications.userId, userId);
        const results = await db
            .select()
            .from(notifications)
            .where(conditions)
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
        return results;
    }
    async countUnread(userId) {
        const results = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
        return results.length;
    }
    async markAsRead(id) {
        const [updated] = await db
            .update(notifications)
            .set({ read: true })
            .where(eq(notifications.id, id))
            .returning();
        return updated || null;
    }
    async markAllAsRead(userId) {
        await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    }
}
export const notificationsRepository = new NotificationsRepository();
//# sourceMappingURL=notifications.repository.js.map
import { asc, desc, and, or, gt, lt } from "drizzle-orm";
import { db } from "../db/client.js";
export class BaseRepository {
    table;
    constructor(table) {
        this.table = table;
    }
    async findById(id) {
        const results = await db
            .select()
            .from(this.table)
            .where(this.idEquals(id))
            .limit(1);
        return results[0] || null;
    }
    async findAll() {
        const results = await db.select().from(this.table);
        return results;
    }
    async create(data) {
        const results = await db.insert(this.table).values(data).returning();
        return results[0];
    }
    async update(id, data) {
        const results = await db
            .update(this.table)
            .set(data)
            .where(this.idEquals(id))
            .returning();
        return results[0] || null;
    }
    async delete(id) {
        const result = await db.delete(this.table).where(this.idEquals(id));
        return result.changes > 0;
    }
    async count(where) {
        const query = db.select().from(this.table);
        if (where) {
            query.where(where);
        }
        const results = await query;
        return results.length;
    }
    async paginate(options) {
        const { cursor, limit = 20, direction = "desc", where, orderByField = "createdAt", } = options;
        const safeLimit = Math.min(Math.max(1, limit), 100);
        let cursorData = null;
        if (cursor) {
            try {
                const decoded = Buffer.from(cursor, "base64").toString("utf-8");
                cursorData = JSON.parse(decoded);
            }
            catch {
                throw new Error("Invalid cursor format");
            }
        }
        let query = db.select().from(this.table);
        const conditions = [];
        if (where) {
            conditions.push(where);
        }
        if (cursorData) {
            const cursorCondition = direction === "desc"
                ? this.buildDescCursor(orderByField, cursorData)
                : this.buildAscCursor(orderByField, cursorData);
            conditions.push(cursorCondition);
        }
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const orderFn = direction === "desc" ? desc : asc;
        query = query
            .orderBy(orderFn(this.table[orderByField]))
            .orderBy(orderFn(this.table.id));
        query = query.limit(safeLimit + 1);
        const results = (await query);
        const hasMore = results.length > safeLimit;
        const data = hasMore ? results.slice(0, safeLimit) : results;
        let nextCursor;
        if (hasMore && data.length > 0) {
            const lastItem = data[data.length - 1];
            const cursorObj = {
                timestamp: lastItem[orderByField],
                id: lastItem.id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
        }
        return {
            data,
            pagination: {
                nextCursor,
                hasMore,
            },
        };
    }
    buildDescCursor(field, cursor) {
        return or(lt(this.table[field], cursor.timestamp), and(this.fieldEquals(field, cursor.timestamp), lt(this.table.id, cursor.id)));
    }
    buildAscCursor(field, cursor) {
        return or(gt(this.table[field], cursor.timestamp), and(this.fieldEquals(field, cursor.timestamp), gt(this.table.id, cursor.id)));
    }
}
//# sourceMappingURL=base.repository.js.map
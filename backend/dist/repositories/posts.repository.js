import { eq, and, sql } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { posts, users, postEndorsements } from "../db/schema.js";
import { db } from "../db/client.js";
export class PostsRepository extends BaseRepository {
    constructor() {
        super(posts);
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
    async findByThread(threadId, options = {}) {
        const limit = options.limit || 20;
        const cursor = options.cursor;
        let cursorData = null;
        if (cursor) {
            try {
                const decoded = Buffer.from(cursor, "base64").toString("utf-8");
                cursorData = JSON.parse(decoded);
            }
            catch (error) {
            }
        }
        let whereCondition;
        if (cursorData) {
            whereCondition = and(eq(posts.threadId, threadId), sql `(${posts.createdAt}, ${posts.id}) > (${cursorData.createdAt}, ${cursorData.id})`);
        }
        else {
            whereCondition = eq(posts.threadId, threadId);
        }
        const postResults = await db
            .select()
            .from(posts)
            .where(whereCondition)
            .orderBy(posts.createdAt, posts.id)
            .limit(limit + 1);
        const hasNextPage = postResults.length > limit;
        const postItems = hasNextPage ? postResults.slice(0, limit) : postResults;
        const results = await Promise.all(postItems.map(async (post) => {
            const authorResults = await db
                .select()
                .from(users)
                .where(eq(users.id, post.authorId))
                .limit(1);
            const author = authorResults[0];
            return {
                post,
                author,
            };
        }));
        let nextCursor = null;
        if (hasNextPage && postItems.length > 0) {
            const lastItem = postItems[postItems.length - 1];
            const cursorObj = {
                createdAt: lastItem.createdAt,
                id: lastItem.id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
        }
        const postsWithAuthor = results.map((row) => ({
            ...row.post,
            author: row.author,
        }));
        return {
            data: postsWithAuthor,
            pagination: {
                nextCursor: nextCursor || undefined,
                hasMore: hasNextPage,
            },
        };
    }
    async createPost(data) {
        const result = await db.insert(posts).values(data).returning();
        return result[0];
    }
    async addEndorsement(postId, userId) {
        try {
            await db.insert(postEndorsements).values({
                id: crypto.randomUUID(),
                postId,
                userId,
                createdAt: new Date().toISOString(),
                tenantId: "tenant-demo-001",
            });
            await db
                .update(posts)
                .set({ endorsementCount: sql `${posts.endorsementCount} + 1` })
                .where(eq(posts.id, postId));
            return true;
        }
        catch (error) {
            if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.message?.includes("UNIQUE")) {
                return false;
            }
            throw error;
        }
    }
    async removeEndorsement(postId, userId) {
        const result = await db
            .delete(postEndorsements)
            .where(and(eq(postEndorsements.postId, postId), eq(postEndorsements.userId, userId)));
        if (result.changes > 0) {
            await db
                .update(posts)
                .set({ endorsementCount: sql `${posts.endorsementCount} - 1` })
                .where(eq(posts.id, postId));
            return true;
        }
        return false;
    }
    async hasUserEndorsed(postId, userId) {
        const results = await db
            .select()
            .from(postEndorsements)
            .where(and(eq(postEndorsements.postId, postId), eq(postEndorsements.userId, userId)))
            .limit(1);
        return results.length > 0;
    }
}
export const postsRepository = new PostsRepository();
//# sourceMappingURL=posts.repository.js.map
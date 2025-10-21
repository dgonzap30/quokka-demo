import { eq, and, desc, sql } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { threads, users, threadUpvotes, posts, aiAnswers, } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";
export class ThreadsRepository extends BaseRepository {
    constructor() {
        super(threads);
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
    async findByCourse(courseId, options = {}) {
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
            whereCondition = and(eq(threads.courseId, courseId), sql `(${threads.createdAt}, ${threads.id}) < (${cursorData.createdAt}, ${cursorData.id})`);
        }
        else {
            whereCondition = eq(threads.courseId, courseId);
        }
        const threadResults = await db
            .select()
            .from(threads)
            .where(whereCondition)
            .orderBy(desc(threads.createdAt), desc(threads.id))
            .limit(limit + 1);
        const hasNextPage = threadResults.length > limit;
        const threadItems = hasNextPage ? threadResults.slice(0, limit) : threadResults;
        const results = await Promise.all(threadItems.map(async (thread) => {
            const authorResults = await db
                .select()
                .from(users)
                .where(eq(users.id, thread.authorId))
                .limit(1);
            const author = authorResults[0];
            const upvoteResults = await db
                .select({ count: sql `COUNT(*)`.mapWith(Number) })
                .from(threadUpvotes)
                .where(eq(threadUpvotes.threadId, thread.id));
            const upvoteCount = upvoteResults[0]?.count || 0;
            const postResults = await db
                .select({ count: sql `COUNT(*)`.mapWith(Number) })
                .from(posts)
                .where(eq(posts.threadId, thread.id));
            const postCount = postResults[0]?.count || 0;
            const aiResults = await db
                .select({ count: sql `COUNT(*)`.mapWith(Number) })
                .from(aiAnswers)
                .where(eq(aiAnswers.threadId, thread.id));
            const hasAiAnswer = (aiResults[0]?.count || 0) > 0;
            return {
                thread,
                author,
                upvoteCount,
                postCount,
                hasAiAnswer,
            };
        }));
        let nextCursor = null;
        if (hasNextPage && threadItems.length > 0) {
            const lastItem = threadItems[threadItems.length - 1];
            const cursorObj = {
                createdAt: lastItem.createdAt,
                id: lastItem.id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
        }
        const threadsWithAuthor = results.map((row) => {
            const threadAny = row.thread;
            const views = threadAny.viewCount ?? threadAny.view_count ?? 0;
            const { viewCount, replyCount, hasAIAnswer, view_count, reply_count, has_ai_answer, ...threadFields } = threadAny;
            return {
                ...threadFields,
                views,
                author: row.author,
                upvoteCount: row.upvoteCount,
                postCount: row.postCount,
                hasAiAnswer: row.hasAiAnswer,
            };
        });
        return {
            data: threadsWithAuthor,
            pagination: {
                nextCursor: nextCursor || undefined,
                hasMore: hasNextPage,
            },
        };
    }
    async findByIdWithDetails(id) {
        const threadResults = await db.select().from(threads).where(eq(threads.id, id)).limit(1);
        if (threadResults.length === 0) {
            return null;
        }
        const thread = threadResults[0];
        const authorResults = await db
            .select()
            .from(users)
            .where(eq(users.id, thread.authorId))
            .limit(1);
        const author = authorResults[0];
        const upvoteResults = await db
            .select({ count: sql `COUNT(*)`.mapWith(Number) })
            .from(threadUpvotes)
            .where(eq(threadUpvotes.threadId, thread.id));
        const upvoteCount = upvoteResults[0]?.count || 0;
        const postResults = await db
            .select({ count: sql `COUNT(*)`.mapWith(Number) })
            .from(posts)
            .where(eq(posts.threadId, thread.id));
        const postCount = postResults[0]?.count || 0;
        const aiResults = await db
            .select({ count: sql `COUNT(*)`.mapWith(Number) })
            .from(aiAnswers)
            .where(eq(aiAnswers.threadId, thread.id));
        const hasAiAnswer = (aiResults[0]?.count || 0) > 0;
        const threadAny = thread;
        const views = threadAny.viewCount ?? threadAny.view_count ?? 0;
        const { viewCount, replyCount, hasAIAnswer, view_count, reply_count, has_ai_answer, ...threadFields } = threadAny;
        return {
            ...threadFields,
            views,
            author,
            upvoteCount,
            postCount,
            hasAiAnswer,
        };
    }
    async findByIdOrThrow(id) {
        const thread = await this.findByIdWithDetails(id);
        if (!thread) {
            throw new NotFoundError("Thread");
        }
        return thread;
    }
    async createThread(data) {
        const result = await db.insert(threads).values(data).returning();
        return result[0];
    }
    async addUpvote(threadId, userId, tenantId) {
        try {
            await db.insert(threadUpvotes).values({
                id: crypto.randomUUID(),
                threadId,
                userId,
                tenantId,
                createdAt: new Date(),
            });
            return true;
        }
        catch (error) {
            const err = error;
            if (err.code === "23505" || err.message?.includes("unique")) {
                return false;
            }
            throw error;
        }
    }
    async removeUpvote(threadId, userId) {
        const result = await db
            .delete(threadUpvotes)
            .where(and(eq(threadUpvotes.threadId, threadId), eq(threadUpvotes.userId, userId)))
            .returning({ id: threadUpvotes.id });
        return result.length > 0;
    }
    async hasUserUpvoted(threadId, userId) {
        const results = await db
            .select()
            .from(threadUpvotes)
            .where(and(eq(threadUpvotes.threadId, threadId), eq(threadUpvotes.userId, userId)))
            .limit(1);
        return results.length > 0;
    }
    async updateStatus(id, status) {
        const result = await db
            .update(threads)
            .set({ status, updatedAt: new Date() })
            .where(eq(threads.id, id))
            .returning();
        return result[0] || null;
    }
    async incrementViews(id) {
        await db
            .update(threads)
            .set({ viewCount: sql `${threads.viewCount} + 1` })
            .where(eq(threads.id, id));
    }
}
export const threadsRepository = new ThreadsRepository();
//# sourceMappingURL=threads.repository.js.map
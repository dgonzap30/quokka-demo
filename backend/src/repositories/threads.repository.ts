/**
 * Threads Repository
 *
 * Data access layer for threads table
 * Handles thread CRUD, upvotes, and rich queries with joins
 */

import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { BaseRepository, type PaginationOptions, type PaginatedResult } from "./base.repository.js";
import {
  threads,
  users,
  threadUpvotes,
  posts,
  aiAnswers,
  type Thread,
  type NewThread,
} from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

/**
 * Thread with author details
 */
export interface ThreadWithAuthor extends Thread {
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
  upvoteCount: number;
  postCount: number;
  hasAiAnswer: boolean;
}

export class ThreadsRepository extends BaseRepository<typeof threads, Thread, NewThread> {
  constructor() {
    super(threads);
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
   * Find threads by course ID with pagination
   * Returns threads with author details, upvote count, post count
   */
  async findByCourse(
    courseId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ThreadWithAuthor>> {
    const limit = options.limit || 20;
    const cursor = options.cursor;

    // Parse cursor if provided
    let cursorData: { createdAt: string; id: string } | null = null;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64").toString("utf-8");
        cursorData = JSON.parse(decoded);
      } catch (error) {
        // Invalid cursor, ignore
      }
    }

    // Build where condition
    let whereCondition: SQL;
    if (cursorData) {
      whereCondition = and(
        eq(threads.courseId, courseId),
        sql`(${threads.createdAt}, ${threads.id}) < (${cursorData.createdAt}, ${cursorData.id})`
      )!;
    } else {
      whereCondition = eq(threads.courseId, courseId);
    }

    // Fetch threads first
    const threadResults = await db
      .select()
      .from(threads)
      .where(whereCondition)
      .orderBy(desc(threads.createdAt), desc(threads.id))
      .limit(limit + 1); // Fetch one extra to check for next page

    // Check if there are more results
    const hasNextPage = threadResults.length > limit;
    const threadItems = hasNextPage ? threadResults.slice(0, limit) : threadResults;

    // For each thread, fetch author and counts
    const results = await Promise.all(
      threadItems.map(async (thread) => {
        // Fetch author
        const authorResults = await db
          .select()
          .from(users)
          .where(eq(users.id, thread.authorId))
          .limit(1);
        const author = authorResults[0];

        // Count upvotes
        const upvoteResults = await db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(threadUpvotes)
          .where(eq(threadUpvotes.threadId, thread.id));
        const upvoteCount = upvoteResults[0]?.count || 0;

        // Count posts
        const postResults = await db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
          .from(posts)
          .where(eq(posts.threadId, thread.id));
        const postCount = postResults[0]?.count || 0;

        // Check for AI answer
        const aiResults = await db
          .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
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
      })
    );

    // Generate next cursor
    let nextCursor: string | null = null;
    if (hasNextPage && threadItems.length > 0) {
      const lastItem = threadItems[threadItems.length - 1];
      const cursorObj = {
        createdAt: lastItem.createdAt,
        id: lastItem.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
    }

    // Transform results
    const threadsWithAuthor: ThreadWithAuthor[] = results.map((row) => ({
      id: row.thread.id,
      courseId: row.thread.courseId,
      authorId: row.thread.authorId, // Keep as authorId for frontend compatibility
      title: row.thread.title,
      content: row.thread.content,
      status: row.thread.status,
      views: row.thread.viewCount, // Map viewCount -> views for API response
      createdAt: row.thread.createdAt,
      updatedAt: row.thread.updatedAt,
      author: row.author,
      upvoteCount: row.upvoteCount,
      postCount: row.postCount,
      hasAiAnswer: row.hasAiAnswer,
    }));

    return {
      items: threadsWithAuthor,
      nextCursor,
      hasNextPage,
    };
  }

  /**
   * Find thread by ID with full details
   * Includes author, upvote count, post count, AI answer status
   */
  async findByIdWithDetails(id: string): Promise<ThreadWithAuthor | null> {
    // Fetch thread
    const threadResults = await db.select().from(threads).where(eq(threads.id, id)).limit(1);

    if (threadResults.length === 0) {
      return null;
    }

    const thread = threadResults[0];

    // Fetch author
    const authorResults = await db
      .select()
      .from(users)
      .where(eq(users.id, thread.authorId))
      .limit(1);
    const author = authorResults[0];

    // Count upvotes
    const upvoteResults = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(threadUpvotes)
      .where(eq(threadUpvotes.threadId, thread.id));
    const upvoteCount = upvoteResults[0]?.count || 0;

    // Count posts
    const postResults = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(posts)
      .where(eq(posts.threadId, thread.id));
    const postCount = postResults[0]?.count || 0;

    // Check for AI answer
    const aiResults = await db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(aiAnswers)
      .where(eq(aiAnswers.threadId, thread.id));
    const hasAiAnswer = (aiResults[0]?.count || 0) > 0;

    return {
      id: thread.id,
      courseId: thread.courseId,
      authorId: thread.authorId, // Keep as authorId for frontend compatibility
      title: thread.title,
      content: thread.content,
      status: thread.status,
      views: thread.viewCount, // Map viewCount -> views for API response
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      author,
      upvoteCount,
      postCount,
      hasAiAnswer,
    };
  }

  /**
   * Find thread by ID (throws if not found)
   */
  async findByIdOrThrow(id: string): Promise<ThreadWithAuthor> {
    const thread = await this.findByIdWithDetails(id);

    if (!thread) {
      throw new NotFoundError("Thread");
    }

    return thread;
  }

  /**
   * Create new thread
   */
  async createThread(data: NewThread): Promise<Thread> {
    const result = await db.insert(threads).values(data).returning();
    return result[0];
  }

  /**
   * Add upvote to thread
   * Returns true if upvote was added, false if already existed
   */
  async addUpvote(threadId: string, userId: string, tenantId: string): Promise<boolean> {
    try {
      await db.insert(threadUpvotes).values({
        id: crypto.randomUUID(),
        threadId,
        userId,
        tenantId,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (error: any) {
      // Check if it's a unique constraint violation (already upvoted)
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.message?.includes("UNIQUE")) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove upvote from thread
   * Returns true if upvote was removed, false if didn't exist
   */
  async removeUpvote(threadId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(threadUpvotes)
      .where(and(eq(threadUpvotes.threadId, threadId), eq(threadUpvotes.userId, userId))!);

    return result.changes > 0;
  }

  /**
   * Check if user has upvoted thread
   */
  async hasUserUpvoted(threadId: string, userId: string): Promise<boolean> {
    const results = await db
      .select()
      .from(threadUpvotes)
      .where(and(eq(threadUpvotes.threadId, threadId), eq(threadUpvotes.userId, userId))!)
      .limit(1);

    return results.length > 0;
  }

  /**
   * Update thread status (e.g., resolved, closed)
   */
  async updateStatus(id: string, status: string): Promise<Thread | null> {
    const result = await db
      .update(threads)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(threads.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await db
      .update(threads)
      .set({ viewCount: sql`${threads.viewCount} + 1` })
      .where(eq(threads.id, id));
  }
}

// Export singleton instance
export const threadsRepository = new ThreadsRepository();

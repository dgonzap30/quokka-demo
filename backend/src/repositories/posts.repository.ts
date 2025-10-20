/**
 * Posts Repository
 *
 * Data access layer for posts table
 * Handles post CRUD and endorsements
 */

import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { BaseRepository, type PaginationOptions, type PaginatedResult } from "./base.repository.js";
import { posts, users, postEndorsements, type Post, type NewPost } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

/**
 * Post with author details
 */
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export class PostsRepository extends BaseRepository<typeof posts, Post, NewPost> {
  constructor() {
    super(posts);
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
  protected fieldEquals<K extends keyof typeof this.table>(
    field: K,
    value: any
  ): SQL {
    const column = this.table[field];
    // Type guard: ensure we have a column, not a method or undefined
    if (!column || typeof column === 'function') {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return eq(column as any, value);
  }

  /**
   * Find posts by thread ID with pagination
   * Returns posts with author details
   */
  async findByThread(
    threadId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<PostWithAuthor>> {
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
        eq(posts.threadId, threadId),
        sql`(${posts.createdAt}, ${posts.id}) > (${cursorData.createdAt}, ${cursorData.id})`
      )!;
    } else {
      whereCondition = eq(posts.threadId, threadId);
    }

    // Fetch posts first (ordered by createdAt ASC for chronological display)
    const postResults = await db
      .select()
      .from(posts)
      .where(whereCondition)
      .orderBy(posts.createdAt, posts.id) // ASC order for chronological
      .limit(limit + 1);

    // Check if there are more results
    const hasNextPage = postResults.length > limit;
    const postItems = hasNextPage ? postResults.slice(0, limit) : postResults;

    // For each post, fetch author
    const results = await Promise.all(
      postItems.map(async (post) => {
        // Fetch author
        const authorResults = await db
          .select()
          .from(users)
          .where(eq(users.id as any, post.authorId))
          .limit(1);
        const author = authorResults[0];

        return {
          post,
          author,
        };
      })
    );

    // Generate next cursor
    let nextCursor: string | null = null;
    if (hasNextPage && postItems.length > 0) {
      const lastItem = postItems[postItems.length - 1];
      const cursorObj = {
        createdAt: lastItem.createdAt,
        id: lastItem.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
    }

    // Transform results
    const postsWithAuthor: PostWithAuthor[] = results.map((row) => ({
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

  /**
   * Create new post
   */
  async createPost(data: NewPost): Promise<Post> {
    const result = await db.insert(posts).values(data).returning();
    return result[0];
  }

  /**
   * Add endorsement to post
   * Returns true if endorsement was added, false if already existed
   */
  async addEndorsement(postId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(postEndorsements).values({
        id: crypto.randomUUID(),
        postId,
        userId,
        createdAt: new Date().toISOString(),
        tenantId: "tenant-demo-001",
      });

      // Increment endorsement count
      await db
        .update(posts)
        .set({ endorsementCount: sql`${posts.endorsementCount} + 1` })
        .where(eq(posts.id, postId));

      return true;
    } catch (error: unknown) {
      // Check if it's a unique constraint violation (already endorsed)
      const err = error as { code?: string; message?: string };
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE" || err.message?.includes("UNIQUE")) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove endorsement from post
   * Returns true if endorsement was removed, false if didn't exist
   */
  async removeEndorsement(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(postEndorsements)
      .where(and(eq(postEndorsements.postId, postId), eq(postEndorsements.userId, userId))!);

    if (result.changes > 0) {
      // Decrement endorsement count
      await db
        .update(posts)
        .set({ endorsementCount: sql`${posts.endorsementCount} - 1` })
        .where(eq(posts.id, postId));
      return true;
    }

    return false;
  }

  /**
   * Check if user has endorsed post
   */
  async hasUserEndorsed(postId: string, userId: string): Promise<boolean> {
    const results = await db
      .select()
      .from(postEndorsements)
      .where(and(eq(postEndorsements.postId, postId), eq(postEndorsements.userId, userId))!)
      .limit(1);

    return results.length > 0;
  }
}

// Export singleton instance
export const postsRepository = new PostsRepository();

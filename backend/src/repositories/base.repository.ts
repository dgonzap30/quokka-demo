/**
 * Base Repository
 *
 * Provides generic CRUD operations and cursor pagination for all repositories
 * Type-safe using Drizzle's table inference
 */

import type { SQL } from "drizzle-orm";
import { asc, desc, and, or, gt, lt } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "../db/client.js";

/**
 * Cursor pagination options
 */
export interface PaginationOptions {
  cursor?: string; // Base64-encoded opaque cursor
  limit?: number; // Default 20, max 100
  direction?: "asc" | "desc"; // Default "desc"
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

/**
 * Cursor structure (encoded as base64 JSON)
 */
interface Cursor {
  timestamp: string; // ISO 8601 timestamp
  id: string; // Entity ID
}

/**
 * Base Repository Class
 *
 * Provides CRUD operations and cursor pagination
 * Extend this class for domain-specific repositories
 */
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect = TTable["$inferSelect"],
  TInsert = TTable["$inferInsert"]
> {
  constructor(protected readonly table: TTable) {}

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TSelect | null> {
    const results = await db
      .select()
      .from(this.table)
      .where(this.idEquals(id))
      .limit(1);

    return (results[0] as TSelect) || null;
  }

  /**
   * Find all entities (no pagination)
   */
  async findAll(): Promise<TSelect[]> {
    const results = await db.select().from(this.table);
    return results as TSelect[];
  }

  /**
   * Create new entity
   */
  async create(data: TInsert): Promise<TSelect> {
    const results = await db.insert(this.table).values(data as any).returning();
    return results[0] as TSelect;
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const results = await db
      .update(this.table)
      .set(data as any)
      .where(this.idEquals(id))
      .returning();

    return (results[0] as TSelect) || null;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(this.table).where(this.idEquals(id)).returning({ id: (this.table as any).id });
    return result.length > 0;
  }

  /**
   * Count entities matching filter
   */
  async count(where?: SQL): Promise<number> {
    const query = db.select().from(this.table);

    if (where) {
      query.where(where);
    }

    const results = await query;
    return results.length;
  }

  /**
   * Cursor-based pagination
   *
   * Uses keyset pagination (createdAt, id) for efficient queries
   * Avoids OFFSET which scans all rows
   */
  protected async paginate(
    options: PaginationOptions & {
      where?: SQL;
      orderByField?: string; // Default "createdAt"
    }
  ): Promise<PaginatedResult<TSelect>> {
    const {
      cursor,
      limit = 20,
      direction = "desc",
      where,
      orderByField = "createdAt",
    } = options;

    // Validate and cap limit
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Decode cursor if provided
    let cursorData: Cursor | null = null;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64").toString("utf-8");
        cursorData = JSON.parse(decoded);
      } catch {
        throw new Error("Invalid cursor format");
      }
    }

    // Build query
    let query = db.select().from(this.table);

    // Apply where filter
    const conditions: SQL[] = [];
    if (where) {
      conditions.push(where);
    }

    // Apply cursor filter (keyset pagination)
    if (cursorData) {
      // For descending order: (createdAt, id) < (cursorTimestamp, cursorId)
      // For ascending order: (createdAt, id) > (cursorTimestamp, cursorId)
      const cursorCondition =
        direction === "desc"
          ? this.buildDescCursor(orderByField, cursorData)
          : this.buildAscCursor(orderByField, cursorData);

      conditions.push(cursorCondition);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    // Apply ordering (cast needed due to where() narrowing)
    const orderFn = direction === "desc" ? desc : asc;
    query = (query as any)
      .orderBy(orderFn(this.table[orderByField as keyof TTable] as any))
      .orderBy(orderFn((this.table as any).id));

    // Fetch limit + 1 to detect if there are more results
    query = (query as any).limit(safeLimit + 1);

    const results = (await query) as TSelect[];

    // Check if there are more results
    const hasMore = results.length > safeLimit;
    const data = hasMore ? results.slice(0, safeLimit) : results;

    // Generate next cursor if there are more results
    let nextCursor: string | undefined;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1] as any;
      const cursorObj: Cursor = {
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

  /**
   * Helper: Build descending cursor condition
   * (timestamp, id) < (cursorTimestamp, cursorId)
   */
  private buildDescCursor(field: string, cursor: Cursor): SQL {
    return or(
      lt(this.table[field as keyof TTable] as any, cursor.timestamp),
      and(
        this.fieldEquals(field as keyof TTable, cursor.timestamp),
        lt((this.table as any).id, cursor.id)
      )!
    )!;
  }

  /**
   * Helper: Build ascending cursor condition
   * (timestamp, id) > (cursorTimestamp, cursorId)
   */
  private buildAscCursor(field: string, cursor: Cursor): SQL {
    return or(
      gt(this.table[field as keyof TTable] as any, cursor.timestamp),
      and(
        this.fieldEquals(field as keyof TTable, cursor.timestamp),
        gt((this.table as any).id, cursor.id)
      )!
    )!;
  }

  /**
   * Helper: Create ID equality condition
   * Abstract method for type safety
   */
  protected abstract idEquals(id: string): SQL;

  /**
   * Helper: Create field equality condition
   * Generic K ensures field is a valid column name
   */
  protected abstract fieldEquals<K extends keyof TTable>(
    field: K,
    value: any
  ): SQL;
}

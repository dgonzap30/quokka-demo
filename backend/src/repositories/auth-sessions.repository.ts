/**
 * Auth Sessions Repository
 *
 * Data access layer for auth_sessions table
 * Manages user sessions (future: can migrate to Redis for production)
 */

import { eq, lt, gt, and, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { authSessions, type AuthSession, type NewAuthSession } from "../db/schema.js";
import { db } from "../db/client.js";

export class AuthSessionsRepository extends BaseRepository<
  typeof authSessions,
  AuthSession,
  NewAuthSession
> {
  constructor() {
    super(authSessions);
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
   * Find session by token
   */
  async findByToken(token: string): Promise<AuthSession | null> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.token, token))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find valid session by token (not expired)
   */
  async findValidSession(token: string): Promise<AuthSession | null> {
    const now = new Date().toISOString();

    const results = await db
      .select()
      .from(this.table)
      .where(and(eq(this.table.token, token), gt(this.table.expiresAt, now))!)
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string): Promise<AuthSession[]> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId));

    return results;
  }

  /**
   * Delete session by token
   */
  async deleteByToken(token: string): Promise<boolean> {
    const result = await db
      .delete(this.table)
      .where(eq(this.table.token, token));

    return result.changes > 0;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await db
      .delete(this.table)
      .where(eq(this.table.userId, userId));

    return result.changes;
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  async deleteExpiredSessions(): Promise<number> {
    const now = new Date().toISOString();

    const result = await db
      .delete(this.table)
      .where(lt(this.table.expiresAt, now));

    return result.changes;
  }
}

// Export singleton instance
export const authSessionsRepository = new AuthSessionsRepository();

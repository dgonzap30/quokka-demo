/**
 * Users Repository
 *
 * Data access layer for users table
 */

import { eq, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { users, type User, type NewUser } from "../db/schema.js";
import { db } from "../db/client.js";
import { NotFoundError } from "../utils/errors.js";

export class UsersRepository extends BaseRepository<typeof users, User, NewUser> {
  constructor() {
    super(users);
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
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.email, email))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find user by ID (throws if not found)
   */
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }

  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<User[]> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.role, role));

    return results;
  }

  /**
   * Find users by tenant ID
   */
  async findByTenant(tenantId: string): Promise<User[]> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.tenantId, tenantId));

    return results;
  }
}

// Export singleton instance
export const usersRepository = new UsersRepository();

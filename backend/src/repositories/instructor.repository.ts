/**
 * Instructor Repository
 *
 * Data access layer for response_templates table
 */

import { eq, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import {
  responseTemplates,
  type ResponseTemplate,
  type NewResponseTemplate,
} from "../db/schema.js";
import { db } from "../db/client.js";

export class InstructorRepository extends BaseRepository<
  typeof responseTemplates,
  ResponseTemplate,
  NewResponseTemplate
> {
  constructor() {
    super(responseTemplates);
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
   * Find all response templates for a user
   */
  async findByUserId(userId: string): Promise<ResponseTemplate[]> {
    const results = await db
      .select()
      .from(responseTemplates)
      .where(eq(responseTemplates.userId, userId))
      .orderBy(responseTemplates.createdAt);

    // Parse tags from JSON string
    return results.map((template) => ({
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
    }));
  }

  /**
   * Delete response template
   */
  async deleteTemplate(id: string): Promise<void> {
    await db.delete(responseTemplates).where(eq(responseTemplates.id, id));
  }
}

// Export singleton instance
export const instructorRepository = new InstructorRepository();

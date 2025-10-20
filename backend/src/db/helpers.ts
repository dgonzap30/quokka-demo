/**
 * UUID Helpers for SQLite/Postgres Compatibility
 *
 * SQLite stores UUIDs as TEXT, Postgres uses native UUID type.
 * These helpers abstract the difference via DATABASE_TYPE environment variable.
 *
 * For now, we use SQLite for local development. Postgres support will be added
 * when migrating to production.
 */

import { text } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";

/**
 * Primary key UUID column (auto-generated)
 * SQLite: TEXT with crypto.randomUUID() default
 */
export function uuidColumn(name: string) {
  return text(name).notNull().primaryKey().$defaultFn(() => randomUUID());
}

/**
 * UUID foreign key reference (NOT NULL)
 * SQLite: TEXT
 */
export function uuidRefNotNull(name: string) {
  return text(name).notNull();
}

/**
 * UUID foreign key reference (NULLABLE)
 * SQLite: TEXT
 */
export function uuidRef(name: string) {
  return text(name);
}

/**
 * Generate a new UUID (runtime helper)
 */
export function generateUuid(): string {
  return randomUUID();
}

/**
 * Validate UUID format (both SQLite and Postgres)
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

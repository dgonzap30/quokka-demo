/**
 * Database Client
 *
 * Initializes Drizzle ORM with SQLite (dev) or Postgres (prod)
 * CRITICAL: Enables foreign key constraints for SQLite
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "./dev.db";

// Initialize SQLite database
const sqlite = new Database(DATABASE_URL);

// CRITICAL: Enable foreign key constraints in SQLite
// Without this, foreign key cascades and validations will not work
sqlite.pragma("foreign_keys = ON");

// Enable Write-Ahead Logging (WAL) for better concurrency
sqlite.pragma("journal_mode = WAL");

// Create Drizzle instance with schema for type-safe queries
export const db = drizzle(sqlite, { schema });

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase(): void {
  sqlite.close();
}

/**
 * Health check: Verify database connection
 */
export function isDatabaseHealthy(): boolean {
  try {
    const result = sqlite.prepare("SELECT 1 as health").get() as { health: number };
    return result.health === 1;
  } catch {
    return false;
  }
}

/**
 * Database Client
 *
 * Initializes Drizzle ORM with Postgres
 * Supports local development via Docker and production via Railway/RDS
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quokka_demo";

// Initialize Postgres connection
const sql = postgres(DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle instance with schema for type-safe queries
export const db = drizzle(sql, { schema });

/**
 * Close database connection (for graceful shutdown)
 */
export async function closeDatabase(): Promise<void> {
  await sql.end();
}

/**
 * Health check: Verify database connection
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as health`;
    return result[0]?.health === 1;
  } catch {
    return false;
  }
}

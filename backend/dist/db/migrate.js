import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
const DATABASE_URL = process.env.DATABASE_URL || "./dev.db";
async function runMigrations() {
    console.log("🔄 Running database migrations...");
    const sqlite = new Database(DATABASE_URL);
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("✅ Migrations completed successfully");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
    finally {
        sqlite.close();
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quokka_demo";
async function runMigrations() {
    console.log("🔄 Running database migrations...");
    const sql = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(sql, { schema });
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("✅ Migrations completed successfully");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
    finally {
        await sql.end();
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map
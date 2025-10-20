import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
const DATABASE_URL = process.env.DATABASE_URL || "./dev.db";
const sqlite = new Database(DATABASE_URL);
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });
export function closeDatabase() {
    sqlite.close();
}
export function isDatabaseHealthy() {
    try {
        const result = sqlite.prepare("SELECT 1 as health").get();
        return result.health === 1;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=client.js.map
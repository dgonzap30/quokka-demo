import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quokka_demo";
const sql = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});
export const db = drizzle(sql, { schema });
export async function closeDatabase() {
    await sql.end();
}
export async function isDatabaseHealthy() {
    try {
        const result = await sql `SELECT 1 as health`;
        return result[0]?.health === 1;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=client.js.map
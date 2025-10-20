import * as schema from "./schema.js";
export declare const db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema>;
export declare function closeDatabase(): void;
export declare function isDatabaseHealthy(): boolean;
//# sourceMappingURL=client.d.ts.map
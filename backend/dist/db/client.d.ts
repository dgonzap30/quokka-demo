import * as schema from "./schema.js";
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema>;
export declare function closeDatabase(): Promise<void>;
export declare function isDatabaseHealthy(): Promise<boolean>;
//# sourceMappingURL=client.d.ts.map
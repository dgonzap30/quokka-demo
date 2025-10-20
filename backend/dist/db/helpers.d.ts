export declare function uuidColumn(name: string): import("drizzle-orm").HasRuntimeDefault<import("drizzle-orm").HasDefault<import("drizzle-orm").IsPrimaryKey<import("drizzle-orm").NotNull<import("drizzle-orm").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilderInitial<string, [string, ...string[]]>>>>>>;
export declare function uuidRefNotNull(name: string): import("drizzle-orm").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilderInitial<string, [string, ...string[]]>>;
export declare function uuidRef(name: string): import("drizzle-orm/sqlite-core").SQLiteTextBuilderInitial<string, [string, ...string[]]>;
export declare function generateUuid(): string;
export declare function isValidUuid(value: string): boolean;
//# sourceMappingURL=helpers.d.ts.map
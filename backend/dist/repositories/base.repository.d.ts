import type { SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
export interface PaginationOptions {
    cursor?: string;
    limit?: number;
    direction?: "asc" | "desc";
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        nextCursor?: string;
        hasMore: boolean;
    };
}
export declare abstract class BaseRepository<TTable extends PgTable, TSelect = TTable["$inferSelect"], TInsert = TTable["$inferInsert"]> {
    protected readonly table: TTable;
    constructor(table: TTable);
    findById(id: string): Promise<TSelect | null>;
    findAll(): Promise<TSelect[]>;
    create(data: TInsert): Promise<TSelect>;
    update(id: string, data: Partial<TInsert>): Promise<TSelect | null>;
    delete(id: string): Promise<boolean>;
    count(where?: SQL): Promise<number>;
    protected paginate(options: PaginationOptions & {
        where?: SQL;
        orderByField?: string;
    }): Promise<PaginatedResult<TSelect>>;
    private buildDescCursor;
    private buildAscCursor;
    protected abstract idEquals(id: string): SQL;
    protected abstract fieldEquals<K extends keyof TTable>(field: K, value: any): SQL;
}
//# sourceMappingURL=base.repository.d.ts.map
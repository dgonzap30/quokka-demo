import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { users, type User, type NewUser } from "../db/schema.js";
export declare class UsersRepository extends BaseRepository<typeof users, User, NewUser> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByEmail(email: string): Promise<User | null>;
    findByIdOrThrow(id: string): Promise<User>;
    findByRole(role: string): Promise<User[]>;
    findByTenant(tenantId: string): Promise<User[]>;
}
export declare const usersRepository: UsersRepository;
//# sourceMappingURL=users.repository.d.ts.map
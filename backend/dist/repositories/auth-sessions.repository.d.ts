import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { authSessions, type AuthSession, type NewAuthSession } from "../db/schema.js";
export declare class AuthSessionsRepository extends BaseRepository<typeof authSessions, AuthSession, NewAuthSession> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByToken(token: string): Promise<AuthSession | null>;
    findValidSession(token: string): Promise<AuthSession | null>;
    findByUserId(userId: string): Promise<AuthSession[]>;
    deleteByToken(token: string): Promise<boolean>;
    deleteByUserId(userId: string): Promise<number>;
    deleteExpiredSessions(): Promise<number>;
}
export declare const authSessionsRepository: AuthSessionsRepository;
//# sourceMappingURL=auth-sessions.repository.d.ts.map
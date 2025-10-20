import { type SQL } from "drizzle-orm";
import { BaseRepository, type PaginationOptions, type PaginatedResult } from "./base.repository.js";
import { threads, type Thread, type NewThread } from "../db/schema.js";
export interface ThreadWithAuthor extends Thread {
    author: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
    };
    upvoteCount: number;
    postCount: number;
    hasAiAnswer: boolean;
}
export declare class ThreadsRepository extends BaseRepository<typeof threads, Thread, NewThread> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByCourse(courseId: string, options?: PaginationOptions): Promise<PaginatedResult<ThreadWithAuthor>>;
    findByIdWithDetails(id: string): Promise<ThreadWithAuthor | null>;
    findByIdOrThrow(id: string): Promise<ThreadWithAuthor>;
    createThread(data: NewThread): Promise<Thread>;
    addUpvote(threadId: string, userId: string, tenantId: string): Promise<boolean>;
    removeUpvote(threadId: string, userId: string): Promise<boolean>;
    hasUserUpvoted(threadId: string, userId: string): Promise<boolean>;
    updateStatus(id: string, status: string): Promise<Thread | null>;
    incrementViews(id: string): Promise<void>;
}
export declare const threadsRepository: ThreadsRepository;
//# sourceMappingURL=threads.repository.d.ts.map
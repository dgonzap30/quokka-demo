import { type SQL } from "drizzle-orm";
import { BaseRepository, type PaginationOptions, type PaginatedResult } from "./base.repository.js";
import { posts, type Post, type NewPost } from "../db/schema.js";
export interface PostWithAuthor extends Post {
    author: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
    };
}
export declare class PostsRepository extends BaseRepository<typeof posts, Post, NewPost> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByThread(threadId: string, options?: PaginationOptions): Promise<PaginatedResult<PostWithAuthor>>;
    createPost(data: NewPost): Promise<Post>;
    addEndorsement(postId: string, userId: string): Promise<boolean>;
    removeEndorsement(postId: string, userId: string): Promise<boolean>;
    hasUserEndorsed(postId: string, userId: string): Promise<boolean>;
}
export declare const postsRepository: PostsRepository;
//# sourceMappingURL=posts.repository.d.ts.map
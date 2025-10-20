import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { aiConversations, type AIConversation, type NewAIConversation, type AIMessage, type NewAIMessage } from "../db/schema.js";
export declare class ConversationsRepository extends BaseRepository<typeof aiConversations, AIConversation, NewAIConversation> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByUserId(userId: string): Promise<AIConversation[]>;
    findMessages(conversationId: string): Promise<AIMessage[]>;
    createMessage(message: NewAIMessage): Promise<AIMessage>;
    deleteConversation(conversationId: string): Promise<void>;
    markAsConverted(conversationId: string, threadId: string): Promise<void>;
}
export declare const conversationsRepository: ConversationsRepository;
//# sourceMappingURL=conversations.repository.d.ts.map
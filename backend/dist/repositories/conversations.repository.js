import { eq, desc } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { aiConversations, aiMessages, } from "../db/schema.js";
import { db } from "../db/client.js";
export class ConversationsRepository extends BaseRepository {
    constructor() {
        super(aiConversations);
    }
    idEquals(id) {
        return eq(this.table.id, id);
    }
    fieldEquals(field, value) {
        const column = this.table[field];
        if (!column || typeof column === 'function') {
            throw new Error(`Invalid field: ${String(field)}`);
        }
        return eq(column, value);
    }
    async findByUserId(userId) {
        return db
            .select()
            .from(aiConversations)
            .where(eq(aiConversations.userId, userId))
            .orderBy(desc(aiConversations.lastMessageAt));
    }
    async findMessages(conversationId) {
        return db
            .select()
            .from(aiMessages)
            .where(eq(aiMessages.conversationId, conversationId))
            .orderBy(aiMessages.createdAt);
    }
    async createMessage(message) {
        const [created] = await db.insert(aiMessages).values(message).returning();
        const conversation = await this.findById(message.conversationId);
        if (conversation) {
            await db
                .update(aiConversations)
                .set({
                lastMessageAt: message.createdAt,
                messageCount: conversation.messageCount + 1,
            })
                .where(eq(aiConversations.id, message.conversationId));
        }
        return created;
    }
    async deleteConversation(conversationId) {
        await db
            .delete(aiMessages)
            .where(eq(aiMessages.conversationId, conversationId));
        await db.delete(aiConversations).where(eq(aiConversations.id, conversationId));
    }
    async markAsConverted(conversationId, threadId) {
        await db
            .update(aiConversations)
            .set({ convertedThreadId: threadId })
            .where(eq(aiConversations.id, conversationId));
    }
}
export const conversationsRepository = new ConversationsRepository();
//# sourceMappingURL=conversations.repository.js.map
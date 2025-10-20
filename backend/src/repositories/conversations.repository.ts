/**
 * Conversations Repository
 *
 * Data access layer for ai_conversations and ai_messages tables
 */

import { eq, desc, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import {
  aiConversations,
  aiMessages,
  type AIConversation,
  type NewAIConversation,
  type AIMessage,
  type NewAIMessage,
} from "../db/schema.js";
import { db } from "../db/client.js";

export class ConversationsRepository extends BaseRepository<
  typeof aiConversations,
  AIConversation,
  NewAIConversation
> {
  constructor() {
    super(aiConversations);
  }

  /**
   * Implement abstract method: ID equality check
   */
  protected idEquals(id: string): SQL {
    return eq(this.table.id, id);
  }

  /**
   * Implement abstract method: Field equality check
   */
  protected fieldEquals(field: string, value: any): SQL {
    return eq(this.table[field as keyof typeof this.table], value);
  }

  /**
   * Find all conversations for a user (sorted by most recent)
   */
  async findByUserId(userId: string): Promise<AIConversation[]> {
    return db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.lastMessageAt));
  }

  /**
   * Find messages for a conversation (chronological order)
   */
  async findMessages(conversationId: string): Promise<AIMessage[]> {
    return db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  /**
   * Create a message
   */
  async createMessage(message: NewAIMessage): Promise<AIMessage> {
    const [created] = await db.insert(aiMessages).values(message).returning();

    // Update conversation's lastMessageAt and messageCount
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

  /**
   * Delete conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    // Delete all messages first
    await db
      .delete(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId));

    // Delete conversation
    await db.delete(aiConversations).where(eq(aiConversations.id, conversationId));
  }

  /**
   * Mark conversation as converted to thread
   */
  async markAsConverted(conversationId: string, threadId: string): Promise<void> {
    await db
      .update(aiConversations)
      .set({ convertedThreadId: threadId })
      .where(eq(aiConversations.id, conversationId));
  }
}

// Export singleton instance
export const conversationsRepository = new ConversationsRepository();

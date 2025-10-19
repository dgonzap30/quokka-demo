// ============================================
// Conversations API Module
// ============================================
//
// Handles AI conversation creation, messaging, and management

import type {
  AIConversation,
  CreateConversationInput,
  AIMessage,
  SendMessageInput,
  Thread,
  AIAnswer,
} from "@/lib/models/types";

import {
  seedData,
  addConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  getConversationMessages as getMessagesFromStore,
  addMessage,
  addThread,
  updateThread,
  addAIAnswer,
} from "@/lib/store/localStore";

import { trackConversationCreated } from "@/lib/store/metrics";

import { delay, generateId } from "./utils";

/**
 * Simple fallback message when AI SDK is unavailable
 */
function generateSimpleFallbackMessage(): { content: string } {
  return {
    content:
      "I apologize, but I'm currently unable to process your request. The AI service may be temporarily unavailable. Please try again in a moment, or contact support if the issue persists.",
  };
}

/**
 * Conversations API methods
 */
export const conversationsAPI = {
  /**
   * Create a new AI conversation
   *
   * Creates a private conversation for the user, optionally scoped to a specific course.
   *
   * @param input - Conversation creation parameters
   * @returns Created conversation object
   *
   * @example
   * ```ts
   * // Course-specific conversation
   * const conv = await conversationsAPI.createConversation({
   *   userId: "user-123",
   *   courseId: "course-cs101",
   *   title: "Questions about Binary Search"
   * });
   *
   * // Multi-course conversation
   * const generalConv = await conversationsAPI.createConversation({
   *   userId: "user-123",
   *   courseId: null,
   *   title: "General Study Questions"
   * });
   * ```
   */
  async createConversation(
    input: CreateConversationInput
  ): Promise<AIConversation> {
    await delay(100 + Math.random() * 50); // 100-150ms
    seedData();

    const newConversation: AIConversation = {
      id: generateId("conv"),
      userId: input.userId,
      courseId: input.courseId || null,
      title: input.title || "New Conversation",
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addConversation(newConversation);

    // Track metrics
    trackConversationCreated();

    return newConversation;
  },

  /**
   * Get all conversations for a user
   *
   * Returns all AI conversations owned by the user, sorted by most recently updated first.
   *
   * @param userId - ID of the user
   * @returns Array of user's conversations
   *
   * @example
   * ```ts
   * const conversations = await conversationsAPI.getAIConversations("user-123");
   * // Returns: [
   * //   { id: "conv-1", title: "Binary Search Help", ... },
   * //   { id: "conv-2", title: "Graph Theory", ... }
   * // ]
   * ```
   */
  async getAIConversations(userId: string): Promise<AIConversation[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    return getUserConversations(userId);
  },

  /**
   * Get messages for a conversation
   *
   * Returns all messages in a conversation, ordered chronologically.
   *
   * @param conversationId - ID of the conversation
   * @returns Array of messages (user and assistant)
   *
   * @example
   * ```ts
   * const messages = await conversationsAPI.getConversationMessages("conv-123");
   * // Returns: [
   * //   { role: "user", content: "What is binary search?", ... },
   * //   { role: "assistant", content: "Binary search is...", ... }
   * // ]
   * ```
   */
  async getConversationMessages(conversationId: string): Promise<AIMessage[]> {
    await delay(100 + Math.random() * 100); // 100-200ms
    seedData();

    return getMessagesFromStore(conversationId);
  },

  /**
   * Send message in conversation (with AI SDK streaming)
   *
   * Sends a user message and generates an AI response using the AI SDK.
   * Falls back to a template system if AI SDK is unavailable.
   *
   * @param input - Message sending parameters
   * @returns Object containing both the user message and AI response
   *
   * @example
   * ```ts
   * const { userMessage, aiMessage } = await conversationsAPI.sendMessage({
   *   conversationId: "conv-123",
   *   content: "Explain binary search",
   *   userId: "user-456",
   *   role: "user"
   * });
   * ```
   */
  async sendMessage(input: SendMessageInput): Promise<{
    userMessage: AIMessage;
    aiMessage: AIMessage;
  }> {
    seedData();

    // Validate conversation exists
    const conversation = getConversationById(input.conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${input.conversationId}`);
    }

    // Create user message
    const userMessage: AIMessage = {
      id: generateId("msg"),
      conversationId: input.conversationId,
      role: "user",
      content: input.content,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);

    // Generate AI response using AI SDK route
    let aiContent = "";
    try {
      // Get conversation history for context
      const messages = getMessagesFromStore(input.conversationId);

      // Try AI SDK route first
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId: input.conversationId,
          userId: input.userId,
          courseId: conversation.courseId,
        }),
      });

      if (response.ok) {
        // Read streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let accumulatedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;
          }

          // Extract text from AI SDK stream format
          // AI SDK sends text chunks directly
          aiContent = accumulatedContent;

          console.log("[AI SDK] Response received via streaming");
        } else {
          throw new Error("No response body available");
        }
      } else {
        // API route returned error, fall back to template
        console.warn("[AI SDK] Route returned error, falling back to template");
        throw new Error("AI SDK route failed");
      }
    } catch (error) {
      console.error("[AI SDK] Failed to generate response:", error);

      // Fall back to simple error message
      console.warn("[AI] /api/chat failed, using simple fallback message");
      const { content } = generateSimpleFallbackMessage();
      aiContent = content;
    }

    // Create AI message
    const aiMessage: AIMessage = {
      id: generateId("msg"),
      conversationId: input.conversationId,
      role: "assistant",
      content: aiContent,
      timestamp: new Date().toISOString(),
    };

    addMessage(aiMessage);

    return { userMessage, aiMessage };
  },

  /**
   * Delete conversation and all messages
   *
   * Permanently deletes a conversation and all its messages.
   *
   * @param conversationId - ID of the conversation to delete
   *
   * @example
   * ```ts
   * await conversationsAPI.deleteAIConversation("conv-123");
   * ```
   */
  async deleteAIConversation(conversationId: string): Promise<void> {
    await delay(100); // Quick action
    seedData();

    deleteConversation(conversationId);
  },

  /**
   * Convert conversation to thread
   *
   * Converts a private AI conversation into a public discussion thread.
   * Preserves all messages and optionally creates an AI answer from the last assistant message.
   *
   * @param conversationId - ID of the conversation to convert
   * @param userId - ID of the user performing the conversion
   * @param courseId - ID of the course to create the thread in
   * @returns Object containing the created thread and optional AI answer
   *
   * @throws Error if conversation not found or empty
   *
   * @example
   * ```ts
   * const { thread, aiAnswer } = await conversationsAPI.convertConversationToThread(
   *   "conv-123",
   *   "user-456",
   *   "course-cs101"
   * );
   * // Creates public thread with all conversation messages
   * // Preserves last AI response as thread's AI answer
   * ```
   */
  async convertConversationToThread(
    conversationId: string,
    userId: string,
    courseId: string
  ): Promise<{ thread: Thread; aiAnswer: AIAnswer | null }> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    // Validate conversation exists
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Get all messages
    const messages = getMessagesFromStore(conversationId);
    if (messages.length === 0) {
      throw new Error("Cannot convert empty conversation to thread");
    }

    // Extract first user message as thread title
    const firstUserMessage = messages.find((m) => m.role === "user");
    const threadTitle = firstUserMessage
      ? firstUserMessage.content.substring(0, 100) +
        (firstUserMessage.content.length > 100 ? "..." : "")
      : conversation.title;

    // Combine all messages into thread content
    const threadContent = messages
      .map((msg) => {
        const role = msg.role === "user" ? "Student" : "AI Assistant";
        return `**${role}:** ${msg.content}`;
      })
      .join("\n\n---\n\n");

    // Create thread
    const newThread: Thread = {
      id: generateId("thread"),
      courseId,
      title: threadTitle,
      content: threadContent,
      authorId: userId,
      status: "open",
      tags: ["from-conversation"],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addThread(newThread);

    // Check if there's an AI response to preserve as AIAnswer
    const aiMessages = messages.filter((m) => m.role === "assistant");
    let aiAnswer: AIAnswer | null = null;

    if (aiMessages.length > 0) {
      // Use the last AI message as the thread's AI answer
      const lastAIMessage = aiMessages[aiMessages.length - 1];

      const aiAnswerData: AIAnswer = {
        id: generateId("ai"),
        threadId: newThread.id,
        courseId,
        content: lastAIMessage.content,
        confidenceLevel: "medium",
        confidenceScore: 65,
        citations: [],
        studentEndorsements: 0,
        instructorEndorsements: 0,
        totalEndorsements: 0,
        endorsedBy: [],
        instructorEndorsed: false,
        generatedAt: lastAIMessage.timestamp,
        updatedAt: new Date().toISOString(),
      };

      addAIAnswer(aiAnswerData);
      updateThread(newThread.id, {
        hasAIAnswer: true,
        aiAnswerId: aiAnswerData.id,
      });

      aiAnswer = aiAnswerData;
    }

    // Mark conversation as converted (optional: could add flag to conversation type)
    updateConversation(conversationId, {
      updatedAt: new Date().toISOString(),
    });

    return {
      thread: newThread,
      aiAnswer,
    };
  },
};

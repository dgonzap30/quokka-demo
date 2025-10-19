"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import { getConversationMessages, addMessage } from "@/lib/store/localStore";
import { toast } from "sonner";
import type { AIMessage } from "@/lib/models/types";

/**
 * Options for usePersistedChat hook
 */
export interface UsePersistedChatOptions {
  /** Conversation ID for persistence */
  conversationId: string | null;

  /** Course ID for context (sent in request body) */
  courseId?: string | null;

  /** User ID for context */
  userId: string;

  /** Optional callback when message is added */
  onMessageAdded?: (message: AIMessage) => void;

  /** Optional callback when streaming finishes */
  onStreamFinish?: () => void;
}

/**
 * Convert AIMessage (localStorage) to UIMessage (AI SDK format)
 */
function aiMessageToUIMessage(aiMessage: AIMessage): UIMessage {
  return {
    id: aiMessage.id,
    role: aiMessage.role,
    parts: [{ type: "text", text: aiMessage.content }],
  };
}

/**
 * Convert UIMessage (AI SDK format) to AIMessage (localStorage format)
 */
function uiMessageToAIMessage(
  message: UIMessage,
  conversationId: string
): AIMessage {
  // Extract text content from parts
  const textParts = message.parts.filter((p) => p.type === "text");
  const content = textParts.map((p) => ("text" in p ? p.text : "")).join("\n");

  // Only handle user and assistant roles for now
  if (message.role !== "user" && message.role !== "assistant") {
    throw new Error(`Unexpected message role: ${message.role}`);
  }

  return {
    id: message.id,
    conversationId,
    role: message.role,
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * usePersistedChat - AI SDK useChat wrapper with localStorage persistence
 *
 * Provides streaming chat functionality with localStorage synchronization
 * for conversation persistence across sessions.
 *
 * Key features:
 * - Loads initial messages from localStorage
 * - Auto-saves new messages after streaming completes
 * - Maintains conversation ID association
 * - Passes courseId in request body for context
 * - Provides Stop and Regenerate functionality
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   stop,
 *   regenerate,
 *   status,
 * } = usePersistedChat({
 *   conversationId: "conv-123",
 *   courseId: "cs-101",
 *   userId: "user-456",
 * });
 * ```
 */
export function usePersistedChat(options: UsePersistedChatOptions) {
  const { conversationId, courseId, userId, onMessageAdded, onStreamFinish } =
    options;

  // Local error state for UI feedback
  const [customError, setCustomError] = useState<Error | undefined>();

  // Load initial messages from localStorage
  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!conversationId) return [];

    const aiMessages = getConversationMessages(conversationId);
    return aiMessages.map(aiMessageToUIMessage);
  }, [conversationId]);

  // Create transport with body params
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          conversationId,
          courseId: courseId || null,
          userId,
        },
      }),
    [conversationId, courseId, userId]
  );

  // Use AI SDK's useChat hook
  const chat = useChat({
    id: conversationId || undefined,
    messages: initialMessages,
    transport,
    onFinish: ({ message }) => {
      // Save assistant message to localStorage after streaming completes
      if (conversationId && message.role === "assistant") {
        const aiMessage = uiMessageToAIMessage(message, conversationId);
        addMessage(aiMessage);

        onMessageAdded?.(aiMessage);
      }

      onStreamFinish?.();
    },
    onError: (error) => {
      console.error('[AI Chat] Error:', error);
      setCustomError(error);

      // Show user-friendly toast notification
      toast.error('Failed to send message', {
        description: error.message || 'Please try again or check your connection.',
        action: {
          label: 'Retry',
          onClick: () => {
            setCustomError(undefined);
            chat.regenerate();
          },
        },
      });
    },
  });

  // Save user messages to localStorage immediately when added
  useEffect(() => {
    if (!conversationId) return;

    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];

    // If it's a user message and not already in localStorage, save it
    if (lastMessage && lastMessage.role === "user") {
      const existingMessages = getConversationMessages(conversationId);
      const alreadySaved = existingMessages.some((m) => m.id === lastMessage.id);

      if (!alreadySaved) {
        const aiMessage = uiMessageToAIMessage(lastMessage, conversationId);
        addMessage(aiMessage);
        onMessageAdded?.(aiMessage);
      }
    }
  }, [chat.messages, conversationId, onMessageAdded]);

  return {
    ...chat,
    // Re-export commonly used properties for clarity
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    regenerate: chat.regenerate,
    stop: chat.stop,
    status: chat.status,
    error: chat.error || customError, // Expose error state
    clearError: () => setCustomError(undefined), // Allow manual error dismissal
  };
}

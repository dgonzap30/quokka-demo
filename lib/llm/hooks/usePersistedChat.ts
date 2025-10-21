"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";
import { getConversationMessages, addMessage } from "@/lib/store/localStore";
import { trackMessageSent, trackResponseGenerated } from "@/lib/store/metrics";
import { trackRequest, getRateLimitStatus } from "@/lib/store/rateLimit";
import { toast } from "sonner";
import type { AIMessage } from "@/lib/models/types";
import { api } from "@/lib/api/client";

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

  // Rate limit state
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Load initial messages from localStorage
  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!conversationId) return [];

    const aiMessages = getConversationMessages(conversationId);

    // Deduplicate messages by ID (keep first occurrence)
    const seenIds = new Set<string>();
    const uniqueMessages = aiMessages.filter((msg) => {
      if (seenIds.has(msg.id)) {
        console.warn(`[usePersistedChat] Duplicate message ID detected: ${msg.id}`);
        return false;
      }
      seenIds.add(msg.id);
      return true;
    });

    return uniqueMessages.map(aiMessageToUIMessage);
  }, [conversationId]);

  // Create transport with body params
  // Note: Since the outer component now ensures user is loaded,
  // userId will always be valid when this hook is called
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          conversationId,
          courseId: courseId || null,
          userId, // This is now guaranteed to be valid
        },
      }),
    [conversationId, courseId, userId]
  );

  // Use AI SDK's useChat hook
  const chat = useChat({
    id: conversationId || undefined,
    messages: initialMessages,
    transport,
    onFinish: async ({ message }) => {
      // Save assistant message to localStorage after streaming completes
      if (conversationId && message.role === "assistant") {
        const aiMessage = uiMessageToAIMessage(message, conversationId);

        // Skip if content is empty (validation requirement: min 1 character)
        if (!aiMessage.content || aiMessage.content.trim().length === 0) {
          console.warn('[usePersistedChat] Skipping message with empty content');
          onStreamFinish?.();
          return;
        }

        addMessage(aiMessage);

        // Persist to backend database
        try {
          await api.createMessage(aiMessage, userId);
        } catch (error) {
          console.error('[usePersistedChat] Failed to persist assistant message to backend:', error);
        }

        onMessageAdded?.(aiMessage);

        // Track metrics
        trackResponseGenerated();
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

        // Persist to backend database
        api.createMessage(aiMessage, userId).catch((error) => {
          console.error('[usePersistedChat] Failed to persist user message to backend:', error);
        });

        onMessageAdded?.(aiMessage);

        // Track metrics
        trackMessageSent();
      }
    }
  }, [chat.messages, conversationId, userId, onMessageAdded]);

  // Wrap sendMessage with rate limit check
  const sendMessageWithRateLimit: typeof chat.sendMessage = async (input) => {
    // Validate userId before sending
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('[AI Chat] Cannot send message: userId is missing or invalid');
      toast.error('Authentication required', {
        description: 'Please wait while we load your session.',
      });
      return;
    }

    // Check rate limit before sending
    const allowed = trackRequest();

    if (!allowed) {
      setIsRateLimited(true);
      const status = getRateLimitStatus();

      toast.error('Rate limit exceeded', {
        description: `You've reached the hourly request limit. Please wait and try again.`,
      });

      // Automatically clear rate limit flag after showing toast
      setTimeout(() => setIsRateLimited(false), 3000);

      return;
    }

    setIsRateLimited(false);
    return chat.sendMessage(input);
  };

  return {
    ...chat,
    // Re-export commonly used properties for clarity
    messages: chat.messages,
    sendMessage: sendMessageWithRateLimit,
    regenerate: chat.regenerate,
    stop: chat.stop,
    status: chat.status,
    error: chat.error || customError, // Expose error state
    clearError: () => setCustomError(undefined), // Allow manual error dismissal
    isRateLimited, // Expose rate limit state
  };
}

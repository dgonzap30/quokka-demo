import type {
  Message,
  ConversationMetadata,
  FormattedMessage,
  ConversationToThreadInput,
  ConversationToThreadResult,
  CreateThreadInput,
} from "@/lib/models/types";

// Re-export type guard for convenience
export { isValidConversation } from "@/lib/models/types";

/**
 * Extract metadata from a conversation
 */
export function extractConversationMetadata(
  messages: Message[]
): ConversationMetadata {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  return {
    messageCount: messages.length,
    userMessageCount: userMessages.length,
    assistantMessageCount: assistantMessages.length,
    startedAt: messages[0].timestamp,
    lastMessageAt: messages[messages.length - 1].timestamp,
  };
}

/**
 * Generate thread title from first user message
 * Max 100 characters, truncated with ellipsis
 */
export function generateThreadTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");

  if (!firstUserMessage) {
    return "Conversation with Quokka";
  }

  const title = firstUserMessage.content.trim();

  // Truncate to 100 characters max
  if (title.length <= 100) {
    return title;
  }

  // Find last space before 97th character (to avoid cutting mid-word)
  const truncated = title.substring(0, 97);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 50) {
    // Only use last space if it's not too early
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Format conversation as plain text for thread content
 * Format: "**You:** message content\n\n**Quokka:** response content\n\n..."
 */
export function formatConversationContent(messages: Message[]): string {
  return messages
    .map((message) => {
      const roleLabel = message.role === "user" ? "**You:**" : "**Quokka:**";
      return `${roleLabel} ${message.content.trim()}`;
    })
    .join("\n\n");
}

/**
 * Format messages for preview display
 */
export function formatMessagesForPreview(
  messages: Message[]
): FormattedMessage[] {
  return messages.map((message) => ({
    roleLabel: message.role === "user" ? "You" : "Quokka",
    content: message.content.trim(),
    timestamp: message.timestamp.toISOString(),
  }));
}

/**
 * Convert conversation to thread input
 * Main conversion function that orchestrates all formatting
 */
export function convertConversationToThread(
  input: ConversationToThreadInput
): ConversationToThreadResult {
  const { messages, courseId } = input;

  // Generate title from first user message
  const title = generateThreadTitle(messages);

  // Format conversation as thread content
  const content = formatConversationContent(messages);

  // Extract metadata
  const metadata = extractConversationMetadata(messages);

  // Format messages for preview
  const formattedMessages = formatMessagesForPreview(messages);

  // Create thread input (no tags auto-generated for now)
  const threadInput: CreateThreadInput = {
    courseId,
    title,
    content,
    tags: [],
  };

  return {
    threadInput,
    formattedMessages,
    metadata,
  };
}

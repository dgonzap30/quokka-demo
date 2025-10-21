import type {
  Message,
  ConversationMetadata,
  FormattedMessage,
  ConversationToThreadInput,
  ConversationToThreadResult,
  CreateThreadInput,
  AIMessage,
  RestructureConversationResult,
} from "@/lib/models/types";

// Re-export type guard for convenience
export { isValidConversation } from "@/lib/models/types";

/**
 * Call AI restructuring API
 *
 * Sends conversation to /api/conversations/restructure for intelligent reformatting.
 * Falls back to basic formatting if API fails.
 */
async function callRestructureAPI(
  messages: AIMessage[],
  courseId: string,
  courseCode: string,
  userId: string
): Promise<RestructureConversationResult | null> {
  try {
    const response = await fetch('/api/conversations/restructure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        courseId,
        courseCode,
        userId,
      }),
    });

    if (!response.ok) {
      console.error('[Restructure] API returned error:', response.status);
      return null;
    }

    const result = await response.json() as RestructureConversationResult;
    return result;
  } catch (error) {
    console.error('[Restructure] API call failed:', error);
    return null;
  }
}

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
    timestamp: message.timestamp, // Already an ISO string
  }));
}

/**
 * Convert conversation to thread input
 * Main conversion function that orchestrates all formatting
 *
 * @deprecated Use convertConversationToThreadAsync for AI-powered restructuring
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

/**
 * Convert conversation to thread input with AI restructuring
 *
 * Enhanced version that uses AI to:
 * - Restructure conversation into clear Q&A format
 * - Extract citations from AI responses
 * - Generate relevant tags automatically
 *
 * Falls back to basic formatting if AI restructuring fails.
 *
 * @param input - Conversation data
 * @param userId - User ID for rate limiting
 * @returns Promise of conversion result with enhanced formatting
 */
export async function convertConversationToThreadAsync(
  input: ConversationToThreadInput & { userId: string }
): Promise<ConversationToThreadResult> {
  const { messages, courseId, courseCode, userId } = input;

  // Convert Message[] to AIMessage[] format
  const aiMessages: AIMessage[] = messages.map(msg => ({
    id: `msg-${Date.now()}-${Math.random()}`,
    conversationId: 'temp',
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  // Try AI restructuring first
  const restructured = await callRestructureAPI(aiMessages, courseId, courseCode, userId);

  if (restructured) {
    // Success! Use restructured content
    console.log('[Conversion] Using AI-restructured content');

    // Build enhanced content with clear structure
    let enhancedContent = `## ${restructured.mainQuestion}\n\n`;
    enhancedContent += `${restructured.supportingContext}\n\n`;
    enhancedContent += `## Answer\n\n${restructured.bestAnswer}\n\n`;

    // Add citations if present
    if (restructured.citations && restructured.citations.length > 0) {
      enhancedContent += `## References\n\n`;
      restructured.citations.forEach((citation, idx) => {
        enhancedContent += `${idx + 1}. **${citation.source}** (${citation.sourceType})\n`;
        enhancedContent += `   ${citation.excerpt}\n\n`;
      });
    }

    // Extract metadata
    const metadata = extractConversationMetadata(messages);

    // Format messages for preview (original conversation)
    const formattedMessages = formatMessagesForPreview(messages);

    // Create thread input with AI enhancements
    const threadInput: CreateThreadInput = {
      courseId,
      title: restructured.title,
      content: enhancedContent,
      tags: restructured.tags,
    };

    return {
      threadInput,
      formattedMessages,
      metadata,
    };
  }

  // Fallback to basic formatting if AI restructuring fails
  console.warn('[Conversion] AI restructuring failed, using basic formatting');
  return convertConversationToThread(input);
}

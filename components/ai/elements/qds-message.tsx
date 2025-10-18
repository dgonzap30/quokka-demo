"use client";

/**
 * QDSMessage - Beautiful QDS-styled wrapper for AI Elements Message component
 *
 * REDESIGNED with proper layout, styling, and visual hierarchy
 */

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";
import { QDSResponse } from "./qds-response";
import { QDSActions } from "./qds-actions";
import { SourcesPanel } from "@/components/ai/sources-panel";
import { parseCitations } from "@/lib/llm/utils/citations";
import type { QDSMessageProps } from "./types";

/**
 * Extract text content from UIMessage parts or content field
 *
 * Handles both formats:
 * - parts array (from localStorage/converted messages)
 * - content field (from streaming/AI SDK)
 */
function getMessageText(message: QDSMessageProps["message"]): string {
  // Try to extract from parts array first
  if (message.parts && message.parts.length > 0) {
    const textParts = message.parts
      .filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .filter(Boolean); // Remove empty strings

    if (textParts.length > 0) {
      return textParts.join("\n");
    }
  }

  // Fall back to content field (for streaming messages)
  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  // Last resort: empty string
  return "";
}

export function QDSMessage({
  message,
  onCopy,
  onRetry,
  isLast = false,
  isStreaming = false,
  className,
}: QDSMessageProps) {
  // Parse citations for assistant messages
  const messageText = getMessageText(message);
  const parsed =
    message.role === "assistant" ? parseCitations(messageText) : null;

  // Determine text to display (strip Sources section for assistant messages)
  const displayText =
    message.role === "assistant" && parsed
      ? parsed.contentWithoutSources
      : messageText;

  // Check if message has citations for visual indicator
  const hasCitations = parsed && parsed.citations.length > 0;

  const isUser = message.role === "user";

  return (
    <div className={cn("group mb-6", className)}>
      {/* Message with avatar */}
      <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <Avatar className={cn(
          "h-10 w-10 shrink-0 ring-2",
          isUser
            ? "bg-accent/10 ring-accent/20"
            : "ai-gradient ring-primary/20"
        )}>
          <AvatarFallback className={cn(
            "text-sm font-medium",
            isUser ? "text-accent" : "text-white"
          )}>
            {isUser ? (
              <User className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
          <div
            className={cn(
              "px-4 py-3 rounded-2xl",
              isUser
                ? "message-user text-white"
                : "message-assistant",
              hasCitations && "border-l-4 border-accent",
              "transition-all duration-200 shadow-sm"
            )}
          >
            {/* Content rendering */}
            {message.role === "assistant" && parsed && parsed.citations.length > 0 ? (
              <QDSResponse
                content={displayText}
                citations={parsed.citations}
              />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {displayText}
              </div>
            )}
          </div>

          {/* Action Buttons for Assistant Messages */}
          {message.role === "assistant" && (
            <QDSActions
              messageContent={messageText}
              onCopy={onCopy}
              onRetry={onRetry}
              showRetry={isLast}
              isStreaming={isStreaming}
              className="ml-2"
            />
          )}

          {/* Sources Panel for Assistant Messages with Citations */}
          {parsed && parsed.citations.length > 0 && (
            <div className="ml-2 w-full">
              <SourcesPanel citations={parsed.citations} defaultExpanded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

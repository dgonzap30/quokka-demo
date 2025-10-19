"use client";

/**
 * QDSConversation - QDS-styled wrapper for AI Elements Conversation component
 *
 * Manages the message list with:
 * - Auto-scroll to bottom on new messages
 * - Scroll-to-bottom button when not at bottom
 * - Streaming indicator
 * - Empty state
 * - Error display
 * - QDS glass styling throughout
 */

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { QDSMessage } from "./qds-message";
import type { QDSConversationProps } from "./types";

export function QDSConversation({
  messages,
  isStreaming = false,
  onCopy,
  onRetry,
  error,
  className,
}: QDSConversationProps) {
  return (
    <Conversation className={cn("sidebar-scroll", className)}>
      <ConversationContent
        className="p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        aria-label="Chat message history"
      >
        {/* Error Alert - Inside scroll area */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="flex-1 pr-4">
                {error.message}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={error.onDismiss}
                >
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={error.onRetry}
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {messages.length === 0 && !error && (
          <div className="flex justify-start">
            <div className="message-assistant p-3">
              <p className="text-sm leading-relaxed">
                Hi! I&apos;m Quokka, your AI study assistant. How can I help you
                today? 🎓
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <QDSMessage
            key={message.id}
            message={message}
            onCopy={onCopy}
            onRetry={onRetry}
            isLast={index === messages.length - 1}
            isStreaming={isStreaming}
          />
        ))}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="message-assistant p-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1" aria-hidden="true">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <p className="text-sm glass-text">Quokka is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}

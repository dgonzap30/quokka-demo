"use client";

/**
 * ConversationHistoryItem - Individual conversation list item (ChatGPT/Claude-inspired)
 *
 * Features:
 * - Active state highlighting
 * - Single-line title with ellipsis
 * - Hover delete button
 * - Clean, minimal design
 * - QDS glassmorphism styling
 * - WCAG 2.2 AA accessibility
 */

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { AIConversation } from "@/lib/models/types";

export interface ConversationHistoryItemProps {
  /**
   * Conversation data to display
   */
  conversation: AIConversation;

  /**
   * Whether this conversation is currently active
   */
  isActive?: boolean;

  /**
   * Click handler for conversation selection
   */
  onClick?: () => void;

  /**
   * Optional delete handler (triggers confirmation)
   */
  onDelete?: (conversationId: string) => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function ConversationHistoryItem({
  conversation,
  isActive = false,
  onClick,
  onDelete,
  className,
}: ConversationHistoryItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    onDelete?.(conversation.id);
  };

  // Keyboard handler for main conversation item (accessible div)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only trigger on Enter or Space (no modifiers)
    if ((e.key === "Enter" || e.key === " ") && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={cn(
              "group relative w-full text-left px-4 py-3 rounded-lg cursor-pointer",
              "transition-all duration-200 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              // Active state - stronger glass effect with accent border
              isActive
                ? "glass-panel-strong border border-primary/30 shadow-e2"
                : "hover:glass-panel border border-transparent hover:border-primary/10 hover:scale-[1.02] hover:shadow-e2",
              className
            )}
            aria-label={`${conversation.title}, ${conversation.updatedAt || conversation.createdAt ? formatTimeAgo(conversation.updatedAt || conversation.createdAt) : 'Recently'}`}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Content: Title + Timestamp */}
            <div className="flex flex-col gap-1.5 pr-8">
              {/* Title - Single line with ellipsis */}
              <h3
                className={cn(
                  "text-sm leading-tight truncate glass-text",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {conversation.title}
              </h3>

              {/* Timestamp - Relative time with fallback */}
              {(conversation.updatedAt || conversation.createdAt) ? (
                <time
                  dateTime={conversation.updatedAt || conversation.createdAt}
                  className="text-xs text-muted-foreground glass-text opacity-75"
                >
                  {formatTimeAgo(conversation.updatedAt || conversation.createdAt)}
                </time>
              ) : (
                <span className="text-xs text-muted-foreground glass-text opacity-75">
                  Recently
                </span>
              )}
            </div>

            {/* Delete Button - Appears on hover */}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2",
                  "h-7 w-7 p-0 opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-200",
                  "hover:bg-destructive/10 hover:text-destructive"
                )}
                aria-label={`Delete ${conversation.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-[300px] glass-panel-strong border-glass"
        >
          <p className="text-xs glass-text">{conversation.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

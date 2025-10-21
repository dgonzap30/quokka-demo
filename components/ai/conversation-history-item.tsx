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
import { cn } from "@/lib/utils";
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
              "group relative w-full text-left px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              // Active state
              isActive
                ? "glass-panel-strong border border-primary/30"
                : "hover:glass-panel border border-transparent hover:border-primary/10",
              className
            )}
            aria-label={`${conversation.title}`}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Title - Single line with ellipsis */}
            <div className="flex items-center gap-2 pr-8">
              <h3
                className={cn(
                  "text-sm leading-tight truncate glass-text flex-1",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {conversation.title}
              </h3>
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

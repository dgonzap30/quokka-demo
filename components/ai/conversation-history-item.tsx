"use client";

/**
 * ConversationHistoryItem - Individual conversation list item with metadata
 *
 * Features:
 * - Active state highlighting
 * - Course badge for course-specific conversations
 * - Message count and time ago display
 * - Title truncation (2 lines max)
 * - Hover effects with QDS glassmorphism
 * - Accessible labeling
 */

import { MessageSquare } from "lucide-react";
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
   * Optional className for composition
   */
  className?: string;
}

/**
 * Format ISO timestamp to human-readable time ago
 * Reused from SidebarThreadCard pattern
 */
function formatTimeAgo(isoTimestamp: string): string {
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

/**
 * Get course code from course ID (mock for now)
 * TODO: Replace with actual course lookup if needed
 */
function getCourseCode(courseId: string): string {
  // For demo: Extract course code from ID (e.g., "course-cs101" → "CS101")
  const match = courseId.match(/course-(\w+)/i);
  return match ? match[1].toUpperCase() : courseId;
}

export function ConversationHistoryItem({
  conversation,
  isActive = false,
  onClick,
  className,
}: ConversationHistoryItemProps) {
  // Format time ago
  const timeAgo = formatTimeAgo(conversation.updatedAt);

  // Get course badge if conversation is course-specific
  const courseBadge = conversation.courseId ? getCourseCode(conversation.courseId) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left p-3 rounded-lg transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        // Active state
        isActive
          ? "glass-panel-strong border border-primary/30 shadow-sm"
          : "hover:glass-panel hover:scale-[1.01] hover:shadow-lg hover:border-primary/20 border border-border/50",
        className
      )}
      aria-label={`${conversation.title}, ${conversation.messageCount} messages`}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Title Row */}
      <div className="flex items-start gap-2 mb-2">
        <h3
          className={cn(
            "text-sm leading-snug line-clamp-2 glass-text flex-1",
            isActive ? "font-semibold" : "font-medium"
          )}
        >
          {conversation.title}
        </h3>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground glass-text">
        {/* Course Badge (if course-specific) */}
        {courseBadge && (
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {courseBadge}
          </span>
        )}

        {/* Message Count */}
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" aria-hidden="true" />
          <span>{conversation.messageCount}</span>
        </span>

        {/* Time Ago */}
        <span className="opacity-50" aria-hidden="true">•</span>
        <time dateTime={conversation.updatedAt} className="opacity-75">
          {timeAgo}
        </time>
      </div>
    </button>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/course/status-badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { MessageSquare, Eye } from "lucide-react";
import type { Thread } from "@/lib/models/types";

export interface SidebarThreadCardProps {
  /**
   * Thread data to display
   */
  thread: Thread;

  /**
   * Whether this thread is currently selected
   */
  isSelected?: boolean;

  /**
   * Click handler for thread selection
   */
  onClick?: () => void;

  /**
   * Whether this thread is unread (for unread indicators)
   */
  isUnread?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * SidebarThreadCard - Ultra-compact thread card for sidebar list
 *
 * Features:
 * - Compact design (~80-100px height) for dense list
 * - Title truncated to 2 lines maximum
 * - Status badge, AI badge, reply count, view count
 * - Unread dot indicator
 * - Active selection state (highlighted background)
 * - Hover state with glass effect
 * - Glass panel styling (QDS compliant)
 * - Accessible with keyboard navigation
 *
 * Design:
 * ```
 * ┌──────────────────────────┐
 * │ ● Title of Thread...     │ ← Unread dot + title
 * │   (truncated to 2 lines) │
 * │                          │
 * │ [Status] [AI] • 3 replies│ ← Metadata row
 * │ 12 views • 2h ago        │
 * └──────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <SidebarThreadCard
 *   thread={thread}
 *   isSelected={selectedThreadId === thread.id}
 *   onClick={() => setSelectedThreadId(thread.id)}
 *   isUnread={!viewedThreadIds.includes(thread.id)}
 * />
 * ```
 */
export function SidebarThreadCard({
  thread,
  isSelected = false,
  onClick,
  isUnread = false,
  className,
}: SidebarThreadCardProps) {
  // Calculate reply count (mock - in real app would come from API)
  const replyCount = 0; // TODO: Add replyCount to Thread type

  // Format time ago
  const timeAgo = formatTimeAgo(thread.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left p-3 md:p-4 rounded-lg transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        // Selected state
        isSelected
          ? "glass-panel-strong border border-primary/30 shadow-sm"
          : "hover:glass-panel hover:scale-[1.01] hover:shadow-lg hover:border-primary/20 border border-border/50",
        // Unread state
        isUnread && "font-medium",
        className
      )}
      aria-label={`${thread.title}, ${thread.status}, ${thread.views} views`}
      aria-current={isSelected ? "true" : undefined}
    >
      {/* Title Row with Unread Indicator */}
      <div className="flex items-start gap-2 mb-2">
        {/* Unread Dot */}
        {isUnread && (
          <span
            className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-primary"
            aria-label="Unread"
          />
        )}

        {/* Title with responsive truncation */}
        <h3
          className={cn(
            "text-sm leading-snug line-clamp-2 sm:line-clamp-3 lg:line-clamp-4 glass-text flex-1",
            isSelected ? "font-semibold" : "font-medium"
          )}
        >
          {thread.title}
        </h3>
      </div>

      {/* Content preview for wider views */}
      {thread.content && (
        <p className="hidden md:block text-xs text-muted-foreground glass-text mb-2 line-clamp-2 leading-relaxed">
          {thread.content}
        </p>
      )}

      {/* Metadata Row - AI-first ordering */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground glass-text">
        {/* AI Badge - PROMINENT (first position, larger) */}
        {thread.hasAIAnswer && (
          <AIBadge variant="default" />
        )}

        {/* Status Badge */}
        <StatusBadge status={thread.status} />

        {/* Reply Count */}
        {replyCount > 0 && (
          <>
            <span className="opacity-50" aria-hidden="true">•</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              <span>{replyCount}</span>
            </span>
          </>
        )}

        {/* Views */}
        <span className="opacity-50" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" aria-hidden="true" />
          <span>{thread.views}</span>
        </span>

        {/* Time Ago */}
        <span className="opacity-50" aria-hidden="true">•</span>
        <time dateTime={thread.createdAt} className="opacity-75">
          {timeAgo}
        </time>
      </div>
    </button>
  );
}

/**
 * Format ISO timestamp to human-readable time ago
 * Examples: "2m ago", "1h ago", "3d ago"
 */
function formatTimeAgo(isoTimestamp: string): string {
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

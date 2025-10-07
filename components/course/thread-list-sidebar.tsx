"use client";

import { useState } from "react";
import { SidebarThreadCard } from "@/components/course/sidebar-thread-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Thread } from "@/lib/models/types";
import { cn } from "@/lib/utils";
import { Inbox, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ThreadListSidebarProps {
  /**
   * Array of threads to display (already filtered)
   */
  threads: Thread[];

  /**
   * Currently selected thread ID
   */
  selectedThreadId: string | null;

  /**
   * Handler for thread selection
   */
  onThreadSelect: (threadId: string) => void;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Current user ID (for unread tracking)
   */
  currentUserId?: string;

  /**
   * Collapse handler
   */
  onCollapse?: () => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ThreadListSidebar - Middle sidebar with just the thread list
 *
 * Features:
 * - Displays filtered threads in compact cards
 * - Scrollable list with full vertical space
 * - Active thread selection highlight
 * - Unread indicators
 * - Loading skeletons
 * - Empty state when no threads match filters
 * - Keyboard navigation hints
 * - Glass panel styling (QDS compliant)
 *
 * Purpose:
 * Dedicated space for thread list, separate from filtering controls.
 * Maximizes vertical space for threads, making them immediately accessible
 * without scrolling past filters.
 *
 * Layout Position:
 * ```
 * ┌──────────┬─────────────────┬─────────┐
 * │ Filter   │ THIS            │ Detail  │
 * │ Sidebar  │ ThreadListSide  │ Panel   │
 * └──────────┴─────────────────┴─────────┘
 * ```
 *
 * @example
 * ```tsx
 * <ThreadListSidebar
 *   threads={filteredThreads}
 *   selectedThreadId={selectedThreadId}
 *   onThreadSelect={handleThreadSelect}
 *   isLoading={threadsLoading}
 *   currentUserId={user?.id}
 * />
 * ```
 */
export function ThreadListSidebar({
  threads,
  selectedThreadId,
  onThreadSelect,
  isLoading = false,
  currentUserId,
  onCollapse,
  className,
}: ThreadListSidebarProps) {
  // Track viewed thread IDs for unread indicators
  const [viewedThreadIds, setViewedThreadIds] = useState<Set<string>>(new Set());

  // Handle thread click
  const handleThreadClick = (threadId: string) => {
    onThreadSelect(threadId);
    setViewedThreadIds((prev) => new Set([...prev, threadId]));
  };

  return (
    <div
      className={cn(
        "w-full h-screen flex flex-col glass-panel-strong border-r border-glass shadow-glass-md",
        className
      )}
      aria-label="Thread list"
    >
      {/* Header with Collapse Button */}
      <div className="flex-shrink-0 border-b border-glass p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-4 glass-text">Threads</h2>
            <p className="text-xs text-muted-foreground glass-text mt-1">
              {threads.length} {threads.length === 1 ? "thread" : "threads"}
            </p>
          </div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:glass-panel -mt-1"
              onClick={onCollapse}
              aria-label="Collapse thread list"
              title="Collapse thread list (Cmd/Ctrl + ])"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Thread List (Scrollable) */}
      <div
        className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2 space-y-2"
        role="list"
        aria-label="Filtered threads"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg glass-panel">
                <Skeleton className="h-4 w-full mb-2 bg-glass-medium" />
                <Skeleton className="h-4 w-3/4 mb-2 bg-glass-medium" />
                <Skeleton className="h-3 w-1/2 bg-glass-medium" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full glass-panel mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="heading-5 glass-text mb-2">No threads found</h3>
            <p className="text-sm text-muted-foreground glass-text leading-relaxed max-w-[240px]">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}

        {/* Thread Cards */}
        {!isLoading && threads.map((thread) => (
          <div key={thread.id} role="listitem">
            <SidebarThreadCard
              thread={thread}
              isSelected={selectedThreadId === thread.id}
              onClick={() => handleThreadClick(thread.id)}
              isUnread={!viewedThreadIds.has(thread.id)}
            />
          </div>
        ))}
      </div>

      {/* Footer with Keyboard Hints */}
      <div className="flex-shrink-0 border-t border-glass p-3">
        <p className="text-xs text-subtle glass-text text-center">
          Use <kbd className="px-1 py-0.5 rounded bg-glass-medium border border-glass font-mono text-xs">j</kbd>
          {" "}<kbd className="px-1 py-0.5 rounded bg-glass-medium border border-glass font-mono text-xs">k</kbd>
          {" "}to navigate
        </p>
      </div>
    </div>
  );
}

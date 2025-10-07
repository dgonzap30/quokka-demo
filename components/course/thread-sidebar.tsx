"use client";

import { useState, useMemo } from "react";
import { SidebarThreadCard } from "@/components/course/sidebar-thread-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Thread } from "@/lib/models/types";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface ThreadSidebarProps {
  /**
   * Course ID for context
   */
  courseId: string;

  /**
   * Array of threads to display
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
   * Optional className for composition
   */
  className?: string;
}

/**
 * ThreadSidebar - Vertical sidebar with filters, search, and thread list
 *
 * Features:
 * - Scrollable thread list with compact cards
 * - Search bar (Phase 3)
 * - Filter chips (Phase 3)
 * - Tag cloud (Phase 3)
 * - Virtual scrolling (Phase 5 - for 50+ threads)
 * - Empty state when no threads
 * - Loading skeletons
 * - Keyboard navigation (j/k for next/prev)
 *
 * Structure:
 * ```
 * ┌─────────────────────┐
 * │ [Search Bar]        │ ← Phase 3
 * ├─────────────────────┤
 * │ [Filter Chips]      │ ← Phase 3
 * ├─────────────────────┤
 * │ [Tag Cloud]         │ ← Phase 3
 * ├─────────────────────┤
 * │ Thread List         │
 * │  ┌───────────────┐  │
 * │  │ Thread 1      │  │
 * │  └───────────────┘  │
 * │  ┌───────────────┐  │
 * │  │ Thread 2      │  │
 * │  └───────────────┘  │
 * │  ...                │
 * └─────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <ThreadSidebar
 *   courseId="cs101"
 *   threads={threads}
 *   selectedThreadId={selectedThreadId}
 *   onThreadSelect={handleThreadSelect}
 *   isLoading={threadsLoading}
 * />
 * ```
 */
export function ThreadSidebar({
  threads,
  selectedThreadId,
  onThreadSelect,
  isLoading = false,
  className,
}: ThreadSidebarProps) {
  // Track viewed thread IDs for unread indicators
  const [viewedThreadIds, setViewedThreadIds] = useState<Set<string>>(new Set());

  // Handle thread click
  const handleThreadClick = (threadId: string) => {
    onThreadSelect(threadId);
    setViewedThreadIds((prev) => new Set([...prev, threadId]));
  };

  // Memoize sorted threads (newest first)
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [threads]);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        className
      )}
      aria-label="Thread sidebar"
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-glass p-4">
        <h2 className="heading-4 glass-text">Threads</h2>
        <p className="text-xs text-muted-foreground glass-text mt-1">
          {threads.length} {threads.length === 1 ? "thread" : "threads"}
        </p>
      </div>

      {/* Placeholder for Search Bar (Phase 3) */}
      {/* TODO: Add SidebarSearchBar component */}

      {/* Placeholder for Filter Panel (Phase 3) */}
      {/* TODO: Add SidebarFilterPanel component */}

      {/* Placeholder for Tag Cloud (Phase 3) */}
      {/* TODO: Add TagCloud component */}

      {/* Thread List */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2"
        role="list"
        aria-label="Thread list"
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
            <h3 className="heading-5 glass-text mb-2">No threads yet</h3>
            <p className="text-sm text-muted-foreground glass-text leading-relaxed max-w-[240px]">
              Be the first to start a discussion in this course!
            </p>
          </div>
        )}

        {/* Thread Cards */}
        {!isLoading && sortedThreads.map((thread) => (
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

      {/* Footer with keyboard hints (Phase 5) */}
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

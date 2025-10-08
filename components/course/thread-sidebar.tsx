"use client";

import { useState, useMemo } from "react";
import { SidebarThreadCard } from "@/components/course/sidebar-thread-card";
import { SidebarSearchBar } from "@/components/course/sidebar-search-bar";
import { SidebarFilterPanel, type FilterType } from "@/components/course/sidebar-filter-panel";
import { TagCloud, type TagWithCount } from "@/components/course/tag-cloud";
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
   * Current user ID (for "My Posts" filter)
   */
  currentUserId?: string;

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
  currentUserId,
  className,
}: ThreadSidebarProps) {
  // Track viewed thread IDs for unread indicators
  const [viewedThreadIds, setViewedThreadIds] = useState<Set<string>>(new Set());

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Handle thread click
  const handleThreadClick = (threadId: string) => {
    onThreadSelect(threadId);
    setViewedThreadIds((prev) => new Set([...prev, threadId]));
  };

  // Extract all unique tags with counts
  const tagsWithCounts = useMemo<TagWithCount[]>(() => {
    const tagCounts = new Map<string, number>();

    threads.forEach((thread) => {
      thread.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [threads]);

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    let filtered = [...threads];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((thread) => {
        return (
          thread.title.toLowerCase().includes(query) ||
          thread.content.toLowerCase().includes(query) ||
          thread.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    // Apply status filter
    if (activeFilter !== "all") {
      switch (activeFilter) {
        case "high-confidence":
          // TODO: Requires AI answer data
          break;
        case "instructor-endorsed":
          // TODO: Requires AI answer data
          break;
        case "popular":
          // TODO: Requires AI answer data
          break;
        case "resolved":
          filtered = filtered.filter((thread) => thread.status === "resolved");
          break;
        case "my-posts":
          filtered = filtered.filter((thread) => thread.authorId === currentUserId);
          break;
      }
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((thread) => {
        return selectedTags.every((selectedTag) => thread.tags?.includes(selectedTag));
      });
    }

    // Sort by newest first
    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [threads, searchQuery, activeFilter, selectedTags, currentUserId]);

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
          {filteredThreads.length} of {threads.length} {threads.length === 1 ? "thread" : "threads"}
        </p>
      </div>

      {/* Search Bar */}
      <SidebarSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search threads..."
      />

      {/* Filter Panel */}
      <SidebarFilterPanel
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Tag Cloud */}
      {tagsWithCounts.length > 0 && (
        <TagCloud
          tags={tagsWithCounts}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      )}

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
        {!isLoading && filteredThreads.map((thread) => (
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

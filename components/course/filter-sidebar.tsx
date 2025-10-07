"use client";

import { SidebarSearchBar } from "@/components/course/sidebar-search-bar";
import { SidebarFilterPanel, type FilterType } from "@/components/course/sidebar-filter-panel";
import { TagCloud, type TagWithCount } from "@/components/course/tag-cloud";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterSidebarProps {
  /**
   * Search query state
   */
  searchQuery: string;

  /**
   * Search query change handler
   */
  onSearchChange: (query: string) => void;

  /**
   * Active filter state
   */
  activeFilter: FilterType;

  /**
   * Filter change handler
   */
  onFilterChange: (filter: FilterType) => void;

  /**
   * Available tags with counts
   */
  tags: TagWithCount[];

  /**
   * Selected tags state
   */
  selectedTags: string[];

  /**
   * Selected tags change handler
   */
  onTagsChange: (tags: string[]) => void;

  /**
   * Total number of threads (before filtering)
   */
  totalThreads: number;

  /**
   * Number of threads after filtering
   */
  filteredThreads: number;

  /**
   * Collapse handler
   */
  onCollapse?: () => void;

  /**
   * Whether the sidebar is open (expanded) or compact
   */
  isOpen?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * FilterSidebar - Left sidebar with search, filters, and tags
 *
 * Features:
 * - Narrow width (220px) dedicated to filtering controls
 * - Search bar with debounce
 * - Status filters (All, Unanswered, My Posts, Needs Review)
 * - Tag cloud with multi-select
 * - Filter result count display
 * - Always visible (no scrolling needed)
 * - Glass panel styling (QDS compliant)
 *
 * Purpose:
 * Separates filtering controls from thread list for better accessibility.
 * Filters are always visible without scrolling, making thread navigation
 * more efficient.
 *
 * Layout Position:
 * ```
 * ┌─────────────┬──────────────┬─────────┐
 * │ THIS        │ Thread List  │ Detail  │
 * │ FilterSide  │ Sidebar      │ Panel   │
 * └─────────────┴──────────────┴─────────┘
 * ```
 *
 * @example
 * ```tsx
 * <FilterSidebar
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   activeFilter={activeFilter}
 *   onFilterChange={setActiveFilter}
 *   tags={tagsWithCounts}
 *   selectedTags={selectedTags}
 *   onTagsChange={setSelectedTags}
 *   totalThreads={threads.length}
 *   filteredThreads={filteredThreads.length}
 * />
 * ```
 */
export function FilterSidebar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  tags,
  selectedTags,
  onTagsChange,
  totalThreads,
  filteredThreads,
  onCollapse,
  isOpen = true,
  className,
}: FilterSidebarProps) {
  // Compact view when sidebar is closed
  if (!isOpen) {
    return (
      <div
        className={cn(
          "w-full h-screen flex flex-col items-center glass-panel-medium border-r border-glass border-l-2 border-l-primary/20 py-4",
          className
        )}
        aria-label="Filter controls (compact)"
      >
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:glass-panel"
            onClick={onCollapse}
            aria-label="Expand filter sidebar"
            title="Expand filters (Cmd/Ctrl + [)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Expanded view (default)
  return (
    <div
      className={cn(
        "w-full h-screen flex flex-col glass-panel-medium border-r border-glass border-l-2 border-l-primary/20",
        className
      )}
      aria-label="Filter controls"
    >
      {/* Header with Result Count and Collapse Button */}
      <div className="flex-shrink-0 border-b border-glass p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-4 glass-text mb-1">Filters</h2>
            <p className="text-xs text-muted-foreground glass-text">
              {filteredThreads} of {totalThreads} threads
            </p>
          </div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:glass-panel -mt-1"
              onClick={onCollapse}
              aria-label="Collapse filter sidebar"
              title="Collapse filters (Cmd/Ctrl + [)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Filter Controls */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {/* Search Bar */}
        <SidebarSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search threads..."
        />

        {/* Filter Panel */}
        <SidebarFilterPanel
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />

        {/* Tag Cloud */}
        {tags.length > 0 && (
          <TagCloud
            tags={tags}
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
          />
        )}
      </div>
    </div>
  );
}

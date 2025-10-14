"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { SidebarSearchBar } from "@/components/course/sidebar-search-bar";
import { SidebarFilterPanel } from "@/components/course/sidebar-filter-panel";
import { TagCloud } from "@/components/course/tag-cloud";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterType } from "@/components/course/sidebar-filter-panel";
import type { TagWithCount } from "@/components/course/tag-cloud";

export interface MobileFilterSheetProps {
  /**
   * Sheet open/closed state (controlled)
   */
  open: boolean;

  /**
   * Sheet state change handler
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Current search query
   */
  searchQuery: string;

  /**
   * Search query change handler
   */
  onSearchChange: (query: string) => void;

  /**
   * Current active filter
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
   * Currently selected tags
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
   * Optional className for composition
   */
  className?: string;
}

/**
 * MobileFilterSheet - Bottom sheet for mobile filter controls
 *
 * Features:
 * - Bottom sheet drawer (mobile-native pattern)
 * - Reuses desktop filter components (SidebarSearchBar, SidebarFilterPanel, TagCloud)
 * - Controlled component (open state managed by parent)
 * - Immediate filter application (no "Apply" button needed)
 * - "Clear All" button to reset all filters
 * - Scrollable body for overflow handling
 * - Glass panel styling (QDS compliant)
 * - Safe area support for iOS notch/gesture bar
 * - WCAG 2.2 AA accessible (keyboard nav, screen reader, focus management)
 *
 * Purpose:
 * Makes filter functionality accessible on mobile devices (<768px) where
 * the desktop FilterSidebar is hidden. Shares filter state with desktop
 * for consistent behavior.
 *
 * Layout Pattern:
 * ```
 * ┌─────────────────────────────┐
 * │ Backdrop (dimmed)           │
 * │                             │
 * │ ┌─────────────────────────┐ │
 * │ │ SHEET (bottom 80vh)     │ │
 * │ │ ┌─────────────────────┐ │ │
 * │ │ │ Header (title+count)│ │ │
 * │ │ ├─────────────────────┤ │ │
 * │ │ │ Body (scrollable)   │ │ │
 * │ │ │ - Search            │ │ │
 * │ │ │ - Filters           │ │ │
 * │ │ │ - Tags              │ │ │
 * │ │ ├─────────────────────┤ │ │
 * │ │ │ Footer (Clear All)  │ │ │
 * │ │ └─────────────────────┘ │ │
 * │ └─────────────────────────┘ │
 * └─────────────────────────────┘
 * ```
 *
 * Accessibility:
 * - Focus management: Radix Dialog handles focus trap and return
 * - Keyboard: Tab navigation, Arrow keys for radio group, Escape to close
 * - ARIA: aria-modal, aria-labelledby, aria-describedby, aria-expanded
 * - Touch targets: All interactive elements ≥44x44px
 * - Screen reader: Status announcements for filter changes
 *
 * @example
 * ```tsx
 * const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
 *
 * <MobileFilterSheet
 *   open={mobileFilterSheetOpen}
 *   onOpenChange={setMobileFilterSheetOpen}
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
export function MobileFilterSheet({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  tags,
  selectedTags,
  onTagsChange,
  totalThreads,
  filteredThreads,
  className,
}: MobileFilterSheetProps) {
  // Handle "Clear All" button - resets all filters
  const handleClearAll = () => {
    onSearchChange("");
    onFilterChange("all");
    onTagsChange([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        id="mobile-filter-sheet"
        className={cn(
          "h-[80vh] max-h-[600px]",
          "flex flex-col",
          "glass-panel-strong border-t border-glass shadow-glass-lg",
          "safe-bottom",
          className
        )}
      >
        {/* Title - Direct child for Radix accessibility */}
        <SheetTitle className="sr-only">Filters</SheetTitle>
        <SheetDescription className="sr-only">
          Search and filter threads by status and tags
        </SheetDescription>

        {/* Header - Visual header with counts */}
        <div className="flex-shrink-0 border-b border-glass pb-4 px-6 pt-6">
          <h2 className="heading-4 glass-text">Filters</h2>
          <p className="text-sm text-muted-foreground glass-text mt-1">
            {filteredThreads} of {totalThreads} threads
          </p>
        </div>

        {/* Scrollable Body */}
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

        {/* Footer with Clear All Button */}
        <SheetFooter className="flex-shrink-0 border-t border-glass pt-4 safe-bottom">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            disabled={
              searchQuery === "" &&
              activeFilter === "all" &&
              selectedTags.length === 0
            }
            className="w-full touch-target hover:glass-panel focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Clear all filters"
          >
            Clear All Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { cn } from "@/lib/utils";

export type FilterType = "all" | "unanswered" | "my-posts" | "needs-review";
export type SortOrder = "newest" | "oldest" | "most-views";

export interface FilterRowProps {
  /** Current active filter */
  activeFilter: FilterType;

  /** Handler for filter changes */
  onFilterChange: (filter: FilterType) => void;

  /** Current sort order */
  sortOrder: SortOrder;

  /** Handler for sort order changes */
  onSortChange: (sort: SortOrder) => void;

  /** Optional className for composition */
  className?: string;
}

/**
 * FilterRow component for Q&A threads
 * Provides filter chips (All, Unanswered, My posts, Needs review) and sort dropdown
 */
export function FilterRow({
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
  className,
}: FilterRowProps) {
  const filters: Array<{ id: FilterType; label: string }> = [
    { id: "all", label: "All" },
    { id: "unanswered", label: "Unanswered" },
    { id: "my-posts", label: "My posts" },
    { id: "needs-review", label: "Needs review" },
  ];

  const sortOptions: Array<{ value: SortOrder; label: string }> = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "most-views", label: "Most views" },
  ];

  return (
    <div className={cn("border-b border-black/10 bg-white/50", className)}>
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "h-8 px-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                  activeFilter === filter.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                )}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="h-8 pl-3 pr-8 rounded-md border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 appearance-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              aria-label="Sort threads by"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-xs"
              aria-hidden="true"
            >
              ▼
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

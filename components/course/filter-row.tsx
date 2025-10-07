"use client";

import { cn } from "@/lib/utils";
import { List, HelpCircle, User, AlertCircle, ChevronDown, type LucideIcon } from "lucide-react";

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

interface Filter {
  id: FilterType;
  label: string;
  icon: LucideIcon;
}

/**
 * FilterRow component for Q&A threads
 * Features:
 * - Segmented control with icons for visual clarity
 * - Glass background for modern aesthetic
 * - Responsive: full controls on desktop, dropdown on mobile
 * - Accessible with proper ARIA attributes
 */
export function FilterRow({
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
  className,
}: FilterRowProps) {
  const filters: Filter[] = [
    { id: "all", label: "All", icon: List },
    { id: "unanswered", label: "Unanswered", icon: HelpCircle },
    { id: "my-posts", label: "My Posts", icon: User },
    { id: "needs-review", label: "Needs Review", icon: AlertCircle },
  ];

  const sortOptions: Array<{ value: SortOrder; label: string }> = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "most-views", label: "Most views" },
  ];

  return (
    <div className={cn("border-b border-glass glass-panel-strong", className)}>
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Desktop: Segmented Control with Icons */}
          <div className="hidden md:inline-flex glass-panel backdrop-blur-md border border-glass rounded-lg p-1">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                    activeFilter === filter.id
                      ? "bg-glass-strong shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-glass-subtle"
                  )}
                  aria-pressed={activeFilter === filter.id}
                  aria-label={`Filter by ${filter.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile: Filter Dropdown */}
          <div className="relative md:hidden flex-1">
            <select
              value={activeFilter}
              onChange={(e) => onFilterChange(e.target.value as FilterType)}
              className="w-full h-10 pl-4 pr-10 rounded-lg glass-panel border-glass text-sm font-medium appearance-none cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              aria-label="Filter threads"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="h-10 pl-4 pr-10 rounded-lg glass-panel border-glass text-sm font-medium appearance-none cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              aria-label="Sort threads by"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

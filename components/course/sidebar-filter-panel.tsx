"use client";

import { cn } from "@/lib/utils";
import { List, Target, BadgeCheck, Flame, CheckSquare, User, type LucideIcon } from "lucide-react";

export type FilterType = "all" | "high-confidence" | "instructor-endorsed" | "popular" | "resolved" | "my-posts";

export interface SidebarFilterPanelProps {
  /**
   * Current active filter
   */
  activeFilter: FilterType;

  /**
   * Handler for filter changes
   */
  onFilterChange: (filter: FilterType) => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

interface Filter {
  id: FilterType;
  label: string;
  icon: LucideIcon;
  description: string; // Screen reader description
}

const filters: Filter[] = [
  {
    id: "all",
    label: "All Threads",
    icon: List,
    description: "Show all threads in this course",
  },
  {
    id: "high-confidence",
    label: "High Confidence",
    icon: Target,
    description: "Show threads with high-confidence AI answers (80% or higher)",
  },
  {
    id: "instructor-endorsed",
    label: "Instructor Endorsed",
    icon: BadgeCheck,
    description: "Show threads with instructor-endorsed AI answers",
  },
  {
    id: "popular",
    label: "Popular",
    icon: Flame,
    description: "Show popular threads with many student endorsements",
  },
  {
    id: "resolved",
    label: "Resolved",
    icon: CheckSquare,
    description: "Show threads marked as resolved by instructors",
  },
  {
    id: "my-posts",
    label: "My Posts",
    icon: User,
    description: "Show threads you've created or participated in",
  },
];

/**
 * SidebarFilterPanel - Vertical filter controls for thread list
 *
 * Features:
 * - Radio group behavior (single selection)
 * - Icons + labels for visual clarity
 * - Larger hit targets (full-width buttons)
 * - Active state styling with glass effect
 * - Accessible with proper ARIA attributes
 * - Keyboard navigation (arrow keys, space/enter)
 *
 * Design:
 * ```
 * ┌─────────────────────┐
 * │ ● All Threads       │ ← Active
 * │ ○ Unanswered        │
 * │ ○ My Posts          │
 * │ ○ Needs Review      │
 * └─────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <SidebarFilterPanel
 *   activeFilter={activeFilter}
 *   onFilterChange={setActiveFilter}
 * />
 * ```
 */
export function SidebarFilterPanel({
  activeFilter,
  onFilterChange,
  className,
}: SidebarFilterPanelProps) {
  return (
    <div
      className={cn("px-2 py-3 border-b border-glass", className)}
      role="radiogroup"
      aria-label="Filter threads by"
    >
      <div className="space-y-1">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              role="radio"
              aria-checked={isActive}
              aria-label={filter.description}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                isActive
                  ? "glass-panel-strong text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:glass-panel"
              )}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />

              {/* Label */}
              <span className="flex-1 text-left glass-text">{filter.label}</span>

              {/* Active Indicator */}
              {isActive && (
                <span
                  className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

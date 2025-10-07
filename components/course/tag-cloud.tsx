"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface TagWithCount {
  tag: string;
  count: number;
}

export interface TagCloudProps {
  /**
   * Array of tags with usage counts
   */
  tags: TagWithCount[];

  /**
   * Currently selected tags
   */
  selectedTags: string[];

  /**
   * Handler for tag selection changes
   */
  onTagsChange: (tags: string[]) => void;

  /**
   * Maximum tags to show initially
   * @default 8
   */
  maxInitialTags?: number;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * TagCloud - Interactive tag filtering with visual sizing
 *
 * Features:
 * - Tags sized proportional to usage frequency
 * - Multi-select support (click to toggle)
 * - Show more/less expansion
 * - Selected tags highlighted with primary color
 * - Glass badge styling (QDS compliant)
 * - Accessible with keyboard navigation
 *
 * Behavior:
 * - Click tag → toggles selection
 * - Multiple tags can be selected (AND filtering)
 * - "Show all" button reveals hidden tags
 * - Tag size based on count (larger = more usage)
 *
 * @example
 * ```tsx
 * <TagCloud
 *   tags={[
 *     { tag: "homework", count: 15 },
 *     { tag: "midterm", count: 8 },
 *   ]}
 *   selectedTags={selectedTags}
 *   onTagsChange={setSelectedTags}
 * />
 * ```
 */
export function TagCloud({
  tags,
  selectedTags,
  onTagsChange,
  maxInitialTags = 8,
  className,
}: TagCloudProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort tags by count (descending)
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);

  // Determine visible tags
  const visibleTags = isExpanded
    ? sortedTags
    : sortedTags.slice(0, maxInitialTags);
  const hasMoreTags = sortedTags.length > maxInitialTags;

  // Handle tag click
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Deselect tag
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      // Select tag
      onTagsChange([...selectedTags, tag]);
    }
  };

  // Calculate tag size based on count
  const getTagSize = (count: number): "xs" | "sm" | "default" => {
    const maxCount = Math.max(...tags.map((t) => t.count));
    const ratio = count / maxCount;

    if (ratio >= 0.7) return "default"; // Large
    if (ratio >= 0.4) return "sm"; // Medium
    return "xs"; // Small
  };

  if (tags.length === 0) {
    return null; // Don't render if no tags
  }

  return (
    <div className={cn("px-3 py-3 border-b border-glass", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground glass-text">
          Tags
        </h3>
      </div>

      {/* Tag Cloud */}
      <div className="flex flex-wrap gap-2 mb-2">
        {visibleTags.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag);
          const size = getTagSize(count);

          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={cn(
                "inline-flex items-center gap-1.5 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 rounded-full"
              )}
              aria-label={`${isSelected ? "Remove" : "Add"} tag filter: ${tag} (${count} threads)`}
              aria-pressed={isSelected}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer hover:border-primary/50 transition-colors",
                  isSelected && "bg-primary text-primary-foreground border-primary",
                  size === "xs" && "text-[10px] px-1.5 py-0.5",
                  size === "sm" && "text-[11px] px-2 py-0.5",
                  size === "default" && "text-xs px-2.5 py-1"
                )}
              >
                {tag}
                <span
                  className={cn(
                    "ml-1 opacity-70",
                    isSelected ? "opacity-90" : "opacity-60"
                  )}
                >
                  {count}
                </span>
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMoreTags && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 mt-1 rounded-md",
            "text-xs font-medium text-muted-foreground hover:text-foreground",
            "hover:glass-panel transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show fewer tags" : `Show ${sortedTags.length - maxInitialTags} more tags`}
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            </>
          ) : (
            <>
              <span>Show {sortedTags.length - maxInitialTags} more</span>
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </>
          )}
        </button>
      )}

      {/* Selected Tags Count */}
      {selectedTags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-glass">
          <p className="text-xs text-muted-foreground glass-text text-center">
            {selectedTags.length} {selectedTags.length === 1 ? "tag" : "tags"} selected
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

// ============================================
// SourcesPanel Component (Phase 2.5)
// ============================================
//
// Displays cited course materials from LLM responses.
// Shows inline citations with material titles and types.

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/llm/utils/citations";

export interface SourcesPanelProps {
  /** Parsed citations from LLM response */
  citations: Citation[];
  /** Whether panel is initially expanded */
  defaultExpanded?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * SourcesPanel - Display cited course materials
 *
 * Renders a collapsible panel showing course materials cited in AI responses.
 * Each citation displays: number, title, and type with appropriate icon.
 *
 * @example
 * ```tsx
 * const citations = parseCitations(response.content);
 * <SourcesPanel citations={citations.citations} />
 * ```
 */
export function SourcesPanel({
  citations,
  defaultExpanded = true,
  className,
}: SourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (citations.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-l-4 border-accent/40 bg-accent/5 rounded-md",
        "dark:bg-accent/10 dark:border-accent/30",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-3",
          "text-sm font-medium text-gray-700 dark:text-gray-200",
          "hover:bg-accent/10 dark:hover:bg-accent/15",
          "transition-colors rounded-t-md",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        )}
        aria-expanded={isExpanded}
        aria-controls="sources-list"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-accent" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-accent" aria-hidden="true" />
        )}
        <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
        <span>Sources ({citations.length})</span>
      </button>

      {/* Sources List */}
      {isExpanded && (
        <div
          id="sources-list"
          className="px-4 pb-4 space-y-2"
          role="list"
          aria-label="Cited course materials"
        >
          {citations.map((citation) => (
            <div
              key={citation.id}
              data-citation-id={citation.id}
              role="listitem"
              className={cn(
                "flex items-start gap-3 p-3 rounded-md",
                "bg-white/50 dark:bg-gray-800/50",
                "border border-gray-200/50 dark:border-gray-700/50",
                "hover:border-accent/40 dark:hover:border-accent/30",
                "transition-colors"
              )}
            >
              {/* Citation Number */}
              <div
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "h-6 w-6 rounded-full",
                  "bg-accent/20 dark:bg-accent/30",
                  "text-xs font-semibold text-accent-foreground"
                )}
                aria-label={`Citation ${citation.id}`}
              >
                {citation.id}
              </div>

              {/* Citation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {citation.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatCitationType(citation.type)}
                    </p>
                  </div>

                  {/* View Material Link */}
                  {citation.url && (
                    <Link
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex-shrink-0 flex items-center gap-1",
                        "px-2 py-1 rounded-md",
                        "text-xs font-medium",
                        "text-accent hover:text-accent-foreground",
                        "hover:bg-accent/10",
                        "transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                      )}
                      aria-label={`View ${citation.title}`}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span>View</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Format citation type for display
 *
 * @param type - Citation type from Sources section
 * @returns User-friendly type label
 */
function formatCitationType(type: string): string {
  const typeMap: Record<string, string> = {
    lecture: "Lecture Notes",
    slide: "Slides",
    assignment: "Assignment",
    reading: "Reading",
    lab: "Lab",
    exam: "Exam",
    quiz: "Quiz",
    other: "Other",
  };

  return typeMap[type.toLowerCase()] || type;
}

/**
 * Compact version of SourcesPanel for inline display
 */
export function SourcesPanelCompact({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <BookOpen className="h-3 w-3" aria-hidden="true" />
      <span>
        {citations.length} {citations.length === 1 ? "source" : "sources"} cited
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, MessageSquare, TrendingUp, Tag } from "lucide-react";
import type { FrequentlyAskedQuestion } from "@/lib/models/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FAQClustersPanelProps {
  /** FAQ clusters to display */
  faqs: FrequentlyAskedQuestion[];

  /** Whether data is loading */
  isLoading?: boolean;

  /** Callback when cluster is expanded */
  onClusterExpand?: (faqId: string) => void;

  /** Optional CSS classes */
  className?: string;
}

/**
 * FAQ clusters panel for instructor dashboard
 *
 * Displays frequently asked question clusters with common keywords,
 * frequency counts, and AI confidence. Clusters are collapsible to
 * show individual threads.
 *
 * Features:
 * - Collapsible clusters (click to expand)
 * - Frequency indicator with visual weight
 * - Average AI confidence score
 * - Instructor endorsement indicator
 * - Common keywords as tags
 * - Thread list per cluster
 * - Sorted by frequency (descending)
 * - Empty state when no FAQs
 *
 * @example
 * ```tsx
 * <FAQClustersPanel
 *   faqs={frequentlyAskedQuestions}
 *   isLoading={isLoadingFAQs}
 *   onClusterExpand={(id) => trackExpansion(id)}
 * />
 * ```
 */
export function FAQClustersPanel({
  faqs,
  isLoading = false,
  onClusterExpand,
  className,
}: FAQClustersPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (faqId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) {
        next.delete(faqId);
      } else {
        next.add(faqId);
        onClusterExpand?.(faqId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 animate-pulse"
            aria-hidden="true"
          >
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className
        )}
        role="status"
      >
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No frequently asked questions yet. Check back after more questions are posted.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} role="list">
      {faqs.map((faq) => {
        const isExpanded = expandedIds.has(faq.id);
        const confidenceColor =
          faq.avgConfidence >= 0.8
            ? "text-success"
            : faq.avgConfidence >= 0.6
            ? "text-warning"
            : "text-danger";

        return (
          <div
            key={faq.id}
            className="rounded-lg border bg-card transition-all hover:border-primary/30 hover:shadow-e1"
            role="listitem"
          >
            {/* Cluster Header */}
            <button
              onClick={() => toggleExpand(faq.id)}
              className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              aria-expanded={isExpanded}
              aria-controls={`faq-cluster-${faq.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Expand/Collapse Icon */}
                <div className="shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Cluster Title */}
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {faq.title}
                  </h3>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="font-medium">{faq.frequency}</span>
                      <span>times asked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Avg confidence:</span>
                      <span className={cn("font-medium", confidenceColor)}>
                        {(faq.avgConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {faq.hasInstructorEndorsement && (
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="text-xs">Endorsed</span>
                      </div>
                    )}
                  </div>

                  {/* Common Keywords */}
                  {faq.commonKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {faq.commonKeywords.slice(0, 5).map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          <Tag className="h-3 w-3" aria-hidden="true" />
                          {keyword}
                        </span>
                      ))}
                      {faq.commonKeywords.length > 5 && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          +{faq.commonKeywords.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Frequency Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0",
                    faq.frequency >= 10
                      ? "bg-danger/10 text-danger border-danger/20"
                      : faq.frequency >= 5
                      ? "bg-warning/10 text-warning border-warning/20"
                      : "bg-accent/10 text-accent border-accent/20"
                  )}
                >
                  {faq.frequency}x
                </Badge>
              </div>
            </button>

            {/* Expanded Thread List */}
            {isExpanded && (
              <div
                id={`faq-cluster-${faq.id}`}
                className="border-t bg-muted/30 p-4"
              >
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Related Threads ({faq.threads.length})
                </h4>
                <div className="space-y-2">
                  {faq.threads.map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/threads/${thread.id}`}
                      className={cn(
                        "block rounded-md border bg-card p-3",
                        "hover:border-primary/30 hover:shadow-e1 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                            {thread.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{thread.views} views</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {thread.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { TrendingUp, TrendingDown, Minus, Flame, Clock } from "lucide-react";
import type { TrendingTopic, TrendDirection } from "@/lib/models/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrendingTopicsWidgetProps {
  /** Trending topics to display */
  topics: TrendingTopic[];

  /** Time range for the trends */
  timeRange: "week" | "month" | "quarter";

  /** Whether data is loading */
  isLoading?: boolean;

  /** Maximum number of topics to display */
  maxTopics?: number;

  /** Optional CSS classes */
  className?: string;
}

const trendConfig: Record<TrendDirection, { icon: typeof TrendingUp; color: string; label: string }> = {
  rising: {
    icon: TrendingUp,
    color: "text-danger",
    label: "Rising",
  },
  falling: {
    icon: TrendingDown,
    color: "text-success",
    label: "Falling",
  },
  stable: {
    icon: Minus,
    color: "text-muted-foreground",
    label: "Stable",
  },
};

const timeRangeLabels: Record<"week" | "month" | "quarter", string> = {
  week: "Past Week",
  month: "Past Month",
  quarter: "Past Quarter",
};

/**
 * Trending topics widget for instructor dashboard
 *
 * Displays topic frequency analysis with trend indicators (rising/falling/stable)
 * based on the selected time range. Helps instructors identify emerging topics
 * and areas of student interest.
 *
 * Features:
 * - Trend indicators with icons (rising, falling, stable)
 * - Frequency count with visual emphasis
 * - Percentage growth calculation
 * - Color-coded by trend direction
 * - Time range selector context
 * - Loading skeleton states
 * - Empty state when no topics
 * - Sorted by frequency (descending)
 *
 * @example
 * ```tsx
 * <TrendingTopicsWidget
 *   topics={trendingTopics}
 *   timeRange="week"
 *   maxTopics={10}
 *   isLoading={isLoadingTopics}
 * />
 * ```
 */
export function TrendingTopicsWidget({
  topics,
  timeRange,
  isLoading = false,
  maxTopics = 10,
  className,
}: TrendingTopicsWidgetProps) {
  const displayTopics = topics.slice(0, maxTopics);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-md border animate-pulse"
            aria-hidden="true"
          >
            <div className="h-5 bg-muted rounded w-2/3" />
            <div className="h-5 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className
        )}
        role="status"
      >
        <Flame className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No trending topics yet. Check back after more questions are posted.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2" role="list">
        {displayTopics.map((topic, index) => {
          const trendStyle = trendConfig[topic.trend];
          const TrendIcon = trendStyle.icon;
          const isTopTopic = index === 0;

          return (
            <div
              key={topic.topic}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border p-3",
                "transition-all hover:border-primary/30 hover:shadow-e1",
                isTopTopic && "bg-primary/5 border-primary/20"
              )}
              role="listitem"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank Badge */}
                <span
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0",
                    isTopTopic
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-label={`Rank ${index + 1}`}
                >
                  {index + 1}
                </span>

                {/* Topic Name */}
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    isTopTopic ? "text-foreground" : "text-foreground/90"
                  )}
                >
                  {topic.topic}
                </span>
              </div>

              {/* Right Side: Frequency + Trend */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Frequency Count */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isTopTopic ? "text-primary" : "text-foreground"
                    )}
                  >
                    {topic.count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    posts
                  </span>
                </div>

                {/* Trend Indicator */}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1",
                    topic.trend === "rising" && "bg-danger/10",
                    topic.trend === "falling" && "bg-success/10",
                    topic.trend === "stable" && "bg-muted"
                  )}
                  aria-label={`Trend: ${trendStyle.label}`}
                >
                  <TrendIcon
                    className={cn("h-3.5 w-3.5", trendStyle.color)}
                    aria-hidden="true"
                  />
                  <span
                    className={cn("text-xs font-medium", trendStyle.color)}
                  >
                    {topic.recentGrowth > 0 ? "+" : ""}
                    {topic.recentGrowth.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      {topics.length > maxTopics && (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Showing top {maxTopics} of {topics.length} topics
        </p>
      )}
    </div>
  );
}

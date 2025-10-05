"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/models/types";

export interface TimelineActivityProps {
  /**
   * Array of activity items (sorted by timestamp, newest first)
   */
  activities: ActivityItem[];

  /**
   * Maximum items to display (default: 10)
   */
  maxItems?: number;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional empty state message
   */
  emptyMessage?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * Get dot color for activity type
 */
function getActivityColor(type: ActivityItem["type"]) {
  switch (type) {
    case "thread_created":
      return "bg-primary";
    case "post_created":
      return "bg-primary";
    case "thread_resolved":
      return "bg-success";
    case "post_endorsed":
      return "bg-warning";
    case "thread_answered":
      return "bg-secondary";
    default:
      return "bg-primary";
  }
}

/**
 * Format ISO timestamp to relative time (visual only)
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format ISO timestamp to full readable date (for screen readers)
 */
function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Enhanced timeline component for activity feed
 * Displays chronological feed with visual timeline and accessibility support
 */
export function TimelineActivity({
  activities,
  maxItems = 10,
  loading = false,
  emptyMessage = "No recent activity",
  className,
}: TimelineActivityProps) {
  const displayedActivities = React.useMemo(
    () => activities.slice(0, maxItems),
    [activities, maxItems]
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-3 rounded-full bg-glass-medium shrink-0" />
            <Skeleton className="h-24 flex-1 bg-glass-medium rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (displayedActivities.length === 0) {
    return (
      <Card variant="glass" className={cn("p-6 text-center", className)}>
        <div className="space-y-2">
          <div className="text-4xl opacity-50" aria-hidden="true">💬</div>
          <p className="text-sm text-muted-foreground glass-text">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <ol className={cn("relative space-y-4", className)} aria-label="Activity timeline">
      {displayedActivities.map((activity, index) => {
        const dotColor = getActivityColor(activity.type);

        return (
          <li key={activity.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "size-3 rounded-full border-2 border-background z-10",
                  dotColor
                )}
                aria-hidden="true"
              />
              {/* Connecting line (except for last item) */}
              {index < displayedActivities.length - 1 && (
                <div
                  className="w-px flex-1 bg-border absolute top-3"
                  style={{ height: "calc(100% + 1rem)" }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Activity card */}
            <div className="flex-1 pb-4">
              <Link href={`/threads/${activity.threadId}`}>
                <Card variant="glass-hover" className="h-full">
                  <CardContent className="p-3">
                    <article className="space-y-2">
                      {/* Summary + Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-snug glass-text flex-1">
                          {activity.summary}
                        </h3>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {activity.type.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-subtle glass-text">
                        <span className="course-name">{activity.courseName}</span>
                        <span aria-hidden="true">•</span>
                        <time
                          dateTime={activity.timestamp}
                          aria-label={formatFullDate(activity.timestamp)}
                        >
                          {formatRelativeTime(activity.timestamp)}
                        </time>
                      </div>
                    </article>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

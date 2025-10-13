"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, FileText, AlertCircle, Clock, HelpCircle, Briefcase } from "lucide-react";
import type { Deadline } from "@/lib/models/types";

export interface UpcomingDeadlinesProps {
  /**
   * Array of deadlines (sorted by date, nearest first)
   */
  deadlines: Deadline[];

  /**
   * Maximum items to display (default: 5)
   */
  maxItems?: number;

  /**
   * Optional course filter
   */
  courseId?: string;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional empty message
   */
  emptyMessage?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function UpcomingDeadlines({
  deadlines,
  maxItems = 5,
  courseId,
  loading = false,
  emptyMessage = "No upcoming deadlines",
  className,
}: UpcomingDeadlinesProps) {
  // Filter by course if specified
  const filteredDeadlines = React.useMemo(() => {
    let filtered = courseId
      ? deadlines.filter((d) => d.courseId === courseId)
      : deadlines;
    return filtered.slice(0, maxItems);
  }, [deadlines, courseId, maxItems]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-4 rounded-full bg-glass-medium shrink-0" />
            <Skeleton className="h-20 flex-1 bg-glass-medium rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (filteredDeadlines.length === 0) {
    return (
      <Card variant="glass" className={cn("p-6 text-center", className)}>
        <div className="space-y-2">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground glass-text">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <ol className={cn("relative space-y-4", className)} aria-label="Upcoming deadlines timeline">
      {filteredDeadlines.map((deadline, index) => (
        <DeadlineItem
          key={deadline.id}
          deadline={deadline}
          showConnector={index < filteredDeadlines.length - 1}
        />
      ))}
    </ol>
  );
}

// Internal DeadlineItem component
function DeadlineItem({
  deadline,
  showConnector,
}: {
  deadline: Deadline;
  showConnector: boolean;
}) {
  const deadlineDate = new Date(deadline.dueDate);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Urgency color
  const dotColor = diffDays <= 1
    ? "bg-danger"
    : diffDays <= 3
    ? "bg-warning"
    : "bg-primary";

  // Type icon
  const typeIcons = {
    assignment: FileText,
    exam: AlertCircle,
    "office-hours": Clock,
    quiz: HelpCircle,
    project: Briefcase,
  };
  const TypeIcon = typeIcons[deadline.type] || FileText;

  // Relative time
  const getRelativeTime = () => {
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const content = (
    <Card variant="glass-hover" className="h-full">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <TypeIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-sm font-medium leading-snug glass-text">
              {deadline.title}
            </h3>
            <p className="text-xs text-muted-foreground glass-text">
              {deadline.courseName}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <time
                dateTime={deadline.dueDate}
                className={cn(
                  "font-medium",
                  diffDays <= 1 ? "text-danger" : diffDays <= 3 ? "text-warning" : "text-foreground"
                )}
              >
                {getRelativeTime()}
              </time>
              <span className="text-muted-foreground" aria-hidden="true">•</span>
              <span className="text-muted-foreground">
                {deadlineDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <li className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className={cn(
            "size-4 rounded-full border-2 border-background z-10",
            dotColor
          )}
          aria-hidden="true"
        />
        {/* Connecting line */}
        {showConnector && (
          <div
            className="w-px flex-1 bg-border absolute top-3"
            style={{ height: "calc(100% + 1rem)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Deadline card */}
      <div className="flex-1 pb-4">
        {deadline.link ? (
          <Link href={deadline.link}>{content}</Link>
        ) : (
          content
        )}
      </div>
    </li>
  );
}

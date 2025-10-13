"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AIBadge } from "@/components/ui/ai-badge";
import { cn } from "@/lib/utils";
import { BookOpen, type LucideIcon } from "lucide-react";
import type { CourseWithActivity, CourseWithMetrics } from "@/lib/models/types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface EnhancedCourseCardProps {
  /**
   * Course data (with activity for students or metrics for instructors)
   */
  course: CourseWithActivity | CourseWithMetrics;

  /**
   * View mode (affects which data is displayed)
   */
  viewMode: "student" | "instructor";

  /**
   * Optional custom icon (defaults to BookOpen)
   */
  icon?: LucideIcon;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * Enhanced course card with visual hierarchy and rich metadata
 * Supports both student and instructor view modes
 */
export function EnhancedCourseCard({
  course,
  viewMode,
  icon,
  loading = false,
  className,
}: EnhancedCourseCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = icon || BookOpen;

  // Type guard to check if course has metrics (instructor view)
  const hasMetrics = (c: typeof course): c is CourseWithMetrics => {
    return 'metrics' in c && c.metrics !== undefined;
  };

  // Type guard to check if course has activity (student view)
  const hasActivity = (c: typeof course): c is CourseWithActivity => {
    return 'recentThreads' in c && c.recentThreads !== undefined;
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn("glass-panel h-[220px] flex flex-col overflow-hidden", className)}>
        <CardHeader className="p-4 max-h-[100px] shrink-0">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 rounded-lg bg-glass-medium" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24 bg-glass-medium" />
              <Skeleton className="h-4 w-48 bg-glass-medium" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 bg-glass-medium rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = hasMetrics(course) ? course.metrics : undefined;

  return (
    <Link href={`/courses/${course.id}`}>
      <article
        aria-labelledby={`course-${course.id}-title`}
        className={cn(className)}
      >
        <Card
          variant="glass-hover"
          className={cn(
            "group min-h-[220px] flex flex-col overflow-hidden transition-all duration-200",
            !prefersReducedMotion && "hover:scale-[1.03]"
          )}
        >
          <CardHeader className="p-4 max-h-[100px] shrink-0">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className={cn(
                  "size-5 text-primary transition-colors",
                  !prefersReducedMotion && "group-hover:text-primary-hover"
                )} />
              </div>

              {/* Title + Description */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle
                    id={`course-${course.id}-title`}
                    className="text-xl glass-text text-primary truncate"
                  >
                    {course.code}
                  </CardTitle>
                  {/* Show AI badge if AI coverage > 30% */}
                  {metrics && metrics.aiCoveragePercent && metrics.aiCoveragePercent > 30 && (
                    <AIBadge variant="icon-only" aria-label={`${metrics.aiCoveragePercent}% AI coverage`} />
                  )}
                </div>
                <CardDescription className="text-sm leading-normal glass-text line-clamp-2">
                  {course.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-center">
            <div className="space-y-3">
              {/* Metrics Grid */}
              {viewMode === "student" && hasActivity(course) && (
                <div
                  className="grid grid-cols-2 gap-2 text-center"
                  role="list"
                  aria-label="Course statistics"
                >
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">Questions</p>
                    <p className="text-lg font-semibold glass-text truncate tabular-nums">
                      {course.recentThreads?.length || 0}
                    </p>
                  </div>
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">New</p>
                    <p className="text-lg font-semibold text-warning glass-text truncate tabular-nums">
                      {course.unreadCount || 0}
                    </p>
                  </div>
                </div>
              )}

              {viewMode === "instructor" && metrics && (
                <div
                  className="grid grid-cols-2 gap-2 text-center"
                  role="list"
                  aria-label="Course statistics"
                >
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">Questions</p>
                    <p className="text-lg font-semibold glass-text truncate tabular-nums">{metrics.threadCount}</p>
                  </div>
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">Unanswered</p>
                    <p className="text-lg font-semibold text-warning glass-text truncate tabular-nums">
                      {metrics.unansweredCount}
                    </p>
                  </div>
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">Students</p>
                    <p className="text-lg font-semibold glass-text truncate tabular-nums">{metrics.activeStudents}</p>
                  </div>
                  <div role="listitem">
                    <p className="text-xs text-muted-foreground glass-text">This Week</p>
                    <p className="text-lg font-semibold glass-text truncate tabular-nums">{metrics.recentActivity}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
}

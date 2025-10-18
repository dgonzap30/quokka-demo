"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, FileText, TrendingUp, Users, Award } from "lucide-react";
import { useInstructorMetrics } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

export interface MetricsDashboardProps {
  /**
   * Course ID to show metrics for
   */
  courseId: string;

  /**
   * Time range for metrics
   * @default 'week'
   */
  timeRange?: 'week' | 'month' | 'quarter' | 'all-time';

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * MetricsDashboard - Shows instructor ROI and engagement metrics
 *
 * Phase 3.4 Component
 *
 * Displays:
 * - Time saved (auto-answered questions)
 * - Citation coverage
 * - Endorsed threads analytics
 * - Top contributors
 * - Top topics
 *
 * @example
 * ```tsx
 * <MetricsDashboard courseId="course-cs101" timeRange="week" />
 * ```
 */
export function MetricsDashboard({
  courseId,
  timeRange = 'week',
  className,
}: MetricsDashboardProps) {
  const { data: metrics, isLoading } = useInstructorMetrics(courseId, timeRange);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          No metrics available for this course.
        </CardContent>
      </Card>
    );
  }

  const timeRangeLabel =
    timeRange === 'week' ? 'This Week' :
    timeRange === 'month' ? 'This Month' :
    timeRange === 'quarter' ? 'This Quarter' :
    'All Time';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Course Metrics</h2>
        <p className="text-muted-foreground">{timeRangeLabel} Overview</p>
      </div>

      {/* ROI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Time Saved */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.timeSavedMinutes} min</div>
            <p className="text-xs text-muted-foreground">
              {metrics.questionsAutoAnswered} questions auto-answered
            </p>
          </CardContent>
        </Card>

        {/* Citation Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citation Coverage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.citationCoverage}%</div>
            <p className="text-xs text-muted-foreground">
              Answers with course materials
            </p>
          </CardContent>
        </Card>

        {/* Endorsed Threads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endorsed Threads</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.endorsedThreadsCount}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.endorsedThreadsViews} total views
            </p>
          </CardContent>
        </Card>

        {/* Total Threads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalThreads}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalReplies} replies
            </p>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              Posted or replied
            </p>
          </CardContent>
        </Card>

        {/* Avg Views Per Endorsed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endorsed Impact</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageViewsPerEndorsed}</div>
            <p className="text-xs text-muted-foreground">
              Avg views per endorsed thread
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      {metrics.topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Most active students in {timeRangeLabel.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topContributors.map((contributor, index) => (
                <div key={contributor.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.threadCount} {contributor.threadCount === 1 ? 'thread' : 'threads'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Topics */}
      {metrics.topTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Topics</CardTitle>
            <CardDescription>Most discussed topics in {timeRangeLabel.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.topTopics.map((topic) => (
                <Badge key={topic.tag} variant="outline" className="text-sm">
                  {topic.tag} ({topic.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

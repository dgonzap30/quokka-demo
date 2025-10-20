"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useInstructorDashboard, useInstructorInsights, useFrequentlyAskedQuestions, useTrendingTopics, useBulkEndorseAIAnswers } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, InstructorDashboardData } from "@/lib/models/types";
import { AlertCircle, Users, Clock, BookOpen } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PriorityQueueCard } from "@/components/instructor/priority-queue-card";
import { FAQClustersPanel } from "@/components/instructor/faq-clusters-panel";
import { TrendingTopicsWidget } from "@/components/instructor/trending-topics-widget";
import { QuickSearchBar } from "@/components/instructor/quick-search-bar";
import { BulkActionsToolbar } from "@/components/instructor/bulk-actions-toolbar";
import { InstructorEmptyState } from "@/components/instructor/instructor-empty-state";
import { CourseSelector } from "@/components/instructor/course-selector";
import { MetricsDashboard } from "@/components/instructor/metrics-dashboard";

/**
 * Instructor Dashboard Page
 *
 * Protected route for instructors and TAs only
 * Displays:
 * - Course metrics and analytics
 * - Priority queue of unanswered threads
 * - FAQ clusters
 * - Trending topics
 * - Bulk moderation tools
 */
export default function InstructorPage() {
  // Protect route - only instructors and TAs allowed
  const user = useRequireAuth(["instructor", "ta"]);

  // Fetch dashboard data
  const { data: instructorData, isLoading } = useInstructorDashboard(user?.id);

  // Show loading state
  if (!user || isLoading || !instructorData) {
    return (
      <div className="min-h-screen p-8 md:p-12">
        <div className="container-wide space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
            <Skeleton className="h-8 w-64 bg-glass-medium rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 bg-glass-medium rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <InstructorDashboard data={instructorData} user={user} />;
}

// ============================================
// Instructor Dashboard Component
// ============================================

function InstructorDashboard({ data, user }: { data: InstructorDashboardData; user: User }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week");
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("instructor-selected-course");
      if (stored && data.managedCourses.some((c) => c.id === stored)) {
        return stored;
      }
    }
    return undefined; // Default to "All Courses"
  });

  // Persist selected course to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedCourseId) {
        localStorage.setItem("instructor-selected-course", selectedCourseId);
      } else {
        localStorage.removeItem("instructor-selected-course");
      }
    }
  }, [selectedCourseId]);

  // Fetch instructor-specific data
  const userId = user.id;
  // Use selected course, or first managed course, or fallback
  const courseId = selectedCourseId || data.managedCourses[0]?.id || "course-1";

  const { data: insights, isLoading: insightsLoading } = useInstructorInsights(userId);
  const { data: faqs, isLoading: faqsLoading } = useFrequentlyAskedQuestions(courseId);
  const { data: trending, isLoading: trendingLoading } = useTrendingTopics(courseId, timeRange);
  const { mutate: bulkEndorse, isPending: isBulkEndorsing } = useBulkEndorseAIAnswers();

  // Selection management
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === (insights?.length || 0)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(insights?.map((i) => i.thread.id) || []));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <>
      <div id="main-content" className="container-wide space-y-8 p-4 md:p-6">
        {/* Hero Section with Search */}
        <section aria-labelledby="dashboard-heading" className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <h1 id="dashboard-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">
                  Instructor Dashboard
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                  Triage questions, endorse AI answers, and monitor class engagement
                </p>
              </div>

              {/* Course Selector */}
              {data.managedCourses.length > 1 && (
                <CourseSelector
                  courses={data.managedCourses}
                  selectedCourseId={selectedCourseId}
                  onCourseChange={setSelectedCourseId}
                />
              )}
            </div>

            {/* Quick Search */}
            <QuickSearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
            />
          </section>

        {/* Priority Queue with Bulk Actions */}
        <section aria-labelledby="priority-queue-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 id="priority-queue-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
              Priority Queue
            </h2>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Bulk Actions Toolbar */}
          {insights && insights.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedIds.size}
              totalCount={insights.length}
              isAllSelected={selectedIds.size === insights.length}
              onToggleAll={toggleAll}
              onClearSelection={clearSelection}
              onBulkEndorse={() => {
                const aiAnswerIds = insights
                  .filter((i) => selectedIds.has(i.thread.id) && i.aiAnswer)
                  .map((i) => i.aiAnswer!.id);
                bulkEndorse({ aiAnswerIds, userId });
              }}
              isLoading={isBulkEndorsing}
            />
          )}

          {/* Priority Queue Cards */}
          {insightsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 10).map((insight) => (
                <PriorityQueueCard
                  key={insight.thread.id}
                  insight={insight}
                  isSelected={selectedIds.has(insight.thread.id)}
                  onSelectionChange={() => toggleSelection(insight.thread.id)}
                  isLoading={isBulkEndorsing}
                />
              ))}
            </div>
          ) : (
            <InstructorEmptyState
              variant="all-done"
              title="All Caught Up!"
              description="No questions need your attention right now. Great work!"
            />
          )}
        </section>

        {/* Two-Column Layout: FAQs + Trending Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* FAQ Clusters */}
          <section aria-labelledby="faq-heading" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="faq-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
                Frequently Asked Questions
              </h2>
              {!faqsLoading && faqs && faqs.length > 0 && (
                <Badge variant="outline" className="shrink-0">
                  {faqs.length} {faqs.length === 1 ? 'cluster' : 'clusters'}
                </Badge>
              )}
            </div>
            <FAQClustersPanel
              faqs={faqs || []}
              isLoading={faqsLoading}
            />
          </section>

          {/* Trending Topics */}
          <section aria-labelledby="trending-heading" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="trending-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
                Trending Topics
              </h2>
              <Badge variant="outline" className="flex items-center gap-1.5 shrink-0">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {timeRange === "week" ? "Past Week" : timeRange === "month" ? "Past Month" : "Past Quarter"}
              </Badge>
            </div>
            <TrendingTopicsWidget
              topics={trending || []}
              timeRange={timeRange}
              isLoading={trendingLoading}
              maxTopics={10}
            />
          </section>
        </div>

        {/* ROI Metrics Dashboard - Phase 3.4 */}
        <section aria-labelledby="roi-metrics-heading" className="space-y-6">
          <h2 id="roi-metrics-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            ROI & Engagement Metrics
          </h2>
          <MetricsDashboard
            courseId={courseId}
            timeRange={timeRange}
          />
        </section>

        {/* Stats Overview */}
        <section aria-labelledby="instructor-stats-heading" className="space-y-6">
          <h2 id="instructor-stats-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label={data.stats.totalCourses.label}
              value={data.stats.totalCourses.value}
              icon={BookOpen}
              trend={{
                direction: data.stats.totalCourses.trend,
                label: `${data.stats.totalCourses.trendPercent > 0 ? '+' : ''}${data.stats.totalCourses.trendPercent}%`,
              }}
            />
            <StatCard
              label={data.stats.totalThreads.label}
              value={data.stats.totalThreads.value}
              trend={{
                direction: data.stats.totalThreads.trend,
                label: `${data.stats.totalThreads.delta > 0 ? '+' : ''}${data.stats.totalThreads.delta} this week`,
              }}
            />
            <StatCard
              label={data.stats.unansweredThreads.label}
              value={data.stats.unansweredThreads.value}
              icon={AlertCircle}
              trend={{
                direction: data.stats.unansweredThreads.trend,
                label: `${data.stats.unansweredThreads.delta > 0 ? '+' : ''}${data.stats.unansweredThreads.delta} this week`,
              }}
              variant={data.stats.unansweredThreads.value > 5 ? "warning" : "default"}
            />
            <StatCard
              label={data.stats.activeStudents.label}
              value={data.stats.activeStudents.value}
              icon={Users}
              trend={{
                direction: data.stats.activeStudents.trend,
                label: `${data.stats.activeStudents.delta > 0 ? '+' : ''}${data.stats.activeStudents.delta} this week`,
              }}
            />
            <StatCard
              label={data.stats.aiCoverage.label}
              value={data.stats.aiCoverage.value}
              trend={{
                direction: data.stats.aiCoverage.trend,
                label: `${data.stats.aiCoverage.delta > 0 ? '+' : ''}${data.stats.aiCoverage.delta}%`,
              }}
              variant={data.stats.aiCoverage.value >= 70 ? "success" : "accent"}
            />
          </div>
        </section>
      </div>
    </>
  );
}

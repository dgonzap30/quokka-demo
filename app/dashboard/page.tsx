"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useStudentDashboard, useInstructorDashboard } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard Router - Redirects to role-specific dashboard
 *
 * Routes:
 * - Student → displays student dashboard inline
 * - Instructor/TA → displays instructor dashboard inline
 * - Not authenticated → redirects to /login
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Fetch dashboard data based on role
  const { data: studentData, isLoading: studentLoading } = useStudentDashboard(
    user?.role === "student" ? user.id : undefined
  );
  const { data: instructorData, isLoading: instructorLoading } = useInstructorDashboard(
    user?.role === "instructor" || user?.role === "ta" ? user.id : undefined
  );

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  // Loading state
  if (userLoading || (user && (studentLoading || instructorLoading))) {
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

  if (!user) {
    return null;
  }

  // Render role-specific dashboard
  if (user.role === "student" && studentData) {
    return <StudentDashboard data={studentData} user={user} />;
  }

  if ((user.role === "instructor" || user.role === "ta") && instructorData) {
    return <InstructorDashboard data={instructorData} />;
  }

  return null;
}

// ============================================
// Student Dashboard Component
// ============================================

import type { StudentDashboardData, User, QuickActionButton, Deadline, RecommendedThread } from "@/lib/models/types";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineActivity } from "@/components/dashboard/timeline-activity";
import { EnhancedCourseCard } from "@/components/dashboard/enhanced-course-card";
import { StudyStreakCard } from "@/components/dashboard/study-streak-card";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { StudentRecommendations } from "@/components/dashboard/student-recommendations";
import { BookOpen, MessageSquare, ThumbsUp, MessageSquarePlus, Bell, Search } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  // Compute streak from activity
  const streakData = useMemo(() => {
    const sortedActivity = [...data.recentActivity].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let streakDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const activity of sortedActivity) {
      const activityDate = new Date(activity.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streakDays) {
        streakDays++;
        currentDate = new Date(activityDate);
      } else {
        break;
      }
    }

    const weeklyActivity = sortedActivity.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      const diffDays = Math.floor(
        (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    }).length;

    return {
      streakDays,
      weeklyActivity,
      goalTarget: data.goals[0]?.target || 5,
    };
  }, [data.recentActivity, data.goals]);

  // Quick actions with dynamic counts
  const quickActions = useMemo<QuickActionButton[]>(() => [
    {
      id: "ask",
      label: "Ask Question",
      icon: MessageSquarePlus,
      href: "/ask",
      variant: "primary",
    },
    {
      id: "browse",
      label: "Browse Threads",
      icon: BookOpen,
      href: "/",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badgeCount: data.unreadCount,
      href: "/notifications",
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      href: "/search",
    },
  ], [data.unreadCount]);

  // Upcoming deadlines (mock data for now)
  const upcomingDeadlines = useMemo<Deadline[]>(() => {
    return data.enrolledCourses.flatMap((course, index) => [
      {
        id: `${course.id}-deadline-${index}-1`,
        title: "Assignment 3 Due",
        courseId: course.id,
        courseName: course.name,
        type: "assignment" as const,
        dueDate: new Date(Date.now() + (2 + index) * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  }, [data.enrolledCourses]);

  // Fetch recommendations (all threads from enrolled courses)
  const { data: allThreads } = useQuery({
    queryKey: ["studentRecommendations", user.id],
    queryFn: async () => {
      const courseIds = data.enrolledCourses.map((c) => c.id);
      const threadsPerCourse = await Promise.all(
        courseIds.map((id) => api.getCourseThreads(id))
      );
      return threadsPerCourse.flat();
    },
    enabled: !!user && data.enrolledCourses.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Filter and rank recommendations
  const recommendations = useMemo<RecommendedThread[]>(() => {
    if (!allThreads) return [];

    // Filter: recent (< 7 days), high engagement (views > 10), not authored by user
    return allThreads
      .filter((thread) => {
        const threadDate = new Date(thread.createdAt);
        const diffDays = Math.floor((Date.now() - threadDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && thread.views > 10 && thread.authorId !== user.id;
      })
      .map((thread) => {
        const course = data.enrolledCourses.find((c) => c.id === thread.courseId);
        let reason: "high-engagement" | "trending" | "unanswered" | "similar-interests";
        if (thread.views > 50) {
          reason = "high-engagement";
        } else if (thread.status === "open") {
          reason = "unanswered";
        } else {
          reason = "similar-interests";
        }
        return {
          thread,
          courseName: course?.name || "Unknown Course",
          relevanceScore: thread.views * 2 + (thread.hasAIAnswer ? 10 : 0),
          reason,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [allThreads, data.enrolledCourses, user.id]);

  return (
    <>
      <main id="main-content" className="min-h-screen p-4 md:p-6">
        <div className="container-wide space-y-8">
          {/* Hero Section */}
          <section aria-labelledby="welcome-heading" className="py-4 md:py-6 space-y-4">
            <div className="space-y-3">
              <h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold glass-text">Welcome back, {user.name}!</h1>
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Your academic dashboard - track your courses, recent activity, and stay updated
            </p>
          </div>
        </section>

        {/* Engagement Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StudyStreakCard {...streakData} />
          <QuickActionsPanel actions={quickActions} />
          <UpcomingDeadlines deadlines={upcomingDeadlines} maxItems={3} />
        </div>

        {/* Main Content - Courses First */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses - 2 columns on large screens */}
          <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-4">
            <h2 id="courses-heading" className="text-2xl md:text-3xl font-bold glass-text">My Courses</h2>
            {data.enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.enrolledCourses.map((course) => (
                  <EnhancedCourseCard
                    key={course.id}
                    course={course}
                    viewMode="student"
                  />
                ))}
              </div>
            ) : (
              <Card variant="glass" className="p-6 text-center">
                <div className="space-y-3">
                  <div className="text-4xl opacity-50" aria-hidden="true">📚</div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">No Courses Yet</h3>
                    <p className="text-muted-foreground glass-text">You&apos;re not enrolled in any courses</p>
                  </div>
                </div>
              </Card>
            )}
          </section>

          {/* Activity Feed - 1 column on large screens */}
          <aside aria-labelledby="activity-heading" className="space-y-4">
            <h2 id="activity-heading" className="text-2xl md:text-3xl font-bold glass-text">Recent Activity</h2>
            <TimelineActivity
              activities={data.recentActivity}
              maxItems={5}
              emptyMessage="No recent activity"
            />
          </aside>
        </div>

        {/* Recommendations Section */}
        <section aria-labelledby="recommendations-heading" className="space-y-4">
          <h2 id="recommendations-heading" className="text-2xl md:text-3xl font-bold glass-text">
            Recommended for You
          </h2>
          <StudentRecommendations recommendations={recommendations} maxItems={6} />
        </section>

        {/* Stats Overview */}
        <section aria-labelledby="stats-heading" className="space-y-6">
          <h2 id="stats-heading" className="text-2xl md:text-3xl font-bold glass-text">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label={data.stats.totalCourses.label}
              value={data.stats.totalCourses.value}
              icon={BookOpen}
              trend={{
                direction: data.stats.totalCourses.trend,
                label: `${data.stats.totalCourses.trendPercent > 0 ? '+' : ''}${data.stats.totalCourses.trendPercent}%`,
              }}
              sparklineData={data.stats.totalCourses.sparkline}
              sparklineTooltip="7-day trend"
            />
            <StatCard
              label={data.stats.totalThreads.label}
              value={data.stats.totalThreads.value}
              trend={{
                direction: data.stats.totalThreads.trend,
                label: `${data.stats.totalThreads.delta > 0 ? '+' : ''}${data.stats.totalThreads.delta} this week`,
              }}
              sparklineData={data.stats.totalThreads.sparkline}
              sparklineTooltip="7-day trend"
            />
            <StatCard
              label={data.stats.totalPosts.label}
              value={data.stats.totalPosts.value}
              icon={MessageSquare}
              trend={{
                direction: data.stats.totalPosts.trend,
                label: `${data.stats.totalPosts.delta > 0 ? '+' : ''}${data.stats.totalPosts.delta} this week`,
              }}
              sparklineData={data.stats.totalPosts.sparkline}
              sparklineTooltip="7-day trend"
            />
            <StatCard
              label={data.stats.endorsedPosts.label}
              value={data.stats.endorsedPosts.value}
              icon={ThumbsUp}
              trend={{
                direction: data.stats.endorsedPosts.trend,
                label: `${data.stats.endorsedPosts.delta > 0 ? '+' : ''}${data.stats.endorsedPosts.delta} this week`,
              }}
              sparklineData={data.stats.endorsedPosts.sparkline}
              sparklineTooltip="7-day trend"
              variant={data.stats.endorsedPosts.value > 0 ? "success" : "default"}
            />
          </div>
        </section>
        </div>
      </main>
    </>
  );
}

// ============================================
// Instructor Dashboard Component
// ============================================

import type { InstructorDashboardData } from "@/lib/models/types";
import { useState } from "react";
import { AlertCircle, Users, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// New instructor components
import { PriorityQueueCard } from "@/components/instructor/priority-queue-card";
import { FAQClustersPanel } from "@/components/instructor/faq-clusters-panel";
import { TrendingTopicsWidget } from "@/components/instructor/trending-topics-widget";
import { QuickSearchBar } from "@/components/instructor/quick-search-bar";
import { BulkActionsToolbar } from "@/components/instructor/bulk-actions-toolbar";
import { InstructorEmptyState } from "@/components/instructor/instructor-empty-state";
import { CourseSelector } from "@/components/instructor/course-selector";

// Hooks
import {
  useInstructorInsights,
  useFrequentlyAskedQuestions,
  useTrendingTopics,
  useBulkEndorseAIAnswers,
} from "@/lib/api/hooks";

function InstructorDashboard({ data }: { data: InstructorDashboardData }) {
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
  // TODO: Get actual user ID from current user context
  const userId = "instructor-1";
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
      <main id="main-content" className="min-h-screen p-4 md:p-6">
        <div className="container-wide space-y-8">
          {/* Hero Section with Search */}
          <section aria-labelledby="dashboard-heading" className="py-4 md:py-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <h1 id="dashboard-heading" className="text-4xl md:text-5xl font-bold glass-text">
                  Instructor Dashboard
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
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
            <h2 id="priority-queue-heading" className="text-2xl md:text-3xl font-bold glass-text">
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
              <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold glass-text">
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
              <h2 id="trending-heading" className="text-2xl md:text-3xl font-bold glass-text">
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

        {/* Stats Overview */}
        <section aria-labelledby="instructor-stats-heading" className="space-y-6">
          <h2 id="instructor-stats-heading" className="text-2xl md:text-3xl font-bold glass-text">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      </main>
    </>
  );
}

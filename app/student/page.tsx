"use client";

import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useStudentDashboard } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentDashboardData, User, RecommendedThread } from "@/lib/models/types";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineActivity } from "@/components/dashboard/timeline-activity";
import { EnhancedCourseCard } from "@/components/dashboard/enhanced-course-card";
import { AssignmentQAOpportunities } from "@/components/dashboard/assignment-qa-opportunities";
import { StudentRecommendations } from "@/components/dashboard/student-recommendations";
import { BookOpen, MessageSquare, ThumbsUp } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/**
 * Student Dashboard Page
 *
 * Protected route for students only
 * Displays:
 * - Enrolled courses
 * - Recent activity
 * - Assignment Q&A opportunities
 * - Recommended threads
 * - Statistics
 */
export default function StudentPage() {
  // Protect route - only students allowed
  const user = useRequireAuth(["student"]);

  // Fetch dashboard data
  const { data: studentData, isLoading } = useStudentDashboard(user?.id);

  // Show loading state
  if (!user || isLoading || !studentData) {
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

  return <StudentDashboard data={studentData} user={user} />;
}

// ============================================
// Student Dashboard Component
// ============================================

function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
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
      <div id="main-content" className="container-wide space-y-6 p-4 md:p-6">
        {/* Hero Section */}
        <section aria-labelledby="welcome-heading" className="space-y-3">
          <div className="space-y-2">
            <h1 id="welcome-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">Welcome back, {user.name}!</h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Your Q&A companion - ask questions, help peers, and collaborate with AI
            </p>
          </div>
        </section>

        {/* Main Content - Courses FIRST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses - 2 columns on large screens */}
          <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-4">
            <h2 id="courses-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">My Courses</h2>
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
            <h2 id="activity-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">Recent Activity</h2>
            <TimelineActivity
              activities={data.recentActivity}
              maxItems={5}
              emptyMessage="No recent activity"
            />
          </aside>
        </div>

        {/* Assignment Q&A Opportunities - Full Width */}
        <section aria-labelledby="assignments-heading" className="space-y-4">
          <h2 id="assignments-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Assignment Q&A Opportunities
          </h2>
          <AssignmentQAOpportunities
            assignments={data.assignmentQA}
            maxItems={5}
          />
        </section>

        {/* Recommendations Section */}
        <section aria-labelledby="recommendations-heading" className="space-y-4">
          <h2 id="recommendations-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Recommended for You
          </h2>
          <StudentRecommendations recommendations={recommendations} maxItems={6} />
        </section>

        {/* Stats Overview */}
        <section aria-labelledby="stats-heading" className="space-y-6">
          <h2 id="stats-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </>
  );
}

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

import type { StudentDashboardData, User } from "@/lib/models/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineActivity } from "@/components/dashboard/timeline-activity";
import { EnhancedCourseCard } from "@/components/dashboard/enhanced-course-card";
import { BookOpen, MessageSquare, ThumbsUp } from "lucide-react";
import Link from "next/link";

function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  return (
    <>
      <main id="main-content" className="min-h-screen p-4 md:p-6">
        <div className="container-wide space-y-6">
          {/* Hero Section */}
          <section aria-labelledby="welcome-heading" className="py-4 md:py-6 space-y-3">
            <div className="space-y-2">
              <h1 id="welcome-heading" className="heading-2 glass-text">Welcome back, {user.name}!</h1>
            <p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">
              Your academic dashboard - track your courses, recent activity, and stay updated
            </p>
          </div>
        </section>

        {/* Main Content - Courses First */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses - 2 columns on large screens */}
          <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-4">
            <h2 id="courses-heading" className="heading-3 glass-text">My Courses</h2>
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
            <h2 id="activity-heading" className="heading-3 glass-text">Recent Activity</h2>
            <TimelineActivity
              activities={data.recentActivity}
              maxItems={5}
              emptyMessage="No recent activity"
            />
          </aside>
        </div>

        {/* Stats Overview */}
        <section aria-labelledby="stats-heading" className="space-y-4">
          <h2 id="stats-heading" className="heading-3 glass-text">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              label={data.stats.totalPosts.label}
              value={data.stats.totalPosts.value}
              icon={MessageSquare}
              trend={{
                direction: data.stats.totalPosts.trend,
                label: `${data.stats.totalPosts.delta > 0 ? '+' : ''}${data.stats.totalPosts.delta} this week`,
              }}
            />
            <StatCard
              label={data.stats.endorsedPosts.label}
              value={data.stats.endorsedPosts.value}
              icon={ThumbsUp}
              trend={{
                direction: data.stats.endorsedPosts.trend,
                label: `${data.stats.endorsedPosts.delta > 0 ? '+' : ''}${data.stats.endorsedPosts.delta} this week`,
              }}
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
import { AlertCircle, Users } from "lucide-react";

function InstructorDashboard({ data }: { data: InstructorDashboardData }) {
  return (
    <>
      <main id="main-content" className="min-h-screen p-4 md:p-6">
        <div className="container-wide space-y-6">
          {/* Hero Section */}
          <section aria-labelledby="dashboard-heading" className="py-4 md:py-6 space-y-3">
            <div className="space-y-2">
              <h1 id="dashboard-heading" className="heading-2 glass-text">Instructor Dashboard</h1>
            <p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">
              Manage your courses, monitor student engagement, and address unanswered questions
            </p>
          </div>
        </section>

        {/* Main Content - Courses First */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Managed Courses - 2 columns */}
          <section aria-labelledby="managed-courses-heading" className="lg:col-span-2 space-y-4">
            <h2 id="managed-courses-heading" className="heading-3 glass-text">Managed Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.managedCourses.map((course) => (
                <EnhancedCourseCard
                  key={course.id}
                  course={course}
                  viewMode="instructor"
                />
              ))}
            </div>
          </section>

          {/* Unanswered Queue - 1 column */}
          <aside aria-labelledby="unanswered-queue-heading" className="space-y-4">
            <h2 id="unanswered-queue-heading" className="heading-3 glass-text">Unanswered Queue</h2>
            {data.unansweredQueue.length > 0 ? (
              <div className="space-y-3">
                {data.unansweredQueue.slice(0, 5).map((thread) => (
                  <Link key={thread.id} href={`/threads/${thread.id}`}>
                    <Card variant="glass-hover">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium leading-snug line-clamp-2">{thread.title}</p>
                          <div className="flex items-center justify-between text-xs text-subtle">
                            <span>{thread.views} views</span>
                            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card variant="glass" className="p-6 text-center">
                <div className="space-y-2">
                  <div className="text-4xl opacity-50" aria-hidden="true">✅</div>
                  <p className="text-sm text-muted-foreground glass-text">All caught up!</p>
                </div>
              </Card>
            )}
          </aside>
        </div>

        {/* Stats Overview */}
        <section aria-labelledby="instructor-stats-heading" className="space-y-4">
          <h2 id="instructor-stats-heading" className="heading-3 glass-text">Your Statistics</h2>
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

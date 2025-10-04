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
    return <InstructorDashboard data={instructorData} user={user} />;
  }

  return null;
}

// ============================================
// Student Dashboard Component
// ============================================

import type { StudentDashboardData, User } from "@/lib/models/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">
        {/* Hero Section */}
        <div className="py-8 md:py-12 space-y-6">
          <div className="space-y-4">
            <h1 className="heading-2 glass-text">Welcome back, {user.name}!</h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Your academic dashboard - track your courses, recent activity, and stay updated
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.totalCourses}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Threads</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.totalThreads}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Replies</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.totalPosts}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Endorsed</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.endorsedPosts}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="heading-3 glass-text">My Courses</h2>
            {data.enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.enrolledCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card variant="glass-hover" className="h-full">
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <CardTitle className="text-xl glass-text">{course.code}</CardTitle>
                            <CardDescription className="text-base leading-relaxed">
                              {course.name}
                            </CardDescription>
                          </div>
                          {course.unreadCount > 0 && (
                            <Badge variant="default" className="shrink-0">
                              {course.unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <div className="space-y-3">
                          {course.recentThreads.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Recent threads:</p>
                              {course.recentThreads.slice(0, 2).map((thread) => (
                                <p key={thread.id} className="text-sm text-subtle truncate">
                                  • {thread.title}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No recent activity</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card variant="glass" className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-5xl opacity-50">📚</div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Courses Yet</h3>
                    <p className="text-muted-foreground">You're not enrolled in any courses</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Activity Feed - 1 column on large screens */}
          <div className="space-y-6">
            <h2 className="heading-3 glass-text">Recent Activity</h2>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <Link key={activity.id} href={`/threads/${activity.threadId}`}>
                    <Card variant="glass-hover">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">{activity.summary}</p>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {activity.type.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-subtle">
                            {activity.courseName} • {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card variant="glass" className="p-8 text-center">
                <div className="space-y-2">
                  <div className="text-4xl opacity-50">💬</div>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Instructor Dashboard Component
// ============================================

import type { InstructorDashboardData } from "@/lib/models/types";

function InstructorDashboard({ data, user }: { data: InstructorDashboardData; user: User }) {
  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">
        {/* Hero Section */}
        <div className="py-8 md:py-12 space-y-6">
          <div className="space-y-4">
            <h1 className="heading-2 glass-text">Instructor Dashboard</h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Manage your courses, monitor student engagement, and address unanswered questions
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.totalCourses}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Threads</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.totalThreads}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Unanswered</p>
                  <p className="text-3xl font-bold text-warning">{data.stats.unansweredThreads}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-3xl font-bold glass-text">{data.stats.activeStudents}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Managed Courses - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="heading-3 glass-text">Managed Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.managedCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card variant="glass-hover" className="h-full">
                    <CardHeader className="p-6">
                      <div className="space-y-2">
                        <CardTitle className="text-xl glass-text">{course.code}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {course.name}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Threads</p>
                          <p className="font-semibold">{course.metrics.threadCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unanswered</p>
                          <p className="font-semibold text-warning">{course.metrics.unansweredCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Students</p>
                          <p className="font-semibold">{course.metrics.activeStudents}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Week</p>
                          <p className="font-semibold">{course.metrics.recentActivity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Unanswered Queue - 1 column */}
          <div className="space-y-6">
            <h2 className="heading-3 glass-text">Unanswered Queue</h2>
            {data.unansweredQueue.length > 0 ? (
              <div className="space-y-4">
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
              <Card variant="glass" className="p-8 text-center">
                <div className="space-y-2">
                  <div className="text-4xl opacity-50">✅</div>
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

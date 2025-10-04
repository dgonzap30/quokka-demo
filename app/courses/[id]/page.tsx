"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, MessageSquare, Users, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadCard } from "@/components/thread-card";
import {
  useCourseThreads,
  useCourseMetrics,
  useCurrentUser,
} from "@/lib/api/hooks";
import { getCourses } from "@/lib/store/localStore";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { data: user } = useCurrentUser();

  // Get course from local storage (in real app, would use API)
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);

  const { data: threads = [], isLoading: threadsLoading } = useCourseThreads(courseId);
  const { data: metrics, isLoading: metricsLoading } = useCourseMetrics(courseId);

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-6">
            The course you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/courses"
            className="text-primary hover:underline font-medium"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/courses" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{course.code}</span>
      </nav>

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{course.code}</h1>
              <Badge
                variant={course.status === "active" ? "secondary" : "outline"}
                className="capitalize"
              >
                {course.status}
              </Badge>
            </div>
            <h2 className="text-xl text-muted-foreground font-medium mb-1">
              {course.name}
            </h2>
            <p className="text-sm text-muted-foreground">{course.term}</p>
          </div>
        </div>

        {/* Course Metrics */}
        {metricsLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.threadCount}</div>
                    <div className="text-xs text-muted-foreground">Total Threads</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-warning" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.unansweredCount}</div>
                    <div className="text-xs text-muted-foreground">Unanswered</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-secondary" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.activeStudents}</div>
                    <div className="text-xs text-muted-foreground">Active Students</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-success" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.recentActivity}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Threads Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Discussion Threads</h3>
          <Link
            href="/ask"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ask Question →
          </Link>
        </div>

        {threadsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">No threads yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to ask a question in this course!
              </p>
              <Link
                href="/ask"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
              >
                Ask First Question
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                linkPrefix={
                  user?.role === "instructor"
                    ? "/instructor/threads"
                    : "/student/threads"
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

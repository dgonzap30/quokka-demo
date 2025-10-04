"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, MessageSquare, Users, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadCard } from "@/components/thread-card";
import {
  useCourseThreads,
  useCourseMetrics,
  useCourseInsights,
} from "@/lib/api/hooks";
import { getCourses } from "@/lib/store/localStore";

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  // Get course from local storage (in real app, would use API)
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);

  const { data: threads = [], isLoading: threadsLoading } = useCourseThreads(courseId);
  const { data: metrics, isLoading: metricsLoading } = useCourseMetrics(courseId);
  const { data: insights, isLoading: insightsLoading } = useCourseInsights(courseId);

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
            href="/instructor/courses"
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
        <Link href="/instructor/courses" className="hover:text-foreground transition-colors">
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
            <p className="text-sm text-muted-foreground">{course.term} • {course.enrollmentCount} students</p>
          </div>
        </div>

        {/* Course Metrics */}
        {metricsLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <AlertCircle className="h-8 w-8 text-danger" />
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
                  <MessageSquare className="h-8 w-8 text-success" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.answeredCount}</div>
                    <div className="text-xs text-muted-foreground">Answered</div>
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

      {/* AI Insights Panel */}
      {insights && !insightsLoading && (
        <Card variant="ai" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              AI Course Insights
            </CardTitle>
            <CardDescription>{insights.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.topQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Top Questions</h4>
                <ul className="space-y-1 text-sm">
                  {insights.topQuestions.slice(0, 3).map((question, i) => (
                    <li key={i} className="text-muted-foreground">• {question}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.trendingTopics.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Trending Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.trendingTopics.map((topic, i) => (
                    <Badge key={i} variant="outline">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Threads Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Discussion Threads</h3>
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
              <p className="text-sm text-muted-foreground">
                Students haven&apos;t posted any questions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                linkPrefix="/instructor/threads"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

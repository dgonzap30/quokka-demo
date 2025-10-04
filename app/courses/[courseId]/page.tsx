"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCourse, useCourseThreads, useCurrentUser } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Thread } from "@/lib/models/types";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  if (userLoading || courseLoading || threadsLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: Thread["status"]) => {
    const variants = {
      open: "bg-warning/20 text-warning",
      answered: "bg-accent/20 text-accent",
      resolved: "bg-success/20 text-success",
    };
    return variants[status] || variants.open;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/courses" className="hover:text-accent">
              Courses
            </Link>
            <span>/</span>
            <span>{course.code}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary glass-text">{course.name}</h1>
              <p className="text-muted-foreground mt-2">{course.description}</p>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span>{course.term}</span>
                <span>•</span>
                <span>{course.enrollmentCount} students</span>
              </div>
            </div>
            <Link href={`/ask?courseId=${courseId}`}>
              <Button variant="glass-primary">Ask Question</Button>
            </Link>
          </div>
        </div>

        {/* Threads List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Discussion Threads</h2>
          {threads && threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map((thread) => (
                <Link key={thread.id} href={`/threads/${thread.id}`}>
                  <Card variant="glass-hover" className="transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{thread.title}</CardTitle>
                          <CardDescription className="mt-2 line-clamp-2">
                            {thread.content}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadge(thread.status)}>
                          {thread.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{thread.views} views</span>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        {thread.tags && thread.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-2">
                              {thread.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-12 text-center">
              <p className="text-muted-foreground">
                No threads yet. Be the first to ask a question!
              </p>
              <Link href={`/ask?courseId=${courseId}`}>
                <Button variant="glass-primary" className="mt-4">
                  Ask Question
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

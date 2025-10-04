"use client";

import { useCurrentUser, useUserCourses } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoursesPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses, isLoading: coursesLoading } = useUserCourses(user?.id);

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  if (userLoading || coursesLoading) {
    return (
      <div className="min-h-screen p-8">
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

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">
        {/* Hero Section */}
        <div className="py-8 md:py-12 space-y-6">
          <div className="space-y-4">
            <h1 className="heading-2 glass-text">My Courses</h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Welcome back, {user?.name}! Select a course to view discussions and ask questions.
            </p>
          </div>
        </div>

        {/* Course Grid */}
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card variant="glass-hover" className="h-full">
                  <CardHeader className="p-8">
                    <div className="space-y-3">
                      <CardTitle className="text-2xl glass-text">{course.code}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {course.name}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-subtle">
                      <span>{course.term}</span>
                      <span>•</span>
                      <span>{course.enrollmentCount} students</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-16 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="text-6xl opacity-50">📚</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Courses Yet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You&apos;re not enrolled in any courses yet. Check back after enrolling in a course.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

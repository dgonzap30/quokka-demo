"use client";

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse, useCourseThreads, useCurrentUser } from "@/lib/api/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThreadCard } from "@/components/course/thread-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingQuokka } from "@/components/course/floating-quokka";
import { AskQuestionModal } from "@/components/course/ask-question-modal";
import { FilterRow, type FilterType, type SortOrder } from "@/components/course/filter-row";
import { GraduationCap } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

function CourseDetailContent({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

  // Ask Question modal state
  const [showAskModal, setShowAskModal] = useState(false);

  // Filter and sort state
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Course description collapsed state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Detect modal query parameter
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'ask') {
      setShowAskModal(true);
    }
  }, [searchParams]);

  // Handle modal close - clean up URL
  const handleModalClose = () => {
    setShowAskModal(false);
    // Remove modal param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    const newUrl = params.toString()
      ? `/courses/${courseId}?${params.toString()}`
      : `/courses/${courseId}`;
    router.replace(newUrl);
  };

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  if (userLoading || courseLoading || threadsLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 glass-panel rounded-lg" />
            <Skeleton className="h-12 w-96 glass-panel rounded-lg" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 glass-panel rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card variant="glass" className="p-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="text-6xl opacity-50" aria-hidden="true">🔍</div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Course Not Found</h3>
              <p className="text-muted-foreground leading-relaxed">
                The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="glass-primary" size="lg">
                Back to Courses
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">
        {/* Breadcrumb & Header */}
        <div className="space-y-8">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: course.code, icon: <GraduationCap className="h-3 w-3" /> }
            ]}
          />

          {/* Course Hero */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-4 flex-wrap">
              <h1 className="heading-2 glass-text">{course.name}</h1>
              <span className="text-sm text-subtle glass-text">
                {course.enrollmentCount} students enrolled
              </span>
            </div>

            {isDescriptionExpanded && (
              <p className="text-base text-muted-foreground glass-text leading-relaxed max-w-3xl">
                {course.description}
              </p>
            )}

            {course.description && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-sm text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 transition-colors"
                aria-expanded={isDescriptionExpanded}
                aria-controls="course-description"
              >
                {isDescriptionExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <FilterRow
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Threads Section */}
        <div className="space-y-4">
          {threads && threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} variant="compact" />
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center">
                  <div className="text-5xl opacity-50" aria-hidden="true">💬</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Threads Yet</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Be the first to start a discussion in this course!
                  </p>
                </div>
                <Link href={`/ask?courseId=${courseId}`}>
                  <Button variant="glass-primary" size="default">
                    Ask First Question
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Floating Quokka AI Agent */}
        <FloatingQuokka
          courseId={course.id}
          courseName={course.name}
          courseCode={course.code}
        />
      </div>

      {/* Ask Question Modal */}
      <AskQuestionModal
        courseId={course.id}
        courseName={course.name}
        isOpen={showAskModal}
        onClose={handleModalClose}
        onSuccess={(threadId) => {
          handleModalClose();
          router.push(`/threads/${threadId}`);
        }}
      />
    </div>
  );
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 glass-panel rounded-lg" />
            <Skeleton className="h-12 w-96 glass-panel rounded-lg" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 glass-panel rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}

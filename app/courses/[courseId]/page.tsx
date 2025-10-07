"use client";

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse, useCourseThreads, useCurrentUser } from "@/lib/api/hooks";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingQuokka } from "@/components/course/floating-quokka";
import { AskQuestionModal } from "@/components/course/ask-question-modal";
import { SidebarLayout } from "@/components/course/sidebar-layout";
import { ThreadSidebar } from "@/components/course/thread-sidebar";
import { ThreadDetailPanel } from "@/components/course/thread-detail-panel";

function CourseDetailContent({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

  // Ask Question modal state
  const [showAskModal, setShowAskModal] = useState(false);

  // Selected thread state (from URL param)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Detect modal and thread query parameters
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    const threadParam = searchParams.get('thread');

    if (modalParam === 'ask') {
      setShowAskModal(true);
    }

    if (threadParam) {
      setSelectedThreadId(threadParam);
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

  // Handle thread selection - sync with URL
  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);

    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set('thread', threadId);
    const newUrl = `/courses/${courseId}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
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
    <>
      {/* Gmail-Style Sidebar Layout */}
      <SidebarLayout
        courseId={courseId}
        initialThreadId={selectedThreadId}
        sidebar={
          <ThreadSidebar
            courseId={courseId}
            threads={threads || []}
            selectedThreadId={selectedThreadId}
            onThreadSelect={handleThreadSelect}
            isLoading={threadsLoading}
          />
        }
      >
        {/* Main Content: Thread Detail Panel */}
        <ThreadDetailPanel
          threadId={selectedThreadId}
          onClose={() => {
            setSelectedThreadId(null);
            // Remove thread param from URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('thread');
            const newUrl = params.toString()
              ? `/courses/${courseId}?${params.toString()}`
              : `/courses/${courseId}`;
            window.history.replaceState(null, '', newUrl);
          }}
        />

        {/* Floating Quokka AI Agent */}
        <FloatingQuokka
          courseId={course.id}
          courseName={course.name}
          courseCode={course.code}
        />
      </SidebarLayout>

      {/* Ask Question Modal */}
      <AskQuestionModal
        courseId={course.id}
        courseName={course.name}
        isOpen={showAskModal}
        onClose={handleModalClose}
        onSuccess={(threadId) => {
          handleModalClose();
          handleThreadSelect(threadId); // Select the new thread inline
        }}
      />
    </>
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

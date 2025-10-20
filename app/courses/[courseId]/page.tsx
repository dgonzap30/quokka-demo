"use client";

import { use, useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse, useCourseThreads, useCurrentUser } from "@/lib/api/hooks";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AskQuestionModal } from "@/components/course/ask-question-modal";
import { SidebarLayout } from "@/components/course/sidebar-layout";
import { FilterSidebar } from "@/components/course/filter-sidebar";
import { ThreadListSidebar } from "@/components/course/thread-list-sidebar";
import { ThreadDetailPanel } from "@/components/course/thread-detail-panel";
import { CourseOverviewPanel } from "@/components/course/course-overview-panel";
import { MobileFilterSheet } from "@/components/course/mobile-filter-sheet";
import type { FilterType } from "@/components/course/sidebar-filter-panel";
import type { TagWithCount } from "@/components/course/tag-cloud";

// Lazy load ThreadModal (mobile only, conditionally rendered)
const ThreadModal = dynamic(
  () => import("@/components/course/thread-modal").then(mod => ({ default: mod.ThreadModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-background rounded-lg p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-96" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

function CourseDetailContent({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

  // Ask Question modal state
  const [showAskModal, setShowAskModal] = useState(false);

  // Active tab state: read from URL, default to "threads"
  const activeTab = (searchParams.get('tab') === 'overview' ? 'overview' : 'threads') as "threads" | "overview";

  // Selected thread state (from URL param)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Filter state (lifted from sidebars)
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mobile filter sheet state
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  // Viewport detection for responsive thread display
  // Mobile (< 768px): Thread detail in modal
  // Desktop (≥ 768px): Thread detail inline in third column (Gmail-style)
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Determine rendering mode: modal (mobile) or inline (desktop)
  // During SSR and first render, default to desktop (inline) to prevent hydration mismatch
  const shouldUseModal = isMounted && isMobile;

  // Extract tags with counts from all threads
  const tagsWithCounts = useMemo<TagWithCount[]>(() => {
    if (!threads) return [];

    const tagMap = new Map<string, number>();
    threads.forEach((thread) => {
      thread.tags?.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [threads]);

  // Apply all filters to get filtered threads
  const filteredThreads = useMemo(() => {
    if (!threads) return [];

    let filtered = [...threads];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((thread) =>
        thread.title.toLowerCase().includes(query) ||
        thread.content.toLowerCase().includes(query) ||
        thread.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter with AI-powered options
    if (activeFilter === "instructor-endorsed") {
      // Show only threads with instructor-endorsed AI answers
      filtered = filtered.filter((thread) => thread.aiAnswer?.instructorEndorsed === true);
    } else if (activeFilter === "high-confidence") {
      // Show only threads with high-confidence AI answers
      filtered = filtered.filter((thread) => thread.aiAnswer?.confidenceLevel === "high");
    } else if (activeFilter === "popular") {
      // Show threads with 5+ student endorsements
      const POPULAR_THRESHOLD = 5;
      filtered = filtered.filter((thread) =>
        (thread.aiAnswer?.studentEndorsements ?? 0) >= POPULAR_THRESHOLD
      );
    } else if (activeFilter === "resolved") {
      // Show only resolved threads
      filtered = filtered.filter((thread) => thread.status === "resolved");
    } else if (activeFilter === "my-posts") {
      // Show only user's threads
      filtered = filtered.filter((thread) => thread.authorId === user?.id);
    }
    // "all" filter: no filtering needed

    // Apply tag filter (AND logic - thread must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((thread) =>
        selectedTags.every((tag) => thread.tags?.includes(tag))
      );
    }

    // Sort by newest first
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [threads, searchQuery, activeFilter, selectedTags, user?.id]);

  // Set mounted state for hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  // Toggle selection if clicking the same thread again
  const handleThreadSelect = (threadId: string) => {
    // If clicking the already-selected thread, deselect it
    if (threadId === selectedThreadId) {
      setSelectedThreadId(null);
      // Remove thread param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('thread');
      const newUrl = params.toString()
        ? `/courses/${courseId}?${params.toString()}`
        : `/courses/${courseId}`;
      window.history.replaceState(null, '', newUrl);
      return;
    }

    // Otherwise, select the new thread
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
      {/* Conditional Rendering: Threads View or Overview */}
      {activeTab === "threads" ? (
        <>
          {/* Gmail-Style Double Sidebar Layout */}
          <SidebarLayout
            courseId={courseId}
            initialThreadId={selectedThreadId}
            selectedThreadId={selectedThreadId}
            filterSidebar={
              <FilterSidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                tags={tagsWithCounts}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                totalThreads={threads?.length || 0}
                filteredThreads={filteredThreads.length}
              />
            }
            threadListSidebar={
              <ThreadListSidebar
                threads={filteredThreads}
                selectedThreadId={selectedThreadId}
                onThreadSelect={handleThreadSelect}
                isLoading={threadsLoading}
                currentUserId={user?.id}
                onMobileFilterClick={() => setMobileFilterSheetOpen(true)}
                activeFilterCount={
                  (searchQuery ? 1 : 0) +
                  (activeFilter !== "all" ? 1 : 0) +
                  selectedTags.length
                }
              />
            }
          >
            {/* Thread Detail (Desktop Inline - Gmail Style, ≥ 768px) */}
            {!shouldUseModal && selectedThreadId && (
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
                context="inline"
                className="animate-in fade-in duration-200"
              />
            )}
          </SidebarLayout>

          {/* Thread Detail Modal (Mobile Only - < 768px) */}
          {shouldUseModal && (
            <ThreadModal
              open={!!selectedThreadId}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedThreadId(null);
                  // Remove thread param from URL
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('thread');
                  const newUrl = params.toString()
                    ? `/courses/${courseId}?${params.toString()}`
                    : `/courses/${courseId}`;
                  window.history.replaceState(null, '', newUrl);
                }
              }}
              threadId={selectedThreadId}
            />
          )}

          {/* Mobile Filter Sheet (Mobile Only - < 768px) */}
          {shouldUseModal && (
            <MobileFilterSheet
              open={mobileFilterSheetOpen}
              onOpenChange={setMobileFilterSheetOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              tags={tagsWithCounts}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              totalThreads={threads?.length || 0}
              filteredThreads={filteredThreads.length}
            />
          )}
        </>
      ) : (
        /* Overview Tab: Course stats, resources, activity */
        <div className="min-h-screen">
          <CourseOverviewPanel
            courseId={courseId}
            courseName={course.name}
            threads={threads || []}
            user={user || undefined}
          />
        </div>
      )}

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

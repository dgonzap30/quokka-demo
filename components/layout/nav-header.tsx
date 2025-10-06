"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser, useLogout, useCourse } from "@/lib/api/hooks";
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { CourseContextBar } from "@/components/layout/course-context-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getNavContext } from "@/lib/utils/nav-config";

export function NavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  // Detect navigation context (must be before early returns for hook)
  const navContext = getNavContext(pathname || '');

  // Fetch course data (hook must be called unconditionally, before early returns)
  const { data: course } = useCourse(navContext.courseId);

  // Scroll state for shadow effect
  const [hasScrolled, setHasScrolled] = useState(false);

  // Ask modal state for course context
  const [showAskModal, setShowAskModal] = useState(false);

  // Track scroll position for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 2);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show nav on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  // Determine if we're in a course context
  const inCourseContext = navContext.context === 'course' && course;

  return (
    <>
      {/* Global Navigation Bar (Row 1) */}
      <GlobalNavBar
        user={user}
        onLogout={handleLogout}
        breadcrumb={inCourseContext ? {
          label: course.code,
          href: `/courses/${course.id}`,
        } : undefined}
        onAskQuestion={inCourseContext ? () => setShowAskModal(true) : undefined}
        hasScrolled={hasScrolled}
      />

      {/* Course Context Bar (Row 2) - Only in course pages */}
      {inCourseContext && (
        <CourseContextBar
          courseId={course.id}
          courseCode={course.code}
          courseName={course.name}
          term={course.term}
          studentCount={course.enrollmentCount}
          hasAiCoverage={false}
        />
      )}

      {/* Mobile Navigation - Hamburger Menu */}
      <MobileNav
        currentPath={pathname || ""}
        user={user}
        onLogout={handleLogout}
        items={navContext.items}
        courseContext={inCourseContext ? {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
        } : undefined}
      />

      {/* Ask Question Modal - Course Context Only */}
      {/* TODO: Implement modal component */}
      {showAskModal && inCourseContext && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will integrate with the existing Ask Question form from the course page.
            </p>
            <button
              onClick={() => setShowAskModal(false)}
              className="px-4 py-2 bg-neutral-200 rounded-md hover:bg-neutral-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

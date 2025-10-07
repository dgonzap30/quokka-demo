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

  // Scroll state for shadow effect and progress bar
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll position for shadow effect and progress calculation
  useEffect(() => {
    const handleScroll = () => {
      const sy = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;

      setHasScrolled(sy > 8);
      setScrollProgress(h > 0 ? Math.min(100, Math.max(0, (sy / h) * 100)) : 0);
    };

    // Initial calculation
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
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
        onAskQuestion={inCourseContext ? () => router.push(`/courses/${course.id}?modal=ask`) : undefined}
        hasScrolled={hasScrolled}
        scrollProgress={scrollProgress}
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
          isCompact={hasScrolled}
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
    </>
  );
}

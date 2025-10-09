"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCurrentUser, useLogout, useCourse } from "@/lib/api/hooks";
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { CourseContextBar } from "@/components/layout/course-context-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getNavContext } from "@/lib/utils/nav-config";

export function NavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  // Detect navigation context (must be before early returns for hook)
  const navContext = getNavContext(pathname || '');

  // Fetch course data (hook must be called unconditionally, before early returns)
  const { data: course } = useCourse(navContext.courseId);


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

  // Read active tab from URL (default to "threads")
  const activeTab = (searchParams.get('tab') === 'overview' ? 'overview' : 'threads') as "threads" | "overview";

  // Handle tab change - update URL
  const handleTabChange = (tab: "threads" | "overview") => {
    const params = new URLSearchParams(searchParams.toString());

    if (tab === 'overview') {
      params.set('tab', 'overview');
      // Clear thread selection when switching to overview
      params.delete('thread');
    } else {
      params.delete('tab'); // 'threads' is default
    }

    const newUrl = params.toString()
      ? `/courses/${navContext.courseId}?${params.toString()}`
      : `/courses/${navContext.courseId}`;

    router.push(newUrl);
  };

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
          isCompact={false}
          activeTab={activeTab}
          onTabChange={handleTabChange}
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

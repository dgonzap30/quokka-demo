"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCurrentUser, useLogout, useCourse, useStudentDashboard } from "@/lib/api/hooks";
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { CourseContextBar } from "@/components/layout/course-context-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { QuokkaAssistantModal } from "@/components/ai/quokka-assistant-modal";
import { CourseSelectionModal } from "@/components/course/course-selection-modal";
import { getNavContext } from "@/lib/utils/nav-config";

export function NavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  // AI Assistant Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Courses Modal state (NEW)
  const [coursesModalOpen, setCoursesModalOpen] = useState(false);

  // Detect navigation context (must be before early returns for hook)
  const navContext = getNavContext(pathname || '');

  // Fetch course data (hook must be called unconditionally, before early returns)
  const { data: course } = useCourse(navContext.courseId);

  // Fetch dashboard data for Quokka Points (hook must be called unconditionally)
  const { data: dashboardData } = useStudentDashboard(user?.id || '');

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

  // Determine AI modal context type
  const getAIContextType = (): "dashboard" | "course" | "instructor" => {
    if (pathname?.startsWith("/instructor")) {
      return "instructor";
    }
    if (inCourseContext) {
      return "course";
    }
    return "dashboard";
  };

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
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Global Navigation Bar (Row 1) */}
      <GlobalNavBar
        user={user}
        onLogout={handleLogout}
        breadcrumb={inCourseContext ? {
          label: course.code,
          href: `/courses/${course.id}`,
        } : undefined}
        onAskQuestion={inCourseContext ? () => router.push(`/courses/${course.id}?modal=ask`) : undefined}
        onOpenAIAssistant={() => setAiModalOpen(true)}
        onOpenSupport={() => router.push("/support")}
        quokkaPoints={dashboardData?.quokkaPoints}
        onViewPointsDetails={() => router.push("/points")}
      />

      {/* AI Assistant Modal */}
      <QuokkaAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        pageContext={getAIContextType()}
        currentCourseId={inCourseContext ? course.id : undefined}
        currentCourseName={inCourseContext ? course.name : undefined}
        currentCourseCode={inCourseContext ? course.code : undefined}
        availableCourses={!inCourseContext && dashboardData?.enrolledCourses
          ? dashboardData.enrolledCourses.map(c => ({
              id: c.id,
              code: c.code,
              name: c.name,
              term: c.term,
            }))
          : undefined
        }
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

      {/* Mobile Bottom Navigation - Native App Style */}
      <MobileBottomNav
        currentPath={pathname || ""}
        onNavigateHome={() => router.push("/dashboard")}
        onAskQuestion={inCourseContext ? () => router.push(`/courses/${course.id}?modal=ask`) : undefined}
        onOpenCourses={!inCourseContext ? () => setCoursesModalOpen(true) : undefined}
        onOpenAIAssistant={() => setAiModalOpen(true)}
        onOpenSupport={() => router.push("/support")}
      />

      {/* Courses Selection Modal */}
      <CourseSelectionModal
        open={coursesModalOpen}
        onOpenChange={setCoursesModalOpen}
        courses={dashboardData?.enrolledCourses || []}
      />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { CourseDashboardGrid } from "@/components/course-dashboard-grid";
import {
  useCurrentUser,
  useUserCourses,
  useNotifications,
} from "@/lib/api/hooks";
import type { Notification } from "@/lib/models/types";

export default function CoursesPage() {
  const { data: user } = useCurrentUser();
  const { data: courses = [], isLoading, error } = useUserCourses(user?.id || "");
  const { data: notifications = [] } = useNotifications(user?.id || "");

  // Calculate notification counts per course
  const notificationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((notif: Notification) => {
      if (!notif.read) {
        counts[notif.courseId] = (counts[notif.courseId] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
        <p className="text-muted-foreground">
          {courses.length} {courses.length === 1 ? "course" : "courses"} for{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      <CourseDashboardGrid
        courses={courses}
        notificationCounts={notificationCounts}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

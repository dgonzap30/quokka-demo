import type { Course } from "@/lib/models/types";
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseDashboardGridProps {
  /**
   * Array of courses to display
   */
  courses: Course[];

  /**
   * Notification counts per course
   * Map of courseId -> unread count
   */
  notificationCounts?: Record<string, number>;

  /**
   * Course metrics per course
   * Map of courseId -> metrics object
   */
  metricsMap?: Record<
    string,
    {
      threadCount: number;
      activeStudents: number;
      recentActivity: number;
    }
  >;

  /**
   * Instructor info per course
   * Map of courseId -> instructor array
   */
  instructorsMap?: Record<
    string,
    Array<{
      name: string;
      avatar?: string;
    }>
  >;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CourseDashboardGrid({
  courses,
  notificationCounts = {},
  metricsMap = {},
  instructorsMap = {},
  isLoading = false,
  error = null,
  className,
}: CourseDashboardGridProps) {
  // Loading State
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
          className
        )}
      >
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mb-3">
          <BookOpen className="h-8 w-8 text-danger" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          Failed to load courses
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message}. Please try again.
        </p>
      </div>
    );
  }

  // Empty State
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          No courses found
        </p>
        <p className="text-sm text-muted-foreground">
          You are not enrolled in any courses yet.
        </p>
      </div>
    );
  }

  // Course Grid
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          unreadCount={notificationCounts[course.id] || 0}
          metrics={metricsMap[course.id]}
          instructorAvatars={instructorsMap[course.id] || []}
        />
      ))}
    </div>
  );
}

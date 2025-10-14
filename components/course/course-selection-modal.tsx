"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import type { CourseWithActivity } from "@/lib/models/types";

export interface CourseSelectionModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal open state changes
   * Called with false when modal should close
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Array of enrolled courses to display
   * Comes from dashboardData.enrolledCourses
   */
  courses: CourseWithActivity[];

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * Course Selection Modal - Mobile navigation helper for quick course access
 *
 * Features:
 * - QDS 2.0 glassmorphism styling throughout
 * - Full WCAG 2.2 AA accessibility compliance
 * - Keyboard navigation (Tab, Escape, Enter)
 * - Focus trap within modal (Radix Dialog)
 * - Screen reader announcements
 * - List semantics for course collection
 * - 44px minimum touch targets
 * - Responsive design (360px - 1280px)
 */
export function CourseSelectionModal({
  open,
  onOpenChange,
  courses,
  className,
}: CourseSelectionModalProps) {
  const router = useRouter();

  const handleCourseSelect = (courseId: string) => {
    router.push(`/courses/${courseId}`);
    // Modal will close automatically on route change
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="courses-modal"
        className={cn(
          // Glass Panel Strong
          "glass-panel-strong backdrop-blur-xl border border-glass",
          "shadow-[var(--shadow-glass-lg)]",

          // Size
          "max-w-[90vw] sm:max-w-md md:max-w-lg",
          "max-h-[85vh]",

          // Layout
          "flex flex-col gap-0",

          // Padding
          "p-4 md:p-6",

          // Border Radius
          "rounded-2xl",

          className
        )}
        aria-label="Select a course"
      >
        {/* Header */}
        <DialogHeader className="space-y-2 pb-4 border-b border-glass">
          <DialogTitle className="text-2xl sm:text-3xl font-bold glass-text">
            Select a Course
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground glass-text">
            {courses.length === 0
              ? "You are not enrolled in any courses yet."
              : `Choose a course to view discussions. You are enrolled in ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Empty State */}
        {courses.length === 0 && (
          <div role="status" aria-live="polite" className="py-8">
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="You're not enrolled in any courses. Contact your instructor to get access."
            />
          </div>
        )}

        {/* Course List */}
        {courses.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll py-4">
            <div
              role="list"
              aria-label="Available courses"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {courses.map((course, index) => (
                <article
                  key={course.id}
                  role="listitem"
                  aria-labelledby={`course-modal-${course.id}-title`}
                  aria-posinset={index + 1}
                  aria-setsize={courses.length}
                >
                  <button
                    onClick={() => handleCourseSelect(course.id)}
                    className={cn(
                      // Layout
                      "w-full text-left flex flex-col gap-3 p-4",

                      // Glass Panel
                      "glass-panel backdrop-blur-md border border-glass",

                      // Border Radius
                      "rounded-lg",

                      // Shadow
                      "shadow-[var(--shadow-glass-sm)]",

                      // Hover States
                      "hover:shadow-[var(--shadow-glass-md)]",
                      "hover:border-secondary/20",
                      "hover:scale-[1.02]",

                      // Active State
                      "active:scale-[0.98]",

                      // Reduced Motion
                      "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",

                      // Transitions
                      "transition-all duration-300 ease-out",

                      // Focus Indicator
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60",

                      // Touch Target
                      "min-h-[64px]",

                      // Group for child effects
                      "group"
                    )}
                    aria-label={`${course.code}: ${course.name}${course.unreadCount > 0 ? `. ${course.unreadCount} new ${course.unreadCount === 1 ? 'question' : 'questions'}` : ''}`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="size-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/15 transition-colors">
                        <BookOpen
                          className="size-5 text-secondary group-hover:text-secondary transition-colors"
                          aria-hidden="true"
                        />
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3
                          id={`course-modal-${course.id}-title`}
                          className="text-base font-semibold glass-text text-secondary truncate"
                        >
                          {course.code}
                        </h3>
                        <p className="text-sm text-muted-foreground glass-text line-clamp-2 leading-relaxed">
                          {course.name}
                        </p>
                      </div>
                    </div>

                    {/* Card Metrics */}
                    <div
                      className="flex items-center justify-between text-xs text-muted-foreground"
                      role="list"
                      aria-label="Course statistics"
                    >
                      <div role="listitem">
                        <span className="font-medium tabular-nums">
                          {course.recentThreads?.length || 0}
                        </span>
                        <span className="ml-1">questions</span>
                      </div>
                      {course.unreadCount > 0 && (
                        <div
                          role="listitem"
                          className="flex items-center gap-1.5 text-warning font-medium"
                        >
                          <span
                            className="size-1.5 rounded-full bg-warning animate-pulse"
                            aria-hidden="true"
                          />
                          <span className="tabular-nums">{course.unreadCount} new</span>
                        </div>
                      )}
                    </div>
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

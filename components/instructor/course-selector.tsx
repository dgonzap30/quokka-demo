"use client";

import { GraduationCap } from "lucide-react";
import type { Course } from "@/lib/models/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CourseSelectorProps {
  /** Available courses for the instructor */
  courses: Course[];

  /** Currently selected course ID (undefined for "All Courses") */
  selectedCourseId?: string;

  /** Callback when course selection changes */
  onCourseChange: (courseId: string | undefined) => void;

  /** Optional CSS classes */
  className?: string;
}

/**
 * Course selector dropdown for instructor dashboard
 *
 * Allows instructors to filter dashboard data by specific course
 * when they teach multiple courses. Includes "All Courses" option
 * to view aggregated data across all courses.
 *
 * Features:
 * - "All Courses" option for aggregated view
 * - Course code + name display
 * - Icon indicator for better visibility
 * - Keyboard accessible
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <CourseSelector
 *   courses={managedCourses}
 *   selectedCourseId={selectedCourse}
 *   onCourseChange={setSelectedCourse}
 * />
 * ```
 */
export function CourseSelector({
  courses,
  selectedCourseId,
  onCourseChange,
  className,
}: CourseSelectorProps) {
  // Get selected course details
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Format course display name
  const formatCourseName = (course: Course) => {
    return `${course.code} - ${course.name}`;
  };

  // Handle selection change
  const handleValueChange = (value: string) => {
    if (value === "all") {
      onCourseChange(undefined);
    } else {
      onCourseChange(value);
    }
  };

  return (
    <Select
      value={selectedCourseId || "all"}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        className={cn("min-w-[280px]", className)}
        size="sm"
        aria-label="Select course to filter dashboard"
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue>
            {selectedCourse ? (
              <span className="font-medium">
                {formatCourseName(selectedCourse)}
              </span>
            ) : (
              <span>All Courses</span>
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* All Courses Option */}
        <SelectItem value="all">
          <span className="font-medium">All Courses</span>
        </SelectItem>

        {/* Individual Courses */}
        {courses.length > 0 && courses.map((course) => (
          <SelectItem key={course.id} value={course.id}>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{course.code}</span>
              <span className="text-xs text-muted-foreground">
                {course.name}
              </span>
            </div>
          </SelectItem>
        ))}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No courses available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

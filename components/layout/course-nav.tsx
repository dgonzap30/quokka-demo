"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Course Navigation Component
 *
 * Specialized navigation for course pages with distinct visual styling.
 * Features a back button to return to dashboard and displays course identity.
 *
 * This component is visually distinct from main dashboard navigation with:
 * - Colored background tint (primary/5)
 * - Colored border (primary/20)
 * - Prominent back button
 * - Course code and name display
 */

export interface CourseNavProps {
  /** Course code (e.g., "CS 101") */
  courseCode: string;

  /** Full course name */
  courseName: string;

  /** Optional className for composition */
  className?: string;
}

export function CourseNav({
  courseCode,
  courseName,
  className,
}: CourseNavProps) {
  return (
    <nav
      className={cn(
        "hidden md:flex items-center gap-3 px-4 py-2 rounded-lg",
        "bg-primary/5 border border-primary/20",
        "transition-all duration-200",
        className
      )}
      role="navigation"
      aria-label="Course navigation"
    >
      {/* Back Button */}
      <Link href="/dashboard" className="shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-primary hover:text-primary-hover hover:bg-primary/10"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Button>
      </Link>

      <Separator orientation="vertical" className="h-6" />

      {/* Course Identity */}
      <div className="flex flex-col py-0.5">
        <p className="text-sm font-semibold text-primary leading-tight glass-text">
          {courseCode}
        </p>
        <p className="text-xs text-muted-foreground leading-tight glass-text truncate max-w-[300px]">
          {courseName}
        </p>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseTab {
  /** Tab label */
  label: string;

  /** Tab route */
  href: string;

  /** Whether this tab is active */
  isActive?: boolean;
}

export interface CourseContextBarProps {
  /** Course ID for routing */
  courseId: string;

  /** Course code (e.g., "CS 101") */
  courseCode: string;

  /** Full course name */
  courseName: string;

  /** Course term (e.g., "Fall 2024") */
  term?: string;

  /** Number of students enrolled */
  studentCount?: number;

  /** Whether AI assistance is available (>30% coverage) */
  hasAiCoverage?: boolean;

  /** Optional className for composition */
  className?: string;
}

export function CourseContextBar({
  courseId,
  courseCode,
  courseName,
  term,
  studentCount,
  hasAiCoverage = false,
  className,
}: CourseContextBarProps) {
  const pathname = usePathname();

  // Define course tabs
  const tabs: CourseTab[] = [
    {
      label: "Overview",
      href: `/courses/${courseId}`,
      isActive: pathname === `/courses/${courseId}`,
    },
    {
      label: "Threads",
      href: `/courses/${courseId}#threads`,
      isActive: pathname?.includes(`/courses/${courseId}`) && !pathname?.includes("/resources") && !pathname?.includes("/grades"),
    },
    {
      label: "Resources",
      href: `/courses/${courseId}/resources`,
      isActive: pathname?.includes(`/courses/${courseId}/resources`),
    },
    {
      label: "Grades",
      href: `/courses/${courseId}/grades`,
      isActive: pathname?.includes(`/courses/${courseId}/grades`),
    },
  ];

  return (
    <div
      className={cn(
        "w-full bg-white/70 backdrop-blur-lg border-b border-black/5",
        className
      )}
      role="navigation"
      aria-label="Course navigation"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-12 items-center justify-between gap-4">
          {/* Left Section: Course Info */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-neutral-900">
                  {courseCode}
                </h1>
                {hasAiCoverage && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200"
                    title="AI assistance available"
                  >
                    <Sparkles className="h-3 w-3 text-purple-600" aria-hidden="true" />
                    <span className="text-xs font-medium text-purple-700">
                      AI
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <span>{courseName}</span>
                {term && (
                  <>
                    <span className="text-neutral-400">·</span>
                    <span>{term}</span>
                  </>
                )}
                {studentCount && (
                  <>
                    <span className="text-neutral-400">·</span>
                    <span>{studentCount} students</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Segmented Control Tabs */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                  "min-h-[36px] inline-flex items-center justify-center",
                  tab.isActive
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                )}
                aria-current={tab.isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  /** Whether to show compact mode (reduces height) */
  isCompact?: boolean;

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
  isCompact = false,
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
        "w-full bg-white/70 backdrop-blur-lg border-b border-black/5 transition-[height] duration-200",
        className
      )}
      style={{ height: isCompact ? '40px' : '48px' }}
      role="navigation"
      aria-label="Course navigation"
    >
      <div className="mx-auto max-w-7xl px-6 h-full">
        <div className="flex h-full items-center gap-4">
          {/* Left Section: Course Info (Single Line) */}
          <div className="min-w-0 truncate text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{courseCode}</span>
            <span className="mx-1.5">·</span>
            <span>{courseName}</span>
            {term && (
              <>
                <span className="text-neutral-400 mx-1.5">•</span>
                <span>{term}</span>
              </>
            )}
            {studentCount && (
              <>
                <span className="text-neutral-400 mx-1.5">•</span>
                <span>{studentCount} students</span>
              </>
            )}
            {hasAiCoverage && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                AI Available
              </span>
            )}
          </div>

          {/* Right Section: Underline Tabs */}
          <nav className="ml-auto text-sm" aria-label="Course sections">
            <ul className="flex gap-6">
              {tabs.map((tab) => (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={tab.isActive ? "page" : undefined}
                    className={cn(
                      "group relative py-2 transition-colors duration-200",
                      tab.isActive
                        ? "text-neutral-900 font-medium"
                        : "text-neutral-600 hover:text-neutral-900"
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "absolute left-0 right-0 -bottom-0.5 h-[2px] transition-all duration-200",
                        tab.isActive
                          ? "bg-amber-500 scale-x-100"
                          : "bg-transparent group-hover:bg-neutral-300 group-hover:scale-x-100 scale-x-0"
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

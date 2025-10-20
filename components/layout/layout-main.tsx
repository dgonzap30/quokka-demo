"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface LayoutMainProps {
  children: React.ReactNode;
}

/**
 * LayoutMain - Main content wrapper with dynamic top padding
 *
 * Adjusts padding-top based on navigation context:
 * - Course pages: pt-[104px] (56px GlobalNav + 48px CourseContextBar)
 * - All other pages: pt-14 (56px GlobalNav only)
 *
 * This ensures optimal use of viewport space on non-course pages
 * while maintaining proper spacing for the dual navbar on course pages.
 */
export function LayoutMain({ children }: LayoutMainProps) {
  const pathname = usePathname();

  // Detect if we're in a course context (has CourseContextBar)
  const inCourseContext = pathname?.startsWith("/courses/") && pathname !== "/courses";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        "flex-1 overflow-y-auto sidebar-scroll relative pb-20 md:pb-0 outline-none",
        // Dynamic top padding based on navbar height
        inCourseContext
          ? "pt-[104px]" // Course pages: GlobalNav (56px) + CourseContextBar (48px)
          : "pt-14"       // Other pages: GlobalNav (56px) only
      )}
    >
      {children}
    </main>
  );
}

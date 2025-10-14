"use client";

import { type ReactNode, type ReactElement, useState, useEffect, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export interface SidebarLayoutProps {
  /**
   * Course ID for routing and data fetching
   */
  courseId: string;

  /**
   * Initial thread ID to display (from URL param)
   */
  initialThreadId?: string | null;

  /**
   * Selected thread ID (determines grid layout)
   */
  selectedThreadId?: string | null;

  /**
   * Filter sidebar content (left - search, filters, tags)
   */
  filterSidebar: ReactNode;

  /**
   * Thread list sidebar content (middle - thread list)
   */
  threadListSidebar: ReactNode;

  /**
   * Main content (optional - thread detail now handled by modal)
   */
  children?: ReactNode;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * SidebarLayout - Gmail-style split-pane layout with collapsible sidebar
 *
 * Features:
 * - CSS Grid layout: [sidebar | divider | main-content]
 * - Resizable sidebar (280px min, 400px max, 320px default)
 * - Collapsible with smooth transitions
 * - Mobile: Drawer pattern (overlay sidebar)
 * - Responsive breakpoints: Mobile (<768px), Tablet (768-1023px), Desktop (≥1024px)
 *
 * Layout Structure:
 * ```
 * ┌─────────────┬─┬──────────────────┐
 * │  Sidebar    │▓│  Main Content    │
 * │  320px      │▓│  Fluid           │
 * │             │▓│                  │
 * │  [Filters]  │▓│  [Thread Detail] │
 * │  [Search]   │▓│                  │
 * │  [Threads]  │▓│                  │
 * └─────────────┴─┴──────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <SidebarLayout
 *   courseId="cs101"
 *   initialThreadId="t123"
 *   sidebar={<ThreadSidebar />}
 * >
 *   <ThreadDetailPanel />
 * </SidebarLayout>
 * ```
 */
export function SidebarLayout({
  courseId: _courseId, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialThreadId: _initialThreadId, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedThreadId,
  filterSidebar,
  threadListSidebar,
  children,
  className,
}: SidebarLayoutProps) {
  // Filter sidebar open/close state (thread list is always visible)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport (< 768px = mobile, ≥ 768px = tablet/desktop)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // Auto-close filter sidebar on mobile initially
      if (mobile) {
        setIsFilterSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Toggle filter sidebar handler
  const toggleFilterSidebar = () => setIsFilterSidebarOpen((prev) => !prev);

  // Calculate grid columns based on viewport, filter state, and thread selection
  // Mobile (< 768px): Single column, overlays for filter/detail
  // Tablet (768-1023px): Two-pane (threads + detail), filter as overlay
  // Desktop (1024px+): Three-pane full layout
  const gridCols = (() => {
    // Mobile: Single column (thread list), filter/detail as sheets
    if (isMobile) {
      return "grid-cols-1";
    }

    // No thread selected: 2-column grid (filter + threads)
    if (!selectedThreadId) {
      return isFilterSidebarOpen
        ? "md:grid-cols-[minmax(200px,220px)_1fr] lg:grid-cols-[minmax(200px,220px)_1fr]"
        : "md:grid-cols-[minmax(48px,56px)_1fr] lg:grid-cols-[minmax(48px,56px)_1fr]";
    }

    // Thread selected: 3-column grid (filter + threads + detail)
    return isFilterSidebarOpen
      ? "md:grid-cols-[minmax(200px,220px)_minmax(280px,400px)_1fr]"
      : "md:grid-cols-[minmax(48px,56px)_minmax(280px,400px)_1fr]";
  })();

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        className
      )}
      data-filter-sidebar-open={isFilterSidebarOpen}
    >
      {/* Mobile Overlay (when filter sidebar is open) */}
      {isMobile && isFilterSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsFilterSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Grid Container */}
      <div
        className={cn(
          "grid h-full transition-all duration-300 ease-in-out",
          gridCols
        )}
      >
        {/* Filter Sidebar (Left - 220px) */}
        <aside
          className={cn(
            "relative h-full overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Fixed overlay drawer
            "fixed left-0 top-0 z-50 w-[220px] h-screen md:relative md:z-0 md:w-full md:h-full",
            // Transform for mobile drawer
            isFilterSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          )}
          aria-label="Filter sidebar"
          aria-hidden={!isFilterSidebarOpen}
        >
          {isValidElement(filterSidebar)
            ? cloneElement(filterSidebar as ReactElement<{ onCollapse?: () => void; isOpen?: boolean }>, {
                onCollapse: toggleFilterSidebar,
                isOpen: isFilterSidebarOpen
              })
            : filterSidebar}
        </aside>

        {/* Thread List Sidebar (Middle - Always visible on mobile, responsive on tablet/desktop) */}
        <aside
          className={cn(
            "relative h-full overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Full width, Tablet/Desktop: Responsive width
            "w-full"
          )}
          aria-label="Thread list sidebar"
        >
          {threadListSidebar}
        </aside>

        {/* Main Content Area - Thread detail on desktop */}
        {children && (
          <main
            className={cn(
              "relative h-full overflow-y-auto sidebar-scroll transition-all duration-300 ease-in-out"
            )}
            aria-label="Main content"
          >
            {children}
          </main>
        )}
      </div>
    </div>
  );
}

"use client";

import { type ReactNode, type ReactElement, useState, useEffect, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";

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
   * Main content (thread detail view)
   */
  children: ReactNode;

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
 * - Keyboard shortcuts: Toggle sidebar (Cmd/Ctrl + \\)
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
  // Independent sidebar open/close states (default open on desktop, closed on mobile)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
  const [isThreadListOpen, setIsThreadListOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-close both sidebars on mobile initially
      if (mobile) {
        setIsFilterSidebarOpen(false);
        setIsThreadListOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcuts for sidebar control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + [ → Toggle filter sidebar
        if (e.key === "[") {
          e.preventDefault();
          setIsFilterSidebarOpen((prev) => !prev);
        }
        // Cmd/Ctrl + ] → Toggle thread list (only if no thread selected)
        else if (e.key === "]") {
          e.preventDefault();
          // Only toggle if no thread is selected
          if (!selectedThreadId) {
            setIsThreadListOpen((prev) => !prev);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterSidebarOpen, isThreadListOpen, selectedThreadId]);

  // Toggle sidebar handlers
  const toggleFilterSidebar = () => setIsFilterSidebarOpen((prev) => !prev);
  const toggleThreadList = () => setIsThreadListOpen((prev) => !prev);

  // Calculate grid columns based on sidebar states and thread selection
  // When no thread selected: 2-column grid, thread list fills space
  // When thread selected: 3-column grid, thread list fixed width
  const gridCols = (() => {
    // No thread selected: 2-column grid, thread list expands
    if (!selectedThreadId) {
      if (isFilterSidebarOpen && isThreadListOpen) {
        return "lg:grid-cols-[220px_1fr]"; // Both open, threads expand
      } else if (isFilterSidebarOpen && !isThreadListOpen) {
        return "lg:grid-cols-[220px_56px]"; // Filter open, threads compact
      } else if (!isFilterSidebarOpen && isThreadListOpen) {
        return "lg:grid-cols-[56px_1fr]"; // Filter compact, threads expand
      } else {
        return "lg:grid-cols-[56px_56px]"; // Both compact
      }
    }

    // Thread selected: 3-column grid, thread list fixed width
    if (isFilterSidebarOpen && isThreadListOpen) {
      return "lg:grid-cols-[220px_300px_auto]"; // Both open
    } else if (isFilterSidebarOpen && !isThreadListOpen) {
      return "lg:grid-cols-[220px_56px_auto]"; // Filter open, threads compact
    } else if (!isFilterSidebarOpen && isThreadListOpen) {
      return "lg:grid-cols-[56px_300px_auto]"; // Filter compact, threads open
    } else {
      return "lg:grid-cols-[56px_56px_auto]"; // Both compact
    }
  })();

  return (
    <div
      className={cn(
        "relative min-h-screen w-full",
        className
      )}
      data-filter-sidebar-open={isFilterSidebarOpen}
      data-thread-list-open={isThreadListOpen}
    >
      {/* Mobile Overlay (when any sidebar is open) */}
      {isMobile && (isFilterSidebarOpen || isThreadListOpen) && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setIsFilterSidebarOpen(false);
            setIsThreadListOpen(false);
          }}
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
            "relative h-screen overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Fixed overlay drawer
            "fixed left-0 top-0 z-50 w-[220px] lg:relative lg:z-0 lg:w-full",
            // Transform for mobile drawer
            isFilterSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
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

        {/* Thread List Sidebar (Middle - 300px) */}
        <aside
          className={cn(
            "relative h-screen overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Fixed overlay drawer (offset by filter sidebar width)
            "fixed left-[220px] top-0 z-50 w-[300px] lg:relative lg:left-0 lg:z-0 lg:w-full",
            // Transform for mobile drawer
            isThreadListOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
          aria-label="Thread list sidebar"
          aria-hidden={!isThreadListOpen}
        >
          {isValidElement(threadListSidebar)
            ? cloneElement(threadListSidebar as ReactElement<{ onCollapse?: () => void; isOpen?: boolean }>, {
                onCollapse: toggleThreadList,
                isOpen: isThreadListOpen
              })
            : threadListSidebar}

          {/* Mobile Close Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={() => {
                setIsFilterSidebarOpen(false);
                setIsThreadListOpen(false);
              }}
              aria-label="Close sidebars"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </aside>

        {/* Main Content Area - Only render when thread is selected */}
        {selectedThreadId && (
          <main
            className={cn(
              "relative h-screen overflow-y-auto",
              "transition-all duration-300 ease-in-out"
            )}
            aria-label="Thread content"
          >
            {/* Main Content */}
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

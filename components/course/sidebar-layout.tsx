"use client";

import { type ReactNode, type ReactElement, useState, useEffect, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  courseId,
  initialThreadId,
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
        // Cmd/Ctrl + ] → Toggle thread list
        else if (e.key === "]") {
          e.preventDefault();
          setIsThreadListOpen((prev) => !prev);
        }
        // Cmd/Ctrl + \ → Toggle both sidebars
        else if (e.key === "\\") {
          e.preventDefault();
          const anyOpen = isFilterSidebarOpen || isThreadListOpen;
          setIsFilterSidebarOpen(!anyOpen);
          setIsThreadListOpen(!anyOpen);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterSidebarOpen, isThreadListOpen]);

  // Toggle sidebar handlers
  const toggleFilterSidebar = () => setIsFilterSidebarOpen((prev) => !prev);
  const toggleThreadList = () => setIsThreadListOpen((prev) => !prev);
  const toggleBothSidebars = () => {
    const anyOpen = isFilterSidebarOpen || isThreadListOpen;
    setIsFilterSidebarOpen(!anyOpen);
    setIsThreadListOpen(!anyOpen);
  };

  // Calculate grid columns based on sidebar states
  const gridCols = (() => {
    if (isFilterSidebarOpen && isThreadListOpen) {
      return "lg:grid-cols-[220px_300px_auto]"; // Both open
    } else if (isFilterSidebarOpen && !isThreadListOpen) {
      return "lg:grid-cols-[220px_0px_auto]"; // Filter only
    } else if (!isFilterSidebarOpen && isThreadListOpen) {
      return "lg:grid-cols-[0px_300px_auto]"; // Thread list only
    } else {
      return "lg:grid-cols-[0px_0px_auto]"; // Both closed
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
          onClick={toggleBothSidebars}
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
            ? cloneElement(filterSidebar as ReactElement<{ onCollapse?: () => void }>, {
                onCollapse: toggleFilterSidebar
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
            ? cloneElement(threadListSidebar as ReactElement<{ onCollapse?: () => void }>, {
                onCollapse: toggleThreadList
              })
            : threadListSidebar}

          {/* Mobile Close Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={toggleBothSidebars}
              aria-label="Close sidebars"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </aside>

        {/* Main Content Area */}
        <main
          className={cn(
            "relative h-screen overflow-y-auto",
            "transition-all duration-300 ease-in-out"
          )}
          aria-label="Thread content"
        >
          {/* Sidebar Toggle Button */}
          <div
            className={cn(
              "sticky top-0 z-30 flex items-center gap-2 border-b border-glass glass-panel-strong backdrop-blur-lg px-4 py-3",
              "transition-all duration-300"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBothSidebars}
              aria-label={(isFilterSidebarOpen || isThreadListOpen) ? "Close sidebars" : "Open sidebars"}
              aria-expanded={isFilterSidebarOpen || isThreadListOpen}
              className="hover:glass-panel transition-all"
            >
              {(isFilterSidebarOpen || isThreadListOpen) ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>

            {/* Breadcrumb hint */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground glass-text">
              <span className="hidden sm:inline">Course: {courseId}</span>
              {initialThreadId && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Thread selected</span>
                </>
              )}
            </div>

            {/* Keyboard Shortcut Hints */}
            <div className="ml-auto hidden xl:flex items-center gap-4 text-xs text-subtle glass-text">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  [
                </kbd>
                <span className="text-[10px]">Filters</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  ]
                </kbd>
                <span className="text-[10px]">Threads</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                  \
                </kbd>
                <span className="text-[10px]">Both</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

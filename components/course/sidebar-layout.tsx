"use client";

import { type ReactNode, useState, useEffect } from "react";
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
  // Sidebar open/close state (default open on desktop, closed on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-close sidebar on mobile initially
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + \ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Toggle sidebar handler
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "relative min-h-screen w-full",
        className
      )}
      data-sidebar-open={isSidebarOpen}
    >
      {/* Mobile Overlay (when sidebar is open) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Grid Container */}
      <div
        className={cn(
          "grid h-full transition-all duration-300 ease-in-out",
          // Desktop: Grid with filter sidebar | thread list sidebar | content
          isSidebarOpen
            ? "lg:grid-cols-[220px_300px_auto]"
            : "lg:grid-cols-[0px_0px_auto]"
        )}
      >
        {/* Filter Sidebar (Left - 220px) */}
        <aside
          className={cn(
            "relative h-screen overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Fixed overlay drawer
            "fixed left-0 top-0 z-50 w-[220px] lg:relative lg:z-0 lg:w-full",
            // Transform for mobile drawer
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
          aria-label="Filter sidebar"
          aria-hidden={!isSidebarOpen}
        >
          {filterSidebar}
        </aside>

        {/* Thread List Sidebar (Middle - 300px) */}
        <aside
          className={cn(
            "relative h-screen overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: Fixed overlay drawer (offset by filter sidebar width)
            "fixed left-[220px] top-0 z-50 w-[300px] lg:relative lg:left-0 lg:z-0 lg:w-full",
            // Transform for mobile drawer
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
          aria-label="Thread list sidebar"
          aria-hidden={!isSidebarOpen}
        >
          {threadListSidebar}

          {/* Mobile Close Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
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
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={isSidebarOpen}
              className="hover:glass-panel transition-all"
            >
              {isSidebarOpen ? (
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

            {/* Keyboard Shortcut Hint */}
            <div className="ml-auto hidden xl:flex items-center gap-2 text-xs text-subtle glass-text">
              <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="px-2 py-1 rounded bg-glass-medium border border-glass font-mono">
                \
              </kbd>
              <span>Toggle sidebar</span>
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

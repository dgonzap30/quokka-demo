"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Mobile view state for course navigation
 * - "list": Thread list view (default on mobile)
 * - "filter": Filter sheet overlay
 * - "detail": Thread detail sheet overlay
 */
export type MobileCourseView = "list" | "filter" | "detail";

/**
 * Hook for managing mobile-specific course navigation state
 *
 * Mobile Pattern (< 768px):
 * - Default: Thread list view
 * - Filter FAB opens bottom sheet overlay
 * - Thread selection opens full-screen sheet overlay
 *
 * Tablet/Desktop (≥ 768px):
 * - Returns isMobile: false
 * - Hook state becomes inactive (use desktop layout)
 *
 * @param initialView - Initial view state (default: "list")
 * @returns Mobile navigation state and controls
 *
 * @example
 * ```tsx
 * const {
 *   isMobile,
 *   activeView,
 *   showFilter,
 *   showDetail,
 *   closeAll
 * } = useMobileCourseNav();
 *
 * // Render mobile-specific UI only when isMobile is true
 * if (isMobile) {
 *   return (
 *     <>
 *       <ThreadList />
 *       {activeView === "filter" && <FilterSheet onClose={closeAll} />}
 *       {activeView === "detail" && <DetailSheet onClose={closeAll} />}
 *     </>
 *   );
 * }
 * ```
 */
export function useMobileCourseNav(initialView: MobileCourseView = "list") {
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState<MobileCourseView>(initialView);

  // Detect mobile viewport (< 768px = mobile, ≥ 768px = tablet/desktop)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);

      // Reset to list view when switching to desktop
      if (!mobile && activeView !== "list") {
        setActiveView("list");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [activeView]);

  /**
   * Show filter sheet overlay
   */
  const showFilter = useCallback(() => {
    if (isMobile) {
      setActiveView("filter");
    }
  }, [isMobile]);

  /**
   * Show thread detail sheet overlay
   */
  const showDetail = useCallback(() => {
    if (isMobile) {
      setActiveView("detail");
    }
  }, [isMobile]);

  /**
   * Return to thread list view
   */
  const showList = useCallback(() => {
    setActiveView("list");
  }, []);

  /**
   * Close all overlays and return to list view
   */
  const closeAll = useCallback(() => {
    setActiveView("list");
  }, []);

  return {
    /**
     * Whether the current viewport is mobile (< 768px)
     */
    isMobile,

    /**
     * Current active view state
     */
    activeView,

    /**
     * Show filter sheet (mobile only)
     */
    showFilter,

    /**
     * Show thread detail sheet (mobile only)
     */
    showDetail,

    /**
     * Return to thread list view
     */
    showList,

    /**
     * Close all sheets and return to list
     */
    closeAll,

    /**
     * Whether filter sheet is visible
     */
    isFilterVisible: activeView === "filter",

    /**
     * Whether detail sheet is visible
     */
    isDetailVisible: activeView === "detail",

    /**
     * Whether thread list is visible (always true on mobile)
     */
    isListVisible: activeView === "list" || !isMobile,
  };
}

"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PageContext, CourseSummary } from "@/lib/models/types";

/**
 * AI Context Provider
 *
 * Provides contextual information to AI components about:
 * - What page type the user is on (dashboard, course, instructor)
 * - Current course (if viewing a specific course)
 * - Enrolled courses (for course selection)
 *
 * This context enables the AI assistant to provide course-aware responses
 * and access relevant course materials.
 */

// ============================================
// Context Type Definition
// ============================================

export interface AIContextValue {
  /** Type of page user is currently on */
  pageContext: PageContext;

  /** ID of current course (if on course page) */
  currentCourseId?: string;

  /** Name of current course (if on course page) */
  currentCourseName?: string;

  /** Code of current course (if on course page) */
  currentCourseCode?: string;

  /** List of enrolled courses (for course selection on dashboard) */
  enrolledCourses?: CourseSummary[];
}

// ============================================
// Context Creation
// ============================================

const AIContext = createContext<AIContextValue | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export interface AIContextProviderProps {
  children: ReactNode;
  pageContext: PageContext;
  currentCourseId?: string;
  currentCourseName?: string;
  currentCourseCode?: string;
  enrolledCourses?: CourseSummary[];
}

export function AIContextProvider({
  children,
  pageContext,
  currentCourseId,
  currentCourseName,
  currentCourseCode,
  enrolledCourses,
}: AIContextProviderProps) {
  const value = useMemo<AIContextValue>(
    () => ({
      pageContext,
      currentCourseId,
      currentCourseName,
      currentCourseCode,
      enrolledCourses,
    }),
    [pageContext, currentCourseId, currentCourseName, currentCourseCode, enrolledCourses]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

// ============================================
// Hook to Use Context
// ============================================

/**
 * Hook to access AI context
 *
 * @returns AI context value with page type, current course, and enrolled courses
 * @throws Error if used outside AIContextProvider
 */
export function useAIContext(): AIContextValue {
  const context = useContext(AIContext);

  if (context === undefined) {
    throw new Error("useAIContext must be used within AIContextProvider");
  }

  return context;
}

/**
 * Hook to check if AI context is available (doesn't throw)
 *
 * @returns AI context value or undefined if not in provider
 */
export function useAIContextSafe(): AIContextValue | undefined {
  return useContext(AIContext);
}

import type { ReactNode } from "react";
import { LayoutDashboard, MessageSquarePlus, MessagesSquare } from "lucide-react";

/**
 * Navigation context types
 */
export type NavContext = 'main-dashboard' | 'course';

/**
 * Navigation item interface
 */
export interface NavItem {
  /** Display label */
  label: string;

  /** Route path (href) */
  href: string;

  /** Optional icon (Lucide component) */
  icon?: ReactNode;

  /** Badge count (for notifications) */
  badge?: number;
}

/**
 * Navigation context information
 */
export interface NavContextInfo {
  /** Current navigation context */
  context: NavContext;

  /** Course ID if in course context */
  courseId?: string;

  /** Navigation items for this context */
  items: NavItem[];
}

/**
 * Detects navigation context from current pathname and returns appropriate nav items
 *
 * @param pathname - Current route pathname
 * @returns Navigation context information with items
 *
 * @example
 * // Main dashboard - no nav items (minimal nav)
 * getNavContext('/dashboard') // { context: 'main-dashboard', items: [] }
 *
 * // Course view - full course nav
 * getNavContext('/courses/cs101') // { context: 'course', courseId: 'cs101', items: [...] }
 */
export function getNavContext(pathname: string): NavContextInfo {
  // Main dashboard - minimal nav (no tabs)
  if (pathname === '/dashboard') {
    return {
      context: 'main-dashboard',
      items: []  // Empty array = no nav tabs, just logo/search/user menu
    };
  }

  // Course pages - full course nav with contextual actions
  const courseMatch = pathname.match(/^\/courses\/([^\/]+)/);
  if (courseMatch) {
    const courseId = courseMatch[1];
    return {
      context: 'course',
      courseId,
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          label: "Ask Question",
          href: `/ask?courseId=${courseId}`,
          icon: <MessageSquarePlus className="h-4 w-4" />,
        },
        {
          label: "Browse Threads",
          href: `/courses/${courseId}`,
          icon: <MessagesSquare className="h-4 w-4" />,
        },
      ]
    };
  }

  // Thread pages, ask page without courseId, etc - minimal nav
  // Breadcrumbs provide context on these pages
  return {
    context: 'main-dashboard',
    items: []
  };
}

/**
 * Determines if a nav item is active based on current path
 * Handles exact matches and special cases
 */
export function isNavItemActive(itemHref: string, currentPath: string): boolean {
  // Exact match for most items
  if (itemHref === currentPath) return true;

  // Special handling for Ask Question with query params
  // Active when on /ask page, regardless of courseId param
  if (itemHref.startsWith('/ask?') && currentPath.startsWith('/ask')) {
    return true;
  }

  // Default: no match
  return false;
}

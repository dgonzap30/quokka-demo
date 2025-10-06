"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, MessageSquarePlus, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DesktopNavProps {
  /** Current active route path */
  currentPath: string;

  /** Optional className for container */
  className?: string;
}

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

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Ask Question",
    href: "/ask",
    icon: <MessageSquarePlus className="h-4 w-4" />,
  },
  {
    label: "Browse Threads",
    href: "/threads",
    icon: <MessagesSquare className="h-4 w-4" />,
  },
];

/**
 * Determines if a nav item is active based on current path
 * Handles nested routes (e.g., /courses/123 highlights Dashboard)
 */
function isActiveItem(itemHref: string, currentPath: string): boolean {
  // Exact match for Dashboard
  if (itemHref === "/dashboard") {
    return currentPath === "/dashboard" ||
           currentPath.startsWith("/courses/") ||
           currentPath === "/courses";
  }

  // Exact match for Ask
  if (itemHref === "/ask") {
    return currentPath === "/ask";
  }

  // Starts with for Threads
  if (itemHref === "/threads") {
    return currentPath.startsWith("/threads");
  }

  // Default: exact match
  return currentPath === itemHref;
}

export function DesktopNav({ currentPath, className }: DesktopNavProps) {
  // Determine active tab value
  const activeTab = useMemo(() => {
    const activeItem = NAV_ITEMS.find((item) => isActiveItem(item.href, currentPath));
    return activeItem?.href || "/dashboard";
  }, [currentPath]);

  return (
    <nav
      className={cn("hidden md:flex items-center", className)}
      role="navigation"
      aria-label="Main navigation"
    >
      <Tabs value={activeTab} className="w-full">
        <TabsList className="glass-panel h-11 p-1 gap-1">
          {NAV_ITEMS.map((item) => (
            <TabsTrigger
              key={item.href}
              value={item.href}
              asChild
              className="min-h-[44px] px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Link
                href={item.href}
                aria-current={activeTab === item.href ? "page" : undefined}
                className="flex items-center gap-2"
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
}

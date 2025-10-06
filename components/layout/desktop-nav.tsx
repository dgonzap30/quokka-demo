"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/lib/utils/nav-config";

export interface DesktopNavProps {
  /** Current active route path */
  currentPath: string;

  /** Optional className for container */
  className?: string;

  /** Optional navigation items - if not provided or empty, renders minimal nav */
  items?: NavItem[];
}

export function DesktopNav({ currentPath, className, items }: DesktopNavProps) {
  // Determine active tab value
  const activeTab = useMemo(() => {
    if (!items || items.length === 0) return '';
    const activeItem = items.find((item) => isNavItemActive(item.href, currentPath));
    return activeItem?.href || items[0]?.href;
  }, [currentPath, items]);

  // If no items provided or empty array, render minimal nav (no tabs)
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn("hidden md:flex items-center", className)}
      role="navigation"
      aria-label="Main navigation"
    >
      <Tabs value={activeTab} className="w-full">
        <TabsList className="glass-panel h-11 p-1 gap-1">
          {items.map((item) => (
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
                {item.badge && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
}

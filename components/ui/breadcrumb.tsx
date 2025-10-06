"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  /** Display label */
  label: string;

  /** Optional href (if clickable) */
  href?: string;

  /** Optional icon (Lucide component) */
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  /** Breadcrumb items (ordered left to right) */
  items: BreadcrumbItem[];

  /** Optional className for container */
  className?: string;

  /** Separator character (default: ChevronRight icon) */
  separator?: ReactNode;
}

export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-3 w-3" />
}: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-accent transition-colors flex items-center gap-1.5"
                >
                  {item.icon}
                  <span className="max-w-[200px] truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    isLast ? "text-foreground font-medium" : ""
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  <span className="max-w-[200px] truncate">{item.label}</span>
                </span>
              )}

              {!isLast && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Check, HelpCircle, AlertCircle, type LucideIcon } from "lucide-react";

type ThreadStatus = "open" | "answered" | "resolved" | "needs-review";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const statusConfig: Record<ThreadStatus, StatusConfig> = {
  open: {
    label: "Open",
    icon: HelpCircle,
    className: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:border-warning/30",
  },
  answered: {
    label: "Answered",
    icon: CheckCircle2,
    className: "bg-accent/10 text-accent border-accent/20 dark:bg-accent/20 dark:border-accent/30",
  },
  resolved: {
    label: "Resolved",
    icon: Check,
    className: "bg-success/10 text-success border-success/20 dark:bg-success/20 dark:border-success/30",
  },
  "needs-review": {
    label: "Needs Review",
    icon: AlertCircle,
    className: "bg-info/10 text-info border-info/20 dark:bg-info/20 dark:border-info/30",
  },
};

export interface StatusBadgeProps {
  /**
   * Thread status
   */
  status: ThreadStatus;

  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;

  /**
   * Optional accessible label for screen readers
   */
  "aria-label"?: string;
}

/**
 * StatusBadge - Displays thread status with color-coded styling and icons
 *
 * Features:
 * - Color-coded backgrounds for quick recognition
 * - Icons for visual clarity
 * - Semantic meaning through colors and labels
 * - Accessible with proper contrast ratios
 *
 * @example
 * ```tsx
 * <StatusBadge status="answered" />
 * <StatusBadge status="open" showIcon={false} />
 * ```
 */
export function StatusBadge({
  status,
  showIcon = true,
  className,
  "aria-label": ariaLabel,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // Generate default label if not provided
  const defaultLabel = `Thread status: ${config.label}`;

  return (
    <Badge
      className={cn(
        "flex items-center gap-1.5 font-medium border",
        config.className,
        className
      )}
      role="status"
      aria-label={ariaLabel || defaultLabel}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span aria-hidden="true">{config.label}</span>
    </Badge>
  );
}

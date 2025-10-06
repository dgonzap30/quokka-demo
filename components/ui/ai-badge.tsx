import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AI Badge Component
 *
 * Distinctive badge to identify AI-powered features and content across the application.
 * Uses purple-cyan gradient from QDS AI color palette for visual prominence.
 *
 * @example
 * // Default badge with icon and text
 * <AIBadge />
 *
 * @example
 * // Compact variant for tight spaces
 * <AIBadge variant="compact" />
 *
 * @example
 * // Icon-only for minimal presentation
 * <AIBadge variant="icon-only" />
 */

export interface AIBadgeProps {
  /** Visual variant of the badge */
  variant?: "default" | "compact" | "icon-only";

  /** Optional custom className for styling overrides */
  className?: string;

  /** Optional custom children to replace default content */
  children?: ReactNode;

  /** Optional aria-label for accessibility */
  "aria-label"?: string;
}

export function AIBadge({
  variant = "default",
  className,
  children,
  "aria-label": ariaLabel = "AI-powered feature",
}: AIBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 ai-gradient text-white font-semibold rounded-full";

  const sizeClasses = {
    default: "px-3 py-1 text-xs",
    compact: "px-2 py-0.5 text-[10px]",
    "icon-only": "p-1.5",
  }[variant];

  return (
    <span
      className={cn(baseClasses, sizeClasses, className)}
      aria-label={ariaLabel}
      role="img"
    >
      <Sparkles
        className={cn(
          variant === "default" && "h-3 w-3",
          variant === "compact" && "h-2.5 w-2.5",
          variant === "icon-only" && "h-3 w-3"
        )}
        aria-hidden="true"
      />
      {variant !== "icon-only" && (
        <span>{children || "AI"}</span>
      )}
    </span>
  );
}

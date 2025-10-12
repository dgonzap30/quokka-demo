import type { ReactNode } from "react";
import { Inbox, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "no-data" | "all-done" | "error" | "ai-ready";

interface InstructorEmptyStateProps {
  /** Variant determines icon and messaging */
  variant?: EmptyStateVariant;

  /** Main heading text */
  title: string;

  /** Supporting description text */
  description: string;

  /** Optional action button or link */
  action?: ReactNode;

  /** Optional additional CSS classes */
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, { icon: typeof Inbox; iconColor: string }> = {
  "no-data": {
    icon: Inbox,
    iconColor: "text-muted-foreground",
  },
  "all-done": {
    icon: CheckCircle2,
    iconColor: "text-success",
  },
  "error": {
    icon: AlertCircle,
    iconColor: "text-danger",
  },
  "ai-ready": {
    icon: Sparkles,
    iconColor: "text-accent",
  },
};

/**
 * Empty state component for instructor dashboard sections
 *
 * Provides contextual empty states with appropriate iconography
 * and messaging based on the situation (no data, completed, error, etc.)
 *
 * @example
 * ```tsx
 * <InstructorEmptyState
 *   variant="all-done"
 *   title="All Caught Up!"
 *   description="No questions need your attention right now."
 * />
 * ```
 */
export function InstructorEmptyState({
  variant = "no-data",
  title,
  description,
  action,
  className,
}: InstructorEmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div
        className={cn(
          "mb-4 rounded-full bg-muted/50 p-4",
          "flex items-center justify-center"
        )}
        aria-hidden="true"
      >
        <Icon className={cn("h-8 w-8", config.iconColor)} />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h3>

      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

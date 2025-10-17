import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EndorsedBadgeProps {
  /**
   * Optional className for composition
   */
  className?: string;

  /**
   * Display variant
   * - default: Standard size with text
   * - compact: Icon only, smaller
   * @default "default"
   */
  variant?: "default" | "compact";
}

/**
 * EndorsedBadge - Visual indicator for endorsed threads
 *
 * Features:
 * - Green checkmark icon for endorsement
 * - Clear "Endorsed" label
 * - Compact variant for small spaces
 * - QDS compliant success color
 * - Accessible label
 *
 * @example
 * ```tsx
 * <EndorsedBadge />
 * <EndorsedBadge variant="compact" />
 * ```
 */
export function EndorsedBadge({
  className,
  variant = "default",
}: EndorsedBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-success/40 bg-success/10 text-success dark:border-success/50 dark:bg-success/20 dark:text-success gap-1.5 font-medium",
        isCompact && "px-1.5 py-0.5",
        className
      )}
      aria-label="Thread endorsed by instructor"
    >
      <CheckCircle className={cn("h-3.5 w-3.5", isCompact && "h-3 w-3")} />
      {!isCompact && <span className="text-xs">Endorsed</span>}
    </Badge>
  );
}

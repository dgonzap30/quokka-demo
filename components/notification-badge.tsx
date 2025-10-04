import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const notificationBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-4 w-4 text-[10px] min-w-[16px]",
        md: "h-5 w-5 text-xs min-w-[20px]",
        lg: "h-6 w-6 text-sm min-w-[24px]",
      },
      variant: {
        primary: "bg-primary hover:bg-primary-hover",
        warning: "bg-warning hover:bg-warning/90",
        danger: "bg-danger hover:bg-danger/90",
      },
      position: {
        static: "relative",
        "top-right": "absolute -top-1 -right-1",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "danger",
      position: "static",
    },
  }
);

export interface NotificationBadgeProps
  extends VariantProps<typeof notificationBadgeVariants> {
  /**
   * Number of unread notifications
   * Hidden if count is 0
   */
  count: number;

  /**
   * Maximum number to display before showing "99+"
   * @default 99
   */
  max?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Screen reader label
   * @default "{count} unread notifications"
   */
  ariaLabel?: string;
}

export function NotificationBadge({
  count,
  size,
  variant,
  position,
  max = 99,
  className,
  ariaLabel,
}: NotificationBadgeProps) {
  // Hide if no notifications
  if (count <= 0) {
    return null;
  }

  // Format count (e.g., "99+" for 100+)
  const displayCount = count > max ? `${max}+` : count.toString();

  // Default aria label
  const label =
    ariaLabel || `${count} unread notification${count === 1 ? "" : "s"}`;

  return (
    <span
      className={cn(
        notificationBadgeVariants({ size, variant, position }),
        className
      )}
      aria-label={label}
      role="status"
    >
      {displayCount}
    </span>
  );
}

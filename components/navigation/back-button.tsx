"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  /** Optional custom label (defaults to "Back") */
  label?: string;

  /** Fallback href if no browser history (defaults to "/dashboard") */
  fallbackHref?: string;

  /** Optional className for composition */
  className?: string;
}

/**
 * BackButton Component
 *
 * A reusable back navigation button that uses browser history (router.back())
 * to navigate to the previous page. Provides a fallback href if no history exists.
 *
 * Features:
 * - QDS-compliant styling with glass panel effect
 * - WCAG 2.2 AA accessible (keyboard nav, ARIA, focus states)
 * - Responsive design (mobile and desktop)
 * - Smooth transitions and hover effects
 *
 * @example
 * ```tsx
 * <BackButton /> // Default: "Back" label, fallback to /dashboard
 * <BackButton label="Return to Course" fallbackHref="/courses" />
 * ```
 */
export function BackButton({
  label = "Back",
  fallbackHref = "/dashboard",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if browser has history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to specified href if no history
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        // Base styles
        "inline-flex items-center gap-2",
        "px-4 py-2 rounded-lg",
        "text-sm font-medium",
        "transition-all duration-300 ease-out",

        // Glass panel styling (QDS)
        "glass-panel backdrop-blur-md",
        "border border-glass",
        "shadow-[var(--shadow-glass-sm)]",

        // Text and icon color
        "text-foreground/80",

        // Hover state
        "hover:text-foreground",
        "hover:border-accent/20",
        "hover:shadow-[var(--shadow-glass-md)]",
        "hover:scale-[1.02]",
        "active:scale-[0.98]",

        // Motion reduce
        "motion-reduce:hover:scale-100",
        "motion-reduce:active:scale-100",

        // Focus state (accessibility)
        "focus-visible:outline-none",
        "focus-visible:ring-4",
        "focus-visible:ring-accent/60",

        // Minimum touch target (44x44px)
        "min-h-[44px]",

        // Custom className
        className
      )}
      aria-label={label}
      type="button"
    >
      <ChevronLeft
        className={cn(
          "h-4 w-4",
          "transition-transform duration-300 ease-out",
          "group-hover:-translate-x-0.5"
        )}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
}

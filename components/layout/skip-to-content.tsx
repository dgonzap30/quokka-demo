"use client";

import { cn } from "@/lib/utils";

export interface SkipToContentProps {
  /**
   * Target element ID (without #)
   * @default "main-content"
   */
  targetId?: string;

  /**
   * Link text
   * @default "Skip to main content"
   */
  label?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * SkipToContent - Accessibility link for keyboard navigation
 *
 * Features:
 * - Hidden until focused (keyboard-only)
 * - Jumps to main content bypassing navigation
 * - High-contrast focus state
 * - WCAG 2.2 compliant
 *
 * Usage:
 * Place at the very top of the page layout, before navigation.
 * Ensure the target element has the matching ID and tabIndex={-1}.
 *
 * @example
 * ```tsx
 * // In layout or page
 * <SkipToContent />
 * <NavHeader />
 * <main id="main-content" tabIndex={-1}>
 *   {children}
 * </main>
 * ```
 */
export function SkipToContent({
  targetId = "main-content",
  label = "Skip to main content",
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Hidden by default
        "sr-only",
        // Visible on focus (keyboard navigation)
        "focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]",
        // Styling
        "inline-flex items-center gap-2 px-6 py-3 rounded-lg",
        "bg-primary text-primary-foreground font-medium text-sm",
        "shadow-[var(--shadow-e3)] focus:shadow-[var(--glow-primary)]",
        // Focus ring
        "focus:outline-none focus:ring-4 focus:ring-primary/50",
        // Transitions
        "transition-all duration-200",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      {label}
    </a>
  );
}

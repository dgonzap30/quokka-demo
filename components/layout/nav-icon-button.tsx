"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavIconButtonProps {
  /** Lucide icon component to render */
  icon: LucideIcon;

  /** Accessible label for screen readers and tooltip */
  label: string;

  /** Click handler */
  onClick?: () => void;

  /** Optional className for composition */
  className?: string;

  /** Optional custom hover animation class */
  hoverAnimation?: "scale" | "scale-rotate" | "shine" | "none";

  /** Disabled state */
  disabled?: boolean;
}

const hoverAnimations = {
  scale: "hover:scale-105",
  "scale-rotate": "hover:scale-110 hover:rotate-6",
  shine: "",
  none: "",
};

/**
 * NavIconButton - Icon-only button for navigation with tooltip and accessibility support
 *
 * Features:
 * - 44x44px touch target (WCAG AAA)
 * - Tooltip on hover and keyboard focus
 * - Proper ARIA labels and screen reader support
 * - Customizable hover animations
 * - Respects prefers-reduced-motion
 *
 * @example
 * <NavIconButton
 *   icon={MessageSquarePlus}
 *   label="Ask Question"
 *   onClick={() => router.push('/ask')}
 *   hoverAnimation="scale"
 * />
 */
export function NavIconButton({
  icon: Icon,
  label,
  onClick,
  className,
  hoverAnimation = "scale",
  disabled = false,
}: NavIconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              // Sizing: 44x44px for WCAG AAA touch targets
              "min-h-[44px] min-w-[44px] h-11 w-11",
              // Animation: 180ms with easing from QDS
              "transition-all duration-[180ms]",
              // Hover animation variant
              hoverAnimations[hoverAnimation],
              // Reduced motion support
              "motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0 motion-reduce:transition-none",
              // Enhanced focus indicator for darker navbar
              "focus-visible:ring-4 focus-visible:ring-accent/60 dark:focus-visible:ring-accent/80 focus-visible:ring-offset-2",
              className
            )}
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          <p className="text-sm">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

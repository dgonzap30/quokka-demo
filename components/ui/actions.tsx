"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Actions - Container for action buttons (Copy, Retry, Like, etc.)
 *
 * Provides a consistent layout for AI message action buttons with
 * proper spacing and alignment.
 *
 * @example
 * ```tsx
 * <Actions className="mt-1">
 *   <Action label="Copy message" onClick={handleCopy}>
 *     <Copy className="h-3 w-3" />
 *   </Action>
 *   <Action label="Retry" onClick={handleRetry}>
 *     <RefreshCcw className="h-3 w-3" />
 *   </Action>
 * </Actions>
 * ```
 */
export function Actions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label="Message actions"
      {...props}
    >
      {children}
    </div>
  );
}

export interface ActionProps extends React.ComponentProps<typeof Button> {
  /**
   * Accessible label for screen readers.
   * Also used as tooltip text if tooltip prop is not provided.
   */
  label: string;

  /**
   * Optional tooltip text shown on hover.
   * If not provided, the label will be used.
   */
  tooltip?: string;
}

/**
 * Action - Individual action button with tooltip support
 *
 * A small, compact button optimized for inline message actions.
 * Includes automatic tooltip support and proper accessibility labels.
 *
 * @example
 * ```tsx
 * <Action
 *   label="Copy message"
 *   tooltip="Copy to clipboard"
 *   onClick={handleCopy}
 * >
 *   <Copy className="h-3 w-3" />
 * </Action>
 * ```
 */
export function Action({
  label,
  tooltip,
  className,
  children,
  disabled,
  ...props
}: ActionProps) {
  const tooltipText = tooltip || label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs hover:bg-[var(--glass-hover)]",
            className
          )}
          aria-label={label}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="text-xs px-2 py-1"
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

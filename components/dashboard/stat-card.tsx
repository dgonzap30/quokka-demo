"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { MiniSparkline } from "@/components/dashboard/mini-sparkline";

export interface StatCardProps {
  /**
   * Statistic label (e.g., "Threads", "Active Students")
   */
  label: string;

  /**
   * Numeric value to display
   */
  value: number;

  /**
   * Optional icon for visual context
   */
  icon?: LucideIcon;

  /**
   * Optional trend data (delta and direction)
   */
  trend?: {
    /**
     * Direction of trend: "up" (green), "down" (red), "neutral" (gray)
     */
    direction: "up" | "down" | "neutral";

    /**
     * Human-readable delta (e.g., "+12%", "3 less", "5 more")
     */
    label: string;
  };

  /**
   * Optional CTA button
   */
  cta?: {
    /**
     * Button label
     */
    label: string;

    /**
     * Click handler
     */
    onClick: () => void;

    /**
     * Optional icon
     */
    icon?: LucideIcon;
  };

  /**
   * Visual variant based on metric type
   * - default: neutral glass
   * - warning: amber glow (for unanswered threads)
   * - success: green glow (for goals met)
   * - accent: blue glow (for primary metrics)
   */
  variant?: "default" | "warning" | "success" | "accent";

  /**
   * Optional sparkline data (7-day array, left = oldest, right = newest)
   */
  sparklineData?: number[];

  /**
   * Optional tooltip text for sparkline
   */
  sparklineTooltip?: string;

  /**
   * Optional comparison period label (e.g., "vs last week")
   */
  comparisonPeriod?: string;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * Get trend icon based on direction
 */
function getTrendIcon(direction: "up" | "down" | "neutral") {
  switch (direction) {
    case "up":
      return <TrendingUp className="size-3" />;
    case "down":
      return <TrendingDown className="size-3" />;
    case "neutral":
      return <Minus className="size-3" />;
  }
}

/**
 * Get trend text color based on direction
 */
function getTrendColor(direction: "up" | "down" | "neutral") {
  switch (direction) {
    case "up":
      return "text-success";
    case "down":
      return "text-danger";
    case "neutral":
      return "text-muted-foreground";
  }
}

/**
 * Enhanced stat card with trend indicators and optional CTA
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  cta,
  variant = "default",
  sparklineData,
  sparklineTooltip,
  comparisonPeriod,
  loading = false,
  className,
}: StatCardProps) {
  // Variant classes
  const variantClasses = {
    default: "glass-panel",
    warning: "glass-panel border-l-4 border-l-warning",
    success: "glass-panel border-l-4 border-l-success",
    accent: "glass-panel border-l-4 border-l-accent",
  };

  if (loading) {
    return (
      <Card className={cn(variantClasses.default, className)}>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-24 bg-glass-medium" />
          <Skeleton className="h-10 w-16 bg-glass-medium" />
          <Skeleton className="h-4 w-32 bg-glass-medium" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(variantClasses[variant], "transition-shadow duration-[240ms]", className)}>
      <CardContent className="p-4 space-y-2">
        {/* Header Row: Icon + Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="size-4 text-primary" />
              </div>
            )}
            <p className="text-sm font-medium text-muted-foreground glass-text">{label}</p>
          </div>
        </div>

        {/* Value Row */}
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold glass-text">{value.toLocaleString()}</p>
          {trend && (
            <div className={cn("flex items-center gap-1", getTrendColor(trend.direction))}>
              {getTrendIcon(trend.direction)}
              <span className="text-xs font-semibold">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Sparkline (optional) */}
        {sparklineData && sparklineData.length === 7 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <MiniSparkline
              data={sparklineData}
              variant={
                trend?.direction === "up"
                  ? "success"
                  : trend?.direction === "down"
                  ? "danger"
                  : "default"
              }
            />
            {sparklineTooltip && (
              <span className="text-xs text-muted-foreground glass-text">{sparklineTooltip}</span>
            )}
            {!sparklineTooltip && comparisonPeriod && (
              <span className="text-xs text-muted-foreground glass-text">{comparisonPeriod}</span>
            )}
          </div>
        )}

        {/* CTA Button (optional) */}
        {cta && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cta.onClick}
            className="w-full text-accent hover:text-accent-hover hover:bg-accent/10 gap-2"
          >
            {cta.label}
            {cta.icon && <cta.icon className="size-4" />}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

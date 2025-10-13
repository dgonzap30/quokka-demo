"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MiniSparklineProps {
  /**
   * Array of data points (7 values, left = oldest, right = newest)
   */
  data: number[];

  /**
   * Color variant (success, warning, danger, accent, default)
   */
  variant?: "success" | "warning" | "danger" | "accent" | "default";

  /**
   * Optional className for composition
   */
  className?: string;
}

export const MiniSparkline = React.memo(function MiniSparkline({
  data,
  variant = "default",
  className,
}: MiniSparklineProps) {
  const width = 60;
  const height = 24;
  const padding = 2;

  // Normalize data to 0-1 range
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  const strokeColors = {
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-danger",
    accent: "stroke-accent",
    default: "stroke-primary",
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      role="img"
      aria-label="7-day trend sparkline"
    >
      <path
        d={pathData}
        fill="none"
        className={cn(strokeColors[variant], "stroke-2")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

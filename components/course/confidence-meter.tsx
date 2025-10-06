"use client";

import type { ConfidenceLevel } from "@/lib/models/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getConfidenceStyles = (level: ConfidenceLevel) => {
  switch (level) {
    case "high":
      return {
        barClass: "confidence-bar-high",
        textClass: "confidence-text-high",
        label: "High Confidence",
        description: "Strong alignment with course materials",
      };
    case "medium":
      return {
        barClass: "confidence-bar-medium",
        textClass: "confidence-text-medium",
        label: "Medium Confidence",
        description: "Moderate alignment with course materials",
      };
    case "low":
      return {
        barClass: "confidence-bar-low",
        textClass: "confidence-text-low",
        label: "Low Confidence",
        description: "Consider waiting for human replies",
      };
  }
};

const sizeStyles = {
  sm: { bar: "h-2", text: "text-xs" },
  md: { bar: "h-3", text: "text-sm" },
  lg: { bar: "h-4", text: "text-base" },
};

export function ConfidenceMeter({
  level,
  score,
  showLabel = true,
  size = "md",
  className,
}: ConfidenceMeterProps) {
  const styles = getConfidenceStyles(level);
  const sizes = sizeStyles[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex-1 min-w-[120px] max-w-xs"
              role="meter"
              aria-label={`${styles.label}: ${score}%`}
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={cn("confidence-track", sizes.bar)}>
                <div
                  className={styles.barClass}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{styles.label}</p>
            <p className="text-xs">{styles.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showLabel && (
        <span className={cn(styles.textClass, "tabular-nums", sizes.text)}>
          {score}%
        </span>
      )}
    </div>
  );
}

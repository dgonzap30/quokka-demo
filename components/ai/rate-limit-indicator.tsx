"use client";

/**
 * RateLimitIndicator - Shows current API rate limit status
 *
 * Visual indicator for LLM API rate limiting with:
 * - Color-coded status (green/yellow/red)
 * - Usage percentage bar
 * - Remaining requests counter
 * - Time until reset
 */

import { useEffect, useState } from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRateLimitStatus,
  formatTimeUntilReset,
  resetRateLimit,
  type RateLimitStatus,
} from "@/lib/store/rateLimit";

export interface RateLimitIndicatorProps {
  /** Custom className */
  className?: string;

  /** Show reset button (for demo/testing) */
  showReset?: boolean;

  /** Compact mode - minimal display */
  compact?: boolean;
}

export function RateLimitIndicator({
  className,
  showReset = false,
  compact = false,
}: RateLimitIndicatorProps) {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  const loadStatus = () => {
    setStatus(getRateLimitStatus());
    setTimeUntilReset(formatTimeUntilReset());
  };

  useEffect(() => {
    loadStatus();

    // Update every 5 seconds
    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (confirm("Reset rate limit? This is for demo purposes only.")) {
      resetRateLimit();
      loadStatus();
    }
  };

  if (!status) return null;

  const remaining = status.limit - status.requestCount;

  // Color scheme based on level
  const colors = {
    safe: {
      bg: "bg-success/10",
      border: "border-success/20",
      text: "text-success",
      bar: "bg-success",
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning",
      bar: "bg-warning",
    },
    danger: {
      bg: "bg-danger/10",
      border: "border-danger/20",
      text: "text-danger",
      bar: "bg-danger",
    },
    limited: {
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      text: "text-destructive",
      bar: "bg-destructive",
    },
  };

  const color = colors[status.level];

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border glass-panel",
          color.bg,
          color.border,
          className
        )}
      >
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", color.text)}>
          {status.isLimited ? (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Rate Limited</span>
            </>
          ) : (
            <>
              <span>{remaining}</span>
              <span className="text-muted-foreground glass-text">/</span>
              <span>{status.limit}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", color.bg)}>
            {status.isLimited ? (
              <AlertCircle className={cn("h-4 w-4", color.text)} />
            ) : (
              <RefreshCw className={cn("h-4 w-4", color.text)} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold glass-text">API Rate Limit</p>
            <p className="text-xs text-muted-foreground glass-text">
              {status.isLimited ? "Limit exceeded" : `${remaining} requests remaining`}
            </p>
          </div>
        </div>
        {showReset && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground glass-text transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", color.bar)}
            style={{ width: `${status.usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", color.text)}>
            {status.requestCount} / {status.limit} requests
          </span>
          <span className="text-muted-foreground glass-text flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Resets in {timeUntilReset}
          </span>
        </div>
      </div>

      {/* Warning Message */}
      {status.isLimited && (
        <div className={cn("text-xs p-2 rounded-md border", color.bg, color.border, color.text)}>
          ⚠️ Rate limit exceeded. Please wait {timeUntilReset} before making more requests.
        </div>
      )}

      {status.level === "danger" && !status.isLimited && (
        <div className={cn("text-xs p-2 rounded-md border", color.bg, color.border, color.text)}>
          💡 Approaching rate limit. Consider spacing out your requests.
        </div>
      )}
    </div>
  );
}

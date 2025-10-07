import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCcw } from "lucide-react";

export interface ErrorStateProps {
  /**
   * Error title
   * @default "Something went wrong"
   */
  title?: string;

  /**
   * Error message
   */
  message?: string;

  /**
   * Retry handler
   */
  onRetry?: () => void;

  /**
   * Whether the retry button should show loading state
   */
  isRetrying?: boolean;

  /**
   * Optional action to go back or navigate elsewhere
   */
  fallbackAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };

  /**
   * Visual variant
   * @default "glass"
   */
  variant?: "default" | "glass" | "destructive";

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ErrorState - Displays error messages with recovery options
 *
 * Features:
 * - Clear error messaging
 * - Retry button with loading state
 * - Optional fallback action
 * - Glass variant for modern aesthetic
 * - Accessible error announcements
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load threads"
 *   message="We couldn't load the discussion threads. Please try again."
 *   onRetry={() => refetch()}
 *   isRetrying={isLoading}
 * />
 * ```
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error. Please try again.",
  onRetry,
  isRetrying = false,
  fallbackAction,
  variant = "glass",
  className,
}: ErrorStateProps) {
  const cardVariant = variant === "destructive" ? "default" : variant;

  return (
    <Card
      variant={cardVariant}
      className={cn(
        "p-12 md:p-16 text-center",
        variant === "destructive" && "border-l-4 border-l-danger bg-danger/5",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div
            className={cn(
              "rounded-full p-4",
              variant === "destructive"
                ? "bg-danger/10"
                : "bg-muted/50"
            )}
          >
            <AlertCircle
              className={cn(
                "h-10 w-10",
                variant === "destructive"
                  ? "text-danger"
                  : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          {message && (
            <p className="text-muted-foreground leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* Actions */}
        {(onRetry || fallbackAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onRetry && (
              <Button
                variant={variant === "destructive" ? "destructive" : "glass-primary"}
                size="lg"
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RefreshCcw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                {isRetrying ? "Retrying..." : "Try Again"}
              </Button>
            )}
            {fallbackAction && (
              fallbackAction.href ? (
                <Button asChild variant="outline" size="lg">
                  <a href={fallbackAction.href}>
                    {fallbackAction.label}
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={fallbackAction.onClick}
                >
                  {fallbackAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

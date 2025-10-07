import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /**
   * Icon to display
   */
  icon?: LucideIcon;

  /**
   * Emoji to display (alternative to icon)
   */
  emoji?: string;

  /**
   * Main heading
   */
  title: string;

  /**
   * Description text
   */
  description: string;

  /**
   * Optional call-to-action button
   */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    variant?: "default" | "glass-primary" | "outline";
  };

  /**
   * Optional secondary action
   */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };

  /**
   * Visual variant
   * @default "glass"
   */
  variant?: "default" | "glass" | "elevated";

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * EmptyState - Displays helpful messaging when no content is available
 *
 * Features:
 * - Icon or emoji for visual interest
 * - Clear title and description
 * - Optional CTA buttons
 * - Glass variant for modern aesthetic
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <EmptyState
 *   emoji="📚"
 *   title="No Courses Yet"
 *   description="You're not enrolled in any courses"
 *   action={{
 *     label: "Browse Courses",
 *     href: "/courses"
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  variant = "glass",
  className,
}: EmptyStateProps) {
  return (
    <Card
      variant={variant}
      className={cn("p-12 md:p-16 text-center", className)}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Icon or Emoji */}
        <div className="flex justify-center">
          {Icon ? (
            <div className="rounded-full bg-muted/50 p-6">
              <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
          ) : emoji ? (
            <div className="text-6xl opacity-50" aria-hidden="true">
              {emoji}
            </div>
          ) : null}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {action && (
              action.href ? (
                <Button
                  asChild
                  variant={action.variant || "glass-primary"}
                  size="lg"
                >
                  <a href={action.href}>
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </a>
                </Button>
              ) : (
                <Button
                  variant={action.variant || "glass-primary"}
                  size="lg"
                  onClick={action.onClick}
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Button asChild variant="outline" size="lg">
                  <a href={secondaryAction.href}>
                    {secondaryAction.label}
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

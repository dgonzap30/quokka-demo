"use client";

import * as React from "react";
import { QuokkaIcon } from "@/components/ui/quokka-icon";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PointMilestone } from "@/lib/models/types";
import { TrendingUp } from "lucide-react";

export interface QuokkaPointsHeroProps {
  /**
   * Total Quokka Points (lifetime balance)
   */
  totalPoints: number;

  /**
   * Points earned this week
   */
  weeklyPoints: number;

  /**
   * Next milestone to achieve (or null if all complete)
   */
  nextMilestone: PointMilestone | null;

  /**
   * User's first name for personalization
   */
  userName: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * QuokkaPointsHero - Hero section with animated icon and total points
 *
 * Features:
 * - Large animated QuokkaIcon with pulse effect
 * - Total points prominently displayed
 * - Weekly points badge with trending indicator
 * - Progress bar to next milestone
 * - Congratulatory message when all milestones achieved
 * - Glass panel background with decorative icons
 *
 * Purpose:
 * Eye-catching hero section that immediately shows the user their
 * total Quokka Points and progress toward their next achievement.
 *
 * Accessibility:
 * - Semantic HTML with role="region"
 * - Progress bar with descriptive aria-label
 * - Decorative icons hidden from screen readers
 *
 * @example
 * ```tsx
 * <QuokkaPointsHero
 *   totalPoints={250}
 *   weeklyPoints={35}
 *   nextMilestone={{ threshold: 500, label: "Active Contributor", achieved: false }}
 *   userName="Alex"
 * />
 * ```
 */
export function QuokkaPointsHero({
  totalPoints,
  weeklyPoints,
  nextMilestone,
  userName,
  className,
}: QuokkaPointsHeroProps) {
  // Calculate progress to next milestone
  const progressPercent = React.useMemo(() => {
    if (!nextMilestone) return 100; // All milestones complete

    // Find previous achieved milestone
    const allMilestones = [
      { threshold: 0, label: "Beginner" },
      { threshold: 100, label: "Getting Started" },
      { threshold: 250, label: "Active Learner" },
      { threshold: 500, label: "Active Contributor" },
      { threshold: 1000, label: "Helpful Contributor" },
      { threshold: 2500, label: "Community Expert" },
    ];

    const currentIndex = allMilestones.findIndex(m => m.threshold === nextMilestone.threshold);
    const prevThreshold = currentIndex > 0 ? allMilestones[currentIndex - 1].threshold : 0;
    const nextThreshold = nextMilestone.threshold;

    const progress = ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    return Math.max(0, Math.min(progress, 100));
  }, [totalPoints, nextMilestone]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "glass-panel-strong p-8 md:p-12",
        className
      )}
      role="region"
      aria-label="Quokka Points summary"
    >
      {/* Background Decoration */}
      <div
        className="absolute inset-0 opacity-5 select-none pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64">
          <QuokkaIcon size="xl" variant="outline" />
        </div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64">
          <QuokkaIcon size="xl" variant="outline" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left: Icon + Points */}
          <div className="flex items-center gap-4">
            <QuokkaIcon size="xl" variant="filled" animate="pulse" />
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-bold text-primary tabular-nums">
                {totalPoints.toLocaleString()}
              </h1>
              <p className="text-sm text-muted-foreground glass-text">
                Total Quokka Points
              </p>
            </div>
          </div>

          {/* Right: Weekly Badge */}
          {weeklyPoints > 0 && (
            <Badge
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 text-base"
            >
              <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
              <span className="font-semibold text-success">
                +{weeklyPoints} this week
              </span>
            </Badge>
          )}
        </div>

        {/* Next Milestone Progress */}
        {nextMilestone ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium glass-text">
                Progress to {nextMilestone.label}
              </p>
              <p className="text-sm font-semibold text-primary tabular-nums">
                {totalPoints.toLocaleString()} / {nextMilestone.threshold.toLocaleString()}
              </p>
            </div>
            <Progress
              value={progressPercent}
              className="h-3"
              aria-label={`${progressPercent.toFixed(0)}% progress to ${nextMilestone.label}`}
            />
            <p className="text-xs text-muted-foreground glass-text">
              {nextMilestone.threshold - totalPoints} points to go
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm font-medium text-success">
              🎉 Congratulations {userName}! You&apos;ve achieved all milestones!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { QuokkaPointsData } from "@/lib/models/types";

export interface QuokkaPointsBadgeProps {
  /**
   * Total Quokka Points balance
   */
  totalPoints: number;

  /**
   * Points earned this week
   */
  weeklyPoints: number;

  /**
   * Array of point sources (breakdown) - show top 3
   */
  pointSources: QuokkaPointsData["pointSources"];

  /**
   * Milestones for progress tracking
   */
  milestones: QuokkaPointsData["milestones"];

  /**
   * Optional click handler to view full details
   */
  onViewDetails?: () => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function QuokkaPointsBadge({
  totalPoints,
  weeklyPoints,
  pointSources,
  milestones,
  onViewDetails,
  className,
}: QuokkaPointsBadgeProps) {
  // Derive next milestone
  const nextMilestone = React.useMemo(
    () => milestones.find((m) => !m.achieved),
    [milestones]
  );

  // Calculate progress percentage
  const progressPercent = React.useMemo(() => {
    if (!nextMilestone) return 100;

    const prevMilestone = milestones.filter((m) => m.achieved).pop();
    const prevThreshold = prevMilestone?.threshold || 0;
    const nextThreshold = nextMilestone.threshold;

    const progress =
      ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    return Math.max(0, Math.min(progress, 100));
  }, [totalPoints, milestones, nextMilestone]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-[44px] gap-2 px-3",
            "transition-all duration-300 ease-out",
            "hover:bg-primary/10 hover:scale-[1.05]",
            "motion-reduce:hover:scale-100",
            "focus-visible:ring-4 focus-visible:ring-primary/60",
            className
          )}
          aria-label={`${totalPoints} Quokka Points`}
        >
          <span className="text-lg" aria-hidden="true">
            🦘
          </span>
          <span className="font-semibold text-primary tabular-nums">
            {totalPoints.toLocaleString()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 glass-panel p-4"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                🦘
              </span>
              <h3 className="text-lg font-semibold">Quokka Points</h3>
            </div>
            <p className="text-sm text-muted-foreground glass-text">
              +{weeklyPoints} this week
            </p>
          </div>

          {/* Point Display */}
          <div>
            <div
              className="text-4xl font-bold text-primary tabular-nums"
              aria-label={`${totalPoints} total points`}
            >
              {totalPoints.toLocaleString()}
            </div>
          </div>

          {/* Progress to Next Milestone */}
          {nextMilestone && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground glass-text">
                Progress to {nextMilestone.label} (
                {nextMilestone.threshold.toLocaleString()})
              </p>
            </div>
          )}

          {/* All Milestones Achieved */}
          {!nextMilestone && progressPercent === 100 && (
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs font-medium text-success">
                🎉 All milestones achieved!
              </p>
            </div>
          )}

          {/* Point Sources Breakdown (Top 3) */}
          {pointSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                Top Sources:
              </h4>
              <ul className="space-y-1.5">
                {pointSources.slice(0, 3).map((source) => {
                  const Icon = source.icon;
                  return (
                    <li
                      key={source.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Icon
                        className="h-3 w-3 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground glass-text">
                        {source.label}: {source.count} × {source.pointsPerAction}{" "}
                        ={" "}
                        <span className="font-medium text-foreground">
                          {source.points} pts
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* View Full Details Button */}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="w-full"
            >
              View Full Details
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

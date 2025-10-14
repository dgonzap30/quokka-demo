"use client";

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuokkaIcon } from "@/components/ui/quokka-icon";
import { cn } from "@/lib/utils";
import type { QuokkaPointsData } from "@/lib/models/types";

export interface QuokkaPointsCardProps {
  /**
   * Total Quokka Points balance
   */
  totalPoints: number;

  /**
   * Points earned this week
   */
  weeklyPoints: number;

  /**
   * Array of point sources (breakdown)
   * Sorted by points (highest first)
   */
  pointSources: QuokkaPointsData["pointSources"];

  /**
   * Milestones for progress tracking
   * Sorted by threshold (ascending)
   */
  milestones: QuokkaPointsData["milestones"];

  /**
   * Optional 7-day sparkline data (points earned per day)
   */
  sparklineData?: number[];

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;

  /**
   * Optional click handler to view detailed points history
   */
  onViewDetails?: () => void;
}

export function QuokkaPointsCard({
  totalPoints,
  weeklyPoints,
  pointSources,
  milestones,
  sparklineData,
  loading = false,
  className,
  onViewDetails,
}: QuokkaPointsCardProps) {
  // Derive next milestone
  const nextMilestone = useMemo(
    () => milestones.find((m) => !m.achieved),
    [milestones]
  );

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!nextMilestone) return 100; // All milestones achieved

    const prevMilestone = milestones
      .filter((m) => m.achieved)
      .pop();
    const prevThreshold = prevMilestone?.threshold || 0;
    const nextThreshold = nextMilestone.threshold;

    const progress =
      ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    return Math.max(0, Math.min(progress, 100));
  }, [totalPoints, milestones, nextMilestone]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn("glass-panel", className)}>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-12 w-32 bg-glass-medium" />
          <Skeleton className="h-16 w-40 bg-glass-medium" />
          <Skeleton className="h-3 w-full bg-glass-medium" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-glass-medium" />
            <Skeleton className="h-6 w-44 bg-glass-medium" />
            <Skeleton className="h-6 w-52 bg-glass-medium" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty/Zero state
  if (totalPoints === 0) {
    return (
      <Card variant="glass" className={cn(className)}>
        <CardContent className="p-6 text-center space-y-3">
          <div className="flex justify-center">
            <QuokkaIcon size="lg" variant="outline" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Start Earning Quokka Points!</h3>
            <p className="text-sm text-muted-foreground glass-text">
              Ask questions, help peers, and get endorsed to earn points
            </p>
          </div>
          <Button variant="default" asChild>
            <Link href="/ask">Ask Your First Question</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass-hover" className={cn("relative overflow-hidden", className)}>
      {/* Background Decoration - Quokka Icon */}
      <div
        className="absolute top-4 right-4 opacity-10 select-none"
        aria-hidden="true"
      >
        <QuokkaIcon size="xl" variant="outline" />
      </div>

      <CardContent className="p-6 relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <QuokkaIcon size="md" variant="filled" animate="pulse" />
            <h3 className="text-sm font-medium text-muted-foreground glass-text">
              Quokka Points
            </h3>
          </div>
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          )}
        </div>

        {/* Point Display */}
        <div
          className="space-y-1"
          role="region"
          aria-labelledby="quokka-points-heading"
        >
          <h3 id="quokka-points-heading" className="sr-only">
            Quokka Points Balance
          </h3>
          <div aria-label={`${totalPoints} total Quokka Points`}>
            <span
              className="text-5xl font-bold text-primary tabular-nums block"
              aria-hidden="true"
            >
              {totalPoints.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground glass-text">
            +{weeklyPoints} this week
          </p>
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <Progress
              value={progressPercent}
              className="h-3"
              aria-label={`Progress to ${nextMilestone.label}: ${progressPercent.toFixed(0)}%`}
            />
            <p className="text-sm text-muted-foreground glass-text">
              Progress to {nextMilestone.label} ({nextMilestone.threshold.toLocaleString()})
            </p>
          </div>
        )}

        {/* All Milestones Achieved */}
        {!nextMilestone && progressPercent === 100 && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm font-medium text-success">
              🎉 All milestones achieved! You&apos;re a Community Expert!
            </p>
          </div>
        )}

        {/* Point Sources Breakdown */}
        {pointSources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium glass-text">Top Sources:</h4>
            <ul
              className="space-y-1.5"
              aria-label="Point sources breakdown"
            >
              {pointSources.slice(0, 3).map((source) => {
                const Icon = source.icon;
                return (
                  <li
                    key={source.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground glass-text">
                      {source.label}: {source.count} × {source.pointsPerAction} ={" "}
                      <span className="font-medium text-foreground">{source.points} pts</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Optional Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <MiniSparkline data={sparklineData} />
            </div>
            <span className="text-xs text-muted-foreground glass-text">
              Last 7 days
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple sparkline component for 7-day point history
function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data, 1); // Avoid division by zero
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / max) * 100; // Invert Y (SVG coords)
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 24"
      className="h-6 w-16"
      aria-label="Points trend over last 7 days"
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
      />
    </svg>
  );
}

"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PointSource } from "@/lib/models/types";

export interface PointSourcesBreakdownProps {
  /**
   * Array of point sources (sorted by points DESC)
   */
  pointSources: PointSource[];

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * PointSourcesBreakdown - Detailed table/grid showing all point sources
 *
 * Features:
 * - Dual responsive layouts (table for desktop, cards for mobile)
 * - Rank badges with special styling for top 3 (gold, silver, bronze)
 * - Displays count, points per action, total points, and percentage
 * - Empty state for users with no points yet
 * - Hover states on table rows
 *
 * Purpose:
 * Provides a comprehensive breakdown of where the user's Quokka Points
 * came from, helping them understand which activities are most valuable.
 *
 * Accessibility:
 * - Semantic table structure with thead and tbody
 * - Column headers for screen readers
 * - Icons marked as decorative (aria-hidden)
 * - Tabular nums for numeric alignment
 *
 * @example
 * ```tsx
 * <PointSourcesBreakdown
 *   pointSources={[
 *     { id: "peer", label: "Peer Endorsements", icon: ThumbsUp, points: 50, count: 10, pointsPerAction: 5 },
 *     { id: "helpful", label: "Helpful Answers", icon: MessageSquare, points: 100, count: 10, pointsPerAction: 10 },
 *     // ...
 *   ]}
 * />
 * ```
 */
export function PointSourcesBreakdown({
  pointSources,
  className,
}: PointSourcesBreakdownProps) {
  // Calculate total points for percentage
  const totalPoints = React.useMemo(
    () => pointSources.reduce((sum, source) => sum + source.points, 0),
    [pointSources]
  );

  // Empty state
  if (pointSources.length === 0) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <p className="text-muted-foreground glass-text">
          No point sources yet. Start earning points by participating in discussions!
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={cn("overflow-hidden", className)}>
      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-glass-subtle">
              <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Source</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Count</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Points/Action</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Total Points</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {pointSources.map((source, index) => (
              <SourceTableRow
                key={source.id}
                source={source}
                rank={index + 1}
                totalPoints={totalPoints}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden divide-y divide-border">
        {pointSources.map((source, index) => (
          <SourceCard
            key={source.id}
            source={source}
            rank={index + 1}
            totalPoints={totalPoints}
          />
        ))}
      </div>
    </Card>
  );
}

// Table row component (desktop)
interface SourceTableRowProps {
  source: PointSource;
  rank: number;
  totalPoints: number;
}

function SourceTableRow({ source, rank, totalPoints }: SourceTableRowProps) {
  const Icon = source.icon;
  const percentage = ((source.points / totalPoints) * 100).toFixed(1);

  return (
    <tr className="border-b border-border hover:bg-glass-subtle/50 transition-colors">
      <td className="px-6 py-4">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm",
            rank === 1
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              : rank === 2
              ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
              : rank === 3
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500"
              : "bg-glass-subtle text-muted-foreground"
          )}
        >
          {rank}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          <span className="font-medium">{source.label}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right tabular-nums">
        {source.count}
      </td>
      <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
        {source.pointsPerAction}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-semibold text-primary tabular-nums">
          {source.points}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-muted-foreground glass-text tabular-nums">
        {percentage}%
      </td>
    </tr>
  );
}

// Card component (mobile)
interface SourceCardProps {
  source: PointSource;
  rank: number;
  totalPoints: number;
}

function SourceCard({ source, rank, totalPoints }: SourceCardProps) {
  const Icon = source.icon;
  const percentage = ((source.points / totalPoints) * 100).toFixed(1);

  return (
    <div className="p-4 space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs",
              rank === 1
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                : rank === 2
                ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                : rank === 3
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500"
                : "bg-glass-subtle text-muted-foreground"
            )}
          >
            {rank}
          </div>
          {/* Icon + Label */}
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span className="font-medium text-sm">{source.label}</span>
          </div>
        </div>
        {/* Total Points */}
        <span className="font-semibold text-primary tabular-nums">
          {source.points} pts
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground glass-text mb-1">Count</p>
          <p className="font-medium tabular-nums">{source.count}</p>
        </div>
        <div>
          <p className="text-muted-foreground glass-text mb-1">Per Action</p>
          <p className="font-medium tabular-nums">{source.pointsPerAction} pts</p>
        </div>
        <div>
          <p className="text-muted-foreground glass-text mb-1">% of Total</p>
          <p className="font-medium tabular-nums">{percentage}%</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PointMilestone } from "@/lib/models/types";
import { Award, Trophy, Target, Star, Crown, Check } from "lucide-react";

export interface MilestonesTimelineProps {
  /**
   * Array of milestones (sorted by threshold ASC)
   */
  milestones: PointMilestone[];

  /**
   * Optional className for composition
   */
  className?: string;
}

// Map milestone labels to icons
const MILESTONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Getting Started": Award,
  "Active Learner": Target,
  "Active Contributor": Star,
  "Helpful Contributor": Trophy,
  "Community Expert": Crown,
};

/**
 * MilestonesTimeline - Visual timeline showing all milestones with achievement status
 *
 * Features:
 * - Dual responsive layouts (vertical for mobile, horizontal for desktop)
 * - Achievement status indicators (checkmark for achieved, icon for pending)
 * - Current milestone highlighting with ring glow effect
 * - Progress connector lines between milestones
 * - Badge labels ("In Progress" for current, "Current" for desktop)
 *
 * Purpose:
 * Displays the user's progress through the 5 Quokka Point milestones,
 * with visual feedback for achieved, current, and future milestones.
 *
 * Accessibility:
 * - Semantic HTML with heading hierarchy
 * - ARIA attributes for checkmarks and decorative icons
 * - Connector lines hidden from screen readers
 * - Badge labels provide context for current milestone
 *
 * @example
 * ```tsx
 * <MilestonesTimeline
 *   milestones={[
 *     { threshold: 100, label: "Getting Started", achieved: true },
 *     { threshold: 250, label: "Active Learner", achieved: false },
 *     // ...
 *   ]}
 * />
 * ```
 */
export function MilestonesTimeline({ milestones, className }: MilestonesTimelineProps) {
  // Find current milestone (last achieved or next to achieve)
  const currentIndex = React.useMemo(() => {
    const lastAchievedIndex = milestones.findIndex((m) => !m.achieved) - 1;
    return Math.max(0, lastAchievedIndex);
  }, [milestones]);

  return (
    <Card variant="glass" className={cn("p-6 md:p-8", className)}>
      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden space-y-4">
        {milestones.map((milestone, index) => (
          <MilestoneItemVertical
            key={milestone.label}
            milestone={milestone}
            index={index}
            totalCount={milestones.length}
            isLast={index === milestones.length - 1}
            isCurrent={index === currentIndex}
          />
        ))}
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {milestones.map((milestone, index) => (
          <React.Fragment key={milestone.label}>
            <MilestoneItemHorizontal
              milestone={milestone}
              isCurrent={index === currentIndex}
            />
            {/* Connector Line */}
            {index < milestones.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  milestone.achieved ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

// Vertical timeline item (mobile)
interface MilestoneItemVerticalProps {
  milestone: PointMilestone;
  index: number;
  totalCount: number;
  isLast: boolean;
  isCurrent: boolean;
}

function MilestoneItemVertical({
  milestone,
  index,
  isLast,
  isCurrent,
}: MilestoneItemVerticalProps) {
  const Icon = MILESTONE_ICONS[milestone.label] || Award;

  return (
    <div className="flex gap-4">
      {/* Left: Icon + Line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border-2",
            milestone.achieved
              ? "bg-primary border-primary text-white"
              : isCurrent
              ? "bg-background border-primary text-primary"
              : "bg-background border-border text-muted-foreground"
          )}
        >
          {milestone.achieved ? (
            <Check className="h-6 w-6" aria-label="Achieved" />
          ) : (
            <Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 h-16 mt-2",
              milestone.achieved ? "bg-primary" : "bg-border"
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Right: Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              "text-base font-semibold",
              milestone.achieved ? "text-primary" : "text-foreground"
            )}
          >
            {milestone.label}
          </h3>
          {isCurrent && !milestone.achieved && (
            <Badge variant="outline" className="text-xs">
              In Progress
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground glass-text">
          {milestone.threshold.toLocaleString()} points
        </p>
      </div>
    </div>
  );
}

// Horizontal timeline item (desktop)
interface MilestoneItemHorizontalProps {
  milestone: PointMilestone;
  isCurrent: boolean;
}

function MilestoneItemHorizontal({
  milestone,
  isCurrent,
}: MilestoneItemHorizontalProps) {
  const Icon = MILESTONE_ICONS[milestone.label] || Award;

  return (
    <div className="flex flex-col items-center gap-3 min-w-[120px]">
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all",
          milestone.achieved
            ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
            : isCurrent
            ? "bg-background border-primary text-primary ring-4 ring-primary/20"
            : "bg-background border-border text-muted-foreground"
        )}
      >
        {milestone.achieved ? (
          <Check className="h-8 w-8" aria-label="Achieved" />
        ) : (
          <Icon className="h-8 w-8" aria-hidden="true" />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <h3
          className={cn(
            "text-sm font-semibold leading-tight mb-1",
            milestone.achieved ? "text-primary" : "text-foreground"
          )}
        >
          {milestone.label}
        </h3>
        <p className="text-xs text-muted-foreground glass-text">
          {milestone.threshold.toLocaleString()} pts
        </p>
        {isCurrent && !milestone.achieved && (
          <Badge variant="outline" className="text-xs mt-1">
            Current
          </Badge>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Flame, CheckCircle2 } from "lucide-react";

export interface StudyStreakCardProps {
  /**
   * Current streak count (consecutive days with activity)
   */
  streakDays: number;

  /**
   * Weekly activity count (posts, threads, endorsements)
   */
  weeklyActivity: number;

  /**
   * Weekly goal target
   */
  goalTarget: number;

  /**
   * Array of recent achievements (optional)
   */
  achievements?: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    earnedAt: string;
  }>;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function StudyStreakCard({
  streakDays,
  weeklyActivity,
  goalTarget,
  achievements = [],
  loading = false,
  className,
}: StudyStreakCardProps) {
  // Compute progress percentage
  const progressPercent = Math.min((weeklyActivity / goalTarget) * 100, 100);
  const isGoalMet = weeklyActivity >= goalTarget;

  // Motivational message based on streak
  const getMessage = () => {
    if (streakDays === 0) return "Start your streak today!";
    if (streakDays === 1) return "Great start! Keep it up!";
    if (streakDays < 7) return `${streakDays} day streak! You're on fire!`;
    return `${streakDays} day streak! Incredible consistency!`;
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn("glass-panel", className)}>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-16 w-32 bg-glass-medium" />
          <Skeleton className="h-3 w-full bg-glass-medium" />
          <Skeleton className="h-8 w-24 bg-glass-medium" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass-hover" className={cn("relative overflow-hidden", className)}>
      {/* Flame icon background decoration */}
      <div className="absolute top-4 right-4 opacity-10" aria-hidden="true">
        <Flame className="h-24 w-24 text-warning" />
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Streak Display */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground glass-text">
              Study Streak
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary tabular-nums">
                {streakDays}
              </span>
              <span className="text-lg text-muted-foreground">
                {streakDays === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground glass-text">{getMessage()}</p>
          </div>

          <Flame
            className={cn(
              "h-10 w-10 transition-colors",
              streakDays > 0 ? "text-warning" : "text-muted-foreground"
            )}
            aria-label="Streak flame icon"
          />
        </div>

        {/* Weekly Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground glass-text">Weekly Goal</span>
            <span className="font-medium tabular-nums">
              {weeklyActivity} / {goalTarget}
            </span>
          </div>

          <Progress
            value={progressPercent}
            className="h-3"
            aria-label={`Weekly goal progress: ${progressPercent.toFixed(0)}%`}
          />

          {isGoalMet && (
            <div className="flex items-center gap-1.5 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">Goal achieved!</span>
            </div>
          )}
        </div>

        {/* Recent Achievements (optional) */}
        {achievements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground glass-text mb-2">
              Recent Achievements
            </p>
            <div className="flex gap-2">
              {achievements.slice(0, 3).map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10"
                    title={achievement.title}
                    aria-label={achievement.title}
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

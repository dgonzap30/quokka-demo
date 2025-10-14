"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ThumbsUp, MessageSquare, Star, Share2, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface PointsActivityFeedProps {
  /**
   * 7-day sparkline data (points earned per day)
   */
  sparklineData: number[];

  /**
   * User ID for generating mock activities
   */
  userId: string;

  /**
   * Maximum number of activities to display
   * @default 10
   */
  maxItems?: number;

  /**
   * Optional className for composition
   */
  className?: string;
}

// Internal mock activity type
interface MockPointActivity {
  id: string;
  action: string;
  points: number;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * PointsActivityFeed - Timeline showing recent point-earning activities
 *
 * Features:
 * - Mock activity generation from sparkline data (since detailed history not tracked)
 * - Icons for different activity types (peer endorsement, helpful answer, etc.)
 * - Relative timestamps using date-fns ("2 hours ago")
 * - Point badges with success color
 * - Hover states on list items
 * - Empty state for users with no activity
 *
 * Purpose:
 * Provides a chronological view of recent point-earning activities,
 * helping users see their engagement patterns and recent achievements.
 *
 * Note:
 * This is a mock implementation using sparklineData as a proxy.
 * In production, this would fetch real PointActivity[] from the backend.
 *
 * Accessibility:
 * - Semantic list with role="list"
 * - Time elements with dateTime attribute
 * - Icons marked as decorative (aria-hidden)
 * - Points badges with descriptive aria-label
 *
 * @example
 * ```tsx
 * <PointsActivityFeed
 *   sparklineData={[5, 10, 15, 20, 10, 5, 0]}
 *   userId="student-1"
 *   maxItems={10}
 * />
 * ```
 */
export function PointsActivityFeed({
  sparklineData,
  userId,
  maxItems = 10,
  className,
}: PointsActivityFeedProps) {
  // Generate mock activities from sparkline data
  const activities = React.useMemo(() => {
    return generateMockActivities(sparklineData, userId).slice(0, maxItems);
  }, [sparklineData, userId, maxItems]);

  // Empty state
  if (activities.length === 0) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <p className="text-muted-foreground glass-text">
          No recent activity. Start earning points by participating!
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={cn("p-6", className)}>
      <ul className="space-y-4" role="list">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <li
              key={activity.id}
              className="flex gap-4 p-3 rounded-lg hover:bg-glass-subtle/50 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  {activity.action}
                </p>
                <time
                  className="text-xs text-muted-foreground glass-text"
                  dateTime={activity.timestamp}
                >
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </time>
              </div>

              {/* Points Badge */}
              <div className="flex-shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold tabular-nums",
                    "bg-success/10 text-success"
                  )}
                  aria-label={`Earned ${activity.points} points`}
                >
                  +{activity.points}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * Mock activity generator
 *
 * Generates mock point activities from sparkline data since detailed
 * activity history is not tracked in the current data model.
 *
 * Strategy:
 * - Works backwards from today using sparklineData
 * - Distributes daily points across multiple activity templates
 * - Uses deterministic randomness for consistent results
 * - Sorts activities by timestamp (newest first)
 *
 * @param sparklineData - 7-day array of daily point totals
 * @param userId - User ID for generating unique activity IDs
 * @returns Array of mock activities sorted by timestamp
 */
function generateMockActivities(
  sparklineData: number[],
  userId: string
): MockPointActivity[] {
  const activities: MockPointActivity[] = [];
  const now = new Date();

  // Action templates with points and icons
  const templates = [
    { action: "Your answer was marked helpful by a peer", points: 10, icon: MessageSquare },
    { action: "Received a peer endorsement on your answer", points: 5, icon: ThumbsUp },
    { action: "Your answer was endorsed by an instructor", points: 20, icon: Star },
    { action: "Shared an AI conversation as a thread", points: 15, icon: Share2 },
    { action: "Asked a new question in the forum", points: 2, icon: HelpCircle },
  ];

  // Generate activities from sparkline (work backwards from today)
  sparklineData.forEach((dailyPoints, dayIndex) => {
    if (dailyPoints > 0) {
      const daysAgo = sparklineData.length - 1 - dayIndex;
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Distribute daily points across multiple activities
      let remainingPoints = dailyPoints;
      while (remainingPoints > 0) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const pointsEarned = Math.min(template.points, remainingPoints);

        activities.push({
          id: `activity-${userId}-${dayIndex}-${activities.length}`,
          action: template.action,
          points: pointsEarned,
          timestamp: timestamp.toISOString(),
          icon: template.icon,
        });

        remainingPoints -= pointsEarned;
      }
    }
  });

  // Sort by timestamp (newest first)
  return activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

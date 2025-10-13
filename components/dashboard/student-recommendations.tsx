"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Lightbulb, MessageSquare } from "lucide-react";
import type { RecommendedThread } from "@/lib/models/types";

export interface StudentRecommendationsProps {
  /**
   * Array of recommended threads
   */
  recommendations: RecommendedThread[];

  /**
   * Maximum items to display (default: 6)
   */
  maxItems?: number;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional empty message
   */
  emptyMessage?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function StudentRecommendations({
  recommendations,
  maxItems = 6,
  loading = false,
  emptyMessage = "No recommendations yet. Check back after more activity!",
  className,
}: StudentRecommendationsProps) {
  const displayedRecommendations = React.useMemo(
    () => recommendations.slice(0, maxItems),
    [recommendations, maxItems]
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 bg-glass-medium rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (displayedRecommendations.length === 0) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <div className="space-y-3">
          <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground glass-text">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}
      role="list"
      aria-label="Recommended threads"
    >
      {displayedRecommendations.map((rec) => (
        <RecommendationCard key={rec.thread.id} recommendation={rec} />
      ))}
    </div>
  );
}

// Internal RecommendationCard component
function RecommendationCard({ recommendation }: { recommendation: RecommendedThread }) {
  const { thread, courseName, reason } = recommendation;

  const reasonLabels = {
    "high-engagement": "Trending in your course",
    "trending": "Popular this week",
    "unanswered": "Needs an answer",
    "similar-interests": "Based on your activity",
  };

  const reasonColors = {
    "high-engagement": "text-warning",
    "trending": "text-success",
    "unanswered": "text-danger",
    "similar-interests": "text-accent",
  };

  return (
    <Link href={`/threads/${thread.id}`} className="block" role="listitem">
      <article>
        <Card variant="glass-hover" className="h-full transition-all hover:shadow-e2">
          <CardContent className="p-4 space-y-3">
            {/* Header: Course + Reason Badge */}
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                {courseName}
              </Badge>
              <span className={cn("text-xs font-medium shrink-0", reasonColors[reason])}>
                {reasonLabels[reason]}
              </span>
            </div>

            {/* Thread Title */}
            <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 glass-text">
              {thread.title}
            </h3>

            {/* Thread Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 glass-text">
              {thread.content}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{thread.views} views</span>
              </div>
              <span aria-hidden="true">•</span>
              <time dateTime={thread.createdAt}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </time>
              {thread.hasAIAnswer && (
                <>
                  <span aria-hidden="true">•</span>
                  <Badge variant="outline" className="text-xs bg-ai-purple-50 border-ai-purple-200">
                    AI Answer
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
}

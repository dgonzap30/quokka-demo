"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle2, Flag, ExternalLink, TrendingUp, Clock, Eye } from "lucide-react";
import type { InstructorInsight, UrgencyLevel } from "@/lib/models/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PriorityQueueCardProps {
  /** Insight data for this card */
  insight: InstructorInsight;

  /** Whether this card is selected for bulk actions */
  isSelected?: boolean;

  /** Callback when selection changes */
  onSelectionChange?: (selected: boolean) => void;

  /** Callback for quick endorse action */
  onEndorse?: (insightId: string) => void;

  /** Callback for quick flag action */
  onFlag?: (insightId: string) => void;

  /** Whether actions are loading */
  isLoading?: boolean;

  /** Optional CSS classes */
  className?: string;
}

const urgencyConfig: Record<UrgencyLevel, { color: string; label: string }> = {
  critical: {
    color: "bg-danger/10 text-danger border-danger/20",
    label: "Critical",
  },
  high: {
    color: "bg-warning/10 text-warning border-warning/20",
    label: "High Priority",
  },
  medium: {
    color: "bg-accent/10 text-accent border-accent/20",
    label: "Medium",
  },
  low: {
    color: "bg-muted text-muted-foreground border-border",
    label: "Low",
  },
};

const reasonFlagLabels: Record<string, string> = {
  high_views: "High traffic",
  unanswered_48h: "Unanswered 48h+",
  low_ai_confidence: "Low AI confidence",
  no_instructor_response: "No instructor response",
  student_confusion: "Student confusion signals",
  high_engagement: "High engagement",
};

/**
 * Priority queue card for instructor insights
 *
 * Displays a single question/thread with priority score, urgency level,
 * engagement metrics, and explainable AI reason flags. Supports quick
 * actions and bulk selection.
 *
 * Features:
 * - Priority score visualization (0-100)
 * - Urgency badge (critical/high/medium/low)
 * - Engagement metrics (views, replies, time open)
 * - AI answer confidence indicator
 * - Reason flags (explainable AI)
 * - Quick actions (endorse, flag)
 * - Bulk selection checkbox
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <PriorityQueueCard
 *   insight={insight}
 *   isSelected={selectedIds.includes(insight.thread.id)}
 *   onSelectionChange={(selected) => toggleSelection(insight.thread.id)}
 *   onEndorse={(id) => handleEndorse(id)}
 * />
 * ```
 */
export function PriorityQueueCard({
  insight,
  isSelected = false,
  onSelectionChange,
  onEndorse,
  onFlag,
  isLoading = false,
  className,
}: PriorityQueueCardProps) {
  const { thread, priorityScore, urgency, engagement, reasonFlags, aiAnswer } = insight;
  const urgencyStyle = urgencyConfig[urgency];

  // Format time open
  const hoursOpen = Math.floor(
    (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60)
  );
  const timeOpenText =
    hoursOpen < 24 ? `${hoursOpen}h` : `${Math.floor(hoursOpen / 24)}d`;

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all",
        "hover:border-primary/30 hover:shadow-e2",
        isSelected && "border-primary/50 bg-primary/5",
        className
      )}
      role="article"
      aria-label={`Question: ${thread.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {onSelectionChange && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            disabled={isLoading}
            aria-label={`Select question: ${thread.title}`}
            className="mt-1"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header: Title + Urgency Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link
              href={`/threads/${thread.id}`}
              className="flex-1 min-w-0 group/link"
            >
              <h3 className="text-base font-semibold text-foreground group-hover/link:text-primary transition-colors line-clamp-2">
                {thread.title}
              </h3>
            </Link>
            <Badge
              variant="outline"
              className={cn("shrink-0", urgencyStyle.color)}
            >
              {urgencyStyle.label}
            </Badge>
          </div>

          {/* Priority Score + Engagement Metrics */}
          <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium text-primary">
                {priorityScore.toFixed(0)}
              </span>
              <span className="text-xs">priority</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{engagement.views}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{engagement.replies}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{timeOpenText} open</span>
            </div>
            {aiAnswer && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs">AI confidence:</span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    aiAnswer.confidenceScore >= 80
                      ? "text-success"
                      : aiAnswer.confidenceScore >= 60
                      ? "text-warning"
                      : "text-danger"
                  )}
                >
                  {aiAnswer.confidenceScore.toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Reason Flags (Explainable AI) */}
          {reasonFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {reasonFlags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {reasonFlagLabels[flag] || flag}
                </span>
              ))}
            </div>
          )}

          {/* Thread Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {thread.content}
          </p>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <Link href={`/threads/${thread.id}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                View Thread
              </Link>
            </Button>

            {aiAnswer && onEndorse && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onEndorse(insight.thread.id)}
                disabled={isLoading || aiAnswer.instructorEndorsed}
                className="h-8"
                aria-label={`Endorse AI answer for: ${thread.title}`}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {aiAnswer.instructorEndorsed ? "Endorsed" : "Endorse"}
              </Button>
            )}

            {onFlag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFlag(insight.thread.id)}
                disabled={isLoading}
                className="h-8"
                aria-label={`Flag question for review: ${thread.title}`}
              >
                <Flag className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Flag
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

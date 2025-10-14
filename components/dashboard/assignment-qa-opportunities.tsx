"use client";

import * as React from "react";
import { useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  AlertCircle,
  Sparkles,
  Users,
  Calendar,
} from "lucide-react";
import type { AssignmentQAMetrics } from "@/lib/models/types";

export interface AssignmentQAOpportunitiesProps {
  /**
   * Array of assignments with Q&A metrics (sorted by due date, nearest first)
   */
  assignments: AssignmentQAMetrics[];

  /**
   * Maximum items to display (default: 5)
   */
  maxItems?: number;

  /**
   * Optional course filter
   */
  courseId?: string;

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

export function AssignmentQAOpportunities({
  assignments,
  maxItems = 5,
  courseId,
  loading = false,
  emptyMessage,
  className,
}: AssignmentQAOpportunitiesProps) {
  // Filter assignments by course and limit to maxItems
  const filteredAssignments = useMemo(() => {
    const filtered = courseId
      ? assignments.filter((a) => a.courseId === courseId)
      : assignments;
    return filtered.slice(0, maxItems);
  }, [assignments, courseId, maxItems]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-4 rounded-full bg-glass-medium shrink-0 mt-1" />
            <Skeleton className="h-48 flex-1 bg-glass-medium rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (filteredAssignments.length === 0) {
    return (
      <Card variant="glass" className={cn("p-6 text-center", className)}>
        <div className="space-y-3">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No Upcoming Assignments</h3>
            <p className="text-sm text-muted-foreground glass-text">
              {emptyMessage || "Check back later for assignment Q&A opportunities"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <ol
      className={cn("relative space-y-4", className)}
      aria-label="Assignment Q&A opportunities"
      role="list"
    >
      {filteredAssignments.map((assignment, index) => (
        <AssignmentQAItem
          key={assignment.assignmentId}
          assignment={assignment}
          showConnector={index < filteredAssignments.length - 1}
        />
      ))}
    </ol>
  );
}

// Internal component for individual assignment item
function AssignmentQAItem({
  assignment,
  showConnector,
}: {
  assignment: AssignmentQAMetrics;
  showConnector: boolean;
}) {
  // Calculate relative due date
  const relativeDueDate = useCallback((dueDate: string) => {
    const date = new Date(dueDate);
    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  }, []);

  // Determine timeline dot color based on urgency
  const dotColor = useMemo(() => {
    if (assignment.unansweredQuestions >= 5) return "bg-danger border-danger";
    if (assignment.unansweredQuestions >= 1) return "bg-warning border-warning";
    if (assignment.activeStudents >= 10) return "bg-accent border-accent";
    return "bg-success border-success";
  }, [assignment.unansweredQuestions, assignment.activeStudents]);

  // Determine urgency level for screen readers
  const urgencyLevel = useMemo(() => {
    if (assignment.unansweredQuestions >= 5) return "High urgency - many unanswered questions";
    if (assignment.unansweredQuestions >= 1) return "Moderate urgency - some unanswered questions";
    if (assignment.activeStudents >= 10) return "Active discussion";
    return "All questions answered";
  }, [assignment.unansweredQuestions, assignment.activeStudents]);

  return (
    <li className="relative flex gap-4" role="listitem">
      {/* Timeline Dot and Connector */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className={cn("size-4 rounded-full border-2", dotColor)}
          aria-label={urgencyLevel}
          title={urgencyLevel}
        />
        {showConnector && (
          <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />
        )}
      </div>

      {/* Card Content */}
      <Card variant="glass-hover" className="flex-1">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div
            role="region"
            aria-labelledby={`assignment-${assignment.assignmentId}-title`}
          >
            <h3
              id={`assignment-${assignment.assignmentId}-title`}
              className="text-base font-semibold glass-text"
            >
              {assignment.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{assignment.courseName}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={assignment.dueDate}>
                {relativeDueDate(assignment.dueDate)}
              </time>
            </div>
          </div>

          {/* Q&A Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{assignment.totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
              <span>{assignment.unansweredQuestions} unanswered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
              <span>{assignment.aiAnswersAvailable} AI answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{assignment.activeStudents} discussing</span>
            </div>
          </div>

          {/* Your Activity Badge */}
          {(assignment.yourQuestions > 0 || assignment.yourAnswers > 0) && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Your Activity: {assignment.yourQuestions} questions,{" "}
                {assignment.yourAnswers} answers
              </Badge>
            </div>
          )}

          {/* Recent Activity */}
          {assignment.recentActivity && (
            <div className="text-xs text-muted-foreground glass-text">
              {assignment.recentActivity}
            </div>
          )}

          {/* Suggested Action */}
          <div
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg",
              assignment.suggestedAction === "answer"
                ? "bg-warning/10 border border-warning/20"
                : assignment.suggestedAction === "ask"
                ? "bg-accent/10 border border-accent/20"
                : "bg-muted/50"
            )}
            role="status"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-sm">{assignment.actionReason}</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            {assignment.suggestedAction === "ask" && (
              <Button size="sm" variant="default" asChild>
                <Link href={`${assignment.link}?action=ask`}>
                  Ask Question
                </Link>
              </Button>
            )}
            {assignment.suggestedAction === "answer" && (
              <Button size="sm" variant="default" asChild>
                <Link href={`${assignment.link}?action=answer`}>
                  Help Answer
                </Link>
              </Button>
            )}
            {assignment.suggestedAction === "review" && (
              <Button size="sm" variant="default" asChild>
                <Link href={`${assignment.link}?action=review`}>
                  Review Answers
                </Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link href={assignment.link || "#"}>View All Q&A</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

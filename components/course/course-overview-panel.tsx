"use client";

import type { Thread, User } from "@/lib/models/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseOverviewPanelProps {
  /**
   * Course ID
   */
  courseId: string;

  /**
   * Course name
   */
  courseName?: string;

  /**
   * All threads in the course
   */
  threads: Thread[];

  /**
   * Current user
   */
  user?: User;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * CourseOverviewPanel - Welcome view shown when no thread is selected
 *
 * Features:
 * - Course stats and quick metrics
 * - Recent activity summary
 * - Call-to-action to get started
 * - Expands to fill available space
 * - Glass panel styling (QDS compliant)
 *
 * Purpose:
 * Replaces empty state placeholder with useful information and guidance.
 * Helps users understand course activity at a glance.
 *
 * @example
 * ```tsx
 * <CourseOverviewPanel
 *   courseId={courseId}
 *   courseName={course?.name}
 *   threads={threads || []}
 *   user={user}
 * />
 * ```
 */
export function CourseOverviewPanel({
  courseId,
  courseName,
  threads,
  user,
  className,
}: CourseOverviewPanelProps) {
  // Calculate stats
  const totalThreads = threads.length;
  const unansweredThreads = threads.filter(t => t.status === "open").length;
  const resolvedThreads = threads.filter(t => t.status === "resolved").length;
  const myThreads = threads.filter(t => t.authorId === user?.id).length;

  // Get recent threads (last 3)
  const recentThreads = threads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className={cn("w-full h-full flex items-center justify-center p-8", className)}>
      <div className="max-w-4xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <h1 className="heading-1 glass-text">
            {courseName || `Course ${courseId}`}
          </h1>
          <p className="text-lg text-muted-foreground glass-text max-w-2xl mx-auto leading-relaxed">
            Welcome to the course discussion board. Select a thread from the sidebar to view and participate in the conversation.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass" className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full glass-panel">
                <MessageSquare className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-semibold glass-text">{totalThreads}</div>
                <div className="text-xs text-muted-foreground glass-text">Total Threads</div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full glass-panel">
                <HelpCircle className="h-6 w-6 text-warning" aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-semibold glass-text">{unansweredThreads}</div>
                <div className="text-xs text-muted-foreground glass-text">Unanswered</div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full glass-panel">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-semibold glass-text">{resolvedThreads}</div>
                <div className="text-xs text-muted-foreground glass-text">Resolved</div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full glass-panel">
                <TrendingUp className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-semibold glass-text">{myThreads}</div>
                <div className="text-xs text-muted-foreground glass-text">My Threads</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentThreads.length > 0 && (
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="heading-4 glass-text">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:glass-panel transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium glass-text truncate">{thread.title}</p>
                    <p className="text-xs text-muted-foreground glass-text">
                      {new Date(thread.createdAt).toLocaleDateString()} • {thread.views} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Get Started CTA */}
        <div className="text-center space-y-4">
          <h3 className="heading-4 glass-text">Ready to join the discussion?</h3>
          <p className="text-sm text-muted-foreground glass-text max-w-md mx-auto">
            Browse threads in the sidebar, or use filters to find specific topics. Click any thread to read and respond.
          </p>
        </div>
      </div>
    </div>
  );
}

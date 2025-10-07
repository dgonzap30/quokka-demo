"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { StatusBadge } from "@/components/course/status-badge";
import { Eye, Calendar, Tag } from "lucide-react";
import type { Thread } from "@/lib/models/types";

export interface ThreadCardProps {
  /**
   * Thread data
   */
  thread: Thread;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ThreadCard - Displays a thread summary with clear visual hierarchy
 *
 * Features:
 * - Title prominently displayed with proper weight
 * - Description with line clamping for scanability
 * - Metadata row with icons for quick recognition
 * - Status badge with color-coded styling
 * - AI badge for AI-answered threads
 * - Glass-hover effect for interactivity
 * - Responsive layout that stacks on mobile
 *
 * @example
 * ```tsx
 * <ThreadCard thread={thread} />
 * ```
 */
export function ThreadCard({ thread, className }: ThreadCardProps) {
  return (
    <Link href={`/threads/${thread.id}`} className={className}>
      <Card variant="glass-hover">
        <CardHeader className="p-6">
          {/* Header Row: Title + Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <CardTitle className="text-lg font-semibold leading-snug line-clamp-2 glass-text">
                {thread.title}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed line-clamp-2 glass-text">
                {thread.content}
              </CardDescription>
            </div>
            <StatusBadge status={thread.status} />
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {/* Metadata Row with Icons */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground glass-text">
            {/* AI Badge */}
            {thread.hasAIAnswer && (
              <>
                <AIBadge variant="compact" aria-label="Has AI-generated answer" />
                <span className="text-border">•</span>
              </>
            )}

            {/* Views */}
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{thread.views} views</span>
            </div>

            <span className="text-border">•</span>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  {thread.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {thread.tags.length > 3 && (
                    <span className="text-muted-foreground">
                      +{thread.tags.length - 3}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

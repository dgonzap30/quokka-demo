"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { StatusBadge } from "@/components/course/status-badge";
import { Eye, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/models/types";

export interface ThreadCardProps {
  /**
   * Thread data
   */
  thread: Thread;

  /**
   * Display variant
   * - full: Shows description preview and generous padding (default)
   * - compact: Hides description, tighter padding for list views
   * @default "full"
   */
  variant?: "full" | "compact";

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
export function ThreadCard({ thread, variant = "full", className }: ThreadCardProps) {
  const isCompact = variant === "compact";
  const padding = isCompact ? "p-4" : "p-6";

  return (
    <Link
      href={`/threads/${thread.id}`}
      className={cn(
        "group rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 focus-visible:ring-4 focus-visible:ring-ring/30 transition-all",
        className
      )}
      aria-label={`View thread: ${thread.title}, ${thread.status}, ${thread.views} views`}
    >
      <Card variant="glass-hover" className="transition-all duration-250 group-focus-visible:shadow-[var(--shadow-glass-lg)]">
        <article>
          <CardHeader className={padding}>
            {/* Header Row: Title + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className={cn("flex-1", isCompact ? "space-y-0" : "space-y-3")}>
                <h2 className="text-lg font-semibold leading-snug line-clamp-2 glass-text">
                  {thread.title}
                </h2>
                {!isCompact && (
                  <CardDescription className="text-sm leading-relaxed line-clamp-2 glass-text">
                    {thread.content}
                  </CardDescription>
                )}
              </div>
              <StatusBadge status={thread.status} aria-label={`Thread status: ${thread.status}`} />
            </div>
          </CardHeader>

          <CardContent className={cn(padding, "pt-0")}>
            {/* Metadata Row with Icons */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground glass-text">
            {/* AI Badge */}
            {thread.hasAIAnswer && (
              <>
                <AIBadge variant="compact" aria-label="This thread has an AI-generated answer" />
                <span className="text-muted-foreground opacity-50" aria-hidden="true">•</span>
              </>
            )}

            {/* Views */}
            <div className="flex items-center gap-1.5">
              <Eye className="size-4" aria-hidden="true" />
              <span>{thread.views} views</span>
            </div>

            <span className="text-muted-foreground opacity-50" aria-hidden="true">•</span>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              <time dateTime={thread.createdAt}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </time>
            </div>

            {/* Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <>
                <span className="text-muted-foreground opacity-50" aria-hidden="true">•</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="size-4" aria-hidden="true" />
                  {thread.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {thread.tags.length > 3 && (
                    <span className="text-muted-foreground" aria-label={`${thread.tags.length - 3} more tags`}>
                      +{thread.tags.length - 3}
                    </span>
                  )}
                </div>
              </>
            )}
            </div>
          </CardContent>
        </article>
      </Card>
    </Link>
  );
}

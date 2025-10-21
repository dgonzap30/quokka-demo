"use client";

import Link from "next/link";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { StatusBadge } from "@/components/course/status-badge";
import { EndorsedBadge } from "@/components/course/endorsed-badge";
import { Eye, Calendar, Tag, ThumbsUp, Sparkles } from "lucide-react";
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
      href={`/courses/${thread.courseId}?thread=${thread.id}`}
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

                {/* AI Summary Section */}
                {!isCompact && thread.aiSummary && (
                  <div className="glass-panel p-3 rounded-lg mt-2" role="complementary" aria-label="AI-generated key takeaways">
                    <div className="flex items-start gap-2">
                      <Sparkles className="size-4 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground glass-text mb-1">
                          Key Takeaways
                        </p>
                        <div className="text-sm leading-relaxed whitespace-pre-line glass-text">
                          {thread.aiSummary.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isCompact && !thread.aiSummary && (
                  <CardDescription className="text-sm leading-relaxed line-clamp-2 glass-text">
                    {thread.content}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {thread.qualityStatus === 'endorsed' && <EndorsedBadge variant="compact" />}
                <StatusBadge status={thread.status} aria-label={`Thread status: ${thread.status}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent className={cn(padding, "pt-0")}>
            {/* Metadata Row with Icons */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground glass-text">
            {/* AI Badge */}
            {thread.hasAIAnswer && (
              <>
                <AIBadge variant="compact" aria-label="Quokka answered this" />
                <span className="text-muted-foreground opacity-50" aria-hidden="true">•</span>
              </>
            )}

            {/* Upvotes */}
            {thread.upvotes && thread.upvotes.length > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="size-4" aria-hidden="true" />
                  <span>{thread.upvotes.length} {thread.upvotes.length === 1 ? 'upvote' : 'upvotes'}</span>
                </div>
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

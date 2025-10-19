"use client";

import { useState, type FormEvent } from "react";
import { useThread, useCurrentUser, useCreatePost, useEndorseAIAnswer } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { AIAnswerCard } from "@/components/course/ai-answer-card";
import { StatusBadge } from "@/components/course/status-badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThreadDetailPanelProps {
  /**
   * Thread ID to display
   */
  threadId: string | null;

  /**
   * Optional close handler (for mobile)
   */
  onClose?: () => void;

  /**
   * Rendering context for accessibility
   * - "modal": Rendered in modal dialog (mobile)
   * - "inline": Rendered inline in page layout (desktop)
   * @default "modal"
   */
  context?: "modal" | "inline";

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ThreadDetailPanel - Inline thread detail view (repurposed from thread detail page)
 *
 * Features:
 * - Displays thread question, AI answer, and replies inline
 * - Reply form with optimistic updates
 * - Endorsement functionality
 * - Sticky header with thread title
 * - Close button (mobile only)
 * - Loading and error states
 * - Glass panel styling (QDS compliant)
 *
 * Changes from original `/threads/[threadId]/page.tsx`:
 * - Removed NavHeader dependency
 * - Added close button for mobile
 * - Compact breadcrumb
 * - Optimistic UI updates
 *
 * @example
 * ```tsx
 * <ThreadDetailPanel
 *   threadId={selectedThreadId}
 *   onClose={() => setSelectedThreadId(null)}
 * />
 * ```
 */
export function ThreadDetailPanel({
  threadId,
  onClose,
  context = "modal",
  className,
}: ThreadDetailPanelProps) {
  const { data: user } = useCurrentUser();
  const { data: threadData, isLoading: threadLoading } = useThread(threadId || "");
  const createPostMutation = useCreatePost();
  const endorseAIAnswerMutation = useEndorseAIAnswer();

  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEndorsingLocally, setIsEndorsingLocally] = useState(false);

  // Empty state (no thread selected) - handled by parent now
  if (!threadId) {
    return null;
  }

  // Loading state
  if (threadLoading) {
    return (
      <div className={cn("space-y-8 p-4 md:p-6 lg:p-8", className)}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full bg-glass-medium rounded-lg" />
          <Skeleton className="h-6 w-3/4 bg-glass-medium rounded-lg" />
          <Skeleton className="h-32 w-full bg-glass-medium rounded-xl" />
        </div>
        <Skeleton className="h-64 bg-glass-medium rounded-xl" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 bg-glass-medium rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state (thread not found)
  if (!threadData) {
    return (
      <div className={cn("flex items-center justify-center h-full p-8", className)}>
        <div className="text-center max-w-md">
          <div className="text-6xl opacity-50 mb-6" aria-hidden="true">🔍</div>
          <h3 className="heading-3 glass-text mb-3">Thread not found</h3>
          <p className="text-base text-muted-foreground glass-text leading-relaxed mb-6">
            The thread you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          {onClose && (
            <Button variant="glass-primary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { thread, posts, aiAnswer } = threadData;

  // Handle reply submission
  const handleSubmitReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await createPostMutation.mutateAsync({
        input: {
          threadId: thread.id,
          content: replyContent,
        },
        authorId: user.id,
      });
      setReplyContent("");
      setFormError(null);
    } catch (error) {
      console.error("Failed to create post:", error);
      setFormError("Failed to post reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI answer endorsement
  const handleEndorseAIAnswer = async () => {
    if (!user || !aiAnswer || isEndorsingLocally) return;

    setIsEndorsingLocally(true); // Prevent duplicate clicks immediately
    try {
      await endorseAIAnswerMutation.mutateAsync({
        aiAnswerId: aiAnswer.id,
        userId: user.id,
        isInstructor: user.role === "instructor",
      });
    } catch (error) {
      console.error("Failed to endorse AI answer:", error);
    } finally {
      setIsEndorsingLocally(false);
    }
  };

  return (
    <div
      className={cn("space-y-8 p-4 md:p-6 lg:p-8 max-w-full", className)}
      role={context === "inline" ? "region" : undefined}
      aria-label={context === "inline" ? "Thread detail" : undefined}
    >
      {/* Back Button */}
      {onClose && (
        <div className="flex items-center gap-4">
          <Button
            variant="glass"
            size="sm"
            onClick={onClose}
            className="gap-2"
            aria-label="Back to thread list"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Threads</span>
          </Button>
        </div>
      )}

      {/* Thread Question */}
      <Card variant="glass-strong">
        <CardHeader className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <h1 className="text-xl md:text-2xl font-bold leading-snug glass-text">
                {thread.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-subtle glass-text">
                <span>{thread.views} views</span>
                <span aria-hidden="true">•</span>
                <time dateTime={thread.createdAt}>
                  {new Date(thread.createdAt).toLocaleDateString()}
                </time>
              </div>
            </div>
            <StatusBadge status={thread.status} />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0">
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words mb-6">
            {thread.content}
          </p>
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {thread.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Answer Section */}
      {aiAnswer && (
        <section className="space-y-4">
          <h2 className="heading-4 glass-text">Quokka&apos;s Answer</h2>
          <AIAnswerCard
            answer={aiAnswer}
            currentUserEndorsed={aiAnswer.endorsedBy.includes(user?.id || "")}
            currentUserRole={user?.role}
            onEndorse={handleEndorseAIAnswer}
            isEndorsing={endorseAIAnswerMutation.isPending || isEndorsingLocally}
            variant="hero"
          />
        </section>
      )}

      {/* Replies Section */}
      <section className="space-y-6">
        <h2 className="heading-4 glass-text">
          {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
        </h2>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} variant={post.endorsed ? "glass-liquid" : "glass-hover"}>
                <CardHeader className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 avatar-placeholder">
                      <span className="text-sm font-semibold">
                        {post.authorId.slice(-2).toUpperCase()}
                      </span>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base">
                          User {post.authorId.slice(-4)}
                        </span>
                        {post.endorsed && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            ✓ Endorsed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-subtle glass-text">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-5xl opacity-50" aria-hidden="true">💬</div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No replies yet</h3>
                <p className="text-sm text-muted-foreground glass-text">
                  Be the first to contribute to this discussion!
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Reply Form */}
      <Card variant="glass-strong">
        <CardHeader className="p-6">
          <CardTitle className="heading-5 glass-text">Post a Reply</CardTitle>
          <CardDescription className="text-base glass-text">
            Share your thoughts or answer this question
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reply-content" className="text-sm font-medium">
                Your reply
                <span className="text-danger ml-1">*</span>
              </label>
              <Textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={6}
                className="min-h-[150px] text-base"
                required
                aria-required="true"
                aria-invalid={!!formError}
              />
              {formError && (
                <p className="text-sm text-danger" role="alert">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-glass">
              <Button
                type="submit"
                variant="glass-primary"
                size="lg"
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

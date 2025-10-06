"use client";

import { use, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useThread, useCurrentUser, useCreatePost } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { GraduationCap, MessageSquare } from "lucide-react";

export default function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: threadData, isLoading: threadLoading } = useThread(threadId);
  const createPostMutation = useCreatePost();

  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  const handleSubmitReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createPostMutation.mutateAsync({
        input: {
          threadId,
          content: replyContent,
        },
        authorId: user.id,
      });
      setReplyContent("");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || threadLoading) {
    return (
      <div className="min-h-screen p-8 md:p-12">
        <div className="container-narrow space-y-12">
          <Skeleton className="h-6 w-32 bg-glass-medium rounded-lg" />
          <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
          <Skeleton className="h-64 bg-glass-medium rounded-xl" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-glass-medium rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card variant="glass" className="p-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="text-6xl opacity-50" aria-hidden="true">🔍</div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Thread Not Found</h3>
              <p className="text-muted-foreground glass-text leading-relaxed">
                The discussion thread you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="glass-primary" size="lg">
                Back to Courses
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { thread, posts } = threadData;

  const getStatusClass = (status: typeof thread.status) => {
    const variants = {
      open: "status-open",
      answered: "status-answered",
      resolved: "status-resolved",
    };
    return variants[status] || variants.open;
  };

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-narrow space-y-12">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Course", href: `/courses/${thread.courseId}`, icon: <GraduationCap className="h-3 w-3" /> },
            { label: thread.title.substring(0, 30) + (thread.title.length > 30 ? "..." : ""), icon: <MessageSquare className="h-3 w-3" /> }
          ]}
        />

        {/* Thread Question */}
        <Card variant="glass-strong">
          <CardHeader className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <CardTitle className="heading-3 glass-text leading-snug">
                  {thread.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-subtle glass-text">
                  <span>{thread.views} views</span>
                  <span>•</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge className={getStatusClass(thread.status)}>
                {thread.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-base leading-relaxed whitespace-pre-wrap mb-6">
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

        {/* Replies */}
        <div className="space-y-6">
          <h2 className="heading-3 glass-text">
            {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
          </h2>
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} variant={post.endorsed ? "glass-liquid" : "glass-hover"}>
                  <CardHeader className="p-8">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-11 w-11 avatar-placeholder">
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
                  <CardContent className="p-8 pt-0">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-16 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-center">
                  <div className="text-6xl opacity-50" aria-hidden="true">💬</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No Replies Yet</h3>
                  <p className="text-muted-foreground glass-text leading-relaxed">
                    Be the first to contribute to this discussion!
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Reply Form */}
        <Card variant="glass-strong">
          <CardHeader className="p-8">
            <div className="space-y-2">
              <CardTitle className="heading-4 glass-text">Post a Reply</CardTitle>
              <CardDescription className="text-base glass-text">
                Share your thoughts or answer this question
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmitReply} className="space-y-6">
              <div className="space-y-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={8}
                  className="min-h-[200px] text-base"
                  required
                  aria-required="true"
                />
              </div>
              <div className="flex justify-end pt-6 border-t border-[var(--border-glass)]">
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
    </div>
  );
}

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
import type { Post } from "@/lib/models/types";

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
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-48 w-full" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Thread not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { thread, posts } = threadData;

  const getStatusBadge = (status: typeof thread.status) => {
    const variants = {
      open: "bg-warning/20 text-warning",
      answered: "bg-accent/20 text-accent",
      resolved: "bg-success/20 text-success",
    };
    return variants[status] || variants.open;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-accent">
            Courses
          </Link>
          <span>/</span>
          <Link href={`/courses/${thread.courseId}`} className="hover:text-accent">
            Course
          </Link>
          <span>/</span>
          <span>Thread</span>
        </div>

        {/* Thread Question */}
        <Card variant="glass-strong">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{thread.title}</CardTitle>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span>{thread.views} views</span>
                  <span>•</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge className={getStatusBadge(thread.status)}>
                {thread.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{thread.content}</p>
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replies */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} variant={post.endorsed ? "glass-liquid" : "glass"}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 bg-primary/20">
                      <span className="text-sm">U</span>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">User {post.authorId.slice(-4)}</span>
                        {post.endorsed && (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            ✓ Endorsed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        <Card variant="glass-strong">
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
            <CardDescription>Share your thoughts or answer this question</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={5}
                required
              />
              <Button
                type="submit"
                variant="glass-primary"
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

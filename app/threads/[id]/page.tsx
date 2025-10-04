"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useThread, useCreatePost, useCurrentUser, useResolveThread } from "@/lib/api/hooks";
import { NavHeader } from "@/components/nav-header";
import { AiAnswerCard } from "@/components/ai-answer-card";
import { PostItem } from "@/components/post-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Award, ChevronLeft } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { data: thread, isLoading } = useThread(threadId);
  const { data: currentUser } = useCurrentUser();
  const createPost = useCreatePost();
  const resolveThread = useResolveThread();

  const [replyContent, setReplyContent] = useState("");
  const [isAnswer, setIsAnswer] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim() || !currentUser) return;

    await createPost.mutateAsync({
      threadId,
      content: replyContent,
      authorId: currentUser.id,
      isAnswer,
    });

    setReplyContent("");
    setIsAnswer(false);
  };

  const handleResolve = async () => {
    await resolveThread.mutateAsync(threadId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-24 w-full mb-8" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          <p className="text-center text-muted-foreground">Thread not found</p>
        </main>
      </div>
    );
  }

  const canMarkAnswer = currentUser?.role === "instructor" || currentUser?.role === "ta";
  const canResolve = canMarkAnswer && thread.status === "answered";

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Threads</span>
        </Link>

        {/* Thread Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={thread.status === "open" ? "outline" : thread.status === "answered" ? "secondary" : "default"}>
              {thread.status}
            </Badge>
            {thread.endorsed && (
              <Badge variant="default" className="gap-1">
                <Award className="h-3 w-3" />
                Endorsed
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-4">{thread.title}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={thread.author.avatar} alt={thread.author.name} />
                <AvatarFallback>{thread.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{thread.author.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(thread.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{thread.content}</p>
          </div>
        </div>

        {/* AI Answer */}
        {thread.aiAnswer && (
          <div className="mb-6">
            <AiAnswerCard answer={thread.aiAnswer} />
          </div>
        )}

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Replies ({thread.posts.length})
          </h2>
          {thread.posts.length > 0 ? (
            <div className="space-y-4">
              {thread.posts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No replies yet. Be the first to respond!
            </p>
          )}
        </div>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {canMarkAnswer && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnswer}
                      onChange={(e) => setIsAnswer(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Mark as answer</span>
                  </label>
                )}
                {canResolve && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResolve}
                    disabled={resolveThread.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Thread
                  </Button>
                )}
              </div>
              <Button
                onClick={handleReply}
                disabled={!replyContent.trim() || createPost.isPending}
              >
                {createPost.isPending ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

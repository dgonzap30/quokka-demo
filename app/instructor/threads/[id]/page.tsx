"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useThread, useCreatePost, useCurrentUser, useUpdateThreadStatus } from "@/lib/api/hooks";
import { AuthGuard } from "@/lib/auth-guard";
import { NavHeader } from "@/components/nav-header";
import { AiAnswerCard } from "@/components/ai-answer-card";
import { PostItem } from "@/components/post-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import type { Thread } from "@/lib/models/types";
import { useUserCourses } from "@/lib/api/hooks";

function InstructorThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { data: thread, isLoading } = useThread(threadId);
  const { data: currentUser } = useCurrentUser();
  const { data: courses = [] } = useUserCourses(currentUser?.id || "");
  const createPost = useCreatePost();
  const updateStatus = useUpdateThreadStatus();

  const [replyContent, setReplyContent] = useState("");
  const [isAnswer, setIsAnswer] = useState(false);

  // Get course from thread's courseId
  const course = thread ? courses.find(c => c.id === thread.courseId) : null;

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

  const handleStatusChange = async (newStatus: Thread["status"]) => {
    await updateStatus.mutateAsync({ threadId, status: newStatus });
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

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/courses" className="hover:text-foreground transition-colors">
            Courses
          </Link>
          <ChevronRight className="h-4 w-4" />
          {course ? (
            <>
              <Link href={`/instructor/courses/${course.id}`} className="hover:text-foreground transition-colors">
                {course.code}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          ) : null}
          <span className="text-foreground font-medium truncate max-w-md">{thread.title}</span>
        </nav>

        {/* Back to Course Link */}
        <Link
          href={course ? `/instructor/courses/${course.id}` : "/courses"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to {course ? course.code : "Courses"}</span>
        </Link>

        {/* Thread Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Status Selector */}
            <Select value={thread.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="canonical">Canonical</SelectItem>
              </SelectContent>
            </Select>

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
                <p className="font-semibold">
                  {thread.isAnonymous ? "Anonymous" : thread.author.name}
                </p>
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
          <h2 className="text-xl font-semibold mb-4">Replies ({thread.posts.length})</h2>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnswer}
                  onChange={(e) => setIsAnswer(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Mark as answer</span>
              </label>
              <Button onClick={handleReply} disabled={!replyContent.trim() || createPost.isPending}>
                {createPost.isPending ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard requiredRole={["instructor", "ta"]}>
      <InstructorThreadDetailPage />
    </AuthGuard>
  );
}

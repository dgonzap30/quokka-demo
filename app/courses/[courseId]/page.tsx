"use client";

import { use, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCourse, useCourseThreads, useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FloatingQuokka } from "@/components/course/floating-quokka";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Thread } from "@/lib/models/types";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);
  const createThreadMutation = useCreateThread();

  // Ask Question form state
  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Ask Question form submission
  const handleAskQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user || !course) return;

    setIsSubmitting(true);
    try {
      const newThread = await createThreadMutation.mutateAsync({
        input: {
          courseId: course.id,
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        },
        authorId: user.id,
      });

      // Reset form and navigate to new thread
      setTitle("");
      setContent("");
      setTags("");
      setShowAskForm(false);
      router.push(`/threads/${newThread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  if (userLoading || courseLoading || threadsLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-12">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 bg-glass-medium rounded-lg" />
            <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
            <Skeleton className="h-8 w-full max-w-2xl bg-glass-medium rounded-lg" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-glass-medium rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card variant="glass" className="p-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="text-6xl opacity-50">🔍</div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Course Not Found</h3>
              <p className="text-muted-foreground leading-relaxed">
                The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
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

  const getStatusClass = (status: Thread["status"]) => {
    const variants = {
      open: "status-open",
      answered: "status-answered",
      resolved: "status-resolved",
    };
    return variants[status] || variants.open;
  };

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">
        {/* Breadcrumb & Header */}
        <div className="space-y-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/courses" className="hover:text-accent transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-foreground">{course.code}</span>
          </nav>

          {/* Course Hero */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="heading-2 glass-text">{course.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {course.description}
              </p>
              <div className="flex items-center gap-6 text-sm text-subtle">
                <span className="font-medium">{course.term}</span>
                <span>•</span>
                <span>{course.enrollmentCount} students enrolled</span>
              </div>
            </div>
            <Button
              variant="glass-primary"
              size="lg"
              onClick={() => setShowAskForm(!showAskForm)}
            >
              {showAskForm ? "Cancel" : "Ask Question"}
              {showAskForm ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Ask Question Form (Collapsible) */}
        {showAskForm && (
          <Card variant="glass-strong">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-xl glass-text">Ask a Question</CardTitle>
              <CardDescription className="text-base">
                Post your question to get help from classmates and instructors
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <form onSubmit={handleAskQuestion} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-semibold">
                    Question Title *
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How does binary search work?"
                    className="h-11 text-base"
                    required
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/200 characters
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-semibold">
                    Question Details *
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context."
                    rows={8}
                    className="min-h-[200px] text-base"
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-semibold">
                    Tags (optional)
                  </label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., algorithms, binary-search, homework"
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border-glass)]">
                  <Button
                    type="submit"
                    variant="glass-primary"
                    size="lg"
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                  >
                    {isSubmitting ? "Posting..." : "Post Question"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowAskForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Threads Section */}
        <div className="space-y-6">
          <h2 className="heading-3 glass-text">Discussion Threads</h2>

          {threads && threads.length > 0 ? (
            <div className="space-y-6">
              {threads.map((thread) => (
                <Link key={thread.id} href={`/threads/${thread.id}`}>
                  <Card variant="glass-hover">
                    <CardHeader className="p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <CardTitle className="text-xl md:text-2xl glass-text leading-snug">
                            {thread.title}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed line-clamp-2">
                            {thread.content}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusClass(thread.status)}>
                          {thread.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-subtle">
                        <span>{thread.views} views</span>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        {thread.tags && thread.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-2 flex-wrap">
                              {thread.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-16 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-center">
                  <div className="text-6xl opacity-50">💬</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No Threads Yet</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Be the first to start a discussion in this course!
                  </p>
                </div>
                <Link href={`/ask?courseId=${courseId}`}>
                  <Button variant="glass-primary" size="lg">
                    Ask First Question
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Floating Quokka AI Agent */}
        <FloatingQuokka
          courseId={course.id}
          courseName={course.name}
          courseCode={course.code}
        />
      </div>
    </div>
  );
}

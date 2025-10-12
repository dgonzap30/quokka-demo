"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser, useUserCourses, useCreateThread, useGenerateAIPreview } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIAnswerCard } from "@/components/course/ai-answer-card";

function AskQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId");

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses, isLoading: coursesLoading } = useUserCourses(user?.id);
  const createThreadMutation = useCreateThread();
  const previewMutation = useGenerateAIPreview();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Set preselected course when data loads
  useEffect(() => {
    if (preselectedCourseId && courses) {
      const courseExists = courses.find((c) => c.id === preselectedCourseId);
      if (courseExists) {
        setSelectedCourseId(preselectedCourseId);
      }
    }
  }, [preselectedCourseId, courses]);

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  const handlePreview = () => {
    if (!selectedCourseId || !title.trim() || !content.trim()) return;

    previewMutation.mutate(
      {
        threadId: "preview-temp",
        courseId: selectedCourseId,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      },
      {
        onSuccess: () => {
          setShowPreview(true);
        },
      }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !title.trim() || !content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const newThread = await createThreadMutation.mutateAsync({
        input: {
          courseId: selectedCourseId,
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        },
        authorId: user.id,
      });

      // Redirect to the new thread
      router.push(`/threads/${newThread.thread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
    }
  };

  if (userLoading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
          <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
          <p className="text-base text-foreground glass-text font-medium">
            Loading courses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-narrow space-y-12">
        {/* Hero Section */}
        <div className="py-8 md:py-12 space-y-6">
          <div className="space-y-4">
            <h1 className="heading-2 glass-text">Ask a Question</h1>
            <p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">
              Get help from your classmates and instructors. Provide detailed information to receive the best answers.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card variant="glass-strong">
          <CardHeader className="p-8 md:p-10">
            <div className="space-y-2">
              <CardTitle className="heading-3 glass-text">New Discussion Thread</CardTitle>
              <CardDescription className="text-base leading-relaxed glass-text">
                Provide a clear title and detailed description of your question
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10 pt-0">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Course Selection */}
              <div className="space-y-3">
                <label htmlFor="course" className="text-sm font-semibold">
                  Course *
                </label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId} required>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <label htmlFor="title" className="text-sm font-semibold">
                  Question Title *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How does binary search work?"
                  className="h-12 text-base"
                  required
                  aria-required="true"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground glass-text">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <label htmlFor="content" className="text-sm font-semibold">
                  Question Details *
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context that will help others understand and answer your question."
                  rows={12}
                  className="min-h-[300px] text-base"
                  required
                  aria-required="true"
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label htmlFor="tags" className="text-sm font-semibold">
                  Tags (optional)
                </label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., algorithms, binary-search, recursion"
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground glass-text">
                  Separate tags with commas
                </p>
              </div>

              {/* Preview Helper Text */}
              <div className="text-sm text-muted-foreground glass-text">
                💡 Preview Quokka&apos;s answer before posting your question
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[var(--border-glass)]">
                <Button
                  type="button"
                  variant="ai"
                  size="lg"
                  onClick={handlePreview}
                  disabled={
                    previewMutation.isPending ||
                    isSubmitting ||
                    !selectedCourseId ||
                    !title.trim() ||
                    !content.trim()
                  }
                >
                  {previewMutation.isPending ? "Generating Preview..." : "Ask Quokka"}
                </Button>
                <Button
                  type="submit"
                  variant="glass-primary"
                  size="lg"
                  disabled={isSubmitting || !selectedCourseId || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? "Posting..." : "Post Question"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.back()}
                  disabled={isSubmitting || previewMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading-3 glass-text">Quokka&apos;s Answer</DialogTitle>
              <DialogDescription className="text-base glass-text">
                Review Quokka&apos;s answer before posting your question. You can still edit your question or post it directly.
              </DialogDescription>
            </DialogHeader>

            {/* AI Answer Preview */}
            {previewMutation.data && (
              <div className="mt-6">
                <AIAnswerCard
                  answer={previewMutation.data}
                  variant="compact"
                  currentUserEndorsed={false}
                  onEndorse={undefined}
                  isEndorsing={false}
                />
              </div>
            )}

            {/* Loading State */}
            {previewMutation.isPending && (
              <div className="flex items-center justify-center py-12">
                <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
                  <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-base text-foreground glass-text font-medium">
                    Generating AI answer...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {previewMutation.isError && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                <p className="text-sm text-danger font-medium">
                  Failed to generate preview. Please try again.
                </p>
              </div>
            )}

            {/* Dialog Actions */}
            <DialogFooter className="gap-3 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowPreview(false)}
              >
                Edit Question
              </Button>
              <Button
                type="button"
                variant="glass-primary"
                size="lg"
                onClick={(e) => {
                  setShowPreview(false);
                  handleSubmit(e as unknown as FormEvent);
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tips */}
        <Card variant="glass">
          <CardHeader className="p-8">
            <CardTitle className="heading-4 glass-text">Tips for Asking Good Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-3 text-sm md:text-base text-muted-foreground glass-text leading-relaxed">
              <p>✓ Search existing threads first to avoid duplicates</p>
              <p>✓ Use a clear, specific title that summarizes your question</p>
              <p>✓ Provide enough context and details for others to understand</p>
              <p>✓ Include relevant code snippets or error messages</p>
              <p>✓ Use appropriate tags to help others find your question</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AskQuestionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
          <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
          <p className="text-base text-foreground glass-text font-medium">
            Loading...
          </p>
        </div>
      </div>
    }>
      <AskQuestionForm />
    </Suspense>
  );
}

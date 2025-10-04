"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser, useUserCourses, useCreateThread } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AskQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId");

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses, isLoading: coursesLoading } = useUserCourses(user?.id);
  const createThreadMutation = useCreateThread();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.push(`/threads/${newThread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
    }
  };

  if (userLoading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-primary glass-text">Ask a Question</h1>
          <p className="text-muted-foreground mt-2">
            Get help from your classmates and instructors
          </p>
        </div>

        {/* Form */}
        <Card variant="glass-strong">
          <CardHeader>
            <CardTitle>New Discussion Thread</CardTitle>
            <CardDescription>
              Provide a clear title and detailed description of your question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              <div className="space-y-2">
                <label htmlFor="course" className="text-sm font-medium">
                  Course *
                </label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId} required>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Question Title *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How does binary search work?"
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Question Details *
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context that will help others understand and answer your question."
                  rows={10}
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags (optional)
                </label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., algorithms, binary-search, recursion"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="glass-primary"
                  disabled={isSubmitting || !selectedCourseId || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? "Posting..." : "Post Question"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Asking Good Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Search existing threads first to avoid duplicates</p>
            <p>✓ Use a clear, specific title that summarizes your question</p>
            <p>✓ Provide enough context and details for others to understand</p>
            <p>✓ Include relevant code snippets or error messages</p>
            <p>✓ Use appropriate tags to help others find your question</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AskQuestionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AskQuestionForm />
    </Suspense>
  );
}

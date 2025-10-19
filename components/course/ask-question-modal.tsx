"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useCreateThread, useGenerateAIPreview, useCheckDuplicates } from "@/lib/api/hooks";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AIAnswerCard } from "./ai-answer-card";
import { DuplicateWarning } from "./duplicate-warning";
import type { SimilarThread } from "@/lib/models/types";

export interface AskQuestionModalProps {
  /** Course ID for the question */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Success handler - called after thread is created */
  onSuccess?: (threadId: string) => void;
}

export function AskQuestionModal({
  courseId,
  courseName,
  isOpen,
  onClose,
  onSuccess,
}: AskQuestionModalProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createThreadMutation = useCreateThread();
  const previewMutation = useGenerateAIPreview();
  const checkDuplicates = useCheckDuplicates();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [similarThreads, setSimilarThreads] = useState<SimilarThread[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Reset form when modal closes
  const handleClose = () => {
    if (!isSubmitting && !previewMutation.isPending && !checkDuplicates.isPending) {
      setTitle("");
      setContent("");
      setTags("");
      setShowPreview(false);
      setSimilarThreads([]);
      setShowDuplicateWarning(false);
      onClose();
    }
  };

  const handlePreview = () => {
    if (!title.trim() || !content.trim()) return;

    previewMutation.mutate(
      {
        threadId: "preview-temp",
        courseId,
        userId: user!.id,
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

  // Phase 3.2: Actually post the thread (after duplicate check or user proceeds anyway)
  const postThread = async () => {
    if (!title.trim() || !content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const newThread = await createThreadMutation.mutateAsync({
        input: {
          courseId,
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        },
        authorId: user.id,
      });

      // Reset form and close modal
      setTitle("");
      setContent("");
      setTags("");
      setShowPreview(false);
      setSimilarThreads([]);
      setShowDuplicateWarning(false);
      onClose();

      // Call success handler if provided
      if (onSuccess) {
        onSuccess(newThread.thread.id);
      } else {
        // Default: navigate to the new thread
        router.push(`/threads/${newThread.thread.id}`);
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
    }
  };

  // Phase 3.2: Check for duplicates before posting
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    // Check for duplicate threads
    checkDuplicates.mutate(
      {
        courseId,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      },
      {
        onSuccess: (duplicates) => {
          if (duplicates.length > 0) {
            // Found duplicates - show warning
            setSimilarThreads(duplicates);
            setShowDuplicateWarning(true);
          } else {
            // No duplicates - post directly
            postThread();
          }
        },
        onError: (error) => {
          console.error("Failed to check duplicates:", error);
          // On error, proceed with posting anyway
          postThread();
        },
      }
    );
  };

  const isFormValid = title.trim() && content.trim();

  return (
    <>
      {/* Main Ask Question Modal */}
      <Dialog open={isOpen && !showPreview} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong">
          <DialogHeader>
            <DialogTitle className="heading-3 glass-text">Ask a Question</DialogTitle>
            <DialogDescription className="text-base glass-text">
              Post your question in <span className="font-semibold">{courseName}</span> to get help from classmates and instructors
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Title */}
            <div className="space-y-3">
              <label htmlFor="modal-title" className="text-sm font-semibold">
                Question Title *
              </label>
              <Input
                id="modal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., How does binary search work?"
                className="h-12 text-base"
                required
                aria-required="true"
                maxLength={200}
                autoFocus
              />
              <p className="text-xs text-muted-foreground glass-text">
                {title.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <label htmlFor="modal-content" className="text-sm font-semibold">
                Question Details *
              </label>
              <Textarea
                id="modal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context that will help others understand and answer your question."
                rows={10}
                className="min-h-[240px] text-base"
                required
                aria-required="true"
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label htmlFor="modal-tags" className="text-sm font-semibold">
                Tags (optional)
              </label>
              <Input
                id="modal-tags"
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
            <DialogFooter className="gap-3 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={isSubmitting || previewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ai"
                size="lg"
                onClick={handlePreview}
                disabled={
                  previewMutation.isPending ||
                  isSubmitting ||
                  !isFormValid
                }
              >
                {previewMutation.isPending ? "Generating Preview..." : "Ask Quokka"}
              </Button>
              <Button
                type="submit"
                variant="glass-primary"
                size="lg"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Posting..." : "Post Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-panel-strong">
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

      {/* Phase 3.2: Duplicate Warning Dialog */}
      <DuplicateWarning
        isOpen={showDuplicateWarning}
        similarThreads={similarThreads}
        onClose={() => setShowDuplicateWarning(false)}
        onProceed={() => {
          setShowDuplicateWarning(false);
          postThread();
        }}
        courseId={courseId}
      />
    </>
  );
}

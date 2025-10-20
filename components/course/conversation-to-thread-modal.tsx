"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/models/types";
import { convertConversationToThread, isValidConversation } from "@/lib/utils/conversation-to-thread";
import { cn } from "@/lib/utils";

export interface ConversationToThreadModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Conversation messages to convert */
  messages: Message[];

  /** Course ID for the thread */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Course code for conversion context */
  courseCode: string;

  /** Success handler - called after thread is created */
  onSuccess?: (threadId: string) => void;
}

export function ConversationToThreadModal({
  isOpen,
  onClose,
  messages,
  courseId,
  courseName,
  courseCode,
  onSuccess,
}: ConversationToThreadModalProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createThreadMutation = useCreateThread();

  // Convert conversation to thread format
  const conversionResult = isValidConversation(messages)
    ? convertConversationToThread({ messages, courseId, courseCode })
    : null;

  // Form state (initialized from conversion)
  const [title, setTitle] = useState(conversionResult?.threadInput.title || "");
  const [content, setContent] = useState(conversionResult?.threadInput.content || "");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for focus management (WCAG 2.4.3 Level A)
  const titleInputRef = useRef<HTMLInputElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Capture trigger element when modal opens
  useEffect(() => {
    if (isOpen && !triggerElementRef.current) {
      triggerElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Return focus to trigger element when modal closes
  useEffect(() => {
    if (!isOpen && triggerElementRef.current) {
      setTimeout(() => {
        if (triggerElementRef.current) {
          triggerElementRef.current.focus();
          triggerElementRef.current = null;
        }
      }, 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  const handleClose = () => {
    if (!isSubmitting) {
      // Reset to original conversion values
      if (conversionResult) {
        setTitle(conversionResult.threadInput.title);
        setContent(conversionResult.threadInput.content);
      }
      setTags("");
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      if (conversionResult) {
        setTitle(conversionResult.threadInput.title);
        setContent(conversionResult.threadInput.content);
      }
      setTags("");
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

  const isFormValid = title.trim() && content.trim();

  // Don't render if conversation is invalid
  if (!conversionResult) {
    return null;
  }

  const { formattedMessages, metadata } = conversionResult;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong"
        onOpenAutoFocus={(e) => {
          // Focus title input on open
          e.preventDefault();
          setTimeout(() => {
            titleInputRef.current?.focus();
          }, 100);
        }}
      >
        <DialogHeader>
          <DialogTitle className="heading-3 glass-text">Post Conversation as Thread</DialogTitle>
          <DialogDescription className="text-base glass-text">
            Share your Quokka conversation with <span className="font-semibold">{courseName}</span> to get feedback and endorsements
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Conversation Preview */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">
              Conversation Preview ({metadata.messageCount} messages)
            </label>
            <div className="glass-panel p-6 rounded-2xl max-h-[300px] overflow-y-auto space-y-4">
              {formattedMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3",
                    msg.roleLabel === "You" ? "message-user" : "message-assistant"
                  )}
                >
                  <p className="text-sm font-semibold mb-1">{msg.roleLabel}</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <label htmlFor="thread-title" className="text-sm font-semibold">
              Thread Title *
            </label>
            <Input
              id="thread-title"
              ref={titleInputRef}
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
            <label htmlFor="thread-content" className="text-sm font-semibold">
              Thread Content *
            </label>
            <Textarea
              id="thread-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit the conversation or add additional context..."
              rows={10}
              className="min-h-[240px] text-base"
              required
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground glass-text">
              You can edit the formatted conversation before posting
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label htmlFor="thread-tags" className="text-sm font-semibold">
              Tags (optional)
            </label>
            <Input
              id="thread-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., algorithms, binary-search, recursion"
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground glass-text">
              Separate tags with commas
            </p>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="glass-primary"
              size="lg"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Posting..." : "Post to Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

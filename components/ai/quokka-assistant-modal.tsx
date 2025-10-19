"use client";

/**
 * QuokkaAssistantModal - Multi-course aware AI chat with LLM backend
 *
 * REFACTORED to use AI SDK Elements with QDS styling
 *
 * Features:
 * - Real LLM integration with course material context
 * - Persistent conversations across modal sessions
 * - Manual course selection (dashboard)
 * - Conversation → thread conversion
 * - Material citations in AI responses
 *
 * Line count: ~400 (down from ~850)
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Trash2, Share2, MoreVertical, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCurrentUser,
  useAIConversations,
  useCreateConversation,
  useDeleteConversation,
  useConvertConversationToThread,
} from "@/lib/api/hooks";
import { usePersistedChat } from "@/lib/llm/hooks/usePersistedChat";
import { QDSConversation, QDSPromptInput } from "@/components/ai/elements";
import type { CourseSummary } from "@/lib/models/types";

export interface QuokkaAssistantModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Page context determines AI behavior and available features */
  pageContext: "dashboard" | "course" | "instructor";

  /** Course ID if in single course context (course page) */
  currentCourseId?: string;

  /** Course name if in single course context */
  currentCourseName?: string;

  /** Course code if in single course context */
  currentCourseCode?: string;

  /** Available courses for dashboard context (enables course selector) */
  availableCourses?: CourseSummary[];
}

export function QuokkaAssistantModal({
  isOpen,
  onClose,
  pageContext,
  currentCourseId,
  currentCourseName,
  currentCourseCode,
  availableCourses,
}: QuokkaAssistantModalProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  // Local state
  const [input, setInput] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [postedThreadId, setPostedThreadId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Accessibility state
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Conversation hooks
  const { data: conversations } = useAIConversations(user?.id);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const convertToThread = useConvertConversationToThread();

  // Determine active course ID (priority: course page > manual selection > null)
  const activeCourseId = useMemo(() => {
    if (pageContext === "course" && currentCourseId) {
      return currentCourseId;
    }
    if (selectedCourseId) {
      return selectedCourseId;
    }
    return null;
  }, [pageContext, currentCourseId, selectedCourseId]);

  // Get active course details
  const activeCourse = useMemo(() => {
    if (pageContext === "course" && currentCourseId) {
      return { id: currentCourseId, code: currentCourseCode, name: currentCourseName };
    }
    if (activeCourseId && availableCourses) {
      return availableCourses.find((c) => c.id === activeCourseId);
    }
    return null;
  }, [pageContext, currentCourseId, currentCourseCode, currentCourseName, activeCourseId, availableCourses]);

  // Use persisted chat hook for streaming + localStorage sync
  const chat = usePersistedChat({
    conversationId: activeConversationId,
    courseId: activeCourseId,
    userId: user?.id || "",
  });

  // Extract messages from chat hook
  const messages = chat.messages;

  // Check if streaming is in progress
  const isStreaming = chat.status === "submitted" || chat.status === "streaming";

  // Auto-load or create conversation when modal opens
  useEffect(() => {
    if (!isOpen || !user || activeConversationId) return;

    // Try to find existing conversation for this context
    if (conversations && conversations.length > 0) {
      // Filter by courseId if in course context
      const contextConversations = activeCourseId
        ? conversations.filter((c) => c.courseId === activeCourseId)
        : conversations.filter((c) => c.courseId === null);

      if (contextConversations.length > 0) {
        // Load most recent matching conversation
        setActiveConversationId(contextConversations[0].id);
        return;
      }
    }

    // Create new conversation if none exists for this context
    createConversation.mutate(
      {
        userId: user.id,
        courseId: activeCourseId || null,
        title: `Quokka Chat - ${activeCourse?.code || "General"}`,
      },
      {
        onSuccess: (newConversation) => {
          setActiveConversationId(newConversation.id);
        },
      }
    );
  }, [isOpen, user, conversations, activeCourseId, activeConversationId, activeCourse, createConversation]);

  // Capture trigger element and handle focus return
  useEffect(() => {
    if (isOpen) {
      // Capture the currently focused element (the trigger)
      triggerElementRef.current = document.activeElement as HTMLElement;

      // Auto-focus input when modal opens
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } else {
      // Return focus to trigger element when modal closes
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
        triggerElementRef.current = null;
      }
    }
  }, [isOpen]);

  // Announce streaming status for screen readers
  useEffect(() => {
    if (isStreaming) {
      setStatusMessage("Quokka is typing...");
    } else if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setStatusMessage("Quokka finished responding. New message available.");
      // Clear status after announcement
      const timer = setTimeout(() => setStatusMessage(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, messages]);

  // Announce errors for screen readers
  useEffect(() => {
    if (chat.error) {
      // Safely extract error message
      const error = chat.error as unknown;
      const errorMsg = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : "An error occurred while communicating with Quokka.";
      setErrorMessage(`Error: ${errorMsg}`);
      // Clear error after announcement
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [chat.error]);

  // Handle message submission
  const handleSubmit = async () => {
    if (!input.trim() || !activeConversationId || !user || isStreaming) return;

    const messageContent = input.trim();
    setInput("");

    // Send message via AI SDK (includes streaming)
    await chat.sendMessage({
      text: messageContent,
    });
  };

  // Handle clear conversation
  const handleClearConversation = () => {
    if (!activeConversationId || !user) return;

    // Delete current conversation
    deleteConversation.mutate(
      {
        conversationId: activeConversationId,
        userId: user.id,
      },
      {
        onSuccess: () => {
          // Create new conversation for this context
          setActiveConversationId(null);
          setShowClearConfirm(false);

          createConversation.mutate({
            userId: user.id,
            courseId: activeCourseId || null,
            title: `Quokka Chat - ${activeCourse?.code || "General"}`,
          }, {
            onSuccess: (newConversation) => {
              setActiveConversationId(newConversation.id);
            },
          });
        },
      }
    );
  };

  // Handle close modal
  const handleClose = () => {
    if (!isStreaming) {
      onClose();
    }
  };

  // Handle stop generation
  const handleStop = () => {
    chat.stop();
  };

  // Get context-specific quick prompts
  const getQuickPrompts = (): string[] => {
    if (pageContext === "course") {
      if (currentCourseCode?.startsWith("CS")) {
        return [
          "What is binary search?",
          "Explain Big O notation",
        ];
      }
      if (currentCourseCode?.startsWith("MATH")) {
        return [
          "Integration techniques",
          "Derivative rules",
        ];
      }
      return [
        "Help with this week's material",
        "Study tips",
      ];
    }

    if (pageContext === "instructor") {
      return [
        "How to boost engagement?",
        "Assessment best practices",
      ];
    }

    return [
      "Study strategies",
      "Time management tips",
    ];
  };

  // Post conversation as thread using native conversion
  const handlePostAsThread = () => {
    const targetCourseId = activeCourseId || currentCourseId;
    if (!targetCourseId || !user || !activeConversationId || messages.length === 0) return;

    // Show confirmation if on dashboard
    if (pageContext === "dashboard" && !showPostConfirm) {
      setShowPostConfirm(true);
      return;
    }

    // Use native conversation-to-thread conversion
    convertToThread.mutate(
      {
        conversationId: activeConversationId,
        userId: user.id,
        courseId: targetCourseId,
      },
      {
        onSuccess: (result) => {
          setPostedThreadId(result.thread.id);
          setShowPostSuccess(true);
          setShowPostConfirm(false);
        },
        onError: (error) => {
          console.error("Failed to post thread:", error);
          alert("Failed to post conversation. Please try again.");
        },
      }
    );
  };

  // Handle viewing posted thread
  const handleViewPostedThread = () => {
    const targetCourseId = activeCourseId || currentCourseId;
    if (postedThreadId && targetCourseId) {
      setShowPostSuccess(false);
      onClose();
      router.push(`/courses/${targetCourseId}?thread=${postedThreadId}`);
    }
  };

  // Handle course selection change
  const handleCourseSelect = (courseId: string) => {
    // Convert "all" back to null for general context
    setSelectedCourseId(courseId === "all" ? null : courseId);
    // Clear current conversation when switching courses
    setActiveConversationId(null);
  };

  // Handle copy message content
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Optional: Show toast notification "Copied to clipboard"
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle retry (regenerate last AI response)
  const handleRetry = () => {
    if (!messages.length || !activeConversationId || !user || isStreaming) return;

    // Use AI SDK's regenerate function
    chat.regenerate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="p-4 border-b border-[var(--border-glass)] space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-base glass-text">Quokka AI Assistant</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground glass-text">
                    {pageContext === "course" && currentCourseCode
                      ? `${currentCourseCode}${currentCourseName ? ` - ${currentCourseName}` : ""}`
                      : pageContext === "instructor"
                        ? "Instructor Support"
                        : "Study Assistant"}
                  </DialogDescription>
                </div>
              </div>

              {/* Course Selector (Dashboard only) */}
              {pageContext === "dashboard" && availableCourses && availableCourses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="course-select" className="text-xs font-medium glass-text">
                    Select Course Context (Optional)
                  </label>
                  <Select value={selectedCourseId || "all"} onValueChange={handleCourseSelect}>
                    <SelectTrigger id="course-select" className="w-full">
                      <SelectValue placeholder="All courses (general assistant)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All courses</SelectItem>
                      {availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </DialogHeader>

            {/* Error Alert */}
            {chat.error && (
              <div className="px-4 pt-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span className="flex-1 pr-4">
                      {chat.error.message || 'Failed to send message. Please try again.'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => chat.clearError?.()}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          chat.clearError?.();
                          chat.regenerate();
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Messages - Using QDSConversation Component */}
            <div className="flex-1 overflow-hidden">
              <QDSConversation
                messages={messages}
                isStreaming={isStreaming}
                onCopy={handleCopy}
                onRetry={handleRetry}
                canRetry={messages.length > 0 && messages[messages.length - 1].role === "assistant"}
                pageContext={pageContext}
                courseCode={currentCourseCode}
              />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border-glass)] p-4">
              {/* Quick prompts (only show when no messages) */}
              {messages.length === 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {getQuickPrompts()
                      .slice(0, 2)
                      .map((prompt) => (
                        <Button
                          key={prompt}
                          variant="outline"
                          size="default"
                          onClick={() => setInput(prompt)}
                          className="text-xs min-h-[44px]"
                        >
                          {prompt}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Buttons - Clear & Post Thread */}
              {messages.length > 0 && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  {/* Post as Thread - show when course is active */}
                  {(activeCourseId || currentCourseId) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePostAsThread}
                      disabled={isStreaming || convertToThread.isPending}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Post to {activeCourse?.code || currentCourseCode || "Course"}
                    </Button>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Clear Conversation Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isStreaming}
                        className="gap-2"
                        aria-label="Conversation actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setShowClearConfirm(true)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Prompt Input - Using QDSPromptInput Component */}
              <QDSPromptInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                onStop={handleStop}
                isStreaming={isStreaming}
                disabled={!activeConversationId}
                placeholder="Ask me anything..."
                inputRef={messageInputRef}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Conversation Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="glass-panel-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="glass-text">Clear this conversation?</AlertDialogTitle>
            <AlertDialogDescription className="glass-text">
              This will delete all messages in your current conversation with Quokka. This action cannot be undone.
              {(activeCourseId || currentCourseId) && " Consider using \"Post as Thread\" if you want to save and share this conversation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConversation} className="bg-danger hover:bg-danger/90">
              Clear Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Confirmation Dialog (Dashboard only) */}
      <AlertDialog open={showPostConfirm} onOpenChange={setShowPostConfirm}>
        <AlertDialogContent className="glass-panel-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="glass-text">Post to {activeCourse?.code || "Course"}?</AlertDialogTitle>
            <AlertDialogDescription className="glass-text">
              This will post your conversation with Quokka as a new thread in{" "}
              <strong>{activeCourse?.code} - {activeCourse?.name}</strong>.
              {" "}Other students will be able to view and reply to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPostConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePostAsThread}
              disabled={convertToThread.isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              {convertToThread.isPending ? "Posting..." : "Post Thread"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Success Dialog */}
      <AlertDialog open={showPostSuccess} onOpenChange={setShowPostSuccess}>
        <AlertDialogContent className="glass-panel-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="glass-text flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-success" />
              </div>
              Conversation Posted Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="glass-text">
              Your conversation with Quokka has been posted as a thread. Other students can now view, discuss, and endorse it.
              Would you like to view the thread now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPostSuccess(false)}>
              Stay Here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleViewPostedThread}
              className="bg-primary hover:bg-primary-hover"
            >
              View Thread
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ARIA Live Region for Status Announcements (Screen Readers) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* ARIA Alert Region for Errors (Screen Readers) */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          {errorMessage}
        </div>
      )}
    </>
  );
}

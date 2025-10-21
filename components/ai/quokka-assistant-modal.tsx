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
import { Sparkles, Trash2, Share2, MoreVertical, Menu, PanelLeftOpen } from "lucide-react";
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
import { QDSConversation, QDSPromptInputEnhanced } from "@/components/ai/elements";
import { RateLimitIndicator } from "@/components/ai/rate-limit-indicator";
import { ConversationHistorySidebar } from "@/components/ai/conversation-history-sidebar";
import type { CourseSummary, User } from "@/lib/models/types";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

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

// Inner component that uses the hook - will remount when userId changes
function QuokkaAssistantModalContent({
  isOpen,
  onClose,
  pageContext,
  currentCourseId,
  currentCourseName,
  currentCourseCode,
  availableCourses,
  user,
}: QuokkaAssistantModalProps & { user: User }) {
  const router = useRouter();

  // Local state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [postedThreadId, setPostedThreadId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  // Sidebar state - default open on desktop (≥768px), closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktop);
    };

    // Set initial state
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Accessibility state
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Conversation hooks
  const { data: conversations } = useAIConversations(user.id); // user is guaranteed to exist
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

  // Filter out conversations that have been converted to threads
  const activeConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter((c) => !c.threadId);
  }, [conversations]);

  // Use persisted chat hook for streaming + localStorage sync
  // User is guaranteed to be loaded at this point (checked in outer component)
  const chat = usePersistedChat({
    conversationId: activeConversationId,
    courseId: activeCourseId,
    userId: user.id, // user is guaranteed to exist
  });

  // Extract messages from chat hook
  const messages = chat.messages;

  // Check if streaming is in progress
  const isStreaming = chat.status === "submitted" || chat.status === "streaming";

  // Check if chat is ready (has conversation ID and not currently creating)
  const isChatReady = !!activeConversationId && !createConversation.isPending;

  // Load most recent conversation when modal opens, or create if none exist
  useEffect(() => {
    if (!isOpen || !user) return;

    // If we already have an active conversation, don't change it
    if (activeConversationId) return;

    // If conversations loaded and available, resume most recent
    if (activeConversations && activeConversations.length > 0) {
      // Conversations are already sorted by most recent first
      setActiveConversationId(activeConversations[0].id);
      return;
    }

    // Only create new conversation if:
    // 1. No active conversation
    // 2. Conversations have loaded (not undefined)
    // 3. No conversations exist
    // 4. Not already creating
    if (conversations !== undefined && activeConversations.length === 0 && !createConversation.isPending) {
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
    }
  }, [isOpen, user, conversations, activeConversations, activeConversationId, activeCourseId, activeCourse, createConversation]);

  // Handler for creating new conversation from sidebar
  const handleNewConversation = () => {
    createConversation.mutate(
      {
        userId: user.id,
        courseId: activeCourseId || null,
        title: `Quokka Chat - ${activeCourse?.code || "General"}`,
      },
      {
        onSuccess: (newConversation) => {
          setActiveConversationId(newConversation.id);
          // Close sidebar on mobile after creation
          setIsSidebarOpen(false);
        },
      }
    );
  };

  // Let Radix handle focus management automatically

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
  const handleSubmit = async (message: PromptInputMessage) => {
    if (!activeConversationId || !user || isStreaming) return;
    if (!message.text?.trim() && (!message.files || message.files.length === 0)) return;

    // Send message via AI SDK (includes streaming and file attachments)
    await chat.sendMessage({
      text: message.text || "",
      files: message.files,
    });
  };

  // Handle delete conversation from sidebar
  const handleDeleteConversation = (conversationId: string) => {
    setConversationToDelete(conversationId);
  };

  // Confirm delete conversation
  const confirmDeleteConversation = () => {
    if (!conversationToDelete || !user) return;

    const isActive = conversationToDelete === activeConversationId;

    deleteConversation.mutate(
      {
        conversationId: conversationToDelete,
        userId: user.id,
      },
      {
        onSuccess: () => {
          setConversationToDelete(null);

          // If deleted conversation was active, create a new one
          if (isActive) {
            setActiveConversationId(null);
            createConversation.mutate({
              userId: user.id,
              courseId: activeCourseId || null,
              title: `Quokka Chat - ${activeCourse?.code || "General"}`,
            }, {
              onSuccess: (newConversation) => {
                setActiveConversationId(newConversation.id);
              },
            });
          }
        },
      }
    );
  };

  // Handle clear conversation (legacy - now same as delete)
  const handleClearConversation = () => {
    if (!activeConversationId) return;
    handleDeleteConversation(activeConversationId);
    setShowClearConfirm(false);
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
        <DialogContent
          className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] glass-panel-strong p-0"
          onOpenAutoFocus={(e) => {
            // Prevent default focus behavior
            e.preventDefault();
            // Focus the input after a brief delay to ensure DOM is ready
            setTimeout(() => {
              messageInputRef.current?.focus();
            }, 0);
          }}
        >
          {/* Flex Layout with Sidebar */}
          <div className="flex h-full overflow-hidden relative">
            {/* Sidebar Backdrop (Mobile Only) */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Conversation Sidebar */}
            <ConversationHistorySidebar
              conversations={activeConversations}
              activeConversationId={activeConversationId}
              onConversationSelect={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              isLoading={!conversations}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              availableCourses={availableCourses}
            />

            {/* Main Content Area */}
            <div className="flex flex-col h-full flex-1 min-w-0 overflow-hidden">
              {/* Header with Hamburger Button */}
              <DialogHeader className="flex-shrink-0 p-4 border-b border-glass space-y-3">
              <div className="flex items-center gap-3">
                {/* Hamburger Toggle - Mobile Only */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="h-9 w-9 p-0 shrink-0 md:hidden"
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  aria-expanded={isSidebarOpen}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                {/* Expand Sidebar Button - Desktop Only, shown when sidebar is closed */}
                {!isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="hidden md:flex h-9 w-9 p-0 shrink-0"
                    aria-label="Open sidebar"
                    aria-expanded={false}
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                )}

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

                {/* Conversation Actions Dropdown - Positioned in header */}
                {messages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isStreaming}
                        className="h-9 w-9 p-0 mr-8"
                        aria-label="Conversation actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Post as Thread - show when course is active */}
                      {(activeCourseId || currentCourseId) && (
                        <DropdownMenuItem
                          onClick={handlePostAsThread}
                          disabled={convertToThread.isPending}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Post to {activeCourse?.code || currentCourseCode || "Course"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setShowClearConfirm(true)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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

            {/* Messages Container - Constrain height to ensure input is visible */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Messages - Using QDSConversation Component */}
              {!conversations ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-pulse text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Loading conversations...</p>
                    </div>
                  </div>
                </div>
              ) : !isChatReady ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-pulse text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Initializing conversation...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <QDSConversation
                  key={activeConversationId || 'no-conversation'}
                  className="h-full"
                  messages={messages}
                  isStreaming={isStreaming}
                  onCopy={handleCopy}
                  onRetry={handleRetry}
                  canRetry={messages.length > 0 && messages[messages.length - 1].role === "assistant"}
                  pageContext={pageContext}
                  courseCode={currentCourseCode}
                  error={chat.error ? {
                    message: chat.error.message || 'Failed to send message. Please try again.',
                    onDismiss: () => chat.clearError?.(),
                    onRetry: () => {
                      chat.clearError?.();
                      chat.regenerate();
                    }
                  } : undefined}
                />
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-glass p-4">
              {/* Prompt Input - Using Enhanced QDSPromptInput with File Attachments */}
              <QDSPromptInputEnhanced
                status={chat.status}
                onSubmit={handleSubmit}
                onStop={handleStop}
                disabled={!activeConversationId}
                placeholder="Ask me anything..."
                inputRef={messageInputRef}
                model={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
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

      {/* Delete Conversation Confirmation Dialog */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent className="glass-panel-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="glass-text">Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription className="glass-text">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConversation}
              className="bg-danger hover:bg-danger/90"
              disabled={deleteConversation.isPending}
            >
              {deleteConversation.isPending ? "Deleting..." : "Delete Conversation"}
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

// Outer wrapper component that handles user loading
export function QuokkaAssistantModal(props: QuokkaAssistantModalProps) {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Don't render until user is loaded
  if (isUserLoading || !user) {
    return null;
  }

  // Render inner component with key to force remount when user changes
  return (
    <QuokkaAssistantModalContent
      key={user.id}
      {...props}
      user={user}
    />
  );
}

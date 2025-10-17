"use client";

import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, Trash2, Share2, MoreVertical } from "lucide-react";
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
  useConversationMessages,
  useCreateConversation,
  useSendMessage,
  useDeleteConversation,
  useConvertConversationToThread,
} from "@/lib/api/hooks";
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

/**
 * Quokka Assistant Modal - Multi-course aware AI chat with LLM backend
 *
 * Features:
 * - Real LLM integration with course material context
 * - Persistent conversations across modal sessions
 * - Manual course selection (dashboard)
 * - Conversation → thread conversion
 * - Material citations in AI responses
 */
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Conversation hooks
  const { data: conversations } = useAIConversations(user?.id);
  const { data: messages = [] } = useConversationMessages(activeConversationId || undefined);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle message submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversationId || !user || sendMessage.isPending) return;

    const messageContent = input.trim();
    setInput("");

    // Send message via mutation (includes optimistic update)
    sendMessage.mutate({
      conversationId: activeConversationId,
      content: messageContent,
      userId: user.id,
      role: "user",
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
    if (!sendMessage.isPending) {
      onClose();
    }
  };

  // Get context-specific quick prompts
  const getQuickPrompts = (): string[] => {
    if (pageContext === "course") {
      if (currentCourseCode?.startsWith("CS")) {
        return [
          "What is binary search?",
          "Explain Big O notation",
          "Arrays vs Linked Lists",
          "How does recursion work?",
        ];
      }
      if (currentCourseCode?.startsWith("MATH")) {
        return [
          "Integration techniques",
          "Derivative rules",
          "Chain rule examples",
          "U-substitution help",
        ];
      }
      return [
        "Help with this week's material",
        "Study tips",
        "Common mistakes to avoid",
        "Practice problem ideas",
      ];
    }

    if (pageContext === "instructor") {
      return [
        "How to boost engagement?",
        "Assessment best practices",
        "Handling difficult questions",
        "Time management tips",
      ];
    }

    return [
      "Study strategies",
      "Time management tips",
      "Note-taking techniques",
      "Exam preparation",
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
    setSelectedCourseId(courseId);
    // Clear current conversation when switching courses
    setActiveConversationId(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="p-4 border-b border-[var(--border-glass)] space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-base glass-text">Quokka AI Assistant</DialogTitle>
                  <p className="text-xs text-muted-foreground glass-text">
                    {pageContext === "course" && currentCourseCode
                      ? `${currentCourseCode}${currentCourseName ? ` - ${currentCourseName}` : ""}`
                      : pageContext === "instructor"
                        ? "Instructor Support"
                        : "Study Assistant"}
                  </p>
                </div>
              </div>

              {/* Course Selector (Dashboard only) */}
              {pageContext === "dashboard" && availableCourses && availableCourses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="course-select" className="text-xs font-medium glass-text">
                    Select Course Context (Optional)
                  </label>
                  <Select value={selectedCourseId || ""} onValueChange={handleCourseSelect}>
                    <SelectTrigger id="course-select" className="w-full">
                      <SelectValue placeholder="All courses (general assistant)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All courses</SelectItem>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div
                role="log"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="additions"
                aria-label="Chat message history"
              >
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="message-assistant p-3">
                      <p className="text-sm leading-relaxed">
                        Hi! I&apos;m Quokka, your AI study assistant. How can I help you today? 🎓
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 ${
                        message.role === "user" ? "message-user" : "message-assistant"
                      }`}
                      aria-label={message.role === "user" ? "You said" : "Quokka said"}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-subtle mt-2">
                        <span className="sr-only">{message.role === "user" ? "Sent" : "Received"} at </span>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {sendMessage.isPending && (
                  <div className="flex justify-start" role="status" aria-live="polite">
                    <div className="message-assistant p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse" aria-hidden="true">
                          💭
                        </div>
                        <p className="text-sm">Quokka is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={messagesEndRef} />
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
                      disabled={sendMessage.isPending || convertToThread.isPending}
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
                        disabled={sendMessage.isPending}
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

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={messageInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={sendMessage.isPending || !activeConversationId}
                  className="flex-1 text-sm"
                  aria-label="Message input"
                />
                <Button
                  type="submit"
                  variant="glass-primary"
                  size="sm"
                  disabled={sendMessage.isPending || !input.trim() || !activeConversationId}
                  className="shrink-0 min-h-[44px] min-w-[44px]"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
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
    </>
  );
}

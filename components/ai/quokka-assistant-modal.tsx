"use client";

import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UIMessage } from "@ai-sdk/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, Trash2, Share2, MoreVertical, Copy, RefreshCcw, ArrowDown, StopCircle } from "lucide-react";
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
import { parseCitations } from "@/lib/llm/utils/citations";
import { SourcesPanel } from "@/components/ai/sources-panel";
import type { CourseSummary } from "@/lib/models/types";

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("\n");
}

/**
 * Render message text with highlighted citation markers
 *
 * Converts inline [1] markers into styled, clickable spans that scroll to sources
 */
function renderTextWithCitations(
  text: string,
  citations: Array<{ id: number; title: string }>
): React.ReactNode {
  // No citations - return plain text
  if (citations.length === 0) {
    return text;
  }

  const citationIds = new Set(citations.map((c) => c.id));
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Find all [N] patterns and replace with styled spans
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const citationNum = parseInt(match[1], 10);

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add citation marker (only if it's a valid citation)
    if (citationIds.has(citationNum)) {
      const citation = citations.find((c) => c.id === citationNum);
      parts.push(
        <span
          key={`citation-${match.index}-${citationNum}`}
          className="citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold bg-accent/20 text-accent-foreground hover:bg-accent/30 cursor-pointer transition-colors"
          onClick={() => {
            // Scroll to the sources panel
            const sourcesElement = document.querySelector(`[data-citation-id="${citationNum}"]`);
            sourcesElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }}
          title={citation?.title || `Citation ${citationNum}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const sourcesElement = document.querySelector(`[data-citation-id="${citationNum}"]`);
              sourcesElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }}
          aria-label={`Citation ${citationNum}: ${citation?.title || "View source"}`}
        >
          [{citationNum}]
        </span>
      );
    } else {
      // Invalid citation - keep as plain text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const element = messagesEndRef.current;
    if (!element || !scrollContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide button when bottom is visible
        setShowScrollButton(!entry.isIntersecting);
      },
      {
        root: scrollContainer,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    // Also check on scroll for better responsiveness
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

  // Handle scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
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

                {messages.map((message, index) => {
                  // Parse citations for assistant messages
                  const messageText = getMessageText(message);
                  const parsed = message.role === "assistant"
                    ? parseCitations(messageText)
                    : null;

                  // Determine text to display (strip Sources section for assistant messages)
                  const displayText = message.role === "assistant" && parsed
                    ? parsed.contentWithoutSources
                    : messageText;

                  // Check if message has citations for visual indicator
                  const hasCitations = parsed && parsed.citations.length > 0;

                  return (
                    <div key={message.id} className="mb-4">
                      <div
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 ${
                            message.role === "user" ? "message-user" : "message-assistant"
                          } ${
                            hasCitations ? "border-l-2 border-accent" : ""
                          }`}
                          aria-label={message.role === "user" ? "You said" : "Quokka said"}
                        >
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.role === "assistant" && parsed && parsed.citations.length > 0
                              ? renderTextWithCitations(displayText, parsed.citations)
                              : displayText}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Assistant Messages */}
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1 mt-1 ml-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(messageText)}
                            className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
                            aria-label="Copy message"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>

                          {/* Only show Retry on the last assistant message */}
                          {index === messages.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRetry}
                              disabled={isStreaming}
                              className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
                              aria-label="Retry generation"
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Sources Panel for Assistant Messages with Citations */}
                      {parsed && parsed.citations.length > 0 && (
                        <div className="mt-3 ml-1 max-w-[85%]">
                          <SourcesPanel
                            citations={parsed.citations}
                            defaultExpanded={true}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isStreaming && (
                  <div className="flex justify-start" role="status" aria-live="polite">
                    <div className="message-assistant p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1" aria-hidden="true">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-sm glass-text">Quokka is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll marker - must be inside messages container for IntersectionObserver */}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <Button
                  variant="glass-primary"
                  size="sm"
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 rounded-full w-10 h-10 p-0 shadow-e2 z-10"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
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

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={messageInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isStreaming || !activeConversationId}
                  className="flex-1 text-sm"
                  aria-label="Message input"
                />
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                    className="shrink-0 min-h-[44px] min-w-[44px]"
                    aria-label="Stop generation"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span className="sr-only">Stop generation</span>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="glass-primary"
                    size="sm"
                    disabled={!input.trim() || !activeConversationId}
                    className="shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                )}
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

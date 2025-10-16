"use client";

import { useState, useEffect, useRef, useMemo, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, Trash2, Share2, MoreVertical, GraduationCap } from "lucide-react";
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
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import type { Message, Citation, CourseSummary } from "@/lib/models/types";

// Enhanced message type with citations
interface EnhancedMessage extends Message {
  citations?: Citation[];
  courseId?: string;
  courseCode?: string;
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
 * Detects relevant course from user query based on keyword matching
 */
function detectCourseFromQuery(
  query: string,
  availableCourses: CourseSummary[]
): CourseSummary | null {
  if (!query || query.trim().length < 3) return null;

  const queryLower = query.toLowerCase();
  let bestMatch: CourseSummary | null = null;
  let bestScore = 0;

  availableCourses.forEach((course) => {
    let score = 0;

    // RULE 1: Exact course code mention (e.g., "CS101", "MATH 221")
    const codeVariants = [
      course.code.toLowerCase(),
      course.code.replace(/(\d+)/, ' $1').toLowerCase(), // "CS 101"
    ];

    if (codeVariants.some((variant) => queryLower.includes(variant))) {
      score += 10;
    }

    // RULE 2: Course name keywords
    const nameKeywords = course.name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    nameKeywords.forEach((keyword) => {
      if (queryLower.includes(keyword)) {
        score += 2;
      }
    });

    // RULE 3: Subject area keywords (CS, MATH, etc.)
    const subjectPrefix = course.code.replace(/\d+/g, '').toLowerCase();
    if (queryLower.includes(subjectPrefix)) {
      score += 3;
    }

    // Update best match if score is high enough
    if (score > bestScore && score >= 5) {
      bestScore = score;
      bestMatch = course;
    }
  });

  return bestMatch;
}

/**
 * Quokka Assistant Modal - Multi-course aware AI chat
 *
 * Enhanced with:
 * - Course detection from user queries
 * - Manual course selection (dashboard)
 * - Material citations in responses
 * - Context-aware posting
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
  const createThreadMutation = useCreateThread();

  // Existing state
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isPostingThread, setIsPostingThread] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [postedThreadId, setPostedThreadId] = useState<string | null>(null);

  // New state for multi-course awareness
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [detectedCourseId, setDetectedCourseId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [showPostConfirm, setShowPostConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Determine active course ID (priority: course page > manual > detected > null)
  const activeCourseId = useMemo(() => {
    if (pageContext === "course" && currentCourseId) {
      return currentCourseId;
    }
    if (selectedCourseId) {
      return selectedCourseId;
    }
    if (detectedCourseId) {
      return detectedCourseId;
    }
    return null;
  }, [pageContext, currentCourseId, selectedCourseId, detectedCourseId]);

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

  // Debounce user input for course detection
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input);
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);

  // Run course detection when debounced query changes
  useEffect(() => {
    if (
      pageContext === "dashboard" &&
      availableCourses &&
      availableCourses.length > 0 &&
      debouncedQuery.trim().length >= 3 &&
      !selectedCourseId // Don't override manual selection
    ) {
      const detected = detectCourseFromQuery(debouncedQuery, availableCourses);
      setDetectedCourseId(detected?.id || null);
    }
  }, [debouncedQuery, availableCourses, pageContext, selectedCourseId]);

  // Get context-aware welcome message
  const getWelcomeMessage = useCallback((): string => {
    switch (pageContext) {
      case "course":
        return `Hi! I'm Quokka, your AI study assistant for ${currentCourseCode || currentCourseName || "this course"}. Ask me anything about the course material! 🎓`;
      case "instructor":
        return `Hi! I'm Quokka for instructors. I can help with student questions, course management, and teaching strategies. How can I assist you today? 👨‍🏫`;
      case "dashboard":
      default:
        return `Hi! I'm Quokka, your AI study assistant. I can help you with course material, study strategies, and academic questions. What can I help you with today? 📚`;
    }
  }, [pageContext, currentCourseCode, currentCourseName]);

  // Initialize with welcome message when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: getWelcomeMessage(),
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // AI response logic (context-aware)
  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    const courseCode = activeCourse?.code || currentCourseCode;
    const courseName = activeCourse?.name || currentCourseName;
    const contextPrefix =
      pageContext === "course" && courseCode
        ? `[Course: ${courseCode}${courseName ? ` - ${courseName}` : ""}]\n\n`
        : "";

    // Course-specific responses
    if (pageContext === "course" && courseCode?.startsWith("CS")) {
      if (q.includes("binary search")) {
        return (
          contextPrefix +
          "Binary search is an efficient algorithm for finding an item in a sorted array. It works by repeatedly dividing the search interval in half:\n\n1. Compare the target value to the middle element\n2. If equal, return the position\n3. If target is less, search the left half\n4. If target is greater, search the right half\n\nTime complexity: O(log n)\n\n**Important:** The array must be sorted first!"
        );
      }
      if (q.includes("linked list") || q.includes("array")) {
        return (
          contextPrefix +
          "**Arrays vs Linked Lists:**\n\n**Arrays:**\n- Fixed size\n- O(1) random access\n- O(n) insertion/deletion\n- Contiguous memory\n\n**Linked Lists:**\n- Dynamic size\n- O(n) access by index\n- O(1) insertion/deletion at known position\n- Non-contiguous memory\n\nUse arrays when you need fast lookups, linked lists when you need frequent insertions/deletions."
        );
      }
    }

    if (pageContext === "course" && courseCode?.startsWith("MATH")) {
      if (q.includes("integration") || q.includes("integral")) {
        return (
          contextPrefix +
          "**Integration Techniques:**\n\n1. **Substitution** (u-substitution)\n2. **Integration by parts**: ∫u dv = uv - ∫v du\n3. **Partial fractions**\n4. **Trigonometric substitution**\n\n**LIATE rule** for choosing u:\nL - Logarithmic\nI - Inverse trig\nA - Algebraic\nT - Trigonometric\nE - Exponential\n\nWhat specific problem are you working on?"
        );
      }
    }

    // Instructor-specific responses
    if (pageContext === "instructor") {
      if (q.includes("engagement") || q.includes("participation")) {
        return "**Boosting Student Engagement:**\n\n1. **Active Learning**: Use think-pair-share, polling, and problem-solving activities\n2. **Real-World Examples**: Connect concepts to practical applications\n3. **Timely Feedback**: Respond to questions within 24 hours\n4. **Discussion Prompts**: Post thought-provoking questions weekly\n5. **Office Hours**: Offer flexible virtual office hours\n\nWould you like specific strategies for online vs in-person classes?";
      }
      if (q.includes("grade") || q.includes("assessment")) {
        return "**Assessment Best Practices:**\n\n1. **Varied Formats**: Mix quizzes, projects, and exams\n2. **Rubrics**: Provide clear grading criteria upfront\n3. **Formative Assessment**: Use low-stakes checks throughout\n4. **Timely Feedback**: Return grades within one week\n5. **Revision Opportunities**: Allow resubmissions for major assignments\n\nNeed help creating rubrics or designing assessments?";
      }
    }

    // General responses
    if (q.includes("hello") || q.includes("hi")) {
      return contextPrefix + `Hello! 👋 How can I help you today?`;
    }

    if (q.includes("help") || q.includes("what can you do")) {
      if (pageContext === "instructor") {
        return "I can help you with:\n\n- **Student Questions**: Analyze common questions and suggest FAQ topics\n- **Engagement**: Strategies to boost participation\n- **Assessment**: Create rubrics and design effective tests\n- **Course Management**: Organize materials and track progress\n\nWhat would you like assistance with?";
      } else if (pageContext === "course") {
        return contextPrefix + `I can help with:\n\n- Course concepts and explanations\n- Problem-solving strategies\n- Study tips and exam prep\n- Clarifying assignments\n\nWhat would you like to know?`;
      } else {
        return "I can help you with:\n\n- **Course Material**: Explanations of concepts across your courses\n- **Study Strategies**: Time management, note-taking, test prep\n- **Academic Questions**: General questions about topics you're learning\n\nWhat can I help you with today?";
      }
    }

    // Default response
    return (
      contextPrefix +
      `I'd be happy to help with "${question}"!\n\nCould you provide more details? For example:\n- What specific concept are you asking about?\n- Any problems you're working on?\n- What you've tried so far?\n\nThe more context you provide, the better I can assist you!`
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    const aiResponse: Message = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: getAIResponse(userMessage.content),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsThinking(false);
  };

  // Handle clear conversation
  const handleClearConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowClearConfirm(false);
  };

  // Handle close modal
  const handleClose = () => {
    if (!isThinking) {
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

  // Convert conversation to thread content
  const formatConversationAsThread = (): { title: string; content: string } => {
    // Get first user message as title (excluding welcome message)
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 200)
      : "AI Conversation - " + new Date().toLocaleDateString();

    // Format all messages as Q&A
    const content = messages
      .filter((m) => m.id !== "welcome") // Exclude welcome
      .map((m) =>
        m.role === "user"
          ? `**Q:** ${m.content}`
          : `**A (Quokka):** ${m.content}`
      )
      .join("\n\n---\n\n");

    return { title, content };
  };

  // Post conversation as thread
  const handlePostAsThread = async () => {
    const targetCourseId = activeCourseId || currentCourseId;
    if (!targetCourseId || !user || messages.length <= 1) return;

    // Show confirmation if on dashboard
    if (pageContext === "dashboard" && !showPostConfirm) {
      setShowPostConfirm(true);
      return;
    }

    setIsPostingThread(true);
    try {
      const { title, content } = formatConversationAsThread();
      const result = await createThreadMutation.mutateAsync({
        input: {
          courseId: targetCourseId,
          title,
          content,
          tags: ["ai-conversation", activeCourse?.code || currentCourseCode || ""].filter(Boolean),
        },
        authorId: user.id,
      });

      // Success: Show styled success dialog
      setPostedThreadId(result.thread.id);
      setShowPostSuccess(true);
      setShowPostConfirm(false);
    } catch (error) {
      console.error("Failed to post thread:", error);
      alert("Failed to post conversation. Please try again.");
    } finally {
      setIsPostingThread(false);
    }
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
    setDetectedCourseId(null); // Clear auto-detection when manually selecting
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

                  {/* Auto-detected course indicator */}
                  {detectedCourseId && !selectedCourseId && activeCourse && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>
                        Auto-detected: <strong>{activeCourse.code}</strong>
                      </span>
                    </div>
                  )}
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

                {isThinking && (
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
              {/* Quick prompts (only show for first message) */}
              {messages.length === 1 && (
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
              {messages.length > 1 && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  {/* Post as Thread - show when course is active */}
                  {(activeCourseId || currentCourseId) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePostAsThread}
                      disabled={isThinking || isPostingThread}
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
                        disabled={isThinking}
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
                  disabled={isThinking}
                  className="flex-1 text-sm"
                  aria-label="Message input"
                />
                <Button
                  type="submit"
                  variant="glass-primary"
                  size="sm"
                  disabled={isThinking || !input.trim()}
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
              disabled={isPostingThread}
              className="bg-primary hover:bg-primary-hover"
            >
              {isPostingThread ? "Posting..." : "Post Thread"}
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

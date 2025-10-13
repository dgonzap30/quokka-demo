"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import type { Message } from "@/lib/models/types";

export interface QuokkaAssistantModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Context type for contextual AI responses */
  contextType: "dashboard" | "course" | "instructor";

  /** Course ID if in course context */
  courseId?: string;

  /** Course name if in course context */
  courseName?: string;

  /** Course code if in course context */
  courseCode?: string;
}

/**
 * Quokka Assistant Modal - Context-aware AI chat accessible from navbar
 *
 * Opens as a Dialog modal (similar to AskQuestionModal pattern)
 * Context-aware based on current page (dashboard, course, instructor)
 * Consolidates all Quokka AI interactions to one accessible spot
 */
export function QuokkaAssistantModal({
  isOpen,
  onClose,
  contextType,
  courseId,
  courseName,
  courseCode,
}: QuokkaAssistantModalProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createThreadMutation = useCreateThread();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isPostingThread, setIsPostingThread] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [postedThreadId, setPostedThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Get context-aware welcome message
  const getWelcomeMessage = (): string => {
    switch (contextType) {
      case "course":
        return `Hi! I'm Quokka, your AI study assistant for ${courseCode || courseName || "this course"}. Ask me anything about the course material! 🎓`;
      case "instructor":
        return `Hi! I'm Quokka for instructors. I can help with student questions, course management, and teaching strategies. How can I assist you today? 👨‍🏫`;
      case "dashboard":
      default:
        return `Hi! I'm Quokka, your AI study assistant. I can help you with course material, study strategies, and academic questions. What can I help you with today? 📚`;
    }
  };

  // Initialize with welcome message when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: getWelcomeMessage(),
          timestamp: new Date(),
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
    const contextPrefix =
      contextType === "course" && courseCode
        ? `[Course: ${courseCode}${courseName ? ` - ${courseName}` : ""}]\n\n`
        : "";

    // Course-specific responses
    if (contextType === "course" && courseCode?.startsWith("CS")) {
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

    if (contextType === "course" && courseCode?.startsWith("MATH")) {
      if (q.includes("integration") || q.includes("integral")) {
        return (
          contextPrefix +
          "**Integration Techniques:**\n\n1. **Substitution** (u-substitution)\n2. **Integration by parts**: ∫u dv = uv - ∫v du\n3. **Partial fractions**\n4. **Trigonometric substitution**\n\n**LIATE rule** for choosing u:\nL - Logarithmic\nI - Inverse trig\nA - Algebraic\nT - Trigonometric\nE - Exponential\n\nWhat specific problem are you working on?"
        );
      }
    }

    // Instructor-specific responses
    if (contextType === "instructor") {
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
      if (contextType === "instructor") {
        return "I can help you with:\n\n- **Student Questions**: Analyze common questions and suggest FAQ topics\n- **Engagement**: Strategies to boost participation\n- **Assessment**: Create rubrics and design effective tests\n- **Course Management**: Organize materials and track progress\n\nWhat would you like assistance with?";
      } else if (contextType === "course") {
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
      timestamp: new Date(),
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
      timestamp: new Date(),
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
        timestamp: new Date(),
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
    if (contextType === "course") {
      if (courseCode?.startsWith("CS")) {
        return [
          "What is binary search?",
          "Explain Big O notation",
          "Arrays vs Linked Lists",
          "How does recursion work?",
        ];
      }
      if (courseCode?.startsWith("MATH")) {
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

    if (contextType === "instructor") {
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
    if (!courseId || !user || messages.length <= 1) return;

    setIsPostingThread(true);
    try {
      const { title, content } = formatConversationAsThread();
      const result = await createThreadMutation.mutateAsync({
        input: {
          courseId,
          title,
          content,
          tags: ["ai-conversation", courseCode || ""].filter(Boolean),
        },
        authorId: user.id,
      });

      // Success: Show styled success dialog
      setPostedThreadId(result.thread.id);
      setShowPostSuccess(true);
    } catch (error) {
      console.error("Failed to post thread:", error);
      alert("Failed to post conversation. Please try again.");
    } finally {
      setIsPostingThread(false);
    }
  };

  // Handle viewing posted thread
  const handleViewPostedThread = () => {
    if (postedThreadId && courseId) {
      setShowPostSuccess(false);
      onClose();
      router.push(`/courses/${courseId}?thread=${postedThreadId}`);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="p-4 border-b border-[var(--border-glass)] flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base glass-text">Quokka AI Assistant</DialogTitle>
                  <p className="text-xs text-muted-foreground glass-text">
                    {contextType === "course" && courseCode
                      ? `${courseCode}${courseName ? ` - ${courseName}` : ""}`
                      : contextType === "instructor"
                        ? "Instructor Support"
                        : "Study Assistant"}
                  </p>
                </div>
              </div>
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
                        {message.timestamp.toLocaleTimeString()}
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
                  {/* Post as Thread - only in course context */}
                  {courseId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePostAsThread}
                      disabled={isThinking || isPostingThread}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Post as Thread
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
              {courseId && " Consider using \"Post as Thread\" if you want to save and share this conversation."}
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

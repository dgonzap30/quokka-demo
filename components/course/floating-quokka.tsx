"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { X, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FloatingQuokkaProps {
  courseId: string;
  courseName: string;
  courseCode: string;
}

/**
 * Floating Quokka AI Agent
 *
 * Course-context-aware AI assistant that appears on course pages.
 * Three states: hidden (dismissed), minimized (default), expanded (active chat)
 * Persists state to localStorage, reuses AI logic from /quokka page
 */
export function FloatingQuokka({ courseId, courseName, courseCode }: FloatingQuokkaProps) {
  const [state, setState] = useState<"hidden" | "minimized" | "expanded">("minimized");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fabButtonRef = useRef<HTMLButtonElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`quokka-state-${courseId}`);
    const dismissed = localStorage.getItem(`quokka-dismissed-${courseId}`);
    const firstVisit = localStorage.getItem(`quokka-first-visit-${courseId}`);

    if (dismissed === "true") {
      setState("hidden");
    } else if (savedState === "expanded") {
      setState("expanded");
      // Initialize with welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm Quokka, your AI study assistant for ${courseCode}. Ask me anything about the course material! 🎓`,
        timestamp: new Date(),
      }]);
    } else if (!firstVisit) {
      setIsFirstVisit(true);
      localStorage.setItem(`quokka-first-visit-${courseId}`, "true");
    }
  }, [courseId, courseCode]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save state to localStorage
  const updateState = (newState: "hidden" | "minimized" | "expanded") => {
    setState(newState);
    localStorage.setItem(`quokka-state-${courseId}`, newState);
    if (newState === "hidden") {
      localStorage.setItem(`quokka-dismissed-${courseId}`, "true");
    }
  };

  // Handle minimize
  const handleMinimize = () => {
    updateState("minimized");
    // Restore focus to FAB button after minimize
    setTimeout(() => {
      fabButtonRef.current?.focus();
    }, 100);
  };

  // Handle dismiss
  const handleDismiss = () => {
    updateState("hidden");
  };

  // Handle expand
  const handleExpand = () => {
    updateState("expanded");
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm Quokka, your AI study assistant for ${courseCode}. Ask me anything about the course material! 🎓`,
        timestamp: new Date(),
      }]);
    }
  };

  // AI response logic (reused from /quokka page, course-context aware)
  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    const courseContext = `[Course: ${courseCode} - ${courseName}]\n\n`;

    // Course-specific quick responses
    if (courseCode.startsWith("CS")) {
      if (q.includes("binary search")) {
        return courseContext + "Binary search is an efficient algorithm for finding an item in a sorted array. It works by repeatedly dividing the search interval in half:\n\n1. Compare the target value to the middle element\n2. If equal, return the position\n3. If target is less, search the left half\n4. If target is greater, search the right half\n\nTime complexity: O(log n)\n\n**Important:** The array must be sorted first!";
      }
      if (q.includes("linked list") || q.includes("array")) {
        return courseContext + "**Arrays vs Linked Lists:**\n\n**Arrays:**\n- Fixed size\n- O(1) random access\n- O(n) insertion/deletion\n- Contiguous memory\n\n**Linked Lists:**\n- Dynamic size\n- O(n) access by index\n- O(1) insertion/deletion at known position\n- Non-contiguous memory\n\nUse arrays when you need fast lookups, linked lists when you need frequent insertions/deletions.";
      }
      if (q.includes("big o") || q.includes("complexity")) {
        return courseContext + "**Big O Notation** measures algorithm efficiency:\n\n- O(1): Constant time\n- O(log n): Logarithmic (binary search)\n- O(n): Linear (simple loop)\n- O(n log n): Efficient sorting (merge sort)\n- O(n²): Quadratic (nested loops)\n- O(2ⁿ): Exponential (avoid!)\n\nFocus on worst-case scenarios and drop constants/lower terms.";
      }
    }

    if (courseCode.startsWith("MATH")) {
      if (q.includes("integration") || q.includes("integral")) {
        return courseContext + "**Integration Techniques:**\n\n1. **Substitution** (u-substitution)\n2. **Integration by parts**: ∫u dv = uv - ∫v du\n3. **Partial fractions**\n4. **Trigonometric substitution**\n\n**LIATE rule** for choosing u:\nL - Logarithmic\nI - Inverse trig\nA - Algebraic\nT - Trigonometric\nE - Exponential\n\nWhat specific problem are you working on?";
      }
      if (q.includes("derivative")) {
        return courseContext + "**Common Derivatives:**\n\n- d/dx[xⁿ] = nxⁿ⁻¹ (power rule)\n- d/dx[eˣ] = eˣ\n- d/dx[ln x] = 1/x\n- d/dx[sin x] = cos x\n- d/dx[cos x] = -sin x\n\n**Chain Rule:** d/dx[f(g(x))] = f'(g(x)) · g'(x)\n\nNeed help with a specific derivative?";
      }
    }

    // General responses
    if (q.includes("hello") || q.includes("hi")) {
      return courseContext + `Hello! 👋 I'm here to help you with ${courseCode}. I can assist with:\n\n- Course concepts\n- Problem-solving strategies\n- Study tips\n\nWhat would you like to know?`;
    }

    return courseContext + `I'd be happy to help with "${question}" in the context of ${courseCode}!\n\nCould you provide more details about:\n- What specific concept you're asking about?\n- Any problems you're working on?\n- What you've tried so far?\n\nYou can also post this as a thread for more detailed help from instructors and peers!`;
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

  // Course-specific quick prompts
  const getQuickPrompts = (): string[] => {
    if (courseCode.startsWith("CS")) {
      return [
        "What is binary search?",
        "Explain Big O notation",
        "Arrays vs Linked Lists",
        "How does recursion work?",
      ];
    }
    if (courseCode.startsWith("MATH")) {
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
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state === "expanded") {
        setState("minimized");
        localStorage.setItem(`quokka-state-${courseId}`, "minimized");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [state, courseId]);

  // Hidden state - show nothing
  if (state === "hidden") {
    return null;
  }

  // Minimized state - show floating button
  if (state === "minimized") {
    return (
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          ref={fabButtonRef}
          onClick={handleExpand}
          className={`h-14 w-14 rounded-full ai-gradient ai-glow shadow-e3 hover:shadow-e3 transition-all ${
            isFirstVisit ? "animate-pulse" : ""
          }`}
          aria-label="Open Quokka AI Assistant"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
        {isFirstVisit && (
          <div className="absolute -top-12 right-0 glass-panel px-3 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap">
            Ask me anything! 💬
          </div>
        )}
      </div>
    );
  }

  // Expanded state - show chat window
  return (
    <FocusScope
      trapped={state === "expanded"}
      onMountAutoFocus={(e) => {
        // Focus message input on mount
        e.preventDefault();
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }}
      onUnmountAutoFocus={(e) => {
        // Do not auto-restore focus (handled by handleMinimize)
        e.preventDefault();
      }}
    >
      <div
        ref={dialogRef}
        className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quokka-title"
        aria-describedby="quokka-description"
      >
      <Card variant="glass-strong" className="flex flex-col shadow-e3 h-[500px]">
        {/* Header */}
        <CardHeader className="p-4 border-b border-[var(--border-glass)] flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle id="quokka-title" className="text-base glass-text flex items-center gap-2">
                Quokka AI
                <AIBadge variant="compact" />
              </CardTitle>
              <p id="quokka-description" className="sr-only">
                AI study assistant for {courseCode}
              </p>
              <Badge variant="outline" className="mt-1 status-online text-xs">
                ● Online
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-8 w-8 p-0"
              aria-label="Minimize chat"
            >
              <span className="sr-only">Minimize</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="7" width="10" height="2" rx="1" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
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
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
                    <div className="animate-pulse" aria-hidden="true">💭</div>
                    <p className="text-sm">Quokka is thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t border-[var(--border-glass)] p-4">
          {messages.length === 1 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {getQuickPrompts().slice(0, 2).map((prompt) => (
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
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      </div>
    </FocusScope>
  );
}

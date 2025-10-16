"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601 timestamp
}

// Simple keyword-based responses (mock AI)
const getAIResponse = (question: string): string => {
  const q = question.toLowerCase();

  if (q.includes("binary search")) {
    return "Binary search is an efficient algorithm for finding an item in a sorted array. It works by repeatedly dividing the search interval in half:\n\n1. Compare the target value to the middle element\n2. If equal, return the position\n3. If target is less, search the left half\n4. If target is greater, search the right half\n\nTime complexity: O(log n)\n\n**Important:** The array must be sorted first!";
  }

  if (q.includes("linked list") || q.includes("array")) {
    return "**Arrays vs Linked Lists:**\n\n**Arrays:**\n- Fixed size\n- O(1) random access\n- O(n) insertion/deletion\n- Contiguous memory\n\n**Linked Lists:**\n- Dynamic size\n- O(n) access by index\n- O(1) insertion/deletion at known position\n- Non-contiguous memory\n\nUse arrays when you need fast lookups, linked lists when you need frequent insertions/deletions.";
  }

  if (q.includes("big o") || q.includes("complexity") || q.includes("time complexity")) {
    return "**Big O Notation** measures algorithm efficiency:\n\n- O(1): Constant time\n- O(log n): Logarithmic (binary search)\n- O(n): Linear (simple loop)\n- O(n log n): Efficient sorting (merge sort)\n- O(n²): Quadratic (nested loops)\n- O(2ⁿ): Exponential (avoid!)\n\nFocus on worst-case scenarios and drop constants/lower terms.";
  }

  if (q.includes("recursion")) {
    return "**Recursion** is when a function calls itself:\n\n```python\ndef factorial(n):\n    if n <= 1:  # Base case\n        return 1\n    return n * factorial(n-1)  # Recursive case\n```\n\n**Key components:**\n1. Base case (stopping condition)\n2. Recursive case (calls itself)\n3. Progress toward base case\n\nUseful for tree traversal, divide-and-conquer algorithms, and mathematical problems.";
  }

  if (q.includes("integration") || q.includes("calculus") || q.includes("derivative")) {
    return "I can help with calculus! For integration:\n\n**Common techniques:**\n- Substitution (u-substitution)\n- Integration by parts: ∫u dv = uv - ∫v du\n- Partial fractions\n- Trigonometric substitution\n\n**LIATE rule** for choosing u in integration by parts:\nL - Logarithmic\nI - Inverse trig\nA - Algebraic\nT - Trigonometric\nE - Exponential\n\nWhat specific problem are you working on?";
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return "Hello! 👋 I'm Quokka, your AI study assistant. I can help you with:\n\n- Computer Science concepts (algorithms, data structures)\n- Mathematics (calculus, algebra)\n- General study questions\n\nJust ask me anything, and I'll do my best to help!";
  }

  if (q.includes("help") || q.includes("what can you do")) {
    return "I'm here to help you learn! I can assist with:\n\n✓ **Computer Science:** Algorithms, data structures, Big O notation\n✓ **Mathematics:** Calculus, integration, derivatives\n✓ **Problem Solving:** Break down complex problems\n✓ **Code Examples:** Provide working examples\n\nTry asking me about binary search, linked lists, Big O notation, or calculus!";
  }

  return `I'd be happy to help with "${question}"!\n\nWhile I'm best at Computer Science and Math topics, I can try to assist. Could you:\n\n1. Provide more context about what you're trying to learn?\n2. Share any specific problems you're working on?\n3. Let me know which course this is for?\n\nYou might also want to post this as a thread in your course for more detailed help from instructors and peers!`;
};

export default function QuokkaPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Quokka, your AI study assistant. Ask me anything about your courses! 🎓",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Redirect to login if not authenticated
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const aiResponse: Message = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: getAIResponse(userMessage.content),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsThinking(false);
  };

  const quickPrompts = [
    "What is binary search?",
    "Explain Big O notation",
    "Arrays vs Linked Lists",
    "How does recursion work?",
  ];

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-narrow space-y-12">
        {/* Hero Section */}
        <div className="text-center py-8 md:py-12 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 ai-gradient-text" aria-hidden="true" />
              <h1 className="heading-2 ai-gradient-text">Quokka AI</h1>
              <Sparkles className="h-10 w-10 ai-gradient-text" aria-hidden="true" />
            </div>
            <div className="flex justify-center">
              <AIBadge variant="default" />
            </div>
            <p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl mx-auto">
              Your friendly AI study assistant. Get instant help with computer science, mathematics, and more.
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <Card variant="glass-strong" className="flex flex-col" style={{ height: "calc(100vh - 400px)", minHeight: "500px", maxHeight: "700px" }}>
          <CardHeader className="p-6 md:p-8 border-b border-[var(--border-glass)]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="heading-4 glass-text">Chat with Quokka</CardTitle>
                <CardDescription className="text-base">Ask me anything about your courses</CardDescription>
              </div>
              <Badge className="ai-gradient text-white border-none">
                ● AI Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 md:p-5 ${
                    message.role === "user"
                      ? "message-user"
                      : "message-assistant"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="text-xs text-subtle mt-3">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="message-assistant p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">💭</div>
                    <p className="text-sm md:text-base">Quokka is thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-[var(--border-glass)] p-6 md:p-8">
            {messages.length === 1 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Quick prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(prompt)}
                      className="text-xs md:text-sm"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isThinking}
                className="flex-1 h-12 text-base"
                aria-label="Message input"
              />
              <Button
                type="submit"
                variant="glass-primary"
                size="lg"
                disabled={isThinking || !input.trim()}
              >
                Send
              </Button>
            </form>
          </div>
        </Card>

        {/* Tips */}
        <Card variant="glass">
          <CardHeader className="p-8">
            <CardTitle className="heading-5 glass-text">💡 Tips for Using Quokka AI</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <ul className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">✓</span>
                <span>I&apos;m best at Computer Science and Mathematics topics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">✓</span>
                <span>For complex questions, consider posting a thread for detailed peer/instructor help</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">✓</span>
                <span>I use keyword matching - be specific and include key terms in your questions!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
      timestamp: new Date(),
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
      timestamp: new Date(),
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
      timestamp: new Date(),
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary glass-text">Quokka AI</h1>
          <p className="text-muted-foreground">
            Your friendly AI study assistant
          </p>
        </div>

        {/* Chat Container */}
        <Card variant="glass-strong" className="h-[600px] flex flex-col">
          <CardHeader className="border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chat with Quokka</CardTitle>
                <CardDescription>Ask me anything about your courses</CardDescription>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success">
                ● Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary/10 text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-primary/10 text-foreground rounded-lg p-4">
                  <p className="text-sm">Quokka is thinking...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-border/40 p-4">
            {messages.length === 1 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isThinking}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="glass-primary"
                disabled={isThinking || !input.trim()}
              >
                Send
              </Button>
            </form>
          </div>
        </Card>

        {/* Tips */}
        <Card variant="glass">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p className="font-semibold mb-2">💡 Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>I&apos;m best at CS and Math topics</li>
              <li>For complex questions, consider posting a thread for peer/instructor help</li>
              <li>I use keyword matching - be specific in your questions!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

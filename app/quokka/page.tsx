"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentUser,
  useAIConversations,
  useConversationMessages,
  useCreateConversation,
  useSendMessage,
} from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { Sparkles, Circle } from "lucide-react";

export default function QuokkaPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [input, setInput] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's conversations
  const { data: conversations } = useAIConversations(user?.id);

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(activeConversationId || undefined);

  // Conversation mutations
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  // Auto-load or create conversation on mount
  useEffect(() => {
    if (!user || activeConversationId) return;

    // Try to load most recent conversation
    if (conversations && conversations.length > 0) {
      const mostRecent = conversations[0]; // Already sorted by updatedAt DESC
      setActiveConversationId(mostRecent.id);
    } else {
      // Create new conversation if none exists
      createConversation.mutate(
        {
          userId: user.id,
          courseId: null, // General conversation (multi-course)
          title: "Quokka Chat",
        },
        {
          onSuccess: (newConversation) => {
            setActiveConversationId(newConversation.id);
          },
        }
      );
    }
  }, [user, conversations, activeConversationId, createConversation]);

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
    if (!input.trim() || !activeConversationId || !user) return;

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
        <Card variant="glass-strong" className="flex flex-col min-h-[500px] max-h-[700px] h-[calc(100vh-400px)]">
          <CardHeader className="p-6 md:p-8 border-b border-glass">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="heading-4 glass-text">Chat with Quokka</CardTitle>
                <CardDescription className="text-base">Ask me anything about your courses</CardDescription>
              </div>
              <Badge className="ai-gradient text-white border-none">
                <Circle className="w-2 h-2 fill-white mr-2" />
                AI Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Chat conversation"
            aria-busy={sendMessage.isPending}
          >
            {messages.length === 0 && !messagesLoading && (
              <div className="flex justify-start">
                <div className="message-assistant p-4 md:p-5">
                  <p className="text-sm md:text-base leading-relaxed">
                    Hi! I&apos;m Quokka, your AI study assistant. Ask me anything about your courses! 🎓
                  </p>
                </div>
              </div>
            )}

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

            {sendMessage.isPending && (
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
          <div className="border-t border-glass p-6 md:p-8">
            {messages.length === 0 && !messagesLoading && (
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
                disabled={sendMessage.isPending || !activeConversationId}
                className="flex-1 h-12 text-base"
                aria-label="Message input"
              />
              <Button
                type="submit"
                variant="glass-primary"
                size="lg"
                disabled={sendMessage.isPending || !input.trim() || !activeConversationId}
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
                <span>I can help with all your enrolled courses using course materials and context</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">✓</span>
                <span>For complex questions, consider posting a thread for detailed peer/instructor help</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">✓</span>
                <span>Your conversations are private and persist across sessions</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

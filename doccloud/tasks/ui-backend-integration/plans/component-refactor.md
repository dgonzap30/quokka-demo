# Component Refactor Implementation Plan

**Created:** 2025-10-17
**Agent:** Component Architect
**Task:** Detailed implementation plan for conversation hook integration

---

## Overview

This plan provides **exact code changes** with line numbers for integrating conversation hooks into `/quokka/page.tsx` and `quokka-assistant-modal.tsx`. All changes maintain existing UX while transitioning to persistent LLM backend storage.

---

## Phase 1: Quokka Page Integration

### File: `app/quokka/page.tsx`

#### Step 1.1: Update Imports (Lines 1-11)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentUser,
  useAIConversations,
  useConversationMessages,
  useCreateConversation,
  useSendMessage,
  useUserCourses,
} from "@/lib/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import type { AIMessage } from "@/lib/models/types";
```

**Rationale:** Add conversation hooks, Select component, Loader2 icon, and AIMessage type

---

#### Step 1.2: Remove Local Message Interface (Lines 13-18)

**DELETE:**
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601 timestamp
}
```

**Rationale:** Use `AIMessage` from `lib/models/types.ts` instead

---

#### Step 1.3: Remove Mock AI Response Function (Lines 21-53)

**DELETE:**
```typescript
const getAIResponse = (question: string): string => {
  const q = question.toLowerCase();

  if (q.includes("binary search")) {
    return "Binary search is an efficient algorithm...";
  }

  // ... (entire function)

  return `I'd be happy to help with "${question}"!...`;
};
```

**Rationale:** Replaced by LLM backend via `useSendMessage` hook

---

#### Step 1.4: Update Component State (Lines 55-68)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
export default function QuokkaPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // ============================================
  // Conversation State & Hooks
  // ============================================
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch user's conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useAIConversations(user?.id);

  // Fetch user's enrolled courses for course selector
  const { data: userCourses = [], isLoading: coursesLoading } = useUserCourses(user?.id);

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useConversationMessages(
    activeConversationId || undefined
  );

  // Mutations
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();

  // UI State
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Rationale:**
- Replace local `messages` state with React Query hook
- Add conversation ID tracking
- Add course selector state
- Add conversation and mutation hooks

---

#### Step 1.5: Add Conversation Initialization Effect (NEW - After Line 68)

**INSERT AFTER messagesEndRef:**
```typescript
  // ============================================
  // Initialize Conversation on Mount
  // ============================================
  useEffect(() => {
    if (user && conversations.length > 0 && !activeConversationId) {
      // Load most recent conversation
      const mostRecent = conversations[0]; // Already sorted by updatedAt DESC
      setActiveConversationId(mostRecent.id);

      // Set course context if conversation has one
      if (mostRecent.courseId) {
        setSelectedCourseId(mostRecent.courseId);
      }
    }
  }, [user, conversations, activeConversationId]);
```

**Rationale:** Auto-load most recent conversation for seamless UX

---

#### Step 1.6: Update Auto-Scroll Effect (Line 71-73)

**REPLACE:**
```typescript
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
```

**WITH:**
```typescript
  // ============================================
  // Auto-Scroll to Bottom
  // ============================================
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesLoading]);
```

**Rationale:** Prevent scroll jump during loading state

---

#### Step 1.7: Update handleSubmit Function (Lines 81-108)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Handle Course Selection
  // ============================================
  const handleCourseSelect = async (courseId: string) => {
    const newCourseId = courseId === "" ? null : courseId;
    setSelectedCourseId(newCourseId);

    // If course changes and conversation is active, create new conversation with new context
    if (activeConversationId && messages.length > 1) {
      // User has active conversation - switching course means new conversation
      try {
        const conversation = await createConversationMutation.mutateAsync({
          userId: user!.id,
          courseId: newCourseId,
          title: `Chat - ${new Date().toLocaleString()}`,
        });
        setActiveConversationId(conversation.id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        alert("Failed to switch course context. Please try again.");
      }
    }
  };

  // ============================================
  // Handle Message Submission
  // ============================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking || !user) return;

    const content = input.trim();
    setInput("");

    // STEP 1: Ensure conversation exists
    let conversationId = activeConversationId;
    if (!conversationId) {
      setIsThinking(true);
      try {
        const conversation = await createConversationMutation.mutateAsync({
          userId: user.id,
          courseId: selectedCourseId,
          title: content.slice(0, 100), // Use first message as title
        });
        conversationId = conversation.id;
        setActiveConversationId(conversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        alert("Failed to start conversation. Please try again.");
        setIsThinking(false);
        return;
      }
    }

    // STEP 2: Send message (includes LLM response generation)
    setIsThinking(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content,
        role: "user",
      });
      // Success: React Query auto-updates messages via optimistic update + invalidation
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };
```

**Rationale:**
- Remove manual message state updates
- Create conversation on first message
- Use `useSendMessage` for LLM integration
- Add course selection handler

---

#### Step 1.8: Update JSX - Add Course Selector (After Line 135, Before Chat Container)

**INSERT AFTER hero section closing div:**
```typescript
        {/* Course Context Selector */}
        {userCourses.length > 0 && (
          <Card variant="glass" className="p-6">
            <div className="space-y-3">
              <label htmlFor="course-select" className="block text-sm font-semibold glass-text">
                Course Context (Optional)
              </label>
              <Select value={selectedCourseId || ""} onValueChange={handleCourseSelect}>
                <SelectTrigger id="course-select" className="w-full">
                  <SelectValue placeholder="All courses (general assistant)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All courses (general)</SelectItem>
                  {userCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a course to get AI responses based on course materials, or leave as "All courses" for general assistance.
              </p>
            </div>
          </Card>
        )}
```

**Rationale:** Allow users to select course context for targeted AI responses

---

#### Step 1.9: Update JSX - Chat Messages Display (Line 152-173)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Loading State */}
            {messagesLoading && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!messagesLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Sparkles className="h-16 w-16 ai-gradient-text" aria-hidden="true" />
                <p className="text-lg text-muted-foreground">
                  Hi! I'm Quokka, your AI study assistant. Ask me anything about your courses!
                </p>
              </div>
            )}

            {/* Messages List */}
            {!messagesLoading && messages.length > 0 && messages.map((message) => (
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

                  {/* NEW: Display material references if present */}
                  {message.materialReferences && message.materialReferences.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        📚 Sources:
                      </p>
                      <div className="space-y-1">
                        {message.materialReferences.slice(0, 3).map((ref) => (
                          <div key={ref.materialId} className="text-xs text-muted-foreground">
                            • {ref.title} ({ref.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NEW: Display confidence score if present */}
                  {message.confidenceScore !== undefined && (
                    <p className="text-xs text-subtle mt-2">
                      Confidence: {message.confidenceScore}%
                    </p>
                  )}

                  <p className="text-xs text-subtle mt-3">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Thinking State */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="message-assistant p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm md:text-base">Quokka is thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>
```

**Rationale:**
- Add loading, empty, and populated states
- Display material references and confidence scores
- Improve thinking animation with Loader2

---

#### Step 1.10: Update JSX - Input Section (Lines 189-228)

**REPLACE Quick Prompts Condition (Line 191):**
```typescript
            {messages.length === 1 && (
```

**WITH:**
```typescript
            {messages.length === 0 && !messagesLoading && (
```

**Rationale:** Show quick prompts only when no messages exist (not just welcome message)

---

### Phase 1 Complete - Expected File Changes Summary

**Lines Modified:** ~200 lines
**Lines Added:** ~100 lines
**Lines Deleted:** ~50 lines

**Key Changes:**
- ✅ Remove mock AI response function
- ✅ Add conversation hooks
- ✅ Add course selector
- ✅ Implement conversation persistence
- ✅ Add material references display
- ✅ Improve loading states

---

## Phase 2: Quokka Assistant Modal Integration

### File: `components/ai/quokka-assistant-modal.tsx`

#### Step 2.1: Update Imports (Lines 1-23)

**REPLACE Line 21:**
```typescript
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import type { Message, Citation, CourseSummary } from "@/lib/models/types";
```

**WITH:**
```typescript
import {
  useCurrentUser,
  useCreateThread,
  useAIConversations,
  useConversationMessages,
  useCreateConversation,
  useSendMessage,
  useConvertConversationToThread,
} from "@/lib/api/hooks";
import type { Message, Citation, CourseSummary, AIMessage } from "@/lib/models/types";
```

**Rationale:** Add conversation hooks and AIMessage type

---

#### Step 2.2: Remove EnhancedMessage Interface (Lines 24-29)

**DELETE:**
```typescript
// Enhanced message type with citations
interface EnhancedMessage extends Message {
  citations?: Citation[];
  courseId?: string;
  courseCode?: string;
}
```

**Rationale:** Use `AIMessage` from types instead

---

#### Step 2.3: Remove detectCourseFromQuery Function (Lines 55-107)

**DELETE:**
```typescript
/**
 * Detects relevant course from user query based on keyword matching
 */
function detectCourseFromQuery(
  query: string,
  availableCourses: CourseSummary[]
): CourseSummary | null {
  // ... (entire function)
}
```

**Rationale:** Backend handles course detection via LLM context builders

---

#### Step 2.4: Remove getAIResponse Function (Lines 238-303)

**DELETE:**
```typescript
  // AI response logic (context-aware)
  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    const courseCode = activeCourse?.code || currentCourseCode;
    // ... (entire function)
  };
```

**Rationale:** Replaced by LLM backend

---

#### Step 2.5: Update Component State (Lines 132-147)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Conversation State & Hooks
  // ============================================
  const [modalConversationId, setModalConversationId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch messages for modal conversation
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(
    modalConversationId || undefined
  );

  // Mutations
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const convertToThreadMutation = useConvertConversationToThread();

  // UI State
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isPostingThread, setIsPostingThread] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [postedThreadId, setPostedThreadId] = useState<string | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
```

**Rationale:**
- Replace local `messages` state with React Query hook
- Add `modalConversationId` tracking
- Remove course detection state (handled by backend)
- Add conversation mutations

---

#### Step 2.6: Remove activeCourseId Calculation (Lines 150-161)

**DELETE:**
```typescript
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
```

**REPLACE WITH:**
```typescript
  // ============================================
  // Active Course Calculation
  // ============================================
  const activeCourseId = useMemo(() => {
    if (pageContext === "course" && currentCourseId) {
      return currentCourseId;
    }
    if (selectedCourseId) {
      return selectedCourseId;
    }
    return null;
  }, [pageContext, currentCourseId, selectedCourseId]);
```

**Rationale:** Simplify to manual selection only (no auto-detection)

---

#### Step 2.7: Remove Course Detection Effects (Lines 175-195)

**DELETE:**
```typescript
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
```

**Rationale:** Backend LLM context builders handle course detection automatically

---

#### Step 2.8: Update Conversation Initialization (Lines 211-222)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Initialize Conversation on Modal Open
  // ============================================
  useEffect(() => {
    if (isOpen && !modalConversationId && user) {
      // Create new conversation for this modal session
      createConversationMutation.mutate(
        {
          userId: user.id,
          courseId: activeCourseId,
          title: `Chat - ${new Date().toLocaleString()}`,
        },
        {
          onSuccess: (conversation) => {
            setModalConversationId(conversation.id);
          },
          onError: (error) => {
            console.error("Failed to create conversation:", error);
            alert("Failed to start conversation. Please try again.");
          },
        }
      );
    }
  }, [isOpen, modalConversationId, activeCourseId, user, createConversationMutation]);

  // ============================================
  // Clean Up on Modal Close (OPTIONAL)
  // ============================================
  useEffect(() => {
    if (!isOpen) {
      // Option A: Clear conversation ID (lose reference, conversation persists in DB)
      // setModalConversationId(null);

      // Option B: Keep conversation ID (preserve for re-open within session)
      // This is recommended for better UX
    }
  }, [isOpen]);
```

**Rationale:**
- Create conversation on modal open
- Persist conversation across modal sessions
- Remove welcome message (first assistant message comes from backend)

---

#### Step 2.9: Update handleSubmit Function (Lines 305-332)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Handle Message Submission
  // ============================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking || !modalConversationId) return;

    const content = input.trim();
    setInput("");
    setIsThinking(true);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: modalConversationId,
        content,
        role: "user",
      });
      // Success: React Query auto-updates messages via optimistic update + invalidation
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };
```

**Rationale:**
- Remove manual message state updates
- Use `useSendMessage` for LLM integration
- Rely on React Query for state management

---

#### Step 2.10: Update handleClearConversation (Lines 335-345)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Handle Clear Conversation
  // ============================================
  const handleClearConversation = async () => {
    if (!user) return;

    setShowClearConfirm(false);

    // Create new conversation to replace current one
    try {
      const conversation = await createConversationMutation.mutateAsync({
        userId: user.id,
        courseId: activeCourseId,
        title: `Chat - ${new Date().toLocaleString()}`,
      });
      setModalConversationId(conversation.id);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      alert("Failed to clear conversation. Please try again.");
    }
  };
```

**Rationale:** Create new conversation instead of clearing messages (preserves old conversation in history)

---

#### Step 2.11: Remove formatConversationAsThread Function (Lines 399-417)

**DELETE:**
```typescript
  // Convert conversation to thread content
  const formatConversationAsThread = (): { title: string; content: string } => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 200)
      : "AI Conversation - " + new Date().toLocaleDateString();

    const content = messages
      .filter((m) => m.id !== "welcome")
      .map((m) =>
        m.role === "user"
          ? `**Q:** ${m.content}`
          : `**A (Quokka):** ${m.content}`
      )
      .join("\n\n---\n\n");

    return { title, content };
  };
```

**Rationale:** Use `useConvertConversationToThread` hook instead

---

#### Step 2.12: Update handlePostAsThread Function (Lines 420-453)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
  // ============================================
  // Post Conversation as Thread
  // ============================================
  const handlePostAsThread = async () => {
    const targetCourseId = activeCourseId || currentCourseId;
    if (!targetCourseId || !user || !modalConversationId || messages.length < 2) return;

    // Show confirmation if on dashboard
    if (pageContext === "dashboard" && !showPostConfirm) {
      setShowPostConfirm(true);
      return;
    }

    setIsPostingThread(true);
    try {
      const result = await convertToThreadMutation.mutateAsync({
        conversationId: modalConversationId,
        userId: user.id,
        courseId: targetCourseId,
      });

      // Success: Show styled success dialog
      setPostedThreadId(result.thread.id);
      setShowPostSuccess(true);
      setShowPostConfirm(false);
    } catch (error) {
      console.error("Failed to convert conversation:", error);
      alert("Failed to post conversation. Please try again.");
    } finally {
      setIsPostingThread(false);
    }
  };
```

**Rationale:**
- Use native `useConvertConversationToThread` hook
- Preserve conversation history and AI answer integrity
- Reduce code complexity

---

#### Step 2.13: Update Course Selector JSX (Lines 495-524)

**REMOVE Auto-Detection Indicator (Lines 514-522):**
```typescript
                  {/* Auto-detected course indicator */}
                  {detectedCourseId && !selectedCourseId && activeCourse && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>
                        Auto-detected: <strong>{activeCourse.code}</strong>
                      </span>
                    </div>
                  )}
```

**Rationale:** Backend handles detection automatically

---

#### Step 2.14: Update Messages Display JSX (Lines 528-570)

**REPLACE:**
```typescript
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
```

**WITH:**
```typescript
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div
                role="log"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="additions"
                aria-label="Chat message history"
              >
                {/* Loading State */}
                {messagesLoading && (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Empty State */}
                {!messagesLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Sparkles className="h-16 w-16 ai-gradient-text" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Start a conversation with Quokka!
                    </p>
                  </div>
                )}

                {/* Messages List */}
                {!messagesLoading && messages.length > 0 && messages.map((message) => (
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

                      {/* NEW: Display material references if present */}
                      {message.materialReferences && message.materialReferences.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            📚 Sources:
                          </p>
                          <div className="space-y-1">
                            {message.materialReferences.slice(0, 2).map((ref) => (
                              <div key={ref.materialId} className="text-xs text-muted-foreground">
                                • {ref.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NEW: Display confidence score if present */}
                      {message.confidenceScore !== undefined && (
                        <p className="text-xs text-subtle mt-1">
                          Confidence: {message.confidenceScore}%
                        </p>
                      )}

                      <p className="text-xs text-subtle mt-2">
                        <span className="sr-only">{message.role === "user" ? "Sent" : "Received"} at </span>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Thinking State */}
                {isThinking && (
                  <div className="flex justify-start" role="status" aria-live="polite">
                    <div className="message-assistant p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">Quokka is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={messagesEndRef} />
            </div>
```

**Rationale:**
- Add loading and empty states
- Display material references and confidence scores
- Improve thinking animation with Loader2

---

#### Step 2.15: Update Quick Prompts Condition (Line 576)

**REPLACE:**
```typescript
              {messages.length === 1 && (
```

**WITH:**
```typescript
              {messages.length === 0 && !messagesLoading && (
```

**Rationale:** Show quick prompts only when conversation is empty

---

### Phase 2 Complete - Expected File Changes Summary

**Lines Modified:** ~250 lines
**Lines Added:** ~80 lines
**Lines Deleted:** ~120 lines

**Key Changes:**
- ✅ Remove mock AI response and course detection functions
- ✅ Add conversation persistence across modal sessions
- ✅ Implement LLM backend integration
- ✅ Add material references display
- ✅ Simplify post-to-thread conversion
- ✅ Improve loading and empty states

---

## Phase 3: Testing & Verification

### Test Checklist - Quokka Page

#### Basic Functionality
- [ ] Page loads without console errors
- [ ] Course selector displays enrolled courses
- [ ] Selecting course creates new conversation with course context
- [ ] First message creates conversation automatically
- [ ] Subsequent messages use existing conversation

#### Message Flow
- [ ] User messages appear immediately (optimistic update)
- [ ] AI responses appear after ~2-3 seconds
- [ ] Material references display correctly (if present)
- [ ] Confidence scores display correctly (if present)
- [ ] Message timestamps are accurate

#### Persistence
- [ ] Messages persist across page refresh
- [ ] Most recent conversation loads on mount
- [ ] Switching courses creates new conversation
- [ ] Old conversations remain accessible (check localStorage)

#### Error Handling
- [ ] Failed message send shows error alert
- [ ] Failed message send removes optimistic message
- [ ] Network errors handled gracefully
- [ ] Missing conversation ID prevents submission

#### Accessibility
- [ ] Screen reader announces messages correctly
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible on all interactive elements
- [ ] Loading states announced to screen readers

---

### Test Checklist - Quokka Assistant Modal

#### Basic Functionality
- [ ] Modal opens without console errors
- [ ] New conversation created on modal open
- [ ] Course selector displays available courses (dashboard context)
- [ ] Course page context auto-selects course
- [ ] Manual course selection overrides page context

#### Message Flow
- [ ] User messages appear immediately (optimistic update)
- [ ] AI responses appear after ~2-3 seconds
- [ ] Material references display correctly
- [ ] Confidence scores display correctly
- [ ] Quick prompts show when conversation is empty

#### Conversation Persistence
- [ ] Conversation persists across modal close/open
- [ ] Multiple modal sessions maintain separate conversations
- [ ] Clear conversation creates new conversation

#### Post to Thread
- [ ] Post as thread button enabled when course is selected
- [ ] Confirmation dialog shows for dashboard context
- [ ] Conversation converts to thread successfully
- [ ] Thread preserves all messages and formatting
- [ ] Navigation to thread works correctly
- [ ] Posted thread visible in course threads list

#### Error Handling
- [ ] Failed conversation creation shows error
- [ ] Failed message send shows error and removes optimistic message
- [ ] Failed thread conversion shows error
- [ ] Network errors handled gracefully

#### Accessibility
- [ ] Modal focus trap works correctly
- [ ] Screen reader announces messages
- [ ] Keyboard navigation works throughout
- [ ] ARIA labels present and accurate

---

## Phase 4: Integration Verification

### Backend Integration Checks

#### LLM Integration
- [ ] AI responses include course material context (check console logs)
- [ ] Responses reference specific materials when relevant
- [ ] Confidence scores reflect answer quality
- [ ] Course materials seed data loaded correctly

#### API Contract Compliance
- [ ] `useCreateConversation` returns valid AIConversation
- [ ] `useSendMessage` returns user + AI messages
- [ ] `useConversationMessages` returns chronological messages
- [ ] `useConvertConversationToThread` preserves conversation structure

#### localStorage Verification
- [ ] Conversations stored in `quokkaq.aiConversations`
- [ ] Messages stored in `quokkaq.conversationMessages`
- [ ] Seed version matches `v2.1.0`
- [ ] Data persists across browser refresh

---

### Performance Verification

#### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Modal open < 500ms
- [ ] Message send optimistic update < 50ms
- [ ] AI response appears in 2-5 seconds

#### Memory Usage
- [ ] No memory leaks on repeated modal open/close
- [ ] Message list scrolls smoothly with 50+ messages
- [ ] React Query cache stays below 10MB

---

## Phase 5: Rollback Strategy

### If Integration Fails

#### Step 5.1: Disable LLM Integration
1. Set `NEXT_PUBLIC_USE_LLM=false` in `.env.local`
2. Verify template-based responses still work
3. Commit as hotfix

#### Step 5.2: Revert UI Changes
1. Restore previous versions of files:
   - `app/quokka/page.tsx`
   - `components/ai/quokka-assistant-modal.tsx`
2. Test reverted files work correctly
3. Commit as rollback

#### Step 5.3: Full Rollback
1. Run `git revert <commit-hash>` for integration commit
2. Deploy reverted version
3. Create incident report

---

## Decision Summary

### Architecture Decisions

**Decision 1: Single Active Conversation Pattern**
- **Rationale:** Simplest mental model, matches existing UX
- **Trade-off:** Defers conversation history sidebar to Phase 2
- **Alternatives Considered:** Multi-conversation with sidebar (too complex for MVP)

**Decision 2: Optimistic Updates for User Messages**
- **Rationale:** Instant feedback, standard React Query pattern
- **Trade-off:** Slight complexity in error rollback
- **Alternatives Considered:** Wait for server confirmation (poor UX)

**Decision 3: Modal Creates New Conversation on Open**
- **Rationale:** Clear conversation boundaries, easy to implement
- **Trade-off:** Potential conversation proliferation
- **Alternatives Considered:** Reuse conversation across sessions (confusing UX)

**Decision 4: Backend Course Detection**
- **Rationale:** LLM context builders handle detection automatically
- **Trade-off:** Remove client-side detection logic
- **Alternatives Considered:** Keep client detection + backend detection (redundant)

**Decision 5: Native Conversation-to-Thread Conversion**
- **Rationale:** Preserves conversation integrity, reduces code
- **Trade-off:** None (pure improvement)
- **Alternatives Considered:** Manual formatting (error-prone, loses context)

---

### Files Modified Summary

| File | Lines Modified | Lines Added | Lines Deleted | Complexity |
|------|----------------|-------------|---------------|------------|
| `app/quokka/page.tsx` | ~200 | ~100 | ~50 | Medium |
| `components/ai/quokka-assistant-modal.tsx` | ~250 | ~80 | ~120 | High |
| **Total** | **~450** | **~180** | **~170** | **High** |

---

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Conversation ID loss | Low | High | Add localStorage backup |
| Type mismatches | Medium | Medium | TypeScript strict mode catches |
| Message sync delays | Medium | Low | Optimistic updates mask latency |
| Modal conversation accumulation | Medium | Low | Add "New Conversation" button |
| LLM latency spikes | High | Medium | Show thinking state, set timeout |

---

## Next Steps for Parent

1. **Review this plan** - Approve or request changes
2. **Implement Phase 1** - Quokka page integration
3. **Test Phase 1** - Verify functionality
4. **Implement Phase 2** - Modal integration
5. **Test Phase 2** - Verify functionality
6. **Integration testing** - End-to-end verification
7. **Commit changes** - With Conventional Commit message

---

**Plan Complete - Ready for Implementation**

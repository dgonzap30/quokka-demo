# Component Analysis - Quokka Chat Integration

**Created:** 2025-10-17
**Agent:** Component Architect
**Task:** Analyze existing component patterns for conversation hook integration

---

## Executive Summary

Both `app/quokka/page.tsx` and `components/ai/quokka-assistant-modal.tsx` currently use **keyword-based mock responses** with **in-memory state management**. This analysis documents their current architecture, state patterns, and identifies exact integration points for transitioning to the persistent LLM backend with conversation hooks.

---

## Current Component State Management

### 1. Quokka Page (`app/quokka/page.tsx`)

**Current Pattern:**
- **State Location:** Component-local state with `useState`
- **Message Storage:** In-memory array `messages: Message[]`
- **Lifecycle:** Messages lost on page unmount/reload
- **AI Response:** Synchronous keyword matching via `getAIResponse()`

**State Structure:**
```typescript
// Line 58-66
const [messages, setMessages] = useState<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm Quokka...",
    timestamp: new Date().toISOString(),
  },
]);
const [input, setInput] = useState("");
const [isThinking, setIsThinking] = useState(false);
```

**Message Flow:**
1. User submits form → `handleSubmit` (line 81)
2. Optimistic add user message to `messages` (line 92)
3. Simulate delay (line 97)
4. Call `getAIResponse()` keyword matcher (line 102)
5. Add AI response to `messages` (line 106)

**Key Observations:**
- ✅ Already implements optimistic updates for user messages
- ✅ Shows loading state with `isThinking`
- ✅ Auto-scrolls to bottom on message changes (line 71-73)
- ❌ No persistence across reloads
- ❌ No conversation ID tracking
- ❌ No course context selection

---

### 2. Quokka Assistant Modal (`components/ai/quokka-assistant-modal.tsx`)

**Current Pattern:**
- **State Location:** Component-local state with `useState`
- **Message Storage:** In-memory array `messages: EnhancedMessage[]`
- **Lifecycle:** Messages persist within modal session, lost on close
- **AI Response:** Context-aware keyword matching via `getAIResponse()`

**State Structure:**
```typescript
// Line 132-143
const [messages, setMessages] = useState<EnhancedMessage[]>([]);
const [input, setInput] = useState("");
const [isThinking, setIsThinking] = useState(false);
const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
const [detectedCourseId, setDetectedCourseId] = useState<string | null>(null);
const [debouncedQuery, setDebouncedQuery] = useState<string>("");
```

**Message Flow:**
1. Modal opens → Initialize welcome message (line 211-221)
2. User submits form → `handleSubmit` (line 305)
3. Optimistic add user message (line 316)
4. Simulate delay (line 321)
5. Call context-aware `getAIResponse()` (line 326)
6. Add AI response (line 330)

**Course Context Features:**
- **Manual Selection:** Course dropdown (line 495-524)
- **Auto-Detection:** Debounced query analysis (line 175-195)
- **Priority Order:** course page > manual > detected > null
- **Detection Function:** `detectCourseFromQuery()` (line 57-107)

**Key Observations:**
- ✅ Multi-course awareness with detection/selection
- ✅ Context-aware responses (line 239-303)
- ✅ Post to thread conversion (line 399-453)
- ✅ Optimistic updates + error handling
- ❌ No persistence across modal close/open
- ❌ No conversation history access
- ❌ No LLM integration

---

## Available React Query Hooks

### Conversation Management Hooks

```typescript
// lib/api/hooks.ts (lines 847-1072)

1. useAIConversations(userId)
   - Fetches all conversations for user
   - Stale time: 1 minute
   - Sorted by updatedAt DESC

2. useConversationMessages(conversationId)
   - Fetches messages for specific conversation
   - Stale time: 30 seconds
   - Polls every 5 seconds (refetchInterval)

3. useCreateConversation() - Mutation
   - Creates new conversation
   - Input: { userId, courseId?, title? }
   - Invalidates: aiConversations

4. useSendMessage() - Mutation
   - Sends user message + generates AI response
   - Input: { conversationId, content, role }
   - Optimistic update for user message
   - Invalidates: conversationMessages, aiConversations

5. useDeleteConversation() - Mutation
   - Deletes conversation + cascade messages
   - Optimistic removal from list

6. useConvertConversationToThread() - Mutation
   - Converts conversation → public thread
   - Preserves messages as thread content
   - Invalidates: courseThreads, aiConversations
```

### Hook Characteristics
- **Optimistic Updates:** Built-in for mutations
- **Error Rollback:** Automatic on mutation failure
- **Cache Invalidation:** Automatic query refetch on success
- **Polling:** `useConversationMessages` polls every 5s

---

## Integration Points Analysis

### Quokka Page (`/quokka/page.tsx`)

#### Point 1: Conversation Initialization (Lines 55-79)

**Current Code:**
```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm Quokka...",
    timestamp: new Date().toISOString(),
  },
]);
```

**Required Changes:**
```typescript
// NEW: Track active conversation ID
const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

// NEW: Fetch existing conversations
const { data: conversations } = useAIConversations(user?.id);

// NEW: Fetch messages for active conversation
const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(activeConversationId || undefined);

// NEW: Mutations
const createConversationMutation = useCreateConversation();
const sendMessageMutation = useSendMessage();
```

**Lifecycle Logic:**
1. On mount: Check if user has existing conversations
2. If yes: Load most recent conversation
3. If no: Create new conversation on first message
4. Display messages from React Query instead of local state

---

#### Point 2: Message Submission (Lines 81-108)

**Current Code:**
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

**Required Changes:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  // STEP 1: Ensure conversation exists
  let conversationId = activeConversationId;
  if (!conversationId) {
    // Create conversation on first message
    const result = await createConversationMutation.mutateAsync({
      userId: user!.id,
      courseId: null, // General conversation (no course context)
      title: input.slice(0, 100), // Use first message as title
    });
    conversationId = result.id;
    setActiveConversationId(conversationId);
  }

  // STEP 2: Send message (includes LLM response generation)
  const content = input.trim();
  setInput("");
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

**State Changes:**
- ❌ Remove `messages` local state
- ❌ Remove `setMessages` calls
- ✅ Add `activeConversationId` state
- ✅ Add `createConversationMutation`
- ✅ Add `sendMessageMutation`
- ✅ Use `useConversationMessages` for display

---

#### Point 3: Course Selector Addition (NEW Feature)

**Location:** Between hero section and chat container (after line 135)

**Required Component:**
```typescript
<div className="mb-6">
  <label htmlFor="course-select" className="block text-sm font-medium mb-2">
    Course Context (Optional)
  </label>
  <Select value={selectedCourseId || ""} onValueChange={handleCourseSelect}>
    <SelectTrigger id="course-select">
      <SelectValue placeholder="All courses (general assistant)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">General (all courses)</SelectItem>
      {userCourses?.map((course) => (
        <SelectItem key={course.id} value={course.id}>
          {course.code} - {course.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**New Hooks:**
```typescript
const { data: enrollments } = useUserCourses(user?.id);
const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
```

---

### Quokka Assistant Modal (`components/ai/quokka-assistant-modal.tsx`)

#### Point 4: Modal Conversation Persistence (Lines 211-222)

**Current Code:**
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
}, [isOpen]);
```

**Required Changes:**
```typescript
// NEW: Track active conversation for this modal session
const [modalConversationId, setModalConversationId] = useState<string | null>(null);

// NEW: Fetch messages for modal conversation
const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(modalConversationId || undefined);

// NEW: Mutations
const createConversationMutation = useCreateConversation();
const sendMessageMutation = useSendMessage();

// Initialize conversation when modal opens
useEffect(() => {
  if (isOpen && !modalConversationId) {
    // Create new conversation for this modal session
    createConversationMutation.mutate({
      userId: user!.id,
      courseId: activeCourseId, // Use detected/selected course
      title: `Chat - ${new Date().toLocaleString()}`,
    }, {
      onSuccess: (conversation) => {
        setModalConversationId(conversation.id);
      },
    });
  }
}, [isOpen, modalConversationId, activeCourseId, user]);

// Clean up on modal close (optional: keep conversation for history)
useEffect(() => {
  if (!isOpen) {
    // Option A: Clear conversation ID (lose reference)
    setModalConversationId(null);

    // Option B: Keep conversation ID (preserve for re-open)
    // Do nothing
  }
}, [isOpen]);
```

**State Changes:**
- ❌ Remove `messages` local state
- ✅ Add `modalConversationId` state
- ✅ Use `useConversationMessages(modalConversationId)`
- ✅ Create conversation on modal open

---

#### Point 5: Message Submission with Context (Lines 305-332)

**Current Code:**
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

**Required Changes:**
```typescript
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
    // Success: React Query auto-updates messages
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setIsThinking(false);
  }
};
```

**Course Context Integration:**
- Conversation already linked to `courseId` during creation
- LLM backend will use `courseId` to fetch course materials
- No changes needed to course selector UI

---

#### Point 6: Post as Thread Integration (Lines 419-453)

**Current Code:**
```typescript
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

const handlePostAsThread = async () => {
  const targetCourseId = activeCourseId || currentCourseId;
  if (!targetCourseId || !user || messages.length <= 1) return;

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

    setPostedThreadId(result.thread.id);
    setShowPostSuccess(true);
  } catch (error) {
    console.error("Failed to post thread:", error);
    alert("Failed to post conversation. Please try again.");
  } finally {
    setIsPostingThread(false);
  }
};
```

**Required Changes:**
```typescript
// REPLACE manual formatting with native hook
const convertToThreadMutation = useConvertConversationToThread();

const handlePostAsThread = async () => {
  const targetCourseId = activeCourseId || currentCourseId;
  if (!targetCourseId || !user || !modalConversationId) return;

  setIsPostingThread(true);
  try {
    const result = await convertToThreadMutation.mutateAsync({
      conversationId: modalConversationId,
      userId: user.id,
      courseId: targetCourseId,
    });

    // Success: Thread created with preserved conversation
    setPostedThreadId(result.thread.id);
    setShowPostSuccess(true);
  } catch (error) {
    console.error("Failed to convert conversation:", error);
    alert("Failed to post conversation. Please try again.");
  } finally {
    setIsPostingThread(false);
  }
};
```

**Benefits:**
- ✅ Preserves exact conversation format
- ✅ Links conversation to thread (bi-directional)
- ✅ Maintains AI answer integrity
- ✅ Reduces code complexity

---

## Message Type Alignment

### Current Message Interface (Both Components)

```typescript
// app/quokka/page.tsx (Line 13-18)
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601 timestamp
}
```

### Backend AIMessage Interface

```typescript
// lib/models/types.ts (Line 1771-1792)
export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  materialReferences?: MaterialReference[];
  confidenceScore?: number;
}
```

### Compatibility Analysis

✅ **Fully Compatible** - All required fields match:
- `id`: string
- `role`: "user" | "assistant"
- `content`: string
- `timestamp`: string (ISO 8601)

✅ **Additional Backend Fields (Optional):**
- `conversationId`: Required by backend, handled by hooks
- `materialReferences`: Optional, displayed if present
- `confidenceScore`: Optional, displayed if present

### Component Display Updates

**No breaking changes required** - Components can display `AIMessage` as-is:

```typescript
// Existing display logic works unchanged
{messages.map((message) => (
  <div key={message.id} className={message.role === "user" ? "message-user" : "message-assistant"}>
    <p>{message.content}</p>
    <p className="text-xs">{new Date(message.timestamp).toLocaleTimeString()}</p>

    {/* NEW: Display material references if present */}
    {message.materialReferences && message.materialReferences.length > 0 && (
      <div className="mt-2 text-xs text-muted-foreground">
        <strong>Sources:</strong>
        {message.materialReferences.map((ref) => (
          <div key={ref.materialId}>{ref.title} ({ref.type})</div>
        ))}
      </div>
    )}
  </div>
))}
```

---

## State Management Strategy

### Option A: Single Active Conversation (RECOMMENDED)

**Quokka Page:**
- Maintain one active conversation per user session
- Load most recent conversation on mount
- Create new conversation if none exists
- Persist `activeConversationId` in localStorage (optional)

**Modal:**
- Create new conversation per modal open
- Persist conversation beyond modal close
- Allow user to access conversation history

**Pros:**
- ✅ Simple mental model
- ✅ Clear conversation boundaries
- ✅ Easy to implement
- ✅ Matches existing UX

**Cons:**
- ❌ No conversation history sidebar (Phase 2 feature)

---

### Option B: Conversation History Sidebar (FUTURE)

**Deferred to Phase 2** - Out of scope for initial integration

**Features:**
- List of past conversations
- Delete/rename actions
- Switch between conversations
- Search conversations

---

## Performance Considerations

### Optimistic Updates

Both hooks (`useSendMessage`, `useCreateConversation`) implement optimistic updates:

```typescript
// From lib/api/hooks.ts (Line 916-939)
onMutate: async (input) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey });

  // Get current cached data
  const previousMessages = queryClient.getQueryData(queryKey);

  // Optimistically add user message
  queryClient.setQueryData(queryKey, (old: AIMessage[] | undefined) => {
    const optimisticUserMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      conversationId: input.conversationId,
      role: 'user',
      content: input.content,
      timestamp: new Date().toISOString(),
    };
    return old ? [...old, optimisticUserMessage] : [optimisticUserMessage];
  });

  return { previousMessages, conversationId: input.conversationId };
},
```

**Result:** User messages appear instantly, AI responses appear after LLM latency (~2-3s)

---

### Polling Strategy

`useConversationMessages` polls every 5 seconds:

```typescript
// lib/api/hooks.ts (Line 864-872)
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId ? queryKeys.conversationMessages(conversationId) : ["conversationMessages"],
    queryFn: () => (conversationId ? api.getConversationMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 30 * 1000,         // 30 seconds
    gcTime: 5 * 60 * 1000,        // 5 minutes
    refetchInterval: 5 * 1000,    // Poll every 5 seconds
  });
}
```

**Optimization Opportunity:**
- ❌ Disable polling for `/quokka/page.tsx` (single-user, no concurrent edits)
- ✅ Keep polling for modal (potential concurrent access)

**Implementation:**
```typescript
// Disable polling for Quokka page
const { data: messages = [] } = useConversationMessages(activeConversationId || undefined, {
  refetchInterval: false, // Override polling
});
```

---

## Error Handling Patterns

### Mutation Error Rollback

All mutations auto-rollback on error:

```typescript
// lib/api/hooks.ts (Line 941-949)
onError: (err, variables, context) => {
  if (context?.previousMessages && context?.conversationId) {
    queryClient.setQueryData(
      queryKeys.conversationMessages(context.conversationId),
      context.previousMessages
    );
  }
},
```

**Component Handling:**
```typescript
try {
  await sendMessageMutation.mutateAsync({ ... });
} catch (error) {
  console.error("Failed to send message:", error);
  alert("Failed to send message. Please try again.");
  // Automatic rollback already happened
}
```

---

## Import Changes Required

### Quokka Page (`app/quokka/page.tsx`)

**Add Imports:**
```typescript
import { useAIConversations, useConversationMessages, useCreateConversation, useSendMessage } from "@/lib/api/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIMessage } from "@/lib/models/types";
```

**Remove:**
```typescript
// Remove local Message interface (line 13-18)
// Use AIMessage from types instead
```

---

### Quokka Assistant Modal (`components/ai/quokka-assistant-modal.tsx`)

**Add Imports:**
```typescript
import { useAIConversations, useConversationMessages, useCreateConversation, useSendMessage, useConvertConversationToThread } from "@/lib/api/hooks";
import type { AIMessage } from "@/lib/models/types";
```

**Update Existing:**
```typescript
// Line 22: Update import
import type { Message, Citation, CourseSummary, AIMessage } from "@/lib/models/types";
```

---

## Lifecycle Diagrams

### Quokka Page Flow

```
User visits /quokka
    ↓
Check user.id → Fetch conversations (useAIConversations)
    ↓
  Has conversations?
    ├── Yes → Load most recent conversation
    │         ↓
    │     Fetch messages (useConversationMessages)
    │         ↓
    │     Display chat with history
    │
    └── No → Show empty chat
              ↓
          User sends first message
              ↓
          Create conversation (useCreateConversation)
              ↓
          Send message (useSendMessage)
              ↓
          Display chat with new message
```

### Modal Flow

```
User opens modal
    ↓
Create new conversation (useCreateConversation)
  Input: { userId, courseId: activeCourseId }
    ↓
Store modalConversationId
    ↓
User sends messages
    ↓
useSendMessage({ conversationId: modalConversationId })
    ↓
  User clicks "Post as Thread"
    ↓
useConvertConversationToThread({
  conversationId: modalConversationId,
  courseId: targetCourseId
})
    ↓
Navigate to thread
```

---

## Risk Assessment

### Risk 1: Conversation ID Management

**Problem:** Losing track of active conversation ID causes data loss

**Mitigation:**
- Store `activeConversationId` in component state
- Optionally persist to localStorage
- Add null checks before mutations
- Show error if conversation ID missing

---

### Risk 2: Message Sync Delays

**Problem:** Polling delay causes perceived lag

**Mitigation:**
- Optimistic updates for user messages (already implemented)
- Show "thinking" state during AI response
- Consider disabling polling for single-user scenarios
- Add manual refresh button if needed

---

### Risk 3: Type Mismatches

**Problem:** `Message` vs `AIMessage` type confusion

**Mitigation:**
- Remove local `Message` interface from Quokka page
- Use `AIMessage` throughout
- TypeScript will catch mismatches at compile time

---

### Risk 4: Modal Conversation Accumulation

**Problem:** Creating new conversation on every modal open

**Mitigation:**
- Option A: Keep conversation across modal sessions (recommended)
- Option B: Add "New Conversation" button in modal
- Option C: Reuse conversation if opened within 5 minutes

---

## Testing Checklist

### Quokka Page
- [ ] Load existing conversation on mount
- [ ] Create new conversation on first message
- [ ] Messages persist across page refresh
- [ ] Optimistic updates work correctly
- [ ] AI responses appear after LLM call
- [ ] Course selector changes context
- [ ] Error handling shows user-friendly messages

### Modal
- [ ] New conversation created on modal open
- [ ] Messages persist across modal close/open
- [ ] Course detection works correctly
- [ ] Manual course selection overrides detection
- [ ] Post to thread conversion preserves messages
- [ ] Error rollback works correctly
- [ ] Thread link navigation works

---

## Next Steps

See `plans/component-refactor.md` for detailed implementation plan with exact code changes, line numbers, and step-by-step instructions.

---

**Analysis Complete**

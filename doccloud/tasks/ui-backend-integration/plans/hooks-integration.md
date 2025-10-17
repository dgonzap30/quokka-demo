# React Query Hooks Integration Plan

**Created:** 2025-10-17
**Agent:** React Query Strategist
**Task:** Define hook integration strategy with optimistic updates and cache invalidation

---

## Overview

This plan provides **detailed integration patterns** for using conversation hooks in `/quokka/page.tsx` and `quokka-assistant-modal.tsx`. It builds on the component refactor plan and addresses React Query-specific concerns identified in research.

---

## Data Flow Architecture

### High-Level Flow

```
User Input
    ↓
Component State (form input)
    ↓
Mutation Hook (useSendMessage)
    ↓
Optimistic Update (user message appears immediately)
    ↓
API Call (generateAIResponseWithMaterials)
    ↓
Cache Invalidation (messages + conversations)
    ↓
Refetch (React Query auto-fetches)
    ↓
UI Update (AI response appears)
```

### Error Flow

```
API Error
    ↓
Optimistic Rollback (remove temp message)
    ↓
Error Notification (alert)
    ↓
User Retry (can try again)
```

---

## Hook Usage Patterns by Component

### Pattern 1: Quokka Page (Single Active Conversation)

**Objective:** Load most recent conversation on mount, create new conversation on first message

**Hook Stack:**
1. `useCurrentUser()` - Get current user
2. `useUserCourses()` - Get enrolled courses for selector
3. `useAIConversations()` - Get all conversations (for auto-load)
4. `useConversationMessages()` - Get messages for active conversation
5. `useCreateConversation()` - Create conversation on first message
6. `useSendMessage()` - Send message + get AI response

**State Management:**
```typescript
const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
```

**Lifecycle:**
1. **Mount:** Load user, courses, conversations
2. **Auto-Select:** If conversations exist, load most recent (`conversations[0]`)
3. **First Message:** If no activeConversationId, create conversation first
4. **Subsequent Messages:** Use existing conversation

---

### Pattern 2: Quokka Assistant Modal (Per-Session Conversation)

**Objective:** Create new conversation on modal open, persist across close/re-open

**Hook Stack:**
1. `useCurrentUser()` - Get current user
2. `useConversationMessages()` - Get messages for modal conversation
3. `useCreateConversation()` - Create conversation on modal open
4. `useSendMessage()` - Send message + get AI response
5. `useConvertConversationToThread()` - Post conversation to thread

**State Management:**
```typescript
const [modalConversationId, setModalConversationId] = useState<string | null>(null);
```

**Lifecycle:**
1. **Modal Open:** Create new conversation if none exists
2. **Messages:** Use existing modal conversation
3. **Modal Close:** Keep conversation ID (preserve for re-open)
4. **Clear:** Create new conversation (replaces old one)

---

## Optimistic Update Strategy

### useSendMessage (Already Implemented)

**Current Pattern (Lines 916-970):**

```typescript
onMutate: async (input) => {
  // 1. Cancel outgoing refetches (prevent race conditions)
  await queryClient.cancelQueries({ queryKey });

  // 2. Snapshot current state for rollback
  const previousMessages = queryClient.getQueryData(queryKey);

  // 3. Optimistically add user message
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

onError: (err, variables, context) => {
  // Rollback on failure
  if (context?.previousMessages && context?.conversationId) {
    queryClient.setQueryData(
      queryKeys.conversationMessages(context.conversationId),
      context.previousMessages
    );
  }
},

onSuccess: (result, variables, context) => {
  // Invalidate to refetch with real IDs + AI response
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversationMessages(context.conversationId)
  });
},
```

**Why This Pattern Works:**
1. **Instant Feedback:** User sees their message immediately (no loading delay)
2. **Rollback Safety:** If API fails, message disappears (user knows to retry)
3. **Server Truth:** On success, invalidation fetches real IDs + AI response
4. **Race Condition Prevention:** `cancelQueries()` prevents mid-flight requests from overwriting

**Component Integration:**
- Component calls `sendMessageMutation.mutate()`
- Component sets `isThinking` to true
- Optimistic update shows user message instantly
- After 2-3 seconds, AI response appears
- Component sets `isThinking` to false

---

### useCreateConversation (No Optimistic Update)

**Current Pattern (Lines 884-896):**

```typescript
onSuccess: (newConversation) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.aiConversations(newConversation.userId)
  });
},
```

**Why No Optimistic Update:**
- Conversation creation is not instant-feedback critical (happens before first message)
- User doesn't see conversations list during creation
- Simpler implementation without pre-population

**Recommendation:** Keep as-is (no optimistic update needed)

---

### useDeleteConversation (Already Implemented)

**Current Pattern (Lines 990-1005):**

```typescript
onMutate: async ({ conversationId, userId }) => {
  await queryClient.cancelQueries({ queryKey });
  const previousConversations = queryClient.getQueryData(queryKey);

  // Optimistically remove conversation
  queryClient.setQueryData(queryKey, (old: AIConversation[] | undefined) => {
    return old ? old.filter((conv) => conv.id !== conversationId) : [];
  });

  return { previousConversations, userId };
},

onError: (err, variables, context) => {
  // Rollback on failure
  if (context?.previousConversations && context?.userId) {
    queryClient.setQueryData(
      queryKeys.aiConversations(context.userId),
      context.previousConversations
    );
  }
},
```

**Why This Pattern Works:**
- Conversation disappears immediately from list (instant feedback)
- Rollback restores conversation if delete fails
- User doesn't need to wait for server confirmation

---

## Cache Invalidation Strategy

### Principle: Surgical Invalidation

**Rule:** Only invalidate queries that are **directly affected** by the mutation.

**Bad Example (Too Broad):**
```typescript
// ❌ Invalidates ALL conversations for ALL users
queryClient.invalidateQueries({ queryKey: ["aiConversations"] });
```

**Good Example (Surgical):**
```typescript
// ✅ Invalidates only specific user's conversations
queryClient.invalidateQueries({ queryKey: queryKeys.aiConversations(userId) });
```

---

### Invalidation Matrix

| Mutation | Invalidate | Reason |
|----------|-----------|--------|
| `useCreateConversation` | `aiConversations(userId)` | New conversation added to list |
| `useSendMessage` | `conversationMessages(conversationId)` | New messages added |
|  | `aiConversations(userId)` | Conversation timestamp updated |
| `useDeleteConversation` | `aiConversations(userId)` | Conversation removed from list |
| `useConvertConversationToThread` | `courseThreads(courseId)` | New thread created |
|  | `aiConversations(userId)` | Conversation marked as converted |
|  | `studentDashboard(userId)` | Activity feed updated |

**Key Insight:** Always include user/course/conversation ID in invalidation (never invalidate globally)

---

### Current Issues & Fixes

#### Issue 1: useSendMessage Invalidates ALL Conversations (Line 967)

**Problem:**
```typescript
queryClient.invalidateQueries({
  queryKey: ["aiConversations"] // ❌ Too broad
});
```

**Impact:**
- Refetches conversations for ALL users (not just current user)
- Wasted network requests
- Potential cache thrashing in multi-user scenarios

**Fix:**
```typescript
// Pass userId in mutation input
mutationFn: (input: SendMessageInput & { userId: string }) => api.sendMessage(input),

onSuccess: (result, variables, context) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversationMessages(context.conversationId)
  });

  // ✅ Surgical invalidation with userId
  queryClient.invalidateQueries({
    queryKey: queryKeys.aiConversations(variables.userId)
  });
},
```

**Implementation Location:** `lib/api/hooks.ts:909-971`

---

#### Issue 2: useConvertConversationToThread Invalidates ALL Dashboards (Line 1059-1060)

**Problem:**
```typescript
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
```

**Impact:**
- Refetches dashboards for ALL users (not just current user)
- Wasted network requests

**Fix:**
```typescript
onSuccess: (result, variables) => {
  // ... existing invalidations ...

  // ✅ Surgical invalidation with userId
  queryClient.invalidateQueries({
    queryKey: queryKeys.studentDashboard(variables.userId)
  });

  // Only invalidate instructor dashboard if user is instructor
  // (requires role check or omit entirely)
},
```

**Implementation Location:** `lib/api/hooks.ts:1039-1072`

---

## Loading State Management

### Pattern: Component-Controlled Loading

**Principle:** Component owns `isThinking` state, React Query provides data state

**Why:**
- React Query's `isPending` resets immediately after mutation completes
- We need "thinking" state to persist until AI response appears in UI
- Better control over UX timing

**Implementation:**

```typescript
const [isThinking, setIsThinking] = useState(false);
const sendMessageMutation = useSendMessage();

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isThinking) return;

  setIsThinking(true); // ← Component controls loading state

  try {
    await sendMessageMutation.mutateAsync({
      conversationId: activeConversationId!,
      content: input.trim(),
      role: "user",
      userId: user!.id, // ← Pass userId for surgical invalidation
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setIsThinking(false); // ← Component controls loading state
  }
};
```

**Why `mutateAsync` Over `mutate`:**
- `mutateAsync` returns a Promise (can use async/await)
- `mutate` doesn't wait for completion (harder to control loading state)
- `mutateAsync` enables try/catch error handling

---

## Error Handling and Rollback

### Pattern: Alert + Retry

**Principle:** Show user-facing error, preserve ability to retry

**Implementation:**

```typescript
try {
  await sendMessageMutation.mutateAsync({ ... });
} catch (error) {
  console.error("Failed to send message:", error);
  alert("Failed to send message. Please try again.");
}
```

**Why Alert Over Toast:**
- Simpler implementation (no toast library dependency)
- Blocks user until acknowledged (prevents confusion)
- Acceptable for MVP (can upgrade to toast later)

**Rollback Behavior:**
- Optimistic user message is removed automatically (via `onError` rollback)
- User input is cleared (via `setInput("")`)
- User can re-type and retry immediately

---

## Polling Strategy

### Current Issue: Aggressive Polling

**Problem (Line 872):**
```typescript
refetchInterval: 5 * 1000,    // Poll every 5 seconds
```

**Impact:**
- 12 fetches per minute per conversation
- Battery drain on mobile
- Redundant with 30-second staleTime (6 redundant fetches)
- Conflicts with invalidation-based updates

**Recommendation: Remove Polling**

**Rationale:**
1. **Invalidation is Sufficient:** `useSendMessage` already invalidates messages on success
2. **User-Initiated Updates:** All updates are triggered by user actions (no external changes)
3. **Better Performance:** Eliminates 12 requests/minute
4. **Simpler Mental Model:** Data updates when user acts, not on timer

**Implementation:**

```typescript
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId ? queryKeys.conversationMessages(conversationId) : ["conversationMessages"],
    queryFn: () => (conversationId ? api.getConversationMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,  // 2 minutes (increased from 30s)
    gcTime: 5 * 60 * 1000,     // 5 minutes (unchanged)
    // ❌ REMOVE: refetchInterval: 5 * 1000,
  });
}
```

**Alternative (If Polling Required):**
- Increase to 60 seconds: `refetchInterval: 60 * 1000`
- Match staleTime: `staleTime: 60 * 1000`
- **Only use if** real-time updates from other users are needed (not applicable for this app)

---

## Component Integration Checklist

### Quokka Page (`/quokka/page.tsx`)

#### Step 1: Setup Hooks (Lines 124-152)

```typescript
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
const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(
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

**Key Points:**
- Default to empty array for conversations/messages (prevents undefined errors)
- Use optional chaining for `activeConversationId || undefined` (React Query requires undefined, not null)
- Separate `isThinking` from mutation state (component-controlled)

---

#### Step 2: Auto-Load Most Recent Conversation (Lines 169-181)

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

**Why:**
- Seamless UX (no empty state on first load)
- Preserves course context from previous session
- Runs only once (`activeConversationId` prevents re-runs)

---

#### Step 3: Handle Course Selection (Lines 252-271)

```typescript
// ============================================
// Handle Course Selection
// ============================================
const handleCourseSelect = async (courseId: string) => {
  const newCourseId = courseId === "" ? null : courseId;
  setSelectedCourseId(newCourseId);

  // If course changes and conversation is active, create new conversation with new context
  if (activeConversationId && messages.length > 1) {
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
```

**Why:**
- Switching course creates new conversation (clear separation of contexts)
- Only creates new conversation if messages exist (avoids empty conversations)

---

#### Step 4: Handle Message Submission (Lines 276-318)

```typescript
// ============================================
// Handle Message Submission
// ============================================
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isThinking || !user) return;

  const content = input.trim();
  setInput(""); // Clear input immediately

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
      userId: user.id, // ← NEW: Pass userId for surgical invalidation
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setIsThinking(false);
  }
};
```

**Key Points:**
- Clear input immediately (responsive UX)
- Create conversation on first message (lazy initialization)
- Pass userId for surgical invalidation (fix for broad invalidation issue)
- Use `mutateAsync` for sequential flow control

---

### Quokka Assistant Modal (`quokka-assistant-modal.tsx`)

#### Step 1: Setup Hooks (Lines 635-658)

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

**Key Points:**
- `modalConversationId` is separate from page conversation (different lifecycle)
- Messages loaded only when `modalConversationId` exists

---

#### Step 2: Create Conversation on Modal Open (Lines 763-796)

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
```

**Why:**
- Creates conversation on modal open (fresh conversation per session)
- Uses `.mutate()` with inline callbacks (fire-and-forget pattern)
- Only creates if `modalConversationId` is null (prevents duplicates)

---

#### Step 3: Handle Message Submission (Lines 845-866)

```typescript
// ============================================
// Handle Message Submission
// ============================================
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isThinking || !modalConversationId || !user) return;

  const content = input.trim();
  setInput("");
  setIsThinking(true);

  try {
    await sendMessageMutation.mutateAsync({
      conversationId: modalConversationId,
      content,
      role: "user",
      userId: user.id, // ← NEW: Pass userId for surgical invalidation
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message. Please try again.");
  } finally {
    setIsThinking(false);
  }
};
```

**Key Points:**
- Guard clause requires `modalConversationId` (prevents sending before creation)
- Pass `userId` for surgical invalidation

---

#### Step 4: Handle Clear Conversation (Lines 899-916)

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

**Why:**
- Creates new conversation instead of deleting (preserves old conversation in history)
- User can access old conversation from conversations list later

---

#### Step 5: Handle Post to Thread (Lines 997-1025)

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

**Key Points:**
- Requires minimum 2 messages (user + AI response)
- Shows confirmation dialog on dashboard (prevents accidental posts)
- Uses native `useConvertConversationToThread` hook (preserves conversation integrity)

---

## Performance Optimization Checklist

### Before Optimization

- [ ] Fix broad invalidation in `useSendMessage` (pass userId)
- [ ] Fix broad invalidation in `useConvertConversationToThread` (surgical dashboards)
- [ ] Remove polling from `useConversationMessages` (rely on invalidations)

### After Optimization

- [ ] Measure cache hit ratio (DevTools React Query panel)
- [ ] Verify no unnecessary refetches (Network tab)
- [ ] Confirm optimistic updates feel instant (< 50ms)
- [ ] Test error rollback works correctly (disconnect network)

---

## Testing Checklist

### Optimistic Updates

- [ ] User message appears instantly (< 50ms)
- [ ] User message has temporary ID (`temp-${timestamp}`)
- [ ] AI response replaces temporary ID with real ID
- [ ] Error removes optimistic message (rollback works)

### Cache Invalidation

- [ ] Sending message refetches only active conversation messages
- [ ] Sending message refetches only current user's conversations list
- [ ] Creating conversation refetches only current user's conversations list
- [ ] Converting to thread refetches only target course threads
- [ ] No global invalidations (`["aiConversations"]` or `["dashboards"]`)

### Loading States

- [ ] `isThinking` shows during message send
- [ ] `isThinking` shows during AI response generation
- [ ] `isThinking` hides after AI response appears
- [ ] Loading indicators visible throughout flow

### Error Handling

- [ ] Network error shows alert
- [ ] Optimistic update rolls back on error
- [ ] User can retry after error
- [ ] No console errors

---

## Migration Path

### Phase 1: Fix High-Priority Issues (1 hour)

1. **Fix useSendMessage broad invalidation:**
   - Edit `lib/api/hooks.ts:909-971`
   - Add `userId` to `SendMessageInput` type
   - Change line 967 from `["aiConversations"]` to `queryKeys.aiConversations(variables.userId)`

2. **Fix useConvertConversationToThread broad invalidation:**
   - Edit `lib/api/hooks.ts:1039-1072`
   - Change lines 1059-1060 to use `queryKeys.studentDashboard(variables.userId)`

3. **Remove polling from useConversationMessages:**
   - Edit `lib/api/hooks.ts:864-873`
   - Remove `refetchInterval: 5 * 1000` (line 872)
   - Increase `staleTime` to `2 * 60 * 1000` (2 minutes)

4. **Update SendMessageInput type:**
   - Edit `lib/models/types.ts:1823-1840`
   - Add `userId?: string` field

### Phase 2: Integrate Quokka Page (2-3 hours)

1. **Follow component-refactor.md steps 1.1-1.10**
2. **Pass userId in handleSubmit:**
   - Add `userId: user.id` to `sendMessageMutation.mutateAsync()`

### Phase 3: Integrate Quokka Assistant Modal (2-3 hours)

1. **Follow component-refactor.md steps 2.1-2.15**
2. **Pass userId in handleSubmit:**
   - Add `userId: user.id` to `sendMessageMutation.mutateAsync()`

### Phase 4: Test & Verify (1-2 hours)

1. **Run all tests from Testing Checklist**
2. **Verify performance improvements (Network tab)**
3. **Commit changes**

**Total Estimated Time:** 6-9 hours

---

## Rollback Plan

If critical issues arise:

1. **Revert hook changes:**
   ```bash
   git checkout HEAD -- lib/api/hooks.ts
   ```

2. **Keep component changes:**
   - Components still work with old hooks (no breaking changes)

3. **Identify issue:**
   - Check React Query DevTools
   - Check Network tab
   - Check console errors

4. **Fix and re-deploy**

---

## Decision Summary

### Key Decisions

1. **Remove Polling:** Rely on invalidations instead of 5-second polling
   - **Rationale:** Simpler, more performant, invalidations are sufficient
   - **Trade-off:** No real-time updates (acceptable for this app)

2. **Surgical Invalidation:** Always include user/course/conversation ID
   - **Rationale:** Prevents unnecessary refetches, better performance
   - **Trade-off:** Requires passing extra data (minimal)

3. **Optimistic Updates:** Keep existing patterns in `useSendMessage` and `useDeleteConversation`
   - **Rationale:** Instant feedback, proven pattern, safe rollback
   - **Trade-off:** Slightly more complex code (worth it for UX)

4. **Component-Controlled Loading:** Use `isThinking` state instead of React Query's `isPending`
   - **Rationale:** Better control over UX timing
   - **Trade-off:** Extra state management (minimal)

5. **mutateAsync Over mutate:** Use async/await for sequential flow control
   - **Rationale:** Easier to read, better error handling, synchronous flow
   - **Trade-off:** Slightly more verbose (worth it for clarity)

---

## Next Steps for Parent

1. **Review this plan** - Approve or request changes
2. **Implement Phase 1** - Fix high-priority hook issues
3. **Implement Phase 2** - Integrate Quokka page
4. **Implement Phase 3** - Integrate modal
5. **Run tests** - Verify all checklist items
6. **Commit changes** - With Conventional Commit message

---

**Plan Complete - Ready for Implementation**

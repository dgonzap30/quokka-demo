# React Query Patterns Analysis

**Created:** 2025-10-17
**Agent:** React Query Strategist
**Task:** Analyze existing React Query implementation for conversation hooks

---

## Overview

This document analyzes the existing React Query implementation in `lib/api/hooks.ts` with focus on conversation-related hooks (`useAIConversations`, `useConversationMessages`, `useCreateConversation`, `useSendMessage`, `useDeleteConversation`, `useConvertConversationToThread`).

---

## Query Key Architecture

### Current Structure (Lines 28-55)

```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
  // ... other keys ...
  aiConversations: (userId: string) => ["aiConversations", userId] as const,
  conversationMessages: (conversationId: string) => ["conversationMessages", conversationId] as const,
};
```

**Analysis:**
- **✅ Hierarchical:** Query keys follow a consistent pattern with entity type + identifier
- **✅ Type-Safe:** Uses `as const` for proper TypeScript inference
- **✅ Parameterized:** Keys include relevant identifiers (userId, conversationId)
- **✅ Isolated:** Each conversation has its own cache entry (no cross-contamination)
- **✅ Predictable:** Easy to manually invalidate or update specific queries

**Pattern Grade:** A+ (Excellent structure, no changes needed)

---

## Query Hooks

### useAIConversations (Lines 847-855)

```typescript
export function useAIConversations(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.aiConversations(userId) : ["aiConversations"],
    queryFn: () => (userId ? api.getAIConversations(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });
}
```

**Analysis:**
- **✅ Guard Clause:** `enabled: !!userId` prevents execution without userId
- **✅ Fallback:** Returns empty array if userId is undefined
- **⚠️ Stale Time:** 1 minute - reasonable for conversation list (conversations update frequently)
- **✅ GC Time:** 5 minutes - appropriate for keeping list in cache
- **✅ No Polling:** Conversations list doesn't auto-refetch (user-initiated only)

**Optimization Opportunity:** Consider increasing staleTime to 2-3 minutes if conversations don't update that frequently.

---

### useConversationMessages (Lines 864-873)

```typescript
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

**Analysis:**
- **✅ Guard Clause:** `enabled: !!conversationId` prevents execution without ID
- **✅ Fallback:** Returns empty array if conversationId is undefined
- **⚠️ Stale Time:** 30 seconds with 5-second polling creates redundant refetches
- **✅ GC Time:** 5 minutes - good for keeping messages cached
- **⚠️ Polling:** 5-second interval is aggressive for a non-real-time app

**Optimization Opportunity:**
- **Option A:** Remove polling (`refetchInterval`), rely on invalidations (recommended for this app)
- **Option B:** If polling is needed, increase to 30-60 seconds and match staleTime
- **Reasoning:** Current setup refetches every 5 seconds but marks data stale after 30 seconds, causing 6 redundant fetches per stale period

---

## Mutation Hooks

### useCreateConversation (Lines 884-896)

```typescript
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput) => api.createConversation(input),
    onSuccess: (newConversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiConversations(newConversation.userId)
      });
    },
  });
}
```

**Analysis:**
- **✅ Surgical Invalidation:** Only invalidates conversations list for specific user
- **✅ No Optimistic Update:** Appropriate for conversation creation (not instant-feedback critical)
- **✅ Simple:** Minimal logic, easy to understand
- **❌ Missing:** Could pre-populate conversation in cache (optimization opportunity)

**Optimization Opportunity:**
- Pre-populate new conversation in cache with `queryClient.setQueryData()` to avoid refetch
- Example: `queryClient.setQueryData(queryKeys.aiConversations(userId), (old) => [...old, newConversation])`

---

### useSendMessage (Lines 909-971)

```typescript
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => api.sendMessage(input),

    // Optimistic update: add user message immediately
    onMutate: async (input) => {
      const queryKey = queryKeys.conversationMessages(input.conversationId);

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

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousMessages && context?.conversationId) {
        queryClient.setQueryData(
          queryKeys.conversationMessages(context.conversationId),
          context.previousMessages
        );
      }
    },

    // On success: replace temp message with real messages
    onSuccess: (result, variables, context) => {
      if (!context?.conversationId) return;

      // Invalidate messages to refetch with real IDs and AI response
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(context.conversationId)
      });

      // Invalidate conversations list (to update timestamp)
      const conversation = queryClient.getQueryData<AIConversation[]>(
        queryKeys.aiConversations(result.userMessage.conversationId)
      );
      if (conversation) {
        queryClient.invalidateQueries({
          queryKey: ["aiConversations"]
        });
      }
    },
  });
}
```

**Analysis:**
- **✅ Optimistic Update:** User message appears immediately (great UX)
- **✅ Rollback:** Restores previous state on error (safe)
- **✅ Cancel Queries:** Prevents race conditions with `cancelQueries()`
- **✅ Context Passing:** Uses mutation context for rollback data
- **⚠️ Invalidation Scope:** `invalidateQueries({ queryKey: ["aiConversations"] })` is too broad (line 967)

**Issues:**
1. **Overly Broad Invalidation (Line 967):**
   ```typescript
   queryClient.invalidateQueries({
     queryKey: ["aiConversations"]
   });
   ```
   - **Problem:** Invalidates ALL conversations queries for ALL users (not surgical)
   - **Impact:** Unnecessary refetches for unrelated users in multi-user scenarios
   - **Fix:** Use specific user ID: `queryKeys.aiConversations(userId)`

2. **Lookup Logic Complexity (Lines 961-968):**
   - **Problem:** Tries to extract userId from cache lookup (fragile pattern)
   - **Impact:** If conversation not in cache, invalidation fails silently
   - **Fix:** Pass userId directly in mutation input

**Optimization Opportunities:**
1. Instead of invalidating messages, directly set cache with `result.userMessage` and `result.aiMessage`
2. Remove polling from `useConversationMessages` (rely on invalidations instead)

---

### useDeleteConversation (Lines 982-1025)

```typescript
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      api.deleteAIConversation(conversationId).then(() => ({ conversationId, userId })),

    // Optimistic update: remove conversation immediately
    onMutate: async ({ conversationId, userId }) => {
      const queryKey = queryKeys.aiConversations(userId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Get current cached data
      const previousConversations = queryClient.getQueryData(queryKey);

      // Optimistically remove conversation
      queryClient.setQueryData(queryKey, (old: AIConversation[] | undefined) => {
        return old ? old.filter((conv) => conv.id !== conversationId) : [];
      });

      return { previousConversations, userId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousConversations && context?.userId) {
        queryClient.setQueryData(
          queryKeys.aiConversations(context.userId),
          context.previousConversations
        );
      }
    },

    // On success: ensure cache consistency
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiConversations(data.userId)
      });
    },
  });
}
```

**Analysis:**
- **✅ Optimistic Update:** Conversation disappears immediately (great UX)
- **✅ Rollback:** Restores previous state on error (safe)
- **✅ Cancel Queries:** Prevents race conditions
- **✅ Surgical Invalidation:** Only invalidates specific user's conversations
- **❌ Redundant Invalidation:** `onSuccess` invalidation is unnecessary (optimistic update already correct)

**Optimization Opportunity:**
- Remove `onSuccess` invalidation (optimistic update already updated cache correctly)
- Only invalidate on error recovery if needed

---

### useConvertConversationToThread (Lines 1039-1072)

```typescript
export function useConvertConversationToThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId, courseId }: { conversationId: string; userId: string; courseId: string }) =>
      api.convertConversationToThread(conversationId, userId, courseId),
    onSuccess: (result, variables) => {
      const { thread, aiAnswer } = result;

      // Invalidate course threads (to show new thread)
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseThreads(thread.courseId)
      });

      // Invalidate conversations (conversation updated with link to thread)
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiConversations(variables.userId)
      });

      // Invalidate dashboards (activity feed needs update)
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

      // OPTIONAL: Pre-populate thread cache with AI answer
      if (aiAnswer) {
        queryClient.setQueryData(queryKeys.thread(thread.id), {
          thread,
          posts: [],
          aiAnswer,
        });
      }
    },
  });
}
```

**Analysis:**
- **✅ Multi-Entity Invalidation:** Correctly invalidates all affected queries
- **✅ Pre-Population:** Pre-populates thread cache (avoids refetch)
- **✅ Surgical Invalidation:** Targets specific user's conversations
- **⚠️ Broad Invalidation:** Invalidates ALL dashboards (could be more surgical)

**Optimization Opportunity:**
- Invalidate only user-specific dashboards: `queryKeys.studentDashboard(userId)`

---

## Invalidation Patterns

### Current Patterns Summary

| Mutation | Invalidates | Scope | Grade |
|----------|------------|-------|-------|
| `useCreateConversation` | `aiConversations(userId)` | ✅ Surgical | A+ |
| `useSendMessage` | `conversationMessages(id)`, `aiConversations` | ⚠️ Too broad | B |
| `useDeleteConversation` | `aiConversations(userId)` | ✅ Surgical | A+ |
| `useConvertConversationToThread` | `courseThreads`, `aiConversations`, `dashboards` | ⚠️ Mixed | B+ |

**Key Issues:**
1. `useSendMessage` invalidates ALL conversations (should be user-specific)
2. `useConvertConversationToThread` invalidates ALL dashboards (should be user-specific)

---

## Optimistic Updates

### Current Implementation

| Mutation | Optimistic Update | Rollback | Grade |
|----------|------------------|----------|-------|
| `useCreateConversation` | ❌ No | N/A | B (could add) |
| `useSendMessage` | ✅ Yes (user message) | ✅ Yes | A+ |
| `useDeleteConversation` | ✅ Yes (remove conversation) | ✅ Yes | A+ |
| `useConvertConversationToThread` | ❌ No | N/A | B (acceptable) |

**Best Practices Observed:**
1. **Cancel Queries:** Always `cancelQueries()` before optimistic update (prevents race conditions)
2. **Context Passing:** Use mutation context to store rollback data
3. **Type Safety:** Proper TypeScript types for cache updates
4. **Fallback Handling:** Default to empty array if cache is undefined

**Recommendation:**
- Add optimistic update to `useCreateConversation` (instant feedback)
- Keep `useConvertConversationToThread` without optimistic update (complexity vs. benefit)

---

## Polling Strategy

### Current Implementation

Only `useConversationMessages` uses polling:
```typescript
refetchInterval: 5 * 1000,    // Poll every 5 seconds
```

**Analysis:**
- **❌ Aggressive:** 5-second interval is excessive for non-real-time app
- **❌ Redundant:** Conflicts with 30-second staleTime (6 redundant fetches)
- **❌ Battery Drain:** Constant polling on mobile devices

**Recommendation:**
- **Option A (Recommended):** Remove polling, rely on invalidations
  - User sends message → `useSendMessage` invalidates → messages refetch automatically
  - Simpler, more predictable, better performance
- **Option B:** If polling is required, increase to 30-60 seconds and match staleTime

---

## Performance Considerations

### Cache Hit Ratio

**Strengths:**
- Surgical query keys enable precise cache targeting
- Optimistic updates reduce perceived latency
- Pre-population in `useConvertConversationToThread` avoids refetch

**Weaknesses:**
- Broad invalidations (`["aiConversations"]`, `["dashboards"]`) cause unnecessary refetches
- 5-second polling creates 12 fetches/minute per conversation

### Memory Usage

**Strengths:**
- Appropriate GC times (5 minutes for most queries)
- Query keys scoped to specific users/conversations (no global pollution)

**Weaknesses:**
- Polling keeps queries "active" indefinitely (prevents garbage collection)

---

## Error Handling

### Current Patterns

**Strengths:**
- Rollback logic in optimistic updates (restores previous state)
- Context-based rollback (type-safe)
- Silent failures with fallback to empty arrays

**Gaps:**
- No user-facing error notifications (mutations fail silently)
- No retry logic (should retry network errors)

**Recommendation:**
- Add `onError` callbacks with user-facing alerts (already in component-refactor.md)
- Configure retry for network errors: `retry: 3`

---

## Code Quality

### Consistency

- **✅ Naming:** All hooks follow `use<Entity><Action>` pattern
- **✅ Structure:** All mutations follow same structure (onMutate → onError → onSuccess)
- **✅ Types:** Proper TypeScript types throughout
- **✅ Documentation:** JSDoc comments for all hooks

### Maintainability

- **✅ Reusable:** Query keys centralized in `queryKeys` object
- **✅ Testable:** Hooks are pure (no side effects outside React Query)
- **✅ Readable:** Clear function names and structure

---

## Recommendations Summary

### High Priority (Fix Now)

1. **Fix Broad Invalidation in useSendMessage (Line 967):**
   ```typescript
   // BEFORE (too broad)
   queryClient.invalidateQueries({
     queryKey: ["aiConversations"]
   });

   // AFTER (surgical)
   queryClient.invalidateQueries({
     queryKey: queryKeys.aiConversations(userId)
   });
   ```

2. **Remove or Adjust Polling in useConversationMessages:**
   ```typescript
   // BEFORE (aggressive)
   refetchInterval: 5 * 1000,

   // AFTER (Option A: Remove)
   // refetchInterval: (removed)

   // AFTER (Option B: Reduce)
   refetchInterval: 60 * 1000, // 1 minute
   staleTime: 60 * 1000,
   ```

3. **Pass userId Directly in useSendMessage:**
   ```typescript
   // BEFORE (fragile)
   const conversation = queryClient.getQueryData<AIConversation[]>(...);

   // AFTER (explicit)
   mutationFn: (input: SendMessageInput & { userId: string }) => ...
   ```

### Medium Priority (Optimize Later)

1. **Add Optimistic Update to useCreateConversation:**
   - Pre-populate conversation in cache (avoid refetch)
   - Immediate feedback for user

2. **Remove Redundant Invalidation in useDeleteConversation:**
   - Remove `onSuccess` invalidation (optimistic update already correct)

3. **Surgical Dashboard Invalidation in useConvertConversationToThread:**
   - Invalidate only user-specific dashboards

### Low Priority (Polish)

1. **Increase staleTime for useAIConversations:**
   - Change from 1 minute to 2-3 minutes (conversations update infrequently)

2. **Add retry logic to mutations:**
   - Configure `retry: 3` for network error resilience

---

## Conclusion

**Overall Grade:** A- (Excellent foundation with minor optimization opportunities)

**Strengths:**
- Surgical query keys enable precise cache control
- Optimistic updates in critical mutations (send message, delete conversation)
- Consistent patterns across all hooks
- Type-safe implementation

**Areas for Improvement:**
- Broad invalidations in 2 mutations (easy fix)
- Aggressive polling creates unnecessary load (remove or reduce)
- Missing optimistic update in conversation creation (optional enhancement)

**Next Steps:**
- Implement high-priority fixes in `plans/hooks-integration.md`
- Define component integration patterns
- Document error handling strategy

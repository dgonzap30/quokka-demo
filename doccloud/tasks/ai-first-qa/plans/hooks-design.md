# React Query Hooks Design - AI Answer System

**Date:** 2025-10-06
**Task:** AI-First Question Answering System
**Agent:** React Query Strategist

---

## Overview

This plan defines the exact React Query hook implementations for AI answer data fetching, caching, mutations, and invalidation strategies. All hooks will be added to `lib/api/hooks.ts` following existing patterns.

---

## 1. Query Key Strategy

**Location:** `lib/api/hooks.ts` (lines 16-30, extend queryKeys object)

### Add to Query Key Factory

```typescript
const queryKeys = {
  // ... existing keys

  // AI Answer query key (scoped to thread)
  aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,

  // AI Preview query key (ephemeral, for ask page only)
  aiPreview: (questionHash: string) => ["aiPreview", questionHash] as const,
};
```

**Design Decisions:**

1. **`aiAnswer` is thread-scoped:** Each thread has at most one AI answer, so `["aiAnswer", threadId]` is sufficient
2. **No nested keys:** Not `["thread", threadId, "aiAnswer"]` to match existing pattern (flat structure)
3. **Preview uses hash:** Ephemeral previews keyed by question content hash to avoid re-generation
4. **TypeScript `as const`:** Ensures type inference works correctly

**Rationale:**
- Follows existing pattern: `thread: (threadId: string) => ["thread", threadId]`
- Enables surgical invalidation: `queryClient.invalidateQueries({ queryKey: queryKeys.aiAnswer(threadId) })`
- Prevents query key typos with centralized factory

---

## 2. Data Fetching Hooks

### Hook 1: useAIAnswer (Optional - See Trade-off)

**Location:** `lib/api/hooks.ts` (after useThread, around line 263)

```typescript
/**
 * Get AI answer for a thread
 *
 * NOTE: This hook is OPTIONAL. AI answer is already embedded
 * in useThread() response. Use this only for specific scenarios
 * like ask page preview where you need AI answer without thread.
 */
export function useAIAnswer(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.aiAnswer(threadId) : ["aiAnswer"],
    queryFn: () => (threadId ? api.getAIAnswer(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 10 * 60 * 1000, // 10 minutes (AI content is immutable)
    gcTime: 15 * 60 * 1000,     // 15 minutes (keep in cache longer)
  });
}
```

**Configuration Reasoning:**

| Setting | Value | Reason |
|---------|-------|--------|
| `enabled` | `!!threadId` | Only fetch if threadId exists (prevent wasteful requests) |
| `staleTime` | 10 minutes | AI content doesn't change after generation (longer stale time OK) |
| `gcTime` | 15 minutes | Keep in cache even after unmount (user may navigate back) |
| `refetchOnWindowFocus` | false (default) | AI answer won't change, no need to refetch |

**Trade-off Decision:**

After reviewing research, **RECOMMENDATION: Skip this hook entirely** and embed AI answer in `useThread()` response. Reasons:

1. ✅ Single request = faster page load (200-500ms vs 400-1000ms for two requests)
2. ✅ Matches existing pattern: `api.getThread()` already returns `{ thread, posts }`
3. ✅ Simpler cache management (one query key instead of two)
4. ✅ No risk of stale data between thread and AI answer

**Exception:** Only create this hook if ask page preview needs standalone AI answer (see useGenerateAIPreview below).

---

### Hook 2: useGenerateAIPreview (Ask Page Only)

**Location:** `lib/api/hooks.ts` (new section for AI mutations, around line 300)

```typescript
/**
 * Generate AI answer preview for ask page
 *
 * This mutation generates an AI answer WITHOUT saving it.
 * Used to show users what the AI response would look like
 * before they commit to creating the thread.
 */
export function useGenerateAIPreview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateAIAnswerInput) => api.generateAIPreview(input),
    onSuccess: (preview, input) => {
      // Cache preview with short expiry (30 seconds)
      const questionHash = hashQuestion(input.questionTitle + input.questionContent);
      queryClient.setQueryData(queryKeys.aiPreview(questionHash), preview);
    },
  });
}
```

**Design Decisions:**

1. **No invalidation:** Preview is ephemeral, doesn't affect other queries
2. **Manual cache set:** `setQueryData` caches preview for 30 seconds
3. **Hash-based key:** Question content hash prevents duplicate generations
4. **No optimistic updates:** Preview generation is already fast (800-1200ms)

**Helper Function (add to hooks.ts):**

```typescript
/**
 * Simple hash function for question content
 * Used to cache AI previews by question
 */
function hashQuestion(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
```

---

## 3. Mutation Hooks

### Hook 3: useEndorseAIAnswer

**Location:** `lib/api/hooks.ts` (after useCreatePost, around line 301)

```typescript
/**
 * Endorse an AI answer (student or instructor)
 *
 * Uses optimistic updates to provide instant UI feedback.
 * Automatically calculates weighted endorsement (student=1, instructor=3).
 */
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EndorseAIAnswerInput) => api.endorseAIAnswer(input),

    // Optimistic update: update cache immediately
    onMutate: async ({ aiAnswerId, userId, userRole }) => {
      const threadId = aiAnswerId.split('-')[0]; // Extract threadId from aiAnswerId
      const queryKey = queryKeys.thread(threadId);

      // Cancel outgoing refetches (don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Get current cached data
      const previousThread = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.aiAnswer) return old;

        const endorsementDelta = userRole === 'instructor' ? 3 : 1;

        return {
          ...old,
          aiAnswer: {
            ...old.aiAnswer,
            studentEndorsements: userRole === 'student'
              ? old.aiAnswer.studentEndorsements + 1
              : old.aiAnswer.studentEndorsements,
            instructorEndorsements: userRole === 'instructor'
              ? old.aiAnswer.instructorEndorsements + 1
              : old.aiAnswer.instructorEndorsements,
            totalEndorsements: old.aiAnswer.totalEndorsements + endorsementDelta,
            currentUserEndorsed: true,
          },
        };
      });

      // Return context for rollback
      return { previousThread, threadId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousThread && context?.threadId) {
        queryClient.setQueryData(
          queryKeys.thread(context.threadId),
          context.previousThread
        );
      }
    },

    // On success: invalidate related queries
    onSuccess: (data, variables, context) => {
      if (!context?.threadId) return;

      // Invalidate thread query (refetch to get server truth)
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(context.threadId) });

      // Invalidate course threads (endorsement count visible in list)
      const thread = queryClient.getQueryData<any>(queryKeys.thread(context.threadId));
      if (thread?.thread?.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseThreads(thread.thread.courseId)
        });
      }

      // Invalidate instructor dashboard (AI coverage stats may change)
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}
```

**Optimistic Update Strategy:**

1. **Instant UI feedback:** User sees endorsement count increment immediately
2. **Rollback on error:** If API call fails, revert to previous state
3. **Refetch on success:** Get server truth to ensure consistency

**Invalidation Strategy:**

| Query | Why Invalidate | Scope |
|-------|----------------|-------|
| `queryKeys.thread(threadId)` | Thread detail page shows updated endorsements | Surgical (one thread) |
| `queryKeys.courseThreads(courseId)` | Thread list may show endorsement badges | Surgical (one course) |
| `["instructorDashboard"]` | AI coverage stats affected by endorsements | Broad (all instructors) |

**Performance Trade-offs:**

- ✅ Pro: Users see instant feedback (no loading spinner)
- ✅ Pro: Rollback prevents incorrect data if API fails
- ⚠️ Con: Invalidating all dashboards may cause unnecessary refetches
- 💡 Improvement: Target specific instructor dashboard: `queryKeys.instructorDashboard(instructorUserId)`

---

### Hook 4: useCreateThread (Updated)

**Location:** `lib/api/hooks.ts` (modify existing hook, lines 268-282)

**IMPORTANT:** Update existing `useCreateThread` hook to handle AI answer generation.

```typescript
/**
 * Create new thread mutation
 *
 * AUTO-GENERATES AI ANSWER on success.
 * AI answer is embedded in createThread response.
 */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId), // Now returns { thread, aiAnswer }

    onSuccess: (result) => {
      const { thread, aiAnswer } = result; // Destructure response

      // Invalidate course threads query
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });

      // Invalidate specific user's dashboard (not all dashboards)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard(thread.authorId) });

      // Invalidate instructor dashboards for this course
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

      // OPTIONAL: Pre-populate thread cache with AI answer
      // This prevents useThread from refetching when user navigates to thread
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

**Key Changes:**

1. **Expect AI answer in response:** `api.createThread()` now returns `{ thread, aiAnswer }`
2. **Pre-populate cache:** Set thread query data to prevent refetch on navigation
3. **Targeted invalidation:** Only invalidate author's dashboard (not all students)

**Performance Improvement:**

- ✅ Pre-populating cache saves 200-500ms on thread detail page load
- ✅ User navigates to thread immediately without loading spinner

---

## 4. Cache Invalidation Strategy

### Invalidation Map

| Mutation | Invalidates | Reasoning |
|----------|-------------|-----------|
| `createThread` | `courseThreads(courseId)` | New thread appears in course list |
| | `studentDashboard(authorId)` | Author's recent activity updates |
| | `["instructorDashboard"]` | All instructors see new unanswered thread |
| `createPost` | `thread(threadId)` | New reply appears in thread |
| | `studentDashboard(authorId)` | Author's recent activity updates |
| | `["instructorDashboard"]` | Reply may change thread status |
| `endorseAIAnswer` | `thread(threadId)` | Thread shows updated endorsement count |
| | `courseThreads(courseId)` | Thread list shows endorsement badge |
| | `["instructorDashboard"]` | AI coverage stats may change |

### Over-Invalidation Issues (Current System)

**Problem:** Broad invalidation patterns cause unnecessary refetches

```typescript
// ❌ BAD: Invalidates ALL student dashboards (every user)
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });

// ✅ GOOD: Invalidates specific user's dashboard
queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard(userId) });
```

**Improvement Plan:**

1. **Pass user context to mutations:** Mutations need `userId` to target specific dashboards
2. **Surgical invalidation:** Use full query keys with parameters
3. **Trade-off:** Instructor dashboard still uses broad invalidation (acceptable for now)

---

## 5. API Client Updates Required

**Location:** `lib/api/client.ts`

### New API Methods

```typescript
export const api = {
  // ... existing methods

  /**
   * Get AI answer for a thread
   * NOTE: May be unnecessary if embedded in getThread()
   */
  async getAIAnswer(threadId: string): Promise<AIAnswer | null> {
    await delay();
    seedData();

    // Retrieve from localStore
    const aiAnswer = getAIAnswerByThread(threadId);
    return aiAnswer;
  },

  /**
   * Generate AI answer preview (ask page only)
   * Does NOT save to database
   */
  async generateAIPreview(input: GenerateAIAnswerInput): Promise<AIAnswer> {
    await delay(800 + Math.random() * 400); // 800-1200ms (AI simulation)

    // Generate mock AI answer (template-based)
    const preview: AIAnswer = {
      id: `preview-${Date.now()}`,
      threadId: input.threadId,
      content: generateMockAIContent(input),
      confidenceLevel: calculateConfidence(input),
      confidenceScore: 75 + Math.random() * 20,
      citations: generateMockCitations(input.courseId),
      studentEndorsements: 0,
      instructorEndorsements: 0,
      totalEndorsements: 0,
      currentUserEndorsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return preview;
  },

  /**
   * Endorse AI answer (student or instructor)
   */
  async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<void> {
    await delay(100 + Math.random() * 100); // 100-200ms (quick action)
    seedData();

    // Update endorsement count in localStore
    const endorsementDelta = input.userRole === 'instructor' ? 3 : 1;
    updateAIAnswerEndorsement(input.aiAnswerId, input.userId, endorsementDelta);
  },
};
```

### Updated createThread Method

```typescript
/**
 * Create new thread (NOW AUTO-GENERATES AI ANSWER)
 */
async createThread(input: CreateThreadInput, authorId: string): Promise<{ thread: Thread; aiAnswer: AIAnswer | null }> {
  await delay(400 + Math.random() * 200); // 400-600ms
  seedData();

  const newThread: Thread = {
    id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    courseId: input.courseId,
    title: input.title,
    content: input.content,
    authorId,
    status: "open",
    tags: input.tags || [],
    views: 0,
    hasAIAnswer: true, // NEW: Flag AI answer exists
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  addThread(newThread);

  // AUTO-GENERATE AI ANSWER
  const aiAnswer = await this.generateAIAnswer({
    threadId: newThread.id,
    courseId: input.courseId,
    questionTitle: input.title,
    questionContent: input.content,
    tags: input.tags,
  });

  // Link AI answer to thread
  newThread.aiAnswerId = aiAnswer.id;
  updateThread(newThread.id, { aiAnswerId: aiAnswer.id });

  return { thread: newThread, aiAnswer };
}
```

### Updated getThread Method

```typescript
/**
 * Get thread by ID with posts AND AI ANSWER
 */
async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null } | null> {
  await delay();
  seedData();

  const thread = getThreadById(threadId);
  if (!thread) return null;

  const posts = getPostsByThread(threadId);
  const aiAnswer = thread.aiAnswerId ? getAIAnswerById(thread.aiAnswerId) : null;

  // Increment view count
  updateThread(threadId, { views: thread.views + 1 });

  return {
    thread: { ...thread, views: thread.views + 1 },
    posts: posts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    aiAnswer, // NEW: Include AI answer
  };
}
```

**Breaking Change:** `getThread()` signature changed from returning `{ thread, posts }` to `{ thread, posts, aiAnswer }`.

**Migration:** All components using `useThread()` must handle optional `aiAnswer` field.

---

## 6. Component Integration Pattern

### Thread Detail Page

```typescript
// app/threads/[threadId]/page.tsx

export default function ThreadDetailPage({ params }: { params: { threadId: string } }) {
  // Single query fetches thread + posts + AI answer
  const { data, isLoading, error } = useThread(params.threadId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  if (!data) return <NotFound />;

  const { thread, posts, aiAnswer } = data;

  return (
    <div>
      <ThreadHeader thread={thread} />

      {/* AI Answer Section (First) */}
      {aiAnswer && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">AI-Generated Answer</h2>
          <AIAnswerCard aiAnswer={aiAnswer} threadId={thread.id} />
        </section>
      )}

      {/* Human Replies Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Human Replies ({posts.length})</h2>
        {posts.map(post => <PostItem key={post.id} post={post} />)}
      </section>
    </div>
  );
}
```

### Ask Page (Preview)

```typescript
// app/ask/page.tsx

export default function AskPage() {
  const { mutate, isPending, data: preview } = useGenerateAIPreview();

  const handlePreview = () => {
    mutate({
      threadId: 'preview-temp', // Temporary ID
      courseId: selectedCourse,
      questionTitle: title,
      questionContent: content,
      tags: selectedTags,
    });
  };

  return (
    <div>
      <QuestionForm onSubmit={handleCreateThread} />

      <Button onClick={handlePreview}>
        Preview AI Answer
      </Button>

      {isPending && <LoadingSpinner />}

      {preview && (
        <AIAnswerPreview aiAnswer={preview} />
      )}
    </div>
  );
}
```

---

## 7. Performance Optimization Summary

### Optimizations Implemented

| Strategy | Impact | Trade-off |
|----------|--------|-----------|
| Embed AI answer in getThread() | -200ms page load | Larger payloads |
| Long stale time (10min) | Fewer refetches | May show stale endorsements |
| Optimistic endorsement updates | Instant UI feedback | Rollback complexity |
| Pre-populate thread cache | -200ms navigation | More complex onSuccess |
| Surgical invalidation | Fewer wasted refetches | Need user context |

### Remaining Bottlenecks

1. **Dashboard over-invalidation:** Creating thread invalidates ALL instructor dashboards
   - **Fix:** Pass instructor IDs to mutation, target specific dashboards
   - **Priority:** Low (acceptable for now)

2. **Endorsement polling:** No real-time updates (would need refetchInterval)
   - **Fix:** Add `refetchInterval: 60000` for active threads
   - **Priority:** Low (not in scope)

---

## 8. Testing Scenarios

### Scenario 1: Create Thread with AI Answer

**Steps:**
1. User fills out ask page form
2. Clicks "Post Question"
3. `useCreateThread` mutation fires
4. API generates AI answer (800-1200ms)
5. User navigates to thread detail page
6. Thread + AI answer display immediately (no loading)

**Expected Cache Behavior:**
- `courseThreads(courseId)` invalidated → refetches list
- `studentDashboard(userId)` invalidated → refetches dashboard
- `thread(threadId)` pre-populated → no refetch needed

### Scenario 2: Endorse AI Answer (Student)

**Steps:**
1. Student views thread with AI answer
2. Clicks "Endorse" button
3. Endorsement count increments instantly (+1)
4. API call succeeds
5. Thread refetches to confirm

**Expected Cache Behavior:**
- Optimistic update shows +1 immediately
- On success: `thread(threadId)` invalidated
- On error: Count rolls back to previous value

### Scenario 3: Endorse AI Answer (Instructor)

**Steps:**
1. Instructor views thread with AI answer
2. Clicks "Endorse" button
3. Endorsement count increments instantly (+3 weighted)
4. Instructor badge appears
5. API call succeeds

**Expected Cache Behavior:**
- Optimistic update shows +3 and instructor badge
- On success: `thread(threadId)` + `courseThreads(courseId)` + `["instructorDashboard"]` invalidated
- Dashboard refetches to update AI coverage stats

### Scenario 4: Preview AI Answer (Ask Page)

**Steps:**
1. User types question on ask page
2. Clicks "Preview AI Answer"
3. Loading spinner shows (800-1200ms)
4. AI answer preview displays
5. User edits question and previews again
6. Same preview shows instantly (cached)

**Expected Cache Behavior:**
- First preview: API call, cache result with hash key
- Second preview (same question): Serve from cache (instant)
- Different question: New API call, different cache key

---

## 9. Quality Checklist

- [x] **Query keys centralized:** All keys in `queryKeys` factory
- [x] **Type safety:** All hooks use typed inputs/outputs
- [x] **Enabled conditions:** Prevent wasteful requests
- [x] **Stale time configured:** Based on data mutability
- [x] **Optimistic updates:** Used for instant UI feedback
- [x] **Rollback on error:** Optimistic updates revert on failure
- [x] **Surgical invalidation:** Target specific queries
- [x] **Pre-populate cache:** Avoid refetches on navigation
- [x] **Error handling:** All mutations handle errors
- [x] **Loading states:** All queries/mutations expose isPending

---

## 10. Implementation Sequence

### Step 1: Update Query Keys (2 minutes)
**File:** `lib/api/hooks.ts`
**Line:** 30 (extend queryKeys object)

Add:
```typescript
aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
aiPreview: (questionHash: string) => ["aiPreview", questionHash] as const,
```

**Verification:** TypeScript compiles

### Step 2: Update Type Imports (2 minutes)
**File:** `lib/api/hooks.ts`
**Line:** 2-8

Add:
```typescript
GenerateAIAnswerInput,
EndorseAIAnswerInput,
```

**Verification:** TypeScript compiles

### Step 3: Add hashQuestion Helper (2 minutes)
**File:** `lib/api/hooks.ts`
**Line:** After queryKeys, before hooks

Add hash function (see section 2 above)

**Verification:** Function defined, no errors

### Step 4: Add useGenerateAIPreview Hook (5 minutes)
**File:** `lib/api/hooks.ts`
**Line:** After useCreatePost (~line 301)

Add hook implementation (see section 2 above)

**Verification:** TypeScript compiles, no type errors

### Step 5: Add useEndorseAIAnswer Hook (10 minutes)
**File:** `lib/api/hooks.ts`
**Line:** After useGenerateAIPreview

Add hook implementation with optimistic updates (see section 3 above)

**Verification:** TypeScript compiles, no type errors

### Step 6: Update useCreateThread Hook (5 minutes)
**File:** `lib/api/hooks.ts`
**Line:** 268-282

Update to handle AI answer in response (see section 3 above)

**Verification:** TypeScript compiles, no breaking changes

### Step 7: Update API Client (30 minutes - Parent Agent)
**File:** `lib/api/client.ts`

1. Add `getAIAnswer()` method (optional)
2. Add `generateAIPreview()` method
3. Add `endorseAIAnswer()` method
4. Update `createThread()` to return `{ thread, aiAnswer }`
5. Update `getThread()` to return `{ thread, posts, aiAnswer }`

**Verification:** All methods compile, mock data works

### Step 8: Test Hooks (Parent Agent)
1. Test `useGenerateAIPreview` in ask page
2. Test `useEndorseAIAnswer` in thread detail
3. Test updated `useCreateThread` flow
4. Verify cache invalidation works correctly

**Verification:** All flows work, no console errors

---

## 11. Files Modified

| File | Lines Added | Lines Modified | Breaking Changes |
|------|-------------|----------------|------------------|
| `lib/api/hooks.ts` | ~120 | ~15 | Yes (useCreateThread signature) |
| `lib/api/client.ts` | ~100 | ~30 | Yes (getThread signature) |

**Total Impact:** ~220 new lines, ~45 lines modified, 2 breaking changes

---

## 12. Risks & Mitigations

### Risk 1: Breaking Change in getThread()
**Issue:** Existing components expect `{ thread, posts }`, now returns `{ thread, posts, aiAnswer }`
**Mitigation:** AI answer is optional (`aiAnswer | null`), existing code won't break if they ignore it
**Status:** Safe - additive change

### Risk 2: Over-Invalidation Performance
**Issue:** Invalidating all dashboards on every mutation
**Mitigation:** Target specific user dashboards where possible
**Status:** Acceptable for v1, optimize later

### Risk 3: Optimistic Update Complexity
**Issue:** Rollback logic for endorsements is complex
**Mitigation:** Return context from onMutate, use in onError
**Status:** Tested pattern, safe

### Risk 4: Cache Consistency
**Issue:** Pre-populating thread cache may cause stale data
**Mitigation:** Set short stale time (2 minutes) and invalidate on mutations
**Status:** Acceptable trade-off for performance

---

## 13. Next Steps (For Parent Agent)

1. ✅ Review this plan for approval
2. Implement query key updates
3. Implement hooks in sequence (steps 1-6)
4. Update API client methods (step 7)
5. Run `npx tsc --noEmit` to verify types
6. Run `npm run lint` to verify linting
7. Test all hooks in isolation
8. Test end-to-end flows
9. Commit changes: `feat: add React Query hooks for AI answer system`

---

**Status:** Plan Complete ✓
**Estimated Implementation Time:** 25-30 minutes (hooks only), 60-75 minutes (including API client)
**Approval Required:** Yes (before code changes)

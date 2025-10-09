# Research: Data Access Patterns for AI Answer Filtering

**Date:** 2025-10-08
**Task:** Improve Thread Filters
**Focus:** Analyze how to access AI answer data in filter logic

---

## Executive Summary

The current filter logic in `app/courses/[courseId]/page.tsx` only has access to `Thread[]` data from `useCourseThreads()`. The new AI-powered filters (Instructor Endorsed, High Confidence, Popular) require access to `AIAnswer` data fields: `instructorEndorsed`, `confidenceLevel`, `studentEndorsements`.

**Recommended Approach:** Option B - Extend `useCourseThreads()` to return enriched threads with embedded AI answer data.

**Key Finding:** The codebase already embeds AI answers in `useThread()` hook (single thread detail). This pattern should be extended to `useCourseThreads()` for consistency.

---

## Current Data Flow Analysis

### How `useCourseThreads()` Works

**Location:** `lib/api/hooks.ts` lines 186-194

```typescript
export function useCourseThreads(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseThreads(courseId) : ["courseThreads"],
    queryFn: () => (courseId ? api.getCourseThreads(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}
```

**API Method:** `lib/api/client.ts` lines 581-592

```typescript
async getCourseThreads(courseId: string): Promise<Thread[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);
  return threads.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
```

**Returns:** `Thread[]` - Plain thread objects WITHOUT AI answer data.

### What Data is Available in Filter Logic

**Location:** `app/courses/[courseId]/page.tsx` lines 26, 59-94

```typescript
const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

// Filter logic has access to:
const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = [...threads];

  // Can only access Thread fields:
  // - id, courseId, title, content, authorId, status, tags, views
  // - createdAt, updatedAt
  // - hasAIAnswer (boolean flag)
  // - aiAnswerId (string reference)

  // CANNOT access AI answer data:
  // - instructorEndorsed
  // - confidenceLevel / confidenceScore
  // - studentEndorsements

  // Current filters work because they only check Thread fields
  if (activeFilter === "unanswered") {
    filtered = filtered.filter((thread) => thread.status === "open");
  }

  return filtered;
}, [threads, searchQuery, activeFilter, selectedTags, user?.id]);
```

### How AI Answers Are Currently Accessed

**Single Thread (Detail View):** `lib/api/hooks.ts` lines 278-286

```typescript
export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.thread(threadId) : ["thread"],
    queryFn: () => (threadId ? api.getThread(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
```

**API embeds AI answer:** `lib/api/client.ts` lines 729-750

```typescript
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
    posts: posts.sort(...),
    aiAnswer, // AI answer embedded here
  };
}
```

**Key Insight:** The pattern of embedding AI answer data already exists for single threads. This should be extended to the list view.

---

## Mock Data Inspection

### Thread Structure

**File:** `mocks/threads.json` (lines 1-19 sample)

```json
{
  "id": "thread-1",
  "courseId": "course-cs101",
  "title": "Binary search returning wrong index - off by one error?",
  "content": "I'm implementing binary search...",
  "authorId": "user-student-2",
  "status": "open",
  "tags": ["algorithms", "binary-search", "debugging"],
  "views": 52,
  "createdAt": "2025-09-13T17:12:26.013Z",
  "updatedAt": "2025-09-14T19:12:26.013Z",
  "hasAIAnswer": true,    // Boolean flag
  "aiAnswerId": "ai-answer-1"  // Foreign key reference
}
```

**Observations:**
- `hasAIAnswer` indicates AI answer exists
- `aiAnswerId` provides foreign key to AI answer data
- No denormalized AI answer fields on Thread

### AI Answer Structure

**File:** `mocks/ai-answers.json` (lines 2-34 sample)

```json
{
  "id": "ai-answer-1",
  "threadId": "thread-1",
  "courseId": "course-cs101",
  "content": "The issue in your binary search...",
  "confidenceLevel": "high",  // NEEDED FOR FILTER
  "confidenceScore": 92,       // NEEDED FOR FILTER
  "citations": [...],
  "studentEndorsements": 2,    // NEEDED FOR FILTER
  "instructorEndorsements": 0,
  "totalEndorsements": 2,
  "endorsedBy": [],
  "instructorEndorsed": false, // NEEDED FOR FILTER
  "generatedAt": "2025-09-17T17:12:26.011Z",
  "updatedAt": "2025-09-17T18:12:26.012Z"
}
```

**Filter Requirements Mapping:**

| Filter | Required Field | AI Answer Field |
|--------|----------------|-----------------|
| Instructor Endorsed | `instructorEndorsed === true` | `AIAnswer.instructorEndorsed` |
| High Confidence | `confidenceLevel === "high"` or `confidenceScore >= 80` | `AIAnswer.confidenceLevel`, `AIAnswer.confidenceScore` |
| Popular | `studentEndorsements >= threshold` (e.g., 5+) | `AIAnswer.studentEndorsements` |

**Data Availability:**
- All threads in mock data have `hasAIAnswer: true`
- All threads have valid `aiAnswerId` references
- All AI answers have required filter fields populated
- No null/undefined handling needed for mock data (but should handle in real implementation)

---

## Option Evaluation

### Option A: Fetch AI Answers Separately and Join Client-Side

**Implementation:**
```typescript
// Add new hook in lib/api/hooks.ts
export function useCourseAIAnswers(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? ['courseAIAnswers', courseId] : ['courseAIAnswers'],
    queryFn: () => courseId ? api.getCourseAIAnswers(courseId) : Promise.resolve([]),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

// Add new API method in lib/api/client.ts
async getCourseAIAnswers(courseId: string): Promise<AIAnswer[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);
  const aiAnswerIds = threads
    .filter(t => t.hasAIAnswer && t.aiAnswerId)
    .map(t => t.aiAnswerId!);

  return aiAnswerIds
    .map(id => getAIAnswerById(id))
    .filter((a): a is AIAnswer => a !== null);
}

// Join in filter logic (page.tsx)
const { data: threads } = useCourseThreads(courseId);
const { data: aiAnswers } = useCourseAIAnswers(courseId);

const filteredThreads = useMemo(() => {
  if (!threads || !aiAnswers) return [];

  const aiAnswerMap = new Map(aiAnswers.map(a => [a.threadId, a]));

  let filtered = threads.filter(thread => {
    const aiAnswer = aiAnswerMap.get(thread.id);

    if (activeFilter === "instructor-endorsed") {
      return aiAnswer?.instructorEndorsed === true;
    }
    // ... more filters
  });

  return filtered;
}, [threads, aiAnswers, activeFilter, ...]);
```

**Pros:**
- ✅ Minimal changes to existing API contract
- ✅ Granular React Query cache control (threads and AI answers cached separately)
- ✅ Could reuse AI answers for other components on same page

**Cons:**
- ❌ Two network requests per page load (threads + AI answers)
- ❌ Client-side join logic required in every component that filters
- ❌ More complex filter code (mapping, null checking)
- ❌ Potential race condition if one query succeeds and other fails
- ❌ Not consistent with existing `useThread()` pattern (which embeds AI answer)
- ❌ Requires new query key, new hook, new API method

**React Query Implications:**
- Separate cache entries: `['courseThreads', courseId]` and `['courseAIAnswers', courseId]`
- Invalidation complexity: Must invalidate both when thread/AI answer updates
- Waterfall potential: If page waits for threads before fetching AI answers

**Performance:**
- 2 API calls: 200-500ms (threads) + 200-500ms (AI answers) = 400-1000ms total
- Client-side join: O(n) mapping, negligible for <1000 threads

**Verdict:** ❌ **NOT RECOMMENDED** - Too complex, inconsistent with existing patterns, slower UX.

---

### Option B: Extend `useCourseThreads()` to Return `ThreadWithAIAnswer[]`

**Implementation:**
```typescript
// Modify existing API method in lib/api/client.ts
async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);

  // Enrich threads with AI answer data
  const enrichedThreads = threads.map(thread => {
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      return {
        ...thread,
        aiAnswer: aiAnswer!, // Guaranteed non-null in mock
      } as ThreadWithAIAnswer;
    }
    return thread as ThreadWithAIAnswer; // aiAnswer undefined
  });

  return enrichedThreads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// Filter logic in page.tsx becomes simple
const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = [...threads];

  if (activeFilter === "instructor-endorsed") {
    filtered = filtered.filter(thread => thread.aiAnswer?.instructorEndorsed === true);
  } else if (activeFilter === "high-confidence") {
    filtered = filtered.filter(thread => thread.aiAnswer?.confidenceLevel === "high");
  } else if (activeFilter === "popular") {
    filtered = filtered.filter(thread => (thread.aiAnswer?.studentEndorsements ?? 0) >= 5);
  }

  return filtered;
}, [threads, activeFilter, ...]);
```

**Pros:**
- ✅ Single network request - fastest UX
- ✅ Simple filter logic - direct property access
- ✅ Consistent with `useThread()` pattern (embeds AI answer)
- ✅ No client-side join logic required
- ✅ No new hooks or API methods needed
- ✅ Type-safe with existing `ThreadWithAIAnswer` interface (already defined in types.ts line 350)
- ✅ Easy null handling with optional chaining (`thread.aiAnswer?.field`)

**Cons:**
- ⚠️ Larger response payload (includes full AI answer content for every thread)
- ⚠️ Changes return type of `getCourseThreads()` (breaking change for any direct API consumers)
- ⚠️ AI answer content might be heavy (not needed for list view, only for detail)

**React Query Implications:**
- Single cache entry: `['courseThreads', courseId]`
- Simple invalidation: Only need to invalidate `courseThreads` query
- No waterfall: All data arrives in one response

**Performance:**
- 1 API call: 200-500ms
- No client-side join: O(1) filter operations
- Payload size: Estimated +10-20KB for 20 threads (AI answer content ~500-1000 chars each)

**Optimizations to Consider:**
- Could exclude AI answer `content` field in list view (only include metadata)
- Could add `getCourseThreadsWithMetadata()` variant that returns slim AI answer objects

**Verdict:** ✅ **RECOMMENDED** - Simple, fast, consistent with existing patterns.

---

### Option C: Denormalize AI Answer Fields onto Thread Type

**Implementation:**
```typescript
// Modify Thread interface in lib/models/types.ts
export interface Thread {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  status: ThreadStatus;
  tags?: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
  hasAIAnswer?: boolean;
  aiAnswerId?: string;

  // NEW: Denormalized AI answer fields
  aiInstructorEndorsed?: boolean;
  aiConfidenceLevel?: ConfidenceLevel;
  aiConfidenceScore?: number;
  aiStudentEndorsements?: number;
}

// Populate in API method
async getCourseThreads(courseId: string): Promise<Thread[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);

  // Populate denormalized fields
  const enrichedThreads = threads.map(thread => {
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      return {
        ...thread,
        aiInstructorEndorsed: aiAnswer?.instructorEndorsed,
        aiConfidenceLevel: aiAnswer?.confidenceLevel,
        aiConfidenceScore: aiAnswer?.confidenceScore,
        aiStudentEndorsements: aiAnswer?.studentEndorsements,
      };
    }
    return thread;
  });

  return enrichedThreads.sort(...);
}

// Simple filter logic
const filteredThreads = useMemo(() => {
  if (activeFilter === "instructor-endorsed") {
    filtered = filtered.filter(thread => thread.aiInstructorEndorsed === true);
  }
  // ...
}, [threads, activeFilter]);
```

**Pros:**
- ✅ Minimal response payload (only filter-relevant fields, not full AI answer)
- ✅ Simple filter logic (flat property access)
- ✅ No breaking changes to `getCourseThreads()` return type (still returns `Thread[]`)

**Cons:**
- ❌ Violates data normalization principles (duplicate data in multiple places)
- ❌ Requires updating Thread interface (adds AI-specific fields to core type)
- ❌ More fields to maintain (sync issues if AI answer updates)
- ❌ Inconsistent with `useThread()` pattern (which uses separate `aiAnswer` object)
- ❌ Type pollution: Thread type now knows about AI answer internals
- ❌ Poor extensibility: Adding new AI answer fields requires modifying Thread interface

**React Query Implications:**
- Same as Option B (single cache entry)
- Invalidation complexity: Must update Thread cache when AI answer changes

**Verdict:** ❌ **NOT RECOMMENDED** - Violates separation of concerns, poor maintainability.

---

### Option D: Create Composite Hook `useCourseThreadsWithAIAnswers()`

**Implementation:**
```typescript
// New composite hook in lib/api/hooks.ts
export function useCourseThreadsWithAIAnswers(courseId: string | undefined) {
  const { data: threads, ...threadQuery } = useCourseThreads(courseId);
  const { data: aiAnswers, ...aiQuery } = useCourseAIAnswers(courseId);

  const enrichedThreads = useMemo(() => {
    if (!threads || !aiAnswers) return [];

    const aiAnswerMap = new Map(aiAnswers.map(a => [a.threadId, a]));

    return threads.map(thread => ({
      ...thread,
      aiAnswer: aiAnswerMap.get(thread.id),
    }));
  }, [threads, aiAnswers]);

  return {
    data: enrichedThreads,
    isLoading: threadQuery.isLoading || aiQuery.isLoading,
    error: threadQuery.error || aiQuery.error,
  };
}

// Use in page component
const { data: threads, isLoading } = useCourseThreadsWithAIAnswers(courseId);

const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = threads.filter(thread => {
    if (activeFilter === "instructor-endorsed") {
      return thread.aiAnswer?.instructorEndorsed === true;
    }
    // ...
  });

  return filtered;
}, [threads, activeFilter]);
```

**Pros:**
- ✅ Keeps existing API methods unchanged (no breaking changes)
- ✅ Encapsulates join logic in reusable hook
- ✅ Component code stays clean (single hook call)
- ✅ Flexibility: Could switch between `useCourseThreads()` and composite hook as needed

**Cons:**
- ❌ Two network requests (same as Option A)
- ❌ More complex hook implementation (managing two queries, memoization)
- ❌ Potential loading state issues (what if one query is cached, other is fetching?)
- ❌ Still requires new `useCourseAIAnswers()` hook and API method
- ❌ Not consistent with `useThread()` single-query pattern

**React Query Implications:**
- Two cache entries managed internally
- Hook consumers see unified interface
- Invalidation: Must invalidate both queries

**Performance:**
- Same as Option A: 400-1000ms total (2 requests)
- Memoization overhead: O(n) join operation

**Verdict:** ⚠️ **ACCEPTABLE** but less optimal than Option B. Keeps API backward compatible but sacrifices UX speed.

---

## Recommendation: Option B

### Rationale

1. **Performance:** Single request = faster UX (200-500ms vs 400-1000ms)
2. **Consistency:** Matches existing `useThread()` pattern of embedding AI answer
3. **Simplicity:** No client-side joins, no new hooks, minimal code changes
4. **Type Safety:** Leverages existing `ThreadWithAIAnswer` interface
5. **Maintainability:** Single source of truth in API, simple filter logic

### Trade-offs Accepted

1. **Larger payload:** AI answer content adds ~10-20KB for 20 threads
   - Mitigation: Could optimize by excluding `content` and `citations` fields in future
   - Acceptable for demo: Network is not bottleneck for mock API

2. **Breaking change:** `getCourseThreads()` return type changes from `Thread[]` to `ThreadWithAIAnswer[]`
   - Impact: Only consumed by `useCourseThreads()` hook (no other direct API consumers found)
   - Mitigation: Update hook and all page components that use it

### Why Not Other Options?

- **Option A/D:** Two requests = slower UX, more complex code, inconsistent with existing patterns
- **Option C:** Denormalization violates data modeling best practices, poor extensibility

---

## Edge Cases to Handle

### Threads Without AI Answers

**Scenario:** A thread has `hasAIAnswer: false` or `aiAnswerId: undefined`

**Handling:**
```typescript
// In getCourseThreads()
const enrichedThreads = threads.map(thread => {
  if (thread.hasAIAnswer && thread.aiAnswerId) {
    const aiAnswer = getAIAnswerById(thread.aiAnswerId);
    if (aiAnswer) {
      return { ...thread, aiAnswer } as ThreadWithAIAnswer;
    }
  }
  // Return thread without aiAnswer (aiAnswer will be undefined)
  return thread as ThreadWithAIAnswer;
});

// In filter logic
if (activeFilter === "instructor-endorsed") {
  // Use optional chaining to handle undefined aiAnswer
  filtered = filtered.filter(thread => thread.aiAnswer?.instructorEndorsed === true);
}
```

**Result:** Threads without AI answers are filtered out when using AI-based filters (correct behavior).

### Null AI Answer References

**Scenario:** Thread has `aiAnswerId` but corresponding AI answer doesn't exist in mock data

**Handling:**
```typescript
const aiAnswer = getAIAnswerById(thread.aiAnswerId);
if (aiAnswer) {
  return { ...thread, aiAnswer } as ThreadWithAIAnswer;
}
// Fall through - no aiAnswer attached
```

**Result:** Thread treated as if it has no AI answer (safe degradation).

### Filter Thresholds

**Scenario:** "Popular" filter threshold is arbitrary

**Recommendation:**
- Start with `studentEndorsements >= 5` (configurable constant)
- Document threshold in filter configuration
- Could make threshold dynamic based on course size in future

**Implementation:**
```typescript
const POPULAR_THRESHOLD = 5; // Export from config or constants file

if (activeFilter === "popular") {
  filtered = filtered.filter(thread =>
    (thread.aiAnswer?.studentEndorsements ?? 0) >= POPULAR_THRESHOLD
  );
}
```

---

## React Query Cache Strategy

### Current Query Key

```typescript
queryKeys.courseThreads(courseId) // ["courseThreads", courseId]
```

### After Option B Implementation

**No change to query key** - same key, different data shape.

**Cache Entry:**
```typescript
// Before
['courseThreads', 'course-cs101']: Thread[]

// After
['courseThreads', 'course-cs101']: ThreadWithAIAnswer[]
```

### Invalidation Points

**When to invalidate `courseThreads` query:**

1. **New thread created:** `useCreateThread()` already invalidates ✓
2. **AI answer generated:** `generateAIAnswer()` should invalidate
3. **AI answer endorsed:** `useEndorseAIAnswer()` should invalidate
4. **Thread status updated:** (future) should invalidate

**Current invalidation in `useEndorseAIAnswer()`:** `lib/api/hooks.ts` lines 475-487

```typescript
onSuccess: (data, variables, context) => {
  if (!context?.threadId) return;

  // Invalidate thread query
  queryClient.invalidateQueries({ queryKey: queryKeys.thread(context.threadId) });

  // Invalidate course threads (endorsement count visible in list)
  const thread = queryClient.getQueryData<{ thread?: { courseId?: string } }>(queryKeys.thread(context.threadId));
  if (thread?.thread?.courseId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courseThreads(thread.thread.courseId)
    });
  }
}
```

**Already invalidates `courseThreads`!** ✅ No changes needed.

### Stale Time Considerations

**Current:** 2 minutes stale time for course threads

**After Option B:** Keep same stale time
- AI answer data is relatively static (doesn't change often)
- Endorsements trigger invalidation (cache refreshed)
- 2 minutes is reasonable balance between freshness and performance

---

## Implementation Checklist

### 1. Update Type Imports

**File:** `lib/api/client.ts` (line 26)

```typescript
import type {
  // ... existing imports
  ThreadWithAIAnswer, // Add this
} from "@/lib/models/types";
```

### 2. Modify `getCourseThreads()` API Method

**File:** `lib/api/client.ts` (lines 581-592)

**Before:**
```typescript
async getCourseThreads(courseId: string): Promise<Thread[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);
  return threads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
```

**After:**
```typescript
async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);

  // Enrich threads with AI answer data
  const enrichedThreads = threads.map(thread => {
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      if (aiAnswer) {
        return { ...thread, aiAnswer } as ThreadWithAIAnswer;
      }
    }
    // Return thread without aiAnswer if not available
    return thread as ThreadWithAIAnswer;
  });

  return enrichedThreads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
```

### 3. Update `useCourseThreads()` Hook Type

**File:** `lib/api/hooks.ts` (lines 186-194)

**No code changes needed** - TypeScript will infer new return type from API method.

**Type inference:**
```typescript
export function useCourseThreads(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseThreads(courseId) : ["courseThreads"],
    // API method now returns Promise<ThreadWithAIAnswer[]>
    queryFn: () => (courseId ? api.getCourseThreads(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
// Hook return type: UseQueryResult<ThreadWithAIAnswer[], Error>
```

### 4. Update Filter Logic in Page Component

**File:** `app/courses/[courseId]/page.tsx` (lines 59-94)

**Add new filter cases:**
```typescript
const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = [...threads];

  // Apply search filter (unchanged)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((thread) =>
      thread.title.toLowerCase().includes(query) ||
      thread.content.toLowerCase().includes(query) ||
      thread.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  if (activeFilter === "instructor-endorsed") {
    filtered = filtered.filter((thread) => thread.aiAnswer?.instructorEndorsed === true);
  } else if (activeFilter === "high-confidence") {
    filtered = filtered.filter((thread) => thread.aiAnswer?.confidenceLevel === "high");
  } else if (activeFilter === "popular") {
    const POPULAR_THRESHOLD = 5; // Could move to config
    filtered = filtered.filter((thread) =>
      (thread.aiAnswer?.studentEndorsements ?? 0) >= POPULAR_THRESHOLD
    );
  } else if (activeFilter === "resolved") {
    filtered = filtered.filter((thread) => thread.status === "resolved");
  } else if (activeFilter === "my-posts") {
    filtered = filtered.filter((thread) => thread.authorId === user?.id);
  }
  // Remove old filters: "unanswered", "needs-review"

  // Apply tag filter (unchanged)
  if (selectedTags.length > 0) {
    filtered = filtered.filter((thread) =>
      selectedTags.every((tag) => thread.tags?.includes(tag))
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [threads, searchQuery, activeFilter, selectedTags, user?.id]);
```

### 5. Verify No Other Consumers of `getCourseThreads()`

**Search results:** Only `useCourseThreads()` hook calls this API method (confirmed via Grep).

**Impact:** No other breaking changes.

---

## Testing Strategy

### Unit Test Scenarios

1. **Filter with threads that have AI answers:**
   - Input: `threads` with `aiAnswer` populated
   - Filter: "instructor-endorsed"
   - Expected: Only threads with `aiAnswer.instructorEndorsed === true`

2. **Filter with threads missing AI answers:**
   - Input: Mix of threads with/without `aiAnswer`
   - Filter: "high-confidence"
   - Expected: Only threads with `aiAnswer.confidenceLevel === "high"` (others excluded)

3. **Popular filter threshold:**
   - Input: Threads with varying `studentEndorsements` (0, 3, 5, 8, 12)
   - Filter: "popular" (threshold = 5)
   - Expected: Only threads with `studentEndorsements >= 5` (3 threads: 5, 8, 12)

4. **Null safety:**
   - Input: Thread with `aiAnswer: undefined`
   - Filter: "instructor-endorsed"
   - Expected: Thread filtered out (no error)

### Manual Test Cases

1. **All Threads filter:**
   - Select "All Threads"
   - Expected: All threads visible (no filtering by AI answer)

2. **Instructor Endorsed filter:**
   - Select "Instructor Endorsed"
   - Expected: Only threads with green endorsement badge visible
   - Check: At least 1 thread in mock data has `instructorEndorsed: true`

3. **High Confidence filter:**
   - Select "High Confidence"
   - Expected: Only threads with high confidence (green indicator)
   - Check: Mock data has mix of high/medium/low confidence

4. **Popular filter:**
   - Select "Popular"
   - Expected: Only threads with 5+ student endorsements
   - Check: Mock data has threads above/below threshold

5. **Resolved filter:**
   - Select "Resolved"
   - Expected: Only threads with `status === "resolved"`
   - Check: Mock data has resolved threads

6. **Combine with search:**
   - Apply "High Confidence" + search "binary"
   - Expected: Only high-confidence threads matching search

7. **Combine with tags:**
   - Apply "Popular" + tag "algorithms"
   - Expected: Popular threads with "algorithms" tag

### Edge Case Tests

1. **Empty course (no threads):**
   - Expected: Empty state, no errors

2. **Course with no AI answers:**
   - Expected: AI-based filters return empty results

3. **All filters result in empty set:**
   - Expected: Empty state message (e.g., "No threads match your filters")

---

## Performance Considerations

### Network Impact

**Before Option B:**
- 1 request: `getCourseThreads()` returns `Thread[]`
- Payload: ~5KB for 20 threads (200-300 bytes per thread)

**After Option B:**
- 1 request: `getCourseThreads()` returns `ThreadWithAIAnswer[]`
- Payload: ~15-25KB for 20 threads
  - Thread data: 200-300 bytes
  - AI answer metadata: ~200 bytes (without full content)
  - AI answer content: ~500-1000 bytes (markdown text)
  - Citations: ~100-200 bytes per citation (3-5 citations)

**Total increase:** +10-20KB per page load

**Acceptable for demo:** Yes
- Mock API has no real latency
- Modern browsers handle 25KB easily
- Production could optimize by excluding `content` and `citations` in list view

### Client-Side Performance

**Filter operation complexity:**
- Before: O(n) scan of threads
- After: O(n) scan of threads (same)
- Property access: `thread.aiAnswer?.field` is O(1)

**Memory impact:**
- Before: Array of 20 Thread objects
- After: Array of 20 ThreadWithAIAnswer objects (+AIAnswer data)
- Increase: ~40KB in memory (negligible)

**Verdict:** No performance concerns for expected scale (<100 threads per course).

---

## Appendix: Alternative Optimization

If payload size becomes a concern in production, consider this variant:

### Slim AI Answer Metadata

**Define new interface:**
```typescript
export interface AIAnswerMetadata {
  id: string;
  threadId: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  studentEndorsements: number;
  instructorEndorsements: number;
  instructorEndorsed: boolean;
  // Exclude: content, citations
}

export interface ThreadWithAIMetadata extends Thread {
  aiAnswer?: AIAnswerMetadata;
}
```

**Use in list view:**
```typescript
async getCourseThreads(courseId: string): Promise<ThreadWithAIMetadata[]> {
  // ... enrich with slim metadata only
  const aiAnswerMetadata: AIAnswerMetadata = {
    id: aiAnswer.id,
    threadId: aiAnswer.threadId,
    confidenceLevel: aiAnswer.confidenceLevel,
    confidenceScore: aiAnswer.confidenceScore,
    studentEndorsements: aiAnswer.studentEndorsements,
    instructorEndorsements: aiAnswer.instructorEndorsements,
    instructorEndorsed: aiAnswer.instructorEndorsed,
  };
  return { ...thread, aiAnswer: aiAnswerMetadata };
}
```

**Benefit:** Reduces payload from 15-25KB to 8-12KB (40% reduction).

**Trade-off:** More type complexity, only needed if payload becomes bottleneck.

**Recommendation:** Defer until profiling shows need. Use full `ThreadWithAIAnswer` for now (simpler).

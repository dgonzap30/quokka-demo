# React Query Patterns Research - Instructor Dashboard

**Date:** 2025-10-12
**Task:** Instructor Dashboard Re-imagining
**Focus:** React Query architecture for instructor-specific data fetching, caching, bulk mutations, and invalidation

---

## Executive Summary

This research analyzes existing React Query patterns in the QuokkaQ codebase and identifies optimization opportunities for the new instructor dashboard features. Key findings:

1. **Current invalidation is too broad** - dashboards invalidate for all users on any mutation
2. **Query key hierarchy is well-structured** - factory pattern prevents typos, enables surgical invalidation
3. **Optimistic updates are underutilized** - only used for AI endorsements, not for bulk actions
4. **Polling pattern exists** - notifications use `refetchInterval: 60000`, can apply to priority queue
5. **Cache pre-population pattern** - createThread pre-populates cache to avoid refetch, applies to templates

---

## Current React Query Architecture

### Query Key Structure (lib/api/hooks.ts, lines 19-35)

**Current Pattern: Hierarchical factory-based keys**

```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] : ["notifications", userId],
  studentDashboard: (userId: string) => ["studentDashboard", userId] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
  aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
  aiPreview: (questionHash: string) => ["aiPreview", questionHash] as const,
};
```

**Strengths:**
- Centralized key factory prevents typos
- TypeScript `as const` for type safety
- Hierarchical structure enables partial matching
- Parameterization for cache isolation

**Key Design Patterns:**
1. **Resource-first naming:** `["thread", threadId]` not `["threads", threadId, "detail"]`
2. **Optional parameters:** `notifications(userId, courseId?)` creates different keys
3. **User-scoped caching:** `["studentDashboard", userId]` isolates per user
4. **No nested keys:** Flat structure for simplicity

---

### Cache Configuration Strategy

**Current Stale Time Decisions:**

| Query Type | Stale Time | Refetch | Reasoning |
|------------|------------|---------|-----------|
| `currentUser` | 5 minutes | No | User data changes infrequently |
| `session` | 5 minutes | No | Auth state is stable |
| `courses` | 10 minutes | No | Course catalog changes rarely |
| `courseThreads` | 2 minutes | No | Active discussion, needs freshness |
| `thread` | 2 minutes | No | Active discussion, needs freshness |
| `courseMetrics` | 5 minutes | No | Dashboard stats can be slightly stale |
| `courseInsights` | 5 minutes | No | AI-generated, expensive operation |
| `notifications` | 30 seconds | 60s poll | Real-time feel with polling |
| `studentDashboard` | 2 minutes | No | Landing page, balance freshness/performance |
| `instructorDashboard` | 3 minutes | No | Dashboard stats, less critical than student |
| `aiAnswer` | 10 minutes | No | Immutable content, only endorsements change |

**GC Time (gcTime) Strategy:**
- Most queries: 5-10 minutes (keep data in cache after unmount)
- Long-lived data (courses, user): 10-15 minutes
- Active discussions (threads): 5 minutes

**Refetch Settings:**
- Default: No refetch on window focus or reconnect
- Exception: `notifications` polls every 60 seconds for real-time feel
- Pattern: `refetchInterval: 60 * 1000` for near-real-time data

---

### Mutation Patterns

**Current Mutation Strategies:**

#### 1. Optimistic Updates (AI Answer Endorsement)

```typescript
export function useEndorseAIAnswer() {
  return useMutation({
    onMutate: async ({ aiAnswerId, userId, isInstructor }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot previous data
      const previousThread = queryClient.getQueryData(queryKey);

      // 3. Optimistically update cache
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        aiAnswer: {
          ...old.aiAnswer,
          totalEndorsements: old.aiAnswer.totalEndorsements + delta,
        },
      }));

      // 4. Return context for rollback
      return { previousThread, threadId };
    },

    onError: (err, vars, context) => {
      // 5. Rollback on error
      queryClient.setQueryData(queryKey, context.previousThread);
    },

    onSuccess: (data, vars, context) => {
      // 6. Invalidate to refetch server truth
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

**Pattern Strengths:**
- Instant UI feedback (no loading spinner)
- Rollback prevents incorrect data on failure
- Refetch ensures eventual consistency

**Applicability to Bulk Actions:**
- ✅ Can apply to bulk endorsements
- ✅ Can apply to bulk status changes
- ⚠️ Complexity increases with multiple threads

#### 2. Cache Pre-Population (Thread Creation)

```typescript
export function useCreateThread() {
  return useMutation({
    onSuccess: (result) => {
      const { thread, aiAnswer } = result;

      // Pre-populate thread cache
      queryClient.setQueryData(queryKeys.thread(thread.id), {
        thread,
        posts: [],
        aiAnswer,
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseThreads(thread.courseId)
      });
    },
  });
}
```

**Pattern Strengths:**
- Saves 200-500ms on navigation to thread detail
- Avoids loading spinner for known data
- User experience feels instant

**Applicability to Templates:**
- ✅ Can pre-populate saved templates after creation
- ✅ Can cache frequently-used templates with infinite stale time

#### 3. Surgical Invalidation (Post Creation)

```typescript
export function useCreatePost() {
  return useMutation({
    onSuccess: (newPost) => {
      // Surgical: invalidate specific thread
      queryClient.invalidateQueries({
        queryKey: queryKeys.thread(newPost.threadId)
      });

      // Surgical: invalidate specific user dashboard
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentDashboard(authorId)
      });

      // Broad: invalidate all instructor dashboards
      queryClient.invalidateQueries({
        queryKey: ["instructorDashboard"]
      });
    },
  });
}
```

**Pattern Weaknesses:**
- ❌ Broad invalidation affects all instructors, not just course instructors
- ❌ No way to target specific instructor for a course

**Opportunity for Improvement:**
- ✅ Pass `courseId` to mutation
- ✅ Query instructors for course
- ✅ Invalidate only those instructor dashboards

---

### Invalidation Patterns Analysis

**Surgical vs. Broad Invalidation:**

| Pattern | Syntax | Scope | Use Case |
|---------|--------|-------|----------|
| **Surgical** | `queryKeys.thread(threadId)` | Single cache entry | Update specific thread |
| **Broad** | `{ queryKey: ["instructorDashboard"] }` | All matching keys | Invalidate all instructor dashboards |
| **Targeted** | `queryKeys.instructorDashboard(userId)` | Specific user | Invalidate one instructor's dashboard |

**Current Over-Invalidation Issues:**

```typescript
// ❌ BAD: Invalidates ALL instructor dashboards (every instructor in system)
queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

// ❌ BAD: Invalidates ALL student dashboards (every student in system)
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });

// ✅ GOOD: Invalidates specific user's dashboard
queryClient.invalidateQueries({
  queryKey: queryKeys.studentDashboard(userId)
});

// ✅ BETTER: Invalidate multiple specific instructors
instructorIds.forEach(id => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.instructorDashboard(id)
  });
});
```

**Impact on Instructor Dashboard:**
- Creating thread → ALL instructor dashboards refetch (wasteful)
- Endorsing AI → ALL instructor dashboards refetch (wasteful)
- Only course instructors need updates

**Recommendation:**
- Pass `courseInstructorIds` to mutations
- Loop and invalidate each instructor separately
- Trade-off: Slightly more code for significantly better performance

---

## Instructor Dashboard Data Requirements

### Priority Queue Data (High Frequency Updates)

**Requirements:**
- Poll every 1-2 minutes for new unanswered questions
- Sort by urgency (views, time since creation, AI confidence)
- Show up to 20 threads max (pagination not needed for queue)
- Update immediately on bulk action (endorse, resolve)

**Query Strategy:**
```typescript
useInstructorInsights(userId: string) {
  staleTime: 1 * 60 * 1000,         // 1 minute (short for near-real-time)
  gcTime: 5 * 60 * 1000,             // 5 minutes
  refetchInterval: 2 * 60 * 1000,    // Poll every 2 minutes
}
```

**Rationale:**
- Short stale time ensures fresh data
- Polling simulates real-time updates without WebSockets
- GC time keeps data in cache during active session

### FAQ Clusters (Medium Frequency Updates)

**Requirements:**
- Regenerate when new threads created (not on every mutation)
- Group similar questions by keywords/tags
- Update cluster sizes as threads resolve
- Cache aggressively (expensive computation)

**Query Strategy:**
```typescript
useFrequentlyAskedQuestions(courseId: string) {
  staleTime: 5 * 60 * 1000,          // 5 minutes (medium freshness)
  gcTime: 10 * 60 * 1000,             // 10 minutes (keep longer)
  refetchInterval: undefined,         // No polling (updates on invalidation)
}
```

**Rationale:**
- 5 min stale time balances freshness with computation cost
- No polling (invalidate on thread creation only)
- Long GC time reduces recalculation frequency

### Topic Trends (Low Frequency Updates)

**Requirements:**
- Calculate trending topics from last 7 days
- Update hourly or on manual refresh
- Show tag frequency and growth rate
- Expensive calculation, cache aggressively

**Query Strategy:**
```typescript
useTrendingTopics(courseId: string, timeRange: '7d' | '30d') {
  staleTime: 10 * 60 * 1000,         // 10 minutes (low freshness OK)
  gcTime: 30 * 60 * 1000,            // 30 minutes (very long cache)
  refetchInterval: undefined,        // No polling
}
```

**Rationale:**
- Long stale time (trends don't change minute-to-minute)
- Very long GC time (expensive computation)
- Invalidate only on dashboard refresh or significant events

### Response Templates (Static Data)

**Requirements:**
- Templates rarely change once created
- Need instant access when composing replies
- Pre-populate on login
- Infinite cache (until mutation)

**Query Strategy:**
```typescript
useResponseTemplates(userId: string) {
  staleTime: Infinity,               // Never stale (changes only on mutation)
  gcTime: 60 * 60 * 1000,            // 60 minutes (keep very long)
  refetchInterval: undefined,        // No polling
}
```

**Rationale:**
- Templates are user-created, immutable until edited
- Infinite stale time prevents unnecessary refetches
- Only invalidate on save/delete mutations

### Search Results (Debounced, Short-Lived)

**Requirements:**
- Debounce user input (500ms)
- Cache results per query string
- Short stale time (search results can change quickly)
- Clear cache on navigation away

**Query Strategy:**
```typescript
useSearchQuestions(courseId: string, query: string) {
  enabled: query.length >= 3,        // Only search with 3+ chars
  staleTime: 2 * 60 * 1000,          // 2 minutes (short freshness)
  gcTime: 5 * 60 * 1000,             // 5 minutes (moderate cache)
  refetchInterval: undefined,        // No polling
}
```

**Rationale:**
- Short stale time (search results change as new threads added)
- Debouncing handled in component (not React Query)
- Moderate GC time keeps recent searches cached

---

## Bulk Mutation Patterns

### Challenge: Multiple Thread Updates

**Scenario:** Instructor selects 5 threads and endorses all AI answers

**Naive Approach (Inefficient):**
```typescript
// ❌ BAD: Sequential mutations, 5 API calls
threadIds.forEach(id => endorseMutate({ aiAnswerId: id }));
// Result: 5 × 100ms = 500ms + 5 separate invalidations
```

**Better Approach (Parallel):**
```typescript
// ✅ GOOD: Parallel mutations, 5 simultaneous API calls
await Promise.all(
  threadIds.map(id => endorseMutate({ aiAnswerId: id }))
);
// Result: 100ms (parallel) + 5 separate invalidations
```

**Best Approach (Single Bulk API Call):**
```typescript
// ✅ BEST: Single bulk mutation, 1 API call
const useBulkEndorseAIAnswers = () => {
  return useMutation({
    mutationFn: (input: { aiAnswerIds: string[] }) =>
      api.bulkEndorseAIAnswers(input),

    onMutate: async ({ aiAnswerIds }) => {
      // Optimistically update all affected threads
      const previousData = {};

      for (const aiAnswerId of aiAnswerIds) {
        const threadId = extractThreadId(aiAnswerId);
        const queryKey = queryKeys.thread(threadId);

        await queryClient.cancelQueries({ queryKey });
        previousData[threadId] = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old) => ({
          ...old,
          aiAnswer: {
            ...old.aiAnswer,
            totalEndorsements: old.aiAnswer.totalEndorsements + 3,
            instructorEndorsed: true,
          },
        }));
      }

      return { previousData, aiAnswerIds };
    },

    onError: (err, vars, context) => {
      // Rollback all optimistic updates
      for (const [threadId, data] of Object.entries(context.previousData)) {
        queryClient.setQueryData(queryKeys.thread(threadId), data);
      }
    },

    onSuccess: (data, vars, context) => {
      // Invalidate all affected queries at once
      const courseId = data.courseId; // API returns courseId

      queryClient.invalidateQueries({
        queryKey: queryKeys.courseThreads(courseId)
      });

      // Only invalidate course instructors
      data.instructorIds.forEach(id => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.instructorDashboard(id)
        });
      });
    },
  });
};
```

**Pattern Benefits:**
- Single API call reduces network overhead
- Optimistic updates for all threads (instant feedback)
- Batch invalidation more efficient
- Rollback all or none (transaction-like behavior)

---

## Polling vs. Manual Refresh

### Current Polling Pattern (Notifications)

```typescript
export function useNotifications(userId: string | undefined, courseId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.notifications(userId, courseId) : ["notifications"],
    queryFn: () => api.getNotifications(userId, courseId),
    enabled: !!userId,
    staleTime: 30 * 1000,          // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,    // Poll every 60 seconds
  });
}
```

**Polling Trade-offs:**

| Pro | Con |
|-----|-----|
| ✅ Real-time feel without WebSockets | ❌ Constant background API calls |
| ✅ Simple implementation | ❌ Battery drain on mobile |
| ✅ Works across browser tabs | ❌ Server load (many users × poll rate) |
| ✅ No connection management | ❌ Can miss updates between polls |

**Recommendation for Instructor Dashboard:**

1. **Priority Queue:** Poll every 2 minutes (instructors actively monitoring)
2. **FAQ Clusters:** No polling (invalidate on new thread creation)
3. **Topic Trends:** No polling (manual refresh only)
4. **Templates:** No polling (static data)

**Configuration:**
```typescript
// Priority queue (near-real-time)
refetchInterval: 2 * 60 * 1000  // Poll every 2 minutes

// FAQ clusters (background update)
refetchInterval: undefined      // No polling, invalidate on events

// Topic trends (manual refresh)
refetchInterval: undefined      // No polling, user-initiated only
```

---

## Query Key Design for New Features

### Instructor Insights (Priority Queue)

```typescript
instructorInsights: (userId: string) =>
  ["instructorInsights", userId] as const,
```

**Reasoning:**
- User-scoped (each instructor sees their courses)
- Top-level key (not nested under dashboard)
- Enables surgical invalidation

### Frequently Asked Questions

```typescript
frequentlyAskedQuestions: (courseId: string) =>
  ["frequentlyAskedQuestions", courseId] as const,
```

**Reasoning:**
- Course-scoped (FAQs per course, not global)
- Short name for readability: `faq` vs `frequentlyAskedQuestions`
- Alternative: `faqClusters` if ambiguity exists

**Debate: Should time range be in key?**

Option A: Time range in key
```typescript
frequentlyAskedQuestions: (courseId: string, timeRange: '7d' | '30d') =>
  ["frequentlyAskedQuestions", courseId, timeRange] as const,
```
- ✅ Pro: Separate cache for 7d vs 30d
- ❌ Con: More cache entries, more memory
- ❌ Con: Switching time range always fetches fresh

Option B: Time range in query params (not key)
```typescript
frequentlyAskedQuestions: (courseId: string) =>
  ["frequentlyAskedQuestions", courseId] as const,
// Pass timeRange as API parameter, not in key
```
- ✅ Pro: Single cache entry, less memory
- ✅ Pro: Switching time range uses cache if fresh
- ❌ Con: Can't have separate stale times per range

**Recommendation:** Option B (time range as API param, not in key)

### Trending Topics

```typescript
trendingTopics: (courseId: string, timeRange: '7d' | '30d') =>
  ["trendingTopics", courseId, timeRange] as const,
```

**Reasoning:**
- Course-scoped (trends per course)
- Time range in key (7d and 30d are distinct views)
- Enables separate caching strategies

**Why include time range here but not FAQs?**
- Trends are expensive to compute, cache both ranges
- FAQs cluster logic is identical across time ranges

### Response Templates

```typescript
responseTemplates: (userId: string) =>
  ["responseTemplates", userId] as const,
```

**Reasoning:**
- User-scoped (personal templates)
- Simple key structure (no pagination needed)
- Infinite stale time (templates are static until mutated)

### Search Questions

```typescript
searchQuestions: (courseId: string, query: string) =>
  ["searchQuestions", courseId, query] as const,
```

**Reasoning:**
- Course-scoped (search within course)
- Query in key (each search string cached separately)
- Short stale time (search results change quickly)

**Debate: Should query be normalized?**

Option A: Normalize query (lowercase, trim)
```typescript
searchQuestions: (courseId: string, query: string) =>
  ["searchQuestions", courseId, query.toLowerCase().trim()] as const,
```
- ✅ Pro: "Binary Search" and "binary search" use same cache
- ❌ Con: More complex key factory

Option B: Use raw query
```typescript
searchQuestions: (courseId: string, query: string) =>
  ["searchQuestions", courseId, query] as const,
```
- ✅ Pro: Simple, no normalization logic
- ❌ Con: Case variations create duplicate cache entries

**Recommendation:** Option A (normalize query for better cache hits)

---

## Invalidation Strategy for Instructor Features

### When Threads Are Created

**Affected Queries:**
1. `courseThreads(courseId)` - New thread appears in list
2. `instructorInsights(userId)` - Priority queue updates (if unanswered)
3. `frequentlyAskedQuestions(courseId)` - FAQs may change
4. `trendingTopics(courseId, timeRange)` - Topic frequency changes
5. `instructorDashboard(userId)` - All instructors teaching course

**Invalidation Code:**
```typescript
onSuccess: (result) => {
  const { thread } = result;

  // Surgical: specific course threads
  queryClient.invalidateQueries({
    queryKey: queryKeys.courseThreads(thread.courseId)
  });

  // Surgical: specific course FAQs
  queryClient.invalidateQueries({
    queryKey: queryKeys.frequentlyAskedQuestions(thread.courseId)
  });

  // Surgical: specific course trends (all time ranges)
  queryClient.invalidateQueries({
    queryKey: ["trendingTopics", thread.courseId]
  });

  // Targeted: only instructors for this course
  const course = queryClient.getQueryData(queryKeys.course(thread.courseId));
  course.instructorIds.forEach(instructorId => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorInsights(instructorId)
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorDashboard(instructorId)
    });
  });
}
```

**Performance Impact:**
- Before: Invalidates ALL instructor dashboards (wasteful)
- After: Invalidates only course instructors (efficient)

### When AI Answers Are Endorsed

**Affected Queries:**
1. `thread(threadId)` - Endorsement count changes
2. `courseThreads(courseId)` - Endorsement badge in list
3. `instructorInsights(userId)` - Priority ranking may change
4. `instructorDashboard(userId)` - AI coverage stats

**Invalidation Code:**
```typescript
onSuccess: (data, vars, context) => {
  const { threadId, courseId } = data;

  // Surgical: specific thread
  queryClient.invalidateQueries({
    queryKey: queryKeys.thread(threadId)
  });

  // Surgical: specific course threads
  queryClient.invalidateQueries({
    queryKey: queryKeys.courseThreads(courseId)
  });

  // Targeted: only instructors for this course
  data.instructorIds.forEach(instructorId => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorInsights(instructorId)
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorDashboard(instructorId)
    });
  });
}
```

### When Bulk Actions Complete

**Affected Queries:**
1. `courseThreads(courseId)` - Multiple threads update
2. `instructorInsights(userId)` - Priority queue changes
3. `instructorDashboard(userId)` - Stats may change

**Invalidation Code:**
```typescript
onSuccess: (data, vars, context) => {
  const { courseId, instructorIds } = data;

  // Surgical: course threads (single invalidation for all threads)
  queryClient.invalidateQueries({
    queryKey: queryKeys.courseThreads(courseId)
  });

  // Targeted: only instructors for course
  instructorIds.forEach(instructorId => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorInsights(instructorId)
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.instructorDashboard(instructorId)
    });
  });
}
```

**Optimization:**
- Single `courseThreads` invalidation (not per thread)
- Batch invalidation for instructors (loop once)

### When Templates Are Saved/Deleted

**Affected Queries:**
1. `responseTemplates(userId)` - Template list changes

**Invalidation Code:**
```typescript
onSuccess: (data, vars) => {
  // Surgical: only user's templates
  queryClient.invalidateQueries({
    queryKey: queryKeys.responseTemplates(vars.userId)
  });
}
```

**Optimization:**
- No other queries affected (templates are user-private)

---

## Performance Optimization Opportunities

### 1. Reduce Over-Invalidation

**Current Issue:**
```typescript
// ❌ Invalidates ALL instructor dashboards (every instructor in system)
queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
```

**Solution:**
```typescript
// ✅ Invalidate only course instructors
course.instructorIds.forEach(id => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.instructorDashboard(id)
  });
});
```

**Impact:**
- 10 instructors in system, only 2 teaching course
- Before: 10 refetches (80% wasted)
- After: 2 refetches (0% wasted)

### 2. Pre-populate Template Cache

**Scenario:** Instructor saves new template, immediately wants to use it

**Without Pre-population:**
1. Save template (mutation)
2. Invalidate templates query
3. Navigate to reply form
4. Template list refetches (200-500ms loading)

**With Pre-population:**
```typescript
onSuccess: (newTemplate, vars) => {
  // Add new template to cache immediately
  queryClient.setQueryData(
    queryKeys.responseTemplates(vars.userId),
    (old: Template[]) => [...old, newTemplate]
  );
}
```

**Impact:**
- No loading spinner when using template
- Instant access to newly saved template

### 3. Debounce Search Queries

**Scenario:** Instructor types "binary search algorithm" in search

**Without Debouncing:**
- 24 queries: "b", "bi", "bin", ..., "binary search algorithm"
- 24 × 200ms = 4.8 seconds of API calls

**With Debouncing (Component Level):**
```typescript
const [query, setQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
  }, 500);
  return () => clearTimeout(timer);
}, [query]);

const { data } = useSearchQuestions(courseId, debouncedQuery);
```

**Impact:**
- Only 1 query after user stops typing (500ms delay)
- 96% reduction in API calls

### 4. Batch Invalidations

**Scenario:** Bulk endorse 5 AI answers

**Naive Approach:**
```typescript
// ❌ 5 separate invalidations
threadIds.forEach(id => {
  queryClient.invalidateQueries({ queryKey: queryKeys.thread(id) });
});
```

**Batched Approach:**
```typescript
// ✅ Single batch invalidation
queryClient.invalidateQueries({
  queryKey: queryKeys.courseThreads(courseId)
});
// Individual thread queries will refetch when accessed
```

**Trade-off:**
- Pro: Single invalidation call
- Con: Refetches entire thread list (may be large)
- Recommendation: Batch for bulk actions, individual for single actions

---

## Recommendations Summary

### Query Key Design

| Feature | Query Key | Parameters | Reasoning |
|---------|-----------|------------|-----------|
| Instructor Insights | `instructorInsights` | `(userId)` | User-scoped priority queue |
| FAQ Clusters | `frequentlyAskedQuestions` | `(courseId)` | Course-scoped, time range as API param |
| Trending Topics | `trendingTopics` | `(courseId, timeRange)` | Time range in key for separate caching |
| Response Templates | `responseTemplates` | `(userId)` | User-scoped personal templates |
| Search Questions | `searchQuestions` | `(courseId, query)` | Course + normalized query |

### Cache Configuration

| Feature | Stale Time | GC Time | Polling | Reasoning |
|---------|------------|---------|---------|-----------|
| Instructor Insights | 1 minute | 5 minutes | 2 minutes | Near-real-time priority queue |
| FAQ Clusters | 5 minutes | 10 minutes | None | Medium freshness, expensive |
| Trending Topics | 10 minutes | 30 minutes | None | Low freshness OK, very expensive |
| Response Templates | Infinity | 60 minutes | None | Static until mutated |
| Search Questions | 2 minutes | 5 minutes | None | Short-lived, changes quickly |

### Invalidation Strategy

| Mutation | Invalidates | Scope |
|----------|-------------|-------|
| Create Thread | `courseThreads`, `frequentlyAskedQuestions`, `trendingTopics`, `instructorInsights`, `instructorDashboard` | Course + course instructors |
| Endorse AI | `thread`, `courseThreads`, `instructorInsights`, `instructorDashboard` | Thread + course + course instructors |
| Bulk Endorse | `courseThreads`, `instructorInsights`, `instructorDashboard` | Course + course instructors |
| Save Template | `responseTemplates` | User only |
| Delete Template | `responseTemplates` | User only |

### Optimistic Updates

| Mutation | Strategy | Rollback |
|----------|----------|----------|
| Single Endorsement | Optimistic update | Yes |
| Bulk Endorsement | Optimistic update (all threads) | Yes |
| Save Template | Pre-populate cache | No (append to list) |
| Delete Template | Optimistic remove | Yes |

---

## Open Questions & Risks

### Questions

1. **Should FAQ time range be in query key or API param?**
   - **Recommendation:** API param (simpler caching)

2. **Should search query be normalized in key?**
   - **Recommendation:** Yes (better cache hits)

3. **Should bulk mutations use single API call or parallel?**
   - **Recommendation:** Single API call (better performance)

4. **Should priority queue poll continuously or only when tab active?**
   - **Recommendation:** Only when active (use document visibility API)

### Risks

1. **Performance Risk: Over-polling**
   - Polling priority queue every 2 minutes may increase server load
   - **Mitigation:** Only poll when dashboard tab is active

2. **UX Risk: Stale FAQ clusters**
   - 5-minute stale time may show outdated clusters
   - **Mitigation:** Show "last updated" timestamp, manual refresh button

3. **Complexity Risk: Bulk optimistic updates**
   - Rolling back 10+ thread updates on error is complex
   - **Mitigation:** Use transaction-like all-or-nothing rollback

4. **Cache Consistency Risk: Invalidating only course instructors**
   - If course instructors change, some dashboards won't update
   - **Mitigation:** Invalidate instructor list cache on enrollment changes

---

## Implementation Priority

### Phase 1: Core Hooks (Week 1)
1. ✅ `useInstructorInsights` - Priority queue with polling
2. ✅ `useFrequentlyAskedQuestions` - FAQ clusters
3. ✅ `useResponseTemplates` - Template management
4. ✅ `useSaveResponseTemplate` - Save mutation
5. ✅ `useDeleteResponseTemplate` - Delete mutation

### Phase 2: Search & Trends (Week 2)
6. ✅ `useSearchQuestions` - Debounced search
7. ✅ `useTrendingTopics` - Topic trends
8. ✅ Update invalidation logic (targeted instructor invalidation)

### Phase 3: Bulk Actions (Week 3)
9. ✅ `useBulkEndorseAIAnswers` - Bulk endorsement
10. ✅ Optimistic updates for bulk actions
11. ✅ Performance testing and optimization

---

**Status:** Research Complete ✓
**Next Step:** Create hooks design plan (`plans/hooks-design.md`)

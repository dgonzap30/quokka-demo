# React Query Patterns for Course Materials - Research

**Date:** 2025-10-16
**Task:** Design React Query hooks for course materials data fetching
**Researcher:** React Query Strategist

---

## Executive Summary

This research document analyzes the existing React Query patterns in `lib/api/hooks.ts` to design optimal data fetching hooks for course materials. The goal is to balance performance (avoid loading all materials upfront), UX (materials available when needed), and caching (reuse data across modal opens).

**Key Findings:**
- Existing patterns follow a consistent hierarchical query key structure
- Stale time varies by data mutability: 2 min (volatile), 5 min (semi-static), 10 min (static)
- Enabled conditions prevent unnecessary fetches
- Optimistic updates used for mutations with high user interaction
- No existing course materials API - needs full design

---

## Current React Query Patterns Analysis

### 1. Query Key Architecture

**Pattern:** Hierarchical, parameterized query keys using factory functions

```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  // ...
};
```

**Observations:**
- All query keys use `as const` for TypeScript type safety
- Single-parameter keys: `["entityType", id]`
- Multi-parameter keys: `["entityType", id1, id2]`
- Consistent naming: entity type + descriptive suffix
- Enables precise invalidation via `queryKey: queryKeys.courseThreads(courseId)`

**Implications for Course Materials:**
- Follow pattern: `courseMaterials: (courseId: string) => ["courseMaterials", courseId]`
- For search: `searchCourseMaterials: (courseId: string, query: string) => ["searchCourseMaterials", courseId, query]`
- Enables surgical invalidation when materials are updated (rare in demo)

### 2. Stale Time Strategy

**Pattern:** Stale time varies by data mutability and freshness requirements

| Data Type | Stale Time | Rationale |
|-----------|------------|-----------|
| Threads | 2 min | Volatile - new posts, status changes |
| Course data | 10 min | Static - rarely changes |
| AI answers | 10 min | Immutable once generated |
| User session | 5 min | Semi-static - occasionally updated |
| Notifications | 30 sec | Real-time - polling every 1 min |
| Instructor insights | 1 min | Near real-time - priority changes |
| Response templates | Infinity | Immutable until user edits |

**Implications for Course Materials:**
- **Course materials: 10 minutes** - Static data (lectures, slides, assignments rarely change)
- Materials are immutable in demo context (no upload/edit features)
- Long stale time reduces unnecessary refetches across modal opens
- Cache time (gcTime): 15 minutes to keep in memory longer than stale time

### 3. Enabled Conditions

**Pattern:** Prevent fetches when dependencies are missing

```typescript
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.course(courseId) : ["course"],
    queryFn: () => (courseId ? api.getCourse(courseId) : Promise.resolve(null)),
    enabled: !!courseId, // ← Prevents fetch when courseId is undefined
    staleTime: 10 * 60 * 1000,
  });
}
```

**Observations:**
- All hooks with optional parameters use `enabled: !!param`
- Query key fallback when param is undefined: `["entityType"]` (never fetches)
- Query function returns `Promise.resolve(null)` when disabled
- Prevents unnecessary 404s or errors

**Implications for Course Materials:**
- `useCourseMaterials(courseId)` must use `enabled: !!courseId`
- `useSearchCourseMaterials(courseId, query)` must check both params: `enabled: !!courseId && query.length >= 3`
- Prevents fetches during modal mount when courseId is still undefined

### 4. Mutation Patterns

**Pattern:** Invalidate affected queries on success

```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }) => api.createThread(input, authorId),
    onSuccess: (result) => {
      const { thread } = result;

      // Invalidate course threads query
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });

      // Invalidate dashboards
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}
```

**Observations:**
- Surgical invalidation: only affected queries are invalidated
- Broad prefix invalidation for dashboards: `{ queryKey: ["studentDashboard"] }`
- No optimistic updates for create operations (server authoritative)
- Optimistic updates used for endorsements (instant UI feedback)

**Implications for Course Materials:**
- No mutations expected in demo (materials are read-only)
- If materials API is extended later, invalidate: `queryKeys.courseMaterials(courseId)`
- Search queries should NOT be invalidated on material changes (expensive)

### 5. Optimistic Updates

**Pattern:** Used for high-interaction mutations with predictable outcomes

```typescript
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => api.endorseAIAnswer(input),

    // Optimistic update
    onMutate: async ({ aiAnswerId, userId, isInstructor }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousThread = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        // Update endorsement counts immediately
      });

      return { previousThread, threadId };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(queryKey, context.previousThread);
      }
    },

    // Refetch on success
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

**Observations:**
- Only used for endorsements (instant UI feedback critical)
- Cancel outgoing queries to prevent race conditions
- Store previous state in context for rollback
- Still invalidate on success to ensure server truth
- Not used for create operations (too complex)

**Implications for Course Materials:**
- No optimistic updates needed (read-only data)
- If search is implemented, no optimistic updates (server authoritative)

### 6. Parallel Queries

**Pattern:** Multiple independent queries in components

```typescript
// In a component
const { data: user } = useCurrentUser();
const { data: courses } = useUserCourses(user?.id);
const { data: dashboard } = useStudentDashboard(user?.id);
```

**Observations:**
- React Query automatically deduplicates identical queries
- Enabled conditions prevent dependent queries from firing too early
- Each hook manages its own loading/error state
- No manual orchestration needed

**Implications for Course Materials:**
- `useMultiCourseMaterials(courseIds[])` should use parallel queries internally
- React Query's `useQueries()` hook for dynamic lists
- Each query can succeed/fail independently

### 7. Search Query Pattern

**Pattern:** Search uses `useQuery` (not mutation) for caching and deduplication

```typescript
export function useSearchQuestions(courseId: string | undefined, query: string) {
  return useQuery({
    queryKey: courseId && query.length >= 3
      ? queryKeys.questionSearch(courseId, query)
      : ["questionSearch"],
    queryFn: () =>
      courseId && query.length >= 3
        ? api.searchQuestions({ courseId, query })
        : Promise.resolve([]),
    enabled: !!courseId && query.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

**Observations:**
- Minimum query length validation: `query.length >= 3`
- Query key includes search term: `["questionSearch", courseId, query]`
- Enabled condition prevents premature fetches
- Stale time shorter than static data (2 min vs 10 min)
- Returns empty array when disabled

**Implications for Course Materials Search:**
- Follow same pattern: `searchCourseMaterials(courseId, query)`
- Query key: `["searchCourseMaterials", courseId, query]`
- Minimum query length: 3 characters
- Stale time: 5 minutes (materials don't change, but queries are expensive)

---

## Prefetching Opportunities

### 1. Modal Open Prefetch

**Scenario:** User opens AI assistant modal → AI needs course materials

**Current Behavior:**
- Modal opens → AI context loads → User asks question → Hook fetches materials → Delay

**Optimal Behavior:**
- Modal opens → Prefetch materials for enrolled courses → User asks question → Materials already cached

**Implementation:**
```typescript
const queryClient = useQueryClient();

// On modal open
useEffect(() => {
  if (isOpen && enrolledCourseIds.length > 0) {
    enrolledCourseIds.forEach(courseId => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.courseMaterials(courseId),
        queryFn: () => api.getCourseMaterials(courseId),
        staleTime: 10 * 60 * 1000,
      });
    });
  }
}, [isOpen, enrolledCourseIds, queryClient]);
```

**Trade-offs:**
- **Pro:** Materials available instantly when AI needs them
- **Pro:** Prefetch happens in background (non-blocking)
- **Con:** Network overhead if user closes modal without asking
- **Decision:** Worth it - high likelihood of AI needing materials

### 2. Course Page Prefetch

**Scenario:** User navigates to course page → Might open AI assistant

**Current Behavior:**
- No prefetching → Cold start when modal opens

**Optimal Behavior:**
- Course page mounts → Prefetch materials for current course → Modal opens → Materials cached

**Implementation:**
```typescript
// In course page component
const { data: course } = useCourse(courseId);

useEffect(() => {
  if (courseId) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.courseMaterials(courseId),
      queryFn: () => api.getCourseMaterials(courseId),
      staleTime: 10 * 60 * 1000,
    });
  }
}, [courseId, queryClient]);
```

**Trade-offs:**
- **Pro:** Instant AI assistant when user needs it
- **Con:** Prefetch might be wasted if user never opens AI modal
- **Decision:** Defer to parent - not critical for MVP

---

## Performance Considerations

### 1. Avoid Loading All Materials Upfront

**Problem:** Loading materials for 5+ enrolled courses = 5 API calls on dashboard mount

**Solution:** Lazy loading with prefetching on demand

```typescript
// ❌ BAD: Load all materials on dashboard mount
const { data: materials1 } = useCourseMaterials(course1.id);
const { data: materials2 } = useCourseMaterials(course2.id);
// ... 5+ queries

// ✅ GOOD: Load only when needed
const { data: materials } = useCourseMaterials(currentCourseId);
// + Prefetch on modal open
```

### 2. Debounced Search

**Problem:** Search query fires on every keystroke

**Solution:** Debounce search input at component level (not hook level)

```typescript
// In component
const [searchQuery, setSearchQuery] = useState("");
const debouncedQuery = useDebounce(searchQuery, 300); // 300ms delay

const { data: results } = useSearchCourseMaterials(courseId, debouncedQuery);
```

**Why not debounce in hook?**
- React Query already deduplicates identical queries
- Debouncing in hook prevents caching of intermediate results
- Component-level debounce is more flexible

### 3. Cache Reuse Across Modal Opens

**Scenario:** User opens modal → Closes → Opens again → Same materials fetched

**Solution:** Long stale time (10 min) + long cache time (15 min)

```typescript
export function useCourseMaterials(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseMaterials(courseId) : ["courseMaterials"],
    queryFn: () => courseId ? api.getCourseMaterials(courseId) : Promise.resolve(null),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,  // 10 minutes - materials rarely change
    gcTime: 15 * 60 * 1000,     // 15 minutes - keep in memory
  });
}
```

**Result:** Second modal open uses cached data (no refetch)

---

## Course Materials API Design (Missing)

### Current State

**No API endpoint exists for course materials.** Current citations in AI answers are hardcoded:

```typescript
// lib/api/client.ts - generateCitations()
const courseMaterials: Record<string, Array<{ source: string; type: CitationSourceType; keywords: string[] }>> = {
  CS: [
    { source: "Lecture 5: Binary Search & Sorting Algorithms", type: "lecture", keywords: [...] },
    { source: "Introduction to Algorithms (CLRS) - Chapter 3", type: "textbook", keywords: [...] },
    // ...
  ],
  MATH: [
    { source: "Lecture 10: Integration Techniques", type: "lecture", keywords: [...] },
    // ...
  ],
};
```

### Required API Methods

**1. Get Course Materials**

```typescript
/**
 * Get all materials for a course
 */
async getCourseMaterials(courseId: string): Promise<CourseMaterial[]>
```

**2. Search Course Materials (Optional for MVP)**

```typescript
/**
 * Search materials within a course
 */
async searchCourseMaterials(input: SearchCourseMaterialsInput): Promise<CourseMaterial[]>

interface SearchCourseMaterialsInput {
  courseId: string;
  query: string;
  types?: CitationSourceType[]; // Filter by type
}
```

### Required Types

```typescript
/**
 * Course material (lecture, slide, reading, etc.)
 */
interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: CitationSourceType;
  content: string;          // Full text content
  keywords: string[];       // For search/matching
  url?: string;             // Optional link
  createdAt: string;
}
```

**Location:** `lib/models/types.ts` (needs to be added)

---

## Recommendations

### 1. Query Key Strategy

```typescript
const queryKeys = {
  // ...existing keys
  courseMaterials: (courseId: string) => ["courseMaterials", courseId] as const,
  searchCourseMaterials: (courseId: string, query: string) =>
    ["searchCourseMaterials", courseId, query] as const,
};
```

### 2. Stale Time Recommendations

| Hook | Stale Time | Rationale |
|------|------------|-----------|
| `useCourseMaterials` | 10 min | Static - materials don't change |
| `useMultiCourseMaterials` | 10 min | Same as single course |
| `useSearchCourseMaterials` | 5 min | Expensive query, but static results |

### 3. Hook Signatures

```typescript
// Single course materials
useCourseMaterials(courseId: string | undefined): UseQueryResult<CourseMaterial[] | null>

// Multiple courses (parallel queries)
useMultiCourseMaterials(courseIds: string[]): {
  materials: Record<string, CourseMaterial[]>;
  isLoading: boolean;
  errors: Record<string, Error>;
}

// Search materials
useSearchCourseMaterials(courseId: string | undefined, query: string): UseQueryResult<CourseMaterial[]>
```

### 4. Prefetching Strategy

**High Priority:**
- Prefetch enrolled courses on modal open

**Low Priority (Defer):**
- Prefetch on course page mount
- Prefetch on dashboard mount

### 5. Invalidation Strategy

**When to invalidate:**
- Never in demo (materials are read-only)

**If materials API is extended:**
- Invalidate `courseMaterials(courseId)` after material upload/edit/delete
- Do NOT invalidate search queries (expensive, let stale time handle it)

---

## Related Files

- **`lib/api/hooks.ts`** - Add new course materials hooks
- **`lib/api/client.ts`** - Add `getCourseMaterials()` and `searchCourseMaterials()` API methods
- **`lib/models/types.ts`** - Add `CourseMaterial` type
- **`components/ai/quokka-assistant-modal.tsx`** - Use hooks for AI context

---

## Next Steps

1. **Mock API Designer:** Design `getCourseMaterials()` API method with mock data
2. **Type Safety Guardian:** Define `CourseMaterial` type in `lib/models/types.ts`
3. **React Query Strategist (this):** Design hook implementation plan
4. **Parent Agent:** Implement hooks, API methods, and types

---

## Questions for Clarification

1. Should search be implemented in MVP, or defer to later phase?
   - **Recommendation:** Defer - AI can use full materials for now
2. Should materials be prefetched on dashboard mount?
   - **Recommendation:** No - only prefetch on modal open
3. Should materials support pagination?
   - **Recommendation:** No - demo data is small, full fetch is fine

---

**Research Complete:** Ready to proceed with implementation plan.

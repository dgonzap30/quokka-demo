# React Query Hooks Implementation Plan - Course Materials

**Date:** 2025-10-16
**Task:** Design React Query hooks for course materials data fetching
**Planner:** React Query Strategist

---

## Executive Summary

This plan provides complete specifications for implementing three React Query hooks for course materials data fetching: `useCourseMaterials`, `useMultiCourseMaterials`, and `useSearchCourseMaterials`. These hooks follow existing project patterns, optimize for performance, and ensure materials are efficiently cached across modal opens.

**Key Design Decisions:**
1. **10-minute stale time** - Materials are static in demo
2. **Prefetch on modal open** - Materials available instantly when AI needs them
3. **Enabled conditions** - Prevent unnecessary fetches
4. **No search in MVP** - Defer to later phase (AI can use full materials)

---

## Prerequisites

Before implementing these hooks, the following must be completed by other sub-agents:

### 1. Mock API Designer

**Deliverable:** `getCourseMaterials()` API method in `lib/api/client.ts`

**Signature:**
```typescript
/**
 * Get all course materials for a course
 *
 * @param courseId - Course ID to fetch materials for
 * @returns Array of course materials (lectures, slides, readings, etc.)
 */
async getCourseMaterials(courseId: string): Promise<CourseMaterial[]>
```

**Behavior:**
- Returns all materials for the given course
- Simulates network delay: 200-500ms
- Returns empty array if courseId doesn't exist (no error thrown)
- Mock data should include 5-10 materials per course with varied types

**Example Return:**
```typescript
[
  {
    id: "material-1",
    courseId: "course-cs101",
    title: "Lecture 5: Binary Search & Sorting Algorithms",
    type: "lecture",
    content: "Binary search is an efficient algorithm...",
    keywords: ["binary", "search", "sorting", "algorithm", "complexity"],
    url: undefined, // Mock - no real link
    createdAt: "2025-09-01T10:00:00Z"
  },
  // ... more materials
]
```

### 2. Type Safety Guardian

**Deliverable:** `CourseMaterial` type in `lib/models/types.ts`

**Type Definition:**
```typescript
/**
 * Course material (lecture, slide, reading, assignment, etc.)
 *
 * Used by AI assistant to provide context-aware answers with
 * citations to actual course content.
 */
export interface CourseMaterial {
  /** Unique material identifier */
  id: string;

  /** Course this material belongs to */
  courseId: string;

  /** Material title (e.g., "Lecture 5: Binary Search") */
  title: string;

  /** Type of material (lecture, textbook, slides, etc.) */
  type: CitationSourceType;

  /** Full text content of the material */
  content: string;

  /** Keywords for search and AI matching */
  keywords: string[];

  /** Optional URL to material (mock for demo) */
  url?: string;

  /** ISO 8601 timestamp when material was created */
  createdAt: string;
}

/**
 * Input for searching course materials (future feature)
 */
export interface SearchCourseMaterialsInput {
  courseId: string;
  query: string;
  types?: CitationSourceType[];
}
```

**Location:** Add after `Citation` interface (line ~265)

**Note:** `CitationSourceType` already exists, reuse it

---

## Hook 1: useCourseMaterials

### Purpose

Fetch all course materials for a single course. Primary hook for AI assistant to access course content.

### Signature

```typescript
/**
 * Get course materials for a single course
 *
 * @param courseId - Course ID (optional, enables/disables query)
 * @returns React Query result with course materials array
 *
 * @example
 * const { data: materials, isLoading } = useCourseMaterials(courseId);
 * if (materials) {
 *   // AI can use materials for context
 * }
 */
export function useCourseMaterials(
  courseId: string | undefined
): UseQueryResult<CourseMaterial[] | null>
```

### Implementation

**File:** `lib/api/hooks.ts`

**Location:** Add after `useCourseInsights` (line ~230)

**Code:**
```typescript
/**
 * Get course materials for a single course
 */
export function useCourseMaterials(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseMaterials(courseId) : ["courseMaterials"],
    queryFn: () => (courseId ? api.getCourseMaterials(courseId) : Promise.resolve(null)),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes (materials rarely change)
    gcTime: 15 * 60 * 1000,    // 15 minutes (keep in memory longer)
  });
}
```

### Query Key

**Add to `queryKeys` object (line ~22):**
```typescript
const queryKeys = {
  // ...existing keys
  courseMaterials: (courseId: string) => ["courseMaterials", courseId] as const,
};
```

### Configuration Rationale

| Property | Value | Rationale |
|----------|-------|-----------|
| `staleTime` | 10 min | Materials are static in demo, match `useCourse` |
| `gcTime` | 15 min | Keep in memory across modal opens |
| `enabled` | `!!courseId` | Prevent fetch when courseId is undefined |
| `queryFn` | Returns `null` when disabled | Consistent with `useCourse` pattern |

### Usage Example

```typescript
// In AI assistant modal
const { data: materials, isLoading, error } = useCourseMaterials(currentCourseId);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (!materials || materials.length === 0) return <EmptyState />;

// AI can now use materials for context
const relevantMaterials = findRelevantMaterials(materials, userQuestion);
```

### Test Scenarios

1. **Valid courseId:**
   - Returns array of materials
   - Caches for 10 minutes
   - Second fetch uses cache

2. **Undefined courseId:**
   - Query disabled
   - No API call made
   - Returns `null`

3. **Invalid courseId:**
   - API returns empty array `[]`
   - No error thrown

4. **Cache reuse:**
   - User opens modal → Fetches materials
   - User closes modal → Keeps in cache (15 min)
   - User reopens modal → Uses cached data (no refetch)

---

## Hook 2: useMultiCourseMaterials

### Purpose

Fetch materials for multiple courses in parallel. Used when AI assistant needs context from all enrolled courses (dashboard view).

### Signature

```typescript
/**
 * Get course materials for multiple courses in parallel
 *
 * Uses React Query's `useQueries` to fetch materials for multiple
 * courses simultaneously. Each query can succeed/fail independently.
 *
 * @param courseIds - Array of course IDs to fetch materials for
 * @returns Object with materials by courseId, loading state, and errors
 *
 * @example
 * const { materials, isLoading, errors } = useMultiCourseMaterials([
 *   "course-cs101",
 *   "course-math221"
 * ]);
 *
 * materials["course-cs101"] // CourseMaterial[] | undefined
 * isLoading // true if any query is loading
 * errors["course-cs101"] // Error | undefined
 */
export function useMultiCourseMaterials(courseIds: string[]): {
  materials: Record<string, CourseMaterial[]>;
  isLoading: boolean;
  errors: Record<string, Error>;
}
```

### Implementation

**File:** `lib/api/hooks.ts`

**Location:** Add after `useCourseMaterials`

**Code:**
```typescript
/**
 * Get course materials for multiple courses in parallel
 */
export function useMultiCourseMaterials(courseIds: string[]) {
  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: queryKeys.courseMaterials(courseId),
      queryFn: () => api.getCourseMaterials(courseId),
      enabled: !!courseId,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    })),
  });

  // Aggregate results
  const materials: Record<string, CourseMaterial[]> = {};
  const errors: Record<string, Error> = {};
  let isLoading = false;

  results.forEach((result, index) => {
    const courseId = courseIds[index];

    if (result.isLoading) {
      isLoading = true;
    }

    if (result.data) {
      materials[courseId] = result.data;
    }

    if (result.error) {
      errors[courseId] = result.error as Error;
    }
  });

  return { materials, isLoading, errors };
}
```

### Configuration Rationale

| Property | Value | Rationale |
|----------|-------|-----------|
| `useQueries` | React Query hook | Handles parallel queries efficiently |
| `staleTime` | 10 min | Same as single course materials |
| `enabled` | `!!courseId` | Skip invalid courseIds |
| Return object | Aggregated results | Easy to consume in components |

### Usage Example

```typescript
// In AI assistant modal (dashboard view)
const { data: user } = useCurrentUser();
const { data: enrolledCourses } = useUserCourses(user?.id);

const enrolledCourseIds = enrolledCourses?.map((c) => c.id) || [];
const { materials, isLoading, errors } = useMultiCourseMaterials(enrolledCourseIds);

// AI can now use materials from all enrolled courses
if (!isLoading) {
  const allMaterials = Object.values(materials).flat();
  const relevantMaterials = findRelevantMaterials(allMaterials, userQuestion);
}
```

### Test Scenarios

1. **Multiple valid courseIds:**
   - Fetches all courses in parallel
   - Returns materials by courseId
   - Caches each course independently

2. **Empty courseIds array:**
   - Returns empty materials object
   - isLoading = false
   - No API calls made

3. **Mixed valid/invalid courseIds:**
   - Valid courses return materials
   - Invalid courses return empty arrays
   - No errors thrown

4. **One course fails:**
   - Other courses still succeed
   - Error recorded in errors object
   - Partial data available

---

## Hook 3: useSearchCourseMaterials (Deferred to Phase 2)

### Status: **NOT IMPLEMENTED IN MVP**

### Rationale

1. **AI doesn't need search** - AI can analyze full materials array (10-20 items per course)
2. **Performance not critical** - Materials are small, full scan is fast
3. **Complexity vs value** - Search adds complexity without immediate benefit
4. **Defer to Phase 2** - Can add later if needed

### Future Implementation (Reference)

**If search is needed later, follow this pattern:**

```typescript
/**
 * Search course materials by query string
 */
export function useSearchCourseMaterials(
  courseId: string | undefined,
  query: string
) {
  return useQuery({
    queryKey:
      courseId && query.length >= 3
        ? queryKeys.searchCourseMaterials(courseId, query)
        : ["searchCourseMaterials"],
    queryFn: () =>
      courseId && query.length >= 3
        ? api.searchCourseMaterials({ courseId, query })
        : Promise.resolve([]),
    enabled: !!courseId && query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes (expensive query)
    gcTime: 10 * 60 * 1000,
  });
}
```

**Query Key (add to queryKeys):**
```typescript
searchCourseMaterials: (courseId: string, query: string) =>
  ["searchCourseMaterials", courseId, query] as const,
```

**API Method (add to client.ts):**
```typescript
async searchCourseMaterials(input: SearchCourseMaterialsInput): Promise<CourseMaterial[]> {
  await delay();
  const materials = await this.getCourseMaterials(input.courseId);

  // Filter by query and type
  const queryKeywords = extractKeywords(input.query);
  return materials.filter((material) => {
    // Type filter
    if (input.types && !input.types.includes(material.type)) {
      return false;
    }

    // Keyword match
    const materialKeywords = material.keywords;
    const matches = queryKeywords.filter((k) => materialKeywords.includes(k));
    return matches.length > 0;
  });
}
```

---

## Prefetching Strategy

### Where to Prefetch

**High Priority: AI Assistant Modal Open**

When the modal opens, prefetch materials for all enrolled courses so they're available when the user asks a question.

**Implementation:**

**File:** `components/ai/quokka-assistant-modal.tsx`

**Location:** Add `useEffect` after modal state initialization

**Code:**
```typescript
// Prefetch course materials on modal open
const queryClient = useQueryClient();
const { data: user } = useCurrentUser();
const { data: enrolledCourses } = useUserCourses(user?.id);

useEffect(() => {
  if (isOpen && enrolledCourses && enrolledCourses.length > 0) {
    enrolledCourses.forEach((course) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.courseMaterials(course.id),
        queryFn: () => api.getCourseMaterials(course.id),
        staleTime: 10 * 60 * 1000,
      });
    });
  }
}, [isOpen, enrolledCourses, queryClient]);
```

**Behavior:**
- Runs when modal opens (`isOpen = true`)
- Prefetches materials for all enrolled courses
- Prefetch is non-blocking (happens in background)
- If materials already cached, no refetch occurs
- When user asks question, materials are immediately available

**Trade-offs:**
- **Pro:** Instant AI responses (no loading state for materials)
- **Pro:** Prefetch happens once per modal open
- **Con:** Network overhead if user closes modal without asking
- **Decision:** Worth it - high likelihood of AI needing materials

### Low Priority: Course Page Mount (Deferred)

**Status:** Not implemented in MVP (defer to later)

**Rationale:**
- Not all users open AI assistant on course page
- Prefetch might be wasted bandwidth
- Modal prefetch is sufficient for now

**Future Implementation (Reference):**
```typescript
// In course page component
const queryClient = useQueryClient();

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

---

## Invalidation Strategy

### Current Implementation (MVP)

**No invalidation needed** - Materials are read-only in demo.

### Future Implementation (If materials API is extended)

**When to invalidate:**
- After instructor uploads new material
- After instructor edits existing material
- After instructor deletes material

**How to invalidate:**
```typescript
// After material upload/edit/delete mutation
queryClient.invalidateQueries({
  queryKey: queryKeys.courseMaterials(courseId)
});
```

**Do NOT invalidate:**
- Search queries (expensive, let stale time handle it)
- Other courses (surgical invalidation only)

---

## Performance Optimizations

### 1. Avoid Loading All Materials Upfront

**Problem:** Fetching materials for 5+ enrolled courses on dashboard mount

**Solution:**
- Don't call `useMultiCourseMaterials` on dashboard mount
- Only fetch when AI assistant modal opens (prefetch strategy)
- Modal prefetch happens once, cached for 10 minutes

### 2. Cache Reuse Across Modal Opens

**Problem:** User opens modal multiple times, materials refetched each time

**Solution:**
- Long stale time: 10 minutes
- Long gc time: 15 minutes
- Second modal open uses cached data (no refetch)

**Example:**
```
Time 0:00 - User opens modal → Prefetch materials → Materials cached
Time 0:01 - User closes modal → Materials stay in cache
Time 0:05 - User reopens modal → Uses cached materials (no fetch)
Time 0:12 - User opens modal again → Cache expired → Refetches
```

### 3. Parallel Queries for Multiple Courses

**Problem:** Sequential fetches would be slow

**Solution:**
- `useQueries` hook fetches all courses in parallel
- Total time = slowest query (not sum of all queries)

**Example:**
```
Sequential: 300ms + 300ms + 300ms = 900ms
Parallel:   max(300ms, 300ms, 300ms) = 300ms
```

### 4. Enabled Conditions Prevent Wasteful Fetches

**Problem:** Fetching materials when courseId is undefined

**Solution:**
- `enabled: !!courseId` prevents fetch
- No unnecessary 404s or errors
- Clean loading states

---

## Error Handling

### API Error Handling

**Scenario 1: Network error**
```typescript
const { data, error, isLoading } = useCourseMaterials(courseId);

if (error) {
  return (
    <div className="text-danger">
      Failed to load course materials. Please try again.
    </div>
  );
}
```

**Scenario 2: Course not found**
```typescript
// API returns empty array (no error thrown)
if (data && data.length === 0) {
  return (
    <div className="text-muted">
      No course materials available for this course.
    </div>
  );
}
```

**Scenario 3: Partial failure in multi-course fetch**
```typescript
const { materials, errors } = useMultiCourseMaterials(courseIds);

// Some courses succeeded, some failed
Object.entries(errors).forEach(([courseId, error]) => {
  console.error(`Failed to load materials for ${courseId}:`, error);
});

// Use partial data
const availableMaterials = Object.values(materials).flat();
```

### Graceful Degradation

**AI assistant should work even without materials:**

```typescript
const { data: materials, isLoading } = useCourseMaterials(courseId);

// AI can still respond without materials (fallback mode)
if (isLoading) {
  aiContext.materials = [];
  aiContext.materialsAvailable = false;
} else if (materials && materials.length > 0) {
  aiContext.materials = materials;
  aiContext.materialsAvailable = true;
} else {
  aiContext.materials = [];
  aiContext.materialsAvailable = false;
}
```

---

## Implementation Checklist

### Prerequisites (Other Sub-Agents)

- [ ] Mock API Designer: Implement `getCourseMaterials()` in `lib/api/client.ts`
- [ ] Type Safety Guardian: Add `CourseMaterial` type to `lib/models/types.ts`
- [ ] Type Safety Guardian: Add `SearchCourseMaterialsInput` type (future)

### Hook Implementation (Parent Agent)

- [ ] Add `courseMaterials` query key to `queryKeys` object (line ~22)
- [ ] Implement `useCourseMaterials` hook (after `useCourseInsights`)
- [ ] Implement `useMultiCourseMaterials` hook (after `useCourseMaterials`)
- [ ] Add import for `CourseMaterial` type from `@/lib/models/types`

### Prefetching (Parent Agent)

- [ ] Add prefetch logic to `components/ai/quokka-assistant-modal.tsx`
- [ ] Import `useQueryClient` from `@tanstack/react-query`
- [ ] Test prefetch triggers on modal open

### AI Assistant Integration (Component Architect)

- [ ] Update AI assistant to use `useMultiCourseMaterials` on dashboard
- [ ] Update AI assistant to use `useCourseMaterials` on course page
- [ ] Add loading state handling
- [ ] Add error state handling
- [ ] Test AI responses with/without materials

### Testing

- [ ] Verify materials cached for 10 minutes
- [ ] Verify second modal open uses cache
- [ ] Verify prefetch happens on modal open
- [ ] Verify enabled condition prevents fetches
- [ ] Verify multi-course fetch works in parallel
- [ ] Verify graceful degradation without materials

---

## File Paths

| File | Purpose | Changes |
|------|---------|---------|
| `lib/api/hooks.ts` | React Query hooks | Add `useCourseMaterials`, `useMultiCourseMaterials` |
| `lib/api/client.ts` | Mock API client | Add `getCourseMaterials()` (by Mock API Designer) |
| `lib/models/types.ts` | Type definitions | Add `CourseMaterial` type (by Type Safety Guardian) |
| `components/ai/quokka-assistant-modal.tsx` | AI modal | Add prefetch logic on modal open |

---

## Success Criteria

### Functional Requirements

- [ ] `useCourseMaterials` returns materials for a single course
- [ ] `useMultiCourseMaterials` returns materials for multiple courses in parallel
- [ ] Materials are cached for 10 minutes
- [ ] Prefetch triggers on modal open
- [ ] Second modal open uses cached data (no refetch)
- [ ] Enabled conditions prevent fetches when courseId is undefined
- [ ] No console errors in dev or prod builds

### Performance Requirements

- [ ] Materials available instantly on second modal open (cache hit)
- [ ] Multi-course fetch completes in <500ms (parallel queries)
- [ ] No unnecessary refetches during user session
- [ ] Prefetch doesn't block modal open (non-blocking)

### Type Safety Requirements

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All hooks have correct return types
- [ ] `CourseMaterial` type properly exported from `types.ts`

### UX Requirements

- [ ] Loading state shown while fetching materials
- [ ] Error state shown if fetch fails
- [ ] AI assistant works gracefully without materials (fallback)
- [ ] No flash of loading content on cached data

---

## Questions for Parent Agent

1. **Prefetch scope:** Should we prefetch on course page mount, or only on modal open?
   - **Recommendation:** Only modal open (defer course page prefetch to later)

2. **Search implementation:** Should we implement `useSearchCourseMaterials` now?
   - **Recommendation:** No - defer to Phase 2 (AI can use full materials)

3. **Error handling:** Should we retry failed fetches automatically?
   - **Recommendation:** No - let React Query's default retry (3 attempts) handle it

4. **Cache size:** Should we limit the number of courses prefetched?
   - **Recommendation:** No - typical student has 3-5 courses, negligible memory

---

## Related Context

- **Research:** `doccloud/tasks/context-aware-ai/research/react-query-patterns-materials.md`
- **Task Context:** `doccloud/tasks/context-aware-ai/context.md`
- **Mock API Plan:** To be created by Mock API Designer
- **Types Plan:** To be created by Type Safety Guardian

---

**Plan Complete:** Ready for parent agent to implement hooks and coordinate with other sub-agents.

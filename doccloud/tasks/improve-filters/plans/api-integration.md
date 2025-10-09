# Implementation Plan: API Integration for AI Answer Filtering

**Date:** 2025-10-08
**Task:** Improve Thread Filters
**Focus:** Integrate AI answer data access into filter logic

---

## Recommended Approach

**Extend `getCourseThreads()` to return `ThreadWithAIAnswer[]`** - embedding AI answer data in thread list response.

**Rationale:**
- Single network request (fastest UX)
- Consistent with existing `useThread()` pattern
- Simple filter logic (direct property access)
- Leverages existing `ThreadWithAIAnswer` type
- No new hooks or API methods required

---

## Step-by-Step Implementation

### Step 1: Update Type Imports in API Client

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

**Action:** Add `ThreadWithAIAnswer` to imports (line 26)

**Before:**
```typescript
import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  AuthError,
  Course,
  Thread,
  Post,
  // ... other imports
} from "@/lib/models/types";
```

**After:**
```typescript
import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  AuthError,
  Course,
  Thread,
  ThreadWithAIAnswer,  // ADD THIS
  Post,
  // ... other imports
} from "@/lib/models/types";
```

**Test:** Run `npx tsc --noEmit` to verify import resolves correctly.

---

### Step 2: Modify `getCourseThreads()` API Method

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

**Location:** Lines 581-592

**Action:** Change return type and enrich threads with AI answer data

**Before:**
```typescript
/**
 * Get threads for a course
 */
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

**After:**
```typescript
/**
 * Get threads for a course with embedded AI answers
 *
 * Returns ThreadWithAIAnswer[] where threads with AI answers have
 * the aiAnswer property populated. Threads without AI answers have
 * aiAnswer: undefined.
 */
async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]> {
  await delay();
  seedData();

  const threads = getThreadsByCourse(courseId);

  // Enrich threads with AI answer data
  const enrichedThreads = threads.map((thread): ThreadWithAIAnswer => {
    // Check if thread has an AI answer
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      if (aiAnswer) {
        // Return thread with embedded AI answer
        return { ...thread, aiAnswer };
      }
    }
    // Return thread without aiAnswer (will be undefined)
    return thread as ThreadWithAIAnswer;
  });

  return enrichedThreads.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
```

**Key Changes:**
1. Return type: `Thread[]` → `ThreadWithAIAnswer[]`
2. Map over threads to enrich with AI answer data
3. Safely handle threads without AI answers (aiAnswer remains undefined)
4. Preserve existing sort order

**Edge Cases Handled:**
- Thread has `hasAIAnswer: false` → aiAnswer undefined
- Thread has `aiAnswerId` but AI answer not found → aiAnswer undefined
- All other fields remain unchanged

**Test:**
```bash
npx tsc --noEmit  # Verify TypeScript types
```

---

### Step 3: Verify Hook Type Inference

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

**Location:** Lines 186-194

**Action:** No code changes needed - TypeScript will infer new return type

**Current code:**
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

**Type inference after Step 2:**
- `api.getCourseThreads(courseId)` returns `Promise<ThreadWithAIAnswer[]>`
- Hook return type becomes `UseQueryResult<ThreadWithAIAnswer[], Error>`
- No explicit type annotation needed

**Verification:**
```typescript
// In consuming component
const { data: threads } = useCourseThreads(courseId);
// threads: ThreadWithAIAnswer[] | undefined

// Access AI answer data
threads?.forEach(thread => {
  console.log(thread.aiAnswer?.instructorEndorsed); // Type-safe
});
```

**Test:**
```bash
npx tsc --noEmit  # Verify hook types inferred correctly
```

---

### Step 4: Update Filter Logic in Course Page

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/[courseId]/page.tsx`

**Location:** Lines 59-94 (filteredThreads useMemo)

**Action:** Replace old filter logic with new AI-powered filters

**Before:**
```typescript
const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = [...threads];

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((thread) =>
      thread.title.toLowerCase().includes(query) ||
      thread.content.toLowerCase().includes(query) ||
      thread.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  if (activeFilter === "unanswered") {
    filtered = filtered.filter((thread) => thread.status === "open");
  } else if (activeFilter === "my-posts") {
    filtered = filtered.filter((thread) => thread.authorId === user?.id);
  } else if (activeFilter === "needs-review") {
    filtered = filtered.filter((thread) => thread.status === "answered");
  }

  // Apply tag filter (AND logic - thread must have ALL selected tags)
  if (selectedTags.length > 0) {
    filtered = filtered.filter((thread) =>
      selectedTags.every((tag) => thread.tags?.includes(tag))
    );
  }

  // Sort by newest first
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [threads, searchQuery, activeFilter, selectedTags, user?.id]);
```

**After:**
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

  // Apply status filter with NEW AI-powered options
  if (activeFilter === "instructor-endorsed") {
    // Show only threads with instructor-endorsed AI answers
    filtered = filtered.filter((thread) => thread.aiAnswer?.instructorEndorsed === true);
  } else if (activeFilter === "high-confidence") {
    // Show only threads with high-confidence AI answers
    filtered = filtered.filter((thread) => thread.aiAnswer?.confidenceLevel === "high");
  } else if (activeFilter === "popular") {
    // Show threads with 5+ student endorsements
    const POPULAR_THRESHOLD = 5;
    filtered = filtered.filter((thread) =>
      (thread.aiAnswer?.studentEndorsements ?? 0) >= POPULAR_THRESHOLD
    );
  } else if (activeFilter === "resolved") {
    // Show only resolved threads
    filtered = filtered.filter((thread) => thread.status === "resolved");
  } else if (activeFilter === "my-posts") {
    // Show only user's threads (unchanged)
    filtered = filtered.filter((thread) => thread.authorId === user?.id);
  }
  // REMOVED: "unanswered" and "needs-review" filters

  // Apply tag filter (AND logic - unchanged)
  if (selectedTags.length > 0) {
    filtered = filtered.filter((thread) =>
      selectedTags.every((tag) => thread.tags?.includes(tag))
    );
  }

  // Sort by newest first
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [threads, searchQuery, activeFilter, selectedTags, user?.id]);
```

**Key Changes:**
1. **Removed filters:** `"unanswered"`, `"needs-review"`
2. **Added filters:**
   - `"instructor-endorsed"` - Checks `thread.aiAnswer?.instructorEndorsed === true`
   - `"high-confidence"` - Checks `thread.aiAnswer?.confidenceLevel === "high"`
   - `"popular"` - Checks `thread.aiAnswer?.studentEndorsements >= 5`
   - `"resolved"` - Checks `thread.status === "resolved"` (uses existing Thread field)
3. **Kept unchanged:** `"all"` (no filtering), `"my-posts"`

**Null Safety:**
- Uses optional chaining (`thread.aiAnswer?.field`) to safely handle threads without AI answers
- Nullish coalescing (`?? 0`) for numeric comparisons

**Filter Behavior:**
- If thread has no AI answer, AI-based filters exclude it (correct behavior)
- "All Threads" and "My Posts" filters work regardless of AI answer presence

**Test:**
```bash
npx tsc --noEmit  # Verify types
npm run lint      # Verify code style
```

---

### Step 5: Update Filter Type Definition

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/course/sidebar-filter-panel.tsx`

**Location:** Find `FilterType` union type definition

**Action:** Update filter type union to match new filters

**Before:**
```typescript
export type FilterType = "all" | "unanswered" | "needs-review" | "my-posts";
```

**After:**
```typescript
export type FilterType =
  | "all"
  | "instructor-endorsed"
  | "high-confidence"
  | "popular"
  | "resolved"
  | "my-posts";
```

**Impact:** TypeScript will now enforce correct filter names in all components.

**Test:**
```bash
npx tsc --noEmit  # Verify filter type usage across codebase
```

---

### Step 6: Update Filter Configuration UI

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/course/sidebar-filter-panel.tsx`

**Action:** Update filter button labels, icons, and descriptions

**Note:** Specific implementation details should be handled by Component Architect agent. This plan focuses on data access patterns.

**Required changes:**
1. Update filter labels:
   - Remove: "Unanswered", "Needs Review"
   - Add: "Instructor Endorsed", "High Confidence", "Popular", "Resolved"
2. Update icons (from Lucide):
   - Instructor Endorsed: `Award` or `Star`
   - High Confidence: `Zap` or `TrendingUp`
   - Popular: `ThumbsUp` or `Heart`
   - Resolved: `CheckSquare` or `Check`
3. Update descriptions/tooltips to explain filter criteria

**Test:** Manual UI testing (visual verification of filter buttons).

---

## Mock Data Requirements

### Verify Mock Data Coverage

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/threads.json`

**Check:**
- All threads have `hasAIAnswer: true` ✓ (confirmed in research)
- All threads have valid `aiAnswerId` references ✓

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/ai-answers.json`

**Check:**
- All AI answers have `instructorEndorsed` field ✓
- All AI answers have `confidenceLevel` and `confidenceScore` ✓
- AI answers have varying `studentEndorsements` values ✓

**Data distribution:**
- Mix of `instructorEndorsed: true/false`
- Mix of `confidenceLevel: "high"/"medium"/"low"`
- Range of `studentEndorsements: 0-12`
- Some threads with `status: "resolved"`

**Action:** No mock data changes needed (already sufficient for testing).

---

## React Query Cache Invalidation

### Current Invalidation Points

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

**Verify invalidation after AI answer endorsement:**

**Location:** Lines 475-487 (useEndorseAIAnswer onSuccess)

```typescript
onSuccess: (data, variables, context) => {
  if (!context?.threadId) return;

  // Invalidate thread query (single thread detail)
  queryClient.invalidateQueries({ queryKey: queryKeys.thread(context.threadId) });

  // Invalidate course threads (endorsement count visible in list)
  const thread = queryClient.getQueryData<{ thread?: { courseId?: string } }>(
    queryKeys.thread(context.threadId)
  );
  if (thread?.thread?.courseId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courseThreads(thread.thread.courseId)
    });
  }
}
```

**Status:** ✓ Already invalidates `courseThreads` query after endorsement.

**No changes needed** - existing invalidation logic will refresh the thread list with updated endorsement counts.

---

### Additional Invalidation Needed

**After AI answer generation:** `lib/api/client.ts` lines 1199-1246

**Current code:**
```typescript
async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
  // ... generate AI answer
  addAIAnswer(aiAnswer);
  updateThread(input.threadId, {
    hasAIAnswer: true,
    aiAnswerId: aiAnswer.id,
    updatedAt: new Date().toISOString(),
  });

  return aiAnswer;
}
```

**Issue:** No React Query invalidation (API method doesn't have access to queryClient).

**Solution:** Invalidation already handled in `useCreateThread()` hook:

**File:** `lib/api/hooks.ts` lines 294-321

```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (result) => {
      const { thread, aiAnswer } = result;

      // Invalidate course threads query
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });

      // Invalidate dashboards (activity feeds need update)
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

      // Pre-populate thread cache with AI answer
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

**Status:** ✓ Already invalidates `courseThreads` after thread creation with AI answer.

**No changes needed.**

---

## Performance Optimizations

### Network Payload Analysis

**Before implementation:**
- Request: `GET /api/courses/{courseId}/threads`
- Response: `Thread[]` (20 threads)
- Payload size: ~5KB

**After implementation:**
- Request: `GET /api/courses/{courseId}/threads`
- Response: `ThreadWithAIAnswer[]` (20 threads with embedded AI answers)
- Payload size: ~15-25KB

**Increase:** +10-20KB per page load

**Is this acceptable?**
- ✓ Yes for mock API (no real network latency)
- ✓ Yes for expected scale (<100 threads per course)
- ✓ Modern browsers handle 25KB easily
- ✓ Single request faster than multiple requests (Option A would be 2x requests)

**Future optimization (if needed):**
- Exclude `content` and `citations` fields from AI answer in list view
- Only include metadata: `{ id, confidenceLevel, confidenceScore, endorsements, instructorEndorsed }`
- Would reduce payload to ~8-12KB (40% smaller)
- Defer until profiling shows need

---

### Client-Side Filter Performance

**Complexity:** O(n) where n = number of threads

**Operations per filter:**
1. Search: O(n) string matching
2. Filter: O(n) property access
3. Tag filter: O(n * t) where t = number of selected tags
4. Sort: O(n log n)

**Total:** O(n log n) dominated by sort

**Expected scale:** 20-100 threads per course

**Performance:** Sub-millisecond for expected scale (no optimization needed)

---

## Error Handling

### Thread Without AI Answer

**Scenario:** Thread has `hasAIAnswer: false` or `aiAnswerId: undefined`

**Behavior:**
```typescript
const enrichedThreads = threads.map((thread): ThreadWithAIAnswer => {
  if (thread.hasAIAnswer && thread.aiAnswerId) {
    const aiAnswer = getAIAnswerById(thread.aiAnswerId);
    if (aiAnswer) {
      return { ...thread, aiAnswer };
    }
  }
  return thread as ThreadWithAIAnswer; // aiAnswer is undefined
});
```

**Result:** Thread has `aiAnswer: undefined`

**Filter logic:**
```typescript
if (activeFilter === "instructor-endorsed") {
  filtered = filtered.filter((thread) => thread.aiAnswer?.instructorEndorsed === true);
}
```

**Result:** Thread is filtered out (correct behavior - thread has no AI answer to be endorsed)

**No error thrown** - optional chaining handles undefined safely.

---

### AI Answer Not Found

**Scenario:** Thread has `aiAnswerId` but `getAIAnswerById()` returns null

**Behavior:**
```typescript
const aiAnswer = getAIAnswerById(thread.aiAnswerId);
if (aiAnswer) {
  return { ...thread, aiAnswer };
}
// Fall through - no aiAnswer attached
return thread as ThreadWithAIAnswer;
```

**Result:** Thread treated as if it has no AI answer (safe degradation)

**Filter logic:** Same as above - thread filtered out by AI-based filters

**No error thrown** - graceful handling of missing data

---

### Empty Filter Results

**Scenario:** Filter criteria match zero threads

**Behavior:**
```typescript
const filteredThreads = useMemo(() => {
  if (!threads) return [];

  let filtered = [...threads];

  // Apply filters...

  return filtered; // Could be empty array []
}, [threads, activeFilter, ...]);
```

**Result:** `filteredThreads = []`

**UI handling:** ThreadListSidebar component should show empty state message

**Recommendation for UI component:**
```typescript
{filteredThreads.length === 0 ? (
  <div className="text-center p-8 text-muted-foreground">
    <p>No threads match your filters.</p>
    <p className="text-sm">Try adjusting your search or filters.</p>
  </div>
) : (
  // Render thread list
)}
```

**Note:** UI component implementation should be handled by Component Architect agent.

---

## Testing Strategy

### Unit Tests (Future)

**Test file:** `lib/api/client.test.ts` (to be created)

**Test cases:**

1. **getCourseThreads returns enriched threads**
```typescript
test('getCourseThreads embeds AI answers', async () => {
  const threads = await api.getCourseThreads('course-cs101');

  expect(threads).toBeDefined();
  expect(threads.length).toBeGreaterThan(0);

  const threadWithAI = threads.find(t => t.hasAIAnswer);
  expect(threadWithAI?.aiAnswer).toBeDefined();
  expect(threadWithAI?.aiAnswer?.confidenceLevel).toBeDefined();
});
```

2. **Threads without AI answers have undefined aiAnswer**
```typescript
test('threads without AI answers have undefined aiAnswer', async () => {
  // Setup: Create thread without AI answer
  const threads = await api.getCourseThreads('test-course');

  const threadWithoutAI = threads.find(t => !t.hasAIAnswer);
  expect(threadWithoutAI?.aiAnswer).toBeUndefined();
});
```

3. **Filter logic excludes threads without AI answers**
```typescript
test('instructor-endorsed filter excludes threads without AI answers', () => {
  const threads: ThreadWithAIAnswer[] = [
    { id: '1', hasAIAnswer: true, aiAnswer: { instructorEndorsed: true } },
    { id: '2', hasAIAnswer: true, aiAnswer: { instructorEndorsed: false } },
    { id: '3', hasAIAnswer: false } as ThreadWithAIAnswer,
  ];

  const filtered = threads.filter(t => t.aiAnswer?.instructorEndorsed === true);

  expect(filtered).toHaveLength(1);
  expect(filtered[0].id).toBe('1');
});
```

**Note:** Unit tests are out of scope for this plan. Recommend implementing after manual testing confirms functionality.

---

### Manual Testing Checklist

**Prerequisites:**
- Mock data seeded with variety of threads
- At least 1 thread per filter category:
  - Instructor endorsed (check `mocks/ai-answers.json` for `instructorEndorsed: true`)
  - High confidence (check for `confidenceLevel: "high"`)
  - Popular (check for `studentEndorsements >= 5`)
  - Resolved (check `mocks/threads.json` for `status: "resolved"`)

**Test scenarios:**

#### TC-1: All Threads Filter
- **Action:** Select "All Threads" filter
- **Expected:** All threads visible, no filtering applied
- **Verify:** Thread count matches total course threads

#### TC-2: Instructor Endorsed Filter
- **Action:** Select "Instructor Endorsed" filter
- **Expected:** Only threads with instructor-endorsed AI answers visible
- **Verify:**
  - Check at least 1 thread visible (if mock data has endorsed threads)
  - Inspect thread detail to confirm instructor endorsement badge
  - Threads without endorsement hidden

#### TC-3: High Confidence Filter
- **Action:** Select "High Confidence" filter
- **Expected:** Only threads with high-confidence AI answers visible
- **Verify:**
  - Check confidence indicator on visible threads (should be "high")
  - Medium/low confidence threads hidden

#### TC-4: Popular Filter
- **Action:** Select "Popular" filter
- **Expected:** Only threads with 5+ student endorsements visible
- **Verify:**
  - Check endorsement count on visible threads (>= 5)
  - Threads with <5 endorsements hidden

#### TC-5: Resolved Filter
- **Action:** Select "Resolved" filter
- **Expected:** Only resolved threads visible
- **Verify:**
  - Check thread status indicator (should show "resolved")
  - Open/answered threads hidden

#### TC-6: My Posts Filter
- **Action:** Select "My Posts" filter
- **Expected:** Only current user's threads visible
- **Verify:**
  - Check author name on visible threads (should match current user)
  - Other users' threads hidden

#### TC-7: Combine Filter + Search
- **Action:** Apply "High Confidence" filter + search "binary"
- **Expected:** Only high-confidence threads matching "binary" visible
- **Verify:**
  - Thread titles contain "binary"
  - All visible threads have high confidence

#### TC-8: Combine Filter + Tags
- **Action:** Apply "Popular" filter + select "algorithms" tag
- **Expected:** Only popular threads tagged "algorithms" visible
- **Verify:**
  - Thread tags include "algorithms"
  - All visible threads have 5+ endorsements

#### TC-9: Empty Results
- **Action:** Select filter that matches zero threads (e.g., search "xyz123")
- **Expected:** Empty state message displayed
- **Verify:**
  - Message reads "No threads match your filters"
  - No threads visible
  - No JavaScript errors in console

#### TC-10: Switch Between Filters
- **Action:** Rapidly switch between different filters
- **Expected:** Smooth transitions, no flicker, correct results
- **Verify:**
  - No loading states (data already cached)
  - Correct threads displayed for each filter
  - No console errors

#### TC-11: TypeScript Type Safety
- **Action:** Run `npx tsc --noEmit`
- **Expected:** No TypeScript errors
- **Verify:**
  - `ThreadWithAIAnswer` type correctly inferred
  - Optional chaining (`thread.aiAnswer?.field`) compiles
  - Filter logic type-safe

#### TC-12: Lint Check
- **Action:** Run `npm run lint`
- **Expected:** No linting errors in modified files
- **Verify:**
  - `lib/api/client.ts` passes lint
  - `app/courses/[courseId]/page.tsx` passes lint

---

## Rollback Plan

If issues arise during implementation:

### Rollback Step 1: Revert API Method

**File:** `lib/api/client.ts` lines 581-592

**Action:** Restore original `getCourseThreads()` implementation

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

**Impact:** Filter logic breaks (no AI answer data), but page still loads.

### Rollback Step 2: Revert Filter Logic

**File:** `app/courses/[courseId]/page.tsx` lines 59-94

**Action:** Restore original filter logic with "unanswered" and "needs-review" filters

**Impact:** Filters work as before, AI-powered filters removed.

### Rollback Step 3: Revert Filter Type

**File:** `components/course/sidebar-filter-panel.tsx`

**Action:** Restore original `FilterType` union

```typescript
export type FilterType = "all" | "unanswered" | "needs-review" | "my-posts";
```

**Impact:** TypeScript types consistent with reverted logic.

### Rollback Verification

```bash
npx tsc --noEmit  # No TypeScript errors
npm run lint      # No linting errors
npm run dev       # App runs without errors
```

**Recommendation:** Keep commits small and atomic to enable selective rollback.

---

## Success Criteria

Implementation is complete when:

- ✅ `getCourseThreads()` returns `ThreadWithAIAnswer[]` with embedded AI answer data
- ✅ Filter logic accesses AI answer fields using optional chaining
- ✅ All new filters work correctly:
  - Instructor Endorsed
  - High Confidence
  - Popular
  - Resolved
- ✅ Old filters removed (unanswered, needs-review)
- ✅ TypeScript compilation passes (`npx tsc --noEmit`)
- ✅ Linting passes (`npm run lint`)
- ✅ Manual testing confirms all filters produce correct results
- ✅ No console errors during filter operations
- ✅ Empty filter results handled gracefully
- ✅ React Query cache invalidation works (endorsement updates reflect in list)

---

## Next Steps After Implementation

1. **Component UI updates** (Component Architect agent):
   - Update filter button labels, icons, descriptions
   - Add empty state handling for zero results
   - Ensure accessibility (ARIA labels, keyboard navigation)

2. **Type safety validation** (Type Safety Guardian agent):
   - Verify `ThreadWithAIAnswer` usage across codebase
   - Ensure no `any` types introduced
   - Validate optional chaining usage

3. **Integration testing** (Parent agent):
   - Run full manual test suite
   - Verify responsive design (360/768/1024/1280px)
   - Check a11y compliance (keyboard nav, screen reader)

4. **Performance profiling** (if needed):
   - Measure payload size in production build
   - Profile filter operation speed (should be <10ms for 100 threads)
   - Consider optimization to slim AI answer metadata if payload >50KB

5. **Documentation updates:**
   - Update filter descriptions in context.md
   - Document threshold values (e.g., POPULAR_THRESHOLD = 5)
   - Add filter logic examples to codebase docs

---

## File Paths Summary

**Files to modify:**
1. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` (Step 1, 2)
2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/[courseId]/page.tsx` (Step 4)
3. `/Users/dgz/projects-professional/quokka/quokka-demo/components/course/sidebar-filter-panel.tsx` (Step 5, 6)

**Files to verify (no changes):**
1. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` (Step 3 - type inference)
2. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` (ThreadWithAIAnswer already exists)
3. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/threads.json` (mock data sufficient)
4. `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/ai-answers.json` (mock data sufficient)

**Total:** 3 files to edit, 4 files to verify.

---

## Estimated Implementation Time

- **Step 1 (Type imports):** 2 minutes
- **Step 2 (API method):** 10 minutes
- **Step 3 (Verify types):** 5 minutes
- **Step 4 (Filter logic):** 15 minutes
- **Step 5 (FilterType):** 3 minutes
- **Step 6 (UI updates):** Delegated to Component Architect
- **Testing:** 20 minutes (manual testing all filters)

**Total:** ~55 minutes for API integration + testing

**Component UI updates:** ~30 minutes (handled separately by Component Architect)

**Grand total:** ~1.5 hours for complete feature

---

## Risk Mitigation

### Risk 1: Breaking Change to API Contract

**Mitigation:**
- Verified no other direct consumers of `getCourseThreads()` (only `useCourseThreads()` hook)
- TypeScript will catch any type mismatches immediately
- Keep commits atomic for easy rollback

### Risk 2: Performance Regression

**Mitigation:**
- Payload increase is acceptable for expected scale (<100 threads)
- Single request faster than multiple requests (Option A/D)
- Future optimization path available (slim metadata)

### Risk 3: Mock Data Insufficient

**Mitigation:**
- Confirmed mock data has required fields (research analysis)
- All threads have AI answers in mock data
- Edge cases (threads without AI answers) handled gracefully

### Risk 4: Filter Logic Complexity

**Mitigation:**
- Use simple optional chaining (`thread.aiAnswer?.field`)
- Clear comments explaining each filter
- Manual testing verifies correct behavior

### Risk 5: Cache Invalidation Issues

**Mitigation:**
- Existing invalidation logic already handles endorsements
- React Query automatically refetches after invalidation
- Test endorsement flow to verify cache updates

---

## Appendix: Alternative Optimization (Future)

If payload size becomes a concern in production:

### Define Slim Metadata Interface

```typescript
// lib/models/types.ts
export interface AIAnswerMetadata {
  id: string;
  threadId: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  studentEndorsements: number;
  instructorEndorsements: number;
  instructorEndorsed: boolean;
  totalEndorsements: number;
  // Exclude: content, citations
}

export interface ThreadWithAIMetadata extends Thread {
  aiAnswer?: AIAnswerMetadata;
}
```

### Use in List View API

```typescript
async getCourseThreads(courseId: string): Promise<ThreadWithAIMetadata[]> {
  // ... existing logic

  const enrichedThreads = threads.map((thread): ThreadWithAIMetadata => {
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      if (aiAnswer) {
        // Return only metadata fields
        const aiMetadata: AIAnswerMetadata = {
          id: aiAnswer.id,
          threadId: aiAnswer.threadId,
          confidenceLevel: aiAnswer.confidenceLevel,
          confidenceScore: aiAnswer.confidenceScore,
          studentEndorsements: aiAnswer.studentEndorsements,
          instructorEndorsements: aiAnswer.instructorEndorsements,
          instructorEndorsed: aiAnswer.instructorEndorsed,
          totalEndorsements: aiAnswer.totalEndorsements,
        };
        return { ...thread, aiAnswer: aiMetadata };
      }
    }
    return thread as ThreadWithAIMetadata;
  });

  return enrichedThreads.sort(...);
}
```

### Benefit

- Reduces payload from 15-25KB to 8-12KB (40% reduction)
- Still provides all data needed for filters
- Full AI answer fetched only in thread detail view

### Trade-off

- More type complexity (new interface)
- Only worthwhile if profiling shows payload is bottleneck

### Recommendation

Defer until profiling shows need. Use full `ThreadWithAIAnswer` for now (simpler, more consistent with detail view).

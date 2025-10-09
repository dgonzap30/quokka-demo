# Type Safety Implementation Plan: Filter Enhancement

**Date:** 2025-10-08
**Agent:** Type Safety Guardian
**Status:** Planning Complete - Ready for Implementation

---

## Overview

This plan defines exact type changes needed for the new AI-powered filter system. All changes maintain TypeScript strict mode compliance with zero `any` types and proper null handling.

---

## 1. FilterType Update

### Location
`components/course/sidebar-filter-panel.tsx` (line 6)

### Current Definition
```typescript
export type FilterType = "all" | "unanswered" | "my-posts" | "needs-review";
```

### New Definition
```typescript
export type FilterType =
  | "all"
  | "my-posts"
  | "instructor-endorsed"
  | "high-confidence"
  | "popular"
  | "resolved";
```

### Changes
- **Remove:** `"unanswered"`, `"needs-review"`
- **Keep:** `"all"`, `"my-posts"`
- **Add:** `"instructor-endorsed"`, `"high-confidence"`, `"popular"`, `"resolved"`

### Export Strategy
✅ Keep as `export type` (type-only export)
✅ Keep in component file (no need to move to types.ts)

### Import Updates Required
**File:** `app/courses/[courseId]/page.tsx` (line 17)

**Current:**
```typescript
import type { FilterType } from "@/components/course/sidebar-filter-panel";
```

**New:** No change needed - import path remains the same

---

## 2. New React Query Hook: useAllAIAnswers

### Purpose
Fetch all AI answers for a course to support filter logic that needs AIAnswer data.

### Location
`lib/api/hooks.ts` (add after `useAIAnswer`, around line 392)

### Hook Definition

```typescript
/**
 * Get all AI answers for a course
 *
 * Used for filtering threads by AI answer properties
 * (instructor endorsement, confidence, popularity).
 * Returns empty array if course has no AI answers.
 */
export function useAllAIAnswers(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? ["aiAnswers", courseId] : ["aiAnswers"],
    queryFn: () => (courseId ? api.getAllAIAnswers(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,  // 5 minutes (moderately expensive operation)
    gcTime: 10 * 60 * 1000,     // 10 minutes
  });
}
```

**Return Type:** `UseQueryResult<AIAnswer[], Error>`

### API Client Method (Required)

**Location:** `lib/api/client.ts` (add after `getAIAnswer`, around line 1303)

```typescript
/**
 * Get all AI answers for a course
 */
async getAllAIAnswers(courseId: string): Promise<AIAnswer[]> {
  await delay(300 + Math.random() * 200); // 300-500ms
  seedData();

  const threads = getThreadsByCourse(courseId);
  const aiAnswers: AIAnswer[] = [];

  threads.forEach((thread) => {
    if (thread.hasAIAnswer && thread.aiAnswerId) {
      const aiAnswer = getAIAnswerById(thread.aiAnswerId);
      if (aiAnswer) {
        aiAnswers.push(aiAnswer);
      }
    }
  });

  return aiAnswers;
}
```

**Type Signature:**
- **Input:** `courseId: string`
- **Output:** `Promise<AIAnswer[]>`
- **Null Handling:** Returns empty array if no AI answers exist
- **Type Safety:** ✅ No `any` types, strict null checks

---

## 3. Helper Functions for Filter Logic

### Location
`lib/models/types.ts` (add after existing type guards, around line 570)

### Function 1: isPopularAnswer

```typescript
/**
 * Type guard to check if AI answer is popular based on student endorsements
 *
 * @param answer - AI answer to check (may be undefined)
 * @param threshold - Minimum number of student endorsements (default: 5)
 * @returns true if answer exists and has >= threshold endorsements
 */
export function isPopularAnswer(
  answer: AIAnswer | undefined,
  threshold: number = 5
): boolean {
  return answer !== undefined && answer.studentEndorsements >= threshold;
}
```

**Type Safety:**
- ✅ Handles `undefined` explicitly
- ✅ Returns explicit `boolean` (not `boolean | undefined`)
- ✅ Default parameter for threshold

### Function 2: hasInstructorEndorsement

```typescript
/**
 * Type guard to check if AI answer has instructor endorsement
 *
 * @param answer - AI answer to check (may be undefined)
 * @returns true if answer exists and is instructor-endorsed
 */
export function hasInstructorEndorsement(answer: AIAnswer | undefined): boolean {
  return answer !== undefined && answer.instructorEndorsed === true;
}
```

**Type Safety:**
- ✅ Handles `undefined` explicitly
- ✅ Explicit boolean comparison (`=== true`)
- ✅ Returns explicit `boolean`

### Function 3: Update Existing isHighConfidence

**Current (line 553-555):**
```typescript
export function isHighConfidence(answer: AIAnswer): boolean {
  return answer.confidenceLevel === 'high' && answer.confidenceScore >= 70;
}
```

**New (update to handle undefined):**
```typescript
/**
 * Type guard to check if AI answer has high confidence
 *
 * @param answer - AI answer to check (may be undefined)
 * @returns true if answer exists and has high confidence level + score >= 70
 */
export function isHighConfidence(answer: AIAnswer | undefined): boolean {
  if (!answer) return false;
  return answer.confidenceLevel === 'high' && answer.confidenceScore >= 70;
}
```

**Breaking Change:** Yes - signature changes from `AIAnswer` to `AIAnswer | undefined`
**Mitigation:** Check all existing usages (likely none in current codebase)

---

## 4. Filter Logic Implementation

### Location
`app/courses/[courseId]/page.tsx` (lines 74-81, update filter logic)

### Data Fetching (add after line 26)

```typescript
// Existing:
const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);

// ADD NEW:
const { data: aiAnswers } = useAllAIAnswers(courseId);
```

**Type:** `aiAnswers` is `AIAnswer[] | undefined`

### Filter Logic Implementation (replace lines 74-81)

```typescript
// Apply status filter
if (activeFilter === "my-posts") {
  // Keep existing logic
  filtered = filtered.filter((thread) => thread.authorId === user?.id);

} else if (activeFilter === "instructor-endorsed") {
  filtered = filtered.filter((thread) => {
    // Type guard: ensure thread has AI answer
    if (!hasAIAnswer(thread)) return false;

    // Find AI answer for this thread
    const aiAnswer = aiAnswers?.find((ai) => ai.threadId === thread.id);

    // Check instructor endorsement using type-safe helper
    return hasInstructorEndorsement(aiAnswer);
  });

} else if (activeFilter === "high-confidence") {
  filtered = filtered.filter((thread) => {
    // Type guard: ensure thread has AI answer
    if (!hasAIAnswer(thread)) return false;

    // Find AI answer for this thread
    const aiAnswer = aiAnswers?.find((ai) => ai.threadId === thread.id);

    // Check confidence using type-safe helper
    return isHighConfidence(aiAnswer);
  });

} else if (activeFilter === "popular") {
  filtered = filtered.filter((thread) => {
    // Type guard: ensure thread has AI answer
    if (!hasAIAnswer(thread)) return false;

    // Find AI answer for this thread
    const aiAnswer = aiAnswers?.find((ai) => ai.threadId === thread.id);

    // Check popularity using type-safe helper (threshold: 5+ endorsements)
    return isPopularAnswer(aiAnswer, 5);
  });

} else if (activeFilter === "resolved") {
  filtered = filtered.filter((thread) => thread.status === "resolved");
}
// "all" filter: no filtering needed, return all threads
```

### Type Safety Features:
- ✅ `hasAIAnswer(thread)` type guard narrows Thread before accessing `aiAnswerId`
- ✅ `aiAnswers?.find()` uses optional chaining (handles `undefined`)
- ✅ All helper functions explicitly handle `undefined`
- ✅ All predicates return explicit `boolean`
- ✅ No `any` types or type assertions

---

## 5. Import Updates

### File: app/courses/[courseId]/page.tsx

**Add to imports (after line 6):**
```typescript
import { useAllAIAnswers } from "@/lib/api/hooks";
```

**Add to type imports (after line 6):**
```typescript
import type { AIAnswer } from "@/lib/models/types";
import { hasAIAnswer, isHighConfidence, hasInstructorEndorsement, isPopularAnswer } from "@/lib/models/types";
```

**Note:** Import helpers as values (not `import type`) since they're runtime functions

---

## 6. Filter Configuration Update

### Location
`components/course/sidebar-filter-panel.tsx` (lines 32-57)

### New Filter Configuration

```typescript
const filters: Filter[] = [
  {
    id: "all",
    label: "All Threads",
    icon: List,
    description: "Show all threads in this course",
  },
  {
    id: "my-posts",
    label: "My Posts",
    icon: User,
    description: "Show threads you've participated in",
  },
  {
    id: "instructor-endorsed",
    label: "Instructor Endorsed",
    icon: Award,  // Import from lucide-react
    description: "Show threads with AI answers endorsed by instructors",
  },
  {
    id: "high-confidence",
    label: "High Confidence",
    icon: Target,  // Import from lucide-react
    description: "Show threads with high-confidence AI answers",
  },
  {
    id: "popular",
    label: "Popular",
    icon: TrendingUp,  // Import from lucide-react
    description: "Show threads with many peer endorsements",
  },
  {
    id: "resolved",
    label: "Resolved",
    icon: CheckCircle,  // Import from lucide-react
    description: "Show threads marked as resolved",
  },
];
```

### Icon Imports (add to line 4)

```typescript
import {
  List,
  User,
  Award,       // NEW
  Target,      // NEW
  TrendingUp,  // NEW
  CheckCircle, // NEW
  type LucideIcon
} from "lucide-react";
```

**Type Safety:** ✅ All icons are typed as `LucideIcon`

---

## 7. Type Safety Validation Steps

### Step 1: TypeScript Compilation
```bash
npx tsc --noEmit
```
**Expected:** Zero errors

### Step 2: Lint Check
```bash
npm run lint
```
**Expected:** Zero errors

### Step 3: Manual Type Checks

**Check 1: FilterType Exhaustiveness**
```typescript
// Add temporary code to verify all FilterType values are handled:
const testFilter: FilterType = "all";
switch (testFilter) {
  case "all": break;
  case "my-posts": break;
  case "instructor-endorsed": break;
  case "high-confidence": break;
  case "popular": break;
  case "resolved": break;
  default:
    // @ts-expect-error - Should never reach here
    const exhaustive: never = testFilter;
}
```
**Expected:** No TypeScript errors (all cases covered)

**Check 2: Filter Predicate Return Types**
```typescript
// Verify all predicates return boolean:
const result1: boolean = hasInstructorEndorsement(undefined);  // Should compile
const result2: boolean = isHighConfidence(undefined);          // Should compile
const result3: boolean = isPopularAnswer(undefined, 5);        // Should compile
```

**Check 3: Type Guard Narrowing**
```typescript
const thread: Thread = { /* ... */ };
if (hasAIAnswer(thread)) {
  // TypeScript should know thread.aiAnswerId is defined here
  const id: string = thread.aiAnswerId;  // Should compile without optional chaining
}
```

---

## 8. File-by-File Change Summary

### File 1: `components/course/sidebar-filter-panel.tsx`
**Lines:** 4-6, 32-57
**Changes:**
- Add icon imports: `Award`, `Target`, `TrendingUp`, `CheckCircle`
- Update `FilterType` union (line 6)
- Update `filters` array configuration (lines 32-57)

### File 2: `lib/models/types.ts`
**Lines:** After line 570 (end of type guards section)
**Changes:**
- Add `isPopularAnswer(answer, threshold)` helper
- Add `hasInstructorEndorsement(answer)` helper
- Update `isHighConfidence(answer)` to handle `undefined`

### File 3: `lib/api/hooks.ts`
**Lines:** After line 392
**Changes:**
- Add `useAllAIAnswers(courseId)` hook
- Add query key to `queryKeys` object (line 34)

### File 4: `lib/api/client.ts`
**Lines:** After line 1303
**Changes:**
- Add `getAllAIAnswers(courseId)` method to `api` object

### File 5: `app/courses/[courseId]/page.tsx`
**Lines:** 6 (imports), 27 (hooks), 74-81 (filter logic)
**Changes:**
- Add imports: `useAllAIAnswers`, type guards, `AIAnswer` type
- Add `useAllAIAnswers(courseId)` hook call
- Replace filter logic (lines 74-81) with new implementation

---

## 9. Test Scenarios

### Test 1: All Filter Types Compile
**Verify:** All FilterType string literals are recognized by TypeScript
**Method:** Try assigning each filter value to a `FilterType` variable
```typescript
const f1: FilterType = "all";                   // ✅ Should compile
const f2: FilterType = "instructor-endorsed";   // ✅ Should compile
const f3: FilterType = "unanswered";            // ❌ Should error (removed)
```

### Test 2: Type Guards Work
**Verify:** Type narrowing works correctly in filter predicates
**Method:** Check that `hasAIAnswer()` enables access to `aiAnswerId`
```typescript
threads.filter((thread) => {
  if (hasAIAnswer(thread)) {
    const id: string = thread.aiAnswerId; // ✅ Should compile
  }
});
```

### Test 3: Helper Functions Handle Undefined
**Verify:** All helpers accept `undefined` and return `boolean`
**Method:** Call helpers with `undefined`
```typescript
isHighConfidence(undefined);           // ✅ Should return false
hasInstructorEndorsement(undefined);   // ✅ Should return false
isPopularAnswer(undefined, 5);         // ✅ Should return false
```

### Test 4: Filter Predicates Return Boolean
**Verify:** No implicit `boolean | undefined` returns
**Method:** Assign filter result to typed variable
```typescript
const filtered: Thread[] = threads.filter((thread) => {
  if (!hasAIAnswer(thread)) return false;  // ✅ Explicit boolean
  const aiAnswer = aiAnswers?.find((ai) => ai.threadId === thread.id);
  return hasInstructorEndorsement(aiAnswer);  // ✅ Explicit boolean
});
```

### Test 5: No Any Types
**Verify:** `npx tsc --noEmit` passes with strict mode
**Method:** Search for `any` in modified files
```bash
grep -n "any" components/course/sidebar-filter-panel.tsx  # Should find 0 results
grep -n "any" app/courses/[courseId]/page.tsx              # Should find 0 results
grep -n "any" lib/models/types.ts                          # Should find 0 results
```

---

## 10. Rollback Plan

If type errors cannot be resolved:

1. **Revert FilterType** (sidebar-filter-panel.tsx line 6)
   ```typescript
   export type FilterType = "all" | "unanswered" | "my-posts" | "needs-review";
   ```

2. **Revert filter config** (sidebar-filter-panel.tsx lines 32-57)
   - Remove new filters, restore old configuration

3. **Revert filter logic** (page.tsx lines 74-81)
   - Remove new filter cases, restore original logic

4. **Remove new helpers** (types.ts)
   - Delete `isPopularAnswer`, `hasInstructorEndorsement`
   - Revert `isHighConfidence` signature

5. **Remove new hook** (hooks.ts)
   - Delete `useAllAIAnswers`

6. **Remove new API method** (client.ts)
   - Delete `getAllAIAnswers`

**Commit Strategy:** Small commits per file to enable selective revert

---

## 11. Success Criteria

✅ All changes complete when:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] All FilterType values are string literals (no `any`)
- [ ] All imports use `import type` for type-only imports
- [ ] All filter predicates return explicit `boolean`
- [ ] Type guards used before accessing optional properties
- [ ] Helper functions handle `undefined` explicitly
- [ ] No type assertions (`as`) used without justification
- [ ] Manual testing shows correct filter behavior

---

## 12. Performance Considerations

### Data Fetching
- `useAllAIAnswers(courseId)` fetches once, caches for 5 minutes
- React Query caching prevents redundant network calls
- Filter logic runs client-side (no re-fetch on filter change)

### Type Safety Impact
- **Zero runtime cost** - all type checking happens at compile time
- Type guards compile to simple boolean checks
- Helper functions are inlined by TypeScript/bundler

---

## Notes

- All type changes maintain backward compatibility except `isHighConfidence` signature update
- No breaking changes to existing API contract
- Filter logic complexity is O(n) per filter (acceptable for frontend filtering)
- Helper functions improve testability and maintainability

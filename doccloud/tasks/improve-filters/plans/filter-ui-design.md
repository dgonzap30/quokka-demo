# Filter UI Design Plan

**Task:** Update filter UI configuration with new AI-focused filters
**Date:** 2025-10-08
**Author:** Component Architect Sub-Agent
**Status:** Ready for Implementation

---

## Design Overview

Replace outdated "Unanswered" and "Needs Review" filters with AI-powered filters that reflect the QuokkaQ platform's capabilities:
- **Instructor Endorsed:** AI answers verified by instructors
- **High Confidence:** AI answers with confidence ≥80%
- **Popular:** Questions with ≥5 student endorsements
- **Resolved:** Questions closed by instructors

**Keep existing:** "All Threads" and "My Posts" remain unchanged.

---

## Complete Filter Configuration

### TypeScript Union Type

**File:** `components/course/sidebar-filter-panel.tsx`
**Line:** 6

**Current:**
```typescript
export type FilterType = "all" | "unanswered" | "my-posts" | "needs-review";
```

**New:**
```typescript
export type FilterType = "all" | "high-confidence" | "instructor-endorsed" | "popular" | "resolved" | "my-posts";
```

### Icon Imports

**File:** `components/course/sidebar-filter-panel.tsx`
**Line:** 4

**Current:**
```typescript
import { List, HelpCircle, User, AlertCircle, type LucideIcon } from "lucide-react";
```

**New:**
```typescript
import { List, Target, BadgeCheck, Flame, CheckSquare, User, type LucideIcon } from "lucide-react";
```

### Filter Configuration Array

**File:** `components/course/sidebar-filter-panel.tsx`
**Lines:** 32-57 (replace entirely)

**New Configuration:**
```typescript
const filters: Filter[] = [
  {
    id: "all",
    label: "All Threads",
    icon: List,
    description: "Show all threads in this course",
  },
  {
    id: "high-confidence",
    label: "High Confidence",
    icon: Target,
    description: "Show threads with high-confidence AI answers (80% or higher)",
  },
  {
    id: "instructor-endorsed",
    label: "Instructor Endorsed",
    icon: BadgeCheck,
    description: "Show threads with instructor-endorsed AI answers",
  },
  {
    id: "popular",
    label: "Popular",
    icon: Flame,
    description: "Show popular threads with many student endorsements",
  },
  {
    id: "resolved",
    label: "Resolved",
    icon: CheckSquare,
    description: "Show threads marked as resolved by instructors",
  },
  {
    id: "my-posts",
    label: "My Posts",
    icon: User,
    description: "Show threads you've created or participated in",
  },
];
```

---

## Filter Order Rationale

**Recommended order (as configured above):**
1. **All Threads** - Default view, shows everything
2. **High Confidence** - Most useful for students seeking reliable answers
3. **Instructor Endorsed** - Next level of quality verification
4. **Popular** - Community-validated content
5. **Resolved** - Completed/closed threads
6. **My Posts** - Personal filter, typically used less frequently

**Mental Model:**
- **Quality filters first** (confidence, endorsement)
- **Engagement filter** (popularity)
- **Status filter** (resolved)
- **Personal filter last** (my posts)

**Alternative ordering (if user feedback suggests):**
- Could swap "High Confidence" and "Instructor Endorsed" if instructor endorsement is more valuable
- Could move "My Posts" higher if personal tracking is high priority

---

## Icon Design Rationale

### Selection Criteria Applied

| Filter | Icon | Rationale | Visual Distinction |
|--------|------|-----------|-------------------|
| All Threads | `List` | Universal symbol for collections/lists | Horizontal lines |
| High Confidence | `Target` | Bullseye = accuracy, precision | Concentric circles |
| Instructor Endorsed | `BadgeCheck` | Shield + check = verification, authority | Shield shape |
| Popular | `Flame` | "Hot" content, trending | Flame/fire shape |
| Resolved | `CheckSquare` | Completion + closure | Square with check |
| My Posts | `User` | Personal/authorship | Person silhouette |

### Visual Differentiation at 16px

**Shape Analysis:**
- **Lines:** List (horizontal lines)
- **Circles:** Target (concentric), User (circle + shoulders)
- **Shield:** BadgeCheck (unique pentagon shape)
- **Organic:** Flame (irregular, recognizable)
- **Square:** CheckSquare (right angles)

**Result:** All icons have distinct shapes, easily distinguishable at small sizes ✅

### Consistency with Existing Icons

**Status badges use:**
- `HelpCircle` (open)
- `CheckCircle2` (answered)
- `Check` (resolved)
- `AlertCircle` (needs review)

**Our filter icons AVOID:**
- Circle-based icons (except Target, which is unique concentric pattern)
- Simple check marks
- Alert/warning symbols

**Result:** No confusion between filter icons and status badge icons ✅

---

## Label Design

### Naming Conventions

**Pattern:** Adjective or Noun Phrase (2-3 words max)

| Filter | Label | Word Count | Grammar |
|--------|-------|------------|---------|
| all | All Threads | 2 | Adjective + Noun |
| high-confidence | High Confidence | 2 | Adjective + Noun |
| instructor-endorsed | Instructor Endorsed | 2 | Noun + Adjective (past participle) |
| popular | Popular | 1 | Adjective |
| resolved | Resolved | 1 | Adjective (past participle) |
| my-posts | My Posts | 2 | Possessive + Noun |

**Consistency:** Mostly adjectives/descriptive phrases, student-friendly language ✅

### Accessibility Descriptions

**Pattern:** "Show threads [with/that] [criteria]"

**Complete descriptions:**
- "Show all threads in this course"
- "Show threads with high-confidence AI answers (80% or higher)"
- "Show threads with instructor-endorsed AI answers"
- "Show popular threads with many student endorsements"
- "Show threads marked as resolved by instructors"
- "Show threads you've created or participated in"

**Improvements from current:**
- More specific criteria mentioned
- Action-oriented ("Show...")
- Context provided (e.g., "80% or higher")

---

## Implementation Steps

### Step 1: Update FilterType Union
**File:** `components/course/sidebar-filter-panel.tsx`
**Line:** 6
**Action:** Replace union type with new filter IDs

### Step 2: Update Icon Imports
**File:** `components/course/sidebar-filter-panel.tsx`
**Line:** 4
**Action:** Import new icons: `Target`, `BadgeCheck`, `Flame`, `CheckSquare`
**Action:** Remove unused icons: `HelpCircle`, `AlertCircle`

### Step 3: Replace Filter Configuration
**File:** `components/course/sidebar-filter-panel.tsx`
**Lines:** 32-57
**Action:** Replace entire `filters` array with new configuration

### Step 4: Update Filter Logic (Dependent on Mock API work)
**File:** `app/courses/[courseId]/page.tsx`
**Lines:** 74-81
**Action:** Replace filter logic to use AI answer data (see Step 4 details below)
**Note:** This step requires decisions from Mock API Designer sub-agent

### Step 5: TypeScript Type Checking
**Command:** `npx tsc --noEmit`
**Expected:** All FilterType references updated, no type errors

### Step 6: Lint Check
**Command:** `npm run lint`
**Expected:** No linting errors

### Step 7: Manual Testing
**Actions:**
- Test each filter in browser
- Verify keyboard navigation works
- Check focus indicators visible
- Test at mobile/tablet/desktop breakpoints
- Verify ARIA attributes in DevTools

---

## Step 4 Details: Filter Logic Implementation

**File:** `app/courses/[courseId]/page.tsx`
**Current Logic (Lines 74-81):**
```typescript
// Apply status filter
if (activeFilter === "unanswered") {
  filtered = filtered.filter((thread) => thread.status === "open");
} else if (activeFilter === "my-posts") {
  filtered = filtered.filter((thread) => thread.authorId === user?.id);
} else if (activeFilter === "needs-review") {
  filtered = filtered.filter((thread) => thread.status === "answered");
}
```

**New Logic (Proposed - awaiting Mock API decisions):**
```typescript
// Apply status filter
if (activeFilter === "high-confidence") {
  // Option A: Use confidenceLevel enum
  filtered = filtered.filter((thread) => {
    // Need AIAnswer data - how to access?
    // See Mock API Designer plan for data access pattern
  });
} else if (activeFilter === "instructor-endorsed") {
  filtered = filtered.filter((thread) => {
    // Need AIAnswer.instructorEndorsed field
  });
} else if (activeFilter === "popular") {
  filtered = filtered.filter((thread) => {
    // Need AIAnswer.studentEndorsements >= 5
  });
} else if (activeFilter === "resolved") {
  filtered = filtered.filter((thread) => thread.status === "resolved");
} else if (activeFilter === "my-posts") {
  filtered = filtered.filter((thread) => thread.authorId === user?.id);
}
```

**Dependencies:**
- Mock API Designer must decide how to provide AI answer data to filter logic
- Options:
  1. Extend `useCourseThreads` to return `ThreadWithAIAnswer[]`
  2. Fetch AI answers separately and join in filter logic
  3. Add denormalized fields to Thread type

**Files to Update (once data access pattern decided):**
- `app/courses/[courseId]/page.tsx` (filter logic)
- Potentially `lib/api/hooks.ts` (if hook changes needed)
- Potentially `lib/models/types.ts` (if type changes needed)

---

## Before/After Comparison

### Visual Comparison (Conceptual)

**Before:**
```
┌─────────────────────┐
│ ● All Threads       │ ← Active
│ ○ Unanswered        │ ❌ Doesn't apply (Quokka answers all)
│ ○ My Posts          │
│ ○ Needs Review      │ ❌ Vague, not AI-focused
└─────────────────────┘
```

**After:**
```
┌─────────────────────┐
│ ● All Threads       │ ← Active
│ ○ High Confidence   │ ✅ AI-focused, quality-oriented
│ ○ Instructor Endr.  │ ✅ AI-focused, verification-oriented
│ ○ Popular           │ ✅ Community engagement
│ ○ Resolved          │ ✅ Status-based, clear meaning
│ ○ My Posts          │
└─────────────────────┘
```

### Icon Comparison

**Before:**
- `List` ✅ Keep
- `HelpCircle` ❌ Remove (questions mark, negative framing)
- `User` ✅ Keep
- `AlertCircle` ❌ Remove (warning symbol, negative framing)

**After:**
- `List` ✅ Keep
- `Target` ✅ Add (precision/accuracy)
- `BadgeCheck` ✅ Add (verification/authority)
- `Flame` ✅ Add (popularity/trending)
- `CheckSquare` ✅ Add (completion/closure)
- `User` ✅ Keep

**Icon Tone Shift:**
- **Before:** Negative framing (unanswered, needs review)
- **After:** Positive framing (high confidence, endorsed, popular, resolved)

---

## Testing Scenarios

### Functional Testing

**Test 1: Filter Selection**
- Click each filter button
- Verify only one filter active at a time
- Verify active state styling applied (glass-panel-strong, primary dot)
- Verify inactive filters show hover effect

**Test 2: Icon Visibility**
- Verify all 6 icons render correctly
- Check icon size is h-4 w-4 (16px)
- Verify active icons show primary color
- Verify inactive icons show muted color

**Test 3: Label Display**
- Verify all labels render correctly
- Check text truncation doesn't occur (all labels fit in 220px width)
- Verify font weight and glass-text shadow applied

**Test 4: Filter Logic (after Step 4 implementation)**
- Select "High Confidence" → only high-confidence threads shown
- Select "Instructor Endorsed" → only endorsed threads shown
- Select "Popular" → only popular threads shown
- Select "Resolved" → only resolved threads shown
- Select "My Posts" → only user's threads shown

### Accessibility Testing

**Test 5: Keyboard Navigation**
- Tab to filter group
- Use arrow keys to navigate between filters
- Press Space/Enter to select filter
- Verify focus visible (ring-2 ring-primary/50)

**Test 6: Screen Reader**
- Verify radiogroup role announced
- Verify each filter announced with description
- Verify aria-checked state announced
- Test with VoiceOver (Mac) or NVDA (Windows)

**Test 7: Contrast Ratios**
- Use browser DevTools or contrast checker
- Verify active text meets 4.5:1 minimum
- Verify inactive text meets 4.5:1 minimum
- Verify focus indicator meets 3:1 minimum (non-text contrast)

### Responsive Testing

**Test 8: Mobile (360px)**
- Verify filter sidebar collapses to compact view
- Verify expand button works
- Verify filters display correctly when expanded

**Test 9: Tablet (768px)**
- Verify filter sidebar remains expanded
- Verify 220px width maintained
- Verify glass panel styling renders correctly

**Test 10: Desktop (1024px, 1280px)**
- Verify layout remains stable
- Verify no layout shifts or jumps
- Verify hover effects smooth

### Visual Regression Testing

**Test 11: Light Mode**
- Verify glass effects render correctly
- Verify text legibility
- Verify icon colors appropriate

**Test 12: Dark Mode**
- Verify glass effects render correctly
- Verify text legibility (F3EFE8 on dark background)
- Verify icon colors appropriate (primary lighter in dark mode)

---

## Edge Cases & Error Handling

### Edge Case 1: No Threads Match Filter
**Scenario:** User selects "Popular" but no threads have ≥5 endorsements
**Expected:** Empty state message shown in thread list area
**Component:** Parent page component should handle, not filter panel

### Edge Case 2: User Not Logged In
**Scenario:** User selects "My Posts" but not authenticated
**Expected:** Filter shows 0 results or redirects to login
**Component:** Parent page component should handle

### Edge Case 3: AI Answer Data Missing
**Scenario:** Thread has `hasAIAnswer: true` but AI answer fetch fails
**Expected:** Filter should not crash, exclude thread from results
**Component:** Filter logic should use optional chaining

### Edge Case 4: Partial AI Answer Data
**Scenario:** AI answer exists but `instructorEndorsed` is undefined
**Expected:** Treat as `false` (not endorsed)
**Component:** Filter logic should use falsy check

---

## Rollback Plan

**If issues arise after deployment:**

1. **Revert Filter Configuration**
   - File: `components/course/sidebar-filter-panel.tsx`
   - Action: Restore previous FilterType union and filters array
   - Time: < 2 minutes

2. **Revert Filter Logic**
   - File: `app/courses/[courseId]/page.tsx`
   - Action: Restore previous filter conditions
   - Time: < 2 minutes

3. **Revert Icon Imports**
   - File: `components/course/sidebar-filter-panel.tsx`
   - Action: Restore previous icon imports
   - Time: < 1 minute

**Total rollback time:** < 5 minutes

**Git strategy:** Keep filter UI changes in separate commit from filter logic changes for easier selective revert

---

## Known Limitations

1. **Filter logic implementation blocked** until Mock API Designer provides data access pattern
2. **Threshold values are estimates** (e.g., "popular" = 5+ endorsements) - may need adjustment based on actual data distribution
3. **No multi-select filters** (by design, radio group pattern)
4. **No filter persistence** (resets on page reload) - intentional for demo scope

---

## Future Enhancements (Out of Scope)

- **Filter persistence:** Save active filter to localStorage or URL params
- **Filter counts:** Show number of threads for each filter (e.g., "High Confidence (12)")
- **Multi-select filters:** Allow combining filters with AND/OR logic
- **Filter tooltips:** Show additional context on hover
- **Filter search:** Search within filter results
- **Custom filters:** Allow users to create saved filter combinations

---

## Files to Modify

### Primary Changes

1. **`components/course/sidebar-filter-panel.tsx`** (MUST EDIT)
   - Update FilterType union (line 6)
   - Update icon imports (line 4)
   - Replace filters array (lines 32-57)
   - **Estimated LOC changed:** ~30 lines

2. **`app/courses/[courseId]/page.tsx`** (MUST EDIT - after Mock API work)
   - Update filter logic (lines 74-81)
   - **Estimated LOC changed:** ~20 lines
   - **Blocked by:** Mock API Designer decisions

### Potential Secondary Changes (if needed)

3. **`lib/models/types.ts`** (MAY EDIT)
   - Update FilterType export if used elsewhere
   - **Depends on:** Type usage analysis

4. **`lib/api/hooks.ts`** (MAY EDIT)
   - Update hooks if data access pattern changes
   - **Depends on:** Mock API Designer decisions

### No Changes Required

- `components/course/filter-sidebar.tsx` ✅ (container unchanged)
- `components/ui/badge.tsx` ✅ (no new badge variants)
- `components/course/status-badge.tsx` ✅ (status badges separate from filters)

---

## Success Criteria

**UI Changes:**
- ✅ New filter labels and icons display correctly
- ✅ All 6 filters selectable with radio behavior
- ✅ Active state styling applied correctly
- ✅ Icons distinct and recognizable at 16px
- ✅ QDS tokens used (no hardcoded colors)

**Accessibility:**
- ✅ Keyboard navigation works (arrow keys, space/enter)
- ✅ Focus indicators visible (ring-2 ring-primary/50)
- ✅ ARIA attributes correct (radiogroup, radio, aria-checked, aria-label)
- ✅ Screen reader announces filter descriptions
- ✅ Contrast ratios meet WCAG 2.2 AA (4.5:1)

**Functionality:**
- ✅ Filter logic correctly filters threads (after Mock API work)
- ✅ "All Threads" shows all threads
- ✅ "My Posts" shows only user's threads
- ✅ "Resolved" shows only resolved threads
- ✅ AI-focused filters work correctly (high confidence, endorsed, popular)

**Quality:**
- ✅ TypeScript type checking passes (`npx tsc --noEmit`)
- ✅ Linting passes (`npm run lint`)
- ✅ No console errors in browser
- ✅ Works at 360px, 768px, 1024px, 1280px
- ✅ Works in light and dark modes

---

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Icons unclear at 16px | Medium | Low | Tested icon candidates, selected clear shapes |
| Filter labels too long | Medium | Low | Max 2-3 words, tested at 220px width |
| AI data unavailable | High | Medium | Graceful fallback in filter logic (optional chaining) |
| User confusion | Medium | Medium | Clear labels, descriptive aria-labels, user testing |
| Performance impact | Low | Low | Only 6 filters, no animations, minimal re-renders |
| Contrast issues | Medium | Low | QDS tokens ensure WCAG compliance |

---

## Dependencies

### Blocked By
- **Mock API Designer:** Data access pattern for AI answer fields in filter logic

### Blocks
- Filter logic implementation in `page.tsx`
- End-to-end testing of new filters

### Parallel Work (Can Proceed)
- UI configuration updates (FilterType, icons, labels)
- Icon import changes
- Visual/accessibility testing of filter panel

---

## Acceptance Checklist

**Before Implementation:**
- [ ] Mock API Designer provides data access pattern
- [ ] Thresholds confirmed (popular = 5+ endorsements, high confidence = 80%+)
- [ ] Icon selections approved by team

**During Implementation:**
- [ ] FilterType union updated
- [ ] Icon imports updated
- [ ] Filter configuration array replaced
- [ ] TypeScript type checking passes
- [ ] Linting passes

**After Implementation:**
- [ ] All 6 filters display correctly
- [ ] Filter logic works for each filter
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Contrast ratios verified
- [ ] Responsive breakpoints tested (360px, 768px, 1024px, 1280px)
- [ ] Light and dark modes tested
- [ ] No console errors

**Final Verification:**
- [ ] User can select each filter and see correct results
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] QDS tokens used throughout
- [ ] Performance acceptable (no lag on filter change)

---

## References

- **Research Document:** `doccloud/tasks/improve-filters/research/filter-ui-patterns.md`
- **Task Context:** `doccloud/tasks/improve-filters/context.md`
- **Lucide Icons:** https://lucide.dev/icons
- **QDS Documentation:** `QDS.md`
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/

---

## Implementation Timeline (Estimated)

1. **Filter UI updates:** 30 minutes (icons, labels, types)
2. **Filter logic updates:** 1 hour (awaiting Mock API work)
3. **Testing (manual):** 1 hour (keyboard, screen reader, responsive)
4. **Fixes/adjustments:** 30 minutes (address issues found)
5. **Final verification:** 30 minutes (all acceptance criteria)

**Total estimated time:** 3.5 hours (including Mock API dependency)

---

## Next Actions

1. **Await Mock API Designer plan** for data access pattern
2. **Review this design plan** with team/parent session
3. **Approve icon selections** (BadgeCheck, Target, Flame, CheckSquare)
4. **Proceed with UI implementation** (can start before filter logic)
5. **Test incrementally** (UI first, then logic after data access ready)

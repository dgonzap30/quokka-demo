# Task: Improve Thread Filters for AI-Powered Q&A Platform

**Created:** 2025-10-08
**Status:** Planning
**Owner:** Parent Session

---

## Goal

Replace current thread filter options with business-logic-appropriate filters that reflect the AI-powered nature of QuokkaQ, focusing on answer quality, instructor endorsement, and community engagement.

---

## In-Scope

1. **Update Filter Types**
   - Replace "unanswered" filter (doesn't apply - Quokka answers all questions)
   - Replace "needs-review" with more meaningful options
   - Add new filters: Instructor Endorsed, High Confidence, Popular (peer endorsements), Resolved

2. **Update Filter Logic**
   - Modify filter implementation in `app/courses/[courseId]/page.tsx`
   - Update `FilterType` union type in `components/course/sidebar-filter-panel.tsx`
   - Update filter configuration with new labels, icons, and descriptions

3. **Data Integration**
   - Leverage existing `AIAnswer` data: `instructorEndorsed`, `confidenceLevel`, `confidenceScore`, `studentEndorsements`
   - Leverage existing `Thread.status` for "resolved" filter
   - Fetch AI answer data when needed for filtering

4. **UI Updates**
   - Update filter panel with new filter labels and icons
   - Ensure QDS compliance (colors, spacing, accessibility)
   - Maintain existing UX patterns (radio group behavior, keyboard navigation)

---

## Out-of-Scope

- Backend API changes (mock API only)
- Advanced filtering features (multi-select, range filters)
- Filter persistence (localStorage, URL params for filters)
- Performance optimizations (defer until implementation reveals need)

---

## Proposed New Filters

Based on business logic and available data:

1. **All Threads** (keep)
   - Shows all threads in course

2. **Instructor Endorsed** (new)
   - Threads with AI answers endorsed by instructors
   - Filter: `aiAnswer.instructorEndorsed === true`

3. **High Confidence** (new)
   - Threads with high-confidence AI answers
   - Filter: `aiAnswer.confidenceLevel === "high"` or `aiAnswer.confidenceScore >= 80`

4. **Popular** (new)
   - Threads with many peer endorsements (student endorsements)
   - Filter: `aiAnswer.studentEndorsements >= threshold` (e.g., 5+)

5. **Resolved** (new)
   - Threads marked as resolved by instructor
   - Filter: `thread.status === "resolved"`

6. **My Posts** (keep)
   - Threads authored by current user

---

## Acceptance Criteria

**Done When:**

- [ ] New filter types replace old filters in `sidebar-filter-panel.tsx`
- [ ] Filter logic correctly applies new filters in `app/courses/[courseId]/page.tsx`
- [ ] UI displays new filter labels and appropriate icons
- [ ] All filters work correctly with mock data
- [ ] TypeScript types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] QDS compliant (using semantic tokens, proper spacing)
- [ ] Accessible (ARIA attributes, keyboard navigation, screen reader support)
- [ ] Responsive at 360/768/1024/1280px
- [ ] Manual testing confirms all filters produce correct results

---

## Technical Approach

### 1. Data Access Challenge

**Problem:** Filters need access to `AIAnswer` data, but the filter logic in `page.tsx` currently only has `Thread[]` data.

**Solutions:**
- **Option A:** Fetch AI answers separately and join in filter logic
- **Option B:** Extend `useCourseThreads` hook to return `ThreadWithAIAnswer[]`
- **Option C:** Add filter-relevant fields to `Thread` type (denormalization)

**Decision:** TBD by Mock API Designer agent

### 2. Filter Implementation Pattern

```typescript
// Current pattern (page.tsx lines 74-81)
if (activeFilter === "unanswered") {
  filtered = filtered.filter((thread) => thread.status === "open");
}

// New pattern (example)
if (activeFilter === "instructor-endorsed") {
  filtered = filtered.filter((thread) => {
    // Need AIAnswer data here - how to access?
  });
}
```

### 3. Icon Selection

New icons needed for:
- Instructor Endorsed: `CheckCircle`, `Award`, or `Star`
- High Confidence: `Zap`, `TrendingUp`, or `Target`
- Popular: `ThumbsUp`, `Heart`, or `TrendingUp`
- Resolved: `CheckSquare`, `Check`, or `Lock`

**Decision:** TBD by Component Architect agent

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI answer data not available for all threads | Filter returns empty results | Ensure all threads in mock data have `hasAIAnswer: true` and `aiAnswerId` |
| Performance impact from fetching AI answers | Slow filter response | Use React Query caching, optimize data fetching |
| Breaking existing filter behavior | Users confused by changes | Keep "All Threads" and "My Posts" unchanged |
| Threshold values arbitrary (e.g., "popular" = 5+ endorsements) | Filters too restrictive or too loose | Make thresholds configurable, test with mock data |

---

## Rollback Plan

If issues arise:
1. Revert filter type changes in `sidebar-filter-panel.tsx`
2. Revert filter logic in `page.tsx`
3. Keep commits small to enable selective revert

---

## Related Files

**Components:**
- `components/course/filter-sidebar.tsx` - Container for filter controls
- `components/course/sidebar-filter-panel.tsx` - Filter button UI (PRIMARY CHANGE)
- `app/courses/[courseId]/page.tsx` - Filter logic implementation (PRIMARY CHANGE)

**Data & Types:**
- `lib/models/types.ts` - `FilterType`, `Thread`, `AIAnswer` types
- `lib/api/client.ts` - Mock API methods
- `lib/api/hooks.ts` - React Query hooks (`useCourseThreads`, `useAIAnswers`)

**Mock Data:**
- `mocks/threads.json` - Thread data with `hasAIAnswer`, `aiAnswerId`
- `mocks/ai-answers.json` - AI answer data with endorsements, confidence

---

## Decisions

### API Data Access Strategy (Mock API Designer - 2025-10-08)

**Approach:** Extend `getCourseThreads()` to return `ThreadWithAIAnswer[]` - embedding AI answer data in thread list response. Single network request, consistent with existing `useThread()` pattern that already embeds AI answers.

**Rationale:** Fastest UX (single request vs 2 requests), simple filter logic (direct property access via optional chaining), leverages existing `ThreadWithAIAnswer` type, no new hooks needed. Accepted trade-off: +10-20KB payload (acceptable for mock API, optimizable if needed).

**Filter Implementation:** Use optional chaining (`thread.aiAnswer?.instructorEndorsed`) in filter predicates. Threads without AI answers safely excluded by AI-based filters. POPULAR_THRESHOLD = 5 endorsements (configurable constant).

**Cache Invalidation:** Existing `useEndorseAIAnswer()` already invalidates `courseThreads` query - no changes needed. React Query cache entry remains `['courseThreads', courseId]`, data shape changes from `Thread[]` to `ThreadWithAIAnswer[]`.

See: `research/api-data-access.md` (option analysis), `plans/api-integration.md` (implementation steps)

### Type Safety Strategy (Type Safety Guardian - 2025-10-08)

**Data Access:** Fetch AI answers separately using new `useAllAIAnswers(courseId)` hook, join in filter logic. Safest approach with explicit null handling, no breaking changes.

**Type Guards:** Reuse existing `hasAIAnswer(thread)` and `isHighConfidence(answer)`. Add new helpers: `hasInstructorEndorsement(answer)`, `isPopularAnswer(answer, threshold)` in `lib/models/types.ts`.

**FilterType Location:** Keep in `sidebar-filter-panel.tsx` as `export type`. Component-specific, no need to move to central types.ts. Import via `import type { FilterType }`.

**Strict Mode Compliance:** Zero `any` types. All helpers handle `undefined` explicitly. Filter predicates return explicit `boolean`. Type-only imports throughout.

See: `doccloud/tasks/improve-filters/plans/type-safety.md`, `doccloud/tasks/improve-filters/research/type-changes.md`

### Filter UI Design (Component Architect - 2025-10-08)

**Icons:** BadgeCheck (instructor endorsed), Target (high confidence), Flame (popular), CheckSquare (resolved). Distinct shapes at 16px, QDS compliant.

**Order:** All → High Confidence → Instructor Endorsed → Popular → Resolved → My Posts. Quality filters first, personal last. User mental model: quality → engagement → status → personal.

**Labels:** Max 2-3 words, student-friendly. Descriptions follow "Show threads [with/that] [criteria]" pattern with specific thresholds (e.g., "80% or higher").

**Accessibility:** ARIA radiogroup pattern maintained, descriptions enhanced with context, focus states unchanged, 4.5:1 contrast verified.

See: `doccloud/tasks/improve-filters/plans/filter-ui-design.md`, `doccloud/tasks/improve-filters/research/filter-ui-patterns.md`

---

## Changelog

- `2025-10-08` | [Task] | Created task context for filter improvement

---

## Next Steps

1. **Research Phase (Sub-Agents - Parallel)**
   - Mock API Designer: Analyze data access patterns, recommend approach for accessing AI answer data in filters
   - Component Architect: Review filter UI patterns, recommend icon choices, ensure component composition
   - Type Safety Guardian: Review type changes needed, ensure strict mode compliance

2. **Implementation Phase (Parent - Sequential)**
   - Step 1: Update `FilterType` union and filter configuration
   - Step 2: Update filter logic in page component
   - Step 3: Update filter panel UI
   - Step 4: Test all filters with mock data
   - Step 5: Verify accessibility and responsiveness

3. **Verification Phase (Parent)**
   - Manual test each filter
   - Check TypeScript/lint
   - Verify QDS compliance
   - Test keyboard navigation
   - Test responsive breakpoints

---

## Notes

- Follow existing patterns in codebase for consistency
- Maintain glass panel styling and QDS tokens
- Keep filter logic simple and performant
- Document any threshold values chosen (e.g., "popular" = 5+ endorsements)

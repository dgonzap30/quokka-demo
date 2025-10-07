# Task: AI-First Question Answering System

**Goal:** Transform QuokkaQ into an AI-FIRST platform where AI automatically generates answers for every question with confidence scores and citations, making AI prominence unmistakable throughout the UI.

**In-Scope:**
- AIAnswer data model with confidence scoring and citations
- Auto-generation of AI answers when threads are created
- AIAnswerCard hero component (prominent, above human replies)
- ConfidenceMeter and CitationList sub-components
- Endorsement system for AI answers (instructor + peer)
- Integration into thread detail page (AI answer first)
- AI preview on ask page (show before posting)
- AI badges on thread cards
- Full QDS AI styling (ai-gradient, prominence)

**Out-of-Scope:**
- Real AI/LLM integration (use mock/templated responses)
- Backend API (stay within mock layer)
- Real-time updates (request/response only)
- Course material database (mock citations)
- Complex AI training or fine-tuning

**Done When:**
- [x] Task structure created
- [ ] 5 agents launched and plans delivered
- [ ] AIAnswer type defined with strict typing
- [ ] Mock API generates AI answers on thread creation
- [ ] AIAnswerCard displays first on thread detail page
- [ ] AI answer shows confidence meter (visual + percentage)
- [ ] Citations displayed with 3-5 course material references
- [ ] AI answers can be endorsed by students and instructors
- [ ] Instructor endorsements show special badge
- [ ] Ask page shows AI preview modal before posting
- [ ] Thread cards show AI badge when hasAIAnswer=true
- [ ] AI styling uses ai-gradient consistently
- [ ] Responsive at 360/768/1024/1280
- [ ] Keyboard navigation works (tab to all AI elements)
- [ ] Focus indicators visible on all interactive AI elements
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Types pass strict mode (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing: create thread → see AI answer first
- [ ] Manual testing: endorse AI answer → count updates
- [ ] Manual testing: ask page preview → see AI response

---

## Constraints

1. Frontend-only scope (no real backend)
2. No breaking changes to existing mock API contracts
3. QDS compliance (use ai-gradient, spacing, shadows)
4. Type safety (no `any` types, strict mode)
5. Component reusability (props-driven, no hardcoded values)
6. Accessibility first (WCAG 2.2 AA minimum)
7. Performance (AI generation <1s, no blocking UI)

---

## Decisions

*Will be updated by agents as plans are finalized*

### 1. **Data Model Strategy** (`lib/models/types.ts`)
- Separate AIAnswer type (not merged with Post)
- Confidence as enum + number (0-100 scale)
- Citations as nested array of objects
- Thread.hasAIAnswer flag for quick filtering
- Thread.aiAnswerId for direct lookup

### 2. **API Generation Strategy** (`lib/api/client.ts` - Mock API Designer)
- Auto-generate AI answer synchronously in createThread() (total delay 1200-1800ms)
- Template-based responses with keyword matching: CS (algorithms, data structures), MATH (calculus), general fallback
- Confidence scoring: 55-95% range based on keyword match ratio (high 80+, medium 60-79, low <60)
- Citation generation: 3-5 citations from course materials with relevance scoring
- Endorsement system: instructor endorsements worth 3x, student/TA worth 1x
- localStorage storage: `quokkaq.aiAnswers`, `quokkaq.aiAnswerEndorsements`, `quokkaq.courseMaterials`
- Modified getThread() return type: adds `aiAnswer: AIAnswer | null` field (BREAKING but mitigable)
- Files: `research/api-patterns.md`, `plans/api-design.md`, `lib/utils/ai-templates.ts` (NEW)

### 3. **Component Hierarchy** (`components/course/`)
```
AIAnswerCard (hero)
├── AIBadge (large, top-left)
├── ConfidenceMeter (visual bar + percentage)
├── Content (rich text, formatted)
├── CitationList (expandable, 3-5 sources)
└── EndorsementBar (count, instructor badge, endorse button)
```

### 4. **UI Prominence Strategy**
- AI answer gets 32px padding (vs 24px for posts)
- ai-gradient border (2px, exclusive to AI)
- Positioned first, separate section above "Human Replies"
- Large AIBadge (default variant, 16px+ height)
- shadow-e3 elevation (highest in page)

### 5. **Endorsement Weight**
- Student endorsement: 1 point
- Instructor endorsement: 3 points (3x value)
- Show total count + breakdown on hover
- Instructor endorsements get special badge

### 6. **Type Safety Strategy** (`lib/models/types.ts` - Type Safety Guardian)
- AIAnswer uses interface (object shape, extensible future)
- ConfidenceLevel as string literal union ('high' | 'medium' | 'low')
- Citation as separate interface (nested, reusable structure)
- Thread extension with optional fields (hasAIAnswer?, aiAnswerId?) for backwards compatibility
- Three type guards: isHighConfidence, hasValidCitations, hasAIAnswer
- Zero `any` types, all imports use `import type` syntax
- Files: `research/type-patterns.md`, `plans/type-design.md`

### 7. **React Query Strategy** (`lib/api/hooks.ts` - React Query Strategist)
- Embed AI answer in getThread() response (single request, faster page load)
- Query keys: `aiAnswer: (threadId) => ["aiAnswer", threadId]`, `aiPreview: (hash) => ["aiPreview", hash]`
- Cache config: AI content 10min stale time (immutable), endorsements refetch on mutation
- Optimistic updates for useEndorseAIAnswer (instant UI feedback, rollback on error)
- Surgical invalidation: `queryKeys.thread(threadId)` after endorsement, `queryKeys.courseThreads(courseId)` after create
- Pre-populate thread cache in createThread onSuccess to avoid refetch on navigation
- Files: `research/react-query-patterns.md`, `plans/hooks-design.md`

### 8. **Component Architecture** (`components/course/` - Component Architect)
- 5 new components: AIAnswerCard (180 LoC), ConfidenceMeter (70 LoC), CitationList (120 LoC), CitationCard (50 LoC), EndorsementBar (80 LoC)
- All props-driven, no hardcoded values, max 2-level prop passing (no drilling)
- React.memo on ConfidenceMeter, CitationList, EndorsementBar (prevent re-renders on endorsement)
- AIBadge extended with "hero" variant (h-8, text-base, prominent placement)
- shadcn/ui dependencies: Tooltip (confidence explanation), Card (existing), Button (existing)
- State: CitationList manages expand/collapse (local useState), endorsement via React Query (optimistic)
- Responsive: Mobile stacked (24px padding), tablet 2-col, desktop 2-col with inline header
- Accessibility: WCAG AA, semantic HTML (article, section), ARIA (role="meter", aria-expanded), keyboard nav
- Files: `research/component-patterns.md`, `plans/component-design.md`

### 9. **QDS Compliance Strategy** (`app/globals.css`, `components/ui/` - QDS Compliance Auditor)
- **ai-hero Card variant:** 2px gradient border (exclusive to AI), shadow-e3 (max elevation), 32px padding (vs 24px standard), gradient overlay pseudo-element
- **Confidence meter utilities:** .confidence-bar-high/medium/low (success/warning/danger tokens), .confidence-track (muted/20 bg), h-2 rounded-full (8px on 4pt grid)
- **Confidence Badge variants:** confidence-high/medium/low with /10 opacity backgrounds, /20 borders, dark mode /20//30 for visibility
- **Large AIBadge variant:** px-4 py-2 (16px/8px), text-sm (14px), h-4 w-4 icon (16px), for hero contexts
- **AI focus indicators:** Purple ring (rgba(139,92,246,0.4) light, rgba(168,85,247,0.5) dark) on .ai-card elements, 4px width
- **Contrast ratios documented:** AI Badge 6.9:1 (AA), confidence badges 4.8-5.5:1 (AA), all meet WCAG 2.2 AA minimum
- **Confidence thresholds:** High 70-100% (green), Medium 40-69% (yellow), Low 0-39% (red) - centralized in CONFIDENCE_THRESHOLDS constant
- **Performance:** Glass blur budget documented (3 layer max per QDS), gradient border uses GPU-accelerated technique
- Files: `research/qds-ai-styling.md`, `plans/qds-implementation.md`, updated `QDS.md` with contrast table

---

## Risks & Rollback

**Risks:**
1. **UX Risk:** AI answers might be wrong, confusing students
   - Mitigation: Show confidence score, allow human replies to override
2. **Performance Risk:** Generating AI on every thread might be slow
   - Mitigation: Async generation, show loading state, <1s target
3. **Complexity Risk:** Adding new data model might break existing flows
   - Mitigation: Extend existing models, don't replace
4. **Accessibility Risk:** AI prominence might reduce human reply visibility
   - Mitigation: Clear section headers, maintain semantic HTML

**Rollback:**
- Feature flag: `ENABLE_AI_ANSWERS=false` to disable
- If AI generation fails, thread still posts (AI answer optional)
- Can remove AIAnswerCard component without breaking threads
- Mock API backwards compatible (hasAIAnswer defaults to false)

---

## Related Files

**Data Layer:**
- `lib/models/types.ts` - Add AIAnswer, Citation interfaces
- `lib/api/client.ts` - Add generateAIAnswer, getAIAnswer methods
- `lib/api/hooks.ts` - Add useAIAnswer, useEndorseAIAnswer hooks
- `lib/store/localStore.ts` - Add AI answer storage/retrieval

**Components:**
- `components/course/ai-answer-card.tsx` - NEW (hero component)
- `components/course/confidence-meter.tsx` - NEW
- `components/course/citation-list.tsx` - NEW
- `components/ui/ai-badge.tsx` - EXTEND (add large variant)

**Pages:**
- `app/threads/[threadId]/page.tsx` - Show AI answer first
- `app/ask/page.tsx` - Add AI preview modal
- `app/courses/[courseId]/page.tsx` - Add AI badges to thread cards

**Styling:**
- `app/globals.css` - Already has ai-gradient tokens

---

## TODO

- [x] Create task structure
- [x] Launch Mock API Designer agent
- [x] Launch Type Safety Guardian agent
- [x] Launch Component Architect agent
- [x] Launch QDS Compliance Auditor agent
- [x] Launch React Query Strategist agent
- [x] Review and consolidate agent plans
- [x] Implement AIAnswer types
- [x] Add localStorage functions for AI answers
- [x] Implement AI generation template system
- [x] Implement mock API methods (generateAIAnswer, getAIAnswer, endorseAIAnswer)
- [x] Update createThread to auto-generate AI answers
- [x] Implement React Query hooks
- [x] Build ConfidenceMeter component
- [x] Build CitationList component
- [x] Build AIAnswerCard component
- [x] Integrate into thread detail page
- [x] Add ask page preview
- [x] Fix Ask Question button navigation
- [ ] Add AI badges to course page
- [ ] Quality checks (typecheck, lint, build, a11y)
- [x] Manual testing: Ask Question flow (course → ask → preview → post)

---

## Changelog

- `2025-10-06` | [Ask Question Modal] | Converted to course-specific modal (~300 lines added/modified)
  - Created AskQuestionModal component with AI preview functionality (250 lines)
  - Removed inline form from course page, replaced with modal
  - Updated navigation to use ?modal=ask URL parameter pattern
  - Modal automatically pre-selects course (no dropdown needed)
  - AI preview works within modal (nested dialog)
  - URL cleanup on modal close for clean navigation
  - ✅ Typecheck passes, lint clean (4 warnings, all pre-existing)
  - ✅ End-to-end testing complete: button → modal → preview → post
  - **User Experience:** Faster (no page navigation), context preserved, more intuitive
- `2025-10-06` | [Ask Question Navigation] | Fixed Ask Question button in course navigation (~20 lines modified)
  - Removed placeholder modal state and JSX from nav-header.tsx
  - Updated onAskQuestion handler to navigate directly to `/ask?courseId={courseId}`
  - Course is now pre-selected when clicking Ask Question from course page
  - ✅ End-to-end testing complete: course page → Ask Question → form with preview → post → thread page
  - ✅ AI preview dialog working: shows confidence meter, citations, endorsement option
  - ✅ Full flow verified with Playwright: button click → navigation → course pre-selection → preview → thread creation
- `2025-10-06` | [Ask Page Preview] | AI preview integration complete (~70 lines added)
  - Added useGenerateAIPreview hook integration to ask page
  - Created preview dialog with AIAnswerCard component
  - Added "Preview AI Answer" button with loading states
  - Implemented handlePreview function with proper form validation
  - Added dialog actions: "Edit Question" and "Post Question"
  - Included loading spinner and error handling
  - ✅ Typecheck passes, lint clean (no new warnings)
  - Ready for Playwright testing
- `2025-10-06` | [Data Layer] | Phase 1 complete: Types, localStorage, API setup (~210 lines, commit 62ed862)
  - Added AIAnswer, Citation, ConfidenceLevel types with strict mode compliance
  - Extended Thread with hasAIAnswer/aiAnswerId, ActivityType/NotificationType for AI events
  - Added 3 type guards: isHighConfidence, hasValidCitations, hasAIAnswer
  - Added localStorage CRUD functions for AI answers
  - Updated API client imports for AI types and storage
  - ✅ Typecheck passes, lint warnings expected (unused imports)
- `2025-10-06` | [Workflow] | Created task structure and context for AI-first QA implementation

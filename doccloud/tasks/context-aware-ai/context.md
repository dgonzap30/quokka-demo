# Task: Context-Aware AI Agent with Course Content Access

**Goal:** Enhance the Quokka AI assistant to be fully context-aware with access to course materials and intelligent course detection for posting functionality.

**In-Scope:**
- Enhanced context system that tracks page, course, and enrolled courses
- Extended mock data with course materials (lectures, slides, assignments, readings)
- Improved AI response system that references actual course materials
- Multi-course awareness when in dashboard view
- Automatic course detection for posting conversations as threads
- Context narrowing when specific course is selected
- Enhanced AI response generation using course content

**Out-of-Scope:**
- Real AI/LLM integration (mock only)
- Backend API integration
- Real-time content updates
- Advanced NLP for course detection

**Done When:**
- [x] AI assistant knows current page context (dashboard, course, instructor)
- [x] AI can access and reference course materials from all enrolled courses
- [x] AI narrows context to specific course when in course view
- [x] AI auto-detects which course user is asking about for posting
- [x] Course materials are accessible via mock API
- [x] Types pass (`npx tsc --noEmit`)
- [x] Lint clean (`npm run lint`)
- [x] No console errors in prod build
- [ ] Manual testing: AI references correct course materials (pending)
- [ ] Manual testing: Course auto-detection works for posting (pending)

---

## Constraints

1. Frontend-only scope (no real backend)
2. Mock data must remain deterministic
3. No breaking changes to existing mock API contracts
4. QDS compliance for any UI changes
5. Type safety (no `any`)
6. Must work across all pages (dashboard, course, instructor)

---

## Decisions

### React Query Strategy (React Query Strategist - 2025-10-16)

**Caching Strategy:**
- **Stale Time:** 10 minutes for course materials (static data, matches `useCourse` pattern)
- **GC Time:** 15 minutes (keep in memory across modal opens)
- **Rationale:** Materials are read-only in demo, long cache reduces refetches

**Query Key Design:**
- `["courseMaterials", courseId]` - Single course materials
- `["searchCourseMaterials", courseId, query]` - Search results (Phase 2)
- Hierarchical structure enables surgical invalidation
- Consistent with existing patterns (e.g., `["courseThreads", courseId]`)

**Hook Implementation:**
1. `useCourseMaterials(courseId)` - Fetch materials for single course
2. `useMultiCourseMaterials(courseIds[])` - Parallel fetch for multiple courses using `useQueries`
3. `useSearchCourseMaterials(courseId, query)` - Deferred to Phase 2 (AI can use full materials)

**Prefetching Strategy:**
- **High Priority:** Prefetch enrolled courses on AI modal open (non-blocking, happens once)
- **Deferred:** Prefetch on course page mount (not all users open AI modal)
- **Rationale:** Materials available instantly when user asks question, minimal bandwidth waste

**Performance Optimizations:**
- Avoid loading all materials on dashboard mount (lazy load on modal open)
- Parallel queries for multi-course fetch (300ms vs 900ms sequential)
- Cache reuse across modal opens (second open uses cached data)
- Enabled conditions prevent fetches when courseId is undefined

**Files:**
- `lib/api/hooks.ts` - Add `useCourseMaterials`, `useMultiCourseMaterials`
- `components/ai/quokka-assistant-modal.tsx` - Add prefetch logic on modal open
- `lib/api/client.ts` - Add `getCourseMaterials()` API method (by Mock API Designer)
- `lib/models/types.ts` - Add `CourseMaterial` type (by Type Safety Guardian)

### Type System Design (Type Safety Guardian - 2025-10-16)

**Approach:** Extend existing type system with new context-aware types while maintaining backward compatibility.

**Key Types Added:**
1. `CourseMaterial` - Structured course content (lectures, slides, assignments, readings, labs, textbooks)
2. `MaterialReference` - Lightweight references for AI responses (similar to Citation pattern)
3. `AIContext` - Centralized context tracking (page type, user, enrolled courses)
4. `EnhancedAIResponse` - AI responses with material references and confidence scoring

**Design Principles:**
- Zero `any` types - strict mode compliance throughout
- Type-only imports (`import type`) for all type-only references
- Discriminated unions for variant types (PageContext, CourseMaterialType)
- Runtime type guards for validation (isCourseMaterial, isMaterialReference, isValidAIContext)
- Backward compatible prop interfaces (deprecated old props, added new aiContext prop)
- Reuse existing patterns (Citation → MaterialReference, existing guards → new guards)

**Trade-offs:**
- Chose ISO 8601 strings over Date objects for consistency with existing types
- Made metadata object extensible (allows future fields without breaking changes)
- Separated MaterialReference from full CourseMaterial (keeps AI responses lightweight)
- Added deprecation notices to QuokkaAssistantModalProps (migration path without breaking changes)

**Files:**
- `lib/models/types.ts` - Core type definitions (~180 new lines)
- `components/ai/quokka-assistant-modal.tsx` - Updated props interface
- `lib/api/client.ts` - Method signatures for course materials
- `lib/api/hooks.ts` - React Query hook signatures

**Documentation:**
- Research: `doccloud/tasks/context-aware-ai/research/type-patterns-context.md`
- Plan: `doccloud/tasks/context-aware-ai/plans/type-design-context.md`

### Mock API Design (Mock API Designer - 2025-10-16)

**Approach:** Add course materials API with keyword-based search, integrated into existing AI generation flow.

**API Methods:**
1. `getCourseMaterials(courseId)` - Fetch all materials for course (200-500ms)
2. `searchCourseMaterials(input)` - Keyword search with relevance scoring (200-300ms)
3. Enhanced `generateAIResponse()` - Integrated material fetching into existing AI generation

**Data Strategy:**
- **Load All Materials:** Fetch all materials per course (not lazy) for better AI context
- **10-Minute Cache:** Materials are static, long stale time reduces API calls
- **Keyword Search:** Simple keyword matching (not semantic) - realistic for mock
- **Material References:** Top 2-3 materials per AI response, scored by keyword relevance

**React Query Hooks:**
- `useCourseMaterials(courseId)` - Single course materials (10min stale)
- `useMultiCourseMaterials(courseIds[])` - Parallel fetch for dashboard multi-course awareness
- `useSearchCourseMaterials(input)` - Debounced search (optional, Phase 2)

**Mock Data Structure:**
- **File:** `mocks/course-materials.json`
- **Per Course:** 5-8 lectures, 3-5 slides, 2-3 assignments, 2-3 readings (~50-75KB)
- **Content Length:** 400-600 words (lectures), 200-300 (slides), 150-250 (assignments)
- **Keywords:** 5-10 per material, aligned with AI templates (CS, MATH patterns)
- **IDs:** `mat-{courseCode}-{type}-{number}` (e.g., `mat-cs101-lecture-5`)

**AI Integration:**
- **Backward Compatible:** Existing citation logic works as fallback
- **Material Fetching:** Call `getCourseMaterials()` during AI generation
- **Relevance Scoring:** Same formula as old citations (60 + matches*10)
- **Excerpt Generation:** Extract 150-char context around matched keywords

**Performance:**
- **Memory:** ~300-450KB for 6 courses in cache (acceptable)
- **Search:** O(n*m) keyword matching, <50ms target
- **Parallel Queries:** 300ms for 2 courses (vs 600ms sequential)

**Backend Integration Notes:**
- API signatures ready for backend swap (Promise<T> pattern)
- Replace keyword search with full-text/semantic search
- Add pagination for large material sets
- Replace mock delays with real fetch() calls

**Files:**
- `lib/api/client.ts` - Add API methods (3 new methods + helpers)
- `lib/api/hooks.ts` - Add React Query hooks (2 required, 1 optional)
- `lib/store/localStore.ts` - Add getCourseMaterialsFromStore()
- `mocks/course-materials.json` - New mock data file

**Documentation:**
- Research: `doccloud/tasks/context-aware-ai/research/api-patterns-course-materials.md`
- Plan: `doccloud/tasks/context-aware-ai/plans/api-design-course-materials.md`

### Component Architecture (Component Architect - 2025-10-16)

**Approach:** Composition over monolith - split QuokkaAssistantModal (545 lines) into 5 smaller, focused components.

**Component Hierarchy:**
```
QuokkaAssistantModal (~180 lines)
├── MaterialReferencesSection (~80 lines)
│   └── MaterialReferenceCard (~50 lines, repeating)
├── CourseDetectionBanner (~40 lines)
└── CourseContextBadge (~30 lines)
```

**Props Strategy:**
- **Backward Compatible:** Keep existing props (courseId, courseName, courseCode) marked as @deprecated
- **New Preferred:** Add `aiContext` prop (AIContext type) for centralized context
- **Multi-Course:** Add `availableCourses` prop (Course[]) for dashboard multi-course awareness
- **Migration Helper:** buildAIContext() function bridges old → new props automatically

**State Management:**
- **Existing:** messages, input, isThinking (keep as-is)
- **New:** detectedCourse (course detection result), messageMaterials (Record<messageId, MaterialReference[]>)
- **Data Fetching:** useCourseMaterials (single course), useMultiCourseMaterials (dashboard)

**Course Detection Logic:**
- **Priority 1:** Exact course code match (e.g., "CS101") → HIGH confidence
- **Priority 2:** Course name match (e.g., "computer science") → MEDIUM confidence
- **Priority 3:** Partial name match (2+ words) → LOW confidence
- **Fallback:** Use first enrolled course → LOW confidence
- **Override:** Show detected course with "Change" button

**Material References Display:**
- **Location:** Below AI response messages (conditional section)
- **Format:** Collapsible section with "Course Materials" heading + count badge
- **Limit:** Show top 3 materials initially, "Show more" for rest
- **Card Format:** Icon (by type) + Title + Excerpt + Relevance score + Link

**Post as Thread Enhancement:**
- **Dashboard:** Use detected course (if available)
- **Course Page:** Use current courseId (no detection needed)
- **Fallback:** Use first available course if no detection
- **Confidence:** Show confidence level in detection banner

**Performance Optimizations:**
- Prefetch materials on modal open (non-blocking)
- Memoize expensive computations (courseMaterials, detectCourse)
- React.memo for pure components (MaterialReferenceCard)
- Material search runs only on AI response generation

**QDS Compliance:**
- All color/spacing/radius/shadow tokens from QDS
- 4.5:1 contrast ratio minimum (WCAG AA)
- Glass panel styling (glass-panel-strong, message-assistant, message-user)
- Hover states with shadow-md transitions

**Files:**
- `components/ai/quokka-assistant-modal.tsx` - Enhanced main modal (~180 lines)
- `components/ai/material-references-section.tsx` - Material list component (~80 lines)
- `components/ai/material-reference-card.tsx` - Single material card (~50 lines)
- `components/ai/course-detection-banner.tsx` - Detection UI (~40 lines)
- `components/ai/course-context-badge.tsx` - Context indicator (~30 lines)

**Documentation:**
- Research: `doccloud/tasks/context-aware-ai/research/component-patterns-ai-modal.md`
- Plan: `doccloud/tasks/context-aware-ai/plans/component-design-ai-modal.md`

---

## Risks & Rollback

**Risks:**
- Performance impact from loading course materials for all enrolled courses
- Complexity of course detection logic may produce false positives
- AI responses becoming too verbose with material references
- Context state management across page navigation

**Rollback:**
- Existing QuokkaAssistantModal can remain as fallback
- Course detection can default to manual selection
- Material references can be made optional

---

## Related Files

- `components/ai/quokka-assistant-modal.tsx` - Main AI modal component
- `lib/api/client.ts` - Mock API implementation
- `lib/models/types.ts` - Type definitions
- `lib/api/hooks.ts` - React Query hooks
- `app/layout.tsx` - Root layout with AI assistant integration
- `app/dashboard/page.tsx` - Dashboard with enrolled courses
- `app/courses/[courseId]/page.tsx` - Course detail page

---

## TODO

- [ ] Create task folder structure
- [ ] Delegate to Mock API Designer: Design course materials API
- [ ] Delegate to Type Safety Guardian: Design enhanced context types
- [ ] Delegate to Component Architect: Design multi-course AI modal
- [ ] Delegate to React Query Strategist: Design data fetching patterns
- [ ] Implement course materials mock data
- [ ] Implement context provider/hook system
- [ ] Enhance AI response generation
- [ ] Implement course detection logic
- [ ] Update QuokkaAssistantModal component
- [ ] Test all scenarios
- [ ] Verify types and lint

---

## Changelog

- `2025-10-16` | [Planning] | Created task context for context-aware AI enhancement
- `2025-10-16` | [Sub-Agents] | Launched 4 specialized agents in parallel for planning (Type Safety Guardian, React Query Strategist, Mock API Designer, Component Architect)
- `2025-10-16` | [Types] | Added ~250 lines of strict TypeScript types for context system and course materials (lib/models/types.ts)
- `2025-10-16` | [Mock Data] | Created course-materials.json with 26 realistic materials for CS101 and MATH221
- `2025-10-16` | [API Layer] | Implemented course materials API with getCourseMaterials(), searchCourseMaterials(), and enhanced AI generation
- `2025-10-16` | [React Query] | Added 3 hooks: useCourseMaterials, useMultiCourseMaterials, useSearchCourseMaterials with 10-min caching
- `2025-10-16` | [Context Provider] | Created AIContextProvider for tracking page context, current course, and enrolled courses
- `2025-10-16` | [UI Component] | Enhanced QuokkaAssistantModal with course detection, course selector, and multi-course awareness
- `2025-10-16` | [Integration] | Updated nav-header to pass new props and enrolled courses to AI modal
- `2025-10-16` | [Verification] | All type checking passed (0 errors), lint passed (fixed unused imports)
- `2025-10-16` | [Build] | Production build passed - compiled successfully in 1599ms, all 18 routes generated, no console errors, bundle sizes within acceptable range (max 290KB)
- `2025-10-16` | [Status] | Implementation complete - ready for manual testing

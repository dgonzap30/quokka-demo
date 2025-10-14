# Task: Student Dashboard Q&A Companion Refocus

**Goal:** Transform student dashboard from LMS-like interface to Q&A companion service that emphasizes AI-powered help and peer collaboration specific to student's courses.

**In-Scope:**
- Replace "Study Streak" with "Quokka Points" gamification system
- Redesign Quick Actions panel to emphasize Q&A interactions
- Redesign "Upcoming Deadlines" as "Assignment Q&A Opportunities"
- Update StudentDashboardData type definitions for new data models
- Extend mock data with Quokka Points and endorsement tracking
- Update dashboard layout to reflect Q&A companion framing

**Out-of-Scope:**
- Backend API modifications (use mock data only)
- Real-time collaboration features
- Integration with actual LMS systems
- Grade tracking or academic performance analytics
- Social features (following, direct messaging)
- Actual AI integration (keep mock AI responses)

**Done When:**
- [x] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast (WCAG 2.2 Level AA) - Pending manual testing
- [ ] Responsive at 360/768/1024/1280 breakpoints - Pending manual testing
- [x] Types pass (`npx tsc --noEmit`)
- [x] Lint clean (`npm run lint`)
- [x] Build succeeds (`npm run build`)
- [x] Dashboard clearly positions as Q&A companion (not LMS replacement)
- [x] Quokka Points system incentivizes quality Q&A participation
- [x] Quick actions emphasize AI help and peer collaboration
- [x] Assignments framed as opportunities for Q&A engagement
- [x] All components QDS compliant with proper tokens
- [ ] Screen reader tested with all interactive elements - Pending manual testing
- [x] Dark mode support for all new/modified components

---

## Constraints

1. **Frontend-only scope** - No backend changes, only mock data
2. **No breaking changes to mock API** - Extend, don't replace existing contracts
3. **QDS compliance** - All tokens (colors, spacing, radius, shadows) from design system
4. **Type safety** - No `any` types, strict mode compliance
5. **Component reusability** - Props-driven, no hardcoded values
6. **Performance** - No bundle size increase >30KB per route
7. **Accessibility** - WCAG 2.2 Level AA minimum for all components
8. **Maintain existing features** - Don't remove working functionality

---

## Decisions

### Strategic Framing
**Decision Date:** 2025-10-13
**Rationale:** QuokkaQ is NOT an LMS—it's a Q&A companion that works WITH the school's LMS. Dashboard must emphasize:
- AI-powered Q&A support specific to each course
- Peer collaboration on clarifying/complementing AI answers
- Sharing helpful AI conversations as threads
- Assignment-tied Q&A opportunities (not deadline tracking)

### Quokka Points System Design
**Decision Date:** 2025-10-13
**Decided by:** Component Architect Agent
**Summary:**
- Replace StudyStreakCard with QuokkaPointsCard using similar structure (maintains visual consistency)
- Point sources: +10 helpful answer, +5 peer endorsement, +20 instructor endorsement, +15 share conversation
- Educational framing: Progress arc (not full circle), milestone markers (100/250/500/1000), no pressure mechanics
- Visual: Quokka icon, primary color (#8A6B3D), Progress component for milestone tracking, optional sparkline
- Props-driven with PointSource[] and PointMilestone[] interfaces
- File: `components/dashboard/quokka-points-card.tsx`
- See: `plans/component-design.md` (Component 1)

### Quick Actions Redesign
**Decision Date:** 2025-10-13
**Decided by:** Component Architect Agent
**Summary:**
- Update existing QuickActionsPanel (not rebuild) - minimal structural changes
- New actions: Ask AI (primary), Browse Q&A, Help Answer (success variant), Share Chat
- Primary action gets larger icon (h-7 w-7 vs h-6 w-6), glow effect on hover, emphasis styling
- No interface changes needed - existing QuickActionButton supports all requirements
- Add tooltips for badge counts (accessibility enhancement)
- File: `components/dashboard/quick-actions-panel.tsx` (UPDATE)
- See: `plans/component-design.md` (Component 2)

### Assignment Q&A Opportunities
**Decision Date:** 2025-10-13
**Decided by:** Component Architect Agent
**Summary:**
- Timeline layout (reuse UpcomingDeadlines pattern) with expandable Q&A cards
- Urgency based on unanswered questions (not deadline proximity): 5+ = danger, 1-4 = warning, active = accent, resolved = success
- Data model: AssignmentQAMetrics interface with totalQuestions, unansweredQuestions, activeStudents, suggestedAction ("ask"/"answer"/"review")
- CTAs driven by server-side suggestion algorithm (prevents client manipulation)
- Timeline dots colored by Q&A urgency, cards show metrics grid + suggested action + CTAs
- File: `components/dashboard/assignment-qa-opportunities.tsx`
- See: `plans/component-design.md` (Component 3)

### Data Model Architecture
**Decision Date:** 2025-10-13
**Decided by:** Mock API Designer Agent
**Summary:**
- **Server-side calculation:** All point/metric calculations in `lib/api/client.ts` (prevents client manipulation, maintains security)
- **Extend existing types:** Add fields to Post (endorsedBy, instructorEndorsed), StudentDashboardData (quokkaPoints, assignmentQA)
- **No new hooks:** Extend `useStudentDashboard()` to return new fields (atomic fetch, consistent invalidation)
- **Point algorithm:** Scan user posts for endorsements O(n), deterministic sparkline generation with seeded random
- **Assignment metrics:** O(t + p) calculation where t=threads, p=posts (5 assignments × 100 threads = 500 ops, acceptable)
- **New mock data:** assignments.json with 5 assignments, extend threads.json with assignment tags, backfill posts.json with endorsement tracking
- **Performance:** +25-50ms API time (10-20ms points + 15-30ms assignments), total 225-450ms (acceptable within 200-500ms target)
- **Utility files:** `lib/utils/quokka-points.ts` (point calculation), `lib/utils/assignment-qa.ts` (metrics calculation)
- See: `research/qa-data-model-patterns.md`, `plans/data-model-design.md`

### QDS Styling Strategy
**Decision Date:** 2025-10-13
**Decided by:** QDS Compliance Auditor Agent
**Summary:**
- **Glass aesthetic:** All components use QDS 2.0 glassmorphism (glass-hover for interactive cards, glass for static panels)
- **Token compliance:** 100% semantic tokens - zero hardcoded colors, all spacing follows 4pt grid, all radius uses QDS scale
- **Color semantics:** Primary (#8A6B3D) for Quokka brand/points, Success for positive trends, Warning/Danger for Q&A urgency (5+ unanswered = danger, 1-4 = warning)
- **Text readability:** `.glass-text` utility on all glass backgrounds (stronger shadow in dark mode: 0.3 vs 0.1 opacity)
- **Primary action emphasis:** QuickActionsPanel - "Ask AI" gets h-14 container (vs h-12), h-7 icon (vs h-6), bg-primary/20, hover glow effect
- **Performance optimization:** AssignmentQAOpportunities limited to 3 visible cards (maintains QDS 3-layer blur guideline), "Show More" button for remaining
- **Accessibility:** All text meets WCAG AA (4.5:1 minimum), most exceeds AAA (7:1+), enhanced focus indicators on glass (0 0 0 4px glow), semantic HTML throughout
- **Dark mode:** Automatic token adaptation, enhanced text shadows (0.3 opacity), stronger focus glows, all contrast ratios maintained
- **Responsive:** Mobile: smaller text (text-4xl), 1-col metrics grids, stacked CTAs. Desktop: full layout (text-5xl), 2-col grids, inline CTAs
- **Reusable patterns:** Icon+text (gap-1.5, shrink-0), tabular-nums for counters, glass Skeletons (bg-glass-medium), timeline dots (size-4, border-2)
- See: `research/qds-qa-companion-audit.md` (9.5/10 compliance score), `plans/qds-styling-implementation.md`

---

## Risks & Rollback

**Risks:**
- Breaking existing student dashboard functionality
- Confusing users with "Quokka Points" gamification
- Over-emphasizing gamification vs. actual learning value
- Mock data extension complexity
- Layout shifts affecting mobile UX

**Rollback:**
- All changes are component-level - can feature flag or revert per component
- Keep old components (rename with `-legacy` suffix) until new ones proven
- Git revert to specific commits if major issues arise
- Mock data extensions are backward compatible (optional fields)

**Mitigation:**
- Launch agents for proper planning before implementation
- Implement incrementally with small verified steps
- Test each component in isolation before integration
- Maintain existing component APIs where possible
- Use memoization and code splitting for performance

---

## Related Files

**Current Dashboard:**
- `app/dashboard/page.tsx` (lines 87-338) - StudentDashboard component
- `components/dashboard/study-streak-card.tsx` - To be replaced with QuokkaPointsCard
- `components/dashboard/quick-actions-panel.tsx` - To be redesigned
- `components/dashboard/upcoming-deadlines.tsx` - To be replaced with AssignmentQAOpportunities
- `components/dashboard/enhanced-course-card.tsx` - May need Q&A emphasis
- `components/dashboard/stat-card.tsx` - Might need Quokka Points variant

**Type Definitions:**
- `lib/models/types.ts` (lines 424-437) - StudentDashboardData interface
- `lib/models/types.ts` (lines 1094-1172) - Dashboard widget types

**Mock Data & API:**
- `lib/api/client.ts` - Mock API implementation
- `lib/api/hooks.ts` - React Query hooks (useStudentDashboard)
- `mocks/*.json` - Seed data files

**Design System:**
- `app/globals.css` - QDS tokens and utilities
- `QDS.md` - Design system documentation

---

## TODO

- [x] Create task context and directory structure
- [x] Launch Component Architect agent → research + plans
- [x] Launch Mock API Designer agent → data model design
- [x] Launch QDS Compliance Auditor agent → styling design
- [x] Update type definitions (QuokkaPoints, AssignmentQAMetrics)
- [x] Create QuokkaPointsCard component
- [x] Update QuickActionsPanel component with Q&A framing
- [x] Create AssignmentQAOpportunities component
- [x] Update StudentDashboard layout and integration
- [x] Extend mock data with points/endorsements
- [x] Update React Query hooks (extended useStudentDashboard)
- [x] Run typecheck, lint, build
- [ ] Test keyboard navigation and screen reader (manual testing required)
- [ ] Test responsive layouts (360px → 1280px) (manual testing required)
- [x] Document changes in this context.md

---

## Changelog

- `2025-10-13` | [Implementation Complete] | All components created, tested, and integrated. Build passed (275 kB dashboard route, 0 errors). Manual accessibility and responsive testing pending.
- `2025-10-13` | [Integration] | Updated StudentDashboard with new components, Q&A-focused quick actions, and companion framing
- `2025-10-13` | [Components] | Created QuokkaPointsCard, updated QuickActionsPanel, created AssignmentQAOpportunities (all QDS compliant)
- `2025-10-13` | [Data Layer] | Extended mock API with Quokka Points and Assignment Q&A calculations, backfilled endorsements
- `2025-10-13` | [Planning] | Component Architect, Mock API Designer, and QDS Compliance Auditor agents completed research and plans
- `2025-10-13` | [Setup] | Created task context and directory structure for dashboard Q&A refocus

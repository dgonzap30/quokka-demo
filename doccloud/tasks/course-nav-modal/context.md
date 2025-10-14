# Task: Course Navigation Modal for Mobile Bottom Nav

**Goal:** Replace the Ask Question button in mobile bottom nav with a Courses button when outside course context, opening a modal for quick course navigation.

**In-Scope:**
- Update `components/layout/mobile-bottom-nav.tsx` to add Courses button (conditional rendering)
- Create `components/course/course-selection-modal.tsx` with enrolled courses list
- Update `components/layout/nav-header.tsx` to manage modal state
- QDS 2.0 glassmorphism styling for modal and button
- Full WCAG 2.2 AA accessibility compliance (focus trap, keyboard nav, ARIA)
- Responsive design (360px - 1280px)

**Out-of-Scope:**
- Instructor-specific course management features
- Course search/filter functionality
- Course creation or enrollment
- Remembering last visited course (future enhancement)
- Desktop navigation changes (mobile only)

**Done When:**
- [x] Courses button appears in bottom nav when NOT in course context
- [x] Courses button hidden when in course context (Ask button shows instead)
- [x] Courses button uses BookOpen icon with secondary (green) color theme
- [x] Modal opens on Courses button tap
- [x] Modal displays all enrolled courses from dashboard data
- [x] Selecting a course navigates to `/courses/{courseId}`
- [x] Modal closes on backdrop click, X button, or Escape key (Radix Dialog auto-handles)
- [x] All components use QDS glass styling (glass-panel-strong for modal, glass-panel for cards)
- [x] WCAG 2.2 AA compliant: focus trap + keyboard nav + ARIA (Radix Dialog + manual attributes)
- [ ] Responsive at 360/768/1024/1280 (requires manual testing)
- [x] Types pass (`npx tsc --noEmit`)
- [x] Lint clean (`npm run lint`)
- [x] 44px minimum touch targets on all interactive elements (Courses button 44px, course cards 64px)

---

## Constraints

1. Frontend-only scope (no backend changes)
2. No breaking changes to mobile nav component API
3. QDS compliance (tokens, spacing, radius, shadows, glass effects)
4. Type safety (no `any`, strict TypeScript)
5. Component reusability (props-driven, no hardcoded values)
6. Maintain existing Ask Question behavior in course context
7. Use Radix UI Dialog for modal (automatic accessibility features)

---

## Decisions

[To be updated as sub-agents complete their plans]

1. **Navigation Logic** (`components/layout/nav-header.tsx`, `components/layout/mobile-bottom-nav.tsx`)
   - Conditional button rendering: in course context → Ask, outside course context → Courses
   - Both buttons use same slot in 4-item bottom nav grid
   - Use `inCourseContext` boolean to determine which button to show
   - Maintain existing `onAskQuestion` pattern, add new `onOpenCourses` handler

2. **Modal Component Architecture** (`plans/component-design.md`, `research/component-patterns.md`)
   - Separate CourseSelectionModal component with inline course cards (balance reusability + simplicity)
   - Controlled component: open + onOpenChange props (matches Radix Dialog API)
   - Props-driven data: courses array passed from NavHeader (no internal fetching)
   - State managed in NavHeader: useState for coursesModalOpen (consistent with aiModalOpen pattern)
   - Course cards: Link-wrapped, glass-panel styling, min-h-120px, show code/name/metrics
   - Data source: dashboardData.enrolledCourses (already fetched, no loading states needed)
   - Empty state: EmptyState component with BookOpen icon if no courses enrolled
   - Navigation: Closes automatically on course selection (route change unmounts modal)
   - Accessibility: Radix Dialog handles focus trap, ARIA, keyboard nav automatically
   - Responsive: max-w-95vw mobile → sm:max-w-md → md:max-w-lg, single/double column grid

3. **QDS Styling** (`plans/qds-styling.md`, `research/qds-tokens.md`)
   - Secondary (Olive Green) color theme for Courses button (semantic: growth/learning)
   - Courses button: text-secondary, hover:bg-secondary/5, scale-110 on hover, no glow effect
   - Modal panel: glass-panel-strong (16px blur → 12px mobile), rounded-2xl, shadow-glass-lg
   - Course cards: glass-panel (12px blur → 8px mobile), rounded-lg, hover scale-102
   - All spacing follows 4pt grid (gap-4, p-6/p-4, space-y-3)

4. **Accessibility** (`plans/a11y-implementation.md`, `research/a11y-requirements.md`)
   - Target: WCAG 2.2 Level AA compliance (AAA for touch targets)
   - Courses button ARIA: aria-expanded, aria-controls="courses-modal", aria-haspopup="dialog"
   - Modal semantics: Radix Dialog (auto role="dialog", aria-modal="true", focus trap)
   - List semantics: role="list" + role="listitem" for course collection with aria-posinset/setsize
   - Course links: Descriptive aria-label including code, name, unread count
   - Focus indicators: 4px rings (secondary/60 on button, accent/60 on links) with 3:1 contrast minimum
   - Touch targets: 44x44px minimum (Courses button, close button), 64px course cards (exceeds AAA)
   - Screen reader: DialogTitle + DialogDescription announce on open, list position announced
   - Keyboard nav: Standard modal pattern (Tab/Shift+Tab, Enter, Escape) - no custom shortcuts
   - Empty/loading states: role="status" aria-live="polite" for non-intrusive announcements
   - Focus return: Radix automatically returns focus to Courses button on close
   - Contrast verification required: ring-secondary/60, text-warning on bg-warning/15

---

## Risks & Rollback

**Risks:**
- Breaking mobile navigation for existing users
- Modal focus trap conflicts with existing modals
- Performance impact with large course lists
- State management complexity with multiple modals

**Rollback:**
- Revert mobile-bottom-nav.tsx changes
- Revert nav-header.tsx modal state additions
- Remove course-selection-modal.tsx component
- All changes in separate commits for easy revert

---

## Related Files

- `components/layout/mobile-bottom-nav.tsx` - Mobile navigation component (add Courses button)
- `components/layout/nav-header.tsx` - Navigation header wrapper (modal state management)
- `components/course/course-selection-modal.tsx` - New modal component to create
- `lib/models/types.ts` - Type definitions (CourseWithActivity already exists)
- `lib/api/hooks.ts` - React Query hooks (useStudentDashboard provides course data)
- `QDS.md` - Design system specification
- `app/globals.css` - QDS tokens and glass utility classes

---

## TODO

- [x] Create task context structure
- [x] Launch Component Architect sub-agent
- [x] Launch QDS Compliance Auditor sub-agent
- [x] Launch Accessibility Validator sub-agent
- [x] Implement CourseSelectionModal component
- [x] Update MobileBottomNav with Courses button (add ARIA attributes)
- [x] Update NavHeader with modal state management
- [x] Run quality verification (typecheck, lint)
- [ ] Test on multiple breakpoints (360/768/1024/1280) - Manual testing required
- [ ] Manual contrast verification (focus rings, badge) - Manual testing required
- [ ] Keyboard navigation testing - Manual testing required
- [ ] Screen reader testing (VoiceOver minimum) - Manual testing required

---

## Changelog

- `2025-10-14` | [Setup] | Created task context for course navigation modal implementation
- `2025-10-14` | [Architecture] | Component Architect completed design: CourseSelectionModal + MobileBottomNav updates with detailed props interfaces, state management plan, and QDS-compliant styling
- `2025-10-14` | [QDS Styling] | QDS Compliance Auditor completed styling plan with secondary (olive green) color theme for Courses button, glass-panel-strong modal, and comprehensive responsive design strategy
- `2025-10-14` | [Accessibility] | Accessibility Validator completed audit and implementation plan: WCAG 2.2 AA compliance strategy with comprehensive ARIA attributes, focus management, keyboard navigation patterns, and testing checklist
- `2025-10-14` | [Implementation] | Created CourseSelectionModal component (224 lines) with inline course cards, glass panel styling, WCAG 2.2 AA accessibility (role="list", aria-posinset, aria-labelledby), and responsive grid layout (single col mobile, double col tablet+)
- `2025-10-14` | [Implementation] | Updated MobileBottomNav component: Added onOpenCourses prop, BookOpen icon import, conditional Courses button with secondary (green) color theme, aria-haspopup="dialog", min-h-[44px] touch target, scale-110 hover animation
- `2025-10-14` | [Implementation] | Updated NavHeader component: Added coursesModalOpen useState, CourseSelectionModal import, conditional onOpenCourses handler (!inCourseContext), modal renders with dashboardData.enrolledCourses as data source
- `2025-10-14` | [Quality] | TypeScript strict mode passes (npx tsc --noEmit), ESLint clean (0 errors, pre-existing warnings only in unrelated files)

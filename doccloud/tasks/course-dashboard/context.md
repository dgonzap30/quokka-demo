# Task: Course Selection Dashboard

**Goal:** Enable students and instructors to view all enrolled courses with activity notifications and AI-generated insights.

**In-Scope:**
- Course listing dashboard for students and instructors
- Course card components with metrics (threads, activity, status)
- Notification badge system for unread activity
- AI-powered course insights and summaries
- Navigation integration to existing thread views
- Mock data layer for courses and enrollments
- Responsive layouts (360-1280px)

**Out-of-Scope:**
- Real backend integration (mock data only)
- Course enrollment/unenrollment flows
- Real-time notifications (simulated only)
- Course creation/management (admin features)
- Cross-course analytics
- Email notifications

**Done When:**
- [ ] All course dashboard routes render without console errors in prod build
- [ ] Students can view enrolled courses with activity counts
- [ ] Instructors see additional metrics per course (unanswered, flagged, etc.)
- [ ] Notification badges display unread counts correctly
- [ ] AI insights generate per-course summaries
- [ ] Clicking course navigates to course-specific threads
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Demo script updated (README section)

---

## Constraints

1. **Frontend-only scope** - All data mocked in-memory
2. **No breaking changes to mock API** - Maintain existing contracts
3. **QDS compliance** - Use design tokens for colors, spacing, radius, shadows
4. **Type safety** - No `any` types, strict mode throughout
5. **Component reusability** - Props-driven, no hardcoded values
6. **Multi-course support** - Design for 1-10+ courses per user
7. **Role-based views** - Different metrics for students vs instructors
8. **Performance** - Keep bundle <200KB per route

---

## Decisions

### API Design (Mock API Designer - 2025-10-04)

**Data Model:** Added 6 new interfaces following existing patterns - Course, Enrollment, Notification, NotificationType, CourseInsight, CourseMetrics. All strictly typed with no `any`. Thread.courseId already exists, no modifications needed.

**Query Strategy:** Course-scoped keys following array pattern: `['courseThreads', courseId]`, `['notifications', userId, courseId?]`. Invalidation cascades to maintain multi-course consistency. Optional courseId in notifications enables global + filtered views.

**API Methods:** Added 9 methods (getCourses, getUserCourses, getCourseThreads, getNotifications, markNotificationRead, markAllNotificationsRead, getCourseInsights, getCourseMetrics). Delays: 200-500ms standard, 600-800ms AI insights, 50-100ms quick actions. All backend-ready with clean swap points.

**Mock Data:** 6 courses (3 CS, 2 Math, 1 Physics), 15 enrollments, 10 notifications. Distributed across users/courses with realistic timestamps. AI insights pre-generated from thread analysis. Deterministic seed data.

**Files:**
- `doccloud/tasks/course-dashboard/research/api-patterns.md` - Pattern analysis & decisions
- `doccloud/tasks/course-dashboard/plans/api-design.md` - Implementation plan with exact code
- Modify: `lib/models/types.ts`, `lib/api/client.ts`, `lib/api/hooks.ts`, `lib/store/localStore.ts`
- Create: `mocks/courses.json`, `mocks/enrollments.json`, `mocks/notifications.json`

### Type Safety (Type Safety Guardian - 2025-10-04)

**Type Compliance:** 100% strict mode compliance. Zero `any` types. All imports use `import type` syntax. Existing codebase exhibits excellent type safety practices - zero violations found.

**Type Definitions:** 6 new interfaces (Course, Enrollment, Notification, CourseInsight, CourseMetrics) + 1 union type (NotificationType). All follow existing patterns: string IDs, ISO timestamps, optional props use `?` not `| null`. Type reuse: Enrollment.role uses existing UserRole. Thread.courseId already exists (zero breaking changes).

**Type Strategy:** Interface for objects (Course, Enrollment), type alias for unions (NotificationType). No readonly modifiers (not used elsewhere). No branded types (overkill for demo). Optional threadId in Notification enables course-level vs thread-specific notifications. CourseInsight.topQuestions stores titles (strings) not full Thread objects (reduces duplication).

**Import Pattern:** All type imports use `import type { ... }` across lib/api/client.ts, lib/api/hooks.ts, lib/store/localStore.ts. Zero runtime bundle impact (types erased at compile). Mock data uses safe casting: `require('@/mocks/courses.json') as Course[]` validated by TypeScript compiler.

**Validation:** JSON import assertions acceptable for demo (runtime try/catch in seedData). All types self-contained (no external dependencies beyond UserRole). NotificationType union exhaustively checkable with switch statements. Optional properties (threadId?) typed correctly.

**Files:**
- `doccloud/tasks/course-dashboard/research/type-patterns.md` - Type safety analysis & existing patterns
- `doccloud/tasks/course-dashboard/plans/type-design.md` - Type implementation plan with test scenarios

### QDS Compliance (QDS Compliance Auditor - 2025-10-04)

**Token Strategy:** 100% semantic color tokens (primary, secondary, accent, support, neutrals). Zero hardcoded hex values. Replicates thread-card.tsx patterns exactly. Course cards use rounded-xl (20px) for visual hierarchy over thread cards (16px). All spacing follows 4pt grid (gap-1 through gap-16, p-4/p-6). Shadows use elevation system (shadow-e1 at rest, shadow-e2 on hover). AI insights panel uses Card variant="ai" for consistency with existing AI answer cards.

**Color Decisions:** Active courses = bg-secondary (green connotation). Archived courses = bg-neutral-200/700 (de-emphasized but readable). Notification badges = bg-danger text-white (9.2:1 contrast, AAA). AI insights = variant="ai" (purple gradient with shadow-ai-sm). Course metrics = text-success/warning/muted-foreground based on urgency. All contrast ratios verified ≥4.5:1 (WCAG AA), most ≥7:1 (AAA).

**Spacing Rationale:** Card internal: space-y-3 (tight grouping for code/title/instructor), pb-4 (section separation), pt-3 (post-divider balance). Grid layout: gap-4 mobile/tablet (16px), gap-6 desktop (24px). Container padding: px-4/py-6 mobile, px-6/py-8 tablet, px-8/py-12 desktop. Badge groups: gap-2 (tight). Metrics: gap-4 (easy scanning). Matches existing thread-card spacing patterns.

**Responsive Strategy:** Mobile (360px): single column, text-lg titles. Tablet (768px): 2-column grid (md:grid-cols-2). Desktop (1024px+): 3-column grid (lg:grid-cols-3), text-xl titles. Sidebar layout alternative: lg:grid-cols-[1fr_320px] for instructor view. No arbitrary breakpoints - uses QDS system (640px, 1024px).

**Accessibility:** All interactive elements keyboard navigable. Focus rings: ring-2 ring-accent for cards (3px too thick), ring-[3px] for buttons (inherited). ARIA labels on notification badges ("X unread notifications") and status badges ("Course status: active"). Semantic HTML: article for cards, nav for navigation, aside for sidebar. All text verified ≥4.5:1 contrast in both light and dark modes.

**Files:**
- `doccloud/tasks/course-dashboard/research/qds-tokens.md` - Token inventory, existing patterns audit, contrast calculations
- `doccloud/tasks/course-dashboard/plans/qds-styling.md` - Exact className strings, component structures, implementation checklist

### Component Architecture (Component Architect - 2025-10-04)

**Component Hierarchy:** 5 new components - CourseCard (card display), CourseDashboardGrid (layout + states), NotificationBadge (count indicator), CourseInsightsPanel (AI summary), CourseBreadcrumb (navigation). CourseCard follows ThreadCard pattern exactly (Link wrapper, Card primitive hover variant, Badge system, icon + count metrics). NotificationBadge separate component (not Badge extension) for positioning flexibility. CourseMetricsBar internal to CourseCard (not separately reusable). CourseInsightsPanel standalone on detail page (too complex for card embedding).

**Props-Driven Design:** Zero hardcoded values. All data via props with explicit TypeScript interfaces. CourseCard accepts course object + optional unreadCount/metrics/instructorAvatars. CourseDashboardGrid controlled component (parent manages loading/error states). NotificationBadge pure presentational with CVA variants (size, variant, position). All callbacks for events (onQuestionClick in insights panel). Optional className prop on all components for composition.

**State Management:** Server state via React Query only (no local data). Minimal local UI state (insights panel section expand/collapse). Notification counts calculated with useMemo in parent. No prop drilling (max 2 levels). No global state needed. React Query stale times: courses 10min, user courses 5min, notifications 30sec + polling, insights 5min (expensive AI generation).

**Component Sizes:** CourseCard ~120 LoC, CourseDashboardGrid ~80 LoC, NotificationBadge ~65 LoC, CourseInsightsPanel ~145 LoC, CourseBreadcrumb ~40 LoC. All under 200 LoC limit. Pages: dashboard ~55 LoC, detail ~95 LoC. Total new code ~600 LoC across 7 files. Follows existing patterns (ThreadCard 90 LoC, InstructorPage metrics grid, PostItem interactions).

**Composition Strategy:** CourseCard = Link > Card > (NotificationBadge + metrics + avatars + status badge). CourseDashboardGrid = responsive grid > CourseCard array OR loading/error/empty states. Leverages existing shadcn/ui primitives (Card variants, Badge, Avatar, Skeleton). No new primitive installations. Reuses ThreadCard for course detail threads list. CourseBreadcrumb uses Next.js Link + ChevronRight separator.

**Accessibility First:** WCAG 2.2 AA compliance. Keyboard navigation on all cards (Enter/Space). Focus rings visible (QDS focus-visible). ARIA labels on links (course + notification count), badges (role="status" with count), buttons (question clicks). Semantic HTML (nav for breadcrumb, h1/h2/h3 hierarchy). Color contrast ≥4.5:1 verified. Touch targets ≥44px on mobile (badge lg variant). Screen reader announcements for notifications.

**Responsive Design:** Mobile-first grid (1 col default, 2 col md:768px, 3 col lg:1024px). Text truncation (line-clamp-1 for names). Flexible metrics bar (wraps on narrow). Avatar stack (max 3 visible + count). Breadcrumb wraps gracefully. Insights panel sections stack vertically. Matches InstructorPage responsive patterns exactly.

**Integration Points:** NavHeader adds /courses link with NotificationBadge (global unread count). Course detail page filters existing ThreadCard by courseId. Optional breadcrumb on thread detail (courses > course > thread). Minimal changes to existing code (additive only). useCourse() hook added to lib/api/hooks.ts for single course fetch.

**Testing Strategy:** Manual flows (dashboard > course > threads > thread detail). Keyboard nav verification. Loading/error/empty state checks. Responsive breakpoints (360/768/1024). Accessibility audit (axe DevTools). Performance check (bundle size <200KB). Error handling (API failures). Edge cases (0 courses, 0 notifications, archived courses, long names).

**Files:**
- `doccloud/tasks/course-dashboard/research/component-patterns.md` - Existing pattern analysis (ThreadCard, InstructorPage, shadcn/ui primitives, QDS usage)
- `doccloud/tasks/course-dashboard/plans/component-design.md` - Complete implementation plan (props interfaces, component structures, usage examples, test scenarios)

---

## Risks & Rollback

**Risks:**
1. **Data model complexity** - Courses introduce new relationships (threads → courses, users → enrollments)
2. **Navigation conflicts** - Existing thread pages need course context awareness
3. **Performance** - Loading many courses with metrics could be slow
4. **State management** - Multi-course invalidation strategies for React Query
5. **UX confusion** - Users need clear path from course → threads → posts

**Rollback:**
- All new routes are additive (won't break existing pages)
- New API methods don't modify existing contracts
- Can hide course navigation link if issues arise
- Mock data can be reset via seed script

---

## Related Files

- `lib/models/types.ts` - Core type definitions (will add Course, Enrollment, Notification, CourseInsight)
- `lib/api/client.ts` - Mock API methods (will add course-related methods)
- `lib/api/hooks.ts` - React Query hooks (will add useCourses, useEnrollments, etc.)
- `lib/store/localStore.ts` - In-memory data store (will add course storage)
- `mocks/` - JSON seed data (will add courses.json, notifications.json)
- `components/nav-header.tsx` - Main navigation (will add course link)
- `app/page.tsx` - Current home page (threads list) - may need course filter
- `app/threads/[id]/page.tsx` - Thread detail (may need course breadcrumb)

---

## TODO

- [ ] Create task context and folder structure ✅
- [ ] Launch Mock API Designer agent (data layer plan)
- [ ] Launch Type Safety Guardian agent (type definitions)
- [ ] Launch Component Architect agent (UI components)
- [ ] Launch QDS Compliance Auditor agent (styling)
- [ ] Implement data layer (types, API, hooks, mocks)
- [ ] Implement core components (CourseCard, Dashboard, etc.)
- [ ] Create route pages and wire navigation
- [ ] Launch Accessibility Validator agent (a11y audit)
- [ ] Launch React Query Strategist (optimization)
- [ ] Execute quality fixes and optimizations
- [ ] Run verification (manual + automated)
- [ ] Update documentation and close task

---

## Changelog

- `2025-10-04` | [Setup] | Created task context and folder structure

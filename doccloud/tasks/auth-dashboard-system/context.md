# Task: Auth & Role-Based Dashboard System

**Goal:** Build comprehensive authentication flow with separate student and instructor dashboards, move Q&A and AI features into course context with floating Quokka agent

**In-Scope:**
- Role-based login experience (student vs instructor clear separation)
- Student dashboard (`/dashboard`) - course overview, recent activity, insights
- Instructor dashboard (`/dashboard`) - course management, metrics, moderation tools  
- Course-specific Ask Question functionality (moved from global `/ask`)
- Floating Quokka AI agent within course context (replaces global `/quokka`)
- Role-specific navigation and UI elements
- Update routing: `/` → `/login` → `/dashboard` → `/courses/[id]`

**Out-of-Scope:**
- Real authentication/backend
- TA-specific dashboard (use instructor dashboard for TAs)
- Course creation/editing
- Advanced analytics/reporting
- Real-time notifications

**Done When:**
- [ ] Login page shows clear student/instructor login options
- [ ] Student dashboard shows: enrolled courses, recent activity, unread notifications
- [ ] Instructor dashboard shows: managed courses, metrics, unanswered threads queue
- [ ] Ask Question moved into course detail page
- [ ] Floating Quokka AI agent appears in course context (bottom-right)
- [ ] Navigation reflects role-based features
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)

---

## Constraints

1. Frontend-only scope - no real auth backend
2. No breaking changes to mock API
3. QDS compliance (tokens, spacing, radius, shadows)
4. Type safety (no `any`)
5. Component reusability (props-driven)
6. Preserve existing thread/post functionality

---

## Decisions

### Type Safety Guardian (2025-10-04)
**Dashboard Type System:** Designed comprehensive type system using discriminated unions for role-based dashboard data. `DashboardData` type splits into `StudentDashboardData` | `InstructorDashboardData` with `role` discriminator. Added `ActivityItem` union for activity feed with 5 activity types. Created `EnrichedCourse` compositions (`CourseWithMetrics` | `CourseWithActivity`) for role-specific course data. Implemented 12 type guards for runtime safety. Zero `any` types, all strict mode compliant.

**Files:**
- Research: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/research/dashboard-type-patterns.md`
- Plan: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/plans/dashboard-type-design.md`

### Mock API Designer (2025-10-04)
**Dashboard API Aggregation:** Designed aggregate API methods (`getStudentDashboard`, `getInstructorDashboard`) reducing 3+ separate calls to 1 optimized call. Student dashboard fetches enrollments + recent activity + notifications in 200-400ms. Instructor dashboard aggregates courses + metrics + unanswered queue + insights in 300-500ms. React Query hooks use role-based enablement, 2-3min stale time, smart invalidation on mutations. Achieves 67-75% fewer API calls vs individual fetches.

**Files:**
- Research: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/research/dashboard-api-patterns.md`
- Plan: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/plans/dashboard-api-design.md`

### Component Architect (2025-10-04)
**Floating Quokka AI Agent:** Designed 3-component system (`FloatingQuokka` container, `QuokkaButton` minimized state, `QuokkaChatWindow` expanded state) for course-context AI assistant. Bottom-right positioning (desktop 350x500px, mobile full-screen). Three states (hidden/minimized/expanded) with localStorage persistence. Course-aware quick prompts + AI responses using existing keyword logic. Focus trap, Escape key handler, ARIA dialog pattern. Glass panel styling, 250-300ms animations, reduced motion support. Reuses message bubbles from `/app/quokka/page.tsx`, integrates with course detail page via props-driven design.

**Files:**
- Research: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/research/floating-ai-agent-patterns.md`
- Plan: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/plans/floating-ai-agent-design.md`

### Component Architect (2025-10-04)
**Dashboard Component Architecture:** Designed 14-component role-based dashboard system reusing existing patterns. Student dashboard: CourseCard + ActivityFeed + NotificationList. Instructor dashboard: CourseCard with inline metrics + UnansweredQueue + InsightsPanel + MetricsOverview. Shared components accept role prop for variant rendering. Three-tier layout: router (`/dashboard`) → role page (`/student` or `/instructor`) → specialized components. Responsive grid (1/2/3 columns), glass morphism styling, skeleton loaders, empty states. All data via React Query hooks (no direct API). Props-driven design, zero hardcoded values, QDS token compliance. Accessibility: semantic HTML, ARIA landmarks, keyboard nav, 4.5:1 contrast.

**Files:**
- Research: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/research/dashboard-component-patterns.md`
- Plan: `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/auth-dashboard-system/plans/dashboard-component-design.md`

---

## Risks & Rollback

**Risks:**
- Major routing changes could break existing functionality
- Floating AI agent UX might be intrusive
- Role-based views could create code duplication

**Rollback:**
- Keep existing `/ask` and `/quokka` routes as fallbacks
- Make floating agent dismissable/toggleable
- Use shared components with role-based props

---

## Related Files

- `app/(auth)/login/page.tsx` - Existing login page
- `app/page.tsx` - Root redirect logic
- `app/courses/page.tsx` - Current course list
- `app/courses/[courseId]/page.tsx` - Course detail
- `app/ask/page.tsx` - Ask question form
- `app/quokka/page.tsx` - AI chat page
- `components/layout/nav-header.tsx` - Navigation
- `lib/api/hooks.ts` - Data fetching hooks
- `lib/models/types.ts` - Type definitions

---

## TODO

- [ ] Research dashboard component architecture (Component Architect)
- [ ] Design floating AI agent UX (Component Architect)
- [ ] Plan dashboard types (Type Safety Guardian)
- [ ] Design dashboard API methods (Mock API Designer)
- [ ] Implement student dashboard
- [ ] Implement instructor dashboard
- [ ] Build floating Quokka AI agent
- [ ] Move Ask Question to course context
- [ ] Update navigation components
- [ ] QDS compliance audit
- [ ] Accessibility validation
- [ ] Final verification

---

## Changelog

- `2025-10-04` | [Planning] | Created task context and launched planning agents

# Task: Student Dashboard Enhancement

**Goal:** Transform student dashboard into an engaging, personalized learning hub that rivals the instructor dashboard's richness while maintaining accessibility and professional design standards.

**In-Scope:**
- Enhanced course cards with visual progress tracking
- Personalized recommendations widget (based on recent activity and course engagement)
- Interactive goals/achievements section with progress bars
- Upcoming deadlines/events timeline component
- Study streak tracker for gamification
- Quick actions panel (Ask Question, Browse Threads, View Saved, etc.)
- Enhanced stat cards with sparklines, tooltips, and context
- Improved responsive grid layout (fix existing D-2 issue from UX analysis)
- Better empty states with actionable CTAs
- Dynamic layout that adapts to content amount

**Out-of-Scope:**
- Backend API modifications (use existing mock data only)
- Real-time notifications or websockets
- Authentication system changes
- Course enrollment features
- Grade tracking or academic performance analytics
- Social features (following students, direct messaging)

**Done When:**
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast (WCAG 2.2 Level AA)
- [ ] Responsive at 360/768/1024/1280 breakpoints
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Student dashboard feels personalized and engaging
- [ ] Quick actions are easily discoverable
- [ ] Progress tracking elements are visually clear
- [ ] Gamification elements motivate without overwhelming
- [ ] Layout adapts gracefully to different course counts (1, 2, 3+ courses)
- [ ] All new widgets have loading and empty states
- [ ] Screen reader tested with all interactive elements
- [ ] Dark mode support for all new components

---

## Constraints

1. **Frontend-only scope** - No backend changes, only mock data
2. **No breaking changes to mock API** - Use existing API contract
3. **QDS compliance** - All tokens (colors, spacing, radius, shadows) from design system
4. **Type safety** - No `any` types, strict mode compliance
5. **Component reusability** - Props-driven, no hardcoded values
6. **Performance** - No bundle size increase >50KB per route
7. **Accessibility** - WCAG 2.2 Level AA minimum for all new components

---

## Decisions

### QDS Styling Strategy (2025-10-12)
**Agent:** QDS Compliance Auditor
**Files:** `research/qds-styling-analysis.md`, `plans/qds-implementation.md`

**Glass Effect Strategy:**
- All new components use QDS 2.0 glassmorphism aesthetic (glass-panel, glass-hover, glass-strong)
- Empty states use static `glass` variant, interactive elements use `glass-hover`
- Maximum 3 glass layers per view for performance
- All text on glass backgrounds uses `glass-text` utility for readability shadows

**Color Palette Assignments:**
- **Primary (Quokka Brown #8A6B3D):** Main emphasis, streak numbers, achievement badges, action icons
- **Secondary (Olive #5E7D4A):** Supporting actions, positive states
- **Accent (Sky #2D6CDF):** Links, recommendations badge, week-range deadlines
- **Support colors:** Success (progress bars), Warning (today deadlines, unanswered counts), Danger (overdue deadlines, urgent trends), Amber (achievement unlocks)
- **Semantic badges:** Use color/10 transparency for subtle emphasis (e.g., `bg-accent/10 text-accent`)

**Spacing Scale Decisions:**
- Card padding: `p-6` (24px) for content areas, `p-4` (16px) for compact cards, `p-8` (32px) for hero elements
- Section gaps: `space-y-6` (24px) or `space-y-8` (32px) between major sections
- Component spacing: `space-y-3` (12px) or `space-y-4` (16px) for vertical rhythm
- Inline elements: `gap-2` (8px) for icon+text, `gap-3` (12px) for related groups
- Grid gaps: `gap-2` (8px) for stats grids, `gap-3` (12px) or `gap-4` (16px) for action buttons

**Animation Approach:**
- Use existing QDS animation durations: `duration-200` (hover/focus), `duration-300` (overlays), `duration-500` (progress bars)
- Hover effects: Intensify glass blur (`glass-hover`), add semantic glows (`--glow-primary`, `--glow-accent`)
- Optional scale lift: `hover:scale-[1.02]` or `hover:scale-[1.03]` (only if reduced motion disabled)
- Liquid animations: ONLY for StudyStreakCard achievement badges (decorative, not functional)
- Always respect `prefers-reduced-motion` via `useReducedMotion()` hook

**Dark Mode Implementation:**
- Zero hardcoded colors - all components use CSS custom properties that adapt to `.dark` class
- Glass backgrounds use dark base: `rgba(23, 21, 17, 0.7)` in dark mode vs `rgba(255, 255, 255, 0.7)` in light
- Primary/secondary/accent colors lighten in dark mode for contrast (e.g., primary: #8A6B3D → #C1A576)
- Text shadows intensify: `glass-text` uses stronger shadow in dark mode for readability
- All contrast ratios maintained at WCAG AA minimum (4.5:1) in both themes

**Data Visualization Decision:**
- NO external chart library - use pure CSS/SVG sparklines for StatCard enhancements
- Sparkline implementation: 48px height, 120px max-width, semantic stroke colors (success/danger/muted)
- Gradient fill under line for subtle depth
- `vectorEffect="non-scaling-stroke"` ensures constant line thickness
- Tooltip on hover: `glass-panel-strong` with `shadow-glass-md`, provides context without cluttering

---

### Component Architecture (2025-10-12)
**Agent:** Component Architect
**Files:** `research/component-patterns.md`, `plans/component-design.md`

**Component Folder Structure:**
- All new dashboard widgets in `components/dashboard/` (maintains existing pattern)
- File naming: kebab-case with descriptive names (e.g., `study-streak-card.tsx`)
- Each component file: interface → component → loading state → internal sub-components (if needed)
- Export strategy: named exports for all components and interfaces

**Props vs Composition Choice:**
- **Props-driven architecture:** All data via props, zero hardcoded values (enforces reusability)
- **Composition via className:** All components accept optional `className` prop for layout integration
- **Callback patterns:** Event handlers passed as props (e.g., `onActionClick`, `onClusterExpand`)
- **Variant system:** Use discriminated union props (e.g., `variant: "default" | "primary" | "success"`)
- **Children composition:** NOT used (props pattern preferred for type safety and explicitness)

**Loading State Pattern Decision:**
- **Three-state rendering:** Loading skeleton → Empty state → Data display
- **Skeleton structure:** Matches final component layout with `<Skeleton>` primitives
- **Empty states:** Centered card with icon + descriptive message + optional CTA
- **Loading props:** All components accept optional `loading?: boolean` prop
- **Consistency:** Follow existing patterns from `EnhancedCourseCard`, `TimelineActivity`, `FAQClustersPanel`

**Responsive Breakpoint Strategy:**
- **Mobile-first approach:** Base styles for mobile (320px+), add complexity at breakpoints
- **Primary breakpoints:** `md: 768px` (tablet), `lg: 1024px` (desktop), `xl: 1280px` (wide)
- **Grid patterns:** Single column mobile → 2 cols tablet → 3 cols desktop (existing pattern)
- **Dashboard layout:** 3-column grid on `lg:` with asymmetric spans (e.g., courses span 2, activity span 1)
- **Component-specific:**
  - StudyStreakCard: Single column (no responsive changes)
  - QuickActionsPanel: `grid-cols-2` → `md:grid-cols-4` (2x2 to 1x4)
  - StudentRecommendations: `grid-cols-1` → `md:grid-cols-2` (1 col to 2 cols)
  - UpcomingDeadlines: Single column timeline (no responsive changes)
  - Enhanced StatCard: `grid-cols-2` → `md:grid-cols-4` (existing pattern)

**Reusability Patterns Identified:**
- **High reusability:** MiniSparkline (pure SVG, memoized), UpcomingDeadlines (generic timeline)
- **Medium reusability:** StudyStreakCard (can be generic ProgressCard with different props)
- **Low reusability:** QuickActionsPanel, StudentRecommendations (student-specific, but configurable via props)
- **Extension strategy:** StatCard backward compatible (sparkline props optional, defaults to existing behavior)
- **Composition opportunities:** All widgets use Card primitives (CardHeader, CardContent) for consistency

**State Management Decisions:**
- **Local state:** Minimal (only UI-only state like expanded/collapsed in UpcomingDeadlines)
- **Derived state:** Compute from props with `useMemo()` (streak calculation, recommendations filtering)
- **React Query:** Use existing `useStudentDashboard()` + new `useQuery()` for recommendations (parallel fetch per course)
- **No prop drilling:** All data fetched at dashboard level, passed to children via props (max 1 level deep)
- **Optimistic updates:** NOT needed for student dashboard (read-only widgets, no mutations)

---

### Accessibility Strategy (2025-10-12)
**Agent:** Accessibility Validator
**Files:** `research/a11y-requirements.md`, `plans/a11y-implementation.md`

**ARIA Live Region Strategy:**
- Global announcement region at dashboard root: `role="status" aria-live="polite" aria-atomic="true"`
- Use cases: Streak increments, new recommendations loaded, deadline approaching, progress updates
- StudyStreakCard announces streak changes via live region (polite, not assertive)
- Never announce visual-only updates (sparkline hover, card hover effects)

**Focus Management Approach:**
- Maintain existing focus ring system (4px blue ring, 3:1 contrast, enhanced on glass backgrounds)
- StudentRecommendations: Entire card wrapped in single link (no nested interactive elements)
- QuickActionsPanel: Tab order follows visual grid layout (left-to-right, top-to-bottom)
- UpcomingDeadlines: Focus order follows chronological timeline order
- StatCard sparklines: Non-interactive visual enhancements, no focus required

**Keyboard Navigation Patterns:**
- All widgets keyboard-accessible via Tab/Shift+Tab
- No custom keyboard shortcuts (students expect standard browser navigation)
- No keyboard traps (can always tab out to next widget)
- Enter/Space activate links and buttons (standard HTML behavior)
- Optional enhancement: Arrow key navigation in QuickActionsPanel grid (nice-to-have, not required)

**Screen Reader Testing Plan:**
- Primary: NVDA (Windows) - Most common, free, standards-compliant
- Secondary: VoiceOver (macOS) - Apple ecosystem testing
- Test scenarios: Complete dashboard navigation, headings navigation (H key), landmarks navigation (D key)
- Verify announcements: Loading states (aria-busy), empty states, dynamic updates (aria-live), trend directions

**Alternative Content Strategy:**
- Icons: All marked `aria-hidden="true"` with visible text labels or sr-only text
- Sparkline charts: Text alternative via sr-only paragraph listing daily values (e.g., "Weekly activity: Day 1: 8, Day 2: 9...")
- Progress bars: Use `role="progressbar"` with `aria-valuenow/min/max` + human-readable `aria-valuetext`
- Time elements: Dual format (visual abbreviation "3d ago" + screen reader full date "October 10, 2025 at 11:59 PM")
- Trend indicators: Visual icon + text + sr-only semantic description ("increased by 3 this week")

### Pending Decisions:
- Widget layout priority (what appears above the fold?) → **RESOLVED:** Engagement row first (streak, actions, deadlines)
- Recommendations algorithm (engagement-based vs. recency-based?) → **RESOLVED:** Hybrid (recent + high engagement + not authored by user)
- Grid breakpoint strategy for course cards (2 vs 3 columns on tablet) → **RESOLVED:** Keep existing 2 cols on tablet, 2 cols on desktop

---

## Risks & Rollback

**Risks:**
- Over-engineering: Too many widgets could overwhelm students
- Performance: Adding multiple new components might slow initial render
- Data availability: Mock data may need extension to support new features
- Layout complexity: Responsive grid with dynamic content could be fragile
- UX consistency: New components must match existing instructor dashboard quality

**Rollback:**
- All changes are additive - can hide features with feature flags
- Component-based architecture allows incremental rollback
- Mock data extensions are backward compatible
- Git revert to specific commits if major issues arise

**Mitigation:**
- Start with minimal viable features, expand incrementally
- Use React.lazy() for code splitting on new widgets
- Extend mock data carefully, maintain existing structure
- Test responsive layouts at every breakpoint during development
- Follow existing patterns from instructor dashboard components

---

## Related Files

**Current Student Dashboard:**
- `app/dashboard/page.tsx` (lines 70-180) - StudentDashboard component
- `components/dashboard/enhanced-course-card.tsx` - Course display cards
- `components/dashboard/timeline-activity.tsx` - Activity feed
- `components/dashboard/stat-card.tsx` - Statistics display
- `lib/models/types.ts` (lines 424-437) - StudentDashboardData interface

**Mock Data & API:**
- `lib/api/client.ts` - Mock API methods
- `lib/api/hooks.ts` - React Query hooks
- `mocks/*.json` - Seed data

**Design System:**
- `app/globals.css` - QDS tokens and utilities
- `QDS.md` - Design system documentation

**Existing UX Analysis:**
- `doccloud/ux-analysis/design-issues-2025-10-12.md` - Comprehensive audit (26 issues)
- `doccloud/ux-analysis/implementation-summary-2025-10-12.md` - Status (11/26 resolved)

---

## TODO

- [ ] Launch Component Architect agent → component-design.md
- [ ] Launch QDS Compliance Auditor agent → qds-implementation.md
- [ ] Launch Accessibility Validator agent → a11y-implementation.md
- [ ] Create StudentRecommendations component
- [ ] Create StudyStreakCard component
- [ ] Create QuickActionsPanel component
- [ ] Create UpcomingDeadlines component
- [ ] Enhance StatCard with sparklines
- [ ] Update dashboard layout grid
- [ ] Add new mock data for widgets
- [ ] Create React Query hooks for new features
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify responsive layouts
- [ ] Run full quality gate checks

---

## Changelog

- `2025-10-12` | [Setup] | Created task context and directory structure

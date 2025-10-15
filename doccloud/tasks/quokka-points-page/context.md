# Task: Quokka Points Page Implementation

**Goal:** Create a comprehensive Quokka Points page at `/points` that showcases user achievements, point history, milestones, and detailed breakdowns.

**In-Scope:**
- New route: `app/points/page.tsx`
- Hero section with total points and QuokkaIcon
- Milestones progress timeline
- Points breakdown by source
- Activity history feed
- Integration with navbar `onViewPointsDetails` handler
- QDS 2.0 compliance (glass effects, tokens, spacing)
- WCAG 2.2 AA accessibility (keyboard nav, ARIA, contrast)
- Responsive design (360px to 1280px)

**Out-of-Scope:**
- Backend API changes (use existing QuokkaPointsData)
- Leaderboard/ranking system
- Social sharing features
- Export functionality
- Push notifications for milestones
- Real-time point updates

**Done When:**
- [ ] Route `/points` accessible to authenticated users
- [ ] Displays total points prominently with animated QuokkaIcon
- [ ] Shows all 5 milestones with visual progress
- [ ] Breaks down points by all 5 sources
- [ ] Responsive at 360px, 768px, 1024px, 1280px
- [ ] QDS 2.0 compliant (no hardcoded colors, uses tokens)
- [ ] WCAG 2.2 AA accessible (keyboard nav works, 4.5:1 contrast, ARIA labels)
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] No console errors in dev/prod builds
- [ ] Dark mode fully supported
- [ ] Navbar badge routes to `/points` page

---

## Constraints

1. Frontend-only scope (no backend changes)
2. No breaking changes to existing QuokkaPointsData structure
3. QDS 2.0 compliance (tokens, spacing, radius, shadows, glass effects)
4. Type safety (no `any`, use `import type` for types)
5. Component reusability (props-driven, no hardcoded values)
6. Maintain existing points calculation logic
7. Use existing QuokkaIcon component

---

## Decisions

### 1. **Route Choice** (Initial Planning - 2025-10-14)
   - Use `/points` instead of `/rewards` or `/quokka-points`
   - Rationale: Short, memorable, clear, aligns with branding
   - Files: Initial planning

### 2. **Layout Pattern** (Component Architect - 2025-10-14)
   - Single column with card-based sections (Hero → Milestones → Breakdown → Activity)
   - Rationale: Clear visual hierarchy, mobile-friendly, matches dashboard pattern, content-focused
   - Files: `app/points/page.tsx`, `plans/component-design.md`

### 3. **Component Architecture** (Component Architect - 2025-10-14)
   - 4 feature components: QuokkaPointsHero (~120 LoC), MilestonesTimeline (~190 LoC), PointSourcesBreakdown (~180 LoC), PointsActivityFeed (~130 LoC)
   - 1 page component: app/points/page.tsx (~200 LoC with loading/empty states)
   - All props-driven, TypeScript strict, <200 LoC per file, reusable in other contexts
   - Rationale: Separation of concerns, component reusability, testability, maintainability
   - Files: `components/points/*.tsx`, `plans/component-design.md`, `research/component-patterns.md`

### 4. **Data Source** (Initial Planning - 2025-10-14)
   - Use existing `QuokkaPointsData` from `calculateQuokkaPoints`
   - No type extensions needed initially
   - Rationale: No backend changes, uses existing calculation logic
   - Files: `lib/utils/quokka-points.ts`, `lib/models/types.ts`

### 5. **Accessibility Strategy** (Accessibility Validator - 2025-10-14)
   - WCAG 2.2 Level AA minimum (exceeding to AAA where feasible: 44px touch targets)
   - Semantic HTML with proper landmarks (main, section, aside) and heading hierarchy (h1 → h2 → h3)
   - ARIA live regions for dynamic updates (aria-live="polite" for points, "assertive" for milestones)
   - Progress bars use aria-describedby linking to milestone context + aria-valuetext
   - All interactive elements meet 44px touch target minimum on mobile (WCAG 2.5.8 AAA)
   - Respect prefers-reduced-motion for animations (QuokkaIcon pulse, transitions)
   - Files: `research/a11y-requirements.md`, `plans/a11y-implementation.md`

### 6. **QDS 2.0 Styling** (QDS Compliance Auditor - 2025-10-14)
   - Glassmorphism design language: glass-panel and glass-panel-strong with backdrop blur
   - All colors use semantic tokens (no hardcoded hex) with WCAG AA contrast (4.5:1+ verified)
   - 4pt spacing grid throughout (gap-2/4/6/8, p-6/8, space-y-4/6/8)
   - Liquid animations: animate-liquid-float for hero QuokkaIcon
   - Dark mode via automatic token switching (verified in both themes)
   - Files: `research/qds-tokens.md`, `plans/qds-styling.md`

---

## Risks & Rollback

**Risks:**
- Page load performance with large point histories
- Mobile layout complexity with multiple sections
- Animation performance on low-end devices
- Milestone timeline responsiveness on small screens

**Rollback:**
- Revert commits in order
- Navbar badge still works (existing functionality)
- Dashboard card unaffected (existing functionality)
- Safe degradation: users lose dedicated page but keep overview

**Mitigation:**
- Lazy load activity history (pagination or "load more")
- Use CSS containment for animation performance
- Test on multiple viewport sizes
- Progressive enhancement for animations

---

## Related Files

### Existing Components (Reference Only)
- `components/navbar/quokka-points-badge.tsx` - Navbar badge with popup
- `components/dashboard/quokka-points-card.tsx` - Dashboard overview card
- `components/ui/quokka-icon.tsx` - Custom Quokka icon
- `lib/utils/quokka-points.ts` - Point calculation logic
- `lib/models/types.ts` - QuokkaPointsData types

### Files to Create
- `app/points/page.tsx` - Main points page
- `components/points/quokka-points-hero.tsx` - Hero section
- `components/points/milestones-timeline.tsx` - Milestone progression
- `components/points/point-sources-breakdown.tsx` - Source breakdown
- `components/points/points-activity-feed.tsx` - Activity timeline (optional)

### Files to Modify
- `components/layout/global-nav-bar.tsx` - Wire up `onViewPointsDetails` to navigate to `/points`
- `components/dashboard/quokka-points-card.tsx` - Add "View Details" button to route to `/points`

---

## TODO

- [ ] Create task context (DONE)
- [ ] Research component patterns (agent: Component Architect)
- [ ] Design page architecture (agent: Component Architect)
- [ ] Plan QDS styling (agent: QDS Compliance Auditor)
- [ ] Plan accessibility (agent: Accessibility Validator)
- [ ] Implement main page route (app/points/page.tsx)
- [ ] Implement QuokkaPointsHero component
- [ ] Implement MilestonesTimeline component
- [ ] Implement PointSourcesBreakdown component
- [ ] Implement PointsActivityFeed component (optional)
- [ ] Wire up navbar navigation
- [ ] Wire up dashboard card navigation
- [ ] Run quality checks (typecheck, lint)
- [ ] Manual testing (responsive, keyboard, dark mode)
- [ ] Commit implementation

---

## Changelog

- `2025-10-14` | [Task] | Created task context for Quokka Points page

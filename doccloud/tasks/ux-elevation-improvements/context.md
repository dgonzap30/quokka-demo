# Task: Application-Wide UX Elevation & Navigation Improvements

**Goal:** Transform the application into an intuitive, engaging experience with clear navigation, proper contrast, and prominent AI features

**In-Scope:**
- Navigation system enhancement (nav-header.tsx)
- Contrast improvements across all pages
- AI feature highlighting and discoverability
- Content organization and information architecture
- Visual hierarchy and attention management
- User engagement improvements
- Onboarding and feature discovery

**Out-of-Scope:**
- Backend integration or real API changes
- New feature development (only UX/UI improvements)
- Mobile native app
- User preferences persistence

**Done When:**
- [ ] User can easily navigate all major sections (Dashboard, Courses, Ask, Threads)
- [ ] All contrast ratios meet WCAG 2.2 AA (4.5:1 minimum)
- [ ] AI features are prominently displayed and discoverable
- [ ] Navigation is intuitive without learning curve
- [ ] User understands app purpose immediately
- [ ] Content is logically organized with clear hierarchy
- [ ] User feels engaged through visual design and micro-interactions
- [ ] All routes render without console errors
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Responsive at 360/768/1024/1280

---

## Constraints

1. **Frontend-only scope** - No backend changes
2. **No breaking changes to mock API** - Extend, don't replace
3. **QDS 2.0 compliance** - Use design tokens, no hardcoded colors
4. **Type safety** - No `any`, explicit interfaces
5. **Component reusability** - Props-driven patterns
6. **Accessibility** - WCAG 2.2 AA minimum (4.5:1 contrast)
7. **Performance** - No bundle size increases

---

## Current State Analysis (Research Phase)

### Navigation Issues
1. **Limited visibility:** Only "Dashboard" link in nav, missing Courses, Ask, Threads
2. **No active state indicators** for nested routes
3. **Search functionality** present but could be more prominent
4. **No breadcrumbs** for context on deep pages

### Contrast Issues (From A11y Audit)
1. **Muted text** on glass backgrounds may not meet 4.5:1
2. **Warning colors** (unanswered count) need verification
3. **Badge borders** on glass panels need 3:1 minimum
4. **Focus indicators** on glass backgrounds need enhancement

### AI Feature Visibility
1. **FloatingQuokka** is hidden until discovered
2. **AI-generated answers** not clearly distinguished from human content
3. **AI coverage stats** only visible in instructor dashboard
4. **No onboarding** to explain AI capabilities

### Content Organization
1. **Dashboard prioritizes courses** (good) but stats are buried at bottom
2. **No clear CTAs** for primary actions (Ask Question, View Threads)
3. **Empty states** exist but could be more actionable
4. **Information density** varies across pages

### User Engagement
1. **Micro-interactions** added recently (good)
2. **Visual hierarchy** needs improvement for attention management
3. **Color psychology** not fully utilized (AI features could use purple accent)
4. **Gamification elements** missing (badges, achievements, progress)

---

## Decisions

### QDS Contrast Audit (2025-10-05)

**Compliance Score:** 7.5/10 - Good token usage, needs glass-text additions

**Critical Findings:**
1. **18 instances missing `.glass-text` utility** across 5 files (dashboard, ask, threads, courses pages, timeline component)
2. **`--text-subtle` token needs darkening** from 55% to 45% lightness for guaranteed 4.5:1 contrast
3. **Timeline connector uses hardcoded color** (`bg-neutral-300` → should be `bg-border`)
4. **Glass borders may be too subtle** for 3:1 UI component contrast requirement
5. **Status badges PASS contrast** (6.5:1 to 7.8:1 in light mode, 6.8:1 to 9.1:1 in dark mode)

**Excellent QDS Compliance:**
- ✅ No hardcoded hex colors found (all use semantic tokens)
- ✅ Perfect spacing adherence (4pt grid throughout)
- ✅ Proper radius scale usage (no arbitrary values)
- ✅ Complete dark mode token coverage
- ✅ Outstanding accessibility (semantic HTML, ARIA, focus management)

**Implementation Strategy:**
- **Phase 1 (P0):** Add `.glass-text` to all muted/subtle text (30 changes across 5 files), darken `--text-subtle`, fix timeline connector
- **Phase 2 (P1):** Increase glass border opacity, add `aria-hidden` to decorative emojis
- **Phase 3 (P2):** Fine-tune focus indicator opacity based on real testing

**Files Requiring Changes:**
- `app/globals.css` (3 token adjustments)
- `app/dashboard/page.tsx` (6 glass-text additions)
- `app/ask/page.tsx` (5 glass-text additions)
- `app/threads/[threadId]/page.tsx` (7 glass-text additions)
- `app/courses/[courseId]/page.tsx` (9 glass-text additions)
- `components/dashboard/timeline-activity.tsx` (2 fixes: glass-text + connector color)

**Documentation:**
- `research/contrast-audit.md` - Complete audit with measurements
- `plans/contrast-fixes.md` - Line-by-line implementation plan with before/after

### Navigation Enhancement (2025-10-05)

**Component Architect:** Tab-based desktop nav + hamburger mobile menu + reusable breadcrumbs

**Architecture:**
1. **Desktop Navigation:** Horizontal tabs (Dashboard, Ask Question, Browse Threads) using Radix UI Tabs
2. **Mobile Navigation:** Hamburger menu with Sheet drawer (side=left, 280px width)
3. **Breadcrumbs:** Reusable `<Breadcrumb>` component with truncation, icons, ChevronRight separator
4. **Active States:** Precise route matching (nested routes highlight parent tab correctly)
5. **Accessibility:** Full keyboard nav (arrow keys for tabs), focus trap in mobile menu, ARIA labels throughout

**QDS Compliance:**
- Active tabs: `bg-primary/10 text-primary` (4.5:1+ contrast on glass)
- Glass backgrounds: `glass-panel-strong backdrop-blur-xl`
- Touch targets: All 44×44px minimum (tabs, menu button, links)
- Spacing: 4pt grid adherence (gap-1, gap-2, px-4)

**Performance:**
- Bundle impact: ~15 KB gzipped (Tabs 3KB, Sheet 6KB, custom components 6KB)
- Lazy load Sheet component for mobile-only usage
- Zero local state (active state derived from URL pathname)

**Files:**
- NEW: `components/layout/desktop-nav.tsx` (horizontal tabs)
- NEW: `components/layout/mobile-nav.tsx` (hamburger + sheet)
- NEW: `components/ui/breadcrumb.tsx` (reusable breadcrumb with truncation)
- NEW: `components/ui/tabs.tsx` (shadcn/ui, install via CLI)
- NEW: `components/ui/sheet.tsx` (shadcn/ui, install via CLI)
- MODIFY: `components/layout/nav-header.tsx` (integrate DesktopNav + MobileNav)
- MODIFY: `app/courses/[courseId]/page.tsx` (use Breadcrumb component)
- MODIFY: `app/threads/[threadId]/page.tsx` (use Breadcrumb component)

**Documentation:**
- `research/navigation-patterns.md` - Routing structure, existing patterns, accessibility requirements
- `plans/navigation-enhancement.md` - Component architecture, props interfaces, implementation steps

### Accessibility Integration Strategy (2025-10-05)

**Accessibility Validator:** Integrate 15 a11y fixes from existing audit with UX elevation work

**Key Insight:** A11y fixes and UX enhancements are complementary, not competing—12 of 15 a11y issues directly support UX goals (navigation, contrast, engagement, AI prominence).

**Priority Fixes Supporting UX:**
1. **Skip Links (Fix 4):** Foundation for new navigation system—design skip links alongside tab navigation
2. **FloatingQuokka Dialog (Fix 1-3):** Critical for AI feature prominence—add dialog semantics, focus trap, live announcements before visual enhancements
3. **Error Handling (Fix 5):** Essential for engagement—create reusable ErrorAlert/SuccessToast components
4. **Form A11y (Fix 6-8):** Improves Ask Question flow—collapsible state, focus management, helper text association
5. **Loading States (Fix 9):** Better engagement—announce loading via aria-live alongside skeleton screens
6. **Card Nesting (Fix 12):** Clearer interaction patterns—use clickable overlay technique for course cards
7. **Touch Targets (Fix 14):** Mobile navigation usability—44×44px minimum for all interactive elements
8. **Motion Preferences (Fix 15):** Respectful micro-interactions—disable decorative animations, keep essential feedback

**Integration Approach:**
- **Phase 1 (Week 1):** Fix critical a11y blockers (skip links, error handling, FloatingQuokka dialog/focus/live regions) - 12hr
- **Phase 2 (Week 2):** Build new navigation WITH a11y built-in (tabs + mobile menu + form improvements) - 18hr
- **Phase 3 (Week 3):** Polish contrast, touch targets, motion preferences, decorative content - 14hr
- **Phase 4 (Week 4):** Comprehensive testing (automated, keyboard, screen reader, mobile) - 8hr

**Expected Outcome:** 100% WCAG 2.2 Level AA compliance + polished UX (Lighthouse score 90+ → 100, 0 axe violations)

**Dependencies:**
- NPM: `@radix-ui/react-focus-scope` for FloatingQuokka focus trap
- Design decisions: Skip link style, error alert design, mobile nav structure
- Testing: NVDA/JAWS screen readers, physical mobile devices

**Files Modified:** 8 core files + 2 new components (ErrorAlert, SuccessToast)

**Documentation:**
- `research/a11y-priority-review.md` - Issue prioritization, UX impact assessment, keyboard nav design, screen reader UX, motion strategy
- `plans/a11y-ux-integration.md` - Line-by-line implementation plan, testing scenarios, rollback strategies

---

## Risks & Rollback

**Risks:**
- Navigation changes may confuse existing users
- Contrast fixes could alter brand aesthetics
- Increased navigation complexity may impact performance
- AI feature prominence may overshadow human interactions

**Rollback:**
- Feature flag for new navigation (env var)
- Keep original nav-header as nav-header-legacy.tsx
- Incremental rollout per section
- A/B testing capability

---

## Related Files

**Navigation:**
- `components/layout/nav-header.tsx` - Main navigation
- `app/layout.tsx` - Root layout with nav

**Pages to Audit:**
- `app/dashboard/page.tsx` - Main landing (student/instructor)
- `app/courses/[courseId]/page.tsx` - Course detail
- `app/ask/page.tsx` - Ask question flow
- `app/threads/[threadId]/page.tsx` - Thread detail
- `app/quokka/page.tsx` - AI assistant page

**Components:**
- `components/dashboard/stat-card.tsx` - Stats display
- `components/dashboard/enhanced-course-card.tsx` - Course cards
- `components/course/floating-quokka.tsx` - AI assistant
- `components/ui/global-search.tsx` - Search functionality

**Design System:**
- `app/globals.css` - QDS tokens and utilities
- `QDS.md` - Design system documentation

---

## TODO

**Phase 1: Research & Planning (Current)**
- [ ] Launch Component Architect: Analyze navigation patterns and propose improvements
- [ ] Launch QDS Compliance Auditor: Audit all pages for contrast issues
- [ ] Launch Accessibility Validator: Verify WCAG compliance across app
- [ ] Review existing a11y audit findings
- [ ] Document current user flows and pain points

**Phase 2: Navigation Enhancement**
- [ ] Design enhanced navigation system (tabs for Dashboard, Courses, Ask, Threads)
- [ ] Add breadcrumbs for deep navigation
- [ ] Improve mobile navigation (hamburger menu)
- [ ] Add active state indicators
- [ ] Implement keyboard navigation enhancements

**Phase 3: Contrast & Accessibility**
- [ ] Fix all contrast issues from audit
- [ ] Enhance focus indicators on glass backgrounds
- [ ] Improve color differentiation for status badges
- [ ] Verify all text meets 4.5:1 minimum

**Phase 4: AI Feature Highlighting**
- [ ] Add AI badge/indicator to AI-generated content
- [ ] Create AI onboarding tooltip/tour
- [ ] Add "Powered by AI" visual elements
- [ ] Implement AI gradient accents (purple-cyan)
- [ ] Show AI availability indicators

**Phase 5: Content Organization**
- [ ] Improve visual hierarchy across pages
- [ ] Add clear CTAs for primary actions
- [ ] Enhance empty states with guidance
- [ ] Optimize information density
- [ ] Add contextual help/tooltips

**Phase 6: Engagement & Polish**
- [ ] Add subtle animations for delight
- [ ] Implement progress indicators where relevant
- [ ] Add success states and celebrations
- [ ] Enhance loading states
- [ ] Final QA and testing

---

## Changelog

- `2025-10-05` | [Task Setup] | Created task context for application-wide UX elevation
- `2025-10-05` | [Research] | Analyzed current state: navigation, contrast, AI visibility, content organization
- `2025-10-05` | [Planning] | Launched 3 planning agents in parallel (Component Architect, QDS Auditor, A11y Validator)
- `2025-10-05` | [Contrast Fixes] | Implemented all critical contrast improvements (18 .glass-text additions, darkened --text-subtle token, fixed timeline connector)
- `2025-10-05` | [Verification] | TypeScript and lint checks pass, dev server running successfully
- `2025-10-05` | [Commit] | Committed contrast fixes with conventional commit message (commit 2ce2c4d)
- `2025-10-05` | [Navigation - Phase 1] | Installed shadcn/ui tabs and sheet components
- `2025-10-05` | [Navigation - Phase 2] | Created DesktopNav (110 lines), MobileNav (160 lines), Breadcrumb (75 lines) components
- `2025-10-05` | [Navigation - Phase 3] | Integrated navigation into nav-header.tsx, added breadcrumbs to course and thread pages
- `2025-10-05` | [Navigation - Verification] | TypeScript and lint pass, all navigation components working
- `2025-10-05` | [Commit] | Committed navigation enhancements with detailed conventional commit (commit 22d9472)
- `2025-10-06` | [AI Prominence - Planning] | Created comprehensive AI prominence plan in plans/ai-prominence-plan.md
- `2025-10-06` | [AI Prominence - Design Tokens] | Added AI gradient, glow, and text utilities to globals.css
- `2025-10-06` | [AI Prominence - Components] | Created AIBadge (62 lines) and AICoverageCard (63 lines) components
- `2025-10-06` | [AI Prominence - FloatingQuokka] | Enhanced with Sparkles icon, ai-gradient, ai-glow, and AI badge
- `2025-10-06` | [AI Prominence - AI Page] | Added gradient text, Sparkles icons, AI badges to /quokka page
- `2025-10-06` | [AI Prominence - Dashboard] | Integrated AICoverageCard into instructor dashboard sidebar
- `2025-10-06` | [AI Prominence - Indicators] | Added AI badges to course cards (>30% coverage) and "AI Available" indicator to course pages
- `2025-10-06` | [AI Prominence - Verification] | TypeScript and lint pass, dev server starting
- `2025-10-06` | [Commit] | Committed AI prominence enhancements with comprehensive message (commit 34ecb62)


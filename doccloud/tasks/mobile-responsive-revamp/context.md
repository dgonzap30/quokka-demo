# Mobile Responsive Revamp - Task Context

**Created:** 2025-10-14
**Status:** Planning
**Priority:** High

---

## Goal

Comprehensively revamp the mobile experience across the entire QuokkaQ application to ensure:
- Professional, polished appearance on all mobile devices (360px - 768px)
- Full accessibility compliance (WCAG 2.2 AA) on mobile
- Smooth, intuitive touch interactions
- No horizontal scrolling or layout breaks
- Proper mobile navigation patterns
- Mobile-first approach without compromising desktop experience

---

## In-Scope

### Pages
- `/` - Home/landing (if exists)
- `/dashboard` - Student and Instructor dashboards
- `/courses` - Course listing
- `/courses/[courseId]` - Course detail with sidebar layout
- `/ask` - Ask question modal/page
- All navigation components (global nav, mobile nav)

### Components
- Global navigation (GlobalNavBar, MobileNav)
- Dashboard widgets (all stat cards, course cards, activity feeds)
- Course components (ThreadCard, ThreadListSidebar, FilterSidebar, SidebarLayout)
- Forms (AskQuestionModal, search bars, filters)
- Cards (EnhancedCourseCard, thread cards, all widget cards)
- All interactive elements (buttons, badges, inputs)

### Technical Requirements
- Mobile breakpoint: 360px - 767px (sm and below)
- Tablet breakpoint: 768px - 1023px (md)
- Desktop: 1024px+ (lg and above)
- Touch target minimum: 44x44px (WCAG 2.2 AA)
- Text minimum: 16px base size on mobile
- Proper tap/click area spacing
- No fixed widths that break layouts
- Proper overflow handling

---

## Out-of-Scope

- Backend integration changes
- New features or functionality
- Design system color changes (use existing QDS tokens)
- Animation or motion changes (use existing patterns)
- Performance optimization beyond layout improvements

---

## Acceptance Criteria

### Visual & Layout
- [ ] All pages render correctly at 360px, 375px, 414px, 768px, 1024px, 1280px
- [ ] No horizontal scrolling on any page at any breakpoint
- [ ] All text is readable (min 16px on mobile, proper line height)
- [ ] Cards stack properly on mobile (no side-by-side crushing)
- [ ] Proper padding/margins prevent edge-to-edge content
- [ ] Images and icons scale appropriately
- [ ] Navigation is accessible and usable on mobile
- [ ] Modals/dialogs work well on small screens

### Accessibility (WCAG 2.2 AA)
- [ ] All interactive elements meet 44x44px minimum touch target
- [ ] Keyboard navigation works on all devices
- [ ] Focus indicators are visible on all interactive elements
- [ ] Screen reader tested on mobile (iOS VoiceOver, Android TalkBack)
- [ ] Color contrast meets 4.5:1 minimum for all text
- [ ] No touch-only interactions (all have keyboard equivalents)
- [ ] Proper heading hierarchy maintained

### Interaction & UX
- [ ] Touch gestures work smoothly (tap, scroll, swipe where appropriate)
- [ ] No double-tap zoom needed to interact
- [ ] Forms are easy to fill on mobile keyboards
- [ ] Search/filter experiences are mobile-friendly
- [ ] Sidebar/drawer patterns work intuitively
- [ ] Loading states visible on mobile
- [ ] Error states clearly communicated

### Testing
- [ ] Manual testing on iOS Safari (iPhone)
- [ ] Manual testing on Chrome Mobile (Android)
- [ ] Responsive design mode testing (Chrome/Firefox DevTools)
- [ ] Playwright tests for key mobile flows (if appropriate)
- [ ] Lighthouse mobile score: 90+ for accessibility

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Production build succeeds
- [ ] No console errors in browser
- [ ] QDS tokens used throughout (no hardcoded values)

---

## Known Risks

1. **Complex Sidebar Layout**: The SidebarLayout component with triple-pane layout may be challenging to adapt to mobile without significant changes
2. **Touch Target Conflicts**: Some components have dense information that may conflict with 44px touch target requirements
3. **Performance**: Heavy glassmorphism effects may impact mobile performance
4. **Existing Mobile Nav**: There's already a MobileNav component that may need significant revision
5. **Fixed Positioning**: Layout uses fixed navbar with padding-top which may cause issues

---

## Constraints

- Must maintain QDS v1.0 compliance (use semantic tokens only)
- Must not break desktop experience
- Must maintain existing functionality (no feature removal)
- Must work with existing mock API (no backend changes)
- Must maintain existing component API contracts (props, events)

---

## Current State Analysis

### Issues Identified

**Navigation:**
- GlobalNavBar hides most features on mobile (search, action buttons)
- No visible mobile menu trigger on GlobalNavBar
- MobileNav exists but may not be integrated everywhere

**Layout:**
- Root layout uses `pt-[104px]` which seems excessive for mobile
- Body has `overflow-hidden` which may prevent mobile scrolling
- Fixed background gradients may not scale well on mobile

**Dashboard:**
- Student dashboard: Large hero text may overwhelm mobile
- Grid layouts use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` which might not be optimal
- StatCard components may be too wide in 2-column mobile grid
- Course cards use `min-h-[220px]` which might be too tall on mobile

**Course Detail Page:**
- SidebarLayout uses complex triple-pane layout
- Filter sidebar at 220px may be too wide for mobile overlay
- Thread list always visible even on mobile
- No clear mobile navigation pattern for switching between filter/list/detail

**Components:**
- ThreadCard: Metadata row may wrap poorly on mobile
- Enhanced Course Card: Stats grid may be cramped
- Many components use `text-xl`, `text-2xl` which may be too large on mobile
- Button groups may not have enough spacing for touch targets

---

## Research Questions

1. What is the optimal mobile navigation pattern for the course detail page?
   - Option A: Bottom navigation with tabs (Threads, Filters, Detail)
   - Option B: Floating action button to toggle sidebars
   - Option C: Full-screen transitions between views
   - Option D: Drawer from bottom (sheet) for filters, full screen for detail

2. How should the dashboard adapt to mobile?
   - Hero text sizing
   - Stat card grid (1 column? 2 columns?)
   - Course card sizing
   - Activity feed placement

3. How should complex layouts (instructor dashboard) simplify for mobile?
   - Priority queue cards
   - FAQ clusters
   - Trending topics
   - Course selector

4. What's the right touch target strategy?
   - Increase all button sizes globally?
   - Add more padding/margin?
   - Reduce density of information?

---

## Decisions

### Mobile Responsive Architecture (Component Architect - 2025-10-14)

**Overall Assessment:** Strong props-driven foundation, critical navigation and touch target issues identified, systematic mobile patterns designed.

**Architectural Principles:**

1. **Props-Driven Mobile Variants**
   - All components accept data via props (no hardcoded values) ✓
   - Add mobile-specific size variants without breaking desktop
   - Use responsive Tailwind classes (sm:, md:, lg:) for progressive enhancement
   - Prefer composition over monolithic components

2. **Progressive Disclosure Strategy**
   - Mobile: 1-column stack for maximum clarity (< 640px)
   - Small: 2-column grids for balanced density (640-767px)
   - Medium: 3-column grids for moderate complexity (768-1023px)
   - Large: 4+ column grids for full desktop experience (1024px+)

3. **Touch Target Compliance (WCAG 2.2 AA)**
   - **Critical Fix:** Button component sizes violate WCAG (40px < 44px minimum)
   - Solution: `h-11 lg:h-10` pattern (44px mobile, 40px desktop)
   - All interactive elements: min-h-[44px] min-w-[44px]
   - Minimum 8px spacing between adjacent touch targets (gap-2)

4. **Mobile Navigation Pattern**
   - GlobalNavBar: Integrate MobileNav trigger (currently hidden on mobile)
   - MobileNav: Add search functionality (currently missing)
   - Course Detail: Bottom sheet for filters + full-screen detail overlay
   - Rationale: Familiar mobile patterns, no hidden features, easy discovery

5. **Course Detail Mobile Layout (Hybrid Approach)**
   - Mobile (< 768px): Thread list default, filter FAB + bottom sheet, detail full-screen sheet
   - Tablet (768-1023px): Two-pane (threads + detail), filter as sheet
   - Desktop (1024px+): Three-pane current layout (no changes)
   - **Why:** Preserves desktop workflow, adapts naturally to mobile constraints

6. **Typography Scaling**
   - Hero text: `text-3xl sm:text-4xl md:text-5xl` (30px → 36px → 48px)
   - Stat values: `text-2xl sm:text-3xl` (24px → 30px)
   - Rationale: 48px hero text overwhelms 360px viewports

7. **Grid Optimization**
   - Student stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (was `grid-cols-2 md:grid-cols-4`)
   - Instructor stats: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5` (was `grid-cols-2 md:grid-cols-5`)
   - Rationale: 2-column on mobile too cramped for 44px touch targets

**Critical Issues Found:**

1. **Navigation Crisis** - GlobalNavBar hides all mobile features; MobileNav exists but not integrated
2. **Layout Breakdown** - Triple-pane course layout completely broken on mobile
3. **Touch Target Failures** - Button component sizes violate WCAG 2.2 AA (40px instead of 44px)
4. **Typography Oversized** - Hero text at 48px too large for 360px viewports
5. **Grid Overoptimization** - 2-column stat grids create cramped touch targets

**Files to Modify (Priority Order):**

**Phase 1: Navigation & Layout Foundation**
- `components/layout/global-nav-bar.tsx` - Integrate MobileNav trigger
- `components/layout/mobile-nav.tsx` - Add search functionality
- `app/layout.tsx` - Fix padding (pt-[104px] → pt-14 md:pt-[104px])
- `components/ui/button.tsx` - Fix touch target sizes (h-11 lg:h-10)

**Phase 2: Dashboard Responsive Patterns**
- `app/dashboard/page.tsx` - Hero text, stats grid, course grid
- `components/dashboard/stat-card.tsx` - Value text sizing
- `components/dashboard/enhanced-course-card.tsx` - Card height

**Phase 3: Course Detail Mobile Navigation**
- `hooks/use-mobile-course-nav.ts` (NEW) - Mobile view state management
- `components/course/mobile-course-layout.tsx` (NEW) - Bottom sheet + FAB pattern
- `app/courses/[courseId]/page.tsx` - Conditional mobile/desktop layouts
- `components/course/filter-sidebar.tsx` - Sheet optimization
- `components/course/thread-list-sidebar.tsx` - Mobile padding

**Phase 4: Component-Level Refinements**
- `components/course/thread-card.tsx` - Metadata wrapping, padding
- `components/course/ask-question-modal.tsx` - Mobile sizing
- `components/instructor/priority-queue-card.tsx` - Mobile compact variant
- `components/instructor/bulk-actions-toolbar.tsx` - Mobile stacking
- `components/instructor/course-selector.tsx` - Touch target size

**Testing Requirements:**
- Device matrix: 360px (Galaxy S8), 375px (iPhone), 414px (iPhone Plus), 768px (iPad), 1024px (Desktop)
- Screen readers: iOS VoiceOver, Android TalkBack
- Browsers: iOS Safari, Chrome Mobile, Firefox Mobile, Samsung Internet
- Performance: Lighthouse mobile 90+ accessibility score

**See:**
- `research/mobile-component-patterns.md` - Full analysis with code examples
- `plans/mobile-responsive-implementation.md` - Step-by-step implementation plan

---

### QDS Mobile Compliance (QDS Auditor - 2025-10-14)

**Overall Assessment:** 7.5/10 QDS compliance, strong foundation with mobile-specific improvements needed.

**Key Findings:**
- Zero hardcoded hex colors (excellent color token usage)
- 67 arbitrary sizing values need token replacement
- Touch targets inconsistent (default button 40px < 44px WCAG minimum)
- Glass effects need mobile optimization (3 blur layers impacts performance)

**Token Strategy:**
- Add mobile-specific tokens to globals.css (--touch-target-min: 44px, --mobile-padding: 16px, etc.)
- Create mobile utility classes (touch-target, text-mobile-safe, glass-mobile)
- Define safe area tokens for iOS notch and Android gesture nav

**Touch Target Compliance:**
- Change Button default size from h-10 (40px) to h-11 (44px)
- Change Button icon size from size-10 to size-11
- Replace all min-h-[44px] with .touch-target utility class
- Enforce 44px minimum on all interactive elements via CSS

**Spacing Adjustments:**
- Stats grid: grid-cols-2 → grid-cols-1 sm:grid-cols-2 (avoid cramped mobile)
- Course grid gap: gap-4 → gap-6 (24px for breathing room)
- Card heights: min-h-[220px] → min-h-56 (224px, 56 * 4pt)
- Text sizes: text-xs → text-mobile-safe (14px mobile, 12px desktop)

**Layout Fixes:**
- Root layout padding: pt-[104px] → pt-24 md:pt-[104px] (96px mobile, 104px desktop)
- Sidebar widths: w-[220px] → w-mobile-sheet (280px via token)
- Grid values: minmax(200px,220px) → minmax(12rem,14rem) (rem-based, scalable)

**Glass Performance:**
- Reduce liquid background from 3 to 2 blur layers on mobile
- Lower blur intensity: blur-3xl → blur-2xl on mobile (48px → 32px)
- Add prefers-reduced-motion and prefers-reduced-data support
- Create glass-mobile variant with optimized backdrop-filter

**Mobile Navigation:**
- Add Sheet component with menu trigger for mobile
- Include Ask Question, AI Assistant, Support, Settings in mobile menu
- Add mobile search button (hidden search bar on mobile)
- Use 48px touch targets for comfortable mobile interaction

**See:** research/mobile-qds-audit.md, plans/mobile-qds-compliance.md

---

### Mobile Accessibility Compliance (Accessibility Validator - 2025-10-14)

**Overall Assessment:** Partial WCAG 2.2 Level AA compliance - 8 critical violations blocking compliance.

**Critical Issues Found:**
1. Icon button touch targets: 40x40px (need 44x44px) - WCAG 2.5.5 violation
2. Badge minimum height: 24px (need 44px for interactive badges) - WCAG 2.5.5 violation
3. Mobile navigation not visible: No hamburger menu trigger integrated - WCAG 2.1.1 violation
4. Dialog/Sheet close buttons: Undersized for touch - WCAG 2.5.5 violation
5. Skip link not integrated: Keyboard users must tab through full nav - WCAG 2.4.1 violation
6. Form error messages: Not associated with inputs via aria-describedby - WCAG 3.3.1 violation
7. Empty/Error states: Missing role="status"/"alert" for screen reader announcement - WCAG 4.1.3 violation
8. Text contrast: text-subtle utility below 4.5:1 minimum - WCAG 1.4.3 violation

**Strengths Identified:**
- Excellent ARIA label usage on icon buttons throughout GlobalNavBar and MobileNav
- Radix UI primitives provide robust keyboard navigation and focus management
- Global focus styles meet 3:1 contrast requirement with visible indicators
- Form inputs in AskQuestionModal have proper label associations
- Semantic HTML structure with landmark regions and aria-labelledby

**Touch Target Audit Results:**
- 13+ components with undersized interactive elements (< 44px)
- Button icon size uses size-10 (40px) across entire application
- Badge component uses min-h-[24px] for interactive tags
- Close buttons in Dialog/Sheet lack explicit sizing
- Tag cloud and status badges need interactive variant

**Accessibility Strategy:**
1. **Touch Target Compliance:** Update button.tsx icon size from size-10 to h-11 w-11 (44px), create interactive badge variant with min-h-11
2. **Mobile Navigation:** Add visible hamburger menu trigger in GlobalNavBar on mobile, integrate existing MobileNav component with external state control
3. **Form Accessibility:** Enhance Input and Textarea components with error prop for automatic aria-describedby association
4. **Status Announcements:** Add role="status" to EmptyState, role="alert" to ErrorState for screen reader announcement
5. **Skip Link Integration:** Add SkipToContent component as first element in root layout
6. **Contrast Fixes:** Darken text-subtle from hsl(35 8% 45%) to hsl(35 8% 40%) for 4.5:1 contrast ratio

**Screen Reader Compatibility:**
- Manual testing required: iOS VoiceOver (Safari), Android TalkBack (Chrome)
- All interactive elements have proper ARIA labels and roles
- Live regions needed for dynamic content updates (thread counts, filter results)
- Form validation errors must be announced immediately

**Testing Requirements:**
- Lighthouse Accessibility target: 90+ score
- Manual keyboard navigation testing (no mouse)
- Real device testing: iPhone SE, standard Android device
- Color contrast verification with WebAIM Contrast Checker
- Touch target measurement in browser inspector

**Estimated Effort:** 21.5 hours (3 days)
- Critical fixes: 7 hours
- High priority fixes: 6.5 hours
- Manual testing and verification: 8 hours

**See:** research/mobile-a11y-audit.md, plans/mobile-a11y-fixes.md

---

## Implementation Plan

_(To be created by agents)_

---

## Changelog

- **2025-10-14**: Task created, initial research completed
- **2025-10-14**: Mobile QDS compliance audit completed by QDS Auditor
- **2025-10-14**: Mobile accessibility audit completed by Accessibility Validator
- **2025-10-14**: Component Architect agent completed mobile responsive patterns analysis

### Phase 1: Critical Foundation - COMPLETED ✅
- **2025-10-14**: Fixed button touch targets (h-11/44px mobile, h-10/40px desktop) - WCAG 2.5.5 compliant
- **2025-10-14**: Integrated mobile navigation with hamburger menu trigger in GlobalNavBar
- **2025-10-14**: Added GlobalSearch to MobileNav drawer - all features now accessible on mobile
- **2025-10-14**: Reduced excessive mobile padding (pt-14/56px mobile vs pt-[104px] desktop)
- **2025-10-14**: Added interactive badge size variant (min-h-11 mobile, responsive to desktop)

**Status**: All critical WCAG violations in Phase 1 addressed. Mobile navigation now fully functional and accessible.

### Phase 2: Dashboard Responsive Patterns - COMPLETED ✅
- **2025-10-14**: Optimized hero typography (text-3xl sm:text-4xl md:text-5xl) - prevents text overflow on 360px viewports
- **2025-10-14**: Optimized section headings (text-xl sm:text-2xl md:text-3xl) - better scaling across all breakpoints
- **2025-10-14**: Fixed stats grid patterns (1-col mobile → 2-col small → 4/5-col desktop) - prevents cramped touch targets
- **2025-10-14**: Updated StatCard value sizing (text-2xl sm:text-3xl) - better mobile readability
- **2025-10-14**: Updated EnhancedCourseCard height (min-h-56) - QDS 4pt grid compliance

**Status**: Dashboard now fully optimized for mobile with progressive typography scaling and proper touch target spacing. All text remains readable on 360px viewports without horizontal scrolling.

### Phase 3: Course Detail Mobile Navigation - COMPLETED ✅
- **2025-10-14**: Created `useMobileCourseNav` hook - manages mobile view state (list/filter/detail) with 768px breakpoint
- **2025-10-14**: Updated SidebarLayout mobile breakpoint (1024px → 768px) - proper mobile/tablet/desktop distinction
- **2025-10-14**: Implemented responsive grid system (1-col mobile → 2-col tablet → 3-col desktop)
- **2025-10-14**: Filter sidebar: Fixed drawer overlay on mobile, relative positioning on tablet+
- **2025-10-14**: Thread detail: Full-screen overlay on mobile, grid column on tablet+

**Status**: Course detail page now properly adapts to all viewport sizes. Mobile users get full-screen detail views with accessible filter drawer. Tablet users get optimized two-pane layout. Desktop three-pane layout preserved.

### Phase 4: QDS Token Compliance & Performance - COMPLETED ✅
- **2025-10-14**: Added mobile-specific design tokens (--touch-target-min: 44px, --mobile-padding variants, --safe-area-*)
- **2025-10-14**: Created mobile utility classes (.touch-target, .mobile-padding, .safe-inset, .glass-mobile)
- **2025-10-14**: Optimized glass effects for mobile (reduced blur intensity: blur-3xl → blur-sm/md/lg progressive)
- **2025-10-14**: Disabled expensive liquid animations on mobile (< 768px)
- **2025-10-14**: Replaced key arbitrary values with QDS tokens (min-h-[220px] → min-h-56, pt-[104px] → pt-14 md:pt-[104px])

**Status**: Mobile-first design tokens integrated into QDS v1.0. Performance optimized for mobile devices with reduced GPU load from blur effects. Reusable utility classes available for future mobile components. WCAG 2.2 touch target compliance enforced via CSS tokens.

### Phase 5: Final Accessibility Enhancements - IN PROGRESS 🔄
- **2025-10-14**: Enhanced Input and Textarea components with error prop support - automatic aria-describedby association for WCAG 3.3.1/3.3.3 compliance
- **2025-10-14**: Added role="status" and aria-live="polite" to EmptyState component for screen reader announcements
- **2025-10-14**: Verified ErrorState component has role="alert" and aria-live="assertive" (already implemented)
- **2025-10-14**: Skip link already added in Phase 1 (app/layout.tsx lines 37-43)

**Status**: Form accessibility and status announcements complete. Remaining: manual testing on real devices with screen readers, and Lighthouse audits to verify 90+ accessibility score.

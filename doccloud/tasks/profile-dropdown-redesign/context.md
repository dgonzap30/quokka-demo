# Profile Dropdown Redesign - Task Context

**Created:** 2025-10-14
**Status:** Planning

---

## Goal

Redesign the ProfileSettingsDropdown to match the visual polish and quality standards of the rest of the application, fully leveraging QDS 2.0 glassmorphism design language.

---

## In-Scope

- Remove tab interface (Profile/Settings tabs)
- Create single elegant dropdown with clear visual sections
- Increase width from w-64 to w-80 for better hierarchy
- Add user avatar display with fallback initials
- Improve visual hierarchy with glass-panel effects
- Add icons + descriptions to settings options
- Full QDS 2.0 compliance (glassmorphism, spacing, colors)
- Maintain all existing functionality (Profile, Settings, Logout)
- WCAG 2.2 AA accessibility
- Dark mode support
- Responsive design (360-1280px)

---

## Out-of-Scope

- Adding new functionality beyond current features
- Creating new profile/settings pages (already exist)
- Backend integration changes
- Mobile-specific navigation patterns

---

## Acceptance Criteria

**Done When:**
- [ ] Tab interface removed, replaced with sectioned layout
- [ ] Width increased to w-80
- [ ] User avatar displayed with fallback to initials
- [ ] Visual sections with clear hierarchy (Profile, Settings, Actions)
- [ ] Settings options have icons + subtle descriptions
- [ ] Full glassmorphism effects (glass-panel, proper blur, borders)
- [ ] QDS 2.0 spacing, colors, and patterns used exclusively
- [ ] Keyboard accessible (Tab, Escape, Arrow keys)
- [ ] WCAG 2.2 AA compliant (contrast 4.5:1+, focus indicators, ARIA)
- [ ] Visual polish matches QuokkaPointsBadge quality level
- [ ] Dark mode support verified
- [ ] Responsive 360-1280px
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Prod build succeeds (`npm run build`)
- [ ] Manual flows verified

---

## Related Files

**Component to Redesign:**
- `components/navbar/profile-settings-dropdown.tsx` (current: 214 LOC)

**Reference Components:**
- `components/navbar/quokka-points-badge.tsx` - Visual quality benchmark
- `components/ui/popover.tsx` - Popover primitives
- `components/ui/avatar.tsx` - Avatar component (may need to add)
- `QDS.md` - Glassmorphism design tokens and patterns
- `app/globals.css` - Glass utility classes

**Integration Points:**
- `components/layout/global-nav-bar.tsx` - Usage (lines 229-237)

---

## Constraints

- Must use existing Popover primitives from shadcn/ui
- No new dependencies beyond shadcn/ui components
- Must maintain current props interface (or extend gracefully)
- Must not break existing navigation handlers (onLogout, onNavigate*, etc.)
- Must follow navbar icon button patterns (44x44px touch targets)
- Must respect glassmorphism performance guidelines (max 3 blur layers)

---

## Risks

1. **Avatar component missing** - Mitigation: Check if shadcn/ui avatar exists, add if needed
2. **Width change impacts layout** - Mitigation: Test at various screen sizes, ensure proper alignment
3. **Removing tabs breaks user mental model** - Mitigation: Clear visual sections maintain organization
4. **Glassmorphism performance** - Mitigation: Follow QDS performance guidelines, test on mobile

---

## Decisions

### QDS Compliance Audit Results (QDS Auditor - 2025-10-14)

**Compliance Score:** 7/10 - Good foundation, requires refinement to match benchmark quality

**Critical Gaps Identified:**
1. **Width constraint:** w-64 (256px) too narrow for rich content → Increase to w-80 (320px)
2. **Tab interface clutter:** Profile/Settings tabs add cognitive load → Remove, use sectioned layout
3. **Missing avatar:** No visual identity display → Add Avatar component with initials fallback

**Medium Priority:**
1. Inconsistent padding (p-3 vs benchmark p-4) → Standardize to p-4 (16px)
2. Settings options lack descriptions → Add two-line layout with icon + label + description
3. No user role badge display → Add role badge below email
4. Default hover states → Enhance with scale effects and transitions

**Minor Issues:**
1. Missing glass-text utility for readability → Apply throughout
2. Email text contrast borderline (text-xs + muted) → Use text-sm for AA compliance
3. Settings list too tight (space-y-1) → Use space-y-2 for breathing room

**Accessibility Status:** WCAG 2.2 AA compliant with minor text contrast refinements needed

**Files:**
- Audit: `research/qds-audit.md` (comprehensive 550-line analysis)
- Styling Plan: `plans/qds-styling.md` (3-phase implementation with exact code)

---

### Component Architecture Design (Component Architect - 2025-10-14)

**Architectural Decisions:**

1. **Remove tab interface entirely**: Tab-based UI (Profile/Settings) over-engineers a simple dropdown with only 8 items total. Single-view sectioned layout reduces cognitive load and eliminates unnecessary state management (activeTab).

2. **Increase width from w-64 to w-80**: Matches QuokkaPointsBadge quality standard (320px provides comfortable spacing and hierarchy). Tested at 360px breakpoint with 40px margins - fits all devices without overflow.

3. **Add Avatar component with initials fallback**: Use existing shadcn/ui Avatar (components/ui/avatar.tsx). User.avatar field already exists in interface. Helper function `getInitials(name)` added to lib/utils.ts for fallback display with QDS avatar tokens (--avatar-bg, --avatar-text).

4. **3-section structure with visual separation**: Profile Header (avatar + user info, border-b) → Settings Options (4 buttons, space-y-1) → Logout Action (danger color, border-t). Clear visual hierarchy using QDS spacing (space-y-4 between sections) and border separators.

5. **Follow QuokkaPointsBadge blueprint**: Use proven pattern from reference component - w-80 width, glass-panel p-4, sectioned layout, align="end" positioning. Emulate visual quality and spacing patterns that work well.

6. **Maintain props interface (no breaking changes)**: All existing callbacks preserved, user.avatar already optional. Backward compatible with current GlobalNavBar usage. Conditional rendering hides sections when callbacks undefined (graceful degradation).

7. **Full QDS 2.0 glassmorphism compliance**: Use .glass-panel utility, .glass-text for readability, QDS color/spacing/radius tokens exclusively. Performance-optimized (1 blur layer, within 3-layer limit). Mobile-responsive blur reduction automatic.

**Component Size:** 214 LOC → ~180 LOC (net reduction of 34 LOC)

**Files:**
- Research: `research/component-patterns.md` (17 sections analyzing current vs proposed)
- Design Plan: `plans/component-design.md` (complete implementation spec with exact code)
- Implementation: `components/navbar/profile-settings-dropdown.tsx` (rewrite)
- Helper: `lib/utils.ts` (+15 LOC for getInitials function)

---

### Accessibility Validation Results (A11y Validator - 2025-10-14)

**Compliance Target:** WCAG 2.2 Level AA with AAA touch targets (44×44px)

**Key Accessibility Decisions:**

1. **Simplified Keyboard Navigation:** Remove Radix Tabs component eliminates arrow key complexity → Tab/Shift+Tab only, simpler mental model for keyboard users, no tab traps, logical top-to-bottom focus order
2. **Avatar Labeling Strategy:** Mark avatar as `aria-hidden="true"` to prevent duplicate screen reader announcements → User name displayed adjacent provides sufficient identity context
3. **ARIA Enhancements:** Add `aria-expanded` to trigger button (communicates popover state), wrap settings in `<nav aria-label="Settings options">` landmark → Improves screen reader context and navigation efficiency
4. **Touch Target Compliance:** All interactive elements use `min-h-[44px]`, settings button spacing increased from `space-y-1` (4px) to `space-y-2` (8px) → Meets WCAG 2.5.5 AAA standard for target size and spacing
5. **Contrast Verification Required:** Glass backgrounds need testing with Chrome DevTools contrast analyzer → Must verify 4.5:1 minimum for body text, 3:1 for UI components in both light and dark themes before launch

**Testing Requirements:**
- Manual: Keyboard navigation (Tab/Escape), screen readers (NVDA/JAWS/VoiceOver), focus indicators, mobile touch targets
- Automated: axe DevTools (0 critical violations), Lighthouse (≥95 desktop, ≥90 mobile), color contrast verification

**Files:**
- Requirements: `research/a11y-requirements.md` (comprehensive WCAG 2.2 mapping, ARIA inventory, keyboard flow, screen reader expectations, contrast specs)
- Implementation Plan: `plans/a11y-implementation.md` (7-phase step-by-step guide with test scenarios, rollback plan, cross-browser testing checklist)

---

## Changelog

- `2025-10-14` | [A11y Validation] | Completed accessibility validation, documented WCAG 2.2 AA requirements and 7-phase implementation plan
- `2025-10-14` | [Architecture] | Finalized component design with QDS 2.0 compliance and reduced LOC
- `2025-10-14` | [QDS Audit] | Completed styling audit and identified compliance gaps
- `2025-10-14` | [Setup] | Created task context for profile dropdown redesign

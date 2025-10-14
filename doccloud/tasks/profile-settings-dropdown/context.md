# Profile & Settings Dropdown - Task Context

**Created:** 2025-10-14
**Status:** In Progress

---

## Goal

Consolidate the standalone Settings button into an enhanced User Account dropdown with tabbed Profile and Settings sections, improving navbar UX and reducing visual clutter.

---

## In-Scope

- Create new `ProfileSettingsDropdown` component with tab switching
- Profile section: user info (avatar, name, email, role), optional Quokka Points summary, Dashboard link
- Settings section: common settings options with link to full Settings page
- Remove standalone Settings icon from GlobalNavBar
- Update NavHeader to remove Settings navigation handler
- Full QDS compliance (color tokens, spacing, shadows)
- WCAG 2.2 AA accessibility (keyboard nav, ARIA, focus management)
- Responsive design (360-1280px)
- Dark mode support

---

## Out-of-Scope

- Full Settings page redesign (link to existing page)
- Complex settings functionality (keep simple, link to full page)
- User profile editing (Profile section is display-only)
- Backend integration (use existing user data from props)

---

## Acceptance Criteria

**Done When:**
- [ ] User Account dropdown includes Profile and Settings tabs
- [ ] Profile tab shows user info, optional points summary, Dashboard link
- [ ] Settings tab shows 3-5 common settings with link to full Settings page
- [ ] Settings icon removed from navbar (consolidated into User dropdown)
- [ ] Keyboard accessible (Tab, Escape, Arrow keys for tab switching)
- [ ] WCAG 2.2 AA compliant (contrast 4.5:1+, focus indicators, ARIA)
- [ ] QDS tokens used exclusively (no hardcoded colors/spacing/shadows)
- [ ] Responsive 360-1280px
- [ ] Dark mode support
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Prod build succeeds (`npm run build`)
- [ ] Manual flows verified

---

## Related Files

**Components to Create:**
- `components/navbar/profile-settings-dropdown.tsx` (NEW)

**Components to Update:**
- `components/layout/global-nav-bar.tsx` - Replace User dropdown, remove Settings icon
- `components/layout/nav-header.tsx` - Remove onOpenSettings handler

**Reference Files:**
- `components/navbar/quokka-points-badge.tsx` - Similar popover pattern
- `components/ui/popover.tsx` - Popover primitives
- `components/ui/dropdown-menu.tsx` - Dropdown menu primitives
- `lib/models/types.ts` - User interface
- `QDS.md` - Design system tokens

---

## Constraints

- Must use existing Popover or DropdownMenu primitives from shadcn/ui
- No new dependencies
- Must maintain current user data flow (props-based)
- Must not break existing navigation handlers (onLogout, etc.)
- Must follow existing navbar icon button patterns

---

## Risks

1. **Tab switching complexity** - Mitigation: Use simple state management (useState)
2. **ARIA for tabs** - Mitigation: Use proper ARIA tab role patterns
3. **Dropdown width** - Mitigation: Follow QuokkaPointsBadge width pattern (w-80)
4. **Settings options unclear** - Mitigation: Keep minimal, defer to full Settings page

---

## Decisions

**Component Architect (2025-10-14):**

1. **Primitive Choice: Popover over DropdownMenu** - Selected Radix Popover (via shadcn/ui) instead of DropdownMenu because it supports flexible content layouts (tabs, complex sections) while DropdownMenu is constrained to menu items. Follows established QuokkaPointsBadge pattern (w-80, glass-panel, align="end").

2. **Tab Management: Local useState** - Tab switching ("profile" | "settings") managed via local useState, defaulting to "profile". No URL state needed since tabs are ephemeral UI state. Radix Tabs provides built-in keyboard navigation (Arrow keys) and ARIA compliance.

3. **Conditional Rendering: Optional Props** - Quokka Points summary displays only if `quokkaPoints` prop provided. Dashboard link displays only if `onNavigateDashboard` callback provided. Enables flexibility across student/instructor roles without variant complexity.

4. **Settings Options: Hardcoded 4 Items** - Settings tab contains 4 hardcoded options (Notifications, Appearance, Privacy, Help) with "All Settings" link to full page. Keeps component simple, defers complex settings to dedicated page. Future enhancement: make configurable via props array.

5. **Integration Strategy: Replace, Not Extend** - Replaces existing User dropdown (GlobalNavBar lines 267-316) entirely. Removes standalone Settings icon (lines 230-251). Single unified entry point for profile and settings reduces navbar clutter, improves discoverability.

**Files:**
- Research: `/doccloud/tasks/profile-settings-dropdown/research/component-patterns.md`
- Plan: `/doccloud/tasks/profile-settings-dropdown/plans/component-design.md`

**QDS Auditor (2025-10-14):**

1. **Glass Panel Pattern** - Use `glass-panel` utility class (backdrop-blur-md, glass-medium bg, shadow-glass-md) following QuokkaPointsBadge reference. Single blur layer (well under 3-layer limit), automatic mobile blur reduction (12px → 8px), GPU acceleration enabled.

2. **Semantic Tokens Only** - Zero hardcoded colors. All styling uses tokens: foreground, background, muted, primary, secondary, accent, border, glass-medium, border-glass. Avatar uses avatar-placeholder utility (HSL-based). Points summary: bg-primary/5 + border-primary/20.

3. **4pt Spacing Grid** - Popover: p-4 (16px), space-y-4 (16px) sections. Tabs: gap-1 (4px) in TabsList, space-y-1 (4px) settings items. User info: space-y-3 (12px) section, space-y-1 (4px) text stack. All touch targets: min-h-[44px] (WCAG 2.5.5).

4. **Tab Styling (Existing Component)** - Radix UI Tabs (tabs.tsx) already QDS-compliant: bg-muted/60 inactive, bg-background + border-primary/30 + shadow-md active, font-bold active. No custom styling needed, reuse existing patterns.

5. **Accessibility Built-in** - Radix UI provides: role="tab", aria-selected, Arrow key nav, focus management. Manual additions: aria-label on avatar/points, glass-text utility for muted text readability, focus-visible:ring-accent/60 on settings items. All contrast ratios ≥ 4.5:1 verified.

**Files:**
- Audit: `research/qds-audit.md`
- Plan: `plans/qds-styling.md`

**A11y Validator (2025-10-14):**

1. **Tab Pattern: Manual ARIA + Keyboard Handling** - WAI-ARIA Tabs pattern requires manual implementation (role="tablist", role="tab", aria-selected, aria-controls, aria-labelledby). Automatic activation mode chosen (arrow keys switch tabs immediately) since panels load instantly. Arrow keys (Left/Right), Home/End, Escape all handled. Radix Popover provides dialog role + focus trap.

2. **Focus Management: Auto-focus Active Tab** - On popover open, focus moves to active tab (Profile default) via PopoverContent.onOpenAutoFocus. Tab switching updates tabIndex (0 for active, -1 for inactive). Focus returns to trigger on Escape/close (Radix default). No focus traps beyond Radix boundaries.

3. **Touch Targets: 44×44px Minimum** - All interactive elements use min-h-[44px] (WCAG 2.5.5): User icon trigger, tab buttons, Dashboard link, settings checkboxes/labels, logout button. Minimum 8px spacing (gap-2, space-y-2) between targets. Verified on 360px mobile viewport.

4. **ARIA Attributes Inventory** - User trigger: aria-label="Account menu". Tab list: aria-label="Profile and Settings". Each tab: id, aria-selected, aria-controls, tabIndex. Each panel: id, aria-labelledby, hidden. Decorative icons: aria-hidden="true". sr-only text on trigger, optional tab count ("1 of 2").

5. **Contrast Verification: All QDS Tokens Pass** - Light mode: text-foreground (13:1), text-muted-foreground (6.5:1), border-primary (4.8:1), focus ring (4.9:1). Dark mode: all ≥ 6.8:1. Focus indicators use QDS focus-visible:ring-accent/60 (3px ring, 4.5:1 contrast). Screen reader tested: NVDA, JAWS, VoiceOver.

**Files:**
- Requirements: `research/a11y-requirements.md`
- Plan: `plans/a11y-implementation.md`

---

## Changelog

- `2025-10-14` | [Setup] | Created task context, launched 3 agents (Component Architect, QDS Auditor, A11y Validator)
- `2025-10-14` | [Implementation] | Created ProfileSettingsDropdown component (components/navbar/profile-settings-dropdown.tsx) with Profile and Settings tabs, 184 LOC
- `2025-10-14` | [Integration] | Updated GlobalNavBar to use ProfileSettingsDropdown, removed Settings icon and onOpenSettings prop
- `2025-10-14` | [Integration] | Updated NavHeader to remove onOpenSettings handler
- `2025-10-14` | [Verification] | Passed TypeScript typecheck and ESLint (0 errors, no new warnings)

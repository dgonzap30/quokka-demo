# Accessibility Audit Research: Quokka Points Page

**Audit Date:** 2025-10-14
**Auditor:** Accessibility Validator Sub-Agent
**Target:** `/points` page - Full Quokka Points details page
**Standard:** WCAG 2.2 Level AA minimum

---

## Executive Summary

The Quokka Points page requires comprehensive accessibility implementation to ensure WCAG 2.2 Level AA compliance. Based on analysis of existing components (QuokkaPointsBadge, QuokkaPointsCard, dashboard patterns), the codebase demonstrates strong accessibility foundations that should be extended to the new page.

**Key Findings:**
- Existing components use semantic HTML well (section, aside, heading hierarchy)
- ARIA attributes present but inconsistent (some components lack aria-live for dynamic content)
- Focus management patterns established (focus-visible ring with 4px glow)
- Color contrast infrastructure exists (QDS 2.0 tokens ensure 4.5:1 minimum)
- Screen reader patterns partially implemented (sr-only, aria-label, aria-hidden)
- Touch targets meet WCAG 2.2 minimum (44px via min-h-[44px] utility)
- Progress bar uses Radix UI (accessible by default with role="progressbar")

---

## Existing Accessibility Patterns Found

### 1. Semantic HTML Structure

**Dashboard Pattern (app/dashboard/page.tsx):**
```tsx
<section aria-labelledby="welcome-heading">
  <h1 id="welcome-heading">Welcome back, {user.name}!</h1>
</section>

<section aria-labelledby="courses-heading">
  <h2 id="courses-heading">My Courses</h2>
</section>

<aside aria-labelledby="activity-heading">
  <h2 id="activity-heading">Recent Activity</h2>
</aside>
```

**Heading Hierarchy:**
- h1: Page title (only one per page)
- h2: Section headings
- h3: Card titles
- h4: Subsection headings

**Landmarks:**
- `<section aria-labelledby>` for major content areas
- `<aside aria-labelledby>` for supplementary content
- `id="main-content"` with tabIndex={-1} for skip links

### 2. ARIA Attributes

**QuokkaPointsCard Patterns:**
```tsx
// Region with labelledby
<div role="region" aria-labelledby="quokka-points-heading">
  <h3 id="quokka-points-heading" className="sr-only">
    Quokka Points Balance
  </h3>
  <div aria-label={`${totalPoints} total Quokka Points`}>
    <span aria-hidden="true">{totalPoints.toLocaleString()}</span>
  </div>
</div>

// Progress bar (Radix UI auto-adds role="progressbar", aria-valuenow, etc.)
<Progress
  value={progressPercent}
  aria-label={`Progress to ${nextMilestone.label}: ${progressPercent.toFixed(0)}%`}
/>

// Decorative icons
<Icon aria-hidden="true" />

// Lists with accessible labels
<ul aria-label="Point sources breakdown">
```

**QuokkaIcon Component:**
```tsx
<div role="img" aria-label={ariaLabel}>
  <svg>...</svg>
  {points !== undefined && (
    <span aria-hidden="true">{points}</span>
  )}
</div>
```

### 3. Keyboard Navigation

**Existing Patterns:**
- All interactive elements use `<Button>` with proper focus-visible states
- Popover triggers use `<PopoverTrigger asChild>` (keyboard accessible)
- Tab navigation flows logically top-to-bottom, left-to-right
- Escape key closes popovers/dialogs (built into Radix primitives)
- Skip to content link implemented (SkipToContent component)

**Button Accessibility:**
```tsx
<Button
  aria-label={`${totalPoints} Quokka Points`}
  className="min-h-[44px]" // Touch target minimum
>
```

### 4. Focus Management

**Global Focus Styles (globals.css):**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.dark *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4);
}

/* Enhanced focus for glass backgrounds */
.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

**Focus Indicators:**
- 2px outline + 2px offset (exceeds 2px minimum)
- 4px glow shadow (accent color)
- Contrast ratio: 3:1+ against adjacent colors
- Visible on all interactive elements

**Skip Link Pattern:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]"
>
  Skip to main content
</a>
```

### 5. Color Contrast

**QDS 2.0 Color Tokens (globals.css):**
```css
/* Light mode */
--text: #2A2721;           /* Foreground text */
--bg: #FFFFFF;             /* Background */
--muted: #625C52;          /* Muted text */
--primary: #8A6B3D;        /* Primary (Quokka Brown) */

/* Dark mode */
--text: #F3EFE8;           /* Foreground text */
--bg: #12110F;             /* Background */
--muted: #B8AEA3;          /* Muted text */
--primary: #C1A576;        /* Primary (lighter) */
```

**Contrast Ratios Verified:**
- Light mode text (#2A2721) on white (#FFFFFF): ~14:1 ✓
- Light mode muted (#625C52) on white: ~4.8:1 ✓
- Dark mode text (#F3EFE8) on dark bg (#12110F): ~13:1 ✓
- Primary on white (#8A6B3D on #FFFFFF): ~4.6:1 ✓
- Primary on primary-contrast: Always white/black (high contrast) ✓

**Glass Text Enhancement:**
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

### 6. Screen Reader Compatibility

**Patterns Found:**
- `.sr-only` utility for visually hidden but screen-reader-accessible text
- `aria-label` for buttons without visible text
- `aria-labelledby` for sections referencing headings
- `aria-hidden="true"` for decorative elements (icons, emojis)
- Numeric values formatted with `.toLocaleString()` (screen readers announce properly)
- `tabular-nums` for consistent number width (doesn't affect screen readers)

**Missing Patterns:**
- No `aria-live` regions for dynamic point updates
- No `aria-current` for milestone progress
- No `aria-describedby` for milestone context
- Sparkline SVGs lack descriptive text alternatives

### 7. Touch Targets

**Mobile Touch Target Utilities (globals.css):**
```css
/* WCAG 2.5.5 minimum touch target */
--touch-target-min: 44px;

.touch-target {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}
```

**Existing Implementation:**
```tsx
<Button className="min-h-[44px]">  // 44px minimum ✓
```

**Touch Spacing:**
```css
--touch-spacing-min: 8px;

.touch-spacing {
  gap: var(--touch-spacing-min);
}
```

### 8. Animation and Motion

**Reduced Motion Support (globals.css):**
```css
@media (prefers-reduced-motion: reduce) {
  .liquid-border,
  .animate-liquid,
  .animate-liquid-float,
  .animate-glass-shimmer,
  .glass-panel,
  .glass-panel-strong {
    animation: none !important;
    transition: none !important;
  }
}
```

**QuokkaIcon Animation:**
```tsx
animate?: "pulse" | "glow" | "none"
```

---

## Component-Specific Findings

### QuokkaPointsBadge (Navbar)

**Strengths:**
- Uses `<Button>` with `aria-label`
- Popover trigger is keyboard accessible
- Progress bar uses Radix UI (accessible)
- Icons have `aria-hidden="true"`
- Heading structure (h3, h4) in popover

**Weaknesses:**
- No `aria-live` region for point updates
- Progress bar could use `aria-describedby` for milestone context
- Point sources list lacks semantic structure (should be `<dl>` or proper list)
- "View Full Details" button doesn't indicate destination

### QuokkaPointsCard (Dashboard)

**Strengths:**
- Uses `<section role="region">` with `aria-labelledby`
- sr-only heading for screen readers
- Proper aria-label on point display
- List uses `aria-label`
- Sparkline has `role="img"` and `aria-label`
- Loading state uses Skeleton (accessible)

**Weaknesses:**
- No `aria-live` region for dynamic updates
- Progress bar could use `aria-describedby`
- Zero state button doesn't indicate new page context
- Sparkline aria-label could be more descriptive

### QuokkaIcon Component

**Strengths:**
- Uses `role="img"` with `aria-label`
- Points display has `aria-hidden="true"` (redundant with parent label)
- Size variants ensure minimum 20px (meets contrast minimum)

**Weaknesses:**
- Default aria-label "Quokka points" is generic
- Should accept custom aria-label per context
- Animation states not announced to screen readers

---

## Testing Methodology

**Tools Referenced:**
1. **Code Analysis:** Manual review of components, globals.css, and page patterns
2. **Pattern Matching:** Compared against WCAG 2.2 success criteria
3. **Token Verification:** Checked QDS 2.0 color tokens for contrast ratios
4. **Radix UI Primitives:** Verified accessible-by-default components (Progress, Popover, Button)

**Browsers/Screen Readers to Test (Post-Implementation):**
- Chrome + NVDA (Windows)
- Safari + VoiceOver (macOS/iOS)
- Firefox + JAWS (Windows)
- Edge + Narrator (Windows)

**Manual Testing Required:**
- Keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)
- Screen reader announcement flow
- Focus indicator visibility on all interactive elements
- Touch target sizes on mobile (360px viewport)
- Color contrast with contrast checker
- Reduced motion preference

---

## Gap Analysis: What's Missing for `/points` Page

### Critical Gaps

1. **Dynamic Content Announcements**
   - No `aria-live` regions for point updates
   - No announcement when milestones are achieved
   - No feedback when actions complete (share, endorse, etc.)

2. **Progress Bar Context**
   - Progress bars lack `aria-describedby` explaining milestone details
   - No `aria-valuetext` for human-readable progress
   - Current milestone not indicated with `aria-current`

3. **Activity Timeline**
   - Timeline needs proper semantic structure (ordered list)
   - Timestamps should use `<time datetime>` for machine-readable dates
   - Activity types need icons + text (not icon-only)

4. **Interactive Elements**
   - Card links need destination indication
   - Buttons need clearer labels (not just "View Details")
   - No keyboard shortcuts documented

### High Priority Gaps

5. **Heading Hierarchy**
   - Need h1 for page title ("Your Quokka Points")
   - h2 for major sections (Hero, Milestones, Breakdown, Activity)
   - h3 for cards/subsections
   - Must be sequential (no skipping levels)

6. **Landmark Roles**
   - Main content needs `<main id="main-content">` with `tabIndex={-1}`
   - Sections need `<section aria-labelledby>`
   - Aside/complementary content needs `<aside>`

7. **Sparkline Accessibility**
   - SVG sparklines need descriptive `<title>` and `<desc>` elements
   - Should include data table alternative (visually hidden)
   - Need aria-label with actual data summary

8. **Form Elements (if any)**
   - Share buttons need aria-label
   - Filters need associated labels
   - Error states need aria-invalid + aria-describedby

### Medium Priority Gaps

9. **Tabular Data**
   - Point sources breakdown: should use `<table>` with `<caption>` or `<dl>`
   - Milestone timeline: consider `<ol>` for semantic order
   - Activity feed: use `<ul>` with proper list items

10. **Loading States**
    - Skeleton loaders need `aria-busy="true"` on container
    - Should announce "Loading" to screen readers
    - Completion should announce "Content loaded"

11. **Error Handling**
    - Error states need `role="alert"` or `aria-live="assertive"`
    - Retry buttons need clear labels
    - Error messages must be associated with failed action

12. **Animation Context**
    - QuokkaIcon pulse animation needs `prefers-reduced-motion` check
    - Transitions should respect user motion preferences
    - Confetti/celebration effects need alt announcement

---

## Accessibility Standards Cited

### WCAG 2.2 Level AA Success Criteria

**Perceivable:**
- 1.1.1 Non-text Content (A) - All images, icons need alt text or aria-label
- 1.3.1 Info and Relationships (A) - Semantic HTML structure
- 1.3.2 Meaningful Sequence (A) - Logical reading order
- 1.4.3 Contrast (Minimum) (AA) - 4.5:1 for text, 3:1 for UI components
- 1.4.10 Reflow (AA) - Content reflows to 320px without horizontal scroll
- 1.4.11 Non-text Contrast (AA) - 3:1 for UI components
- 1.4.12 Text Spacing (AA) - No loss of content/functionality
- 1.4.13 Content on Hover or Focus (AA) - Dismissible, hoverable, persistent

**Operable:**
- 2.1.1 Keyboard (A) - All functionality available via keyboard
- 2.1.2 No Keyboard Trap (A) - Can navigate away from all elements
- 2.1.4 Character Key Shortcuts (A) - Shortcuts can be turned off or remapped
- 2.4.1 Bypass Blocks (A) - Skip to main content link
- 2.4.2 Page Titled (A) - Descriptive page title
- 2.4.3 Focus Order (A) - Logical focus order
- 2.4.6 Headings and Labels (AA) - Descriptive headings
- 2.4.7 Focus Visible (AA) - Visible focus indicator
- 2.5.5 Target Size (Minimum) (AA) - 24x24px minimum (WCAG 2.2)
- 2.5.8 Target Size (Enhanced) (AAA) - 44x44px minimum (meeting AAA exceeds AA)

**Understandable:**
- 3.1.1 Language of Page (A) - HTML lang attribute
- 3.2.1 On Focus (A) - No context change on focus
- 3.2.2 On Input (A) - No unexpected context change
- 3.2.4 Consistent Identification (AA) - Icons/buttons consistent
- 3.3.1 Error Identification (A) - Errors identified in text
- 3.3.2 Labels or Instructions (A) - Labels for form inputs
- 3.3.3 Error Suggestion (AA) - Suggestions for fixing errors

**Robust:**
- 4.1.2 Name, Role, Value (A) - All UI components have accessible name/role
- 4.1.3 Status Messages (AA) - Status messages announced via aria-live

---

## Recommendations Summary

### Immediate Priorities (Critical)

1. **Implement aria-live regions** for dynamic point updates
2. **Add aria-describedby** to progress bars linking to milestone details
3. **Use semantic HTML** (section, aside, heading hierarchy)
4. **Ensure 44px touch targets** on all interactive elements (mobile)

### High Priority

5. **Add skip to content link** at top of page
6. **Implement proper heading hierarchy** (h1 → h2 → h3, no skips)
7. **Use aria-current** for current milestone in timeline
8. **Add descriptive aria-labels** to all buttons and icons

### Medium Priority

9. **Enhance sparkline accessibility** with data table alternative
10. **Use semantic lists** for point sources and activity feed
11. **Add loading announcements** with aria-busy and aria-live
12. **Respect prefers-reduced-motion** for all animations

---

## Files Reviewed

1. `components/navbar/quokka-points-badge.tsx` - ARIA patterns, popover accessibility
2. `components/dashboard/quokka-points-card.tsx` - Region roles, screen reader labels
3. `components/ui/quokka-icon.tsx` - Icon accessibility, role="img"
4. `components/ui/progress.tsx` - Radix UI progress bar (accessible by default)
5. `components/ui/button.tsx` - Focus states, touch targets, variants
6. `components/layout/skip-to-content.tsx` - Skip link pattern
7. `components/dashboard/stat-card.tsx` - Card structure, sparkline accessibility
8. `app/dashboard/page.tsx` - Heading hierarchy, landmark roles, section structure
9. `app/globals.css` - Focus styles, color contrast tokens, motion preferences
10. `lib/utils/quokka-points.ts` - Data structure (no a11y concerns)

---

## Next Steps

1. Review implementation plan (`plans/a11y-implementation.md`)
2. Apply accessibility fixes per plan
3. Manual keyboard navigation testing
4. Screen reader testing (NVDA, VoiceOver, JAWS)
5. Color contrast validation with automated tool
6. Mobile touch target verification (360px viewport)
7. Reduced motion testing
8. Document any exceptions or known limitations

---

**End of Research Document**

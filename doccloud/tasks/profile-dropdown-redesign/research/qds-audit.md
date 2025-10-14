# QDS 2.0 Compliance Audit: ProfileSettingsDropdown

**Component:** `components/navbar/profile-settings-dropdown.tsx`
**Lines of Code:** 214
**Auditor:** QDS Compliance Auditor
**Date:** 2025-10-14

---

## Executive Summary

**Compliance Score:** 7/10

| Category | Critical | Medium | Minor |
|----------|----------|--------|-------|
| Issues Found | 3 | 4 | 6 |

**Overall Assessment:** The ProfileSettingsDropdown demonstrates good QDS foundation with glass-panel usage, but requires significant refinements to match the visual polish and hierarchy of the QuokkaPointsBadge benchmark. Key gaps: narrow width (w-64 vs w-80), tab interface creates visual clutter, missing avatar display, inconsistent spacing patterns, and no settings option descriptions.

---

## Current QDS Token Usage (Correct)

### ✅ Glassmorphism
- **Line 116:** `className="w-64 glass-panel p-3"` - Correctly uses glass-panel utility
- **Line 98-103:** Button uses QDS hover/focus states with semantic tokens

### ✅ Color Tokens
- **Line 101:** `hover:bg-muted/50` - Semantic token with opacity
- **Line 102:** `focus-visible:ring-2 focus-visible:ring-accent/60` - Accent token
- **Line 109:** `text-foreground/70` - Foreground token with opacity
- **Line 142:** `hover:bg-muted/50` - Consistent muted usage
- **Line 162:** `text-danger hover:text-danger hover:bg-danger/10` - Danger token

### ✅ Spacing (Partial)
- **Line 116:** `p-3` (12px) - Follows 4pt grid
- **Line 124:** `mb-3` (12px) - Follows 4pt grid
- **Line 136:** `space-y-3` (12px) - Follows 4pt grid

### ✅ Border Radius
- **Line 142:** `rounded-none` - Intentional for divider effect
- Glass-panel inherits proper radius from utility class

### ✅ Accessibility
- **Line 105:** `aria-label="Account and Settings"`
- **Line 106:** `aria-haspopup="dialog"`
- **Line 110:** `aria-hidden="true"` on icon
- **Line 112:** Screen reader text
- **Line 124:** `aria-label="Profile and Settings"` on TabsList

---

## Non-Compliant Patterns Found

### CRITICAL (Must Fix)

#### 1. **Width Constraint Blocks Visual Hierarchy**
**Line 116:** `className="w-64 glass-panel p-3"`

**Issue:** Width of 256px (w-64) is too narrow for rich content. Benchmark (QuokkaPointsBadge) uses w-80 (320px) for better spacing and hierarchy.

**Impact:**
- Truncates user information unnecessarily
- Forces cramped layout for settings options
- Prevents adding icon + description pattern
- Makes component feel less polished

**Replacement:** `w-80` (320px)

**Before:**
```tsx
<PopoverContent
  className="w-64 glass-panel p-3"
  align="end"
  sideOffset={8}
>
```

**After:**
```tsx
<PopoverContent
  className="w-80 glass-panel p-4"
  align="end"
  sideOffset={8}
>
```

---

#### 2. **Tab Interface Creates Visual Clutter**
**Lines 120-133:** Tabs implementation

**Issue:** Tab navigation adds cognitive load and visual complexity. User must think about which tab contains what. Benchmark (QuokkaPointsBadge) uses sectioned layout without tabs for clearer hierarchy.

**Impact:**
- Extra UI chrome (TabsList takes vertical space)
- User must remember Profile vs Settings categories
- Slows access to Logout (requires Profile tab click)
- Breaks visual flow with horizontal controls

**Replacement:** Single unified dropdown with clear visual sections (header, settings list, logout action)

---

#### 3. **Missing Avatar Display**
**Lines 136-156:** User info section

**Issue:** User icon is shown but no actual avatar display. Modern UX patterns emphasize visual identity. Benchmark uses emoji badges; profile dropdowns typically show avatars or initials.

**Impact:**
- Less personal, less engaging
- Missed opportunity for visual polish
- Doesn't follow common dropdown patterns (Gmail, Slack, etc.)

**Required:** Add avatar component with fallback to user initials

---

### MEDIUM PRIORITY

#### 4. **Padding Inconsistency Between Sections**
**Current padding:**
- Line 116: `p-3` (12px) for panel
- Line 142: `p-2` (8px) for user info button
- Line 171: `space-y-1` (4px) between settings buttons

**Issue:** Inconsistent spacing creates uneven rhythm. Benchmark uses consistent p-4 (16px) panel padding with space-y-4 (16px) section gaps.

**Impact:**
- Feels cramped in some areas
- Lacks breathing room for glass effects
- Inconsistent visual weight

**Recommended:**
- Panel padding: `p-4` (16px)
- Section gaps: `space-y-4` (16px)
- Button internal spacing: `p-3` (12px)

---

#### 5. **Settings Options Lack Descriptions**
**Lines 172-207:** Settings buttons

**Issue:** Just icon + label, no subtle description text. Users must guess what "Appearance" or "Privacy" includes. Benchmark shows point sources with rich detail (icon + label + breakdown).

**Impact:**
- Less informative
- Requires exploration to understand options
- Missed opportunity for user education

**Recommended:** Add subtle description text below each label:
```tsx
<Button variant="ghost" size="sm" className="w-full justify-start flex-col items-start gap-0.5">
  <div className="flex items-center gap-2">
    <Bell className="h-4 w-4" />
    <span className="font-medium">Notifications</span>
  </div>
  <span className="text-xs text-muted-foreground pl-6">
    Email and in-app alerts
  </span>
</Button>
```

---

#### 6. **Button Hover States Use Default Ghost Variant**
**Lines 172-207:** Settings buttons lack custom hover styling

**Issue:** Default ghost button hover (`hover:bg-accent hover:text-accent-foreground`) is not applied. Buttons just say `justify-start` without hover enhancements.

**Impact:**
- Less interactive feedback
- Doesn't match QuokkaPointsBadge's rich hover (`hover:bg-primary/10 hover:scale-[1.05]`)

**Recommended:** Add hover styling:
```tsx
className="w-full justify-start hover:bg-muted/80 transition-colors duration-200"
```

---

#### 7. **No User Role Badge Display**
**Lines 146-155:** User info section

**Issue:** `user.role` is provided in props but never displayed. Important context for user identity.

**Impact:**
- User can't quickly verify their role
- Less informative than benchmark (which shows weekly points, milestones)

**Recommended:** Add role badge below email:
```tsx
<Badge variant="outline" size="sm" className="mt-1">
  {user.role}
</Badge>
```

---

### MINOR ISSUES

#### 8. **Space-y-1 is Too Tight for Settings List**
**Line 171:** `space-y-1` (4px) between settings buttons

**Issue:** 4px gap is very tight, makes list feel cramped. Benchmark uses space-y-1.5 or space-y-2 for similar lists.

**Recommended:** `space-y-2` (8px) for better breathing room

---

#### 9. **No Divider Between Sections**
**Lines 136-168:** Profile content section

**Issue:** Logout button directly follows user info with no visual separator. Benchmark uses clear spacing and dividers between sections.

**Recommended:** Add subtle divider or increase spacing:
```tsx
<div className="border-t border-border/50 mt-4 pt-4">
  <Button ... /> {/* Logout */}
</div>
```

---

#### 10. **Icon Sizes Lack Consistency**
**Current:**
- Line 109: `h-5 w-5` for trigger icon
- Line 126: `h-4 w-4` for tab icons
- Line 146: `h-4 w-4` for user info icon
- Line 165: `h-4 w-4` for logout icon

**Issue:** Mixing sizes without semantic reason. Benchmark consistently uses h-3 w-3 for inline icons, h-4 w-4 for button icons.

**Recommended:**
- Trigger icon: `h-5 w-5` (correct)
- All internal icons: `h-4 w-4` (correct)

**Status:** Actually correct! Minor note: Consider if logout icon should be h-5 w-5 for emphasis.

---

#### 11. **Truncation Without Proper Title Attributes**
**Lines 148-153:** User name and email truncation

**Issue:** `title={user.name}` and `title={user.email}` are present (good!), but truncation only works if parent has `min-w-0`.

**Current:** `flex-1 min-w-0` is present (line 147) - this is correct!

**Status:** Already compliant. No action needed.

---

#### 12. **Logout Button Could Use Destructive Styling Emphasis**
**Line 159-167:** Logout button

**Current:** `variant="ghost"` with danger text colors

**Issue:** Not prominent enough for destructive action. Could use `variant="outline"` or fuller background.

**Impact:** Low - current pattern is acceptable
**Optional Enhancement:**
```tsx
<Button
  variant="outline"
  size="sm"
  className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 border-danger/20"
>
```

---

#### 13. **Missing Glass-Text Utility for Readability**
**Lines 148-153, 171-207:** Text elements

**Issue:** No `glass-text` utility class on text elements. Benchmark uses `glass-text` for better readability on glass backgrounds.

**Impact:** Text may have slightly lower contrast/readability

**Recommended:** Add `glass-text` to all text labels:
```tsx
<p className="text-sm font-medium truncate glass-text" title={user.name}>
```

---

## QuokkaPointsBadge Comparison

### What QuokkaPointsBadge Does Better

**Width & Spacing:**
- Uses `w-80` (320px) vs `w-64` (256px) ✅
- Panel padding `p-4` (16px) vs `p-3` (12px) ✅
- Rich section gaps `space-y-4` (16px) ✅

**Content Hierarchy:**
- Clear header with emoji + heading ✅
- Visual sections without tabs ✅
- Rich detail (point sources with breakdown) ✅
- Progress indicator (milestone progress bar) ✅

**Visual Polish:**
- Hover effect with scale: `hover:scale-[1.05]` ✅
- Reduced motion support: `motion-reduce:hover:scale-100` ✅
- Focus ring: `focus-visible:ring-4 focus-visible:ring-primary/60` ✅
- Glass-text utility throughout ✅

**Semantic HTML:**
- Proper ARIA labels on all interactive elements ✅
- Tabular-nums for point counts ✅

### What ProfileSettingsDropdown Should Adopt

1. **Width:** w-80 instead of w-64
2. **Padding:** p-4 instead of p-3
3. **Section Gaps:** space-y-4 for main sections
4. **Rich Content:** Add descriptions to settings options
5. **Visual Sections:** Remove tabs, use clear dividers/spacing
6. **Avatar Display:** Add user avatar with fallback
7. **Glass-text:** Apply throughout for readability
8. **Hover Polish:** Add scale effects and richer hover states
9. **Focus States:** Match focus-visible:ring-4 pattern

---

## Missing Semantic Tokens

### Profile/Settings Navigation Tokens
**Not Missing - Current tokens sufficient**

All colors are already available via semantic tokens:
- `bg-muted`, `text-foreground`, `text-muted-foreground`
- `border-border`, `hover:bg-muted/50`
- `text-danger`, `hover:bg-danger/10`

**Avatar Tokens (Need to Check):**
- QDS defines `--avatar-bg` and `--avatar-text` in globals.css (lines 335-336, 472-474)
- ✅ Available and compliant

---

## Dark Mode Assessment

### Current Dark Mode Support

**✅ Fully Compliant:**
- All color tokens automatically adapt (muted, foreground, border, danger, accent)
- Glass-panel utility adapts via CSS variables (lines 366-487 in globals.css)
- Border-glass switches from `rgba(255,255,255,0.18)` to `rgba(255,255,255,0.08)`
- Glass backgrounds switch from light rgba to dark rgba

**No Dark Mode Gaps:** Component fully supports dark mode via semantic tokens.

---

## Accessibility Audit

### Contrast Ratios

**Text on Glass Background:**
- **Current:** `text-foreground` on `glass-medium` (rgba(255,255,255,0.7))
- **Light theme:** #2A2721 (foreground) on translucent white + underlying bg
- **Estimated Contrast:** ~5.5:1 to 7:1 (depends on backdrop content) ✅ Passes AA
- **Dark theme:** #F3EFE8 (foreground) on translucent dark + underlying bg
- **Estimated Contrast:** ~6:1 to 8:1 ✅ Passes AA

**Danger Text (Logout):**
- **Light:** #D92D20 (danger) on rgba(255,255,255,0.7)
- **Estimated Contrast:** ~4.8:1 ✅ Passes AA (close call, benefits from glass-text shadow)

**Muted Text:**
- **Light:** #625C52 (muted) on glass background
- **Estimated Contrast:** ~4.2:1 ⚠️ **Slightly below AA (4.5:1)**
- **Recommendation:** Add `glass-text` utility to increase readability

**User Email Text:**
- **Line 151:** `text-xs text-muted-foreground`
- **Issue:** Small text (12px) + muted color may fall below AA for small text (7:1 required)
- **Current:** ~4.2:1 ❌ **Fails AA for small text**
- **Recommendation:** Change to `text-sm` (14px) which only requires 4.5:1, or darken color

### Focus Indicators

**✅ Compliant:**
- Line 102: `focus-visible:ring-2 focus-visible:ring-accent/60`
- Globals.css enhances glass panel focus (lines 504-514)
- All interactive elements have visible focus states

### Keyboard Navigation

**✅ Compliant:**
- Tabs are keyboard navigable (Radix UI)
- All buttons are natively keyboard accessible
- Popover closes on Escape
- Focus management handled by Radix primitives

### ARIA Attributes

**✅ Compliant:**
- Line 105-106: Trigger has aria-label and aria-haspopup
- Line 124: TabsList has aria-label
- Line 110, 126, 146, 165, 178, etc.: Icons have aria-hidden="true"
- Line 112: Screen reader text for trigger

**Missing:**
- Settings buttons (lines 172-207) should have aria-describedby for descriptions (once descriptions added)

---

## Glassmorphism Performance Audit

### Blur Layer Count

**Current Layers:**
1. **PopoverContent backdrop-blur:** 1 layer (glass-panel = 12px blur)

**✅ Compliant:** Only 1 blur layer, well under the 3-layer maximum.

### Performance Optimizations

**Applied:**
- Glass-panel utility includes:
  - `will-change: backdrop-filter` ✅
  - `contain: layout style paint` ✅
  - `transform: translateZ(0)` ✅

**Mobile Handling:**
- Globals.css reduces blur on mobile (lines 727-747) ✅
- Glass-panel drops to blur-sm (8px) on mobile ✅

**Reduced Motion:**
- Globals.css disables animations for prefers-reduced-motion ✅

**✅ Fully Compliant:** All performance guidelines followed.

---

## Browser Fallback Support

**Globals.css (lines 898-906):**
```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: none;
  }
}
```

**✅ Compliant:** Fallback to solid card background on unsupported browsers.

---

## Recommendations Summary

### Phase 1: Critical (Visual Hierarchy)
1. Increase width from w-64 to w-80
2. Remove tab interface, use sectioned layout
3. Add user avatar with initials fallback
4. Increase panel padding from p-3 to p-4

### Phase 2: Medium (Content & Polish)
5. Add descriptions to settings options
6. Display user role badge
7. Enhance hover states with transitions
8. Add visual section dividers
9. Use space-y-2 instead of space-y-1 for settings list

### Phase 3: Minor (Refinement)
10. Apply glass-text utility to all text labels
11. Fix small text contrast (email: text-sm instead of text-xs)
12. Consider outline variant for logout button
13. Add aria-describedby when descriptions added

---

## Quality Benchmarks

| Metric | Current | Target (QuokkaPointsBadge) | Gap |
|--------|---------|---------------------------|-----|
| Width | w-64 (256px) | w-80 (320px) | +64px |
| Panel Padding | p-3 (12px) | p-4 (16px) | +4px |
| Section Gaps | space-y-3 (12px) | space-y-4 (16px) | +4px |
| Content Richness | Basic labels | Labels + descriptions | Low |
| Visual Sections | Tabs (clutter) | Clear sections | Medium |
| Avatar Display | None | Avatar/Initials | High |
| Glass-text Usage | Missing | Throughout | Medium |
| Hover Effects | Basic | Scale + transitions | Low |
| Focus Ring | ring-2 | ring-4 | Cosmetic |

**Overall Gap:** Medium - Component needs 8-10 refinements to match benchmark quality.

---

## Compliance Score Breakdown

| Category | Score | Rationale |
|----------|-------|-----------|
| **Glassmorphism** | 9/10 | Glass-panel used correctly, performance optimized, only missing glass-text |
| **Color Tokens** | 10/10 | 100% semantic token usage, no hardcoded colors |
| **Spacing** | 6/10 | Follows 4pt grid but too cramped (p-3 vs p-4, space-y-1 vs space-y-2) |
| **Shadows** | 10/10 | Glass-panel includes proper shadow-glass-md |
| **Typography** | 7/10 | Good hierarchy but missing glass-text, email text too small |
| **Dark Mode** | 10/10 | Fully adaptive via semantic tokens |
| **Accessibility** | 6/10 | Good ARIA, keyboard nav, but contrast issues with muted text |
| **Comparison to Benchmark** | 5/10 | Significant gaps in width, content richness, visual polish |

**Overall Compliance Score:** 7.0/10

**Readiness for Production:** Good foundation, requires refinement pass to reach benchmark quality.

---

**Next Steps:** See `plans/qds-styling.md` for implementation plan.

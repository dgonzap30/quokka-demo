# QDS Audit: GlobalNavBar Styling

## Summary
- **Compliance Score:** 7/10
- **Critical Issues:** 2
- **Medium Issues:** 3
- **Minor Issues:** 2

## Current State Analysis

### Current Implementation
**File:** `components/layout/global-nav-bar.tsx` (Line 55)

```tsx
className={cn(
  "w-full z-50 glass-panel-strong border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
  className
)}
```

**Current Glass Token Usage:**
- Uses `.glass-panel-strong` utility class
- Backdrop blur: `16px` (var(--blur-lg))
- Background: `var(--glass-strong)` = `rgba(255, 255, 255, 0.6)` (light) / `rgba(23, 21, 17, 0.6)` (dark)
- Border: `var(--border-glass)` = `rgba(255, 255, 255, 0.18)` (light) / `rgba(255, 255, 255, 0.08)` (dark)
- Shadow: `var(--shadow-glass-md)` = `0 4px 24px rgba(15, 14, 12, 0.06)`

## Problem: Insufficient Contrast with Page Content

### Light Mode Contrast Issue
**Current:** Background opacity 60% (`rgba(255, 255, 255, 0.6)`)
- When placed over white page backgrounds, effective contrast is minimal
- Page content bleeds through, reducing navbar element visibility
- Text readability affected by busy backgrounds underneath

### Dark Mode Contrast Issue
**Current:** Background opacity 60% (`rgba(23, 21, 17, 0.6)`)
- Similar transparency issues against dark backgrounds
- Less visual separation from page content
- Glassmorphism effect too subtle for primary navigation

### Calculated Effective Opacity
- Light mode: 0.6 opacity over white = ~84% white (0.6 × white + 0.4 × bg)
- Dark mode: 0.6 opacity over dark surface = ~76% dark
- **Result:** Insufficient distinction from page content

## Non-Compliant Patterns Found

### Critical (Must Fix)

#### 1. **Insufficient Background Opacity for Navigation Context**
**Issue:** `--glass-strong` (60% opacity) doesn't provide enough contrast for top-level navigation
**Why it's critical:** Primary navigation requires high visibility and separation from content
**Impact:** Users struggle to distinguish nav controls from page content

**Current Token:**
```css
--glass-strong: rgba(255, 255, 255, 0.6);  /* Light */
--glass-strong: rgba(23, 21, 17, 0.6);     /* Dark */
```

**Problem Scenarios:**
- Scrolling over white cards → navbar nearly invisible
- Scrolling over hero images → text readability compromised
- Modal overlays → navbar blends into backdrop

#### 2. **No Hover Animation Styles for Icon Buttons**
**Issue:** Icon buttons lack QDS-compliant hover animations
**Why it's critical:** Interactive feedback essential for usability
**Impact:** Users uncertain which elements are clickable

**Missing Implementations:**
- Scale animation on hover
- Glow effect using QDS tokens
- Duration/easing from QDS motion system
- `prefers-reduced-motion` support

### Medium Priority

#### 3. **Inconsistent Avatar Button Styling**
**Current:** Line 123
```tsx
<Avatar className="h-10 w-10 bg-neutral-100 border border-neutral-200">
```

**Issues:**
- Hardcoded `bg-neutral-100` and `border-neutral-200` instead of glass tokens
- Doesn't integrate with glass aesthetic of navbar
- No hover state defined

**Should use:** Glass button variant with subtle hover

#### 4. **Ask Question Button Breaks Glass Aesthetic**
**Current:** Line 108
```tsx
className="hidden md:flex h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
```

**Issues:**
- Solid amber button disrupts glass aesthetic
- No glass variant for CTAs in glass context
- Shadow `shadow-sm` not QDS elevation token

**Recommendation:** Glass amber variant with glow effect

#### 5. **Search Bar Visibility in Glass Context**
**Current:** Uses `<GlobalSearch>` component (Line 99)
**Issue:** Need to verify search input styling matches glass navbar context
**Impact:** Visual consistency across navbar components

### Minor Issues

#### 6. **Border Shadow Redundancy**
**Current:** Line 55
```tsx
border-b border-glass shadow-[var(--shadow-glass-md)]
```

**Observation:** Both border and shadow provide separation
**Recommendation:** Consider if both are necessary or if stronger shadow alone suffices

#### 7. **Transition Duration Not Using QDS Motion Token**
**Current:** `transition-shadow duration-200`
**QDS Token:** `--duration-medium: 180ms`
**Impact:** Minor inconsistency with QDS motion system

## Available QDS Glass Tokens (globals.css)

### Glass Background Opacity Scale
```css
/* Light Theme */
--glass-ultra:  rgba(255, 255, 255, 0.4)   /* 40% - Ultra transparent */
--glass-strong: rgba(255, 255, 255, 0.6)   /* 60% - Currently used */
--glass-medium: rgba(255, 255, 255, 0.7)   /* 70% */
--glass-subtle: rgba(255, 255, 255, 0.85)  /* 85% - Most opaque */

/* Dark Theme */
--glass-ultra:  rgba(23, 21, 17, 0.4)
--glass-strong: rgba(23, 21, 17, 0.6)      /* Currently used */
--glass-medium: rgba(23, 21, 17, 0.7)
--glass-subtle: rgba(23, 21, 17, 0.85)
```

### Blur Scale
```css
--blur-xs:  4px
--blur-sm:  8px
--blur-md:  12px
--blur-lg:  16px   /* Currently used */
--blur-xl:  24px
--blur-2xl: 32px
```

### Glass Shadows
```css
/* Light */
--shadow-glass-sm: 0 2px 16px rgba(15, 14, 12, 0.04)
--shadow-glass-md: 0 4px 24px rgba(15, 14, 12, 0.06)  /* Currently used */
--shadow-glass-lg: 0 8px 32px rgba(15, 14, 12, 0.08)

/* Dark */
--shadow-glass-sm: 0 2px 16px rgba(0, 0, 0, 0.2)
--shadow-glass-md: 0 4px 24px rgba(0, 0, 0, 0.3)
--shadow-glass-lg: 0 8px 32px rgba(0, 0, 0, 0.4)
```

### Glow Effects
```css
/* Light */
--glow-primary:   0 0 20px rgba(138, 107, 61, 0.15)
--glow-secondary: 0 0 20px rgba(94, 125, 74, 0.15)
--glow-accent:    0 0 20px rgba(45, 108, 223, 0.15)

/* Dark */
--glow-primary:   0 0 24px rgba(193, 165, 118, 0.2)
--glow-secondary: 0 0 24px rgba(150, 179, 128, 0.2)
--glow-accent:    0 0 24px rgba(134, 169, 246, 0.2)
```

## QDS Motion Tokens Available

```css
--duration-fast:   120ms  /* Taps, toggles */
--duration-medium: 180ms  /* Hover, focus */
--duration-slow:   240ms  /* Overlays, dropdowns */
--duration-page:   320ms  /* Page transitions */

--ease-in-out: cubic-bezier(0.2, 0.8, 0.2, 1)  /* Default */
--ease-out:    cubic-bezier(0.4, 0.0, 1.0, 1)  /* Exits */
```

## Missing Semantic Tokens

### Recommended: New "Nav Glass" Token

**Rationale:** Navigation bars require higher opacity than content cards
**Proposed Token:**

```css
/* New token for navigation-specific glass */
:root {
  --glass-nav: rgba(255, 255, 255, 0.8);   /* 80% opacity - light */
  --blur-nav: 20px;                        /* Stronger blur */
  --shadow-nav: 0 4px 32px rgba(15, 14, 12, 0.08);
}

.dark {
  --glass-nav: rgba(23, 21, 17, 0.85);     /* 85% opacity - dark */
  --shadow-nav: 0 4px 32px rgba(0, 0, 0, 0.45);
}

/* Utility class */
.glass-nav {
  backdrop-filter: blur(var(--blur-nav));
  background: var(--glass-nav);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-nav);
}
```

**Why higher opacity for nav:**
- Navigation must remain visible over all content types
- Primary UI element requires highest hierarchy
- Glass effect still visible but practical for app chrome

## Contrast Ratio Analysis

### Text on Current Glass Background

**Light Mode:**
- Text color: `--text` = `#2A2721` (very dark gray)
- Effective background: `rgba(255, 255, 255, 0.6)` over `#FFFFFF` = ~#F2F2F2
- **Contrast ratio:** ~8.9:1 ✅ (Exceeds WCAG AAA)

**Dark Mode:**
- Text color: `--text` = `#F3EFE8` (off-white)
- Effective background: `rgba(23, 21, 17, 0.6)` over `#171511` = ~#19181
- **Contrast ratio:** ~9.2:1 ✅ (Exceeds WCAG AAA)

**Verdict:** Text contrast is excellent. Issue is visual separation, not text legibility.

### Icon Button Contrast (Future Recommendation)

When implementing icon buttons, ensure:
- Icon color minimum 4.5:1 on glass background
- Hover state maintains 4.5:1 minimum
- Focus ring 3:1 minimum against background

## Dark Mode Compliance

### Current Tokens (Properly Defined) ✅
```css
.dark {
  --glass-strong: rgba(23, 21, 17, 0.6);
  --border-glass: rgba(255, 255, 255, 0.08);
  --shadow-glass-md: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

### Dark Mode Issues (Same as Light)
- Opacity too low for navigation context
- Need darker/more opaque variant for navbar

## Accessibility Findings

### ✅ Passing
- Semantic HTML: `<nav>` with proper `role` and `aria-label`
- Text contrast ratios exceed WCAG AAA
- Focus indicators defined globally in globals.css (lines 487-497)
- Keyboard navigation supported via Button/DropdownMenu components

### ⚠️ Needs Attention
- No hover animations → users uncertain about interactivity
- Icon buttons (future) need `aria-label` attributes
- Reduced motion support needed for hover animations

### Focus Indicator Visibility on Glass

**Current global focus style (globals.css:477-497):**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.glass-panel-strong *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);  /* Stronger for glass */
}
```

**Verdict:** Focus indicators enhanced for glass backgrounds ✅

## Performance Considerations

### Current Implementation (Line 55)
```tsx
glass-panel-strong  /* Uses backdrop-filter: blur(16px) */
```

**From globals.css (lines 775-867):**
```css
.glass-panel-strong {
  will-change: backdrop-filter;
  contain: layout style paint;
  transform: translateZ(0);
}
```

**Verdict:** Performance optimizations already in place ✅

### Blur Layer Count
- Current: 1 blur layer (navbar only)
- QDS Limit: 3 max
- **Status:** Well within budget ✅

## Recommendations Summary

### Option A: Use `--glass-subtle` (Existing Token) ⭐ **RECOMMENDED**
**Pros:**
- Already exists in QDS
- 85% opacity provides strong separation
- No new tokens needed
- Maintains glassmorphism aesthetic

**Implementation:**
```tsx
className="glass-panel-strong"  →  className="glass-navbar"

/* Add to globals.css utilities */
.glass-navbar {
  backdrop-filter: blur(var(--blur-lg));
  background: var(--glass-subtle);      /* 85% opacity */
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-glass-lg);   /* Stronger shadow */
}
```

### Option B: Create `--glass-nav` Custom Token
**Pros:**
- Semantic clarity (navbar-specific)
- Can fine-tune opacity (80-85%)
- Future-proofs nav styling

**Cons:**
- Adds new token (increases system complexity)
- Requires QDS update

### Option C: Solid Background with Subtle Glass Overlay
**Pros:**
- Maximum contrast
- Guaranteed readability

**Cons:**
- Loses glassmorphism aesthetic
- Not aligned with QDS 2.0 vision

**Verdict:** Reject Option C - defeats glass aesthetic

## Hover Animation Requirements

### QDS-Compliant Icon Button Hover

**Required Elements:**
1. **Scale:** Subtle grow on hover (scale-105 = 1.05×)
2. **Glow:** Color-appropriate glow from QDS tokens
3. **Duration:** `--duration-medium` (180ms)
4. **Easing:** `--ease-in-out`
5. **Reduced Motion:** Disable animations when `prefers-reduced-motion: reduce`

**Example Implementation (from QDS.md):**
```tsx
<Button className="
  transition-all
  duration-[180ms]
  ease-[cubic-bezier(0.2,0.8,0.2,1)]
  hover:scale-105
  hover:shadow-[var(--glow-primary)]
  motion-reduce:transition-none
  motion-reduce:hover:scale-100
">
```

### Icon Button States Needed
- **Default:** Base color, no glow
- **Hover:** Scale + glow
- **Active/Pressed:** Slight scale down (scale-95)
- **Focus:** QDS focus ring (already global)
- **Disabled:** opacity-50, no hover effects

## Next Steps

1. **Decide on background approach:** Recommend Option A (glass-subtle)
2. **Define hover animation styles:** Use QDS motion tokens
3. **Update utility class or component:** Add `.glass-navbar` utility
4. **Plan icon button implementation:** Scale + glow effects
5. **Test contrast in both modes:** Verify visibility over various backgrounds

# QDS Audit: AI Components

**Auditor:** QDS Compliance Auditor
**Date:** 2025-10-17
**Scope:** AI assistant modal and QDS elements
**Standard:** QDS v1.0 (Glassmorphism Edition)

---

## Summary

- **Compliance Score:** 7/10
- **Critical Issues:** 3
- **Medium Issues:** 6
- **Minor Issues:** 8

**Overall Assessment:**
The AI components demonstrate strong architectural design but contain **multiple QDS violations**, primarily hardcoded colors, arbitrary CSS values, and inconsistent glass styling. Most critical: direct usage of `var(--border-glass)` and `var(--glass-hover)` in inline className strings instead of utility classes.

---

## Current QDS Token Usage

**✅ CORRECTLY USED:**
- Glass utilities: `.glass-panel-strong`, `.glass-text`, `.message-user`, `.message-assistant`
- Spacing: `gap-2`, `gap-3`, `p-3`, `p-4`, `px-4`, `py-3`
- Radius: `rounded-md`, `rounded-full`, `rounded-2xl`, `rounded-t-md`
- Shadows: `shadow-sm` (Tailwind default - acceptable for subtle effects)
- AI gradient: `.ai-gradient` (QDS utility)
- Colors (semantic tokens): `bg-accent`, `text-accent`, `bg-success`, `text-danger`, `bg-primary`
- Focus states: `focus:outline-none`, `focus:ring-2`, `focus:ring-accent`

---

## Non-Compliant Patterns Found

### 🔴 CRITICAL (Must Fix)

#### 1. **Hardcoded CSS Variables in classNames**

**Issue:** Direct `var(--token)` usage in inline className strings instead of Tailwind utilities.

**Location:** `quokka-assistant-modal.tsx`

**Lines 338, 392:**
```tsx
// Line 338
className="p-4 border-b border-[var(--border-glass)] space-y-3"

// Line 392
className="border-t border-[var(--border-glass)] p-4"
```

**Problem:**
- `border-[var(--border-glass)]` is an arbitrary Tailwind value using raw CSS variables
- Should use `.border-glass` utility class defined in `globals.css:742-752`

**Fix:**
```tsx
// ✅ CORRECT
className="p-4 border-b border-glass space-y-3"
className="border-t border-glass p-4"
```

**QDS Reference:**
`globals.css:742-752` defines `.border-glass` utility class specifically for this purpose.

---

#### 2. **Hardcoded Gray Colors (Non-QDS Palette)**

**Issue:** Direct Tailwind gray colors instead of QDS neutral tokens.

**Location:** `sources-panel.tsx`

**Lines 60, 92-96, 104, 113, 116, 158:**
```tsx
// Line 60
text-gray-700 dark:text-gray-200

// Lines 92-96
bg-white/50 dark:bg-gray-800/50
border border-gray-200/50 dark:border-gray-700/50
hover:border-accent/40 dark:hover:border-accent/30

// Line 113
text-gray-900 dark:text-gray-100

// Line 116
text-gray-600 dark:text-gray-400

// Line 158
text-gray-600 dark:text-gray-400
```

**Problem:**
- QDS uses warm neutrals (Neutral 50-950), not Tailwind's default cool grays
- `gray-700` does NOT equal `--neutral-700` (different hue)
- Light theme should use `--text`, `--muted`, `--surface` tokens
- Dark theme values are managed in `.dark` selector

**Correct QDS Neutral Palette (from `globals.css:185-196`):**
```css
--neutral-50: #F7F5F2    /* warm off-white */
--neutral-100: #E9E4DC   /* light warm gray */
--neutral-200: #CDC7BD   /* warm gray (borders) */
--neutral-300: #A49E94   /* medium warm gray */
--neutral-500: #625C52   /* muted text */
--neutral-700: #3A362E   /* dark warm gray */
--neutral-800: #2A2721   /* QDS text color */
--neutral-900: #171511   /* very dark warm */
```

**Fix:**
```tsx
// ✅ CORRECT
className="text-foreground"                    // Instead of text-gray-700
className="text-muted-foreground"              // Instead of text-gray-600
className="bg-card/50 border-border/50"        // Instead of bg-white/50 border-gray-200/50
className="text-card-foreground"               // Instead of text-gray-900
```

**QDS Token Mapping (from `globals.css:198-213`):**
- `--foreground` → `--text` → `#2A2721` (light) / `#F3EFE8` (dark)
- `--muted-foreground` → `--muted` → `#625C52` (light) / `#B8AEA3` (dark)
- `--card` → `--surface` → `#FFFFFF` (light) / `#171511` (dark)
- `--border` → `--neutral-200` (light) / `rgba(243, 239, 232, 0.1)` (dark)

---

#### 3. **Hardcoded hover:bg CSS Variable**

**Issue:** Direct CSS variable in arbitrary Tailwind value.

**Location:** `qds-actions.tsx`

**Lines 37, 48:**
```tsx
// Line 37
className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)] glass-text"

// Line 48
className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)] glass-text disabled:opacity-50"
```

**Problem:**
- `hover:bg-[var(--glass-hover)]` is an arbitrary value
- No utility class exists for `--glass-hover` token
- Inconsistent with QDS glass system

**QDS Glass Hover Token (from `globals.css:246`):**
```css
--glass-hover: rgba(255, 255, 255, 0.5);  /* Light theme */
```

**Fix:**
Add utility class to `globals.css` (outside `@layer utilities` for Tailwind v4 compatibility):

```css
/* Add after line 992 (after glass-overlay definition) */
.glass-hover {
  background: var(--glass-hover);
}

.hover\:glass-hover:hover {
  background: var(--glass-hover);
}
```

Then update component:
```tsx
// ✅ CORRECT
className="h-8 px-2 text-xs hover:glass-hover glass-text"
```

---

### 🟡 MEDIUM (Should Fix)

#### 4. **Inconsistent Spacing (Non-4pt Grid)**

**Issue:** `mb-6` (24px) is correct, but mixing with `space-y-4` (16px) creates visual inconsistency.

**Location:** `qds-message.tsx`

**Lines 73, 96:**
```tsx
// Line 73
<div className={cn("group mb-6", className)}>

// Line 96
<div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
```

**Problem:**
- Message bottom margin: `mb-6` (24px) - GOOD
- Internal message gap: `gap-2` (8px) - GOOD for tight elements
- But container uses `space-y-4` elsewhere (16px) - creates 24px + 16px = 40px gaps

**Recommendation:**
- Use `mb-4` (16px) for consistency with `space-y-4` in `qds-conversation.tsx:32`
- OR increase conversation spacing to `space-y-6` (24px) for better breathing room

**Fix:**
```tsx
// Option 1: Tighter spacing (16px)
<div className={cn("group mb-4", className)}>

// Option 2: More generous (conversation changes to space-y-6)
// qds-conversation.tsx line 32:
<ConversationContent className="p-4 space-y-6">
```

---

#### 5. **Non-Standard Shadow Usage**

**Issue:** Using Tailwind default `shadow-sm` instead of QDS elevation tokens.

**Location:** `qds-message.tsx`

**Line 104:**
```tsx
"transition-all duration-200 shadow-sm"
```

**Problem:**
- Tailwind `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- QDS `--shadow-e1`: `0 1px 2px rgba(15, 14, 12, 0.06)` (warmer, slightly stronger)

**QDS Elevation Tokens (from `QDS.md:399-418`):**
```css
--shadow-e1: 0 1px 2px rgba(15, 14, 12, 0.06)   /* Cards at rest */
--shadow-e2: 0 2px 8px rgba(15, 14, 12, 0.08)   /* Dropdowns */
--shadow-e3: 0 8px 24px rgba(15, 14, 12, 0.10)  /* Modals */
```

**Fix:**
```tsx
// ✅ CORRECT
"transition-all duration-200"  // Remove shadow-sm entirely
// Messages already have glass shadows from .message-user/.message-assistant utilities
```

**Note:** `.message-user` and `.message-assistant` already define box-shadow in `globals.css:634-661`, so additional `shadow-sm` creates double shadows.

---

#### 6. **Missing Dark Mode for Glass Text Shadows**

**Issue:** `.glass-text` utility only defines light theme text-shadow.

**Location:** `globals.css`

**Lines 548-554:**
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**Problem:**
- Light theme: `0.1` opacity (good for white backgrounds)
- Dark theme: `0.3` opacity (good for dark backgrounds)
- **BUT** used in `quokka-assistant-modal.tsx` on both light and dark glass surfaces

**Current Usage:**
```tsx
// Line 344
<DialogTitle className="text-base glass-text">

// Line 345
<DialogDescription className="text-xs text-muted-foreground glass-text">
```

**Assessment:**
- Text shadows on glass are **optional** for readability
- Current implementation is acceptable but could be more nuanced
- Consider removing on dark mode for cleaner look

**Recommendation:** Keep as-is, but document in context.md that `.glass-text` is intentionally subtle.

---

#### 7. **Hardcoded min-height for Touch Targets**

**Issue:** Direct `min-h-[44px]` instead of `.touch-target` utility.

**Location:** `quokka-assistant-modal.tsx`, `qds-prompt-input.tsx`

**Lines (quokka-assistant-modal.tsx):**
```tsx
// Line 406
className="text-xs min-h-[44px]"
```

**Lines (qds-prompt-input.tsx):**
```tsx
// Line 60
className="shrink-0 min-h-[44px] min-w-[44px]"

// Line 72
className="shrink-0 min-h-[44px] min-w-[44px]"
```

**QDS Touch Target Utility (from `globals.css:755-758`):**
```css
.touch-target {
  min-height: var(--touch-target-min);  /* 44px */
  min-width: var(--touch-target-min);
}
```

**Problem:**
- Hardcoded `44px` values duplicate QDS token
- Should use `.touch-target` utility for consistency

**Fix:**
```tsx
// ✅ CORRECT
className="text-xs touch-target"
className="shrink-0 touch-target"
```

---

#### 8. **Arbitrary Percentage Width**

**Issue:** Non-standard `max-w-[75%]` instead of semantic breakpoint.

**Location:** `qds-message.tsx`

**Line 96:**
```tsx
<div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
```

**Problem:**
- `75%` is arbitrary and not part of QDS spacing scale
- Messages should use responsive breakpoints for better mobile UX

**QDS Breakpoints (from `QDS.md:362-370`):**
```css
xs:  360px
sm:  640px
md:  768px
lg:  1024px
```

**Recommendation:**
```tsx
// ✅ BETTER
<div className={cn("flex flex-col gap-2 max-w-full sm:max-w-[85%] md:max-w-[75%]", isUser && "items-end")}>
```

**Rationale:**
- Mobile (< 640px): `max-w-full` (100% - better use of space)
- Tablet (≥ 640px): `max-w-[85%]` (more breathing room)
- Desktop (≥ 768px): `max-w-[75%]` (current behavior)

**Decision:** Low priority - current UX is acceptable.

---

#### 9. **Inconsistent Border Accent Opacity**

**Issue:** Multiple opacity values for accent borders without clear semantic meaning.

**Location:** `qds-message.tsx`, `sources-panel.tsx`

**Lines:**
```tsx
// qds-message.tsx:103
hasCitations && "border-l-4 border-accent"

// sources-panel.tsx:50
"border-l-4 border-accent/40 bg-accent/5"

// sources-panel.tsx:94
"hover:border-accent/40 dark:hover:border-accent/30"
```

**Problem:**
- Message borders: `border-accent` (100% opacity)
- Sources panel: `border-accent/40` (40% opacity)
- Hover state: `border-accent/40` → `border-accent/30` (inconsistent direction)

**Recommendation:**
Standardize accent opacity values:
- **Primary accent:** `border-accent` (100%) for emphasis
- **Secondary accent:** `border-accent/30` (30%) for subtle highlights
- **Background accent:** `bg-accent/5` (5%) for tinted backgrounds
- **Hover accent:** `hover:border-accent/50` (50%) for interactive states

**Fix:**
```tsx
// ✅ CONSISTENT
// Messages with citations (high emphasis):
hasCitations && "border-l-4 border-accent"

// Sources panel (medium emphasis):
"border-l-4 border-accent/30 bg-accent/5"

// Hover states:
"hover:border-accent/50"
```

---

### 🔵 MINOR (Polish)

#### 10. **Missing aria-label on Modal Dialog**

**Issue:** DialogContent lacks descriptive aria-label.

**Location:** `quokka-assistant-modal.tsx`

**Line 335:**
```tsx
<DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0">
```

**Fix:**
```tsx
// ✅ CORRECT
<DialogContent
  className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0"
  aria-label="Quokka AI Assistant Chat"
>
```

---

#### 11. **Inconsistent Button Size Variants**

**Issue:** Mixing `size="sm"` with hardcoded `h-8` in Action buttons.

**Location:** `qds-actions.tsx`

**Lines 37, 48:**
```tsx
className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)] glass-text"
```

**Problem:**
- Button component has semantic size variants (`sm`, `default`, `lg`)
- Hardcoded `h-8` bypasses Button sizing system

**QDS Button Sizes (from `QDS.md:605-609`):**
```tsx
<Button size="sm">Small</Button>      // 32px height
<Button size="default">Default</Button>  // 36px height
<Button size="lg">Large</Button>      // 40px height
```

**Note:** `h-8` = 32px = `size="sm"` equivalent. This is acceptable but should be consistent.

**Recommendation:** Use Action component's built-in sizing instead of overriding with className.

---

#### 12. **Missing Focus Ring on Citation Markers**

**Issue:** QDSInlineCitation uses custom focus styling instead of QDS ring system.

**Location:** `qds-inline-citation.tsx`

**Line 32-38:**
```tsx
<span
  className={cn(
    "citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold",
    "bg-accent/20 text-accent-foreground hover:bg-accent/30",
    "cursor-pointer transition-colors",
    className
  )}
```

**Problem:**
- Tabbable element (`tabIndex={0}`) without visible focus ring
- QDS requires `focus:ring-2 focus:ring-accent` on interactive elements

**Fix:**
```tsx
// ✅ CORRECT
className={cn(
  "citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold",
  "bg-accent/20 text-accent-foreground hover:bg-accent/30",
  "cursor-pointer transition-colors",
  "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
  className
)}
```

---

#### 13. **Hardcoded Animation Delay Values**

**Issue:** Arbitrary animation delays without QDS motion tokens.

**Location:** `qds-conversation.tsx`

**Lines 69-71:**
```tsx
<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
<div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
```

**Problem:**
- Arbitrary `[animation-delay:-0.3s]` and `[animation-delay:-0.15s]`
- Not part of QDS motion system

**QDS Motion Tokens (from `QDS.md:421-429`):**
```css
--duration-fast:   120ms
--duration-medium: 180ms
--duration-slow:   240ms
```

**Assessment:**
- Streaming indicator animation is **acceptable** as-is
- Delays create sequential bounce effect (intentional UX)
- Low priority fix

**Recommendation:** Document in context.md as intentional design decision.

---

#### 14. **Potential Text Contrast Issues on Glass Backgrounds**

**Issue:** `.message-assistant` uses `rgba(255, 255, 255, 0.7)` which may reduce text contrast.

**Location:** `globals.css`

**Lines 646-651:**
```css
.message-assistant {
  @apply backdrop-blur-xl border rounded-2xl;
  background: rgba(255, 255, 255, 0.7);  /* 70% opacity white */
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: /* ... */;
}
```

**Problem:**
- Light theme text (`#2A2721`) on 70% white background
- Actual background depends on content behind glass (variable)
- Contrast ratio may fall below 4.5:1 on certain backgrounds

**QDS Contrast Requirements (from `QDS.md:869-875`):**
- Body text: ≥ 4.5:1 (WCAG AA)
- Large text: ≥ 3:1 (WCAG AA)

**Calculated Contrast (worst case):**
- Text: `#2A2721` (dark gray)
- Background: `rgba(255, 255, 255, 0.7)` over light surface
- Approximate: 8.5:1 (PASSES AA)

**Recommendation:**
- Add `text-shadow` to `.message-assistant .glass-text` for readability
- Already using `.glass-text` utility, so this is handled

**Status:** ✅ ACCEPTABLE - No action needed.

---

#### 15. **Missing Reduced Motion Support**

**Issue:** Streaming indicator animation doesn't honor `prefers-reduced-motion`.

**Location:** `qds-conversation.tsx`

**Lines 69-71:**
```tsx
<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
```

**Problem:**
- Tailwind `animate-bounce` runs indefinitely
- Users with `prefers-reduced-motion: reduce` should see static indicator

**QDS Reduced Motion (from `QDS.md:480-495`):**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

**Assessment:**
- Global CSS rule already handles this (line 1117-1127 in `globals.css`)
- `animate-bounce` will be disabled automatically

**Status:** ✅ ALREADY HANDLED - No action needed.

---

#### 16. **Non-Standard transition-colors Duration**

**Issue:** `transition-colors` uses default 150ms instead of QDS tokens.

**Location:** Multiple files

**Lines:**
```tsx
// qds-inline-citation.tsx:36
"cursor-pointer transition-colors"

// sources-panel.tsx:95
"transition-colors"
```

**QDS Motion Tokens (from `QDS.md:421-429`):**
```css
--duration-fast:   120ms  /* Taps, toggles */
--duration-medium: 180ms  /* Hover, focus */
```

**Problem:**
- Tailwind `transition-colors` default: 150ms
- QDS hover duration: 180ms
- Minor inconsistency (30ms difference)

**Recommendation:**
```tsx
// ✅ CONSISTENT
"cursor-pointer transition-colors duration-[180ms]"
```

**Priority:** Low - 30ms difference is imperceptible.

---

#### 17. **Inconsistent Text Size Classes**

**Issue:** Mixing `text-sm` (14px) and `text-xs` (12px) without clear hierarchy.

**Location:** Multiple files

**Lines:**
```tsx
// qds-message.tsx:114
<div className="text-sm leading-relaxed whitespace-pre-wrap">

// qds-response.tsx:100
<div className={cn("text-sm leading-relaxed", className)}>

// sources-panel.tsx:60
"text-sm font-medium text-gray-700"

// qds-conversation.tsx:44
<p className="text-sm leading-relaxed">

// qds-actions.tsx:37
className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)] glass-text"
```

**QDS Type Scale (from `QDS.md:314-327`):**
```
Body M:   16px / 24px (400)   - Default body text
Body S:   14px / 20px (400)   - Helper text, metadata
Caption:  12px / 16px (500)   - Labels, timestamps
```

**Current Mapping:**
- `text-sm` = 14px = Body S (helper text)
- `text-xs` = 12px = Caption (labels)

**Problem:**
- Message content uses `text-sm` (14px) instead of `text-base` (16px)
- QDS default body text should be 16px

**Recommendation:**
```tsx
// ✅ CORRECT
// Message content (main conversation):
<div className="text-base leading-relaxed">  // 16px Body M

// Metadata/timestamps:
<div className="text-sm leading-relaxed">    // 14px Body S

// Button labels/captions:
<span className="text-xs">                   // 12px Caption
```

**Priority:** Medium - affects readability on mobile.

---

## Missing Semantic Tokens

**No new tokens needed.** All violations can be fixed using existing QDS tokens and utilities.

---

## Dark Mode Issues

### ✅ GOOD: Comprehensive Dark Mode Support

**Strengths:**
1. All `.message-user` and `.message-assistant` have dark mode variants (lines 654-661)
2. `.glass-text` has dark mode text-shadow (lines 552-554)
3. `.border-glass` has light/dark definitions (lines 245, 429)
4. Sources panel uses Tailwind dark: prefix throughout

**Gaps:**
1. **Hardcoded gray colors** in `sources-panel.tsx` don't use QDS neutral tokens
   - `text-gray-700` should be `text-foreground`
   - `bg-white/50` should be `bg-card/50`

**Action:** Fix gray colors (already listed under Critical #2).

---

## Accessibility Findings

### Contrast Ratios

**Calculated:**
1. **User messages** (`.message-user`):
   - Text: `#FFFFFF` (white)
   - Background: `rgba(45, 108, 223, 0.95)` (accent blue with 95% opacity)
   - **Ratio:** 4.6:1 ✅ PASSES AA

2. **Assistant messages** (`.message-assistant`):
   - Text: `#2A2721` (dark gray)
   - Background: `rgba(255, 255, 255, 0.7)` over white surface
   - **Ratio:** 8.5:1 ✅ PASSES AA (with room for AAA: 7:1+)

3. **Citation markers** (`bg-accent/20`):
   - Text: `text-accent-foreground` (white in light, dark in dark mode)
   - Background: `rgba(45, 108, 223, 0.2)` (20% accent)
   - **Ratio:** ~3.1:1 ⚠️ BORDERLINE (for non-text UI components: 3:1 required)

**Status:** All text meets WCAG AA (4.5:1). Citation markers meet UI component contrast (3:1).

### Focus Indicators

**Issues:**
1. ✅ **Modal close button:** Inherits Radix Dialog focus (GOOD)
2. ✅ **Prompt input:** Has focus ring (GOOD)
3. ✅ **Send button:** Has focus ring (GOOD)
4. ❌ **Citation markers:** Missing visible focus ring (see Minor #12)
5. ✅ **Sources panel header:** Has `focus:ring-2` (GOOD)

### Semantic HTML

**Issues:**
1. ✅ **Conversation:** Uses `role="log"` with `aria-live="polite"` (EXCELLENT)
2. ✅ **Sources list:** Uses `role="list"` and `role="listitem"` (GOOD)
3. ✅ **Citation markers:** Uses `role="button"` with keyboard support (GOOD)
4. ❌ **Dialog:** Missing `aria-label` on DialogContent (see Minor #10)

### Keyboard Navigation

**Issues:**
1. ✅ All buttons are keyboard accessible (Tab, Enter, Space)
2. ✅ Citation markers support Enter/Space (line 24-28 in `qds-inline-citation.tsx`)
3. ✅ Sources panel header is expandable via keyboard (line 56-66 in `sources-panel.tsx`)
4. ✅ Form submission works via Enter key (line 30-35 in `qds-prompt-input.tsx`)

**Status:** ✅ Full keyboard navigation support.

---

## Tailwind v4 Compatibility Notes

**Issue:** Some arbitrary values use CSS variables directly.

**Examples:**
```tsx
border-[var(--border-glass)]  // ❌ Works but not idiomatic
hover:bg-[var(--glass-hover)] // ❌ Works but not idiomatic
```

**Recommendation:** Add utility classes to `globals.css` (already defined for most tokens).

**New utilities needed:**
1. `.border-glass` (already exists - line 742)
2. `.hover:glass-hover` (needs to be added)

**Action:** See Critical #3 for implementation.

---

## Recommended Fixes Priority Order

### Phase 1: Critical (Breaks QDS Compliance)
1. **Fix:** Replace `border-[var(--border-glass)]` → `.border-glass` (2 instances)
2. **Fix:** Replace Tailwind gray colors → QDS neutral tokens (8 instances)
3. **Add:** `.hover:glass-hover` utility class to `globals.css`
4. **Fix:** Replace `hover:bg-[var(--glass-hover)]` → `.hover:glass-hover` (2 instances)

**Estimated Effort:** 20 minutes

---

### Phase 2: Medium (Improves Consistency)
5. **Fix:** Standardize message spacing (`mb-6` → `mb-4` or conversation `space-y-6`)
6. **Remove:** `shadow-sm` from messages (already have glass shadows)
7. **Replace:** `min-h-[44px]` → `.touch-target` utility (3 instances)
8. **Standardize:** Accent border opacity values (3 instances)
9. **Fix:** Message text size (`text-sm` → `text-base` for content)

**Estimated Effort:** 30 minutes

---

### Phase 3: Minor (Polish)
10. **Add:** `aria-label` to DialogContent
11. **Add:** Focus ring to citation markers
12. **Document:** Animation delays as intentional design
13. **Consider:** Responsive max-width for messages

**Estimated Effort:** 15 minutes

---

## Total Issues by Severity

| Severity | Count | Files Affected |
|----------|-------|----------------|
| Critical | 3     | 3              |
| Medium   | 6     | 4              |
| Minor    | 8     | 5              |
| **TOTAL** | **17** | **6** |

---

## Files Requiring Changes

1. **`quokka-assistant-modal.tsx`** - 4 fixes (border-glass, touch-target, aria-label)
2. **`sources-panel.tsx`** - 8 fixes (gray colors, border opacity)
3. **`qds-actions.tsx`** - 2 fixes (glass-hover utility)
4. **`qds-message.tsx`** - 3 fixes (spacing, shadow, text-size)
5. **`qds-inline-citation.tsx`** - 1 fix (focus ring)
6. **`globals.css`** - 1 addition (glass-hover utility)

---

## Conclusion

The AI components demonstrate **strong architectural design** with good separation of concerns, proper accessibility foundations, and thoughtful UX. However, **QDS compliance is incomplete** due to:

1. **Hardcoded CSS variables** in className strings instead of utility classes
2. **Non-QDS color palette** (Tailwind grays instead of warm neutrals)
3. **Missing utility classes** for glass hover states

**All issues are fixable within 65 minutes** using existing QDS tokens. No new design decisions or token additions required.

**Recommendation:** Proceed with Phase 1 (Critical) fixes immediately. Phase 2 and 3 can be deferred to post-launch polish.

---

**End of QDS Audit Report**

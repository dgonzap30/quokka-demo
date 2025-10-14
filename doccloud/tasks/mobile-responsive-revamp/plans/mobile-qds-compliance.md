# Mobile QDS Compliance Implementation Plan

**Created:** 2025-10-14
**Status:** Planning
**Dependencies:** mobile-qds-audit.md

---

## Overview

This plan addresses QDS v1.0 compliance issues identified in the mobile audit, focusing on:
1. Mobile-specific token definitions
2. Touch target compliance (WCAG 2.2 AA)
3. Responsive spacing patterns
4. Glass effect optimization
5. Arbitrary value elimination

**Goal:** Achieve 9.5/10 QDS compliance score on mobile (360px-767px)

---

## Phase 1: QDS Mobile Token System

### Step 1.1: Define Mobile Tokens in globals.css

**File:** `app/globals.css`

**Add after line 349 (before .dark theme):**

```css
/* ========================================
   MOBILE-SPECIFIC QDS TOKENS
   ======================================== */

:root {
  /* Touch Targets (WCAG 2.2 AA) */
  --touch-target-min: 44px;           /* 2.5.8 Target Size AA */
  --touch-target-comfortable: 48px;   /* Preferred size */
  --touch-target-generous: 56px;      /* Large touch areas */

  /* Mobile Layout */
  --mobile-nav-height: 56px;          /* 14 * 4pt */
  --mobile-header-offset: 104px;      /* 26 * 4pt (nav + context bar) */
  --mobile-sheet-width: 280px;        /* 70 * 4pt */
  --mobile-drawer-width: 320px;       /* 80 * 4pt */

  /* Mobile Typography */
  --text-mobile-min: 14px;            /* Minimum readable size */
  --text-mobile-base: 16px;           /* Body text baseline */
  --text-mobile-meta: 14px;           /* Metadata (not 12px) */
  --text-mobile-heading-min: 24px;    /* H3 minimum on mobile */

  /* Mobile Spacing */
  --mobile-padding: 16px;             /* 4 * 4pt */
  --mobile-padding-lg: 24px;          /* 6 * 4pt */
  --mobile-gap: 12px;                 /* 3 * 4pt (touch-friendly) */
  --mobile-gap-lg: 16px;              /* 4 * 4pt */

  /* Mobile Glass Performance */
  --blur-mobile-sm: 8px;              /* Lightweight blur */
  --blur-mobile-md: 12px;             /* Default mobile blur */
  --blur-mobile-lg: 16px;             /* Maximum mobile blur */

  /* Safe Area Insets (iOS notch, Android gesture nav) */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);

  /* Mobile Grid Breakpoints (for minmax() usage) */
  --grid-mobile-sidebar: 280px;       /* 70 * 4pt */
  --grid-mobile-sidebar-compact: 56px; /* 14 * 4pt (icon-only) */
  --grid-tablet-sidebar: 320px;       /* 80 * 4pt */
}

/* Dark mode inherits mobile tokens (no override needed) */
```

---

### Step 1.2: Add Mobile Utility Classes

**File:** `app/globals.css`

**Add after line 684 (inside @layer utilities):**

```css
@layer utilities {
  /* ... existing utilities ... */

  /* ===== Mobile Touch Target Utilities ===== */

  /* Minimum WCAG 2.2 AA compliant touch target */
  .touch-target {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
  }

  /* Comfortable touch target (recommended) */
  .touch-target-comfortable {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
  }

  /* Generous touch target (for primary CTAs) */
  .touch-target-generous {
    min-height: var(--touch-target-generous);
    min-width: var(--touch-target-generous);
  }

  /* Apply to all buttons on mobile */
  @media (max-width: 767px) {
    button, a[role="button"] {
      min-height: var(--touch-target-min);
    }
  }

  /* ===== Mobile Typography Utilities ===== */

  /* Safe mobile text sizes (prevent <14px on mobile) */
  .text-mobile-safe {
    @apply text-sm md:text-xs;  /* 14px mobile, 12px desktop */
  }

  .text-mobile-min {
    font-size: var(--text-mobile-min);
    line-height: 1.5;
  }

  /* Mobile heading scale */
  .heading-mobile-1 {
    @apply text-3xl md:text-4xl lg:text-5xl;  /* 30px → 36px → 48px */
  }

  .heading-mobile-2 {
    @apply text-2xl md:text-3xl lg:text-4xl;  /* 24px → 30px → 36px */
  }

  .heading-mobile-3 {
    @apply text-xl md:text-2xl;               /* 20px → 24px */
  }

  /* ===== Mobile Spacing Utilities ===== */

  /* Mobile-first padding */
  .p-mobile {
    padding: var(--mobile-padding);
  }

  .p-mobile-lg {
    padding: var(--mobile-padding-lg);
  }

  /* Mobile-friendly gaps */
  .gap-mobile {
    gap: var(--mobile-gap);
  }

  .gap-mobile-lg {
    gap: var(--mobile-gap-lg);
  }

  /* ===== Mobile Glass Utilities ===== */

  /* Performance-optimized glass for mobile */
  .glass-mobile {
    backdrop-filter: blur(var(--blur-mobile-md));
    background: var(--glass-medium);
    border: 1px solid var(--border-glass);
    box-shadow: var(--shadow-glass-md);
  }

  /* Desktop-only stronger glass */
  @media (min-width: 768px) {
    .glass-mobile-to-strong {
      backdrop-filter: blur(var(--blur-lg));
      background: var(--glass-strong);
    }
  }

  /* ===== Safe Area Utilities ===== */

  /* Top safe area (for fixed headers) */
  .pt-safe {
    padding-top: max(var(--safe-area-top), 1rem);
  }

  /* Bottom safe area (for fixed footers) */
  .pb-safe {
    padding-bottom: max(var(--safe-area-bottom), 1rem);
  }

  /* Inset for fixed elements */
  .inset-safe {
    top: var(--safe-area-top);
    right: var(--safe-area-right);
    bottom: var(--safe-area-bottom);
    left: var(--safe-area-left);
  }

  /* ===== Mobile Layout Utilities ===== */

  /* Offset for fixed navbar */
  .mt-mobile-nav {
    margin-top: var(--mobile-nav-height);
  }

  .pt-mobile-header {
    padding-top: var(--mobile-header-offset);
  }

  /* Mobile sheet/drawer widths */
  .w-mobile-sheet {
    width: var(--mobile-sheet-width);
  }

  .w-mobile-drawer {
    width: var(--mobile-drawer-width);
  }

  /* ===== Mobile Grid Utilities ===== */

  /* Responsive grid with mobile-first columns */
  .grid-mobile-1 {
    @apply grid grid-cols-1;
  }

  .grid-mobile-2 {
    @apply grid grid-cols-1 sm:grid-cols-2;
  }

  .grid-mobile-3 {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
  }

  .grid-mobile-4 {
    @apply grid grid-cols-2 md:grid-cols-4;
  }

  /* Stack on mobile, horizontal on desktop */
  .flex-mobile-stack {
    @apply flex flex-col md:flex-row;
  }
}
```

---

## Phase 2: Touch Target Compliance

### Step 2.1: Fix Button Component

**File:** `components/ui/button.tsx`

**Current (Lines 29-34):**
```tsx
size: {
  default: "h-10 px-4 py-2 has-[>svg]:px-3",      // 40px ❌
  sm: "h-9 rounded-md gap-1.5 px-3",              // 36px ❌
  lg: "h-11 rounded-md px-6",                     // 44px ✅
  icon: "size-10",                                 // 40px ❌
}
```

**Replace with:**
```tsx
size: {
  default: "h-11 px-4 py-2 has-[>svg]:px-3",      // 44px ✅ WCAG AA
  sm: "h-10 rounded-md gap-1.5 px-3",              // 40px (desktop only)
  lg: "h-12 rounded-md px-6",                      // 48px ✅ Comfortable
  icon: "size-11",                                 // 44px ✅ WCAG AA
}
```

**Impact:** All buttons meet 44px minimum touch target

**Testing:**
```bash
# Check button heights in browser DevTools
document.querySelectorAll('button').forEach(b => {
  const height = b.getBoundingClientRect().height;
  if (height < 44) console.warn('Button below 44px:', b, height);
});
```

---

### Step 2.2: Fix GlobalNavBar Icon Buttons

**File:** `components/layout/global-nav-bar.tsx`

**Current (Lines 142-143):**
```tsx
className={cn(
  "min-h-[44px] min-w-[44px] h-11 w-11",  // Redundant + arbitrary
  // ...
)}
```

**Replace with:**
```tsx
className={cn(
  "touch-target",  // Use utility class
  "hover:bg-transparent hover:scale-[1.08]",
  // ...
)}
```

**Apply to all icon buttons:**
- Ask Question button (Line 142)
- AI Assistant button (Line 174)
- Support button (Line 211)
- Settings button (Line 234)
- User menu button (Line 272)

---

### Step 2.3: Add Mobile Touch Target Override

**File:** `app/globals.css`

**Add after Step 1.2 utilities:**

```css
/* Global touch target enforcement on mobile */
@media (max-width: 767px) {
  /* Ensure all interactive elements meet 44px minimum */
  button:not(.touch-target-ignore),
  a[role="button"]:not(.touch-target-ignore),
  input[type="button"]:not(.touch-target-ignore),
  input[type="submit"]:not(.touch-target-ignore),
  [role="button"]:not(.touch-target-ignore) {
    min-height: var(--touch-target-min);
    min-width: fit-content;
    padding-left: max(var(--mobile-padding), 16px);
    padding-right: max(var(--mobile-padding), 16px);
  }

  /* Exception for icon-only buttons (already sized) */
  button.size-icon,
  button[size="icon"] {
    min-width: var(--touch-target-min);
  }
}
```

---

## Phase 3: Responsive Spacing Fixes

### Step 3.1: Fix Dashboard Grid Layouts

**File:** `app/dashboard/page.tsx`

#### Fix 1: Stats Grid (Line 206)

**Current:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

**Replace with:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
  {/* 1 col mobile, 2 cols small mobile, 4 cols desktop */}
  {/* 16px gap mobile, 24px desktop */}
```

**Reasoning:** 2 columns on 360px mobile is cramped, 1 column is clearer

#### Fix 2: Course Grid (Line 151)

**Current:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

**Replace with:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Increase gap from 16px to 24px for better breathing room */}
```

#### Fix 3: Hero Padding (Line 133)

**Current:**
```tsx
<main className="min-h-screen p-4 md:p-6">
```

**Replace with:**
```tsx
<main className="min-h-screen p-mobile md:p-6">
  {/* Use token: 16px mobile, 24px desktop */}
```

---

### Step 3.2: Fix EnhancedCourseCard

**File:** `components/dashboard/enhanced-course-card.tsx`

#### Fix 1: Card Height (Line 99)

**Current:**
```tsx
<Card className="min-h-[220px] flex flex-col">
```

**Replace with:**
```tsx
<Card className="min-h-56 flex flex-col">  {/* 224px = 56 * 4pt */}
```

#### Fix 2: Stats Grid Gap (Line 139)

**Current:**
```tsx
<div className="grid grid-cols-2 gap-2">
```

**Replace with:**
```tsx
<div className="grid grid-cols-2 gap-3 md:gap-2">
  {/* 12px gap mobile (touch-friendly), 8px desktop */}
```

#### Fix 3: Responsive Text (Line 144)

**Current:**
```tsx
<p className="text-xs text-muted-foreground">
```

**Replace with:**
```tsx
<p className="text-mobile-safe text-muted-foreground">
  {/* 14px mobile, 12px desktop */}
```

---

### Step 3.3: Fix ThreadCard

**File:** `components/course/thread-card.tsx`

#### Fix 1: Metadata Text Size (Line 83)

**Current:**
```tsx
<div className="text-xs text-muted-foreground">
```

**Replace with:**
```tsx
<div className="text-mobile-safe text-muted-foreground">
  {/* 14px mobile, 12px desktop */}
```

#### Fix 2: Metadata Gap (Line 83)

**Current:**
```tsx
<div className="flex flex-wrap items-center gap-4">
```

**Replace with:**
```tsx
<div className="flex flex-wrap items-center gap-3 md:gap-4">
  {/* 12px mobile, 16px desktop */}
```

---

### Step 3.4: Fix StatCard

**File:** `components/dashboard/stat-card.tsx`

#### Fix 1: Remove Arbitrary Duration (Line 162)

**Current:**
```tsx
<Card className="transition-shadow duration-[240ms]">
```

**Replace with:**
```css
/* app/globals.css - Add transition duration token */
--duration-card-shadow: 240ms;
```

```tsx
<Card className="transition-shadow duration-[var(--duration-card-shadow)]">
```

#### Fix 2: Responsive Padding (Line 163)

**Current:**
```tsx
<CardContent className="p-4 space-y-2">
```

**Replace with:**
```tsx
<CardContent className="p-mobile md:p-4 space-y-2 md:space-y-3">
  {/* 16px padding mobile, responsive spacing */}
```

---

## Phase 4: Layout & Navigation Fixes

### Step 4.1: Fix Root Layout Navbar Offset

**File:** `app/layout.tsx`

#### Fix 1: Responsive Padding Top (Line 75)

**Current:**
```tsx
<main className="flex-1 overflow-y-auto sidebar-scroll relative pt-[104px]">
```

**Replace with:**
```tsx
<main className="flex-1 overflow-y-auto sidebar-scroll relative pt-24 md:pt-[104px]">
  {/* 96px mobile, 104px desktop */}
  {/* OR use token: pt-mobile-header */}
```

**Reasoning:** 104px is excessive on mobile (360px height), use 96px (pt-24)

#### Fix 2: Optimize Liquid Background for Mobile (Lines 44-68)

**Current:**
```tsx
<div className="absolute inset-0 opacity-70">
  <div className="blur-3xl animate-liquid-float" />
  <div className="blur-3xl animate-liquid-float" />
  <div className="blur-3xl animate-liquid-float" />
</div>
```

**Replace with:**
```tsx
<div className="absolute inset-0 opacity-70">
  {/* Reduce blur on mobile for performance */}
  <div className="hidden md:block blur-3xl animate-liquid-float" />
  <div className="blur-2xl md:blur-3xl animate-liquid-float motion-reduce:blur-xl" />
  <div className="blur-2xl md:blur-3xl animate-liquid-float motion-reduce:blur-xl" />
</div>
```

**Performance Impact:**
- Reduces 3 layers to 2 on mobile
- Reduces blur from 48px to 32px on mobile
- Maintains 3 layers on desktop
- Respects prefers-reduced-motion

---

### Step 4.2: Add Mobile Navigation to GlobalNavBar

**File:** `components/layout/global-nav-bar.tsx`

#### Fix 1: Add Mobile Menu Button (After Line 131)

**Add after search section:**
```tsx
{/* Mobile Menu Button */}
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
    </SheetTrigger>
    <SheetContent
      side="right"
      className="w-mobile-sheet glass-panel"
    >
      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-bold">Menu</h2>

        {/* Mobile Action Buttons */}
        <nav className="space-y-3" aria-label="Mobile actions">
          {onAskQuestion && (
            <Button
              variant="glass"
              onClick={onAskQuestion}
              className="w-full justify-start gap-3 touch-target-comfortable"
            >
              <MessageSquarePlus className="size-5" />
              Ask Question
            </Button>
          )}

          {onOpenAIAssistant && (
            <Button
              variant="glass"
              onClick={onOpenAIAssistant}
              className="w-full justify-start gap-3 touch-target-comfortable"
            >
              <Sparkles className="size-5" />
              AI Assistant
            </Button>
          )}

          {onOpenSupport && (
            <Button
              variant="ghost"
              onClick={onOpenSupport}
              className="w-full justify-start gap-3 touch-target-comfortable"
            >
              <HelpCircle className="size-5" />
              Support
            </Button>
          )}

          {onOpenSettings && (
            <Button
              variant="ghost"
              onClick={onOpenSettings}
              className="w-full justify-start gap-3 touch-target-comfortable"
            >
              <Settings className="size-5" />
              Settings
            </Button>
          )}
        </nav>

        {/* Quokka Points on Mobile */}
        {quokkaPoints && (
          <div className="border-t pt-6">
            <QuokkaPointsBadge
              {...quokkaPoints}
              onViewDetails={onViewPointsDetails}
            />
          </div>
        )}
      </div>
    </SheetContent>
  </Sheet>
</div>
```

#### Fix 2: Add Mobile Search Button (After Line 129)

**Add after desktop search:**
```tsx
{/* Mobile Search Button */}
<div className="md:hidden">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => {
      // TODO: Implement mobile search modal/sheet
      console.log('Open mobile search');
    }}
    className="touch-target"
    aria-label="Search"
  >
    <Search className="size-5" />
  </Button>
</div>
```

---

### Step 4.3: Fix SidebarLayout Grid Values

**File:** `components/course/sidebar-layout.tsx`

#### Fix 1: Use QDS Grid Tokens (Lines 115-124)

**Current:**
```tsx
const gridCols = isFilterSidebarOpen
  ? "lg:grid-cols-[minmax(200px,220px)_1fr]"
  : "lg:grid-cols-[minmax(48px,56px)_1fr]";
```

**Replace with:**
```tsx
const gridCols = isFilterSidebarOpen
  ? "lg:grid-cols-[minmax(12rem,14rem)_1fr]"      // 192-224px (48-56 * 4pt)
  : "lg:grid-cols-[minmax(3rem,3.5rem)_1fr]";     // 48-56px (12-14 * 4pt)
```

**Reasoning:** Use rem units for better scalability, align with 4pt grid

#### Fix 2: Fix Mobile Drawer Width (Line 153)

**Current:**
```tsx
<aside className="fixed left-0 top-0 z-50 w-[220px]">
```

**Replace with:**
```tsx
<aside className="fixed left-0 top-0 z-50 w-mobile-sheet lg:w-full">
  {/* 280px mobile, responsive desktop */}
```

---

## Phase 5: Glass Effect Optimization

### Step 5.1: Create Mobile Glass Component Variants

**File:** `components/ui/card.tsx`

**Add new mobile-optimized glass variant:**

```tsx
// Add to cardVariants
"glass-mobile": cn(
  "backdrop-blur-md md:backdrop-blur-lg",              // 12px → 16px
  "bg-glass-medium",
  "border border-[var(--border-glass)]",
  "shadow-[var(--shadow-glass-md)]",
  "transition-all duration-200"
),
```

**Usage:**
```tsx
// Use for cards that need glass on mobile
<Card variant="glass-mobile">
```

---

### Step 5.2: Add Glass Performance Safeguards

**File:** `app/globals.css`

**Add after glass utilities (Line 819):**

```css
/* ===== Mobile Glass Performance ===== */

@media (max-width: 767px) {
  /* Reduce blur intensity on mobile */
  .glass-panel {
    backdrop-filter: blur(var(--blur-mobile-md));
  }

  .glass-panel-strong {
    backdrop-filter: blur(var(--blur-mobile-lg));
  }

  /* Disable animations on low-end devices */
  @media (prefers-reduced-motion: reduce) {
    .animate-liquid-float,
    .animate-glass-shimmer {
      animation: none !important;
    }
  }

  /* Optional: Network-aware glass */
  @media (prefers-reduced-data: reduce) {
    .glass-panel,
    .glass-panel-strong {
      backdrop-filter: none;
      background: var(--card);
      border: 1px solid var(--border);
    }
  }
}

/* Maximum 3 blur layers warning */
.glass-layer-4,
.glass-layer-5 {
  /* Fallback to solid background if exceeding limit */
  @supports (backdrop-filter: blur(1px)) {
    @media (max-width: 767px) {
      backdrop-filter: none;
      background: var(--card);
    }
  }
}
```

---

## Phase 6: Arbitrary Value Elimination

### Step 6.1: Create Replacement Map

**67 instances across 33 files to fix:**

| Current | Replacement | Token |
|---------|-------------|-------|
| `pt-[104px]` | `pt-24 md:pt-[104px]` | `--mobile-header-offset` |
| `min-h-[220px]` | `min-h-56` | 224px (56 * 4pt) |
| `min-h-[44px]` | `.touch-target` | `--touch-target-min` |
| `min-w-[44px]` | `.touch-target` | `--touch-target-min` |
| `w-[220px]` | `w-mobile-sheet` | `--mobile-sheet-width` |
| `w-[280px]` | `w-70` | 280px (70 * 4pt) |
| `h-[44px]` | `h-11` | 44px (11 * 4pt) |
| `duration-[240ms]` | `duration-[var(--duration-slow)]` | `--duration-slow: 240ms` |
| `duration-[250ms]` | `duration-[var(--duration-slow)]` | `--duration-slow: 240ms` |
| `minmax(200px,220px)` | `minmax(12rem,14rem)` | rem-based |

---

### Step 6.2: Automated Replacement Script

**Create:** `scripts/fix-arbitrary-values.sh`

```bash
#!/bin/bash

# Fix arbitrary touch targets
rg -l "min-h-\[44px\]|min-w-\[44px\]" --type tsx | \
xargs sed -i '' 's/min-h-\[44px\] min-w-\[44px\]/touch-target/g'

# Fix card heights
rg -l "min-h-\[220px\]" --type tsx | \
xargs sed -i '' 's/min-h-\[220px\]/min-h-56/g'

# Fix drawer widths
rg -l "w-\[220px\]" --type tsx | \
xargs sed -i '' 's/w-\[220px\]/w-mobile-sheet/g'

# Fix durations (requires manual review)
rg "duration-\[2[0-9]{2}ms\]" --type tsx
```

**Manual Review Required:**
- Context-dependent replacements
- Verify no regressions
- Test each component after replacement

---

## Phase 7: Testing & Validation

### Step 7.1: Component-Level Testing

**Test each fixed component:**

1. **Button**
```tsx
// components/__tests__/button.test.tsx
test('button meets 44px touch target on mobile', () => {
  render(<Button>Test</Button>);
  const button = screen.getByRole('button');
  const height = button.getBoundingClientRect().height;
  expect(height).toBeGreaterThanOrEqual(44);
});
```

2. **EnhancedCourseCard**
```tsx
test('course card uses QDS spacing tokens', () => {
  const { container } = render(<EnhancedCourseCard {...props} />);
  const card = container.querySelector('.min-h-56');
  expect(card).toBeInTheDocument();
});
```

---

### Step 7.2: Mobile Viewport Testing

**Manual testing checklist:**

```markdown
## Mobile Viewport Tests (360px - 767px)

### iPhone SE (375x667)
- [ ] All buttons are 44x44px minimum
- [ ] Text is 14px+ (no 12px body text)
- [ ] Cards have 16px padding
- [ ] Stats grid shows 1 column
- [ ] Mobile menu accessible
- [ ] Glass effects perform at 60fps

### iPhone 14 (390x844)
- [ ] Same as above
- [ ] Hero text doesn't overflow
- [ ] Navbar height appropriate

### Android Small (360x640)
- [ ] All content visible
- [ ] No horizontal scroll
- [ ] Touch targets clear
- [ ] Text readable

### Tablet (768x1024)
- [ ] Breakpoint transition smooth
- [ ] Desktop patterns activate
- [ ] Sidebar behavior correct
```

---

### Step 7.3: Performance Testing

**Lighthouse Mobile Audit:**

```bash
npx lighthouse http://localhost:3000/dashboard \
  --only-categories=performance,accessibility \
  --preset=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html \
  --output-path=./reports/lighthouse-mobile.html
```

**Target Scores:**
- Performance: 85+ (with glass optimization)
- Accessibility: 95+
- Best Practices: 90+

**Key Metrics:**
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Time to Interactive: <3.8s

---

### Step 7.4: Contrast Testing

**Automated contrast check:**

```javascript
// scripts/check-contrast.js
const axe = require('axe-core');

axe.run(document, {
  rules: {
    'color-contrast': { enabled: true }
  }
}).then(results => {
  if (results.violations.length > 0) {
    console.error('Contrast violations:', results.violations);
    process.exit(1);
  }
});
```

**Manual checks:**
- All text on glass backgrounds: 4.5:1 minimum
- Status badges: 4.5:1 minimum
- Icon buttons: 3:1 minimum (large text)
- Focus indicators: 3:1 minimum

---

## Implementation Checklist

### Phase 1: Tokens
- [ ] Add mobile tokens to globals.css (Step 1.1)
- [ ] Add mobile utility classes (Step 1.2)
- [ ] Test token access in components
- [ ] Verify dark mode tokens

### Phase 2: Touch Targets
- [ ] Fix Button component sizes (Step 2.1)
- [ ] Fix GlobalNavBar icon buttons (Step 2.2)
- [ ] Add mobile touch target override (Step 2.3)
- [ ] Test all interactive elements >= 44px

### Phase 3: Spacing
- [ ] Fix Dashboard grid layouts (Step 3.1)
- [ ] Fix EnhancedCourseCard (Step 3.2)
- [ ] Fix ThreadCard (Step 3.3)
- [ ] Fix StatCard (Step 3.4)
- [ ] Verify responsive spacing

### Phase 4: Layout
- [ ] Fix root layout navbar offset (Step 4.1)
- [ ] Add mobile navigation (Step 4.2)
- [ ] Fix SidebarLayout grid values (Step 4.3)
- [ ] Test mobile navigation flows

### Phase 5: Glass
- [ ] Create mobile glass variants (Step 5.1)
- [ ] Add performance safeguards (Step 5.2)
- [ ] Test glass effect performance
- [ ] Verify 60fps on mobile

### Phase 6: Cleanup
- [ ] Create replacement map (Step 6.1)
- [ ] Run automated replacement script (Step 6.2)
- [ ] Manual review all replacements
- [ ] Verify no regressions

### Phase 7: Testing
- [ ] Component-level tests (Step 7.1)
- [ ] Mobile viewport tests (Step 7.2)
- [ ] Performance testing (Step 7.3)
- [ ] Contrast testing (Step 7.4)
- [ ] Final QDS compliance audit

---

## Success Criteria

**QDS Compliance Score:** 9.5/10

**Must-Have:**
- Zero hardcoded hex colors (maintain 10/10)
- Zero arbitrary sizing below touch target minimum
- All buttons meet 44px minimum on mobile
- All text >= 14px on mobile (except labels)
- Responsive spacing follows 4pt grid
- Glass effects <= 3 layers on mobile
- Lighthouse mobile accessibility >= 95

**Nice-to-Have:**
- Lighthouse mobile performance >= 90
- Zero arbitrary values in codebase
- Mobile navigation patterns documented
- Responsive design patterns library

---

## Rollback Plan

**If issues arise:**

1. **Git Revert Safety**
```bash
# Each phase should be a separate commit
git log --oneline | grep "QDS mobile"
git revert <commit-hash>
```

2. **Token Rollback**
- Remove mobile tokens from globals.css
- Restore original button sizes
- Revert layout changes

3. **Feature Flags**
```tsx
// Use environment variable for gradual rollout
const USE_MOBILE_QDS = process.env.NEXT_PUBLIC_MOBILE_QDS === 'true';
```

---

## Post-Implementation

### Documentation Updates

1. **Update QDS.md**
- Add mobile tokens section
- Document responsive patterns
- Add touch target guidelines

2. **Create Mobile Pattern Library**
- Document grid patterns
- Typography scale examples
- Touch target examples
- Glass effect guidelines

3. **Update CLAUDE.md**
- Add mobile QDS rules
- Update compliance checks
- Document mobile testing

### Team Communication

- Demo mobile improvements
- Share before/after screenshots
- Document breaking changes
- Update component Storybook

---

## Timeline Estimate

**Phase 1 (Tokens):** 2 hours
**Phase 2 (Touch Targets):** 3 hours
**Phase 3 (Spacing):** 4 hours
**Phase 4 (Layout):** 4 hours
**Phase 5 (Glass):** 2 hours
**Phase 6 (Cleanup):** 3 hours
**Phase 7 (Testing):** 4 hours

**Total:** ~22 hours (3 working days)

---

## Notes

- Prioritize critical fixes (touch targets, spacing)
- Test each phase before moving to next
- Document any deviations from plan
- Update this plan as issues arise
- Maintain backward compatibility where possible

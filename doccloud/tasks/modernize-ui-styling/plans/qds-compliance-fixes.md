# QDS Compliance Fixes: Implementation Plan

**Plan Date:** 2025-10-04
**Based on:** research/qds-compliance-audit.md
**Estimated Effort:** 8-12 hours
**Risk Level:** Low (CSS/styling only, no functional changes)

---

## Implementation Strategy

**Approach:** Progressive enhancement in 3 phases
1. **Phase 1 (Critical):** Token additions, typography hierarchy, navigation glass effect
2. **Phase 2 (Medium):** Status badges, message bubbles, spacing utilities
3. **Phase 3 (Polish):** Component refinements, accessibility enhancements

**Testing After Each Phase:**
- Visual regression check
- Contrast ratio verification
- Dark mode validation
- Responsive layout test (360px, 768px, 1024px, 1280px)

---

## Phase 1: Critical Fixes (Priority 1)

### 1.1 Add Missing Tokens to `app/globals.css`

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/globals.css`

**Location:** After line 301 (end of :root block)

**Add:**
```css
  /* ===== Status Indicator Tokens ===== */
  --status-open-bg: rgba(180, 83, 9, 0.1);
  --status-open-text: var(--warning);
  --status-open-border: rgba(180, 83, 9, 0.2);

  --status-answered-bg: rgba(45, 108, 223, 0.1);
  --status-answered-text: var(--accent);
  --status-answered-border: rgba(45, 108, 223, 0.2);

  --status-resolved-bg: rgba(46, 125, 50, 0.1);
  --status-resolved-text: var(--success);
  --status-resolved-border: rgba(46, 125, 50, 0.2);

  /* ===== Avatar Tokens ===== */
  --avatar-bg: rgba(138, 107, 61, 0.15);
  --avatar-text: var(--primary);

  /* ===== Text Subtle (for timestamps) ===== */
  --text-subtle: rgba(98, 92, 82, 0.6);

  /* ===== Glass Overlay Enhancement ===== */
  --glass-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
```

**Location:** After line 402 (end of .dark block)

**Add:**
```css
  /* ===== Status Indicators (Dark) ===== */
  --status-open-bg: rgba(180, 83, 9, 0.15);
  --status-open-border: rgba(180, 83, 9, 0.25);

  --status-answered-bg: rgba(134, 169, 246, 0.15);
  --status-answered-text: var(--accent);
  --status-answered-border: rgba(134, 169, 246, 0.25);

  --status-resolved-bg: rgba(46, 125, 50, 0.15);
  --status-resolved-border: rgba(46, 125, 50, 0.25);

  /* ===== Avatar (Dark) ===== */
  --avatar-bg: rgba(193, 165, 118, 0.2);
  --avatar-text: var(--primary);

  /* ===== Text Subtle (Dark) ===== */
  --text-subtle: rgba(184, 174, 163, 0.6);

  /* ===== Glass Text Shadow (Dark) ===== */
  --glass-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
```

**Location:** After line 648 (end of file, in utilities layer)

**Add:**
```css
/* ===== Typography Utilities ===== */
.heading-1 {
  @apply text-5xl font-bold leading-tight tracking-tight;
}

.heading-2 {
  @apply text-3xl font-semibold leading-snug;
}

.heading-3 {
  @apply text-xl font-semibold leading-normal;
}

.body-large {
  @apply text-lg leading-relaxed;
}

.body-default {
  @apply text-base leading-relaxed;
}

/* ===== Status Badge Utilities ===== */
.status-open {
  @apply bg-[var(--status-open-bg)] text-[var(--status-open-text)] border border-[var(--status-open-border)];
}

.status-answered {
  @apply bg-[var(--status-answered-bg)] text-[var(--status-answered-text)] border border-[var(--status-answered-border)];
}

.status-resolved {
  @apply bg-[var(--status-resolved-bg)] text-[var(--status-resolved-text)] border border-[var(--status-resolved-border)];
}

/* ===== Avatar Utilities ===== */
.avatar-placeholder {
  @apply bg-[var(--avatar-bg)] text-[var(--avatar-text)] font-semibold;
}

/* ===== Timestamp Utilities ===== */
.text-timestamp {
  @apply text-[var(--text-subtle)];
}

/* ===== Container Utilities ===== */
.container-narrow {
  @apply max-w-4xl mx-auto px-4 md:px-6;
}

.container-wide {
  @apply max-w-6xl mx-auto px-4 md:px-8;
}

/* ===== Glass Text Enhancement ===== */
@supports (backdrop-filter: blur(1px)) {
  .glass-text-enhanced {
    text-shadow: var(--glass-text-shadow);
  }
}

/* ===== Message Bubble Utilities ===== */
.message-user {
  @apply glass-panel-strong bg-accent/30 border-accent/40 text-accent-foreground;
}

.message-assistant {
  @apply glass-panel bg-primary/10 border-primary/20 text-foreground;
}
```

---

### 1.2 Fix Navigation Header Glass Effect

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx`

**Line 42:** Replace entire header element

**Current:**
```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
```

**New:**
```tsx
<header className="sticky top-0 z-50 w-full glass-panel-strong border-b border-[var(--border-glass)]">
```

**Rationale:** Uses QDS glass panel utility instead of arbitrary opacity values. Provides proper glassmorphism effect with backdrop blur.

---

### 1.3 Fix Background Mesh in Layout

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/layout.tsx`

**Step 1:** Add utility class to globals.css (already included above)

**Step 2 - Line 31:** Replace opacity value

**Current:**
```tsx
<div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,...')]" />
```

**New:**
```tsx
<div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,...')]" />
```

**Rationale:** 0.015 is too subtle, 0.02 provides better texture while staying minimal. This is an acceptable arbitrary value for noise texture.

**Step 3 - Lines 35-40:** Convert inline styles to utility class

First add to globals.css:
```css
/* Background mesh utility */
.bg-mesh {
  background: radial-gradient(at 40% 20%, rgba(138, 107, 61, 0.15) 0px, transparent 50%),
              radial-gradient(at 80% 80%, rgba(94, 125, 74, 0.12) 0px, transparent 50%);
}

.dark .bg-mesh {
  background: radial-gradient(at 40% 20%, rgba(193, 165, 118, 0.18) 0px, transparent 50%),
              radial-gradient(at 80% 80%, rgba(150, 179, 128, 0.15) 0px, transparent 50%);
}
```

**Current:**
```tsx
<div
  className="absolute inset-0"
  style={{
    background: 'radial-gradient(at 40% 20%, rgba(138,107,61,0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(94,125,74,0.12) 0px, transparent 50%)'
  }}
/>
```

**New:**
```tsx
<div className="absolute inset-0 bg-mesh" />
```

---

### 1.4 Fix Card Border Radius and Transitions

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/card.tsx`

**Line 7:** Fix border radius and transition duration

**Current:**
```tsx
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm transition-all duration-250",
```

**New:**
```tsx
"bg-card text-card-foreground flex flex-col gap-6 rounded-lg border shadow-sm transition-all duration-[180ms]",
```

**Rationale:**
- `rounded-lg` (16px) is QDS default for cards (xl is for large cards)
- `duration-[180ms]` matches QDS medium duration

---

### 1.5 Fix Button Transitions

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/button.tsx`

**Line 8:** Fix transition duration

**Current:**
```tsx
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-250 disabled:pointer-events-none..."
```

**New:**
```tsx
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-[180ms] disabled:pointer-events-none..."
```

---

### 1.6 Typography Hierarchy Fixes

**Apply to ALL page files - systematic replacement:**

#### Home Page (`app/page.tsx`)

**Line 24:**
```tsx
// Current
<h1 className="text-4xl font-bold text-primary glass-text">

// New
<h1 className="heading-1 text-primary glass-text">
```

#### Courses Page (`app/courses/page.tsx`)

**Line 42:**
```tsx
// Current
<h1 className="text-4xl font-bold text-primary glass-text">My Courses</h1>

// New
<h1 className="heading-1 text-primary glass-text">My Courses</h1>
```

**Line 93:**
```tsx
// Current
<h2 className="text-2xl font-semibold mb-4">Discussion Threads</h2>

// New (in Course Detail page)
<h2 className="heading-2 mb-6">Discussion Threads</h2>
```

#### Course Detail (`app/courses/[courseId]/page.tsx`)

**Line 77:**
```tsx
// Current
<h1 className="text-4xl font-bold text-primary glass-text">{course.name}</h1>

// New
<h1 className="heading-1 text-primary glass-text">{course.name}</h1>
```

**Line 93:**
```tsx
// Current
<h2 className="text-2xl font-semibold mb-4">Discussion Threads</h2>

// New
<h2 className="heading-2 mb-6">Discussion Threads</h2>
```

#### Thread Detail (`app/threads/[threadId]/page.tsx`)

**Line 111:**
```tsx
// Current
<CardTitle className="text-2xl">{thread.title}</CardTitle>

// New
<CardTitle className="text-3xl font-bold leading-tight">{thread.title}</CardTitle>
```

**Line 139:**
```tsx
// Current
<h2 className="text-2xl font-semibold mb-4">

// New
<h2 className="heading-2 mb-6">
```

#### Ask Question (`app/ask/page.tsx`)

**Line 83:**
```tsx
// Current
<h1 className="text-4xl font-bold text-primary glass-text">Ask a Question</h1>

// New
<h1 className="heading-1 text-primary glass-text">Ask a Question</h1>
```

**Line 192:**
```tsx
// Current
<CardTitle className="text-lg">Tips for Asking Good Questions</CardTitle>

// New
<CardTitle className="heading-3">Tips for Asking Good Questions</CardTitle>
```

#### Quokka Chat (`app/quokka/page.tsx`)

**Line 120:**
```tsx
// Current
<h1 className="text-4xl font-bold text-primary glass-text">Quokka AI</h1>

// New
<h1 className="heading-1 text-primary glass-text">Quokka AI</h1>
```

---

## Phase 2: Medium Priority Fixes

### 2.1 Status Badge Implementation

**Files to update:**
- `app/courses/[courseId]/page.tsx`
- `app/threads/[threadId]/page.tsx`

#### Course Detail Page

**Lines 54-61:** Replace getStatusBadge function

**Current:**
```tsx
const getStatusBadge = (status: Thread["status"]) => {
  const variants = {
    open: "bg-warning/20 text-warning",
    answered: "bg-accent/20 text-accent",
    resolved: "bg-success/20 text-success",
  };
  return variants[status] || variants.open;
};
```

**New:**
```tsx
const getStatusBadge = (status: Thread["status"]) => {
  const variants = {
    open: "status-open",
    answered: "status-answered",
    resolved: "status-resolved",
  };
  return variants[status] || variants.open;
};
```

**Line 107:** Badge usage remains the same (already uses className prop)

#### Thread Detail Page

**Lines 81-88:** Same replacement as above

**Line 118:** Badge usage remains the same

---

### 2.2 Avatar Placeholder Fixes

**Files:**
- `components/layout/nav-header.tsx`
- `app/threads/[threadId]/page.tsx`

#### Navigation Header

**Line 85:**
```tsx
// Current
<Avatar className="h-10 w-10 bg-primary/20">

// New
<Avatar className="size-10 avatar-placeholder">
```

#### Thread Detail

**Line 147:**
```tsx
// Current
<Avatar className="h-10 w-10 bg-primary/20">

// New
<Avatar className="size-10 avatar-placeholder">
```

---

### 2.3 Timestamp Text Fixes

**Files:**
- `app/threads/[threadId]/page.tsx`
- `app/quokka/page.tsx`

#### Thread Detail

**Line 160:**
```tsx
// Current
<p className="text-xs text-muted-foreground">

// New
<p className="text-xs text-timestamp">
```

#### Quokka Chat

**Line 155:**
```tsx
// Current
<p className="text-xs opacity-60 mt-2">

// New
<p className="text-xs text-timestamp mt-2">
```

---

### 2.4 Message Bubble Glass Treatment

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/quokka/page.tsx`

**Lines 148-152:** Replace message bubble styling

**Current:**
```tsx
<div
  className={`max-w-[80%] rounded-lg p-4 ${
    message.role === "user"
      ? "bg-accent text-accent-foreground"
      : "bg-primary/10 text-foreground"
  }`}
>
```

**New:**
```tsx
<div
  className={`max-w-[80%] rounded-2xl p-4 ${
    message.role === "user"
      ? "message-user"
      : "message-assistant"
  }`}
>
```

**Line 164:** Thinking state

**Current:**
```tsx
<div className="bg-primary/10 text-foreground rounded-lg p-4">
```

**New:**
```tsx
<div className="message-assistant rounded-2xl p-4">
```

---

### 2.5 Container Utility Implementation

**Replace inline max-w classes with semantic utilities:**

#### Courses Page

**Line 38:**
```tsx
// Current
<div className="max-w-6xl mx-auto space-y-8">

// New
<div className="container-wide space-y-8">
```

#### Course Detail Page

**Line 65:**
```tsx
// Current
<div className="max-w-6xl mx-auto space-y-8">

// New
<div className="container-wide space-y-8">
```

#### Thread Detail Page

**Line 92:**
```tsx
// Current
<div className="max-w-4xl mx-auto space-y-8">

// New
<div className="container-narrow space-y-8">
```

#### Ask Question Page

**Line 80:**
```tsx
// Current
<div className="max-w-4xl mx-auto space-y-8">

// New
<div className="container-narrow space-y-8">
```

#### Quokka Chat Page

**Line 117:**
```tsx
// Current
<div className="max-w-4xl mx-auto space-y-6">

// New
<div className="container-narrow space-y-6">
```

---

## Phase 3: Polish & Enhancements

### 3.1 Endorsed Badge Enhancement

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/threads/[threadId]/page.tsx`

**Line 154:**
```tsx
// Current
<Badge variant="outline" className="bg-success/10 text-success">

// New
<Badge variant="outline" className="status-resolved">
```

---

### 3.2 Chat Container Height Fix

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/quokka/page.tsx`

**Line 127:**
```tsx
// Current
<Card variant="glass-strong" className="h-[600px] flex flex-col">

// New
<Card variant="glass-strong" className="h-[calc(100vh-16rem)] min-h-[500px] max-h-[800px] flex flex-col">
```

**Rationale:** Responsive height based on viewport, with min/max constraints for usability.

---

### 3.3 Spacing Utility Enhancements

**Apply semantic spacing utilities where appropriate:**

#### All Pages - Section Spacing

Replace `p-8` with proper section spacing:

```tsx
// Current
<div className="min-h-screen p-8">

// New
<div className="min-h-screen section-spacing px-4 md:px-8">
```

**Files:**
- `app/courses/page.tsx` (line 23, 37)
- `app/courses/[courseId]/page.tsx` (line 28, 64)
- `app/threads/[threadId]/page.tsx` (line 53, 91)
- `app/ask/page.tsx` (line 79)
- `app/quokka/page.tsx` (line 116)

---

### 3.4 Card Padding Refinements

**Status badges in Course Detail need proper spacing:**

**Line 72-76:** Better metadata spacing

```tsx
// Current
<div className="flex items-center gap-4 text-xs text-muted-foreground">

// New
<div className="flex items-center gap-3 text-sm text-muted-foreground">
```

**Rationale:** `gap-3` (12px) is tighter, `text-sm` is more readable than `text-xs` for this content.

---

### 3.5 Loading State Improvements

**Add glass shimmer to loading states:**

#### Skeleton Component Enhancement

**File:** `components/ui/skeleton.tsx` (if exists, otherwise add utility)

**Add to globals.css utilities:**
```css
.skeleton-glass {
  @apply glass-panel animate-pulse;
  background: linear-gradient(
    90deg,
    var(--glass-medium) 0%,
    var(--glass-strong) 50%,
    var(--glass-medium) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Testing Checklist

### After Phase 1

- [ ] All new tokens render correctly in light mode
- [ ] All new tokens render correctly in dark mode
- [ ] Navigation header has proper glass effect with backdrop blur
- [ ] Background mesh displays correctly without inline styles
- [ ] Card border radius is 16px (rounded-lg)
- [ ] Button transitions are 180ms
- [ ] All headings use new hierarchy utilities
- [ ] Typography is visually improved and consistent
- [ ] Run `npm run build` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Test on Chrome, Firefox, Safari

### After Phase 2

- [ ] Status badges use semantic tokens (no arbitrary opacity)
- [ ] Avatar backgrounds use semantic tokens
- [ ] Timestamps have proper contrast (pass AA)
- [ ] Message bubbles have glass effect
- [ ] Container utilities applied correctly
- [ ] Responsive layout intact at 360px, 768px, 1024px, 1280px
- [ ] Dark mode works for all new components
- [ ] Contrast ratios verified (use Chrome DevTools)

### After Phase 3

- [ ] Endorsed badges use status utility
- [ ] Chat container height is responsive
- [ ] Section spacing is consistent
- [ ] Loading states have glass treatment
- [ ] All arbitrary values eliminated (except noise opacity)
- [ ] Final visual regression check
- [ ] Accessibility audit (Lighthouse score ≥95)
- [ ] Performance check (no frame drops)

---

## Contrast Verification Script

**Create:** `scripts/check-contrast.mjs`

```js
// Quick contrast ratio checker for key combinations
const colors = {
  bg: '#FFFFFF',
  text: '#2A2721',
  muted: '#625C52',
  primary: '#8A6B3D',
  accent: '#2D6CDF',
  subtle: 'rgba(98, 92, 82, 0.6)', // text-timestamp
};

// Simplified contrast calculation
function getLuminance(hex) {
  // Implementation here
}

function getContrastRatio(color1, color2) {
  // Implementation here
}

// Check key combinations
console.log('Contrast Ratios:');
console.log('Text on BG:', getContrastRatio(colors.text, colors.bg));
console.log('Muted on BG:', getContrastRatio(colors.muted, colors.bg));
console.log('Subtle on BG:', getContrastRatio(colors.subtle, colors.bg));
console.log('White on Primary:', getContrastRatio('#FFFFFF', colors.primary));
console.log('White on Accent:', getContrastRatio('#FFFFFF', colors.accent));
```

---

## Rollback Plan

**If issues arise:**

1. **Revert tokens:** Remove new token definitions from globals.css
2. **Revert utilities:** Remove new utility classes
3. **Revert components:** Use git to restore previous versions
4. **Clear cache:** `rm -rf .next && npm run dev`

**Git strategy:**
- Commit after each phase
- Tag phase completions: `git tag qds-phase-1`, etc.
- Rollback command: `git revert <commit-hash>`

---

## File Summary

### Files to Modify (18 total)

**Phase 1 (7 files):**
1. `app/globals.css` - Add tokens and utilities
2. `components/layout/nav-header.tsx` - Glass header
3. `app/layout.tsx` - Background mesh
4. `components/ui/card.tsx` - Radius and transitions
5. `components/ui/button.tsx` - Transition duration
6. `app/page.tsx` - Typography
7. `app/courses/page.tsx` - Typography

**Phase 2 (5 files):**
1. `app/courses/[courseId]/page.tsx` - Status badges, containers, typography
2. `app/threads/[threadId]/page.tsx` - Avatars, timestamps, typography
3. `app/ask/page.tsx` - Containers, typography
4. `app/quokka/page.tsx` - Message bubbles, timestamps, containers

**Phase 3 (6 files + utilities):**
1. All page files - Section spacing
2. `app/threads/[threadId]/page.tsx` - Endorsed badge
3. `app/quokka/page.tsx` - Chat height
4. `app/courses/[courseId]/page.tsx` - Metadata spacing
5. `app/globals.css` - Skeleton glass utility

---

## Implementation Order (Step-by-Step)

1. **Tokens First:** Add all new tokens to globals.css
2. **Utilities Second:** Add all new utility classes to globals.css
3. **Component Fixes:** Update card.tsx and button.tsx
4. **Navigation:** Fix nav-header.tsx glass effect
5. **Layout:** Clean up layout.tsx background
6. **Typography:** Systematically update all heading classes
7. **Status System:** Update status badges across files
8. **Avatars & Timestamps:** Replace arbitrary values
9. **Containers:** Apply semantic container utilities
10. **Message Bubbles:** Glass treatment in chat
11. **Polish:** Final spacing and height adjustments
12. **Test:** Comprehensive testing checklist

---

## Expected Outcomes

**Visual Improvements:**
- Consistent, modern typography hierarchy
- Professional glassmorphism throughout
- No arbitrary opacity values
- Improved contrast for accessibility
- Cohesive design system implementation

**Technical Improvements:**
- All QDS tokens properly utilized
- Semantic utility classes for common patterns
- Maintainable, scalable styling approach
- Better dark mode support
- Optimized performance with proper classes

**Compliance Score Projection:**
- Current: 6.5/10
- After Phase 1: 8/10
- After Phase 2: 9/10
- After Phase 3: 9.5/10

---

**End of Implementation Plan**

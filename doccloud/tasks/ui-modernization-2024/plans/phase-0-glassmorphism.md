# Phase 0: Visual Identity & Glassmorphism Implementation

**Priority:** P0 (Critical)
**Estimated Effort:** 3-4 hours
**Dependencies:** None
**Status:** Ready to implement

---

## Objective

Apply QDS 2.0 glassmorphism design system across all major components to create visual depth, modern aesthetics, and establish QuokkaQ's distinctive visual identity.

**Success Criteria:**
- All card components use glass backgrounds with backdrop blur
- Visual hierarchy improved through spacing and elevation
- AI features stand out with distinctive purple branding
- No accessibility regressions (maintain WCAG AA)
- Performance remains acceptable (<200KB per route)

---

## Prerequisites

### Verify QDS Tokens Available

**Check `app/globals.css` for:**
```css
/* Glassmorphism tokens (should already exist) */
--glass-ultra: rgba(255, 255, 255, 0.4)
--glass-strong: rgba(255, 255, 255, 0.6)
--glass-medium: rgba(255, 255, 255, 0.7)
--glass-subtle: rgba(255, 255, 255, 0.85)
--border-glass: rgba(255, 255, 255, 0.18)

/* Blur scale */
--blur-xs: 4px
--blur-sm: 8px
--blur-md: 12px
--blur-lg: 16px

/* Glass shadows */
--shadow-glass-sm: 0 2px 16px rgba(15, 14, 12, 0.04)
--shadow-glass-md: 0 4px 24px rgba(15, 14, 12, 0.06)
--shadow-glass-lg: 0 8px 32px rgba(15, 14, 12, 0.08)

/* Glows for hover states */
--glow-primary: 0 0 20px rgba(138, 107, 61, 0.15)
--glow-accent: 0 0 20px rgba(45, 108, 223, 0.15)
```

**Verify Tailwind Config:**
Ensure `globals.css` theme inline maps tokens to Tailwind utilities.

---

## Implementation Steps

### Step 1: Add Glass Utilities to Base Card Component

**File:** `components/ui/card.tsx`

**Current State:**
```tsx
// Basic card with solid background
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
```

**Updated Implementation:**
```tsx
// Add glass variant support
const cardVariants = cva(
  "rounded-lg border text-card-foreground",
  {
    variants: {
      variant: {
        default: "bg-card shadow-sm",
        glass: "bg-glass-medium backdrop-blur-md border-glass shadow-glass-md",
        "glass-strong": "bg-glass-strong backdrop-blur-lg border-glass shadow-glass-lg",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)
```

**Usage Example:**
```tsx
<Card variant="glass">
  <CardContent>Glass surface with blur</CardContent>
</Card>
```

**Testing:**
- Verify background blur works in Chrome, Firefox, Safari
- Test contrast ratio of text on glass background (min 4.5:1)
- Check performance with DevTools (should be <2ms render time)

**Files to Update:**
- [ ] `components/ui/card.tsx` - Add glass variants

**Estimated Time:** 30 minutes

---

### Step 2: Apply Glassmorphism to Course Cards

**File:** `components/dashboard/enhanced-course-card.tsx`

**Changes:**
1. Replace `bg-card` with `bg-glass-medium`
2. Add `backdrop-blur-md`
3. Replace `border` with `border-glass`
4. Replace `shadow-sm` with `shadow-glass-md`
5. Add hover state with glow

**Before:**
```tsx
<Card className="hover:shadow-md transition-shadow">
  {/* content */}
</Card>
```

**After:**
```tsx
<Card
  variant="glass"
  className="hover:shadow-glass-lg hover:shadow-glow-primary transition-all duration-200"
>
  {/* content */}
</Card>
```

**Additional Enhancements:**
- Increase padding: `p-4` → `p-6`
- Increase spacing: `gap-2` → `gap-4`
- Add subtle scale on hover: `hover:scale-[1.02]`

**Files to Update:**
- [ ] `components/dashboard/enhanced-course-card.tsx`

**Estimated Time:** 20 minutes

---

### Step 3: Apply to Dashboard Stat Cards

**File:** `components/dashboard/stat-card.tsx`

**Changes:**
1. Apply glass-medium background
2. Add backdrop-blur-md
3. Use glass-subtle for headers (if separated)
4. Increase spacing between elements

**Implementation:**
```tsx
<Card variant="glass" className="p-6">
  <div className="flex items-center gap-4">
    {/* Icon container with glass-subtle */}
    <div className="rounded-full bg-glass-subtle backdrop-blur-sm p-3">
      <Icon className="h-6 w-6 text-primary" />
    </div>

    {/* Stat content */}
    <div className="flex-1 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-bold">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <TrendIcon className="h-4 w-4" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
</Card>
```

**Files to Update:**
- [ ] `components/dashboard/stat-card.tsx`

**Estimated Time:** 30 minutes

---

### Step 4: Navigation Glassmorphism

**File:** `components/layout/nav-header.tsx`

**Current:** Solid white background
**Target:** Translucent glass with backdrop blur

**Changes:**
1. Add `bg-glass-subtle` background
2. Add `backdrop-blur-lg` for strong blur
3. Add `border-b border-glass`
4. Make sticky with shadow on scroll

**Implementation:**
```tsx
<nav className="sticky top-0 z-50 bg-glass-subtle backdrop-blur-lg border-b border-glass">
  <div className="container-wide">
    {/* nav content */}
  </div>
</nav>
```

**Scroll Shadow Effect:**
```tsx
const [isScrolled, setIsScrolled] = useState(false)

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10)
  }
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

<nav className={cn(
  "sticky top-0 z-50 bg-glass-subtle backdrop-blur-lg border-b border-glass transition-shadow",
  isScrolled && "shadow-glass-md"
)}>
```

**Files to Update:**
- [ ] `components/layout/nav-header.tsx`
- [ ] `components/layout/course-context-bar.tsx` (similar treatment)

**Estimated Time:** 45 minutes

---

### Step 5: Thread Card Glassmorphism

**File:** `app/courses/[courseId]/page.tsx` (inline thread cards)

**Changes:**
1. Apply glass background to thread cards
2. Add hover elevation and glow
3. Increase padding and spacing

**Before:**
```tsx
<Link href={`/threads/${thread.id}`}>
  <Card className="hover:shadow-md">
    {/* thread content */}
  </Card>
</Link>
```

**After:**
```tsx
<Link href={`/threads/${thread.id}`}>
  <Card
    variant="glass"
    className="p-6 hover:shadow-glass-lg hover:shadow-glow-accent transition-all duration-200"
  >
    <div className="space-y-4">
      {/* Better spaced content */}
    </div>
  </Card>
</Link>
```

**Files to Update:**
- [ ] `app/courses/[courseId]/page.tsx` - Thread list cards

**Estimated Time:** 30 minutes

---

### Step 6: Modal Glassmorphism

**File:** `components/course/ask-question-modal.tsx`

**Changes:**
1. Dialog overlay with glass background
2. Dialog content with glass-strong
3. Stronger blur for modal prominence

**Implementation:**
```tsx
<DialogContent className="bg-glass-strong backdrop-blur-xl border-glass shadow-glass-lg">
  {/* modal content */}
</DialogContent>
```

**Files to Update:**
- [ ] `components/course/ask-question-modal.tsx`
- [ ] `components/ui/dialog.tsx` - Add glass variant

**Estimated Time:** 30 minutes

---

### Step 7: Increase Visual Hierarchy Through Spacing

**Principles:**
- Page sections: `gap-12` or `gap-16`
- Card sections: `gap-6` or `gap-8`
- Within components: `gap-4`
- Tight groupings: `gap-2`

**Files to Update:**

**Dashboard Page:**
```tsx
// Before: gap-8
<div className="space-y-16"> {/* Major sections */}
  <section className="space-y-6"> {/* Section content */}
    <h2 className="text-2xl font-bold">My Courses</h2>
    <div className="grid grid-cols-2 gap-6"> {/* Cards */}
      <CourseCard />
    </div>
  </section>
</div>
```

**Course Page:**
```tsx
<div className="space-y-12">
  {/* Header section */}
  <div className="space-y-6">
    {/* Filters */}
  </div>
  {/* Threads section */}
  <div className="space-y-4">
    {/* Thread cards */}
  </div>
</div>
```

**Files to Update:**
- [ ] `app/dashboard/page.tsx`
- [ ] `app/courses/[courseId]/page.tsx`
- [ ] `app/threads/[threadId]/page.tsx`

**Estimated Time:** 30 minutes

---

### Step 8: AI Feature Branding

**Goal:** Make AI-generated content stand out with distinctive purple branding.

**Changes:**

**1. AI Badge Enhancement:**
```tsx
// components/ui/ai-badge.tsx
<Badge
  className="bg-ai-purple-100 dark:bg-ai-purple-900/30 text-ai-purple-700 dark:text-ai-purple-300 border-ai-purple-200 dark:border-ai-purple-800 shadow-glow-accent"
>
  <Sparkles className="h-3 w-3 mr-1" />
  AI
</Badge>
```

**2. AI Answer Card Glow:**
```tsx
// components/course/ai-answer-card.tsx
<Card
  variant="glass"
  className="border-ai-purple-200 shadow-glow-accent hover:shadow-glow-accent/50"
>
  {/* AI content */}
</Card>
```

**3. AI Coverage Card:**
```tsx
// components/dashboard/ai-coverage-card.tsx
<Card variant="glass" className="bg-gradient-to-br from-ai-purple-50 to-transparent">
  {/* AI metrics with purple accent */}
</Card>
```

**Files to Update:**
- [ ] `components/ui/ai-badge.tsx`
- [ ] `components/course/ai-answer-card.tsx`
- [ ] `components/dashboard/ai-coverage-card.tsx`

**Estimated Time:** 45 minutes

---

## Verification & Testing

### Visual QA Checklist

**Per Component:**
- [ ] Glass background applied correctly
- [ ] Backdrop blur renders in all browsers
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Hover states work and are visible
- [ ] Spacing increased appropriately
- [ ] No visual bugs (overlaps, clipping, etc.)

**Cross-Browser:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Responsive:**
- [ ] Desktop (1440px)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Accessibility Testing

**Contrast Checks:**
```bash
# Use WebAIM Contrast Checker or browser DevTools
# Text on glass-medium should be ≥ 4.5:1
# Large text (18pt+) should be ≥ 3:1
```

**Keyboard Navigation:**
- [ ] Tab order logical
- [ ] Focus indicators visible on glass backgrounds
- [ ] No keyboard traps

**Screen Reader:**
- [ ] NVDA/JAWS: Content reads correctly
- [ ] VoiceOver: Structure makes sense

### Performance Testing

**Bundle Size:**
```bash
npm run build
# Check .next/static/chunks/pages/
# Verify each route < 200KB
```

**Render Performance:**
```javascript
// Chrome DevTools > Performance
// Record page load
// Check for:
// - First Contentful Paint < 1.5s
// - Largest Contentful Paint < 2.5s
// - No long tasks > 50ms
```

**Blur Performance:**
```javascript
// Chrome DevTools > Rendering > Paint flashing
// Verify glass elements don't cause excessive repaints
// Limit to max 3 blur layers per viewport
```

---

## Rollback Plan

**If Issues Arise:**

1. **Per-Component Rollback:**
   ```bash
   git show HEAD~1:components/ui/card.tsx > components/ui/card.tsx
   ```

2. **Full Phase Rollback:**
   ```bash
   git revert <phase-0-start-commit>..<phase-0-end-commit>
   ```

3. **Selective Keep:**
   ```bash
   git checkout -b phase-0-partial
   git cherry-pick <good-commit-hash>
   ```

**Rollback Triggers:**
- Contrast fails WCAG AA in multiple places
- Performance degrades >15% on bundle size
- Critical visual bugs in production
- Accessibility blockers

---

## Success Metrics

**Completion Checklist:**
- [ ] All cards use glass backgrounds
- [ ] Navigation has glass treatment with sticky scroll shadow
- [ ] AI features use purple branding with glow
- [ ] Spacing hierarchy improved (gap-12 for sections)
- [ ] All tests pass (tsc, lint, visual QA)
- [ ] Before/after screenshots documented
- [ ] No console errors in dev or prod build
- [ ] Bundle size < 200KB per route
- [ ] Accessibility maintained or improved

**Expected Outcome:**
Modern, visually distinctive interface with depth and sophistication while maintaining QuokkaQ's warm, approachable brand.

---

## Next Steps

After Phase 0 completion:
1. Document lessons learned
2. Update context.md changelog
3. Take "after" screenshots for comparison
4. Get stakeholder/user feedback
5. Proceed to Phase 1 (Component Redesigns)

# True Fixed Layout Implementation Plan

**Created:** 2025-10-09
**Approach:** Option A - True Gmail-Style Fixed Layout

---

## Overview

Transform the entire application to use a fixed layout where:
- Body is locked to viewport height
- NavHeader is fixed at top (always visible)
- Main content area scrolls
- Course dashboard panels scroll independently within main

---

## Step-by-Step Implementation

### Step 1: Lock Body to Viewport

**File:** `app/layout.tsx`

**Current Code (lines 30-72):**
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  {/* Background */}
  <div className="fixed inset-0 -z-10 ...">...</div>

  <Providers>
    <Suspense fallback={null}>
      <NavHeader />
    </Suspense>
    {children}
  </Providers>
</body>
```

**New Code:**
```tsx
<body className={`
  ${geistSans.variable}
  ${geistMono.variable}
  antialiased
  h-screen
  overflow-hidden
  flex
  flex-col
`}>
  {/* Background - unchanged */}
  <div className="fixed inset-0 -z-10 ...">...</div>

  <Providers>
    {/* NavHeader - stays at top (will be fixed internally) */}
    <Suspense fallback={null}>
      <NavHeader />
    </Suspense>

    {/* Main content wrapper - scrollable */}
    <main className="flex-1 overflow-y-auto sidebar-scroll">
      {children}
    </main>
  </Providers>
</body>
```

**Changes:**
- Add `h-screen overflow-hidden flex flex-col` to body
- Wrap `{children}` in `<main className="flex-1 overflow-y-auto sidebar-scroll">`
- Main takes remaining space after nav (`flex-1`)
- Main scrolls independently (`overflow-y-auto`)

---

### Step 2: Fix GlobalNavBar Positioning

**File:** `components/layout/global-nav-bar.tsx`

**Current Code (line 68-76):**
```tsx
<nav
  className={cn(
    "sticky top-0 z-50 w-full glass-panel-strong border-b border-glass transition-shadow duration-200",
    hasScrolled && "shadow-[var(--shadow-glass-md)]",
    className
  )}
  role="navigation"
  aria-label="Global navigation"
>
```

**New Code:**
```tsx
<nav
  className={cn(
    "fixed top-0 z-50 w-full glass-panel-strong border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
    className
  )}
  role="navigation"
  aria-label="Global navigation"
>
```

**Changes:**
- Change `sticky top-0` to `fixed top-0`
- Always show shadow (remove conditional `hasScrolled &&`)
- Remove unused `hasScrolled` prop from component signature (later)

---

### Step 3: Fix CourseContextBar Positioning

**File:** `components/layout/course-context-bar.tsx` (need to read first)

**Expected Current State:**
- Likely uses `sticky` positioning
- Positioned below GlobalNavBar

**Changes Needed:**
- Change to `fixed` positioning
- Set `top: [height-of-global-nav]` (typically 56px or 3.5rem)
- Ensure proper z-index

---

### Step 4: Simplify NavHeader Scroll Tracking

**File:** `components/layout/nav-header.tsx`

**Current Code (lines 24-43):**
```tsx
// Scroll state for shadow effect and progress bar
const [hasScrolled, setHasScrolled] = useState(false);
const [scrollProgress, setScrollProgress] = useState(0);

// Track scroll position for shadow effect and progress calculation
useEffect(() => {
  const handleScroll = () => {
    const sy = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;

    setHasScrolled(sy > 8);
    setScrollProgress(h > 0 ? Math.min(100, Math.max(0, (sy / h) * 100)) : 0);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Option 1: Remove Entirely (Simplest)**
```tsx
// Remove all scroll tracking code
// Remove hasScrolled and scrollProgress from GlobalNavBar props
```

**Option 2: Track Main Element Scroll (More Complex)**
```tsx
const [scrollProgress, setScrollProgress] = useState(0);

useEffect(() => {
  // Find main element and track its scroll
  const mainElement = document.querySelector('main');
  if (!mainElement) return;

  const handleScroll = () => {
    const sy = mainElement.scrollTop;
    const h = mainElement.scrollHeight - mainElement.clientHeight;
    setScrollProgress(h > 0 ? Math.min(100, Math.max(0, (sy / h) * 100)) : 0);
  };

  handleScroll();
  mainElement.addEventListener('scroll', handleScroll, { passive: true });
  return () => mainElement.removeEventListener('scroll', handleScroll);
}, []);
```

**Recommendation:** Start with Option 1 (remove), add Option 2 later if needed.

---

### Step 5: Update Course Page Layout

**File:** `app/courses/[courseId]/page.tsx`

**Current State:**
- SidebarLayout already has `h-screen overflow-hidden` (from previous fix)
- Renders directly in page

**Issue:**
- `h-screen` won't work correctly inside scrollable main
- Needs to fill available parent height instead

**Solution:**
- Change `h-screen` to `h-full` in SidebarLayout
- Ensure page content fills main height

**Check if needed:**
```tsx
// If course page has wrapper div, ensure it fills height
<div className="h-full">
  <SidebarLayout ...>
    {/* ... */}
  </SidebarLayout>
</div>
```

---

### Step 6: Verify Other Pages

**Files to check:**
- `app/dashboard/page.tsx`
- `app/ask/page.tsx`
- `app/quokka/page.tsx`

**Ensure:**
- No conflicting height constraints
- Layouts work with scrollable main
- No assumptions about page-level scrolling

---

## Summary of Changes

### Files to Edit

| File | Change | Complexity |
|------|--------|-----------|
| `app/layout.tsx` | Add flex layout, wrap children in main | Low |
| `components/layout/global-nav-bar.tsx` | Change sticky to fixed, simplify | Low |
| `components/layout/course-context-bar.tsx` | Fix positioning (if needed) | Low-Medium |
| `components/layout/nav-header.tsx` | Remove scroll tracking | Low |
| `components/course/sidebar-layout.tsx` | Change h-screen to h-full | Low |
| `app/courses/[courseId]/page.tsx` | Ensure height fills (if needed) | Low |

**Total:** 4-6 files, mostly low complexity

---

## Detailed Code Changes

### Change 1: app/layout.tsx

**Line 30:** Current
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

**New:**
```tsx
<body
  className={cn(
    geistSans.variable,
    geistMono.variable,
    "antialiased h-screen overflow-hidden flex flex-col"
  )}
>
```

**Lines 64-68:** Current
```tsx
<Providers>
  <Suspense fallback={null}>
    <NavHeader />
  </Suspense>
  {children}
</Providers>
```

**New:**
```tsx
<Providers>
  <Suspense fallback={null}>
    <NavHeader />
  </Suspense>
  <main className="flex-1 overflow-y-auto sidebar-scroll relative">
    {children}
  </main>
</Providers>
```

### Change 2: components/layout/global-nav-bar.tsx

**Line 69-71:** Current
```tsx
className={cn(
  "sticky top-0 z-50 w-full glass-panel-strong border-b border-glass transition-shadow duration-200",
  hasScrolled && "shadow-[var(--shadow-glass-md)]",
```

**New:**
```tsx
className={cn(
  "fixed top-0 z-50 w-full glass-panel-strong border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
```

**Lines 39, 54:** Remove unused props
```tsx
// Remove from interface
hasScrolled?: boolean;
scrollProgress?: number;

// Remove from destructuring
hasScrolled = false,
scrollProgress = 0,
```

**Lines 61-66:** Remove scroll progress bar JSX
```tsx
{/* Remove this entire div */}
<div
  aria-hidden="true"
  className="pointer-events-none fixed left-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 z-[60] transition-all duration-200"
  style={{ width: `${scrollProgress}%` }}
/>
```

### Change 3: components/layout/nav-header.tsx

**Lines 24-43:** Remove scroll tracking
```tsx
// DELETE this entire useEffect
useEffect(() => {
  const handleScroll = () => {
    const sy = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;

    setHasScrolled(sy > 8);
    setScrollProgress(h > 0 ? Math.min(100, Math.max(0, (sy / h) * 100)) : 0);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**Lines 24-26:** Remove state declarations
```tsx
// DELETE these
const [hasScrolled, setHasScrolled] = useState(false);
const [scrollProgress, setScrollProgress] = useState(0);
```

**Lines 86-97:** Update GlobalNavBar call
```tsx
// Current
<GlobalNavBar
  user={user}
  onLogout={handleLogout}
  breadcrumb={...}
  onAskQuestion={...}
  hasScrolled={hasScrolled}       // REMOVE
  scrollProgress={scrollProgress}  // REMOVE
/>

// New
<GlobalNavBar
  user={user}
  onLogout={handleLogout}
  breadcrumb={...}
  onAskQuestion={...}
/>
```

### Change 4: components/course/sidebar-layout.tsx

**Line 129:** Current (from previous fix)
```tsx
"relative h-screen w-full overflow-hidden",
```

**New:**
```tsx
"relative h-full w-full overflow-hidden",
```

**Reasoning:**
- Inside scrollable main, `h-screen` (100vh) won't work correctly
- `h-full` fills parent height (which is the scrollable main)

---

## Testing Checklist

### Basic Functionality
- [ ] NavHeader is always visible (fixed at top)
- [ ] NavHeader doesn't scroll away
- [ ] No page-level scrolling (body doesn't scroll)
- [ ] Main content area scrolls
- [ ] Course dashboard panels scroll independently

### Course Dashboard
- [ ] Filter sidebar scrolls independently
- [ ] Thread list scrolls independently
- [ ] Thread detail scrolls independently
- [ ] Filter collapse/expand works
- [ ] Mobile drawer works
- [ ] Thread selection works

### Other Pages
- [ ] Dashboard page works
- [ ] Ask page works
- [ ] Quokka chat page works
- [ ] Login page works (no nav)

### Responsive
- [ ] Works at 360px (mobile)
- [ ] Works at 768px (tablet)
- [ ] Works at 1024px (laptop)
- [ ] Works at 1280px (desktop)
- [ ] Works at 1920px (large desktop)

### Interactions
- [ ] Navigation links work
- [ ] Breadcrumbs work
- [ ] Ask Question button works
- [ ] User dropdown works
- [ ] Global search works
- [ ] Course tab switching works

---

## Rollback Plan

If issues occur, revert in reverse order:

1. Revert `sidebar-layout.tsx` (h-full → h-screen)
2. Restore `nav-header.tsx` scroll tracking
3. Restore `global-nav-bar.tsx` (fixed → sticky, restore props)
4. Unwrap main from `layout.tsx`
5. Remove flex layout from body

---

## Known Trade-offs

### Lost Features
- ❌ Scroll progress bar (removed)
- ❌ Dynamic nav shadow based on scroll (now always shows)

### Alternative Solutions
- ✅ Could restore scroll progress by tracking main element
- ✅ Could restore shadow effect with intersection observer

### Benefits
- ✅ True fixed layout (Gmail-style)
- ✅ Nav always visible
- ✅ Clean scrolling hierarchy
- ✅ Consistent behavior across app

---

## Post-Implementation

After successful implementation:
1. Update `context.md` with final results
2. Document any deviations from plan
3. Note any discovered issues
4. Create follow-up tasks if needed (e.g., restore scroll progress)

---

## Estimated Diff Size

- **Files changed:** 4-6
- **Lines changed:** ~40-60
- **Risk level:** Medium (affects global layout)
- **Rollback:** Moderate (multiple files to revert)

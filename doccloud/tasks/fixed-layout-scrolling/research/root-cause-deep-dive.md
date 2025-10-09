# Root Cause Deep Dive: Application-Wide Scrolling Issue

**Date:** 2025-10-09
**Status:** Issue Identified

---

## Problem Statement

After implementing `h-screen overflow-hidden` on `SidebarLayout`, the application **still has page-level scrolling**. The navbar scrolls with the page instead of staying fixed.

---

## Layout Hierarchy

```
app/layout.tsx (RootLayout)
  └─ <body> (default overflow behavior)
       ├─ Background decorations (fixed)
       ├─ Providers
       ├─ NavHeader (sticky top-0 - tracks window.scrollY)
       │    ├─ GlobalNavBar (sticky top-0)
       │    └─ CourseContextBar (sticky)
       └─ {children} (course page)
            └─ app/courses/[courseId]/page.tsx
                 └─ SidebarLayout (h-screen overflow-hidden)
                      ├─ FilterSidebar
                      ├─ ThreadListSidebar
                      └─ ThreadDetailPanel
```

---

## Root Cause Analysis

### Problem 1: Body Has Default Overflow

**Current State:**
```tsx
// app/layout.tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  {/* ... */}
</body>
```

- Body has no height constraint
- Body has default `overflow: visible`
- When content exceeds viewport, body scrolls
- Result: **Page-level scrolling occurs**

### Problem 2: NavHeader Uses window.scrollY

**Current Code (nav-header.tsx lines 29-43):**
```tsx
useEffect(() => {
  const handleScroll = () => {
    const sy = window.scrollY;  // ⚠️ Tracks window scroll
    const h = document.documentElement.scrollHeight - window.innerHeight;

    setHasScrolled(sy > 8);
    setScrollProgress(h > 0 ? Math.min(100, Math.max(0, (sy / h) * 100)) : 0);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

- Listens to `window.scrollY` (body/document scroll)
- Expects page-level scrolling to work
- Used for:
  - Shadow effect (`hasScrolled`)
  - Scroll progress bar (`scrollProgress`)

### Problem 3: NavHeader Is Sticky, Not Fixed

**Current Code (global-nav-bar.tsx line 70):**
```tsx
<nav
  className={cn(
    "sticky top-0 z-50 w-full glass-panel-strong border-b border-glass ...",
    // ...
  )}
>
```

- `sticky top-0` requires page-level scrolling to work
- Sticks to top during page scroll
- Won't work with `overflow-hidden` on body

---

## The Conflict

**Fixed Layout Requirements:**
- Body must be `h-screen overflow-hidden`
- NavHeader must be `fixed top-0` (not sticky)
- No page-level scrolling allowed

**Current Implementation:**
- Body allows scrolling (default)
- NavHeader is `sticky` (requires scroll)
- Tracks `window.scrollY` for effects

**Result:** These are incompatible. We need to choose one approach.

---

## Solution Options

### Option A: True Fixed Layout (Recommended)

**Changes Required:**

1. **app/layout.tsx** - Lock body to viewport
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
```

2. **NavHeader positioning** - Change from `sticky` to `fixed`
```tsx
// In GlobalNavBar and CourseContextBar
className="fixed top-0 z-50 w-full ..."
```

3. **Add main content wrapper** - Contains scrollable page content
```tsx
// app/layout.tsx
<body>
  <NavHeader />
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
</body>
```

4. **Remove window.scrollY tracking** - Track main scroll instead
```tsx
// nav-header.tsx
// Either remove scroll effects or track a different scroll container
```

5. **Update SidebarLayout** - Already done (h-screen overflow-hidden)

**Pros:**
- True Gmail-style fixed layout
- NavHeader always visible
- No page-level scrolling
- Clean separation of concerns

**Cons:**
- Breaks scroll progress bar (needs redesign or removal)
- Breaks shadow effect on navbar (needs alternative trigger)
- More files to change (3-4 files)

---

### Option B: Hybrid Approach (Not Recommended)

**Keep page-level scrolling for nav, fix only course dashboard**

**Changes:**
- Revert `SidebarLayout` to `min-h-screen`
- Add wrapper inside course page with `h-screen`
- Nav continues to work with page scroll

**Pros:**
- Minimal changes
- Nav scroll effects still work

**Cons:**
- Inconsistent scrolling behavior
- Doesn't achieve true fixed layout
- NavBar still scrolls out of view
- Not Gmail-style

---

## Recommendation

**Implement Option A: True Fixed Layout**

This is the proper solution for a Gmail-style interface:
- Body locked to viewport
- Nav fixed at top
- Main content area scrolls
- Course dashboard panels scroll independently within main content

---

## Implementation Plan for Option A

### Files to Modify

1. **app/layout.tsx** (Root layout)
   - Add `h-screen overflow-hidden flex flex-col` to body
   - Wrap `{children}` in scrollable main element

2. **components/layout/global-nav-bar.tsx** (Global nav)
   - Change `sticky top-0` to `fixed top-0`
   - Adjust layout for fixed positioning

3. **components/layout/course-context-bar.tsx** (Course nav)
   - Change positioning to work with fixed global nav
   - Adjust top offset

4. **components/layout/nav-header.tsx** (Nav wrapper)
   - Remove or redesign scroll progress tracking
   - Remove or find alternative for shadow effect

5. **app/courses/[courseId]/page.tsx** (Course page)
   - Ensure SidebarLayout fills available space
   - May need height adjustments

---

## Breaking Changes

### Scroll Progress Bar
**Current:** Tracks page scroll percentage
**After:** Either remove or track main content scroll

**Options:**
- Remove entirely (simplest)
- Track main element scroll instead
- Use different visual indicator

### Nav Shadow Effect
**Current:** Appears when `window.scrollY > 8`
**After:** Need alternative trigger

**Options:**
- Always show shadow (simplest)
- Track main element scroll
- Use intersection observer on content

---

## Testing Requirements

After implementation:
1. NavHeader stays fixed at top (doesn't scroll)
2. Course dashboard panels scroll independently
3. No page-level (body) scrolling
4. Mobile drawer still works
5. Filter collapse still works
6. All routes work (not just course dashboard)

---

## Risk Assessment

**Medium Risk:**
- Multiple files affected (4-5 files)
- Changes nav behavior app-wide
- May affect other pages (dashboard, ask page, etc.)
- Scroll effects need redesign

**Mitigation:**
- Test all pages after changes
- Consider removing scroll effects if complex
- Ensure mobile behavior unaffected

---

## Next Steps

1. Confirm Option A (True Fixed Layout) is desired
2. Create detailed implementation plan with exact code changes
3. Implement changes sequentially
4. Test each change before proceeding
5. Update all affected pages

---

## Questions for Clarification

1. **Scroll Progress Bar:** Keep, remove, or redesign?
2. **Nav Shadow:** Always show, or implement alternative trigger?
3. **Other Pages:** Should dashboard, ask page, etc. also have fixed nav?
4. **Mobile Behavior:** Any specific mobile considerations?

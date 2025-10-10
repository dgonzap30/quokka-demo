# Navbar Stacking and Content Cutoff Issue

**Date:** 2025-10-09
**Status:** Identified

---

## Problems Reported

1. **CourseContextBar is hidden** - Not visible below GlobalNavBar
2. **Main content is cut off** - Content hidden under fixed navbar

---

## Root Cause Analysis

### Problem 1: CourseContextBar Not Positioned

**Current State:**
- `GlobalNavBar`: Has `fixed top-0` (56px height)
- `CourseContextBar`: No positioning classes (defaults to static)
- Result: CourseContextBar flows normally but is hidden under fixed GlobalNavBar

**Fix Needed:**
- CourseContextBar needs `fixed top-[56px]` to sit below GlobalNavBar
- Or wrap both in a fixed container

### Problem 2: Main Content Hidden Under Navbar

**Current State:**
```tsx
<body class="h-screen overflow-hidden flex flex-col">
  <NavHeader />  {/* Fixed - takes no layout space */}
  <main class="flex-1 overflow-y-auto">  {/* Starts at top, hidden under navbar */}
    {children}
  </main>
</body>
```

- Fixed elements don't take up layout space
- Main starts at top of viewport
- First 56px (or 56+48px with CourseContextBar) is hidden under navbar

**Fix Needed:**
- Add `padding-top` or `margin-top` to main equal to navbar height
- Account for both GlobalNavBar (56px) and CourseContextBar (48px when present)

---

## Solution Options

### Option A: Fixed NavHeader Container (Recommended)

**Wrap both navbars in a fixed container:**

```tsx
// app/layout.tsx
<body class="h-screen overflow-hidden flex flex-col">
  <NavHeader />  {/* Fixed container with both navbars */}
  <main class="flex-1 overflow-y-auto" style={{paddingTop: 'var(--nav-height)'}}>
    {children}
  </main>
</body>

// components/layout/nav-header.tsx
<div className="fixed top-0 left-0 right-0 z-50">
  <GlobalNavBar />  {/* 56px */}
  {inCourseContext && <CourseContextBar />}  {/* +48px */}
</div>
```

**Pros:**
- Clean stacking
- Single fixed container
- Easy to calculate total height

**Cons:**
- Need to pass total height to main

---

### Option B: Separate Fixed Positioning

**Fix each navbar separately:**

```tsx
// GlobalNavBar
className="fixed top-0 z-50 ..."

// CourseContextBar
className="fixed top-[56px] z-40 ..."

// Main
<main className="flex-1 overflow-y-auto pt-[56px]">  {/* or pt-[104px] in courses */}
```

**Pros:**
- Simpler individual components
- Clear z-index hierarchy

**Cons:**
- Need conditional padding on main (56px vs 104px)
- Hardcoded heights

---

## Recommended Solution: Option A

### Implementation Steps

1. **Wrap navbars in fixed container (nav-header.tsx)**
```tsx
return (
  <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
    <GlobalNavBar ... />
    {inCourseContext && <CourseContextBar ... />}
    <MobileNav ... />
  </header>
);
```

2. **Add padding to main (layout.tsx)**
```tsx
// Calculate: 56px (global) or 104px (global + course)
// Use CSS variable or fixed value
<main className="flex-1 overflow-y-auto pt-14">  {/* 56px = 3.5rem = h-14 */}
  {children}
</main>
```

But wait - we need dynamic padding based on whether CourseContextBar is shown!

---

## Better Solution: Use Flexbox Layout

**Don't use fixed positioning for navbars:**

```tsx
<body class="h-screen overflow-hidden flex flex-col">
  <NavHeader />  {/* Flex item - takes natural height */}
  <main class="flex-1 overflow-y-auto">  {/* Fills remaining space */}
    {children}
  </main>
</body>
```

**Changes:**
- Remove `fixed` from GlobalNavBar (back to `sticky` or normal flow)
- NavHeader is a flex child (not fixed)
- Main automatically fills remaining space

**Pros:**
- No fixed positioning needed
- No manual padding calculation
- Flexbox handles layout automatically

**Cons:**
- Navbar scrolls with main content (not truly fixed)

Wait - that defeats the purpose of fixed layout!

---

## Actual Best Solution: Fixed NavHeader + Spacer

**Keep nav fixed, add spacer:**

```tsx
<body class="h-screen overflow-hidden flex flex-col">
  <NavHeader />  {/* Fixed - renders outside flow */}
  <div className="h-14 shrink-0" />  {/* Spacer - 56px */}
  <main class="flex-1 overflow-y-auto">
    {children}
  </main>
</body>
```

**For course pages, increase spacer:**
```tsx
{/* In course pages: h-14 (56px) + h-12 (48px) = 104px total */}
<div className="h-[104px] shrink-0" />
```

But this requires conditional rendering based on route!

---

## Final Recommendation: Fixed Container + Padding

**Simplest working solution:**

1. **NavHeader wrapper is fixed**
```tsx
// nav-header.tsx
return (
  <div className="fixed top-0 left-0 right-0 z-50">
    <GlobalNavBar />
    {inCourseContext && <CourseContextBar />}
    <MobileNav />
  </div>
);
```

2. **Main has fixed padding-top**
```tsx
// layout.tsx
<main className="flex-1 overflow-y-auto pt-[104px]">
  {/* Max height: 56px global + 48px course = 104px */}
  {/* Non-course pages waste 48px but still work */}
  {children}
</main>
```

**Trade-off:** Non-course pages have extra 48px padding at top (acceptable)

**Alternative:** Use `pt-14` (56px) and let course pages handle extra spacing

---

## Implementation Plan

### Step 1: Wrap NavHeader in Fixed Container

**File:** `components/layout/nav-header.tsx`

Add wrapper div with fixed positioning around the entire return.

### Step 2: Add Padding to Main

**File:** `app/layout.tsx`

Add `pt-[104px]` or `pt-14` to main element.

### Step 3: Test

- GlobalNavBar visible and fixed
- CourseContextBar visible below GlobalNavBar (in course pages)
- Main content starts below navbar (not cut off)
- All pages work

---

## Exact Code Changes

### Change 1: nav-header.tsx

**Current:**
```tsx
return (
  <>
    <GlobalNavBar ... />
    {inCourseContext && <CourseContextBar ... />}
    <MobileNav ... />
  </>
);
```

**New:**
```tsx
return (
  <div className="fixed top-0 left-0 right-0 z-50">
    <GlobalNavBar ... />
    {inCourseContext && <CourseContextBar ... />}
    <MobileNav ... />
  </div>
);
```

### Change 2: global-nav-bar.tsx

**Remove `fixed top-0` (now in parent):**

**Current:**
```tsx
<nav className="fixed top-0 z-50 ...">
```

**New:**
```tsx
<nav className="w-full z-50 ...">
```

### Change 3: layout.tsx

**Add padding-top to main:**

**Current:**
```tsx
<main className="flex-1 overflow-y-auto sidebar-scroll relative">
```

**New:**
```tsx
<main className="flex-1 overflow-y-auto sidebar-scroll relative pt-[104px]">
```

---

## Expected Result

- NavHeader is fixed container at top
- GlobalNavBar + CourseContextBar stack correctly inside
- Main content starts 104px from top (below navbars)
- No content cutoff
- Scrolling works in main

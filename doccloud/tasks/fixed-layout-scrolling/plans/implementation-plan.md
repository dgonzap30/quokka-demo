# Implementation Plan: Fixed Layout Scrolling

**Created:** 2025-10-09
**Updated:** 2025-10-09

---

## Overview

Transform the course dashboard into a Gmail-style fixed layout where the page container is fixed and only individual content panels scroll.

---

## Architecture Decision

### Root Cause Analysis
The current layout uses `min-h-screen` on the root container, which allows the container to grow beyond the viewport height. This causes page-level scrolling instead of container-level scrolling.

### Solution Strategy
- **Change 1**: Convert root container from `min-h-screen` to `h-screen` + `overflow-hidden`
- **Change 2**: Ensure grid container is `h-screen` to fill parent
- **Change 3**: Verify all child panels have proper overflow handling

### Why This Works
- `h-screen` locks the container to viewport height (100vh)
- `overflow-hidden` prevents any page-level scrolling
- Individual panels with `overflow-y-auto` handle their own scrolling
- Grid layout automatically distributes space among columns

---

## Step-by-Step Implementation

### Step 1: Update SidebarLayout Root Container

**File:** `components/course/sidebar-layout.tsx`

**Current Code (Line 127-133):**
```tsx
<div
  className={cn(
    "relative min-h-screen w-full",
    className
  )}
  data-filter-sidebar-open={isFilterSidebarOpen}
>
```

**New Code:**
```tsx
<div
  className={cn(
    "relative h-screen w-full overflow-hidden",
    className
  )}
  data-filter-sidebar-open={isFilterSidebarOpen}
>
```

**Changes:**
- Replace `min-h-screen` with `h-screen` (fixed viewport height)
- Add `overflow-hidden` (prevent page-level scrolling)
- Keep `relative`, `w-full`, and dynamic className

**Rationale:**
- `h-screen` = exactly 100vh (no growing beyond viewport)
- `overflow-hidden` = no scrollbars on the root container
- Forces all scrolling to happen within child panels

---

### Step 2: Verify Grid Container Height

**File:** `components/course/sidebar-layout.tsx`

**Current Code (Line 144-149):**
```tsx
<div
  className={cn(
    "grid h-full transition-all duration-300 ease-in-out",
    gridCols
  )}
>
```

**Status:** ✅ Already Correct

The grid container already uses `h-full`, which will fill the parent's `h-screen`. No changes needed.

---

### Step 3: Verify FilterSidebar Scrolling

**File:** `components/course/filter-sidebar.tsx`

**Current Structure:**
```tsx
<div className="w-full h-screen flex flex-col ...">
  {/* Header - Fixed */}
  <div className="flex-shrink-0 border-b border-glass p-4">...</div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto sidebar-scroll">
    {/* Filter controls */}
  </div>
</div>
```

**Status:** ✅ Already Correct

- Outer container: `h-screen flex flex-col` (fills viewport, flexbox layout)
- Header: `flex-shrink-0` (fixed at top)
- Content: `flex-1 overflow-y-auto` (fills remaining space, scrolls)
- Uses `.sidebar-scroll` for custom scrollbar styling

**No changes needed.**

---

### Step 4: Verify ThreadListSidebar Scrolling

**File:** `components/course/thread-list-sidebar.tsx`

**Current Structure:**
```tsx
<div className="w-full h-screen flex flex-col glass-panel-strong ...">
  {/* Header - Fixed */}
  <div className="flex-shrink-0 border-b border-glass p-4">...</div>

  {/* Scrollable Thread List */}
  <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2">
    {/* Thread cards */}
  </div>

  {/* Footer - Fixed */}
  <div className="flex-shrink-0 border-t border-glass p-3">...</div>
</div>
```

**Status:** ✅ Already Correct

- Outer container: `h-screen flex flex-col` (fills viewport, flexbox layout)
- Header: `flex-shrink-0` (fixed at top)
- Thread list: `flex-1 overflow-y-auto sidebar-scroll` (fills space, scrolls)
- Footer: `flex-shrink-0` (fixed at bottom)

**No changes needed.**

---

### Step 5: Verify ThreadDetailPanel Scrolling

**File:** `components/course/thread-detail-panel.tsx`

**Current Integration (in SidebarLayout):**
```tsx
<main
  className={cn(
    "relative h-screen overflow-y-auto sidebar-scroll",
    "transition-all duration-300 ease-in-out"
  )}
  aria-label="Thread content"
>
  {children}
</main>
```

**Status:** ✅ Already Correct

The main element in `sidebar-layout.tsx` (line 187-194) already has:
- `h-screen` (fills viewport)
- `overflow-y-auto` (scrolls independently)
- `sidebar-scroll` (custom scrollbar styling)

**No changes needed.**

---

## Summary of Changes

### Files to Edit
1. **`components/course/sidebar-layout.tsx`** (Line 129)
   - Change `min-h-screen` to `h-screen overflow-hidden`

### Files Already Correct (No Changes)
- `components/course/filter-sidebar.tsx` ✅
- `components/course/thread-list-sidebar.tsx` ✅
- `components/course/thread-detail-panel.tsx` ✅
- `components/course/sidebar-layout.tsx` (grid container) ✅

---

## Testing Plan

### Manual Testing Checklist

**1. Visual Verification**
- [ ] Page-level scrollbar is gone (body/document doesn't scroll)
- [ ] Filter sidebar has its own scrollbar when content overflows
- [ ] Thread list has its own scrollbar when content overflows
- [ ] Thread detail panel has its own scrollbar when content overflows
- [ ] All three scrollbars are independent (scrolling one doesn't affect others)

**2. Viewport Testing**
- [ ] 360px width (mobile) - Drawer works, no content cut off
- [ ] 768px width (tablet) - All panels visible, scrolling works
- [ ] 1024px width (laptop) - All panels visible, scrolling works
- [ ] 1280px width (desktop) - All panels visible, scrolling works
- [ ] 1920px width (large desktop) - All panels visible, scrolling works

**3. Content Testing**
- [ ] Short thread (2-3 replies) - No unnecessary scrollbars
- [ ] Medium thread (10-15 replies) - Detail panel scrolls smoothly
- [ ] Long thread (30+ replies) - Detail panel scrolls, all content accessible
- [ ] Many threads (50+) - Thread list scrolls smoothly
- [ ] Many tags (20+) - Filter sidebar scrolls smoothly

**4. Interaction Testing**
- [ ] Click thread in list - Opens in detail panel without page scroll
- [ ] Scroll thread detail - Other panels don't scroll
- [ ] Scroll thread list - Other panels don't scroll
- [ ] Scroll filter sidebar - Other panels don't scroll
- [ ] Collapse/expand filter sidebar - Layout adjusts, scrolling still works
- [ ] Post reply - New reply appears, scroll to bottom works

**5. Mobile Testing**
- [ ] Open filter drawer - Overlay appears, thread list still visible
- [ ] Close filter drawer - Drawer slides out, no issues
- [ ] Select thread on mobile - Detail panel works
- [ ] Scroll on mobile - Touch scrolling works smoothly

**6. Keyboard Navigation**
- [ ] Tab through controls - Focus visible during scroll
- [ ] Arrow keys (j/k) - Navigate threads while scrolling
- [ ] Enter on thread - Opens detail without page jump
- [ ] Esc on detail - Closes detail, focus returns to list

**7. Accessibility Testing**
- [ ] Screen reader announces scroll regions
- [ ] ARIA labels present for each scrollable area
- [ ] Focus indicators visible when scrolling
- [ ] No focus traps in any panel

**8. Browser Testing**
- [ ] Chrome/Edge - All scrolling works
- [ ] Firefox - All scrolling works (custom scrollbar colors)
- [ ] Safari - All scrolling works (webkit scrollbars)

---

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build (verify no runtime errors)
npm run build

# Dev server
npm run dev
```

---

## Expected Diff Size

**Minimal change:**
- 1 file: `components/course/sidebar-layout.tsx`
- 1 line changed (line 129)
- Total: ~10 characters changed

---

## Rollback Procedure

If issues occur:

```bash
# Revert the change
git checkout components/course/sidebar-layout.tsx

# Or manually restore
# Change line 129 from:
#   "relative h-screen w-full overflow-hidden",
# Back to:
#   "relative min-h-screen w-full",
```

---

## Success Criteria

### Must Pass
- ✅ No page-level scrolling (document.body.scrollHeight === window.innerHeight)
- ✅ All three panels scroll independently
- ✅ All content accessible (nothing cut off)
- ✅ TypeScript compiles
- ✅ Lint passes
- ✅ No console errors

### Should Pass
- ✅ Works at all viewport sizes (360-1920px)
- ✅ Mobile drawer behavior unchanged
- ✅ Filter collapse behavior unchanged
- ✅ Keyboard navigation works
- ✅ Focus states visible

### Nice to Have
- ✅ Smooth scrolling performance
- ✅ No visual glitches during resize
- ✅ Scrollbars styled consistently

---

## Known Limitations

1. **Fixed 100vh on mobile**: iOS Safari may have address bar issues with `100vh`. This is a known CSS limitation. Current implementation should handle this gracefully.

2. **Nested scrolling**: Some browsers may have issues with nested scroll regions. Testing on target browsers (Chrome, Firefox, Safari) will verify behavior.

3. **Scroll position preservation**: When switching threads, scroll position is reset. This is expected behavior (not a bug).

---

## Post-Implementation

After implementing, update `context.md`:
- Mark acceptance criteria as complete
- Add decision rationale
- Document any deviations from plan
- Note any follow-up tasks discovered

# Architecture Analysis: Current Scrolling Implementation

**Date:** 2025-10-09
**Analyst:** Research Phase

---

## Current Implementation

### Component Hierarchy

```
app/courses/[courseId]/page.tsx
  └─ SidebarLayout (components/course/sidebar-layout.tsx)
       ├─ FilterSidebar (components/course/filter-sidebar.tsx)
       │    ├─ Header (fixed)
       │    ├─ Scrollable Controls (overflow-y-auto)
       │    └─ [No footer]
       ├─ ThreadListSidebar (components/course/thread-list-sidebar.tsx)
       │    ├─ Header (fixed)
       │    ├─ Scrollable Thread List (overflow-y-auto)
       │    └─ Footer (fixed, keyboard hints)
       └─ ThreadDetailPanel (components/course/thread-detail-panel.tsx)
            └─ Wrapped in <main> with overflow-y-auto in SidebarLayout
```

---

## Scrolling Configuration by Component

### 1. SidebarLayout (Main Container)

**File:** `components/course/sidebar-layout.tsx`

**Current Root Container (Line 127-133):**
```tsx
<div
  className={cn(
    "relative min-h-screen w-full",  // ⚠️ PROBLEM: min-h-screen allows growth
    className
  )}
  data-filter-sidebar-open={isFilterSidebarOpen}
>
```

**Problem:**
- `min-h-screen` sets minimum height to 100vh
- Container can grow beyond viewport if content is tall
- Causes page-level (body) scrolling
- Grid children have `h-screen` but parent allows overflow

**Current Grid Container (Line 144-149):**
```tsx
<div
  className={cn(
    "grid h-full transition-all duration-300 ease-in-out",  // ✅ GOOD: h-full fills parent
    gridCols
  )}
>
```

**Analysis:**
- Grid uses `h-full` which should fill parent
- But parent uses `min-h-screen`, not `h-screen`
- Result: Grid can grow beyond viewport

---

### 2. FilterSidebar (Left Panel)

**File:** `components/course/filter-sidebar.tsx`

**Structure:**
```tsx
<div className="w-full h-screen flex flex-col ...">  // ✅ h-screen
  {/* Header (Fixed) */}
  <div className="flex-shrink-0 border-b border-glass p-4">
    {/* Filters title, result count, collapse button */}
  </div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto sidebar-scroll">  // ✅ overflow-y-auto
    <SidebarSearchBar />
    <SidebarFilterPanel />
    <TagCloud />
  </div>
</div>
```

**Analysis:**
- ✅ Outer container: `h-screen flex flex-col` (correct)
- ✅ Header: `flex-shrink-0` (stays fixed at top)
- ✅ Content: `flex-1 overflow-y-auto sidebar-scroll` (fills space, scrolls)
- ✅ Uses custom scrollbar styling (`.sidebar-scroll`)
- **Status:** Already correct, no changes needed

---

### 3. ThreadListSidebar (Middle Panel)

**File:** `components/course/thread-list-sidebar.tsx`

**Structure:**
```tsx
<div className="w-full h-screen flex flex-col glass-panel-strong ...">  // ✅ h-screen
  {/* Header (Fixed) */}
  <div className="flex-shrink-0 border-b border-glass p-4">
    {/* "Threads" title, count */}
  </div>

  {/* Scrollable Thread List */}
  <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2">  // ✅ overflow-y-auto
    {/* Loading skeletons OR empty state OR thread cards */}
  </div>

  {/* Footer (Fixed) */}
  <div className="flex-shrink-0 border-t border-glass p-3">
    {/* Keyboard hints (j/k navigation) */}
  </div>
</div>
```

**Analysis:**
- ✅ Outer container: `h-screen flex flex-col` (correct)
- ✅ Header: `flex-shrink-0` (stays fixed at top)
- ✅ Thread list: `flex-1 overflow-y-auto sidebar-scroll` (fills space, scrolls)
- ✅ Footer: `flex-shrink-0` (stays fixed at bottom)
- ✅ Uses custom scrollbar styling (`.sidebar-scroll`)
- **Status:** Already correct, no changes needed

---

### 4. ThreadDetailPanel (Right Panel)

**File:** `components/course/thread-detail-panel.tsx`

**Component Structure:**
```tsx
<div className={cn("space-y-8 p-4 md:p-6 lg:p-8 max-w-full overflow-hidden", className)}>
  {/* Back button */}
  {/* Thread question card */}
  {/* AI answer card */}
  {/* Replies section */}
  {/* Reply form */}
</div>
```

**Wrapper in SidebarLayout (Line 187-194):**
```tsx
<main
  className={cn(
    "relative h-screen overflow-y-auto sidebar-scroll",  // ✅ h-screen + overflow-y-auto
    "transition-all duration-300 ease-in-out"
  )}
  aria-label="Thread content"
>
  {children}  {/* ThreadDetailPanel rendered here */}
</main>
```

**Analysis:**
- ✅ Main wrapper: `h-screen overflow-y-auto sidebar-scroll` (correct)
- ✅ Inner content: Natural flow with `space-y-8` spacing
- ✅ Uses custom scrollbar styling (`.sidebar-scroll`)
- **Status:** Already correct, no changes needed

---

## Custom Scrollbar Styling

**File:** `app/globals.css` (Lines 916-939)

```css
/* Webkit browsers (Chrome, Edge, Safari) */
.sidebar-scroll::-webkit-scrollbar {
  width: 8px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--glass-subtle) 50%, transparent);
  border-radius: 4px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--glass-medium) 70%, transparent);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--glass-strong) 80%, transparent);
}

/* Firefox */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--glass-medium) 70%, transparent)
                   color-mix(in srgb, var(--glass-subtle) 50%, transparent);
}
```

**Analysis:**
- ✅ Consistent 8px scrollbar width
- ✅ Uses QDS glass tokens (glass-subtle, glass-medium, glass-strong)
- ✅ Smooth hover transitions
- ✅ Firefox fallback with `scrollbar-width: thin`
- **Status:** Already correct, no changes needed

---

## Grid Layout Behavior

### Column Configuration

**Dynamic Grid Columns (Line 112-124 in sidebar-layout.tsx):**

```tsx
const gridCols = (() => {
  // No thread selected: 2-column grid, threads expand to fill space
  if (!selectedThreadId) {
    return isFilterSidebarOpen
      ? "lg:grid-cols-[minmax(200px,220px)_1fr]"      // Filter open, threads expand
      : "lg:grid-cols-[minmax(48px,56px)_1fr]";       // Filter compact, threads expand
  }

  // Thread selected: 3-column grid, threads responsive width
  return isFilterSidebarOpen
    ? "lg:grid-cols-[minmax(200px,220px)_minmax(280px,400px)_1fr]"  // All responsive
    : "lg:grid-cols-[minmax(48px,56px)_minmax(280px,400px)_1fr]";   // All responsive
})();
```

**Analysis:**
- ✅ Responsive grid using CSS Grid `minmax()`
- ✅ Filter sidebar: 200-220px (expanded) or 48-56px (compact)
- ✅ Thread list: Always visible, 280-400px when thread selected
- ✅ Thread detail: `1fr` (fills remaining space)
- ✅ Mobile breakpoint: Switches to single column below `lg` (1024px)
- **Status:** Grid logic is sound, no changes needed

---

## Root Cause of Issue

### The Problem

**Current behavior:**
1. Root container uses `min-h-screen` (minimum 100vh)
2. If content is taller than viewport, container grows beyond 100vh
3. Body/document scrolls to show overflowing content
4. Result: Page-level scrolling instead of container-level scrolling

**Desired behavior:**
1. Root container uses `h-screen` (exactly 100vh)
2. Container is locked to viewport height
3. Overflow is hidden at root level
4. Individual panels handle their own scrolling
5. Result: No page-level scrolling, only panel-level scrolling

### Why Current Implementation Almost Works

The child components are actually **already configured correctly:**
- All three panels use `h-screen flex flex-col`
- Content areas use `flex-1 overflow-y-auto`
- Scrollbar styling is already applied

**The only issue is the root container allowing growth.**

---

## Minimal Change Required

### Single Change Needed

**File:** `components/course/sidebar-layout.tsx` (Line 129)

**From:**
```tsx
"relative min-h-screen w-full",
```

**To:**
```tsx
"relative h-screen w-full overflow-hidden",
```

**Changes:**
- `min-h-screen` → `h-screen` (lock to viewport height)
- Add `overflow-hidden` (prevent page-level scroll)

**Impact:**
- Root container is now exactly 100vh (no growth)
- Page-level scrolling is impossible
- All scrolling happens within panels (already configured)
- Zero changes needed to child components

---

## Testing Implications

### Areas to Verify

1. **Visual:**
   - No page-level scrollbar appears
   - Each panel has its own scrollbar when content overflows
   - Scrollbars are independent (scrolling one doesn't affect others)

2. **Responsive:**
   - Works at 360px, 768px, 1024px, 1280px, 1920px
   - Mobile drawer behavior unchanged
   - Filter collapse behavior unchanged

3. **Content:**
   - Short threads: No unnecessary scrollbars
   - Long threads: Detail panel scrolls, all content accessible
   - Many threads: Thread list scrolls smoothly
   - Many tags: Filter sidebar scrolls smoothly

4. **Interaction:**
   - Clicking thread opens detail without page jump
   - Scrolling one panel doesn't affect others
   - Keyboard navigation (j/k) still works
   - Focus indicators visible during scroll

---

## Risks

### Low Risk

**Why this change is low-risk:**
1. **Single line change** - Minimal code modification
2. **Child components already correct** - No cascading changes needed
3. **Reversible** - Easy to revert if issues found
4. **Well-tested pattern** - Gmail, Slack, Discord all use this approach
5. **Existing scrollbar styling** - No CSS additions needed

### Mitigation

If issues arise:
- Revert single line change
- Original behavior restored immediately
- No data or state affected

---

## Recommendations

### Primary Recommendation

**Implement the single-line change:**
- Change line 129 in `sidebar-layout.tsx`
- From: `"relative min-h-screen w-full",`
- To: `"relative h-screen w-full overflow-hidden",`

### Testing Sequence

1. **Immediate verification:**
   - Load course dashboard
   - Check for page-level scrollbar (should be gone)
   - Verify each panel scrolls independently

2. **Responsive testing:**
   - Test at multiple viewport sizes
   - Verify mobile drawer still works
   - Verify filter collapse still works

3. **Content testing:**
   - Test with varying thread lengths
   - Test with many threads in list
   - Test with many tags in filter

4. **TypeScript/Lint:**
   - Run `npx tsc --noEmit`
   - Run `npm run lint`
   - Verify no new errors

### Alternative Approaches Considered

❌ **Option 1: Modify each child component**
- More changes required
- Higher risk of breaking existing behavior
- Not necessary (children already correct)

❌ **Option 2: Use `overflow: scroll` instead of `overflow: hidden`**
- Would show disabled scrollbar on root
- Doesn't prevent scrolling attempt
- Less clean UX

✅ **Option 3: Single root change (RECOMMENDED)**
- Minimal modification
- Leverages existing correct child structure
- Clean, maintainable solution

---

## Conclusion

The existing architecture is **almost perfect**. All three panels are already configured with:
- Correct heights (`h-screen`)
- Correct overflow (`overflow-y-auto`)
- Correct flex layout (`flex flex-col`)
- Correct scrollbar styling (`.sidebar-scroll`)

The **only issue** is the root container using `min-h-screen` instead of `h-screen`.

**Confidence Level:** Very High (95%)

**Recommendation:** Proceed with implementation.

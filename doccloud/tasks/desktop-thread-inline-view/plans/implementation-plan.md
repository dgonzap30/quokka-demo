# Desktop Thread Inline View - Implementation Plan

**Date:** 2025-10-14
**Based on:** research/responsive-strategy.md
**Estimated Time:** 4-5 hours

---

## Overview

Restore Gmail-style expanding thread interface on desktop while maintaining mobile modal experience through responsive rendering based on viewport size.

**Approach:** Hybrid conditional rendering using useMediaQuery hook with hydration safety.

---

## Step-by-Step Implementation

### Step 1: Create useMediaQuery Hook

**File:** `lib/hooks/use-media-query.ts` (NEW)

**Purpose:** Reusable hook for viewport detection with proper event cleanup

**Implementation:**
```typescript
import { useState, useEffect } from 'react';

/**
 * Hook to detect viewport size using matchMedia API
 *
 * @param query - Media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating if query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    // Legacy fallback
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}
```

**Verification:**
- [ ] TypeScript compiles
- [ ] Hook can be imported and used
- [ ] Returns correct boolean value

**Files Changed:** 1 new file

---

### Step 2: Update CourseDetailPage - Add Viewport Detection

**File:** `app/courses/[courseId]/page.tsx`

**Changes:**

1. Import new hook at top:
```typescript
import { useMediaQuery } from "@/lib/hooks/use-media-query";
```

2. Add viewport detection state in `CourseDetailContent` function (after existing useState calls, around line 34):
```typescript
// Viewport detection for responsive thread display
const [isMounted, setIsMounted] = useState(false);
const isMobile = useMediaQuery('(max-width: 767px)'); // < 768px = mobile

useEffect(() => {
  setIsMounted(true);
}, []);

// Determine if we should use modal (mobile) or inline (desktop)
// During SSR and first render, default to desktop (inline)
const shouldUseModal = isMounted && isMobile;
```

**Explanation:**
- `isMounted` prevents hydration mismatch (SSR doesn't have window)
- Default to desktop view during SSR (safer for SEO)
- Switch to correct view after client hydration
- 767px breakpoint matches existing SidebarLayout logic

**Verification:**
- [ ] No TypeScript errors
- [ ] Component renders without errors
- [ ] shouldUseModal is boolean

**Files Changed:** 1 modified

---

### Step 3: Update CourseDetailPage - Conditional ThreadModal Rendering

**File:** `app/courses/[courseId]/page.tsx`

**Location:** Lines 246-262 (ThreadModal section)

**Change FROM:**
```typescript
{/* Thread Detail Modal */}
<ThreadModal
  open={!!selectedThreadId}
  onOpenChange={(open) => {
    if (!open) {
      setSelectedThreadId(null);
      // Remove thread param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('thread');
      const newUrl = params.toString()
        ? `/courses/${courseId}?${params.toString()}`
        : `/courses/${courseId}`;
      window.history.replaceState(null, '', newUrl);
    }
  }}
  threadId={selectedThreadId}
/>
```

**Change TO:**
```typescript
{/* Thread Detail Modal (Mobile Only) */}
{shouldUseModal && (
  <ThreadModal
    open={!!selectedThreadId}
    onOpenChange={(open) => {
      if (!open) {
        setSelectedThreadId(null);
        // Remove thread param from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete('thread');
        const newUrl = params.toString()
          ? `/courses/${courseId}?${params.toString()}`
          : `/courses/${courseId}`;
        window.history.replaceState(null, '', newUrl);
      }
    }}
    threadId={selectedThreadId}
  />
)}
```

**Explanation:**
- Wrap ThreadModal in conditional: `{shouldUseModal && ...}`
- Only renders on mobile viewports
- Same close behavior, just conditionally rendered

**Verification:**
- [ ] Modal appears on mobile (< 768px)
- [ ] Modal does not render on desktop (≥ 768px)
- [ ] Close button still works

**Files Changed:** 1 modified (same file)

---

### Step 4: Update SidebarLayout - Add Inline Thread Detail

**File:** `app/courses/[courseId]/page.tsx`

**Location:** Lines 216-244 (SidebarLayout section)

**Change FROM:**
```typescript
<SidebarLayout
  courseId={courseId}
  initialThreadId={selectedThreadId}
  selectedThreadId={selectedThreadId}
  filterSidebar={
    <FilterSidebar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      tags={tagsWithCounts}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      totalThreads={threads?.length || 0}
      filteredThreads={filteredThreads.length}
    />
  }
  threadListSidebar={
    <ThreadListSidebar
      threads={filteredThreads}
      selectedThreadId={selectedThreadId}
      onThreadSelect={handleThreadSelect}
      isLoading={threadsLoading}
      currentUserId={user?.id}
    />
  }
>
  {/* Empty - thread detail now shown in modal */}
</SidebarLayout>
```

**Change TO:**
```typescript
<SidebarLayout
  courseId={courseId}
  initialThreadId={selectedThreadId}
  selectedThreadId={selectedThreadId}
  filterSidebar={
    <FilterSidebar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      tags={tagsWithCounts}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      totalThreads={threads?.length || 0}
      filteredThreads={filteredThreads.length}
    />
  }
  threadListSidebar={
    <ThreadListSidebar
      threads={filteredThreads}
      selectedThreadId={selectedThreadId}
      onThreadSelect={handleThreadSelect}
      isLoading={threadsLoading}
      currentUserId={user?.id}
    />
  }
>
  {/* Thread Detail (Desktop Inline - Gmail Style) */}
  {!shouldUseModal && selectedThreadId && (
    <ThreadDetailPanel
      threadId={selectedThreadId}
      onClose={() => {
        setSelectedThreadId(null);
        // Remove thread param from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete('thread');
        const newUrl = params.toString()
          ? `/courses/${courseId}?${params.toString()}`
          : `/courses/${courseId}`;
        window.history.replaceState(null, '', newUrl);
      }}
      className="animate-in fade-in duration-200"
    />
  )}
</SidebarLayout>
```

**Explanation:**
- Add ThreadDetailPanel as children of SidebarLayout
- Only render on desktop (`!shouldUseModal`)
- Only render when thread selected (`selectedThreadId`)
- Same close handler as modal (maintains URL state sync)
- Add fade-in animation for smooth appearance
- Import ThreadDetailPanel at top if not already imported

**Verification:**
- [ ] Thread detail shows in third column on desktop
- [ ] Thread detail hidden when no thread selected
- [ ] Close button deselects thread and updates URL
- [ ] Fade-in animation works smoothly

**Files Changed:** 1 modified (same file)

---

### Step 5: Add ThreadDetailPanel Import (if needed)

**File:** `app/courses/[courseId]/page.tsx`

**Location:** Top of file with other imports (around line 14)

**Check if exists:**
```typescript
import { ThreadDetailPanel } from "@/components/course/thread-detail-panel";
```

**If not present, add it:**
```typescript
import { ThreadDetailPanel } from "@/components/course/thread-detail-panel";
```

**Verification:**
- [ ] Import exists
- [ ] No TypeScript errors

**Files Changed:** 1 modified (same file, if import missing)

---

### Step 6: Update ThreadDetailPanel - Add Context Prop (Optional Enhancement)

**File:** `components/course/thread-detail-panel.tsx`

**Purpose:** Differentiate ARIA attributes for modal vs inline context

**Changes:**

1. Update interface (around line 16):
```typescript
export interface ThreadDetailPanelProps {
  /**
   * Thread ID to display
   */
  threadId: string | null;

  /**
   * Optional close handler (for mobile)
   */
  onClose?: () => void;

  /**
   * Rendering context for accessibility
   * @default "modal"
   */
  context?: "modal" | "inline";

  /**
   * Optional className for composition
   */
  className?: string;
}
```

2. Update component signature (line 59):
```typescript
export function ThreadDetailPanel({
  threadId,
  onClose,
  context = "modal",
  className,
}: ThreadDetailPanelProps) {
```

3. Update main container ARIA (line 161):
```typescript
<div
  className={cn("space-y-8 p-4 md:p-6 lg:p-8 max-w-full", className)}
  role={context === "inline" ? "region" : undefined}
  aria-label={context === "inline" ? "Thread detail" : undefined}
>
```

**Explanation:**
- Add optional `context` prop (defaults to "modal" for backward compatibility)
- When `context="inline"`, add ARIA region for screen readers
- When `context="modal"`, Dialog component handles ARIA
- No visual changes, only accessibility improvements

**Verification:**
- [ ] TypeScript compiles
- [ ] Component works in both modal and inline contexts
- [ ] Screen reader announces region correctly

**Files Changed:** 1 modified

**Note:** This step is optional but recommended for better accessibility

---

### Step 7: Update Page to Pass Context Prop

**File:** `app/courses/[courseId]/page.tsx`

**Location:** Line where ThreadDetailPanel is rendered in SidebarLayout (Step 4)

**Change FROM:**
```typescript
<ThreadDetailPanel
  threadId={selectedThreadId}
  onClose={() => {
    setSelectedThreadId(null);
    // Remove thread param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('thread');
    const newUrl = params.toString()
      ? `/courses/${courseId}?${params.toString()}`
      : `/courses/${courseId}`;
    window.history.replaceState(null, '', newUrl);
  }}
  className="animate-in fade-in duration-200"
/>
```

**Change TO:**
```typescript
<ThreadDetailPanel
  threadId={selectedThreadId}
  onClose={() => {
    setSelectedThreadId(null);
    // Remove thread param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('thread');
    const newUrl = params.toString()
      ? `/courses/${courseId}?${params.toString()}`
      : `/courses/${courseId}`;
    window.history.replaceState(null, '', newUrl);
  }}
  context="inline"
  className="animate-in fade-in duration-200"
/>
```

**Explanation:**
- Pass `context="inline"` to ThreadDetailPanel
- Enables proper ARIA attributes for desktop inline view
- Modal still uses default `context="modal"`

**Verification:**
- [ ] No TypeScript errors
- [ ] Component renders correctly

**Files Changed:** 1 modified (same file)

---

### Step 8: Handle Viewport Resize Edge Case

**File:** `app/courses/[courseId]/page.tsx`

**Purpose:** Close modal gracefully when resizing from mobile to desktop with thread open

**Location:** After existing useEffect hooks (around line 120)

**Add new useEffect:**
```typescript
// Handle viewport resize: if switching from mobile to desktop with thread open,
// ensure modal closes and inline view shows
useEffect(() => {
  // Only run after mount to avoid SSR issues
  if (!isMounted) return;

  // If we have a selected thread and viewport changes, rendering will handle it
  // No action needed - React will re-render with correct component
}, [isMounted, shouldUseModal, selectedThreadId]);
```

**Explanation:**
- This useEffect is mostly for documentation
- React automatically handles re-rendering on state change
- Modal/inline switch is handled by conditional rendering
- Could add console.log for debugging if needed

**Verification:**
- [ ] Resize from mobile to desktop works smoothly
- [ ] Resize from desktop to mobile works smoothly
- [ ] No errors in console

**Files Changed:** 1 modified (same file)

**Note:** This step is optional - React handles this automatically. Include only if testing reveals issues.

---

## Testing Checklist

### Manual Testing

**Viewport Sizes:**
- [ ] 360px: Thread opens in modal
- [ ] 768px: Thread opens inline (third column appears)
- [ ] 1024px: Thread opens inline (third column appears)
- [ ] 1280px: Thread opens inline (third column appears)

**Interactions:**
- [ ] Click thread on mobile: Modal opens
- [ ] Click thread on desktop: Inline detail appears
- [ ] Close modal on mobile: Returns to thread list
- [ ] Close inline on desktop: Third column collapses
- [ ] Click same thread again: Deselects thread
- [ ] URL updates correctly in both contexts

**Viewport Resize:**
- [ ] Open thread on mobile, resize to desktop: Switches to inline
- [ ] Open thread on desktop, resize to mobile: Switches to modal
- [ ] Resize with no thread: No errors
- [ ] Multiple rapid resizes: No crashes

**Keyboard Navigation:**
- [ ] Tab works in modal
- [ ] Tab works in inline view
- [ ] ESC closes modal on mobile
- [ ] ESC deselects thread on desktop (via close button)
- [ ] Focus indicators visible

**Screen Reader:**
- [ ] Modal announced correctly on mobile
- [ ] Inline region announced on desktop
- [ ] Thread selection announced
- [ ] Thread deselection announced

### Automated Testing

**TypeScript:**
```bash
npx tsc --noEmit
```
- [ ] No errors

**Linting:**
```bash
npm run lint
```
- [ ] No errors or warnings

**Build:**
```bash
npm run build
```
- [ ] Build succeeds
- [ ] No warnings about unused variables

**Development Mode:**
```bash
npm run dev
```
- [ ] No console errors
- [ ] Hot reload works
- [ ] Thread selection works

---

## Rollback Plan

If critical issues found:

1. **Revert Step 3-4**: Comment out conditional rendering, always use modal
2. **Keep Step 1-2**: useMediaQuery hook is harmless if unused
3. **Keep Step 6**: Context prop is optional and backward compatible

**Rollback Code:**
```typescript
// Temporary: Always use modal until issues resolved
const shouldUseModal = true; // isMounted && isMobile;
```

---

## Acceptance Criteria Verification

After implementation, verify all criteria from context.md:

### Visual & Layout
- [ ] Mobile (< 768px): Thread opens in full-screen modal ✓
- [ ] Desktop (≥ 768px): Thread displays inline in third column ✓
- [ ] Desktop: Three-column layout when thread selected ✓
- [ ] Desktop: Two-column layout when no thread selected ✓
- [ ] Smooth transitions when selecting/deselecting threads ✓
- [ ] No layout shifts on viewport resize ✓
- [ ] Back button works correctly in both contexts ✓

### Accessibility
- [ ] Keyboard navigation works in both contexts ✓
- [ ] Focus management correct (modal traps, inline flows) ✓
- [ ] ARIA labels appropriate for context ✓
- [ ] Screen reader announces correctly ✓
- [ ] ESC key behavior correct ✓

### Code Quality
- [ ] TypeScript compiles without errors ✓
- [ ] ESLint passes with no warnings ✓
- [ ] Production build succeeds ✓
- [ ] No console errors ✓
- [ ] QDS tokens used (existing styles maintained) ✓
- [ ] DRY principle: ThreadDetailPanel reused ✓

---

## Summary

**Files Modified:**
1. `lib/hooks/use-media-query.ts` (NEW) - Viewport detection hook
2. `app/courses/[courseId]/page.tsx` - Conditional rendering logic
3. `components/course/thread-detail-panel.tsx` - Optional context prop

**Total Changes:** 3 files, ~50 lines of code

**Estimated Time:** 4-5 hours
- Implementation: 2-3 hours
- Testing: 1-2 hours
- Documentation updates: 30 minutes

**Risk Level:** Low
- Changes isolated to one page
- No component API breaking changes
- Easy to rollback if needed
- Existing functionality preserved

---

## Next Steps After Implementation

1. Update context.md with implementation notes
2. Add changelog entry
3. Consider Playwright tests for viewport switching (future)
4. Monitor for user feedback on desktop thread viewing
5. Consider adding keyboard shortcuts (e.g., 'x' to close thread)

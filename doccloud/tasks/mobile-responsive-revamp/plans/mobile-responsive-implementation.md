# Mobile Responsive Implementation Plan

**Date:** 2025-10-14
**Component Architect Agent**
**Task:** Phased Mobile Responsive Refactor

---

## Overview

This plan provides a **step-by-step implementation roadmap** for mobile responsive patterns across QuokkaQ. Each step includes exact file paths, specific code changes, testing checkpoints, and rollback strategies.

**Philosophy:** Small, verified changes. Each phase builds on the previous and can be tested independently.

---

## Phase 1: Navigation & Layout Foundation

**Goal:** Establish mobile navigation and fix critical layout issues
**Duration:** 2-3 implementation sessions
**Priority:** CRITICAL

### Step 1.1: Integrate MobileNav into GlobalNavBar

**Files to Modify:**
- `components/layout/global-nav-bar.tsx`
- `components/layout/nav-header.tsx` (if needed)

**Changes:**

1. **Import MobileNav** at top of `global-nav-bar.tsx`:
```tsx
import { MobileNav } from "@/components/layout/mobile-nav";
```

2. **Add state for mobile nav** (after line 77):
```tsx
const [mobileNavOpen, setMobileNavOpen] = useState(false);
```

3. **Add MobileNav trigger** (before Logo, around line 93):
```tsx
{/* Mobile Navigation Trigger */}
<div className="md:hidden">
  <MobileNav
    currentPath={router.pathname || "/"}
    user={user}
    onLogout={onLogout}
    onAskQuestion={onAskQuestion}
    onOpenAIAssistant={onOpenAIAssistant}
    onOpenSupport={onOpenSupport}
    onOpenSettings={onOpenSettings}
  />
</div>
```

4. **Update GlobalNavBar interface** (add optional currentPath):
```tsx
export interface GlobalNavBarProps {
  // ... existing props

  /** Current route path for mobile nav highlighting */
  currentPath?: string;
}
```

5. **Pass currentPath to MobileNav** in NavHeader component wrapper (if applicable).

**Before/After:**

**Before:**
```tsx
<nav>
  <div className="flex items-center gap-3">
    <Link href="/dashboard">QuokkAQ</Link>
    {/* Breadcrumb */}
  </div>
  <Search className="hidden md:block" />
  <Actions className="hidden md:flex" />
</nav>
```

**After:**
```tsx
<nav>
  <div className="flex items-center gap-3">
    <MobileNav className="md:hidden" /> {/* NEW */}
    <Link href="/dashboard">QuokkAQ</Link>
    {/* Breadcrumb */}
  </div>
  <Search className="hidden md:block" />
  <Actions className="hidden md:flex" />
</nav>
```

**Testing Checkpoint:**
- [ ] Mobile nav trigger visible on mobile (< 768px)
- [ ] Mobile nav trigger hidden on desktop (≥ 768px)
- [ ] Clicking trigger opens drawer from left
- [ ] All actions (Ask, AI, Support, Settings) accessible in drawer
- [ ] User profile displays correctly
- [ ] Logout works
- [ ] Drawer closes on navigation
- [ ] Focus returns to trigger on close

**Rollback:** Remove MobileNav component, test navbar still functions.

---

### Step 1.2: Add Search to Mobile Nav

**Files to Modify:**
- `components/layout/mobile-nav.tsx`

**Changes:**

1. **Import GlobalSearch** at top:
```tsx
import { GlobalSearch } from "@/components/ui/global-search";
```

2. **Add search section** after SheetHeader (after line 101):
```tsx
{/* Search Bar - Mobile Only */}
<div className="mt-4 px-2">
  <GlobalSearch placeholder="Search threads..." />
</div>
<Separator className="my-4" />
```

**Before/After:**

**Before:**
```tsx
<SheetContent>
  <SheetHeader>
    <SheetTitle>QuokkAQ</SheetTitle>
  </SheetHeader>

  {/* Course Back Button */}
  {courseContext && ...}
```

**After:**
```tsx
<SheetContent>
  <SheetHeader>
    <SheetTitle>QuokkAQ</SheetTitle>
  </SheetHeader>

  {/* Search Bar - Mobile Only */}
  <div className="mt-4 px-2">
    <GlobalSearch placeholder="Search threads..." />
  </div>
  <Separator className="my-4" />

  {/* Course Back Button */}
  {courseContext && ...}
```

**Testing Checkpoint:**
- [ ] Search bar visible in mobile drawer
- [ ] Search bar functions correctly (queries, results)
- [ ] Search bar has proper focus management
- [ ] Keyboard navigation works (Tab, Enter, Escape)

**Rollback:** Remove search section, verify drawer still functions.

---

### Step 1.3: Fix Root Layout Padding

**Files to Modify:**
- `app/layout.tsx`

**Changes:**

1. **Update main padding** (line 75):
```tsx
// BEFORE
<main className="flex-1 overflow-y-auto sidebar-scroll relative pt-[104px]">

// AFTER
<main className="flex-1 overflow-y-auto sidebar-scroll relative pt-14 md:pt-[104px]">
// pt-14 = 56px (navbar height on mobile)
// pt-[104px] = 104px (navbar + breadcrumb on desktop)
```

2. **Ensure body overflow is correct**:
```tsx
// Line 30 - Keep as is, but verify no mobile scroll issues
<body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden flex flex-col`}>
```

**Alternative if scroll issues persist:**
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden flex flex-col`}>
```

**Testing Checkpoint:**
- [ ] Content not hidden behind navbar on mobile
- [ ] Content not hidden behind navbar on desktop
- [ ] Page scrolls correctly on mobile
- [ ] No horizontal scrolling
- [ ] Fixed background animations don't cause jank

**Rollback:** Revert padding to `pt-[104px]`.

---

### Step 1.4: Reduce Background Animation on Mobile

**Files to Modify:**
- `app/layout.tsx`

**Changes:**

1. **Add conditional animation classes** (line 43-68):
```tsx
<div
  className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl lg:animate-liquid-float"
  style={{
    background: 'radial-gradient(circle, rgba(138,107,61,0.15) 0%, transparent 70%)',
    animationDelay: '0s',
    animationDuration: '20s'
  }}
/>
```

**Change all three gradient divs from:**
```tsx
className="... animate-liquid-float"
```

**To:**
```tsx
className="... lg:animate-liquid-float"
```

**Alternative (CSS approach):** Add to `app/globals.css`:
```css
@media (max-width: 1023px) {
  .animate-liquid-float {
    animation: none !important;
  }
}
```

**Testing Checkpoint:**
- [ ] Background animations disabled on mobile
- [ ] Background animations work on desktop
- [ ] No performance degradation on mobile
- [ ] Smooth scrolling on mobile devices

**Rollback:** Remove `lg:` prefix, animations run on all devices.

---

## Phase 2: Touch Target Compliance (WCAG 2.2 AA)

**Goal:** Ensure all interactive elements meet 44x44px minimum
**Duration:** 1-2 implementation sessions
**Priority:** HIGH (Accessibility)

### Step 2.1: Fix Button Component Sizes

**Files to Modify:**
- `components/ui/button.tsx`

**Changes:**

1. **Update size variants** (line 30-33):
```tsx
// BEFORE
size: {
  default: "h-10 px-4 py-2 has-[>svg]:px-3",
  sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-10",
}

// AFTER
size: {
  default: "h-11 lg:h-10 px-4 py-2 has-[>svg]:px-3",
  sm: "h-11 lg:h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-11 lg:size-10",
}
```

**Explanation:**
- Mobile: Force 44px height (h-11)
- Desktop: Allow 40px height (h-10) for denser layouts
- Icon buttons: 44x44px mobile, 40x40px desktop

**Testing Checkpoint:**
- [ ] All buttons are 44px+ on mobile (< 1024px)
- [ ] All buttons are 40px on desktop (≥ 1024px)
- [ ] Icon buttons are square (44x44 / 40x40)
- [ ] Button text doesn't overflow
- [ ] Hover/focus states work correctly
- [ ] Active state (scale) works correctly

**Visual Test:**
```tsx
// Test component
<div className="space-y-4 p-4">
  <Button size="default">Default Button</Button>
  <Button size="sm">Small Button</Button>
  <Button size="lg">Large Button</Button>
  <Button size="icon"><Settings /></Button>
</div>
```

**Rollback:** Revert size changes, document WCAG violation.

---

### Step 2.2: Fix Icon Button Touch Targets in Cards

**Files to Modify:**
- `components/dashboard/stat-card.tsx`
- `components/course/thread-card.tsx`
- Any component with clickable icons < 44px

**Changes for StatCard:**

1. **Update icon wrapper** (line 167-170):
```tsx
// BEFORE
<div className="rounded-lg bg-primary/10 p-2">
  <Icon className="size-4 text-primary" />
</div>

// AFTER
<div className="rounded-lg bg-primary/10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon className="size-5 text-primary" />
</div>
```

**Explanation:**
- Increase icon size from size-4 (16px) to size-5 (20px)
- Ensure wrapper is 44x44px minimum
- Center icon in wrapper

**Changes for ThreadCard:**
No changes needed - ThreadCard doesn't have interactive icons, only the card itself is clickable.

**Testing Checkpoint:**
- [ ] All icon buttons are 44x44px minimum
- [ ] Icons are centered within touch target
- [ ] Visual appearance is balanced
- [ ] Hover/focus states cover full 44px area

**Rollback:** Revert size changes.

---

### Step 2.3: Ensure Minimum Touch Spacing

**Files to Modify:**
- `components/layout/global-nav-bar.tsx` (action buttons)
- `components/dashboard/stat-card.tsx`
- Any component with adjacent buttons

**Changes:**

1. **Update GlobalNavBar action buttons** (line 133):
```tsx
// BEFORE
<div className="hidden md:flex items-center gap-3">

// AFTER
<div className="hidden md:flex items-center gap-2 md:gap-3">
// Mobile: 8px gap (gap-2) for touch separation
// Desktop: 12px gap (gap-3) for visual balance
```

**Testing Checkpoint:**
- [ ] Minimum 8px spacing between all touch targets
- [ ] No accidental touches on adjacent buttons
- [ ] Visual spacing looks balanced

**Rollback:** Revert gap changes.

---

## Phase 3: Dashboard Responsive Patterns

**Goal:** Optimize dashboard layouts for mobile
**Duration:** 2-3 implementation sessions
**Priority:** HIGH

### Step 3.1: Fix Student Dashboard Hero Text

**Files to Modify:**
- `app/dashboard/page.tsx`

**Changes:**

1. **Update hero heading** (line 138):
```tsx
// BEFORE
<h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold glass-text">

// AFTER
<h1 id="welcome-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">
// Mobile (< 640px): 30px (text-3xl)
// Small (640-767px): 36px (text-4xl)
// Medium+ (768px+): 48px (text-5xl)
```

2. **Update subtitle** (line 139):
```tsx
// BEFORE
<p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">

// AFTER
<p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
// Mobile: 18px (text-lg)
// Small+: 20px (text-xl)
```

**Before/After:**
- **360px mobile:** Hero at 30px instead of 36px (more space for content)
- **Desktop:** No change, remains at 48px

**Testing Checkpoint:**
- [ ] Hero text readable on 360px screen
- [ ] Hero text doesn't overwhelm viewport
- [ ] Text scales smoothly across breakpoints
- [ ] Line height maintains readability

**Rollback:** Revert text size classes.

---

### Step 3.2: Optimize Student Stats Grid

**Files to Modify:**
- `app/dashboard/page.tsx`

**Changes:**

1. **Update stats grid** (line 206):
```tsx
// BEFORE
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// AFTER
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// Mobile (< 640px): 1 column stack
// Small (640-1023px): 2 columns
// Large (1024px+): 4 columns
```

2. **Reduce stat card value size** (in `components/dashboard/stat-card.tsx` line 178):
```tsx
// BEFORE
<p className="text-3xl font-bold glass-text">{value.toLocaleString()}</p>

// AFTER
<p className="text-2xl sm:text-3xl font-bold glass-text tabular-nums">{value.toLocaleString()}</p>
// Mobile: 24px (text-2xl) for better fit in card
// Small+: 30px (text-3xl)
// Added tabular-nums for consistent digit width
```

**Before/After:**
- **Mobile:** 4 cards stacked vertically (easier to scan, larger touch targets)
- **Tablet:** 2x2 grid (balanced)
- **Desktop:** 1x4 row (current behavior)

**Testing Checkpoint:**
- [ ] Stats stack vertically on 360px-639px
- [ ] Stats show 2-column grid on 640px-1023px
- [ ] Stats show 4-column grid on 1024px+
- [ ] All text is readable at each breakpoint
- [ ] Cards have proper touch spacing

**Rollback:** Revert grid classes.

---

### Step 3.3: Optimize Instructor Stats Grid

**Files to Modify:**
- `app/dashboard/page.tsx`

**Changes:**

1. **Update instructor stats grid** (line 483):
```tsx
// BEFORE
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">

// AFTER
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
// Mobile (< 640px): 1 column
// Small (640-767px): 2 columns
// Medium (768-1023px): 3 columns
// Large (1024px+): 5 columns
```

**Rationale:**
- Instructor dashboard has 5 stats (more than student's 4)
- 2 columns on mobile is too cramped
- Progressive disclosure: 1 → 2 → 3 → 5

**Testing Checkpoint:**
- [ ] 5 stats stack vertically on mobile
- [ ] 2-column layout on small screens
- [ ] 3-column layout on medium screens
- [ ] 5-column layout on large screens
- [ ] No horizontal overflow at any breakpoint

**Rollback:** Revert grid classes.

---

### Step 3.4: Optimize Course Card Height

**Files to Modify:**
- `components/dashboard/enhanced-course-card.tsx`

**Changes:**

1. **Update card height** (line 99):
```tsx
// BEFORE
<Card className="group min-h-[220px] flex flex-col overflow-hidden ...">

// AFTER
<Card className="group min-h-[180px] md:min-h-[220px] flex flex-col overflow-hidden ...">
// Mobile: 180px min-height
// Desktop: 220px min-height
```

**Rationale:**
- 220px is 61% of 360px viewport width (too tall)
- 180px is 50% of 360px (more balanced)
- Maintains desktop visual hierarchy

**Testing Checkpoint:**
- [ ] Cards don't dominate mobile viewport
- [ ] All card content is visible (no overflow)
- [ ] Stats grid within card is readable
- [ ] Desktop appearance unchanged

**Rollback:** Revert min-height.

---

### Step 3.5: Optimize Course Card Grid

**Files to Modify:**
- `app/dashboard/page.tsx`

**Changes:**

1. **Update course grid** (line 151):
```tsx
// BEFORE
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// AFTER (NO CHANGE - already optimal)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

**Rationale:**
- Current layout is already optimal:
  - Mobile: 1 column (full width)
  - Medium+: 2 columns (side-by-side)
- No change needed

**Testing Checkpoint:**
- [ ] Verify 1-column layout on mobile
- [ ] Verify 2-column layout on tablet/desktop
- [ ] Ensure proper gap spacing (16px)

---

## Phase 4: Course Detail Mobile Navigation

**Goal:** Make triple-pane course layout work on mobile
**Duration:** 3-4 implementation sessions
**Priority:** CRITICAL

### Step 4.1: Create Mobile Course Navigation Hook

**Files to Create:**
- `hooks/use-mobile-course-nav.ts`

**Code:**

```tsx
"use client";

import { useState, useEffect } from "react";

export type MobileCourseView = "filters" | "threads" | "detail";

export function useMobileCourseNav(initialView: MobileCourseView = "threads") {
  const [view, setView] = useState<MobileCourseView>(initialView);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showFilters = () => setView("filters");
  const showThreads = () => setView("threads");
  const showDetail = () => setView("detail");

  return {
    view,
    isMobile,
    showFilters,
    showThreads,
    showDetail,
  };
}
```

**Testing Checkpoint:**
- [ ] Hook correctly detects mobile viewport
- [ ] View state updates correctly
- [ ] Resize listener works
- [ ] No memory leaks (cleanup on unmount)

---

### Step 4.2: Create Mobile Course Layout Component

**Files to Create:**
- `components/course/mobile-course-layout.tsx`

**Code:**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Filter, List, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface MobileCourseLayoutProps {
  /** Filter sidebar content */
  filterContent: ReactNode;

  /** Thread list content */
  threadListContent: ReactNode;

  /** Thread detail content (null if no thread selected) */
  threadDetailContent: ReactNode | null;

  /** Callback when detail is closed */
  onCloseDetail?: () => void;

  /** Current filter count for badge */
  activeFiltersCount?: number;

  /** Optional className */
  className?: string;
}

/**
 * Mobile Course Layout - Bottom Sheet Pattern
 *
 * Strategy:
 * - Default view: Thread list (full screen)
 * - Filter button (FAB) opens bottom sheet with filters
 * - Tapping thread opens detail in full-screen sheet
 * - Back button returns to thread list
 */
export function MobileCourseLayout({
  filterContent,
  threadListContent,
  threadDetailContent,
  onCloseDetail,
  activeFiltersCount = 0,
  className,
}: MobileCourseLayoutProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Main View: Thread List */}
      <div className="h-full w-full overflow-y-auto sidebar-scroll">
        {threadListContent}
      </div>

      {/* Filter FAB */}
      <Button
        onClick={() => setFilterSheetOpen(true)}
        className="fixed bottom-20 right-4 z-40 size-14 shadow-lg"
        variant="glass-primary"
        aria-label={`Open filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ""}`}
      >
        <Filter className="size-6" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Filter Bottom Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilterSheetOpen(false)}
              aria-label="Close filters"
            >
              <X className="size-5" />
            </Button>
          </div>
          <div className="h-full overflow-y-auto sidebar-scroll">
            {filterContent}
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Full-Screen Sheet */}
      {threadDetailContent && (
        <Sheet open={!!threadDetailContent} onOpenChange={() => onCloseDetail?.()}>
          <SheetContent side="right" className="w-full p-0">
            {threadDetailContent}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
```

**Testing Checkpoint:**
- [ ] Thread list displays full-screen by default
- [ ] Filter FAB is visible and positioned correctly
- [ ] Filter FAB shows active filter count badge
- [ ] Clicking FAB opens filter sheet from bottom
- [ ] Filter sheet is 85% viewport height
- [ ] Filter sheet scrolls correctly
- [ ] Detail sheet opens full-screen from right
- [ ] Detail sheet closes on back gesture
- [ ] Focus management works correctly

---

### Step 4.3: Update Course Detail Page for Mobile

**Files to Modify:**
- `app/courses/[courseId]/page.tsx`

**Changes:**

1. **Import mobile components** (after line 6):
```tsx
import { MobileCourseLayout } from "@/components/course/mobile-course-layout";
import { useMobileCourseNav } from "@/hooks/use-mobile-course-nav";
```

2. **Add mobile detection** (after line 39):
```tsx
const { isMobile } = useMobileCourseNav();
```

3. **Calculate active filter count** (after line 55):
```tsx
const activeFiltersCount = selectedTags.length + (activeFilter !== "all" ? 1 : 0);
```

4. **Replace SidebarLayout with conditional** (replace lines 213-258):
```tsx
{isMobile ? (
  <MobileCourseLayout
    filterContent={
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
    threadListContent={
      <ThreadListSidebar
        threads={filteredThreads}
        selectedThreadId={selectedThreadId}
        onThreadSelect={handleThreadSelect}
        isLoading={threadsLoading}
        currentUserId={user?.id}
      />
    }
    threadDetailContent={
      selectedThreadId ? (
        <ThreadDetailPanel
          threadId={selectedThreadId}
          onClose={() => {
            setSelectedThreadId(null);
            const params = new URLSearchParams(searchParams.toString());
            params.delete('thread');
            const newUrl = params.toString()
              ? `/courses/${courseId}?${params.toString()}`
              : `/courses/${courseId}`;
            window.history.replaceState(null, '', newUrl);
          }}
        />
      ) : null
    }
    onCloseDetail={() => {
      setSelectedThreadId(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('thread');
      const newUrl = params.toString()
        ? `/courses/${courseId}?${params.toString()}`
        : `/courses/${courseId}`;
      window.history.replaceState(null, '', newUrl);
    }}
    activeFiltersCount={activeFiltersCount}
  />
) : (
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
    {selectedThreadId ? (
      <ThreadDetailPanel
        threadId={selectedThreadId}
        onClose={() => {
          setSelectedThreadId(null);
          const params = new URLSearchParams(searchParams.toString());
          params.delete('thread');
          const newUrl = params.toString()
            ? `/courses/${courseId}?${params.toString()}`
            : `/courses/${courseId}`;
          window.history.replaceState(null, '', newUrl);
        }}
      />
    ) : null}
  </SidebarLayout>
)}
```

**Before/After:**

**Mobile (< 768px):**
- Before: Triple-pane layout broken, sidebars overlap
- After: Thread list full-screen, filter as bottom sheet, detail as right sheet

**Desktop (≥ 768px):**
- Before: Triple-pane layout works
- After: Same triple-pane layout (no change)

**Testing Checkpoint:**
- [ ] Mobile shows thread list by default
- [ ] Filter FAB visible on mobile
- [ ] Clicking FAB opens filter sheet
- [ ] Selecting thread opens detail sheet
- [ ] Back button in detail returns to thread list
- [ ] URL state syncs correctly
- [ ] Desktop layout unchanged
- [ ] Smooth transitions between views

**Rollback:** Remove conditional, restore original SidebarLayout.

---

### Step 4.4: Optimize Filter Sidebar for Mobile Sheet

**Files to Modify:**
- `components/course/filter-sidebar.tsx`

**Changes:**

1. **Add responsive padding** (update root div):
```tsx
// BEFORE
<aside className="h-full flex flex-col bg-surface-2 border-r">

// AFTER
<aside className="h-full flex flex-col bg-surface-2 lg:border-r">
// Remove border-r on mobile (not needed in sheet)
```

2. **Update section padding** (find all sections):
```tsx
// BEFORE
<div className="p-4 space-y-4">

// AFTER
<div className="p-4 md:p-6 space-y-4">
// Increase padding on desktop for better visual balance
```

**Testing Checkpoint:**
- [ ] Filter sidebar looks good in mobile bottom sheet
- [ ] Filter sidebar looks good in desktop sidebar
- [ ] All interactive elements accessible
- [ ] Scrolling works correctly

**Rollback:** Revert className changes.

---

### Step 4.5: Optimize Thread List for Mobile

**Files to Modify:**
- `components/course/thread-list-sidebar.tsx`

**Changes:**

1. **Update padding** (find root aside):
```tsx
// Add responsive padding classes
<aside className="h-full p-2 md:p-3">
// Mobile: 8px padding (tighter)
// Desktop: 12px padding (current)
```

2. **Update thread card spacing**:
```tsx
// If using ThreadCard components, ensure gap-2 (8px) between cards
<div className="space-y-2">
  {threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)}
</div>
```

**Testing Checkpoint:**
- [ ] Thread list readable on mobile
- [ ] Adequate spacing between threads
- [ ] Thread cards are tappable (44px+ height)
- [ ] Scrolling is smooth

**Rollback:** Revert padding changes.

---

## Phase 5: Component-Level Refinements

**Goal:** Polish individual components for mobile
**Duration:** 2-3 implementation sessions
**Priority:** MEDIUM

### Step 5.1: Optimize ThreadCard for Mobile

**Files to Modify:**
- `components/course/thread-card.tsx`

**Changes:**

1. **Improve metadata row wrapping** (line 83):
```tsx
// BEFORE
<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground glass-text">

// AFTER
<div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground glass-text">
// Mobile: 12px gap (tighter)
// Desktop: 16px gap (current)
```

2. **Adjust padding** (line 51):
```tsx
// BEFORE
const padding = isCompact ? "p-4" : "p-6";

// AFTER
const padding = isCompact ? "p-3 md:p-4" : "p-4 md:p-6";
// Mobile: Tighter padding for more content
// Desktop: Current padding
```

**Testing Checkpoint:**
- [ ] ThreadCard readable on 360px screen
- [ ] Metadata row wraps gracefully
- [ ] Touch target is 44px+ height
- [ ] No horizontal overflow

**Rollback:** Revert gap and padding changes.

---

### Step 5.2: Optimize AskQuestionModal for Mobile

**Files to Modify:**
- `components/course/ask-question-modal.tsx`

**Changes:**

1. **Update dialog width** (find DialogContent):
```tsx
<DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
// Mobile: max-w-4xl (96% viewport)
// Desktop: max-w-5xl (80rem)
```

2. **Update form padding**:
```tsx
<form className="space-y-4 md:space-y-6 p-4 md:p-6">
// Mobile: 16px padding, 16px spacing
// Desktop: 24px padding, 24px spacing
```

3. **Ensure textarea minimum height**:
```tsx
<Textarea
  className="min-h-[120px] md:min-h-[150px]"
/>
// Mobile: Shorter textarea (less viewport)
// Desktop: Taller textarea (more space)
```

**Testing Checkpoint:**
- [ ] Modal fits on mobile screen
- [ ] Form is fully visible without scrolling
- [ ] Textarea is usable size
- [ ] Buttons are 44px+ height
- [ ] Keyboard doesn't obscure inputs

**Rollback:** Revert size changes.

---

### Step 5.3: Optimize Instructor Priority Queue for Mobile

**Files to Modify:**
- `components/instructor/priority-queue-card.tsx`

**Changes:**

1. **Add mobile compact variant** (update root div):
```tsx
<div className={cn(
  "glass-panel rounded-lg p-3 md:p-4 space-y-3",
  // Mobile: Tighter padding (12px)
  // Desktop: Standard padding (16px)
  className
)}>
```

2. **Stack metadata on mobile**:
```tsx
// Find metadata row and update
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
// Mobile: Stack vertically
// Small+: Horizontal row
```

**Testing Checkpoint:**
- [ ] Priority cards readable on mobile
- [ ] Checkboxes are 44x44px
- [ ] Metadata stacks cleanly
- [ ] Action buttons accessible

**Rollback:** Revert layout changes.

---

### Step 5.4: Optimize Bulk Actions Toolbar for Mobile

**Files to Modify:**
- `components/instructor/bulk-actions-toolbar.tsx`

**Changes:**

1. **Stack actions on mobile**:
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
  {/* Selection info */}
  {/* Action buttons */}
</div>
```

2. **Make buttons full-width on mobile**:
```tsx
<Button className="w-full sm:w-auto">
  Bulk Endorse
</Button>
```

**Testing Checkpoint:**
- [ ] Toolbar visible on mobile
- [ ] Buttons stack vertically on narrow screens
- [ ] All actions accessible
- [ ] Selection count visible

**Rollback:** Revert flex direction changes.

---

### Step 5.5: Optimize Course Selector for Mobile

**Files to Modify:**
- `components/instructor/course-selector.tsx`

**Changes:**

1. **Increase dropdown trigger size** (find Button):
```tsx
<Button
  variant="outline"
  className="min-w-[200px] h-11 md:h-10"
>
// Mobile: 44px height
// Desktop: 40px height
```

**Testing Checkpoint:**
- [ ] Dropdown trigger is 44px+ on mobile
- [ ] Dropdown menu is accessible
- [ ] Course names are readable

**Rollback:** Revert height changes.

---

## Phase 6: Testing & Polishing

**Goal:** Comprehensive testing and edge case fixes
**Duration:** 2-3 implementation sessions
**Priority:** HIGH

### Step 6.1: Device Testing Matrix

**Devices to Test:**
1. iPhone SE (375x667) - Smallest modern iPhone
2. iPhone 12/13/14 (390x844) - Standard iPhone
3. iPhone 12 Pro Max (428x926) - Large iPhone
4. Galaxy S8 (360x740) - Smallest Android target
5. iPad (768x1024) - Tablet portrait
6. iPad Pro (1024x1366) - Large tablet

**Test Scenarios:**

#### Navigation Flow
- [ ] Open app, navigate to dashboard
- [ ] Open mobile nav drawer
- [ ] Search for thread in mobile nav
- [ ] Navigate to course detail
- [ ] Open filter sheet
- [ ] Select filters, close sheet
- [ ] Tap thread to view detail
- [ ] Return to thread list
- [ ] Log out

#### Touch Interactions
- [ ] All buttons tappable without zooming
- [ ] No accidental double-taps
- [ ] Swipe to scroll works smoothly
- [ ] Pull-to-refresh works (if implemented)
- [ ] Pinch-to-zoom disabled on UI elements

#### Form Interactions
- [ ] Ask question modal opens correctly
- [ ] Keyboard doesn't obscure inputs
- [ ] Submit button always visible
- [ ] Form validation messages visible

#### Orientation Changes
- [ ] Portrait → Landscape transition smooth
- [ ] Layout adapts correctly
- [ ] No content cut off
- [ ] Navigation still accessible

### Step 6.2: Accessibility Testing

**Screen Reader Testing:**
1. iOS VoiceOver (iPhone)
   - [ ] All interactive elements announced
   - [ ] Swipe navigation works
   - [ ] Forms are accessible
   - [ ] Modal focus trap works

2. Android TalkBack (Android phone)
   - [ ] All interactive elements announced
   - [ ] Swipe navigation works
   - [ ] Forms are accessible
   - [ ] Modal focus trap works

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Skip links work
- [ ] Modal traps focus correctly
- [ ] Escape key closes modals

**Touch Target Compliance:**
- [ ] All buttons 44x44px minimum
- [ ] 8px spacing between touch targets
- [ ] No overlapping touch areas

**Color Contrast:**
- [ ] All text meets 4.5:1 minimum ratio
- [ ] Interactive elements distinguishable
- [ ] Focus indicators visible

### Step 6.3: Performance Testing

**Metrics to Check:**
1. **First Contentful Paint (FCP):** < 1.8s on 3G
2. **Largest Contentful Paint (LCP):** < 2.5s on 3G
3. **Time to Interactive (TTI):** < 3.8s on 3G
4. **Cumulative Layout Shift (CLS):** < 0.1

**Tools:**
- Chrome DevTools > Lighthouse (mobile)
- WebPageTest (3G Fast preset)
- Real device testing with network throttling

**Common Issues to Check:**
- [ ] Glassmorphism causing jank
- [ ] Large images not lazy loaded
- [ ] Fonts causing FOUT/FOIT
- [ ] Animations causing repaints
- [ ] JS bundle too large

### Step 6.4: Browser Compatibility

**Browsers to Test:**
1. iOS Safari (iOS 15+)
   - [ ] Viewport height correct (100dvh)
   - [ ] Touch gestures work
   - [ ] Buttons are tappable
   - [ ] No zoom on focus

2. Chrome Mobile (Android 10+)
   - [ ] Viewport height correct
   - [ ] Touch gestures work
   - [ ] Buttons are tappable
   - [ ] No zoom on focus

3. Firefox Mobile
   - [ ] Layout correct
   - [ ] Touch interactions work
   - [ ] Animations smooth

4. Samsung Internet
   - [ ] Layout correct
   - [ ] Touch interactions work
   - [ ] Animations smooth

### Step 6.5: Edge Cases & Bug Fixes

**Common Issues:**

1. **Viewport Height Issues**
   - Problem: Mobile browser chrome changes vh
   - Fix: Use dvh units
   ```tsx
   <div className="h-[100dvh]">
   ```

2. **Touch Delay**
   - Problem: 300ms tap delay
   - Fix: Already handled by Tailwind (touch-action)

3. **Keyboard Covering Inputs**
   - Problem: Virtual keyboard obscures form
   - Fix: Add scroll-into-view on focus
   ```tsx
   <input
     onFocus={(e) => e.target.scrollIntoView({ block: "center" })}
   />
   ```

4. **Horizontal Scrolling**
   - Problem: Content wider than viewport
   - Fix: Add overflow-x-hidden, check all widths
   ```tsx
   <body className="overflow-x-hidden">
   ```

5. **Safe Area Insets**
   - Problem: Notch/camera cutout obscures content
   - Fix: Add safe-area-inset padding
   ```css
   .navbar {
     padding-top: env(safe-area-inset-top);
   }
   ```

---

## Rollback Strategy

### Per-Phase Rollback

Each phase is isolated. To rollback a phase:

1. **Revert all file changes in that phase**
2. **Run typecheck:** `npx tsc --noEmit`
3. **Run lint:** `npm run lint`
4. **Test on mobile device**
5. **Verify desktop unaffected**

### Emergency Rollback (All Changes)

If critical issues arise:

1. **Checkout last known good commit:**
   ```bash
   git log --oneline
   git checkout <commit-hash>
   ```

2. **Or revert specific commits:**
   ```bash
   git revert <commit-hash>
   ```

3. **Test thoroughly before re-deploying**

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Mobile nav accessible from all pages
- [ ] Search available on mobile
- [ ] Layout padding correct
- [ ] Background animations optimized

### Phase 2 Complete When:
- [ ] All buttons 44x44px on mobile
- [ ] 8px spacing between touch targets
- [ ] WCAG 2.2 AA compliant

### Phase 3 Complete When:
- [ ] Dashboard readable on 360px
- [ ] Stats grid optimal on all breakpoints
- [ ] Course cards sized correctly

### Phase 4 Complete When:
- [ ] Course detail works on mobile
- [ ] Filter sheet functional
- [ ] Detail view full-screen
- [ ] Desktop layout unchanged

### Phase 5 Complete When:
- [ ] All components optimized
- [ ] Forms usable on mobile
- [ ] Instructor tools accessible

### Phase 6 Complete When:
- [ ] All devices tested
- [ ] All browsers tested
- [ ] Accessibility verified
- [ ] Performance meets targets

---

## Maintenance Notes

### Future Mobile Patterns

When adding new components, ensure:

1. **Props-driven:** All data via props, no hardcoded values
2. **Responsive:** Test at 360px, 768px, 1024px
3. **Touch-compliant:** 44x44px minimum targets
4. **Accessible:** ARIA labels, keyboard nav
5. **Performance:** Avoid heavy animations on mobile

### Testing Checklist for New Features

- [ ] Test on 360px mobile
- [ ] Test with iOS VoiceOver
- [ ] Verify touch target sizes
- [ ] Check color contrast
- [ ] Test with keyboard
- [ ] Verify performance (Lighthouse)

---

## Implementation Estimate

**Total Effort:** 12-15 implementation sessions (1-2 weeks)

**Phase 1:** 2-3 sessions
**Phase 2:** 1-2 sessions
**Phase 3:** 2-3 sessions
**Phase 4:** 3-4 sessions
**Phase 5:** 2-3 sessions
**Phase 6:** 2-3 sessions

**Risk Buffer:** +2 sessions for edge cases and bugs

---

## Final Notes

- Each step is designed to be **small and verifiable**
- Test immediately after each step
- Commit after each successful phase
- Document any deviations in `context.md`
- Update this plan if new issues arise

**Remember:** Props-driven, QDS-compliant, accessibility-first, test on real devices.

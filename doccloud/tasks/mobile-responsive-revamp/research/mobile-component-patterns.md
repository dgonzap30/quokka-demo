# Mobile Component Patterns Research

**Date:** 2025-10-14
**Component Architect Agent**
**Task:** Mobile Responsive Component Architecture Analysis

---

## Executive Summary

The QuokkaQ application has a solid desktop-first foundation with QDS v1.0 glassmorphism, but requires systematic mobile responsive patterns across all breakpoints (360px-768px). Key issues identified: hidden mobile navigation, excessive padding, complex triple-pane layouts, and insufficient touch target sizes.

---

## Current State Analysis

### 1. Navigation Components

#### GlobalNavBar (`components/layout/global-nav-bar.tsx`)
**Current Implementation:**
- Line 127-129: Search hidden on mobile (`hidden md:block`)
- Line 133-251: All action buttons hidden on mobile (`hidden md:flex`)
- Line 254-262: Quokka Points badge hidden on mobile (`hidden md:flex`)
- **Problem:** Mobile users lose search, Ask Question, AI Assistant, Support, Settings access
- **Touch Targets:** Icons at 44x44px (min-h-[44px] min-w-[44px] h-11 w-11) - MEETS WCAG 2.2 AA ✓
- **Height:** Fixed at h-14 (56px)

**Good Patterns:**
- Mobile breadcrumb shows back button (Line 115-123)
- Proper ARIA labels on all interactive elements
- Touch target size already compliant

**Issues:**
- No visible mobile menu trigger on GlobalNavBar
- MobileNav exists but isn't integrated into GlobalNavBar
- Desktop-only features should have mobile equivalents

#### MobileNav (`components/layout/mobile-nav.tsx`)
**Current Implementation:**
- Drawer from left using Sheet component (280px width)
- Contains Ask Question, AI Assistant, Support, Settings actions
- Course back button when in course context
- User profile section with logout

**Good Patterns:**
- All buttons have min-h-[44px] for touch targets ✓
- Uses SheetClose to auto-dismiss on navigation
- Proper focus management

**Issues:**
- Not visible/triggered from GlobalNavBar
- No search functionality in mobile nav
- Navigation items are optional (items prop may be empty)

### 2. Layout Structure

#### Root Layout (`app/layout.tsx`)
**Current Implementation:**
- Line 30: Body uses `h-screen overflow-hidden flex flex-col`
- Line 39-70: Fixed background with liquid gradients
- Line 75: Main content with `pt-[104px]` top padding

**Issues:**
- 104px top padding excessive for mobile (navbar is only 56px)
- `overflow-hidden` on body may prevent mobile scrolling in some contexts
- Fixed background animations may impact mobile performance

#### Dashboard Page (`app/dashboard/page.tsx`)
**Current Implementation:**
- Student Dashboard:
  - Line 133: Padding `p-4 md:p-6` (16px mobile, 24px desktop)
  - Line 136-142: Hero text `text-4xl md:text-5xl` - may be too large on 360px
  - Line 146: Grid `grid-cols-1 lg:grid-cols-3`
  - Line 151: Course cards `grid-cols-1 md:grid-cols-2`
  - Line 206: Stats grid `grid-cols-2 md:grid-cols-4`

**Good Patterns:**
- Mobile-first grid approach (1-col on mobile)
- Responsive padding and text sizing
- Proper semantic sections with aria-labelledby

**Issues:**
- 2-column stat grid on mobile may be cramped for touch targets
- Hero text might overwhelm 360px screens
- Course cards at 220px min-height may be too tall for mobile viewport

- Instructor Dashboard:
  - Line 348: Padding `p-4 md:p-6`
  - Line 354: Hero text `text-4xl md:text-5xl`
  - Line 441: FAQ + Trending `grid-cols-1 lg:grid-cols-2`
  - Line 483: Stats grid `grid-cols-2 md:grid-cols-5`

**Issues:**
- 2-column stat grid becomes 5 columns at md breakpoint - should be 3 at md, 5 at lg
- Bulk actions toolbar needs mobile optimization
- Priority queue cards need compact mobile variant

#### Course Detail Page (`app/courses/[courseId]/page.tsx`)
**Current Implementation:**
- Uses SidebarLayout for triple-pane structure
- Filter sidebar + Thread list + Thread detail
- No mobile-specific navigation pattern

**Critical Issue:**
- Triple-pane layout completely breaks on mobile
- No way to navigate between filters, list, and detail on small screens
- Needs bottom sheet or tab-based mobile navigation

### 3. Complex Layouts

#### SidebarLayout (`components/course/sidebar-layout.tsx`)
**Current Implementation:**
- Line 112-124: CSS Grid with responsive columns using minmax()
- Line 87-103: Detects mobile viewport, auto-closes filter sidebar
- Line 135-141: Mobile overlay for filter sidebar
- Line 151-169: Filter sidebar as fixed drawer on mobile

**Good Patterns:**
- Responsive grid with minmax() for fluid columns
- Mobile detection with resize listener
- Overlay pattern for sidebars on mobile

**Critical Issues:**
- Triple-pane layout (filter + list + detail) doesn't work on mobile
- Thread list always visible even on mobile (no toggle)
- No mobile navigation pattern to switch between panes
- Fixed drawer at 220px may be too wide for 360px screens

**Recommended Pattern:**
- Mobile: Bottom sheet with tabs (Filters | Threads | Detail)
- Tablet: Two-pane (List + Detail, filter as sheet)
- Desktop: Three-pane as current

### 4. Component Library Analysis

#### StatCard (`components/dashboard/stat-card.tsx`)
**Current Implementation:**
- Line 162-223: Flexible card with icon, label, value, trend, sparkline, CTA
- Line 164-174: Header with icon + label
- Line 177-185: Value + trend indicators
- Line 188-207: Optional sparkline with border-top

**Good Patterns:**
- Compact layout suitable for mobile
- Icon in 2x2 grid (p-2) with icon size-4

**Issues:**
- Text size `text-3xl` for value may be too large in 2-column mobile grid
- Consider reducing to `text-2xl md:text-3xl`

#### EnhancedCourseCard (`components/dashboard/enhanced-course-card.tsx`)
**Current Implementation:**
- Line 99: `min-h-[220px]` fixed minimum height
- Line 103: Header with `max-h-[100px]` and `p-4`
- Line 118: Title `text-xl`
- Line 139: Stats grid `grid-cols-2`

**Good Patterns:**
- Already has mobile-appropriate 2-column grid for stats
- Compact header with truncation

**Issues:**
- 220px min-height is tall for mobile (1/3 of 360px viewport width)
- Consider reducing to `min-h-[180px] md:min-h-[220px]`

#### ThreadCard (`components/course/thread-card.tsx`)
**Current Implementation:**
- Line 49-60: Full vs compact variants
- Line 66: Flex row that stacks on mobile `flex-col sm:flex-row`
- Line 83: Metadata row with `flex-wrap`

**Good Patterns:**
- Compact variant available for list views
- Responsive flex direction
- Metadata wraps naturally

**Issues:**
- Line 83: Gap-4 (16px) may not provide enough touch separation
- Consider `gap-4 touch-action-pan-y` for better mobile scroll

#### Button Component (`components/ui/button.tsx`)
**Current Implementation:**
- Line 30-33: Sizes: default (h-10/40px), sm (h-9/36px), lg (h-11/44px), icon (size-10/40px)
- Line 8: Active state with scale-[0.98]
- Line 12-27: Multiple variants with hover scale effects

**Touch Target Compliance:**
- Default: 40px ❌ (needs 44px minimum)
- Small: 36px ❌ (needs 44px minimum)
- Large: 44px ✓
- Icon: 40px ❌ (needs 44px minimum)

**Critical Issue:**
- Most button sizes below WCAG 2.2 AA minimum (44x44px)
- Need mobile-specific size adjustments

### 5. Design System (QDS) Analysis

#### Breakpoint Strategy (`app/globals.css`)
- Mobile: < 768px (sm and below)
- Tablet: 768px - 1023px (md)
- Desktop: 1024px+ (lg and above)

**Tailwind Breakpoints:**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

**Typography Scale:**
- Line 538-556: Responsive heading utilities
- Line 559-565: Hero title/subtitle utilities

**Issues:**
- Hero text starts at `text-5xl` (48px) which may be too large for 360px
- Consider capping at `text-3xl` (30px) on mobile

#### Spacing & Touch Targets
- QDS uses 4pt grid (gap-1=4px, gap-2=8px, gap-4=16px, gap-6=24px)
- Touch targets need minimum 44x44px with 8px spacing between

**Current Compliance:**
- GlobalNavBar icons: 44x44px ✓
- MobileNav buttons: 44px min-height ✓
- Button component: 40px (most) ❌
- StatCard icons: ~32px ❌

### 6. Real-World Component Examples

#### Dashboard Quick Actions Panel
**Location:** `components/dashboard/quick-actions-panel.tsx`
**Pattern:** Grid of action cards
**Mobile Needs:** 1-column stack, larger touch targets

#### Assignment Q&A Opportunities
**Location:** `components/dashboard/assignment-qa-opportunities.tsx`
**Pattern:** List of cards with deadlines
**Mobile Needs:** Full-width cards, compact metadata

#### Instructor Priority Queue
**Location:** `components/instructor/priority-queue-card.tsx`
**Pattern:** Expandable cards with bulk selection
**Mobile Needs:** Simplified layout, easier checkbox interaction

#### Course Selector
**Location:** `components/instructor/course-selector.tsx`
**Pattern:** Dropdown menu for course switching
**Mobile Needs:** Larger touch target, mobile-friendly dropdown

---

## Mobile Navigation Patterns - Research

### Option A: Bottom Navigation Tabs (Recommended for Course Detail)
**Pros:**
- Familiar mobile pattern (iOS/Android standard)
- Always visible, no hidden features
- Fast switching between views
- Works well for 3 fixed sections

**Cons:**
- Takes permanent screen real estate (56-64px)
- Only suitable for 3-5 top-level sections

**Implementation:**
- Use fixed bottom bar with 3 tabs: Filters | Threads | Detail
- Show active tab indicator
- Swipe gestures to switch tabs
- Hide on scroll for more content space

**Code Pattern:**
```tsx
<div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
  <nav className="flex glass-panel-strong border-t">
    <button className="flex-1 py-3 min-h-[56px]">Filters</button>
    <button className="flex-1 py-3 min-h-[56px]">Threads</button>
    <button className="flex-1 py-3 min-h-[56px]">Detail</button>
  </nav>
</div>
```

### Option B: Floating Action Button (FAB) Toggle
**Pros:**
- Minimal screen real estate
- Smooth animations
- Can show/hide as needed

**Cons:**
- Hidden functionality (discovery issue)
- Can obscure content
- Not standard for complex layouts

**Not Recommended:** Too many panes to toggle efficiently

### Option C: Full-Screen Transitions
**Pros:**
- Maximum space for each view
- Clean, focused experience
- Natural back button flow

**Cons:**
- Slow navigation between sections
- Loses context when switching views
- Requires more taps to navigate

**Implementation:**
- Each pane is full-screen on mobile
- Use slide transitions between views
- Breadcrumb navigation to go back

### Option D: Bottom Sheet for Filters (Recommended)
**Pros:**
- Filters accessible but not always visible
- Common mobile pattern
- Works with two-pane layout (threads + detail)

**Cons:**
- Requires additional tap to access filters
- Sheet may not be discoverable

**Implementation:**
- Mobile: Thread list full-screen, filter as bottom sheet, detail as full-screen transition
- Use floating filter button to trigger sheet
- Sticky thread list with detail overlay

**Code Pattern:**
```tsx
// Mobile filter trigger
<Button
  className="fixed bottom-4 right-4 z-40 lg:hidden size-14"
  variant="glass-primary"
  onClick={() => setFilterSheetOpen(true)}
>
  <Filter className="size-6" />
</Button>

// Bottom sheet
<Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    <FilterSidebar />
  </SheetContent>
</Sheet>
```

---

## Layout Strategy Recommendations

### 1. Dashboard Grid Adaptations

#### Student Dashboard
**Current:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
**Issues:**
- Stats grid is 2-column on mobile, may be cramped
- Course cards are 2-column at md, good
- Activity feed always full-width, good

**Recommended:**
```tsx
// Course cards - keep as is
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Stats grid - adjust for better mobile UX
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// Mobile: 1 column stack (clearer, less cramped)
// Small: 2 columns (640px+)
// Large: 4 columns (1024px+)
```

#### Instructor Dashboard
**Current:** `grid-cols-2 md:grid-cols-5`
**Issues:**
- 2 columns on mobile too cramped for 5 stats
- Jumps to 5 columns at 768px (too early)

**Recommended:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
// Mobile: 1 column stack
// Small: 2 columns (640px+)
// Medium: 3 columns (768px+)
// Large: 5 columns (1024px+)
```

### 2. Course Detail Mobile Layout

**Recommended Approach:** Hybrid (Bottom Sheet + Tabs)

**Mobile (< 768px):**
1. Default view: Thread list full-screen
2. Filter button (FAB) opens bottom sheet with filters
3. Tapping thread opens detail in full-screen with back button
4. Breadcrumb: Filters ← Threads ← Detail

**Tablet (768px - 1023px):**
1. Two-pane: Thread list (fixed 320px) + Detail (fluid)
2. Filter as bottom sheet or collapsible sidebar

**Desktop (1024px+):**
1. Three-pane: Filter (220px) + Threads (280-400px) + Detail (fluid)
2. Current layout preserved

### 3. Touch Target Strategy

**Global Adjustments:**
1. All interactive elements: min-h-[44px] min-w-[44px]
2. Spacing between touch targets: min gap-2 (8px)
3. Button component size adjustment:
   - Mobile: Force size="lg" (44px) on all buttons
   - Desktop: Allow size="default" (40px)

**Implementation Pattern:**
```tsx
<Button
  size="default"
  className="lg:h-10 h-11"  // 44px mobile, 40px desktop
>
```

Or create mobile-specific button wrapper:
```tsx
export function MobileButton({ size = "default", ...props }) {
  const mobileSize = size === "icon" ? "icon" : "lg";
  return <Button size={mobileSize} className="lg:h-auto" {...props} />;
}
```

### 4. Typography Scaling

**Hero Text:**
```tsx
// Current
<h1 className="text-4xl md:text-5xl font-bold">

// Recommended
<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
// Mobile: 30px (more reasonable for 360px)
// Small: 36px (640px+)
// Medium: 48px (768px+)
```

**Card Titles:**
```tsx
// Current
<h2 className="text-xl font-semibold">

// Recommended (keep as is, 20px is fine)
<h2 className="text-lg sm:text-xl font-semibold">
```

**Stat Values:**
```tsx
// Current
<p className="text-3xl font-bold">{value}</p>

// Recommended
<p className="text-2xl sm:text-3xl font-bold">{value}</p>
// Mobile: 24px (better for 2-col grid)
// Small: 30px (640px+)
```

---

## Component Composition Strategies

### Pattern 1: Responsive Wrapper Components

**Problem:** Need different component behavior at different breakpoints
**Solution:** Create responsive wrapper that renders different variants

**Example:**
```tsx
export function ResponsiveStatGrid({ stats }: { stats: StatData[] }) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  if (isMobile) {
    return (
      <div className="space-y-4">
        {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
    </div>
  );
}
```

### Pattern 2: Conditional Render with Breakpoint Utilities

**Problem:** Need to show/hide elements at breakpoints
**Solution:** Use Tailwind's responsive utilities + proper ARIA

**Example:**
```tsx
// Desktop search
<div className="hidden md:block">
  <GlobalSearch />
</div>

// Mobile search (in drawer)
<Sheet>
  <SheetContent>
    <GlobalSearch placeholder="Search..." />
  </SheetContent>
</Sheet>
```

### Pattern 3: Touch-Optimized Variants

**Problem:** Components need larger touch targets on mobile
**Solution:** Add mobile-specific size variants

**Example:**
```tsx
export interface CardProps {
  size?: "default" | "mobile-optimized";
}

const sizeClasses = {
  default: "p-4 gap-2",
  "mobile-optimized": "p-6 gap-4 min-h-[88px]"
};
```

### Pattern 4: Stacking vs Side-by-Side

**Problem:** Horizontal layouts break on narrow screens
**Solution:** Use flex-col on mobile, flex-row on desktop

**Example:**
```tsx
<div className="flex flex-col sm:flex-row items-start gap-4">
  <div className="flex-1">{/* Content */}</div>
  <aside className="w-full sm:w-64">{/* Sidebar */}</aside>
</div>
```

---

## Real-World Implementation Examples

### Example 1: GlobalNavBar Mobile Integration

**File:** `components/layout/global-nav-bar.tsx`

**Current Structure:**
```tsx
<nav>
  <Logo />
  <Search className="hidden md:block" />
  <Actions className="hidden md:flex" />
  <Avatar />
</nav>
```

**Recommended Structure:**
```tsx
<nav>
  <MobileNav /> {/* Trigger visible on mobile */}
  <Logo />
  <Search className="hidden md:block" />
  <Actions className="hidden md:flex" />
  <QuokkaPoints className="hidden md:flex" />
  <Avatar />
</nav>
```

**Implementation:**
- Add MobileNav trigger as first element in navbar
- Pass all handlers (onAskQuestion, onOpenAIAssistant, etc.) to MobileNav
- Move search into MobileNav drawer content for mobile access

### Example 2: Dashboard Stat Grid Mobile

**File:** `app/dashboard/page.tsx` (Line 206)

**Current:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard ... />
</div>
```

**Recommended:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard ... />
</div>
```

**Rationale:**
- 1-column on mobile (< 640px) for clearer reading
- 2-column on small screens (640px+)
- 4-column on large screens (1024px+)

### Example 3: Course Detail Mobile Navigation

**File:** `app/courses/[courseId]/page.tsx`

**Current Structure:**
```tsx
<SidebarLayout
  filterSidebar={<FilterSidebar />}
  threadListSidebar={<ThreadListSidebar />}
>
  <ThreadDetailPanel />
</SidebarLayout>
```

**Recommended Mobile Addition:**
```tsx
{isMobile ? (
  <>
    {/* Thread List - Default View */}
    <div className="h-full">
      <ThreadListSidebar />
    </div>

    {/* Filter Sheet - Triggered by FAB */}
    <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
      <SheetContent side="bottom" className="h-[80vh]">
        <FilterSidebar />
      </SheetContent>
    </Sheet>

    {/* Filter FAB */}
    <Button
      className="fixed bottom-20 right-4 z-40 size-14 shadow-lg"
      onClick={() => setFilterOpen(true)}
    >
      <Filter className="size-6" />
    </Button>

    {/* Detail - Full Screen Overlay */}
    {selectedThreadId && (
      <Sheet open={!!selectedThreadId} onOpenChange={() => setSelectedThreadId(null)}>
        <SheetContent side="right" className="w-full">
          <ThreadDetailPanel />
        </SheetContent>
      </Sheet>
    )}
  </>
) : (
  <SidebarLayout ... />
)}
```

### Example 4: Button Touch Target Fix

**File:** `components/ui/button.tsx`

**Current:**
```tsx
size: {
  default: "h-10 px-4 py-2",    // 40px
  sm: "h-9 rounded-md px-3",     // 36px
  lg: "h-11 rounded-md px-6",    // 44px
  icon: "size-10",               // 40px
}
```

**Recommended:**
```tsx
size: {
  default: "h-11 lg:h-10 px-4 py-2",              // 44px mobile, 40px desktop
  sm: "h-11 lg:h-9 rounded-md px-3",              // 44px mobile, 36px desktop
  lg: "h-11 rounded-md px-6",                     // 44px (unchanged)
  icon: "size-11 lg:size-10",                     // 44px mobile, 40px desktop
}
```

**Alternative Approach:**
Create dedicated mobile button sizes:
```tsx
size: {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-6",
  icon: "size-10",
  "mobile-default": "h-11 px-4 py-2",    // New
  "mobile-icon": "size-11",              // New
}
```

---

## Accessibility Considerations

### Touch Target Compliance (WCAG 2.2 AA)
- **Minimum Size:** 44x44px for all interactive elements
- **Spacing:** 8px minimum between adjacent targets
- **Exception:** Inline text links (can be smaller)

**Current Violations:**
1. Button component default/sm/icon sizes (40px, 36px, 40px)
2. Some icon buttons in cards may be < 44px
3. Dropdown triggers may be < 44px

**Fixes:**
- Increase button heights on mobile: `h-11 lg:h-10`
- Add minimum touch spacing: `gap-2` between buttons
- Ensure all clickable icons are wrapped in 44px+ containers

### Keyboard Navigation
- **Requirement:** All interactive elements must be keyboard accessible
- **Current State:** Most components have proper focus-visible states
- **Mobile Consideration:** Virtual keyboard can obscure 50% of screen
  - Use `scrollIntoView()` on focus for form inputs
  - Add padding-bottom to forms to account for keyboard height

### Screen Reader Support
- **Requirement:** Proper ARIA labels, roles, and live regions
- **Current State:** Good - most components have proper labels
- **Mobile Consideration:**
  - Test with iOS VoiceOver and Android TalkBack
  - Ensure swipe gestures don't conflict with screen reader navigation

### Focus Management
- **Mobile Sheets/Modals:** Trap focus within open sheet
- **Back Button:** Return focus to trigger element when closing
- **Skip Links:** Ensure skip-to-content works on mobile

---

## Performance Considerations

### Glassmorphism on Mobile
**Current:** Heavy use of backdrop-blur with liquid gradients
**Impact:** Can cause jank on lower-end mobile devices
**Recommendation:**
```css
@media (max-width: 768px) {
  .glass-panel {
    backdrop-filter: blur(8px); /* Reduce from 12px */
  }

  .animate-liquid-float {
    animation: none; /* Disable on mobile */
  }
}
```

### Reduced Motion
**Current:** `@media (prefers-reduced-motion: reduce)` already implemented
**Good:** Honors user preference
**Ensure:** All mobile animations respect this setting

### Touch Responsiveness
**Target:** < 100ms delay on tap
**Implementation:**
- Use `touch-action: manipulation` to disable double-tap zoom delay
- Avoid hover-dependent interactions
- Use `active:` states instead of `hover:` on mobile

```css
@media (max-width: 768px) {
  button, a {
    touch-action: manipulation;
  }
}
```

### Viewport Height Issues
**Problem:** Mobile browser chrome (address bar) changes vh calculation
**Solution:** Use dvh (dynamic viewport height) units
```tsx
// Instead of
<div className="h-screen">

// Use
<div className="h-[100dvh]">
```

---

## Testing Strategy

### Device Matrix
1. **Mobile:** 360px (Galaxy S8), 375px (iPhone X), 414px (iPhone Plus)
2. **Tablet:** 768px (iPad), 820px (iPad Air)
3. **Desktop:** 1024px, 1280px, 1920px

### Test Scenarios
1. Navigation: Can user access all features from mobile?
2. Forms: Can user fill forms with mobile keyboard?
3. Scrolling: Does content scroll smoothly in all containers?
4. Touch Targets: Are all interactive elements easy to tap?
5. Orientation: Does layout adapt to portrait/landscape?

### Browser Testing
- iOS Safari (primary mobile browser)
- Chrome Mobile (Android primary)
- Firefox Mobile
- Samsung Internet

---

## Key Findings Summary

1. **Navigation Crisis:** GlobalNavBar hides all mobile features; MobileNav exists but isn't integrated
2. **Layout Breakdown:** Triple-pane course layout completely broken on mobile
3. **Touch Target Failures:** Button component sizes violate WCAG 2.2 AA (40px instead of 44px)
4. **Typography Oversized:** Hero text at 48px+ too large for 360px viewports
5. **Grid Overoptimization:** 2-column stat grids on mobile create cramped touch targets
6. **Good Foundation:** QDS tokens work well, glassmorphism is mobile-capable with tuning
7. **Props-Driven Success:** All components accept data via props, easy to add mobile variants

---

## Next Steps

See `plans/mobile-responsive-implementation.md` for phased implementation plan with exact file paths, code changes, and testing checkpoints.

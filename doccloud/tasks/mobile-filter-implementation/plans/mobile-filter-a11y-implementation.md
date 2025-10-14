# Mobile Filter Accessibility Implementation Plan

**Date:** 2025-10-14
**Agent:** Accessibility Validator
**Component:** MobileFilterSheet
**Prerequisite:** Read `research/mobile-filter-a11y-requirements.md`

---

## Priority Order

### Priority 1: Critical (Blocking Issues)
1. Focus management (focus trap, focus return)
2. Keyboard navigation (Tab, Arrow keys, Escape)
3. Touch target sizing (44x44px minimum)
4. ARIA attributes (roles, labels, states)

### Priority 2: High (Significant Barriers)
5. Screen reader announcements (aria-live regions)
6. Filter count badge accessibility
7. Search input labeling
8. Radio group keyboard support

### Priority 3: Medium (Improvements)
9. Color contrast validation
10. Safe area insets (iOS notch, Android gesture bar)
11. Reduced motion support

---

## File Modifications Required

### 1. components/course/mobile-filter-sheet.tsx (NEW)

#### Fix 1: Filter Trigger Button Accessibility
**Priority:** Critical
**WCAG:** 2.1.1 Keyboard (A), 2.5.5 Target Size (AAA), 4.1.2 Name, Role, Value (A)

**Current State:** Button needs to be created with proper ARIA attributes

**Required Changes:**
```tsx
// Add to ThreadListSidebar header (mobile only)
<button
  type="button"
  onClick={() => setMobileSheetOpen(true)}
  aria-label="Open filters"
  aria-expanded={mobileSheetOpen}
  aria-controls="mobile-filter-sheet"
  className={cn(
    "touch-target", // Ensures 44x44px minimum
    "flex items-center gap-2 px-3 py-2 rounded-lg",
    "hover:glass-panel transition-colors duration-200",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  )}
>
  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
  {activeFilterCount > 0 && (
    <Badge
      variant="default"
      className="h-5 min-w-[20px] px-1.5 text-xs"
      aria-label={`${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
    >
      {activeFilterCount}
    </Badge>
  )}
</button>
```

**Implementation:**
- `type="button"` prevents form submission
- `aria-label="Open filters"` provides accessible name for icon button
- `aria-expanded` indicates sheet open/closed state (updated on state change)
- `aria-controls` references sheet ID for AT users
- `className="touch-target"` ensures 44x44px minimum size
- Icon has `aria-hidden="true"` (decorative)
- Badge has separate `aria-label` with count

**Test Scenario:**
- Keyboard: Tab to button, verify focus ring visible, press Enter/Space to open
- Screen reader: Verify announces "Open filters, button, collapsed/expanded"
- Touch: Verify button is 44x44px minimum, easy to tap

---

#### Fix 2: Sheet Container ARIA Attributes
**Priority:** Critical
**WCAG:** 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)

**Current State:** Radix Dialog provides base ARIA, need to add mobile-specific attributes

**Required Changes:**
```tsx
<Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
  <SheetContent
    side="bottom"
    id="mobile-filter-sheet"
    aria-describedby="filter-description"
    className={cn(
      "h-[85vh] max-h-[600px]",
      "flex flex-col",
      "glass-panel-strong border-glass shadow-glass-lg",
      "safe-bottom" // Handles iOS notch, Android gesture bar
    )}
  >
    <SheetHeader className="flex-shrink-0">
      <SheetTitle id="filter-title">
        Filters
        {activeFilterCount > 0 && (
          <span className="text-muted-foreground ml-2">
            ({activeFilterCount} of {totalFilters} active)
          </span>
        )}
      </SheetTitle>
      <SheetDescription id="filter-description">
        Search and filter threads by status and tags
      </SheetDescription>
    </SheetHeader>

    {/* Scrollable body */}
    <div className="flex-1 overflow-y-auto">
      {/* Filter content */}
    </div>

    <SheetFooter className="flex-shrink-0 flex-row gap-3 pt-4 border-t border-glass safe-bottom">
      {/* Footer buttons */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Implementation:**
- `id="mobile-filter-sheet"` allows aria-controls reference from trigger
- `aria-describedby="filter-description"` provides context for screen readers
- `h-[85vh]` leaves 15% visible for backdrop tap affordance
- `max-h-[600px]` prevents excessive height on tablets
- `safe-bottom` handles iOS notch/Android gesture bar (QDS utility)
- SheetTitle includes active filter count for context
- SheetDescription explains purpose

**Radix Dialog Provides (Automatic):**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (links to SheetTitle)
- Focus trap (Tab cycles within sheet)
- Escape key closes sheet
- Focus return to trigger button

**Test Scenario:**
- Screen reader: Verify announces "Filters dialog opened. 4 of 8 active filters. Search and filter threads by status and tags."
- Keyboard: Tab through elements, verify focus stays within sheet
- Escape key: Press Escape, verify sheet closes and focus returns to trigger button
- Mobile: Verify sheet height doesn't exceed 85vh, backdrop visible

---

#### Fix 3: Search Input Accessibility
**Priority:** High
**WCAG:** 1.3.2 Meaningful Sequence (A), 2.5.5 Target Size (AAA), 3.3.2 Labels or Instructions (A)

**Current State:** SidebarSearchBar reused, needs mobile-specific attributes

**Required Changes:**
```tsx
<SidebarSearchBar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  placeholder="Search threads..."
  className="h-11" // 44px minimum touch target
  inputProps={{
    'aria-label': 'Search threads',
    'type': 'search' // Semantic type, shows clear button on mobile
  }}
/>
```

**Alternative (if SidebarSearchBar doesn't support inputProps):**
```tsx
<div className="px-4 py-3 border-b border-glass">
  <Input
    type="search"
    placeholder="Search threads..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    aria-label="Search threads"
    className={cn(
      "h-11", // 44px minimum touch target
      "w-full",
      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    )}
  />
</div>
```

**Implementation:**
- `type="search"` provides semantic meaning, shows native clear button
- `aria-label="Search threads"` provides accessible name (no visible label)
- `h-11` (44px) meets touch target minimum
- `placeholder` provides hint but not relied upon for accessibility

**Test Scenario:**
- Screen reader: Verify announces "Search threads, search field"
- Keyboard: Tab to input, type text, verify focus ring visible
- Touch: Verify input is 44px tall, easy to tap
- Mobile: Verify native clear button (X) appears after typing

---

#### Fix 4: Filter Radio Group Keyboard Navigation
**Priority:** Critical
**WCAG:** 2.1.1 Keyboard (A), 2.4.3 Focus Order (A), 4.1.2 Name, Role, Value (A)

**Current State:** SidebarFilterPanel already has radio group, verify attributes

**Required Changes:**
```tsx
<SidebarFilterPanel
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
  className="px-4 py-3 border-b border-glass"
/>
```

**Verification (in SidebarFilterPanel component):**
- ✓ `role="radiogroup"` on container
- ✓ `aria-label="Filter threads by"` on group
- ✓ `role="radio"` on each button
- ✓ `aria-checked="true|false"` on each button
- ✓ `aria-label="{filter.description}"` on each button
- ⚠️ **Add `className="touch-target"`** to each radio button

**Modify SidebarFilterPanel (components/course/sidebar-filter-panel.tsx):**
```tsx
// In existing button className
className={cn(
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
  "touch-target", // ADD THIS
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  // ... rest of classes
)}
```

**Implementation:**
- Radio group already supports Arrow Up/Down navigation (native behavior)
- Add touch-target class to ensure 44px minimum height
- Verify py-2.5 + content + border = 44px minimum

**Test Scenario:**
- Keyboard: Tab to radio group (first radio focused), press Arrow Down/Up to navigate, press Space to select
- Screen reader: Verify announces "All Threads, radio button, 1 of 6, checked. Show all threads in this course."
- Touch: Verify each radio button is 44px minimum height

---

#### Fix 5: Tag Cloud Accessibility
**Priority:** High
**WCAG:** 2.1.1 Keyboard (A), 2.5.5 Target Size (AAA), 4.1.2 Name, Role, Value (A)

**Current State:** TagCloud already has aria-pressed, verify touch targets

**Required Changes:**
```tsx
<TagCloud
  tags={tags}
  selectedTags={selectedTags}
  onTagsChange={setSelectedTags}
  maxInitialTags={8}
  className="px-4 py-3 border-b border-glass"
/>
```

**Verification (in TagCloud component):**
- ✓ `aria-pressed="true|false"` on each tag button
- ✓ `aria-label="${action} tag filter: ${tag} (${count} threads)"` on each button
- ⚠️ **Verify touch target size** (should already be 44px from px-3 py-2)

**Modify TagCloud if needed (components/course/tag-cloud.tsx):**
```tsx
// In existing button className
className={cn(
  "touch-target", // ADD THIS IF MISSING
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full",
  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
  // ... rest of classes
)}
```

**Show More/Less Button:**
```tsx
// Verify this has touch-target class
className={cn(
  "w-full touch-target", // ADD touch-target IF MISSING
  "flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-md",
  "focus-visible:ring-2 focus-visible:ring-primary",
  // ... rest of classes
)}
```

**Implementation:**
- Tag buttons already have aria-pressed for toggle state
- Verify touch target size meets 44px minimum
- Show more/less button has aria-expanded

**Test Scenario:**
- Keyboard: Tab to tag button, press Space/Enter to toggle, verify visual state changes
- Screen reader: Verify announces "homework, 15 threads, button, pressed/not pressed"
- Touch: Verify each tag button is 44x44px minimum

---

#### Fix 6: Footer Actions Accessibility
**Priority:** Critical
**WCAG:** 2.1.1 Keyboard (A), 2.5.5 Target Size (AAA), 3.2.4 Consistent Identification (AA)

**Current State:** Footer buttons need to be created with proper attributes

**Required Changes:**
```tsx
<SheetFooter className="flex-shrink-0 flex-row gap-3 pt-4 border-t border-glass safe-bottom">
  <Button
    type="button"
    variant="outline"
    onClick={handleClearFilters}
    disabled={activeFilterCount === 0}
    className={cn(
      "flex-1 touch-target",
      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    )}
  >
    Clear filters
  </Button>
  <Button
    type="button"
    variant="default"
    onClick={handleApplyFilters}
    className={cn(
      "flex-1 touch-target",
      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    )}
  >
    Apply
  </Button>
</SheetFooter>
```

**Implementation:**
- `type="button"` prevents form submission
- `variant="outline"` for secondary action (Clear)
- `variant="default"` for primary action (Apply)
- `disabled={activeFilterCount === 0}` on Clear (can't clear if nothing active)
- `className="touch-target"` ensures 44px minimum
- `flex-1` makes buttons equal width
- `gap-3` (12px) provides spacing between buttons
- `safe-bottom` handles iOS notch/Android gesture bar

**Test Scenario:**
- Keyboard: Tab to buttons, press Enter to activate, verify focus ring visible
- Screen reader: Verify announces "Clear filters, button, disabled/enabled" and "Apply, button"
- Touch: Verify each button is 44px minimum height, easy to tap
- Disabled state: Verify Clear button is disabled when no filters active, opacity-50

---

#### Fix 7: Screen Reader Announcements (aria-live)
**Priority:** High
**WCAG:** 4.1.3 Status Messages (AA)

**Current State:** Need to add aria-live region for filter application feedback

**Required Changes:**
```tsx
// Add to MobileFilterSheet component (inside Sheet, below SheetContent)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

**Component State:**
```tsx
const [statusMessage, setStatusMessage] = useState('');

const handleApplyFilters = () => {
  // Apply filters logic (already exists)
  const filteredCount = filteredThreads.length;
  const totalCount = threads.length;

  // Set status message for screen readers
  setStatusMessage(`Filters applied. Showing ${filteredCount} of ${totalCount} threads.`);

  // Clear message after announcement (3 seconds)
  setTimeout(() => setStatusMessage(''), 3000);

  // Close sheet
  setMobileSheetOpen(false);
};

const handleClearFilters = () => {
  // Clear filters logic (already exists)
  setSearchQuery('');
  setActiveFilter('all');
  setSelectedTags([]);

  // Set status message for screen readers
  const totalCount = threads.length;
  setStatusMessage(`All filters cleared. Showing all ${totalCount} threads.`);

  // Clear message after announcement (3 seconds)
  setTimeout(() => setStatusMessage(''), 3000);
};
```

**Implementation:**
- `role="status"` indicates status update (implicit aria-live="polite")
- `aria-live="polite"` announces when user is idle (not interrupting)
- `aria-atomic="true"` announces entire message (not just changes)
- `className="sr-only"` hides visually but accessible to screen readers
- Message set when Apply or Clear is pressed
- Message cleared after 3 seconds (cleanup)

**Test Scenario:**
- Screen reader: Select filters, press Apply, verify announces "Filters applied. Showing 12 of 45 threads."
- Screen reader: Press Clear filters, verify announces "All filters cleared. Showing all 45 threads."
- Visual: Verify no visible message (sr-only)

---

#### Fix 8: Focus Management on Open/Close
**Priority:** Critical
**WCAG:** 2.4.3 Focus Order (A), 2.4.7 Focus Visible (AA)

**Current State:** Radix Dialog handles most focus management, verify behavior

**Radix Dialog Provides (Automatic):**
- Focus trap (Tab cycles within sheet)
- Focus return to trigger button on close
- Escape key closes sheet

**Required Verification:**
```tsx
// Verify in Sheet component
<Sheet
  open={mobileSheetOpen}
  onOpenChange={setMobileSheetOpen}
  // Radix automatically:
  // - Moves focus to first focusable element (or element with data-autofocus)
  // - Traps focus within sheet (Tab cycles)
  // - Returns focus to trigger on close
>
  <SheetContent>
    {/* If you want custom focus target on open */}
    <Input
      ref={searchInputRef}
      data-autofocus // Radix will focus this on open
      // ... rest of props
    />
  </SheetContent>
</Sheet>
```

**Optional: Custom Focus Target**
```tsx
// In MobileFilterSheet component
const searchInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (mobileSheetOpen && searchInputRef.current) {
    // Delay to ensure DOM ready
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }
}, [mobileSheetOpen]);

// In JSX
<Input ref={searchInputRef} {...props} />
```

**Implementation:**
- Radix Dialog handles focus trap automatically
- Focus moves to first focusable element (search input) on open
- Tab/Shift+Tab cycles through focusable elements
- Escape key closes sheet and returns focus to trigger button
- Optional: Use data-autofocus or ref.focus() for custom target

**Test Scenario:**
- Open sheet: Press Enter on trigger, verify focus moves to search input
- Tab through: Press Tab repeatedly, verify focus cycles within sheet (doesn't escape)
- Escape: Press Escape, verify sheet closes and focus returns to trigger button
- Close button: Click X, verify sheet closes and focus returns to trigger button

---

#### Fix 9: Safe Area Insets (iOS Notch, Android Gesture Bar)
**Priority:** Medium
**WCAG:** 2.5.5 Target Size (AAA) - Ensure buttons not obscured

**Current State:** Need to add safe area handling for footer buttons

**Required Changes:**
```tsx
// SheetFooter already has safe-bottom class (from Fix 6)
<SheetFooter className="... safe-bottom">
  {/* Buttons */}
</SheetFooter>
```

**QDS Safe Area Utility (Already in globals.css):**
```css
.safe-bottom {
  padding-bottom: max(var(--mobile-padding), var(--safe-area-bottom));
}

/* CSS Variables */
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--mobile-padding: 16px;
```

**Implementation:**
- `safe-bottom` class ensures footer has minimum 16px padding
- On devices with gesture bar (Android) or home indicator (iOS), padding increases
- Buttons remain accessible, not obscured by OS UI

**Test Scenario:**
- iOS: Open sheet on iPhone 14 Pro, verify Apply button not obscured by home indicator
- Android: Open sheet on Pixel 7, verify Apply button not obscured by gesture bar
- Fallback: On devices without safe area, verify minimum 16px padding

---

### 2. components/course/thread-list-sidebar.tsx (MODIFY)

#### Fix 10: Add Filter Trigger Button to Mobile Header
**Priority:** Critical
**WCAG:** 2.1.1 Keyboard (A), 2.5.5 Target Size (AAA), 4.1.2 Name, Role, Value (A)

**Current State:** Header exists, need to add filter button (mobile only)

**Required Changes:**
```tsx
// In ThreadListSidebar header section
<div className="flex items-center justify-between p-4 border-b border-glass">
  <h2 className="text-lg font-semibold">Threads</h2>

  {/* Filter button - mobile only */}
  {shouldUseModal && (
    <button
      type="button"
      onClick={() => onMobileFilterOpen?.()} // Callback from parent
      aria-label="Open filters"
      aria-expanded={isMobileFilterOpen}
      aria-controls="mobile-filter-sheet"
      className={cn(
        "touch-target",
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "hover:glass-panel transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      {activeFilterCount > 0 && (
        <Badge
          variant="default"
          className="h-5 min-w-[20px] px-1.5 text-xs"
          aria-label={`${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
        >
          {activeFilterCount}
        </Badge>
      )}
    </button>
  )}
</div>
```

**Component Props Update:**
```tsx
interface ThreadListSidebarProps {
  // ... existing props
  onMobileFilterOpen?: () => void;
  isMobileFilterOpen?: boolean;
}
```

**Active Filter Count Calculation:**
```tsx
// In ThreadListSidebar component
const activeFilterCount = useMemo(() => {
  let count = 0;
  if (searchQuery) count++;
  if (activeFilter !== 'all') count++;
  count += selectedTags.length;
  return count;
}, [searchQuery, activeFilter, selectedTags]);

const totalFilters = 8; // 1 search + 1 filter + 6 possible tags (adjust as needed)
```

**Implementation:**
- Button only rendered when `shouldUseModal` is true (mobile viewport)
- `aria-expanded` and `isMobileFilterOpen` passed from parent (Course page)
- `onMobileFilterOpen` callback triggers parent state change
- Active filter count badge shows number of active filters
- Import SlidersHorizontal icon from lucide-react

**Test Scenario:**
- Mobile viewport: Verify button visible, 44x44px minimum
- Desktop viewport: Verify button not rendered (shouldUseModal false)
- Keyboard: Tab to button, press Enter, verify sheet opens
- Screen reader: Verify announces "Open filters, button, collapsed"
- Badge: Select filters, verify count updates (e.g., "3 active filters")

---

### 3. app/courses/[courseId]/page.tsx (MODIFY)

#### Fix 11: Add Mobile Sheet State and Render MobileFilterSheet
**Priority:** Critical
**WCAG:** N/A (Integration, no direct WCAG issues)

**Current State:** Course page manages filter state, need to add mobile sheet state

**Required Changes:**
```tsx
'use client';

import { useState } from 'react';
import { MobileFilterSheet } from '@/components/course/mobile-filter-sheet';
// ... other imports

export default function CoursePage({ params }: CoursePageProps) {
  // Existing filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ADD: Mobile sheet state
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  // Existing viewport detection
  const shouldUseModal = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex h-screen">
      {/* Existing layout */}
      <ThreadListSidebar
        // ... existing props
        onMobileFilterOpen={() => setMobileFilterSheetOpen(true)}
        isMobileFilterOpen={mobileFilterSheetOpen}
      />

      {/* ADD: Mobile filter sheet (mobile only) */}
      {shouldUseModal && (
        <MobileFilterSheet
          open={mobileFilterSheetOpen}
          onOpenChange={setMobileFilterSheetOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          tags={tags}
          threads={filteredThreads}
          totalThreads={threads.length}
        />
      )}

      {/* Rest of layout */}
    </div>
  );
}
```

**Implementation:**
- Add `mobileFilterSheetOpen` state
- Pass `onMobileFilterOpen` callback to ThreadListSidebar
- Render MobileFilterSheet when `shouldUseModal` is true
- Share filter state (search, activeFilter, selectedTags) with sheet
- Pass threads data for count announcements

**Test Scenario:**
- Mobile: Open filter button, verify sheet opens and state updates
- Mobile: Close sheet (Escape/X/Apply), verify state updates
- Desktop: Verify MobileFilterSheet not rendered
- Filter sync: Change filters in sheet, verify ThreadListSidebar updates

---

### 4. components/course/sidebar-filter-panel.tsx (MODIFY)

#### Fix 12: Add Touch Target Class to Radio Buttons
**Priority:** High
**WCAG:** 2.5.5 Target Size (AAA)

**Current State:** Radio buttons may not meet 44px minimum

**Required Changes:**
```tsx
// In SidebarFilterPanel component, button className
className={cn(
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
  "touch-target", // ADD THIS LINE
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  isActive
    ? "glass-panel-strong text-foreground shadow-sm"
    : "text-muted-foreground hover:text-foreground hover:glass-panel"
)}
```

**Implementation:**
- Add `touch-target` class to ensure 44px minimum height
- Verify py-2.5 (10px top + 10px bottom) + content (~20px) + border (1px) = 41px
- `touch-target` class sets `min-height: 44px` to meet requirement

**Test Scenario:**
- Measure button height: Open DevTools, inspect button, verify height ≥ 44px
- Touch test: On mobile device, verify button easy to tap without missing

---

### 5. components/course/tag-cloud.tsx (MODIFY)

#### Fix 13: Add Touch Target Class to Tag Buttons
**Priority:** High
**WCAG:** 2.5.5 Target Size (AAA)

**Current State:** Tag buttons should already be 44px, verify

**Required Changes (if needed):**
```tsx
// In TagCloud component, tag button className
className={cn(
  "touch-target", // ADD THIS IF MISSING
  "inline-flex items-center gap-1.5 transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 rounded-full"
)}
```

**Show More/Less Button:**
```tsx
// Verify this button has touch-target class
className={cn(
  "w-full touch-target", // ADD touch-target IF MISSING
  "flex items-center justify-center gap-1.5 px-2 py-1.5 mt-1 rounded-md",
  "text-xs font-medium text-muted-foreground hover:text-foreground",
  "hover:glass-panel transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
)}
```

**Implementation:**
- Tag buttons: Verify height meets 44px (px-2.5 py-1 from Badge component)
- Show more/less: Verify height meets 44px (py-1.5 needs adjustment)
- Add `touch-target` class if calculation falls short

**Test Scenario:**
- Measure tag button height: Verify ≥ 44px
- Measure show more button height: Verify ≥ 44px
- Touch test: Verify buttons easy to tap on mobile

---

### 6. app/globals.css (VERIFY)

#### Fix 14: Verify QDS Touch Target Utility Exists
**Priority:** High
**WCAG:** 2.5.5 Target Size (AAA)

**Current State:** QDS should already define touch-target utility

**Verification:**
```css
/* Should exist in globals.css */
.touch-target {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);  /* 44px */
}

/* CSS Variable */
:root {
  --touch-target-min: 44px;
}
```

**If Missing, Add:**
```css
/* In @layer utilities section */
@layer utilities {
  .touch-target {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
  }
}
```

**Implementation:**
- Verify utility class exists in globals.css
- If missing, add to utilities layer
- Used throughout mobile filter sheet components

**Test Scenario:**
- Inspect element: Verify touch-target class applies min-height/min-width
- Measure: Verify buttons with touch-target class are 44x44px minimum

---

#### Fix 15: Verify QDS Safe Area Utilities Exist
**Priority:** Medium
**WCAG:** 2.5.5 Target Size (AAA) - Indirect (buttons not obscured)

**Current State:** QDS should already define safe area utilities

**Verification:**
```css
/* Should exist in globals.css */
.safe-bottom {
  padding-bottom: max(var(--mobile-padding), var(--safe-area-bottom));
}

/* CSS Variables */
:root {
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --mobile-padding: 16px;
}
```

**If Missing, Add:**
```css
/* In @layer utilities section */
@layer utilities {
  .safe-bottom {
    padding-bottom: max(var(--mobile-padding), var(--safe-area-bottom));
  }
}
```

**Implementation:**
- Verify utility class exists in globals.css
- Used on SheetFooter to handle iOS notch/Android gesture bar
- Ensures buttons not obscured by OS UI

**Test Scenario:**
- iOS: Verify footer padding accounts for home indicator
- Android: Verify footer padding accounts for gesture bar
- Standard: Verify minimum 16px padding on devices without safe area

---

## Testing Checklist

### Automated Testing

**Tools:**
- axe DevTools browser extension
- Lighthouse accessibility audit

**Test Steps:**
1. Install axe DevTools
2. Open mobile filter sheet
3. Run axe scan
4. Expected: 0 violations

**Common Issues:**
- Missing aria-label on icon buttons → Fix in trigger button
- Incorrect aria-checked/aria-pressed values → Verify in radio group/tags
- Insufficient color contrast → Use QDS tokens (pre-validated)
- Missing focus indicators → QDS global styles (automatic)

---

### Manual Keyboard Testing

**Test Script:**
1. **Open Sheet:** Tab to trigger button, press Enter, verify sheet opens and focus moves
2. **Navigate Sheet:** Tab through all elements, verify focus order logical
3. **Radio Group:** Tab to radio group, Arrow Up/Down to navigate, Space to select
4. **Tag Buttons:** Tab to tag button, Space/Enter to toggle, verify state changes
5. **Apply Filters:** Tab to Apply button, press Enter, verify sheet closes and focus returns
6. **Escape Key:** Open sheet, press Escape, verify closes and focus returns
7. **Close Button:** Open sheet, Tab to X button, press Enter, verify closes

**Pass Criteria:**
- All elements reachable via Tab
- Focus indicators visible (2px ring, high contrast)
- Arrow keys navigate radio group
- Space/Enter activate buttons and toggle tags
- Escape closes sheet
- Focus returns to trigger on close

---

### Screen Reader Testing

**VoiceOver (iOS):**
1. Enable VoiceOver
2. Navigate to filter trigger button, verify announces "Open filters, button"
3. Double tap to open, verify announces "Filters dialog opened. 4 of 8 active filters..."
4. Swipe through elements, verify all labels correct
5. Select filter, verify state change announced
6. Double tap Apply, verify announces "Filters applied. Showing 12 of 45 threads."

**TalkBack (Android):**
1. Enable TalkBack
2. Navigate to filter trigger button, verify announces "Open filters, button"
3. Double tap to open, verify announces "Filters dialog, 4 of 8 active filters..."
4. Swipe through elements, verify all labels correct
5. Select filter, verify state change announced
6. Double tap Apply, verify announces "Filters applied. Showing 12 of 45 threads."

**Pass Criteria:**
- All elements announced with correct role and state
- Filter descriptions provide context
- Focus order logical
- Apply action announces result

---

### Touch Target Testing

**Measurement:**
1. Open DevTools, enable device emulation
2. Select mobile device (e.g., iPhone 12)
3. Inspect each interactive element
4. Measure height and width
5. Verify ≥ 44px on both dimensions

**Elements to Measure:**
- [ ] Filter trigger button
- [ ] Close button (X)
- [ ] Search input
- [ ] Each radio button (6 total)
- [ ] Each tag button (variable count)
- [ ] Show more/less button
- [ ] Clear button
- [ ] Apply button

**Pass Criteria:**
- All interactive elements ≥ 44x44px
- Spacing between elements ≥ 8px

---

### Color Contrast Testing

**Tools:**
- Color Contrast Analyzer
- axe DevTools

**Elements to Test:**
- [ ] Sheet title text
- [ ] Body text
- [ ] Muted text (labels, descriptions)
- [ ] Active filter background + text
- [ ] Inactive filter text
- [ ] Selected tag background + text
- [ ] Unselected tag background + text
- [ ] Button text
- [ ] Focus indicators

**Pass Criteria (Light Theme):**
- Text contrast ≥ 4.5:1 (normal text)
- Text contrast ≥ 3:1 (large text ≥18px)
- UI component contrast ≥ 3:1
- Focus ring contrast ≥ 3:1

**Pass Criteria (Dark Theme):**
- Same ratios as light theme

---

### Mobile Device Testing

**Devices:**
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Android Pixel 7 (412x915)
- [ ] iPad Mini (768x1024)

**Test Scenarios:**
1. **Sheet Height:** Verify doesn't exceed 85vh, backdrop visible
2. **Safe Area:** Verify footer buttons not obscured by notch/gesture bar
3. **Touch Targets:** Verify all buttons easy to tap without missing
4. **Swipe Down:** Verify swipe down closes sheet (if supported)
5. **Tap Backdrop:** Verify tap on backdrop closes sheet
6. **Orientation:** Test portrait and landscape (if applicable)

**Pass Criteria:**
- Sheet renders correctly on all viewports
- Footer buttons accessible (not obscured)
- All interactions work smoothly

---

## Known Issues & Mitigation

### Issue 1: Glass Border Contrast
**Impact:** Glass borders have <3:1 contrast (decorative only)
**Mitigation:** State indicated via text, background, ARIA attributes (not border)
**Acceptable:** Yes, borders supplementary

### Issue 2: Tag Button Size Variance
**Impact:** Smaller tags (xs size) may be <44px
**Mitigation:** Apply touch-target class to all tag buttons (min-height: 44px)
**Acceptable:** After fix, yes

### Issue 3: Swipe Down Gesture
**Impact:** Path-based gesture (WCAG 2.5.1)
**Mitigation:** Alternatives via Close button, Escape key, backdrop tap
**Acceptable:** Yes, multiple alternatives

### Issue 4: Sheet Height on Small Screens
**Impact:** 85vh may be too tall on very small screens (<360px height)
**Mitigation:** max-h-[600px], scrollable content, always-visible close button
**Acceptable:** Yes, content accessible via scroll

---

## Implementation Order

1. **Phase 1: Core Accessibility (1-2 hours)**
   - Fix 1: Filter trigger button
   - Fix 2: Sheet container ARIA
   - Fix 8: Focus management verification
   - Fix 10: Add trigger button to header
   - Fix 11: Integrate mobile sheet state

2. **Phase 2: Input Accessibility (1 hour)**
   - Fix 3: Search input
   - Fix 4: Radio group keyboard (verify + add touch-target)
   - Fix 5: Tag cloud (verify + add touch-target)
   - Fix 6: Footer actions

3. **Phase 3: Announcements & Feedback (1 hour)**
   - Fix 7: aria-live regions
   - Test Apply action announcement
   - Test Clear action announcement

4. **Phase 4: Mobile Optimization (30 min)**
   - Fix 9: Safe area insets
   - Fix 12: Radio button touch targets
   - Fix 13: Tag button touch targets
   - Fix 14: Verify touch-target utility
   - Fix 15: Verify safe-bottom utility

5. **Phase 5: Testing & Validation (2-3 hours)**
   - Automated testing (axe, Lighthouse)
   - Keyboard testing
   - Screen reader testing (VoiceOver, TalkBack)
   - Touch target measurement
   - Color contrast validation
   - Mobile device testing

**Total Estimated Effort:** 5.5-7.5 hours

---

## Success Criteria

**All interactive elements must:**
- [ ] Be reachable via keyboard (Tab navigation)
- [ ] Have visible focus indicators (2px ring, 3:1 contrast)
- [ ] Have accessible names (aria-label or visible text)
- [ ] Have correct roles (button, radio, dialog)
- [ ] Have correct states (aria-expanded, aria-checked, aria-pressed)
- [ ] Meet touch target minimum (44x44px)
- [ ] Pass color contrast requirements (4.5:1 text, 3:1 UI)

**Screen readers must:**
- [ ] Announce all elements with correct role and state
- [ ] Announce filter count changes
- [ ] Announce Apply/Clear action results
- [ ] Navigate in logical order

**Focus management must:**
- [ ] Move focus to search input on open
- [ ] Trap focus within sheet (Tab cycles)
- [ ] Return focus to trigger button on close
- [ ] Support Escape key to close

**Mobile devices must:**
- [ ] Render sheet correctly on 360px-768px viewports
- [ ] Handle safe area insets (iOS notch, Android gesture bar)
- [ ] Support touch interactions (tap, swipe with alternatives)
- [ ] Maintain performance (no janky scrolling)

---

## Final Validation

Before marking accessibility complete:

1. **Run axe DevTools scan** → 0 violations
2. **Run Lighthouse accessibility audit** → Score ≥ 95
3. **Complete keyboard testing** → All interactions work
4. **Complete screen reader testing** → All announcements correct
5. **Measure all touch targets** → All ≥ 44x44px
6. **Validate color contrast** → All pass WCAG AA
7. **Test on mobile devices** → Works on iPhone and Android

**Sign-off required from:**
- [ ] Developer (implementation complete)
- [ ] QA (manual testing passed)
- [ ] Accessibility specialist (WCAG compliance verified)

---

## References

- **Research Document:** `research/mobile-filter-a11y-requirements.md`
- **WCAG 2.2 Quick Reference:** https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **Radix Dialog Documentation:** https://www.radix-ui.com/primitives/docs/components/dialog
- **QDS Implementation Guide:** `/QDS.md`

---

**End of Implementation Plan**

This plan provides step-by-step accessibility integration for the MobileFilterSheet component. Follow the priority order, test each fix thoroughly, and validate with automated and manual testing before deployment.

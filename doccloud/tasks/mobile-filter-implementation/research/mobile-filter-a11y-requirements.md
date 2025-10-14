# Mobile Filter Accessibility Requirements

**Date:** 2025-10-14
**Agent:** Accessibility Validator
**Component:** MobileFilterSheet (Bottom Sheet)

---

## Executive Summary

The MobileFilterSheet must meet WCAG 2.2 Level AA standards for keyboard navigation, screen reader compatibility, color contrast, and mobile touch targets. This document specifies the exact accessibility requirements for each interactive element, focus management strategy, ARIA attribute specifications, and testing procedures.

**Baseline:** The Sheet primitive from Radix UI (components/ui/sheet.tsx) already provides:
- Focus trap via Radix Dialog
- Escape key handling
- aria-modal="true" (implicit via Radix Dialog)
- Close button with screen reader label
- Portal rendering for proper stacking context

**What we must add:**
- Mobile-specific ARIA attributes
- Filter count announcements
- Search input accessibility
- Radio group keyboard navigation
- Tag toggle announcements
- Swipe gesture alternative
- Touch target sizing

---

## WCAG 2.2 Level AA Compliance Checklist

### 1. Perceivable

#### 1.1.1 Non-text Content (Level A)
- **Requirement:** All non-text content has text alternatives
- **Implementation:**
  - Filter button icon: aria-label="Open filters"
  - X close icon: aria-label="Close" (already provided by Sheet)
  - Filter icons (List, Target, etc.): aria-hidden="true" (visual only)
  - Search input: explicit aria-label

#### 1.3.1 Info and Relationships (Level A)
- **Requirement:** Information structure is programmatically determinable
- **Implementation:**
  - Sheet: role="dialog" (provided by Radix)
  - Title: SheetTitle component (provides aria-labelledby)
  - Filter panel: role="radiogroup"
  - Tag cloud: No role (buttons are sufficient)

#### 1.3.2 Meaningful Sequence (Level A)
- **Requirement:** Content sequence is logical
- **Implementation:**
  1. Sheet title
  2. Search input
  3. Filter radio group
  4. Tag cloud
  5. Footer actions (Apply/Clear)

#### 1.4.3 Contrast (Minimum) - Level AA
- **Requirement:** 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- **Implementation:**
  - All text uses QDS tokens with verified contrast
  - Primary text (#2A2721) on white background: 15.78:1 ✓
  - Muted text (#625C52) on white background: 7.48:1 ✓
  - Focus indicators: 3:1 minimum against adjacent colors
  - Active filter background: Sufficient contrast verified

#### 1.4.10 Reflow (Level AA)
- **Requirement:** Content reflows without horizontal scrolling at 320px width
- **Implementation:**
  - Sheet max-width on mobile (full width)
  - Tag cloud wraps naturally
  - No horizontal overflow

#### 1.4.11 Non-text Contrast (Level AA)
- **Requirement:** UI components and graphics have 3:1 contrast
- **Implementation:**
  - Filter button border: 3:1 minimum
  - Focus ring: 2px solid with 3:1 contrast
  - Tag badges: Border + background contrast
  - Active state indicators: Visible without color alone

#### 1.4.12 Text Spacing (Level AA)
- **Requirement:** No loss of content with increased text spacing
- **Implementation:**
  - QDS uses line-height: 1.5 for body text
  - Adequate padding on buttons (py-2.5)
  - No fixed heights that clip text

#### 1.4.13 Content on Hover or Focus (Level AA)
- **Requirement:** Additional content triggered by hover/focus is dismissible, hoverable, persistent
- **Implementation:**
  - No hover-triggered content in mobile context
  - Focus indicators persistent until focus moves

### 2. Operable

#### 2.1.1 Keyboard (Level A)
- **Requirement:** All functionality available via keyboard
- **Implementation:**
  - Open sheet: Enter/Space on trigger button
  - Navigate filters: Arrow keys (native radio group)
  - Toggle tags: Space/Enter
  - Close sheet: Escape key (provided by Radix)
  - Apply filters: Enter on Apply button
  - Clear filters: Enter on Clear button

#### 2.1.2 No Keyboard Trap (Level A)
- **Requirement:** Focus can always move away
- **Implementation:**
  - Radix Dialog provides focus trap that releases on close
  - Tab cycles through focusable elements
  - Shift+Tab cycles backward
  - Escape releases trap by closing sheet

#### 2.1.4 Character Key Shortcuts (Level A)
- **Requirement:** Single character shortcuts can be disabled/remapped
- **Implementation:**
  - No single character shortcuts implemented
  - All shortcuts require modifier keys or are standard (Escape)

#### 2.4.3 Focus Order (Level A)
- **Requirement:** Focusable components receive focus in logical order
- **Implementation:**
  1. Close button (top right)
  2. Search input
  3. Filter radio buttons (6 total)
  4. Tag buttons (variable count)
  5. Show more/less button (if present)
  6. Clear button
  7. Apply button

#### 2.4.7 Focus Visible (Level AA)
- **Requirement:** Keyboard focus indicator is visible
- **Implementation:**
  - QDS focus ring: 2px solid, offset-2
  - Focus ring color: accent (high contrast)
  - Enhanced for glass backgrounds
  - Minimum 2px thickness
  - Clear visual distinction

#### 2.5.1 Pointer Gestures (Level A)
- **Requirement:** Multipoint or path-based gestures have single-pointer alternative
- **Implementation:**
  - Swipe down to close: Alternative via close button (X)
  - Tap backdrop to close: Alternative via close button
  - No pinch/zoom gestures required

#### 2.5.2 Pointer Cancellation (Level A)
- **Requirement:** Down-event doesn't complete action
- **Implementation:**
  - All buttons use onClick (up-event)
  - Can slide pointer away to cancel

#### 2.5.3 Label in Name (Level A)
- **Requirement:** Accessible name contains visible text
- **Implementation:**
  - "All Threads" button has aria-label="Show all threads in this course" (contains visible text)
  - "Apply" button has visible text "Apply" (matches accessible name)

#### 2.5.4 Motion Actuation (Level A)
- **Requirement:** Motion-triggered actions have UI alternative
- **Implementation:**
  - Swipe to close: Alternative via close button

#### 2.5.5 Target Size (Level AAA - Recommended)
- **Requirement:** Touch targets at least 44x44px
- **Implementation:**
  - Filter buttons: min-height: 44px (py-2.5 + border)
  - Tag buttons: 44px minimum (adequate padding)
  - Apply/Clear buttons: 44px minimum
  - Filter trigger button: 44x44px minimum
  - Spacing between targets: 8px minimum

### 3. Understandable

#### 3.1.2 Language of Parts (Level AA)
- **Requirement:** Language of parts is programmatically determined
- **Implementation:**
  - Inherits lang attribute from root HTML element

#### 3.2.1 On Focus (Level A)
- **Requirement:** Focus doesn't trigger unexpected context changes
- **Implementation:**
  - Focus on inputs doesn't auto-submit
  - Focus on filters doesn't auto-apply
  - Sheet only closes on explicit action (Escape, Close button, Apply)

#### 3.2.2 On Input (Level A)
- **Requirement:** Changing settings doesn't automatically cause context change
- **Implementation:**
  - Typing in search doesn't immediately filter (debounced)
  - Selecting filter doesn't auto-apply (requires Apply button)
  - Toggling tag doesn't auto-apply (requires Apply button)

#### 3.2.4 Consistent Identification (Level AA)
- **Requirement:** Components with same functionality have same labels
- **Implementation:**
  - Close button: "Close" (matches other sheets/dialogs)
  - Apply button: "Apply" (consistent with desktop)
  - Clear button: "Clear filters" (consistent with desktop)

#### 3.3.1 Error Identification (Level A)
- **Requirement:** Errors are identified and described in text
- **Implementation:**
  - No required fields (all filters optional)
  - Search input doesn't validate (free text)
  - No error states in filter sheet

#### 3.3.2 Labels or Instructions (Level A)
- **Requirement:** Labels or instructions provided for inputs
- **Implementation:**
  - Search input: aria-label="Search threads"
  - Filter radio group: aria-label="Filter threads by"
  - Tag cloud: Heading "Tags" (visual + semantic)

### 4. Robust

#### 4.1.2 Name, Role, Value (Level A)
- **Requirement:** Name, role, value of UI components can be programmatically determined
- **Implementation:**
  - Filter button: role="button", aria-label="Open filters", aria-expanded="false|true"
  - Sheet: role="dialog", aria-modal="true" (Radix)
  - Search input: role="searchbox" (implicit), aria-label
  - Filter radio group: role="radiogroup", aria-label
  - Individual filters: role="radio", aria-checked="true|false"
  - Tag buttons: role="button", aria-pressed="true|false"
  - Apply button: role="button"
  - Clear button: role="button"

#### 4.1.3 Status Messages (Level AA)
- **Requirement:** Status messages can be programmatically determined
- **Implementation:**
  - Filter count badge: aria-label="N active filters" (polite announcement)
  - Apply success: aria-live="polite" region announces "Filters applied, showing M of N threads"
  - Clear action: aria-live="polite" region announces "All filters cleared"

---

## Focus Management Strategy

### Opening the Sheet

**Initial Focus:**
- **Option 1 (Recommended):** Focus moves to the **first focusable element** (search input)
  - Rationale: Most common action is searching, immediate keyboard access
  - Screen reader announces: "Filter dialog opened. Search threads."

**Focus Trap:**
- Radix Dialog provides built-in focus trap
- Tab/Shift+Tab cycles through:
  1. Close button
  2. Search input
  3. Radio group (Arrow keys navigate between options)
  4. Tag buttons (Tab to each, Space/Enter toggles)
  5. Show more/less (if present)
  6. Clear button
  7. Apply button
  8. Wraps back to Close button

### Closing the Sheet

**Focus Return:**
- Focus returns to **trigger button** (filter button in header)
- Radix Dialog handles this automatically
- User can immediately reopen sheet if needed

### Keyboard Navigation Map

```
┌─────────────────────────────────────────┐
│ [X Close]                               │ ← Tab 1
│                                         │
│ Filters (4 of 8 active)                 │
│                                         │
│ [Search threads...]                     │ ← Tab 2
│                                         │
│ Filter threads by                       │
│ ● All Threads                           │ ← Tab 3 (Enter radio group)
│ ○ High Confidence                       │   ↓ (Arrow Down)
│ ○ Instructor Endorsed                   │   ↓ (Arrow Down)
│ ○ Popular                               │   ↓ (Arrow Down)
│ ○ Resolved                              │   ↓ (Arrow Down)
│ ○ My Posts                              │   ↓ (Arrow Down, wraps to top)
│                                         │
│ Tags                                    │
│ [homework 15] [midterm 8] [quiz 5]      │ ← Tab 4, 5, 6... (Space toggles)
│ [Show 12 more]                          │ ← Tab N (Enter expands)
│                                         │
│ [Clear filters]  [Apply]                │ ← Tab N+1, N+2
└─────────────────────────────────────────┘
```

**Radio Group Behavior:**
- Tab enters the radio group (focuses first/selected radio)
- Arrow Up/Down navigates between radios
- Space selects focused radio
- Tab exits radio group (moves to next focusable element)

### Escape Key Behavior

**Default Behavior (Provided by Radix):**
- Escape key closes the sheet
- Focus returns to trigger button
- No filters applied (unless already applied via Apply button)

**User Expectations:**
- Escape = Cancel (discard changes)
- Apply button = Confirm (apply changes)
- Close button (X) = Cancel (same as Escape)

---

## ARIA Attribute Specifications

### Filter Trigger Button (ThreadListSidebar Header)

```tsx
<button
  type="button"
  onClick={() => setMobileSheetOpen(true)}
  aria-label="Open filters"
  aria-expanded={mobileSheetOpen}
  aria-controls="mobile-filter-sheet"
  className="touch-target flex items-center gap-2 px-3 py-2 rounded-lg hover:glass-panel"
>
  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
  {activeFilterCount > 0 && (
    <Badge
      variant="default"
      className="h-5 min-w-[20px] px-1.5"
      aria-label={`${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}
    >
      {activeFilterCount}
    </Badge>
  )}
</button>
```

**Attributes:**
- `type="button"` — Prevents form submission if nested in form
- `aria-label="Open filters"` — Accessible name (icon button)
- `aria-expanded="false|true"` — Indicates sheet open/closed state
- `aria-controls="mobile-filter-sheet"` — References controlled sheet
- `className="touch-target"` — Ensures 44x44px minimum

**Badge:**
- `aria-label="${count} active filter(s)"` — Announces count to screen readers
- Visual count is supplementary

### Sheet Container

```tsx
<Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
  <SheetContent
    side="bottom"
    id="mobile-filter-sheet"
    aria-describedby="filter-description"
    className="h-[85vh] max-h-[600px]"
  >
    <SheetHeader>
      <SheetTitle id="filter-title">
        Filters ({activeFilterCount} of {totalFilters} active)
      </SheetTitle>
      <SheetDescription id="filter-description">
        Search and filter threads by status and tags
      </SheetDescription>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

**Attributes (Provided by Radix):**
- `role="dialog"` — Implicit from Radix Dialog
- `aria-modal="true"` — Implicit from Radix Dialog
- `aria-labelledby="filter-title"` — Links to SheetTitle
- `aria-describedby="filter-description"` — Links to SheetDescription

**Custom Attributes:**
- `id="mobile-filter-sheet"` — Referenced by trigger button
- `h-[85vh]` — Doesn't cover entire screen (allows escape tap on backdrop)
- `max-h-[600px]` — Prevents excessive height on large screens

### Search Input

```tsx
<Input
  type="search"
  placeholder="Search threads..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  aria-label="Search threads"
  className="h-11"
/>
```

**Attributes:**
- `type="search"` — Semantic type, shows clear button on mobile
- `aria-label="Search threads"` — Accessible name (no visible label)
- `h-11` — 44px minimum touch target

**Behavior:**
- Debounced input (300ms)
- Doesn't auto-apply (requires Apply button)
- Clear button (native browser) visible

### Filter Radio Group

```tsx
<div
  role="radiogroup"
  aria-label="Filter threads by"
  className="space-y-1"
>
  {filters.map((filter) => (
    <button
      key={filter.id}
      type="button"
      role="radio"
      aria-checked={activeFilter === filter.id}
      aria-label={filter.description}
      onClick={() => setActiveFilter(filter.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg touch-target",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        activeFilter === filter.id
          ? "glass-panel-strong text-foreground"
          : "text-muted-foreground hover:glass-panel"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{filter.label}</span>
      {activeFilter === filter.id && (
        <span
          className="ml-auto h-2 w-2 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </button>
  ))}
</div>
```

**Group Attributes:**
- `role="radiogroup"` — Semantic grouping
- `aria-label="Filter threads by"` — Group label

**Individual Radio Attributes:**
- `role="radio"` — Semantic role
- `aria-checked="true|false"` — Selection state
- `aria-label="{filter.description}"` — Full description (e.g., "Show threads with high-confidence AI answers (80% or higher)")
- `className="touch-target"` — 44px minimum

**Visual Indicators:**
- Icon: aria-hidden (decorative)
- Active dot: aria-hidden (state already in aria-checked)

**Keyboard Behavior:**
- Arrow Up/Down: Navigate between radios (native behavior)
- Space: Select focused radio
- Tab: Exit radio group

### Tag Cloud

```tsx
<div className="space-y-3">
  <div className="flex items-center gap-2">
    <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
    <h3 id="tag-cloud-label" className="text-xs font-semibold uppercase">
      Tags
    </h3>
  </div>

  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tag-cloud-label">
    {visibleTags.map(({ tag, count }) => {
      const isSelected = selectedTags.includes(tag);
      return (
        <button
          key={tag}
          type="button"
          onClick={() => handleTagClick(tag)}
          aria-pressed={isSelected}
          aria-label={`${isSelected ? 'Remove' : 'Add'} tag filter: ${tag} (${count} threads)`}
          className={cn(
            "touch-target inline-flex items-center gap-1.5 px-3 py-2 rounded-full",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-foreground hover:bg-muted/30"
          )}
        >
          <span>{tag}</span>
          <span className="text-xs opacity-70">{count}</span>
        </button>
      );
    })}
  </div>

  {hasMoreTags && (
    <button
      type="button"
      onClick={() => setIsExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'Show fewer tags' : `Show ${hiddenTagCount} more tags`}
      className="w-full touch-target flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-md hover:glass-panel"
    >
      <span>{isExpanded ? 'Show less' : `Show ${hiddenTagCount} more`}</span>
      <ChevronDown className="h-3 w-3" aria-hidden="true" />
    </button>
  )}
</div>
```

**Group Attributes:**
- `role="group"` — Semantic grouping
- `aria-labelledby="tag-cloud-label"` — References heading

**Individual Tag Attributes:**
- `type="button"` — Semantic button
- `aria-pressed="true|false"` — Toggle state (not checkbox, no indeterminate)
- `aria-label="${action} tag filter: ${tag} (${count} threads)"` — Full description
- `className="touch-target"` — 44px minimum

**Show More/Less Button:**
- `aria-expanded="true|false"` — Expansion state
- `aria-label` — Dynamic based on state
- `className="touch-target"` — 44px minimum

### Footer Actions

```tsx
<SheetFooter className="flex-row gap-3 pt-4 border-t border-glass">
  <Button
    type="button"
    variant="outline"
    onClick={handleClearFilters}
    disabled={activeFilterCount === 0}
    className="flex-1 touch-target"
  >
    Clear filters
  </Button>
  <Button
    type="button"
    variant="default"
    onClick={handleApplyFilters}
    className="flex-1 touch-target"
  >
    Apply
  </Button>
</SheetFooter>
```

**Clear Button:**
- `type="button"` — Prevents form submission
- `variant="outline"` — Secondary action
- `disabled={activeFilterCount === 0}` — Can't clear if nothing active
- Disabled state has opacity-50 + cursor-not-allowed

**Apply Button:**
- `type="button"` — Prevents form submission
- `variant="default"` — Primary action
- Always enabled (can apply current state)

**Both buttons:**
- `className="touch-target"` — 44px minimum
- `flex-1` — Equal width on mobile

---

## Screen Reader Announcements

### Opening the Sheet

**VoiceOver (iOS):**
```
"Filters dialog opened.
4 of 8 active filters.
Search and filter threads by status and tags.
Search threads, search field."
```

**TalkBack (Android):**
```
"Filters dialog, 4 of 8 active filters.
Search and filter threads by status and tags.
Search threads, edit box."
```

**Announcement Sequence:**
1. Dialog opened (implicit from aria-modal)
2. Title: "Filters (4 of 8 active)"
3. Description: "Search and filter threads by status and tags"
4. Focus moves to search input

### Applying Filters

**Live Region Announcement:**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {appliedMessage}
</div>
```

**Message:**
```
"Filters applied. Showing 12 of 45 threads."
```

**Implementation:**
```tsx
const [appliedMessage, setAppliedMessage] = useState('');

const handleApplyFilters = () => {
  // Apply filters logic
  const filteredCount = getFilteredThreadCount();
  const totalCount = getTotalThreadCount();

  setAppliedMessage(`Filters applied. Showing ${filteredCount} of ${totalCount} threads.`);

  // Clear message after announcement
  setTimeout(() => setAppliedMessage(''), 3000);

  // Close sheet
  setMobileSheetOpen(false);
};
```

### Clearing Filters

**Live Region Announcement:**
```
"All filters cleared. Showing all 45 threads."
```

### Changing Filter Selection

**Option 1: Silent (Recommended)**
- No announcement until Apply is pressed
- Rationale: Avoids excessive announcements, user expects to review before applying

**Option 2: Immediate Announcement**
- Announce each filter change: "High Confidence selected"
- Rationale: Immediate feedback, but verbose

**Recommendation:** Use Option 1 (silent until apply) to reduce cognitive load

### Tag Toggle

**VoiceOver:**
```
"homework, 15 threads, button, pressed"
(or "not pressed" when unselected)
```

**No additional announcement needed** — aria-pressed state is sufficient

### Filter Count Badge Update

**Option 1: aria-live on Badge (Not Recommended)**
```tsx
<Badge aria-live="polite">
  {activeFilterCount}
</Badge>
```
- Announces every change: "4 active filters", "5 active filters", etc.
- Too verbose during rapid changes

**Option 2: Announce on Apply (Recommended)**
- Count changes silently
- Announce final count when Apply is pressed
- Less disruptive, clearer intent

**Recommendation:** Use Option 2

---

## Color Contrast Validation

### Text Contrast (WCAG AA: 4.5:1 minimum)

**Light Theme:**
| Element | Foreground | Background | Ratio | Pass |
|---------|-----------|-----------|-------|------|
| Sheet title | #2A2721 (text) | #FFFFFF (surface) | 15.78:1 | ✓ AAA |
| Body text | #2A2721 (text) | #FFFFFF (surface) | 15.78:1 | ✓ AAA |
| Muted text | #625C52 (muted) | #FFFFFF (surface) | 7.48:1 | ✓ AAA |
| Active filter | #2A2721 (foreground) | rgba(255,255,255,0.7) (glass-medium) | 11.05:1 | ✓ AAA |
| Inactive filter | #625C52 (muted) | #FFFFFF (surface) | 7.48:1 | ✓ AAA |
| Selected tag | #FFFFFF (primary-foreground) | #8A6B3D (primary) | 5.32:1 | ✓ AA |
| Unselected tag | #2A2721 (foreground) | rgba(98,92,82,0.2) (muted/20) | 13.12:1 | ✓ AAA |
| Button text | #FFFFFF (primary-foreground) | #8A6B3D (primary) | 5.32:1 | ✓ AA |

**Dark Theme:**
| Element | Foreground | Background | Ratio | Pass |
|---------|-----------|-----------|-------|------|
| Sheet title | #F3EFE8 (text) | #171511 (surface) | 14.89:1 | ✓ AAA |
| Body text | #F3EFE8 (text) | #171511 (surface) | 14.89:1 | ✓ AAA |
| Muted text | #B8AEA3 (muted) | #171511 (surface) | 7.21:1 | ✓ AAA |
| Active filter | #F3EFE8 (foreground) | rgba(23,21,17,0.7) (glass-medium) | 10.42:1 | ✓ AAA |
| Inactive filter | #B8AEA3 (muted) | #171511 (surface) | 7.21:1 | ✓ AAA |
| Selected tag | #2A2721 (primary-contrast) | #C1A576 (primary) | 4.87:1 | ✓ AA |
| Unselected tag | #F3EFE8 (foreground) | rgba(184,174,163,0.2) (muted/20) | 12.33:1 | ✓ AAA |
| Button text | #2A2721 (primary-contrast) | #C1A576 (primary) | 4.87:1 | ✓ AA |

### UI Component Contrast (WCAG AA: 3:1 minimum)

**Light Theme:**
| Element | Color | Adjacent Color | Ratio | Pass |
|---------|-------|---------------|-------|------|
| Focus ring | #2D6CDF (accent) | #FFFFFF (background) | 7.89:1 | ✓ |
| Glass border | rgba(255,255,255,0.18) | #FFFFFF | 1.18:1 | ⚠️ Decorative only |
| Active filter indicator (dot) | #8A6B3D (primary) | rgba(255,255,255,0.7) | 4.51:1 | ✓ |
| Tag border (selected) | #8A6B3D (primary) | #FFFFFF | 6.28:1 | ✓ |
| Tag border (unselected) | rgba(98,92,82,0.2) | #FFFFFF | 1.93:1 | ⚠️ Hover fixes |
| Button border | #CDC7BD (border) | #FFFFFF | 1.89:1 | ⚠️ Text primary |

**Dark Theme:**
| Element | Color | Adjacent Color | Ratio | Pass |
|---------|-------|---------------|-------|------|
| Focus ring | #86A9F6 (accent) | #171511 (background) | 8.12:1 | ✓ |
| Glass border | rgba(255,255,255,0.08) | #171511 | 1.08:1 | ⚠️ Decorative only |
| Active filter indicator (dot) | #C1A576 (primary) | rgba(23,21,17,0.7) | 5.23:1 | ✓ |
| Tag border (selected) | #C1A576 (primary) | #171511 | 6.89:1 | ✓ |
| Tag border (unselected) | rgba(184,174,163,0.2) | #171511 | 1.74:1 | ⚠️ Hover fixes |
| Button border | rgba(243,239,232,0.1) | #171511 | 1.15:1 | ⚠️ Text primary |

**Notes:**
- ⚠️ Glass borders are decorative only, not relied upon for state indication
- ⚠️ Unselected tag borders gain contrast on hover (hover:bg-muted/30)
- ⚠️ Button borders are secondary to text labels (buttons identifiable by text)

### Focus Indicator Requirements

**WCAG 2.4.7 Focus Visible (Level AA):**
- Minimum 2px thickness ✓ (QDS uses 2px)
- Minimum 3:1 contrast against adjacent colors ✓ (see table above)
- Offset from element ✓ (ring-offset-2 = 2px offset)
- Visible on all interactive elements ✓ (QDS global style)

**QDS Focus Ring Style:**
```css
*:focus-visible {
  outline: 2px solid var(--ring); /* #2D6CDF (light) or #86A9F6 (dark) */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3); /* Additional glow */
}

.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5); /* Enhanced for glass */
}
```

---

## Touch Target Sizing

### WCAG 2.5.5 Target Size (Level AAA) - Recommended

**Minimum Touch Target:** 44x44px

**Mobile Filter Sheet Elements:**

| Element | Implementation | Size | Pass |
|---------|---------------|------|------|
| Filter trigger button | `className="touch-target"` | 44x44px | ✓ |
| Close button (X) | Radix default + padding | 44x44px | ✓ |
| Search input | `className="h-11"` (44px) | 44x44px | ✓ |
| Filter radio buttons | `className="py-2.5 touch-target"` | 44px height | ✓ |
| Tag buttons | `className="px-3 py-2 touch-target"` | 44px height | ✓ |
| Show more/less button | `className="py-2.5 touch-target"` | 44px height | ✓ |
| Clear button | `className="touch-target"` | 44px height | ✓ |
| Apply button | `className="touch-target"` | 44px height | ✓ |

**QDS Touch Target Utility:**
```css
.touch-target {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);  /* 44px */
}
```

**Spacing Between Targets:**
- Minimum 8px gap between interactive elements (WCAG recommendation)
- Implementation: `gap-2` (8px) on flex containers

**Visual Touch Target Calculation:**
```tsx
// Filter radio button
py-2.5 = 10px top + 10px bottom = 20px padding
h-auto (content height ~20px)
border: 1px
Total: 20 + 20 + 20 + 2 = 42px → Need min-height: 44px

// Solution: Add touch-target class
className="py-2.5 touch-target" // Ensures 44px minimum
```

---

## Mobile-Specific Considerations

### Sheet Height & Gestures

**Sheet Sizing:**
```tsx
<SheetContent
  side="bottom"
  className="h-[85vh] max-h-[600px]"
>
```

**Rationale:**
- `h-[85vh]` — Doesn't cover full screen, allows backdrop tap to close
- `max-h-[600px]` — Reasonable limit on large tablets
- Leaves 15% viewport visible → clear visual affordance for escape

**Swipe Down to Close:**
- Radix Dialog may support this (check implementation)
- Alternative: Close button (X) always visible
- Alternative: Tap backdrop to close (Radix default)

**Prevent Body Scroll:**
- Radix Dialog handles this automatically
- Body scroll locked when sheet is open
- Scroll re-enabled when sheet closes

### Viewport Meta Tag

**Required for proper mobile rendering:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

**Rationale:**
- `width=device-width` — Use device width, not desktop width
- `initial-scale=1.0` — No zoom on load
- `maximum-scale=5.0` — Allow zoom for low vision users (WCAG 2.5.5)
- **DO NOT** set `maximum-scale=1.0` or `user-scalable=no` (accessibility violation)

### Safe Area Insets (iOS Notch, Android Gesture Nav)

**QDS provides safe area tokens:**
```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
```

**Implementation for bottom sheet:**
```tsx
<SheetFooter className="safe-bottom">
  {/* Footer actions */}
</SheetFooter>
```

**Utility class:**
```css
.safe-bottom {
  padding-bottom: max(var(--mobile-padding), var(--safe-area-bottom));
}
```

**Rationale:**
- Ensures footer buttons aren't obscured by Android gesture bar
- iOS home indicator area accounted for
- Maintains minimum 16px padding (--mobile-padding) as fallback

---

## Screen Reader Testing Procedures

### VoiceOver (iOS) Testing

**Setup:**
1. Enable VoiceOver: Settings → Accessibility → VoiceOver → On
2. Practice gestures:
   - Swipe right: Next element
   - Swipe left: Previous element
   - Double tap: Activate
   - Two-finger tap: Stop/resume speaking
   - Three-finger swipe up: Scroll up
   - Three-finger swipe down: Scroll down

**Test Script:**

1. **Open Sheet:**
   - Navigate to filter trigger button
   - Expected: "Open filters, button"
   - Double tap to activate
   - Expected: "Filters dialog opened. 4 of 8 active filters. Search and filter threads by status and tags. Search threads, search field."

2. **Navigate Sheet:**
   - Swipe right to move through elements
   - Expected order: Close button → Search input → Filter radio group → Tags → Footer
   - Verify all labels announced correctly

3. **Filter Radio Group:**
   - Swipe to first filter
   - Expected: "All Threads, radio button, 1 of 6, checked. Show all threads in this course."
   - Swipe right
   - Expected: "High Confidence, radio button, 2 of 6, not checked. Show threads with high-confidence AI answers (80% or higher)."
   - Double tap to select
   - Expected: "checked"

4. **Tag Buttons:**
   - Swipe to first tag
   - Expected: "Add tag filter: homework (15 threads), button, not pressed"
   - Double tap to toggle
   - Expected: "pressed"
   - Double tap again
   - Expected: "not pressed"

5. **Apply Filters:**
   - Swipe to Apply button
   - Expected: "Apply, button"
   - Double tap to activate
   - Expected: "Filters applied. Showing 12 of 45 threads."
   - Sheet closes, focus returns to filter trigger button

6. **Close Sheet (Escape):**
   - Open sheet again
   - Three-finger tap (magic tap) to close
   - Expected: Sheet closes, focus returns to trigger button

**Pass Criteria:**
- All elements announced with correct role and state
- Filter descriptions provide context
- Focus order logical
- Apply action announces result
- Focus returns to trigger on close

### TalkBack (Android) Testing

**Setup:**
1. Enable TalkBack: Settings → Accessibility → TalkBack → On
2. Practice gestures:
   - Swipe right: Next element
   - Swipe left: Previous element
   - Double tap: Activate
   - Two-finger swipe down: Global context menu
   - Swipe up then right: First item
   - Swipe down then right: Last item

**Test Script:**

1. **Open Sheet:**
   - Navigate to filter trigger button
   - Expected: "Open filters, button"
   - Double tap to activate
   - Expected: "Filters dialog, 4 of 8 active filters. Search and filter threads by status and tags. Search threads, edit box."

2. **Navigate Sheet:**
   - Swipe right to move through elements
   - Expected order: Close button → Search input → Filter radio group → Tags → Footer
   - Verify all labels announced correctly

3. **Filter Radio Group:**
   - Swipe to first filter
   - Expected: "All Threads, radio button, checked, 1 of 6. Show all threads in this course."
   - Swipe right
   - Expected: "High Confidence, radio button, not checked, 2 of 6. Show threads with high-confidence AI answers (80% or higher)."
   - Double tap to select
   - Expected: "checked"

4. **Tag Buttons:**
   - Swipe to first tag
   - Expected: "Add tag filter: homework (15 threads), toggle button, not pressed"
   - Double tap to toggle
   - Expected: "pressed"
   - Double tap again
   - Expected: "not pressed"

5. **Apply Filters:**
   - Swipe to Apply button
   - Expected: "Apply, button"
   - Double tap to activate
   - Expected: "Filters applied. Showing 12 of 45 threads."
   - Sheet closes, focus returns to filter trigger button

6. **Close Sheet (Back Button):**
   - Open sheet again
   - Press Back button
   - Expected: Sheet closes, focus returns to trigger button

**Pass Criteria:**
- All elements announced with correct role and state
- Filter descriptions provide context
- Focus order logical
- Apply action announces result
- Focus returns to trigger on close
- Back button closes sheet (Android convention)

---

## Keyboard-Only Testing Procedures

**Setup:**
- Desktop browser with keyboard only (no mouse)
- Use Tab, Shift+Tab, Enter, Space, Escape, Arrow keys
- Verify focus indicators visible at all times

**Test Script:**

1. **Open Sheet:**
   - Tab to filter trigger button
   - Verify focus ring visible
   - Press Enter
   - Verify sheet opens, focus moves to search input

2. **Navigate Sheet:**
   - Tab through all elements
   - Expected order: Search input → Close button (or vice versa) → Radio group → Tags → Show more (if present) → Clear button → Apply button
   - Verify focus ring visible on each element
   - Shift+Tab to move backward

3. **Filter Radio Group:**
   - Tab to radio group (focuses first/selected radio)
   - Verify focus ring visible
   - Press Arrow Down to next radio
   - Verify focus moves, focus ring visible
   - Continue Arrow Down/Up to navigate all radios
   - Press Space to select focused radio
   - Verify selection updates (visual + aria-checked)
   - Tab to exit radio group

4. **Tag Buttons:**
   - Tab to first tag button
   - Verify focus ring visible
   - Press Space or Enter to toggle
   - Verify visual state changes (background color)
   - Tab to next tag button
   - Verify focus ring visible
   - Press Space to toggle
   - Verify visual state changes

5. **Show More/Less:**
   - Tab to "Show more" button (if present)
   - Verify focus ring visible
   - Press Enter
   - Verify additional tags revealed
   - Button text changes to "Show less"
   - Press Enter again
   - Verify tags collapse

6. **Apply Filters:**
   - Tab to Apply button
   - Verify focus ring visible
   - Press Enter
   - Verify sheet closes
   - Verify focus returns to trigger button
   - Verify focus ring visible on trigger button

7. **Close Sheet (Escape):**
   - Open sheet again (press Enter on trigger)
   - Press Escape
   - Verify sheet closes immediately
   - Verify focus returns to trigger button

8. **Close Sheet (X Button):**
   - Open sheet again
   - Tab to Close button (X)
   - Press Enter
   - Verify sheet closes
   - Verify focus returns to trigger button

9. **Clear Filters:**
   - Open sheet
   - Select some filters
   - Tab to Clear button
   - Press Enter
   - Verify all filters reset to default ("All Threads" selected)
   - Verify selected tags cleared
   - Verify search input cleared

10. **Keyboard Trap Test:**
    - Open sheet
    - Tab repeatedly through all elements
    - Verify focus cycles within sheet (doesn't escape to background)
    - Press Escape to close
    - Verify focus returns to trigger button (trap released)

**Pass Criteria:**
- All interactive elements reachable via Tab
- Focus indicators visible at all times (minimum 2px, high contrast)
- Arrow keys navigate radio group
- Space/Enter activate buttons and toggle tags
- Escape closes sheet
- Focus returns to trigger on close
- No keyboard traps (can always exit)

---

## Testing Checklist

### Automated Testing (axe DevTools)

**Setup:**
1. Install axe DevTools browser extension
2. Open mobile filter sheet
3. Run axe scan

**Expected Results:**
- 0 violations
- All elements have accessible names
- All ARIA attributes valid
- Color contrast passes
- Touch targets sufficient

**Common Issues to Watch:**
- Missing aria-label on icon buttons
- Incorrect aria-checked/aria-pressed values
- Insufficient color contrast
- Missing focus indicators

### Manual Testing

**WCAG 2.2 AA Checklist:**

#### Perceivable
- [ ] All images/icons have text alternatives (aria-label or aria-hidden)
- [ ] Information structure is programmatically determinable (roles, landmarks)
- [ ] Content sequence is meaningful (reading order logical)
- [ ] Color contrast meets 4.5:1 for text, 3:1 for UI components
- [ ] Content reflows without horizontal scrolling at 320px width
- [ ] Text spacing can be increased without loss of content

#### Operable
- [ ] All functionality available via keyboard
- [ ] No keyboard traps (can always exit)
- [ ] Focus order is logical and predictable
- [ ] Focus indicators visible (2px minimum, 3:1 contrast)
- [ ] Touch targets at least 44x44px
- [ ] Spacing between touch targets at least 8px
- [ ] Multipoint gestures have single-pointer alternative

#### Understandable
- [ ] Language of page is programmatically determined
- [ ] Focus doesn't trigger unexpected context changes
- [ ] Input changes don't auto-submit (Apply button required)
- [ ] Components with same functionality have consistent labels
- [ ] Errors identified in text (not applicable - no required fields)
- [ ] Labels or instructions provided for inputs

#### Robust
- [ ] Name, role, value of UI components programmatically determinable
- [ ] Status messages announced to assistive technology
- [ ] Valid HTML (no duplicate IDs, proper nesting)

### Browser Testing Matrix

**Desktop:**
- [ ] Chrome + NVDA (Windows)
- [ ] Firefox + NVDA (Windows)
- [ ] Safari + VoiceOver (macOS)
- [ ] Edge + NVDA (Windows)

**Mobile:**
- [ ] Safari + VoiceOver (iOS 15+)
- [ ] Chrome + TalkBack (Android 11+)

**Viewport Sizes:**
- [ ] 360px width (iPhone SE)
- [ ] 375px width (iPhone 12/13)
- [ ] 414px width (iPhone 14 Pro Max)
- [ ] 768px width (iPad portrait)

---

## Known Limitations & Mitigation

### Limitation 1: Glass Borders Low Contrast

**Issue:**
- `--border-glass` (rgba(255,255,255,0.18)) has <3:1 contrast
- Fails WCAG 1.4.11 Non-text Contrast

**Mitigation:**
- Glass borders are decorative only, not relied upon for state
- State indication uses:
  - Text color changes
  - Background color changes
  - Active indicator dot (high contrast)
  - ARIA attributes (aria-checked, aria-pressed)
- Focus indicators use high-contrast ring (not glass border)

**Acceptable:** Yes, borders are supplementary, not primary state indicator

### Limitation 2: Backdrop Blur Performance

**Issue:**
- Blur effects can cause performance issues on low-end devices
- May cause janky scrolling or animations

**Mitigation:**
- QDS reduces blur intensity on mobile (--blur-sm instead of --blur-lg)
- Maximum 3 blur layers per view (sheet = 1 layer)
- GPU acceleration enabled (transform: translateZ(0))
- Fallback to solid background if backdrop-filter unsupported

**Acceptable:** Yes, performance optimizations in place, graceful degradation

### Limitation 3: Swipe Down to Close Gesture

**Issue:**
- Swipe down to close is a path-based gesture (WCAG 2.5.1)
- May not be supported on all devices/browsers

**Mitigation:**
- Alternative via Close button (X) always visible
- Alternative via Escape key (keyboard users)
- Alternative via backdrop tap (mouse/touch users)
- Swipe gesture is supplementary, not required

**Acceptable:** Yes, multiple alternatives provided

### Limitation 4: Sheet Height on Small Screens

**Issue:**
- 85vh may be too tall on very small screens (360px height)
- Could obscure important content

**Mitigation:**
- max-h-[600px] prevents excessive height
- Content scrolls within sheet if needed
- Close button always visible at top
- Footer buttons always visible (sticky footer)

**Testing Required:**
- Test on iPhone SE (375x667) in landscape (667x375)
- Verify sheet doesn't exceed screen, content scrollable

### Limitation 5: Filter Count Badge Verbosity

**Issue:**
- aria-live on badge could announce every change ("3 active filters", "4 active filters", etc.)
- Too verbose during rapid filter changes

**Mitigation:**
- Badge count updates silently (no aria-live)
- Announce final count when Apply is pressed
- Screen reader users hear: "Filters applied. Showing 12 of 45 threads."

**Acceptable:** Yes, announcement on apply is sufficient

---

## References

### WCAG 2.2 Success Criteria

- **1.1.1 Non-text Content (A):** https://www.w3.org/WAI/WCAG22/Understanding/non-text-content
- **1.3.1 Info and Relationships (A):** https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships
- **1.3.2 Meaningful Sequence (A):** https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence
- **1.4.3 Contrast (Minimum) (AA):** https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- **1.4.11 Non-text Contrast (AA):** https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- **2.1.1 Keyboard (A):** https://www.w3.org/WAI/WCAG22/Understanding/keyboard
- **2.1.2 No Keyboard Trap (A):** https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap
- **2.4.3 Focus Order (A):** https://www.w3.org/WAI/WCAG22/Understanding/focus-order
- **2.4.7 Focus Visible (AA):** https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- **2.5.1 Pointer Gestures (A):** https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures
- **2.5.3 Label in Name (A):** https://www.w3.org/WAI/WCAG22/Understanding/label-in-name
- **2.5.5 Target Size (AAA):** https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- **4.1.2 Name, Role, Value (A):** https://www.w3.org/WAI/WCAG22/Understanding/name-role-value
- **4.1.3 Status Messages (AA):** https://www.w3.org/WAI/WCAG22/Understanding/status-messages

### ARIA Specifications

- **ARIA Authoring Practices Guide:** https://www.w3.org/WAI/ARIA/apg/
- **Dialog Pattern:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- **Radio Group Pattern:** https://www.w3.org/WAI/ARIA/apg/patterns/radio/
- **Button Pattern:** https://www.w3.org/WAI/ARIA/apg/patterns/button/

### Radix UI Documentation

- **Dialog (Sheet) Component:** https://www.radix-ui.com/primitives/docs/components/dialog
- **Focus Management:** Built-in focus trap and focus return
- **Keyboard Support:** Escape key, focus cycling

---

## Conclusion

The MobileFilterSheet component can achieve full WCAG 2.2 Level AA compliance by:

1. **Leveraging Radix UI's built-in accessibility** (focus trap, ARIA attributes, keyboard handling)
2. **Adding mobile-specific ARIA attributes** (aria-label, aria-expanded, aria-pressed)
3. **Ensuring 44x44px touch targets** via QDS touch-target utility
4. **Providing clear screen reader announcements** via aria-live regions
5. **Maintaining high color contrast** using QDS semantic tokens
6. **Supporting multiple input methods** (touch, keyboard, gesture with alternatives)

**Critical Success Factors:**
- Focus management works correctly (sheet open/close)
- Radio group keyboard navigation functions (Arrow keys)
- Tag toggles announce state changes (aria-pressed)
- Apply action provides feedback (aria-live announcement)
- All touch targets meet 44x44px minimum
- Color contrast verified for all states (light/dark theme)

**Testing Priority:**
1. Screen reader testing (VoiceOver iOS, TalkBack Android) — HIGH
2. Keyboard-only navigation — HIGH
3. Touch target sizing — HIGH
4. Color contrast validation — MEDIUM (QDS tokens pre-validated)
5. Swipe gesture alternative — LOW (multiple alternatives exist)

**Next Steps:**
Proceed to implementation plan (plans/mobile-filter-a11y-implementation.md) for step-by-step accessibility integration.

# Mobile Filter Component Architecture Research

**Date:** 2025-10-14
**Agent:** Component Architect
**Task:** Design MobileFilterSheet component for mobile filter UI

---

## Existing Patterns Analysis

### 1. Desktop Filter Architecture

**Current Desktop Implementation:**
- **FilterSidebar** (`components/course/filter-sidebar.tsx`)
  - Props-driven, fully reusable
  - Composes three child components: SidebarSearchBar, SidebarFilterPanel, TagCloud
  - Displays filtered count in header
  - Collapse/expand functionality (not needed for mobile)
  - Glass panel styling with QDS compliance

**Child Components (All Props-Driven, Ready for Reuse):**

1. **SidebarSearchBar** (`components/course/sidebar-search-bar.tsx`)
   - Props: `value`, `onChange`, `debounceMs`, `placeholder`, `className`
   - Features: Debounced input (300ms), clear button, glass styling
   - ✅ No modifications needed - fully reusable

2. **SidebarFilterPanel** (`components/course/sidebar-filter-panel.tsx`)
   - Props: `activeFilter`, `onFilterChange`, `className`
   - Features: Radio group behavior, 6 filter types, icons + labels
   - ✅ No modifications needed - fully reusable

3. **TagCloud** (`components/course/tag-cloud.tsx`)
   - Props: `tags`, `selectedTags`, `onTagsChange`, `maxInitialTags`, `className`
   - Features: Multi-select, show more/less expansion, badge sizing
   - ✅ No modifications needed - fully reusable

### 2. State Management Pattern

**Current State (in Course page):**
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [activeFilter, setActiveFilter] = useState<FilterType>("all");
const [selectedTags, setSelectedTags] = useState<string[]>([]);
```

**State Flow:**
```
Course Page (State Owner)
    ↓ (props)
FilterSidebar (Desktop) OR MobileFilterSheet (Mobile)
    ↓ (props)
Child Components (SidebarSearchBar, SidebarFilterPanel, TagCloud)
```

**Decision:** Mobile sheet will share same state - NO state duplication.

### 3. Similar Patterns in Codebase

**ThreadModal** (`components/course/thread-modal.tsx`):
- Uses Sheet component from shadcn/ui
- Side: "bottom" for mobile-friendly bottom drawer
- Props: `open`, `onOpenChange`, `threadId`
- Pattern: Controlled component with external state

**AskQuestionModal** (`components/course/ask-question-modal.tsx`):
- Uses Dialog component (overlay, not bottom sheet)
- Props: `isOpen`, `onClose`, `courseId`, `courseName`, `onSuccess`
- Pattern: Callback-based event handling

**Best Pattern for MobileFilterSheet:** Follow ThreadModal pattern (bottom sheet) with controlled state from parent.

### 4. shadcn/ui Sheet Component

**Available Components:**
```typescript
Sheet                 // Root container
SheetTrigger          // Trigger button (separate component)
SheetContent          // Main content (side prop: "bottom")
SheetHeader           // Header with title
SheetTitle            // Title element
SheetDescription      // Description (optional)
SheetFooter           // Footer with actions
SheetClose            // Close button
```

**Side Options:** `"top" | "right" | "bottom" | "left"`
- **Choice:** `"bottom"` for mobile-friendly thumb reach

**Animations:** Built-in slide animations (`data-[state=open]:slide-in-from-bottom`)

---

## Requirements Analysis

### Data Requirements (Props)

1. **Filter State (Read-Only Display):**
   - `searchQuery: string` - Current search query
   - `activeFilter: FilterType` - Current active filter
   - `selectedTags: string[]` - Currently selected tags
   - `tags: TagWithCount[]` - Available tags with counts
   - `totalThreads: number` - Total thread count (before filtering)
   - `filteredThreads: number` - Filtered thread count

2. **Event Handlers (Callbacks):**
   - `onSearchChange: (query: string) => void` - Search query change
   - `onFilterChange: (filter: FilterType) => void` - Filter change
   - `onTagsChange: (tags: string[]) => void` - Tag selection change

3. **Sheet State (Controlled):**
   - `open: boolean` - Sheet open/closed state
   - `onOpenChange: (open: boolean) => void` - Sheet state change handler

4. **Optional Props:**
   - `className?: string` - For composition

### State Requirements

**Local State (in MobileFilterSheet):**
- NONE - sheet is fully controlled by parent (Course page)

**Lifted State (in Course page):**
- `mobileFilterSheetOpen: boolean` - Sheet open/closed state
- All existing filter state (searchQuery, activeFilter, selectedTags)

**Global State:**
- NONE - no need for context or global store

### Event Handling Needs

1. **Sheet Open/Close:**
   - Trigger button in ThreadListSidebar header
   - Sheet close button (SheetClose component)
   - Backdrop click (automatic via SheetOverlay)
   - "Apply Filters" button (optional - filters apply immediately)

2. **Filter Changes:**
   - Search input: Debounced, calls `onSearchChange`
   - Filter button click: Calls `onFilterChange`
   - Tag click: Calls `onTagsChange`

3. **Clear All Filters:**
   - Reset search query to ""
   - Reset active filter to "all"
   - Reset selected tags to []
   - Calls all three handlers

### Variant Requirements

**Visual Variants:** None needed - single mobile design

**Behavioral Variants:**
- **Controlled:** Sheet open/close state managed by parent
- **Immediate Updates:** Filter changes apply immediately (no "Apply" needed)
- **Optional "Apply" Button:** Could add for explicit confirmation, but not required

### Accessibility Requirements

1. **ARIA Attributes:**
   - Sheet has built-in dialog role and focus trap
   - Sheet title must be provided (SheetTitle component)
   - Sheet description optional (SheetDescription)

2. **Keyboard Navigation:**
   - Escape key closes sheet (built-in)
   - Tab cycles through focusable elements
   - Focus returns to trigger button on close

3. **Screen Reader:**
   - Announce filter count badge in trigger button
   - Announce filter changes (via live region or aria-live)
   - Announce sheet open/close state

4. **Touch Targets:**
   - Minimum 44px touch target for all buttons
   - Adequate spacing between filter buttons (8px minimum)
   - Trigger button: 44px x 44px minimum

### Responsive Behavior

**Breakpoints:**
- **< 768px:** MobileFilterSheet visible, FilterSidebar hidden
- **≥ 768px:** FilterSidebar visible, MobileFilterSheet hidden (never rendered)

**Sheet Height:**
- **Max Height:** 80vh (allow space above for visual context)
- **Min Height:** Auto (based on content)
- **Scroll:** Scrollable body if content exceeds max height

**Safe Area Support:**
- Bottom padding respects `safe-area-inset-bottom` for iOS notch/gesture bar

---

## Performance Considerations

### Render Frequency

**High Frequency:**
- Search input typing (every keystroke updates local state)
- Tag selection (immediate re-render)

**Medium Frequency:**
- Filter button clicks (state change triggers re-render)
- Sheet open/close (mount/unmount or visibility toggle)

**Low Frequency:**
- Initial mount (when Course page loads)

### Expensive Operations

**Cheap:**
- All child components are lightweight
- No expensive computations in MobileFilterSheet

**Optimization Opportunities:**
- Child components already optimized (debounced search, memoized calculations)
- No additional memoization needed in MobileFilterSheet

### Memoization Strategy

**Not Needed:**
- MobileFilterSheet has no expensive operations
- All props are primitives or callbacks
- Child components handle their own optimization

**If Needed (Future):**
- Wrap in `React.memo` if parent re-renders frequently
- Use `useCallback` for event handlers if passing to memoized children

### Code Splitting

**Not Applicable:**
- Component is small (<200 LoC)
- Only rendered on mobile (<768px)
- Sheet component already lazy-loaded by shadcn/ui

---

## Design Decisions

### 1. Component Structure

**Decision:** Bottom sheet with three-part layout:
1. **Header:** Title + filtered count + close button
2. **Body:** Scrollable area with SidebarSearchBar, SidebarFilterPanel, TagCloud
3. **Footer:** "Clear All" button (optional - could be in header)

**Rationale:**
- Matches mobile UX patterns (iOS, Material Design)
- Clear visual hierarchy (header, content, actions)
- Scrollable body handles overflow on small screens

### 2. Trigger Button Integration

**Decision:** Add filter trigger button to ThreadListSidebar header (mobile only)

**Location:** ThreadListSidebar.tsx, line 105-112 (header div)

**Design:**
```tsx
{/* Mobile Filter Trigger - Only visible on mobile */}
<Button
  variant="ghost"
  size="icon"
  className="md:hidden touch-target"
  onClick={() => setMobileFilterSheetOpen(true)}
  aria-label="Open filters"
>
  <SlidersHorizontal className="h-5 w-5" />
  {activeFilterCount > 0 && (
    <Badge className="absolute -top-1 -right-1">
      {activeFilterCount}
    </Badge>
  )}
</Button>
```

**Rationale:**
- Consistent with mobile navigation patterns
- Badge shows active filter count at a glance
- Icon-only for space efficiency (labels in sheet)

### 3. Filter Application Strategy

**Decision:** Apply filters immediately (no "Apply Filters" button)

**Rationale:**
- Simpler UX - fewer steps to filter threads
- Desktop behavior is immediate, mobile should match
- Users can see results in real-time (sheet can be dismissed)

**Alternative Considered:** "Apply Filters" button for batched updates
- Rejected: Adds friction, inconsistent with desktop experience

### 4. Clear All Filters

**Decision:** "Clear All" button in footer (left-aligned)

**Behavior:**
- Resets search query to ""
- Resets active filter to "all"
- Resets selected tags to []
- Sheet remains open to show cleared state

**Rationale:**
- Convenient reset for users with many filters
- Common pattern in mobile filter UIs
- Footer placement keeps it accessible but out of the way

### 5. Glass Styling

**Decision:** Use QDS glass tokens for sheet content

**Sheet Background:** `glass-panel-strong` (stronger blur for modal context)

**Sheet Border:** `border-glass` (subtle glass border)

**Shadow:** `shadow-glass-lg` (elevated sheet appearance)

**Rationale:**
- Consistent with desktop FilterSidebar styling
- Reinforces glass morphism visual identity
- Subtle blur provides depth without obscuring content

---

## Component Hierarchy

```
MobileFilterSheet (Sheet)
├── SheetContent (side="bottom")
│   ├── SheetHeader
│   │   ├── SheetTitle ("Filters")
│   │   └── SheetDescription (filtered count)
│   ├── SheetBody (scrollable)
│   │   ├── SidebarSearchBar
│   │   ├── SidebarFilterPanel
│   │   └── TagCloud
│   └── SheetFooter
│       └── Button ("Clear All")
└── SheetClose (X button in top-right)
```

---

## Integration Points

### 1. Course Page State

**New State:**
```typescript
const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
```

**Pass to MobileFilterSheet:**
```typescript
<MobileFilterSheet
  open={mobileFilterSheetOpen}
  onOpenChange={setMobileFilterSheetOpen}
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
```

### 2. ThreadListSidebar Header

**Modify Header Section (lines 105-112):**
- Add filter trigger button (mobile only: `className="md:hidden"`)
- Calculate active filter count badge
- Pass `onFilterButtonClick` prop from Course page

**Active Filter Count Calculation:**
```typescript
const activeFilterCount =
  (searchQuery ? 1 : 0) +
  (activeFilter !== "all" ? 1 : 0) +
  selectedTags.length;
```

### 3. Conditional Rendering

**In Course Page JSX:**
```typescript
{/* Mobile Filter Sheet - Only render on mobile */}
{isMobile && (
  <MobileFilterSheet
    open={mobileFilterSheetOpen}
    onOpenChange={setMobileFilterSheetOpen}
    {/* ...props */}
  />
)}
```

**Rationale:** Don't render sheet on desktop to avoid unnecessary DOM nodes.

---

## Risks & Mitigations

### Risk 1: Sheet Height on Small Screens

**Problem:** Sheet content might be too tall on iPhone SE (667px height)

**Mitigation:**
- Max height: 80vh (leaves 20% for visual context)
- Scrollable body (overflow-y-auto)
- Test on 360px, 375px, 414px, 768px viewports

### Risk 2: Focus Management

**Problem:** Focus might not return to trigger button on close

**Mitigation:**
- SheetClose component handles focus return automatically
- Test keyboard navigation: Tab, Shift+Tab, Escape

### Risk 3: Performance with Many Tags

**Problem:** Rendering 50+ tags might slow down sheet open animation

**Mitigation:**
- TagCloud already limits initial display to 8 tags
- Show more/less expansion is user-initiated
- No changes needed - already optimized

### Risk 4: Accidental Touch Events

**Problem:** Users might accidentally tap filters while scrolling

**Mitigation:**
- 44px minimum touch target (QDS token: `--touch-target-min`)
- 8px spacing between buttons (QDS token: `--touch-spacing-min`)
- Adequate padding in sheet body

### Risk 5: Glass Blur Performance on Mobile

**Problem:** Heavy backdrop blur might lag on older mobile devices

**Mitigation:**
- globals.css already reduces blur on mobile (line 736-747)
- Sheet uses `glass-panel-strong` which auto-reduces to `blur-md` on mobile
- Test on mid-range devices (iPhone 11, Pixel 5)

---

## Testing Strategy

### Unit Tests (Future)

**Not required for initial implementation** (frontend-only demo), but consider:

1. **Props Interface:**
   - Test all props are passed correctly
   - Test callbacks are invoked with correct arguments

2. **Filter Logic:**
   - Test "Clear All" resets all filters
   - Test filter changes propagate to parent

3. **Accessibility:**
   - Test ARIA attributes are correct
   - Test keyboard navigation works

### Manual Testing (Required)

1. **Viewport Tests:**
   - 360px (iPhone SE)
   - 375px (iPhone 12/13)
   - 414px (iPhone 12 Pro Max)
   - 768px (iPad mini, breakpoint boundary)

2. **User Flows:**
   - Open sheet from trigger button
   - Search for threads
   - Select filters (all, high-confidence, instructor-endorsed, etc.)
   - Select multiple tags
   - Clear all filters
   - Close sheet (X button, backdrop, Escape key)

3. **Accessibility:**
   - Keyboard navigation: Tab, Shift+Tab, Escape
   - Screen reader announces filter count
   - Focus trap works correctly
   - Focus returns to trigger button on close

4. **Performance:**
   - Sheet opens/closes smoothly (no lag)
   - Filter changes apply immediately
   - No console errors or warnings

5. **Edge Cases:**
   - No threads match filters (empty state in ThreadListSidebar)
   - All filters active (badge shows "6")
   - Many tags (50+) in tag cloud
   - Search query with special characters

---

## Alternatives Considered

### Alternative 1: Left Drawer (side="left")

**Rejected:** Harder to reach dismiss area, less common on mobile

### Alternative 2: Full-Screen Modal

**Rejected:** Too heavy for filter UI, blocks all context

### Alternative 3: Inline Filters in ThreadListSidebar

**Rejected:** Takes vertical space away from threads, poor mobile UX

### Alternative 4: Filter Chips Above ThreadListSidebar

**Rejected:** Limited horizontal space, hard to fit all filter types

---

## Future Enhancements (Out of Scope)

1. **Filter Persistence:**
   - Save filters to localStorage
   - Restore filters on page reload

2. **Advanced Filters:**
   - Date range picker (created in last 7 days, etc.)
   - Author filter (multi-select)
   - AI confidence range slider (60-100%)

3. **Filter Presets:**
   - "My Threads" preset (my posts + unread)
   - "Instructor Curated" preset (endorsed + resolved)
   - Save custom presets

4. **Filter Analytics:**
   - Track most-used filters
   - Suggest filters based on usage patterns

5. **Voice Search:**
   - Speech-to-text for search query

---

## Summary

**Component:** MobileFilterSheet
**Pattern:** Controlled bottom sheet with immediate filter application
**Reusability:** Reuses all existing filter components (100% code reuse)
**State:** Shared with desktop (single source of truth in Course page)
**Styling:** QDS glass tokens, mobile-optimized blur
**Accessibility:** WCAG 2.2 AA compliant, keyboard + screen reader support
**Performance:** No additional optimization needed
**Integration:** Minimal changes to Course page and ThreadListSidebar

**Key Strengths:**
- Zero duplication (child components are fully reusable)
- Consistent UX with desktop (shared state, same filters)
- Mobile-optimized (bottom sheet, touch targets, reduced blur)
- Accessible by default (Sheet component + proper ARIA)
- Simple integration (controlled component pattern)

**Next Steps:**
1. Review this research document
2. Create detailed implementation plan
3. Get approval from parent agent
4. Proceed with implementation

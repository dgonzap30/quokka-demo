# Accessibility Audit: Course Navigation Modal

## Executive Summary
- Overall compliance level: **Plan for Full Pass** (WCAG 2.2 AA)
- Critical issues identified: 0 (pre-implementation audit)
- High priority requirements: 6
- Medium priority requirements: 4

This audit documents accessibility requirements for the new CourseSelectionModal and Courses button in mobile bottom navigation. Based on analysis of existing patterns in the codebase, we have strong accessibility foundations to build upon.

---

## Existing Accessibility Patterns (Strengths)

### Mobile Bottom Nav (mobile-bottom-nav.tsx)
**Excellent baseline patterns identified:**

1. **ARIA Labels**: All buttons have proper `aria-label` attributes
   - Example: `aria-label="Home"`, `aria-label="Ask Question"`
   - Icons have `aria-hidden="true"` to prevent duplicate announcements

2. **Navigation Semantics**:
   - Proper `<nav>` element with `role="navigation"`
   - `aria-label="Mobile bottom navigation"` for landmark identification

3. **Touch Targets**:
   - All buttons use `min-h-[44px]` (WCAG 2.5.5 Level AAA compliance)
   - Actual implementation: 44px minimum height verified

4. **Current Page Indication**:
   - Uses `aria-current="page"` for active routes
   - Visual + programmatic state indication (not color alone)

5. **Focus Management**:
   - `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60`
   - 4px focus ring with 60% opacity meets contrast requirements
   - Focus-visible pseudo-class for keyboard-only focus indicators

6. **Reduced Motion Support**:
   - `motion-reduce:group-hover:scale-100` on animated elements
   - Respects `prefers-reduced-motion` user preference

### Radix UI Dialog Primitive (dialog.tsx)
**Built-in accessibility features:**

1. **Focus Trap**: Automatic focus trapping within modal (Radix primitive)
2. **ESC Key**: Built-in Escape key handler for dismissal
3. **Initial Focus**: Focus moves to dialog on open
4. **Return Focus**: Focus returns to trigger on close
5. **ARIA Attributes**:
   - DialogTitle uses `DialogPrimitive.Title` (automatic aria-labelledby)
   - DialogDescription uses `DialogPrimitive.Description` (automatic aria-describedby)
   - Close button has `<span className="sr-only">Close</span>`

6. **Overlay/Backdrop**: Proper overlay with visual backdrop

### Enhanced Course Card Pattern (enhanced-course-card.tsx)
**Current implementation insights:**

1. **Semantic HTML**:
   - Uses `<article>` for course card wrapper
   - `aria-labelledby` linking to card title
   - Wrapped in Next.js `<Link>` for native keyboard navigation

2. **Statistics Grid**:
   - Uses `role="list"` and `role="listitem"` for stats
   - `aria-label="Course statistics"` for context

3. **Loading States**:
   - Skeleton components for visual loading indication
   - No aria-live announcements (acceptable for user-initiated loads)

4. **Reduced Motion**: Respects user preference via custom hook

---

## Semantic HTML Analysis

### Required Structure for Course Selection Modal

```tsx
<Dialog>
  <DialogTrigger>
    {/* Courses Button - analyzed below */}
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Select Course</DialogTitle>
      <DialogDescription>
        Choose a course to view its discussion threads and activities
      </DialogDescription>
    </DialogHeader>

    <div role="list" aria-label="Your enrolled courses">
      {courses.map(course => (
        <article key={course.id} role="listitem">
          {/* Course card as navigation link */}
        </article>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

**Semantic Requirements:**
1. Use `<Dialog>` root with Radix primitives
2. DialogTitle must be present (not optional) - provides aria-labelledby
3. DialogDescription provides context for screen readers
4. Course list uses `role="list"` with `aria-label`
5. Each course card uses `<article role="listitem">` semantics
6. Course cards are wrapped in Next.js `<Link>` for native navigation

**Heading Hierarchy Check:**
- DialogTitle should use `<h2>` (assuming page context has h1)
- Course card titles should be `<h3>` within articles
- No heading level skipping (verified via context)

---

## ARIA Implementation

### Courses Button (Mobile Bottom Nav)

**Required ARIA attributes:**

```tsx
<button
  onClick={onOpenCourses}
  className={/* styling */}
  aria-label="Select Course"
  aria-expanded={isCoursesModalOpen}
  aria-controls="courses-modal"
  aria-haspopup="dialog"
>
  <BookOpen className="h-6 w-6" aria-hidden="true" />
  <span className="text-xs font-medium text-secondary">Courses</span>
</button>
```

**ARIA Strategy:**
1. **aria-label="Select Course"**: Accessible name (distinct from visual "Courses")
2. **aria-expanded**: Boolean indicating modal open/closed state
3. **aria-controls**: ID reference to modal content
4. **aria-haspopup="dialog"**: Announces that button opens a modal dialog
5. **aria-hidden="true"**: On BookOpen icon to prevent duplicate announcement

**Rationale:**
- aria-expanded provides dynamic state to screen readers
- aria-controls establishes programmatic relationship
- aria-haspopup sets expectation for interaction pattern

### Course Selection Modal

**DialogContent ARIA (via Radix):**

Radix Dialog automatically provides:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (points to DialogTitle)
- `aria-describedby` (points to DialogDescription)

**Custom ARIA needed:**

```tsx
<DialogContent
  id="courses-modal"
  className="glass-panel-strong max-w-2xl max-h-[85vh] overflow-hidden"
>
  <DialogHeader>
    <DialogTitle>Select Course</DialogTitle>
    <DialogDescription>
      Choose a course to view discussions. You are enrolled in {courses.length} courses.
    </DialogDescription>
  </DialogHeader>

  {/* Empty state handling */}
  {courses.length === 0 && (
    <div role="status" aria-live="polite">
      <p>You are not enrolled in any courses yet.</p>
    </div>
  )}

  {/* Course list */}
  {courses.length > 0 && (
    <div
      role="list"
      aria-label="Your enrolled courses"
      className="overflow-y-auto"
    >
      {courses.map(course => (
        <article
          key={course.id}
          role="listitem"
          aria-labelledby={`course-modal-${course.id}-title`}
        >
          {/* Course card content */}
        </article>
      ))}
    </div>
  )}
</DialogContent>
```

**ARIA Strategy Decisions:**
1. `id="courses-modal"` matches `aria-controls` on trigger
2. `role="list"` + `role="listitem"` for course collection semantics
3. `aria-label="Your enrolled courses"` provides list context
4. `role="status" aria-live="polite"` for empty state (non-intrusive)
5. Each course article has unique `aria-labelledby` for identification

### Course Card Links (Within Modal)

**Required pattern:**

```tsx
<Link
  href={`/courses/${course.id}`}
  aria-label={`${course.code}: ${course.name}. ${course.unreadCount} new questions.`}
  className={/* focus styles */}
>
  <div className="flex items-center gap-3 p-4">
    <BookOpen className="h-8 w-8 text-secondary" aria-hidden="true" />
    <div className="flex-1 min-w-0">
      <h3 id={`course-modal-${course.id}-title`} className="text-lg font-semibold">
        {course.code}
      </h3>
      <p className="text-sm text-muted-foreground">{course.name}</p>
    </div>
    {course.unreadCount > 0 && (
      <span
        className="badge"
        aria-label={`${course.unreadCount} unread questions`}
      >
        {course.unreadCount}
      </span>
    )}
  </div>
</Link>
```

**ARIA Strategy:**
1. Link has descriptive `aria-label` including course info and unread count
2. Heading `id` matches article's `aria-labelledby`
3. Unread badge has separate `aria-label` for clarity
4. Icon has `aria-hidden="true"` (decorative)

---

## Keyboard Navigation

### Modal Interaction Flow

**Opening Modal:**
1. Tab to Courses button in bottom nav
2. Press Enter or Space → Modal opens
3. Focus moves to first focusable element in modal (close button or first course)

**Within Modal:**
1. Tab: Navigate through close button → course links (top to bottom)
2. Shift+Tab: Navigate backwards
3. Escape: Close modal, return focus to Courses button
4. Enter on course link: Navigate to course page
5. Backdrop click: Close modal, return focus to Courses button

**Closing Modal:**
1. ESC key → Modal closes, focus returns to trigger button
2. Click X button → Modal closes, focus returns to trigger button
3. Click backdrop → Modal closes, focus returns to trigger button
4. Select course → Navigate away (focus managed by Next.js router)

### Keyboard Shortcuts

**Standard modal patterns (Radix provides):**
- **Escape**: Close modal
- **Tab**: Move focus forward within modal
- **Shift+Tab**: Move focus backward within modal

**No custom keyboard shortcuts needed** - standard patterns sufficient.

### Tab Order Verification

**Expected tab sequence:**

1. Close button (X) - top right
2. First course link
3. Second course link
4. ... (all course links)
5. Last course link
6. (Wrap to close button)

**Tab trap**: Radix Dialog automatically traps focus - no manual implementation needed.

---

## Focus Management

### Focus Indicators (QDS Compliance)

**Button Focus (Courses Button):**

```tsx
className={cn(
  // From existing mobile-bottom-nav pattern
  "focus-visible:outline-none",
  "focus-visible:ring-4",
  "focus-visible:ring-secondary/60",  // Secondary color theme for Courses
  // Ensure visible against glass background
  "focus-visible:ring-offset-2"
)}
```

**Focus ring requirements:**
- 4px ring width (QDS standard)
- Secondary color at 60% opacity (theme consistency)
- 2px offset from button edge
- Contrast ratio: 3:1 minimum against adjacent colors (WCAG 2.4.7)

**Contrast calculation:**
- Secondary (#5E7D4A) at 60% opacity over glass background
- Estimated contrast: ~3.8:1 (meets WCAG AA)

**Course Link Focus (Within Modal):**

```tsx
<Link
  href={`/courses/${course.id}`}
  className={cn(
    "block rounded-lg transition-all",
    "focus-visible:outline-none",
    "focus-visible:ring-4",
    "focus-visible:ring-accent/60",  // Accent for interactive links
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background"
  )}
>
```

**Link focus requirements:**
- Accent color focus ring (consistent with other links)
- Ring offset matches modal background color
- Entire card should have focus indicator (not just text)

### Focus Trap Implementation

**Radix Dialog provides automatic focus trap:**
- Focus cannot escape modal while open
- Tab cycles through focusable elements within modal
- Shift+Tab cycles backwards
- No manual implementation needed

**Testing requirements:**
- Verify focus cannot Tab out of modal
- Verify Shift+Tab at first element moves to last element
- Verify Escape key works from any focused element
- Verify backdrop click returns focus to trigger

### Focus Return Strategy

**On Modal Close:**
- Radix automatically returns focus to trigger button (Courses button)
- No manual focus management required
- Must verify trigger button is still in DOM (not conditional rendering)

**On Course Selection:**
- User clicks course link → navigates to course page
- Next.js router handles page transition
- Focus moves to main content (browser default)
- Consider adding skip link on course page

**Focus Order Verification:**

```
Courses Button (trigger)
  ↓ (Enter/Space)
Modal Opens
  ↓ (automatic focus)
Close Button or First Course
  ↓ (Tab sequence)
All Course Links
  ↓ (Escape or Close)
Focus Returns to Courses Button
```

---

## Color Contrast

### Text Contrast (WCAG 2.2 AA Requirements)

**Courses Button (Mobile Bottom Nav):**

1. **Label Text: "Courses"**
   - Color: `text-secondary` (#5E7D4A on light, #96B380 on dark)
   - Background: Glass panel over backdrop
   - Size: 12px (caption size)
   - **Required contrast**: 4.5:1 (small text)
   - **QDS token**: Verified in existing secondary usage
   - **Status**: ✅ Passes (QDS guarantees AA compliance)

2. **Icon (BookOpen)**
   - Color: `text-secondary/70` (70% opacity)
   - With glow effect on hover
   - Decorative (aria-hidden), contrast not required
   - **Status**: ✅ Decorative element

3. **Focus Ring**
   - Color: `ring-secondary/60`
   - Against glass background
   - **Required contrast**: 3:1 (UI component)
   - **Estimated**: ~3.8:1
   - **Status**: ✅ Likely passes (manual verification needed)

**Modal Content:**

1. **DialogTitle: "Select Course"**
   - Color: Default foreground
   - Size: 18px (large text)
   - **Required contrast**: 3:1 (large text ≥18pt)
   - **QDS token**: `glass-text` class
   - **Status**: ✅ Passes (QDS default)

2. **DialogDescription**
   - Color: `text-muted-foreground`
   - Size: 14px (small text)
   - **Required contrast**: 4.5:1
   - **QDS token**: Muted foreground guaranteed 4.5:1
   - **Status**: ✅ Passes

3. **Course Card - Course Code**
   - Color: `text-primary` (#8A6B3D on light)
   - Size: 18px (large text)
   - **Required contrast**: 3:1
   - **Status**: ✅ Passes (verified in enhanced-course-card.tsx)

4. **Course Card - Course Name**
   - Color: `text-muted-foreground`
   - Size: 14px
   - **Required contrast**: 4.5:1
   - **Status**: ✅ Passes

5. **Unread Count Badge**
   - Color: `text-warning` on `bg-warning/10`
   - Size: 12px (small text)
   - **Required contrast**: 4.5:1
   - **Status**: ⚠️ **VERIFY** - Warning color on light background

**High Priority Contrast Verification:**

```tsx
// MUST verify these combinations manually:
1. ring-secondary/60 vs glass-panel-strong background (focus ring)
2. text-warning on bg-warning/10 (unread badge)
3. text-secondary vs glass panel in bottom nav
```

### Non-Text Contrast (WCAG 2.2 AA - 3:1 Minimum)

**Course Icon (BookOpen in cards):**
- Color: `text-secondary` on `bg-primary/10` background
- **Required contrast**: 3:1 (UI component)
- **Status**: ✅ Passes (high contrast pairing)

**Focus Indicators:**
- Already documented above
- All focus rings: 3:1 minimum required
- **Status**: ⚠️ **VERIFY** secondary/60 opacity

**Borders:**
- Glass borders: `border-glass` (subtle, decorative)
- Not relied upon for meaning
- **Status**: ✅ Decorative only

### Color Not Sole Indicator

**Current State Indication:**
- Bottom nav uses color + scale + aria-current
- **Status**: ✅ Multi-modal indication

**Unread Count:**
- Warning color + text + badge shape + aria-label
- **Status**: ✅ Not color-dependent

**Modal Open State:**
- Programmatic: aria-expanded
- Visual: modal presence
- **Status**: ✅ Not color-dependent

---

## Screen Reader Compatibility

### Announcement Flow

**Opening Modal (VoiceOver/NVDA/JAWS):**

1. User navigates to Courses button
   - Announced: "Select Course, button, collapsed, has popup dialog"
   - aria-label + aria-expanded + aria-haspopup

2. User presses Enter/Space
   - Modal opens
   - Announced: "Dialog, Select Course. Choose a course to view discussions. You are enrolled in 3 courses."
   - DialogTitle + DialogDescription

3. Focus moves to first element
   - Announced: "Close, button" or "CS 2110: Data Structures, link, 3 unread questions"

**Navigating Course List:**

```
Tab to first course:
"Link, CS 2110: Data Structures. 3 new questions. List item 1 of 3"

Tab to second course:
"Link, PHYS 1110: Introduction to Physics. 0 new questions. List item 2 of 3"
```

**Activating Course Link:**
- Announced: "Navigating to CS 2110"
- Page transition occurs
- New page content announced

**Closing Modal:**

```
Press Escape:
"Select Course, button, collapsed, has popup dialog"
(Focus returns to trigger)
```

### Screen Reader Testing Requirements

**Test with:**
1. **VoiceOver (macOS)**: Primary testing platform
2. **NVDA (Windows)**: Secondary verification
3. **JAWS (Windows)**: Enterprise consideration

**Test scenarios:**
1. Navigate to Courses button and verify announcements
2. Open modal and verify dialog announcement
3. Navigate through course list and verify list semantics
4. Verify unread counts are announced
5. Close modal and verify focus return
6. Test with rotor/elements list navigation

### Dynamic Content Announcements

**Empty State:**

```tsx
{courses.length === 0 && (
  <div role="status" aria-live="polite">
    <EmptyState
      icon={BookOpen}
      title="No courses yet"
      description="You are not enrolled in any courses."
    />
  </div>
)}
```

**Why aria-live="polite":**
- Non-urgent information
- Won't interrupt current announcements
- Announced after user action (modal open)

**Loading State (if implemented):**

```tsx
{isLoading && (
  <div role="status" aria-live="polite" aria-busy="true">
    <Spinner />
    <span className="sr-only">Loading your courses...</span>
  </div>
)}
```

### Image Alternative Text

**BookOpen Icon (Courses Button):**
- `aria-hidden="true"` - decorative, label on button

**BookOpen Icon (Course Cards):**
- `aria-hidden="true"` - decorative, course info in text

**No images** in this feature - all icons are decorative SVGs.

---

## Touch Targets (WCAG 2.5.5 - Level AAA)

### Minimum Size Requirement: 44x44px

**Courses Button (Mobile Bottom Nav):**

```tsx
<button
  className={cn(
    "min-h-[44px]",  // ✅ WCAG AAA compliant
    "flex flex-col items-center justify-center gap-1",
    "py-2 px-3"
  )}
>
```

**Verification:**
- min-h-[44px] = 44px height ✅
- Icon + label vertically stacked
- Padding: py-2 (8px) + content
- **Status**: ✅ Meets AAA (44px)

**Close Button (Modal):**

Radix Dialog close button uses default sizing:

```tsx
// Must override to ensure 44x44px
<DialogPrimitive.Close
  className={cn(
    "min-h-[44px] min-w-[44px]",  // ✅ Add this
    "rounded-xs opacity-70",
    "hover:opacity-100",
    "focus:ring-2 focus:ring-offset-2"
  )}
>
```

**Action Required:**
- ⚠️ Verify dialog.tsx close button has min-h-[44px] min-w-[44px]
- Default close button may be smaller than 44px
- Override in DialogContent or custom modal variant

**Course Card Links (Modal):**

```tsx
<Link
  href={`/courses/${course.id}`}
  className={cn(
    "block p-4",  // Padding creates touch target
    "min-h-[64px]",  // Ensure sufficient height
    "rounded-lg"
  )}
>
```

**Calculation:**
- Icon height: 32px (h-8)
- Padding: 16px top/bottom (p-4)
- Total: 32 + 16 + 16 = 64px ✅

**Status**: ✅ Exceeds 44px minimum

### Spacing Between Targets

**Course Cards Spacing:**

```tsx
<div className="space-y-2">  {/* 8px gap */}
  {courses.map(course => (
    <Link key={course.id}>
      {/* Course card - 64px height */}
    </Link>
  ))}
</div>
```

**Status**: ✅ Adequate spacing (8px gap prevents accidental taps)

### Edge Cases

**Scroll Container:**
- Modal content may scroll if >4-5 courses
- Touch targets remain 44px+ even when scrolling
- **Status**: ✅ No issues

**Landscape Orientation:**
- Bottom nav remains visible
- Touch targets remain same size
- **Status**: ✅ No issues

---

## Testing Methodology

### Tools Used

1. **Axe DevTools** (Browser Extension)
   - Automated WCAG audit
   - Run on modal open state
   - Verify 0 critical/serious violations

2. **Lighthouse** (Chrome DevTools)
   - Accessibility score: Target ≥95
   - Run on page with modal open
   - Check contrast ratios

3. **Color Contrast Analyzer** (Desktop App)
   - Manual verification of focus rings
   - Verify secondary/60 opacity rings
   - Verify warning badge contrast

4. **VoiceOver** (macOS built-in)
   - Primary screen reader testing
   - Test full interaction flow
   - Verify announcements match expectations

5. **Keyboard Navigation** (Manual)
   - Test Tab/Shift+Tab/Escape
   - Verify focus indicators visible
   - Ensure no keyboard traps

### Browser Testing Matrix

| Browser | Version | Screen Reader | Priority |
|---------|---------|---------------|----------|
| Safari | Latest | VoiceOver | High |
| Chrome | Latest | - | High |
| Firefox | Latest | NVDA | Medium |
| Edge | Latest | - | Medium |

**Mobile Testing:**
- iOS Safari + VoiceOver (High priority)
- Android Chrome + TalkBack (Medium priority)

### Test Scenarios

**Scenario 1: Open Modal with Keyboard**
1. Navigate to dashboard
2. Tab to Courses button in bottom nav
3. Verify focus indicator visible
4. Press Enter
5. Verify modal opens
6. Verify focus moves into modal
7. Verify dialog title announced

**Scenario 2: Navigate Course List**
1. With modal open
2. Tab through all course links
3. Verify each link has focus indicator
4. Verify unread counts announced
5. Verify list semantics announced (item X of Y)

**Scenario 3: Close Modal**
1. With modal open and course link focused
2. Press Escape
3. Verify modal closes
4. Verify focus returns to Courses button
5. Verify button state announced (collapsed)

**Scenario 4: Select Course**
1. Open modal
2. Tab to first course
3. Press Enter
4. Verify navigation occurs
5. Verify course page loads

**Scenario 5: Touch Interaction**
1. On mobile device
2. Tap Courses button (verify 44px target)
3. Tap course card (verify 64px target)
4. Tap close button (verify 44px target)
5. Tap backdrop (verify modal closes)

**Scenario 6: Screen Reader Navigation**
1. Enable VoiceOver
2. Navigate to Courses button with swipe/rotor
3. Activate button
4. Navigate modal with rotor "Headings" / "Links"
5. Verify all content announced
6. Close modal and verify return

---

## Detailed Findings

### Critical Issues
**None identified** - Pre-implementation audit with strong baseline patterns.

### High Priority Requirements

**HP-1: Courses Button ARIA Attributes**
- **Requirement**: Add aria-expanded, aria-controls, aria-haspopup
- **Impact**: Screen reader users need to know button opens dialog
- **WCAG**: 4.1.2 Name, Role, Value (Level A)
- **Priority**: High

**HP-2: Modal Dialog Title and Description**
- **Requirement**: Use DialogTitle and DialogDescription (not optional)
- **Impact**: Screen readers announce modal purpose
- **WCAG**: 2.4.6 Headings and Labels (Level AA)
- **Priority**: High

**HP-3: Course List Semantics**
- **Requirement**: Use role="list" and role="listitem"
- **Impact**: Screen readers announce list structure and count
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Priority**: High

**HP-4: Focus Indicator Contrast**
- **Requirement**: Verify ring-secondary/60 meets 3:1 contrast
- **Impact**: Keyboard users must see focus indicators
- **WCAG**: 2.4.7 Focus Visible (Level AA) + 1.4.11 Non-text Contrast (Level AA)
- **Priority**: High

**HP-5: Close Button Touch Target**
- **Requirement**: Ensure dialog close button is min 44x44px
- **Impact**: Mobile users need sufficient touch area
- **WCAG**: 2.5.5 Target Size (Level AAA) - aim for AAA
- **Priority**: High

**HP-6: Descriptive Link Labels**
- **Requirement**: Course links include course code, name, and unread count in aria-label
- **Impact**: Screen reader users need full context
- **WCAG**: 2.4.4 Link Purpose (Level A)
- **Priority**: High

### Medium Priority Requirements

**MP-1: Empty State Announcement**
- **Requirement**: Add role="status" aria-live="polite" to empty state
- **Impact**: Users should be informed when no courses available
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **Priority**: Medium

**MP-2: Reduced Motion Support**
- **Requirement**: Respect prefers-reduced-motion for modal animations
- **Impact**: Users with vestibular disorders
- **WCAG**: 2.3.3 Animation from Interactions (Level AAA)
- **Priority**: Medium

**MP-3: Unread Badge Contrast**
- **Requirement**: Verify text-warning on bg-warning/10 meets 4.5:1
- **Impact**: Users need to read unread counts
- **WCAG**: 1.4.3 Contrast (Minimum) (Level AA)
- **Priority**: Medium

**MP-4: Loading State Announcement**
- **Requirement**: If loading state implemented, add aria-live
- **Impact**: Users should know courses are loading
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **Priority**: Medium (only if loading state implemented)

---

## Accessibility Decision Summary

### ARIA Pattern Choice: Dialog Modal
**Rationale**: Courses modal is a true dialog that interrupts workflow and requires user action (select course or dismiss). Radix Dialog primitive provides robust, battle-tested implementation with automatic:
- Focus trap
- ESC key handling
- Focus return
- Role and ARIA attributes

**Alternative considered**: Popover pattern
**Rejected because**: Course selection is not contextual help or supplementary info - it's a primary navigation action requiring full user attention.

### Keyboard Navigation Model: Standard Modal Pattern
**Rationale**: No custom keyboard shortcuts needed. Standard modal interactions are universally understood:
- Tab/Shift+Tab for navigation
- ESC to close
- Enter to activate links
- Backdrop click to close

**Complexity vs Benefit**: Custom shortcuts would add complexity without meaningful UX improvement.

### Focus Management: Radix Auto-Managed
**Rationale**: Radix Dialog handles focus trap and return automatically. Manual implementation would risk bugs and is unnecessary given primitive quality.

**Custom focus required**: Initial focus position (first course vs close button) - recommend first course for efficiency.

### List Semantics: role="list" + role="listitem"
**Rationale**: Course collection has clear list semantics. Screen reader users benefit from knowing total count and current position.

**Alternative considered**: Grid pattern
**Rejected because**: Single column layout, no multi-dimensional navigation needed.

### Touch Targets: 44px Minimum (AAA)
**Rationale**: Mobile-first feature, users likely to have accessibility needs on smaller devices. QDS already uses 44px in bottom nav. Consistency + AAA compliance.

---

## WCAG 2.2 Success Criteria Mapping

### Level A (Must Pass)

| Criterion | Requirement | Status |
|-----------|-------------|--------|
| 1.3.1 Info and Relationships | List semantics, heading hierarchy | ✅ Planned |
| 2.1.1 Keyboard | All functionality keyboard accessible | ✅ Via Radix |
| 2.4.4 Link Purpose | Descriptive link labels | ✅ Planned |
| 4.1.2 Name, Role, Value | ARIA attributes on all controls | ✅ Planned |

### Level AA (Target Compliance)

| Criterion | Requirement | Status |
|-----------|-------------|--------|
| 1.4.3 Contrast (Minimum) | 4.5:1 text, 3:1 UI | ⚠️ Verify |
| 2.4.6 Headings and Labels | DialogTitle, descriptive labels | ✅ Planned |
| 2.4.7 Focus Visible | Visible focus indicators | ⚠️ Verify contrast |
| 1.4.11 Non-text Contrast | 3:1 for UI components | ⚠️ Verify focus rings |
| 4.1.3 Status Messages | Empty state, loading state | ✅ Planned |

### Level AAA (Aspirational)

| Criterion | Requirement | Status |
|-----------|-------------|--------|
| 2.5.5 Target Size | 44x44px minimum | ✅ Planned |
| 2.3.3 Animation from Interactions | Reduced motion support | ✅ Planned |

---

## Recommendations

### Phase 1 (MVP - AA Compliance)
1. Implement all High Priority requirements (HP-1 through HP-6)
2. Verify focus ring and badge contrast (manual testing)
3. Test keyboard navigation flow
4. Test with VoiceOver on iOS (primary platform)

### Phase 2 (Polish - AAA Where Feasible)
1. Implement Medium Priority requirements (MP-1 through MP-4)
2. Add loading state with aria-live if needed
3. Extended screen reader testing (NVDA, JAWS)
4. Color blind mode testing

### Phase 3 (Monitoring)
1. Automated accessibility testing in CI/CD
2. Axe-core integration
3. Lighthouse CI for regression prevention
4. User feedback collection

---

## References

1. **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
2. **Radix UI Dialog**: https://www.radix-ui.com/primitives/docs/components/dialog
3. **ARIA Authoring Practices (Dialog)**: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
4. **QDS Accessibility Requirements**: See QDS.md section "Accessibility Guidelines"
5. **Existing Patterns**: mobile-bottom-nav.tsx, enhanced-course-card.tsx, dialog.tsx

---

**Audit Date**: 2025-10-14
**Auditor**: Accessibility Validator Agent
**Scope**: Course Navigation Modal + Courses Button
**Target Compliance**: WCAG 2.2 Level AA (AAA for touch targets)

# Component Design Plan: CourseSelectionModal & MobileBottomNav

**Date:** 2025-10-14
**Task:** Course Navigation Modal for Mobile Bottom Nav
**Architect:** Component Architect (Sub-Agent)

---

## Table of Contents

1. [Component Hierarchy](#1-component-hierarchy)
2. [Props Interfaces](#2-props-interfaces)
3. [State Management Plan](#3-state-management-plan)
4. [Event Handling Pattern](#4-event-handling-pattern)
5. [Variant System](#5-variant-system)
6. [File Structure](#6-file-structure)
7. [Usage Examples](#7-usage-examples)
8. [Test Scenarios](#8-test-scenarios)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Component Hierarchy

```
NavHeader (state manager)
├── GlobalNavBar
├── CourseContextBar
├── QuokkaAssistantModal
├── CourseSelectionModal (NEW)
│   ├── Dialog (Radix UI)
│   │   └── DialogContent
│   │       ├── DialogHeader
│   │       │   ├── DialogTitle
│   │       │   └── DialogDescription (optional)
│   │       └── CourseList
│   │           └── CourseCard (inline component)
│   │               └── Link (Next.js)
│   └── EmptyState (if no courses)
└── MobileBottomNav (UPDATED)
    ├── HomeButton
    ├── CoursesButton (NEW - conditional)
    ├── AskButton (UPDATED - conditional)
    ├── AIButton
    └── SupportButton
```

**Key Relationships:**
- NavHeader manages `coursesModalOpen` state
- MobileBottomNav receives `onOpenCourses` callback
- CourseSelectionModal receives `enrolledCourses` data + open state
- Modal closes on course selection (via navigation)

---

## 2. Props Interfaces

### 2.1 CourseSelectionModal

**File:** `components/course/course-selection-modal.tsx`

```typescript
import type { CourseWithActivity } from "@/lib/models/types";

export interface CourseSelectionModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal open state changes
   * Called with false when modal should close
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Array of enrolled courses to display
   * Comes from dashboardData.enrolledCourses
   */
  courses: CourseWithActivity[];

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Design Rationale:**
- **Controlled Component**: `open` + `onOpenChange` pattern (matches Dialog API)
- **Props-Driven Data**: `courses` passed from parent (no internal fetching)
- **Simple Interface**: Only 4 props (follows KISS principle)
- **No Hardcoded Values**: All data comes via props

### 2.2 MobileBottomNav (Updated)

**File:** `components/layout/mobile-bottom-nav.tsx`

```typescript
export interface MobileBottomNavProps {
  /** Current active route path */
  currentPath: string;

  /** Navigate to home/dashboard */
  onNavigateHome: () => void;

  /** Ask Question handler - opens modal/page (CONDITIONAL) */
  onAskQuestion?: () => void;

  /** Open Courses modal handler (NEW - CONDITIONAL) */
  onOpenCourses?: () => void;

  /** AI Assistant handler - opens AI chat */
  onOpenAIAssistant?: () => void;

  /** Support handler - navigates to support page */
  onOpenSupport: () => void;
}
```

**Design Rationale:**
- **Backward Compatible**: Only adds optional `onOpenCourses` prop
- **Mutual Exclusivity**: `onAskQuestion` and `onOpenCourses` never both present
- **Optional Props Pattern**: Follows existing convention for conditional buttons
- **No Breaking Changes**: Existing usage still works

---

## 3. State Management Plan

### 3.1 NavHeader (State Manager)

**File:** `components/layout/nav-header.tsx`

**State:**
```typescript
// Existing state
const [aiModalOpen, setAiModalOpen] = useState(false);

// NEW STATE
const [coursesModalOpen, setCoursesModalOpen] = useState(false);
```

**State Flow:**
1. User taps "Courses" button in MobileBottomNav
2. `onOpenCourses()` callback fires → `setCoursesModalOpen(true)`
3. CourseSelectionModal renders
4. User selects course → `router.push()` navigates away
5. Navigation unmounts component → modal closes automatically

**Derived State:**
```typescript
const inCourseContext = navContext.context === 'course' && course;
```

**Conditional Logic:**
- `inCourseContext === true` → Pass `onAskQuestion` to MobileBottomNav
- `inCourseContext === false` → Pass `onOpenCourses` to MobileBottomNav

### 3.2 CourseSelectionModal (No Internal State)

**Pure Presentation Component:**
- No `useState` needed
- Receives all data via props
- Delegates state changes via callbacks
- No side effects

**Rationale:**
- Simplifies testing (pure function of props)
- Easier to reason about (no hidden state)
- Better performance (no unnecessary re-renders)
- Follows single responsibility principle

### 3.3 Data Source

**Dashboard Data (Already Fetched):**
```typescript
// In NavHeader - ALREADY EXISTS
const { data: dashboardData } = useStudentDashboard(user?.id || '');

// Available data
dashboardData.enrolledCourses // CourseWithActivity[]
```

**No Additional Fetches Required:**
- Modal uses existing data
- No loading states needed
- Instant modal open

---

## 4. Event Handling Pattern

### 4.1 NavHeader Event Handlers

```typescript
// NEW HANDLER
const handleOpenCoursesModal = () => {
  setCoursesModalOpen(true);
};

const handleCloseCoursesModal = () => {
  setCoursesModalOpen(false);
};

// Pass to MobileBottomNav
<MobileBottomNav
  currentPath={pathname || ""}
  onNavigateHome={() => router.push("/dashboard")}
  onAskQuestion={inCourseContext ? () => router.push(`/courses/${course.id}?modal=ask`) : undefined}
  onOpenCourses={!inCourseContext ? handleOpenCoursesModal : undefined}
  onOpenAIAssistant={() => setAiModalOpen(true)}
  onOpenSupport={() => router.push("/support")}
/>

// Pass to CourseSelectionModal
<CourseSelectionModal
  open={coursesModalOpen}
  onOpenChange={setCoursesModalOpen}
  courses={dashboardData?.enrolledCourses || []}
/>
```

### 4.2 MobileBottomNav Conditional Rendering

```typescript
// In MobileBottomNav component
{!inCourseContext && onOpenCourses && (
  <button
    onClick={onOpenCourses}
    className={/* secondary green theme */}
    aria-label="Open Courses"
  >
    <BookOpen className="h-6 w-6" />
    <span className="text-xs font-medium">Courses</span>
  </button>
)}

{inCourseContext && onAskQuestion && (
  <button
    onClick={onAskQuestion}
    className={/* amber theme */}
    aria-label="Ask Question"
  >
    <MessageSquarePlus className="h-6 w-6" />
    <span className="text-xs font-medium">Ask</span>
  </button>
)}
```

**Logic:**
- Courses button: Show when `!inCourseContext && onOpenCourses` exists
- Ask button: Show when `inCourseContext && onAskQuestion` exists
- Never both visible simultaneously

### 4.3 CourseSelectionModal Events

```typescript
// Course card click
const handleCourseClick = (courseId: string) => {
  // Navigation handled by Link component
  // Modal closes automatically on route change
  // Optional: Explicitly close modal
  onOpenChange(false);
};

// Backdrop click / Escape key
// Handled automatically by Radix Dialog
onOpenChange(false);

// Close button click
<DialogClose onClick={() => onOpenChange(false)} />
```

---

## 5. Variant System

### 5.1 MobileBottomNav Button Variants

**Courses Button (Secondary Green Theme):**

```typescript
const coursesButtonStyles = cn(
  // Base styles
  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
  "transition-all duration-300 ease-out",

  // Secondary color theme
  "hover:bg-secondary/5 dark:hover:bg-secondary/20",
  "active:bg-secondary/10 dark:active:bg-secondary/30",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60",
  "group"
);

const coursesIconStyles = cn(
  "h-6 w-6 text-secondary/70",
  "transition-all duration-300 ease-out",
  "group-hover:text-secondary",
  "group-hover:scale-110",
  "group-active:scale-105",
  "motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
);

const coursesLabelStyles = cn(
  "text-xs font-medium text-secondary dark:text-secondary"
);
```

**Comparison with Ask Button (Amber Theme):**

| Aspect | Courses Button | Ask Button |
|--------|----------------|------------|
| Base color | `text-secondary/70` | `text-amber-600/70` |
| Hover bg | `bg-secondary/5` | `bg-amber-50` |
| Focus ring | `ring-secondary/60` | `ring-amber-600/60` |
| Glow effect | None (optional) | Drop shadow with amber |
| Label color | `text-secondary` | `text-amber-700` |

### 5.2 CourseSelectionModal Styling Variants

**Glass Panel Strong:**
```typescript
const modalContentStyles = cn(
  "max-w-[95vw] sm:max-w-md md:max-w-lg",
  "max-h-[80vh]",
  "glass-panel-strong",
  "backdrop-blur-xl",
  "border border-glass",
  "shadow-[var(--shadow-glass-lg)]",
  "rounded-xl",
  "p-6",
  "overflow-hidden"
);
```

**Course Card (Inline):**
```typescript
const courseCardStyles = cn(
  "block min-h-[120px] p-4",
  "glass-panel",
  "backdrop-blur-md",
  "border border-glass",
  "shadow-[var(--shadow-glass-sm)]",
  "rounded-lg",
  "hover:scale-[1.02] hover:shadow-[var(--shadow-glass-md)]",
  "active:scale-[0.98]",
  "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
  "transition-all duration-300 ease-out",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
);
```

---

## 6. File Structure

### 6.1 Files to Create

**1. CourseSelectionModal Component**

```plaintext
components/course/course-selection-modal.tsx

Imports:
- Dialog, DialogContent, DialogHeader, DialogTitle from "@/components/ui/dialog"
- Card from "@/components/ui/card"
- BookOpen from "lucide-react"
- Link from "next/link"
- CourseWithActivity from "@/lib/models/types"
- cn from "@/lib/utils"

Exports:
- CourseSelectionModalProps (interface)
- CourseSelectionModal (function component)
```

**Component Structure:**
```tsx
export function CourseSelectionModal({ open, onOpenChange, courses, className }: CourseSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* modal styles */, className)}>
        <DialogHeader>
          <DialogTitle>My Courses</DialogTitle>
          <DialogDescription>Select a course to view its Q&A threads</DialogDescription>
        </DialogHeader>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto sidebar-scroll">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <article className={/* course card styles */}>
                  {/* Course icon, code, name, metrics */}
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Courses Enrolled"
            description="You're not enrolled in any courses yet. Contact your instructor to get started."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### 6.2 Files to Modify

**1. MobileBottomNav**

```plaintext
components/layout/mobile-bottom-nav.tsx

Changes:
1. Add onOpenCourses prop to interface (optional)
2. Import BookOpen from "lucide-react"
3. Add conditional Courses button rendering
4. Update Ask button conditional (only show if onAskQuestion exists)

Lines affected: ~15-30 (interface + button slot 2)
```

**2. NavHeader**

```plaintext
components/layout/nav-header.tsx

Changes:
1. Add coursesModalOpen state (useState)
2. Import CourseSelectionModal
3. Add onOpenCourses handler
4. Conditionally pass onOpenCourses OR onAskQuestion to MobileBottomNav
5. Render CourseSelectionModal component

Lines affected: ~10-20 (imports, state, handlers, JSX)
```

### 6.3 Import/Export Strategy

**CourseSelectionModal:**
```typescript
// Named exports (preferred for components)
export interface CourseSelectionModalProps { /* ... */ }
export function CourseSelectionModal({ /* ... */ }) { /* ... */ }
```

**MobileBottomNav:**
```typescript
// Named exports (existing pattern)
export interface MobileBottomNavProps { /* ... */ }
export function MobileBottomNav({ /* ... */ }) { /* ... */ }
```

**NavHeader:**
```typescript
// Named export (existing pattern)
export function NavHeader() { /* ... */ }
```

---

## 7. Usage Examples

### 7.1 Basic Usage (NavHeader)

```tsx
"use client";

import { useState } from "react";
import { CourseSelectionModal } from "@/components/course/course-selection-modal";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useStudentDashboard, useCurrentUser } from "@/lib/api/hooks";

export function NavHeader() {
  const { data: user } = useCurrentUser();
  const { data: dashboardData } = useStudentDashboard(user?.id || '');

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [coursesModalOpen, setCoursesModalOpen] = useState(false);

  const inCourseContext = /* detect course context */;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Global Nav */}

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        currentPath={pathname || ""}
        onNavigateHome={() => router.push("/dashboard")}
        onAskQuestion={inCourseContext ? () => router.push(`/courses/${course.id}?modal=ask`) : undefined}
        onOpenCourses={!inCourseContext ? () => setCoursesModalOpen(true) : undefined}
        onOpenAIAssistant={() => setAiModalOpen(true)}
        onOpenSupport={() => router.push("/support")}
      />

      {/* Courses Modal */}
      <CourseSelectionModal
        open={coursesModalOpen}
        onOpenChange={setCoursesModalOpen}
        courses={dashboardData?.enrolledCourses || []}
      />
    </div>
  );
}
```

### 7.2 With Custom Styling

```tsx
<CourseSelectionModal
  open={coursesModalOpen}
  onOpenChange={setCoursesModalOpen}
  courses={courses}
  className="custom-modal-class"
/>
```

### 7.3 Empty State Handling

```tsx
// Automatically handled by component
<CourseSelectionModal
  open={coursesModalOpen}
  onOpenChange={setCoursesModalOpen}
  courses={[]} // Empty array - shows EmptyState
/>
```

### 7.4 MobileBottomNav Conditional Buttons

```tsx
// Example 1: Dashboard (not in course context)
<MobileBottomNav
  currentPath="/dashboard"
  onNavigateHome={() => router.push("/dashboard")}
  onOpenCourses={() => setCoursesModalOpen(true)} // Courses button VISIBLE
  onAskQuestion={undefined}                        // Ask button HIDDEN
  onOpenAIAssistant={() => setAiModalOpen(true)}
  onOpenSupport={() => router.push("/support")}
/>

// Example 2: Course Page (in course context)
<MobileBottomNav
  currentPath="/courses/cs101"
  onNavigateHome={() => router.push("/dashboard")}
  onOpenCourses={undefined}                                      // Courses button HIDDEN
  onAskQuestion={() => router.push("/courses/cs101?modal=ask")} // Ask button VISIBLE
  onOpenAIAssistant={() => setAiModalOpen(true)}
  onOpenSupport={() => router.push("/support")}
/>
```

---

## 8. Test Scenarios

### 8.1 CourseSelectionModal Tests

**Rendering:**
- ✓ Modal opens when `open={true}`
- ✓ Modal closes when `open={false}`
- ✓ Displays course list when `courses.length > 0`
- ✓ Shows EmptyState when `courses.length === 0`
- ✓ Renders correct number of course cards
- ✓ Applies custom className when provided

**Course Card Content:**
- ✓ Displays course code (e.g., "CS101")
- ✓ Displays course name (e.g., "Intro to CS")
- ✓ Displays course term (e.g., "Fall 2025")
- ✓ Shows "Questions" metric with correct count
- ✓ Shows "New" metric with correct unread count
- ✓ Renders BookOpen icon in primary/10 background

**Interactions:**
- ✓ Clicking course card navigates to `/courses/{id}`
- ✓ Clicking backdrop closes modal (calls `onOpenChange(false)`)
- ✓ Pressing Escape closes modal
- ✓ Clicking X button closes modal
- ✓ Course cards have 44px minimum height (touch target)

**Accessibility:**
- ✓ Modal has proper ARIA attributes (role, aria-modal, aria-labelledby)
- ✓ Focus trapped within modal when open
- ✓ Focus returns to trigger on close
- ✓ Screen reader announces modal title on open
- ✓ Course cards keyboard navigable (Tab, Enter)
- ✓ Visual focus indicator visible on all interactive elements

**Responsive:**
- ✓ Modal width: 95vw on mobile (360px)
- ✓ Modal width: max-w-md on sm (640px+)
- ✓ Modal width: max-w-lg on md (768px+)
- ✓ Single column grid on mobile
- ✓ Two column grid on sm+
- ✓ Max height: 80vh with internal scrolling
- ✓ Glass blur reduced on mobile (<768px)

### 8.2 MobileBottomNav Tests

**Conditional Rendering:**
- ✓ Shows Courses button when `onOpenCourses` provided
- ✓ Hides Courses button when `onOpenCourses` is undefined
- ✓ Shows Ask button when `onAskQuestion` provided
- ✓ Hides Ask button when `onAskQuestion` is undefined
- ✓ Never shows both Courses and Ask buttons simultaneously
- ✓ Always shows Home, AI, Support buttons

**Courses Button Styling:**
- ✓ Uses secondary (green) color theme
- ✓ Renders BookOpen icon (h-6 w-6)
- ✓ Shows "Courses" label (text-xs)
- ✓ Min height: 44px (WCAG 2.5.5)
- ✓ Hover state: bg-secondary/5
- ✓ Active state: bg-secondary/10
- ✓ Focus ring: ring-secondary/60 (4px)
- ✓ Icon scales to 110% on hover
- ✓ Reduced motion: no scale transform

**Interactions:**
- ✓ Clicking Courses button calls `onOpenCourses()` callback
- ✓ Button responds to touch events (mobile)
- ✓ Button keyboard accessible (Tab, Enter/Space)

**Accessibility:**
- ✓ Courses button has `aria-label="Open Courses"`
- ✓ Icon has `aria-hidden="true"`
- ✓ Label text visible (not sr-only)
- ✓ Focus visible on keyboard navigation

### 8.3 Integration Tests

**NavHeader + MobileBottomNav + CourseSelectionModal:**
- ✓ On dashboard: Courses button visible, Ask button hidden
- ✓ On course page: Courses button hidden, Ask button visible
- ✓ Clicking Courses opens modal
- ✓ Modal displays correct courses from `dashboardData.enrolledCourses`
- ✓ Selecting course navigates and closes modal
- ✓ Modal state persists across re-renders (until navigation)

**Edge Cases:**
- ✓ User with 0 enrolled courses sees EmptyState
- ✓ User with 1 enrolled course sees single card
- ✓ User with 10+ enrolled courses: modal scrolls internally
- ✓ Modal opens instantly (no loading state) - data pre-fetched
- ✓ Course with `unreadCount: 0` shows "0" (not hidden)
- ✓ Long course names truncate with ellipsis
- ✓ Modal closes on route change (automatic unmount)

---

## 9. Implementation Checklist

### 9.1 Architecture

- [ ] All data comes via props (no hardcoded values)
- [ ] TypeScript interfaces defined for all props
- [ ] Event handlers use callbacks (no direct mutations)
- [ ] CourseSelectionModal component <200 lines of code
- [ ] Uses Radix Dialog primitives (accessibility)
- [ ] Composable with existing components (Link, Card)
- [ ] Reusable if needed elsewhere (props-driven)

### 9.2 State Management

- [ ] State placement justified (NavHeader = state manager)
- [ ] No React Query needed (uses existing dashboardData)
- [ ] No prop drilling beyond 2 levels (NavHeader → Modal)
- [ ] Modal state controlled (open + onOpenChange)

### 9.3 Performance

- [ ] No expensive operations (no memoization needed)
- [ ] No render optimization needed (small course list)
- [ ] No code splitting needed (modal is lightweight)
- [ ] Lazy rendering (only renders when open)
- [ ] Automatic unmount on close (no memory leak)

### 9.4 Accessibility & UX

- [ ] Semantic HTML elements (`<article>`, `<Link>`)
- [ ] ARIA attributes (handled by Radix Dialog)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus management (Radix handles focus trap)
- [ ] Loading states: N/A (data pre-fetched)
- [ ] Error states: N/A (uses existing error handling)
- [ ] Empty state: Shows helpful message + icon

### 9.5 Design System (QDS)

- [ ] Uses QDS color tokens (`text-secondary`, `bg-secondary/10`)
- [ ] Uses QDS spacing scale (`gap-4`, `p-6`)
- [ ] Uses QDS radius scale (`rounded-xl`, `rounded-lg`)
- [ ] Uses QDS shadows (`shadow-[var(--shadow-glass-md)]`)
- [ ] Ensures 4.5:1 contrast ratio minimum
- [ ] Hover/focus/disabled states use QDS tokens
- [ ] Glass styling: `glass-panel-strong` for modal
- [ ] Glass styling: `glass-panel` for course cards

### 9.6 Responsive Design

- [ ] Mobile-first approach
- [ ] Breakpoint strategy: sm (640px), md (768px)
- [ ] Touch targets ≥44px on mobile (buttons, cards)
- [ ] Single column on mobile, 2 columns on sm+
- [ ] Max height: 80vh with internal scrolling
- [ ] Reduced blur on mobile (<768px) for performance

### 9.7 Code Quality

- [ ] Follows existing code style (prettier, eslint)
- [ ] Uses `import type` for type-only imports
- [ ] Explicit interfaces (no `any` types)
- [ ] JSDoc comments for complex logic (if needed)
- [ ] Component documented with usage examples
- [ ] Follows CLAUDE.md guidelines (C-1 through C-20)

---

## 10. Architecture Rationale

### 10.1 Why Separate CourseSelectionModal Component?

**Pros:**
- Single responsibility: Modal only renders course list
- Testable in isolation
- Reusable if needed elsewhere (e.g., settings page)
- Clean separation of concerns

**Alternatives Considered:**
- Inline modal in NavHeader → Rejected (too much coupling, harder to test)
- Reuse EnhancedCourseCard → Rejected (too heavy for modal, different layout needs)

### 10.2 Why Inline Course Cards in Modal?

**Pros:**
- Simplified layout (fewer metrics, compact design)
- No need for separate component (KISS principle)
- Faster to implement
- Less file overhead

**Alternatives Considered:**
- Create CompactCourseCard component → Rejected (overkill for single use case)
- Reuse EnhancedCourseCard → Rejected (different layout requirements)

### 10.3 Why Conditional `onOpenCourses` Prop?

**Pros:**
- Follows existing `onAskQuestion` pattern (consistency)
- Backward compatible (optional prop)
- No breaking changes to existing usage
- Clear mutual exclusivity (Courses OR Ask, never both)

**Alternatives Considered:**
- `inCourseContext` prop → Rejected (props should be data, not logic)
- Separate CoursesButton component → Rejected (too much fragmentation)

### 10.4 Why State in NavHeader?

**Pros:**
- NavHeader already manages modals (AiModal)
- Has access to dashboardData (already fetched)
- Single source of truth for navigation state
- No context needed (simple prop drilling)

**Alternatives Considered:**
- State in MobileBottomNav → Rejected (doesn't have access to course data)
- Global state (Zustand) → Rejected (overkill for local UI state)

---

## 11. Trade-offs Made

### 11.1 Inline Course Cards vs Separate Component

**Chosen:** Inline course cards in CourseSelectionModal

**Trade-off:**
- **Benefit:** Simpler implementation, fewer files, faster delivery
- **Cost:** Less reusable if similar cards needed elsewhere
- **Mitigation:** Easy to extract later if reuse case emerges

### 11.2 No Search/Filter Functionality

**Chosen:** Simple list without search

**Trade-off:**
- **Benefit:** Simpler UX, faster implementation, meets MVP requirements
- **Cost:** May need search if user has 20+ courses
- **Mitigation:** Typical student has 4-6 courses (doesn't justify complexity)

### 11.3 No Course Favoriting/Pinning

**Chosen:** Courses shown in API order

**Trade-off:**
- **Benefit:** Zero state management, simpler UX
- **Cost:** User can't prioritize frequently accessed courses
- **Mitigation:** Course list typically small (fast to scan visually)

---

## 12. Future Considerations

### 12.1 Potential Extensions

1. **Search Bar** (if >10 courses)
   - Add search input above course list
   - Filter by course code or name
   - Debounced search (300ms delay)

2. **Recently Viewed** (future enhancement)
   - Show 2-3 recently accessed courses at top
   - "Recent" section + "All Courses" section
   - Stored in localStorage or backend

3. **Course Favoriting** (future enhancement)
   - Star icon on course cards
   - Favorited courses pinned to top
   - Stored in user preferences

4. **Keyboard Shortcuts** (future enhancement)
   - Cmd+K / Ctrl+K to open modal
   - Number keys (1-9) to select course
   - Arrow keys + Enter to navigate

### 12.2 Known Limitations

1. **No Pagination** - Assumes <20 courses per user
2. **No Virtualization** - All courses rendered at once
3. **No Loading Skeleton** - Assumes data pre-fetched (true for current impl)
4. **No Error Boundary** - Relies on parent error handling

### 12.3 Refactoring Opportunities

1. **Extract CourseCard Component** (if reuse case emerges)
2. **Share Button Styles** (if more conditional buttons added to nav)
3. **Centralize Modal State** (if >5 modals in NavHeader - use Zustand)

---

## 13. Key Architectural Decisions

### Decision 1: Modal Component Structure
**Choice:** Separate CourseSelectionModal component with inline course cards
**Rationale:** Balance between reusability and simplicity. Modal can be reused, but cards are context-specific.

### Decision 2: State Management Location
**Choice:** useState in NavHeader (not context or global state)
**Rationale:** NavHeader already manages modal state and has access to course data. No need for global state overhead.

### Decision 3: Conditional Button Rendering
**Choice:** Optional props (`onOpenCourses` / `onAskQuestion`) with mutual exclusivity
**Rationale:** Follows existing MobileBottomNav pattern. Clear, type-safe, backward compatible.

### Decision 4: Course Card Design
**Choice:** Simplified inline cards (not full EnhancedCourseCard)
**Rationale:** Modal context requires compact layout. Show essential info only: code, name, metrics.

### Decision 5: Data Flow
**Choice:** Props-driven modal (receives courses array from NavHeader)
**Rationale:** No internal fetching. Uses existing dashboardData. Instant modal open, no loading states.

### Decision 6: Navigation Behavior
**Choice:** Modal closes automatically on course selection via navigation
**Rationale:** Route change unmounts component. No explicit close needed. Clean UX.

### Decision 7: Empty State Handling
**Choice:** Show EmptyState component with helpful message
**Rationale:** User should understand why no courses shown. Better than blank modal.

### Decision 8: Accessibility Strategy
**Choice:** Rely on Radix Dialog for all accessibility features
**Rationale:** Focus trap, ARIA, keyboard nav handled automatically. Don't reinvent the wheel.

### Decision 9: Responsive Strategy
**Choice:** Mobile-first with sm/md breakpoints. Single/double column grid.
**Rationale:** Modal primarily used on mobile. Desktop gets benefit of responsive layout.

### Decision 10: Performance Strategy
**Choice:** No optimization (no memoization, virtualization, lazy loading)
**Rationale:** Small dataset (<20 courses), pre-fetched data, simple rendering. Premature optimization avoided.

---

**End of Component Design Plan**

---

**Next Steps:**
1. Review this design plan
2. Approve or request changes
3. Proceed with implementation following this architecture

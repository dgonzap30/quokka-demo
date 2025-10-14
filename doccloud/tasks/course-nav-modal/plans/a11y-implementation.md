# Accessibility Implementation Plan: Course Navigation Modal

## Priority Order

1. **Critical Fixes**: None (pre-implementation, no existing issues)
2. **High Priority Implementations** (6 items): Must complete for WCAG AA compliance
3. **Medium Priority Implementations** (4 items): Enhance UX and aim for AAA where feasible

---

## File Modifications Required

### /Users/dgz/projects-professional/quokka/quokka-demo/components/layout/mobile-bottom-nav.tsx

#### Implementation 1: Add Courses Button with Full ARIA Support
**Priority:** High
**Current State:** Component has Ask Question button; Courses button will replace it when outside course context
**Required Change:** Add new button with comprehensive ARIA attributes for modal control

**Implementation:**

```tsx
// Add to MobileBottomNavProps interface
export interface MobileBottomNavProps {
  currentPath: string;
  onNavigateHome: () => void;
  onAskQuestion?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenSupport: () => void;

  // NEW: Courses button handler and state
  onOpenCourses?: () => void;
  isCoursesModalOpen?: boolean;  // Required for aria-expanded
  inCourseContext?: boolean;     // Determines which button to show
}

// In component body, add conditional rendering
export function MobileBottomNav({
  currentPath,
  onNavigateHome,
  onAskQuestion,
  onOpenAIAssistant,
  onOpenSupport,
  onOpenCourses,
  isCoursesModalOpen = false,
  inCourseContext = false,
}: MobileBottomNavProps) {
  // ... existing code ...

  return (
    <nav>
      <div className="grid grid-cols-4 gap-0 safe-bottom">
        {/* Home button - unchanged */}

        {/* Conditional: Courses button OR Ask Question button */}
        {!inCourseContext && onOpenCourses && (
          <button
            onClick={onOpenCourses}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
              "transition-all duration-300 ease-out",
              "hover:bg-secondary/5 active:bg-secondary/10",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60",
              "group"
            )}
            aria-label="Select Course"
            aria-expanded={isCoursesModalOpen}
            aria-controls="courses-modal"
            aria-haspopup="dialog"
          >
            <BookOpen
              className={cn(
                "h-6 w-6 text-secondary/70",
                "transition-all duration-300 ease-out",
                "[filter:drop-shadow(0_0_0.5px_rgba(94,125,74,0.3))]",
                "group-hover:text-secondary",
                "group-hover:[filter:drop-shadow(0_0_2px_rgba(94,125,74,0.8))_drop-shadow(0_0_6px_rgba(94,125,74,0.4))]",
                "group-hover:scale-110",
                "group-active:scale-105",
                "motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
              )}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-secondary-700 dark:text-secondary-500">
              Courses
            </span>
          </button>
        )}

        {/* Ask Question button - only show when IN course context */}
        {inCourseContext && onAskQuestion && (
          <button
            onClick={onAskQuestion}
            {/* existing Ask button implementation */}
          >
            {/* ... */}
          </button>
        )}

        {/* AI Assistant button - unchanged */}
        {/* Support button - unchanged */}
      </div>
    </nav>
  );
}
```

**ARIA Attributes Explained:**
- `aria-label="Select Course"`: Accessible name (more descriptive than visual "Courses")
- `aria-expanded={isCoursesModalOpen}`: Announces current state (true/false)
- `aria-controls="courses-modal"`: Links button to modal it controls
- `aria-haspopup="dialog"`: Sets expectation for modal dialog interaction

**Keyboard Support:**
- Enter key: Opens modal (native button behavior)
- Space key: Opens modal (native button behavior)
- Tab: Moves to next nav item
- Focus indicator: 4px ring with secondary color at 60% opacity

**Test Scenario:**
1. Navigate to dashboard (outside course context)
2. Tab to Courses button
3. Verify focus ring visible with sufficient contrast
4. Verify screen reader announces: "Select Course, button, collapsed, has popup dialog"
5. Press Enter
6. Verify modal opens
7. Verify aria-expanded updates to "true"

---

### /Users/dgz/projects-professional/quokka/quokka-demo/components/course/course-selection-modal.tsx

#### Implementation 2: Create Modal Component with Dialog Semantics
**Priority:** High
**Current State:** Component does not exist
**Required Change:** Create new component with Radix Dialog and full accessibility features

**Implementation:**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import type { CourseWithActivity } from "@/lib/models/types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface CourseSelectionModalProps {
  /** Modal open state */
  open: boolean;

  /** Close handler (updates parent state and aria-expanded) */
  onClose: () => void;

  /** Enrolled courses with activity data */
  courses: CourseWithActivity[];

  /** Loading state */
  loading?: boolean;
}

/**
 * Course Selection Modal - Mobile navigation helper for quick course access
 *
 * Accessibility:
 * - WCAG 2.2 Level AA compliant
 * - Full keyboard navigation (Tab, Escape)
 * - Focus trap within modal
 * - Screen reader announcements
 * - List semantics for course collection
 * - 44px minimum touch targets
 */
export function CourseSelectionModal({
  open,
  onClose,
  courses,
  loading = false,
}: CourseSelectionModalProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const handleCourseSelect = (courseId: string) => {
    router.push(`/courses/${courseId}`);
    // Modal will close via route change
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        id="courses-modal"
        className={cn(
          "glass-panel-strong rounded-2xl shadow-[var(--shadow-glass-lg)]",
          "max-w-2xl max-h-[85vh] flex flex-col",
          "p-6 gap-4"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glass-text">
            Select Course
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {loading
              ? "Loading your enrolled courses..."
              : courses.length === 0
              ? "You are not enrolled in any courses yet."
              : `Choose a course to view discussions. You are enrolled in ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="space-y-3 overflow-y-auto max-h-[calc(85vh-180px)]"
          >
            <span className="sr-only">Loading your courses...</span>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg bg-glass-medium" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && courses.length === 0 && (
          <div role="status" aria-live="polite">
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="You are not enrolled in any courses. Contact your instructor to get enrolled."
              statusAnnouncement="You are not enrolled in any courses"
            />
          </div>
        )}

        {/* Course List */}
        {!loading && courses.length > 0 && (
          <div
            role="list"
            aria-label="Your enrolled courses"
            className="space-y-2 overflow-y-auto max-h-[calc(85vh-180px)] pr-2"
          >
            {courses.map((course, index) => (
              <article
                key={course.id}
                role="listitem"
                aria-labelledby={`course-modal-${course.id}-title`}
                aria-posinset={index + 1}
                aria-setsize={courses.length}
              >
                <button
                  onClick={() => handleCourseSelect(course.id)}
                  className={cn(
                    "w-full text-left",
                    "flex items-center gap-4 p-4 rounded-lg",
                    "glass-panel backdrop-blur-md border border-glass",
                    "hover:border-secondary/30 hover:shadow-[var(--shadow-glass-md)]",
                    "active:scale-[0.98]",
                    "transition-all duration-200 ease-out",
                    "min-h-[64px]",  // Exceeds 44px touch target
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    !prefersReducedMotion && "hover:scale-[1.02]",
                    "motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                  )}
                  aria-label={`${course.code}: ${course.name}${course.unreadCount > 0 ? `. ${course.unreadCount} new ${course.unreadCount === 1 ? 'question' : 'questions'}` : ''}`}
                >
                  {/* Course Icon */}
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-secondary" aria-hidden="true" />
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      id={`course-modal-${course.id}-title`}
                      className="text-lg font-semibold text-primary glass-text truncate"
                    >
                      {course.code}
                    </h3>
                    <p className="text-sm text-muted-foreground glass-text truncate">
                      {course.name}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {course.unreadCount > 0 && (
                    <div
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full",
                        "bg-warning/15 text-warning",
                        "text-sm font-semibold tabular-nums",
                        "min-w-[44px] text-center"  // Ensure readable touch target
                      )}
                      aria-label={`${course.unreadCount} unread ${course.unreadCount === 1 ? 'question' : 'questions'}`}
                    >
                      {course.unreadCount}
                    </div>
                  )}
                </button>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**ARIA Strategy:**
1. **Dialog Semantics**: Radix Dialog provides role="dialog", aria-modal="true"
2. **DialogTitle**: Automatically creates aria-labelledby
3. **DialogDescription**: Provides context and course count
4. **List Semantics**: role="list" + role="listitem" + aria-posinset/aria-setsize
5. **Loading State**: role="status" + aria-live="polite" + aria-busy="true"
6. **Empty State**: role="status" with polite announcement

**Keyboard Navigation:**
- Tab: Navigate through course cards
- Shift+Tab: Navigate backwards
- Escape: Close modal (Radix handles this)
- Enter: Select focused course
- Focus trap: Radix handles automatically

**Focus Management:**
- Initial focus: First course card (most efficient)
- Trap focus: Cannot Tab out of modal
- Return focus: Radix returns to Courses button on close

**Touch Targets:**
- Course cards: min-h-[64px] (exceeds 44px requirement)
- Close button: Verify 44x44px in dialog.tsx
- Unread badge: min-w-[44px] for readable tap area

**Test Scenario:**
1. Open modal from Courses button
2. Verify focus moves to first course
3. Verify screen reader announces: "Dialog. Select Course. Choose a course..."
4. Tab through all courses
5. Verify each course announced with unread count
6. Verify list position announced (item 1 of 3)
7. Press Escape
8. Verify modal closes and focus returns to button

---

### /Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx

#### Implementation 3: Add Modal State Management
**Priority:** High
**Current State:** Component manages ask question modal state
**Required Change:** Add courses modal state and pass to mobile bottom nav

**Implementation:**

```tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
// ... other imports

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Existing state
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // NEW: Courses modal state
  const [coursesModalOpen, setCoursesModalOpen] = useState(false);

  // Determine if we're in course context
  const inCourseContext = pathname?.startsWith('/courses/') ?? false;

  // Course selection modal data (from dashboard hook)
  const { data: dashboardData, isLoading } = useStudentDashboard();
  const enrolledCourses = dashboardData?.enrolledCourses ?? [];

  return (
    <>
      <GlobalNavBar
        currentPath={pathname}
        // ... other props
      />

      <MobileBottomNav
        currentPath={pathname}
        onNavigateHome={() => router.push('/dashboard')}
        onAskQuestion={inCourseContext ? () => setAskModalOpen(true) : undefined}
        onOpenAIAssistant={() => setAiModalOpen(true)}
        onOpenSupport={() => router.push('/support')}

        {/* NEW: Courses modal handlers */}
        onOpenCourses={!inCourseContext ? () => setCoursesModalOpen(true) : undefined}
        isCoursesModalOpen={coursesModalOpen}
        inCourseContext={inCourseContext}
      />

      {/* Existing modals */}

      {/* NEW: Courses modal */}
      <CourseSelectionModal
        open={coursesModalOpen}
        onClose={() => setCoursesModalOpen(false)}
        courses={enrolledCourses}
        loading={isLoading}
      />
    </>
  );
}
```

**State Management:**
- `coursesModalOpen`: Controls Dialog open state
- `inCourseContext`: Determines which button to show in bottom nav
- Passed to MobileBottomNav for aria-expanded attribute

**Test Scenario:**
1. Navigate to /dashboard
2. Verify Courses button visible (not Ask button)
3. Verify inCourseContext = false
4. Click Courses button
5. Verify coursesModalOpen = true
6. Verify aria-expanded = true on button
7. Navigate to /courses/cs2110
8. Verify Ask button visible (not Courses button)
9. Verify inCourseContext = true

---

### /Users/dgz/projects-professional/quokka/quokka-demo/components/ui/dialog.tsx

#### Implementation 4: Ensure Close Button Meets Touch Target
**Priority:** High
**Current State:** Close button may not meet 44x44px requirement
**Required Change:** Override DialogPrimitive.Close button sizing

**Implementation:**

```tsx
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out",
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6",
          "shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              // ADDED: Ensure 44x44px minimum touch target
              "min-h-[44px] min-w-[44px]",
              "flex items-center justify-center",  // Center icon in 44px area
              // Existing styles
              "ring-offset-background focus:ring-ring",
              "absolute top-4 right-4 rounded-xs opacity-70",
              "transition-opacity hover:opacity-100",
              "focus:ring-4 focus:ring-accent/60 focus:ring-offset-2",
              "focus:outline-hidden",
              "disabled:pointer-events-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
            aria-label="Close dialog"  // ADDED: Explicit label
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
```

**Changes:**
1. Added `min-h-[44px] min-w-[44px]` for WCAG AAA touch target
2. Added `flex items-center justify-center` to center icon in larger area
3. Added explicit `aria-label="Close dialog"` (belt and suspenders with sr-only)
4. Updated focus ring to use accent color with 60% opacity

**Test Scenario:**
1. Open course selection modal
2. Verify close button (X) is at least 44x44px
3. Tap close button on mobile (verify hit area)
4. Tab to close button
5. Verify focus ring visible
6. Press Enter
7. Verify modal closes

---

### /Users/dgz/projects-professional/quokka/quokka-demo/components/ui/empty-state.tsx

#### Implementation 5: Add Status Announcement Support
**Priority:** Medium
**Current State:** EmptyState component exists but may not support aria-live
**Required Change:** Add optional statusAnnouncement prop for screen readers

**Implementation:**

```tsx
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;

  // NEW: Optional status announcement for aria-live regions
  statusAnnouncement?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  statusAnnouncement,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {/* Visual content */}
      {Icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/10 mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}

      {/* Screen reader announcement */}
      {statusAnnouncement && (
        <div className="sr-only" role="status" aria-live="polite">
          {statusAnnouncement}
        </div>
      )}
    </div>
  );
}
```

**Usage in CourseSelectionModal:**

```tsx
<EmptyState
  icon={BookOpen}
  title="No courses yet"
  description="You are not enrolled in any courses."
  statusAnnouncement="You are not enrolled in any courses"
/>
```

**Test Scenario:**
1. Open courses modal when user has 0 enrolled courses
2. Enable screen reader (VoiceOver)
3. Verify announcement: "You are not enrolled in any courses"
4. Verify role="status" with aria-live="polite"

---

## Testing Checklist

### Keyboard Navigation Testing

- [ ] **Tab to Courses Button**
  - Focus indicator visible with 4px secondary ring
  - Screen reader announces: "Select Course, button, collapsed, has popup dialog"

- [ ] **Open Modal with Enter/Space**
  - Modal opens
  - Focus moves to first course card (or close button if no courses)
  - Screen reader announces dialog title and description

- [ ] **Navigate Within Modal**
  - Tab moves through all course cards
  - Each course card has visible focus indicator (accent color)
  - Screen reader announces course code, name, unread count
  - List position announced (item X of Y)

- [ ] **Close Modal with Escape**
  - Modal closes
  - Focus returns to Courses button
  - Screen reader announces button state (collapsed)

- [ ] **Select Course with Enter**
  - Course page loads
  - Focus moves to main content

- [ ] **No Keyboard Traps**
  - Cannot Tab out of modal while open
  - Can always close modal with Escape
  - Can navigate backwards with Shift+Tab

### Screen Reader Testing (VoiceOver, NVDA, JAWS)

- [ ] **Courses Button Announcement**
  - "Select Course, button, collapsed, has popup dialog"
  - aria-expanded state announced correctly

- [ ] **Modal Open Announcement**
  - Dialog role announced
  - DialogTitle announced: "Select Course"
  - DialogDescription announced with course count

- [ ] **Course List Navigation**
  - List semantics announced
  - Total count announced: "List, 3 items"
  - Each item position: "Item 1 of 3"

- [ ] **Course Card Details**
  - Course code and name announced
  - Unread count announced: "3 new questions"
  - Link/button role announced

- [ ] **Empty State**
  - Status message announced via aria-live
  - "You are not enrolled in any courses"

- [ ] **Loading State**
  - Loading message announced
  - aria-busy state communicated

### Visual/Focus Testing

- [ ] **Focus Indicators Visible**
  - Courses button: secondary/60 ring
  - Course cards: accent/60 ring
  - Close button: accent/60 ring
  - All rings: 4px width, 2px offset

- [ ] **Focus Indicator Contrast**
  - Minimum 3:1 against adjacent colors
  - Verify with Color Contrast Analyzer
  - Test against glass backgrounds

- [ ] **No Lost Focus**
  - Focus always visible during navigation
  - Focus never unexpectedly reset
  - Focus never on non-interactive elements

### Touch Target Testing (Mobile)

- [ ] **Courses Button**
  - Minimum 44x44px (verify with inspector)
  - Easy to tap on small screens

- [ ] **Close Button**
  - Minimum 44x44px
  - Easy to tap in top-right corner

- [ ] **Course Cards**
  - Minimum 64px height (exceeds requirement)
  - Easy to tap without hitting adjacent cards

- [ ] **Unread Badges**
  - Minimum 44px width for readability
  - Not independently tappable (decorative)

### Color Contrast Testing

- [ ] **Courses Button Text**
  - "Courses" label: text-secondary vs glass background
  - Minimum 4.5:1 (small text)

- [ ] **Courses Button Focus Ring**
  - ring-secondary/60 vs glass background
  - Minimum 3:1 (UI component)

- [ ] **Modal Text**
  - DialogTitle: default foreground (guaranteed AA)
  - DialogDescription: muted foreground (guaranteed AA)
  - Course code: text-primary (verified in existing cards)
  - Course name: text-muted-foreground (verified)

- [ ] **Unread Badge**
  - text-warning on bg-warning/15 background
  - Minimum 4.5:1 (small text)
  - **ACTION REQUIRED**: Manually verify with Color Contrast Analyzer

- [ ] **Course Card Focus Ring**
  - ring-accent/60 vs modal background
  - Minimum 3:1
  - **ACTION REQUIRED**: Manually verify

### Reduced Motion Testing

- [ ] **Respect User Preference**
  - Set prefers-reduced-motion: reduce
  - Verify modal animations disabled/minimized
  - Verify hover scale animations disabled
  - Verify glow effects disabled

- [ ] **Functionality Preserved**
  - All interactions still work
  - No functionality depends on animation

### Loading State Testing

- [ ] **Loading Announcement**
  - "Loading your courses..." announced via aria-live
  - aria-busy="true" communicated to screen reader

- [ ] **Skeleton UI**
  - Skeletons visible while loading
  - Proper structure maintained

### Empty State Testing

- [ ] **Empty State Announcement**
  - Status message announced via aria-live
  - Message clear and actionable

- [ ] **Visual Empty State**
  - Icon, title, description visible
  - Proper semantic structure

### Cross-Browser/Platform Testing

- [ ] **iOS Safari + VoiceOver**
  - All keyboard navigation works
  - All announcements correct
  - Touch targets adequate

- [ ] **Chrome + Desktop**
  - Keyboard navigation works
  - Focus indicators visible

- [ ] **Firefox + NVDA (Windows)**
  - Screen reader announcements
  - Keyboard navigation

- [ ] **Android Chrome + TalkBack**
  - Touch targets adequate
  - Announcements correct

---

## Contrast Verification Tasks

### Manual Testing Required

**Tool**: Color Contrast Analyzer (desktop app)

**Test 1: Courses Button Focus Ring**
- Foreground: `rgb(94, 125, 74)` at 60% opacity = `rgba(94, 125, 74, 0.6)`
- Background: Glass panel (varies by theme and backdrop)
- Required ratio: 3:1
- **Action**: Screenshot button with focus ring, measure with CCA
- **Expected**: Pass (estimated ~3.8:1)

**Test 2: Unread Badge Text**
- Foreground: `--warning` color (#B45309)
- Background: `bg-warning/15` = rgba(180, 83, 9, 0.15) over glass
- Required ratio: 4.5:1 (12px text)
- **Action**: Screenshot badge, measure with CCA
- **Expected**: May need adjustment to bg-warning/20 or darker text

**Test 3: Course Card Focus Ring**
- Foreground: `rgb(45, 108, 223)` at 60% opacity = `rgba(45, 108, 223, 0.6)`
- Background: Modal background (glass-panel-strong)
- Required ratio: 3:1
- **Action**: Screenshot focused card, measure with CCA
- **Expected**: Pass (accent color typically high contrast)

**Fallback Plan if Contrast Fails:**

If secondary/60 focus ring fails 3:1:
```tsx
// Increase opacity to 80%
"focus-visible:ring-secondary/80"
// Or use solid color
"focus-visible:ring-secondary"
```

If warning badge fails 4.5:1:
```tsx
// Darken background
"bg-warning/20"
// Or use darker text variant
"text-warning-700"
```

---

## Rollback Plan

If accessibility issues are discovered after implementation:

### Minor Issues (Color Contrast)
1. Adjust opacity values (60% → 80%)
2. Adjust background opacity (15% → 20%)
3. Test again with CCA
4. Commit fix with "fix(a11y): adjust contrast for WCAG AA compliance"

### Major Issues (Focus Trap Broken)
1. Verify Radix Dialog version (should be latest)
2. Check for conflicting z-index or pointer-events CSS
3. Review DialogContent className overrides
4. Test in isolation (minimal modal without content)
5. File issue with Radix if primitive is broken

### Critical Issues (Screen Reader Unusable)
1. Revert CourseSelectionModal component
2. Revert Courses button in mobile-bottom-nav
3. Keep Ask Question button visible in all contexts (temporary)
4. Schedule accessibility expert review
5. Re-plan implementation with additional testing

---

## Success Criteria

### Minimum Viable (WCAG AA)
- [ ] All interactive elements keyboard accessible
- [ ] All text meets 4.5:1 contrast (3:1 for large text)
- [ ] All UI components meet 3:1 contrast
- [ ] Focus indicators visible throughout
- [ ] Screen reader announces all content correctly
- [ ] No keyboard traps
- [ ] Modal role and ARIA attributes correct

### Target (WCAG AAA Touch Targets)
- [ ] All touch targets minimum 44x44px
- [ ] Adequate spacing between targets (8px+)
- [ ] Modal close button 44x44px

### Ideal (WCAG AAA + Enhanced UX)
- [ ] Reduced motion support complete
- [ ] Loading states announced
- [ ] Empty states announced
- [ ] List semantics with position announcements
- [ ] Tested with 3+ screen readers

---

## Timeline Estimate

**High Priority Implementations**: 4-6 hours
- Mobile bottom nav changes: 1 hour
- CourseSelectionModal component: 2-3 hours
- NavHeader state management: 30 minutes
- Dialog close button fix: 30 minutes
- Testing: 1-2 hours

**Medium Priority Implementations**: 1-2 hours
- Empty state enhancements: 30 minutes
- Loading state aria-live: 30 minutes
- Contrast verification and fixes: 30-60 minutes

**Total Estimated Effort**: 5-8 hours (including testing)

---

## Dependencies

1. **Radix UI Dialog**: Already installed (verified in dialog.tsx)
2. **React Query**: Already installed (for dashboard data)
3. **useReducedMotion hook**: Verify exists or create
4. **Color Contrast Analyzer**: Download desktop app for manual testing
5. **Screen reader access**: VoiceOver (macOS built-in) + NVDA (free download)

---

## Post-Implementation Validation

### Automated Tools
1. Run axe DevTools on dashboard with modal open
2. Run Lighthouse accessibility audit
3. Verify 0 critical/serious violations
4. Verify accessibility score ≥95

### Manual Validation
1. Complete all items in Testing Checklist above
2. Manually verify all contrast measurements
3. Test with real screen reader users if possible
4. Document any remaining issues for future sprints

### Documentation
1. Update context.md with accessibility decisions
2. Add comments to code explaining ARIA strategy
3. Create demo video showing keyboard navigation
4. Update README with accessibility features

---

**Plan Created**: 2025-10-14
**Author**: Accessibility Validator Agent
**Target Compliance**: WCAG 2.2 Level AA (AAA for touch targets)
**Estimated Effort**: 5-8 hours including testing

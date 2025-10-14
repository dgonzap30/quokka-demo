# Component Patterns Research: CourseSelectionModal & MobileBottomNav

**Date:** 2025-10-14
**Task:** Course Navigation Modal for Mobile Bottom Nav
**Objective:** Research existing patterns for modal implementation and course card design

---

## 1. Existing Modal Patterns

### 1.1 Dialog Component (Radix UI)

**Location:** `components/ui/dialog.tsx`

**Key Features:**
- Built on `@radix-ui/react-dialog` (automatic accessibility)
- Provides: Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
- Automatic backdrop overlay with fade animations
- Automatic body scroll lock when open
- Escape key and backdrop click to close
- Optional close button (X icon)
- `showCloseButton` prop (default: true)

**Standard Usage Pattern:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-[95vw] h-[95vh] glass-panel-strong">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Optional description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### 1.2 QuokkaAssistantModal Pattern

**Location:** `components/ai/quokka-assistant-modal.tsx`

**Key Characteristics:**
- Large viewport-based sizing: `max-w-[95vw] lg:max-w-7xl h-[95vh]`
- Glass styling: `glass-panel-strong`
- Zero padding on DialogContent: `p-0` (custom layout inside)
- Flex column layout with internal scrolling
- Controlled open state: `isOpen` + `onClose` callback
- Context-aware content rendering

**Props Interface:**
```typescript
interface QuokkaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: "dashboard" | "course" | "instructor";
  courseId?: string;
  courseName?: string;
  courseCode?: string;
}
```

### 1.3 ThreadModal Pattern

**Location:** `components/course/thread-modal.tsx`

**Key Characteristics:**
- Similar large sizing: `max-w-[95vw] lg:max-w-7xl h-[95vh]`
- Glass styling: `glass-panel-strong`
- `showCloseButton={false}` (custom close in child component)
- Screen-reader-only title: `<DialogHeader className="sr-only">`
- Internal scrolling wrapper: `sidebar-scroll` class
- Reuses ThreadDetailPanel component

**Props Interface:**
```typescript
interface ThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string | null;
  className?: string;
}
```

### 1.4 Support Page Modal Reference

**Location:** `app/support/page.tsx`

**Key Characteristics:**
- Uses Card components with `variant="glass"` or `variant="glass-strong"`
- Glass panel styling: `glass-panel backdrop-blur-md border border-glass shadow-[var(--shadow-glass-sm)]`
- Hover effects: `hover:scale-[1.02]` with `motion-reduce` fallback
- 44px minimum touch targets: `min-h-[44px]`
- Focus-visible rings: `focus-visible:ring-4 focus-visible:ring-accent/60`

---

## 2. MobileBottomNav Conditional Rendering Patterns

**Location:** `components/layout/mobile-bottom-nav.tsx`

### 2.1 Current Structure

**4-Item Grid Layout:**
1. Home (always visible)
2. Ask Question (conditional - only in course context)
3. AI Assistant (always visible)
4. Support (always visible)

**Current Props Interface:**
```typescript
interface MobileBottomNavProps {
  currentPath: string;
  onNavigateHome: () => void;
  onAskQuestion?: () => void;        // Optional - shows button if provided
  onOpenAIAssistant?: () => void;    // Optional - shows button if provided
  onOpenSupport: () => void;
}
```

### 2.2 Conditional Rendering Pattern

**Current Implementation:**
```tsx
{onAskQuestion && (
  <button onClick={onAskQuestion}>
    {/* Ask Question button */}
  </button>
)}
```

**Key Observations:**
- Uses optional props + conditional rendering
- Button only renders if handler is provided
- Grid layout remains 4-column regardless (empty cells when handlers absent)

### 2.3 Styling Patterns

**Glass Styling:**
- Container: `glass-panel-strong backdrop-blur-xl border-t border-glass shadow-[var(--shadow-glass-lg)]`
- Fixed positioning: `fixed bottom-0 left-0 right-0 z-40`
- Safe area support: `safe-bottom` class on grid

**Button Styling:**
- Min height: `min-h-[44px]` (WCAG 2.5.5 touch target)
- Padding: `py-2 px-3`
- Transitions: `transition-all duration-300 ease-out`
- Hover: `hover:bg-{color}/5 active:bg-{color}/10`
- Focus: `focus-visible:ring-4 focus-visible:ring-{color}/60`
- Icon size: `h-6 w-6`
- Label size: `text-xs font-medium`

**Ask Button Amber Theme:**
```tsx
className={cn(
  "hover:bg-amber-50 dark:hover:bg-amber-950/20",
  "active:bg-amber-100 dark:active:bg-amber-950/30",
  "focus-visible:ring-4 focus-visible:ring-amber-600/60"
)}

// Icon with glow effect
className={cn(
  "h-6 w-6 text-amber-600/70",
  "[filter:drop-shadow(0_0_0.5px_rgba(245,158,11,0.3))]",
  "group-hover:text-amber-600",
  "group-hover:[filter:drop-shadow(0_0_2px_rgba(245,158,11,0.8))_drop-shadow(0_0_6px_rgba(245,158,11,0.4))]",
  "group-hover:scale-110"
)}
```

### 2.4 NavHeader State Management

**Location:** `components/layout/nav-header.tsx`

**Current State:**
- `inCourseContext`: Derived from `navContext.context === 'course' && course`
- Modal state: `const [aiModalOpen, setAiModalOpen] = useState(false)`
- Conditional prop passing: `onAskQuestion={inCourseContext ? handler : undefined}`

**Pattern to Follow:**
```tsx
// Add new state
const [coursesModalOpen, setCoursesModalOpen] = useState(false);

// Conditionally pass handler
<MobileBottomNav
  onAskQuestion={inCourseContext ? askHandler : undefined}
  onOpenCourses={!inCourseContext ? () => setCoursesModalOpen(true) : undefined}
/>
```

---

## 3. Course Card Design Patterns

**Location:** `components/dashboard/enhanced-course-card.tsx`

### 3.1 EnhancedCourseCard Component

**Props Interface:**
```typescript
interface EnhancedCourseCardProps {
  course: CourseWithActivity | CourseWithMetrics;
  viewMode: "student" | "instructor";
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}
```

**Key Features:**
- Link wrapper: `<Link href={`/courses/${course.id}`}>`
- Glass styling: `variant="glass-hover"` with `hover:scale-[1.03]`
- Reduced motion support: `useReducedMotion()` hook
- Fixed height: `min-h-56`
- Icon in colored background: `bg-primary/10`
- Course code as title (large): `text-xl glass-text text-primary`
- Course name as description: `text-sm line-clamp-2`
- Metrics grid: `grid grid-cols-2 gap-2 text-center`

### 3.2 Card Structure

```tsx
<article>
  <Card variant="glass-hover" className="group min-h-56 flex flex-col">
    <CardHeader className="p-4 max-h-[100px] shrink-0">
      {/* Icon + Title + Description */}
    </CardHeader>

    <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-center">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Questions</p>
          <p className="text-lg font-semibold tabular-nums">{count}</p>
        </div>
        {/* More metrics */}
      </div>
    </CardContent>
  </Card>
</article>
```

### 3.3 Student vs Instructor Views

**Student View Metrics:**
- Questions count: `course.recentThreads?.length`
- New/unread count: `course.unreadCount` (warning color)

**Instructor View Metrics:**
- Total threads: `metrics.threadCount`
- Unanswered: `metrics.unansweredCount` (warning color)
- Active students: `metrics.activeStudents`
- This week activity: `metrics.recentActivity`

---

## 4. Data Flow Analysis

### 4.1 Dashboard Data Source

**Location:** `app/dashboard/page.tsx`

**Student Dashboard:**
```tsx
const { data: studentData } = useStudentDashboard(user.id);

// studentData.enrolledCourses: CourseWithActivity[]
// - course.id, course.code, course.name, course.term
// - course.recentThreads, course.unreadCount
```

**Hook Location:** `lib/api/hooks.ts`
```tsx
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: ["studentDashboard", userId],
    queryFn: () => api.getStudentDashboard(userId!),
    enabled: !!userId,
  });
}
```

### 4.2 NavHeader Access to Course Data

**Current:**
```tsx
// NavHeader already fetches dashboard data
const { data: dashboardData } = useStudentDashboard(user?.id || '');

// Used for Quokka Points display
quokkaPoints={dashboardData?.quokkaPoints}
```

**Available for Modal:**
- `dashboardData.enrolledCourses` is already fetched
- Type: `CourseWithActivity[]`
- Contains: id, code, name, term, recentThreads, unreadCount

---

## 5. Icon Selection for Courses Button

**Task Requirement:** "Courses button uses BookOpen icon with secondary (green) color theme"

**BookOpen Icon:**
- From `lucide-react` (already used in EnhancedCourseCard)
- Semantic meaning: course content, educational material
- Size: `h-6 w-6` (consistent with other nav icons)

**Secondary (Green) Color Theme:**
- Primary color: `text-secondary` (#5E7D4A - Rottnest Olive)
- Hover: `text-secondary-hover` (#556B3B)
- Background: `bg-secondary/10`
- Glow effect (optional): `[filter:drop-shadow(...)]` with secondary color

**Styling Pattern (based on Ask button):**
```tsx
className={cn(
  "hover:bg-secondary/5 dark:hover:bg-secondary/20",
  "active:bg-secondary/10 dark:active:bg-secondary/30",
  "focus-visible:ring-4 focus-visible:ring-secondary/60"
)}

// Icon
className={cn(
  "h-6 w-6 text-secondary/70",
  "group-hover:text-secondary",
  "group-hover:scale-110"
)}
```

---

## 6. Accessibility Patterns

### 6.1 Dialog Accessibility (Automatic from Radix)

- **Focus trap**: Traps keyboard focus inside modal when open
- **Escape key**: Closes modal
- **Backdrop click**: Closes modal
- **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Screen reader announcements**: Title announced on open

### 6.2 Additional Requirements

**Course Cards:**
- Use `<article>` with `aria-labelledby` pointing to course code
- Interactive cards wrapped in `<Link>` (keyboard navigable)
- `role="list"` and `role="listitem"` for metrics grid

**Modal Content:**
- `<DialogTitle>` for modal heading (required for a11y)
- Optional `<DialogDescription>` for context
- Empty state if no courses enrolled

**Focus Management:**
- Restore focus to trigger button on close
- First focusable element receives focus on open (handled by Radix)

---

## 7. Responsive Design Considerations

### 7.1 Modal Sizing

**Mobile First:**
- Width: `max-w-[95vw]` (5vw margin on each side)
- Height: Auto-height based on content (not `h-[95vh]`)
- Max height: `max-h-[80vh]` to prevent overflow
- Padding: `p-6` (24px) for comfortable touch targets
- Internal scrolling if content exceeds max height

**Breakpoints:**
- `sm:max-w-md` (28rem / 448px) - Small tablets
- `md:max-w-lg` (32rem / 512px) - Tablets

### 7.2 Course Card Layout in Modal

**Grid System:**
- Mobile: `grid grid-cols-1 gap-4` (single column)
- Tablet: `sm:grid-cols-2 gap-4` (two columns)
- Desktop: Not needed (modal intended for mobile context)

**Card Size:**
- Similar to EnhancedCourseCard: `min-h-[120px]`
- Compact metrics: Show only 2 metrics (Questions + New)
- Tappable area: Entire card is interactive

### 7.3 Touch Target Compliance

- Modal close button: 44x44px minimum
- Course cards: Full card height ≥44px
- Backdrop: Full screen tappable (auto from Dialog)

---

## 8. Performance Considerations

### 8.1 Data Loading

**Existing Data:**
- `dashboardData.enrolledCourses` already loaded in NavHeader
- No additional fetch required for modal
- Instant modal open (no loading spinner needed)

**Empty State:**
- Handle `enrolledCourses.length === 0` with EmptyState component
- Message: "No Courses Enrolled" + helpful text

### 8.2 Modal Rendering

- Lazy render: Only render when `open === true`
- Unmount on close: `onOpenChange` sets state to `false`
- No virtualization needed (typical course count < 10)

### 8.3 Animation Performance

- Glass blur: Reduced on mobile (`@media (max-width: 767px)`)
- Scale transitions: `motion-reduce` fallback
- Backdrop: Fade animation (lightweight)

---

## 9. QDS Compliance Checklist

### 9.1 Glass Styling

- **Modal:** `glass-panel-strong` + `backdrop-blur-xl`
- **Course Cards:** `glass-panel` or `variant="glass"`
- **Border:** `border border-glass`
- **Shadow:** `shadow-[var(--shadow-glass-md)]`

### 9.2 Color Tokens

- **Courses Button:** `text-secondary`, `bg-secondary/10`, `hover:bg-secondary/20`
- **Text:** `text-foreground`, `text-muted-foreground`
- **Background:** `bg-background` (automatic from Dialog)

### 9.3 Spacing & Radius

- **Modal Padding:** `p-6` (24px - QDS comfortable spacing)
- **Grid Gap:** `gap-4` (16px - QDS standard gap)
- **Border Radius:** `rounded-xl` (--radius-xl: 20px)

### 9.4 Typography

- **Modal Title:** `text-2xl font-bold glass-text`
- **Course Code:** `text-lg font-semibold glass-text`
- **Course Name:** `text-sm text-muted-foreground glass-text`

---

## 10. Key Findings & Recommendations

### 10.1 Modal Component Strategy

**Recommendation:** Create small, focused CourseSelectionModal
- Reuse Dialog primitives from `components/ui/dialog.tsx`
- Follow QuokkaAssistantModal sizing pattern
- Use glass-panel-strong styling
- Keep simple: title + course list + close button

### 10.2 MobileBottomNav Updates

**Recommendation:** Add `onOpenCourses` optional prop
- Mirrors existing `onAskQuestion` pattern
- Conditional rendering: Show Courses OR Ask (never both)
- Use secondary (green) color theme for Courses button
- BookOpen icon (already imported in other components)

### 10.3 Course Card Design for Modal

**Recommendation:** Simplified version of EnhancedCourseCard
- No need for separate component (inline in modal)
- Show: Course code, name, term
- Show metrics: Questions count + New count
- Full card is Link to `/courses/{id}`
- Min height: 120px for comfortable tapping

### 10.4 State Management in NavHeader

**Recommendation:** Single useState in NavHeader
- `const [coursesModalOpen, setCoursesModalOpen] = useState(false)`
- Pass handler to MobileBottomNav: `onOpenCourses={() => setCoursesModalOpen(true)}`
- Pass `dashboardData.enrolledCourses` to modal
- Modal closes on course selection (handled by navigation)

---

## 11. Related Files

**Files to Create:**
- `components/course/course-selection-modal.tsx` (new)

**Files to Modify:**
- `components/layout/mobile-bottom-nav.tsx` (add Courses button)
- `components/layout/nav-header.tsx` (add modal state + handler)

**Files to Reference:**
- `components/ui/dialog.tsx` (Dialog primitives)
- `components/ai/quokka-assistant-modal.tsx` (large modal pattern)
- `components/dashboard/enhanced-course-card.tsx` (course card design)
- `components/ui/card.tsx` (Card component with glass variants)
- `lib/models/types.ts` (CourseWithActivity type)

---

## 12. Open Questions

1. **Should modal auto-close on course selection?**
   - Answer: Yes - navigation will unmount the modal automatically

2. **What if user has no enrolled courses?**
   - Answer: Show EmptyState with helpful message

3. **Should we show AI badge on course cards in modal?**
   - Answer: No - keep modal minimal. Focus on navigation.

4. **Should modal be full-screen on mobile?**
   - Answer: No - centered modal with backdrop (better UX than full-screen takeover)

5. **Should we animate course list entry?**
   - Answer: No - keep animations minimal for performance + reduced motion support

---

**End of Research Document**

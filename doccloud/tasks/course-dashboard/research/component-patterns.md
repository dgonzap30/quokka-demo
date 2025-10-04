# Component Pattern Research - Course Dashboard

**Date:** 2025-10-04
**Agent:** Component Architect
**Scope:** Analyze existing component patterns for course dashboard design

---

## Existing Component Survey

### 1. ThreadCard Component Analysis

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/thread-card.tsx`

**Key Patterns Identified:**

- **Props-Driven Design:** All data passed via `thread` prop (no hardcoded values)
- **Link Wrapper:** Uses Next.js `<Link>` to wrap entire card for navigation
- **shadcn/ui Primitives:** Leverages Card, Badge, Avatar from ui library
- **Status Variant System:** Local config object maps status to badge variant
- **Conditional Badges:** AI Answer, Endorsed badges conditionally rendered
- **Responsive Metadata:** Views, posts, author displayed with icons
- **Hover Effects:** `variant="hover"` on Card for elevation + translation
- **Icon Usage:** Lucide icons (MessageSquare, Eye, Award, Sparkles)
- **Text Truncation:** `line-clamp-2` for title and description
- **QDS Compliance:** Uses QDS shadows (`shadow-e2`), borders, colors

**Props Interface:**
```typescript
interface ThreadCardProps {
  thread: Thread;
  linkPrefix?: string;  // Customizable link path
}
```

**Component Size:** 90 lines (well under 200 LoC limit)

**Reusability:** Used on home page AND instructor dashboard (via `linkPrefix`)

**Key Takeaway:** CourseCard should follow this exact pattern - props-driven, linkable, badge-based status, hover effects.

---

### 2. Instructor Dashboard Layout

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/instructor/page.tsx`

**Key Patterns Identified:**

- **Metrics Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive layout
- **Metric Card Pattern:**
  - Border-left accent color (4px) for status indication
  - Icon in colored circle background
  - Large number (text-2xl font-bold)
  - Small description text
  - Hover shadow effect
- **Loading States:** Skeleton components in map loop
- **Empty States:** Centered icon + heading + description
- **React Query Hooks:** Direct data fetching in page component
- **NavHeader Inclusion:** Standard header on every page

**Metric Card Structure:**
```tsx
<Card className="border-l-4 border-l-{color}">
  <CardHeader> // Icon + Title
  <CardContent> // Number + Description
```

**Colors Used:** warning, success, info, amber-500, danger, secondary (all QDS tokens)

**Grid Breakpoints:** 1 column mobile, 2 tablet, 3 desktop

**Key Takeaway:** CourseDashboardGrid should use similar responsive grid, CourseCard should support border-left accent for status.

---

### 3. shadcn/ui Card Primitive

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/card.tsx`

**Available Variants:**
- `default` - Standard card (p-6)
- `ai` - AI-themed gradient with border-left
- `hover` - Elevation + translation on hover (cursor-pointer)
- `elevated` - Pre-elevated shadow (p-8)

**Available Sub-Components:**
- `CardHeader` - Title + description grid
- `CardTitle` - Bold text
- `CardDescription` - Muted text
- `CardContent` - Main content area
- `CardFooter` - Bottom actions
- `CardAction` - Top-right action slot

**Key Features:**
- CVA (class-variance-authority) for variant management
- `cn()` utility for className composition
- Data slots for CSS targeting

**Key Takeaway:** CourseCard can extend these variants or use `hover` variant directly.

---

### 4. shadcn/ui Badge Primitive

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/badge.tsx`

**Available Variants:**
- `default` - Primary background
- `secondary` - Secondary background
- `destructive` - Danger/error state
- `outline` - Border only
- `ai` - Gradient AI badge
- `ai-outline` - AI outline style
- `ai-shimmer` - Animated shimmer

**Key Features:**
- Icon support (size-3 icons with gap-1)
- AsChild pattern for composition
- Focus states and transitions
- Min height 24px for touch targets

**Key Takeaway:** NotificationBadge can extend Badge with custom variant for count display.

---

### 5. PostItem Component

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/post-item.tsx`

**Key Patterns Identified:**

- **Conditional Rendering:** Role-based button visibility
- **Mutation Hooks:** Direct mutation calls in handlers
- **Dialog Pattern:** AlertDialog for destructive actions
- **Toast Integration:** Success/error feedback via sonner
- **Avatar + Metadata:** Consistent user display pattern
- **Gradient Backgrounds:** Conditional l-border + gradient for endorsed/flagged
- **Button States:** Loading states via `isPending`

**Props Interface:**
```typescript
interface PostItemProps {
  post: Post;  // Single data object
}
```

**Component Size:** 206 lines (slightly over, but acceptable for complex interactions)

**Key Takeaway:** CourseCard should keep interactions simple (navigation only), complex actions in separate modal/dialog.

---

## shadcn/ui Primitives Available

### Core UI Components (Already Installed)

1. **Card** - Base layout primitive
2. **Badge** - Status indicators
3. **Avatar** - User profile images
4. **Button** - Interactive elements
5. **Skeleton** - Loading states
6. **Dialog** - Modals
7. **AlertDialog** - Confirmations
8. **DropdownMenu** - Action menus
9. **ScrollArea** - Scrollable content
10. **Separator** - Dividers
11. **Input/Textarea/Select** - Forms

### NOT Installed (Would Need to Add)
- Progress
- Tooltip
- Popover
- Tabs
- Accordion

**Key Takeaway:** Use existing primitives only - avoid installing new components unless absolutely necessary.

---

## QDS Token Usage Patterns

### Color Tokens (From globals.css)

**Primary Colors:**
- `primary` / `primary-hover` / `primary-pressed`
- `secondary` / `secondary-hover` / `secondary-pressed`
- `accent` / `accent-hover` / `accent-pressed`

**Support Colors:**
- `success` - Green for positive states
- `warning` - Orange for attention
- `danger` - Red for errors/critical
- `info` - Blue for informational

**Neutrals:**
- `neutral-50` through `neutral-950` (11 shades)
- `muted` / `muted-foreground`
- `border` / `card` / `background`

**AI Colors:**
- `ai-purple-50` through `ai-purple-900`
- `ai-indigo-{shade}` / `ai-cyan-{shade}`

### Spacing Scale (4pt Grid)

**Used in ThreadCard:**
- `gap-1` (4px), `gap-2` (8px), `gap-4` (16px)
- `pb-4`, `pt-3`, `px-6`
- `space-y-2.5` (10px - between grid points)

### Border Radius Scale

**Used in ThreadCard:**
- `rounded-xl` (card borders)
- `rounded-lg` (metric cards, badges)
- `rounded-md` (smaller elements)
- `rounded-full` (avatars, icon containers)

### Shadow Scale

**Used in ThreadCard:**
- `shadow-sm` (subtle)
- `shadow-e1` (elevation 1)
- `shadow-e2` (elevation 2 - hover state)
- `shadow-e3` (elevation 3 - elevated card)
- `shadow-ai-sm` / `shadow-ai-md` (AI-specific)

**Key Takeaway:** All course components MUST use these tokens - zero hardcoded values.

---

## Composition Opportunities

### 1. CourseCard Composition with ThreadCard

**Similarity:** Both are clickable cards navigating to detail views

**Differences:**
- CourseCard navigates to course threads list
- ThreadCard navigates to single thread detail
- CourseCard needs course-level metrics (not thread-level)

**Shared Components:**
- Badge (for status)
- Avatar (for instructor avatars)
- Card primitive (with hover variant)
- Icon + count patterns

**Decision:** CourseCard follows ThreadCard pattern but NOT composed from it (separate concerns).

---

### 2. NotificationBadge Composition with Badge

**Use Cases:**
- Course card notification count
- Navigation header notification indicator
- Per-thread notification badge

**Design Options:**

**Option A:** Extend Badge with count prop
```tsx
<Badge variant="notification" count={5} />
```

**Option B:** Separate NotificationBadge component
```tsx
<NotificationBadge count={5} variant="primary" />
```

**Decision:** Option B - separate component for better control over positioning (absolute/relative) and styling.

---

### 3. CourseMetricsBar Composition

**Contains:** Thread count, student count, activity indicators

**Design Options:**

**Option A:** Internal to CourseCard (not reusable)
```tsx
<CourseCard course={course} /> // includes metrics
```

**Option B:** Separate component (reusable)
```tsx
<CourseCard course={course}>
  <CourseMetricsBar metrics={metrics} />
</CourseCard>
```

**Decision:** Option A - metrics always paired with course, no need for separate reuse.

---

### 4. CourseInsightsPanel Composition

**Displays:** AI summary, top questions, trending topics

**Design Options:**

**Option A:** Standalone panel (sidebar or modal)
**Option B:** Embedded in course detail page
**Option C:** Expandable section in CourseCard

**Decision:** Option B - dedicated panel on course detail page (not in card - too much content).

---

## Component Size Guidelines

### Current Components

| Component | Lines | Status |
|-----------|-------|--------|
| ThreadCard | 90 | ✅ Excellent |
| PostItem | 206 | ⚠️ Slightly over (acceptable for interactions) |
| InstructorPage | 181 | ✅ Good (page component) |
| NavHeader | ~150 | ✅ Good |

### Target Sizes for New Components

| Component | Target LoC | Rationale |
|-----------|-----------|-----------|
| CourseCard | <150 | Similar to ThreadCard |
| CourseDashboardGrid | <80 | Simple layout component |
| NotificationBadge | <50 | Small reusable utility |
| CourseInsightsPanel | <180 | Complex content display |
| CourseMetricsBar | <60 | Icon + number grid |

**Key Takeaway:** If component exceeds 200 LoC, split into sub-components.

---

## Responsive Design Patterns

### Breakpoint Strategy (From InstructorPage)

```css
grid-cols-1           // Mobile (360px+)
md:grid-cols-2        // Tablet (768px+)
lg:grid-cols-3        // Desktop (1024px+)
xl:grid-cols-4        // Large (1280px+) - if needed
```

### Mobile Considerations

- Touch targets ≥44px (badge min-height: 24px, add padding)
- Stack metrics vertically on mobile
- Hide less critical info on small screens
- Use bottom navigation (already implemented)

### Tablet/Desktop Enhancements

- Side-by-side course cards
- Inline insights panel
- Expanded metrics view
- Hover states (not on mobile)

**Key Takeaway:** Mobile-first design, progressive enhancement for larger screens.

---

## Navigation Flow

### Current Navigation Structure

```
NavHeader
├── Home (/) - All threads
├── Ask (/ask) - New question form
└── Instructor (/instructor) - Dashboard

Proposed Addition:
├── Courses (/courses) - Course dashboard ← NEW
    └── /courses/[id] - Course-specific threads ← NEW
        └── /threads/[id] - Thread detail (existing)
```

### Link Strategy

**CourseCard Navigation:**
```tsx
<Link href={`/courses/${course.id}`}>
  <CourseCard course={course} />
</Link>
```

**Course Page to Threads:**
- Filters existing ThreadCard components by courseId
- Uses existing ThreadCard with `linkPrefix="/threads"`

**Breadcrumb Pattern:**
- Courses → Course Name → Thread Title → Post

**Key Takeaway:** Minimal routing changes, leverage existing thread pages.

---

## State Management Strategy

### Server State (React Query)

**Queries:**
- `useCourses()` - All courses (10 min stale time)
- `useUserCourses(userId)` - User enrollments (5 min)
- `useCourseThreads(courseId)` - Course threads (default)
- `useNotifications(userId, courseId?)` - Activity (30 sec, polling)
- `useCourseMetrics(courseId)` - Metrics (1 min)
- `useCourseInsights(courseId)` - AI insights (5 min)

**Mutations:**
- `useMarkNotificationRead()` - Single notification
- `useMarkAllNotificationsRead()` - Batch clear

### Local UI State

**CourseDashboardGrid:**
- Filter selection (local useState)
- Sort order (local useState)
- Grid vs list view (local useState)

**NotificationBadge:**
- No state (purely presentational)

**CourseCard:**
- Hover state (CSS only, no JS)
- No internal state

**CourseInsightsPanel:**
- Expanded/collapsed sections (local useState)

**Key Takeaway:** Minimal local state, server state via React Query, no global state needed.

---

## Performance Considerations

### Render Optimization

**CourseDashboardGrid:**
- Map over courses (1-10 items, no virtualization needed)
- Memoize filter/sort logic with `useMemo`

**CourseCard:**
- Pure component (no state changes)
- Consider `React.memo` if >20 courses

**NotificationBadge:**
- Pure presentational (zero optimization needed)

**CourseInsightsPanel:**
- Expensive AI insights - stale time 5 min
- Memoize top questions rendering

### Bundle Size

**Estimated Additions:**
- CourseCard: ~2KB
- CourseDashboardGrid: ~1KB
- NotificationBadge: ~0.5KB
- CourseInsightsPanel: ~3KB
- **Total:** ~6.5KB (well under 200KB route limit)

**Key Takeaway:** No performance concerns, standard React Query caching sufficient.

---

## Accessibility Requirements

### Keyboard Navigation

**CourseCard:**
- Entire card is focusable link (keyboard accessible)
- Focus ring visible (QDS focus-visible styles)
- Enter/Space to navigate

**NotificationBadge:**
- Decorative only (aria-hidden if no action)
- If clickable, needs accessible label

**CourseDashboardGrid:**
- Grid navigation via Tab key
- Arrow key navigation NOT needed (standard flow)

### Screen Reader Announcements

**CourseCard:**
```tsx
<Link href={...} aria-label={`${course.code}: ${course.name}, ${unreadCount} unread notifications`}>
```

**NotificationBadge:**
```tsx
<span aria-label={`${count} unread notifications`} role="status">
  {count}
</span>
```

**CourseInsightsPanel:**
- Use semantic headings (h2, h3)
- ARIA labels for AI-generated content
- Live region for dynamic updates

### Color Contrast

**QDS Compliance:**
- All text meets 4.5:1 minimum
- Badge backgrounds have sufficient contrast
- Border-left accents don't rely on color alone (text labels required)

**Key Takeaway:** WCAG 2.2 AA compliance mandatory, test with axe DevTools.

---

## Integration Points with Existing Code

### 1. NavHeader Integration

**Add Course Link:**
```tsx
// In nav-header.tsx
<Link href="/courses" className={navLinkClasses}>
  <BookOpen className="h-5 w-5" />
  <span>Courses</span>
  {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
</Link>
```

### 2. Thread Detail Page Integration

**Add Course Breadcrumb:**
```tsx
// In app/threads/[id]/page.tsx
<Breadcrumb>
  <BreadcrumbItem href="/courses">Courses</BreadcrumbItem>
  <BreadcrumbItem href={`/courses/${thread.courseId}`}>{course.code}</BreadcrumbItem>
  <BreadcrumbItem>{thread.title}</BreadcrumbItem>
</Breadcrumb>
```

### 3. Home Page Integration (Optional)

**Add Course Filter:**
```tsx
// In app/page.tsx
<Select onValueChange={setCourseFilter}>
  <SelectTrigger>All Courses</SelectTrigger>
  <SelectContent>
    {courses.map(c => <SelectItem value={c.id}>{c.code}</SelectItem>)}
  </SelectContent>
</Select>
```

**Key Takeaway:** Minimal changes to existing pages, mostly additive.

---

## Testing Scenarios

### 1. CourseCard Component

**Render Tests:**
- [ ] Displays course code, name, term correctly
- [ ] Shows notification badge if unread > 0
- [ ] Hides notification badge if unread = 0
- [ ] Displays correct metrics (threads, students)
- [ ] Applies hover effect on mouse over
- [ ] Shows instructor avatars (max 3)

**Navigation Tests:**
- [ ] Clicking card navigates to `/courses/{id}`
- [ ] Keyboard Enter navigates correctly
- [ ] Focus ring visible on tab focus

**Responsive Tests:**
- [ ] Stacks on mobile (360px)
- [ ] 2-column grid on tablet (768px)
- [ ] 3-column grid on desktop (1024px)

### 2. NotificationBadge Component

**Render Tests:**
- [ ] Displays count correctly (1-99)
- [ ] Shows "99+" for count ≥100
- [ ] Uses correct variant colors
- [ ] Positions absolutely when needed
- [ ] Hides when count = 0

### 3. CourseDashboardGrid Component

**Data Tests:**
- [ ] Displays all enrolled courses
- [ ] Filters by term correctly
- [ ] Sorts by code/name/activity
- [ ] Shows empty state for 0 courses
- [ ] Shows loading skeletons

**Interaction Tests:**
- [ ] Filter dropdown changes display
- [ ] Sort order toggle works
- [ ] Grid/list view switch (if implemented)

### 4. CourseInsightsPanel Component

**Render Tests:**
- [ ] Shows AI summary text
- [ ] Lists top 5 questions
- [ ] Displays trending topics
- [ ] Shows generation timestamp
- [ ] Handles loading state (skeleton)

**Content Tests:**
- [ ] Summary max 200 characters
- [ ] Top questions are clickable links
- [ ] Trending topics badge-styled
- [ ] No data state handled

### 5. Integration Tests

**Navigation Flow:**
- [ ] Dashboard → Course → Threads → Thread Detail
- [ ] Breadcrumbs work backward
- [ ] Back button maintains state

**Notification Flow:**
- [ ] New thread creates notification
- [ ] Clicking notification marks as read
- [ ] Badge count updates reactively
- [ ] "Mark all read" clears badge

**Multi-Course:**
- [ ] User with 1 course sees grid
- [ ] User with 10 courses sees grid
- [ ] User with 0 courses sees empty state

---

## Design Patterns to Follow

### 1. Props-Driven Components (CRITICAL)

**Bad Example (Hardcoded):**
```tsx
function CourseCard() {
  return <div>CS101: Intro to CS</div>; // ❌ NEVER
}
```

**Good Example (Props-Driven):**
```tsx
interface CourseCardProps {
  course: Course;
  notificationCount?: number;
  onClick?: () => void;
}

function CourseCard({ course, notificationCount = 0, onClick }: CourseCardProps) {
  return <div onClick={onClick}>{course.code}: {course.name}</div>; // ✅ CORRECT
}
```

### 2. Variant Systems

**Use CVA for Variants:**
```tsx
const courseCardVariants = cva(
  "base-classes",
  {
    variants: {
      status: {
        active: "border-success",
        archived: "border-muted opacity-60",
      },
      priority: {
        high: "ring-2 ring-warning",
        normal: "",
      }
    }
  }
);
```

### 3. Composition over Props

**Prefer Children Composition:**
```tsx
// Good: Flexible
<CourseCard course={course}>
  <CourseMetrics metrics={metrics} />
  <NotificationBadge count={5} />
</CourseCard>

// vs. Rigid:
<CourseCard course={course} metrics={metrics} notificationCount={5} />
```

### 4. TypeScript Strict Mode

**Always Export Interfaces:**
```tsx
export interface CourseCardProps {
  course: Course;
  className?: string;
  onNotificationClick?: (course: Course) => void;
}
```

**Use import type:**
```tsx
import type { Course, CourseMetrics } from "@/lib/models/types";
```

---

## Files Summary

### Analyzed Files

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/thread-card.tsx` - Card pattern reference
2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/instructor/page.tsx` - Dashboard layout reference
3. `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/card.tsx` - Primitive variants
4. `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/badge.tsx` - Badge variants
5. `/Users/dgz/projects-professional/quokka/quokka-demo/components/post-item.tsx` - Interaction patterns
6. `/Users/dgz/projects-professional/quokka/quokka-demo/app/globals.css` - QDS tokens

### Patterns Extracted

- Props-driven design (ThreadCard)
- Responsive grid layout (InstructorPage)
- CVA variant system (Card, Badge)
- Conditional rendering (PostItem)
- React Query integration (InstructorPage)
- Loading states (Skeleton)
- Empty states (InstructorPage)
- Navigation patterns (Link wrapper)
- QDS token usage (all components)

---

## Key Decisions for Component Design

1. **Follow ThreadCard Pattern:** CourseCard uses same structure (Link wrapper, Card primitive, Badge system)
2. **Use Existing Primitives:** Card, Badge, Avatar, Skeleton (no new installations)
3. **Mobile-First Grid:** 1/2/3 column layout like InstructorPage metrics
4. **Separate NotificationBadge:** Small reusable component, not generic Badge extension
5. **Metrics Internal to Card:** CourseMetricsBar not separately reusable
6. **Insights as Dedicated Panel:** Not embedded in CourseCard (too complex)
7. **React Query for All Data:** No local data fetching, hooks only
8. **Zero Hardcoded Values:** All props-driven, QDS tokens only
9. **Accessibility First:** WCAG 2.2 AA compliance, keyboard nav, screen reader support
10. **Component Size Limits:** <200 LoC per component, split if larger

---

**Research Complete:** 2025-10-04
**Next Step:** Create component-design.md implementation plan

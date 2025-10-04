# Dashboard Component Patterns Research

**Date:** 2025-10-04
**Researcher:** Component Architect
**Task:** Auth & Role-Based Dashboard System

---

## Existing Codebase Patterns

### Current Page Structure

**Courses List (`/courses/page.tsx`)**
- ✅ Uses `Card` with variant="glass-hover" for course items
- ✅ Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
- ✅ Loading states with `Skeleton` component
- ✅ Empty states with centered Card + icon + message
- ✅ Auth redirect pattern: checks `useCurrentUser()` → redirects to `/login`
- ✅ Welcome message with user name personalization
- ✅ Hero section pattern: heading + description + CTA area

**Course Detail (`/courses/[courseId]/page.tsx`)**
- ✅ Breadcrumb navigation with accessibility attributes
- ✅ Course hero with flex layout (info left, CTA right)
- ✅ Thread list using Card with status badges
- ✅ Metadata display: views, date, tags in `text-subtle` color
- ✅ Empty state pattern reused with emoji + message
- ✅ Same loading skeleton pattern

**Navigation (`components/layout/nav-header.tsx`)**
- ✅ Role display in user dropdown menu
- ✅ Active route highlighting with `isActive()` helper
- ✅ Glass panel styling: `glass-panel-strong`
- ✅ User avatar with initials fallback
- ✅ Dropdown menu for user actions

### Key Patterns to Reuse

1. **Card Variants (shadcn/ui)**
   - `glass-hover` - Interactive cards with hover lift
   - `glass` - Static informational cards
   - `glass-strong` - Emphasized panels
   - `glass-liquid` - Enhanced liquid border effects

2. **Grid Layouts**
   - 3-column responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
   - 2-column split: `flex flex-col lg:flex-row gap-8`
   - Mobile-first approach with progressive enhancement

3. **Loading States**
   - `Skeleton` with `bg-glass-medium rounded-lg/xl`
   - Maintains layout structure while loading
   - Multiple skeletons for list items

4. **Empty States**
   - Centered Card with `p-16 text-center`
   - Icon/emoji + heading + description + optional CTA
   - Consistent spacing: `space-y-6` wrapper, `space-y-2` for text

5. **Typography Hierarchy**
   - Hero: `heading-2 glass-text` (h1)
   - Section: `heading-3 glass-text` (h2)
   - Descriptions: `text-lg md:text-xl text-muted-foreground leading-relaxed`
   - Metadata: `text-xs text-subtle`

### Available Shadcn/UI Components

**Layout Components:**
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- ✅ `Separator` - For dividing sections
- ✅ `ScrollArea` - For scrollable content regions

**Data Display:**
- ✅ `Badge` - Status indicators (has variants: default, secondary, outline, ai, ai-outline, ai-shimmer)
- ✅ `Avatar` - User avatars with fallback
- ✅ `Skeleton` - Loading placeholders

**Interactive:**
- ✅ `Button` - Multiple variants available
- ✅ `DropdownMenu` - User menus and actions
- ✅ `Dialog` - Modals (not used yet but available)
- ✅ `AlertDialog` - Confirmations

**Forms:**
- ✅ `Input` - Text inputs
- ✅ `Textarea` - Multi-line text
- ✅ `Select` - Dropdowns

---

## Data Requirements Analysis

### Student Dashboard Requirements

**Course Data (from `/courses` pattern)**
- ✅ Available via `useUserCourses(userId)` hook
- Fields: id, code, name, term, description, enrollmentCount, status

**Activity Feed Data**
- ❌ NOT available yet - needs new API endpoint
- Required fields:
  - Recent threads I created
  - New replies to my threads
  - Endorsed answers on my questions
  - Filter by time range (last 7 days, last 30 days)

**Notification Data**
- ✅ Available via `useNotifications(userId, courseId?)` hook
- Fields: id, type, content, read, createdAt, threadId, courseId
- Types: 'new_thread' | 'new_post' | 'endorsed' | 'resolved' | 'flagged'
- ✅ Supports polling (refetchInterval: 60s)

**Metrics Needed (Student View)**
- My total threads created
- My total replies posted
- Threads I'm following (engagement)
- Courses enrolled count (already available)

### Instructor Dashboard Requirements

**Course Management Data**
- ✅ Available via `useUserCourses(userId)` hook (same as student)
- Additional metrics per course from `useCourseMetrics(courseId)`:
  - threadCount, unansweredCount, answeredCount, resolvedCount
  - activeStudents, recentActivity

**Unanswered Queue Data**
- ✅ Unanswered threads available via filtering `useCourseThreads(courseId)`
- Filter threads where `status === 'open'`
- Sort by createdAt (oldest first for moderation priority)

**Insights Data**
- ✅ Available via `useCourseInsights(courseId)` hook
- Fields: summary, activeThreads, topQuestions[], trendingTopics[], generatedAt
- Stale time: 5 minutes (expensive AI operation)

**Metrics Needed (Instructor View)**
- Total threads across all courses
- Total unanswered threads
- Response time average
- Student engagement rate

---

## State Management Strategy

### Query Hooks (React Query)

**Existing hooks to leverage:**
```typescript
// User & Auth
useCurrentUser()              // 5min stale, 10min gc
useUserCourses(userId)        // 5min stale, 10min gc

// Course Data
useCourse(courseId)           // 10min stale, 15min gc
useCourseThreads(courseId)    // 2min stale, 5min gc
useCourseMetrics(courseId)    // 5min stale, 10min gc
useCourseInsights(courseId)   // 5min stale, 10min gc

// Notifications
useNotifications(userId, courseId?)  // 30s stale, refetch every 60s
useMarkNotificationRead()     // Mutation
useMarkAllNotificationsRead() // Mutation
```

**New hooks needed:**
```typescript
// Activity Feed (aggregated data)
useUserActivity(userId, options?)
  // Aggregates: threads, posts, endorsements
  // Filters: dateRange, courseId

// Dashboard Metrics (aggregated)
useStudentMetrics(userId)
  // Aggregates: threadCount, postCount, coursesCount

useInstructorMetrics(userId)
  // Aggregates: totalThreads, totalUnanswered, avgResponseTime
```

### Local State Needs

**Filter/View State (component-level)**
- Time range filter (7 days, 30 days, all time)
- Course filter (all courses, specific course)
- Notification filter (unread only, all)
- Sort preference (recent, oldest, most active)

**UI State (component-level)**
- Expanded/collapsed sections
- Active tab (if using tabs)
- Modal open/closed states

### Data Flow Pattern

```
Dashboard Page (Parent)
  ├── useCurrentUser() → determines student vs instructor
  ├── useUserCourses(user.id) → passes to CourseGrid
  └── Role-based rendering
       │
       ├── STUDENT:
       │   ├── <CourseGrid courses={...} role="student" />
       │   ├── <ActivityFeed userId={...} />
       │   └── <NotificationList userId={...} />
       │
       └── INSTRUCTOR:
           ├── <CourseGrid courses={...} role="instructor" />
           ├── <MetricsPanel userId={...} />
           ├── <UnansweredQueue courses={...} />
           └── <InsightsPanel courses={...} />
```

---

## Responsive Design Strategy

### Breakpoint Behavior

**Mobile (360-767px)**
- Single column layout
- Stacked sections with full width
- Course cards: 1 column
- Collapsible sections for better vertical scrolling
- Touch targets: minimum 44px (already in QDS)

**Tablet (768-1023px)**
- 2-column grid for course cards
- Side-by-side layout for metrics (2 columns)
- Activity feed remains full width
- Sticky header for navigation

**Desktop (1024-1279px)**
- 3-column grid for course cards
- Metrics in 3-4 column grid
- Sidebar layout option (activity feed on right)
- More horizontal space for data tables

**Large Desktop (1280px+)**
- Same as desktop but with max-width container
- Better use of whitespace
- `container-wide` utility (existing pattern)

### Grid Systems to Use

```css
/* Course Cards (reuse existing pattern) */
.course-grid {
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
}

/* Metrics Grid (new) */
.metrics-grid {
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
}

/* Dashboard Layout (new) */
.dashboard-layout {
  grid-cols-1 lg:grid-cols-[1fr_400px] gap-8
}
```

---

## Accessibility Considerations

### Semantic HTML

**Section Structure:**
```html
<main aria-label="Dashboard">
  <section aria-labelledby="courses-heading">
    <h2 id="courses-heading">My Courses</h2>
    <!-- courses grid -->
  </section>

  <section aria-labelledby="activity-heading">
    <h2 id="activity-heading">Recent Activity</h2>
    <!-- activity feed -->
  </section>
</main>
```

**Navigation:**
- Breadcrumbs with `aria-label="Breadcrumb"`
- Skip links for main content
- Focus management on route change

### ARIA Patterns

**Interactive Cards:**
- `role="article"` for course/thread cards
- `aria-label` for card links with full context
- `aria-current="page"` for active items

**Status Indicators:**
- Badge with `role="status"` for live updates
- `aria-live="polite"` for notification counts
- `aria-label` for icon-only buttons

**Metrics:**
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` for progress indicators
- `<abbr>` for abbreviated metrics with full text
- Sufficient color contrast for all states

### Keyboard Navigation

**Focus Order:**
- Logical tab order: header → filters → main content → sidebar
- Skip links to jump to sections
- Arrow key navigation for grid items (optional enhancement)

**Interactive Elements:**
- All clickable items have visible focus ring
- Enter/Space to activate buttons/links
- Escape to close modals/dropdowns

---

## Performance Considerations

### Render Optimization

**Memoization Opportunities:**
- Course card list (large arrays)
- Metric calculations (expensive aggregations)
- Date formatters (frequent calls)

**Code Splitting:**
- Lazy load instructor-specific components
- Route-based splitting already in place (Next.js)
- Dynamic import for charts/heavy visualizations

### Data Fetching Strategy

**Prefetching:**
- Prefetch course details on card hover
- Prefetch metrics when dashboard mounts
- Stale-while-revalidate for non-critical data

**Query Invalidation:**
- Invalidate metrics when thread created
- Invalidate activity feed on new post
- Smart invalidation to avoid over-fetching

**Pagination/Virtual Scrolling:**
- NOT needed for MVP (courses < 20, threads < 100)
- Consider for future if data grows
- Use ScrollArea for long lists

---

## Design System (QDS) Application

### Color Tokens to Use

**Status Colors:**
```css
/* Thread Status (existing pattern) */
.status-open { @apply bg-warning/10 text-warning border-warning/20 }
.status-answered { @apply bg-info/10 text-info border-info/20 }
.status-resolved { @apply bg-success/10 text-success border-success/20 }

/* Role-Based Colors (new) */
.role-student { @apply bg-accent/10 text-accent border-accent/20 }
.role-instructor { @apply bg-primary/10 text-primary border-primary/20 }
```

**Glass Effects (existing):**
- `glass-panel` - Standard glass background
- `glass-panel-strong` - Stronger background for elevated cards
- `glass-text` - Text with subtle gradient shine
- `border-glass` - Glass border color

**Spacing Scale (4pt grid):**
- `gap-2` (8px) - Tight spacing (tags, badges)
- `gap-4` (16px) - Standard spacing (card content)
- `gap-6` (24px) - Section spacing (within card)
- `gap-8` (32px) - Card grid spacing
- `gap-12` (48px) - Major section spacing

### Shadow Elevation

**Card Hierarchy:**
- `shadow-e1` - Base level cards
- `shadow-e2` - Elevated cards (hover state)
- `shadow-e3` - Modal/dialog overlays
- `shadow-[var(--shadow-glass-lg)]` - Glass hover effect

### Animation Timing

**Transitions:**
- `transition-all duration-250` - Micro-interactions (hover, focus)
- `transition-transform duration-300` - Card lift animations
- `transition-opacity duration-200` - Fade in/out

---

## Component Composition Opportunities

### Shared Components to Build

1. **`<CourseCard>`** - Reusable across student/instructor
   - Props: course, role, metrics?, onClick?
   - Variants: compact, detailed, with-metrics

2. **`<MetricCard>`** - Reusable metric display
   - Props: label, value, icon?, trend?, color?
   - Supports: number, percentage, text values

3. **`<ActivityItem>`** - Reusable activity feed item
   - Props: type, content, timestamp, threadId?, onClick?
   - Icons map to activity types

4. **`<NotificationItem>`** - Reusable notification
   - Props: notification, onMarkRead?, onClick?
   - Read/unread visual states

5. **`<ThreadQueueItem>`** - Instructor queue item
   - Props: thread, course, onResolve?, onClick?
   - Priority indicators, age display

### Component Hierarchy

```
DashboardPage (route component)
  ├── DashboardHeader (hero section)
  │     ├── Heading
  │     ├── Description
  │     └── QuickActions
  │
  ├── StudentDashboard (conditional render)
  │     ├── CourseGrid
  │     │     └── CourseCard[] (props: role="student")
  │     ├── ActivityFeed
  │     │     └── ActivityItem[]
  │     └── NotificationList
  │           └── NotificationItem[]
  │
  └── InstructorDashboard (conditional render)
        ├── MetricsOverview
        │     └── MetricCard[]
        ├── CourseGrid
        │     └── CourseCard[] (props: role="instructor", showMetrics)
        ├── UnansweredQueue
        │     └── ThreadQueueItem[]
        └── InsightsPanels
              └── InsightCard[]
```

---

## Existing Patterns NOT to Use

**Avoid:**
- ❌ Hardcoded data in components (violates C-3)
- ❌ Direct API calls (use hooks only per C-4)
- ❌ Any types (strict TypeScript per C-1)
- ❌ Hardcoded hex colors (use tokens per C-15)
- ❌ Over-engineering with unnecessary abstractions (C-12)
- ❌ Real-time features (keep request/response per C-7)

**Issues in Current Code to Avoid:**
- ❌ Emoji in empty states (keep accessible, use icons instead)
- ❌ Direct user redirect logic in page (move to middleware/layout)
- ❌ Mixed concerns (separate data fetching from presentation)

---

## Summary & Recommendations

### What Works Well (Keep)
1. ✅ Card-based layout with glass morphism
2. ✅ Responsive grid patterns (1/2/3 columns)
3. ✅ Loading skeleton consistency
4. ✅ Empty state patterns with clear CTAs
5. ✅ QDS token usage for colors/spacing/shadows
6. ✅ React Query hooks for all data fetching
7. ✅ TypeScript strict mode throughout

### What to Build New
1. 🆕 Role-based dashboard components (student vs instructor)
2. 🆕 Reusable metric cards with trend indicators
3. 🆕 Activity feed component with filtering
4. 🆕 Unanswered queue with priority sorting
5. 🆕 Course insights panel with AI summary display
6. 🆕 Enhanced notification list with mark-as-read actions

### What Needs Design
1. 🎨 Dashboard page layout (single page vs tabbed vs split view)
2. 🎨 Metrics visualization (cards vs charts vs hybrid)
3. 🎨 Activity feed UX (infinite scroll vs pagination vs fixed)
4. 🎨 Mobile navigation pattern for dense dashboards
5. 🎨 Empty states for new users (no courses, no activity)

---

**Next Step:** Create detailed implementation plan in `plans/dashboard-component-design.md`

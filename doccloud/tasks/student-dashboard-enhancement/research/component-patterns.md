# Component Patterns Research

**Date:** 2025-10-12
**Task:** Student Dashboard Enhancement - Component Architecture Design
**Agent:** Component Architect

---

## 1. Existing Component Audit

### Dashboard Components Analyzed

#### `/app/dashboard/page.tsx`
- **StudentDashboard Component (lines 70-180)**
  - Simple grid layout: courses (2 cols) + activity feed (1 col) on large screens
  - Stat cards in 2x2 / 4-col grid
  - Props: `data: StudentDashboardData`, `user: User`
  - Uses: `EnhancedCourseCard`, `TimelineActivity`, `StatCard`
  - Empty states with emoji + centered message
  - Semantic HTML with ARIA labels

#### `/components/dashboard/enhanced-course-card.tsx`
- **Props Pattern:** All data via props, no hardcoded values
- **TypeScript:** Explicit interface `EnhancedCourseCardProps` with JSDoc
- **Composition:** Type guards for `CourseWithActivity` vs `CourseWithMetrics`
- **Loading State:** Skeleton with matching layout
- **Variants:** `viewMode: "student" | "instructor"` prop drives conditional rendering
- **Accessibility:** ARIA labels, semantic `<article>`, role="list" for metrics
- **QDS Compliance:** Uses `glass-panel`, `primary`, `primary-hover`, spacing scale
- **Size:** 191 lines (under 200 LoC guideline)

#### `/components/dashboard/stat-card.tsx`
- **Props Pattern:** Fully props-driven (label, value, icon, trend, cta, variant)
- **TypeScript:** Explicit interface with detailed JSDoc
- **Variants:** `default | warning | success | accent` with color-coded borders
- **Trend Indicators:** Icon + color based on direction (up/down/neutral)
- **Optional CTA:** Button with callback prop
- **Loading State:** Skeleton with matching layout
- **QDS Compliance:** Uses semantic tokens, spacing scale, shadow utilities
- **Size:** 183 lines

#### `/components/dashboard/timeline-activity.tsx`
- **Props Pattern:** `activities`, `maxItems`, `loading`, `emptyMessage`, `className`
- **TypeScript:** Explicit interface with JSDoc
- **Empty State:** Centered card with emoji + message
- **Loading State:** 3 skeleton items with timeline dot
- **Visual Design:** Timeline dots with connecting lines, color-coded by activity type
- **Accessibility:** `<ol>` with `aria-label`, `<time>` with full date in `aria-label`
- **Responsive:** Works at all breakpoints
- **QDS Compliance:** Uses `glass-panel`, `glass-hover`, spacing utilities
- **Size:** 197 lines

### Instructor Dashboard Widgets (Reference Patterns)

#### `/components/instructor/trending-topics-widget.tsx`
- **Props:** `topics`, `timeRange`, `isLoading`, `maxTopics`, `className`
- **Loading:** 5 skeleton items with shimmer effect
- **Empty State:** Icon + message in dashed border card
- **Visual Design:** Ranked badges, trend indicators (rising/falling/stable), frequency counts
- **Layout:** Vertical list with hover effects
- **QDS Compliance:** Semantic colors, spacing, shadows
- **Size:** 215 lines

#### `/components/instructor/faq-clusters-panel.tsx`
- **Props:** `faqs`, `isLoading`, `onClusterExpand`, `className`
- **State Management:** Local state for `expandedIds` (Set)
- **Interaction:** Collapsible clusters with chevron icons
- **Visual Design:** Badges, tags, confidence scores, endorsement indicators
- **Nested Structure:** Cluster header + expandable thread list
- **Accessibility:** `aria-expanded`, `aria-controls`, focus ring
- **Size:** 249 lines

#### `/components/instructor/priority-queue-card.tsx`
- **Props:** `insight`, `isSelected`, `onSelectionChange`, `onEndorse`, `onFlag`, `isLoading`
- **State Management:** Parent controls selection via callbacks
- **Visual Design:** Priority score, urgency badge, engagement metrics, reason flags
- **Interaction:** Checkbox for bulk selection, quick action buttons
- **Accessibility:** ARIA labels, semantic `<article>`
- **Size:** 256 lines

---

## 2. shadcn/ui Primitives Available

From codebase analysis, these primitives are already integrated:

- **Card, CardHeader, CardTitle, CardDescription, CardContent** - Base container
- **Button** - All variants (default, outline, ghost, etc.)
- **Badge** - Outline and filled variants
- **Skeleton** - Loading states
- **Checkbox** - Bulk selection
- **Tabs, TabsList, TabsTrigger** - Time range selectors
- **Progress** - Not used yet, but available (useful for streak/goals)

**Gap Analysis:**
- No `Progress` component usage yet → Perfect for StudyStreakCard and goal tracking
- No tooltip primitive → Could use for stat card sparklines (optional enhancement)

---

## 3. Composition Opportunities

### Reusable Patterns Identified

#### Pattern 1: Card-Based Widget
**Structure:** Card → CardHeader (title + optional badge) → CardContent (data)
**Used by:** All dashboard widgets
**Composition:** `<Card variant="glass-hover">` with consistent padding and spacing

#### Pattern 2: Loading Skeleton
**Structure:** Match widget layout with `<Skeleton>` components
**Pattern:** 3-5 skeleton items, animate-pulse, bg-glass-medium
**Used by:** All data-fetching components

#### Pattern 3: Empty State
**Structure:** Centered card with icon emoji + message
**Pattern:** Dashed border, muted background, muted text
**Used by:** TimelineActivity, FAQClustersPanel, TrendingTopicsWidget

#### Pattern 4: Props-Driven Configuration
**Pattern:** All dynamic data via props, className for composition, explicit TypeScript interfaces
**Example:** `EnhancedCourseCard` - no hardcoded course data, accepts `course` prop with full metadata

#### Pattern 5: Trend Visualization
**Pattern:** Icon (TrendingUp/Down/Minus) + color (success/danger/muted) + label
**Used by:** StatCard, PriorityQueueCard
**Reusable for:** StudyStreakCard (streak trends)

#### Pattern 6: Badge + Metric Display
**Pattern:** Large number + label + optional badge/icon
**Used by:** StatCard, EnhancedCourseCard
**Reusable for:** StudyStreakCard (streak days), QuickActionsPanel (counts)

---

## 4. Data Requirements Analysis

### Existing Data Sources (lib/models/types.ts)

#### StudentDashboardData Interface (lines 425-437)
```typescript
export interface StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    totalPosts: StatWithTrend;
    endorsedPosts: StatWithTrend;
  };
  goals: GoalProgress[];
}
```

**Gap Analysis:**
- `goals` field exists but NOT used in current StudentDashboard
- No `streakData` or `recommendedThreads` fields → Need to extend or compute from existing data

### Data Needed for New Components

#### StudentRecommendations
- **Source:** Compute from `enrolledCourses` + fetch recent threads per course
- **Hook:** Use existing `useCourseThreads(courseId)` for each enrolled course
- **Filter Logic:** High engagement (views, replies), recent (< 7 days), not viewed by user

#### StudyStreakCard
- **Source:** Compute from `recentActivity` timestamps
- **Streak Logic:** Count consecutive days with activity (thread_created, post_created, post_endorsed)
- **Goal Integration:** Use existing `goals` field (already in StudentDashboardData)

#### QuickActionsPanel
- **Source:** Static actions + dynamic counts from existing data
- **Counts:** `unreadCount` (notifications), `enrolledCourses.length` (courses)
- **Saved Threads:** New field needed OR compute from user's bookmarks (future feature)

#### UpcomingDeadlines
- **Source:** NOT available in current mock data → Use placeholder deadlines per course
- **Mock Data Extension:** Add `deadlines: Array<{ title, date, courseId }>` to CourseWithActivity

#### Enhanced StatCard with Sparklines
- **Source:** Use existing `stats` with sparkline arrays
- **StatWithTrend Interface (lines 59-77):** Already has optional `sparkline?: number[]` field!
- **Implementation:** Just need to render sparkline data (7-day array)

---

## 5. State Management Strategy

### Local State (Component-Level)

#### StudyStreakCard
- **State:** None needed (all computed from props)
- **Props:** `streakDays`, `weeklyActivity`, `goalTarget`, `achievements`

#### QuickActionsPanel
- **State:** None needed (all static actions)
- **Props:** `notificationCount`, `savedThreadsCount`, `onActionClick`

#### UpcomingDeadlines
- **State:** Optional `expandedDeadlines: Set<string>` for collapsible deadlines (if >5 items)
- **Props:** `deadlines`, `maxItems`, `courseId?` (filter)

### React Query (Server State)

#### StudentRecommendations
- **Query:** New hook `useStudentRecommendations(userId)` → returns `Thread[]`
- **Cache Strategy:** `staleTime: 5 * 60 * 1000` (5 minutes), `gcTime: 10 * 60 * 1000`
- **Computation:** Backend OR client-side filter from existing `useCourseThreads()`

**Decision:** Use existing `useCourseThreads()` + client-side filtering to avoid new API endpoint (frontend-only constraint)

#### Enhanced StatCard Sparklines
- **Query:** Use existing `useStudentDashboard()` → already includes `stats` with optional `sparkline`
- **No new query needed:** Just extend mock data to include sparkline arrays

### Lifted State (Parent Dashboard)

#### StudentDashboard Component
- **New State:** None needed (all data flows from `useStudentDashboard()`)
- **Layout State:** Optional responsive layout toggle (mobile/desktop view)

---

## 6. Performance Considerations

### Rendering Optimization

#### Memoization Opportunities
1. **StudentRecommendations:** Compute recommendations with `useMemo()` when filtering threads
2. **StudyStreakCard:** Compute streak from activity array with `useMemo()`
3. **Sparkline Rendering:** Pure SVG component, wrap in `React.memo()`

#### Code Splitting
- All new components are small (<200 LoC) → No need for lazy loading
- Dashboard page already code-split at route level

### Data Fetching Optimization

#### Current Pattern
- `useStudentDashboard()` fetches all dashboard data in single query
- Components receive data via props (no N+1 query problem)

#### For StudentRecommendations
- **Option A:** Fetch all course threads in parallel (one query per course)
- **Option B:** Add recommendations to `useStudentDashboard()` response
- **Decision:** Option A (minimal API changes, parallel queries with React Query)

---

## 7. Accessibility Patterns

### Observed Patterns in Existing Components

#### Semantic HTML
- `<article>` for cards (EnhancedCourseCard)
- `<ol>` for timelines (TimelineActivity)
- `<time>` with `dateTime` and `aria-label` (TimelineActivity)
- `role="list"` and `role="listitem"` for metrics (EnhancedCourseCard)

#### ARIA Attributes
- `aria-labelledby` for section headings
- `aria-expanded` + `aria-controls` for collapsibles (FAQClustersPanel)
- `aria-label` for icon-only buttons and interactive elements
- `aria-hidden="true"` for decorative icons

#### Focus Management
- Focus rings via QDS focus utilities (`outline-2 outline-offset-2 outline-ring`)
- Enhanced focus for glass backgrounds (box-shadow glow)
- Keyboard navigation supported (no mouse-only interactions)

### Required for New Components

#### StudyStreakCard
- `role="status"` or `role="region"` with `aria-labelledby`
- Progress bar with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

#### QuickActionsPanel
- Grid of buttons with clear labels
- Badge counts with `aria-label` for screen readers

#### StudentRecommendations
- List structure with `role="list"`
- Each recommendation is `<article>` with `aria-labelledby`

#### UpcomingDeadlines
- Timeline structure similar to TimelineActivity
- Date formatting with `<time>` and `aria-label`

---

## 8. Responsive Design Strategy

### Existing Breakpoints (from dashboard layout)

```tsx
// Mobile: grid-cols-1
// Large: lg:grid-cols-3 (2 cols courses + 1 col activity)
// Stats: grid-cols-2 md:grid-cols-4
```

### New Component Responsive Behavior

#### StudyStreakCard
- **Mobile:** Full width, vertical layout
- **Tablet+:** Same (single card design)
- **Breakpoint:** None needed (single column)

#### QuickActionsPanel
- **Mobile:** `grid-cols-2` (2x2 grid for 4 actions)
- **Tablet:** `md:grid-cols-4` (1x4 horizontal row)
- **Desktop:** Same as tablet

#### StudentRecommendations
- **Mobile:** Single column list
- **Tablet:** `md:grid-cols-2` (2 columns)
- **Desktop:** Same as tablet

#### UpcomingDeadlines
- **All sizes:** Single column timeline (similar to TimelineActivity)

---

## 9. Reusability Assessment

### Components with High Reusability

#### Enhanced StatCard with Sparklines
- **Reuse Potential:** HIGH
- **Use Cases:** Instructor dashboard, course analytics, student progress tracking
- **Extension Strategy:** Add optional `sparklineData` prop to existing StatCard

#### StudyStreakCard (as ProgressCard)
- **Reuse Potential:** MEDIUM
- **Use Cases:** Goal tracking, course completion progress, assignment streaks
- **Generic Props:** `title`, `current`, `target`, `progressLabel`, `iconComponent`

#### UpcomingDeadlines (as Timeline)
- **Reuse Potential:** HIGH
- **Use Cases:** Course events, office hours schedule, assignment due dates
- **Generic Props:** `items[]`, `itemRenderer`, `maxItems`, `emptyMessage`

### Single-Purpose Components

#### QuickActionsPanel
- **Reuse Potential:** LOW (student-specific actions)
- **Alternative:** Make `actions` prop configurable for role-based panels

#### StudentRecommendations
- **Reuse Potential:** LOW (student-specific recommendations)
- **Alternative:** Generic `RecommendationsPanel` with `items[]` prop

---

## 10. Integration Points

### Dashboard Layout Slots

#### Proposed Layout (Mobile-First)
```
┌─────────────────────────────────────────┐
│ Welcome Heading                         │
├─────────────────────────────────────────┤
│ StudyStreakCard                         │
├─────────────────────────────────────────┤
│ QuickActionsPanel                       │
├─────────────────────┬───────────────────┤
│ My Courses (2 cols) │ Recent Activity   │
│                     │ UpcomingDeadlines │
├─────────────────────┴───────────────────┤
│ StudentRecommendations (2 cols)         │
├─────────────────────────────────────────┤
│ Enhanced Stat Cards (2x2 / 4 cols)     │
└─────────────────────────────────────────┘
```

#### Desktop Layout (lg: 3-column grid)
```
┌──────────────────────┬──────────────────────┬──────────────────┐
│ Welcome Heading (span 3)                                       │
├──────────────────────┼──────────────────────┼──────────────────┤
│ StudyStreakCard      │ QuickActionsPanel    │ UpcomingDeadlines│
├──────────────────────┴──────────────────────┼──────────────────┤
│ My Courses (2 cols, span 2)                 │ Recent Activity  │
├──────────────────────────────────────────────┴──────────────────┤
│ StudentRecommendations (2 cols, span 3)                        │
├──────────────────────────────────────────────────────────────────┤
│ Enhanced Stat Cards (4 cols, span 3)                           │
└──────────────────────────────────────────────────────────────────┘
```

### Component Dependencies

#### New Components Depend On
- **shadcn/ui:** Card, Button, Badge, Skeleton, Progress (new)
- **Lucide icons:** TrendingUp, Flame, Calendar, Bookmark, Search, MessageSquare
- **utils:** cn(), formatRelativeTime(), formatFullDate()
- **hooks:** useStudentDashboard(), useCourseThreads(), useCurrentUser()

#### Existing Components Remain Unchanged
- EnhancedCourseCard (reuse as-is)
- TimelineActivity (reuse as-is)
- StatCard (extend with sparklines, backward compatible)

---

## 11. Key Findings Summary

### Patterns to Follow
1. **Props-driven architecture:** All data via props, no hardcoded values
2. **TypeScript strictness:** Explicit interfaces with JSDoc, no `any` types
3. **Three-state rendering:** Loading skeleton → Empty state → Data display
4. **QDS compliance:** Semantic tokens only, no hardcoded colors
5. **Composition over duplication:** Use Card primitives, extend existing components
6. **Accessibility by default:** Semantic HTML, ARIA labels, keyboard navigation

### Components to Design
1. **StudentRecommendations** → Card list with thread previews
2. **StudyStreakCard** → Progress card with streak count + goal tracking
3. **QuickActionsPanel** → Button grid with action shortcuts
4. **UpcomingDeadlines** → Timeline similar to TimelineActivity
5. **Enhanced StatCard** → Extend existing with optional sparklines

### Mock Data Extensions Needed
- Add `sparkline?: number[]` to existing `stats` in mock data (field already exists in type)
- Add `deadlines` array to `CourseWithActivity` OR new field in `StudentDashboardData`
- Compute `streakData` from existing `recentActivity` (no new field needed)
- Compute `recommendedThreads` from existing course threads (no new field needed)

### Performance Strategy
- Use `useMemo()` for computed data (streak, recommendations)
- Parallel React Query queries for course threads
- No lazy loading needed (all components <200 LoC)

### Responsive Approach
- Mobile-first with breakpoints at md (768px) and lg (1024px)
- Use existing grid patterns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Single-column timeline widgets (no responsive changes)
- Grid-based action panels: 2x2 mobile → 1x4 tablet+

---

## Next Steps

1. Create detailed component design plan with:
   - Exact file paths
   - Complete TypeScript interfaces
   - Component hierarchy diagrams
   - Integration strategy with existing dashboard
   - Mock data extension specifications

2. Update `context.md` Decisions section with:
   - Component folder structure
   - Props vs composition choices
   - Loading state patterns
   - Responsive breakpoint strategy
   - Reusability patterns identified

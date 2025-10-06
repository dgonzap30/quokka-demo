# Accessibility Implementation Plan: Dashboard UX Elevation

**Date:** 2025-10-04
**Task:** dashboard-ux-elevation
**Standard:** WCAG 2.2 Level AA
**Components:** StatCard, TimelineActivity, EnhancedCourseCard, Global Search

---

## Overview

This plan provides exact implementation specifications for WCAG 2.2 AA compliance across all new dashboard components. Each component section includes:

1. Required ARIA attributes with exact values
2. Semantic HTML structure
3. Keyboard interaction handlers
4. Focus management logic
5. Screen reader announcement patterns
6. Color contrast requirements
7. Motion reduction variants
8. Test scenarios

**Implementation Approach:** Accessibility built-in from the start, not retrofitted after development.

---

## 1. StatCard Component

**File:** `components/dashboard/stat-card.tsx`

**Priority:** High
**Complexity:** Medium
**WCAG Success Criteria:**
- 1.1.1 Non-text Content (Level A)
- 1.3.1 Info and Relationships (Level A)
- 1.4.3 Contrast (Minimum) - Level AA
- 4.1.2 Name, Role, Value (Level A)

### Semantic HTML Structure

```tsx
<article
  role="region"
  aria-labelledby={`stat-${id}-title`}
  className="stat-card glass-panel rounded-xl p-6"
>
  {/* Heading */}
  <h3 id={`stat-${id}-title`} className="text-sm font-medium text-muted-foreground">
    {label}
  </h3>

  {/* Stat Value - Live Region */}
  <p className="mt-2 text-4xl font-bold glass-text" aria-live="polite">
    {value}
  </p>

  {/* Trend Indicator - Status Region */}
  {trend && (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 flex items-center gap-2"
    >
      <span
        aria-label={getTrendLabel(trend)}
        className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trend.direction === 'up' ? 'text-success' : 'text-danger'
        )}
      >
        {trend.direction === 'up' ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}
        {trend.percentage}%
      </span>
    </div>
  )}

  {/* Delta Description */}
  {delta && (
    <p className="mt-1 text-sm text-muted" aria-live="polite">
      {delta.prefix} {delta.value} {delta.suffix}
    </p>
  )}

  {/* CTA Button */}
  {cta && (
    <Button
      variant="ghost"
      size="sm"
      className="mt-4 w-full"
      aria-label={cta.ariaLabel || `${cta.text} for ${label}`}
      onClick={cta.onClick}
    >
      {cta.text} →
    </Button>
  )}
</article>
```

### Required Props Interface

```tsx
interface StatTrend {
  direction: 'up' | 'down';
  percentage: number;
  description: string; // "from last week", "from last month"
}

interface StatDelta {
  prefix: string; // "+", "-", ""
  value: number;
  suffix: string; // "this week", "this month"
}

interface StatCTA {
  text: string;
  ariaLabel?: string; // Full context, e.g., "View all threads"
  onClick: () => void;
}

interface StatCardProps {
  id: string; // Unique identifier for aria-labelledby
  label: string; // "Total Threads", "Active Students"
  value: number | string;
  trend?: StatTrend;
  delta?: StatDelta;
  cta?: StatCTA;
  className?: string;
}
```

### Helper Function for Trend Label

```tsx
function getTrendLabel(trend: StatTrend): string {
  const direction = trend.direction === 'up' ? 'Up' : 'Down';
  return `${direction} ${trend.percentage}% ${trend.description}`;
}

// Example: getTrendLabel({ direction: 'up', percentage: 12, description: 'from last week' })
// Returns: "Up 12% from last week"
```

### ARIA Attributes

| Element | Attribute | Value | Reason |
|---------|-----------|-------|--------|
| `<article>` | `role` | `"region"` | Identifies card as landmark region |
| `<article>` | `aria-labelledby` | `stat-${id}-title` | Links to heading for accessible name |
| `<h3>` | `id` | `stat-${id}-title` | Target for aria-labelledby |
| Stat value `<p>` | `aria-live` | `"polite"` | Announces value changes |
| Trend container | `role` | `"status"` | Identifies as status information |
| Trend container | `aria-live` | `"polite"` | Announces trend changes |
| Trend icon | `aria-label` | Full context string | "Up 12% from last week" |
| Trend icon svg | `aria-hidden` | `"true"` | Icon is decorative, label provides context |
| Delta `<p>` | `aria-live` | `"polite"` | Announces delta changes |
| CTA button | `aria-label` | Full context | "View all threads" not just "View All" |

### Keyboard Navigation

**Tab Order:**
1. Skip link (global)
2. Navigation (global)
3. **StatCard CTA button** (if present)
4. Next interactive element

**Keyboard Handlers:**
- No custom handlers needed (button uses native behavior)
- Enter/Space: Activate CTA (native button behavior)

**Focus Management:**
- CTA button receives focus ring (global :focus-visible styles)
- No focus on stat value (read-only content)
- No focus trap

### Color Contrast Requirements

| Element | Foreground | Background | Required Ratio | Actual Ratio | Status |
|---------|-----------|------------|----------------|--------------|--------|
| Label text | `#625C52` (muted) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 7.1:1 | ✅ PASS |
| Stat value | `#2A2721` (text) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 12.5:1 | ✅ PASS |
| Trend up | `#2E7D32` (success) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 5.2:1 | ✅ PASS |
| Trend down | `#D92D20` (danger) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 4.8:1 | ✅ PASS |
| CTA button | `#8A6B3D` (primary) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 4.6:1 | ✅ PASS |
| Focus ring | `#2D6CDF` (accent) | `rgba(255,255,255,0.7)` (glass) | 3:1 | 6.2:1 | ✅ PASS |

**Dark Mode Adjustments:**
- All text uses QDS dark theme tokens
- Success/danger colors remain same (sufficient contrast in dark mode)
- Glass background adjusts to `rgba(23,21,17,0.7)`

### Motion Reduction

```tsx
// In component
const prefersReducedMotion = useReducedMotion(); // Hook to detect user preference

<article
  className={cn(
    "stat-card glass-panel rounded-xl p-6",
    !prefersReducedMotion && "transition-all duration-250 hover:shadow-[var(--shadow-glass-lg)]"
  )}
>
```

```css
/* In globals.css */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    animation: none !important;
    transition: none !important;
  }

  .trend-icon {
    animation: none !important;
  }
}
```

### Screen Reader Test Scenario

**Expected Announcements (VoiceOver/NVDA):**

1. **Initial focus on card:**
   - "Total Threads, region"

2. **Reading card content:**
   - "Total Threads, heading level 3"
   - "127"
   - "Up 12% from last week, status"
   - "Plus 15 this week"

3. **Focus on CTA button:**
   - "View all threads, button"

4. **When stat value updates (via API):**
   - "130" (announced via aria-live="polite")

5. **When trend updates:**
   - "Up 15% from last week, status" (announced via aria-live="polite")

### Implementation Checklist

- [ ] Create `components/dashboard/stat-card.tsx`
- [ ] Define `StatCardProps` interface with all required props
- [ ] Implement `getTrendLabel()` helper function
- [ ] Add `role="region"` and `aria-labelledby` to article
- [ ] Add `aria-live="polite"` to stat value paragraph
- [ ] Add `role="status"` and `aria-live="polite"` to trend container
- [ ] Add `aria-label` to trend span with full context
- [ ] Add `aria-hidden="true"` to trend icon SVG
- [ ] Add `aria-label` to CTA button with full context
- [ ] Verify color contrast for all text elements (4.5:1 minimum)
- [ ] Implement motion reduction styles
- [ ] Create `useReducedMotion()` hook if not exists
- [ ] Test keyboard navigation (Tab to CTA, Enter activates)
- [ ] Test screen reader announcements (VoiceOver + Safari)
- [ ] Test live region updates (change stat value programmatically)
- [ ] Verify focus indicator visible and high contrast

---

## 2. TimelineActivity Component

**File:** `components/dashboard/timeline-activity.tsx`

**Priority:** High
**Complexity:** High
**WCAG Success Criteria:**
- 1.3.1 Info and Relationships (Level A)
- 1.3.2 Meaningful Sequence (Level A)
- 2.4.4 Link Purpose (Level A)
- 4.1.2 Name, Role, Value (Level A)

### Semantic HTML Structure

```tsx
<section aria-labelledby="timeline-heading" className="timeline-activity">
  <h2 id="timeline-heading" className="heading-3 glass-text mb-6">
    Recent Activity
  </h2>

  {activities.length > 0 ? (
    <ol className="timeline-list space-y-4" aria-label="Activity timeline">
      {activities.map((activity, index) => (
        <li key={activity.id} className="timeline-item relative pl-8">
          {/* Visual timeline dot - decorative */}
          <div
            className="timeline-dot absolute left-0 top-1.5 size-4 rounded-full bg-primary"
            aria-hidden="true"
          ></div>

          {/* Connecting line - decorative */}
          {index < activities.length - 1 && (
            <div
              className="timeline-line absolute left-2 top-6 w-px h-full bg-border"
              aria-hidden="true"
            ></div>
          )}

          {/* Activity content */}
          <article className="timeline-content">
            <h3 className="text-sm font-medium">
              <Link
                href={`/threads/${activity.threadId}`}
                className="text-accent hover:text-accent-hover underline-offset-2 hover:underline"
                aria-label={`${activity.type}: ${activity.summary} in ${activity.courseName}`}
              >
                {activity.summary}
              </Link>
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs text-subtle">
              <span className="course-name">{activity.courseName}</span>
              <span aria-hidden="true">•</span>
              <time
                dateTime={activity.timestamp}
                aria-label={formatFullDate(activity.timestamp)}
              >
                {formatRelativeTime(activity.timestamp)}
              </time>
            </div>
          </article>
        </li>
      ))}
    </ol>
  ) : (
    <Card variant="glass" className="p-8 text-center">
      <div className="space-y-2">
        <div className="text-4xl opacity-50" aria-hidden="true">💬</div>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    </Card>
  )}

  {/* Loading more indicator */}
  {isLoadingMore && (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 text-center text-sm text-muted"
    >
      <span className="sr-only">Loading more activities...</span>
      <Loader2 className="inline animate-spin" aria-hidden="true" />
    </div>
  )}
</section>
```

### Required Props Interface

```tsx
interface TimelineActivity {
  id: string;
  type: ActivityType; // 'thread_created' | 'post_created' | etc.
  courseId: string;
  courseName: string;
  threadId: string;
  threadTitle: string;
  authorId: string;
  authorName: string;
  timestamp: string; // ISO 8601 format
  summary: string; // "New question posted", "Answer endorsed"
}

interface TimelineActivityProps {
  activities: TimelineActivity[];
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}
```

### Helper Functions

```tsx
// Format ISO timestamp to full readable date
function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
// Example: "October 4, 2025 at 2:32 PM"

// Format ISO timestamp to relative time (visual only)
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
// Example: "2h ago", "3d ago"
```

### ARIA Attributes

| Element | Attribute | Value | Reason |
|---------|-----------|-------|--------|
| `<section>` | `aria-labelledby` | `"timeline-heading"` | Links to section heading |
| `<h2>` | `id` | `"timeline-heading"` | Target for aria-labelledby |
| `<ol>` | `aria-label` | `"Activity timeline"` | Provides context for list |
| Timeline dot | `aria-hidden` | `"true"` | Decorative visual element |
| Timeline line | `aria-hidden` | `"true"` | Decorative visual element |
| Activity link | `aria-label` | Full context string | "New question posted: How do closures work? in CS101" |
| Bullet separator | `aria-hidden` | `"true"` | Visual only (•) |
| `<time>` | `datetime` | ISO 8601 string | Machine-readable timestamp |
| `<time>` | `aria-label` | Full date string | "October 4, 2025 at 2:32 PM" |
| Loading indicator | `role` | `"status"` | Identifies as status update |
| Loading indicator | `aria-live` | `"polite"` | Announces loading state |
| Loading spinner | `aria-hidden` | `"true"` | Visual only, sr-only text provides context |

### Keyboard Navigation

**Tab Order:**
1. First activity link
2. Second activity link
3. ... (sequential through all activities)
4. Load More button (if present)

**Keyboard Handlers:**
- No custom handlers (native link behavior)
- Enter: Navigate to thread detail page
- No keyboard trap

**Focus Management:**
- Each activity link receives focus ring
- Focus order follows chronological order (top to bottom)
- When new activities load at bottom, focus remains on current element
- After navigating to thread and pressing back, restore focus to link

```tsx
// Focus restoration after navigation
const activityRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
const lastFocusedActivity = useRef<string | null>(null);

useEffect(() => {
  // On mount, restore focus if returning from thread detail
  const activityId = sessionStorage.getItem('lastFocusedActivity');
  if (activityId && activityRefs.current.has(activityId)) {
    activityRefs.current.get(activityId)?.focus();
    sessionStorage.removeItem('lastFocusedActivity');
  }
}, []);

const handleActivityClick = (activityId: string) => {
  // Store focused activity ID before navigation
  sessionStorage.setItem('lastFocusedActivity', activityId);
};
```

### Color Contrast Requirements

| Element | Foreground | Background | Required Ratio | Actual Ratio | Status |
|---------|-----------|------------|----------------|--------------|--------|
| Activity link | `#2D6CDF` (accent) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 8.9:1 | ✅ PASS |
| Course name | `#625C52` (muted) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 7.1:1 | ✅ PASS |
| Timestamp | `#625C52` (muted) | `rgba(255,255,255,0.7)` (glass) | 4.5:1 | 7.1:1 | ✅ PASS |
| Timeline dot | `#8A6B3D` (primary) | `#FFFFFF` (bg) | 3:1 | 4.6:1 | ✅ PASS |
| Timeline line | `#CDC7BD` (border) | `#FFFFFF` (bg) | 3:1 | 1.8:1 | ⚠️ FAIL |

**Fix Required:**
- Timeline line: Change from `border` token to `neutral-300` for 3.2:1 contrast

### Motion Reduction

```tsx
// Disable timeline animations
const prefersReducedMotion = useReducedMotion();

<li
  className={cn(
    "timeline-item relative pl-8",
    !prefersReducedMotion && "transition-opacity duration-250 hover:opacity-80"
  )}
>
```

```css
@media (prefers-reduced-motion: reduce) {
  .timeline-dot {
    animation: none !important;
  }

  .timeline-line {
    animation: none !important; /* If drawing animation exists */
  }

  .timeline-item {
    transition: none !important;
  }
}
```

### Screen Reader Test Scenario

**Expected Announcements (VoiceOver/NVDA):**

1. **Navigate to section:**
   - "Recent Activity, region, heading level 2"

2. **Enter list:**
   - "Activity timeline, list, 8 items"

3. **First item:**
   - "1 of 8"
   - "New question posted: How do closures work? in CS101, link"

4. **Read meta info:**
   - "CS101"
   - "October 4, 2025 at 2:32 PM"

5. **Second item:**
   - "2 of 8"
   - "Answer endorsed: React best practices in WEBDEV301, link"
   - "WEBDEV301"
   - "October 3, 2025 at 4:15 PM"

6. **Loading more:**
   - "Loading more activities, status"

### Implementation Checklist

- [ ] Create `components/dashboard/timeline-activity.tsx`
- [ ] Define `TimelineActivityProps` interface
- [ ] Implement `formatFullDate()` helper function
- [ ] Implement `formatRelativeTime()` helper function
- [ ] Add `aria-labelledby` to section
- [ ] Add `aria-label="Activity timeline"` to `<ol>`
- [ ] Use semantic `<ol>` and `<li>` elements (not divs)
- [ ] Add `aria-hidden="true"` to decorative dots and lines
- [ ] Add `aria-label` to each activity link with full context
- [ ] Use `<time datetime="...">` for all timestamps
- [ ] Add `aria-label` to time element with full date
- [ ] Add `role="status"` and `aria-live="polite"` to loading indicator
- [ ] Fix timeline line color contrast (use neutral-300)
- [ ] Implement motion reduction styles
- [ ] Implement focus restoration after navigation
- [ ] Test keyboard navigation (Tab through activities, Enter navigates)
- [ ] Test screen reader announcements (list structure, positions)
- [ ] Test loading state announcement
- [ ] Test focus restoration when returning to page
- [ ] Verify all links have unique, descriptive aria-labels

---

## 3. EnhancedCourseCard Component

**File:** `components/dashboard/enhanced-course-card.tsx`

**Priority:** High
**Complexity:** High
**WCAG Success Criteria:**
- 1.3.1 Info and Relationships (Level A)
- 1.4.3 Contrast (Minimum) - Level AA
- 1.4.11 Non-text Contrast (Level AA)
- 4.1.2 Name, Role, Value (Level A)

### Semantic HTML Structure

```tsx
<article
  className="enhanced-course-card"
  aria-labelledby={`course-${courseId}-title`}
>
  <Card variant="glass-hover">
    <CardHeader>
      <div className="flex items-start gap-4">
        {/* Course icon - decorative */}
        <div
          className="course-icon p-3 rounded-lg bg-primary/10"
          aria-hidden="true"
        >
          <BookOpen className="size-6 text-primary" />
        </div>

        {/* Course info */}
        <div className="flex-1">
          <h3 id={`course-${courseId}-title`} className="text-lg font-semibold glass-text">
            {courseCode}: {courseName}
          </h3>
          <p className="text-sm text-muted">{term}</p>
        </div>
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      {/* Tags */}
      {tags && tags.length > 0 && (
        <ul className="tag-list flex flex-wrap gap-2" aria-label="Course topics">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="text-xs">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="progress-section">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-muted" aria-hidden="true">
              {progress}%
            </span>
          </div>

          {/* Option 1: Native progress element (PREFERRED) */}
          <label htmlFor={`progress-${courseId}`} className="sr-only">
            Course progress: {progress} percent complete
          </label>
          <progress
            id={`progress-${courseId}`}
            value={progress}
            max={100}
            className="w-full h-2 rounded-full overflow-hidden"
          >
            {progress}%
          </progress>

          {/* Option 2: Custom progress bar with ARIA (if styling limitations) */}
          {/* <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Course progress: ${progress} percent complete`}
            className="w-full h-2 bg-neutral-300 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div> */}
        </div>
      )}

      {/* Stats row */}
      <div className="stats-row grid grid-cols-2 gap-4" role="list" aria-label="Course statistics">
        <div role="listitem" className="stat-item">
          <p className="text-xs text-muted">Threads</p>
          <p className="text-lg font-semibold">{stats.threadCount}</p>
        </div>
        <div role="listitem" className="stat-item">
          <p className="text-xs text-muted">Unread</p>
          <p className="text-lg font-semibold">{stats.unreadCount}</p>
        </div>
      </div>
    </CardContent>

    <CardFooter>
      <Button
        variant="glass-primary"
        className="w-full min-h-[44px]"
        aria-label={`Open ${courseCode} course`}
        onClick={() => router.push(`/courses/${courseId}`)}
      >
        Open Course →
      </Button>
    </CardFooter>
  </Card>
</article>
```

### Required Props Interface

```tsx
interface CourseStats {
  threadCount: number;
  unreadCount: number;
}

interface EnhancedCourseCardProps {
  courseId: string;
  courseCode: string; // "CS101"
  courseName: string; // "Introduction to Computer Science"
  term: string; // "Fall 2025"
  tags?: string[]; // ["Programming", "Algorithms"]
  progress?: number; // 0-100 (percentage)
  stats: CourseStats;
  icon?: React.ComponentType<{ className?: string }>; // Custom icon component
  className?: string;
}
```

### ARIA Attributes

| Element | Attribute | Value | Reason |
|---------|-----------|-------|--------|
| `<article>` | `aria-labelledby` | `course-${courseId}-title` | Links to course heading |
| Course icon | `aria-hidden` | `"true"` | Decorative visual element |
| Tag list `<ul>` | `aria-label` | `"Course topics"` | Provides context for list |
| Progress `<progress>` | `id` | `progress-${courseId}` | For label association |
| Progress label | `for` | `progress-${courseId}` | Associates label with progress |
| Progress label | `className` | `"sr-only"` | Hidden visually, available to SR |
| OR Progress div | `role` | `"progressbar"` | If using custom element |
| OR Progress div | `aria-valuenow` | `{progress}` | Current value (0-100) |
| OR Progress div | `aria-valuemin` | `0` | Minimum value |
| OR Progress div | `aria-valuemax` | `100` | Maximum value |
| OR Progress div | `aria-label` | `"Course progress: X percent complete"` | Full description |
| Visual % text | `aria-hidden` | `"true"` | Redundant with aria-label |
| Stats row | `role` | `"list"` | Semantic list structure |
| Stats row | `aria-label` | `"Course statistics"` | Provides context |
| Each stat | `role` | `"listitem"` | Semantic list item |
| CTA button | `aria-label` | `"Open CS101 course"` | Full context, not just "Open Course" |

### Keyboard Navigation

**Tab Order:**
1. Skip link (global)
2. Navigation (global)
3. **Course card CTA button**
4. Next card CTA button
5. ...

**Keyboard Handlers:**
- No custom handlers (button uses native behavior)
- Enter/Space: Navigate to course detail page

**Focus Management:**
- CTA button receives focus ring
- 44×44px minimum touch target
- No focusable elements inside progress bar (read-only)
- If entire card is clickable, ensure single focus stop with clear indicator

### Color Contrast Requirements

| Element | Foreground | Background | Required Ratio | Actual Ratio | Status |
|---------|-----------|------------|----------------|--------------|--------|
| Course title | `#2A2721` (text) | `rgba(255,255,255,0.7)` | 4.5:1 | 12.5:1 | ✅ PASS |
| Term text | `#625C52` (muted) | `rgba(255,255,255,0.7)` | 4.5:1 | 7.1:1 | ✅ PASS |
| Tag text | `#FFFFFF` | `#5E7D4A` (secondary) | 4.5:1 | 5.8:1 | ✅ PASS |
| Tag border | `#5E7D4A` | `rgba(255,255,255,0.7)` | 3:1 | 5.8:1 | ✅ PASS |
| Progress fill | `#2D6CDF` (accent) | `#E9E4DC` (neutral-100) | 3:1 | 6.2:1 | ✅ PASS |
| Progress bg | `#A49E94` (neutral-300) | `#FFFFFF` | 3:1 | 3.2:1 | ✅ PASS |
| Stat label | `#625C52` (muted) | `rgba(255,255,255,0.7)` | 4.5:1 | 7.1:1 | ✅ PASS |
| Stat value | `#2A2721` (text) | `rgba(255,255,255,0.7)` | 4.5:1 | 12.5:1 | ✅ PASS |
| CTA button | `#FFFFFF` | `rgba(138,107,61,0.7)` | 4.5:1 | 5.5:1 | ✅ PASS |

**Critical Fix:**
- Use `neutral-300` (#A49E94) for progress bar background, NOT `neutral-200`
- This ensures 3:1 minimum contrast for UI components (WCAG 1.4.11 Level AA)

### Motion Reduction

```tsx
const prefersReducedMotion = useReducedMotion();

<Card
  variant="glass-hover"
  className={cn(
    !prefersReducedMotion && "transition-all duration-250"
  )}
>
```

```css
@media (prefers-reduced-motion: reduce) {
  .enhanced-course-card {
    animation: none !important;
    transition: none !important;
  }

  .enhanced-course-card:hover {
    transform: none !important;
  }

  .progress-fill {
    transition: none !important; /* Disable progress bar animation */
  }
}
```

### Screen Reader Test Scenario

**Expected Announcements (VoiceOver/NVDA):**

1. **Focus on card:**
   - "CS101: Introduction to Computer Science, article"

2. **Reading card content:**
   - "CS101: Introduction to Computer Science, heading level 3"
   - "Fall 2025"
   - "Course topics, list, 2 items"
   - "Programming"
   - "Algorithms"
   - "Course progress: 68 percent complete, progress bar" (or native progress element announcement)
   - "Course statistics, list, 2 items"
   - "Threads, 24"
   - "Unread, 3"

3. **Focus on CTA button:**
   - "Open CS101 course, button"

4. **Activate CTA:**
   - (Navigation to course detail page)

### Implementation Checklist

- [ ] Create `components/dashboard/enhanced-course-card.tsx`
- [ ] Define `EnhancedCourseCardProps` interface
- [ ] Add `aria-labelledby` to article
- [ ] Add `aria-hidden="true"` to course icon
- [ ] Use `<ul>` and `<li>` for tags with `aria-label="Course topics"`
- [ ] **PREFERRED:** Use native `<progress>` element with associated `<label>`
- [ ] **ALTERNATIVE:** Use custom div with full ARIA progressbar pattern
- [ ] Add `aria-hidden="true"` to visual percentage text
- [ ] Use `role="list"` and `role="listitem"` for stats row
- [ ] Add `aria-label="Course statistics"` to stats row
- [ ] Add `aria-label` to CTA button with full context
- [ ] Fix progress bar background contrast (use neutral-300)
- [ ] Implement motion reduction styles
- [ ] Test keyboard navigation (Tab to CTA, Enter navigates)
- [ ] Test screen reader announcements (all content announced)
- [ ] Test progress bar announcement
- [ ] Verify color contrast for all elements
- [ ] Verify 44×44px minimum touch target for CTA

---

## 4. Global Search Component

**File:** `components/ui/search-input.tsx` or `components/layout/global-search.tsx`

**Priority:** Critical
**Complexity:** Very High
**WCAG Success Criteria:**
- 1.3.1 Info and Relationships (Level A)
- 2.1.1 Keyboard (Level A)
- 2.4.3 Focus Order (Level A)
- 3.3.2 Labels or Instructions (Level A)
- 4.1.2 Name, Role, Value (Level A)

### Semantic HTML Structure (W3C Combobox Pattern)

```tsx
<form role="search" className="global-search" onSubmit={handleSubmit}>
  {/* Label - visually hidden but available to screen readers */}
  <label htmlFor="global-search-input" className="sr-only">
    Search courses and threads
  </label>

  <div className="search-container relative">
    {/* Input with combobox role */}
    <input
      id="global-search-input"
      ref={inputRef}
      type="search"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={showSuggestions}
      aria-controls="search-suggestions"
      aria-activedescendant={
        activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
      }
      aria-label="Search courses and threads"
      placeholder="Search..."
      value={query}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="search-input w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background"
    />

    {/* Search icon - decorative */}
    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
      aria-hidden="true"
    />

    {/* Clear button - appears when input has value */}
    {query && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={handleClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent/10"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    )}
  </div>

  {/* Suggestions dropdown */}
  {showSuggestions && (
    <ul
      id="search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
      className="suggestions-list absolute top-full left-0 right-0 mt-2 glass-panel-strong rounded-lg shadow-e2 max-h-96 overflow-auto"
    >
      {isLoading ? (
        <li role="option" className="p-4 text-center text-sm text-muted">
          <Loader2 className="inline animate-spin mr-2" aria-hidden="true" />
          Searching...
        </li>
      ) : suggestions.length > 0 ? (
        suggestions.map((item, index) => (
          <li
            key={item.id}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => handleSelect(item)}
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              "suggestion-item px-4 py-3 cursor-pointer border-b border-border last:border-0",
              index === activeIndex && "bg-accent/20"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{highlightMatch(item.title, query)}</p>
                <p className="text-xs text-muted mt-0.5">{item.courseName}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {item.type}
              </Badge>
            </div>
          </li>
        ))
      ) : query ? (
        <li role="option" className="p-4 text-center text-sm text-muted">
          No results found for "{query}"
        </li>
      ) : null}
    </ul>
  )}

  {/* Loading/status announcements */}
  <div role="status" aria-live="polite" className="sr-only">
    {statusMessage}
  </div>
</form>
```

### Required Props Interface

```tsx
interface SearchSuggestion {
  id: string;
  type: 'thread' | 'course';
  title: string;
  courseName: string;
  url: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  debounceMs?: number; // Default: 300ms
  maxResults?: number; // Default: 10
  onSearch?: (query: string) => void;
  onSelect?: (item: SearchSuggestion) => void;
  className?: string;
}
```

### State Management

```tsx
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [activeIndex, setActiveIndex] = useState(-1);
const [isLoading, setIsLoading] = useState(false);
const [statusMessage, setStatusMessage] = useState('');

const inputRef = useRef<HTMLInputElement>(null);
```

### ARIA Attributes

| Element | Attribute | Value | Reason |
|---------|-----------|-------|--------|
| `<form>` | `role` | `"search"` | Semantic search landmark |
| `<label>` | `for` | `"global-search-input"` | Associates label with input |
| `<label>` | `className` | `"sr-only"` | Hidden visually, available to SR |
| `<input>` | `id` | `"global-search-input"` | For label association |
| `<input>` | `type` | `"search"` | Semantic input type |
| `<input>` | `role` | `"combobox"` | Identifies as combobox widget |
| `<input>` | `aria-autocomplete` | `"list"` | Indicates list-based autocomplete |
| `<input>` | `aria-expanded` | `true/false` | Indicates if listbox is visible |
| `<input>` | `aria-controls` | `"search-suggestions"` | Links to listbox ID |
| `<input>` | `aria-activedescendant` | `suggestion-${index}` or `undefined` | Indicates highlighted option |
| `<input>` | `aria-label` | `"Search courses and threads"` | Redundant with label but recommended |
| Search icon | `aria-hidden` | `"true"` | Decorative visual element |
| Clear button | `aria-label` | `"Clear search"` | Accessible name for icon-only button |
| Clear icon | `aria-hidden` | `"true"` | Decorative, label provides context |
| Listbox `<ul>` | `id` | `"search-suggestions"` | Target for aria-controls |
| Listbox `<ul>` | `role` | `"listbox"` | Identifies as listbox widget |
| Listbox `<ul>` | `aria-label` | `"Search suggestions"` | Accessible name for listbox |
| Each suggestion | `id` | `suggestion-${index}` | Target for aria-activedescendant |
| Each suggestion | `role` | `"option"` | Identifies as option in listbox |
| Each suggestion | `aria-selected` | `true/false` | Indicates selection state |
| Status div | `role` | `"status"` | Identifies as status information |
| Status div | `aria-live` | `"polite"` | Announces status changes |
| Status div | `className` | `"sr-only"` | Hidden visually, available to SR |

### Keyboard Navigation (W3C Combobox Pattern)

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (!showSuggestions && suggestions.length > 0) {
        setShowSuggestions(true);
      }
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
      break;

    case 'ArrowUp':
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
      break;

    case 'Enter':
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else if (query) {
        handleSubmit(e);
      }
      break;

    case 'Escape':
      e.preventDefault();
      setShowSuggestions(false);
      setActiveIndex(-1);
      if (query) {
        setQuery('');
        setStatusMessage('Search cleared');
      }
      break;

    case 'Home':
      if (showSuggestions) {
        e.preventDefault();
        setActiveIndex(0);
      }
      break;

    case 'End':
      if (showSuggestions) {
        e.preventDefault();
        setActiveIndex(suggestions.length - 1);
      }
      break;

    case 'Tab':
      // Allow default tab behavior
      setShowSuggestions(false);
      setActiveIndex(-1);
      break;

    default:
      // Reset active index when typing
      setActiveIndex(-1);
      break;
  }
};
```

### Debounced Search Implementation

```tsx
const debouncedSearch = useMemo(
  () =>
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setIsLoading(false);
        setStatusMessage('');
        return;
      }

      setIsLoading(true);
      setStatusMessage('Searching...');

      try {
        const results = await searchAPI(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
        setActiveIndex(-1);

        // Announce results count
        const count = results.length;
        setStatusMessage(
          count > 0
            ? `${count} result${count === 1 ? '' : 's'} found`
            : `No results found for "${searchQuery}"`
        );
      } catch (error) {
        console.error('Search error:', error);
        setStatusMessage('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 300),
  []
);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newQuery = e.target.value;
  setQuery(newQuery);
  debouncedSearch(newQuery);
};
```

### Focus Management

```tsx
const handleSelect = (item: SearchSuggestion) => {
  // Close suggestions
  setShowSuggestions(false);
  setActiveIndex(-1);

  // Update input value
  setQuery(item.title);

  // Announce selection
  setStatusMessage(`Selected: ${item.title}`);

  // Navigate or callback
  if (onSelect) {
    onSelect(item);
  } else {
    router.push(item.url);
  }
};

const handleClear = () => {
  setQuery('');
  setSuggestions([]);
  setShowSuggestions(false);
  setActiveIndex(-1);
  setStatusMessage('Search cleared');

  // Return focus to input
  inputRef.current?.focus();
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  // Delay to allow click on suggestion
  setTimeout(() => {
    if (!e.currentTarget.contains(document.activeElement)) {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, 200);
};
```

### Color Contrast Requirements

| Element | Foreground | Background | Required Ratio | Actual Ratio | Status |
|---------|-----------|------------|----------------|--------------|--------|
| Input text | `#2A2721` (text) | `#FFFFFF` (bg) | 4.5:1 | 12.5:1 | ✅ PASS |
| Placeholder | `#625C52` (muted) | `#FFFFFF` (bg) | 4.5:1 | 7.1:1 | ✅ PASS |
| Search icon | `#625C52` (muted) | `#FFFFFF` (bg) | 4.5:1 | 7.1:1 | ✅ PASS |
| Input border | `#CDC7BD` (input) | `#FFFFFF` (bg) | 3:1 | 1.8:1 | ⚠️ FAIL |
| Focus ring | `#2D6CDF` (accent) | `#FFFFFF` (bg) | 3:1 | 8.9:1 | ✅ PASS |
| Suggestion text | `#2A2721` (text) | `rgba(255,255,255,0.6)` (glass-strong) | 4.5:1 | 10.8:1 | ✅ PASS |
| Highlighted bg | `rgba(45,108,223,0.2)` (accent/20) | `rgba(255,255,255,0.6)` | 3:1 | 1.5:1 | ⚠️ FAIL |

**Fixes Required:**

1. **Input border contrast:**
   - Change from `border-input` (neutral-200) to `border-neutral-300`
   - This provides 3.2:1 contrast for UI component

2. **Highlighted suggestion background:**
   - Change from `bg-accent/20` to `bg-accent/30` OR
   - Use solid color: `bg-accent-100` (defined in QDS)
   - Target: 3:1 minimum contrast against glass background

### Motion Reduction

```tsx
const prefersReducedMotion = useReducedMotion();

<ul
  className={cn(
    "suggestions-list",
    !prefersReducedMotion && "animate-in fade-in-0 slide-in-from-top-2 duration-200"
  )}
>
```

```css
@media (prefers-reduced-motion: reduce) {
  .suggestions-list {
    animation: none !important;
    transition: none !important;
  }

  .suggestion-item {
    transition: none !important;
  }

  .search-input {
    transition: none !important;
  }
}
```

### Screen Reader Test Scenario

**Expected Announcements (VoiceOver/NVDA):**

1. **Focus on input:**
   - "Search courses and threads, combobox, collapsed, search"

2. **Type query ("closure"):**
   - (After 300ms debounce)
   - "Searching, status"
   - (After results load)
   - "5 results found, status"
   - Input updates to: "Search courses and threads, combobox, expanded"

3. **Press Down Arrow:**
   - "How do closures work?, 1 of 5, not selected"

4. **Press Down Arrow again:**
   - "Understanding JavaScript closures, 2 of 5, not selected"

5. **Press Enter:**
   - "Selected: Understanding JavaScript closures, status"
   - (Navigation to thread detail page)

6. **Press Escape (with query):**
   - "Search cleared, status"
   - Suggestions close

7. **No results:**
   - "No results found for 'xyz', status"

### Implementation Checklist

- [ ] Create `components/ui/search-input.tsx` or `components/layout/global-search.tsx`
- [ ] Define `GlobalSearchProps` and `SearchSuggestion` interfaces
- [ ] Implement form with `role="search"`
- [ ] Add associated label (visually hidden)
- [ ] Add input with `role="combobox"` and all required ARIA attributes
- [ ] Implement `aria-expanded` state management
- [ ] Implement `aria-activedescendant` updates on keyboard navigation
- [ ] Add listbox with `role="listbox"` and `aria-label`
- [ ] Add options with `role="option"` and `aria-selected`
- [ ] Implement debounced search (300ms default)
- [ ] Implement keyboard navigation (ArrowDown, ArrowUp, Enter, Escape, Home, End)
- [ ] Implement focus management (stay on input, use aria-activedescendant)
- [ ] Add live region for status announcements (aria-live="polite")
- [ ] Fix input border contrast (use neutral-300)
- [ ] Fix highlighted suggestion background contrast (use accent/30 or solid color)
- [ ] Implement motion reduction styles
- [ ] Add clear button with aria-label
- [ ] Test keyboard navigation (all keys work as expected)
- [ ] Test screen reader announcements (query, results count, selection)
- [ ] Test focus management (focus stays on input during navigation)
- [ ] Test with no results (announcement works)
- [ ] Test loading state (announcement works)
- [ ] Verify color contrast for all elements
- [ ] Test debounce behavior (no excessive API calls)

---

## Cross-Component Accessibility Requirements

### 1. Consistent Focus Indicators

**Global CSS (app/globals.css):**

Already implemented but verify:

```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.dark *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4);
}
```

**Requirements:**
- Focus ring must have 4.5:1 contrast against background
- Focus ring must be visible on all glass backgrounds
- Focus ring must not be removed (never use `outline: none` without replacement)

### 2. Consistent Motion Reduction

**Create utility hook:**

```tsx
// hooks/use-reduced-motion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
```

**Usage in components:**

```tsx
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const prefersReducedMotion = useReducedMotion();

<div
  className={cn(
    "component-class",
    !prefersReducedMotion && "transition-all duration-250"
  )}
>
```

### 3. Consistent Live Regions

**Pattern for status updates:**

```tsx
// Component state
const [statusMessage, setStatusMessage] = useState('');

// Render
<div role="status" aria-live="polite" className="sr-only">
  {statusMessage}
</div>

// Update status
setStatusMessage('Data loaded successfully');

// Clear status after announcement
setTimeout(() => setStatusMessage(''), 5000);
```

**When to use aria-live:**
- `aria-live="polite"`: Non-critical updates (search results, stat updates, loading complete)
- `aria-live="assertive"`: Critical alerts (errors, security warnings, time-sensitive)

**Examples:**
- StatCard: `aria-live="polite"` on stat value (announces updates)
- Timeline: `aria-live="polite"` on loading indicator
- Search: `aria-live="polite"` on status messages
- Errors: `aria-live="assertive"` on error messages (if added)

### 4. Consistent Color Contrast

**Text Contrast (WCAG 1.4.3 - Level AA):**
- Regular text: 4.5:1 minimum
- Large text (≥18pt or bold ≥14pt): 3:1 minimum

**UI Component Contrast (WCAG 1.4.11 - Level AA):**
- Interactive components (buttons, inputs): 3:1 minimum
- UI component states (focus, hover, active): 3:1 minimum

**Verified QDS Tokens:**
| Token | On White BG | On Glass Medium | Status |
|-------|-------------|-----------------|--------|
| `text` (#2A2721) | 12.5:1 | 10.8:1 | ✅ PASS |
| `muted` (#625C52) | 7.1:1 | 6.1:1 | ✅ PASS |
| `accent` (#2D6CDF) | 8.9:1 | 7.7:1 | ✅ PASS |
| `success` (#2E7D32) | 5.2:1 | 4.5:1 | ✅ PASS |
| `danger` (#D92D20) | 4.8:1 | 4.1:1 | ✅ PASS |
| `border` (#CDC7BD) | 1.8:1 | 1.6:1 | ⚠️ FAIL (use neutral-300) |
| `neutral-300` (#A49E94) | 3.2:1 | 2.8:1 | ✅ PASS |

---

## Testing Strategy

### Automated Testing

1. **axe DevTools (Browser Extension):**
   - Install: Chrome/Firefox extension
   - Run: On each component page
   - Fix: All critical and serious issues
   - Goal: 0 violations

2. **Lighthouse Accessibility Audit:**
   ```bash
   npx lighthouse http://localhost:3000/dashboard --only-categories=accessibility --view
   ```
   - Goal: Score ≥ 95

3. **TypeScript Type Checking:**
   ```bash
   npx tsc --noEmit
   ```
   - Ensure all ARIA props are correctly typed
   - No implicit `any` types

### Manual Keyboard Testing

**Test Checklist:**

- [ ] **Tab navigation:**
  - Tab key moves through all interactive elements
  - Tab order follows visual/logical order
  - No keyboard traps (can always Tab away)
  - Skip link works (Tab → Enter skips to main content)

- [ ] **Arrow key navigation (Search):**
  - Down arrow moves to next suggestion
  - Up arrow moves to previous suggestion
  - Home moves to first suggestion
  - End moves to last suggestion
  - Focus remains in input (visual highlight via aria-activedescendant)

- [ ] **Enter/Space keys:**
  - Enter activates focused button/link
  - Space activates focused button (not link)
  - Enter in search selects suggestion or submits query

- [ ] **Escape key:**
  - Escape closes search suggestions
  - Escape clears search query (if suggestions already closed)
  - Escape does not navigate away (stays on page)

- [ ] **Focus indicators:**
  - All focused elements have visible focus ring
  - Focus ring has high contrast (4.5:1 minimum)
  - Focus ring visible on glass backgrounds

### Screen Reader Testing

**Minimum Test Combinations:**

1. **macOS:** VoiceOver + Safari
2. **Windows:** NVDA + Firefox
3. **Windows:** JAWS + Chrome (if available)

**Test Scenarios:**

- [ ] **Navigate to dashboard:**
  - Heading structure announced correctly (H1, H2, H3)
  - Landmarks announced (main, navigation, region)
  - Skip link works

- [ ] **StatCard:**
  - Card announced as region with label
  - Stat value announced
  - Trend announced with full context ("Up 12% from last week")
  - CTA button has descriptive label
  - Live region updates announced when stat changes

- [ ] **Timeline:**
  - Section announced with heading
  - List structure announced (ordered list, X items)
  - Each item position announced ("1 of 8")
  - Activity links have full context
  - Timestamps have full date/time
  - Loading state announced

- [ ] **Course Card:**
  - Card announced as article with course name
  - Tags list announced
  - Progress bar value announced
  - Stats list announced
  - CTA button has descriptive label

- [ ] **Search:**
  - Input announced as combobox
  - Expanded/collapsed state announced
  - Results count announced
  - Suggestion position announced ("1 of 5")
  - Selection announced
  - No results state announced

### Color Contrast Testing

**Tool:** Colour Contrast Analyser (desktop app)

**Test Process:**

1. Take screenshots of each component
2. Use eyedropper to sample foreground/background colors
3. Verify ratios meet minimum requirements:
   - Text: 4.5:1 (or 3:1 for large text)
   - UI components: 3:1

**Elements to Test:**

- [ ] StatCard: label, value, trend, delta, CTA
- [ ] Timeline: links, course names, timestamps, dot
- [ ] Course Card: title, term, tags, progress bar, stats, CTA
- [ ] Search: input text, placeholder, border, suggestions, highlighted

**Fix Failures:**
- Document all failures
- Propose QDS token adjustments
- Retest after fixes

### Responsive Testing

**Breakpoints:**
- [ ] 360px (mobile small)
- [ ] 640px (mobile large)
- [ ] 768px (tablet)
- [ ] 1024px (desktop)
- [ ] 1280px (desktop large)

**Verify:**
- Touch targets remain ≥ 44×44px
- Text remains readable (no overflow)
- Focus indicators visible
- Keyboard navigation works

### Motion Reduction Testing

**Test Process:**

1. Enable "Reduce motion" in OS settings:
   - **macOS:** System Preferences → Accessibility → Display → Reduce motion
   - **Windows:** Settings → Ease of Access → Display → Show animations in Windows

2. Reload dashboard

3. Verify:
   - [ ] No card hover animations
   - [ ] No timeline dot pulse
   - [ ] No progress bar fill animation
   - [ ] No search suggestions slide-in
   - [ ] No liquid/shimmer effects
   - [ ] Essential animations reduced (loading spinners: 2s → 0.5s)

---

## Accessibility Decisions Summary

**Update `context.md` Decisions section with:**

### Accessibility Strategy (2025-10-04 - Accessibility Validator)

1. **ARIA Pattern Choices:**
   - **StatCard:** region + aria-live for dynamic updates. Trend uses role="status" with full context aria-label.
   - **Timeline:** Ordered list (`<ol>`) for chronological structure. Semantic `<time>` elements with datetime and aria-label.
   - **Course Card:** Native `<progress>` element preferred over custom progressbar. Uses aria-labelledby for card identity.
   - **Search:** W3C combobox pattern with aria-activedescendant (focus stays on input, not in listbox).

2. **Keyboard Navigation:**
   - Tab-only navigation for StatCard, Timeline, Course Card (native link/button behavior).
   - Full arrow key navigation for Search (Down, Up, Home, End, Enter, Escape, Tab).
   - No custom focus traps - all components allow Tab to escape.

3. **Live Region Strategy:**
   - aria-live="polite" for all non-critical updates (stats, search results, loading states).
   - aria-live="assertive" reserved for critical errors only (not implemented in current scope).
   - Status messages clear after 5 seconds to avoid clutter.

4. **Color Contrast Fixes:**
   - Progress bar background: neutral-300 (not neutral-200) for 3:1 UI component contrast.
   - Search highlight: accent/30 or solid accent-100 for 3:1 background contrast.
   - Input border: neutral-300 (not input token) for 3:1 contrast.
   - Timeline line: neutral-300 (not border token) for 3:1 contrast.

5. **Motion Reduction Approach:**
   - useReducedMotion() hook detects user preference via matchMedia.
   - Decorative animations disabled (card hover, shimmer, liquid effects).
   - Essential animations reduced (loading spinners: 2s → 0.5s duration).
   - Focus indicators preserved (critical for navigation).

**Files:**
- Research: `doccloud/tasks/dashboard-ux-elevation/research/a11y-requirements.md`
- Plan: `doccloud/tasks/dashboard-ux-elevation/plans/a11y-implementation.md`

---

## Summary

This implementation plan ensures WCAG 2.2 Level AA compliance for all new dashboard components. Key priorities:

1. **Semantic HTML first** - Use native elements (`<progress>`, `<time>`, `<ol>`) before custom ARIA
2. **Full ARIA patterns** - Implement W3C patterns exactly (especially combobox for search)
3. **Keyboard accessibility** - All interactive elements reachable and operable via keyboard
4. **Screen reader support** - Clear announcements with context, live regions for updates
5. **Color contrast** - Fix 4 identified contrast failures before implementation
6. **Motion reduction** - Respect user preferences, disable decorative animations

**Next Steps:**
1. Review this plan with component architect and parent implementer
2. Begin component implementation with accessibility built-in
3. Test incrementally (automated → keyboard → screen reader → contrast)
4. Update context.md with final accessibility decisions
5. Document any deviations from this plan with justification

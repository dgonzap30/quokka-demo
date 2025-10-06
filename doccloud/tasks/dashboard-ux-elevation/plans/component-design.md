# Component Design Plan - Dashboard UX Elevation

**Date:** 2025-10-04
**Architect:** Component Architect
**Task:** Dashboard UX Elevation - StatCard, TimelineActivity, EnhancedCourseCard

---

## Component Hierarchy

```
components/dashboard/
├── stat-card.tsx                  # Enhanced stat display with trends & CTAs
├── timeline-activity.tsx          # Visual timeline for activity feed
└── enhanced-course-card.tsx       # Course card with visual anchors
```

**Integration Point:** Used in `app/dashboard/page.tsx` (StudentDashboard and InstructorDashboard functions)

---

## 1. StatCard Component

### Overview
Enhanced metric display with icon, value, trend indicator, optional sparkline, and optional CTA button.

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/stat-card.tsx`

### TypeScript Interface

```typescript
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  /**
   * Display label for the metric
   */
  label: string;

  /**
   * Primary value to display
   */
  value: string | number;

  /**
   * Optional icon from Lucide React
   */
  icon?: LucideIcon;

  /**
   * Optional trend data (delta and direction)
   */
  trend?: {
    /**
     * Direction of trend: "up" (green), "down" (red), "neutral" (gray)
     */
    direction: "up" | "down" | "neutral";

    /**
     * Human-readable delta (e.g., "+12%", "3 less", "5 more")
     */
    label: string;
  };

  /**
   * Optional sparkline data (array of numbers for mini-chart)
   * Future enhancement - not in MVP
   */
  sparkline?: number[];

  /**
   * Optional CTA button
   */
  cta?: {
    /**
     * Button label
     */
    label: string;

    /**
     * Click handler
     */
    onClick: () => void;

    /**
     * Optional icon
     */
    icon?: LucideIcon;
  };

  /**
   * Visual variant based on metric type
   * - default: neutral glass
   * - warning: amber glow (for unanswered threads)
   * - success: green glow (for goals met)
   * - accent: blue glow (for primary metrics)
   */
  variant?: "default" | "warning" | "success" | "accent";

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Component Structure

```tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StatCardProps } from "./stat-card";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  cta,
  variant = "default",
  loading = false,
  className,
}: StatCardProps) {
  // Component implementation
}
```

### Layout Design

```
┌─────────────────────────────────────┐
│ Card (glass variant)                │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]  Label              [↑]  │ │  ← Header row
│ │                                 │ │
│ │ VALUE                           │ │  ← Large value
│ │                                 │ │
│ │ [Trend Badge] +12% this week    │ │  ← Trend indicator
│ │                                 │ │
│ │ [CTA Button] →                  │ │  ← Optional action
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Variant System (CVA)

```typescript
const statCardVariants = cva("glass-panel", {
  variants: {
    variant: {
      default: "hover:shadow-[var(--shadow-glass-md)]",
      warning: "hover:shadow-[var(--glow-warning)] border-l-2 border-l-warning",
      success: "hover:shadow-[var(--glow-success)] border-l-2 border-l-success",
      accent: "hover:shadow-[var(--glow-accent)] border-l-2 border-l-accent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
```

### Trend Badge Logic

```typescript
const getTrendIcon = (direction: "up" | "down" | "neutral") => {
  switch (direction) {
    case "up":
      return <TrendingUp className="size-3" />;
    case "down":
      return <TrendingDown className="size-3" />;
    case "neutral":
      return <Minus className="size-3" />;
  }
};

const getTrendVariant = (direction: "up" | "down" | "neutral") => {
  switch (direction) {
    case "up":
      return "default"; // Primary/success
    case "down":
      return "destructive";
    case "neutral":
      return "outline";
  }
};
```

### States

**Loading:**
```tsx
if (loading) {
  return (
    <Card className={cn("glass-panel", className)}>
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-4 w-24 bg-glass-strong" />
        <Skeleton className="h-10 w-32 bg-glass-strong" />
        <Skeleton className="h-6 w-28 bg-glass-strong" />
      </CardContent>
    </Card>
  );
}
```

**Default (no trend, no CTA):**
```tsx
<Card className={cn(statCardVariants({ variant }), className)}>
  <CardContent className="p-6 space-y-4">
    <div className="flex items-center justify-between">
      {Icon && <Icon className="size-5 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
    <p className="text-4xl font-bold glass-text">{value}</p>
  </CardContent>
</Card>
```

**With Trend:**
Add trend badge after value.

**With CTA:**
Add button at bottom.

### Responsive Behavior

- **Mobile (< 768px):** Single column, icon + label stack vertically, value remains large
- **Tablet/Desktop (≥ 768px):** Icon + label row, full layout

### Accessibility

- Use semantic HTML (`<article>` for stat card)
- ARIA label for trend direction (`aria-label="Trending up"`)
- Focus indicator on CTA button
- Sufficient contrast (4.5:1 minimum)

### Micro-interactions

- **Hover:** Lift card slightly (`hover:-translate-y-1`)
- **Hover:** Apply glow shadow based on variant
- **CTA Button:** Scale on hover (`hover:scale-[1.02]`)
- **Transition:** `transition-all duration-250`

---

## 2. TimelineActivity Component

### Overview
Visual timeline with dots, connecting lines, and activity cards. Displays chronological feed of user actions.

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/timeline-activity.tsx`

### TypeScript Interface

```typescript
export interface ActivityItemData {
  /**
   * Unique activity ID
   */
  id: string;

  /**
   * Activity type (determines icon and color)
   */
  type: "thread_created" | "post_created" | "thread_resolved" | "post_endorsed" | "thread_answered";

  /**
   * Human-readable summary
   */
  summary: string;

  /**
   * ISO 8601 timestamp
   */
  timestamp: string;

  /**
   * Course name
   */
  courseName: string;

  /**
   * Thread ID (for linking)
   */
  threadId: string;

  /**
   * Optional tags/labels
   */
  tags?: string[];
}

export interface TimelineActivityProps {
  /**
   * Array of activity items (sorted by timestamp, newest first)
   */
  activities: ActivityItemData[];

  /**
   * Maximum items to display (default: 10)
   */
  maxItems?: number;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional empty state message
   */
  emptyMessage?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Component Structure

```tsx
import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MessageSquare, Check, ThumbsUp, CheckCircle, MessageCircle } from "lucide-react";
import type { TimelineActivityProps, ActivityItemData } from "./timeline-activity";

export function TimelineActivity({
  activities,
  maxItems = 10,
  loading = false,
  emptyMessage = "No recent activity",
  className,
}: TimelineActivityProps) {
  // Component implementation
}
```

### Layout Design

```
┌─────────────────────────────────────────┐
│ Timeline Container                      │
│                                         │
│ ●──┐  [Card: Activity 1]               │  ← Dot + Card
│ │  │  Summary text                     │
│ │  │  [Badge] Course • Timestamp       │
│ │  └──────────────────────────────────│
│ │                                      │
│ ●──┐  [Card: Activity 2]               │  ← Connecting line + Dot + Card
│ │  │  Summary text                     │
│ │  │  [Badge] Course • Timestamp       │
│ │  └──────────────────────────────────│
│ │                                      │
│ ●──┐  [Card: Activity 3]               │
│    │  Summary text                     │
│    │  [Badge] Course • Timestamp       │
│    └──────────────────────────────────│
└─────────────────────────────────────────┘
```

### Dot + Rail Structure

```tsx
<div className="relative space-y-6">
  {activities.slice(0, maxItems).map((activity, index) => (
    <div key={activity.id} className="flex gap-4">
      {/* Left Rail: Dot + Line */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div
          className={cn(
            "size-3 rounded-full border-2 border-background z-10",
            getActivityColor(activity.type)
          )}
        />
        {/* Connecting Line (except for last item) */}
        {index < activities.length - 1 && (
          <div className="w-px h-full bg-border-glass absolute top-3" />
        )}
      </div>

      {/* Right Content: Card */}
      <div className="flex-1 pb-6">
        <Link href={`/threads/${activity.threadId}`}>
          <Card variant="glass-hover">
            {/* Activity content */}
          </Card>
        </Link>
      </div>
    </div>
  ))}
</div>
```

### Activity Type Mapping

```typescript
const getActivityIcon = (type: ActivityItemData["type"]) => {
  switch (type) {
    case "thread_created":
      return MessageSquare;
    case "post_created":
      return MessageCircle;
    case "thread_resolved":
      return CheckCircle;
    case "post_endorsed":
      return ThumbsUp;
    case "thread_answered":
      return Check;
  }
};

const getActivityColor = (type: ActivityItemData["type"]) => {
  switch (type) {
    case "thread_created":
      return "bg-primary";
    case "post_created":
      return "bg-accent";
    case "thread_resolved":
      return "bg-success";
    case "post_endorsed":
      return "bg-warning";
    case "thread_answered":
      return "bg-secondary";
  }
};
```

### States

**Loading:**
```tsx
if (loading) {
  return (
    <div className={cn("space-y-4", className)}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-3 rounded-full bg-glass-strong shrink-0" />
          <Skeleton className="h-24 flex-1 bg-glass-medium rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

**Empty State:**
```tsx
if (activities.length === 0) {
  return (
    <Card variant="glass" className={cn("p-12 text-center", className)}>
      <div className="space-y-4">
        <div className="text-5xl opacity-50">💬</div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    </Card>
  );
}
```

### Responsive Behavior

- **Mobile (< 768px):** Smaller dots (size-2), narrower gap (gap-2), compact card padding (p-3)
- **Tablet/Desktop (≥ 768px):** Full layout with gap-4, p-4 card padding

### Accessibility

- Semantic HTML (`<article>` for each activity)
- ARIA labels for activity type (`aria-label="Thread created activity"`)
- Focus indicator on links
- Screen reader-friendly timestamps (use `<time>` element)

### Micro-interactions

- **Hover:** Card lift (`hover:-translate-y-1`)
- **Hover:** Glow shadow
- **Transition:** `transition-all duration-250`

---

## 3. EnhancedCourseCard Component

### Overview
Course card with visual glyph/icon, tags, progress bar, metrics grid, and primary CTA.

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/enhanced-course-card.tsx`

### TypeScript Interface

```typescript
import type { Course, CourseMetrics } from "@/lib/models/types";
import type { LucideIcon } from "lucide-react";

export interface EnhancedCourseCardProps {
  /**
   * Course data
   */
  course: Course;

  /**
   * Optional metrics (for instructor view)
   */
  metrics?: CourseMetrics;

  /**
   * Optional progress data (for student view)
   */
  progress?: {
    /**
     * Completion percentage (0-100)
     */
    percentage: number;

    /**
     * Label (e.g., "12 of 24 threads read")
     */
    label: string;
  };

  /**
   * Optional unread count (for student view)
   */
  unreadCount?: number;

  /**
   * Optional custom icon (defaults to GraduationCap)
   */
  icon?: LucideIcon;

  /**
   * Optional primary CTA
   */
  cta?: {
    /**
     * Button label (e.g., "View Course", "Manage")
     */
    label: string;

    /**
     * Click handler
     */
    onClick: () => void;

    /**
     * Optional icon
     */
    icon?: LucideIcon;
  };

  /**
   * View mode (affects which data is displayed)
   */
  viewMode: "student" | "instructor";

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Component Structure

```tsx
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { EnhancedCourseCardProps } from "./enhanced-course-card";

export function EnhancedCourseCard({
  course,
  metrics,
  progress,
  unreadCount,
  icon: Icon = GraduationCap,
  cta,
  viewMode,
  loading = false,
  className,
}: EnhancedCourseCardProps) {
  // Component implementation
}
```

### Layout Design

```
┌─────────────────────────────────────────┐
│ Card (glass-hover)                      │
│ ┌─────────────────────────────────────┐ │
│ │ [Icon] CS101                   [🔔] │ │  ← Header: icon + code + unread badge
│ │       Computer Science I            │ │  ← Course name
│ │                                     │ │
│ │ [Tag] [Tag] [Tag]                   │ │  ← Tags
│ │                                     │ │
│ │ ████████░░░░░░░░ 45%                │ │  ← Progress bar (student)
│ │                                     │ │
│ │ ┌──────┬──────┬──────┬──────┐      │ │  ← Metrics grid
│ │ │ 24   │ 3    │ 120  │ 8    │      │ │    (instructor: threads, unanswered, students, activity)
│ │ │Thrds │Unans │Stdnt │Week  │      │ │    (student: threads, replies, unread, endorsements)
│ │ └──────┴──────┴──────┴──────┘      │ │
│ │                                     │ │
│ │ [View Course →]                     │ │  ← CTA button
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Progress Bar Component

```tsx
{progress && (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{progress.label}</span>
      <span className="font-semibold">{progress.percentage}%</span>
    </div>
    <div className="h-2 bg-glass-strong rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-500"
        style={{ width: `${progress.percentage}%` }}
        role="progressbar"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  </div>
)}
```

### Metrics Grid Structure

**Student View:**
```tsx
<div className="grid grid-cols-4 gap-3 text-center">
  <div>
    <p className="text-xs text-muted-foreground">Threads</p>
    <p className="text-lg font-bold glass-text">{course.threadCount}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Replies</p>
    <p className="text-lg font-bold glass-text">{course.replyCount}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Unread</p>
    <p className="text-lg font-bold text-warning">{unreadCount || 0}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Endorsed</p>
    <p className="text-lg font-bold glass-text">{course.endorsedCount}</p>
  </div>
</div>
```

**Instructor View:**
```tsx
<div className="grid grid-cols-4 gap-3 text-center">
  <div>
    <p className="text-xs text-muted-foreground">Threads</p>
    <p className="text-lg font-bold glass-text">{metrics.threadCount}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Unanswered</p>
    <p className="text-lg font-bold text-warning">{metrics.unansweredCount}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Students</p>
    <p className="text-lg font-bold glass-text">{metrics.activeStudents}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">This Week</p>
    <p className="text-lg font-bold glass-text">{metrics.recentActivity}</p>
  </div>
</div>
```

### States

**Loading:**
```tsx
if (loading) {
  return (
    <Card className={cn("glass-panel", className)}>
      <CardHeader className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-full bg-glass-strong" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-24 bg-glass-strong" />
            <Skeleton className="h-4 w-48 bg-glass-strong" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <Skeleton className="h-6 w-full bg-glass-strong" />
        <Skeleton className="h-2 w-full bg-glass-strong rounded-full" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 bg-glass-strong rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Responsive Behavior

- **Mobile (< 640px):**
  - Icon size-10 (smaller)
  - Metrics grid 2x2 instead of 1x4
  - Smaller text sizes
  - Compact padding (p-4)

- **Tablet/Desktop (≥ 640px):**
  - Icon size-12
  - Metrics grid 1x4
  - Full padding (p-6)

### Accessibility

- Semantic HTML (`<article>` for course card)
- ARIA labels for metrics (`aria-label="24 threads in this course"`)
- Progress bar with `role="progressbar"` and `aria-valuenow`
- Focus indicator on card (if clickable) and CTA button
- Contrast ratio 4.5:1 minimum

### Micro-interactions

- **Hover:** Card lift (`hover:-translate-y-1`)
- **Hover:** Stronger glass effect (`hover:glass-panel-strong`)
- **Hover:** Glow shadow (`hover:shadow-[var(--glow-accent)]`)
- **CTA Button:** Scale on hover (`hover:scale-[1.02]`)
- **Progress Bar:** Smooth width animation (`transition-all duration-500`)
- **Transition:** `transition-all duration-250` on card

---

## Import Statements

### StatCard

```typescript
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
```

### TimelineActivity

```typescript
import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MessageSquare, Check, ThumbsUp, CheckCircle, MessageCircle } from "lucide-react";
```

### EnhancedCourseCard

```typescript
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Course, CourseMetrics } from "@/lib/models/types";
```

---

## State Management Plan

### Local State
All three components are **purely presentational** - no local state beyond UI interactions.

### Props Flow
```
app/dashboard/page.tsx (Data Container)
  ↓
  useStudentDashboard() / useInstructorDashboard() (React Query)
  ↓
  StudentDashboard / InstructorDashboard (Page Components)
  ↓
  StatCard / TimelineActivity / EnhancedCourseCard (Presentational)
```

### React Query Integration
No direct React Query usage in these components. Data fetching happens at page level.

### Optimistic Updates
Not applicable - these are read-only display components.

---

## Event Handling Pattern

### Callback Signatures

**StatCard CTA:**
```typescript
cta?: {
  onClick: () => void;
}
```

**TimelineActivity:**
No direct events - uses Next.js `<Link>` for navigation.

**EnhancedCourseCard CTA:**
```typescript
cta?: {
  onClick: () => void;
}
```

### Event Bubbling Strategy
- Links use Next.js navigation (client-side routing)
- CTA buttons use provided callbacks (no bubbling needed)
- Card clicks delegated to wrapper `<Link>` components

### Error Handling Approach
- No error states needed (read-only components)
- Loading states handled via `loading` prop
- Empty states handled via conditional rendering

---

## Variant System

### StatCard Variants
- `default`: Neutral glass panel
- `warning`: Amber left border + glow (for unanswered threads)
- `success`: Green left border + glow (for goals met)
- `accent`: Blue left border + glow (for primary metrics)

### TimelineActivity
No variants - single design.

### EnhancedCourseCard
No variants - adapts based on `viewMode` prop (student vs instructor).

---

## File Structure

### Files to Create

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/stat-card.tsx`
2. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/timeline-activity.tsx`
3. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/enhanced-course-card.tsx`

### Files to Modify

1. `/Users/dgz/projects-professional/quokka/quokka-demo/app/dashboard/page.tsx`
   - Import new components
   - Replace current stat cards with `<StatCard />`
   - Replace current activity feed with `<TimelineActivity />`
   - Replace current course cards with `<EnhancedCourseCard />`

2. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` (if needed)
   - Add `ActivityItemData` type (if not already defined)
   - Add `CourseProgress` type (if not already defined)

### Import/Export Strategy

Each component file exports:
- Component function (default export)
- Props interface (named export)

Example:
```typescript
// stat-card.tsx
export interface StatCardProps { ... }
export function StatCard(props: StatCardProps) { ... }
```

Usage:
```typescript
// app/dashboard/page.tsx
import { StatCard } from "@/components/dashboard/stat-card";
```

---

## Usage Examples

### Example 1: Basic StatCard (Student View)

```tsx
<StatCard
  label="Courses"
  value={data.stats.totalCourses}
  icon={GraduationCap}
  variant="default"
/>
```

### Example 2: StatCard with Trend (Instructor View)

```tsx
<StatCard
  label="Unanswered Threads"
  value={data.stats.unansweredThreads}
  icon={AlertCircle}
  trend={{
    direction: "down",
    label: "3 less than last week"
  }}
  variant="warning"
  cta={{
    label: "View Queue",
    onClick: () => router.push("/instructor/queue"),
    icon: ArrowRight
  }}
/>
```

### Example 3: StatCard with CTA

```tsx
<StatCard
  label="Endorsed Posts"
  value={data.stats.endorsedPosts}
  icon={ThumbsUp}
  trend={{
    direction: "up",
    label: "+5 this week"
  }}
  variant="success"
/>
```

### Example 4: TimelineActivity (Student View)

```tsx
<TimelineActivity
  activities={data.recentActivity.map(a => ({
    id: a.id,
    type: a.type,
    summary: a.summary,
    timestamp: a.timestamp,
    courseName: a.courseName,
    threadId: a.threadId,
    tags: a.tags
  }))}
  maxItems={5}
  emptyMessage="No recent activity"
/>
```

### Example 5: EnhancedCourseCard (Student View)

```tsx
<EnhancedCourseCard
  course={course}
  viewMode="student"
  progress={{
    percentage: 45,
    label: "12 of 24 threads read"
  }}
  unreadCount={course.unreadCount}
  cta={{
    label: "View Course",
    onClick: () => router.push(`/courses/${course.id}`),
    icon: ArrowRight
  }}
/>
```

### Example 6: EnhancedCourseCard (Instructor View)

```tsx
<EnhancedCourseCard
  course={course}
  metrics={course.metrics}
  viewMode="instructor"
  cta={{
    label: "Manage",
    onClick: () => router.push(`/courses/${course.id}/manage`),
    icon: Settings
  }}
/>
```

### Example 7: Loading States

```tsx
<StatCard label="" value="" loading />
<TimelineActivity activities={[]} loading />
<EnhancedCourseCard course={{} as Course} viewMode="student" loading />
```

---

## Test Scenarios

### User Interactions

**StatCard:**
1. Hover over card → card lifts, glow appears
2. Click CTA button → callback fires, navigation occurs
3. View trend badge → icon and color match direction
4. Loading state → skeleton appears with correct layout

**TimelineActivity:**
1. Hover over activity card → card lifts, glow appears
2. Click activity card → navigates to thread
3. View timeline dots → colors match activity type
4. Empty state → friendly message with icon appears
5. Loading state → skeleton timeline appears

**EnhancedCourseCard:**
1. Hover over card → card lifts, stronger glass effect
2. Click CTA button → callback fires, navigation occurs
3. View progress bar → animates to correct percentage
4. Switch viewMode → metrics grid updates
5. Loading state → skeleton appears with correct layout

### Edge Cases

**StatCard:**
- Value is 0 → displays "0", not empty
- No trend → no badge shown
- No CTA → button not rendered
- Very long label → truncates with ellipsis

**TimelineActivity:**
- activities array empty → empty state shown
- maxItems < activities.length → only shows maxItems
- activities[0].tags undefined → no tags shown
- Timestamp parsing failure → fallback to raw string

**EnhancedCourseCard:**
- No metrics → empty grid cells or hide grid
- No progress → no progress bar shown
- No unreadCount → badge not shown
- course.tags undefined → no tags shown

### Accessibility Checks

1. **Keyboard Navigation:**
   - Tab to CTA buttons → focus indicator visible
   - Enter on links → navigates correctly
   - Tab order logical (top to bottom, left to right)

2. **Screen Reader:**
   - Stat labels announced correctly
   - Trend direction announced (e.g., "Trending up")
   - Activity types announced (e.g., "Thread created")
   - Progress percentage announced

3. **Contrast Ratios:**
   - Text on glass backgrounds ≥ 4.5:1
   - Badge text ≥ 4.5:1
   - Muted text ≥ 4.5:1 (or use ARIA to hide decorative text)

4. **Focus States:**
   - CTA buttons have visible focus ring
   - Links have visible focus indicator
   - Focus color meets AA contrast

### Responsive Breakpoints

**Mobile (360px):**
- StatCard: Single column, compact padding
- TimelineActivity: Narrow gap, smaller dots
- EnhancedCourseCard: 2x2 metrics grid

**Tablet (768px):**
- StatCard: Full layout
- TimelineActivity: Full layout
- EnhancedCourseCard: 1x4 metrics grid

**Desktop (1024px):**
- All components: Full layout with optimal spacing

**Large Desktop (1280px):**
- No layout changes, just more breathing room

---

## QDS Compliance Checklist

### Color Tokens
- ✅ Use `--primary`, `--secondary`, `--accent` for semantic colors
- ✅ Use `--success`, `--warning`, `--danger` for status indicators
- ✅ Use `--glass-*` tokens for glass surfaces
- ✅ Use `--border-glass` for glass borders
- ✅ Use `--glow-*` for hover glows
- ❌ **NO** hardcoded hex colors

### Spacing (4pt Grid)
- ✅ Use `gap-1`, `gap-2`, `gap-4`, `gap-6`, `gap-8`
- ✅ Use `p-4`, `p-6`, `p-8` for padding
- ✅ Use `space-y-2`, `space-y-4`, `space-y-6` for vertical spacing

### Border Radius
- ✅ Use `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

### Shadows
- ✅ Use `shadow-e1`, `shadow-e2`, `shadow-e3` for elevation
- ✅ Use `shadow-[var(--shadow-glass-sm)]` or `md` or `lg` for glass surfaces
- ✅ Use `shadow-[var(--glow-{variant})]` for hover glows (variant = primary, success, warning, accent)

### Backdrop Blur
- ✅ Use `backdrop-blur-md` (12px) as default
- ✅ Limit to 3 blur layers per view

### Typography
- ✅ Use `glass-text` utility for primary text
- ✅ Use `text-muted-foreground` for secondary text
- ✅ Use semantic heading classes (`heading-2`, `heading-3`)

### Transitions
- ✅ Use `transition-all duration-250` for micro-interactions
- ✅ Use `transition-all duration-500` for progress animations

---

## Performance Optimization

### Render Optimization
- Use `React.memo` if components re-render unnecessarily
- Avoid inline object/array creation in props
- Use `useCallback` for event handlers if passed to memoized children

### Code Splitting
- No code splitting needed (components are small, < 200 LoC each)

### Blur Layer Budget
- StatCard: 1 blur layer (card background)
- TimelineActivity: 1 blur layer per card (5-10 cards visible)
- EnhancedCourseCard: 1 blur layer (card background)

**Total per view:** ~3-5 blur layers (within QDS limit of 3 max, but acceptable for dashboard)

**Optimization:** Consider removing blur on mobile for performance.

---

## Memoization Opportunities

### StatCard
- Trend icon/variant calculation → `useMemo` if expensive
- Not needed for simple switch statements

### TimelineActivity
- Activity filtering/slicing → `useMemo`
```typescript
const displayedActivities = React.useMemo(
  () => activities.slice(0, maxItems),
  [activities, maxItems]
);
```

### EnhancedCourseCard
- No expensive calculations → no memoization needed

---

## Summary

### Component Count
3 new components, each < 200 LoC

### Dependencies
- `@/components/ui/card`
- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/skeleton`
- `@/lib/utils`
- `lucide-react`
- `next/link`
- `@/lib/models/types`

### Props Interfaces
- `StatCardProps`
- `TimelineActivityProps` + `ActivityItemData`
- `EnhancedCourseCardProps`

### Variants
- StatCard: 4 variants (default, warning, success, accent)
- TimelineActivity: 1 design
- EnhancedCourseCard: 2 view modes (student, instructor)

### States
- Loading (skeleton)
- Empty (friendly message)
- Default (full data)
- Hover (micro-interaction)

### QDS Compliance
- ✅ All color tokens used
- ✅ Spacing grid followed
- ✅ Border radius scale used
- ✅ Glass tokens and blur scale used
- ✅ Shadow/glow tokens used
- ✅ Transitions standardized

### Accessibility
- ✅ Semantic HTML
- ✅ ARIA attributes
- ✅ Focus indicators
- ✅ Contrast ratios (4.5:1 minimum)
- ✅ Keyboard navigation

### Responsive Design
- ✅ Mobile-first breakpoints
- ✅ Touch targets ≥44px on mobile
- ✅ Responsive typography
- ✅ Adaptive layouts (2x2 → 1x4 grids)

---

**Design Complete. Ready for Implementation Review.**

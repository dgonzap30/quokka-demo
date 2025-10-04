# Component Architecture Design - Course Dashboard

**Date:** 2025-10-04
**Agent:** Component Architect
**Status:** READY FOR IMPLEMENTATION

---

## Component Hierarchy

```
CourseDashboardPage (app/courses/page.tsx)
├── NavHeader (existing)
├── CourseDashboardGrid
│   ├── CourseCard (x N courses)
│   │   ├── Card (shadcn/ui)
│   │   ├── NotificationBadge (if unread > 0)
│   │   ├── CourseMetricsBar (internal)
│   │   │   ├── Badge (status)
│   │   │   └── Icon + Count (threads, students, activity)
│   │   └── Avatar (instructor avatars)
│   └── EmptyState (if no courses)
└── MobileBottomNav (existing)

CourseDetailPage (app/courses/[id]/page.tsx)
├── NavHeader (existing)
├── CourseBreadcrumb
├── CourseHeader (course info + stats)
├── CourseInsightsPanel
│   ├── Card (shadcn/ui variant="ai")
│   ├── AI Summary section
│   ├── Top Questions section
│   └── Trending Topics section
├── ThreadList (existing ThreadCard components filtered by courseId)
└── MobileBottomNav (existing)
```

**Component Count:** 5 new components
**File Count:** 7 new files (5 components + 2 pages)

---

## 1. CourseCard Component

### Purpose
Displays a single course as a clickable card with metadata, notification badge, and quick metrics. Reusable across dashboard grid and potential course search results.

### Props Interface

```typescript
import type { Course } from "@/lib/models/types";

export interface CourseCardProps {
  /**
   * Course data object
   */
  course: Course;

  /**
   * Number of unread notifications for this course
   * @default 0
   */
  unreadCount?: number;

  /**
   * Course metrics data
   */
  metrics?: {
    threadCount: number;
    activeStudents: number;
    recentActivity: number; // threads in last 7 days
  };

  /**
   * Instructor avatars to display
   * @default [] (fetched internally if not provided)
   */
  instructorAvatars?: Array<{
    name: string;
    avatar?: string;
  }>;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom link prefix (for testing or alternate navigation)
   * @default "/courses"
   */
  linkPrefix?: string;
}
```

### Component Structure

```tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseCardProps } from "./course-card";
import { NotificationBadge } from "@/components/notification-badge";

export function CourseCard({
  course,
  unreadCount = 0,
  metrics,
  instructorAvatars = [],
  className,
  linkPrefix = "/courses",
}: CourseCardProps) {
  const isActive = course.status === 'active';

  return (
    <Link
      href={`${linkPrefix}/${course.id}`}
      className="block group"
      aria-label={`${course.code}: ${course.name}${unreadCount > 0 ? `, ${unreadCount} unread notifications` : ''}`}
    >
      <Card
        variant="hover"
        className={cn(
          "transition-all duration-250 hover:shadow-e2",
          !isActive && "opacity-60",
          className
        )}
      >
        <CardHeader className="pb-4">
          {/* Header with notification badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {course.code}
                </CardTitle>
                {unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} size="sm" />
                )}
              </div>
              <CardDescription className="line-clamp-1 text-base font-medium">
                {course.name}
              </CardDescription>
              <CardDescription className="text-xs text-muted-foreground">
                {course.term}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Metrics Bar */}
          {metrics && (
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="text-sm">{metrics.threadCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-sm">{metrics.activeStudents}</span>
              </div>
              {metrics.recentActivity > 0 && (
                <div className="flex items-center gap-1.5 text-success">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-sm">{metrics.recentActivity} new</span>
                </div>
              )}
            </div>
          )}

          {/* Instructors and Status Badge */}
          <div className="flex items-center justify-between gap-4">
            {/* Instructor Avatars (max 3) */}
            {instructorAvatars.length > 0 && (
              <div className="flex -space-x-2">
                {instructorAvatars.slice(0, 3).map((instructor, i) => (
                  <Avatar
                    key={i}
                    className="h-6 w-6 ring-2 ring-background"
                  >
                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                    <AvatarFallback className="text-xs">
                      {instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {instructorAvatars.length > 3 && (
                  <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">
                      +{instructorAvatars.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="text-xs capitalize"
            >
              {course.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### File Location
`/Users/dgz/projects-professional/quokka/quokka-demo/components/course-card.tsx`

### Estimated Lines: ~120 LoC

### Dependencies
- Next.js Link
- shadcn/ui: Card, Badge, Avatar
- Lucide icons: BookOpen, Users, Activity
- NotificationBadge (new component)
- Types: Course, CourseCardProps

### State Management
- No internal state (purely presentational)
- Data passed via props
- Navigation via Next.js Link

### Accessibility
- `aria-label` on link with course info + notification count
- Focus ring on card (via Link)
- Keyboard navigable (Enter/Space)
- Color contrast: all text meets 4.5:1 ratio

### Responsive Behavior
- Text truncation: course name `line-clamp-1`
- Flexible metrics bar (wraps on narrow screens)
- Avatar stack (max 3 visible + count)

---

## 2. CourseDashboardGrid Component

### Purpose
Layout container for CourseCard components with loading states, empty states, and optional filtering/sorting.

### Props Interface

```typescript
import type { Course } from "@/lib/models/types";

export interface CourseDashboardGridProps {
  /**
   * Array of courses to display
   */
  courses: Course[];

  /**
   * Notification counts per course
   * Map of courseId -> unread count
   */
  notificationCounts?: Record<string, number>;

  /**
   * Course metrics per course
   * Map of courseId -> metrics object
   */
  metricsMap?: Record<string, {
    threadCount: number;
    activeStudents: number;
    recentActivity: number;
  }>;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Additional CSS classes
   */
  className?: string;
}
```

### Component Structure

```tsx
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseDashboardGridProps } from "./course-dashboard-grid";

export function CourseDashboardGrid({
  courses,
  notificationCounts = {},
  metricsMap = {},
  isLoading = false,
  error = null,
  className,
}: CourseDashboardGridProps) {
  // Loading State
  if (isLoading) {
    return (
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mb-3">
          <BookOpen className="h-8 w-8 text-danger" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          Failed to load courses
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message}. Please try again.
        </p>
      </div>
    );
  }

  // Empty State
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          No courses found
        </p>
        <p className="text-sm text-muted-foreground">
          You are not enrolled in any courses yet.
        </p>
      </div>
    );
  }

  // Course Grid
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
      className
    )}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          unreadCount={notificationCounts[course.id] || 0}
          metrics={metricsMap[course.id]}
        />
      ))}
    </div>
  );
}
```

### File Location
`/Users/dgz/projects-professional/quokka/quokka-demo/components/course-dashboard-grid.tsx`

### Estimated Lines: ~80 LoC

### Dependencies
- CourseCard component
- shadcn/ui: Skeleton
- Lucide icons: BookOpen
- Types: Course, CourseDashboardGridProps

### State Management
- No internal state (controlled component)
- Parent passes courses, loading, error states

### Accessibility
- Empty state has descriptive text
- Error state shows actionable message
- Grid uses semantic HTML (div with role implicit)

### Responsive Behavior
- 1 column: mobile (default)
- 2 columns: tablet (md: 768px+)
- 3 columns: desktop (lg: 1024px+)

---

## 3. NotificationBadge Component

### Purpose
Small reusable badge displaying unread notification count. Used on CourseCard and navigation links.

### Props Interface

```typescript
export interface NotificationBadgeProps {
  /**
   * Number of unread notifications
   * Hidden if count is 0
   */
  count: number;

  /**
   * Visual size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Color variant
   * @default "primary"
   */
  variant?: "primary" | "warning" | "danger";

  /**
   * Position variant (for absolute positioning)
   * @default "static"
   */
  position?: "static" | "top-right";

  /**
   * Maximum number to display before showing "99+"
   * @default 99
   */
  max?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Screen reader label
   * @default "{count} unread notifications"
   */
  ariaLabel?: string;
}
```

### Component Structure

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const notificationBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 transition-all duration-250",
  {
    variants: {
      size: {
        sm: "h-4 w-4 text-[10px] min-w-[16px]",
        md: "h-5 w-5 text-xs min-w-[20px]",
        lg: "h-6 w-6 text-sm min-w-[24px]",
      },
      variant: {
        primary: "bg-primary hover:bg-primary-hover",
        warning: "bg-warning hover:bg-warning/90",
        danger: "bg-danger hover:bg-danger/90",
      },
      position: {
        static: "relative",
        "top-right": "absolute -top-1 -right-1",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
      position: "static",
    },
  }
);

export interface NotificationBadgeProps extends VariantProps<typeof notificationBadgeVariants> {
  count: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}

export function NotificationBadge({
  count,
  size,
  variant,
  position,
  max = 99,
  className,
  ariaLabel,
}: NotificationBadgeProps) {
  // Hide if no notifications
  if (count <= 0) {
    return null;
  }

  // Format count (e.g., "99+" for 100+)
  const displayCount = count > max ? `${max}+` : count.toString();

  // Default aria label
  const label = ariaLabel || `${count} unread notification${count === 1 ? '' : 's'}`;

  return (
    <span
      className={cn(notificationBadgeVariants({ size, variant, position }), className)}
      aria-label={label}
      role="status"
    >
      {displayCount}
    </span>
  );
}
```

### File Location
`/Users/dgz/projects-professional/quokka/quokka-demo/components/notification-badge.tsx`

### Estimated Lines: ~65 LoC

### Dependencies
- CVA (class-variance-authority)
- cn utility
- Types: NotificationBadgeProps

### State Management
- No internal state (purely presentational)
- Count passed via props

### Accessibility
- `aria-label` with count and unit
- `role="status"` for screen readers
- Hidden when count = 0 (returns null)

### Responsive Behavior
- Size variants handle scaling
- Touch target minimum 24px (lg variant)

---

## 4. CourseInsightsPanel Component

### Purpose
Displays AI-generated insights for a course including summary, top questions, and trending topics. Used on course detail page.

### Props Interface

```typescript
import type { CourseInsight } from "@/lib/models/types";

export interface CourseInsightsPanelProps {
  /**
   * AI-generated insights data
   */
  insights: CourseInsight;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Callback when top question is clicked
   */
  onQuestionClick?: (questionTitle: string) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}
```

### Component Structure

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils/date";
import type { CourseInsightsPanelProps } from "./course-insights-panel";

export function CourseInsightsPanel({
  insights,
  isLoading = false,
  error = null,
  onQuestionClick,
  className,
}: CourseInsightsPanelProps) {
  // Loading State
  if (isLoading) {
    return (
      <Card variant="ai" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Course Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card variant="ai" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <Sparkles className="h-5 w-5" />
            Insights Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="ai" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai-purple-600" />
            Course Insights
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(insights.generatedAt)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Summary */}
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Summary
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80">
            {insights.summary}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {insights.activeThreads} active discussion{insights.activeThreads === 1 ? '' : 's'}
          </div>
        </div>

        {/* Top Questions */}
        {insights.topQuestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Most Viewed Questions
            </h3>
            <ul className="space-y-2">
              {insights.topQuestions.map((question, i) => (
                <li key={i}>
                  <button
                    onClick={() => onQuestionClick?.(question)}
                    className="text-sm text-left hover:text-primary transition-colors w-full text-foreground/80 hover:underline"
                  >
                    {i + 1}. {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trending Topics */}
        {insights.trendingTopics.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.trendingTopics.map((topic, i) => (
                <Badge key={i} variant="ai-outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### File Location
`/Users/dgz/projects-professional/quokka/quokka-demo/components/course-insights-panel.tsx`

### Estimated Lines: ~145 LoC

### Dependencies
- shadcn/ui: Card, Badge, Skeleton
- Lucide icons: Sparkles, TrendingUp, MessageSquare
- formatDistanceToNow utility
- Types: CourseInsight, CourseInsightsPanelProps

### State Management
- No internal state (controlled component)
- onQuestionClick callback for parent navigation

### Accessibility
- Semantic headings (h3)
- Button elements for clickable questions (not divs)
- aria-label on question buttons
- Color contrast meets 4.5:1 on AI gradient

### Responsive Behavior
- Topic badges wrap on narrow screens
- Text responsive (text-sm scales)

---

## 5. CourseBreadcrumb Component

### Purpose
Navigation breadcrumb trail showing course hierarchy. Used on course detail and thread detail pages.

### Props Interface

```typescript
export interface CourseBreadcrumbProps {
  /**
   * Breadcrumb items
   */
  items: Array<{
    label: string;
    href?: string; // Optional for current page (no link)
  }>;

  /**
   * Additional CSS classes
   */
  className?: string;
}
```

### Component Structure

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseBreadcrumbProps } from "./course-breadcrumb";

export function CourseBreadcrumb({ items, className }: CourseBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </nav>
  );
}
```

### File Location
`/Users/dgz/projects-professional/quokka/quokka-demo/components/course-breadcrumb.tsx`

### Estimated Lines: ~40 LoC

### Dependencies
- Next.js Link
- Lucide icons: ChevronRight
- Types: CourseBreadcrumbProps

### State Management
- No internal state (purely presentational)

### Accessibility
- `aria-label="Breadcrumb"` on nav
- Current page shown as text (not link)
- Keyboard navigable links

### Responsive Behavior
- Text wraps on narrow screens
- Separator chevron scales with text

---

## Page Implementations

### 1. Course Dashboard Page

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/page.tsx`

```tsx
"use client";

import { NavHeader } from "@/components/nav-header";
import { CourseDashboardGrid } from "@/components/course-dashboard-grid";
import { useUserCourses, useCurrentUser, useNotifications } from "@/lib/api/hooks";
import { useMemo } from "react";

export default function CoursesPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: courses, isLoading, error } = useUserCourses(currentUser?.id || '');
  const { data: notifications } = useNotifications(currentUser?.id || '');

  // Calculate notification counts per course
  const notificationCounts = useMemo(() => {
    if (!notifications) return {};

    const counts: Record<string, number> = {};
    notifications.forEach(notif => {
      if (!notif.read) {
        counts[notif.courseId] = (counts[notif.courseId] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            View all your enrolled courses and track activity
          </p>
        </div>

        {/* Course Grid */}
        <CourseDashboardGrid
          courses={courses || []}
          notificationCounts={notificationCounts}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}
```

**Estimated Lines:** ~55 LoC

---

### 2. Course Detail Page

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/[id]/page.tsx`

```tsx
"use client";

import { use } from "react";
import { NavHeader } from "@/components/nav-header";
import { CourseBreadcrumb } from "@/components/course-breadcrumb";
import { CourseInsightsPanel } from "@/components/course-insights-panel";
import { ThreadCard } from "@/components/thread-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseThreads, useCourseInsights, useCourse } from "@/lib/api/hooks";
import { BookOpen } from "lucide-react";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: threads, isLoading: threadsLoading } = useCourseThreads(courseId);
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useCourseInsights(courseId);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Breadcrumb */}
        <CourseBreadcrumb
          items={[
            { label: "Courses", href: "/courses" },
            { label: courseLoading ? "..." : course?.code || courseId },
          ]}
          className="mb-6"
        />

        {/* Course Header */}
        {courseLoading ? (
          <Skeleton className="h-24 w-full mb-8" />
        ) : course ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
            <p className="text-sm text-muted-foreground mb-1">{course.code} • {course.term}</p>
            <p className="text-sm text-foreground/80">{course.description}</p>
          </div>
        ) : null}

        {/* Insights Panel */}
        {insights && (
          <CourseInsightsPanel
            insights={insights}
            isLoading={insightsLoading}
            error={insightsError}
            className="mb-8"
          />
        )}

        {/* Threads List */}
        <div>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Discussions
          </h2>
          {threadsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : threads && threads.length > 0 ? (
            <div className="space-y-4">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                No discussions yet
              </p>
              <p className="text-sm text-muted-foreground">
                Be the first to start a conversation
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

**Estimated Lines:** ~95 LoC

---

## React Query Hooks Required

### New Hooks to Add (in lib/api/hooks.ts)

```typescript
/**
 * Fetch single course by ID
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ["course", courseId] as const,
    queryFn: () => api.getCourse(courseId),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Note:** All other hooks (useUserCourses, useCourseThreads, useNotifications, useCourseInsights) already defined in API design plan.

---

## File Structure Summary

### New Files to Create

```
components/
├── course-card.tsx                    (~120 LoC)
├── course-dashboard-grid.tsx          (~80 LoC)
├── notification-badge.tsx             (~65 LoC)
├── course-insights-panel.tsx          (~145 LoC)
└── course-breadcrumb.tsx              (~40 LoC)

app/
├── courses/
│   ├── page.tsx                       (~55 LoC)
│   └── [id]/
│       └── page.tsx                   (~95 LoC)
```

**Total New LoC:** ~600 lines
**Total New Files:** 7 files

---

## Implementation Order

### Phase 1: Base Components (30 min)
1. **NotificationBadge** - Smallest, no dependencies
2. **CourseBreadcrumb** - Simple navigation component
3. Run `npx tsc --noEmit` to verify types

### Phase 2: Card Components (45 min)
4. **CourseCard** - Core component (uses NotificationBadge)
5. **CourseDashboardGrid** - Layout wrapper (uses CourseCard)
6. Run `npx tsc --noEmit` and `npm run lint`

### Phase 3: Complex Components (30 min)
7. **CourseInsightsPanel** - AI insights display
8. Run `npx tsc --noEmit` and `npm run lint`

### Phase 4: Pages (30 min)
9. **app/courses/page.tsx** - Dashboard page
10. **app/courses/[id]/page.tsx** - Detail page
11. Add `useCourse()` hook to lib/api/hooks.ts
12. Run `npm run build` to verify production build

### Phase 5: Navigation Integration (15 min)
13. Update **NavHeader** to include Courses link with NotificationBadge
14. Update **app/threads/[id]/page.tsx** to add course breadcrumb (optional)

### Phase 6: Testing (30 min)
15. Manual testing: navigate through all routes
16. Verify keyboard navigation
17. Test loading/error/empty states
18. Check responsive breakpoints (360px, 768px, 1024px)
19. Run accessibility audit (axe DevTools)

**Total Time Estimate:** 3 hours

---

## Usage Examples

### Example 1: Basic CourseCard

```tsx
import { CourseCard } from "@/components/course-card";

const course = {
  id: "course-cs101",
  code: "CS101",
  name: "Introduction to Computer Science",
  term: "Fall 2025",
  description: "...",
  instructorIds: ["user-1"],
  enrollmentCount: 156,
  status: "active",
  createdAt: "2025-08-15T00:00:00Z",
};

<CourseCard
  course={course}
  unreadCount={5}
  metrics={{
    threadCount: 42,
    activeStudents: 28,
    recentActivity: 7,
  }}
/>
```

### Example 2: CourseDashboardGrid with Loading

```tsx
import { CourseDashboardGrid } from "@/components/course-dashboard-grid";

const { data: courses, isLoading } = useUserCourses(userId);

<CourseDashboardGrid
  courses={courses || []}
  isLoading={isLoading}
  notificationCounts={{
    "course-cs101": 5,
    "course-math221": 2,
  }}
/>
```

### Example 3: NotificationBadge Variants

```tsx
import { NotificationBadge } from "@/components/notification-badge";

// Small primary badge
<NotificationBadge count={3} size="sm" variant="primary" />

// Large danger badge (top-right positioned)
<div className="relative">
  <Button>Notifications</Button>
  <NotificationBadge count={99} size="lg" variant="danger" position="top-right" />
</div>

// Warning badge with custom max
<NotificationBadge count={150} max={50} variant="warning" />
// Displays: "50+"
```

### Example 4: CourseInsightsPanel with Callback

```tsx
import { CourseInsightsPanel } from "@/components/course-insights-panel";
import { useRouter } from "next/navigation";

const router = useRouter();
const { data: insights } = useCourseInsights(courseId);

<CourseInsightsPanel
  insights={insights}
  onQuestionClick={(questionTitle) => {
    // Find thread by title and navigate
    const thread = threads.find(t => t.title === questionTitle);
    if (thread) {
      router.push(`/threads/${thread.id}`);
    }
  }}
/>
```

### Example 5: CourseBreadcrumb

```tsx
import { CourseBreadcrumb } from "@/components/course-breadcrumb";

<CourseBreadcrumb
  items={[
    { label: "Courses", href: "/courses" },
    { label: "CS101", href: "/courses/course-cs101" },
    { label: "Binary Search Question" }, // Current page (no href)
  ]}
/>
```

---

## Test Scenarios

### Scenario 1: Dashboard Page Load

**User Story:** Student visits /courses for first time

**Steps:**
1. Navigate to `/courses`
2. Verify loading skeletons appear
3. Wait for data fetch (200-500ms)
4. Verify 3 CourseCard components render
5. Verify notification badges show correct counts
6. Verify metrics display (threads, students, activity)

**Expected:**
- 3 courses in grid
- CS101 has 5 notifications (red badge)
- MATH221 has 2 notifications
- Grid is 1 column on mobile, 2 on tablet, 3 on desktop

### Scenario 2: Empty State

**User Story:** User with no enrollments

**Steps:**
1. Mock `useUserCourses()` to return empty array
2. Navigate to `/courses`
3. Verify empty state appears

**Expected:**
- BookOpen icon in muted background
- "No courses found" heading
- Descriptive text

### Scenario 3: Error State

**User Story:** API failure

**Steps:**
1. Mock `useUserCourses()` to throw error
2. Navigate to `/courses`
3. Verify error state appears

**Expected:**
- Danger icon
- "Failed to load courses" heading
- Error message displayed

### Scenario 4: Course Detail Navigation

**User Story:** Student clicks CourseCard

**Steps:**
1. Click CS101 CourseCard
2. Verify navigation to `/courses/course-cs101`
3. Verify breadcrumb shows: Courses > CS101
4. Verify course header displays
5. Verify insights panel loads
6. Verify threads list filtered by courseId

**Expected:**
- URL changes to `/courses/course-cs101`
- Breadcrumb correct
- 5 threads shown (only CS101 threads)
- AI insights panel visible

### Scenario 5: Notification Badge Visibility

**User Story:** Badge shows/hides based on count

**Test Cases:**
- count = 0 → Badge hidden (returns null)
- count = 1 → Badge shows "1"
- count = 99 → Badge shows "99"
- count = 100 → Badge shows "99+"
- count = 1000 → Badge shows "99+"

### Scenario 6: Keyboard Navigation

**User Story:** User navigates with keyboard only

**Steps:**
1. Tab to first CourseCard
2. Verify focus ring visible
3. Press Enter to navigate
4. Verify navigation works
5. Tab through insights panel
6. Verify top question buttons focusable

**Expected:**
- All interactive elements keyboard accessible
- Focus ring visible (QDS focus-visible styles)
- Enter/Space activate links

### Scenario 7: Responsive Layout

**User Story:** User resizes browser window

**Breakpoint Tests:**
- 360px (mobile): 1 column grid
- 768px (tablet): 2 column grid
- 1024px (desktop): 3 column grid
- 1280px (large): 3 column grid (no 4th column)

**Expected:**
- Grid adjusts automatically
- No horizontal scroll
- Text wraps correctly

### Scenario 8: AI Insights Loading

**User Story:** Insights take 600-800ms to load

**Steps:**
1. Navigate to course detail page
2. Verify insights panel shows skeleton
3. Wait for data (600-800ms)
4. Verify panel populates with data

**Expected:**
- Skeleton shown during loading
- Smooth transition to data
- "Updated X ago" timestamp correct

### Scenario 9: Top Question Click

**User Story:** User clicks top question in insights

**Steps:**
1. Click "Binary search vs linear search" in top questions
2. Verify navigation to thread detail
3. Verify thread displayed correctly

**Expected:**
- Navigation to `/threads/{threadId}`
- Thread title matches clicked question
- Back button works

### Scenario 10: Multi-Course Enrollment

**User Story:** Instructor enrolled in 5 courses

**Steps:**
1. Mock 5 courses for instructor
2. Navigate to `/courses`
3. Verify all 5 courses displayed
4. Verify instructor avatars show on cards
5. Verify metrics differ per course

**Expected:**
- 5 CourseCard components
- Different notification counts
- Different metrics (threads, students)
- Grid layout responsive

---

## Accessibility Checklist

### WCAG 2.2 AA Compliance

- [ ] **Keyboard Navigation:** All interactive elements keyboard accessible
- [ ] **Focus Indicators:** Visible focus ring on all focusable elements
- [ ] **Color Contrast:** All text meets 4.5:1 minimum ratio
- [ ] **Screen Reader Support:** ARIA labels on all interactive elements
- [ ] **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3)
- [ ] **Link Purpose:** Links have descriptive text or aria-label
- [ ] **Status Updates:** Notification badges use role="status"
- [ ] **Error Messages:** Error states have descriptive text
- [ ] **Loading States:** Loading indicators announced to screen readers
- [ ] **Touch Targets:** Interactive elements ≥44px on mobile

### Component-Specific

**CourseCard:**
- [ ] Link has aria-label with course + notification info
- [ ] Focus ring visible on entire card
- [ ] Enter/Space navigate to detail page

**NotificationBadge:**
- [ ] aria-label includes count + unit ("5 unread notifications")
- [ ] role="status" for screen reader announcement
- [ ] Hidden when count = 0 (not just visually)

**CourseInsightsPanel:**
- [ ] Headings properly nested (h3 for sections)
- [ ] Top question buttons have accessible names
- [ ] AI content clearly labeled as AI-generated

**CourseDashboardGrid:**
- [ ] Empty state text descriptive
- [ ] Error state text actionable
- [ ] Grid uses semantic HTML (not tables)

---

## QDS Compliance Checklist

### Color Tokens

- [ ] **Primary Colors:** Uses `primary`, `primary-hover`, `primary-pressed`
- [ ] **Support Colors:** Uses `success`, `warning`, `danger`, `info`
- [ ] **Neutrals:** Uses `muted`, `muted-foreground`, `border`
- [ ] **AI Colors:** Uses `ai-purple-{shade}` for AI panel
- [ ] **No Hardcoded Hex:** Zero instances of `#` in className strings

### Spacing Scale (4pt Grid)

- [ ] **Gap Utilities:** Uses `gap-1`, `gap-2`, `gap-4` (not custom values)
- [ ] **Padding:** Uses `p-4`, `px-6`, `py-8` (QDS scale)
- [ ] **Margin:** Uses `mb-2`, `mt-4` (QDS scale)
- [ ] **Space Between:** Uses `space-y-4`, `space-x-2` (QDS scale)

### Border Radius Scale

- [ ] **Cards:** Uses `rounded-xl` (12px)
- [ ] **Badges:** Uses `rounded-md` (6px)
- [ ] **Avatars:** Uses `rounded-full` (50%)
- [ ] **No Custom Radii:** No `rounded-[value]` syntax

### Shadow Scale

- [ ] **Cards:** Uses `shadow-sm`, `shadow-e1`, `shadow-e2`
- [ ] **Hover States:** Uses `hover:shadow-e2`
- [ ] **AI Panel:** Uses `shadow-ai-sm`, `shadow-ai-md`
- [ ] **No Custom Shadows:** No `shadow-[value]` syntax

### Typography

- [ ] **Font Family:** Uses Geist Sans (default, no override needed)
- [ ] **Font Sizes:** Uses `text-sm`, `text-base`, `text-lg`, `text-xl`
- [ ] **Font Weights:** Uses `font-medium`, `font-semibold`, `font-bold`
- [ ] **Line Height:** Uses `leading-tight`, `leading-relaxed`

---

## Performance Optimization

### Memoization Opportunities

**CourseDashboardGrid:**
```typescript
const filteredCourses = useMemo(() => {
  return courses.filter(c => c.status === 'active');
}, [courses]);
```

**Notification Count Calculation:**
```typescript
const notificationCounts = useMemo(() => {
  // ... existing logic
}, [notifications]);
```

### React.memo Candidates

**CourseCard:**
```typescript
export const CourseCard = React.memo(function CourseCard(props) {
  // ... component logic
});
```

**Reason:** Pure component, expensive to re-render if 10+ courses

**NotificationBadge:**
```typescript
export const NotificationBadge = React.memo(function NotificationBadge(props) {
  // ... component logic
});
```

**Reason:** Pure component, rendered multiple times

### Query Optimization

**Stale Times:**
- `useCourses()`: 10 min (rarely changes)
- `useUserCourses()`: 5 min (enrollments stable)
- `useCourseThreads()`: default (needs freshness)
- `useNotifications()`: 30 sec + polling (activity updates)
- `useCourseInsights()`: 5 min (expensive to generate)

**Prefetching:**
```typescript
// In NavHeader or app layout
useEffect(() => {
  if (user) {
    queryClient.prefetchQuery({
      queryKey: ["userCourses", user.id],
      queryFn: () => api.getUserCourses(user.id),
    });
  }
}, [user]);
```

---

## Edge Cases to Handle

### 1. No Courses Enrolled
**Handling:** Empty state in CourseDashboardGrid
**UX:** "No courses found" message + descriptive text

### 2. Course with No Threads
**Handling:** Empty state in course detail page
**UX:** "No discussions yet" message + CTA

### 3. Course with No Instructor Avatars
**Handling:** Hide avatar section in CourseCard
**UX:** Only show status badge

### 4. Notification Count = 0
**Handling:** NotificationBadge returns null
**UX:** Badge hidden completely (not just invisible)

### 5. Notification Count > 999
**Handling:** Display "99+" (default max=99)
**UX:** User knows there are many, exact count not critical

### 6. AI Insights Generation Fails
**Handling:** Error state in CourseInsightsPanel
**UX:** Show error message, don't hide entire panel

### 7. Course Status = 'archived'
**Handling:** Dimmed CourseCard (opacity-60)
**UX:** Badge shows "archived", card still clickable

### 8. Very Long Course Name
**Handling:** Text truncation with line-clamp-1
**UX:** Ellipsis (...) shows on overflow

### 9. No Trending Topics
**Handling:** Hide trending topics section
**UX:** Only show summary + top questions

### 10. User Not Logged In
**Handling:** Redirect to login or show empty state
**UX:** Clear message about authentication requirement

---

## Files to Modify (Beyond New Files)

### 1. NavHeader Component

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/nav-header.tsx`

**Add Courses Link:**
```tsx
import { NotificationBadge } from "@/components/notification-badge";
import { useNotifications, useCurrentUser } from "@/lib/api/hooks";

// Inside component:
const { data: currentUser } = useCurrentUser();
const { data: notifications } = useNotifications(currentUser?.id || '');

const unreadCount = notifications?.filter(n => !n.read).length || 0;

// In nav links:
<Link href="/courses" className={navLinkClasses}>
  <BookOpen className="h-5 w-5" />
  <span>Courses</span>
  {unreadCount > 0 && <NotificationBadge count={unreadCount} size="sm" />}
</Link>
```

**Estimated Changes:** +10 LoC

---

### 2. Thread Detail Page (Optional Enhancement)

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/threads/[id]/page.tsx`

**Add Course Breadcrumb:**
```tsx
import { CourseBreadcrumb } from "@/components/course-breadcrumb";
import { useCourse } from "@/lib/api/hooks";

// Inside component:
const { data: course } = useCourse(thread?.courseId || '');

// Before thread content:
{course && (
  <CourseBreadcrumb
    items={[
      { label: "Courses", href: "/courses" },
      { label: course.code, href: `/courses/${course.id}` },
      { label: thread.title },
    ]}
    className="mb-6"
  />
)}
```

**Estimated Changes:** +15 LoC

---

## Commit Strategy

### Commit 1: Base Components
```bash
git add components/notification-badge.tsx
git add components/course-breadcrumb.tsx
git commit -m "feat: add NotificationBadge and CourseBreadcrumb components"
```

### Commit 2: Course Card Components
```bash
git add components/course-card.tsx
git add components/course-dashboard-grid.tsx
git commit -m "feat: add CourseCard and CourseDashboardGrid components"
```

### Commit 3: Insights Panel
```bash
git add components/course-insights-panel.tsx
git commit -m "feat: add CourseInsightsPanel component"
```

### Commit 4: Pages and Routing
```bash
git add app/courses/page.tsx
git add app/courses/[id]/page.tsx
git add lib/api/hooks.ts  # useCourse hook
git commit -m "feat: add course dashboard and detail pages"
```

### Commit 5: Navigation Integration
```bash
git add components/nav-header.tsx
git commit -m "feat: integrate course navigation with NotificationBadge"
```

---

## Success Criteria

### Functional Requirements
- [ ] All course dashboard routes render without console errors in prod build
- [ ] Students can view enrolled courses with activity counts
- [ ] Instructors see additional metrics per course
- [ ] Notification badges display unread counts correctly
- [ ] AI insights generate per-course summaries
- [ ] Clicking course navigates to course-specific threads
- [ ] Clicking top question navigates to thread detail

### Technical Requirements
- [ ] All components props-driven (zero hardcoded values)
- [ ] TypeScript strict mode compliance (zero `any` types)
- [ ] All components <200 LoC (split if larger)
- [ ] Uses shadcn/ui primitives (no new installations)
- [ ] React Query for all data fetching
- [ ] QDS token usage (no hardcoded colors/spacing)

### Quality Requirements
- [ ] Accessibility: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280px
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Bundle size <200KB per route
- [ ] Loading states for all async data
- [ ] Error states for all API failures
- [ ] Empty states for zero data

---

## Risk Assessment

### Low Risk
- Component structure follows existing patterns (ThreadCard)
- Uses established primitives (Card, Badge, Avatar)
- React Query hooks already designed (API plan)
- No breaking changes to existing code

### Medium Risk
- Navigation integration (NavHeader modification)
- Query invalidation on notifications (test thoroughly)
- AI insights performance (600-800ms delay)

### Mitigation Strategies
- **Navigation:** Use feature flag to toggle courses link
- **Invalidation:** Add comprehensive test scenarios
- **Performance:** Cache insights for 5 min, show loading state

---

## Next Steps After Implementation

1. **Manual Testing:** Walk through all user flows
2. **Accessibility Audit:** Run axe DevTools on all pages
3. **Performance Check:** Verify bundle sizes
4. **Responsive Testing:** Test on real devices (360px, 768px, 1024px)
5. **Error Handling:** Test API failures and network errors
6. **Documentation:** Update README with new routes
7. **Demo Script:** Add course dashboard to demo walkthrough

---

**Plan Created:** 2025-10-04
**Created By:** Component Architect (Sub-Agent)
**Status:** READY FOR IMPLEMENTATION
**Estimated Implementation Time:** 3 hours
**Risk Level:** LOW

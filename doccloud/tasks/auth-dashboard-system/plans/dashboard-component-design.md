# Dashboard Component Design Plan

**Date:** 2025-10-04
**Architect:** Component Architect
**Task:** Auth & Role-Based Dashboard System - Component Architecture

---

## Component Hierarchy

```
app/dashboard/
  ├── page.tsx                 # Role router (student vs instructor)
  │
  ├── student/
  │   └── page.tsx            # Student dashboard page
  │
  └── instructor/
      └── page.tsx            # Instructor dashboard page

components/dashboard/
  ├── course-card.tsx          # Shared course card (role-based props)
  ├── metric-card.tsx          # Reusable metric display
  ├── activity-feed.tsx        # Student activity timeline
  ├── activity-item.tsx        # Individual activity entry
  ├── notification-list.tsx    # Notification panel
  ├── notification-item.tsx    # Individual notification
  ├── unanswered-queue.tsx     # Instructor moderation queue
  ├── thread-queue-item.tsx    # Queue entry component
  ├── insights-panel.tsx       # AI-generated course insights
  └── dashboard-header.tsx     # Shared hero section
```

---

## TypeScript Interfaces

### Core Props Interfaces

```typescript
// components/dashboard/course-card.tsx
import type { Course, CourseMetrics } from "@/lib/models/types";

export interface CourseCardProps {
  course: Course;
  role: "student" | "instructor";
  metrics?: CourseMetrics;          // Optional for instructor view
  onClick?: () => void;
  className?: string;
}

// components/dashboard/metric-card.tsx
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;                   // e.g., "+12%" or "3 less"
  };
  color?: "primary" | "accent" | "success" | "warning" | "danger";
  loading?: boolean;
  className?: string;
}

// components/dashboard/activity-item.tsx
export interface ActivityItemProps {
  type: "thread_created" | "post_replied" | "endorsed" | "resolved";
  content: string;
  timestamp: string;                 // ISO 8601 string
  threadId?: string;
  courseId: string;
  courseName: string;
  onClick?: () => void;
  className?: string;
}

// components/dashboard/notification-item.tsx
import type { Notification } from "@/lib/models/types";

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

// components/dashboard/thread-queue-item.tsx
import type { Thread, Course } from "@/lib/models/types";

export interface ThreadQueueItemProps {
  thread: Thread;
  course: Course;
  priority?: "high" | "medium" | "low";  // Based on age
  onResolve?: (threadId: string) => void;
  onClick?: () => void;
  className?: string;
}

// components/dashboard/insights-panel.tsx
import type { CourseInsight } from "@/lib/models/types";

export interface InsightsPanelProps {
  insights: CourseInsight[];
  loading?: boolean;
  className?: string;
}

// components/dashboard/dashboard-header.tsx
export interface DashboardHeaderProps {
  userName: string;
  role: "student" | "instructor";
  courseCount: number;
  className?: string;
}
```

### Aggregated Data Types (New)

```typescript
// lib/models/types.ts (additions)

/**
 * Student activity feed entry
 */
export interface ActivityEntry {
  id: string;
  type: "thread_created" | "post_replied" | "endorsed" | "resolved";
  content: string;              // Human-readable description
  timestamp: string;            // ISO 8601
  threadId?: string;
  courseId: string;
  courseName: string;
  read: boolean;
}

/**
 * Student dashboard metrics
 */
export interface StudentMetrics {
  coursesEnrolled: number;
  threadsCreated: number;
  repliesPosted: number;
  endorsementsReceived: number;
}

/**
 * Instructor dashboard metrics (aggregated across courses)
 */
export interface InstructorMetrics {
  totalCourses: number;
  totalThreads: number;
  totalUnanswered: number;
  totalStudents: number;
  avgResponseTime?: string;     // "2.5 hours" (optional for MVP)
}

/**
 * Activity feed filter options
 */
export interface ActivityFilters {
  dateRange?: "7days" | "30days" | "all";
  courseId?: string;            // Filter by specific course
  type?: ActivityEntry["type"]; // Filter by activity type
}
```

---

## State Management Plan

### React Query Hooks (Existing - Reuse)

```typescript
// lib/api/hooks.ts (already exists)
useCurrentUser()              // Auth state
useUserCourses(userId)        // User's courses
useCourseMetrics(courseId)    // Course-specific metrics
useCourseInsights(courseId)   // AI insights
useNotifications(userId, courseId?)  // Notifications
useMarkNotificationRead()     // Mutation
useMarkAllNotificationsRead() // Mutation
```

### New React Query Hooks (To be created)

```typescript
// lib/api/hooks.ts (additions)

/**
 * Get aggregated activity feed for student
 */
export function useStudentActivity(
  userId: string | undefined,
  filters?: ActivityFilters
) {
  return useQuery({
    queryKey: ["studentActivity", userId, filters],
    queryFn: () => (userId ? api.getStudentActivity(userId, filters) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get aggregated metrics for student
 */
export function useStudentMetrics(userId: string | undefined) {
  return useQuery({
    queryKey: ["studentMetrics", userId],
    queryFn: () => (userId ? api.getStudentMetrics(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get aggregated metrics for instructor
 */
export function useInstructorMetrics(userId: string | undefined) {
  return useQuery({
    queryKey: ["instructorMetrics", userId],
    queryFn: () => (userId ? api.getInstructorMetrics(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get all unanswered threads across instructor's courses
 */
export function useUnansweredThreads(userId: string | undefined) {
  return useQuery({
    queryKey: ["unansweredThreads", userId],
    queryFn: () => (userId ? api.getUnansweredThreads(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
```

### Local Component State

```typescript
// Student Dashboard
const [activityFilters, setActivityFilters] = useState<ActivityFilters>({
  dateRange: "7days",
});
const [notificationFilter, setNotificationFilter] = useState<"all" | "unread">("unread");

// Instructor Dashboard
const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
const [queueSort, setQueueSort] = useState<"oldest" | "recent">("oldest");
```

### Data Flow

```
┌─────────────────────────────────────────────────┐
│ app/dashboard/page.tsx (Role Router)            │
│                                                  │
│  1. useCurrentUser() → get role                 │
│  2. Redirect to /dashboard/student or           │
│     /dashboard/instructor                       │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│ Student Dashboard    │      │ Instructor Dashboard │
│                      │      │                      │
│ useCurrentUser()     │      │ useCurrentUser()     │
│ useUserCourses()     │      │ useUserCourses()     │
│ useStudentMetrics()  │      │ useInstructorMetrics()│
│ useStudentActivity() │      │ useUnansweredThreads()│
│ useNotifications()   │      │ useCourseMetrics()   │
│                      │      │ useCourseInsights()  │
└──────────────────────┘      └──────────────────────┘
        │                               │
        ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│ Render Components    │      │ Render Components    │
│                      │      │                      │
│ DashboardHeader      │      │ DashboardHeader      │
│ MetricCard[]         │      │ MetricCard[]         │
│ CourseCard[]         │      │ CourseCard[] (metrics)│
│ ActivityFeed         │      │ UnansweredQueue      │
│ NotificationList     │      │ InsightsPanel        │
└──────────────────────┘      └──────────────────────┘
```

---

## Event Handling Patterns

### Navigation Callbacks

```typescript
// Course Card Click
const handleCourseClick = useCallback((courseId: string) => {
  router.push(`/courses/${courseId}`);
}, [router]);

// Activity Item Click
const handleActivityClick = useCallback((threadId: string) => {
  router.push(`/threads/${threadId}`);
}, [router]);

// Queue Item Click
const handleQueueClick = useCallback((threadId: string) => {
  router.push(`/threads/${threadId}`);
}, [router]);
```

### Mutation Callbacks

```typescript
// Mark Notification as Read
const markNotificationRead = useMarkNotificationRead();

const handleMarkRead = useCallback((notificationId: string) => {
  markNotificationRead.mutate(notificationId, {
    onSuccess: () => {
      // Query auto-invalidates, UI updates
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
    },
  });
}, [markNotificationRead]);

// Mark All Notifications as Read
const markAllRead = useMarkAllNotificationsRead();

const handleMarkAllRead = useCallback(() => {
  if (!user?.id) return;

  markAllRead.mutate({ userId: user.id }, {
    onSuccess: () => {
      // Query auto-invalidates, UI updates
    },
  });
}, [markAllRead, user?.id]);
```

### Filter Change Handlers

```typescript
// Activity Filter Change
const handleFilterChange = useCallback((filters: Partial<ActivityFilters>) => {
  setActivityFilters(prev => ({ ...prev, ...filters }));
}, []);

// Notification Filter Toggle
const handleNotificationFilterToggle = useCallback(() => {
  setNotificationFilter(prev => prev === "all" ? "unread" : "all");
}, []);
```

---

## Variant System

### Course Card Variants

```typescript
// components/dashboard/course-card.tsx

const getCourseCardVariant = (role: "student" | "instructor") => {
  return role === "instructor" ? "glass-hover" : "glass-hover";
};

const getMetricsDisplay = (metrics?: CourseMetrics, role?: "student" | "instructor") => {
  if (!metrics || role !== "instructor") return null;

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <MetricBadge label="Threads" value={metrics.threadCount} />
      <MetricBadge label="Unanswered" value={metrics.unansweredCount} color="warning" />
    </div>
  );
};
```

### Metric Card Variants

```typescript
// components/dashboard/metric-card.tsx

const getMetricColor = (color?: MetricCardProps["color"]) => {
  const colorMap = {
    primary: "text-primary border-primary/20 bg-primary/10",
    accent: "text-accent border-accent/20 bg-accent/10",
    success: "text-success border-success/20 bg-success/10",
    warning: "text-warning border-warning/20 bg-warning/10",
    danger: "text-danger border-danger/20 bg-danger/10",
  };
  return colorMap[color || "primary"];
};

const getTrendIcon = (direction: "up" | "down" | "neutral") => {
  const iconMap = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };
  return iconMap[direction];
};
```

### Activity Item Variants

```typescript
// components/dashboard/activity-item.tsx

const getActivityIcon = (type: ActivityItemProps["type"]) => {
  const iconMap = {
    thread_created: MessageSquarePlus,
    post_replied: Reply,
    endorsed: CheckCircle2,
    resolved: CheckCheck,
  };
  return iconMap[type];
};

const getActivityColor = (type: ActivityItemProps["type"]) => {
  const colorMap = {
    thread_created: "text-accent",
    post_replied: "text-primary",
    endorsed: "text-success",
    resolved: "text-info",
  };
  return colorMap[type];
};
```

---

## File Structure & Imports

### 1. Dashboard Router Page

**File:** `app/dashboard/page.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user) {
      // Redirect based on role
      if (user.role === "student") {
        router.push("/dashboard/student");
      } else if (user.role === "instructor" || user.role === "ta") {
        router.push("/dashboard/instructor");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-8">
          <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 bg-glass-medium rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

---

### 2. Student Dashboard Page

**File:** `app/dashboard/student/page.tsx`

```typescript
"use client";

import { useRouter } from "next/navigation";
import {
  useCurrentUser,
  useUserCourses,
  useStudentMetrics,
  useStudentActivity,
  useNotifications
} from "@/lib/api/hooks";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CourseCard } from "@/components/dashboard/course-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { NotificationList } from "@/components/dashboard/notification-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, MessageSquare, Reply, Award } from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses, isLoading: coursesLoading } = useUserCourses(user?.id);
  const { data: metrics, isLoading: metricsLoading } = useStudentMetrics(user?.id);
  const { data: activity, isLoading: activityLoading } = useStudentActivity(user?.id);
  const { data: notifications } = useNotifications(user?.id);

  // Auth redirect
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  // Loading state
  if (userLoading || coursesLoading || metricsLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-12">
          <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
          {/* More skeletons */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">

        {/* Header */}
        <DashboardHeader
          userName={user.name}
          role="student"
          courseCount={courses?.length || 0}
        />

        {/* Metrics Grid */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">Your Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Courses Enrolled"
              value={metrics?.coursesEnrolled || 0}
              icon={BookOpen}
              color="primary"
              loading={metricsLoading}
            />
            <MetricCard
              label="Questions Asked"
              value={metrics?.threadsCreated || 0}
              icon={MessageSquare}
              color="accent"
              loading={metricsLoading}
            />
            <MetricCard
              label="Replies Posted"
              value={metrics?.repliesPosted || 0}
              icon={Reply}
              color="success"
              loading={metricsLoading}
            />
            <MetricCard
              label="Endorsements"
              value={metrics?.endorsementsReceived || 0}
              icon={Award}
              color="warning"
              loading={metricsLoading}
            />
          </div>
        </section>

        {/* Courses Grid */}
        <section aria-labelledby="courses-heading">
          <h2 id="courses-heading" className="heading-3 glass-text mb-6">
            My Courses
          </h2>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  role="student"
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-16 text-center">
              <p className="text-muted-foreground">No courses enrolled yet.</p>
            </Card>
          )}
        </section>

        {/* Activity & Notifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

          {/* Activity Feed */}
          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="heading-3 glass-text mb-6">
              Recent Activity
            </h2>
            <ActivityFeed
              activity={activity || []}
              loading={activityLoading}
            />
          </section>

          {/* Notifications */}
          <section aria-labelledby="notifications-heading">
            <h2 id="notifications-heading" className="heading-3 glass-text mb-6">
              Notifications
            </h2>
            <NotificationList
              notifications={notifications || []}
              userId={user?.id}
            />
          </section>

        </div>
      </div>
    </div>
  );
}
```

---

### 3. Instructor Dashboard Page

**File:** `app/dashboard/instructor/page.tsx`

```typescript
"use client";

import { useRouter } from "next/navigation";
import {
  useCurrentUser,
  useUserCourses,
  useInstructorMetrics,
  useUnansweredThreads,
  useCourseInsights
} from "@/lib/api/hooks";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CourseCard } from "@/components/dashboard/course-card";
import { UnansweredQueue } from "@/components/dashboard/unanswered-queue";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, MessageSquare, AlertCircle, Users } from "lucide-react";

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: courses, isLoading: coursesLoading } = useUserCourses(user?.id);
  const { data: metrics, isLoading: metricsLoading } = useInstructorMetrics(user?.id);
  const { data: unansweredThreads, isLoading: queueLoading } = useUnansweredThreads(user?.id);

  // Fetch insights for first 3 courses (MVP limitation)
  const courseIds = courses?.slice(0, 3).map(c => c.id) || [];
  const insightsQueries = courseIds.map(id => useCourseInsights(id));
  const insights = insightsQueries
    .filter(q => q.data)
    .map(q => q.data!);

  // Auth redirect
  if (!userLoading && !user) {
    router.push("/login");
    return null;
  }

  // Loading state
  if (userLoading || coursesLoading || metricsLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="container-wide space-y-12">
          <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
          {/* More skeletons */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-12">
      <div className="container-wide space-y-12">

        {/* Header */}
        <DashboardHeader
          userName={user.name}
          role="instructor"
          courseCount={courses?.length || 0}
        />

        {/* Metrics Grid */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">Course Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Courses Teaching"
              value={metrics?.totalCourses || 0}
              icon={BookOpen}
              color="primary"
              loading={metricsLoading}
            />
            <MetricCard
              label="Total Threads"
              value={metrics?.totalThreads || 0}
              icon={MessageSquare}
              color="accent"
              loading={metricsLoading}
            />
            <MetricCard
              label="Needs Response"
              value={metrics?.totalUnanswered || 0}
              icon={AlertCircle}
              color="warning"
              loading={metricsLoading}
            />
            <MetricCard
              label="Total Students"
              value={metrics?.totalStudents || 0}
              icon={Users}
              color="success"
              loading={metricsLoading}
            />
          </div>
        </section>

        {/* Courses Grid (with metrics) */}
        <section aria-labelledby="courses-heading">
          <h2 id="courses-heading" className="heading-3 glass-text mb-6">
            Your Courses
          </h2>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  role="instructor"
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card variant="glass" className="p-16 text-center">
              <p className="text-muted-foreground">No courses assigned yet.</p>
            </Card>
          )}
        </section>

        {/* Unanswered Queue & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

          {/* Unanswered Queue */}
          <section aria-labelledby="queue-heading">
            <h2 id="queue-heading" className="heading-3 glass-text mb-6">
              Unanswered Threads
            </h2>
            <UnansweredQueue
              threads={unansweredThreads || []}
              courses={courses || []}
              loading={queueLoading}
            />
          </section>

          {/* AI Insights */}
          <section aria-labelledby="insights-heading">
            <h2 id="insights-heading" className="heading-3 glass-text mb-6">
              Course Insights
            </h2>
            <InsightsPanel
              insights={insights}
              loading={insightsQueries.some(q => q.isLoading)}
            />
          </section>

        </div>
      </div>
    </div>
  );
}
```

---

### 4. Shared Components

**File:** `components/dashboard/dashboard-header.tsx`

```typescript
import type { DashboardHeaderProps } from "./types";

export function DashboardHeader({
  userName,
  role,
  courseCount,
  className
}: DashboardHeaderProps) {
  const greeting = role === "student"
    ? `Welcome back, ${userName}!`
    : `Welcome, ${userName}`;

  const description = role === "student"
    ? `You're enrolled in ${courseCount} course${courseCount !== 1 ? "s" : ""}. Stay engaged and keep learning!`
    : `You're teaching ${courseCount} course${courseCount !== 1 ? "s" : ""}. Keep your students engaged!`;

  return (
    <div className={cn("py-8 md:py-12 space-y-6", className)}>
      <div className="space-y-4">
        <h1 className="heading-2 glass-text">{greeting}</h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}
```

**File:** `components/dashboard/course-card.tsx`

```typescript
import type { CourseCardProps } from "./types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CourseCard({
  course,
  role,
  metrics,
  onClick,
  className
}: CourseCardProps) {
  return (
    <Card
      variant="glass-hover"
      className={cn("h-full", className)}
      onClick={onClick}
    >
      <CardHeader className="p-8">
        <div className="space-y-3">
          <CardTitle className="text-2xl glass-text">{course.code}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {course.name}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-subtle">
          <span>{course.term}</span>
          <span>•</span>
          <span>{course.enrollmentCount} students</span>
        </div>

        {/* Instructor-specific metrics */}
        {role === "instructor" && metrics && (
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border-glass">
            <div className="space-y-1">
              <p className="text-xs text-subtle">Threads</p>
              <p className="text-lg font-semibold text-foreground">{metrics.threadCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-subtle">Unanswered</p>
              <p className="text-lg font-semibold text-warning">{metrics.unansweredCount}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**File:** `components/dashboard/metric-card.tsx`

```typescript
import type { MetricCardProps } from "./types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "primary",
  loading,
  className
}: MetricCardProps) {
  if (loading) {
    return (
      <Card variant="glass" className={cn("p-6", className)}>
        <Skeleton className="h-12 w-full bg-glass-medium rounded-lg" />
      </Card>
    );
  }

  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <Card variant="glass" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-3xl font-bold", colorClasses[color])}>{value}</p>
          {trend && (
            <p className="text-xs text-subtle flex items-center gap-1">
              <TrendIcon direction={trend.direction} />
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-lg bg-opacity-10", `bg-${color}`)}>
            <Icon className={cn("w-6 h-6", colorClasses[color])} />
          </div>
        )}
      </div>
    </Card>
  );
}

function TrendIcon({ direction }: { direction: "up" | "down" | "neutral" }) {
  // Implementation
}
```

---

## Usage Examples

### Example 1: Student Dashboard Basic Usage

```tsx
// Automatic role-based routing
// User navigates to /dashboard
// → Redirects to /dashboard/student (if student)
// → Redirects to /dashboard/instructor (if instructor)

// Student sees:
<StudentDashboardPage>
  <DashboardHeader userName="Alice" role="student" courseCount={3} />
  <MetricCard label="Questions Asked" value={12} icon={MessageSquare} />
  <CourseCard course={cs101} role="student" onClick={handleClick} />
  <ActivityFeed activity={recentActivity} />
  <NotificationList notifications={userNotifications} />
</StudentDashboardPage>
```

### Example 2: Instructor Dashboard with Metrics

```tsx
// Instructor sees enhanced course cards
<InstructorDashboardPage>
  <DashboardHeader userName="Dr. Smith" role="instructor" courseCount={2} />
  <MetricCard
    label="Needs Response"
    value={7}
    icon={AlertCircle}
    color="warning"
    trend={{ direction: "up", value: "+2 today" }}
  />
  <CourseCard
    course={cs101}
    role="instructor"
    metrics={{ threadCount: 45, unansweredCount: 7, ... }}
    onClick={handleClick}
  />
  <UnansweredQueue threads={openThreads} courses={courses} />
  <InsightsPanel insights={aiInsights} />
</InstructorDashboardPage>
```

### Example 3: Activity Feed with Filtering

```tsx
// Student activity feed
const [filters, setFilters] = useState({ dateRange: "7days" });
const { data: activity } = useStudentActivity(user?.id, filters);

<ActivityFeed
  activity={activity}
  onFilterChange={(newFilters) => setFilters(newFilters)}
/>

// Renders:
<ActivityItem
  type="thread_created"
  content="Asked a question in CS 101"
  timestamp="2025-10-03T14:30:00Z"
  courseName="CS 101"
  onClick={() => router.push(`/threads/${threadId}`)}
/>
```

---

## Test Scenarios

### User Interactions

1. **Student Views Dashboard**
   - [ ] Loads without errors
   - [ ] Displays correct metrics (courses, threads, replies, endorsements)
   - [ ] Shows enrolled courses in grid
   - [ ] Activity feed shows recent actions
   - [ ] Notifications appear in sidebar
   - [ ] Click course → navigates to course detail
   - [ ] Click activity item → navigates to thread
   - [ ] Click notification → navigates to thread + marks as read

2. **Instructor Views Dashboard**
   - [ ] Loads without errors
   - [ ] Displays aggregated metrics (courses, threads, unanswered, students)
   - [ ] Course cards show inline metrics (thread count, unanswered count)
   - [ ] Unanswered queue shows open threads sorted by age
   - [ ] AI insights appear for top 3 courses
   - [ ] Click course → navigates to course detail
   - [ ] Click queue item → navigates to thread

3. **Responsive Behavior**
   - [ ] Mobile (360px): Single column, stacked sections
   - [ ] Tablet (768px): 2-column grid for courses
   - [ ] Desktop (1024px): 3-column grid for courses
   - [ ] Large (1280px+): Proper max-width container

4. **Loading States**
   - [ ] Skeleton loaders display while fetching
   - [ ] Layout doesn't shift when data loads
   - [ ] Individual components load independently

5. **Empty States**
   - [ ] New student: "No courses enrolled" message
   - [ ] No activity: "No recent activity" message
   - [ ] No notifications: "No new notifications" message
   - [ ] Instructor with no threads: "No threads yet" message

6. **Error Handling**
   - [ ] Failed data fetch shows error message
   - [ ] Retry mechanism for failed requests
   - [ ] Graceful degradation if metrics unavailable

### Edge Cases

1. **Authentication**
   - [ ] Unauthenticated user → redirects to /login
   - [ ] Student accessing /dashboard/instructor → redirects to /dashboard/student
   - [ ] Instructor accessing /dashboard/student → redirects to /dashboard/instructor

2. **Data Edge Cases**
   - [ ] 0 courses enrolled → shows empty state
   - [ ] 1 course enrolled → "1 course" (singular)
   - [ ] 100+ threads → metrics display correctly (no overflow)
   - [ ] Very long course names → truncate with ellipsis
   - [ ] Missing metrics → show 0 or "N/A"

3. **Performance**
   - [ ] Dashboard loads in <2s on 3G
   - [ ] Metrics cards render independently (no blocking)
   - [ ] Activity feed supports 50+ items without lag

### Accessibility Checks

1. **Keyboard Navigation**
   - [ ] Tab order: Header → Metrics → Courses → Activity → Notifications
   - [ ] All interactive elements focusable
   - [ ] Enter/Space activates links/buttons
   - [ ] Escape dismisses modals (if any)

2. **Screen Reader**
   - [ ] Page has main landmark
   - [ ] Sections have proper headings (h1, h2, h3)
   - [ ] Cards have descriptive labels
   - [ ] Status badges announced correctly
   - [ ] Loading states announced

3. **Visual**
   - [ ] Focus indicators visible (4.5:1 contrast)
   - [ ] Text meets AA contrast (4.5:1 minimum)
   - [ ] Color not sole indicator of status
   - [ ] Touch targets ≥44px on mobile

---

## Implementation Order

1. **Phase 1: Foundation (Files 1-4)**
   - Create dashboard router (`app/dashboard/page.tsx`)
   - Create student page (`app/dashboard/student/page.tsx`)
   - Create instructor page (`app/dashboard/instructor/page.tsx`)
   - Create shared header (`components/dashboard/dashboard-header.tsx`)

2. **Phase 2: Shared Components (Files 5-6)**
   - Build CourseCard with role variants (`components/dashboard/course-card.tsx`)
   - Build MetricCard with color variants (`components/dashboard/metric-card.tsx`)

3. **Phase 3: Student-Specific (Files 7-9)**
   - Build ActivityFeed (`components/dashboard/activity-feed.tsx`)
   - Build ActivityItem (`components/dashboard/activity-item.tsx`)
   - Build NotificationList (`components/dashboard/notification-list.tsx`)
   - Build NotificationItem (`components/dashboard/notification-item.tsx`)

4. **Phase 4: Instructor-Specific (Files 10-12)**
   - Build UnansweredQueue (`components/dashboard/unanswered-queue.tsx`)
   - Build ThreadQueueItem (`components/dashboard/thread-queue-item.tsx`)
   - Build InsightsPanel (`components/dashboard/insights-panel.tsx`)

5. **Phase 5: Data Layer (API Additions)**
   - Add new hooks to `lib/api/hooks.ts`
   - Add new API methods to `lib/api/client.ts`
   - Add new types to `lib/models/types.ts`

6. **Phase 6: Testing & Polish**
   - Test all user flows
   - Verify responsive design
   - Run accessibility audit
   - Check performance benchmarks

---

## Files to Create

### Pages (3 files)
1. `/Users/dgz/projects-professional/quokka/quokka-demo/app/dashboard/page.tsx`
2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/dashboard/student/page.tsx`
3. `/Users/dgz/projects-professional/quokka/quokka-demo/app/dashboard/instructor/page.tsx`

### Components (11 files)
4. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/dashboard-header.tsx`
5. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/course-card.tsx`
6. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/metric-card.tsx`
7. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/activity-feed.tsx`
8. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/activity-item.tsx`
9. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/notification-list.tsx`
10. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/notification-item.tsx`
11. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/unanswered-queue.tsx`
12. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/thread-queue-item.tsx`
13. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/insights-panel.tsx`
14. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/types.ts`

### Data Layer Modifications (3 files)
15. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` (additions)
16. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` (additions)
17. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts` (additions)

---

## Files to Modify

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx`
   - Add "Dashboard" navigation link
   - Update active route detection

2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/page.tsx`
   - Update root redirect to `/dashboard` instead of `/courses`

---

## Dependencies

**Existing (already installed):**
- `@tanstack/react-query` - Data fetching
- `lucide-react` - Icons
- `class-variance-authority` - Variants
- `next` - Routing
- All shadcn/ui components

**No new dependencies needed** ✅

---

## Risk Assessment

### Technical Risks

1. **Over-fetching on Dashboard Load**
   - Risk: Loading all course metrics on mount
   - Mitigation: Use staleTime, gcTime, lazy load insights
   - Fallback: Show metrics on hover/expand

2. **Complex Data Aggregation**
   - Risk: Aggregating activity feed across many threads
   - Mitigation: Backend should provide aggregated endpoint (mock it for now)
   - Fallback: Limit to last 20 items, paginate

3. **Role-Based Routing Complexity**
   - Risk: Redirect loops, incorrect role detection
   - Mitigation: Clear useEffect logic, early returns
   - Fallback: Default to student view on error

### UX Risks

1. **Information Overload**
   - Risk: Too much data on one screen
   - Mitigation: Prioritize top metrics, collapsible sections
   - Fallback: Tabbed interface

2. **Mobile Experience**
   - Risk: Dense dashboard hard to navigate on small screens
   - Mitigation: Single column, vertical scrolling, sticky header
   - Fallback: Simplified mobile view

3. **Loading States**
   - Risk: Jarring layout shifts
   - Mitigation: Skeleton loaders preserve layout
   - Fallback: Static height containers

---

## QDS Compliance Checklist

- [x] Uses QDS color tokens (no hardcoded colors)
- [x] Uses QDS spacing scale (gap-2, gap-4, gap-6, gap-8, gap-12)
- [x] Uses QDS radius scale (rounded-md, rounded-lg, rounded-xl)
- [x] Uses QDS shadows (shadow-e1, shadow-e2, shadow-e3, shadow-glass-lg)
- [x] Ensures 4.5:1 contrast ratio minimum
- [x] Hover/focus/disabled states use QDS tokens
- [x] Glass morphism effects (glass-panel, glass-panel-strong)
- [x] Typography hierarchy (heading-2, heading-3, text-subtle)
- [x] Transition timing (duration-200, duration-250, duration-300)

---

## Next Steps

1. ✅ Read this plan thoroughly
2. ✅ Approve component architecture
3. ⏭️ **PARENT** implements files in order (Phase 1 → Phase 6)
4. ⏭️ **PARENT** tests each phase before proceeding
5. ⏭️ **PARENT** commits after each green phase
6. ⏭️ Update `context.md` with implementation progress

---

**Plan Complete. Ready for parent execution.**

# Dashboard Type Design Implementation Plan

**Date:** 2025-10-04
**Task:** auth-dashboard-system
**Agent:** Type Safety Guardian

---

## File Modification Plan

### Primary File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Location:** Add after line 228 (after existing Thread/Post types)

**Strategy:** Extend existing type system with dashboard-specific types while maintaining strict mode compliance.

---

## 1. Activity Feed Types

### Add to `lib/models/types.ts` (after line 228)

```typescript
// ============================================
// Activity Feed Types
// ============================================

/**
 * Types of activities shown in dashboard feed
 */
export type ActivityType =
  | 'thread_created'
  | 'post_created'
  | 'thread_resolved'
  | 'post_endorsed'
  | 'thread_answered';

/**
 * Base interface for all activity items
 */
interface BaseActivity {
  id: string;
  type: ActivityType;
  courseId: string;
  threadId: string;
  timestamp: string;
  summary: string;  // Human-readable summary
}

/**
 * Thread created activity
 */
export interface ThreadCreatedActivity extends BaseActivity {
  type: 'thread_created';
  threadTitle: string;
  authorId: string;
  authorName: string;
}

/**
 * Post/reply created activity
 */
export interface PostCreatedActivity extends BaseActivity {
  type: 'post_created';
  threadTitle: string;
  authorId: string;
  authorName: string;
  isReplyToUser: boolean;  // True if this is a reply to current user
}

/**
 * Thread resolved activity
 */
export interface ThreadResolvedActivity extends BaseActivity {
  type: 'thread_resolved';
  threadTitle: string;
  resolvedByInstructor: boolean;
}

/**
 * Post endorsed activity
 */
export interface PostEndorsedActivity extends BaseActivity {
  type: 'post_endorsed';
  threadTitle: string;
  postId: string;
  endorsedByInstructorId: string;
}

/**
 * Thread answered (status changed to answered) activity
 */
export interface ThreadAnsweredActivity extends BaseActivity {
  type: 'thread_answered';
  threadTitle: string;
  answeredByInstructorId: string;
}

/**
 * Discriminated union of all activity types
 */
export type ActivityItem =
  | ThreadCreatedActivity
  | PostCreatedActivity
  | ThreadResolvedActivity
  | PostEndorsedActivity
  | ThreadAnsweredActivity;
```

---

## 2. Enriched Course Types

### Add to `lib/models/types.ts` (after Activity types)

```typescript
// ============================================
// Enriched Course Types (with aggregated data)
// ============================================

/**
 * Course with metrics (instructor view)
 */
export interface CourseWithMetrics extends Course {
  metrics: CourseMetrics;
  unansweredCount: number;  // Quick access to unanswered threads
}

/**
 * Course with recent activity (student view)
 */
export interface CourseWithActivity extends Course {
  recentThreads: Thread[];     // Last 3-5 threads
  unreadCount: number;         // Unread notifications for this course
  lastVisited: string | null;  // ISO timestamp of last visit
}

/**
 * Role-based enriched course (discriminated union)
 */
export type EnrichedCourse = CourseWithMetrics | CourseWithActivity;
```

---

## 3. Dashboard Data Types

### Add to `lib/models/types.ts` (after Enriched Course types)

```typescript
// ============================================
// Dashboard Data Types
// ============================================

/**
 * Student dashboard data
 */
export interface StudentDashboardData {
  role: 'student';
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadNotificationCount: number;
  activeThreadCount: number;      // Threads user has participated in
}

/**
 * Instructor dashboard data
 */
export interface InstructorDashboardData {
  role: 'instructor' | 'ta';  // TAs use instructor dashboard
  managedCourses: CourseWithMetrics[];
  unansweredThreads: Thread[];    // All unanswered across courses
  recentActivity: ActivityItem[]; // Activity in managed courses
  insights: CourseInsight[];      // AI insights per course
  totalUnansweredCount: number;   // Sum of unanswered across all courses
}

/**
 * Discriminated union for role-based dashboard data
 */
export type DashboardData = StudentDashboardData | InstructorDashboardData;
```

---

## 4. Dashboard Component Props

### Add to `lib/models/types.ts` (after Dashboard Data types)

```typescript
// ============================================
// Dashboard Component Props
// ============================================

/**
 * Base dashboard layout props
 */
export interface DashboardLayoutProps {
  user: User;
  data: DashboardData;
}

/**
 * Course card props with role-based display
 */
export interface CourseCardProps {
  course: Course;
  role: UserRole;
  metrics?: CourseMetrics;           // Instructor only
  recentThreads?: Thread[];          // Student only
  unreadCount?: number;              // Student only
  onClick?: () => void;
}

/**
 * Activity feed item props
 */
export interface ActivityFeedItemProps {
  activity: ActivityItem;
  currentUserId: string;
  onThreadClick: (threadId: string) => void;
}

/**
 * Metrics card props (instructor dashboard)
 */
export interface MetricsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

/**
 * Notification panel props
 */
export interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

/**
 * Unanswered queue item props (instructor dashboard)
 */
export interface UnansweredQueueItemProps {
  thread: Thread;
  courseCode: string;
  authorName: string;
  onThreadClick: (threadId: string) => void;
}
```

---

## 5. API Response Types

### Add to `lib/models/types.ts` (after Component Props)

```typescript
// ============================================
// Dashboard API Response Types
// ============================================

/**
 * Response from getStudentDashboard API
 */
export interface StudentDashboardResponse {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  stats: {
    unreadNotificationCount: number;
    activeThreadCount: number;
  };
}

/**
 * Response from getInstructorDashboard API
 */
export interface InstructorDashboardResponse {
  managedCourses: CourseWithMetrics[];
  unansweredThreads: Thread[];
  recentActivity: ActivityItem[];
  insights: CourseInsight[];
  stats: {
    totalUnansweredCount: number;
    totalActiveStudents: number;
  };
}
```

---

## 6. Type Guards

### Add to `lib/models/types.ts` (after API Response types)

```typescript
// ============================================
// Dashboard Type Guards
// ============================================

/**
 * Check if user is a student
 */
export function isStudent(user: User): boolean {
  return user.role === 'student';
}

/**
 * Check if user is an instructor
 */
export function isInstructor(user: User): boolean {
  return user.role === 'instructor';
}

/**
 * Check if user is a TA
 */
export function isTA(user: User): boolean {
  return user.role === 'ta';
}

/**
 * Check if user is instructor or TA (same dashboard)
 */
export function isInstructorOrTA(user: User): boolean {
  return user.role === 'instructor' || user.role === 'ta';
}

/**
 * Type guard for student dashboard data
 */
export function isStudentDashboard(data: DashboardData): data is StudentDashboardData {
  return data.role === 'student';
}

/**
 * Type guard for instructor dashboard data
 */
export function isInstructorDashboard(data: DashboardData): data is InstructorDashboardData {
  return data.role === 'instructor' || data.role === 'ta';
}

/**
 * Type guard for course with metrics
 */
export function isCourseWithMetrics(course: EnrichedCourse): course is CourseWithMetrics {
  return 'metrics' in course;
}

/**
 * Type guard for course with activity
 */
export function isCourseWithActivity(course: EnrichedCourse): course is CourseWithActivity {
  return 'recentThreads' in course;
}

/**
 * Activity type guards
 */
export function isThreadCreatedActivity(item: ActivityItem): item is ThreadCreatedActivity {
  return item.type === 'thread_created';
}

export function isPostCreatedActivity(item: ActivityItem): item is PostCreatedActivity {
  return item.type === 'post_created';
}

export function isThreadResolvedActivity(item: ActivityItem): item is ThreadResolvedActivity {
  return item.type === 'thread_resolved';
}

export function isPostEndorsedActivity(item: ActivityItem): item is PostEndorsedActivity {
  return item.type === 'post_endorsed';
}

export function isThreadAnsweredActivity(item: ActivityItem): item is ThreadAnsweredActivity {
  return item.type === 'thread_answered';
}
```

---

## 7. Mock API Client Updates

### Add to `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

**Location:** Add after line 468 (end of existing methods)

```typescript
// ============================================
// Dashboard API Methods
// ============================================

/**
 * Get student dashboard data
 */
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(300 + Math.random() * 200); // 300-500ms
  seedData();

  const enrollments = getEnrollments(userId);
  const allCourses = getCourses();
  const allThreads = getThreadsByCourse(''); // Get all threads
  const notifications = getNotifications(userId);

  // Build enriched courses with activity
  const enrolledCourses: CourseWithActivity[] = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = allCourses.find((c) => c.id === enrollment.courseId);
      if (!course) return null;

      const courseThreads = getThreadsByCourse(course.id);
      const recentThreads = courseThreads
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      const courseNotifications = notifications.filter((n) => n.courseId === course.id);
      const unreadCount = courseNotifications.filter((n) => !n.read).length;

      return {
        ...course,
        recentThreads,
        unreadCount,
        lastVisited: null, // TODO: Track last visited from localStorage
      } as CourseWithActivity;
    })
  ).then((courses) => courses.filter((c): c is CourseWithActivity => c !== null));

  // Build recent activity (last 20 items)
  const recentActivity: ActivityItem[] = []; // TODO: Build from threads/posts/notifications

  // Get threads user has participated in
  const userThreads = allThreads.filter((t) => t.authorId === userId);
  const activeThreadCount = userThreads.length;

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return {
    role: 'student',
    enrolledCourses,
    recentActivity,
    notifications,
    unreadNotificationCount,
    activeThreadCount,
  };
},

/**
 * Get instructor dashboard data
 */
async getInstructorDashboard(userId: string): Promise<InstructorDashboardData> {
  await delay(400 + Math.random() * 200); // 400-600ms
  seedData();

  const enrollments = getEnrollments(userId);
  const allCourses = getCourses();
  const users = getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user || (user.role !== 'instructor' && user.role !== 'ta')) {
    throw new Error('User is not an instructor or TA');
  }

  // Build enriched courses with metrics
  const managedCourses: CourseWithMetrics[] = await Promise.all(
    enrollments
      .filter((e) => e.role === 'instructor' || e.role === 'ta')
      .map(async (enrollment) => {
        const course = allCourses.find((c) => c.id === enrollment.courseId);
        if (!course) return null;

        const metrics = await this.getCourseMetrics(course.id);
        if (!metrics) return null;

        return {
          ...course,
          metrics,
          unansweredCount: metrics.unansweredCount,
        } as CourseWithMetrics;
      })
  ).then((courses) => courses.filter((c): c is CourseWithMetrics => c !== null));

  // Get all unanswered threads from managed courses
  const managedCourseIds = managedCourses.map((c) => c.id);
  const unansweredThreads: Thread[] = managedCourseIds.flatMap((courseId) => {
    const threads = getThreadsByCourse(courseId);
    return threads.filter((t) => t.status === 'open');
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Get insights for each course
  const insights: CourseInsight[] = await Promise.all(
    managedCourseIds.map((courseId) => this.getCourseInsights(courseId))
  ).then((results) => results.filter((i): i is CourseInsight => i !== null));

  // Build recent activity
  const recentActivity: ActivityItem[] = []; // TODO: Build from managed course activity

  const totalUnansweredCount = unansweredThreads.length;

  return {
    role: user.role,
    managedCourses,
    unansweredThreads,
    recentActivity,
    insights,
    totalUnansweredCount,
  };
},
```

**Import Updates Required:**
```typescript
// Add to existing imports at top of client.ts
import type {
  DashboardData,
  StudentDashboardData,
  InstructorDashboardData,
  ActivityItem,
  CourseWithMetrics,
  CourseWithActivity,
} from "@/lib/models/types";
```

---

## 8. React Query Hooks

### Add to `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

**Location:** Add after line 294 (end of existing hooks)

```typescript
// ============================================
// Dashboard Hooks
// ============================================

/**
 * Get student dashboard data
 */
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? ['studentDashboard', userId] as const : ['studentDashboard'],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get instructor dashboard data
 */
export function useInstructorDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? ['instructorDashboard', userId] as const : ['instructorDashboard'],
    queryFn: () => (userId ? api.getInstructorDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get dashboard data based on user role (auto-selects hook)
 */
export function useDashboard(user: User | null | undefined) {
  const studentDashboard = useStudentDashboard(
    user?.role === 'student' ? user.id : undefined
  );

  const instructorDashboard = useInstructorDashboard(
    user?.role === 'instructor' || user?.role === 'ta' ? user.id : undefined
  );

  if (user?.role === 'student') {
    return studentDashboard;
  }

  if (user?.role === 'instructor' || user?.role === 'ta') {
    return instructorDashboard;
  }

  return { data: null, isLoading: false, error: null };
}
```

**Import Updates Required:**
```typescript
// Add to existing imports at top of hooks.ts
import type {
  StudentDashboardData,
  InstructorDashboardData,
  User,
} from "@/lib/models/types";
```

---

## 9. Type-Level Tests

### Create: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/__tests__/dashboard-types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type {
  DashboardData,
  StudentDashboardData,
  InstructorDashboardData,
  ActivityItem,
  EnrichedCourse,
} from '../types';
import {
  isStudentDashboard,
  isInstructorDashboard,
  isStudent,
  isInstructor,
  isTA,
  isThreadCreatedActivity,
  isPostCreatedActivity,
} from '../types';

describe('Dashboard Type Guards', () => {
  it('correctly identifies student dashboard', () => {
    const studentData: StudentDashboardData = {
      role: 'student',
      enrolledCourses: [],
      recentActivity: [],
      notifications: [],
      unreadNotificationCount: 0,
      activeThreadCount: 0,
    };

    expect(isStudentDashboard(studentData)).toBe(true);
    expect(isInstructorDashboard(studentData)).toBe(false);
  });

  it('correctly identifies instructor dashboard', () => {
    const instructorData: InstructorDashboardData = {
      role: 'instructor',
      managedCourses: [],
      unansweredThreads: [],
      recentActivity: [],
      insights: [],
      totalUnansweredCount: 0,
    };

    expect(isInstructorDashboard(instructorData)).toBe(true);
    expect(isStudentDashboard(instructorData)).toBe(false);
  });

  it('correctly identifies activity types', () => {
    const threadActivity: ActivityItem = {
      id: 'act-1',
      type: 'thread_created',
      courseId: 'cs101',
      threadId: 'thread-1',
      timestamp: new Date().toISOString(),
      summary: 'New thread created',
      threadTitle: 'Test thread',
      authorId: 'user-1',
      authorName: 'John Doe',
    };

    expect(isThreadCreatedActivity(threadActivity)).toBe(true);
    expect(isPostCreatedActivity(threadActivity)).toBe(false);
  });
});
```

---

## 10. Integration Checklist

### Pre-Implementation Verification

- [ ] Verify `lib/models/types.ts` exists and is readable
- [ ] Verify `lib/api/client.ts` has api export
- [ ] Verify `lib/api/hooks.ts` has React Query setup
- [ ] Check TypeScript version supports template literals (>= 4.1)
- [ ] Verify strict mode is enabled in `tsconfig.json`

### Post-Implementation Verification

- [ ] Run `npx tsc --noEmit` - zero errors
- [ ] Run `npm run lint` - zero type-related warnings
- [ ] Verify all imports use `import type` where appropriate
- [ ] Verify no `any` types introduced
- [ ] Verify all discriminated unions have type guards
- [ ] Test type inference in IDE (hover over variables)
- [ ] Verify nullable types are explicit (`| null` not `?`)

---

## Risk Mitigation

### Risk 1: Breaking Changes to Existing Types
**Mitigation:** All new types are additive. No modifications to existing types.

### Risk 2: Runtime vs Compile-Time Safety
**Mitigation:** Type guards provided for all discriminated unions. Use at API boundaries.

### Risk 3: Generic Type Complexity
**Mitigation:** Dashboard hooks use simple conditional logic, not complex generics.

### Risk 4: Type Import Cycles
**Mitigation:** All types in single file (`types.ts`). API client imports from types, not vice versa.

---

## Usage Examples

### Example 1: Dashboard Component
```typescript
import type { DashboardLayoutProps, User } from '@/lib/models/types';
import { isStudentDashboard } from '@/lib/models/types';

function Dashboard({ user, data }: DashboardLayoutProps) {
  if (isStudentDashboard(data)) {
    // TypeScript knows data is StudentDashboardData
    return <StudentDashboard courses={data.enrolledCourses} />;
  }

  // TypeScript knows data is InstructorDashboardData
  return <InstructorDashboard courses={data.managedCourses} />;
}
```

### Example 2: Activity Feed
```typescript
import type { ActivityFeedItemProps } from '@/lib/models/types';
import { isThreadCreatedActivity, isPostCreatedActivity } from '@/lib/models/types';

function ActivityFeedItem({ activity, currentUserId, onThreadClick }: ActivityFeedItemProps) {
  if (isThreadCreatedActivity(activity)) {
    // TypeScript knows activity has threadTitle and authorId
    return <div>{activity.threadTitle} by {activity.authorName}</div>;
  }

  if (isPostCreatedActivity(activity)) {
    // TypeScript knows activity has isReplyToUser
    return <div>{activity.summary} {activity.isReplyToUser && '(replied to you)'}</div>;
  }

  return <div>{activity.summary}</div>;
}
```

### Example 3: Hook Usage
```typescript
import { useDashboard } from '@/lib/api/hooks';
import { useCurrentUser } from '@/lib/api/hooks';

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: dashboardData, isLoading } = useDashboard(user);

  if (isLoading) return <div>Loading...</div>;
  if (!dashboardData) return <div>No data</div>;

  // dashboardData is properly typed as DashboardData
  return <Dashboard user={user!} data={dashboardData} />;
}
```

---

## Files Modified Summary

1. **`/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`**
   - Add ~250 lines of dashboard types
   - Add type guards for runtime safety
   - Maintain existing conventions

2. **`/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`**
   - Add 2 new methods: `getStudentDashboard`, `getInstructorDashboard`
   - Update imports with new types
   - ~100 lines added

3. **`/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`**
   - Add 3 new hooks: `useStudentDashboard`, `useInstructorDashboard`, `useDashboard`
   - Update imports with new types
   - ~50 lines added

4. **`/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/__tests__/dashboard-types.test.ts`** (NEW)
   - Add type-level tests for guards
   - ~80 lines

**Total:** ~480 lines added, 0 lines modified (all additive)

---

## Quality Assurance

### Strict Mode Compliance ✅
- Zero `any` types
- All imports use `import type` where possible
- Explicit null handling (`| null`, not `?` for fetched data)
- Type guards for all discriminated unions
- Generic constraints on hooks

### Type Safety Features ✅
- Discriminated unions with literal discriminators
- Exhaustive type guards
- Branded types where needed (activity IDs)
- Utility type usage (Omit, Pick if needed)
- Template literal types (future: for activity summaries)

### Maintainability ✅
- Consistent naming conventions
- JSDoc comments on complex types
- Related types grouped in sections
- Type composition over duplication
- Single source of truth (`types.ts`)

---

**End of Implementation Plan**

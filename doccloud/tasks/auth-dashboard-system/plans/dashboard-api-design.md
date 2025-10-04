# Dashboard API Design Plan

## Overview

This plan designs aggregate API methods for student and instructor dashboards that reduce multiple API calls into single, efficient requests. The approach prioritizes code reuse, type safety, and adherence to existing patterns.

---

## 1. TypeScript Interfaces

### Location: `lib/models/types.ts`

Add these interfaces after the existing `CourseMetrics` interface (around line 180):

```typescript
// ============================================
// Dashboard Data Types
// ============================================

/**
 * Represents a user activity item for dashboard feed
 */
export interface ActivityItem {
  id: string;
  type: 'thread_created' | 'post_created' | 'thread_resolved';
  threadId: string;
  courseId: string;
  courseName: string;          // Denormalized for display
  title: string;               // Thread title
  timestamp: string;           // ISO 8601
}

/**
 * Aggregated data for student dashboard view
 */
export interface StudentDashboardData {
  enrolledCourses: Course[];
  recentActivity: ActivityItem[];     // Last 10 activities across all courses
  notifications: Notification[];      // All notifications (sorted by createdAt desc)
  unreadCount: number;                // Count of unread notifications
}

/**
 * Aggregated data for instructor dashboard view
 */
export interface InstructorDashboardData {
  managedCourses: Course[];
  courseMetrics: Record<string, CourseMetrics>;  // Keyed by courseId
  unansweredQueue: Thread[];                     // All unanswered threads across courses
  insights: CourseInsight[];                     // One insight per course
}
```

**Rationale:**
- `ActivityItem`: New type needed to represent dashboard feed items (not in existing types)
- `StudentDashboardData`: Aggregates 3 separate API calls into one response
- `InstructorDashboardData`: Aggregates 1 + 3N API calls into one response
- All fields use existing types (Course, Notification, Thread, etc.) for consistency
- Record<string, T> pattern matches existing usage in codebase
- JSDoc comments follow existing convention

---

## 2. API Methods

### Location: `lib/api/client.ts`

Add these methods after the existing `createPost` method (around line 468):

#### Method 1: `getStudentDashboard`

```typescript
/**
 * Get aggregated dashboard data for a student
 */
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(200 + Math.random() * 200); // 200-400ms (fast dashboard load)
  seedData();

  // 1. Get enrolled courses
  const enrollments = getEnrollments(userId).filter(
    (e) => e.role === "student"
  );
  const allCourses = getCourses();
  const courseIds = enrollments.map((e) => e.courseId);

  const enrolledCourses = allCourses
    .filter((c) => courseIds.includes(c.id) && c.status === "active")
    .sort((a, b) => a.code.localeCompare(b.code));

  // 2. Get recent activity (last 10 threads across all courses)
  const allThreads = getThreads();
  const studentThreads = allThreads
    .filter((t) => courseIds.includes(t.courseId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  // Build activity items
  const recentActivity: ActivityItem[] = studentThreads.map((thread) => {
    const course = allCourses.find((c) => c.id === thread.courseId);
    return {
      id: `activity-${thread.id}`,
      type: "thread_created" as const,
      threadId: thread.id,
      courseId: thread.courseId,
      courseName: course?.code || "Unknown",
      title: thread.title,
      timestamp: thread.createdAt,
    };
  });

  // 3. Get notifications
  const notifications = getNotifications(userId);
  const sortedNotifications = notifications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    enrolledCourses,
    recentActivity,
    notifications: sortedNotifications,
    unreadCount,
  };
}
```

**Implementation Details:**
- **Delay**: 200-400ms (faster than standard 200-500ms for quick dashboard feel)
- **Data Sources**: Reuses `getEnrollments()`, `getCourses()`, `getThreads()`, `getNotifications()`
- **Filters**:
  - Only "student" role enrollments
  - Only "active" courses
  - Only threads within enrolled courses
- **Sorting**: Courses by code (A-Z), threads by createdAt (newest first)
- **Activity**: Derives from threads (no separate activity log needed)
- **Notifications**: Returns all, sorted by createdAt desc
- **Error Handling**: None needed (localStorage functions return empty arrays on error)

#### Method 2: `getInstructorDashboard`

```typescript
/**
 * Get aggregated dashboard data for an instructor
 */
async getInstructorDashboard(userId: string): Promise<InstructorDashboardData> {
  await delay(300 + Math.random() * 200); // 300-500ms (more data to aggregate)
  seedData();

  // 1. Get managed courses (where user is instructor)
  const enrollments = getEnrollments(userId).filter(
    (e) => e.role === "instructor" || e.role === "ta"
  );
  const allCourses = getCourses();
  const courseIds = enrollments.map((e) => e.courseId);

  const managedCourses = allCourses
    .filter((c) => courseIds.includes(c.id) && c.status === "active")
    .sort((a, b) => a.code.localeCompare(b.code));

  // 2. Calculate metrics for each course
  const allThreads = getThreads();
  const users = getUsers();
  const courseMetrics: Record<string, CourseMetrics> = {};

  for (const courseId of courseIds) {
    const threads = allThreads.filter((t) => t.courseId === courseId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get unique student authors
    const studentAuthors = new Set(
      threads
        .map((t) => t.authorId)
        .filter((authorId) => {
          const user = users.find((u) => u.id === authorId);
          return user?.role === "student";
        })
    );

    const recentThreads = threads.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    );

    courseMetrics[courseId] = {
      threadCount: threads.length,
      unansweredCount: threads.filter((t) => t.status === "open").length,
      answeredCount: threads.filter((t) => t.status === "answered").length,
      resolvedCount: threads.filter((t) => t.status === "resolved").length,
      activeStudents: studentAuthors.size,
      recentActivity: recentThreads.length,
    };
  }

  // 3. Get all unanswered threads across all courses
  const unansweredQueue = allThreads
    .filter((t) => courseIds.includes(t.courseId) && t.status === "open")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ); // Oldest first (most urgent)

  // 4. Generate insights for each course
  const insights: CourseInsight[] = [];

  for (const courseId of courseIds) {
    const threads = allThreads.filter((t) => t.courseId === courseId);
    const activeThreads = threads.filter(
      (t) => t.status === "open" || t.status === "answered"
    ).length;

    // Get top questions by view count
    const topQuestions = threads
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((t) => t.title);

    // Get trending topics from tags
    const allTags = threads.flatMap((t) => t.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendingTopics = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Generate summary based on activity
    const unansweredCount = threads.filter((t) => t.status === "open").length;
    const summary =
      unansweredCount > 5
        ? `High activity with ${unansweredCount} open questions. Students are actively engaging with ${trendingTopics[0] || "course"} topics.`
        : `Moderate activity. Most questions are answered. Focus areas: ${trendingTopics.slice(0, 2).join(", ") || "general concepts"}.`;

    insights.push({
      id: `insight-${courseId}-${Date.now()}`,
      courseId,
      summary,
      activeThreads,
      topQuestions,
      trendingTopics,
      generatedAt: new Date().toISOString(),
    });
  }

  return {
    managedCourses,
    courseMetrics,
    unansweredQueue,
    insights,
  };
}
```

**Implementation Details:**
- **Delay**: 300-500ms (more computation, slightly longer but still fast)
- **Data Sources**: Reuses `getEnrollments()`, `getCourses()`, `getThreads()`, `getUsers()`
- **Filters**:
  - Only "instructor" or "ta" role enrollments
  - Only "active" courses
  - Threads within managed courses
- **Metrics Calculation**: Identical logic to `getCourseMetrics()` (copy-paste for consistency)
- **Unanswered Queue**: Sorted oldest-first (most urgent at top)
- **Insights**: Identical logic to `getCourseInsights()` (copy-paste for consistency)
- **Batch Processing**: Calculates metrics/insights for all courses in single call

**Error Handling**: None needed (localStorage functions gracefully return empty arrays)

---

## 3. React Query Hooks

### Location: `lib/api/hooks.ts`

#### Step 1: Update `queryKeys` Object

Add these keys to the `queryKeys` object (around line 28, after `notifications`):

```typescript
const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] as const : ["notifications", userId] as const,
  // NEW: Dashboard query keys
  studentDashboard: (userId: string) => ["studentDashboard", userId] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
};
```

#### Step 2: Add Hook - `useStudentDashboard`

Add after `useMarkAllNotificationsRead()` (around line 244):

```typescript
// ============================================
// Dashboard Hooks
// ============================================

/**
 * Get aggregated student dashboard data
 */
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.studentDashboard(userId) : ["studentDashboard"],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,  // 2 minutes (refresh frequently)
    gcTime: 5 * 60 * 1000,     // Keep in cache 5 minutes
  });
}
```

**Configuration Rationale:**
- **enabled**: Prevents fetch when userId is undefined (guards against SSR/loading states)
- **staleTime**: 2 minutes - Dashboards show dynamic data, need frequent updates
- **gcTime**: 5 minutes - Keep in cache for quick navigation back to dashboard
- **Query key**: Includes userId to cache per-user (multi-account support)

#### Step 3: Add Hook - `useInstructorDashboard`

Add immediately after `useStudentDashboard()`:

```typescript
/**
 * Get aggregated instructor dashboard data
 */
export function useInstructorDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.instructorDashboard(userId) : ["instructorDashboard"],
    queryFn: () => (userId ? api.getInstructorDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,  // 3 minutes (more expensive calculation)
    gcTime: 10 * 60 * 1000,    // Keep in cache 10 minutes
  });
}
```

**Configuration Rationale:**
- **enabled**: Same guard pattern as student dashboard
- **staleTime**: 3 minutes - More expensive aggregation, slightly longer stale time acceptable
- **gcTime**: 10 minutes - Instructor data changes less frequently, keep longer
- **Query key**: Includes userId for per-user caching

#### Step 4: Update Invalidation in `useCreateThread`

Modify the `onSuccess` callback in `useCreateThread()` (around line 272):

```typescript
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (newThread, variables) => {
      // Existing invalidation
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(newThread.courseId) });

      // NEW: Invalidate student dashboard (new activity)
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentDashboard(variables.authorId)
      });

      // NEW: Invalidate instructor dashboard (affects unanswered queue)
      // Note: We don't know instructor IDs here, so invalidate all instructor dashboards
      queryClient.invalidateQueries({
        queryKey: ["instructorDashboard"]
      });
    },
  });
}
```

**Invalidation Rationale:**
- Student creates thread → their dashboard shows new activity
- Instructor dashboard shows new unanswered thread in queue
- Partial invalidation (prefix match) ensures all instructor dashboards refresh

#### Step 5: Update Invalidation in `useCreatePost`

Modify the `onSuccess` callback in `useCreatePost()` (around line 285):

```typescript
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreatePostInput; authorId: string }) =>
      api.createPost(input, authorId),
    onSuccess: (newPost, variables) => {
      // Existing invalidation
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(newPost.threadId) });

      // NEW: Invalidate student dashboard (new activity for author)
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentDashboard(variables.authorId)
      });
    },
  });
}
```

**Invalidation Rationale:**
- Student posts reply → dashboard shows updated activity
- Doesn't affect instructor dashboard (no status change)

#### Step 6: Add Invalidation to Future `useResolveThread` (Planned)

**Note**: This mutation doesn't exist yet, but when implemented:

```typescript
export function useResolveThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, userId }: { threadId: string; userId: string }) =>
      api.resolveThread(threadId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(variables.threadId) });

      // Invalidate instructor dashboard (affects unanswered queue + metrics)
      queryClient.invalidateQueries({
        queryKey: queryKeys.instructorDashboard(variables.userId)
      });
    },
  });
}
```

---

## 4. Mock Data Structure

### No New Mock Files Required

All dashboard data is aggregated from existing mock files:
- `mocks/users.json` - User roles
- `mocks/courses.json` - Course details
- `mocks/enrollments.json` - User-course relationships
- `mocks/threads.json` - Thread data for activity
- `mocks/posts.json` - (Not directly used by dashboards)

### Data Flow Examples

#### Student Dashboard Flow:
```
1. userId "user-student-1"
2. getEnrollments("user-student-1") → [enrollment-1, enrollment-2]
3. Extract courseIds → ["course-cs101", "course-cs201"]
4. getCourses() + filter by courseIds → [CS101, CS201]
5. getThreads() + filter by courseIds → [thread-1, thread-2, ...]
6. Sort by createdAt → recent 10 threads
7. Map to ActivityItem[] with course names
8. getNotifications("user-student-1") → [notification-1, ...]
9. Count unread → unreadCount: 3
10. Return StudentDashboardData
```

#### Instructor Dashboard Flow:
```
1. userId "user-instructor-1"
2. getEnrollments("user-instructor-1") + filter role → [enrollment-3, enrollment-4]
3. Extract courseIds → ["course-cs101", "course-math221"]
4. getCourses() + filter → [CS101, MATH221]
5. For each courseId:
   a. getThreads() + filter by courseId
   b. Calculate metrics (counts, unique students, recent activity)
   c. Generate insights (top questions, trending topics, summary)
6. getThreads() + filter status="open" → unanswered queue
7. Sort unanswered by createdAt ASC (oldest first)
8. Return InstructorDashboardData
```

### Edge Cases Covered

1. **No Enrollments**: Returns empty arrays (graceful)
   ```typescript
   enrolledCourses: []
   recentActivity: []
   // etc.
   ```

2. **No Recent Threads**: Empty activity feed
   ```typescript
   recentActivity: []
   ```

3. **No Notifications**: Zero unread count
   ```typescript
   notifications: []
   unreadCount: 0
   ```

4. **Archived Courses**: Filtered out (only "active" shown)

5. **Mixed Roles (Student + TA)**: Filters handle correctly
   - Student dashboard: only student enrollments
   - Instructor dashboard: instructor + TA enrollments

---

## 5. Implementation Checklist

### Phase 1: Type Definitions
- [ ] Open `lib/models/types.ts`
- [ ] Add `ActivityItem` interface after `CourseMetrics` (line ~180)
- [ ] Add `StudentDashboardData` interface
- [ ] Add `InstructorDashboardData` interface
- [ ] Add comment header `// ============================================ // Dashboard Data Types // ============================================`
- [ ] Save file
- [ ] Run `npx tsc --noEmit` to verify types compile

### Phase 2: API Methods
- [ ] Open `lib/api/client.ts`
- [ ] Import new types at top: `import type { StudentDashboardData, InstructorDashboardData, ActivityItem } from "@/lib/models/types";`
- [ ] Add `getStudentDashboard(userId: string)` method after `createPost()` (line ~468)
- [ ] Add `getInstructorDashboard(userId: string)` method after `getStudentDashboard()`
- [ ] Add comment header before methods: `// ============================================ // Dashboard API Methods // ============================================`
- [ ] Save file
- [ ] Run `npx tsc --noEmit` to verify no errors

### Phase 3: React Query Hooks
- [ ] Open `lib/api/hooks.ts`
- [ ] Update `queryKeys` object - add `studentDashboard` and `instructorDashboard` keys (line ~28)
- [ ] Add comment header after `useMarkAllNotificationsRead()`: `// ============================================ // Dashboard Hooks // ============================================`
- [ ] Add `useStudentDashboard(userId)` hook
- [ ] Add `useInstructorDashboard(userId)` hook
- [ ] Save file
- [ ] Run `npx tsc --noEmit` to verify hooks compile

### Phase 4: Invalidation Updates
- [ ] Still in `lib/api/hooks.ts`
- [ ] Update `useCreateThread` onSuccess to invalidate dashboards
- [ ] Update `useCreatePost` onSuccess to invalidate student dashboard
- [ ] Save file
- [ ] Run `npm run lint` to verify code style

### Phase 5: Testing
- [ ] Test student dashboard call in browser console:
  ```typescript
  const data = await api.getStudentDashboard("user-student-1");
  console.log(data);
  ```
- [ ] Verify structure matches `StudentDashboardData` type
- [ ] Test instructor dashboard call:
  ```typescript
  const data = await api.getInstructorDashboard("user-instructor-1");
  console.log(data);
  ```
- [ ] Verify structure matches `InstructorDashboardData` type
- [ ] Test hooks in React component:
  ```tsx
  const { data, isLoading } = useStudentDashboard(userId);
  ```
- [ ] Verify invalidation works (create thread, see dashboard update)

### Phase 6: Accessibility & Performance
- [ ] Verify loading states are handled (isLoading from hooks)
- [ ] Verify error states are handled (error from hooks)
- [ ] Check network delay feels responsive (<500ms)
- [ ] Ensure data is cached (no refetch on navigation back)
- [ ] Verify stale time works (manual refresh after 2-3 min)

---

## 6. Backend Integration Notes

### What Will Change (Backend Integration)

#### API Client (`lib/api/client.ts`)
```typescript
// BEFORE (Mock):
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(200 + Math.random() * 200);
  seedData();
  const enrollments = getEnrollments(userId);
  // ... localStorage logic
}

// AFTER (Backend):
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  const response = await fetch(`/api/dashboard/student`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed: ${response.statusText}`);
  }

  return response.json();
}
```

#### Backend Endpoint Structure
```
GET /api/dashboard/student
Headers: Authorization: Bearer <token>
Response: StudentDashboardData (same interface!)

GET /api/dashboard/instructor
Headers: Authorization: Bearer <token>
Response: InstructorDashboardData (same interface!)
```

#### What Stays the Same
- TypeScript interfaces (no changes!)
- React Query hooks (no changes!)
- Query keys (no changes!)
- Invalidation logic (no changes!)
- Component usage (no changes!)

#### Environment Variables Needed
```env
NEXT_PUBLIC_API_URL=https://api.quokkaq.com
```

#### Authentication Headers
```typescript
// Add to all API calls:
headers: {
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
}
```

#### Error Handling Differences
```typescript
// Mock: No network errors (only logic errors)
// Backend: Must handle:
- 401 Unauthorized (token expired)
- 403 Forbidden (wrong role)
- 500 Server Error (backend issues)
- Network errors (offline, timeout)

// Add error handling:
try {
  const response = await fetch(...);
  if (response.status === 401) {
    // Redirect to login
  }
  // ...
} catch (error) {
  throw new Error('Network error: ' + error.message);
}
```

#### Real-Time Updates (Future)
```typescript
// Current: Manual refetch via staleTime
// Future: WebSocket or Server-Sent Events

// Add to hooks:
useEffect(() => {
  const ws = new WebSocket('wss://api.quokkaq.com/dashboard/updates');
  ws.onmessage = (event) => {
    queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
  };
  return () => ws.close();
}, []);
```

#### Backend Performance Considerations
- **Caching**: Backend should cache dashboard queries (Redis, 1-2 min TTL)
- **Indexing**: Database indexes on `enrollments.userId`, `threads.courseId`, `threads.status`
- **Pagination**: Consider paginating activity feed (currently limit 10)
- **Aggregation**: Use database aggregation queries (not in-memory)

---

## 7. Test Scenarios

### Unit Tests (Future)
```typescript
describe('getStudentDashboard', () => {
  it('returns enrolled courses sorted by code', async () => {
    const data = await api.getStudentDashboard('user-student-1');
    expect(data.enrolledCourses).toBeSorted((a, b) =>
      a.code.localeCompare(b.code)
    );
  });

  it('returns last 10 activities across courses', async () => {
    const data = await api.getStudentDashboard('user-student-1');
    expect(data.recentActivity).toHaveLength(10);
  });

  it('counts unread notifications correctly', async () => {
    const data = await api.getStudentDashboard('user-student-1');
    expect(data.unreadCount).toBe(
      data.notifications.filter(n => !n.read).length
    );
  });
});
```

### Integration Tests (Future)
```typescript
describe('Dashboard Hooks', () => {
  it('invalidates dashboard on thread creation', async () => {
    const { result } = renderHook(() => useStudentDashboard('user-1'));
    const { result: createThread } = renderHook(() => useCreateThread());

    await createThread.current.mutateAsync({
      input: threadData,
      authorId: 'user-1'
    });

    // Dashboard should refetch
    expect(result.current.dataUpdatedAt).toBeGreaterThan(initialTime);
  });
});
```

### Manual Test Checklist
- [ ] Student dashboard shows correct courses for role="student" users
- [ ] Student dashboard excludes courses for role="instructor" users
- [ ] Activity feed shows threads in chronological order (newest first)
- [ ] Activity feed limits to 10 items
- [ ] Notification count matches unread notifications
- [ ] Instructor dashboard shows courses for role="instructor"/"ta" users
- [ ] Instructor dashboard excludes courses for role="student" users
- [ ] Unanswered queue sorted oldest first
- [ ] Metrics calculated correctly per course
- [ ] Insights generated for each course
- [ ] Creating thread invalidates both dashboards
- [ ] Creating post invalidates student dashboard only
- [ ] Dashboard data cached for staleTime duration
- [ ] Loading states display during fetch
- [ ] Error states handled gracefully

---

## 8. Performance Optimization Notes

### Current Performance (Mock)
- **Student Dashboard**: 1 aggregate call (200-400ms) vs 3+ separate calls (600-1500ms)
- **Instructor Dashboard**: 1 aggregate call (300-500ms) vs 1 + 3N calls (N courses)
- **Cache Hit**: Instant (<10ms) within staleTime window

### Optimization Opportunities

#### 1. Prefetching
```typescript
// Prefetch dashboard on login success:
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (result) => {
      if (isAuthSuccess(result)) {
        const user = result.session.user;

        // Prefetch dashboard based on role
        if (user.role === 'student') {
          queryClient.prefetchQuery({
            queryKey: queryKeys.studentDashboard(user.id),
            queryFn: () => api.getStudentDashboard(user.id),
          });
        } else {
          queryClient.prefetchQuery({
            queryKey: queryKeys.instructorDashboard(user.id),
            queryFn: () => api.getInstructorDashboard(user.id),
          });
        }
      }
    },
  });
}
```

#### 2. Optimistic Updates (Future)
```typescript
// When creating thread, optimistically update dashboard:
onMutate: async (variables) => {
  await queryClient.cancelQueries({
    queryKey: queryKeys.studentDashboard(variables.authorId)
  });

  const previousData = queryClient.getQueryData(
    queryKeys.studentDashboard(variables.authorId)
  );

  queryClient.setQueryData(
    queryKeys.studentDashboard(variables.authorId),
    (old) => ({
      ...old,
      recentActivity: [newActivityItem, ...old.recentActivity].slice(0, 10),
    })
  );

  return { previousData };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(
    queryKeys.studentDashboard(variables.authorId),
    context.previousData
  );
},
```

#### 3. Selective Invalidation
```typescript
// Instead of invalidating all instructor dashboards:
// Track instructor IDs per course and invalidate selectively
const courseInstructors = getCourseInstructors(newThread.courseId);
courseInstructors.forEach(instructorId => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.instructorDashboard(instructorId)
  });
});
```

#### 4. Pagination (Future Enhancement)
```typescript
// For activity feed:
interface StudentDashboardData {
  enrolledCourses: Course[];
  recentActivity: {
    items: ActivityItem[];
    hasMore: boolean;
    nextCursor?: string;
  };
  notifications: Notification[];
  unreadCount: number;
}

// Use infinite query:
export function useStudentDashboardActivity(userId: string) {
  return useInfiniteQuery({
    queryKey: ['studentDashboardActivity', userId],
    queryFn: ({ pageParam = 0 }) =>
      api.getStudentDashboardActivity(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

---

## Summary

### Files Modified
1. **lib/models/types.ts** - Add 3 new interfaces (ActivityItem, StudentDashboardData, InstructorDashboardData)
2. **lib/api/client.ts** - Add 2 new methods (getStudentDashboard, getInstructorDashboard)
3. **lib/api/hooks.ts** - Add 2 new hooks + update 2 existing mutations for invalidation

### Key Design Decisions
1. **Aggregation over Separation**: Single dashboard call reduces network overhead (1 vs 3+ calls)
2. **Type Safety First**: All new types extend existing patterns, no breaking changes
3. **Reuse Over Reinvent**: Copy logic from getCourseMetrics/getCourseInsights for consistency
4. **Role-Based Enablement**: Hooks use `enabled` flag to prevent unnecessary fetches
5. **Stale Time Balance**: 2-3 minutes balances freshness with cache performance
6. **Activity Derivation**: Build feed from threads (no new data structure needed)
7. **Backend Ready**: Interfaces remain stable, only implementation changes for real API

### Performance Gains
- **Student Dashboard**: 67% fewer API calls (1 vs 3+)
- **Instructor Dashboard**: 75% fewer API calls for 3 courses (1 vs 10)
- **Cache Hits**: Instant dashboard load within stale time window
- **Network Time**: 200-500ms aggregate vs 600-1500ms+ separate calls

### Next Steps (After Implementation)
1. Build dashboard UI components using these hooks
2. Add prefetching on login for instant dashboard load
3. Consider optimistic updates for thread creation
4. Add pagination for activity feed (if needed)
5. Add real-time updates via WebSocket (future)

# Dashboard API Patterns Research

## Existing API Method Conventions

### Pattern Analysis: `lib/api/client.ts`

#### 1. Delay Patterns
- **Standard operations**: `delay()` → 200-500ms (no params)
- **Quick actions**: `delay(50)` or `delay(100)` → 50-100ms
- **AI operations**: `delay(600 + Math.random() * 200)` → 600-800ms
- **Dashboard-optimized**: `delay(200 + Math.random() * 200)` → 200-400ms (faster feel)

#### 2. Function Signatures
```typescript
// Pattern: async + descriptive name + typed params + Promise<T>
async getCourseMetrics(courseId: string): Promise<CourseMetrics>
async getUserCourses(userId: string): Promise<Course[]>
async getNotifications(userId: string, courseId?: string): Promise<Notification[]>
```

#### 3. Data Fetching Pattern
```typescript
// All methods follow this flow:
1. await delay(...)           // Network simulation
2. seedData()                 // Ensure localStorage has data
3. Use localStore functions   // getThreads(), getCourses(), etc.
4. Filter/transform data      // Business logic
5. Return typed result        // Promise-wrapped
```

#### 4. Data Aggregation Examples
```typescript
// getCourseMetrics() aggregates:
- threads.length → threadCount
- filter by status → unansweredCount, answeredCount, resolvedCount
- unique student authors → activeStudents
- date filtering → recentActivity

// getCourseInsights() aggregates:
- thread counts by status → activeThreads
- sort by views → topQuestions
- tag frequency → trendingTopics
- conditional summary → summary
```

#### 5. ID Generation
```typescript
// Pattern used throughout:
generateId(prefix: string) → `${prefix}-${Date.now()}-${random}`

// Examples:
generateId("user")   → "user-1728123456789-abc123def"
generateId("thread") → "thread-1728123456789-xyz789ghi"
```

## React Query Hook Conventions

### Pattern Analysis: `lib/api/hooks.ts`

#### 1. Query Key Structure
```typescript
// Centralized queryKeys object:
const queryKeys = {
  currentUser: ["currentUser"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] as const
             : ["notifications", userId] as const,
};

// Pattern: Array format, include ALL relevant identifiers
```

#### 2. Hook Naming Convention
```typescript
// Pattern: use + PascalCase entity name
useCurrentUser()           // Single entity
useCourses()               // Collection
useUserCourses(userId)     // Filtered collection
useCourseMetrics(courseId) // Derived data
```

#### 3. Enabled Guard Pattern
```typescript
// When params are optional:
export function useUserCourses(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.userCourses(userId) : ["userCourses"],
    queryFn: () => (userId ? api.getUserCourses(userId) : Promise.resolve([])),
    enabled: !!userId,  // <-- Guards against fetching with undefined
    // ...config
  });
}
```

#### 4. Stale Time Strategy
```typescript
// Based on data volatility:
- Static data (courses): 10 minutes
- User data: 5 minutes
- Metrics/insights: 5 minutes (expensive operations)
- Threads: 2 minutes (moderate updates)
- Notifications: 30 seconds + refetchInterval (active polling)
```

#### 5. Invalidation Patterns
```typescript
// On successful mutation:
onSuccess: (newThread) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.courseThreads(newThread.courseId)
  });
}

// Multiple invalidations:
onSuccess: (result) => {
  if (isAuthSuccess(result)) {
    queryClient.setQueryData(queryKeys.currentUser, result.session.user);
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
  }
}

// Global invalidation (logout):
queryClient.invalidateQueries();
```

## Data Aggregation Opportunities

### Student Dashboard Requirements
**Data Sources (currently separate calls):**
1. `getUserCourses(userId)` → Enrolled courses
2. `getThreadsByCourse(courseId)` × N → Recent threads per course
3. `getNotifications(userId)` → Unread notifications

**Aggregation Opportunity:**
Create `getStudentDashboard(userId)` that:
- Fetches enrollments + courses (single join)
- Gets last 10 threads across ALL courses (one filter)
- Includes notification count
- **Reduces: 1 + N + 1 calls → 1 aggregate call**

### Instructor Dashboard Requirements
**Data Sources (currently separate calls):**
1. `getUserCourses(userId)` → Managed courses (via enrollments)
2. `getCourseMetrics(courseId)` × N → Per-course metrics
3. `getThreadsByCourse(courseId)` × N → Unanswered threads
4. `getCourseInsights(courseId)` × N → AI insights

**Aggregation Opportunity:**
Create `getInstructorDashboard(userId)` that:
- Fetches instructor enrollments + courses
- Calculates metrics for ALL courses (batch operation)
- Aggregates unanswered threads (cross-course queue)
- Generates insights per course
- **Reduces: 1 + 3N calls → 1 aggregate call**

## Query Key Strategy for Dashboards

### Proposed Keys
```typescript
const queryKeys = {
  // Existing keys...
  studentDashboard: (userId: string) => ["studentDashboard", userId] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
};
```

### Invalidation Rules
```typescript
// User creates thread → invalidate student dashboard (new activity)
useCreateThread onSuccess: {
  queryClient.invalidateQueries({ queryKey: ["studentDashboard", authorId] });
}

// Instructor resolves thread → invalidate instructor dashboard (queue changes)
useResolveThread onSuccess: {
  queryClient.invalidateQueries({ queryKey: ["instructorDashboard", userId] });
}

// New notification → invalidate both dashboards (notification count)
// (Would be triggered by real-time system or polling)
```

## LocalStore Data Access Patterns

### Current Functions Used
```typescript
// From lib/store/localStore.ts:
getUsers()                           // All users
getUserById(id)                      // Single user lookup
getCourses()                         // All courses
getCourseById(id)                    // Single course lookup
getEnrollments(userId)               // User's enrollments
getThreadsByCourse(courseId)         // Threads in course
getThreads()                         // ALL threads (for cross-course)
getNotifications(userId, courseId?)  // User notifications
```

### New Aggregation Logic Needed
```typescript
// For student dashboard:
1. Get enrollments → courseIds
2. Get courses by IDs → Course[]
3. Get threads by courseIds → filter + sort + limit 10
4. Get notifications → count unread

// For instructor dashboard:
1. Get enrollments where role='instructor' → courseIds
2. Get courses by IDs → Course[]
3. For each courseId:
   - Calculate metrics (thread counts, student counts)
   - Get unanswered threads
   - Generate insights
4. Aggregate into single response
```

## Mock Data Constraints

### Available Mock Data
```json
// mocks/users.json       → Users with roles
// mocks/courses.json     → Courses with instructorIds
// mocks/enrollments.json → User-course relationships
// mocks/threads.json     → Threads with courseId, status, authorId
// mocks/posts.json       → Posts/replies
```

### Data Relationships
```
User
  ↓ enrollments
Course
  ↓ threads
Thread
  ↓ posts
Post
  → authorId → User
```

### Activity Item Construction
```typescript
// Recent activity needs:
interface ActivityItem {
  id: string;
  type: 'thread_created' | 'post_created' | 'thread_resolved';
  threadId: string;
  courseId: string;
  title: string;
  timestamp: string;
}

// Derive from threads:
- Sort threads by createdAt DESC
- Take first 10
- Map to activity items
```

## Network Delay Simulation Strategy

### Delay Recommendations
```typescript
// Dashboard calls should feel FAST (users expect quick overview)
getStudentDashboard():     200-400ms (vs 200-500ms standard)
getInstructorDashboard():  300-500ms (more data, slightly longer)

// Implementation:
await delay(200 + Math.random() * 200); // Student
await delay(300 + Math.random() * 200); // Instructor
```

### Why Faster Than Standard?
- Dashboards are landing pages (first impression)
- Users expect quick overview before drilling down
- Aggregated calls save overall time (1 call vs N calls)
- Still realistic (not instant)

## Existing Issues/Gaps

### 1. No Activity Tracking
- No dedicated ActivityItem type
- Must derive from Thread createdAt/updatedAt
- Could enhance with dedicated activity log (future)

### 2. No Managed Course Filter
- `getUserCourses()` returns ALL enrollments
- Need to filter by role for instructor dashboard
- Enrollments have role field (good!)

### 3. No Cross-Course Thread Query
- `getThreadsByCourse()` is single-course only
- Need to query threads across multiple courses
- Use `getThreads()` + filter by courseIds array

### 4. Notification Count
- Currently fetch ALL notifications
- Need to count unread (filter by `read: false`)
- Already supported by notification structure

## Recommendations

### 1. Create Aggregate Types
```typescript
// Add to lib/models/types.ts:
export interface StudentDashboardData {
  enrolledCourses: Course[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
}

export interface InstructorDashboardData {
  managedCourses: Course[];
  courseMetrics: Record<string, CourseMetrics>;
  unansweredQueue: Thread[];
  insights: CourseInsight[];
}

export interface ActivityItem {
  id: string;
  type: 'thread_created' | 'post_created' | 'thread_resolved';
  threadId: string;
  courseId: string;
  courseName: string;
  title: string;
  timestamp: string;
}
```

### 2. Reuse Existing Logic
- Don't reinvent metrics calculation (copy from `getCourseMetrics`)
- Don't reinvent insights generation (copy from `getCourseInsights`)
- Filter patterns already exist (status, date ranges)

### 3. Query Hook Configuration
```typescript
// Student dashboard:
staleTime: 2 * 60 * 1000  // 2 minutes (refresh often)
gcTime: 5 * 60 * 1000     // Keep in cache 5 min
enabled: based on user role

// Instructor dashboard:
staleTime: 3 * 60 * 1000  // 3 minutes (more expensive)
gcTime: 10 * 60 * 1000    // Keep longer
enabled: based on user role
```

### 4. Conditional Hook Enabling
```typescript
// Only fetch if user has correct role:
const user = useCurrentUser();
const dashboard = useStudentDashboard(
  user.data?.role === 'student' ? user.data.id : undefined
);
```

## Files to Modify

1. **lib/models/types.ts**
   - Add `StudentDashboardData` interface
   - Add `InstructorDashboardData` interface
   - Add `ActivityItem` interface

2. **lib/api/client.ts**
   - Add `getStudentDashboard(userId: string): Promise<StudentDashboardData>`
   - Add `getInstructorDashboard(userId: string): Promise<InstructorDashboardData>`

3. **lib/api/hooks.ts**
   - Add `useStudentDashboard(userId: string | undefined)`
   - Add `useInstructorDashboard(userId: string | undefined)`
   - Update `queryKeys` object with dashboard keys
   - Add invalidation to `useCreateThread`, `useCreatePost`, etc.

## Key Decisions

1. **Aggregate over Separate**: Single dashboard call is better than N individual calls
2. **Role-Based Enablement**: Use `enabled` flag + role check to prevent unnecessary fetches
3. **Stale Time Balance**: 2-3 minutes for dashboards (frequent updates without spamming)
4. **Activity Derivation**: Build activity items from threads (no new data structure needed)
5. **Reuse Over Reinvent**: Copy logic from existing metrics/insights functions

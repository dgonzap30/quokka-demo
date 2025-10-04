# API Patterns Research - Multi-Course Dashboard

## Existing Patterns Analysis

### 1. Type Definitions (`lib/models/types.ts`)

**Current Patterns:**
- All interfaces are strictly typed, no `any` types
- Use `import type` for type-only imports
- Enums use union types (e.g., `'student' | 'instructor' | 'ta'`)
- JSDoc comments are minimal, focus on clarity through naming
- Related data uses hydration pattern (IDs + populated objects)

**Key Observations:**
- `Thread` already has `courseId: string` field (line 52)
- `User` has `role: UserRole` field
- Input types follow naming pattern: `Create*Input`, `Ask*Input`
- All IDs are strings with semantic prefixes (e.g., `"thread-1"`, `"user-2"`)

### 2. API Client Methods (`lib/api/client.ts`)

**Current Patterns:**
- All methods return `Promise<T>` types
- Network delay simulation: `200-500ms` (standard), `800ms` (AI operations), `100ms` (quick actions)
- Uses `delay()` helper with random variation: `200 + Math.random() * 300`
- Hydration logic in `hydrateThread()` populates author objects from IDs
- Error handling throws descriptive errors (e.g., `"Author not found"`)
- Data persistence via `localStore` module

**Method Naming Convention:**
- `get*()` - Fetch operations (single or plural)
- `create*()` - Create operations
- `*Post()`, `*Thread()` - Mutations on specific entities
- `toggle*()` - Boolean state changes

**Delay Patterns:**
```typescript
await delay();           // Standard: 200-500ms
await delay(100);        // Quick: 100ms
await delay(800);        // AI operations: 800ms
await delay(50);         // Very quick: 50ms
```

### 3. React Query Hooks (`lib/api/hooks.ts`)

**Current Patterns:**
- Centralized query keys in `queryKeys` object (line 12-19)
- Query key format: `['entity']` or `['entity', id]` or `['entity', param]`
- All hooks use typed inputs/outputs
- Mutations invalidate related queries via `queryClient.invalidateQueries()`
- `enabled` prop for conditional queries (e.g., `enabled: !!id`)

**Query Key Patterns:**
```typescript
threads: ["threads"]                          // All threads
thread: (id: string) => ["thread", id]        // Single thread
similarThreads: (query: string) => ["similarThreads", query]
```

**Invalidation Strategy:**
- Thread mutations → invalidate `threads`, `thread(id)`, `instructorMetrics`, `unansweredThreads`
- Post mutations → invalidate `thread(id)`, `threads`, `instructorMetrics`, `unansweredThreads`
- Endorsement/Flag → invalidate `threads`, `instructorMetrics`

### 4. Local Store (`lib/store/localStore.ts`)

**Current Patterns:**
- Uses localStorage with namespaced keys: `"quokkaq.*"`
- Seed data on first run, persists thereafter
- Helper functions: `getThreads()`, `getThread(id)`, `addThread()`, etc.
- Already has `getThreadsByCourse(courseId)` helper (line 90)
- Hydration happens in API client, not store

**Storage Keys:**
```typescript
KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
}
```

### 5. Mock Data Files

**Structure Patterns:**
- JSON arrays of objects
- Realistic data with proper dates, names, content
- Deterministic (same data on reload)
- Cross-references via IDs (e.g., `authorId`, `threadId`)
- Avatar URLs use DiceBear API with seed

**Existing Files:**
- `users.json` - User accounts
- `threads.json` - Discussion threads (already has `courseId` field being added in seed)
- `ai-responses.json` - AI response templates
- `kb-docs.json` - Knowledge base documents

## Design Decisions

### 1. Course Data Model

**Decision:** Extend existing patterns with Course, Enrollment, Notification types

**Rationale:**
- `Thread.courseId` already exists, need Course entity to complete relationship
- Enrollment joins users to courses (many-to-many)
- Notifications are course-scoped activity alerts
- Course insights leverage existing AI patterns

**New Interfaces Needed:**
```typescript
Course {
  id: string;
  code: string;
  name: string;
  term: string;
  description: string;
  instructorIds: string[];
  enrollmentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

Enrollment {
  id: string;
  userId: string;
  courseId: string;
  role: UserRole;
  enrolledAt: string;
}

Notification {
  id: string;
  userId: string;
  courseId: string;
  threadId?: string;
  type: 'new_thread' | 'new_post' | 'endorsed' | 'resolved';
  content: string;
  read: boolean;
  createdAt: string;
}

CourseInsight {
  id: string;
  courseId: string;
  summary: string;
  activeThreads: number;
  topQuestions: string[];
  trendingTopics: string[];
  generatedAt: string;
}

CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;
  recentActivity: number; // threads in last 7 days
}
```

### 2. Query Key Strategy

**Decision:** Add course-scoped query keys following existing patterns

**New Query Keys:**
```typescript
courses: ['courses']
userCourses: (userId: string) => ['userCourses', userId]
courseThreads: (courseId: string) => ['courseThreads', courseId]
notifications: (userId: string, courseId?: string) =>
  courseId ? ['notifications', userId, courseId] : ['notifications', userId]
courseInsights: (courseId: string) => ['courseInsights', courseId]
courseMetrics: (courseId: string) => ['courseMetrics', courseId]
```

**Rationale:**
- Follows existing `['entity']` or `['entity', param]` pattern
- Course-specific data isolated for efficient invalidation
- Optional courseId in notifications allows global + filtered views

### 3. Invalidation Strategy

**Decision:** Cascade invalidations for multi-course consistency

**Rules:**
1. **New Thread Created:**
   - Invalidate: `threads`, `courseThreads(courseId)`, `courseMetrics(courseId)`, `notifications(userId)`

2. **New Post Created:**
   - Invalidate: `thread(id)`, `threads`, `courseThreads(courseId)`, `courseMetrics(courseId)`

3. **Notification Read:**
   - Invalidate: `notifications(userId)`, `notifications(userId, courseId)`

4. **Thread Status Changed:**
   - Invalidate: `thread(id)`, `threads`, `courseThreads(courseId)`, `courseMetrics(courseId)`

**Rationale:**
- Ensures all views stay consistent
- Minimal over-invalidation by targeting specific course scopes
- Follows existing pattern of comprehensive invalidation

### 4. Mock Data Approach

**Decision:** Create realistic multi-course ecosystem with cross-references

**Course Distribution:**
- 3 CS courses (Intro, Data Structures, Algorithms)
- 2 Math courses (Calculus, Linear Algebra)
- 1 Physics course (Mechanics)
- Total: 6 courses across 3 departments

**Enrollment Strategy:**
- Students enrolled in 2-4 courses each
- Instructors teach 1-2 courses
- TAs assist 1-2 courses
- Demo accounts enrolled in 3 courses each

**Notification Generation:**
- 8-12 unread notifications per student
- Course-specific (new threads, replies, endorsements)
- Distributed across enrolled courses
- Recent timestamps (last 1-7 days)

**AI Insights Pattern:**
- Pre-generated summaries for each course
- Based on actual thread content in that course
- Trending topics from thread tags
- Top questions from most-viewed threads

### 5. API Method Design

**Decision:** Follow existing RESTful patterns with course scoping

**New Methods:**
```typescript
getCourses() → Course[]                        // All courses
getUserCourses(userId) → Course[]              // User's enrolled courses
getEnrollments(userId) → Enrollment[]          // User's enrollments
getCourseThreads(courseId) → Thread[]          // Course-specific threads
getNotifications(userId, courseId?) → Notification[]
markNotificationRead(notificationId) → void
markAllNotificationsRead(userId, courseId?) → void
getCourseInsights(courseId) → CourseInsight
getCourseMetrics(courseId) → CourseMetrics
```

**Delay Strategy:**
- Standard data fetch: 200-500ms
- Metrics calculations: 300-500ms (slightly longer)
- AI insights: 600-800ms (simulates generation)
- Quick actions (mark read): 50-100ms

### 6. Storage Layer Updates

**Decision:** Extend localStorage with new keys for courses/enrollments/notifications

**New Storage Keys:**
```typescript
KEYS = {
  // ... existing
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  notifications: "quokkaq.notifications",
}
```

**Helper Functions to Add:**
- `getCourses()`
- `getCoursesByIds(ids: string[])`
- `getEnrollments(userId: string)`
- `getUserCourses(userId: string)`
- `getNotifications(userId: string, courseId?: string)`
- `markNotificationRead(notificationId: string)`
- `addNotification(notification: Notification)`

## Trade-offs Considered

### Alternative: Single "Dashboard" Query vs Multiple Queries

**Rejected Approach:**
```typescript
getDashboardData(userId) → {
  courses: Course[];
  notifications: Notification[];
  metrics: CourseMetrics[];
}
```

**Why Rejected:**
- Violates single responsibility principle
- Harder to invalidate specific data
- Less flexible for different UI needs
- Breaks existing pattern of granular queries

**Chosen Approach:**
- Separate hooks for each data type
- Compose in UI components
- More flexible, better caching

### Alternative: Course Filter on Existing getThreads()

**Rejected Approach:**
```typescript
getThreads(courseId?: string) → Thread[]
```

**Why Rejected:**
- Breaks existing API contract
- Components using getThreads() would need updates
- Complicates query key strategy

**Chosen Approach:**
- Keep `getThreads()` as global thread list
- Add new `getCourseThreads(courseId)` method
- Existing code unchanged, additive only

### Alternative: Nested Course Data in Thread

**Rejected Approach:**
```typescript
interface Thread {
  // ...
  course: Course; // Fully populated course object
}
```

**Why Rejected:**
- Massive data duplication
- Inconsistent with existing hydration pattern
- Harder to keep course data in sync

**Chosen Approach:**
- Keep `courseId` in Thread
- Hydrate course separately when needed
- Follows existing author hydration pattern

## Backend Integration Notes

### What Changes for Real Backend:

1. **API Methods:**
   - Replace `delay()` with actual `fetch()` calls
   - Add error handling for network failures
   - Add authentication headers
   - Handle pagination for large datasets

2. **Data Hydration:**
   - Backend should return populated objects (course with threads)
   - Or use GraphQL for flexible data fetching
   - Consider using data loaders to prevent N+1 queries

3. **Real-time Notifications:**
   - Replace polling with WebSocket or Server-Sent Events
   - Update React Query cache on push notifications
   - Add optimistic UI updates

4. **Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.quokkaq.com
NEXT_PUBLIC_WS_URL=wss://api.quokkaq.com
```

5. **Authentication:**
   - JWT tokens in headers
   - Refresh token logic
   - Session management via HTTP-only cookies

### API Endpoints (Future):

```
GET    /api/courses
GET    /api/users/:userId/courses
GET    /api/courses/:courseId/threads
GET    /api/users/:userId/notifications
PATCH  /api/notifications/:id/read
GET    /api/courses/:courseId/insights
GET    /api/courses/:courseId/metrics
```

## Performance Considerations

### Bundle Size:
- New types add ~2KB (minified)
- New API methods add ~5KB
- Mock data adds ~15KB (courses + enrollments + notifications)
- Total impact: ~22KB (well under 200KB route limit)

### Cache Strategy:
- Course list: 10 minutes stale time (rarely changes)
- User enrollments: 5 minutes stale time
- Notifications: 30 seconds stale time (needs freshness)
- Metrics: 1 minute stale time (balance freshness/performance)
- AI insights: 5 minutes stale time (expensive to generate)

### Optimization Opportunities:
- Prefetch course data on login
- Use React Query's `initialData` for instant renders
- Implement infinite scroll for large thread lists
- Add request deduplication (React Query handles this)

## Files to Modify

1. **`lib/models/types.ts`** - Add new interfaces
2. **`lib/api/client.ts`** - Add new API methods
3. **`lib/api/hooks.ts`** - Add new React Query hooks
4. **`lib/store/localStore.ts`** - Add storage helpers
5. **`mocks/courses.json`** - Create course seed data
6. **`mocks/enrollments.json`** - Create enrollment seed data
7. **`mocks/notifications.json`** - Create notification seed data
8. **`mocks/threads.json`** - Ensure courseId fields are populated (already being done in seed)

## Test Scenarios

1. **Multi-Course Enrollment:**
   - Student sees all enrolled courses
   - Each course shows correct thread count
   - Notifications grouped by course

2. **Course Switching:**
   - Navigate between course thread lists
   - Filters apply correctly
   - Back button works as expected

3. **Notification System:**
   - Unread count displays accurately
   - Marking read updates all views
   - Course-specific notifications filter correctly

4. **AI Insights:**
   - Generate realistic summaries per course
   - Top questions relevant to course content
   - Trending topics match thread tags

5. **Role-Based Metrics:**
   - Students see activity overview
   - Instructors see moderation metrics
   - TAs see relevant course data

6. **Empty States:**
   - New course with no threads
   - No unread notifications
   - No enrollments for new user

7. **Error Handling:**
   - Invalid course ID
   - Network failure simulation
   - Missing enrollment data

## Next Steps

1. Review this research with parent agent
2. Create detailed implementation plan in `plans/api-design.md`
3. Update context.md with decisions
4. Wait for approval before implementation

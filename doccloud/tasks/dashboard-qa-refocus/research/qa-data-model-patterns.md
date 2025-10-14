# Research: Q&A Data Model Patterns

**Date:** 2025-10-13
**Task:** Dashboard Q&A Companion Refocus
**Agent:** Mock API Designer

---

## Executive Summary

This document analyzes existing mock API patterns, data calculation strategies, and React Query integration patterns to inform the design of Quokka Points and Assignment Q&A Opportunities data models.

**Key Findings:**
1. StudentDashboardData follows aggregated calculation pattern (all stats computed server-side)
2. Point sources derived from user activity (threads, posts, endorsements)
3. Sparkline generation uses deterministic seeding for consistency
4. Mock data emphasizes O(1) lookups with pre-calculated aggregates
5. React Query hooks use 2-5 minute stale times for dashboard data

---

## 1. Existing Mock API Architecture

### Data Flow Pattern

```
Mock Store (localStore.ts)
    ↓
API Client Methods (lib/api/client.ts)
    ↓ (delay 200-500ms)
API Response (aggregated + calculated)
    ↓
React Query Hook (lib/api/hooks.ts)
    ↓ (cache 2-5 min)
Component Props
```

**Key Observation:** All calculations happen in `api.getStudentDashboard()` - components receive ready-to-render data.

### Calculation Location

**Current Pattern (StudentDashboardData):**
```typescript
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  // 1. Fetch raw data from store
  const enrollments = getEnrollments(userId);
  const allThreads = getThreads();
  const allPosts = getPosts();

  // 2. Calculate stats (server-side)
  const userThreads = allThreads.filter(t => t.authorId === userId);
  const currentWeek = getCurrentWeekRange();
  const currentThreads = countInDateRange(userThreads, currentWeek);

  // 3. Return aggregated data
  return {
    stats: { /* pre-calculated */ },
    goals: [ /* derived */ ],
    enrolledCourses: [ /* enriched */ ]
  };
}
```

**Implication:** Quokka Points and Assignment Q&A metrics should follow same pattern - calculate in API method, not in component.

---

## 2. Point Calculation Research

### Source: Existing Endorsement Tracking

**Current Implementation (Posts):**
```typescript
// lib/models/types.ts
export interface Post {
  endorsed: boolean;  // Simple boolean flag
  flagged: boolean;
}

// Posts are filtered in getStudentDashboard():
const currentEndorsed = userPosts.filter(
  (p) => p.endorsed && new Date(p.createdAt) >= currentWeek.start
).length;
```

**Limitation:** No granular tracking of WHO endorsed or WHEN.

### Source: AI Answer Endorsements (More Sophisticated)

**Current Implementation (AIAnswer):**
```typescript
export interface AIAnswer {
  studentEndorsements: number;
  instructorEndorsements: number;
  totalEndorsements: number;
  endorsedBy: string[];           // Array of user IDs
  instructorEndorsed: boolean;
}
```

**Implication:** We should track endorsements similar to AIAnswer pattern - store `endorsedBy` array to:
1. Prevent double-counting
2. Calculate point attribution
3. Support weighted endorsements (instructor = 3x)

### Proposed Point Source Data Model

**Extend Post interface with endorsement tracking:**
```typescript
// Option A: Extend Post (matches existing pattern)
export interface Post {
  endorsed: boolean;              // KEEP for backward compat
  endorsedBy?: string[];          // NEW: Track endorsers
  instructorEndorsed?: boolean;   // NEW: Flag instructor endorsement
}

// Option B: New tracking table (more flexible)
export interface Endorsement {
  id: string;
  postId: string;
  endorsedBy: string;
  endorsedByRole: UserRole;
  endorsedAt: string;
}
```

**Recommendation:** Option A (extend Post) - simpler, maintains existing `endorsed` flag for queries.

---

## 3. Sparkline Generation Pattern

### Existing Implementation

**Location:** `lib/utils/dashboard-calculations.ts`

```typescript
export function generateSparkline(
  seedString: string,
  days: number = 7,
  avgValue: number = 5
): number[] {
  // Deterministic random based on seed
  const seed = seedString.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0
  );

  // Generate sparkline values with variation
  const sparkline: number[] = [];
  for (let i = 0; i < days; i++) {
    const pseudoRandom = Math.sin(seed + i) * 10000;
    const variation = (pseudoRandom - Math.floor(pseudoRandom)) * 0.4 - 0.2;
    sparkline.push(Math.max(0, Math.round(avgValue * (1 + variation))));
  }

  return sparkline;
}
```

**Key Features:**
1. **Deterministic:** Same seed → same sparkline (consistent on page reload)
2. **Variation:** ±20% around average value
3. **Seeding:** Uses user-specific string (e.g., `student-${userId}-threads`)

**Implication:** Use same pattern for Quokka Points sparkline:
```typescript
const pointsSparkline = generateSparkline(
  `student-${userId}-quokka-points`,
  7,
  totalPoints / 7  // Average points per day
);
```

---

## 4. Stat Calculation Utilities

### Existing Helper Functions

**Location:** `lib/utils/dashboard-calculations.ts`

```typescript
export function createStatWithTrend(
  currentValue: number,
  previousValue: number,
  label: string,
  sparkline?: number[]
): StatWithTrend {
  const delta = currentValue - previousValue;
  const trendPercent = previousValue > 0
    ? (delta / previousValue) * 100
    : 0;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (delta > 0) trend = 'up';
  else if (delta < 0) trend = 'down';

  return {
    value: currentValue,
    delta,
    trend,
    trendPercent: Math.round(trendPercent * 10) / 10,
    label,
    sparkline,
  };
}

export function getCurrentWeekRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

export function countInDateRange(
  items: Array<{ createdAt: string }>,
  range: DateRange
): number {
  return items.filter(item => {
    const date = new Date(item.createdAt);
    return date >= range.start && date <= range.end;
  }).length;
}
```

**Implication:** Use these utilities for:
- Weekly point calculations
- Point source trend tracking
- Assignment Q&A activity metrics

---

## 5. Assignment Q&A Data Requirements

### Existing Deadline Pattern

**Current Implementation:**
```typescript
// Computed in dashboard component (client-side)
const upcomingDeadlines = useMemo<Deadline[]>(() => {
  return data.enrolledCourses.flatMap((course, index) => [
    {
      id: `${course.id}-deadline-${index}-1`,
      title: "Assignment 3 Due",
      courseId: course.id,
      courseName: course.name,
      type: "assignment" as const,
      dueDate: new Date(Date.now() + (2 + index) * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]).sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  ).slice(0, 5);
}, [data.enrolledCourses]);
```

**Problem:** Mock deadlines, no Q&A metrics.

### Proposed Assignment Q&A Data Source

**New Mock Data Structure:**

```json
// mocks/assignments.json (NEW FILE)
{
  "assignments": [
    {
      "id": "assignment-1",
      "courseId": "course-1",
      "title": "Assignment 3: Binary Search Trees",
      "dueDate": "2025-10-15T23:59:00Z",
      "createdAt": "2025-10-01T00:00:00Z"
    }
  ]
}
```

**Q&A Metrics Calculation (API Method):**
```typescript
// In getStudentDashboard() or new getAssignmentQAMetrics()
const assignment = getAssignment(assignmentId);
const assignmentThreads = allThreads.filter(t =>
  t.courseId === assignment.courseId &&
  t.tags?.includes(`assignment-${assignmentId}`)
);

const qaMetrics: AssignmentQAMetrics = {
  totalQuestions: assignmentThreads.length,
  unansweredQuestions: assignmentThreads.filter(t => t.status === 'open').length,
  yourQuestions: assignmentThreads.filter(t => t.authorId === userId).length,
  yourAnswers: getPosts()
    .filter(p =>
      assignmentThreads.some(t => t.id === p.threadId) &&
      p.authorId === userId
    ).length,
  aiAnswersAvailable: assignmentThreads.filter(t => t.hasAIAnswer).length,
  activeStudents: new Set(assignmentThreads.map(t => t.authorId)).size,
};
```

---

## 6. React Query Hook Patterns

### Dashboard Hook Strategy

**Current Pattern:**
```typescript
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.studentDashboard(userId) : ["studentDashboard"],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,      // 5 minutes
  });
}
```

**Key Characteristics:**
- **Query Key:** Array format `["studentDashboard", userId]`
- **Stale Time:** 2 minutes (short for near-real-time)
- **GC Time:** 5 minutes (keep in cache)
- **Enabled:** Guard with `!!userId`

**Invalidation Strategy:**
```typescript
// After createThread mutation
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });

// After createPost mutation
queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
```

**Implication:** No new hooks needed - extend `useStudentDashboard()` to return new fields.

---

## 7. Performance Considerations

### O(n) Operations in getStudentDashboard()

**Current Complexity:**
```
getEnrollments(userId):          O(n) - filter enrollments array
getThreads():                     O(1) - return all threads
userThreads.filter():             O(n) - filter threads by author
userPosts.filter():               O(n) - filter posts by author
countInDateRange():               O(n) - filter by date range

Total: O(n) where n = total threads + posts
```

**Quokka Points Addition:**
```
Calculate point sources:          O(n) - scan user posts for endorsements
Calculate milestones:             O(1) - static thresholds
Generate sparkline:               O(7) - constant 7-day window

Additional cost: O(n) for endorsement scan
```

**Assignment Q&A Addition:**
```
Get assignments:                  O(1) - fetch assignments
For each assignment:
  Filter threads by tags:         O(t) where t = total threads
  Calculate metrics:              O(t)

Additional cost: O(a * t) where a = assignments, t = threads
Worst case: O(5 * 100) = O(500) - acceptable
```

**Conclusion:** Performance acceptable. All operations O(n) or better.

---

## 8. Mock Data Seeding Strategy

### Existing Seed Pattern

**Location:** `lib/store/localStore.ts`

```typescript
export function seedData() {
  if (isSeeded) return;

  // 1. Load from mocks/*.json
  mockUsers = /* ... */;
  mockCourses = /* ... */;
  mockThreads = /* ... */;

  // 2. Set seeded flag
  isSeeded = true;
}
```

**Implication:** Add Quokka Points data to seed:

```typescript
// Extend seedData()
export function seedData() {
  // ... existing seed logic ...

  // Add endorsement tracking to existing posts
  mockPosts.forEach(post => {
    if (post.endorsed && !post.endorsedBy) {
      // Backfill endorsement data
      post.endorsedBy = ['instructor-1']; // Mock
      post.instructorEndorsed = true;
    }
  });
}
```

---

## 9. Type System Patterns

### Interface Naming Convention

**Observation:**
- Data structures: `StudentDashboardData`, `CourseWithActivity`
- Nested objects: `StatWithTrend`, `GoalProgress`
- Metrics: `CourseMetrics`, `ThreadEngagement`

**Recommendation:**
```typescript
// Main data structure
export interface QuokkaPointsData { /* ... */ }

// Nested types
export interface PointSource { /* ... */ }
export interface PointMilestone { /* ... */ }

// Assignment metrics
export interface AssignmentQAMetrics { /* ... */ }
```

### Type Location

**Pattern:** All types in `lib/models/types.ts` (lines 1-1172)

**Recommendation:** Add new types around line 1090 (after `StudentDashboardData`, before instructor types).

---

## 10. Key Architectural Decisions

### Decision 1: Extend Post vs. New Endorsement Table

**Option A: Extend Post interface**
```typescript
export interface Post {
  endorsed: boolean;              // Existing
  endorsedBy?: string[];          // NEW
  instructorEndorsed?: boolean;   // NEW
}
```

**Pros:**
- Maintains backward compatibility
- Simple queries (`posts.filter(p => p.endorsed)`)
- No additional join logic

**Cons:**
- Mixing concerns (post content + endorsement metadata)

**Option B: New Endorsement table**
```typescript
export interface Endorsement {
  postId: string;
  endorsedBy: string;
  endorsedByRole: UserRole;
  endorsedAt: string;
}
```

**Pros:**
- Clean separation of concerns
- More flexible (can track endorsement history)

**Cons:**
- Requires joins (O(n²) worst case)
- More complex queries

**Recommendation:** **Option A** - Extend Post. Mock data prioritizes simplicity over flexibility.

---

### Decision 2: Calculate Points Client-Side vs. Server-Side

**Option A: Server-side calculation (in API method)**
```typescript
async getStudentDashboard(userId: string) {
  const userPosts = getPosts().filter(p => p.authorId === userId);

  const quokkaPoints: QuokkaPointsData = {
    totalPoints: calculateTotalPoints(userPosts),
    pointSources: calculatePointSources(userPosts),
    // ...
  };

  return { quokkaPoints, /* ... */ };
}
```

**Pros:**
- Consistent with existing pattern
- Security (can't manipulate points client-side)
- Single source of truth

**Cons:**
- Slightly longer API response time

**Option B: Client-side calculation (in component)**
```typescript
const quokkaPoints = useMemo(() => {
  return calculatePoints(data.recentActivity);
}, [data.recentActivity]);
```

**Pros:**
- Faster API response
- More flexible UI calculations

**Cons:**
- Duplicates logic between client/server
- Security risk (client can fake calculations)

**Recommendation:** **Option A** - Server-side. Matches existing architecture, prevents client manipulation.

---

### Decision 3: Assignment Q&A - Fetch Separately vs. Include in Dashboard

**Option A: Include in StudentDashboardData**
```typescript
export interface StudentDashboardData {
  // ... existing fields ...
  assignmentQA: AssignmentQAMetrics[];  // NEW
}
```

**Pros:**
- Single API call
- Atomic data fetch
- Consistent with existing pattern

**Cons:**
- Larger response size
- Can't refresh assignments independently

**Option B: Separate hook**
```typescript
export function useAssignmentQA(userId: string) {
  return useQuery({
    queryKey: ["assignmentQA", userId],
    queryFn: () => api.getAssignmentQA(userId),
    staleTime: 2 * 60 * 1000,
  });
}
```

**Pros:**
- Smaller dashboard response
- Independent invalidation
- More granular caching

**Cons:**
- Additional network request
- Component complexity (multiple loading states)

**Recommendation:** **Option A** - Include in StudentDashboardData. Assignments are core dashboard data, not optional.

---

## 11. Summary of Research Findings

### Confirmed Patterns

1. ✅ **Server-side calculation** - All aggregations in API method
2. ✅ **Extend existing types** - Add fields to Post, StudentDashboardData
3. ✅ **Deterministic sparklines** - Use seeded random for consistency
4. ✅ **2-minute stale time** - Dashboard data cache duration
5. ✅ **O(n) complexity** - Linear scans acceptable for mock data

### Data Dependencies Identified

**Quokka Points requires:**
- User threads (for question points)
- User posts (for answer points)
- Post endorsements (for endorsement points)
- AI answer shares (for share points) - **NEW TRACKING NEEDED**

**Assignment Q&A requires:**
- Assignments table (new mock data)
- Threads tagged with assignment IDs
- Posts linked to assignment threads
- AI answers for assignment threads

### New Mock Data Files Needed

1. ✅ **Extend Post interface** - Add `endorsedBy`, `instructorEndorsed`
2. ✅ **New assignments.json** - Assignment metadata
3. ❌ **No new tracking tables** - Use existing structures

---

## Next Steps

1. Design detailed data model in `plans/data-model-design.md`
2. Specify TypeScript interfaces with exact line numbers
3. Document point calculation algorithms
4. Define mock data generation logic
5. Plan API method modifications
6. Specify React Query hook updates

---

**File References:**
- `lib/models/types.ts` (lines 424-437: StudentDashboardData)
- `lib/api/client.ts` (lines 863-1043: getStudentDashboard)
- `lib/api/hooks.ts` (lines 358-366: useStudentDashboard)
- `lib/utils/dashboard-calculations.ts` (sparkline, stat utilities)
- `app/dashboard/page.tsx` (lines 87-339: StudentDashboard component)

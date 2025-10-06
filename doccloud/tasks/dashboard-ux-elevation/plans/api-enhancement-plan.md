# API Enhancement Plan - Dashboard Trends, Deltas & Goals

**Date:** 2025-10-04
**Author:** Mock API Designer (Sub-Agent)
**Task:** Design mock API extensions for dashboard UX elevation

---

## Overview

This plan details the **exact** TypeScript interfaces, API method enhancements, and mock data generation logic needed to add:
- Weekly trend indicators (↑ 15% / ↓ 8%)
- Delta values (+2 this week)
- Goal tracking (2/5 weekly participation)
- AI coverage percentage (68% coverage)
- Sparkline data (7-day mini charts)

**Key Principle:** Extend, don't break. All changes are **additive** - no existing contracts are modified.

---

## 1. TypeScript Interfaces

### Location: `lib/models/types.ts`

#### 1.1 New Interface: `StatWithTrend`
**Insert after line 305 (after `DashboardData` type)**

```typescript
/**
 * A statistic with trend analysis compared to previous period
 */
export interface StatWithTrend {
  /** Current value (e.g., 12 threads) */
  value: number;

  /** Change from previous period (e.g., +3) */
  delta: number;

  /** Trend direction */
  trend: 'up' | 'down' | 'neutral';

  /** Percentage change (e.g., 15.5 for +15.5%) */
  trendPercent: number;

  /** Label for the statistic (e.g., "Threads", "Posts") */
  label: string;

  /** Optional sparkline data (7 daily values) */
  sparkline?: number[];
}
```

**Rationale:**
- Encapsulates all trend-related data in one type
- `trend` enum prevents typos ("up" vs "increase")
- `trendPercent` separate from `delta` for clarity (percentage vs absolute)
- Optional `sparkline` keeps it lightweight for simple stats

---

#### 1.2 New Interface: `GoalProgress`
**Insert after `StatWithTrend`**

```typescript
/**
 * Goal tracking with progress calculation
 */
export interface GoalProgress {
  /** Goal identifier (e.g., "weekly-participation") */
  id: string;

  /** Human-readable goal title */
  title: string;

  /** Detailed description */
  description: string;

  /** Current progress value */
  current: number;

  /** Target value to achieve */
  target: number;

  /** Progress percentage (0-100+) */
  progress: number;

  /** Whether goal is achieved */
  achieved: boolean;

  /** Time period for goal (e.g., "weekly", "monthly") */
  period: 'daily' | 'weekly' | 'monthly';

  /** Goal category (for filtering/grouping) */
  category: 'participation' | 'quality' | 'engagement' | 'response-time';
}
```

**Rationale:**
- `id` enables stable references (no relying on title)
- `period` allows future extension (daily/monthly goals)
- `category` groups related goals (UI can filter by category)
- `progress` is calculated, not stored (ensures consistency)

---

#### 1.3 Modified Interface: `StudentDashboardData`
**Replace existing `stats` property (lines 283-288)**

**BEFORE:**
```typescript
stats: {
  totalCourses: number;
  totalThreads: number;
  totalPosts: number;
  endorsedPosts: number;
};
```

**AFTER:**
```typescript
stats: {
  totalCourses: StatWithTrend;
  totalThreads: StatWithTrend;
  totalPosts: StatWithTrend;
  endorsedPosts: StatWithTrend;
};
goals: GoalProgress[];
```

**Migration Impact:**
- **BREAKING CHANGE** for components expecting `stats.totalCourses` as number
- Must update dashboard page to handle `stats.totalCourses.value`
- **Rollback plan:** Keep old interface as `StudentDashboardDataLegacy`

---

#### 1.4 Modified Interface: `InstructorDashboardData`
**Replace existing `stats` property (lines 299-304)**

**BEFORE:**
```typescript
stats: {
  totalCourses: number;
  totalThreads: number;
  unansweredThreads: number;
  activeStudents: number;
};
```

**AFTER:**
```typescript
stats: {
  totalCourses: StatWithTrend;
  totalThreads: StatWithTrend;
  unansweredThreads: StatWithTrend;
  activeStudents: StatWithTrend;
  aiCoverage: StatWithTrend;  // NEW: AI coverage percentage
};
goals: GoalProgress[];
```

**New Field: `aiCoverage`**
- `value`: Percentage of threads with AI answers (60-80%)
- `delta`: Change from last week (+/- 3-5%)
- `label`: "AI Coverage"

---

#### 1.5 Modified Interface: `CourseMetrics`
**Add sparkline fields (after line 179)**

**BEFORE:**
```typescript
export interface CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;
  recentActivity: number;
}
```

**AFTER:**
```typescript
export interface CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;
  recentActivity: number;

  // NEW: Trend data
  threadSparkline?: number[];       // 7-day thread creation trend
  activitySparkline?: number[];     // 7-day activity trend
  aiCoveragePercent?: number;       // % of threads with AI answers
}
```

**Rationale:**
- Optional fields (backward compatible)
- Course cards can show mini trends
- AI coverage at course level

---

## 2. Utility Functions

### Location: `lib/utils/dashboard-calculations.ts` (NEW FILE)

```typescript
/**
 * Dashboard calculation utilities
 * Pure functions for trend analysis, goal tracking, and sparkline generation
 */

// ============================================
// Trend Calculation
// ============================================

export interface TrendResult {
  delta: number;
  percent: number;
  direction: 'up' | 'down' | 'neutral';
}

/**
 * Calculate trend between current and previous period
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Trend analysis with delta, percentage, direction
 *
 * @example
 * calculateTrend(15, 10) // { delta: 5, percent: 50, direction: 'up' }
 * calculateTrend(8, 10)  // { delta: -2, percent: -20, direction: 'down' }
 * calculateTrend(10, 10) // { delta: 0, percent: 0, direction: 'neutral' }
 */
export function calculateTrend(current: number, previous: number): TrendResult {
  const delta = current - previous;

  // Avoid division by zero
  const percent = previous === 0
    ? (current > 0 ? 100 : 0)
    : (delta / previous) * 100;

  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';

  return {
    delta: Math.round(delta),
    percent: Math.round(percent * 10) / 10, // 1 decimal place
    direction,
  };
}

// ============================================
// Goal Progress Calculation
// ============================================

export interface GoalProgressResult {
  progress: number;
  achieved: boolean;
}

/**
 * Calculate goal progress percentage
 *
 * @param current - Current progress
 * @param target - Target goal
 * @returns Progress percentage and achievement status
 *
 * @example
 * calculateGoalProgress(7, 10) // { progress: 70, achieved: false }
 * calculateGoalProgress(12, 10) // { progress: 120, achieved: true }
 * calculateGoalProgress(0, 5) // { progress: 0, achieved: false }
 */
export function calculateGoalProgress(current: number, target: number): GoalProgressResult {
  if (target <= 0) {
    return { progress: 0, achieved: false };
  }

  const progress = Math.round((current / target) * 100);
  const achieved = current >= target;

  return { progress, achieved };
}

// ============================================
// Sparkline Generation
// ============================================

/**
 * Generate deterministic sparkline data based on seed
 *
 * @param seed - String seed for deterministic generation
 * @param days - Number of days to generate (default: 7)
 * @param baseValue - Starting base value (default: 10)
 * @returns Array of daily values
 *
 * @example
 * generateSparkline("course-1-threads", 7, 10)
 * // [8, 9, 11, 12, 10, 13, 15]
 */
export function generateSparkline(seed: string, days = 7, baseValue = 10): number[] {
  // Simple hash function for consistent seeding
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Seeded random function
  let seedValue = Math.abs(hash);
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const values: number[] = [];
  let currentValue = baseValue;

  for (let i = 0; i < days; i++) {
    // Random walk: +/- 0-3 each day
    const change = Math.floor(seededRandom() * 7) - 3; // -3 to +3
    currentValue = Math.max(0, currentValue + change); // No negatives
    values.push(Math.round(currentValue));
  }

  return values;
}

// ============================================
// Date Range Helpers
// ============================================

export interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Get date range for current week (last 7 days)
 */
export function getCurrentWeekRange(): WeekRange {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

/**
 * Get date range for previous week (7-14 days ago)
 */
export function getPreviousWeekRange(): WeekRange {
  const currentWeek = getCurrentWeekRange();
  const end = currentWeek.start;
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Check if date is within range
 */
export function isInDateRange(date: string | Date, range: WeekRange): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d >= range.start && d <= range.end;
}

// ============================================
// AI Coverage Calculation
// ============================================

/**
 * Calculate AI coverage percentage for a course
 * Mock implementation - assumes 60-80% coverage
 *
 * @param courseId - Course identifier for deterministic generation
 * @returns Percentage (0-100)
 */
export function calculateAICoverage(courseId: string): number {
  // Hash course ID to get consistent percentage
  const hash = courseId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  const normalized = Math.abs(hash) % 21; // 0-20 range
  return 60 + normalized; // 60-80% coverage
}
```

**File Size:** ~200 lines
**Test Scenarios:**
1. `calculateTrend(10, 0)` → avoid division by zero
2. `calculateTrend(0, 10)` → handle negative 100%
3. `generateSparkline("same-seed")` → deterministic output
4. `isInDateRange()` → boundary conditions

---

## 3. API Method Enhancements

### Location: `lib/api/client.ts`

#### 3.1 Update `getStudentDashboard()`
**Lines 483-605** - Extensive modification

**New Logic Flow:**
1. Fetch all data (courses, threads, posts) - **UNCHANGED**
2. **NEW:** Calculate week ranges
3. **NEW:** Filter data by current/previous week
4. **NEW:** Calculate trends for each stat
5. **NEW:** Generate student goals
6. **NEW:** Build enhanced stats object
7. Return enhanced `StudentDashboardData`

**Pseudocode:**
```typescript
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(200 + Math.random() * 200);
  seedData();

  // 1. Fetch data (existing logic)
  const enrollments = getEnrollments(userId);
  const allThreads = getThreads();
  const allPosts = getPosts();

  // 2. Calculate week ranges (NEW)
  const currentWeek = getCurrentWeekRange();
  const previousWeek = getPreviousWeekRange();

  // 3. Filter by user (existing)
  const userThreads = allThreads.filter(t => t.authorId === userId);
  const userPosts = allPosts.filter(p => p.authorId === userId);

  // 4. Split by week (NEW)
  const currentThreads = userThreads.filter(t => isInDateRange(t.createdAt, currentWeek));
  const previousThreads = userThreads.filter(t => isInDateRange(t.createdAt, previousWeek));
  const currentPosts = userPosts.filter(p => isInDateRange(p.createdAt, currentWeek));
  const previousPosts = userPosts.filter(p => isInDateRange(p.createdAt, previousWeek));

  // 5. Calculate trends (NEW)
  const coursesTrend = calculateTrend(enrollments.length, enrollments.length); // Static
  const threadsTrend = calculateTrend(currentThreads.length, previousThreads.length);
  const postsTrend = calculateTrend(currentPosts.length, previousPosts.length);

  const currentEndorsed = currentPosts.filter(p => p.endorsed).length;
  const previousEndorsed = userPosts.filter(p =>
    p.endorsed && isInDateRange(p.updatedAt, previousWeek)
  ).length;
  const endorsedTrend = calculateTrend(currentEndorsed, previousEndorsed);

  // 6. Build stats with trends (NEW)
  const stats = {
    totalCourses: {
      value: enrollments.length,
      delta: coursesTrend.delta,
      trend: coursesTrend.direction,
      trendPercent: coursesTrend.percent,
      label: 'Courses',
      sparkline: generateSparkline(`student-${userId}-courses`, 7, enrollments.length),
    },
    totalThreads: {
      value: userThreads.length,
      delta: threadsTrend.delta,
      trend: threadsTrend.direction,
      trendPercent: threadsTrend.percent,
      label: 'Threads',
      sparkline: generateSparkline(`student-${userId}-threads`, 7, Math.max(5, userThreads.length)),
    },
    totalPosts: {
      value: userPosts.length,
      delta: postsTrend.delta,
      trend: postsTrend.direction,
      trendPercent: postsTrend.percent,
      label: 'Posts',
      sparkline: generateSparkline(`student-${userId}-posts`, 7, Math.max(8, userPosts.length)),
    },
    endorsedPosts: {
      value: userPosts.filter(p => p.endorsed).length,
      delta: endorsedTrend.delta,
      trend: endorsedTrend.direction,
      trendPercent: endorsedTrend.percent,
      label: 'Endorsed',
      sparkline: generateSparkline(`student-${userId}-endorsed`, 7, 3),
    },
  };

  // 7. Generate goals (NEW)
  const participationGoal: GoalProgress = {
    id: 'weekly-participation',
    title: 'Weekly Participation',
    description: 'Post in 2 threads per week',
    current: currentPosts.length,
    target: 2,
    ...calculateGoalProgress(currentPosts.length, 2),
    period: 'weekly',
    category: 'participation',
  };

  const endorsementGoal: GoalProgress = {
    id: 'weekly-endorsements',
    title: 'Quality Contributions',
    description: 'Earn 1 endorsed reply per week',
    current: currentEndorsed,
    target: 1,
    ...calculateGoalProgress(currentEndorsed, 1),
    period: 'weekly',
    category: 'quality',
  };

  const questionGoal: GoalProgress = {
    id: 'weekly-questions',
    title: 'Thoughtful Questions',
    description: 'Ask 1 question per week',
    current: currentThreads.length,
    target: 1,
    ...calculateGoalProgress(currentThreads.length, 1),
    period: 'weekly',
    category: 'participation',
  };

  const goals = [participationGoal, endorsementGoal, questionGoal];

  // 8. Return enhanced data
  return {
    enrolledCourses, // existing
    recentActivity,  // existing
    notifications,   // existing
    unreadCount,     // existing
    stats,           // ENHANCED
    goals,           // NEW
  };
}
```

**Network Delay:** 200-400ms (unchanged)
**Return Type:** `StudentDashboardData` (interface updated)

---

#### 3.2 Update `getInstructorDashboard()`
**Lines 610-720** - Similar enhancements

**New Logic:**
1. Fetch managed courses and threads - **UNCHANGED**
2. **NEW:** Calculate trends for each stat
3. **NEW:** Add AI coverage stat
4. **NEW:** Generate instructor goals
5. **NEW:** Enhance course metrics with sparklines
6. Return enhanced `InstructorDashboardData`

**AI Coverage Calculation:**
```typescript
// Mock: Assume 60-80% of threads have AI answers
const allManagedThreads = allThreads.filter(t => managedCourseIds.includes(t.courseId));
const avgAICoverage = managedCourses.reduce((sum, course) => {
  return sum + calculateAICoverage(course.id);
}, 0) / managedCourses.length;

const aiCoverageStat: StatWithTrend = {
  value: Math.round(avgAICoverage),
  delta: Math.floor(Math.random() * 7) - 3, // +/- 3% mock delta
  trend: avgAICoverage > 70 ? 'up' : 'neutral',
  trendPercent: 5, // Mock 5% trend
  label: 'AI Coverage',
};
```

**Instructor Goals:**
```typescript
const goals: GoalProgress[] = [
  {
    id: 'response-time',
    title: 'Quick Response',
    description: 'Answer 80% of questions within 24 hours',
    current: 75, // Mock
    target: 80,
    progress: 94,
    achieved: false,
    period: 'weekly',
    category: 'response-time',
  },
  {
    id: 'ai-accuracy',
    title: 'AI Coverage',
    description: 'Maintain 70%+ AI answer coverage',
    current: Math.round(avgAICoverage),
    target: 70,
    ...calculateGoalProgress(Math.round(avgAICoverage), 70),
    period: 'weekly',
    category: 'quality',
  },
  {
    id: 'student-engagement',
    title: 'Student Engagement',
    description: 'Keep 60%+ of students active weekly',
    current: Math.round((stats.activeStudents.value / 100) * 65), // Mock
    target: 60,
    progress: 65,
    achieved: true,
    period: 'weekly',
    category: 'engagement',
  },
];
```

---

#### 3.3 Update `getCourseMetrics()`
**Lines 273-304** - Add sparklines

**Enhancement:**
```typescript
async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
  await delay(300 + Math.random() * 200);
  seedData();

  // ... existing metric calculations ...

  // NEW: Add sparklines
  const baseThreadCount = Math.max(5, threads.length / 7); // Avg per day
  const threadSparkline = generateSparkline(`course-${courseId}-threads`, 7, baseThreadCount);
  const activitySparkline = generateSparkline(`course-${courseId}-activity`, 7, baseThreadCount * 1.5);
  const aiCoveragePercent = calculateAICoverage(courseId);

  return {
    threadCount: threads.length,
    unansweredCount: threads.filter(t => t.status === 'open').length,
    answeredCount: threads.filter(t => t.status === 'answered').length,
    resolvedCount: threads.filter(t => t.status === 'resolved').length,
    activeStudents: studentAuthors.size,
    recentActivity: recentThreads.length,

    // NEW FIELDS
    threadSparkline,
    activitySparkline,
    aiCoveragePercent,
  };
}
```

---

## 4. React Query Hooks

### Location: `lib/api/hooks.ts`

**NO CHANGES REQUIRED**

Hooks already query the correct API methods:
- `useStudentDashboard(userId)` → `api.getStudentDashboard()`
- `useInstructorDashboard(userId)` → `api.getInstructorDashboard()`
- `useCourseMetrics(courseId)` → `api.getCourseMetrics()`

Query keys remain stable:
- `['studentDashboard', userId]`
- `['instructorDashboard', userId]`
- `['courseMetrics', courseId]`

**Invalidation:** No changes needed - existing mutations already invalidate dashboard queries.

---

## 5. Mock Data Requirements

### No New JSON Files Needed

All trend/goal data is **calculated on demand** from existing:
- `mocks/threads.json` → filter by date
- `mocks/posts.json` → filter by date
- `mocks/courses.json` → calculate AI coverage

### Seed Data Requirements

**Existing seed data MUST have:**
1. **Varied timestamps** - threads/posts across 14+ days
2. **Endorsed posts** - at least 3-5 endorsed posts per user
3. **Active courses** - 2-3 courses per student

**Action Required:** Verify seed data in `scripts/seed-demo.mjs` has realistic date ranges.

**Date Distribution Pattern:**
```javascript
// Example: Create threads over 14 days
const now = new Date();
for (let i = 0; i < 14; i++) {
  const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
  // Create 1-3 threads for this day
}
```

---

## 6. Implementation Checklist

### Phase 1: Type Definitions (File: `lib/models/types.ts`)
- [ ] Add `StatWithTrend` interface after line 305
- [ ] Add `GoalProgress` interface after `StatWithTrend`
- [ ] Update `StudentDashboardData.stats` to use `StatWithTrend`
- [ ] Add `StudentDashboardData.goals` property
- [ ] Update `InstructorDashboardData.stats` to use `StatWithTrend`
- [ ] Add `InstructorDashboardData.stats.aiCoverage` field
- [ ] Add `InstructorDashboardData.goals` property
- [ ] Update `CourseMetrics` with optional sparkline fields
- [ ] Run `npx tsc --noEmit` to verify types

### Phase 2: Utility Functions (File: `lib/utils/dashboard-calculations.ts` - NEW)
- [ ] Create new file `lib/utils/dashboard-calculations.ts`
- [ ] Implement `calculateTrend(current, previous)`
- [ ] Implement `calculateGoalProgress(current, target)`
- [ ] Implement `generateSparkline(seed, days, baseValue)`
- [ ] Implement `getCurrentWeekRange()` and `getPreviousWeekRange()`
- [ ] Implement `isInDateRange(date, range)`
- [ ] Implement `calculateAICoverage(courseId)`
- [ ] Add JSDoc comments to all functions
- [ ] Test edge cases (zeros, negatives, same values)

### Phase 3: API Method Updates (File: `lib/api/client.ts`)
- [ ] Import utilities from `dashboard-calculations.ts`
- [ ] Update `getStudentDashboard()` to calculate trends
- [ ] Update `getStudentDashboard()` to generate goals
- [ ] Update `getStudentDashboard()` to build enhanced stats
- [ ] Update `getInstructorDashboard()` to calculate trends
- [ ] Update `getInstructorDashboard()` to add AI coverage stat
- [ ] Update `getInstructorDashboard()` to generate goals
- [ ] Update `getCourseMetrics()` to add sparklines
- [ ] Run `npx tsc --noEmit` to verify no type errors

### Phase 4: Verification
- [ ] Build project: `npm run build`
- [ ] Check bundle size: Ensure utilities don't add >5KB
- [ ] Test dashboard loading: Verify data structure in browser console
- [ ] Test trends: Verify percentages calculate correctly
- [ ] Test goals: Verify progress percentages are accurate
- [ ] Test sparklines: Verify arrays have 7 elements
- [ ] Test edge cases: New users, empty courses, zero stats

### Phase 5: Documentation
- [ ] Update `context.md` Decisions section with rationale
- [ ] Document breaking changes in CHANGELOG
- [ ] Add inline comments for complex calculations
- [ ] Prepare migration guide for dashboard components

---

## 7. Test Scenarios

### Unit Tests (Future)

**Trend Calculation:**
```typescript
expect(calculateTrend(15, 10)).toEqual({ delta: 5, percent: 50, direction: 'up' });
expect(calculateTrend(8, 10)).toEqual({ delta: -2, percent: -20, direction: 'down' });
expect(calculateTrend(10, 0)).toEqual({ delta: 10, percent: 100, direction: 'up' }); // Zero division
expect(calculateTrend(0, 10)).toEqual({ delta: -10, percent: -100, direction: 'down' });
```

**Goal Progress:**
```typescript
expect(calculateGoalProgress(7, 10)).toEqual({ progress: 70, achieved: false });
expect(calculateGoalProgress(12, 10)).toEqual({ progress: 120, achieved: true });
expect(calculateGoalProgress(0, 0)).toEqual({ progress: 0, achieved: false }); // Zero target
```

**Sparkline:**
```typescript
const spark1 = generateSparkline('same-seed', 7, 10);
const spark2 = generateSparkline('same-seed', 7, 10);
expect(spark1).toEqual(spark2); // Deterministic

expect(spark1).toHaveLength(7);
expect(spark1.every(v => v >= 0)).toBe(true); // No negatives
```

### Integration Tests (Manual)

1. **Student Dashboard:**
   - Load `/dashboard` as student
   - Verify stats show `{ value, delta, trend, trendPercent }`
   - Verify goals array has 3 items
   - Verify sparklines are arrays of 7 numbers

2. **Instructor Dashboard:**
   - Load `/dashboard` as instructor
   - Verify stats include `aiCoverage` field
   - Verify goals array has 3 items
   - Verify course metrics have sparklines

3. **Edge Cases:**
   - New user (< 7 days old) → trends should handle gracefully
   - Inactive user (no posts this week) → deltas should be negative or zero
   - Empty course → sparklines should show low values, not errors

---

## 8. Backend Integration Notes

### What Will Change?

**When connecting to real backend:**

1. **Historical Data Storage:**
   - Backend will store daily/weekly snapshots
   - Replace mock calculations with real DB queries
   - Example: `SELECT COUNT(*) FROM threads WHERE created_at BETWEEN ? AND ?`

2. **Goal Management:**
   - Move from hardcoded to user-configurable
   - Add endpoints: `GET /api/goals`, `POST /api/goals`, `PATCH /api/goals/:id`
   - Store goal state in database

3. **AI Coverage:**
   - Replace mock calculation with real metadata
   - Query: `SELECT (COUNT(*) FILTER (WHERE ai_answered = true)) / COUNT(*) FROM threads`
   - Track AI answer quality scores

4. **Sparklines:**
   - Pre-calculate daily aggregates in background job
   - Store in `dashboard_metrics` table
   - Return cached sparkline data instead of generating on demand

5. **Network Delays:**
   - Remove artificial `delay()` calls
   - Actual response times will vary based on DB performance
   - Add caching (Redis) for expensive calculations

### Environment Variables

```bash
# Feature flags
ENABLE_GOALS_TRACKING=true
ENABLE_SPARKLINES=true

# Calculation settings
TREND_WINDOW_DAYS=7
SPARKLINE_DAYS=7
```

### Authentication

All dashboard endpoints will require:
- Valid JWT token
- User ID from token (not URL param)
- Authorization check (students can't see instructor data)

---

## 9. Performance Implications

### Calculation Overhead

**Current:** Dashboard API takes 200-400ms
**After:** Dashboard API may take 250-450ms (+50ms)

**Why:**
- Filtering by date: O(n) where n = thread count
- Trend calculations: O(1) per stat (4-5 stats)
- Sparkline generation: O(7) per sparkline (trivial)
- Goal generation: O(1) per goal (3 goals)

**Total overhead:** ~50ms for typical dataset (100 threads, 200 posts)

### Bundle Size

**New code:**
- `dashboard-calculations.ts`: ~2KB minified
- Type definitions: 0KB (compile-time only)
- No new dependencies

**Total bundle increase:** <3KB

### Memory Usage

**Sparkline arrays:**
- 7 numbers × 4 bytes = 28 bytes per sparkline
- 4-5 sparklines per dashboard = 140 bytes
- Negligible impact

---

## 10. Accessibility Considerations

### Screen Reader Announcements

**Trend indicators:**
```html
<span aria-label="Threads: 12, up 15% from last week">
  12 <span aria-hidden="true">↑ 15%</span>
</span>
```

**Goal progress:**
```html
<div role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" aria-label="Weekly participation: 7 out of 10">
  70%
</div>
```

**Sparklines:**
```html
<svg aria-label="Thread activity trend: 8, 9, 11, 12, 10, 13, 15">
  <!-- visual sparkline -->
</svg>
```

**Implementation:** Dashboard components must add ARIA attributes (handled in component plan, not API).

---

## Summary

**Files Modified:**
1. `lib/models/types.ts` - Add `StatWithTrend`, `GoalProgress`, update dashboard interfaces
2. `lib/utils/dashboard-calculations.ts` (NEW) - Trend/goal/sparkline utilities
3. `lib/api/client.ts` - Enhance `getStudentDashboard()`, `getInstructorDashboard()`, `getCourseMetrics()`

**Files Unchanged:**
- `lib/api/hooks.ts` - No changes needed
- `mocks/*.json` - No new files (calculations from existing data)

**Breaking Changes:**
- `StudentDashboardData.stats` fields now return `StatWithTrend` objects, not numbers
- `InstructorDashboardData.stats` fields now return `StatWithTrend` objects, not numbers
- Dashboard page components MUST update to use `.value` property

**New Capabilities:**
- Weekly trend indicators (↑/↓ with percentage)
- Delta values (±N from last week)
- Goal tracking (current/target with progress)
- AI coverage percentage (60-80% mock)
- Sparkline arrays (7-day trends)

**Next Steps:**
1. Implement type definitions
2. Create utility functions
3. Update API methods
4. Update dashboard page components (separate plan)
5. Test all scenarios
6. Update documentation

---

**End of Plan**

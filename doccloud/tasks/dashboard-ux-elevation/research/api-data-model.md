# API Data Model Research - Dashboard Trends & Goals

**Date:** 2025-10-04
**Purpose:** Analyze current dashboard data structure and design enhancements for trends, deltas, goals, and sparklines

---

## 1. Current Dashboard Data Structure

### Student Dashboard (StudentDashboardData)
Located: `lib/models/types.ts:278-289`

```typescript
interface StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  stats: {
    totalCourses: number;      // Static count
    totalThreads: number;       // Static count
    totalPosts: number;         // Static count
    endorsedPosts: number;      // Static count
  };
}
```

**Current Limitations:**
- Stats are **static numbers** with no context
- No historical data or trends
- No comparison to previous periods
- No goal tracking or progress indicators
- No visual data for sparklines

### Instructor Dashboard (InstructorDashboardData)
Located: `lib/models/types.ts:294-305`

```typescript
interface InstructorDashboardData {
  managedCourses: CourseWithMetrics[];
  unansweredQueue: Thread[];
  recentActivity: ActivityItem[];
  insights: CourseInsight[];
  stats: {
    totalCourses: number;          // Static count
    totalThreads: number;          // Static count
    unansweredThreads: number;     // Static count
    activeStudents: number;        // Static count
  };
}
```

**Current Limitations:**
- Same as student dashboard - static numbers only
- Course-level metrics exist but no trends/deltas
- No AI coverage percentage visible
- No goal tracking for instructor KPIs

---

## 2. Data Needed for Trends & Deltas

### Trend Indicators
**Visual:** ↑ 15% or ↓ 8%

**Required Data:**
- Current period value (e.g., current week)
- Previous period value (e.g., last week)
- Calculation: `((current - previous) / previous) * 100`

**Timeframe Choices:**
- **Week-over-week (WoW)** - Most relevant for dashboard activity
- **Month-over-month (MoM)** - Too slow for classroom dynamics
- **Day-over-day (DoD)** - Too volatile, noisy

**Decision: Use week-over-week (7-day rolling window)**

### Delta Values
**Visual:** "+2 this week" or "-3 this week"

**Required Data:**
- Count of new items in current period
- Simple difference, not percentage

**Examples:**
- Threads: "+5 threads this week"
- Posts: "+12 replies this week"
- Endorsed: "+3 endorsed this week"

---

## 3. Goal Tracking Approach

### Where Goals Come From

**Option A: Hardcoded Course Defaults**
- Easy to implement (no user input needed)
- Realistic for demo purposes
- Example: "Participate in 2 threads per week"

**Option B: User-Set Goals**
- Requires UI for goal creation
- Needs persistence layer
- Out of scope for frontend-only demo

**Option C: AI-Suggested Goals**
- Based on course averages
- "Top 25% of students post 5+ times per week"
- Feels dynamic but requires baseline calculation

**Decision: Option A - Hardcoded defaults per role**

### Goal Types

**Student Goals:**
1. **Weekly Participation** - "Post in 2 threads per week" (target: 2)
2. **Endorsement Target** - "Earn 1 endorsed reply per week" (target: 1)
3. **Question Quality** - "Ask 1 thoughtful question per week" (target: 1)

**Instructor Goals:**
1. **Response Time** - "Answer 80% of questions within 24 hours" (target: 80%)
2. **AI Coverage** - "Maintain 70%+ AI answer accuracy" (target: 70%)
3. **Student Engagement** - "Keep 60%+ of students active weekly" (target: 60%)

### Goal Progress Calculation

**Structure:**
```typescript
{
  current: number;    // Current progress
  target: number;     // Goal target
  progress: number;   // Percentage (current / target * 100)
  achieved: boolean;  // current >= target
}
```

**Example:**
```typescript
{
  current: 2,
  target: 5,
  progress: 40,
  achieved: false
}
```

---

## 4. Sparkline Data Generation

### What Are Sparklines?
- Tiny line/bar charts (50-100px wide)
- Show trend over time without axis labels
- Example: `[5, 7, 6, 9, 12, 11, 15]` → visual trend

### Data Requirements

**Points Needed:** 7-14 data points (1-2 weeks of daily data)
**Frequency:** Daily snapshots
**Metrics to Track:**
- Thread activity (new threads per day)
- Post activity (new replies per day)
- Unanswered queue size (snapshot at end of day)
- Active students (unique posters per day)

### Mock Data Generation Strategy

**Approach 1: Random Within Range**
```typescript
// Generate 7 days of data with slight upward trend
[5, 6, 7, 8, 9, 10, 12]
```
**Pros:** Easy to implement
**Cons:** Too random, unrealistic patterns

**Approach 2: Seed-Based Deterministic**
```typescript
// Use course ID as seed for consistent sparklines
function generateSparkline(courseId: string, metric: string): number[] {
  const seed = hashCode(courseId + metric);
  return generateTrendWithSeed(seed, 7);
}
```
**Pros:** Deterministic, realistic trends
**Cons:** More complex logic

**Decision: Approach 2 - Seed-based with realistic trends**

**Implementation Pattern:**
- Base value from course ID hash (5-15 range)
- Add random walk (+/- 1-3 per day)
- Constrain to min 0, max 2x base value
- Return array of 7 values (last 7 days)

---

## 5. AI Coverage Percentage

### What is AI Coverage?
**Definition:** Percentage of threads where AI generated an answer

**Calculation:**
```typescript
const threadsWithAI = threads.filter(t => t.hasAIAnswer).length;
const coverage = (threadsWithAI / threads.length) * 100;
```

### Where to Display?
1. **Instructor Stats Card** - "AI Coverage: 68%"
2. **Course Cards** - Per-course AI coverage percentage
3. **Trend Indicator** - "↑ 5% from last week"

### Mock Data Strategy
- Assume 60-80% coverage for active courses
- Use course ID hash to generate consistent percentage
- Add small weekly delta (+/- 3-5%)

---

## 6. Time Window Definitions

### Current Week
```typescript
const now = new Date();
const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
```

### Previous Week
```typescript
const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
const previousWeekEnd = currentWeekStart;
```

### Daily Buckets (for sparklines)
```typescript
const days = [];
for (let i = 6; i >= 0; i--) {
  const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
  days.push(day);
}
```

---

## 7. Data Fetching Patterns

### Current API Methods
- `getStudentDashboard(userId)` - Returns StudentDashboardData
- `getInstructorDashboard(userId)` - Returns InstructorDashboardData

**No changes needed to method signatures** - we enhance the returned data structures.

### Network Delays
- Dashboard data: 200-400ms (current)
- Keep same delay - no expensive AI operations
- Trend calculations happen in-memory

---

## 8. Mock Data Persistence

### Current Approach
- In-memory LocalStorage via `lib/store/localStore.ts`
- Seed data on first load
- Data persists across sessions

### New Requirements
- **Historical snapshots:** Store daily/weekly counts
- **Goal state:** Track user goal progress
- **Sparkline cache:** Pre-generate sparkline arrays

### Storage Strategy

**Option A: Expand LocalStorage Schema**
```typescript
{
  dashboardHistory: {
    [userId]: {
      [date: string]: { threads: number; posts: number; ... }
    }
  }
}
```
**Pros:** Persistent across reloads
**Cons:** Complex migration, out of scope

**Option B: Calculate on Demand from Existing Data**
```typescript
// Filter threads/posts by date range
const currentWeek = threads.filter(t => isInCurrentWeek(t.createdAt));
const previousWeek = threads.filter(t => isInPreviousWeek(t.createdAt));
```
**Pros:** No schema changes, uses existing data
**Cons:** Limited to data within seed range

**Decision: Option B - Calculate trends from existing thread/post timestamps**

---

## 9. Edge Cases & Constraints

### New Users (< 1 week old account)
- **Trend:** Show "New" badge instead of trend arrow
- **Delta:** Show absolute count only
- **Goal:** Start tracking from day 1

### Low Activity Courses
- **Trend:** May show 100%+ swings (2 → 4 threads = +100%)
- **Cap display:** Max ±999% to prevent UI overflow

### Empty States
- **No data:** Show "—" or "N/A" instead of 0%
- **Goal Progress:** Show 0% progress, not error state

### Timezone Handling
- **Use ISO strings:** All timestamps already in ISO 8601
- **UTC calculations:** Avoid timezone complexity in mock data

---

## 10. Existing Patterns to Follow

### Type Safety
```typescript
// All new interfaces in lib/models/types.ts
export interface StatWithTrend {
  value: number;
  delta: number;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
}
```

### API Method Convention
```typescript
// All methods return Promises
// All methods use delay() simulation
async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
  await delay(200 + Math.random() * 200);
  // ... calculations
}
```

### React Query Hooks
```typescript
// Hooks in lib/api/hooks.ts
// Query keys follow pattern: [resourceType, ...identifiers]
queryKey: queryKeys.studentDashboard(userId)
```

---

## 11. Dependencies & Imports

### No New Dependencies Needed
All functionality can be implemented with:
- Existing type system (TypeScript)
- Standard JavaScript Date APIs
- Math functions for trends/deltas
- Existing LocalStorage helpers

### Utility Functions to Create
1. `calculateTrend(current, previous)` → `{ delta, percent, direction }`
2. `generateSparkline(seed, days)` → `number[]`
3. `calculateGoalProgress(current, target)` → `{ progress, achieved }`
4. `getWeekRange(date)` → `{ start, end }`

**Location:** `lib/utils/dashboard-calculations.ts` (new file)

---

## Summary of Research Findings

1. **Current Structure:** Static stats only, no trends or goals
2. **Trend Strategy:** Week-over-week comparison using existing data
3. **Goal Approach:** Hardcoded defaults per role (no user input needed)
4. **Sparklines:** 7-day arrays, seed-based generation
5. **AI Coverage:** Calculate from thread metadata
6. **Data Source:** Filter existing threads/posts by date range
7. **No Breaking Changes:** Enhance return types, keep API signatures
8. **No New Dependencies:** Pure TypeScript/JavaScript
9. **Utility Functions:** Need new calculation helpers
10. **Type Safety:** All new interfaces, no `any` types

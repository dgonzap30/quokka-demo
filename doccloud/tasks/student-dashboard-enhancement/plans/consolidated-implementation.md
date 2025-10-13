# Consolidated Implementation Plan
**Student Dashboard Enhancement**
**Date:** 2025-10-12
**Status:** Ready for execution

---

## Overview

Transform the student dashboard from basic (4 widgets) to rich and engaging (9 widgets + enhanced stats), matching the quality of the instructor dashboard while maintaining accessibility and QDS compliance.

**Components:** 5 new + 1 enhancement
**Files to Create:** 5
**Files to Modify:** 4
**Estimated LOC:** ~850 new lines
**Estimated Time:** 3-4 hours

---

## Implementation Order (Small Verified Steps)

### Phase 1: Type Definitions & Foundation (30 min)

#### Step 1.1: Add new type interfaces
**File:** `lib/models/types.ts`
**Action:** Add 3 new interfaces at end of file

```typescript
// Add after existing instructor types (line 1090+)

/**
 * Deadline for upcoming events
 */
export interface Deadline {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  type: "assignment" | "exam" | "office-hours" | "quiz" | "project";
  dueDate: string; // ISO 8601
  link?: string;
}

/**
 * Quick action button for student dashboard
 */
export interface QuickActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badgeCount?: number;
  variant?: "default" | "primary" | "success";
}

/**
 * Recommended thread with relevance scoring
 */
export interface RecommendedThread {
  thread: Thread;
  courseName: string;
  relevanceScore: number;
  reason: "high-engagement" | "trending" | "unanswered" | "similar-interests";
}
```

**Verification:**
- `npx tsc --noEmit` (should pass)
- No console errors

**Commit:** `feat: add type definitions for student dashboard widgets`

---

#### Step 1.2: Add sparkline data to mock stats
**File:** `lib/api/client.ts`
**Action:** Find `getStudentDashboard()` function, extend stats objects

```typescript
// Find stats object around line ~450, add sparkline arrays:

stats: {
  totalCourses: {
    value: enrolledCourses.length,
    delta: 0,
    trend: "neutral" as const,
    trendPercent: 0,
    label: "Enrolled Courses",
    sparkline: [3, 3, 4, 4, 4, 4, 4], // 7-day trend
  },
  totalThreads: {
    value: userThreads.length,
    delta: 2,
    trend: "up" as const,
    trendPercent: 15,
    label: "Questions Asked",
    sparkline: [5, 6, 5, 7, 8, 9, 10],
  },
  totalPosts: {
    value: userPosts.length,
    delta: 3,
    trend: "up" as const,
    trendPercent: 20,
    label: "Responses",
    sparkline: [8, 9, 10, 12, 11, 13, 15],
  },
  endorsedPosts: {
    value: endorsedPosts.length,
    delta: 1,
    trend: "up" as const,
    trendPercent: 10,
    label: "Endorsed Responses",
    sparkline: [1, 2, 2, 3, 3, 4, 5],
  },
},
```

**Verification:**
- `npx tsc --noEmit`
- `npm run dev` (check dashboard loads)

**Commit:** `feat: add sparkline data to student dashboard stats`

---

### Phase 2: Sparkline Component (30 min)

#### Step 2.1: Create MiniSparkline component
**File:** `components/dashboard/mini-sparkline.tsx` (NEW)
**LOC:** ~75 lines

**Full implementation** (copy from component-design.md lines 902-971)

**Key features:**
- Pure SVG, 60×24px
- Memoized with React.memo()
- 5 variant colors (success, warning, danger, accent, default)
- Semantic stroke tokens
- ARIA role="img" with label

**Verification:**
- `npx tsc --noEmit`
- Visual test: Import in dashboard, render with test data

**Commit:** `feat: add mini sparkline component for stat cards`

---

#### Step 2.2: Extend StatCard with sparkline support
**File:** `components/dashboard/stat-card.tsx` (MODIFY)
**Changes:**
1. Add 3 optional props to `StatCardProps` interface
2. Add conditional sparkline rendering after value row
3. Import MiniSparkline

```typescript
// 1. Extend interface (after line 60)
export interface StatCardProps {
  // ... existing props ...

  /**
   * Optional sparkline data (7-day array)
   */
  sparklineData?: number[];

  /**
   * Optional tooltip for sparkline
   */
  sparklineTooltip?: string;

  /**
   * Optional comparison period
   */
  comparisonPeriod?: string;
}

// 2. Import at top
import { MiniSparkline } from "./mini-sparkline";

// 3. Add after value row (after line 166, before CTA button)
{/* Sparkline (optional) */}
{sparklineData && sparklineData.length === 7 && (
  <div className="flex items-center justify-between pt-2 border-t border-border">
    <MiniSparkline
      data={sparklineData}
      variant={
        trend?.direction === "up"
          ? "success"
          : trend?.direction === "down"
          ? "danger"
          : "default"
      }
    />
    {sparklineTooltip && (
      <span className="text-xs text-muted-foreground">{sparklineTooltip}</span>
    )}
  </div>
)}
```

**Verification:**
- `npx tsc --noEmit`
- Test sparkline appears in stat cards
- Test backward compatibility (works without sparklineData)

**Commit:** `feat: extend stat card with optional sparkline visualization`

---

### Phase 3: Simple Widgets (60 min)

#### Step 3.1: Create StudyStreakCard
**File:** `components/dashboard/study-streak-card.tsx` (NEW)
**LOC:** ~185 lines

**Implementation notes:**
- Copy structure from component-design.md lines 40-201
- Uses Flame icon (import from lucide-react)
- Uses Progress component (import from @/components/ui/progress)
- Glass-hover card variant
- Accessible progress bar with aria-label

**Verification:**
- `npx tsc --noEmit`
- Visual test with mock props:
  ```tsx
  <StudyStreakCard
    streakDays={5}
    weeklyActivity={8}
    goalTarget={10}
  />
  ```

**Commit:** `feat: add study streak card with gamification`

---

#### Step 3.2: Create QuickActionsPanel
**File:** `components/dashboard/quick-actions-panel.tsx` (NEW)
**LOC:** ~150 lines

**Implementation notes:**
- Copy structure from component-design.md lines 215-361
- 2×2 grid on mobile, 1×4 row on tablet
- Badge component for notification counts
- Link wrapper or button based on href vs onClick

**Verification:**
- `npx tsc --noEmit`
- Test responsive grid (resize browser)
- Test badge counts display

**Commit:** `feat: add quick actions panel with notification badges`

---

#### Step 3.3: Create UpcomingDeadlines timeline
**File:** `components/dashboard/upcoming-deadlines.tsx` (NEW)
**LOC:** ~195 lines

**Implementation notes:**
- Copy structure from component-design.md lines 411-656
- Timeline dots with urgency colors (danger/warning/primary)
- DeadlineItem as internal component
- Calendar icon for empty state
- Icons: FileText, AlertCircle, Clock, HelpCircle, Briefcase from lucide-react

**Verification:**
- `npx tsc --noEmit`
- Test timeline rendering with mock deadlines
- Test urgency colors (1 day = red, 3 days = yellow, >3 = brown)

**Commit:** `feat: add upcoming deadlines timeline component`

---

### Phase 4: Complex Widgets (60 min)

#### Step 4.1: Create StudentRecommendations
**File:** `components/dashboard/student-recommendations.tsx` (NEW)
**LOC:** ~175 lines

**Implementation notes:**
- Copy structure from component-design.md lines 670-849
- 2-column grid on tablet+
- RecommendationCard as internal component
- Reason badges with semantic colors
- Lightbulb icon for empty state

**Verification:**
- `npx tsc --noEmit`
- Test 2-column responsive grid
- Test reason badges display correctly

**Commit:** `feat: add personalized recommendations widget`

---

### Phase 5: Dashboard Integration (90 min)

#### Step 5.1: Add derived data computations
**File:** `app/dashboard/page.tsx` (MODIFY)
**Action:** Add 4 useMemo() blocks in StudentDashboard component

**Computations to add:**
1. `streakData` - compute streak from recentActivity
2. `quickActions` - array of 4 action buttons with dynamic counts
3. `upcomingDeadlines` - aggregate from courses (mock for now)
4. `recommendations` - filter/sort threads by relevance

**Copy from component-design.md lines 1082-1207**

**Verification:**
- `npx tsc --noEmit`
- Console.log each computation to verify data

**Commit:** `feat: add derived data computations for student dashboard`

---

#### Step 5.2: Add recommendations React Query hook
**File:** `app/dashboard/page.tsx` (MODIFY)
**Action:** Add useQuery for fetching recommendation threads

```typescript
// After other hooks in StudentDashboard

const { data: allThreads } = useQuery({
  queryKey: ["studentRecommendations", user.id],
  queryFn: async () => {
    const courseIds = data.enrolledCourses.map((c) => c.id);
    // Fetch threads for all enrolled courses in parallel
    const threadsPerCourse = await Promise.all(
      courseIds.map((id) => api.getThreads())
    );
    return threadsPerCourse.flat();
  },
  enabled: !!user && data.enrolledCourses.length > 0,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Verification:**
- `npx tsc --noEmit`
- Check Network tab (should see parallel queries)

**Commit:** `feat: add React Query hook for thread recommendations`

---

#### Step 5.3: Update dashboard layout
**File:** `app/dashboard/page.tsx` (MODIFY)
**Action:** Replace current layout with new widget grid

**New structure:**
```tsx
<main className="min-h-screen p-4 md:p-6">
  <div className="container-wide space-y-8">
    {/* Hero (keep existing) */}
    <section aria-labelledby="welcome-heading" className="py-4 md:py-6 space-y-4">
      <h1 id="welcome-heading" className="text-4xl md:text-5xl font-bold glass-text">
        Welcome back, {user.name}!
      </h1>
      <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
        Your academic dashboard - track your courses, recent activity, and stay updated
      </p>
    </section>

    {/* NEW: Engagement Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <StudyStreakCard {...streakData} />
      <QuickActionsPanel actions={quickActions} />
      <UpcomingDeadlines deadlines={upcomingDeadlines} maxItems={3} />
    </div>

    {/* Main Content: Courses (2 cols) + Activity (1 col) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-6">
        <h2 id="courses-heading" className="text-2xl md:text-3xl font-bold glass-text">
          My Courses
        </h2>
        {/* ... existing course cards grid ... */}
      </section>

      <aside aria-labelledby="activity-heading" className="space-y-6">
        <h2 id="activity-heading" className="text-2xl md:text-3xl font-bold glass-text">
          Recent Activity
        </h2>
        <TimelineActivity activities={data.recentActivity} maxItems={5} />
      </aside>
    </div>

    {/* NEW: Recommendations Section */}
    <section aria-labelledby="recommendations-heading" className="space-y-6">
      <h2 id="recommendations-heading" className="text-2xl md:text-3xl font-bold glass-text">
        Recommended for You
      </h2>
      <StudentRecommendations
        recommendations={recommendations}
        maxItems={6}
        loading={!allThreads}
      />
    </section>

    {/* Stats with Sparklines */}
    <section aria-labelledby="stats-heading" className="space-y-6">
      <h2 id="stats-heading" className="text-2xl md:text-3xl font-bold glass-text">
        Your Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={data.stats.totalCourses.label}
          value={data.stats.totalCourses.value}
          icon={BookOpen}
          trend={{
            direction: data.stats.totalCourses.trend,
            label: `${data.stats.totalCourses.trendPercent > 0 ? '+' : ''}${data.stats.totalCourses.trendPercent}%`,
          }}
          sparklineData={data.stats.totalCourses.sparkline}
          sparklineTooltip="7-day trend"
        />
        {/* ... other stat cards ... */}
      </div>
    </section>
  </div>
</main>
```

**Verification:**
- `npx tsc --noEmit`
- Visual test at 360px, 768px, 1024px, 1280px
- All widgets render without errors

**Commit:** `feat: integrate all widgets into student dashboard layout`

---

#### Step 5.4: Add all necessary imports
**File:** `app/dashboard/page.tsx` (MODIFY)
**Action:** Add imports at top of file

```typescript
import { StudyStreakCard } from "@/components/dashboard/study-streak-card";
import { QuickActionsPanel, type QuickActionButton } from "@/components/dashboard/quick-actions-panel";
import { UpcomingDeadlines, type Deadline } from "@/components/dashboard/upcoming-deadlines";
import { StudentRecommendations, type RecommendedThread } from "@/components/dashboard/student-recommendations";
import { MessageSquarePlus, Bookmark, Bell, Search, Flame } from "lucide-react";
```

**Verification:**
- `npx tsc --noEmit`
- No import errors

**Commit:** `chore: add imports for new dashboard widgets`

---

### Phase 6: Quality Gates (30 min)

#### Step 6.1: TypeScript validation
**Command:** `npx tsc --noEmit`
**Expected:** No errors
**Fix:** Resolve any type issues before proceeding

---

#### Step 6.2: Lint validation
**Command:** `npm run lint`
**Expected:** No errors or warnings
**Fix:** Run `npm run lint -- --fix` for auto-fixes

---

#### Step 6.3: Production build test
**Command:** `npm run build`
**Expected:** Build succeeds, no hydration errors
**Check:** All routes render in production mode

---

#### Step 6.4: Responsive testing
**Breakpoints:**
- 360px (mobile)
- 768px (tablet)
- 1024px (desktop)
- 1280px (wide)

**Check:**
- Engagement row: 1 col → 3 cols
- Quick actions: 2×2 grid → 1×4 row
- Recommendations: 1 col → 2 cols
- Stats: 2 cols → 4 cols
- All text readable, no overflow

---

#### Step 6.5: Keyboard navigation test
**Flow:**
1. Tab from top of page
2. Skip link appears and works
3. All widgets reachable via Tab
4. Enter activates links/buttons
5. Focus rings visible on all interactive elements

---

#### Step 6.6: Screen reader test (Optional but recommended)
**Tools:** NVDA (Windows) or VoiceOver (macOS)

**Check:**
- Heading hierarchy (H1 → H2 → H3)
- Landmarks navigation (D key)
- Progress bar announces value
- Sparklines have text alternative
- Time elements announce full date

---

### Final Step: Update context.md

Add to Changelog section:

```markdown
- `2025-10-12` | [Components] | Created 5 new student dashboard widgets
- `2025-10-12` | [StatCard] | Extended with sparkline support
- `2025-10-12` | [Dashboard] | Integrated all widgets with responsive layout
- `2025-10-12` | [Mock Data] | Added sparkline arrays to student stats
- `2025-10-12` | [Types] | Added Deadline, QuickActionButton, RecommendedThread interfaces
```

---

## Success Criteria Checklist

- [ ] All 5 new components render without errors
- [ ] Sparklines display in stat cards
- [ ] Study streak computes correctly from activity
- [ ] Quick actions show dynamic badge counts
- [ ] Deadlines sort by date with correct urgency colors
- [ ] Recommendations filter by relevance
- [ ] Responsive at 360/768/1024/1280px
- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Keyboard navigation works (Tab through all widgets)
- [ ] Focus rings visible on glass backgrounds
- [ ] WCAG AA contrast ratios verified
- [ ] No console errors or warnings
- [ ] Dashboard feels engaging and personalized

---

## Rollback Plan

If critical issues arise:

1. **Incremental rollback:** Each step is committed separately - revert specific commits
2. **Full rollback:** Revert all commits from this task: `git revert <first-commit>^..<last-commit>`
3. **Feature flag:** Wrap new widgets in conditional render based on env var

---

## Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Type definitions & foundation | 30 min |
| 2 | Sparkline component | 30 min |
| 3 | Simple widgets (3) | 60 min |
| 4 | Complex widgets (1) | 60 min |
| 5 | Dashboard integration | 90 min |
| 6 | Quality gates | 30 min |
| **Total** | **Full implementation** | **5 hours** |

---

## Next Action

Begin Phase 1, Step 1.1: Add type definitions to `lib/models/types.ts`

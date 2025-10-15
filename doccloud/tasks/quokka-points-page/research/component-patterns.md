# Component Patterns Research - Quokka Points Page

**Date:** 2025-10-14
**Task:** Design architecture for Quokka Points page (`/points`)
**Focus:** Analyze existing patterns, identify reusable components, document data flows

---

## 1. Existing Quokka Points Components

### 1.1 QuokkaPointsBadge (`components/navbar/quokka-points-badge.tsx`)

**Purpose:** Navbar popover showing points summary with quick access
**Location:** Global navigation bar (visible on all pages)

**Props Interface:**
```typescript
export interface QuokkaPointsBadgeProps {
  totalPoints: number;
  weeklyPoints: number;
  pointSources: QuokkaPointsData["pointSources"];
  milestones: QuokkaPointsData["milestones"];
  onViewDetails?: () => void;
  className?: string;
}
```

**Key Patterns:**
- **Derived State:** Calculates `nextMilestone` and `progressPercent` via `useMemo`
- **Popover Composition:** Uses shadcn/ui Popover + PopoverTrigger + PopoverContent
- **Glass Panel Styling:** `glass-panel` class for QDS glassmorphism
- **Progress Visualization:** shadcn Progress component with calculated percentage
- **Top Sources Display:** Shows top 3 point sources with icons
- **Navigation Callback:** `onViewDetails` handler for linking to full page

**Visual Hierarchy:**
1. Button trigger with QuokkaIcon + total points
2. Popover content:
   - Header: QuokkaIcon + "Quokka Points" title
   - Weekly points (+{weeklyPoints} this week)
   - Large total points display (text-4xl)
   - Progress bar to next milestone
   - Top 3 sources breakdown
   - "View Full Details" button

**Accessibility:**
- `aria-label` on trigger button
- `aria-label` on total points display
- Icon `aria-hidden="true"`

**Size:** ~190 lines, well within 200-line guideline

---

### 1.2 QuokkaPointsCard (`components/dashboard/quokka-points-card.tsx`)

**Purpose:** Dashboard widget with detailed points overview
**Location:** Student dashboard

**Props Interface:**
```typescript
export interface QuokkaPointsCardProps {
  totalPoints: number;
  weeklyPoints: number;
  pointSources: QuokkaPointsData["pointSources"];
  milestones: QuokkaPointsData["milestones"];
  sparklineData?: number[];
  loading?: boolean;
  className?: string;
  onViewDetails?: () => void;
}
```

**Key Patterns:**
- **Loading State:** Full skeleton UI with `Skeleton` component
- **Empty State:** Zero points onboarding with CTA ("Ask Your First Question")
- **Background Decoration:** Watermark QuokkaIcon (opacity-10, absolute positioning)
- **Sparkline Visualization:** Custom `MiniSparkline` inline component (SVG polyline)
- **Card Variants:** Uses `variant="glass-hover"` for interactive feel
- **Three-State Design:** Loading | Empty | Content

**MiniSparkline Component:**
- Inline function component (not exported)
- Renders 7-day trend as SVG polyline
- Normalizes data to 0-100 scale
- ARIA label for accessibility
- Size: h-6 w-16 (compact)

**Visual Hierarchy:**
1. Header row: QuokkaIcon + "Quokka Points" label + "View Details" button
2. Large point display (text-5xl)
3. Weekly change (+{weeklyPoints} this week)
4. Progress bar to next milestone
5. Top 3 sources with icons
6. Optional sparkline footer (7-day trend)

**Size:** ~275 lines (includes inline MiniSparkline), acceptable for dashboard widget

---

### 1.3 QuokkaIcon (`components/ui/quokka-icon.tsx`)

**Purpose:** Custom SVG icon for Quokka brand
**Design:** Circle body + two round ears

**Props Interface:**
```typescript
export interface QuokkaIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "filled" | "outline" | "glass";
  points?: number;
  animate?: "pulse" | "glow" | "none";
  className?: string;
  ariaLabel?: string;
}
```

**Size Mapping:**
- sm: 20px (badges, inline text)
- md: 32px (default, buttons)
- lg: 64px (cards, headers)
- xl: 96px (hero sections, empty states)

**Variant Styles:**
- filled: Solid `fill-primary text-white`
- outline: `fill-none stroke-primary stroke-2`
- glass: Glassmorphism with `fill-glass-panel-strong/80 backdrop-blur-sm`

**Animation Support:**
- pulse: `animate-pulse`
- glow: `animate-[glow_2s_ease-in-out_infinite]`

**Points Display:**
- Optional numeric overlay inside circle
- Font size scales with icon size
- Uses `tabular-nums` for consistent spacing

**Usage in Points Components:**
- Badge: size="sm" (trigger), size="md" (popover)
- Card: size="md" (header icon), size="lg" (background watermark), size="xl" (empty state)
- Expected for Hero: size="xl" with animate="pulse"

---

## 2. Quokka Points Data Types

### 2.1 Core Types (`lib/models/types.ts`)

```typescript
export interface PointSource {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  points: number;
  count: number;
  pointsPerAction: number;
}

export interface PointMilestone {
  threshold: number;
  label: string;
  achieved: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface QuokkaPointsData {
  totalPoints: number;
  weeklyPoints: number;
  pointSources: PointSource[];
  milestones: PointMilestone[];
  sparklineData?: number[];
}
```

**Data Flow:**
- `StudentDashboardData.quokkaPoints: QuokkaPointsData`
- Calculation: `lib/utils/quokka-points.ts` → `calculateQuokkaPoints()`
- Hook: `useStudentDashboard(userId)` returns full dashboard with embedded points

---

### 2.2 Point Calculation Logic (`lib/utils/quokka-points.ts`)

**Function Signature:**
```typescript
export function calculateQuokkaPoints(
  userId: string,
  userThreads: Thread[],
  userPosts: Post[]
): QuokkaPointsData
```

**Point Values:**
```typescript
export const POINT_VALUES = {
  HELPFUL_ANSWER: 10,
  PEER_ENDORSEMENT: 5,
  INSTRUCTOR_ENDORSEMENT: 20,
  SHARE_CONVERSATION: 15,
  QUESTION_ASKED: 2,
} as const;
```

**Milestones:**
```typescript
export const MILESTONES = [
  { threshold: 100, label: "Getting Started" },
  { threshold: 250, label: "Active Learner" },
  { threshold: 500, label: "Active Contributor" },
  { threshold: 1000, label: "Helpful Contributor" },
  { threshold: 2500, label: "Community Expert" },
] as const;
```

**Point Sources (5 categories):**
1. Peer Endorsements (ThumbsUp icon)
2. Helpful Answers (MessageSquare icon)
3. Instructor Endorsed (Star icon)
4. Shared Conversations (Share2 icon)
5. Questions Asked (HelpCircle icon)

**Sparkline Generation:**
- Uses `generateSparkline()` from `lib/utils/dashboard-calculations.ts`
- 7-day history
- Deterministic seeded data (mock implementation)

---

## 3. Existing Dashboard Patterns

### 3.1 Page Structure (Student Dashboard)

**File:** `app/dashboard/page.tsx`

**Layout Pattern:**
```tsx
<div className="container-wide space-y-6 p-4 md:p-6">
  {/* Hero Section */}
  <section aria-labelledby="welcome-heading" className="space-y-3">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">
      Welcome back, {user.name}!
    </h1>
    <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
      Your Q&A companion...
    </p>
  </section>

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* 2-column content */}
    {/* 1-column sidebar */}
  </div>

  {/* Full-width sections */}
  <section aria-labelledby="...">...</section>
</div>
```

**Key Patterns:**
- `container-wide` utility (max-w-6xl mx-auto)
- `space-y-6` for section spacing
- Responsive padding: `p-4 md:p-6`
- Semantic HTML with `<section>` and `aria-labelledby`
- Responsive typography: `text-3xl sm:text-4xl md:text-5xl`
- `glass-text` utility for text shadow (readability)

**Accessibility:**
- Unique heading IDs for `aria-labelledby`
- Skip link support (not shown, but available)
- Landmark roles via semantic HTML

---

### 3.2 Component Composition Patterns

**StatCard Component:**
```tsx
<StatCard
  label={string}
  value={number}
  icon={LucideIcon}
  trend={{ direction, label }}
  sparklineData={number[]}
  sparklineTooltip={string}
  variant="default" | "success" | "warning" | "accent"
/>
```

**Usage:** Student dashboard displays 4 stats in grid (1-2-4 columns)

**Card Variants:**
- `variant="glass"`: Standard glass panel
- `variant="glass-hover"`: Interactive hover state
- `variant="default"`: Non-glass solid background

---

### 3.3 Empty/Loading States

**Loading Pattern (Dashboard):**
```tsx
<div className="min-h-screen p-8 md:p-12">
  <div className="container-wide space-y-12">
    <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-56 bg-glass-medium rounded-xl" />
      ))}
    </div>
  </div>
</div>
```

**Empty Pattern (QuokkaPointsCard):**
```tsx
<Card variant="glass" className="p-6 text-center space-y-3">
  <QuokkaIcon size="lg" variant="outline" />
  <h3 className="text-lg font-semibold">Start Earning Quokka Points!</h3>
  <p className="text-sm text-muted-foreground glass-text">
    Ask questions, help peers...
  </p>
  <Button variant="default" asChild>
    <Link href="/ask">Ask Your First Question</Link>
  </Button>
</Card>
```

---

## 4. React Query Data Fetching

### 4.1 Existing Hooks (`lib/api/hooks.ts`)

**Current User:**
```typescript
export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Student Dashboard (includes QuokkaPoints):**
```typescript
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? ["studentDashboard", userId] : ["studentDashboard"],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : null),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
```

**Data Structure:**
```typescript
StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  stats: { totalCourses, totalThreads, totalPosts, endorsedPosts };
  goals: GoalProgress[];
  quokkaPoints: QuokkaPointsData; // <-- Points data here
  assignmentQA: AssignmentQAMetrics[];
}
```

---

### 4.2 Proposed New Hook (No Backend Changes)

**Option 1: Reuse existing hook**
```typescript
// Use existing useStudentDashboard and extract quokkaPoints
const { data: dashboard } = useStudentDashboard(userId);
const pointsData = dashboard?.quokkaPoints;
```

**Option 2: Create derived hook (recommended for clarity)**
```typescript
// New hook wraps useStudentDashboard
export function useQuokkaPoints(userId: string | undefined) {
  const { data, isLoading, error } = useStudentDashboard(userId);

  return {
    data: data?.quokkaPoints,
    isLoading,
    error,
  };
}
```

**Rationale for Option 2:**
- Clearer intent in component code
- Consistent with single-responsibility principle
- No additional API calls (just data transformation)
- Easy to extend with computed fields later

---

## 5. QDS Design System Tokens

### 5.1 Relevant Tokens (`app/globals.css`)

**Colors:**
- Primary: `--primary` (#8A6B3D), `--primary-hover`, `--primary-pressed`
- Success: `--success` (#2E7D32)
- Warning: `--warning` (#B45309)
- Muted: `--muted-foreground`

**Spacing Grid (4pt):**
- `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- `gap-6` (24px), `gap-8` (32px), `gap-12` (48px)

**Border Radius:**
- `rounded-md` (10px), `rounded-lg` (16px), `rounded-xl` (20px), `rounded-2xl` (24px)

**Shadows:**
- `shadow-e1`, `shadow-e2`, `shadow-e3`
- `shadow-glass-sm`, `shadow-glass-md`, `shadow-glass-lg`

**Glass Tokens:**
- `glass-panel`: `backdrop-blur(12px) bg-glass-medium border-glass`
- `glass-panel-strong`: Stronger blur + darker background
- `glass-text`: Text shadow for readability

**Typography Utilities:**
- `heading-1`, `heading-2`, `heading-3`, `heading-4`, `heading-5`
- `hero-title`, `hero-subtitle`
- `glass-text`

---

### 5.2 Icon Usage (Lucide React)

**From Point Sources:**
- ThumbsUp (Peer Endorsements)
- MessageSquare (Helpful Answers)
- Star (Instructor Endorsed)
- Share2 (Shared Conversations)
- HelpCircle (Questions Asked)

**Additional Icons for Milestones:**
- Award (achievements)
- Trophy (top milestone)
- Target (progress toward goal)
- Zap (weekly activity)
- TrendingUp (growth)

---

## 6. Similar Component Analysis

### 6.1 Timeline Components

**TimelineActivity (`components/dashboard/timeline-activity.tsx`):**
- Displays activity feed with vertical timeline
- Uses `maxItems` prop for truncation
- Empty state handling
- Icon + timestamp + description pattern

**Pattern for Activity Feed:**
```tsx
<Card variant="glass">
  <ul className="space-y-4">
    {activities.map((activity) => (
      <li key={activity.id} className="flex gap-3">
        <Icon className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{activity.summary}</p>
          <time className="text-xs text-muted-foreground">
            {formatTime(activity.timestamp)}
          </time>
        </div>
      </li>
    ))}
  </ul>
</Card>
```

---

### 6.2 Progress Components

**Study Streak Card:**
- Similar progress visualization needs
- Uses circular progress indicator
- Milestone celebration pattern
- Encouraging copy for achievements

**Assignment Q&A Opportunities:**
- List of opportunities sorted by due date
- Badge indicators for metrics
- CTA buttons for actions
- Responsive grid layout

---

## 7. Reusable Patterns Identified

### 7.1 Shared Layout Patterns

1. **Hero + Content Grid:**
   - Hero section with h1 + subtitle
   - 2-3 column responsive grid
   - Full-width sections below

2. **Card-Based Sections:**
   - Glass panel cards for visual hierarchy
   - Hover variants for interactive elements
   - Consistent border radius (rounded-xl)

3. **Icon + Metric Display:**
   - Icon + label + value pattern
   - Trend indicators (up/down/neutral)
   - Optional sparkline visualization

4. **Empty/Loading/Error States:**
   - Skeleton loaders with `bg-glass-medium`
   - Empty states with QuokkaIcon + CTA
   - Consistent messaging style

---

### 7.2 Accessibility Patterns

1. **Semantic HTML:**
   - `<section>` with `aria-labelledby`
   - `<time>` for timestamps
   - `<progress>` for loading states

2. **Focus Management:**
   - `focus-visible:ring-4` utility
   - Visible focus rings on all interactive elements
   - Skip link support (navbar)

3. **Screen Reader Support:**
   - `aria-label` on decorative icons (`aria-hidden="true"`)
   - `sr-only` class for screen reader-only text
   - Descriptive button labels

---

### 7.3 Responsive Patterns

1. **Typography Scaling:**
   - `text-3xl sm:text-4xl md:text-5xl` pattern
   - `text-base sm:text-lg md:text-xl` for subtitles

2. **Grid Breakpoints:**
   - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - `lg:col-span-2` for main content

3. **Padding/Spacing:**
   - `p-4 md:p-6` for page padding
   - `gap-4 md:gap-6 lg:gap-8` for grid gaps

---

## 8. Component Composition Opportunities

### 8.1 Can Reuse Directly

1. **QuokkaIcon** - All sizes/variants/animations
2. **Progress** (shadcn/ui) - Milestone progress bars
3. **Card** (shadcn/ui) - Section containers
4. **Skeleton** (shadcn/ui) - Loading states
5. **Badge** (shadcn/ui) - Milestone indicators
6. **Button** (shadcn/ui) - CTAs and actions

---

### 8.2 Can Adapt/Extend

1. **MiniSparkline:**
   - Extract from QuokkaPointsCard
   - Make standalone component for reuse
   - Add customizable colors, height, width

2. **StatCard:**
   - Already props-driven
   - Could add "onClick" for drill-down navigation
   - Currently used in dashboard, could reuse in points page

3. **TimelineActivity:**
   - Adapt pattern for point-earning activity feed
   - Same vertical timeline + icon pattern
   - Different data structure (PointActivity vs ActivityItem)

---

### 8.3 Must Create New

1. **QuokkaPointsHero:**
   - Large animated QuokkaIcon
   - Total points display
   - Weekly change indicator
   - Next milestone progress

2. **MilestonesTimeline:**
   - Horizontal/vertical timeline of 5 milestones
   - Visual checkmarks for achieved
   - Progress line connecting milestones
   - Current position indicator

3. **PointSourcesBreakdown:**
   - Detailed table/cards for all 5 sources
   - Expandable rows for action history
   - Sortable by points/count/recent
   - Icon + label + metrics

4. **PointsActivityFeed (optional):**
   - Timeline of recent point-earning actions
   - "You earned +10 points for Helpful Answer"
   - Timestamp + action + points earned
   - Link to related thread

---

## 9. Navigation Integration

### 9.1 Navbar Badge Integration

**Current Implementation:**
```tsx
<QuokkaPointsBadge
  totalPoints={pointsData.totalPoints}
  weeklyPoints={pointsData.weeklyPoints}
  pointSources={pointsData.pointSources}
  milestones={pointsData.milestones}
  onViewDetails={() => {
    // TODO: Navigate to /points
  }}
/>
```

**Required Change:**
```tsx
import { useRouter } from "next/navigation";

const router = useRouter();

<QuokkaPointsBadge
  {...props}
  onViewDetails={() => router.push("/points")}
/>
```

**File to Modify:** `components/layout/global-nav-bar.tsx`

---

### 9.2 Dashboard Card Integration

**Current Implementation:**
```tsx
<QuokkaPointsCard
  {...props}
  onViewDetails={() => {
    // TODO: Navigate to /points
  }}
/>
```

**Required Change:**
```tsx
import Link from "next/link";

<QuokkaPointsCard
  {...props}
  onViewDetails={() => router.push("/points")}
/>
```

OR (better, use Link for prefetching):

```tsx
<Link href="/points">
  <QuokkaPointsCard {...props} />
</Link>
```

**File to Modify:** `app/dashboard/page.tsx` (StudentDashboard component)

---

## 10. Key Findings Summary

### 10.1 Strengths to Leverage

1. **Existing Data Structure:** QuokkaPointsData already comprehensive
2. **Calculation Logic:** Pure function, well-tested, deterministic
3. **Icon System:** QuokkaIcon with all needed variants
4. **Glass Design System:** Fully implemented, documented
5. **Accessibility Patterns:** Strong foundation to build on
6. **Props-Driven Components:** All existing components follow best practices

---

### 10.2 Gaps to Address

1. **No dedicated points page route:** Must create `/points` page
2. **Activity history not tracked:** Need PointActivity type (or mock it)
3. **Milestone icons not defined:** Can use Award, Trophy, Target, Star, Crown
4. **Detailed breakdown view:** Need table/grid component for 5 sources
5. **Navigation wiring:** Update navbar + dashboard card handlers

---

### 10.3 Risks & Mitigations

**Risk 1: Performance with animations**
- Mitigation: Use `motion-reduce:` utilities, CSS containment

**Risk 2: Mobile layout complexity**
- Mitigation: Follow dashboard responsive patterns, test at 360px

**Risk 3: Empty state discouragement**
- Mitigation: Positive messaging, clear CTAs, show path to first points

**Risk 4: Sparkline data accuracy**
- Mitigation: Use mock data with deterministic seeding (already implemented)

---

## 11. Recommended Component Architecture

Based on analysis, recommend **4 primary components + 1 page:**

1. **app/points/page.tsx** - Main route with auth guard + data fetching
2. **components/points/quokka-points-hero.tsx** - Hero with icon + total
3. **components/points/milestones-timeline.tsx** - 5 milestones with progress
4. **components/points/point-sources-breakdown.tsx** - Detailed source table
5. **components/points/points-activity-feed.tsx** - Recent activity (optional)

**Total estimated LOC:** ~800 lines (well within scope)

---

## 12. Next Steps

1. ✅ Complete research (this document)
2. ⏳ Design component architecture in `plans/component-design.md`
3. ⏳ Update `context.md` with decisions
4. ⏳ Return file paths + 10-bullet summary

# Component Architecture Design: Q&A Companion Dashboard

**Date:** 2025-10-13
**Task:** Dashboard Q&A Companion Refocus
**Agent:** Component Architect

---

## Executive Summary

This document specifies the complete component architecture for transforming the student dashboard from an LMS-like interface to a Q&A companion service. Three primary components will be created/redesigned:

1. **QuokkaPointsCard** - Replaces StudyStreakCard with Q&A contribution gamification
2. **QuickActionsPanel** - Redesigned to emphasize AI help and peer collaboration
3. **AssignmentQAOpportunities** - Replaces UpcomingDeadlines with assignment-linked Q&A metrics

All components follow QDS 2.0 glassmorphism design, maintain WCAG 2.2 AA accessibility, and use props-driven architecture with zero hardcoded values.

---

## Component 1: QuokkaPointsCard

### File Location
```
components/dashboard/quokka-points-card.tsx
```

### Purpose
Display student's Quokka Points balance with breakdown by contribution type. Emphasizes Q&A engagement as valuable learning activity (not competitive gaming).

### TypeScript Interface

```typescript
import type { LucideIcon } from "lucide-react";

/**
 * Point sources with individual point values
 * Used to show breakdown of how points were earned
 */
export interface PointSource {
  /** Unique identifier for this point source */
  id: string;

  /** Source label (e.g., "Peer Endorsements", "Helpful Answers") */
  label: string;

  /** Icon component from lucide-react */
  icon: LucideIcon;

  /** Points earned from this source */
  points: number;

  /** Number of times this action occurred */
  count: number;

  /** Point value per action (e.g., 5 points per endorsement) */
  pointsPerAction: number;
}

/**
 * Progress towards next milestone
 */
export interface PointMilestone {
  /** Milestone point threshold */
  threshold: number;

  /** Milestone label (e.g., "Helpful Contributor") */
  label: string;

  /** Whether milestone is achieved */
  achieved: boolean;

  /** Optional badge icon */
  icon?: LucideIcon;
}

/**
 * Props for QuokkaPointsCard component
 */
export interface QuokkaPointsCardProps {
  /**
   * Total Quokka Points balance
   */
  totalPoints: number;

  /**
   * Points earned this week
   */
  weeklyPoints: number;

  /**
   * Array of point sources (breakdown)
   * Sorted by points (highest first)
   */
  pointSources: PointSource[];

  /**
   * Milestones for progress tracking
   * Sorted by threshold (ascending)
   */
  milestones: PointMilestone[];

  /**
   * Optional 7-day sparkline data (points earned per day)
   */
  sparklineData?: number[];

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;

  /**
   * Optional click handler to view detailed points history
   */
  onViewDetails?: () => void;
}
```

### Visual Design Specification

**Layout:**
```
┌─────────────────────────────────────────┐
│ 🦘 Quokka Points          [View Details]│
│                                          │
│   1,245 points                           │
│   +32 this week                          │
│                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Progress to Helpful Contributor (1,500)  │
│                                          │
│ Top Sources:                             │
│ • 👍 Peer Endorsements: 15 × 5 = 75 pts │
│ • 💬 Helpful Answers: 8 × 10 = 80 pts   │
│ • ⭐ Instructor Endorsed: 2 × 20 = 40 pts│
└─────────────────────────────────────────┘
```

**Styling:**
- Card variant: `glass-hover`
- Background decoration: Quokka icon (subtle, large, opacity-10)
- Primary color: `--primary` (#8A6B3D)
- Point value: `text-5xl font-bold tabular-nums`
- Progress bar: `Progress` component with primary fill
- Sparkline: `MiniSparkline` with success variant (green = positive growth)

**Micro-interactions:**
- Hover: Card lifts slightly, blur intensifies
- Point value: Count-up animation on mount (optional, respects reduced-motion)
- Progress bar: Smooth width animation
- View Details button: Ghost variant, accent color

### Component Hierarchy

```tsx
<QuokkaPointsCard>
  <Card variant="glass-hover">
    {/* Background Decoration */}
    <div className="absolute opacity-10" aria-hidden="true">
      <QuokkaIcon /> {/* Large, decorative */}
    </div>

    <CardContent className="relative z-10">
      {/* Header */}
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <QuokkaIcon className="text-primary" />
          <h3 className="font-medium">Quokka Points</h3>
        </div>
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        )}
      </div>

      {/* Point Display */}
      <div>
        <div className="text-5xl font-bold tabular-nums">{totalPoints}</div>
        <div className="text-sm text-muted-foreground">
          +{weeklyPoints} this week
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <div>
          <Progress value={progressPercent} />
          <p className="text-sm">
            Progress to {nextMilestone.label} ({nextMilestone.threshold})
          </p>
        </div>
      )}

      {/* Point Sources Breakdown */}
      <div>
        <h4 className="text-sm font-medium">Top Sources:</h4>
        <ul>
          {pointSources.slice(0, 3).map((source) => (
            <li key={source.id} className="flex items-center gap-2">
              <Icon className="text-muted-foreground" />
              <span>{source.label}: {source.count} × {source.pointsPerAction} = {source.points} pts</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Optional Sparkline */}
      {sparklineData && (
        <div className="flex items-center justify-between">
          <MiniSparkline data={sparklineData} variant="success" />
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
      )}
    </CardContent>
  </Card>
</QuokkaPointsCard>
```

### State Management

**Local State:**
- None (fully controlled by props)

**Derived State:**
- `nextMilestone` - First unachieved milestone from `milestones` array
- `progressPercent` - Calculation: `(totalPoints - prevMilestone) / (nextMilestone - prevMilestone) * 100`

**No side effects** - Pure presentation component

### Accessibility

**ARIA Attributes:**
```tsx
<div role="region" aria-labelledby="quokka-points-heading">
  <h3 id="quokka-points-heading" className="sr-only">Quokka Points Balance</h3>

  <div aria-label={`${totalPoints} total Quokka Points`}>
    <span aria-hidden="true">{totalPoints}</span>
  </div>

  <Progress
    value={progressPercent}
    aria-label={`Progress to ${nextMilestone.label}: ${progressPercent}%`}
  />

  <ul aria-label="Point sources breakdown">
    <li>{/* Point source items */}</li>
  </ul>
</div>
```

**Keyboard Navigation:**
- "View Details" button keyboard accessible
- Tab order: button → (external links if any)
- Focus indicator visible on glass background

**Screen Reader:**
- Total points announced clearly
- Progress percentage announced
- Point source list navigable

### Responsive Behavior

**Mobile (360px-640px):**
- Single column layout
- Point value slightly smaller (text-4xl)
- Show top 2 point sources (not 3)
- Hide sparkline if space constrained

**Tablet (640px-1024px):**
- Standard layout
- Point value text-5xl
- Show top 3 sources

**Desktop (1024px+):**
- Full layout with all details
- Sparkline always visible

### Loading State

```tsx
if (loading) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-12 w-32 bg-glass-medium" />
        <Skeleton className="h-16 w-40 bg-glass-medium" />
        <Skeleton className="h-3 w-full bg-glass-medium" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-glass-medium" />
          <Skeleton className="h-6 w-44 bg-glass-medium" />
          <Skeleton className="h-6 w-52 bg-glass-medium" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Empty/Zero State

```tsx
if (totalPoints === 0) {
  return (
    <Card variant="glass">
      <CardContent className="p-6 text-center space-y-3">
        <div className="text-4xl" aria-hidden="true">🦘</div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Start Earning Quokka Points!</h3>
          <p className="text-sm text-muted-foreground glass-text">
            Ask questions, help peers, and get endorsed to earn points
          </p>
        </div>
        <Button variant="default" asChild>
          <Link href="/ask">Ask Your First Question</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Performance Optimizations

**Memoization:**
```tsx
// Expensive calculations
const nextMilestone = useMemo(() =>
  milestones.find(m => !m.achieved),
  [milestones]
);

const progressPercent = useMemo(() => {
  // Calculate progress percentage
  const prevMilestone = milestones.filter(m => m.achieved).pop();
  const prevThreshold = prevMilestone?.threshold || 0;
  const nextThreshold = nextMilestone?.threshold || 0;
  return ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
}, [totalPoints, milestones, nextMilestone]);
```

**No Re-renders:**
- Component is pure (no internal state)
- Parent controls all data
- React.memo wrap if parent re-renders frequently

### Testing Scenarios

1. **Zero points** - Empty state displays correctly
2. **Points < first milestone** - Progress bar shows correctly
3. **Points between milestones** - Progress calculates accurately
4. **All milestones achieved** - Progress bar at 100% or hidden
5. **Single point source** - Layout adapts (no empty list items)
6. **Long point source labels** - Text truncates gracefully
7. **Sparkline data missing** - Section hidden, no errors
8. **Loading state** - Skeleton matches final layout dimensions
9. **Dark mode** - Glass tokens and text shadows correct
10. **Mobile responsive** - Layout stacks, no overflow

---

## Component 2: QuickActionsPanel (Redesign)

### File Location
```
components/dashboard/quick-actions-panel.tsx (UPDATE EXISTING)
```

### Purpose
Provide fast access to Q&A-focused actions. Emphasize AI help, peer collaboration, and sharing conversations. Maintain existing component structure but update action configuration.

### Updated TypeScript Interface

**No interface changes needed** - `QuickActionButton` interface supports all requirements:

```typescript
// From lib/models/types.ts (existing)
export interface QuickActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badgeCount?: number;
  variant?: "default" | "primary" | "success";
}

// Props interface remains the same
export interface QuickActionsPanelProps {
  actions: QuickActionButton[];
  loading?: boolean;
  className?: string;
}
```

### New Action Configuration

**Priority Hierarchy:**

1. **Ask AI** (Primary) - Most important action
2. **Browse Q&A** (Default) - Discover existing threads
3. **Help Answer** (Success) - Peer collaboration
4. **Share Conversation** (Default) - From FloatingQuokka

**Action Definitions:**

```typescript
const quickActions: QuickActionButton[] = [
  {
    id: "ask-ai",
    label: "Ask AI",
    icon: Sparkles, // AI icon
    href: "/ask",
    variant: "primary", // Visual emphasis
  },
  {
    id: "browse-qa",
    label: "Browse Q&A",
    icon: MessageSquare,
    href: "/",
    badgeCount: newThreadsCount, // Dynamic from data
    variant: "default",
  },
  {
    id: "help-answer",
    label: "Help Answer",
    icon: HandHelping,
    href: "/unanswered",
    badgeCount: unansweredThreadsCount,
    variant: "success", // Green = helping
  },
  {
    id: "share-conversation",
    label: "Share Chat",
    icon: Share2,
    onClick: openShareDialog, // Opens FloatingQuokka share modal
    variant: "default",
  },
];
```

### Visual Changes

**Layout:** No change (2x2 mobile, 4 columns desktop)

**Icon + Label Emphasis:**
```tsx
// Primary action (Ask AI) - larger icon, bolder text
{action.variant === "primary" && (
  <div className="flex flex-col items-center gap-3 p-5"> {/* More padding */}
    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/20">
      <Icon className="h-7 w-7 text-primary" /> {/* Larger icon */}
    </div>
    <span className="text-sm font-semibold text-center">{action.label}</span>
  </div>
)}

// Default actions - standard size
{action.variant !== "primary" && (
  <div className="flex flex-col items-center gap-3 p-4">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
      <Icon className="h-6 w-6 text-foreground" />
    </div>
    <span className="text-sm font-medium text-center">{action.label}</span>
  </div>
)}
```

**Variant Classes:**
```typescript
const variantClasses = {
  default: "hover:bg-muted hover:border-primary/30",
  primary: "hover:bg-primary/10 hover:border-primary hover:shadow-[var(--focus-shadow-primary)]", // Added glow
  success: "hover:bg-success/10 hover:border-success",
};
```

### Component Changes

**Minimal structural changes:**
1. Update `variantClasses` to add glow effects on primary hover
2. Conditionally adjust icon/padding size for primary variant
3. Add tooltip for badge counts (accessibility improvement)

**Example:**
```tsx
// Add tooltip for badge counts
{action.badgeCount && action.badgeCount > 0 && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {action.badgeCount}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{action.badgeCount} {action.label.toLowerCase()}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

### Accessibility (No Changes Needed)

Existing accessibility is strong:
- Button semantic HTML (button/Link)
- aria-label on badges
- role="group" on container
- Keyboard navigation works

**Enhancement:** Add tooltips for clarity

### Testing Scenarios

1. **Primary action renders with emphasis** - Larger icon, glow on hover
2. **Badge counts display correctly** - Position, color, tooltip
3. **Mix of href and onClick actions** - Both work
4. **onClick triggers parent callback** - Share dialog opens
5. **Responsive grid** - 2x2 mobile, 4 columns desktop
6. **Loading state** - Skeleton matches layout
7. **No badge counts** - Layout doesn't break
8. **Dark mode** - Hover effects and glows visible

---

## Component 3: AssignmentQAOpportunities

### File Location
```
components/dashboard/assignment-qa-opportunities.tsx
```

### Purpose
Display upcoming assignments with Q&A engagement metrics. Frame assignments as opportunities for collaborative learning rather than solo deadlines.

### TypeScript Interface

```typescript
import type { LucideIcon } from "lucide-react";

/**
 * Q&A metrics for a specific assignment
 */
export interface AssignmentQAMetrics {
  /** Assignment unique ID */
  assignmentId: string;

  /** Assignment title */
  title: string;

  /** Course ID */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Assignment due date (ISO 8601) */
  dueDate: string;

  /** Q&A Engagement Metrics */
  totalQuestions: number;
  unansweredQuestions: number;
  yourQuestions: number;
  yourAnswers: number;
  aiAnswersAvailable: number;
  activeStudents: number;

  /** Recent activity summary (human-readable) */
  recentActivity?: string; // e.g., "5 questions in last hour"

  /** Suggested action based on metrics */
  suggestedAction: "ask" | "answer" | "review";

  /** Reason for suggested action */
  actionReason: string; // e.g., "3 unanswered questions need help"

  /** Optional link to assignment Q&A page */
  link?: string;
}

/**
 * Props for AssignmentQAOpportunities component
 */
export interface AssignmentQAOpportunitiesProps {
  /**
   * Array of assignments with Q&A metrics (sorted by due date, nearest first)
   */
  assignments: AssignmentQAMetrics[];

  /**
   * Maximum items to display (default: 5)
   */
  maxItems?: number;

  /**
   * Optional course filter
   */
  courseId?: string;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional empty message
   */
  emptyMessage?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Visual Design Specification

**Layout: Hybrid Timeline with Expandable Cards**

```
┌─────────────────────────────────────────────────────┐
│ Assignment 3: Binary Search Trees                   │
│ CS 101 • Due in 2 days                              │
│                                                      │
│ Q&A Activity:                                        │
│ • 12 questions • 3 unanswered • 8 AI answers        │
│ • 15 students discussing • 2 of your questions      │
│                                                      │
│ ⚠️ 3 unanswered questions need help                 │
│                                                      │
│ [Ask Question]  [Help Answer]                       │
└─────────────────────────────────────────────────────┘
       │
       │ ━━━ Timeline connector
       ●
┌─────────────────────────────────────────────────────┐
│ Assignment 4: Graph Algorithms                      │
│ CS 101 • Due in 5 days                              │
│ ...                                                  │
└─────────────────────────────────────────────────────┘
```

**Urgency Colors (Based on Unanswered Questions, Not Deadline):**
- **Red (danger):** 5+ unanswered questions - urgent help needed
- **Yellow (warning):** 1-4 unanswered questions - opportunity to help
- **Blue (accent):** Active discussion (high activity)
- **Green (success):** All questions answered/resolved

**Timeline Dot Colors:**
```typescript
const dotColor =
  unansweredQuestions >= 5 ? "bg-danger" :
  unansweredQuestions >= 1 ? "bg-warning" :
  activeStudents >= 10 ? "bg-accent" :
  "bg-success";
```

### Component Hierarchy

```tsx
<AssignmentQAOpportunities>
  <ol className="relative space-y-4" aria-label="Assignment Q&A opportunities">
    {assignments.map((assignment, index) => (
      <AssignmentQAItem
        key={assignment.assignmentId}
        assignment={assignment}
        showConnector={index < assignments.length - 1}
      />
    ))}
  </ol>
</AssignmentQAOpportunities>

// Internal component
function AssignmentQAItem({ assignment, showConnector }) {
  return (
    <li className="relative flex gap-4">
      {/* Timeline Dot */}
      <div className="relative flex flex-col items-center shrink-0">
        <div className={cn("size-4 rounded-full border-2", dotColor)} />
        {showConnector && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Card Content */}
      <Card variant="glass-hover" className="flex-1">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-base font-semibold glass-text">{assignment.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{assignment.courseName}</span>
              <span>•</span>
              <time dateTime={assignment.dueDate}>{relativeDueDate}</time>
            </div>
          </div>

          {/* Q&A Metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>{assignment.totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span>{assignment.unansweredQuestions} unanswered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>{assignment.aiAnswersAvailable} AI answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{assignment.activeStudents} discussing</span>
            </div>
          </div>

          {/* Your Activity */}
          {(assignment.yourQuestions > 0 || assignment.yourAnswers > 0) && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                Your Activity: {assignment.yourQuestions} questions, {assignment.yourAnswers} answers
              </Badge>
            </div>
          )}

          {/* Suggested Action */}
          <div className={cn(
            "flex items-start gap-2 p-3 rounded-lg",
            assignment.suggestedAction === "answer" ? "bg-warning/10" :
            assignment.suggestedAction === "ask" ? "bg-accent/10" :
            "bg-muted/50"
          )}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="text-sm">{assignment.actionReason}</span>
          </div>

          {/* CTAs */}
          <div className="flex gap-2">
            {assignment.suggestedAction === "ask" && (
              <Button size="sm" variant="default" asChild>
                <Link href={`${assignment.link}?action=ask`}>Ask Question</Link>
              </Button>
            )}
            {assignment.suggestedAction === "answer" && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`${assignment.link}?action=answer`}>Help Answer</Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link href={assignment.link || "#"}>View All Q&A</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
```

### State Management

**Local State:**
- None (fully controlled by props)

**Derived State:**
- `relativeDueDate` - Calculated from `dueDate` (e.g., "Due in 2 days")
- `dotColor` - Determined by urgency algorithm
- `filteredAssignments` - Filtered by `courseId` if provided

**No side effects** - Pure presentation component

### Accessibility

**ARIA Attributes:**
```tsx
<ol aria-label="Assignment Q&A opportunities" role="list">
  <li role="listitem">
    <div role="region" aria-labelledby={`assignment-${id}-title`}>
      <h3 id={`assignment-${id}-title}`}>{assignment.title}</h3>

      <div role="status" aria-live="polite">
        {assignment.unansweredQuestions} unanswered questions
      </div>

      <div className={cn("size-4 rounded-full", dotColor)}
           aria-label={`Urgency: ${urgencyLevel}`}
      />
    </div>
  </li>
</ol>
```

**Keyboard Navigation:**
- All CTA buttons keyboard accessible
- Timeline navigable with arrow keys (semantic list)
- Focus indicators visible on glass backgrounds

**Screen Reader:**
- Assignment title announced
- Q&A metrics announced as list
- Suggested action announced with reason
- Due date in accessible format (ISO 8601)

### Responsive Behavior

**Mobile (360px-640px):**
- Timeline dots smaller (size-3 instead of size-4)
- Metrics grid 1 column (not 2)
- CTAs stack vertically
- Hide "Your Activity" badge if space constrained

**Tablet (640px-1024px):**
- Standard 2-column metrics grid
- CTAs inline

**Desktop (1024px+):**
- Full layout
- Timeline with larger connector lines

### Loading State

```tsx
if (loading) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-4 rounded-full bg-glass-medium shrink-0" />
          <Skeleton className="h-48 flex-1 bg-glass-medium rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

### Empty State

```tsx
if (assignments.length === 0) {
  return (
    <Card variant="glass" className="p-6 text-center">
      <div className="space-y-3">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No Upcoming Assignments</h3>
          <p className="text-sm text-muted-foreground glass-text">
            {emptyMessage || "Check back later for assignment Q&A opportunities"}
          </p>
        </div>
      </div>
    </Card>
  );
}
```

### Performance Optimizations

**Memoization:**
```tsx
// Filter assignments by course
const filteredAssignments = useMemo(() => {
  const filtered = courseId
    ? assignments.filter(a => a.courseId === courseId)
    : assignments;
  return filtered.slice(0, maxItems);
}, [assignments, courseId, maxItems]);

// Relative date calculation
const getRelativeDueDate = useCallback((dueDate: string) => {
  const date = new Date(dueDate);
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}, []);
```

**React.memo:**
- Wrap `AssignmentQAItem` in React.memo (pure component)
- Only re-renders if assignment data changes

### Testing Scenarios

1. **Zero assignments** - Empty state displays
2. **Single assignment** - Timeline connector hidden
3. **Urgency colors** - Correct color for each urgency level
4. **Overdue assignment** - "Overdue" displays, color = danger
5. **Your activity present** - Badge shows correctly
6. **Your activity absent** - Badge hidden, no layout shift
7. **Long assignment title** - Truncates with ellipsis
8. **Multiple courses** - courseId filter works
9. **All questions answered** - Success color, positive messaging
10. **High activity** - Accent color, "Join discussion" CTA
11. **Loading state** - Skeleton matches dimensions
12. **Dark mode** - All colors and glass effects correct
13. **Mobile responsive** - Timeline adapts, CTAs stack

---

## Shared Type Definitions

### New Types to Add to `lib/models/types.ts`

```typescript
// ============================================
// Quokka Points Types
// ============================================

/**
 * Point source for Quokka Points breakdown
 */
export interface PointSource {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  points: number;
  count: number;
  pointsPerAction: number;
}

/**
 * Milestone for Quokka Points progression
 */
export interface PointMilestone {
  threshold: number;
  label: string;
  achieved: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Quokka Points data for student dashboard
 */
export interface QuokkaPointsData {
  totalPoints: number;
  weeklyPoints: number;
  pointSources: PointSource[];
  milestones: PointMilestone[];
  sparklineData?: number[];
}

// ============================================
// Assignment Q&A Types
// ============================================

/**
 * Q&A metrics for a specific assignment
 */
export interface AssignmentQAMetrics {
  assignmentId: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  totalQuestions: number;
  unansweredQuestions: number;
  yourQuestions: number;
  yourAnswers: number;
  aiAnswersAvailable: number;
  activeStudents: number;
  recentActivity?: string;
  suggestedAction: "ask" | "answer" | "review";
  actionReason: string;
  link?: string;
}
```

### Update `StudentDashboardData` Interface

```typescript
// In lib/models/types.ts (UPDATE existing)
export interface StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    totalPosts: StatWithTrend;
    endorsedPosts: StatWithTrend;
  };
  goals: GoalProgress[];

  // NEW: Quokka Points data
  quokkaPoints: QuokkaPointsData;

  // NEW: Assignment Q&A opportunities
  assignmentQA: AssignmentQAMetrics[];
}
```

---

## File Structure Summary

### New Files to Create

```
components/dashboard/
├── quokka-points-card.tsx          (NEW - Component 1)
└── assignment-qa-opportunities.tsx (NEW - Component 3)
```

### Files to Modify

```
components/dashboard/
├── quick-actions-panel.tsx         (UPDATE - Component 2)

lib/models/
└── types.ts                        (UPDATE - Add new types)

app/dashboard/
└── page.tsx                        (UPDATE - Integrate new components)
```

---

## Usage Examples

### Example 1: Basic QuokkaPointsCard

```tsx
import { QuokkaPointsCard } from "@/components/dashboard/quokka-points-card";
import { ThumbsUp, MessageSquare, Star } from "lucide-react";

<QuokkaPointsCard
  totalPoints={1245}
  weeklyPoints={32}
  pointSources={[
    {
      id: "peer-endorsements",
      label: "Peer Endorsements",
      icon: ThumbsUp,
      points: 75,
      count: 15,
      pointsPerAction: 5,
    },
    {
      id: "helpful-answers",
      label: "Helpful Answers",
      icon: MessageSquare,
      points: 80,
      count: 8,
      pointsPerAction: 10,
    },
    {
      id: "instructor-endorsed",
      label: "Instructor Endorsed",
      icon: Star,
      points: 40,
      count: 2,
      pointsPerAction: 20,
    },
  ]}
  milestones={[
    { threshold: 100, label: "Getting Started", achieved: true },
    { threshold: 500, label: "Active Contributor", achieved: true },
    { threshold: 1500, label: "Helpful Contributor", achieved: false },
    { threshold: 3000, label: "Community Expert", achieved: false },
  ]}
  sparklineData={[5, 8, 12, 10, 15, 18, 22]}
  onViewDetails={() => router.push("/points-history")}
/>
```

### Example 2: Updated QuickActionsPanel

```tsx
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { Sparkles, MessageSquare, HandHelping, Share2 } from "lucide-react";

<QuickActionsPanel
  actions={[
    {
      id: "ask-ai",
      label: "Ask AI",
      icon: Sparkles,
      href: "/ask",
      variant: "primary",
    },
    {
      id: "browse-qa",
      label: "Browse Q&A",
      icon: MessageSquare,
      href: "/",
      badgeCount: 5,
      variant: "default",
    },
    {
      id: "help-answer",
      label: "Help Answer",
      icon: HandHelping,
      href: "/unanswered",
      badgeCount: 12,
      variant: "success",
    },
    {
      id: "share-conversation",
      label: "Share Chat",
      icon: Share2,
      onClick: () => openShareDialog(),
      variant: "default",
    },
  ]}
/>
```

### Example 3: AssignmentQAOpportunities

```tsx
import { AssignmentQAOpportunities } from "@/components/dashboard/assignment-qa-opportunities";

<AssignmentQAOpportunities
  assignments={[
    {
      assignmentId: "assignment-3",
      title: "Binary Search Trees",
      courseId: "cs-101",
      courseName: "CS 101",
      dueDate: "2025-10-15T23:59:00Z",
      totalQuestions: 12,
      unansweredQuestions: 3,
      yourQuestions: 2,
      yourAnswers: 1,
      aiAnswersAvailable: 8,
      activeStudents: 15,
      recentActivity: "5 questions in last hour",
      suggestedAction: "answer",
      actionReason: "3 unanswered questions need help",
      link: "/courses/cs-101/assignments/3/qa",
    },
    {
      assignmentId: "assignment-4",
      title: "Graph Algorithms",
      courseId: "cs-101",
      courseName: "CS 101",
      dueDate: "2025-10-18T23:59:00Z",
      totalQuestions: 8,
      unansweredQuestions: 0,
      yourQuestions: 1,
      yourAnswers: 0,
      aiAnswersAvailable: 7,
      activeStudents: 10,
      suggestedAction: "review",
      actionReason: "All questions answered - review AI answers",
      link: "/courses/cs-101/assignments/4/qa",
    },
  ]}
  maxItems={5}
/>
```

---

## Integration Plan

### Step 1: Type Definitions
1. Add new types to `lib/models/types.ts`
2. Update `StudentDashboardData` interface
3. Run `npx tsc --noEmit` to verify types

### Step 2: Create QuokkaPointsCard
1. Create `components/dashboard/quokka-points-card.tsx`
2. Implement component with all props
3. Add loading and empty states
4. Test in isolation (Storybook or standalone page)

### Step 3: Create AssignmentQAOpportunities
1. Create `components/dashboard/assignment-qa-opportunities.tsx`
2. Implement timeline visualization
3. Create internal `AssignmentQAItem` component
4. Add loading and empty states
5. Test in isolation

### Step 4: Update QuickActionsPanel
1. Modify `components/dashboard/quick-actions-panel.tsx`
2. Update variant classes (add glow effects)
3. Conditionally render larger icons for primary variant
4. Add tooltips for badge counts
5. Test existing usage doesn't break

### Step 5: Update Mock API
1. Add `quokkaPoints` to mock student dashboard data
2. Add `assignmentQA` to mock student dashboard data
3. Create utility functions to calculate point values

### Step 6: Integrate into Dashboard
1. Import new components in `app/dashboard/page.tsx`
2. Replace `<StudyStreakCard>` with `<QuokkaPointsCard>`
3. Replace `<UpcomingDeadlines>` with `<AssignmentQAOpportunities>`
4. Update `quickActions` array with Q&A-focused actions
5. Test full dashboard layout

### Step 7: Testing & QA
1. Run typecheck: `npx tsc --noEmit`
2. Run lint: `npm run lint`
3. Run build: `npm run build`
4. Test keyboard navigation
5. Test screen reader (VoiceOver/NVDA)
6. Test responsive layouts (360px, 768px, 1024px, 1280px)
7. Test dark mode
8. Test loading states
9. Test empty states
10. Verify QDS compliance (colors, spacing, radii, shadows)

---

## Design System Compliance Checklist

### QuokkaPointsCard
- [x] Uses QDS color tokens (`--primary`, `--success`, `--muted-foreground`)
- [x] Uses QDS spacing scale (gap-2, gap-3, gap-4)
- [x] Uses QDS radius scale (rounded-lg on Card)
- [x] Uses QDS shadows (shadow-glass-md via glass-hover variant)
- [x] Glass effects use predefined utilities (.glass-text, Card variant="glass-hover")
- [x] Typography uses Tailwind classes (text-5xl, text-sm, font-bold)
- [x] Interactive states defined (hover on card, focus on button)
- [x] Accessibility attributes present (aria-label, role, semantic HTML)
- [x] Keyboard navigation supported
- [x] Dark mode compatible (uses semantic tokens)
- [x] Mobile responsive (breakpoint-based layout)

### QuickActionsPanel
- [x] Uses QDS color tokens (variant-based)
- [x] Uses QDS spacing scale (gap-2, gap-3, p-4)
- [x] Uses QDS radius scale (rounded-full on icon backgrounds, rounded-lg on cards)
- [x] Uses QDS shadows (shadow-[var(--focus-shadow-primary)] for glow)
- [x] Glass effects (Card variant="glass")
- [x] Typography (text-sm, font-medium, font-semibold)
- [x] Interactive states (hover, focus)
- [x] Accessibility (aria-label on badges, role="group")
- [x] Keyboard navigation
- [x] Dark mode compatible
- [x] Mobile responsive (grid-cols-2 md:grid-cols-4)

### AssignmentQAOpportunities
- [x] Uses QDS color tokens (dotColor based on semantic tokens)
- [x] Uses QDS spacing scale (space-y-3, gap-2, p-3, p-4)
- [x] Uses QDS radius scale (rounded-lg on cards, rounded-full on dots)
- [x] Uses QDS shadows (shadow-glass-md via glass-hover variant)
- [x] Glass effects (Card variant="glass-hover", .glass-text)
- [x] Typography (text-base, text-sm, font-semibold)
- [x] Interactive states (hover on cards and buttons, focus on buttons)
- [x] Accessibility (aria-label, role="list/listitem", semantic HTML)
- [x] Keyboard navigation
- [x] Dark mode compatible
- [x] Mobile responsive (metrics grid adapts, CTAs stack)

---

## Architecture Decisions

### Decision 1: QuokkaPointsCard Structure
**Rationale:** Replicates `StudyStreakCard` structure (point display + progress + breakdown) to maintain visual consistency. Uses same Card variant, layout patterns, and QDS tokens.

**Trade-offs:**
- **Pro:** Minimal learning curve for developers, consistent UX
- **Pro:** Leverages existing patterns (Progress component, MiniSparkline)
- **Con:** Limited space for detailed point breakdown (max 3 sources)

**Alternative considered:** Separate cards for points balance vs breakdown
**Why not:** Increases visual complexity, breaks single-card pattern

---

### Decision 2: QuickActionsPanel - Update vs Rebuild
**Rationale:** Existing component architecture is sound (props-driven, accessible). Only action configuration and styling need changes. Updating preserves existing usage patterns and reduces regression risk.

**Trade-offs:**
- **Pro:** Minimal code changes, existing tests remain valid
- **Pro:** Backward compatible (existing action configs still work)
- **Con:** Limited flexibility for future action types (constrained by existing interface)

**Alternative considered:** Rebuild with new component library
**Why not:** Existing component meets 90% of needs, not worth migration cost

---

### Decision 3: AssignmentQAOpportunities - Timeline Layout
**Rationale:** Timeline visualization familiar from `UpcomingDeadlines`. Users already understand vertical progression pattern. Reusing CSS utilities (dots, connectors) reduces code duplication.

**Trade-offs:**
- **Pro:** Familiar UX, existing patterns, accessible
- **Pro:** Timeline naturally shows chronological progression (due dates)
- **Con:** Less space for rich Q&A metrics vs card grid
- **Con:** Mobile layout requires vertical stacking (longer scroll)

**Alternatives considered:**
1. **Card grid** - More space but loses chronological context
2. **Horizontal timeline** - Poor mobile UX, doesn't scale

**Why timeline:** Best balance of familiarity, accessibility, and mobile UX

---

### Decision 4: Point Calculation Logic - Client vs Server
**Rationale:** Point values calculated server-side, sent to client as props. Client displays only. This prevents client-side manipulation and centralizes business logic.

**Trade-offs:**
- **Pro:** Security (can't fake points), single source of truth
- **Pro:** Complex calculations (endorsement weighting, time decay) on server
- **Con:** Client can't show real-time updates without refetch

**Alternative considered:** Client calculates points from activity array
**Why not:** Insecure, duplicates logic, prone to drift

---

### Decision 5: Suggested Action Algorithm - Server-Side
**Rationale:** "Ask" vs "Answer" vs "Review" determined by server based on unanswered count, student activity, AI coverage, and assignment proximity. Client trusts server recommendation.

**Trade-offs:**
- **Pro:** Sophisticated ML-driven suggestions possible (future)
- **Pro:** Consistent logic across mobile/web/email
- **Con:** Client can't customize suggestions per user preferences

**Alternative considered:** Client-side heuristics
**Why not:** Too simplistic, doesn't scale to ML models

---

## Future Considerations

### Phase 2 Enhancements (Post-MVP)

**QuokkaPointsCard:**
- Animated point gain (confetti on milestone achievement)
- Leaderboard toggle (opt-in competitive view)
- Weekly challenges ("Answer 5 questions this week")
- Point history chart (line graph over time)

**QuickActionsPanel:**
- Dynamic action ordering (most-used actions move to top)
- Floating action button (FAB) on mobile
- Voice-triggered actions (accessibility)

**AssignmentQAOpportunities:**
- Expandable cards (tap to see full Q&A list)
- Filter by suggested action ("Show me all answer opportunities")
- Calendar integration (sync due dates)
- Push notifications (time-sensitive Q&A alerts)

### Refactoring Opportunities

**Shared Timeline Component:**
- Extract timeline CSS into reusable `<Timeline>` component
- Use in UpcomingDeadlines, AssignmentQAOpportunities, activity feeds
- Props: items[], dotColor(), connector, orientation

**Shared Metric Chip Component:**
- Extract Q&A metric display (icon + count) into `<MetricChip>`
- Use in AssignmentQAOpportunities, EnhancedCourseCard, StatCard
- Props: icon, count, label, variant

**Points Badge Component:**
- Extract inline point display into `<QuokkaPointsBadge>`
- Use in nav, dashboard, thread detail, profile
- Props: points, size, showIcon, animated

---

## Conclusion

This component architecture transforms the student dashboard from LMS-like to Q&A companion while maintaining:

- **Visual consistency** - QDS 2.0 glassmorphism throughout
- **Code reusability** - Leverages existing primitives and patterns
- **Accessibility** - WCAG 2.2 AA compliance, keyboard nav, screen reader support
- **Performance** - GPU-accelerated glass effects, memoized calculations, React Query caching
- **Maintainability** - Props-driven, TypeScript strict mode, clear interfaces

**Next steps:**
1. Review this design plan for approval
2. Implement components in order (types → QuokkaPoints → QuickActions → AssignmentQA)
3. Integrate into dashboard
4. Test and iterate

---

**Files to create:**
- `components/dashboard/quokka-points-card.tsx`
- `components/dashboard/assignment-qa-opportunities.tsx`

**Files to modify:**
- `components/dashboard/quick-actions-panel.tsx`
- `lib/models/types.ts`
- `app/dashboard/page.tsx`

**Implementation estimate:** 6-8 hours (2-3 hours per component, 1 hour integration/testing)

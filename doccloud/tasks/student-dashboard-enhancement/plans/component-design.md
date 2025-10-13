# Student Dashboard Component Design Plan

**Date:** 2025-10-12
**Task:** Student Dashboard Enhancement - Component Architecture
**Agent:** Component Architect
**Status:** Ready for Review

---

## Component Hierarchy

```
StudentDashboard (app/dashboard/page.tsx)
├── StudyStreakCard (components/dashboard/study-streak-card.tsx)
├── QuickActionsPanel (components/dashboard/quick-actions-panel.tsx)
│   └── QuickActionButton (internal component)
├── EnhancedCourseCard (components/dashboard/enhanced-course-card.tsx) [EXISTING]
├── UpcomingDeadlines (components/dashboard/upcoming-deadlines.tsx)
│   └── DeadlineItem (internal component)
├── TimelineActivity (components/dashboard/timeline-activity.tsx) [EXISTING]
├── StudentRecommendations (components/dashboard/student-recommendations.tsx)
│   └── RecommendationCard (internal component)
└── StatCard (components/dashboard/stat-card.tsx) [EXTEND]
    └── MiniSparkline (components/dashboard/mini-sparkline.tsx) [NEW]
```

---

## 1. StudyStreakCard

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/study-streak-card.tsx`

### Purpose
Gamification element showing student's activity streak, weekly progress toward goal, and motivational messaging.

### TypeScript Interface

```typescript
export interface StudyStreakCardProps {
  /**
   * Current streak count (consecutive days with activity)
   */
  streakDays: number;

  /**
   * Weekly activity count (posts, threads, endorsements)
   */
  weeklyActivity: number;

  /**
   * Weekly goal target
   */
  goalTarget: number;

  /**
   * Array of recent achievements (optional)
   */
  achievements?: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    earnedAt: string;
  }>;

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Component Structure

```typescript
export function StudyStreakCard({
  streakDays,
  weeklyActivity,
  goalTarget,
  achievements = [],
  loading = false,
  className,
}: StudyStreakCardProps) {
  // Compute progress percentage
  const progressPercent = Math.min((weeklyActivity / goalTarget) * 100, 100);
  const isGoalMet = weeklyActivity >= goalTarget;

  // Motivational message based on streak
  const getMessage = () => {
    if (streakDays === 0) return "Start your streak today!";
    if (streakDays === 1) return "Great start! Keep it up!";
    if (streakDays < 7) return `${streakDays} day streak! You're on fire!`;
    return `${streakDays} day streak! Incredible consistency!`;
  };

  return (
    <Card variant="glass-hover" className={cn("relative overflow-hidden", className)}>
      {/* Flame icon background decoration */}
      <div className="absolute top-4 right-4 opacity-10" aria-hidden="true">
        <Flame className="h-24 w-24 text-warning" />
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Streak Display */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Study Streak
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary tabular-nums">
                {streakDays}
              </span>
              <span className="text-lg text-muted-foreground">
                {streakDays === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{getMessage()}</p>
          </div>

          <Flame
            className={cn(
              "h-10 w-10 transition-colors",
              streakDays > 0 ? "text-warning" : "text-muted-foreground"
            )}
            aria-label="Streak flame icon"
          />
        </div>

        {/* Weekly Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className="font-medium tabular-nums">
              {weeklyActivity} / {goalTarget}
            </span>
          </div>

          <Progress
            value={progressPercent}
            className="h-3"
            aria-label={`Weekly goal progress: ${progressPercent.toFixed(0)}%`}
          />

          {isGoalMet && (
            <div className="flex items-center gap-1.5 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">Goal achieved!</span>
            </div>
          )}
        </div>

        {/* Recent Achievements (optional) */}
        {achievements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Recent Achievements
            </p>
            <div className="flex gap-2">
              {achievements.slice(0, 3).map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10"
                    title={achievement.title}
                    aria-label={achievement.title}
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Loading State
```typescript
if (loading) {
  return (
    <Card className={cn("glass-panel", className)}>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-16 w-32 bg-glass-medium" />
        <Skeleton className="h-3 w-full bg-glass-medium" />
        <Skeleton className="h-8 w-24 bg-glass-medium" />
      </CardContent>
    </Card>
  );
}
```

### Accessibility
- Progress bar with `aria-label` for percentage
- Flame icon with `aria-label` for meaning
- Achievement badges with `title` and `aria-label`
- Goal achievement announcement with `role="status"` (implicit via content)

### Responsive Behavior
- Single column card (no responsive changes needed)
- Font sizes scale with viewport (text-5xl responsive)

---

## 2. QuickActionsPanel

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/quick-actions-panel.tsx`

### Purpose
Fast access grid of common student actions with notification badges.

### TypeScript Interface

```typescript
export interface QuickActionButton {
  /**
   * Unique action identifier
   */
  id: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Icon component
   */
  icon: React.ComponentType<{ className?: string }>;

  /**
   * Navigation href (uses Link) or onClick callback
   */
  href?: string;
  onClick?: () => void;

  /**
   * Optional badge count (e.g., unread notifications)
   */
  badgeCount?: number;

  /**
   * Optional variant (default, primary, success)
   */
  variant?: "default" | "primary" | "success";
}

export interface QuickActionsPanelProps {
  /**
   * Array of actions to display
   */
  actions: QuickActionButton[];

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### Component Structure

```typescript
export function QuickActionsPanel({
  actions,
  loading = false,
  className,
}: QuickActionsPanelProps) {
  if (loading) {
    return (
      <Card className={cn("glass-panel", className)}>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 bg-glass-medium rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="group" aria-label="Quick actions">
          {actions.map((action) => (
            <QuickActionButton key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Internal QuickActionButton component
function QuickActionButton({ action }: { action: QuickActionButton }) {
  const Icon = action.icon;
  const variantClasses = {
    default: "hover:bg-muted hover:border-primary/30",
    primary: "hover:bg-primary/10 hover:border-primary",
    success: "hover:bg-success/10 hover:border-success",
  };

  const content = (
    <>
      <div className="relative">
        <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-full bg-muted">
          <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
        </div>
        {action.badgeCount && action.badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            aria-label={`${action.badgeCount} ${action.label.toLowerCase()}`}
          >
            {action.badgeCount}
          </Badge>
        )}
      </div>
      <span className="text-sm font-medium text-center leading-tight">
        {action.label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex flex-col items-center justify-center gap-3 p-4 rounded-lg border bg-card transition-all",
    variantClasses[action.variant || "default"]
  );

  if (action.href) {
    return (
      <Link href={action.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={action.onClick} className={baseClasses}>
      {content}
    </button>
  );
}
```

### Usage Example

```typescript
const quickActions: QuickActionButton[] = [
  {
    id: "ask",
    label: "Ask Question",
    icon: MessageSquarePlus,
    href: "/ask",
    variant: "primary",
  },
  {
    id: "browse",
    label: "Browse Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    id: "saved",
    label: "Saved Threads",
    icon: Bookmark,
    badgeCount: data.savedThreadsCount,
    href: "/saved",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    badgeCount: data.unreadCount,
    href: "/notifications",
  },
];

<QuickActionsPanel actions={quickActions} />
```

### Accessibility
- `role="group"` with `aria-label` for action grid
- Badge counts with `aria-label` for screen readers
- Focus-visible ring on all buttons
- Touch targets ≥44px (h-12 w-12 icon containers)

### Responsive Behavior
- Mobile: `grid-cols-2` (2x2 grid)
- Tablet+: `md:grid-cols-4` (1x4 horizontal row)

---

## 3. UpcomingDeadlines

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/upcoming-deadlines.tsx`

### Purpose
Timeline of upcoming course events and deadlines (assignments, exams, office hours).

### TypeScript Interface

```typescript
export interface Deadline {
  /**
   * Unique deadline identifier
   */
  id: string;

  /**
   * Deadline title (e.g., "Assignment 3 Due")
   */
  title: string;

  /**
   * Course ID
   */
  courseId: string;

  /**
   * Course name (for display)
   */
  courseName: string;

  /**
   * Deadline type
   */
  type: "assignment" | "exam" | "office-hours" | "quiz" | "project";

  /**
   * ISO 8601 deadline timestamp
   */
  dueDate: string;

  /**
   * Optional link to assignment/event
   */
  link?: string;
}

export interface UpcomingDeadlinesProps {
  /**
   * Array of deadlines (sorted by date, nearest first)
   */
  deadlines: Deadline[];

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

### Component Structure

```typescript
export function UpcomingDeadlines({
  deadlines,
  maxItems = 5,
  courseId,
  loading = false,
  emptyMessage = "No upcoming deadlines",
  className,
}: UpcomingDeadlinesProps) {
  // Filter by course if specified
  const filteredDeadlines = React.useMemo(() => {
    let filtered = courseId
      ? deadlines.filter((d) => d.courseId === courseId)
      : deadlines;
    return filtered.slice(0, maxItems);
  }, [deadlines, courseId, maxItems]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-4 rounded-full bg-glass-medium shrink-0" />
            <Skeleton className="h-20 flex-1 bg-glass-medium rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (filteredDeadlines.length === 0) {
    return (
      <Card variant="glass" className={cn("p-6 text-center", className)}>
        <div className="space-y-2">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground glass-text">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <ol className={cn("relative space-y-4", className)} aria-label="Upcoming deadlines timeline">
      {filteredDeadlines.map((deadline, index) => (
        <DeadlineItem
          key={deadline.id}
          deadline={deadline}
          showConnector={index < filteredDeadlines.length - 1}
        />
      ))}
    </ol>
  );
}

// Internal DeadlineItem component
function DeadlineItem({
  deadline,
  showConnector,
}: {
  deadline: Deadline;
  showConnector: boolean;
}) {
  const deadlineDate = new Date(deadline.dueDate);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Urgency color
  const dotColor = diffDays <= 1
    ? "bg-danger"
    : diffDays <= 3
    ? "bg-warning"
    : "bg-primary";

  // Type icon
  const typeIcons = {
    assignment: FileText,
    exam: AlertCircle,
    "office-hours": Clock,
    quiz: HelpCircle,
    project: Briefcase,
  };
  const TypeIcon = typeIcons[deadline.type] || FileText;

  // Relative time
  const getRelativeTime = () => {
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const content = (
    <Card variant="glass-hover" className="h-full">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <TypeIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-sm font-medium leading-snug glass-text">
              {deadline.title}
            </h3>
            <p className="text-xs text-muted-foreground glass-text">
              {deadline.courseName}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <time
                dateTime={deadline.dueDate}
                className={cn(
                  "font-medium",
                  diffDays <= 1 ? "text-danger" : diffDays <= 3 ? "text-warning" : "text-foreground"
                )}
              >
                {getRelativeTime()}
              </time>
              <span className="text-muted-foreground" aria-hidden="true">•</span>
              <span className="text-muted-foreground">
                {deadlineDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <li className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className={cn(
            "size-4 rounded-full border-2 border-background z-10",
            dotColor
          )}
          aria-hidden="true"
        />
        {/* Connecting line */}
        {showConnector && (
          <div
            className="w-px flex-1 bg-border absolute top-3"
            style={{ height: "calc(100% + 1rem)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Deadline card */}
      <div className="flex-1 pb-4">
        {deadline.link ? (
          <Link href={deadline.link}>{content}</Link>
        ) : (
          content
        )}
      </div>
    </li>
  );
}
```

### Accessibility
- `<ol>` with `aria-label` for timeline structure
- `<time>` with `dateTime` attribute
- Relative time + absolute date for screen readers
- Focus rings on interactive elements
- Type icons with `aria-hidden="true"` (meaning in text)

### Responsive Behavior
- Single column timeline (same as TimelineActivity)
- No responsive changes needed

---

## 4. StudentRecommendations

### File Path
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/student-recommendations.tsx`

### Purpose
Personalized thread recommendations based on enrolled courses and recent activity.

### TypeScript Interface

```typescript
export interface RecommendedThread {
  /**
   * Thread data
   */
  thread: Thread;

  /**
   * Course name (for display)
   */
  courseName: string;

  /**
   * Relevance score (0-100)
   */
  relevanceScore: number;

  /**
   * Reason for recommendation
   */
  reason: "high-engagement" | "trending" | "unanswered" | "similar-interests";
}

export interface StudentRecommendationsProps {
  /**
   * Array of recommended threads
   */
  recommendations: RecommendedThread[];

  /**
   * Maximum items to display (default: 6)
   */
  maxItems?: number;

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

### Component Structure

```typescript
export function StudentRecommendations({
  recommendations,
  maxItems = 6,
  loading = false,
  emptyMessage = "No recommendations yet. Check back after more activity!",
  className,
}: StudentRecommendationsProps) {
  const displayedRecommendations = React.useMemo(
    () => recommendations.slice(0, maxItems),
    [recommendations, maxItems]
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 bg-glass-medium rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (displayedRecommendations.length === 0) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <div className="space-y-3">
          <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground glass-text">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}
      role="list"
      aria-label="Recommended threads"
    >
      {displayedRecommendations.map((rec) => (
        <RecommendationCard key={rec.thread.id} recommendation={rec} />
      ))}
    </div>
  );
}

// Internal RecommendationCard component
function RecommendationCard({ recommendation }: { recommendation: RecommendedThread }) {
  const { thread, courseName, relevanceScore, reason } = recommendation;

  const reasonLabels = {
    "high-engagement": "Trending in your course",
    "trending": "Popular this week",
    "unanswered": "Needs an answer",
    "similar-interests": "Based on your activity",
  };

  const reasonColors = {
    "high-engagement": "text-warning",
    "trending": "text-success",
    "unanswered": "text-danger",
    "similar-interests": "text-accent",
  };

  return (
    <Link href={`/threads/${thread.id}`} className="block" role="listitem">
      <article>
        <Card variant="glass-hover" className="h-full transition-all hover:shadow-e2">
          <CardContent className="p-4 space-y-3">
            {/* Header: Course + Reason Badge */}
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                {courseName}
              </Badge>
              <span className={cn("text-xs font-medium shrink-0", reasonColors[reason])}>
                {reasonLabels[reason]}
              </span>
            </div>

            {/* Thread Title */}
            <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 glass-text">
              {thread.title}
            </h3>

            {/* Thread Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 glass-text">
              {thread.content}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{thread.views} views</span>
              </div>
              <span aria-hidden="true">•</span>
              <time dateTime={thread.createdAt}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </time>
              {thread.hasAIAnswer && (
                <>
                  <span aria-hidden="true">•</span>
                  <Badge variant="outline" className="text-xs bg-ai-purple-50 border-ai-purple-200">
                    AI Answer
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
}
```

### Accessibility
- `role="list"` for grid container
- `role="listitem"` for each recommendation
- `<article>` for semantic grouping
- `<time>` with `dateTime` attribute
- Focus rings on link wrappers

### Responsive Behavior
- Mobile: `grid-cols-1` (single column)
- Tablet+: `md:grid-cols-2` (2 columns)

---

## 5. Enhanced StatCard with Sparklines

### File Path (Extend Existing)
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/stat-card.tsx`

### File Path (New Sparkline Component)
`/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/mini-sparkline.tsx`

### Purpose
Add optional sparkline visualization to existing StatCard for 7-day trend display.

### TypeScript Interface Extension

```typescript
export interface StatCardProps {
  // ... existing props ...

  /**
   * Optional sparkline data (7-day array, left = oldest, right = newest)
   */
  sparklineData?: number[];

  /**
   * Optional tooltip text for sparkline
   */
  sparklineTooltip?: string;

  /**
   * Optional comparison period label (e.g., "vs last week")
   */
  comparisonPeriod?: string;
}
```

### MiniSparkline Component

```typescript
// components/dashboard/mini-sparkline.tsx

export interface MiniSparklineProps {
  /**
   * Array of data points (7 values, left = oldest, right = newest)
   */
  data: number[];

  /**
   * Color variant (success, warning, danger, accent, default)
   */
  variant?: "success" | "warning" | "danger" | "accent" | "default";

  /**
   * Optional className for composition
   */
  className?: string;
}

export const MiniSparkline = React.memo(function MiniSparkline({
  data,
  variant = "default",
  className,
}: MiniSparklineProps) {
  const width = 60;
  const height = 24;
  const padding = 2;

  // Normalize data to 0-1 range
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  const strokeColors = {
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-danger",
    accent: "stroke-accent",
    default: "stroke-primary",
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      role="img"
      aria-label="7-day trend sparkline"
    >
      <path
        d={pathData}
        fill="none"
        className={cn(strokeColors[variant], "stroke-2")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
```

### StatCard Integration

Add to existing StatCard component after value row:

```typescript
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

### Accessibility
- SVG with `role="img"` and `aria-label`
- Sparkline supplements, not replaces, text trend indicator
- Color not sole indicator (trend direction uses icons)

### Responsive Behavior
- Sparkline scales with SVG viewBox (responsive by default)

---

## Component Integration Strategy

### Dashboard Layout Changes

#### Current Layout (lines 83-176 in app/dashboard/page.tsx)
```tsx
<main className="min-h-screen p-4 md:p-6">
  <div className="container-wide space-y-8">
    {/* Hero Section */}
    {/* Courses (2 cols) + Activity (1 col) */}
    {/* Stats (2x2 / 4 cols) */}
  </div>
</main>
```

#### New Layout Structure
```tsx
<main className="min-h-screen p-4 md:p-6">
  <div className="container-wide space-y-8">
    {/* Hero Section */}
    <section aria-labelledby="welcome-heading" className="py-4 md:py-6 space-y-4">
      <h1 id="welcome-heading">Welcome back, {user.name}!</h1>
      <p>Your academic dashboard...</p>
    </section>

    {/* NEW: Engagement Row (3 cols on desktop) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <StudyStreakCard {...streakProps} />
      <QuickActionsPanel actions={quickActions} />
      <UpcomingDeadlines deadlines={upcomingDeadlines} maxItems={3} />
    </div>

    {/* Main Content: Courses (2 cols) + Activity (1 col) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-4">
        <h2 id="courses-heading">My Courses</h2>
        {/* EnhancedCourseCard grid */}
      </section>

      <aside aria-labelledby="activity-heading" className="space-y-6">
        <div className="space-y-4">
          <h2 id="activity-heading">Recent Activity</h2>
          <TimelineActivity activities={data.recentActivity} maxItems={5} />
        </div>
        {/* Move UpcomingDeadlines here on smaller screens */}
      </aside>
    </div>

    {/* NEW: Recommendations Section */}
    <section aria-labelledby="recommendations-heading" className="space-y-4">
      <h2 id="recommendations-heading">Recommended for You</h2>
      <StudentRecommendations recommendations={recommendations} maxItems={6} />
    </section>

    {/* Enhanced Stats with Sparklines */}
    <section aria-labelledby="stats-heading" className="space-y-6">
      <h2 id="stats-heading">Your Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          {...data.stats.totalCourses}
          sparklineData={data.stats.totalCourses.sparkline}
        />
        {/* Other stats */}
      </div>
    </section>
  </div>
</main>
```

### Data Flow Integration

#### Compute Derived Data

```typescript
// Inside StudentDashboard component

// 1. Compute streak from activity
const streakData = React.useMemo(() => {
  const sortedActivity = [...data.recentActivity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of sortedActivity) {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streakDays) {
      streakDays++;
      currentDate = new Date(activityDate);
    } else {
      break;
    }
  }

  const weeklyActivity = sortedActivity.filter((activity) => {
    const activityDate = new Date(activity.timestamp);
    const diffDays = Math.floor(
      (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  }).length;

  return {
    streakDays,
    weeklyActivity,
    goalTarget: data.goals[0]?.target || 5, // Default goal: 5 activities/week
  };
}, [data.recentActivity, data.goals]);

// 2. Quick actions with dynamic counts
const quickActions = React.useMemo<QuickActionButton[]>(() => [
  {
    id: "ask",
    label: "Ask Question",
    icon: MessageSquarePlus,
    href: "/ask",
    variant: "primary",
  },
  {
    id: "browse",
    label: "Browse Courses",
    icon: BookOpen,
    href: "/courses",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    badgeCount: data.unreadCount,
    href: "/notifications",
  },
  {
    id: "search",
    label: "Search Threads",
    icon: Search,
    href: "/search",
  },
], [data.unreadCount]);

// 3. Upcoming deadlines (mock data for now)
const upcomingDeadlines = React.useMemo<Deadline[]>(() => {
  // TODO: Replace with real data when available
  return data.enrolledCourses.flatMap((course) => [
    {
      id: `${course.id}-assignment-1`,
      title: "Assignment 3",
      courseId: course.id,
      courseName: course.name,
      type: "assignment",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}, [data.enrolledCourses]);

// 4. Recommendations (fetch per course, aggregate)
const { data: allThreads } = useQuery({
  queryKey: ["studentRecommendations", user.id],
  queryFn: async () => {
    const courseIds = data.enrolledCourses.map((c) => c.id);
    const threadsPerCourse = await Promise.all(
      courseIds.map((id) => api.getCourseThreads(id))
    );
    return threadsPerCourse.flat();
  },
  enabled: !!user && data.enrolledCourses.length > 0,
  staleTime: 5 * 60 * 1000,
});

const recommendations = React.useMemo<RecommendedThread[]>(() => {
  if (!allThreads) return [];

  // Filter: recent (< 7 days), high engagement (views > 10), not authored by user
  return allThreads
    .filter((thread) => {
      const threadDate = new Date(thread.createdAt);
      const diffDays = Math.floor((Date.now() - threadDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && thread.views > 10 && thread.authorId !== user.id;
    })
    .map((thread) => {
      const course = data.enrolledCourses.find((c) => c.id === thread.courseId);
      return {
        thread,
        courseName: course?.name || "Unknown Course",
        relevanceScore: thread.views * 2 + (thread.hasAIAnswer ? 10 : 0),
        reason: thread.views > 50
          ? "high-engagement"
          : thread.status === "open"
          ? "unanswered"
          : "similar-interests",
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}, [allThreads, data.enrolledCourses, user.id]);
```

---

## Mock Data Extensions

### 1. Add Sparkline Data to StudentDashboardData

#### File: `lib/api/client.ts` (getStudentDashboard function)

Add sparkline arrays to existing stats:

```typescript
stats: {
  totalCourses: {
    value: enrolledCourses.length,
    delta: 0,
    trend: "neutral" as const,
    trendPercent: 0,
    label: "Enrolled Courses",
    sparkline: [3, 3, 4, 4, 4, 4, 4], // 7-day course enrollment trend
  },
  totalThreads: {
    value: userThreads.length,
    delta: 2,
    trend: "up" as const,
    trendPercent: 15,
    label: "Questions Asked",
    sparkline: [5, 6, 5, 7, 8, 9, 10], // 7-day thread creation trend
  },
  totalPosts: {
    value: userPosts.length,
    delta: 3,
    trend: "up" as const,
    trendPercent: 20,
    label: "Responses",
    sparkline: [8, 9, 10, 12, 11, 13, 15], // 7-day post creation trend
  },
  endorsedPosts: {
    value: endorsedPosts.length,
    delta: 1,
    trend: "up" as const,
    trendPercent: 10,
    label: "Endorsed Responses",
    sparkline: [1, 2, 2, 3, 3, 4, 5], // 7-day endorsement trend
  },
},
```

### 2. Add Deadlines to CourseWithActivity (Optional)

#### File: `lib/models/types.ts`

Extend `CourseWithActivity` interface:

```typescript
export interface CourseWithActivity extends Course {
  recentThreads: Thread[];
  unreadCount: number;
  deadlines?: Deadline[]; // NEW: Optional deadlines per course
}
```

#### File: `lib/api/client.ts`

Add mock deadlines when constructing `CourseWithActivity`:

```typescript
const courseWithActivity: CourseWithActivity = {
  ...course,
  recentThreads: courseThreads.slice(0, 5),
  unreadCount: Math.floor(Math.random() * 5),
  deadlines: [
    {
      id: `${course.id}-assignment-1`,
      title: "Assignment 3",
      courseId: course.id,
      courseName: course.name,
      type: "assignment",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${course.id}-exam-1`,
      title: "Midterm Exam",
      courseId: course.id,
      courseName: course.name,
      type: "exam",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
```

---

## Testing Scenarios

### 1. StudyStreakCard
- [ ] Displays 0-day streak with "Start your streak today!" message
- [ ] Displays 1-day streak with appropriate message
- [ ] Displays 7+ day streak with "Incredible consistency!" message
- [ ] Progress bar fills correctly (50% when weeklyActivity = goalTarget / 2)
- [ ] Goal achieved checkmark appears when weeklyActivity >= goalTarget
- [ ] Loading skeleton matches layout
- [ ] Achievements display (max 3 badges)
- [ ] Keyboard focus ring visible on interactive elements

### 2. QuickActionsPanel
- [ ] All 4 actions render in 2x2 grid on mobile
- [ ] All 4 actions render in 1x4 row on tablet+
- [ ] Badge counts display correctly on notification action
- [ ] Links navigate to correct routes
- [ ] Hover effects work on all actions
- [ ] Loading skeleton displays 4 items
- [ ] Focus ring visible on all action buttons
- [ ] Touch targets are ≥44px on mobile

### 3. UpcomingDeadlines
- [ ] Timeline renders with connecting lines
- [ ] Deadlines sort by date (nearest first)
- [ ] Urgency colors: red (≤1 day), yellow (≤3 days), brown (>3 days)
- [ ] Relative time displays correctly ("Due today", "Due tomorrow", "Due in X days")
- [ ] Empty state displays when no deadlines
- [ ] Loading skeleton displays 3 items with timeline dots
- [ ] Links navigate to deadline detail pages
- [ ] Keyboard navigation works (Tab through deadlines)

### 4. StudentRecommendations
- [ ] Displays max 6 recommendations
- [ ] Filters threads correctly (recent, high engagement, not authored by user)
- [ ] Reason badges display with correct colors
- [ ] AI Answer badge displays when thread has AI answer
- [ ] Responsive: 1 col mobile, 2 cols tablet+
- [ ] Empty state displays when no recommendations
- [ ] Loading skeleton displays 4 items
- [ ] Links navigate to thread detail pages
- [ ] Hover effects work on all cards

### 5. Enhanced StatCard with Sparklines
- [ ] Sparkline renders with 7 data points
- [ ] Sparkline color matches trend direction (green = up, red = down, brown = default)
- [ ] Sparkline tooltip displays on hover (optional)
- [ ] Backward compatible (works without sparkline data)
- [ ] Loading skeleton includes sparkline area
- [ ] Responsive: 2 cols mobile, 4 cols tablet+

### 6. Dashboard Integration
- [ ] All widgets render without console errors
- [ ] Layout adapts to mobile/tablet/desktop breakpoints
- [ ] Streak computation works correctly from activity data
- [ ] Recommendations fetch in parallel without N+1 queries
- [ ] Quick actions show dynamic counts (notifications, saved threads)
- [ ] Deadlines aggregate from all enrolled courses
- [ ] Empty states display when data is missing
- [ ] Loading states display during data fetch
- [ ] Screen reader announces widget headings correctly

---

## Accessibility Checklist

- [ ] All components use semantic HTML (`<article>`, `<ol>`, `<time>`, etc.)
- [ ] ARIA labels provided for all interactive elements
- [ ] Focus rings visible on all focusable elements (QDS focus utilities)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Color not sole indicator of meaning (icons + text for trends)
- [ ] Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Time elements have `dateTime` attribute + full date in `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Loading skeletons have `aria-hidden="true"`
- [ ] Empty states have descriptive messages
- [ ] Touch targets ≥44px on mobile
- [ ] Contrast ratio ≥4.5:1 for all text (WCAG AA)

---

## QDS Compliance Checklist

- [ ] All colors use semantic tokens (no hardcoded hex colors)
- [ ] Spacing uses 4pt grid (`gap-1`, `gap-2`, `gap-4`, `gap-6`, `gap-8`)
- [ ] Border radius uses QDS scale (`rounded-md`, `rounded-lg`, `rounded-xl`)
- [ ] Shadows use QDS elevation (`shadow-e1`, `shadow-e2`, `shadow-e3`)
- [ ] Glassmorphism uses QDS variants (`glass-panel`, `glass-hover`)
- [ ] Hover states use QDS tokens (`hover:bg-primary/10`, `hover:border-primary/30`)
- [ ] Focus states use QDS utilities (`focus:ring-2 focus:ring-primary`)
- [ ] Typography uses QDS scale (`text-sm`, `text-base`, `text-lg`, `text-xl`)
- [ ] Icons use consistent sizing (`h-4 w-4`, `h-5 w-5`, `h-6 w-6`)

---

## Performance Optimization

### Memoization
- [ ] Streak computation wrapped in `useMemo()` with `recentActivity` dependency
- [ ] Recommendations computation wrapped in `useMemo()` with `allThreads` dependency
- [ ] Quick actions array wrapped in `useMemo()` with `unreadCount` dependency
- [ ] MiniSparkline component wrapped in `React.memo()`

### React Query Optimization
- [ ] Recommendations query runs in parallel (one query per course)
- [ ] Recommendations query has appropriate `staleTime` (5 minutes)
- [ ] Dashboard query includes sparkline data (no additional query needed)
- [ ] No N+1 query problem (all data fetched upfront)

### Code Splitting
- [ ] No lazy loading needed (all components <200 LoC)
- [ ] Dashboard already code-split at route level

---

## Files to Create

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/study-streak-card.tsx` (185 lines)
2. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/quick-actions-panel.tsx` (150 lines)
3. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/upcoming-deadlines.tsx` (195 lines)
4. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/student-recommendations.tsx` (175 lines)
5. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/mini-sparkline.tsx` (75 lines)

## Files to Modify

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/stat-card.tsx`
   - Add `sparklineData`, `sparklineTooltip`, `comparisonPeriod` props
   - Add sparkline rendering section after value row
   - Import and use MiniSparkline component

2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/dashboard/page.tsx`
   - Add derived data computations (streak, recommendations, quick actions, deadlines)
   - Update layout with new widget grid
   - Add React Query hook for recommendations
   - Pass props to all new components

3. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`
   - Add sparkline arrays to existing stats in `getStudentDashboard()`
   - Optionally add deadlines to `CourseWithActivity` construction

4. `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`
   - Add `Deadline` interface
   - Add `QuickActionButton` interface
   - Add `RecommendedThread` interface
   - Optionally extend `CourseWithActivity` with `deadlines?` field

---

## Import/Export Strategy

### New Components (all use named exports)
```typescript
export interface StudyStreakCardProps { ... }
export function StudyStreakCard({ ... }) { ... }
```

### Existing Components (maintain named exports)
```typescript
// stat-card.tsx
export interface StatCardProps { ... } // extend with sparkline props
export function StatCard({ ... }) { ... }
```

### Dashboard Integration
```typescript
// app/dashboard/page.tsx
import { StudyStreakCard } from "@/components/dashboard/study-streak-card";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { StudentRecommendations } from "@/components/dashboard/student-recommendations";
import { MiniSparkline } from "@/components/dashboard/mini-sparkline";
```

---

## Usage Examples

### Complete Dashboard Integration

```typescript
function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  // Derived data (see "Data Flow Integration" section above)
  const streakData = useMemo(() => { ... }, [data.recentActivity]);
  const quickActions = useMemo(() => [ ... ], [data.unreadCount]);
  const upcomingDeadlines = useMemo(() => [ ... ], [data.enrolledCourses]);
  const recommendations = useMemo(() => [ ... ], [allThreads]);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="container-wide space-y-8">
        {/* Hero */}
        <section>
          <h1>Welcome back, {user.name}!</h1>
          <p>Your academic dashboard...</p>
        </section>

        {/* Engagement Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StudyStreakCard {...streakData} />
          <QuickActionsPanel actions={quickActions} />
          <UpcomingDeadlines deadlines={upcomingDeadlines} maxItems={3} />
        </div>

        {/* Courses + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <h2>My Courses</h2>
            {/* EnhancedCourseCard grid */}
          </section>
          <aside>
            <h2>Recent Activity</h2>
            <TimelineActivity activities={data.recentActivity} maxItems={5} />
          </aside>
        </div>

        {/* Recommendations */}
        <section>
          <h2>Recommended for You</h2>
          <StudentRecommendations recommendations={recommendations} maxItems={6} />
        </section>

        {/* Enhanced Stats */}
        <section>
          <h2>Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label={data.stats.totalCourses.label}
              value={data.stats.totalCourses.value}
              icon={BookOpen}
              trend={{ direction: data.stats.totalCourses.trend, label: "+0%" }}
              sparklineData={data.stats.totalCourses.sparkline}
              sparklineTooltip="7-day trend"
            />
            {/* Other stats */}
          </div>
        </section>
      </div>
    </main>
  );
}
```

---

## Next Steps for Implementation

1. **Create new component files** (5 new files)
2. **Extend StatCard** with sparkline support
3. **Add mock data** (sparkline arrays, deadlines)
4. **Update dashboard layout** with new widgets
5. **Add derived data computations** (streak, recommendations, actions)
6. **Test responsive behavior** at all breakpoints
7. **Test accessibility** with keyboard + screen reader
8. **Verify QDS compliance** (no hardcoded colors)
9. **Run type checker** (`npx tsc --noEmit`)
10. **Run linter** (`npm run lint`)

---

**Design Status:** Ready for review and implementation approval.

# Accessibility Implementation Plan: Quokka Points Page

**Target Route:** `/points`
**Standard:** WCAG 2.2 Level AA (minimum)
**Components:** QuokkaPointsHero, MilestonesTimeline, PointSourcesBreakdown, PointsActivityFeed
**Parent Page:** `app/points/page.tsx`

---

## Priority Order

1. **Critical Fixes** (WCAG violations, complete blockers)
2. **High Priority Fixes** (Significant barriers, keyboard nav issues)
3. **Medium Priority Fixes** (Improvements, enhanced experience)

---

## File Modifications Required

### 1. `app/points/page.tsx` (Main Page)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/app/points/page.tsx`

---

#### Fix 1: Page Structure with Semantic HTML

**Priority:** Critical
**Current State:** File doesn't exist yet
**Required Change:** Implement proper semantic HTML structure with landmarks and heading hierarchy

**Implementation:**

```tsx
import { SkipToContent } from "@/components/layout/skip-to-content";

export default function QuokkaPointsPage() {
  return (
    <>
      {/* Skip to content link for keyboard navigation */}
      <SkipToContent targetId="points-main-content" label="Skip to points details" />

      <main id="points-main-content" tabIndex={-1} className="min-h-screen p-4 md:p-6">
        <div className="container-wide space-y-8">
          {/* Hero Section */}
          <section aria-labelledby="points-heading" className="space-y-4">
            <h1 id="points-heading" className="heading-2 glass-text">
              Your Quokka Points
            </h1>
            <p className="text-lg text-muted-foreground glass-text">
              Track your contributions, unlock milestones, and celebrate achievements
            </p>

            {/* Hero component here */}
            <QuokkaPointsHero {...heroProps} />
          </section>

          {/* Milestones Section */}
          <section aria-labelledby="milestones-heading" className="space-y-4">
            <h2 id="milestones-heading" className="heading-4 glass-text">
              Milestone Progress
            </h2>
            <MilestonesTimeline {...milestonesProps} />
          </section>

          {/* Point Sources Section */}
          <section aria-labelledby="sources-heading" className="space-y-4">
            <h2 id="sources-heading" className="heading-4 glass-text">
              Points Breakdown
            </h2>
            <PointSourcesBreakdown {...sourcesProps} />
          </section>

          {/* Activity Feed Section (Optional) */}
          <aside aria-labelledby="activity-heading" className="space-y-4">
            <h2 id="activity-heading" className="heading-4 glass-text">
              Recent Activity
            </h2>
            <PointsActivityFeed {...activityProps} />
          </aside>
        </div>
      </main>
    </>
  );
}
```

**Test Scenario:**
- Tab through page: Skip link appears first
- Press Enter on skip link: Focus moves to main content
- Screen reader: Announces "Main region, Your Quokka Points, heading level 1"
- Heading structure: h1 → h2 (no skips)
- Landmarks: main, section (x3), aside

---

#### Fix 2: Page Title for Browser Tab

**Priority:** Critical (WCAG 2.4.2)
**Current State:** No metadata
**Required Change:** Add descriptive page title

**Implementation:**

```tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Quokka Points - QuokkaQ",
  description: "View your Quokka Points balance, milestone progress, and contribution history",
};
```

**Test Scenario:**
- Browser tab displays "Your Quokka Points - QuokkaQ"
- Screen reader announces page title on load
- Title accurately describes page content

---

### 2. `components/points/quokka-points-hero.tsx` (Hero Section)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/points/quokka-points-hero.tsx`

---

#### Fix 1: Accessible Point Display with Live Region

**Priority:** Critical
**Current State:** New component
**Required Change:** Implement aria-live region for dynamic point updates

**Implementation:**

```tsx
export function QuokkaPointsHero({
  totalPoints,
  weeklyPoints,
  loading = false,
}: QuokkaPointsHeroProps) {
  return (
    <Card variant="glass-hover" className="relative overflow-hidden">
      {/* Decorative Background Icon */}
      <div className="absolute top-8 right-8 opacity-5" aria-hidden="true">
        <QuokkaIcon size="xl" variant="outline" />
      </div>

      <CardContent className="relative z-10 p-8 space-y-6">
        {/* Points Display with Live Region */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="space-y-2"
        >
          <div className="flex items-center gap-4">
            <QuokkaIcon
              size="lg"
              variant="filled"
              animate={loading ? "none" : "pulse"}
              ariaLabel={`${totalPoints} Quokka Points earned`}
            />
            <div>
              <div className="text-6xl font-bold text-primary tabular-nums">
                {totalPoints.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground glass-text">
                Total Quokka Points
              </p>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
            <span className="text-sm glass-text">
              <span className="sr-only">Earned</span>
              <strong className="text-success">+{weeklyPoints}</strong> this week
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          {/* Stat items here with proper labels */}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Test Scenario:**
- Screen reader announces total points on page load
- When points update (e.g., after endorsement), aria-live region announces new total
- QuokkaIcon has descriptive aria-label
- Weekly trend uses sr-only for "Earned" prefix
- Focus indicator visible on any interactive elements

---

#### Fix 2: Animated Icon with Reduced Motion Support

**Priority:** High
**Current State:** Animation always runs
**Required Change:** Respect prefers-reduced-motion preference

**Implementation:**

```tsx
// In QuokkaPointsHero component
const prefersReducedMotion = useReducedMotion(); // Custom hook or CSS-based

<QuokkaIcon
  size="lg"
  variant="filled"
  animate={loading || prefersReducedMotion ? "none" : "pulse"}
  ariaLabel={`${totalPoints} Quokka Points earned`}
/>
```

**Custom Hook (if needed):**
```tsx
// lib/hooks/use-reduced-motion.ts
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
```

**Test Scenario:**
- Set OS to "Reduce motion" preference
- Reload page: QuokkaIcon does not animate
- Set OS to "No preference": Icon animates
- Animation does not cause vestibular issues

---

### 3. `components/points/milestones-timeline.tsx` (Milestone Progress)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/points/milestones-timeline.tsx`

---

#### Fix 1: Progress Bar with Descriptive Context

**Priority:** Critical
**Current State:** New component
**Required Change:** Add aria-describedby linking progress bar to milestone details

**Implementation:**

```tsx
export function MilestonesTimeline({
  milestones,
  totalPoints,
  currentMilestoneIndex,
}: MilestonesTimelineProps) {
  // Find next unachieved milestone
  const nextMilestone = milestones.find((m) => !m.achieved);
  const nextMilestoneIndex = nextMilestone
    ? milestones.indexOf(nextMilestone)
    : milestones.length;

  // Calculate progress percentage
  const prevMilestone = milestones[nextMilestoneIndex - 1];
  const prevThreshold = prevMilestone?.threshold || 0;
  const nextThreshold = nextMilestone?.threshold || totalPoints;
  const progressPercent = Math.round(
    ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100
  );

  return (
    <Card variant="glass" className="p-6">
      {/* Progress Bar with Full Accessibility */}
      {nextMilestone && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium glass-text" id="milestone-current">
              {prevMilestone?.label || "Getting Started"}
            </span>
            <span className="font-medium text-primary" id="milestone-next">
              {nextMilestone.label}
            </span>
          </div>

          <Progress
            value={progressPercent}
            className="h-3"
            aria-label={`Milestone progress: ${progressPercent}% complete`}
            aria-describedby="milestone-description"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-valuetext={`${progressPercent} percent to ${nextMilestone.label}`}
          />

          <p id="milestone-description" className="text-xs text-muted-foreground glass-text">
            {totalPoints.toLocaleString()} / {nextThreshold.toLocaleString()} points
            ({Math.max(0, nextThreshold - totalPoints).toLocaleString()} to go)
          </p>
        </div>
      )}

      {/* All Milestones List */}
      <ol className="space-y-4" aria-label="All milestones">
        {milestones.map((milestone, index) => {
          const isCurrent = index === nextMilestoneIndex - 1;
          const isNext = index === nextMilestoneIndex;
          const isAchieved = milestone.achieved;

          return (
            <li
              key={milestone.threshold}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border",
                isAchieved && "bg-success/5 border-success/20",
                isCurrent && "bg-primary/5 border-primary/20",
                isNext && "bg-accent/5 border-accent/20"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Milestone Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full shrink-0",
                  isAchieved && "bg-success text-white",
                  isCurrent && "bg-primary text-white",
                  isNext && "bg-accent text-white",
                  !isAchieved && !isCurrent && !isNext && "bg-muted/20 text-muted"
                )}
                aria-hidden="true"
              >
                {isAchieved ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Trophy className="h-6 w-6" />
                )}
              </div>

              {/* Milestone Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base glass-text">
                    {milestone.label}
                  </h3>
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Current
                    </Badge>
                  )}
                  {isNext && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Next
                    </Badge>
                  )}
                  {isAchieved && (
                    <span className="sr-only">Achieved</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground glass-text mt-1">
                  {milestone.threshold.toLocaleString()} points
                  {isAchieved && (
                    <span className="ml-2 text-success">✓ Unlocked</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
```

**Test Scenario:**
- Screen reader announces progress bar: "Milestone progress: 65% complete"
- Progress bar aria-describedby provides context: "350 / 500 points (150 to go)"
- Current milestone has aria-current="step"
- Achieved milestones announce "Achieved" via sr-only
- Keyboard focus highlights milestone card with visible outline

---

#### Fix 2: Celebration Announcement for Achieved Milestones

**Priority:** High
**Current State:** No announcement
**Required Change:** Add aria-live region to announce milestone achievements

**Implementation:**

```tsx
export function MilestonesTimeline({ milestones, totalPoints }: Props) {
  const [justAchieved, setJustAchieved] = React.useState<string | null>(null);

  // Detect newly achieved milestone (compare with previous render)
  React.useEffect(() => {
    const newlyAchieved = milestones.find(
      (m) => m.achieved && !m.previouslyAchieved // Flag added by parent
    );
    if (newlyAchieved) {
      setJustAchieved(newlyAchieved.label);
      setTimeout(() => setJustAchieved(null), 5000); // Clear after 5s
    }
  }, [milestones]);

  return (
    <>
      {/* Live region for milestone announcements */}
      <div role="status" aria-live="assertive" className="sr-only">
        {justAchieved && (
          <p>Congratulations! You've unlocked the {justAchieved} milestone!</p>
        )}
      </div>

      {/* Rest of component */}
    </>
  );
}
```

**Test Scenario:**
- When milestone achieved, screen reader announces: "Congratulations! You've unlocked the Active Learner milestone!"
- Announcement is assertive (interrupts current reading)
- Visual celebration (confetti, animation) paired with auditory announcement
- Announcement clears after 5 seconds

---

### 4. `components/points/point-sources-breakdown.tsx` (Points by Source)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/points/point-sources-breakdown.tsx`

---

#### Fix 1: Semantic Table or Description List

**Priority:** High
**Current State:** New component
**Required Change:** Use semantic HTML for tabular data

**Implementation Option 1 (Table):**

```tsx
export function PointSourcesBreakdown({ pointSources }: Props) {
  return (
    <Card variant="glass" className="p-6">
      <table className="w-full">
        <caption className="sr-only">
          Points breakdown by source
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="text-left py-3 px-4 font-semibold text-sm">
              Source
            </th>
            <th scope="col" className="text-right py-3 px-4 font-semibold text-sm">
              Count
            </th>
            <th scope="col" className="text-right py-3 px-4 font-semibold text-sm">
              Points Each
            </th>
            <th scope="col" className="text-right py-3 px-4 font-semibold text-sm">
              Total Points
            </th>
          </tr>
        </thead>
        <tbody>
          {pointSources.map((source) => {
            const Icon = source.icon;
            return (
              <tr key={source.id} className="border-b border-border last:border-0">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="glass-text">{source.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {source.count}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {source.pointsPerAction}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-primary">
                  {source.points}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="py-3 px-4 font-semibold" colSpan={3}>
              Total Points
            </td>
            <td className="py-3 px-4 text-right tabular-nums font-bold text-primary text-lg">
              {pointSources.reduce((sum, s) => sum + s.points, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
```

**Implementation Option 2 (Cards with ARIA):**

```tsx
export function PointSourcesBreakdown({ pointSources }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pointSources.map((source) => {
        const Icon = source.icon;
        return (
          <Card
            key={source.id}
            variant="glass"
            className="p-4"
            role="article"
            aria-labelledby={`source-${source.id}-heading`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3
                id={`source-${source.id}-heading`}
                className="font-semibold glass-text"
              >
                {source.label}
              </h3>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Count:</dt>
                <dd className="font-medium tabular-nums">{source.count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Points each:</dt>
                <dd className="font-medium tabular-nums">{source.pointsPerAction}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <dt className="font-semibold">Total:</dt>
                <dd className="font-bold text-primary text-lg tabular-nums">
                  {source.points}
                </dd>
              </div>
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
```

**Test Scenario (Table):**
- Screen reader announces: "Table with 5 rows and 4 columns"
- Caption is read: "Points breakdown by source"
- Column headers (scope="col") announced for each cell
- Tabular navigation works (Ctrl+Alt+Arrow in NVDA)

**Test Scenario (Cards):**
- Screen reader announces each card as "Article, Peer Endorsements"
- Description list semantics: "Count: 12, Points each: 5, Total: 60"
- Keyboard focus moves card-by-card
- Touch targets meet 44px minimum

---

#### Fix 2: Empty State with Actionable Guidance

**Priority:** Medium
**Current State:** No empty state
**Required Change:** Provide clear guidance when no points earned

**Implementation:**

```tsx
{pointSources.length === 0 && (
  <Card variant="glass" className="p-8 text-center">
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex justify-center">
        <QuokkaIcon size="lg" variant="outline" ariaLabel="No points yet" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Start Earning Points!</h3>
        <p className="text-muted-foreground glass-text">
          Ask questions, help peers, and get endorsed to earn Quokka Points.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="default" asChild className="min-h-[44px]">
          <Link href="/courses">
            Browse Courses
          </Link>
        </Button>
        <Button variant="outline" asChild className="min-h-[44px]">
          <Link href="/ask">
            Ask a Question
          </Link>
        </Button>
      </div>
    </div>
  </Card>
)}
```

**Test Scenario:**
- Screen reader announces heading "Start Earning Points!"
- Buttons have 44px touch targets
- Links indicate destination (course browsing, question form)
- Focus moves to first button

---

### 5. `components/points/points-activity-feed.tsx` (Activity Timeline)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/points/points-activity-feed.tsx`

---

#### Fix 1: Semantic Ordered List with Time Elements

**Priority:** High
**Current State:** New component
**Required Change:** Use semantic HTML for timeline

**Implementation:**

```tsx
export function PointsActivityFeed({ activities }: Props) {
  return (
    <Card variant="glass" className="p-6">
      <ol className="space-y-4" aria-label="Points activity timeline">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const isRecent = index === 0; // Most recent item

          return (
            <li
              key={activity.id}
              className={cn(
                "flex gap-4 p-4 rounded-lg border",
                isRecent && "bg-primary/5 border-primary/20"
              )}
            >
              {/* Timeline Icon */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0"
                aria-hidden="true"
              >
                <Icon className="h-5 w-5 text-primary" />
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium glass-text">
                      {activity.description}
                    </p>
                    <p className="text-sm text-muted-foreground glass-text">
                      {activity.courseName && (
                        <span>{activity.courseName} · </span>
                      )}
                      <span className="text-success font-semibold">
                        +{activity.pointsEarned} pts
                      </span>
                    </p>
                  </div>

                  {/* Timestamp */}
                  <time
                    dateTime={activity.timestamp}
                    className="text-xs text-muted-foreground glass-text shrink-0"
                  >
                    {formatRelativeTime(activity.timestamp)}
                  </time>
                </div>

                {/* Optional: Link to related content */}
                {activity.relatedThreadId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mt-2 h-auto py-1 px-2 text-xs"
                  >
                    <Link href={`/threads/${activity.relatedThreadId}`}>
                      View thread
                      <span className="sr-only">
                        {" "}for {activity.description}
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Load More Button (if pagination) */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="min-h-[44px]"
          >
            {isLoadingMore ? "Loading..." : "Load More Activity"}
          </Button>
        </div>
      )}
    </Card>
  );
}
```

**Test Scenario:**
- Screen reader announces: "Ordered list with 10 items"
- Each item announces description, course, points, and time
- Time element uses datetime attribute for machine-readable format
- "View thread" links include context via sr-only
- Icon is aria-hidden (redundant with text)

---

#### Fix 2: Empty State with Encouragement

**Priority:** Medium
**Current State:** No empty state
**Required Change:** Show encouraging message when no activity

**Implementation:**

```tsx
{activities.length === 0 && (
  <Card variant="glass" className="p-8 text-center">
    <div className="space-y-3 max-w-sm mx-auto">
      <div className="text-4xl opacity-50" aria-hidden="true">
        🎯
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No Activity Yet</h3>
        <p className="text-muted-foreground glass-text">
          Start engaging with your courses to see your point activity here.
        </p>
      </div>
    </div>
  </Card>
)}
```

**Test Scenario:**
- Screen reader reads heading "No Activity Yet"
- Emoji is aria-hidden (decorative)
- Encouragement message provides context

---

### 6. `components/ui/quokka-icon.tsx` (Icon Enhancement)

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/quokka-icon.tsx`

---

#### Fix 1: Contextual ARIA Labels

**Priority:** High
**Current State:** Generic aria-label "Quokka points"
**Required Change:** Accept custom aria-label per context

**Implementation:**

```tsx
// Already implemented, ensure it's used everywhere:
<QuokkaIcon
  size="lg"
  variant="filled"
  ariaLabel={`${totalPoints} Quokka Points earned`} // Context-specific
/>

// Not just:
<QuokkaIcon ariaLabel="Quokka points" /> // Too generic
```

**Test Scenario:**
- Navbar badge: "250 Quokka Points"
- Dashboard card: "250 total Quokka Points"
- Hero section: "250 Quokka Points earned"
- Each context provides specific meaning

---

### 7. Global Enhancements

**File Path:** Various

---

#### Fix 1: Touch Target Enforcement (Mobile)

**Priority:** Critical (WCAG 2.5.5)
**Current State:** Some buttons < 44px
**Required Change:** Ensure all interactive elements meet 44px minimum on mobile

**Implementation:**

```tsx
// All buttons on the page
<Button className="min-h-[44px] min-w-[44px] md:min-h-[40px]">
  Action
</Button>

// All links
<Link className="inline-flex items-center min-h-[44px] min-w-[44px] md:min-h-auto">
  Link
</Link>

// Icon buttons specifically
<Button size="icon" className="h-[44px] w-[44px] md:h-10 md:w-10">
  <Icon className="h-5 w-5" />
</Button>
```

**Test Scenario:**
- Mobile viewport (360px): All buttons measure at least 44x44px
- Tablet viewport (768px): Buttons can be smaller (40x40px)
- Desktop viewport (1024px+): Standard sizes apply
- Touch testing on real devices confirms comfortable tapping

---

#### Fix 2: Loading State Announcements

**Priority:** High (WCAG 4.1.3)
**Current State:** No loading announcements
**Required Change:** Announce loading and completion to screen readers

**Implementation:**

```tsx
export function QuokkaPointsPage() {
  const { data, isLoading } = useQuokkaPoints();

  return (
    <main id="points-main-content" tabIndex={-1} aria-busy={isLoading}>
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading && <p>Loading your Quokka Points...</p>}
        {!isLoading && data && <p>Points loaded successfully.</p>}
      </div>

      {/* Visual content */}
      {isLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-32 w-full bg-glass-medium rounded-xl" />
          <Skeleton className="h-48 w-full bg-glass-medium rounded-xl" />
        </div>
      ) : (
        <>{/* Actual content */}</>
      )}
    </main>
  );
}
```

**Test Scenario:**
- On load: Screen reader announces "Loading your Quokka Points..."
- After load: Screen reader announces "Points loaded successfully."
- aria-busy on main prevents interaction during load
- Skeleton loaders provide visual feedback

---

#### Fix 3: Error State Handling

**Priority:** High (WCAG 3.3.1)
**Current State:** No error handling yet
**Required Change:** Announce errors and provide recovery options

**Implementation:**

```tsx
export function QuokkaPointsPage() {
  const { data, isLoading, error } = useQuokkaPoints();

  if (error) {
    return (
      <main id="points-main-content" tabIndex={-1}>
        <Card variant="glass" className="p-8 text-center max-w-md mx-auto">
          <div role="alert" className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-danger" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Failed to Load Points
              </h2>
              <p className="text-muted-foreground glass-text">
                {error.message || "We couldn't load your Quokka Points. Please try again."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="default"
                onClick={() => window.location.reload()}
                className="min-h-[44px]"
              >
                Retry
              </Button>
              <Button
                variant="outline"
                asChild
                className="min-h-[44px]"
              >
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  // Rest of component
}
```

**Test Scenario:**
- Error state: Screen reader announces "Alert: Failed to Load Points"
- Error message is clear and actionable
- Retry button has 44px touch target
- Fallback navigation provided (Dashboard link)

---

## Testing Checklist

After implementation, verify ALL of the following:

### Keyboard Navigation
- [ ] Tab key moves focus through all interactive elements
- [ ] Shift+Tab moves focus backward
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes any modals/popovers (if present)
- [ ] Skip link appears on Tab and moves focus to main content
- [ ] No keyboard traps (can always navigate away)
- [ ] Focus order is logical (top-to-bottom, left-to-right)

### Screen Reader
- [ ] Page title announced on load
- [ ] Landmarks announced (main, section, aside)
- [ ] Heading hierarchy logical (h1 → h2, no skips)
- [ ] Point totals announced correctly
- [ ] Progress bars announce percentage and context
- [ ] Milestones list announces achieved/current status
- [ ] Activity timeline announces chronological order
- [ ] Icons are aria-hidden (not announced redundantly)
- [ ] Buttons have descriptive labels
- [ ] Links indicate destination
- [ ] Loading state announced
- [ ] Error state announced as alert
- [ ] Dynamic updates announced via aria-live

### Focus Indicators
- [ ] All interactive elements show visible focus indicator
- [ ] Focus indicator has 3:1 contrast against background
- [ ] Focus indicator is at least 2px thick
- [ ] Focus glow is visible on glass backgrounds
- [ ] No outline: none anywhere without custom focus style

### Color Contrast
- [ ] Body text: 4.5:1 minimum (large text 3:1)
- [ ] Muted text: 4.5:1 minimum
- [ ] UI components: 3:1 minimum
- [ ] Focus indicators: 3:1 minimum
- [ ] Success/warning/danger colors: 3:1 minimum
- [ ] Glass text has shadow for readability
- [ ] Dark mode meets same standards

### Touch Targets (Mobile)
- [ ] All buttons/links: 44x44px minimum at 360px viewport
- [ ] Spacing between targets: 8px minimum
- [ ] Icon buttons meet minimum size
- [ ] Progress bar thumb (if draggable) meets minimum

### Semantic HTML
- [ ] Main content uses `<main>` landmark
- [ ] Sections use `<section aria-labelledby>`
- [ ] Headings use h1, h2, h3 (no skips)
- [ ] Lists use ul/ol with proper li
- [ ] Tables use table, caption, thead, tbody, th, td
- [ ] Time elements use `<time datetime>`
- [ ] Buttons use `<button>` not `<div onclick>`
- [ ] Links use `<a href>` not `<span onclick>`

### ARIA Attributes
- [ ] aria-label on buttons without visible text
- [ ] aria-labelledby on sections referencing headings
- [ ] aria-describedby on progress bars
- [ ] aria-current on current milestone
- [ ] aria-live="polite" for status updates
- [ ] aria-live="assertive" for milestone achievements
- [ ] aria-hidden on decorative icons
- [ ] aria-busy during loading states
- [ ] role="status" for loading announcements
- [ ] role="alert" for errors

### Animations
- [ ] Respect prefers-reduced-motion
- [ ] Animations can be disabled via OS setting
- [ ] No autoplay video/audio
- [ ] No flashing content (violates photosensitivity)

### Responsive Design
- [ ] Content reflows at 320px without horizontal scroll
- [ ] All functionality available at all viewport sizes
- [ ] Touch targets appropriate for mobile
- [ ] Text scales without breaking layout
- [ ] Images have max-width to prevent overflow

---

## Known Limitations

1. **Sparkline Accessibility**: SVG sparklines provide visual trend but lack detailed data table alternative. aria-label summarizes trend, but screen reader users don't get granular 7-day breakdown. Consider adding hidden data table or descriptive summary.

2. **Confetti Animation**: Milestone achievement celebration (if implemented) uses visual confetti. Screen reader users only get aria-live announcement. Consider pairing with sound effect (with user control).

3. **Real-Time Updates**: If points update in real-time (e.g., via WebSocket), aria-live="polite" may not interrupt current reading. Balance between announcement frequency and screen reader experience.

4. **Mobile Performance**: Glassmorphism (backdrop-filter) reduced on mobile for performance. Ensure reduced blur doesn't impact text readability for low-vision users.

---

## Post-Implementation Validation

After all fixes applied, run:

1. **Automated Testing**
   - axe DevTools browser extension
   - Lighthouse accessibility audit (target 95+)
   - WAVE browser extension

2. **Manual Keyboard Testing**
   - Unplug mouse, navigate entire page
   - Verify Tab order, skip link, focus indicators
   - Test on Chrome, Firefox, Safari

3. **Screen Reader Testing**
   - NVDA (Windows, free): Forms mode, Browse mode
   - JAWS (Windows, trial): Virtual cursor, navigation
   - VoiceOver (macOS, built-in): Rotor, element navigation

4. **Color Contrast**
   - Use Colour Contrast Analyser (free)
   - Check text, UI components, focus indicators
   - Test in light and dark modes

5. **Mobile Testing**
   - Real devices: iPhone, Android phone
   - Touch target sizes, spacing
   - Screen reader: VoiceOver (iOS), TalkBack (Android)

6. **Reduced Motion**
   - Enable "Reduce motion" in OS settings
   - Verify animations disabled/reduced
   - Test on macOS, Windows, iOS, Android

---

**End of Implementation Plan**

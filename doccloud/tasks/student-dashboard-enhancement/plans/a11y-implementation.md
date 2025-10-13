# Accessibility Implementation Plan: Student Dashboard Widgets

**Component:** Enhanced Student Dashboard
**Target:** WCAG 2.2 Level AA
**Priority:** High (Blocking release)
**Date:** 2025-10-12

---

## Priority Legend

- **Critical:** Blocks all users with disabilities (keyboard-only, screen reader users)
- **High:** Significantly impairs accessibility, limited workarounds
- **Medium:** Reduces experience quality, but alternative methods exist

---

## Component 1: StudentRecommendations Widget

### Component Overview

Displays 3-5 personalized thread recommendations based on recent activity and course engagement. Each recommendation is a clickable card showing thread title, relevance score, engagement metrics, and course context.

### Semantic HTML Structure

```tsx
<section aria-labelledby="recommendations-heading">
  <h2 id="recommendations-heading">Recommended for You</h2>

  <div role="list" aria-label="Recommended threads">
    <article role="listitem">
      <Link href={`/threads/${thread.id}`}>
        {/* Card content */}
      </Link>
    </article>
  </div>
</section>
```

**Rationale:**
- `<section>` with `aria-labelledby` establishes landmark
- `role="list"` + `role="listitem"` provides structure for screen readers
- `<article>` semantically groups each recommendation
- Entire card wrapped in `<Link>` for keyboard accessibility

### ARIA Attributes Required

#### Container Level:
```tsx
<section aria-labelledby="recommendations-heading">
  <h2 id="recommendations-heading">Recommended for You</h2>
</section>
```

#### List Structure:
```tsx
<div
  role="list"
  aria-label="Recommended threads"
  aria-busy={isLoading}
>
  {/* List items */}
</div>
```

#### Individual Recommendation Card:
```tsx
<article
  role="listitem"
  aria-labelledby={`rec-title-${thread.id}`}
>
  <Link href={`/threads/${thread.id}`}>
    <h3 id={`rec-title-${thread.id}`} className="text-lg font-semibold">
      {thread.title}
    </h3>

    {/* Relevance score with semantic meaning */}
    <div aria-label={`${relevanceScore}% match relevance`}>
      <span aria-hidden="true">{relevanceScore}%</span>
      <span className="sr-only">{relevanceScore}% match relevance</span>
    </div>

    {/* Engagement metrics */}
    <div className="flex items-center gap-4 text-sm">
      <span>
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Views:</span>
        {views}
      </span>
      <span>
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Replies:</span>
        {replies}
      </span>
    </div>

    {/* Course badge */}
    <Badge aria-label={`Course: ${courseCode}`}>
      {courseCode}
    </Badge>
  </Link>
</article>
```

**Key ARIA Decisions:**
- `aria-busy={isLoading}` announces loading state to screen readers
- Icons marked `aria-hidden="true"` with text labels provided
- Relevance score gets descriptive label beyond just percentage
- Course badge includes "Course:" prefix for context

### Keyboard Navigation

**Tab Order:**
1. Tab to first recommendation link (entire card)
2. Tab to second recommendation link
3. Tab to third recommendation link
4. Continue to next widget

**Keyboard Actions:**
- **Tab:** Navigate between recommendation cards
- **Shift+Tab:** Navigate backward
- **Enter:** Activate link, navigate to thread detail
- **Space:** (No action, Enter is sufficient for links)

**Focus Management:**
- Each recommendation card link receives focus
- Focus indicator visible on card wrapper
- No focus trap (can tab out to next widget)

**Implementation Notes:**
- Entire card is single focusable link (not multiple interactive elements)
- Avoid nested interactive elements (buttons inside links)
- If "View Thread" button needed, make it the only focusable element

### Screen Reader Announcements

**On Page Load:**
```
"Recommended for You, heading level 2"
"List, 5 items"
"Article, link, Understanding Binary Search Trees, 87% match relevance, Views: 42, Replies: 8, Course: CS101"
```

**On Focus (Each Card):**
```
"Link, Understanding Binary Search Trees, 87% match relevance, Views: 42, Replies: 8, Course: CS101"
```

**Loading State:**
```
"Recommended for You, heading level 2"
"Loading, busy"
```

**Empty State:**
```
"Recommended for You, heading level 2"
"No recommendations available. Start by browsing threads in your courses."
```

### Color Contrast Verification

**Text Elements:**
- Thread title: `text-foreground` (#2A2721) on `bg-card` (#FFFFFF) → **13.2:1 ✅ Pass**
- Relevance score: `text-primary` (#8A6B3D) on `bg-card` (#FFFFFF) → **4.6:1 ✅ Pass**
- Metadata (views, replies): `text-muted-foreground` (#625C52) on `bg-card` (#FFFFFF) → **5.8:1 ✅ Pass**
- Badge text: Check badge variant (likely outline)

**UI Components:**
- Card border: `border` on `bg-card` → **3:1+ ✅ Pass**
- Focus indicator: Blue ring (defined in globals.css) → **3:1+ ✅ Pass**

**Action Required:**
- Verify badge text contrast if colored background used
- Test focus visibility on glass variant cards

### Alternative Content

**Icons:**
- Eye icon: Accompanied by "Views:" screen reader text
- MessageSquare icon: Accompanied by "Replies:" screen reader text
- All icons marked `aria-hidden="true"`

**Relevance Score:**
- Visual: "87%"
- Screen Reader: "87% match relevance"

**No Charts/Visualizations in this component.**

### Loading and Empty States

**Loading State:**
```tsx
{isLoading ? (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading recommendations...</span>
    <Skeleton className="h-32 bg-glass-medium rounded-lg" />
    <Skeleton className="h-32 bg-glass-medium rounded-lg" />
    <Skeleton className="h-32 bg-glass-medium rounded-lg" />
  </div>
) : (
  /* Recommendations content */
)}
```

**Empty State:**
```tsx
{recommendations.length === 0 && (
  <Card variant="glass" className="p-6 text-center">
    <div className="space-y-3">
      <div className="text-4xl opacity-50" aria-hidden="true">🔍</div>
      <div>
        <h3 className="text-lg font-semibold">No Recommendations Yet</h3>
        <p className="text-muted-foreground">
          Start by browsing threads in your courses to get personalized suggestions.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/courses">Browse Courses</Link>
      </Button>
    </div>
  </Card>
)}
```

### Testing Checklist

- [ ] Keyboard: Tab through all recommendation links
- [ ] Keyboard: Enter activates link and navigates to thread
- [ ] Screen Reader: Announces "List, X items"
- [ ] Screen Reader: Each card announces title, relevance, metrics, course
- [ ] Screen Reader: Loading state announced with "busy"
- [ ] Screen Reader: Empty state provides actionable guidance
- [ ] Focus: Focus indicator visible on all cards
- [ ] Focus: Focus order follows visual layout (top to bottom)
- [ ] Contrast: All text meets 4.5:1 ratio
- [ ] Contrast: Focus indicator meets 3:1 ratio
- [ ] Touch: Cards large enough to tap (minimum 44px height)

---

## Component 2: StudyStreakCard

### Component Overview

Displays current study streak (consecutive days), progress toward weekly goal, achievement level, and motivational messaging. Includes visual progress bar and achievement badge.

### Semantic HTML Structure

```tsx
<Card variant="glass-hover" className="p-6">
  <article aria-labelledby="streak-heading">
    <header>
      <h3 id="streak-heading" className="text-lg font-semibold">Study Streak</h3>
    </header>

    <div className="space-y-4">
      {/* Streak number */}
      <div>
        <p className="text-4xl font-bold">
          <span aria-label={`${streakDays} day streak`}>{streakDays}</span>
          <span className="text-lg text-muted-foreground ml-2">days</span>
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <label id="progress-label">Weekly Progress</label>
        <div
          role="progressbar"
          aria-labelledby="progress-label"
          aria-valuenow={currentDays}
          aria-valuemin={0}
          aria-valuemax={targetDays}
          aria-valuetext={`${currentDays} out of ${targetDays} days this week`}
        >
          {/* Visual progress bar */}
        </div>
        <p className="text-sm text-muted-foreground">{currentDays} / {targetDays} days this week</p>
      </div>

      {/* Achievement badge */}
      <div aria-label={`Achievement: ${achievementLevel} streak`}>
        <Badge variant={achievementVariant}>
          <Trophy className="h-4 w-4 mr-1" aria-hidden="true" />
          {achievementLevel} Streak
        </Badge>
      </div>

      {/* Motivational message */}
      <p className="text-sm text-muted-foreground">
        {motivationalMessage}
      </p>
    </div>
  </article>
</Card>
```

**Rationale:**
- `<article>` groups streak as self-contained unit
- `role="progressbar"` with full ARIA attributes for accessibility
- Progress bar has both visual and text representations
- Achievement badge includes descriptive label

### ARIA Attributes Required

#### Streak Number:
```tsx
<p className="text-4xl font-bold">
  <span aria-label={`${streakDays} day streak`}>{streakDays}</span>
  <span className="text-lg text-muted-foreground ml-2" aria-hidden="true">days</span>
</p>
```

**Rationale:** Screen reader announces "5 day streak" instead of "5 days"

#### Progress Bar:
```tsx
<div>
  <label id="progress-label" className="text-sm font-medium">Weekly Progress</label>
  <div
    role="progressbar"
    aria-labelledby="progress-label"
    aria-valuenow={5}
    aria-valuemin={0}
    aria-valuemax={7}
    aria-valuetext="5 out of 7 days this week"
    className="relative w-full h-2 rounded-full bg-muted/20"
  >
    <div
      className="absolute top-0 left-0 h-full bg-success rounded-full transition-all duration-300"
      style={{ width: `${(5 / 7) * 100}%` }}
      aria-hidden="true"
    />
  </div>
  <p className="text-sm text-muted-foreground mt-1">5 / 7 days this week</p>
</div>
```

**Key Decisions:**
- `role="progressbar"` makes it semantically a progress indicator
- `aria-valuenow/min/max` provide numeric values
- `aria-valuetext` provides human-readable context
- Visual bar marked `aria-hidden="true"` (announced via progressbar role)
- Text fallback visible to all users

#### Dynamic Updates (ARIA Live):
```tsx
<div aria-live="polite" aria-atomic="true">
  {streakUpdated && (
    <div className="sr-only">
      Study streak increased to {streakDays} days
    </div>
  )}
</div>
```

**Implementation Notes:**
- When streak increments, announce change via live region
- Use `aria-live="polite"` (not "assertive" - not urgent)
- `aria-atomic="true"` announces entire message, not just changed part

#### Achievement Badge:
```tsx
<div aria-label={`Achievement: ${achievementLevel} streak`}>
  <Badge variant="success">
    <Trophy className="h-4 w-4 mr-1" aria-hidden="true" />
    <span>{achievementLevel} Streak</span>
  </Badge>
</div>
```

### Keyboard Navigation

**Tab Order:**
1. (Streak card is not directly focusable - informational display)
2. If CTA button present ("View History"), it receives focus

**Keyboard Actions:**
- No keyboard interaction required (informational display)
- If history link added, standard link navigation applies

**Focus Management:**
- Card itself is not focusable (static content)
- Only interactive elements (links/buttons) receive focus

### Screen Reader Announcements

**On Page Load:**
```
"Study Streak, heading level 3"
"5 day streak"
"Weekly Progress, progressbar, 5 out of 7 days this week, 71%"
"Achievement: Bronze streak"
"Keep it up! 2 more days to reach Silver."
```

**On Streak Update (Live Region):**
```
"Study streak increased to 6 days"
```

**Progress Bar Announcement:**
```
"Weekly Progress, progressbar, 5 out of 7 days this week, 71%"
```

### Color Contrast Verification

**Text Elements:**
- Streak number (large): `text-foreground` (#2A2721) on `bg-card` (#FFFFFF) → **13.2:1 ✅ Pass** (large text 3:1 minimum)
- "days" label: `text-muted-foreground` (#625C52) on `bg-card` (#FFFFFF) → **5.8:1 ✅ Pass**
- Progress label: `text-foreground` on `bg-card` → **13.2:1 ✅ Pass**
- Progress text: `text-muted-foreground` on `bg-card` → **5.8:1 ✅ Pass**

**UI Components:**
- Progress bar background: `bg-muted/20` on `bg-card` → **3:1+ ✅ Pass** (verify)
- Progress bar fill: `bg-success` (#2E7D32) → **6.2:1 ✅ Pass**
- Achievement badge: Depends on variant (likely `success` → green background, white text → verify contrast)

**Action Required:**
- Verify badge text contrast: white on green background should pass
- Verify progress bar track (muted/20) meets 3:1 UI component contrast

### Alternative Content

**Progress Bar:**
- Visual: Animated green bar filling 71%
- Text: "5 / 7 days this week" (visible to all)
- Screen Reader: "progressbar, 5 out of 7 days this week, 71%"

**Achievement Badge:**
- Visual: Trophy icon + "Bronze Streak" text
- Screen Reader: "Achievement: Bronze streak" (icon hidden)

**No Charts/Sparklines in this component.**

### Loading and Empty States

**Loading State:**
```tsx
{isLoading ? (
  <Card variant="glass" className="p-6">
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading streak data...</span>
      <Skeleton className="h-16 w-32 bg-glass-medium" />
      <Skeleton className="h-4 w-full bg-glass-medium mt-4" />
      <Skeleton className="h-6 w-24 bg-glass-medium mt-2" />
    </div>
  </Card>
) : (
  /* Streak content */
)}
```

**Empty/Zero State:**
```tsx
{streakDays === 0 && (
  <Card variant="glass" className="p-6 text-center">
    <div className="space-y-3">
      <div className="text-4xl opacity-50" aria-hidden="true">🎯</div>
      <div>
        <h3 className="text-lg font-semibold">Start Your Streak!</h3>
        <p className="text-muted-foreground">
          Engage with your courses daily to build your study streak.
        </p>
      </div>
      <Button asChild variant="default">
        <Link href="/courses">Browse Courses</Link>
      </Button>
    </div>
  </Card>
)}
```

### Testing Checklist

- [ ] Screen Reader: Announces streak number with "day streak" label
- [ ] Screen Reader: Progress bar announced with valuenow, valuemin, valuemax
- [ ] Screen Reader: Progress bar announces "X out of Y days this week, Z%"
- [ ] Screen Reader: Achievement badge announced correctly
- [ ] Screen Reader: Motivational message read aloud
- [ ] ARIA Live: Streak increment announced when updated
- [ ] Contrast: All text meets 4.5:1 (3:1 for large text)
- [ ] Contrast: Progress bar meets 3:1 UI component contrast
- [ ] Contrast: Badge text on colored background meets 4.5:1
- [ ] Reduced Motion: Progress bar animation disabled if preference set
- [ ] Visual: Progress bar accurately reflects percentage

---

## Component 3: QuickActionsPanel

### Component Overview

Grid of 4-6 action buttons (Ask Question, Browse Threads, View Saved, My Courses, etc.) with optional notification badges. Provides quick navigation shortcuts to key features.

### Semantic HTML Structure

```tsx
<section aria-labelledby="quick-actions-heading">
  <h2 id="quick-actions-heading" className="text-2xl font-semibold mb-4">Quick Actions</h2>

  <div
    role="group"
    aria-labelledby="quick-actions-heading"
    className="grid grid-cols-2 md:grid-cols-3 gap-4"
  >
    <Button asChild variant="glass-accent" className="h-24">
      <Link href="/ask">
        <div className="flex flex-col items-center gap-2">
          <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
          <span>Ask a Question</span>
          {notificationCount > 0 && (
            <Badge variant="destructive" aria-label={`${notificationCount} new notifications`}>
              {notificationCount}
            </Badge>
          )}
        </div>
      </Link>
    </Button>

    {/* Repeat for other actions */}
  </div>
</section>
```

**Rationale:**
- `role="group"` establishes button grid as related controls
- Each action is a `<Link>` styled as `<Button>` for accessibility
- Notification badges include descriptive ARIA labels

### ARIA Attributes Required

#### Container:
```tsx
<div
  role="group"
  aria-labelledby="quick-actions-heading"
  className="grid grid-cols-2 md:grid-cols-3 gap-4"
>
```

**Rationale:** Groups related buttons for screen reader navigation

#### Individual Action Button:
```tsx
<Button asChild variant="glass-accent" className="h-24" size="lg">
  <Link href="/ask">
    <div className="flex flex-col items-center gap-2">
      <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
      <span>Ask a Question</span>
    </div>
  </Link>
</Button>
```

**With Notification Badge:**
```tsx
<Button asChild variant="glass-accent" className="h-24">
  <Link href="/ask" aria-label="Ask a Question, 3 new notifications">
    <div className="flex flex-col items-center gap-2">
      <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
      <span aria-hidden="true">Ask a Question</span>
      <Badge
        variant="destructive"
        className="absolute top-2 right-2"
        aria-hidden="true"
      >
        3
      </Badge>
      <span className="sr-only">3 new notifications</span>
    </div>
  </Link>
</Button>
```

**Key Decisions:**
- Icon marked `aria-hidden="true"`
- Badge count included in link's `aria-label`
- Badge itself marked `aria-hidden="true"` to avoid double announcement
- Screen reader text provides full context

#### Alternative Pattern (Without aria-label on link):
```tsx
<Button asChild>
  <Link href="/ask">
    <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
    <span>Ask a Question</span>
    {notificationCount > 0 && (
      <>
        <Badge variant="destructive" aria-hidden="true">{notificationCount}</Badge>
        <span className="sr-only">, {notificationCount} new notifications</span>
      </>
    )}
  </Link>
</Button>
```

**Recommendation:** Use first pattern (aria-label on link) for cleaner announcement.

### Keyboard Navigation

**Tab Order:**
1. Tab to first action button (e.g., "Ask a Question")
2. Tab to second action button (e.g., "Browse Threads")
3. Tab to third action button (e.g., "View Saved")
4. Tab to fourth action button (e.g., "My Courses")
5. Continue to next widget

**Keyboard Actions:**
- **Tab:** Navigate between action buttons
- **Shift+Tab:** Navigate backward
- **Enter:** Activate link, navigate to destination
- **Space:** Activate link (standard link behavior)

**Optional Enhancement (Not Required):**
- **Arrow Keys:** Navigate between buttons in grid (grid navigation pattern)
- **Home/End:** Jump to first/last button

**Focus Management:**
- Each button receives focus independently
- Focus indicator visible on button wrapper
- Grid layout doesn't trap focus

### Screen Reader Announcements

**On Page Load:**
```
"Quick Actions, heading level 2"
"Group, 6 buttons"
"Link, button, Ask a Question, 3 new notifications"
"Link, button, Browse Threads"
"Link, button, View Saved"
```

**On Focus (Each Button):**
```
"Link, button, Ask a Question, 3 new notifications"
```

**Without Notification Badge:**
```
"Link, button, Browse Threads"
```

### Color Contrast Verification

**Button Text:**
- Button label: Depends on variant (likely `glass-accent` → white text on blue background)
- Verify: White (#FFFFFF) on `--accent` (#2D6CDF) → **4.5:1+ ✅ Pass** (likely passes)

**Notification Badge:**
- Badge text: White on red background (`destructive` variant)
- Verify: White (#FFFFFF) on `--danger` (#D92D20) → **4.5:1+ ✅ Pass**

**UI Components:**
- Button border: Verify contrast against card background
- Focus indicator: Blue ring (defined in globals.css) → **3:1+ ✅ Pass**

**Action Required:**
- Verify button text contrast on all variants (glass-accent, glass-primary, outline)
- Test focus visibility on all button variants

### Alternative Content

**Icons:**
- All icons marked `aria-hidden="true"`
- Button labels provide context

**Notification Badges:**
- Visual: Red badge with number
- Screen Reader: ", X new notifications" appended to button label

**No Charts/Visualizations in this component.**

### Loading and Empty States

**Loading State:**
```tsx
{isLoading ? (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading quick actions...</span>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-24 bg-glass-medium rounded-lg" />
      ))}
    </div>
  </div>
) : (
  /* Quick actions content */
)}
```

**No Empty State** (Quick actions always present)

### Touch Target Size

**Button Dimensions:**
```tsx
className="h-24"  // 96px height ✅ Exceeds 44px minimum
```

**Grid Spacing:**
```tsx
className="grid grid-cols-2 md:grid-cols-3 gap-4"  // 16px gap ✅ Adequate
```

**Recommendation:** Maintain `h-24` (96px) for excellent touch accessibility

### Testing Checklist

- [ ] Keyboard: Tab through all action buttons
- [ ] Keyboard: Enter/Space activates link
- [ ] Screen Reader: Announces "Group, X buttons"
- [ ] Screen Reader: Each button announces label + notification count (if present)
- [ ] Screen Reader: Icons not announced (aria-hidden)
- [ ] Focus: Focus indicator visible on all buttons
- [ ] Focus: Focus order follows visual layout (left-to-right, top-to-bottom)
- [ ] Contrast: Button text meets 4.5:1 ratio on all variants
- [ ] Contrast: Badge text on red background meets 4.5:1
- [ ] Contrast: Focus indicator meets 3:1 ratio
- [ ] Touch: Buttons at least 44x44px (96px height ✅)
- [ ] Touch: Adequate spacing between buttons (16px gap ✅)

---

## Component 4: UpcomingDeadlines Timeline

### Component Overview

Chronological list of upcoming deadlines (assignments, exams, threads requiring response) with time remaining, course context, and visual indicators for overdue items. Similar structure to TimelineActivity component.

### Semantic HTML Structure

```tsx
<section aria-labelledby="deadlines-heading">
  <h2 id="deadlines-heading" className="text-2xl font-semibold mb-4">Upcoming Deadlines</h2>

  <ol className="relative space-y-4" aria-label="Upcoming deadlines timeline">
    <li className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="relative flex flex-col items-center shrink-0">
        <div className="size-4 rounded-full bg-warning" aria-hidden="true" />
        <div className="w-px flex-1 bg-border absolute top-3" aria-hidden="true" />
      </div>

      {/* Deadline card */}
      <div className="flex-1 pb-4">
        <Link href={`/courses/${courseId}/assignments/${assignmentId}`}>
          <Card variant="glass-hover">
            <CardContent className="p-3">
              <article className="space-y-2">
                {/* Title + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium">{title}</h3>
                  {isOverdue && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="course-code">{courseCode}</span>
                  <span aria-hidden="true">•</span>
                  <time
                    dateTime={dueDate}
                    aria-label={formatFullDateTime(dueDate)}
                  >
                    Due {formatRelativeDate(dueDate)}
                  </time>
                </div>

                {/* Time remaining */}
                <div className="text-xs text-subtle">
                  <Clock className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  <span className="sr-only">Time remaining:</span>
                  {timeRemaining}
                </div>
              </article>
            </CardContent>
          </Card>
        </Link>
      </div>
    </li>
  </ol>
</section>
```

**Rationale:**
- `<ol>` for chronological timeline (ordered list)
- `<time>` with `dateTime` attribute for machine-readable dates
- Overdue badge provides non-color indicator (text + icon)

### ARIA Attributes Required

#### Timeline List:
```tsx
<ol className="relative space-y-4" aria-label="Upcoming deadlines timeline">
```

#### Individual Deadline Item:
```tsx
<li className="relative flex gap-4">
  {/* Timeline dot (decorative) */}
  <div className="size-4 rounded-full bg-warning" aria-hidden="true" />

  {/* Deadline card */}
  <article>
    <h3>{title}</h3>

    {/* Overdue badge */}
    {isOverdue && (
      <Badge variant="destructive" aria-label="Overdue deadline">
        <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
        Overdue
      </Badge>
    )}

    {/* Date with dual format */}
    <time
      dateTime="2025-10-15T23:59:00Z"
      aria-label="October 15, 2025 at 11:59 PM"
    >
      Due in 3 days
    </time>

    {/* Time remaining */}
    <div>
      <Clock className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">Time remaining:</span>
      2 days, 5 hours
    </div>
  </article>
</li>
```

**Key Decisions:**
- Timeline dots marked `aria-hidden="true"` (decorative, color not sole indicator)
- Overdue status conveyed via badge text + icon (not just color)
- Time element provides full date to screen readers, abbreviated to sighted users
- Clock icon hidden, text label provides context

### Keyboard Navigation

**Tab Order:**
1. Tab to first deadline link
2. Tab to second deadline link
3. Tab to third deadline link
4. Continue to next widget

**Keyboard Actions:**
- **Tab:** Navigate between deadline links
- **Shift+Tab:** Navigate backward
- **Enter:** Activate link, navigate to assignment/thread detail
- **Space:** (No action, Enter is sufficient for links)

**Focus Management:**
- Each deadline card link receives focus
- Focus indicator visible on card wrapper
- No focus trap

### Screen Reader Announcements

**On Page Load:**
```
"Upcoming Deadlines, heading level 2"
"List, 5 items"
"Link, article, Problem Set 3: Binary Search Trees, Overdue deadline, Course: CS101, Due October 10, 2025 at 11:59 PM, Time remaining: 2 days overdue"
"Link, article, Midterm Exam Preparation, Course: CS101, Due October 15, 2025 at 11:59 PM, Time remaining: 3 days, 5 hours"
```

**On Focus (Each Deadline):**
```
"Link, Problem Set 3: Binary Search Trees, Overdue deadline, Course: CS101, Due October 10, 2025 at 11:59 PM, Time remaining: 2 days overdue"
```

**Empty State:**
```
"Upcoming Deadlines, heading level 2"
"No upcoming deadlines. Great job staying on top of your work!"
```

### Color Contrast Verification

**Text Elements:**
- Deadline title: `text-foreground` (#2A2721) on `bg-card` (#FFFFFF) → **13.2:1 ✅ Pass**
- Course code: `text-muted-foreground` (#625C52) on `bg-card` (#FFFFFF) → **5.8:1 ✅ Pass**
- Time metadata: `text-subtle` on `bg-card` → **Verify contrast** (QDS says darkened for AA)

**Timeline Dots (Not critical since decorative):**
- Warning dot: Orange on white background → **Visual only, not sole indicator**
- Success dot: Green on white background → **Visual only, not sole indicator**

**Overdue Badge:**
- Badge text: White on red (`destructive` variant) → **4.5:1+ ✅ Pass**
- Badge also includes "Overdue" text, not just color

**Action Required:**
- Verify `text-subtle` contrast ratio (should be 4.5:1+ per QDS)
- Ensure color is not sole indicator of deadline status (badge text provides semantic meaning)

### Alternative Content

**Timeline Dots:**
- Visual: Colored dots (orange, green, red)
- Non-Color Indicator: Badge text ("Overdue", "Due Soon")
- Marked `aria-hidden="true"` (decorative)

**Time Remaining:**
- Visual: Clock icon + "3 days, 5 hours"
- Screen Reader: "Time remaining: 3 days, 5 hours"

**Dates:**
- Visual: "Due in 3 days"
- Screen Reader: "October 15, 2025 at 11:59 PM"

**No Charts/Visualizations in this component.**

### Loading and Empty States

**Loading State:**
```tsx
{isLoading ? (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading deadlines...</span>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="size-4 rounded-full bg-glass-medium shrink-0" />
          <Skeleton className="h-24 flex-1 bg-glass-medium rounded-lg" />
        </div>
      ))}
    </div>
  </div>
) : (
  /* Deadlines content */
)}
```

**Empty State:**
```tsx
{deadlines.length === 0 && (
  <Card variant="glass" className="p-6 text-center">
    <div className="space-y-3">
      <div className="text-4xl opacity-50" aria-hidden="true">✅</div>
      <div>
        <h3 className="text-lg font-semibold">All Caught Up!</h3>
        <p className="text-muted-foreground">
          No upcoming deadlines. Great job staying on top of your work!
        </p>
      </div>
    </div>
  </Card>
)}
```

### Testing Checklist

- [ ] Keyboard: Tab through all deadline links
- [ ] Keyboard: Enter activates link and navigates to detail
- [ ] Screen Reader: Announces "List, X items"
- [ ] Screen Reader: Each deadline announces title, status, course, date, time remaining
- [ ] Screen Reader: Overdue items announced with "Overdue deadline"
- [ ] Screen Reader: Full date announced (not just relative time)
- [ ] Screen Reader: Loading state announced with "busy"
- [ ] Screen Reader: Empty state provides positive message
- [ ] Focus: Focus indicator visible on all cards
- [ ] Focus: Focus order follows chronological order
- [ ] Contrast: All text meets 4.5:1 ratio
- [ ] Contrast: Overdue badge text meets 4.5:1
- [ ] Contrast: Focus indicator meets 3:1 ratio
- [ ] Color: Status not conveyed by color alone (badge text provides semantic meaning)
- [ ] Touch: Cards large enough to tap (minimum 44px height)

---

## Component 5: Enhanced StatCard with Sparklines

### Component Overview

Existing StatCard component enhanced with sparkline charts showing 7-day trend data, interactive tooltips, and comparison context. Displays key metrics (Questions Asked, Posts Made, etc.) with visual trend indicators.

### Semantic HTML Structure

```tsx
<Card variant="glass-panel" className="p-4">
  <article aria-labelledby={`stat-${id}-label`}>
    {/* Header: Label + Icon */}
    <div className="flex items-center justify-between mb-2">
      <h3 id={`stat-${id}-label`} className="text-sm font-medium">{label}</h3>
      {icon && (
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" aria-hidden="true" />
        </div>
      )}
    </div>

    {/* Value + Trend */}
    <div className="flex items-baseline gap-2 mb-3">
      <p className="text-3xl font-bold">{value}</p>
      {trend && (
        <div className={cn("flex items-center gap-1", getTrendColor(trend.direction))}>
          {getTrendIcon(trend.direction)}
          <span className="text-xs font-semibold">{trend.label}</span>
          <span className="sr-only">
            {trend.direction === 'up' ? 'increased' : trend.direction === 'down' ? 'decreased' : 'unchanged'} by {trend.label}
          </span>
        </div>
      )}
    </div>

    {/* Sparkline Chart */}
    {sparklineData && (
      <div className="mb-3">
        <p className="sr-only">
          Weekly trend: {sparklineData.map((v, i) => `Day ${i + 1}: ${v}`).join(', ')}
        </p>
        <svg
          width="100%"
          height="32"
          aria-hidden="true"
          role="img"
          aria-label={`Sparkline chart showing ${label} over 7 days`}
          className="text-primary"
        >
          {/* SVG sparkline path */}
        </svg>
      </div>
    )}

    {/* Optional CTA Button */}
    {cta && (
      <Button
        variant="ghost"
        size="sm"
        onClick={cta.onClick}
        className="w-full"
      >
        {cta.label}
        {cta.icon && <cta.icon className="size-4 ml-2" aria-hidden="true" />}
      </Button>
    )}
  </article>
</Card>
```

**Rationale:**
- `<article>` groups stat as self-contained unit
- Sparkline SVG includes text alternative for screen readers
- Trend indicator includes both icon and text
- Screen reader announces trend direction semantically

### ARIA Attributes Required

#### Stat Card Container:
```tsx
<article aria-labelledby={`stat-${id}-label`}>
  <h3 id={`stat-${id}-label`}>{label}</h3>
</article>
```

#### Trend Indicator:
```tsx
<div className="flex items-center gap-1">
  <TrendingUp className="size-3" aria-hidden="true" />
  <span className="text-xs" aria-hidden="true">+3 this week</span>
  <span className="sr-only">
    increased by 3 this week
  </span>
</div>
```

**Rationale:**
- Visual: Icon + "+3 this week"
- Screen Reader: "increased by 3 this week" (more natural language)

#### Sparkline Chart:
```tsx
{/* Option 1: Text alternative (preferred) */}
<div>
  <p className="sr-only">
    Weekly activity: {sparklineData.map((v, i) => `Day ${i + 1}: ${v}`).join(', ')}
  </p>
  <svg aria-hidden="true" width="100%" height="32">
    {/* Sparkline visualization */}
  </svg>
</div>

{/* Option 2: SVG with role="img" and aria-label */}
<svg
  role="img"
  aria-label="Sparkline chart showing Questions Asked over past 7 days: Day 1: 8, Day 2: 9, Day 3: 10, Day 4: 11, Day 5: 12, Day 6: 13, Day 7: 14"
  width="100%"
  height="32"
>
  {/* Sparkline visualization */}
</svg>
```

**Recommendation:** Use Option 1 (separate sr-only text + aria-hidden SVG) for cleaner implementation.

#### Interactive Tooltip (if added):
```tsx
{/* Tooltip trigger (if sparkline is interactive) */}
<button
  type="button"
  aria-label={`View detailed ${label} history`}
  onMouseEnter={() => setShowTooltip(true)}
  onMouseLeave={() => setShowTooltip(false)}
  onFocus={() => setShowTooltip(true)}
  onBlur={() => setShowTooltip(false)}
>
  {/* Sparkline SVG */}
</button>

{/* Tooltip content */}
{showTooltip && (
  <div role="tooltip" id={`tooltip-${id}`}>
    Day 7: 14 questions
  </div>
)}
```

**Note:** If sparkline is purely visual (not interactive), no tooltip needed. Button pattern only if user can interact with chart.

### Keyboard Navigation

**Non-Interactive Sparkline (Recommended):**
- Card is informational display
- Only CTA button (if present) receives focus
- Sparkline is visual enhancement only

**Interactive Sparkline (Optional Enhancement):**
- Sparkline wrapped in button for keyboard access
- Tab to sparkline button
- Enter/Space shows detailed breakdown
- Escape closes tooltip

**Recommended Approach:** Keep sparkline non-interactive, provide detailed data via CTA button ("View History")

### Screen Reader Announcements

**On Page Load (StatCard with Sparkline):**
```
"Questions Asked, heading level 3"
"12"
"increased by 3 this week"
"Weekly activity: Day 1: 8, Day 2: 9, Day 3: 10, Day 4: 11, Day 5: 12, Day 6: 13, Day 7: 14"
"Button, View all questions"
```

**Without Sparkline:**
```
"Questions Asked, heading level 3"
"12"
"increased by 3 this week"
```

**On Focus (CTA Button):**
```
"Button, View all questions"
```

### Color Contrast Verification

**Text Elements:**
- Stat label: `text-muted-foreground` (#625C52) on `bg-card` (#FFFFFF) → **5.8:1 ✅ Pass**
- Stat value (large): `text-foreground` (#2A2721) on `bg-card` (#FFFFFF) → **13.2:1 ✅ Pass** (3:1 for large text)
- Trend label: Color-coded (green/red/gray) → **Verify contrast**
  - Green (`text-success` #2E7D32): **6.2:1 ✅ Pass**
  - Red (`text-danger` #D92D20): **5.4:1 ✅ Pass**
  - Gray (`text-muted-foreground` #625C52): **5.8:1 ✅ Pass**

**UI Components:**
- Sparkline path: `text-primary` (#8A6B3D) → **Verify contrast** (should be 3:1 against background)
- Card border: `border` on `bg-card` → **3:1+ ✅ Pass**
- Focus indicator (if sparkline interactive): Blue ring → **3:1+ ✅ Pass**

**Action Required:**
- Verify sparkline line color meets 3:1 UI component contrast
- Test trend icon visibility (size + color)

### Alternative Content

**Sparkline Chart:**
- Visual: Line chart showing 7-day trend
- Text Alternative: "Weekly activity: Day 1: 8, Day 2: 9, Day 3: 10, Day 4: 11, Day 5: 12, Day 6: 13, Day 7: 14"
- Format: Comma-separated daily values with labels

**Trend Indicator:**
- Visual: Icon (↑/↓/–) + "+3 this week"
- Screen Reader: "increased by 3 this week"

**Icon:**
- Marked `aria-hidden="true"`, label provides context

### Loading and Empty States

**Loading State:**
```tsx
{isLoading ? (
  <Card variant="glass-panel" className="p-4">
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading statistics...</span>
      <Skeleton className="h-4 w-24 bg-glass-medium" />
      <Skeleton className="h-10 w-16 bg-glass-medium mt-2" />
      <Skeleton className="h-8 w-full bg-glass-medium mt-3" />
    </div>
  </Card>
) : (
  /* StatCard content */
)}
```

**Zero State (No Activity):**
```tsx
{value === 0 && (
  <div className="text-center py-2">
    <p className="text-3xl font-bold">0</p>
    <p className="text-sm text-muted-foreground mt-1">
      No activity yet. Start by browsing your courses!
    </p>
  </div>
)}
```

### Reduced Motion Support

**Sparkline Animation:**
```tsx
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function EnhancedStatCard({ sparklineData, ...props }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg className={cn(
      "transition-opacity",
      !prefersReducedMotion && "animate-fade-in"
    )}>
      {/* Sparkline path (no animation if reduced motion) */}
    </svg>
  );
}
```

**Hover Effects:**
```tsx
className={cn(
  "transition-all duration-250",
  !prefersReducedMotion && "hover:scale-[1.02]"
)}
```

### Testing Checklist

- [ ] Screen Reader: Announces stat label, value, trend
- [ ] Screen Reader: Sparkline data announced as text alternative
- [ ] Screen Reader: Loading state announced with "busy"
- [ ] Keyboard: CTA button (if present) keyboard-accessible
- [ ] Keyboard: Sparkline not keyboard-focusable (unless interactive)
- [ ] Focus: Focus indicator visible on CTA button
- [ ] Contrast: All text meets 4.5:1 (3:1 for large value)
- [ ] Contrast: Trend indicators (green/red/gray) meet 4.5:1
- [ ] Contrast: Sparkline line meets 3:1 UI component contrast
- [ ] Reduced Motion: Sparkline animations disabled if preference set
- [ ] Visual: Sparkline accurately represents data
- [ ] Visual: Trend direction indicated by icon + color + text

---

## Global Accessibility Requirements

### Focus Indicator System

**Already Implemented in app/globals.css (lines 477-497):**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.dark *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4);
}

.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

**No Changes Needed:** Existing focus system meets WCAG 2.4.7 (Focus Visible)

### Color System Verification

**All widgets must use QDS semantic tokens:**
- ✅ `text-foreground`, `text-muted-foreground`, `text-subtle`
- ✅ `bg-card`, `bg-background`, `bg-muted`
- ✅ `text-primary`, `text-success`, `text-warning`, `text-danger`
- ❌ Never hardcode hex colors

**Contrast Verification Required:**
- [ ] Run axe DevTools on all new widgets
- [ ] Verify with Color Contrast Analyzer
- [ ] Test light and dark modes
- [ ] Check focus indicator visibility on all backgrounds

### Screen Reader Testing Protocol

**Test with 3 screen readers:**
1. **NVDA (Windows)** - Primary test target
2. **JAWS (Windows)** - Enterprise standard
3. **VoiceOver (macOS)** - Apple ecosystem

**Test Scenarios:**
- Navigate entire dashboard with keyboard only
- Verify all headings, landmarks, and sections announced
- Test interactive elements (links, buttons)
- Verify dynamic updates announced (aria-live)
- Check loading states
- Test empty states

### ARIA Live Region Implementation

**Add to app/dashboard/page.tsx (or create useAnnouncements hook):**
```tsx
function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  const [announcement, setAnnouncement] = useState<string>("");

  // Announce important updates
  useEffect(() => {
    if (streakIncreased) {
      setAnnouncement(`Study streak increased to ${newStreakDays} days`);
    }
  }, [streakIncreased, newStreakDays]);

  return (
    <>
      {/* Global announcement region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Dashboard content */}
      <main id="main-content">
        {/* Widgets */}
      </main>
    </>
  );
}
```

**Use Cases:**
- Streak increments
- New recommendations loaded
- Deadline approaching notifications
- Progress updates

---

## Implementation Order

### Phase 1: Critical Accessibility (Blocking)

1. **Semantic HTML structure** - All widgets
2. **ARIA labels and roles** - All interactive elements
3. **Keyboard navigation** - Complete tab flow
4. **Focus indicators** - Verify visibility on all widgets
5. **Color contrast** - Verify all text meets 4.5:1 minimum

### Phase 2: Enhanced Accessibility (High Priority)

6. **Screen reader text** - Alternative content for all non-text elements
7. **ARIA live regions** - Dynamic update announcements
8. **Loading states** - Announce loading to screen readers
9. **Progress semantics** - aria-valuenow/min/max on progress bars
10. **Touch targets** - Verify 44x44px minimum on mobile

### Phase 3: Polish (Nice to Have)

11. **Reduced motion support** - Disable animations if preferred
12. **Enhanced descriptions** - aria-describedby for complex widgets
13. **Skip links** - Jump to specific widget sections
14. **Keyboard shortcuts** - Document any custom keyboard interactions

---

## Testing Strategy

### Automated Testing

**Tools:**
- axe DevTools (browser extension)
- Lighthouse accessibility audit
- WAVE (Web Accessibility Evaluation Tool)

**Run Tests:**
```bash
# Lighthouse CLI
npx lighthouse http://localhost:3000/dashboard --only-categories=accessibility --view

# pa11y (if configured)
npx pa11y http://localhost:3000/dashboard
```

### Manual Testing

**Keyboard Navigation:**
1. Disconnect mouse
2. Tab through entire dashboard
3. Verify focus order matches visual layout
4. Test Enter/Space on all interactive elements
5. Verify no keyboard traps

**Screen Reader Testing:**
1. Enable NVDA/JAWS/VoiceOver
2. Navigate dashboard using only keyboard + screen reader
3. Verify all content announced correctly
4. Test headings navigation (H key in NVDA)
5. Test landmarks navigation (D key in NVDA)

**Color Contrast:**
1. Use Color Contrast Analyzer on all text
2. Verify 4.5:1 minimum for text
3. Verify 3:1 minimum for UI components
4. Test light and dark modes

**Responsive Testing:**
1. Test at 360px, 768px, 1024px, 1280px
2. Verify touch targets at least 44x44px on mobile
3. Verify adequate spacing between interactive elements

---

## Acceptance Criteria

### Must Pass (Blocking Release):

- [ ] All interactive elements keyboard-accessible
- [ ] Complete keyboard navigation flow (no traps)
- [ ] Focus indicators visible on all elements (4.5:1 contrast)
- [ ] All text meets 4.5:1 contrast ratio (3:1 for large text)
- [ ] All UI components meet 3:1 contrast ratio
- [ ] Screen reader announces all content correctly
- [ ] ARIA attributes correctly implemented
- [ ] Loading states announced to screen readers
- [ ] Empty states provide actionable guidance
- [ ] No axe DevTools critical violations

### Should Pass (High Priority):

- [ ] ARIA live regions announce dynamic updates
- [ ] Progress bars use aria-valuenow/min/max
- [ ] Charts/sparklines have text alternatives
- [ ] Touch targets at least 44x44px on mobile
- [ ] Reduced motion preferences respected
- [ ] Dark mode contrast verified

### Nice to Have (Polish):

- [ ] Skip links to widget sections
- [ ] Arrow key navigation in Quick Actions grid
- [ ] Enhanced descriptions via aria-describedby
- [ ] Keyboard shortcuts documented

---

## Rollback Plan

If accessibility issues block release:

1. **Hide problematic widgets** - Feature flag to disable new widgets
2. **Fallback to existing dashboard** - Revert to simple StatCard-only layout
3. **Fix critical issues only** - Ship with warnings disabled, fix in patch

**Risk Mitigation:**
- Test early and often with screen readers
- Use existing accessible components as templates
- Follow established patterns from instructor dashboard

---

## References

- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **MDN ARIA:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
- **WebAIM:** https://webaim.org/
- **Inclusive Components:** https://inclusive-components.design/

---

**Implementation Plan Created By:** Claude Code (Accessibility Validator Agent)
**Date:** 2025-10-12
**Next Step:** Update Decisions section in context.md, then proceed with implementation

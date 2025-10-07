# Phase 1: Component Redesigns

**Priority:** P1 (High)
**Estimated Effort:** 6-8 hours
**Dependencies:** Phase 0 (Glassmorphism) completed
**Status:** Pending Phase 0

---

## Objective

Redesign key components (thread cards, dashboard metrics, status badges, navigation) to improve information architecture, scanability, and visual appeal using modern UX patterns from competitive analysis.

**Success Criteria:**
- Thread cards have clear visual hierarchy and better structure
- Dashboard metrics include visual data storytelling elements
- Status badges use colors and icons for quick recognition
- Navigation is polished and user-friendly
- All components remain accessible (WCAG AA)

---

## Implementation Steps

### Step 1: Thread Card Redesign

**Current Issues:**
- Title, description, metadata all same visual weight
- Status badges blend in
- No visual separation between elements
- Minimal hover feedback

**New Design:**

```
┌────────────────────────────────────────────────┐
│ ┌─ Title Row ─────────────────────┐  [Status] │ ← Title bold, status colorful
│ │ How does binary search work?    │  answered │
│ └─────────────────────────────────┘           │
│                                                │
│ I'm having trouble understanding the binary    │ ← Description muted
│ search algorithm. Can someone explain...       │
│                                                │
│ ┌─ Metadata Row ──────────────────────────────┤ ← Icons + metadata
│ │ 👁 45 views  •  📅 10/1/2025  •  🏷 algos   │
│ └────────────────────────────────────────────┘│
└────────────────────────────────────────────────┘
```

**Implementation:**

**File:** `app/courses/[courseId]/page.tsx`

```tsx
<Link href={`/threads/${thread.id}`} className="group">
  <Card
    variant="glass"
    className="p-6 hover:shadow-glass-lg hover:shadow-glow-accent transition-all duration-200 group-hover:scale-[1.01]"
  >
    {/* Header Row: Title + Status */}
    <div className="flex items-start justify-between gap-4 mb-3">
      <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
        {thread.title}
      </h3>
      <StatusBadge status={thread.status} />
    </div>

    {/* Description */}
    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
      {thread.description}
    </p>

    {/* Metadata Row */}
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        <span>{thread.views} views</span>
      </div>
      <span className="text-border">•</span>
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        <span>{formatDate(thread.createdAt)}</span>
      </div>
      {thread.tags.length > 0 && (
        <>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3.5 w-3.5" />
            {thread.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  </Card>
</Link>
```

**Files to Create/Update:**
- [ ] Create `components/course/thread-card.tsx` - Extract to reusable component
- [ ] Update `app/courses/[courseId]/page.tsx` - Use new ThreadCard component
- [ ] Add icons: Eye, Calendar, Tag from lucide-react

**Estimated Time:** 1.5 hours

---

### Step 2: Status Badge Overhaul

**Current:** Plain text badges, minimal styling
**Target:** Colored backgrounds, icons, clear semantic meaning

**New Badge Variants:**

```tsx
// components/ui/badge.tsx - Add status variants

const statusConfig = {
  answered: {
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
    label: "Answered"
  },
  resolved: {
    color: "bg-info/10 text-info border-info/20",
    icon: Check,
    label: "Resolved"
  },
  unanswered: {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: HelpCircle,
    label: "Unanswered"
  },
  "needs-review": {
    color: "bg-accent/10 text-accent border-accent/20",
    icon: AlertCircle,
    label: "Needs Review"
  }
}

type StatusBadgeProps = {
  status: keyof typeof statusConfig
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={cn("flex items-center gap-1.5", config.color)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  )
}
```

**Files to Update:**
- [ ] `components/ui/badge.tsx` - Add status variant support
- [ ] Create `components/course/status-badge.tsx` - Dedicated component
- [ ] Update all usages of status badges across app

**Estimated Time:** 1 hour

---

### Step 3: Dashboard Metrics Enhancement

**Current:** Plain numbers in boxes
**Target:** Visual data storytelling with progress rings, trends, icons

**Metric Card Enhanced Design:**

```tsx
// components/dashboard/enhanced-stat-card.tsx

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  progress?: number // 0-100 for progress ring
  variant?: 'default' | 'success' | 'warning' | 'info'
}

export function EnhancedStatCard({
  label,
  value,
  icon: Icon,
  trend,
  progress,
  variant = 'default'
}: StatCardProps) {
  const variantColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-accent'
  }

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-start justify-between">
        {/* Left: Icon + Label + Value */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-full bg-glass-subtle backdrop-blur-sm p-2",
              variantColors[variant]
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
          </div>

          <p className="text-3xl font-bold">{value}</p>

          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend.direction === 'up' && "text-success",
              trend.direction === 'down' && "text-danger",
              trend.direction === 'neutral' && "text-muted-foreground"
            )}>
              {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend.direction === 'neutral' && <Minus className="h-4 w-4" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {/* Right: Progress Ring (if applicable) */}
        {progress !== undefined && (
          <div className="relative h-16 w-16">
            <svg className="transform -rotate-90" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={`${progress * 1.76} 176`}
                className={variantColors[variant]}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {progress}%
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
```

**Usage Examples:**

```tsx
// Student Dashboard
<EnhancedStatCard
  label="Courses"
  value={2}
  icon={GraduationCap}
  trend={{ value: "0% from last week", direction: "neutral" }}
  variant="info"
/>

<EnhancedStatCard
  label="Threads"
  value={2}
  icon={MessageSquare}
  trend={{ value: "+2 this week", direction: "up" }}
  variant="success"
/>

// Instructor Dashboard - AI Coverage
<EnhancedStatCard
  label="AI Coverage"
  value="68%"
  icon={Sparkles}
  progress={68}
  trend={{ value: "+2% this week", direction: "up" }}
  variant="info"
/>
```

**Files to Update:**
- [ ] Create `components/dashboard/enhanced-stat-card.tsx`
- [ ] Update `app/dashboard/page.tsx` - Use enhanced stat cards
- [ ] Add trend calculation logic in mock API (if needed)

**Estimated Time:** 2 hours

---

### Step 4: Navigation Enhancement

**Search Bar Improvement:**

```tsx
// components/ui/global-search.tsx

<div className="relative group">
  <div className={cn(
    "flex items-center gap-2 px-4 py-2",
    "bg-glass-medium backdrop-blur-md",
    "border border-glass rounded-lg",
    "transition-all duration-200",
    "focus-within:bg-glass-strong focus-within:border-primary/50 focus-within:shadow-glow-primary"
  )}>
    <Search className="h-4 w-4 text-muted-foreground" />
    <input
      type="text"
      placeholder="Search courses and threads"
      className="flex-1 bg-transparent text-sm outline-none"
    />
    <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-glass-subtle px-1.5 py-0.5 text-xs text-muted-foreground">
      <span>/</span>
    </kbd>
  </div>
</div>
```

**Sticky Navigation with Shadow:**

```tsx
// components/layout/nav-header.tsx

const [isScrolled, setIsScrolled] = useState(false)

useEffect(() => {
  const handleScroll = () => setIsScrolled(window.scrollY > 10)
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

<nav className={cn(
  "sticky top-0 z-50",
  "bg-glass-subtle backdrop-blur-lg",
  "border-b border-glass",
  "transition-shadow duration-200",
  isScrolled && "shadow-glass-md"
)}>
  {/* nav content */}
</nav>
```

**Files to Update:**
- [ ] `components/ui/global-search.tsx` - Enhanced search bar
- [ ] `components/layout/nav-header.tsx` - Sticky shadow behavior
- [ ] `components/layout/course-context-bar.tsx` - Similar treatment

**Estimated Time:** 1.5 hours

---

### Step 5: Filter Row Redesign

**Current:** Basic button group
**Target:** Segmented control with visual grouping

```tsx
// components/course/filter-row.tsx

const filters = [
  { id: 'all', label: 'All', icon: List },
  { id: 'unanswered', label: 'Unanswered', icon: HelpCircle },
  { id: 'my-posts', label: 'My Posts', icon: User },
  { id: 'needs-review', label: 'Needs Review', icon: AlertCircle }
]

<div className="flex items-center justify-between gap-4">
  {/* Filter Buttons - Segmented Control */}
  <div className="inline-flex bg-glass-medium backdrop-blur-md border border-glass rounded-lg p-1">
    {filters.map(filter => (
      <button
        key={filter.id}
        onClick={() => setActiveFilter(filter.id)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          activeFilter === filter.id
            ? "bg-glass-strong shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <filter.icon className="h-4 w-4" />
        <span>{filter.label}</span>
      </button>
    ))}
  </div>

  {/* Sort Dropdown */}
  <Select value={sortOrder} onValueChange={setSortOrder}>
    <SelectTrigger className="w-40 bg-glass-medium backdrop-blur-md border-glass">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-glass-strong backdrop-blur-xl border-glass">
      <SelectItem value="newest">Newest</SelectItem>
      <SelectItem value="oldest">Oldest</SelectItem>
      <SelectItem value="most-views">Most Views</SelectItem>
      <SelectItem value="most-replies">Most Replies</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Mobile Responsive:**

```tsx
// On mobile, collapse to dropdown
<div className="md:hidden">
  <Select value={activeFilter} onValueChange={setActiveFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Filter threads" />
    </SelectTrigger>
    <SelectContent>
      {filters.map(filter => (
        <SelectItem key={filter.id} value={filter.id}>
          <div className="flex items-center gap-2">
            <filter.icon className="h-4 w-4" />
            <span>{filter.label}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Files to Update:**
- [ ] `components/course/filter-row.tsx` - Redesign with segmented control
- [ ] Add mobile responsive behavior

**Estimated Time:** 1 hour

---

### Step 6: Course Header Redesign

**Current:** Dense, hard to scan
**Target:** Better visual hierarchy and spacing

```tsx
// components/layout/course-context-bar.tsx

<div className="bg-glass-medium backdrop-blur-md border-b border-glass">
  <div className="container-wide py-6">
    {/* Top Row: Course Code + Meta */}
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
      <span className="font-semibold text-foreground">{course.code}</span>
      <span className="text-border">·</span>
      <span>{course.name}</span>
      <span className="text-border">•</span>
      <span>{course.semester}</span>
      <span className="text-border">•</span>
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        <span>{course.studentCount} students</span>
      </div>
    </div>

    {/* Tab Navigation */}
    <nav className="flex items-center gap-1">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            isActive(tab.href)
              ? "bg-glass-strong text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-glass-subtle"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>

    {/* Tagline */}
    <p className="text-sm text-muted-foreground mt-3">
      Ask questions • AI drafts answers • peers & TAs refine
    </p>
  </div>
</div>
```

**Files to Update:**
- [ ] `components/layout/course-context-bar.tsx`

**Estimated Time:** 1 hour

---

## Verification & Testing

### Component Checklist

**Thread Card:**
- [ ] Clear visual hierarchy (title > description > metadata)
- [ ] Status badge colorful and prominent
- [ ] Icons render correctly
- [ ] Hover state smooth and visible
- [ ] Mobile: stacks properly, readable at 375px

**Status Badges:**
- [ ] Correct colors for each status
- [ ] Icons display properly
- [ ] Accessible color contrast
- [ ] Consistent across all usages

**Dashboard Metrics:**
- [ ] Progress rings render correctly
- [ ] Trend arrows show proper direction
- [ ] Icons appropriate for each metric
- [ ] Mobile: cards stack, remain readable

**Navigation:**
- [ ] Search bar focus state works
- [ ] Sticky behavior smooth
- [ ] Shadow appears on scroll
- [ ] Mobile: hamburger menu functional

**Filter Row:**
- [ ] Segmented control works on desktop
- [ ] Dropdown works on mobile
- [ ] Active state clear
- [ ] Responsive breakpoint correct

### Cross-Browser Testing

- [ ] Chrome: All components render
- [ ] Firefox: Glass effects work
- [ ] Safari: Backdrop blur supported
- [ ] Edge: No visual bugs

### Accessibility

**WCAG AA Checklist:**
- [ ] Color contrast ≥ 4.5:1 for all text
- [ ] Icons have aria-labels or are decorative
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader: semantic structure correct

**Keyboard Tests:**
- [ ] Tab through filters works
- [ ] Enter/Space activates buttons
- [ ] Escape closes dropdowns
- [ ] No keyboard traps

---

## Success Metrics

- [ ] Thread cards easier to scan (user testing feedback)
- [ ] Status badges immediately recognizable
- [ ] Dashboard metrics tell visual story
- [ ] Navigation polished and professional
- [ ] All tests pass (tsc, lint, visual QA)
- [ ] Before/after screenshots show clear improvement
- [ ] Accessibility maintained (WCAG AA)
- [ ] Bundle size < 200KB per route

---

## Next Steps

After Phase 1 completion:
1. Gather user feedback on redesigned components
2. Document component patterns in Storybook (future)
3. Update context.md changelog
4. Proceed to Phase 2 (Interactions & Polish)

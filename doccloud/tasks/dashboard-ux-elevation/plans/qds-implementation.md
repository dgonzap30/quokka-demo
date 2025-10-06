# QDS 2.0 Implementation Plan: Dashboard Components

**Created:** 2025-10-04
**Target:** New dashboard components with glassmorphism, liquid animations, and micro-interactions
**Compliance Goal:** 10/10 QDS 2.0 adherence

---

## Component 1: StatCard

**Purpose:** Display key metrics with trends, deltas, and visual hierarchy

### Glass Surface Specifications

**Base Glass Level:** `glass-panel` (medium blur, medium opacity)

```tsx
<Card variant="glass" className="group hover:shadow-[var(--glow-primary)] transition-shadow duration-[240ms]">
  {/* Content */}
</Card>
```

**Why medium blur?**
- Stat cards are primary focal points
- Need clarity for numbers while maintaining depth
- `backdrop-blur-md` (12px) balances readability + aesthetics

**Hover State:** Add primary glow on hover for emphasis

---

### Color Token Usage

**Stat Value (Main Number):**
```tsx
<p className="text-3xl font-bold text-primary glass-text">{stat.value}</p>
```
- **Token:** `text-primary` (#8A6B3D light, #C1A576 dark)
- **Utility:** `.glass-text` adds subtle shadow for glass background readability

**Trend Indicators:**

**Positive Trend:**
```tsx
<div className="flex items-center gap-1 text-success">
  <TrendingUp className="size-4" />
  <span className="text-sm font-semibold">+{stat.delta}%</span>
</div>
```
- **Token:** `text-success` (#2E7D32)
- **Icon:** Lucide `TrendingUp`

**Negative Trend:**
```tsx
<div className="flex items-center gap-1 text-danger">
  <TrendingDown className="size-4" />
  <span className="text-sm font-semibold">-{stat.delta}%</span>
</div>
```
- **Token:** `text-danger` (#D92D20)
- **Icon:** Lucide `TrendingDown`

**Neutral Trend:**
```tsx
<div className="flex items-center gap-1 text-muted-foreground">
  <Minus className="size-4" />
  <span className="text-sm font-semibold">No change</span>
</div>
```
- **Token:** `text-muted-foreground`
- **Icon:** Lucide `Minus`

**Label Text:**
```tsx
<p className="text-sm text-muted-foreground glass-text">{stat.label}</p>
```
- **Token:** `text-muted-foreground` with `.glass-text`

**CTA Button (if needed):**
```tsx
<Button variant="ghost" size="sm" className="text-accent hover:text-accent-hover">
  View Details
</Button>
```
- **Tokens:** `text-accent`, `hover:text-accent-hover`

---

### Shadow & Glow Combinations

**Resting State:**
```tsx
className="shadow-[var(--shadow-glass-md)]"
```
- Uses glass shadow (softer, more diffuse than traditional)

**Hover State:**
```tsx
className="hover:shadow-[var(--glow-primary)]"
```
- Adds warm primary glow on hover for interactivity

**Transition:**
```tsx
className="transition-shadow duration-[240ms]"
```
- Duration: 240ms (slow, from `--duration-slow`)

---

### Spacing (4pt Grid)

**Card Padding:**
```tsx
<CardContent className="p-6">
  {/* 24px padding */}
</CardContent>
```

**Internal Spacing:**
```tsx
<div className="space-y-2">
  {/* 8px vertical gap */}
  <p className="text-sm text-muted-foreground glass-text">Label</p>
  <div className="flex items-baseline gap-2">
    {/* 8px horizontal gap */}
    <p className="text-3xl font-bold text-primary glass-text">Value</p>
    <div className="flex items-center gap-1">
      {/* 4px gap between icon and text */}
      <TrendingUp className="size-4" />
      <span>+12%</span>
    </div>
  </div>
</div>
```

**Grid Gap (Stats Overview):**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  {/* 24px gap between stat cards */}
</div>
```

---

### Radius

**Card Border Radius:**
```tsx
className="rounded-xl"
```
- **Value:** 20px (`--radius-xl`)
- **Why xl?** Stat cards are medium-large UI elements, deserve prominent rounding

---

### Hover/Active/Focus States

**Hover:**
```tsx
className="group hover:shadow-[var(--glow-primary)] hover:-translate-y-1 transition-all duration-[240ms]"
```
- Lift effect: `-translate-y-1` (4px up)
- Glow added
- Smooth transition

**Focus (if interactive):**
```tsx
className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
```
- Outline ring with 2px offset
- Uses `--ring` color (accent)

---

### Complete Example Code

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  trend?: "up" | "down" | "neutral"
  delta?: string
  deltaLabel?: string
  onClick?: () => void
}

export function StatCard({ label, value, trend, delta, deltaLabel, onClick }: StatCardProps) {
  const isInteractive = !!onClick

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend ?? "neutral"]

  const trendColor = {
    up: "text-success",
    down: "text-danger",
    neutral: "text-muted-foreground",
  }[trend ?? "neutral"]

  return (
    <Card
      variant="glass"
      onClick={onClick}
      className={cn(
        "group transition-all duration-[240ms]",
        isInteractive && "hover:shadow-[var(--glow-primary)] hover:-translate-y-1 cursor-pointer",
        !isInteractive && "hover:shadow-[var(--shadow-glass-lg)]"
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-2">
          {/* Label */}
          <p className="text-sm text-muted-foreground glass-text">{label}</p>

          {/* Value + Trend */}
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-primary glass-text">{value}</p>

            {trend && delta && (
              <div className={cn("flex items-center gap-1 text-sm font-semibold", trendColor)}>
                <TrendIcon className="size-4" />
                <span>{delta}</span>
              </div>
            )}
          </div>

          {/* Delta Label (e.g., "vs last week") */}
          {deltaLabel && (
            <p className="text-xs text-muted-foreground glass-text">{deltaLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/stat-card.tsx`

**Type Imports:**
```tsx
import type { StatCardProps } from "@/lib/models/types"
```

**Dependencies:**
- `lucide-react` (already installed)
- `class-variance-authority` (already installed)
- `@/components/ui/card`
- `@/lib/utils`

---

## Component 2: TimelineActivity

**Purpose:** Display recent activity as a visual timeline with dots, connecting lines, and context cards

### Glass Surface Specifications

**Timeline Dots:**
```tsx
<div className="size-6 rounded-full glass-panel flex items-center justify-center z-10 border border-[var(--border-glass)]">
  <div className="size-2 rounded-full bg-accent" />
</div>
```
- **Glass Level:** `glass-panel` (medium blur)
- **Inner Dot:** Accent color for visual pop
- **Border:** Glass border for definition

**Activity Cards:**
```tsx
<Card variant="glass-hover">
  {/* Activity content */}
</Card>
```
- **Glass Level:** `glass-hover` (hover interaction included)

**Vertical Connecting Line:**
```tsx
<div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border opacity-50" />
```
- **Color:** `bg-border` with 50% opacity
- **Why not glass?** Line is subtle background element, doesn't need blur

---

### Color Token Usage

**Timeline Dot Inner Circle:**
```tsx
<div className="size-2 rounded-full bg-accent" />
```
- **Token:** `bg-accent` (#2D6CDF light, #86A9F6 dark)
- **Why accent?** Draws eye, creates visual rhythm

**Activity Summary Text:**
```tsx
<p className="text-sm font-medium leading-snug glass-text">{activity.summary}</p>
```
- **Token:** Default foreground with `.glass-text`

**Activity Type Badge:**
```tsx
<Badge variant="outline" className="text-xs">
  {activity.type.replace(/_/g, " ")}
</Badge>
```
- **Variant:** `outline` (border-only, transparent bg)

**Timestamp/Metadata:**
```tsx
<p className="text-xs text-muted-foreground glass-text">{activity.timestamp}</p>
```
- **Token:** `text-muted-foreground`

**Course Name:**
```tsx
<span className="text-xs text-subtle">{activity.courseName}</span>
```
- **Token:** `text-subtle` (custom utility class for reduced emphasis)

---

### Shadow & Glow Combinations

**Timeline Dot:**
```tsx
className="shadow-[var(--shadow-glass-sm)]"
```
- Subtle glass shadow for depth

**Activity Card (Hover):**
```tsx
Card variant="glass-hover"
```
- Built-in hover effect: blur intensifies, shadow increases

---

### Spacing (4pt Grid)

**Timeline Container:**
```tsx
<div className="space-y-4">
  {/* 16px vertical gap between items */}
</div>
```

**Timeline Item Layout:**
```tsx
<div className="relative flex gap-4">
  {/* 16px gap between dot and card */}
  <div className="size-6">{/* Dot */}</div>
  <Card>{/* Activity */}</Card>
</div>
```

**Card Internal Padding:**
```tsx
<CardContent className="p-4">
  {/* 16px padding (smaller than stat cards) */}
</CardContent>
```

**Text Spacing:**
```tsx
<div className="space-y-1">
  {/* 4px gap between summary and metadata */}
</div>
```

---

### Radius

**Timeline Dots:**
```tsx
className="rounded-full"
```
- Perfect circles

**Activity Cards:**
```tsx
className="rounded-lg"
```
- **Value:** 16px (`--radius-lg`)
- Timeline items are secondary UI elements, use default card radius

---

### Hover/Active/Focus States

**Activity Card Hover:**
- Built into `variant="glass-hover"`
- Blur increases, lift effect, shadow deepens

**Clickable Link Wrapper:**
```tsx
<Link href={`/threads/${activity.threadId}`}>
  <Card variant="glass-hover">
    {/* Content */}
  </Card>
</Link>
```
- Entire card is clickable
- Focus ring appears on card on keyboard focus

---

### Complete Example Code

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TimelineActivityProps {
  activities: Array<{
    id: string
    summary: string
    type: string
    courseName: string
    timestamp: string
    threadId: string
  }>
}

export function TimelineActivity({ activities }: TimelineActivityProps) {
  if (activities.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <div className="space-y-2">
          <div className="text-4xl opacity-50">💬</div>
          <p className="text-sm text-muted-foreground glass-text">No recent activity</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="relative space-y-4">
      {/* Vertical connecting line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border opacity-50" />

      {/* Timeline items */}
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex gap-4">
          {/* Timeline dot */}
          <div className="size-6 rounded-full glass-panel flex items-center justify-center z-10 border border-[var(--border-glass)] shadow-[var(--shadow-glass-sm)] shrink-0">
            <div className="size-2 rounded-full bg-accent" />
          </div>

          {/* Activity card */}
          <Link href={`/threads/${activity.threadId}`} className="flex-1">
            <Card variant="glass-hover" className="h-full">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Summary + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug glass-text flex-1">
                      {activity.summary}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {activity.type.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <p className="text-xs text-subtle">
                    {activity.courseName} • {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  )
}
```

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/timeline-activity.tsx`

**Type Imports:**
```tsx
import type { TimelineActivityProps } from "@/lib/models/types"
```

---

## Component 3: EnhancedCourseCard

**Purpose:** Rich course card with icon, tags, progress bar, and interactive states

### Glass Surface Specifications

**Base Glass Level:** `glass-liquid` (animated gradient border)

```tsx
<Card variant="glass-liquid" className="group hover:scale-[1.02] transition-transform duration-[180ms]">
  {/* Content */}
</Card>
```

**Why glass-liquid?**
- Most visually sophisticated variant
- Animated gradient border creates premium feel
- Appropriate for main course cards (high importance)

**Hover Effect:** Subtle scale (2% larger) + border shimmer

---

### Color Token Usage

**Icon Container Background:**
```tsx
<div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center">
  <BookOpen className="size-6 text-accent" />
</div>
```
- **Background:** `bg-accent/10` (10% opacity accent)
- **Icon:** `text-accent` (#2D6CDF light, #86A9F6 dark)
- **Icon Options:** `BookOpen`, `Code`, `Beaker`, `Calculator` (from Lucide)

**Course Code:**
```tsx
<CardTitle className="text-xl glass-text text-primary">{course.code}</CardTitle>
```
- **Tokens:** `text-xl`, `text-primary`, `.glass-text`

**Course Name:**
```tsx
<CardDescription className="text-base leading-relaxed glass-text">
  {course.name}
</CardDescription>
```
- **Token:** `text-muted-foreground` (via CardDescription default) + `.glass-text`

**Tags:**
```tsx
<div className="flex flex-wrap gap-2">
  {course.tags.map((tag) => (
    <Badge key={tag} variant="secondary" className="text-xs">
      {tag}
    </Badge>
  ))}
</div>
```
- **Variant:** `secondary` (olive green background)
- **Why secondary?** Tags are informational, not CTAs

**Progress Bar Track:**
```tsx
<div className="h-2 rounded-full bg-glass-medium overflow-hidden">
  {/* Fill */}
</div>
```
- **Token:** `bg-glass-medium` (translucent glass background)

**Progress Bar Fill:**
```tsx
<div
  className="h-full bg-primary transition-all duration-[320ms]"
  style={{ width: `${course.progress}%` }}
/>
```
- **Token:** `bg-primary` (#8A6B3D light, #C1A576 dark)
- **Animation:** Smooth width transition (320ms page duration)

**Progress Label:**
```tsx
<p className="text-xs text-muted-foreground glass-text">{course.progress}% complete</p>
```

**Unread Badge:**
```tsx
<Badge variant="default" className="shrink-0">
  {course.unreadCount} new
</Badge>
```
- **Variant:** `default` (primary background)
- **Why default?** Draws attention to new activity

---

### Shadow & Glow Combinations

**Resting State:**
- Built into `variant="glass-liquid"` (uses `shadow-glass-md`)

**Hover State:**
```tsx
className="hover:shadow-[var(--glow-accent)]"
```
- Adds accent glow on hover for interactivity

---

### Spacing (4pt Grid)

**Card Padding:**
```tsx
<Card>
  <CardHeader className="p-6">
    {/* 24px padding */}
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* 24px horizontal, 0 top (continuous with header) */}
  </CardContent>
</Card>
```

**Header Layout:**
```tsx
<div className="flex items-start gap-3">
  {/* 12px gap between icon and text */}
  <div className="size-12">{/* Icon */}</div>
  <div className="space-y-1">
    {/* 4px gap between title and description */}
  </div>
</div>
```

**Content Sections:**
```tsx
<div className="space-y-3">
  {/* 12px gap between tags, progress, stats */}
</div>
```

**Tag Spacing:**
```tsx
<div className="flex flex-wrap gap-2">
  {/* 8px gap between tags */}
</div>
```

---

### Radius

**Card Border Radius:**
```tsx
className="rounded-xl"
```
- **Value:** 20px (`--radius-xl`)
- **Why xl?** Course cards are prominent, deserve premium rounding

**Icon Container:**
```tsx
className="rounded-lg"
```
- **Value:** 16px (`--radius-lg`)

**Progress Bar:**
```tsx
className="rounded-full"
```
- Pill-shaped progress bar

**Tags:**
```tsx
<Badge className="rounded-md">
```
- **Value:** 10px (`--radius-md`)
- Default Badge radius

---

### Hover/Active/Focus States

**Hover:**
```tsx
className="group hover:scale-[1.02] hover:shadow-[var(--glow-accent)] transition-all duration-[180ms]"
```
- Scale up 2%
- Add accent glow
- Liquid border animates (built into variant)

**Focus (Link Wrapper):**
```tsx
<Link href={`/courses/${course.id}`}>
  <Card variant="glass-liquid">
    {/* Content */}
  </Card>
</Link>
```
- Focus ring appears on card
- Entire card is keyboard navigable

**Group Hover Effects:**
```tsx
<div className="group">
  {/* Icon brightens on card hover */}
  <BookOpen className="size-6 text-accent group-hover:text-accent-hover transition-colors" />
</div>
```

---

### Complete Example Code

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EnhancedCourseCardProps {
  course: {
    id: string
    code: string
    name: string
    icon?: "book" | "code" | "beaker" | "calculator"
    tags?: string[]
    progress?: number
    unreadCount?: number
    recentThreads?: Array<{ id: string; title: string }>
  }
}

const iconMap = {
  book: BookOpen,
  code: Code,
  beaker: Beaker,
  calculator: Calculator,
}

export function EnhancedCourseCard({ course }: EnhancedCourseCardProps) {
  const Icon = iconMap[course.icon ?? "book"]

  return (
    <Link href={`/courses/${course.id}`}>
      <Card
        variant="glass-liquid"
        className="group h-full hover:scale-[1.02] hover:shadow-[var(--glow-accent)] transition-all duration-[180ms]"
      >
        <CardHeader className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="size-6 text-accent group-hover:text-accent-hover transition-colors" />
              </div>

              {/* Title + Description */}
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-xl glass-text text-primary truncate">
                  {course.code}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed glass-text line-clamp-2">
                  {course.name}
                </CardDescription>
              </div>
            </div>

            {/* Unread Badge */}
            {course.unreadCount && course.unreadCount > 0 && (
              <Badge variant="default" className="shrink-0">
                {course.unreadCount} new
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Progress */}
            {course.progress !== undefined && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground glass-text">Progress</span>
                  <span className="font-semibold text-primary glass-text">
                    {course.progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-glass-medium overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-[320ms]"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent Threads */}
            {course.recentThreads && course.recentThreads.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground glass-text">
                  Recent threads:
                </p>
                {course.recentThreads.slice(0, 2).map((thread) => (
                  <p key={thread.id} className="text-sm text-subtle truncate">
                    • {thread.title}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/dashboard/enhanced-course-card.tsx`

**Type Imports:**
```tsx
import type { EnhancedCourseCardProps } from "@/lib/models/types"
```

**Missing Icons Import:**
```tsx
import { BookOpen, Code, Beaker, Calculator } from "lucide-react"
```

---

## Component 4: Global Search (Nav Header Enhancement)

**Purpose:** Add debounced search input to nav header with glass styling

### Glass Surface Specifications

**Search Input Container:**
```tsx
<div className="relative max-w-sm">
  <Input
    type="search"
    placeholder="Search threads..."
    className="pl-10 glass-panel border-[var(--border-glass)] focus:shadow-[var(--glow-accent)]"
  />
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
</div>
```

**Glass Level:** Apply `glass-panel` class to input
**Border:** Use glass border token
**Focus Glow:** Accent glow on focus

---

### Color Token Usage

**Input Text:**
- Default foreground (inherits from Input component)

**Placeholder:**
```tsx
placeholder="Search threads..."
```
- Uses `placeholder:text-muted-foreground` (built into Input)

**Search Icon:**
```tsx
<Search className="size-4 text-muted-foreground" />
```
- **Token:** `text-muted-foreground`

**Results Dropdown (if implemented):**
```tsx
<Card variant="glass-strong" className="absolute top-full mt-2 w-full shadow-[var(--shadow-glass-lg)]">
  {/* Search results */}
</Card>
```
- **Glass Level:** `glass-strong` (elevated dropdown)
- **Shadow:** Large glass shadow for depth

---

### Spacing

**Input Padding:**
```tsx
className="pl-10 pr-4 py-2"
```
- Left padding: 40px (space for icon)
- Right padding: 16px
- Vertical padding: 8px

**Icon Position:**
```tsx
className="absolute left-3 top-1/2 -translate-y-1/2"
```
- 12px from left edge

**Dropdown Spacing:**
```tsx
className="absolute top-full mt-2"
```
- 8px gap below input

---

### Radius

**Input:**
```tsx
className="rounded-lg"
```
- **Value:** 16px (`--radius-lg`)

---

### Hover/Active/Focus States

**Focus:**
```tsx
className="focus:shadow-[var(--glow-accent)] focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-shadow duration-[180ms]"
```
- Accent glow appears
- Ring appears (built into Input component)

---

### Example Code Snippet

```tsx
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"
import { useDebouncedCallback } from "use-debounce"

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    // Perform search
    // setResults(...)
  }, 300)

  return (
    <div className="relative max-w-sm">
      <Input
        type="search"
        placeholder="Search threads..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          debouncedSearch(e.target.value)
        }}
        className="pl-10 glass-panel border-[var(--border-glass)] focus:shadow-[var(--glow-accent)]"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />

      {/* Results dropdown (if results.length > 0) */}
    </div>
  )
}
```

**File Path:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/search-input.tsx`

**Dependencies:**
- `use-debounce` package (install: `npm install use-debounce`)

---

## Micro-Interactions Summary

### Hover Effects

**StatCard:**
- Lift 4px up
- Add primary glow
- Duration: 240ms

**TimelineActivity Cards:**
- Intensify blur (built into `glass-hover`)
- Lift effect
- Shadow deepens

**EnhancedCourseCard:**
- Scale 2% larger
- Add accent glow
- Liquid border shimmers
- Icon color brightens

**Search Input:**
- Accent glow appears
- Ring appears

---

### Transition Durations

**Fast (120ms):** Toggle states, checkboxes
**Medium (180ms):** Hover effects, scale transforms
**Slow (240ms):** Shadow/glow changes, stat cards
**Page (320ms):** Progress bar animations

---

### Animation Classes to Add

**Pulse Glow (for high-priority stats):**
```css
@keyframes pulse-glow-primary {
  0%, 100% { box-shadow: var(--glow-primary); }
  50% { box-shadow: 0 0 28px rgba(138, 107, 61, 0.25); }
}

.animate-pulse-glow-primary {
  animation: pulse-glow-primary 2s ease-in-out infinite;
}
```

**Usage:** Apply to unanswered count stat card

---

## Implementation Order

### Phase 1: Core Components (Critical)
1. **StatCard** - Required for dashboard stats
2. **TimelineActivity** - Required for activity feed
3. **EnhancedCourseCard** - Required for course grid

### Phase 2: Enhancements (Medium Priority)
4. **Global Search** - Add to nav header
5. **Micro-interactions** - Polish hover/focus states
6. **Pulse animations** - Add to high-priority stats

### Phase 3: Polish (Low Priority)
7. **Empty states** - Friendly illustrations + CTAs
8. **Loading skeletons** - Glass-themed skeleton screens
9. **Dark mode testing** - Verify all glass effects in dark mode

---

## Testing Checklist

### QDS Compliance
- [ ] All colors use semantic tokens (no hex codes)
- [ ] Spacing follows 4pt grid (`gap-1`, `gap-2`, `gap-4`, etc.)
- [ ] Radius uses QDS scale (`rounded-lg`, `rounded-xl`)
- [ ] Shadows use glass system (`shadow-[var(--shadow-glass-sm)]` / `md` / `lg`)
- [ ] Glows use token system (`shadow-[var(--glow-primary)]` / `success` / `warning` / `accent`)
- [ ] Text on glass uses `.glass-text` utility
- [ ] Maximum 3 blur layers per view

### Accessibility
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Reduced motion supported (`prefers-reduced-motion`)

### Responsiveness
- [ ] Works at 360px (mobile small)
- [ ] Works at 640px (mobile large)
- [ ] Works at 768px (tablet)
- [ ] Works at 1024px (desktop)
- [ ] Works at 1280px (desktop large)

### Performance
- [ ] No more than 3 blur layers visible simultaneously
- [ ] Animations respect `will-change` for GPU acceleration
- [ ] No layout shifts during interactions
- [ ] Transitions are smooth (60fps)

### Dark Mode
- [ ] All glass tokens switch correctly
- [ ] Text contrast maintained in dark mode
- [ ] Glows are visible but not overwhelming
- [ ] Borders remain visible

---

## New Type Definitions Required

**Add to `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`:**

```typescript
// Stat Card
export interface StatCardProps {
  label: string
  value: string | number
  trend?: "up" | "down" | "neutral"
  delta?: string
  deltaLabel?: string
  onClick?: () => void
}

// Timeline Activity
export interface ActivityItem {
  id: string
  summary: string
  type: "new_thread" | "new_reply" | "endorsed" | "resolved"
  courseName: string
  timestamp: string
  threadId: string
}

export interface TimelineActivityProps {
  activities: ActivityItem[]
}

// Enhanced Course Card
export interface EnhancedCourse {
  id: string
  code: string
  name: string
  icon?: "book" | "code" | "beaker" | "calculator"
  tags?: string[]
  progress?: number
  unreadCount?: number
  recentThreads?: Array<{ id: string; title: string }>
}

export interface EnhancedCourseCardProps {
  course: EnhancedCourse
}
```

---

## Mock API Extensions Required

**Add trend/delta calculations to dashboard hooks:**

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

```typescript
// Example delta calculation (add to getStudentDashboard)
const stats = {
  totalCourses: enrolledCourses.length,
  totalThreads: userThreads.length,
  totalPosts: userPosts.length,
  endorsedPosts: endorsedCount,
  // NEW: Add deltas
  threadsDelta: "+12%", // Mock: vs last week
  threadsTrend: "up" as const,
  postsDelta: "+8%",
  postsTrend: "up" as const,
}
```

**No breaking changes** - extend existing return types with optional fields.

---

**End of QDS Implementation Plan**

*All components designed for perfect QDS 2.0 compliance with glassmorphism, liquid animations, and accessibility.*

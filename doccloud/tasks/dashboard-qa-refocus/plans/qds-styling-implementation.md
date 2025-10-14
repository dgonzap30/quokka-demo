# QDS Styling Implementation Guide: Q&A Companion Dashboard

**Date:** 2025-10-13
**Task:** Dashboard Q&A Companion Refocus
**Agent:** QDS Compliance Auditor
**Design System:** QDS 2.0 Glassmorphism Edition

---

## Table of Contents

1. [QuokkaPointsCard Styling Specification](#component-1-quokkapointscard)
2. [QuickActionsPanel Styling Updates](#component-2-quickactionspanel-updates)
3. [AssignmentQAOpportunities Styling Specification](#component-3-assignmentqaopportunities)
4. [Shared Styling Patterns](#shared-styling-patterns)
5. [Dark Mode Implementation](#dark-mode-implementation)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Animation Specifications](#animation-specifications)
8. [Performance Optimizations](#performance-optimizations)

---

## Component 1: QuokkaPointsCard

### Complete Styling Specification

#### Card Container

```tsx
<Card
  variant="glass-hover"
  className={cn("relative overflow-hidden", className)}
>
```

**Tailwind Classes:**
- `relative` - Positioning context for background decoration
- `overflow-hidden` - Clips background decoration within card bounds

**Card Variant:** `glass-hover`
- Provides: `backdrop-filter: blur(var(--blur-md))` (12px)
- Background: `var(--glass-medium)` (rgba(255,255,255,0.7) light / rgba(23,21,17,0.7) dark)
- Border: `1px solid var(--border-glass)`
- Shadow: `var(--shadow-glass-md)`
- Hover: Blur intensifies to `--blur-lg` (16px), lift effect

#### Background Decoration (Quokka Icon)

```tsx
<div
  className="absolute top-4 right-4 opacity-10"
  aria-hidden="true"
>
  <Flame className="h-24 w-24 text-warning" />
</div>
```

**Tailwind Classes:**
- `absolute` - Positioned relative to card container
- `top-4 right-4` - 16px from top and right edges (QDS 4pt grid)
- `opacity-10` - 10% opacity for subtle branding
- `h-24 w-24` - 96px × 96px icon size

**Icon Color:** `text-warning` (--warning: #B45309)

**Accessibility:** `aria-hidden="true"` (decorative only, no semantic meaning)

#### Card Content Wrapper

```tsx
<CardContent className="p-6 relative z-10">
```

**Tailwind Classes:**
- `p-6` - 24px padding on all sides (QDS spacing scale)
- `relative z-10` - Layered above background decoration

#### Header Section

```tsx
<div className="flex items-start justify-between mb-4">
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground glass-text">
      Quokka Points
    </p>
    <div className="flex items-baseline gap-2">
      <span className="text-5xl font-bold text-primary tabular-nums">
        {totalPoints}
      </span>
      <span className="text-lg text-muted-foreground">points</span>
    </div>
    <p className="text-sm text-muted-foreground glass-text">
      +{weeklyPoints} this week
    </p>
  </div>

  {onViewDetails && (
    <Button
      variant="ghost"
      size="sm"
      onClick={onViewDetails}
      className="text-accent hover:text-accent-hover"
    >
      View Details
    </Button>
  )}
</div>
```

**Layout Classes:**
- `flex items-start justify-between` - Horizontal layout, align top, space between
- `mb-4` - 16px bottom margin (QDS spacing)
- `space-y-1` - 4px vertical stack (QDS spacing)
- `gap-2` - 8px gap between inline elements (QDS spacing)

**Typography Classes:**
- Label: `text-sm font-medium text-muted-foreground glass-text`
  - Size: 14px (text-sm)
  - Weight: 500 (font-medium)
  - Color: --muted-foreground (#625C52 light / #B8AEA3 dark)
  - Shadow: .glass-text utility (0 1px 2px rgba(0,0,0,0.1))

- Point Value: `text-5xl font-bold text-primary tabular-nums`
  - Size: 48px (text-5xl)
  - Weight: 700 (font-bold)
  - Color: --primary (#8A6B3D light / #C1A576 dark)
  - Font: tabular-nums (consistent digit width)

- Unit Label: `text-lg text-muted-foreground`
  - Size: 18px (text-lg)
  - Color: --muted-foreground

- Weekly Points: `text-sm text-muted-foreground glass-text`
  - Size: 14px
  - Color: --muted-foreground
  - Shadow: .glass-text utility

**Button Styling:**
- Variant: `ghost` (transparent bg, hover bg-muted)
- Size: `sm` (32px height, text-sm)
- Color: `text-accent hover:text-accent-hover`
  - Normal: --accent (#2D6CDF light / #86A9F6 dark)
  - Hover: --accent-hover (#1F5CC0 light / #2D6CDF dark)

#### Progress Section

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground glass-text">
      Progress to {nextMilestone.label}
    </span>
    <span className="font-medium tabular-nums">
      {totalPoints} / {nextMilestone.threshold}
    </span>
  </div>

  <Progress
    value={progressPercent}
    className="h-3"
    aria-label={`Progress to ${nextMilestone.label}: ${progressPercent}%`}
  />
</div>
```

**Layout Classes:**
- `space-y-2` - 8px vertical stack (QDS spacing)
- `flex items-center justify-between` - Horizontal layout, space between
- `text-sm` - 14px text size

**Typography:**
- Label: `text-muted-foreground glass-text`
- Value: `font-medium tabular-nums` (consistent digit width)

**Progress Component:**
- Base height: `h-3` (12px) via className
- Track background: `bg-primary/20` (20% opacity primary color)
- Fill color: `bg-primary` (--primary)
- Border radius: `rounded-full` (fully rounded ends)
- Transition: `transition-all` (smooth width animation)

**Component Styling (Progress component itself):**
```tsx
// In components/ui/progress.tsx (no changes needed, already QDS compliant)
<ProgressPrimitive.Root
  className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full"
  {...props}
>
  <ProgressPrimitive.Indicator
    className="bg-primary h-full w-full flex-1 transition-all"
    style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
  />
</ProgressPrimitive.Root>
```

**Override height:**
```tsx
<Progress value={75} className="h-3" />
```

#### Point Sources Breakdown

```tsx
<div className="space-y-2">
  <h4 className="text-sm font-medium text-foreground">Top Sources:</h4>
  <ul className="space-y-1.5" aria-label="Point sources breakdown">
    {pointSources.slice(0, 3).map((source) => {
      const Icon = source.icon;
      return (
        <li
          key={source.id}
          className="flex items-center gap-2 text-sm"
        >
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="glass-text">
            {source.label}: {source.count} × {source.pointsPerAction} = {source.points} pts
          </span>
        </li>
      );
    })}
  </ul>
</div>
```

**Layout Classes:**
- Outer container: `space-y-2` (8px vertical stack)
- List: `space-y-1.5` (6px vertical stack) - tighter for list items
- List item: `flex items-center gap-2` (horizontal, 8px gap)

**Typography:**
- Heading: `text-sm font-medium text-foreground`
  - Size: 14px
  - Weight: 500
  - Color: --foreground (#2A2721 light / #F3EFE8 dark)

- Icon: `h-4 w-4 text-muted-foreground shrink-0`
  - Size: 16px × 16px
  - Color: --muted-foreground
  - shrink-0: Prevents icon from shrinking if text wraps

- Text: `glass-text` (text shadow for readability)
  - Size: 14px (inherits from parent text-sm)

#### Optional Sparkline

```tsx
{sparklineData && (
  <div className="flex items-center justify-between pt-2 border-t border-border">
    <MiniSparkline
      data={sparklineData}
      variant="success"
    />
    <span className="text-xs text-muted-foreground glass-text">
      Last 7 days
    </span>
  </div>
)}
```

**Layout Classes:**
- `flex items-center justify-between` - Horizontal, space between
- `pt-2 border-t border-border` - 8px top padding, top border separator
  - Border color: --border (#CDC7BD light / rgba(243,239,232,0.1) dark)

**Typography:**
- Caption: `text-xs text-muted-foreground glass-text`
  - Size: 12px (text-xs)
  - Color: --muted-foreground
  - Shadow: .glass-text

**MiniSparkline Component:**
- Variant: `success` (green line for positive trend)
- Height: ~24px (internal component styling)
- Line color: --success (#2E7D32)

#### Loading State

```tsx
if (loading) {
  return (
    <Card className={cn("glass-panel", className)}>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-16 w-32 bg-glass-medium" />
        <Skeleton className="h-3 w-full bg-glass-medium" />
        <Skeleton className="h-6 w-48 bg-glass-medium" />
        <Skeleton className="h-6 w-44 bg-glass-medium" />
        <Skeleton className="h-6 w-52 bg-glass-medium" />
      </CardContent>
    </Card>
  );
}
```

**Card Variant:** `glass-panel` (static, no hover effect)

**Skeleton Styling:**
- Background: `bg-glass-medium` (matches glass aesthetic)
- Dimensions: Match expected content heights
  - Header: `h-16 w-32` (64px height, 128px width)
  - Progress: `h-3 w-full` (12px height, full width)
  - List items: `h-6 w-48` (24px height, ~192px width)

**Animation:** Skeleton has built-in pulse animation (no custom animation needed)

#### Empty State (Zero Points)

```tsx
if (totalPoints === 0) {
  return (
    <Card variant="glass" className={cn("text-center", className)}>
      <CardContent className="p-6 space-y-3">
        <div className="text-4xl" aria-hidden="true">🦘</div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            Start Earning Quokka Points!
          </h3>
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

**Card Variant:** `glass` (solid glass, no hover effect)

**Layout:**
- `text-center` - Center-align all content
- `space-y-3` - 12px vertical stack

**Typography:**
- Emoji: `text-4xl` (36px)
- Heading: `text-lg font-semibold text-foreground` (18px, weight 600)
- Description: `text-sm text-muted-foreground glass-text` (14px)

**Button:**
- Variant: `default` (primary color, filled)
- Uses Next.js Link component via `asChild`

### Hover States

```tsx
// Card hover (built into glass-hover variant)
// Blur: 12px → 16px
// Transform: translateY(0) → translateY(-2px)
// Shadow: shadow-glass-md → shadow-glass-lg
// Transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)

// Button hover
className="hover:text-accent-hover hover:bg-accent/10"
// Text color changes from accent to accent-hover
// Background fades in at 10% opacity
```

### Focus States

```tsx
// Button focus (inherits global focus ring)
// Outline: 2px solid --ring (accent color)
// Offset: 2px
// Shadow: 0 0 0 4px rgba(45, 108, 223, 0.3)
// On glass background: shadow enhanced to 0 0 0 4px rgba(45, 108, 223, 0.5)
```

### Disabled States

Not applicable (component has no disabled states).

### Animation Specifications

**Count-up Animation (Optional, JavaScript):**
```tsx
// Respects prefers-reduced-motion
const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (shouldAnimate) {
  // Animate from 0 to totalPoints over 800ms
  // Use requestAnimationFrame for smooth updates
  // Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
}
```

**Progress Bar Animation:**
```css
/* Built into Progress component */
.progress-indicator {
  transition: transform 320ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Card Hover Animation:**
```css
/* Built into glass-hover variant */
transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
```

### Dark Mode Specifics

**Automatic Token Adaptation:**
- `text-primary` → #C1A576 (lighter brown)
- `text-muted-foreground` → #B8AEA3 (lighter muted)
- `text-foreground` → #F3EFE8 (light cream)
- `bg-primary` (progress) → #C1A576
- `bg-primary/20` (progress track) → rgba(193,165,118,0.2)
- `glass-hover` background → rgba(23,21,17,0.7)
- `border-glass` → rgba(255,255,255,0.08)

**Enhanced Text Shadows:**
```css
.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* Stronger shadow in dark mode */
}
```

### Responsive Behavior

**Mobile (360px-640px):**
```tsx
// Point value: text-4xl instead of text-5xl
<span className="text-4xl md:text-5xl font-bold text-primary tabular-nums">

// Show top 2 sources instead of 3
{pointSources.slice(0, 2).map(...)}

// Hide sparkline if space constrained
{sparklineData && !isMobile && (
  <div>...</div>
)}
```

**Tablet (640px-1024px):**
- Standard layout (no changes)
- Show top 3 sources

**Desktop (1024px+):**
- Full layout with all details
- Sparkline always visible

**Responsive Classes:**
```tsx
<span className="text-4xl md:text-5xl ...">  // Larger on medium screens
<div className="hidden sm:flex ...">          // Hide on mobile
<div className="space-y-2 md:space-y-3 ..."> // More spacing on larger screens
```

---

## Component 2: QuickActionsPanel Updates

### Required Changes

#### Change 1: Conditional Icon Size and Background (Primary Emphasis)

**Current Code (Line 72-74):**
```tsx
<div className="flex items-center justify-center h-12 w-12 mx-auto rounded-full bg-muted">
  <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
</div>
```

**Updated Code:**
```tsx
{action.variant === "primary" ? (
  <div className="flex items-center justify-center h-14 w-14 mx-auto rounded-full bg-primary/20">
    <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
  </div>
) : (
  <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-full bg-muted">
    <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
  </div>
)}
```

**Styling Breakdown:**

**Primary Action (Ask AI):**
- Container: `h-14 w-14` (56px × 56px) - larger than default
- Background: `bg-primary/20` (20% opacity primary color)
  - Light: rgba(138,107,61,0.2)
  - Dark: rgba(193,165,118,0.2)
- Icon: `h-7 w-7 text-primary` (28px, primary color)
- Border radius: `rounded-full`

**Default Actions:**
- Container: `h-12 w-12` (48px × 48px) - standard size
- Background: `bg-muted` (--muted: neutral gray)
- Icon: `h-6 w-6 text-foreground` (24px, foreground color)
- Border radius: `rounded-full`

#### Change 2: Add Glow Effect to Primary Variant Hover

**Current Code (Line 63-67):**
```tsx
const variantClasses = {
  default: "hover:bg-muted hover:border-primary/30",
  primary: "hover:bg-primary/10 hover:border-primary",
  success: "hover:bg-success/10 hover:border-success",
};
```

**Updated Code:**
```tsx
const variantClasses = {
  default: "hover:bg-muted hover:border-primary/30 transition-all duration-[180ms]",
  primary: "hover:bg-primary/10 hover:border-primary hover:shadow-[var(--focus-shadow-primary)] transition-all duration-[240ms]",
  success: "hover:bg-success/10 hover:border-success transition-all duration-[180ms]",
};
```

**Styling Breakdown:**

**Primary Variant Hover:**
- Background: `hover:bg-primary/10` (10% opacity primary)
- Border: `hover:border-primary` (solid primary color)
- Shadow: `hover:shadow-[var(--focus-shadow-primary)]`
  - Light: `0 0 20px rgba(138, 107, 61, 0.15)`
  - Dark: `0 0 24px rgba(193, 165, 118, 0.2)`
- Transition: `transition-all duration-[240ms]` (240ms for smooth glow)

**Default/Success Variants Hover:**
- Transitions: `transition-all duration-[180ms]` (180ms standard hover)
- No glow effect (maintain existing behavior)

#### Change 3 (Optional): Add Tooltips to Badge Counts

**Current Code (Line 75-82):**
```tsx
{action.badgeCount && action.badgeCount > 0 && (
  <Badge
    variant="destructive"
    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
    aria-label={`${action.badgeCount} ${action.label.toLowerCase()}`}
  >
    {action.badgeCount}
  </Badge>
)}
```

**Updated Code:**
```tsx
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
        <p className="text-xs">
          {action.badgeCount} {action.label.toLowerCase()}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

**Required Imports:**
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
```

**Tooltip Styling:**
- Background: `bg-popover` (--popover: solid background)
- Border: `border border-border`
- Shadow: `shadow-e2` (elevation 2)
- Padding: `px-3 py-1.5` (12px horizontal, 6px vertical)
- Text: `text-xs` (12px)
- Radius: `rounded-md` (10px)
- Trigger: `asChild` (badge becomes trigger without extra wrapper)

**Tooltip Behavior:**
- Appears on hover after 300ms delay
- Positioned above badge by default
- Auto-adjusts if near viewport edge

### Existing Compliant Styling (No Changes)

**Card Container:**
```tsx
<Card variant="glass" className={className}>
  <CardContent className="p-6">
    ...
  </CardContent>
</Card>
```
✅ Already QDS compliant (glass variant, 24px padding)

**Grid Layout:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="group" aria-label="Quick actions">
```
✅ Already responsive (2 cols mobile, 4 cols desktop, 12px gap)

**Action Button Base:**
```tsx
className={cn(
  "flex flex-col items-center justify-center gap-3 p-4 rounded-lg border bg-card transition-all",
  variantClasses[action.variant || "default"]
)}
```
✅ Already QDS compliant (16px padding, 12px gap, rounded-lg)

**Badge Styling:**
```tsx
className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
```
✅ Already QDS compliant (20px badge, 12px text, absolute positioning)

### Dark Mode Behavior

**Automatic Adaptations:**
- `bg-primary/20` → rgba(193,165,118,0.2) in dark mode
- `text-primary` → #C1A576 in dark mode
- `bg-muted` → Dark neutral gray
- `shadow-[var(--focus-shadow-primary)]` → Uses dark mode focus shadow

**No manual dark mode classes needed** - all tokens adapt automatically.

### Hover State Summary

**Primary Action Hover:**
1. Background lightens: `bg-primary/20` → `bg-primary/10`
2. Border appears: `border-primary`
3. Glow effect: `shadow-[var(--focus-shadow-primary)]`
4. Transition: 240ms smooth

**Default Action Hover:**
1. Background appears: `bg-muted`
2. Border lightens: `border-primary/30`
3. Transition: 180ms

**Success Action Hover:**
1. Background tint: `bg-success/10`
2. Border: `border-success`
3. Transition: 180ms

### Focus State Summary

**All Actions:**
- Global focus ring: 2px solid accent color
- Offset: 2px
- Shadow: Enhanced on glass background
- Always visible (never remove focus indicators)

### Responsive Behavior

**Mobile (360px-640px):**
- Grid: 2 columns (`grid-cols-2`)
- Action cards: Smaller but touch-friendly (min 44×44px target)

**Tablet/Desktop (768px+):**
- Grid: 4 columns (`md:grid-cols-4`)
- Action cards: Full size with optimal spacing

---

## Component 3: AssignmentQAOpportunities

### Complete Styling Specification

#### Outer Container (Timeline List)

```tsx
<ol
  className={cn("relative space-y-4", className)}
  aria-label="Assignment Q&A opportunities timeline"
>
```

**Tailwind Classes:**
- `relative` - Positioning context for timeline connector lines
- `space-y-4` - 16px vertical spacing between timeline items (QDS spacing)

**Semantic HTML:** `<ol>` (ordered list, not div) for timeline structure

#### Timeline Item (Internal Component)

```tsx
<li className="relative flex gap-4">
  {/* Timeline dot container */}
  <div className="relative flex flex-col items-center shrink-0">
    <div
      className={cn(
        "size-4 rounded-full border-2 border-background z-10",
        dotColor
      )}
      aria-label={`Urgency: ${urgencyLevel}`}
    />
    {showConnector && (
      <div
        className="w-px flex-1 bg-border absolute top-3"
        style={{ height: "calc(100% + 1rem)" }}
        aria-hidden="true"
      />
    )}
  </div>

  {/* Card content */}
  <div className="flex-1 pb-4">
    <Card variant="glass-hover" className="h-full">
      ...
    </Card>
  </div>
</li>
```

**Layout Classes:**
- List item: `relative flex gap-4` (horizontal layout, 16px gap)
- Dot container: `relative flex flex-col items-center shrink-0`
  - `shrink-0` - Prevents dot column from shrinking
- Card wrapper: `flex-1 pb-4` (takes remaining space, 16px bottom padding)

**Timeline Dot:**
- Size: `size-4` (16px × 16px)
- Shape: `rounded-full` (circle)
- Border: `border-2 border-background` (2px white/dark border creates ring effect)
- Z-index: `z-10` (above connector line)
- Color: Dynamic based on urgency (see Color Logic below)

**Timeline Connector:**
- Width: `w-px` (1px line)
- Height: `calc(100% + 1rem)` (extends to next item with 16px overlap)
- Color: `bg-border` (--border: #CDC7BD light / rgba(243,239,232,0.1) dark)
- Position: `absolute top-3` (starts 12px below dot center)
- Accessibility: `aria-hidden="true"` (visual only, no semantic meaning)

#### Timeline Dot Color Logic

```tsx
const urgencyLevel =
  unansweredQuestions >= 5 ? "urgent" :
  unansweredQuestions >= 1 ? "opportunity" :
  activeStudents >= 10 ? "active" :
  "resolved";

const dotColor =
  unansweredQuestions >= 5 ? "bg-danger" :    // Red: Urgent help needed
  unansweredQuestions >= 1 ? "bg-warning" :   // Yellow: Opportunity to help
  activeStudents >= 10 ? "bg-accent" :        // Blue: Active discussion
  "bg-success";                                // Green: All resolved
```

**Color Token Mapping:**
- Danger: `bg-danger` (--danger: #D92D20)
- Warning: `bg-warning` (--warning: #B45309)
- Accent: `bg-accent` (--accent: #2D6CDF light / #86A9F6 dark)
- Success: `bg-success` (--success: #2E7D32)

**Accessibility:** `aria-label` describes urgency level (not just color).

#### Card Container

```tsx
<Card variant="glass-hover" className="h-full">
  <CardContent className="p-4 space-y-3">
    ...
  </CardContent>
</Card>
```

**Card Variant:** `glass-hover`
- Backdrop blur: 12px → 16px on hover
- Lift effect: translateY(-2px)
- Shadow: shadow-glass-md → shadow-glass-lg

**Content Padding:** `p-4` (16px) - tighter than typical p-6 for compact timeline

**Vertical Spacing:** `space-y-3` (12px) - compact sections

#### Card Header (Assignment Info)

```tsx
<div className="space-y-1">
  <h3 className="text-base font-semibold glass-text leading-snug">
    {assignment.title}
  </h3>
  <div className="flex items-center gap-2 text-sm text-muted-foreground glass-text">
    <span>{assignment.courseName}</span>
    <span aria-hidden="true">•</span>
    <time dateTime={assignment.dueDate}>
      {relativeDueDate}
    </time>
  </div>
</div>
```

**Typography:**
- Title: `text-base font-semibold glass-text leading-snug`
  - Size: 16px (text-base)
  - Weight: 600 (font-semibold)
  - Line height: leading-snug (1.375)
  - Shadow: .glass-text utility

- Metadata: `text-sm text-muted-foreground glass-text`
  - Size: 14px (text-sm)
  - Color: --muted-foreground
  - Shadow: .glass-text

**Layout:**
- `space-y-1` - 4px gap between title and metadata
- `flex items-center gap-2` - Horizontal layout, 8px gaps
- Separator: `•` (bullet character) with `aria-hidden="true"`

**Semantic HTML:** `<time dateTime={ISO 8601}>` for accessibility

#### Q&A Metrics Grid

```tsx
<div className="grid grid-cols-2 gap-2 text-sm">
  <div className="flex items-center gap-1.5">
    <MessageSquare className="h-4 w-4 text-muted-foreground" />
    <span className="glass-text">{totalQuestions} questions</span>
  </div>
  <div className="flex items-center gap-1.5">
    <AlertCircle className="h-4 w-4 text-warning" />
    <span className="glass-text">{unansweredQuestions} unanswered</span>
  </div>
  <div className="flex items-center gap-1.5">
    <Sparkles className="h-4 w-4 text-accent" />
    <span className="glass-text">{aiAnswersAvailable} AI answers</span>
  </div>
  <div className="flex items-center gap-1.5">
    <Users className="h-4 w-4 text-muted-foreground" />
    <span className="glass-text">{activeStudents} discussing</span>
  </div>
</div>
```

**Grid Layout:**
- `grid grid-cols-2 gap-2` - 2 columns, 8px gap (4×2 grid on mobile)
- `text-sm` - 14px text size for all metrics

**Metric Item:**
- `flex items-center gap-1.5` - Horizontal, 6px gap (tight spacing)
- Icon: `h-4 w-4` (16px) with semantic color
  - Total questions: `text-muted-foreground`
  - Unanswered: `text-warning` (emphasizes urgency)
  - AI answers: `text-accent` (emphasizes AI feature)
  - Active students: `text-muted-foreground`
- Text: `.glass-text` utility for readability

#### Your Activity Badge (Optional)

```tsx
{(assignment.yourQuestions > 0 || assignment.yourAnswers > 0) && (
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="text-xs">
      Your Activity: {assignment.yourQuestions} questions, {assignment.yourAnswers} answers
    </Badge>
  </div>
)}
```

**Badge Styling:**
- Variant: `outline` (transparent bg, border)
- Text: `text-xs` (12px)
- Padding: Built into Badge component (px-2.5 py-0.5)
- Border: `border-border` color
- Radius: `rounded-md` (10px)

**Conditional Rendering:** Only show if student has activity (either questions OR answers > 0).

#### Suggested Action Callout

```tsx
<div className={cn(
  "flex items-start gap-2 p-3 rounded-lg",
  assignment.suggestedAction === "answer" ? "bg-warning/10 border border-warning/30" :
  assignment.suggestedAction === "ask" ? "bg-accent/10 border border-accent/30" :
  "bg-muted/50 border border-border"
)}>
  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
  <span className="text-sm glass-text">{assignment.actionReason}</span>
</div>
```

**Layout:**
- `flex items-start gap-2` - Horizontal, 8px gap, align top (for multi-line text)
- `p-3 rounded-lg` - 12px padding, 16px border radius

**Color-Coded Backgrounds (Action-Based):**

**Answer Urgency (Most Common):**
- Background: `bg-warning/10` (10% opacity warning color)
  - Light: rgba(180, 83, 9, 0.1)
  - Dark: rgba(180, 83, 9, 0.1)
- Border: `border border-warning/30` (30% opacity warning)
- Icon: `text-warning` (AlertCircle)

**Ask Prompt:**
- Background: `bg-accent/10` (10% opacity accent color)
  - Light: rgba(45, 108, 223, 0.1)
  - Dark: rgba(134, 169, 246, 0.1)
- Border: `border border-accent/30` (30% opacity accent)
- Icon: `text-accent`

**Review (All Resolved):**
- Background: `bg-muted/50` (50% opacity muted)
- Border: `border border-border` (standard border)
- Icon: `text-muted-foreground`

**Icon Styling:**
- `h-4 w-4 shrink-0 mt-0.5` (16px, won't shrink, 2px top margin for alignment)

**Text:**
- `text-sm glass-text` (14px, text shadow for readability)

#### CTA Buttons

```tsx
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
```

**Layout:**
- `flex gap-2` - Horizontal, 8px gap between buttons

**Button Variants:**

**Primary CTA (Ask Question):**
- Size: `sm` (32px height, 12px vertical padding)
- Variant: `default` (filled primary color)
- Background: `bg-primary` (--primary)
- Text: `text-primary-foreground` (#FFFFFF light / #2A2721 dark)
- Hover: `hover:bg-primary-hover`

**Secondary CTA (Help Answer):**
- Size: `sm`
- Variant: `outline` (transparent bg, primary border)
- Border: `border-primary`
- Text: `text-primary`
- Hover: `hover:bg-primary/10`

**Tertiary CTA (View All Q&A):**
- Size: `sm`
- Variant: `ghost` (transparent bg, no border)
- Text: `text-foreground`
- Hover: `hover:bg-muted`

**Link Integration:**
- Uses Next.js Link via `asChild` prop
- Query params: `?action=ask` or `?action=answer` for context

#### Loading State

```tsx
if (loading) {
  return (
    <div className={cn("space-y-4", className)}>
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

**Skeleton Structure:**
- Timeline dot: `size-4 rounded-full bg-glass-medium shrink-0`
- Card: `h-48 flex-1 bg-glass-medium rounded-lg` (192px height, full width)
- Background: `bg-glass-medium` (matches glass aesthetic)
- Count: 3 skeleton items (consistent with maxItems default)

#### Empty State

```tsx
if (assignments.length === 0) {
  return (
    <Card variant="glass" className={cn("p-6 text-center", className)}>
      <div className="space-y-2">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground glass-text">
          {emptyMessage || "No upcoming assignments"}
        </p>
      </div>
    </Card>
  );
}
```

**Card Variant:** `glass` (solid, no hover effect)

**Layout:**
- `p-6 text-center` - 24px padding, center-aligned content
- `space-y-2` - 8px vertical spacing

**Icon:**
- `mx-auto h-8 w-8 text-muted-foreground` (32px, centered, muted color)

**Text:**
- `text-sm text-muted-foreground glass-text` (14px, muted, text shadow)

### Hover States

**Card Hover (glass-hover variant):**
- Blur: 12px → 16px
- Transform: translateY(0) → translateY(-2px)
- Shadow: shadow-glass-md → shadow-glass-lg
- Transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)

**Button Hover:**
- Primary: Background darkens to `--primary-hover`
- Outline: Background fades in at `bg-primary/10`
- Ghost: Background fades in at `bg-muted`

### Focus States

**Button Focus:**
- Global focus ring: 2px solid accent
- Offset: 2px
- Shadow: Enhanced on glass backgrounds

**Link Focus:**
- If card is wrapped in Link, entire card gets focus ring

### Responsive Behavior

**Mobile (360px-640px):**
```tsx
// Metrics grid: 1 column instead of 2
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">

// Timeline dots: Slightly smaller
<div className="size-3 md:size-4 rounded-full ...">

// CTA buttons: Stack vertically
<div className="flex flex-col sm:flex-row gap-2">

// Hide "Your Activity" badge if space constrained
{(yourQuestions > 0 || yourAnswers > 0) && !isMobile && (
  <Badge>...</Badge>
)}
```

**Tablet (640px-1024px):**
- Standard 2-column metrics grid
- Horizontal CTA buttons

**Desktop (1024px+):**
- Full layout with all details
- Optimal spacing and readability

**Responsive Classes:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">  // Mobile: 1 col, Tablet+: 2 cols
<div className="flex flex-col sm:flex-row gap-2">        // Mobile: stack, Tablet+: inline
<div className="hidden sm:block">                         // Hide on mobile
```

### Dark Mode Specifics

**Automatic Token Adaptations:**
- `bg-danger` → #D92D20 (absolute value, works in both themes)
- `bg-warning` → #B45309
- `bg-accent` → #86A9F6 in dark mode
- `bg-success` → #2E7D32
- `text-muted-foreground` → #B8AEA3 in dark
- `bg-border` (connector line) → rgba(243, 239, 232, 0.1) in dark
- `glass-hover` → Dark glass surface rgba(23,21,17,0.7)

**Enhanced Text Shadows:**
```css
.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**Action Callout Backgrounds (Dark Mode):**
- `bg-warning/10` → rgba(180, 83, 9, 0.1) (same in dark, warning color is absolute)
- `bg-accent/10` → rgba(134, 169, 246, 0.1) in dark (uses dark mode accent)
- `bg-muted/50` → Uses dark muted color at 50% opacity

### Performance Optimization

**Problem:** 5 cards × glass-hover = 5 blur layers (exceeds 3-layer guideline)

**Solution: Limit Visible Cards**
```tsx
const [showAll, setShowAll] = useState(false);
const visibleAssignments = showAll
  ? filteredAssignments
  : filteredAssignments.slice(0, 3);

return (
  <>
    <ol className="relative space-y-4">
      {visibleAssignments.map((assignment, index) => (
        <AssignmentQAItem key={assignment.id} ... />
      ))}
    </ol>

    {filteredAssignments.length > 3 && !showAll && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAll(true)}
        className="w-full mt-2"
      >
        Show {filteredAssignments.length - 3} More Assignments
      </Button>
    )}
  </>
);
```

**Benefits:**
- Reduces blur layers to 3 (within QDS guideline)
- Improves initial render performance
- Better UX (less overwhelming)

---

## Shared Styling Patterns

### Glass Text Utility

**Purpose:** Enhance text readability on glass backgrounds

**Usage:**
```tsx
<p className="text-sm text-muted-foreground glass-text">
  Text content here
</p>
```

**Implementation (globals.css):**
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**When to Use:**
- All text on `glass-panel`, `glass-panel-strong`, `glass-overlay` backgrounds
- All text in components with `variant="glass"` or `variant="glass-hover"`
- Muted foreground text (secondary text)
- Metadata text (timestamps, course names, labels)

**When NOT to Use:**
- Text on solid backgrounds (no glass effect)
- Already high-contrast text (e.g., heading on white card)
- Icon-only elements

### Tabular Numerals

**Purpose:** Consistent digit width for numeric displays

**Usage:**
```tsx
<span className="text-5xl font-bold text-primary tabular-nums">
  {totalPoints}
</span>
```

**When to Use:**
- Large numeric displays (point values, stats, counts)
- Progress percentages
- Animated counters
- Side-by-side numbers (alignment)

**Font Feature:**
```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

**Effect:** All digits have equal width (0-9 same width), preventing layout shifts during count-up animations.

### Icon + Text Pattern

**Purpose:** Consistent icon-text pairing across components

**Usage:**
```tsx
<div className="flex items-center gap-1.5">
  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
  <span className="text-sm glass-text">Label text</span>
</div>
```

**Layout:**
- `flex items-center` - Horizontal, vertical center
- `gap-1.5` - 6px gap (tight spacing for small icons)
- `gap-2` - 8px gap (standard spacing for medium icons)

**Icon:**
- Size: `h-4 w-4` for small icons (16px), `h-5 w-5` for medium (20px)
- Color: Semantic (`text-muted-foreground`, `text-primary`, `text-warning`, etc.)
- `shrink-0` - Prevents icon from shrinking if text wraps

**Text:**
- Size: `text-sm` (14px) or `text-xs` (12px) for captions
- `.glass-text` if on glass background

### Card Variant Selection

**glass** (Solid Glass, No Hover):
- **Use for:** Static content cards, empty states, loading states
- **Effect:** Backdrop blur, glass surface, no hover effect
- **Example:** Empty state cards, info panels

**glass-hover** (Interactive Glass):
- **Use for:** Clickable cards, timeline items, interactive panels
- **Effect:** Blur intensifies on hover, lift animation
- **Example:** QuokkaPointsCard, AssignmentQA cards, StudyStreakCard

**glass-strong** (Strong Glass):
- **Use for:** Overlays, modals, important elevated content
- **Effect:** Stronger blur (16px), more opaque glass
- **Example:** Modals, floating panels (not used in these components)

**glass-panel** (Utility Class):
- **Use for:** Custom glass surfaces when Card component not needed
- **Effect:** Same as `glass` variant, but utility class
- **Example:** Custom containers, loading states

### Skeleton Styling for Glass

**Purpose:** Loading states that match glass aesthetic

**Standard Skeleton (Non-Glass):**
```tsx
<Skeleton className="h-10 w-32" />  // Default gray background
```

**Glass Skeleton:**
```tsx
<Skeleton className="h-10 w-32 bg-glass-medium" />  // Matches glass surface
```

**When to Use:**
- Loading states inside glass-variant Cards
- Skeletons on glass backgrounds
- Maintaining visual consistency during load

**Background Color:**
- `bg-glass-medium` - Standard glass skeleton
- Respects light/dark mode automatically

---

## Dark Mode Implementation

### Automatic Token Adaptation

All QDS tokens automatically adapt to dark mode without manual intervention:

**Color Tokens:**
```tsx
// Light mode → Dark mode
text-primary       // #8A6B3D → #C1A576
text-secondary     // #5E7D4A → #96B380
text-accent        // #2D6CDF → #86A9F6
text-foreground    // #2A2721 → #F3EFE8
text-muted-foreground // #625C52 → #B8AEA3
bg-card            // #FFFFFF → #171511
border-border      // #CDC7BD → rgba(243,239,232,0.1)
```

**Glass Tokens:**
```tsx
// Light mode → Dark mode
--glass-medium     // rgba(255,255,255,0.7) → rgba(23,21,17,0.7)
--glass-strong     // rgba(255,255,255,0.6) → rgba(23,21,17,0.6)
--border-glass     // rgba(255,255,255,0.18) → rgba(255,255,255,0.08)
--shadow-glass-md  // Light diffuse → Stronger diffuse
```

**Focus Shadows:**
```tsx
--focus-shadow-primary    // Light glow → Stronger glow in dark
--focus-shadow-accent     // Light glow → Stronger glow in dark
```

### Enhanced Text Shadows

**Light Mode:**
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

**Dark Mode:**
```css
.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**Why Stronger in Dark Mode:** Dark glass surfaces have less contrast with text, requiring more shadow for readability.

### Focus Indicator Enhancement

**Light Mode:**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```

**Dark Mode:**
```css
.dark *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4);
}
```

**On Glass Backgrounds:**
```css
.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}

.dark .glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.6);
}
```

**Why Enhanced:** Glass backgrounds reduce contrast, so focus rings need stronger glow for visibility.

### Dark Mode Testing Checklist

**QuokkaPointsCard:**
- [ ] Point value (#F3EFE8) readable on dark glass
- [ ] Primary color (#C1A576) contrasts with dark card
- [ ] Muted foreground text meets 4.5:1 minimum
- [ ] Progress bar fill visible (primary on dark track)
- [ ] Glass text shadows enhance readability
- [ ] Background decoration visible but subtle
- [ ] "View Details" button accent color visible

**QuickActionsPanel:**
- [ ] Action labels readable on dark glass
- [ ] Icon backgrounds distinguishable
- [ ] Primary action emphasis visible (#C1A576)
- [ ] Badge stands out (red on dark)
- [ ] Hover states visible
- [ ] Focus indicators clear on glass

**AssignmentQAOpportunities:**
- [ ] Timeline dots visible on dark background
- [ ] Card glass readable with text
- [ ] Assignment titles high contrast
- [ ] Course names readable (muted)
- [ ] Metrics icons and text legible
- [ ] Action callouts distinct
- [ ] CTA buttons visible
- [ ] Connector line visible but subtle

---

## Responsive Breakpoints

### QDS Breakpoints

```tsx
xs:  360px  // Mobile small (not used in Tailwind by default)
sm:  640px  // Mobile large
md:  768px  // Tablet
lg:  1024px // Desktop
xl:  1280px // Desktop large
2xl: 1536px // Desktop XL
```

### Component-Specific Responsive Behavior

#### QuokkaPointsCard

**Mobile (< 640px):**
```tsx
// Point value: Smaller
<span className="text-4xl sm:text-5xl font-bold text-primary tabular-nums">

// Point sources: Show fewer
{pointSources.slice(0, isMobile ? 2 : 3).map(...)}

// Sparkline: Hide on very small screens
{sparklineData && (
  <div className="hidden xs:flex items-center justify-between ...">
    ...
  </div>
)}
```

**Tablet (640px - 1024px):**
- Standard layout (text-5xl)
- Show 3 point sources
- Sparkline visible

**Desktop (1024px+):**
- Full layout
- All features visible

#### QuickActionsPanel

**Mobile (< 768px):**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```
- 2 columns (Ask AI + Browse Q&A top row, Help Answer + Share bottom row)
- Primary action still emphasized (larger icon)

**Desktop (768px+):**
- 4 columns (all actions in single row)
- Optimal spacing

#### AssignmentQAOpportunities

**Mobile (< 640px):**
```tsx
// Metrics grid: Single column
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

// Timeline dots: Slightly smaller
<div className="size-3 sm:size-4 rounded-full ...">

// CTA buttons: Stack vertically
<div className="flex flex-col sm:flex-row gap-2">

// Your Activity badge: Hide if space tight
<div className="hidden sm:flex items-center gap-2">
  <Badge>Your Activity: ...</Badge>
</div>
```

**Tablet (640px - 1024px):**
- 2-column metrics grid
- Standard timeline dot size (16px)
- Horizontal CTA buttons

**Desktop (1024px+):**
- Full layout
- All details visible

### Responsive Typography

**Heading Scaling:**
```tsx
// Large headings scale down on mobile
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">

// Body text generally stays same size
<p className="text-sm md:text-sm">  // No change needed
```

**Responsive Spacing:**
```tsx
// More generous spacing on larger screens
<div className="space-y-2 md:space-y-3">  // 8px mobile, 12px desktop
<div className="gap-3 md:gap-4">          // 12px mobile, 16px desktop
```

---

## Animation Specifications

### Transition Durations (QDS Standard)

```css
--duration-fast:   120ms  /* Taps, toggles */
--duration-medium: 180ms  /* Hover, focus */
--duration-slow:   240ms  /* Overlays, dropdowns */
--duration-page:   320ms  /* Page transitions */
```

### Easing Functions (QDS Standard)

```css
--ease-in-out: cubic-bezier(0.2, 0.8, 0.2, 1)  /* Default smooth */
--ease-out:    cubic-bezier(0.4, 0.0, 1.0, 1)  /* Exits */
```

### Component-Specific Animations

#### QuokkaPointsCard

**Count-Up Animation (JavaScript):**
```tsx
// Optional animation for totalPoints
// Duration: 800ms
// Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
// Respects prefers-reduced-motion

useEffect(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    setDisplayValue(totalPoints);
    return;
  }

  // Animate from 0 (or prev value) to totalPoints
  const duration = 800;
  const startTime = performance.now();
  const startValue = displayValue;
  const delta = totalPoints - startValue;

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const current = startValue + delta * easedProgress;

    setDisplayValue(Math.round(current));

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}, [totalPoints]);
```

**Progress Bar Animation:**
```css
/* Built into Progress component */
.progress-indicator {
  transition: transform 320ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Card Hover (glass-hover variant):**
```css
transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1);

/* On hover */
backdrop-filter: blur(16px);
transform: translateY(-2px);
box-shadow: var(--shadow-glass-lg);
```

#### QuickActionsPanel

**Primary Action Glow:**
```tsx
className="hover:shadow-[var(--focus-shadow-primary)] transition-all duration-[240ms]"
```

**Standard Hover:**
```tsx
className="transition-all duration-[180ms]"
```

**Easing:** Uses default Tailwind easing (cubic-bezier(0.4, 0.0, 0.2, 1))

#### AssignmentQAOpportunities

**Card Hover (glass-hover variant):**
```css
transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
```

**Button Hover:**
```css
transition: background-color 180ms cubic-bezier(0.4, 0.0, 0.2, 1),
            border-color 180ms cubic-bezier(0.4, 0.0, 0.2, 1);
```

### Reduced Motion Support

**CSS Media Query:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable specific animations */
  .animate-liquid,
  .animate-liquid-float,
  .animate-glass-shimmer {
    animation: none !important;
  }
}
```

**JavaScript Detection:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Skip animations
  setDisplayValue(totalPoints);
} else {
  // Run animations
  animateCountUp();
}
```

**Component Implementation:**
- QuokkaPointsCard: Skip count-up animation
- All components: Instant transitions (0.01ms) instead of smooth
- No decorative animations (liquid morphing, shimmer, etc.)

---

## Performance Optimizations

### Glass Effect Performance

**QDS Guideline:** Maximum 3 blur layers per view

**Current Dashboard Blur Count:**
- StudyStreakCard: 1 layer (glass-hover)
- StatCard (×4): 4 layers (glass-panel)
- QuickActionsPanel: 1 layer (glass)
- UpcomingDeadlines (×3): 3 layers (glass-hover)
- EnhancedCourseCard (×6): 6 layers
- **Total:** 15 layers

**New Components:**
- QuokkaPointsCard: 1 layer (replaces StudyStreakCard: net 0)
- QuickActionsPanel: 1 layer (unchanged)
- AssignmentQAOpportunities: 3-5 layers (depends on visible cards)

**⚠️ Performance Concern:** AssignmentQAOpportunities can add up to 5 layers if all cards visible.

### Optimization Strategy

**Implementation:**
```tsx
const [showAll, setShowAll] = useState(false);
const maxVisible = 3;

const visibleAssignments = React.useMemo(() => {
  const filtered = courseId
    ? assignments.filter(a => a.courseId === courseId)
    : assignments;

  return showAll ? filtered : filtered.slice(0, maxVisible);
}, [assignments, courseId, showAll]);

return (
  <>
    <ol className="relative space-y-4">
      {visibleAssignments.map((assignment, index) => (
        <AssignmentQAItem key={assignment.assignmentId} ... />
      ))}
    </ol>

    {filteredAssignments.length > maxVisible && !showAll && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAll(true)}
        className="w-full mt-2 text-accent hover:text-accent-hover"
      >
        Show {filteredAssignments.length - maxVisible} More Assignments
      </Button>
    )}
  </>
);
```

**Benefits:**
- Reduces initial blur layers from 5 to 3
- Maintains QDS 3-layer guideline
- Improves initial render performance
- Better UX (less overwhelming)

**User Experience:**
- Most important 3 assignments visible immediately
- "Show More" button loads remaining assignments on demand
- Button styling: Ghost variant, accent color, full width

### GPU Acceleration

**QDS Auto-Applied (globals.css):**
```css
.glass-panel,
.glass-panel-strong,
.glass-overlay {
  will-change: backdrop-filter;
  contain: layout style paint;
  transform: translateZ(0);
}
```

**Effect:**
- `will-change: backdrop-filter` - Pre-allocates GPU memory for blur
- `contain: layout style paint` - Isolates component for faster repaints
- `transform: translateZ(0)` - Forces hardware acceleration

**No Additional Work Needed:** All glass variants automatically optimized.

### React Memoization

**QuokkaPointsCard:**
```tsx
const nextMilestone = React.useMemo(() =>
  milestones.find(m => !m.achieved),
  [milestones]
);

const progressPercent = React.useMemo(() => {
  const prevMilestone = milestones.filter(m => m.achieved).pop();
  const prevThreshold = prevMilestone?.threshold || 0;
  const nextThreshold = nextMilestone?.threshold || 0;

  if (nextThreshold === 0) return 100;

  return ((totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
}, [totalPoints, milestones, nextMilestone]);
```

**AssignmentQAOpportunities:**
```tsx
const filteredAssignments = React.useMemo(() => {
  const filtered = courseId
    ? assignments.filter(a => a.courseId === courseId)
    : assignments;
  return filtered.slice(0, maxItems);
}, [assignments, courseId, maxItems]);

const getRelativeDueDate = React.useCallback((dueDate: string) => {
  const date = new Date(dueDate);
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}, []);
```

**React.memo for Internal Components:**
```tsx
const AssignmentQAItem = React.memo(({ assignment, showConnector }: AssignmentQAItemProps) => {
  // Component implementation
});
```

**Effect:** Only re-renders when props actually change, not when parent re-renders.

---

## Final Implementation Checklist

### QuokkaPointsCard

**Structure:**
- [ ] Card with `variant="glass-hover"` and `className="relative overflow-hidden"`
- [ ] Background decoration at `opacity-10` with `aria-hidden="true"`
- [ ] CardContent with `p-6 relative z-10`

**Typography:**
- [ ] All glass-background text uses `.glass-text` utility
- [ ] Point value: `text-5xl font-bold text-primary tabular-nums`
- [ ] Labels: `text-sm font-medium text-muted-foreground`
- [ ] Responsive: `text-4xl sm:text-5xl` for mobile

**Spacing:**
- [ ] All spacing uses QDS 4pt grid (gap-1, gap-2, gap-3, gap-4)
- [ ] Card padding: `p-6` (24px)
- [ ] Section gaps: `space-y-2` or `space-y-3`

**Components:**
- [ ] Progress component with `className="h-3"` override
- [ ] MiniSparkline with `variant="success"`
- [ ] Button with `variant="ghost" size="sm"`

**States:**
- [ ] Loading state with `bg-glass-medium` Skeletons
- [ ] Empty state (zero points) with CTA
- [ ] Hover state (inherited from glass-hover)
- [ ] Focus state (global focus ring)

**Accessibility:**
- [ ] `role="region" aria-labelledby` on container
- [ ] `aria-label` on Progress with percentage
- [ ] `aria-label="Point sources breakdown"` on list
- [ ] Semantic HTML (`<ol>`, `<time>`, etc.)

**Dark Mode:**
- [ ] All tokens auto-adapt (no manual dark classes)
- [ ] Enhanced glass text shadows in dark mode
- [ ] Focus indicators enhanced on glass backgrounds

---

### QuickActionsPanel Updates

**Required Changes:**
- [ ] Conditional icon size/background based on `action.variant === "primary"`
  - [ ] Primary: `h-14 w-14 bg-primary/20` container, `h-7 w-7 text-primary` icon
  - [ ] Default: `h-12 w-12 bg-muted` container, `h-6 w-6 text-foreground` icon
- [ ] Add glow to primary variant: `hover:shadow-[var(--focus-shadow-primary)]`
- [ ] Add transition: `transition-all duration-[240ms]` for primary, `duration-[180ms]` for others

**Optional Enhancement:**
- [ ] Wrap Badge in Tooltip component
- [ ] Import Tooltip components from `@/components/ui/tooltip`
- [ ] TooltipContent with `text-xs` class

**Testing:**
- [ ] Primary action (Ask AI) visually emphasized
- [ ] Hover glow visible on primary action
- [ ] Badge tooltips appear on hover (if implemented)
- [ ] All variants maintain existing behavior
- [ ] Dark mode: primary emphasis visible

---

### AssignmentQAOpportunities

**Structure:**
- [ ] Semantic `<ol>` with `aria-label`
- [ ] Timeline dots: `size-4 rounded-full border-2 border-background`
- [ ] Connector lines: `w-px bg-border absolute top-3`
- [ ] Cards: `variant="glass-hover" className="h-full"`

**Typography:**
- [ ] All text uses `.glass-text` utility
- [ ] Title: `text-base font-semibold glass-text leading-snug`
- [ ] Metadata: `text-sm text-muted-foreground glass-text`

**Spacing:**
- [ ] Timeline items: `space-y-4` (16px)
- [ ] Card padding: `p-4` (16px, tighter than p-6)
- [ ] Metrics grid: `grid-cols-2 gap-2`

**Color Logic:**
- [ ] Timeline dot urgency colors (danger/warning/accent/success)
- [ ] Suggested action backgrounds (warning/10, accent/10, muted/50)
- [ ] Icon colors match urgency/action type

**States:**
- [ ] Loading state with timeline dot + card Skeletons (`bg-glass-medium`)
- [ ] Empty state with Calendar icon + message
- [ ] Hover state (inherited from glass-hover)

**Performance:**
- [ ] Limit visible cards to 3 by default
- [ ] "Show More" button if > 3 assignments
- [ ] React.memo on internal components

**Accessibility:**
- [ ] `aria-label` on timeline dots with urgency level
- [ ] `<time dateTime={ISO 8601}>` for dates
- [ ] `role="status" aria-live="polite"` for unanswered count
- [ ] Semantic HTML structure

**Responsive:**
- [ ] Mobile: 1-column metrics grid, smaller dots, stacked CTAs
- [ ] Tablet: 2-column grid, standard dots, inline CTAs
- [ ] Desktop: Full layout

**Dark Mode:**
- [ ] All tokens auto-adapt
- [ ] Timeline dots maintain contrast on dark backgrounds
- [ ] Enhanced glass text shadows
- [ ] Action callout backgrounds adapt

---

**END OF QDS STYLING IMPLEMENTATION GUIDE**

All styling specifications are QDS 2.0 compliant and ready for implementation.

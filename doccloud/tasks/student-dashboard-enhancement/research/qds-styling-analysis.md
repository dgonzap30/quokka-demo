# QDS Styling Analysis: Student Dashboard Components

**Date:** 2025-10-12
**Auditor:** QDS Compliance Agent
**Scope:** Student dashboard enhancement components

---

## Executive Summary

Analyzed existing QDS patterns in `enhanced-course-card.tsx`, `timeline-activity.tsx`, `trending-topics-widget.tsx`, and instructor dashboard widgets to establish consistent styling guidelines for 5 new student dashboard components.

**Key Findings:**
- **Glass effects** are the dominant aesthetic (glass-panel, glass-hover, glass-strong)
- **Color palette** uses semantic tokens with primary/secondary/accent hierarchy
- **Spacing rhythm** follows 4pt grid consistently (gap-2, gap-3, gap-4, gap-6, gap-8)
- **Dark mode** is fully supported via CSS custom properties
- **Accessibility** is prioritized (glass-text shadows, focus states, ARIA labels)

---

## Existing QDS Patterns Inventory

### 1. Glass Surface Usage

**Pattern:** Glass effects create depth and hierarchy while maintaining translucency

#### EnhancedCourseCard (lines 67, 97-98)
```tsx
// Loading state
<Card className="glass-panel h-[220px]" />

// Active state
<Card variant="glass-hover"
  className="group min-h-[220px] hover:scale-[1.03] hover:shadow-[var(--glow-primary)]"
/>
```

**Tokens used:**
- `glass-panel` - Medium glass background with 12px blur
- `glass-hover` - Interactive glass that intensifies on hover
- `--glow-primary` - Warm brown glow (rgba(138, 107, 61, 0.15))

#### TimelineActivity (lines 124, 162)
```tsx
// Empty state
<Card variant="glass" className="p-6 text-center" />

// Activity cards
<Card variant="glass-hover" className="h-full" />
```

**Pattern:** Empty states use static glass, interactive elements use glass-hover

---

### 2. Color Token Hierarchy

**Primary (Quokka Brown #8A6B3D):**
- Main CTAs and emphasis
- Course icons (`bg-primary/10`, `text-primary`)
- Ranking badges (`bg-primary`, `text-primary-foreground`)
- Hover states (`text-primary-hover`)

**Secondary (Rottnest Olive #5E7D4A):**
- Supporting actions
- Success states (answered threads, resolved status)

**Accent (Clear Sky #2D6CDF):**
- Links and focus indicators
- Informational badges

**Support Colors:**
- `success` (#2E7D32) - Positive feedback, falling trends
- `warning` (#B45309) - Caution states, unanswered counts
- `danger` (#D92D20) - Errors, rising trends (urgent attention)
- `info` (#2563EB) - Informational messages

**Neutral:**
- `muted` - Secondary text (#625C52 light, #B8AEA3 dark)
- `border` - Component boundaries
- `muted-foreground` - Metadata, helper text

---

### 3. Spacing Scale Application

**Consistent patterns observed:**

| Use Case | Spacing | Example |
|----------|---------|---------|
| Card padding | `p-6` (24px) | All card content areas |
| Card header padding | `p-4` (16px) | Tighter for headers |
| Section gaps | `gap-6` (24px), `gap-8` (32px) | Between major sections |
| Component spacing | `space-y-3` (12px), `space-y-4` (16px) | Vertical rhythm |
| Inline elements | `gap-2` (8px), `gap-3` (12px) | Icon+text, badges |
| Grid gaps | `gap-2` (8px), `gap-4` (16px) | Stats grids, lists |

**Key principle:** Tighter spacing (gap-2, gap-3) for related items, wider spacing (gap-6, gap-8) for distinct sections.

---

### 4. Border Radius Scale

**Component-specific usage:**

| Component Type | Radius | Token |
|----------------|--------|-------|
| Cards | 16px | `rounded-xl` |
| Buttons, inputs | 10px | `rounded-md` |
| Badges | 10px | `rounded-md` |
| Icons containers | 16px | `rounded-lg` |
| Timeline dots | Full | `rounded-full` |
| Modals | 24px | `rounded-2xl` |

**Pattern:** Larger components (cards) use larger radii (xl, 2xl), smaller components (badges, buttons) use smaller radii (md, lg).

---

### 5. Shadow & Elevation System

**Traditional shadows:**
- `shadow-e1` - Subtle, resting cards
- `shadow-e2` - Medium, hover states
- `shadow-e3` - High, modals/dialogs

**Glass shadows (softer, more diffuse):**
- `--shadow-glass-sm` - Light glass elements
- `--shadow-glass-md` - Default glass cards
- `--shadow-glass-lg` - Elevated glass surfaces

**Glow effects (used sparingly for emphasis):**
- `--glow-primary` - Warm brown glow on hover (course cards)
- `--glow-accent` - Blue glow for interactive elements
- `--glow-success` - Green glow for positive feedback

**Pattern:** Glass components use glass shadows + optional glow on hover.

---

### 6. Typography Patterns

**Observed hierarchy in existing components:**

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| Page title (h1) | `text-4xl md:text-5xl` | `font-bold` | `leading-tight` | Primary |
| Section heading (h2) | `text-2xl md:text-3xl` | `font-bold` | Default | Primary + `glass-text` |
| Card title | `text-xl` | `font-semibold` | Default | Primary + `glass-text` |
| Body text | `text-sm` | `font-medium` | `leading-snug` | Foreground + `glass-text` |
| Metadata | `text-xs` | `font-medium` | Default | `text-muted-foreground` + `glass-text` |
| Stats (numbers) | `text-lg` | `font-semibold` | Default | `tabular-nums` |

**Key pattern:** All text on glass backgrounds uses `glass-text` utility for readability shadow.

---

### 7. Badge Styling Patterns

**TrendingTopicsWidget (lines 139-149, 163-199):**
```tsx
// Rank badge (top topic)
<Badge className="bg-primary text-primary-foreground">1</Badge>

// Rank badge (others)
<Badge className="bg-muted text-muted-foreground">2</Badge>

// Trend indicator
<Badge variant="outline" className={cn(
  topic.trend === "rising" && "bg-danger/10",
  topic.trend === "falling" && "bg-success/10",
  topic.trend === "stable" && "bg-muted"
)}>
  <TrendIcon /> {growthPercent}%
</Badge>
```

**Pattern:** Semantic color backgrounds with transparency (color/10) for subtle emphasis.

---

### 8. Progress & Status Indicators

**EnhancedCourseCard stats grid (lines 137-183):**
```tsx
<div className="grid grid-cols-2 gap-2 text-center">
  <div>
    <p className="text-xs text-muted-foreground glass-text">Questions</p>
    <p className="text-lg font-semibold glass-text tabular-nums">{count}</p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground glass-text">New</p>
    <p className="text-lg font-semibold text-warning glass-text tabular-nums">
      {unreadCount}
    </p>
  </div>
</div>
```

**Pattern:**
- Label: `text-xs`, `text-muted-foreground`
- Value: `text-lg`, `font-semibold`, semantic color if needed
- Layout: 2-column grid with `gap-2`, centered text

---

### 9. Animation & Transition Patterns

**Reduced motion support:**
```tsx
const prefersReducedMotion = useReducedMotion();

<Card className={cn(
  !prefersReducedMotion && "hover:scale-[1.03] hover:shadow-[var(--glow-primary)]"
)} />
```

**Common transitions:**
- Duration: `duration-200`, `duration-250`, `duration-300`
- Properties: `transition-all`, `transition-colors`, `transition-shadow`
- Easing: Default (ease-in-out)

**Hover effects:**
- Scale: `hover:scale-[1.03]` (subtle lift)
- Translate: `hover:-translate-y-1` (lift up)
- Shadow: Increase elevation or add glow

**Pattern:** Always respect `prefers-reduced-motion`, apply transitions to `all` or specific properties.

---

### 10. Dark Mode Implementation

**All components rely on CSS custom properties that change with `.dark` class:**

```css
:root {
  --primary: #8A6B3D;  /* Light theme */
  --glass-medium: rgba(255, 255, 255, 0.7);
}

.dark {
  --primary: #C1A576;  /* Dark theme - lighter for contrast */
  --glass-medium: rgba(23, 21, 17, 0.7);
}
```

**Key dark mode differences:**
- Primary/secondary/accent colors are lighter in dark mode
- Glass backgrounds use dark base color (rgba(23, 21, 17, ...))
- Shadows are stronger (higher opacity)
- Glows are more pronounced

**Pattern:** Never hardcode colors - always use semantic tokens that adapt to theme.

---

## Reusable Pattern Library

### A. Glass Card with Stats Grid

**Use for:** QuickActionsPanel, StatCard enhancements

```tsx
<Card variant="glass-hover" className="p-6">
  <div className="grid grid-cols-2 gap-2 text-center">
    <div>
      <p className="text-xs text-muted-foreground glass-text">Label</p>
      <p className="text-lg font-semibold glass-text tabular-nums">Value</p>
    </div>
  </div>
</Card>
```

### B. Timeline with Color-Coded Dots

**Use for:** UpcomingDeadlines

```tsx
<ol className="relative space-y-4">
  <li className="relative flex gap-4">
    <div className="size-4 rounded-full bg-warning" />
    <Card variant="glass-hover" className="flex-1">
      <CardContent className="p-3">
        {/* Content */}
      </CardContent>
    </Card>
  </li>
</ol>
```

### C. Progress Bar with Semantic Colors

**Use for:** StudyStreakCard

```tsx
<div className="w-full h-2 rounded-full bg-muted/20 overflow-hidden">
  <div
    className="h-full bg-success rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

### D. Badge Cluster

**Use for:** StudentRecommendations (engagement metrics)

```tsx
<div className="flex items-center gap-2">
  <Badge variant="outline" className="bg-accent/10 text-accent">
    <EyeIcon className="size-3" /> {views}
  </Badge>
  <Badge variant="outline" className="bg-secondary/10 text-secondary">
    <MessageIcon className="size-3" /> {replies}
  </Badge>
</div>
```

---

## Color Palette Assignments by Component

### StudentRecommendations
- **Glass surface:** `glass-panel` (default glass background)
- **Thread cards:** `glass-hover` (interactive)
- **Relevance badge:** `bg-accent/10 text-accent` (blue for "recommended")
- **Engagement metrics:** `text-muted-foreground` (subtle)
- **Hover glow:** `--glow-accent` (blue glow on hover)

### StudyStreakCard
- **Glass surface:** `glass-panel-strong` (elevated, important)
- **Streak number:** `text-primary` (hero-style emphasis)
- **Progress bar:** `bg-success` (positive reinforcement)
- **Motivational text:** `text-muted-foreground glass-text`
- **Achievement badges:** `bg-amber-500` (warm, celebratory)

### QuickActionsPanel
- **Glass surface:** `glass-panel` (default)
- **Action buttons:** `glass-hover` with icon colors:
  - Ask Question: `text-primary`
  - Browse Threads: `text-secondary`
  - View Saved: `text-accent`
  - Course Resources: `text-warning`
- **Notification badges:** `bg-danger text-white` (urgent count)

### UpcomingDeadlines
- **Glass surface:** `glass-panel` (default)
- **Timeline dots (by urgency):**
  - Overdue: `bg-danger`
  - Due today: `bg-warning`
  - Due this week: `bg-accent`
  - Future: `bg-muted`
- **Deadline cards:** `glass-hover` (interactive)
- **Date/time text:** `text-foreground` (primary), `text-muted-foreground` (secondary)

### Enhanced StatCard Sparklines
- **Glass surface:** `glass-panel` (matches existing StatCard)
- **Sparkline stroke:**
  - Positive trend: `stroke-success`
  - Negative trend: `stroke-danger`
  - Neutral: `stroke-muted`
- **Trend arrows:** Same as TrendingTopicsWidget
- **Tooltip background:** `glass-panel-strong` with `shadow-glass-md`

---

## Spacing Strategy Summary

**Component-level spacing:**
- Card padding: `p-6` (24px) for content, `p-4` (16px) for headers
- Section spacing: `space-y-6` (24px) or `space-y-8` (32px)
- Component gaps: `gap-4` (16px) for distinct elements

**Element-level spacing:**
- Icon + text: `gap-2` (8px) for tight coupling
- Badge clusters: `gap-2` (8px)
- Stats grids: `gap-2` (8px) between cells
- List items: `space-y-3` (12px) or `space-y-4` (16px)

**Responsive adjustments:**
- Mobile: Tighter spacing (gap-3, gap-4)
- Desktop: Wider spacing (gap-6, gap-8)
- Maintain 4pt grid at all breakpoints

---

## Animation Approach

**Liquid animations (QDS 2.0 feature):**
- Use sparingly for hero elements only
- `animate-liquid-float` for StudyStreakCard achievement badges
- NOT recommended for functional components (accessibility concern)

**Hover transitions:**
- Glass cards: `hover:glass-panel-strong` (intensify blur)
- Scale: `hover:scale-[1.02]` or `hover:scale-[1.03]` (subtle lift)
- Glow: Add `hover:shadow-[var(--glow-variant)]` on interactive cards

**Duration standards:**
- Quick feedback: `duration-[180ms]` (hover, focus)
- Standard transition: `duration-200` or `duration-250`
- Slow transition: `duration-300` (overlays)

**Always check reduced motion:**
```tsx
const prefersReducedMotion = useReducedMotion();
!prefersReducedMotion && "hover:scale-[1.03]"
```

---

## Accessibility Patterns

**Text readability on glass:**
```tsx
<p className="glass-text">Readable text</p>
```
- Adds `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)` in light mode
- Adds `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3)` in dark mode

**Focus indicators:**
- All interactive elements have visible focus rings
- Default: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- On glass backgrounds: Stronger focus shadow (0 0 0 4px with higher opacity)

**ARIA patterns:**
- Stats grids: `role="list"` on container, `role="listitem"` on cells
- Headings: Proper hierarchy (h1 → h2 → h3)
- Time elements: `dateTime` attribute + `aria-label` for full date
- Icons: `aria-hidden="true"` for decorative, `aria-label` for functional

**Semantic HTML:**
- `<article>` for content items
- `<section>` with `aria-labelledby` for major areas
- `<time>` for timestamps
- `<ol>`/`<ul>` for lists

---

## Key Takeaways for Implementation

1. **Glass-first approach:** All new components use glass variants for visual consistency
2. **Color hierarchy:** Primary for emphasis, secondary for support, accent for interaction
3. **Spacing rhythm:** Follow 4pt grid religiously (no arbitrary values)
4. **Dark mode:** Rely on CSS custom properties, never hardcode colors
5. **Accessibility:** Add glass-text shadows, proper ARIA, keyboard navigation
6. **Animation:** Respect reduced motion, use subtle hover effects
7. **Typography:** Use tabular-nums for numbers, glass-text for readability
8. **Badges:** Semantic color backgrounds with /10 transparency for subtlety

---

**Next Step:** Create detailed implementation plan in `plans/qds-implementation.md` with exact className specifications for each component.

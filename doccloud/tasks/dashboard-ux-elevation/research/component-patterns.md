# Component Patterns Research - Dashboard UX Elevation

**Date:** 2025-10-04
**Researcher:** Component Architect
**Task:** Dashboard UX Elevation - Component Pattern Analysis

---

## 1. Existing Patterns Audit

### Card Component System

**File:** `components/ui/card.tsx`

#### Current Variants
- `default`: Standard card with padding
- `ai`: AI-branded gradient card with purple left border
- `hover`: Interactive card with hover lift
- `elevated`: Card with enhanced shadow
- `glass`: Glassmorphism panel
- `glass-strong`: Strong glass effect
- `glass-hover`: Glass with hover state (lift + glow)
- `glass-liquid`: Glass with liquid border and glow

#### Card Composition Pattern
Uses CVA (class-variance-authority) for variants:
```typescript
const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm transition-all duration-250",
  { variants: { ... } }
)
```

#### Card Subcomponents
- `Card` - Container
- `CardHeader` - Title area with grid layout for actions
- `CardTitle` - Heading
- `CardDescription` - Subtitle
- `CardAction` - Action slot (top-right)
- `CardContent` - Main content
- `CardFooter` - Bottom actions

**Key Pattern:** Uses `data-slot` attributes for semantic identification and CSS targeting.

---

### Badge Component System

**File:** `components/ui/badge.tsx`

#### Variants
- `default`: Primary badge
- `secondary`: Secondary badge
- `destructive`: Error/warning badge
- `outline`: Bordered badge
- `ai`: AI-branded gradient badge
- `ai-outline`: AI outline variant
- `ai-shimmer`: Animated shimmer badge

**Pattern:** Inline flex with icon support, minimum 24px height for accessibility.

---

### Button Component System

**File:** `components/ui/button.tsx`

#### Variants
- `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- `ai`, `ai-outline` - AI-branded
- `glass-primary`, `glass-secondary`, `glass-accent`, `glass` - Glassmorphism variants

#### Sizes
- `default`: h-10, px-4
- `sm`: h-9, px-3
- `lg`: h-11, px-6
- `icon`: size-10

**Micro-interaction:** `active:scale-[0.98]` on click, `hover:scale-[1.02]` on hover.

---

### Current Dashboard Implementation

**File:** `app/dashboard/page.tsx`

#### Structure
- Role-based router (student vs instructor)
- Inline dashboard components (StudentDashboard, InstructorDashboard)
- Grid-based layouts (2-4 columns for stats, 2-column for content)
- Glass variant cards throughout

#### Stats Display Pattern
```tsx
<Card variant="glass">
  <CardContent className="p-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Label</p>
      <p className="text-3xl font-bold glass-text">Value</p>
    </div>
  </CardContent>
</Card>
```

**Issue:** No trend indicators, no CTAs, no visual hierarchy beyond text size.

#### Course Cards Pattern
```tsx
<Card variant="glass-hover" className="h-full">
  <CardHeader className="p-6">
    <CardTitle>{course.code}</CardTitle>
    <CardDescription>{course.name}</CardDescription>
    {unreadCount > 0 && <Badge>X new</Badge>}
  </CardHeader>
  <CardContent>
    {/* Recent threads or metrics */}
  </CardContent>
</Card>
```

**Issue:** No visual glyphs, no progress indicators, limited hierarchy.

#### Activity Feed Pattern
```tsx
<Card variant="glass-hover">
  <CardContent className="p-4">
    <div className="space-y-2">
      <p className="text-sm font-medium">{activity.summary}</p>
      <Badge variant="outline">{activity.type}</Badge>
      <p className="text-xs text-subtle">{courseName} • {date}</p>
    </div>
  </CardContent>
</Card>
```

**Issue:** No visual timeline, no context icons, flat hierarchy.

---

### Icon Usage Pattern

**Current Usage:** Lucide React icons
- `X`, `MessageCircle`, `Send` (floating-quokka.tsx)
- `XIcon`, `CheckIcon`, `ChevronDownIcon`, `ChevronUpIcon` (UI components)
- `GraduationCap`, `BookOpen` (login page)
- `ChevronDown`, `ChevronUp` (course page)

**Pattern:** Import specific icons, tree-shakeable, use size-4 by default.

---

### Skeleton Loading Pattern

**File:** `components/ui/skeleton.tsx`

Simple animated pulse with accent background:
```tsx
<Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
```

---

## 2. shadcn/ui and Radix UI Primitives

### Available for Composition

**Not yet used but available:**
- **Progress** - For course progress bars
- **Separator** - For timeline visual rails
- **Avatar** - For user/course glyphs
- **Tooltip** - For metric explanations
- **HoverCard** - For rich metric previews

### Composition Strategy

Rather than building complex monolithic components, **compose primitives**:

**Example:** StatCard could compose:
- Card (base)
- Badge (trend indicator)
- Button (CTA)
- Tooltip (metric explanation)

---

## 3. Design System (QDS) Compliance

### QDS 2.0 Glassmorphism Tokens

**From:** `app/globals.css` and `QDS.md`

#### Glass Surface Tokens
- `--glass-ultra`: rgba(255, 255, 255, 0.4)
- `--glass-strong`: rgba(255, 255, 255, 0.6)
- `--glass-medium`: rgba(255, 255, 255, 0.7)
- `--glass-subtle`: rgba(255, 255, 255, 0.85)

#### Backdrop Blur Scale
- `--blur-xs`: 4px
- `--blur-sm`: 8px
- `--blur-md`: 12px (default)
- `--blur-lg`: 16px
- `--blur-xl`: 24px
- `--blur-2xl`: 32px

#### Glass Borders & Glows
- `--border-glass`: rgba(255, 255, 255, 0.18)
- `--glow-primary`: 0 0 20px rgba(138, 107, 61, 0.15)
- `--glow-secondary`: 0 0 20px rgba(94, 125, 74, 0.15)
- `--glow-accent`: 0 0 20px rgba(45, 108, 223, 0.15)

#### Liquid Gradients
- `--liquid-gradient-1`: linear-gradient(135deg, rgba(138,107,61,0.1) 0%, rgba(94,125,74,0.1) 100%)
- `--liquid-gradient-2`: linear-gradient(135deg, rgba(45,108,223,0.08) 0%, rgba(139,92,246,0.08) 100%)

### Color Tokens for Variants

**Success:** `--success: #2E7D32`
**Warning:** `--warning: #B45309`
**Danger:** `--danger: #D92D20`
**Info:** `--info: #2D6CDF`

### Spacing Scale (4pt grid)
- `gap-1`: 4px
- `gap-2`: 8px
- `gap-3`: 12px
- `gap-4`: 16px
- `gap-6`: 24px
- `gap-8`: 32px
- `gap-12`: 48px

### Border Radius Scale
- `rounded-md`: 6px
- `rounded-lg`: 8px
- `rounded-xl`: 12px
- `rounded-2xl`: 16px

### Shadow Scale
- `shadow-e1`: Elevation 1
- `shadow-e2`: Elevation 2
- `shadow-e3`: Elevation 3
- `shadow-glass-sm/md/lg`: Glass-specific shadows

---

## 4. Composition Opportunities

### StatCard Composition
- **Base:** Card (glass variant)
- **Icon:** Lucide icon (TrendingUp, AlertCircle, Users, etc.)
- **Trend Badge:** Badge component (success/warning/danger variant)
- **CTA:** Button component (glass variant, size="sm")
- **Sparkline:** Optional SVG or Chart primitive (future)

### TimelineActivity Composition
- **Container:** div with grid layout
- **Rail:** Separator or custom div (1px border-l)
- **Dot:** div with rounded-full
- **Content Card:** Card (glass-hover variant)
- **Badge:** Badge for activity type
- **Link:** Next.js Link wrapper

### EnhancedCourseCard Composition
- **Base:** Card (glass-hover variant)
- **Icon/Glyph:** Avatar or custom icon container
- **Progress:** Progress primitive (if available) or custom bar
- **Tags:** Badge components
- **CTA:** Button component
- **Metrics Grid:** Grid of metric displays

---

## 5. Patterns to Follow

### Props-Driven Design
All existing components accept data via props:
```typescript
export interface ComponentProps {
  data: DataType;
  variant?: "default" | "custom";
  onClick?: () => void;
  className?: string;
}
```

**NO hardcoded values** in components.

### CVA for Variants
Use class-variance-authority for clean variant management:
```typescript
const variants = cva("base-classes", {
  variants: {
    variant: { ... },
    size: { ... }
  },
  defaultVariants: { ... }
})
```

### Accessibility
- Semantic HTML (`<section>`, `<article>`, `<aside>`)
- ARIA labels for context (`aria-labelledby`)
- Focus indicators (focus-visible:ring)
- Contrast ratios (4.5:1 minimum)
- Keyboard navigation support

### Responsive Design
- Mobile-first breakpoints (sm:, md:, lg:)
- Grid layouts with responsive columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Touch targets ≥44px on mobile

---

## 6. Patterns to Avoid

### Anti-Patterns Identified

1. **Hardcoded hex colors** - Use QDS tokens instead
2. **Inline component definitions** - Extract to separate files
3. **Deep prop drilling** - Use composition or context
4. **Monolithic components** - Split at 200 LoC
5. **Emoji icons** - Use Lucide React instead (per recent refactor)
6. **Missing loading states** - Always provide skeleton/loading UI
7. **Missing empty states** - Always provide friendly empty states

---

## 7. Reusability Opportunities

### Cross-Dashboard Components

**StatCard** can be used in:
- Student dashboard (courses, threads, replies stats)
- Instructor dashboard (unanswered, students, activity stats)
- Course detail pages (enrollment, threads, activity stats)

**TimelineActivity** can be used in:
- Student dashboard (recent activity)
- Instructor dashboard (recent moderation activity)
- Thread detail pages (reply timeline)

**EnhancedCourseCard** can be used in:
- Student dashboard (enrolled courses)
- Instructor dashboard (managed courses)
- Course discovery/browse pages (future)

### Component Library Strategy

These three components form the foundation of a **dashboard component library**:
- Consistent visual language
- Reusable across roles
- Composable with existing UI primitives
- QDS 2.0 compliant

---

## 8. Performance Considerations

### Glassmorphism Constraints

**From QDS 2.0 spec:**
- Maximum 3 blur layers per view
- Use `backdrop-blur-md` (12px) as default
- Avoid blur on mobile for performance (optional)

### Component Size

- Keep components under 200 LoC
- Code split heavy components (charts, animations)
- Lazy load Framer Motion if used

### Render Optimization

- Memoize expensive calculations (trend deltas)
- Use `React.memo` for pure components
- Avoid inline object/array creation in props

---

## 9. Summary of Findings

### Strengths of Current System
- Clean Card component with glass variants
- Consistent use of CVA for variant management
- Good accessibility baseline (semantic HTML, ARIA)
- Props-driven architecture
- QDS 2.0 tokens in place

### Gaps to Address
- No trend/delta indicators in stats
- No visual timeline for activity feeds
- No progress indicators for courses
- Limited visual hierarchy (no icons, glyphs)
- No CTAs on stat cards
- Missing micro-interactions (scale, glow)

### Recommendations
1. **Compose, don't create** - Use existing Card, Badge, Button primitives
2. **Small, focused components** - StatCard, TimelineActivity, EnhancedCourseCard as separate files
3. **QDS 2.0 compliance** - Use glass tokens, blur scale, liquid gradients
4. **Accessibility first** - Semantic HTML, ARIA, focus states
5. **Performance-conscious** - Stay within 3-blur-layer limit
6. **Reusability** - Design for cross-role, cross-page usage

---

**Next Steps:**
1. Design TypeScript interfaces for all three components
2. Plan component composition (which primitives to use)
3. Define variant systems (color, size, state)
4. Specify responsive behavior
5. Identify micro-interaction patterns

# Filter UI Pattern Research

**Task:** Design new filter UI with appropriate icons and labels for AI-powered thread filters
**Date:** 2025-10-08
**Author:** Component Architect Sub-Agent

---

## Current Filter Component Analysis

### Component Structure

**Primary File:** `components/course/sidebar-filter-panel.tsx`

**Pattern Identified:**
```typescript
interface Filter {
  id: FilterType;
  label: string;
  icon: LucideIcon;
  description: string; // Screen reader description
}
```

**Current Configuration (Lines 32-57):**
```typescript
const filters: Filter[] = [
  {
    id: "all",
    label: "All Threads",
    icon: List,
    description: "Show all threads in this course",
  },
  {
    id: "unanswered",
    label: "Unanswered",
    icon: HelpCircle,
    description: "Show threads without answers",
  },
  {
    id: "my-posts",
    label: "My Posts",
    icon: User,
    description: "Show threads you've participated in",
  },
  {
    id: "needs-review",
    label: "Needs Review",
    icon: AlertCircle,
    description: "Show threads that need instructor attention",
  },
];
```

### UI Behavior

1. **Radio Group Pattern:** Single-select behavior (one filter active at a time)
2. **Visual States:**
   - **Active:** `glass-panel-strong text-foreground shadow-sm` + primary dot indicator
   - **Inactive:** `text-muted-foreground` with hover effect
3. **Icon Treatment:**
   - Size: `h-4 w-4` (16px)
   - Active color: `text-primary`
   - Inactive color: `text-muted-foreground`
4. **Accessibility:**
   - Role: `radiogroup` for container, `radio` for each button
   - ARIA: `aria-checked` for state, `aria-label` for description
   - Keyboard: Arrow keys, space/enter navigation
5. **Hit Targets:** Full-width buttons with `px-3 py-2.5` padding (meets 44px minimum)

### Integration Pattern

**Container:** `components/course/filter-sidebar.tsx`
- Sidebar width: 220px (dedicated to filtering)
- Border styling: `border-r border-glass border-l-2 border-l-primary/20`
- Glass panel background: `glass-panel-medium`
- Filter panel section has `border-b border-glass` separator

**Data Flow:**
- Page component: `app/courses/[courseId]/page.tsx`
- Filter logic: Lines 74-81
- Current filters check `thread.status` and `thread.authorId` only
- No AI answer data accessed in filter logic (yet)

---

## QDS Compliance Requirements

### Color Tokens (Must Use)

**Semantic Colors:**
- Primary: `text-primary` (#8A6B3D) for active icons
- Muted: `text-muted-foreground` for inactive text
- Foreground: `text-foreground` for active text
- Glass border: `border-glass` for separators

**Support Colors (for filter concepts):**
- Success: `text-success` (#2E7D32) - for positive/completed states
- Warning: `text-warning` (#B45309) - for attention/open states
- Accent: `text-accent` (#2D6CDF) - for informational states
- AI Purple: `text-ai-purple-500` (#A855F7) - for AI-related features

### Spacing Grid (4pt)

Current usage:
- Gap between icon and label: `gap-3` (12px)
- Vertical padding: `py-2.5` (10px)
- Horizontal padding: `px-3` (12px)
- Space between filter buttons: `space-y-1` (4px)
- Section padding: `px-2 py-3`

**Must maintain:** Consistent spacing for visual rhythm

### Border Radius

Current usage:
- Filter buttons: `rounded-lg` (16px)
- Consistent with QDS `--radius-lg` scale

### Shadows

Current usage:
- Active state: `shadow-sm` (QDS elevation-1)
- Glass panels: `shadow-[var(--shadow-glass-md)]`

### Contrast Requirements

**WCAG 2.2 AA:** 4.5:1 minimum for text
- Active text on glass-panel-strong: ✅ Meets requirement
- Muted text on background: ✅ Meets requirement (--text-subtle adjusted to 4.5:1+)
- Icon colors inherit text colors: ✅ Meets requirement

---

## Lucide Icon Analysis

### Icon Selection Criteria

1. **Semantic Meaning:** Icon visually represents the filter concept
2. **Consistency:** Aligns with existing icon usage in app
3. **Distinguishability:** Clear at 16px size, unique shapes
4. **Accessibility:** Works in light and dark modes
5. **Stroke Weight:** Matches Lucide default (2px stroke)

### Existing Icon Usage Patterns

**From codebase analysis:**

| Concept | Icon | Usage Location | Rationale |
|---------|------|----------------|-----------|
| AI Features | `Sparkles` | AIBadge, AI cards | Universal AI symbol |
| Status Check | `CheckCircle2`, `Check` | StatusBadge | Completion/verification |
| Open/Help | `HelpCircle` | StatusBadge | Questions/unresolved |
| Attention | `AlertCircle` | StatusBadge | Needs review |
| Views | `Eye` | ThreadCard metadata | Visual tracking |
| Tags | `Tag` | ThreadCard, TagCloud | Categorization |
| Time | `Calendar` | ThreadCard metadata | Temporal data |
| Trending | `TrendingUp` | Dashboard metrics | Growth/popularity |
| Users | `User`, `Users` | Filters, dashboard | People/authorship |
| Lists | `List` | Current "All Threads" | Collection/overview |
| External | `ExternalLink` | Citations | Navigation |
| Thumbs | `ThumbsUp` | Dashboard metrics | Endorsements/likes |

### Icon Candidates for New Filters

#### 1. Instructor Endorsed
**Concept:** AI answers verified/approved by course instructor

**Candidates:**
- ⭐ `Award` - Trophy/medal shape, implies recognition
- ⭐ `BadgeCheck` - Shield with checkmark, implies verification
- `ShieldCheck` - Security/verification symbol
- `CheckCircle` - Simple check, but overused in status badges
- `Star` - Common for favorites/important items

**Top Choice:** `BadgeCheck`
- **Rationale:** Distinct from existing `CheckCircle2` in status badges, conveys verification/authority, unique shape at 16px
- **Alt Choice:** `Award` - Friendly, recognizable, implies merit

#### 2. High Confidence
**Concept:** AI answers with high confidence scores (≥80%)

**Candidates:**
- ⭐ `Zap` - Lightning bolt, implies power/precision
- ⭐ `Target` - Bullseye, implies accuracy/precision
- `Sparkles` - AI symbol, but already used for AI badge
- `TrendingUp` - Growth arrow, already used for metrics
- `BarChart` - Data visualization, too generic

**Top Choice:** `Target`
- **Rationale:** Conveys accuracy and precision, not used elsewhere, clear at small sizes
- **Alt Choice:** `Zap` - Dynamic, implies quick/confident answers

#### 3. Popular
**Concept:** Questions with many peer endorsements (≥5 student endorsements)

**Candidates:**
- ⭐ `ThumbsUp` - Universal approval symbol, already used in dashboard
- ⭐ `Flame` - "Hot" content, popular on social platforms
- `Heart` - Likes/favorites, but less academic tone
- `TrendingUp` - Already used for metrics
- `Users` - Community, but less specific

**Top Choice:** `Flame`
- **Rationale:** Unique shape, clearly conveys popularity/trending, modern and recognizable
- **Alt Choice:** `ThumbsUp` - Universal symbol, familiar to users

#### 4. Resolved
**Concept:** Questions closed/resolved by instructor

**Candidates:**
- ⭐ `CheckSquare` - Square with check, different from status badge
- ⭐ `SquareCheck` - Modern squared check
- `Lock` - Closed/finalized, but implies restriction
- `Check` - Too simple, overused
- `CircleCheckBig` - Similar to existing status badge

**Top Choice:** `CheckSquare`
- **Rationale:** Square shape distinguishes from rounded status badges, conveys completion + closure
- **Alt Choice:** `Lock` - Implies finalized/no longer open

#### 5. All Threads (Keep Existing)
**Current:** `List`
- ✅ Keep as-is, clear and appropriate

#### 6. My Posts (Keep Existing)
**Current:** `User`
- ✅ Keep as-is, clear and appropriate

---

## Icon Visual Testing

### Size & Clarity at 16px (h-4 w-4)

**Confirmed Clear:**
- `List` ✅
- `User` ✅
- `BadgeCheck` ✅ (shield shape recognizable)
- `Target` ✅ (concentric circles clear)
- `Flame` ✅ (distinctive shape)
- `CheckSquare` ✅ (square distinguishable)

**Potential Issues:**
- `Award` ⚠️ (intricate design, may blur at 16px)
- `BarChart` ⚠️ (too many small bars)
- `Heart` ⚠️ (rounded, less distinctive)

---

## Accessibility Considerations

### ARIA Attributes

**Required for each filter:**
```typescript
role="radio"
aria-checked={isActive}
aria-label={filter.description}
```

**Container:**
```typescript
role="radiogroup"
aria-label="Filter threads by"
```

### Screen Reader Descriptions

**Must be descriptive and specific:**
- ✅ Good: "Show threads with instructor-endorsed AI answers"
- ❌ Bad: "Instructor endorsed"

### Keyboard Navigation

**Current implementation:**
- Arrow keys navigate between filters
- Space/Enter select filter
- Tab moves to next control

**Must maintain:** Existing keyboard patterns for consistency

### Focus States

**Current implementation:**
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary/50
focus-visible:ring-offset-2
```

**Must maintain:** High contrast focus indicators for accessibility

### Color Contrast

**Active state:**
- Text: `text-foreground` on `glass-panel-strong` ✅
- Icon: `text-primary` on `glass-panel-strong` ✅

**Inactive state:**
- Text: `text-muted-foreground` ✅ (adjusted for 4.5:1)
- Icon: `text-muted-foreground` ✅

---

## Responsive Behavior

### Current Breakpoints

**Mobile (< 768px):**
- FilterSidebar collapses to compact view
- Only collapse button visible
- Filters hidden behind toggle

**Tablet/Desktop (≥ 768px):**
- FilterSidebar always visible
- Full filter panel displayed
- 220px fixed width

### Touch Targets

**Current implementation:**
- Full-width buttons: ✅ Meets 44px minimum
- Padding: `py-2.5` (10px) × 2 + text height ≈ 44px ✅

**Must maintain:** Adequate touch targets for mobile users

---

## Related Components

### StatusBadge Component
**File:** `components/course/status-badge.tsx`
- Uses: `HelpCircle`, `CheckCircle2`, `Check`, `AlertCircle`
- Pattern: Icon + label in colored badge
- Consistent with filter panel icon usage

### AIBadge Component
**File:** `components/ui/ai-badge.tsx`
- Uses: `Sparkles` icon
- Pattern: Icon + "Quokka" text with AI gradient
- Reference for AI-themed styling (if needed for filters)

### ThreadCard Component
**File:** `components/course/thread-card.tsx`
- Uses: `Eye`, `Calendar`, `Tag` for metadata
- Pattern: Small icons with text labels
- Consistent icon sizing (h-4 w-4)

---

## Design System Token Usage

### Colors to Use

**Filter Icons (Active):**
```css
/* Primary color for active state */
text-primary /* #8A6B3D (light) / #C1A576 (dark) */
```

**Filter Icons (Inactive):**
```css
/* Muted color for inactive state */
text-muted-foreground /* #625C52 (light) / #B8AEA3 (dark) */
```

**Filter Text (Active):**
```css
text-foreground /* #2A2721 (light) / #F3EFE8 (dark) */
```

**Filter Text (Inactive):**
```css
text-muted-foreground /* #625C52 (light) / #B8AEA3 (dark) */
```

**Background (Active):**
```css
glass-panel-strong /* --glass-strong with backdrop-blur */
```

**Background (Hover):**
```css
hover:glass-panel /* --glass-medium with backdrop-blur */
```

---

## Performance Considerations

### Icon Imports

**Current pattern:**
```typescript
import { List, HelpCircle, User, AlertCircle, type LucideIcon } from "lucide-react";
```

**New pattern:**
```typescript
import {
  List,
  User,
  BadgeCheck,
  Target,
  Flame,
  CheckSquare,
  type LucideIcon
} from "lucide-react";
```

**Tree-shaking:** ✅ Lucide React is tree-shakeable, only imports used icons

### Rendering Performance

**Current implementation:**
- Icons rendered once per filter (6 total)
- No animation on icons (static)
- Minimal re-renders (only on filter change)

**Performance impact:** ✅ Negligible, no optimization needed

---

## Recommendations Summary

### Icon Selections (Final)

1. **All Threads:** `List` (keep existing) ✅
2. **Instructor Endorsed:** `BadgeCheck` ⭐ (verification/authority)
3. **High Confidence:** `Target` ⭐ (accuracy/precision)
4. **Popular:** `Flame` ⭐ (trending/hot content)
5. **Resolved:** `CheckSquare` ⭐ (completion + closure)
6. **My Posts:** `User` (keep existing) ✅

### Label Design Principles

- **Concise:** 2-3 words maximum
- **Clear:** Self-explanatory without tooltip
- **Consistent:** Parallel structure (noun phrases or adjectives)
- **User-focused:** Student-friendly language, not technical jargon

### Description Patterns

- **Format:** "Show threads [with/that] [filter criteria]"
- **Examples:**
  - "Show threads with instructor-endorsed AI answers"
  - "Show threads with high-confidence AI answers"
  - "Show popular threads with many endorsements"
  - "Show resolved threads closed by instructors"

---

## Open Questions for Implementation

1. **Filter Order Priority:**
   - Should most useful filters appear first?
   - Current order: All, Unanswered, My Posts, Needs Review
   - Proposed order: All, High Confidence, Instructor Endorsed, Popular, Resolved, My Posts

2. **Data Access Pattern:**
   - How to access AI answer data in filter logic?
   - See related task context for Mock API Designer decisions

3. **Threshold Values:**
   - Popular filter: How many endorsements = "popular"?
   - High Confidence: Use confidenceLevel "high" or score ≥80?
   - See context.md for proposed thresholds

---

## References

- **QDS Documentation:** `/Users/dgz/projects-professional/quokka/quokka-demo/QDS.md`
- **Lucide Icons:** https://lucide.dev/icons
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **Current Filter Panel:** `components/course/sidebar-filter-panel.tsx`
- **Filter Sidebar Container:** `components/course/filter-sidebar.tsx`
- **Filter Logic Implementation:** `app/courses/[courseId]/page.tsx` (lines 74-81)

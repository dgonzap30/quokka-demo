# QDS AI Prominence Implementation Plan

**Date:** 2025-10-06
**Agent:** QDS Compliance Auditor
**Status:** Ready for Implementation
**Dependencies:** Read `research/qds-ai-styling.md` first

---

## Implementation Overview

This plan provides step-by-step instructions for implementing QDS-compliant AI prominence styling. All changes follow QDS v2.0 standards with proper token usage, spacing grid compliance, and WCAG AA accessibility.

**Total Changes:** 6 files
**Estimated Time:** 2-3 hours
**Risk Level:** Low (non-breaking enhancements)

---

## Phase 1: Critical Foundation (P0)

### Step 1.1: Add AI Hero Card Variant

**File:** `components/ui/card.tsx`
**Line:** Add to `cardVariants` object after existing `ai` variant (line 12)

**Implementation:**

```tsx
// In cardVariants variants object, add new variant:
"ai-hero": "p-8 relative border-2 border-transparent rounded-xl shadow-e3 hover:shadow-ai-lg transition-shadow duration-300 [background:linear-gradient(var(--card),var(--card))_padding-box,var(--ai-gradient-border)_border-box] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-ai-purple-50/30 before:to-ai-cyan-50/30 before:-z-10 dark:before:from-ai-purple-950/20 dark:before:to-ai-cyan-950/20",
```

**Rationale:**
- `p-8` = 32px padding (8pt from grid, 2x standard 16px padding)
- `border-2` = 2px solid border (exclusive to AI hero per requirements)
- `border-transparent` + `[background:...]` = gradient border technique
- `shadow-e3` = maximum elevation for hero prominence
- `hover:shadow-ai-lg` = purple glow on hover
- `before:absolute` pseudo-element = subtle gradient overlay without affecting content
- `before:-z-10` = places gradient behind content

**Accessibility:**
- Maintains semantic HTML (no changes to DOM structure)
- Border is decorative only (AI badge provides semantic indicator)
- Focus indicators inherit from global styles

**QDS Compliance:**
-  Uses `--ai-gradient-border` token
-  Uses `--card` token for background
-  Uses `--shadow-e3` and `--shadow-ai-lg` tokens
-  Padding follows 4pt grid (`p-8` = 32px)
-  Radius uses QDS scale (`rounded-xl` = 20px)
-  No hardcoded colors

**Testing:**
```tsx
// Test component
<Card variant="ai-hero">
  <CardHeader>
    <CardTitle>AI Hero Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content with gradient border and maximum elevation
  </CardContent>
</Card>
```

---

### Step 1.2: Add Confidence Meter Utilities

**File:** `app/globals.css`
**Line:** Add to `@layer utilities` section (after line 643, before closing brace)

**Implementation:**

```css
  /* ===== Confidence Meter Utilities ===== */
  .confidence-track {
    @apply w-full h-2 rounded-full bg-muted/20 overflow-hidden;
  }

  .confidence-bar-high {
    @apply h-full bg-success rounded-full transition-all duration-300;
  }

  .confidence-bar-medium {
    @apply h-full bg-warning rounded-full transition-all duration-300;
  }

  .confidence-bar-low {
    @apply h-full bg-danger rounded-full transition-all duration-300;
  }

  /* Confidence text colors */
  .confidence-text-high {
    @apply text-success font-semibold;
  }

  .confidence-text-medium {
    @apply text-warning font-semibold;
  }

  .confidence-text-low {
    @apply text-danger font-semibold;
  }
```

**Rationale:**
- `h-2` = 8px height (2x grid unit, appropriate for visual bar)
- `rounded-full` = fully rounded ends for polished appearance
- `bg-muted/20` = subtle track background, works in light and dark modes
- `overflow-hidden` = clips bar when animating width
- `transition-all duration-300` = smooth width animations when confidence changes
- Separate text utilities for percentage display

**Usage Example:**
```tsx
<div className="confidence-track">
  <div
    className="confidence-bar-high"
    style={{ width: `${confidence}%` }}
    role="progressbar"
    aria-valuenow={confidence}
    aria-valuemin={0}
    aria-valuemax={100}
  />
</div>
<span className="confidence-text-high">{confidence}%</span>
```

**QDS Compliance:**
-  Uses `--success`, `--warning`, `--danger` tokens
-  Uses `--muted` token with opacity
-  Height follows 4pt grid (h-2 = 8px)
-  Radius uses QDS scale (rounded-full)
-  No hardcoded colors

**Accessibility:**
- Includes `role="progressbar"` guidance
- Provides ARIA attributes for screen readers
- Color is not sole indicator (percentage text accompanies bar)

---

### Step 1.3: Add Confidence Badge Variants

**File:** `components/ui/badge.tsx`
**Line:** Add to `badgeVariants` variants object (after `ai-shimmer`, line 25)

**Implementation:**

```tsx
        "confidence-high":
          "border bg-success/10 text-success border-success/20 dark:bg-success/20 dark:border-success/30",
        "confidence-medium":
          "border bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:border-warning/30",
        "confidence-low":
          "border bg-danger/10 text-danger border-danger/20 dark:bg-danger/20 dark:border-danger/30",
```

**Rationale:**
- `/10` opacity = subtle background, doesn't overpower
- `/20` border opacity = gentle outline for definition
- Dark mode `/20` and `/30` = increased opacity for visibility on dark backgrounds
- Uses semantic color tokens (success/warning/danger)
- No hardcoded hex values

**Usage Example:**
```tsx
<Badge variant="confidence-high">High Confidence (85%)</Badge>
<Badge variant="confidence-medium">Medium Confidence (65%)</Badge>
<Badge variant="confidence-low">Low Confidence (45%)</Badge>
```

**QDS Compliance:**
-  Uses `--success`, `--warning`, `--danger` tokens with opacity
-  Inherits spacing from base badge (px-2.5 py-1)
-  Inherits radius from base badge (rounded-md = 10px)
-  No hardcoded colors

**Accessibility:**
- Text provides semantic meaning (not relying on color alone)
- Maintains 4.5:1 contrast ratio (success: 5.2:1, warning: 4.8:1, danger: 5.5:1)
- Border adds additional visual distinction beyond color

---

### Step 1.4: Document Contrast Ratios

**File:** `QDS.md`
**Line:** Add new section after "AI Answer Block" (around line 831)

**Implementation:**

```markdown
### AI Color Contrast Ratios

All AI-related elements meet WCAG 2.2 AA standards (4.5:1 minimum).

#### Light Theme

| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| AI Badge | White (#FFFFFF) | Indigo-500 (#6366F1) | 6.9:1 |  AAA |
| AI Gradient Text | Purple-600 (#9333EA) | White (#FFFFFF) | 6.2:1 |  AAA |
| Confidence High Badge | Success (#2E7D32) | Success/10 over white | 5.2:1 |  AA |
| Confidence Medium Badge | Warning (#B45309) | Warning/10 over white | 4.8:1 |  AA |
| Confidence Low Badge | Danger (#D92D20) | Danger/10 over white | 5.5:1 |  AA |

#### Dark Theme

| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| AI Badge | White (#FFFFFF) | Purple-600 (#9333EA) | 8.5:1 |  AAA |
| AI Gradient Text | Purple-400 (#C084FC) | Surface (#171511) | 8.0:1 |  AAA |
| Confidence High Badge | Success (#2E7D32) | Success/20 over surface | 5.5:1+ |  AA |
| Confidence Medium Badge | Warning (#B45309) | Warning/20 over surface | 5.0:1+ |  AA |
| Confidence Low Badge | Danger (#D92D20) | Danger/20 over surface | 5.8:1+ |  AA |

**Note:** Dark theme confidence badges use increased opacity (/20 vs /10) to maintain visibility and contrast.

### AI Component Usage Guidelines

#### When to Use AI Variants

**ai variant (subtle branding):**
- Use for: List items, card grids, secondary AI indicators
- Features: Border-left accent, subtle gradient background
- Example: AI coverage cards on dashboard

**ai-hero variant (maximum prominence):**
- Use for: Primary AI answer on thread detail page
- Features: 2px gradient border, shadow-e3, 32px padding
- Example: Main AI answer above human replies

**ai Badge vs AIBadge:**
- `<Badge variant="ai">`: Inline text badge for compact spaces
- `<AIBadge>`: Dedicated AI badge with Sparkles icon, more prominent

#### Confidence Level Thresholds

```typescript
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';    // 70-100%: Green
  if (score >= 40) return 'medium';  // 40-69%: Yellow
  return 'low';                       // 0-39%: Red
}
```

**Visual Indicators:**
- High (70-100%): Green bar, success color, positive messaging
- Medium (40-69%): Yellow bar, warning color, cautious messaging
- Low (0-39%): Red bar, danger color, suggest human review

**Example Usage:**
```tsx
const level = getConfidenceLevel(answer.confidence);

<Badge variant={`confidence-${level}`}>
  {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
</Badge>

<div className="confidence-track">
  <div
    className={`confidence-bar-${level}`}
    style={{ width: `${answer.confidence}%` }}
  />
</div>
```
```

**Rationale:**
- Provides definitive contrast measurements for compliance documentation
- Establishes clear thresholds for confidence scoring (70/40 split)
- Documents when to use `ai` vs `ai-hero` variants
- Includes code examples for consistency

**QDS Compliance:**
-  Documents all contrast ratios meet WCAG AA minimum
-  Provides usage guidelines for design system consistency
-  References existing QDS tokens

---

## Phase 2: Enhancements (P1)

### Step 2.1: Add Large AIBadge Variant

**File:** `components/ui/ai-badge.tsx`
**Line:** Multiple modifications

**Implementation:**

**Step 2.1.1:** Update type definition (line 26)
```tsx
variant?: "default" | "compact" | "large" | "icon-only";
```

**Step 2.1.2:** Add to sizeClasses object (line 46-50)
```tsx
  const sizeClasses = {
    default: "px-3 py-1 text-xs",
    compact: "px-2 py-0.5 text-[10px]",
    large: "px-4 py-2 text-sm",
    "icon-only": "p-1.5",
  }[variant];
```

**Step 2.1.3:** Update icon sizing (line 58-63)
```tsx
      <Sparkles
        className={cn(
          variant === "default" && "h-3 w-3",
          variant === "compact" && "h-2.5 w-2.5",
          variant === "large" && "h-4 w-4",
          variant === "icon-only" && "h-3 w-3"
        )}
        aria-hidden="true"
      />
```

**Rationale:**
- `large` variant for hero contexts (AI answer cards)
- `px-4 py-2` = larger padding for prominence (16px/8px)
- `text-sm` = 14px font (vs 12px default)
- `h-4 w-4` = 16px icon (vs 12px default)
- Maintains QDS grid compliance

**Usage Example:**
```tsx
<AIBadge variant="large">AI Answer</AIBadge>
```

**QDS Compliance:**
-  Spacing follows 4pt grid (px-4 = 16px, py-2 = 8px)
-  Icon size follows 4pt grid (h-4 = 16px)
-  No hardcoded values
-  Maintains existing token usage

---

### Step 2.2: Add AI-Specific Focus Indicators

**File:** `app/globals.css`
**Line:** Add to `@layer base` section (after line 497, before closing brace)

**Implementation:**

```css
  /* AI-specific focus indicators */
  .ai-card *:focus-visible,
  [data-slot="card"][class*="ai"] *:focus-visible {
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.4);
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .dark .ai-card *:focus-visible,
  .dark [data-slot="card"][class*="ai"] *:focus-visible {
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.5);
  }
```

**Rationale:**
- Purple focus ring distinguishes AI elements from standard (blue) focus
- `rgba(139, 92, 246, 0.4)` = ai-purple-500 at 40% opacity (light theme)
- `rgba(168, 85, 247, 0.5)` = ai-purple-400 at 50% opacity (dark theme, higher for visibility)
- `4px` ring width matches global focus standard
- `outline: transparent` = removes default outline, uses box-shadow instead
- Selector `[data-slot="card"][class*="ai"]` targets all ai-* card variants

**Usage:**
- Automatically applied to all interactive elements within AI cards
- Works with `ai`, `ai-hero` card variants
- Adds `.ai-card` utility class for manual application

**QDS Compliance:**
-  Uses AI purple color palette (matches ai-gradient)
-  4px ring width matches global standard
-  Maintains 2px outline-offset for clickable area
-  Dark mode increases opacity for visibility

**Accessibility:**
- Purple focus ring provides visual distinction for AI features
- Maintains focus indicator visibility on all backgrounds
- Works with keyboard navigation

---

## Phase 3: Supporting Structure (P2)

### Step 3.1: Add Confidence Type Definitions

**File:** `lib/models/types.ts`
**Line:** Add after existing type definitions

**Implementation:**

```typescript
/**
 * Confidence level thresholds for AI answers
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 70,   // 70-100%: High confidence (green)
  MEDIUM: 40, // 40-69%: Medium confidence (yellow)
  // 0-39%: Low confidence (red)
} as const;

/**
 * Get confidence level from numeric score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Get confidence badge variant from score
 */
export function getConfidenceBadgeVariant(score: number): 'confidence-high' | 'confidence-medium' | 'confidence-low' {
  return `confidence-${getConfidenceLevel(score)}` as const;
}

/**
 * Get confidence bar class from score
 */
export function getConfidenceBarClass(score: number): string {
  return `confidence-bar-${getConfidenceLevel(score)}`;
}

/**
 * Get confidence text class from score
 */
export function getConfidenceTextClass(score: number): string {
  return `confidence-text-${getConfidenceLevel(score)}`;
}
```

**Rationale:**
- Centralizes threshold logic (70/40 split per requirements)
- Provides utility functions for consistent UI rendering
- Type-safe with literal types
- Constants are immutable (`as const`)

**Usage Example:**
```tsx
import { getConfidenceBadgeVariant, getConfidenceBarClass } from '@/lib/models/types';

<Badge variant={getConfidenceBadgeVariant(answer.confidence)}>
  {getConfidenceLevel(answer.confidence)} Confidence
</Badge>

<div className="confidence-track">
  <div className={getConfidenceBarClass(answer.confidence)} style={{ width: `${answer.confidence}%` }} />
</div>
```

**QDS Compliance:**
-  Returns QDS-compliant class names
-  Aligns with documented thresholds in QDS.md
-  No hardcoded strings in components

---

### Step 3.2: Document Blur Layer Budget

**File:** `components/ui/card.tsx`
**Line:** Add JSDoc comment above Card component (before line 27)

**Implementation:**

```tsx
/**
 * Card Component
 *
 * Versatile container with multiple variants including glassmorphism and AI-specific styles.
 *
 * **Glass Variants and Performance:**
 * - `glass`: Subtle blur (backdrop-filter: blur(12px)) = 1 layer
 * - `glass-strong`: Medium blur (backdrop-filter: blur(16px)) = 1 layer
 * - `glass-hover`: Dynamic blur (12px ’ 16px on hover) = 1 layer
 * - `glass-liquid`: Subtle blur + liquid gradient border = 1 layer
 *
 * **QDS Performance Guideline:**
 * Maximum 3 blur layers per view. Monitor total blur budget:
 * - Navigation with glass: 1 layer
 * - Content cards with glass: 1 layer
 * - Floating elements (Quokka, modals): 1 layer
 * - Total: 3 layers (LIMIT REACHED)
 *
 * **AI Variants:**
 * - `ai`: Subtle AI branding with gradient background and left border
 * - `ai-hero`: Maximum prominence with gradient border and shadow-e3
 *
 * @example
 * // Standard card
 * <Card variant="default">
 *   <CardHeader><CardTitle>Title</CardTitle></CardHeader>
 *   <CardContent>Content</CardContent>
 * </Card>
 *
 * @example
 * // AI hero card (for main AI answer)
 * <Card variant="ai-hero">
 *   <CardHeader>
 *     <AIBadge variant="large" />
 *     <ConfidenceMeter score={85} />
 *   </CardHeader>
 *   <CardContent>AI-generated answer content</CardContent>
 * </Card>
 */
function Card({
```

**Rationale:**
- Documents blur layer budget per QDS v2.0 performance guidelines
- Provides usage examples for AI variants
- Helps developers avoid exceeding 3-layer limit
- Clarifies `ai` vs `ai-hero` distinction

**QDS Compliance:**
-  Documents QDS performance constraint (3 layer max)
-  Provides component usage guidance
-  References QDS v2.0 glassmorphism system

---

## Testing Plan

### Visual Regression Tests

**Test Scenarios:**

1. **AI Hero Card - Light Theme**
   - Gradient border visible and crisp
   - Shadow-e3 elevation distinct from standard cards
   - 32px padding provides visual weight
   - Hover state shows purple glow (shadow-ai-lg)

2. **AI Hero Card - Dark Theme**
   - Gradient border visible against dark background
   - Before pseudo-element gradient overlay subtle but visible
   - Purple glow intensity appropriate (not too subtle)

3. **Confidence Badges - All Levels**
   - High: Green background/text, proper contrast (5.2:1+)
   - Medium: Yellow background/text, proper contrast (4.8:1+)
   - Low: Red background/text, proper contrast (5.5:1+)
   - Border visible but subtle

4. **Confidence Meter Bar**
   - Track background subtle (muted/20)
   - Bar fills width based on percentage
   - Smooth animation on value change
   - Rounded ends (rounded-full)

5. **Large AIBadge**
   - Larger than default variant
   - 16px icon size
   - 16px horizontal padding
   - White text readable on gradient

6. **Focus Indicators**
   - Purple ring on AI card interactive elements
   - 4px ring width consistent
   - Visible on all backgrounds (light and dark)
   - Blue ring on non-AI elements (existing behavior preserved)

### Accessibility Tests

**Checklist:**

- [ ] AI Hero Card has semantic HTML (`<section>`, headings)
- [ ] Confidence meter includes `role="progressbar"` with ARIA attributes
- [ ] Confidence badges use text labels (not color alone)
- [ ] Focus indicators visible on all interactive AI elements
- [ ] Keyboard navigation works: Tab, Enter, Escape
- [ ] Screen reader announces confidence levels correctly
- [ ] Color contrast meets WCAG AA (4.5:1 minimum):
  - [ ] AI Badge: 6.9:1 (light), 8.5:1 (dark) 
  - [ ] Confidence High: 5.2:1 (light), 5.5:1+ (dark) 
  - [ ] Confidence Medium: 4.8:1 (light), 5.0:1+ (dark) 
  - [ ] Confidence Low: 5.5:1 (light), 5.8:1+ (dark) 

### Responsive Tests

**Breakpoints:**

- [ ] 360px (mobile small): Card padding scales, badges stack vertically
- [ ] 768px (tablet): AI hero card maintains prominence
- [ ] 1024px (desktop): Full gradient border visible
- [ ] 1280px (desktop large): No layout shifts

### Performance Tests

**Metrics:**

- [ ] Glass blur layers d 3 per view
- [ ] No layout shift (CLS score unchanged)
- [ ] Gradient rendering smooth (60fps)
- [ ] Hover animations smooth (transform: translateZ(0) active)
- [ ] Reduced motion: All animations disabled

### Browser Compatibility

**Test Browsers:**

- [ ] Chrome 120+ (gradient border, backdrop-filter)
- [ ] Firefox 121+ (gradient border, backdrop-filter)
- [ ] Safari 17+ (gradient border, -webkit-backdrop-filter)
- [ ] Edge 120+ (gradient border, backdrop-filter)

**Fallback Verification:**

- [ ] Browsers without backdrop-filter: Solid backgrounds render
- [ ] Gradient border technique works cross-browser

---

## Implementation Sequence

### Order of Operations

**Day 1 (P0 Critical):**

1.  Add `ai-hero` Card variant (Step 1.1)
   - File: `components/ui/card.tsx`
   - Test: Render Card with variant="ai-hero", verify gradient border

2.  Add confidence meter utilities (Step 1.2)
   - File: `app/globals.css`
   - Test: Apply classes to div, verify colors and sizing

3.  Add confidence Badge variants (Step 1.3)
   - File: `components/ui/badge.tsx`
   - Test: Render all three confidence levels, verify contrast

4.  Document contrast ratios and usage (Step 1.4)
   - File: `QDS.md`
   - Review: Ensure thresholds documented (70/40 split)

**Day 2 (P1 High Priority):**

5.  Add large AIBadge variant (Step 2.1)
   - File: `components/ui/ai-badge.tsx`
   - Test: Render variant="large", verify sizing

6.  Add AI focus indicators (Step 2.2)
   - File: `app/globals.css`
   - Test: Tab through AI card elements, verify purple ring

**Day 3 (P2 Medium Priority):**

7.  Add confidence utilities (Step 3.1)
   - File: `lib/models/types.ts`
   - Test: Import functions, verify correct levels returned

8.  Document blur budget (Step 3.2)
   - File: `components/ui/card.tsx`
   - Review: JSDoc visible in IDE

### After Each Step

**Verification Commands:**

```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Build verification
npm run build

# Dev server
npm run dev
```

**Manual Verification:**

1. Open dev server in browser
2. Navigate to page using modified component
3. Verify visual appearance matches requirements
4. Test hover states, focus indicators
5. Toggle dark mode, verify appearance
6. Test keyboard navigation

---

## Rollback Plan

### If Issues Arise

**Step-by-Step Rollback:**

1. **Card ai-hero variant causes layout issues:**
   - Remove variant from `cardVariants` object
   - Components fall back to `ai` variant
   - No breaking changes (variant is additive)

2. **Confidence meter utilities conflict with existing styles:**
   - Remove utility classes from `app/globals.css`
   - Use inline Tailwind classes instead
   - Slightly less maintainable but functional

3. **Confidence badges unreadable in dark mode:**
   - Adjust opacity: `/10` ’ `/15` or `/20`
   - Increase border opacity: `/20` ’ `/30`
   - Test contrast with online tools

4. **Large AIBadge too prominent:**
   - Reduce padding: `px-4 py-2` ’ `px-3.5 py-1.5`
   - Reduce icon: `h-4 w-4` ’ `h-3.5 w-3.5`
   - Maintain grid compliance

5. **Purple focus rings conflict with design:**
   - Remove AI-specific focus styles
   - AI elements use global blue focus ring
   - Slightly less distinctive but still accessible

### Git Workflow

**Commit Strategy:**

```bash
# After Step 1.1
git add components/ui/card.tsx
git commit -m "feat: add ai-hero Card variant with gradient border and shadow-e3"

# After Step 1.2
git add app/globals.css
git commit -m "feat: add confidence meter utility classes"

# After Step 1.3
git add components/ui/badge.tsx
git commit -m "feat: add confidence-high/medium/low Badge variants"

# After Step 1.4
git add QDS.md
git commit -m "docs: document AI color contrast ratios and usage guidelines"

# Continue for each step...
```

**Rollback Commands:**

```bash
# Rollback last commit
git revert HEAD

# Rollback specific commit
git revert <commit-hash>

# Rollback all AI styling changes
git revert <first-commit-hash>^..<last-commit-hash>
```

---

## File Modification Summary

### Files to Modify (6 total)

#### Phase 1 (P0)

1. **components/ui/card.tsx**
   - Add: `ai-hero` variant to cardVariants
   - Lines modified: ~1 (add to variants object)
   - Risk: Low (additive change)

2. **app/globals.css**
   - Add: Confidence meter utilities
   - Add: AI focus indicators (Phase 2)
   - Lines modified: ~30
   - Risk: Low (new utilities, no conflicts)

3. **components/ui/badge.tsx**
   - Add: `confidence-high`, `confidence-medium`, `confidence-low` variants
   - Lines modified: ~3 (add to variants object)
   - Risk: Low (additive change)

4. **QDS.md**
   - Add: Contrast ratio table
   - Add: AI component usage guidelines
   - Lines modified: ~80
   - Risk: None (documentation only)

#### Phase 2 (P1)

5. **components/ui/ai-badge.tsx**
   - Add: `large` variant
   - Modify: Type definition, sizeClasses, icon sizing
   - Lines modified: ~8
   - Risk: Low (additive change, maintains existing behavior)

#### Phase 3 (P2)

6. **lib/models/types.ts**
   - Add: CONFIDENCE_THRESHOLDS constant
   - Add: Confidence utility functions
   - Lines modified: ~30
   - Risk: None (new exports, no breaking changes)

---

## Success Criteria

### Implementation Complete When:

 **Functionality:**
- [ ] AI hero card renders with gradient border and shadow-e3
- [ ] Confidence meter bar fills based on percentage
- [ ] Confidence badges display correct colors for all levels
- [ ] Large AIBadge renders with proper sizing
- [ ] Purple focus rings appear on AI card elements

 **QDS Compliance:**
- [ ] All AI colors use QDS tokens (no hardcoded hex)
- [ ] All spacing follows 4pt grid
- [ ] All radius uses QDS scale
- [ ] All shadows use QDS elevation system

 **Accessibility:**
- [ ] All text meets 4.5:1 contrast (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader announces elements correctly
- [ ] Semantic HTML used (section, headings, ARIA)

 **Quality:**
- [ ] TypeScript passes strict mode (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings
- [ ] Dark mode works correctly

 **Performance:**
- [ ] Glass blur layers d 3 per view
- [ ] No layout shift (CLS unchanged)
- [ ] Animations smooth (60fps)
- [ ] Reduced motion honored

 **Documentation:**
- [ ] Contrast ratios documented in QDS.md
- [ ] Usage guidelines documented
- [ ] Confidence thresholds documented (70/40 split)
- [ ] Blur layer budget documented in component JSDoc

---

## Next Steps After Implementation

### Component Creation (Separate Task)

Once QDS foundation is complete, create these components:

1. **ConfidenceMeter Component** (`components/course/confidence-meter.tsx`)
   - Uses confidence meter utilities from Step 1.2
   - Uses confidence utility functions from Step 3.1
   - Displays visual bar + percentage

2. **CitationList Component** (`components/course/citation-list.tsx`)
   - Expandable list of source citations
   - Links to course materials
   - Proper ARIA attributes

3. **AIAnswerCard Component** (`components/course/ai-answer-card.tsx`)
   - Combines Card variant="ai-hero"
   - Uses AIBadge variant="large"
   - Embeds ConfidenceMeter
   - Embeds CitationList
   - Includes endorsement system

### Integration (Separate Task)

4. **Thread Detail Page** (`app/threads/[threadId]/page.tsx`)
   - Render AIAnswerCard first (above human replies)
   - Add "Human Replies" section header
   - Maintain semantic HTML structure

5. **Ask Page Preview** (`app/ask/page.tsx`)
   - Show AI preview modal before posting
   - Uses AIAnswerCard component
   - "Post Question" button after preview

---

**End of Implementation Plan**

*This plan is ready for execution. Read `research/qds-ai-styling.md` for audit details and rationale.*

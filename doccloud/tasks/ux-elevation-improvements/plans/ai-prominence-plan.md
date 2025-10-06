# AI Feature Prominence Implementation Plan

**Goal:** Make AI integration visually prominent and discoverable across the application

**Context:** Users don't currently recognize AI as the app's strongpoint. AI features exist (FloatingQuokka, /quokka page, AI coverage metrics) but lack visual identity and discoverability.

---

## Design System Additions

### AI Color Palette (QDS Extension)

```css
/* AI-specific gradient tokens */
--ai-gradient-start: #9333EA;     /* Purple 600 - AI/Magic */
--ai-gradient-end: #06B6D4;       /* Cyan 500 - Tech/Intelligence */
--ai-badge-bg: #9333EA;           /* Purple for AI badges */
--ai-badge-text: #FFFFFF;         /* White text on purple */
--ai-glow: #9333EA40;             /* Purple with 25% opacity for glow */
```

### AI Gradient Utility Classes

```css
.ai-gradient {
  background: linear-gradient(135deg, var(--ai-gradient-start) 0%, var(--ai-gradient-end) 100%);
}

.ai-gradient-text {
  background: linear-gradient(135deg, var(--ai-gradient-start) 0%, var(--ai-gradient-end) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-glow {
  box-shadow: 0 0 20px var(--ai-glow);
}
```

---

## Component Enhancements

### 1. AI Badge Component (NEW)
**File:** `components/ui/ai-badge.tsx`

```typescript
interface AIBadgeProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function AIBadge({ variant = 'default', className }: AIBadgeProps) {
  return (
    <Badge className="ai-gradient text-white">
      <Sparkles className="h-3 w-3" />
      {variant !== 'icon-only' && <span>AI</span>}
    </Badge>
  );
}
```

**Usage:**
- AI-generated answers
- FloatingQuokka button
- AI page header
- AI coverage metrics

---

### 2. FloatingQuokka Enhancements
**File:** `components/course/floating-quokka.tsx`

**Changes:**

```typescript
// Line 222-228: Update FAB button with AI branding
<Button
  ref={fabButtonRef}
  onClick={handleExpand}
  className={`h-14 w-14 rounded-full ai-gradient ai-glow shadow-e3 hover:shadow-e3 transition-all ${
    isFirstVisit ? "animate-pulse" : ""
  }`}
  aria-label="Open Quokka AI Assistant"
>
  <Sparkles className="h-6 w-6 text-white" />  {/* Changed from MessageCircle */}
</Button>

// Line 266-272: Add AI badge to header
<div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center">
    <Sparkles className="h-5 w-5 text-white" />
  </div>
  <div>
    <CardTitle id="quokka-title" className="text-base glass-text flex items-center gap-2">
      Quokka AI
      <AIBadge variant="compact" />
    </CardTitle>
    {/* ... rest of code ... */}
  </div>
</div>
```

**Outcome:** FloatingQuokka now has distinctive AI visual identity with purple-cyan gradient and Sparkles icon.

---

### 3. AI Page (/quokka) Enhancements
**File:** `app/quokka/page.tsx`

**Changes:**

```typescript
// Line 119-125: Add AI gradient to header
<div className="text-center py-8 md:py-12 space-y-6">
  <div className="space-y-4">
    <div className="flex items-center justify-center gap-3">
      <Sparkles className="h-10 w-10 ai-gradient-text" />
      <h1 className="heading-2 ai-gradient-text">Quokka AI</h1>
      <Sparkles className="h-10 w-10 ai-gradient-text" />
    </div>
    <AIBadge variant="default" className="mx-auto" />
    {/* ... rest of code ... */}
  </div>
</div>

// Line 136-138: Add AI badge to online status
<Badge className="ai-gradient text-white border-none">
  ● AI Online
</Badge>
```

**Outcome:** Dedicated AI page has strong visual identity matching FloatingQuokka.

---

### 4. AI Coverage Display (NEW)
**File:** `components/dashboard/ai-coverage-card.tsx`

```typescript
interface AICoverageCardProps {
  percentage: number;
  totalThreads: number;
  aiThreads: number;
}

export function AICoverageCard({ percentage, totalThreads, aiThreads }: AICoverageCardProps) {
  return (
    <Card variant="glass">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-5 glass-text flex items-center gap-2">
            <Sparkles className="h-5 w-5 ai-gradient-text" />
            AI Coverage
          </CardTitle>
          <AIBadge variant="compact" />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <div className="text-5xl font-bold ai-gradient-text">
            {percentage}%
          </div>
          <p className="text-sm text-muted-foreground glass-text">
            {aiThreads} of {totalThreads} threads answered by AI
          </p>
          <div className="h-2 rounded-full bg-glass-medium overflow-hidden">
            <div
              className="h-full ai-gradient transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage:** Instructor dashboard to highlight AI contribution.

---

### 5. Course Card AI Indicator
**File:** `components/dashboard/enhanced-course-card.tsx`

**Changes:** Add AI badge when course has high AI coverage

```typescript
// Inside CourseCard component, add after status badge:
{aiCoverage && aiCoverage > 30 && (
  <AIBadge variant="icon-only" className="ml-auto" />
)}
```

**Outcome:** Courses with significant AI help show AI badge.

---

## Page Integrations

### Instructor Dashboard
**File:** `app/dashboard/page.tsx` (instructor view)

**Add AI Coverage Card:**
- Insert AICoverageCard in stats grid
- Show AI coverage percentage prominently
- Link to AI settings/configuration (future)

### Course Pages
**File:** `app/courses/[courseId]/page.tsx`

**Existing:** FloatingQuokka already integrated
**Enhancement:** Add subtle "AI Assistant Available" indicator in header

```typescript
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Sparkles className="h-4 w-4 ai-gradient-text" />
  <span>AI Assistant Available</span>
</div>
```

---

## Icon Strategy

### Replace MessageCircle with Sparkles
- **Sparkles icon** represents AI/magic better than generic message icon
- Import from Lucide: `import { Sparkles } from "lucide-react"`
- Use consistently across all AI features

### Icon Hierarchy
1. **Primary AI Icon:** Sparkles (4-6px, gradient colored)
2. **AI Badge Icon:** Sparkles (3px, white on gradient background)
3. **AI Availability:** Sparkles (4px, gradient colored) + text

---

## Accessibility Considerations

### ARIA Labels
```typescript
<AIBadge aria-label="AI-powered feature" />
<Sparkles aria-hidden="true" className="ai-gradient-text" />
<span className="sr-only">Powered by Quokka AI</span>
```

### Color Contrast
- AI gradient background: Use white text (21:1 contrast ratio)
- AI gradient text: Ensure underlying background provides 4.5:1 minimum
- Test in both light and dark modes

### Focus Indicators
```css
.ai-gradient:focus-visible {
  outline: 2px solid var(--ai-gradient-start);
  outline-offset: 2px;
}
```

---

## Implementation Order

1. **Phase 1: Design Tokens** (5 min)
   - Add AI color variables to `app/globals.css`
   - Create utility classes for gradients and glow

2. **Phase 2: AIBadge Component** (10 min)
   - Create `components/ui/ai-badge.tsx`
   - Add Sparkles icon import
   - Export from components/ui

3. **Phase 3: FloatingQuokka** (15 min)
   - Update FAB button with gradient and Sparkles
   - Add AI badge to header
   - Test minimized/expanded states

4. **Phase 4: AI Page** (10 min)
   - Add gradient to page header
   - Update online badge with AI branding
   - Add Sparkles decorations

5. **Phase 5: Dashboard Integration** (15 min)
   - Create AICoverageCard component
   - Add to instructor dashboard
   - Update course cards with AI indicators

6. **Phase 6: Verification** (10 min)
   - Test all pages in light/dark mode
   - Verify contrast ratios
   - Check keyboard navigation
   - Test responsive layouts

**Total Time:** ~65 minutes

---

## Files to Modify

### New Files
- `components/ui/ai-badge.tsx` (30 lines)
- `components/dashboard/ai-coverage-card.tsx` (50 lines)

### Modified Files
- `app/globals.css` (add 15 lines for AI tokens)
- `components/course/floating-quokka.tsx` (10 changes: gradient, icon, badge)
- `app/quokka/page.tsx` (8 changes: gradient header, badges)
- `app/dashboard/page.tsx` (add AICoverageCard to instructor view)
- `components/dashboard/enhanced-course-card.tsx` (add AI indicator)
- `app/courses/[courseId]/page.tsx` (add AI availability indicator)

---

## Testing Checklist

- [ ] AI gradient renders correctly in light/dark mode
- [ ] AIBadge component displays in all variants
- [ ] FloatingQuokka has visible AI branding
- [ ] AI page header shows gradient text
- [ ] AICoverageCard calculates percentage correctly
- [ ] Course cards show AI badge when applicable
- [ ] Sparkles icon loads correctly (Lucide import)
- [ ] Contrast ratios meet WCAG AA (4.5:1)
- [ ] Keyboard navigation works for all AI features
- [ ] Screen readers announce "AI" appropriately
- [ ] Responsive layouts don't break AI visual elements
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Risks & Mitigation

**Risk:** AI gradient may clash with existing QDS color scheme
**Mitigation:** Use purple-cyan gradient sparingly, only for AI-specific features

**Risk:** Sparkles icon may feel too playful for academic context
**Mitigation:** Use alongside professional typography and glass morphism to balance

**Risk:** AI badges may create visual clutter
**Mitigation:** Use compact/icon-only variants in dense layouts

**Risk:** Users may not understand what "AI" means
**Mitigation:** Add tooltips and onboarding in future phase

---

## Future Enhancements (Out of Scope)

- AI onboarding tooltip tour
- AI settings page
- AI answer confidence visualization
- AI-generated content attribution
- AI vs human response comparison
- AI usage analytics

---

## Success Metrics

**Before:**
- AI features hidden/undiscoverable
- FloatingQuokka looks like generic chat button
- No AI visual identity
- AI coverage metric buried

**After:**
- AI features have distinctive purple-cyan gradient identity
- FloatingQuokka has Sparkles icon and gradient
- AI badge appears on AI-generated content
- AI coverage prominently displayed on instructor dashboard
- Consistent AI visual language across all features

---

## QDS Compliance

✅ Uses semantic color tokens (new AI palette)
✅ Follows 4pt spacing grid
✅ Maintains 4.5:1 contrast minimum
✅ Uses existing shadow scale (shadow-e2, shadow-e3)
✅ Responsive sizing (text-sm, text-base)
✅ Accessible focus states
✅ Semantic HTML and ARIA labels

---

**Ready for Implementation:** All design decisions made, file paths specified, component signatures defined. Parent agent can proceed with implementation in small, verified steps.

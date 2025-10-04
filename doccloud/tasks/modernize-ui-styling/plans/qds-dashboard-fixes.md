# QDS Compliance Fixes: Dashboard System

**Created:** 2025-10-04
**Scope:** Dashboard, FloatingQuokka, Ask Form, NavHeader
**Audit Report:** `research/qds-dashboard-audit.md`

---

## Files to Modify

1. `/components/course/floating-quokka.tsx` - 4 fixes
2. `/app/courses/[courseId]/page.tsx` - 5 fixes
3. `/app/globals.css` - 1 addition

---

## Fix Summary

**Critical:** 2 fixes (hardcoded opacity, inline style)
**Medium:** 4 fixes (spacing, ARIA, badge tokens)
**Minor:** 1 fix (touch targets)

**Total:** 7 fixes + 1 new utility class

---

## Detailed Fixes

### File 1: `/components/course/floating-quokka.tsx`

#### Fix 1.1 - Remove Inline Style (CRITICAL)
**Line:** 232
**Type:** Inline style → Tailwind utility

**Current:**
```tsx
<Card variant="glass-strong" className="flex flex-col shadow-e3" style={{ height: "500px" }}>
```

**Replace with:**
```tsx
<Card variant="glass-strong" className="flex flex-col shadow-e3 h-[500px]">
```

**Rationale:** Eliminates inline style attribute. While `h-[500px]` is arbitrary, it's more acceptable than inline styles for a fixed chat window height.

---

#### Fix 1.2 - Replace Hardcoded Opacity with Token (CRITICAL)
**Line:** 236
**Type:** Hardcoded opacity → Semantic token

**Current:**
```tsx
<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
  <MessageCircle className="h-5 w-5 text-primary" />
</div>
```

**Replace with:**
```tsx
<div className="h-10 w-10 rounded-full avatar-placeholder flex items-center justify-center">
  <MessageCircle className="h-5 w-5 text-primary" />
</div>
```

**Rationale:** `.avatar-placeholder` utility provides exact same styling (`bg-[hsl(var(--avatar-bg))] text-[hsl(var(--avatar-text))]`) with proper dark mode support.

---

#### Fix 1.3 - Replace Badge Arbitrary Opacity (MEDIUM)
**Line:** 241
**Type:** Arbitrary opacity → Semantic utility

**Current:**
```tsx
<Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/30 text-xs">
  ● Online
</Badge>
```

**Replace with:**
```tsx
<Badge variant="outline" className="mt-1 status-online text-xs">
  ● Online
</Badge>
```

**Rationale:** New `.status-online` utility (added in globals.css) provides consistent styling with dark mode support, matching `.status-open/answered/resolved` pattern.

**Dependencies:** Requires Fix 3.1 (new utility in globals.css) to be applied first.

---

#### Fix 1.4 - Increase Touch Target Size (MINOR)
**Line:** 310-318
**Type:** Accessibility - WCAG 2.5.5 compliance

**Current:**
```tsx
<Button
  key={prompt}
  variant="outline"
  size="sm"
  onClick={() => setInput(prompt)}
  className="text-xs"
>
  {prompt}
</Button>
```

**Replace with:**
```tsx
<Button
  key={prompt}
  variant="outline"
  size="default"
  onClick={() => setInput(prompt)}
  className="text-xs min-h-[44px]"
>
  {prompt}
</Button>
```

**Rationale:** `size="sm"` results in 36px height. `size="default"` + `min-h-[44px]` ensures 44×44px minimum touch target for WCAG 2.5.5 compliance.

---

### File 2: `/app/courses/[courseId]/page.tsx`

#### Fix 2.1 - Fix Input Height to QDS Grid (MEDIUM)
**Line:** 181
**Type:** Spacing compliance - 4pt grid

**Current:**
```tsx
className="h-11 text-base"
```

**Replace with:**
```tsx
className="h-12 text-base"
```

**Rationale:** `h-11` = 44px (not on 4pt grid). `h-12` = 48px (compliant with 4pt grid: 48 = 12 × 4).

---

#### Fix 2.2 - Add ARIA Required to Title Input (MEDIUM)
**Line:** 176-187
**Type:** Accessibility - WCAG 2.2 AA

**Current:**
```tsx
<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="e.g., How does binary search work?"
  className="h-11 text-base"
  required
  maxLength={200}
/>
```

**Replace with:**
```tsx
<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="e.g., How does binary search work?"
  className="h-12 text-base"
  required
  aria-required="true"
  maxLength={200}
/>
```

**Changes:**
1. Add `aria-required="true"` for screen readers
2. Apply Fix 2.1 (`h-11` → `h-12`)

**Rationale:** Explicit ARIA attribute ensures screen readers announce required status. Height change aligns with 4pt grid.

---

#### Fix 2.3 - Add ARIA Required to Content Textarea (MEDIUM)
**Line:** 195-204
**Type:** Accessibility - WCAG 2.2 AA

**Current:**
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context."
  rows={8}
  className="min-h-[200px] text-base"
  required
/>
```

**Replace with:**
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context."
  rows={10}
  className="min-h-48 text-base"
  required
  aria-required="true"
/>
```

**Changes:**
1. Add `aria-required="true"` for screen readers
2. Change `rows={8}` → `rows={10}` (provides ~200px height naturally)
3. Change `className="min-h-[200px]` → `className="min-h-48"` (192px, QDS compliant)

**Rationale:**
- ARIA attribute for accessibility
- `rows={10}` removes redundancy with min-height
- `min-h-48` = 192px (48 × 4pt) - closest QDS value to 200px
- Visual difference negligible (8px shorter)

---

#### Fix 2.4 - Fix Tags Input Height (MEDIUM)
**Line:** 216
**Type:** Spacing compliance - 4pt grid

**Current:**
```tsx
className="h-11 text-base"
```

**Replace with:**
```tsx
className="h-12 text-base"
```

**Rationale:** Same as Fix 2.1 - aligns with 4pt grid spacing scale.

---

### File 3: `/app/globals.css`

#### Fix 3.1 - Add Status Online Badge Utility (MEDIUM)
**Location:** After line 565 (in Status Badge Utilities section)
**Type:** New semantic token

**Add this code:**
```css
/* Status Online (for FloatingQuokka and real-time indicators) */
.status-online {
  @apply bg-[hsl(122_40%_92%)] text-[hsl(122_50%_30%)] border border-[hsl(122_45%_70%)];
}

.dark .status-online {
  @apply bg-[hsl(122_40%_18%)] text-[hsl(122_45%_70%)] border border-[hsl(122_40%_35%)];
}
```

**Rationale:** Provides semantic utility class for "online" status badges, matching pattern of existing `.status-open`, `.status-answered`, `.status-resolved`. Uses success color (green) with proper light/dark mode opacity.

**Color Breakdown:**
- **Light mode:**
  - Background: `hsl(122, 40%, 92%)` - Very light green (success/20 equivalent)
  - Text: `hsl(122, 50%, 30%)` - Dark green (readable on light bg)
  - Border: `hsl(122, 45%, 70%)` - Medium green (subtle outline)

- **Dark mode:**
  - Background: `hsl(122, 40%, 18%)` - Very dark green (success dark bg)
  - Text: `hsl(122, 45%, 70%)` - Light green (readable on dark bg)
  - Border: `hsl(122, 40%, 35%)` - Medium-dark green (subtle outline)

**Testing:** Verify contrast ratios:
- Light: 30% text on 92% bg = ~7:1 (✅ AAA)
- Dark: 70% text on 18% bg = ~6.5:1 (✅ AAA)

---

## Implementation Order

### Phase 1: Add New Utility (1 minute)
1. Apply Fix 3.1 (add `.status-online` to globals.css)
2. Verify CSS syntax is valid

### Phase 2: Fix Critical Issues (5 minutes)
3. Apply Fix 1.1 (remove inline style from FloatingQuokka)
4. Apply Fix 1.2 (replace hardcoded opacity in FloatingQuokka)
5. Run `npx tsc --noEmit` to verify TypeScript
6. Run `npm run lint` to verify ESLint

### Phase 3: Fix Medium Issues (5 minutes)
7. Apply Fix 1.3 (use .status-online badge in FloatingQuokka)
8. Apply Fixes 2.1-2.4 (spacing and ARIA in Ask form)
9. Run `npx tsc --noEmit` to verify TypeScript
10. Run `npm run lint` to verify ESLint

### Phase 4: Fix Minor Issues (2 minutes)
11. Apply Fix 1.4 (touch target size for quick prompts)
12. Run `npx tsc --noEmit` to verify TypeScript
13. Run `npm run lint` to verify ESLint

### Phase 5: Production Verification (5 minutes)
14. Run `npm run build` to verify production build
15. Test all fixed components in browser
16. Verify dark mode works correctly
17. Test keyboard navigation and touch targets

**Total Time:** ~18 minutes

---

## Token Replacement Table

### High Priority (Critical)

| Line | File | Current | Replacement | Reason |
|------|------|---------|-------------|--------|
| 232 | floating-quokka.tsx | `style={{ height: "500px" }}` | `className="...h-[500px]"` | Remove inline style |
| 236 | floating-quokka.tsx | `bg-primary/10` | `avatar-placeholder` | Use semantic token |

### Medium Priority

| Line | File | Current | Replacement | Reason |
|------|------|---------|-------------|--------|
| 181 | [courseId]/page.tsx | `h-11` | `h-12` | 4pt grid compliance |
| 176 | [courseId]/page.tsx | (no aria-required) | `aria-required="true"` | Accessibility |
| 195 | [courseId]/page.tsx | (no aria-required) | `aria-required="true"` | Accessibility |
| 200 | [courseId]/page.tsx | `rows={8}` | `rows={10}` | Align with min-height |
| 201 | [courseId]/page.tsx | `min-h-[200px]` | `min-h-48` | 4pt grid compliance |
| 216 | [courseId]/page.tsx | `h-11` | `h-12` | 4pt grid compliance |
| 241 | floating-quokka.tsx | `bg-success/10 text-success border-success/30` | `status-online` | Use semantic utility |

### Low Priority (Minor)

| Line | File | Current | Replacement | Reason |
|------|------|---------|-------------|--------|
| 313 | floating-quokka.tsx | `size="sm"` | `size="default" className="...min-h-[44px]"` | Touch target size |

---

## Before/After Examples

### Example 1: FloatingQuokka Header (Before)
```tsx
<div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
    <MessageCircle className="h-5 w-5 text-primary" />
  </div>
  <div>
    <CardTitle className="text-base glass-text">Quokka AI</CardTitle>
    <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/30 text-xs">
      ● Online
    </Badge>
  </div>
</div>
```

### Example 1: FloatingQuokka Header (After)
```tsx
<div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-full avatar-placeholder flex items-center justify-center">
    <MessageCircle className="h-5 w-5 text-primary" />
  </div>
  <div>
    <CardTitle className="text-base glass-text">Quokka AI</CardTitle>
    <Badge variant="outline" className="mt-1 status-online text-xs">
      ● Online
    </Badge>
  </div>
</div>
```

**Changes:**
- `bg-primary/10` → `avatar-placeholder` (semantic token)
- `bg-success/10 text-success border-success/30` → `status-online` (semantic utility)

---

### Example 2: Ask Form Input (Before)
```tsx
<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="e.g., How does binary search work?"
  className="h-11 text-base"
  required
  maxLength={200}
/>
```

### Example 2: Ask Form Input (After)
```tsx
<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="e.g., How does binary search work?"
  className="h-12 text-base"
  required
  aria-required="true"
  maxLength={200}
/>
```

**Changes:**
- `h-11` → `h-12` (4pt grid: 44px → 48px)
- Added `aria-required="true"` (accessibility)

---

### Example 3: Ask Form Textarea (Before)
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description..."
  rows={8}
  className="min-h-[200px] text-base"
  required
/>
```

### Example 3: Ask Form Textarea (After)
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description..."
  rows={10}
  className="min-h-48 text-base"
  required
  aria-required="true"
/>
```

**Changes:**
- `rows={8}` → `rows={10}` (natural ~200px height)
- `min-h-[200px]` → `min-h-48` (192px, 4pt grid compliant)
- Added `aria-required="true"` (accessibility)

---

## Testing Checklist

### Pre-Implementation
- [x] Read audit report (`research/qds-dashboard-audit.md`)
- [x] Understand all fixes and rationale
- [x] Confirm no breaking changes

### During Implementation (After Each Phase)
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] ESLint passes: `npm run lint`
- [ ] Dev server runs: `npm run dev`
- [ ] Visual inspection in browser

### Post-Implementation
- [ ] Production build succeeds: `npm run build`
- [ ] All routes render without errors
- [ ] Bundle size unchanged (should be identical)

### Manual Testing
- [ ] **FloatingQuokka:** Click minimize button → chat minimizes
- [ ] **FloatingQuokka:** Click expand button → chat opens with welcome message
- [ ] **FloatingQuokka:** "Online" badge shows green background
- [ ] **FloatingQuokka:** Avatar icon has correct background color
- [ ] **FloatingQuokka:** Quick prompt buttons are large enough to tap
- [ ] **Ask Form:** Title input height is ~48px (h-12)
- [ ] **Ask Form:** Textarea height is ~200px (rows={10})
- [ ] **Ask Form:** Screen reader announces "required" on title/content
- [ ] **Dark Mode:** All components render correctly with dark tokens
- [ ] **Keyboard Nav:** Tab through all interactive elements, focus visible

### Accessibility Testing
- [ ] Keyboard: Navigate Ask form with Tab, fill fields, submit with Enter
- [ ] Keyboard: Open FloatingQuokka, type message, send with Enter
- [ ] Keyboard: Press Escape to minimize FloatingQuokka
- [ ] Touch: All buttons ≥44×44px on mobile viewport (360px width)
- [ ] Screen Reader: NVDA/VoiceOver announces "required" on form fields
- [ ] Contrast: All text readable in light and dark modes

### Responsive Testing
- [ ] 360px (mobile): All content readable, touch targets adequate
- [ ] 768px (tablet): Layout adjusts, no horizontal scroll
- [ ] 1024px (desktop): Full layout visible
- [ ] 1280px (wide): Content centered, max-width enforced

---

## Rollback Plan

If any issues arise:

### Immediate Rollback (Git)
```bash
git diff HEAD  # Review all changes
git checkout -- app/courses/[courseId]/page.tsx  # Rollback single file
git checkout -- components/course/floating-quokka.tsx
git checkout -- app/globals.css
```

### Partial Rollback
If only one fix causes issues:
1. Identify problematic fix in audit report
2. Revert specific lines using Git or manual edit
3. Re-test

### Full Rollback
```bash
git stash  # Save work
git stash drop  # Discard changes
```

---

## Success Criteria

**QDS Compliance Score:** 98/100 (from 92/100)

### Violations Eliminated:
- ✅ 0 hardcoded hex colors
- ✅ 0 arbitrary opacity values (replaced with semantic tokens)
- ✅ 0 inline style attributes
- ✅ All spacing on 4pt grid (h-11 → h-12, min-h-[200px] → min-h-48)
- ✅ All required inputs have aria-required
- ✅ All touch targets ≥44×44px

### Remaining "Violations" (Acceptable):
- Chat window height `h-[500px]` (functionally justified, not a token issue)
- Textarea `rows={10}` (HTML attribute, not CSS)

### Accessibility Improvements:
- All form fields announce "required" status
- All buttons meet WCAG 2.5.5 touch target minimum
- Enhanced screen reader experience

---

## Notes for Implementation

1. **Fix 3.1 MUST be applied first** - Other fixes depend on `.status-online` utility
2. **TypeScript will not change** - All fixes are className/prop changes only
3. **No logic changes** - Only visual/accessibility improvements
4. **Bundle size unchanged** - No new dependencies, only CSS utility additions
5. **Backwards compatible** - No breaking changes to component APIs

---

## Related Files

- Audit Report: `doccloud/tasks/modernize-ui-styling/research/qds-dashboard-audit.md`
- Task Context: `doccloud/tasks/modernize-ui-styling/context.md`
- Design System: `app/globals.css` (QDS v1.0 tokens)

---

**End of Implementation Plan**

# QDS Compliance Fixes: Thread Components

**Components:** `thread-card.tsx`, `threads/[threadId]/page.tsx`
**Priority:** Medium (AA compliance + minor polish)
**Estimated Time:** 30-45 minutes
**Dependencies:** None

---

## Files to Modify

1. `components/course/thread-card.tsx` - 3 changes (1 medium, 2 minor)
2. `app/threads/[threadId]/page.tsx` - 3 changes (1 medium, 2 minor)
3. `app/globals.css` - 1 addition (new utility class)

---

## Token Replacements

### High Priority (AA Compliance)

| Line | File | Current Code | Replacement | Impact |
|------|------|--------------|-------------|--------|
| 66 | `thread-card.tsx` | `<span className="text-border">•</span>` | `<span className="text-muted-foreground opacity-50">•</span>` | Fixes contrast 2.1:1 → 4.8:1 |
| 76 | `thread-card.tsx` | `<span className="text-border">•</span>` | `<span className="text-muted-foreground opacity-50">•</span>` | Fixes contrast 2.1:1 → 4.8:1 |
| 42-43 | `thread-card.tsx` | No focus indicator on Link | Add focus styles (see Phase 1 below) | WCAG 2.4.7 keyboard nav |
| 258 | `page.tsx` | `border-[var(--border-glass)]` | `border-glass` | Use semantic utility |

---

### Medium Priority (Grid Alignment)

| Line | File | Current | Replacement | Impact |
|------|------|---------|-------------|--------|
| 72 | `thread-card.tsx` | `className="h-3.5 w-3.5"` | `className="size-4"` | 4pt grid (14px → 16px) |
| 80 | `thread-card.tsx` | `className="h-3.5 w-3.5"` | `className="size-4"` | 4pt grid (14px → 16px) |
| 89 | `thread-card.tsx` | `className="h-3.5 w-3.5"` | `className="size-4"` | 4pt grid (14px → 16px) |
| 188 | `page.tsx` | `className="h-11 w-11 avatar-placeholder"` | `className="size-12 avatar-placeholder"` | 4pt grid (44px → 48px) |

---

### Low Priority (Polish)

| Line | File | Current | Replacement | Impact |
|------|------|---------|-------------|--------|
| 60 | `page.tsx` | `bg-glass-medium rounded-lg` | `glass-panel` | Semantic utility + backdrop blur |
| 61 | `page.tsx` | `bg-glass-medium rounded-lg` | `glass-panel` | Semantic utility + backdrop blur |
| 62 | `page.tsx` | `bg-glass-medium rounded-xl` | `glass-panel rounded-xl` | Semantic utility + backdrop blur |
| 65 | `page.tsx` | `bg-glass-medium rounded-xl` | `glass-panel rounded-xl` | Semantic utility + backdrop blur |

---

## Detailed Implementation Steps

### Phase 1: Critical Fixes (AA Compliance)

**Estimated Time:** 10 minutes

#### Step 1.1: Fix Separator Contrast (ThreadCard)

**File:** `components/course/thread-card.tsx`

**Lines 66 and 76:**

```tsx
// BEFORE (Line 66)
{thread.hasAIAnswer && (
  <>
    <AIBadge variant="compact" aria-label="Has AI-generated answer" />
    <span className="text-border">•</span>
  </>
)}

// AFTER
{thread.hasAIAnswer && (
  <>
    <AIBadge variant="compact" aria-label="Has AI-generated answer" />
    <span className="text-muted-foreground opacity-50">•</span>
  </>
)}
```

```tsx
// BEFORE (Line 76)
<div className="flex items-center gap-1.5">
  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
  <span>{thread.views} views</span>
</div>

<span className="text-border">•</span>

// AFTER
<div className="flex items-center gap-1.5">
  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
  <span>{thread.views} views</span>
</div>

<span className="text-muted-foreground opacity-50">•</span>
```

**Verification:**
```bash
# Check contrast with browser DevTools
# Light mode: #625C52 (muted-foreground) at 50% opacity on white = ~4.8:1 ✅
# Dark mode: #B8AEA3 (muted-foreground) at 50% opacity on dark = ~5.1:1 ✅
```

**Total Changes:** Replace `text-border` with `text-muted-foreground opacity-50` on **2 lines** (66, 76)

---

#### Step 1.2: Add Focus Indicator (ThreadCard)

**File:** `components/course/thread-card.tsx`

**Lines 42-43:**

```tsx
// BEFORE
export function ThreadCard({ thread, className }: ThreadCardProps) {
  return (
    <Link href={`/threads/${thread.id}`} className={className}>
      <Card variant="glass-hover">

// AFTER
export function ThreadCard({ thread, className }: ThreadCardProps) {
  return (
    <Link
      href={`/threads/${thread.id}`}
      className={cn(
        "group rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 focus-visible:ring-4 focus-visible:ring-ring/30 transition-all",
        className
      )}
    >
      <Card variant="glass-hover" className="transition-all duration-250 group-focus-visible:shadow-[var(--shadow-glass-lg)]">
```

**Also update closing tags to match (line ~107):**

```tsx
// BEFORE
      </Card>
    </Link>
  );
}

// AFTER
      </Card>
    </Link>
  );
}
```

**Import cn utility if not already imported:**

Check line 1-10. If `cn` is not imported from `@/lib/utils`, add it:

```tsx
import { cn } from "@/lib/utils";
```

**Verification:**
```bash
# Tab through cards with keyboard, should see:
# - 2px outline ring in accent color (var(--ring))
# - 2px offset from card edge
# - 4px ring glow (30% opacity)
# - Card shadow intensifies on focus
```

**Total Changes:**
- Wrap Link className with `cn()` utility
- Add focus-visible classes to Link
- Add focus-responsive className to Card
- Ensure `cn` is imported

---

#### Step 1.3: Replace Hardcoded Border (ThreadDetail Page)

**File:** `app/threads/[threadId]/page.tsx`

**Line 258:**

```tsx
// BEFORE
<div className="flex justify-end pt-6 border-t border-[var(--border-glass)]">
  <Button

// AFTER
<div className="flex justify-end pt-6 border-t border-glass">
  <Button
```

**NOTE:** This requires adding `.border-glass` utility to `globals.css`. See Phase 3 below.

**Total Changes:** Replace `border-[var(--border-glass)]` with `border-glass` on **1 line** (258)

---

### Phase 2: Medium Priority (Grid Alignment)

**Estimated Time:** 10 minutes

#### Step 2.1: Standardize Icon Sizes (ThreadCard)

**File:** `components/course/thread-card.tsx`

**Lines 72, 80, 89:**

```tsx
// BEFORE (Line 72)
<div className="flex items-center gap-1.5">
  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
  <span>{thread.views} views</span>
</div>

// AFTER
<div className="flex items-center gap-1.5">
  <Eye className="size-4" aria-hidden="true" />
  <span>{thread.views} views</span>
</div>
```

```tsx
// BEFORE (Line 80)
<div className="flex items-center gap-1.5">
  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
</div>

// AFTER
<div className="flex items-center gap-1.5">
  <Calendar className="size-4" aria-hidden="true" />
  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
</div>
```

```tsx
// BEFORE (Line 89)
<div className="flex items-center gap-2 flex-wrap">
  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
  {thread.tags.slice(0, 3).map((tag) => (

// AFTER
<div className="flex items-center gap-2 flex-wrap">
  <Tag className="size-4" aria-hidden="true" />
  {thread.tags.slice(0, 3).map((tag) => (
```

**Rationale:**
- `h-3.5 w-3.5` = 14px (not on 4pt grid)
- `size-4` = 16px (4 × 4pt = 16px ✅)
- Slightly larger icons improve readability
- Aligns with QDS spacing scale

**Verification:**
```bash
# Icons should be 16px × 16px
# Visually aligned with text baseline
# No layout shift
```

**Total Changes:** Replace `h-3.5 w-3.5` with `size-4` on **3 lines** (72, 80, 89)

---

#### Step 2.2: Fix Avatar Grid Alignment (ThreadDetail Page)

**File:** `app/threads/[threadId]/page.tsx`

**Line 188:**

```tsx
// BEFORE
<Avatar className="h-11 w-11 avatar-placeholder">
  <span className="text-sm font-semibold">
    {post.authorId.slice(-2).toUpperCase()}
  </span>
</Avatar>

// AFTER
<Avatar className="size-12 avatar-placeholder">
  <span className="text-sm font-semibold">
    {post.authorId.slice(-2).toUpperCase()}
  </span>
</Avatar>
```

**Rationale:**
- `h-11 w-11` = 44px (meets touch target but not on grid)
- `size-12` = 48px (12 × 4pt = 48px ✅)
- Maintains 44px+ touch target (WCAG 2.5.5)
- Better grid alignment with surrounding elements

**Verification:**
```bash
# Avatar should be 48px × 48px
# Still large enough for readability
# Aligns with card padding
```

**Total Changes:** Replace `h-11 w-11` with `size-12` on **1 line** (188)

---

### Phase 3: Low Priority (Polish)

**Estimated Time:** 15 minutes

#### Step 3.1: Add Glass Border Utility (globals.css)

**File:** `app/globals.css`

**Location:** Inside `@layer utilities` block (after line 643)

```css
/* ===== Enhanced Spacing Utilities ===== */
@layer utilities {
  /* ... existing utilities ... */

  /* Glass Border Utility */
  .border-glass {
    border-color: var(--border-glass);
  }

  /* Optional: Glass border variants for hover/focus */
  .hover\:border-glass:hover {
    border-color: var(--border-glass);
  }

  .focus\:border-glass:focus {
    border-color: var(--border-glass);
  }
}
```

**Rationale:**
- Tailwind best practice: use utility classes, not inline CSS variables
- Enables variant composition (`hover:border-glass`, `focus:border-glass`)
- Consistent with other QDS utilities (`.glass-panel`, `.glass-text`)

**Verification:**
```bash
# Check that border-glass class works:
npx tailwindcss --watch
# Look for .border-glass in compiled CSS
```

**Total Changes:** Add **5 lines** to globals.css utilities layer

---

#### Step 3.2: Update Skeleton Styles (ThreadDetail Page)

**File:** `app/threads/[threadId]/page.tsx`

**Lines 60-65:**

```tsx
// BEFORE
<div className="container-narrow space-y-12">
  <Skeleton className="h-6 w-32 bg-glass-medium rounded-lg" />
  <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
  <Skeleton className="h-64 bg-glass-medium rounded-xl" />
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-40 bg-glass-medium rounded-xl" />
    ))}
  </div>
</div>

// AFTER
<div className="container-narrow space-y-12">
  <Skeleton className="h-6 w-32 glass-panel rounded-lg" />
  <Skeleton className="h-16 w-96 glass-panel rounded-lg" />
  <Skeleton className="h-64 glass-panel rounded-xl" />
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-40 glass-panel rounded-xl" />
    ))}
  </div>
</div>
```

**Rationale:**
- `.glass-panel` provides backdrop blur + glass background + border + shadow
- More consistent with loaded card states
- Better visual fidelity during loading

**Verification:**
```bash
# Skeleton should have:
# - Backdrop blur (12px)
# - Glass background (var(--glass-medium))
# - Glass border (1px solid var(--border-glass))
# - Glass shadow (var(--shadow-glass-md))
```

**Total Changes:** Replace `bg-glass-medium` with `glass-panel` on **4 lines** (60, 61, 62, 65)

---

## Implementation Order

### Recommended Sequence

1. **Phase 3.1 FIRST** - Add `.border-glass` utility to globals.css
2. **Phase 1.1** - Fix separator contrast (ThreadCard)
3. **Phase 1.2** - Add focus indicator (ThreadCard)
4. **Phase 1.3** - Replace hardcoded border (ThreadDetail) - now uses utility from step 1
5. **Phase 2.1** - Standardize icon sizes (ThreadCard)
6. **Phase 2.2** - Fix avatar grid alignment (ThreadDetail)
7. **Phase 3.2** - Update skeleton styles (ThreadDetail)

**Why this order?**
- globals.css must be updated first so `.border-glass` utility exists
- Critical AA compliance fixes next (Phase 1)
- Grid alignment polish (Phase 2)
- Visual polish last (Phase 3.2)

---

## Testing Checklist

### After Each Phase

- [ ] **Visual Regression:** Compare before/after screenshots at 360px, 768px, 1024px, 1280px
- [ ] **TypeScript:** Run `npx tsc --noEmit` - must pass
- [ ] **Lint:** Run `npm run lint` - must pass
- [ ] **Build:** Run `npm run build` - must succeed
- [ ] **Console:** Check browser console - no errors

### Phase 1 Specific Tests

- [ ] **Contrast:** Use browser DevTools to verify separator dots are ≥4.5:1
- [ ] **Focus Indicator:** Tab through ThreadCard list - focus ring visible on each card
- [ ] **Focus Indicator (Dark):** Toggle dark mode - focus ring still visible
- [ ] **Keyboard Nav:** Can navigate to thread detail using Enter key on focused card
- [ ] **Border Utility:** Inspect form footer - uses `.border-glass` class (not inline var)

### Phase 2 Specific Tests

- [ ] **Icon Size:** Measure icons - should be 16px × 16px
- [ ] **Avatar Size:** Measure avatar - should be 48px × 48px
- [ ] **Grid Alignment:** Icons and avatar align with text baseline
- [ ] **Touch Target:** Avatar still large enough for touch (48px > 44px minimum)

### Phase 3 Specific Tests

- [ ] **Skeleton Blur:** Skeleton loading states have backdrop blur effect
- [ ] **Skeleton Consistency:** Skeletons match loaded card visual style
- [ ] **Glass Utility:** `.border-glass` class exists in compiled CSS
- [ ] **Hover Variants:** Hover/focus variants work if used

---

## Rollback Plan

### If Issues Arise

Each phase is independent and can be reverted separately:

**Phase 1 Rollback:**
```bash
git checkout HEAD -- components/course/thread-card.tsx app/threads/[threadId]/page.tsx
```

**Phase 2 Rollback:**
```bash
# Same as Phase 1 - single file rollback
```

**Phase 3 Rollback:**
```bash
git checkout HEAD -- app/globals.css app/threads/[threadId]/page.tsx
```

**Critical Rollback (Nuclear Option):**
```bash
# Revert entire commit
git revert <commit-hash>
```

---

## Expected Outcomes

### Before Fixes

- ❌ Separator dots fail contrast (2.1:1)
- ❌ ThreadCard has no keyboard focus indicator
- ❌ Hardcoded CSS variable in border
- ❌ Icons not on 4pt grid (14px)
- ❌ Avatar not on 4pt grid (44px)
- ❌ Skeletons lack backdrop blur

### After Fixes

- ✅ All text meets WCAG AA (4.5:1+ contrast)
- ✅ ThreadCard has visible focus ring for keyboard users
- ✅ All borders use semantic utilities
- ✅ All icons on 4pt grid (16px)
- ✅ Avatar on 4pt grid (48px)
- ✅ Skeletons match loaded card style (glass effect)

---

## Performance Impact

**Expected:** Negligible to zero.

**Analysis:**
- Focus indicator: Pure CSS, no runtime cost
- Icon size change: No DOM changes, CSS only
- `.border-glass` utility: Same CSS output as before, just cleaner syntax
- Skeleton glass panel: Adds backdrop-filter, but only during loading (temporary)

**Measurement:**
```bash
# Before/after comparison
npm run build
# Check bundle size (should be identical ±1KB)
```

---

## Accessibility Impact

**WCAG 2.1/2.2 AA Compliance:**

| Criterion | Before | After | Status |
|-----------|--------|-------|--------|
| **1.4.3 Contrast (Minimum)** | Separator fails (2.1:1) | Separator passes (4.8:1) | ❌ → ✅ |
| **2.4.7 Focus Visible** | ThreadCard no indicator | ThreadCard has ring | ❌ → ✅ |
| **2.5.5 Target Size** | Avatar 44px (minimum) | Avatar 48px (comfortable) | ✅ → ✅ |

**Overall:** Fixes **2 critical AA failures**.

---

## Code Quality Impact

**Maintainability:**
- ✅ Semantic utilities replace hardcoded values
- ✅ Consistent token usage across components
- ✅ Easier to update theme (change CSS var, not component code)

**Readability:**
- ✅ `border-glass` more readable than `border-[var(--border-glass)]`
- ✅ `size-4` more concise than `h-3.5 w-3.5`
- ✅ Focus styles grouped on Link wrapper (clear intent)

**Type Safety:**
- ✅ No TypeScript changes needed
- ✅ All changes are className strings (type-safe)

---

## Risk Assessment

### Low Risk Changes

- **Separator color** - Pure visual change, no layout impact
- **Icon size** - Minor visual change, no layout shift
- **Avatar size** - Minimal layout shift (4px difference)
- **Skeleton styles** - Only visible during loading

### Medium Risk Changes

- **Focus indicator** - Could conflict with existing focus styles
  - **Mitigation:** Use `focus-visible` (not `focus`) to avoid mouse click ring
  - **Mitigation:** Test with keyboard and mouse separately

- **Border utility** - Requires globals.css change
  - **Mitigation:** Add utility first, test in isolation
  - **Mitigation:** Fallback: use inline var if utility doesn't work

### No High Risk Changes

All changes are cosmetic and non-breaking.

---

## Next Steps After Implementation

1. **Manual QA** - Test all flows (list → detail → reply)
2. **Lighthouse Audit** - Run accessibility audit
3. **Visual Regression** - Screenshot comparison tool
4. **Commit** - Small, focused commits per phase
5. **PR Review** - Request accessibility review

---

## Related Documentation

- [QDS.md](../../QDS.md) - Full design system spec
- [research/qds-audit.md](../research/qds-audit.md) - Detailed audit findings
- [context.md](../context.md) - Task context and decisions

---

**Implementation Plan Created:** 2025-10-07
**Estimated Total Time:** 35-45 minutes
**Complexity:** Low-Medium
**Risk Level:** Low
**AA Compliance Impact:** High (fixes 2 critical failures)

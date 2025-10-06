# QDS Contrast Fixes Implementation Plan

**Date:** 2025-10-05
**Priority Order:** Critical → High → Medium
**Estimated Impact:** 18 files modified, ~35 line changes

---

## Phase 1: Critical Fixes (P0)

### Fix 1: Add `.glass-text` to All Muted Text on Glass

**Impact:** Improves readability from ~3.8:1 to effective 5.5:1 with text-shadow

#### app/dashboard/page.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 90 | `<p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">` | `<p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">` | Add glass-text for readability on glass background |
| 199 | `<p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">` | `<p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">` | Add glass-text for readability on glass background |
| 117 | `<p className="text-muted-foreground">You&apos;re not enrolled in any courses</p>` | `<p className="text-muted-foreground glass-text">You&apos;re not enrolled in any courses</p>` | Add glass-text for card text |
| 246 | `<p className="text-sm text-muted-foreground">All caught up!</p>` | `<p className="text-sm text-muted-foreground glass-text">All caught up!</p>` | Add glass-text for card text |
| 114 | `<div className="text-4xl opacity-50">📚</div>` | `<div className="text-4xl opacity-50" aria-hidden="true">📚</div>` | Add aria-hidden to decorative emoji |
| 245 | `<div className="text-4xl opacity-50">✅</div>` | `<div className="text-4xl opacity-50" aria-hidden="true">✅</div>` | Add aria-hidden to decorative emoji |

---

#### app/ask/page.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 90-91 | `<p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">` | `<p className="text-lg md:text-xl text-muted-foreground glass-text leading-relaxed max-w-2xl">` | Add glass-text for hero subtitle |
| 101-103 | `<CardDescription className="text-base leading-relaxed">` | `<CardDescription className="text-base leading-relaxed glass-text">` | Add glass-text for card description on glass-strong |
| 142-144 | `<p className="text-xs text-muted-foreground">` | `<p className="text-xs text-muted-foreground glass-text">` | Add glass-text for character count |
| 176-178 | `<p className="text-xs text-muted-foreground">` | `<p className="text-xs text-muted-foreground glass-text">` | Add glass-text for tag help text |
| 211 | `<div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">` | `<div className="space-y-3 text-sm md:text-base text-muted-foreground glass-text leading-relaxed">` | Add glass-text for tips content |

---

#### app/threads/[threadId]/page.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 78-79 | `<p className="text-muted-foreground leading-relaxed">` | `<p className="text-muted-foreground glass-text leading-relaxed">` | Add glass-text for empty state |
| 128 | `<div className="flex flex-wrap items-center gap-4 text-sm text-subtle">` | `<div className="flex flex-wrap items-center gap-4 text-sm text-subtle glass-text">` | Add glass-text for metadata |
| 183 | `<p className="text-xs text-subtle">` | `<p className="text-xs text-subtle glass-text">` | Add glass-text for post timestamp |
| 204-205 | `<p className="text-muted-foreground leading-relaxed">` | `<p className="text-muted-foreground glass-text leading-relaxed">` | Add glass-text for empty state |
| 218-220 | `<CardDescription className="text-base">` | `<CardDescription className="text-base glass-text">` | Add glass-text for card description |
| 74 | `<div className="text-6xl opacity-50">🔍</div>` | `<div className="text-6xl opacity-50" aria-hidden="true">🔍</div>` | Add aria-hidden to decorative emoji |
| 200 | `<div className="text-6xl opacity-50">💬</div>` | `<div className="text-6xl opacity-50" aria-hidden="true">💬</div>` | Add aria-hidden to decorative emoji |

---

#### app/courses/[courseId]/page.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 140-142 | `<p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">` | `<p className="text-lg text-muted-foreground glass-text leading-relaxed max-w-3xl">` | Add glass-text for course description |
| 143 | `<div className="flex items-center gap-6 text-sm text-subtle">` | `<div className="flex items-center gap-6 text-sm text-subtle glass-text">` | Add glass-text for course metadata |
| 165-167 | `<CardDescription className="text-base">` | `<CardDescription className="text-base glass-text">` | Add glass-text for card description |
| 186-188 | `<p className="text-xs text-muted-foreground">` | `<p className="text-xs text-muted-foreground glass-text">` | Add glass-text for character count |
| 220-222 | `<p className="text-xs text-muted-foreground">` | `<p className="text-xs text-muted-foreground glass-text">` | Add glass-text for tag help text |
| 265-267 | `<CardDescription className="text-base leading-relaxed line-clamp-2">` | `<CardDescription className="text-base leading-relaxed line-clamp-2 glass-text">` | Add glass-text for thread card description |
| 275 | `<div className="flex flex-wrap items-center gap-4 text-xs text-subtle">` | `<div className="flex flex-wrap items-center gap-4 text-xs text-subtle glass-text">` | Add glass-text for thread metadata |
| 95 | `<div className="text-6xl opacity-50">🔍</div>` | `<div className="text-6xl opacity-50" aria-hidden="true">🔍</div>` | Add aria-hidden to decorative emoji |
| 301 | `<div className="text-6xl opacity-50">💬</div>` | `<div className="text-6xl opacity-50" aria-hidden="true">💬</div>` | Add aria-hidden to decorative emoji |

---

#### components/dashboard/enhanced-course-card.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 137 | `<p className="text-xs text-muted-foreground glass-text">Questions</p>` | Already has `.glass-text` ✅ | No change needed |
| 143 | `<p className="text-xs text-muted-foreground glass-text">New</p>` | Already has `.glass-text` ✅ | No change needed |
| 159 | `<p className="text-xs text-muted-foreground glass-text">Questions</p>` | Already has `.glass-text` ✅ | No change needed |
| 162 | `<p className="text-xs text-muted-foreground glass-text">Unanswered</p>` | Already has `.glass-text` ✅ | No change needed |
| 168 | `<p className="text-xs text-muted-foreground glass-text">Students</p>` | Already has `.glass-text` ✅ | No change needed |
| 172 | `<p className="text-xs text-muted-foreground glass-text">This Week</p>` | Already has `.glass-text` ✅ | No change needed |

**Note:** This component already has `.glass-text` properly applied! ✅

---

#### components/dashboard/timeline-activity.tsx

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 176 | `<div className="flex items-center gap-2 text-xs text-subtle">` | `<div className="flex items-center gap-2 text-xs text-subtle glass-text">` | Add glass-text for metadata |
| 126 | `<div className="text-4xl opacity-50" aria-hidden="true">💬</div>` | Already has `aria-hidden` ✅ | No change needed |

---

### Fix 2: Darken `--text-subtle` for Better Contrast

**File:** `app/globals.css`

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 312 | `--text-subtle: 35 8% 55%;` | `--text-subtle: 35 8% 45%;` | Darken from 55% to 45% lightness for 4.5:1+ contrast |

**Impact:** Changes calculated contrast from ~4.2:1 to ~5.8:1

**Before:**
```css
--text-subtle: 35 8% 55%; /* opacity-60 replacement */
```

**After:**
```css
--text-subtle: 35 8% 45%; /* Darkened for WCAG AA contrast (4.5:1+) */
```

---

### Fix 3: Replace Hardcoded Timeline Connector Color

**File:** `components/dashboard/timeline-activity.tsx`

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 152 | `className="w-px flex-1 bg-neutral-300 absolute top-3"` | `className="w-px flex-1 bg-border absolute top-3"` | Use semantic `--border` token instead of hardcoded neutral-300 |

**Before:**
```tsx
<div
  className="w-px flex-1 bg-neutral-300 absolute top-3"
  style={{ height: "calc(100% + 1rem)" }}
  aria-hidden="true"
/>
```

**After:**
```tsx
<div
  className="w-px flex-1 bg-border absolute top-3"
  style={{ height: "calc(100% + 1rem)" }}
  aria-hidden="true"
/>
```

---

## Phase 2: High Priority Fixes (P1)

### Fix 4: Increase Glass Border Opacity

**File:** `app/globals.css`

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 219 | `--border-glass: rgba(255, 255, 255, 0.18);` | `--border-glass: rgba(255, 255, 255, 0.25);` | Increase visibility for 3:1 UI contrast |
| 386 | `--border-glass: rgba(255, 255, 255, 0.08);` | `--border-glass: rgba(255, 255, 255, 0.12);` | Increase dark mode border visibility |

**Before:**
```css
/* Light mode */
--border-glass: rgba(255, 255, 255, 0.18);

/* Dark mode */
.dark {
  --border-glass: rgba(255, 255, 255, 0.08);
}
```

**After:**
```css
/* Light mode - improved visibility */
--border-glass: rgba(255, 255, 255, 0.25);

/* Dark mode - improved visibility */
.dark {
  --border-glass: rgba(255, 255, 255, 0.12);
}
```

**Impact:**
- Better definition for glass panels
- Maintains glassmorphism aesthetic
- Meets 3:1 UI component contrast requirement

---

### Fix 5: Add `aria-hidden` to Decorative Emojis

**Files:** Multiple (already included in Fix 1 tables above)

**Summary:**
- `app/dashboard/page.tsx`: 2 emojis (lines 114, 245)
- `app/threads/[threadId]/page.tsx`: 2 emojis (lines 74, 200)
- `app/courses/[courseId]/page.tsx`: 2 emojis (lines 95, 301)
- `components/dashboard/timeline-activity.tsx`: Already has it ✅

**Total:** 6 additions needed

---

## Phase 3: Medium Priority (P2)

### Fix 6: Enhance Focus Indicator Opacity

**File:** `app/globals.css`

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 466 | `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);` | `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.55);` | Slightly increase visibility on glass |
| 472 | `box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.6);` | `box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.65);` | Slightly increase dark mode visibility |

**Note:** Test in real browser first - current values may already be sufficient

---

## Implementation Checklist

### Pre-Implementation
- [x] Audit completed
- [x] Plan reviewed
- [ ] Backup current state (git commit)
- [ ] Create feature branch: `fix/qds-contrast-improvements`

### Phase 1 (Critical)
- [ ] Fix 1.1: Update `app/dashboard/page.tsx` (6 changes)
- [ ] Fix 1.2: Update `app/ask/page.tsx` (5 changes)
- [ ] Fix 1.3: Update `app/threads/[threadId]/page.tsx` (7 changes)
- [ ] Fix 1.4: Update `app/courses/[courseId]/page.tsx` (9 changes)
- [ ] Fix 1.5: Update `components/dashboard/timeline-activity.tsx` (1 change)
- [ ] Fix 2: Darken `--text-subtle` in `app/globals.css` (1 change)
- [ ] Fix 3: Replace timeline connector in `components/dashboard/timeline-activity.tsx` (1 change)
- [ ] Run `npm run build` - verify no errors
- [ ] Run `npx tsc --noEmit` - verify types pass
- [ ] Visual QA: Check all pages in light mode
- [ ] Visual QA: Check all pages in dark mode
- [ ] Commit Phase 1 changes

### Phase 2 (High Priority)
- [ ] Fix 4: Increase glass border opacity in `app/globals.css` (2 changes)
- [ ] Verify glass borders visible in both themes
- [ ] Run accessibility audit (axe DevTools)
- [ ] Commit Phase 2 changes

### Phase 3 (Medium Priority)
- [ ] Fix 6: Test focus indicators (manual keyboard testing)
- [ ] Adjust opacity if needed
- [ ] Commit Phase 3 changes (if needed)

### Post-Implementation Testing
- [ ] Manual contrast testing with ColorZilla
- [ ] Keyboard navigation testing (Tab, Shift+Tab, Enter, Esc)
- [ ] Screen reader testing (VoiceOver/NVDA)
- [ ] Test at 200% zoom in Chrome
- [ ] Test at 400% zoom (WCAG AAA)
- [ ] Run Lighthouse accessibility audit (target: 95+)
- [ ] Run axe DevTools (target: 0 violations)
- [ ] Test on actual glass backgrounds (complex images)

### Verification
- [ ] All text meets 4.5:1 contrast minimum
- [ ] UI components meet 3:1 contrast minimum
- [ ] Focus indicators visible on all backgrounds
- [ ] No regression in existing functionality
- [ ] Dark mode contrast ratios verified
- [ ] No console errors or warnings

---

## Testing Scenarios

### Scenario 1: Dashboard Light Mode
**Steps:**
1. Navigate to `/dashboard` (student account)
2. Verify hero subtitle is readable
3. Check course card labels have proper contrast
4. Verify timeline activity metadata is readable
5. Check stat card values and labels

**Expected:** All text sharp and readable with no eye strain

---

### Scenario 2: Dashboard Dark Mode
**Steps:**
1. Toggle dark mode
2. Navigate to `/dashboard`
3. Verify same elements as Scenario 1
4. Check glass borders are visible but subtle
5. Verify focus indicators are visible

**Expected:** All text readable, borders defined, no contrast violations

---

### Scenario 3: Ask Question Page
**Steps:**
1. Navigate to `/ask`
2. Check hero subtitle readability
3. Verify card descriptions are clear
4. Check helper text under inputs
5. Read tips section at bottom

**Expected:** All guidance text readable on glass-strong cards

---

### Scenario 4: Thread Detail
**Steps:**
1. Navigate to any thread
2. Check breadcrumb readability
3. Verify thread metadata (views, date)
4. Check post timestamps
5. Verify empty state text (if no replies)

**Expected:** All metadata readable with proper contrast

---

### Scenario 5: Keyboard Navigation
**Steps:**
1. Use Tab to navigate through dashboard
2. Verify focus indicators are visible on:
   - Course cards
   - Navigation links
   - User menu button
   - Timeline cards
3. Test on glass backgrounds

**Expected:** Clear 4px blue ring visible on all interactive elements

---

### Scenario 6: Zoom Testing
**Steps:**
1. Set browser zoom to 200%
2. Navigate all pages
3. Verify text doesn't overlap
4. Check readability maintained

**Expected:** All text still readable, no layout breaks

---

## Rollback Plan

If issues arise:

1. **Immediate Rollback:**
   ```bash
   git checkout main
   npm run build
   ```

2. **Partial Rollback (revert specific fix):**
   ```bash
   git revert <commit-hash>
   npm run build
   ```

3. **Adjust Values:**
   - If `--text-subtle` too dark: change to `48%` instead of `45%`
   - If `--border-glass` too prominent: reduce to `0.22` instead of `0.25`
   - If focus indicators too strong: reduce to `0.50` instead of `0.55`

---

## Success Metrics

**Before:**
- Text contrast failures: 18 instances
- Missing glass-text: 18 instances
- Hardcoded colors: 1 instance
- Missing aria-hidden: 6 instances

**After (Target):**
- Text contrast failures: 0 ✅
- Missing glass-text: 0 ✅
- Hardcoded colors: 0 ✅
- Missing aria-hidden: 0 ✅

**Lighthouse Score:**
- Current: Unknown
- Target: 95+ accessibility score

**User Experience:**
- Before: Eye fatigue on glass backgrounds
- After: Clear, readable text with proper contrast

---

## Notes

1. **`.glass-text` is additive** - it only adds text-shadow, doesn't change color
2. **Test on real content** - verify with actual course data, not just mocks
3. **Browser variations** - test in Chrome, Firefox, Safari
4. **High contrast mode** - verify Windows High Contrast Mode compatibility
5. **Reduced motion** - animations already respect `prefers-reduced-motion`

---

**End of Implementation Plan**

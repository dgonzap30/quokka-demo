# QDS Compliance Fixes: /app/quokka/page.tsx

**Date:** 2025-10-17
**Component:** Quokka Chat Page
**Estimated Time:** 30-45 minutes
**Risk Level:** LOW

---

## Executive Summary

This plan addresses 7 QDS violations in `/app/quokka/page.tsx`:
- **4 Medium Priority** issues (inline styles, hardcoded borders, shadow utilities)
- **3 Minor Priority** issues (ARIA, focus, semantic markup)

All fixes are low-risk CSS/attribute changes with no logic modifications required.

---

## Files to Modify

### 1. `/app/quokka/page.tsx`
**Changes:**
- Remove inline `style` attribute (line 138)
- Replace hardcoded border variables with utility classes (lines 139, 190)
- Add ARIA attributes for accessibility (line 152)
- Replace hardcoded emoji with proper element (line 145)

### 2. `/app/globals.css`
**Changes:**
- Add `.shadow-glass-sm` utility class to utilities layer
- Update `.message-user` and `.message-assistant` classes to use new utility

---

## Implementation Plan

### Phase 1: Critical Fixes (Must Fix)

#### Fix 1.1: Remove Inline Style Attribute

**File:** `/app/quokka/page.tsx`
**Line:** 138

**Current (NON-COMPLIANT):**
```tsx
<Card variant="glass-strong" className="flex flex-col" style={{ height: "calc(100vh - 400px)", minHeight: "500px", maxHeight: "700px" }}>
```

**Replacement (COMPLIANT):**
```tsx
<Card variant="glass-strong" className="flex flex-col min-h-[500px] max-h-[700px] h-[calc(100vh-400px)]">
```

**Rationale:**
- Removes inline style violation
- Uses Tailwind arbitrary values (acceptable when calculation needed)
- Maintains existing responsive behavior
- Easier to override if needed

---

#### Fix 1.2: Replace Hardcoded Border (CardHeader)

**File:** `/app/quokka/page.tsx`
**Line:** 139

**Current (NON-COMPLIANT):**
```tsx
<CardHeader className="p-6 md:p-8 border-b border-[var(--border-glass)]">
```

**Replacement (COMPLIANT):**
```tsx
<CardHeader className="p-6 md:p-8 border-b border-glass">
```

**Rationale:**
- Uses QDS-provided `.border-glass` utility class (defined in globals.css line 689)
- Maintains semantic design system approach
- Automatically adapts to dark mode
- More maintainable

---

#### Fix 1.3: Replace Hardcoded Border (Input Footer)

**File:** `/app/quokka/page.tsx`
**Line:** 190

**Current (NON-COMPLIANT):**
```tsx
<div className="border-t border-[var(--border-glass)] p-6 md:p-8">
```

**Replacement (COMPLIANT):**
```tsx
<div className="border-t border-glass p-6 md:p-8">
```

**Rationale:** Same as Fix 1.2

---

#### Fix 1.4: Add Shadow Glass Utility Class

**File:** `/app/globals.css`
**Location:** Add to `@layer utilities` section (after line 772, before `}`)

**Current:** Utility class doesn't exist

**Addition (NEW CODE):**
```css
  /* ===== Glass Shadow Utilities ===== */
  .shadow-glass-xs {
    box-shadow: 0 1px 8px rgba(15, 14, 12, 0.03);
  }

  .shadow-glass-sm {
    box-shadow: var(--shadow-glass-sm);
  }

  .shadow-glass-md {
    box-shadow: var(--shadow-glass-md);
  }

  .shadow-glass-lg {
    box-shadow: var(--shadow-glass-lg);
  }

  .dark .shadow-glass-xs {
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15);
  }

  .dark .shadow-glass-sm {
    box-shadow: var(--shadow-glass-sm);
  }

  .dark .shadow-glass-md {
    box-shadow: var(--shadow-glass-md);
  }

  .dark .shadow-glass-lg {
    box-shadow: var(--shadow-glass-lg);
  }
```

**Rationale:**
- Creates proper Tailwind utilities for QDS glass shadows
- Enables `shadow-glass-sm` usage throughout codebase
- Maintains dark mode support
- Follows QDS pattern of utility classes for design tokens

---

#### Fix 1.5: Update Message Bubble Classes

**File:** `/app/globals.css`
**Lines:** 628-634

**Current (NON-COMPLIANT):**
```css
  .message-user {
    @apply backdrop-blur-md bg-accent/90 text-accent-foreground border border-accent/30 shadow-[var(--shadow-glass-sm)] rounded-2xl;
  }

  .message-assistant {
    @apply backdrop-blur-md bg-glass-strong border border-[var(--border-glass)] shadow-[var(--shadow-glass-sm)] text-foreground rounded-2xl;
  }
```

**Replacement (COMPLIANT):**
```css
  .message-user {
    @apply backdrop-blur-md bg-accent/90 text-accent-foreground border border-accent/30 shadow-glass-sm rounded-2xl;
  }

  .message-assistant {
    @apply backdrop-blur-md bg-glass-strong border border-glass shadow-glass-sm text-foreground rounded-2xl;
  }
```

**Changes:**
1. `shadow-[var(--shadow-glass-sm)]` → `shadow-glass-sm` (uses new utility)
2. `border-[var(--border-glass)]` → `border-glass` (uses existing utility)

**Rationale:**
- Uses proper QDS utility classes
- More concise and maintainable
- Consistent with design system approach

---

### Phase 2: Accessibility Improvements (Should Fix)

#### Fix 2.1: Add ARIA Live Region for Messages

**File:** `/app/quokka/page.tsx`
**Line:** 152

**Current:**
```tsx
<CardContent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
```

**Replacement:**
```tsx
<CardContent
  className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Chat conversation"
>
```

**Rationale:**
- `role="log"`: Identifies as chat log for screen readers
- `aria-live="polite"`: Announces new messages when user is idle
- `aria-atomic="false"`: Only announces changes, not entire log
- `aria-label`: Provides context for screen reader users

---

#### Fix 2.2: Replace Hardcoded Emoji with Semantic Element

**File:** `/app/quokka/page.tsx`
**Line:** 145-147

**Current (NON-COMPLIANT):**
```tsx
<Badge className="ai-gradient text-white border-none">
  ● AI Online
</Badge>
```

**Replacement Option 1 (Preferred - Uses Lucide Icon):**
```tsx
<Badge className="ai-gradient text-white border-none">
  <Circle className="w-2 h-2 fill-white mr-2" />
  AI Online
</Badge>
```

**Replacement Option 2 (Alternative - Uses Semantic Element):**
```tsx
<Badge className="ai-gradient text-white border-none">
  <span className="inline-block w-2 h-2 rounded-full bg-white mr-2" aria-hidden="true" />
  AI Online
</Badge>
```

**Rationale:**
- Replaces hardcoded bullet character with proper element
- Screen reader friendly (icon marked as decorative)
- More flexible for styling
- Better semantic HTML

**Additional Import Required (Option 1):**
```tsx
// Add to imports at top of file (line 11)
import { Sparkles, Circle } from "lucide-react";
```

---

#### Fix 2.3: Add Aria-Busy to Thinking State

**File:** `/app/quokka/page.tsx`
**Line:** 152 (CardContent)

**Enhancement:** Add dynamic aria-busy attribute

**Current:**
```tsx
<CardContent
  className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Chat conversation"
>
```

**Replacement:**
```tsx
<CardContent
  className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Chat conversation"
  aria-busy={isThinking}
>
```

**Rationale:**
- Indicates loading state to screen readers
- Prevents premature navigation during AI response
- WCAG 2.1 best practice for dynamic content

---

### Phase 3: Polish (Nice to Have)

#### Fix 3.1: Extract Chat Container Height to Utility Class

**File:** `/app/globals.css`
**Location:** Add to `@layer utilities` section

**Addition (OPTIONAL):**
```css
  /* ===== Chat Container Utilities ===== */
  .chat-container-height {
    height: calc(100vh - 400px);
    min-height: 500px;
    max-height: 700px;
  }

  @media (max-width: 767px) {
    .chat-container-height {
      height: calc(100vh - 320px);
      min-height: 400px;
      max-height: 600px;
    }
  }
```

**Then Update page.tsx Line 138:**
```tsx
<Card variant="glass-strong" className="flex flex-col chat-container-height">
```

**Rationale:**
- More semantic class name
- Enables mobile-specific adjustments
- Reusable if pattern repeats
- **OPTIONAL:** Only implement if time permits

---

## Token Replacements Summary

### High Priority (MUST FIX)

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 138 | `style={{ height: "calc(100vh - 400px)", ... }}` | `className="...min-h-[500px] max-h-[700px] h-[calc(100vh-400px)]"` | Remove inline style |
| 139 | `border-[var(--border-glass)]` | `border-glass` | Use semantic utility |
| 190 | `border-[var(--border-glass)]` | `border-glass` | Use semantic utility |
| globals.css:628 | `shadow-[var(--shadow-glass-sm)]` | `shadow-glass-sm` | Use new utility |
| globals.css:633 | `border-[var(--border-glass)]` | `border-glass` | Use semantic utility |
| globals.css:633 | `shadow-[var(--shadow-glass-sm)]` | `shadow-glass-sm` | Use new utility |

### Medium Priority (SHOULD FIX)

| Line | Current | Replacement | Reason |
|------|---------|-------------|--------|
| 152 | `<CardContent className="...">` | Add `role="log" aria-live="polite" aria-atomic="false" aria-label="Chat conversation"` | Screen reader support |
| 145 | `● AI Online` | `<Circle className="w-2 h-2 fill-white mr-2" /> AI Online` | Semantic markup |
| 11 | Missing import | Add `Circle` to Lucide imports | Required for Fix 2.2 |

### Low Priority (NICE TO HAVE)

| Location | Change | Reason |
|----------|--------|--------|
| globals.css utilities | Add `.chat-container-height` class | Reusability, mobile optimization |

---

## New Token Definitions

### Shadow Glass Utilities (globals.css)

**Location:** `@layer utilities` section (after line 772)

```css
  /* ===== Glass Shadow Utilities ===== */
  .shadow-glass-xs {
    box-shadow: 0 1px 8px rgba(15, 14, 12, 0.03);
  }

  .shadow-glass-sm {
    box-shadow: var(--shadow-glass-sm);
  }

  .shadow-glass-md {
    box-shadow: var(--shadow-glass-md);
  }

  .shadow-glass-lg {
    box-shadow: var(--shadow-glass-lg);
  }

  .dark .shadow-glass-xs {
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15);
  }

  .dark .shadow-glass-sm {
    box-shadow: var(--shadow-glass-sm);
  }

  .dark .shadow-glass-md {
    box-shadow: var(--shadow-glass-md);
  }

  .dark .shadow-glass-lg {
    box-shadow: var(--shadow-glass-lg);
  }
```

**Rationale:** These utilities enable proper use of QDS glass shadows throughout the application, not just in this component.

---

## Implementation Order

### Step 1: Add Shadow Utilities to globals.css (5 minutes)
1. Open `/app/globals.css`
2. Navigate to `@layer utilities` section (around line 522)
3. Add shadow-glass utilities after line 772 (before closing brace)
4. Save file

### Step 2: Update Message Bubble Classes (5 minutes)
1. In same file (`/app/globals.css`)
2. Navigate to lines 628-634
3. Replace `shadow-[var(--shadow-glass-sm)]` with `shadow-glass-sm` (2 occurrences)
4. Replace `border-[var(--border-glass)]` with `border-glass` (1 occurrence)
5. Save file

### Step 3: Fix page.tsx - Inline Style (5 minutes)
1. Open `/app/quokka/page.tsx`
2. Navigate to line 138
3. Remove `style` prop
4. Add Tailwind classes to `className`
5. Save file

### Step 4: Fix page.tsx - Hardcoded Borders (3 minutes)
1. Line 139: Replace `border-[var(--border-glass)]` with `border-glass`
2. Line 190: Replace `border-[var(--border-glass)]` with `border-glass`
3. Save file

### Step 5: Add ARIA Attributes (5 minutes)
1. Line 152: Add `role`, `aria-live`, `aria-atomic`, `aria-label`, `aria-busy` attributes
2. Save file

### Step 6: Replace Emoji (5 minutes)
1. Line 11: Add `Circle` to Lucide imports
2. Line 145-147: Replace bullet with `<Circle />` component
3. Save file

### Step 7: Verify Changes (10 minutes)
1. Run `npx tsc --noEmit`
2. Run `npm run lint`
3. Start dev server: `npm run dev`
4. Test visually in browser
5. Toggle dark mode
6. Test keyboard navigation

---

## Testing Checklist

### Visual Tests
- [ ] Chat container displays at correct height
- [ ] Glass borders visible on card header and footer
- [ ] Message bubbles render with correct shadows
- [ ] "AI Online" badge shows circle icon instead of bullet
- [ ] Dark mode: All borders and shadows adapt correctly
- [ ] Mobile (360px): Layout remains intact
- [ ] Tablet (768px): Text scales appropriately
- [ ] Desktop (1280px): All spacing looks correct

### Functional Tests
- [ ] Messages scroll correctly
- [ ] Input accepts text
- [ ] Send button works
- [ ] Quick prompts populate input
- [ ] Thinking state displays
- [ ] Auto-scroll to new messages

### Accessibility Tests
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on glass backgrounds
- [ ] Screen reader announces "Chat conversation"
- [ ] Screen reader announces new messages (politely)
- [ ] Screen reader indicates busy state during thinking
- [ ] Enter key submits message from input

### Technical Tests
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run build` succeeds
- [ ] No console errors in dev mode
- [ ] No console warnings about invalid attributes

---

## Rollback Plan

If issues arise:

### Quick Rollback (Git)
```bash
# If changes are committed
git revert HEAD

# If changes are staged but not committed
git reset --hard HEAD

# If changes are unstaged
git checkout app/quokka/page.tsx app/globals.css
```

### Manual Rollback
1. Revert inline style: Add `style` prop back to line 138
2. Revert borders: Change `border-glass` back to `border-[var(--border-glass)]`
3. Remove ARIA attributes: Delete `role`, `aria-live`, etc. from CardContent
4. Revert emoji: Change Circle component back to bullet character
5. Remove shadow utilities: Delete new classes from globals.css
6. Revert message classes: Add back arbitrary shadow values

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TypeScript errors | LOW | LOW | Test with `npx tsc --noEmit` after each change |
| Visual regression | LOW | LOW | All changes use existing QDS utilities |
| Dark mode breaks | VERY LOW | LOW | Border-glass utility already supports dark mode |
| Accessibility regression | VERY LOW | MEDIUM | Only adding ARIA, not removing existing accessibility |
| Build failure | VERY LOW | HIGH | Changes are CSS/markup only, no logic |
| Focus indicator invisible | LOW | MEDIUM | Test on glass backgrounds before committing |

**Overall Risk:** LOW - All changes are CSS/attribute modifications with no logic changes.

---

## Dependencies

### Required
- None - All QDS utilities already exist or will be created

### Optional
- Lucide React (already installed) - for Circle icon

---

## Performance Impact

**Estimated Impact:** NONE to POSITIVE

- Removing inline `style` eliminates JS-driven style calculation
- Using utility classes enables Tailwind's optimizations
- Glass shadow utilities follow same pattern as existing QDS
- No additional DOM elements or JavaScript logic

---

## Documentation Updates

### Files to Update After Implementation

1. **This plan (`plans/qds-fixes.md`):**
   - Mark as "IMPLEMENTED" in header
   - Add implementation date

2. **Task context (`context.md`):**
   - Update Decisions section with:
     ```markdown
     #### 2025-10-17: QDS Compliance - Shadow Utilities
     **Decision:** Created `.shadow-glass-*` utility classes for QDS glass shadows
     **Files:** `plans/qds-fixes.md`, `research/qds-audit.md`
     **Rationale:** Eliminates arbitrary Tailwind values, enables consistent glass shadow usage
     **Trade-offs:** None (pure improvement)
     ```

3. **README.md (Optional):**
   - Note new shadow utilities available for use

---

## Success Criteria

**Implementation is successful when:**

1. ✅ All 7 QDS violations resolved
2. ✅ TypeScript compiles with no errors
3. ✅ Lint passes clean
4. ✅ Production build succeeds
5. ✅ Visual appearance unchanged (except emoji → icon)
6. ✅ Dark mode works identically
7. ✅ Keyboard navigation works
8. ✅ Screen reader announces messages
9. ✅ No console errors/warnings
10. ✅ All tests in checklist pass

---

## Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 2 min | Open files, position cursor |
| Phase 1 (Critical) | 20 min | Fixes 1.1-1.5 (inline style, borders, shadows) |
| Phase 2 (Accessibility) | 15 min | Fixes 2.1-2.3 (ARIA, emoji, busy state) |
| Phase 3 (Optional) | 5 min | Fix 3.1 (utility class extraction) |
| Testing | 10 min | Visual, functional, a11y, technical tests |
| **TOTAL** | **52 min** | With Phase 3 |
| **TOTAL (Phase 3 skipped)** | **47 min** | Production-ready |

**Recommendation:** Skip Phase 3 for initial implementation. Can be added later if pattern repeats elsewhere.

---

## Notes for Implementer

### Tips
1. Make changes incrementally - test after each file modification
2. Keep browser dev tools open to verify glass effects render
3. Use browser's "Emulate vision deficiencies" to verify contrast
4. Test dark mode toggle immediately after border changes
5. Use VoiceOver (Mac) or NVDA (Windows) to verify ARIA announcements

### Common Pitfalls
- ❌ Forgetting to add dark mode variants for new utilities
- ❌ Missing `Circle` import when replacing emoji
- ❌ Placing new CSS utilities outside `@layer utilities`
- ❌ Not testing keyboard navigation on glass backgrounds

### Quick Verification Commands
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Dev server
npm run dev
```

---

**End of Implementation Plan**

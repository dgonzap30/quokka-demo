# Navigation Back Button - Implementation Plan

## Overview

Add browser-history-aware back navigation to `/points` and `/support` pages using a reusable BackButton component.

## Step-by-Step Implementation

### Step 1: Create Reusable BackButton Component

**File:** `components/navigation/back-button.tsx`

**Requirements:**
- Props-driven component accepting `label`, `fallbackHref`, `className`
- Uses Next.js `useRouter().back()` for navigation
- QDS-compliant styling (glass panel, spacing, shadows)
- WCAG 2.2 AA accessible (keyboard nav, ARIA labels, focus states)
- Responsive design (works on mobile and desktop)

**Interface:**
```typescript
interface BackButtonProps {
  /** Optional custom label (defaults to "Back") */
  label?: string;

  /** Fallback href if no browser history (defaults to "/dashboard") */
  fallbackHref?: string;

  /** Optional className for composition */
  className?: string;
}
```

**Visual Design:**
- Left arrow icon (ChevronLeft from Lucide)
- Glass panel with subtle hover effect
- Text: "Back" or custom label
- Hover: slight scale + color transition
- Focus: visible ring (accent/60)

**Testing:**
- Renders without errors
- Calls `router.back()` on click
- Keyboard accessible (Tab, Enter)
- Focus state visible
- Responsive on mobile

---

### Step 2: Add BackButton to Points Page

**File:** `app/points/page.tsx`

**Changes:**
1. Import BackButton component
2. Add BackButton before hero section
3. Position at top-left of page (consistent with typical back button placement)

**Layout:**
```tsx
<div className="min-h-screen">
  <div className="container-wide space-y-8 p-4 md:p-6">
    {/* Back Button */}
    <BackButton />

    {/* Hero Section */}
    <QuokkaPointsHero ... />

    {/* Rest of page content */}
  </div>
</div>
```

**Testing:**
- Navigate: Dashboard → Points → Back (should return to dashboard)
- Navigate: Course → Points → Back (should return to course)
- Visual consistency with page design
- No layout shift or spacing issues

---

### Step 3: Add BackButton to Support Page

**File:** `app/support/page.tsx`

**Changes:**
1. Import BackButton component
2. Add BackButton before hero section
3. Ensure consistent placement with points page

**Layout:**
```tsx
<main className="min-h-screen p-4 md:p-6">
  <div className="container-wide space-y-8 md:space-y-12">
    {/* Back Button */}
    <BackButton />

    {/* Hero Section */}
    <section aria-labelledby="support-heading" className="py-8 md:py-12 space-y-4">
      ...
    </section>

    {/* Rest of page content */}
  </div>
</main>
```

**Testing:**
- Navigate: Dashboard → Support → Back (should return to dashboard)
- Navigate: Course → Support → Back (should return to course)
- Visual consistency with page design
- Accessibility: keyboard nav works

---

### Step 4: (Optional) Refactor Ask Page

**File:** `app/ask/page.tsx`

**Changes:**
1. Import BackButton component
2. Replace inline cancel button with BackButton
3. Remove `onClick={() => router.back()}` logic
4. Test for no regression

**Current Implementation (lines 237-245):**
```tsx
<Button
  type="button"
  variant="outline"
  size="lg"
  onClick={() => router.back()}
  disabled={isSubmitting || previewMutation.isPending}
>
  Cancel
</Button>
```

**New Implementation:**
```tsx
{/* Move BackButton to top of form or keep cancel button in form */}
{/* Decision: Keep cancel button as-is for form UX, don't refactor */}
```

**Decision:** Skip this step - the cancel button in the form serves a different UX purpose than a page-level back button. Leave as-is.

---

## Quality Checks

### TypeScript
```bash
npx tsc --noEmit
```
**Expected:** No errors

### Linting
```bash
npm run lint
```
**Expected:** No warnings

### Manual Testing

**Test Case 1: Points Page Navigation**
1. Start at `/dashboard`
2. Click Quokka Points badge → navigate to `/points`
3. Click BackButton → should return to `/dashboard`

**Test Case 2: Points Page from Course**
1. Navigate to `/courses/CS-101`
2. Click Quokka Points badge → navigate to `/points`
3. Click BackButton → should return to `/courses/CS-101`

**Test Case 3: Support Page Navigation**
1. Start at `/dashboard`
2. Click Support icon → navigate to `/support`
3. Click BackButton → should return to `/dashboard`

**Test Case 4: Support Page from Course**
1. Navigate to `/courses/CS-101`
2. Click Support icon → navigate to `/support`
3. Click BackButton → should return to `/courses/CS-101`

**Test Case 5: Keyboard Navigation**
1. Navigate to `/points` or `/support`
2. Press Tab until BackButton is focused
3. Press Enter → should navigate back
4. Focus ring should be visible

**Test Case 6: Responsive Design**
1. Test on mobile viewport (360px)
2. Test on tablet viewport (768px)
3. Test on desktop viewport (1280px)
4. BackButton should be visible and functional on all sizes

### Accessibility Audit

**Checks:**
- [ ] Semantic HTML (`<button>` element)
- [ ] ARIA label present and descriptive
- [ ] Keyboard navigable (Tab to focus, Enter to activate)
- [ ] Focus state visible (4.5:1 contrast minimum)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Screen reader announces "Back" or custom label

---

## Success Criteria

- ✅ BackButton component created with TypeScript types
- ✅ QDS-compliant styling applied
- ✅ BackButton added to points page
- ✅ BackButton added to support page
- ✅ `router.back()` navigates correctly in all test cases
- ✅ No TypeScript errors
- ✅ No lint warnings
- ✅ Keyboard navigation works
- ✅ Focus states visible
- ✅ Responsive on all viewports
- ✅ WCAG 2.2 AA compliant

---

## Files Modified

**New:**
- `components/navigation/back-button.tsx`

**Modified:**
- `app/points/page.tsx`
- `app/support/page.tsx`

**Documentation:**
- `doccloud/tasks/navigation-back-button/context.md` (changelog updated)

---

## Commit Strategy

**Commit 1:** Create BackButton component
```
feat: add reusable BackButton component for page navigation

- Create BackButton component with router.back() support
- QDS-compliant styling with glass panel effect
- WCAG 2.2 AA accessible (keyboard nav, ARIA, focus)
- Props: label, fallbackHref, className
```

**Commit 2:** Add BackButton to points page
```
feat: add back navigation to points page

- Import and render BackButton component
- Enables easy navigation back to previous page
- Improves UX when navigating from course contexts
```

**Commit 3:** Add BackButton to support page
```
feat: add back navigation to support page

- Import and render BackButton component
- Consistent with points page navigation pattern
- Improves UX when navigating from course contexts
```

---

## Rollback Plan

If issues arise:
1. Revert commits in reverse order (support → points → component)
2. Remove BackButton component file
3. Verify pages render correctly without BackButton
4. Test navigation still works via breadcrumbs

---

## Next Steps After Implementation

1. Update context.md changelog with completion date
2. Mark all TODOs as complete
3. Document any learnings or edge cases discovered
4. Consider adding BackButton to other pages (instructor dashboard, etc.)

# Phase 2 Citation UI Integration - Testing Checklist

**Date:** 2025-10-17
**Dev Server:** http://localhost:3000
**Status:** Ready for manual testing

---

## Prerequisites

1. ✅ Dev server running at http://localhost:3000
2. ⏳ `.env.local` configured with LLM API key (required for real citations)
3. ⏳ Browser console open for debugging (F12)

---

## Test Scenario 1: Basic Citation Display

**Objective:** Verify inline citation markers and sources panel display correctly

### Steps:

1. **Navigate to Dashboard:**
   - Go to http://localhost:3000
   - Click "Quokka Assistant" button (floating button or menu)

2. **Ask a course-related question:**
   ```
   Example: "What is binary search and how does it work?"
   ```

3. **Wait for AI response** (streaming should appear)

### Expected Results:

- [ ] AI response appears with streaming animation
- [ ] Response contains inline citation markers like `[1]` `[2]`
- [ ] Citation markers are **highlighted** with accent color background
- [ ] Citation markers are **visually distinct** from regular text
- [ ] Sources panel appears **below the message**
- [ ] Sources panel shows citation list with:
  - Citation number (1, 2, 3...)
  - Material title
  - Material type (Lecture Notes, Slides, etc.)
- [ ] Message has **accent left border** (thin colored line on left)
- [ ] **No duplicate** "Sources:" section in message text

### Screenshots to Capture:

- [ ] Full message with citations visible
- [ ] Close-up of inline citation marker
- [ ] Sources panel expanded state

---

## Test Scenario 2: Interactive Citation Markers

**Objective:** Verify citation markers are clickable and scroll to sources

### Steps:

1. **Using the same AI response from Scenario 1:**
   - Locate an inline citation marker `[1]`
   - **Click on the marker**

### Expected Results:

- [ ] Page scrolls smoothly to the sources panel
- [ ] The corresponding source in the panel is **highlighted** or brought into view
- [ ] Scroll animation is smooth (not jarring)

### Keyboard Navigation:

2. **Test keyboard interaction:**
   - Press **Tab** to navigate to a citation marker
   - Marker should show **focus ring** (visible outline)
   - Press **Enter** or **Space** while focused
   - Should scroll to source panel

### Expected Results:

- [ ] Tab navigates to citation markers
- [ ] Focus ring is visible on focused marker
- [ ] Enter key triggers scroll to source
- [ ] Space key triggers scroll to source

---

## Test Scenario 3: Hover Tooltips

**Objective:** Verify hover states show source titles

### Steps:

1. **Hover over a citation marker `[1]`**
   - Wait ~200ms

### Expected Results:

- [ ] Tooltip appears with source title
- [ ] Tooltip text is readable (good contrast)
- [ ] Tooltip doesn't cover the marker
- [ ] Tooltip disappears when mouse moves away

---

## Test Scenario 4: Sources Panel Interaction

**Objective:** Verify sources panel can be collapsed/expanded

### Steps:

1. **Click the "Sources" header** in the panel
   - Panel should collapse (hide sources list)

2. **Click the "Sources" header again**
   - Panel should expand (show sources list)

### Expected Results:

- [ ] Panel collapses smoothly
- [ ] Panel expands smoothly
- [ ] Chevron icon rotates (down when expanded, right when collapsed)
- [ ] Citation count remains visible when collapsed
- [ ] State persists during conversation (doesn't reset)

---

## Test Scenario 5: Multiple Citations

**Objective:** Verify multiple citations display correctly

### Steps:

1. **Ask a complex question requiring multiple sources:**
   ```
   Example: "Explain the differences between bubble sort, merge sort, and quick sort"
   ```

2. **Wait for AI response**

### Expected Results:

- [ ] Multiple citation markers `[1]` `[2]` `[3]` appear inline
- [ ] Each marker is clickable independently
- [ ] Sources panel shows all citations (3+ items)
- [ ] Each citation has correct number, title, type
- [ ] Clicking `[1]` scrolls to citation 1
- [ ] Clicking `[2]` scrolls to citation 2
- [ ] Clicking `[3]` scrolls to citation 3

---

## Test Scenario 6: Messages Without Citations

**Objective:** Verify non-cited messages display normally

### Steps:

1. **Ask a general question (no course materials):**
   ```
   Example: "Hello, how are you?"
   ```

2. **Wait for AI response**

### Expected Results:

- [ ] AI responds normally
- [ ] **No citation markers** appear
- [ ] **No sources panel** appears
- [ ] **No accent border** on message
- [ ] Message text displays cleanly without artifacts

---

## Test Scenario 7: Mixed Conversation

**Objective:** Verify cited and non-cited messages coexist

### Steps:

1. **Have a conversation with alternating types:**
   - Ask: "Hello!" (no citations expected)
   - Ask: "What is binary search?" (citations expected)
   - Ask: "Thank you!" (no citations expected)

### Expected Results:

- [ ] First message: No border, no panel
- [ ] Second message: Has border, has panel, has markers
- [ ] Third message: No border, no panel
- [ ] All messages display correctly in sequence
- [ ] No layout issues or overlapping content

---

## Test Scenario 8: Responsive Design

**Objective:** Verify citations work on different screen sizes

### Steps:

1. **Open browser DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M / Cmd+Shift+M)
3. **Test at different sizes:**

   **Mobile (360px):**
   - [ ] Citation markers are readable
   - [ ] Sources panel doesn't overflow
   - [ ] Click targets are accessible (44px minimum)

   **Tablet (768px):**
   - [ ] Layout is balanced
   - [ ] Sources panel width is appropriate

   **Desktop (1280px):**
   - [ ] Full layout displays correctly
   - [ ] No excessive whitespace

---

## Test Scenario 9: Accessibility (Screen Reader)

**Objective:** Verify accessibility for screen reader users

### Steps (if you have a screen reader):

1. **Enable screen reader** (VoiceOver on Mac, NVDA on Windows)
2. **Navigate to citation marker**
3. **Listen to announcement**

### Expected Results:

- [ ] Marker announces as "Citation 1: [Source Title]"
- [ ] Marker is keyboard navigable
- [ ] Sources panel announces citation count
- [ ] Each source item announces title and type

---

## Test Scenario 10: QDS Compliance

**Objective:** Verify design system compliance

### Visual Checks:

- [ ] Citation markers use **QDS accent color** (`bg-accent/20`)
- [ ] Accent border uses **QDS accent token** (`border-accent`)
- [ ] Hover states use **QDS accent hover** (`bg-accent/30`)
- [ ] No hardcoded hex colors visible
- [ ] Spacing follows 4pt grid (gap-1, gap-2, gap-3)
- [ ] Border radius is consistent with QDS (rounded-md)

### Dark Mode:

1. **Toggle dark mode** (if available in app)

### Expected Results:

- [ ] Citation markers are visible in dark mode
- [ ] Accent colors adapt to dark theme
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] No readability issues

---

## Test Scenario 11: Performance

**Objective:** Verify no performance regressions

### Steps:

1. **Open browser DevTools** → Performance tab
2. **Send a message with citations**
3. **Check console for errors**

### Expected Results:

- [ ] No console errors during render
- [ ] No console warnings (except existing ones)
- [ ] Citation parsing <50ms (check if noticeable lag)
- [ ] Smooth rendering (no jank)
- [ ] Sources panel expansion is smooth (60fps)

---

## Test Scenario 12: Edge Cases

**Objective:** Verify edge cases are handled

### Test Cases:

1. **Invalid citation markers:**
   - Message with `[999]` but only 3 sources
   - Expected: `[999]` remains plain text (not highlighted)

2. **Empty sources section:**
   - Message with "**Sources:**" but no items
   - Expected: No sources panel appears

3. **Malformed citations:**
   - Message with `[1` or `1]` (incomplete)
   - Expected: Ignored, not highlighted

---

## Bug Report Template

If you find issues during testing, use this template:

```markdown
**Issue:** [Brief description]

**Scenario:** [Which test scenario]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]

**Actual:** [What actually happened]

**Screenshot:** [Attach if applicable]

**Browser:** [Chrome 120, Firefox 121, Safari 17, etc.]

**Console Errors:** [Any errors in console]
```

---

## Test Summary

**Date Tested:** _____________

**Tester:** _____________

**Scenarios Passed:** ___ / 12

**Issues Found:** ___ (see bug reports)

**Overall Status:** ⬜ PASS  ⬜ FAIL  ⬜ NEEDS FIXES

---

## Next Steps After Testing

### If All Tests Pass:
1. Mark Step 6 as completed
2. Create git commit with changes
3. Update CLAUDE.md with test results
4. Ready for Phase 3 (Thread Quality Loop)

### If Issues Found:
1. Document all issues in bug reports
2. Prioritize: Critical → High → Medium → Low
3. Fix critical issues first
4. Re-test after fixes
5. Iterate until all scenarios pass

---

**Happy Testing! 🧪**

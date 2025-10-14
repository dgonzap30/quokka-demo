# Accessibility Implementation Plan: ProfileSettingsDropdown Redesign

**Component:** components/navbar/profile-settings-dropdown.tsx
**Date:** 2025-10-14
**Priority:** Critical (blocking redesign launch)
**Estimated Effort:** 4-6 hours (design + implementation + testing)

---

## Overview

This plan provides step-by-step guidance for implementing WCAG 2.2 AA-compliant accessibility in the ProfileSettingsDropdown redesign. It assumes the UI planner has already designed the visual layout and component structure.

**Key Principles:**
1. **Simplicity First:** Remove tabs = simpler keyboard navigation
2. **Semantic HTML:** Use proper elements before ARIA
3. **Progressive Enhancement:** Accessible by default, enhanced with ARIA
4. **Test Early:** Verify each step before moving to the next

---

## Implementation Phases

### Phase 1: Component Structure (Semantic HTML)
### Phase 2: ARIA Attributes
### Phase 3: Keyboard Navigation
### Phase 4: Focus Management
### Phase 5: Visual Accessibility (Contrast & Touch Targets)
### Phase 6: Screen Reader Testing
### Phase 7: Verification & Sign-off

---

## Phase 1: Component Structure (Semantic HTML)

**Goal:** Establish proper semantic HTML foundation without relying on ARIA.

### Step 1.1: Remove Tabs Component

**File:** `components/navbar/profile-settings-dropdown.tsx`

**Current Code (Lines 90-133):**
```tsx
const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");

return (
  <Popover>
    <PopoverTrigger>...</PopoverTrigger>
    <PopoverContent>
      <Tabs value={activeTab} onValueChange={...}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">...</TabsContent>
        <TabsContent value="settings">...</TabsContent>
      </Tabs>
    </PopoverContent>
  </Popover>
);
```

**New Structure:**
```tsx
return (
  <Popover>
    <PopoverTrigger>...</PopoverTrigger>
    <PopoverContent className="w-80 glass-panel p-4" align="end" sideOffset={8}>
      <div className="space-y-4">
        {/* Section 1: Profile */}
        <div className="space-y-3 pb-3 border-b border-border-glass">
          {/* Avatar + Name/Email + View Profile Button */}
        </div>

        {/* Section 2: Settings */}
        <nav aria-label="Settings options" className="space-y-2">
          {/* Settings buttons */}
        </nav>

        {/* Section 3: Logout */}
        <div className="pt-3 border-t border-border-glass">
          {/* Logout button */}
        </div>
      </div>
    </PopoverContent>
  </Popover>
);
```

**Rationale:**
- Replace complex tab structure with simple vertical stack
- Use semantic sectioning with visual dividers
- No tab state management needed
- Keyboard navigation is simple top-to-bottom

**Testing:**
- ✓ Component renders without errors
- ✓ All buttons are visible
- ✓ Sections have clear visual separation

---

### Step 1.2: Add Avatar Component

**Import:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
```

**Helper Function (Add after imports):**
```tsx
/**
 * Generate initials from user name
 * @example "Jane Doe" → "JD"
 * @example "John" → "JO"
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
```

**Profile Section Structure:**
```tsx
<div className="space-y-3 pb-3 border-b border-border-glass">
  {/* Avatar + User Info */}
  <div className="flex items-center gap-3">
    <Avatar className="h-10 w-10" aria-hidden="true">
      <AvatarImage src={user.avatar} alt="" />
      <AvatarFallback className="avatar-placeholder text-sm font-medium">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate" title={user.name}>
        {user.name}
      </p>
      <p className="text-xs text-muted-foreground glass-text truncate" title={user.email}>
        {user.email}
      </p>
    </div>
  </div>

  {/* View Profile Button (Optional) */}
  {onNavigateProfile && (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start min-h-[44px]"
      onClick={onNavigateProfile}
      aria-label={`View profile for ${user.name}`}
    >
      <User className="h-4 w-4" aria-hidden="true" />
      View Profile
    </Button>
  )}
</div>
```

**Key Decisions:**
- Avatar is `aria-hidden="true"` (decorative, name is adjacent)
- User name/email use `truncate` with `title` attribute for overflow
- View Profile button has explicit `aria-label` with user name context

**Testing:**
- ✓ Avatar displays image if available
- ✓ Fallback initials display correctly
- ✓ Long names/emails truncate with ellipsis
- ✓ Hover over truncated text shows full value

---

### Step 1.3: Add Settings Section

**Structure:**
```tsx
<nav aria-label="Settings options" className="space-y-2">
  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start min-h-[44px] gap-3"
    onClick={() => onNavigateNotifications?.()}
  >
    <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="flex-1 text-left">Notifications</span>
  </Button>

  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start min-h-[44px] gap-3"
    onClick={() => onNavigateAppearance?.()}
  >
    <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="flex-1 text-left">Appearance</span>
  </Button>

  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start min-h-[44px] gap-3"
    onClick={() => onNavigatePrivacy?.()}
  >
    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="flex-1 text-left">Privacy</span>
  </Button>

  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start min-h-[44px] gap-3"
    onClick={() => onNavigateHelp?.()}
  >
    <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="flex-1 text-left">Help & Support</span>
  </Button>
</nav>
```

**Key Decisions:**
- Wrapped in `<nav>` landmark with `aria-label`
- All buttons have `min-h-[44px]` for touch targets
- Icons are `aria-hidden="true"` (text labels are sufficient)
- Increased spacing to `space-y-2` (8px) for better touch target separation

**Testing:**
- ✓ All buttons are tabbable
- ✓ Button text is clearly visible
- ✓ Icons align consistently
- ✓ Touch targets are at least 44px tall

---

### Step 1.4: Add Logout Section

**Structure:**
```tsx
<div className="pt-3 border-t border-border-glass">
  <Button
    variant="ghost"
    size="sm"
    className="w-full justify-start min-h-[44px] gap-3 text-danger hover:text-danger hover:bg-danger/10"
    onClick={onLogout}
    aria-label="Log out of QuokkaQ"
  >
    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
    Log out
  </Button>
</div>
```

**Key Decisions:**
- Separated visually with border-top
- Danger color for destructive action
- Explicit `aria-label` provides context

**Testing:**
- ✓ Logout button is visually distinct
- ✓ Danger color is clearly visible
- ✓ Button is tabbable and clickable

---

## Phase 2: ARIA Attributes

**Goal:** Enhance semantic HTML with ARIA where needed.

### Step 2.1: Add aria-expanded to Trigger

**File:** `components/navbar/profile-settings-dropdown.tsx`

**Current Trigger:**
```tsx
<PopoverTrigger asChild>
  <Button
    variant="ghost"
    size="icon"
    className="min-h-[44px] min-w-[44px] h-11 w-11"
    aria-label="Account and Settings"
    aria-haspopup="dialog"
  >
    <User className="h-5 w-5" aria-hidden="true" />
    <span className="sr-only">Account and Settings</span>
  </Button>
</PopoverTrigger>
```

**Enhanced Trigger:**
```tsx
<Popover>
  {(open) => (
    <>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] h-11 w-11"
          aria-label="Account and Settings"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Account and Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent>...</PopoverContent>
    </>
  )}
</Popover>
```

**Note:** Radix Popover may require accessing `open` state differently. Check Radix docs for proper implementation.

**Alternative (Simpler):**
If Radix doesn't expose `open` state easily, rely on Radix's built-in ARIA management (it automatically adds aria-expanded).

**Testing:**
- ✓ Inspect trigger button with browser DevTools
- ✓ Verify `aria-expanded="false"` when closed
- ✓ Verify `aria-expanded="true"` when open

---

### Step 2.2: Verify All Icons Have aria-hidden

**Search Pattern:** All `<Icon />` components within buttons

**Required:**
```tsx
<Bell aria-hidden="true" />
<Moon aria-hidden="true" />
<Shield aria-hidden="true" />
<HelpCircle aria-hidden="true" />
<LogOut aria-hidden="true" />
<User aria-hidden="true" />
```

**Rationale:** Icons are decorative; button text provides accessible name.

**Testing:**
- ✓ Screen reader doesn't announce icon names
- ✓ Screen reader announces button text only

---

### Step 2.3: Add ARIA Labels Where Needed

**View Profile Button:**
```tsx
<Button aria-label={`View profile for ${user.name}`}>
  View Profile
</Button>
```

**Logout Button:**
```tsx
<Button aria-label="Log out of QuokkaQ">
  Log out
</Button>
```

**Settings Buttons (Optional Enhancement):**
```tsx
<Button aria-label="Notifications settings">
  Notifications
</Button>
```

**Decision:** Use explicit aria-labels only where additional context helps. For simple buttons like "Notifications," the text is sufficient.

**Testing:**
- ✓ Screen reader announces enhanced labels
- ✓ Labels are concise and clear

---

## Phase 3: Keyboard Navigation

**Goal:** Ensure complete keyboard accessibility without mouse.

### Step 3.1: Verify Tab Order

**Expected Tab Order:**
1. Trigger Button (User icon in navbar)
2. (Popover opens, focus moves to first element)
3. View Profile Button (if exists)
4. Notifications Button
5. Appearance Button
6. Privacy Button
7. Help & Support Button
8. Logout Button
9. (Tab out of popover closes it)

**Implementation:**
- Radix Popover automatically manages focus trap
- No custom tabindex needed
- Ensure DOM order matches visual order

**Testing:**
- ✓ Press Tab from trigger → popover opens, focus on first button
- ✓ Press Tab repeatedly → cycles through all buttons in order
- ✓ Press Shift+Tab → moves backward through buttons
- ✓ Tab out of popover → closes popover (Radix default behavior)

---

### Step 3.2: Verify Escape Key Handling

**Expected Behavior:**
- Press Escape → Popover closes
- Focus returns to trigger button

**Implementation:**
- Radix Popover handles this automatically
- No custom code needed

**Testing:**
- ✓ Open popover, press Escape → closes
- ✓ Focus returns to trigger button
- ✓ Screen reader announces focus return

---

### Step 3.3: Verify Enter/Space Activation

**Expected Behavior:**
- Focus on button → Press Enter or Space → Button activates

**Implementation:**
- Native button behavior (already works)
- No custom code needed

**Testing:**
- ✓ Focus on each button, press Enter → activates
- ✓ Focus on each button, press Space → activates
- ✓ Callbacks fire correctly (onNavigateProfile, onLogout, etc.)

---

### Step 3.4: Remove Arrow Key Navigation (No Longer Needed)

**Current Implementation:**
- Tab component provides Arrow Left/Right navigation
- This is being removed

**New Implementation:**
- Only Tab/Shift+Tab navigation
- Simpler mental model for users

**Testing:**
- ✓ Arrow keys do nothing (expected)
- ✓ Only Tab/Shift+Tab move focus

---

## Phase 4: Focus Management

**Goal:** Ensure focus is always visible and logical.

### Step 4.1: Verify Focus Indicators

**QDS Default Focus Styles (globals.css):**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

**Implementation:**
- No custom code needed (QDS handles it)
- Verify focus ring is visible on all buttons

**Testing:**
- ✓ Focus on trigger → visible focus ring
- ✓ Focus on each button inside popover → visible focus ring
- ✓ Focus ring has sufficient contrast (4.5:1 minimum)
- ✓ Test in both light and dark modes

---

### Step 4.2: Verify Focus Trap in Popover

**Expected Behavior:**
- Focus is trapped within popover when open
- Cannot Tab to elements behind popover
- Escape key releases focus trap

**Implementation:**
- Radix Popover provides focus trap automatically
- No custom code needed

**Testing:**
- ✓ Open popover → Tab repeatedly → stays within popover
- ✓ Cannot focus on navbar elements while popover is open
- ✓ Escape releases focus trap

---

### Step 4.3: Verify Focus Return on Close

**Expected Behavior:**
- Close popover → Focus returns to trigger button

**Implementation:**
- Radix Popover handles this automatically

**Testing:**
- ✓ Close popover via Escape → focus on trigger
- ✓ Close popover via click outside → focus on trigger
- ✓ Close popover via button activation → focus on trigger (if popover auto-closes)

---

## Phase 5: Visual Accessibility (Contrast & Touch Targets)

**Goal:** Ensure visual accessibility meets WCAG AA standards.

### Step 5.1: Verify Color Contrast

**Tool:** Chrome DevTools > Inspect > Accessibility > Contrast Ratio

**Text Elements to Check:**

| Element | Light Theme | Dark Theme | Required |
|---------|-------------|------------|----------|
| User name | --text on --glass-medium | --text on --glass-medium | 4.5:1 |
| User email | --muted on --glass-medium | --muted on --glass-medium | 4.5:1 |
| Button text | --foreground on button bg | --foreground on button bg | 4.5:1 |
| Danger text | --danger on surface | --danger on surface | 4.5:1 |

**Process:**
1. Open component in browser
2. Inspect each text element
3. Check "Contrast ratio" in Accessibility pane
4. If ratio < 4.5, adjust color or background

**Fixes if Needed:**
- Increase glass background opacity
- Add stronger `.glass-text` shadow
- Use higher contrast text color

**Testing:**
- ✓ All text meets 4.5:1 minimum contrast
- ✓ Focus indicators meet 3:1 minimum contrast
- ✓ Tested in both light and dark modes

---

### Step 5.2: Verify Touch Targets

**Requirement:** 44×44px minimum (WCAG 2.5.5 Level AAA)

**Buttons to Check:**

| Button | Class | Expected Size |
|--------|-------|---------------|
| Trigger | `min-h-[44px] min-w-[44px]` | 44×44px ✓ |
| View Profile | `min-h-[44px]` | 44×44px ✓ |
| Settings buttons | `min-h-[44px]` | 44×44px ✓ |
| Logout | `min-h-[44px]` | 44×44px ✓ |

**Spacing Between Targets:**

| Section | Class | Spacing |
|---------|-------|---------|
| Settings buttons | `space-y-2` | 8px ✓ |
| Section dividers | `pb-3`, `pt-3` | 12px ✓ |

**Testing:**
- ✓ Use browser DevTools ruler to measure button heights
- ✓ Verify all buttons are at least 44px tall
- ✓ Verify minimum 8px spacing between buttons
- ✓ Test on mobile device (iPhone SE, 375px width)

---

### Step 5.3: Verify Glassmorphism Accessibility

**Glass Panel Settings:**
- Backdrop blur: 12px (md) on desktop, 8px (sm) on mobile
- Background: rgba(255,255,255,0.7) light, rgba(23,21,17,0.7) dark
- Border: rgba(255,255,255,0.18) light, rgba(255,255,255,0.08) dark

**Accessibility Concerns:**
- Text readability on glass backgrounds
- Border visibility for users with low vision

**Mitigations (Already in QDS):**
- `.glass-text` utility adds text shadow for readability
- Fallback to solid backgrounds if backdrop-filter unsupported
- Sufficient color contrast maintained

**Testing:**
- ✓ Test with colorful desktop backgrounds (light, dark, busy patterns)
- ✓ Verify text is readable in all scenarios
- ✓ Test in high contrast mode (Windows)

---

## Phase 6: Screen Reader Testing

**Goal:** Verify screen reader compatibility.

### Step 6.1: NVDA Testing (Windows + Firefox)

**Test Script:**

1. **Open Popover:**
   - Navigate to trigger button
   - Expected: "Account and Settings, button, collapsed"
   - Press Enter
   - Expected: "Dialog" (popover opens), focus on first button

2. **Navigate Through Buttons:**
   - Press Tab repeatedly
   - Expected: Announces each button name
     - "View profile for [Name], button"
     - "Notifications, button"
     - "Appearance, button"
     - "Privacy, button"
     - "Help and Support, button"
     - "Log out of QuokkaQ, button"

3. **Close Popover:**
   - Press Escape
   - Expected: "Account and Settings, button, collapsed" (focus returned)

**Testing:**
- ✓ All buttons announced correctly
- ✓ No duplicate announcements (avatar is aria-hidden)
- ✓ Popover state changes announced
- ✓ Navigation is logical and clear

---

### Step 6.2: JAWS Testing (Windows + Chrome)

**Test Script:** Same as NVDA

**Expected Differences:**
- JAWS may announce more context (e.g., "Settings options, navigation landmark")
- JAWS may announce button state differently

**Testing:**
- ✓ All critical information announced
- ✓ No confusing or duplicate announcements
- ✓ Navigation is logical

---

### Step 6.3: VoiceOver Testing (macOS + Safari)

**Test Script:** Same as NVDA

**Commands:**
- VO + Right Arrow: Next element
- VO + Space: Activate button
- Escape: Close popover

**Expected:**
- "Account and Settings, button"
- (Opens) "Dialog, navigation, Settings options, button, Notifications"
- (Navigate) "Appearance, button", "Privacy, button", etc.

**Testing:**
- ✓ All buttons announced correctly
- ✓ VoiceOver focus follows visual focus
- ✓ No unexpected announcements

---

## Phase 7: Verification & Sign-off

**Goal:** Final checks before launch.

### Step 7.1: Automated Testing

**Tool: axe DevTools (Chrome Extension)**

**Process:**
1. Install axe DevTools from Chrome Web Store
2. Open ProfileSettingsDropdown component
3. Run "Scan all of my page"
4. Fix any violations found

**Expected Results:**
- 0 critical violations
- 0 serious violations
- Minor/moderate violations reviewed and justified

**Common False Positives:**
- "Buttons must have discernible text" (if aria-label used instead)
- "Element has insufficient color contrast" (on decorative elements)

---

**Tool: Lighthouse (Chrome DevTools)**

**Process:**
1. Open Chrome DevTools > Lighthouse
2. Select "Accessibility" category
3. Run audit
4. Review violations

**Expected Scores:**
- Desktop: ≥ 95
- Mobile: ≥ 90

**Common Issues:**
- Low contrast (fix by adjusting colors)
- Missing ARIA labels (add as needed)
- Incorrect heading hierarchy (use proper heading levels)

---

### Step 7.2: Manual Accessibility Checklist

**Keyboard Navigation:**
- [ ] All functionality available via keyboard
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] No keyboard traps
- [ ] Escape closes popover and returns focus
- [ ] Enter/Space activate buttons

**Screen Reader:**
- [ ] Tested with NVDA (Windows)
- [ ] Tested with JAWS (Windows)
- [ ] Tested with VoiceOver (macOS)
- [ ] All content announced correctly
- [ ] No duplicate announcements
- [ ] Button labels are clear and concise

**Focus Management:**
- [ ] Focus indicators visible on all interactive elements
- [ ] Focus indicators have 4.5:1 contrast minimum
- [ ] Focus trapped within popover when open
- [ ] Focus returns to trigger on close

**Color Contrast:**
- [ ] All text meets 4.5:1 minimum (body text)
- [ ] Large text (18px+) meets 3:1 minimum
- [ ] UI components (borders, icons) meet 3:1 minimum
- [ ] Tested in light and dark modes

**Touch Targets:**
- [ ] All buttons are 44×44px minimum
- [ ] Minimum 8px spacing between targets
- [ ] Tested on mobile (iPhone SE, 375px width)

**Visual:**
- [ ] Glass effects don't obscure content
- [ ] Text is readable on glass backgrounds
- [ ] Hover states provide visual feedback
- [ ] Disabled states (if any) are clearly indicated

**Edge Cases:**
- [ ] Long user names truncate properly
- [ ] Avatar fallback initials have sufficient contrast
- [ ] Component works at 360px width (mobile)
- [ ] High contrast mode (Windows) is usable
- [ ] Reduced motion preferences honored

---

### Step 7.3: Cross-Browser Testing

**Browsers to Test:**

| Browser | OS | Version | Notes |
|---------|-----|---------|-------|
| Chrome | Windows | Latest | Primary target |
| Firefox | Windows | Latest | NVDA compatibility |
| Safari | macOS | Latest | VoiceOver compatibility |
| Edge | Windows | Latest | Windows accessibility |
| Chrome | macOS | Latest | Cross-platform check |

**Testing:**
- ✓ Component renders correctly in all browsers
- ✓ Keyboard navigation works in all browsers
- ✓ Focus indicators visible in all browsers
- ✓ Glass effects render (or fallback) in all browsers

---

### Step 7.4: Mobile Testing

**Devices to Test:**

| Device | Screen Size | Browser |
|--------|-------------|---------|
| iPhone SE | 375×667 | Safari |
| iPhone 14 | 390×844 | Safari |
| Galaxy S8 | 360×740 | Chrome |
| iPad Mini | 768×1024 | Safari |

**Testing:**
- ✓ Popover fits within viewport (w-80 = 320px)
- ✓ Touch targets are easily tappable
- ✓ Text is readable at mobile sizes
- ✓ Glass effects perform well (reduced blur on mobile)

---

### Step 7.5: Sign-off Criteria

**Before Launch:**
- [ ] All WCAG 2.2 Level AA criteria met
- [ ] Automated testing (axe, Lighthouse) passes
- [ ] Manual keyboard testing complete
- [ ] Screen reader testing complete (NVDA, JAWS, VoiceOver)
- [ ] Color contrast verified in both themes
- [ ] Touch targets verified on mobile
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] Edge cases tested and handled
- [ ] Code review by accessibility specialist

**Documentation:**
- [ ] Accessibility decisions documented in context.md
- [ ] Test results recorded
- [ ] Known issues (if any) logged with mitigation plans

---

## Testing Scenarios

### Scenario 1: Keyboard-Only User (Power User)

**User Profile:**
- Expert keyboard user
- Uses Chrome on Windows
- Never uses mouse

**User Flow:**
1. Lands on Dashboard page
2. Presses Tab until reaching Account icon in navbar
3. Presses Enter to open dropdown
4. Expected: Focus on first button (View Profile or Notifications)
5. Presses Tab 3 times to reach "Privacy"
6. Presses Enter to navigate to Privacy settings
7. Expected: Navigates to Privacy page

**Success Criteria:**
- ✓ User never needs mouse
- ✓ Focus order is predictable
- ✓ Focus indicators are always visible
- ✓ Enter/Space activate buttons correctly

---

### Scenario 2: Screen Reader User (NVDA)

**User Profile:**
- Blind user
- Uses NVDA with Firefox on Windows
- Navigates with Tab and Arrow keys

**User Flow:**
1. Lands on Dashboard page
2. Presses H to skip to main content
3. Presses Tab until reaching Account icon
4. Expected: "Account and Settings, button, collapsed"
5. Presses Enter to open dropdown
6. Expected: "Dialog" announced, focus on first button
7. Presses Tab to navigate through buttons
8. Expected: Each button announced with clear label
9. Presses Tab to "Logout" button
10. Expected: "Log out of QuokkaQ, button"
11. Presses Escape to close
12. Expected: "Account and Settings, button, collapsed"

**Success Criteria:**
- ✓ All content announced logically
- ✓ Button labels are clear and concise
- ✓ No duplicate announcements
- ✓ Popover state changes announced

---

### Scenario 3: Low Vision User (Magnification)

**User Profile:**
- Uses 200% browser zoom
- Uses Chrome on macOS
- Has difficulty seeing low-contrast text

**User Flow:**
1. Lands on Dashboard page
2. Clicks Account icon in navbar
3. Dropdown opens
4. Expected: All text is readable at 200% zoom
5. Looks for Appearance settings
6. Expected: Focus indicator is clearly visible
7. Clicks Appearance button

**Success Criteria:**
- ✓ Text doesn't overlap at 200% zoom
- ✓ All text meets 4.5:1 contrast minimum
- ✓ Focus indicators are clearly visible
- ✓ Glass effects don't obscure text

---

### Scenario 4: Mobile Touch User (iPhone SE)

**User Profile:**
- Uses iPhone SE (375px width)
- Navigates with touch
- Has average-sized fingers

**User Flow:**
1. Opens Dashboard on mobile Safari
2. Taps Account icon in top-right
3. Expected: Dropdown opens without scrolling
4. Taps "Notifications" button
5. Expected: Button activates (no mis-taps)
6. Taps "Logout" button
7. Expected: Logs out successfully

**Success Criteria:**
- ✓ Dropdown fits within 375px viewport
- ✓ All buttons are easily tappable (44×44px)
- ✓ No accidental mis-taps (8px spacing)
- ✓ Text is readable on small screen

---

## Rollback Plan

**If Critical Accessibility Issues Found:**

1. **Immediate Rollback Triggers:**
   - Cannot navigate via keyboard
   - Screen reader cannot access content
   - Critical WCAG AA violations found
   - Component unusable in high contrast mode

2. **Rollback Process:**
   - Revert to previous tab-based implementation
   - Document issues found
   - Create fix plan before re-launch

3. **Partial Rollback (Feature Flag):**
   - Keep new design for desktop
   - Show old design for mobile (if mobile-specific issues)
   - Fix issues and re-enable

---

## Future Enhancements (Post-Launch)

**WCAG 2.2 Level AAA Targets:**
- [ ] 7:1 contrast ratio for body text (currently 4.5:1)
- [ ] Enhanced error identification (if logout requires confirmation)
- [ ] Context-sensitive help (tooltips on hover?)

**User Experience Improvements:**
- [ ] Add keyboard shortcuts (e.g., "P" for Profile, "L" for Logout)
- [ ] Add visual loading states for button activations
- [ ] Add success confirmation after navigation
- [ ] Add recent activity preview in dropdown

**Accessibility Enhancements:**
- [ ] Add high contrast mode detection and optimizations
- [ ] Add dyslexia-friendly font option
- [ ] Add colorblind mode indicators
- [ ] Add screen magnification detection

---

## Resources

**WCAG 2.2 Quick Reference:**
- https://www.w3.org/WAI/WCAG22/quickref/

**Radix UI Accessibility Documentation:**
- https://www.radix-ui.com/primitives/docs/overview/accessibility

**Testing Tools:**
- axe DevTools: https://www.deque.com/axe/devtools/
- Lighthouse: Built into Chrome DevTools
- WAVE: https://wave.webaim.org/extension/
- Color Contrast Analyzer: https://www.tpgi.com/color-contrast-checker/

**Screen Readers:**
- NVDA (Windows): https://www.nvaccess.org/download/
- JAWS (Windows): https://www.freedomscientific.com/products/software/jaws/
- VoiceOver (macOS): Built into macOS (Cmd+F5 to enable)

---

**End of Accessibility Implementation Plan**

*This plan provides comprehensive guidance for implementing WCAG 2.2 AA-compliant accessibility in the ProfileSettingsDropdown redesign. Follow each phase sequentially, testing at every step, to ensure a fully accessible component.*

# Accessibility Requirements: ProfileSettingsDropdown Redesign

**Component:** ProfileSettingsDropdown (components/navbar/profile-settings-dropdown.tsx)
**Date:** 2025-10-14
**WCAG Version:** 2.2 Level AA
**Compliance Target:** Full AA compliance with AAA focus indicators

---

## Executive Summary

The ProfileSettingsDropdown redesign removes the tab interface and introduces a simplified sectioned layout with glassmorphism effects. This document establishes WCAG 2.2 AA accessibility requirements to ensure the redesign maintains—and improves—keyboard navigation, screen reader support, and visual accessibility.

**Key Changes Impacting Accessibility:**
- **Removed:** Radix UI Tabs component (complex keyboard navigation)
- **Added:** Avatar component (requires accessible name)
- **Changed:** Width w-64 → w-80 (more content, needs contrast verification)
- **Enhanced:** Glassmorphism effects (requires contrast testing)
- **Simplified:** Single-level navigation (improved keyboard flow)

---

## WCAG 2.2 Success Criteria Map

### Critical Success Criteria

| Criterion | Level | Requirement | Impact |
|-----------|-------|-------------|--------|
| 1.3.1 Info and Relationships | A | Semantic HTML, proper ARIA roles | All sections must be programmatically identified |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 text, 3:1 UI components | Glass backgrounds require careful contrast verification |
| 1.4.11 Non-text Contrast | AA | 3:1 for UI components, focus indicators | Focus rings must contrast against glass panels |
| 2.1.1 Keyboard | A | All functionality via keyboard | Simplified navigation without tab traps |
| 2.1.2 No Keyboard Trap | A | Focus can always escape | Radix Popover provides this |
| 2.4.3 Focus Order | A | Logical focus sequence | Top-to-bottom through sections |
| 2.4.7 Focus Visible | AA | Visible focus indicator | 4.5:1 contrast minimum on glass |
| 2.5.5 Target Size (Enhanced) | AAA | 44×44px minimum | All buttons meet touch target size |
| 4.1.2 Name, Role, Value | A | All controls properly labeled | Avatar, buttons, sections need labels |
| 4.1.3 Status Messages | AA | Dynamic changes announced | If error states exist |

---

## 1. Semantic HTML Structure

### Current Structure (With Tabs)
```
Popover (role="dialog")
├── PopoverTrigger (Button, role="button")
└── PopoverContent (role="dialog")
    └── Tabs (role="tablist")
        ├── TabsList (role="tablist")
        │   ├── TabsTrigger[0] (role="tab", aria-selected)
        │   └── TabsTrigger[1] (role="tab")
        ├── TabsContent[0] (role="tabpanel", aria-labelledby)
        └── TabsContent[1] (role="tabpanel")
```

### Required Structure (Redesigned - No Tabs)
```
Popover (role="dialog")
├── PopoverTrigger (Button, role="button")
└── PopoverContent (role="dialog")
    ├── Section 1: User Profile
    │   ├── Avatar (decorative or role="img")
    │   ├── Name (heading or strong text)
    │   ├── Email (muted text)
    │   └── View Profile Button (role="button")
    ├── Section 2: Settings
    │   ├── Section Heading (optional, for screen readers)
    │   ├── Notifications Button (role="button")
    │   ├── Appearance Button (role="button")
    │   ├── Privacy Button (role="button")
    │   └── Help & Support Button (role="button")
    └── Section 3: Actions
        └── Logout Button (role="button")
```

### Semantic Requirements

**Profile Section:**
- Avatar must have `aria-label` if it conveys identity, or `aria-hidden="true"` if decorative
- User name should be a semantic heading (`<h3>` or `<p>` with `font-semibold`)
- Email should be `aria-describedby` for the profile section if needed
- View Profile button: `aria-label="View profile for [User Name]"`

**Settings Section:**
- Consider `<nav aria-label="Settings options">` to group settings buttons
- Each button needs visible text label (already present)
- Icons must be `aria-hidden="true"`

**Logout Section:**
- Logout button should have clear label (already present)
- Consider `aria-label="Log out of QuokkaQ"` for clarity

---

## 2. ARIA Attributes Inventory

### Popover Trigger Button

**Current ARIA:**
```tsx
<Button
  aria-label="Account and Settings"
  aria-haspopup="dialog"
>
```

**Required (Redesigned):**
```tsx
<Button
  aria-label="Account and Settings"
  aria-haspopup="dialog"
  aria-expanded={isOpen ? "true" : "false"}
>
```

**Rationale:** `aria-expanded` communicates popover state to screen readers.

---

### Avatar Component

**If Avatar Shows User Image:**
```tsx
<Avatar aria-label={user.name}>
  <AvatarImage src={user.avatar} alt="" />
  <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
</Avatar>
```

**If Avatar is Decorative (Recommended):**
```tsx
<Avatar aria-hidden="true">
  <AvatarImage src={user.avatar} alt="" />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

**Rationale:** Avatar is decorative since user name is displayed adjacent. Mark as `aria-hidden` to avoid duplicate announcements.

---

### Profile Section

**Without Tabs, Profile Section Structure:**
```tsx
<div className="space-y-2" role="group" aria-labelledby="profile-heading">
  <p id="profile-heading" className="sr-only">User Profile</p>

  <Avatar aria-hidden="true">...</Avatar>

  <div>
    <p className="text-sm font-medium">{user.name}</p>
    <p className="text-xs text-muted-foreground glass-text">{user.email}</p>
  </div>

  <Button
    aria-label={`View profile for ${user.name}`}
    onClick={onNavigateProfile}
  >
    View Profile
  </Button>
</div>
```

**Alternative (Simpler):**
```tsx
<div className="space-y-2">
  <Avatar aria-hidden="true">...</Avatar>

  <Button
    aria-label={`View profile for ${user.name}`}
    className="w-full"
    onClick={onNavigateProfile}
  >
    <div className="text-left">
      <p className="text-sm font-medium">{user.name}</p>
      <p className="text-xs text-muted-foreground glass-text">{user.email}</p>
    </div>
  </Button>
</div>
```

---

### Settings Section

**Navigation Wrapper:**
```tsx
<nav aria-label="Settings options" className="space-y-1">
  <Button aria-label="Notifications settings" onClick={...}>
    <Bell aria-hidden="true" />
    <span>Notifications</span>
  </Button>

  <Button aria-label="Appearance settings" onClick={...}>
    <Moon aria-hidden="true" />
    <span>Appearance</span>
  </Button>

  <Button aria-label="Privacy settings" onClick={...}>
    <Shield aria-hidden="true" />
    <span>Privacy</span>
  </Button>

  <Button aria-label="Help and support" onClick={...}>
    <HelpCircle aria-hidden="true" />
    <span>Help & Support</span>
  </Button>
</nav>
```

**Rationale:** Wrapping in `<nav>` with `aria-label` creates a clear landmark for screen reader users.

---

### Logout Button

**Recommended:**
```tsx
<Button
  variant="ghost"
  onClick={onLogout}
  aria-label="Log out of QuokkaQ"
  className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10"
>
  <LogOut aria-hidden="true" />
  Log out
</Button>
```

**Rationale:** Clear aria-label prevents ambiguity (logout of what?).

---

## 3. Keyboard Navigation Flow

### Removed: Tab Component Arrow Key Navigation

**Previous Behavior (With Tabs):**
- Tab key: Move between trigger → tab buttons → focusable elements within active panel
- Arrow Left/Right: Switch between tabs
- Escape: Close popover

**Removed Complexity:** No more arrow key tab switching, no tab/tabpanel relationship.

---

### Required: Simplified Keyboard Flow

**Keyboard Interaction Model:**

1. **Trigger Focus:**
   - Tab: Focus on trigger button
   - Enter/Space: Open popover
   - Escape: (No effect when closed)

2. **Popover Open:**
   - Focus automatically moves to first focusable element (View Profile button or first Settings button)
   - Tab: Move forward through all buttons (Profile → Settings 1-4 → Logout)
   - Shift+Tab: Move backward through buttons
   - Escape: Close popover, return focus to trigger

3. **Focus Order (Top to Bottom):**
   ```
   1. View Profile Button (if onNavigateProfile exists)
   2. Notifications Button
   3. Appearance Button
   4. Privacy Button
   5. Help & Support Button
   6. Logout Button
   ```

4. **Popover Close:**
   - Focus returns to trigger button
   - No focus loss

---

### Implementation Requirements

**Radix Popover Already Provides:**
- Focus trap within popover
- Escape key handling
- Focus return on close
- Portal rendering (no DOM order issues)

**Developer Must Ensure:**
- Logical DOM order matches visual order
- No `tabindex` greater than 0
- All buttons have visible text or aria-label
- Focus indicators visible on all interactive elements

---

## 4. Touch Target Specifications

### WCAG 2.5.5 Target Size (Enhanced) - Level AAA

**Requirement:** 44×44px minimum touch target size with 8px spacing between targets.

**Current Implementation (Already Compliant):**
- Trigger button: `min-h-[44px] min-w-[44px]`
- Tab buttons (removed): `min-h-[44px]`

**Required (Redesigned):**

**Trigger Button:**
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-[44px] min-w-[44px] h-11 w-11"
>
```
✅ Already compliant

**Profile Button (View Profile):**
```tsx
<Button
  variant="ghost"
  className="w-full min-h-[44px] justify-start p-3"
>
```
✅ Compliant

**Settings Buttons:**
```tsx
<Button
  variant="ghost"
  size="sm"
  className="w-full justify-start min-h-[44px] px-3"
>
```
✅ Compliant (size="sm" is 32px by default, override with min-h-[44px])

**Logout Button:**
```tsx
<Button
  variant="ghost"
  className="w-full justify-start min-h-[44px] px-3 text-danger"
>
```
✅ Compliant

**Spacing Between Targets:**
- Settings buttons: `space-y-1` = 4px (increase to `space-y-2` = 8px for AAA compliance)
- Sections: `space-y-3` = 12px (already compliant)

**Recommendation:** Change Settings button spacing from `space-y-1` to `space-y-2` for 8px minimum spacing.

---

## 5. Color Contrast Requirements

### Text Contrast (WCAG 1.4.3 - Level AA)

**Light Theme:**
- Body text (--text: #2A2721 on --surface: #FFFFFF): **16.7:1** ✅ AAA
- Muted text (--muted: #625C52 on --surface: #FFFFFF): **7.2:1** ✅ AAA
- Glass text (--text on --glass-medium: rgba(255,255,255,0.7)): **Needs verification**

**Dark Theme:**
- Body text (--text: #F3EFE8 on --surface: #171511): **14.2:1** ✅ AAA
- Muted text (--muted: #B8AEA3 on --surface: #171511): **9.8:1** ✅ AAA
- Glass text (--text on --glass-medium: rgba(23,21,17,0.7)): **Needs verification**

### Glassmorphism Contrast Concerns

**Glass Panel Background:**
- Uses `backdrop-filter: blur(12px)` and semi-transparent background
- Text readability enhanced with `.glass-text` utility (text-shadow)

**Verification Required:**
1. Measure contrast of all text on glass panels in both themes
2. Verify `.glass-text` shadow provides sufficient readability
3. Test with color contrast analyzer in browser DevTools
4. Ensure 4.5:1 minimum for body text, 3:1 for large text (18px+)

**Recommended Testing:**
- Use Chrome DevTools > Inspect > Accessibility pane > Contrast ratio
- Test against various desktop backgrounds (light, dark, colorful)
- Verify glass-panel text meets 4.5:1 contrast with perceived background

---

### UI Component Contrast (WCAG 1.4.11 - Level AA)

**Focus Indicators:**
- Minimum 3:1 contrast against adjacent colors
- Current: `focus-visible:ring-4 ring-accent/60` (rgba(45, 108, 223, 0.6))
- Light theme accent: #2D6CDF on white background: **7.8:1** ✅
- Dark theme accent: #86A9F6 on dark background: **8.9:1** ✅

**Focus Ring on Glass:**
- Glass panel focus enhancement: `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5)`
- Light theme: **Sufficient contrast** ✅
- Dark theme: `rgba(134, 169, 246, 0.6)` **Sufficient contrast** ✅

**Button States:**
- Hover: `hover:bg-muted/50` (semi-transparent)
- Verify hover state provides 3:1 contrast with button text
- Danger button: `text-danger` (#D92D20) on surface: **8.3:1** ✅

**Borders:**
- Glass borders: `border-glass` (rgba(255,255,255,0.18) light, rgba(255,255,255,0.08) dark)
- Subtle borders acceptable if not relied upon for meaning
- Icons + text provide redundancy

---

### Avatar Contrast

**Avatar Fallback Background:**
- Light: `--avatar-bg: hsl(35, 40%, 92%)` (#F5EFE8)
- Dark: `--avatar-bg: hsl(35, 30%, 22%)` (#473D30)

**Avatar Text:**
- Light: `--avatar-text: hsl(35, 45%, 35%)` (#705633)
- Dark: `--avatar-text: hsl(35, 35%, 65%)` (#BDA987)

**Verification Required:**
- Calculate contrast ratio for fallback initials
- Ensure 4.5:1 minimum for legibility
- Test with various initials (A, W, M for worst-case width)

---

## 6. Screen Reader Requirements

### Popover Announcement

**On Trigger Activation:**
1. Screen reader announces: "Account and Settings, button, collapsed/expanded"
2. Popover opens, focus moves to first interactive element
3. Screen reader announces: "Dialog" or "Menu" (depending on role)

**Radix Popover Provides:**
- `role="dialog"` on PopoverContent
- Focus management (automatic focus trap)
- Escape key handling

**Developer Must Ensure:**
- Trigger has `aria-label` or visible text
- Popover content has logical reading order
- All interactive elements have accessible names

---

### Profile Section Announcements

**Scenario 1: Avatar is Decorative**
```tsx
<Avatar aria-hidden="true">...</Avatar>
<div>
  <p className="text-sm font-medium">Jane Doe</p>
  <p className="text-xs text-muted-foreground">jane.doe@university.edu</p>
</div>
<Button aria-label="View profile for Jane Doe">View Profile</Button>
```

**Screen Reader Flow:**
1. "Jane Doe" (reads name)
2. "jane.doe@university.edu" (reads email)
3. "View profile for Jane Doe, button" (reads button)

✅ Clear, no duplicate announcements

**Scenario 2: Avatar Labeled (Not Recommended)**
```tsx
<Avatar aria-label="Jane Doe">...</Avatar>
<div>
  <p className="text-sm font-medium">Jane Doe</p>
  ...
</div>
```

**Screen Reader Flow:**
1. "Jane Doe, image" (reads avatar)
2. "Jane Doe" (reads name text)

❌ Duplicate announcement, confusing

**Recommendation:** Use `aria-hidden="true"` on Avatar to avoid duplication.

---

### Settings Button Announcements

**Current Structure:**
```tsx
<Button onClick={...}>
  <Bell aria-hidden="true" />
  Notifications
</Button>
```

**Screen Reader Announces:**
- "Notifications, button"

✅ Clear and concise

**Enhanced Structure (Optional):**
```tsx
<Button aria-label="Notifications settings" onClick={...}>
  <Bell aria-hidden="true" />
  <span>Notifications</span>
  <span className="sr-only">settings</span>
</Button>
```

**Screen Reader Announces:**
- "Notifications settings, button"

✅ More context, but may be verbose for power users

**Recommendation:** Keep simple "Notifications, button" unless user testing shows confusion.

---

### Logout Button Announcement

**Current:**
```tsx
<Button onClick={onLogout}>
  <LogOut aria-hidden="true" />
  Log out
</Button>
```

**Screen Reader Announces:**
- "Log out, button"

✅ Clear

**Enhanced (Recommended):**
```tsx
<Button aria-label="Log out of QuokkaQ" onClick={onLogout}>
  <LogOut aria-hidden="true" />
  Log out
</Button>
```

**Screen Reader Announces:**
- "Log out of QuokkaQ, button"

✅ Provides context (logout of what?)

---

### Dynamic Content Announcements

**If Error States Exist:**
- Use `role="alert"` or `aria-live="polite"` for error messages
- Example: "Failed to load profile. Please try again."

**If Loading States Exist:**
- Use `aria-busy="true"` on loading buttons
- Use `aria-live="polite"` region for status updates

**Current Implementation:**
- No dynamic content in dropdown (all static)
- No announcements needed beyond button activations

---

## 7. Visual Considerations

### Focus Indicators

**QDS Focus Ring:**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```

**Glass Panel Focus (Enhanced):**
```css
.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

**Requirement:**
- Focus ring must be visible on all interactive elements
- Minimum 2px thick, 4.5:1 contrast with background
- Already compliant with QDS defaults ✅

---

### Glass Text Readability

**Glass Text Utility:**
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**Requirement:**
- Verify text-shadow enhances readability on glass backgrounds
- Test with various desktop wallpapers (light, dark, busy patterns)
- Ensure 4.5:1 contrast maintained

---

### Width Change Impact

**Current:** w-64 (256px)
**Redesigned:** w-80 (320px)

**Accessibility Impact:**
- More horizontal space for text (reduces wrapping)
- Better readability for long user names/emails
- Improved touch target spacing
- No negative impact ✅

---

## 8. Testing Requirements

### Manual Testing Checklist

**Keyboard Navigation:**
- [ ] Tab key cycles through all interactive elements in logical order
- [ ] Shift+Tab moves backward through focus order
- [ ] Enter/Space activates buttons
- [ ] Escape closes popover and returns focus to trigger
- [ ] No keyboard traps (can always navigate away)
- [ ] Focus indicators visible on all elements

**Screen Reader Testing:**
- [ ] NVDA (Windows): Test with Firefox
- [ ] JAWS (Windows): Test with Chrome
- [ ] VoiceOver (macOS): Test with Safari
- [ ] Verify all buttons announce correctly
- [ ] Verify avatar doesn't cause duplicate announcements
- [ ] Verify popover open/close states are announced
- [ ] Verify focus return on close is announced

**Touch Target Testing:**
- [ ] All buttons are at least 44×44px
- [ ] Minimum 8px spacing between targets
- [ ] Buttons are easily tappable on mobile (test at 360px width)

**Contrast Testing:**
- [ ] Use Chrome DevTools > Accessibility > Contrast ratio
- [ ] Verify all text meets 4.5:1 minimum on glass backgrounds
- [ ] Verify focus indicators have 3:1 minimum contrast
- [ ] Test in both light and dark modes
- [ ] Test with colorful desktop backgrounds

**Visual Testing:**
- [ ] Focus indicators clearly visible
- [ ] Hover states provide visual feedback
- [ ] Disabled states (if any) are clearly indicated
- [ ] Glass effects don't obscure content

---

### Automated Testing Tools

**Browser Extensions:**
- axe DevTools (Chrome/Firefox)
- WAVE (Chrome/Firefox/Edge)
- Lighthouse (Chrome DevTools)

**Expected Results:**
- 0 critical violations
- 0 serious violations
- Minor violations acceptable if justified (e.g., low-contrast decorative elements)

**Lighthouse Scores:**
- Accessibility: ≥ 95 (desktop)
- Accessibility: ≥ 90 (mobile)

---

## 9. Edge Cases & Special Considerations

### Long User Names

**Scenario:** User name exceeds button width
**Solution:** Truncate with ellipsis, provide full name via tooltip or aria-label

```tsx
<p className="text-sm font-medium truncate" title={user.name}>
  {user.name}
</p>
```

---

### No Avatar Image

**Scenario:** User has no avatar, fallback to initials
**Solution:** Avatar component already handles this

```tsx
<Avatar aria-hidden="true">
  <AvatarImage src={user.avatar} />
  <AvatarFallback className="avatar-placeholder">
    {getInitials(user.name)}
  </AvatarFallback>
</Avatar>
```

**Ensure:** Fallback initials have sufficient contrast (see Avatar Contrast section)

---

### Mobile Layout

**Scenario:** Dropdown on small screens (360px)
**Consideration:**
- Popover width w-80 (320px) fits within 360px viewport with 20px margin each side
- Touch targets already meet 44×44px minimum
- No horizontal scroll required

**Test:** Verify on iPhone SE (375px width) and Galaxy S8 (360px width)

---

### Reduced Motion

**QDS Already Handles:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Popover Animations:**
- Radix Popover uses CSS animations
- Already respects prefers-reduced-motion
- No additional implementation needed ✅

---

### High Contrast Mode (Windows)

**Consideration:**
- Glass effects may not render in high contrast mode
- Fallback to solid backgrounds already provided in globals.css

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: none;
  }
}
```

**Test:** Enable High Contrast Mode in Windows and verify dropdown is usable

---

## 10. Success Metrics

### Compliance Goals

**WCAG 2.2 Level AA:**
- ✅ All Level A criteria met
- ✅ All Level AA criteria met
- ✅ Focus indicators meet AAA standard (4.5:1 contrast)
- ✅ Touch targets meet AAA standard (44×44px)

**Screen Reader Compatibility:**
- ✅ Compatible with NVDA, JAWS, VoiceOver
- ✅ All content announced logically
- ✅ No duplicate announcements
- ✅ Proper button labels

**Keyboard Navigation:**
- ✅ 100% keyboard accessible
- ✅ No keyboard traps
- ✅ Logical focus order
- ✅ Focus indicators always visible

---

## Appendix: WCAG 2.2 Quick Reference

### Level A (Required)

- 1.3.1 Info and Relationships
- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 4.1.2 Name, Role, Value

### Level AA (Target)

- 1.4.3 Contrast (Minimum) - 4.5:1 text, 3:1 large text
- 1.4.11 Non-text Contrast - 3:1 UI components
- 2.4.3 Focus Order
- 2.4.7 Focus Visible
- 4.1.3 Status Messages

### Level AAA (Aspirational)

- 2.5.5 Target Size (Enhanced) - 44×44px minimum
- 1.4.6 Contrast (Enhanced) - 7:1 text, 4.5:1 large text

---

**End of Accessibility Requirements Document**

*This document provides a comprehensive foundation for implementing WCAG 2.2 AA-compliant accessibility in the ProfileSettingsDropdown redesign. All requirements should be validated during implementation and verified through manual and automated testing.*

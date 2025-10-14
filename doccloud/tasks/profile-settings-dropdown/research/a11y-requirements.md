# Accessibility Requirements Analysis: ProfileSettingsDropdown

**Created:** 2025-10-14
**Component:** ProfileSettingsDropdown (User Account dropdown with tabbed interface)
**WCAG Target:** 2.2 Level AA

---

## Executive Summary

The ProfileSettingsDropdown component requires a fully accessible tabbed interface within a popover/dropdown pattern. This combines two WAI-ARIA patterns:

1. **Popover/Dropdown** - Radix UI provides built-in accessibility
2. **Tabs** - Custom implementation requiring manual ARIA attributes and keyboard handling

**Compliance Level:** Full WCAG 2.2 AA compliance achievable with proper implementation.

---

## 1. Keyboard Interaction Model

### 1.1 Popover Trigger (User Icon Button)

**Handled by Radix UI Popover + Button primitives:**

- `Tab` - Moves focus to/from User Account button
- `Enter` or `Space` - Opens popover, focus moves to first tab
- `Escape` - Closes popover (when open), returns focus to trigger button

**Touch Target:** Minimum 44×44px (WCAG 2.5.5 Target Size)

### 1.2 Tab Navigation (Inside Popover)

**WAI-ARIA Tabs Pattern - Manual Implementation Required:**

When popover opens:
- Focus automatically moves to the **selected tab** (Profile by default)
- Focus is visually indicated with 4.5:1 contrast ratio minimum

**Tab List Keyboard Controls:**

| Key | Behavior |
|-----|----------|
| `Tab` | Moves focus OUT of tab list to first focusable element in active tab panel (Dashboard link, settings options, etc.) |
| `Shift+Tab` | Moves focus OUT of tab list backwards (likely closes popover if nothing before tabs) |
| `Left Arrow` | Moves focus to previous tab, wraps from Profile → Settings |
| `Right Arrow` | Moves focus to next tab, wraps from Settings → Profile |
| `Home` (Optional) | Moves focus to first tab (Profile) |
| `End` (Optional) | Moves focus to last tab (Settings) |
| `Enter` / `Space` | Activates focused tab (if using manual activation) |
| `Escape` | Closes popover, returns focus to User icon trigger |

**Activation Mode Decision:**

- **Recommended: Automatic Activation**
  - When arrow keys move focus to a tab, that tab is immediately activated (panel shown)
  - Rationale: Tab panels contain simple display content (user info, settings links), no heavy loading delay
  - This matches common UX patterns (e.g., GitHub, Slack dropdowns)

- **Alternative: Manual Activation**
  - Arrow keys move focus only; Enter/Space activates tab
  - Rationale: Use if panels have expensive rendering or users need to explore tabs without triggering changes
  - NOT recommended for this use case

**Decision:** Use **Automatic Activation** for better UX.

### 1.3 Tab Panel Navigation

**Inside Active Tab Panel:**

- `Tab` - Moves focus through interactive elements (Dashboard link, Settings checkboxes, etc.)
- `Escape` - Closes popover, returns focus to trigger button
- All links/buttons within panels must meet 44×44px touch target minimum

---

## 2. ARIA Attributes Requirements

### 2.1 Popover Container (Radix UI Handles)

Radix UI Popover provides:
- `aria-haspopup="dialog"` on trigger button
- `aria-expanded="true|false"` on trigger button
- `role="dialog"` on popover content
- Focus trap within popover

**No additional ARIA needed for popover layer.**

### 2.2 Tab List Structure

**Tab List Container:**
```tsx
<div role="tablist" aria-label="Profile and Settings">
  {/* tabs go here */}
</div>
```

**Individual Tab Buttons:**
```tsx
<button
  role="tab"
  id="tab-profile"
  aria-selected="true|false"
  aria-controls="panel-profile"
  tabIndex={isSelected ? 0 : -1}
>
  Profile
</button>
```

**Tab Panel:**
```tsx
<div
  role="tabpanel"
  id="panel-profile"
  aria-labelledby="tab-profile"
  tabIndex={0}
  hidden={!isSelected}
>
  {/* panel content */}
</div>
```

### 2.3 Complete ARIA Attribute Mapping

| Element | ARIA Attributes | Notes |
|---------|----------------|-------|
| **User Icon Trigger** | `aria-label="Account menu"`, `aria-haspopup="dialog"`, `aria-expanded="true|false"` | Radix UI handles most; verify aria-label |
| **Popover Content** | `role="dialog"` (Radix) | Auto-handled |
| **Tab List Container** | `role="tablist"`, `aria-label="Profile and Settings"` | Manual |
| **Profile Tab** | `role="tab"`, `id="tab-profile"`, `aria-selected="true|false"`, `aria-controls="panel-profile"`, `tabIndex={0|-1}` | Manual |
| **Settings Tab** | `role="tab"`, `id="tab-settings"`, `aria-selected="true|false"`, `aria-controls="panel-settings"`, `tabIndex={0|-1}` | Manual |
| **Profile Panel** | `role="tabpanel"`, `id="panel-profile"`, `aria-labelledby="tab-profile"`, `tabIndex={0}`, `hidden={!selected}` | Manual |
| **Settings Panel** | `role="tabpanel"`, `id="panel-settings"`, `aria-labelledby="tab-settings"`, `tabIndex={0}`, `hidden={!selected}` | Manual |
| **Dashboard Link** | `aria-label="Go to Dashboard"` (if icon-only) | Standard link a11y |
| **Settings Checkboxes** | `aria-checked`, `aria-label` | If toggle switches used |
| **Logout Link** | No extra ARIA (semantic `<button>` sufficient) | Standard button a11y |

### 2.4 Dynamic State Announcements

**Screen Reader Announcements Needed:**

1. **When popover opens:**
   - Radix announces dialog role
   - Focus moves to selected tab
   - SR announces: "Profile, tab, selected, 1 of 2"

2. **When switching tabs:**
   - SR announces: "Settings, tab, selected, 2 of 2"
   - Panel content change is implicit (DOM visibility toggle)

3. **Optional: Tab panel change announcement**
   - Use `aria-live="polite"` on a visually hidden element if tab switch needs explicit announcement
   - **Not recommended** - tab role change is sufficient for most SRs

---

## 3. Focus Management Strategy

### 3.1 Focus Flow

**1. Popover Opens (User clicks User icon):**
   - Focus moves from trigger → **selected tab** (Profile by default)
   - Selected tab has `tabIndex={0}`, unselected tab has `tabIndex={-1}`

**2. Tab Switching (Arrow keys):**
   - Focus moves between tabs
   - Only selected tab is in tab order (`tabIndex={0}`)
   - **Automatic activation:** Panel updates immediately as focus moves

**3. Tab Key from Tab List:**
   - Focus moves to first focusable element in active panel
   - E.g., Dashboard link (Profile panel) or first checkbox (Settings panel)

**4. Escape Key:**
   - Focus returns to User icon trigger button
   - Popover closes

**5. Click Outside Popover:**
   - Popover closes
   - Focus remains on clicked element (Radix default behavior)

### 3.2 Focus Trap

**Radix UI Popover handles focus trap:**
- Tab navigation cycles within popover
- Shift+Tab cycles backwards
- Escape exits trap and closes popover

**No additional focus trap logic needed.**

### 3.3 Focus Indicators

**WCAG 2.4.7 Focus Visible (AA):**

All interactive elements require visible focus indicator with:
- **Contrast Ratio:** 4.5:1 minimum against background
- **Thickness:** 2px minimum (QDS uses 3px ring)
- **Color:** QDS default focus ring uses `--ring` (Clear Sky Blue #2D6CDF)

**Button focus-visible pattern (from GlobalNavBar):**
```tsx
className={cn(
  "focus-visible:ring-4 focus-visible:ring-accent/60"
)}
```

**Apply to:**
- User icon trigger button ✓ (existing)
- Tab buttons (Profile, Settings) ✓ (new)
- Dashboard link ✓ (existing Link component)
- Settings checkboxes/toggles ✓ (existing UI primitives)
- Logout button ✓ (existing Button component)

**QDS Focus Styles (from globals.css):**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```

**Glass panel focus enhancement:**
```css
.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

**Decision:** Use existing QDS focus-visible classes. No custom focus styles needed.

---

## 4. Screen Reader Compatibility

### 4.1 Screen Reader Testing Requirements

**Test with:**
- **NVDA (Windows)** - Free, most common
- **JAWS (Windows)** - Enterprise standard
- **VoiceOver (macOS/iOS)** - Built-in Apple SR
- **TalkBack (Android)** - Mobile testing

### 4.2 Expected Screen Reader Behavior

**Scenario 1: User Opens Popover**

1. User tabs to "Account menu" button
2. SR announces: "Account menu, button, collapsed"
3. User presses Enter
4. SR announces: "Account menu, dialog"
5. Focus moves to Profile tab
6. SR announces: "Profile, tab, selected, 1 of 2"

**Scenario 2: User Switches to Settings Tab**

1. User presses Right Arrow
2. Focus moves to Settings tab
3. SR announces: "Settings, tab, selected, 2 of 2"
4. Panel content changes (DOM hidden attribute toggles)

**Scenario 3: User Navigates Settings Panel**

1. User presses Tab (from Settings tab)
2. Focus moves to first checkbox in Settings panel
3. SR announces: "Email notifications, checkbox, checked"
4. User presses Space to toggle
5. SR announces: "Email notifications, checkbox, not checked"

**Scenario 4: User Closes Popover**

1. User presses Escape
2. Popover closes
3. Focus returns to "Account menu" button
4. SR announces: "Account menu, button, collapsed"

### 4.3 Screen Reader-Only Text (sr-only)

**Use sr-only for:**

1. **Tab index announcement** (optional):
   ```tsx
   <span className="sr-only">1 of 2</span>
   ```

2. **User role badge** (if visually subtle):
   ```tsx
   <span className="sr-only">Role: Student</span>
   ```

3. **Icon-only buttons** (if any):
   ```tsx
   <span className="sr-only">Close Settings</span>
   ```

**Existing sr-only pattern (from GlobalNavBar):**
```tsx
<span className="sr-only">Account</span>
```

**Decision:** Add sr-only text for tab count if UX testing shows it helps.

---

## 5. Color Contrast Analysis (WCAG 1.4.3)

### 5.1 Text Contrast Requirements

**WCAG AA Minimum:**
- **Normal text (<18pt / <14pt bold):** 4.5:1
- **Large text (≥18pt / ≥14pt bold):** 3:1
- **UI components:** 3:1

### 5.2 QDS Color Tokens (Light Mode)

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|------------|-------|-------|
| **Tab (unselected)** | `--muted` (#625C52) | `--popover` (#FFFFFF) | ~6.5:1 | ✓ AA |
| **Tab (selected)** | `--foreground` (#2A2721) | `--popover` (#FFFFFF) | ~13:1 | ✓ AAA |
| **Tab (hover)** | `--foreground` (#2A2721) | `--accent/5` (very light) | ~12:1 | ✓ AAA |
| **User name** | `--foreground` (#2A2721) | `--popover` (#FFFFFF) | ~13:1 | ✓ AAA |
| **User email** | `--muted-foreground` (#625C52) | `--popover` (#FFFFFF) | ~6.5:1 | ✓ AA |
| **User role** | `--muted-foreground` (#625C52) | `--popover` (#FFFFFF) | ~6.5:1 | ✓ AA |
| **Dashboard link** | `--primary` (#8A6B3D) | `--popover` (#FFFFFF) | ~4.8:1 | ✓ AA |
| **Settings label** | `--foreground` (#2A2721) | `--popover` (#FFFFFF) | ~13:1 | ✓ AAA |
| **Focus ring** | `--ring` (#2D6CDF) | `--popover` (#FFFFFF) | ~4.9:1 | ✓ AA (3:1 UI) |

### 5.3 QDS Color Tokens (Dark Mode)

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|------------|-------|-------|
| **Tab (unselected)** | `--muted` (#B8AEA3) | `--popover` (#171511) | ~7.2:1 | ✓ AA |
| **Tab (selected)** | `--foreground` (#F3EFE8) | `--popover` (#171511) | ~12:1 | ✓ AAA |
| **User name** | `--foreground` (#F3EFE8) | `--popover` (#171511) | ~12:1 | ✓ AAA |
| **User email** | `--muted-foreground` (#B8AEA3) | `--popover` (#171511) | ~7.2:1 | ✓ AA |
| **Focus ring** | `--ring` (#86A9F6) | `--popover` (#171511) | ~6.8:1 | ✓ AA |

**All QDS tokens meet WCAG AA standards.**

### 5.4 Contrast Testing Tools

Use these tools to verify:
- **Chrome DevTools** - Lighthouse Accessibility audit
- **axe DevTools** - Browser extension
- **Color Contrast Analyzer** - Standalone app
- **WebAIM Contrast Checker** - Online tool

**Manual verification required for:**
- Tab selected state background (if custom background used)
- Hover states
- Focus indicators

---

## 6. Touch Target Size (WCAG 2.5.5)

### 6.1 Minimum Touch Target Requirements

**WCAG 2.2 Level AA:**
- **Minimum size:** 24×24 CSS pixels
- **Recommended size:** 44×44 CSS pixels (iOS HIG, Android Material)

**QDS Standard (from codebase):**
```tsx
min-h-[44px] min-w-[44px]
```

### 6.2 Touch Target Inventory

| Element | Required Size | QDS Class | Status |
|---------|---------------|-----------|--------|
| **User Icon Button** | 44×44px | `min-h-[44px] min-w-[44px]` | ✓ Exists |
| **Profile Tab** | 44px min-height | `min-h-[44px] px-4` | ✓ New |
| **Settings Tab** | 44px min-height | `min-h-[44px] px-4` | ✓ New |
| **Dashboard Link** | 44×44px | `min-h-[44px] flex items-center` | ✓ New |
| **Settings Toggles** | 44×44px | `min-h-[44px]` on parent | ✓ New |
| **Logout Button** | 44×44px | `h-11` (44px default) | ✓ Existing |

### 6.3 Touch Target Spacing

**Minimum spacing between targets:** 8px (QDS `gap-2`)

**Tab buttons horizontal spacing:**
```tsx
<div className="flex gap-2">
  {/* 8px gap between Profile and Settings tabs */}
</div>
```

**Panel interactive elements spacing:**
```tsx
<div className="space-y-2">
  {/* 8px vertical spacing between settings */}
</div>
```

---

## 7. Semantic HTML

### 7.1 Semantic Element Choices

| Element | Semantic Choice | Rationale |
|---------|----------------|-----------|
| **Popover trigger** | `<button>` | Interactive control, not navigation |
| **Tab buttons** | `<button role="tab">` | Interactive controls with explicit tab role |
| **Tab panels** | `<div role="tabpanel">` | Container for panel content |
| **Dashboard link** | `<Link>` (Next.js) | Navigation to another page |
| **Settings toggles** | `<button>` or Checkbox | Interactive controls |
| **Logout** | `<button>` | Action, not navigation |

### 7.2 Heading Hierarchy

**Inside Profile Panel:**
```tsx
<h3 className="text-sm font-medium">User Information</h3>
```

**Inside Settings Panel:**
```tsx
<h3 className="text-sm font-medium">Quick Settings</h3>
```

**Rationale:** Popover is not a landmark, so headings provide internal structure for SR navigation.

### 7.3 Landmark Roles

**Popover is NOT a landmark:**
- No `<nav>`, `<main>`, `<aside>` needed
- Popover is transient UI, not page structure

---

## 8. Testing Methodology

### 8.1 Automated Testing Tools

| Tool | Purpose | Expected Violations |
|------|---------|-------------------|
| **axe DevTools** | WCAG violations, ARIA errors | 0 errors |
| **Lighthouse** | Accessibility score | 100/100 |
| **WAVE** | Visual contrast, structure | 0 errors |

### 8.2 Manual Keyboard Testing Checklist

- [ ] Tab to User icon button (focus visible?)
- [ ] Enter to open popover (focus moves to Profile tab?)
- [ ] Right Arrow to Settings tab (focus visible, tab selected?)
- [ ] Left Arrow back to Profile tab (wraps correctly?)
- [ ] Tab from tab list to panel content (focus moves to Dashboard link?)
- [ ] Escape to close popover (focus returns to User icon?)
- [ ] Shift+Tab from User icon (does NOT open popover?)
- [ ] Click outside popover (closes popover?)

### 8.3 Screen Reader Testing Checklist

- [ ] NVDA announces "Account menu, button" on trigger
- [ ] NVDA announces "Profile, tab, selected" when popover opens
- [ ] NVDA announces "Settings, tab, selected" when switching tabs
- [ ] NVDA announces panel content correctly (user name, links, settings)
- [ ] VoiceOver (macOS) behaves identically to NVDA
- [ ] Mobile VoiceOver (iOS) and TalkBack (Android) work correctly

### 8.4 Visual Testing Checklist

- [ ] All text meets 4.5:1 contrast (use DevTools contrast checker)
- [ ] Focus indicators visible on all interactive elements
- [ ] Touch targets are 44×44px minimum (use DevTools inspect)
- [ ] Hover states visible and distinct
- [ ] Active tab visually distinct from inactive tab
- [ ] Light mode and dark mode both pass contrast checks

### 8.5 Responsive Testing Checklist

- [ ] 360px mobile (touch targets still 44px?)
- [ ] 768px tablet (layout responsive?)
- [ ] 1024px desktop (full experience?)
- [ ] 1280px+ wide (no breaking?)

---

## 9. Known Risks & Mitigations

### 9.1 Risk: Tab Keyboard Handling Complexity

**Risk:** Arrow key navigation is custom logic, prone to bugs (focus loss, infinite loops, wrong wrapping).

**Mitigation:**
- Use `useRef` to manage tab button refs
- Test arrow key wrapping exhaustively
- Add focus guards (e.g., check `document.activeElement` before moving focus)

### 9.2 Risk: Screen Reader Announcement Gaps

**Risk:** Screen readers may not announce tab changes if ARIA attributes are incorrect.

**Mitigation:**
- Test with multiple SRs (NVDA, JAWS, VoiceOver)
- Use `aria-selected` and `tabIndex` correctly
- Avoid `aria-live` unless absolutely necessary (can cause announcement spam)

### 9.3 Risk: Focus Trap Conflicts

**Risk:** Radix Popover focus trap conflicts with tab keyboard handling.

**Mitigation:**
- Radix handles focus trap for popover boundary
- Tab buttons manage their own focus with `tabIndex`
- Test Tab key from tab list → panel content flow

### 9.4 Risk: Color Contrast Failures in Custom States

**Risk:** Hover/focus/selected states use custom backgrounds that may fail contrast.

**Mitigation:**
- Use QDS semantic tokens exclusively
- Measure contrast with DevTools after implementation
- Test dark mode separately (different contrast ratios)

### 9.5 Risk: Touch Target Failures on Mobile

**Risk:** Tab buttons may collapse below 44px on mobile if text wraps.

**Mitigation:**
- Use `min-h-[44px]` on tab buttons
- Test on real devices (iPhone SE, small Android)
- Add `whitespace-nowrap` to tab labels if needed

---

## 10. Success Criteria

**Component passes WCAG 2.2 AA if:**

- [ ] All automated tests pass (axe, Lighthouse, WAVE)
- [ ] All keyboard navigation works without mouse
- [ ] All screen reader tests pass on NVDA, JAWS, VoiceOver
- [ ] All color contrast ratios ≥ 4.5:1 (text) and ≥ 3:1 (UI)
- [ ] All touch targets ≥ 44×44px
- [ ] Focus indicators visible with ≥ 4.5:1 contrast
- [ ] No ARIA attribute errors or warnings
- [ ] Semantic HTML used throughout
- [ ] Component works in light and dark modes
- [ ] Component works on mobile (360px+) and desktop (1280px+)

---

## 11. References

**WAI-ARIA Specifications:**
- [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

**WCAG 2.2 Success Criteria:**
- [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum) - 4.5:1 text, 3:1 UI
- [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/quickref/#keyboard) - All functionality keyboard accessible
- [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/quickref/#focus-visible) - Focus indicators visible
- [2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/quickref/#target-size-enhanced) - 44×44px touch targets
- [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/quickref/#name-role-value) - ARIA attributes correct

**Radix UI Documentation:**
- [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

**Existing Codebase Patterns:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/navbar/quokka-points-badge.tsx` - Popover a11y
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/global-nav-bar.tsx` - Icon button a11y, sr-only patterns
- `/Users/dgz/projects-professional/quokka/quokka-demo/app/globals.css` - QDS focus-visible styles, sr-only class

---

**Analysis Complete.** Ready for implementation plan.

# Accessibility Implementation Plan: ProfileSettingsDropdown

**Created:** 2025-10-14
**Component:** ProfileSettingsDropdown
**Target:** WCAG 2.2 Level AA compliance
**Reference:** `doccloud/tasks/profile-settings-dropdown/research/a11y-requirements.md`

---

## Implementation Priority Order

1. **Critical:** ARIA attributes for tabs (blocking screen reader access)
2. **Critical:** Keyboard navigation handlers (blocking keyboard-only users)
3. **High:** Focus management (significant UX barrier)
4. **High:** Touch target sizing (mobile accessibility)
5. **Medium:** Focus indicators (visible but QDS defaults may suffice)
6. **Medium:** Screen reader-only text enhancements

---

## File: `components/navbar/profile-settings-dropdown.tsx`

### Overview

New component implementing tabbed Profile and Settings sections within a Radix UI Popover. Tabs use manual ARIA attributes and keyboard handling following WAI-ARIA Tabs Pattern.

---

## Implementation Steps

### Step 1: Component Structure with ARIA Roles

**Priority:** Critical

#### Current State
Component does not exist yet.

#### Required Changes

**1.1 Popover Container (Radix UI)**

Use existing Radix UI Popover primitives (built-in a11y):

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "min-h-[44px] min-w-[44px] h-11 w-11",
        "focus-visible:ring-4 focus-visible:ring-accent/60"
      )}
      aria-label="Account menu"
    >
      <User className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Account</span>
    </Button>
  </PopoverTrigger>

  <PopoverContent className="w-80 glass-panel p-0" align="end" sideOffset={8}>
    {/* Tab interface goes here */}
  </PopoverContent>
</Popover>
```

**ARIA Attributes:**
- `aria-label="Account menu"` on trigger button
- `aria-hidden="true"` on User icon (decorative)
- `sr-only` text for screen reader announcement
- Radix auto-adds `aria-haspopup`, `aria-expanded`, `role="dialog"`

**Touch Target:**
- `min-h-[44px] min-w-[44px]` ensures 44×44px minimum

**Focus Indicator:**
- `focus-visible:ring-4 focus-visible:ring-accent/60` uses QDS focus style

---

**1.2 Tab List with ARIA Roles**

```tsx
const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
const profileTabRef = useRef<HTMLButtonElement>(null);
const settingsTabRef = useRef<HTMLButtonElement>(null);

<div className="border-b border-border">
  <div
    role="tablist"
    aria-label="Profile and Settings"
    className="flex gap-0"
  >
    <button
      ref={profileTabRef}
      role="tab"
      id="tab-profile"
      aria-selected={activeTab === "profile"}
      aria-controls="panel-profile"
      tabIndex={activeTab === "profile" ? 0 : -1}
      onClick={() => setActiveTab("profile")}
      onKeyDown={handleTabKeyDown}
      className={cn(
        "flex-1 min-h-[44px] px-4 py-3",
        "text-sm font-medium transition-all duration-200",
        "border-b-2 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none",
        activeTab === "profile"
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      Profile
    </button>

    <button
      ref={settingsTabRef}
      role="tab"
      id="tab-settings"
      aria-selected={activeTab === "settings"}
      aria-controls="panel-settings"
      tabIndex={activeTab === "settings" ? 0 : -1}
      onClick={() => setActiveTab("settings")}
      onKeyDown={handleTabKeyDown}
      className={cn(
        "flex-1 min-h-[44px] px-4 py-3",
        "text-sm font-medium transition-all duration-200",
        "border-b-2 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none",
        activeTab === "settings"
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      Settings
    </button>
  </div>
</div>
```

**ARIA Attributes:**
- `role="tablist"` on container
- `aria-label="Profile and Settings"` labels tab list
- `role="tab"` on each tab button
- `aria-selected="true|false"` indicates active tab
- `aria-controls` links tab to panel (e.g., `tab-profile` → `panel-profile`)
- `tabIndex={0|-1}` - Only active tab is in tab order

**Visual States:**
- Selected: `border-primary text-foreground` (bottom border + dark text)
- Unselected: `text-muted-foreground` (lighter text, no border)
- Hover: `hover:text-foreground hover:border-border`

**Touch Targets:**
- `min-h-[44px]` ensures 44px minimum height
- `flex-1` splits width evenly (likely >44px wide each)

**Focus Indicators:**
- `focus-visible:ring-2 focus-visible:ring-accent/60` uses QDS focus ring
- `focus-visible:outline-none` removes default outline (QDS ring replaces it)

---

**1.3 Tab Panels with ARIA Roles**

**Profile Panel:**

```tsx
<div
  role="tabpanel"
  id="panel-profile"
  aria-labelledby="tab-profile"
  hidden={activeTab !== "profile"}
  className="p-4 space-y-4"
>
  {/* Profile content */}
  <div className="space-y-1">
    <p className="text-sm font-medium leading-none">{user.name}</p>
    <p className="text-xs text-muted-foreground">{user.email}</p>
    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
  </div>

  {/* Optional: Quokka Points Summary */}
  {quokkaPoints && (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
      <span className="text-lg" aria-hidden="true">🦘</span>
      <div>
        <p className="text-sm font-semibold text-primary">
          {quokkaPoints.totalPoints.toLocaleString()} Points
        </p>
        <p className="text-xs text-muted-foreground">
          +{quokkaPoints.weeklyPoints} this week
        </p>
      </div>
    </div>
  )}

  {/* Dashboard Link */}
  <Link
    href="/dashboard"
    className={cn(
      "flex items-center gap-2 min-h-[44px] px-3 py-2",
      "rounded-md text-sm font-medium",
      "transition-colors duration-200",
      "hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
    )}
  >
    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
    Go to Dashboard
  </Link>
</div>
```

**ARIA Attributes:**
- `role="tabpanel"` on container
- `id="panel-profile"` matches `aria-controls` on tab
- `aria-labelledby="tab-profile"` links panel to tab
- `hidden={true|false}` toggles panel visibility (better than CSS for SR)
- `aria-hidden="true"` on decorative icons (🦘, LayoutDashboard)

**Touch Targets:**
- Dashboard link: `min-h-[44px]` ensures 44px height

**Focus Indicators:**
- Dashboard link uses QDS focus-visible ring

**Settings Panel:**

```tsx
<div
  role="tabpanel"
  id="panel-settings"
  aria-labelledby="tab-settings"
  hidden={activeTab !== "settings"}
  className="p-4 space-y-3"
>
  {/* Settings Options */}
  <div className="space-y-2">
    <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
      <span className="text-sm font-medium">Email Notifications</span>
      <input
        type="checkbox"
        defaultChecked
        className="h-5 w-5 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-label="Toggle email notifications"
      />
    </label>

    <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
      <span className="text-sm font-medium">Dark Mode</span>
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-label="Toggle dark mode"
      />
    </label>
  </div>

  {/* Link to Full Settings Page */}
  <Link
    href="/settings"
    className={cn(
      "flex items-center justify-between min-h-[44px] px-3 py-2",
      "rounded-md text-sm font-medium",
      "transition-colors duration-200",
      "hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
    )}
  >
    View All Settings
    <ChevronRight className="h-4 w-4" aria-hidden="true" />
  </Link>
</div>
```

**ARIA Attributes:**
- `role="tabpanel"` on container
- `aria-label="Toggle email notifications"` on checkbox (since label text is separate)
- `aria-hidden="true"` on ChevronRight icon

**Touch Targets:**
- Checkbox labels: `min-h-[44px]` ensures 44px height
- Full settings link: `min-h-[44px]`

**Focus Indicators:**
- Checkboxes use QDS focus-visible ring
- Link uses QDS focus-visible ring

---

### Step 2: Keyboard Navigation Handlers

**Priority:** Critical

#### Current State
No keyboard handlers exist.

#### Required Changes

**2.1 Arrow Key Navigation (Left/Right)**

```tsx
const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
  const tabs = [profileTabRef, settingsTabRef];
  const currentIndex = activeTab === "profile" ? 0 : 1;

  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = nextIndex === 0 ? "profile" : "settings";
      setActiveTab(nextTab);
      tabs[nextIndex].current?.focus();
      break;

    case "ArrowLeft":
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      const prevTab = prevIndex === 0 ? "profile" : "settings";
      setActiveTab(prevTab);
      tabs[prevIndex].current?.focus();
      break;

    case "Home":
      e.preventDefault();
      setActiveTab("profile");
      profileTabRef.current?.focus();
      break;

    case "End":
      e.preventDefault();
      setActiveTab("settings");
      settingsTabRef.current?.focus();
      break;
  }
};
```

**Keyboard Behavior:**
- `ArrowRight` → Next tab, wraps from Settings → Profile
- `ArrowLeft` → Previous tab, wraps from Profile → Settings
- `Home` → First tab (Profile)
- `End` → Last tab (Settings)
- `e.preventDefault()` prevents page scroll

**Focus Management:**
- `setActiveTab(...)` updates state (automatic activation)
- `tabs[index].current?.focus()` moves focus to new tab
- Automatic activation: Panel updates immediately (no Enter/Space needed)

**Test Scenario:**
1. Open popover (focus on Profile tab)
2. Press ArrowRight → Focus moves to Settings, panel changes
3. Press ArrowRight → Focus wraps to Profile, panel changes
4. Press ArrowLeft → Focus wraps to Settings, panel changes
5. Press Home → Focus moves to Profile
6. Press End → Focus moves to Settings

---

**2.2 Escape Key Handler (Close Popover)**

Radix UI Popover handles Escape key automatically:
- Pressing Escape closes popover
- Focus returns to trigger button

**No custom handler needed.**

---

**2.3 Tab Key Behavior (Move to Panel Content)**

Browser default Tab key behavior works correctly:
- From tab button, Tab moves to first focusable element in active panel
- From panel content, Tab cycles through interactive elements
- Radix Popover focus trap keeps focus within popover

**No custom handler needed.**

---

### Step 3: Focus Management

**Priority:** High

#### Current State
No focus management logic exists.

#### Required Changes

**3.1 Auto-Focus Active Tab on Popover Open**

Use Radix Popover `onOpenChange` callback:

```tsx
const [isOpen, setIsOpen] = useState(false);

<Popover open={isOpen} onOpenChange={setIsOpen}>
  {/* ... */}
</Popover>

// Effect to focus active tab when popover opens
useEffect(() => {
  if (isOpen) {
    if (activeTab === "profile") {
      profileTabRef.current?.focus();
    } else {
      settingsTabRef.current?.focus();
    }
  }
}, [isOpen, activeTab]);
```

**Behavior:**
- When popover opens (`isOpen` changes to `true`)
- Focus moves to active tab (Profile by default)
- Screen reader announces: "Profile, tab, selected, 1 of 2"

**Alternative (Simpler):**

Use Radix `PopoverContent` prop `onOpenAutoFocus`:

```tsx
<PopoverContent
  className="w-80 glass-panel p-0"
  align="end"
  sideOffset={8}
  onOpenAutoFocus={(e) => {
    e.preventDefault(); // Prevent Radix default (focuses first focusable)
    if (activeTab === "profile") {
      profileTabRef.current?.focus();
    } else {
      settingsTabRef.current?.focus();
    }
  }}
>
  {/* ... */}
</PopoverContent>
```

**Recommended approach:** Use `onOpenAutoFocus` (Radix-specific, cleaner).

---

**3.2 Focus Returns to Trigger on Close**

Radix Popover handles this automatically:
- On Escape or click outside, popover closes
- Focus returns to trigger button

**No custom handler needed.**

---

**3.3 TabIndex Management**

Tabs use `tabIndex` to control keyboard focus order:

```tsx
tabIndex={activeTab === "profile" ? 0 : -1}
```

- Active tab: `tabIndex={0}` (in tab order)
- Inactive tab: `tabIndex={-1}` (not in tab order, but focusable via JavaScript)

**This pattern is already in Step 1.2.** No additional changes needed.

---

### Step 4: Touch Target Sizing

**Priority:** High

#### Current State
Component does not exist yet.

#### Required Changes

**All touch targets MUST use `min-h-[44px]` or larger:**

| Element | Class | Size |
|---------|-------|------|
| User icon trigger | `min-h-[44px] min-w-[44px]` | 44×44px ✓ |
| Profile tab button | `min-h-[44px] px-4 py-3` | 44px height ✓ |
| Settings tab button | `min-h-[44px] px-4 py-3` | 44px height ✓ |
| Dashboard link | `min-h-[44px] px-3 py-2` | 44px height ✓ |
| Email notifications checkbox label | `min-h-[44px]` | 44px height ✓ |
| Dark mode checkbox label | `min-h-[44px]` | 44px height ✓ |
| View All Settings link | `min-h-[44px] px-3 py-2` | 44px height ✓ |

**Spacing between touch targets:**
- Tabs: `gap-0` (no gap, but visually distinct via borders)
- Settings options: `space-y-2` (8px vertical gap) ✓

**Test on mobile devices:**
- iPhone SE (375×667px)
- Small Android (360×640px)
- Verify tap targets are easily tappable

---

### Step 5: Focus Indicators

**Priority:** Medium (QDS defaults likely sufficient)

#### Current State
QDS globals.css provides default focus-visible styles:

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

#### Required Changes

**5.1 Tab Button Focus Indicators**

Use QDS focus-visible utility explicitly:

```tsx
className={cn(
  "focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
)}
```

**Why explicit?**
- Ensures focus ring is visible even if global styles conflict
- `focus-visible:outline-none` removes default outline (replaced by ring)

**Contrast verification:**
- Focus ring color: `--ring` (#2D6CDF, Clear Sky Blue)
- Background: `--popover` (#FFFFFF white)
- Ratio: ~4.9:1 ✓ (meets 3:1 UI component minimum)

---

**5.2 Link and Checkbox Focus Indicators**

Links and checkboxes inherit QDS focus-visible styles automatically. Add explicit classes for consistency:

```tsx
className="focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
```

---

**5.3 Visual Verification**

**Test focus indicators on:**
- User icon trigger button
- Profile tab (when focused)
- Settings tab (when focused)
- Dashboard link
- Email notifications checkbox
- Dark mode checkbox
- View All Settings link

**Verification steps:**
1. Press Tab to focus element
2. Verify visible ring around element
3. Measure ring contrast with DevTools (≥ 3:1 for UI components)
4. Test in light and dark modes

---

### Step 6: Screen Reader-Only Text Enhancements

**Priority:** Medium

#### Current State
No sr-only text exists yet.

#### Required Changes

**6.1 User Icon Trigger Button**

Already includes sr-only text:

```tsx
<span className="sr-only">Account</span>
```

**Alternative (more descriptive):**

```tsx
<span className="sr-only">Account menu</span>
```

**Recommendation:** Use "Account menu" to match `aria-label`.

---

**6.2 Tab Index Announcement (Optional)**

Add sr-only text to each tab to announce "1 of 2", "2 of 2":

```tsx
<button role="tab" {...}>
  Profile
  <span className="sr-only">1 of 2</span>
</button>

<button role="tab" {...}>
  Settings
  <span className="sr-only">2 of 2</span>
</button>
```

**Rationale:**
- Helps screen reader users understand tab count
- Common pattern in accessible tab interfaces

**Testing:**
- Verify screen reader announces: "Profile, tab, selected, 1 of 2"
- If redundant (ARIA role already announces tab count), remove

**Recommendation:** Add initially, remove if testing shows redundancy.

---

**6.3 Decorative Icon Hiding**

Use `aria-hidden="true"` on all decorative icons:

```tsx
<User className="h-5 w-5" aria-hidden="true" />
<LayoutDashboard className="h-4 w-4" aria-hidden="true" />
<ChevronRight className="h-4 w-4" aria-hidden="true" />
<span className="text-lg" aria-hidden="true">🦘</span>
```

**Rationale:**
- Icons are decorative (adjacent text provides meaning)
- Prevents screen readers from announcing "image" or icon names

---

### Step 7: Color Contrast Verification

**Priority:** Medium (verify after implementation)

#### Current State
QDS tokens meet WCAG AA standards (per research doc).

#### Required Changes

**7.1 Manual Contrast Testing**

After implementation, verify contrast ratios with Chrome DevTools:

**Light Mode:**
- Tab (unselected): `text-muted-foreground` (#625C52) on `--popover` (#FFFFFF) → ~6.5:1 ✓
- Tab (selected): `text-foreground` (#2A2721) on `--popover` (#FFFFFF) → ~13:1 ✓
- User name: `text-foreground` (#2A2721) on `--popover` (#FFFFFF) → ~13:1 ✓
- User email: `text-muted-foreground` (#625C52) on `--popover` (#FFFFFF) → ~6.5:1 ✓
- Dashboard link: `text-foreground` (#2A2721) on hover `bg-accent/10` → Verify ✓

**Dark Mode:**
- Tab (unselected): `text-muted-foreground` (#B8AEA3) on `--popover` (#171511) → ~7.2:1 ✓
- Tab (selected): `text-foreground` (#F3EFE8) on `--popover` (#171511) → ~12:1 ✓
- Focus ring: `--ring` (#86A9F6) on `--popover` (#171511) → ~6.8:1 ✓

**Test with:**
- Chrome DevTools > Inspect > Accessibility panel > Contrast section
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

**Action if failures:**
- Replace with higher contrast QDS token
- Never use hardcoded hex colors

---

**7.2 Automated Contrast Testing**

Run axe DevTools after implementation:

```bash
# Open component in browser
npm run dev

# Open DevTools > axe DevTools > Scan
# Look for "Color Contrast" violations
```

Expected result: 0 violations.

---

### Step 8: Testing Checklist

**Priority:** Critical (before marking task complete)

#### Manual Keyboard Testing

- [ ] Tab to User icon button → Focus visible
- [ ] Enter to open popover → Focus moves to Profile tab
- [ ] ArrowRight → Focus moves to Settings tab, panel changes
- [ ] ArrowLeft → Focus wraps to Profile tab, panel changes
- [ ] Home → Focus moves to Profile tab
- [ ] End → Focus moves to Settings tab
- [ ] Tab from tab button → Focus moves to first element in panel (Dashboard link or checkbox)
- [ ] Shift+Tab from tab button → Focus moves back (likely closes popover)
- [ ] Escape → Popover closes, focus returns to User icon button
- [ ] Click outside popover → Popover closes

#### Screen Reader Testing (NVDA/JAWS/VoiceOver)

- [ ] User icon button announced as "Account menu, button"
- [ ] Popover opens → "Account menu, dialog"
- [ ] Profile tab announced as "Profile, tab, selected, 1 of 2"
- [ ] Settings tab announced as "Settings, tab, selected, 2 of 2"
- [ ] User name, email, role read correctly
- [ ] Dashboard link announced as "Go to Dashboard, link"
- [ ] Email notifications checkbox announced as "Email notifications, checkbox, checked"
- [ ] Dark mode checkbox announced as "Dark mode, checkbox, not checked"
- [ ] View All Settings link announced as "View All Settings, link"

#### Automated Testing

- [ ] Run axe DevTools → 0 violations
- [ ] Run Lighthouse → Accessibility score 100/100
- [ ] Run WAVE → 0 errors

#### Visual Testing

- [ ] All touch targets ≥ 44×44px (inspect with DevTools)
- [ ] Focus indicators visible on all interactive elements
- [ ] Focus ring contrast ≥ 3:1 (DevTools contrast checker)
- [ ] Tab selected state visually distinct (border-primary bottom border)
- [ ] Tab hover state visible (text-foreground, border-border)
- [ ] Light mode contrast ≥ 4.5:1 for text
- [ ] Dark mode contrast ≥ 4.5:1 for text

#### Responsive Testing

- [ ] 360px mobile → Touch targets still 44px, layout readable
- [ ] 768px tablet → Layout responsive
- [ ] 1024px desktop → Full experience
- [ ] 1280px+ wide → No breaking

---

## Summary of Implementation Steps

### File: `components/navbar/profile-settings-dropdown.tsx`

**Step 1: Component Structure**
- [ ] Add Radix Popover with trigger button (aria-label, min-h-[44px])
- [ ] Add tab list container (role="tablist", aria-label)
- [ ] Add Profile tab button (role="tab", aria-selected, aria-controls, tabIndex)
- [ ] Add Settings tab button (role="tab", aria-selected, aria-controls, tabIndex)
- [ ] Add Profile panel (role="tabpanel", aria-labelledby, hidden)
- [ ] Add Settings panel (role="tabpanel", aria-labelledby, hidden)
- [ ] Add Dashboard link with min-h-[44px]
- [ ] Add settings checkboxes with min-h-[44px] labels

**Step 2: Keyboard Handlers**
- [ ] Implement handleTabKeyDown (ArrowLeft, ArrowRight, Home, End)
- [ ] Attach onKeyDown to tab buttons

**Step 3: Focus Management**
- [ ] Add useRef for profileTabRef, settingsTabRef
- [ ] Add onOpenAutoFocus to PopoverContent (focus active tab)
- [ ] Verify tabIndex switching on active/inactive tabs

**Step 4: Touch Targets**
- [ ] Verify all interactive elements use min-h-[44px]
- [ ] Verify gap-2 or space-y-2 between touch targets

**Step 5: Focus Indicators**
- [ ] Add focus-visible:ring-2 focus-visible:ring-accent/60 to all interactive elements
- [ ] Add focus-visible:outline-none to remove default outline

**Step 6: Screen Reader Text**
- [ ] Add sr-only "Account menu" to trigger
- [ ] Add sr-only "1 of 2" / "2 of 2" to tabs (optional, test first)
- [ ] Add aria-hidden="true" to all decorative icons

**Step 7: Contrast Verification**
- [ ] Test all text contrast with DevTools (≥ 4.5:1)
- [ ] Test focus ring contrast with DevTools (≥ 3:1)
- [ ] Test in light and dark modes

**Step 8: Testing**
- [ ] Run full manual keyboard test checklist
- [ ] Run screen reader test checklist (NVDA, VoiceOver)
- [ ] Run automated tests (axe, Lighthouse, WAVE)
- [ ] Run visual tests (touch targets, focus indicators, contrast)
- [ ] Run responsive tests (360px, 768px, 1024px, 1280px)

---

## Code Review Checklist

Before marking task complete, verify:

- [ ] All ARIA attributes present and correct
- [ ] Keyboard navigation works completely without mouse
- [ ] Focus management works (auto-focus tab on open, return focus on close)
- [ ] Touch targets ≥ 44×44px
- [ ] Focus indicators visible with ≥ 3:1 contrast
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI
- [ ] Screen reader testing passes on NVDA, JAWS, VoiceOver
- [ ] Automated tests pass (axe, Lighthouse, WAVE)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Light and dark modes both accessible
- [ ] No hardcoded colors (QDS tokens only)
- [ ] Semantic HTML used throughout
- [ ] No ARIA attribute errors or warnings

---

## Known Edge Cases

### Edge Case 1: Focus on Close via Click Outside
**Scenario:** User clicks outside popover to close.
**Expected:** Focus moves to clicked element (Radix default).
**Actual:** Radix handles this correctly.
**Action:** No fix needed, but verify in testing.

### Edge Case 2: Tab Key from Last Panel Element
**Scenario:** User tabs from last settings checkbox.
**Expected:** Focus moves to next focusable element (likely wraps to tabs or closes popover).
**Actual:** Radix focus trap cycles within popover.
**Action:** Verify Tab wraps to tabs, Shift+Tab wraps back to last element.

### Edge Case 3: Mobile Popover Width
**Scenario:** Popover width (w-80 = 320px) may be too wide on 360px screens.
**Expected:** Popover fits within viewport.
**Actual:** May overflow or require horizontal scroll.
**Action:** Test on 360px device, reduce to w-72 (288px) if needed.

### Edge Case 4: Arrow Key Focus Without Activation
**Scenario:** User expects arrow keys to move focus without activating tab (manual activation).
**Expected:** Arrow keys activate tabs automatically (automatic activation design decision).
**Actual:** Matches design decision.
**Action:** No change needed (automatic activation chosen in research).

---

## Implementation Notes

**Estimated Effort:** 4-6 hours
- Component structure: 2 hours
- Keyboard handlers: 1 hour
- Focus management: 1 hour
- Testing and verification: 2 hours

**Dependencies:**
- Radix UI Popover (already installed)
- Radix UI Button (already installed)
- Next.js Link component (already installed)
- QDS globals.css (already configured)

**Risks:**
- Arrow key wrapping logic may have off-by-one errors (test exhaustively)
- Screen reader announcements may differ across NVDA/JAWS/VoiceOver (test all three)
- Focus trap may conflict with tab keyboard handling (test Tab key behavior)

**Mitigation:**
- Write unit tests for arrow key logic (optional, if time permits)
- Test on real devices, not just browser DevTools
- Get user feedback from keyboard-only and screen reader users

---

**Implementation plan complete.** Ready for development.

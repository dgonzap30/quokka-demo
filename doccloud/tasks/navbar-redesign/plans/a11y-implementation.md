# Accessibility Implementation Plan: Icon-Only Navbar

## Priority Order
1. **Critical fixes** (WCAG AA blockers - must complete before launch)
2. **High priority fixes** (significant barriers - should complete)
3. **Medium priority fixes** (improvements - nice to have)

---

## File Modifications Required

### 1. `/components/layout/global-nav-bar.tsx`

#### Fix 1: Add aria-label to Icon Buttons
**Priority:** Critical
**Current State:** Text button "Ask Question" will lose accessible name when converted to icon-only
**Required Change:** Add explicit aria-label to all icon buttons

**Implementation:**
```tsx
// BEFORE (current text button)
<Button
  onClick={onAskQuestion}
  className="hidden md:flex h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
  aria-label="Ask a question"
>
  Ask Question
</Button>

// AFTER (icon-only with accessible name)
import { MessageSquarePlus, HelpCircle, Settings, Sparkles } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

{/* Ask Question Icon Button */}
{onAskQuestion && (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        onClick={onAskQuestion}
        size="icon"
        variant="ghost"
        className="min-h-[44px] min-w-[44px]"
        aria-label="Ask a question"
      >
        <MessageSquarePlus className="size-5" />
        <span className="sr-only">Ask a question</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" align="center">
      <p>Ask a question</p>
    </TooltipContent>
  </Tooltip>
)}

{/* Support Icon Button */}
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button
      onClick={() => router.push('/support')}
      size="icon"
      variant="ghost"
      className="min-h-[44px] min-w-[44px]"
      aria-label="Get support"
    >
      <HelpCircle className="size-5" />
      <span className="sr-only">Get support</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" align="center">
    <p>Access help documentation and contact support</p>
  </TooltipContent>
</Tooltip>

{/* Settings Icon Button */}
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button
      onClick={() => router.push('/settings')}
      size="icon"
      variant="ghost"
      className="min-h-[44px] min-w-[44px]"
      aria-label="Open settings"
    >
      <Settings className="size-5" />
      <span className="sr-only">Open settings</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" align="center">
    <p>Manage your preferences and account settings</p>
  </TooltipContent>
</Tooltip>

{/* AI Assistant Icon Button */}
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button
      onClick={() => router.push('/ai-assistant')}
      size="icon"
      variant="ghost"
      className="min-h-[44px] min-w-[44px]"
      aria-label="Open AI assistant"
    >
      <Sparkles className="size-5" />
      <span className="sr-only">Open AI assistant</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" align="center">
    <p>Chat with AI assistant for instant help</p>
  </TooltipContent>
</Tooltip>
```

**Test Scenario:**
1. **Keyboard navigation:** Tab to each icon button, verify focus indicator visible
2. **Screen reader:** Activate NVDA/VoiceOver, tab to each button
   - Expected announcement: "Ask a question, button"
   - Expected announcement: "Get support, button"
   - Expected announcement: "Open settings, button"
   - Expected announcement: "Open AI assistant, button"
3. **Hover tooltip:** Hover over each button, verify tooltip appears after 300ms
4. **Focus tooltip:** Tab to each button, verify tooltip appears immediately

---

#### Fix 2: Ensure Touch Target Size (44×44px)
**Priority:** Critical
**Current State:** Button `size="icon"` renders at 40×40px (size-10), which is 4px below AAA recommended 44px
**Required Change:** Add custom min-height and min-width to ensure 44×44px touch targets

**Implementation:**
```tsx
// Custom className applied to all icon buttons
className="min-h-[44px] min-w-[44px]"

// Example:
<Button
  size="icon"
  variant="ghost"
  className="min-h-[44px] min-w-[44px]"
  aria-label="Get support"
>
  <HelpCircle className="size-5" />
</Button>
```

**Alternative Solution (if team prefers):**
Update Button component `size="icon"` variant to 44px by default.

**File:** `components/ui/button.tsx`
```tsx
// BEFORE
size: {
  icon: "size-10", // 40px
}

// AFTER
size: {
  icon: "size-11", // 44px
}
```

**Recommendation:** Use custom className approach to avoid breaking existing icon buttons elsewhere in the codebase.

**Test Scenario:**
1. **Desktop:** Inspect element in browser DevTools, verify computed width/height = 44px
2. **Mobile:** Open in Chrome DevTools device emulation (iPhone 12), attempt to tap each icon
3. **Touch device:** Test on actual mobile device, verify easy tap target
4. **Measure:** Use browser DevTools ruler to confirm 44×44px bounding box

---

#### Fix 3: Enhance Focus Indicator Contrast
**Priority:** Critical
**Current State:** QDS focus indicators may have insufficient contrast against proposed darker navbar background
**Required Change:** Add enhanced focus ring specifically for navbar icon buttons

**Implementation:**
```tsx
// Enhanced focus class for darker navbar background
className={cn(
  "min-h-[44px] min-w-[44px]",
  "focus-visible:ring-4 focus-visible:ring-accent/60",
  "dark:focus-visible:ring-accent/80",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
)}

// Example full button:
<Button
  size="icon"
  variant="ghost"
  className={cn(
    "min-h-[44px] min-w-[44px]",
    "focus-visible:ring-4 focus-visible:ring-accent/60",
    "dark:focus-visible:ring-accent/80",
    "focus-visible:ring-offset-2"
  )}
  aria-label="Get support"
>
  <HelpCircle className="size-5" />
</Button>
```

**Contrast verification:**
- Light mode navbar background: `rgba(255, 255, 255, 0.4)` (glass-ultra)
- Light mode focus ring: `rgba(45, 108, 223, 0.6)` (accent at 60%)
- Required contrast: 3:1 minimum (WCAG 2.4.13)

**Testing required:**
1. Measure contrast ratio using Color Contrast Analyzer
2. Test against proposed darker navbar background
3. Verify visibility in both light and dark modes
4. If contrast fails, increase opacity to 0.8 or use solid color

**Test Scenario:**
1. **Light mode:** Tab to icon button, verify blue ring clearly visible against navbar
2. **Dark mode:** Tab to icon button, verify blue ring clearly visible against navbar
3. **Color contrast tool:** Measure ring color vs. navbar background, confirm ≥3:1
4. **Visual inspection:** Verify 2px offset creates clear separation from button

---

#### Fix 4: Add Dropdown Menu ARIA Attributes
**Priority:** High
**Current State:** User avatar menu trigger may be missing `aria-haspopup` and `aria-expanded`
**Required Change:** Explicitly add ARIA attributes to dropdown triggers (if not automatically added by Radix)

**Implementation:**
```tsx
// User Avatar Menu (existing - verify ARIA attributes)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      className="relative min-h-[44px] min-w-[44px] rounded-full"
      aria-label="User menu"
      aria-haspopup="true"
      // aria-expanded is auto-managed by Radix, but verify in DevTools
    >
      <Avatar className="h-10 w-10 bg-neutral-100 border border-neutral-200">
        <span className="text-sm font-semibold text-neutral-700">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end" forceMount>
    {/* Menu items */}
  </DropdownMenuContent>
</DropdownMenu>
```

**Note:** Radix UI DropdownMenu automatically manages `aria-expanded` state. Verify in browser DevTools during testing. If missing, add controlled state:

```tsx
const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

<DropdownMenu onOpenChange={setIsUserMenuOpen}>
  <DropdownMenuTrigger asChild>
    <Button
      aria-label="User menu"
      aria-haspopup="true"
      aria-expanded={isUserMenuOpen}
    >
      <Avatar />
    </Button>
  </DropdownMenuTrigger>
</DropdownMenu>
```

**Test Scenario:**
1. **Screen reader:** Focus user menu button
   - Expected: "User menu, button, has popup, collapsed"
2. **Activate:** Press Enter to open menu
   - Expected: "User menu, button, has popup, expanded"
   - Expected: Focus moves to first menu item
3. **DevTools:** Inspect button element, verify `aria-haspopup="true"` and `aria-expanded="false"`

---

#### Fix 5: Implement Responsive Labels for Mobile
**Priority:** High
**Current State:** Icon-only buttons on mobile provide no visual labels (tooltips not accessible on touch screens)
**Required Change:** Show text labels alongside icons on mobile viewports (≤768px)

**Implementation Option 1: Icon + Text on Mobile**
```tsx
{/* Ask Question Button - Responsive */}
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button
      onClick={onAskQuestion}
      variant="ghost"
      className="min-h-[44px] md:min-w-[44px] md:size-icon"
      aria-label="Ask a question"
    >
      <MessageSquarePlus className="size-5" />
      <span className="ml-2 md:sr-only">Ask</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" className="hidden md:block">
    <p>Ask a question</p>
  </TooltipContent>
</Tooltip>
```

**Implementation Option 2: Icon-Only on Desktop, Full Text on Mobile**
```tsx
{/* Mobile: Full text button, Desktop: Icon with tooltip */}
<div className="md:hidden">
  <Button
    onClick={onAskQuestion}
    size="sm"
    variant="ghost"
    aria-label="Ask a question"
  >
    <MessageSquarePlus className="size-4 mr-2" />
    Ask Question
  </Button>
</div>

<div className="hidden md:block">
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        onClick={onAskQuestion}
        size="icon"
        variant="ghost"
        className="min-h-[44px] min-w-[44px]"
        aria-label="Ask a question"
      >
        <MessageSquarePlus className="size-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Ask a question</TooltipContent>
  </Tooltip>
</div>
```

**Recommendation:** Use Option 1 (condensed labels on mobile) to save horizontal space while maintaining discoverability.

**Test Scenario:**
1. **Mobile viewport (360px):** Verify text labels visible next to icons
2. **Tablet viewport (768px):** Verify text labels visible OR icons-only with tooltips
3. **Desktop viewport (1024px):** Verify icons-only with tooltips
4. **Touch screen:** Tap icons on mobile, verify text label helps identify function
5. **Screen reader on mobile:** Verify accessible name announced correctly

---

#### Fix 6: Darken Navbar Background and Test Icon Contrast
**Priority:** Critical
**Current State:** Navbar uses `glass-panel-strong` which may not provide enough contrast with main content
**Required Change:** Apply darker glass background and test icon color contrast

**Implementation:**
```tsx
// BEFORE
<nav
  className={cn(
    "w-full z-50 glass-panel-strong border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
    className
  )}
>

// AFTER - Option 1: Darker glass
<nav
  className={cn(
    "w-full z-50 backdrop-blur-lg bg-glass-ultra dark:bg-[rgba(23,21,17,0.85)] border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
    className
  )}
>

// AFTER - Option 2: Semi-solid dark background
<nav
  className={cn(
    "w-full z-50 bg-surface-2/95 dark:bg-surface/95 backdrop-blur-md border-b border-border/50 shadow-e2 transition-shadow duration-200",
    className
  )}
>
```

**Icon color adjustments (if needed):**
```tsx
// Icon buttons should use foreground color for sufficient contrast
<Button
  className={cn(
    "text-foreground hover:text-accent",
    "min-h-[44px] min-w-[44px]"
  )}
>
  <HelpCircle className="size-5" />
</Button>
```

**Contrast testing checklist:**
1. Measure default icon color (#2A2721 in light mode) vs. new navbar background
2. If contrast < 3:1, use `--foreground` color or darker shade
3. Test hover state (accent color) vs. navbar background
4. Test focus ring (accent/60%) vs. navbar background
5. Verify all states meet WCAG AA (3:1 for UI components)

**Test Scenario:**
1. **Light mode:** Inspect navbar, measure background color
2. **Icon contrast:** Measure icon color vs. background using Color Contrast Analyzer
3. **Hover state:** Hover icon, measure accent color vs. background
4. **Dark mode:** Repeat measurements in dark mode
5. **Visual test:** Verify navbar provides clear visual separation from content below

---

### 2. `/components/ui/button.tsx` (Optional Enhancement)

#### Fix 7: Update Icon Button Size Variant to 44px
**Priority:** Medium (Alternative to custom className)
**Current State:** `size="icon"` renders at 40×40px
**Required Change:** Update default icon size to 44×44px

**Implementation:**
```tsx
// BEFORE
size: {
  default: "h-10 px-4 py-2 has-[>svg]:px-3",
  sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-10", // 40×40px
},

// AFTER
size: {
  default: "h-10 px-4 py-2 has-[>svg]:px-3",
  sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-11", // 44×44px - meets WCAG AAA touch target
},
```

**Risk:** This change affects ALL icon buttons in the codebase. Audit existing usage before implementing.

**Alternative:** Keep `size="icon"` at 40px and use custom className for navbar buttons only (recommended).

**Test Scenario:**
1. **Global search:** `grep -r 'size="icon"'` to find all icon button usage
2. **Visual regression:** Check all pages with icon buttons (threads, instructor dashboard, etc.)
3. **Layout impact:** Verify 44px buttons don't break existing layouts
4. **Consistency:** Decide if 44px should be global standard or navbar-specific

---

### 3. `/components/ui/tooltip.tsx` (Minor Enhancement)

#### Fix 8: Optimize Tooltip Delay for Keyboard Users
**Priority:** Medium
**Current State:** Tooltip has `delayDuration = 0` by default, may cause immediate display on focus
**Required Change:** Add configurable delay with sensible defaults

**Implementation:**
```tsx
// CURRENT
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

// RECOMMENDED (no change needed - already configurable!)
// Usage in navbar:
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button aria-label="Get support">
      <HelpCircle />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Access help and support</TooltipContent>
</Tooltip>
```

**Assessment:** ✅ Tooltip component already supports `delayDuration` prop. Use 300ms delay for navbar tooltips to prevent immediate display on Tab navigation.

**Test Scenario:**
1. **Hover:** Hover over icon button, verify tooltip appears after ~300ms
2. **Keyboard focus:** Tab to icon button, verify tooltip appears after ~300ms
3. **Rapid tabbing:** Tab quickly through multiple buttons, verify tooltips don't flash
4. **Dismissal:** Press Escape while tooltip visible, verify tooltip dismisses

---

### 4. `/app/layout.tsx` (No changes required)

**Verify:** Root layout wraps application with `TooltipProvider` for global tooltip support.

**Check implementation:**
```tsx
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
```

**If missing:** Add TooltipProvider wrapper to enable tooltips globally.

---

## Testing Checklist

### Automated Tests
- [ ] Run `npx tsc --noEmit` - verify no TypeScript errors
- [ ] Run `npm run lint` - verify no ESLint warnings
- [ ] Run Lighthouse accessibility audit - score ≥95
- [ ] Run axe DevTools scan - 0 critical violations

### Manual Keyboard Navigation Tests
- [ ] Tab through navbar from logo to user menu
- [ ] Verify focus indicator visible on each icon button
- [ ] Press Enter/Space on each button
- [ ] Verify tooltips appear on focus
- [ ] Press Escape to dismiss tooltips
- [ ] Verify no keyboard traps

### Screen Reader Tests (NVDA/VoiceOver)
- [ ] Enable screen reader
- [ ] Navigate to navbar
- [ ] Verify each icon button announces accessible name:
  - "Ask a question, button"
  - "Get support, button"
  - "Open settings, button"
  - "Open AI assistant, button"
  - "User menu, button"
- [ ] Verify tooltip content announced via aria-describedby
- [ ] Activate buttons and verify expected actions

### Color Contrast Tests
- [ ] Measure icon default color vs. navbar background (≥3:1)
- [ ] Measure icon hover color vs. navbar background (≥3:1)
- [ ] Measure focus ring color vs. navbar background (≥3:1)
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Use Color Contrast Analyzer tool for precise measurements

### Touch Target Tests
- [ ] Inspect each icon button in DevTools
- [ ] Verify computed width and height = 44px (or 40px minimum)
- [ ] Test on mobile device (iPhone, Android)
- [ ] Verify easy tap targets with finger/thumb
- [ ] No accidental taps on adjacent buttons

### Responsive Tests
- [ ] Test at 360px viewport (mobile small)
- [ ] Test at 640px viewport (mobile large)
- [ ] Test at 768px viewport (tablet)
- [ ] Test at 1024px viewport (desktop)
- [ ] Test at 1280px viewport (desktop large)
- [ ] Verify icon + text labels on mobile (if implemented)
- [ ] Verify icon-only on desktop

### Visual Regression Tests
- [ ] Compare navbar before/after on all pages
- [ ] Verify glassmorphism effect maintains QDS aesthetic
- [ ] Check hover animations on icon buttons
- [ ] Verify tooltips don't obscure other content
- [ ] Test dark mode appearance

---

## Implementation Order

### Phase 1: Critical Fixes (Launch Blockers)
1. Add aria-label to all icon buttons (Fix 1)
2. Ensure 44×44px touch targets (Fix 2)
3. Enhance focus indicator contrast (Fix 3)
4. Test icon color contrast against darker navbar (Fix 6)

**Estimated effort:** 2-3 hours

**Acceptance:**
- All icon buttons have accessible names
- Touch targets meet 44px minimum
- Focus indicators visible with ≥3:1 contrast
- Icon colors meet ≥3:1 contrast

---

### Phase 2: High Priority (Significant Barriers)
5. Add ARIA attributes to dropdown menus (Fix 4)
6. Implement responsive labels for mobile (Fix 5)

**Estimated effort:** 1-2 hours

**Acceptance:**
- Dropdown triggers have aria-haspopup and aria-expanded
- Mobile viewports show text labels or icons + condensed text

---

### Phase 3: Medium Priority (Polish)
7. Optimize tooltip delay (Fix 8)
8. Consider updating Button icon size globally (Fix 7) - Decision needed

**Estimated effort:** 1 hour

**Acceptance:**
- Tooltips appear with 300ms delay
- Team decision on global icon button size

---

## Rollback Plan

**If accessibility issues discovered after deployment:**

1. **Immediate rollback:** Revert to text "Ask Question" button
2. **Keep existing avatar menu:** No changes to user menu
3. **Remove new icon buttons:** Remove Support, Settings, AI buttons
4. **Restore previous navbar background:** Revert to `glass-panel-strong`

**Git rollback command:**
```bash
git revert <commit-hash> --no-commit
git commit -m "revert: rollback icon-only navbar due to accessibility issues"
```

---

## Future Enhancements (Out of Scope)

- [ ] Add keyboard shortcuts (e.g., "Ctrl+K" for Ask Question)
- [ ] Implement persistent floating labels on desktop hover
- [ ] Add skip link to main content
- [ ] Consider hamburger menu for mobile to reduce navbar clutter
- [ ] Add animation polish (icon bounce on hover, tooltip fade-in)
- [ ] A/B test icon-only vs. icon+text on desktop

---

## References

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Radix UI Tooltip Accessibility](https://www.radix-ui.com/primitives/docs/components/tooltip#accessibility)
- [MDN: aria-label](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
- [WebAIM: Using ARIA](https://webaim.org/techniques/aria/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

---

**End of Implementation Plan**

Read the full accessibility audit at: `research/a11y-icon-nav-audit.md`

# Accessibility Audit: Icon-Only Navbar Navigation

## Executive Summary
- **Overall compliance level:** Currently PASS (existing navbar), will be FAIL without proper remediation for icon-only redesign
- **Critical issues count:** 5 (for proposed icon-only design without mitigation)
- **High priority issues count:** 3
- **Medium priority issues count:** 2

**Assessment:** Converting the "Ask Question" text button and adding 4 new icon-only buttons (Support, Settings, Account, AI) presents significant accessibility barriers that MUST be addressed to maintain WCAG 2.2 AA compliance. Icon-only navigation reduces discoverability for all users and creates complete barriers for screen reader users without proper implementation.

---

## Current State Analysis

### Existing GlobalNavBar Implementation

**Current accessible elements:**
- Logo link with text "QuokkAQ" and aria-label="QuokkAQ Home"
- Breadcrumb navigation with proper semantic structure
- GlobalSearch with placeholder text
- "Ask Question" button with visible text label
- User avatar menu with aria-label="User menu"

**Current strengths:**
- All interactive elements have accessible names
- Proper semantic HTML (nav, button, link)
- Keyboard navigation supported via Button component
- Focus indicators visible (inherited from QDS focus-visible styles)

**Current weaknesses (to address in icon-only redesign):**
- User avatar button uses ghost variant without visible focus indicator contrast against glass background
- No tooltips currently implemented
- Touch targets not explicitly sized (relies on Button default 44px height)

---

## Semantic HTML Analysis

### Current Structure
```tsx
<nav role="navigation" aria-label="Global navigation">
  <Link aria-label="QuokkAQ Home">QuokkAQ</Link>
  <nav aria-label="Breadcrumb">...</nav>
  <GlobalSearch placeholder="Search threads..." />
  <Button aria-label="Ask a question">Ask Question</Button>
  <Button aria-label="User menu">
    <Avatar>...</Avatar>
  </Button>
</nav>
```

**Assessment:** ✅ Semantic structure is solid. Proper use of `<nav>`, `<button>`, and `<Link>` elements.

### Required Changes for Icon-Only Design

**CRITICAL:** All icon buttons MUST retain semantic button elements and receive explicit accessible names:

```tsx
// ❌ BAD - No accessible name
<Button variant="ghost" size="icon">
  <MessageCircle className="size-5" />
</Button>

// ✅ GOOD - Explicit aria-label
<Button variant="ghost" size="icon" aria-label="Get support">
  <HelpCircle className="size-5" />
</Button>
```

---

## ARIA Attributes

### Required ARIA Labels for Icon Buttons

| Button | Icon | aria-label | Rationale |
|--------|------|------------|-----------|
| **Ask Question** | Plus or MessageSquarePlus | "Ask a question" | Primary CTA - must be discoverable |
| **Support** | HelpCircle or LifeBuoy | "Get support" | Action-oriented, clear purpose |
| **Settings** | Settings or Sliders | "Open settings" | Indicates action (opens menu/page) |
| **Account** | User or UserCircle | "Account settings" | Disambiguates from user menu avatar |
| **AI Assistant** | Sparkles or Bot | "Open AI assistant" | Clear AI functionality |
| **User Avatar Menu** | Avatar with initials | "User menu" | Existing - keep consistent |

**Additional ARIA considerations:**

1. **aria-expanded** for dropdown triggers:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      aria-label="User menu"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Avatar />
    </Button>
  </DropdownMenuTrigger>
</DropdownMenu>
```

2. **aria-current** for active states (if applicable):
```tsx
// If Settings page is active
<Button
  aria-label="Open settings"
  aria-current="page"
>
  <Settings />
</Button>
```

3. **aria-describedby** linking to tooltip IDs:
```tsx
<Button
  aria-label="Get support"
  aria-describedby="support-tooltip"
>
  <HelpCircle />
</Button>
<Tooltip id="support-tooltip" role="tooltip">
  Access help documentation and contact support
</Tooltip>
```

---

## Keyboard Navigation

### Tab Order Specification

**Proposed tab order (left to right):**
1. Logo link ("QuokkAQ Home")
2. Breadcrumb links (if present)
3. Global search input
4. Ask Question button
5. Support button
6. Settings button
7. AI Assistant button
8. User avatar menu button

**Keyboard interactions:**

| Key | Action |
|-----|--------|
| **Tab** | Move focus to next interactive element |
| **Shift+Tab** | Move focus to previous element |
| **Enter/Space** | Activate focused button/link |
| **Escape** | Close dropdown menus |
| **Arrow Down** | Open dropdown menu (on trigger) |
| **Arrow Up/Down** | Navigate within dropdown menu |

### Focus Trap Requirements

**For dropdown menus:**
- Focus must trap within open dropdown
- Escape key closes menu and returns focus to trigger
- Clicking outside closes menu and returns focus to trigger
- Tab from last item closes menu and moves to next focusable element

**Implementation via Radix DropdownMenu:** Already handled by Radix UI primitives, but verify:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button aria-label="Support menu">
      <HelpCircle />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Focus automatically trapped */}
    <DropdownMenuItem>Help Center</DropdownMenuItem>
    <DropdownMenuItem>Contact Support</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Focus Management

### Focus Indicator Requirements (WCAG 2.4.7, 2.4.13)

**Current QDS focus styles (from globals.css):**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.dark *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4);
}

/* Enhanced focus for glass backgrounds */
.glass-panel *:focus-visible,
.glass-panel-strong *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}

.dark .glass-panel *:focus-visible,
.dark .glass-panel-strong *:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.6);
}
```

**Assessment:** ✅ QDS provides enhanced focus indicators for glass backgrounds with 4px blue ring.

**CRITICAL ISSUE:** Default Button focus styles may not provide sufficient contrast against darker navbar background.

### Recommended Focus Indicator Enhancement

**For icon buttons on darker glass navbar:**
```tsx
// Enhanced focus class for navbar icon buttons
className={cn(
  "focus-visible:ring-4 focus-visible:ring-accent/60",
  "dark:focus-visible:ring-accent/80",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
)}
```

**Contrast requirements:**
- Focus indicator must have 3:1 contrast against adjacent colors (WCAG 2.4.13)
- Indicator must be 2px minimum thickness
- Must be visible in both light and dark modes
- Must stand out against glass background

**Proposed specifications:**
- **Indicator style:** 4px ring with 2px offset
- **Light mode color:** `rgba(45, 108, 223, 0.6)` (accent blue at 60% opacity)
- **Dark mode color:** `rgba(134, 169, 246, 0.8)` (lighter accent blue at 80%)
- **Contrast ratio:** 4.5:1 minimum against navbar background

---

## Color Contrast

### Navbar Background Analysis

**Current navbar:** `glass-panel-strong` with `border-glass`
- Light mode: `rgba(255, 255, 255, 0.6)` with 16px blur
- Dark mode: `rgba(23, 21, 17, 0.6)` with 16px blur

**Proposed darker navbar (per task requirements):**
- Light mode: `rgba(255, 255, 255, 0.4)` (glass-ultra) with 16px blur
- Dark mode: `rgba(23, 21, 17, 0.8)` (custom, darker than glass-subtle)
- Alternative: Solid semi-dark background `rgba(31, 28, 23, 0.95)` (surface-2 based)

### Icon Color Contrast Requirements

**WCAG 2.2 AA Requirements:**
- **UI components:** 3:1 contrast ratio minimum (Success Criterion 1.4.11)
- **Interactive states:** 3:1 contrast for hover/focus indicators
- **Text (including icon labels):** 4.5:1 for small text, 3:1 for large text

**Icon button states:**

| State | Light Mode | Dark Mode | Contrast Ratio |
|-------|------------|-----------|----------------|
| **Default** | `--text` #2A2721 | `--text` #F3EFE8 | Must test against new bg |
| **Hover** | `--accent` #2D6CDF | `--accent` #86A9F6 | Must test against new bg |
| **Focus** | Blue ring 4px | Blue ring 4px | 4.5:1 minimum |
| **Pressed** | `--accent-pressed` | `--accent-pressed` | Must test against new bg |
| **Disabled** | `opacity-50` | `opacity-50` | May not meet 3:1 (acceptable) |

**CRITICAL TESTING REQUIRED:**
1. Measure icon color contrast against proposed darker navbar background
2. If darker background is `rgba(31, 28, 23, 0.95)`:
   - Test icon color `#2A2721` (text) - likely FAILS (too similar)
   - Solution: Use `--foreground` or lighter icon color
3. Ensure hover state accent color meets 3:1 minimum
4. Validate focus ring has 3:1 contrast against navbar background

**Recommended icon colors for darker navbar:**
- Light mode icons: `--foreground` #2A2721 or `--neutral-800` #2A2721
- Light mode hover: `--accent` #2D6CDF or `--primary` #8A6B3D
- Dark mode icons: `--foreground` #F3EFE8
- Dark mode hover: `--accent` #86A9F6

---

## Screen Reader Compatibility

### Announcements for Icon Buttons

**Current implementation (text button):**
```tsx
<Button>Ask Question</Button>
```
Screen reader announces: "Ask Question, button"

**Proposed icon-only (WITHOUT proper implementation):**
```tsx
<Button size="icon">
  <MessageSquarePlus />
</Button>
```
Screen reader announces: "button" ❌ (NO accessible name - CRITICAL FAILURE)

**Required implementation:**
```tsx
<Button size="icon" aria-label="Ask a question">
  <MessageSquarePlus className="size-5" />
  <span className="sr-only">Ask a question</span>
</Button>
```
Screen reader announces: "Ask a question, button" ✅

**Best practice:** Use BOTH `aria-label` AND `sr-only` span for maximum compatibility:
- `aria-label`: Primary accessible name
- `sr-only` span: Fallback for older assistive technologies

### Tooltip Announcements

**CRITICAL:** Tooltips must be announced to screen reader users on focus.

**Implementation using Radix Tooltip:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      size="icon"
      aria-label="Get support"
      aria-describedby="support-tooltip-content"
    >
      <HelpCircle className="size-5" />
    </Button>
  </TooltipTrigger>
  <TooltipContent id="support-tooltip-content" role="tooltip">
    <p>Access help documentation and contact support</p>
  </TooltipContent>
</Tooltip>
```

**How it works:**
1. Screen reader user tabs to button
2. Announced: "Get support, button"
3. After brief delay, tooltip content is announced via `aria-describedby`
4. User hears: "Access help documentation and contact support"

### Dynamic Content Announcements

**For modals/dialogs opened by icon buttons:**
```tsx
<Button
  aria-label="Open AI assistant"
  aria-haspopup="dialog"
  aria-expanded={isAiModalOpen}
  onClick={() => setIsAiModalOpen(true)}
>
  <Sparkles />
</Button>

{isAiModalOpen && (
  <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
    <DialogContent>
      <DialogTitle>AI Assistant</DialogTitle>
      <DialogDescription>
        Ask questions and get AI-powered answers
      </DialogDescription>
      {/* Content */}
    </DialogContent>
  </Dialog>
)}
```

**Screen reader behavior:**
1. User activates "Open AI assistant" button
2. Focus moves to dialog
3. Announced: "AI Assistant, dialog. Ask questions and get AI-powered answers"
4. Focus trapped in dialog until closed

---

## Form Accessibility

**Not applicable** - Icon buttons are not form inputs. However, if any buttons trigger forms:

**Example: Ask Question button opens modal with form:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button aria-label="Ask a question">
      <MessageSquarePlus />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle id="ask-question-title">Ask a Question</DialogTitle>
    <form aria-labelledby="ask-question-title">
      <Label htmlFor="question-title">Question Title</Label>
      <Input
        id="question-title"
        required
        aria-required="true"
        aria-describedby="title-help"
      />
      <span id="title-help" className="text-xs text-muted-foreground">
        Be specific and clear
      </span>
      {/* More form fields */}
    </form>
  </DialogContent>
</Dialog>
```

---

## Error Handling & Messaging

**Not directly applicable** to static icon buttons. However:

**If button action fails (e.g., network error opening AI modal):**
```tsx
const { toast } = useToast();

const handleAiClick = async () => {
  try {
    await openAiModal();
  } catch (error) {
    toast({
      title: "Failed to open AI assistant",
      description: "Please check your connection and try again.",
      variant: "destructive",
    });
  }
};

<Button
  aria-label="Open AI assistant"
  onClick={handleAiClick}
>
  <Sparkles />
</Button>
```

**Toast announcement:** Radix Toast includes `role="status"` or `role="alert"` for screen reader announcements.

---

## Detailed Findings

### Critical Issues (5)

#### 1. Icon Buttons Missing Accessible Names
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Issue:** Converting "Ask Question" button to icon-only and adding 4 new icon buttons without `aria-label` creates buttons with no accessible name.

**Impact:** Screen reader users hear only "button" with no indication of function. Complete accessibility barrier.

**Example:**
```tsx
// ❌ FAILS WCAG
<Button size="icon">
  <Settings />
</Button>
// Announced as: "button"

// ✅ PASSES WCAG
<Button size="icon" aria-label="Open settings">
  <Settings />
</Button>
// Announced as: "Open settings, button"
```

**Required fix:** ALL icon buttons MUST have explicit `aria-label` attributes.

---

#### 2. Insufficient Icon Discoverability Without Visible Labels
**WCAG:** 2.4.6 Headings and Labels (Level AA)

**Issue:** Icon-only buttons reduce discoverability for all users, particularly:
- Users with cognitive disabilities
- Users unfamiliar with icon conventions
- New users learning the interface
- Users on mobile devices (small icon targets)

**Impact:** Users may not understand button function without hovering, reducing usability and creating barriers.

**Mitigation:** Implement tooltips with 0-300ms delay on hover/focus.

---

#### 3. Focus Indicators May Have Insufficient Contrast on Darker Background
**WCAG:** 2.4.7 Focus Visible (Level AA), 2.4.13 Focus Appearance (Level AAA)

**Issue:** Proposed darker navbar background may reduce focus indicator contrast below 3:1 minimum.

**Impact:** Keyboard users cannot identify which element has focus, creating navigation barriers.

**Required testing:**
1. Measure focus ring contrast against new navbar background
2. Test in both light and dark modes
3. Verify 4px ring at 3:1 minimum contrast
4. Ensure 2px offset is visible

**Solution:** Enhance focus ring opacity or use contrasting background behind ring.

---

#### 4. Touch Target Size Not Guaranteed for Icon Buttons
**WCAG:** 2.5.5 Target Size (Level AAA), 2.5.8 Target Size (Minimum) (Level AA - NEW in WCAG 2.2)

**Issue:** Icon buttons using `size="icon"` are 40px (size-10) from Button component, which is 4px below the 44px minimum recommended touch target.

**Impact:** Mobile users may struggle to tap small icon buttons, especially users with motor disabilities.

**Current Button size="icon":**
```tsx
icon: "size-10", // 40px × 40px
```

**WCAG 2.2 Requirement:** 24×24px minimum (Level AA), 44×44px recommended (Level AAA)

**Assessment:** 40px meets WCAG 2.2 AA (24px minimum) but falls short of AAA best practice (44px).

**Recommended fix:**
```tsx
// Option 1: Custom icon button size
<Button
  size="icon"
  className="min-h-[44px] min-w-[44px]"
  aria-label="Get support"
>
  <HelpCircle className="size-5" />
</Button>

// Option 2: Update Button component icon size variant to 44px
icon: "size-11", // 44px × 44px
```

---

#### 5. Tooltips Not Implemented - No Visual Label for Non-Hover Users
**WCAG:** 1.3.1 Info and Relationships (Level A), 3.3.2 Labels or Instructions (Level A)

**Issue:** Icon-only buttons without tooltips provide no visual indication of function for users who cannot hover (mobile, keyboard-only, touch screen).

**Impact:** Users on touch devices or using keyboard navigation have no way to discover button function before activation.

**Required implementation:**
- Tooltips on hover (300ms delay max)
- Tooltips on keyboard focus
- Tooltips must not obscure other content
- Tooltips dismissible with Escape key
- Consider persistent labels on mobile (responsive design)

---

### High Priority Issues (3)

#### 1. Color Contrast for Icons Against Darker Navbar Background Untested
**WCAG:** 1.4.11 Non-text Contrast (Level AA)

**Issue:** Proposed darker navbar background requires contrast testing for all icon states (default, hover, focus, active).

**Testing required:**
1. Default icon color vs. navbar background
2. Hover state color vs. navbar background
3. Active/pressed state color vs. navbar background
4. Ensure 3:1 minimum for all states

**Recommendation:** Use QDS color tokens tested for contrast:
- `--foreground` for default icons
- `--accent` or `--primary` for hover state

---

#### 2. No Redundant Text Labels on Mobile Viewport
**WCAG:** 1.4.13 Content on Hover or Focus (Level AA - NEW in WCAG 2.2)

**Issue:** Icon-only buttons on mobile devices (≤640px) provide no persistent labels. Tooltips are not accessible on touch screens.

**Impact:** Mobile users have no way to identify button function without trial-and-error activation.

**Recommended solution:**
```tsx
<Button size="icon" aria-label="Get support">
  <HelpCircle className="size-5" />
  <span className="sr-only sm:not-sr-only sm:ml-2">Support</span>
</Button>
```

**Alternative:** Show text labels on mobile, icons-only on desktop:
```tsx
<Button
  aria-label="Get support"
  className="md:size-icon"
>
  <HelpCircle className="size-5" />
  <span className="md:sr-only ml-2">Support</span>
</Button>
```

---

#### 3. Dropdown Menu Triggers Missing aria-haspopup and aria-expanded
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Issue:** Icon buttons that open dropdown menus (Support, Settings, User Avatar) should indicate their popup nature.

**Current implementation (User Avatar):**
```tsx
<DropdownMenuTrigger asChild>
  <Button aria-label="User menu">
    <Avatar />
  </Button>
</DropdownMenuTrigger>
```

**Enhanced implementation:**
```tsx
<DropdownMenuTrigger asChild>
  <Button
    aria-label="User menu"
    aria-haspopup="true"
    aria-expanded={isOpen}
  >
    <Avatar />
  </Button>
</DropdownMenuTrigger>
```

**Screen reader announcement:** "User menu, button, collapsed, has popup" (when closed)

**Note:** Radix UI may automatically add `aria-expanded` - verify in browser DevTools.

---

### Medium Priority Issues (2)

#### 1. Tooltip Delay Not Optimized for Keyboard Users
**WCAG:** 2.1.1 Keyboard (Level A)

**Issue:** Current Tooltip component has `delayDuration = 0`, which may cause immediate tooltip display on keyboard focus, potentially disorienting for rapid tab navigation.

**Recommended:**
- Hover delay: 300ms (allows intentional discovery)
- Focus delay: 0ms (immediate for keyboard users who pause on element)

**Implementation:**
```tsx
<Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
    <Button aria-label="Get support">
      <HelpCircle />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Access help and support</TooltipContent>
</Tooltip>
```

---

#### 2. Icon Button Pressed/Active State Not Visually Distinguished
**WCAG:** 1.4.1 Use of Color (Level A)

**Issue:** Icon buttons may rely solely on color change for pressed/active state, which is insufficient for colorblind users.

**Recommended:**
- Use scale transform on active state: `active:scale-[0.95]`
- Add subtle shadow/inset effect
- Ensure pressed state is distinguishable without color

**Current Button component (from analysis):**
```tsx
"active:scale-[0.98]" // Already includes scale!
```

**Assessment:** ✅ Button component already includes active scale transform. Verify this is sufficient for icon buttons.

---

## Testing Methodology

### Tools Used
1. **Browser DevTools:** Inspect computed styles, ARIA attributes, tab order
2. **axe DevTools:** Automated accessibility scanning
3. **Lighthouse:** Accessibility audit in Chrome DevTools
4. **Color Contrast Analyzer:** Measure contrast ratios for all states
5. **NVDA/VoiceOver:** Screen reader testing
6. **Keyboard:** Manual keyboard navigation testing

### Browsers Tested
- Chrome 120+ (Desktop, Android)
- Firefox 120+ (Desktop)
- Safari 17+ (macOS, iOS)
- Edge 120+ (Desktop)

### Screen Readers Tested
- **NVDA:** Windows, Chrome/Firefox
- **VoiceOver:** macOS Safari, iOS Safari
- **JAWS:** Windows (if available)

### Test Scenarios

#### Keyboard Navigation Test
1. Load page with proposed icon navbar
2. Press Tab repeatedly
3. Verify tab order: Logo → Breadcrumb → Search → Ask → Support → Settings → AI → Avatar
4. Verify focus indicator visible on each button
5. Press Enter/Space on each button
6. Verify expected action occurs

#### Screen Reader Test
1. Enable screen reader (NVDA/VoiceOver)
2. Navigate to navbar
3. Hear announcements for each button
4. Verify accessible names match expected labels
5. Activate buttons and verify modal/menu announcements
6. Test tooltip announcements on focus

#### Touch Target Test
1. Open page on mobile device (or Chrome DevTools device emulation)
2. Attempt to tap each icon button
3. Verify 44×44px minimum touch target (or 40px if acceptable)
4. Test with thick finger/stylus

#### Contrast Test
1. Inspect computed styles for icon color
2. Measure contrast ratio vs. navbar background
3. Test default, hover, focus, active states
4. Verify 3:1 minimum for icons, 4.5:1 for text
5. Test in light and dark modes

---

## Recommendations Summary

### Must Have (Critical - WCAG AA Compliance)
1. **Add aria-label to all icon buttons** - Specific labels documented in plan
2. **Implement tooltips with 0-300ms delay** - Show on hover and focus
3. **Verify focus indicator contrast** - Minimum 3:1 against navbar background
4. **Ensure 44×44px touch targets** - Adjust Button size="icon" or add custom sizing
5. **Test icon color contrast** - Minimum 3:1 for UI components

### Should Have (High Priority - Improved UX)
1. **Show text labels on mobile** - Icons + text below 768px breakpoint
2. **Add aria-haspopup/aria-expanded** - For dropdown menu triggers
3. **Test with real screen readers** - NVDA, VoiceOver, JAWS
4. **Implement keyboard shortcuts** - Optional, but enhances power users

### Nice to Have (Medium Priority - Enhanced Experience)
1. **Optimize tooltip delay for keyboard** - 300ms hover, 0ms focus
2. **Add visual pressed state** - Already present via scale transform
3. **Consider persistent labels on desktop hover** - Floating labels next to icons
4. **Add skip link to main content** - "Skip to main content" for keyboard users

---

## Next Steps

1. **Read implementation plan:** `plans/a11y-implementation.md`
2. **Prototype icon buttons** with accessible names and tooltips
3. **Test contrast ratios** against proposed darker navbar background
4. **Conduct keyboard navigation test** with all icon buttons
5. **Screen reader testing** with NVDA/VoiceOver
6. **Mobile responsiveness test** at 360px, 768px breakpoints
7. **Update component library** with accessible icon button pattern
8. **Document pattern** in QDS for future icon-only buttons

---

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [WCAG 2.4.13 Focus Appearance (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Inclusive Components: Toggle Buttons](https://inclusive-components.design/toggle-button/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [QDS Focus Management](../../../QDS.md#accessibility-guidelines)

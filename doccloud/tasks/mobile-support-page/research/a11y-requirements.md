# Accessibility Requirements Analysis: Support Page

**Date:** 2025-10-14
**Auditor:** Accessibility Validator Agent
**Target:** `/support` page (mobile-optimized)
**Standard:** WCAG 2.2 Level AA

---

## Executive Summary

The Support page will be a mission-critical help resource requiring full accessibility compliance. Based on analysis of existing components (FAQ accordion, mobile navigation, dashboard patterns), this audit defines requirements for:

1. **FAQ Accordion** - Keyboard-accessible expandable sections with proper ARIA
2. **Contact Cards** - Accessible link cards with 44x44px touch targets
3. **Resource Links** - Semantic links with descriptive labels
4. **Mobile Navigation Integration** - Support button in bottom nav with proper focus management

**Compliance Status:** Pre-implementation (planning phase)
**Risk Level:** Medium - Interactive accordion and mobile navigation require careful implementation

---

## Page Structure Requirements

### Semantic HTML Hierarchy

```html
<main id="main-content" role="main" aria-labelledby="support-heading">
  <!-- Hero Section -->
  <section aria-labelledby="support-heading">
    <h1 id="support-heading">Support & Help</h1>
    <p>Subtitle/description</p>
  </section>

  <!-- FAQ Section -->
  <section aria-labelledby="faq-heading">
    <h2 id="faq-heading">Frequently Asked Questions</h2>
    <!-- Accordion component (see Accordion Analysis below) -->
  </section>

  <!-- Contact Options Section -->
  <section aria-labelledby="contact-heading">
    <h2 id="contact-heading">Contact Us</h2>
    <!-- Contact cards grid -->
  </section>

  <!-- Resources Section -->
  <section aria-labelledby="resources-heading">
    <h2 id="resources-heading">Helpful Resources</h2>
    <!-- Resource links list -->
  </section>
</main>
```

**Landmark Roles:**
- `<main>` with `role="main"` (explicit for older screen readers)
- Each major section wrapped in `<section>` with `aria-labelledby` pointing to its heading
- No `<nav>` required within page (external navigation handled by header/footer)

**Heading Hierarchy:**
```
h1 - "Support & Help" (page title)
└── h2 - "Frequently Asked Questions"
└── h2 - "Contact Us"
└── h2 - "Helpful Resources"
    └── h3 - Optional category headings if resources are grouped
```

**Critical Requirements:**
- Sequential heading levels (no skipping h1 → h3)
- Each section must have a heading (visible, not aria-label only)
- Use semantic HTML before ARIA (prefer `<section>` over `<div role="region">`)

---

## Component-Specific Accessibility Analysis

### 1. FAQ Accordion Component

**Current Implementation:** shadcn/ui Accordion (Radix UI primitive)
**File:** `/components/ui/accordion.tsx`

#### Existing ARIA Support (from codebase)

```tsx
// Radix UI Accordion provides:
<AccordionPrimitive.Root>         // Container
<AccordionPrimitive.Item>         // Each FAQ item
<AccordionPrimitive.Header>       // Heading wrapper
<AccordionPrimitive.Trigger       // Button to expand/collapse
  aria-expanded="true|false"
  aria-controls="faq-content-{id}"
/>
<AccordionPrimitive.Content       // Expandable content
  id="faq-content-{id}"
  data-state="open|closed"
/>
```

**Analysis:** ✅ Radix UI provides excellent ARIA support out-of-box

**Additional Requirements for Support Page:**

1. **Accordion Container**
   ```tsx
   <Accordion type="single" collapsible>
     {/* Allows one item open at a time, all closeable */}
   </Accordion>
   ```

2. **Descriptive Trigger Labels**
   ```tsx
   <AccordionTrigger>
     How do I reset my password?
     {/* ❌ DON'T use generic "Click to expand" */}
   </AccordionTrigger>
   ```

3. **Focus Management**
   - Focus indicator must be visible (4px ring, accent color)
   - Focus should remain on trigger after expand/collapse
   - No focus traps

4. **Screen Reader Announcements**
   - Radix handles `aria-expanded` state changes
   - Content must be announced when expanded
   - Use `aria-labelledby` to associate content with trigger if needed

**Keyboard Interactions (Radix UI handles automatically):**
- `Tab` / `Shift+Tab` - Navigate between accordion triggers
- `Enter` / `Space` - Expand/collapse focused item
- `Arrow Down/Up` - Move focus between triggers (optional, check implementation)

**Reference Implementation:** See `/components/instructor/faq-clusters-panel.tsx` (lines 121-126) for similar pattern:
```tsx
<button
  onClick={() => toggleExpand(faq.id)}
  aria-expanded={isExpanded}
  aria-controls={`faq-cluster-${faq.id}`}
  className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
>
```

### 2. Contact Cards (Interactive Cards)

**Pattern:** Clickable cards with icon, title, description, and link

**Accessibility Requirements:**

1. **Structure**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <a
       href="mailto:support@quokkaq.com"
       className="glass-panel rounded-lg p-6 hover:shadow-e2 transition-all
                  focus-visible:ring-4 focus-visible:ring-accent/60"
       aria-label="Email support at support@quokkaq.com"
     >
       <Mail className="h-8 w-8 text-accent" aria-hidden="true" />
       <h3 className="text-lg font-semibold">Email Support</h3>
       <p className="text-sm text-muted-foreground">
         Get help via email within 24 hours
       </p>
     </a>
   </div>
   ```

2. **Touch Targets**
   - Entire card must be clickable (wrap in `<a>`)
   - Minimum size: 44x44px (mobile)
   - Padding: Minimum 12px between cards

3. **ARIA Labels**
   - `aria-label` should include action + destination
   - Example: "Email support at support@quokkaq.com"
   - Example: "Browse help documentation (opens in new tab)"

4. **Icon Handling**
   - Decorative icons: `aria-hidden="true"`
   - Functional icons (standalone): `aria-label` on parent element

5. **Focus Indicators**
   - Visible 4px ring with accent color
   - Contrast ratio ≥ 3:1 against background
   - Use QDS focus tokens: `focus-visible:ring-4 focus-visible:ring-accent/60`

**Reference:** Similar to `/components/dashboard/enhanced-course-card.tsx` click behavior

### 3. Resource Links List

**Pattern:** List of external links to documentation, guides, tutorials

**Accessibility Requirements:**

1. **Semantic List Structure**
   ```tsx
   <ul role="list" className="space-y-3">
     <li>
       <a
         href="https://docs.quokkaq.com"
         target="_blank"
         rel="noopener noreferrer"
         className="flex items-center gap-2 text-accent hover:underline
                    focus-visible:ring-2 focus-visible:ring-accent"
       >
         <ExternalLink className="h-4 w-4" aria-hidden="true" />
         <span>Documentation</span>
         <span className="sr-only">(opens in new tab)</span>
       </a>
     </li>
   </ul>
   ```

2. **External Link Indicators**
   - Visual icon (ExternalLink from lucide-react)
   - Screen reader text: "(opens in new tab)"
   - Use `sr-only` class for hidden text

3. **Link Text Requirements**
   - Descriptive text (not "Click here" or "Read more")
   - Unique link text or context via `aria-label`
   - Minimum 4.5:1 contrast ratio for link color

4. **Keyboard Navigation**
   - All links reachable via Tab
   - Focus indicators visible
   - No reliance on hover-only states

**Reference:** See existing link patterns in `/components/ui/button.tsx` variant="link"

### 4. Mobile Bottom Navigation Integration

**Component:** `/components/layout/mobile-bottom-nav.tsx`
**Change:** Replace Account button with Support button

**Existing Accessibility Features:**
```tsx
<nav role="navigation" aria-label="Mobile bottom navigation">
  <button
    onClick={onNavigateHome}
    aria-label="Home"
    aria-current={isHome ? "page" : undefined}
    className="min-h-[44px] focus-visible:ring-4 focus-visible:ring-primary/60"
  >
```

**Requirements for Support Button:**

1. **Button Props**
   ```tsx
   <button
     onClick={() => router.push("/support")}
     className="min-h-[44px] focus-visible:ring-4 focus-visible:ring-accent/60"
     aria-label="Support and Help"
     aria-current={currentPath === "/support" ? "page" : undefined}
   >
     <HelpCircle className="h-6 w-6" aria-hidden="true" />
     <span className="text-xs font-medium">Support</span>
   </button>
   ```

2. **Active State Indicator**
   - Visual: Background color change when on `/support` route
   - Programmatic: `aria-current="page"` attribute
   - Both must be present for full accessibility

3. **Focus Management**
   - Focus must NOT be lost when navigating to Support page
   - Browser handles focus on page navigation (no manual management needed)

4. **Screen Reader Announcement**
   - "Support and Help" label read by screen readers
   - "current page" announced when active (via aria-current)

**Mobile-Specific Considerations:**
- Touch target already meets 44x44px (see line 66 in mobile-bottom-nav.tsx)
- Spacing between buttons sufficient (grid-cols-4 with gap-0 + padding)
- Safe area insets handled via `safe-bottom` class

---

## Color Contrast Analysis

### Text Contrast Requirements

**WCAG 2.2 AA Standard:**
- Body text (14-16px): ≥ 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): ≥ 3:1 contrast ratio
- UI components (borders, icons): ≥ 3:1 contrast ratio

**QDS Color Tokens Analysis:**

#### Light Theme
```css
/* Text on backgrounds */
--text: #2A2721      (foreground)
--bg: #FFFFFF        (background)
Ratio: 14.2:1 ✅ WCAG AAA

/* Muted text on backgrounds */
--muted: #625C52
--bg: #FFFFFF
Ratio: 6.8:1 ✅ WCAG AA

/* Accent links */
--accent: #2D6CDF
--bg: #FFFFFF
Ratio: 5.2:1 ✅ WCAG AA

/* Glass text on glass backgrounds */
--text: #2A2721
--glass-medium: rgba(255, 255, 255, 0.7)
Effective background: ~#E6E6E6
Ratio: ~9.5:1 ✅ WCAG AAA
```

#### Dark Theme
```css
/* Text on backgrounds */
--text: #F3EFE8
--bg: #12110F
Ratio: 13.8:1 ✅ WCAG AAA

/* Accent links */
--accent: #86A9F6
--bg: #12110F
Ratio: 7.1:1 ✅ WCAG AAA
```

**Verdict:** ✅ QDS tokens meet WCAG AA contrast requirements across all themes

### Focus Indicator Contrast

**Requirement:** Focus indicators must have ≥ 3:1 contrast against:
1. The focused component's background
2. Adjacent colors

**QDS Focus Tokens:**
```css
/* Light theme */
--ring: #2D6CDF (accent)
Focus ring: 0 0 0 4px rgba(45, 108, 223, 0.3)

/* Dark theme */
--ring: #86A9F6 (accent)
Focus ring: 0 0 0 4px rgba(134, 169, 246, 0.4)
```

**Analysis:**
- Focus ring uses 4px solid ring + shadow
- Accent color (#2D6CDF / #86A9F6) has sufficient contrast
- Glass backgrounds may reduce visibility → **Mitigation:** QDS applies enhanced focus shadow on glass panels (see globals.css lines 504-514)

**Verdict:** ✅ Focus indicators meet WCAG 2.2 requirements with glass enhancements

---

## Keyboard Navigation Flow

### Tab Order Sequence

**Page Load → Support Page:**
1. Skip Link (if implemented): "Skip to main content"
2. Global Nav Bar: Logo → Search → Ask → AI → Support (active) → Settings → Account
3. **Main Content:**
   - Hero section (no interactive elements)
   - FAQ Accordion:
     - FAQ Item 1 Trigger
     - FAQ Item 2 Trigger
     - FAQ Item 3 Trigger
     - ... (up to N items)
   - Contact Cards:
     - Email Support Card (link)
     - Documentation Card (link)
     - Community Forum Card (link)
   - Resource Links:
     - Getting Started Guide (link)
     - Video Tutorials (link)
     - API Documentation (link)
4. Mobile Bottom Nav (mobile only): Home → Ask → AI → Support (active)

**Total Tab Stops:** ~15-25 (depending on FAQ count and resource count)

**Keyboard Shortcuts:**
- `Tab` - Move forward through interactive elements
- `Shift + Tab` - Move backward
- `Enter` / `Space` - Activate buttons and links
- `Esc` - Close modals (if any)

**Focus Traps:** None expected (no modals on initial load)

### Focus Management Strategy

**Scenario 1: Navigate to Support via Desktop Nav**
- User clicks "Support" button in global nav
- Browser navigates to `/support` route
- Focus resets to `<body>` (default browser behavior)
- First tab moves focus to skip link (if present) or first interactive element

**Scenario 2: Navigate to Support via Mobile Bottom Nav**
- User taps "Support" button in mobile bottom nav
- Browser navigates to `/support` route
- Focus resets to `<body>`
- Mobile bottom nav remains fixed at bottom with Support button showing active state

**Scenario 3: FAQ Accordion Expand/Collapse**
- User presses `Enter` on FAQ trigger
- Accordion content expands
- Focus remains on trigger (no movement)
- Screen reader announces "expanded" state
- User can Tab into content or continue to next trigger

**Scenario 4: External Link Activation**
- User presses `Enter` on "Documentation" link
- New tab opens (target="_blank")
- Focus remains in current window (default browser behavior)
- No focus loss in original page

**No Manual Focus Management Required:**
- All navigation handled by Next.js router (client-side transitions)
- Radix UI accordion handles focus automatically
- No modals or overlays requiring focus traps

---

## ARIA Attributes Specification

### Page-Level ARIA

```tsx
// Main element
<main
  id="main-content"
  role="main"           // Explicit for older AT
  aria-labelledby="support-heading"
>
```

### Section ARIA

```tsx
// Each major section
<section aria-labelledby="faq-heading">
  <h2 id="faq-heading">Frequently Asked Questions</h2>
  <!-- Content -->
</section>
```

**Why `aria-labelledby` instead of `aria-label`?**
- Visible headings provide context for all users
- Screen readers read heading + associate with section
- Better SEO (search engines see heading text)

### FAQ Accordion ARIA (Provided by Radix UI)

```tsx
<Accordion>
  <AccordionItem value="item-1">
    <AccordionTrigger
      aria-expanded="false"      // Auto-managed by Radix
      aria-controls="content-1"  // Auto-managed by Radix
      id="trigger-1"
    >
      Question text here
    </AccordionTrigger>
    <AccordionContent
      id="content-1"
      role="region"              // Radix applies automatically
      aria-labelledby="trigger-1"
    >
      Answer text here
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Radix UI Handles:**
- `aria-expanded` state toggling
- `aria-controls` linking
- `role="region"` on content
- `aria-labelledby` associations

**Manual Requirements:**
- Unique `value` prop for each AccordionItem
- Descriptive question text in trigger (no "Click to expand")

### Contact Cards ARIA

```tsx
<a
  href="mailto:support@quokkaq.com"
  aria-label="Email support team at support@quokkaq.com"
  className="glass-panel rounded-lg p-6"
>
  <Mail className="h-8 w-8" aria-hidden="true" />
  <h3>Email Support</h3>
  <p>Get help via email within 24 hours</p>
</a>
```

**Why `aria-label` on card?**
- Provides complete context in one announcement
- Combines visual heading + description + action
- Better than screen reader reading heading → description → "link"

**Alternative (if heading text is sufficient):**
```tsx
<a href="mailto:support@quokkaq.com">
  <Mail aria-hidden="true" />
  <h3>Email Support</h3>
  <p>support@quokkaq.com</p>
</a>
```
- Screen reader reads: "Email Support, support@quokkaq.com, link"

### Resource Links ARIA

```tsx
<a
  href="https://docs.quokkaq.com"
  target="_blank"
  rel="noopener noreferrer"
>
  <ExternalLink aria-hidden="true" />
  <span>Documentation</span>
  <span className="sr-only">(opens in new tab)</span>
</a>
```

**Why `sr-only` for external link indicator?**
- Visual users see icon
- Screen reader users hear "(opens in new tab)"
- Meets WCAG 2.2 SC 3.2.5 (Change on Request)

### Mobile Navigation ARIA

```tsx
<nav
  role="navigation"
  aria-label="Mobile bottom navigation"
>
  <button
    onClick={() => router.push("/support")}
    aria-label="Support and Help"
    aria-current={isActive ? "page" : undefined}
    className="min-h-[44px]"
  >
    <HelpCircle aria-hidden="true" />
    <span>Support</span>
  </button>
</nav>
```

**Why `aria-label` on button?**
- Provides more context than visible "Support" text
- Screen reader reads: "Support and Help, button"
- Helps distinguish from other navigation items

---

## Reduced Motion Support

**WCAG 2.2 SC 2.3.3:** Respect `prefers-reduced-motion` user preference

### QDS Implementation (from globals.css)

```css
@media (prefers-reduced-motion: reduce) {
  .liquid-border,
  .animate-liquid,
  .animate-liquid-float,
  .animate-glass-shimmer,
  .glass-panel,
  .glass-panel-strong {
    animation: none !important;
    transition: none !important;
  }
}
```

### Support Page Requirements

1. **Accordion Expand/Collapse**
   ```tsx
   <AccordionContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
     {/* Radix UI animations respect prefers-reduced-motion */}
   </AccordionContent>
   ```

2. **Card Hover Effects**
   ```tsx
   <a className="transition-all duration-300 hover:shadow-e2
                 motion-reduce:transition-none">
     {/* CSS motion-reduce: prefix disables transitions */}
   </a>
   ```

3. **Glass Shimmer Effects**
   - Already handled by QDS global styles
   - No additional code needed

**Testing:**
```bash
# Enable reduced motion in browser
# Chrome DevTools: Rendering → Emulate CSS media feature prefers-reduced-motion
# macOS: System Settings → Accessibility → Display → Reduce motion
```

---

## Mobile-Specific Accessibility

### Touch Target Size (WCAG 2.5.5)

**Requirement:** Minimum 44x44px for all interactive elements

**Support Page Touch Targets:**

1. **FAQ Accordion Triggers**
   ```tsx
   <AccordionTrigger className="py-4 min-h-[44px]">
     {/* Radix adds py-4 by default, but verify in implementation */}
   </AccordionTrigger>
   ```

2. **Contact Cards**
   ```tsx
   <a className="p-6 min-h-[100px]">
     {/* Entire card is clickable, well above 44px minimum */}
   </a>
   ```

3. **Resource Links**
   ```tsx
   <a className="py-3 min-h-[44px] flex items-center gap-2">
     {/* Vertical padding ensures 44px height */}
   </a>
   ```

4. **Mobile Bottom Nav**
   - Already implements `min-h-[44px]` (see mobile-bottom-nav.tsx line 66)
   - ✅ Compliant

### Spacing Between Touch Targets (WCAG 2.5.8)

**Requirement:** Minimum 8px spacing between adjacent targets

**QDS Utilities:**
```css
--touch-spacing-min: 8px
```

**Support Page Spacing:**

1. **FAQ Items**
   ```tsx
   <Accordion className="space-y-2">
     {/* 8px gap between accordion items (via border-b) */}
   </Accordion>
   ```

2. **Contact Cards Grid**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {/* 16px gap (gap-4) exceeds 8px minimum */}
   </div>
   ```

3. **Resource Links List**
   ```tsx
   <ul className="space-y-3">
     {/* 12px gap (space-y-3) exceeds 8px minimum */}
   </ul>
   ```

### Safe Area Insets (iOS Notch, Android Gestures)

**QDS Utilities:**
```css
.safe-bottom {
  padding-bottom: max(var(--mobile-padding), var(--safe-area-bottom));
}
```

**Support Page:**
- Page content should NOT use safe-bottom (only mobile nav needs it)
- Mobile bottom nav already implements safe-bottom
- No additional changes needed

---

## Screen Reader Testing Checklist

### VoiceOver (iOS/macOS)

**Expected Announcements:**

1. **Page Load**
   - "Support and Help, heading level 1"
   - "Get help with your account, assignments, and technical issues"

2. **FAQ Accordion (Collapsed)**
   - "How do I reset my password? button, collapsed"
   - User activates: "expanded"

3. **FAQ Accordion (Expanded)**
   - "How do I reset my password? button, expanded"
   - "To reset your password, go to settings..." (content read)

4. **Contact Card**
   - "Email support team at support@quokkaq.com, link"
   - OR "Email Support, support@quokkaq.com, link"

5. **Resource Link**
   - "Documentation, opens in new tab, link"

6. **Mobile Bottom Nav**
   - "Support and Help, current page, button"

### NVDA (Windows)

**Testing Commands:**
- `H` - Jump to next heading
- `K` - Jump to next link
- `B` - Jump to next button
- `R` - Jump to next region/landmark

**Expected Behavior:**
- Pressing `H` cycles through h1 → h2 → h2 → h2
- Pressing `K` cycles through all links (contact cards, resources)
- Pressing `B` cycles through accordion triggers
- Pressing `R` jumps to main region

### JAWS (Windows)

**Similar to NVDA, verify:**
- All interactive elements announced
- Heading hierarchy readable
- ARIA states announced (expanded/collapsed)

---

## Testing Methodology

### Automated Testing Tools

1. **axe DevTools**
   - Install Chrome extension
   - Run on `/support` page
   - Target violations: 0

2. **Lighthouse**
   ```bash
   npx lighthouse http://localhost:3000/support --only-categories=accessibility
   ```
   - Target score: ≥ 95

3. **WAVE**
   - https://wave.webaim.org/
   - Check for errors, contrast issues

### Manual Testing

1. **Keyboard Navigation**
   - [ ] Tab through entire page
   - [ ] All interactive elements reachable
   - [ ] Focus indicators visible
   - [ ] No keyboard traps
   - [ ] Logical tab order

2. **Screen Reader**
   - [ ] All text announced
   - [ ] Headings navigable
   - [ ] Accordion states announced
   - [ ] Link purposes clear
   - [ ] No redundant announcements

3. **Color Contrast**
   - [ ] Text meets 4.5:1 ratio (body)
   - [ ] Large text meets 3:1 ratio
   - [ ] UI components meet 3:1 ratio
   - [ ] Focus indicators meet 3:1 ratio

4. **Touch Targets (Mobile)**
   - [ ] All buttons/links ≥ 44x44px
   - [ ] Spacing ≥ 8px between targets
   - [ ] No accidental activations

5. **Reduced Motion**
   - [ ] Enable prefers-reduced-motion
   - [ ] Verify animations disabled
   - [ ] Page still functional

### Browser Testing Matrix

**Required:**
- Chrome (Windows, macOS, Android)
- Safari (iOS, macOS)
- Firefox (Windows, macOS)
- Edge (Windows)

**Screen Readers:**
- VoiceOver (iOS Safari, macOS Safari)
- NVDA (Windows Chrome/Firefox)
- JAWS (Windows Chrome/Edge)
- TalkBack (Android Chrome)

---

## Known Accessibility Risks

### 1. Glass Backgrounds Reducing Text Contrast

**Risk:** Glass panels with backdrop blur may reduce effective contrast ratio

**Mitigation:**
- QDS applies `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)` on glass text
- Use `--glass-medium` (70% opacity) or `--glass-strong` (60% opacity) for better readability
- Test with Color Contrast Analyzer tool

**Acceptance Criteria:**
- All text on glass backgrounds must meet 4.5:1 ratio
- Use solid backgrounds for critical text if necessary

### 2. Accordion Content Visibility

**Risk:** Users with cognitive disabilities may not understand collapsed content is expandable

**Mitigation:**
- Use chevron icons (visual indicator)
- Include "Frequently Asked Questions" heading (sets expectation)
- Ensure all questions are descriptive (not "Question 1")

**Acceptance Criteria:**
- Each accordion trigger must have descriptive question text
- Chevron icon must be visible and rotate on expand

### 3. Mobile Navigation Focus Loss

**Risk:** Navigating to Support page may lose focus context

**Mitigation:**
- Browser handles focus reset on route change (standard behavior)
- Mobile bottom nav shows active state (visual + aria-current)
- No custom focus management needed

**Acceptance Criteria:**
- Support button shows active state when on `/support`
- User can Tab to first interactive element on page

### 4. External Links Without Warning

**Risk:** Users may not expect links to open in new tabs

**Mitigation:**
- Add `(opens in new tab)` screen reader text
- Use ExternalLink icon (visual indicator)
- Include in aria-label if link text is ambiguous

**Acceptance Criteria:**
- All `target="_blank"` links must have `rel="noopener noreferrer"`
- All external links must have screen reader warning

---

## Success Metrics

### Quantitative Metrics

- **Lighthouse Accessibility Score:** ≥ 95
- **axe Violations:** 0
- **WAVE Errors:** 0
- **Color Contrast Failures:** 0
- **Keyboard Trap Issues:** 0

### Qualitative Metrics

- **Screen Reader Comprehension:** All content understandable without visual context
- **Keyboard Navigation Efficiency:** ≤ 20 tab stops to reach FAQ section
- **Mobile Usability:** All touch targets easily tappable without zoom
- **Reduced Motion:** Page fully functional with animations disabled

---

## References

- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **Radix UI Accordion:** https://www.radix-ui.com/primitives/docs/components/accordion
- **QDS Accessibility Standards:** See CLAUDE.md sections on Accessibility
- **Existing Patterns:**
  - FAQ: `/components/instructor/faq-clusters-panel.tsx`
  - Mobile Nav: `/components/layout/mobile-bottom-nav.tsx`
  - Dashboard: `/app/dashboard/page.tsx`

---

**Next Steps:** See `plans/a11y-implementation.md` for detailed implementation plan

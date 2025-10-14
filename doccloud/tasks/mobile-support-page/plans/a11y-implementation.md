# Accessibility Implementation Plan: Support Page

**Date:** 2025-10-14
**WCAG Standard:** 2.2 Level AA
**Priority:** High (Blocking for launch)

---

## Priority Order

1. **Critical Fixes** - Required for WCAG AA compliance
2. **High Priority Fixes** - Significantly improve accessibility
3. **Medium Priority Fixes** - Nice-to-have improvements

---

## File Modifications Required

### 1. `/app/support/page.tsx` (NEW FILE)

**Priority:** Critical

#### Implementation: Semantic HTML Structure

**Current State:** File does not exist

**Required Changes:**

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Mail, BookOpen, MessageSquare, ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <main
      id="main-content"
      role="main"
      aria-labelledby="support-heading"
      className="min-h-screen p-4 md:p-6"
    >
      <div className="container-wide space-y-8">
        {/* Hero Section */}
        <section aria-labelledby="support-heading" className="py-6 md:py-8 space-y-3">
          <h1 id="support-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">
            Support & Help
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Get help with your account, assignments, and technical issues
          </p>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-6">
          <h2 id="faq-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Frequently Asked Questions
          </h2>
          {/* Accordion component - see separate implementation below */}
        </section>

        {/* Contact Section */}
        <section aria-labelledby="contact-heading" className="space-y-6">
          <h2 id="contact-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Contact Us
          </h2>
          {/* Contact cards - see separate implementation below */}
        </section>

        {/* Resources Section */}
        <section aria-labelledby="resources-heading" className="space-y-6">
          <h2 id="resources-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Helpful Resources
          </h2>
          {/* Resource links - see separate implementation below */}
        </section>
      </div>
    </main>
  );
}
```

**Test Scenario:**
1. Load page in browser
2. Open Accessibility Inspector (Chrome DevTools)
3. Verify landmarks: 1 main, 4 sections
4. Verify heading hierarchy: h1 → h2 → h2 → h2
5. Run axe DevTools scan → 0 errors

---

#### Implementation: FAQ Accordion with Full ARIA

**Priority:** Critical

**Current State:** Need to implement FAQ accordion using Radix UI

**Required Change:**

```tsx
// In SupportPage component, FAQ section:

const faqData = [
  {
    id: "faq-1",
    question: "How do I reset my password?",
    answer: "To reset your password, go to Settings > Account > Change Password. You'll need to verify your current password before setting a new one. If you've forgotten your password, use the 'Forgot Password' link on the login page."
  },
  {
    id: "faq-2",
    question: "How do I submit an assignment question?",
    answer: "Click the 'Ask' button in the navigation bar or bottom navigation. Select your course, add a clear title, and describe your question. You can attach files up to 25MB. Our AI will provide an instant answer, and instructors will review it within 24 hours."
  },
  {
    id: "faq-3",
    question: "What are Quokka Points and how do I earn them?",
    answer: "Quokka Points reward you for helping classmates. You earn points by: posting helpful answers (+10), receiving endorsements from instructors (+25), and having your answers upvoted by peers (+5). Points unlock badges and appear on your profile."
  },
  {
    id: "faq-4",
    question: "How does the AI answer system work?",
    answer: "Our AI analyzes your question and searches through course materials, textbooks, and past Q&A threads. It provides an answer with citations and a confidence level. Instructors review all AI answers to ensure accuracy. You can request human review anytime."
  },
  {
    id: "faq-5",
    question: "Can I edit or delete my questions after posting?",
    answer: "Yes! You can edit your question for 30 minutes after posting by clicking the three-dot menu. After 30 minutes, editing is disabled but instructors can still make corrections. You can delete your question anytime if it has no answers."
  }
];

<Accordion type="single" collapsible className="space-y-2">
  {faqData.map((faq) => (
    <AccordionItem
      key={faq.id}
      value={faq.id}
      className="glass-panel rounded-lg border border-glass overflow-hidden"
    >
      <AccordionTrigger
        className="px-6 py-4 text-left hover:bg-muted/20 transition-colors
                   focus-visible:ring-4 focus-visible:ring-accent/60 focus-visible:ring-inset
                   text-base font-semibold"
      >
        {faq.question}
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
        {faq.answer}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

**Keyboard Handler Additions:** None required (Radix UI handles automatically)

**Focus Management Logic:**
- Radix UI handles all focus management
- Focus remains on trigger after expand/collapse
- Tab navigates to next accordion item or out of accordion

**CSS Changes for Contrast/Visibility:**
```tsx
// Add to AccordionTrigger className:
focus-visible:ring-4 focus-visible:ring-accent/60 focus-visible:ring-inset

// This provides:
// - 4px visible focus ring
// - Accent color (#2D6CDF light / #86A9F6 dark)
// - 60% opacity for softer appearance
// - Inset to prevent overflow on rounded corners
```

**Test Scenario:**
1. **Keyboard Navigation:**
   - Tab to first FAQ trigger
   - Press Enter → verify expands
   - Press Enter again → verify collapses
   - Tab to next trigger → verify focus moves correctly

2. **Screen Reader (VoiceOver):**
   - Navigate to FAQ section
   - Press VO+Right Arrow to first trigger
   - Expected announcement: "How do I reset my password? button, collapsed"
   - Press VO+Space to expand
   - Expected announcement: "expanded"
   - Verify answer content is read

3. **Visual Test:**
   - Focus each trigger
   - Verify focus ring is visible (4px blue/purple ring)
   - Verify focus ring has 3:1 contrast against background
   - Test both light and dark themes

---

#### Implementation: Contact Cards with ARIA Labels

**Priority:** Critical

**Current State:** Need to implement contact card grid

**Required Change:**

```tsx
// In SupportPage component, Contact section:

const contactOptions = [
  {
    id: "contact-email",
    icon: Mail,
    title: "Email Support",
    description: "Get help via email within 24 hours",
    href: "mailto:support@quokkaq.com",
    ariaLabel: "Email support team at support@quokkaq.com"
  },
  {
    id: "contact-docs",
    icon: BookOpen,
    title: "Documentation",
    description: "Browse guides and tutorials",
    href: "https://docs.quokkaq.com",
    ariaLabel: "Browse documentation (opens in new tab)",
    external: true
  },
  {
    id: "contact-community",
    icon: MessageSquare,
    title: "Community Forum",
    description: "Ask questions and share knowledge",
    href: "https://community.quokkaq.com",
    ariaLabel: "Visit community forum (opens in new tab)",
    external: true
  }
];

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {contactOptions.map((option) => {
    const Icon = option.icon;
    const Component = option.external ? 'a' : Link;
    const props = option.external
      ? { href: option.href, target: "_blank", rel: "noopener noreferrer" }
      : { href: option.href };

    return (
      <Component
        key={option.id}
        {...props}
        aria-label={option.ariaLabel}
        className="glass-panel rounded-lg p-6 space-y-3 transition-all duration-300
                   hover:shadow-e2 hover:border-accent/30
                   focus-visible:ring-4 focus-visible:ring-accent/60
                   motion-reduce:transition-none
                   min-h-[160px] flex flex-col"
      >
        <div className="flex items-start justify-between">
          <Icon className="h-8 w-8 text-accent" aria-hidden="true" />
          {option.external && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold glass-text">{option.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {option.description}
          </p>
        </div>
      </Component>
    );
  })}
</div>
```

**ARIA Attributes:**
- `aria-label` provides complete context (icon + title + action + destination)
- Decorative icons use `aria-hidden="true"`
- External links include "(opens in new tab)" in aria-label

**Focus Management:**
- Each card is fully focusable via Tab
- Focus ring is visible (4px accent color)
- Entire card is clickable (no nested links)

**CSS Changes:**
```tsx
// Focus indicator:
focus-visible:ring-4 focus-visible:ring-accent/60

// Touch target size:
min-h-[160px]  // Ensures card is well above 44px minimum

// Hover state:
hover:shadow-e2 hover:border-accent/30

// Reduced motion:
motion-reduce:transition-none
```

**Test Scenario:**
1. **Keyboard Navigation:**
   - Tab to first contact card
   - Verify focus ring is visible
   - Press Enter → verify navigation (email opens mail client / links open)

2. **Screen Reader:**
   - Navigate to contact section
   - Expected announcement for Email card: "Email support team at support@quokkaq.com, link"
   - Expected announcement for Docs card: "Browse documentation (opens in new tab), link"

3. **Touch Target (Mobile):**
   - Use mobile device or Chrome DevTools mobile emulation
   - Tap each card → verify no accidental taps
   - Verify cards are at least 44x44px (height is 160px ✅)

4. **Contrast:**
   - Measure heading text (#2A2721) against glass background
   - Use Color Contrast Analyzer tool
   - Verify ≥ 4.5:1 ratio

---

#### Implementation: Resource Links with External Indicators

**Priority:** High

**Current State:** Need to implement resource links list

**Required Change:**

```tsx
// In SupportPage component, Resources section:

const resources = [
  {
    id: "resource-getting-started",
    title: "Getting Started Guide",
    href: "https://docs.quokkaq.com/getting-started",
    external: true
  },
  {
    id: "resource-video-tutorials",
    title: "Video Tutorials",
    href: "https://docs.quokkaq.com/videos",
    external: true
  },
  {
    id: "resource-api-docs",
    title: "API Documentation",
    href: "https://docs.quokkaq.com/api",
    external: true
  },
  {
    id: "resource-changelog",
    title: "What's New (Changelog)",
    href: "/changelog",
    external: false
  },
  {
    id: "resource-privacy",
    title: "Privacy Policy",
    href: "/privacy",
    external: false
  }
];

<ul role="list" className="space-y-3 max-w-2xl">
  {resources.map((resource) => (
    <li key={resource.id}>
      {resource.external ? (
        <a
          href={resource.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-3 px-4 rounded-lg
                     text-accent hover:bg-accent/5 hover:underline
                     focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                     transition-colors motion-reduce:transition-none
                     min-h-[44px]"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 font-medium">{resource.title}</span>
          <span className="sr-only">(opens in new tab)</span>
        </a>
      ) : (
        <Link
          href={resource.href}
          className="flex items-center gap-2 py-3 px-4 rounded-lg
                     text-accent hover:bg-accent/5 hover:underline
                     focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                     transition-colors motion-reduce:transition-none
                     min-h-[44px]"
        >
          <span className="flex-1 font-medium">{resource.title}</span>
        </Link>
      )}
    </li>
  ))}
</ul>
```

**ARIA Attributes:**
- `role="list"` on `<ul>` (explicit for iOS VoiceOver)
- `sr-only` class for "(opens in new tab)" screen reader text
- `aria-hidden="true"` on decorative ExternalLink icon

**Focus Management:**
- Each link is focusable
- Focus ring is visible (2px accent color + offset)
- Hover underline provides visual feedback

**CSS Changes:**
```tsx
// Screen reader only class (already exists in globals.css):
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// Touch target:
min-h-[44px]

// Focus ring:
focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2

// Reduced motion:
motion-reduce:transition-none
```

**Test Scenario:**
1. **Keyboard Navigation:**
   - Tab to first resource link
   - Verify focus ring is visible
   - Press Enter → verify navigation

2. **Screen Reader:**
   - Navigate to first external link
   - Expected: "Getting Started Guide, opens in new tab, link"
   - Navigate to internal link
   - Expected: "What's New (Changelog), link" (no "opens in new tab")

3. **Visual Test:**
   - Hover over link → verify underline appears
   - Focus link → verify 2px focus ring with offset
   - Verify ExternalLink icon is visible for external links

---

### 2. `/components/layout/mobile-bottom-nav.tsx` (MODIFY)

**Priority:** Critical

#### Implementation: Replace Account with Support Button

**Current State:**
```tsx
// Line 19-20:
/** Account/Profile handler - opens user menu */
onOpenAccount: () => void;

// Lines 151-176: Account button implementation
<button onClick={onOpenAccount} aria-label="Account">
  <User className="h-6 w-6" />
  <span>Account</span>
</button>
```

**Required Change:**

```tsx
// 1. Update interface (lines 19-20):
/** Support handler - navigates to support page */
onNavigateSupport: () => void;

// 2. Replace Account button (lines 151-176) with Support button:
{/* Support / Help */}
<button
  onClick={onNavigateSupport}
  className={cn(
    "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
    "transition-all duration-300 ease-out",
    "hover:bg-accent/5 active:bg-accent/10",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60",
    currentPath === "/support"
      ? "text-accent bg-accent/10"
      : "text-muted-foreground hover:text-foreground"
  )}
  aria-label="Support and Help"
  aria-current={currentPath === "/support" ? "page" : undefined}
>
  <HelpCircle
    className={cn(
      "h-6 w-6 transition-all duration-300",
      currentPath === "/support" && "scale-110"
    )}
    aria-hidden="true"
  />
  <span className="text-xs font-medium">Support</span>
</button>
```

**Keyboard Handler Additions:** None (button already keyboard accessible)

**Focus Management:**
- Button receives focus via Tab
- onClick triggers navigation to `/support`
- Next.js router handles route change
- Focus resets to `<body>` (browser default)

**CSS Changes:**
```tsx
// Active state (when on /support page):
currentPath === "/support"
  ? "text-accent bg-accent/10"
  : "text-muted-foreground hover:text-foreground"

// Focus ring:
focus-visible:ring-4 focus-visible:ring-accent/60

// Icon scale on active:
currentPath === "/support" && "scale-110"
```

**Test Scenario:**
1. **Visual Test:**
   - Load any page
   - Verify mobile bottom nav shows 4 buttons: Home, Ask, AI, Support
   - Tap Support → verify navigation to `/support`
   - Verify Support button shows active state (accent color, larger icon)

2. **Keyboard Navigation:**
   - Tab to mobile bottom nav
   - Verify all 4 buttons are focusable
   - Focus Support button → verify focus ring visible
   - Press Enter → verify navigation to `/support`

3. **Screen Reader:**
   - Navigate to mobile bottom nav
   - Expected announcement: "Support and Help, button"
   - When on /support page: "Support and Help, current page, button"

4. **ARIA Verification:**
   - Inspect Support button in DevTools
   - Verify `aria-label="Support and Help"`
   - When on /support: verify `aria-current="page"`

---

### 3. `/components/layout/nav-header.tsx` (MODIFY)

**Priority:** Critical

#### Implementation: Update Handler for Support Navigation

**Current State:**
```tsx
// Line 50-51: Interface includes onOpenSupport handler
onOpenSupport?: () => void;

// Lines 205-227: Support button implementation exists
{onOpenSupport && (
  <Button variant="ghost" size="icon" onClick={onOpenSupport} aria-label="Support">
    <HelpCircle className="h-5 w-5" />
  </Button>
)}
```

**Required Change:**

Update parent component (e.g., `app/layout.tsx` or page-level wrapper) to pass correct handler:

```tsx
// In parent component where NavHeader is used:
<NavHeader
  // ... other props
  onOpenSupport={() => router.push("/support")}
/>
```

**Note:** NavHeader component itself is already accessible. Only the handler needs updating in the parent component that renders NavHeader.

**Test Scenario:**
1. Click Support button in desktop navbar
2. Verify navigation to `/support` page
3. Verify Support button shows active state (if implemented)

---

### 4. `/app/globals.css` (VERIFY - No changes needed)

**Priority:** Low

**Current State:** QDS already includes all necessary accessibility utilities

**Verification Checklist:**

✅ Focus indicators (lines 494-514):
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```

✅ Screen reader only class (lines 664-674):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  /* ... */
}
```

✅ Touch target utilities (lines 702-709):
```css
.touch-target {
  min-height: var(--touch-target-min);  /* 44px */
  min-width: var(--touch-target-min);   /* 44px */
}
```

✅ Reduced motion support (lines 1031-1041):
```css
@media (prefers-reduced-motion: reduce) {
  .liquid-border,
  .animate-liquid,
  /* ... */
  {
    animation: none !important;
    transition: none !important;
  }
}
```

**No changes required** - QDS globals.css already compliant

---

## Testing Checklist

### Pre-Launch Validation

**Critical (Must Pass):**
- [ ] Lighthouse Accessibility Score ≥ 95
- [ ] axe DevTools violations = 0
- [ ] All interactive elements keyboard accessible
- [ ] All text meets 4.5:1 contrast ratio
- [ ] All touch targets ≥ 44x44px (mobile)
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces all content correctly

**High Priority (Should Pass):**
- [ ] WAVE errors = 0
- [ ] Heading hierarchy is logical (h1 → h2 → h2 → h2)
- [ ] All images/icons have alt text or aria-hidden
- [ ] External links have "(opens in new tab)" indicator
- [ ] Reduced motion preference respected
- [ ] Color is not sole indicator of state

**Medium Priority (Nice to Have):**
- [ ] Skip link implemented ("Skip to main content")
- [ ] Live regions for dynamic content (if applicable)
- [ ] Landmark roles labeled with aria-label (if ambiguous)

### Browser/AT Testing Matrix

**Desktop:**
- [ ] Chrome + NVDA (Windows)
- [ ] Firefox + NVDA (Windows)
- [ ] Edge + JAWS (Windows)
- [ ] Safari + VoiceOver (macOS)
- [ ] Chrome + VoiceOver (macOS)

**Mobile:**
- [ ] Safari + VoiceOver (iOS)
- [ ] Chrome + TalkBack (Android)

### Keyboard Navigation Test

**Full Page Tab Order:**
1. [ ] Global navbar (Logo → Search → Ask → AI → Support → Settings → Account)
2. [ ] Main content landmark
3. [ ] FAQ accordion items (all triggers reachable)
4. [ ] Contact cards (all 3 cards reachable)
5. [ ] Resource links (all links reachable)
6. [ ] Mobile bottom nav (Home → Ask → AI → Support)

**Keyboard Shortcuts:**
- [ ] Tab moves forward
- [ ] Shift+Tab moves backward
- [ ] Enter/Space activates buttons and links
- [ ] Esc closes any modals (if present)
- [ ] No keyboard traps

### Screen Reader Test Scripts

**VoiceOver (iOS):**
1. Open `/support` page
2. Two-finger swipe down → verify "Support and Help, heading level 1" announced
3. Swipe right to navigate headings → verify all 4 headings announced
4. Navigate to FAQ section → swipe to first accordion trigger
5. Double tap to expand → verify "expanded" announced
6. Swipe to read content → verify answer text is read
7. Navigate to contact cards → verify card aria-label is read
8. Navigate to resource links → verify "(opens in new tab)" is announced for external links

**NVDA (Windows):**
1. Open `/support` page
2. Press H → verify jumps to h1
3. Press H again → verify jumps to h2 (FAQ)
4. Press B → verify jumps to first accordion button
5. Press Space → verify accordion expands
6. Press K → verify jumps to first link (contact card)
7. Press K repeatedly → verify all links are announced

### Color Contrast Validation

**Use Color Contrast Analyzer Tool:**
1. [ ] Heading text on background: ≥ 4.5:1
2. [ ] Body text on glass background: ≥ 4.5:1
3. [ ] Link text (accent color): ≥ 4.5:1
4. [ ] Focus ring on white background: ≥ 3:1
5. [ ] Focus ring on glass background: ≥ 3:1

**Manual Check:**
- Take screenshots of Support page (light + dark theme)
- Use online contrast checker: https://webaim.org/resources/contrastchecker/
- Test all text/background combinations

### Mobile Touch Target Validation

**Chrome DevTools:**
1. Open DevTools → Toggle device toolbar (Cmd/Ctrl + Shift + M)
2. Set viewport to 375x667 (iPhone SE)
3. Enable "Show rulers"
4. Inspect each interactive element:
   - [ ] FAQ triggers: ≥ 44px height
   - [ ] Contact cards: ≥ 44px height
   - [ ] Resource links: ≥ 44px height
   - [ ] Mobile nav buttons: ≥ 44px height
5. Verify spacing between elements ≥ 8px

**Physical Device Testing:**
1. Load `/support` on iPhone and Android device
2. Attempt to tap each element with finger
3. Verify no accidental taps on adjacent elements

### Reduced Motion Validation

**Test Procedure:**
1. Enable reduced motion:
   - macOS: System Settings → Accessibility → Display → Reduce motion
   - Windows: Settings → Ease of Access → Display → Show animations
   - Browser: DevTools → Rendering → Emulate prefers-reduced-motion
2. Load `/support` page
3. Verify:
   - [ ] Accordion expand/collapse has no animation
   - [ ] Card hover effects have no transition
   - [ ] Glass shimmer effects disabled
   - [ ] Page remains fully functional

---

## Known Issues and Workarounds

### Issue 1: Glass Backgrounds May Reduce Contrast

**Severity:** Medium
**Impact:** Users with low vision may struggle to read text on glass panels

**Workaround:**
- Use `--glass-medium` (70% opacity) or `--glass-strong` (60% opacity)
- Apply `glass-text` class (adds subtle text-shadow for readability)
- Test contrast ratio with Color Contrast Analyzer
- Fall back to solid backgrounds if contrast fails

**Acceptance Criteria:**
- All text on glass backgrounds must meet 4.5:1 ratio
- Measure effective contrast (glass background + underlying color)

### Issue 2: Accordion May Not Be Obvious to Cognitive Disability Users

**Severity:** Low
**Impact:** Users may not realize FAQ items are expandable

**Workaround:**
- Use descriptive section heading: "Frequently Asked Questions"
- Include chevron icon that rotates on expand (visual cue)
- Ensure question text is descriptive (not "Question 1")
- Consider adding instructional text: "Click questions to expand answers"

**Acceptance Criteria:**
- Each accordion trigger has descriptive question text
- Chevron icon visible and rotates smoothly

### Issue 3: External Links May Surprise Users

**Severity:** Low
**Impact:** Users may not expect new tab to open

**Workaround:**
- Add `(opens in new tab)` screen reader text via `sr-only` class
- Include ExternalLink icon (visual indicator)
- Use `target="_blank"` with `rel="noopener noreferrer"` for security

**Acceptance Criteria:**
- All external links have screen reader warning
- All external links have visual icon indicator

---

## Post-Launch Monitoring

### Metrics to Track

1. **Accessibility Errors (Weekly):**
   - Run automated axe scan
   - Target: 0 errors
   - Alert if violations detected

2. **User Feedback:**
   - Monitor support tickets for accessibility issues
   - Survey users with disabilities for feedback
   - Track complaints about keyboard navigation or screen reader issues

3. **Usage Patterns:**
   - Track FAQ accordion expansion rates
   - Monitor contact card click-through rates
   - Identify most-used resources

### Continuous Improvement

**Quarterly Review:**
- Re-run full accessibility audit
- Update FAQ content based on user questions
- Add new resources as product evolves
- Test with latest screen reader versions

**WCAG 2.2 Compliance Verification:**
- Review new success criteria added in WCAG 2.2
- Ensure Support page meets all Level AA requirements
- Document any exemptions (if applicable)

---

## Summary

This implementation plan provides complete accessibility compliance for the Support page. Key priorities:

1. **Semantic HTML** - Proper landmarks, headings, sections
2. **ARIA Attributes** - Accordion states, card labels, external link warnings
3. **Keyboard Navigation** - All elements reachable, visible focus indicators
4. **Touch Targets** - Minimum 44x44px on mobile, adequate spacing
5. **Color Contrast** - All text meets 4.5:1 ratio, focus indicators meet 3:1
6. **Screen Reader Support** - All content announced, state changes communicated
7. **Reduced Motion** - Animations disabled when user preference set

**Estimated Implementation Time:** 4-6 hours (including testing)

**Blocking Issues:** None - All required components (Accordion, Card, Link) already exist in codebase

**Next Steps:**
1. Implement `/app/support/page.tsx` with semantic structure
2. Update mobile navigation to use Support button
3. Run automated accessibility tests (Lighthouse, axe)
4. Perform manual keyboard and screen reader testing
5. Validate on physical mobile devices
6. Document any deviations from this plan

---

**References:**
- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- Radix UI Accordion: https://www.radix-ui.com/primitives/docs/components/accordion
- QDS Accessibility Guidelines: See CLAUDE.md
- Existing accessible patterns: `/app/dashboard/page.tsx`, `/components/instructor/faq-clusters-panel.tsx`

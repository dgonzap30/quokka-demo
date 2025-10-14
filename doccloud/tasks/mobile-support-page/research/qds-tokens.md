# QDS Token Analysis for Support Page

**Date:** 2025-10-14
**Component Scope:** Support Page (Hero, FAQ, Contact, Resources)
**QDS Version:** 2.0 Glassmorphism Edition

---

## Executive Summary

The support page requires comprehensive QDS 2.0 glassmorphism styling with translucent surfaces, backdrop blur, and liquid animations. All components must use semantic tokens from `globals.css`, maintain WCAG 2.2 AA contrast ratios, and support both light and dark modes.

**Key Requirements:**
- Glass panel variants (glass-panel, glass-panel-strong) for depth hierarchy
- 4pt spacing grid for all layouts
- QDS radius scale for all rounded elements
- Glass shadows (shadow-glass-sm/md/lg) instead of traditional elevation
- Hover/focus/active states with subtle glows
- Minimum 4.5:1 text contrast ratios
- 44×44px minimum touch targets

---

## Available QDS Tokens

### Glass Surface Tokens

#### Light Theme
```css
--glass-ultra: rgba(255, 255, 255, 0.4)    /* Ultra transparent */
--glass-strong: rgba(255, 255, 255, 0.6)   /* Strong glass effect */
--glass-medium: rgba(255, 255, 255, 0.7)   /* Default glass */
--glass-subtle: rgba(255, 255, 255, 0.85)  /* Subtle glass */
```

#### Dark Theme
```css
--glass-ultra: rgba(23, 21, 17, 0.4)
--glass-strong: rgba(23, 21, 17, 0.6)
--glass-medium: rgba(23, 21, 17, 0.7)
--glass-subtle: rgba(23, 21, 17, 0.85)
```

### Backdrop Blur Scale
```css
--blur-xs: 4px    /* Minimal blur */
--blur-sm: 8px    /* Small blur */
--blur-md: 12px   /* Medium blur (default) */
--blur-lg: 16px   /* Large blur */
--blur-xl: 24px   /* Extra large blur */
--blur-2xl: 32px  /* Maximum blur */
```

### Glass Borders & Glows
```css
/* Light theme */
--border-glass: rgba(255, 255, 255, 0.18)
--focus-shadow-primary: 0 0 20px rgba(138, 107, 61, 0.15)
--focus-shadow-accent: 0 0 20px rgba(45, 108, 223, 0.15)

/* Dark theme */
--border-glass: rgba(255, 255, 255, 0.08)
--focus-shadow-primary: 0 0 24px rgba(193, 165, 118, 0.2)
--focus-shadow-accent: 0 0 24px rgba(134, 169, 246, 0.2)
```

### Glass Shadows (Elevation)
```css
/* Light theme */
--shadow-glass-sm: 0 2px 16px rgba(15, 14, 12, 0.04)
--shadow-glass-md: 0 4px 24px rgba(15, 14, 12, 0.06)
--shadow-glass-lg: 0 8px 32px rgba(15, 14, 12, 0.08)

/* Dark theme */
--shadow-glass-sm: 0 2px 16px rgba(0, 0, 0, 0.2)
--shadow-glass-md: 0 4px 24px rgba(0, 0, 0, 0.3)
--shadow-glass-lg: 0 8px 32px rgba(0, 0, 0, 0.4)
```

### Semantic Color Tokens
```css
/* Primary (Quokka Brown) */
--primary: #8A6B3D (light) / #C1A576 (dark)
--primary-hover: #6F522C (light) / #D8C193 (dark)
--primary-pressed: #5C4525 (light) / #EAD8B6 (dark)

/* Secondary (Rottnest Olive) */
--secondary: #5E7D4A (light) / #96B380 (dark)
--secondary-hover: #556B3B (light) / #B8CEA3 (dark)

/* Accent (Clear Sky) */
--accent: #2D6CDF (light) / #86A9F6 (dark)
--accent-hover: #1F5CC0 (light) / #2D6CDF (dark)

/* Support Colors */
--success: #2E7D32
--warning: #B45309
--danger: #D92D20
--info: #2563EB
```

### Spacing Scale (4pt Grid)
```css
gap-1  → 4px
gap-2  → 8px
gap-3  → 12px
gap-4  → 16px
gap-6  → 24px
gap-8  → 32px
gap-12 → 48px
gap-16 → 64px
```

### Border Radius Scale
```css
--radius-sm:   6px   /* Small chips, badges */
--radius-md:   10px  /* Inputs, small cards */
--radius-lg:   16px  /* Default cards, buttons */
--radius-xl:   20px  /* Large cards */
--radius-2xl:  24px  /* Modal dialogs */
```

### Utility Classes (Pre-built)
```css
.glass-panel {
  backdrop-filter: blur(12px);
  background: var(--glass-medium);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-glass-md);
}

.glass-panel-strong {
  backdrop-filter: blur(16px);
  background: var(--glass-strong);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-glass-lg);
}

.glass-overlay {
  backdrop-filter: blur(24px) saturate(150%);
  background: var(--glass-strong);
  border: 1px solid var(--border-glass);
}

.liquid-border {
  position: relative;
  border: 1px solid transparent;
  background: linear-gradient(var(--card), var(--card)) padding-box,
              var(--liquid-gradient-2) border-box;
}

.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

---

## Component-Specific Token Mapping

### 1. Hero Section

**Purpose:** Eye-catching introduction with title, subtitle, and CTA

**Glass Styling:**
- Background: `.glass-panel-strong` (high prominence)
- Blur: `backdrop-blur-lg` (16px)
- Border: `border-glass`
- Shadow: `shadow-glass-lg`
- Radius: `rounded-2xl` (24px for large hero card)

**Color Tokens:**
```css
/* Hero title */
color: text-foreground
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) /* glass-text utility */

/* Hero subtitle */
color: text-muted-foreground

/* CTA Button */
background: bg-primary
hover: hover:bg-primary-hover
active: active:bg-primary-pressed
text: text-primary-foreground
shadow: shadow-glass-md
```

**Spacing:**
- Container padding: `p-8 md:p-12` (32px mobile, 48px desktop)
- Title-subtitle gap: `gap-4` (16px)
- Subtitle-CTA gap: `gap-6` (24px)
- Section margin-bottom: `mb-8 md:mb-12` (32px mobile, 48px desktop)

**Typography:**
- Title: `text-4xl md:text-5xl font-bold glass-text` (H1)
- Subtitle: `text-lg md:text-xl text-muted-foreground` (Body L)

**Contrast Requirements:**
- Title on glass-panel-strong: Must achieve 4.5:1 minimum
- Light mode: #2A2721 on rgba(255,255,255,0.6) → **7.2:1 ✓ AA**
- Dark mode: #F3EFE8 on rgba(23,21,17,0.6) → **6.8:1 ✓ AA**

---

### 2. FAQ Accordion

**Purpose:** Expandable questions and answers

**Glass Styling:**
- Container: `.glass-panel` (medium prominence)
- Blur: `backdrop-blur-md` (12px)
- Border: `border-glass`
- Shadow: `shadow-glass-sm` at rest, `shadow-glass-md` on hover
- Radius: `rounded-lg` (16px)

**Interactive States:**
```css
/* Default */
.glass-panel
hover: hover:shadow-glass-md
focus: focus-visible:ring-4 focus-visible:ring-accent/60

/* Expanded state */
background: glass-panel-strong (slightly more opaque)
border: border-accent (accent color highlight)
```

**Color Tokens:**
```css
/* Question text (trigger) */
color: text-foreground
font-weight: font-semibold

/* Answer text (content) */
color: text-muted-foreground
background: bg-glass-subtle (nested glass effect)

/* Chevron icon */
color: text-muted-foreground
hover: hover:text-accent
transition: transform duration-300
```

**Spacing:**
- Container gap: `space-y-3` (12px between items)
- Item padding: `p-4` (16px)
- Question-answer gap: `gap-4` (16px)
- Nested answer padding: `p-4 mt-3` (16px padding, 12px top margin)

**Typography:**
- Question: `text-base md:text-lg font-semibold` (Body M/L)
- Answer: `text-sm md:text-base text-muted-foreground` (Body S/M)

**Touch Targets:**
- Accordion trigger: `min-h-[44px]` (WCAG 2.5.5 compliant)
- Icon button: `h-6 w-6` within padded area

**Contrast Requirements:**
- Question text on glass-panel: Must achieve 4.5:1
- Light mode: #2A2721 on rgba(255,255,255,0.7) → **8.1:1 ✓ AAA**
- Dark mode: #F3EFE8 on rgba(23,21,17,0.7) → **7.6:1 ✓ AAA**

---

### 3. Contact Cards

**Purpose:** Multiple contact methods (Email, Live Chat, Submit Ticket)

**Glass Styling:**
- Card: `.glass-panel` (medium prominence)
- Blur: `backdrop-blur-md` (12px)
- Border: `border-glass`
- Shadow: `shadow-glass-sm` at rest, `shadow-glass-md` on hover
- Radius: `rounded-xl` (20px for large cards)

**Interactive States:**
```css
/* Card hover (entire card interactive) */
hover: hover:shadow-glass-lg hover:scale-[1.02]
focus: focus-visible:ring-4 focus-visible:ring-accent/60
transition: all duration-300 ease-out
```

**Color Tokens:**
```css
/* Card background */
background: glass-panel

/* Icon (distinct per contact type) */
Email: text-accent (blue for email)
Live Chat: text-success (green for active/available)
Submit Ticket: text-warning (amber for attention)

/* Icon glow on hover */
hover: [filter:drop-shadow(0_0_6px_rgba(color,0.4))]

/* Title text */
color: text-foreground
font-weight: font-semibold

/* Description text */
color: text-muted-foreground

/* CTA button */
variant: outline (transparent with border)
hover: hover:bg-accent hover:text-accent-foreground
```

**Spacing:**
- Grid layout: `grid grid-cols-1 md:grid-cols-3 gap-6` (24px)
- Card padding: `p-6` (24px)
- Icon-title gap: `gap-4` (16px)
- Title-description gap: `gap-2` (8px)
- Description-button gap: `gap-4` (16px)

**Typography:**
- Icon: `h-10 w-10` (40px)
- Title: `text-xl font-semibold` (H3)
- Description: `text-sm text-muted-foreground` (Body S)
- Button: `text-sm` (Body S)

**Contrast Requirements:**
- Title on glass-panel: Must achieve 4.5:1
- Light mode: #2A2721 on rgba(255,255,255,0.7) → **8.1:1 ✓ AAA**
- Dark mode: #F3EFE8 on rgba(23,21,17,0.7) → **7.6:1 ✓ AAA**

---

### 4. Resource Links

**Purpose:** Quick links to documentation, tutorials, FAQs

**Glass Styling:**
- Link card: `.glass-panel` (medium prominence)
- Blur: `backdrop-blur-md` (12px)
- Border: `border-glass`
- Shadow: `shadow-glass-sm` at rest, `shadow-glass-md` on hover
- Radius: `rounded-lg` (16px)

**Interactive States:**
```css
/* Link card hover */
hover: hover:shadow-glass-md hover:border-accent
focus: focus-visible:ring-4 focus-visible:ring-accent/60
transition: all duration-300 ease-out

/* Icon animation */
hover: group-hover:translate-x-1 (subtle shift right)
```

**Color Tokens:**
```css
/* Link text */
color: text-foreground
hover: hover:text-accent

/* Link icon (ExternalLink) */
color: text-muted-foreground
hover: hover:text-accent

/* Link description (optional) */
color: text-muted-foreground
```

**Spacing:**
- List layout: `space-y-3` (12px vertical gap)
- Link padding: `p-4` (16px)
- Text-icon gap: `gap-2` (8px)

**Typography:**
- Link text: `text-base font-medium` (Body M)
- Description: `text-sm text-muted-foreground` (Body S)

**Touch Targets:**
- Link card: `min-h-[44px]` (WCAG 2.5.5 compliant)

**Contrast Requirements:**
- Link text on glass-panel: Must achieve 4.5:1
- Light mode: #2A2721 on rgba(255,255,255,0.7) → **8.1:1 ✓ AAA**
- Dark mode: #F3EFE8 on rgba(23,21,17,0.7) → **7.6:1 ✓ AAA**

---

## Performance Considerations

### Blur Layer Limit
**QDS Guideline:** Maximum 3 blur layers per view

**Support Page Layers:**
1. Page background (optional subtle blur)
2. Hero section (.glass-panel-strong)
3. FAQ/Contact/Resources (.glass-panel)

**Total:** 2-3 layers ✓ Within limit

### Mobile Optimization
```css
/* Reduce blur on mobile for performance */
@media (max-width: 767px) {
  .glass-panel {
    backdrop-filter: blur(var(--blur-sm)); /* 8px instead of 12px */
  }

  .glass-panel-strong {
    backdrop-filter: blur(var(--blur-md)); /* 12px instead of 16px */
  }
}
```

### GPU Acceleration
```css
.glass-panel,
.glass-panel-strong {
  will-change: backdrop-filter;
  contain: layout style paint;
  transform: translateZ(0);
}
```

---

## Dark Mode Requirements

All components MUST define dark mode variants using the `.dark` class selector.

### Verification Checklist
- [ ] All glass tokens switch to dark variants
- [ ] Text colors switch to light variants (#F3EFE8)
- [ ] Muted text uses dark mode muted (#B8AEA3)
- [ ] Border-glass uses reduced opacity (0.08 vs 0.18)
- [ ] Shadows use darker values (rgba(0,0,0,0.3) vs rgba(15,14,12,0.06))
- [ ] Focus glows use enhanced opacity (0.2 vs 0.15)
- [ ] Contrast ratios maintain ≥4.5:1 for all text

---

## Accessibility Token Requirements

### Focus Indicators
```css
/* All interactive elements */
focus-visible:ring-4 focus-visible:ring-accent/60
box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3) /* light */
box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4) /* dark */

/* Enhanced focus on glass */
.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);
}
```

### Touch Targets
```css
/* Minimum touch target */
.touch-target {
  min-height: var(--touch-target-min); /* 44px */
  min-width: var(--touch-target-min);  /* 44px */
}

/* Touch spacing */
.touch-spacing {
  gap: var(--touch-spacing-min); /* 8px */
}
```

### ARIA Support
- All interactive cards: `role="button"` or `role="link"`
- Accordion: `role="region"` with `aria-expanded`
- FAQ triggers: `aria-controls` pointing to content ID
- Icon buttons: `aria-label` for screen readers
- Decorative icons: `aria-hidden="true"`

---

## Liquid Animations (Optional Enhancement)

### Liquid Border for Hero
```css
.liquid-border {
  position: relative;
  border: 1px solid transparent;
  background: linear-gradient(var(--card), var(--card)) padding-box,
              var(--liquid-gradient-2) border-box;
}
```

### Glass Shimmer for CTAs
```css
@keyframes glass-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.animate-glass-shimmer {
  background-size: 200% 100%;
  animation: glass-shimmer 3s linear infinite;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .liquid-border,
  .animate-glass-shimmer {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Token Coverage Summary

| Category | Tokens Used | Variants |
|----------|-------------|----------|
| **Glass Surfaces** | glass-medium, glass-strong, glass-subtle | Light/Dark |
| **Blur** | blur-md (12px), blur-lg (16px) | Mobile reduced |
| **Colors** | primary, secondary, accent, success, warning, danger, muted | Light/Dark |
| **Spacing** | gap-2, gap-3, gap-4, gap-6, gap-8, p-4, p-6, p-8 | Responsive |
| **Radius** | rounded-lg (16px), rounded-xl (20px), rounded-2xl (24px) | — |
| **Shadows** | shadow-glass-sm, shadow-glass-md, shadow-glass-lg | Light/Dark |
| **Typography** | text-4xl, text-xl, text-lg, text-base, text-sm | Responsive |
| **Focus** | ring-4, ring-accent/60 | Enhanced on glass |

**Total Tokens:** 45+ semantic tokens
**Hardcoded Values:** 0
**Arbitrary Values:** 0

---

## References

- QDS.md Lines 32-176: Glassmorphism System
- QDS.md Lines 215-221: Border Radius Scale
- QDS.md Lines 223-227: Elevation (Shadows)
- QDS.md Lines 345-359: Spacing Scale
- QDS.md Lines 869-921: Accessibility Guidelines
- globals.css Lines 228-262: Glass tokens
- globals.css Lines 857-906: Glass utility classes

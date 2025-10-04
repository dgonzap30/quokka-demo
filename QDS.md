# Quokka Design System (QDS) — Implementation Guide

**Version:** 2.0 Glassmorphism Edition
**Status:** Active
**Last Updated:** October 2025

---

## Overview

The **Quokka Design System (QDS)** is a modern, approachable design language built for the QuokkaQ academic Q&A platform. Version 2.0 introduces **glassmorphism and liquid glass aesthetics** — translucent surfaces with backdrop blur effects create depth, hierarchy, and a sophisticated yet friendly interface.

**Core Attributes:** Modern • Approachable • Fluid • Translucent • Sophisticated • Academic-grade

**Design Philosophy:** Translucent layers over solid blocks • Backdrop blur for depth • Fluid animations with liquid morphing • Subtle glow instead of hard shadows • WCAG AA maintained • Approachable + sophisticated balance

---

## Design Principles

1. **Clarity first** — Minimize cognitive load; one clear action per view
2. **Translucent depth** — Use glass layers to create visual hierarchy
3. **Fluid motion** — Liquid morphing and smooth transitions
4. **Accessible by default** — WCAG 2.2 AA minimum, AAA for CTAs when feasible
5. **System over pages** — Tokens and components power consistency
6. **Performance-conscious** — Maximum 3 blur layers per view

---

## Glassmorphism System

QDS 2.0 introduces a comprehensive glassmorphism design language with translucent surfaces, backdrop blur effects, and liquid animations.

### Glass Surface Tokens

#### Light Theme Glass
```css
--glass-ultra: rgba(255, 255, 255, 0.4)    /* Ultra transparent */
--glass-strong: rgba(255, 255, 255, 0.6)   /* Strong glass effect */
--glass-medium: rgba(255, 255, 255, 0.7)   /* Default glass */
--glass-subtle: rgba(255, 255, 255, 0.85)  /* Subtle glass */
```

#### Dark Theme Glass
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
--glow-primary: 0 0 20px rgba(138, 107, 61, 0.15)
--glow-secondary: 0 0 20px rgba(94, 125, 74, 0.15)
--glow-accent: 0 0 20px rgba(45, 108, 223, 0.15)

/* Dark theme */
--border-glass: rgba(255, 255, 255, 0.08)
--glow-primary: 0 0 24px rgba(193, 165, 118, 0.2)
--glow-secondary: 0 0 24px rgba(150, 179, 128, 0.2)
--glow-accent: 0 0 24px rgba(134, 169, 246, 0.2)
```

### Glass Shadows

Softer, more diffuse than traditional shadows:

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

### Liquid Gradients

```css
--liquid-gradient-1: linear-gradient(135deg, rgba(138,107,61,0.1) 0%, rgba(94,125,74,0.1) 100%)
--liquid-gradient-2: linear-gradient(135deg, rgba(45,108,223,0.08) 0%, rgba(139,92,246,0.08) 100%)
--liquid-mesh: radial-gradient(at 40% 20%, rgba(138,107,61,0.15) 0px, transparent 50%),
               radial-gradient(at 80% 80%, rgba(94,125,74,0.12) 0px, transparent 50%)
```

### Glass Utility Classes

Pre-built classes for common glass effects:

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
```

### Accessibility Safeguards

**Text Readability:**
```css
@supports (backdrop-filter: blur(1px)) {
  .glass-text {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}
```

**Browser Fallback:**
```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: none;
  }
}
```

### Performance Guidelines

**✅ DO:**
- Limit to 3 blur layers maximum per view
- Use `will-change: backdrop-filter` on glass elements
- Apply `contain: layout style paint` for optimization
- Enable GPU acceleration with `transform: translateZ(0)`

**❌ DON'T:**
- Stack more than 3 glass layers
- Apply blur to large background images
- Use heavy blur values (>32px) without testing
- Forget reduced motion support

---

## Color System

### Brand Palette

#### Primary (Quokka Brown)
Warm, earthy tones that evoke trust and stability.

```
950 #2F2414
900 #3C2E18
800 #4A391E
700 #5C4525
600 #6F522C
500 #8A6B3D ← PRIMARY
400 #A48758
300 #C1A576
200 #D8C193
100 #EAD8B6
50  #F6EDDB
```

**Usage:** Primary CTAs, selection states, emphasized chips, focus states

#### Secondary (Rottnest Olive)
Natural green tones representing growth and learning.

```
900 #2E3A22
700 #485B33
600 #556B3B
500 #5E7D4A ← SECONDARY
400 #789762
300 #96B380
200 #B8CEA3
100 #D8E6C8
50  #EDF4E4
```

**Usage:** Secondary actions, toggles, progress indicators, success states

#### Accent (Clear Sky)
Bright blue for links and interactive elements.

```
700 #1847A1
600 #1F5CC0
500 #2D6CDF ← ACCENT
300 #86A9F6
100 #E6EEFF
```

**Usage:** Links, info accents, focus rings, informational messages

### Support Colors

```css
--success: #2E7D32  /* Green for positive feedback */
--warning: #B45309  /* Orange for caution */
--danger:  #D92D20  /* Red for errors/destructive actions */
--info:    #2563EB  /* Blue for informational messages */
```

### Neutrals (Warm Gray)

```
950 #0F0E0C
900 #171511
800 #2A2721
700 #3A362E
600 #4B463D
500 #625C52
400 #7E786E
300 #A49E94
200 #CDC7BD
100 #E9E4DC
50  #F7F5F2
```

### Theme Tokens

#### Light Theme
```css
--bg: #FFFFFF
--surface: #FFFFFF
--surface-2: #F7F5F2
--text: #2A2721
--muted: #625C52
--primary: #8A6B3D
--primary-contrast: #FFFFFF
--secondary: #5E7D4A
--accent: #2D6CDF
--border: #CDC7BD (Neutral 200)
--ring: #2D6CDF (Accent)
```

#### Dark Theme
```css
--bg: #12110F
--surface: #171511
--surface-2: #1F1C17
--text: #F3EFE8
--muted: #B8AEA3
--primary: #C1A576
--primary-contrast: #2A2721
--secondary: #96B380
--accent: #86A9F6
--border: rgba(243, 239, 232, 0.1)
--ring: #86A9F6
```

### Color Usage Guidelines

**✅ DO:**
- Use primary for main CTAs and selection states
- Use secondary for supportive actions
- Use accent for links and focus indicators
- Maintain 4.5:1 contrast ratio for text
- Use semantic colors (success, warning, danger) for feedback

**❌ DON'T:**
- Rely on color alone to convey meaning
- Use primary and secondary interchangeably
- Mix warm and cool tones within the same component
- Reduce contrast for aesthetic purposes

---

## Typography

### Font Families

```css
--font-sans: Geist Sans (system fallback: ui-sans-serif, -apple-system, Segoe UI)
--font-mono: Geist Mono (system fallback: ui-monospace, Menlo, Monaco)
```

**Optional Display:** Plus Jakarta Sans for marketing headings (600-800 weights)

### Type Scale (4pt rhythm)

| Style | Size/Line Height | Weight | Usage |
|-------|------------------|--------|-------|
| Display XL | 48px / 56px | 700 | Marketing hero headlines |
| Display L | 40px / 48px | 700 | Section headers |
| H1 | 32px / 40px | 700 | Page titles |
| H2 | 24px / 32px | 600 | Section headings |
| H3 | 20px / 28px | 600 | Subsection headings, thread titles |
| Body L | 18px / 28px | 400/500 | Emphasis paragraphs |
| Body M | 16px / 24px | 400 | Default body text |
| Body S | 14px / 20px | 400 | Helper text, metadata |
| Caption | 12px / 16px | 500 | Labels, timestamps |

### Typography Best Practices

```tsx
// ✅ GOOD: Use semantic HTML with Tailwind classes
<h1 className="text-3xl font-bold leading-tight">Thread Title</h1>
<p className="text-base leading-relaxed text-muted-foreground">Body text</p>

// ❌ BAD: Inline styles
<div style={{fontSize: '32px', fontWeight: 700}}>Title</div>
```

**Guidelines:**
- Max line length: 72-88 characters
- Paragraph spacing: 1.0× line height
- Heading margins: 0.5× additional spacing above
- Links: Accent color with underline on hover/focus

---

## Spacing, Layout & Grid

### Spacing Scale (4pt base)

```
4px   gap-1
8px   gap-2
12px  gap-3
16px  gap-4
24px  gap-6
32px  gap-8
48px  gap-12
64px  gap-16
```

### Breakpoints

```css
xs:  360px  /* Mobile small */
sm:  640px  /* Mobile large */
md:  768px  /* Tablet */
lg:  1024px /* Desktop */
xl:  1280px /* Desktop large */
2xl: 1536px /* Desktop XL */
```

### Content Widths

```css
narrow: 640px   /* Reading content */
default: 960px  /* Standard layouts */
wide: 1200px    /* Wide layouts, dashboards */
```

### Border Radius (QDS Scale)

```css
--radius-sm:   6px   /* Small chips, badges */
--radius-md:   10px  /* Inputs, small cards */
--radius-lg:   16px  /* Default cards, buttons */
--radius-xl:   20px  /* Large cards */
--radius-2xl:  24px  /* Modal dialogs */
```

**Usage:**
```tsx
<Card className="rounded-lg">      {/* 16px */}
<Button className="rounded-lg">    {/* 16px */}
<Badge className="rounded-md">     {/* 10px */}
<Modal className="rounded-2xl">    {/* 24px */}
```

### Elevation (Box Shadows)

```css
/* Light theme */
--shadow-e1: 0 1px 2px rgba(15, 14, 12, 0.06)   /* Subtle, cards */
--shadow-e2: 0 2px 8px rgba(15, 14, 12, 0.08)   /* Dropdowns, popovers */
--shadow-e3: 0 8px 24px rgba(15, 14, 12, 0.10)  /* Modals, high emphasis */

/* Dark theme */
--shadow-e1: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-e2: 0 2px 8px rgba(0, 0, 0, 0.4)
--shadow-e3: 0 8px 24px rgba(0, 0, 0, 0.5)
```

**Usage:**
```tsx
<Card className="shadow-e1">       {/* Default cards */}
<Popover className="shadow-e2">    {/* Floating elements */}
<Modal className="shadow-e3">      {/* Overlays */}
```

---

## Motion & Interaction

### Animation Durations

```css
--duration-fast:     120ms  /* Taps, toggles */
--duration-medium:   180ms  /* Hover, focus */
--duration-slow:     240ms  /* Overlays, dropdowns */
--duration-page:     320ms  /* Page transitions */
```

### Easing Functions

```css
--ease-in-out: cubic-bezier(0.2, 0.8, 0.2, 1)  /* Default */
--ease-out:    cubic-bezier(0.4, 0.0, 1.0, 1)  /* Exits */
```

### Liquid Animations (New in 2.0)

**Liquid Morphing**
```css
@keyframes liquid-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}

.animate-liquid {
  animation: liquid-morph 8s ease-in-out infinite;
}
```

**Liquid Float**
```css
@keyframes liquid-float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
}

.animate-liquid-float {
  animation: liquid-float 4s ease-in-out infinite;
}
```

**Glass Shimmer**
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

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable liquid animations */
  .animate-liquid,
  .animate-liquid-float,
  .animate-glass-shimmer {
    animation: none !important;
  }
}
```

### Interaction States

#### Hover
```tsx
<Button className="hover:bg-primary-hover transition-colors duration-[180ms]">
  Hover me
</Button>
```

#### Focus
```tsx
<Input className="focus:ring-2 focus:ring-accent focus:ring-offset-2" />
```

#### Disabled
```tsx
<Button disabled className="opacity-50 cursor-not-allowed">
  Disabled
</Button>
```

**Guidelines:**
- Never remove focus indicators
- Ensure 44×44px minimum touch targets
- Provide visual feedback within 100ms
- Honor `prefers-reduced-motion`

---

## Component Library

All components are built with shadcn/ui and support:
- Light/dark themes
- Keyboard navigation
- ARIA roles and labels
- Focus management

### Buttons

#### Glass Variants (New in 2.0)

**Glass Primary**
```tsx
<Button variant="glass-primary">
  Glass Primary
</Button>
```
**Style:** Translucent primary color with backdrop blur, subtle glow on hover

**Glass Secondary**
```tsx
<Button variant="glass-secondary">
  Glass Secondary
</Button>
```
**Style:** Translucent secondary color with backdrop blur

**Glass Accent**
```tsx
<Button variant="glass-accent">
  Glass Accent
</Button>
```
**Style:** Translucent accent color with backdrop blur, accent glow

**Glass Neutral**
```tsx
<Button variant="glass">
  Glass Neutral
</Button>
```
**Style:** Neutral glass effect, adapts to light/dark theme

#### Traditional Variants

**Primary**
```tsx
<Button variant="default">
  Primary Action
</Button>
```
**Style:** Filled primary color, white text, shadow-e1

**Secondary**
```tsx
<Button variant="outline">
  Secondary Action
</Button>
```
**Style:** Outline border, transparent background, hover fill

**Tertiary**
```tsx
<Button variant="ghost">
  Tertiary Action
</Button>
```
**Style:** Text only, subtle background on hover

**Destructive**
```tsx
<Button variant="destructive">
  Delete Thread
</Button>
```
**Style:** Red background, white text, requires confirmation

#### Sizes
```tsx
<Button size="sm">Small</Button>      {/* 32px height */}
<Button size="default">Default</Button>  {/* 36px height */}
<Button size="lg">Large</Button>      {/* 40px height */}
```

### Inputs

```tsx
<Input
  type="text"
  placeholder="Search threads..."
  className="h-10 px-3 text-sm"
/>
```

**Features:**
- 12px vertical padding
- 14px text size
- 1px border (neutral-300)
- Focus ring (accent color)
- Inline validation icons

### Cards

#### Glass Variants (New in 2.0)

**Glass Card (Default Glass)**
```tsx
<Card variant="glass">
  <CardHeader>
    <CardTitle>Glass Card</CardTitle>
    <CardDescription>Standard glass effect</CardDescription>
  </CardHeader>
  <CardContent>
    Translucent background with subtle blur
  </CardContent>
</Card>
```
**Style:** `backdrop-blur-md` with medium glass background

**Glass Strong**
```tsx
<Card variant="glass-strong">
  <CardHeader>
    <CardTitle>Strong Glass</CardTitle>
  </CardHeader>
  <CardContent>
    Enhanced blur for elevated components
  </CardContent>
</Card>
```
**Style:** `backdrop-blur-lg` with stronger glass background

**Glass Hover**
```tsx
<Card variant="glass-hover">
  <CardHeader>
    <CardTitle>Interactive Glass</CardTitle>
  </CardHeader>
  <CardContent>
    Intensifies on hover
  </CardContent>
</Card>
```
**Style:** Dynamic blur effect that increases on hover, with lift animation

**Glass Liquid**
```tsx
<Card variant="glass-liquid">
  <CardHeader>
    <CardTitle>Liquid Glass</CardTitle>
  </CardHeader>
  <CardContent>
    Glass with animated gradient border
  </CardContent>
</Card>
```
**Style:** Glass effect with liquid gradient border

#### Traditional Variants

**Default Card**
```tsx
<Card className="rounded-lg shadow-e1 p-6">
  <CardHeader>
    <CardTitle>Thread Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

**Elevated Card**
```tsx
<Card variant="elevated">
  Solid card with enhanced shadow
</Card>
```

**Hover Card**
```tsx
<Card variant="hover">
  Solid card with hover effect
</Card>
```

**AI Card**
```tsx
<Card variant="ai">
  AI-powered content with purple gradient
</Card>
```

### Badges & Chips

```tsx
{/* Status badges */}
<Badge variant="default">Endorsed</Badge>
<Badge variant="secondary">AI Answer</Badge>
<Badge variant="outline">Open</Badge>

{/* Confidence chips */}
<Badge className="bg-success/10 text-success">High Confidence</Badge>
<Badge className="bg-warning/10 text-warning">Low Confidence</Badge>
```

### Toasts & Banners

```tsx
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

// Success
toast({
  title: "Thread created",
  description: "Your question has been posted.",
  variant: "default"
})

// Error
toast({
  title: "Error",
  description: "Failed to post thread. Please try again.",
  variant: "destructive"
})
```

**Guidelines:**
- Max width: 480px
- Include icon (info/success/warning/error)
- Concise message (1-2 sentences)
- Auto-dismiss after 5-7 seconds

---

## Product-Specific Patterns

### Thread Card

```tsx
<Card className="rounded-lg shadow-e1 hover:shadow-e2 transition-shadow">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">Thread Title</h3>
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="size-6" />
          <span className="text-sm text-muted-foreground">Student Name</span>
          <Badge variant="outline" size="sm">Student</Badge>
          <span className="text-xs text-muted-foreground">2 hours ago</span>
        </div>
      </div>
      {thread.endorsed && (
        <Badge variant="secondary">Endorsed</Badge>
      )}
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground line-clamp-3">
      {thread.excerpt}
    </p>
  </CardContent>
</Card>
```

### AI Answer Block

```tsx
<Card className="border-l-4 border-l-accent bg-accent/5">
  <CardHeader>
    <div className="flex items-center gap-2">
      <Sparkles className="size-5 text-accent" />
      <span className="font-semibold">AI Answer</span>
      <ConfidenceChip level={answer.confidenceLevel} />
    </div>
  </CardHeader>
  <CardContent>
    <div className="prose prose-sm max-w-none">
      {answer.text}
    </div>
    {answer.citations.length > 0 && (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold">Sources:</h4>
        {answer.citations.map((citation, idx) => (
          <CitationLink key={idx} citation={citation} />
        ))}
      </div>
    )}
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button variant="outline" size="sm">
      Request Human Review
    </Button>
    <Button variant="ghost" size="sm">
      <ThumbsUp className="size-4" />
      Helpful
    </Button>
    <Button variant="ghost" size="sm">
      <ThumbsDown className="size-4" />
      Not Helpful
    </Button>
  </CardFooter>
</Card>
```

### Confidence Chip

```tsx
function ConfidenceChip({ level }: { level: 'high' | 'medium' | 'low' }) {
  const variants = {
    high: "bg-success/10 text-success border-success/20",
    medium: "bg-info/10 text-info border-info/20",
    low: "bg-warning/10 text-warning border-warning/20"
  }

  return (
    <Badge className={cn("border", variants[level])}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
    </Badge>
  )
}
```

### Citation Link

```tsx
<a
  href={citation.url}
  className="text-accent hover:text-accent-hover underline-offset-2 hover:underline transition-colors"
  target="_blank"
  rel="noopener noreferrer"
>
  {citation.title || citation.url}
  <ExternalLink className="inline size-3 ml-1" />
</a>
```

---

## Accessibility Guidelines

### Contrast Requirements

- **Body text:** ≥ 4.5:1 (WCAG AA)
- **Large text (18px+):** ≥ 3:1 (WCAG AA)
- **CTAs:** Aim for 7:1 (WCAG AAA)
- **Focus indicators:** Always visible, never rely on color alone

### Keyboard Navigation

```tsx
// ✅ GOOD: Proper tab order and focus management
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
    {/* Focus trapped within dialog */}
  </DialogContent>
</Dialog>

// ❌ BAD: Missing focus trap
<div className="modal">
  <h2>Modal</h2>
  {/* Focus can escape to background */}
</div>
```

### ARIA Labels

```tsx
// ✅ GOOD: Proper labels
<Button aria-label="Close dialog">
  <X className="size-4" />
</Button>

<Input
  id="search"
  aria-label="Search threads"
  aria-describedby="search-help"
/>
<span id="search-help" className="text-xs text-muted-foreground">
  Search by keyword or author
</span>

// Live regions
<div role="alert" aria-live="polite">
  Thread created successfully
</div>
```

### Touch Targets

```tsx
// Minimum 44×44px for interactive elements
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>
```

---

## Data Visualization

### Chart Colors (Series up to 6)

```css
--chart-1: #5E7D4A  /* Olive 500 */
--chart-2: #2D6CDF  /* Sky 500 */
--chart-3: #8A6B3D  /* Tawny 500 */
--chart-4: #96B380  /* Olive 300 */
--chart-5: #86A9F6  /* Sky 300 */
--chart-6: #C1A576  /* Tawny 300 */
```

### Chart Guidelines

- Gridlines: Neutral 200
- Axes: 12px/16px text
- Tooltips: Surface with shadow-e2
- Maintain accessibility: Patterns + colors
- Legend: Below chart on mobile, right on desktop

---

## Content & Tone

### Voice Principles

- **Helpful:** Guide users with clear, actionable language
- **Concise:** Respect user time, avoid fluff
- **Warm:** Friendly without being unprofessional
- **Active:** Use active voice, direct address

### Microcopy Examples

#### Success Messages
```
✅ "All set — your file is in the knowledge base."
✅ "Thread posted! Students will see it in a moment."
```

#### Warnings
```
⚠️ "This looks like an assessment. AI will provide hints only."
⚠️ "Are you sure? This will delete the thread permanently."
```

#### Empty States
```
📭 "No threads yet. Start by asking your first question."
📊 "No metrics to show. Check back after students post questions."
```

#### Error Messages
```
❌ "Couldn't post thread. Please check your connection and try again."
❌ "File too large. Maximum size is 25MB."
```

---

## Implementation Checklist

### For Developers

- [ ] Use CSS custom properties from `globals.css`
- [ ] Apply QDS radius scale (`--radius-sm` to `--radius-2xl`)
- [ ] Use QDS shadows (`--shadow-e1`, `--shadow-e2`, `--shadow-e3`)
- [ ] Implement hover/focus/disabled states
- [ ] Ensure 44×44px minimum touch targets
- [ ] Add proper ARIA labels and roles
- [ ] Test keyboard navigation
- [ ] Honor `prefers-reduced-motion`
- [ ] Verify color contrast (4.5:1 minimum)
- [ ] Support light and dark themes

### For Designers

- [ ] Use QDS color palette (no custom colors without approval)
- [ ] Follow type scale (no arbitrary font sizes)
- [ ] Apply 4pt spacing grid
- [ ] Use elevation system for depth
- [ ] Design for light and dark themes simultaneously
- [ ] Annotate interactive states (hover, focus, disabled)
- [ ] Specify ARIA labels for icons and controls
- [ ] Document component variants and usage

---

## QA & Quality Gates

### Automated Checks

```bash
# Lighthouse audit (Desktop)
npx lighthouse https://quokka.demo --preset=desktop --only-categories=accessibility

# Axe accessibility checks
npm run test:a11y

# Visual regression
npm run test:visual
```

**Minimum Scores:**
- Lighthouse Desktop: ≥ 95
- Lighthouse Mobile: ≥ 90
- Axe violations: 0

### Manual Checks

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast passes WCAG AA
- [ ] Touch targets are at least 44×44px
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dark mode renders correctly
- [ ] Responsive design works at 360px, 768px, 1024px, 1280px

---

## Future Roadmap

### Phase 2 (Q1 2026)
- [ ] Tokenized Storybook with all components
- [ ] Expanded AI patterns (multi-turn conversations)
- [ ] Email templates matching QDS
- [ ] Dense density mode for power users

### Phase 3 (Q2 2026)
- [ ] Animation library with Framer Motion
- [ ] Component variants for LMS embedding
- [ ] Accessibility overlay for colorblind modes
- [ ] Internationalization tokens

---

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

---

## Brand Do/Don't

### ✅ DO
- Keep tones warm but restrained
- Use whitespace generously
- Keep motion subtle and purposeful
- Design for accessibility first
- Use semantic color tokens
- Follow the spacing grid

### ❌ DON'T
- Overuse animal imagery in workflows
- Reduce contrast for style
- Rely on color alone for meaning
- Create new colors outside the palette
- Disable focus indicators
- Ignore keyboard navigation

---

**End of QDS Implementation Guide v1.0**

*For questions or contributions, contact the design systems team.*

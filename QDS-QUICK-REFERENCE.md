# QDS Quick Reference

**Quokka Design System v1.0** — Cheat sheet for developers

---

## Color Tokens

### Semantic Colors
```tsx
// Primary (Quokka Brown)
<Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Primary Action
</Button>

// Secondary (Rottnest Olive)
<Button className="bg-secondary text-secondary-foreground hover:bg-secondary-hover">
  Secondary Action
</Button>

// Accent (Clear Sky)
<a className="text-accent hover:text-accent-hover">Link</a>

// Support
<Badge className="bg-success text-white">Success</Badge>
<Badge className="bg-warning text-white">Warning</Badge>
<Badge className="bg-danger text-white">Error</Badge>
<Badge className="bg-info text-white">Info</Badge>
```

### Neutrals
```tsx
<div className="bg-neutral-50">Lightest gray</div>
<div className="text-neutral-500">Medium gray text</div>
<div className="border-neutral-200">Default border</div>
```

---

## Spacing (4pt Grid)

```tsx
// Common spacing
gap-1   // 4px
gap-2   // 8px
gap-3   // 12px
gap-4   // 16px
gap-6   // 24px
gap-8   // 32px
gap-12  // 48px
gap-16  // 64px

// Example
<div className="flex flex-col gap-4">  {/* 16px between children */}
  <div className="p-6">               {/* 24px padding */}
```

---

## Border Radius

```tsx
rounded-sm    // 6px  - Small chips, badges
rounded-md    // 10px - Inputs, small cards
rounded-lg    // 16px - Default cards, buttons
rounded-xl    // 20px - Large cards
rounded-2xl   // 24px - Modal dialogs

// Example
<Card className="rounded-lg">Card</Card>
<Badge className="rounded-md">Badge</Badge>
<Modal className="rounded-2xl">Modal</Modal>
```

---

## Elevation (Shadows)

```tsx
shadow-e1   // Subtle - Default cards
shadow-e2   // Medium - Dropdowns, popovers
shadow-e3   // High   - Modals, overlays

// Example
<Card className="shadow-e1 hover:shadow-e2 transition-shadow">
  Hover to lift
</Card>
```

---

## Typography

```tsx
// Headings
<h1 className="text-3xl font-bold">Page Title</h1>        {/* 32px */}
<h2 className="text-2xl font-semibold">Section</h2>      {/* 24px */}
<h3 className="text-xl font-semibold">Subsection</h3>    {/* 20px */}

// Body
<p className="text-base">Default body text</p>           {/* 16px */}
<p className="text-sm text-muted-foreground">Helper</p>  {/* 14px */}
<span className="text-xs">Caption</span>                 {/* 12px */}
```

---

## Common Patterns

### Thread Card
```tsx
<Card className="rounded-lg shadow-e1 hover:shadow-e2 transition-shadow">
  <CardHeader>
    <h3 className="text-lg font-semibold">{thread.title}</h3>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Avatar className="size-6" />
      <span>{author.name}</span>
      <Badge variant="outline">{author.role}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground line-clamp-3">
      {thread.excerpt}
    </p>
  </CardContent>
</Card>
```

### AI Answer
```tsx
<Card className="border-l-4 border-l-accent bg-accent/5">
  <CardHeader>
    <div className="flex items-center gap-2">
      <Sparkles className="size-5 text-accent" />
      <span className="font-semibold">AI Answer</span>
      <Badge className="bg-success/10 text-success border-success/20">
        High Confidence
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    {answer.text}
  </CardContent>
</Card>
```

### Confidence Chip
```tsx
{/* High */}
<Badge className="bg-success/10 text-success border border-success/20">
  High Confidence
</Badge>

{/* Medium */}
<Badge className="bg-info/10 text-info border border-info/20">
  Medium Confidence
</Badge>

{/* Low */}
<Badge className="bg-warning/10 text-warning border border-warning/20">
  Low Confidence
</Badge>
```

### Button States
```tsx
{/* Default */}
<Button className="bg-primary hover:bg-primary-hover active:bg-primary-pressed">
  Click me
</Button>

{/* With loading */}
<Button disabled className="opacity-50 cursor-not-allowed">
  <Loader2 className="animate-spin size-4 mr-2" />
  Loading...
</Button>
```

### Input with Label
```tsx
<div className="space-y-2">
  <label htmlFor="search" className="text-sm font-medium">
    Search
  </label>
  <Input
    id="search"
    type="text"
    placeholder="Search threads..."
    className="h-10 rounded-md border-neutral-300 focus:ring-2 focus:ring-accent"
  />
  <p className="text-xs text-muted-foreground">
    Search by keyword or author
  </p>
</div>
```

---

## Accessibility Checklist

```tsx
// ✅ Always provide ARIA labels
<Button aria-label="Close dialog">
  <X className="size-4" />
</Button>

// ✅ Use semantic HTML
<main>
  <article>
    <header>
      <h1>Title</h1>
    </header>
  </article>
</main>

// ✅ Ensure keyboard navigation
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Focus trapped here */}
  </DialogContent>
</Dialog>

// ✅ Provide focus indicators
<Button className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
  Focusable
</Button>

// ✅ Minimum touch targets (44x44px)
<Button className="min-h-[44px] min-w-[44px]">
  Tap me
</Button>
```

---

## Common Mistakes

### ❌ DON'T
```tsx
// Hardcoded colors
<div className="bg-[#8A6B3D]">Bad</div>

// Arbitrary spacing
<div className="gap-[13px]">Bad</div>

// Missing focus states
<button className="bg-primary">No focus ring</button>

// Color-only meaning
<span className="text-red-500">Error</span>  {/* No icon */}
```

### ✅ DO
```tsx
// Use semantic tokens
<div className="bg-primary">Good</div>

// Use spacing scale
<div className="gap-4">Good</div>

// Visible focus
<button className="bg-primary focus-visible:ring-2 focus-visible:ring-accent">
  Good
</button>

// Icon + color for meaning
<div className="flex items-center gap-2 text-danger">
  <AlertCircle className="size-4" />
  <span>Error</span>
</div>
```

---

## Breakpoints

```tsx
// Mobile-first approach
<div className="
  grid
  grid-cols-1     // Mobile (default)
  md:grid-cols-2  // Tablet (768px+)
  lg:grid-cols-3  // Desktop (1024px+)
  xl:grid-cols-4  // Large desktop (1280px+)
">
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## Dark Mode

All QDS tokens automatically adapt to dark mode when `.dark` class is applied:

```tsx
// These work in both light and dark
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    <Button className="bg-primary text-primary-foreground">
      Auto-adapts
    </Button>
  </Card>
</div>
```

---

## Animation

```tsx
// Durations
transition-all duration-[120ms]   // Fast (taps)
transition-all duration-[180ms]   // Medium (hover)
transition-all duration-[240ms]   // Slow (overlays)

// Common transitions
<Button className="transition-colors duration-[180ms] hover:bg-primary-hover">
  Smooth hover
</Button>

<Card className="transition-shadow duration-[180ms] hover:shadow-e2">
  Elevate on hover
</Card>

// Respect reduced motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Chart Colors

```tsx
const chartData = [
  { name: 'Series 1', color: 'var(--chart-1)' }, // Olive 500
  { name: 'Series 2', color: 'var(--chart-2)' }, // Sky 500
  { name: 'Series 3', color: 'var(--chart-3)' }, // Tawny 500
  { name: 'Series 4', color: 'var(--chart-4)' }, // Olive 300
  { name: 'Series 5', color: 'var(--chart-5)' }, // Sky 300
]
```

---

## Resources

- **Full Guide:** [QDS.md](QDS.md)
- **Project Docs:** [CLAUDE.md](CLAUDE.md)
- **Design Tokens:** [app/globals.css](app/globals.css)

---

*Keep this reference handy while building!*

# QDS Styling Plan: AI SDK Elements Integration

**Date:** 2025-10-17
**Author:** QDS Compliance Auditor
**Target:** Components in `components/ai/elements/` (QDS wrappers for AI SDK Elements)

---

## Overview

This plan defines **exact CSS classes, token mappings, and component-level styling** required to integrate AI SDK Elements with QDS glass morphism aesthetic while maintaining accessibility and performance.

**Approach:** Hybrid styling - use AI Elements structural components, completely rebuild visual appearance with QDS tokens.

---

## Token Mapping Table

### AI Elements → QDS Token Replacements

| AI Elements Default | QDS Replacement | Rationale |
|---------------------|-----------------|-----------|
| `bg-card` | `bg-glass-strong` | Maintain translucent glass aesthetic |
| `border` | `border-[var(--border-glass)]` | Glass border for consistency |
| `rounded-lg` | `rounded-2xl` | Larger radius for message bubbles |
| `shadow-sm` | `shadow-glass-sm` | Diffuse glass shadow |
| `p-4` | `p-3` | Compact spacing (12px) on 4pt grid |
| `gap-2` | `gap-3` | Consistent 12px spacing |
| `text-card-foreground` | `text-foreground` + `.glass-text` | Readability on glass |

### New Tokens to Add (globals.css)

```css
:root {
  /* Glass Hover State */
  --glass-hover: rgba(255, 255, 255, 0.5);

  /* Glass Focus Ring */
  --focus-ring-glass: rgba(45, 108, 223, 0.6);

  /* Message Role Backgrounds */
  --message-user-bg: rgba(45, 108, 223, 0.9);  /* accent/90 */
  --message-user-border: rgba(45, 108, 223, 0.3);  /* accent/30 */
  --message-assistant-bg: var(--glass-strong);
  --message-assistant-border: var(--border-glass);
}

.dark {
  --glass-hover: rgba(23, 21, 17, 0.5);
  --focus-ring-glass: rgba(134, 169, 246, 0.7);
  --message-user-bg: rgba(134, 169, 246, 0.9);
  --message-user-border: rgba(134, 169, 246, 0.3);
}
```

---

## Component Styling Specifications

### 1. QDSConversation (Wrapper for AI Elements Conversation)

**File:** `components/ai/elements/qds-conversation.tsx`

**Structure:**
```tsx
<div className="flex flex-col h-full overflow-hidden">
  <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">
    {/* AI Elements Conversation component renders here */}
  </div>
</div>
```

**CSS Classes:**
```tsx
className={cn(
  "flex flex-col h-full overflow-hidden",
  className
)}

// Inner container
className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4"
```

**Rationale:**
- `sidebar-scroll`: Custom scrollbar styling (defined in globals.css)
- `p-4` (16px): Standard padding for message container
- `space-y-4` (16px): Vertical spacing between messages

**Dark Mode:** Inherits from parent (no component-specific overrides)

**Accessibility:**
```tsx
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-relevant="additions"
  aria-label="Chat message history"
>
```

---

### 2. QDSMessage (Wrapper for AI Elements Message)

**File:** `components/ai/elements/qds-message.tsx`

**Structure:**
```tsx
<div className={cn(
  "mb-4",
  role === "user" ? "flex justify-end" : "flex justify-start"
)}>
  <div className={cn(
    "max-w-[85%] p-3 rounded-2xl",
    role === "user" ? "message-user" : "message-assistant",
    hasCitations && role === "assistant" && "border-l-2 border-accent"
  )}>
    {/* Message content */}
  </div>
</div>
```

**CSS Classes Breakdown:**

**Outer Container:**
```tsx
className={cn(
  "mb-4",  // Bottom margin between messages (16px)
  role === "user" ? "flex justify-end" : "flex justify-start"
)}
```

**Inner Bubble:**
```tsx
className={cn(
  "max-w-[85%]",  // Prevent full width
  "p-3",  // Compact padding (12px)
  "rounded-2xl",  // Large radius (24px)
  role === "user" ? "message-user" : "message-assistant",
  hasCitations && role === "assistant" && "border-l-2 border-accent"
)}
```

**Utility Classes Used:**
```css
/* .message-user (defined in globals.css) */
.message-user {
  @apply backdrop-blur-md bg-accent/90 text-accent-foreground border border-accent/30 rounded-2xl;
  box-shadow: var(--shadow-glass-sm);
}

/* .message-assistant (defined in globals.css) */
.message-assistant {
  @apply backdrop-blur-md bg-glass-strong border text-foreground rounded-2xl;
  border-color: var(--border-glass);
  box-shadow: var(--shadow-glass-sm);
}
```

**Text Content:**
```tsx
<div className="text-sm leading-relaxed whitespace-pre-wrap glass-text">
  {content}
</div>
```

**Dark Mode:** Handled by `.message-user` and `.message-assistant` utilities

**Accessibility:**
```tsx
<div aria-label={role === "user" ? "You said" : "Quokka said"}>
```

**State Variants:**

*With Citations (Assistant only):*
```tsx
className="border-l-2 border-accent"  // Visual indicator
```

*Loading/Streaming:*
```tsx
<div className="flex justify-start">
  <div className="message-assistant p-3">
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden="true">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
      <p className="text-sm glass-text">Quokka is thinking...</p>
    </div>
  </div>
</div>
```

---

### 3. QDSResponse (Wrapper for AI Elements Response - Streaming)

**File:** `components/ai/elements/qds-response.tsx`

**Structure:**
```tsx
<div className="flex justify-start" role="status" aria-live="polite">
  <div className="message-assistant p-3">
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden="true">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
      <p className="text-sm glass-text">Quokka is thinking...</p>
    </div>
  </div>
</div>
```

**CSS Classes:**
- Same as `QDSMessage` with `role="assistant"`
- Custom loading animation with QDS primary color

**Animation:**
```tsx
animate-bounce  // Tailwind built-in
[animation-delay:-0.3s]  // Stagger timing
```

**Dark Mode:** Inherits from `.message-assistant`

**Accessibility:**
```tsx
role="status"
aria-live="polite"
```

---

### 4. QDSPromptInput (Wrapper for AI Elements PromptInput)

**File:** `components/ai/elements/qds-prompt-input.tsx`

**Structure:**
```tsx
<div className="border-t border-[var(--border-glass)] p-4">
  <form onSubmit={handleSubmit} className="flex gap-2">
    <Input
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Ask me anything..."
      disabled={isStreaming}
      className="flex-1 text-sm"
      aria-label="Message input"
    />
    {isStreaming ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStop}
        className="shrink-0 min-h-[44px] min-w-[44px]"
        aria-label="Stop generation"
      >
        <StopCircle className="h-4 w-4" />
      </Button>
    ) : (
      <Button
        type="submit"
        variant="glass-primary"
        size="sm"
        disabled={!input.trim()}
        className="shrink-0 min-h-[44px] min-w-[44px]"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    )}
  </form>
</div>
```

**CSS Classes:**

**Container:**
```tsx
className="border-t border-[var(--border-glass)] p-4"
```
- Glass border separator
- Standard padding (16px)

**Form:**
```tsx
className="flex gap-2"
```
- 8px gap (4pt grid)

**Input:**
```tsx
className="flex-1 text-sm"
```
- Full width minus button
- Small text (14px)

**Button:**
```tsx
variant="glass-primary"
size="sm"
className="shrink-0 min-h-[44px] min-w-[44px]"
```
- Glass primary button (QDS variant)
- Small size
- Minimum touch target (44x44px - WCAG 2.5.5)

**Dark Mode:** Handled by glass border and button variants

**Accessibility:**
- ARIA labels on all buttons
- Proper form semantics
- Disabled states

---

### 5. QDSSource (Wrapper for AI Elements Source - Citations)

**File:** `components/ai/elements/qds-source.tsx`

**Structure:**
```tsx
<div className="border-l-4 border-accent/40 bg-accent/5 rounded-md dark:bg-accent/10 dark:border-accent/30">
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className={cn(
      "flex items-center gap-2 w-full px-4 py-3",
      "text-sm font-medium text-gray-700 dark:text-gray-200",
      "hover:bg-accent/10 dark:hover:bg-accent/15",
      "transition-colors rounded-t-md",
      "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    )}
  >
    {/* Chevron, icon, label */}
  </button>

  {isExpanded && (
    <div className="px-4 pb-4 space-y-2">
      {/* Citation items */}
    </div>
  )}
</div>
```

**CSS Classes:**

**Outer Container:**
```tsx
className={cn(
  "border-l-4 border-accent/40 bg-accent/5 rounded-md",
  "dark:bg-accent/10 dark:border-accent/30"
)}
```
- Accent left border (semantic: external reference)
- Translucent accent background
- Dark mode variants

**Toggle Button:**
```tsx
className={cn(
  "flex items-center gap-2 w-full",
  "px-4 py-3",  // Standard padding
  "text-sm font-medium",
  "text-gray-700 dark:text-gray-200",
  "hover:bg-accent/10 dark:hover:bg-accent/15",
  "transition-colors",
  "rounded-t-md",
  "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
)}
```

**Citation Item:**
```tsx
className={cn(
  "flex items-start gap-3 p-3 rounded-md",
  "bg-white/50 dark:bg-gray-800/50",
  "border border-gray-200/50 dark:border-gray-700/50",
  "hover:border-accent/40 dark:hover:border-accent/30",
  "transition-colors"
)}
```

**Citation Number Badge:**
```tsx
className={cn(
  "flex-shrink-0 flex items-center justify-center",
  "h-6 w-6 rounded-full",
  "bg-accent/20 dark:bg-accent/30",
  "text-xs font-semibold text-accent-foreground"
)}
```

**Dark Mode:** Explicit dark: variants for all elements

**Accessibility:**
```tsx
aria-expanded={isExpanded}
aria-controls="sources-list"
role="list"
aria-label="Cited course materials"
```

---

### 6. QDSInlineCitation (Wrapper for AI Elements InlineCitation)

**File:** `components/ai/elements/qds-inline-citation.tsx`

**Structure:**
```tsx
<span
  className="citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold bg-accent/20 text-accent-foreground hover:bg-accent/30 cursor-pointer transition-colors"
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  title={citation.title}
  role="button"
  tabIndex={0}
  aria-label={`Citation ${citation.id}: ${citation.title}`}
>
  [{citation.id}]
</span>
```

**CSS Classes:**
```tsx
className={cn(
  "citation-marker",
  "inline-block",
  "px-1 py-0.5 mx-0.5",  // Compact badge padding
  "rounded",  // Small radius (6px)
  "text-xs font-semibold",
  "bg-accent/20 text-accent-foreground",
  "hover:bg-accent/30",
  "cursor-pointer",
  "transition-colors"
)}
```

**Interaction:**
```tsx
onClick={() => {
  const sourcesElement = document.querySelector(`[data-citation-id="${id}"]`);
  sourcesElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}}

onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    // Same as onClick
  }
}}
```

**Dark Mode:** Inherits accent color (works in both themes)

**Accessibility:**
- Keyboard navigable (`tabIndex={0}`)
- ARIA label with citation title
- Proper role (`button`)

---

### 7. QDSActions (Wrapper for AI Elements Actions - Message Actions)

**File:** `components/ai/elements/qds-actions.tsx`

**Structure:**
```tsx
<div className="flex items-center gap-1 mt-1 ml-1">
  <Button
    variant="ghost"
    size="sm"
    onClick={onCopy}
    className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
    aria-label="Copy message"
  >
    <Copy className="h-3 w-3 mr-1" />
    Copy
  </Button>

  {showRetry && (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRetry}
      disabled={isStreaming}
      className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
      aria-label="Retry generation"
    >
      <RefreshCcw className="h-3 w-3 mr-1" />
      Retry
    </Button>
  )}
</div>
```

**CSS Classes:**

**Container:**
```tsx
className="flex items-center gap-1 mt-1 ml-1"
```
- 4px gap (tight grouping)
- Aligned with message bubble

**Button:**
```tsx
variant="ghost"
size="sm"
className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
```
- Ghost variant (transparent)
- Small size (8px height)
- Compact padding (8px horizontal)
- Extra small text (12px)
- **NEW:** Glass hover state (`--glass-hover` token)

**Icon:**
```tsx
className="h-3 w-3 mr-1"
```
- 12px icon size
- 4px right margin

**Dark Mode:** Handled by `--glass-hover` token

**Accessibility:**
- ARIA labels on all action buttons
- Disabled states for streaming

---

## Glass Morphism Application Strategy

### Layer Hierarchy (Max 3 Blur Layers)

**Layer 1 (Modal Container):**
```tsx
<DialogContent className="glass-panel-strong">
```
- **Blur:** `blur-lg` (16px)
- **Background:** `var(--glass-strong)`
- **Shadow:** `var(--shadow-glass-lg)`
- **Purpose:** Main container separation from background

**Layer 2 (Message Bubbles):**
```tsx
<div className="message-user | message-assistant">
```
- **Blur:** `blur-md` (12px)
- **Background:** `var(--accent)/90` (user) or `var(--glass-strong)` (assistant)
- **Shadow:** `var(--shadow-glass-sm)`
- **Purpose:** Message content separation

**Layer 3 (NONE - Removed):**
- Input container does NOT use backdrop-filter
- Citation panels do NOT use backdrop-filter
- Action buttons do NOT use backdrop-filter

**Result:** Stay within 2 blur layers (below 3-layer limit)

### Mobile Optimization

**Reduce Blur on Small Screens:**
```css
@media (max-width: 767px) {
  .glass-panel-strong {
    backdrop-filter: blur(var(--blur-md));  /* Reduced from lg */
  }

  .message-user,
  .message-assistant {
    backdrop-filter: blur(var(--blur-sm));  /* Reduced from md */
  }
}
```

**Performance Safeguards:**
```css
.glass-panel,
.glass-panel-strong,
.message-user,
.message-assistant {
  will-change: backdrop-filter;
  contain: layout style paint;
  transform: translateZ(0);
}
```

---

## CSS Override Specifications

### File: `app/globals.css`

**New Utility Classes to Add:**

```css
/* ===== Glass Hover State ===== */
.shadow-glass-hover {
  box-shadow: var(--shadow-glass-md);
}

.dark .shadow-glass-hover {
  box-shadow: var(--shadow-glass-md);
}

/* ===== Enhanced Focus for Glass Panels ===== */
.glass-focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring-glass);
}

/* ===== Citation Marker Utility ===== */
.citation-marker {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  margin: 0 0.125rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  background-color: rgba(45, 108, 223, 0.2);  /* accent/20 */
  color: var(--accent-foreground);
  cursor: pointer;
  transition: background-color 250ms ease;
}

.citation-marker:hover {
  background-color: rgba(45, 108, 223, 0.3);  /* accent/30 */
}

.dark .citation-marker {
  background-color: rgba(134, 169, 246, 0.2);
  color: var(--accent-foreground);
}

.dark .citation-marker:hover {
  background-color: rgba(134, 169, 246, 0.3);
}
```

**New Tokens to Add:**

```css
:root {
  /* Glass Hover State */
  --glass-hover: rgba(255, 255, 255, 0.5);

  /* Glass Focus Ring */
  --focus-ring-glass: rgba(45, 108, 223, 0.6);
}

.dark {
  --glass-hover: rgba(23, 21, 17, 0.5);
  --focus-ring-glass: rgba(134, 169, 246, 0.7);
}
```

**No Changes to Existing Tokens** - All current glass utilities remain as-is.

---

## Responsive Design Adjustments

### Breakpoints

| Breakpoint | Width | AI Elements Behavior |
|------------|-------|---------------------|
| `xs` | 360px | Single column, full width messages |
| `sm` | 640px | Single column, max-width messages (85%) |
| `md` | 768px | Same as sm |
| `lg` | 1024px | Same as md (modal is fixed width) |
| `xl` | 1280px | Modal expands to max-w-7xl |

### Mobile-Specific Overrides

**Modal Container:**
```tsx
<DialogContent className={cn(
  "max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl",
  "h-[95vh]",
  "glass-panel-strong"
)}>
```

**Message Bubbles:**
```tsx
<div className={cn(
  "max-w-[85%]",  // Desktop
  "sm:max-w-[80%]",  // Tablet (more space)
  "lg:max-w-[75%]"  // Large desktop (even more space)
)}>
```

**Input Area:**
```tsx
<Button
  size="sm"
  className={cn(
    "min-h-[44px] min-w-[44px]",  // WCAG 2.5.5 touch target
    "sm:min-h-[40px] sm:min-w-[40px]"  // Slightly smaller on desktop
  )}
>
```

**Quick Prompts (Mobile Layout):**
```tsx
<div className="flex flex-wrap gap-2">
  {prompts.map(prompt => (
    <Button
      variant="outline"
      size="default"
      className="text-xs min-h-[44px]"  // Touch target
    >
      {prompt}
    </Button>
  ))}
</div>
```

---

## Dark Mode Strategy

### Approach: Token-Based (No Component Overrides)

All dark mode styling is handled via CSS custom properties in `globals.css`. Components reference tokens only.

**Example:**
```tsx
// Component uses token reference
<div className="bg-glass-strong border-[var(--border-glass)]">
```

**Token automatically switches:**
```css
:root {
  --glass-strong: rgba(255, 255, 255, 0.6);  /* Light */
  --border-glass: rgba(255, 255, 255, 0.18);
}

.dark {
  --glass-strong: rgba(23, 21, 17, 0.6);  /* Dark */
  --border-glass: rgba(255, 255, 255, 0.08);
}
```

### Dark Mode Exceptions (Explicit Overrides)

**Sources Panel:**
```tsx
className={cn(
  "bg-accent/5 border-accent/40",  // Light
  "dark:bg-accent/10 dark:border-accent/30"  // Dark (more contrast)
)}
```

**Citation Items:**
```tsx
className={cn(
  "bg-white/50 border-gray-200/50",  // Light
  "dark:bg-gray-800/50 dark:border-gray-700/50"  // Dark
)}
```

**Text Colors:**
```tsx
className={cn(
  "text-gray-700",  // Light
  "dark:text-gray-200"  // Dark
)}
```

**Rationale:** These elements use semi-transparent backgrounds over glass, requiring explicit alpha adjustments for optimal contrast.

---

## Accessibility Verification Checklist

### Color Contrast (WCAG 2.2 AA)

**Text on Glass Backgrounds:**
- [ ] Verify `text-foreground` on `bg-glass-strong` ≥ 4.5:1
- [ ] Test with WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- [ ] Light mode: `#2A2721` on `rgba(255,255,255,0.6)` over gradient
- [ ] Dark mode: `#F3EFE8` on `rgba(23,21,17,0.6)` over gradient

**Citation Markers:**
- [ ] Verify `text-accent-foreground` on `bg-accent/20` ≥ 4.5:1
- [ ] Light: `#FFFFFF` on `rgba(45,108,223,0.2)`
- [ ] Dark: `#2A2721` on `rgba(134,169,246,0.2)`

**Action Buttons (Ghost variant):**
- [ ] Verify `text-foreground` on `hover:bg-[var(--glass-hover)]` ≥ 4.5:1
- [ ] Light: `#2A2721` on `rgba(255,255,255,0.5)`
- [ ] Dark: `#F3EFE8` on `rgba(23,21,17,0.5)`

**If Ratios Fail:**
- Increase alpha values: `/20` → `/25` or `/30`
- Darken foreground color (adjust `--foreground` token)
- Add stronger text-shadow: `0 1px 3px rgba(0,0,0,0.2)`

### Focus Indicators

**All Interactive Elements:**
- [ ] Focus ring is visible (3px+ width)
- [ ] Focus ring contrasts with background ≥ 3:1
- [ ] Focus state does not rely on color alone (add border/shadow)
- [ ] Tab order is logical (header → messages → input)

**Glass-Specific Focus:**
- [ ] Enhanced focus ring on glass backgrounds: `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5)`
- [ ] Verify visibility on both light/dark glass surfaces

### Keyboard Navigation

**Required Functionality:**
- [ ] Tab reaches all interactive elements (buttons, inputs, citation markers)
- [ ] Enter/Space activates buttons and citation markers
- [ ] Escape closes modal (if applicable)
- [ ] Arrow keys navigate between messages (optional enhancement)
- [ ] Focus trap within modal (prevent background interaction)

### Screen Reader Support

**ARIA Labels:**
- [ ] All icon-only buttons have `aria-label`
- [ ] Message container has `role="log"` and `aria-live="polite"`
- [ ] Streaming indicator has `role="status"` and `aria-live="polite"`
- [ ] Citation markers have descriptive labels: `aria-label="Citation 1: Lecture Title"`

**Semantic HTML:**
- [ ] Use `<button>` for actions, not `<div onClick>`
- [ ] Use `<form>` for input submission
- [ ] Use `<ul>`/`<li>` for citation lists (or `role="list"`)

### Touch Targets (WCAG 2.5.5)

**Minimum 44x44px:**
- [ ] Send button: `min-h-[44px] min-w-[44px]`
- [ ] Stop button: `min-h-[44px] min-w-[44px]`
- [ ] Quick prompt buttons: `min-h-[44px]`
- [ ] Citation markers: Consider increasing touch area (currently small)

**Spacing Between Targets:**
- [ ] Minimum 8px gap between adjacent buttons
- [ ] Action button row: `gap-1` (4px) → Consider `gap-2` (8px) for accessibility

---

## Implementation Order

### Phase 1: Foundation (Critical)

**1.1 Add New Tokens to `globals.css`**
- File: `app/globals.css`
- Add `--glass-hover`, `--focus-ring-glass`
- Add `.citation-marker` utility class
- Add `.glass-focus` utility class

**1.2 Create Wrapper Component Directory**
- Create `components/ai/elements/` directory
- Add `index.ts` barrel export

### Phase 2: Core Components (Medium)

**2.1 QDSMessage**
- File: `components/ai/elements/qds-message.tsx`
- Implement user/assistant message bubbles
- Add citation border indicator
- Test contrast ratios

**2.2 QDSResponse**
- File: `components/ai/elements/qds-response.tsx`
- Implement streaming indicator
- Custom loading animation

**2.3 QDSPromptInput**
- File: `components/ai/elements/qds-prompt-input.tsx`
- Implement input + send button
- Add stop button for streaming
- Verify touch targets (44x44px)

### Phase 3: Citations (Medium)

**3.1 QDSInlineCitation**
- File: `components/ai/elements/qds-inline-citation.tsx`
- Implement badge-style markers
- Add scroll-to-source functionality
- Verify keyboard navigation

**3.2 QDSSource**
- File: `components/ai/elements/qds-source.tsx`
- Implement collapsible sources panel
- Add citation items with numbering
- Test with multiple citations

### Phase 4: Supporting Components (Low)

**4.1 QDSActions**
- File: `components/ai/elements/qds-actions.tsx`
- Implement copy/retry actions
- Add glass hover state

**4.2 QDSConversation**
- File: `components/ai/elements/qds-conversation.tsx`
- Implement message container
- Add custom scrollbar styling

### Phase 5: Responsive & Dark Mode (Low)

**5.1 Mobile Optimization**
- Test all breakpoints (360px, 640px, 768px, 1024px, 1280px)
- Reduce blur on mobile (blur-md → blur-sm)
- Verify touch targets on mobile devices

**5.2 Dark Mode Testing**
- Toggle dark mode in browser DevTools
- Verify all token switches work
- Test contrast ratios in dark mode
- Check citation panel visibility

### Phase 6: Accessibility Audit (Critical)

**6.1 Automated Tests**
- Run Lighthouse accessibility audit
- Run axe DevTools
- Fix all violations

**6.2 Manual Tests**
- Keyboard navigation (Tab, Enter, Space, Escape)
- Screen reader (VoiceOver/NVDA)
- Color contrast verification (WebAIM)
- Touch target measurements

---

## Testing Checklist

### Visual Regression

**Appearance:**
- [ ] Message bubbles match current `message-user/message-assistant` style
- [ ] Glass borders are visible and subtle
- [ ] Shadows are diffuse (not sharp)
- [ ] Rounded corners are consistent (24px for bubbles)
- [ ] Spacing follows 4pt grid

**Responsive:**
- [ ] Modal fits on 360px screens
- [ ] Message max-width adjusts correctly (85% → 80% → 75%)
- [ ] Touch targets are ≥44px on mobile
- [ ] Text wraps properly in narrow viewports

**Dark Mode:**
- [ ] All glass tokens switch correctly
- [ ] Text remains readable on all backgrounds
- [ ] Citation panels have sufficient contrast
- [ ] Borders are visible in dark mode

### Functional Testing

**Message Rendering:**
- [ ] User messages align right
- [ ] Assistant messages align left
- [ ] Citations display with [1] [2] markers
- [ ] Sources panel is collapsible
- [ ] Streaming indicator shows during generation

**Interactions:**
- [ ] Send button submits message
- [ ] Stop button cancels generation
- [ ] Copy button copies message text
- [ ] Retry button regenerates response
- [ ] Citation markers scroll to sources

**Keyboard:**
- [ ] Tab navigates through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modal (if implemented)
- [ ] Focus indicators are always visible

**Screen Reader:**
- [ ] Messages announce with role (user/assistant)
- [ ] New messages announce via aria-live
- [ ] Streaming status announces
- [ ] Citation markers read descriptive labels

### Performance Testing

**Blur Layers:**
- [ ] Maximum 2 blur layers active (modal + bubbles)
- [ ] No blur on input, citations, actions
- [ ] Mobile uses reduced blur (sm instead of md)

**GPU Acceleration:**
- [ ] All glass elements have `transform: translateZ(0)`
- [ ] `will-change: backdrop-filter` is set
- [ ] `contain: layout style paint` is applied

**Fallback:**
- [ ] Test in browser without backdrop-filter support
- [ ] Verify fallback to solid backgrounds works
- [ ] Semantic tokens still apply (no visual breakage)

---

## Rollback Plan

If QDS styling causes issues:

**Immediate Rollback (Component-Level):**
1. Remove QDS wrapper components (`components/ai/elements/`)
2. Use AI Elements default styling
3. Revert QuokkaAssistantModal to current implementation

**Partial Rollback (Token-Level):**
1. Keep wrapper components but remove glass utilities
2. Replace `bg-glass-strong` with `bg-card` (solid)
3. Replace `border-[var(--border-glass)]` with `border` (standard)
4. Keep spacing/radius/shadow adjustments

**Token Safety:**
- All new tokens are additive (no existing tokens modified)
- Removing new utility classes won't break existing components
- Wrapper components are isolated in separate directory

---

## Success Criteria

**QDS Compliance:**
- ✅ All colors use semantic tokens (no hardcoded hex)
- ✅ All spacing follows 4pt grid (gap-1/2/3/4/6/8)
- ✅ All radius uses QDS scale (sm/md/lg/xl/2xl)
- ✅ All shadows use glass system (shadow-glass-sm/md/lg)
- ✅ Glass morphism aesthetic maintained

**Accessibility:**
- ✅ Text contrast ≥ 4.5:1 (AA standard)
- ✅ Focus indicators visible on all interactive elements
- ✅ Keyboard navigation works (Tab, Enter, Space)
- ✅ Screen reader announces messages correctly
- ✅ Touch targets ≥ 44x44px on mobile

**Performance:**
- ✅ ≤3 blur layers per view (currently 2)
- ✅ Mobile blur reduced for performance
- ✅ GPU acceleration enabled on glass elements
- ✅ No layout shift during blur rendering

**User Experience:**
- ✅ Visual consistency with current QuokkaAssistantModal
- ✅ Smooth transitions and animations
- ✅ Responsive at all breakpoints (360-1280px)
- ✅ Dark mode works correctly
- ✅ Citations are discoverable and navigable

---

## Related Files

**Implementation:**
- `components/ai/elements/qds-message.tsx`
- `components/ai/elements/qds-response.tsx`
- `components/ai/elements/qds-prompt-input.tsx`
- `components/ai/elements/qds-source.tsx`
- `components/ai/elements/qds-inline-citation.tsx`
- `components/ai/elements/qds-actions.tsx`
- `components/ai/elements/qds-conversation.tsx`
- `components/ai/elements/index.ts`

**Styling:**
- `app/globals.css` (new tokens and utilities)

**Reference:**
- `components/ai/quokka-assistant-modal.tsx` (current implementation)
- `components/ai/sources-panel.tsx` (citation panel reference)
- `QDS.md` (design system specification)

---

## Next Steps

1. Review Component Architect plan for AI Elements component structure
2. Create wrapper components in `components/ai/elements/`
3. Add new tokens to `globals.css`
4. Test contrast ratios with WebAIM Contrast Checker
5. Implement responsive breakpoints
6. Run accessibility audit (Lighthouse + axe)
7. Integration testing with QuokkaAssistantModal

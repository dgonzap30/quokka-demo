# QDS Gap Analysis: AI SDK Elements Integration

**Date:** 2025-10-17
**Analyst:** QDS Compliance Auditor
**Target:** AI SDK Elements components integration with QuokkaAssistantModal

---

## Executive Summary

AI SDK Elements are built on shadcn/ui foundation, which already uses QDS tokens. However, AI Elements will introduce **specific component patterns** (Message, Response, PromptInput, etc.) that require careful QDS styling alignment to match the existing QuokkaAssistantModal glass morphism aesthetic.

**Key Finding:** The project has a **mature QDS implementation** with comprehensive glass morphism utilities. The challenge is applying these to AI Elements' default component structure without breaking accessibility or semantic HTML.

---

## Current QDS Token Inventory

### Glass Morphism Tokens (Core Asset)

**Light Theme:**
```css
--glass-ultra: rgba(255, 255, 255, 0.4)    /* Ultra transparent */
--glass-strong: rgba(255, 255, 255, 0.6)   /* Strong glass effect */
--glass-medium: rgba(255, 255, 255, 0.7)   /* Default glass */
--glass-subtle: rgba(255, 255, 255, 0.85)  /* Subtle glass */
```

**Dark Theme:**
```css
--glass-ultra: rgba(23, 21, 17, 0.4)
--glass-strong: rgba(23, 21, 17, 0.6)
--glass-medium: rgba(23, 21, 17, 0.7)
--glass-subtle: rgba(23, 21, 17, 0.85)
```

**Backdrop Blur Scale:**
```css
--blur-xs: 4px    /* Minimal */
--blur-sm: 8px    /* Small */
--blur-md: 12px   /* Medium (default) */
--blur-lg: 16px   /* Large */
--blur-xl: 24px   /* Extra large */
--blur-2xl: 32px  /* Maximum */
```

**Glass Borders & Shadows:**
```css
/* Light */
--border-glass: rgba(255, 255, 255, 0.18)
--shadow-glass-sm: 0 2px 16px rgba(15, 14, 12, 0.04)
--shadow-glass-md: 0 4px 24px rgba(15, 14, 12, 0.06)
--shadow-glass-lg: 0 8px 32px rgba(15, 14, 12, 0.08)

/* Dark */
--border-glass: rgba(255, 255, 255, 0.08)
--shadow-glass-sm: 0 2px 16px rgba(0, 0, 0, 0.2)
--shadow-glass-md: 0 4px 24px rgba(0, 0, 0, 0.3)
--shadow-glass-lg: 0 8px 32px rgba(0, 0, 0, 0.4)
```

**Utility Classes (Prebuilt):**
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

.message-user {
  @apply backdrop-blur-md bg-accent/90 text-accent-foreground border border-accent/30 rounded-2xl;
  box-shadow: var(--shadow-glass-sm);
}

.message-assistant {
  @apply backdrop-blur-md bg-glass-strong border text-foreground rounded-2xl;
  border-color: var(--border-glass);
  box-shadow: var(--shadow-glass-sm);
}
```

### Color Tokens

**Primary (Quokka Brown):**
- `--primary: #8A6B3D` (light) / `#C1A576` (dark)
- `--primary-hover: #6F522C` / `#D8C193`
- `--primary-pressed: #5C4525` / `#EAD8B6`

**Secondary (Rottnest Olive):**
- `--secondary: #5E7D4A` / `#96B380`
- `--secondary-hover: #556B3B` / `#B8CEA3`

**Accent (Clear Sky):**
- `--accent: #2D6CDF` / `#86A9F6`
- `--accent-hover: #1F5CC0` / `#2D6CDF`

**AI-Specific (Purple Gradient):**
```css
--ai-purple-50 to --ai-purple-950 (spectrum)
--ai-gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)
```

### Spacing Scale (4pt Grid)

```
gap-1  (4px)
gap-2  (8px)
gap-3  (12px)
gap-4  (16px)
gap-6  (24px)
gap-8  (32px)
gap-12 (48px)
gap-16 (64px)
```

**Card/Section Spacing:**
- Card padding: `p-6` (24px)
- Section gaps: `gap-8` (32px)
- Inline elements: `gap-2` (8px)

### Radius Scale

```css
--radius-sm:  6px   /* Badges */
--radius-md:  10px  /* Buttons, inputs */
--radius-lg:  16px  /* Cards */
--radius-xl:  20px  /* Large cards */
--radius-2xl: 24px  /* Modals */
```

**Current Usage:**
- Message bubbles: `rounded-2xl` (24px)
- Modal container: `rounded-xl` (20px)
- Buttons: `rounded-md` (10px)

### Shadow System

```css
/* Elevation (Solid elements) */
--shadow-e1: 0 1px 2px rgba(15, 14, 12, 0.06)
--shadow-e2: 0 2px 8px rgba(15, 14, 12, 0.08)
--shadow-e3: 0 8px 24px rgba(15, 14, 12, 0.10)

/* Glass (Translucent elements) */
--shadow-glass-sm/md/lg (see above)

/* AI-Specific (Purple glow) */
--shadow-ai-sm: 0 1px 2px rgba(139, 92, 246, 0.08), 0 2px 8px rgba(139, 92, 246, 0.06)
--shadow-ai-md: 0 4px 12px rgba(139, 92, 246, 0.15), 0 2px 4px rgba(139, 92, 246, 0.1)
--shadow-ai-lg: 0 8px 24px rgba(139, 92, 246, 0.25), 0 4px 8px rgba(139, 92, 246, 0.15)
```

---

## Current QuokkaAssistantModal Styling Patterns

### Modal Container

```tsx
<DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0">
```

**Analysis:**
- Uses `glass-panel-strong` (blur-lg, strong glass background)
- Full viewport height (95vh)
- Responsive width breakpoints
- Zero padding (custom layout inside)

### Header

```tsx
<DialogHeader className="p-4 border-b border-[var(--border-glass)] space-y-3">
  <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center">
    <Sparkles className="h-5 w-5 text-white" />
  </div>
</DialogHeader>
```

**Analysis:**
- Glass border: `border-[var(--border-glass)]`
- AI gradient avatar: `.ai-gradient` utility
- QDS spacing: `p-4`, `space-y-3`
- Icon sizing: `h-5 w-5`

### Message Bubbles

**User Messages:**
```tsx
<div className="message-user p-3">
```
**Style:** `.message-user` utility
- `backdrop-blur-md bg-accent/90 text-accent-foreground`
- `border border-accent/30 rounded-2xl`
- `box-shadow: var(--shadow-glass-sm)`

**Assistant Messages:**
```tsx
<div className="message-assistant p-3">
```
**Style:** `.message-assistant` utility
- `backdrop-blur-md bg-glass-strong border text-foreground rounded-2xl`
- `border-color: var(--border-glass)`
- `box-shadow: var(--shadow-glass-sm)`

### Citations

**Inline Markers:**
```tsx
<span className="citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold bg-accent/20 text-accent-foreground hover:bg-accent/30 cursor-pointer transition-colors">
```

**Sources Panel:**
```tsx
<div className="border-l-4 border-accent/40 bg-accent/5 rounded-md dark:bg-accent/10 dark:border-accent/30">
```

**Analysis:**
- Accent color for semantic meaning (citations = external references)
- Left border accent: `border-l-4 border-accent/40`
- Translucent background: `bg-accent/5` (light) / `bg-accent/10` (dark)
- Hover states: `hover:bg-accent/30`

### Buttons

**Primary Action (Send):**
```tsx
<Button variant="glass-primary" size="sm">
```

**Secondary Actions (Copy, Retry):**
```tsx
<Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]">
```

**Analysis:**
- Glass variant buttons use existing `buttonVariants` CVA patterns
- Ghost buttons use glass hover state: `hover:bg-[var(--glass-hover)]`
- Consistent sizing: `size="sm"` (h-10/lg:h-9)

---

## AI SDK Elements Default Styling (Expected Patterns)

### Component Structure (From AI SDK React Docs)

AI Elements are **unstyled by default** and expect Tailwind customization. Based on shadcn/ui patterns, we expect:

**Conversation Component:**
```tsx
<Conversation>
  {/* Container for message stream */}
</Conversation>
```

**Message Component:**
```tsx
<Message role="user | assistant" />
```

**Response Component (Streaming):**
```tsx
<Response />
```

**PromptInput Component:**
```tsx
<PromptInput />
```

**Source Component (Citations):**
```tsx
<Source />
```

**InlineCitation Component:**
```tsx
<InlineCitation />
```

### Expected Default Styles (shadcn/ui Base)

Based on shadcn/ui conventions:

**Message Container:**
```tsx
// Expected default
<div className="flex flex-col gap-2">
  <div className="rounded-lg border bg-card p-4">
    {/* Message content */}
  </div>
</div>
```

**Conflict Areas:**
- **Border:** `border` (--border) vs `border-[var(--border-glass)]`
- **Background:** `bg-card` (solid) vs `bg-glass-strong` (translucent)
- **Radius:** `rounded-lg` (16px) vs `rounded-2xl` (24px) for bubbles
- **Padding:** `p-4` (16px) vs `p-3` (12px) for compact bubbles
- **Shadow:** `shadow-sm` (elevation) vs `shadow-glass-sm` (diffuse)

---

## Conflict Analysis

### 1. Background Opacity

**Current QDS:** Glass morphism with translucent backgrounds
```css
.message-assistant {
  background: var(--glass-strong);  /* rgba(255,255,255,0.6) */
}
```

**AI Elements Expected:** Solid card backgrounds
```css
.ai-message {
  background: var(--card);  /* #FFFFFF solid */
}
```

**Resolution:** Override `bg-card` with `bg-glass-strong` + `backdrop-blur-md`

### 2. Border Styling

**Current QDS:** Glass borders (translucent white)
```css
border: 1px solid var(--border-glass);  /* rgba(255,255,255,0.18) */
```

**AI Elements Expected:** Standard borders
```css
border: 1px solid var(--border);  /* #CDC7BD */
```

**Resolution:** Override all `border` with `border-[var(--border-glass)]`

### 3. Border Radius

**Current QDS:** Large radius for message bubbles
```css
.message-user { border-radius: var(--radius-2xl); }  /* 24px */
.message-assistant { border-radius: var(--radius-2xl); }
```

**AI Elements Expected:** Standard card radius
```css
.ai-message { border-radius: var(--radius-lg); }  /* 16px */
```

**Resolution:** Override `rounded-lg` with `rounded-2xl` for messages

### 4. Shadow System

**Current QDS:** Diffuse glass shadows
```css
box-shadow: var(--shadow-glass-sm);  /* Soft, diffuse */
```

**AI Elements Expected:** Standard elevation
```css
box-shadow: var(--shadow-e1);  /* Sharp, defined */
```

**Resolution:** Replace all shadow classes with `shadow-glass-sm/md/lg`

### 5. Spacing Consistency

**Current QDS:** 4pt grid (gap-1, gap-2, gap-3, gap-4, gap-6, gap-8)
```tsx
<div className="p-3 space-y-3">  {/* 12px consistent */}
```

**AI Elements Expected:** Mixed spacing (Tailwind defaults)
```tsx
<div className="p-4 space-y-2">  {/* 16px + 8px */}
```

**Resolution:** Standardize all spacing to QDS scale

### 6. Text Styling

**Current QDS:** Glass text shadows for readability
```css
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

**AI Elements Expected:** No text shadows
```css
/* Plain text */
```

**Resolution:** Apply `.glass-text` utility to all text inside glass panels

### 7. Color Tokens for Roles

**Current QDS:** Accent color for user, glass for assistant
```css
.message-user {
  background: var(--accent)/90;  /* Blue */
}
.message-assistant {
  background: var(--glass-strong);  /* Neutral */
}
```

**AI Elements Expected:** Semantic role colors (likely primary/secondary)
```css
.message-user {
  background: var(--primary);  /* Brown */
}
```

**Resolution:** Maintain QDS role colors (accent = user, glass = assistant)

---

## Missing Semantic Tokens

### Glass Hover State

**Need:** CSS variable for glass hover effect
```css
/* Currently hardcoded in component */
hover:bg-[var(--glass-hover)]

/* Should be in globals.css */
:root {
  --glass-hover: rgba(255, 255, 255, 0.5);
}

.dark {
  --glass-hover: rgba(23, 21, 17, 0.5);
}
```

### Glass Focus Ring

**Need:** Focus ring for glass backgrounds
```css
/* Currently uses default */
focus:ring-accent

/* Should have glass-specific focus */
:root {
  --focus-ring-glass: rgba(45, 108, 223, 0.6);
}

.dark {
  --focus-ring-glass: rgba(134, 169, 246, 0.7);
}
```

### Message Role Tokens

**Need:** Semantic tokens for message roles
```css
:root {
  --message-user-bg: rgba(45, 108, 223, 0.9);  /* accent/90 */
  --message-user-border: rgba(45, 108, 223, 0.3);  /* accent/30 */
  --message-assistant-bg: var(--glass-strong);
  --message-assistant-border: var(--border-glass);
}
```

---

## Dark Mode Issues

### Current Implementation

QDS has comprehensive dark mode support:
```css
.dark {
  --glass-ultra: rgba(23, 21, 17, 0.4);
  --glass-strong: rgba(23, 21, 17, 0.6);
  --border-glass: rgba(255, 255, 255, 0.08);
  --shadow-glass-sm: 0 2px 16px rgba(0, 0, 0, 0.2);
}
```

### Potential Conflicts

**AI Elements may use:**
```css
dark:bg-card  /* Solid dark background */
dark:border-border  /* Standard dark border */
```

**Override Required:**
```css
dark:bg-glass-strong  /* Maintain translucency */
dark:border-[var(--border-glass)]  /* Glass border */
```

**No new dark mode tokens needed** - existing glass tokens work.

---

## Accessibility Compliance Status

### Current QDS Contrast Ratios

**Light Theme:**
- Background: `#FFFFFF`
- Text: `#2A2721` (neutral-800)
- **Ratio:** 15.8:1 ✅ (AAA)

**Glass Backgrounds (Light):**
- `--glass-strong`: `rgba(255,255,255,0.6)` over gradient
- Text: `#2A2721`
- **Estimated Ratio:** 4.8:1 ✅ (AA) - needs verification with actual gradient

**Dark Theme:**
- Background: `#12110F`
- Text: `#F3EFE8` (neutral-50)
- **Ratio:** 16.2:1 ✅ (AAA)

**Glass Backgrounds (Dark):**
- `--glass-strong`: `rgba(23,21,17,0.6)` over gradient
- Text: `#F3EFE8`
- **Estimated Ratio:** 5.2:1 ✅ (AA) - needs verification

### Contrast Verification Needed

**Citation Markers:**
```css
bg-accent/20 text-accent-foreground  /* Need to verify 4.5:1+ */
```

**Action (Manual Check Required):**
1. Calculate actual contrast with gradient backgrounds
2. Test with WebAIM Contrast Checker
3. Adjust alpha values if needed (increase to /25 or /30)

**Glass Text Shadows:**
```css
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
```
**Purpose:** Improves readability on glass - maintains AA compliance

### Focus Indicators

**Current Implementation:**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}

.glass-panel *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.5);  /* Enhanced for glass */
}
```

**Status:** ✅ Compliant (3px+ ring with 4.5:1+ contrast)

### Keyboard Navigation

**Current Implementation:**
- All interactive elements are semantic buttons/inputs
- Tab order is logical (header → messages → input)
- ARIA labels on all icon-only buttons

**Status:** ✅ Compliant

### Screen Reader Support

**Current Implementation:**
```tsx
<div role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions" aria-label="Chat message history">
```

**Status:** ✅ Compliant (proper ARIA live regions)

---

## Component-Specific Analysis

### Expected AI Elements Components

Based on AI SDK React documentation and shadcn/ui patterns:

#### 1. Conversation Component

**Expected Structure:**
```tsx
<div className="flex flex-col gap-4 overflow-y-auto">
  {/* Messages container */}
</div>
```

**QDS Override:**
```tsx
className="flex flex-col gap-4 overflow-y-auto sidebar-scroll"
```
**Changes:** Added custom scrollbar styling (`.sidebar-scroll`)

#### 2. Message Component

**Expected Structure:**
```tsx
<div className={cn(
  "flex gap-3 p-4 rounded-lg border bg-card",
  role === "user" && "justify-end"
)}>
  {/* Message content */}
</div>
```

**QDS Override:**
```tsx
className={cn(
  "flex gap-3 p-3",
  role === "user" ? "justify-end" : "justify-start"
)}

// Inner bubble
<div className={cn(
  "max-w-[85%] rounded-2xl",
  role === "user" ? "message-user" : "message-assistant"
)}>
```

**Changes:**
- Removed `border bg-card` (solid)
- Added `message-user/message-assistant` utilities (glass)
- Changed `rounded-lg` → `rounded-2xl`
- Reduced padding `p-4` → `p-3`

#### 3. Response Component (Streaming)

**Expected Structure:**
```tsx
<div className="flex gap-3 p-4 rounded-lg border bg-card">
  <div className="animate-pulse">Loading...</div>
</div>
```

**QDS Override:**
```tsx
<div className="flex justify-start">
  <div className="message-assistant p-3">
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
      <p className="text-sm glass-text">Quokka is thinking...</p>
    </div>
  </div>
</div>
```

**Changes:**
- Custom bounce animation with QDS primary color
- Glass message bubble style
- Added `.glass-text` for readability

#### 4. PromptInput Component

**Expected Structure:**
```tsx
<form className="flex gap-2 p-4 border-t bg-card">
  <Input className="flex-1" />
  <Button type="submit">Send</Button>
</form>
```

**QDS Override:**
```tsx
<form className="flex gap-2 border-t border-[var(--border-glass)] p-4">
  <Input className="flex-1 text-sm" />
  <Button variant="glass-primary" size="sm" type="submit">
    <Send className="h-4 w-4" />
  </Button>
</form>
```

**Changes:**
- Glass border: `border-[var(--border-glass)]`
- Removed solid background
- Glass button variant
- Icon-only send button

#### 5. Source Component (Citation)

**Expected Structure:**
```tsx
<div className="rounded-lg border bg-card p-3">
  <p className="text-sm">{source.title}</p>
</div>
```

**QDS Override:**
```tsx
<div className="border-l-4 border-accent/40 bg-accent/5 rounded-md dark:bg-accent/10 dark:border-accent/30 p-3">
  <p className="text-sm">{source.title}</p>
</div>
```

**Changes:**
- Accent left border (semantic: external reference)
- Translucent accent background
- Dark mode variants

#### 6. InlineCitation Component

**Expected Structure:**
```tsx
<span className="text-accent underline cursor-pointer">[1]</span>
```

**QDS Override:**
```tsx
<span className="citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold bg-accent/20 text-accent-foreground hover:bg-accent/30 cursor-pointer transition-colors">
  [1]
</span>
```

**Changes:**
- Badge-style marker (more visible)
- Accent background (semantic)
- Hover state
- Proper spacing and sizing

---

## Performance Considerations

### Backdrop Filter Layers

**Current:** QuokkaAssistantModal uses 2-3 blur layers
1. Modal container: `glass-panel-strong` (blur-lg)
2. Message bubbles: `backdrop-blur-md`

**AI Elements Addition:** Could add 1-2 more layers
3. Input container: potential `glass-panel`
4. Action buttons: potential glass variants

**Risk:** Exceeds QDS guideline of 3 blur layers max per view

**Mitigation:**
- Limit blur to modal container only
- Use translucent backgrounds WITHOUT backdrop-filter for inner elements
- Test on mid-range devices (2018+ laptops)

### Mobile Performance

**Current Implementation:**
```css
@media (max-width: 767px) {
  .glass-panel {
    backdrop-filter: blur(var(--blur-sm));  /* Reduced from md */
  }
}
```

**AI Elements Override:**
- Apply mobile blur reduction to all AI Elements components
- Use `contain: layout style paint` for optimization
- Enable GPU acceleration: `transform: translateZ(0)`

---

## Browser Compatibility

### Backdrop Filter Support

**Current Fallback:**
```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: none;
  }
}
```

**Status:** ✅ Adequate (graceful degradation to solid backgrounds)

**AI Elements Implementation:**
- Wrap all glass utilities in `@supports` blocks
- Ensure fallback maintains semantic color tokens
- Test in Safari <9, Firefox <103

---

## Summary of Findings

### Critical Issues (Must Fix)

1. **Background Opacity Mismatch**
   - AI Elements will default to solid `bg-card`
   - Must override with `bg-glass-strong` + `backdrop-blur-md`

2. **Border Styling Conflict**
   - AI Elements will use `border` (standard)
   - Must override with `border-[var(--border-glass)]`

3. **Shadow System Incompatibility**
   - AI Elements will use elevation shadows (`shadow-e1`)
   - Must replace with glass shadows (`shadow-glass-sm`)

### Medium Priority Issues

4. **Spacing Inconsistencies**
   - Standardize all spacing to 4pt grid
   - Replace arbitrary `p-4` with `p-3` for compactness

5. **Radius Mismatch**
   - Replace `rounded-lg` with `rounded-2xl` for bubbles

6. **Missing Tokens**
   - Add `--glass-hover` variable
   - Add `--focus-ring-glass` variable

### Low Priority Issues

7. **Text Shadow Application**
   - Apply `.glass-text` utility to all content inside glass panels

8. **Role Color Semantics**
   - Ensure user=accent, assistant=glass consistency

---

## Recommendations

1. **Create QDS Wrapper Components** (`components/ai/elements/`)
   - Wrap AI Elements with QDS-styled containers
   - Example: `<QDSMessage>` wraps `<Message>` from AI SDK

2. **Extend `globals.css` with Missing Tokens**
   - Add `--glass-hover`, `--focus-ring-glass`

3. **Component-Level Overrides** (Not Global)
   - Keep AI Elements in default state
   - Apply QDS styling only to wrapped versions

4. **Accessibility Verification Required**
   - Manually test contrast ratios with WebAIM
   - Verify focus indicators on all interactive elements

5. **Performance Testing**
   - Test on mid-range devices (2018+ laptops)
   - Ensure <3 blur layers active at once

---

## Next Steps

1. Read Component Architect plan for AI Elements component structure
2. Create detailed styling plan in `plans/qds-styling.md`
3. Define exact CSS overrides and wrapper component props
4. Document responsive behavior and dark mode strategy
5. Create accessibility verification checklist

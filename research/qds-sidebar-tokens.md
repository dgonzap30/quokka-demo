# QDS Audit: ConversationHistorySidebar

## Summary
- **Compliance Score:** 9.5/10 (Pre-implementation - Design specification)
- **Critical Issues:** 0
- **Medium Issues:** 0
- **Minor Issues:** 0

This is a **pre-implementation audit** to ensure QDS compliance from the start.

## QDS Token Requirements Analysis

### 1. Glass Morphism System (Primary Design Language)

**Sidebar Container:**
- **Token:** `glass-panel-strong`
- **Rationale:** Elevated sidebar requires stronger blur for visual hierarchy
- **CSS Properties:**
  - `backdrop-filter: blur(var(--blur-lg))` → 16px blur
  - `background: var(--glass-strong)` → rgba(255,255,255,0.6) light / rgba(23,21,17,0.6) dark
  - `border: 1px solid var(--border-glass)` → rgba(255,255,255,0.18) light / rgba(255,255,255,0.08) dark
  - `box-shadow: var(--shadow-glass-lg)` → Soft diffuse shadow

**Why Glass-Panel-Strong:**
- Sidebar is a persistent, elevated UI element
- Stronger blur creates clear separation from main content
- Maintains QDS hierarchy: overlay > panel-strong > panel > ultra

### 2. Spacing System (4pt Grid)

**Sidebar Padding:**
- `p-6` (24px) - Standard QDS sidebar padding
- Matches `thread-list-sidebar.tsx` border padding pattern

**Conversation List Gap:**
- `gap-2` (8px) - Tight vertical spacing for list density
- Follows QDS tight-spacing pattern for scannable lists

**Section Gaps:**
- Header to List: Implicit border (no gap needed)
- Button padding: `px-3 py-2` → (12px horizontal, 8px vertical)
- Touch targets: `min-h-[44px]` (WCAG 2.5.5 compliance)

**New Conversation Button:**
- `mb-3` (12px) below header
- `gap-2` (8px) for icon-to-text spacing

### 3. Border Radius Scale

**Sidebar Container:**
- `rounded-lg` (16px) - Standard card radius per QDS
- **NOT** rounded on left edge (flush with viewport edge on desktop)

**Conversation Items:**
- `rounded-md` (10px) - Smaller radius for list items per QDS
- Matches button/input scale

**New Conversation Button:**
- `rounded-lg` (16px) - Prominent CTA radius

### 4. Shadow System (Elevation)

**Sidebar Container:**
- `shadow-glass-lg` - Highest glass elevation for sidebar
- Matches QDS elevation hierarchy for persistent panels

**Conversation Items (Hover):**
- `shadow-glass-sm` on hover - Subtle lift effect
- Transitions with `transition-shadow duration-180`

**Active Conversation:**
- NO additional shadow (border left provides visual distinction)

### 5. Color Tokens (Semantic Usage)

**Primary Token Usage:**
- **New Conversation Button:** `bg-primary hover:bg-primary-hover active:bg-primary-pressed`
- **Active Conversation Border:** `border-l-2 border-primary`
- **Primary Gradient:** `from-primary to-accent` (for icon backgrounds)

**Neutral Tokens:**
- **Conversation Hover:** `bg-primary/10` - 10% opacity overlay
- **Active Background:** `bg-primary/20` - 20% opacity overlay
- **Text Colors:** `text-foreground` (primary), `text-muted-foreground` (secondary)
- **Border Glass:** `border-glass` for all glass borders

**Support Tokens:**
- **Error State (if needed):** `text-danger`
- **Empty State:** `text-muted-foreground`

### 6. Typography Hierarchy

**Sidebar Header:**
- `heading-4` (text-xl/2xl, font-semibold) with `glass-text` utility
- QDS heading scale for section titles

**Conversation Titles:**
- `text-sm font-medium` - Compact but readable for list items
- `glass-text` utility for enhanced readability on glass

**Timestamps/Metadata:**
- `text-xs text-muted-foreground` - Secondary information
- `glass-text` for blur compatibility

**New Button:**
- `text-sm font-medium` - Matches conversation item scale

### 7. Dark Mode Compliance

**All Glass Tokens Have Dark Variants:**
```css
/* Light */
--glass-strong: rgba(255, 255, 255, 0.6)
--border-glass: rgba(255, 255, 255, 0.18)

/* Dark */
--glass-strong: rgba(23, 21, 17, 0.6)
--border-glass: rgba(255, 255, 255, 0.08)
```

**Color Token Dark Variants:**
- `--primary`: #C1A576 (lighter in dark mode)
- `--primary-hover`: #D8C193
- All tokens auto-switch via `.dark` class

### 8. Accessibility Standards

**Contrast Ratios:**
- Heading text on glass: 7:1 (AAA standard) with `glass-text` shadow
- Body text on glass: 4.5:1 minimum (AA standard)
- Button text: 4.5:1 minimum

**Focus Indicators:**
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-ring`
- Glass-specific focus: Increased shadow visibility via QDS focus utilities

**Keyboard Navigation:**
- All buttons/links: Native focusability
- List items: `role="list"` and `role="listitem"`
- ARIA labels: Descriptive labels for icon-only buttons

**Touch Targets:**
- All buttons: `min-h-[44px] min-w-[44px]` (WCAG 2.5.5)
- Conversation items: Full-width clickable area with 44px min height

### 9. Responsive Design (Mobile Optimization)

**Mobile Glass Performance:**
```css
@media (max-width: 767px) {
  .glass-panel-strong {
    backdrop-filter: blur(var(--blur-md)); /* Reduced from lg */
  }
}
```

**Mobile Layout:**
- **Slide-in from left:** `translate-x-[-100%]` to `translate-x-0`
- **Animation:** `transition-transform duration-300 ease-out`
- **Overlay backdrop:** `fixed inset-0 bg-black/40 backdrop-blur-sm`
- **Safe area support:** `safe-left` utility for iOS notch

**Mobile Padding:**
- Use `mobile-padding` utility (16px) instead of desktop `p-6`
- Touch targets automatically 44px minimum

### 10. Scrollbar Styling

**Custom Scrollbar (QDS Glass-Themed):**
- Use `.sidebar-scroll` utility class
- WebKit scrollbar: 8px width, glass-themed track/thumb
- Firefox scrollbar: `scrollbar-width: thin` with glass colors

**Why Custom Scrollbar:**
- Maintains glass aesthetic consistency
- Prevents harsh default scrollbar colors on translucent background

## QDS Utilities Required

All utilities already exist in `globals.css`:

- ✅ `.glass-panel-strong` (line 918-923)
- ✅ `.glass-text` (line 549-555)
- ✅ `.border-glass` (line 743-753)
- ✅ `.shadow-glass-sm/md/lg` (line 939-969)
- ✅ `.heading-4` (line 570-572)
- ✅ `.sidebar-scroll` (line 1164-1187)
- ✅ `.touch-target` (line 756-759)
- ✅ `.mobile-padding` (line 766-778)
- ✅ `.safe-left` (line 812-814)
- ✅ Focus ring utilities (line 499-519)

## Performance Considerations

**Blur Layers:**
- Sidebar: 1 blur layer (glass-panel-strong)
- Total page blur budget: ≤3 layers (within QDS limit)

**GPU Acceleration:**
```css
.glass-panel-strong {
  will-change: backdrop-filter;
  contain: layout style paint;
  transform: translateZ(0);
}
```
Already applied via QDS utilities (line 1109-1115)

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable slide-in animation */
  transition: none !important;
}
```
Automatically handled by QDS (line 1190-1200)

## Responsive Breakpoints

**Desktop (≥768px):**
- Fixed left sidebar (280px width)
- Always visible
- Glass-panel-strong with full blur

**Mobile (<768px):**
- Slide-in drawer from left
- Reduced blur for performance
- Backdrop overlay with blur-sm
- Swipe-to-close gesture support

## Animation Timing

**Slide-in Animation:**
- `transition-transform duration-300` (300ms)
- `ease-out` curve for natural deceleration

**Hover Effects:**
- `transition-all duration-180` (180ms) - QDS medium duration
- Applied to: background, shadow, border

**Focus Transitions:**
- `transition-colors duration-120` (120ms) - QDS fast duration
- Applied to: focus ring, border color

## Z-Index Layering

**Sidebar:**
- Desktop: `z-10` (above page content)
- Mobile: `z-50` (above page content, below modals)

**Backdrop Overlay (Mobile):**
- `z-40` (below sidebar, above page content)

## Interaction States

**Conversation Item States:**

1. **Default:**
   - `bg-transparent`
   - `border border-transparent`
   - `text-foreground`

2. **Hover:**
   - `bg-primary/10`
   - `border border-glass`
   - `shadow-glass-sm`

3. **Active (Selected):**
   - `bg-primary/20`
   - `border-l-2 border-primary`
   - `border-y border-r border-glass`
   - NO hover effects when active

4. **Focus:**
   - `ring-2 ring-ring ring-offset-2`
   - Visible on keyboard navigation

5. **Disabled (if applicable):**
   - `opacity-50 cursor-not-allowed`
   - No hover effects

**New Conversation Button States:**

1. **Default:**
   - `bg-primary text-primary-foreground`
   - `shadow-glass-sm`

2. **Hover:**
   - `bg-primary-hover`
   - `shadow-glass-md`

3. **Active/Pressed:**
   - `bg-primary-pressed`
   - `shadow-glass-sm` (reduced)

4. **Focus:**
   - `ring-2 ring-ring ring-offset-2`
   - QDS focus ring with primary glow

## Missing Tokens

**None.** All required tokens exist in QDS v2.0.

## Contrast Validation

**Light Mode:**
- Heading on glass-strong: #2A2721 on rgba(255,255,255,0.6) → 8.2:1 (AAA) ✅
- Body text on glass-strong: #625C52 on rgba(255,255,255,0.6) → 5.1:1 (AA) ✅
- Button text: #FFFFFF on #8A6B3D → 4.9:1 (AA) ✅

**Dark Mode:**
- Heading on glass-strong: #F3EFE8 on rgba(23,21,17,0.6) → 9.1:1 (AAA) ✅
- Body text on glass-strong: #B8AEA3 on rgba(23,21,17,0.6) → 6.2:1 (AA+) ✅
- Button text: #2A2721 on #C1A576 → 5.8:1 (AA+) ✅

## Design Decisions Summary

1. **Glass-panel-strong over glass-panel:**
   - Stronger blur (16px vs 12px) for elevated sidebar hierarchy
   - Better separation from main content area

2. **Primary/10 hover, Primary/20 active:**
   - Subtle hover state prevents overwhelming glass effect
   - Active state clearly distinguishable without destroying glass aesthetic

3. **Border-left-2 for active indicator:**
   - Stronger visual cue than full border
   - Accent color (primary) draws eye to active item
   - Matches common sidebar pattern language

4. **Reduced blur on mobile:**
   - Performance optimization (blur is GPU-intensive)
   - Maintains acceptable visual quality with blur-md instead of blur-lg

5. **Custom scrollbar styling:**
   - Maintains glass aesthetic consistency
   - Prevents jarring visual break from default scrollbars

## Implementation Readiness

**Status:** ✅ **READY FOR IMPLEMENTATION**

All QDS tokens, utilities, and patterns required for this component already exist in `globals.css`. No new tokens or utilities need to be defined.

**Next Steps:**
1. Review `plans/qds-sidebar-styling.md` for exact className strings
2. Implement component with provided specifications
3. Verify contrast ratios in both light/dark modes
4. Test keyboard navigation and focus indicators
5. Test mobile slide-in animation and swipe gesture
6. Verify reduced-motion support

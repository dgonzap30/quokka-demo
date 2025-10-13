# Component Patterns Research: Icon-Based Navigation

**Task:** Icon-Based Navbar Architecture for GlobalNavBar
**Date:** 2025-10-12
**Researched by:** Component Architect Sub-Agent

---

## 1. Existing Icon Usage Patterns

### Icon Button Patterns in Codebase

**Pattern 1: Mobile Navigation Toggle**
```tsx
// components/layout/mobile-nav.tsx:52-60
<Button
  variant="ghost"
  size="icon"
  className="h-11 w-11"
  aria-label="Open navigation menu"
  aria-expanded={open}
>
  <Menu className="h-5 w-5" />
</Button>
```
**Key Observations:**
- Uses `size="icon"` variant (size-10 = 40x40px by default)
- Custom size override: `h-11 w-11` (44x44px) for better touch targets
- Icon size: `h-5 w-5` (20x20px) provides good contrast ratio
- Always includes `aria-label` for accessibility
- Uses `variant="ghost"` for transparent background with hover effect

**Pattern 2: Filter Sidebar Toggle**
```tsx
// components/course/filter-sidebar.tsx
<Button
  variant="ghost"
  size="icon"
  className="h-10 w-10 rounded-full"
>
  <ChevronLeft className="h-4 w-4" />
</Button>
```
**Key Observations:**
- Same `ghost` + `icon` combination
- `rounded-full` for circular buttons
- Smaller icon: `h-4 w-4` (16x16px)

### Lucide React Icon Usage Across Codebase

**Most Common Icons (by frequency):**
1. **Navigation/UI:** `Menu`, `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ChevronUp`, `ArrowLeft`, `X`
2. **Actions:** `Search`, `Send`, `Plus`, `Edit2`, `Trash2`, `CheckCircle2`, `Flag`
3. **Status/Info:** `Sparkles` (AI), `MessageSquare`, `Eye`, `Calendar`, `Clock`, `TrendingUp`, `TrendingDown`
4. **User/Account:** `User`, `LogOut`, `GraduationCap`, `BookOpen`
5. **System:** `AlertCircle`, `HelpCircle`, `ExternalLink`, `Loader2`, `RefreshCcw`

---

## 2. Icon Recommendations for New Navigation Items

### Recommended Icons with Rationale

#### 1. **Ask Question** (convert from text button)
**Recommended:** `MessageSquarePlus` (from `lucide-react`)
- **Already Used:** Yes, in FloatingQuokka component
- **Semantic Meaning:** Combines "message" (Q&A context) + "plus" (create new)
- **Visual Weight:** Medium complexity, distinct from other icons
- **Alternative:** `HelpCircle` (less specific), `PlusCircle` (too generic)

#### 2. **Support** (help/documentation)
**Recommended:** `HelpCircle` (from `lucide-react`)
- **Already Used:** Yes, in status badges and filter row
- **Semantic Meaning:** Universal symbol for help/support
- **Visual Weight:** Simple, recognizable shape
- **Alternative:** `LifeBuoy` (more nautical, less familiar), `Book` (confuses with courses)

#### 3. **Settings**
**Recommended:** `Settings` (from `lucide-react`)
- **Already Used:** Not currently in codebase
- **Semantic Meaning:** Universal settings icon (gear/cog)
- **Visual Weight:** Medium complexity, instantly recognizable
- **Alternative:** `Sliders` (less common), `Wrench` (maintenance connotation)

#### 4. **Account** (user profile/preferences)
**Recommended:** Keep existing `Avatar` component with dropdown
- **Current Implementation:** Avatar with user initial + dropdown menu
- **Rationale:** More personalized than generic icon, already well-established pattern
- **Alternative:** `User` icon (less personal, less engaging)

#### 5. **AI Assistant/Chat**
**Recommended:** `Sparkles` (from `lucide-react`)
- **Already Used:** Yes, extensively for AI features (AIBadge, FloatingQuokka, dashboard)
- **Semantic Meaning:** Established AI visual identity in codebase
- **Visual Weight:** Light, magical feel consistent with AI brand
- **Alternative:** `Bot` (too robotic), `MessageSquare` (confuses with Q&A)

---

## 3. QDS Compliance Analysis

### Button Variants Available

From `components/ui/button.tsx`:

**Relevant Variants for Icon Buttons:**
- `ghost`: Transparent background, hover fills with `accent` color (QDS: `hover:bg-accent hover:text-accent-foreground`)
- `glass`: Glassmorphism effect with `backdrop-blur-md` and `bg-glass-medium`
- `glass-primary`: Glass with primary color tint + glow effect
- `outline`: Border with transparent background

**Recommended Variant:** `ghost` (most common pattern in codebase, consistent with mobile nav)

### Sizing for Accessibility

**Touch Target Requirements (QDS):**
- Minimum: 44x44px (WCAG 2.2 AA)
- Default `size="icon"`: 40x40px (size-10)
- **Solution:** Override with `className="h-11 w-11"` to meet 44x44px standard

**Icon Sizing:**
- **Recommendation:** `h-5 w-5` (20x20px) for all navbar icons
- **Rationale:** Consistent with mobile nav, provides good contrast with button size
- **Spacing Ratio:** Icon ~45% of button size (20px / 44px = 0.45)

### Color Tokens & States

**Normal State:**
```tsx
// From button.tsx ghost variant
"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
```

**Hover State:**
- Background: `accent` (QDS: `--accent: #2D6CDF` light, `#86A9F6` dark)
- Text: `accent-foreground` (white in both themes)
- Transition: `transition-all duration-250`

**Focus State (QDS globals.css):**
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```

**Disabled State:**
```tsx
"disabled:pointer-events-none disabled:opacity-50"
```

### Spacing (QDS 4pt Grid)

**Recommended Layout:**
```tsx
<div className="flex items-center gap-3">
  {/* Icon buttons group */}
</div>
```

**Gap Rationale:**
- `gap-3` = 12px spacing between icon buttons
- Provides sufficient touch target separation (44px button + 12px gap = 56px center-to-center)
- Consistent with QDS spacing scale
- Alternative: `gap-2` (8px) if space is tight on mobile

---

## 4. Tooltip System Analysis

### Radix UI Tooltip Component

**Available Component:** `components/ui/tooltip.tsx`
- **Provider:** `TooltipProvider` (wraps entire component tree or individual tooltips)
- **Root:** `Tooltip` (auto-wraps in provider for convenience)
- **Trigger:** `TooltipTrigger` (wraps button)
- **Content:** `TooltipContent` (displays label)

**Default Configuration:**
```tsx
delayDuration = 0  // No delay (instant on hover)
sideOffset = 0     // Flush with trigger
```

**Styling:**
```tsx
className="bg-foreground text-background z-50 rounded-md px-3 py-1.5 text-xs"
```

**Accessibility Features:**
- Keyboard accessible (focus shows tooltip)
- Screen reader announces content
- ARIA roles automatically applied by Radix
- Arrow pointer for visual connection

### Tooltip Usage Pattern

**Recommended Pattern:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" className="h-11 w-11">
      <MessageSquarePlus className="h-5 w-5" />
      <span className="sr-only">Ask Question</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" sideOffset={8}>
    Ask Question
  </TooltipContent>
</Tooltip>
```

**Key Elements:**
1. `asChild` prop: Merges tooltip trigger with button (no wrapper div)
2. `sr-only` span: Screen reader label (backup for tooltip)
3. `side="bottom"`: Position below button (top would conflict with header boundary)
4. `sideOffset={8}`: 8px gap for visual breathing room

---

## 5. Mobile Navigation Strategy

### Current Mobile Pattern

**Current Implementation (mobile-nav.tsx):**
- Uses Sheet (drawer) component triggered by hamburger menu
- Displays full navigation list with labels + icons
- Avatar + user info in drawer footer
- Minimum touch targets: 44px height (`min-h-[44px]`)

### Mobile Navigation Challenges

**Challenge 1: Limited Horizontal Space**
- Mobile viewport: 360px minimum (QDS)
- Current elements: Logo (~80px) + Search (~150px) + Ask Button (~120px) + Avatar (~44px) = ~394px
- **Adding 4 new icons:** 4 × 44px buttons + 3 × 12px gaps = 212px additional
- **Total:** 606px (exceeds 360px viewport by 246px)

**Challenge 2: Icon Discoverability**
- Icon-only navigation reduces discoverability for new users
- Tooltips don't work on touch devices (no hover state)
- Small icons may be hard to distinguish at a glance

### Recommended Mobile Strategy

**Option A: Priority-Based Overflow (Recommended)**

**Implementation:**
1. **Always Visible (md+ screens):**
   - Logo
   - Search bar (collapsed on mobile)
   - Ask Question icon
   - AI Assistant icon
   - Avatar dropdown

2. **Mobile (<md):**
   - Logo
   - Hamburger menu (all actions inside drawer)
   - Avatar

3. **Drawer Contents:**
   ```
   [Search Bar]
   ---
   Ask Question
   AI Assistant
   ---
   Support
   Settings
   Account
   ---
   [User Profile]
   Log out
   ```

**Rationale:**
- Maintains clean mobile experience
- No horizontal scrolling
- All actions remain accessible
- Consistent with current mobile-nav pattern
- Familiar hamburger menu pattern

**Option B: Horizontal Scroll (Not Recommended)**
- Wrap icon group in scrollable container
- Poor UX: Hidden actions, accidental scrolling
- Accessibility concerns: Keyboard navigation complex

**Option C: Two-Row Layout (Not Recommended)**
- Stack some icons on second row
- Increases header height (bad for content visibility)
- Feels cluttered and unbalanced

---

## 6. Layout & Grouping Strategy

### Visual Hierarchy

**Left → Right Priority:**
1. **Brand Identity:** Logo (always leftmost)
2. **Context:** Breadcrumb (if present, desktop only)
3. **Primary Action:** Search (center, desktop only)
4. **Creation Actions:** Ask Question (high priority)
5. **Utility Actions:** AI Assistant, Support, Settings
6. **User Identity:** Avatar (always rightmost)

### Grouping Recommendation

**Group 1: Primary Actions (Left)**
- Logo
- Breadcrumb (desktop)

**Group 2: Search (Center)**
- Search bar (desktop, hidden mobile)

**Group 3: Icon Actions (Right)**
```tsx
<div className="flex items-center gap-3">
  {/* Ask Question - Primary action */}
  <AskQuestionIconButton />

  {/* AI Assistant - Feature highlight */}
  <AIAssistantIconButton />

  {/* Divider (subtle vertical line) */}
  <div className="hidden md:block h-6 w-px bg-border" />

  {/* Support - Secondary utility */}
  <SupportIconButton />

  {/* Settings - Secondary utility */}
  <SettingsIconButton />

  {/* Avatar - Always visible */}
  <UserAvatarDropdown />
</div>
```

**Visual Separator Rationale:**
- Divider between "action" icons (Ask, AI) and "utility" icons (Support, Settings)
- Uses QDS border color: `bg-border`
- Height: `h-6` (24px) for subtle visual weight
- Hidden on mobile: `hidden md:block`

---

## 7. Hover Animation Patterns

### Button Hover Effects (from button.tsx)

**Current Hover Animation:**
```tsx
transition-all duration-250 active:scale-[0.98]
hover:bg-accent hover:text-accent-foreground
```

**Components:**
- **Duration:** 250ms (QDS medium duration, close to 180ms recommendation)
- **Easing:** Default (ease-in-out)
- **Scale on Active:** 0.98 (2% shrink on click for tactile feedback)
- **Background:** Fills with accent color
- **Text Color:** Switches to accent-foreground (white)

### Enhanced Hover Recommendations

**Option 1: Subtle Scale + Glow (Recommended)**
```tsx
<Button
  className="h-11 w-11 transition-all duration-[180ms] hover:scale-105 hover:shadow-[var(--shadow-glass-md)]"
>
  <Icon className="h-5 w-5" />
</Button>
```

**Effects:**
- **Scale:** 1.05 (5% larger on hover, subtle lift effect)
- **Shadow:** Adds glass shadow on hover for depth
- **Duration:** 180ms (QDS medium, smoother than 250ms)
- **Preserved:** Background and text color changes from `ghost` variant

**Option 2: Rotation + Scale (Playful, use sparingly)**
```tsx
<Button
  className="h-11 w-11 transition-all duration-[180ms] hover:scale-110 hover:rotate-6"
>
  <Sparkles className="h-5 w-5" />
</Button>
```

**Effects:**
- **Scale:** 1.10 (10% larger)
- **Rotation:** 6° tilt
- **Use Case:** AI Assistant button only (playful, magical feel)

**Option 3: Glow Only (Minimal)**
```tsx
<Button
  className="h-11 w-11 transition-all duration-[180ms] hover:shadow-[var(--glow-accent)]"
>
  <Icon className="h-5 w-5" />
</Button>
```

**Effects:**
- **Glow:** Accent color glow (20px blur radius)
- **Minimal:** No scale or transform
- **Use Case:** If scale feels too aggressive

### Prefers-Reduced-Motion Support

**Required Implementation:**
```tsx
// In globals.css (already exists)
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Component Level:**
```tsx
<Button
  className="h-11 w-11 transition-all duration-[180ms] motion-reduce:transition-none motion-reduce:hover:scale-100"
>
  <Icon className="h-5 w-5" />
</Button>
```

---

## 8. Darker Navbar Background

### Current Navbar Styling

```tsx
// components/layout/global-nav-bar.tsx:54-56
className="w-full z-50 glass-panel-strong border-b border-glass shadow-[var(--shadow-glass-md)]"
```

**Current Background:**
- `glass-panel-strong`: Uses `--glass-strong` (rgba(255,255,255,0.6) light / rgba(23,21,17,0.6) dark)
- `backdrop-filter: blur(16px)`
- Border: `border-glass` (semi-transparent)
- Shadow: `--shadow-glass-md`

### Contrast Issue Analysis

**Problem:**
- Glass effect makes content below visible through navbar
- Reduces contrast with main content
- Can be distracting when scrolling

**Solution Options:**

**Option 1: Increase Glass Opacity (Recommended)**
```tsx
// Custom darker glass variant
className="w-full z-50 backdrop-blur-lg bg-glass-strong/90 border-b border-glass shadow-[var(--shadow-glass-md)]"
```

**Changes:**
- `bg-glass-strong/90`: 90% opacity (darker than 60% default)
- Maintains glassmorphism aesthetic
- Better content separation
- QDS compliant (uses existing token with opacity modifier)

**Option 2: Custom Dark Glass Token**
```css
/* Add to globals.css */
--glass-navbar: rgba(255, 255, 255, 0.85);  /* Light */
--glass-navbar: rgba(23, 21, 17, 0.85);     /* Dark */
```

```tsx
className="backdrop-blur-lg bg-[var(--glass-navbar)] border-b border-glass"
```

**Option 3: Solid Background with Subtle Transparency**
```tsx
className="bg-background/95 backdrop-blur-lg border-b border-border shadow-e2"
```

**Changes:**
- `bg-background/95`: 95% opacity solid background
- Minimal blur (still has depth)
- Uses standard shadow instead of glass shadow
- Falls back gracefully without backdrop-filter support

### Recommendation

**Use Option 1: Enhanced Glass Opacity**
- **Rationale:**
  - Maintains QDS glassmorphism aesthetic
  - Better contrast than current implementation
  - No new tokens needed
  - Consistent with QDS 2.0 philosophy

**Implementation:**
```tsx
className={cn(
  "w-full z-50 backdrop-blur-lg bg-glass-strong/90 border-b border-glass shadow-[var(--shadow-glass-md)] transition-shadow duration-200",
  className
)}
```

---

## 9. Component Structure Insights

### Current GlobalNavBar Props

```tsx
export interface GlobalNavBarProps {
  user: { name: string; email: string; role: string; };
  onLogout: () => void;
  breadcrumb?: { label: string; href: string; };
  onAskQuestion?: () => void;
  className?: string;
}
```

### Required Props Updates

**New Props:**
```tsx
export interface GlobalNavBarProps {
  user: { name: string; email: string; role: string; };
  onLogout: () => void;
  breadcrumb?: { label: string; href: string; };

  // Updated: Remove text button, add icon button handler
  onAskQuestion?: () => void;

  // New: AI Assistant handler
  onOpenAIAssistant?: () => void;

  // New: Navigation handlers for new items
  onOpenSupport?: () => void;
  onOpenSettings?: () => void;
  onOpenAccount?: () => void;

  className?: string;
}
```

**Handler Rationale:**
- All actions remain callbacks (props-driven design)
- Parent component controls routing/modal opening
- Navbar remains presentation-only
- Easy to test and reuse in different contexts

---

## 10. Related Components to Update

### Files Requiring Changes

1. **`components/layout/global-nav-bar.tsx`**
   - Main implementation file
   - Add icon buttons with tooltips
   - Update props interface
   - Adjust layout for icon grouping

2. **`components/layout/mobile-nav.tsx`**
   - Add new navigation items to drawer
   - Maintain 44px touch targets
   - Update nav items list

3. **`lib/utils/nav-config.tsx`**
   - Define navigation items configuration
   - Icon mappings
   - Labels and routes

4. **`app/dashboard/page.tsx`** (example usage)
   - Pass new handler props to GlobalNavBar
   - Wire up routing for new actions

### Dependencies to Import

**New Lucide Icons:**
```tsx
import {
  MessageSquarePlus,  // Ask Question
  Sparkles,           // AI Assistant (already imported)
  HelpCircle,         // Support
  Settings,           // Settings (new)
} from "lucide-react";
```

**Tooltip Components:**
```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
```

---

## Conclusion

**Key Findings:**
1. **Icons:** Use established Lucide icons consistent with codebase patterns
2. **Layout:** Priority-based with mobile drawer for overflow
3. **Styling:** Ghost variant buttons with 44x44px touch targets
4. **Tooltips:** Radix UI tooltips with bottom placement and 8px offset
5. **Hover:** Subtle scale (1.05) + glass shadow for depth
6. **Background:** Increase glass opacity to 90% for better contrast
7. **Mobile:** Keep hamburger menu, add all new actions to drawer
8. **Accessibility:** Maintain WCAG 2.2 AA compliance, focus indicators, ARIA labels

**Next Steps:** Proceed to detailed implementation plan in `plans/component-design.md`.

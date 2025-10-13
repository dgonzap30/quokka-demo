# Component Design Plan: Icon-Based Navigation

**Task:** Transform GlobalNavBar to icon-based navigation with enhanced contrast
**Date:** 2025-10-12
**Designed by:** Component Architect Sub-Agent

---

## Component Hierarchy

```
GlobalNavBar/
├── Left Section
│   ├── Logo (Link)
│   └── Breadcrumb (optional, desktop only)
│       ├── Dashboard Link
│       └── Current Page Text
├── Center Section
│   └── GlobalSearch (desktop only)
└── Right Section
    └── Icon Actions Group (flex gap-3)
        ├── AskQuestionButton (Tooltip + IconButton)
        ├── AIAssistantButton (Tooltip + IconButton)
        ├── VisualDivider (desktop only)
        ├── SupportButton (Tooltip + IconButton, desktop only)
        ├── SettingsButton (Tooltip + IconButton, desktop only)
        └── UserAvatarDropdown (existing)

MobileNav/ (updated)
├── Hamburger Icon Button
└── Sheet Drawer
    ├── Logo Header
    ├── SearchBar (mobile only)
    ├── Separator
    ├── Ask Question (with icon)
    ├── AI Assistant (with icon)
    ├── Support (with icon)
    ├── Settings (with icon)
    ├── Separator
    ├── User Profile
    └── Log out
```

---

## Props Interfaces

### GlobalNavBar Props (Updated)

```typescript
// File: components/layout/global-nav-bar.tsx

export interface GlobalNavBarProps {
  /** Current user information */
  user: {
    name: string;
    email: string;
    role: string;
  };

  /** Logout handler */
  onLogout: () => void;

  /** Optional breadcrumb for course context */
  breadcrumb?: {
    label: string;
    href: string;
  };

  /** Ask Question handler - opens new question form/modal */
  onAskQuestion?: () => void;

  /** AI Assistant handler - opens AI chat interface */
  onOpenAIAssistant?: () => void;

  /** Support handler - navigates to support/help page */
  onOpenSupport?: () => void;

  /** Settings handler - navigates to settings page */
  onOpenSettings?: () => void;

  /** Account handler - navigates to account/profile page */
  onOpenAccount?: () => void;

  /** Optional className for composition */
  className?: string;
}
```

**Props Design Rationale:**
- All new actions are optional callbacks (backwards compatible)
- Parent component controls routing/modal logic
- Navbar remains presentation-only (no hardcoded routes)
- Easy to test by passing mock handlers
- Composable across different page contexts

### MobileNav Props (Updated)

```typescript
// File: components/layout/mobile-nav.tsx

export interface MobileNavProps {
  /** Current active route path */
  currentPath: string;

  /** User information for profile section */
  user: {
    name: string;
    email: string;
    role: string;
  } | null;

  /** Logout handler */
  onLogout: () => void;

  /** Ask Question handler */
  onAskQuestion?: () => void;

  /** AI Assistant handler */
  onOpenAIAssistant?: () => void;

  /** Support handler */
  onOpenSupport?: () => void;

  /** Settings handler */
  onOpenSettings?: () => void;

  /** Account handler */
  onOpenAccount?: () => void;

  /** Optional navigation items for course-specific contexts */
  items?: NavItem[];

  /** Optional course context for specialized navigation */
  courseContext?: {
    courseId: string;
    courseCode: string;
    courseName: string;
  };
}
```

### New Helper Component: NavIconButton

```typescript
// File: components/layout/nav-icon-button.tsx (new component)

import type { LucideIcon } from "lucide-react";

export interface NavIconButtonProps {
  /** Lucide icon component to render */
  icon: LucideIcon;

  /** Accessible label for screen readers and tooltip */
  label: string;

  /** Click handler */
  onClick?: () => void;

  /** Optional className for composition */
  className?: string;

  /** Optional custom hover animation class */
  hoverAnimation?: "scale" | "scale-rotate" | "glow" | "none";

  /** Disabled state */
  disabled?: boolean;
}
```

**Usage Example:**
```tsx
<NavIconButton
  icon={MessageSquarePlus}
  label="Ask Question"
  onClick={onAskQuestion}
  hoverAnimation="scale"
/>
```

---

## State Management Plan

### Local State

**GlobalNavBar:**
- No internal state (fully controlled by props)
- Stateless presentation component

**MobileNav:**
- `open: boolean` - Sheet drawer open/close state (existing)

**NavIconButton:**
- No internal state (stateless)
- Hover/focus managed by CSS

### Lifted State

**Parent Component (nav-header.tsx or page.tsx):**
- User session data
- Current route/path
- Handlers for navigation actions

**Example Parent Implementation:**
```tsx
// app/dashboard/page.tsx (example)
import { useRouter } from "next/navigation";

function DashboardPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const handleAskQuestion = () => {
    router.push("/ask");
  };

  const handleOpenAIAssistant = () => {
    // Open AI chat modal or navigate to /quokka
    router.push("/quokka");
  };

  const handleOpenSupport = () => {
    router.push("/support");
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const handleOpenAccount = () => {
    router.push("/account");
  };

  return (
    <>
      <GlobalNavBar
        user={user}
        onLogout={handleLogout}
        onAskQuestion={handleAskQuestion}
        onOpenAIAssistant={handleOpenAIAssistant}
        onOpenSupport={handleOpenSupport}
        onOpenSettings={handleOpenSettings}
        onOpenAccount={handleOpenAccount}
      />
      {/* Page content */}
    </>
  );
}
```

### No React Query Needed

- All navigation actions are routing/UI state changes
- No server state or API calls from navbar
- User data fetched at app/layout level (existing pattern)

---

## Event Handling Pattern

### Callback Pattern (Props-Driven)

**All actions use optional callback props:**
```tsx
// In GlobalNavBar
{onAskQuestion && (
  <NavIconButton
    icon={MessageSquarePlus}
    label="Ask Question"
    onClick={onAskQuestion}
  />
)}
```

**Rationale:**
- Parent controls behavior (routing, modal opening, etc.)
- Navbar has no knowledge of routing logic
- Easy to mock for testing
- Composable in different contexts (dashboard, course page, instructor view)

### Event Signatures

```typescript
// All handlers have same signature (no arguments)
type NavActionHandler = () => void;

// Usage
onAskQuestion?: NavActionHandler;
onOpenAIAssistant?: NavActionHandler;
onOpenSupport?: NavActionHandler;
onOpenSettings?: NavActionHandler;
onOpenAccount?: NavActionHandler;
```

**No Event Bubbling:**
- Icon buttons stop propagation (default button behavior)
- Tooltips manage their own focus/hover events
- No conflicts with parent click handlers

---

## Variant System

### Icon Button Variants

**Base Variant: Ghost**
```tsx
<Button variant="ghost" size="icon" className="h-11 w-11">
  <Icon className="h-5 w-5" />
</Button>
```

**Properties:**
- Background: Transparent
- Hover: `bg-accent` + `text-accent-foreground`
- Focus: Accent ring (QDS default)
- Disabled: 50% opacity
- Size: 44x44px (meets WCAG touch target)

### Hover Animation Variants

**Variant 1: Scale + Shadow (Default)**
```tsx
className="transition-all duration-[180ms] hover:scale-105 hover:shadow-[var(--shadow-glass-md)] motion-reduce:hover:scale-100 motion-reduce:transition-none"
```

**Variant 2: Scale + Rotate (AI Assistant Only)**
```tsx
className="transition-all duration-[180ms] hover:scale-110 hover:rotate-6 motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0 motion-reduce:transition-none"
```

**Variant 3: Glow Only (Minimal)**
```tsx
className="transition-all duration-[180ms] hover:shadow-[var(--glow-accent)] motion-reduce:transition-none"
```

### Navbar Background Variant

**Enhanced Glass (Darker)**
```tsx
// Updated from: glass-panel-strong
// To: Custom darker glass with 90% opacity
className="backdrop-blur-lg bg-glass-strong/90 border-b border-glass shadow-[var(--shadow-glass-md)]"
```

**Color Values:**
- Light theme: `rgba(255, 255, 255, 0.54)` (60% × 90%)
- Dark theme: `rgba(23, 21, 17, 0.54)` (60% × 90%)

---

## File Structure

### Files to Create

1. **`components/layout/nav-icon-button.tsx`** (new)
   - Reusable icon button component with tooltip
   - Handles accessibility (ARIA labels, screen reader text)
   - Supports hover animations
   - ~80 lines of code

### Files to Modify

1. **`components/layout/global-nav-bar.tsx`**
   - Update props interface
   - Replace "Ask Question" text button with icon button
   - Add new icon buttons (AI, Support, Settings)
   - Add visual divider
   - Update navbar background opacity
   - Update responsive behavior
   - ~220 lines of code (existing ~164, adding ~56)

2. **`components/layout/mobile-nav.tsx`**
   - Update props interface
   - Add new navigation items to drawer
   - Include icons for all nav items
   - Update mobile search placement
   - ~190 lines of code (existing ~165, adding ~25)

3. **`lib/utils/nav-config.tsx`** (may need creation if doesn't exist)
   - Define navigation items configuration
   - Icon mappings
   - Labels and aria-labels
   - ~40 lines of code

### Import/Export Strategy

**NavIconButton Component:**
```tsx
// components/layout/nav-icon-button.tsx
export { NavIconButton, type NavIconButtonProps };
```

**GlobalNavBar Imports:**
```tsx
import {
  MessageSquarePlus,
  Sparkles,
  HelpCircle,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { NavIconButton } from "./nav-icon-button";
```

**MobileNav Imports:**
```tsx
import {
  MessageSquarePlus,
  Sparkles,
  HelpCircle,
  Settings,
  User,
} from "lucide-react";
```

---

## Usage Examples

### Example 1: Basic Usage (Dashboard)

```tsx
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen">
      <GlobalNavBar
        user={user}
        onLogout={() => router.push("/login")}
        onAskQuestion={() => router.push("/ask")}
        onOpenAIAssistant={() => router.push("/quokka")}
        onOpenSupport={() => router.push("/support")}
        onOpenSettings={() => router.push("/settings")}
        onOpenAccount={() => router.push("/account")}
      />
      {/* Dashboard content */}
    </div>
  );
}
```

### Example 2: With Breadcrumb (Course Page)

```tsx
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { useRouter, useParams } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const { data: user } = useCurrentUser();
  const { data: course } = useCourse(params.courseId);

  return (
    <div className="min-h-screen">
      <GlobalNavBar
        user={user}
        onLogout={() => router.push("/login")}
        breadcrumb={{
          label: course?.name || "Course",
          href: `/courses/${params.courseId}`,
        }}
        onAskQuestion={() => router.push(`/courses/${params.courseId}/ask`)}
        onOpenAIAssistant={() => router.push("/quokka")}
        onOpenSupport={() => router.push("/support")}
        onOpenSettings={() => router.push("/settings")}
        onOpenAccount={() => router.push("/account")}
      />
      {/* Course content */}
    </div>
  );
}
```

### Example 3: With Modal Handlers

```tsx
import { GlobalNavBar } from "@/components/layout/global-nav-bar";
import { useState } from "react";
import { AIAssistantModal } from "@/components/ai/ai-assistant-modal";
import { AskQuestionModal } from "@/components/course/ask-question-modal";

export default function Page() {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);

  return (
    <>
      <GlobalNavBar
        user={user}
        onLogout={handleLogout}
        onAskQuestion={() => setAskModalOpen(true)}
        onOpenAIAssistant={() => setAiModalOpen(true)}
        onOpenSupport={() => router.push("/support")}
        onOpenSettings={() => router.push("/settings")}
      />

      <AIAssistantModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      <AskQuestionModal
        open={askModalOpen}
        onClose={() => setAskModalOpen(false)}
      />
    </>
  );
}
```

### Example 4: NavIconButton Component Implementation

```tsx
// components/layout/nav-icon-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavIconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  hoverAnimation?: "scale" | "scale-rotate" | "glow" | "none";
  disabled?: boolean;
}

const hoverAnimations = {
  scale: "hover:scale-105 hover:shadow-[var(--shadow-glass-md)]",
  "scale-rotate": "hover:scale-110 hover:rotate-6",
  glow: "hover:shadow-[var(--glow-accent)]",
  none: "",
};

export function NavIconButton({
  icon: Icon,
  label,
  onClick,
  className,
  hoverAnimation = "scale",
  disabled = false,
}: NavIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-11 w-11 transition-all duration-[180ms]",
            hoverAnimations[hoverAnimation],
            "motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0 motion-reduce:transition-none",
            className
          )}
          aria-label={label}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## Test Scenarios

### User Interactions

1. **Desktop Icon Button Click**
   - Click "Ask Question" icon → Navigate to /ask page
   - Click "AI Assistant" icon → Open AI chat modal
   - Click "Support" icon → Navigate to /support
   - Click "Settings" icon → Navigate to /settings
   - Verify each action triggers correct handler

2. **Desktop Icon Button Hover**
   - Hover over each icon → Tooltip appears below button
   - Verify tooltip content matches button label
   - Verify hover animation (scale + shadow)
   - Verify AI Assistant button has unique rotation animation

3. **Desktop Icon Button Focus**
   - Tab through navigation → Each icon button receives focus
   - Verify focus ring is visible (accent color, 4px)
   - Press Enter on focused button → Triggers action
   - Verify tooltip appears on keyboard focus

4. **Mobile Navigation**
   - Click hamburger menu → Drawer opens
   - Verify all nav items visible with icons + labels
   - Click "Ask Question" in drawer → Triggers action and closes drawer
   - Verify touch targets are minimum 44px height

5. **Mobile Search**
   - Open mobile drawer → Search bar appears at top
   - Verify search is hidden in top navbar on mobile
   - Search functionality works correctly

### Edge Cases

1. **Missing Handlers**
   - Render GlobalNavBar without optional handlers
   - Verify only icons with handlers are rendered
   - Verify no console errors

2. **Long Breadcrumb Text**
   - Provide very long breadcrumb label
   - Verify text truncates with ellipsis
   - Verify navbar doesn't overflow

3. **Rapid Clicks**
   - Click icon button multiple times rapidly
   - Verify action only triggers once per click
   - Verify no duplicate navigation/modal opening

4. **Disabled State**
   - Pass `disabled={true}` to NavIconButton
   - Verify button is not clickable
   - Verify 50% opacity applied
   - Verify tooltip still appears on hover

5. **Screen Reader Navigation**
   - Use screen reader to navigate navbar
   - Verify all buttons have proper labels
   - Verify "sr-only" text is announced
   - Verify tooltip content is accessible

### Accessibility Checks

1. **Keyboard Navigation**
   - Tab order: Logo → Search → Ask → AI → Support → Settings → Avatar
   - Verify focus visible on all elements
   - Verify Enter/Space triggers button actions
   - Verify Escape closes tooltip (if applicable)

2. **ARIA Labels**
   - All icon buttons have `aria-label`
   - Tooltips have proper ARIA roles
   - Icons have `aria-hidden="true"`
   - Screen reader text provided via `sr-only`

3. **Color Contrast**
   - Icon color vs background: ≥4.5:1 (foreground on glass background)
   - Hover state: ≥4.5:1 (accent-foreground on accent)
   - Focus ring: ≥3:1 against background
   - Tooltip text: ≥4.5:1 (background text on foreground bg)

4. **Touch Targets**
   - All buttons: 44x44px minimum
   - Mobile drawer items: 44px height minimum
   - Adequate spacing: 12px gap between buttons (>8px required)

5. **Reduced Motion**
   - Enable prefers-reduced-motion
   - Verify hover animations are disabled
   - Verify transitions are minimal/instant
   - Verify tooltips still function without animation

### Responsive Breakpoints

1. **360px (Mobile Small)**
   - Logo visible
   - Search hidden
   - Hamburger menu visible
   - Avatar visible
   - No icon buttons in navbar
   - All actions in drawer

2. **640px (Mobile Large)**
   - Same as 360px

3. **768px (Tablet)**
   - Logo visible
   - Search bar appears (flex-1, max-w-xl)
   - Icon buttons appear (Ask, AI, divider, Support, Settings)
   - Avatar visible
   - Hamburger menu hidden

4. **1024px (Desktop)**
   - Same as 768px
   - Breadcrumb appears (if provided)
   - More horizontal space for search

5. **1280px+ (Desktop Large)**
   - Same as 1024px
   - Maximum content width: 1280px (max-w-7xl)

---

## Implementation Checklist

### Phase 1: Create NavIconButton Component

- [ ] Create `components/layout/nav-icon-button.tsx`
- [ ] Implement props interface
- [ ] Add Button with ghost variant and icon size
- [ ] Add Tooltip wrapper (trigger + content)
- [ ] Add hover animation variants
- [ ] Add motion-reduce support
- [ ] Add ARIA labels and sr-only text
- [ ] Test component in isolation
- [ ] Export component and types

### Phase 2: Update GlobalNavBar

- [ ] Update `GlobalNavBarProps` interface
- [ ] Import new icons and NavIconButton
- [ ] Update navbar background className (90% opacity)
- [ ] Remove "Ask Question" text button
- [ ] Add icon button group (flex gap-3)
- [ ] Add Ask Question icon button
- [ ] Add AI Assistant icon button (with rotate animation)
- [ ] Add visual divider (h-6 w-px bg-border)
- [ ] Add Support icon button (hidden md:flex)
- [ ] Add Settings icon button (hidden md:flex)
- [ ] Keep Avatar dropdown as-is
- [ ] Test desktop layout at all breakpoints
- [ ] Verify prop drilling works correctly

### Phase 3: Update MobileNav

- [ ] Update `MobileNavProps` interface
- [ ] Import new icons
- [ ] Add search bar to drawer (mt-6)
- [ ] Add separator after search
- [ ] Create navigation section for new items
- [ ] Add Ask Question item (with MessageSquarePlus icon)
- [ ] Add AI Assistant item (with Sparkles icon)
- [ ] Add Support item (with HelpCircle icon)
- [ ] Add Settings item (with Settings icon)
- [ ] Verify 44px touch targets for all items
- [ ] Test drawer functionality
- [ ] Verify SheetClose works on item clicks

### Phase 4: Integration & Testing

- [ ] Update parent components (dashboard, course pages)
- [ ] Pass new handler props to GlobalNavBar
- [ ] Test all navigation actions
- [ ] Verify tooltips appear on hover
- [ ] Test keyboard navigation
- [ ] Test mobile drawer functionality
- [ ] Run accessibility audit (axe)
- [ ] Test with screen reader
- [ ] Test color contrast (Lighthouse)
- [ ] Test at all breakpoints (360, 640, 768, 1024, 1280)
- [ ] Enable prefers-reduced-motion and verify
- [ ] Test in light and dark modes

### Phase 5: Polish & Documentation

- [ ] Verify no TypeScript errors (`npx tsc --noEmit`)
- [ ] Run lint (`npm run lint`)
- [ ] Check for unused imports
- [ ] Add JSDoc comments to new component
- [ ] Update component README (if applicable)
- [ ] Take screenshots for documentation
- [ ] Update CLAUDE.md if new patterns introduced
- [ ] Commit changes with conventional commit message

---

## TypeScript Interfaces Summary

### NavIconButton

```typescript
import type { LucideIcon } from "lucide-react";

export interface NavIconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  hoverAnimation?: "scale" | "scale-rotate" | "glow" | "none";
  disabled?: boolean;
}
```

### GlobalNavBar

```typescript
export interface GlobalNavBarProps {
  user: { name: string; email: string; role: string; };
  onLogout: () => void;
  breadcrumb?: { label: string; href: string; };
  onAskQuestion?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenSupport?: () => void;
  onOpenSettings?: () => void;
  onOpenAccount?: () => void;
  className?: string;
}
```

### MobileNav

```typescript
export interface MobileNavProps {
  currentPath: string;
  user: { name: string; email: string; role: string; } | null;
  onLogout: () => void;
  onAskQuestion?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenSupport?: () => void;
  onOpenSettings?: () => void;
  onOpenAccount?: () => void;
  items?: NavItem[];
  courseContext?: {
    courseId: string;
    courseCode: string;
    courseName: string;
  };
}
```

---

## Performance Considerations

### Render Optimization

**Memoization Not Required:**
- GlobalNavBar is small, renders infrequently
- No expensive computations
- Props are simple primitives and callbacks

**When to Consider Memoization:**
- If navbar renders on every scroll event (currently doesn't)
- If user prop changes frequently (unlikely)
- Measure first, optimize only if needed

### Bundle Size

**New Imports:**
- `MessageSquarePlus`: ~1KB
- `Sparkles`: Already imported
- `HelpCircle`: Already imported
- `Settings`: ~1KB
- Tooltip components: Already in bundle

**Estimated Impact:** +2KB gzipped (negligible)

### Accessibility Performance

**Focus Management:**
- Tooltip focus handled by Radix (optimized)
- No manual focus trap logic needed
- Button focus is native browser behavior

**Screen Reader Performance:**
- `sr-only` text doesn't affect render
- ARIA labels are static strings (no computation)
- Tooltip announcements debounced by Radix

---

## Risks & Mitigation

### Risk 1: Icon Discoverability

**Risk:** Users may not know what icons mean without labels

**Mitigation:**
- Tooltips on hover/focus
- Screen reader labels always present
- Use familiar, universal icons (gear = settings, ? = help)
- Mobile retains text labels in drawer

### Risk 2: Mobile Space Constraints

**Risk:** Too many items in mobile drawer may feel overwhelming

**Mitigation:**
- Group items logically with separators
- Use consistent icon sizes (h-5 w-5)
- Maintain visual hierarchy (Ask Question at top)
- Keep search bar at top for easy access

### Risk 3: Tooltip Performance on Low-End Devices

**Risk:** Tooltip animations may lag on older mobile devices

**Mitigation:**
- Radix tooltips are optimized for performance
- Animation durations are short (180ms)
- Reduced motion support built in
- Tooltips don't render on mobile (touch devices)

### Risk 4: Breaking Changes for Existing Implementations

**Risk:** Pages using GlobalNavBar may break if handlers not provided

**Mitigation:**
- All new handlers are optional props
- Icons only render if handler provided
- Backwards compatible with existing usage
- Gradual rollout: update one page at a time

### Risk 5: Color Contrast with Darker Navbar

**Risk:** Darker glass may reduce contrast with icons

**Mitigation:**
- Test contrast ratio with Lighthouse
- Icons use foreground color (high contrast)
- Hover state uses accent color (verified AA compliance)
- Glass opacity carefully tuned (90% vs 60%)

---

## Rollback Plan

### If Icon Navigation Fails User Testing

**Rollback Steps:**
1. Git revert to previous GlobalNavBar version
2. Keep new handlers in props interface (for future use)
3. Restore text button for "Ask Question"
4. Remove icon-only buttons

**Partial Rollback (Hybrid Approach):**
1. Keep icons on desktop
2. Add text labels next to icons (icon + text button)
3. Mobile remains drawer-based

**Example Hybrid Button:**
```tsx
<Button variant="ghost" className="gap-2">
  <MessageSquarePlus className="h-4 w-4" />
  <span className="hidden lg:inline">Ask Question</span>
</Button>
```

---

## Future Enhancements

### Phase 2: Notification Badges

**Add notification indicators to icon buttons:**
```tsx
<NavIconButton
  icon={Settings}
  label="Settings"
  badge={3}  // Unread notifications
/>
```

**Implementation:**
```tsx
{badge && badge > 0 && (
  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs font-semibold">
    {badge > 9 ? "9+" : badge}
  </span>
)}
```

### Phase 3: Active State Indicators

**Highlight current page in navbar:**
```tsx
<NavIconButton
  icon={Settings}
  label="Settings"
  active={currentPath === "/settings"}
/>
```

**Implementation:**
```tsx
{active && (
  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary" />
)}
```

### Phase 4: Keyboard Shortcuts

**Add keyboard shortcut hints to tooltips:**
```tsx
<TooltipContent>
  <div className="flex items-center gap-2">
    <span>Ask Question</span>
    <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">⌘K</kbd>
  </div>
</TooltipContent>
```

### Phase 5: Customizable Icon Order

**Allow users to reorder navbar icons:**
```tsx
<GlobalNavBar
  user={user}
  iconOrder={["ask", "ai", "support", "settings"]}
  // ... other props
/>
```

---

**End of Component Design Plan**

**Next Steps:**
1. Review this plan
2. Approve or request changes
3. Parent agent proceeds with implementation
4. Test at each phase
5. Commit incrementally

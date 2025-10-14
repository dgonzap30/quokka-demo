# QDS 2.0 Styling Plan: ProfileSettingsDropdown Redesign

**Component:** `components/navbar/profile-settings-dropdown.tsx`
**Benchmark:** `components/navbar/quokka-points-badge.tsx`
**Implementation Phases:** 3
**Estimated LOC Changes:** ~60-80 lines

---

## Implementation Strategy

### Phase 1: Structure & Width (Critical)
Remove tabs, increase width, add avatar, restructure layout

### Phase 2: Content & Polish (Medium)
Add descriptions, enhance spacing, improve hover states

### Phase 3: Refinement (Minor)
Apply glass-text, fix contrast, polish interactions

---

## Phase 1: Structure & Width (Critical)

### Step 1.1: Increase Width & Padding

**File:** `components/navbar/profile-settings-dropdown.tsx`
**Line 116:**

**Current:**
```tsx
<PopoverContent
  className="w-64 glass-panel p-3"
  align="end"
  sideOffset={8}
>
```

**Replace with:**
```tsx
<PopoverContent
  className="w-80 glass-panel p-4"
  align="end"
  sideOffset={8}
>
```

**Rationale:** Match QuokkaPointsBadge width (w-80) and padding (p-4) for better hierarchy and breathing room.

---

### Step 1.2: Remove Tabs Component

**Lines 120-133:** Remove entire Tabs structure

**Remove:**
```tsx
<Tabs
  value={activeTab}
  onValueChange={(value) => setActiveTab(value as "profile" | "settings")}
>
  <TabsList className="w-full mb-3" aria-label="Profile and Settings">
    <TabsTrigger value="profile" className="flex-1">
      <User className="h-4 w-4" aria-hidden="true" />
      Profile
    </TabsTrigger>
    <TabsTrigger value="settings" className="flex-1">
      <Settings className="h-4 w-4" aria-hidden="true" />
      Settings
    </TabsTrigger>
  </TabsList>
  {/* Content below */}
</Tabs>
```

**Remove from imports (Line 11-16):**
```tsx
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
```

**Remove from state (Line 90):**
```tsx
const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");
```

---

### Step 1.3: Add Avatar Component

**Check if Avatar exists:**
```bash
# If components/ui/avatar.tsx doesn't exist, add it via shadcn
npx shadcn-ui@latest add avatar
```

**Add to imports (after Line 4):**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
```

**Implementation:** Will be added in Step 1.4 restructure.

---

### Step 1.4: Restructure Content (Unified Layout)

**Lines 119-210:** Replace entire content structure

**Remove:**
```tsx
<Tabs value={activeTab}>
  <TabsList>...</TabsList>
  <TabsContent value="profile">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
</Tabs>
```

**Replace with:**
```tsx
<div className="space-y-4">
  {/* Header Section */}
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="avatar-placeholder text-xs font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate glass-text" title={user.name}>
          {user.name}
        </h3>
        <p className="text-sm text-muted-foreground truncate glass-text" title={user.email}>
          {user.email}
        </p>
      </div>
    </div>
  </div>

  {/* Profile Action */}
  {onNavigateProfile && (
    <Button
      variant="outline"
      size="sm"
      onClick={onNavigateProfile}
      className="w-full justify-start"
    >
      <User className="h-4 w-4" aria-hidden="true" />
      View Profile
    </Button>
  )}

  {/* Divider */}
  <div className="border-t border-border/50" />

  {/* Settings Section */}
  <div className="space-y-2">
    <h4 className="text-xs font-medium text-muted-foreground px-2 glass-text">
      Settings
    </h4>
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start flex-col items-start gap-0.5 h-auto py-2 hover:bg-muted/80 transition-colors duration-200"
        onClick={() => onNavigateNotifications?.()}
      >
        <div className="flex items-center gap-2 w-full">
          <Bell className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm glass-text">Notifications</span>
        </div>
        <span className="text-xs text-muted-foreground pl-6 glass-text">
          Email and in-app alerts
        </span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start flex-col items-start gap-0.5 h-auto py-2 hover:bg-muted/80 transition-colors duration-200"
        onClick={() => onNavigateAppearance?.()}
      >
        <div className="flex items-center gap-2 w-full">
          <Moon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm glass-text">Appearance</span>
        </div>
        <span className="text-xs text-muted-foreground pl-6 glass-text">
          Theme and display settings
        </span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start flex-col items-start gap-0.5 h-auto py-2 hover:bg-muted/80 transition-colors duration-200"
        onClick={() => onNavigatePrivacy?.()}
      >
        <div className="flex items-center gap-2 w-full">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm glass-text">Privacy</span>
        </div>
        <span className="text-xs text-muted-foreground pl-6 glass-text">
          Data and security options
        </span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start flex-col items-start gap-0.5 h-auto py-2 hover:bg-muted/80 transition-colors duration-200"
        onClick={() => onNavigateHelp?.()}
      >
        <div className="flex items-center gap-2 w-full">
          <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm glass-text">Help & Support</span>
        </div>
        <span className="text-xs text-muted-foreground pl-6 glass-text">
          FAQs and contact options
        </span>
      </Button>
    </div>
  </div>

  {/* Divider */}
  <div className="border-t border-border/50" />

  {/* Logout Action */}
  <Button
    variant="outline"
    size="sm"
    className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 border-danger/20"
    onClick={onLogout}
  >
    <LogOut className="h-4 w-4" aria-hidden="true" />
    Log out
  </Button>
</div>
```

---

### Step 1.5: Add Utility Function for Initials

**Add after imports (before component definition):**

```tsx
/**
 * Extract initials from full name
 * @example "John Doe" → "JD"
 * @example "Alice" → "A"
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

---

## Phase 2: Content & Polish (Medium)

### Step 2.1: Enhance Trigger Button Hover

**Line 98-103:**

**Current:**
```tsx
className={cn(
  "min-h-[44px] min-w-[44px] h-11 w-11",
  "transition-all duration-200",
  "hover:bg-muted/50",
  "focus-visible:ring-2 focus-visible:ring-accent/60",
  className
)}
```

**Replace with:**
```tsx
className={cn(
  "min-h-[44px] min-w-[44px] h-11 w-11",
  "transition-all duration-300 ease-out",
  "hover:bg-muted/50 hover:scale-[1.05]",
  "motion-reduce:hover:scale-100",
  "focus-visible:ring-4 focus-visible:ring-accent/60",
  className
)}
```

**Rationale:** Match QuokkaPointsBadge hover effects with scale and longer duration.

---

### Step 2.2: Update Component JSDoc

**Lines 68-79:**

**Current:**
```tsx
/**
 * ProfileSettingsDropdown Component
 *
 * Simplified dropdown for user profile and settings access
 *
 * Features:
 * - Profile tab: User info, View Profile link, Logout
 * - Settings tab: Quick settings options + link to full Settings page
 * - Keyboard accessible (Tab, Arrow keys, Escape)
 * - WCAG 2.2 AA compliant
 * - QDS design tokens (glass-panel, spacing, colors)
 */
```

**Replace with:**
```tsx
/**
 * ProfileSettingsDropdown Component
 *
 * Elegant dropdown for user profile and settings access
 * Redesigned to match QuokkaPointsBadge visual quality standards
 *
 * Features:
 * - User avatar with initials fallback
 * - Clear sectioned layout (Profile, Settings, Logout)
 * - Rich settings options with descriptions
 * - Keyboard accessible (Tab, Escape)
 * - WCAG 2.2 AA compliant
 * - QDS 2.0 glassmorphism design language
 * - Responsive width (w-80) for better hierarchy
 */
```

---

### Step 2.3: Add Role Badge (Optional Enhancement)

**In header section (Step 1.4), after email line:**

**Add:**
```tsx
<div className="flex items-center gap-2">
  <Avatar className="h-8 w-8">...</Avatar>
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold truncate glass-text" title={user.name}>
      {user.name}
    </h3>
    <p className="text-sm text-muted-foreground truncate glass-text" title={user.email}>
      {user.email}
    </p>
    {/* NEW: Role Badge */}
    <Badge variant="outline" className="mt-1 text-xs">
      {user.role}
    </Badge>
  </div>
</div>
```

**Add Badge import:**
```tsx
import { Badge } from "@/components/ui/badge";
```

---

## Phase 3: Refinement (Minor)

### Step 3.1: Fix Email Text Size for Contrast

**In Step 1.4 structure, email line:**

**Current:**
```tsx
<p className="text-sm text-muted-foreground truncate glass-text" title={user.email}>
  {user.email}
</p>
```

**Keep as is:** Already changed from `text-xs` to `text-sm` in Step 1.4 restructure. ✅

---

### Step 3.2: Add Reduced Motion Support

**Already included in Step 2.1 trigger button enhancement:**
```tsx
"motion-reduce:hover:scale-100"
```

**Apply to settings buttons (in Step 1.4):**

Update settings button classes:
```tsx
className="w-full justify-start flex-col items-start gap-0.5 h-auto py-2 hover:bg-muted/80 transition-colors duration-200 motion-reduce:transition-none"
```

---

### Step 3.3: Enhance Focus Indicators

**Update trigger button focus (already in Step 2.1):**
```tsx
"focus-visible:ring-4 focus-visible:ring-accent/60"
```

**Settings buttons already inherit focus from glass-panel enhancement in globals.css (lines 504-514).**

---

### Step 3.4: Add ARIA Improvements

**Header section:**
```tsx
<div className="space-y-1" role="region" aria-label="User information">
  {/* Avatar and user info */}
</div>
```

**Settings section:**
```tsx
<div className="space-y-2" role="region" aria-label="Account settings">
  <h4 className="text-xs font-medium text-muted-foreground px-2 glass-text">
    Settings
  </h4>
  {/* Settings buttons */}
</div>
```

**Settings buttons with descriptions:**
```tsx
<Button
  variant="ghost"
  size="sm"
  className="..."
  onClick={() => onNavigateNotifications?.()}
  aria-describedby="notif-desc"
>
  <div className="flex items-center gap-2 w-full">
    <Bell className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    <span className="font-medium text-sm glass-text">Notifications</span>
  </div>
  <span id="notif-desc" className="text-xs text-muted-foreground pl-6 glass-text">
    Email and in-app alerts
  </span>
</Button>
```

**Repeat pattern for all settings buttons.**

---

## Complete File Structure Reference

### Updated Imports Section

```tsx
"use client";

import * as React from "react";
import { User, Settings, LogOut, Bell, Moon, Shield, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
```

**Removed:**
- Tabs imports (11-16)

**Added:**
- Avatar imports
- Badge import

---

### Updated Props Interface (No Changes)

**Lines 19-65:** Keep as is. All callbacks remain optional and compatible.

---

### Component Function Signature (Simplified)

**Remove state:**
```tsx
// Remove this line (90):
const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");
```

**Component function stays same:**
```tsx
export function ProfileSettingsDropdown({
  user,
  onLogout,
  onNavigateProfile,
  onNavigateNotifications,
  onNavigateAppearance,
  onNavigatePrivacy,
  onNavigateHelp,
  className,
}: ProfileSettingsDropdownProps) {
  return (
    <Popover>
      {/* Trigger and Content */}
    </Popover>
  );
}
```

---

## Glass-Panel Configuration

### Current Glass-Panel Class (Globals.css line 857-862)

```css
.glass-panel {
  backdrop-filter: blur(var(--blur-md));
  background: var(--glass-medium);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-glass-md);
}
```

**No changes needed.** This utility is already QDS 2.0 compliant:
- ✅ 12px blur (blur-md)
- ✅ Glass-medium opacity (0.7)
- ✅ Glass border with proper token
- ✅ Glass shadow (softer than standard elevation)

**Mobile optimization (lines 736-738):**
```css
@media (max-width: 767px) {
  .glass-panel {
    backdrop-filter: blur(var(--blur-sm));
  }
}
```
✅ Automatically reduces to 8px blur on mobile for performance.

---

## Color Token Mappings

| UI Element | Token | Value (Light) | Value (Dark) |
|------------|-------|---------------|--------------|
| Panel Background | `--glass-medium` | rgba(255,255,255,0.7) | rgba(23,21,17,0.7) |
| Panel Border | `--border-glass` | rgba(255,255,255,0.18) | rgba(255,255,255,0.08) |
| Panel Shadow | `--shadow-glass-md` | 0 4px 24px rgba(15,14,12,0.06) | 0 4px 24px rgba(0,0,0,0.3) |
| Text Primary | `text-foreground` | #2A2721 | #F3EFE8 |
| Text Muted | `text-muted-foreground` | #625C52 | #B8AEA3 |
| Danger Text | `text-danger` | #D92D20 | #D92D20 |
| Avatar BG | `avatar-placeholder` | hsl(35 40% 92%) | hsl(35 30% 22%) |
| Avatar Text | `avatar-placeholder` | hsl(35 45% 35%) | hsl(35 35% 65%) |
| Button Hover | `hover:bg-muted/80` | rgba(98,92,82,0.8) | rgba(184,174,163,0.8) |
| Danger BG | `hover:bg-danger/10` | rgba(217,45,32,0.1) | rgba(217,45,32,0.1) |
| Border | `border-border` | #CDC7BD (light) | rgba(243,239,232,0.1) (dark) |

**All tokens are semantic and fully support dark mode automatically.**

---

## Spacing Updates (4pt Grid)

| Element | Current | New | Rationale |
|---------|---------|-----|-----------|
| Panel padding | `p-3` (12px) | `p-4` (16px) | Match benchmark, better breathing room |
| Section gaps | `space-y-3` (12px) | `space-y-4` (16px) | Clearer visual separation |
| Settings list gap | `space-y-1` (4px) | `space-y-1` (4px) | Keep tight for cohesion |
| Button internal padding | N/A | `py-2` (8px) | Room for two-line content |
| Header gap | N/A | `space-y-1` (4px) | Tight grouping for user info |

**All spacing follows QDS 4pt grid:**
- gap-1 (4px), gap-2 (8px), gap-3 (12px), gap-4 (16px)
- p-2 (8px), p-3 (12px), p-4 (16px)

---

## Avatar Styling Approach

### QDS Avatar Tokens (Already Defined)

**Light theme (globals.css lines 335-336):**
```css
--avatar-bg: 35 40% 92%;                /* primary/20 equivalent */
--avatar-text: 35 45% 35%;              /* primary dark */
```

**Dark theme (globals.css lines 472-474):**
```css
--avatar-bg: 35 30% 22%;                /* primary dark bg */
--avatar-text: 35 35% 65%;              /* primary light text */
```

### Avatar Component Usage

```tsx
<Avatar className="h-8 w-8">
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback className="avatar-placeholder text-xs font-medium">
    {getInitials(user.name)}
  </AvatarFallback>
</Avatar>
```

**Avatar-placeholder utility (globals.css lines 623-625):**
```css
.avatar-placeholder {
  @apply bg-[hsl(var(--avatar-bg))] text-[hsl(var(--avatar-text))];
}
```

**Sizing:**
- Avatar: 32px (h-8 w-8)
- Fallback text: 12px (text-xs)
- Font weight: medium (500)

**Initials Logic:**
- "John Doe" → "JD"
- "Alice Smith" → "AS"
- "Bob" → "B"
- Uppercase, max 2 characters

---

## Dark Mode Verification Steps

### Automated Token Switching

**No manual dark mode classes needed.** All tokens automatically switch:

1. **Glass Background:**
   - Light: `rgba(255,255,255,0.7)`
   - Dark: `rgba(23,21,17,0.7)`

2. **Glass Border:**
   - Light: `rgba(255,255,255,0.18)`
   - Dark: `rgba(255,255,255,0.08)`

3. **Text Colors:**
   - `text-foreground`: #2A2721 → #F3EFE8
   - `text-muted-foreground`: #625C52 → #B8AEA3

4. **Hover States:**
   - `bg-muted/80`: Adapts via muted token

### Manual Testing Checklist

**After implementation, verify:**
- [ ] Toggle dark mode in app settings
- [ ] Check glass panel background is dark-tinted
- [ ] Verify text is readable (light colors on dark glass)
- [ ] Test avatar fallback (darker bg, lighter text)
- [ ] Check hover states on buttons (muted overlay visible)
- [ ] Verify focus rings (accent-based, should adapt)
- [ ] Test danger button (red text + red/10 hover bg)

**Expected behavior:**
- All elements should maintain WCAG AA contrast in both modes
- Glass effects should feel cohesive with app theme
- No jarring color shifts, smooth transition

---

## Implementation Order

### Phase 1: Structure & Width (30 min)
1. ✅ Increase width to w-80 and padding to p-4
2. ✅ Remove Tabs component and imports
3. ✅ Add Avatar component (install if needed)
4. ✅ Restructure content layout (single column, clear sections)
5. ✅ Add getInitials utility function

**Verify after Phase 1:**
- [ ] Dropdown is wider (320px)
- [ ] No tabs, just clean sections
- [ ] Avatar shows with initials fallback
- [ ] All sections visible and clickable

---

### Phase 2: Content & Polish (20 min)
1. ✅ Add descriptions to settings options (two-line button layout)
2. ✅ Enhance trigger button hover (scale effect)
3. ✅ Update JSDoc to reflect redesign
4. ✅ Add role badge (optional)
5. ✅ Apply consistent spacing (space-y-4 for sections)

**Verify after Phase 2:**
- [ ] Settings options have descriptions
- [ ] Hover on trigger button scales slightly
- [ ] Role badge displays correctly
- [ ] Spacing feels balanced

---

### Phase 3: Refinement (15 min)
1. ✅ Apply glass-text utility throughout
2. ✅ Add motion-reduce support
3. ✅ Enhance focus indicators (ring-4)
4. ✅ Add ARIA labels for sections and descriptions

**Verify after Phase 3:**
- [ ] Text is crisp on glass background
- [ ] No scaling with prefers-reduced-motion enabled
- [ ] Focus rings are prominent (4px)
- [ ] Screen reader announces sections correctly

---

## Testing Checklist

### Visual Quality
- [ ] Width matches QuokkaPointsBadge (w-80)
- [ ] Glass panel effect is smooth and translucent
- [ ] Avatar displays correctly with image and fallback
- [ ] Spacing feels generous (not cramped)
- [ ] Hover states have smooth transitions
- [ ] Focus rings are visible and prominent

### Functionality
- [ ] All navigation callbacks work
- [ ] Logout button triggers correctly
- [ ] Popover opens/closes properly
- [ ] Click outside closes dropdown
- [ ] Escape key closes dropdown

### Accessibility
- [ ] Keyboard navigation works (Tab, Shift+Tab)
- [ ] Escape closes dropdown
- [ ] Screen reader announces all sections
- [ ] Focus indicators are visible on all interactive elements
- [ ] Text contrast meets WCAG AA (4.5:1+)

### Responsive
- [ ] Works at 360px mobile width
- [ ] Glass blur reduces on mobile (8px vs 12px)
- [ ] Touch targets are 44x44px minimum
- [ ] No horizontal overflow

### Dark Mode
- [ ] Toggle dark mode and verify all colors adapt
- [ ] Glass background is dark-tinted
- [ ] Text is readable on dark glass
- [ ] Avatar fallback colors work in dark mode
- [ ] Hover/focus states visible in dark mode

### Browser Support
- [ ] Chrome/Edge: Full glassmorphism
- [ ] Firefox: Full glassmorphism
- [ ] Safari: Full glassmorphism
- [ ] Fallback to solid card if backdrop-filter unsupported

---

## Rollback Plan

**If issues arise after implementation:**

### Quick Rollback
1. Restore previous version from git:
   ```bash
   git checkout HEAD -- components/navbar/profile-settings-dropdown.tsx
   ```

### Partial Rollback
Keep new width/padding, revert to tabs:
1. Restore Tabs imports
2. Restore TabsList/TabsContent structure
3. Keep w-80 and p-4
4. Remove avatar and descriptions

### Safe Incremental Approach
1. Implement Phase 1 only, test thoroughly
2. If stable, proceed to Phase 2
3. If stable, proceed to Phase 3

**Risk level:** Low - Changes are primarily visual/structural, no breaking API changes.

---

## Performance Considerations

### Blur Layer Count
**Before:** 1 layer (glass-panel on PopoverContent)
**After:** 1 layer (unchanged)
✅ Well under 3-layer maximum

### Mobile Optimization
**Automatic blur reduction:**
```css
@media (max-width: 767px) {
  .glass-panel {
    backdrop-filter: blur(var(--blur-sm)); /* 8px instead of 12px */
  }
}
```

### Animation Performance
**Trigger button scale:**
- Uses `transform: scale()` (GPU-accelerated)
- Duration: 300ms (acceptable)
- Disabled with `motion-reduce:hover:scale-100`

**Settings button transitions:**
- Only animates `background-color` (cheap)
- Duration: 200ms
- Disabled with `motion-reduce:transition-none`

---

## File Size Impact

**Current:** 214 lines
**Estimated after redesign:** 230-250 lines

**Breakdown:**
- Remove: ~30 lines (Tabs structure + state)
- Add: ~50 lines (Avatar, descriptions, sections)
- Net: +20-36 lines

**Bundle impact:** Minimal
- Avatar component: +2KB (if not already imported elsewhere)
- No new dependencies

---

## Comparison to QuokkaPointsBadge

### Visual Parity Checklist

| Feature | QuokkaPointsBadge | ProfileSettingsDropdown (After) |
|---------|-------------------|--------------------------------|
| Width | w-80 ✅ | w-80 ✅ |
| Padding | p-4 ✅ | p-4 ✅ |
| Section gaps | space-y-4 ✅ | space-y-4 ✅ |
| Glass-text | Throughout ✅ | Throughout ✅ |
| Rich content | Point sources with breakdown ✅ | Settings with descriptions ✅ |
| Visual identity | Emoji + heading ✅ | Avatar + name ✅ |
| Clear sections | Header, Progress, Sources, CTA ✅ | Header, Profile, Settings, Logout ✅ |
| Hover effects | Scale + duration-300 ✅ | Scale + duration-300 ✅ |
| Focus ring | ring-4 ✅ | ring-4 ✅ |
| Motion-reduce | Supported ✅ | Supported ✅ |

**Parity achieved:** 10/10 features matched ✅

---

## Success Criteria

**Before marking task complete, verify:**

1. ✅ Width increased to w-80
2. ✅ Tab interface removed
3. ✅ Avatar displayed with initials fallback
4. ✅ Visual sections clear (Profile, Settings, Logout)
5. ✅ Settings options have icons + descriptions
6. ✅ Full glassmorphism effects (glass-panel, blur, borders)
7. ✅ QDS 2.0 spacing (p-4, space-y-4)
8. ✅ Keyboard accessible (Tab, Escape)
9. ✅ WCAG 2.2 AA compliant (contrast, focus, ARIA)
10. ✅ Visual polish matches QuokkaPointsBadge quality
11. ✅ Dark mode support verified
12. ✅ Responsive 360-1280px
13. ✅ Types pass (`npx tsc --noEmit`)
14. ✅ Lint clean (`npm run lint`)
15. ✅ Prod build succeeds (`npm run build`)

**Quality bar:** Component should feel as polished as QuokkaPointsBadge when used side-by-side.

---

**Ready for parent agent implementation.**

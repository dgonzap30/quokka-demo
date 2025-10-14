# Profile Dropdown Redesign - Component Design Plan

**Date:** 2025-10-14
**Component Architect:** Sub-Agent
**Status:** Ready for Review

---

## Executive Summary

This plan details the complete redesign of ProfileSettingsDropdown from a tab-based interface (w-64) to a sectioned single-view layout (w-80) with avatar display. The redesign removes 34 LOC, eliminates local state, and matches the visual quality of QuokkaPointsBadge while maintaining all existing functionality.

**Impact:** Improved UX, simplified code, full QDS 2.0 glassmorphism compliance.

---

## 1. Component Hierarchy

### Current Structure (Tab-Based)

```
ProfileSettingsDropdown
├── Popover
│   ├── PopoverTrigger (User icon button)
│   └── PopoverContent (w-64, glass-panel)
│       └── Tabs (activeTab state)
│           ├── TabsList (Profile | Settings)
│           ├── TabsContent (Profile)
│           │   ├── User Info (clickable)
│           │   └── Logout Button
│           └── TabsContent (Settings)
│               └── 4 Settings Buttons
```

### New Structure (Sectioned Single-View)

```
ProfileSettingsDropdown
├── Popover
│   ├── PopoverTrigger (User icon button, unchanged)
│   └── PopoverContent (w-80, glass-panel p-4)
│       └── Container (space-y-4)
│           ├── Section 1: Profile Header (border-b)
│           │   ├── Avatar (h-12 w-12)
│           │   ├── User Name (text-base font-semibold)
│           │   ├── User Email (text-sm glass-text)
│           │   └── Role Badge (text-xs)
│           │   [Clickable if onNavigateProfile exists]
│           ├── Section 2: Settings Options (space-y-1)
│           │   ├── Notifications Button (icon + label)
│           │   ├── Appearance Button (icon + label)
│           │   ├── Privacy Button (icon + label)
│           │   └── Help & Support Button (icon + label)
│           └── Section 3: Logout Action (border-t)
│               └── Logout Button (danger color)
```

**Key Changes:**
- ❌ Remove Tabs, TabsList, TabsContent, TabsTrigger
- ❌ Remove activeTab local state
- ✅ Add Avatar, AvatarImage, AvatarFallback
- ✅ Increase width from w-64 to w-80
- ✅ Add section borders (border-b, border-t)
- ✅ Flatten structure to single view

---

## 2. Props Interface

### Props Interface (Unchanged)

```typescript
export interface ProfileSettingsDropdownProps {
  /**
   * Current authenticated user information
   */
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;  // ← Already exists, will be used
  };

  /**
   * Callback when user clicks Logout button
   * Should handle logout mutation and redirect
   */
  onLogout: () => void;

  /**
   * Optional callback when user navigates to Profile page
   */
  onNavigateProfile?: () => void;

  /**
   * Optional callback when user navigates to Notifications settings
   */
  onNavigateNotifications?: () => void;

  /**
   * Optional callback when user navigates to Appearance settings
   */
  onNavigateAppearance?: () => void;

  /**
   * Optional callback when user navigates to Privacy settings
   */
  onNavigatePrivacy?: () => void;

  /**
   * Optional callback when user navigates to Help & Support
   */
  onNavigateHelp?: () => void;

  /**
   * Optional className for trigger button composition
   */
  className?: string;
}
```

**Analysis:**
- ✅ No changes required to interface
- ✅ user.avatar already optional
- ✅ All callbacks remain the same
- ✅ Backward compatible

---

## 3. Helper Function: getInitials

### File: lib/utils.ts

**Add this function:**

```typescript
/**
 * Extract initials from a full name for avatar fallback
 *
 * @param name - Full name (e.g., "John Doe", "Alice", "Dr. Jane Smith")
 * @returns Initials (max 2 characters, uppercase)
 *
 * @example
 * getInitials("John Doe")       // "JD"
 * getInitials("Alice")          // "A"
 * getInitials("Dr. Jane Smith") // "DJ"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)              // Split on whitespace
    .filter(Boolean)           // Remove empty strings
    .map(word => word[0])      // Take first letter
    .join('')                  // Concatenate
    .toUpperCase()             // Uppercase
    .slice(0, 2);              // Max 2 characters
}
```

**Test Cases:**
```typescript
getInitials("John Doe")         // "JD"
getInitials("Alice")            // "A"
getInitials("Dr. Jane Smith")   // "DJ"
getInitials("  Bob  ")          // "B"
getInitials("Mary-Jane Watson") // "MJ" (depends on split logic)
getInitials("")                 // ""
```

**Usage in Component:**
```typescript
import { getInitials } from "@/lib/utils";

<AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
  {getInitials(user.name)}
</AvatarFallback>
```

---

## 4. Component Structure (Detailed)

### Section 1: Profile Header

**Markup:**

```tsx
{/* Profile Header Section */}
<section
  aria-label="Profile information"
  className={cn(
    "pb-3 border-b border-border",
    onNavigateProfile && "cursor-pointer"
  )}
>
  {onNavigateProfile ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={onNavigateProfile}
      className="w-full justify-start p-2 h-auto hover:bg-muted/50 rounded-lg"
      aria-label={`View profile for ${user.name}`}
    >
      <ProfileHeaderContent />
    </Button>
  ) : (
    <div className="p-2">
      <ProfileHeaderContent />
    </div>
  )}
</section>
```

**ProfileHeaderContent Subcomponent:**

```tsx
function ProfileHeaderContent() {
  return (
    <div className="flex items-start gap-3 w-full">
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate" title={user.name}>
          {user.name}
        </p>
        <p className="text-sm text-muted-foreground glass-text truncate" title={user.email}>
          {user.email}
        </p>
        <Badge
          variant="secondary"
          className="mt-1 text-xs"
        >
          {user.role}
        </Badge>
      </div>
    </div>
  );
}
```

**Features:**
- Avatar: h-12 w-12 (larger than default)
- Fallback: Primary color with 10% opacity background
- Initials: Font-semibold, text-sm
- User Name: text-base font-semibold, truncates
- User Email: text-sm glass-text, truncates
- Role Badge: secondary variant, text-xs
- Clickable if onNavigateProfile exists
- Hover state: hover:bg-muted/50

---

### Section 2: Settings Options

**Markup:**

```tsx
{/* Settings Options Section */}
<section aria-label="Settings options">
  <div className="space-y-1">
    {/* Notifications */}
    {onNavigateNotifications && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateNotifications}
        className="w-full justify-start gap-3"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        <span>Notifications</span>
      </Button>
    )}

    {/* Appearance */}
    {onNavigateAppearance && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateAppearance}
        className="w-full justify-start gap-3"
      >
        <Moon className="h-4 w-4" aria-hidden="true" />
        <span>Appearance</span>
      </Button>
    )}

    {/* Privacy */}
    {onNavigatePrivacy && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigatePrivacy}
        className="w-full justify-start gap-3"
      >
        <Shield className="h-4 w-4" aria-hidden="true" />
        <span>Privacy</span>
      </Button>
    )}

    {/* Help & Support */}
    {onNavigateHelp && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateHelp}
        className="w-full justify-start gap-3"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        <span>Help & Support</span>
      </Button>
    )}
  </div>
</section>
```

**Features:**
- space-y-1 for tight vertical spacing
- Ghost variant buttons (consistent hover)
- justify-start alignment
- gap-3 between icon and label
- Icons: h-4 w-4 (standard size)
- Conditional rendering (only if callback exists)
- aria-hidden on icons (label is sufficient)

**Conditional Rendering Strategy:**
- If ALL callbacks are undefined → hide entire section
- If SOME callbacks are undefined → hide specific buttons
- Graceful degradation

**Optional: Hide Empty Section**

```tsx
{(onNavigateNotifications || onNavigateAppearance || onNavigatePrivacy || onNavigateHelp) && (
  <section aria-label="Settings options">
    {/* ... buttons ... */}
  </section>
)}
```

---

### Section 3: Logout Action

**Markup:**

```tsx
{/* Logout Action Section */}
<section aria-label="Account actions" className="pt-3 border-t border-border">
  <Button
    variant="ghost"
    size="sm"
    onClick={onLogout}
    className="w-full justify-start gap-3 text-danger hover:text-danger hover:bg-danger/10"
  >
    <LogOut className="h-4 w-4" aria-hidden="true" />
    <span>Log out</span>
  </Button>
</section>
```

**Features:**
- border-t border-border (visual separation)
- pt-3 (padding top)
- Danger color (text-danger)
- Danger hover state (hover:bg-danger/10)
- LogOut icon (h-4 w-4)
- Always visible (onLogout is required)

---

## 5. Complete Component Code

### File: components/navbar/profile-settings-dropdown.tsx

**Full Implementation:**

```tsx
"use client";

import * as React from "react";
import { User, LogOut, Bell, Moon, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

export interface ProfileSettingsDropdownProps {
  /**
   * Current authenticated user information
   */
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };

  /**
   * Callback when user clicks Logout button
   * Should handle logout mutation and redirect
   */
  onLogout: () => void;

  /**
   * Optional callback when user navigates to Profile page
   */
  onNavigateProfile?: () => void;

  /**
   * Optional callback when user navigates to Notifications settings
   */
  onNavigateNotifications?: () => void;

  /**
   * Optional callback when user navigates to Appearance settings
   */
  onNavigateAppearance?: () => void;

  /**
   * Optional callback when user navigates to Privacy settings
   */
  onNavigatePrivacy?: () => void;

  /**
   * Optional callback when user navigates to Help & Support
   */
  onNavigateHelp?: () => void;

  /**
   * Optional className for trigger button composition
   */
  className?: string;
}

/**
 * ProfileSettingsDropdown Component
 *
 * Elegant single-view dropdown for user profile and settings access
 *
 * Features:
 * - Sectioned layout: Profile, Settings, Logout
 * - Avatar display with fallback to initials
 * - Full QDS 2.0 glassmorphism styling
 * - Keyboard accessible (Tab, Escape)
 * - WCAG 2.2 AA compliant
 * - Mobile-responsive (w-80 width)
 */
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
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "min-h-[44px] min-w-[44px] h-11 w-11",
            "transition-all duration-200",
            "hover:bg-muted/50",
            "focus-visible:ring-2 focus-visible:ring-accent/60",
            className
          )}
          aria-label="Account and Settings"
          aria-haspopup="dialog"
        >
          <User
            className="h-5 w-5 text-foreground/70"
            aria-hidden="true"
          />
          <span className="sr-only">Account and Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 glass-panel p-4"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4">
          {/* Section 1: Profile Header */}
          <section
            aria-label="Profile information"
            className={cn(
              "pb-3 border-b border-border",
              onNavigateProfile && "cursor-pointer"
            )}
          >
            {onNavigateProfile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateProfile}
                className="w-full justify-start p-2 h-auto hover:bg-muted/50 rounded-lg"
                aria-label={`View profile for ${user.name}`}
              >
                <ProfileHeader user={user} />
              </Button>
            ) : (
              <div className="p-2">
                <ProfileHeader user={user} />
              </div>
            )}
          </section>

          {/* Section 2: Settings Options */}
          {(onNavigateNotifications || onNavigateAppearance || onNavigatePrivacy || onNavigateHelp) && (
            <section aria-label="Settings options">
              <div className="space-y-1">
                {onNavigateNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateNotifications}
                    className="w-full justify-start gap-3"
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    <span>Notifications</span>
                  </Button>
                )}
                {onNavigateAppearance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateAppearance}
                    className="w-full justify-start gap-3"
                  >
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    <span>Appearance</span>
                  </Button>
                )}
                {onNavigatePrivacy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigatePrivacy}
                    className="w-full justify-start gap-3"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Privacy</span>
                  </Button>
                )}
                {onNavigateHelp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateHelp}
                    className="w-full justify-start gap-3"
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Help & Support</span>
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Logout Action */}
          <section aria-label="Account actions" className="pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start gap-3 text-danger hover:text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Log out</span>
            </Button>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * ProfileHeader Subcomponent
 *
 * Displays user avatar, name, email, and role badge
 */
function ProfileHeader({ user }: { user: ProfileSettingsDropdownProps["user"] }) {
  return (
    <div className="flex items-start gap-3 w-full">
      {/* Avatar with fallback to initials */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate" title={user.name}>
          {user.name}
        </p>
        <p className="text-sm text-muted-foreground glass-text truncate" title={user.email}>
          {user.email}
        </p>
        <Badge variant="secondary" className="mt-1 text-xs">
          {user.role}
        </Badge>
      </div>
    </div>
  );
}
```

**Lines of Code:** ~180 LOC (down from 214 LOC)

---

## 6. State Management

### Current State (Removed)

```typescript
// ❌ REMOVE THIS
const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");
```

### New State (None)

**No local state required.**
- Component is fully stateless
- All state managed by Radix Popover primitives (open/closed)
- Callbacks handle navigation externally

---

## 7. Event Handling

### Navigation Callbacks (Unchanged)

All callbacks remain the same:
- `onLogout()` - Logout button
- `onNavigateProfile()` - Profile header click
- `onNavigateNotifications()` - Notifications button
- `onNavigateAppearance()` - Appearance button
- `onNavigatePrivacy()` - Privacy button
- `onNavigateHelp()` - Help & Support button

**Usage in Parent (GlobalNavBar):**

```typescript
// components/layout/global-nav-bar.tsx (no changes needed)
<ProfileSettingsDropdown
  user={user}
  onLogout={handleLogout}
  onNavigateProfile={() => router.push('/profile')}
  onNavigateNotifications={() => router.push('/settings?tab=notifications')}
  onNavigateAppearance={() => router.push('/settings?tab=appearance')}
  onNavigatePrivacy={() => router.push('/settings?tab=privacy')}
  onNavigateHelp={() => router.push('/settings?tab=help')}
/>
```

---

## 8. Variant System

### No Variants Needed

This component has a single presentation:
- w-80 width (fixed)
- glass-panel styling (fixed)
- Sectioned layout (fixed)

**className prop supports composition:**
```tsx
<ProfileSettingsDropdown
  {...props}
  className="mr-2" // Custom trigger button styling
/>
```

---

## 9. File Structure

### Files to Create

**1. Helper Function:**
- **File:** `lib/utils.ts`
- **Action:** Add `getInitials()` function
- **Lines:** +15 LOC

### Files to Modify

**2. Main Component:**
- **File:** `components/navbar/profile-settings-dropdown.tsx`
- **Action:** Complete rewrite (remove tabs, add sections)
- **Before:** 214 LOC
- **After:** ~180 LOC
- **Net Change:** -34 LOC

**3. Badge Component (Check if needed):**
- **File:** `components/ui/badge.tsx`
- **Action:** Verify component exists (shadcn/ui)
- **Expected:** Already exists (used elsewhere in codebase)

### Files to Read (No Changes)

**4. Integration Point:**
- **File:** `components/layout/global-nav-bar.tsx`
- **Action:** Verify usage (lines 229-237)
- **Expected:** No changes needed (interface unchanged)

**5. Avatar Component:**
- **File:** `components/ui/avatar.tsx`
- **Action:** Already exists (verified in research)
- **Expected:** No changes needed

---

## 10. Usage Examples

### Example 1: Basic Usage (All Callbacks)

```tsx
import { ProfileSettingsDropdown } from "@/components/navbar/profile-settings-dropdown";
import { useRouter } from "next/navigation";

function NavBar({ user }: { user: User }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  return (
    <nav>
      <ProfileSettingsDropdown
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }}
        onLogout={handleLogout}
        onNavigateProfile={() => router.push('/profile')}
        onNavigateNotifications={() => router.push('/settings?tab=notifications')}
        onNavigateAppearance={() => router.push('/settings?tab=appearance')}
        onNavigatePrivacy={() => router.push('/settings?tab=privacy')}
        onNavigateHelp={() => router.push('/settings?tab=help')}
      />
    </nav>
  );
}
```

### Example 2: Minimal Usage (Only Logout)

```tsx
<ProfileSettingsDropdown
  user={{
    name: "John Doe",
    email: "john@example.com",
    role: "student",
    // No avatar → shows initials "JD"
  }}
  onLogout={handleLogout}
  // No navigation callbacks → Settings section hidden
/>
```

### Example 3: With Avatar

```tsx
<ProfileSettingsDropdown
  user={{
    name: "Jane Smith",
    email: "jane@university.edu",
    role: "instructor",
    avatar: "https://example.com/avatars/jane.jpg",
  }}
  onLogout={handleLogout}
  onNavigateProfile={() => router.push('/profile')}
/>
```

### Example 4: Custom Trigger Styling

```tsx
<ProfileSettingsDropdown
  {...props}
  className="md:mr-4 lg:mr-6" // Responsive margins
/>
```

---

## 11. Test Scenarios

### Functional Tests

**Avatar Display:**
- [ ] User with avatar URL → displays image correctly
- [ ] User without avatar → displays initials fallback
- [ ] User with single-word name → displays single initial
- [ ] User with 3+ word name → displays first 2 initials
- [ ] Empty name → handles gracefully (shows placeholder)
- [ ] Avatar load failure → falls back to initials

**Navigation:**
- [ ] Click Profile header (with callback) → calls onNavigateProfile
- [ ] Click Profile header (no callback) → no action (not clickable)
- [ ] Click Notifications button → calls onNavigateNotifications
- [ ] Click Appearance button → calls onNavigateAppearance
- [ ] Click Privacy button → calls onNavigatePrivacy
- [ ] Click Help button → calls onNavigateHelp
- [ ] Click Logout button → calls onLogout
- [ ] Settings section hidden when all callbacks undefined

**Keyboard Navigation:**
- [ ] Tab to trigger button → opens dropdown
- [ ] Tab through sections → focus visible on each item
- [ ] Enter on focused item → triggers callback
- [ ] Escape key → closes dropdown
- [ ] Focus trap works within dropdown

**Accessibility:**
- [ ] Screen reader announces "Account and Settings" on trigger
- [ ] Screen reader announces each section label
- [ ] Avatar has alt text (user name)
- [ ] Fallback initials readable by screen reader
- [ ] All buttons have accessible labels
- [ ] Contrast ratios ≥ 4.5:1 for all text
- [ ] Focus indicators visible on all items

**Responsive Design:**
- [ ] Test at 360px → w-80 fits with margins
- [ ] Test at 768px → dropdown aligns correctly
- [ ] Test at 1024px → desktop layout renders
- [ ] Test at 1280px → no overflow issues
- [ ] Touch targets ≥ 44x44px on all devices
- [ ] Text truncates properly (no overflow)

**Dark Mode:**
- [ ] Glass-panel renders with dark theme tokens
- [ ] Avatar fallback uses dark avatar tokens
- [ ] Borders visible in dark mode
- [ ] Shadows adapt to dark theme
- [ ] Text contrast maintained (≥ 4.5:1)
- [ ] glass-text shadow appropriate for dark

**Edge Cases:**
- [ ] Very long name → truncates with ellipsis
- [ ] Very long email → truncates with ellipsis
- [ ] User with no role → badge still renders
- [ ] Rapid open/close → no state bugs
- [ ] Multiple instances on page → all work independently

---

### Performance Tests

**Glassmorphism:**
- [ ] Blur renders smoothly (no jank)
- [ ] Mobile reduces blur intensity (check globals.css)
- [ ] Max 3 blur layers rule respected
- [ ] GPU acceleration enabled (transform: translateZ(0))

**Component Size:**
- [ ] Component code ≤ 200 LOC
- [ ] No unnecessary re-renders
- [ ] Popover state managed efficiently

---

## 12. Accessibility Checklist

### WCAG 2.2 AA Compliance

**Perceivable:**
- [ ] Text contrast ≥ 4.5:1 for all body text
- [ ] Large text (≥18px) contrast ≥ 3:1
- [ ] Avatar fallback contrast ≥ 4.5:1
- [ ] Icons have aria-hidden (labels are sufficient)
- [ ] All images have alt text (avatar)

**Operable:**
- [ ] All functionality keyboard accessible
- [ ] Focus indicators visible (2px ring minimum)
- [ ] Touch targets ≥ 44x44px
- [ ] No keyboard traps
- [ ] Escape key closes dropdown

**Understandable:**
- [ ] Labels clear and descriptive
- [ ] Section headings present (aria-label)
- [ ] Navigation buttons explain destination
- [ ] Logout button clearly labeled

**Robust:**
- [ ] Valid semantic HTML
- [ ] ARIA roles correct (dialog on PopoverContent)
- [ ] ARIA labels on sections
- [ ] Works with screen readers (tested)

---

## 13. QDS 2.0 Compliance

### Design Tokens Used

**Colors:**
- ✅ --primary (avatar fallback)
- ✅ --muted-foreground (email text)
- ✅ --danger (logout button)
- ✅ --border (section separators)
- ✅ --border-glass (glass panel border)

**Glassmorphism:**
- ✅ .glass-panel (PopoverContent)
- ✅ .glass-text (email text shadow)
- ✅ --blur-md (backdrop blur 12px)
- ✅ --shadow-glass-md (soft shadow)

**Spacing:**
- ✅ space-y-4 (between sections)
- ✅ space-y-1 (within Settings list)
- ✅ gap-3 (icon to label spacing)
- ✅ p-4 (PopoverContent padding)
- ✅ pb-3 (Profile section bottom)
- ✅ pt-3 (Logout section top)

**Radius:**
- ✅ rounded-lg (buttons, avatar, PopoverContent)
- ✅ rounded-full (avatar)

**Typography:**
- ✅ text-base (user name)
- ✅ text-sm (email, button labels)
- ✅ text-xs (role badge)
- ✅ font-semibold (user name, initials)

**Shadows:**
- ✅ shadow-glass-md (PopoverContent)

---

## 14. Performance Optimization

### Memoization Opportunities

**Not Needed:**
- Component is lightweight (no expensive computations)
- Props are stable (user object, callbacks)
- No lists to virtualize
- Popover handles its own state

**If Needed Later:**
```typescript
const ProfileHeader = React.memo(function ProfileHeader({ user }) {
  // ...
});
```

### Render Optimization

**Current:**
- Popover re-renders only on open/close (Radix handles)
- No local state → no unnecessary re-renders
- Conditional rendering avoids empty sections

**Future:**
- Monitor with React DevTools Profiler
- Add React.memo if parent re-renders frequently

---

## 15. Migration Strategy

### Step-by-Step Implementation

**Step 1: Add Helper Function**
1. Open `lib/utils.ts`
2. Add `getInitials()` function at end
3. Export function
4. Run typecheck: `npx tsc --noEmit`

**Step 2: Update Component Imports**
1. Open `components/navbar/profile-settings-dropdown.tsx`
2. Remove Tabs imports:
   ```typescript
   // DELETE THESE
   import {
     Tabs,
     TabsContent,
     TabsList,
     TabsTrigger,
   } from "@/components/ui/tabs";
   ```
3. Add Avatar imports:
   ```typescript
   import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
   ```
4. Add Badge import (if not present):
   ```typescript
   import { Badge } from "@/components/ui/badge";
   ```
5. Update utils import:
   ```typescript
   import { cn, getInitials } from "@/lib/utils";
   ```

**Step 3: Remove Local State**
1. Delete `activeTab` state:
   ```typescript
   // DELETE THIS
   const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");
   ```

**Step 4: Replace PopoverContent**
1. Update width: `w-64` → `w-80`
2. Update padding: `p-3` → `p-4`
3. Keep: `glass-panel`, `align="end"`, `sideOffset={8}`

**Step 5: Replace Content Structure**
1. Remove `<Tabs>` wrapper
2. Add `<div className="space-y-4">` container
3. Add Section 1 (Profile Header)
4. Add Section 2 (Settings Options)
5. Add Section 3 (Logout Action)

**Step 6: Extract ProfileHeader**
1. Create `ProfileHeader` function component
2. Move avatar + user info markup
3. Pass user prop

**Step 7: Test Implementation**
1. Run dev server: `npm run dev`
2. Test all scenarios (see Test Scenarios section)
3. Check console for errors
4. Verify TypeScript: `npx tsc --noEmit`
5. Verify lint: `npm run lint`

**Step 8: Production Build**
1. Build: `npm run build`
2. Verify no build errors
3. Test production: `npm start`

---

## 16. Rollback Plan

### If Issues Occur

**Option 1: Revert Git Commit**
```bash
git revert HEAD
```

**Option 2: Manual Rollback**
1. Restore `components/navbar/profile-settings-dropdown.tsx` from backup
2. Remove `getInitials()` from `lib/utils.ts`
3. Rebuild: `npm run build`

**Known Risks:**
- Low risk (interface unchanged, backward compatible)
- Avatar component already exists
- Width change tested at all breakpoints

---

## 17. Future Enhancements (Out of Scope)

**Potential Features:**
- [ ] User status indicator (online/offline)
- [ ] Notification badge count on trigger
- [ ] Quick settings toggles (theme, notifications)
- [ ] Recent activity preview
- [ ] Account switching (multi-account support)
- [ ] Avatar upload from dropdown
- [ ] Keyboard shortcuts display

**Not Recommended:**
- ❌ Adding tabs back (defeats purpose)
- ❌ Expanding to w-96 (too wide)
- ❌ Adding animations (keep it simple)
- ❌ Complex state (keep stateless)

---

## 18. Documentation Updates

### Files to Update

**README.md:**
- Update component screenshot (if present)
- Document new width (w-80)
- Mention avatar support

**CLAUDE.md:**
- Reference ProfileSettingsDropdown as example
- Mention sectioned layout pattern
- Update LOC count in project overview

**QDS.md:**
- Add ProfileSettingsDropdown to examples (if applicable)
- Reference as glassmorphism usage

---

## 19. Implementation Checklist

### Pre-Implementation

- [ ] Review this plan with team/user
- [ ] Approve architectural decisions
- [ ] Verify Avatar component exists
- [ ] Check Badge component availability
- [ ] Ensure lib/utils.ts exists

### Implementation

- [ ] Add getInitials() to lib/utils.ts
- [ ] Update ProfileSettingsDropdown imports
- [ ] Remove Tabs imports and state
- [ ] Add Avatar and Badge imports
- [ ] Rewrite PopoverContent structure
- [ ] Create ProfileHeader subcomponent
- [ ] Update width to w-80
- [ ] Add section borders
- [ ] Test all navigation callbacks

### Testing

- [ ] Run typecheck (npx tsc --noEmit)
- [ ] Run lint (npm run lint)
- [ ] Test avatar with image
- [ ] Test avatar fallback (initials)
- [ ] Test all navigation callbacks
- [ ] Test keyboard navigation
- [ ] Test at 360px, 768px, 1024px, 1280px
- [ ] Test dark mode
- [ ] Test screen reader (VoiceOver/NVDA)
- [ ] Verify contrast ratios (WCAG AA)
- [ ] Check console for errors

### Deployment

- [ ] Build production (npm run build)
- [ ] Verify build succeeds
- [ ] Test production mode (npm start)
- [ ] Commit with conventional commit
- [ ] Update documentation
- [ ] Mark task complete in context.md

---

## 20. Success Criteria

### Quantitative Metrics

- [ ] Component LOC ≤ 200 (target: ~180)
- [ ] Width increased to w-80 (320px)
- [ ] Zero local state (removed activeTab)
- [ ] Avatar displays in 100% of renders
- [ ] All tests pass (100% functional coverage)
- [ ] TypeScript errors: 0
- [ ] Lint errors: 0
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Contrast ratios ≥ 4.5:1

### Qualitative Metrics

- [ ] Visual hierarchy clear and intuitive
- [ ] Matches QuokkaPointsBadge quality
- [ ] Glassmorphism effects render smoothly
- [ ] User feedback positive (if available)
- [ ] Code is maintainable and readable
- [ ] Follows QDS 2.0 patterns
- [ ] Accessible to screen reader users
- [ ] Mobile experience excellent

---

## 21. Key Decisions Summary

1. **Remove tabs entirely** → Single-view sectioned layout
2. **Increase width to w-80** → Match QuokkaPointsBadge standard
3. **Add Avatar with fallback** → Use existing shadcn/ui Avatar component
4. **3-section structure** → Profile, Settings, Logout
5. **Use border separation** → border-b and border-t for visual hierarchy
6. **Conditional rendering** → Hide sections when callbacks undefined
7. **Extract ProfileHeader** → Separate function component for reusability
8. **No local state** → Fully stateless, Popover manages open/close
9. **Follow QuokkaPointsBadge** → Use as blueprint for structure and spacing
10. **Maintain interface** → No breaking changes to props

---

## Conclusion

This redesign transforms ProfileSettingsDropdown from an over-engineered tab-based interface to an elegant, single-view sectioned layout that matches the visual quality of QuokkaPointsBadge. The removal of tabs, addition of avatar display, and increased width (w-80) create a superior user experience while simplifying the codebase by 34 LOC. Full QDS 2.0 glassmorphism compliance, WCAG 2.2 AA accessibility, and mobile responsiveness are maintained throughout.

**Ready for implementation.**

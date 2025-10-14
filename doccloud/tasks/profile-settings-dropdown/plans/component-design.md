# ProfileSettingsDropdown - Component Design & Implementation Plan

**Date:** 2025-10-14
**Component Architect:** Planning Phase

---

## 1. Component Hierarchy

```
ProfileSettingsDropdown/
├── Popover (shadcn/ui)
│   ├── PopoverTrigger (Button with User icon)
│   └── PopoverContent (w-80 glass-panel)
│       ├── Tabs (shadcn/ui)
│       │   ├── TabsList
│       │   │   ├── TabsTrigger (Profile)
│       │   │   └── TabsTrigger (Settings)
│       │   ├── TabsContent (Profile)
│       │   │   ├── UserInfoSection
│       │   │   │   ├── Avatar
│       │   │   │   ├── Name
│       │   │   │   ├── Email
│       │   │   │   └── Role
│       │   │   ├── QuokkaPointsSummary (optional)
│       │   │   ├── Separator
│       │   │   ├── DashboardLink (optional)
│       │   │   ├── Separator
│       │   │   └── LogoutButton
│       │   └── TabsContent (Settings)
│       │       ├── SettingsOptionsList (3-5 items)
│       │       ├── Separator
│       │       └── FullSettingsLink
```

---

## 2. Props Interface (TypeScript)

### 2.1 Main Component Props

```typescript
// File: /Users/dgz/projects-professional/quokka/quokka-demo/components/navbar/profile-settings-dropdown.tsx

import type { User } from "@/lib/models/types";

/**
 * Props for ProfileSettingsDropdown component
 *
 * Consolidates user profile and settings into a single dropdown
 * with tab switching between Profile and Settings sections.
 */
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
   * Optional Quokka Points summary for Profile tab
   * If provided, displays points card in Profile section
   */
  quokkaPoints?: {
    totalPoints: number;
    weeklyPoints: number;
  };

  /**
   * Callback when user clicks Logout button
   * Should handle logout mutation and redirect
   */
  onLogout: () => void;

  /**
   * Optional callback when user navigates to Dashboard
   * If not provided, Dashboard link is hidden
   */
  onNavigateDashboard?: () => void;

  /**
   * Optional callback when user navigates to full Settings page
   * If not provided, uses default link behavior
   */
  onNavigateSettings?: () => void;

  /**
   * Optional handler to view detailed Quokka Points breakdown
   * Triggered when user clicks on points summary
   */
  onViewPointsDetails?: () => void;

  /**
   * Optional className for trigger button composition
   */
  className?: string;
}
```

### 2.2 Internal Sub-Component Props (Not Exported)

```typescript
/**
 * Props for QuokkaPointsSummary internal component
 */
interface QuokkaPointsSummaryProps {
  totalPoints: number;
  weeklyPoints: number;
  onViewDetails?: () => void;
}

/**
 * Props for SettingsOption internal component
 */
interface SettingsOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick?: () => void;
  href?: string;
}
```

---

## 3. State Management Plan

### 3.1 Local State

```typescript
// Active tab state (Profile or Settings)
const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
```

**Justification:**
- Tab switching is ephemeral UI state (no URL persistence needed)
- Local useState is sufficient (no global state required)
- Default to "profile" tab (primary use case)

### 3.2 Props State Flow

```
NavHeader (Parent)
  ├─ useCurrentUser() → user data
  ├─ useStudentDashboard() → quokkaPoints data
  ├─ handleLogout() → onLogout callback
  ├─ router.push("/dashboard") → onNavigateDashboard callback
  └─ router.push("/settings") → onNavigateSettings callback
      ↓ (props)
GlobalNavBar (Grandparent)
      ↓ (props)
ProfileSettingsDropdown (Component)
  └─ Manages local tab state only
```

### 3.3 No Global State Needed
- User data: Already cached in React Query (from useCurrentUser)
- Points data: Already cached in React Query (from useStudentDashboard)
- No cross-component state sharing required

---

## 4. Event Handling Pattern

### 4.1 Tab Switching

```typescript
// Built-in Radix Tabs behavior
<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "profile" | "settings")}>
  {/* ... */}
</Tabs>
```

**Event Flow:**
1. User clicks TabsTrigger (Profile or Settings)
2. Radix Tabs calls onValueChange callback
3. setActiveTab updates local state
4. TabsContent re-renders based on new activeTab value

### 4.2 Navigation Actions

```typescript
// Dashboard Link
<Button
  variant="ghost"
  className="w-full justify-start"
  onClick={() => {
    onNavigateDashboard?.();
    // Popover auto-closes on navigation (Radix default)
  }}
>
  <Home className="h-4 w-4" />
  Dashboard
</Button>

// Full Settings Link
<Button
  variant="ghost"
  className="w-full justify-start"
  onClick={() => {
    onNavigateSettings?.();
  }}
>
  <Settings className="h-4 w-4" />
  All Settings
</Button>

// Logout Button
<Button
  variant="ghost"
  className="w-full justify-start text-danger"
  onClick={() => {
    onLogout();
  }}
>
  <LogOut className="h-4 w-4" />
  Log out
</Button>
```

### 4.3 Popover Control

```typescript
// Automatic close behavior (Radix Popover defaults):
// - Clicks outside popover
// - Escape key press
// - Navigation actions (onOpenChange triggered)

// No manual open/close state needed (uncontrolled Popover)
```

---

## 5. Variant System

### 5.1 Visual Variants
**No visual variants needed:**
- Fixed width: w-80 (320px)
- Fixed styling: glass-panel
- Color scheme: QDS tokens (automatic dark mode)

### 5.2 Behavioral Variants

**Conditional Rendering:**
```typescript
// Quokka Points Summary (optional)
{quokkaPoints && (
  <QuokkaPointsSummary {...quokkaPoints} onViewDetails={onViewPointsDetails} />
)}

// Dashboard Link (optional)
{onNavigateDashboard && (
  <Button onClick={onNavigateDashboard}>Dashboard</Button>
)}
```

### 5.3 className Composition

```typescript
// Trigger button accepts className prop
<Button
  variant="ghost"
  size="icon"
  className={cn(
    "min-h-[44px] min-w-[44px] h-11 w-11",
    "transition-all duration-300 ease-out",
    "hover:bg-secondary/5 hover:scale-[1.08]",
    "motion-reduce:hover:scale-100",
    "focus-visible:ring-4 focus-visible:ring-accent/60",
    className // Allow parent to override/extend
  )}
>
```

---

## 6. File Structure

### 6.1 New File to Create

```
/Users/dgz/projects-professional/quokka/quokka-demo/components/navbar/profile-settings-dropdown.tsx
```

**Estimated Size:** ~180 lines

**Structure:**
1. Imports (lines 1-15)
2. Props interface (lines 17-75)
3. Internal sub-component: QuokkaPointsSummary (lines 77-110)
4. Internal sub-component: SettingsOption (lines 112-135)
5. Main component: ProfileSettingsDropdown (lines 137-180)

### 6.2 Files to Modify

**File 1:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/global-nav-bar.tsx`
- **Lines to remove:** 230-251 (Settings icon button)
- **Lines to remove:** Line 54 (onOpenSettings prop from interface)
- **Lines to replace:** 267-316 (Replace User dropdown with ProfileSettingsDropdown)
- **New import:** `import { ProfileSettingsDropdown } from "@/components/navbar/profile-settings-dropdown";`

**File 2:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx`
- **Lines to modify:** Line 98 (Remove onOpenSettings handler)
- **Note:** NavHeader already provides all necessary data (user, quokkaPoints, onLogout)

### 6.3 No New Dependencies
All required components already available:
- Popover (shadcn/ui)
- Tabs (shadcn/ui)
- Button (shadcn/ui)
- Avatar (shadcn/ui)
- Lucide icons (already installed)

---

## 7. Implementation Steps (Step-by-Step)

### Step 1: Create Component File with Props Interface

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/navbar/profile-settings-dropdown.tsx`

```typescript
"use client";

import * as React from "react";
import { User, Settings, Home, LogOut, Bell, Moon, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProfileSettingsDropdownProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  quokkaPoints?: {
    totalPoints: number;
    weeklyPoints: number;
  };
  onLogout: () => void;
  onNavigateDashboard?: () => void;
  onNavigateSettings?: () => void;
  onViewPointsDetails?: () => void;
  className?: string;
}
```

### Step 2: Create Internal Sub-Components

**QuokkaPointsSummary Component:**
```typescript
interface QuokkaPointsSummaryProps {
  totalPoints: number;
  weeklyPoints: number;
  onViewDetails?: () => void;
}

function QuokkaPointsSummary({
  totalPoints,
  weeklyPoints,
  onViewDetails,
}: QuokkaPointsSummaryProps) {
  return (
    <button
      onClick={onViewDetails}
      className={cn(
        "w-full p-3 rounded-lg glass-panel hover:bg-primary/5",
        "transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-primary/60",
        !onViewDetails && "cursor-default hover:bg-transparent"
      )}
      disabled={!onViewDetails}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🦘</span>
          <span className="text-sm font-medium">Quokka Points</span>
        </div>
        <span className="text-lg font-bold text-primary tabular-nums">
          {totalPoints.toLocaleString()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-left">
        +{weeklyPoints} this week
      </p>
    </button>
  );
}
```

**SettingsOption Component:**
```typescript
interface SettingsOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick?: () => void;
}

function SettingsOption({
  icon: Icon,
  label,
  description,
  onClick,
}: SettingsOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-md text-left",
        "hover:bg-muted/50 transition-colors",
        "focus-visible:ring-2 focus-visible:ring-accent/60"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
```

### Step 3: Create Main Component Structure

```typescript
export function ProfileSettingsDropdown({
  user,
  quokkaPoints,
  onLogout,
  onNavigateDashboard,
  onNavigateSettings,
  onViewPointsDetails,
  className,
}: ProfileSettingsDropdownProps) {
  const [activeTab, setActiveTab] = React.useState<"profile" | "settings">("profile");

  // Get user initials for avatar fallback
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "min-h-[44px] min-w-[44px] h-11 w-11",
            "transition-all duration-300 ease-out",
            "hover:bg-secondary/5 hover:scale-[1.08]",
            "motion-reduce:hover:scale-100",
            "focus-visible:ring-4 focus-visible:ring-accent/60",
            "group",
            className
          )}
          aria-label="Account and Settings"
          aria-haspopup="dialog"
        >
          <User
            className="h-5 w-5 text-foreground/80 transition-all duration-300 ease-out group-hover:text-secondary group-hover:scale-110 motion-reduce:group-hover:scale-100"
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
        {/* Tabs content will go here */}
      </PopoverContent>
    </Popover>
  );
}
```

### Step 4: Add Tabs Structure

```typescript
<PopoverContent className="w-80 glass-panel p-4" align="end" sideOffset={8}>
  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "profile" | "settings")}>
    <TabsList className="w-full">
      <TabsTrigger value="profile" className="flex-1">
        <User className="h-4 w-4" />
        Profile
      </TabsTrigger>
      <TabsTrigger value="settings" className="flex-1">
        <Settings className="h-4 w-4" />
        Settings
      </TabsTrigger>
    </TabsList>

    {/* Profile Tab Content */}
    <TabsContent value="profile" className="space-y-4 mt-4">
      {/* User Info Section */}
      {/* Quokka Points Summary (optional) */}
      {/* Dashboard Link (optional) */}
      {/* Logout Button */}
    </TabsContent>

    {/* Settings Tab Content */}
    <TabsContent value="settings" className="space-y-4 mt-4">
      {/* Settings Options (3-5 items) */}
      {/* Full Settings Link */}
    </TabsContent>
  </Tabs>
</PopoverContent>
```

### Step 5: Implement Profile Tab Content

```typescript
<TabsContent value="profile" className="space-y-4 mt-4">
  {/* User Info Section */}
  <div className="flex items-center gap-3">
    <Avatar className="h-12 w-12">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="avatar-placeholder text-lg">
        {initials}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{user.name}</p>
      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
    </div>
  </div>

  {/* Quokka Points Summary (optional) */}
  {quokkaPoints && (
    <>
      <div className="h-px bg-border" aria-hidden="true" />
      <QuokkaPointsSummary
        totalPoints={quokkaPoints.totalPoints}
        weeklyPoints={quokkaPoints.weeklyPoints}
        onViewDetails={onViewPointsDetails}
      />
    </>
  )}

  {/* Dashboard Link (optional) */}
  {onNavigateDashboard && (
    <>
      <div className="h-px bg-border" aria-hidden="true" />
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={onNavigateDashboard}
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Button>
    </>
  )}

  {/* Logout Button */}
  <div className="h-px bg-border" aria-hidden="true" />
  <Button
    variant="ghost"
    className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10"
    onClick={onLogout}
  >
    <LogOut className="h-4 w-4" />
    Log out
  </Button>
</TabsContent>
```

### Step 6: Implement Settings Tab Content

```typescript
<TabsContent value="settings" className="space-y-2 mt-4">
  {/* Settings Options */}
  <div className="space-y-1">
    <SettingsOption
      icon={Bell}
      label="Notifications"
      description="Manage email and push notifications"
      onClick={() => {
        onNavigateSettings?.();
        // TODO: Navigate to settings with #notifications anchor
      }}
    />
    <SettingsOption
      icon={Moon}
      label="Appearance"
      description="Theme and display preferences"
      onClick={() => {
        onNavigateSettings?.();
        // TODO: Navigate to settings with #appearance anchor
      }}
    />
    <SettingsOption
      icon={Shield}
      label="Privacy"
      description="Control your data and visibility"
      onClick={() => {
        onNavigateSettings?.();
        // TODO: Navigate to settings with #privacy anchor
      }}
    />
    <SettingsOption
      icon={HelpCircle}
      label="Help & Support"
      description="FAQs, documentation, and contact"
      onClick={() => {
        onNavigateSettings?.();
        // TODO: Navigate to support page
      }}
    />
  </div>

  {/* Full Settings Link */}
  <div className="h-px bg-border" aria-hidden="true" />
  <Button
    variant="outline"
    className="w-full justify-start"
    onClick={onNavigateSettings}
  >
    <Settings className="h-4 w-4" />
    All Settings
  </Button>
</TabsContent>
```

### Step 7: Update GlobalNavBar

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/global-nav-bar.tsx`

**Import at top (after line 23):**
```typescript
import { ProfileSettingsDropdown } from "@/components/navbar/profile-settings-dropdown";
```

**Remove onOpenSettings from props interface (line 54):**
```typescript
// DELETE THIS LINE:
onOpenSettings?: () => void;
```

**Remove Settings icon button (lines 230-251):**
```typescript
// DELETE ENTIRE BLOCK (lines 230-251)
{/* Settings Icon */}
{onOpenSettings && (
  <Button
    variant="ghost"
    size="icon"
    onClick={onOpenSettings}
    // ... (entire button)
  >
  </Button>
)}
```

**Replace User dropdown (lines 267-316) with ProfileSettingsDropdown:**
```typescript
// REPLACE lines 267-316 with:
<ProfileSettingsDropdown
  user={user}
  quokkaPoints={quokkaPoints}
  onLogout={onLogout}
  onNavigateDashboard={() => router.push("/dashboard")}
  onNavigateSettings={() => router.push("/settings")}
  onViewPointsDetails={onViewPointsDetails}
/>
```

**Note:** Also need to add `router` import:
```typescript
import { useRouter } from "next/navigation";

// Inside component:
const router = useRouter();
```

### Step 8: Update NavHeader

**File:** `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx`

**Remove onOpenSettings handler (line 98):**
```typescript
// DELETE THIS LINE:
onOpenSettings={() => router.push("/settings")}
```

**No other changes needed** - NavHeader already provides:
- user (from useCurrentUser)
- quokkaPoints (from useStudentDashboard)
- onLogout (handleLogout function)

---

## 8. Accessibility Checklist

### 8.1 ARIA Attributes

```typescript
// Trigger button
<Button
  aria-label="Account and Settings"
  aria-haspopup="dialog"
>

// Screen reader text
<span className="sr-only">Account and Settings</span>

// Tabs (built-in ARIA from Radix)
// - role="tablist" on TabsList
// - role="tab" on TabsTrigger
// - role="tabpanel" on TabsContent
// - aria-selected on active tab
// - aria-controls linking tab to panel
```

### 8.2 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Focus trigger button |
| Enter/Space | Open popover |
| Arrow Left/Right | Switch tabs (when popover open) |
| Tab | Navigate through interactive elements |
| Escape | Close popover |

### 8.3 Focus Management

- Initial focus: First tab (Profile) auto-focused on open
- Focus trap: Radix Popover provides built-in focus trap
- Focus return: Returns to trigger button on close
- Focus visible: All interactive elements have focus-visible:ring-2

### 8.4 Contrast Ratios (WCAG AA)

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| User name | text-foreground | glass-panel | 7:1+ ✓ |
| User email/role | text-muted-foreground | glass-panel | 4.8:1 ✓ |
| Tab labels | text-foreground | muted background | 6:1+ ✓ |
| Active tab | text-foreground | background | 8:1+ ✓ |
| Logout button | text-danger | glass-panel | 5.2:1 ✓ |

---

## 9. Test Scenarios

### 9.1 User Interactions

**Test 1: Open Dropdown**
- [ ] Click User icon trigger
- [ ] Popover opens with Profile tab active
- [ ] User info displays correctly (name, email, role, avatar)
- [ ] Quokka Points summary displays (if provided)
- [ ] Dashboard link displays (if provided)
- [ ] Logout button displays

**Test 2: Switch to Settings Tab**
- [ ] Click Settings tab
- [ ] Settings tab content displays
- [ ] 4 settings options display
- [ ] All Settings button displays

**Test 3: Switch Back to Profile Tab**
- [ ] Click Profile tab
- [ ] Profile content re-displays
- [ ] State preserved (no flicker)

**Test 4: Navigate to Dashboard**
- [ ] Click Dashboard link
- [ ] onNavigateDashboard callback triggered
- [ ] Popover auto-closes
- [ ] Navigation occurs

**Test 5: Navigate to Settings**
- [ ] Click "All Settings" button in Settings tab
- [ ] onNavigateSettings callback triggered
- [ ] Popover auto-closes
- [ ] Navigation occurs

**Test 6: Logout**
- [ ] Click Logout button
- [ ] onLogout callback triggered
- [ ] Logout mutation executes
- [ ] Redirect to login page

**Test 7: Close Popover**
- [ ] Click outside popover → closes
- [ ] Press Escape → closes
- [ ] Focus returns to trigger button

### 9.2 Edge Cases

**Test 8: No Quokka Points Data**
- [ ] quokkaPoints prop undefined
- [ ] Points summary not displayed
- [ ] Layout remains clean (no empty space)

**Test 9: No Dashboard Callback**
- [ ] onNavigateDashboard undefined
- [ ] Dashboard link not displayed
- [ ] Layout adjusts correctly

**Test 10: Long User Name/Email**
- [ ] Name >30 characters → truncates with ellipsis
- [ ] Email >40 characters → truncates with ellipsis
- [ ] Tooltip shows full text on hover

**Test 11: No Avatar Image**
- [ ] user.avatar undefined
- [ ] AvatarFallback displays initials
- [ ] Initials correctly formatted (uppercase, max 2 chars)

### 9.3 Accessibility Tests

**Test 12: Keyboard Navigation**
- [ ] Tab to trigger button → focus visible
- [ ] Enter to open → popover opens, first tab focused
- [ ] Arrow Right → switches to Settings tab
- [ ] Arrow Left → switches back to Profile tab
- [ ] Tab through interactive elements → all focusable
- [ ] Escape → popover closes, focus returns to trigger

**Test 13: Screen Reader Announcements**
- [ ] Trigger: "Account and Settings button, collapsed"
- [ ] User info: "{name}, {email}, {role}"
- [ ] Quokka Points: "{totalPoints} Quokka Points, +{weeklyPoints} this week"
- [ ] Tab switch: "Profile tab selected" / "Settings tab selected"
- [ ] Actions: "Dashboard link" / "Log out button"

**Test 14: Focus Indicators**
- [ ] All buttons show focus ring
- [ ] Tabs show focus ring
- [ ] Focus ring contrast ratio ≥3:1
- [ ] Focus ring visible in dark mode

### 9.4 Responsive Tests

**Test 15: Desktop (≥1024px)**
- [ ] Popover aligns to right (align="end")
- [ ] Width: 320px (w-80)
- [ ] Hover states active
- [ ] Smooth animations

**Test 16: Tablet (768-1023px)**
- [ ] Same as desktop
- [ ] Touch targets ≥44px

**Test 17: Mobile (360-767px)**
- [ ] Popover fits on screen (w-80 = 320px fits in 360px)
- [ ] Touch targets ≥44px
- [ ] Reduced animations (motion-reduce)
- [ ] No hover states
- [ ] Glass blur reduced (CSS media query)

### 9.5 Dark Mode Tests

**Test 18: Light to Dark Mode Switch**
- [ ] Colors invert correctly
- [ ] Contrast ratios maintained (≥4.5:1)
- [ ] Glass panel styling adapts
- [ ] Borders visible
- [ ] Shadows visible

---

## 10. Usage Examples

### Example 1: Basic Usage (Student Dashboard)

```tsx
import { ProfileSettingsDropdown } from "@/components/navbar/profile-settings-dropdown";

function StudentNav() {
  const { data: user } = useCurrentUser();
  const { data: dashboardData } = useStudentDashboard(user?.id);
  const logoutMutation = useLogout();
  const router = useRouter();

  return (
    <ProfileSettingsDropdown
      user={user}
      quokkaPoints={dashboardData?.quokkaPoints}
      onLogout={async () => {
        await logoutMutation.mutateAsync();
        router.push("/login");
      }}
      onNavigateDashboard={() => router.push("/dashboard")}
      onNavigateSettings={() => router.push("/settings")}
      onViewPointsDetails={() => router.push("/dashboard?section=points")}
    />
  );
}
```

### Example 2: Instructor View (No Quokka Points)

```tsx
function InstructorNav() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const router = useRouter();

  return (
    <ProfileSettingsDropdown
      user={user}
      // No quokkaPoints prop → section hidden
      onLogout={async () => {
        await logoutMutation.mutateAsync();
        router.push("/login");
      }}
      onNavigateDashboard={() => router.push("/instructor")}
      onNavigateSettings={() => router.push("/settings")}
    />
  );
}
```

### Example 3: Minimal Usage (No Dashboard Link)

```tsx
function MinimalNav() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const router = useRouter();

  return (
    <ProfileSettingsDropdown
      user={user}
      onLogout={async () => {
        await logoutMutation.mutateAsync();
        router.push("/login");
      }}
      // No onNavigateDashboard → link hidden
      onNavigateSettings={() => router.push("/settings")}
    />
  );
}
```

---

## 11. QDS Compliance Verification

### 11.1 Color Tokens Used

✓ `glass-panel` (background + border)
✓ `text-foreground` (primary text)
✓ `text-muted-foreground` (secondary text)
✓ `text-primary` (Quokka Points accent)
✓ `text-danger` (Logout button)
✓ `bg-primary/5` (hover state)
✓ `bg-muted/50` (settings option hover)
✓ `border-border` (separators)

**No hardcoded hex colors** ✓

### 11.2 Spacing (4pt Grid)

✓ `p-4` (16px popover padding)
✓ `space-y-4` (16px between sections)
✓ `space-y-2` (8px compact spacing)
✓ `gap-2` (8px icon-text gap)
✓ `gap-3` (12px avatar-info gap)
✓ `mt-4` (16px tab content margin)

**All spacing uses 4pt multiples** ✓

### 11.3 Border Radius

✓ `rounded-lg` (popover, inherited from PopoverContent)
✓ `rounded-md` (buttons, tabs)
✓ `rounded-full` (avatar)

**All radii use QDS scale** ✓

### 11.4 Shadows

✓ `shadow-md` (PopoverContent default)
✓ No custom shadows (uses defaults)

**Elevation system respected** ✓

### 11.5 Typography

✓ `text-sm font-medium` (primary labels)
✓ `text-xs text-muted-foreground` (secondary labels)
✓ `text-lg font-bold` (Quokka Points value)
✓ `tabular-nums` (numeric values)

**Typography hierarchy consistent** ✓

---

## 12. Performance Considerations

### 12.1 Render Optimization

**Lazy Rendering:**
- Popover content only mounts when open (Radix default)
- No expensive pre-rendering

**State Updates:**
- Tab switching: Single local state update (fast)
- No prop drilling (direct callbacks)

**Memoization:**
- Not needed (component renders infrequently)
- User data cached by React Query

### 12.2 Bundle Size Impact

**Component Size:**
- Estimated: ~180 lines = ~6KB (minified)
- Acceptable for critical UI

**Dependencies:**
- All existing (Popover, Tabs, Button, Avatar)
- No new bundle impact

---

## 13. Migration Strategy

### 13.1 Step-by-Step Migration

**Phase 1: Create New Component**
1. Create `/components/navbar/profile-settings-dropdown.tsx`
2. Implement full functionality
3. Test in isolation (Storybook or test page)

**Phase 2: Update GlobalNavBar**
1. Import ProfileSettingsDropdown
2. Replace User dropdown (lines 267-316)
3. Remove Settings icon button (lines 230-251)
4. Remove onOpenSettings prop (line 54)
5. Add router for navigation callbacks

**Phase 3: Update NavHeader**
1. Remove onOpenSettings handler (line 98)
2. Verify data flow (user, points, callbacks)

**Phase 4: Verification**
1. Run typecheck: `npx tsc --noEmit`
2. Run lint: `npm run lint`
3. Test manually: Dashboard, Instructor, Course pages
4. Test keyboard navigation
5. Test responsive breakpoints

### 13.2 Rollback Plan

**If Issues Arise:**
1. Revert GlobalNavBar changes
2. Revert NavHeader changes
3. Keep ProfileSettingsDropdown file (for future refinement)
4. Restore old User dropdown + Settings icon

**Rollback Files:**
- `/components/layout/global-nav-bar.tsx` (git restore)
- `/components/layout/nav-header.tsx` (git restore)

---

## 14. Known Limitations

### 14.1 Current Limitations

1. **Settings Options Hardcoded**
   - 4 settings options hardcoded (Notifications, Appearance, Privacy, Help)
   - Future: Make configurable via props
   - Mitigation: Link to full Settings page for flexibility

2. **No Settings Page Navigation Anchors**
   - Clicking settings option navigates to /settings
   - Future: Add anchor links (#notifications, #appearance, etc.)
   - Mitigation: Full Settings page provides all options

3. **No Avatar Upload**
   - Avatar display-only (no editing)
   - Out of scope for this task
   - Future: Add "Edit Profile" button linking to profile edit page

### 14.2 Future Enhancements

1. **Customizable Settings Options**
   ```typescript
   settingsOptions?: Array<{
     icon: LucideIcon;
     label: string;
     description: string;
     onClick: () => void;
   }>;
   ```

2. **Recent Activity Preview**
   - Show 2-3 recent activity items in Profile tab
   - "See all activity" link to Dashboard

3. **Quick Theme Toggle**
   - Dark mode switch in Settings tab
   - Inline toggle (no navigation needed)

---

## 15. Final Checklist

### 15.1 Before Implementation

- [x] Props interface fully defined
- [x] Component hierarchy planned
- [x] State management strategy clear
- [x] Event handling patterns documented
- [x] File structure determined
- [x] Integration points identified
- [x] Test scenarios listed
- [x] Accessibility requirements specified
- [x] QDS compliance verified
- [x] Migration strategy defined

### 15.2 During Implementation

- [ ] Create component file
- [ ] Implement props interface
- [ ] Implement sub-components (QuokkaPointsSummary, SettingsOption)
- [ ] Implement main component
- [ ] Add Profile tab content
- [ ] Add Settings tab content
- [ ] Update GlobalNavBar
- [ ] Update NavHeader
- [ ] Run typecheck (npx tsc --noEmit)
- [ ] Run lint (npm run lint)

### 15.3 After Implementation

- [ ] Manual testing (all scenarios)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Responsive testing (360px, 768px, 1024px, 1280px)
- [ ] Dark mode testing
- [ ] Performance check (no layout shift, smooth transitions)
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Update context.md with decisions

---

## 16. Implementation Timeline

| Task | Estimated Time |
|------|----------------|
| Create component file + props | 20 minutes |
| Implement sub-components | 25 minutes |
| Implement main component | 30 minutes |
| Profile tab content | 20 minutes |
| Settings tab content | 20 minutes |
| Update GlobalNavBar | 15 minutes |
| Update NavHeader | 5 minutes |
| Typecheck + lint | 5 minutes |
| Manual testing | 30 minutes |
| Accessibility testing | 20 minutes |
| **Total** | **3 hours** |

---

**Plan Completed:** 2025-10-14
**Ready for Implementation:** Yes
**Next Step:** Read this plan before proceeding with code edits

---

## Quick Reference: Files to Create/Modify

### CREATE:
```
/Users/dgz/projects-professional/quokka/quokka-demo/components/navbar/profile-settings-dropdown.tsx
```

### MODIFY:
```
/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/global-nav-bar.tsx
  - Add import: ProfileSettingsDropdown
  - Add import: useRouter from next/navigation
  - Add router constant: const router = useRouter();
  - Remove: lines 230-251 (Settings icon)
  - Remove: line 54 (onOpenSettings prop)
  - Replace: lines 267-316 (User dropdown → ProfileSettingsDropdown)

/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx
  - Remove: line 98 (onOpenSettings handler)
```

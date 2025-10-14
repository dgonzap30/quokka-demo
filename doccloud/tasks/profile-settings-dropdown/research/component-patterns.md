# ProfileSettingsDropdown - Component Pattern Research

**Date:** 2025-10-14
**Researcher:** Component Architect

---

## 1. Existing Pattern Audit

### 1.1 Similar Components in Codebase

#### QuokkaPointsBadge (`components/navbar/quokka-points-badge.tsx`)
**Pattern:** Popover with content panel
- Uses `Popover`, `PopoverTrigger`, `PopoverContent` from shadcn/ui
- Trigger: Button with ghost variant, size sm
- Content: Fixed width (w-80), glass-panel styling
- Align: end, sideOffset: 8
- Props interface: Fully typed, composable
- className composition supported

**Key Patterns to Reuse:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className={cn(...)} aria-label="...">
      <Icon className="..." />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 glass-panel p-4" align="end" sideOffset={8}>
    {/* Content */}
  </PopoverContent>
</Popover>
```

#### Current User Dropdown (`components/layout/global-nav-bar.tsx` lines 267-316)
**Pattern:** DropdownMenu with items
- Uses `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, etc.
- Trigger: Button with User icon (ghost variant, size icon)
- Content: w-56, DropdownMenuLabel for user info, DropdownMenuItem for actions
- User info displayed: name, email, role (in DropdownMenuLabel)
- Actions: Dashboard link, Logout button

**Current Structure:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Account menu">
      <User className="..." />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end" forceMount>
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/dashboard">Dashboard</Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Limitation:** No tab switching, no Settings section

### 1.2 shadcn/ui Primitives Available

#### Tabs Component (`components/ui/tabs.tsx`)
- Uses `@radix-ui/react-tabs`
- Components: Tabs, TabsList, TabsTrigger, TabsContent
- TabsList: Muted background with border, rounded-lg, p-1
- TabsTrigger: Active state styling (font-bold, shadow-md, border-2 border-primary/30)
- ARIA-compliant: proper role="tab", role="tablist", role="tabpanel"
- Keyboard navigation: built-in (Arrow keys, Tab, Enter)

#### Popover vs DropdownMenu Decision
**Popover Advantages:**
- More flexible content (not constrained to menu items)
- Can embed Tabs component seamlessly
- Better for complex layouts (profile + settings sections)
- glass-panel styling already established in QuokkaPointsBadge

**DropdownMenu Limitations:**
- Primarily for menu items
- Less flexible for custom layouts
- Would require hacky workarounds for tabs

**DECISION: Use Popover (like QuokkaPointsBadge pattern)**

### 1.3 Composition Opportunities

#### Avatar Component (`components/ui/avatar.tsx`)
- Available for user profile display
- AvatarImage, AvatarFallback pattern
- Default size: size-8
- Can be scaled: size-10, size-12, size-16

#### Button Component
- Link wrapping: `<Button asChild><Link href="...">...</Link></Button>`
- Icon buttons with text
- Variants: ghost, outline, default

#### Existing Navigation Patterns
- Dashboard link: Already in current dropdown
- Logout action: Already in current dropdown
- Settings navigation: Currently separate icon button (to be removed)

### 1.4 Patterns to Follow

1. **Props-Driven Architecture**
   - All data passed via props (user, points, onLogout, etc.)
   - No hardcoded values
   - Callback pattern for actions
   - className composition support

2. **QDS Glass Panel Styling**
   - Use `glass-panel` class for popover content
   - Width: w-80 (consistent with QuokkaPointsBadge)
   - Padding: p-4
   - align="end" sideOffset={8}

3. **Accessibility**
   - aria-label on trigger button
   - Semantic HTML (nav role for tab container)
   - Focus management (auto-focus first tab)
   - Keyboard navigation (built into Tabs component)

4. **Icon Button Pattern**
   - min-h-[44px] min-w-[44px] for touch targets
   - Transition effects (hover:scale-[1.08], motion-reduce:hover:scale-100)
   - focus-visible:ring-4 focus-visible:ring-accent/60
   - group pattern for nested icon animations

### 1.5 Patterns to Avoid

1. **Nested DropdownMenu inside Popover** - Complex, buggy
2. **Hardcoded user data** - Must come from props
3. **Inline styles** - Use QDS tokens and Tailwind utilities
4. **Direct router.push** - Use callbacks (onNavigate, onLogout, etc.)

---

## 2. Requirements Analysis

### 2.1 Data Requirements (Props)

#### User Data
```typescript
user: {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
```

#### Optional Quokka Points Summary
```typescript
quokkaPoints?: {
  totalPoints: number;
  weeklyPoints: number;
}
```

#### Callback Props
```typescript
onLogout: () => void;
onNavigateDashboard?: () => void;
onNavigateSettings?: () => void;
```

#### Optional Styling
```typescript
className?: string;
```

### 2.2 State Requirements

#### Local State
- `activeTab: "profile" | "settings"` - Tab switching state (useState)
- No other local state needed

#### Props State
- All data comes from parent (GlobalNavBar)
- User data from useCurrentUser hook
- Points data from useStudentDashboard hook
- Navigation handlers from NavHeader

### 2.3 Event Handling Needs

#### Tab Switching
- onClick handler for TabsTrigger
- Controlled by local useState
- No URL state needed (ephemeral UI state)

#### Navigation Actions
- onNavigateDashboard: Navigate to /dashboard
- onNavigateSettings: Navigate to /settings (full page)
- onLogout: Logout mutation + redirect

#### Popover Control
- Automatic close on navigation (Popover default behavior)
- Manual close: User clicks outside or presses Escape

### 2.4 Variant Requirements

#### Visual Variants
- No size variants needed (fixed w-80 width)
- No color variants (uses QDS tokens)
- Dark mode support (via QDS tokens)

#### Behavioral Variants
- Optional Quokka Points display (if quokkaPoints prop provided)
- Optional Dashboard link (if onNavigateDashboard provided)

### 2.5 Accessibility Requirements

#### ARIA Attributes
- `aria-label="Account and Settings"` on trigger button
- `aria-haspopup="dialog"` on trigger (Popover is dialog-like)
- Tabs component provides: role="tablist", role="tab", role="tabpanel"
- aria-selected, aria-controls (built into Radix Tabs)

#### Keyboard Navigation
- Tab: Focus trigger button
- Enter/Space: Open popover
- Arrow Left/Right: Switch tabs (built into Tabs)
- Tab: Navigate between interactive elements
- Escape: Close popover

#### Focus Management
- Focus trap inside popover (Radix default)
- First tab auto-focused on open
- Focus returns to trigger on close

#### Screen Reader Support
- User info announced: "{name}, {email}, {role}"
- Tab labels announced: "Profile tab", "Settings tab"
- Quokka Points announced: "{totalPoints} Quokka Points"

### 2.6 Responsive Behavior

#### Desktop (≥768px)
- Full width popover (w-80)
- Both tabs visible
- Hover states active

#### Mobile (<768px)
- Same width (w-80 fits on 360px screens)
- Touch targets: min-h-[44px] min-w-[44px]
- Reduced animations (motion-reduce)
- No hover states

---

## 3. Performance Considerations

### 3.1 Render Frequency Expectations
- Renders only when popover opens (lazy content)
- Tab switching: Local state update (fast)
- User data: Static after mount (from React Query cache)
- Points data: Updates periodically (React Query refetch)

### 3.2 Expensive Operations
- None identified
- Avatar image loading: Handled by Avatar component
- No complex calculations

### 3.3 Memoization Opportunities
- Not needed (simple component, infrequent renders)
- React Query handles user/points data caching
- Popover content only mounts when open

### 3.4 Code Splitting Potential
- Not needed (small component, used in every route)
- Part of GlobalNavBar (critical UI)

---

## 4. Integration with Existing System

### 4.1 GlobalNavBar Integration

**Current State (lines 267-316):**
- User dropdown: DropdownMenu with User icon trigger
- Settings icon: Separate button (lines 230-251)

**New State:**
- Replace User dropdown with ProfileSettingsDropdown
- Remove standalone Settings icon button
- Remove onOpenSettings prop from GlobalNavBar

### 4.2 NavHeader Integration

**Current Handler (line 98):**
```tsx
onOpenSettings={() => router.push("/settings")}
```

**New Handler:**
- Pass to ProfileSettingsDropdown as prop
- ProfileSettingsDropdown handles navigation internally

### 4.3 Data Flow

```
NavHeader (data fetching)
  ├─ useCurrentUser() → user
  ├─ useStudentDashboard() → quokkaPoints
  └─ handleLogout() → onLogout callback
      ↓
GlobalNavBar (props passing)
  └─ ProfileSettingsDropdown
      ├─ user (User)
      ├─ quokkaPoints (optional)
      ├─ onLogout (callback)
      ├─ onNavigateDashboard (callback)
      └─ onNavigateSettings (callback)
```

---

## 5. QDS Compliance Analysis

### 5.1 Color Tokens to Use
- Background: `glass-panel` (includes bg-glass-medium, border-glass)
- Text: `text-foreground`, `text-muted-foreground`
- Primary actions: `text-primary`, `hover:text-primary-hover`
- Borders: `border-border`, `border-glass`

### 5.2 Spacing Scale (4pt Grid)
- Popover padding: `p-4` (16px)
- Section spacing: `space-y-4` (16px between sections)
- Compact spacing: `space-y-2` (8px for user info lines)
- Button spacing: `gap-2` (8px icon-text gap)

### 5.3 Radius Scale
- Popover: `rounded-md` (10px, inherited from PopoverContent)
- Avatar: `rounded-full` (Avatar default)
- Buttons: `rounded-md` (Button default)

### 5.4 Shadows (Elevation)
- Popover: `shadow-md` (PopoverContent default)
- Buttons: No custom shadows (use defaults)

### 5.5 Typography
- User name: `text-sm font-medium`
- User email/role: `text-xs text-muted-foreground`
- Section headers: `text-xs font-medium text-muted-foreground`
- Button labels: `text-sm`

---

## 6. Risk Assessment

### 6.1 Technical Risks

**Risk:** Popover width too narrow for content
- **Likelihood:** Low
- **Impact:** Medium (content overflow)
- **Mitigation:** Use w-80 (320px), matches QuokkaPointsBadge, tested pattern

**Risk:** Tab switching complexity
- **Likelihood:** Low
- **Impact:** Low (built-in Radix Tabs)
- **Mitigation:** Use Radix Tabs component, proven accessible pattern

**Risk:** Settings options unclear
- **Likelihood:** Medium
- **Impact:** Low (can defer to full page)
- **Mitigation:** Keep minimal (3-5 options), link to full Settings page

### 6.2 UX Risks

**Risk:** Users expect dropdown menu, not popover
- **Likelihood:** Low
- **Impact:** Low (visually similar)
- **Mitigation:** Similar trigger button, same position

**Risk:** Tab switching confusing
- **Likelihood:** Low
- **Impact:** Low (clear labels)
- **Mitigation:** Use standard tab UI, Profile as default tab

---

## 7. Alternative Approaches Considered

### 7.1 Approach A: DropdownMenu with Custom Content
**Pros:**
- Consistent with current pattern
- No need to switch primitive

**Cons:**
- DropdownMenu not designed for complex layouts
- Tabs inside DropdownMenu is hacky
- Less flexible styling

**REJECTED:** Too limiting for tabbed content

### 7.2 Approach B: Sheet/Drawer for Mobile, Popover for Desktop
**Pros:**
- Native mobile feel
- More space on mobile

**Cons:**
- Increased complexity
- Two separate components to maintain
- Inconsistent UX across breakpoints

**REJECTED:** Overkill for simple profile/settings UI

### 7.3 Approach C: Popover with Tabs (SELECTED)
**Pros:**
- Flexible content layout
- Tabs built-in and accessible
- Consistent with QuokkaPointsBadge pattern
- Single component for all breakpoints

**Cons:**
- Popover width constraint (mitigated with w-80)

**SELECTED:** Best balance of flexibility and simplicity

---

## 8. Implementation Complexity Estimate

### 8.1 Component Size
- Estimated LOC: ~180 lines
- Under 200 LOC limit ✓

### 8.2 Dependencies
- Existing: Popover, Tabs, Button, Avatar (all available)
- New: None

### 8.3 Time Estimate
- Props interface: 15 minutes
- Component structure: 30 minutes
- Profile tab content: 20 minutes
- Settings tab content: 20 minutes
- Styling (QDS compliance): 20 minutes
- Accessibility audit: 15 minutes
- **Total:** ~2 hours

---

## 9. Success Metrics

### 9.1 Functional Requirements
- [ ] Popover opens on trigger click
- [ ] Profile tab shows user info (name, email, role, avatar)
- [ ] Profile tab shows Quokka Points summary (if provided)
- [ ] Profile tab has Dashboard link (if provided)
- [ ] Profile tab has Logout button
- [ ] Settings tab shows 3-5 common settings options
- [ ] Settings tab has link to full Settings page
- [ ] Tab switching works (click and keyboard)
- [ ] Popover closes on navigation
- [ ] Popover closes on Escape/outside click

### 9.2 Accessibility Requirements
- [ ] WCAG 2.2 AA compliant
- [ ] Keyboard navigable (Tab, Arrow keys, Enter, Escape)
- [ ] Screen reader friendly (ARIA labels, roles)
- [ ] Focus visible on all interactive elements
- [ ] Contrast ratio ≥4.5:1 for all text

### 9.3 Performance Requirements
- [ ] No layout shift on open
- [ ] Smooth tab transitions (<100ms)
- [ ] No unnecessary re-renders

---

## 10. Next Steps

1. Create detailed implementation plan (`plans/component-design.md`)
2. Define exact TypeScript interfaces
3. Plan file structure and imports
4. Document step-by-step implementation
5. List test scenarios
6. Update context.md with decisions

---

**Research Completed:** 2025-10-14
**Ready for Implementation Planning:** Yes

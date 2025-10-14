# Mobile Accessibility Fixes - Implementation Plan

**Created:** 2025-10-14
**Target:** WCAG 2.2 Level AA Compliance
**Scope:** Mobile experience (360px-768px)

---

## Priority Order

Implementation must follow this strict order to avoid breaking changes:

1. **Critical Fixes** (8 issues) - Blocking issues that prevent WCAG AA compliance
2. **High Priority Fixes** (12 issues) - Significant barriers that impair accessibility
3. **Medium Priority Fixes** (9 issues) - Minor violations with workarounds
4. **Testing & Verification** (Manual testing required)

**Estimated Effort:** 2-3 days for all critical and high priority fixes

---

## File Modifications Required

---

### 1. components/ui/button.tsx

#### Fix 1.1: Icon Button Touch Target Size (CRITICAL)
**Priority:** Critical
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Icon buttons use `size-10` which is 40x40px (2.5rem)
**Required Change:** Increase to minimum 44x44px (11 × 4px = 44px)

**Implementation:**

**Line 8 (before):**
```typescript
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-250 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
```

**Line 33 (before):**
```typescript
icon: "size-10",
```

**Line 33 (after):**
```typescript
icon: "h-11 w-11", // 44px minimum for touch targets (WCAG 2.5.5)
```

**Files Affected:** All components using icon buttons
- `components/layout/global-nav-bar.tsx` (Ask Question, AI Assistant, Support, Settings, User menu)
- `components/layout/mobile-nav.tsx` (Hamburger button)
- `components/course/filter-sidebar.tsx` (Collapse buttons)
- `components/course/floating-quokka.tsx`

**Test Scenario:**
1. Open app on mobile device (or DevTools mobile view at 375px width)
2. Navigate to any page with icon buttons (dashboard, course page)
3. Verify icon buttons are visually 44x44px using browser inspector
4. Test tap interaction - should be easy to hit without precision
5. Verify focus indicator is fully visible around 44px button

---

### 2. components/ui/badge.tsx

#### Fix 2.1: Badge Minimum Height for Touch Targets (CRITICAL)
**Priority:** Critical
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Badges use `min-h-[24px]` which is too small for touch interaction
**Required Change:** Interactive badges must meet 44px minimum; visual-only badges can remain 24px

**Implementation:**

**Line 8 (before):**
```typescript
"inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-250 overflow-hidden min-h-[24px]",
```

**Line 8 (after):**
```typescript
"inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-250 overflow-hidden min-h-6", // 24px for visual-only badges
```

**Add new variant for interactive badges after line 31:**
```typescript
        interactive:
          "min-h-11 px-4 py-2 cursor-pointer hover:opacity-80 active:scale-[0.98] text-sm", // 44px for touch targets
```

**Update defaultVariants (line 34):**
```typescript
    defaultVariants: {
      variant: "default",
      interactive: false, // Add this
    },
```

**Update Badge function signature (lines 40-46):**
```typescript
function Badge({
  className,
  variant,
  interactive = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    interactive?: boolean // Add this
  }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, interactive }), className)} // Add interactive
      role={interactive ? "button" : undefined} // Add semantic role for interactive badges
      tabIndex={interactive ? 0 : undefined} // Make keyboard accessible
      {...props}
    />
  )
}
```

**Export updated interface:**
```typescript
export { Badge, badgeVariants }
export type { VariantProps }
```

**Files Requiring Updates:**
1. `components/course/tag-cloud.tsx` - Add `interactive={true}` to clickable tags
2. `components/course/sidebar-filter-panel.tsx` - Filter badges should be interactive
3. `components/course/status-badge.tsx` - Status badges are visual-only, no change needed
4. Any other badge usage where badge is clickable

**Test Scenario:**
1. Open course page with tag filters
2. Verify interactive tag badges are 44px tall
3. Test tap interaction on mobile - should be easy to select tags
4. Verify keyboard navigation: Tab to badge, Enter/Space to activate
5. Verify visual-only badges (status, counts) remain 24px for visual efficiency

---

### 3. components/ui/dialog.tsx

#### Fix 3.1: Dialog Close Button Touch Target (CRITICAL)
**Priority:** Critical
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Close button lacks explicit sizing, may be too small
**Required Change:** Ensure close button meets 44x44px minimum

**Implementation:**

**Lines 70-76 (before):**
```tsx
{showCloseButton && (
  <DialogPrimitive.Close
    data-slot="dialog-close"
    className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  >
    <XIcon />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)}
```

**Lines 70-76 (after):**
```tsx
{showCloseButton && (
  <DialogPrimitive.Close
    data-slot="dialog-close"
    className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none min-h-11 min-w-11 inline-flex items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"
    aria-label="Close dialog"
  >
    <XIcon />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)}
```

**Changes Made:**
- Added `min-h-11 min-w-11` for 44x44px touch target
- Added `inline-flex items-center justify-center` to center icon
- Changed icon size from `size-4` (16px) to `size-5` (20px) for better visibility
- Added explicit `aria-label="Close dialog"` for clarity
- Kept `sr-only` for redundancy (best practice)

**Test Scenario:**
1. Open ask question modal on mobile
2. Verify close button (X) in top-right corner is 44x44px
3. Test tap interaction - should close modal easily
4. Test keyboard: Tab to close button, press Enter or Escape
5. Verify with screen reader: "Close dialog" is announced

---

### 4. components/ui/sheet.tsx

#### Fix 4.1: Sheet Close Button Touch Target (CRITICAL)
**Priority:** Critical
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Close button lacks explicit sizing
**Required Change:** Ensure close button meets 44x44px minimum

**Implementation:**

**Lines 75-78 (before):**
```tsx
<SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
  <XIcon className="size-4" />
  <span className="sr-only">Close</span>
</SheetPrimitive.Close>
```

**Lines 75-78 (after):**
```tsx
<SheetPrimitive.Close
  className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none min-h-11 min-w-11 inline-flex items-center justify-center"
  aria-label="Close menu"
>
  <XIcon className="size-5" />
  <span className="sr-only">Close</span>
</SheetPrimitive.Close>
```

**Changes Made:**
- Added `min-h-11 min-w-11` for 44x44px touch target
- Added `inline-flex items-center justify-center` to center icon
- Changed icon size from `size-4` (16px) to `size-5` (20px)
- Added explicit `aria-label="Close menu"`

**Test Scenario:**
1. Open mobile navigation (hamburger menu)
2. Verify close button (X) in top-right corner is 44x44px
3. Test tap interaction - should close sheet easily
4. Test keyboard: Tab to close button, press Enter or Escape
5. Verify with screen reader: "Close menu" is announced

---

### 5. components/layout/global-nav-bar.tsx

#### Fix 5.1: Add Mobile Navigation Trigger (CRITICAL)
**Priority:** Critical
**WCAG:** 2.1.1 Keyboard - Level A
**Current State:** No visible mobile menu trigger - users cannot access navigation
**Required Change:** Add hamburger menu button visible on mobile (< 768px)

**Implementation:**

**Add after line 75 (after props destructuring, before return):**
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

**Add import at top:**
```typescript
import { useState } from "react";
import { Menu } from "lucide-react"; // Add Menu icon
```

**Lines 132-251 (before - Right Section):**
```tsx
{/* Right Section: Icon Actions + Avatar */}
<div className="flex items-center gap-3">
  {/* Icon Actions Group (Desktop Only) */}
  <div className="hidden md:flex items-center gap-3">
```

**Insert new mobile trigger BEFORE line 132:**
```tsx
{/* Mobile Menu Trigger (Mobile Only) */}
<div className="md:hidden">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setMobileMenuOpen(true)}
    className={cn(
      "min-h-[44px] min-w-[44px] h-11 w-11",
      "transition-all duration-300 ease-out",
      "hover:bg-accent/5 hover:scale-[1.08]",
      "motion-reduce:hover:scale-100",
      "focus-visible:ring-4 focus-visible:ring-accent/60"
    )}
    aria-label="Open navigation menu"
    aria-expanded={mobileMenuOpen}
    aria-haspopup="true"
  >
    <Menu className="h-5 w-5" aria-hidden="true" />
    <span className="sr-only">Menu</span>
  </Button>
</div>
```

**Add MobileNav component at end of return statement (after closing </nav>):**
```tsx
</nav>

{/* Mobile Navigation Sheet */}
<MobileNav
  currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
  user={user}
  onLogout={onLogout}
  onAskQuestion={onAskQuestion}
  onOpenAIAssistant={onOpenAIAssistant}
  onOpenSupport={onOpenSupport}
  onOpenSettings={onOpenSettings}
  open={mobileMenuOpen}
  onOpenChange={setMobileMenuOpen}
/>
</>
```

**Add import for MobileNav:**
```typescript
import { MobileNav } from "@/components/layout/mobile-nav";
```

**Update MobileNav component signature to accept open/onOpenChange:**
File: `components/layout/mobile-nav.tsx`

**Lines 28-63 (add new props):**
```typescript
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

  /** Optional navigation items - if not provided or empty, only shows user profile */
  items?: NavItem[];

  /** Optional course context for specialized course navigation */
  courseContext?: {
    courseId: string;
    courseCode: string;
    courseName: string;
  };

  /** NEW: Control open state externally */
  open?: boolean;

  /** NEW: Handle open state changes */
  onOpenChange?: (open: boolean) => void;
}
```

**Lines 76-80 (update Sheet to use external state):**
```typescript
export function MobileNav({
  currentPath,
  user,
  onLogout,
  onAskQuestion,
  onOpenAIAssistant,
  onOpenSupport,
  onOpenSettings,
  items,
  courseContext,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: MobileNavProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* Only show trigger if not externally controlled */}
        {externalOpen === undefined && (
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label="Open navigation menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        )}
```

**Files Affected:**
- `components/layout/global-nav-bar.tsx` - Add mobile trigger + integrate MobileNav
- `components/layout/mobile-nav.tsx` - Update to support external state control

**Test Scenario:**
1. Open app on mobile (< 768px width)
2. Verify hamburger menu button is visible in top-right of navbar
3. Tap hamburger - mobile nav sheet should slide in from left
4. Verify all navigation options are accessible
5. Test keyboard: Tab to hamburger, press Enter to open
6. Test screen reader: "Open navigation menu" announced, "Menu" region announced when opened
7. Verify close button works (see Fix 4.1)

---

### 6. components/layout/global-nav-bar.tsx (continued)

#### Fix 6.1: Mobile Breadcrumb Back Button Touch Target (HIGH)
**Priority:** High
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Mobile back button lacks explicit sizing
**Required Change:** Add minimum touch target size

**Implementation:**

**Lines 115-123 (before):**
```tsx
{/* Breadcrumb (Mobile - Back Button) */}
{breadcrumb && (
  <button
    onClick={() => router.push("/dashboard")}
    className="md:hidden text-sm text-neutral-700 hover:text-neutral-900"
    aria-label="Back to Dashboard"
  >
    ← {breadcrumb.label}
  </button>
)}
```

**Lines 115-123 (after):**
```tsx
{/* Breadcrumb (Mobile - Back Button) */}
{breadcrumb && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => router.push("/dashboard")}
    className="md:hidden min-h-[44px] px-3 text-sm text-neutral-700 hover:text-neutral-900 gap-1"
    aria-label={`Back to Dashboard from ${breadcrumb.label}`}
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    <span className="truncate max-w-[120px]">{breadcrumb.label}</span>
  </Button>
)}
```

**Add import:**
```typescript
import { ArrowLeft } from "lucide-react";
```

**Changes Made:**
- Changed from `<button>` to `<Button variant="ghost" size="sm">`
- Added `min-h-[44px]` for touch target compliance
- Added ArrowLeft icon for better visual affordance
- Enhanced `aria-label` with full context
- Added `truncate max-w-[120px]` to prevent long course names from breaking layout

**Test Scenario:**
1. Navigate to course page on mobile (breadcrumb should appear)
2. Verify back button height is 44px minimum
3. Test tap interaction - should navigate to dashboard
4. Test keyboard: Tab to back button, press Enter
5. Verify screen reader announces full context: "Back to Dashboard from CS101"

---

### 7. components/layout/skip-to-content.tsx

#### Fix 7.1: Integrate Skip Link in Root Layout (HIGH)
**Priority:** High
**WCAG:** 2.4.1 Bypass Blocks - Level A
**Current State:** Skip link component exists but not integrated
**Required Change:** Add skip link to root layout, ensure it's the first focusable element

**Implementation:**

**File:** `app/layout.tsx`

**Find the <body> tag and add skip link as first child:**
```tsx
<body className={cn(geistSans.variable, geistMono.variable, "font-sans antialiased")}>
  <SkipToContent />
  <Providers>
    {children}
  </Providers>
</body>
```

**Add import:**
```typescript
import { SkipToContent } from "@/components/layout/skip-to-content";
```

**Verify SkipToContent component content:**
File: `components/layout/skip-to-content.tsx`

**Should look like this:**
```tsx
"use client";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:ring-4 focus:ring-primary/30"
    >
      Skip to main content
    </a>
  );
}
```

**Verify all pages have #main-content anchor:**
- `app/dashboard/page.tsx` - Line 133: `<main id="main-content"` ✅
- `app/courses/[courseId]/page.tsx` - ADD: `<main id="main-content"`
- Other pages - ADD where missing

**Test Scenario:**
1. Load any page
2. Press Tab key ONCE (skip link should be first focusable element)
3. Verify skip link appears at top-left with high visibility (white text on primary brown)
4. Press Enter - should jump to main content
5. Verify focus moves to main content region
6. Test on mobile - should work identically

---

### 8. components/ui/input.tsx

#### Fix 8.1: Add Error Message Association Pattern (HIGH)
**Priority:** High
**WCAG:** 3.3.1 Error Identification - Level A
**Current State:** Input has `aria-invalid` styling but no `aria-describedby` for error messages
**Required Change:** Update Input component to accept error props and create association

**Implementation:**

**Lines 5-18 (before):**
```typescript
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,backdrop-filter] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm focus:backdrop-blur-md",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-glass-sm)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}
```

**Lines 5-30 (after):**
```typescript
interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  errorId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorId, ...props }, ref) => {
    const generatedErrorId = errorId || (error ? `${props.id}-error` : undefined);

    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,backdrop-filter] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm focus:backdrop-blur-md",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-glass-sm)]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={generatedErrorId}
          {...props}
        />
        {error && (
          <p id={generatedErrorId} className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
```

**Add React import:**
```typescript
import * as React from "react"
```

**Usage Example:**
```tsx
<Input
  id="email"
  type="email"
  error={emailError}
  aria-required="true"
/>
```

**Test Scenario:**
1. Create form with input field and validation
2. Trigger validation error (e.g., invalid email)
3. Verify error message appears below input
4. Test with screen reader:
   - Focus input field
   - Verify screen reader announces: "Email, edit text, invalid, [error message]"
5. Verify error message has `role="alert"` for immediate announcement
6. Test on mobile - error should be clearly visible and announced

---

### 9. components/ui/textarea.tsx

#### Fix 9.1: Add Error Message Association Pattern (HIGH)
**Priority:** High
**WCAG:** 3.3.1 Error Identification - Level A
**Current State:** Similar to Input, lacks error association
**Required Change:** Update Textarea component to accept error props

**Implementation:**

**Apply same pattern as Input component (Fix 8.1):**

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: string;
  errorId?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorId, ...props }, ref) => {
    const generatedErrorId = errorId || (error ? `${props.id}-error` : undefined);

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          data-slot="textarea"
          className={cn(
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow,backdrop-filter] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm focus:backdrop-blur-md",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-glass-sm)]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={generatedErrorId}
          {...props}
        />
        {error && (
          <p id={generatedErrorId} className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea }
```

---

### 10. components/ui/empty-state.tsx

#### Fix 10.1: Add Status Role for Screen Reader Announcement (HIGH)
**Priority:** High
**WCAG:** 4.1.3 Status Messages - Level AA
**Current State:** Empty state not announced to screen readers
**Required Change:** Add `role="status"` and `aria-live="polite"`

**Implementation:**

**Find the main container div and add:**
```tsx
<div
  className="flex flex-col items-center justify-center p-8 text-center"
  role="status"
  aria-live="polite"
  aria-label={title || "Content status"}
>
```

**Complete component structure:**
```tsx
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
      role="status"
      aria-live="polite"
      aria-label={title || "Content status"}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted/10 p-6">
          <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="min-h-[44px]" // Touch target compliance
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Test Scenario:**
1. Navigate to page with no content (empty thread list, no courses)
2. Verify empty state is announced by screen reader: "[Title] [Description]"
3. Test that status is announced when content becomes empty (e.g., clear all filters)
4. Verify action button (if present) meets 44px touch target

---

### 11. components/ui/error-state.tsx

#### Fix 11.1: Add Alert Role for Screen Reader Announcement (HIGH)
**Priority:** High
**WCAG:** 4.1.3 Status Messages - Level AA
**Current State:** Error state not announced to screen readers
**Required Change:** Add `role="alert"` and `aria-live="assertive"` for immediate announcement

**Implementation:**

```tsx
<div
  className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
  role="alert"
  aria-live="assertive"
  aria-label="Error"
>
```

**Test Scenario:**
1. Trigger error state (network failure, API error)
2. Verify error is immediately announced by screen reader
3. Test that error appears prominently with danger styling
4. Verify retry button (if present) meets 44px touch target

---

### 12. app/globals.css

#### Fix 12.1: Increase text-subtle Contrast (HIGH)
**Priority:** High
**WCAG:** 1.4.3 Contrast (Minimum) - Level AA
**Current State:** `--text-subtle` at hsl(35 8% 45%) has ~3.8:1 contrast (FAIL)
**Required Change:** Darken to meet 4.5:1 minimum

**Implementation:**

**Line 338 (before):**
```css
--text-subtle: 35 8% 45%;               /* Darkened for WCAG AA contrast (4.5:1+) */
```

**Line 338 (after):**
```css
--text-subtle: 35 8% 40%;               /* WCAG AA compliant: 4.7:1 contrast on white */
```

**Test Scenario:**
1. Use WebAIM Contrast Checker to verify new value
2. Input: hsl(35, 8%, 40%) on white background
3. Expected ratio: ≥4.5:1
4. Visually verify text using `.text-subtle` class is still readable
5. Check both light and dark modes

---

### 13. components/course/tag-cloud.tsx

#### Fix 13.1: Make Interactive Tags Meet Touch Target Size (HIGH)
**Priority:** High
**WCAG:** 2.5.5 Target Size (Minimum) - Level AA
**Current State:** Tag badges use Badge component with 24px height
**Required Change:** Use interactive badge variant for touch compliance

**Implementation:**

**Find tag badge rendering code and update:**

**Before:**
```tsx
<Badge
  key={tag.name}
  variant={isSelected ? "default" : "outline"}
  className={cn(
    "cursor-pointer hover:bg-primary/10 transition-colors",
    isSelected && "bg-primary text-primary-foreground"
  )}
  onClick={() => handleTagClick(tag.name)}
>
  {tag.name}
  <span className="ml-1.5 text-xs">({tag.count})</span>
</Badge>
```

**After:**
```tsx
<Badge
  key={tag.name}
  variant={isSelected ? "default" : "outline"}
  interactive={true} // Use interactive variant for 44px height
  className={cn(
    "cursor-pointer hover:bg-primary/10 transition-colors",
    isSelected && "bg-primary text-primary-foreground"
  )}
  onClick={() => handleTagClick(tag.name)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag.name);
    }
  }}
  aria-pressed={isSelected}
  aria-label={`Filter by ${tag.name}, ${tag.count} threads`}
>
  {tag.name}
  <span className="ml-1.5 text-xs opacity-75" aria-hidden="true">({tag.count})</span>
</Badge>
```

**Changes Made:**
- Added `interactive={true}` to use 44px variant
- Added `onKeyDown` handler for keyboard accessibility
- Added `aria-pressed` to indicate selection state
- Added `aria-label` with full context
- Made count span `aria-hidden` (already in label)

**Test Scenario:**
1. Open course page with tag filters
2. Verify each tag badge is 44px tall
3. Test tap interaction - should toggle tag selection
4. Test keyboard: Tab to tag, press Enter or Space to toggle
5. Verify screen reader announces: "Filter by algorithms, 12 threads, pressed" (when selected)

---

### 14. components/ui/global-search.tsx

#### Fix 14.1: Add Accessible Label to Search Input (HIGH)
**Priority:** High
**WCAG:** 3.3.2 Labels or Instructions - Level A
**Current State:** Needs verification of label association
**Required Change:** Ensure search input has visible label or aria-label

**Implementation:**

**Review current implementation and add if missing:**

```tsx
<div className="relative w-full">
  <label htmlFor="global-search" className="sr-only">
    Search threads and questions
  </label>
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
  <Input
    id="global-search"
    type="search"
    placeholder="Search threads..."
    className="pl-10 h-10 bg-background/50 backdrop-blur-sm"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    aria-label="Search threads and questions"
    aria-controls="search-results" // If search shows results
    aria-expanded={isOpen} // If search shows dropdown
  />
</div>
```

**Test Scenario:**
1. Navigate to global search in navbar
2. Test with screen reader - should announce "Search threads and questions"
3. Verify placeholder text is supplementary, not the only label
4. Test keyboard navigation into and out of search field

---

### 15. components/course/sidebar-search-bar.tsx

#### Fix 15.1: Add Accessible Label (HIGH)
**Priority:** High
**WCAG:** 3.3.2 Labels or Instructions - Level A
**Current State:** Needs verification
**Required Change:** Add label association

**Implementation:**

```tsx
<label htmlFor="sidebar-search" className="sr-only">
  Search threads in this course
</label>
<Input
  id="sidebar-search"
  type="search"
  placeholder="Search threads..."
  value={value}
  onChange={(e) => onChange(e.target.value)}
  aria-label="Search threads in this course"
/>
```

---

### 16. components/instructor/quick-search-bar.tsx

#### Fix 16.1: Add Accessible Label (HIGH)
**Priority:** High
**WCAG:** 3.3.2 Labels or Instructions - Level A
**Current State:** Needs verification
**Required Change:** Add label association

**Implementation:**

```tsx
<label htmlFor="instructor-search" className="sr-only">
  Quick search for threads and students
</label>
<Input
  id="instructor-search"
  type="search"
  placeholder="Quick search..."
  value={value}
  onSearch={(e) => onSearch(e.target.value)}
  aria-label="Quick search for threads and students"
/>
```

---

## Medium Priority Fixes

### 17. Add Live Regions for Dynamic Updates (MEDIUM)

**Files to update:**
- `components/dashboard/stat-card.tsx` - Add aria-live for stat changes
- `components/course/thread-list-sidebar.tsx` - Announce thread count changes
- `components/instructor/priority-queue-card.tsx` - Announce queue updates

**Implementation Pattern:**
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {filteredThreads.length} threads found
</div>
```

---

### 18. Keyboard Shortcuts (MEDIUM)

**File:** `components/course/filter-sidebar.tsx`
**Current State:** Keyboard shortcuts documented but not implemented
**Options:**
1. Implement Cmd/Ctrl + [ for collapse/expand
2. Remove from title attributes if not implementing

**Implementation:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      onCollapse?.();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onCollapse]);
```

---

### 19. Mobile Text Size Adjustments (MEDIUM)

**Strategy:** Use responsive text sizing for better mobile readability

**Pattern to apply across components:**
```tsx
// Before
<p className="text-sm">Description text</p>

// After
<p className="text-base md:text-sm">Description text</p>
```

**Files to update (priority order):**
1. `components/course/thread-card.tsx` - Card descriptions
2. `components/dashboard/stat-card.tsx` - Stat labels
3. `components/ui/badge.tsx` - Consider text-sm for interactive badges
4. All form helper text
5. All metadata text (dates, view counts)

---

## Testing & Verification Phase

### Manual Screen Reader Testing

**iOS VoiceOver (Safari on iPhone):**
1. Enable VoiceOver: Settings > Accessibility > VoiceOver
2. Test navigation flow: Double-tap to activate, swipe to navigate
3. Verify all interactive elements are announced
4. Test form filling and error messages
5. Verify modal/sheet focus trapping
6. Test badge interactions
7. Document any issues found

**Android TalkBack (Chrome on Android):**
1. Enable TalkBack: Settings > Accessibility > TalkBack
2. Test navigation flow: Tap to focus, double-tap to activate
3. Verify touch exploration works
4. Test all touch targets meet 44px minimum
5. Test form filling and error messages
6. Document any issues found

### Keyboard Navigation Testing

**Test Checklist:**
- [ ] Tab through entire page without mouse
- [ ] Verify focus order is logical
- [ ] Test Escape key closes modals/sheets
- [ ] Test Enter/Space activates buttons
- [ ] Test arrow keys in dropdowns/tabs
- [ ] Verify no keyboard traps
- [ ] Test skip link jumps to main content
- [ ] Test form submission with keyboard
- [ ] Verify all interactive elements are reachable

### Touch Target Verification

**Test on Real Devices:**
- iPhone SE (small screen, 375px width)
- iPhone 12/13 (standard size)
- Android device (low-end, test performance)

**Verification Method:**
1. Use browser inspector to measure element dimensions
2. Verify min-height and min-width ≥ 44px
3. Test tap accuracy - can you hit target easily?
4. Test adjacent targets - is there spacing between?

### Color Contrast Verification

**Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element > Styles > Color picker shows contrast ratio
- axe DevTools: Automated scan for contrast issues

**Check these combinations:**
- All text on backgrounds
- Button text on button backgrounds
- Link colors
- Focus indicators
- Badge text
- Glass text on glass backgrounds

### Lighthouse Audit

**Target Score:** 90+ for Accessibility

**Run audit:**
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Select "Mobile" and "Accessibility" category
4. Run audit
5. Fix any issues found
6. Re-run until 90+ achieved

---

## Rollback Plan

If critical issues are discovered after deployment:

1. **Button sizes:** Revert commits for button.tsx, badge.tsx
2. **Mobile nav:** Revert global-nav-bar.tsx changes
3. **Form errors:** Input/Textarea changes are additive, won't break existing forms
4. **Text contrast:** Revert globals.css text-subtle change

**Git strategy:**
- Make each fix a separate commit
- Use conventional commit format: `fix(a11y): increase button touch targets to 44px`
- Tag release after all fixes: `v1.1.0-a11y-compliant`

---

## Success Metrics

**Before Implementation:**
- WCAG AA Compliance: FAIL (8 critical issues)
- Lighthouse Accessibility Score: ~75-80
- Touch target violations: 13+
- Screen reader compatibility: Partial

**After Implementation:**
- WCAG AA Compliance: PASS ✅
- Lighthouse Accessibility Score: 90+ ✅
- Touch target violations: 0 ✅
- Screen reader compatibility: Full ✅

---

## Estimated Effort

**Phase 1 - Critical (Day 1):**
- Button touch targets: 1 hour
- Badge updates: 2 hours
- Dialog/Sheet close buttons: 1 hour
- Mobile navigation integration: 3 hours
- **Total: 7 hours**

**Phase 2 - High Priority (Day 2):**
- Form error associations: 2 hours
- Empty/Error state roles: 1 hour
- Text contrast fix: 0.5 hours
- Search bar labels: 1 hour
- Skip link integration: 1 hour
- Tag cloud updates: 1 hour
- **Total: 6.5 hours**

**Phase 3 - Testing (Day 3):**
- Manual screen reader testing: 3 hours
- Keyboard navigation testing: 2 hours
- Touch target verification: 1 hour
- Color contrast verification: 1 hour
- Lighthouse audits: 1 hour
- **Total: 8 hours**

**Grand Total: 21.5 hours (~3 days)**

---

**End of Implementation Plan**

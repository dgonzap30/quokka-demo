# Authentication Component Patterns Research

**Task:** Design authentication UI component architecture
**Date:** 2025-10-04
**Agent:** UI Planner (Component Architect)

---

## Existing Patterns Audit

### shadcn/ui Primitives Available

**Input Component** (`components/ui/input.tsx`)
- ✅ Already implements glassmorphism with `backdrop-blur-sm` and `focus:backdrop-blur-md`
- ✅ Built-in focus states with ring effects (`focus-visible:ring-[3px]`)
- ✅ Error state support via `aria-invalid` attribute
- ✅ Glass shadow on focus: `focus-visible:shadow-[var(--shadow-glass-sm)]`
- ✅ Supports type-safe props via `React.ComponentProps<"input">`
- **Reuse:** Perfect base for email/password inputs

**Button Component** (`components/ui/button.tsx`)
- ✅ Variant system using `class-variance-authority`
- ✅ Glass variants available: `glass-primary`, `glass-secondary`, `glass-accent`, `glass`
- ✅ Hover effects with scale transforms (`hover:scale-[1.02]`)
- ✅ Active state feedback (`active:scale-[0.98]`)
- ✅ Focus ring built-in (`focus-visible:ring-ring/50`)
- ✅ Disabled state handling
- **Reuse:** Use `glass-primary` variant for submit buttons

**Card Component** (`components/ui/card.tsx`)
- ✅ Glass variants: `glass`, `glass-strong`, `glass-hover`, `glass-liquid`
- ✅ Composition pattern: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- ✅ QDS v2.0 glassmorphism compliant
- ✅ Liquid border support via `glass-liquid` variant
- **Reuse:** Use `glass-strong` variant for auth form containers

### QDS v2.0 Glassmorphism System

**Available from `globals.css`:**
- Glass surface tokens: `--glass-ultra`, `--glass-strong`, `--glass-medium`, `--glass-subtle`
- Backdrop blur scale: `--blur-xs` through `--blur-2xl`
- Glass borders: `--border-glass`
- Glass shadows: `--shadow-glass-sm`, `--shadow-glass-md`, `--shadow-glass-lg`
- Glow effects: `--glow-primary`, `--glow-secondary`, `--glow-accent`
- Utility classes: `.glass-panel`, `.glass-panel-strong`, `.glass-overlay`, `.liquid-border`

**Background Mesh:**
- Root layout (`app/layout.tsx`) already provides glassmorphism background mesh
- Noise texture overlay with liquid mesh gradients
- Radial gradients at 40%/20% and 80%/80%

### Form Validation Patterns

**Current State:**
- No existing form validation utilities found in codebase
- No form libraries (e.g., react-hook-form, zod) detected
- Input component supports `aria-invalid` for error states
- **Decision:** Build lightweight custom validation for mock auth

### Existing Type Patterns

**From existing code:**
- TypeScript strict mode enabled
- Use of `import type` for type-only imports (found in `lib/utils.ts`)
- Component props extend `React.ComponentProps<"element">`
- Variant props use `VariantProps<typeof variants>`
- **Pattern to follow:** Define explicit interfaces, export for reuse

---

## Requirements Analysis

### Data Requirements (Props)

**LoginForm:**
- `onSubmit: (email: string, password: string) => Promise<void>` - Submit handler
- `error?: string` - Server/validation error message
- `isLoading?: boolean` - Loading state during authentication
- `className?: string` - Style composition
- Optional: `onForgotPassword?: () => void` - Forgot password callback

**SignupForm:**
- `onSubmit: (email: string, password: string, name: string) => Promise<void>` - Submit handler
- `error?: string` - Server/validation error message
- `isLoading?: boolean` - Loading state during registration
- `className?: string` - Style composition
- Optional: `onPrivacyClick?: () => void` - Privacy policy callback
- Optional: `onTermsClick?: () => void` - Terms of service callback

**AuthLayout:**
- `children: React.ReactNode` - Form content
- `title: string` - Page title (e.g., "Welcome back")
- `subtitle?: string` - Optional subtitle
- `footer?: React.ReactNode` - Footer content (e.g., "Don't have an account?")
- `className?: string` - Style composition

### State Requirements

**Local State (Component-level):**
- Form field values (email, password, name)
- Field-level validation errors
- Form touched/dirty state
- Password visibility toggle (show/hide)

**Lifted State (Page-level):**
- Authentication loading state
- API error messages
- Redirect after success

**Global State (Context):**
- Current user session
- Authentication status (authenticated, unauthenticated, loading)
- User profile data
- **Implementation:** AuthProvider context wrapping app

### Event Handling Needs

**Callbacks:**
```typescript
// Form submission
onSubmit: (data: LoginData | SignupData) => Promise<void>

// Navigation
onForgotPassword?: () => void
onSignupClick?: () => void
onLoginClick?: () => void
onPrivacyClick?: () => void
onTermsClick?: () => void

// Field changes (internal to component)
handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void
handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void
handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void
```

**Event Flow:**
1. User enters data → Local state updates
2. User submits → Client-side validation
3. If valid → Call `onSubmit` with data
4. Parent handles API call → Sets `isLoading` to true
5. On success → Redirect to dashboard
6. On error → Display error message via `error` prop

### Variant Requirements

**Visual Variations:**
- Input field states: default, focused, error, disabled, filled
- Button states: default, hover, active, loading, disabled
- Form container: glass-strong card with liquid border option

**Behavioral Variations:**
- Login vs Signup forms (different fields)
- With/without "Remember me" checkbox
- With/without social auth buttons (future extension)

### Accessibility Requirements

**WCAG 2.2 AA Compliance:**
- ✅ Semantic HTML: `<form>`, `<label>`, `<input type="email">`, `<input type="password">`
- ✅ Labels associated with inputs via `htmlFor`/`id`
- ✅ Error messages announced via `aria-describedby`
- ✅ Focus order: email → password → submit
- ✅ Keyboard navigation: Tab, Enter to submit
- ✅ Focus indicators visible (already in Input/Button components)
- ✅ Contrast ratio: 4.5:1 minimum (QDS tokens ensure this)
- ✅ Password visibility toggle button with aria-label
- ✅ Form validation errors clear and descriptive

**Screen Reader Support:**
- Use `aria-invalid="true"` on invalid fields
- Use `aria-describedby` to link error messages
- Use `role="alert"` for error announcements
- Submit button includes loading state via `aria-busy`

### Responsive Behavior

**Breakpoints:**
- Mobile (360px): Full-width form, stack elements vertically
- Tablet (768px): Centered form with max-width 400px
- Desktop (1024px+): Centered form with max-width 450px

**Touch Targets:**
- All inputs/buttons ≥44px height (already met by shadcn defaults)
- Adequate spacing between interactive elements (gap-4, gap-6)

---

## Performance Considerations

### Render Frequency

**Low Frequency:**
- Auth forms render once on page load
- Re-render only on form submission or error
- **Optimization:** No memoization needed

### Expensive Operations

**None identified:**
- Simple form field updates (fast)
- Client-side validation is synchronous and cheap
- **Optimization:** Not required

### Memoization Opportunities

**Not needed:**
- Components are small (<200 LoC)
- No expensive computations
- No frequent re-renders expected

### Code Splitting

**Not applicable:**
- Auth pages are entry points (cannot defer load)
- Bundle size minimal (using existing primitives)

---

## Design System Compliance

### QDS v2.0 Glassmorphism

**Form Container:**
- Use `Card` component with `variant="glass-strong"`
- Apply liquid border via `glass-liquid` variant or custom `.liquid-border`
- Shadow: `shadow-[var(--shadow-glass-lg)]`
- Padding: `p-8` (32px) for generous spacing

**Input Fields:**
- Already glass-compliant via `components/ui/input.tsx`
- Backdrop blur on focus for depth hierarchy
- Glass shadow on focus state

**Submit Button:**
- Use `Button` with `variant="glass-primary"`
- Hover glow effect: `hover:shadow-[var(--glow-primary)]`
- Loading state with disabled appearance

**Error Messages:**
- Background: `bg-destructive/10` with `backdrop-blur-sm`
- Border: `border-destructive/30`
- Text: `text-destructive` with `dark:text-destructive-foreground`
- Icon: Lucide `AlertCircle` icon

### Color Tokens

**Used tokens:**
- `--primary`, `--primary-hover` - Submit button
- `--destructive` - Error states
- `--border-glass` - Form container border
- `--glass-strong` - Form background
- `--shadow-glass-lg` - Form shadow
- `--glow-primary` - Button hover glow

**Never hardcoded:**
- ❌ No hex colors like `#FF0000`
- ✅ Only semantic tokens

### Spacing Scale

**4pt grid compliance:**
- `gap-2` (8px) - Between label and input
- `gap-4` (16px) - Between form fields
- `gap-6` (24px) - Between form sections
- `p-8` (32px) - Form container padding
- `px-4` (16px) - Input horizontal padding

### Radius Scale

- Form container: `rounded-xl` (--radius-xl: 20px)
- Inputs: `rounded-md` (--radius-md: 10px)
- Buttons: `rounded-md` (--radius-md: 10px)

---

## Security Considerations (Frontend-only)

**Mock Authentication:**
- No real credentials stored
- Passwords not validated against real security rules
- Session stored in memory (not localStorage for security demo)
- **Note:** Production would use httpOnly cookies + JWT

**Client-side Validation:**
- Email format validation (basic regex)
- Password minimum length (8 characters)
- Name required (non-empty)
- **Not security:** These are UX hints only

---

## Existing Component Patterns to Reuse

1. **Input Component** → Email, password, name fields
2. **Button Component** → Submit, toggle password visibility
3. **Card Component** → Form container
4. **Separator Component** → Divider between form and footer
5. **Alert/Error Display** → Will need custom error component (not found in codebase)

---

## Dependencies Required

**None beyond existing:**
- ✅ React (already installed)
- ✅ TypeScript (already configured)
- ✅ Tailwind CSS v4 (already configured)
- ✅ shadcn/ui primitives (already available)
- ✅ Lucide icons (already installed, use `Eye`, `EyeOff`, `AlertCircle`)

**NOT adding:**
- ❌ react-hook-form (overkill for 2 simple forms)
- ❌ zod (simple inline validation sufficient)
- ❌ External auth library (mock only)

---

## Summary

**Reusable Primitives:**
- Input, Button, Card components fully support QDS v2.0 glassmorphism
- No custom primitives needed, only composition

**New Components to Create:**
- `LoginForm` - Orchestrates email/password fields + submit
- `SignupForm` - Orchestrates email/password/name fields + submit
- `AuthLayout` - Shared layout wrapper with title/footer
- `AuthProvider` - Context for global auth state
- `FieldError` - Inline error message component (small utility)

**Design System Compliance:**
- All components will use QDS v2.0 tokens (glass, shadows, glows)
- No hardcoded values
- WCAG 2.2 AA accessible
- Responsive (360-1280px)

**Performance:**
- No optimization needed (simple forms, low re-render frequency)
- Bundle impact minimal (reusing existing components)

---

**Next Steps:**
1. Design detailed component hierarchy
2. Define TypeScript interfaces for all props
3. Plan state management architecture
4. Create usage examples
5. Document in `plans/auth-component-design.md`

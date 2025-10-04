# Authentication Component Design Plan

**Task:** Authentication UI Component Architecture
**Date:** 2025-10-04
**Agent:** UI Planner (Component Architect)

---

## Component Hierarchy

```
app/
├── (auth)/                          # Auth route group (no navbar)
│   ├── layout.tsx                   # AuthLayout wrapper
│   ├── login/
│   │   └── page.tsx                 # Login page (uses LoginForm)
│   └── signup/
│       └── page.tsx                 # Signup page (uses SignupForm)
│
components/
├── auth/
│   ├── login-form.tsx               # LoginForm component
│   ├── signup-form.tsx              # SignupForm component
│   ├── auth-layout.tsx              # AuthLayout wrapper
│   └── field-error.tsx              # FieldError utility
│
lib/
├── contexts/
│   └── auth-context.tsx             # AuthProvider + useAuth hook
├── api/
│   ├── client.ts                    # Add mock auth methods
│   └── hooks.ts                     # Add auth React Query hooks
└── models/
    └── types.ts                     # Add User, AuthData types
```

**Component Tree (Composition):**
```
AuthLayout
└── LoginForm / SignupForm
    ├── Card (variant="glass-strong")
    │   ├── CardHeader
    │   │   └── CardTitle
    │   ├── CardContent
    │   │   ├── form (semantic HTML)
    │   │   │   ├── div (field group)
    │   │   │   │   ├── label
    │   │   │   │   ├── Input
    │   │   │   │   └── FieldError
    │   │   │   └── Button (variant="glass-primary")
    │   │   └── (error alert if API error)
    │   └── CardFooter
    │       └── (link to signup/login)
```

---

## Props Interfaces (TypeScript)

### 1. LoginForm Component

**File:** `components/auth/login-form.tsx`

```typescript
import type { FormEvent } from "react";

export interface LoginFormProps {
  /**
   * Submit handler called with validated email and password.
   * Should return a Promise that resolves on success or rejects on error.
   */
  onSubmit: (email: string, password: string) => Promise<void>;

  /**
   * Optional error message from API/server to display above form.
   */
  error?: string;

  /**
   * Loading state during authentication API call.
   */
  isLoading?: boolean;

  /**
   * Callback when user clicks "Forgot password?" link.
   */
  onForgotPassword?: () => void;

  /**
   * Callback when user clicks "Sign up" link.
   */
  onSignupClick?: () => void;

  /**
   * Optional className for style composition.
   */
  className?: string;
}
```

**Internal State:**
```typescript
interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  errors: {
    email?: string;
    password?: string;
  };
}
```

### 2. SignupForm Component

**File:** `components/auth/signup-form.tsx`

```typescript
export interface SignupFormProps {
  /**
   * Submit handler called with validated signup data.
   * Should return a Promise that resolves on success or rejects on error.
   */
  onSubmit: (email: string, password: string, name: string) => Promise<void>;

  /**
   * Optional error message from API/server to display above form.
   */
  error?: string;

  /**
   * Loading state during registration API call.
   */
  isLoading?: boolean;

  /**
   * Callback when user clicks "Log in" link.
   */
  onLoginClick?: () => void;

  /**
   * Optional className for style composition.
   */
  className?: string;
}
```

**Internal State:**
```typescript
interface SignupFormState {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
  };
}
```

### 3. AuthLayout Component

**File:** `components/auth/auth-layout.tsx`

```typescript
export interface AuthLayoutProps {
  /**
   * Main content (form).
   */
  children: React.ReactNode;

  /**
   * Page title displayed above form.
   */
  title: string;

  /**
   * Optional subtitle/description below title.
   */
  subtitle?: string;

  /**
   * Optional footer content below form (e.g., links to other auth pages).
   */
  footer?: React.ReactNode;

  /**
   * Optional className for layout container.
   */
  className?: string;
}
```

### 4. FieldError Component

**File:** `components/auth/field-error.tsx`

```typescript
export interface FieldErrorProps {
  /**
   * Error message to display. If undefined, renders nothing.
   */
  message?: string;

  /**
   * Optional className for style overrides.
   */
  className?: string;
}
```

### 5. AuthProvider Context

**File:** `lib/contexts/auth-context.tsx`

```typescript
interface AuthContextValue {
  /**
   * Current authenticated user, or null if not authenticated.
   */
  user: User | null;

  /**
   * Authentication loading state.
   */
  isLoading: boolean;

  /**
   * Whether user is authenticated.
   */
  isAuthenticated: boolean;

  /**
   * Login method.
   */
  login: (email: string, password: string) => Promise<void>;

  /**
   * Signup method.
   */
  signup: (email: string, password: string, name: string) => Promise<void>;

  /**
   * Logout method.
   */
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}
```

### 6. Type Definitions (lib/models/types.ts)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "ta";
  avatar?: string;
  createdAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string; // Mock token for demo
}
```

---

## State Management Plan

### Local State (Component-level)

**LoginForm / SignupForm:**
- Form field values (email, password, name) → `useState`
- Field-level validation errors → `useState` object
- Password visibility toggle → `useState` boolean
- **Why local?** These are ephemeral UI states that reset on unmount

**Example:**
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

### Lifted State (Page-level)

**Login/Signup Pages:**
- API error messages → Passed as `error` prop to form components
- Loading state → Passed as `isLoading` prop to form components
- **Why lifted?** Page handles redirect on success, needs to control loading state

**Example (app/(auth)/login/page.tsx):**
```typescript
export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      await login(email, password);
      router.push("/dashboard"); // Redirect on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return <LoginForm onSubmit={handleSubmit} error={error} isLoading={isLoading} />;
}
```

### Global State (Context)

**AuthProvider:**
- Current user object → Context state
- Authentication status → Derived from user (null = not authenticated)
- Session persistence → In-memory only (no localStorage for security demo)
- **Why global?** Auth state needed throughout app (navbar, protected routes, etc.)

**Implementation Strategy:**
```typescript
// lib/contexts/auth-context.tsx
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser(); // Mock API call
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await mockLogin(email, password);
    setUser(response.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await mockSignup(email, password, name);
    setUser(response.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

### No React Query for Auth

**Why not?**
- Auth state is global and persistent (not cache-based)
- Login/signup are mutations, but auth state persists beyond request lifecycle
- Context + useState simpler for this use case
- React Query better suited for server data fetching (courses, threads, etc.)

---

## Event Handling Pattern

### Callback Signatures

```typescript
// Form submission (after validation)
onSubmit: (email: string, password: string) => Promise<void>
onSubmit: (email: string, password: string, name: string) => Promise<void>

// Navigation callbacks
onForgotPassword?: () => void
onSignupClick?: () => void
onLoginClick?: () => void

// Internal field handlers (not exposed as props)
handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void
handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void
handleTogglePassword: () => void
```

### Event Flow

**1. User Input:**
```
User types in email field
  → handleEmailChange fires
  → setEmail(e.target.value)
  → Clear email error if exists
```

**2. Form Submission:**
```
User clicks Submit button (or presses Enter)
  → handleSubmit fires (preventDefault)
  → Validate all fields client-side
  → If invalid: setErrors, return early
  → If valid: call props.onSubmit(email, password)
  → onSubmit is async, parent handles:
      - Set isLoading=true (disables button)
      - Call mock API
      - On success: redirect to /dashboard
      - On error: set error prop, display at top of form
      - Set isLoading=false
```

**3. Password Visibility Toggle:**
```
User clicks eye icon
  → handleTogglePassword fires
  → setShowPassword(!showPassword)
  → Input type changes: "password" ↔ "text"
  → Icon changes: Eye ↔ EyeOff
```

### Error Handling Approach

**Two-tier errors:**
1. **Field-level errors** (local state, inline below field)
   - Email format invalid
   - Password too short
   - Name required
   - Cleared on field change

2. **Form-level errors** (prop from parent, displayed at top)
   - "Invalid email or password" (API response)
   - "Email already exists" (API response)
   - Network errors
   - Persistent until next submit attempt

**Example:**
```tsx
{/* Form-level error (from API) */}
{error && (
  <div role="alert" className="flex gap-2 p-3 rounded-md backdrop-blur-sm bg-destructive/10 border border-destructive/30">
    <AlertCircle className="size-4 text-destructive" />
    <p className="text-sm text-destructive">{error}</p>
  </div>
)}

{/* Field-level error (client validation) */}
<FieldError message={errors.email} />
```

---

## Variant System

### Visual Variants

**Form Container:**
- Uses `Card` with `variant="glass-strong"`
- Optional: Add `className="liquid-border"` for animated gradient border
- Shadow: `shadow-[var(--shadow-glass-lg)]`

**Input States (built into Input component):**
- Default: `border-input`, `bg-transparent`, `backdrop-blur-sm`
- Focused: `border-ring`, `ring-ring/50`, `backdrop-blur-md`, `shadow-[var(--shadow-glass-sm)]`
- Error: `aria-invalid:border-destructive`, `aria-invalid:ring-destructive/20`
- Disabled: `disabled:opacity-50`, `disabled:cursor-not-allowed`

**Button States (built into Button component):**
- Default: `variant="glass-primary"` → `bg-primary/70`, `backdrop-blur-md`
- Hover: `hover:bg-primary/85`, `hover:shadow-[var(--glow-primary)]`
- Loading: `disabled:opacity-50` + spinner icon
- Active: `active:scale-[0.98]`

### Behavioral Variants

**LoginForm vs SignupForm:**
- LoginForm: 2 fields (email, password)
- SignupForm: 3 fields (name, email, password)
- Both share same validation logic pattern
- Both share same submit flow

**Future Extensions (not implemented now):**
- Social auth buttons (Google, Microsoft)
- "Remember me" checkbox
- Two-factor authentication flow

---

## File Structure

### Files to Create

1. **`lib/models/types.ts`** (add to existing file)
   - Add `User`, `LoginData`, `SignupData`, `AuthResponse` interfaces

2. **`lib/contexts/auth-context.tsx`** (new file)
   - `AuthProvider` component
   - `useAuth` hook
   - `AuthContext` creation

3. **`lib/api/client.ts`** (add to existing file)
   - `mockLogin(email, password)` method
   - `mockSignup(email, password, name)` method
   - `getCurrentUser()` method
   - Mock delay simulation (200-500ms)

4. **`components/auth/field-error.tsx`** (new file)
   - Small utility component for inline field errors

5. **`components/auth/auth-layout.tsx`** (new file)
   - Layout wrapper with title, subtitle, footer

6. **`components/auth/login-form.tsx`** (new file)
   - LoginForm component with email/password fields

7. **`components/auth/signup-form.tsx`** (new file)
   - SignupForm component with name/email/password fields

8. **`app/(auth)/layout.tsx`** (new file)
   - Auth route group layout (no navbar, centered form)

9. **`app/(auth)/login/page.tsx`** (new file)
   - Login page using LoginForm

10. **`app/(auth)/signup/page.tsx`** (new file)
    - Signup page using SignupForm

11. **`app/layout.tsx`** (modify existing)
    - Wrap children with `<AuthProvider>`

### Files to Modify

1. **`lib/models/types.ts`**
   - Add auth-related types

2. **`lib/api/client.ts`**
   - Add mock auth methods

3. **`app/layout.tsx`**
   - Add AuthProvider wrapper

### Import/Export Strategy

```typescript
// components/auth/index.ts (barrel export)
export { LoginForm } from "./login-form";
export { SignupForm } from "./signup-form";
export { AuthLayout } from "./auth-layout";
export { FieldError } from "./field-error";
export type { LoginFormProps, SignupFormProps, AuthLayoutProps, FieldErrorProps } from "./types";

// lib/contexts/index.ts (barrel export)
export { AuthProvider, useAuth } from "./auth-context";
export type { AuthContextValue } from "./auth-context";
```

---

## Usage Examples

### Example 1: Login Page (Basic Usage)

```tsx
// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth";
import { useAuth } from "@/lib/contexts";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    router.push("/signup");
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      error={error}
      isLoading={isLoading}
      onSignupClick={handleSignupClick}
      onForgotPassword={handleForgotPassword}
    />
  );
}
```

### Example 2: Signup Page

```tsx
// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth";
import { useAuth } from "@/lib/contexts";

export default function SignupPage() {
  const { signup } = useAuth();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await signup(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <SignupForm
      onSubmit={handleSubmit}
      error={error}
      isLoading={isLoading}
      onLoginClick={handleLoginClick}
    />
  );
}
```

### Example 3: Using AuthProvider in App

```tsx
// app/layout.tsx
import { AuthProvider } from "@/lib/contexts";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Example 4: Protected Route

```tsx
// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/lib/contexts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null; // Redirecting...

  return <div>Welcome, {user.name}!</div>;
}
```

### Example 5: Logout Button

```tsx
// components/nav-header.tsx
import { useAuth } from "@/lib/contexts";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function NavHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="flex items-center justify-between p-4">
      <h1>QuokkaQ</h1>
      <Button variant="ghost" onClick={logout}>
        <LogOut className="size-4" />
        Logout
      </Button>
    </header>
  );
}
```

---

## Test Scenarios

### User Interactions to Test

1. **Login Flow:**
   - ✅ Enter valid email and password → Submit → Redirect to dashboard
   - ✅ Enter invalid email format → See inline error below email field
   - ✅ Enter password too short → See inline error below password field
   - ✅ Submit with valid format but wrong credentials → See API error at top
   - ✅ Click "Forgot password?" link → Navigate to forgot password page
   - ✅ Click "Sign up" link → Navigate to signup page

2. **Signup Flow:**
   - ✅ Enter valid name, email, password → Submit → Redirect to dashboard
   - ✅ Leave name empty → See inline error
   - ✅ Enter invalid email format → See inline error
   - ✅ Enter password too short → See inline error
   - ✅ Submit with email that already exists → See API error at top
   - ✅ Click "Log in" link → Navigate to login page

3. **Password Visibility:**
   - ✅ Click eye icon → Password text becomes visible
   - ✅ Click eye-off icon → Password text becomes hidden
   - ✅ Icon changes between Eye and EyeOff components

4. **Loading States:**
   - ✅ Click submit → Button shows loading spinner and is disabled
   - ✅ All form fields disabled during loading
   - ✅ After API response → Loading state clears

5. **Keyboard Navigation:**
   - ✅ Tab through: Email → Password → Submit button
   - ✅ Tab to password visibility toggle → Enter to toggle
   - ✅ Press Enter in password field → Submits form
   - ✅ Escape in field → Clears focus (browser default)

6. **Auth Context:**
   - ✅ Login → `user` state updates → `isAuthenticated` becomes true
   - ✅ Logout → `user` becomes null → `isAuthenticated` becomes false
   - ✅ Protected route redirects if not authenticated
   - ✅ Session persists across page navigation (within session)

### Edge Cases to Handle

1. **Empty Form Submission:**
   - All fields show "This field is required" error

2. **API Network Error:**
   - Display generic error: "Unable to connect. Please try again."

3. **API Timeout:**
   - Show error after 10 seconds: "Request timed out. Please try again."

4. **Rapid Form Submissions:**
   - Disable submit button during loading to prevent double-submit

5. **Long Email Address:**
   - Email field scrolls horizontally (input handles this)

6. **Special Characters in Password:**
   - Allow all characters (no client-side restrictions beyond length)

7. **Browser Autofill:**
   - Fields correctly fill from browser password manager
   - Autofilled fields do not show "required" errors

### Accessibility Checks

1. **Keyboard Navigation:**
   - ✅ All interactive elements reachable via Tab
   - ✅ Focus indicators visible on all elements
   - ✅ Focus order logical (top to bottom, left to right)

2. **Screen Reader:**
   - ✅ Labels announced for all inputs
   - ✅ Error messages announced when they appear (role="alert")
   - ✅ Loading state announced on submit button (aria-busy)
   - ✅ Password visibility toggle has aria-label

3. **Color Contrast:**
   - ✅ All text meets 4.5:1 ratio (use QDS tokens)
   - ✅ Error text meets 4.5:1 ratio against background
   - ✅ Placeholder text meets 4.5:1 ratio

4. **Focus States:**
   - ✅ Input focus ring visible (already in Input component)
   - ✅ Button focus ring visible (already in Button component)
   - ✅ Password toggle button focus ring visible

### Responsive Breakpoints

1. **Mobile (360px):**
   - ✅ Form full-width with side padding
   - ✅ Button full-width
   - ✅ Title font size scales down
   - ✅ Touch targets ≥44px

2. **Tablet (768px):**
   - ✅ Form centered with max-width 400px
   - ✅ Button full-width within form
   - ✅ Adequate spacing around form

3. **Desktop (1024px+):**
   - ✅ Form centered with max-width 450px
   - ✅ Background mesh visible and attractive
   - ✅ Hover states work correctly

---

## Validation Rules

### Client-Side Validation

**Email Field:**
```typescript
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
  return undefined;
};
```

**Password Field:**
```typescript
const validatePassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return undefined;
};
```

**Name Field:**
```typescript
const validateName = (name: string): string | undefined => {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return undefined;
};
```

### Server-Side Validation (Mock)

**Mock API errors:**
- "Invalid email or password" (login with wrong credentials)
- "Email already exists" (signup with existing email)
- "Network error" (simulated 5% failure rate)

---

## Performance Notes

**No Optimization Needed:**
- Forms are small, simple components
- Render frequency is low (only on user input)
- No expensive computations
- No large lists or complex data structures

**Bundle Impact:**
- Reusing existing primitives (Input, Button, Card)
- Only new code: 3 small components + 1 context provider
- Estimated bundle addition: <10KB

**Accessibility Performance:**
- Backdrop blur limited to 3 layers max (form container, inputs, button)
- GPU-accelerated transforms for animations
- `will-change` applied to glass panels for browser optimization

---

## QDS v2.0 Glassmorphism Compliance Checklist

- [x] Form container uses `Card` with `variant="glass-strong"`
- [x] Inputs use existing glassmorphism from `components/ui/input.tsx`
- [x] Submit button uses `variant="glass-primary"` with glow on hover
- [x] Error messages use glass background with backdrop blur
- [x] All colors use semantic tokens (no hardcoded hex)
- [x] Spacing follows 4pt grid (gap-2, gap-4, gap-6, p-8)
- [x] Border radius uses QDS scale (rounded-md, rounded-xl)
- [x] Shadows use glass shadows (`--shadow-glass-sm`, etc.)
- [x] Hover effects use glow tokens (`--glow-primary`, etc.)
- [x] Background mesh from layout.tsx provides liquid gradient backdrop
- [x] Optional liquid border via `.liquid-border` class
- [x] Reduced motion support (animations disabled via media query)
- [x] Fallback for browsers without backdrop-filter support

---

## Security Notes (Frontend-Only)

**Mock Authentication:**
- Hardcoded user list in memory
- Passwords checked via simple string match (not hashed)
- "Token" is just a random string (no JWT)
- Session stored in React state (lost on refresh)

**Production Considerations (Future):**
- Use httpOnly cookies for session tokens
- Passwords hashed with bcrypt on backend
- CSRF protection with tokens
- Rate limiting on login attempts
- Email verification flow
- Two-factor authentication

---

## Summary

**Architecture:**
- 3 new components: `LoginForm`, `SignupForm`, `AuthLayout`
- 1 utility: `FieldError`
- 1 context provider: `AuthProvider` with `useAuth` hook
- 2 new routes: `/login`, `/signup` (auth route group)

**Props-Driven:**
- All data flows via props (no hardcoded values)
- All event handlers via callbacks
- Form state managed locally, API errors lifted to page

**QDS v2.0 Compliant:**
- Glass-strong card containers
- Glassmorphism inputs with backdrop blur
- Glass-primary buttons with glow effects
- All semantic tokens, no hardcoded colors

**Accessible:**
- WCAG 2.2 AA compliant
- Semantic HTML with proper labels
- Keyboard navigable
- Screen reader friendly
- Focus indicators visible

**Performant:**
- Small bundle impact (<10KB)
- Reuses existing primitives
- No optimization needed
- GPU-accelerated glass effects

**Type-Safe:**
- Explicit TypeScript interfaces for all props
- No `any` types
- Exported interfaces for reuse

---

**Files Created:** 10 new + 3 modified
**Estimated LOC:** ~800 lines total (all components <200 LOC each)
**Bundle Impact:** <10KB
**Dependencies:** 0 (uses existing stack)

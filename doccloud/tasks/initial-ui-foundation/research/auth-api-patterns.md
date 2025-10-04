# Authentication API Patterns Research

## Existing Patterns Analysis

### 1. Project Architecture Overview

**Current State:**
- No authentication system exists yet
- `lib/models/types.ts` does not exist - will be created
- `lib/api/client.ts` does not exist - will be created
- `lib/api/hooks.ts` does not exist - will be created
- `lib/store/localStore.ts` does not exist - will be created
- Only existing utility: `lib/utils.ts` with `cn()` helper

**Implications:**
- Clean slate for authentication design
- Must establish foundational patterns for all API layers
- Can leverage course-dashboard patterns as reference

### 2. Existing Course Dashboard Patterns (Reference)

From `doccloud/tasks/course-dashboard/` research and plans:

**Type Definition Patterns:**
- Strict TypeScript mode, no `any` types
- Use `import type` for type-only imports
- JSDoc comments for complex types
- Enums use union types: `'student' | 'instructor' | 'ta'`
- Optional fields marked with `?`
- All IDs are strings with semantic prefixes: `"user-1"`, `"course-cs101"`

**API Client Patterns:**
- All methods return `Promise<T>` types
- Network delay simulation:
  - Standard operations: `200-500ms` (`200 + Math.random() * 300`)
  - Quick actions: `50-100ms`
  - AI operations: `600-800ms`
- Error handling throws descriptive `Error` objects
- Data persistence via `localStore` module
- Method naming: `get*()`, `create*()`, `update*()`, `delete*()`

**React Query Patterns:**
- Centralized `queryKeys` object with typed keys
- Query key format: `['entity']` or `['entity', param]`
- Mutations invalidate related queries
- `enabled` prop for conditional queries
- Stale time varies by data type:
  - Rarely changed: 10 minutes (courses)
  - Moderate: 5 minutes (enrollments)
  - Fresh: 30 seconds (notifications)
  - Real-time: polling with 30s refetch interval

**LocalStore Patterns:**
- Uses localStorage with namespaced keys: `"quokkaq.*"`
- Seed data on first run, persists thereafter
- Helper functions: `get*()`, `add*()`, `update*()`, `delete*()`
- Storage keys in KEYS constant: `KEYS = { users: "quokkaq.users", ... }`

**Mock Data Patterns:**
- JSON arrays of objects
- Realistic data with proper dates, names
- Deterministic (same data on reload)
- Cross-references via IDs

### 3. Authentication Requirements

**From context.md:**
- Mock authentication system (no real backend)
- Support login, signup, logout, session management
- Deterministic in-memory state
- Test users with predictable credentials

**User Roles (from course-dashboard):**
- `'student'` - Regular student account
- `'instructor'` - Course instructor
- `'ta'` - Teaching assistant

**Demo Accounts Pattern:**
From course-dashboard research, demo accounts exist:
```typescript
TEST_ACCOUNTS = {
  student: { id: 'demo-student-1', email: 'student@demo.com', ... },
  instructor: { id: 'demo-instructor-1', email: 'instructor@demo.com', ... }
}
```

## Design Decisions

### 1. Authentication Data Model

**Decision:** Create User, Session, and Auth-related types

**User Interface:**
Already exists in course-dashboard types (will be created):
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

type UserRole = 'student' | 'instructor' | 'ta';
```

**New Auth Types Needed:**
```typescript
interface Session {
  userId: string;
  user: User;
  expiresAt: string;
  createdAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole; // Optional, defaults to 'student'
}

interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'USER_EXISTS' | 'USER_NOT_FOUND' | 'SESSION_EXPIRED';
  message: string;
}
```

**Rationale:**
- Session stores current auth state with hydrated user
- LoginCredentials for type safety on login
- SignupInput for type safety on registration
- AuthError for consistent error handling
- Follows existing pattern of separate input types

### 2. Mock Password Storage Strategy

**Decision:** Store passwords in plain text in localStorage (mock only)

**Mock Users Data Structure:**
```json
{
  "id": "demo-student-1",
  "email": "student@demo.com",
  "password": "demo123",
  "name": "Alex Student",
  "role": "student",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-student-1",
  "createdAt": "2025-08-20T10:00:00Z"
}
```

**Rationale:**
- Frontend-only mock - no security needed
- Easy to debug and test
- Clear in documentation that this is NOT production-ready
- Backend integration will use proper JWT/OAuth2

**Security Note:**
Add prominent warning in code:
```typescript
// WARNING: Mock authentication only!
// Production must use bcrypt/argon2 for passwords
// and JWT/session tokens for auth state
```

### 3. Session Management Strategy

**Decision:** Store session in localStorage with automatic expiry

**Session Storage:**
- Key: `"quokkaq.session"`
- Value: `Session` object with `expiresAt` timestamp
- Expiry: 7 days from login (mock only)
- Auto-clear on expiry or logout

**Session Hydration:**
```typescript
function getSession(): Session | null {
  const session = loadFromStorage<Session>(KEYS.session, null);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    clearSession();
    return null;
  }

  return session;
}
```

**Rationale:**
- Persists across page reloads (localStorage)
- Automatic expiry prevents stale sessions
- Follows existing localStorage pattern
- Easy to clear for logout

### 4. API Method Design

**Decision:** Create auth methods following existing patterns

**Methods:**
```typescript
async login(credentials: LoginCredentials): Promise<Session>
async signup(input: SignupInput): Promise<Session>
async logout(): Promise<void>
async getCurrentUser(): Promise<User | null>
async validateSession(): Promise<boolean>
```

**Delay Strategy:**
- login: 300-500ms (network + auth validation)
- signup: 400-600ms (slightly longer, DB write simulation)
- logout: 50-100ms (quick action)
- getCurrentUser: 200-400ms (standard fetch)
- validateSession: 100-200ms (quick check)

**Error Scenarios:**
- Login: Wrong email/password → throw `AuthError` with 'INVALID_CREDENTIALS'
- Signup: Email exists → throw `AuthError` with 'USER_EXISTS'
- getCurrentUser: No session → return `null` (not error)
- validateSession: Expired → return `false`, auto-logout

**Rationale:**
- Realistic timing matches real auth flows
- Errors are descriptive and typed
- getCurrentUser returns null (not error) for unauthenticated state
- validateSession handles expiry gracefully

### 5. React Query Hooks Strategy

**Decision:** Auth-specific hooks with automatic session validation

**Hooks:**
```typescript
useCurrentUser()           // Fetches current user, null if logged out
useLogin()                 // Mutation for login
useSignup()                // Mutation for signup
useLogout()                // Mutation for logout
useAuth()                  // Combined hook: { user, isAuthenticated, isLoading }
```

**Query Keys:**
```typescript
queryKeys = {
  currentUser: ['currentUser'] as const,
  session: ['session'] as const,
}
```

**Invalidation Strategy:**
- Login success → invalidate `currentUser`, `session`
- Signup success → invalidate `currentUser`, `session`
- Logout → clear all query cache, invalidate `currentUser`, `session`

**Special Hook: useAuth()**
```typescript
export function useAuth() {
  const { data: user, isLoading } = useCurrentUser();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
  };
}
```

**Rationale:**
- useAuth() provides simple boolean for auth checks
- Automatic session validation on query
- Logout clears entire cache (prevents stale data)
- Follows existing query key pattern

### 6. LocalStore Functions

**Decision:** Add auth-specific storage helpers

**Storage Keys:**
```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
  session: "quokkaq.session",           // NEW
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  notifications: "quokkaq.notifications",
} as const;
```

**Helper Functions:**
```typescript
function getSession(): Session | null
function setSession(session: Session): void
function clearSession(): void
function getUserByEmail(email: string): User | null
function getUserById(id: string): User | null
function validateCredentials(email: string, password: string): User | null
function createUser(input: SignupInput & { password: string }): User
function getUsers(): User[]
```

**Rationale:**
- session management isolated to dedicated functions
- credential validation in store layer (not API)
- follows existing pattern of granular helpers
- createUser adds to users array and persists

### 7. Mock Data Seed

**Decision:** Create deterministic demo accounts

**Demo Accounts (mocks/users.json):**
```json
[
  {
    "id": "demo-student-1",
    "email": "student@demo.com",
    "password": "demo123",
    "name": "Alex Student",
    "role": "student",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-student-1",
    "createdAt": "2025-08-20T10:00:00Z"
  },
  {
    "id": "demo-instructor-1",
    "email": "instructor@demo.com",
    "password": "demo123",
    "name": "Dr. Sarah Chen",
    "role": "instructor",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-instructor-1",
    "createdAt": "2025-08-15T08:00:00Z"
  },
  {
    "id": "demo-ta-1",
    "email": "ta@demo.com",
    "password": "demo123",
    "name": "Jordan Martinez",
    "role": "ta",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-ta-1",
    "createdAt": "2025-08-18T09:00:00Z"
  }
]
```

**Additional Test Users:**
- 5-8 additional student accounts
- 2-3 additional instructor accounts
- 1-2 additional TA accounts
- All with predictable passwords: "demo123"

**Rationale:**
- Easy to demo: just type "student@demo.com" / "demo123"
- Covers all roles
- Deterministic (same accounts every time)
- Realistic names and avatars
- DiceBear avatars with seeds ensure consistency

### 8. Protected Route Pattern

**Decision:** Client-side route protection via useAuth hook

**Pattern (for future component implementation):**
```typescript
function ProtectedPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  return <PageContent user={user} />;
}
```

**Role-Based Protection:**
```typescript
function InstructorOnlyPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return redirect('/login');
  if (user.role !== 'instructor') return <ForbiddenError />;

  return <InstructorContent />;
}
```

**Rationale:**
- Simple pattern, easy to understand
- Loading state prevents flicker
- Role checks prevent unauthorized access
- Follows React best practices

## Trade-offs Considered

### Alternative: Context API for Auth State

**Rejected Approach:**
```typescript
const AuthContext = createContext<AuthState | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Why Rejected:**
- React Query already provides caching/state management
- Adds unnecessary complexity
- Context doesn't solve persistence (still need localStorage)
- React Query invalidation more powerful than Context updates

**Chosen Approach:**
- Use React Query for auth state
- localStorage for persistence
- useAuth() hook wraps useCurrentUser()
- Simpler, fewer moving parts

### Alternative: JWT Token Storage

**Rejected Approach:**
```typescript
interface Session {
  token: string;
  expiresAt: string;
}

// Store token, fetch user separately
```

**Why Rejected:**
- Overkill for mock authentication
- Adds unnecessary complexity (token parsing, refresh logic)
- Harder to understand for demo purposes
- Backend integration will use real JWT anyway

**Chosen Approach:**
- Store full user object in session
- Session expiry via timestamp
- Simple, clear, deterministic
- Backend swap still straightforward

### Alternative: Separate Password Storage

**Rejected Approach:**
```typescript
// Store passwords separate from users
const PASSWORDS = {
  'demo-student-1': 'demo123',
  'demo-instructor-1': 'demo123',
}
```

**Why Rejected:**
- Two sources of truth (users + passwords)
- Harder to maintain consistency
- More complex seed data
- No benefit for mock system

**Chosen Approach:**
- Store password with user object
- Single source of truth
- Clear warning this is mock-only
- Easier to seed and debug

## Backend Integration Notes

### What Changes for Real Backend:

1. **API Methods:**
   - Replace localStorage with API calls:
     ```typescript
     const res = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(credentials),
     });
     const { token, user } = await res.json();
     ```
   - Store JWT token instead of full session
   - Add refresh token logic
   - Handle network errors

2. **Session Storage:**
   - Store only token in localStorage
   - User data comes from API
   - HTTP-only cookies for security
   - CSRF protection

3. **Password Handling:**
   - Never store passwords client-side
   - Backend uses bcrypt/argon2
   - Password requirements (min length, complexity)
   - Password reset flow

4. **Error Handling:**
   - HTTP status codes (401 Unauthorized, 409 Conflict)
   - Rate limiting (429 Too Many Requests)
   - Account lockout after failed attempts
   - Proper error messages without leaking info

5. **Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.quokkaq.com
   JWT_SECRET=<random-secret>
   JWT_EXPIRY=7d
   REFRESH_TOKEN_EXPIRY=30d
   ```

6. **OAuth Integration (Future):**
   - Google OAuth2
   - Microsoft Azure AD (for .edu institutions)
   - LTI integration for LMS

### API Endpoint Mapping (Future):

| Mock Method | Future Endpoint | Notes |
|-------------|-----------------|-------|
| `login()` | `POST /api/auth/login` | Returns JWT + user |
| `signup()` | `POST /api/auth/signup` | Email verification |
| `logout()` | `POST /api/auth/logout` | Revokes token |
| `getCurrentUser()` | `GET /api/auth/me` | Requires auth header |
| `validateSession()` | `POST /api/auth/validate` | Checks token validity |

## Performance Considerations

### Bundle Size:
- New types: ~1KB (Session, LoginCredentials, SignupInput, AuthError)
- New API methods: ~3KB (5 methods)
- Mock user data: ~5KB (15 users with avatars)
- **Total: ~9KB** (minimal impact)

### Cache Strategy:
- `currentUser`: No stale time (always fresh)
- `session`: 5 minutes stale time (balance UX/API calls)
- On login/logout: invalidate everything (prevent stale data)

### Optimization Opportunities:
- Prefetch user data on app load
- Optimistic updates for login (show user immediately)
- Session validation on route change (catch expired sessions)
- Lazy load non-essential user data

## Security Considerations (Mock vs. Production)

### Mock (Current Implementation):
- ⚠️ **NOT SECURE** - Passwords stored in plain text
- ⚠️ **NOT SECURE** - No encryption
- ⚠️ **NOT SECURE** - Client-side validation only
- ✅ **OK for demo** - Clear warnings in code
- ✅ **OK for demo** - Easy to understand

### Production Requirements:
- ✅ Passwords hashed with bcrypt/argon2
- ✅ HTTPS only
- ✅ HTTP-only cookies for tokens
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Session fixation protection
- ✅ Secure password reset flow
- ✅ Email verification
- ✅ Multi-factor authentication (optional)

## Files to Modify/Create

### Files to Create:
1. **`lib/models/types.ts`** - User, Session, Auth types (NEW FILE)
2. **`lib/api/client.ts`** - Auth API methods (NEW FILE)
3. **`lib/api/hooks.ts`** - Auth React Query hooks (NEW FILE)
4. **`lib/store/localStore.ts`** - Auth storage helpers (NEW FILE)
5. **`mocks/users.json`** - User seed data (NEW FILE)

### Files to Modify:
- None (all new files)

## Test Scenarios

### Scenario 1: Demo Login Flow
```typescript
// User enters: student@demo.com / demo123
const login = useLogin();
login.mutate({ email: 'student@demo.com', password: 'demo123' });

// Expected: Session created, user returned, queries invalidated
```

### Scenario 2: Wrong Password
```typescript
login.mutate({ email: 'student@demo.com', password: 'wrong' });

// Expected: AuthError thrown with code 'INVALID_CREDENTIALS'
```

### Scenario 3: Signup New User
```typescript
const signup = useSignup();
signup.mutate({
  email: 'newuser@test.com',
  password: 'password123',
  name: 'New User',
});

// Expected: User created, session started, added to localStorage
```

### Scenario 4: Email Already Exists
```typescript
signup.mutate({
  email: 'student@demo.com', // Already exists
  password: 'test',
  name: 'Test',
});

// Expected: AuthError thrown with code 'USER_EXISTS'
```

### Scenario 5: Session Persistence
```typescript
// 1. Login
login.mutate({ email: 'student@demo.com', password: 'demo123' });

// 2. Refresh page
// 3. Check auth state
const { user } = useAuth();
console.log(user); // Should still be logged in
```

### Scenario 6: Session Expiry
```typescript
// 1. Login
// 2. Manually set expiresAt to past date in localStorage
// 3. Call validateSession()

const isValid = await api.validateSession();
console.log(isValid); // false
console.log(await api.getCurrentUser()); // null
```

### Scenario 7: Logout
```typescript
const logout = useLogout();
logout.mutate();

// Expected: Session cleared, cache invalidated, redirected to login
```

### Scenario 8: Protected Route Access
```typescript
// Not logged in
const { user, isAuthenticated } = useAuth();
console.log(isAuthenticated); // false

// Attempt to access /instructor/dashboard
// Expected: Redirected to /login
```

## Accessibility Considerations

### Login Form:
- Email input: `<input type="email" autocomplete="email" />`
- Password input: `<input type="password" autocomplete="current-password" />`
- Error messages: `aria-live="polite"` for screen readers
- Focus management: Auto-focus email on mount

### Signup Form:
- Name input: `<input type="text" autocomplete="name" />`
- Email: `autocomplete="email"`
- Password: `autocomplete="new-password"`
- Password visibility toggle with ARIA label

### Auth Errors:
```tsx
<Alert role="alert" aria-live="assertive">
  <AlertTitle>Login Failed</AlertTitle>
  <AlertDescription>
    Invalid email or password. Please try again.
  </AlertDescription>
</Alert>
```

### Loading States:
```tsx
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Logging in...' : 'Log In'}
</Button>
```

## Next Steps

1. Review this research with parent agent
2. Create detailed implementation plan in `plans/auth-api-design.md`
3. Update `context.md` with API design decisions
4. Wait for approval before implementation

## References

- Course Dashboard API Patterns: `doccloud/tasks/course-dashboard/research/api-patterns.md`
- Course Dashboard API Design: `doccloud/tasks/course-dashboard/plans/api-design.md`
- Course Dashboard Type Design: `doccloud/tasks/course-dashboard/plans/type-design.md`
- React Query Best Practices: https://tanstack.com/query/latest/docs/react/guides/important-defaults
- Next.js Authentication: https://nextjs.org/docs/app/building-your-application/authentication

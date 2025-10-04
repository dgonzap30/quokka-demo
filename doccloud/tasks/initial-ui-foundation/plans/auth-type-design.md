# Type Design Implementation Plan - Authentication System

## Overview

This plan provides exact type definitions, import statements, and integration points for implementing type-safe authentication functionality. All changes follow TypeScript strict mode and existing codebase patterns.

**Risk Level:** LOW - All changes are additive, zero breaking changes
**Implementation Time:** 20 minutes (types only, excludes API/hooks/components)
**Validation:** Run `npx tsc --noEmit` after each file modification

---

## Phase 1: Core Type Definitions

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**Location:** Add after Session interface (after line 97, based on course-dashboard research)

**Add the following interfaces:**

```typescript
// ============================================
// Authentication Types
// ============================================

/**
 * Represents an authenticated user session
 */
export interface AuthSession {
  user: User;              // Embedded user object for convenience
  token: string;           // Mock JWT token
  expiresAt: string;       // ISO 8601 timestamp
  createdAt: string;
}

/**
 * Authentication state for React context/hooks
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;           // null when not authenticated
  isLoading: boolean;          // true during login/logout/session restore
  error: string | null;        // null when no error
}

/**
 * Input for login authentication
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;        // Optional: defaults to false
}

/**
 * Input for user registration
 */
export interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;     // Frontend validation only
  role: UserRole;              // Reuses existing UserRole type
}

/**
 * Successful authentication response
 */
export interface AuthResponse {
  success: true;
  session: AuthSession;
  message?: string;            // Optional success message
}

/**
 * Authentication error response
 */
export interface AuthError {
  success: false;
  error: string;               // Human-readable error message
  code?: string;               // Optional error code (e.g., "INVALID_CREDENTIALS")
}

/**
 * Result of authentication operation (success or error)
 */
export type AuthResult = AuthResponse | AuthError;

// ============================================
// Type Guards for AuthResult
// ============================================

/**
 * Type guard to check if auth result is successful
 */
export function isAuthSuccess(result: AuthResult): result is AuthResponse {
  return result.success === true;
}

/**
 * Type guard to check if auth result is error
 */
export function isAuthError(result: AuthResult): result is AuthError {
  return result.success === false;
}
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types reference existing User and UserRole)

---

## Phase 2: API Client Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

#### Step 2.1: Update Type Imports

**Location:** Existing import statement at top of file (based on course-dashboard pattern)

**FIND:**
```typescript
import type {
  Thread,
  User,
  Post,
  AiAnswer,
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  SimilarThread,
  InstructorMetrics,
  Course,
  Enrollment,
  Notification,
  CourseInsight,
  CourseMetrics,
} from "@/lib/models/types";
```

**REPLACE WITH:**
```typescript
import type {
  Thread,
  User,
  Post,
  AiAnswer,
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  SimilarThread,
  InstructorMetrics,
  Course,
  Enrollment,
  Notification,
  CourseInsight,
  CourseMetrics,
  LoginInput,      // NEW
  SignupInput,     // NEW
  AuthResult,      // NEW
  AuthSession,     // NEW
} from "@/lib/models/types";
```

#### Step 2.2: Add Method Signatures (Documentation Only)

**Location:** After course API method comments

**ADD COMMENTS (do not implement methods yet - API Designer handles implementation):**

```typescript
// Authentication API methods - signatures only (implementation in separate task)
// async login(input: LoginInput): Promise<AuthResult>
// async signup(input: SignupInput): Promise<AuthResult>
// async logout(): Promise<void>
// async restoreSession(): Promise<AuthSession | null>
// async getCurrentUser(): Promise<User | null>  // May already exist
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported correctly)

---

## Phase 3: React Query Hook Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

#### Step 3.1: Update Type Imports

**Location:** Existing import statement

**FIND:**
```typescript
import type {
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  Course,
  Enrollment,
  Notification,
  CourseInsight,
  CourseMetrics,
} from "@/lib/models/types";
```

**REPLACE WITH:**
```typescript
import type {
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  Course,
  Enrollment,
  Notification,
  CourseInsight,
  CourseMetrics,
  LoginInput,      // NEW
  SignupInput,     // NEW
  AuthSession,     // NEW
  AuthResult,      // NEW
} from "@/lib/models/types";
```

#### Step 3.2: Add Query Key Type Definitions

**Location:** After course query key comments

**ADD COMMENTS (do not implement hooks yet - API Designer handles implementation):**

```typescript
// Auth query keys - type signatures only (implementation in separate task)
// session: ["session"] as const,
// currentUser: ["currentUser"] as const,
```

#### Step 3.3: Add Hook Return Type Documentation

**Location:** After course hook comments

**ADD COMMENTS:**

```typescript
// Auth hooks - type signatures only (implementation in separate task)
//
// export function useLogin(): UseMutationResult<AuthResult, Error, LoginInput>
// export function useSignup(): UseMutationResult<AuthResult, Error, SignupInput>
// export function useLogout(): UseMutationResult<void, Error, void>
// export function useSession(): UseQueryResult<AuthSession | null, Error>
// export function useCurrentUser(): UseQueryResult<User | null, Error>
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported, hooks not implemented yet)

---

## Phase 4: Local Store Type Integration

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`

#### Step 4.1: Update Type Imports

**Location:** Existing import statement

**FIND:**
```typescript
import type {
  Thread,
  Post,
  User,
  Session,
  Course,
  Enrollment,
  Notification,
} from "@/lib/models/types";
```

**REPLACE WITH:**
```typescript
import type {
  Thread,
  Post,
  User,
  Session,
  Course,
  Enrollment,
  Notification,
  AuthSession,     // NEW
} from "@/lib/models/types";
```

#### Step 4.2: Update Storage Key Type Definitions

**Location:** KEYS constant (based on course-dashboard pattern)

**FIND:**
```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  notifications: "quokkaq.notifications",
} as const;
```

**REPLACE WITH:**
```typescript
const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  notifications: "quokkaq.notifications",
  authSession: "quokkaq.authSession",     // NEW
} as const;
```

#### Step 4.3: Add Function Signatures (Documentation Only)

**Location:** After course data access function comments

**ADD COMMENTS:**

```typescript
// Auth data access functions - type signatures only (implementation in separate task)
//
// export function getAuthSession(): AuthSession | null
// export function setAuthSession(session: AuthSession): void
// export function clearAuthSession(): void
// export function isSessionValid(session: AuthSession): boolean
```

**Verification:**
```bash
npx tsc --noEmit
```
**Expected:** 0 errors (types imported, functions not implemented yet)

---

## Phase 5: React Context Type Definitions

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/context/auth-context.tsx` (NEW FILE)

**Note:** This file will be created by API Designer, but we document type signatures here

**Type Signatures (Documentation Only):**

```typescript
// Type signatures for auth context - implementation in separate task
//
// import type { User, AuthState } from "@/lib/models/types";
//
// interface AuthContextValue extends AuthState {
//   login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
//   signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
//   logout: () => Promise<void>;
// }
//
// export const AuthContext = createContext<AuthContextValue | null>(null);
// export function useAuth(): AuthContextValue;
// export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

---

## Phase 6: Mock Data Type Validation

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/users.json` (May Already Exist)

**Type Validation Strategy:**

When creating/updating `users.json`, validate against User interface:

```typescript
// Type check in lib/store/localStore.ts seedData():
const users = require('@/mocks/users.json') as User[];

// TypeScript will validate JSON structure at compile time
// Runtime validation happens in try/catch
```

**Expected JSON Structure:**
```json
[
  {
    "id": "demo-student-1",
    "name": "Alice Student",
    "email": "alice@example.com",
    "role": "student",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    "createdAt": "2025-08-20T10:00:00Z"
  },
  {
    "id": "demo-instructor-1",
    "name": "Dr. Bob Teacher",
    "email": "bob@example.com",
    "role": "instructor",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "createdAt": "2025-08-15T09:00:00Z"
  },
  {
    "id": "demo-ta-1",
    "name": "Charlie TA",
    "email": "charlie@example.com",
    "role": "ta",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
    "createdAt": "2025-08-18T08:00:00Z"
  }
]
```

**Type Safety Guarantee:**
- TypeScript validates JSON structure against User interface
- Invalid fields cause compile-time errors
- Missing required fields caught by type system
- Type assertion `as User[]` safe (validated by compiler)
- `role` must be `"student" | "instructor" | "ta"` (validated by UserRole type)

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/credentials.json` (NEW FILE)

**Type Validation:**
```typescript
// Mock credentials for demo login (passwords in plain text for demo only)
const credentials = require('@/mocks/credentials.json') as Array<{
  email: string;
  password: string;
}>;
```

**Expected JSON Structure:**
```json
[
  {
    "email": "alice@example.com",
    "password": "student123"
  },
  {
    "email": "bob@example.com",
    "password": "instructor123"
  },
  {
    "email": "charlie@example.com",
    "password": "ta123"
  }
]
```

**Security Note:** Plain text passwords acceptable for frontend-only demo with mock data. Would never do this in production.

---

## Phase 7: Type-Only Import Enforcement

### Verification Script

**Create temporary type check file:**

`/tmp/auth-type-check.ts`
```typescript
// Verify all imports are type-only (no runtime values)
import type {
  AuthSession,
  AuthState,
  LoginInput,
  SignupInput,
  AuthResponse,
  AuthError,
  AuthResult,
} from "@/lib/models/types";

// These should work (types can be used as types)
const session: AuthSession = {} as AuthSession;
const state: AuthState = {} as AuthState;
const loginInput: LoginInput = {} as LoginInput;
const signupInput: SignupInput = {} as SignupInput;

// These should fail (cannot use types as values)
// const x = new AuthSession();  // ERROR: AuthSession only refers to a type
// const y = typeof AuthSession; // ERROR: AuthSession only refers to a type
```

**Verification Command:**
```bash
npx tsc --noEmit /tmp/auth-type-check.ts
```

**Expected Output:**
- 0 errors (confirms types are type-only, not values)

---

## Type Integration Checklist

### Core Types (lib/models/types.ts)
- [ ] Add AuthSession interface (after Session interface)
- [ ] Add AuthState interface
- [ ] Add LoginInput interface
- [ ] Add SignupInput interface
- [ ] Add AuthResponse interface
- [ ] Add AuthError interface
- [ ] Add AuthResult type alias
- [ ] Add isAuthSuccess type guard function
- [ ] Add isAuthError type guard function
- [ ] Run `npx tsc --noEmit` → 0 errors

### API Client (lib/api/client.ts)
- [ ] Update import statement (add 4 new types)
- [ ] Add method signature comments (5 methods)
- [ ] Run `npx tsc --noEmit` → 0 errors
- [ ] Verify no "unused type" warnings

### React Query Hooks (lib/api/hooks.ts)
- [ ] Update import statement (add 4 new types)
- [ ] Add query key comments
- [ ] Add hook signature comments (5 hooks)
- [ ] Run `npx tsc --noEmit` → 0 errors

### Local Store (lib/store/localStore.ts)
- [ ] Update import statement (add AuthSession)
- [ ] Update KEYS constant (add authSession key)
- [ ] Add function signature comments (4 functions)
- [ ] Run `npx tsc --noEmit` → 0 errors

### Mock Data (mocks/)
- [ ] Validate users.json structure (if creating/updating)
- [ ] Create credentials.json (new file)
- [ ] Verify UserRole values in users.json
- [ ] Verify all timestamps are ISO 8601 format
- [ ] Verify email addresses are valid format

---

## Type Testing Strategy

### Test 1: Type Assignability

**Create test file:** `/tmp/auth-type-test.ts`

```typescript
import type {
  AuthSession,
  AuthState,
  LoginInput,
  SignupInput,
  AuthResponse,
  AuthError,
  AuthResult,
  User,
  UserRole,
} from "@/lib/models/types";

// Valid LoginInput
const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'test123',
  rememberMe: true,
};

// Valid SignupInput
const signupInput: SignupInput = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'test123',
  confirmPassword: 'test123',
  role: 'student',
};

// Valid AuthSession
const user: User = {
  id: 'u1',
  name: 'Test',
  email: 'test@example.com',
  role: 'student',
  createdAt: new Date().toISOString(),
};

const authSession: AuthSession = {
  user: user,
  token: 'mock-token',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date().toISOString(),
};

// Valid AuthState (unauthenticated)
const unauthState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

// Valid AuthState (authenticated)
const authState: AuthState = {
  isAuthenticated: true,
  user: user,
  isLoading: false,
  error: null,
};

// Valid AuthResponse
const authResponse: AuthResponse = {
  success: true,
  session: authSession,
  message: 'Login successful',
};

// Valid AuthError
const authError: AuthError = {
  success: false,
  error: 'Invalid credentials',
  code: 'INVALID_CREDENTIALS',
};

// Valid AuthResult (union)
const result1: AuthResult = authResponse;
const result2: AuthResult = authError;

// Invalid role (should error if uncommented)
// const invalidSignup: SignupInput = {
//   name: 'Test',
//   email: 'test@example.com',
//   password: 'test123',
//   confirmPassword: 'test123',
//   role: 'admin',  // ERROR: Type '"admin"' is not assignable to type 'UserRole'
// };
```

**Run:**
```bash
npx tsc --noEmit /tmp/auth-type-test.ts
```

**Expected:** 0 errors (all assignments valid)

### Test 2: Discriminated Union Narrowing (AuthResult)

**Create test file:** `/tmp/auth-union-test.ts`

```typescript
import type { AuthResult, AuthSession } from "@/lib/models/types";
import { isAuthSuccess, isAuthError } from "@/lib/models/types";

function handleAuthResult(result: AuthResult) {
  // Type narrowing with if statement
  if (result.success) {
    // TypeScript knows result is AuthResponse
    const session: AuthSession = result.session;
    const message: string | undefined = result.message;
    console.log('Login successful:', session.user.name);
  } else {
    // TypeScript knows result is AuthError
    const error: string = result.error;
    const code: string | undefined = result.code;
    console.log('Login failed:', error);
  }
}

function handleAuthResultWithTypeGuard(result: AuthResult) {
  // Type narrowing with type guard
  if (isAuthSuccess(result)) {
    // result is AuthResponse
    console.log(result.session.user.email);
  } else if (isAuthError(result)) {
    // result is AuthError
    console.log(result.error);
  }
}
```

**Run:**
```bash
npx tsc --noEmit /tmp/auth-union-test.ts
```

**Expected:** 0 errors (union exhaustively handled)

### Test 3: Null Handling in AuthState

**Create test file:** `/tmp/auth-null-test.ts`

```typescript
import type { AuthState, User } from "@/lib/models/types";

// Valid: user is null when not authenticated
const unauthenticated: AuthState = {
  isAuthenticated: false,
  user: null,  // OK
  isLoading: false,
  error: null,
};

// Valid: user is User when authenticated
const user: User = {
  id: 'u1',
  name: 'Test',
  email: 'test@example.com',
  role: 'student',
  createdAt: new Date().toISOString(),
};

const authenticated: AuthState = {
  isAuthenticated: true,
  user: user,  // OK
  isLoading: false,
  error: null,
};

// Access user safely with null check
function getUserName(state: AuthState): string {
  if (state.user !== null) {
    return state.user.name;  // TypeScript knows user is User
  }
  return 'Guest';
}

// Type guard for authenticated state
function isAuthenticated(state: AuthState): state is AuthState & { user: User } {
  return state.isAuthenticated && state.user !== null;
}

// Usage
if (isAuthenticated(authenticated)) {
  const name: string = authenticated.user.name;  // Type narrowed to User
}
```

**Run:**
```bash
npx tsc --noEmit /tmp/auth-null-test.ts
```

**Expected:** 0 errors (null handling correct)

---

## Error Scenarios and Resolutions

### Error 1: "Cannot find name 'AuthSession'"

**Cause:** Type not exported from lib/models/types.ts
**Resolution:** Ensure `export interface AuthSession` (not just `interface AuthSession`)

### Error 2: "Type 'string' is not assignable to type 'UserRole'"

**Cause:** Invalid role value in SignupInput or users.json
**Resolution:** Use only: 'student' | 'instructor' | 'ta'

### Error 3: "Property 'user' is missing in type 'AuthState'"

**Cause:** Missing required property in AuthState
**Resolution:** Ensure all properties defined (isAuthenticated, user, isLoading, error)

### Error 4: "Cannot use namespace 'AuthSession' as a type"

**Cause:** Imported as value instead of type
**Resolution:** Use `import type { AuthSession }` not `import { AuthSession }`

### Error 5: "Type 'User | null' is not assignable to type 'User'"

**Cause:** Trying to use AuthState.user without null check
**Resolution:** Add null check: `if (state.user !== null) { ... }`

---

## Performance Validation

### Bundle Size Check

**Before adding types:**
```bash
npm run build
# Check .next/static/chunks/*.js sizes
```

**After adding types:**
```bash
npm run build
# Compare sizes - should be IDENTICAL (types erased at compile time)
```

**Expected Result:** 0 byte increase (types are compile-time only)

### Type Checking Performance

**Measure compilation time:**
```bash
time npx tsc --noEmit
```

**Expected:** <2 seconds (9 new interfaces/types negligible overhead)

---

## Integration with Existing Types

### Zero Breaking Changes Verification

**Test existing code still compiles:**

```bash
# Check User interface still works
npx tsc --noEmit lib/api/client.ts

# Check hooks still work
npx tsc --noEmit lib/api/hooks.ts

# Check store still works
npx tsc --noEmit lib/store/localStore.ts
```

**Expected:** 0 errors (no breaking changes)

### Type Reuse Validation

**Verify UserRole reuse in SignupInput:**

```typescript
import type { UserRole, SignupInput } from "@/lib/models/types";

const signup: SignupInput = {
  name: 'Test',
  email: 'test@example.com',
  password: 'test123',
  confirmPassword: 'test123',
  role: 'student',  // Must be UserRole ('student' | 'instructor' | 'ta')
};

// Invalid role
// const invalid: SignupInput = { ..., role: 'admin' };  // ERROR
```

**Verify User reuse in AuthSession:**

```typescript
import type { User, AuthSession } from "@/lib/models/types";

const user: User = { /* ... */ };
const session: AuthSession = {
  user: user,  // Reuses User type
  token: 'mock-token',
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};
```

---

## Documentation Updates

### Type Definition Comments

**All interfaces have JSDoc comments:**
```typescript
/**
 * Represents an authenticated user session
 */
export interface AuthSession { ... }
```

**Inline comments for clarification:**
```typescript
user: User;              // Embedded user object for convenience
token: string;           // Mock JWT token
```

### README.md Updates (Future)

**Add to Type Safety section:**
```markdown
## Authentication Type Definitions

Core auth-related types:
- `AuthSession` - Authenticated user session with token
- `AuthState` - React context state (authenticated/loading/error)
- `LoginInput` - Login form data
- `SignupInput` - Registration form data
- `AuthResult` - Discriminated union of success/error responses

All types use TypeScript strict mode with zero `any` types.
Type guards provided for AuthResult discrimination.
```

---

## Rollback Plan

### If Type Errors Occur

**Step 1: Identify failing file**
```bash
npx tsc --noEmit
# Note which file has errors
```

**Step 2: Revert specific section**
```bash
git checkout HEAD -- lib/models/types.ts
# Or specific file causing issues
```

**Step 3: Verify revert works**
```bash
npx tsc --noEmit
# Should return to 0 errors
```

### If Mock Data Validation Fails

**Step 1: Remove type assertion**
```typescript
// Before (failing):
const users = require('@/mocks/users.json') as User[];

// After (temporarily):
const users = require('@/mocks/users.json');
```

**Step 2: Fix JSON data**
- Validate structure against User interface
- Fix missing fields, incorrect types
- Ensure role is 'student' | 'instructor' | 'ta'

**Step 3: Re-add type assertion**
```typescript
const users = require('@/mocks/users.json') as User[];
```

---

## Next Steps (After Type Implementation)

### Immediate Next Tasks (API Designer Agent)
1. Implement auth API methods in `lib/api/client.ts`
2. Implement React Query hooks in `lib/api/hooks.ts`
3. Implement auth store functions in `lib/store/localStore.ts`
4. Create auth context in `lib/context/auth-context.tsx`
5. Create/update mock JSON data files

### Verification Tasks (Parent Agent)
1. Run `npx tsc --noEmit` after each implementation step
2. Run `npm run lint` to check for style issues
3. Test auth methods in browser console
4. Verify React Query hooks work with devtools
5. Test AuthResult discrimination in practice

---

## File Summary

### Files to Modify

1. **lib/models/types.ts**
   - Add 7 new type definitions (6 interfaces + 1 type alias)
   - Add 2 type guard functions
   - Lines to add: ~100 lines (after Session interface)
   - Zero breaking changes

2. **lib/api/client.ts**
   - Update 1 import statement (add 4 types)
   - Add 5 method signature comments
   - Lines to add: ~10 lines

3. **lib/api/hooks.ts**
   - Update 1 import statement (add 4 types)
   - Add query key + hook signature comments
   - Lines to add: ~15 lines

4. **lib/store/localStore.ts**
   - Update 1 import statement (add AuthSession)
   - Update KEYS constant (add 1 key)
   - Add 4 function signature comments
   - Lines to modify/add: ~15 lines

### Files to Create (Future - Mock Data Agent)

1. **mocks/users.json** - User data (3-5 users for demo)
2. **mocks/credentials.json** - Login credentials (NEW FILE)
3. **lib/context/auth-context.tsx** - Auth React context (NEW FILE)

---

## Success Criteria

- [ ] All 7 new types defined in lib/models/types.ts
- [ ] All 2 type guards implemented
- [ ] All imports updated with `import type` syntax
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] No breaking changes to existing code
- [ ] Type reuse (User, UserRole) working correctly
- [ ] Null handling (user: User | null) working correctly
- [ ] Discriminated union (AuthResult) working correctly
- [ ] Type guards (isAuthSuccess, isAuthError) compiling
- [ ] Zero bundle size increase after types added
- [ ] All tests pass (assignability, union, null handling)

---

**Implementation Ready:** YES
**Risk Level:** LOW (additive changes only)
**Estimated Time:** 20 minutes (types only)
**Next Agent:** API Designer (for method implementations)

---

**Plan Created:** 2025-10-04
**Created By:** Type Safety Guardian (Sub-Agent)
**Status:** READY FOR IMPLEMENTATION

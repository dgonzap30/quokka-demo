# Authentication API Design Plan

## 1. TypeScript Interfaces

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`

**NEW FILE** - Create with the following type definitions:

```typescript
/**
 * User role in the system
 */
export type UserRole = 'student' | 'instructor' | 'ta';

/**
 * Represents a user account
 */
export interface User {
  id: string;
  email: string;
  password: string;        // WARNING: Mock only! Production uses hashed passwords
  name: string;
  role: UserRole;
  avatar?: string;         // Optional profile image URL
  createdAt: string;
}

/**
 * Active user session
 */
export interface Session {
  userId: string;
  user: User;              // Hydrated user object
  expiresAt: string;       // ISO timestamp
  createdAt: string;       // ISO timestamp
}

/**
 * Login credentials input
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup registration input
 */
export interface SignupInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;         // Optional, defaults to 'student'
}

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_EXISTS'
  | 'USER_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'VALIDATION_ERROR';

/**
 * Authentication error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
}
```

**Type Safety Notes:**
- All interfaces use strict types (no `any`)
- User interface includes password field with clear warning comment
- Session hydrates full user to avoid additional lookups
- AuthError provides typed error codes for programmatic handling
- SignupInput uses optional role (defaults to 'student')

---

## 2. API Methods

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/client.ts`

**NEW FILE** - Create with the following structure:

### Required Imports:

```typescript
import type {
  User,
  Session,
  LoginCredentials,
  SignupInput,
  AuthError,
} from "@/lib/models/types";

import {
  seedData,
  getSession,
  setSession,
  clearSession,
  getUserByEmail,
  getUserById,
  validateCredentials,
  createUser,
  getUsers,
} from "@/lib/store/localStore";
```

### Delay Helper:

```typescript
/**
 * Simulates network delay for mock API
 */
function delay(ms?: number): Promise<void> {
  const baseDelay = ms ?? 200 + Math.random() * 300; // Default 200-500ms
  return new Promise((resolve) => setTimeout(resolve, baseDelay));
}

/**
 * Generates unique ID with prefix
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### API Object:

```typescript
/**
 * Mock API client for authentication
 *
 * WARNING: This is a mock implementation for frontend-only demos.
 * Production must use:
 * - bcrypt/argon2 for password hashing
 * - JWT tokens for sessions
 * - HTTPS only
 * - HTTP-only cookies
 * - CSRF protection
 */
export const api = {
  /**
   * Login with email and password
   *
   * @param credentials - User email and password
   * @returns Session object with hydrated user
   * @throws AuthError if credentials invalid
   */
  async login(credentials: LoginCredentials): Promise<Session> {
    await delay(300 + Math.random() * 200); // 300-500ms

    seedData(); // Ensure data is seeded

    const user = validateCredentials(credentials.email, credentials.password);

    if (!user) {
      const error: AuthError = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };
      throw new Error(JSON.stringify(error));
    }

    // Create session (7 days expiry for mock)
    const session: Session = {
      userId: user.id,
      user: {
        ...user,
        password: '', // Never expose password in session
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setSession(session);
    return session;
  },

  /**
   * Register new user account
   *
   * @param input - Signup details
   * @returns Session object with new user
   * @throws AuthError if email already exists
   */
  async signup(input: SignupInput): Promise<Session> {
    await delay(400 + Math.random() * 200); // 400-600ms

    seedData(); // Ensure data is seeded

    // Check if user exists
    const existingUser = getUserByEmail(input.email);
    if (existingUser) {
      const error: AuthError = {
        code: 'USER_EXISTS',
        message: 'An account with this email already exists',
      };
      throw new Error(JSON.stringify(error));
    }

    // Validate email format
    if (!input.email.includes('@')) {
      const error: AuthError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      };
      throw new Error(JSON.stringify(error));
    }

    // Validate password length
    if (input.password.length < 6) {
      const error: AuthError = {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters',
      };
      throw new Error(JSON.stringify(error));
    }

    // Create new user
    const newUser = createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role || 'student',
    });

    // Create session
    const session: Session = {
      userId: newUser.id,
      user: {
        ...newUser,
        password: '', // Never expose password
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setSession(session);
    return session;
  },

  /**
   * Logout current user
   *
   * @returns void
   */
  async logout(): Promise<void> {
    await delay(50 + Math.random() * 50); // 50-100ms (quick action)

    clearSession();
  },

  /**
   * Get current authenticated user
   *
   * @returns User object or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(200 + Math.random() * 200); // 200-400ms

    seedData(); // Ensure data is seeded

    const session = getSession();

    if (!session) {
      return null;
    }

    // Validate session not expired
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }

    // Re-fetch user to get latest data
    const user = getUserById(session.userId);

    if (!user) {
      clearSession();
      return null;
    }

    // Never return password
    return {
      ...user,
      password: '',
    };
  },

  /**
   * Validate current session
   *
   * @returns true if session valid, false otherwise
   */
  async validateSession(): Promise<boolean> {
    await delay(100 + Math.random() * 100); // 100-200ms

    const session = getSession();

    if (!session) {
      return false;
    }

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return false;
    }

    // Verify user still exists
    const user = getUserById(session.userId);
    if (!user) {
      clearSession();
      return false;
    }

    return true;
  },
};
```

### Network Delay Summary:

| Method | Delay | Rationale |
|--------|-------|-----------|
| `login()` | 300-500ms | Network + auth validation |
| `signup()` | 400-600ms | Network + DB write simulation |
| `logout()` | 50-100ms | Quick local action |
| `getCurrentUser()` | 200-400ms | Standard fetch |
| `validateSession()` | 100-200ms | Quick validation check |

### Error Handling:

All errors throw `Error` with JSON-stringified `AuthError` object:
```typescript
const error: AuthError = { code: 'INVALID_CREDENTIALS', message: '...' };
throw new Error(JSON.stringify(error));
```

React Query hooks parse error:
```typescript
onError: (error) => {
  try {
    const authError: AuthError = JSON.parse(error.message);
    toast.error(authError.message);
  } catch {
    toast.error('An error occurred');
  }
}
```

---

## 3. React Query Hooks

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts`

**NEW FILE** - Create with the following structure:

### Required Imports:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type { User, Session, LoginCredentials, SignupInput } from '@/lib/models/types';
import { api } from '@/lib/api/client';
```

### Query Keys:

```typescript
/**
 * Centralized query keys for React Query
 */
export const queryKeys = {
  currentUser: ['currentUser'] as const,
  session: ['session'] as const,
} as const;
```

### Hooks:

```typescript
/**
 * Fetch current authenticated user
 *
 * Returns null if not authenticated
 * Automatically validates session expiry
 */
export function useCurrentUser(): UseQueryResult<User | null, Error> {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    retry: false, // Don't retry auth failures
    staleTime: 0, // Always fetch fresh (session state critical)
  });
}

/**
 * Login mutation
 *
 * Invalidates currentUser query on success
 */
export function useLogin(): UseMutationResult<Session, Error, LoginCredentials> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => api.login(credentials),
    onSuccess: (session) => {
      // Update currentUser cache immediately
      queryClient.setQueryData(queryKeys.currentUser, session.user);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

/**
 * Signup mutation
 *
 * Creates new user and auto-login
 */
export function useSignup(): UseMutationResult<Session, Error, SignupInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => api.signup(input),
    onSuccess: (session) => {
      // Update currentUser cache immediately
      queryClient.setQueryData(queryKeys.currentUser, session.user);

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
}

/**
 * Logout mutation
 *
 * Clears all cached data on success
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear all query cache (prevent stale data leakage)
      queryClient.clear();

      // Explicitly set currentUser to null
      queryClient.setQueryData(queryKeys.currentUser, null);
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });
}

/**
 * Validate session mutation
 *
 * Checks if current session is still valid
 */
export function useValidateSession(): UseMutationResult<boolean, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.validateSession(),
    onSuccess: (isValid) => {
      if (!isValid) {
        // Session expired, clear cache
        queryClient.clear();
        queryClient.setQueryData(queryKeys.currentUser, null);
      }
    },
  });
}

/**
 * Combined auth state hook
 *
 * Provides user, isAuthenticated, isLoading in single object
 */
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}
```

### Hook Usage Examples:

```typescript
// Check auth state
const { user, isAuthenticated, isLoading } = useAuth();

// Login
const login = useLogin();
login.mutate({ email: 'student@demo.com', password: 'demo123' });

// Signup
const signup = useSignup();
signup.mutate({
  email: 'new@test.com',
  password: 'password123',
  name: 'New User',
});

// Logout
const logout = useLogout();
logout.mutate();

// Validate session
const validate = useValidateSession();
validate.mutate();
```

### Invalidation Strategy:

| Action | Invalidates | Rationale |
|--------|-------------|-----------|
| Login success | `currentUser`, `session` | Update auth state |
| Signup success | `currentUser`, `session` | Update auth state |
| Logout | **ALL queries** (clear cache) | Prevent data leakage |
| Session invalid | **ALL queries** (clear cache) | Force re-auth |

---

## 4. Local Store Functions

### Location: `/Users/dgz/projects-professional/quokka/quokka-demo/lib/store/localStore.ts`

**NEW FILE** - Create with the following structure:

### Required Imports:

```typescript
import type { User, Session, SignupInput, UserRole } from '@/lib/models/types';
import usersData from '@/mocks/users.json';
```

### Storage Keys:

```typescript
/**
 * localStorage keys for QuokkaQ data
 */
const KEYS = {
  users: "quokkaq.users",
  session: "quokkaq.session",
  initialized: "quokkaq.initialized",
} as const;
```

### Helper Functions:

```typescript
/**
 * Generic localStorage loader
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Generic localStorage saver
 */
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/**
 * Seed initial data from JSON files
 */
export function seedData(): void {
  const initialized = loadFromStorage(KEYS.initialized, false);

  if (!initialized) {
    // Load users from JSON
    const users = usersData as User[];

    saveToStorage(KEYS.users, users);
    saveToStorage(KEYS.initialized, true);

    console.log('✅ QuokkaQ data seeded');
  }
}

/**
 * Get all users
 */
export function getUsers(): User[] {
  return loadFromStorage<User[]>(KEYS.users, []);
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Validate credentials
 *
 * WARNING: Mock implementation only!
 * Production must use bcrypt/argon2 password hashing
 */
export function validateCredentials(email: string, password: string): User | null {
  const user = getUserByEmail(email);

  if (!user) return null;

  // Mock password check (plain text - NOT SECURE)
  if (user.password !== password) return null;

  return user;
}

/**
 * Create new user
 */
export function createUser(input: SignupInput & { password: string }): User {
  const users = getUsers();

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: input.email,
    password: input.password, // WARNING: Plain text (mock only)
    name: input.name,
    role: input.role || 'student',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.email}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveToStorage(KEYS.users, users);

  return newUser;
}

/**
 * Get current session
 */
export function getSession(): Session | null {
  const session = loadFromStorage<Session | null>(KEYS.session, null);

  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    clearSession();
    return null;
  }

  return session;
}

/**
 * Set session
 */
export function setSession(session: Session): void {
  saveToStorage(KEYS.session, session);
}

/**
 * Clear session (logout)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(KEYS.session);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}
```

### Storage Flow:

1. **On First Load:**
   - `seedData()` loads users from `mocks/users.json`
   - Stores in `localStorage` with key `quokkaq.users`
   - Sets `quokkaq.initialized = true`

2. **On Login:**
   - `validateCredentials()` checks email/password
   - `setSession()` stores session with 7-day expiry
   - Session persists across page reloads

3. **On Page Reload:**
   - `getSession()` loads session from localStorage
   - Validates expiry automatically
   - Returns null if expired (auto-logout)

4. **On Logout:**
   - `clearSession()` removes session from localStorage
   - React Query clears all cached data

---

## 5. Mock Data Structure

### File: `/Users/dgz/projects-professional/quokka/quokka-demo/mocks/users.json`

**NEW FILE** - Create with the following data:

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
  },
  {
    "id": "user-1",
    "email": "alice@example.com",
    "password": "demo123",
    "name": "Alice Johnson",
    "role": "student",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user-1",
    "createdAt": "2025-08-21T14:30:00Z"
  },
  {
    "id": "user-2",
    "email": "bob@example.com",
    "password": "demo123",
    "name": "Bob Williams",
    "role": "student",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user-2",
    "createdAt": "2025-08-22T09:15:00Z"
  },
  {
    "id": "user-3",
    "email": "carol@example.com",
    "password": "demo123",
    "name": "Carol Davis",
    "role": "instructor",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user-3",
    "createdAt": "2025-08-16T11:00:00Z"
  },
  {
    "id": "user-4",
    "email": "david@example.com",
    "password": "demo123",
    "name": "David Brown",
    "role": "ta",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user-4",
    "createdAt": "2025-08-19T13:45:00Z"
  },
  {
    "id": "user-5",
    "email": "emma@example.com",
    "password": "demo123",
    "name": "Emma Wilson",
    "role": "student",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user-5",
    "createdAt": "2025-08-23T08:20:00Z"
  }
]
```

**Data Strategy:**
- **3 demo accounts** - Easy to remember credentials
- **5 additional users** - Realistic user base
- **All use "demo123"** - Single password for simplicity
- **Deterministic avatars** - DiceBear with seed ensures consistency
- **Role distribution:**
  - 5 students
  - 2 instructors
  - 1 TA

**Avatar URLs:**
- Service: DiceBear Avataaars style (cartoon avatars)
- Format: `https://api.dicebear.com/7.x/avataaars/svg?seed={userId}`
- Deterministic: Same seed = same avatar
- No external dependencies (SVG generated on-demand)

---

## 6. Implementation Checklist

### Phase 1: Types & Data Model (15 min)
- [ ] Create `lib/models/types.ts`
- [ ] Add UserRole type
- [ ] Add User interface (with password warning)
- [ ] Add Session interface
- [ ] Add LoginCredentials interface
- [ ] Add SignupInput interface
- [ ] Add AuthErrorCode type
- [ ] Add AuthError interface
- [ ] Run `npx tsc --noEmit` → 0 errors

### Phase 2: Mock Data (10 min)
- [ ] Create `mocks/users.json`
- [ ] Add 3 demo accounts (student, instructor, TA)
- [ ] Add 5 additional test users
- [ ] Verify JSON structure matches User interface
- [ ] Test DiceBear avatar URLs work

### Phase 3: Local Store (30 min)
- [ ] Create `lib/store/localStore.ts`
- [ ] Add KEYS constant
- [ ] Add loadFromStorage/saveToStorage helpers
- [ ] Add seedData() function
- [ ] Add getUsers() function
- [ ] Add getUserById() function
- [ ] Add getUserByEmail() function
- [ ] Add validateCredentials() function
- [ ] Add createUser() function
- [ ] Add getSession() function
- [ ] Add setSession() function
- [ ] Add clearSession() function
- [ ] Run `npx tsc --noEmit` → 0 errors

### Phase 4: API Client (30 min)
- [ ] Create `lib/api/client.ts`
- [ ] Add delay() helper
- [ ] Add generateId() helper
- [ ] Add login() method
- [ ] Add signup() method
- [ ] Add logout() method
- [ ] Add getCurrentUser() method
- [ ] Add validateSession() method
- [ ] Add error handling for all methods
- [ ] Run `npx tsc --noEmit` → 0 errors

### Phase 5: React Query Hooks (30 min)
- [ ] Create `lib/api/hooks.ts`
- [ ] Add queryKeys object
- [ ] Add useCurrentUser() hook
- [ ] Add useLogin() hook
- [ ] Add useSignup() hook
- [ ] Add useLogout() hook
- [ ] Add useValidateSession() hook
- [ ] Add useAuth() combined hook
- [ ] Run `npx tsc --noEmit` → 0 errors
- [ ] Run `npm run lint` → 0 errors

### Phase 6: Manual Testing (30 min)
- [ ] Test login with demo-student-1
- [ ] Test login with wrong password
- [ ] Test signup new user
- [ ] Test signup with existing email
- [ ] Test getCurrentUser() when logged in
- [ ] Test getCurrentUser() when logged out
- [ ] Test logout clears session
- [ ] Test session persists on page reload
- [ ] Test session expiry (manual date change)
- [ ] Verify localStorage data structure

---

## 7. Test Scenarios

### Scenario 1: Demo Login (Happy Path)
```typescript
// In browser console after React Query setup:
const { mutate: login } = useLogin();

login({ email: 'student@demo.com', password: 'demo123' }, {
  onSuccess: (session) => {
    console.log('✅ Logged in:', session.user);
  }
});

// Expected:
// - Session created in localStorage
// - currentUser query updated
// - session.user.email === 'student@demo.com'
// - session.user.password === '' (not exposed)
```

### Scenario 2: Invalid Credentials
```typescript
const { mutate: login } = useLogin();

login({ email: 'student@demo.com', password: 'wrong' }, {
  onError: (error) => {
    const authError = JSON.parse(error.message);
    console.log('❌ Login failed:', authError);
  }
});

// Expected:
// - Error thrown
// - authError.code === 'INVALID_CREDENTIALS'
// - authError.message === 'Invalid email or password'
// - No session created
```

### Scenario 3: Signup New User
```typescript
const { mutate: signup } = useSignup();

signup({
  email: 'newuser@test.com',
  password: 'password123',
  name: 'New User',
}, {
  onSuccess: (session) => {
    console.log('✅ Signed up:', session.user);
  }
});

// Expected:
// - New user created in users array
// - User added to localStorage
// - Session created automatically
// - currentUser query updated
// - avatar URL generated from email
```

### Scenario 4: Email Already Exists
```typescript
const { mutate: signup } = useSignup();

signup({
  email: 'student@demo.com', // Existing email
  password: 'test',
  name: 'Test',
}, {
  onError: (error) => {
    const authError = JSON.parse(error.message);
    console.log('❌ Signup failed:', authError);
  }
});

// Expected:
// - Error thrown
// - authError.code === 'USER_EXISTS'
// - authError.message === 'An account with this email already exists'
// - No user created
```

### Scenario 5: Session Persistence
```typescript
// Step 1: Login
const { mutate: login } = useLogin();
login({ email: 'student@demo.com', password: 'demo123' });

// Step 2: Reload page
window.location.reload();

// Step 3: Check auth state
const { user, isAuthenticated } = useAuth();
console.log('User:', user);
console.log('Authenticated:', isAuthenticated);

// Expected:
// - user !== null (session persisted)
// - isAuthenticated === true
// - user.email === 'student@demo.com'
```

### Scenario 6: Session Expiry
```typescript
// Step 1: Login
login({ email: 'student@demo.com', password: 'demo123' });

// Step 2: Manually expire session in localStorage
const session = JSON.parse(localStorage.getItem('quokkaq.session'));
session.expiresAt = new Date('2020-01-01').toISOString();
localStorage.setItem('quokkaq.session', JSON.stringify(session));

// Step 3: Validate session
const { mutate: validate } = useValidateSession();
validate(undefined, {
  onSuccess: (isValid) => {
    console.log('Session valid:', isValid);
  }
});

// Expected:
// - isValid === false
// - Session cleared from localStorage
// - currentUser set to null
// - All queries invalidated
```

### Scenario 7: Logout
```typescript
const { mutate: logout } = useLogout();

logout(undefined, {
  onSuccess: () => {
    console.log('✅ Logged out');
  }
});

// Expected:
// - Session removed from localStorage
// - All React Query cache cleared
// - currentUser === null
// - isAuthenticated === false
```

### Scenario 8: Protected Route Pattern
```typescript
function ProtectedPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  return <div>Welcome, {user.name}!</div>;
}

// Expected behavior:
// - Shows loading while fetching user
// - Redirects to /login if not authenticated
// - Shows page content if authenticated
```

---

## 8. Backend Integration Guide

### Environment Variables (Future)

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.quokkaq.com
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
```

### API Endpoint Mapping

| Mock Method | Future Endpoint | HTTP Method | Auth Required |
|-------------|-----------------|-------------|---------------|
| `login()` | `/api/auth/login` | POST | No |
| `signup()` | `/api/auth/signup` | POST | No |
| `logout()` | `/api/auth/logout` | POST | Yes |
| `getCurrentUser()` | `/api/auth/me` | GET | Yes |
| `validateSession()` | `/api/auth/validate` | POST | Yes |

### Migration Steps

#### Step 1: Add Environment Detection

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IS_MOCK = !API_URL || API_URL === 'mock';

export const api = {
  async login(credentials: LoginCredentials): Promise<Session> {
    if (IS_MOCK) {
      // ... existing mock logic
    } else {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }

      const { token, user } = await res.json();

      // Store JWT token
      localStorage.setItem('auth_token', token);

      return { userId: user.id, user, expiresAt: '', createdAt: '' };
    }
  },
  // ... other methods
};
```

#### Step 2: Add JWT Token Management

```typescript
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async getCurrentUser(): Promise<User | null> {
  if (IS_MOCK) {
    // ... existing mock logic
  } else {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return null;

    return res.json();
  }
}
```

#### Step 3: Add Refresh Token Logic

```typescript
async function refreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    // Refresh failed, logout
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    return null;
  }

  const { token } = await res.json();
  localStorage.setItem('auth_token', token);
  return token;
}
```

#### Step 4: Add Interceptor for Expired Tokens

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders(),
    },
  });

  // If 401, try to refresh token
  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      // Retry with new token
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return res;
}
```

### Security Checklist (Production)

- [ ] Use HTTPS only
- [ ] Hash passwords with bcrypt/argon2 (backend)
- [ ] Store JWT in HTTP-only cookies (not localStorage)
- [ ] Implement CSRF protection
- [ ] Add rate limiting (prevent brute force)
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add account lockout after N failed attempts
- [ ] Add multi-factor authentication (optional)
- [ ] Add session management (revoke tokens)
- [ ] Add audit logging (login attempts, IP tracking)
- [ ] Validate email format server-side
- [ ] Enforce password complexity rules
- [ ] Add captcha for signup/login
- [ ] Implement OAuth2 (Google, Microsoft)

---

## 9. Performance Considerations

### Bundle Size Impact
- Types: ~1KB (Session, LoginCredentials, SignupInput, AuthError)
- API methods: ~3KB (5 methods with error handling)
- Hooks: ~2KB (6 hooks)
- LocalStore: ~2KB (storage helpers)
- Mock data: ~5KB (8 users)
- **Total: ~13KB** (minimal impact, well under 200KB route limit)

### Cache Strategy

| Query | Stale Time | Refetch Interval | Rationale |
|-------|-----------|------------------|-----------|
| `currentUser` | 0 | - | Always fresh (critical auth state) |
| `session` | 5 min | - | Balance UX/security |

**Cache Invalidation:**
- Login/Signup → Invalidate `currentUser`, `session`
- Logout → **Clear entire cache** (prevent data leakage)
- Session expired → **Clear entire cache**, set `currentUser` to null

### Optimization Opportunities

#### 1. Prefetch User on App Load
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  useEffect(() => {
    // Prefetch currentUser to reduce login screen flicker
    queryClient.prefetchQuery({
      queryKey: queryKeys.currentUser,
      queryFn: () => api.getCurrentUser(),
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### 2. Optimistic Login
```typescript
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.login,
    onMutate: async (credentials) => {
      // Optimistically assume success
      // (requires knowing user data beforehand - not ideal for real auth)
    },
    onSuccess: (session) => {
      // Immediately update cache
      queryClient.setQueryData(queryKeys.currentUser, session.user);
    },
  });
}
```

#### 3. Session Validation on Route Change
```typescript
// app/layout.tsx or middleware
useEffect(() => {
  const handleRouteChange = () => {
    api.validateSession().then((isValid) => {
      if (!isValid) {
        queryClient.clear();
        redirect('/login');
      }
    });
  };

  router.events.on('routeChangeComplete', handleRouteChange);
  return () => router.events.off('routeChangeComplete', handleRouteChange);
}, []);
```

---

## 10. Accessibility & UX Notes

### Focus Management
- Login form: Auto-focus email input on mount
- Error messages: Announce with `aria-live="polite"`
- Success messages: Announce with `aria-live="polite"`

### Screen Reader Support
```tsx
<form onSubmit={handleLogin} aria-label="Login form">
  <div>
    <label htmlFor="email">Email</label>
    <input
      id="email"
      type="email"
      autoComplete="email"
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? 'email-error' : undefined}
    />
    {errors.email && (
      <p id="email-error" role="alert">
        {errors.email}
      </p>
    )}
  </div>
</form>
```

### Loading States
```tsx
<Button type="submit" disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2" aria-hidden="true" />
      Logging in...
    </>
  ) : (
    'Log In'
  )}
</Button>
```

### Error Handling
```tsx
{loginError && (
  <Alert variant="destructive" role="alert">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Login Failed</AlertTitle>
    <AlertDescription>
      {loginError.message}
    </AlertDescription>
  </Alert>
)}
```

---

## Files Summary

### New Files to Create:

1. **`lib/models/types.ts`**
   - User, Session, LoginCredentials, SignupInput, AuthError types
   - ~80 lines

2. **`lib/api/client.ts`**
   - API methods: login, signup, logout, getCurrentUser, validateSession
   - ~200 lines

3. **`lib/api/hooks.ts`**
   - React Query hooks: useCurrentUser, useLogin, useSignup, useLogout, useValidateSession, useAuth
   - ~150 lines

4. **`lib/store/localStore.ts`**
   - Storage helpers: seedData, getSession, setSession, clearSession, validateCredentials, createUser
   - ~200 lines

5. **`mocks/users.json`**
   - 8 demo/test users
   - ~50 lines JSON

### Files to Modify:
- None (all new files)

---

## Success Criteria

- [ ] All types defined in `lib/models/types.ts`
- [ ] All API methods implemented in `lib/api/client.ts`
- [ ] All hooks implemented in `lib/api/hooks.ts`
- [ ] All storage helpers implemented in `lib/store/localStore.ts`
- [ ] Mock users seeded in `mocks/users.json`
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `npm run lint` returns 0 errors
- [ ] Can login with demo-student-1@demo.com / demo123
- [ ] Can signup new user
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Invalid credentials show error
- [ ] Email already exists shows error
- [ ] Session expiry auto-logs out

---

**Implementation Time Estimate:** 2-3 hours total
**Risk Level:** LOW - All changes are new files, zero breaking changes
**Backend Ready:** YES - Clean abstraction, easy to swap with real API

---

**Plan Created:** 2025-10-04
**Created By:** API Designer (Sub-Agent)
**Status:** READY FOR IMPLEMENTATION

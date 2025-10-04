import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  AuthError,
} from "@/lib/models/types";

import {
  seedData,
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  getUserByEmail,
  validateCredentials,
  createUser,
} from "@/lib/store/localStore";

// ============================================
// Helper Functions
// ============================================

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

// ============================================
// API Client
// ============================================

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
   */
  async login(input: LoginInput): Promise<AuthResult> {
    await delay(300 + Math.random() * 200); // 300-500ms

    seedData(); // Ensure data is seeded

    const user = validateCredentials(input.email, input.password);

    if (!user) {
      const error: AuthError = {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
      return error;
    }

    // Create session (7 days expiry for mock)
    const session: AuthSession = {
      user: {
        ...user,
        password: "", // Never expose password in session
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Login successful",
    };
  },

  /**
   * Register new user account
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    await delay(400 + Math.random() * 200); // 400-600ms

    seedData(); // Ensure data is seeded

    // Check if user exists
    const existingUser = getUserByEmail(input.email);
    if (existingUser) {
      const error: AuthError = {
        success: false,
        error: "Email already registered",
        code: "USER_EXISTS",
      };
      return error;
    }

    // Validate passwords match
    if (input.password !== input.confirmPassword) {
      const error: AuthError = {
        success: false,
        error: "Passwords do not match",
        code: "VALIDATION_ERROR",
      };
      return error;
    }

    // Create new user
    const newUser: User = {
      id: generateId("user"),
      name: input.name,
      email: input.email,
      password: input.password, // Mock only - would hash in production
      role: input.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`,
      createdAt: new Date().toISOString(),
    };

    createUser(newUser);

    // Create session
    const session: AuthSession = {
      user: {
        ...newUser,
        password: "", // Never expose password
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Account created successfully",
    };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await delay(50 + Math.random() * 50); // 50-100ms
    clearAuthSession();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(200 + Math.random() * 200); // 200-400ms

    const session = getAuthSession();
    if (!session) return null;

    return session.user;
  },

  /**
   * Restore session from localStorage
   */
  async restoreSession(): Promise<AuthSession | null> {
    await delay(100 + Math.random() * 100); // 100-200ms

    return getAuthSession();
  },
};

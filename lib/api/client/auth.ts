// ============================================
// Authentication API Module
// ============================================
//
// Handles user authentication, registration, and session management.
// Supports both backend (HTTP) and fallback (localStorage) modes via feature flags.

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

import { delay, generateId } from "./utils";
import { BACKEND_FEATURE_FLAGS } from "@/lib/config/backend";
import { httpPost, httpGet } from "./http.client";

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Login with email and password (or email-only for dev-login)
   *
   * @param input - Login credentials
   * @returns AuthResult with session if successful
   *
   * @example
   * ```ts
   * const result = await authAPI.login({
   *   email: "student@demo.com",
   *   password: "password123" // optional for dev-login
   * });
   * ```
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.auth) {
      try {
        // Call backend dev-login endpoint (email-only)
        const response = await httpPost<{ user: User; message: string }>(
          '/api/v1/auth/dev-login',
          { email: input.email }
        );

        // Backend sets cookie automatically, we just store user in session for UI
        const session: AuthSession = {
          user: response.user,
          token: '', // Not needed with cookies
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };

        // Store in localStorage for UI consistency (not for auth)
        setAuthSession(session);

        return {
          success: true,
          session,
          message: response.message,
        };
      } catch (error) {
        console.error('[Auth] Backend login failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
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
   *
   * @param input - Signup information
   * @returns AuthResult with session if successful
   *
   * @example
   * ```ts
   * const result = await authAPI.signup({
   *   name: "Alice Smith",
   *   email: "alice@example.com",
   *   password: "password123",
   *   confirmPassword: "password123",
   *   role: "student"
   * });
   * ```
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
   *
   * Clears the current session from localStorage and backend cookie
   */
  async logout(): Promise<void> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.auth) {
      try {
        // Call backend logout endpoint
        await httpPost('/api/v1/auth/logout', {});
        // Continue to clear local session even if backend fails
      } catch (error) {
        console.error('[Auth] Backend logout failed:', error);
        // Continue to clear local session
      }
    }

    // Always clear localStorage (fallback or cleanup)
    await delay(50 + Math.random() * 50); // 50-100ms
    clearAuthSession();
  },

  /**
   * Get current authenticated user
   *
   * @returns User object if authenticated, null otherwise
   *
   * @example
   * ```ts
   * const user = await authAPI.getCurrentUser();
   * if (user) {
   *   console.log(`Logged in as ${user.name}`);
   * }
   * ```
   */
  async getCurrentUser(): Promise<User | null> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.auth) {
      try {
        // Call backend /me endpoint
        const user = await httpGet<User>('/api/v1/auth/me');

        // Store in localStorage for UI consistency
        const session: AuthSession = {
          user,
          token: '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        setAuthSession(session);

        return user;
      } catch (error) {
        // 401 is expected when not authenticated - don't log as error
        if (error instanceof Error && error.message.includes('Not authenticated')) {
          return null;
        }
        // Log other errors (network failures, 500s, etc.)
        console.error('[Auth] Backend getCurrentUser failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(200 + Math.random() * 200); // 200-400ms

    const session = getAuthSession();
    if (!session) return null;

    return session.user;
  },

  /**
   * Restore session from localStorage
   *
   * @returns AuthSession if valid session exists, null otherwise
   *
   * @example
   * ```ts
   * const session = await authAPI.restoreSession();
   * if (session) {
   *   console.log(`Welcome back, ${session.user.name}`);
   * }
   * ```
   */
  async restoreSession(): Promise<AuthSession | null> {
    await delay(100 + Math.random() * 100); // 100-200ms

    return getAuthSession();
  },
};

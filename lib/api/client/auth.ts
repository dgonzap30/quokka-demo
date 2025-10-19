// ============================================
// Authentication API Module
// ============================================
//
// Handles user authentication, registration, and session management.
// WARNING: This is a mock implementation for frontend-only demos.

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

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Login with email and password
   *
   * @param input - Login credentials
   * @returns AuthResult with session if successful
   *
   * @example
   * ```ts
   * const result = await authAPI.login({
   *   email: "alice@example.com",
   *   password: "password123"
   * });
   * ```
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
   * Clears the current session from localStorage
   */
  async logout(): Promise<void> {
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

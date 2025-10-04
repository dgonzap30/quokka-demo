// ============================================
// Core User Types
// ============================================

export type UserRole = "student" | "instructor" | "ta";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;        // WARNING: Mock only! Production uses hashed passwords on backend
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

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

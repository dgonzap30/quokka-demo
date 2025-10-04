import type { User, AuthSession } from "@/lib/models/types";

const KEYS = {
  users: "quokkaq.users",
  authSession: "quokkaq.authSession",
  initialized: "quokkaq.initialized",
} as const;

// ============================================
// Initialization & Seeding
// ============================================

/**
 * Seed initial data from JSON files (runs once per browser)
 */
export function seedData(): void {
  if (typeof window === "undefined") return; // SSR guard

  const initialized = localStorage.getItem(KEYS.initialized);
  if (initialized) return; // Already seeded

  try {
    const users = require("@/mocks/users.json") as User[];
    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.initialized, "true");
  } catch (error) {
    console.error("Failed to seed data:", error);
  }
}

// ============================================
// User Data Access
// ============================================

/**
 * Get all users from localStorage
 */
export function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.users);
  if (!data) return [];

  try {
    return JSON.parse(data) as User[];
  } catch {
    return [];
  }
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find((u) => u.email === email) ?? null;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find((u) => u.id === id) ?? null;
}

/**
 * Validate credentials (mock password check)
 * WARNING: Production must use bcrypt/argon2 on backend
 */
export function validateCredentials(email: string, password: string): User | null {
  const user = getUserByEmail(email);
  if (!user) return null;

  // Plain text comparison for mock only
  if (user.password === password) {
    return user;
  }

  return null;
}

/**
 * Create new user
 */
export function createUser(user: User): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

// ============================================
// Session Management
// ============================================

/**
 * Get current auth session
 */
export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(KEYS.authSession);
  if (!data) return null;

  try {
    const session = JSON.parse(data) as AuthSession;

    // Validate expiry
    if (new Date(session.expiresAt) < new Date()) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Set auth session
 */
export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.authSession, JSON.stringify(session));
}

/**
 * Clear auth session
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.authSession);
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(session: AuthSession): boolean {
  return new Date(session.expiresAt) > new Date();
}

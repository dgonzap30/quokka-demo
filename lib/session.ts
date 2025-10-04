import type { Session, UserRole } from "@/lib/models/types";

const SESSION_KEY = "quokkaq.session";

/**
 * Hardcoded test accounts for demo
 */
export const TEST_ACCOUNTS = {
  student: {
    id: "demo-student-1",
    email: "student@demo.local",
    name: "Alex Student",
    role: "student" as UserRole,
  },
  instructor: {
    id: "demo-instructor-1",
    email: "instructor@demo.local",
    name: "Dr. Rivera",
    role: "instructor" as UserRole,
  },
};

/**
 * Get current session from localStorage
 */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Session;
  } catch (error) {
    console.error("Failed to parse session:", error);
    return null;
  }
}

/**
 * Set session in localStorage
 */
export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

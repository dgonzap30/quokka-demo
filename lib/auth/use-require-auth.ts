"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import type { User, UserRole } from "@/lib/models/types";

/**
 * Auth protection hook
 *
 * Redirects to /login if not authenticated
 * Redirects to appropriate dashboard if role not allowed
 *
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns User if authorized, null during loading
 *
 * @example
 * ```tsx
 * // Protect student-only route
 * const user = useRequireAuth(['student']);
 * if (!user) return null; // Loading or redirecting
 * ```
 */
export function useRequireAuth(allowedRoles?: UserRole[]): User | null {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // If roles specified, check if user's role is allowed
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on user's role
        if (user.role === "student") {
          router.push("/student");
        } else if (user.role === "instructor" || user.role === "ta") {
          router.push("/instructor");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  // Return null during loading or redirect
  if (isLoading || !user) {
    return null;
  }

  // Return user if authorized
  return user;
}

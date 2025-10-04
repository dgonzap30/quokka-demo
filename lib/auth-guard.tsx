"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import type { UserRole } from "@/lib/models/types";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

/**
 * AuthGuard component that protects routes requiring authentication
 * Redirects to /auth if not authenticated
 * Optionally checks for required role(s)
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    // No session, redirect to auth
    if (!session) {
      router.push("/auth");
      return;
    }

    // Check role if required
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(session.role)) {
        // Wrong role, redirect to correct home
        if (session.role === "student") {
          router.push("/student/threads");
        } else {
          router.push("/instructor/dashboard");
        }
      }
    }
  }, [router, requiredRole]);

  // Check session on client side
  const session = getSession();
  if (!session) {
    return null; // Will redirect via useEffect
  }

  // Check role if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(session.role)) {
      return null; // Will redirect via useEffect
    }
  }

  return <>{children}</>;
}

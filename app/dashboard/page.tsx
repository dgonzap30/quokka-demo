"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard Router - Redirects to role-specific dashboard
 *
 * Routes:
 * - Student → /student
 * - Instructor/TA → /instructor
 * - Not authenticated → /login
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "student") {
        router.push("/student");
      } else if (user.role === "instructor" || user.role === "ta") {
        router.push("/instructor");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
        <p className="text-base text-foreground glass-text font-medium">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}

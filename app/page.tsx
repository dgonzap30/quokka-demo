"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.push("/auth");
      return;
    }

    // Redirect to courses (course-centric architecture)
    router.push("/courses");
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🦘</div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

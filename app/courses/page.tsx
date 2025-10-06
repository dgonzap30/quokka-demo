"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Courses page redirects to dashboard
 * Dashboard displays courses inline, so this page is redundant
 */
export default function CoursesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}

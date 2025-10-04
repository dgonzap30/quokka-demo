"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";

export default function Home() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="container-narrow">
        <div className="text-center space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="hero-title">
              QuokkaQ
            </h1>
            <p className="hero-subtitle">
              Your AI-Powered Academic Q&A Platform
            </p>
          </div>

          {/* Loading Indicator */}
          <div className="flex justify-center">
            <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
              <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
              <p className="text-base text-foreground glass-text font-medium">
                Loading your experience...
              </p>
            </div>
          </div>

          {/* Optional: Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-[var(--border-glass)]">
            <div className="text-center space-y-2">
              <div className="text-4xl">📚</div>
              <p className="text-sm font-semibold">Course Discussions</p>
              <p className="text-xs text-muted-foreground">Browse threads by course</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl">🤖</div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-xs text-muted-foreground">Get instant help</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl">💬</div>
              <p className="text-sm font-semibold">Peer Support</p>
              <p className="text-xs text-muted-foreground">Learn together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

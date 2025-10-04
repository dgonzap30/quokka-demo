"use client";

import { useState } from "react";
import { useThreads } from "@/lib/api/hooks";
import { AuthGuard } from "@/lib/auth-guard";
import { NavHeader } from "@/components/nav-header";
import { ThreadCard } from "@/components/thread-card";
import { FloatingAskButton } from "@/components/floating-ask-button";
import { AskQuestionModal } from "@/components/ask-question-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter } from "lucide-react";

type FilterType = "all" | "open" | "answered" | "canonical";

function InstructorThreadsPage() {
  const { data: threads, isLoading } = useThreads();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

  const filteredThreads = threads?.filter((thread) => {
    if (filter === "all") return true;
    return thread.status === filter;
  });

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            All Discussion Threads
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, moderate, and manage all course discussions
          </p>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-card border border-border/60">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-8 transition-all"
            >
              All
            </Button>
            <Button
              variant={filter === "open" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("open")}
              className="h-8 transition-all"
            >
              Open
            </Button>
            <Button
              variant={filter === "answered" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("answered")}
              className="h-8 transition-all"
            >
              Answered
            </Button>
            <Button
              variant={filter === "canonical" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("canonical")}
              className="h-8 transition-all"
            >
              Canonical
            </Button>
          </div>
        </div>

        {/* Thread List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredThreads && filteredThreads.length > 0 ? (
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} linkPrefix="/instructor/threads" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/30 mb-3">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground/70 mb-1">No threads found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later</p>
          </div>
        )}
      </main>

      {/* Floating Ask Button */}
      <FloatingAskButton onClick={() => setIsAskModalOpen(true)} />

      {/* Ask Question Modal */}
      <AskQuestionModal open={isAskModalOpen} onOpenChange={setIsAskModalOpen} />
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard requiredRole={["instructor", "ta"]}>
      <InstructorThreadsPage />
    </AuthGuard>
  );
}

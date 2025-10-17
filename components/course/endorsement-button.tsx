"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Thread, User } from "@/lib/models/types";
import { useEndorseThread } from "@/lib/api/hooks";

export interface EndorsementButtonProps {
  /**
   * Thread to endorse
   */
  thread: Thread;

  /**
   * Current user (must be instructor or TA to endorse)
   */
  currentUser: User;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * EndorsementButton - Allows instructors/TAs to endorse threads
 *
 * Features:
 * - Shows "Endorse" button for Prof/TA (if not endorsed)
 * - Shows "Endorsed" state with checkmark (if endorsed)
 * - Hidden for students (no permission to endorse)
 * - Optimistic updates with React Query
 * - QDS compliant styling
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <EndorsementButton thread={thread} currentUser={user} />
 * ```
 */
export function EndorsementButton({
  thread,
  currentUser,
  className,
}: EndorsementButtonProps) {
  const endorseThread = useEndorseThread();

  // Only show button for instructors and TAs
  const canEndorse = currentUser.role === "instructor" || currentUser.role === "ta";
  if (!canEndorse) {
    return null;
  }

  // Check if thread is already endorsed by this user
  const isEndorsedByUser = thread.endorsements?.some(
    (e) => e.userId === currentUser.id
  );

  const handleEndorse = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if in a Link
    e.stopPropagation();

    endorseThread.mutate({
      threadId: thread.id,
      userId: currentUser.id,
    });
  };

  if (isEndorsedByUser) {
    // Already endorsed - show readonly state
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn(
          "gap-2 text-success dark:text-success cursor-default",
          className
        )}
        aria-label="Thread endorsed"
      >
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Endorsed</span>
      </Button>
    );
  }

  // Not endorsed - show action button
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEndorse}
      disabled={endorseThread.isPending}
      className={cn(
        "gap-2 border-accent/40 hover:border-accent hover:bg-accent/10 hover:text-accent-foreground transition-colors",
        endorseThread.isPending && "opacity-50 cursor-wait",
        className
      )}
      aria-label="Endorse this thread"
    >
      <Award className="h-4 w-4" />
      <span className="text-sm font-medium">
        {endorseThread.isPending ? "Endorsing..." : "Endorse"}
      </span>
    </Button>
  );
}

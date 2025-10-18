"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { SimilarThread } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export interface DuplicateWarningProps {
  /**
   * Whether the warning dialog is open
   */
  isOpen: boolean;

  /**
   * Array of similar threads found
   */
  similarThreads: SimilarThread[];

  /**
   * Close handler - user cancelled
   */
  onClose: () => void;

  /**
   * Proceed handler - user wants to post anyway
   */
  onProceed: () => void;

  /**
   * Course ID for navigation links
   */
  courseId: string;
}

/**
 * DuplicateWarning - Shows alert when similar threads are detected
 *
 * Features:
 * - Alert dialog with warning icon
 * - List of similar threads with similarity %
 * - Links to view similar threads
 * - "View Thread" and "Post Anyway" options
 * - QDS compliant styling
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <DuplicateWarning
 *   isOpen={duplicates.length > 0}
 *   similarThreads={duplicates}
 *   onClose={() => setShowWarning(false)}
 *   onProceed={handlePost}
 *   courseId={courseId}
 * />
 * ```
 */
export function DuplicateWarning({
  isOpen,
  similarThreads,
  onClose,
  onProceed,
  courseId,
}: DuplicateWarningProps) {
  if (similarThreads.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <AlertDialogTitle className="text-xl">
              Similar Questions Found
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
            We found {similarThreads.length} existing{" "}
            {similarThreads.length === 1 ? "question" : "questions"} that may
            already answer your question. Review them before posting to avoid
            duplicates.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Similar Threads List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
          {similarThreads.map((item) => (
            <div
              key={item.thread.id}
              className={cn(
                "rounded-lg border border-border/50 bg-card/50 p-4 transition-colors hover:bg-accent/5"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium leading-snug line-clamp-2">
                    {item.thread.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.thread.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.similarityPercent}% similar
                    </Badge>
                    {item.thread.hasAIAnswer && (
                      <Badge variant="secondary" className="text-xs">
                        AI Answered
                      </Badge>
                    )}
                    {item.thread.qualityStatus === "endorsed" && (
                      <Badge
                        variant="outline"
                        className="text-xs border-success/40 bg-success/10 text-success"
                      >
                        Endorsed
                      </Badge>
                    )}
                  </div>
                </div>
                <Link
                  href={`/courses/${courseId}?thread=${item.thread.id}`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded px-2 py-1"
                  )}
                  aria-label={`View similar thread: ${item.thread.title}`}
                >
                  View
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            Post Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

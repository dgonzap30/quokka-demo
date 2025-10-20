"use client";

/**
 * DuplicateWarningDialog - Shows similar threads before posting
 *
 * Helps students avoid creating duplicate questions by showing
 * existing similar threads with similarity scores.
 *
 * Features:
 * - Displays top 5 similar threads
 * - Shows similarity percentage
 * - Links to view existing threads
 * - Allows posting anyway if desired
 */

import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { SimilarThread } from "@/lib/models/types";
import { cn } from "@/lib/utils";

export interface DuplicateWarningDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Similar threads found */
  duplicates: SimilarThread[];

  /** Proceed with posting anyway */
  onProceed: () => void;

  /** Whether posting is in progress */
  isPosting?: boolean;
}

export function DuplicateWarningDialog({
  isOpen,
  onClose,
  duplicates,
  onProceed,
  isPosting = false,
}: DuplicateWarningDialogProps) {
  // Focus management (WCAG 2.4.3 Level A)
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Capture trigger element when dialog opens
  useEffect(() => {
    if (isOpen && !triggerElementRef.current) {
      triggerElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Return focus to trigger element when dialog closes
  useEffect(() => {
    if (!isOpen && triggerElementRef.current) {
      setTimeout(() => {
        if (triggerElementRef.current) {
          triggerElementRef.current.focus();
          triggerElementRef.current = null;
        }
      }, 100);
    }
  }, [isOpen]);

  // Get highest similarity score
  const maxSimilarity = duplicates.length > 0
    ? Math.max(...duplicates.map(d => d.similarity))
    : 0;

  // Determine warning severity
  const severity = maxSimilarity >= 0.9 ? "high" : maxSimilarity >= 0.8 ? "medium" : "low";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              severity === "high" && "bg-destructive/10",
              severity === "medium" && "bg-warning/10",
              severity === "low" && "bg-muted"
            )}>
              <AlertTriangle className={cn(
                "h-5 w-5",
                severity === "high" && "text-destructive",
                severity === "medium" && "text-warning",
                severity === "low" && "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1">
              <DialogTitle>Similar Questions Found</DialogTitle>
              <DialogDescription>
                We found {duplicates.length} similar question{duplicates.length > 1 ? 's' : ''}.
                Review them before posting to avoid duplicates.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Similar Threads List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {duplicates.slice(0, 5).map((similarThread) => {
            const similarityPercent = Math.round(similarThread.similarity * 100);
            const isHighSimilarity = similarThread.similarity >= 0.9;
            const isMediumSimilarity = similarThread.similarity >= 0.8 && similarThread.similarity < 0.9;
            const thread = similarThread.thread; // Extract the actual thread

            return (
              <Card key={thread.id} className={cn(
                "border-l-4",
                isHighSimilarity && "border-l-destructive",
                isMediumSimilarity && "border-l-warning",
                !isHighSimilarity && !isMediumSimilarity && "border-l-muted"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                      {thread.title}
                    </CardTitle>
                    <Badge variant={
                      isHighSimilarity ? "destructive" :
                      isMediumSimilarity ? "outline" :
                      "secondary"
                    }>
                      {similarityPercent}% similar
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {thread.status === "resolved" ? "✅ Resolved" : "⏳ Open"} • {thread.views} views
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {thread.content}
                  </p>
                  <Link
                    href={`/threads/${thread.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      View thread <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {severity === "high" && (
              <p className="text-destructive font-medium">
                ⚠️ Very high similarity detected. Please review existing threads first.
              </p>
            )}
            {severity === "medium" && (
              <p className="text-warning font-medium">
                💡 Similar question exists. Consider asking there instead.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              onClick={onProceed}
              disabled={isPosting}
              variant={severity === "high" ? "destructive" : "default"}
            >
              {isPosting ? "Posting..." : "Post Anyway"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

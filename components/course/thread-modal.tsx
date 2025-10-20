"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThreadDetailPanel } from "@/components/course/thread-detail-panel";

export interface ThreadModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Thread ID to display
   */
  threadId: string | null;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ThreadModal - Large modal wrapper for thread detail view
 *
 * Follows QuokkaAssistantModal pattern for large/full-screen modals
 *
 * Features:
 * - Large viewport-based sizing (95vw × 95vh)
 * - Proper Dialog positioning (not fixed override)
 * - Automatic backdrop overlay
 * - Automatic body scroll lock
 * - Screen reader accessible
 * - Internal scrolling via ThreadDetailPanel
 *
 * @example
 * ```tsx
 * <ThreadModal
 *   open={!!selectedThreadId}
 *   onOpenChange={(open) => !open && setSelectedThreadId(null)}
 *   threadId={selectedThreadId}
 * />
 * ```
 */
export function ThreadModal({
  open,
  onOpenChange,
  threadId,
  className,
}: ThreadModalProps) {
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Store the trigger element when modal opens (WCAG 2.4.3 Level A)
  React.useEffect(() => {
    if (open && !triggerRef.current) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Return focus to trigger element when modal closes
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`flex flex-col max-w-[95vw] lg:max-w-7xl h-[95vh] glass-panel-strong p-0 ${className || ''}`}
        showCloseButton={false}
        aria-label="Thread detail modal"
      >
        {/* Screen reader only title - actual thread title shown in ThreadDetailPanel */}
        <DialogHeader className="sr-only">
          <DialogTitle>Thread Details</DialogTitle>
        </DialogHeader>

        {/* Thread content - scrollable wrapper */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
          <ThreadDetailPanel
            threadId={threadId}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

/**
 * NewConversationButton - Prominent button to create new AI conversation
 *
 * Features:
 * - QDS gradient styling (primary → accent)
 * - Loading state support
 * - Icon with glassmorphic container
 * - Accessible labeling
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NewConversationButtonProps {
  /**
   * Click handler for creating new conversation
   */
  onClick: () => void;

  /**
   * Optional loading state during creation
   */
  isLoading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function NewConversationButton({
  onClick,
  isLoading = false,
  className,
}: NewConversationButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full justify-start gap-2 bg-gradient-to-r from-primary to-accent",
        "hover:from-primary-hover hover:to-accent-hover",
        "text-white font-medium shadow-e2",
        "transition-all duration-300 ease-in-out",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
      aria-label="Start a new conversation with Quokka"
    >
      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </div>
      <span>{isLoading ? "Creating..." : "New Conversation"}</span>
    </Button>
  );
}

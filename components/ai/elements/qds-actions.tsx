"use client";

/**
 * QDSActions - QDS-styled wrapper for AI Elements Actions component
 *
 * Provides Copy and Retry actions with QDS glass styling and tooltips
 */

import { Actions, Action } from "@/components/ai-elements/actions";
import { Copy, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QDSActionsProps } from "./types";

export function QDSActions({
  messageContent,
  onCopy,
  onRetry,
  showRetry = false,
  isStreaming = false,
  className,
}: QDSActionsProps) {
  const handleCopy = async () => {
    if (!onCopy) return;
    onCopy(messageContent);
  };

  const handleRetry = () => {
    if (!onRetry || isStreaming) return;
    onRetry();
  };

  return (
    <Actions className={cn("mt-2 flex items-center gap-1", className)}>
      <Action
        tooltip="Copy message"
        onClick={handleCopy}
        className="h-8 w-auto px-3 text-xs rounded-md border border-glass bg-glass hover:bg-accent/10 glass-text flex items-center gap-1.5 transition-all duration-200 shadow-sm"
      >
        <Copy className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Copy</span>
      </Action>

      {showRetry && (
        <Action
          tooltip="Retry generation"
          onClick={handleRetry}
          disabled={isStreaming}
          className="h-8 w-auto px-3 text-xs rounded-md border border-glass bg-glass hover:bg-accent/10 glass-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all duration-200 shadow-sm"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Retry</span>
        </Action>
      )}
    </Actions>
  );
}

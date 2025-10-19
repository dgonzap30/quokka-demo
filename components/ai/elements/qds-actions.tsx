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
    <Actions className={cn("mt-1 ml-1", className)}>
      <Action
        tooltip="Copy message"
        onClick={handleCopy}
        className="h-8 w-auto px-2 text-xs hover:bg-accent/10 glass-text flex items-center"
      >
        <Copy className="h-3 w-3 mr-1" />
        <span className="text-xs">Copy</span>
      </Action>

      {showRetry && (
        <Action
          tooltip="Retry generation"
          onClick={handleRetry}
          disabled={isStreaming}
          className="h-8 w-auto px-2 text-xs hover:bg-accent/10 glass-text disabled:opacity-50 flex items-center"
        >
          <RefreshCcw className="h-3 w-3 mr-1" />
          <span className="text-xs">Retry</span>
        </Action>
      )}
    </Actions>
  );
}

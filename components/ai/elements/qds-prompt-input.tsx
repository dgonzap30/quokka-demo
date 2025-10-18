"use client";

/**
 * QDSPromptInput - QDS-styled wrapper for AI Elements PromptInput component
 *
 * Provides chat input with:
 * - QDS glass styling
 * - Send/Stop button with state management
 * - Keyboard shortcuts (Enter to send)
 * - Disabled state handling
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, StopCircle } from "lucide-react";
import type { QDSPromptInputProps } from "./types";

export function QDSPromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask me anything...",
  className,
  inputRef,
}: QDSPromptInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStreaming && value.trim() && !disabled) {
      onSubmit();
    }
  };

  const handleStop = () => {
    if (onStop && isStreaming) {
      onStop();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isStreaming || disabled}
        className="flex-1 text-sm"
        aria-label="Message input"
      />
      {isStreaming ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleStop}
          className="shrink-0 min-h-[44px] min-w-[44px]"
          aria-label="Stop generation"
        >
          <StopCircle className="h-4 w-4" />
          <span className="sr-only">Stop generation</span>
        </Button>
      ) : (
        <Button
          type="submit"
          variant="glass-primary"
          size="sm"
          disabled={!value.trim() || disabled}
          className="shrink-0 min-h-[44px] min-w-[44px]"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      )}
    </form>
  );
}

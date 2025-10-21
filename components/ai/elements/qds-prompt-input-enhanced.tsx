"use client";

/**
 * QDSPromptInputEnhanced - Premium AI Elements PromptInput with QDS 2.0 Glassmorphism
 *
 * Features:
 * - Glassmorphism container with depth and elevation
 * - File attachments (images, PDFs) with preview cards
 * - Model selection with badge/chip design
 * - Enhanced submit button with gradient and glow
 * - Micro-interactions and smooth animations
 * - Two-zone footer layout (tools left, action right)
 * - Accessibility-first design (WCAG 2.2 AA)
 */

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatStatus } from "ai";
import { cn } from "@/lib/utils";
import { Sparkles, Send, Square, Zap } from "lucide-react";
import { useRef, useState } from "react";

export interface QDSPromptInputEnhancedProps {
  /** Current chat status */
  status?: ChatStatus;
  /** Submit handler */
  onSubmit: (message: PromptInputMessage) => void;
  /** Stop generation handler */
  onStop?: () => void;
  /** Whether submission is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom className */
  className?: string;
  /** Input ref for focus management */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** Current model selection */
  model?: string;
  /** Model change handler */
  onModelChange?: (model: string) => void;
  /** Available models */
  models?: Array<{ id: string; name: string }>;
}

const DEFAULT_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
  { id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
];

// Model icons mapping
const MODEL_ICONS: Record<string, typeof Sparkles> = {
  "gpt-4o": Zap,
  "gpt-4o-mini": Zap,
  "claude-opus-4-20250514": Sparkles,
  "claude-sonnet-4-20250514": Sparkles,
  "gemini-2.0-flash-exp": Sparkles,
};

export function QDSPromptInputEnhanced({
  status,
  onSubmit,
  onStop,
  disabled = false,
  placeholder = "Ask me anything...",
  className,
  inputRef,
  model = "gpt-4o",
  onModelChange,
  models = DEFAULT_MODELS,
}: QDSPromptInputEnhancedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "submitted" || status === "streaming";
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (message: PromptInputMessage) => {
    onSubmit(message);
  };

  const handleStop = () => {
    if (onStop && isStreaming) {
      onStop();
    }
  };

  // Get model icon
  const ModelIcon = MODEL_ICONS[model] || Sparkles;

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className={cn(
        // Glassmorphism base
        "glass-panel-strong relative overflow-hidden",
        "border-2 border-glass",
        "shadow-glass-lg",
        // Spacing and layout
        "p-4 rounded-2xl",
        // Transitions
        "transition-all duration-300 ease-out",
        // Focus state with glow
        isFocused && [
          "ring-2 ring-primary/30 ring-offset-0",
          "shadow-[0_0_30px_rgba(138,107,61,0.25)]",
          "border-primary/40",
        ],
        className
      )}
      accept="image/*,.pdf"
      multiple
      maxFiles={5}
      maxFileSize={5 * 1024 * 1024} // 5MB
      onError={(err) => {
        console.error("File attachment error:", err);
        // TODO: Show toast notification
      }}
    >
      {/* Input Body with Enhanced Textarea */}
      <PromptInputBody className="min-h-[120px] relative">
        {/* File Attachments with Slide-in Animation */}
        <PromptInputAttachments className="mb-3">
          {(attachment) => (
            <PromptInputAttachment
              data={attachment}
              className={cn(
                "glass-panel border-glass",
                "hover:border-primary/40 hover:shadow-glass-md",
                "transition-all duration-200",
                "animate-slide-in-up"
              )}
            />
          )}
        </PromptInputAttachments>

        {/* Textarea with Enhanced Focus States */}
        <PromptInputTextarea
          ref={inputRef || textareaRef}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            // Base styling
            "resize-none border-0 bg-transparent",
            "text-sm glass-text leading-relaxed",
            "placeholder:text-muted-foreground/60",
            // Remove default focus ring (we handle it on container)
            "focus-visible:ring-0 focus-visible:outline-none",
            // Smooth transitions
            "transition-all duration-200",
            // Auto-grow smoothly
            "min-h-[80px] max-h-[300px]"
          )}
        />
      </PromptInputBody>

      {/* Two-Zone Footer with Gradient Divider */}
      <PromptInputFooter
        className={cn(
          "flex items-center justify-between gap-4",
          "border-t border-glass/50",
          "pt-4 mt-3 px-1",
          // Subtle gradient divider
          "relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px]",
          "before:bg-gradient-to-r before:from-transparent before:via-glass/50 before:to-transparent"
        )}
      >
        {/* Left Zone: Tools */}
        <PromptInputTools className="flex items-center gap-2 flex-1">
          {/* Attachment Button with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger
                  className={cn(
                    // Size and shape
                    "h-10 w-10 p-0 rounded-xl",
                    // Glass styling
                    "glass-panel border-glass",
                    // Hover effects
                    "hover:bg-primary/10 hover:border-primary/30",
                    "hover:scale-105 hover:shadow-glass-md",
                    // Active state
                    "active:scale-95",
                    // Transitions
                    "transition-all duration-200 ease-out"
                  )}
                  aria-label="Attach files (images, PDFs)"
                />
                <PromptInputActionMenuContent
                  align="start"
                  className={cn(
                    "glass-panel-strong",
                    "border-glass",
                    "shadow-glass-lg",
                    "animate-slide-in-up"
                  )}
                >
                  <PromptInputActionAddAttachments
                    label="Add images or PDFs"
                    className="hover:bg-primary/10 transition-colors"
                  />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="glass-panel border-glass text-xs"
            >
              Attach files (max 5MB)
            </TooltipContent>
          </Tooltip>

          {/* Model Selector - Badge/Chip Design */}
          {models.length > 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <PromptInputModelSelect
                  value={model}
                  onValueChange={onModelChange}
                >
                  <PromptInputModelSelectTrigger
                    className={cn(
                      // Compact badge design
                      "h-9 px-3 rounded-lg",
                      "text-xs font-medium",
                      // Glass styling
                      "glass-panel border-glass",
                      // Gradient background
                      "bg-gradient-to-br from-primary/5 to-primary/10",
                      // Hover effects
                      "hover:from-primary/10 hover:to-primary/15",
                      "hover:border-primary/30 hover:scale-102",
                      "hover:shadow-glass-sm",
                      // Transitions
                      "transition-all duration-200 ease-out",
                      // Flex layout for icon
                      "flex items-center gap-2"
                    )}
                  >
                    <ModelIcon className="h-3.5 w-3.5 text-primary" />
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent
                    className={cn(
                      "glass-panel-strong",
                      "border-glass",
                      "shadow-glass-lg",
                      "animate-slide-in-up"
                    )}
                  >
                    {models.map((m) => (
                      <PromptInputModelSelectItem
                        key={m.id}
                        value={m.id}
                        className={cn(
                          "hover:bg-primary/10 cursor-pointer",
                          "transition-colors duration-150",
                          "text-sm"
                        )}
                      >
                        {m.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="glass-panel border-glass text-xs"
              >
                AI Model: {models.find(m => m.id === model)?.name}
              </TooltipContent>
            </Tooltip>
          )}
        </PromptInputTools>

        {/* Right Zone: Submit Button with Enhanced Styling */}
        <Tooltip>
          <TooltipTrigger asChild>
            <PromptInputSubmit
              disabled={disabled}
              status={status}
              onClick={isStreaming ? handleStop : undefined}
              className={cn(
                // Size and shape
                "h-11 w-11 p-0 shrink-0 rounded-xl",
                // Gradient background with primary colors
                !isStreaming && [
                  "bg-gradient-to-br from-primary via-primary to-primary-hover",
                  "text-white",
                ],
                // Stop button styling
                isStreaming && [
                  "bg-gradient-to-br from-danger via-danger to-danger/90",
                  "text-white",
                ],
                // Hover effects
                !disabled && !isStreaming && [
                  "hover:from-primary hover:via-primary-hover hover:to-primary-pressed",
                  "hover:scale-105",
                  "hover:shadow-[0_0_25px_rgba(138,107,61,0.4)]",
                ],
                // Active/pressed state
                "active:scale-95",
                // Disabled state
                disabled && [
                  "opacity-50 cursor-not-allowed",
                  "hover:scale-100 hover:shadow-none",
                ],
                // Shadow and depth
                "shadow-lg shadow-primary/20",
                // Transitions
                "transition-all duration-200 ease-out",
                // Subtle pulse when ready (not disabled, not streaming)
                !disabled && !isStreaming && "animate-subtle-pulse"
              )}
            >
              {isStreaming ? (
                <Square className="h-4.5 w-4.5" />
              ) : (
                <Send className="h-4.5 w-4.5" />
              )}
            </PromptInputSubmit>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="glass-panel border-glass text-xs"
          >
            {isStreaming ? "Stop generation" : disabled ? "Enter a message" : "Send message (⏎)"}
          </TooltipContent>
        </Tooltip>
      </PromptInputFooter>
    </PromptInput>
  );
}

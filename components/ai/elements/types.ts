/**
 * Type definitions for QDS-styled AI Elements wrapper components
 *
 * These types extend AI SDK Elements components with QDS-specific customization
 * while maintaining strict TypeScript compliance (no `any` types).
 */

import type { UIMessage } from "@ai-sdk/react";

/**
 * QuokkaMessage metadata extending UIMessage
 *
 * Preserves citations, material references, and confidence scores
 */
export interface QuokkaMessageMetadata {
  /** Parsed citations from AI response */
  citations?: Array<{
    id: number;
    title: string;
    type?: string;
    url?: string;
  }>;

  /** Material references for course context */
  materialReferences?: string[];

  /** AI confidence score (0-1) */
  confidenceScore?: number;
}

/**
 * Specialized UIMessage type for Quokka with metadata
 */
export type QuokkaUIMessage = UIMessage & {
  metadata?: QuokkaMessageMetadata;
};

/**
 * Props for QDSConversation component
 */
export interface QDSConversationProps {
  /** Messages to display */
  messages: UIMessage[]; // Accept generic UIMessage for compatibility

  /** Whether AI is currently streaming */
  isStreaming?: boolean;

  /** Handler for Copy action */
  onCopy?: (content: string) => void;

  /** Handler for Retry action */
  onRetry?: () => void;

  /** Can retry (last message check) */
  canRetry?: boolean;

  /** Page context for quick prompts */
  pageContext?: "dashboard" | "course" | "instructor";

  /** Current course code for prompts */
  courseCode?: string;

  /** Custom className */
  className?: string;

  /** Ref for scroll container */
  scrollContainerRef?: React.RefObject<HTMLDivElement>;

  /** Ref for scroll-to-bottom marker */
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Props for QDSMessage component
 */
export interface QDSMessageProps {
  /** Message data */
  message: UIMessage; // Accept generic UIMessage for compatibility

  /** Handler for Copy action */
  onCopy?: (content: string) => void;

  /** Handler for Retry action (only shown on last assistant message) */
  onRetry?: () => void;

  /** Whether this is the last message */
  isLast?: boolean;

  /** Whether AI is currently streaming */
  isStreaming?: boolean;

  /** Custom className */
  className?: string;
}

/**
 * Props for QDSResponse component
 */
export interface QDSResponseProps {
  /** Message text content */
  content: string;

  /** Parsed citations */
  citations?: QuokkaMessageMetadata["citations"];

  /** Whether the message is currently streaming */
  isStreaming?: boolean;

  /** Custom className */
  className?: string;
}

/**
 * Props for QDSActions component
 */
export interface QDSActionsProps {
  /** Message content for copy action */
  messageContent: string;

  /** Handler for Copy action */
  onCopy?: (content: string) => void;

  /** Handler for Retry action */
  onRetry?: () => void;

  /** Show retry button */
  showRetry?: boolean;

  /** Whether streaming is in progress */
  isStreaming?: boolean;

  /** Custom className */
  className?: string;
}

/**
 * Props for QDSPromptInput component
 */
export interface QDSPromptInputProps {
  /** Input value */
  value: string;

  /** Input change handler */
  onChange: (value: string) => void;

  /** Submit handler */
  onSubmit: () => void;

  /** Stop generation handler */
  onStop?: () => void;

  /** Whether streaming is in progress */
  isStreaming?: boolean;

  /** Whether submission is disabled */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Custom className */
  className?: string;

  /** Input ref */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Props for QDSInlineCitation component
 */
export interface QDSInlineCitationProps {
  /** Citation number */
  citationId: number;

  /** Citation title */
  title: string;

  /** Citation type */
  type?: string;

  /** Citation URL */
  url?: string;

  /** Click handler for scrolling to source */
  onClick?: (citationId: number) => void;

  /** Custom className */
  className?: string;
}

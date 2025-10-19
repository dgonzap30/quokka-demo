# Type Integration Plan - AI SDK Elements

**Date:** 2025-10-17
**Task:** ai-sdk-elements-ui-upgrade
**Focus:** Type-safe integration of AI SDK Elements with Quokka types

---

## 1. Overview

This plan defines all type definitions, conversions, and type guards required for integrating AI SDK Elements components with the existing Quokka type system while maintaining strict mode compliance.

**Goals:**
- Zero `any` types
- Type-only imports (`import type`)
- Full metadata preservation (citations, material references)
- Type-safe wrapper components
- Runtime type validation with type guards

---

## 2. Core Type Definitions

### 2.1 Extended UIMessage Types

**File:** `lib/models/types.ts` (add to existing file)

```typescript
// ============================================
// AI SDK Elements Type Extensions
// ============================================

/**
 * Custom metadata for Quokka UIMessage instances
 *
 * Extends AI SDK's UIMessage with citation and material reference data.
 */
export interface QuokkaMessageMetadata {
  /** Parsed citations from LLM response */
  citations?: Citation[];

  /** Material references from course context */
  materialReferences?: MaterialReference[];

  /** Confidence score for AI responses (0-100) */
  confidenceScore?: number;

  /** Raw sources section text (for debugging) */
  sourcesSection?: string;

  /** ISO 8601 timestamp when message was created */
  createdAt?: string;

  /** Conversation ID for persistence */
  conversationId?: string;
}

/**
 * Quokka-specialized UIMessage type
 *
 * Uses custom metadata for citation and material reference tracking.
 * Compatible with AI SDK Elements components and usePersistedChat hook.
 */
export type QuokkaUIMessage = UIMessage<QuokkaMessageMetadata>;

/**
 * Quokka-specialized useChat return type
 *
 * All messages are typed as QuokkaUIMessage for consistent metadata access.
 */
export type QuokkaUseChatHelpers = UseChatHelpers<QuokkaUIMessage>;
```

### 2.2 Error Types

**File:** `lib/models/types.ts` (add to existing file)

```typescript
// ============================================
// AI Chat Error Types
// ============================================

/**
 * Base error for all chat-related errors
 */
export interface BaseChatError extends Error {
  /** Error category */
  category: 'streaming' | 'conversion' | 'api';

  /** Specific error code */
  code: string;

  /** Timestamp when error occurred */
  timestamp: string;
}

/**
 * Streaming-related errors
 */
export interface StreamingError extends BaseChatError {
  category: 'streaming';
  code: 'STREAM_INTERRUPTED' | 'STREAM_TIMEOUT' | 'STREAM_ABORT' | 'STREAM_PARSE_ERROR';

  /** Conversation ID where error occurred */
  conversationId: string;

  /** Message ID being streamed (if available) */
  messageId?: string;

  /** Partial content received before error */
  partialContent?: string;
}

/**
 * Type conversion errors
 */
export interface ConversionError extends BaseChatError {
  category: 'conversion';
  code: 'INVALID_ROLE' | 'MISSING_CONTENT' | 'INVALID_FORMAT' | 'METADATA_LOSS';

  /** Original message that failed conversion */
  originalMessage: QuokkaUIMessage | AIMessage;

  /** Field that caused the error */
  field?: string;
}

/**
 * API-related errors
 */
export interface ChatAPIError extends BaseChatError {
  category: 'api';
  code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'RATE_LIMIT' | 'UNAUTHORIZED' | 'INVALID_REQUEST';

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Whether this error can be retried */
  retryable: boolean;

  /** Retry delay in milliseconds (if retryable) */
  retryAfter?: number;
}

/**
 * Discriminated union of all chat errors
 */
export type ChatError = StreamingError | ConversionError | ChatAPIError;
```

### 2.3 Async Operation Types

**File:** `lib/models/types.ts` (add to existing file)

```typescript
// ============================================
// AI Chat Async Operation Types
// ============================================

/**
 * Result of sending a message
 */
export interface SendMessageResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** ID of the created message */
  messageId: string;

  /** Error if operation failed */
  error?: ChatError;
}

/**
 * Result of regenerating a message
 */
export interface RegenerateResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** ID of the newly generated message */
  newMessageId: string;

  /** ID of the replaced message */
  replacedMessageId?: string;

  /** Error if operation failed */
  error?: ChatError;
}

/**
 * Result of stopping a streaming response
 */
export interface StopStreamResult {
  /** Whether stop was successful */
  success: boolean;

  /** ID of the message that was stopped */
  messageId?: string;

  /** Partial content received before stop */
  partialContent?: string;
}
```

---

## 3. Type Conversion Functions

### 3.1 Enhanced AIMessage ↔ UIMessage Converters

**File:** `lib/llm/hooks/usePersistedChat.ts` (replace existing functions)

```typescript
import type { UIMessage } from "@ai-sdk/react";
import type { AIMessage, QuokkaUIMessage, QuokkaMessageMetadata } from "@/lib/models/types";
import { parseCitations } from "@/lib/llm/utils/citations";

/**
 * Convert AIMessage (localStorage) to QuokkaUIMessage (AI SDK format)
 *
 * Preserves all metadata including citations and material references.
 * Parses citations from assistant messages automatically.
 *
 * @param aiMessage - Message from localStorage
 * @returns QuokkaUIMessage with full metadata
 */
function aiMessageToUIMessage(aiMessage: AIMessage): QuokkaUIMessage {
  // Parse citations if this is an assistant message
  const parsed = aiMessage.role === "assistant"
    ? parseCitations(aiMessage.content)
    : null;

  // Build metadata
  const metadata: QuokkaMessageMetadata = {
    conversationId: aiMessage.conversationId,
    createdAt: aiMessage.timestamp,
    materialReferences: aiMessage.materialReferences,
    confidenceScore: aiMessage.confidenceScore,
  };

  // Add citation data if available
  if (parsed && parsed.citations.length > 0) {
    metadata.citations = parsed.citations;
    metadata.sourcesSection = parsed.sourcesSection || undefined;
  }

  return {
    id: aiMessage.id,
    role: aiMessage.role,
    parts: [
      {
        type: "text",
        text: parsed ? parsed.contentWithoutSources : aiMessage.content,
        state: "done",
      },
    ],
    metadata,
  };
}

/**
 * Convert QuokkaUIMessage (AI SDK format) to AIMessage (localStorage format)
 *
 * Preserves all metadata from the UIMessage.
 * Reconstructs content from parts and sources section.
 *
 * @param message - UIMessage from AI SDK
 * @param conversationId - Conversation ID for persistence
 * @returns AIMessage ready for localStorage
 * @throws ConversionError if message role is invalid or content is missing
 */
function uiMessageToAIMessage(
  message: QuokkaUIMessage,
  conversationId: string
): AIMessage {
  // Extract text content from parts
  const textParts = message.parts.filter((p) => p.type === "text");

  if (textParts.length === 0) {
    throw new Error("Message must have at least one text part");
  }

  const content = textParts
    .map((p) => ("text" in p ? p.text : ""))
    .join("\n");

  // Validate role
  if (message.role !== "user" && message.role !== "assistant") {
    throw new Error(`Unexpected message role: ${message.role}`);
  }

  // Reconstruct full content with sources section (if citations exist)
  let fullContent = content;
  if (message.metadata?.citations && message.metadata.citations.length > 0) {
    fullContent += "\n\n**Sources:**\n";
    fullContent += message.metadata.citations
      .map((c) => `${c.id}. ${c.title} (Type: ${c.type})`)
      .join("\n");
  }

  return {
    id: message.id,
    conversationId,
    role: message.role,
    content: fullContent,
    timestamp: message.metadata?.createdAt || new Date().toISOString(),
    materialReferences: message.metadata?.materialReferences,
    confidenceScore: message.metadata?.confidenceScore,
  };
}
```

### 3.2 Source Part Converters

**File:** `lib/llm/utils/citations.ts` (add new functions)

```typescript
import type { UIMessagePart } from "ai";
import type { Citation } from "@/lib/models/types";

/**
 * Convert Citation to SourceDocumentUIPart
 *
 * Transforms Quokka Citation into AI SDK's SourceDocumentUIPart format.
 *
 * @param citation - Parsed citation
 * @returns SourceDocumentUIPart for AI SDK
 */
export function citationToSourcePart(citation: Citation): UIMessagePart {
  return {
    type: "source-document",
    sourceId: citation.materialId || `citation-${citation.id}`,
    mediaType: "text/plain",
    title: citation.title,
    filename: undefined,
  };
}

/**
 * Convert multiple citations to source parts
 *
 * @param citations - Array of citations
 * @returns Array of SourceDocumentUIPart
 */
export function citationsToSourceParts(citations: Citation[]): UIMessagePart[] {
  return citations.map(citationToSourcePart);
}
```

---

## 4. Type Guards

### 4.1 Message Type Guards

**File:** `lib/llm/utils/typeGuards.ts` (new file)

```typescript
import type { UIMessage, UIMessagePart, ChatStatus } from "ai";
import type {
  QuokkaUIMessage,
  QuokkaMessageMetadata,
  ChatError,
  StreamingError,
  ConversionError,
  ChatAPIError,
  Citation,
} from "@/lib/models/types";

// ============================================
// Message Role Guards
// ============================================

/**
 * Type guard for assistant messages
 */
export function isAssistantMessage(
  message: UIMessage
): message is UIMessage & { role: "assistant" } {
  return message.role === "assistant";
}

/**
 * Type guard for user messages
 */
export function isUserMessage(
  message: UIMessage
): message is UIMessage & { role: "user" } {
  return message.role === "user";
}

/**
 * Type guard for system messages
 */
export function isSystemMessage(
  message: UIMessage
): message is UIMessage & { role: "system" } {
  return message.role === "system";
}

// ============================================
// Metadata Guards
// ============================================

/**
 * Type guard for QuokkaUIMessage with metadata
 */
export function hasQuokkaMetadata(
  message: UIMessage
): message is QuokkaUIMessage {
  return (
    message.metadata !== undefined &&
    typeof message.metadata === "object" &&
    message.metadata !== null
  );
}

/**
 * Type guard for messages with citation metadata
 */
export function hasCitationMetadata(
  message: UIMessage
): message is QuokkaUIMessage & {
  metadata: QuokkaMessageMetadata & { citations: Citation[] };
} {
  if (!hasQuokkaMetadata(message)) return false;

  const metadata = message.metadata as QuokkaMessageMetadata;
  return (
    metadata.citations !== undefined &&
    Array.isArray(metadata.citations) &&
    metadata.citations.length > 0
  );
}

/**
 * Type guard for messages with material references
 */
export function hasMaterialReferences(
  message: UIMessage
): message is QuokkaUIMessage & {
  metadata: QuokkaMessageMetadata & { materialReferences: MaterialReference[] };
} {
  if (!hasQuokkaMetadata(message)) return false;

  const metadata = message.metadata as QuokkaMessageMetadata;
  return (
    metadata.materialReferences !== undefined &&
    Array.isArray(metadata.materialReferences) &&
    metadata.materialReferences.length > 0
  );
}

// ============================================
// Message Part Guards
// ============================================

/**
 * Type guard for text parts
 */
export function isTextPart(
  part: UIMessagePart<any, any>
): part is { type: "text"; text: string; state?: "streaming" | "done" } {
  return part.type === "text";
}

/**
 * Type guard for source URL parts
 */
export function isSourceUrlPart(
  part: UIMessagePart<any, any>
): part is {
  type: "source-url";
  sourceId: string;
  url: string;
  title?: string;
} {
  return part.type === "source-url";
}

/**
 * Type guard for source document parts
 */
export function isSourceDocumentPart(
  part: UIMessagePart<any, any>
): part is {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
} {
  return part.type === "source-document";
}

/**
 * Type guard for reasoning parts
 */
export function isReasoningPart(
  part: UIMessagePart<any, any>
): part is { type: "reasoning"; text: string; state?: "streaming" | "done" } {
  return part.type === "reasoning";
}

// ============================================
// Streaming State Guards
// ============================================

/**
 * Check if a message is currently streaming
 */
export function isStreamingMessage(message: UIMessage): boolean {
  return message.parts.some(
    (part) => isTextPart(part) && part.state === "streaming"
  );
}

/**
 * Check if a message is complete (done streaming)
 */
export function isCompleteMessage(message: UIMessage): boolean {
  return message.parts.every(
    (part) => !isTextPart(part) || part.state === "done"
  );
}

/**
 * Check if chat status is streaming
 */
export function isStreaming(status: ChatStatus): boolean {
  return status === "streaming";
}

/**
 * Check if chat status is error
 */
export function isErrorStatus(status: ChatStatus): boolean {
  return status === "error";
}

/**
 * Check if chat status is done
 */
export function isDone(status: ChatStatus): boolean {
  return status === "done";
}

// ============================================
// Error Type Guards
// ============================================

/**
 * Type guard for ChatError
 */
export function isChatError(error: Error): error is ChatError {
  return (
    "category" in error &&
    (error as ChatError).category !== undefined &&
    ["streaming", "conversion", "api"].includes((error as ChatError).category)
  );
}

/**
 * Type guard for StreamingError
 */
export function isStreamingError(error: Error): error is StreamingError {
  return isChatError(error) && error.category === "streaming";
}

/**
 * Type guard for ConversionError
 */
export function isConversionError(error: Error): error is ConversionError {
  return isChatError(error) && error.category === "conversion";
}

/**
 * Type guard for ChatAPIError
 */
export function isChatAPIError(error: Error): error is ChatAPIError {
  return isChatError(error) && error.category === "api";
}

/**
 * Type guard for retryable errors
 */
export function isRetryableError(
  error: Error
): error is ChatAPIError & { retryable: true } {
  return isChatAPIError(error) && error.retryable === true;
}

// ============================================
// Validation Guards
// ============================================

/**
 * Validate that a message has required text content
 */
export function hasTextContent(message: UIMessage): boolean {
  return message.parts.some((part) => isTextPart(part) && part.text.trim().length > 0);
}

/**
 * Validate that citations are well-formed
 */
export function hasValidCitations(message: UIMessage): boolean {
  if (!hasCitationMetadata(message)) return true; // No citations is valid

  const citations = (message.metadata as QuokkaMessageMetadata).citations!;

  return citations.every(
    (citation) =>
      typeof citation.id === "number" &&
      typeof citation.title === "string" &&
      citation.title.trim().length > 0 &&
      typeof citation.type === "string"
  );
}
```

---

## 5. Import Statements

### 5.1 Type-Only Imports

**All Type Imports Must Use `import type` Syntax:**

```typescript
// ✅ GOOD - Type-only imports
import type { UIMessage, ChatStatus } from "ai";
import type {
  QuokkaUIMessage,
  QuokkaMessageMetadata,
  Citation,
  MaterialReference,
  ChatError,
} from "@/lib/models/types";

// ✅ GOOD - Runtime imports (hooks, utilities)
import { useChat } from "@ai-sdk/react";
import { parseCitations } from "@/lib/llm/utils/citations";

// ❌ BAD - Type imported without `type` keyword
import { UIMessage } from "ai";
```

### 5.2 Import Organization Template

**File Header Template for New Components:**

```typescript
"use client";

// React imports
import { useState, useEffect, useCallback } from "react";

// Type-only imports - AI SDK
import type { UIMessage, ChatStatus } from "ai";

// Type-only imports - Quokka types
import type {
  QuokkaUIMessage,
  QuokkaMessageMetadata,
  Citation,
  MaterialReference,
  ChatError,
} from "@/lib/models/types";

// Runtime imports - AI SDK
import { useChat } from "@ai-sdk/react";

// Runtime imports - UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Runtime imports - utilities
import { cn } from "@/lib/utils";
import { parseCitations } from "@/lib/llm/utils/citations";
import { isAssistantMessage, hasCitationMetadata } from "@/lib/llm/utils/typeGuards";
```

---

## 6. Wrapper Component Types

### 6.1 QDS Wrapper Component Interfaces

**File:** `components/ai/elements/types.ts` (new file)

```typescript
import type { UIMessage, ChatStatus } from "ai";
import type { QuokkaUIMessage, Citation } from "@/lib/models/types";

// ============================================
// QDS Wrapper Component Props
// ============================================

/**
 * Base props for all QDS AI components
 */
export interface QDSBaseProps {
  /** Additional CSS classes */
  className?: string;

  /** Whether component is disabled */
  disabled?: boolean;
}

/**
 * Props for QDSConversation wrapper
 *
 * Wraps AI SDK Conversation with QDS glass morphism styling.
 */
export interface QDSConversationProps extends QDSBaseProps {
  /** Messages to display */
  messages: QuokkaUIMessage[];

  /** Current chat status */
  status: ChatStatus;

  /** Error state */
  error?: Error;

  /** Loading state */
  isLoading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Children (for custom message rendering) */
  children?: React.ReactNode;
}

/**
 * Props for QDSMessage wrapper
 *
 * Wraps AI SDK Message with QDS styling and citation support.
 */
export interface QDSMessageProps extends QDSBaseProps {
  /** Message to display */
  message: QuokkaUIMessage;

  /** Whether message is currently streaming */
  isStreaming?: boolean;

  /** Show action buttons (copy, regenerate) */
  showActions?: boolean;

  /** Show citations inline and in sources panel */
  showCitations?: boolean;

  /** Callback when copy is clicked */
  onCopy?: (content: string) => void;

  /** Callback when regenerate is clicked */
  onRegenerate?: () => void;
}

/**
 * Props for QDSResponse wrapper
 *
 * Wraps AI SDK Response with QDS styling, streaming, and citations.
 */
export interface QDSResponseProps extends QDSBaseProps {
  /** Assistant message to display */
  message: QuokkaUIMessage;

  /** Current chat status */
  status: ChatStatus;

  /** Callback to stop streaming */
  onStop?: () => void;

  /** Show citations and sources */
  showCitations?: boolean;

  /** Default expanded state for sources panel */
  sourcesExpanded?: boolean;
}

/**
 * Props for QDSPromptInput wrapper
 *
 * Wraps AI SDK PromptInput with QDS styling and validation.
 */
export interface QDSPromptInputProps extends QDSBaseProps {
  /** Current input value */
  value: string;

  /** Callback when value changes */
  onChange: (value: string) => void;

  /** Callback when form is submitted */
  onSubmit: (value: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is disabled (streaming, loading) */
  disabled?: boolean;

  /** Maximum character length */
  maxLength?: number;

  /** Show character count */
  showCharCount?: boolean;
}

/**
 * Props for QDSSource wrapper
 *
 * Displays a single citation source.
 */
export interface QDSSourceProps extends QDSBaseProps {
  /** Citation to display */
  citation: Citation;

  /** Citation index (for numbering) */
  index: number;

  /** Callback when source is clicked */
  onClick?: (citation: Citation) => void;
}

/**
 * Props for QDSInlineCitation wrapper
 *
 * Displays inline citation marker [1] [2].
 */
export interface QDSInlineCitationProps extends QDSBaseProps {
  /** Citation number */
  citationId: number;

  /** Citation title (for tooltip) */
  title: string;

  /** Callback when citation is clicked */
  onClick: (citationId: number) => void;
}

/**
 * Props for QDSSourcesPanel
 *
 * Displays collapsible panel of citations.
 */
export interface QDSSourcesPanelProps extends QDSBaseProps {
  /** Citations to display */
  citations: Citation[];

  /** Default expanded state */
  defaultExpanded?: boolean;

  /** Callback when source is clicked */
  onSourceClick?: (citation: Citation) => void;
}
```

---

## 7. Enhanced usePersistedChat Hook

### 7.1 Hook Return Type

**File:** `lib/llm/hooks/usePersistedChat.ts` (update return type)

```typescript
import type { ChatStatus } from "ai";
import type {
  QuokkaUIMessage,
  SendMessageResult,
  RegenerateResult,
  StopStreamResult,
  ChatError,
} from "@/lib/models/types";

/**
 * Return type for usePersistedChat hook
 */
export interface UsePersistedChatReturn {
  /** All messages in conversation */
  messages: QuokkaUIMessage[];

  /** Send a new message */
  sendMessage: (content: string) => Promise<void>;

  /** Regenerate last assistant message */
  regenerate: () => Promise<void>;

  /** Stop current streaming response */
  stop: () => void;

  /** Current chat status */
  status: ChatStatus;

  /** Current error (if any) */
  error: ChatError | undefined;

  /** Whether chat is currently streaming */
  isStreaming: boolean;

  /** Whether chat has an error */
  isError: boolean;

  /** Clear current error */
  clearError: () => void;

  /** Set messages (for optimistic updates) */
  setMessages: (
    messages: QuokkaUIMessage[] | ((prev: QuokkaUIMessage[]) => QuokkaUIMessage[])
  ) => void;
}
```

---

## 8. Strict Mode Compliance Checklist

### 8.1 Type Safety Requirements

- [ ] **Zero `any` types** - All types explicitly defined
- [ ] **Type-only imports** - All type imports use `import type`
- [ ] **Generic constraints** - All generics have appropriate constraints
- [ ] **Explicit return types** - All functions have return type annotations
- [ ] **Null/undefined handling** - All nullable fields use `?` or `| null`
- [ ] **Discriminated unions** - Error types use discriminators (`category`)
- [ ] **Type guards** - Runtime validation for all dynamic types
- [ ] **Readonly where appropriate** - Immutable data uses `readonly`
- [ ] **No implicit any** - All parameters typed explicitly

### 8.2 Import Audit Checklist

**Files to Audit:**
- [ ] `lib/llm/hooks/usePersistedChat.ts` - Check all imports
- [ ] `components/ai/quokka-assistant-modal.tsx` - Check all imports
- [ ] `components/ai/sources-panel.tsx` - Check all imports
- [ ] All new wrapper components - Ensure `import type`

---

## 9. Implementation Steps

### 9.1 Phase 1: Type Definitions (No Code Changes)

1. **Add types to `lib/models/types.ts`:**
   - QuokkaMessageMetadata
   - QuokkaUIMessage
   - ChatError types (StreamingError, ConversionError, ChatAPIError)
   - SendMessageResult, RegenerateResult, StopStreamResult

2. **Create `lib/llm/utils/typeGuards.ts`:**
   - All message role guards
   - Metadata guards
   - Message part guards
   - Streaming state guards
   - Error type guards

3. **Create `components/ai/elements/types.ts`:**
   - All QDS wrapper component prop interfaces

### 9.2 Phase 2: Enhanced Converters

1. **Update `lib/llm/hooks/usePersistedChat.ts`:**
   - Replace `aiMessageToUIMessage` with metadata preservation
   - Replace `uiMessageToAIMessage` with full reconstruction
   - Add error handling with ChatError types

2. **Update `lib/llm/utils/citations.ts`:**
   - Add `citationToSourcePart`
   - Add `citationsToSourceParts`

### 9.3 Phase 3: Import Audit

1. **Audit all existing files:**
   - Convert type imports to `import type`
   - Verify no implicit `any` types
   - Add explicit return types

2. **Update imports in:**
   - `lib/llm/hooks/usePersistedChat.ts`
   - `components/ai/quokka-assistant-modal.tsx`
   - `components/ai/sources-panel.tsx`

### 9.4 Phase 4: Type Verification

1. **Run TypeScript compiler:**
   ```bash
   npx tsc --noEmit
   ```

2. **Verify strict mode compliance:**
   - Check for `any` types
   - Check for missing return types
   - Check for implicit any in event handlers

---

## 10. File Modifications Summary

### 10.1 Files to Modify

| File | Changes | Lines Added (Est.) |
|------|---------|-------------------|
| `lib/models/types.ts` | Add QuokkaMessageMetadata, error types, async types | ~200 |
| `lib/llm/hooks/usePersistedChat.ts` | Enhanced converters, error handling | ~50 (replace) |
| `lib/llm/utils/citations.ts` | Add source part converters | ~30 |
| `lib/llm/utils/typeGuards.ts` | **New file** - All type guards | ~250 |
| `components/ai/elements/types.ts` | **New file** - Wrapper component types | ~150 |

### 10.2 Files to Create

1. **`lib/llm/utils/typeGuards.ts`**
   - Purpose: Runtime type validation
   - Exports: 20+ type guard functions
   - Dependencies: `lib/models/types.ts`, `ai` package

2. **`components/ai/elements/types.ts`**
   - Purpose: QDS wrapper component prop types
   - Exports: 7 prop interfaces
   - Dependencies: `lib/models/types.ts`, `ai` package

---

## 11. Testing Strategy

### 11.1 Type-Level Tests

**Create:** `lib/llm/utils/__tests__/typeGuards.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  isAssistantMessage,
  hasCitationMetadata,
  isStreamingMessage,
  isChatError,
} from '../typeGuards';
import type { QuokkaUIMessage } from '@/lib/models/types';

describe('Type Guards', () => {
  it('should identify assistant messages', () => {
    const message: QuokkaUIMessage = {
      id: 'msg-1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hello' }],
    };

    expect(isAssistantMessage(message)).toBe(true);
  });

  // ... more tests
});
```

### 11.2 Conversion Tests

**Create:** `lib/llm/hooks/__tests__/usePersistedChat.test.ts`

```typescript
describe('Message Conversion', () => {
  it('should preserve citation metadata', () => {
    const aiMessage: AIMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Hello [1]\n\n**Sources:**\n1. Test (Type: lecture)',
      timestamp: '2025-10-17T00:00:00Z',
    };

    const uiMessage = aiMessageToUIMessage(aiMessage);

    expect(uiMessage.metadata?.citations).toHaveLength(1);
    expect(uiMessage.metadata?.citations[0].id).toBe(1);
  });
});
```

---

## 12. Success Criteria

### 12.1 Type Safety Verification

✅ `npx tsc --noEmit` passes with zero errors
✅ No `any` types in codebase
✅ All type imports use `import type`
✅ All functions have explicit return types
✅ Generic parameters properly constrained

### 12.2 Functionality Verification

✅ Citation metadata preserved through conversions
✅ Material references preserved
✅ Streaming state correctly typed
✅ Error handling fully typed
✅ Type guards validate runtime data

### 12.3 Documentation Verification

✅ All new types have JSDoc comments
✅ Type guards document validation logic
✅ Conversion functions explain transformation
✅ Error types document error codes

---

## 13. Next Steps After Type Integration

1. **Install AI Elements components**
2. **Inspect actual component prop types**
3. **Create QDS wrapper components** (use types from this plan)
4. **Integrate citations** (use type guards for validation)
5. **Migrate QuokkaAssistantModal** (use QuokkaUIMessage throughout)

---

**Files Created by This Plan:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/llm/utils/typeGuards.ts` (new)
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/ai/elements/types.ts` (new)

**Files Modified by This Plan:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` (~200 lines added)
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/llm/hooks/usePersistedChat.ts` (~50 lines modified)
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/llm/utils/citations.ts` (~30 lines added)

**Estimated Total LOC:** ~680 lines (types + guards + tests)

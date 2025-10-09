# Type Design Plan: Conversation to Thread Conversion

**Date:** 2025-10-08
**Task:** Quokka Conversation to Thread
**Focus:** Complete type-safe design for Message[] to CreateThreadInput transformation

---

## Overview

Design type-safe interfaces, type guards, and function signatures for converting FloatingQuokka conversations into public threads. All types follow strict mode compliance with zero `any` usage.

---

## 1. New Type Definitions

### Location: `lib/models/types.ts`

All new types will be added to the existing types file to maintain centralization.

### 1.1 Message Interface (Export)

**Current:** Local to FloatingQuokka component
**Change:** Export from types.ts for reusability

```typescript
// ============================================
// Conversation & Message Types
// ============================================

/**
 * Represents a single message in a Quokka conversation
 * Used by FloatingQuokka component for chat interactions
 */
export interface Message {
  /** Unique message identifier */
  id: string;

  /** Message sender role */
  role: "user" | "assistant";

  /** Message text content */
  content: string;

  /** Message timestamp (Date object for client-side rendering) */
  timestamp: Date;
}
```

**Rationale:** Export existing interface to avoid duplication

---

### 1.2 ConversationMetadata Interface

**Purpose:** Extract metadata from conversation for thread creation

```typescript
/**
 * Metadata extracted from a conversation for thread creation
 * Contains analysis of conversation structure and content
 */
export interface ConversationMetadata {
  /** Total message count (user + assistant) */
  messageCount: number;

  /** Number of user messages */
  userMessageCount: number;

  /** Number of assistant messages */
  assistantMessageCount: number;

  /** First user message (typically used for title) */
  firstUserMessage: string;

  /** Timestamp of first message */
  startedAt: Date;

  /** Timestamp of last message */
  lastMessageAt: Date;

  /** Whether conversation meets minimum requirements for thread */
  isValidForThread: boolean;
}
```

**Rationale:** Typed metadata prevents runtime errors in title/content extraction

---

### 1.3 FormattedMessage Interface

**Purpose:** Intermediate format for rendering conversation in thread content

```typescript
/**
 * Formatted message for display in thread content
 * Separates original data from display formatting
 */
export interface FormattedMessage {
  /** Original message ID */
  id: string;

  /** Display role (capitalized for rendering) */
  role: "You" | "Quokka";

  /** Formatted content (escaped, trimmed) */
  content: string;

  /** ISO 8601 timestamp string (for persistence) */
  timestamp: string;
}
```

**Rationale:** Clear separation between source data (Message) and rendered format

---

### 1.4 ConversationToThreadInput Interface

**Purpose:** Input for conversion function with all required context

```typescript
/**
 * Input for converting a conversation to a thread
 * Provides all context needed for CreateThreadInput generation
 */
export interface ConversationToThreadInput {
  /** Array of messages to convert (min 2 required) */
  messages: Message[];

  /** Course ID where thread will be posted */
  courseId: string;

  /** Optional custom title (overrides auto-generated) */
  customTitle?: string;

  /** Optional tags to add to thread */
  customTags?: string[];
}
```

**Rationale:** Explicit input type ensures all required data is provided

---

### 1.5 ConversationToThreadResult Interface

**Purpose:** Result of conversion with metadata and preview data

```typescript
/**
 * Result of conversation-to-thread conversion
 * Contains both CreateThreadInput and metadata for preview
 */
export interface ConversationToThreadResult {
  /** Ready-to-use CreateThreadInput for API */
  threadInput: CreateThreadInput;

  /** Metadata about the conversion */
  metadata: ConversationMetadata;

  /** Formatted messages for preview display */
  formattedMessages: FormattedMessage[];

  /** Suggested title (may differ from threadInput.title if customTitle provided) */
  suggestedTitle: string;
}
```

**Rationale:** Comprehensive result type supports both API call and UI preview

---

## 2. Type Guards

### Location: `lib/models/types.ts` (with other type guards)

### 2.1 isValidConversation Type Guard

```typescript
/**
 * Type guard to validate conversation meets thread creation requirements
 *
 * Requirements:
 * - Minimum 2 messages total
 * - At least 1 user message
 * - At least 1 assistant message
 * - All messages have non-empty content
 *
 * @param messages - Array of messages to validate
 * @returns true if conversation is valid for thread creation
 */
export function isValidConversation(messages: Message[]): boolean {
  if (messages.length < 2) return false;

  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  if (userMessages.length === 0 || assistantMessages.length === 0) return false;

  return messages.every((m) => m.content.trim().length > 0);
}
```

**Rationale:** Runtime validation prevents invalid conversions

---

### 2.2 isMessage Type Guard

```typescript
/**
 * Type guard to check if an object is a valid Message
 *
 * @param value - Unknown value to check
 * @returns true if value is a Message
 */
export function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    (obj.role === "user" || obj.role === "assistant") &&
    typeof obj.content === "string" &&
    obj.timestamp instanceof Date
  );
}
```

**Rationale:** Safe validation when reading from localStorage or unknown sources

---

## 3. Conversion Function Signatures

### Location: `lib/utils/conversation-to-thread.ts` (NEW FILE)

### 3.1 extractConversationMetadata

```typescript
import type { Message, ConversationMetadata } from "@/lib/models/types";

/**
 * Extract metadata from conversation messages
 *
 * @param messages - Array of conversation messages
 * @returns Metadata about the conversation
 * @throws Never (returns safe metadata even for invalid conversations)
 */
export function extractConversationMetadata(
  messages: Message[]
): ConversationMetadata;
```

**Implementation Type Notes:**
- Parameter: `messages: Message[]` (not `readonly Message[]` - may be mutated for sorting)
- Return: `ConversationMetadata` (always returns, never null)
- No throws (pure function)

---

### 3.2 generateThreadTitle

```typescript
import type { Message } from "@/lib/models/types";

/**
 * Generate thread title from conversation messages
 *
 * Strategy:
 * 1. Use first user message if ≤100 chars
 * 2. Truncate first user message if >100 chars
 * 3. Fallback to "Conversation with Quokka" if no user messages
 *
 * @param messages - Array of conversation messages
 * @param maxLength - Maximum title length (default: 100)
 * @returns Generated title (never empty)
 */
export function generateThreadTitle(
  messages: Message[],
  maxLength?: number
): string;
```

**Implementation Type Notes:**
- Parameter: `messages: Message[]` (non-empty array expected but handled safely)
- Parameter: `maxLength: number = 100` (optional with default)
- Return: `string` (guaranteed non-empty via fallback)

---

### 3.3 formatConversationContent

```typescript
import type { Message, FormattedMessage } from "@/lib/models/types";

/**
 * Format conversation messages into thread content string
 *
 * Format:
 * ```
 * **You:** [first user message]
 *
 * **Quokka:** [first AI response]
 *
 * **You:** [second user message]
 * ...
 * ```
 *
 * @param messages - Array of conversation messages
 * @returns Markdown-formatted conversation content
 */
export function formatConversationContent(messages: Message[]): string;
```

**Implementation Type Notes:**
- Parameter: `messages: Message[]`
- Return: `string` (markdown format)
- Internal: Uses FormattedMessage for intermediate representation

---

### 3.4 formatMessagesForPreview

```typescript
import type { Message, FormattedMessage } from "@/lib/models/types";

/**
 * Format messages for preview display in modal
 *
 * Converts Message[] to FormattedMessage[] for rendering:
 * - Converts timestamps to ISO strings
 * - Formats roles for display ("You" / "Quokka")
 * - Escapes HTML in content
 *
 * @param messages - Array of conversation messages
 * @returns Array of formatted messages ready for rendering
 */
export function formatMessagesForPreview(
  messages: Message[]
): FormattedMessage[];
```

**Implementation Type Notes:**
- Parameter: `messages: Message[]`
- Return: `FormattedMessage[]` (same length as input)
- Pure function (no side effects)

---

### 3.5 convertConversationToThread (MAIN FUNCTION)

```typescript
import type {
  Message,
  ConversationToThreadInput,
  ConversationToThreadResult,
} from "@/lib/models/types";
import { isValidConversation } from "@/lib/models/types";

/**
 * Convert a conversation to a thread input with metadata
 *
 * Main conversion function that orchestrates all sub-functions.
 * Throws error if conversation is invalid.
 *
 * @param input - Conversion input with messages and context
 * @returns Conversion result with threadInput and metadata
 * @throws {Error} If conversation is invalid for thread creation
 *
 * @example
 * ```typescript
 * const result = convertConversationToThread({
 *   messages: conversation,
 *   courseId: "course-123",
 *   customTags: ["quokka-chat"],
 * });
 *
 * // Use result.threadInput with useCreateThread
 * createThread({ input: result.threadInput, authorId: user.id });
 * ```
 */
export function convertConversationToThread(
  input: ConversationToThreadInput
): ConversationToThreadResult;
```

**Implementation Type Notes:**
- Parameter: `input: ConversationToThreadInput`
- Return: `ConversationToThreadResult`
- Throws: `Error` if `!isValidConversation(input.messages)`
- Uses all helper functions internally

---

## 4. Import Statements

### 4.1 In lib/models/types.ts

No new imports needed (all types are self-contained).

### 4.2 In lib/utils/conversation-to-thread.ts

```typescript
// Type-only imports (use import type)
import type {
  Message,
  ConversationMetadata,
  FormattedMessage,
  ConversationToThreadInput,
  ConversationToThreadResult,
  CreateThreadInput,
} from "@/lib/models/types";

// Runtime imports (type guards are functions)
import { isValidConversation } from "@/lib/models/types";
```

**Rationale:** Clear separation between type-only and runtime imports

### 4.3 In components/course/floating-quokka.tsx

```typescript
// REPLACE local interface with import
import type { Message } from "@/lib/models/types";

// REMOVE:
// interface Message { ... }
```

**Rationale:** Use centralized type definition

---

## 5. File Locations Summary

| File | Purpose | Changes |
|------|---------|---------|
| `lib/models/types.ts` | Type definitions | Add 5 new interfaces, 2 type guards |
| `lib/utils/conversation-to-thread.ts` | Conversion logic | NEW FILE - 5 functions |
| `components/course/floating-quokka.tsx` | Chat component | Replace local Message with import |

---

## 6. Type Safety Verification Checklist

Before implementation, verify:

- [ ] All types exported from `lib/models/types.ts`
- [ ] All type-only imports use `import type`
- [ ] Zero `any` types (use `unknown` with guards if needed)
- [ ] All function parameters explicitly typed
- [ ] All function returns explicitly typed
- [ ] Type guards use `is` keyword correctly
- [ ] All interfaces have JSDoc comments
- [ ] Complex types use utility types (Pick, Omit, etc.) where appropriate
- [ ] All edge cases documented in JSDoc
- [ ] No type assertions (`as`) without justification comments

---

## 7. Type-Level Tests

Recommended type-level tests (conceptual - verified at compile time):

```typescript
// Test 1: Message is assignable to ConversationToThreadInput.messages
const msg: Message = { id: "1", role: "user", content: "Hi", timestamp: new Date() };
const input: ConversationToThreadInput = {
  messages: [msg],
  courseId: "course-1",
};

// Test 2: ConversationToThreadResult.threadInput is valid CreateThreadInput
const result: ConversationToThreadResult = convertConversationToThread(input);
const threadInput: CreateThreadInput = result.threadInput; // Should compile

// Test 3: Type guard narrows correctly
const unknown: unknown = getMessages();
if (Array.isArray(unknown) && unknown.every(isMessage)) {
  const typed: Message[] = unknown; // Should compile
}
```

---

## 8. Generic Constraints

No generics needed for this feature. All types are concrete.

**Rationale:** Conversation conversion has fixed types (Message → CreateThreadInput). Generics would add complexity without benefit.

---

## 9. Discriminated Unions

Not applicable for this feature.

**Rationale:** No variant types needed. All conversions follow same structure.

---

## 10. Utility Type Usage

### Pick<T, K>

Not needed initially, but could be used for:
```typescript
type ThreadPreview = Pick<Thread, "id" | "title" | "content">;
```

### Omit<T, K>

Not needed (no properties to exclude).

### Readonly<T>

Consider for function parameters that shouldn't be mutated:
```typescript
export function formatConversationContent(
  messages: readonly Message[]
): string;
```

**Decision:** Use `readonly` for formatMessagesForPreview and formatConversationContent.

---

## 11. Async Type Safety

All conversion functions are synchronous (no Promises).

**Rationale:** Pure data transformation, no async operations needed.

---

## 12. React Component Prop Types

For ConversationToThreadModal (designed by Component Architect):

```typescript
export interface ConversationToThreadModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Conversation messages to convert */
  messages: Message[];

  /** Course context */
  courseId: string;
  courseName: string;

  /** Success handler - called after thread is created */
  onSuccess?: (threadId: string) => void;
}
```

**Type Safety Notes:**
- All required props explicitly marked
- Optional props use `?` operator
- Function types use explicit signatures
- No implicit `any` from React

---

## 13. Implementation Order

1. **Add types to lib/models/types.ts:**
   - Export Message interface
   - Add ConversationMetadata
   - Add FormattedMessage
   - Add ConversationToThreadInput
   - Add ConversationToThreadResult
   - Add isValidConversation type guard
   - Add isMessage type guard

2. **Update components/course/floating-quokka.tsx:**
   - Replace local Message interface with import

3. **Create lib/utils/conversation-to-thread.ts:**
   - Implement extractConversationMetadata
   - Implement generateThreadTitle
   - Implement formatConversationContent
   - Implement formatMessagesForPreview
   - Implement convertConversationToThread

4. **Verify TypeScript compilation:**
   - Run `npx tsc --noEmit`
   - Ensure zero errors

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Message interface change breaks FloatingQuokka | HIGH | Update FloatingQuokka in same commit |
| Type imports create circular dependency | HIGH | Keep types in types.ts, logic in utils/ |
| Conversion function throws unexpectedly | MEDIUM | Comprehensive input validation with type guard |
| FormattedMessage diverges from Message | LOW | Clear JSDoc documenting differences |

---

## 15. Success Criteria

Type design is complete when:

- [ ] All types compile under strict mode with zero errors
- [ ] All types are exported from `lib/models/types.ts`
- [ ] All imports use `import type` correctly
- [ ] Zero `any` types in implementation
- [ ] All functions have explicit parameter and return types
- [ ] Type guards implemented for runtime validation
- [ ] JSDoc comments added for all public types and functions
- [ ] FloatingQuokka uses imported Message type
- [ ] Conversion utilities type-check correctly

---

## Summary

**New Types:** 5 interfaces
**New Type Guards:** 2 functions
**New Functions:** 5 conversion utilities
**Files Modified:** 2 (types.ts, floating-quokka.tsx)
**Files Created:** 1 (conversation-to-thread.ts)
**Zero `any` Types:** GUARANTEED
**Strict Mode Compliance:** FULL

All types follow established patterns from existing codebase. Implementation will be type-safe and maintainable.

# Type Patterns Research - AI SDK Elements Integration

**Date:** 2025-10-17
**Task:** ai-sdk-elements-ui-upgrade
**Focus:** Type system analysis for AI SDK Elements integration

---

## 1. Existing Type System Analysis

### 1.1 Core Types (`lib/models/types.ts`)

**AIMessage Type (lines 1885-1906):**
```typescript
export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;  // ISO 8601 string
  materialReferences?: MaterialReference[];
  confidenceScore?: number;
}
```

**Conversation Type (lines 1850-1877):**
```typescript
export interface AIConversation {
  id: string;
  userId: string;
  courseId: string | null;  // null = multi-course context
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  convertedToThread?: boolean;
  threadId?: string;
}
```

**MaterialReference Type (lines 276-300):**
```typescript
export interface MaterialReference {
  materialId: string;
  type: CourseMaterialType;
  title: string;
  excerpt: string;
  relevanceScore: number;
  link?: string;
}
```

**Citation Type (`lib/llm/utils/citations.ts`, lines 8-13):**
```typescript
export interface Citation {
  id: number;
  title: string;
  type: string;
  materialId?: string;
}
```

### 1.2 AI SDK Types (`@ai-sdk/react`)

**UIMessage Type (from `ai` package, lines 1408-1432):**
```typescript
interface UIMessage<
  METADATA = unknown,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools
> {
  id: string;
  role: 'system' | 'user' | 'assistant';
  metadata?: METADATA;
  parts: Array<UIMessagePart<DATA_PARTS, TOOLS>>;
}
```

**UIMessagePart Types:**
```typescript
type UIMessagePart<DATA_TYPES, TOOLS> =
  | TextUIPart           // { type: 'text'; text: string; state?: 'streaming' | 'done' }
  | ReasoningUIPart      // { type: 'reasoning'; text: string }
  | ToolUIPart<TOOLS>    // Tool invocations
  | SourceUrlUIPart      // { type: 'source-url'; sourceId: string; url: string; title?: string }
  | SourceDocumentUIPart // { type: 'source-document'; sourceId: string; mediaType: string; title: string }
  | FileUIPart           // { type: 'file'; mediaType: string; url: string }
  | DataUIPart<DATA_TYPES>
  | StepStartUIPart
```

**useChat Return Type (`@ai-sdk/react`, lines 15-27):**
```typescript
type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
  readonly id: string;
  setMessages: (messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])) => void;
  error: Error | undefined;
} & Pick<AbstractChat<UI_MESSAGE>,
  'sendMessage' | 'regenerate' | 'stop' | 'resumeStream' |
  'addToolResult' | 'status' | 'messages' | 'clearError'
>;
```

**ChatStatus Type:**
```typescript
type ChatStatus = 'pending' | 'streaming' | 'done' | 'error';
```

### 1.3 Current Type Conversions (`lib/llm/hooks/usePersistedChat.ts`)

**AIMessage → UIMessage (lines 32-38):**
```typescript
function aiMessageToUIMessage(aiMessage: AIMessage): UIMessage {
  return {
    id: aiMessage.id,
    role: aiMessage.role,
    parts: [{ type: "text", text: aiMessage.content }],
  };
}
```

**UIMessage → AIMessage (lines 43-63):**
```typescript
function uiMessageToAIMessage(
  message: UIMessage,
  conversationId: string
): AIMessage {
  // Extract text from parts
  const textParts = message.parts.filter((p) => p.type === "text");
  const content = textParts.map((p) => ("text" in p ? p.text : "")).join("\n");

  // Validate role
  if (message.role !== "user" && message.role !== "assistant") {
    throw new Error(`Unexpected message role: ${message.role}`);
  }

  return {
    id: message.id,
    conversationId,
    role: message.role,
    content,
    timestamp: new Date().toISOString(),
  };
}
```

**Issues:**
- No preservation of `materialReferences` or `confidenceScore`
- Loses citation data during conversion
- No support for SourceUrlUIPart or SourceDocumentUIPart

---

## 2. AI SDK Elements Component Types

### 2.1 Component Types (Expected from shadcn/ui AI Elements)

**Note:** AI Elements are not yet installed. These are expected types based on shadcn/ui AI component patterns.

**Expected Components:**
1. `Conversation` - Container for message list
2. `Message` - Individual message display
3. `Response` - AI response with streaming support
4. `Actions` - Message actions (copy, regenerate, etc.)
5. `PromptInput` - Input field with submit
6. `Source` - Citation/source display
7. `InlineCitation` - Inline citation marker

**Expected Props Patterns:**

```typescript
// Conversation Component (expected)
interface ConversationProps {
  messages: UIMessage[];
  isLoading?: boolean;
  error?: Error;
  children?: React.ReactNode;
  className?: string;
}

// Message Component (expected)
interface MessageProps {
  message: UIMessage;
  isLoading?: boolean;
  showActions?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

// Response Component (expected)
interface ResponseProps {
  message: UIMessage;
  status?: ChatStatus;
  onStop?: () => void;
  showSources?: boolean;
  className?: string;
}

// PromptInput Component (expected)
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Source Component (expected)
interface SourceProps {
  citation: Citation;
  index: number;
  className?: string;
}
```

### 2.2 Type Integration Points

**Key Requirements:**
1. UIMessage compatibility - all components must accept `UIMessage`
2. Citation data - must support both inline markers and sources panel
3. Streaming support - must handle `status: 'streaming'` state
4. Material references - preserve `MaterialReference[]` in message metadata

---

## 3. Citation System Analysis

### 3.1 Current Citation Parser (`lib/llm/utils/citations.ts`)

**ParsedCitations Interface (lines 15-24):**
```typescript
export interface ParsedCitations {
  citations: Citation[];            // Parsed from **Sources:** section
  citationMarkers: Set<number>;     // [1] [2] markers found in text
  contentWithoutSources: string;    // Clean text without sources
  sourcesSection: string | null;    // Raw sources section
}
```

**Parser Function (lines 41-92):**
- Extracts inline `[1]` markers using regex `/\[(\d+)\]/g`
- Finds **Sources:** section using `/\*\*Sources:\*\*\s*([\s\S]*?)(?:\n\n|$)/`
- Parses source entries: `"1. Title (Type: lecture)"`
- Returns structured citations

**Current Usage in QuokkaAssistantModal (lines 49-100):**
```typescript
// Parse citations from assistant message
const parsed = parseCitations(messageText);

// Render text with inline markers
{renderTextWithCitations(parsed.contentWithoutSources, parsed.citations)}

// Display sources panel
{parsed.citations.length > 0 && (
  <SourcesPanel citations={parsed.citations} defaultExpanded={true} />
)}
```

### 3.2 Citation Integration Requirements

**Must Support:**
1. **Inline Citation Markers** - `[1]` `[2]` with hover tooltips
2. **Sources Panel** - Collapsible list of citations
3. **Citation Scrolling** - Click marker to scroll to source
4. **Keyboard Navigation** - Tab, Enter, Space on markers
5. **ARIA Attributes** - `role="button"`, `aria-label`

**Type Design:**
```typescript
// Extended UIMessage with citation metadata
interface CitedUIMessage extends UIMessage {
  metadata?: {
    citations?: Citation[];
    sourcesSection?: string;
  };
}
```

---

## 4. Type Safety Violations Found

### 4.1 Current Violations

**1. Type Conversion Data Loss (usePersistedChat.ts):**
- `materialReferences` not preserved during UIMessage ↔ AIMessage conversion
- `confidenceScore` lost in conversion
- No validation of conversion success

**2. Implicit `any` in Event Handlers (quokka-assistant-modal.tsx):**
```typescript
// Line 89 - implicit any in keyboard event
onKeyDown={(e) => {  // 'e' inferred as any
  if (e.key === "Enter" || e.key === " ") {
    // ...
  }
}}
```

**3. Missing Type Annotations:**
- `renderTextWithCitations` return type not explicit
- `getMessageText` should specify return type

**4. Loose Type Definitions:**
- `citations` prop in `SourcesPanel` typed as `Array<{ id: number; title: string }>` instead of `Citation[]`

### 4.2 Type Import Violations

**Missing `import type` Statements:**

```typescript
// ❌ BAD (quokka-assistant-modal.tsx, line 5)
import type { UIMessage } from "@ai-sdk/react";

// ✅ GOOD - but check for other type imports
import type { CourseSummary } from "@/lib/models/types";
```

**Need to Audit:**
- All component imports (Dialog, Button, etc.) - runtime OK
- All type-only imports - must use `import type`

---

## 5. Generic Type Parameters

### 5.1 UIMessage Generic Parameters

**Default Signature:**
```typescript
UIMessage<METADATA = unknown, DATA_PARTS extends UIDataTypes = UIDataTypes, TOOLS extends UITools = UITools>
```

**Recommended Specialization for Quokka:**
```typescript
// Define custom metadata type
interface QuokkaMessageMetadata {
  citations?: Citation[];
  materialReferences?: MaterialReference[];
  confidenceScore?: number;
  sourcesSection?: string;
}

// Specialize UIMessage
type QuokkaUIMessage = UIMessage<QuokkaMessageMetadata>;
```

**Benefits:**
- Type-safe metadata access
- No casting required
- IDE autocomplete for metadata fields
- Compile-time validation

### 5.2 useChat Generic Parameter

**Current Usage (usePersistedChat.ts, line 120):**
```typescript
const chat = useChat({
  id: conversationId || undefined,
  messages: initialMessages,
  // ...
});
```

**Recommended Specialization:**
```typescript
const chat = useChat<QuokkaUIMessage>({
  id: conversationId || undefined,
  messages: initialMessages,
  // ...
});
```

---

## 6. Type Guard Requirements

### 6.1 Required Type Guards

**1. Message Role Guard:**
```typescript
function isAssistantMessage(message: UIMessage): message is UIMessage & { role: 'assistant' } {
  return message.role === 'assistant';
}

function isUserMessage(message: UIMessage): message is UIMessage & { role: 'user' } {
  return message.role === 'user';
}
```

**2. Citation Metadata Guard:**
```typescript
function hasCitationMetadata(message: UIMessage): message is QuokkaUIMessage & {
  metadata: { citations: Citation[] }
} {
  return (
    message.metadata !== undefined &&
    typeof message.metadata === 'object' &&
    'citations' in message.metadata &&
    Array.isArray((message.metadata as any).citations)
  );
}
```

**3. Message Part Type Guards:**
```typescript
function isTextPart(part: UIMessagePart): part is TextUIPart {
  return part.type === 'text';
}

function isSourceUrlPart(part: UIMessagePart): part is SourceUrlUIPart {
  return part.type === 'source-url';
}

function isSourceDocumentPart(part: UIMessagePart): part is SourceDocumentUIPart {
  return part.type === 'source-document';
}
```

### 6.2 Streaming State Guards

```typescript
function isStreamingMessage(message: UIMessage): boolean {
  return message.parts.some((part) =>
    part.type === 'text' && (part as TextUIPart).state === 'streaming'
  );
}

function isCompleteMessage(message: UIMessage): boolean {
  return message.parts.every((part) =>
    part.type !== 'text' || (part as TextUIPart).state === 'done'
  );
}
```

---

## 7. Error Handling Types

### 7.1 Current Error Handling

**usePersistedChat (line 165):**
```typescript
error: undefined, // TODO: Add error handling
```

**Required Error Types:**
```typescript
// Streaming errors
interface StreamingError extends Error {
  code: 'STREAM_INTERRUPTED' | 'STREAM_TIMEOUT' | 'STREAM_ABORT';
  conversationId: string;
  messageId?: string;
}

// Conversion errors
interface ConversionError extends Error {
  code: 'INVALID_ROLE' | 'MISSING_CONTENT' | 'INVALID_FORMAT';
  originalMessage: UIMessage | AIMessage;
}

// API errors
interface ChatAPIError extends Error {
  code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'RATE_LIMIT' | 'UNAUTHORIZED';
  statusCode?: number;
  retryable: boolean;
}

// Discriminated union
type ChatError = StreamingError | ConversionError | ChatAPIError;
```

### 7.2 Error Type Guards

```typescript
function isStreamingError(error: Error): error is StreamingError {
  return 'code' in error &&
    ['STREAM_INTERRUPTED', 'STREAM_TIMEOUT', 'STREAM_ABORT'].includes((error as any).code);
}

function isRetryableError(error: Error): error is ChatAPIError & { retryable: true } {
  return 'retryable' in error && (error as ChatAPIError).retryable === true;
}
```

---

## 8. Async Type Safety

### 8.1 Promise Return Types

**Current Issues:**
- `usePersistedChat` does not expose async operation types
- No type for pending state transitions

**Required Async Types:**
```typescript
// Send message result
interface SendMessageResult {
  success: boolean;
  messageId: string;
  error?: ChatError;
}

// Regenerate result
interface RegenerateResult {
  success: boolean;
  newMessageId: string;
  error?: ChatError;
}
```

### 8.2 Hook Return Type Enhancement

```typescript
interface UsePersistedChatReturn {
  messages: QuokkaUIMessage[];
  sendMessage: (content: string) => Promise<SendMessageResult>;
  regenerate: () => Promise<RegenerateResult>;
  stop: () => void;
  status: ChatStatus;
  error: ChatError | undefined;
  isStreaming: boolean;
  isError: boolean;
}
```

---

## 9. Key Findings Summary

### 9.1 Type System Strengths
✅ Strong base types in `lib/models/types.ts`
✅ Proper use of discriminated unions (AuthResult, LLMResponse)
✅ Comprehensive type guards for domain types
✅ Good separation of concerns (AIMessage vs UIMessage)

### 9.2 Type System Weaknesses
❌ Data loss in AIMessage ↔ UIMessage conversion
❌ No citation metadata preservation
❌ Missing error types for async operations
❌ Implicit `any` in event handlers
❌ Generic parameters not specialized
❌ Type-only imports not consistently used

### 9.3 Integration Challenges
⚠️ AI Elements components not yet installed (must check actual types)
⚠️ Citation system needs metadata integration
⚠️ Streaming state management requires type guards
⚠️ Source parts (SourceUrlUIPart, SourceDocumentUIPart) not used

### 9.4 Recommended Approach
1. **Specialize UIMessage** - Create `QuokkaUIMessage` with custom metadata
2. **Enhance Converters** - Preserve all metadata in conversions
3. **Add Type Guards** - Runtime validation for message parts and states
4. **Define Error Types** - Discriminated union for all error cases
5. **Install AI Elements** - Inspect actual component prop types
6. **Create Wrappers** - Type-safe QDS-styled wrappers around AI Elements

---

**Next Steps:**
1. Install AI Elements components
2. Inspect actual component prop types
3. Create type integration plan with exact interfaces
4. Design wrapper component types

---

**Files Referenced:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts`
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/llm/hooks/usePersistedChat.ts`
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/llm/utils/citations.ts`
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/ai/quokka-assistant-modal.tsx`
- `/Users/dgz/projects-professional/quokka/quokka-demo/node_modules/@ai-sdk/react/dist/index.d.ts`
- `/Users/dgz/projects-professional/quokka/quokka-demo/node_modules/ai/dist/index.d.ts`

# Component Architecture Analysis - AI Chat System

**Date:** 2025-10-17
**Scope:** AI conversation components (`components/ai/**`)
**Focus:** Reusability, composition patterns, separation of concerns

---

## Executive Summary

**Overall Assessment:** 🟡 **GOOD with Refactoring Opportunities**

The AI chat system demonstrates solid architectural principles with well-abstracted QDS wrapper components, but the main modal (550 lines) violates the <200 LoC guideline and contains significant business logic that limits reusability.

**Critical Findings:**
1. ✅ **QDS Elements** - Excellent abstraction (~50-140 lines each, props-driven, reusable)
2. ❌ **QuokkaAssistantModal** - Too large (550 lines), violates C-5 guideline (<200 LoC)
3. ⚠️ **Conversation Logic** - Business logic mixed with presentation in modal
4. ⚠️ **State Management** - 8 local state variables + 5 refs = high complexity
5. ✅ **Citation System** - Well-separated, composable components

---

## Current Architecture

### Component Hierarchy

```
QuokkaAssistantModal (550 LoC) 🔴 TOO LARGE
├── Dialog (shadcn/ui)
│   ├── DialogHeader
│   │   ├── Avatar (Quokka icon)
│   │   ├── Select (course selector) - dashboard only
│   │   └── DialogTitle/Description
│   ├── QDSConversation (82 LoC) ✅
│   │   ├── Conversation (AI Elements primitive)
│   │   ├── ConversationContent
│   │   ├── QDSMessage (143 LoC) ✅
│   │   │   ├── Message (AI Elements primitive)
│   │   │   ├── Avatar (user/assistant)
│   │   │   ├── QDSResponse (115 LoC) ✅
│   │   │   │   └── QDSInlineCitation (50 LoC) ✅
│   │   │   ├── QDSActions (57 LoC) ✅
│   │   │   └── SourcesPanel (166 LoC)
│   │   └── Streaming Indicator
│   ├── Quick Prompts (conditional)
│   ├── Action Buttons (Post/Clear)
│   └── QDSPromptInput (81 LoC) ✅
├── AlertDialog (Clear confirmation)
├── AlertDialog (Post confirmation - dashboard only)
└── AlertDialog (Post success)
```

### File Structure

```
components/ai/
├── quokka-assistant-modal.tsx       550 LoC 🔴
├── sources-panel.tsx                166 LoC ✅
└── elements/
    ├── index.ts                      24 LoC (barrel export)
    ├── types.ts                     188 LoC (TypeScript interfaces)
    ├── qds-conversation.tsx          82 LoC ✅
    ├── qds-message.tsx              143 LoC ✅
    ├── qds-response.tsx             115 LoC ✅
    ├── qds-actions.tsx               57 LoC ✅
    ├── qds-prompt-input.tsx          81 LoC ✅
    └── qds-inline-citation.tsx       50 LoC ✅

Total: ~1,456 LoC across 9 files
Modal alone: 550 LoC (38% of total)
```

---

## Strengths

### 1. QDS Elements Abstraction ✅

**Excellent separation of concerns** - Each QDS wrapper component follows best practices:

**QDSConversation (82 LoC)**
```typescript
// Props-driven, no hardcoded values
interface QDSConversationProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  canRetry?: boolean;
  pageContext?: "dashboard" | "course" | "instructor";
  courseCode?: string;
  className?: string;
}
```

**Strengths:**
- ✅ All data via props (C-3)
- ✅ Callbacks for event handling (no mutations)
- ✅ `className` prop for style composition
- ✅ Optional props with sensible defaults
- ✅ Explicit TypeScript interfaces (C-1)

**QDSMessage (143 LoC)**
```typescript
// Pure presentation component
export function QDSMessage({
  message,
  onCopy,
  onRetry,
  isLast = false,
  isStreaming = false,
  className,
}: QDSMessageProps) {
  // Parse citations
  const parsed = message.role === "assistant" ? parseCitations(messageText) : null;

  // Render with composition
  return (
    <div className={cn("group mb-6", className)}>
      <Avatar />
      <MessageContent>
        <QDSResponse content={displayText} citations={parsed.citations} />
        <QDSActions ... />
        <SourcesPanel ... />
      </MessageContent>
    </div>
  );
}
```

**Strengths:**
- ✅ Composition over monolithic structure
- ✅ Smart/dumb separation (parsing logic isolated)
- ✅ Leverages existing components (Avatar, SourcesPanel)
- ✅ Conditional rendering based on props

### 2. TypeScript Excellence ✅

**All components use strict types:**
- ✅ No `any` types found (C-1)
- ✅ `import type` for type-only imports (C-2)
- ✅ Exported interfaces for reuse (C-11)
- ✅ Discriminated unions for variants

**Example:**
```typescript
// types.ts
export interface QuokkaMessageMetadata {
  citations?: Array<{
    id: number;
    title: string;
    type?: string;
    url?: string;
  }>;
  materialReferences?: string[];
  confidenceScore?: number;
}

export type QuokkaUIMessage = UIMessage & {
  metadata?: QuokkaMessageMetadata;
};
```

### 3. Citation System Architecture ✅

**Well-designed separation:**

```
Citation Flow:
1. QDSMessage extracts message text
2. parseCitations() extracts citations + strips Sources section
3. QDSResponse renders text with QDSInlineCitation markers
4. SourcesPanel displays expandable sources list
5. Click handlers scroll to citations
```

**Reusability:**
- ✅ `parseCitations()` utility (pure function, testable)
- ✅ `QDSInlineCitation` component (standalone, composable)
- ✅ `SourcesPanel` component (independent, reusable)
- ✅ Clean data flow (no prop drilling)

### 4. Accessibility First ✅

**QDS elements maintain WCAG 2.2 AA compliance:**
- ✅ Semantic HTML (`role="log"`, `role="status"`)
- ✅ ARIA attributes (`aria-live`, `aria-label`)
- ✅ Keyboard navigation (`tabIndex={0}`, `onKeyDown`)
- ✅ Screen reader support (`sr-only` text)
- ✅ Touch targets ≥44px (`min-h-[44px]`)

---

## Weaknesses

### 1. QuokkaAssistantModal Violates Size Guideline 🔴

**Critical Issue: 550 lines (C-5 requires <200 LoC)**

**Complexity Metrics:**
- 8 local state variables (`useState`)
- 1 ref (`useRef`)
- 5 useMemo/useEffect hooks
- 12 handler functions
- 3 AlertDialogs (Clear, Post Confirm, Post Success)
- Conditional rendering logic (dashboard vs course vs instructor)
- Multi-course selection logic
- Conversation lifecycle management

**Comparison to Similar Components:**
- `ThreadModal`: 78 LoC (✅ follows guideline)
- `QDSConversation`: 82 LoC (✅)
- `QDSMessage`: 143 LoC (✅ reasonable for composite)

**ThreadModal Pattern (78 LoC):**
```typescript
export function ThreadModal({ open, onOpenChange, threadId }: ThreadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh]">
        <ThreadDetailPanel threadId={threadId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

**Why This Works:**
- ✅ Modal = presentation wrapper only
- ✅ Business logic in `ThreadDetailPanel`
- ✅ Clear separation of concerns
- ✅ Easy to test and reuse

### 2. Mixed Concerns in Modal ⚠️

**Business Logic Should Be Lifted:**

**Currently in Modal:**
```typescript
// Conversation lifecycle
useEffect(() => {
  if (!isOpen || !user || activeConversationId) return;

  if (conversations && conversations.length > 0) {
    const contextConversations = activeCourseId
      ? conversations.filter((c) => c.courseId === activeCourseId)
      : conversations.filter((c) => c.courseId === null);

    if (contextConversations.length > 0) {
      setActiveConversationId(contextConversations[0].id);
      return;
    }
  }

  createConversation.mutate(...);
}, [isOpen, user, conversations, activeCourseId, ...]);

// Clear conversation
const handleClearConversation = () => {
  deleteConversation.mutate(...);
  setActiveConversationId(null);
  createConversation.mutate(...);
};

// Post as thread
const handlePostAsThread = () => {
  convertToThread.mutate(...);
};

// Course selection
const handleCourseSelect = (courseId: string) => {
  setSelectedCourseId(courseId === "all" ? null : courseId);
  setActiveConversationId(null);
};
```

**Problem:**
- ❌ 120 lines of business logic (22% of component)
- ❌ Makes modal untestable in isolation
- ❌ Difficult to reuse conversation UI elsewhere
- ❌ Tight coupling to specific page contexts

**Should Be:**
- Container component manages state/data
- Presentation component renders UI
- Business logic in hooks or context

### 3. State Management Complexity ⚠️

**8 Local State Variables:**
```typescript
const [input, setInput] = useState("");
const [showClearConfirm, setShowClearConfirm] = useState(false);
const [showPostSuccess, setShowPostSuccess] = useState(false);
const [postedThreadId, setPostedThreadId] = useState<string | null>(null);
const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
const [showPostConfirm, setShowPostConfirm] = useState(false);
const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
```

**Issues:**
- ⚠️ High cognitive load (8 pieces of state to track)
- ⚠️ 3 separate dialog states (could be unified)
- ⚠️ Some state could be derived (e.g., `canPost` from `messages.length`)

**Reducer Pattern Would Help:**
```typescript
type ModalState = {
  input: string;
  activeDialog: null | "clear" | "post-confirm" | "post-success";
  selectedCourseId: string | null;
  activeConversationId: string | null;
  postedThreadId: string | null;
};
```

### 4. Limited Reusability ⚠️

**Current Usage:**
- Dashboard: Multi-course selector
- Course Page: Single course context
- Instructor: Instructor-specific prompts

**Cannot Reuse For:**
- ❌ Standalone chat page (too much modal logic)
- ❌ Embedded chat widget (too opinionated)
- ❌ Thread detail conversation (different context)
- ❌ Mobile-first chat interface (desktop-centric)

**Why:**
- Business logic baked into component
- Modal wrapper not separable
- Context-specific behaviors hardcoded
- No render prop or slot pattern

### 5. Quick Prompts Hardcoded ⚠️

**Violates C-3 (no hardcoded values):**
```typescript
const getQuickPrompts = (): string[] => {
  if (pageContext === "course") {
    if (currentCourseCode?.startsWith("CS")) {
      return ["What is binary search?", "Explain Big O notation"];
    }
    // ... more hardcoded prompts
  }
  return ["Study strategies", "Time management tips"];
};
```

**Issues:**
- ❌ Not data-driven
- ❌ Cannot customize per course
- ❌ Not translatable (i18n)
- ❌ Difficult to A/B test

**Should Be:**
```typescript
interface QuokkaAssistantModalProps {
  quickPrompts?: string[];  // Accept via props
}
```

---

## Duplication Analysis

### 1. Dialog State Pattern (Repeated 3 Times)

**Pattern:**
```typescript
const [showClearConfirm, setShowClearConfirm] = useState(false);
const [showPostConfirm, setShowPostConfirm] = useState(false);
const [showPostSuccess, setShowPostSuccess] = useState(false);
```

**Each Rendered As:**
```tsx
<AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>...</AlertDialogHeader>
    <AlertDialogFooter>...</AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Could Be:**
```typescript
// Unified confirmation dialog component
<ConfirmationDialog
  type="clear" | "post" | "success"
  open={activeDialog === type}
  onConfirm={handleConfirm}
  onCancel={() => setActiveDialog(null)}
  config={dialogConfigs[type]}
/>
```

### 2. Message Text Extraction (Duplicated Logic)

**In qds-message.tsx:**
```typescript
function getMessageText(message: QDSMessageProps["message"]): string {
  if (message.parts && message.parts.length > 0) {
    const textParts = message.parts
      .filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join("\n");
    }
  }

  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  return "";
}
```

**Also appears in:**
- Citation parsing logic
- Copy handler
- Response rendering

**Should Be:**
```typescript
// lib/llm/utils/messages.ts
export function extractMessageText(message: UIMessage): string { ... }
```

---

## Composition Patterns Analysis

### Current Patterns

#### 1. Wrapper Pattern (QDS Elements) ✅

**Example: QDSConversation wraps AI Elements Conversation**
```tsx
export function QDSConversation({ messages, isStreaming, ... }: QDSConversationProps) {
  return (
    <Conversation className={cn("sidebar-scroll", className)}>
      <ConversationContent role="log" aria-live="polite">
        {messages.map(message => (
          <QDSMessage key={message.id} message={message} ... />
        ))}
        {isStreaming && <StreamingIndicator />}
      </ConversationContent>
    </Conversation>
  );
}
```

**Strengths:**
- ✅ Clean abstraction over AI SDK primitives
- ✅ QDS styling applied consistently
- ✅ Accessibility baked in
- ✅ Easy to swap underlying implementation

#### 2. Composition Pattern (QDSMessage) ✅

**Example: QDSMessage composes sub-components**
```tsx
export function QDSMessage({ message, ... }: QDSMessageProps) {
  return (
    <div>
      <Avatar />
      <QDSResponse content={displayText} citations={citations} />
      <QDSActions onCopy={onCopy} onRetry={onRetry} />
      <SourcesPanel citations={citations} />
    </div>
  );
}
```

**Strengths:**
- ✅ Small, focused components
- ✅ Clear hierarchy
- ✅ Easy to test individually
- ✅ Swappable sub-components

### Missing Patterns

#### 1. Container/Presenter Pattern ❌

**Should Be:**
```tsx
// QuokkaAssistantContainer.tsx (business logic)
export function QuokkaAssistantContainer({ pageContext, ... }: ContainerProps) {
  const {
    messages,
    sendMessage,
    clearConversation,
    postAsThread,
  } = useQuokkaAssistant({ pageContext, courseId });

  return (
    <QuokkaAssistantModal
      messages={messages}
      onSendMessage={sendMessage}
      onClear={clearConversation}
      onPost={postAsThread}
      ...
    />
  );
}

// QuokkaAssistantModal.tsx (presentation only)
export function QuokkaAssistantModal({
  messages,
  onSendMessage,
  onClear,
  onPost,
}: PresentationProps) {
  // Pure UI rendering, no business logic
}
```

#### 2. Render Props / Slot Pattern ❌

**Could Enable:**
```tsx
<QuokkaAssistantModal
  header={<CustomHeader />}
  footer={<CustomFooter />}
  quickPrompts={<CustomPrompts />}
>
  {/* Custom conversation renderer */}
  <CustomConversation />
</QuokkaAssistantModal>
```

#### 3. Compound Component Pattern ❌

**Could Enable:**
```tsx
<QuokkaAssistant>
  <QuokkaAssistant.Header courseId={courseId} />
  <QuokkaAssistant.Conversation messages={messages} />
  <QuokkaAssistant.QuickPrompts prompts={prompts} />
  <QuokkaAssistant.Input onSubmit={handleSubmit} />
</QuokkaAssistant>
```

---

## Performance Analysis

### Current Optimizations ✅

1. **Memoization (useMemo):**
```typescript
const activeCourseId = useMemo(() => {
  if (pageContext === "course" && currentCourseId) return currentCourseId;
  if (selectedCourseId) return selectedCourseId;
  return null;
}, [pageContext, currentCourseId, selectedCourseId]);
```

2. **Persisted Chat Hook:**
```typescript
const chat = usePersistedChat({
  conversationId: activeConversationId,
  courseId: activeCourseId,
  userId: user?.id || "",
});
```

3. **Conditional Rendering:**
```typescript
{messages.length === 0 && <QuickPrompts />}
{messages.length > 0 && <ActionButtons />}
```

### Missing Optimizations ⚠️

1. **No React.memo on QDS Elements:**
```typescript
// Should be:
export const QDSMessage = React.memo(function QDSMessage({ ... }) {
  // ...
});
```

2. **Missing useCallback for Handlers:**
```typescript
// Currently: New function instance on every render
const handleCopy = async (content: string) => { ... };

// Should be:
const handleCopy = useCallback(async (content: string) => { ... }, []);
```

3. **No Virtualization for Long Conversations:**
- Large message lists (100+ messages) could cause lag
- No windowing/virtualization implemented
- Consider `react-window` or `@tanstack/react-virtual`

---

## Side Effects Isolation

### useEffect Usage (4 instances)

**1. Auto-load/create conversation (Lines 134-164):**
```typescript
useEffect(() => {
  if (!isOpen || !user || activeConversationId) return;
  // ... conversation loading/creation
}, [isOpen, user, conversations, activeCourseId, activeConversationId, ...]);
```

**Analysis:**
- ⚠️ Complex logic (30 lines)
- ⚠️ Multiple side effects (load, create, setActiveConversationId)
- ⚠️ 9 dependencies
- ✅ Properly guarded with early returns

**2. Auto-focus input (Lines 167-173):**
```typescript
useEffect(() => {
  if (isOpen) {
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  }
}, [isOpen]);
```

**Analysis:**
- ✅ Single responsibility
- ✅ Minimal dependencies
- ⚠️ Magic number (100ms)

**Recommendations:**
1. Extract conversation loading to custom hook
2. Document magic numbers
3. Consider useLayoutEffect for focus

---

## Reusability Assessment

### Can Be Reused Elsewhere

| Component | Reusability | Notes |
|-----------|-------------|-------|
| QDSConversation | ✅ High | Pure presentation, no context dependency |
| QDSMessage | ✅ High | Standalone message renderer |
| QDSResponse | ✅ High | Markdown + citations renderer |
| QDSActions | ✅ High | Generic action buttons |
| QDSPromptInput | ✅ High | Generic chat input |
| QDSInlineCitation | ✅ High | Standalone citation marker |
| SourcesPanel | ✅ High | Generic sources display |
| QuokkaAssistantModal | ❌ Low | Tightly coupled to specific contexts |

### Cannot Be Reused For

**QuokkaAssistantModal Limitations:**
1. ❌ **Standalone Chat Page** - Too much modal-specific logic
2. ❌ **Embedded Widget** - Cannot extract conversation UI
3. ❌ **Mobile Chat** - Desktop-centric design
4. ❌ **Different Contexts** - Hardcoded dashboard/course/instructor logic
5. ❌ **Custom Layouts** - No composition slots

**Why:**
- Business logic baked in
- Context switching hardcoded
- No separation between modal shell and conversation UI

---

## Comparison to Existing Patterns

### ThreadModal Pattern (78 LoC) ✅

**Structure:**
```
ThreadModal (wrapper)
  └── ThreadDetailPanel (logic + UI)
```

**Why This Works:**
- ✅ Modal = thin presentation wrapper
- ✅ Business logic isolated in panel component
- ✅ Panel can be used outside modal
- ✅ Easy to test and maintain

### QuokkaAssistantModal Anti-Pattern ❌

**Structure:**
```
QuokkaAssistantModal (wrapper + logic + UI)
  ├── Header (dialog config)
  ├── Course Selector (state management)
  ├── Conversation Loading (useEffect)
  ├── QDSConversation (UI)
  ├── Action Buttons (handlers)
  ├── QDSPromptInput (UI)
  └── 3 AlertDialogs (state management)
```

**Why This Doesn't Work:**
- ❌ Violates single responsibility
- ❌ Cannot reuse conversation UI
- ❌ Difficult to test
- ❌ High maintenance burden

---

## Component Size Breakdown

```
QuokkaAssistantModal: 550 lines
├── Imports: 25 lines (5%)
├── Props Interface: 21 lines (4%)
├── Local State: 8 lines (1%)
├── React Query Hooks: 6 lines (1%)
├── useMemo Hooks: 18 lines (3%)
├── usePersistedChat: 5 lines (1%)
├── useEffect Hooks: 38 lines (7%)
├── Event Handlers: 120 lines (22%) 🔴
├── Helper Functions: 30 lines (5%)
├── JSX Return: 216 lines (39%) 🔴
└── AlertDialogs: 63 lines (11%)
```

**Hotspots:**
1. 🔴 JSX Return (216 lines) - Could split into sub-components
2. 🔴 Event Handlers (120 lines) - Should move to container/hook
3. useEffect (38 lines) - Could extract to custom hooks

---

## Recommendations Summary

### Critical (Must Fix)

1. **Split QuokkaAssistantModal (550 → <200 LoC)**
   - Extract conversation container logic
   - Create thin modal wrapper
   - Follow ThreadModal pattern

2. **Separate Container/Presenter**
   - `useQuokkaAssistant` hook for business logic
   - `QuokkaAssistantModal` for presentation only

### High Priority

3. **Unify Dialog State Management**
   - Replace 3 dialog states with single state machine
   - Create reusable ConfirmationDialog component

4. **Extract Message Text Utility**
   - Move `getMessageText()` to shared utilities
   - Avoid duplication across components

5. **Make Quick Prompts Data-Driven**
   - Accept prompts via props
   - Enable customization per context

### Medium Priority

6. **Add React.memo to QDS Elements**
   - Prevent unnecessary re-renders
   - Use useCallback for event handlers

7. **Extract Conversation Loading Hook**
   - Simplify useEffect in modal
   - Make testable and reusable

8. **Add Virtualization for Long Conversations**
   - Implement windowing for 100+ messages
   - Improve scroll performance

### Low Priority

9. **Add Render Props/Slot Pattern**
   - Enable custom header/footer
   - Support different layouts

10. **Document Magic Numbers**
    - Explain 100ms focus delay
    - Add constants for timeouts

---

## Metrics Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Modal Size** | 550 LoC | <200 LoC | 🔴 Fails |
| **QDS Elements** | 50-143 LoC | <200 LoC | ✅ Pass |
| **Props-Driven** | 90% | 100% | 🟡 Good |
| **TypeScript Strict** | 100% | 100% | ✅ Pass |
| **Reusability** | 3/8 comps | 7/8 comps | 🟡 Good |
| **State Complexity** | 8 states | <5 states | 🔴 Fails |
| **Side Effects** | 4 useEffect | <3 | 🟡 OK |
| **Accessibility** | 100% | 100% | ✅ Pass |

---

## Related Patterns in Codebase

**Good Examples to Follow:**
1. ✅ `ThreadModal` (78 LoC) - Thin wrapper pattern
2. ✅ `ThreadDetailPanel` - Business logic component
3. ✅ `QDSConversation` (82 LoC) - Composition pattern
4. ✅ `SourcesPanel` (166 LoC) - Standalone feature component

**Patterns to Avoid:**
1. ❌ Large modal components with business logic
2. ❌ Multiple useEffect hooks with complex dependencies
3. ❌ Hardcoded context-specific behavior
4. ❌ Tight coupling between UI and data fetching

---

## Next Steps

1. Read `plans/component-improvements.md` for detailed refactoring plan
2. Review proposed component splitting strategy
3. Approve architectural changes before implementation
4. Prioritize Critical and High issues first

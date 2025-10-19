# Component Architecture Plan - AI SDK Elements Migration

**Date:** 2025-10-17
**Task:** AI SDK Elements UI Upgrade - QuokkaAssistantModal
**Architect:** Component Architect Sub-Agent

---

## Overview

This plan details the component architecture for migrating QuokkaAssistantModal from custom implementation to AI SDK Elements while preserving ALL functionality and QDS styling.

**Migration Strategy:** Incremental hybrid approach
1. Install AI Elements components
2. Create QDS-styled wrapper components
3. Migrate modal incrementally (message list → input → actions)
4. Test each layer before proceeding
5. Maintain backward compatibility throughout

---

## Component Hierarchy

```
QuokkaAssistantModal (850 lines → ~400 lines)
├── Dialog (shadcn/ui - existing)
│   └── DialogContent (glass-panel-strong)
│       ├── DialogHeader
│       │   ├── Quokka Icon + Title
│       │   └── CourseSelector (custom - dashboard only)
│       │
│       ├── QDSConversation (NEW wrapper)
│       │   └── Conversation (AI Elements)
│       │       ├── QDSMessage[] (user/assistant)
│       │       │   └── Message (AI Elements)
│       │       │       ├── QDSResponse (assistant only)
│       │       │       │   └── Response (AI Elements)
│       │       │       │       ├── InlineCitation[] (AI Elements)
│       │       │       │       └── text content
│       │       │       ├── QDSActions (assistant only)
│       │       │       │   └── Actions (AI Elements)
│       │       │       │       ├── Copy button
│       │       │       │       └── Retry button (last message)
│       │       │       └── SourcesPanel (existing - reuse)
│       │       │           └── Source[] (AI Elements or custom)
│       │       └── StreamingIndicator (AI Elements)
│       │
│       ├── ScrollToBottomButton (custom - overlay)
│       │
│       └── DialogFooter (custom)
│           ├── QuickPrompts (custom - empty state)
│           ├── ActionBar (custom - non-empty state)
│           │   ├── PostToThreadButton
│           │   └── ClearConversationDropdown
│           └── QDSPromptInput (NEW wrapper)
│               └── PromptInput (AI Elements)
│                   ├── Input field
│                   └── Send/Stop button
```

**File Structure:**
```
components/
├── ai-elements/                  # shadcn installation target
│   ├── conversation.tsx          # Installed via shadcn CLI
│   ├── message.tsx
│   ├── response.tsx
│   ├── actions.tsx
│   ├── prompt-input.tsx
│   ├── source.tsx
│   └── inline-citation.tsx
│
├── ai/elements/                  # QDS wrapper components
│   ├── qds-conversation.tsx      # QDS wrapper for Conversation
│   ├── qds-message.tsx           # QDS wrapper for Message
│   ├── qds-response.tsx          # QDS wrapper for Response
│   ├── qds-actions.tsx           # QDS wrapper for Actions
│   ├── qds-prompt-input.tsx      # QDS wrapper for PromptInput
│   └── index.ts                  # Barrel exports
│
├── ai/
│   ├── quokka-assistant-modal.tsx    # REFACTORED (850 → ~400 lines)
│   ├── sources-panel.tsx             # KEEP AS-IS (may use Source component)
│   └── course-selector.tsx           # EXTRACTED (new component)
│
└── ui/                           # Existing shadcn/ui components
    ├── dialog.tsx                # Already exists
    ├── button.tsx                # Already exists
    └── ...
```

---

## Wrapper Component Designs

### 1. QDSConversation
**File:** `components/ai/elements/qds-conversation.tsx`

**Purpose:** Wrap AI Elements Conversation with QDS glass styling and scroll behavior

**Props Interface:**
```tsx
import type { UIMessage } from "@ai-sdk/react";
import type { ReactNode } from "react";

export interface QDSConversationProps {
  /** Messages to display */
  messages: UIMessage[];

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
```

**Component Signature:**
```tsx
export function QDSConversation({
  messages,
  isStreaming = false,
  onCopy,
  onRetry,
  canRetry = false,
  pageContext = "dashboard",
  courseCode,
  className,
  scrollContainerRef,
  messagesEndRef,
}: QDSConversationProps): JSX.Element
```

**Responsibilities:**
- Wrap `<Conversation>` with QDS scroll styling
- Auto-scroll on new messages
- Render empty state (welcome message)
- Show streaming indicator
- Pass refs for scroll management

**Usage Example:**
```tsx
<QDSConversation
  messages={chat.messages}
  isStreaming={chat.status === "streaming"}
  onCopy={handleCopy}
  onRetry={handleRetry}
  canRetry={messages.length > 0}
  pageContext="course"
  courseCode="CS 101"
  scrollContainerRef={scrollContainerRef}
  messagesEndRef={messagesEndRef}
/>
```

---

### 2. QDSMessage
**File:** `components/ai/elements/qds-message.tsx`

**Purpose:** Wrap Message component with QDS glass styling and citation borders

**Props Interface:**
```tsx
import type { UIMessage } from "@ai-sdk/react";
import type { ReactNode } from "react";

export interface QDSMessageProps {
  /** Message data */
  message: UIMessage;

  /** Whether message has citations (for border) */
  hasCitations?: boolean;

  /** Handler for Copy action */
  onCopy?: (content: string) => void;

  /** Handler for Retry action */
  onRetry?: () => void;

  /** Can show retry button */
  canRetry?: boolean;

  /** Custom className */
  className?: string;
}
```

**Component Signature:**
```tsx
export function QDSMessage({
  message,
  hasCitations = false,
  onCopy,
  onRetry,
  canRetry = false,
  className,
}: QDSMessageProps): JSX.Element
```

**Responsibilities:**
- Apply `.message-user` or `.message-assistant` classes
- Add `border-l-2 border-accent` if citations exist
- Render QDSResponse for assistant messages
- Render QDSActions for assistant messages
- Render SourcesPanel if citations exist

**Internal Logic:**
```tsx
const isUser = message.role === "user";
const messageText = getMessageText(message);
const parsed = isUser ? null : parseCitations(messageText);
const hasCitations = parsed && parsed.citations.length > 0;

return (
  <Message
    message={message}
    className={cn(
      isUser ? "message-user" : "message-assistant",
      hasCitations && "border-l-2 border-accent",
      className
    )}
  >
    {isUser ? (
      <div className="text-sm">{messageText}</div>
    ) : (
      <>
        <QDSResponse content={parsed.contentWithoutSources} citations={parsed.citations} />
        <QDSActions message={message} onCopy={onCopy} onRetry={onRetry} canRetry={canRetry} />
        {parsed.citations.length > 0 && (
          <SourcesPanel citations={parsed.citations} />
        )}
      </>
    )}
  </Message>
);
```

**Usage Example:**
```tsx
<QDSMessage
  message={message}
  onCopy={handleCopy}
  onRetry={handleRetry}
  canRetry={index === messages.length - 1}
/>
```

---

### 3. QDSResponse
**File:** `components/ai/elements/qds-response.tsx`

**Purpose:** Render assistant message content with inline citations

**Props Interface:**
```tsx
import type { Citation } from "@/lib/llm/utils/citations";

export interface QDSResponseProps {
  /** Message content (without Sources section) */
  content: string;

  /** Parsed citations for inline rendering */
  citations?: Citation[];

  /** Whether message is currently streaming */
  isStreaming?: boolean;

  /** Custom className */
  className?: string;
}
```

**Component Signature:**
```tsx
export function QDSResponse({
  content,
  citations = [],
  isStreaming = false,
  className,
}: QDSResponseProps): JSX.Element
```

**Responsibilities:**
- Use `<Response>` component from AI Elements
- Render inline citations with `<InlineCitation>`
- Apply QDS styling to citation markers

**Internal Logic:**
```tsx
// Parse citation markers [1], [2] from content
const citationIds = new Set(citations.map(c => c.id));

// Split text on [N] patterns and render
const parts = content.split(/(\[\d+\])/g);

return (
  <Response isStreaming={isStreaming} className={cn("text-sm", className)}>
    {parts.map((part, idx) => {
      const match = part.match(/\[(\d+)\]/);
      if (match && citationIds.has(parseInt(match[1], 10))) {
        const citationNum = parseInt(match[1], 10);
        const citation = citations.find(c => c.id === citationNum);
        return (
          <InlineCitation
            key={idx}
            id={citationNum}
            title={citation?.title}
            onClick={() => scrollToCitation(citationNum)}
            className="bg-accent/20 hover:bg-accent/30"
          />
        );
      }
      return <span key={idx}>{part}</span>;
    })}
  </Response>
);
```

**Usage Example:**
```tsx
<QDSResponse
  content={parsed.contentWithoutSources}
  citations={parsed.citations}
  isStreaming={false}
/>
```

---

### 4. QDSActions
**File:** `components/ai/elements/qds-actions.tsx`

**Purpose:** Render message action buttons with QDS styling

**Props Interface:**
```tsx
import type { UIMessage } from "@ai-sdk/react";

export interface QDSActionsProps {
  /** Message data */
  message: UIMessage;

  /** Copy handler */
  onCopy?: (content: string) => void;

  /** Retry handler */
  onRetry?: () => void;

  /** Show retry button */
  canRetry?: boolean;

  /** Disabled state (e.g., during streaming) */
  disabled?: boolean;

  /** Custom className */
  className?: string;
}
```

**Component Signature:**
```tsx
export function QDSActions({
  message,
  onCopy,
  onRetry,
  canRetry = false,
  disabled = false,
  className,
}: QDSActionsProps): JSX.Element
```

**Responsibilities:**
- Use `<Actions>` component from AI Elements
- Apply QDS button styling (`variant="ghost"`)
- Show Copy button always
- Show Retry button conditionally

**Internal Logic:**
```tsx
const messageText = getMessageText(message);

return (
  <Actions className={cn("flex items-center gap-1 mt-1", className)}>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onCopy?.(messageText)}
      disabled={disabled}
      className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
    >
      <Copy className="h-3 w-3 mr-1" />
      Copy
    </Button>

    {canRetry && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
        className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)]"
      >
        <RefreshCcw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    )}
  </Actions>
);
```

**Usage Example:**
```tsx
<QDSActions
  message={message}
  onCopy={handleCopy}
  onRetry={handleRetry}
  canRetry={index === messages.length - 1}
  disabled={isStreaming}
/>
```

---

### 5. QDSPromptInput
**File:** `components/ai/elements/qds-prompt-input.tsx`

**Purpose:** Wrap PromptInput with QDS glass styling and Stop/Send button logic

**Props Interface:**
```tsx
export interface QDSPromptInputProps {
  /** Input value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Submit handler */
  onSubmit: () => void;

  /** Stop handler */
  onStop?: () => void;

  /** Is streaming */
  isStreaming?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Input ref */
  inputRef?: React.RefObject<HTMLInputElement>;

  /** Custom className */
  className?: string;
}
```

**Component Signature:**
```tsx
export function QDSPromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask me anything...",
  inputRef,
  className,
}: QDSPromptInputProps): JSX.Element
```

**Responsibilities:**
- Use `<PromptInput>` from AI Elements
- Show Send button when idle
- Show Stop button when streaming
- Apply QDS button variants (`variant="glass-primary"`)

**Internal Logic:**
```tsx
return (
  <PromptInput
    value={value}
    onChange={onChange}
    onSubmit={onSubmit}
    disabled={disabled || isStreaming}
    placeholder={placeholder}
    ref={inputRef}
    className={cn("flex gap-2", className)}
    renderSubmitButton={() => (
      isStreaming ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onStop}
          className="shrink-0 min-h-[44px] min-w-[44px]"
        >
          <StopCircle className="h-4 w-4" />
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
        </Button>
      )
    )}
  />
);
```

**Usage Example:**
```tsx
<QDSPromptInput
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  onStop={handleStop}
  isStreaming={isStreaming}
  inputRef={messageInputRef}
/>
```

---

### 6. CourseSelector (Extracted)
**File:** `components/ai/course-selector.tsx`

**Purpose:** Extract course selection logic into reusable component

**Props Interface:**
```tsx
import type { CourseSummary } from "@/lib/models/types";

export interface CourseSelectorProps {
  /** Available courses */
  availableCourses: CourseSummary[];

  /** Selected course ID (null = all courses) */
  selectedCourseId: string | null;

  /** Change handler */
  onChange: (courseId: string | null) => void;

  /** Label text */
  label?: string;

  /** Custom className */
  className?: string;
}
```

**Component Signature:**
```tsx
export function CourseSelector({
  availableCourses,
  selectedCourseId,
  onChange,
  label = "Select Course Context (Optional)",
  className,
}: CourseSelectorProps): JSX.Element
```

**Responsibilities:**
- Render Select dropdown
- Handle "All courses" option
- Convert "all" → null in onChange
- Apply QDS styling

**Usage Example:**
```tsx
<CourseSelector
  availableCourses={availableCourses}
  selectedCourseId={selectedCourseId}
  onChange={handleCourseSelect}
/>
```

---

## Integration with usePersistedChat

### Hook Compatibility Check

**usePersistedChat API:**
```tsx
const chat = usePersistedChat({
  conversationId: string | null,
  courseId?: string | null,
  userId: string,
});

// Returns (compatible with AI Elements):
{
  messages: UIMessage[],          // ✅ AI Elements accepts UIMessage[]
  sendMessage: (opts) => Promise, // ✅ Pass to PromptInput onSubmit
  stop: () => void,               // ✅ Pass to PromptInput onStop
  regenerate: () => void,         // ✅ Pass to Actions onRetry
  status: "idle" | "submitted" | "streaming", // ✅ Convert to isStreaming
}
```

**Integration Pattern:**
```tsx
// In QuokkaAssistantModal
const chat = usePersistedChat({
  conversationId: activeConversationId,
  courseId: activeCourseId,
  userId: user?.id || "",
});

const isStreaming = chat.status === "submitted" || chat.status === "streaming";

return (
  <QDSConversation
    messages={chat.messages}
    isStreaming={isStreaming}
    onCopy={handleCopy}
    onRetry={chat.regenerate}
    canRetry={chat.messages.length > 0}
  />
);
```

**No Changes Required:** usePersistedChat is already compatible with AI Elements (both use UIMessage[] format).

---

## Refactored QuokkaAssistantModal Structure

**File:** `components/ai/quokka-assistant-modal.tsx`

**New Structure (850 → ~400 lines):**

```tsx
export function QuokkaAssistantModal({
  isOpen,
  onClose,
  pageContext,
  currentCourseId,
  currentCourseName,
  currentCourseCode,
  availableCourses,
}: QuokkaAssistantModalProps) {
  // Hooks (same as before)
  const { data: user } = useCurrentUser();
  const { data: conversations } = useAIConversations(user?.id);
  const createConversation = useCreateConversation();

  // State (reduced)
  const [input, setInput] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Chat hook
  const chat = usePersistedChat({
    conversationId: activeConversationId,
    courseId: activeCourseId,
    userId: user?.id || "",
  });

  const isStreaming = chat.status === "submitted" || chat.status === "streaming";

  // Handlers (simplified)
  const handleSubmit = () => {
    chat.sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const handleRetry = () => chat.regenerate();
  const handleStop = () => chat.stop();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-panel-strong ...">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <QuokkaIcon />
            <DialogTitle>Quokka AI Assistant</DialogTitle>
          </div>

          {pageContext === "dashboard" && (
            <CourseSelector
              availableCourses={availableCourses}
              selectedCourseId={selectedCourseId}
              onChange={setSelectedCourseId}
            />
          )}
        </DialogHeader>

        {/* Messages */}
        <QDSConversation
          messages={chat.messages}
          isStreaming={isStreaming}
          onCopy={handleCopy}
          onRetry={handleRetry}
          canRetry={chat.messages.length > 0}
          pageContext={pageContext}
          courseCode={currentCourseCode}
          scrollContainerRef={scrollContainerRef}
          messagesEndRef={messagesEndRef}
        />

        {/* Scroll Button Overlay */}
        <ScrollToBottomButton
          scrollContainerRef={scrollContainerRef}
          messagesEndRef={messagesEndRef}
        />

        {/* Footer */}
        <DialogFooter>
          {chat.messages.length === 0 && (
            <QuickPrompts onSelect={setInput} pageContext={pageContext} />
          )}

          {chat.messages.length > 0 && (
            <ActionBar
              onPostToThread={handlePostAsThread}
              onClearConversation={() => setShowClearConfirm(true)}
              courseCode={activeCourse?.code}
              disabled={isStreaming}
            />
          )}

          <QDSPromptInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            isStreaming={isStreaming}
            inputRef={messageInputRef}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Line Count Reduction:**
- **Before:** 850 lines (manual rendering, complex state)
- **After:** ~400 lines (delegated to wrapper components)
- **Reduction:** 53% fewer lines

---

## Migration Steps (Incremental)

### Phase 1: Installation & Setup
**Goal:** Install AI Elements and verify structure

**Steps:**
1. Run `npx shadcn@latest add ai-elements`
   - Installs into `components/ai-elements/`
   - Verify components: conversation.tsx, message.tsx, response.tsx, actions.tsx, prompt-input.tsx, source.tsx, inline-citation.tsx

2. Inspect installed component APIs
   - Check prop interfaces
   - Verify TypeScript types
   - Test rendering in isolation

3. Create wrapper directory
   - `mkdir components/ai/elements`
   - Add `index.ts` for barrel exports

**Testing:**
- [ ] AI Elements components installed successfully
- [ ] No TypeScript errors in node_modules
- [ ] Components export expected interfaces

---

### Phase 2: Create Wrapper Components
**Goal:** Build QDS-styled wrappers without breaking existing modal

**Steps:**
1. Create `components/ai/elements/qds-response.tsx`
   - Implement inline citation rendering
   - Test with mock citations
   - Verify QDS styling

2. Create `components/ai/elements/qds-actions.tsx`
   - Implement Copy/Retry buttons
   - Test handlers
   - Verify QDS button styling

3. Create `components/ai/elements/qds-message.tsx`
   - Integrate QDSResponse + QDSActions
   - Add citation border logic
   - Test with user/assistant messages

4. Create `components/ai/elements/qds-prompt-input.tsx`
   - Implement Send/Stop button toggle
   - Test auto-focus
   - Verify QDS styling

5. Create `components/ai/elements/qds-conversation.tsx`
   - Integrate all message rendering
   - Add scroll behavior
   - Test empty state

6. Create `components/ai/course-selector.tsx`
   - Extract from QuokkaAssistantModal
   - Add prop interface
   - Test with mock courses

**Testing:**
- [ ] Each wrapper component renders in isolation
- [ ] TypeScript types are correct
- [ ] QDS styling applied correctly
- [ ] No console errors

---

### Phase 3: Migrate QuokkaAssistantModal
**Goal:** Replace manual rendering with wrapper components

**Steps:**
1. **Backup original component**
   - Copy to `quokka-assistant-modal.backup.tsx`

2. **Replace message list section** (Lines 517-634)
   - Remove manual `.map()` rendering
   - Replace with `<QDSConversation>`
   - Keep refs for scroll management

3. **Replace input section** (Lines 719-753)
   - Remove `<form>` + `<Input>` + conditional buttons
   - Replace with `<QDSPromptInput>`
   - Preserve `handleSubmit` and `handleStop`

4. **Extract course selector** (Lines 494-514)
   - Replace inline `<Select>` with `<CourseSelector>`
   - Move to DialogHeader

5. **Test each section incrementally**
   - After each replacement, run dev server
   - Test user flows: send message, copy, retry, stop
   - Verify citations render correctly

**Testing:**
- [ ] All messages render with correct styling
- [ ] Citations display with [1] [2] markers
- [ ] Sources panel shows below cited messages
- [ ] Copy/Retry buttons work
- [ ] Send/Stop buttons toggle correctly
- [ ] Course selector functions
- [ ] Scroll behavior preserved
- [ ] Auto-focus on mount

---

### Phase 4: Quality Verification
**Goal:** Ensure feature parity and QDS compliance

**Checks:**
1. **Feature Parity**
   - [ ] All 8 original features present (see research doc)
   - [ ] Citations work (inline markers + sources panel)
   - [ ] Persistence works (conversation continuity)
   - [ ] Course selector works (dashboard)
   - [ ] Post to thread works
   - [ ] Clear conversation works
   - [ ] Scroll to bottom button works

2. **QDS Compliance**
   - [ ] Glass morphism applied to all panels
   - [ ] Citation markers use `bg-accent/20`
   - [ ] Buttons use QDS variants
   - [ ] Spacing uses 4pt grid
   - [ ] Shadows use QDS tokens
   - [ ] No hardcoded hex colors

3. **Accessibility**
   - [ ] Keyboard navigation works (Tab, Enter, Space)
   - [ ] ARIA labels present
   - [ ] Focus states visible
   - [ ] Screen reader friendly
   - [ ] Contrast meets WCAG AA (4.5:1)

4. **TypeScript**
   - [ ] `npx tsc --noEmit` passes
   - [ ] No `any` types
   - [ ] All props have explicit interfaces

5. **Performance**
   - [ ] No unnecessary re-renders
   - [ ] Scroll performance smooth
   - [ ] Streaming updates fluid

**Testing:**
- [ ] Manual testing: All user flows
- [ ] Typecheck: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`
- [ ] Production build: `npm run build`

---

## Test Scenarios

### Scenario 1: Basic Chat Flow
1. Open modal
2. Type "What is binary search?"
3. Press Enter
4. Verify:
   - [ ] Message appears as user bubble (right-aligned, glass)
   - [ ] Streaming indicator appears
   - [ ] Assistant response streams in
   - [ ] Auto-scrolls to bottom
   - [ ] Copy/Retry buttons appear

### Scenario 2: Citations
1. Ask question that triggers citations
2. Wait for response
3. Verify:
   - [ ] Inline [1] [2] markers appear
   - [ ] Markers are clickable
   - [ ] Sources panel appears below
   - [ ] Clicking marker scrolls to source
   - [ ] Border-left accent appears on message

### Scenario 3: Course Selector (Dashboard)
1. Open modal from dashboard
2. Change course selector
3. Verify:
   - [ ] Conversation clears
   - [ ] New conversation created
   - [ ] Course context updates

### Scenario 4: Stop Generation
1. Ask long question
2. Click Stop during streaming
3. Verify:
   - [ ] Streaming stops
   - [ ] Partial response remains
   - [ ] Retry button appears

### Scenario 5: Retry
1. Click Retry on last assistant message
2. Verify:
   - [ ] Last assistant message removed
   - [ ] New streaming starts
   - [ ] Response regenerates

### Scenario 6: Post to Thread
1. Have conversation with 3+ messages
2. Click "Post to Course"
3. Verify:
   - [ ] Confirmation dialog appears (dashboard)
   - [ ] Thread created successfully
   - [ ] Success dialog appears
   - [ ] "View Thread" navigates correctly

### Scenario 7: Clear Conversation
1. Have conversation with 3+ messages
2. Click Clear Conversation
3. Verify:
   - [ ] Confirmation dialog appears
   - [ ] Conversation deleted
   - [ ] New conversation created
   - [ ] Welcome message appears

### Scenario 8: Scroll Behavior
1. Have 10+ messages
2. Scroll up manually
3. New message arrives
4. Verify:
   - [ ] Scroll button appears
   - [ ] Auto-scroll does NOT trigger
   - [ ] Clicking scroll button goes to bottom

### Scenario 9: Keyboard Navigation
1. Tab through citation markers
2. Press Enter on marker
3. Verify:
   - [ ] Focus moves between markers
   - [ ] Enter scrolls to source
   - [ ] Space also scrolls to source

### Scenario 10: Persistence
1. Have conversation
2. Close modal
3. Reopen modal
4. Verify:
   - [ ] Same conversation loaded
   - [ ] Messages preserved
   - [ ] Course context preserved

---

## Edge Cases & Error Handling

### Edge Case 1: Empty State
**Scenario:** No messages in conversation
**Expected:**
- [ ] Welcome message appears
- [ ] Quick prompts displayed
- [ ] Action bar hidden

### Edge Case 2: Invalid Citations
**Scenario:** LLM returns [99] but no Source 99
**Expected:**
- [ ] Marker rendered as plain text
- [ ] No crash
- [ ] Log warning to console

### Edge Case 3: Network Error
**Scenario:** API call fails
**Expected:**
- [ ] Error message displayed
- [ ] Retry available
- [ ] Conversation not lost

### Edge Case 4: Long Messages
**Scenario:** Message exceeds viewport height
**Expected:**
- [ ] Message scrollable
- [ ] Sources panel visible
- [ ] Actions buttons accessible

### Edge Case 5: Rapid Submissions
**Scenario:** User presses Enter multiple times
**Expected:**
- [ ] Input disabled during streaming
- [ ] Only one request sent
- [ ] No duplicate messages

---

## Performance Optimizations

### 1. Memoization Opportunities
```tsx
// Memoize citation parsing
const parsed = useMemo(
  () => parseCitations(messageText),
  [messageText]
);

// Memoize message rendering
const MessageComponent = memo(QDSMessage);
```

### 2. Lazy Loading
```tsx
// Lazy load SourcesPanel (only when citations exist)
const SourcesPanel = lazy(() => import("@/components/ai/sources-panel"));
```

### 3. Virtualization (Future)
**If 100+ messages:**
- Use `react-window` or `@tanstack/react-virtual`
- Render only visible messages
- Maintain scroll position

---

## Type Safety Patterns

### 1. Message Type Extraction
```tsx
// lib/llm/utils/messages.ts
import type { UIMessage } from "@ai-sdk/react";

export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}
```

### 2. Citation Types
```tsx
// Already defined in lib/llm/utils/citations.ts
export interface Citation {
  id: number;
  title: string;
  type: string;
  materialId?: string;
}
```

### 3. Wrapper Component Exports
```tsx
// components/ai/elements/index.ts
export { QDSConversation } from "./qds-conversation";
export { QDSMessage } from "./qds-message";
export { QDSResponse } from "./qds-response";
export { QDSActions } from "./qds-actions";
export { QDSPromptInput } from "./qds-prompt-input";

export type { QDSConversationProps } from "./qds-conversation";
export type { QDSMessageProps } from "./qds-message";
export type { QDSResponseProps } from "./qds-response";
export type { QDSActionsProps } from "./qds-actions";
export type { QDSPromptInputProps } from "./qds-prompt-input";
```

---

## Rollback Plan

### If Migration Fails
1. **Restore backup:**
   ```bash
   mv components/ai/quokka-assistant-modal.backup.tsx components/ai/quokka-assistant-modal.tsx
   ```

2. **Remove wrapper components:**
   ```bash
   rm -rf components/ai/elements/
   ```

3. **Keep AI Elements installed:**
   - No need to uninstall
   - May be useful for future features

### Incremental Rollback
- Each phase is testable independently
- Can rollback to last working phase
- Git commits after each phase enable granular rollback

---

## Success Criteria

### Must Have
- [ ] All 8 original features work (see research doc)
- [ ] Citations render correctly ([1] [2] + sources)
- [ ] QDS styling applied throughout
- [ ] TypeScript strict mode passes
- [ ] Accessibility maintained (keyboard nav, ARIA, contrast)
- [ ] Production build succeeds
- [ ] No console errors or warnings

### Nice to Have
- [ ] Line count reduced by 40%+
- [ ] Message rendering memoized
- [ ] No re-renders on input change
- [ ] Smooth 60fps scroll
- [ ] Bundle size unchanged or smaller

---

## Summary

**Component Count:**
- **AI Elements:** 7 components (installed via shadcn)
- **QDS Wrappers:** 5 components (custom)
- **Extracted:** 1 component (CourseSelector)
- **Refactored:** 1 component (QuokkaAssistantModal)

**Lines of Code:**
- **Before:** 850 lines (QuokkaAssistantModal)
- **After:** ~400 lines (modal) + ~300 lines (wrappers) = 700 total
- **Net Change:** -150 lines (-18%)

**Complexity Reduction:**
- Manual message rendering → Delegated to Elements
- Inline citation parsing → Encapsulated in QDSResponse
- State management → Simplified (removed duplicate state)
- Event handling → Consolidated in wrappers

**QDS Compliance:**
- All glass morphism tokens preserved
- Button variants maintained
- Spacing grid enforced
- Shadow tokens used
- No hardcoded colors

**Accessibility:**
- ARIA labels on all interactive elements
- Keyboard navigation preserved
- Focus states visible
- Screen reader friendly
- WCAG 2.2 AA compliant

**Backward Compatibility:**
- All props unchanged
- usePersistedChat hook unchanged
- Citation parser unchanged
- SourcesPanel reused
- No breaking API changes

**Next Steps:**
1. Review and approve this plan
2. Install AI Elements (Phase 1)
3. Create wrapper components (Phase 2)
4. Migrate modal incrementally (Phase 3)
5. Quality verification (Phase 4)

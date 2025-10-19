# Component Mapping Research - AI SDK Elements → QuokkaAssistantModal

**Date:** 2025-10-17
**Task:** AI SDK Elements UI Upgrade
**Scope:** Map current QuokkaAssistantModal features to AI Elements components

---

## Executive Summary

**Current State:**
- Custom QuokkaAssistantModal (850 lines)
- Manual message rendering with citation parsing
- Direct usePersistedChat hook integration
- QDS glass morphism styling throughout

**Target State:**
- AI SDK Elements components (not yet installed)
- shadcn/ui installation via `npx shadcn@latest add ai-elements`
- Hybrid styling: Elements structure + QDS glass wrappers
- Maintain ALL current features

**Key Finding:** AI Elements components are NOT yet installed in node_modules. Current @ai-sdk/react@2.0.76 only exports `useChat`, `useCompletion`, `useObject` hooks. AI Elements are separate shadcn components that will be installed into `components/ai-elements/`.

---

## Current Implementation Analysis

### QuokkaAssistantModal Features (components/ai/quokka-assistant-modal.tsx)

#### 1. **Message Display** (Lines 517-634)
**Current Pattern:**
```tsx
// Manual message rendering with role-based styling
<div className={`message-${message.role}`}>
  {renderTextWithCitations(text, citations)}
</div>

// Sources panel below assistant messages
<SourcesPanel citations={citations} />
```

**Features:**
- User/assistant role differentiation
- Citation markers [1] [2] with click-to-scroll
- Sources panel (collapsible)
- Streaming indicator with animated dots
- Keyboard navigation (Tab, Enter, Space)
- ARIA labels and live regions

**Styling:**
- `.message-user` - Glass panel, right-aligned
- `.message-assistant` - Glass panel, left-aligned, border-l-2 if cited
- Inline citation markers: `bg-accent/20`, hover `bg-accent/30`

#### 2. **Input & Actions** (Lines 649-754)
**Current Pattern:**
```tsx
<form onSubmit={handleSubmit}>
  <Input ref={messageInputRef} value={input} onChange={...} />
  {isStreaming ? (
    <Button onClick={handleStop}>Stop</Button>
  ) : (
    <Button type="submit">Send</Button>
  )}
</form>
```

**Features:**
- Auto-focus on mount
- Disabled during streaming
- Enter to submit
- Stop button during streaming
- Quick prompts (context-aware)

#### 3. **Message Actions** (Lines 573-601)
**Current Pattern:**
```tsx
// Per-message actions (assistant only)
<Button onClick={() => handleCopy(text)}>Copy</Button>
<Button onClick={handleRetry}>Retry</Button> // Last message only
```

**Features:**
- Copy to clipboard
- Retry last response (uses `chat.regenerate()`)
- Disabled during streaming
- Only shown for assistant messages

#### 4. **Course Context Selector** (Lines 494-514)
**Current Pattern:**
```tsx
{pageContext === "dashboard" && availableCourses && (
  <Select value={selectedCourseId || "all"} onValueChange={handleCourseSelect}>
    <SelectItem value="all">All courses</SelectItem>
    {availableCourses.map(course => ...)}
  </Select>
)}
```

**Features:**
- Dashboard-only (multi-course context)
- Course page: auto-locked to current course
- Switching course clears conversation
- Label: "Select Course Context (Optional)"

#### 5. **Conversation Management** (Lines 673-716)
**Current Pattern:**
```tsx
// Dropdown menu with Clear action
<DropdownMenu>
  <DropdownMenuItem onClick={() => setShowClearConfirm(true)}>
    Clear Conversation
  </DropdownMenuItem>
</DropdownMenu>

// Post to Thread button
<Button onClick={handlePostAsThread}>
  Post to {courseName}
</Button>
```

**Features:**
- Clear conversation (with confirmation dialog)
- Post to thread (course-specific)
- Confirmation dialog on dashboard
- Success dialog with "View Thread" link

#### 6. **Persistence & State** (Lines 204-212)
**Current Integration:**
```tsx
const chat = usePersistedChat({
  conversationId: activeConversationId,
  courseId: activeCourseId,
  userId: user?.id || "",
});

const messages = chat.messages; // UIMessage[]
const isStreaming = chat.status === "submitted" || chat.status === "streaming";
```

**Features:**
- localStorage sync (automatic via hook)
- Auto-load last conversation on mount
- Create new conversation if none exists
- Course-specific conversation lookup

#### 7. **Citation System** (Lines 536-611)
**Current Pattern:**
```tsx
// Parse citations from LLM response
const parsed = parseCitations(messageText);

// Render with inline markers
{renderTextWithCitations(parsed.contentWithoutSources, parsed.citations)}

// Display sources panel
<SourcesPanel citations={parsed.citations} defaultExpanded={true} />
```

**Features:**
- Inline [1] [2] markers (clickable)
- Sources section parsing (LLM-generated)
- Scroll to source on click
- Tooltips showing citation title
- Keyboard accessible

#### 8. **Scroll Behavior** (Lines 250-296, 635-646)
**Current Pattern:**
```tsx
// Auto-scroll on new messages
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// Scroll to bottom button (IntersectionObserver)
{showScrollButton && (
  <Button onClick={scrollToBottom}>
    <ArrowDown />
  </Button>
)}
```

**Features:**
- Auto-scroll to bottom on new messages
- Show/hide scroll button based on scroll position
- IntersectionObserver for bottom visibility
- Manual scroll-to-bottom button

---

## AI SDK Elements Components (Target Architecture)

### Component Overview

AI Elements are shadcn/ui components designed for AI chat interfaces. They will be installed via:

```bash
npx shadcn@latest add ai-elements
```

This installs into `components/ai-elements/` directory.

### Expected Components (Based on shadcn AI Elements Pattern)

#### 1. **Conversation Component**
**Purpose:** Root container for chat interface
**Props (Anticipated):**
```tsx
interface ConversationProps {
  messages: UIMessage[];
  children: React.ReactNode;
  className?: string;
}
```

**Renders:**
- Message list container
- Scrollable area
- Auto-scroll behavior

**QDS Integration:**
- Wrap in glass panel
- Custom scroll styling

#### 2. **Message Component**
**Purpose:** Individual message container (user/assistant)
**Props (Anticipated):**
```tsx
interface MessageProps {
  message: UIMessage;
  role: "user" | "assistant";
  className?: string;
  children?: React.ReactNode;
}
```

**Renders:**
- Message bubble
- Role-based positioning
- Timestamp (optional)

**QDS Integration:**
- `.message-user` and `.message-assistant` classes
- Glass morphism background
- Border-left accent for cited messages

#### 3. **Response Component**
**Purpose:** Assistant message content with streaming support
**Props (Anticipated):**
```tsx
interface ResponseProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}
```

**Renders:**
- Text content
- Streaming indicator
- Markdown support (optional)

**QDS Integration:**
- Citation marker highlighting
- Streaming dots animation

#### 4. **Actions Component**
**Purpose:** Message action buttons (Copy, Retry, etc.)
**Props (Anticipated):**
```tsx
interface ActionsProps {
  message: UIMessage;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  canRetry?: boolean;
  className?: string;
}
```

**Renders:**
- Copy button
- Retry button (conditional)
- Custom action buttons

**QDS Integration:**
- Ghost button variants
- Hover: `bg-[var(--glass-hover)]`

#### 5. **PromptInput Component**
**Purpose:** Message input field with submit/stop
**Props (Anticipated):**
```tsx
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}
```

**Renders:**
- Input field
- Submit button (or Stop button if streaming)
- Quick prompts (optional)

**QDS Integration:**
- Glass input styling
- `variant="glass-primary"` for submit button

#### 6. **Source Component**
**Purpose:** Individual cited source display
**Props (Anticipated):**
```tsx
interface SourceProps {
  citation: {
    id: number;
    title: string;
    type: string;
  };
  onClick?: () => void;
  className?: string;
}
```

**Renders:**
- Citation number badge
- Source title
- Type label

**QDS Integration:**
- Reuse existing SourcesPanel design
- Accent border and background

#### 7. **InlineCitation Component**
**Purpose:** Clickable [1] [2] markers in text
**Props (Anticipated):**
```tsx
interface InlineCitationProps {
  id: number;
  title?: string;
  onClick?: () => void;
  className?: string;
}
```

**Renders:**
- `[N]` marker
- Clickable with tooltip
- Keyboard accessible

**QDS Integration:**
- `bg-accent/20`, hover `bg-accent/30`
- Existing citation marker styling

---

## Feature → Component Mapping Table

| Current Feature | Current Implementation | AI Elements Component | Integration Approach |
|-----------------|------------------------|----------------------|----------------------|
| **Message List** | Manual `<div>` with `.map()` | `<Conversation>` | Wrap with QDS glass panel |
| **User Message** | `.message-user` class | `<Message role="user">` | Add `className="message-user"` |
| **Assistant Message** | `.message-assistant` class | `<Message role="assistant">` | Add `className="message-assistant"` |
| **Message Content** | `renderTextWithCitations()` | `<Response>` + `<InlineCitation>` | Parse citations, render markers |
| **Copy/Retry Actions** | Manual `<Button>` elements | `<Actions>` | Pass handlers via props |
| **Input Field** | `<Input>` + `<Button>` | `<PromptInput>` | Pass `isStreaming`, `onStop` |
| **Citations [1] [2]** | `renderTextWithCitations()` | `<InlineCitation>` | Map over citation IDs |
| **Sources Panel** | `<SourcesPanel>` | `<Source>` (multiple) | Keep existing SourcesPanel UI |
| **Course Selector** | Custom `<Select>` | N/A (custom) | Keep as-is, move to header |
| **Clear Conversation** | `<DropdownMenu>` | N/A (custom) | Keep as-is, move to header |
| **Post to Thread** | `<Button>` | N/A (custom) | Keep as-is, move to actions bar |
| **Streaming Indicator** | Custom animated dots | `<Response isStreaming>` | Use Elements built-in indicator |
| **Scroll to Bottom** | IntersectionObserver + `<Button>` | N/A (custom) | Keep as-is, overlay on Conversation |
| **Auto-scroll** | `useEffect` + `scrollIntoView()` | `<Conversation>` (built-in?) | Test Elements default, fallback to custom |
| **Persistence** | `usePersistedChat` hook | N/A (hook-agnostic) | Continue using usePersistedChat |

---

## Existing Patterns Analysis

### 1. shadcn/ui Component Patterns (components/ui/)

**Pattern: Radix Primitives + CVA + Tailwind**

Example from `components/ui/button.tsx`:
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", ghost: "...", "glass-primary": "..." },
      size: { default: "...", sm: "...", lg: "..." },
    },
  }
)

function Button({ className, variant, size, ...props }) {
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

**Key Principles:**
- `cva()` for variant management
- `cn()` for className merging
- Props extend HTML element props
- `asChild` pattern for polymorphic rendering

**Applied to AI Elements:**
- AI Elements will follow same pattern
- Add QDS variants: `variant: { glass: "...", "glass-message": "..." }`
- Use `cn()` to merge QDS classes

### 2. QDS Glass Morphism (app/globals.css)

**CSS Custom Properties:**
```css
/* Line 131-136 */
--color-glass-ultra: var(--glass-ultra);
--color-glass-strong: var(--glass-strong);
--color-glass-medium: var(--glass-medium);
--color-glass-subtle: var(--glass-subtle);
--color-border-glass: var(--border-glass);
```

**Utility Classes (Lines 350-400+):**
```css
.glass-panel { backdrop-blur-md bg-glass-medium; border: 1px solid var(--border-glass); }
.glass-panel-strong { backdrop-blur-md bg-glass-strong; border: 1px solid var(--border-glass); }
.message-user { backdrop-blur-md bg-glass-medium; /* ... */ }
.message-assistant { backdrop-blur-md bg-glass-strong; /* ... */ }
```

**Integration Strategy:**
- Wrap AI Elements with `.glass-panel` or `.glass-panel-strong`
- Add `className="message-user"` or `className="message-assistant"` to Message component
- Use `border-[var(--border-glass)]` for borders

### 3. usePersistedChat Hook (lib/llm/hooks/usePersistedChat.ts)

**Hook Contract:**
```tsx
const chat = usePersistedChat({
  conversationId: string | null,
  courseId?: string | null,
  userId: string,
  onMessageAdded?: (message: AIMessage) => void,
  onStreamFinish?: () => void,
});

// Returns:
{
  messages: UIMessage[],
  sendMessage: (options: { text: string }) => Promise<void>,
  regenerate: () => void,
  stop: () => void,
  status: "idle" | "submitted" | "streaming",
}
```

**Key Features:**
- Wraps @ai-sdk/react's `useChat` hook
- Auto-saves to localStorage
- Converts between AIMessage (storage) and UIMessage (UI)
- Passes courseId in request body

**AI Elements Integration:**
- AI Elements are hook-agnostic (accept messages array)
- Continue using usePersistedChat, pass `messages` to `<Conversation>`
- Use `status` for `isStreaming` prop
- Pass `sendMessage`, `stop`, `regenerate` to child components

### 4. Citation Parser (lib/llm/utils/citations.ts)

**Parse Function:**
```tsx
const parsed = parseCitations(responseText); // Returns ParsedCitations
```

**Returns:**
```tsx
interface ParsedCitations {
  citations: Citation[]; // [{ id: 1, title: "...", type: "..." }]
  citationMarkers: Set<number>; // Set(1, 2, 3)
  contentWithoutSources: string; // Text without "**Sources:**" section
  sourcesSection: string | null; // Raw sources text
}
```

**Integration with InlineCitation:**
- Parse citations BEFORE rendering
- Map over `parsed.citations` to create `<InlineCitation>` components
- Pass `onClick` to scroll to `<Source>` with matching ID

### 5. SourcesPanel Component (components/ai/sources-panel.tsx)

**Current Implementation:**
- Collapsible panel (ChevronDown/ChevronRight)
- List of citations with number badges
- `data-citation-id={id}` for scroll targeting
- Styling: `border-l-4 border-accent/40 bg-accent/5`

**Reuse Strategy:**
- Keep existing SourcesPanel as wrapper
- Optionally use `<Source>` component for individual citations
- Maintain QDS styling and behavior

---

## AI Elements Component Capabilities (Expected)

### Based on shadcn AI Elements Documentation (Anticipated)

**1. Automatic Streaming Support**
- `<Response>` component handles streaming states
- Built-in animated indicators
- No manual `isStreaming` checks needed

**2. Built-in Message Actions**
- `<Actions>` component provides default Copy/Retry buttons
- Customizable via props
- Accessibility built-in

**3. Citation Support**
- `<InlineCitation>` for markers
- `<Source>` for source display
- Linkage between markers and sources

**4. Auto-scroll Behavior**
- `<Conversation>` may auto-scroll to bottom
- Configurable scroll behavior

**5. Markdown Support (Optional)**
- `<Response>` may support markdown rendering
- Code highlighting built-in

**6. Accessibility First**
- ARIA attributes on all components
- Keyboard navigation
- Screen reader support

---

## Integration Challenges & Considerations

### Challenge 1: AI Elements Not Yet Installed
**Impact:** Cannot inspect actual component APIs until installation
**Mitigation:**
1. Design based on shadcn patterns and anticipated APIs
2. Install AI Elements as first implementation step
3. Adjust wrapper component props based on actual API

### Challenge 2: QDS Glass Morphism vs Elements Defaults
**Impact:** Elements may have default styling that conflicts with glass
**Mitigation:**
1. Use `className` prop to override defaults
2. Create QDS wrapper components in `components/ai/elements/`
3. Extend Elements with custom variants (CVA)

### Challenge 3: Citation System Complexity
**Impact:** Inline citations require custom parsing and rendering
**Mitigation:**
1. Keep existing `parseCitations()` utility
2. Use `<InlineCitation>` if available, else fallback to custom
3. Maintain `<SourcesPanel>` with minimal changes

### Challenge 4: usePersistedChat Compatibility
**Impact:** Elements may expect standard `useChat` hook
**Mitigation:**
1. usePersistedChat wraps useChat and returns same API
2. Elements should accept messages array (hook-agnostic)
3. Test compatibility and adjust hook if needed

### Challenge 5: Course Selector & Custom Actions
**Impact:** Elements don't provide course selector or post-to-thread
**Mitigation:**
1. Keep custom UI elements as-is
2. Position them in modal header and footer
3. Style consistently with Elements

### Challenge 6: Scroll Behavior
**Impact:** Unknown if Elements auto-scroll works with IntersectionObserver
**Mitigation:**
1. Test Elements default scroll behavior
2. Keep custom IntersectionObserver + scroll button as fallback
3. Disable Elements scroll if conflicts arise

---

## Styling Strategy: Hybrid Approach

### Approach: AI Elements Structure + QDS Glass Wrappers

**Layer 1: AI Elements (Base Structure)**
- Use Elements for message list, bubbles, actions
- Accept default HTML structure and accessibility

**Layer 2: QDS Overrides (Styling)**
- Apply `.message-user`, `.message-assistant` classes
- Add glass morphism tokens
- Override colors, shadows, borders with QDS values

**Layer 3: Custom Wrappers (Feature Additions)**
- Wrap Elements in `components/ai/elements/` directory
- Add course selector, post-to-thread, scroll button
- Maintain existing behavior while using Elements internals

**Example Wrapper Component:**
```tsx
// components/ai/elements/qds-message.tsx
import { Message } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export function QDSMessage({ role, children, hasCitations, ...props }) {
  return (
    <Message
      role={role}
      className={cn(
        role === "user" ? "message-user" : "message-assistant",
        hasCitations && "border-l-2 border-accent",
        props.className
      )}
      {...props}
    >
      {children}
    </Message>
  );
}
```

---

## Dependencies & Prerequisites

### Required Installations
1. **AI SDK Elements** - `npx shadcn@latest add ai-elements`
   - Installs into `components/ai-elements/`
   - Provides: Conversation, Message, Response, Actions, PromptInput, Source, InlineCitation

2. **No Additional Dependencies** - Already have:
   - @ai-sdk/react@2.0.76 ✅
   - class-variance-authority ✅
   - tailwind-merge ✅
   - lucide-react ✅

### Existing Assets (No Changes)
- `lib/llm/hooks/usePersistedChat.ts` - Continue using as-is
- `lib/llm/utils/citations.ts` - Continue using for parsing
- `components/ai/sources-panel.tsx` - Reuse or enhance with `<Source>`
- `app/globals.css` - QDS tokens already defined

---

## Next Steps (For Architecture Plan)

1. **Install AI Elements** - Inspect actual component APIs
2. **Design Wrapper Components** - Create QDS-styled wrappers
3. **Plan Component Hierarchy** - Parent → Child relationships
4. **Design Props Interfaces** - Exact TypeScript signatures
5. **Migration Strategy** - Incremental steps with testing

---

## Summary

| Aspect | Current | Target | Strategy |
|--------|---------|--------|----------|
| **Architecture** | Custom 850-line modal | AI Elements + wrappers | Hybrid: Elements structure + QDS styling |
| **Message Rendering** | Manual `.map()` | `<Conversation>` | Wrap in glass panel |
| **Citations** | Custom parser + renderer | `<InlineCitation>` + `<Source>` | Keep parser, use Elements for UI |
| **Persistence** | usePersistedChat hook | Continue using | Hook-agnostic Elements |
| **Styling** | QDS glass classes | CVA variants + overrides | Apply QDS via className |
| **Custom Features** | Course selector, post-to-thread | Not in Elements | Keep as separate components |
| **Installation** | N/A | shadcn CLI | `npx shadcn@latest add ai-elements` |

**Key Insight:** AI Elements provide structural components and accessibility, while QDS provides the visual language. Integration is a matter of applying QDS classes to Elements components, not replacing QDS with Elements defaults.

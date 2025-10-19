# Layout Analysis - Chat Interface Scrolling Issues

**Date:** 2025-10-19
**Task:** chat-interface-ux
**Analyzed by:** Component Architect

---

## Executive Summary

The chat interface has **three critical layout problems**:

1. **Input field becomes inaccessible** - Input is inside the scrollable area instead of fixed at bottom
2. **Modal moves unexpectedly** - No height constraints on DialogContent flex container
3. **Scrolling doesn't work properly** - The `Conversation` component is wrapped in `overflow-hidden` parent, preventing scroll

**Root Cause:** The `use-stick-to-bottom` library requires a specific layout pattern that's currently broken by the modal's flex structure.

---

## Current Component Hierarchy

```
QuokkaAssistantModal
└── Dialog
    └── DialogContent (h-[95vh] overflow-hidden glass-panel-strong p-0)
        └── div (flex flex-col h-full) ← LINE 384
            ├── DialogHeader (border-b p-4) ← FIXED
            │   ├── Title/Description
            │   └── Course Selector (dashboard only)
            ├── Error Alert (conditional) ← SCROLLS WITH MESSAGES (WRONG)
            ├── div (flex-1 overflow-hidden) ← LINE 461 - SCROLL CONTAINER
            │   └── QDSConversation
            │       └── Conversation (sidebar-scroll)
            │           └── ConversationContent (p-4 space-y-4)
            │               └── Messages
            └── div (border-t p-4) ← INPUT AREA (SCROLLABLE - WRONG!)
                ├── Quick prompts
                ├── Action buttons
                ├── Rate limit indicator
                └── QDSPromptInput
```

---

## CSS Layout Structure

### QuokkaAssistantModal (lines 383-574)

**Line 383:** `DialogContent`
```tsx
className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh] overflow-hidden glass-panel-strong p-0"
```
- ✅ Fixed height: `h-[95vh]`
- ✅ Overflow hidden: `overflow-hidden` (prevents modal from scrolling)
- ✅ No padding: `p-0` (allows child to control padding)

**Line 384:** Main flex container
```tsx
className="flex flex-col h-full"
```
- ✅ Flex column layout
- ✅ Full height: `h-full`
- ❌ **PROBLEM:** No explicit flex constraints on children

**Line 461:** Message scroll container
```tsx
className="flex-1 overflow-hidden"
```
- ✅ Flex grow: `flex-1` (fills available space)
- ❌ **PROBLEM:** `overflow-hidden` prevents the `Conversation` component from scrolling
- ❌ **PROBLEM:** Should be `overflow-y-auto` to enable scrolling

**Line 487:** Input area
```tsx
className="border-t border-[var(--border-glass)] p-4"
```
- ❌ **PROBLEM:** No flex constraints - this area grows with content
- ❌ **PROBLEM:** When quick prompts, action buttons, and rate limit indicator are visible, this area becomes very tall
- ❌ **PROBLEM:** Not fixed at bottom - scrolls with messages

### QDSConversation (lines 27-77)

**Line 27:** Conversation wrapper
```tsx
<Conversation className={cn("sidebar-scroll", className)}>
```
- ✅ Uses `use-stick-to-bottom` library's `StickToBottom` component
- ✅ Has `sidebar-scroll` for custom scrollbar styling
- ❌ **PROBLEM:** Parent has `overflow-hidden`, blocking scroll functionality

**StickToBottom component** (from `use-stick-to-bottom` library):
```tsx
// From components/ai-elements/conversation.tsx line 12-19
export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-auto", className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);
```
- ✅ Has `overflow-y-auto` built-in
- ✅ Auto-scrolls to bottom on new messages
- ❌ **BLOCKED BY:** Parent's `overflow-hidden` at line 461

---

## Root Causes Analysis

### Issue 1: Input Field Becomes Inaccessible

**Symptom:** User loses the prompt area as conversation extends

**Root Cause:**
- Input area (line 487) has NO flex constraints
- It's inside the scrollable area instead of being a fixed footer
- When messages grow, input scrolls out of view

**Why it happens:**
1. Input area at line 487 has only `border-t` and `p-4` classes
2. No `flex-shrink-0` to prevent it from being pushed out
3. Parent at line 384 has `flex flex-col h-full` but children don't have proper flex distribution
4. As messages grow, flex container tries to fit everything, pushing input down

**Visual representation:**
```
┌─────────────────────┐
│ Header (fixed)      │
├─────────────────────┤
│                     │ ← Scroll container (flex-1 overflow-hidden)
│ Message 1           │
│ Message 2           │
│ Message 3           │
│ ...                 │
│ Message 50          │ ← Viewport ends here
├─────────────────────┤
│ Input area          │ ← USER CAN'T SEE THIS!
└─────────────────────┘
```

### Issue 2: Modal Moves Unexpectedly

**Symptom:** Layout shifts as content grows

**Root Cause:**
- DialogContent has `h-[95vh]` but flex children aren't properly constrained
- Input area can grow unbounded (quick prompts + action buttons + rate limit + input = ~300px)
- No `min-h-0` on flex-1 scroll container to allow it to shrink below content size

**Why it happens:**
1. When input area grows (adding quick prompts, action buttons, rate limit indicator), it pushes against flex-1 scroll container
2. Without `min-h-0`, flex-1 container refuses to shrink below its content height
3. This causes the modal to try to expand beyond `h-[95vh]`
4. Browser compensates by shifting modal position or showing scrollbars

**CSS Flexbox Gotcha:**
> By default, flex items cannot shrink below their content size. Must explicitly set `min-h-0` or `min-height: 0` on flex-1 containers.

### Issue 3: Scrolling Doesn't Work Properly

**Symptom:** Can't scroll through conversation history smoothly

**Root Cause:**
- Line 461 has `overflow-hidden` instead of `overflow-y-auto`
- This **completely blocks** the `Conversation` component's built-in scrolling
- The `use-stick-to-bottom` library expects its parent to allow overflow

**Why it happens:**
1. `Conversation` component (from `use-stick-to-bottom`) has `overflow-y-auto` built-in
2. But its parent wrapper at line 461 has `overflow-hidden`
3. CSS rule: parent's `overflow-hidden` clips child's scrollable content
4. Result: scroll functionality is disabled

**Expected pattern for `use-stick-to-bottom`:**
```tsx
// ❌ WRONG (current)
<div className="flex-1 overflow-hidden">
  <Conversation className="sidebar-scroll">
    <ConversationContent>...</ConversationContent>
  </Conversation>
</div>

// ✅ CORRECT (should be)
<Conversation className="flex-1 sidebar-scroll">
  <ConversationContent>...</ConversationContent>
</Conversation>
```

The `Conversation` component **IS** the scroll container. It doesn't need a wrapper.

---

## Comparison with Best Practices

### Industry Standard: Chat UI Layout Pattern

**Proven Pattern** (used by ChatGPT, Claude, Discord, Slack):

```tsx
<div className="flex flex-col h-screen"> {/* Fixed height container */}

  {/* Header - Fixed */}
  <header className="flex-shrink-0 border-b">
    <h1>Chat Title</h1>
  </header>

  {/* Messages - Scrollable */}
  <div className="flex-1 min-h-0 overflow-y-auto">
    <div className="p-4 space-y-4">
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  </div>

  {/* Input - Fixed */}
  <footer className="flex-shrink-0 border-t p-4">
    <input placeholder="Type a message..." />
    <button>Send</button>
  </footer>

</div>
```

**Key Principles:**
1. **Fixed height container** (`h-screen` or `h-[95vh]`)
2. **Header and footer are `flex-shrink-0`** (don't shrink, always visible)
3. **Message area is `flex-1 min-h-0 overflow-y-auto`** (fills space, scrolls, can shrink)
4. **Input is always at bottom**, never scrolls out of view

### Our Current Pattern (Broken)

```tsx
<div className="flex flex-col h-full"> {/* ✅ Fixed height */}

  {/* Header - Fixed */}
  <header className="p-4 border-b"> {/* ❌ Missing flex-shrink-0 */}
    <h1>Chat Title</h1>
  </header>

  {/* Messages - BLOCKED SCROLL */}
  <div className="flex-1 overflow-hidden"> {/* ❌ Should be overflow-y-auto, NOT overflow-hidden */}
    <Conversation className="sidebar-scroll"> {/* ✅ Has overflow-y-auto but parent blocks it */}
      <ConversationContent className="p-4 space-y-4">
        {messages}
      </ConversationContent>
    </Conversation>
  </div>

  {/* Input - SCROLLABLE (WRONG!) */}
  <div className="border-t p-4"> {/* ❌ Missing flex-shrink-0, grows unbounded */}
    <input />
    <button>Send</button>
  </div>

</div>
```

**Problems vs Best Practices:**
1. ❌ Message wrapper has `overflow-hidden` → blocks scroll
2. ❌ Input area missing `flex-shrink-0` → scrolls out of view
3. ❌ Message wrapper missing `min-h-0` → can't shrink, causes layout shift
4. ❌ Unnecessary wrapper around `Conversation` component

---

## Technical Deep Dive: `use-stick-to-bottom` Library

### How It Works

The `use-stick-to-bottom` library provides auto-scroll functionality:

**Component Hierarchy:**
```tsx
<StickToBottom> {/* Scroll container with auto-scroll logic */}
  <StickToBottom.Content> {/* Content wrapper */}
    {children}
  </StickToBottom.Content>
</StickToBottom>
```

**Built-in Styles** (from `components/ai-elements/conversation.tsx`):
```tsx
// Line 12-19
<StickToBottom
  className={cn("relative flex-1 overflow-y-auto", className)}
  initial="smooth"
  resize="smooth"
  role="log"
  {...props}
/>
```

**Key Features:**
- ✅ `overflow-y-auto` built-in (handles scrolling)
- ✅ `flex-1` built-in (fills available space)
- ✅ Auto-scrolls to bottom when new messages arrive
- ✅ Provides `ConversationScrollButton` for manual scroll-to-bottom
- ✅ Smooth scroll behavior

### Why Our Wrapper Breaks It

**Current code (line 461-483):**
```tsx
<div className="flex-1 overflow-hidden"> {/* ← WRAPPER */}
  {!isChatReady ? (
    <div className="flex items-center justify-center h-full">
      <LoadingState />
    </div>
  ) : (
    <div key={activeConversationId || 'no-conversation'}>
      <QDSConversation
        messages={messages}
        isStreaming={isStreaming}
        onCopy={handleCopy}
        onRetry={handleRetry}
        canRetry={...}
        pageContext={pageContext}
        courseCode={currentCourseCode}
      />
    </div>
  )}
</div>
```

**Problems:**
1. Wrapper has `overflow-hidden` → CSS clips `Conversation`'s scrollbar
2. Wrapper has `flex-1` → Duplicates `Conversation`'s flex-1
3. Inner `div` with `key={activeConversationId}` → Unnecessary wrapper

**Solution:**
```tsx
{!isChatReady ? (
  <div className="flex-1 flex items-center justify-center">
    <LoadingState />
  </div>
) : (
  <QDSConversation
    key={activeConversationId || 'no-conversation'}
    messages={messages}
    isStreaming={isStreaming}
    onCopy={handleCopy}
    onRetry={handleRetry}
    canRetry={...}
    pageContext={pageContext}
    courseCode={currentCourseCode}
    className="flex-1" {/* ← Conversation becomes the flex-1 container */}
  />
)}
```

---

## Key Constraints & Requirements

### QDS Compliance
- ✅ Must maintain `sidebar-scroll` custom scrollbar styling
- ✅ Must keep glass-panel-strong styling on DialogContent
- ✅ Must preserve border-glass tokens
- ✅ Must maintain spacing scale (p-4, gap-3, space-y-4)

### Accessibility
- ✅ Must maintain keyboard navigation (Tab, Shift+Tab)
- ✅ Must preserve ARIA attributes (role="log", aria-live="polite")
- ✅ Must keep focus management (input auto-focus on open)
- ✅ Must maintain screen reader announcements

### Functionality
- ✅ Must preserve auto-scroll on new messages
- ✅ Must keep manual scroll capability
- ✅ Must maintain conversation remounting on activeConversationId change
- ✅ Must not break streaming indicator
- ✅ Must keep all existing features (quick prompts, action buttons, rate limit)

### Responsive Design
- ✅ Must work on mobile (360px) through desktop (1280px)
- ✅ Must maintain `max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl`
- ✅ Must preserve `h-[95vh]` modal height
- ✅ Must keep touch targets ≥44px on mobile

---

## Files Analyzed

### Primary Files
1. **components/ai/quokka-assistant-modal.tsx** (692 lines)
   - Main modal component
   - Lines 383-574: Layout structure
   - Line 461: Broken scroll wrapper
   - Line 487: Unfixed input area

2. **components/ai/elements/qds-conversation.tsx** (79 lines)
   - Conversation container wrapper
   - Line 27: Applies sidebar-scroll class
   - Uses base Conversation component

3. **components/ai-elements/conversation.tsx** (98 lines)
   - Base conversation from use-stick-to-bottom library
   - Line 12-19: StickToBottom wrapper
   - Has overflow-y-auto built-in

4. **components/ai/elements/qds-prompt-input.tsx** (81 lines)
   - Input component
   - Works correctly, no changes needed

5. **app/globals.css** (1114+ lines)
   - Lines 1091-1114: `.sidebar-scroll` custom scrollbar styling
   - QDS glass tokens and utilities

### Related Files (Reference Only)
- **components/ai/elements/qds-message.tsx** - Message rendering (no changes needed)
- **components/ai/elements/qds-response.tsx** - Citation rendering (no changes needed)
- **lib/llm/hooks/usePersistedChat.ts** - Chat hook (no changes needed)

---

## Visual Diagram: Current vs Fixed Layout

### Current Layout (Broken)

```
┌─────────────────────────────────────┐
│ DialogContent (h-[95vh])            │
│ ┌─────────────────────────────────┐ │
│ │ flex flex-col h-full            │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Header (no flex-shrink-0)   │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ flex-1 overflow-hidden ❌   │ │ │ ← Blocks scroll
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ Conversation            │ │ │ │
│ │ │ │ (overflow-y-auto)       │ │ │ │ ← Scroll BLOCKED
│ │ │ │ Messages...             │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Input (no flex-shrink-0) ❌ │ │ │ ← Scrolls out of view
│ │ │ - Quick prompts             │ │ │
│ │ │ - Action buttons            │ │ │
│ │ │ - Rate limit                │ │ │
│ │ │ - Prompt input              │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fixed Layout (Correct)

```
┌─────────────────────────────────────┐
│ DialogContent (h-[95vh])            │
│ ┌─────────────────────────────────┐ │
│ │ flex flex-col h-full            │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Header (flex-shrink-0) ✅   │ │ │ ← Always visible
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Conversation ✅             │ │ │ ← IS the scroll container
│ │ │ (flex-1 min-h-0)            │ │ │
│ │ │ (overflow-y-auto built-in)  │ │ │
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ ConversationContent     │ │ │ │
│ │ │ │ Messages...             │ │ │ │ ← Scrolls smoothly
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Input (flex-shrink-0) ✅    │ │ │ ← Always visible
│ │ │ - Quick prompts             │ │ │
│ │ │ - Action buttons            │ │ │
│ │ │ - Rate limit                │ │ │
│ │ │ - Prompt input              │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Conclusion

The chat interface layout has **three interconnected issues** caused by incorrect flex constraints and overflow properties:

1. **Input scrolls out of view** → Missing `flex-shrink-0` on input area
2. **Modal moves unexpectedly** → Missing `min-h-0` on message area
3. **Scroll doesn't work** → Wrapper has `overflow-hidden` blocking `Conversation`'s scroll

**Fix strategy:**
- Remove wrapper div around `Conversation` component
- Add `flex-shrink-0` to header and input areas
- Add `flex-1` to `Conversation` component directly
- `Conversation` already has `overflow-y-auto` built-in from `use-stick-to-bottom`

All fixes are **pure CSS changes** to existing layout structure. No functional changes needed.

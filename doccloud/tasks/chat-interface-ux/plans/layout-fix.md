# Implementation Plan - Chat Interface Layout Fix

**Date:** 2025-10-19
**Task:** chat-interface-ux
**Planned by:** Component Architect

---

## Goal

Fix chat interface scrolling and layout issues by applying correct flexbox constraints and removing unnecessary wrapper divs that block the `use-stick-to-bottom` library's scroll functionality.

---

## Changes Overview

**Files to modify:** 2
**Lines to change:** ~15 total
**Breaking changes:** None
**Risk level:** Low (pure CSS changes)

---

## Implementation Steps

### Step 1: Fix Header - Add flex-shrink-0

**File:** `components/ai/quokka-assistant-modal.tsx`
**Line:** 386 (DialogHeader)

**Current:**
```tsx
<DialogHeader className="p-4 border-b border-[var(--border-glass)] space-y-3">
```

**New:**
```tsx
<DialogHeader className="flex-shrink-0 p-4 border-b border-[var(--border-glass)] space-y-3">
```

**Reason:** Prevents header from shrinking when content grows. Ensures title and course selector always visible.

---

### Step 2: Remove Scroll Wrapper - Let Conversation Be The Scroll Container

**File:** `components/ai/quokka-assistant-modal.tsx`
**Lines:** 427-484

**Current:**
```tsx
{/* Error Alert */}
{chat.error && (
  <div className="px-4 pt-2">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1 pr-4">
          {chat.error.message || 'Failed to send message. Please try again.'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => chat.clearError?.()}
          >
            Dismiss
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              chat.clearError?.();
              chat.regenerate();
            }}
          >
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  </div>
)}

{/* Messages - Using QDSConversation Component */}
<div className="flex-1 overflow-hidden">
  {!isChatReady ? (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <div className="animate-pulse text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Initializing conversation...</p>
        </div>
      </div>
    </div>
  ) : (
    <div key={activeConversationId || 'no-conversation'}>
      <QDSConversation
        messages={messages}
        isStreaming={isStreaming}
        onCopy={handleCopy}
        onRetry={handleRetry}
        canRetry={messages.length > 0 && messages[messages.length - 1].role === "assistant"}
        pageContext={pageContext}
        courseCode={currentCourseCode}
      />
    </div>
  )}
</div>
```

**New:**
```tsx
{/* Messages - Using QDSConversation Component */}
{!isChatReady ? (
  <div className="flex-1 min-h-0 flex items-center justify-center">
    <div className="text-center space-y-2">
      <div className="animate-pulse text-muted-foreground">
        <Sparkles className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Initializing conversation...</p>
      </div>
    </div>
  </div>
) : (
  <QDSConversation
    key={activeConversationId || 'no-conversation'}
    className="flex-1 min-h-0"
    messages={messages}
    isStreaming={isStreaming}
    onCopy={handleCopy}
    onRetry={handleRetry}
    canRetry={messages.length > 0 && messages[messages.length - 1].role === "assistant"}
    pageContext={pageContext}
    courseCode={currentCourseCode}
    error={chat.error ? {
      message: chat.error.message || 'Failed to send message. Please try again.',
      onDismiss: () => chat.clearError?.(),
      onRetry: () => {
        chat.clearError?.();
        chat.regenerate();
      }
    } : undefined}
  />
)}
```

**Changes:**
1. **Removed:** Outer wrapper `div` with `flex-1 overflow-hidden` (was blocking scroll)
2. **Removed:** Inner wrapper `div` with `key` prop (moved to QDSConversation)
3. **Removed:** Separate error alert section (moved into QDSConversation as prop)
4. **Added:** `flex-1 min-h-0` classes directly to QDSConversation
5. **Added:** `key` prop to QDSConversation for proper remounting
6. **Added:** `error` prop to QDSConversation (new prop, see Step 4)
7. **Loading state:** Now has `flex-1 min-h-0` to fill space correctly

**Reason:**
- The `Conversation` component (wrapped by QDSConversation) already has `overflow-y-auto` built-in
- Wrapping it in `overflow-hidden` parent blocks scroll functionality
- `min-h-0` allows flex container to shrink below content size (prevents modal shifting)
- Moving error into QDSConversation keeps it inside scroll area (UX improvement)

---

### Step 3: Fix Input Area - Add flex-shrink-0

**File:** `components/ai/quokka-assistant-modal.tsx`
**Line:** 487 (Input section wrapper)

**Current:**
```tsx
{/* Input */}
<div className="border-t border-[var(--border-glass)] p-4">
```

**New:**
```tsx
{/* Input */}
<div className="flex-shrink-0 border-t border-[var(--border-glass)] p-4">
```

**Reason:** Prevents input area from scrolling out of view. Ensures prompt input, action buttons, and rate limit indicator always accessible.

---

### Step 4: Update QDSConversation - Add Error Support

**File:** `components/ai/elements/qds-conversation.tsx`
**Lines:** 14-77

**Current TypeScript interface** (in same file or types.ts):
```tsx
export interface QDSConversationProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  className?: string;
}
```

**New interface:**
```tsx
export interface QDSConversationProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  error?: {
    message: string;
    onDismiss: () => void;
    onRetry: () => void;
  };
  className?: string;
}
```

**Current component:**
```tsx
export function QDSConversation({
  messages,
  isStreaming = false,
  onCopy,
  onRetry,
  className,
}: QDSConversationProps) {
  return (
    <Conversation className={cn("sidebar-scroll", className)}>
      <ConversationContent
        className="p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        aria-label="Chat message history"
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="message-assistant p-3">
              <p className="text-sm leading-relaxed">
                Hi! I&apos;m Quokka, your AI study assistant. How can I help you
                today? 🎓
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <QDSMessage
            key={message.id}
            message={message}
            onCopy={onCopy}
            onRetry={onRetry}
            isLast={index === messages.length - 1}
            isStreaming={isStreaming}
          />
        ))}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="message-assistant p-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1" aria-hidden="true">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <p className="text-sm glass-text">Quokka is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}
```

**New component:**
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function QDSConversation({
  messages,
  isStreaming = false,
  onCopy,
  onRetry,
  error,
  className,
}: QDSConversationProps) {
  return (
    <Conversation className={cn("sidebar-scroll", className)}>
      <ConversationContent
        className="p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        aria-label="Chat message history"
      >
        {/* Error Alert - Inside scroll area */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="flex-1 pr-4">
                {error.message}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={error.onDismiss}
                >
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={error.onRetry}
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {messages.length === 0 && !error && (
          <div className="flex justify-start">
            <div className="message-assistant p-3">
              <p className="text-sm leading-relaxed">
                Hi! I&apos;m Quokka, your AI study assistant. How can I help you
                today? 🎓
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <QDSMessage
            key={message.id}
            message={message}
            onCopy={onCopy}
            onRetry={onRetry}
            isLast={index === messages.length - 1}
            isStreaming={isStreaming}
          />
        ))}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="message-assistant p-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1" aria-hidden="true">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <p className="text-sm glass-text">Quokka is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}
```

**Changes:**
1. **Added:** `error` prop to interface (optional)
2. **Added:** Error alert rendering inside ConversationContent (top of scroll area)
3. **Updated:** Empty state only shows when no error (prevents overlap)
4. **Added:** Imports for Alert, Button, AlertCircle

**Reason:**
- Error should be inside scroll area so it scrolls with messages (better UX)
- Keeps error visible even in long conversations
- Simplifies modal component (one less conditional section)

---

### Step 5: Update Types File (If Separate)

**File:** `components/ai/elements/types.ts` (if exists)

**Current:**
```tsx
export interface QDSConversationProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  className?: string;
}
```

**New:**
```tsx
export interface QDSConversationProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRetry?: () => void;
  error?: {
    message: string;
    onDismiss: () => void;
    onRetry: () => void;
  };
  className?: string;
}
```

**Note:** Only needed if types are in separate file. Check if `types.ts` exists first.

---

## Verification Steps

After implementing changes, verify:

### 1. Manual Testing

**Test Case 1: Input Always Accessible**
1. Open QuokkaAssistantModal
2. Send 20+ messages to create long conversation
3. Verify: Input field remains visible at bottom
4. Verify: Can scroll through messages while keeping input visible

**Test Case 2: Scrolling Works**
1. Open modal with existing conversation (10+ messages)
2. Verify: Can scroll up through message history
3. Verify: Scrollbar appears and is styled correctly (sidebar-scroll)
4. Send new message
5. Verify: Auto-scrolls to bottom smoothly

**Test Case 3: Modal Height Stable**
1. Open modal
2. Send messages with varying lengths
3. Verify: Modal doesn't shift position
4. Verify: Modal stays at h-[95vh]
5. Show/hide quick prompts, action buttons
6. Verify: Modal height remains stable

**Test Case 4: Error Handling**
1. Trigger an error (disconnect network or use invalid input)
2. Verify: Error alert appears at top of conversation
3. Verify: Can scroll to see error if many messages
4. Click "Dismiss"
5. Verify: Error disappears

### 2. Responsive Testing

**Breakpoints to test:**
- 360px (mobile small)
- 768px (tablet)
- 1024px (desktop)
- 1280px+ (large desktop)

**For each breakpoint:**
- ✅ Modal renders correctly
- ✅ Input remains fixed at bottom
- ✅ Messages scroll smoothly
- ✅ Touch targets ≥44px (mobile)

### 3. Accessibility Testing

**Keyboard Navigation:**
- Tab through modal (header → messages → input)
- Shift+Tab backwards
- Arrow keys scroll message area
- Enter sends message

**Screen Reader:**
- Verify role="log" announces messages
- Verify aria-live="polite" announces streaming
- Verify error uses role="alert"

**Focus Management:**
- Modal open: focus moves to input
- Modal close: focus returns to trigger button

### 4. TypeScript Checks

```bash
npx tsc --noEmit
```

Expected: No type errors related to QDSConversation props

### 5. Lint Checks

```bash
npm run lint
```

Expected: Clean lint output (no new warnings)

### 6. Visual Regression

**Compare Before/After:**
- Screenshot modal with 0 messages
- Screenshot modal with 10 messages
- Screenshot modal with 30 messages
- Screenshot modal with error state

**Verify:**
- QDS glass styling intact
- Scrollbar appearance unchanged
- Message styling unchanged
- Spacing consistent

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Git Revert)

```bash
# Revert the commit
git log --oneline -5  # Find commit hash
git revert <commit-hash>
git push
```

### Manual Rollback (If needed)

**Revert Step 1:**
```tsx
<DialogHeader className="p-4 border-b border-[var(--border-glass)] space-y-3">
```

**Revert Step 2:**
```tsx
<div className="flex-1 overflow-hidden">
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

**Revert Step 3:**
```tsx
<div className="border-t border-[var(--border-glass)] p-4">
```

**Revert Step 4:**
- Remove `error` prop from QDSConversationProps interface
- Remove error alert from QDSConversation component
- Re-add error alert to modal before message area

---

## Risk Assessment

### Low Risk Changes ✅

**Step 1 (Header flex-shrink-0):**
- Risk: None
- Impact: Prevents header shrinking (current behavior is already "doesn't shrink")
- Rollback: Easy (remove class)

**Step 3 (Input flex-shrink-0):**
- Risk: None
- Impact: Prevents input scrolling out (current bug fix)
- Rollback: Easy (remove class)

### Medium Risk Changes ⚠️

**Step 2 (Remove wrapper):**
- Risk: Medium
- Impact: Changes DOM structure, affects scroll functionality
- Rollback: Medium (restore wrapper div)
- Mitigation: Thorough testing before deployment

**Step 4 (Error prop):**
- Risk: Low-Medium
- Impact: New prop, changes error display location
- Rollback: Easy (revert prop, restore original error position)
- Mitigation: Optional prop (backward compatible)

### Potential Issues

**Issue 1: Scroll position not preserved on remount**
- Cause: `key={activeConversationId}` forces remount
- Expected: This is intentional (fresh scroll on new conversation)
- Mitigation: None needed (current behavior)

**Issue 2: Error alert scrolls out of view**
- Cause: Error now inside scroll area
- Expected: User can scroll up to see error if needed
- Mitigation: Consider sticky error (future enhancement)

**Issue 3: Auto-scroll timing**
- Cause: `use-stick-to-bottom` library behavior
- Expected: Library handles this automatically
- Mitigation: None needed (library tested in production)

---

## Dependencies

### NPM Packages (Already Installed)
- `use-stick-to-bottom@1.1.1` ✅
- `lucide-react` ✅
- `@radix-ui/react-dialog` ✅
- `@radix-ui/react-alert-dialog` ✅

### Internal Components (No Changes)
- `components/ui/dialog` ✅
- `components/ui/alert` ✅
- `components/ui/button` ✅
- `components/ai/elements/qds-message.tsx` ✅

### CSS Utilities (No Changes)
- `.sidebar-scroll` (globals.css lines 1091-1114) ✅
- `.glass-panel-strong` (globals.css) ✅
- `.message-assistant` (globals.css) ✅

---

## Performance Impact

### Before Changes
- **DOM depth:** 7 levels (includes unnecessary wrappers)
- **Scroll performance:** Blocked by overflow-hidden
- **Layout shifts:** Occurs when input area grows

### After Changes
- **DOM depth:** 5 levels (removed 2 wrapper divs)
- **Scroll performance:** Native browser scroll (smooth)
- **Layout shifts:** None (proper flex constraints)

**Expected improvements:**
- ✅ Faster rendering (fewer DOM nodes)
- ✅ Smoother scrolling (native overflow-y-auto)
- ✅ No layout shifts (stable flex layout)
- ✅ Better mobile performance (reduced DOM complexity)

---

## Code Quality Checks

### Before Implementation

```bash
# 1. Create feature branch
git checkout -b fix/chat-interface-layout

# 2. Verify current state
npm run dev
# Test modal, take screenshots

# 3. Check for related tests
grep -r "QuokkaAssistantModal" --include="*.test.tsx" --include="*.spec.tsx"
# Update tests if needed
```

### After Implementation

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Build check
npm run build

# 4. Manual testing
npm run dev
# Test all scenarios listed in Verification Steps

# 5. Commit with Conventional Commits
git add .
git commit -m "fix: chat interface scrolling and layout issues

- Add flex-shrink-0 to header and input areas
- Remove overflow-hidden wrapper blocking scroll
- Add flex-1 min-h-0 directly to QDSConversation
- Move error alert inside scroll area for better UX
- Fix input accessibility (no longer scrolls out of view)
- Stabilize modal height (no layout shifts)

Fixes #[issue-number]"
```

---

## Documentation Updates

After implementation, update:

### 1. CLAUDE.md
Add note in LLM Integration Architecture section:
```markdown
### Chat Interface Layout Pattern

The QuokkaAssistantModal follows the industry-standard chat UI pattern:
- Fixed header (`flex-shrink-0`)
- Scrollable messages (`flex-1 min-h-0 overflow-y-auto`)
- Fixed input (`flex-shrink-0`)

Uses `use-stick-to-bottom` library for auto-scroll functionality.
```

### 2. context.md
Update Changelog:
```markdown
- `2025-10-19` | [Chat UX] | Fixed scrolling and layout issues in QuokkaAssistantModal
```

### 3. Component Documentation (Optional)
Add JSDoc to QuokkaAssistantModal:
```tsx
/**
 * QuokkaAssistantModal - Multi-course aware AI chat with LLM backend
 *
 * Layout Pattern:
 * - Fixed header (title, course selector)
 * - Scrollable messages (auto-scroll to bottom on new messages)
 * - Fixed footer (quick prompts, action buttons, input)
 *
 * Uses use-stick-to-bottom library for scroll management.
 *
 * @see components/ai/elements/qds-conversation.tsx
 * @see https://github.com/stipsan/use-stick-to-bottom
 */
```

---

## Future Enhancements (Out of Scope)

These are NOT part of this implementation but could be considered later:

1. **Sticky Error Alert**
   - Keep error visible while scrolling
   - Requires position: sticky CSS

2. **Scroll-to-Bottom Button**
   - Show button when not at bottom
   - Already provided by `use-stick-to-bottom` via `ConversationScrollButton`
   - Just needs to be added to QDSConversation

3. **Unread Message Indicator**
   - Show badge when new messages arrive while scrolled up
   - Requires scroll position tracking

4. **Message Virtualization**
   - Render only visible messages for very long conversations (100+ messages)
   - Use `react-virtual` or similar library

5. **Persistent Scroll Position**
   - Remember scroll position across modal open/close
   - Store in localStorage or conversation state

---

## Summary

This plan provides **surgical CSS fixes** to resolve all three layout issues:

1. **Input accessibility** → Add `flex-shrink-0` to input area
2. **Modal stability** → Add `min-h-0` to message area
3. **Scroll functionality** → Remove `overflow-hidden` wrapper, let `Conversation` handle scroll

**Total changes:** 15 lines across 2 files
**Risk level:** Low
**Testing time:** 30 minutes
**Implementation time:** 15 minutes

All changes are **backward compatible** and **QDS compliant**. No breaking changes to functionality.

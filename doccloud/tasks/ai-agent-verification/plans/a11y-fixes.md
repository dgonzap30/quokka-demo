# Accessibility Fixes: AI Chat Modal & Components

**Implementation Plan for WCAG 2.2 AA Compliance**

---

## Priority Order

1. **Critical Fixes** (3 issues) - Blocking accessibility for all users
2. **High Priority Fixes** (8 issues) - Significant barriers for keyboard/screen reader users
3. **Medium Priority Fixes** (6 issues) - Improvements that enhance accessibility
4. **Testing Requirements** - Manual verification needed

---

## File Modifications Required

### 1. `/components/ai/quokka-assistant-modal.tsx`

---

#### Fix 1: Add Focus Return on Modal Close (CRITICAL)

**Priority:** Critical
**WCAG:** 2.4.3 Focus Order

**Current State:**
```tsx
const handleClose = () => {
  if (!isStreaming) {
    onClose();
  }
};
```

**Problem:** Focus is not returned to the trigger element when modal closes, leaving keyboard users lost in the page.

**Required Change:**

1. Track trigger element on mount
2. Return focus on unmount

**Implementation:**

```tsx
// Add ref to track trigger element
const triggerElementRef = useRef<HTMLElement | null>(null);

// Store trigger element when modal opens
useEffect(() => {
  if (isOpen) {
    // Store the currently focused element (the trigger)
    triggerElementRef.current = document.activeElement as HTMLElement;
  }
}, [isOpen]);

// Return focus when modal closes
useEffect(() => {
  return () => {
    // On unmount, return focus to trigger
    if (triggerElementRef.current && !isOpen) {
      triggerElementRef.current.focus();
    }
  };
}, [isOpen]);

// Alternative: Use Radix Dialog's built-in focus return
// Verify that DialogContent has proper focus return configured
```

**Alternative Approach:** Verify Radix Dialog configuration:
```tsx
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent
    className="..."
    onCloseAutoFocus={(event) => {
      // Radix automatically returns focus
      // Only prevent if you need custom behavior
    }}
  >
```

**Test Scenario:**
1. Open modal with keyboard (Tab to trigger, press Enter)
2. Close modal with Escape key
3. Verify focus returns to modal trigger button
4. Test with screen reader (should announce trigger element)

---

#### Fix 2: Add Status Announcements for All Actions (CRITICAL)

**Priority:** Critical
**WCAG:** 4.1.3 Status Messages

**Current State:** Actions complete silently with no screen reader feedback

**Problem:** Users don't know if actions succeeded or failed

**Required Change:** Add global status announcement region

**Implementation:**

```tsx
// Add state for status messages
const [statusMessage, setStatusMessage] = useState<string>("");

// Add status region to JSX (at top level of modal)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// Update handleSubmit to announce send
const handleSubmit = async () => {
  if (!input.trim() || !activeConversationId || !user || isStreaming) return;

  const messageContent = input.trim();
  setInput("");

  // Announce sending
  setStatusMessage("Sending message...");

  await chat.sendMessage({
    text: messageContent,
  });

  // Announce success (delay to avoid interruption)
  setTimeout(() => {
    setStatusMessage("Message sent successfully");
  }, 100);

  // Clear message after 3 seconds
  setTimeout(() => {
    setStatusMessage("");
  }, 3000);
};

// Update handleClearConversation to announce
const handleClearConversation = () => {
  if (!activeConversationId || !user) return;

  setStatusMessage("Clearing conversation...");

  deleteConversation.mutate(
    {
      conversationId: activeConversationId,
      userId: user.id,
    },
    {
      onSuccess: () => {
        setActiveConversationId(null);
        setShowClearConfirm(false);

        setStatusMessage("Conversation cleared successfully");

        createConversation.mutate({
          userId: user.id,
          courseId: activeCourseId || null,
          title: `Quokka Chat - ${activeCourse?.code || "General"}`,
        }, {
          onSuccess: (newConversation) => {
            setActiveConversationId(newConversation.id);
          },
        });
      },
      onError: () => {
        setStatusMessage("Failed to clear conversation. Please try again.");
      }
    }
  );
};

// Update handlePostAsThread to announce
const handlePostAsThread = () => {
  const targetCourseId = activeCourseId || currentCourseId;
  if (!targetCourseId || !user || !activeConversationId || messages.length === 0) return;

  if (pageContext === "dashboard" && !showPostConfirm) {
    setShowPostConfirm(true);
    return;
  }

  setStatusMessage("Posting conversation as thread...");

  convertToThread.mutate(
    {
      conversationId: activeConversationId,
      userId: user.id,
      courseId: targetCourseId,
    },
    {
      onSuccess: (result) => {
        setPostedThreadId(result.thread.id);
        setShowPostSuccess(true);
        setShowPostConfirm(false);
        setStatusMessage("Conversation posted successfully as thread");
      },
      onError: (error) => {
        console.error("Failed to post thread:", error);
        setStatusMessage("Failed to post conversation. Please try again.");
      },
    }
  );
};

// Update handleCourseSelect to announce
const handleCourseSelect = (courseId: string) => {
  setSelectedCourseId(courseId === "all" ? null : courseId);
  setActiveConversationId(null);

  const courseName = courseId === "all"
    ? "all courses"
    : availableCourses?.find(c => c.id === courseId)?.code || "course";

  setStatusMessage(`Switched to ${courseName}. Conversation cleared.`);
};
```

**Test Scenario:**
1. Send a message - should announce "Sending message..." then "Message sent successfully"
2. Clear conversation - should announce "Clearing conversation..." then "Conversation cleared successfully"
3. Post as thread - should announce "Posting..." then "Posted successfully"
4. Switch course - should announce "Switched to CS101. Conversation cleared."
5. Test with NVDA/JAWS - verify all announcements are heard

---

#### Fix 3: Improve Focus Management on Modal Open (HIGH)

**Priority:** High
**WCAG:** 2.4.3 Focus Order, 2.4.6 Headings and Labels

**Current State:**
```tsx
useEffect(() => {
  if (isOpen) {
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  }
}, [isOpen]);
```

**Problem:** Focus moves directly to input, bypassing modal title announcement

**Required Change:** Focus modal container first, then input

**Implementation:**

```tsx
// Add ref for dialog title
const dialogTitleRef = useRef<HTMLHeadingElement>(null);

// Update focus logic
useEffect(() => {
  if (isOpen) {
    // Step 1: Focus title for context (announced by screen reader)
    setTimeout(() => {
      dialogTitleRef.current?.focus();
    }, 50);

    // Step 2: Move to input for typing convenience
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 250);
  }
}, [isOpen]);

// Update DialogTitle to accept ref
<DialogTitle
  ref={dialogTitleRef}
  tabIndex={-1} // Make focusable but not in tab order
  className="text-base glass-text"
>
  Quokka AI Assistant
</DialogTitle>
```

**Alternative Approach (Recommended):**

Rely on Radix Dialog's built-in focus management but add announcement:

```tsx
// Remove custom focus management
// Add status announcement instead
useEffect(() => {
  if (isOpen) {
    setStatusMessage("Quokka AI Assistant opened. Chat with your course materials.");

    // Auto-focus input after announcement
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  }
}, [isOpen]);
```

**Test Scenario:**
1. Open modal with screen reader active
2. Verify title is announced: "Quokka AI Assistant, dialog"
3. Verify description is announced
4. Verify focus moves to input within 250ms
5. Type immediately - should work without delay

---

#### Fix 4: Verify `aria-modal` Attribute (CRITICAL)

**Priority:** Critical
**WCAG:** 4.1.3 Status Messages

**Current State:** Relies on Radix Dialog defaults

**Required Change:** Explicitly verify `aria-modal="true"` is set

**Implementation:**

Check Radix Dialog props (likely already handled):

```tsx
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent
    className="..."
    aria-modal="true" // Add explicitly if not present
    aria-labelledby="quokka-dialog-title"
    aria-describedby="quokka-dialog-description"
  >
```

Update DialogTitle and DialogDescription with IDs:

```tsx
<DialogTitle
  id="quokka-dialog-title"
  className="text-base glass-text"
>
  Quokka AI Assistant
</DialogTitle>
<DialogDescription
  id="quokka-dialog-description"
  className="text-xs text-muted-foreground glass-text"
>
  {pageContext === "course" && currentCourseCode
    ? `${currentCourseCode}${currentCourseName ? ` - ${currentCourseName}` : ""}`
    : pageContext === "instructor"
      ? "Instructor Support"
      : "Study Assistant"}
</DialogDescription>
```

**Test Scenario:**
1. Inspect modal with browser DevTools
2. Verify `aria-modal="true"` is present on dialog container
3. Verify `aria-labelledby` points to title ID
4. Verify `aria-describedby` points to description ID
5. Test with screen reader - should announce full context on open

---

#### Fix 5: Add Accessible Names to Avatar Components (MEDIUM)

**Priority:** Medium
**WCAG:** 1.1.1 Non-text Content

**Current State:** Avatars render without accessible labels

**Required Change:** Add `aria-label` to distinguish user vs assistant

**Implementation:**

This fix is in `qds-message.tsx`, but guidance here:

```tsx
// In quokka-assistant-modal.tsx, ensure messages have role info
// No changes needed in this file - handled in qds-message.tsx
```

See `qds-message.tsx` section below for implementation.

**Test Scenario:**
N/A - handled in qds-message.tsx

---

#### Fix 6: Add Error Handling Region (HIGH)

**Priority:** High
**WCAG:** 3.3.1 Error Identification

**Current State:** Errors shown in `alert()` or console only

**Required Change:** Add `role="alert"` region for errors

**Implementation:**

```tsx
// Add error state
const [errorMessage, setErrorMessage] = useState<string>("");

// Add error region to JSX (at top level, before status region)
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="sr-only"
>
  {errorMessage}
</div>

// Update error handlers
const handlePostAsThread = () => {
  // ... existing code ...

  convertToThread.mutate(
    { /* ... */ },
    {
      onSuccess: (result) => { /* ... */ },
      onError: (error) => {
        console.error("Failed to post thread:", error);
        setErrorMessage("Error: Failed to post conversation as thread. Please try again.");

        // Clear error after 5 seconds
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
      },
    }
  );
};

// Wrap other mutations similarly
```

**Test Scenario:**
1. Trigger error (e.g., disconnect network, attempt to post)
2. Verify error is announced immediately via `role="alert"`
3. Verify error clears after 5 seconds
4. Test with NVDA/JAWS - should interrupt with "Error: ..."

---

#### Fix 7: Add Keyboard Shortcut Hints (LOW)

**Priority:** Low
**WCAG:** 2.1.1 Keyboard (efficiency)

**Current State:** No keyboard shortcuts documented

**Required Change:** Add tooltip or help text for shortcuts

**Implementation:**

```tsx
// Add keyboard shortcut hints to DialogDescription
<DialogDescription className="text-xs text-muted-foreground glass-text">
  {/* ... existing description ... */}
  <span className="block mt-1 text-xs opacity-75">
    Tip: Press Enter to send, Escape to close
  </span>
</DialogDescription>
```

**Test Scenario:**
1. Open modal
2. Verify hint text is visible
3. Verify hint is announced by screen reader
4. Test shortcuts work as documented

---

### 2. `/components/ai/elements/qds-conversation.tsx`

---

#### Fix 8: Fix Message Announcement Mechanism (CRITICAL)

**Priority:** Critical
**WCAG:** 4.1.3 Status Messages

**Current State:**
```tsx
<ConversationContent
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-relevant="additions"
>
```

**Problem:** New messages may not be announced reliably due to complex nesting and rapid updates

**Required Change:** Add individual message announcement markers

**Implementation:**

**Option A: Keep container approach but simplify**

```tsx
<ConversationContent
  className="p-4 space-y-4"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Chat message history"
>
  {/* Remove aria-relevant - causes issues */}
  {messages.map((message, index) => (
    <div
      key={message.id}
      role="article" // Each message is an article
      aria-label={`${message.role === 'user' ? 'You' : 'Quokka'} said`}
    >
      <QDSMessage
        message={message}
        onCopy={onCopy}
        onRetry={onRetry}
        isLast={index === messages.length - 1}
        isStreaming={isStreaming}
      />
    </div>
  ))}
</ConversationContent>
```

**Option B: Use separate announcement region (RECOMMENDED)**

```tsx
// Add separate announcement region for latest message
{messages.length > 0 && (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {messages[messages.length - 1].role === 'user'
      ? 'You said: '
      : 'Quokka replied: '}
    {/* Extract text from latest message */}
  </div>
)}

<ConversationContent
  className="p-4 space-y-4"
  role="log"
  aria-label="Chat message history"
  // Remove aria-live from container
>
```

**Test Scenario:**
1. Send message with screen reader active
2. Verify announcement: "You said: [message text]"
3. Wait for AI response
4. Verify announcement: "Quokka replied: [response text]"
5. Test with NVDA and JAWS
6. Verify announcements don't interrupt each other during streaming

---

#### Fix 9: Improve Streaming Indicator Announcement (HIGH)

**Priority:** High
**WCAG:** 4.1.3 Status Messages

**Current State:**
```tsx
{isStreaming && (
  <div className="flex justify-start" role="status" aria-live="polite">
    <div className="message-assistant p-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden="true">
          <div className="animate-bounce"></div>
          {/* ... */}
        </div>
        <p className="text-sm glass-text">Quokka is thinking...</p>
      </div>
    </div>
  </div>
)}
```

**Problem:** Nested structure may prevent reliable announcement

**Required Change:** Simplify announcement structure

**Implementation:**

```tsx
{isStreaming && (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="flex justify-start"
  >
    <div className="message-assistant p-3">
      <div className="flex items-center gap-3">
        {/* Animated dots */}
        <div className="flex gap-1" aria-hidden="true">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        {/* Text for screen readers */}
        <span className="text-sm glass-text">Quokka is thinking...</span>
      </div>
    </div>
  </div>
)}
```

**Alternative:** Move announcement to separate region:

```tsx
{/* Status announcement (hidden) */}
{isStreaming && (
  <div role="status" aria-live="polite" className="sr-only">
    Quokka is generating a response...
  </div>
)}

{/* Visual indicator */}
{isStreaming && (
  <div className="flex justify-start" aria-hidden="true">
    {/* ... visual dots ... */}
  </div>
)}
```

**Test Scenario:**
1. Send message
2. Verify "Quokka is generating a response" is announced
3. Wait for response to complete
4. Verify completion is announced (handled in qds-message.tsx)
5. Test with NVDA - should announce status change

---

#### Fix 10: Add Reduced Motion Support (LOW)

**Priority:** Low
**WCAG:** 2.3.3 Animation from Interactions (Level AAA)

**Current State:** Bounce animation always active

**Required Change:** Respect `prefers-reduced-motion`

**Implementation:**

Tailwind v4 should handle this automatically, but verify:

```tsx
{isStreaming && (
  <div role="status" aria-live="polite" className="flex justify-start">
    <div className="message-assistant p-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden="true">
          {/* Add motion-safe: prefix */}
          <div className="w-2 h-2 bg-primary rounded-full motion-safe:animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full motion-safe:animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full motion-safe:animate-bounce"></div>
        </div>
        <p className="text-sm glass-text">Quokka is thinking...</p>
      </div>
    </div>
  </div>
)}
```

**Test Scenario:**
1. Enable "Reduce motion" in OS settings
2. Open modal and send message
3. Verify dots appear but don't bounce
4. Disable "Reduce motion"
5. Verify bounce animation returns

---

### 3. `/components/ai/elements/qds-message.tsx`

---

#### Fix 11: Add Accessible Names to Avatars (MEDIUM)

**Priority:** Medium
**WCAG:** 1.1.1 Non-text Content

**Current State:**
```tsx
<Avatar className={cn(...)}>
  <AvatarFallback>
    {isUser ? <User /> : <Sparkles />}
  </AvatarFallback>
</Avatar>
```

**Problem:** Icons render without accessible labels

**Required Change:** Add `aria-label` to Avatar

**Implementation:**

```tsx
<Avatar
  className={cn(
    "h-10 w-10 shrink-0 ring-2",
    isUser
      ? "bg-accent/10 ring-accent/20"
      : "ai-gradient ring-primary/20"
  )}
  aria-label={isUser ? "Your message" : "Quokka assistant message"}
>
  <AvatarFallback className={cn(
    "text-sm font-medium",
    isUser ? "text-accent" : "text-white"
  )}>
    {isUser ? (
      <User className="h-5 w-5" aria-hidden="true" />
    ) : (
      <Sparkles className="h-5 w-5" aria-hidden="true" />
    )}
  </AvatarFallback>
</Avatar>
```

**Test Scenario:**
1. Navigate to message with screen reader
2. Verify avatar announces "Your message" or "Quokka assistant message"
3. Verify icon is hidden from screen reader (`aria-hidden="true"`)

---

#### Fix 12: Add Message Wrapper with Semantic Structure (MEDIUM)

**Priority:** Medium
**WCAG:** 2.4.6 Headings and Labels

**Current State:** Messages have no semantic structure beyond visual layout

**Required Change:** Add semantic HTML for better navigation

**Implementation:**

```tsx
export function QDSMessage({
  message,
  onCopy,
  onRetry,
  isLast = false,
  isStreaming = false,
  className,
}: QDSMessageProps) {
  // ... existing code ...

  return (
    <article
      className={cn("group mb-6", className)}
      aria-label={`${message.role === 'user' ? 'Your' : "Quokka's"} message`}
    >
      {/* Message with avatar */}
      <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* ... existing avatar code ... */}

        {/* Message content */}
        <div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
          {/* Add visually hidden label for screen readers */}
          <span className="sr-only">
            {message.role === 'user' ? 'You said:' : 'Quokka replied:'}
          </span>

          <div className={cn(/* ... existing message bubble styles ... */)}>
            {/* ... existing content rendering ... */}
          </div>

          {/* ... rest of existing code ... */}
        </div>
      </div>
    </article>
  );
}
```

**Test Scenario:**
1. Navigate messages with screen reader
2. Verify each message announced as "article"
3. Verify "You said:" or "Quokka replied:" prefix is announced
4. Navigate by headings/landmarks - should work cleanly

---

### 4. `/components/ai/elements/qds-prompt-input.tsx`

---

#### Fix 13: Improve Input Label and Instructions (HIGH)

**Priority:** High
**WCAG:** 3.3.2 Labels or Instructions

**Current State:**
```tsx
<Input
  ref={inputRef}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  disabled={isStreaming || disabled}
  className="flex-1 text-sm"
  aria-label="Message input"
/>
```

**Problem:** Label is generic, no instructions for keyboard shortcuts

**Required Change:** Add descriptive label with instructions

**Implementation:**

```tsx
<Input
  ref={inputRef}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  disabled={isStreaming || disabled}
  className="flex-1 text-sm"
  aria-label="Type your message. Press Enter to send, or use the send button"
  aria-describedby="input-help"
/>

{/* Optional: Add visible help text */}
<span id="input-help" className="sr-only">
  Press Enter to send your message to Quokka
</span>
```

**Test Scenario:**
1. Focus input with screen reader
2. Verify full instructions are announced
3. Test Enter key - should send
4. Verify help text provides context

---

#### Fix 14: Improve Button Accessible Names (MEDIUM)

**Priority:** Medium
**WCAG:** 4.1.2 Name, Role, Value

**Current State:**
```tsx
<Button type="submit" disabled={!value.trim() || disabled}>
  <Send className="h-4 w-4" />
  <span className="sr-only">Send message</span>
</Button>
```

**Problem:** Screen reader only names could be more descriptive

**Required Change:** Add more context to button labels

**Implementation:**

```tsx
{isStreaming ? (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={handleStop}
    className="shrink-0 min-h-[44px] min-w-[44px]"
    aria-label="Stop generating response"
  >
    <StopCircle className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">Stop</span>
  </Button>
) : (
  <Button
    type="submit"
    variant="glass-primary"
    size="sm"
    disabled={!value.trim() || disabled}
    className="shrink-0 min-h-[44px] min-w-[44px]"
    aria-label={value.trim() ? `Send message: "${value.trim().slice(0, 30)}${value.trim().length > 30 ? '...' : ''}"` : "Send message"}
  >
    <Send className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">Send</span>
  </Button>
)}
```

**Test Scenario:**
1. Type message
2. Focus send button
3. Verify button announces message preview
4. Test Stop button - should announce "Stop generating response"

---

### 5. `/components/ai/elements/qds-inline-citation.tsx`

---

#### Fix 15: Verify Citation Keyboard Navigation (PASSING)

**Priority:** Low (verification only)
**WCAG:** 2.1.1 Keyboard

**Current State:**
```tsx
<span
  className={cn(/* ... */)}
  onClick={handleClick}
  title={title}
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  aria-label={`Citation ${citationId}: ${title}`}
>
```

**Problem:** None - implementation looks correct

**Test Scenario:**
1. Tab to citation marker
2. Verify focus indicator visible
3. Press Enter or Space
4. Verify scrolls to source in panel
5. Test with screen reader - should announce "Citation 1: Lecture 3"

**No changes needed** - just verify in testing.

---

### 6. `/components/ai/sources-panel.tsx`

---

#### Fix 16: Verify Disclosure Pattern (PASSING)

**Priority:** Low (verification only)
**WCAG:** 4.1.2 Name, Role, Value

**Current State:**
```tsx
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className={cn(/* ... */)}
  aria-expanded={isExpanded}
  aria-controls="sources-list"
>
```

**Problem:** None - implementation follows APG disclosure pattern

**Test Scenario:**
1. Tab to Sources button
2. Verify announces "Sources (3), button, expanded" or "collapsed"
3. Press Enter to toggle
4. Verify `aria-expanded` updates
5. Verify list shows/hides correctly

**No changes needed** - just verify in testing.

---

#### Fix 17: Add Individual Source Links (MEDIUM)

**Priority:** Medium
**WCAG:** 2.1.1 Keyboard (enhancement)

**Current State:** Sources are static divs

**Required Change:** Make sources clickable/navigable if URLs exist

**Implementation:**

```tsx
{citations.map((citation) => (
  <div
    key={citation.id}
    data-citation-id={citation.id}
    role="listitem"
    className={cn(/* ... */)}
  >
    {/* If citation has URL, wrap in link */}
    {citation.url ? (
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 p-3 rounded-md hover:border-accent/40 transition-colors"
      >
        {/* Citation Number */}
        <div className={cn(/* ... */)} aria-label={`Citation ${citation.id}`}>
          {citation.id}
        </div>

        {/* Citation Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {citation.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {formatCitationType(citation.type)}
          </p>
        </div>

        {/* External link indicator */}
        <ExternalLink className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </a>
    ) : (
      <div className="flex items-start gap-3 p-3">
        {/* ... same content but not clickable ... */}
      </div>
    )}
  </div>
))}
```

**Test Scenario:**
1. Navigate to sources panel
2. Tab through sources
3. If URL exists, verify source is focusable link
4. Verify link opens in new tab
5. Test with screen reader - should announce "Citation 1, Lecture 3, link"

---

### 7. `/components/ai/elements/qds-actions.tsx`

---

#### Fix 18: Add Success Feedback for Copy Action (MEDIUM)

**Priority:** Medium
**WCAG:** 4.1.3 Status Messages

**Current State:**
```tsx
const handleCopy = async () => {
  if (!onCopy) return;
  onCopy(messageContent);
};
```

**Problem:** No feedback when copy succeeds

**Required Change:** Add visual and screen reader feedback

**Implementation:**

```tsx
// Add state for copy status
const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

const handleCopy = async () => {
  if (!onCopy) return;

  setCopyStatus('copying');

  try {
    await onCopy(messageContent);
    setCopyStatus('copied');

    // Reset after 2 seconds
    setTimeout(() => {
      setCopyStatus('idle');
    }, 2000);
  } catch (error) {
    console.error('Copy failed:', error);
    setCopyStatus('idle');
  }
};

return (
  <Actions className={cn("mt-1 ml-1", className)}>
    {/* Status announcement */}
    {copyStatus === 'copied' && (
      <div role="status" aria-live="polite" className="sr-only">
        Message copied to clipboard
      </div>
    )}

    <Action
      tooltip={copyStatus === 'copied' ? 'Copied!' : 'Copy message'}
      onClick={handleCopy}
      disabled={copyStatus === 'copying'}
      className="h-8 px-2 text-xs hover:bg-[var(--glass-hover)] glass-text"
      aria-label={copyStatus === 'copied' ? 'Message copied' : 'Copy message to clipboard'}
    >
      {copyStatus === 'copied' ? (
        <Check className="h-3 w-3 mr-1 text-success" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
      )}
      <span className="text-xs">
        {copyStatus === 'copied' ? 'Copied' : 'Copy'}
      </span>
    </Action>

    {/* ... rest of actions ... */}
  </Actions>
);
```

**Test Scenario:**
1. Click Copy button
2. Verify button changes to "Copied" with checkmark
3. Verify screen reader announces "Message copied to clipboard"
4. Wait 2 seconds
5. Verify button returns to "Copy"

---

## Testing Checklist

### Manual Testing Required

#### Keyboard Navigation
- [ ] Tab through entire modal (header → course selector → messages → input → actions)
- [ ] Verify focus order is logical (top to bottom, left to right)
- [ ] Test Enter key sends message
- [ ] Test Escape key closes modal
- [ ] Verify Tab cannot escape modal (focus trap)
- [ ] Test Space/Enter on citation markers
- [ ] Test Space/Enter on sources toggle
- [ ] Verify no keyboard traps

#### Screen Reader Testing (NVDA)
- [ ] Modal announces on open: "Quokka AI Assistant, dialog"
- [ ] Course selector changes announced
- [ ] Message send announced: "Sending message..." → "Message sent"
- [ ] New messages announced: "You said..." / "Quokka replied..."
- [ ] Streaming status announced: "Quokka is generating..."
- [ ] Copy action announced: "Message copied to clipboard"
- [ ] Clear action announced: "Conversation cleared"
- [ ] Post thread announced: "Conversation posted as thread"
- [ ] Errors announced with role="alert"
- [ ] Citations announced: "Citation 1: [title]"
- [ ] Avatar roles announced: "Your message" / "Quokka assistant message"

#### Screen Reader Testing (JAWS)
- [ ] Repeat all NVDA tests with JAWS
- [ ] Verify Virtual PC cursor mode works
- [ ] Verify Forms mode works for input

#### Screen Reader Testing (VoiceOver)
- [ ] Repeat all tests with VoiceOver on macOS
- [ ] Verify rotor navigation works (headings, landmarks, links)

#### Focus Management
- [ ] Open modal - focus moves to title then input
- [ ] Close modal with Escape - focus returns to trigger
- [ ] Send message - focus remains in input
- [ ] Switch course - focus remains in select
- [ ] Open dropdown - focus moves to first item
- [ ] Close dropdown with Escape - focus returns to trigger

#### Color Contrast (Manual with Analyzer)
- [ ] Measure glass panel text: `--text` on `--glass-strong` (target: 4.5:1)
- [ ] Measure muted text: `text-muted-foreground` on background (target: 4.5:1)
- [ ] Measure citation markers: `text-accent-foreground` on `bg-accent/20` (target: 4.5:1)
- [ ] Measure focus rings: ring color vs background (target: 3:1)
- [ ] Measure button text: all button variants (target: 3:1 minimum)
- [ ] Measure disabled states: verify distinguishable
- [ ] Measure streaming dots: `bg-primary` on `message-assistant` (target: 3:1)
- [ ] Test in dark mode - repeat all measurements

#### Motion & Timing
- [ ] Enable "Reduce motion" in OS
- [ ] Verify bounce animation stops
- [ ] Verify modal still usable
- [ ] Disable "Reduce motion"
- [ ] Verify animation returns

#### Cross-Browser Testing
- [ ] Chrome (latest) - all tests
- [ ] Firefox (latest) - all tests
- [ ] Safari (latest) - all tests
- [ ] Edge (latest) - all tests

#### Automated Tools
- [ ] Run axe DevTools scan - 0 violations
- [ ] Run WAVE extension - 0 errors
- [ ] Run Lighthouse accessibility audit - 100 score
- [ ] Run pa11y-ci (if available) - 0 errors

---

## Implementation Sequence

### Phase 1: Critical Fixes (Day 1)
1. Add focus return on modal close (Fix 1)
2. Add status announcements for actions (Fix 2)
3. Fix message announcement mechanism (Fix 8)
4. Add error handling region (Fix 6)
5. Verify `aria-modal` attribute (Fix 4)

**Testing:** Keyboard navigation, screen reader announcements

### Phase 2: High Priority Fixes (Day 2)
6. Improve focus management on open (Fix 3)
7. Improve streaming indicator announcement (Fix 9)
8. Improve input label and instructions (Fix 13)
9. Add accessible names to avatars (Fix 11)
10. Add message semantic structure (Fix 12)

**Testing:** Screen reader context, focus flow, ARIA attributes

### Phase 3: Medium Priority Fixes (Day 3)
11. Improve button accessible names (Fix 14)
12. Add success feedback for copy action (Fix 18)
13. Add individual source links (Fix 17 - if URLs available)
14. Add keyboard shortcut hints (Fix 7)
15. Add reduced motion support (Fix 10)

**Testing:** User experience, polish, edge cases

### Phase 4: Manual Testing & Verification (Day 4)
16. Color contrast measurements (all elements)
17. Cross-browser testing (Chrome, Firefox, Safari, Edge)
18. Screen reader testing (NVDA, JAWS, VoiceOver)
19. Automated tool scans (axe, WAVE, Lighthouse)
20. Final regression testing

---

## Success Criteria

### Critical
- [ ] All user actions announced to screen readers
- [ ] Focus returns to trigger on modal close
- [ ] New messages announced reliably
- [ ] Errors announced with `role="alert"`
- [ ] `aria-modal="true"` verified on dialog

### High
- [ ] Modal title announced on open
- [ ] Focus management follows logical order
- [ ] Streaming status announced
- [ ] Input has descriptive label with instructions
- [ ] Avatars have accessible names

### Medium
- [ ] Copy action provides feedback
- [ ] Course changes announced
- [ ] Clear conversation announced
- [ ] Post thread announced
- [ ] Buttons have descriptive labels

### Testing
- [ ] All color contrast ratios ≥ 4.5:1 (text) or 3:1 (UI)
- [ ] Focus indicators visible with 3:1 contrast
- [ ] Keyboard navigation 100% functional
- [ ] Screen reader testing passes (NVDA, JAWS, VoiceOver)
- [ ] axe DevTools: 0 violations
- [ ] Lighthouse: 100 accessibility score

---

## Rollback Plan

If fixes introduce regressions:

1. **Revert to baseline:** Git reset to pre-fix commit
2. **Isolate problem:** Test each fix individually
3. **Fix regression:** Address specific issue
4. **Re-test:** Full testing suite before re-deploying

---

## Notes for Developers

### ARIA Live Region Best Practices

1. **Use `role="status"` for non-critical updates** (message sent, copied)
2. **Use `role="alert"` for errors** (failures, warnings)
3. **Set `aria-atomic="true"`** when entire region should re-announce
4. **Avoid nesting live regions** - causes announcement conflicts
5. **Test with real screen readers** - behavior varies by AT

### Focus Management Best Practices

1. **Focus should move logically** (top to bottom, left to right)
2. **Return focus to trigger** when closing modals/dialogs
3. **Announce context before focusing** (title before input)
4. **Don't move focus unexpectedly** during user interaction
5. **Test keyboard-only navigation** - unplug your mouse

### Screen Reader Testing Tips

1. **Test with multiple screen readers** (NVDA, JAWS, VoiceOver)
2. **Use both virtual cursor and forms mode**
3. **Navigate by headings, landmarks, links, buttons**
4. **Test rapid updates** (streaming) for announcement conflicts
5. **Verify announcements are complete and helpful**

---

**Plan Completed:** 2025-10-17
**Next Step:** Review with parent session for implementation approval

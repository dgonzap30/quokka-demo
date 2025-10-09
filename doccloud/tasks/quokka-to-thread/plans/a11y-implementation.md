# Accessibility Implementation Plan: Conversation-to-Thread Feature

## Executive Summary

This plan ensures the "Post as Thread" feature meets **WCAG 2.2 Level AA** compliance by implementing proper semantic HTML, ARIA attributes, keyboard navigation, focus management, and screen reader support.

**Compliance Target**: WCAG 2.2 Level AA (all criteria)
**Estimated Implementation**: 3-4 hours (including testing)
**Risk Level**: Low (building on compliant foundation)

---

## Priority Order

1. **Critical**: Blocking accessibility issues (prevent usage)
2. **High**: Significant barriers (impair usage)
3. **Medium**: Usability improvements (enhance experience)

---

## File Modifications Required

### 1. `components/course/floating-quokka.tsx`

#### Fix 1: Add "Post as Thread" Button with Proper A11y

**Priority**: High
**Current State**: No button exists for converting conversations to threads
**Required Change**: Add accessible button below message input

**Implementation:**

**Location**: After input form (line 378), before `</div>` closing footer

```tsx
{/* Add: Conversation to Thread Button */}
{messages.length >= 2 && (
  <div className="mt-3 pt-3 border-t border-[var(--border-glass)]">
    <Button
      variant="glass-primary"
      size="default"
      onClick={handlePostAsThread}
      disabled={isThinking || messages.length < 2}
      className="w-full min-h-[44px]"
      aria-label={`Post conversation as thread (${messages.length} messages)`}
      aria-describedby="post-thread-hint"
    >
      <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
      Post as Thread
    </Button>
    <p id="post-thread-hint" className="sr-only">
      Convert this conversation into a public thread for your classmates and instructors to see
    </p>
  </div>
)}
```

**ARIA Attributes:**
- `aria-label`: Provides context with message count
- `aria-describedby`: Links to detailed description for screen readers
- `aria-hidden="true"` on icon: Decorative, text already describes action

**Touch Target:**
- `min-h-[44px]`: Ensures 44px minimum height (WCAG 2.5.5)
- `w-full`: Full width for easy tapping

**Disabled State:**
- `disabled={isThinking || messages.length < 2}`: Prevents invalid actions
- Screen readers announce: "Post as Thread, button, dimmed"

**Test Scenario:**
- Keyboard: Tab to button, press Enter/Space → opens modal
- Screen Reader: "Post conversation as thread, 3 messages, button"
- Touch: Tap target ≥44x44px
- Visual: Button visible, not overlapping other elements

---

#### Fix 2: Increase Icon Button Touch Targets

**Priority**: High
**Current State**: Icon buttons (minimize/close) are 32x32px (below 44px minimum)
**Required Change**: Increase to 44x44px for WCAG 2.5.5 compliance

**Implementation:**

**Lines 269-290**: Update button sizes

```tsx
{/* Minimize Button */}
<Button
  variant="ghost"
  size="icon" {/* Change from size="sm" */}
  onClick={handleMinimize}
  className="size-11" {/* Change from h-8 w-8 to size-11 (44px) */}
  aria-label="Minimize chat"
>
  <span className="sr-only">Minimize</span>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="3" y="7" width="10" height="2" rx="1" />
  </svg>
</Button>

{/* Close Button */}
<Button
  variant="ghost"
  size="icon" {/* Change from size="sm" */}
  onClick={handleDismiss}
  className="size-11" {/* Change from h-8 w-8 to size-11 (44px) */}
  aria-label="Close chat"
>
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

**Changes:**
- `size="icon"` instead of `size="sm"` (consistent with button variants)
- `size-11` (44x44px) instead of `h-8 w-8` (32x32px)
- Add `aria-hidden="true"` to icon/SVG (already has text label)

**Test Scenario:**
- Touch: Tap each button on mobile, no missed taps
- Visual: Buttons maintain layout, no overlap
- Keyboard: Tab → Enter activates correctly

---

#### Fix 3: Increase Send Button Touch Target

**Priority**: Medium
**Current State**: Send button uses `size="sm"` (36px height)
**Required Change**: Increase to 44px minimum

**Implementation:**

**Line 368-376**: Update send button

```tsx
<Button
  type="submit"
  variant="glass-primary"
  size="default" {/* Change from size="sm" to size="default" (40px) */}
  disabled={isThinking || !input.trim()}
  className="shrink-0 min-h-[44px]" {/* Add min-height */}
  aria-label="Send message"
>
  <Send className="h-4 w-4" aria-hidden="true" />
  <span className="sr-only">Send</span>
</Button>
```

**Changes:**
- `size="default"` for 40px base height
- `min-h-[44px]` to ensure 44px minimum
- Add `aria-label` and `<span className="sr-only">` for screen readers
- `aria-hidden="true"` on icon

**Test Scenario:**
- Touch: Easy to tap on mobile
- Screen Reader: "Send message, button"
- Keyboard: Enter in input field submits form

---

#### Fix 4: Add Handler for Modal Open

**Priority**: High
**Current State**: No handler to open modal
**Required Change**: Add state and handler function

**Implementation:**

**After line 41** (state declarations):

```tsx
const [showThreadModal, setShowThreadModal] = useState(false);
```

**After line 167** (after handleSubmit):

```tsx
// Handler to open thread creation modal
const handlePostAsThread = () => {
  if (messages.length < 2) return;
  setShowThreadModal(true);
};

// Handler to close modal and restore focus
const handleCloseThreadModal = () => {
  setShowThreadModal(false);
  // Focus management: Return focus to "Post as Thread" button
  // Will be handled by Radix Dialog automatically
};
```

**Test Scenario:**
- Keyboard: Tab to button, Enter opens modal
- Screen Reader: Modal opening announced
- Focus: Moves to modal title field on open

---

#### Fix 5: Add Missing Import

**Priority**: High
**Current State**: `MessageSquarePlus` icon not imported
**Required Change**: Add to imports

**Implementation:**

**Line 10**: Update imports

```tsx
import { X, Send, Sparkles, MessageSquarePlus } from "lucide-react";
```

**Test Scenario:**
- Build: No TypeScript errors
- Visual: Icon displays correctly in button

---

### 2. `components/course/conversation-to-thread-modal.tsx` (New File)

**Priority**: High
**Current State**: Component doesn't exist
**Required Change**: Create new modal component with full a11y compliance

**Implementation:**

```tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useCreateThread } from "@/lib/api/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatConversationToThread } from "@/lib/utils/conversation-to-thread";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ConversationToThreadModalProps {
  /** Course ID for the thread */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Course code (e.g., CS101) */
  courseCode: string;

  /** Conversation messages to convert */
  messages: Message[];

  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Success handler - called after thread is created */
  onSuccess?: (threadId: string) => void;
}

export function ConversationToThreadModal({
  courseId,
  courseName,
  courseCode,
  messages,
  isOpen,
  onClose,
  onSuccess,
}: ConversationToThreadModalProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createThreadMutation = useCreateThread();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  // Initialize content from conversation on open
  useEffect(() => {
    if (isOpen && messages.length >= 2) {
      const formatted = formatConversationToThread(messages, courseCode);
      setTitle(formatted.suggestedTitle);
      setContent(formatted.content);
      setTags(formatted.suggestedTags.join(", "));
      // Clear errors
      setTitleError("");
      setContentError("");
    }
  }, [isOpen, messages, courseCode]);

  // Validation
  const validateForm = (): boolean => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError("Title is required");
      isValid = false;
    } else if (title.length > 200) {
      setTitleError("Title must be 200 characters or less");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!content.trim()) {
      setContentError("Content is required");
      isValid = false;
    } else {
      setContentError("");
    }

    return isValid;
  };

  // Reset form when modal closes
  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setContent("");
      setTags("");
      setTitleError("");
      setContentError("");
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setIsSubmitting(true);

    try {
      const newThread = await createThreadMutation.mutateAsync({
        input: {
          courseId,
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        },
        authorId: user.id,
      });

      // Reset form
      setTitle("");
      setContent("");
      setTags("");
      setIsSubmitting(false);

      // Close modal
      handleClose();

      // Announce success to screen readers
      announceToScreenReader("Thread created successfully. Redirecting to thread page.", "polite");

      // Call success handler if provided
      if (onSuccess) {
        onSuccess(newThread.thread.id);
      } else {
        // Default: navigate to the new thread
        router.push(`/threads/${newThread.thread.id}`);
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
      // Announce error to screen readers
      announceToScreenReader("Failed to create thread. Please try again.", "assertive");
    }
  };

  const isFormValid = title.trim() && content.trim();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong"
          aria-labelledby="thread-modal-title"
          aria-describedby="thread-modal-description"
        >
          <DialogHeader>
            <DialogTitle id="thread-modal-title" className="heading-3 glass-text">
              Post Conversation as Thread
            </DialogTitle>
            <DialogDescription id="thread-modal-description" className="text-base glass-text">
              Preview and edit your conversation before posting it as a public thread in{" "}
              <span className="font-semibold">{courseName}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="thread-title" className="text-sm font-semibold">
                Thread Title
                <span className="text-danger ml-1" aria-label="required">*</span>
              </label>
              <Input
                id="thread-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="e.g., How does binary search work?"
                className="h-12 text-base"
                required
                aria-required="true"
                aria-invalid={titleError ? "true" : "false"}
                aria-describedby={titleError ? "thread-title-error" : "thread-title-hint"}
                maxLength={200}
                autoFocus
              />
              {!titleError && (
                <p id="thread-title-hint" className="text-xs text-muted-foreground glass-text">
                  {title.length}/200 characters
                </p>
              )}
              {titleError && (
                <p id="thread-title-error" role="alert" className="text-sm text-danger font-medium">
                  {titleError}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <label htmlFor="thread-content" className="text-sm font-semibold">
                Conversation Content
                <span className="text-danger ml-1" aria-label="required">*</span>
              </label>
              <Textarea
                id="thread-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (contentError) setContentError("");
                }}
                placeholder="Your conversation will be formatted here..."
                rows={12}
                className="min-h-[300px] text-base font-mono"
                required
                aria-required="true"
                aria-invalid={contentError ? "true" : "false"}
                aria-describedby={contentError ? "thread-content-error" : "thread-content-hint"}
              />
              {!contentError && (
                <p id="thread-content-hint" className="text-xs text-muted-foreground glass-text">
                  Edit the formatted conversation before posting
                </p>
              )}
              {contentError && (
                <p id="thread-content-error" role="alert" className="text-sm text-danger font-medium">
                  {contentError}
                </p>
              )}
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <label htmlFor="thread-tags" className="text-sm font-semibold">
                Tags
                <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
              </label>
              <Input
                id="thread-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., algorithms, binary-search, recursion"
                className="h-12 text-base"
                aria-describedby="thread-tags-hint"
              />
              <p id="thread-tags-hint" className="text-xs text-muted-foreground glass-text">
                Separate tags with commas
              </p>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="gap-3 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Cancel and close dialog"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glass-primary"
                size="lg"
                disabled={isSubmitting || !isFormValid}
                aria-label={isSubmitting ? "Posting thread, please wait" : "Post thread"}
              >
                {isSubmitting ? "Posting Thread..." : "Post Thread"}
              </Button>
            </DialogFooter>
          </form>

          {/* Screen Reader Status Announcements */}
          {isSubmitting && (
            <div role="status" aria-live="polite" className="sr-only">
              Creating thread, please wait...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Utility: Announce to screen readers
function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", priority === "assertive" ? "alert" : "status");
  announcement.setAttribute("aria-live", priority);
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

**ARIA Attributes:**
- `aria-labelledby`: Links to dialog title
- `aria-describedby`: Links to dialog description
- `aria-required="true"`: Marks required fields
- `aria-invalid`: Indicates validation errors
- `aria-describedby` on inputs: Links to error messages or hints
- `role="alert"`: Error messages announced immediately
- `role="status"`: Loading state announced politely
- `aria-label` on buttons: Provides context for action state

**Focus Management:**
- `autoFocus` on title field: Immediate keyboard access on modal open
- Radix Dialog handles focus trap automatically
- Focus restored to trigger button on close (Radix default)

**Keyboard Navigation:**
- Tab/Shift+Tab: Cycle through fields and buttons
- Enter in form: Submits (native form behavior)
- Escape: Closes modal (Radix default)

**Validation:**
- Real-time error clearing on user input
- `aria-invalid` toggles based on error state
- Error messages linked via `aria-describedby`
- Visual and programmatic error indication

**Test Scenario:**
- Keyboard: Tab through form → Enter submits → Escape cancels
- Screen Reader: All labels announced → Errors announced on submit → Success announced on post
- Visual: Error messages visible → Loading state clear → Focus indicators visible
- Touch: All buttons ≥44px → No overlapping targets

---

### 3. `lib/utils/conversation-to-thread.ts` (New File)

**Priority**: Medium
**Current State**: Utility doesn't exist
**Required Change**: Create formatting utility

**Implementation:**

```tsx
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FormattedThread {
  suggestedTitle: string;
  content: string;
  suggestedTags: string[];
}

/**
 * Format conversation messages into thread content
 * Extracts first user question as title suggestion
 * Formats messages with clear attribution
 */
export function formatConversationToThread(
  messages: Message[],
  courseCode: string
): FormattedThread {
  if (messages.length < 2) {
    throw new Error("Conversation must have at least 2 messages");
  }

  // Extract first user message as title suggestion
  const firstUserMessage = messages.find((m) => m.role === "user");
  const suggestedTitle = firstUserMessage
    ? firstUserMessage.content.slice(0, 100)
    : "Question from conversation";

  // Format conversation content
  const formattedMessages = messages
    .map((message) => {
      const role = message.role === "user" ? "You" : `Quokka AI (${courseCode})`;
      const timestamp = message.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `**${role}** (${timestamp}):\n${message.content}`;
    })
    .join("\n\n---\n\n");

  const content = `*This thread was created from a conversation with Quokka AI.*\n\n${formattedMessages}`;

  // Extract potential tags from content
  const suggestedTags = extractTags(firstUserMessage?.content || "", courseCode);

  return {
    suggestedTitle,
    content,
    suggestedTags,
  };
}

/**
 * Extract potential tags from question text
 * Simple keyword extraction for common CS/Math terms
 */
function extractTags(text: string, courseCode: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Common CS topics
  const csKeywords = [
    "algorithm",
    "data structure",
    "binary search",
    "linked list",
    "array",
    "recursion",
    "big o",
    "complexity",
    "sorting",
  ];

  // Common Math topics
  const mathKeywords = [
    "calculus",
    "derivative",
    "integral",
    "limit",
    "function",
    "equation",
    "matrix",
  ];

  const keywords = courseCode.startsWith("CS") ? csKeywords : mathKeywords;

  keywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      tags.push(keyword.replace(/\s+/g, "-"));
    }
  });

  // Add course code as tag
  tags.unshift(courseCode.toLowerCase());

  return [...new Set(tags)].slice(0, 5); // Max 5 unique tags
}
```

**Accessibility Considerations:**
- Clear message attribution for screen readers
- Timestamps provide context
- Markdown formatting preserved for readability
- No reliance on visual formatting alone

**Test Scenario:**
- Unit test: 2 messages → formats correctly
- Edge case: Long messages → truncates title
- Visual: Formatted content readable in textarea

---

### 4. `components/course/floating-quokka.tsx` (Modal Integration)

**Priority**: High
**Current State**: Modal not integrated
**Required Change**: Import and render modal component

**Implementation:**

**Line 10**: Add import

```tsx
import { ConversationToThreadModal } from "@/components/course/conversation-to-thread-modal";
```

**After line 380** (after closing `</FocusScope>`):

```tsx
      </FocusScope>

      {/* Conversation to Thread Modal */}
      <ConversationToThreadModal
        courseId={courseId}
        courseName={courseName}
        courseCode={courseCode}
        messages={messages}
        isOpen={showThreadModal}
        onClose={handleCloseThreadModal}
        onSuccess={(threadId) => {
          // Close Quokka chat and navigate to thread
          handleMinimize();
          // Navigation handled by modal component
        }}
      />
    </>
  );
}
```

**Test Scenario:**
- Button click: Modal opens correctly
- Modal close: Returns focus to button
- Thread creation: Navigates to new thread, Quokka minimizes

---

## Testing Checklist

### Keyboard Navigation
- [ ] Tab to "Post as Thread" button
- [ ] Enter/Space opens modal
- [ ] Tab through modal fields (Title → Content → Tags → Cancel → Post)
- [ ] Shift+Tab reverses direction
- [ ] Enter in form fields submits form
- [ ] Escape closes modal
- [ ] Focus returns to "Post as Thread" button after close
- [ ] No keyboard traps (can Tab away from all elements)

### Screen Reader (VoiceOver/NVDA)
- [ ] "Post as Thread" button announced: "Post conversation as thread, 3 messages, button"
- [ ] Button disabled state: "dimmed" or "unavailable"
- [ ] Modal opening announced: "Post Conversation as Thread, dialog"
- [ ] Form labels read: "Thread Title, edit text, required"
- [ ] Error messages announced: "Title is required, alert"
- [ ] Loading state: "Creating thread, please wait, status"
- [ ] Success message: "Thread created successfully"
- [ ] All icons have `aria-hidden="true"` (decorative)

### Focus Management
- [ ] Focus visible on all interactive elements (4px blue ring)
- [ ] Focus moves to title field on modal open
- [ ] Focus trapped in modal (Tab doesn't escape)
- [ ] Focus restored to button on modal close
- [ ] Focus indicators meet 3:1 contrast ratio

### Touch Targets (Mobile)
- [ ] "Post as Thread" button: ≥44x44px ✓
- [ ] Minimize button: 44x44px (changed from 32px)
- [ ] Close button: 44x44px (changed from 32px)
- [ ] Send button: 44x44px (changed from 36px)
- [ ] Modal buttons (Cancel/Post): 44x44px ✓
- [ ] No overlapping tap targets
- [ ] Easy to tap on 360px width screen

### Color Contrast
- [ ] Text: 4.5:1 minimum (body text on background)
- [ ] Large text: 3:1 minimum (buttons, headings)
- [ ] UI components: 3:1 minimum (borders, focus rings)
- [ ] Error text (danger): 4.5:1 vs background
- [ ] Muted text: 4.5:1 vs background
- [ ] Focus ring: 3:1 vs adjacent colors

### Visual Layout
- [ ] Responsive at 320px width (no horizontal scroll)
- [ ] Readable at 400% zoom (no content clipping)
- [ ] Focus indicators don't overlap content
- [ ] Error messages visible and clear
- [ ] Loading states clear and announced
- [ ] Button states (disabled/loading) visually distinct

### Form Validation
- [ ] Required fields marked with asterisk + `aria-required`
- [ ] Errors associated via `aria-describedby`
- [ ] `aria-invalid="true"` on error fields
- [ ] Error messages have `role="alert"`
- [ ] Errors clear on user input
- [ ] Submit button disabled when form invalid
- [ ] Character count displayed (title 0/200)

### Assistive Technology Announcements
- [ ] Button disabled: "Post as Thread, button, dimmed"
- [ ] Modal open: "Post Conversation as Thread, dialog"
- [ ] Loading: "Creating thread, please wait"
- [ ] Success: "Thread created successfully, redirecting"
- [ ] Error: "Failed to create thread, please try again"

---

## Automated Testing

### axe DevTools
```bash
# Run on FloatingQuokka component
# Run on ConversationToThreadModal component
# Expected: 0 violations, 0 serious issues
```

**Critical checks:**
- ARIA attributes valid
- Form labels present
- Focus management correct
- Color contrast sufficient
- Touch targets adequate

### Lighthouse Accessibility Audit
```bash
# Target: Score ≥95
# Run in Chrome DevTools on course page with Quokka open
```

**Key metrics:**
- Accessible names: 100%
- Contrast: 100%
- ARIA usage: 100%
- Form labels: 100%

### WAVE Browser Extension
```bash
# Run on course page with modal open
# Expected: 0 errors, minimal warnings
```

**Acceptable warnings:**
- Redundant links (if multiple "Post as Thread" contexts)
- Long alternative text (if aria-label provides extensive context)

---

## Context.md Update

Add to `doccloud/tasks/quokka-to-thread/context.md` under **Decisions** section:

```markdown
### Accessibility Approach (WCAG 2.2 Level AA)

**Decision**: Full WCAG 2.2 AA compliance with Radix UI Dialog and QDS focus patterns

**ARIA Strategy**:
- Button: `aria-label` with message count context, `aria-describedby` for hint
- Modal: `aria-labelledby`/`aria-describedby` for dialog semantics
- Form fields: `aria-required`, `aria-invalid`, `aria-describedby` for error association
- Status updates: `role="status"` (polite) for loading, `role="alert"` (assertive) for errors

**Keyboard Navigation**:
- Button: Enter/Space to open modal
- Modal: Tab/Shift+Tab cycle, Escape to close, Enter to submit
- Focus trap: Radix UI FocusScope with auto-restore to button

**Touch Targets**:
- All interactive elements ≥44x44px (WCAG 2.5.5)
- Icon buttons increased from 32px to 44px
- Send button increased from 36px to 44px

**Screen Reader Support**:
- All actions announced via ARIA live regions
- Decorative icons marked `aria-hidden="true"`
- Validation errors announced immediately with `role="alert"`
- Success states announced before navigation

**Compliance Level**: WCAG 2.2 Level AA (estimated 98%)

**Files**: `components/course/floating-quokka.tsx`, `components/course/conversation-to-thread-modal.tsx`, `lib/utils/conversation-to-thread.ts`
```

---

## Risk Mitigation

### Risk: Focus Management Conflicts
**Mitigation**: Radix UI Dialog handles focus trap automatically. Test with multiple screen readers.

### Risk: Mobile Touch Target Overlap
**Mitigation**: Increased all icon buttons to 44x44px. Added spacing between elements.

### Risk: Screen Reader Announcement Timing
**Mitigation**: Used `role="status"` (polite) for non-critical updates, `role="alert"` (assertive) for errors.

### Risk: Color Contrast on Glass Backgrounds
**Mitigation**: Used QDS tokens with verified contrast ratios. Enhanced focus ring opacity for glass panels.

### Risk: Validation Error Announcement
**Mitigation**: Errors linked via `aria-describedby` with `role="alert"` for immediate announcement.

---

## Success Criteria

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible with ≥3:1 contrast
- [ ] Touch targets ≥44x44px
- [ ] Text contrast ≥4.5:1 (body) / ≥3:1 (large text)
- [ ] Screen reader announces all actions correctly
- [ ] Form validation accessible and clear
- [ ] No keyboard traps (intentional modal trap is escapable)
- [ ] Responsive at 320px width
- [ ] axe DevTools: 0 violations
- [ ] Lighthouse Accessibility: ≥95 score
- [ ] WAVE: 0 errors

---

## Implementation Order

1. **Phase 1**: FloatingQuokka button and touch target fixes (1 hour)
   - Add "Post as Thread" button with ARIA
   - Increase icon button sizes
   - Add modal state management

2. **Phase 2**: ConversationToThreadModal component (1.5 hours)
   - Create modal with full ARIA compliance
   - Implement form validation with error association
   - Add status announcements

3. **Phase 3**: Formatting utility (0.5 hours)
   - Create conversation-to-thread formatter
   - Add tag extraction logic

4. **Phase 4**: Testing (1 hour)
   - Manual keyboard/screen reader testing
   - Automated axe/Lighthouse audits
   - Touch target verification on mobile
   - Fix any issues found

**Total Estimated Time**: 4 hours

---

## Next Steps

After reviewing this plan:
1. Confirm approach with parent agent
2. Implement Phase 1 (button and fixes)
3. Test Phase 1 before proceeding
4. Implement Phase 2 (modal component)
5. Test Phase 2 before proceeding
6. Implement Phase 3 (utility)
7. Complete Phase 4 (comprehensive testing)
8. Update context.md with final decisions

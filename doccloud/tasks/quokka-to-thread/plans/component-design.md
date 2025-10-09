# Component Design: Conversation to Thread Conversion

**Date:** 2025-10-08
**Component Architect:** Design Phase

---

## 1. Component Hierarchy

```
FloatingQuokka (modified)
├── [Existing chat UI]
├── PostAsThreadButton (new conditional button)
└── ConversationToThreadModal (new component)
    ├── Dialog (shadcn/ui)
    │   ├── DialogContent
    │   │   ├── DialogHeader
    │   │   │   ├── DialogTitle
    │   │   │   └── DialogDescription
    │   │   ├── ConversationPreview (internal section)
    │   │   ├── ThreadForm (internal form)
    │   │   │   ├── Input (title)
    │   │   │   ├── Textarea (content)
    │   │   │   └── Input (tags)
    │   │   └── DialogFooter
    │   │       ├── Button (Cancel)
    │   │       └── Button (Post)
```

**File Structure:**
```
components/course/
  ├── floating-quokka.tsx (modify)
  └── conversation-to-thread-modal.tsx (create)

lib/utils/
  └── conversation-to-thread.ts (create)
```

---

## 2. Props Interfaces

### ConversationToThreadModal

```typescript
import type { Message } from "@/components/course/floating-quokka";

export interface ConversationToThreadModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Array of chat messages to convert */
  messages: Message[];

  /** Course ID for thread creation */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Course code for display (e.g., "CS101") */
  courseCode: string;

  /** Success callback - called after thread is created */
  onSuccess?: (threadId: string) => void;
}
```

**Why these props:**
- `isOpen` + `onClose`: Standard dialog control (follows AskQuestionModal pattern)
- `messages`: Core data for conversion (reuses FloatingQuokka's Message type)
- `courseId` + `courseName` + `courseCode`: Thread creation requires course context
- `onSuccess`: Optional callback for custom navigation/behavior (same pattern as AskQuestionModal)

---

### FloatingQuokka (New State)

```typescript
// Add to existing state in floating-quokka.tsx
const [isPostModalOpen, setIsPostModalOpen] = useState(false);

// Add handler
const handleOpenPostModal = () => {
  setIsPostModalOpen(true);
};

const handleClosePostModal = () => {
  setIsPostModalOpen(false);
};

const handlePostSuccess = (threadId: string) => {
  // Close modal
  setIsPostModalOpen(false);

  // Navigate to new thread
  router.push(`/threads/${threadId}`);

  // Optional: Clear messages and minimize chat
  setMessages([]);
  updateState("minimized");
};
```

---

## 3. State Management Plan

### Local State (ConversationToThreadModal)

```typescript
const [title, setTitle] = useState<string>("");
const [content, setContent] = useState<string>("");
const [tags, setTags] = useState<string>("");
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
```

**State Placement Rationale:**
- **Local to modal:** Form state doesn't need to persist after close
- **No lifting needed:** Parent (FloatingQuokka) only needs to know about success (via callback)
- **Reset on close:** Form clears when modal closes (same as AskQuestionModal)

### React Query Hooks

```typescript
const router = useRouter();
const { data: user } = useCurrentUser();
const createThreadMutation = useCreateThread();
```

**Hooks:**
- `useCurrentUser()`: Get author ID for thread creation
- `useCreateThread()`: Mutation for posting thread (reuses existing hook)
- `useRouter()`: Navigation after success

### Initialization Logic

```typescript
// On modal open, auto-generate title and format content
useEffect(() => {
  if (isOpen && messages.length > 0) {
    // Auto-generate title from first user message
    const generatedTitle = generateTitleFromMessages(messages);
    setTitle(generatedTitle);

    // Format conversation into content
    const formattedContent = formatConversation(messages);
    setContent(formattedContent);

    // Leave tags empty
    setTags("");
  }
}, [isOpen, messages]);

// Reset form on close
const handleClose = () => {
  if (!isSubmitting) {
    setTitle("");
    setContent("");
    setTags("");
    onClose();
  }
};
```

---

## 4. Event Handling Pattern

### Form Submission

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!title.trim() || !content.trim() || !user) return;

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
    onClose();

    // Call success handler
    if (onSuccess) {
      onSuccess(newThread.thread.id);
    } else {
      // Default: navigate to new thread
      router.push(`/threads/${newThread.thread.id}`);
    }
  } catch (error) {
    console.error("Failed to create thread:", error);
    setIsSubmitting(false);
  }
};
```

**Pattern:**
- Same as AskQuestionModal (proven, tested)
- Optimistic UI: `setIsSubmitting(true)` immediately
- Error handling: Keep modal open on error, allow retry
- Success: Reset + close + callback/navigate

### Validation

```typescript
const isFormValid = title.trim() && content.trim();
```

**Validation Rules:**
- Title required (min 1 char after trim)
- Content required (min 1 char after trim)
- Tags optional
- Same validation as AskQuestionModal

---

## 5. Variant System

### Modal Styling

**Base Class:** `glass-panel-strong` (follows QDS glassmorphism pattern)

**Size:**
- Max width: `max-w-3xl`
- Max height: `max-h-[90vh]`
- Overflow: `overflow-y-auto`

**No variants needed** - Single modal design

### Button Variants

```typescript
// Cancel button
<Button variant="outline" size="lg">Cancel</Button>

// Post button
<Button variant="glass-primary" size="lg">Post as Thread</Button>
```

**Why these variants:**
- `outline`: Secondary action (cancel)
- `glass-primary`: Primary action (post) - matches Quokka Brown brand
- `size="lg"`: Touch-friendly (44px min height on mobile)

---

## 6. File Structure

### Files to Create

1. **`lib/utils/conversation-to-thread.ts`**
   ```typescript
   import type { Message } from "@/components/course/floating-quokka";

   /**
    * Formats chat messages into readable thread content
    *
    * @param messages - Array of chat messages
    * @returns Formatted string for thread content
    */
   export function formatConversation(messages: Message[]): string {
     return messages
       .map((msg) => {
         const role = msg.role === "user" ? "You" : "Quokka";
         return `${role}: ${msg.content}`;
       })
       .join("\n\n");
   }

   /**
    * Generates thread title from first user message
    *
    * @param messages - Array of chat messages
    * @returns Truncated title (max 100 chars)
    */
   export function generateTitleFromMessages(messages: Message[]): string {
     const firstUserMessage = messages.find((m) => m.role === "user");
     if (!firstUserMessage) return "Conversation from Quokka chat";

     const content = firstUserMessage.content.trim();
     const truncated = content.length > 100 ? content.slice(0, 97) + "..." : content;
     return truncated;
   }
   ```

2. **`components/course/conversation-to-thread-modal.tsx`**
   - Full component implementation (see section 7 for usage examples)

### Files to Modify

1. **`components/course/floating-quokka.tsx`**
   - Add state: `isPostModalOpen`
   - Add button: Conditional render when `messages.length >= 2`
   - Add modal: `<ConversationToThreadModal />` at end of component
   - Add imports: `useRouter`, `MessageSquarePlus` icon

**Modification Location (Line 337 - Before Input Form):**
```tsx
{/* Post as Thread Button (NEW) */}
{messages.length >= 2 && (
  <div className="mb-3 pb-3 border-b border-[var(--border-glass)]">
    <Button
      variant="glass-primary"
      size="default"
      onClick={handleOpenPostModal}
      className="w-full"
    >
      <MessageSquarePlus className="h-4 w-4" />
      Post as Thread
    </Button>
  </div>
)}
```

**Modal Integration (After Card, before FocusScope close):**
```tsx
{/* Conversation to Thread Modal (NEW) */}
<ConversationToThreadModal
  isOpen={isPostModalOpen}
  onClose={handleClosePostModal}
  messages={messages}
  courseId={courseId}
  courseName={courseName}
  courseCode={courseCode}
  onSuccess={handlePostSuccess}
/>
```

---

## 7. Usage Examples

### Example 1: Basic Usage (Default Navigation)

```tsx
<ConversationToThreadModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  messages={chatMessages}
  courseId="cs101-fall-2025"
  courseName="Introduction to Computer Science"
  courseCode="CS101"
/>
```

**Behavior:** On success, navigates to `/threads/{newThreadId}`

---

### Example 2: Custom Success Handler

```tsx
<ConversationToThreadModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  messages={chatMessages}
  courseId="cs101-fall-2025"
  courseName="Introduction to Computer Science"
  courseCode="CS101"
  onSuccess={(threadId) => {
    console.log("Thread created:", threadId);
    // Custom behavior: show toast, close chat, etc.
    toast.success("Thread posted successfully!");
    setIsOpen(false);
    clearMessages();
  }}
/>
```

**Behavior:** Calls custom success handler instead of default navigation

---

### Example 3: Minimal Messages (Edge Case)

```tsx
// Only show button when enough messages
{messages.length >= 2 && (
  <Button onClick={() => setIsOpen(true)}>
    Post as Thread
  </Button>
)}

// Modal still works with 1 message (but button shouldn't show)
<ConversationToThreadModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  messages={[{ id: "1", role: "user", content: "Hello", timestamp: new Date() }]}
  courseId="cs101-fall-2025"
  courseName="Introduction to Computer Science"
  courseCode="CS101"
/>
```

**Behavior:** Title generated from single message, content formatted as minimal conversation

---

## 8. Test Scenarios

### User Interaction Tests

1. **Open Modal**
   - Click "Post as Thread" button in FloatingQuokka footer
   - Modal opens with title auto-populated
   - Content shows formatted conversation
   - Focus moves to title input (autofocus)

2. **Edit Title**
   - User can modify auto-generated title
   - Character count updates: `{title.length}/200`
   - Validation prevents empty title on submit

3. **Edit Content**
   - User can modify formatted conversation
   - Textarea is scrollable for long conversations
   - Validation prevents empty content on submit

4. **Add Tags**
   - User can add comma-separated tags (optional)
   - Tags parse correctly on submit: `["tag1", "tag2", "tag3"]`

5. **Submit Thread**
   - Click "Post as Thread" button
   - Loading state: Button shows "Posting..." and is disabled
   - Success: Modal closes, navigates to new thread
   - FloatingQuokka minimizes (optional behavior)

6. **Cancel**
   - Click "Cancel" button
   - Modal closes without posting
   - Form resets (title, content, tags cleared)

7. **Close (X button)**
   - Click X button in modal header
   - Same behavior as Cancel

8. **Keyboard Navigation**
   - Tab through: Title → Content → Tags → Cancel → Post
   - Enter on Post button: Submit form
   - Escape key: Close modal (same as Cancel)

### Edge Cases

1. **No User**
   - User is null (logged out)
   - Form submit should fail gracefully
   - Show error state or disable submit button

2. **Empty Messages**
   - `messages.length === 0`
   - Button should not show (prevent via conditional render)
   - Modal should not open

3. **Single Message**
   - `messages.length === 1`
   - Button should not show (need min 2 for conversation)

4. **Very Long Conversation**
   - 20+ messages
   - Content area scrollable: `max-h-[300px] overflow-y-auto`
   - Modal remains usable, not cut off

5. **Special Characters in Content**
   - Emojis, line breaks, code blocks
   - Formatted correctly with `whitespace-pre-wrap`
   - No escaping issues

6. **Network Error**
   - `createThreadMutation` fails
   - Modal stays open
   - Error logged to console
   - User can retry

7. **Concurrent Opens**
   - User opens modal while another mutation is pending
   - Should be prevented by `isSubmitting` state

### Accessibility Tests

1. **Screen Reader Announces Modal**
   - `role="dialog"` on DialogContent
   - `aria-labelledby` points to DialogTitle
   - `aria-describedby` points to DialogDescription

2. **Focus Management**
   - Focus moves to title input on open
   - Focus returns to "Post as Thread" button on close
   - Focus trapped inside modal (can't Tab outside)

3. **Keyboard Navigation**
   - Tab order: Title → Content → Tags → Cancel → Post → X
   - Enter submits form (when focused on submit button)
   - Escape closes modal

4. **Labels and ARIA**
   - All inputs have associated labels
   - Required fields: `required` + `aria-required="true"`
   - Error states: `aria-invalid` if validation fails

5. **Color Contrast**
   - Text meets WCAG AA: 4.5:1 minimum
   - Focus rings visible: QDS ring tokens
   - Disabled state has sufficient contrast difference

### Responsive Breakpoints

1. **Mobile (360px)**
   - Modal width: `max-w-[calc(100%-2rem)]` (16px margins)
   - Buttons stack vertically in footer
   - Touch targets ≥44px
   - Preview area readable (no horizontal scroll)

2. **Tablet (768px)**
   - Modal width: `max-w-3xl` (768px)
   - Buttons horizontal in footer
   - Preview area comfortable reading width

3. **Desktop (1024px, 1280px)**
   - Modal width: `max-w-3xl` (768px max)
   - Centered on screen
   - Desktop hover states work

---

## 9. Performance Considerations

### Memoization Opportunities

**Not needed for this component:**
- Form state is local, re-renders are cheap
- No expensive computations (formatConversation is simple string join)
- No child components receiving callbacks that would benefit from `useCallback`

**Rationale:** Over-optimization would add complexity with no measurable benefit. Keep it simple.

### Code Splitting

**Not needed:**
- Modal is lazy-loaded by virtue of conditional render (`isOpen`)
- Bundle size impact minimal (<5KB)
- Part of course page bundle (already loaded)

### Render Optimization

**Built-in optimizations:**
- Dialog only renders when `isOpen={true}`
- React Query mutations have built-in caching
- Form inputs use controlled components (standard React pattern)

---

## 10. QDS Compliance Checklist

### Color Tokens
- ✅ No hardcoded hex colors
- ✅ Uses semantic tokens: `text-foreground`, `text-muted-foreground`, `bg-surface-2`
- ✅ Glass tokens: `glass-panel-strong`, `border-[var(--border-glass)]`
- ✅ Primary color: `variant="glass-primary"` for main action

### Spacing Scale
- ✅ Vertical spacing: `space-y-4`, `space-y-6` (16px, 24px)
- ✅ Padding: `p-4`, `p-6` (16px, 24px)
- ✅ Gaps: `gap-2`, `gap-3` (8px, 12px)
- ✅ Margins: `mt-2`, `mb-3` (8px, 12px)

### Border Radius
- ✅ Dialog: `rounded-lg` (default from DialogContent)
- ✅ Preview area: `rounded-lg`
- ✅ Buttons: `rounded-md` (default from buttonVariants)

### Shadows
- ✅ Modal: `shadow-lg` (default from DialogContent)
- ✅ Glass effect: `shadow-[var(--shadow-glass-sm)]`

### Typography
- ✅ Heading: `heading-3` or `text-lg font-semibold`
- ✅ Body: `text-base` (default)
- ✅ Labels: `text-sm font-semibold`
- ✅ Helper text: `text-xs text-muted-foreground`

### Hover/Focus/Disabled States
- ✅ Focus ring: Built into Button component (`focus-visible:ring-ring`)
- ✅ Hover: Button variants have hover states
- ✅ Disabled: `disabled:opacity-50` on buttons

---

## 11. Implementation Checklist

### Phase 1: Utility Functions
- [ ] Create `lib/utils/conversation-to-thread.ts`
- [ ] Implement `formatConversation(messages)`
- [ ] Implement `generateTitleFromMessages(messages)`
- [ ] Export types/interfaces if needed

### Phase 2: Modal Component
- [ ] Create `components/course/conversation-to-thread-modal.tsx`
- [ ] Define `ConversationToThreadModalProps` interface
- [ ] Implement component structure (Dialog, form, state)
- [ ] Add form submission logic
- [ ] Add validation logic
- [ ] Add loading/error states
- [ ] Add success navigation
- [ ] Export component

### Phase 3: FloatingQuokka Integration
- [ ] Add `isPostModalOpen` state to FloatingQuokka
- [ ] Add "Post as Thread" button (conditional render)
- [ ] Add modal integration (`<ConversationToThreadModal />`)
- [ ] Add success handler (close modal, navigate, clear messages)
- [ ] Import `MessageSquarePlus` icon from Lucide

### Phase 4: Testing
- [ ] Manual test: Open modal from FloatingQuokka
- [ ] Manual test: Edit title, content, tags
- [ ] Manual test: Submit form, verify thread created
- [ ] Manual test: Cancel/close modal
- [ ] Manual test: Keyboard navigation (Tab, Enter, Escape)
- [ ] Manual test: Screen reader announces modal correctly
- [ ] Manual test: Responsive at 360px, 768px, 1024px
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] Lint check: `npm run lint`

### Phase 5: Verification
- [ ] Verify QDS compliance (no hardcoded colors, correct spacing)
- [ ] Verify accessibility (WCAG AA contrast, focus management)
- [ ] Verify error handling (network failure, validation)
- [ ] Verify edge cases (long conversations, special characters)
- [ ] Verify loading states (disabled button, loading text)

---

## 12. Success Metrics

### Functional Requirements Met
- ✅ User can convert Quokka conversation to thread
- ✅ Title auto-generated from first user message
- ✅ Content formatted as readable conversation
- ✅ Tags optional (same as AskQuestionModal)
- ✅ Thread created using existing `useCreateThread` hook
- ✅ User navigates to new thread on success

### Quality Requirements Met
- ✅ No breaking changes to mock API
- ✅ TypeScript strict mode compliance
- ✅ QDS design system compliance
- ✅ WCAG 2.2 AA accessibility compliance
- ✅ Responsive design (360px to 1280px+)
- ✅ Component reusability (props-driven, no hardcoded values)

### User Experience Requirements Met
- ✅ Loading states visible
- ✅ Error states handled gracefully
- ✅ Validation clear and helpful
- ✅ Keyboard navigation intuitive
- ✅ Mobile touch targets ≥44px
- ✅ Focus management logical

---

## 13. Known Limitations & Future Considerations

### Current Limitations
1. **No conversation editing in preview** - User can only edit formatted text (not individual messages)
   - **Rationale:** Simpler UX, less complex state management
   - **Future:** Could add message-level editing if requested

2. **No AI re-generation** - Conversation is formatted as-is, no new AI call
   - **Rationale:** Conversation already contains AI responses
   - **Future:** Could add "Regenerate AI Summary" feature if needed

3. **No conversation persistence** - If user closes modal without posting, edits are lost
   - **Rationale:** Matches AskQuestionModal behavior (form resets on close)
   - **Future:** Could add localStorage draft saving if requested

4. **No image/attachment support** - FloatingQuokka is text-only
   - **Rationale:** Out of scope for MVP, FloatingQuokka doesn't support media
   - **Future:** If FloatingQuokka adds media, modal needs update

### Future Enhancements
1. **Conversation summarization** - AI-generated summary of conversation (for long threads)
2. **Message selection** - Let user choose which messages to include
3. **Formatting options** - Markdown, code blocks, syntax highlighting
4. **Draft saving** - LocalStorage persistence for unposted conversions
5. **Tagging suggestions** - AI-extracted keywords from conversation

---

**Files Created:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/quokka-to-thread/plans/component-design.md`
- `/Users/dgz/projects-professional/quokka/quokka-demo/doccloud/tasks/quokka-to-thread/research/ui-patterns.md`

**Next Step:** Review this design, approve/request changes, then proceed with implementation.

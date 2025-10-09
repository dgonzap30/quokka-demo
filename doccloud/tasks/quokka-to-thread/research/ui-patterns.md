# UI Patterns Research: Conversation to Thread Conversion

**Date:** 2025-10-08
**Component Architect:** Research Phase

---

## Existing Patterns Found

### 1. Thread Creation Pattern (AskQuestionModal)

**File:** `components/course/ask-question-modal.tsx`

**Key Patterns:**
- Two-dialog flow: Main form → AI Preview → Submit
- Uses `Dialog` from shadcn/ui (Radix UI primitive)
- Form state management: `title`, `content`, `tags` (comma-separated string)
- React Query mutations: `useCreateThread()`, `useGenerateAIPreview()`
- Navigation after success: `router.push()` or custom `onSuccess` callback
- Loading/error states built into mutation hooks
- Form validation: `isFormValid` boolean derived from state
- Glass panel styling: `glass-panel-strong` className
- Responsive: `max-w-3xl max-h-[90vh] overflow-y-auto`

**Reusable Elements:**
- Dialog structure (header, content, footer)
- Tag parsing logic: `tags.split(",").map(t => t.trim()).filter(t => t.length > 0)`
- Success navigation pattern
- AI preview display with `AIAnswerCard` component

**Layout Structure:**
```tsx
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      {/* Input fields */}
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="ai">Preview</Button>
        <Button variant="glass-primary">Submit</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

### 2. FloatingQuokka Chat Structure

**File:** `components/course/floating-quokka.tsx`

**Key Patterns:**
- Message interface: `{ id, role: "user" | "assistant", content, timestamp }`
- Message array state: `useState<Message[]>([])`
- Three-state UI: `hidden`, `minimized`, `expanded`
- Card-based chat window: `Card` with `CardHeader`, `CardContent`
- Message rendering: Role-based styling (`message-user`, `message-assistant`)
- Auto-scroll on new messages: `messagesEndRef` with `scrollIntoView()`
- Focus management: `FocusScope` from Radix UI
- Glass panel variant: `variant="glass-strong"`
- Quick prompts: Contextual suggestions when few messages

**Message Rendering Pattern:**
```tsx
<div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
  <div className={message.role === "user" ? "message-user" : "message-assistant"}>
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
    <p className="text-xs text-subtle mt-2">{message.timestamp.toLocaleTimeString()}</p>
  </div>
</div>
```

**Footer Integration Point:**
- Current footer: Input form + Send button (lines 338-378)
- Potential location for "Post as Thread" button
- Should appear conditionally: `messages.length >= 2` (min 1 user + 1 AI)

---

### 3. Dialog Components (shadcn/ui)

**File:** `components/ui/dialog.tsx`

**Available Primitives:**
- `Dialog` - Root component with `open` and `onOpenChange` props
- `DialogContent` - Modal content wrapper
  - `showCloseButton` prop (default: `true`)
  - Built-in close button with keyboard support
  - Max width classes: `sm:max-w-lg` (default), can override
- `DialogHeader` - Title/description container
- `DialogFooter` - Action button container (right-aligned on desktop)
- `DialogTitle` - Accessible title (linked to `aria-labelledby`)
- `DialogDescription` - Accessible description (linked to `aria-describedby`)
- `DialogOverlay` - Backdrop (dark overlay)
- `DialogTrigger` - Optional trigger button

**Accessibility Features:**
- Auto-focus management
- Escape key to close
- Click outside to close
- Screen reader support (ARIA attributes)
- Focus trapping with `FocusScope`

---

### 4. Button Variants

**File:** `components/ui/button.tsx`

**Relevant Variants for This Feature:**
- `variant="outline"` - Cancel/secondary action (border + hover bg)
- `variant="glass-primary"` - Primary action (glassmorphic, Quokka Brown)
- `variant="ai"` - AI-related actions (purple gradient with shine effect)
- `variant="ghost"` - Subtle action (hover only)

**Size Options:**
- `size="sm"` - `h-9 px-3`
- `size="default"` - `h-10 px-4`
- `size="lg"` - `h-11 px-6`

**Built-in Features:**
- Focus ring with QDS tokens
- Active scale effect: `active:scale-[0.98]`
- Disabled state: `disabled:opacity-50`
- Icon handling: `[&_svg]:size-4`

---

### 5. Tag Display Pattern

**Pattern Found:** `Badge` component with `variant="outline"`

**Usage Examples:**
```tsx
// Thread card tags
{thread.tags?.map((tag) => (
  <Badge key={tag} variant="outline" className="text-xs">
    {tag}
  </Badge>
))}
```

**Styling:**
- Small text: `text-xs`
- Outline variant: Border with transparent background
- Inline layout: `flex flex-wrap gap-2`

---

### 6. Textarea Component

**File:** Inferred from `ask-question-modal.tsx` usage

**Key Props:**
- `rows` - Initial height (e.g., `rows={10}`)
- `className` with `min-h-[240px]` for scrollable content
- `placeholder` - Descriptive prompt text
- `required` + `aria-required="true"` for validation

---

## Reusable Components Identified

### Core UI Primitives (shadcn/ui)
✅ `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
✅ `Button` (multiple variants)
✅ `Input` (text input)
✅ `Textarea` (multi-line input)
✅ `Badge` (tags display)

### Custom Components
✅ `AIAnswerCard` - Display AI preview (if we generate one)
✅ `AIBadge` - Quokka branding (use `variant="compact"`)
✅ `Card`, `CardHeader`, `CardContent` - Container structure (optional)

### Hooks
✅ `useCreateThread()` - Thread creation mutation
✅ `useCurrentUser()` - Get current user for author ID
✅ `useRouter()` - Navigation after posting

---

## Layout Recommendations

### Modal Size
- **Desktop:** `max-w-3xl` (matches AskQuestionModal)
- **Mobile:** `max-w-[calc(100%-2rem)]` (auto from DialogContent)
- **Max height:** `max-h-[90vh]` to prevent overflow on short screens
- **Scroll:** `overflow-y-auto` on content area

### Content Sections (Top to Bottom)
1. **Header** - Title + description
2. **Preview Area** - Formatted conversation (read-only, scrollable)
3. **Edit Form** - Title, content (editable textarea), tags
4. **Footer** - Cancel + Post buttons

### Preview Area Styling
- Light background: `bg-surface-2` or `glass-panel`
- Border: `border border-border`
- Rounded: `rounded-lg`
- Padding: `p-4`
- Max height: `max-h-[300px] overflow-y-auto` (prevent massive conversations)
- Monospace-like formatting for conversation transcript

### Form Layout
- Vertical stack: `space-y-4` or `space-y-6`
- Label + input pairs: `space-y-2`
- Labels: `text-sm font-semibold`
- Helper text: `text-xs text-muted-foreground`

---

## Design Decisions

### ✅ Do's
1. **Reuse AskQuestionModal pattern** - Proven, accessible, QDS-compliant
2. **Single dialog** - No preview step (conversation is already "preview")
3. **Editable content** - Let user modify formatted conversation before posting
4. **Auto-generate title** - Suggest title from first user message (user can edit)
5. **Show character count** - Same as AskQuestionModal (`{title.length}/200`)
6. **Focus title input** - `autoFocus` on modal open
7. **Validation** - Require title + content (same as existing pattern)
8. **Glass styling** - Use `glass-panel-strong` for consistency
9. **Mobile-first** - Responsive layout with touch targets ≥44px
10. **Accessibility** - Semantic HTML, ARIA attributes, keyboard nav

### ❌ Don'ts
1. **Don't generate AI preview** - Conversation already exists, no need for duplicate AI call
2. **Don't over-format** - Keep conversation simple (markdown or plain text)
3. **Don't lose context** - Include timestamps or keep message order clear
4. **Don't hardcode values** - All data via props (messages, courseId, etc.)
5. **Don't break mock API** - Reuse existing `useCreateThread` without changes
6. **Don't create inline styles** - Use QDS tokens and Tailwind classes only

---

## Open Questions & Considerations

### 1. Conversation Formatting Strategy
**Options:**
- **Plain text with separators:** Simple, readable
  ```
  You: What is binary search?

  Quokka: Binary search is...

  You: Can you give an example?

  Quokka: Sure! Here's an example...
  ```
- **Markdown formatting:** More structured (use `**You:**` for bold)
- **Structured sections:** "Conversation Transcript" header + formatted blocks

**Recommendation:** Plain text with role prefixes. Simple, maintainable, no markdown parsing needed.

### 2. Title Generation
**Options:**
- **First user message (truncated):** `messages.find(m => m.role === "user")?.content.slice(0, 100)`
- **Fixed placeholder:** "Conversation from Quokka chat"
- **Empty (user must fill):** Force intentional title

**Recommendation:** Auto-generate from first user message (truncated to 100 chars), prepopulate title input. User can edit before posting.

### 3. Tag Suggestions
**Options:**
- **None:** Let user manually add tags
- **Auto-suggest from content:** Extract keywords (complex, out of scope)
- **Course-specific defaults:** e.g., "quokka-chat" tag

**Recommendation:** Leave tags empty by default. User can add manually (same as AskQuestionModal).

### 4. Success Navigation
**Options:**
- **Navigate to new thread:** `router.push(/threads/${newThread.id})`
- **Close modal + show toast:** Stay on course page
- **Custom callback:** Let parent decide (via `onSuccess` prop)

**Recommendation:** Navigate to new thread (consistent with AskQuestionModal default). Close FloatingQuokka on success.

### 5. Button Placement in FloatingQuokka
**Options:**
- **Above input form:** Separate row, always visible
- **Inside footer, left side:** Next to input/send button
- **Conditional replacement:** Replace quick prompts area

**Recommendation:** Add button row above input form (lines 337-338). Show only when `messages.length >= 2`.

---

## Next Steps (For Implementation Phase)

1. Create `lib/utils/conversation-to-thread.ts` utility
   - `formatConversation(messages: Message[]): string`
   - `generateTitleFromMessages(messages: Message[]): string`

2. Create `components/course/conversation-to-thread-modal.tsx`
   - Props interface: `isOpen`, `onClose`, `messages`, `courseId`, `courseName`
   - Form state: `title`, `content`, `tags`
   - Mutation: `useCreateThread()`
   - Success: Navigate to thread or call `onSuccess` callback

3. Integrate into `FloatingQuokka`
   - Add state: `isPostModalOpen`
   - Add button: Show when `messages.length >= 2`
   - Pass props: `messages`, `courseId`, `courseName`
   - Handle success: Close chat, clear messages (optional)

4. TypeScript types (if needed)
   - Reuse existing `Message` interface from FloatingQuokka
   - Export interface for modal props

5. Testing checklist
   - Modal opens on button click
   - Title auto-generated from first user message
   - Content shows formatted conversation
   - Form validation works (title + content required)
   - Thread created successfully
   - Navigation works
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader announces modal correctly
   - Mobile responsive (360px, 768px, 1024px)

---

**Files to Reference During Implementation:**
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/course/ask-question-modal.tsx` - Dialog pattern
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/course/floating-quokka.tsx` - Message structure
- `/Users/dgz/projects-professional/quokka/quokka-demo/components/ui/dialog.tsx` - Dialog primitives
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/api/hooks.ts` - `useCreateThread` hook
- `/Users/dgz/projects-professional/quokka/quokka-demo/lib/models/types.ts` - Type definitions

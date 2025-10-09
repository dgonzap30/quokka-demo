# QDS Styling Plan: Conversation to Thread Feature

## Overview

This plan provides exact QDS-compliant styling specifications for implementing the "Post as Thread" button in FloatingQuokka and the ConversationToThreadModal component.

**Reference Components:**
- `components/course/floating-quokka.tsx` (QDS exemplar: 10/10 compliance)
- `components/course/ask-question-modal.tsx` (Glass modal reference)

**QDS Compliance Target:** 10/10 (match FloatingQuokka's exemplary implementation)

---

## Part 1: FloatingQuokka "Post as Thread" Button

### Location & Trigger Conditions

**File:** `components/course/floating-quokka.tsx`

**Placement:** Below message input, above the send button row

**Visibility Logic:**
```tsx
// Show button only when:
// 1. Conversation has at least 2 messages (1 user + 1 assistant minimum)
// 2. User has sent at least 1 message
const canPostAsThread = messages.length >= 2 && messages.some(m => m.role === "user");
```

### Button Specification

**Variant:** Glass secondary (neutral, supportive action)

**Markup:**
```tsx
{canPostAsThread && (
  <Button
    variant="glass"
    size="default"
    onClick={handleOpenThreadModal}
    className="w-full mb-2 min-h-[44px]"
    aria-label="Convert conversation to thread"
  >
    <MessageSquarePlus className="h-4 w-4 mr-2" />
    Post as Thread
  </Button>
)}
```

**Styling Details:**
- **Variant:** `glass` (neutral glass effect from QDS)
- **Size:** `default` (36px height base, extended to 44px via `min-h-[44px]` for touch)
- **Width:** `w-full` (spans input area width)
- **Margin:** `mb-2` (8px below messages, above input row)
- **Icon:** Lucide `MessageSquarePlus`, `h-4 w-4` (16px), `mr-2` spacing
- **Text:** "Post as Thread" (clear, action-oriented)

**States:**
- **Default:** Glass effect with neutral background
- **Hover:** Intensified glass effect (defined in Button component)
- **Focus:** `ring-2 ring-accent ring-offset-2` (from QDS focus system)
- **Disabled:** `opacity-50 cursor-not-allowed` (when `!canPostAsThread`)

**Tokens Used:**
- Spacing: `mb-2` (8px), `mr-2` (8px) - 4pt grid
- Height: `min-h-[44px]` - Touch target minimum
- Icon size: `h-4 w-4` - 16px standard

---

## Part 2: ConversationToThreadModal Component

### File Location

**New File:** `components/course/conversation-to-thread-modal.tsx`

### Component Props Interface

```tsx
interface ConversationToThreadModalProps {
  /** Course ID for the thread */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Course code for display */
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
```

### Modal Structure (QDS Glass Pattern)

**Container:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong">
    <DialogHeader>
      <DialogTitle className="heading-3 glass-text">
        Post Conversation as Thread
      </DialogTitle>
      <DialogDescription className="text-base glass-text">
        Convert your Quokka conversation into a public thread for {courseName}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {/* Form sections */}
    </form>

    <DialogFooter className="gap-3 sm:gap-2">
      {/* Action buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**QDS Tokens:**
- **Container:** `max-w-3xl` (768px), `max-h-[90vh]`, `glass-panel-strong`
- **Glass Effect:** `backdrop-blur-lg` + `bg-glass-strong` (defined in utility class)
- **Border:** `border-[var(--border-glass)]` (implicit in glass-panel-strong)
- **Shadow:** `shadow-glass-lg` (implicit in glass-panel-strong)
- **Title:** `heading-3` (text-2xl md:text-3xl font-bold), `glass-text` shadow
- **Description:** `text-base`, `glass-text`
- **Form Spacing:** `space-y-6` (24px between sections), `mt-4` (16px top margin)
- **Footer Gap:** `gap-3` mobile (12px), `sm:gap-2` desktop (8px)

---

### Section 1: Title Field

**Markup:**
```tsx
<div className="space-y-3">
  <label htmlFor="thread-title" className="text-sm font-semibold">
    Thread Title *
  </label>
  <Input
    id="thread-title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g., Binary Search Question"
    className="h-12 text-base"
    required
    aria-required="true"
    maxLength={200}
    autoFocus
  />
  <p className="text-xs text-muted-foreground glass-text">
    {title.length}/200 characters
  </p>
</div>
```

**QDS Tokens:**
- **Container:** `space-y-3` (12px spacing)
- **Label:** `text-sm font-semibold` (14px, semibold weight)
- **Input:** `h-12` (48px height, 4pt aligned), `text-base` (16px)
- **Helper:** `text-xs text-muted-foreground glass-text` (12px, muted color, readable on glass)
- **Radius:** Implicit from Input component (`rounded-lg`, 16px)
- **Border:** `border-input` (semantic token)
- **Focus:** `focus:ring-2 focus:ring-accent` (from Input component)

---

### Section 2: Conversation Preview

**Markup:**
```tsx
<div className="space-y-3">
  <label className="text-sm font-semibold">
    Conversation Preview
  </label>
  <div className="glass-panel p-6 rounded-2xl max-h-[300px] overflow-y-auto">
    <div className="space-y-4">
      {formattedMessages.map((msg, idx) => (
        <div
          key={idx}
          className={msg.role === "user" ? "message-user p-3" : "message-assistant p-3"}
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-semibold">
              {msg.role === "user" ? "You" : "Quokka"}
            </span>
            <span className="text-xs text-subtle">
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </p>
        </div>
      ))}
    </div>
  </div>
  <p className="text-xs text-muted-foreground glass-text">
    This conversation will be formatted as the thread content
  </p>
</div>
```

**QDS Tokens:**
- **Preview Container:** `glass-panel` (blur-md + medium glass), `p-6` (24px), `rounded-2xl` (24px)
- **Max Height:** `max-h-[300px]` (scrollable for long conversations)
- **Message Spacing:** `space-y-4` (16px between messages)
- **Message Bubbles:** `.message-user` and `.message-assistant` utilities (defined in globals.css)
  - User: `backdrop-blur-md bg-accent/90 text-accent-foreground border border-accent/30 rounded-2xl`
  - Assistant: `backdrop-blur-md bg-glass-strong border border-[var(--border-glass)] rounded-2xl`
- **Bubble Padding:** `p-3` (12px)
- **Meta Gap:** `gap-2` (8px), `mb-2` (8px below meta)
- **Text Size:** `text-sm` (14px content), `text-xs` (12px meta)
- **Text Color:** `text-subtle` for timestamps (defined via CSS variable)

---

### Section 3: Tags Field (Optional)

**Markup:**
```tsx
<div className="space-y-3">
  <label htmlFor="thread-tags" className="text-sm font-semibold">
    Tags (optional)
  </label>
  <Input
    id="thread-tags"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="e.g., algorithms, binary-search, help"
    className="h-12 text-base"
  />
  <p className="text-xs text-muted-foreground glass-text">
    Separate tags with commas
  </p>
</div>
```

**QDS Tokens:** Same as Title Field

---

### Section 4: Action Buttons (Footer)

**Markup:**
```tsx
<DialogFooter className="gap-3 sm:gap-2">
  <Button
    type="button"
    variant="outline"
    size="lg"
    onClick={onClose}
    disabled={isSubmitting}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    variant="glass-primary"
    size="lg"
    disabled={isSubmitting || !isFormValid}
  >
    {isSubmitting ? "Creating Thread..." : "Post Thread"}
  </Button>
</DialogFooter>
```

**QDS Tokens:**
- **Footer Gap:** `gap-3` (12px mobile), `sm:gap-2` (8px desktop)
- **Button Size:** `lg` (44px height minimum for touch)
- **Cancel Button:**
  - Variant: `outline` (transparent bg, border)
  - Border: `border-border` (semantic token)
  - Hover: `hover:bg-muted/10`
- **Submit Button:**
  - Variant: `glass-primary` (glass effect with primary color)
  - Background: `backdrop-blur-lg bg-primary/90`
  - Border: `border-[var(--border-glass)]`
  - Text: `text-primary-foreground`
  - Hover: Intensified glass + glow effect
- **Disabled State:**
  - `opacity-50 cursor-not-allowed`
  - Applied when `isSubmitting` or `!isFormValid`

---

### Loading State

**Markup:**
```tsx
{isSubmitting && (
  <div className="flex items-center justify-center py-12">
    <div className="glass-panel px-8 py-6 inline-flex items-center gap-4 rounded-2xl">
      <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
      <p className="text-base text-foreground glass-text font-medium">
        Creating thread...
      </p>
    </div>
  </div>
)}
```

**QDS Tokens:**
- **Container:** `py-12` (48px vertical centering)
- **Panel:** `glass-panel px-8 py-6 rounded-2xl` (32px horizontal, 24px vertical, 24px radius)
- **Layout:** `inline-flex items-center gap-4` (16px gap)
- **Spinner:** `h-6 w-6` (24px), `border-3` (3px border), `border-primary`, `border-t-transparent`
- **Text:** `text-base font-medium glass-text` (16px, readable on glass)

---

### Error State

**Markup:**
```tsx
{error && (
  <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
    <p className="text-sm text-danger font-medium">
      Failed to create thread. Please try again.
    </p>
  </div>
)}
```

**QDS Tokens:**
- **Background:** `bg-danger/10` (10% opacity danger color)
- **Border:** `border-danger/20` (20% opacity danger color)
- **Radius:** `rounded-lg` (16px)
- **Padding:** `p-4` (16px)
- **Text:** `text-sm text-danger font-medium` (14px, danger color, medium weight)

---

## Part 3: Responsive Behavior

### Breakpoint Strategy

**Mobile (<640px):**
```tsx
className="w-[90vw] max-w-[400px]"  // Modal width
className="gap-3"                    // Footer button gap (12px)
className="flex-col"                 // Stack buttons vertically if needed
```

**Tablet (640-768px):**
```tsx
className="max-w-2xl"                // Modal width (672px)
className="sm:gap-2"                 // Footer button gap (8px)
```

**Desktop (768px+):**
```tsx
className="max-w-3xl"                // Modal width (768px)
className="sm:gap-2"                 // Footer button gap (8px)
```

**Responsive Spacing Adjustments:**
```tsx
// Mobile: Compact spacing
className="space-y-6 p-4"

// Desktop: Generous spacing
className="md:space-y-8 md:p-6"
```

---

## Part 4: Dark Mode Support

**All tokens automatically support dark mode via CSS variables:**

```css
:root {
  --primary: #8A6B3D;
  --glass-medium: rgba(255, 255, 255, 0.7);
  --border-glass: rgba(255, 255, 255, 0.18);
  --text: #2A2721;
}

.dark {
  --primary: #C1A576;
  --glass-medium: rgba(23, 21, 17, 0.7);
  --border-glass: rgba(255, 255, 255, 0.08);
  --text: #F3EFE8;
}
```

**No hardcoded colors needed.** All styles use semantic tokens that adapt automatically.

---

## Part 5: Accessibility Specifications

### Focus Management

**Focus Trap:**
```tsx
import { FocusScope } from "@radix-ui/react-focus-scope";

<FocusScope
  trapped={true}
  onMountAutoFocus={(e) => {
    e.preventDefault();
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  }}
>
  {/* Modal content */}
</FocusScope>
```

**Focus Restoration:**
```tsx
// On close, return focus to trigger button
const handleClose = () => {
  onClose();
  setTimeout(() => {
    triggerButtonRef.current?.focus();
  }, 100);
};
```

### ARIA Attributes

**Dialog:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <DialogTitle id="modal-title">
    Post Conversation as Thread
  </DialogTitle>
  <DialogDescription id="modal-description">
    Convert your Quokka conversation into a public thread
  </DialogDescription>
</div>
```

**Form Fields:**
```tsx
<Input
  id="thread-title"
  aria-label="Thread title"
  aria-required="true"
  aria-invalid={titleError ? "true" : "false"}
  aria-describedby="title-error"
/>
{titleError && (
  <p id="title-error" role="alert">
    {titleError}
  </p>
)}
```

**Buttons:**
```tsx
<Button
  aria-label="Convert conversation to thread"
  aria-disabled={!canPostAsThread}
>
  Post as Thread
</Button>
```

### Keyboard Navigation

**Supported Keys:**
- **Tab/Shift+Tab:** Navigate between form fields and buttons
- **Escape:** Close modal, restore focus to trigger button
- **Enter:** Submit form (when on submit button or in input field)
- **Space:** Activate focused button

---

## Part 6: Implementation Checklist

### FloatingQuokka Changes

- [ ] Add "Post as Thread" button below messages
- [ ] Implement `canPostAsThread` logic (min 2 messages)
- [ ] Add button with `variant="glass"` `size="default"` `className="w-full mb-2 min-h-[44px]"`
- [ ] Import `MessageSquarePlus` icon from Lucide
- [ ] Add `onClick` handler to open modal
- [ ] Pass `messages`, `courseId`, `courseName`, `courseCode` to modal

### ConversationToThreadModal Component

#### Structure
- [ ] Create `components/course/conversation-to-thread-modal.tsx`
- [ ] Import Dialog components from shadcn/ui
- [ ] Import Button, Input from shadcn/ui
- [ ] Import `useCreateThread` from `@/lib/api/hooks`
- [ ] Define `ConversationToThreadModalProps` interface

#### Styling
- [ ] Use `glass-panel-strong` on DialogContent
- [ ] Apply `heading-3 glass-text` to DialogTitle
- [ ] Apply `text-base glass-text` to DialogDescription
- [ ] Use `space-y-6` for form sections
- [ ] Use `space-y-3` for field groups

#### Form Fields
- [ ] Title input: `h-12 text-base` with character counter
- [ ] Preview area: `glass-panel p-6 rounded-2xl max-h-[300px]`
- [ ] Message bubbles: `.message-user` and `.message-assistant` utilities
- [ ] Tags input: `h-12 text-base` with helper text

#### Buttons
- [ ] Cancel: `variant="outline"` `size="lg"`
- [ ] Submit: `variant="glass-primary"` `size="lg"`
- [ ] Footer: `gap-3 sm:gap-2`
- [ ] Disable states: `disabled={isSubmitting || !isFormValid}`

#### States
- [ ] Loading: Glass panel with spinner + "Creating thread..." text
- [ ] Error: `bg-danger/10 border-danger/20 rounded-lg p-4`
- [ ] Success: Navigate to thread or call `onSuccess` callback

#### Accessibility
- [ ] Wrap in `<FocusScope trapped={true}>`
- [ ] Add `role="dialog"` `aria-modal="true"`
- [ ] Add `aria-labelledby` and `aria-describedby`
- [ ] Auto-focus title input on mount
- [ ] Restore focus to trigger button on close
- [ ] Add `aria-label` to all buttons
- [ ] Add `aria-required` to required inputs

#### Responsive
- [ ] Mobile: `w-[90vw] max-w-[400px]`
- [ ] Tablet: `max-w-2xl`
- [ ] Desktop: `max-w-3xl`
- [ ] Footer gap: `gap-3 sm:gap-2`

#### Dark Mode
- [ ] Verify all colors use semantic tokens
- [ ] Test in dark mode for contrast
- [ ] Ensure glass effects work in both themes

---

## Part 7: Token Reference Table

### Complete Token Usage Summary

| Element | Token | Value | Purpose |
|---------|-------|-------|---------|
| **Modal** |
| Container | `glass-panel-strong` | blur-lg + strong glass bg | Main modal surface |
| Width | `max-w-3xl` | 768px | Modal max width |
| Height | `max-h-[90vh]` | 90% viewport | Scrollable limit |
| Title | `heading-3 glass-text` | 2xl/3xl bold + shadow | Modal heading |
| Description | `text-base glass-text` | 16px + shadow | Modal subheading |
| **Spacing** |
| Form sections | `space-y-6` | 24px | Between major sections |
| Field groups | `space-y-3` | 12px | Within field sections |
| Preview messages | `space-y-4` | 16px | Between message items |
| Footer gap | `gap-3 sm:gap-2` | 12px/8px | Button spacing |
| **Inputs** |
| Height | `h-12` | 48px | Touch-friendly height |
| Text size | `text-base` | 16px | Input text size |
| Border | `border-input` | Semantic token | Input border |
| Radius | `rounded-lg` | 16px | Input corners |
| **Buttons** |
| Primary | `glass-primary` | Glass + primary color | Submit button |
| Secondary | `outline` | Border only | Cancel button |
| Size | `lg` | 44px min height | Touch target |
| Icon size | `h-4 w-4` | 16px | Button icons |
| **Preview Panel** |
| Surface | `glass-panel` | blur-md + medium glass | Preview container |
| Padding | `p-6` | 24px | Panel padding |
| Radius | `rounded-2xl` | 24px | Panel corners |
| Max height | `max-h-[300px]` | 300px | Scrollable limit |
| **Message Bubbles** |
| User | `message-user` | Accent glass | User messages |
| Assistant | `message-assistant` | Neutral glass | AI messages |
| Padding | `p-3` | 12px | Bubble padding |
| Radius | `rounded-2xl` | 24px | Bubble corners |
| **Typography** |
| Label | `text-sm font-semibold` | 14px semibold | Field labels |
| Helper | `text-xs text-muted-foreground` | 12px muted | Helper text |
| Content | `text-sm leading-relaxed` | 14px relaxed | Message content |
| Meta | `text-xs text-subtle` | 12px subtle | Timestamps |
| **States** |
| Loading panel | `glass-panel px-8 py-6` | 32px/24px padding | Loading container |
| Spinner | `h-6 w-6 border-3` | 24px, 3px border | Loading spinner |
| Error bg | `bg-danger/10` | 10% danger | Error background |
| Error border | `border-danger/20` | 20% danger | Error border |
| **Colors** |
| Primary | `--primary` | #8A6B3D / #C1A576 | Primary actions |
| Accent | `--accent` | #2D6CDF / #86A9F6 | User messages |
| Danger | `--danger` | #D92D20 | Error states |
| Glass | `--glass-strong` | rgba opacity | Glass surfaces |
| Border glass | `--border-glass` | rgba opacity | Glass borders |

---

## Part 8: Testing Guidelines

### Visual Testing

**Light Mode:**
- [ ] Modal appears with glass effect
- [ ] Text is readable on glass backgrounds (glass-text shadow applied)
- [ ] Buttons have proper hover states
- [ ] Preview panel shows message bubbles correctly
- [ ] Loading spinner is centered and visible

**Dark Mode:**
- [ ] Glass effects adapt to dark theme
- [ ] Text contrast remains WCAG AA compliant
- [ ] Button colors adjust automatically
- [ ] Message bubbles maintain readability

### Responsive Testing

**Mobile (360px):**
- [ ] Modal takes 90vw width
- [ ] Buttons stack vertically if needed
- [ ] Preview panel scrolls properly
- [ ] Touch targets are at least 44px

**Tablet (768px):**
- [ ] Modal uses max-w-2xl
- [ ] Footer buttons inline with 8px gap
- [ ] Preview panel remains readable

**Desktop (1024px+):**
- [ ] Modal uses max-w-3xl
- [ ] All spacing feels comfortable
- [ ] Glass effects perform smoothly

### Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab order is logical (title → preview → tags → cancel → submit)
- [ ] Escape closes modal
- [ ] Enter submits form when focused on submit button
- [ ] Focus returns to trigger button on close

**Screen Reader:**
- [ ] Dialog role announced
- [ ] Title and description read correctly
- [ ] Form labels associated with inputs
- [ ] Button purposes clear
- [ ] Error messages announced

**Contrast:**
- [ ] All text meets 4.5:1 minimum (AA)
- [ ] Focus indicators visible
- [ ] Button states distinguishable

### Performance Testing

**Glass Layers:**
- [ ] Maximum 3 blur layers active (modal + preview + messages)
- [ ] No jank during scroll
- [ ] Smooth animations on open/close

**Reduced Motion:**
- [ ] Animations disabled when `prefers-reduced-motion` set
- [ ] Modal still functional without animations

---

## Part 9: Implementation Order

### Phase 1: FloatingQuokka Integration
1. Add state for modal open/close
2. Implement `canPostAsThread` logic
3. Add "Post as Thread" button to UI
4. Wire onClick handler
5. Test button visibility logic

### Phase 2: Modal Structure
1. Create ConversationToThreadModal component file
2. Implement Dialog structure with glass styling
3. Add DialogHeader with title and description
4. Apply glass-text utilities
5. Test modal open/close

### Phase 3: Form Fields
1. Add title input with character counter
2. Add tags input with helper text
3. Implement form validation
4. Test input behavior

### Phase 4: Preview Panel
1. Format conversation messages for display
2. Create preview panel with glass-panel styling
3. Render message bubbles with utilities
4. Add scrolling for long conversations
5. Test preview rendering

### Phase 5: Actions & States
1. Add footer buttons with proper variants
2. Implement form submission logic
3. Add loading state with spinner
4. Add error state handling
5. Test all states

### Phase 6: Accessibility
1. Add FocusScope wrapper
2. Add ARIA attributes
3. Implement focus management
4. Add keyboard handlers
5. Test with keyboard only
6. Test with screen reader

### Phase 7: Polish & Testing
1. Test responsive behavior
2. Test dark mode
3. Verify contrast ratios
4. Test performance with long conversations
5. Final QA pass

---

**End of QDS Styling Plan**

This plan ensures 100% QDS compliance by reusing proven patterns from FloatingQuokka (10/10 exemplar) and AskQuestionModal. All tokens, spacing, radius, shadows, and accessibility patterns follow QDS guidelines exactly.

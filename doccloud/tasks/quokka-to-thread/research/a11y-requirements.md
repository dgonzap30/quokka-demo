# Accessibility Requirements Research: Conversation-to-Thread Feature

## Task Overview

Adding "Post as Thread" button to FloatingQuokka chat with modal dialog for preview/editing. Must meet WCAG 2.2 Level AA compliance.

---

## WCAG 2.2 AA Requirements Analysis

### 1. Perceivable

#### 1.1 Text Alternatives (1.1.1)
- **Requirement**: All non-text content has text alternatives
- **Application**:
  - Button icon must have accessible label
  - Loading states need text announcements
  - Success/error states need text alternatives

#### 1.2 Time-based Media (N/A)
- Not applicable for this feature

#### 1.3 Adaptable (1.3.1, 1.3.2, 1.3.3)
- **1.3.1 Info and Relationships**: Semantic HTML structure required
  - Button uses `<button>` element
  - Modal uses proper dialog semantics
  - Form fields properly labeled
  - Heading hierarchy maintained
- **1.3.2 Meaningful Sequence**: Content order makes sense when linearized
- **1.3.3 Sensory Characteristics**: Instructions don't rely solely on shape/size/position

#### 1.4 Distinguishable

**1.4.3 Contrast (Minimum)** - CRITICAL
- Text contrast ratio: **4.5:1 minimum** (3:1 for large text ≥18pt/14pt bold)
- UI component contrast: **3:1 minimum**
- Current QDS tokens:
  - Primary: `#8A6B3D` on white `#FFFFFF` = 4.82:1 ✓
  - Primary hover: `#6F522C` on white = 7.18:1 ✓
  - AI purple 600: `#9333EA` on white = 4.54:1 ✓
  - Text: `#2A2721` on white = 13.84:1 ✓
  - Muted: `#625C52` on white = 5.51:1 ✓
  - Border glass: `rgba(255,255,255,0.18)` - needs verification in context

**1.4.10 Reflow** - WCAG 2.1 AA
- Content reflows at 320px width without horizontal scrolling
- Modal must be responsive

**1.4.11 Non-text Contrast** - WCAG 2.1 AA
- Focus indicators: **3:1 contrast** against adjacent colors
- Button borders/outlines: **3:1 contrast**
- Current focus ring: `rgba(45, 108, 223, 0.3)` with 4px outline

**1.4.12 Text Spacing** - WCAG 2.1 AA
- Content readable with user-applied text spacing
- Line height at least 1.5x font size
- Spacing after paragraphs at least 2x font size

**1.4.13 Content on Hover or Focus** - WCAG 2.1 AA
- Tooltips/popovers dismissible, hoverable, persistent

### 2. Operable

#### 2.1 Keyboard Accessible (2.1.1, 2.1.2, 2.1.4)
- **2.1.1 Keyboard**: All functionality available via keyboard
  - Button: Enter/Space to activate
  - Modal: Escape to close
  - Form fields: Tab navigation
  - Submit: Enter key in form
- **2.1.2 No Keyboard Trap**: Users can navigate away
  - Focus trap in modal (intentional and escapable)
  - Tab/Shift+Tab cycles through modal elements
  - Escape releases focus trap
- **2.1.4 Character Key Shortcuts**: Not applicable (no single-key shortcuts)

#### 2.2 Enough Time (2.2.1)
- **2.2.1 Timing Adjustable**: No time limits on user actions
- Modal stays open until user dismisses or submits
- No auto-dismiss timeouts

#### 2.3 Seizures (2.3.1)
- **2.3.1 Three Flashes**: No flashing content >3 times per second
- Loading spinners use smooth rotation, no flashing

#### 2.4 Navigable (2.4.3, 2.4.6, 2.4.7)
- **2.4.3 Focus Order**: Tab order is logical and intuitive
  - Button → Modal opens → Title field → Content field → Tags field → Cancel → Post
- **2.4.6 Headings and Labels**: Clear descriptive labels
  - Modal title: "Post Conversation as Thread"
  - Field labels: "Title", "Content", "Tags (optional)"
- **2.4.7 Focus Visible**: Focus indicator always visible
  - QDS default: `outline-ring outline-2 outline-offset-2` with `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3)`
  - Enhanced for glass backgrounds: `rgba(45, 108, 223, 0.5)`

#### 2.5 Input Modalities (2.5.1, 2.5.2, 2.5.3, 2.5.4)
- **2.5.1 Pointer Gestures**: No complex gestures required (single tap/click only)
- **2.5.2 Pointer Cancellation**: Click activation on up-event (default button behavior)
- **2.5.3 Label in Name**: Accessible name contains visible text label
- **2.5.4 Motion Actuation**: No motion/tilt gestures required
- **2.5.5 Target Size (Enhanced)**: Touch targets minimum **44x44px** (WCAG 2.2 AA)
  - Button: `h-14 w-14` (56x56px) ✓
  - Form buttons: `h-11` (44px height) ✓
  - Icon buttons in modal: minimum `size-10` (40x40px) - needs review

### 3. Understandable

#### 3.1 Readable (3.1.1)
- **3.1.1 Language of Page**: HTML lang attribute set (page-level, inherited)

#### 3.2 Predictable (3.2.1, 3.2.2)
- **3.2.1 On Focus**: Receiving focus doesn't change context unexpectedly
- **3.2.2 On Input**: Changing input doesn't auto-submit (explicit button press required)

#### 3.3 Input Assistance (3.3.1, 3.3.2)
- **3.3.1 Error Identification**: Errors clearly identified
  - Required field validation: "Title is required"
  - Content too long: "Content exceeds maximum length"
- **3.3.2 Labels or Instructions**: Clear labels and instructions provided
  - All form fields have visible labels
  - Optional fields marked "(optional)"
  - Placeholder text provides examples

### 4. Robust

#### 4.1 Compatible (4.1.2, 4.1.3)
- **4.1.2 Name, Role, Value**: All UI components have correct ARIA attributes
- **4.1.3 Status Messages**: Dynamic content changes announced to assistive technology

---

## Existing A11y Patterns Found

### FloatingQuokka Component

**Strengths:**
1. **Focus Management** (lines 226-238)
   - Uses Radix UI `<FocusScope>` with `trapped={state === "expanded"}`
   - Focus automatically moves to message input on expand
   - Focus restored to FAB button on minimize (lines 78-80, 87-89)
   - Proper `onMountAutoFocus` and `onUnmountAutoFocus` handlers

2. **Semantic Dialog** (lines 240-246)
   - `role="dialog"` with `aria-modal="true"`
   - `aria-labelledby="quokka-title"` points to dialog title
   - `aria-describedby="quokka-description"` provides context

3. **ARIA Labels** (lines 211-212, 274-275, 286-288)
   - FAB button: `aria-label="Open Quokka AI Assistant"`
   - Minimize button: `aria-label="Minimize chat"`
   - Close button: `aria-label="Close chat"`
   - Message input: `aria-label="Message input"`

4. **Screen Reader Announcements** (lines 296-301)
   - Chat history: `role="log"` with `aria-live="polite"` for message announcements
   - `aria-atomic="false"` for incremental updates
   - `aria-relevant="additions"` to announce new messages only
   - `aria-label="Chat message history"`

5. **Dynamic Content** (lines 322-330)
   - "Thinking" state: `role="status"` with `aria-live="polite"`
   - Announces "Quokka is thinking..." to screen readers

6. **Screen Reader Only Text** (lines 260-262, 315-316)
   - Dialog description: `className="sr-only"`
   - Message timestamps: `<span className="sr-only">{message.role === "user" ? "Sent" : "Received"} at </span>`

7. **Touch Targets**
   - FAB button: `h-14 w-14` (56x56px) ✓
   - Icon buttons: `h-8 w-8` (32x32px) ⚠️ Below 44x44px minimum

**Gaps:**
1. No keyboard shortcuts documented
2. Quick prompt buttons may need larger touch targets (line 347-353)
3. No explicit focus-visible styles (relies on global styles)

### AskQuestionModal Component

**Strengths:**
1. **Radix UI Dialog** (lines 124-125)
   - Uses `<Dialog>` with built-in a11y
   - `open` state controlled externally
   - `onOpenChange` handles close events

2. **Semantic Form Structure** (line 133)
   - `<form onSubmit={handleSubmit}>` with proper submit handling
   - Native form validation with `required` and `aria-required`

3. **Field Labels** (lines 136-149, 156-169, 174-186)
   - All inputs have associated `<label>` with `htmlFor` matching `id`
   - Required fields marked with asterisk and `aria-required="true"`
   - Character counters provide feedback

4. **Dialog Components** (lines 126-131, 195-226)
   - `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>` provide structure
   - `<DialogFooter>` groups action buttons
   - Proper heading hierarchy

5. **Button States** (lines 201-225)
   - Disabled states prevent invalid submissions
   - Loading states: "Generating Preview...", "Posting..."
   - Clear visual and textual feedback

6. **Auto-focus** (line 148)
   - Title field has `autoFocus` attribute for immediate keyboard access

**Gaps:**
1. Error messages not associated with fields (no `aria-describedby` for errors)
2. No `aria-invalid` on fields with validation errors
3. Success/error status not announced to screen readers (no `role="status"` or `aria-live`)
4. Preview dialog (lines 232-299) lacks proper focus management
5. Button order in footer may not be optimal (Cancel, Preview, Post)

### Radix UI Dialog Component

**Built-in A11y:**
1. **Portal & Overlay** (lines 21-46)
   - Content rendered in portal (outside DOM hierarchy)
   - `DialogOverlay` with `bg-black/50` provides visual backdrop
   - Fade-in/out animations

2. **Focus Management**
   - Radix automatically manages focus trap
   - Focus moves to first focusable element on open
   - Focus restored to trigger on close

3. **Close Button** (lines 69-77)
   - `DialogPrimitive.Close` component
   - Keyboard accessible (Enter/Space)
   - Focus ring on focus-visible
   - `<span className="sr-only">Close</span>` for screen readers

4. **Semantic Headings** (lines 106-117, 119-130)
   - `DialogTitle` uses `DialogPrimitive.Title`
   - `DialogDescription` uses `DialogPrimitive.Description`
   - Proper ARIA associations (aria-labelledby, aria-describedby)

**Considerations:**
1. `showCloseButton` prop allows hiding close button (accessibility concern if no other close method)
2. Overlay click to close - must ensure keyboard users can escape (Escape key)
3. Animation durations: 200ms (`duration-200`) meets quick response expectations

---

## Color Contrast Audit

### QDS Token Compliance

| Element | Foreground | Background | Ratio | WCAG AA | Notes |
|---------|------------|------------|-------|---------|-------|
| Primary button text | `#FFFFFF` | `#8A6B3D` | 4.82:1 | ✓ Pass | Large text, 3:1 minimum met |
| Primary button hover | `#FFFFFF` | `#6F522C` | 7.18:1 | ✓ Pass | High contrast |
| Body text | `#2A2721` | `#FFFFFF` | 13.84:1 | ✓ Pass | Excellent |
| Muted text | `#625C52` | `#FFFFFF` | 5.51:1 | ✓ Pass | Meets 4.5:1 |
| AI purple 600 | `#9333EA` | `#FFFFFF` | 4.54:1 | ✓ Pass | Meets 4.5:1 |
| Glass panel text | `#2A2721` | `rgba(255,255,255,0.7)` | ~9.7:1 | ✓ Pass | Calculated with backdrop |
| Glass border | `rgba(255,255,255,0.18)` | varies | ⚠️ | ⚠️ Needs testing | Context-dependent |
| Focus ring | `rgba(45,108,223,0.3)` | varies | ⚠️ | ⚠️ Needs testing | 3:1 against adjacent required |

### New Button for Feature

Proposed location: FloatingQuokka chat footer (line 338-378)
Proposed styling: `variant="glass-primary"` or `variant="outline"`

**Glass Primary Button:**
- Background: `rgba(138,107,61,0.7)` (primary/70)
- Text: `#FFFFFF` (primary-foreground)
- Border: `rgba(138,107,61,0.3)` (primary/30)
- Hover: `rgba(138,107,61,0.85)` (primary/85)
- Contrast: 4.82:1 (same as solid primary) ✓

**Outline Button:**
- Background: `#FFFFFF` (background)
- Text: `#2A2721` (foreground)
- Border: `#CDC7BD` (neutral-200)
- Hover background: `#2D6CDF` (accent)
- Hover text: `#FFFFFF`
- Contrast: 13.84:1 (text on bg), 4.76:1 (hover) ✓

### Focus Indicators

**Global Focus Styles** (globals.css lines 477-497)
- Light mode: `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3)`
- Dark mode: `box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4)`
- Glass backgrounds: `rgba(45, 108, 223, 0.5)` / `rgba(134, 169, 246, 0.6)`
- Offset: 2px (`outline-offset-2`)
- Width: 2px (`outline-2`)
- Color: `--ring` (`#2D6CDF` light, `#86A9F6` dark)

**Contrast Calculation:**
- Ring color `#2D6CDF` vs white `#FFFFFF`: 4.76:1 ✓ (>3:1 for UI components)
- Ring color `#86A9F6` vs dark surface `#171511`: 7.29:1 ✓

---

## Touch Target Size Analysis (WCAG 2.2)

### Minimum Requirements (2.5.5 - Target Size)
- **Level AA**: Minimum 24x24 CSS pixels
- **Best Practice**: 44x44px (iOS/Android guidelines)
- **Exceptions**: Inline text links, user-configurable size

### Current Components

| Element | Size | Status | Location |
|---------|------|--------|----------|
| FAB button | 56x56px (h-14 w-14) | ✓ Pass | FloatingQuokka L208 |
| Icon buttons (minimize/close) | 32x32px (h-8 w-8) | ⚠️ Below 44px | FloatingQuokka L272, L284 |
| Quick prompt buttons | min-h-44px | ✓ Pass | FloatingQuokka L349 |
| Send button (size="sm") | 36px height (h-9) | ⚠️ Below 44px | FloatingQuokka L372 |
| Modal form buttons (size="lg") | 44px height (h-11) | ✓ Pass | AskQuestionModal L199+ |
| Modal close button | 32x32px | ⚠️ Below 44px | Dialog L72 |

### Recommendations
1. **Icon buttons**: Increase to `h-10 w-10` (40x40px) minimum or `h-11 w-11` (44x44px) ideal
2. **Send button**: Change from `size="sm"` to `size="default"` (40px) or add padding
3. **Modal close button**: Consider `size-11` (44x44px) or increase hit area with padding

---

## Screen Reader Compatibility Patterns

### VoiceOver (iOS/macOS)
- **Button announcement**: "Post as Thread, button" ✓
- **Dialog**: "Post Conversation as Thread, dialog" ✓
- **Form fields**: "Title, edit text, required" ✓
- **Loading**: "Quokka is thinking, status" ✓

### NVDA/JAWS (Windows)
- **Button**: "Post as Thread button" ✓
- **Dialog**: "Post Conversation as Thread dialog" ✓
- **Form**: "Title edit required" ✓
- **Live regions**: "New message from Quokka" ✓

### Expected Announcements for New Feature

1. **Button disabled state** (< 2 messages):
   - "Post as Thread, button, dimmed" (VoiceOver)
   - "Post as Thread button unavailable" (NVDA)
   - Needs: `aria-disabled="true"` or `disabled` attribute

2. **Button enabled state** (≥ 2 messages):
   - "Post as Thread, button"
   - Needs: Clear accessible name

3. **Modal open**:
   - "Post Conversation as Thread, dialog"
   - Focus: Title field
   - Needs: `aria-labelledby`, `aria-describedby`

4. **Loading state**:
   - "Creating thread, status"
   - Needs: `role="status"` with `aria-live="polite"`

5. **Success**:
   - "Thread created successfully"
   - Needs: `role="status"` announcement before navigation

6. **Error**:
   - "Failed to create thread: [reason]"
   - Needs: `role="alert"` or `aria-live="assertive"`

---

## Form Validation Requirements

### Field-Level Validation

**Title Field:**
- Required: `aria-required="true"`
- Max length: 200 characters
- Error: `aria-invalid="true"` + `aria-describedby="title-error"`
- Error message: `<p id="title-error" role="alert">Title is required</p>`

**Content Field:**
- Auto-populated from conversation (read-only initially)
- Editable
- Required: `aria-required="true"`
- Error: `aria-invalid="true"` + `aria-describedby="content-error"`

**Tags Field:**
- Optional: No `aria-required`
- Format validation: Comma-separated
- Error: `aria-describedby="tags-error"` if invalid format

### Form-Level Announcements

**On submit attempt with errors:**
```html
<div role="alert" aria-live="assertive">
  Please correct 2 errors before submitting:
  <ul>
    <li>Title is required</li>
    <li>Content is too short</li>
  </ul>
</div>
```

**On successful submit:**
```html
<div role="status" aria-live="polite">
  Thread created successfully. Redirecting...
</div>
```

---

## Testing Requirements

### Manual Testing

1. **Keyboard Navigation**
   - [ ] Tab through entire flow without mouse
   - [ ] Shift+Tab reverses focus order
   - [ ] Enter/Space activates button
   - [ ] Escape closes modal
   - [ ] No focus traps (except intentional modal trap)

2. **Screen Reader**
   - [ ] All content announced correctly (VoiceOver, NVDA)
   - [ ] Button state changes announced
   - [ ] Form labels read correctly
   - [ ] Errors announced immediately
   - [ ] Loading states announced

3. **Visual**
   - [ ] Focus indicators visible on all elements
   - [ ] Contrast meets 4.5:1 for text, 3:1 for UI components
   - [ ] Layout doesn't break at 320px width
   - [ ] No horizontal scrolling at 400% zoom

4. **Touch**
   - [ ] All interactive elements at least 44x44px
   - [ ] No accidental activations
   - [ ] Tap targets don't overlap

### Automated Testing Tools

1. **axe DevTools**: Run on FloatingQuokka and modal
2. **Lighthouse**: Accessibility score >95
3. **WAVE**: No errors, check warnings
4. **Color Contrast Analyzer**: Verify all text/UI elements

---

## Compliance Gaps Identified

### Critical (Blocking)
None identified in existing patterns. Feature will inherit compliant base.

### High Priority (Significant Barriers)
1. **Touch target size**: Icon buttons below 44x44px (L272, L284, L372)
2. **Error association**: Form validation errors need `aria-describedby`
3. **Status announcements**: Success/error states not announced to SR

### Medium Priority (Best Practice)
1. **Focus visible**: Explicit focus-visible styles for consistency
2. **Button order**: Consider Cancel → Post → Preview (primary action last)
3. **Close methods**: Ensure modal closable via Escape (Radix handles this)
4. **Reduced motion**: Respect `prefers-reduced-motion` for animations

---

## ARIA Patterns Reference

### Button (Conversation to Thread)
```html
<Button
  variant="glass-primary"
  size="default"
  onClick={handleOpenModal}
  disabled={messages.length < 2}
  aria-label="Post conversation as thread"
>
  <SendIcon className="h-4 w-4" />
  Post as Thread
</Button>
```

### Modal Dialog
```html
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <DialogHeader>
      <DialogTitle id="modal-title">
        Post Conversation as Thread
      </DialogTitle>
      <DialogDescription id="modal-description">
        Preview and edit your conversation before posting it as a public thread
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### Form Fields with Validation
```html
<div className="space-y-2">
  <label htmlFor="thread-title" className="text-sm font-semibold">
    Thread Title
    <span aria-label="required">*</span>
  </label>
  <Input
    id="thread-title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
    aria-required="true"
    aria-invalid={titleError ? "true" : "false"}
    aria-describedby={titleError ? "title-error" : undefined}
  />
  {titleError && (
    <p id="title-error" role="alert" className="text-sm text-danger">
      {titleError}
    </p>
  )}
</div>
```

### Loading/Status Announcements
```html
{isSubmitting && (
  <div role="status" aria-live="polite" className="sr-only">
    Creating thread, please wait...
  </div>
)}

{submitSuccess && (
  <div role="status" aria-live="polite" className="sr-only">
    Thread created successfully. Redirecting to thread page...
  </div>
)}

{submitError && (
  <div role="alert" aria-live="assertive" className="sr-only">
    Failed to create thread. Please try again.
  </div>
)}
```

---

## Compliance Summary

**Overall Assessment**: The existing codebase demonstrates **strong accessibility foundations** with proper use of semantic HTML, ARIA attributes, focus management, and screen reader support. The new feature can achieve **WCAG 2.2 Level AA compliance** by following established patterns and addressing identified gaps.

**Key Strengths:**
- Radix UI components with built-in a11y
- Comprehensive focus management
- Proper ARIA labeling and live regions
- Screen reader-only text for context
- Semantic dialog structure

**Priority Fixes:**
1. Touch target sizes (icon buttons to 44x44px)
2. Form error associations (`aria-describedby`, `aria-invalid`)
3. Status announcements for async operations
4. Focus-visible styles verification

**Estimated Compliance Level**: 95% after implementing recommendations

---

## Next Steps

See `plans/a11y-implementation.md` for detailed implementation checklist with specific code changes required.

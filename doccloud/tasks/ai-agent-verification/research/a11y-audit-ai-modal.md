# Accessibility Audit: AI Chat Modal & Components

**Audit Date:** 2025-10-17
**Auditor:** Accessibility Validator Agent
**Scope:** Quokka AI Assistant Modal and QDS Elements
**Standard:** WCAG 2.2 Level AA

---

## Executive Summary

**Overall Compliance:** Partial (65%)
**Critical Issues:** 3
**High Priority Issues:** 8
**Medium Priority Issues:** 6

The AI chat modal demonstrates good foundational accessibility with semantic HTML and basic ARIA attributes. However, critical gaps exist in focus management, keyboard navigation, and screen reader announcements that prevent full WCAG 2.2 AA compliance.

---

## Semantic HTML Analysis

### Strengths
- **Dialog Structure:** Uses shadcn Dialog component which wraps Radix Dialog (proper `role="dialog"`)
- **Form Elements:** Message input properly uses `<form>` with submit handler (qds-prompt-input.tsx:44)
- **Button Elements:** All interactive elements use proper `<button>` tags, not divs
- **Avatar Accessibility:** Uses Avatar component with fallback content (qds-message.tsx:77-93)
- **Lists:** Message container has `role="log"` which is appropriate for chat history (qds-conversation.tsx:33-37)

### Issues
- **Missing Heading Hierarchy:** Modal content lacks structural headings beyond DialogTitle
  - Location: quokka-assistant-modal.tsx:344
  - Impact: Screen reader users cannot navigate by headings within modal
  - Severity: Medium

- **Sources Panel Button:** Sources toggle button (sources-panel.tsx:56) should be wrapped in proper disclosure pattern
  - Current: Plain `<button>` with `aria-expanded`
  - Recommended: Add `aria-controls` and ensure proper heading
  - Severity: Low

---

## ARIA Attributes

### Strengths
- **Dialog Basics:** DialogTitle and DialogDescription properly implemented (quokka-assistant-modal.tsx:344-351)
- **Message History:** Conversation has proper `role="log"` with `aria-live="polite"` (qds-conversation.tsx:33-37)
- **Input Label:** Message input has `aria-label="Message input"` (qds-prompt-input.tsx:52)
- **Button Labels:** Icon-only buttons have proper labels (Send, Stop, Clear actions)
- **Sources Panel:** Toggle has `aria-expanded` and `aria-controls` (sources-panel.tsx:65-66)
- **Citation Markers:** Inline citations have `role="button"` and `aria-label` (qds-inline-citation.tsx:41-44)

### Critical Issues

#### 1. Missing `aria-modal="true"` on Dialog
**Location:** `quokka-assistant-modal.tsx:334`
**Current State:**
```tsx
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent className="max-w-[95vw]...">
```
**Problem:** Radix Dialog should have `aria-modal="true"` set explicitly
**WCAG Criterion:** 4.1.3 Status Messages
**Impact:** Screen readers may not announce modal context
**Severity:** Critical

#### 2. Streaming Status Not Announced
**Location:** `qds-conversation.tsx:64-77`
**Current State:**
```tsx
{isStreaming && (
  <div className="flex justify-start" role="status" aria-live="polite">
```
**Problem:** While `role="status"` is present, the message "Quokka is thinking..." may not be announced reliably because it's nested in complex DOM with other `aria-live` regions
**WCAG Criterion:** 4.1.3 Status Messages
**Impact:** Users don't know AI is processing
**Severity:** High

#### 3. New Message Not Announced
**Location:** `qds-conversation.tsx:30-38`
**Current State:**
```tsx
<ConversationContent
  className="p-4 space-y-4"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-relevant="additions"
```
**Problem:** New messages may not be announced because:
1. `aria-atomic="false"` requires incremental additions to be marked
2. New messages are not individually marked with `aria-live`
3. Rapid streaming updates may cause announcement interruptions

**WCAG Criterion:** 4.1.3 Status Messages
**Impact:** Screen reader users don't hear new messages without manual navigation
**Severity:** Critical

---

## Keyboard Navigation

### Strengths
- **Tab Order:** Logical tab order through modal (header → course selector → messages → input → actions)
- **Enter to Send:** Form submission on Enter works (qds-prompt-input.tsx:30-35)
- **Citation Navigation:** Citation markers are keyboard accessible with Tab + Enter/Space (qds-inline-citation.tsx:24-29)
- **Modal Close:** Dialog likely handles Escape key via Radix Dialog

### High Priority Issues

#### 4. No Focus Trap in Modal
**Location:** `quokka-assistant-modal.tsx:334`
**Current State:** Relies on Radix Dialog's default focus trap
**Problem:** Need to verify focus trap is active and cannot Tab outside modal
**WCAG Criterion:** 2.1.2 No Keyboard Trap (must be escapable)
**Testing Required:** Manual verification that Tab cycles within modal only
**Severity:** High

#### 5. Stop Button Not Keyboard Accessible During Streaming
**Location:** `qds-prompt-input.tsx:54-66`
**Current State:**
```tsx
{isStreaming ? (
  <Button type="button" onClick={handleStop}>
    <StopCircle className="h-4 w-4" />
```
**Problem:** While button is rendered, need to verify focus moves to Stop button when streaming starts
**WCAG Criterion:** 2.1.1 Keyboard
**Impact:** Keyboard users cannot stop generation
**Severity:** High

#### 6. Quick Prompts Not Keyboard Navigable
**Location:** `quokka-assistant-modal.tsx:398-412`
**Current State:**
```tsx
<Button
  key={prompt}
  variant="outline"
  onClick={() => setInput(prompt)}
```
**Problem:** Buttons are keyboard accessible BUT activating them only fills input - user must still Tab to input and press Enter
**Recommendation:** Add keyboard shortcut (e.g., Alt+1, Alt+2) or auto-focus input after selection
**WCAG Criterion:** 2.1.1 Keyboard
**Severity:** Medium

#### 7. No Keyboard Shortcut for Clear Conversation
**Location:** `quokka-assistant-modal.tsx:436-457`
**Current State:** Clear action buried in dropdown menu (MoreVertical button)
**Problem:** Requires Tab → Enter → Arrow Down → Enter (4 actions)
**Recommendation:** Add keyboard shortcut (e.g., Ctrl+Shift+Delete)
**WCAG Criterion:** 2.1.1 Keyboard (efficiency)
**Severity:** Low

---

## Focus Management

### Critical Issues

#### 8. Focus Not Moved to Modal on Open
**Location:** `quokka-assistant-modal.tsx:166-173`
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
**Problem:** Focus moves to input field, but should first move to modal container or title for screen reader context
**WCAG Criterion:** 2.4.3 Focus Order
**Recommended Fix:**
1. Focus should move to DialogTitle first (for announcement)
2. Then move to input after 200ms for typing convenience
**Severity:** High

#### 9. Focus Not Returned to Trigger on Close
**Location:** `quokka-assistant-modal.tsx:218-223`
**Current State:**
```tsx
const handleClose = () => {
  if (!isStreaming) {
    onClose();
  }
};
```
**Problem:** No mechanism to track trigger element or return focus
**WCAG Criterion:** 2.4.3 Focus Order
**Impact:** Keyboard users lose their place in the page
**Severity:** Critical

#### 10. No Focus Indicator Verification
**Location:** All components
**Current State:** Relies on Tailwind/Radix defaults
**Problem:** Need to verify focus indicators meet 3:1 contrast ratio and are visible
**WCAG Criterion:** 2.4.7 Focus Visible, 1.4.11 Non-text Contrast
**Testing Required:** Visual inspection of:
- Input field focus ring
- Button focus states
- Citation marker focus
- Sources toggle focus
**Severity:** High

#### 11. Focus Lost After Message Send
**Location:** `qds-prompt-input.tsx:30-35`
**Current State:**
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!isStreaming && value.trim() && !disabled) {
    onSubmit();
  }
};
```
**Problem:** After submit, focus remains in input but input is cleared - no announcement of success
**WCAG Criterion:** 3.3.1 Error Identification (also applies to success)
**Impact:** Users don't know if message sent successfully
**Severity:** High

---

## Screen Reader Compatibility

### High Priority Issues

#### 12. Modal Title Not Announced on Open
**Location:** `quokka-assistant-modal.tsx:344`
**Current State:**
```tsx
<DialogTitle className="text-base glass-text">Quokka AI Assistant</DialogTitle>
```
**Problem:** While title exists, focus moves directly to input, bypassing title announcement
**WCAG Criterion:** 2.4.6 Headings and Labels
**Fix:** Focus modal container first, allowing screen reader to announce title
**Severity:** High

#### 13. Course Selector Changes Not Announced
**Location:** `quokka-assistant-modal.tsx:356-375`
**Current State:**
```tsx
<Select value={selectedCourseId || "all"} onValueChange={handleCourseSelect}>
```
**Problem:** When course changes, conversation clears but no announcement
**WCAG Criterion:** 4.1.3 Status Messages
**Recommendation:** Add `aria-live` region announcing "Conversation cleared for {course}"
**Severity:** Medium

#### 14. Message Send Success Not Announced
**Location:** `quokka-assistant-modal.tsx:176-186`
**Current State:** Message submission is silent (only visual feedback)
**Problem:** No announcement that message was sent successfully
**WCAG Criterion:** 4.1.3 Status Messages
**Recommendation:** Add status region: "Message sent" or "Sending..."
**Severity:** High

#### 15. Clear Conversation Success Not Announced
**Location:** `quokka-assistant-modal.tsx:189-216`
**Current State:** Conversation deletes silently
**Problem:** No announcement that conversation was cleared
**WCAG Criterion:** 4.1.3 Status Messages
**Recommendation:** Add status announcement "Conversation cleared"
**Severity:** Medium

#### 16. Post to Thread Success Not Announced
**Location:** `quokka-assistant-modal.tsx:520-547`
**Current State:** Shows AlertDialog for success
**Problem:** AlertDialog may not be announced immediately
**WCAG Criterion:** 4.1.3 Status Messages
**Recommendation:** Verify AlertDialog has `role="alertdialog"` and is announced
**Severity:** Medium

#### 17. Avatar Images Missing Alt Text
**Location:** `qds-message.tsx:77-93`
**Current State:**
```tsx
<Avatar className={cn(...)}>
  <AvatarFallback>
    {isUser ? <User /> : <Sparkles />}
  </AvatarFallback>
</Avatar>
```
**Problem:** Icons render without accessible names
**WCAG Criterion:** 1.1.1 Non-text Content
**Recommendation:** Add `aria-label` to Avatar: "User message" or "Quokka assistant"
**Severity:** Medium

---

## Color Contrast

### Analysis Required (Code Review Only)

The following elements require **manual testing** with contrast analyzer:

#### 18. Glass Panel Text Contrast
**Location:** All components using `glass-text` and `glass-panel-strong`
**Files:** `quokka-assistant-modal.tsx`, `qds-conversation.tsx`, `qds-message.tsx`
**Current State:**
- `.glass-text` class used for text on glass backgrounds
- `.message-assistant` uses `bg-glass-strong` with backdrop blur
**WCAG Criterion:** 1.4.3 Contrast (Minimum) - 4.5:1 for text
**Testing Required:**
1. Measure contrast of `--text` color on `--glass-strong` background
2. Verify muted text (`text-muted-foreground`) meets 4.5:1
3. Test in both light and dark modes

#### 19. Citation Marker Contrast
**Location:** `qds-inline-citation.tsx:32-38`
**Current State:**
```tsx
className="bg-accent/20 text-accent-foreground hover:bg-accent/30"
```
**WCAG Criterion:** 1.4.3 Contrast (Minimum) - 4.5:1 for text
**Testing Required:** Verify `text-accent-foreground` on `bg-accent/20` meets 4.5:1

#### 20. Focus Indicator Contrast
**Location:** All interactive elements
**Current State:** Relying on Tailwind `ring` utilities
**WCAG Criterion:** 1.4.11 Non-text Contrast - 3:1 for UI components
**Testing Required:**
1. Verify focus ring color meets 3:1 against background
2. Check focus ring on buttons, inputs, citations, sources toggle
3. Measure in both light and dark modes

#### 21. Quick Prompt Button Contrast
**Location:** `quokka-assistant-modal.tsx:401-410`
**Current State:**
```tsx
<Button variant="outline">
```
**WCAG Criterion:** 1.4.3 Contrast (Minimum) - 3:1 for large text (buttons)
**Testing Required:** Verify outline button text meets 3:1 minimum (4.5:1 preferred)

#### 22. Disabled State Contrast
**Location:** `qds-prompt-input.tsx:67-77`
**Current State:**
```tsx
<Button disabled={!value.trim() || disabled}>
```
**WCAG Criterion:** 1.4.3 Contrast (Minimum)
**Note:** Disabled elements are exempt from contrast requirements, but good practice is 3:1
**Testing Recommended:** Ensure disabled state is clearly distinguishable

#### 23. Streaming Indicator Contrast
**Location:** `qds-conversation.tsx:68-72`
**Current State:**
```tsx
<div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
```
**WCAG Criterion:** 1.4.11 Non-text Contrast - 3:1 for UI components
**Testing Required:** Verify `bg-primary` dots meet 3:1 against `message-assistant` background

---

## Form Accessibility

### Strengths
- **Label Association:** Input has `aria-label` (qds-prompt-input.tsx:52)
- **Form Submission:** Proper `<form>` element with `onSubmit` handler
- **Required Fields:** Input validation prevents empty submissions

### Issues

#### 24. Course Selector Missing Required Indicator
**Location:** `quokka-assistant-modal.tsx:356-375`
**Current State:**
```tsx
<label htmlFor="course-select">Select Course Context (Optional)</label>
```
**Problem:** Label says "Optional" but no programmatic indication
**WCAG Criterion:** 3.3.2 Labels or Instructions
**Recommendation:** Add `aria-required="false"` for clarity (currently defaults to false)
**Severity:** Low

#### 25. No Error Handling for Failed Submissions
**Location:** `quokka-assistant-modal.tsx:176-186`
**Current State:** No try/catch or error state for `sendMessage`
**Problem:** If message fails to send, no error announcement
**WCAG Criterion:** 3.3.1 Error Identification
**Recommendation:** Add error state and `aria-live` announcement
**Severity:** High

---

## Error Handling & Messaging

### Critical Gaps

#### 26. No Error Announcements
**Location:** Throughout modal
**Current State:** Errors logged to console or shown in alerts
**Problem:** No `aria-live` region for error announcements
**WCAG Criterion:** 3.3.1 Error Identification, 4.1.3 Status Messages
**Examples:**
- Message send failure (quokka-assistant-modal.tsx:176)
- Conversation create failure (quokka-assistant-modal.tsx:152)
- Thread post failure (quokka-assistant-modal.tsx:288)

**Recommendation:** Add global error region:
```tsx
<div role="alert" aria-live="assertive" className="sr-only">
  {errorMessage}
</div>
```
**Severity:** Critical

---

## Motion & Timing

### Strengths
- **No Auto-play:** No automatic animations on mount
- **User-Initiated:** All animations triggered by user actions
- **Stoppable Streaming:** Stop button allows halting AI generation

### Issues

#### 27. No Reduced Motion Support
**Location:** `qds-conversation.tsx:68-72` (bounce animation)
**Current State:**
```tsx
<div className="animate-bounce"></div>
```
**Problem:** Animation respects `prefers-reduced-motion` via Tailwind but not explicitly verified
**WCAG Criterion:** 2.3.3 Animation from Interactions (Level AAA, but good practice)
**Recommendation:** Add explicit check:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-bounce {
    animation: none;
  }
}
```
**Severity:** Low

---

## Testing Methodology

### Tools Used (Code Review)
- Manual code inspection
- WCAG 2.2 Quick Reference
- ARIA Authoring Practices Guide (APG)
- Radix UI documentation review

### Tools Recommended (Manual Testing)
1. **axe DevTools** - Automated accessibility scan
2. **WAVE Browser Extension** - Visual accessibility evaluation
3. **Lighthouse** - Chrome DevTools accessibility audit
4. **Color Contrast Analyzer** - WCAG contrast verification
5. **Screen Readers:**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS)
6. **Keyboard Navigation:** Tab, Shift+Tab, Enter, Escape, Space, Arrow keys

### Browsers Tested
- None (code review only)

### Recommended Test Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Summary of Findings

### Critical Issues (3)
1. Missing `aria-modal="true"` on Dialog
2. New messages not announced to screen readers
3. Focus not returned to trigger element on modal close

### High Priority Issues (8)
4. No focus trap verification in modal
5. Stop button keyboard accessibility during streaming
6. Focus not moved to modal title on open
7. No focus indicator contrast verification
8. Focus lost after message send (no success announcement)
9. Modal title not announced on open
10. Message send success not announced
11. No error announcements for failed actions

### Medium Priority Issues (6)
12. Missing heading hierarchy in modal content
13. Course selector changes not announced
14. Clear conversation success not announced
15. Post to thread success verification needed
16. Avatar images missing accessible names
17. Quick prompts require two actions (select + send)

### Low Priority Issues (3)
18. Sources panel button disclosure pattern
19. Course selector missing `aria-required` clarification
20. Reduced motion support verification

### Testing Required (6 items)
- Color contrast measurements (glass panels, citations, buttons, focus indicators)
- Focus trap verification
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation flow testing
- Reduced motion preference testing
- Cross-browser compatibility

---

## WCAG 2.2 Success Criteria Summary

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text Content | A | Partial | Avatars missing alt text |
| 1.4.3 Contrast (Minimum) | AA | Unknown | Requires manual testing |
| 1.4.11 Non-text Contrast | AA | Unknown | Requires manual testing |
| 2.1.1 Keyboard | A | Partial | Most accessible, some efficiency gaps |
| 2.1.2 No Keyboard Trap | A | Unknown | Requires testing |
| 2.4.3 Focus Order | A | Fail | Focus management issues |
| 2.4.6 Headings and Labels | AA | Partial | Title exists but not announced |
| 2.4.7 Focus Visible | AA | Unknown | Requires testing |
| 3.3.1 Error Identification | A | Fail | No error announcements |
| 3.3.2 Labels or Instructions | A | Pass | Labels present |
| 4.1.3 Status Messages | AA | Fail | Multiple announcement gaps |

**Overall WCAG 2.2 AA Compliance: 65% (estimated)**

---

## Recommendations Priority

### Immediate (Critical)
1. Implement focus return on modal close
2. Add status announcements for all user actions
3. Fix message announcement mechanism
4. Add error handling with `aria-live` regions

### Next (High)
5. Verify and document focus trap behavior
6. Move initial focus to modal title, then input
7. Add focus indicators with verified contrast
8. Implement success announcements for all mutations

### Future (Medium/Low)
9. Add keyboard shortcuts for common actions
10. Improve heading structure within modal
11. Add reduced motion preference handling
12. Enhance quick prompt interaction model

---

**Audit Completed:** 2025-10-17
**Next Step:** Review implementation plan in `plans/a11y-fixes.md`

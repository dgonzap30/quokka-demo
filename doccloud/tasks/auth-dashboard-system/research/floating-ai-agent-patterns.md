# Floating AI Agent Patterns Research

**Date:** 2025-10-04
**Task:** Design floating Quokka AI agent for course context
**Agent:** Component Architect

---

## 1. Existing Codebase Patterns

### Current AI Chat Implementation

**File:** `/app/quokka/page.tsx`

**Key patterns identified:**
- **Message state management:** Uses `useState<Message[]>` with `{id, role, content, timestamp}`
- **AI response logic:** Keyword-based `getAIResponse()` function in component
- **UI patterns:**
  - Glass card styling (`variant="glass-strong"`)
  - Message bubbles (`.message-user` and `.message-assistant` utility classes)
  - Quick prompts (button array shown on initial load)
  - Auto-scroll to bottom on message change
  - Thinking state with animated emoji
- **Auth integration:** Redirects to `/login` if `!user`

### Existing Dialog/Modal Patterns

**File:** `/components/ui/dialog.tsx` (Radix UI Dialog)

**Available components:**
- `Dialog` (root wrapper)
- `DialogTrigger` (button to open)
- `DialogPortal` (portal for positioning)
- `DialogOverlay` (backdrop with `bg-black/50`)
- `DialogContent` (main content area)
- `DialogClose` (close button with X icon)
- `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

**Default positioning:**
- Centered modal (`top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]`)
- Fixed z-index: `z-50`
- Animations: `fade-in-0`, `zoom-in-95` on open
- No support for corner positioning out-of-box

### Glass Styling System

**File:** `/app/globals.css`

**Glass tokens available:**
- `--glass-ultra`: rgba(255, 255, 255, 0.4)
- `--glass-strong`: rgba(255, 255, 255, 0.6)
- `--glass-medium`: rgba(255, 255, 255, 0.7)
- `--glass-subtle`: rgba(255, 255, 255, 0.85)
- `--blur-md`: 12px, `--blur-lg`: 16px, `--blur-xl`: 24px
- `--border-glass`: rgba(255, 255, 255, 0.18)
- `--shadow-glass-sm/md/lg`: Soft diffuse shadows

**Utility classes:**
- `.glass-panel` (blur-md + glass-medium)
- `.glass-panel-strong` (blur-lg + glass-strong)
- `.message-user` (accent background, glass effect)
- `.message-assistant` (glass-strong background)

### Course Detail Page Integration

**File:** `/app/courses/[courseId]/page.tsx`

**Current structure:**
- Breadcrumb navigation
- Course hero section
- Discussion threads list
- "Ask Question" button (links to `/ask?courseId=${courseId}`)

**Integration opportunities:**
- Course context available: `courseId`, `course.name`, `course.code`
- User context: `useCurrentUser()` hook
- No existing floating components
- Bottom-right corner is free real estate

### Button Variants

**File:** `/components/ui/button.tsx`

**Available variants:**
- `glass-primary`, `glass-secondary`, `glass-accent`, `glass` (all with backdrop-blur)
- `ai`, `ai-outline` (purple AI branding)
- Icon button size: `size-10` (40x40px - meets 44px touch target with padding)

---

## 2. Floating Widget UX Patterns

### Positioning Strategy

**Bottom-right corner (recommended):**
- Standard placement for chat widgets (Intercom, Drift, Zendesk)
- Non-intrusive, doesn't block main content
- Easy reach on desktop and mobile (right thumb zone)
- Fixed position: `fixed bottom-6 right-6 md:bottom-8 md:right-8`

**Z-index hierarchy:**
- Floating button: `z-50` (same as dialogs)
- Expanded chat window: `z-50` (dialog level)
- Overlay (optional): `z-40` (below chat)

### State Management

**Three states required:**
1. **Hidden:** Component unmounted or `display: none`
2. **Minimized:** Small circular button (56x56px for 44px+ touch target)
3. **Expanded:** Full chat window (350x500px desktop, full-screen mobile)

**State transitions:**
- Hidden → Minimized: User navigates to course page
- Minimized → Expanded: Click/tap button
- Expanded → Minimized: Click close button or outside overlay
- Expanded → Hidden: User dismisses permanently (localStorage flag)

**Persistence strategy:**
- Use `localStorage` to remember:
  - `quokka-minimized` (boolean): Was it minimized vs expanded
  - `quokka-dismissed` (boolean): Did user permanently dismiss it
  - `quokka-session-messages` (array): Message history per session (not persisted across page loads)

### Responsive Behavior

**Desktop (≥768px):**
- Minimized: 56x56px circular button, bottom-right
- Expanded: 350x500px chat window, bottom-right
- Positioning: `fixed bottom-8 right-8`

**Mobile (<768px):**
- Minimized: 56x56px circular button, bottom-right
- Expanded: Full-screen overlay (`inset-0` with top margin for status bar)
- Slide up from bottom animation
- Close button in top-right of overlay

---

## 3. Accessibility Requirements (WCAG 2.2 AA)

### Keyboard Navigation

**Required keyboard support:**
- `Tab`: Navigate to minimized button, then through chat elements
- `Shift+Tab`: Reverse navigation
- `Enter`/`Space`: Activate buttons (open chat, send message)
- `Escape`: Close chat window (return to minimized state)
- Arrow keys: Navigate quick prompt buttons

**Focus management:**
- When expanded: Focus trap inside chat window
- First focus: Input field
- On close: Return focus to trigger button
- Visible focus ring: Use QDS `focus-visible:ring-ring`

### ARIA Attributes

**Minimized button:**
```tsx
<button
  aria-label="Open Quokka AI Assistant"
  aria-expanded={isExpanded}
  aria-controls="quokka-chat-window"
  aria-haspopup="dialog"
>
```

**Expanded chat window:**
```tsx
<div
  id="quokka-chat-window"
  role="dialog"
  aria-modal="true"
  aria-labelledby="quokka-chat-title"
  aria-describedby="quokka-chat-description"
>
  <h2 id="quokka-chat-title">Quokka AI Assistant</h2>
  <p id="quokka-chat-description">Course-specific AI help for {course.name}</p>
</div>
```

**Live region for AI responses:**
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {latestMessage}
</div>
```

### Color Contrast

**Ensure 4.5:1 minimum:**
- Minimized button: Primary color on white background ✓
- Text in chat: `text-foreground` on glass backgrounds
- Message bubbles: `.message-user` (accent) and `.message-assistant` (glass-strong) already compliant
- Focus indicators: Visible on all interactive elements

### Touch Targets

**Minimum 44x44px:**
- Minimized button: 56x56px ✓
- Close button: 44x44px ✓
- Send button: 44x44px (use `size="lg"` for h-11) ✓
- Quick prompt buttons: `h-10` (40px) + padding = 44px+ ✓

---

## 4. Animation & Transition Patterns

### QDS-Compliant Animations

**Guiding principles:**
- Subtle, purposeful motion
- Duration: 200-300ms (fast enough to feel instant)
- Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` (standard QDS)

**Minimized button:**
- Entrance: Fade in + scale from 0.9 to 1 (250ms)
- Hover: Scale 1.05, shadow glow (150ms)
- Active/click: Scale 0.95 (100ms)

**Expanded chat window:**
- Desktop: Slide up + fade in from bottom-right (300ms)
- Mobile: Slide up from bottom (300ms)
- Exit: Fade out + scale down to 0.95 (200ms)

**Message animations:**
- New message: Fade in + slight slide up (200ms)
- Thinking indicator: Pulsing opacity (600ms infinite)

**CSS implementation:**
```css
.quokka-float-enter {
  animation: quokka-float-in 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

@keyframes quokka-float-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.quokka-chat-expand {
  animation: quokka-expand 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

@keyframes quokka-expand {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Reduced Motion Support

**Respect user preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  .quokka-float-enter,
  .quokka-chat-expand {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 5. Course Context Awareness

### Course-Specific Data

**Available context from page:**
- `courseId`: From URL param
- `course.name`: "Data Structures & Algorithms"
- `course.code`: "CS201"
- `course.description`: Full course description

**Pass to AI prompts:**
- Prepend course context to user questions:
  ```typescript
  const contextualPrompt = `[Course: ${course.code} - ${course.name}]\n${userQuestion}`;
  const response = getAIResponse(contextualPrompt, courseId);
  ```

### Course-Specific Quick Prompts

**Dynamic prompts based on course:**
- CS courses: "Explain Big O notation", "What is binary search?"
- Math courses: "How do I solve integrals?", "Explain derivatives"
- General: "Summarize this week's material", "Practice problems for exam"

**Implementation:**
```typescript
const getQuickPrompts = (courseCode: string) => {
  if (courseCode.startsWith('CS')) {
    return [
      "What is binary search?",
      "Explain Big O notation",
      "Help with recursion",
    ];
  }
  if (courseCode.startsWith('MATH')) {
    return [
      "Integration techniques",
      "Derivative rules",
      "Practice problems",
    ];
  }
  return [
    "Summarize key concepts",
    "Study tips",
    "Exam preparation",
  ];
};
```

---

## 6. Mobile Responsive Strategy

### Mobile (<768px)

**Minimized state:**
- Same as desktop: 56x56px button, `bottom-6 right-6`
- Larger touch target on mobile (consider 64x64px)

**Expanded state:**
- Full-screen overlay: `fixed inset-0 z-50`
- Safe area insets for notched devices:
  ```css
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  ```
- Header with close button (top-right)
- Input pinned to bottom (above keyboard)

**Keyboard handling:**
- Input field: `inputmode="text"` for better mobile keyboard
- Send on Enter (desktop) vs explicit button tap (mobile)
- Scroll to bottom when keyboard opens

### Tablet (768px-1024px)

**Use desktop layout:**
- 350x500px chat window, bottom-right
- Ensure it doesn't overlap with content on narrow screens

---

## 7. Performance Considerations

### Render Optimization

**Lazy loading:**
- Don't render chat window until first expansion
- Use dynamic import for heavy components

**Memoization:**
- `React.memo` for message components (pure renders)
- `useMemo` for filtered/sorted messages
- `useCallback` for event handlers passed to children

**Scroll performance:**
- Use `useRef` for messages container
- `scrollIntoView({ behavior: 'smooth' })` debounced

### Bundle Size

**Code splitting opportunity:**
- Split AI response logic into separate file
- Lazy load when chat first opens
- Estimated size: ~5KB (chat logic) + ~2KB (animations)

---

## 8. Interaction Flow

### User Journey

1. **User lands on course page:**
   - Floating button fades in after 500ms delay (non-intrusive)
   - Shows pulse animation for 3s (first visit only)

2. **User clicks floating button:**
   - Chat window expands from bottom-right
   - Welcome message appears: "Hi! I'm Quokka, your AI assistant for [Course Name]. How can I help?"
   - Quick prompts shown if no message history

3. **User types question:**
   - Input field has placeholder: "Ask about [Course Name]..."
   - Send button enabled when input has text
   - Press Enter or click Send

4. **AI responds:**
   - "Quokka is thinking..." indicator (1-2s)
   - Response appears with course-specific context
   - Scroll to bottom smoothly

5. **User closes chat:**
   - Click X button or press Escape
   - Chat window collapses to minimized button
   - Message history preserved in session

6. **User dismisses permanently (optional):**
   - Right-click → "Dismiss Quokka"
   - `localStorage` flag set
   - Button hidden until page refresh or manual re-enable

---

## 9. Competitor Analysis

### Intercom Pattern
- Bottom-right bubble, expands upward
- Pulse animation on first load
- Message counter badge
- **Takeaway:** Use pulse animation sparingly, only for first visit

### Drift Pattern
- Larger initial button with text "Need help?"
- Collapses to icon after 5s
- **Takeaway:** Consider brief text label on first appearance

### Zendesk Widget
- Expandable to side panel (not full chat)
- Multiple state sizes (minimized, medium, large)
- **Takeaway:** Keep it simple - just minimized and expanded

---

## 10. Risk Assessment

### Potential Issues

1. **Z-index conflicts:**
   - Ensure floating button doesn't block navigation
   - Test with modals/dropdowns open

2. **Mobile viewport issues:**
   - Input field hidden by keyboard
   - Safe area insets on iPhone X+
   - Landscape mode overflow

3. **Accessibility barriers:**
   - Focus trap not releasing on Escape
   - Screen reader not announcing AI responses
   - Keyboard users can't reach close button

4. **Performance:**
   - Re-rendering on every message
   - Scroll jank with many messages
   - Animation lag on low-end devices

### Mitigation Strategies

1. **Z-index:** Use CSS custom properties for layering
2. **Mobile:** Test on real devices, use `visualViewport` API
3. **Accessibility:** Thorough keyboard/screen reader testing
4. **Performance:** Memoization, virtualized lists (if >50 messages)

---

## Key Findings Summary

1. **Reuse existing patterns:**
   - Message state management from `/app/quokka/page.tsx`
   - Glass styling system (`.glass-panel-strong`)
   - Dialog primitives from Radix UI (customize positioning)

2. **Custom components needed:**
   - `FloatingQuokka` (main container with state)
   - `QuokkaButton` (minimized circular button)
   - `QuokkaChatWindow` (expanded chat UI)

3. **Accessibility is critical:**
   - Focus trap, ARIA labels, keyboard nav
   - Live regions for AI responses
   - Escape key to close

4. **Mobile-first approach:**
   - Full-screen on small devices
   - Fixed bottom-right on desktop
   - Safe area insets for notched phones

5. **Course context integration:**
   - Pass `courseId` to AI prompts
   - Dynamic quick prompts per course type
   - Welcome message includes course name

6. **Performance optimizations:**
   - Lazy load chat window
   - Memoize message components
   - Debounce scroll events

---

**Next Steps:**
1. Design TypeScript interfaces for props and state
2. Plan component hierarchy and file structure
3. Define integration points with course detail page
4. Create step-by-step implementation plan

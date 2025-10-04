# Floating Quokka AI Agent - Component Design Plan

**Date:** 2025-10-04
**Task:** Design floating AI assistant for course context
**Agent:** Component Architect

---

## 1. Component Hierarchy

```
components/course/
├── floating-quokka.tsx          # Main container (state + logic)
├── quokka-button.tsx            # Minimized circular button
└── quokka-chat-window.tsx       # Expanded chat interface
```

**Parent-child relationships:**
```
FloatingQuokka (stateful container)
├── QuokkaButton (when minimized)
└── QuokkaChatWindow (when expanded)
    ├── ChatHeader (title + close button)
    ├── MessageList (scrollable messages)
    ├── QuickPrompts (initial state only)
    └── ChatInput (input + send button)
```

---

## 2. TypeScript Interfaces

### Core Types

```typescript
// components/course/types.ts

/**
 * Quokka chat message
 */
export interface QuokkaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Quokka floating widget state
 */
export type QuokkaState = 'hidden' | 'minimized' | 'expanded';

/**
 * Props for FloatingQuokka main component
 */
export interface FloatingQuokkaProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  className?: string;
}

/**
 * Props for QuokkaButton (minimized state)
 */
export interface QuokkaButtonProps {
  onClick: () => void;
  'aria-expanded': boolean;
  className?: string;
  showPulse?: boolean; // First-visit indicator
}

/**
 * Props for QuokkaChatWindow (expanded state)
 */
export interface QuokkaChatWindowProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  messages: QuokkaMessage[];
  isThinking: boolean;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  className?: string;
}

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
  className?: string;
}

/**
 * Props for QuickPrompts component
 */
export interface QuickPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  messages: QuokkaMessage[];
  isThinking: boolean;
  className?: string;
}

/**
 * Local storage keys for persistence
 */
export const QUOKKA_STORAGE_KEYS = {
  STATE: 'quokka-state', // 'minimized' | 'expanded'
  DISMISSED: 'quokka-dismissed', // boolean
  FIRST_VISIT: 'quokka-first-visit', // boolean (for pulse animation)
} as const;
```

---

## 3. Component Implementations

### 3.1 FloatingQuokka (Main Container)

**File:** `/components/course/floating-quokka.tsx`

**Responsibilities:**
- Manage widget state (minimized/expanded/hidden)
- Handle message history (session-scoped, not persisted)
- Integrate AI response logic
- Persist state to localStorage
- Provide course context to AI

**State management:**
```typescript
const [state, setState] = useState<QuokkaState>('minimized');
const [messages, setMessages] = useState<QuokkaMessage[]>([welcomeMessage]);
const [input, setInput] = useState('');
const [isThinking, setIsThinking] = useState(false);
const [showPulse, setShowPulse] = useState(false);
```

**Key methods:**
```typescript
// Toggle between minimized and expanded
const toggleExpanded = () => {
  setState(prev => prev === 'expanded' ? 'minimized' : 'expanded');
  localStorage.setItem(QUOKKA_STORAGE_KEYS.STATE, state);
};

// Send message and get AI response
const handleSendMessage = async (content: string) => {
  // Add user message
  const userMessage = { id: uuid(), role: 'user', content, timestamp: new Date() };
  setMessages(prev => [...prev, userMessage]);

  // Show thinking indicator
  setIsThinking(true);

  // Get AI response with course context
  await simulateDelay(1000);
  const contextualPrompt = `[Course: ${courseCode} - ${courseName}]\n${content}`;
  const responseContent = getAIResponse(contextualPrompt, courseId);

  const aiMessage = { id: uuid(), role: 'assistant', content: responseContent, timestamp: new Date() };
  setMessages(prev => [...prev, aiMessage]);
  setIsThinking(false);
};

// Check first visit for pulse animation
useEffect(() => {
  const isFirstVisit = !localStorage.getItem(QUOKKA_STORAGE_KEYS.FIRST_VISIT);
  if (isFirstVisit) {
    setShowPulse(true);
    setTimeout(() => setShowPulse(false), 3000); // Pulse for 3s
    localStorage.setItem(QUOKKA_STORAGE_KEYS.FIRST_VISIT, 'true');
  }

  // Restore previous state
  const savedState = localStorage.getItem(QUOKKA_STORAGE_KEYS.STATE) as QuokkaState;
  if (savedState) setState(savedState);
}, []);

// Handle dismiss (hide permanently)
const handleDismiss = () => {
  setState('hidden');
  localStorage.setItem(QUOKKA_STORAGE_KEYS.DISMISSED, 'true');
};
```

**Render logic:**
```typescript
if (state === 'hidden') return null;

return (
  <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
    {state === 'minimized' ? (
      <QuokkaButton
        onClick={toggleExpanded}
        aria-expanded={false}
        showPulse={showPulse}
      />
    ) : (
      <QuokkaChatWindow
        courseId={courseId}
        courseName={courseName}
        courseCode={courseCode}
        messages={messages}
        isThinking={isThinking}
        onSendMessage={handleSendMessage}
        onClose={toggleExpanded}
      />
    )}
  </div>
);
```

---

### 3.2 QuokkaButton (Minimized State)

**File:** `/components/course/quokka-button.tsx`

**Responsibilities:**
- Render circular button with Quokka icon
- Show pulse animation on first visit
- Handle click to expand

**Props interface:**
```typescript
interface QuokkaButtonProps {
  onClick: () => void;
  'aria-expanded': boolean;
  className?: string;
  showPulse?: boolean;
}
```

**Implementation:**
```typescript
export function QuokkaButton({
  onClick,
  'aria-expanded': ariaExpanded,
  className,
  showPulse = false
}: QuokkaButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Quokka AI Assistant"
      aria-expanded={ariaExpanded}
      aria-controls="quokka-chat-window"
      aria-haspopup="dialog"
      className={cn(
        "group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16",
        "rounded-full shadow-e3 transition-all duration-250",
        "glass-panel-strong hover:shadow-[var(--glow-primary)]",
        "hover:scale-105 active:scale-95",
        "focus-visible:ring-4 focus-visible:ring-ring/50",
        showPulse && "animate-pulse-glow",
        className
      )}
    >
      {/* Quokka Icon/Avatar */}
      <div className="text-2xl md:text-3xl">🦘</div>

      {/* Pulse ring animation (first visit only) */}
      {showPulse && (
        <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
      )}
    </button>
  );
}
```

**Accessibility:**
- 56x56px button (meets 44px touch target)
- ARIA labels for screen readers
- Focus visible ring
- Semantic button element

---

### 3.3 QuokkaChatWindow (Expanded State)

**File:** `/components/course/quokka-chat-window.tsx`

**Responsibilities:**
- Render chat interface (header, messages, input)
- Handle message display and scrolling
- Provide course-specific quick prompts
- Focus management and keyboard navigation

**Props interface:**
```typescript
interface QuokkaChatWindowProps {
  courseId: string;
  courseName: string;
  courseCode: string;
  messages: QuokkaMessage[];
  isThinking: boolean;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  className?: string;
}
```

**Implementation:**
```typescript
export function QuokkaChatWindow({
  courseId,
  courseName,
  courseCode,
  messages,
  isThinking,
  onSendMessage,
  onClose,
  className
}: QuokkaChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Course-specific quick prompts
  const quickPrompts = getQuickPrompts(courseCode);
  const showQuickPrompts = messages.length === 1; // Only show on welcome message

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div
      id="quokka-chat-window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quokka-chat-title"
      aria-describedby="quokka-chat-description"
      className={cn(
        // Desktop: Fixed window bottom-right
        "hidden md:flex md:flex-col",
        "md:w-[350px] md:h-[500px]",
        "md:rounded-2xl md:shadow-e3",
        // Mobile: Full-screen overlay
        "fixed inset-0 z-50 flex-col",
        "glass-panel-strong border border-[var(--border-glass)]",
        "animate-quokka-expand",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-glass)]">
        <div className="flex-1">
          <h2
            id="quokka-chat-title"
            className="heading-5 glass-text"
          >
            Quokka AI 🦘
          </h2>
          <p
            id="quokka-chat-description"
            className="text-sm text-muted-foreground mt-1"
          >
            {courseName}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "hover:bg-accent/10 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <MessageList messages={messages} isThinking={isThinking} />
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (initial state only) */}
      {showQuickPrompts && (
        <div className="px-4 md:px-6 pb-4">
          <QuickPrompts
            prompts={quickPrompts}
            onSelectPrompt={setInput}
          />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--border-glass)] p-4 md:p-6">
        <ChatInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isThinking}
          placeholder={`Ask about ${courseCode}...`}
        />
      </div>

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {messages[messages.length - 1]?.role === 'assistant'
          ? messages[messages.length - 1].content
          : null}
      </div>
    </div>
  );
}
```

**Accessibility features:**
- `role="dialog"` with `aria-modal="true"`
- Labeled with course name
- Focus trap (Escape to close)
- Live region for screen reader announcements
- Focus management (input focused on mount)

---

### 3.4 Supporting Sub-Components

#### MessageList Component

```typescript
// components/course/message-list.tsx

interface MessageListProps {
  messages: QuokkaMessage[];
  isThinking: boolean;
}

export function MessageList({ messages, isThinking }: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          <div
            className={cn(
              "max-w-[85%] p-4",
              message.role === 'user'
                ? 'message-user'
                : 'message-assistant'
            )}
          >
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <p className="text-xs text-subtle mt-2">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex justify-start">
          <div className="message-assistant p-4">
            <div className="flex items-center gap-2">
              <div className="animate-pulse">💭</div>
              <p className="text-sm">Quokka is thinking...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

#### ChatInput Component

```typescript
// components/course/chat-input.tsx

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, disabled, placeholder }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="flex gap-2"
      >
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-11"
          aria-label="Message input"
        />
        <Button
          type="submit"
          variant="glass-primary"
          size="lg"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    );
  }
);

ChatInput.displayName = 'ChatInput';
```

#### QuickPrompts Component

```typescript
// components/course/quick-prompts.tsx

interface QuickPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export function QuickPrompts({ prompts, onSelectPrompt }: QuickPromptsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Quick prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Helper Functions

### AI Response Logic (Course-Aware)

**File:** `/lib/ai/course-responses.ts`

```typescript
import type { QuokkaMessage } from '@/components/course/types';

/**
 * Get course-specific quick prompts
 */
export function getQuickPrompts(courseCode: string): string[] {
  if (courseCode.startsWith('CS')) {
    return [
      "What is binary search?",
      "Explain Big O notation",
      "Help with recursion",
      "Arrays vs Linked Lists"
    ];
  }

  if (courseCode.startsWith('MATH')) {
    return [
      "Integration techniques",
      "Derivative rules",
      "Practice problems",
      "Explain calculus basics"
    ];
  }

  // Default prompts
  return [
    "Summarize key concepts",
    "Study tips",
    "Exam preparation",
    "Practice problems"
  ];
}

/**
 * Generate AI response with course context
 * @param prompt - User's question with course context prepended
 * @param courseId - Current course ID
 */
export function getAIResponse(prompt: string, courseId: string): string {
  const q = prompt.toLowerCase();

  // Extract course info from prompt
  const courseMatch = prompt.match(/\[Course: (.*?)\]/);
  const courseName = courseMatch ? courseMatch[1] : '';

  // Course-aware responses
  if (q.includes('binary search')) {
    return `Binary search is an efficient algorithm for finding an item in a sorted array. It works by repeatedly dividing the search interval in half:\n\n1. Compare the target value to the middle element\n2. If equal, return the position\n3. If target is less, search the left half\n4. If target is greater, search the right half\n\nTime complexity: O(log n)\n\n**Important for ${courseName}:** The array must be sorted first!`;
  }

  if (q.includes('big o') || q.includes('complexity')) {
    return `**Big O Notation** measures algorithm efficiency:\n\n- O(1): Constant time\n- O(log n): Logarithmic (binary search)\n- O(n): Linear (simple loop)\n- O(n log n): Efficient sorting (merge sort)\n- O(n²): Quadratic (nested loops)\n- O(2ⁿ): Exponential (avoid!)\n\nFor ${courseName}, focus on worst-case scenarios and drop constants/lower terms.`;
  }

  // Generic fallback with course context
  return `I'd be happy to help with "${prompt.replace(/\[Course:.*?\]\n/, '')}" for ${courseName}!\n\nCould you provide more details? You can also:\n\n1. Post this as a thread for instructor/peer help\n2. Check course materials for related topics\n3. Ask me to explain specific concepts`;
}

/**
 * Simulate network delay for AI response
 */
export async function simulateDelay(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));
}
```

---

## 5. Animations & Styling

### Custom Animations

**File:** `/app/globals.css` (add to existing file)

```css
/* Quokka Float In Animation */
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

/* Quokka Chat Expand Animation */
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

.animate-quokka-float {
  animation: quokka-float-in 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.animate-quokka-expand {
  animation: quokka-expand 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-quokka-float,
  .animate-quokka-expand {
    animation: none !important;
  }
}
```

---

## 6. Integration with Course Detail Page

### Integration Point

**File:** `/app/courses/[courseId]/page.tsx`

**Add floating Quokka component:**

```typescript
import { FloatingQuokka } from '@/components/course/floating-quokka';

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: course } = useCourse(courseId);

  // ... existing code ...

  return (
    <div className="min-h-screen p-8 md:p-12">
      {/* Existing content */}

      {/* Floating Quokka AI Agent */}
      {course && (
        <FloatingQuokka
          courseId={course.id}
          courseName={course.name}
          courseCode={course.code}
        />
      )}
    </div>
  );
}
```

**Conditional rendering:**
- Only render when `course` data is loaded
- Automatically appears in minimized state
- Persists state across course page navigations

---

## 7. File Structure Summary

```
app/
├── courses/
│   └── [courseId]/
│       └── page.tsx                    # Add <FloatingQuokka /> here
└── globals.css                         # Add animations here

components/
└── course/
    ├── floating-quokka.tsx             # Main container (state + logic)
    ├── quokka-button.tsx               # Minimized button
    ├── quokka-chat-window.tsx          # Expanded chat window
    ├── message-list.tsx                # Message display component
    ├── chat-input.tsx                  # Input field + send button
    ├── quick-prompts.tsx               # Quick prompt buttons
    └── types.ts                        # TypeScript interfaces

lib/
└── ai/
    └── course-responses.ts             # AI response logic + helpers
```

---

## 8. Implementation Steps (Step-by-Step)

### Step 1: Create Type Definitions
**File:** `/components/course/types.ts`
- Define `QuokkaMessage` interface
- Define `QuokkaState` type
- Define all component prop interfaces
- Export `QUOKKA_STORAGE_KEYS` constants

### Step 2: Create Helper Functions
**File:** `/lib/ai/course-responses.ts`
- Implement `getQuickPrompts(courseCode)` function
- Implement `getAIResponse(prompt, courseId)` function
- Implement `simulateDelay()` utility

### Step 3: Build Sub-Components
**Files:**
- `/components/course/message-list.tsx`
- `/components/course/chat-input.tsx`
- `/components/course/quick-prompts.tsx`

**Order:**
1. MessageList (pure presentation)
2. ChatInput (controlled input + submit)
3. QuickPrompts (button grid)

### Step 4: Build QuokkaButton
**File:** `/components/course/quokka-button.tsx`
- Circular button with Quokka icon
- Pulse animation for first visit
- ARIA attributes for accessibility
- Glass panel styling

### Step 5: Build QuokkaChatWindow
**File:** `/components/course/quokka-chat-window.tsx`
- Compose header, MessageList, QuickPrompts, ChatInput
- Implement auto-scroll behavior
- Add Escape key handler
- Focus management (trap + restore)
- Mobile full-screen vs desktop fixed window

### Step 6: Build FloatingQuokka Container
**File:** `/components/course/floating-quokka.tsx`
- State management (minimized/expanded/hidden)
- Message history state
- AI response integration
- localStorage persistence
- Render QuokkaButton or QuokkaChatWindow based on state

### Step 7: Add Animations
**File:** `/app/globals.css`
- Add `@keyframes quokka-float-in`
- Add `@keyframes quokka-expand`
- Add utility classes `.animate-quokka-float`, `.animate-quokka-expand`
- Add reduced motion support

### Step 8: Integrate with Course Page
**File:** `/app/courses/[courseId]/page.tsx`
- Import `FloatingQuokka` component
- Render conditionally when course data is loaded
- Pass `courseId`, `courseName`, `courseCode` props

### Step 9: Testing & Refinement
- Test keyboard navigation (Tab, Escape)
- Test screen reader announcements
- Test mobile responsive behavior
- Test localStorage persistence
- Test focus management
- Verify WCAG 2.2 AA compliance

### Step 10: Edge Cases & Polish
- Handle rapid clicks (debounce expand/collapse)
- Handle long messages (scroll + line breaks)
- Handle no course data (graceful degradation)
- Add loading skeleton for first expansion
- Test on Safari, Firefox, Chrome

---

## 9. Acceptance Criteria

### Functional Requirements
- [ ] Floating button appears in bottom-right on course pages
- [ ] Clicking button expands chat window
- [ ] Chat window shows course-specific welcome message
- [ ] User can send messages and receive AI responses
- [ ] Quick prompts appear on initial state (no message history)
- [ ] State persists to localStorage (minimized vs expanded)
- [ ] Escape key closes chat window
- [ ] Messages auto-scroll to bottom
- [ ] Mobile: full-screen overlay
- [ ] Desktop: 350x500px fixed window

### Accessibility Requirements
- [ ] Keyboard navigation works (Tab, Escape, Enter)
- [ ] Focus trap active when chat expanded
- [ ] ARIA labels present and correct
- [ ] Screen reader announces AI responses
- [ ] Focus returns to button on close
- [ ] 44px+ touch targets on all interactive elements
- [ ] 4.5:1 contrast ratio minimum

### Visual/UX Requirements
- [ ] Glass panel styling (QDS compliant)
- [ ] Smooth animations (250-300ms)
- [ ] Pulse animation on first visit (3s)
- [ ] Loading indicator during AI response
- [ ] Message timestamps displayed
- [ ] Responsive at 360/768/1024/1280px
- [ ] Reduced motion support

### Performance Requirements
- [ ] No re-render on every keystroke (controlled input)
- [ ] Messages memoized (React.memo)
- [ ] Smooth scroll performance
- [ ] No layout shift when expanding
- [ ] Bundle size <10KB (component + logic)

---

## 10. Risk Mitigation

### Risk: Focus Trap Not Releasing
**Mitigation:**
- Add explicit Escape key handler
- Test with keyboard-only navigation
- Ensure close button has correct tabindex

### Risk: Mobile Keyboard Covering Input
**Mitigation:**
- Use `visualViewport` API to detect keyboard
- Scroll input into view when keyboard opens
- Pin input to bottom with safe area insets

### Risk: Z-Index Conflicts
**Mitigation:**
- Use consistent z-index scale (z-50 for dialogs)
- Test with existing modals/dropdowns
- Document z-index hierarchy in QDS

### Risk: Performance Degradation with Many Messages
**Mitigation:**
- Limit message history to 50 messages (session-scoped)
- Use `React.memo` for message components
- Consider virtual scrolling if needed (>100 messages)

---

## 11. Usage Examples

### Basic Usage (Course Detail Page)

```tsx
import { FloatingQuokka } from '@/components/course/floating-quokka';

export default function CourseDetailPage({ params }) {
  const { courseId } = use(params);
  const { data: course } = useCourse(courseId);

  return (
    <div>
      {/* Course content */}

      {/* Floating AI Agent */}
      {course && (
        <FloatingQuokka
          courseId={course.id}
          courseName={course.name}
          courseCode={course.code}
        />
      )}
    </div>
  );
}
```

### Example: Custom Styling

```tsx
<FloatingQuokka
  courseId={course.id}
  courseName={course.name}
  courseCode={course.code}
  className="custom-position" // Override positioning
/>
```

### Example: Programmatic Control (Future Extension)

```tsx
const quokkaRef = useRef<QuokkaHandle>(null);

// Open chat programmatically
<button onClick={() => quokkaRef.current?.expand()}>
  Get AI Help
</button>

<FloatingQuokka
  ref={quokkaRef}
  courseId={course.id}
  courseName={course.name}
  courseCode={course.code}
/>
```

---

## 12. Test Scenarios

### User Interaction Tests
1. Click minimized button → chat expands ✓
2. Type message → AI responds ✓
3. Click quick prompt → fills input ✓
4. Press Escape → chat collapses ✓
5. Click close button → chat collapses ✓
6. Refresh page → state persists ✓

### Accessibility Tests
1. Tab to button → focus visible ✓
2. Enter on button → chat expands ✓
3. Tab through chat → focus trap works ✓
4. Escape → focus returns to button ✓
5. Screen reader → announces messages ✓
6. Keyboard only → can send messages ✓

### Responsive Tests
1. Mobile (<768px) → full-screen overlay ✓
2. Tablet (768-1024px) → desktop layout ✓
3. Desktop (>1024px) → fixed window ✓
4. Keyboard opens → input stays visible ✓
5. Landscape mode → no overflow ✓

### Edge Cases
1. No course data → component not rendered ✓
2. Very long message → scrolls correctly ✓
3. Rapid clicks → no state conflicts ✓
4. Multiple tabs → localStorage syncs ✓
5. Browser back → state preserved ✓

---

## Summary

This design provides a **delightful, accessible, and performant floating AI assistant** for course pages that:

1. **Integrates seamlessly** with existing course detail pages
2. **Reuses existing patterns** (message state, glass styling, AI logic)
3. **Meets WCAG 2.2 AA** standards (keyboard nav, ARIA, contrast)
4. **Adapts to context** (course-specific prompts and responses)
5. **Performs well** (memoization, lazy loading, <10KB bundle)
6. **Respects user preferences** (localStorage persistence, reduced motion)

The component is **non-intrusive** (bottom-right, dismissable), **mobile-friendly** (full-screen on small devices), and **QDS-compliant** (glass panels, warm colors, subtle animations).

**Implementation complexity:** Medium (5-8 hours for experienced developer)

**Dependencies:** Zero new dependencies (uses existing Radix UI, Tailwind, React hooks)

**Maintenance cost:** Low (self-contained, well-typed, reuses existing helpers)

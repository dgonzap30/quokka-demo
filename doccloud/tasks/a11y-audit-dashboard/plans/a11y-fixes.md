# Accessibility Fixes: Dashboard System

**Components:** Dashboard pages, FloatingQuokka, Ask Question form

**Goal:** Achieve WCAG 2.2 Level AA compliance for dashboard system

---

## Priority Order

1. **Critical Fixes (MUST FIX - Production Blockers)** - 3 issues
2. **High Priority Fixes (SHOULD FIX - Significant Barriers)** - 7 issues
3. **Medium Priority Fixes (NICE TO HAVE - Improvements)** - 5 issues

**Estimated Total Effort:** 26-36 hours development + 8 hours testing

---

## CRITICAL FIXES (Production Blockers)

### File: `/components/course/floating-quokka.tsx`

---

#### Fix 1: Add Dialog Role and ARIA Modal Attributes

**Priority:** CRITICAL
**WCAG Criteria:** 4.1.2 Name, Role, Value (A)
**Current State:** Expanded chat window (lines 230-346) renders as plain Card without dialog semantics
**Required Change:** Add dialog role, aria-modal, and aria-labelledby

**Implementation:**

```tsx
// Line 230: Expanded state - show chat window
return (
  <div
    className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quokka-title"
    aria-describedby="quokka-description"
  >
    <Card variant="glass-strong" className="flex flex-col shadow-e3" style={{ height: "500px" }}>
      {/* Header */}
      <CardHeader className="p-4 border-b border-[var(--border-glass)] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle id="quokka-title" className="text-base glass-text">
              Quokka AI
            </CardTitle>
            <p id="quokka-description" className="sr-only">
              AI study assistant for {courseCode}
            </p>
            <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/30 text-xs">
              ● Online
            </Badge>
          </div>
        </div>
        {/* ... rest of header ... */}
```

**Changes:**
1. Add `role="dialog"` to outer container
2. Add `aria-modal="true"` to indicate modal behavior
3. Add `aria-labelledby="quokka-title"` pointing to CardTitle
4. Add `id="quokka-title"` to CardTitle
5. Add `aria-describedby="quokka-description"` with screen-reader-only description
6. Add `<p id="quokka-description" className="sr-only">` with context

**Test Scenario:**
- Open FloatingQuokka with screen reader (NVDA/JAWS/VoiceOver)
- Verify announcement: "Dialog, Quokka AI, AI study assistant for [course code]"
- Verify screen reader announces "modal" or "dialog" context
- Test with keyboard navigation: focus should stay within dialog

---

#### Fix 2: Implement Focus Trap in Floating Quokka Dialog

**Priority:** CRITICAL
**WCAG Criteria:** 2.4.3 Focus Order (A)
**Current State:** Tab key can escape dialog, leaving it open in background
**Required Change:** Trap focus inside dialog when expanded, release on minimize

**Implementation:**

```tsx
// Add import at top
import { useEffect, useRef } from "react";

// Inside FloatingQuokka component
const dialogRef = useRef<HTMLDivElement>(null);
const previousFocusRef = useRef<HTMLElement | null>(null);

// Focus trap effect
useEffect(() => {
  if (state !== "expanded") return;

  // Store current focus before opening
  previousFocusRef.current = document.activeElement as HTMLElement;

  // Get all focusable elements
  const getFocusableElements = () => {
    if (!dialogRef.current) return [];
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(dialogRef.current.querySelectorAll(selectors)) as HTMLElement[];
  };

  // Focus first element on mount
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    // Focus the input field (last focusable element in form)
    const inputField = dialogRef.current?.querySelector('input[aria-label="Message input"]') as HTMLElement;
    inputField?.focus();
  }

  // Trap focus
  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: going backwards
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTab);
  return () => document.removeEventListener('keydown', handleTab);
}, [state]);

// Update handleMinimize to restore focus
const handleMinimize = () => {
  updateState("minimized");
  // Restore focus to FAB button or previously focused element
  setTimeout(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, 100);
};

// Add ref to dialog container
return (
  <div
    ref={dialogRef}
    className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quokka-title"
  >
```

**Alternative Implementation (Recommended):**

```bash
npm install @radix-ui/react-focus-scope
```

```tsx
import { FocusScope } from '@radix-ui/react-focus-scope';

// Wrap dialog content in FocusScope
return (
  <FocusScope trapped={state === "expanded"} onMountAutoFocus={(e) => {
    // Focus input on mount
    e.preventDefault();
    const input = dialogRef.current?.querySelector('input[aria-label="Message input"]') as HTMLElement;
    input?.focus();
  }} onUnmountAutoFocus={(e) => {
    // Restore focus to FAB on unmount
    e.preventDefault();
    previousFocusRef.current?.focus();
  }}>
    <div
      ref={dialogRef}
      className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quokka-title"
    >
      {/* dialog content */}
    </div>
  </FocusScope>
);
```

**Test Scenario:**
- Open FloatingQuokka
- Press Tab repeatedly - focus should cycle only within dialog
- Press Shift+Tab - focus should cycle backwards within dialog
- Press Escape - dialog minimizes and focus returns to FAB button
- Verify keyboard users cannot access page content while dialog is open

---

#### Fix 3: Add Live Region for Chat Messages

**Priority:** CRITICAL
**WCAG Criteria:** 4.1.3 Status Messages (AA)
**Current State:** New AI messages appear visually but not announced to screen readers
**Required Change:** Wrap messages in aria-live region

**Implementation:**

```tsx
// Line 271: Messages section
<CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
  <div
    role="log"
    aria-live="polite"
    aria-atomic="false"
    aria-relevant="additions"
    aria-label="Chat message history"
  >
    {messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[85%] p-3 ${
            message.role === "user" ? "message-user" : "message-assistant"
          }`}
          aria-label={message.role === "user" ? "You said" : "Quokka said"}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs text-subtle mt-2">
            <span className="sr-only">{message.role === "user" ? "Sent" : "Received"} at </span>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    ))}

    {isThinking && (
      <div
        className="flex justify-start"
        role="status"
        aria-live="polite"
      >
        <div className="message-assistant p-3">
          <div className="flex items-center gap-2">
            <div className="animate-pulse" aria-hidden="true">💭</div>
            <p className="text-sm">Quokka is thinking...</p>
          </div>
        </div>
      </div>
    )}
  </div>

  <div ref={messagesEndRef} />
</CardContent>
```

**Changes:**
1. Wrap messages in `<div role="log" aria-live="polite">`
2. Use `aria-atomic="false"` to only announce new messages, not entire log
3. Use `aria-relevant="additions"` to only announce new content
4. Add `aria-label` to identify the region
5. Add `aria-label` to each message bubble for context
6. Add screen-reader-only "Sent/Received at" before timestamps
7. Add `role="status"` and `aria-live="polite"` to thinking indicator
8. Add `aria-hidden="true"` to decorative emoji

**Test Scenario:**
- Open FloatingQuokka with screen reader
- Send a message
- Verify screen reader announces: "Quokka said: [AI response text]"
- Verify "Quokka is thinking..." is announced during processing
- Verify message timestamps are announced with context

---

### File: `/app/dashboard/page.tsx`

---

#### Fix 4: Add Main Landmark and Skip Links

**Priority:** CRITICAL
**WCAG Criteria:** 1.3.1 Info and Relationships (A), 2.4.1 Bypass Blocks (A)
**Current State:** No main landmark, no skip links
**Required Change:** Wrap content in `<main>`, add skip link

**Implementation:**

```tsx
// StudentDashboard component (line 78)
function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  return (
    <>
      {/* Skip link - position absolute, visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-e2"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen p-8 md:p-12">
        <div className="container-wide space-y-12">
          {/* Hero Section */}
          <section aria-labelledby="welcome-heading" className="py-8 md:py-12 space-y-6">
            <div className="space-y-4">
              <h1 id="welcome-heading" className="heading-2 glass-text">
                Welcome back, {user.name}!
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Your academic dashboard - track your courses, recent activity, and stay updated
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6" role="region" aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
              {/* Convert to definition list */}
              <Card variant="glass" as="dl">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <dt className="text-sm text-muted-foreground">Courses</dt>
                    <dd className="text-3xl font-bold glass-text">{data.stats.totalCourses}</dd>
                  </div>
                </CardContent>
              </Card>
              {/* Repeat for other stats */}
            </div>
          </section>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Courses - 2 columns on large screens */}
            <section aria-labelledby="courses-heading" className="lg:col-span-2 space-y-6">
              <h2 id="courses-heading" className="heading-3 glass-text">My Courses</h2>
              {/* ... courses content ... */}
            </section>

            {/* Activity Feed - 1 column on large screens */}
            <aside aria-labelledby="activity-heading" className="space-y-6">
              <h2 id="activity-heading" className="heading-3 glass-text">Recent Activity</h2>
              {/* ... activity content ... */}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// InstructorDashboard component (line 232) - same changes
function InstructorDashboard({ data }: { data: InstructorDashboardData }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-e2"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen p-8 md:p-12">
        {/* ... rest of content ... */}
      </main>
    </>
  );
}
```

**Changes:**
1. Add skip link as first child - visually hidden but focusable
2. Skip link uses `sr-only` with `focus:not-sr-only` to appear on focus
3. Wrap dashboard content in `<main id="main-content">`
4. Add `<section>` elements with `aria-labelledby` for major regions
5. Convert stats grid to use semantic `<dl><dt><dd>` structure
6. Add `<aside>` for activity feed
7. Add screen-reader-only headings where needed

**Test Scenario:**
- Tab from browser chrome - first tab stop should be "Skip to main content"
- Press Enter on skip link - focus should jump to main content area
- Use screen reader landmarks navigation (NVDA: Insert+F7, JAWS: Insert+Ctrl+R)
- Verify "Main" landmark is present
- Verify sections and aside are properly identified

---

#### Fix 5: Implement Error Handling UI with Announcements

**Priority:** CRITICAL
**WCAG Criteria:** 3.3.1 Error Identification (A), 4.1.3 Status Messages (AA)
**Current State:** Form errors logged to console, no user feedback
**Required Change:** Add error state, error messages, aria-live announcements

**Implementation for Ask Question Form:**

```tsx
// File: /app/courses/[courseId]/page.tsx
// Add error state
const [showAskForm, setShowAskForm] = useState(false);
const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [tags, setTags] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [formError, setFormError] = useState<string | null>(null);
const [formSuccess, setFormSuccess] = useState(false);

// Handle Ask Question form submission
const handleAskQuestion = async (e: FormEvent) => {
  e.preventDefault();
  if (!title.trim() || !content.trim() || !user || !course) return;

  setIsSubmitting(true);
  setFormError(null); // Clear previous errors
  setFormSuccess(false);

  try {
    const newThread = await createThreadMutation.mutateAsync({
      input: {
        courseId: course.id,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      },
      authorId: user.id,
    });

    // Show success message
    setFormSuccess(true);

    // Reset form after short delay
    setTimeout(() => {
      setTitle("");
      setContent("");
      setTags("");
      setShowAskForm(false);
      router.push(`/threads/${newThread.id}`);
    }, 1000);
  } catch (error) {
    console.error("Failed to create thread:", error);
    setFormError(
      error instanceof Error
        ? error.message
        : "Failed to post your question. Please try again."
    );
    setIsSubmitting(false);
  }
};

// Inside form JSX (after line 169)
<CardContent className="p-6 md:p-8 pt-0">
  {/* Status Messages Region */}
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {formError && `Error: ${formError}`}
    {formSuccess && "Question posted successfully! Redirecting to thread..."}
    {isSubmitting && "Posting your question..."}
  </div>

  {/* Visual Error Alert */}
  {formError && (
    <div
      role="alert"
      className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger"
    >
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Failed to Post Question</h3>
          <p className="text-sm">{formError}</p>
        </div>
        <button
          type="button"
          onClick={() => setFormError(null)}
          className="shrink-0 text-danger hover:text-danger/80"
          aria-label="Dismiss error"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )}

  {/* Visual Success Alert */}
  {formSuccess && (
    <div
      role="status"
      className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 text-success"
    >
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p className="text-sm font-medium">Question posted successfully! Redirecting...</p>
      </div>
    </div>
  )}

  <form onSubmit={handleAskQuestion} className="space-y-6">
    {/* ... existing form fields ... */}
  </form>
</CardContent>
```

**Changes:**
1. Add `formError` and `formSuccess` state variables
2. Wrap try/catch with proper error handling
3. Add screen-reader-only status region with `aria-live="polite"`
4. Add visual error alert with `role="alert"` (assertive announcement)
5. Add visual success alert with `role="status"` (polite announcement)
6. Include dismissible error messages
7. Show loading state in status region

**Test Scenario:**
- Submit form with network error (disconnect wifi)
- Verify visual error message appears
- Verify screen reader announces: "Error: Failed to post your question..."
- Dismiss error and verify it clears
- Submit successfully
- Verify screen reader announces: "Question posted successfully!"
- Verify 1-second delay before redirect

---

## HIGH PRIORITY FIXES (Significant Barriers)

### File: `/app/courses/[courseId]/page.tsx`

---

#### Fix 6: Add Collapsible State to Ask Question Toggle

**Priority:** HIGH
**WCAG Criteria:** 4.1.2 Name, Role, Value (A)
**Current State:** Button toggles form but doesn't announce expanded/collapsed state
**Required Change:** Add aria-expanded and aria-controls

**Implementation:**

```tsx
// Line 149: Ask Question toggle button
<Button
  variant="glass-primary"
  size="lg"
  onClick={() => setShowAskForm(!showAskForm)}
  aria-expanded={showAskForm}
  aria-controls="ask-question-form"
>
  {showAskForm ? "Cancel" : "Ask Question"}
  {showAskForm ? <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" /> : <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />}
</Button>

// Line 161: Form container
{showAskForm && (
  <Card
    variant="glass-strong"
    id="ask-question-form"
    role="region"
    aria-labelledby="ask-form-title"
  >
    <CardHeader className="p-6 md:p-8">
      <CardTitle id="ask-form-title" className="text-xl glass-text">
        Ask a Question
      </CardTitle>
      <CardDescription className="text-base">
        Post your question to get help from classmates and instructors
      </CardDescription>
    </CardHeader>
    {/* ... rest of form ... */}
  </Card>
)}
```

**Changes:**
1. Add `aria-expanded={showAskForm}` to button
2. Add `aria-controls="ask-question-form"` to button
3. Add `id="ask-question-form"` to form Card
4. Add `role="region"` to form Card
5. Add `aria-labelledby="ask-form-title"` to form Card
6. Add `id="ask-form-title"` to CardTitle
7. Add `aria-hidden="true"` to chevron icons

**Test Scenario:**
- Focus "Ask Question" button with screen reader
- Verify announcement: "Ask Question, button, collapsed" or "expanded"
- Press Enter to expand
- Verify screen reader announces: "Ask Question, button, expanded"
- Verify announcement includes "controls ask-question-form"

---

#### Fix 7: Manage Focus on Form Expand

**Priority:** HIGH
**WCAG Criteria:** 2.4.3 Focus Order (A)
**Current State:** Form expands but focus stays on toggle button
**Required Change:** Move focus to first input when form expands

**Implementation:**

```tsx
// Add ref for first input
const titleInputRef = useRef<HTMLInputElement>(null);

// Add effect to manage focus
useEffect(() => {
  if (showAskForm && titleInputRef.current) {
    // Small delay to allow form to render
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  }
}, [showAskForm]);

// Update title input to use ref (line 176)
<Input
  ref={titleInputRef}
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="e.g., How does binary search work?"
  className="h-11 text-base"
  required
  maxLength={200}
  aria-describedby="title-counter title-hint"
/>
```

**Changes:**
1. Import `useRef` from React
2. Create `titleInputRef` ref
3. Add `useEffect` that focuses input when `showAskForm` becomes true
4. Attach ref to title Input component
5. Add 100ms delay to ensure smooth focus transition

**Test Scenario:**
- Navigate to "Ask Question" button with keyboard
- Press Enter to expand form
- Verify focus moves to title input field
- Verify screen reader announces: "Question Title, required, edit text"
- Begin typing without additional Tab presses

---

#### Fix 8: Associate Helper Text with Form Inputs

**Priority:** HIGH
**WCAG Criteria:** 3.3.2 Labels or Instructions (A)
**Current State:** Character counter and helper text not linked to inputs
**Required Change:** Use aria-describedby to associate hints

**Implementation:**

```tsx
{/* Title Input (lines 172-188) */}
<div className="space-y-2">
  <label htmlFor="title" className="text-sm font-semibold">
    Question Title *
  </label>
  <Input
    ref={titleInputRef}
    id="title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g., How does binary search work?"
    className="h-11 text-base"
    required
    maxLength={200}
    aria-describedby="title-counter"
  />
  <p id="title-counter" className="text-xs text-muted-foreground">
    {title.length}/200 characters
  </p>
</div>

{/* Content Textarea (lines 191-204) */}
<div className="space-y-2">
  <label htmlFor="content" className="text-sm font-semibold">
    Question Details *
  </label>
  <Textarea
    id="content"
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context."
    rows={8}
    className="min-h-[200px] text-base"
    required
    aria-describedby="content-hint"
  />
  <p id="content-hint" className="text-xs text-muted-foreground sr-only">
    Provide a detailed description of your question. Include any relevant code, error messages, or context.
  </p>
</div>

{/* Tags Input (lines 207-221) */}
<div className="space-y-2">
  <label htmlFor="tags" className="text-sm font-semibold">
    Tags (optional)
  </label>
  <Input
    id="tags"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="e.g., algorithms, binary-search, homework"
    className="h-11 text-base"
    aria-describedby="tags-hint"
  />
  <p id="tags-hint" className="text-xs text-muted-foreground">
    Separate tags with commas
  </p>
</div>
```

**Changes:**
1. Add `id="title-counter"` to character counter
2. Add `aria-describedby="title-counter"` to title input
3. Add `id="content-hint"` to content helper (duplicate placeholder as sr-only hint)
4. Add `aria-describedby="content-hint"` to content textarea
5. Add `id="tags-hint"` to tags helper
6. Add `aria-describedby="tags-hint"` to tags input

**Test Scenario:**
- Focus title input with screen reader
- Verify announcement includes: "Question Title, required, edit text, 0/200 characters"
- Type characters and verify counter updates
- Focus tags input
- Verify announcement includes: "Tags, optional, edit text, Separate tags with commas"

---

#### Fix 9: Add Loading State Announcements

**Priority:** HIGH
**WCAG Criteria:** 4.1.3 Status Messages (AA)
**Current State:** Skeleton screens shown visually but silent for screen readers
**Required Change:** Add aria-live region with loading message

**Implementation:**

```tsx
// Dashboard loading state (lines 35-51)
if (userLoading || (user && (studentLoading || instructorLoading))) {
  return (
    <div className="min-h-screen p-8 md:p-12">
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Loading dashboard...
      </div>

      <div className="container-wide space-y-12" aria-hidden="true">
        <div className="space-y-4">
          <Skeleton className="h-16 w-96 bg-glass-medium rounded-lg" />
          <Skeleton className="h-8 w-64 bg-glass-medium rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 bg-glass-medium rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Course detail loading state (lines 70-87) - same pattern
if (userLoading || courseLoading || threadsLoading) {
  return (
    <div className="min-h-screen p-8">
      <div role="status" aria-live="polite" className="sr-only">
        Loading course details...
      </div>

      <div className="container-wide space-y-12" aria-hidden="true">
        {/* ... skeleton content ... */}
      </div>
    </div>
  );
}
```

**Changes:**
1. Add `<div role="status" aria-live="polite" className="sr-only">` with loading message
2. Add `aria-hidden="true"` to skeleton content (visual only)
3. Use specific loading messages per context

**Test Scenario:**
- Navigate to dashboard page with screen reader
- Verify announcement: "Loading dashboard..."
- Wait for data to load
- Verify announcement: "Welcome back, [name]" when content appears

---

#### Fix 10: Restore Focus After Minimizing Quokka

**Priority:** HIGH
**WCAG Criteria:** 2.4.3 Focus Order (A)
**Current State:** Focus lost when minimizing chat
**Required Change:** Store and restore focus to FAB button

**Implementation:**

```tsx
// File: /components/course/floating-quokka.tsx
// Add ref for FAB button
const fabButtonRef = useRef<HTMLButtonElement>(null);

// Update handleMinimize (line 76)
const handleMinimize = () => {
  updateState("minimized");
  // Restore focus to FAB button after minimize
  setTimeout(() => {
    fabButtonRef.current?.focus();
  }, 100);
};

// Minimized state - show floating button (line 208)
if (state === "minimized") {
  return (
    <div className="fixed bottom-8 right-8 z-40">
      <Button
        ref={fabButtonRef}
        onClick={handleExpand}
        variant="glass-primary"
        size="lg"
        className={`h-14 w-14 rounded-full shadow-e3 hover:shadow-e3 transition-all ${
          isFirstVisit ? "animate-pulse" : ""
        }`}
        aria-label="Open Quokka AI Assistant"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </Button>
      {isFirstVisit && (
        <div className="absolute -top-12 right-0 glass-panel px-3 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap" aria-hidden="true">
          Ask me anything! 💬
        </div>
      )}
    </div>
  );
}
```

**Changes:**
1. Import `useRef` for fabButtonRef
2. Create `fabButtonRef` ref
3. Attach ref to FAB Button
4. Update `handleMinimize` to focus FAB after 100ms delay
5. Add `aria-hidden="true"` to tooltip (decorative)
6. Add `aria-hidden="true"` to MessageCircle icon

**Test Scenario:**
- Open FloatingQuokka with keyboard (Tab to FAB, press Enter)
- Press Escape to minimize
- Verify focus returns to FAB button
- Verify screen reader announces: "Open Quokka AI Assistant, button"

---

#### Fix 11: Announce Form Submission Status

**Priority:** HIGH
**WCAG Criteria:** 4.1.3 Status Messages (AA)
**Current State:** Form submission happens silently for screen readers
**Required Change:** Already covered in Fix 5 (Error Handling)

**Status:** COMPLETED IN FIX 5

---

#### Fix 12: Fix Interactive Card Nesting Issues

**Priority:** HIGH
**WCAG Criteria:** 4.1.1 Parsing (A)
**Current State:** `<Link>` wrapping entire card with nested Badge/Button creates invalid HTML
**Required Change:** Use clickable overlay technique or restructure cards

**Implementation:**

```tsx
// Student Dashboard - Course Cards (lines 135-172)
{data.enrolledCourses.map((course) => (
  <article key={course.id} className="relative">
    <Card variant="glass-hover" className="h-full">
      <CardHeader className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl glass-text">
              <Link
                href={`/courses/${course.id}`}
                className="hover:underline focus:outline-none focus:underline after:absolute after:inset-0"
              >
                {course.code}
                <span className="sr-only">- View course details</span>
              </Link>
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {course.name}
            </CardDescription>
          </div>
          {course.unreadCount > 0 && (
            <Badge variant="default" className="shrink-0 relative z-10">
              {course.unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {course.recentThreads.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Recent threads:</p>
              {course.recentThreads.slice(0, 2).map((thread) => (
                <p key={thread.id} className="text-sm text-subtle truncate">
                  • {thread.title}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  </article>
))}
```

**CSS Addition (globals.css or component):**
```css
/* Clickable card overlay technique */
.card-link-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.card-badge-above-overlay {
  position: relative;
  z-index: 10;
}
```

**Changes:**
1. Remove `<Link>` wrapper from entire card
2. Use `<article>` for semantic card container
3. Move Link to CardTitle text only
4. Add `after:absolute after:inset-0` pseudo-element to expand click target
5. Add `relative z-10` to Badge to keep it above overlay
6. Add screen-reader-only context "View course details"
7. Entire card becomes clickable via pseudo-element, but Link is the only focusable element

**Alternative Implementation (Keep Link Wrapper):**
```tsx
{/* If you must keep Link wrapper, remove nested interactive elements */}
<Link key={course.id} href={`/courses/${course.id}`} className="block">
  <Card variant="glass-hover" className="h-full">
    <CardHeader className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle className="text-xl glass-text">{course.code}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {course.name}
          </CardDescription>
        </div>
        {course.unreadCount > 0 && (
          <div
            className="shrink-0 inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground"
            aria-label={`${course.unreadCount} new threads`}
          >
            {course.unreadCount} new
          </div>
        )}
      </div>
    </CardHeader>
    {/* ... rest of card ... */}
  </Card>
</Link>
```

**Test Scenario:**
- Tab to course card
- Verify only one focus stop (the Link, not nested elements)
- Verify entire card is clickable
- Verify screen reader announces: "[Course Code] - View course details, link"
- Validate HTML with W3C validator - no nesting errors

---

## MEDIUM PRIORITY FIXES (Improvements)

### File: `/components/course/floating-quokka.tsx`

---

#### Fix 13: Hide Decorative Emojis from Screen Readers

**Priority:** MEDIUM
**WCAG Criteria:** 1.1.1 Non-text Content (A)
**Current State:** Emojis announced literally (e.g., "books", "speech balloon")
**Required Change:** Add aria-hidden="true" to decorative emojis

**Implementation:**

```tsx
// Empty course state (dashboard page.tsx line 176)
<div className="text-5xl opacity-50" aria-hidden="true">📚</div>

// Empty activity state (line 214)
<div className="text-4xl opacity-50" aria-hidden="true">💬</div>

// Empty unanswered queue (line 349)
<div className="text-4xl opacity-50" aria-hidden="true">✅</div>

// Empty threads state (courses page line 299)
<div className="text-6xl opacity-50" aria-hidden="true">💬</div>

// FloatingQuokka thinking indicator (line 293)
<div className="animate-pulse" aria-hidden="true">💭</div>

// FloatingQuokka tooltip (line 222)
<div className="absolute -top-12 right-0 glass-panel px-3 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap" aria-hidden="true">
  Ask me anything! 💬
</div>
```

**Changes:**
1. Add `aria-hidden="true"` to all decorative emoji containers
2. Ensure meaningful text is still present in surrounding elements
3. Screen readers will skip emojis and read contextual text instead

**Test Scenario:**
- Navigate to empty state with screen reader
- Verify screen reader does NOT announce "books" or "speech balloon"
- Verify screen reader announces meaningful text: "No Courses Yet. You're not enrolled in any courses"

---

#### Fix 14: Increase Touch Target Size for Minimize/Close Buttons

**Priority:** MEDIUM
**WCAG Criteria:** 2.5.8 Target Size (Minimum) (AA)
**Current State:** Buttons are 32×32px (below 44×44px minimum)
**Required Change:** Increase to 44×44px with adequate spacing

**Implementation:**

```tsx
// FloatingQuokka header buttons (lines 246-268)
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={handleMinimize}
    className="h-11 w-11 p-0"
    aria-label="Minimize chat"
  >
    <span className="sr-only">Minimize</span>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="7" width="10" height="2" rx="1" />
    </svg>
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={handleDismiss}
    className="h-11 w-11 p-0"
    aria-label="Close chat"
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </Button>
</div>
```

**Changes:**
1. Change `h-8 w-8` to `h-11 w-11` (44px)
2. Change gap from `gap-1` to `gap-2` (8px spacing)
3. Add `aria-hidden="true"` to SVG icons
4. Keep `p-0` to maximize touch target

**Test Scenario:**
- Test on mobile device or with touch screen
- Tap minimize button - verify easy to hit
- Tap close button - verify easy to hit
- Verify no accidental taps on wrong button

---

#### Fix 15: Add Prefers-Reduced-Motion Support

**Priority:** MEDIUM
**WCAG Criteria:** 2.3.3 Animation from Interactions (AAA)
**Current State:** Animations run regardless of user preferences
**Required Change:** Respect prefers-reduced-motion media query

**Implementation:**

```css
/* File: /app/globals.css - Add at end */

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Disable specific problematic animations */
  .animate-pulse,
  .animate-shimmer,
  .animate-float {
    animation: none !important;
  }

  /* Keep focus transitions but make instant */
  *:focus-visible {
    transition: none !important;
  }
}
```

**Alternative Component-Level Implementation:**

```tsx
// FloatingQuokka FAB button (line 213)
<Button
  ref={fabButtonRef}
  onClick={handleExpand}
  variant="glass-primary"
  size="lg"
  className={`h-14 w-14 rounded-full shadow-e3 hover:shadow-e3 transition-all ${
    isFirstVisit ? "motion-safe:animate-pulse" : ""
  }`}
  aria-label="Open Quokka AI Assistant"
>
  <MessageCircle className="h-6 w-6" aria-hidden="true" />
</Button>
```

**Changes:**
1. Add global CSS to respect prefers-reduced-motion
2. Disable animations for users with motion preferences
3. Optionally use Tailwind's `motion-safe:` prefix for specific animations
4. Keep essential transitions but make them instant

**Test Scenario:**
- Enable "Reduce motion" in OS settings (macOS: Accessibility > Display)
- Reload page
- Verify no card hover animations
- Verify no button scale effects
- Verify no pulsing animations
- Verify functionality still works

---

#### Fix 16: Announce AI Thinking State in Live Region

**Priority:** MEDIUM
**WCAG Criteria:** 4.1.3 Status Messages (AA)
**Current State:** "Quokka is thinking..." shown visually but may not be in live region
**Required Change:** Already covered in Fix 3 (Live Region for Chat Messages)

**Status:** COMPLETED IN FIX 3

---

#### Fix 17: Add Placeholder SR-Only Context

**Priority:** MEDIUM
**WCAG Criteria:** 2.4.6 Headings and Labels (AA)
**Current State:** Some placeholders may not be sufficient context
**Required Change:** Add aria-describedby with richer context where needed

**Implementation:**

```tsx
// FloatingQuokka message input (line 325)
<form onSubmit={handleSubmit} className="flex gap-2">
  <label htmlFor="quokka-input" className="sr-only">
    Message Quokka AI
  </label>
  <Input
    id="quokka-input"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Ask me anything..."
    disabled={isThinking}
    className="flex-1 text-sm"
    aria-label="Message input"
    aria-describedby="quokka-input-hint"
  />
  <p id="quokka-input-hint" className="sr-only">
    Type your question about {courseCode} and press enter or click send
  </p>
  <Button
    type="submit"
    variant="glass-primary"
    size="sm"
    disabled={isThinking || !input.trim()}
    className="shrink-0"
    aria-label="Send message"
  >
    <Send className="h-4 w-4" aria-hidden="true" />
  </Button>
</form>
```

**Changes:**
1. Add `<label for="quokka-input" className="sr-only">` for proper label
2. Add `id="quokka-input"` to input
3. Add `aria-describedby="quokka-input-hint"` to input
4. Add screen-reader-only hint with richer context
5. Add `aria-label="Send message"` to send button
6. Add `aria-hidden="true"` to Send icon

**Test Scenario:**
- Focus message input with screen reader
- Verify announcement: "Message Quokka AI, edit text, Ask me anything..., Type your question about [course] and press enter or click send"

---

## Testing Checklist

### Automated Testing (Before Manual Testing)

- [ ] Run axe DevTools browser extension on all pages
- [ ] Run WAVE extension on all pages
- [ ] Run Lighthouse accessibility audit
- [ ] Validate HTML with W3C validator (no nesting errors)
- [ ] Check color contrast with Color Contrast Analyzer

### Keyboard Navigation Testing

- [ ] Tab through entire dashboard - verify logical order
- [ ] Tab to "Ask Question" button - verify aria-expanded announced
- [ ] Press Enter on "Ask Question" - verify form expands and focus moves to title input
- [ ] Fill form and press Tab - verify tab order: title → content → tags → submit → cancel
- [ ] Press Escape in form - no effect (form should stay open)
- [ ] Tab to FloatingQuokka FAB - press Enter - verify dialog opens
- [ ] In FloatingQuokka - press Tab repeatedly - verify focus stays inside dialog
- [ ] In FloatingQuokka - press Escape - verify dialog minimizes and focus returns to FAB
- [ ] Verify no keyboard traps anywhere

### Screen Reader Testing (NVDA on Windows, VoiceOver on macOS)

- [ ] Navigate to dashboard - verify "Loading dashboard..." announced
- [ ] Use landmarks navigation (Insert+F7) - verify Main landmark present
- [ ] Use headings navigation (H key) - verify h1 → h2 → h3 hierarchy
- [ ] Navigate to stats cards - verify announced as definition list (dt/dd)
- [ ] Navigate to course cards - verify "View course details, link" announced
- [ ] Navigate to "Ask Question" button - verify "collapsed" or "expanded" state
- [ ] Expand form - verify form region announced
- [ ] Navigate to title input - verify "required, 0/200 characters" announced
- [ ] Navigate to tags input - verify "Separate tags with commas" announced
- [ ] Submit form with error - verify error message announced
- [ ] Submit form successfully - verify success message announced
- [ ] Open FloatingQuokka - verify "Dialog, Quokka AI" announced
- [ ] Send message in Quokka - verify "Quokka is thinking..." announced
- [ ] Receive AI response - verify "Quokka said: [response]" announced
- [ ] Verify decorative emojis NOT announced (no "books", "speech balloon")

### Focus Indicator Testing

- [ ] Tab through all interactive elements - verify focus ring visible
- [ ] Test on glass backgrounds - verify 3:1 contrast minimum
- [ ] Test on liquid backgrounds - verify ring visible
- [ ] Test focus on buttons, inputs, links, cards

### Color Contrast Testing (Use Contrast Analyzer)

- [ ] Measure body text on white background - verify ≥4.5:1
- [ ] Measure muted text on white background - verify ≥4.5:1
- [ ] Measure text on glass panels - verify ≥4.5:1
- [ ] Measure warning color (unanswered count) - verify ≥4.5:1
- [ ] Measure badge borders - verify ≥3:1
- [ ] Measure focus ring on all backgrounds - verify ≥3:1

### Touch Target Testing (Mobile)

- [ ] Test on iOS Safari - verify all buttons hittable
- [ ] Test on Android Chrome - verify all buttons hittable
- [ ] Verify minimize/close buttons in FloatingQuokka are 44×44px
- [ ] Verify adequate spacing between adjacent buttons

### Motion Preferences Testing

- [ ] Enable "Reduce Motion" in OS settings
- [ ] Reload page - verify no card animations
- [ ] Verify no button scale effects
- [ ] Verify no pulsing animations on FAB
- [ ] Verify functionality still works

### Error Handling Testing

- [ ] Submit Ask Question form while offline - verify error message appears
- [ ] Verify error announced to screen reader
- [ ] Dismiss error - verify it clears
- [ ] Submit form successfully - verify success message

### Live Regions Testing

- [ ] Send message in FloatingQuokka - verify thinking state announced
- [ ] Receive AI response - verify response announced
- [ ] Navigate away during thinking - verify announcement still works

---

## Dependencies

### NPM Packages (Optional but Recommended)

```bash
# For focus trap implementation (alternative to manual implementation)
npm install @radix-ui/react-focus-scope

# For accessible dialog primitives (if refactoring FloatingQuokka)
npm install @radix-ui/react-dialog
```

---

## Files to Modify Summary

1. **`/app/dashboard/page.tsx`**
   - Add main landmark and skip links
   - Convert stats to definition lists
   - Add section/aside landmarks
   - Add loading announcements
   - Fix card nesting issues

2. **`/components/course/floating-quokka.tsx`**
   - Add dialog role and aria-modal
   - Implement focus trap
   - Add live region for messages
   - Fix focus management
   - Increase button sizes
   - Add ARIA labels

3. **`/app/courses/[courseId]/page.tsx`**
   - Add aria-expanded to toggle button
   - Manage focus on form expand
   - Associate helper text with inputs
   - Implement error handling UI
   - Add loading announcements

4. **`/app/globals.css`**
   - Add prefers-reduced-motion support
   - Optionally add focus ring contrast tweaks

5. **`/components/ui/input.tsx`** (Optional)
   - Already has focus styles - verify contrast

6. **`/components/ui/button.tsx`** (Optional)
   - Already has focus styles - verify contrast

---

## Implementation Order

### Phase 1: Critical Fixes (Week 1)
1. Fix 4: Add main landmark and skip links (2 hours)
2. Fix 5: Implement error handling UI (4 hours)
3. Fix 1: Add dialog role to FloatingQuokka (1 hour)
4. Fix 2: Implement focus trap (3 hours)
5. Fix 3: Add live region for chat messages (2 hours)

**Subtotal:** 12 hours

### Phase 2: High Priority Fixes (Week 2)
1. Fix 6: Add aria-expanded to Ask Question (1 hour)
2. Fix 7: Manage focus on form expand (2 hours)
3. Fix 8: Associate helper text (2 hours)
4. Fix 9: Add loading announcements (2 hours)
5. Fix 10: Restore focus after minimizing (1 hour)
6. Fix 12: Fix card nesting issues (4 hours)

**Subtotal:** 12 hours

### Phase 3: Medium Priority Fixes (Week 3)
1. Fix 13: Hide decorative emojis (1 hour)
2. Fix 14: Increase touch targets (1 hour)
3. Fix 15: Add prefers-reduced-motion (2 hours)
4. Fix 17: Add placeholder context (2 hours)

**Subtotal:** 6 hours

### Phase 4: Testing & Validation (Week 4)
1. Automated testing (2 hours)
2. Keyboard navigation testing (2 hours)
3. Screen reader testing (2 hours)
4. Color contrast verification (1 hour)
5. Touch target testing (1 hour)

**Subtotal:** 8 hours

**Total Effort:** 38 hours

---

## Success Criteria

### Definition of Done

- [ ] All 3 critical issues resolved
- [ ] All 7 high priority issues resolved
- [ ] At least 3 of 5 medium priority issues resolved
- [ ] All automated tests pass (axe, WAVE, Lighthouse)
- [ ] All keyboard navigation flows work
- [ ] All screen reader tests pass
- [ ] All color contrast ratios meet WCAG AA
- [ ] No HTML validation errors
- [ ] Documentation updated

### WCAG Compliance Target

- **Level A:** 100% compliance
- **Level AA:** 100% compliance
- **Level AAA:** 60%+ compliance (motion, focus appearance)

### Production Readiness Gate

**MUST HAVE (Cannot ship without):**
- ✅ Dialog roles and focus traps
- ✅ Error handling with announcements
- ✅ Main landmarks and skip links
- ✅ Form field associations
- ✅ Loading state announcements

**SHOULD HAVE (Significantly improves experience):**
- ✅ Focus management
- ✅ Live region announcements
- ✅ Color contrast verified
- ✅ Touch targets adequate

**NICE TO HAVE (Future enhancement):**
- ⚪ Prefers-reduced-motion support
- ⚪ Enhanced AAA compliance
- ⚪ Automated accessibility testing in CI/CD

---

## Rollback Plan

If accessibility fixes introduce regressions:

1. **Immediate Rollback:** Revert commits for that specific fix
2. **Partial Rollback:** Keep critical fixes, remove problematic medium priority fixes
3. **Full Rollback:** Revert entire accessibility branch (NOT RECOMMENDED)

**Mitigation Strategy:**
- Fix issues in isolated PRs (one fix per PR for critical issues)
- Test each fix independently before merging
- Use feature flags for larger refactors (FloatingQuokka focus trap)

---

## Additional Notes

### Browser Support

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- iOS Safari 15+
- Android Chrome (latest)

### Screen Reader Support

Test with:
- NVDA (Windows) - free
- JAWS (Windows) - trial version
- VoiceOver (macOS/iOS) - built-in
- TalkBack (Android) - built-in

### Assistive Technology Considerations

- **Keyboard-only users:** All fixes benefit this group
- **Screen reader users:** Live regions, ARIA, landmarks critical
- **Low vision users:** Focus indicators, contrast critical
- **Motor impairment users:** Touch targets, focus management critical
- **Cognitive disabilities:** Error messages, clear labels critical

### Future Enhancements

1. **Automated Testing in CI/CD**
   - Add @axe-core/react for runtime checks
   - Add pa11y-ci for automated testing
   - Fail build on critical violations

2. **Accessibility Statement Page**
   - Document known issues
   - Provide contact for feedback
   - Outline conformance level

3. **User Preference Persistence**
   - Remember motion preferences
   - Remember high contrast preferences
   - Sync across devices

---

**Last Updated:** 2025-10-04
**Next Review:** After implementation of Phase 1 fixes

# A11y-UX Integration Plan: Navigation & Engagement Enhancements

**Date:** 2025-10-05
**Planner:** Accessibility Validator Sub-Agent
**Context:** Integrate 15 a11y fixes with UX elevation improvements

---

## Executive Summary

This plan integrates accessibility remediation with UX elevation goals across 3 phases. Priority is given to fixes that provide dual benefits: improving both WCAG compliance and user experience.

**Total Effort:** 56 hours (7 working days)
**Files Modified:** 8 core files + 3 new components
**Testing:** 4 phases (automated, keyboard, screen reader, mobile)

---

## Phase 1: Critical Foundation (12 hours)

### Goal
Fix production-blocking a11y issues that enable future UX enhancements.

### Files Modified
1. `/app/dashboard/page.tsx` - Skip links, main landmark
2. `/components/course/floating-quokka.tsx` - Dialog semantics, focus trap, live regions
3. `/app/courses/[courseId]/page.tsx` - Error handling UI
4. `/components/ui/error-alert.tsx` - NEW reusable component
5. `/components/ui/success-toast.tsx` - NEW reusable component

---

### Fix 4: Add Skip Links to Dashboard
**File:** `/app/dashboard/page.tsx`
**Priority:** CRITICAL
**Effort:** 2 hours
**WCAG:** 2.4.1 Bypass Blocks (A)

**Current State:**
```tsx
// Line 84: StudentDashboard
<main id="main-content" className="min-h-screen p-4 md:p-6">
```

**Required Changes:**

```tsx
// Line 81: Before <main>, add skip link
function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  return (
    <>
      {/* Skip link - visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-e2 focus:outline-none focus:ring-4 focus:ring-accent/50"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen p-4 md:p-6">
        {/* ... existing content ... */}
      </main>
    </>
  );
}

// Line 191: InstructorDashboard - same changes
function InstructorDashboard({ data }: { data: InstructorDashboardData }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-e2 focus:outline-none focus:ring-4 focus:ring-accent/50"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen p-4 md:p-6">
        {/* ... existing content ... */}
      </main>
    </>
  );
}
```

**UX Enhancement:**
- Skip link uses QDS primary color (Quokka Brown)
- High contrast focus ring (accent blue)
- Smooth appearance on focus

**Test Scenarios:**
- [ ] Tab from browser chrome - first tab stop is skip link
- [ ] Skip link becomes visible with high contrast
- [ ] Press Enter - jumps to main content
- [ ] Screen reader announces: "Skip to main content, link"

---

### Fix 5: Implement Error Handling UI with Announcements
**Files:** `/app/courses/[courseId]/page.tsx`, `/components/ui/error-alert.tsx` (NEW), `/components/ui/success-toast.tsx` (NEW)
**Priority:** CRITICAL
**Effort:** 4 hours
**WCAG:** 3.3.1 Error Identification (A), 4.1.3 Status Messages (AA)

**Step 1: Create Reusable Error Alert Component**

**File:** `/components/ui/error-alert.tsx` (NEW)
```tsx
import { X } from "lucide-react";
import { Card } from "./card";

interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ title, message, onDismiss }: ErrorAlertProps) {
  return (
    <Card
      role="alert"
      className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger"
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <svg
          className="h-5 w-5 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>

        {/* Error Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-sm">{message}</p>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-danger hover:text-danger/80 focus:outline-none focus:ring-2 focus:ring-danger/50 rounded p-1"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  );
}
```

**Step 2: Create Reusable Success Toast Component**

**File:** `/components/ui/success-toast.tsx` (NEW)
```tsx
import { CheckCircle } from "lucide-react";
import { Card } from "./card";

interface SuccessToastProps {
  message: string;
}

export function SuccessToast({ message }: SuccessToastProps) {
  return (
    <Card
      role="status"
      className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 text-success"
    >
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </Card>
  );
}
```

**Step 3: Integrate into Ask Question Form**

**File:** `/app/courses/[courseId]/page.tsx`

```tsx
// Add imports at top
import { ErrorAlert } from "@/components/ui/error-alert";
import { SuccessToast } from "@/components/ui/success-toast";

// Add state variables (after line 422)
const [formError, setFormError] = useState<string | null>(null);
const [formSuccess, setFormSuccess] = useState(false);

// Update handleAskQuestion (lines 431-473)
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

// Update form JSX (after line 476, inside CardContent)
<CardContent className="p-6 md:p-8 pt-0">
  {/* Screen Reader Status Region (silent visual announcements) */}
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {formError && `Error: ${formError}`}
    {formSuccess && "Question posted successfully! Redirecting to thread..."}
    {isSubmitting && !formError && !formSuccess && "Posting your question..."}
  </div>

  {/* Visual Error Alert */}
  {formError && (
    <ErrorAlert
      title="Failed to Post Question"
      message={formError}
      onDismiss={() => setFormError(null)}
    />
  )}

  {/* Visual Success Toast */}
  {formSuccess && (
    <SuccessToast message="Question posted successfully! Redirecting..." />
  )}

  <form onSubmit={handleAskQuestion} className="space-y-6">
    {/* ... existing form fields ... */}
  </form>
</CardContent>
```

**UX Enhancements:**
- Reusable error/success components for consistency
- Dismissible errors (X button)
- Screen reader announcements via aria-live
- Visual feedback with QDS danger/success colors

**Test Scenarios:**
- [ ] Submit form offline - verify error appears and is announced
- [ ] Dismiss error - verify it clears
- [ ] Submit successfully - verify success message and 1s delay
- [ ] Screen reader announces all state changes

---

### Fix 1: Add Dialog Role to FloatingQuokka
**File:** `/components/course/floating-quokka.tsx`
**Priority:** CRITICAL
**Effort:** 1 hour
**WCAG:** 4.1.2 Name, Role, Value (A)

**Current State:**
```tsx
// Line 230: Expanded chat window
return (
  <div className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]">
    <Card variant="glass-strong" className="flex flex-col shadow-e3" style={{ height: "500px" }}>
```

**Required Changes:**

```tsx
// Line 230: Add dialog semantics
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
            <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle id="quokka-title" className="text-base glass-text">
              Quokka AI
            </CardTitle>
            <p id="quokka-description" className="sr-only">
              AI study assistant for {courseCode}
            </p>
            <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/30 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-success mr-1" aria-hidden="true" />
              Online
            </Badge>
          </div>
        </div>
        {/* ... rest of header ... */}
      </CardHeader>
```

**UX Enhancements:**
- Screen reader users understand this is a dialog
- AI assistant purpose clearly communicated
- "Online" status visible and announced

**Test Scenarios:**
- [ ] Open FloatingQuokka with screen reader
- [ ] Verify announcement: "Dialog, Quokka AI, AI study assistant for [course]"
- [ ] Verify "Online" status announced

---

### Fix 2: Implement Focus Trap in FloatingQuokka
**File:** `/components/course/floating-quokka.tsx`
**Priority:** CRITICAL
**Effort:** 3 hours
**WCAG:** 2.4.3 Focus Order (A)

**Installation:**
```bash
npm install @radix-ui/react-focus-scope
```

**Required Changes:**

```tsx
// Add import at top
import { FocusScope } from '@radix-ui/react-focus-scope';
import { useEffect, useRef } from "react";

// Inside FloatingQuokka component
const dialogRef = useRef<HTMLDivElement>(null);
const previousFocusRef = useRef<HTMLElement | null>(null);

// Store previous focus before opening
useEffect(() => {
  if (state === "expanded") {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }
}, [state]);

// Update handleMinimize to restore focus
const handleMinimize = () => {
  updateState("minimized");
  // Restore focus to FAB button after minimize
  setTimeout(() => {
    previousFocusRef.current?.focus();
  }, 100);
};

// Wrap expanded state in FocusScope (line 230)
if (state === "expanded") {
  return (
    <FocusScope
      trapped={true}
      onMountAutoFocus={(e) => {
        // Focus input on mount
        e.preventDefault();
        const input = dialogRef.current?.querySelector('input') as HTMLInputElement;
        input?.focus();
      }}
      onUnmountAutoFocus={(e) => {
        // Focus will be restored by handleMinimize
        e.preventDefault();
      }}
    >
      <div
        ref={dialogRef}
        className="fixed bottom-8 right-8 z-40 w-[90vw] max-w-[400px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quokka-title"
        aria-describedby="quokka-description"
      >
        {/* ... rest of dialog ... */}
      </div>
    </FocusScope>
  );
}
```

**UX Enhancements:**
- Auto-focus input when dialog opens (immediate interaction)
- Tab cycles only within dialog (no confusion)
- Escape closes dialog and restores focus (smooth flow)

**Test Scenarios:**
- [ ] Open FloatingQuokka - verify input auto-focused
- [ ] Press Tab repeatedly - verify focus cycles inside dialog
- [ ] Press Shift+Tab - verify reverse cycling works
- [ ] Press Escape - verify dialog closes and focus returns to FAB

---

### Fix 3: Add Live Region for Chat Messages
**File:** `/components/course/floating-quokka.tsx`
**Priority:** CRITICAL
**Effort:** 2 hours
**WCAG:** 4.1.3 Status Messages (AA)

**Required Changes:**

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
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <p className="text-xs text-subtle mt-2">
            <span className="sr-only">
              {message.role === "user" ? "You sent at" : "Quokka replied at"}
            </span>
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

**UX Enhancements:**
- Real-time announcements of AI responses
- Thinking state provides feedback
- Timestamps give context ("sent at 2:30 PM")

**Test Scenarios:**
- [ ] Send message with screen reader
- [ ] Verify "Quokka is thinking..." announced
- [ ] Verify AI response announced: "Quokka replied at [time]: [message]"
- [ ] Verify no duplicate announcements

---

## Phase 2: Navigation + High Priority (18 hours)

### Goal
Redesign navigation system with accessibility built-in, fix high-priority form issues.

### Files Modified
1. `/components/layout/nav-header.tsx` - Tab navigation system
2. `/app/courses/[courseId]/page.tsx` - Form collapsible state, focus management, helper text
3. `/app/dashboard/page.tsx` - Loading announcements, card nesting fixes
4. `/components/dashboard/enhanced-course-card.tsx` - Fix interactive card nesting

---

### Navigation Redesign: Tab-Based System
**File:** `/components/layout/nav-header.tsx`
**Priority:** HIGH (UX + A11y)
**Effort:** 6 hours
**WCAG:** 2.4.1 Bypass Blocks, 2.4.7 Focus Visible, 3.2.3 Consistent Navigation

**Current State:**
```tsx
// Line 54: Only Dashboard link
<nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
  <Link href="/dashboard">Dashboard</Link>
</nav>
```

**Required Changes:**

```tsx
// Line 54: Enhanced navigation with all sections
<nav
  className="hidden md:flex items-center space-x-1 text-sm font-medium"
  role="navigation"
  aria-label="Main navigation"
>
  <Link
    href="/dashboard"
    aria-current={isActive("/dashboard") ? "page" : undefined}
    className={`transition-colors hover:text-primary px-4 py-2 min-h-[44px] flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 ${
      isActive("/dashboard")
        ? "text-primary bg-primary/10 font-semibold"
        : "text-muted-foreground hover:bg-primary/5"
    }`}
  >
    Dashboard
  </Link>

  <Link
    href="/courses"
    aria-current={isActive("/courses") ? "page" : undefined}
    className={`transition-colors hover:text-primary px-4 py-2 min-h-[44px] flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 ${
      isActive("/courses")
        ? "text-primary bg-primary/10 font-semibold"
        : "text-muted-foreground hover:bg-primary/5"
    }`}
  >
    Courses
  </Link>

  <Link
    href="/ask"
    aria-current={isActive("/ask") ? "page" : undefined}
    className={`transition-colors hover:text-primary px-4 py-2 min-h-[44px] flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 ${
      isActive("/ask")
        ? "text-primary bg-primary/10 font-semibold"
        : "text-muted-foreground hover:bg-primary/5"
    }`}
  >
    Ask Question
  </Link>

  <Link
    href="/threads"
    aria-current={isActive("/threads") ? "page" : undefined}
    className={`transition-colors hover:text-primary px-4 py-2 min-h-[44px] flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 ${
      isActive("/threads")
        ? "text-primary bg-primary/10 font-semibold"
        : "text-muted-foreground hover:bg-primary/5"
    }`}
  >
    Threads
  </Link>
</nav>
```

**UX Enhancements:**
- All major sections visible in navigation
- Active state clearly indicated (color + weight)
- Hover states provide feedback
- 44px minimum touch targets
- High contrast focus rings

**Test Scenarios:**
- [ ] Tab through navigation links
- [ ] Verify focus rings visible on all links
- [ ] Verify aria-current="page" on active link
- [ ] Screen reader announces: "Dashboard, current page, link"
- [ ] Hover states work correctly

---

### Fix 6: Add Collapsible State to Ask Question Toggle
**File:** `/app/courses/[courseId]/page.tsx`
**Priority:** HIGH
**Effort:** 1 hour
**WCAG:** 4.1.2 Name, Role, Value (A)

**Current State:**
```tsx
// Line 149: Toggle button
<Button onClick={() => setShowAskForm(!showAskForm)}>
  {showAskForm ? "Cancel" : "Ask Question"}
</Button>
```

**Required Changes:**

```tsx
// Line 149: Add aria-expanded and aria-controls
<Button
  variant="glass-primary"
  size="lg"
  onClick={() => setShowAskForm(!showAskForm)}
  aria-expanded={showAskForm}
  aria-controls="ask-question-form"
  className="min-h-[44px]"
>
  {showAskForm ? "Cancel" : "Ask Question"}
  {showAskForm ? (
    <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" />
  ) : (
    <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
  )}
</Button>

// Line 161: Add id and region role to form
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
      {/* ... rest of form ... */}
    </CardHeader>
  </Card>
)}
```

**UX Enhancements:**
- Chevron icon indicates expandable section
- Screen reader announces expanded/collapsed state
- Smooth visual feedback

**Test Scenarios:**
- [ ] Focus button with screen reader
- [ ] Verify announcement: "Ask Question, button, collapsed"
- [ ] Press Enter - verify announcement changes to "expanded"
- [ ] Verify chevron rotates smoothly

---

### Fix 7: Manage Focus on Form Expand
**File:** `/app/courses/[courseId]/page.tsx`
**Priority:** HIGH
**Effort:** 2 hours
**WCAG:** 2.4.3 Focus Order (A)

**Required Changes:**

```tsx
// Add import at top
import { useRef, useEffect } from "react";

// Add ref for title input
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
  aria-describedby="title-counter"
/>
```

**UX Enhancements:**
- Auto-focus on first input (immediate interaction)
- No need to Tab after expanding form
- Smooth transition (100ms delay)

**Test Scenarios:**
- [ ] Click "Ask Question" button
- [ ] Verify focus moves to title input
- [ ] Begin typing immediately (no Tab needed)
- [ ] Screen reader announces: "Question Title, required, edit text, 0/200 characters"

---

### Fix 8: Associate Helper Text with Form Inputs
**File:** `/app/courses/[courseId]/page.tsx`
**Priority:** HIGH
**Effort:** 2 hours
**WCAG:** 3.3.2 Labels or Instructions (A)

**Required Changes:**

```tsx
{/* Title Input (lines 172-188) */}
<div className="space-y-2">
  <label htmlFor="title" className="text-sm font-semibold glass-text">
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
  <label htmlFor="content" className="text-sm font-semibold glass-text">
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
  <label htmlFor="tags" className="text-sm font-semibold glass-text">
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

**UX Enhancements:**
- Character counter provides clear limits
- Helper text guides users
- Screen reader announces all context

**Test Scenarios:**
- [ ] Focus title input with screen reader
- [ ] Verify announcement includes: "0/200 characters"
- [ ] Type characters - verify counter updates
- [ ] Focus tags input - verify "Separate tags with commas" announced

---

### Fix 9: Add Loading State Announcements
**File:** `/app/dashboard/page.tsx`
**Priority:** HIGH
**Effort:** 2 hours
**WCAG:** 4.1.3 Status Messages (AA)

**Required Changes:**

```tsx
// Line 35: Loading state
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
```

**UX Enhancements:**
- Screen reader users know data is loading
- Skeleton screens provide visual feedback
- `aria-hidden` prevents skeleton announcement

**Test Scenarios:**
- [ ] Navigate to dashboard with screen reader
- [ ] Verify "Loading dashboard..." announced
- [ ] Wait for load - verify heading announced
- [ ] Verify skeleton screens NOT announced

---

### Fix 12: Fix Interactive Card Nesting Issues
**File:** `/components/dashboard/enhanced-course-card.tsx`
**Priority:** HIGH
**Effort:** 4 hours
**WCAG:** 4.1.1 Parsing (A)

**Current State:**
```tsx
// Entire card wrapped in Link with nested Badge
<Link href={`/courses/${course.id}`}>
  <Card>
    <Badge>{course.unreadCount} new</Badge>
  </Card>
</Link>
```

**Required Changes:**

**Option 1: Clickable Overlay (Recommended)**
```tsx
<article className="relative">
  <Card variant="glass-hover" className="h-full">
    <CardHeader className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle className="text-xl glass-text">
            <Link
              href={`/courses/${course.id}`}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 focus:underline after:absolute after:inset-0"
            >
              {course.code}
              <span className="sr-only"> - View course details</span>
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
      {/* ... rest of content ... */}
    </CardContent>
  </Card>
</article>
```

**CSS Addition (globals.css):**
```css
/* Ensure badge stays above overlay */
.relative.z-10 {
  position: relative;
  z-index: 10;
}
```

**UX Enhancements:**
- Entire card clickable (large target)
- Single focus stop (no confusion)
- Badge stays interactive if needed
- Valid HTML (no nested links)

**Test Scenarios:**
- [ ] Tab to course card - verify single focus stop
- [ ] Verify entire card clickable
- [ ] Screen reader announces: "[Course Code] - View course details, link"
- [ ] Validate HTML - no nesting errors

---

## Phase 3: Polish + Medium Priority (14 hours)

### Goal
Complete remaining a11y fixes, add mobile navigation, conduct contrast audit.

### Files Modified
1. `/app/globals.css` - Contrast fixes, motion preferences
2. `/components/layout/nav-header.tsx` - Mobile hamburger menu
3. `/components/course/floating-quokka.tsx` - Touch targets, decorative content
4. `/app/courses/[courseId]/page.tsx` - Placeholder context

---

### Contrast Audit & Fixes
**File:** `/app/globals.css`
**Priority:** MEDIUM
**Effort:** 3 hours (1hr audit, 2hr fixes)
**WCAG:** 1.4.3 Contrast (Minimum) (AA)

**Audit Checklist:**
- [ ] Measure `.glass-text` on `--glass-medium` - verify ≥4.5:1
- [ ] Measure `.text-muted-foreground` on white - verify ≥4.5:1
- [ ] Measure warning badge text/bg - verify ≥4.5:1
- [ ] Measure badge borders on glass - verify ≥3:1
- [ ] Measure focus ring on all backgrounds - verify ≥3:1

**Potential Fixes (if needed):**

```css
/* Enhanced text shadow for glass backgrounds */
.glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); /* Increased from 0.1 */
}

/* Stronger muted text for better contrast */
--muted: #54504A; /* Darker from #625C52 */

/* Enhanced focus indicators */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.4); /* Increased from 0.3 */
}

/* Glass background focus (higher contrast) */
.glass-panel *:focus-visible,
.glass-panel-strong *:focus-visible {
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.6); /* Increased from 0.5 */
}
```

**Test Scenarios:**
- [ ] Use Chrome DevTools Color Picker on all text
- [ ] Verify all ratios ≥4.5:1 (text) or ≥3:1 (UI components)
- [ ] Test in light and dark modes
- [ ] Verify focus rings visible on all backgrounds

---

### Fix 13: Hide Decorative Emojis from Screen Readers
**Files:** Multiple (dashboard, courses, FloatingQuokka)
**Priority:** MEDIUM
**Effort:** 1 hour
**WCAG:** 1.1.1 Non-text Content (A)

**Required Changes:**

**File:** `/app/dashboard/page.tsx`
```tsx
// Line 114: Empty course state
<div className="text-4xl opacity-50" aria-hidden="true">📚</div>

// Line 245: Empty unanswered queue
<div className="text-4xl opacity-50" aria-hidden="true">✅</div>
```

**File:** `/app/courses/[courseId]/page.tsx`
```tsx
// Empty threads state
<div className="text-6xl opacity-50" aria-hidden="true">💬</div>
```

**File:** `/components/course/floating-quokka.tsx`
```tsx
// Line 293: Thinking indicator
<div className="animate-pulse" aria-hidden="true">💭</div>

// Line 222: Tooltip
<div className="absolute -top-12 right-0 glass-panel px-3 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap" aria-hidden="true">
  Ask me anything! 💬
</div>
```

**Test Scenarios:**
- [ ] Navigate empty states with screen reader
- [ ] Verify emojis NOT announced
- [ ] Verify text still announced: "No Courses Yet"

---

### Fix 14: Increase Touch Target Sizes
**File:** `/components/course/floating-quokka.tsx`
**Priority:** MEDIUM
**Effort:** 1 hour
**WCAG:** 2.5.8 Target Size (Minimum) (AA)

**Required Changes:**

```tsx
// Line 246: Minimize/close buttons
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={handleMinimize}
    className="h-11 w-11 p-0" /* Changed from h-8 w-8 */
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
    className="h-11 w-11 p-0" /* Changed from h-8 w-8 */
    aria-label="Close chat"
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </Button>
</div>
```

**Test Scenarios:**
- [ ] Test on mobile device (iOS/Android)
- [ ] Verify buttons easy to tap (no misses)
- [ ] Verify adequate spacing between buttons

---

### Fix 15: Add Prefers-Reduced-Motion Support
**File:** `/app/globals.css`
**Priority:** MEDIUM
**Effort:** 2 hours
**WCAG:** 2.3.3 Animation from Interactions (AAA)

**Required Changes:**

```css
/* Add at end of file */

/* ===== Reduced Motion Support (WCAG AAA) ===== */
@media (prefers-reduced-motion: reduce) {
  /* Disable all decorative animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Disable specific animations */
  .animate-pulse,
  .animate-shimmer,
  .animate-float,
  .animate-liquid,
  .animate-liquid-float,
  .animate-glass-shimmer,
  .animate-gradient,
  .hover-lift {
    animation: none !important;
  }

  /* Keep essential focus transitions (instant) */
  *:focus-visible {
    transition: none !important;
  }

  /* Keep essential state changes (instant) */
  [role="alert"],
  [role="status"],
  [aria-live] {
    transition: none !important;
  }
}
```

**Test Scenarios:**
- [ ] Enable "Reduce Motion" in OS settings (macOS: Accessibility > Display)
- [ ] Reload page
- [ ] Verify no card hover animations
- [ ] Verify no skeleton shimmer
- [ ] Verify no FloatingQuokka pulse
- [ ] Verify functionality still works

---

### Fix 17: Add Placeholder SR-Only Context
**File:** `/components/course/floating-quokka.tsx`
**Priority:** MEDIUM
**Effort:** 2 hours
**WCAG:** 2.4.6 Headings and Labels (AA)

**Required Changes:**

```tsx
// Line 325: Message input
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
    className="shrink-0 min-h-[44px] min-w-[44px]"
    aria-label="Send message"
  >
    <Send className="h-4 w-4" aria-hidden="true" />
  </Button>
</form>
```

**Test Scenarios:**
- [ ] Focus message input with screen reader
- [ ] Verify announcement: "Message Quokka AI, edit text, Ask me anything..., Type your question about [course] and press enter or click send"
- [ ] Verify Send button: "Send message, button"

---

### Mobile Hamburger Menu (UX Enhancement)
**File:** `/components/layout/nav-header.tsx`
**Priority:** MEDIUM (UX + A11y)
**Effort:** 4 hours
**WCAG:** 2.4.1 Bypass Blocks, 2.4.3 Focus Order

**Implementation:**

```tsx
// Add state for mobile menu
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Add hamburger button (before desktop nav)
<div className="md:hidden">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-expanded={mobileMenuOpen}
    aria-controls="mobile-menu"
    aria-label="Main menu"
    className="h-11 w-11 p-0"
  >
    {mobileMenuOpen ? (
      <X className="h-6 w-6" aria-hidden="true" />
    ) : (
      <Menu className="h-6 w-6" aria-hidden="true" />
    )}
  </Button>
</div>

{/* Mobile menu panel */}
{mobileMenuOpen && (
  <div
    id="mobile-menu"
    className="absolute top-14 left-0 right-0 glass-panel-strong border-b border-[var(--border-glass)] p-4 space-y-2"
    role="navigation"
    aria-label="Mobile navigation"
  >
    <Link
      href="/dashboard"
      onClick={() => setMobileMenuOpen(false)}
      className={`block px-4 py-3 rounded-md min-h-[44px] ${
        isActive("/dashboard") ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
      }`}
    >
      Dashboard
    </Link>
    <Link
      href="/courses"
      onClick={() => setMobileMenuOpen(false)}
      className={`block px-4 py-3 rounded-md min-h-[44px] ${
        isActive("/courses") ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
      }`}
    >
      Courses
    </Link>
    <Link
      href="/ask"
      onClick={() => setMobileMenuOpen(false)}
      className={`block px-4 py-3 rounded-md min-h-[44px] ${
        isActive("/ask") ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
      }`}
    >
      Ask Question
    </Link>
    <Link
      href="/threads"
      onClick={() => setMobileMenuOpen(false)}
      className={`block px-4 py-3 rounded-md min-h-[44px] ${
        isActive("/threads") ? "bg-primary/10 text-primary font-semibold" : "hover:bg-primary/5"
      }`}
    >
      Threads
    </Link>
  </div>
)}
```

**Test Scenarios:**
- [ ] Test on mobile device (360px width)
- [ ] Tap hamburger - verify menu opens
- [ ] Tap link - verify menu closes and navigation works
- [ ] Tap outside menu - verify it closes (add click outside handler)
- [ ] Screen reader announces expanded/collapsed state

---

## Phase 4: Validation & Testing (8 hours)

### Goal
Comprehensive testing across all assistive technologies and devices.

---

### Automated Testing
**Effort:** 2 hours

**Tools:**
- axe DevTools (browser extension)
- Lighthouse (Chrome DevTools)
- WAVE (browser extension)
- W3C HTML Validator

**Checklist:**
- [ ] Run axe DevTools on all pages - verify 0 critical/serious issues
- [ ] Run Lighthouse a11y audit - verify 90+ score on all pages
- [ ] Run WAVE - verify no errors
- [ ] Validate HTML - verify no nesting/parsing errors
- [ ] Check console for React errors

---

### Keyboard Navigation Testing
**Effort:** 2 hours

**Checklist:**
- [ ] Tab from browser chrome - skip link appears first
- [ ] Press Enter on skip link - jumps to main content
- [ ] Tab through navigation - all links focusable with visible focus rings
- [ ] Tab to Ask Question button - aria-expanded announced
- [ ] Press Enter - form expands, focus moves to title input
- [ ] Tab through form - logical order (title → content → tags → submit)
- [ ] Tab to FloatingQuokka FAB - press Enter - dialog opens
- [ ] Tab within dialog - focus trapped inside
- [ ] Press Escape - dialog closes, focus returns to FAB
- [ ] Verify no keyboard traps anywhere
- [ ] Test mobile menu (if applicable)

---

### Screen Reader Testing
**Effort:** 2 hours

**Tools:**
- NVDA (Windows, free)
- JAWS (Windows, trial)
- VoiceOver (macOS, built-in)

**Checklist:**
- [ ] Navigate to dashboard - verify "Loading dashboard..." announced
- [ ] Use landmarks (Insert+F7 in NVDA) - verify Main landmark present
- [ ] Use headings (H key) - verify h1 → h2 → h3 hierarchy
- [ ] Navigate to course cards - verify single focus stop, "View course details"
- [ ] Navigate to Ask Question - verify "collapsed/expanded" state
- [ ] Expand form - verify form region announced
- [ ] Navigate inputs - verify helper text announced
- [ ] Submit with error - verify error announced
- [ ] Open FloatingQuokka - verify "Dialog, Quokka AI" announced
- [ ] Send message - verify "Quokka is thinking..." and response announced
- [ ] Verify decorative emojis NOT announced

---

### Color Contrast Testing
**Effort:** 1 hour

**Tool:** Chrome DevTools Color Picker or Contrast Analyzer

**Checklist:**
- [ ] Measure body text on white - verify ≥4.5:1
- [ ] Measure glass-text on glass-medium - verify ≥4.5:1
- [ ] Measure muted text on white - verify ≥4.5:1
- [ ] Measure warning badge text/bg - verify ≥4.5:1
- [ ] Measure success badge text/bg - verify ≥4.5:1
- [ ] Measure badge borders on glass - verify ≥3:1
- [ ] Measure focus ring on white - verify ≥3:1
- [ ] Measure focus ring on glass - verify ≥3:1
- [ ] Measure active nav link - verify ≥4.5:1

---

### Mobile Testing
**Effort:** 1 hour

**Devices:** iOS Safari, Android Chrome

**Checklist:**
- [ ] Test hamburger menu - opens/closes correctly
- [ ] Test all touch targets - verify 44×44px minimum
- [ ] Test FloatingQuokka buttons - verify tappable
- [ ] Test form inputs - verify keyboard appears correctly
- [ ] Test navigation links - verify adequate spacing
- [ ] Zoom to 200% - verify no horizontal scroll
- [ ] Test landscape and portrait orientations

---

## Success Criteria & Validation

### WCAG Compliance Targets

**Level A (Must Have):**
- [x] 1.3.1 Info and Relationships - Semantic HTML, landmarks
- [x] 2.4.1 Bypass Blocks - Skip links
- [x] 2.4.3 Focus Order - Logical tab order, focus management
- [x] 3.3.1 Error Identification - Error messages
- [x] 3.3.2 Labels or Instructions - Form labels, helper text
- [x] 4.1.1 Parsing - Valid HTML, no nesting errors
- [x] 4.1.2 Name, Role, Value - ARIA attributes

**Level AA (Should Have):**
- [x] 1.4.3 Contrast (Minimum) - 4.5:1 text, 3:1 UI
- [x] 2.4.6 Headings and Labels - Descriptive labels
- [x] 2.4.7 Focus Visible - Visible focus indicators
- [x] 2.5.8 Target Size (Minimum) - 44×44px touch targets
- [x] 4.1.3 Status Messages - Live regions, announcements

**Level AAA (Nice to Have):**
- [x] 2.3.3 Animation from Interactions - Reduced motion support

---

### Metrics

**Quantitative:**
- Lighthouse A11y Score: 90+ → 100
- axe Issues: 15 → 0 critical, 0 serious
- WCAG Level AA: 85% → 100%
- Keyboard Coverage: 60% → 100%

**Qualitative:**
- Users find navigation intuitive
- Screen reader users report positive experience
- No accessibility complaints

---

## Risk Mitigation

### High Risk: Focus Trap Implementation
**Mitigation:** Use @radix-ui/react-focus-scope (battle-tested library)
**Rollback:** Remove focus trap, keep dialog role
**Testing:** Extensive keyboard testing before deployment

### Medium Risk: Card Nesting Refactor
**Mitigation:** Test with keyboard, mouse, and screen reader
**Rollback:** Revert to Link wrapper, suppress warnings
**Testing:** Validate HTML, test click handlers

### Medium Risk: Live Region Chattiness
**Mitigation:** Use aria-live="polite", test with real users
**Rollback:** Adjust to "off" or "assertive" based on feedback
**Testing:** Screen reader user testing

---

## Dependencies

### NPM Packages
```bash
npm install @radix-ui/react-focus-scope
```

### Design Decisions Required
- Skip link styling (match button or custom?)
- Error alert design (toast vs inline?)
- Mobile navigation structure (hamburger vs bottom nav?)
- Focus indicator color (accent blue or primary brown?)

### Technical Blockers
- Contrast audit completion before visual changes
- Screen reader access (NVDA/JAWS) for testing
- Mobile devices for touch testing

---

## Implementation Sequence

### Week 1: Critical Foundation
1. Day 1: Skip links + Main landmark (Fix 4) - 2hr
2. Day 2: Error handling UI (Fix 5) - 4hr
3. Day 3: FloatingQuokka dialog role (Fix 1) - 1hr
4. Day 4: Focus trap (Fix 2) - 3hr
5. Day 5: Live regions (Fix 3) - 2hr

### Week 2: Navigation + Forms
1. Day 1: Navigation redesign - 6hr
2. Day 2: Form collapsible + focus (Fix 6-7) - 3hr
3. Day 3: Helper text + loading (Fix 8-9) - 4hr
4. Day 4: Card nesting (Fix 12) - 4hr
5. Day 5: Testing + fixes - 3hr

### Week 3: Polish + Mobile
1. Day 1: Contrast audit + fixes - 3hr
2. Day 2: Decorative content + touch targets (Fix 13-14) - 2hr
3. Day 3: Motion preferences (Fix 15) - 2hr
4. Day 4: Mobile menu - 4hr
5. Day 5: Placeholder context (Fix 17) + testing - 3hr

### Week 4: Validation
1. Day 1-2: Automated + keyboard testing - 4hr
2. Day 3: Screen reader testing - 2hr
3. Day 4: Mobile testing - 1hr
4. Day 5: Refinements + documentation - 1hr

---

## Rollback Plan

**If Issues Arise:**
1. **Critical Fixes:** Revert individual commits (Git)
2. **Navigation:** Feature flag new nav, fallback to old
3. **FloatingQuokka:** Remove focus trap, keep dialog role
4. **Full Rollback:** Revert entire branch (NOT RECOMMENDED)

**Mitigation:**
- Test each fix independently before merging
- Use feature flags for large changes
- Document all changes in context.md

---

## Files Summary

### Modified Files (8)
1. `/app/dashboard/page.tsx` - Skip links, loading announcements, card nesting
2. `/app/courses/[courseId]/page.tsx` - Error handling, form a11y, helper text
3. `/components/course/floating-quokka.tsx` - Dialog, focus trap, live regions, touch targets
4. `/components/layout/nav-header.tsx` - Navigation redesign, mobile menu
5. `/components/dashboard/enhanced-course-card.tsx` - Fix card nesting
6. `/app/globals.css` - Contrast fixes, motion preferences
7. `/components/ui/input.tsx` - Verify ref support
8. `/components/ui/textarea.tsx` - Verify ref support

### New Files (2)
1. `/components/ui/error-alert.tsx` - Reusable error component
2. `/components/ui/success-toast.tsx` - Reusable success component

---

## Next Steps

1. **Review this plan** with team
2. **Approve design decisions** (skip link style, error design, mobile nav)
3. **Install dependencies** (@radix-ui/react-focus-scope)
4. **Begin Phase 1** (Critical fixes)
5. **Test incrementally** after each fix
6. **Update context.md** with decisions and progress

---

**Total Effort:** 56 hours (7 working days)
**Expected Outcome:** 100% WCAG 2.2 Level AA compliance + Enhanced UX
**Success Metric:** Lighthouse A11y Score 100, 0 axe violations, positive user feedback

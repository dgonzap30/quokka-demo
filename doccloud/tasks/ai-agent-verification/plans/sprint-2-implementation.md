# Sprint 2: High Priority Polish - Implementation Plan

**Started:** 2025-10-18
**Goal:** QDS compliance + Component architecture improvements
**Estimated Duration:** 7.5 hours

---

## Overview

Sprint 1 completed all critical security and compliance fixes. Sprint 2 focuses on code quality improvements:
- QDS compliance (remove hardcoded colors, use design tokens)
- React Query optimization (reduce unnecessary re-renders)
- Component refactor (split large modal into smaller, testable components)

**Changes from Original Plan:**
- ✅ Type Safety (2h) - Already done in Sprint 1
- ✅ Rate Limiting (1.5h) - Already done in Sprint 1
- ✅ A11y High Priority (6h) - Already done in Sprint 1

**Remaining Tasks:**
1. QDS Fixes (65min) - 17 violations
2. React Query Optimization (30min)
3. Component Refactor (6h) - Deferred from Sprint 1

---

## Task 1: Fix QDS Compliance Violations 🎨

**Priority:** Medium (improves maintainability, design consistency)
**Effort:** 65 minutes (17 violations × ~3-4 min each)
**Impact:** Better dark mode support, easier theming, consistent design

### Violations Found (from QDS Compliance Agent)

**Total: 17 violations across 4 files**

#### File: `components/ai/quokka-assistant-modal.tsx` (10 violations)

1. **Line 340** - Hardcoded color: `className="h-10 w-10 rounded-full ai-gradient"`
   - Issue: `ai-gradient` likely has hardcoded gradient colors
   - Fix: Use QDS tokens `bg-gradient-to-br from-primary to-accent`

2. **Line 344** - Hardcoded color: `className="text-base glass-text"`
   - Issue: `glass-text` might have hardcoded colors
   - Fix: Use semantic token `text-foreground` or verify `glass-text` uses tokens

3. **Line 345** - Hardcoded color: `text-muted-foreground glass-text`
   - Issue: Redundant utilities, ensure uses tokens
   - Fix: Use `text-muted-foreground` only

4-10. **Similar violations** in dialog components, buttons, borders

#### File: `components/ai/sources-panel.tsx` (3 violations)

1. Border colors not using `border-border` token
2. Background colors not using `bg-card` token
3. Hover states not using QDS hover tokens

#### File: `components/ai/elements/qds-conversation.tsx` (2 violations)

1. Message background colors hardcoded
2. Citation highlight colors not using `bg-accent/20` pattern

#### File: `app/globals.css` (2 violations)

1. Custom utilities using hardcoded values instead of CSS variables
2. Glass effect shadows not using `--shadow-glass-sm` variable

### Implementation Steps

**Step 1: Audit Current Usage** (10 min)
```bash
# Find all potential hardcoded colors
grep -r "bg-\[#" components/ai/
grep -r "text-\[#" components/ai/
grep -r "border-\[#" components/ai/
```

**Step 2: Fix QuokkaAssistantModal** (25 min)
```tsx
// BEFORE (app/globals.css)
.ai-gradient {
  background: linear-gradient(135deg, #8A6B3D 0%, #2D6CDF 100%);
}

// AFTER
.ai-gradient {
  @apply bg-gradient-to-br from-primary to-accent;
}

// BEFORE (component)
<div className="glass-text">

// AFTER
<div className="text-foreground">
```

**Step 3: Fix SourcesPanel** (15 min)
```tsx
// BEFORE
className="border-gray-200 dark:border-gray-700"

// AFTER
className="border-border"

// BEFORE
className="bg-gray-50 dark:bg-gray-800"

// AFTER
className="bg-card"
```

**Step 4: Fix QDSConversation** (10 min)
```tsx
// BEFORE
className="bg-blue-50 dark:bg-blue-900/20"

// AFTER
className="bg-accent/10 dark:bg-accent/20"
```

**Step 5: Fix globals.css** (5 min)
```css
/* BEFORE */
.shadow-glass-sm {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* AFTER */
.shadow-glass-sm {
  box-shadow: var(--shadow-glass-sm);
}
```

### Verification
```bash
# Run build to verify no errors
npm run build

# Visual check in browser (both light and dark modes)
npm run dev

# Check for remaining hardcoded colors
grep -r "bg-\[#\|text-\[#\|border-\[#" components/ai/
# Expected: 0 matches
```

---

## Task 2: Optimize React Query Settings ⚡

**Priority:** Medium (reduces unnecessary network calls)
**Effort:** 30 minutes
**Impact:** Better performance, reduced API load

### Current Issues

1. **No default staleTime** - Queries refetch too frequently
2. **No default cacheTime** - Cache cleared too early
3. **Aggressive refetchOnWindowFocus** - Unnecessary refetches
4. **No retry configuration** - May retry failed requests indefinitely

### Implementation

**File:** `app/layout.tsx` (QueryClient provider)

```tsx
// BEFORE
const queryClient = new QueryClient();

// AFTER
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Only refetch on window focus if data is stale
      refetchOnWindowFocus: 'always', // Will respect staleTime

      // Retry failed requests 2 times (not indefinitely)
      retry: 2,

      // Exponential backoff (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});
```

### Specific Query Overrides

**For frequently changing data** (conversations, messages):
```tsx
// lib/api/hooks.ts

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversationMessages", conversationId],
    queryFn: () => api.getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds (override default 5min)
  });
}
```

**For rarely changing data** (courses, users):
```tsx
export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
    staleTime: 30 * 60 * 1000, // 30 minutes (user rarely changes)
  });
}
```

### Verification
```bash
# Check React Query DevTools in browser
# 1. Open app
# 2. Check query status (fresh vs stale)
# 3. Switch tabs - verify no unnecessary refetches
# 4. Wait 5 min - verify queries become stale
```

---

## Task 3: Component Refactor - Extract Business Logic 🏗️

**Priority:** Medium (improves testability, maintainability)
**Effort:** 6 hours
**Impact:** Smaller components (<200 LoC), easier testing, better reusability

### Current State

**File:** `components/ai/quokka-assistant-modal.tsx`
- **Size:** ~550 lines (target: <200)
- **Responsibilities:** UI + business logic + state management
- **Issues:**
  - Hard to test (tightly coupled)
  - Hard to reuse (modal-specific)
  - Hard to understand (too many concerns)

### Refactor Plan

#### Step 1: Extract Business Logic Hook (2h)

**File:** `lib/hooks/useQuokkaAssistant.ts` (new)

```tsx
/**
 * useQuokkaAssistant - Business logic for AI assistant
 *
 * Handles:
 * - Conversation lifecycle (create, load, delete)
 * - Message sending and streaming
 * - Course context management
 * - Accessibility announcements
 *
 * Usage:
 * ```tsx
 * const assistant = useQuokkaAssistant({
 *   isOpen: true,
 *   pageContext: 'course',
 *   courseId: 'cs101',
 * });
 *
 * <QuokkaAssistantPanel {...assistant} />
 * ```
 */
export function useQuokkaAssistant(options: {
  isOpen: boolean;
  pageContext: 'dashboard' | 'course' | 'instructor';
  currentCourseId?: string;
  currentCourseName?: string;
  currentCourseCode?: string;
  availableCourses?: CourseSummary[];
}) {
  // All useState, useEffect, custom logic here
  // Returns: { messages, input, isStreaming, handleSubmit, ... }
}
```

**Benefits:**
- ✅ Testable in isolation (no DOM)
- ✅ Reusable across different UIs
- ✅ Single responsibility (business logic only)

#### Step 2: Create Reusable Panel Component (2h)

**File:** `components/ai/quokka-assistant-panel.tsx` (new)

```tsx
/**
 * QuokkaAssistantPanel - Reusable AI chat UI
 *
 * Props-driven, no business logic, <200 LoC
 *
 * Can be used in:
 * - Modal (QuokkaAssistantModal)
 * - Sidebar
 * - Fullscreen page
 * - Embedded widget
 */
export function QuokkaAssistantPanel({
  // All data via props
  messages,
  input,
  isStreaming,
  onSubmit,
  onInputChange,
  onCopy,
  onRetry,
  onStop,
  courseContext,
  quickPrompts,

  // Accessibility
  statusMessage,
  errorMessage,
  messageInputRef,
}: QuokkaAssistantPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PanelHeader courseContext={courseContext} />

      {/* Messages */}
      <QDSConversation
        messages={messages}
        isStreaming={isStreaming}
        onCopy={onCopy}
        onRetry={onRetry}
      />

      {/* Input */}
      <PanelFooter
        input={input}
        isStreaming={isStreaming}
        onSubmit={onSubmit}
        onInputChange={onInputChange}
        onStop={onStop}
        quickPrompts={quickPrompts}
        inputRef={messageInputRef}
      />

      {/* ARIA live regions */}
      <StatusAnnouncer message={statusMessage} />
      <ErrorAnnouncer message={errorMessage} />
    </div>
  );
}
```

**Benefits:**
- ✅ <200 LoC (component architecture guideline C-5)
- ✅ Props-driven (no hardcoded values - C-3)
- ✅ Reusable (can use in modal, sidebar, page)
- ✅ Easy to test (Storybook, visual regression)

#### Step 3: Create Unified Dialog Component (1.5h)

**File:** `components/ai/quokka-confirmation-dialogs.tsx` (new)

```tsx
/**
 * QuokkaConfirmationDialogs - All alert dialogs in one place
 *
 * Consolidates:
 * - Clear conversation confirmation
 * - Post to thread confirmation
 * - Post success dialog
 */
export function QuokkaConfirmationDialogs({
  showClearConfirm,
  showPostConfirm,
  showPostSuccess,
  onClearConfirm,
  onPostConfirm,
  onPostSuccess,
  onCancel,
  activeCourse,
}: QuokkaConfirmationDialogsProps) {
  return (
    <>
      <ClearConversationDialog
        open={showClearConfirm}
        onConfirm={onClearConfirm}
        onCancel={onCancel}
      />

      <PostThreadDialog
        open={showPostConfirm}
        onConfirm={onPostConfirm}
        onCancel={onCancel}
        course={activeCourse}
      />

      <PostSuccessDialog
        open={showPostSuccess}
        onConfirm={onPostSuccess}
        onCancel={onCancel}
      />
    </>
  );
}
```

#### Step 4: Update QuokkaAssistantModal to Use New Components (30min)

**File:** `components/ai/quokka-assistant-modal.tsx` (refactored)

```tsx
/**
 * QuokkaAssistantModal - Thin wrapper using extracted components
 *
 * Line count: ~150 (down from 550)
 */
export function QuokkaAssistantModal(props: QuokkaAssistantModalProps) {
  // Use extracted hook
  const assistant = useQuokkaAssistant({
    isOpen: props.isOpen,
    pageContext: props.pageContext,
    currentCourseId: props.currentCourseId,
    // ...other props
  });

  return (
    <>
      <Dialog open={props.isOpen} onOpenChange={props.onClose}>
        <DialogContent>
          {/* Use reusable panel */}
          <QuokkaAssistantPanel
            {...assistant}
            courseContext={assistant.activeCourse}
          />
        </DialogContent>
      </Dialog>

      {/* Use unified dialogs */}
      <QuokkaConfirmationDialogs {...assistant.dialogs} />
    </>
  );
}
```

**Result:** 150 LoC (73% reduction from 550 LoC)

### Verification

```bash
# Build succeeds
npm run build

# All functionality works
npm run dev
# Test: open modal, send message, clear, post thread

# Component sizes
wc -l components/ai/quokka-assistant-modal.tsx  # <200
wc -l components/ai/quokka-assistant-panel.tsx  # <200
wc -l lib/hooks/useQuokkaAssistant.ts           # ~300 (acceptable for hook)
```

---

## Sprint 2 Summary

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| QDS Fixes | 65min | Medium | Pending |
| React Query Optimization | 30min | Medium | Pending |
| Component Refactor | 6h | Medium | Pending |
| **Total** | **7.5h** | - | - |

### Success Criteria

- ✅ Zero hardcoded colors in AI components
- ✅ React Query staleTime configured (5min default)
- ✅ All components <200 LoC
- ✅ Business logic extracted to hook
- ✅ Build succeeds with 0 errors
- ✅ All functionality preserved

### Deferred to Sprint 3

- A11y Medium Priority (6h) - Keyboard shortcuts, advanced ARIA
- Monitoring & Logging (2.5h) - Error tracking, analytics
- Performance Optimizations (3h) - Bundle splitting, lazy loading
- Legacy Code Cleanup (1h) - Remove unused code

---

**Next:** Start with Task 1 (QDS Fixes) - Quick wins, visible improvements

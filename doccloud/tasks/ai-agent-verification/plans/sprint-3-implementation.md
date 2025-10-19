# Sprint 3: Post-Launch Polish - Implementation Plan

**Started:** 2025-10-18
**Goal:** High-value enhancements and cleanup
**Estimated Duration:** 3-4 hours (focused on quick wins)

---

## Overview

Sprint 3 focuses on **quick wins** that provide measurable value without major refactoring. The application is already production-ready from Sprints 1 & 2.

**Strategy:** Focus on highest ROI tasks
- ✅ Legacy code cleanup (quick, measurable)
- ✅ Performance optimizations (lazy loading, bundle size)
- ✅ A11y enhancements (keyboard shortcuts for power users)
- ⏸️ Skip monitoring/logging (can be added post-deployment)

**Estimated:** 3-4 hours (vs original 12.5h plan)

---

## Task 1: Legacy Code Cleanup 🧹

**Priority:** High (reduces confusion, maintenance burden)
**Effort:** 30 minutes
**Impact:** Cleaner codebase, faster builds

### What to Remove

1. **Backup files** - Not needed (git provides version history)
   - `components/ai/quokka-assistant-modal.backup.tsx` (850 lines)

2. **Unused imports** - Found by lint warnings
   - Remove unused components, types, utilities

3. **Dead code** - Code that's never called
   - Check for unused exports in types.ts
   - Remove commented-out code blocks

### Implementation

**Step 1: Remove backup file** (5 min)
```bash
# This file was created during refactoring but is no longer needed
rm components/ai/quokka-assistant-modal.backup.tsx
```

**Step 2: Clean unused imports** (15 min)
```bash
# Find files with unused imports
npm run lint | grep "is defined but never used"

# Fix automatically where possible
npm run lint --fix
```

**Step 3: Manual cleanup** (10 min)
- Review each warning
- Remove unused imports
- Verify build still succeeds

### Verification
```bash
# Build should succeed
npm run build

# Check file was removed
ls components/ai/quokka-assistant-modal.backup.tsx
# Expected: file not found

# Verify no new warnings
npm run lint | wc -l
# Expected: fewer warnings than before
```

---

## Task 2: Performance Optimization - Lazy Loading 🚀

**Priority:** Medium (improves initial load time)
**Effort:** 45 minutes
**Impact:** Faster page loads, better user experience

### Current State

All AI components load on initial page load, even if not used.

**Bundle Analysis:**
```bash
npm run build
# Check .next/static/chunks for sizes
```

### Lazy Load Candidates

1. **QuokkaAssistantModal** - Not needed until user clicks "Ask Quokka"
2. **QDSConversation** - Heavy component (AI Elements)
3. **Chart components** (if any) - Only used on instructor dashboard

### Implementation

**Step 1: Lazy load QuokkaAssistantModal** (20 min)

```tsx
// BEFORE: app/page.tsx or dashboard layout
import { QuokkaAssistantModal } from "@/components/ai/quokka-assistant-modal";

// AFTER: Dynamic import
import dynamic from "next/dynamic";

const QuokkaAssistantModal = dynamic(
  () => import("@/components/ai/quokka-assistant-modal").then(mod => ({ default: mod.QuokkaAssistantModal })),
  {
    loading: () => <div className="sr-only">Loading Quokka Assistant...</div>,
    ssr: false, // Modal doesn't need SSR
  }
);
```

**Step 2: Lazy load AI Elements** (15 min)

```tsx
// components/ai/elements/index.ts
// Export dynamic versions for lazy loading

import dynamic from "next/dynamic";

export const QDSConversation = dynamic(
  () => import("./qds-conversation").then(mod => ({ default: mod.QDSConversation })),
  { ssr: false }
);

export const QDSPromptInput = dynamic(
  () => import("./qds-prompt-input").then(mod => ({ default: mod.QDSPromptInput })),
  { ssr: false }
);
```

**Step 3: Code splitting for routes** (10 min)

```tsx
// app/instructor/layout.tsx
// Lazy load instructor-specific components

const InstructorMetrics = dynamic(
  () => import("@/components/instructor/metrics"),
  { loading: () => <div>Loading metrics...</div> }
);
```

### Expected Results

- **Initial bundle:** -50KB to -100KB
- **First contentful paint:** -200ms to -500ms
- **Time to interactive:** -300ms to -800ms

### Verification
```bash
# Build and check bundle sizes
npm run build

# Compare .next/static/chunks sizes
# Look for:
# - Smaller main bundle
# - New dynamic chunks (good!)

# Test in browser:
# 1. Open DevTools Network tab
# 2. Hard refresh homepage
# 3. Verify AI components NOT loaded
# 4. Click "Ask Quokka"
# 5. Verify components load on-demand
```

---

## Task 3: A11y Medium Priority - Keyboard Shortcuts ⌨️

**Priority:** Medium (power user feature)
**Effort:** 1.5 hours
**Impact:** Better experience for keyboard users, productivity boost

### Keyboard Shortcuts to Add

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + K` | Open Quokka Assistant | Global |
| `Esc` | Close modal | Modal open |
| `Ctrl/Cmd + Enter` | Send message | Input focused |
| `Ctrl/Cmd + Shift + C` | Clear conversation | Modal open |
| `?` | Show keyboard shortcuts help | Global |

### Implementation

**Step 1: Create keyboard hook** (30 min)

```tsx
// lib/hooks/useKeyboardShortcuts.ts

export function useKeyboardShortcuts(handlers: {
  onOpenQuokka?: () => void;
  onCloseModal?: () => void;
  onSendMessage?: () => void;
  onClearConversation?: () => void;
  onShowHelp?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModKey = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + K: Open Quokka
      if (isModKey && e.key === 'k') {
        e.preventDefault();
        handlers.onOpenQuokka?.();
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        handlers.onCloseModal?.();
      }

      // Ctrl/Cmd + Enter: Send message
      if (isModKey && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSendMessage?.();
      }

      // Ctrl/Cmd + Shift + C: Clear
      if (isModKey && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        handlers.onClearConversation?.();
      }

      // ?: Show help
      if (e.key === '?' && !isModKey) {
        handlers.onShowHelp?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

**Step 2: Integrate into QuokkaAssistantModal** (20 min)

```tsx
// components/ai/quokka-assistant-modal.tsx

import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export function QuokkaAssistantModal(props) {
  // ... existing code ...

  useKeyboardShortcuts({
    onCloseModal: () => {
      if (isOpen && !isStreaming) {
        props.onClose();
      }
    },
    onSendMessage: () => {
      if (isOpen && input.trim() && !isStreaming) {
        handleSubmit();
      }
    },
    onClearConversation: () => {
      if (isOpen && messages.length > 0) {
        setShowClearConfirm(true);
      }
    },
  });

  // ... rest of component ...
}
```

**Step 3: Add keyboard shortcut help dialog** (40 min)

```tsx
// components/ai/keyboard-shortcuts-dialog.tsx

export function KeyboardShortcutsDialog({ open, onClose }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <ShortcutRow shortcut="Ctrl/Cmd + K" action="Open Quokka Assistant" />
          <ShortcutRow shortcut="Esc" action="Close modal" />
          <ShortcutRow shortcut="Ctrl/Cmd + Enter" action="Send message" />
          <ShortcutRow shortcut="Ctrl/Cmd + Shift + C" action="Clear conversation" />
          <ShortcutRow shortcut="?" action="Show this help" />
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### ARIA Announcements

```tsx
// Announce shortcut help availability
<div role="status" aria-live="polite" className="sr-only">
  Press question mark for keyboard shortcuts
</div>
```

### Verification
```bash
# Build succeeds
npm run build

# Manual testing:
# 1. Press Ctrl+K → modal opens
# 2. Type message, press Ctrl+Enter → sends
# 3. Press Esc → modal closes
# 4. Press ? → help dialog appears
```

---

## Task 4: Final Verification & Documentation 📝

**Priority:** High (ensures quality)
**Effort:** 30 minutes

### Verification Checklist

**Build & Tests:**
```bash
# TypeScript compilation
npx tsc --noEmit
# Expected: 0 errors

# Production build
npm run build
# Expected: Success

# Lint
npm run lint
# Expected: Only warnings (unused vars OK)
```

**Manual Testing:**
- [ ] Modal opens/closes smoothly
- [ ] Messages send and stream correctly
- [ ] Keyboard shortcuts work
- [ ] Lazy loading works (check Network tab)
- [ ] Dark mode works
- [ ] Mobile responsive (360px, 768px, 1024px)

**Accessibility:**
- [ ] Screen reader announces status changes
- [ ] Focus visible on all elements
- [ ] Keyboard navigation works
- [ ] ARIA labels present

### Documentation Updates

1. **Update README** - Add keyboard shortcuts section
2. **Update EXECUTIVE-SUMMARY** - Mark Sprint 3 complete
3. **Create FINAL-REPORT** - Consolidated verification results

---

## Sprint 3 Summary (Planned)

| Task | Effort | Priority | Value |
|------|--------|----------|-------|
| Legacy Cleanup | 30min | High | High ✅ |
| Performance (Lazy Load) | 45min | Medium | High ✅ |
| A11y (Keyboard Shortcuts) | 1.5h | Medium | Medium ✅ |
| Final Verification | 30min | High | High ✅ |
| **Total** | **3.25h** | - | - |

**Deferred (Low ROI):**
- Monitoring & Logging (2.5h) - Better added post-deployment
- Advanced performance (2h) - Current performance is good
- A11y low priority (3h) - Current compliance is excellent

---

## Success Criteria

- ✅ Zero backup files in codebase
- ✅ Fewer lint warnings
- ✅ Initial bundle size reduced by >50KB
- ✅ Keyboard shortcuts functional
- ✅ Build succeeds with 0 errors
- ✅ All manual tests pass

---

**Next:** Start with Task 1 (Legacy Cleanup) - Quick, visible improvement

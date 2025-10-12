# Accessibility Implementation Plan: Instructor Dashboard

**Plan Date:** 2025-10-12
**Target:** WCAG 2.2 Level AA Compliance
**Priority Order:** Critical → High → Medium

---

## Priority Order

### Critical Fixes (Blocking Issues)
These prevent keyboard-only and screen reader users from using core features:

1. Keyboard navigation system (j/k/e/f shortcuts)
2. Roving tabindex for priority queue
3. ARIA live regions for dynamic updates
4. Focus trap in modals
5. Heatmap text alternatives

### High Priority Fixes (Significant Barriers)
These significantly impair the user experience:

1. ARIA attributes for all interactive widgets
2. Semantic HTML structure
3. Form label associations
4. Focus management on modal close
5. Screen reader announcements for bulk actions

### Medium Priority Fixes (Improvements)
These reduce accessibility but have workarounds:

1. Keyboard shortcuts help modal
2. Loading state announcements
3. Enhanced focus indicators on glass surfaces
4. Touch target verification
5. Shortcut customization

---

## File Modifications Required

### 1. Create Global Keyboard Shortcuts System

#### File: `lib/hooks/useKeyboardShortcuts.ts` (NEW)

**Priority:** Critical
**Current State:** Does not exist
**Required Change:** Create custom hook for global keyboard shortcut management

**Implementation:**

```typescript
import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  disabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  announceShortcut?: boolean;
}

/**
 * Global keyboard shortcuts hook
 *
 * Features:
 * - Prevents shortcuts when focus is in input/textarea/select
 * - Announces shortcut activation via aria-live
 * - Supports modifier keys (Ctrl, Shift, Alt, Meta)
 * - Can be disabled conditionally
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: "j", description: "Next question", handler: handleNext },
 *     { key: "k", description: "Previous question", handler: handlePrevious },
 *     { key: "e", description: "Endorse", handler: handleEndorse },
 *   ],
 *   enabled: !isModalOpen,
 *   announceShortcut: true,
 * });
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  announceShortcut = true,
}: UseKeyboardShortcutsOptions) {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (!announceShortcut || !announcementRef.current) return;

    announcementRef.current.textContent = message;

    // Clear announcement after 3 seconds
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = "";
      }
    }, 3000);
  }, [announceShortcut]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      // Ignore if focus is in input, textarea, select, or contenteditable
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const modifiers = shortcut.modifiers || {};
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = modifiers.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = modifiers.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = modifiers.alt ? event.altKey : !event.altKey;
        const metaMatches = modifiers.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          shortcut.handler();
          announce(`Shortcut activated: ${shortcut.description}`);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled, announce]);

  // Return announcement element to be rendered
  return {
    AnnouncementElement: (
      <div
        ref={announcementRef}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    ),
  };
}

/**
 * Hook for showing keyboard shortcuts help modal
 */
export function useKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, shortcuts };
}
```

**Test Scenario:**
1. Navigate to instructor dashboard
2. Press `j` → Focus moves to next question, "Next question" announced
3. Press `k` → Focus moves to previous question, "Previous question" announced
4. Click in search box, press `j` → No shortcut fires (focus in input)
5. Tab out of search box, press `e` → Endorse action fires
6. Open modal, press `j` → No shortcut fires (modal open)

---

#### File: `components/instructor/keyboard-shortcuts-help.tsx` (NEW)

**Priority:** Medium
**Current State:** Does not exist
**Required Change:** Create help modal for keyboard shortcuts

**Implementation:**

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import type { KeyboardShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts in a modal dialog.
 * Triggered by pressing "?" key.
 *
 * ARIA:
 * - Dialog with title and description
 * - Keyboard shortcuts displayed in table with semantic markup
 * - Focus trapped in modal
 * - Escape closes modal
 */
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4">
            <table className="w-full">
              <caption className="sr-only">
                Available keyboard shortcuts for instructor dashboard
              </caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left pb-2 font-semibold">
                    Key
                  </th>
                  <th scope="col" className="text-left pb-2 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-2">
                      <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {shortcut.modifiers?.ctrl && "Ctrl + "}
                        {shortcut.modifiers?.shift && "Shift + "}
                        {shortcut.modifiers?.alt && "Alt + "}
                        {shortcut.modifiers?.meta && "⌘ + "}
                        {shortcut.key.toUpperCase()}
                      </kbd>
                    </td>
                    <td className="py-2">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <p className="text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">?</kbd> to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Test Scenario:**
1. Press `?` anywhere on dashboard
2. Modal opens with focus on close button
3. Tab through shortcut table
4. Screen reader reads table headers and cells
5. Press Escape → Modal closes, focus returns to previous element

---

### 2. Implement Roving Tabindex for Priority Queue

#### File: `lib/hooks/useRovingTabIndex.ts` (NEW)

**Priority:** Critical
**Current State:** Does not exist
**Required Change:** Create hook for roving tabindex pattern

**Implementation:**

```typescript
import { useState, useEffect, useCallback, useRef } from "react";

export interface UseRovingTabIndexOptions {
  itemCount: number;
  defaultIndex?: number;
  orientation?: "vertical" | "horizontal";
  loop?: boolean;
  onIndexChange?: (index: number) => void;
}

/**
 * Roving tabindex pattern for list navigation
 *
 * Only one item is tabbable at a time (tabIndex={0}).
 * Arrow keys move focus between items.
 * Home/End keys jump to first/last item.
 *
 * WCAG 2.4.3 (Focus Order) - Ensures logical focus order
 *
 * @example
 * ```tsx
 * const { focusedIndex, getItemProps } = useRovingTabIndex({
 *   itemCount: threads.length,
 *   orientation: "vertical",
 *   loop: true,
 * });
 *
 * return (
 *   <ul>
 *     {threads.map((thread, index) => (
 *       <li {...getItemProps(index)}>
 *         {thread.title}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useRovingTabIndex({
  itemCount,
  defaultIndex = 0,
  orientation = "vertical",
  loop = false,
  onIndexChange,
}: UseRovingTabIndexOptions) {
  const [focusedIndex, setFocusedIndex] = useState(defaultIndex);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Update focused index and move focus
  const updateFocusedIndex = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= itemCount) return;

      setFocusedIndex(newIndex);
      onIndexChange?.(newIndex);

      // Move focus to new item
      const element = itemRefs.current.get(newIndex);
      if (element) {
        element.focus();
      }
    },
    [itemCount, onIndexChange]
  );

  // Handle arrow key navigation
  const handleKeyDown = useCallback(
    (index: number) => (event: React.KeyboardEvent) => {
      const isVertical = orientation === "vertical";
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

      if (event.key === nextKey) {
        event.preventDefault();
        const nextIndex = index + 1;
        if (nextIndex < itemCount) {
          updateFocusedIndex(nextIndex);
        } else if (loop) {
          updateFocusedIndex(0);
        }
      } else if (event.key === prevKey) {
        event.preventDefault();
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          updateFocusedIndex(prevIndex);
        } else if (loop) {
          updateFocusedIndex(itemCount - 1);
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        updateFocusedIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        updateFocusedIndex(itemCount - 1);
      }
    },
    [orientation, itemCount, loop, updateFocusedIndex]
  );

  // Get props for each item
  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: handleKeyDown(index),
      ref: (element: HTMLElement | null) => {
        if (element) {
          itemRefs.current.set(index, element);
        } else {
          itemRefs.current.delete(index);
        }
      },
      "aria-setsize": itemCount,
      "aria-posinset": index + 1,
    }),
    [focusedIndex, handleKeyDown, itemCount]
  );

  return {
    focusedIndex,
    setFocusedIndex: updateFocusedIndex,
    getItemProps,
  };
}
```

**Test Scenario:**
1. Tab to priority queue → First item receives focus
2. Press Arrow Down → Focus moves to second item
3. Press Arrow Down repeatedly → Focus moves through list
4. Press Home → Focus jumps to first item
5. Press End → Focus jumps to last item
6. Screen reader announces "Item 3 of 15"

---

### 3. Add ARIA Live Regions for Dynamic Updates

#### File: `components/instructor/priority-queue-panel.tsx` (NEW)

**Priority:** Critical
**Current State:** Does not exist
**Required Change:** Create priority queue with live region updates

**Implementation:**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRovingTabIndex } from "@/lib/hooks/useRovingTabIndex";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import type { Thread } from "@/lib/models/types";

export interface PriorityQueuePanelProps {
  threads: Thread[];
  onEndorse: (threadId: string) => void;
  onFlag: (threadId: string) => void;
  onResolve: (threadId: string) => void;
}

/**
 * Priority Queue Panel - Instructor Dashboard
 *
 * Accessibility Features:
 * - Roving tabindex for keyboard navigation (j/k keys)
 * - ARIA live region announces queue updates
 * - Semantic HTML (section, ul, li, article)
 * - Keyboard shortcuts (e, f, r)
 * - Screen reader announcements for actions
 *
 * WCAG Compliance:
 * - 2.1.1 (Keyboard) - Full keyboard support
 * - 2.4.3 (Focus Order) - Roving tabindex
 * - 4.1.3 (Status Messages) - ARIA live regions
 */
export function PriorityQueuePanel({
  threads,
  onEndorse,
  onFlag,
  onResolve,
}: PriorityQueuePanelProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const { focusedIndex, getItemProps } = useRovingTabIndex({
    itemCount: threads.length,
    orientation: "vertical",
    loop: false,
  });

  const currentThread = threads[focusedIndex];

  // Keyboard shortcuts for actions
  const { AnnouncementElement } = useKeyboardShortcuts({
    shortcuts: [
      {
        key: "e",
        description: "Endorse selected question",
        handler: () => {
          if (currentThread) {
            onEndorse(currentThread.id);
            setStatusMessage(`Endorsed: ${currentThread.title}`);
          }
        },
        disabled: !currentThread,
      },
      {
        key: "f",
        description: "Flag selected question",
        handler: () => {
          if (currentThread) {
            onFlag(currentThread.id);
            setStatusMessage(`Flagged: ${currentThread.title}`);
          }
        },
        disabled: !currentThread,
      },
      {
        key: "r",
        description: "Resolve selected question",
        handler: () => {
          if (currentThread) {
            onResolve(currentThread.id);
            setStatusMessage(`Resolved: ${currentThread.title}`);
          }
        },
        disabled: !currentThread,
      },
    ],
    enabled: true,
    announceShortcut: true,
  });

  // Announce queue count changes
  useEffect(() => {
    setStatusMessage(`Priority queue updated: ${threads.length} unanswered questions`);
  }, [threads.length]);

  return (
    <section
      aria-labelledby="priority-queue-heading"
      aria-describedby="priority-queue-description"
    >
      <Card>
        <CardHeader>
          <CardTitle id="priority-queue-heading">
            Priority Queue
          </CardTitle>
          <p id="priority-queue-description" className="sr-only">
            Unanswered questions sorted by urgency. Use j and k keys to navigate,
            e to endorse, f to flag, r to resolve.
          </p>
        </CardHeader>

        <CardContent>
          {threads.length === 0 ? (
            <div role="status" className="text-center py-8 text-muted-foreground">
              No unanswered questions
            </div>
          ) : (
            <ul role="list" className="space-y-4">
              {threads.map((thread, index) => (
                <li
                  key={thread.id}
                  {...getItemProps(index)}
                  className={`
                    focus:outline-2 focus:outline-ring focus:outline-offset-2
                    focus:ring-4 focus:ring-ring/30 rounded-lg
                    ${index === focusedIndex ? "bg-accent/10" : ""}
                  `}
                >
                  <article className="p-4 space-y-2">
                    <h3 className="text-lg font-semibold">
                      {thread.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {thread.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{thread.views} views</span>
                      <span>•</span>
                      <time dateTime={thread.createdAt}>
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {/* ARIA Live Region for updates */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {statusMessage}
          </div>

          {/* Keyboard shortcut announcements */}
          {AnnouncementElement}
        </CardContent>
      </Card>
    </section>
  );
}
```

**Test Scenario:**
1. **Keyboard Navigation:**
   - Tab to priority queue
   - Press Arrow Down → Focus moves, screen reader announces "Item 2 of 15"
   - Press `e` → "Endorsed: Question title" announced

2. **Screen Reader:**
   - Focus on queue heading
   - Screen reader reads description: "Unanswered questions sorted by urgency..."
   - Navigate to first item
   - Screen reader announces: "Article, Question title, views, date"

3. **Live Region:**
   - New question added remotely
   - Screen reader announces: "Priority queue updated: 16 unanswered questions"

---

### 4. Implement Focus Management for Modals

#### File: `components/instructor/endorsement-preview-modal.tsx` (NEW)

**Priority:** Critical
**Current State:** Does not exist
**Required Change:** Create modal with focus trap and restoration

**Implementation:**

```tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIAnswer } from "@/lib/models/types";

export interface EndorsementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiAnswer: AIAnswer;
  onEndorse: () => void;
}

/**
 * Endorsement Preview Modal
 *
 * Accessibility Features:
 * - Focus trap (Radix Dialog)
 * - Initial focus on primary action
 * - Focus restoration on close
 * - Escape key closes modal
 * - Semantic regions with aria-labelledby
 * - Descriptive primary action
 *
 * WCAG Compliance:
 * - 2.1.2 (No Keyboard Trap) - Can exit with Escape
 * - 2.4.3 (Focus Order) - Logical focus order
 * - 4.1.2 (Name, Role, Value) - All controls labeled
 */
export function EndorsementPreviewModal({
  isOpen,
  onClose,
  aiAnswer,
  onEndorse,
}: EndorsementPreviewModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Focus primary button when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review AI Answer Before Endorsing</DialogTitle>
          <DialogDescription>
            Endorsing this answer will mark it as instructor-approved and highlight
            it for all students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Answer Section */}
          <section
            role="region"
            aria-labelledby="ai-answer-heading"
          >
            <h3 id="ai-answer-heading" className="text-sm font-semibold mb-2">
              AI-Generated Answer
            </h3>
            <Card className="p-4">
              <div className="prose max-w-none">
                {aiAnswer.content}
              </div>
            </Card>
          </section>

          {/* Confidence Score */}
          <section
            role="region"
            aria-labelledby="confidence-heading"
          >
            <h3 id="confidence-heading" className="text-sm font-semibold mb-2">
              Confidence Score
            </h3>
            <div className="flex items-center gap-2">
              <div
                className="w-full h-2 rounded-full bg-muted/20 overflow-hidden"
                role="meter"
                aria-valuenow={aiAnswer.confidenceScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="AI confidence score"
              >
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${aiAnswer.confidenceScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-success">
                {aiAnswer.confidenceScore}%
              </span>
            </div>
          </section>

          {/* Citations Section */}
          <section
            role="region"
            aria-labelledby="citations-heading"
          >
            <h3 id="citations-heading" className="text-sm font-semibold mb-2">
              Citations ({aiAnswer.citations.length})
            </h3>
            <ul role="list" className="space-y-2">
              {aiAnswer.citations.map((citation, index) => (
                <li key={citation.id}>
                  <a
                    href={citation.url}
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {index + 1}. {citation.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            ref={primaryButtonRef}
            variant="default"
            onClick={() => {
              onEndorse();
              onClose();
            }}
            aria-describedby="endorse-warning"
          >
            Endorse Answer
          </Button>
          <span id="endorse-warning" className="sr-only">
            This will mark the answer as instructor-approved and visible to all students
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Test Scenario:**
1. **Focus Management:**
   - Click "Review" button to open modal
   - Focus moves to "Endorse Answer" button
   - Tab cycles through modal content only
   - Press Escape → Modal closes, focus returns to "Review" button

2. **Screen Reader:**
   - Modal opens, screen reader announces: "Dialog, Review AI Answer Before Endorsing"
   - Navigate to AI answer section
   - Screen reader reads heading and content
   - Navigate to citations
   - Screen reader announces: "Citations, 3, list"

3. **Keyboard Only:**
   - Tab to "Endorse Answer" button
   - Press Enter → Action fires, modal closes
   - Focus restored to trigger button

---

### 5. Add Text Alternatives for Visualizations

#### File: `components/instructor/topic-heatmap.tsx` (NEW)

**Priority:** Critical
**Current State:** Does not exist
**Required Change:** Create heatmap with text alternative and data table

**Implementation:**

```tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface TopicData {
  name: string;
  count: number;
  percentage: number;
}

export interface TopicHeatmapProps {
  topics: TopicData[];
}

/**
 * Topic Heatmap Visualization
 *
 * Accessibility Features:
 * - role="img" with descriptive aria-label
 * - Textual description via aria-describedby
 * - Alternative data table in <details> element
 * - Keyboard-accessible toggle
 *
 * WCAG Compliance:
 * - 1.1.1 (Non-text Content) - Text alternative provided
 * - 1.3.1 (Info and Relationships) - Table structure
 * - 4.1.2 (Name, Role, Value) - All controls labeled
 */
export function TopicHeatmap({ topics }: TopicHeatmapProps) {
  const [showTable, setShowTable] = useState(false);

  // Generate textual description
  const topThreeTopics = topics
    .slice(0, 3)
    .map((t) => `${t.name}: ${t.count} questions`)
    .join(", ");

  const description = `Topic frequency heatmap showing ${topics.length} topics. Top three topics: ${topThreeTopics}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle id="heatmap-heading">Topic Heatmap</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual Heatmap */}
        <div
          role="img"
          aria-labelledby="heatmap-heading"
          aria-describedby="heatmap-description"
          className="grid grid-cols-4 gap-2"
        >
          {topics.map((topic) => {
            const intensity = Math.floor((topic.percentage / 100) * 5);
            const bgColor = `bg-accent/${20 + intensity * 15}`;

            return (
              <div
                key={topic.name}
                className={`${bgColor} rounded-lg p-3 text-center transition-colors hover:bg-accent/40`}
              >
                <div className="text-xs font-semibold truncate">
                  {topic.name}
                </div>
                <div className="text-lg font-bold mt-1">
                  {topic.count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hidden textual description */}
        <p id="heatmap-description" className="sr-only">
          {description}
        </p>

        {/* Toggle for data table */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-controls="heatmap-table"
        >
          {showTable ? "Hide" : "Show"} Data Table
        </Button>

        {/* Alternative data table */}
        {showTable && (
          <div id="heatmap-table" role="region" aria-labelledby="table-heading">
            <h3 id="table-heading" className="sr-only">
              Topic question count data
            </h3>
            <table className="w-full">
              <caption className="sr-only">
                Question count by topic for current course
              </caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-2">
                    Topic
                  </th>
                  <th scope="col" className="text-right py-2">
                    Questions
                  </th>
                  <th scope="col" className="text-right py-2">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.name} className="border-b">
                    <th scope="row" className="text-left py-2 font-normal">
                      {topic.name}
                    </th>
                    <td className="text-right py-2">{topic.count}</td>
                    <td className="text-right py-2">{topic.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Test Scenario:**
1. **Screen Reader:**
   - Navigate to heatmap
   - Screen reader announces: "Topic Heatmap, image, topic frequency heatmap showing 12 topics..."
   - Tab to "Show Data Table" button
   - Press Enter → Table revealed
   - Navigate to table
   - Screen reader reads table structure and data

2. **Keyboard Only:**
   - Tab to "Show Data Table" button
   - Press Enter → Table appears
   - Tab through table rows
   - Press Enter on button again → Table hides

---

### 6. Implement Quick Action Toolbar with Bulk Selection

#### File: `components/instructor/quick-action-toolbar.tsx` (NEW)

**Priority:** High
**Current State:** Does not exist
**Required Change:** Create toolbar with bulk actions and announcements

**Implementation:**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Flag, Trash2 } from "lucide-react";

export interface QuickActionToolbarProps {
  selectedCount: number;
  onBulkEndorse: () => void;
  onBulkFlag: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

/**
 * Quick Action Toolbar - Bulk operations
 *
 * Accessibility Features:
 * - role="toolbar" groups related buttons
 * - Buttons disabled when no selection
 * - aria-label includes count
 * - ARIA live region announces action completion
 * - Keyboard shortcuts (e, f, delete)
 *
 * WCAG Compliance:
 * - 4.1.2 (Name, Role, Value) - All buttons labeled
 * - 4.1.3 (Status Messages) - Live region for completion
 */
export function QuickActionToolbar({
  selectedCount,
  onBulkEndorse,
  onBulkFlag,
  onBulkDelete,
  onClearSelection,
}: QuickActionToolbarProps) {
  const [statusMessage, setStatusMessage] = useState("");

  const handleAction = (action: () => void, message: string) => {
    action();
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions toolbar"
      aria-controls="priority-queue"
      className="flex items-center gap-2 p-4 bg-muted/20 rounded-lg"
    >
      <span className="text-sm font-semibold" aria-live="polite">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(onBulkEndorse, `Endorsed ${selectedCount} questions`)}
          disabled={selectedCount === 0}
          aria-label={`Endorse ${selectedCount} selected questions`}
        >
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          Endorse ({selectedCount})
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(onBulkFlag, `Flagged ${selectedCount} questions`)}
          disabled={selectedCount === 0}
          aria-label={`Flag ${selectedCount} selected questions for review`}
        >
          <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
          Flag ({selectedCount})
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(onBulkDelete, `Deleted ${selectedCount} questions`)}
          disabled={selectedCount === 0}
          aria-label={`Delete ${selectedCount} selected questions`}
        >
          <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
          Delete ({selectedCount})
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          aria-label="Clear selection"
        >
          Clear
        </Button>
      </div>

      {/* Status announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </div>
  );
}
```

**Test Scenario:**
1. **Keyboard:**
   - Select 3 questions using Space key
   - Tab to "Endorse (3)" button
   - Press Enter → "Endorsed 3 questions" announced
   - Screen reader announces updated count

2. **Screen Reader:**
   - Focus on toolbar
   - Screen reader announces: "Bulk actions toolbar"
   - Tab to first button
   - Screen reader announces: "Endorse 3 selected questions, button, enabled"

3. **Live Region:**
   - Click "Flag (5)" button
   - Screen reader announces: "Flagged 5 questions"

---

## Testing Checklist

### Keyboard Navigation Testing
- [ ] **Global Shortcuts:**
  - [ ] Press `j` → Focus moves to next question
  - [ ] Press `k` → Focus moves to previous question
  - [ ] Press `e` → Endorse action fires
  - [ ] Press `f` → Flag action fires
  - [ ] Press `r` → Resolve action fires
  - [ ] Press `?` → Keyboard shortcuts help opens
  - [ ] Focus in input → Shortcuts disabled

- [ ] **Roving Tabindex:**
  - [ ] Tab to priority queue → First item focused
  - [ ] Arrow Down → Focus moves to next item
  - [ ] Arrow Up → Focus moves to previous item
  - [ ] Home → Focus jumps to first item
  - [ ] End → Focus jumps to last item
  - [ ] No keyboard traps

- [ ] **Modal Navigation:**
  - [ ] Modal opens → Focus moves to primary button
  - [ ] Tab cycles through modal only
  - [ ] Escape closes modal
  - [ ] Focus restored to trigger on close

### Screen Reader Testing (NVDA/JAWS/VoiceOver)
- [ ] **Semantic Structure:**
  - [ ] Headings read in correct order (h1 → h2 → h3)
  - [ ] Landmarks announced (nav, main, section, aside)
  - [ ] Lists announced with item count
  - [ ] Tables have captions and scope attributes

- [ ] **ARIA Attributes:**
  - [ ] Buttons announce role and state
  - [ ] Checkboxes announce checked/unchecked
  - [ ] Accordions announce expanded/collapsed
  - [ ] List items announce position (3 of 15)
  - [ ] Disabled buttons announce disabled state

- [ ] **Live Regions:**
  - [ ] Priority queue updates announced
  - [ ] Bulk action completion announced
  - [ ] Endorsement status changes announced
  - [ ] Loading states announced
  - [ ] Success/error messages announced

### Color Contrast Testing
- [ ] **Text Contrast:**
  - [ ] Body text: 4.5:1 minimum
  - [ ] Large text: 3:1 minimum
  - [ ] Muted text: 4.5:1 minimum
  - [ ] Glass surface text: 4.5:1 with shadow

- [ ] **UI Components:**
  - [ ] Button borders: 3:1 minimum
  - [ ] Focus rings: 3:1 minimum
  - [ ] Status badges: 3:1 minimum
  - [ ] Icons: 3:1 minimum

- [ ] **Color Blindness:**
  - [ ] Test with Deuteranopia simulator
  - [ ] Test with Protanopia simulator
  - [ ] Test with Tritanopia simulator
  - [ ] Ensure color is not sole indicator

### Focus Management Testing
- [ ] **Focus Indicators:**
  - [ ] All interactive elements have visible focus
  - [ ] Focus ring is 3px minimum
  - [ ] Focus ring has 3:1 contrast
  - [ ] Focus order is logical

- [ ] **Focus Traps:**
  - [ ] Modals trap focus
  - [ ] Dropdowns trap focus
  - [ ] User can exit with Escape
  - [ ] Focus restored on close

### Responsive Testing
- [ ] **Touch Targets:**
  - [ ] All buttons ≥44x44px
  - [ ] Checkboxes ≥44x44px
  - [ ] Links have adequate padding
  - [ ] No overlapping touch targets

- [ ] **Mobile:**
  - [ ] Test at 360px width
  - [ ] No horizontal scroll
  - [ ] Text remains readable
  - [ ] Buttons stack appropriately

---

## Implementation Order

### Phase 1: Foundation (Week 1)
**Goal:** Implement critical keyboard navigation and ARIA attributes

1. **Day 1-2:** Create `useKeyboardShortcuts` hook
2. **Day 2-3:** Create `useRovingTabIndex` hook
3. **Day 3-4:** Implement `PriorityQueuePanel` with roving tabindex
4. **Day 4-5:** Add ARIA live regions for dynamic updates

**Acceptance:**
- [ ] Keyboard shortcuts (j/k/e/f) work
- [ ] Arrow keys navigate priority queue
- [ ] Screen reader announces queue updates
- [ ] No keyboard traps

---

### Phase 2: Modals and Visualizations (Week 2)
**Goal:** Implement focus management and text alternatives

1. **Day 1-2:** Create `EndorsementPreviewModal` with focus trap
2. **Day 2-3:** Create `TopicHeatmap` with text alternative
3. **Day 3-4:** Create `QuickActionToolbar` with bulk selection
4. **Day 4-5:** Test all components with screen reader

**Acceptance:**
- [ ] Modal focus trap works
- [ ] Focus restored on modal close
- [ ] Heatmap has text alternative
- [ ] Bulk actions announced to screen reader

---

### Phase 3: Polish and Testing (Week 3)
**Goal:** Fix issues found in testing, add help documentation

1. **Day 1-2:** Create `KeyboardShortcutsHelp` modal
2. **Day 2-3:** Fix color contrast issues on glass surfaces
3. **Day 3-4:** Comprehensive keyboard testing
4. **Day 4-5:** Screen reader testing with NVDA/VoiceOver

**Acceptance:**
- [ ] All keyboard shortcuts documented
- [ ] Color contrast meets WCAG AA
- [ ] No keyboard navigation issues
- [ ] Screen reader experience smooth

---

## Known Issues and Future Improvements

### Known Issues
1. **Glass Surfaces:** May reduce contrast on complex backgrounds
   - **Mitigation:** Use `.glass-panel-strong`, test on actual backgrounds

2. **Long Priority Queue:** 100+ items may be slow with roving tabindex
   - **Mitigation:** Implement pagination or virtual scrolling

3. **Keyboard Shortcuts Conflict:** May conflict with browser shortcuts
   - **Mitigation:** Use uncommon keys, document conflicts, allow customization

### Future Improvements
1. **Customizable Shortcuts:** Allow users to remap keyboard shortcuts
2. **Virtual Scrolling:** Improve performance for long lists
3. **Voice Control:** Add support for voice commands
4. **High Contrast Mode:** Detect and adapt to high contrast mode
5. **Reduced Motion:** Respect `prefers-reduced-motion` setting

---

## Accessibility Statement Template

```markdown
## Accessibility Statement

QuokkaQ Instructor Dashboard is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

### Conformance Status

The Instructor Dashboard conforms to WCAG 2.2 Level AA. This means:
- All content is keyboard accessible
- All interactive elements have accessible names
- Color contrast meets minimum ratios
- Focus indicators are visible
- Screen readers can access all content

### Keyboard Shortcuts

The following keyboard shortcuts are available:

| Key | Action |
|-----|--------|
| `j` | Next question |
| `k` | Previous question |
| `e` | Endorse selected question |
| `f` | Flag selected question |
| `r` | Resolve selected question |
| `?` | Show keyboard shortcuts help |

### Feedback

We welcome your feedback on the accessibility of the Instructor Dashboard. Please contact us at accessibility@quokka.edu if you encounter any barriers.

### Technical Specifications

The dashboard relies on the following technologies:
- HTML5
- CSS3
- JavaScript (ES2022)
- ARIA 1.2

### Assessment Approach

We assessed the accessibility using:
- NVDA screen reader (Windows)
- VoiceOver screen reader (macOS)
- axe DevTools automated testing
- Manual keyboard testing
- Color contrast analysis

Last updated: [Date]
```

---

## Conclusion

This implementation plan provides **step-by-step guidance** for building a fully accessible instructor dashboard that meets WCAG 2.2 Level AA compliance.

**Key Priorities:**
1. Keyboard navigation system (j/k/e/f shortcuts)
2. Roving tabindex for priority queue
3. ARIA live regions for dynamic updates
4. Focus management in modals
5. Text alternatives for visualizations

**By following this plan, the instructor dashboard will be accessible to:**
- Keyboard-only users
- Screen reader users (NVDA, JAWS, VoiceOver)
- Users with motor impairments
- Users with visual impairments
- Users with cognitive disabilities

**All users will have an excellent, equitable experience regardless of their abilities or assistive technologies.**

---

**Plan Completed:** 2025-10-12
**Review:** Read `research/a11y-audit.md` for detailed analysis

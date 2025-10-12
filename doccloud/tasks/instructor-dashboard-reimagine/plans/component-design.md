# Component Design Plan: Instructor Dashboard Components

**Task:** Design 8 instructor-specific components
**Date:** 2025-10-12
**Dependencies:** Must read `research/component-patterns.md` first

---

## Executive Summary

This plan provides step-by-step implementation for 8 instructor-specific components with complete props interfaces, file locations, composition strategies, and keyboard shortcut integration.

**Approach:** Extend existing patterns, prioritize props-driven design, ensure accessibility, and follow QDS v1.0 strictly.

**Estimated implementation:** 8-10 hours (1 hour per component + integration)

---

## Section 1: Component Architecture Overview

### 1.1 Component Hierarchy

```
InstructorDashboard (existing, /app/dashboard/page.tsx)
├── QuickActionToolbar (new)
│   ├── Button (shadcn)
│   └── Tooltip (shadcn)
├── Grid Container (layout)
│   ├── PriorityQueuePanel (new)
│   │   ├── PriorityQueueItem (sub-component)
│   │   ├── Card (shadcn)
│   │   └── Badge (shadcn)
│   ├── Sidebar Container
│   │   ├── FAQClusterCard (new)
│   │   │   ├── FAQClusterItem (sub-component)
│   │   │   ├── Accordion (shadcn)
│   │   │   └── Card (shadcn)
│   │   ├── TopicHeatmap (new)
│   │   │   └── Card (shadcn)
│   │   └── StudentEngagementCard (new)
│   │       └── StatCard (existing)
├── EndorsementPreviewModal (new, portal)
│   ├── Dialog (shadcn)
│   ├── Button (shadcn)
│   └── Badge (shadcn)
├── ResponseTemplatePicker (new, dropdown)
│   ├── DropdownMenu (shadcn)
│   └── Card (shadcn)
└── InstructorAIAgent (QuokkaTA) (new, portal)
    ├── FocusScope (radix)
    ├── Card (shadcn)
    └── Button (shadcn)
```

### 1.2 Layout Grid

```
┌─────────────────────────────────────────────────────────┐
│ QuickActionToolbar                                      │
│ [j/k nav] [e endorse] [f flag] [? help]                │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────────────┬──────────────────────┐
│ PriorityQueuePanel (lg:col-span-2)│ Sidebar (lg:col-span-1)│
│                                  │                      │
│ [High priority threads]          │ FAQClusterCard       │
│ [Smart-ranked list]              │ TopicHeatmap         │
│ [Inline actions]                 │ StudentEngagementCard│
└──────────────────────────────────┴──────────────────────┘

Floating Components:
- InstructorAIAgent (QuokkaTA) - Top-right
- EndorsementPreviewModal - Center overlay
- ResponseTemplatePicker - Inline dropdown
```

### 1.3 Responsive Breakpoints

```
Mobile (360px-767px):
- Stack all components vertically
- Hide keyboard shortcuts (mobile-first)
- Collapse quick actions to dropdown

Tablet (768px-1023px):
- 1-column layout for queue + sidebar
- Show keyboard hints on hover

Desktop (1024px+):
- 3-column grid (2 for queue, 1 for sidebar)
- Always show keyboard shortcuts
- Enable j/k navigation
```

---

## Section 2: Component Specifications

### 2.1 QuickActionToolbar

**File:** `/components/instructor/quick-action-toolbar.tsx`
**Estimated Lines:** 120-150
**Complexity:** LOW

#### Props Interface

```typescript
export interface QuickActionToolbarProps {
  /**
   * Current selection state
   */
  selectedThreadIds: string[];

  /**
   * Callback when selection changes (for external state management)
   */
  onSelectionChange?: (selectedIds: string[]) => void;

  /**
   * Callback when bulk action is triggered
   */
  onBulkAction: (action: BulkAction, threadIds: string[]) => void;

  /**
   * Whether bulk actions are in progress
   */
  loading?: boolean;

  /**
   * Whether keyboard shortcuts are enabled
   */
  keyboardShortcutsEnabled?: boolean;

  /**
   * Callback to toggle keyboard shortcuts help modal
   */
  onShowHelp?: () => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

export type BulkAction = 'endorse' | 'flag' | 'resolve' | 'tag' | 'clear-selection';
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  Flag,
  CheckCircle,
  Tag,
  X,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActionToolbar({
  selectedThreadIds,
  onSelectionChange,
  onBulkAction,
  loading = false,
  keyboardShortcutsEnabled = true,
  onShowHelp,
  className,
}: QuickActionToolbarProps) {
  const hasSelection = selectedThreadIds.length > 0;

  // Handle bulk actions
  const handleAction = React.useCallback((action: BulkAction) => {
    if (action === 'clear-selection' && onSelectionChange) {
      onSelectionChange([]);
    } else {
      onBulkAction(action, selectedThreadIds);
    }
  }, [onBulkAction, onSelectionChange, selectedThreadIds]);

  return (
    <div
      className={cn(
        "glass-panel p-4 rounded-xl mb-6 flex items-center justify-between gap-4",
        className
      )}
      role="toolbar"
      aria-label="Quick actions"
    >
      {/* Left: Bulk Actions */}
      <div className="flex items-center gap-2">
        {hasSelection && (
          <>
            <Badge variant="outline" className="px-3 py-1">
              {selectedThreadIds.length} selected
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="glass-secondary"
                  size="sm"
                  onClick={() => handleAction('endorse')}
                  disabled={loading}
                  aria-label="Endorse selected threads"
                >
                  <ThumbsUp className="size-4" />
                  Endorse
                  {keyboardShortcutsEnabled && (
                    <kbd className="ml-2 text-xs">E</kbd>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Endorse all selected AI answers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => handleAction('flag')}
                  disabled={loading}
                  aria-label="Flag selected threads"
                >
                  <Flag className="size-4" />
                  Flag
                  {keyboardShortcutsEnabled && (
                    <kbd className="ml-2 text-xs">F</kbd>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flag for review</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => handleAction('resolve')}
                  disabled={loading}
                  aria-label="Resolve selected threads"
                >
                  <CheckCircle className="size-4" />
                  Resolve
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as resolved</TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('clear-selection')}
              disabled={loading}
              aria-label="Clear selection"
            >
              <X className="size-4" />
              Clear
            </Button>
          </>
        )}

        {!hasSelection && (
          <p className="text-sm text-muted-foreground glass-text">
            Select threads to perform bulk actions
          </p>
        )}
      </div>

      {/* Right: Keyboard Shortcuts Help */}
      {keyboardShortcutsEnabled && onShowHelp && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowHelp}
              aria-label="Show keyboard shortcuts help"
            >
              <HelpCircle className="size-4" />
              <kbd className="ml-2 text-xs">?</kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
```

#### Usage Example

```typescript
// In InstructorDashboard
const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);

<QuickActionToolbar
  selectedThreadIds={selectedThreadIds}
  onSelectionChange={setSelectedThreadIds}
  onBulkAction={(action, threadIds) => {
    console.log(`Bulk ${action} on ${threadIds.length} threads`);
  }}
  keyboardShortcutsEnabled={true}
  onShowHelp={() => setShowShortcutsModal(true)}
/>
```

---

### 2.2 PriorityQueuePanel

**File:** `/components/instructor/priority-queue-panel.tsx`
**Estimated Lines:** 200-250
**Complexity:** MEDIUM

#### Props Interface

```typescript
export interface PriorityQueuePanelProps {
  /**
   * Threads with priority scores (pre-sorted)
   */
  threads: ThreadWithPriority[];

  /**
   * Current user for actions
   */
  currentUser: User;

  /**
   * Selected thread IDs (for bulk actions)
   */
  selectedThreadIds: string[];

  /**
   * Callback when selection changes
   */
  onSelectionChange: (selectedIds: string[]) => void;

  /**
   * Callback when quick action is triggered on a thread
   */
  onQuickAction: (action: QuickAction, threadId: string) => void;

  /**
   * Callback when thread is clicked (navigate to detail)
   */
  onThreadClick: (threadId: string) => void;

  /**
   * Whether bulk select mode is active
   */
  bulkSelectMode?: boolean;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Optional className
   */
  className?: string;
}

export interface ThreadWithPriority extends Thread {
  priorityScore: number;
  priorityFactors: {
    unanswered: boolean;
    lowAIConfidence: boolean;
    notEndorsed: boolean;
    highViews: boolean;
    recentActivity: boolean;
  };
  aiAnswer?: AIAnswer;
}

export type QuickAction = 'preview' | 'endorse' | 'flag';
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  MessageSquare,
  ThumbsUp,
  Flag,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThreadWithPriority, QuickAction } from "./types";

export function PriorityQueuePanel({
  threads,
  currentUser,
  selectedThreadIds,
  onSelectionChange,
  onQuickAction,
  onThreadClick,
  bulkSelectMode = false,
  loading = false,
  emptyMessage = "No threads to review",
  className,
}: PriorityQueuePanelProps) {
  // Handle select/deselect
  const handleToggleSelection = React.useCallback((threadId: string) => {
    if (selectedThreadIds.includes(threadId)) {
      onSelectionChange(selectedThreadIds.filter(id => id !== threadId));
    } else {
      onSelectionChange([...selectedThreadIds, threadId]);
    }
  }, [selectedThreadIds, onSelectionChange]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 bg-glass-medium rounded-xl" />
        ))}
      </div>
    );
  }

  // Empty state
  if (threads.length === 0) {
    return (
      <Card variant="glass" className={cn("p-12 text-center", className)}>
        <div className="space-y-4">
          <div className="text-6xl opacity-50" aria-hidden="true">✅</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold glass-text">All Caught Up!</h3>
            <p className="text-muted-foreground glass-text">{emptyMessage}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)} role="list" aria-label="Priority queue">
      {threads.map((thread) => (
        <PriorityQueueItem
          key={thread.id}
          thread={thread}
          isSelected={selectedThreadIds.includes(thread.id)}
          onToggleSelection={handleToggleSelection}
          onQuickAction={onQuickAction}
          onThreadClick={onThreadClick}
          bulkSelectMode={bulkSelectMode}
        />
      ))}
    </div>
  );
}

// ============================================
// Sub-Component: PriorityQueueItem
// ============================================

interface PriorityQueueItemProps {
  thread: ThreadWithPriority;
  isSelected: boolean;
  onToggleSelection: (threadId: string) => void;
  onQuickAction: (action: QuickAction, threadId: string) => void;
  onThreadClick: (threadId: string) => void;
  bulkSelectMode: boolean;
}

function PriorityQueueItem({
  thread,
  isSelected,
  onToggleSelection,
  onQuickAction,
  onThreadClick,
  bulkSelectMode,
}: PriorityQueueItemProps) {
  const { priorityFactors, aiAnswer } = thread;

  // Determine card variant based on priority
  const cardVariant = priorityFactors.unanswered
    ? "glass-liquid" // Liquid border for high priority
    : "glass-hover";

  return (
    <Card
      variant={cardVariant}
      className={cn(
        "transition-all duration-200",
        isSelected && "ring-2 ring-primary shadow-[var(--glow-primary)]"
      )}
      role="listitem"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox (bulk select mode) */}
          {bulkSelectMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(thread.id)}
              aria-label={`Select thread: ${thread.title}`}
              className="mt-1"
            />
          )}

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Title + Priority Badges */}
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => onThreadClick(thread.id)}
                className="text-left flex-1 group"
              >
                <h3 className="text-base font-semibold leading-snug glass-text group-hover:text-primary transition-colors">
                  {thread.title}
                </h3>
              </button>

              {/* Priority Indicators */}
              <div className="flex items-center gap-2 shrink-0">
                {priorityFactors.unanswered && (
                  <Badge variant="outline" className="status-open">
                    <AlertCircle className="size-3" />
                    Unanswered
                  </Badge>
                )}
                {priorityFactors.lowAIConfidence && aiAnswer && (
                  <Badge variant="outline" className="border-warning text-warning">
                    <Sparkles className="size-3" />
                    Low Confidence
                  </Badge>
                )}
                {priorityFactors.notEndorsed && aiAnswer && (
                  <Badge variant="outline">
                    <ThumbsUp className="size-3" />
                    Not Endorsed
                  </Badge>
                )}
              </div>
            </div>

            {/* Metadata + Quick Actions */}
            <div className="flex items-center justify-between gap-4">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-subtle glass-text">
                <span className="flex items-center gap-1">
                  <Eye className="size-4" />
                  {thread.views} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {/* Placeholder: post count would come from API */}
                  0 replies
                </span>
                <time dateTime={thread.createdAt}>
                  {formatRelativeTime(thread.createdAt)}
                </time>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {aiAnswer && (
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAction('preview', thread.id);
                    }}
                    aria-label="Preview AI answer"
                  >
                    <Eye className="size-4" />
                    Preview
                  </Button>
                )}
                {aiAnswer && !aiAnswer.instructorEndorsed && (
                  <Button
                    variant="glass-secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAction('endorse', thread.id);
                    }}
                    aria-label="Endorse AI answer"
                  >
                    <ThumbsUp className="size-4" />
                    Endorse
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction('flag', thread.id);
                  }}
                  aria-label="Flag thread"
                >
                  <Flag className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility: Format relative time
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
```

#### Usage Example

```typescript
const { data: priorityQueue, isLoading } = usePriorityQueue(currentUser.id);

<PriorityQueuePanel
  threads={priorityQueue?.threads ?? []}
  currentUser={currentUser}
  selectedThreadIds={selectedThreadIds}
  onSelectionChange={setSelectedThreadIds}
  onQuickAction={(action, threadId) => {
    if (action === 'preview') {
      setPreviewThreadId(threadId);
      setShowPreviewModal(true);
    } else if (action === 'endorse') {
      endorseMutation.mutate({ threadId, userId: currentUser.id });
    }
  }}
  onThreadClick={(threadId) => router.push(`/threads/${threadId}`)}
  bulkSelectMode={selectedThreadIds.length > 0}
  loading={isLoading}
/>
```

---

### 2.3 FAQClusterCard

**File:** `/components/instructor/faq-cluster-card.tsx`
**Estimated Lines:** 150-180
**Complexity:** MEDIUM

#### Props Interface

```typescript
export interface FAQClusterCardProps {
  /**
   * Clustered questions
   */
  clusters: FAQCluster[];

  /**
   * Callback when a thread in cluster is clicked
   */
  onThreadClick: (threadId: string) => void;

  /**
   * Maximum clusters to display
   */
  maxClusters?: number;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Optional className
   */
  className?: string;
}

export interface FAQCluster {
  id: string;
  title: string;              // Representative question
  threadIds: string[];
  threads: Thread[];          // Full thread objects
  frequency: number;          // How many times this pattern occurs
  keywords: string[];
}
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAQClusterCard({
  clusters,
  onThreadClick,
  maxClusters = 5,
  loading = false,
  className,
}: FAQClusterCardProps) {
  const displayedClusters = React.useMemo(
    () => clusters.slice(0, maxClusters),
    [clusters, maxClusters]
  );

  // Loading state
  if (loading) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-glass-medium" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 bg-glass-medium rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (displayedClusters.length === 0) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <CardTitle className="glass-text">Frequently Asked</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="space-y-2">
            <div className="text-4xl opacity-50" aria-hidden="true">💬</div>
            <p className="text-sm text-muted-foreground glass-text">
              No common questions yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <CardTitle className="glass-text flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Frequently Asked
        </CardTitle>
        <p className="text-sm text-muted-foreground glass-text">
          Common question patterns in your courses
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {displayedClusters.map((cluster) => (
            <AccordionItem
              key={cluster.id}
              value={cluster.id}
              className="glass-panel rounded-lg px-4 border-none"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start justify-between gap-3 flex-1">
                  <h4 className="text-sm font-medium leading-snug text-left glass-text">
                    {cluster.title}
                  </h4>
                  <Badge variant="outline" className="shrink-0">
                    {cluster.frequency}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1 pb-2 border-b border-[var(--border-glass)]">
                    {cluster.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>

                  {/* Threads */}
                  <ul className="space-y-2" role="list">
                    {cluster.threads.slice(0, 3).map((thread) => (
                      <li key={thread.id}>
                        <button
                          onClick={() => onThreadClick(thread.id)}
                          className="w-full text-left p-2 rounded-md hover:bg-glass-medium transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <MessageSquare className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="text-sm glass-text line-clamp-2">
                              {thread.title}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* View All Link */}
                  {cluster.threads.length > 3 && (
                    <p className="text-xs text-accent text-center pt-2">
                      +{cluster.threads.length - 3} more similar questions
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

#### Usage Example

```typescript
const { data: faqClusters, isLoading } = useFAQClusters(courseId);

<FAQClusterCard
  clusters={faqClusters ?? []}
  onThreadClick={(threadId) => router.push(`/threads/${threadId}`)}
  maxClusters={5}
  loading={isLoading}
/>
```

---

### 2.4 TopicHeatmap

**File:** `/components/instructor/topic-heatmap.tsx`
**Estimated Lines:** 180-220
**Complexity:** MEDIUM

#### Props Interface

```typescript
export interface TopicHeatmapProps {
  /**
   * Topic trends data (pre-computed)
   */
  topics: TopicTrend[];

  /**
   * Callback when topic is clicked (filter threads by topic)
   */
  onTopicClick?: (topic: string) => void;

  /**
   * Maximum topics to display
   */
  maxTopics?: number;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Optional className
   */
  className?: string;
}

export interface TopicTrend {
  topic: string;
  frequency: number;          // How many threads mention this
  change: number;             // Delta from last week
  threads: Thread[];          // Threads with this topic
}
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopicHeatmap({
  topics,
  onTopicClick,
  maxTopics = 8,
  loading = false,
  className,
}: TopicHeatmapProps) {
  const displayedTopics = React.useMemo(
    () => topics.slice(0, maxTopics).sort((a, b) => b.frequency - a.frequency),
    [topics, maxTopics]
  );

  // Calculate max frequency for scaling
  const maxFrequency = React.useMemo(
    () => Math.max(...displayedTopics.map(t => t.frequency), 1),
    [displayedTopics]
  );

  // Loading state
  if (loading) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-glass-medium" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 bg-glass-medium rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (displayedTopics.length === 0) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <CardTitle className="glass-text">Topic Trends</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="space-y-2">
            <div className="text-4xl opacity-50" aria-hidden="true">📊</div>
            <p className="text-sm text-muted-foreground glass-text">
              No trending topics yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <CardTitle className="glass-text flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Topic Trends
        </CardTitle>
        <p className="text-sm text-muted-foreground glass-text">
          Most discussed topics this week
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" role="list" aria-label="Topic trends">
          {displayedTopics.map((topic, index) => (
            <TopicHeatmapItem
              key={topic.topic}
              topic={topic}
              maxFrequency={maxFrequency}
              rank={index + 1}
              onTopicClick={onTopicClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Sub-Component: TopicHeatmapItem
// ============================================

interface TopicHeatmapItemProps {
  topic: TopicTrend;
  maxFrequency: number;
  rank: number;
  onTopicClick?: (topic: string) => void;
}

function TopicHeatmapItem({
  topic,
  maxFrequency,
  rank,
  onTopicClick,
}: TopicHeatmapItemProps) {
  // Calculate percentage for bar width
  const percentage = (topic.frequency / maxFrequency) * 100;

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (topic.change > 0) return <TrendingUp className="size-3 text-success" />;
    if (topic.change < 0) return <TrendingDown className="size-3 text-danger" />;
    return <Minus className="size-3 text-muted-foreground" />;
  };

  // Color based on rank
  const getBarColor = () => {
    if (rank === 1) return "bg-chart-1";
    if (rank === 2) return "bg-chart-2";
    if (rank === 3) return "bg-chart-3";
    if (rank === 4) return "bg-chart-4";
    return "bg-chart-5";
  };

  const isClickable = !!onTopicClick;

  return (
    <div role="listitem">
      <button
        onClick={() => onTopicClick?.(topic.topic)}
        disabled={!isClickable}
        className={cn(
          "w-full text-left space-y-2 p-3 rounded-lg transition-all",
          isClickable && "hover:bg-glass-medium cursor-pointer"
        )}
      >
        {/* Label Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="shrink-0">
              #{rank}
            </Badge>
            <span className="text-sm font-medium glass-text truncate">
              {topic.topic}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {getTrendIcon()}
            <span className="text-xs text-subtle glass-text tabular-nums">
              {topic.frequency}
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-2 w-full rounded-full bg-muted/20 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              getBarColor()
            )}
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Change Label */}
        {topic.change !== 0 && (
          <p className="text-xs text-subtle glass-text">
            {topic.change > 0 ? '+' : ''}{topic.change} from last week
          </p>
        )}
      </button>
    </div>
  );
}
```

#### Usage Example

```typescript
const { data: topicTrends, isLoading } = useTopicTrends(courseId);

<TopicHeatmap
  topics={topicTrends ?? []}
  onTopicClick={(topic) => {
    // Filter priority queue by topic
    setTopicFilter(topic);
  }}
  maxTopics={8}
  loading={isLoading}
/>
```

---

### 2.5 EndorsementPreviewModal

**File:** `/components/instructor/endorsement-preview-modal.tsx`
**Estimated Lines:** 180-220
**Complexity:** LOW

#### Props Interface

```typescript
export interface EndorsementPreviewModalProps {
  /**
   * Whether modal is open
   */
  isOpen: boolean;

  /**
   * Callback to close modal
   */
  onClose: () => void;

  /**
   * Thread to preview
   */
  thread: Thread | null;

  /**
   * AI answer to preview
   */
  aiAnswer: AIAnswer | null;

  /**
   * Current user (for endorsement)
   */
  currentUser: User;

  /**
   * Callback when endorse is clicked
   */
  onEndorse: (aiAnswerId: string) => void;

  /**
   * Callback when flag is clicked
   */
  onFlag: (threadId: string) => void;

  /**
   * Loading state for actions
   */
  loading?: boolean;
}
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, Flag, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function EndorsementPreviewModal({
  isOpen,
  onClose,
  thread,
  aiAnswer,
  currentUser,
  onEndorse,
  onFlag,
  loading = false,
}: EndorsementPreviewModalProps) {
  // Don't render if no data
  if (!thread || !aiAnswer) {
    return null;
  }

  const alreadyEndorsed = aiAnswer.endorsedBy.includes(currentUser.id);
  const isInstructor = currentUser.role === "instructor" || currentUser.role === "ta";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel-strong max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl glass-text">
                {thread.title}
              </DialogTitle>
              <DialogDescription className="glass-text">
                AI-generated answer • Confidence: {aiAnswer.confidenceScore}%
              </DialogDescription>
            </div>

            {/* Confidence Badge */}
            <Badge
              variant={
                aiAnswer.confidenceLevel === "high"
                  ? "confidence-high"
                  : aiAnswer.confidenceLevel === "medium"
                  ? "confidence-medium"
                  : "confidence-low"
              }
              className="shrink-0"
            >
              <Sparkles className="size-3" />
              {aiAnswer.confidenceLevel} confidence
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold glass-text">Question</h3>
              <Card variant="glass">
                <CardContent className="p-4">
                  <p className="text-sm glass-text leading-relaxed">
                    {thread.content}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Answer */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold glass-text flex items-center gap-2">
                <Sparkles className="size-4 text-ai-purple-500" />
                AI Answer
              </h3>
              <Card variant="ai">
                <CardContent className="p-4">
                  <p className="text-sm glass-text leading-relaxed whitespace-pre-wrap">
                    {aiAnswer.content}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Citations */}
            {aiAnswer.citations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold glass-text">
                  Citations ({aiAnswer.citations.length})
                </h3>
                <div className="space-y-2">
                  {aiAnswer.citations.slice(0, 3).map((citation) => (
                    <Card key={citation.id} variant="glass" className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            {citation.sourceType}
                          </Badge>
                          <span className="text-xs text-subtle glass-text">
                            {citation.relevance}% relevance
                          </span>
                        </div>
                        <p className="text-sm font-medium glass-text">
                          {citation.source}
                        </p>
                        <p className="text-xs text-muted-foreground glass-text line-clamp-2">
                          {citation.excerpt}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Endorsements */}
            <div className="flex items-center gap-4 text-sm text-subtle glass-text">
              <span className="flex items-center gap-1">
                <ThumbsUp className="size-4 text-success" />
                {aiAnswer.instructorEndorsements} instructor endorsements
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="size-4" />
                {aiAnswer.studentEndorsements} student endorsements
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {/* View Full Thread */}
            <Button
              variant="glass"
              onClick={() => {
                window.open(`/threads/${thread.id}`, '_blank');
              }}
              disabled={loading}
            >
              <ExternalLink className="size-4" />
              View Thread
            </Button>

            {/* Flag */}
            <Button
              variant="ghost"
              onClick={() => {
                onFlag(thread.id);
                onClose();
              }}
              disabled={loading}
              aria-label="Flag for review"
            >
              <Flag className="size-4" />
              Flag
            </Button>

            {/* Endorse */}
            {!alreadyEndorsed && isInstructor && (
              <Button
                variant="glass-secondary"
                onClick={() => {
                  onEndorse(aiAnswer.id);
                  onClose();
                }}
                disabled={loading}
              >
                <ThumbsUp className="size-4" />
                Endorse Answer
              </Button>
            )}

            {alreadyEndorsed && (
              <Badge variant="outline" className="px-4 py-2">
                <ThumbsUp className="size-3" />
                Endorsed
              </Badge>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Usage Example

```typescript
const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);

const { data: previewThread } = useThread(previewThreadId ?? undefined);

<EndorsementPreviewModal
  isOpen={showPreviewModal}
  onClose={() => {
    setShowPreviewModal(false);
    setPreviewThreadId(null);
  }}
  thread={previewThread?.thread ?? null}
  aiAnswer={previewThread?.aiAnswer ?? null}
  currentUser={currentUser}
  onEndorse={(aiAnswerId) => {
    endorseMutation.mutate({ aiAnswerId, userId: currentUser.id, isInstructor: true });
  }}
  onFlag={(threadId) => {
    flagMutation.mutate({ threadId, userId: currentUser.id });
  }}
  loading={endorseMutation.isPending || flagMutation.isPending}
/>
```

---

### 2.6 ResponseTemplatePicker

**File:** `/components/instructor/response-template-picker.tsx`
**Estimated Lines:** 120-150
**Complexity:** LOW

#### Props Interface

```typescript
export interface ResponseTemplatePickerProps {
  /**
   * Available templates
   */
  templates: ResponseTemplate[];

  /**
   * Callback when template is selected
   */
  onSelect: (template: ResponseTemplate) => void;

  /**
   * Callback to create new template
   */
  onCreateNew?: () => void;

  /**
   * Trigger element (button)
   */
  children: React.ReactNode;

  /**
   * Loading state
   */
  loading?: boolean;
}

export interface ResponseTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResponseTemplatePicker({
  templates,
  onSelect,
  onCreateNew,
  children,
  loading = false,
}: ResponseTemplatePickerProps) {
  // Sort by usage count
  const sortedTemplates = React.useMemo(
    () => [...templates].sort((a, b) => b.usageCount - a.usageCount),
    [templates]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="glass-panel-strong w-80 max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="glass-text">
          Response Templates
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="border-glass" />

        {/* Loading State */}
        {loading && (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 bg-glass-medium rounded-md" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedTemplates.length === 0 && (
          <div className="py-8 px-4 text-center">
            <div className="space-y-2">
              <FileText className="size-8 mx-auto opacity-50" />
              <p className="text-sm text-muted-foreground glass-text">
                No templates yet
              </p>
            </div>
          </div>
        )}

        {/* Templates */}
        {!loading && sortedTemplates.length > 0 && (
          <>
            {sortedTemplates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => onSelect(template)}
                className="p-3 cursor-pointer focus:bg-glass-medium"
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0" />
                      <p className="text-sm font-medium glass-text truncate">
                        {template.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground glass-text line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                  {template.usageCount > 0 && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {template.usageCount}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Create New */}
        {onCreateNew && (
          <>
            <DropdownMenuSeparator className="border-glass" />
            <DropdownMenuItem
              onClick={onCreateNew}
              className="p-3 cursor-pointer focus:bg-glass-medium"
            >
              <div className="flex items-center gap-2 text-accent">
                <Plus className="size-4" />
                <span className="text-sm font-medium">Create New Template</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### Usage Example

```typescript
const { data: templates, isLoading } = useResponseTemplates(currentUser.id);

<ResponseTemplatePicker
  templates={templates ?? []}
  onSelect={(template) => {
    // Insert template into reply textarea
    setReplyContent(template.content);
  }}
  onCreateNew={() => {
    setShowCreateTemplateModal(true);
  }}
  loading={isLoading}
>
  <Button variant="glass">
    <FileText className="size-4" />
    Use Template
  </Button>
</ResponseTemplatePicker>
```

---

### 2.7 StudentEngagementCard

**File:** `/components/instructor/student-engagement-card.tsx`
**Estimated Lines:** 100-130
**Complexity:** LOW

#### Props Interface

```typescript
export interface StudentEngagementCardProps {
  /**
   * Engagement metrics
   */
  metrics: EngagementMetrics;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Optional className
   */
  className?: string;
}

export interface EngagementMetrics {
  activeStudents: number;
  totalStudents: number;
  avgResponseTime: number;      // Hours
  participationRate: number;    // Percentage
  topContributors: {
    userId: string;
    userName: string;
    postCount: number;
  }[];
}
```

#### Component Structure

```typescript
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentEngagementCard({
  metrics,
  loading = false,
  className,
}: StudentEngagementCardProps) {
  // Calculate engagement level
  const engagementLevel =
    metrics.participationRate >= 70 ? "high" :
    metrics.participationRate >= 40 ? "medium" : "low";

  const engagementColor =
    engagementLevel === "high" ? "text-success" :
    engagementLevel === "medium" ? "text-warning" : "text-danger";

  if (loading) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-glass-medium" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 bg-glass-medium rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <CardTitle className="glass-text flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Student Engagement
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Participation Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium glass-text">
              Participation Rate
            </span>
            <span className={cn("text-2xl font-bold", engagementColor)}>
              {metrics.participationRate}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/20 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                engagementLevel === "high" && "bg-success",
                engagementLevel === "medium" && "bg-warning",
                engagementLevel === "low" && "bg-danger"
              )}
              style={{ width: `${metrics.participationRate}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Active Students */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm glass-text">
            <Users className="size-4 text-muted-foreground" />
            Active Students
          </div>
          <span className="text-lg font-semibold glass-text tabular-nums">
            {metrics.activeStudents} / {metrics.totalStudents}
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm glass-text">
            <Clock className="size-4 text-muted-foreground" />
            Avg Response Time
          </div>
          <span className="text-lg font-semibold glass-text tabular-nums">
            {metrics.avgResponseTime}h
          </span>
        </div>

        {/* Top Contributors */}
        {metrics.topContributors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold glass-text flex items-center gap-2">
              <TrendingUp className="size-4" />
              Top Contributors
            </h4>
            <div className="space-y-2">
              {metrics.topContributors.slice(0, 3).map((contributor, index) => (
                <div
                  key={contributor.userId}
                  className="flex items-center justify-between p-2 rounded-md bg-glass-subtle"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="size-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm glass-text">{contributor.userName}</span>
                  </div>
                  <Badge variant="outline">
                    {contributor.postCount} posts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Usage Example

```typescript
const { data: engagementMetrics, isLoading } = useStudentEngagement(courseId);

<StudentEngagementCard
  metrics={engagementMetrics ?? {
    activeStudents: 0,
    totalStudents: 0,
    avgResponseTime: 0,
    participationRate: 0,
    topContributors: [],
  }}
  loading={isLoading}
/>
```

---

### 2.8 InstructorAIAgent (QuokkaTA)

**File:** `/components/instructor/instructor-ai-agent.tsx`
**Estimated Lines:** 400-450
**Complexity:** HIGH

#### Props Interface

```typescript
export interface InstructorAIAgentProps {
  /**
   * Current course context
   */
  courseId: string;
  courseName: string;
  courseCode: string;

  /**
   * Current user (instructor)
   */
  currentUser: User;

  /**
   * Dashboard data for context-aware suggestions
   */
  dashboardData?: InstructorDashboardData;
}
```

#### Component Structure

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Send, Lightbulb, MessageSquarePlus, Trash2 } from "lucide-react";
import type { Message } from "@/lib/models/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * QuokkaTA - Instructor AI Assistant
 *
 * Different from FloatingQuokka (student Q&A):
 * - Focus: Triage suggestions, pattern insights, teaching assistance
 * - Position: Top-right corner (avoids overlap with FloatingQuokka)
 * - Visual: Primary/secondary colors (not AI purple gradient)
 * - Trigger: Keyboard shortcut (Cmd+I) or button in quick actions
 * - Context: Instructor dashboard data (unanswered queue, trends, etc.)
 */
export function InstructorAIAgent({
  courseId,
  courseName,
  courseCode,
  currentUser,
  dashboardData,
}: InstructorAIAgentProps) {
  const [state, setState] = useState<"hidden" | "minimized" | "expanded">("hidden");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fabButtonRef = useRef<HTMLButtonElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`quokkaTA-state-${courseId}`);
    if (savedState === "expanded") {
      setState("expanded");
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi ${currentUser.name}! I'm QuokkaTA, your teaching assistant for ${courseCode}. I can help you triage questions, identify patterns, and suggest responses. How can I assist you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [courseId, courseCode, currentUser.name]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcut: Cmd+I (Mac) or Ctrl+I (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        if (state === "hidden" || state === "minimized") {
          handleExpand();
        } else {
          handleMinimize();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  // Save state to localStorage
  const updateState = (newState: typeof state) => {
    setState(newState);
    localStorage.setItem(`quokkaTA-state-${courseId}`, newState);
  };

  // Handle minimize
  const handleMinimize = () => {
    updateState("minimized");
    setTimeout(() => fabButtonRef.current?.focus(), 100);
  };

  // Handle expand
  const handleExpand = () => {
    updateState("expanded");
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi ${currentUser.name}! I'm QuokkaTA, your teaching assistant for ${courseCode}. I can help you triage questions, identify patterns, and suggest responses. How can I assist you today?`,
        timestamp: new Date(),
      }]);
    }
  };

  // AI response logic (instructor-focused)
  const getInstructorResponse = (question: string): string => {
    const q = question.toLowerCase();
    const context = dashboardData;

    // Triage suggestions
    if (q.includes("priority") || q.includes("triage") || q.includes("first")) {
      const unansweredCount = context?.stats.unansweredThreads.value ?? 0;
      return `Based on current data:\n\n**Priority Queue:**\n- ${unansweredCount} unanswered threads\n- Focus on questions with high views and low AI confidence\n- Use bulk actions (E key) to endorse AI answers quickly\n\n**Suggested workflow:**\n1. Review threads with "Low Confidence" badge\n2. Endorse correct AI answers\n3. Manually reply to complex questions\n4. Resolve threads when satisfied`;
    }

    // Pattern insights
    if (q.includes("pattern") || q.includes("common") || q.includes("faq")) {
      return `I've identified these patterns:\n\n**Frequently Asked Topics:**\n- Check the FAQ Clusters panel for common question patterns\n- Consider posting a pinned announcement for frequently asked questions\n- Use response templates for recurring questions\n\n**Tip:** Click on a cluster to see all related threads and bulk-respond efficiently.`;
    }

    // Response templates
    if (q.includes("template") || q.includes("respond") || q.includes("reply")) {
      return `**Using Response Templates:**\n\n1. Create templates for common responses (gear icon in quick actions)\n2. Use "Use Template" button when replying to threads\n3. Customize before sending\n\n**Popular templates:**\n- Office hours reminder\n- Clarification request\n- Resource pointer\n- Encouragement + hint`;
    }

    // Engagement insights
    if (q.includes("engagement") || q.includes("participation") || q.includes("students")) {
      const participationRate = 65; // Mock
      return `**Student Engagement Insights:**\n\n- Participation rate: ${participationRate}%\n- Peak activity: Monday/Wednesday evenings\n- Response time: Avg 12 hours\n\n**Recommendations:**\n${participationRate < 50 ? "- Consider posting engaging questions\n- Respond to threads within 24h to encourage participation" : "- Great engagement! Keep up the responsiveness\n- Highlight top contributors"}`;
    }

    // Default response
    return `I can help you with:\n\n- **Triage:** "What should I prioritize first?"\n- **Patterns:** "What are common question patterns?"\n- **Templates:** "How do I create response templates?"\n- **Engagement:** "How is student participation?"\n\nWhat would you like to know?`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

    const aiResponse: Message = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: getInstructorResponse(userMessage.content),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsThinking(false);
  };

  // Quick prompts for instructors
  const quickPrompts = [
    "What should I prioritize first?",
    "Show me common question patterns",
    "How is student engagement?",
    "Help me create a response template",
  ];

  // Handle clear conversation
  const handleClearConversation = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Hi ${currentUser.name}! I'm QuokkaTA, your teaching assistant for ${courseCode}. I can help you triage questions, identify patterns, and suggest responses. How can I assist you today?`,
      timestamp: new Date(),
    }]);
    setShowClearConfirm(false);
  };

  // Hidden state - show nothing
  if (state === "hidden") {
    return null;
  }

  // Minimized state - show floating button
  if (state === "minimized") {
    return (
      <div className="fixed top-24 right-8 z-40">
        <Button
          ref={fabButtonRef}
          onClick={handleExpand}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white hover:shadow-[var(--glow-primary)] shadow-e3 transition-all"
          aria-label="Open QuokkaTA Teaching Assistant"
        >
          <Lightbulb className="h-6 w-6" />
        </Button>
        <div className="absolute -bottom-12 right-0 glass-panel px-3 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap">
          <kbd className="text-xs">⌘I</kbd> to open
        </div>
      </div>
    );
  }

  // Expanded state - show chat window
  return (
    <FocusScope
      trapped={state === "expanded"}
      onMountAutoFocus={(e) => {
        e.preventDefault();
        setTimeout(() => messageInputRef.current?.focus(), 100);
      }}
      onUnmountAutoFocus={(e) => {
        e.preventDefault();
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={handleMinimize}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="fixed top-24 right-8 z-40 w-[95vw] sm:w-[600px] lg:w-[700px] h-[70vh] max-h-[600px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quokkaTA-title"
        aria-describedby="quokkaTA-description"
      >
        <Card variant="glass-strong" className="flex flex-col shadow-e3 h-full">
          {/* Header */}
          <CardHeader className="p-4 border-b border-[var(--border-glass)] flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle id="quokkaTA-title" className="text-base glass-text">
                  QuokkaTA
                </CardTitle>
                <p id="quokkaTA-description" className="text-xs text-subtle glass-text">
                  Teaching assistant for {courseCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="min-h-[44px] min-w-[44px] p-0"
                aria-label="Clear conversation"
                disabled={messages.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="min-h-[44px] min-w-[44px] p-0"
                aria-label="Minimize chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <div role="log" aria-live="polite" aria-atomic="false">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex mb-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl",
                      message.role === "user"
                        ? "bg-primary/90 text-white"
                        : "glass-panel"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs text-subtle mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start" role="status" aria-live="polite">
                  <div className="glass-panel p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">💭</div>
                      <p className="text-sm">QuokkaTA is thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-[var(--border-glass)] p-4">
            {messages.length === 1 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Quick prompts:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.slice(0, 2).map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="default"
                      onClick={() => setInput(prompt)}
                      className="text-xs min-h-[44px]"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={messageInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask QuokkaTA..."
                disabled={isThinking}
                className="flex-1 text-sm"
                aria-label="Message input"
              />
              <Button
                type="submit"
                variant="glass-primary"
                size="sm"
                disabled={isThinking || !input.trim()}
                className="shrink-0 min-h-[44px] min-w-[44px]"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Clear Conversation Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="glass-panel-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="glass-text">
              Clear this conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="glass-text">
              This will delete all messages in your current conversation with QuokkaTA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearConversation}
              className="bg-danger hover:bg-danger/90"
            >
              Clear Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FocusScope>
  );
}
```

#### Usage Example

```typescript
// In InstructorDashboard
<InstructorAIAgent
  courseId={courseId}
  courseName={courseName}
  courseCode={courseCode}
  currentUser={currentUser}
  dashboardData={dashboardData}
/>
```

---

## Section 3: Keyboard Shortcuts Integration

### 3.1 Custom Hook: `useKeyboardShortcuts`

**File:** `/hooks/use-keyboard-shortcuts.ts`
**Estimated Lines:** 80-100

```typescript
"use client";

import { useEffect, useCallback } from "react";

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
};

export interface UseKeyboardShortcutsOptions {
  /**
   * Map of shortcuts to callbacks
   */
  shortcuts: Record<string, {
    callback: () => void;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  }>;

  /**
   * Whether shortcuts are enabled
   */
  enabled?: boolean;

  /**
   * Prevent shortcuts when input is focused
   */
  preventOnInput?: boolean;
}

/**
 * Custom hook for keyboard shortcuts
 * Usage: useKeyboardShortcuts({ shortcuts: { j: { callback: navigateDown } } })
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventOnInput = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Prevent if input is focused (unless explicitly allowed)
      if (preventOnInput) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const key = e.key.toLowerCase();
      const shortcut = shortcuts[key];

      if (shortcut) {
        // Check modifiers
        const matchesModifiers =
          (shortcut.ctrl === undefined || shortcut.ctrl === e.ctrlKey) &&
          (shortcut.meta === undefined || shortcut.meta === e.metaKey) &&
          (shortcut.shift === undefined || shortcut.shift === e.shiftKey) &&
          (shortcut.alt === undefined || shortcut.alt === e.altKey);

        if (matchesModifiers) {
          e.preventDefault();
          shortcut.callback();
        }
      }
    },
    [shortcuts, enabled, preventOnInput]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

### 3.2 Usage in InstructorDashboard

```typescript
// In InstructorDashboard component
const [selectedIndex, setSelectedIndex] = useState(0);
const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);

useKeyboardShortcuts({
  shortcuts: {
    j: {
      callback: () => {
        // Navigate down
        setSelectedIndex((prev) => Math.min(prev + 1, threads.length - 1));
      },
    },
    k: {
      callback: () => {
        // Navigate up
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      },
    },
    e: {
      callback: () => {
        // Endorse selected
        if (selectedThreadIds.length > 0) {
          bulkEndorseMutation.mutate({ threadIds: selectedThreadIds, userId: currentUser.id });
        }
      },
    },
    f: {
      callback: () => {
        // Flag selected
        if (selectedThreadIds.length > 0) {
          bulkFlagMutation.mutate({ threadIds: selectedThreadIds, userId: currentUser.id });
        }
      },
    },
    "?": {
      callback: () => {
        // Show help modal
        setShowShortcutsModal(true);
      },
      shift: true,
    },
  },
  enabled: true, // Could toggle based on user preference
});
```

---

## Section 4: TypeScript Types

### 4.1 New Types File

**File:** `/lib/models/instructor-types.ts`
**Estimated Lines:** 150-200

```typescript
import type { Thread, User, AIAnswer } from "./types";

// ============================================
// Priority Queue Types
// ============================================

export interface PriorityScore {
  threadId: string;
  score: number;
  factors: PriorityFactors;
}

export interface PriorityFactors {
  unanswered: boolean;
  lowAIConfidence: boolean;
  notEndorsed: boolean;
  highViews: boolean;
  recentActivity: boolean;
}

export interface ThreadWithPriority extends Thread {
  priorityScore: number;
  priorityFactors: PriorityFactors;
  aiAnswer?: AIAnswer;
}

// ============================================
// FAQ Cluster Types
// ============================================

export interface FAQCluster {
  id: string;
  title: string;
  threadIds: string[];
  threads: Thread[];
  frequency: number;
  keywords: string[];
}

// ============================================
// Topic Trend Types
// ============================================

export interface TopicTrend {
  topic: string;
  frequency: number;
  change: number;
  threads: Thread[];
}

// ============================================
// Response Template Types
// ============================================

export interface ResponseTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResponseTemplateInput {
  title: string;
  content: string;
  userId: string;
}

export interface UpdateResponseTemplateInput {
  id: string;
  title?: string;
  content?: string;
}

// ============================================
// Bulk Action Types
// ============================================

export type BulkAction = 'endorse' | 'flag' | 'resolve' | 'tag';

export interface BulkActionInput {
  action: BulkAction;
  threadIds: string[];
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface BulkActionResult {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    threadId: string;
    error: string;
  }>;
}

// ============================================
// Engagement Types
// ============================================

export interface EngagementMetrics {
  activeStudents: number;
  totalStudents: number;
  avgResponseTime: number;
  participationRate: number;
  topContributors: TopContributor[];
}

export interface TopContributor {
  userId: string;
  userName: string;
  postCount: number;
  endorsements: number;
}

// ============================================
// Type Guards
// ============================================

export function isUnanswered(thread: Thread): boolean {
  return thread.status === 'open';
}

export function requiresAttention(thread: Thread, aiAnswer?: AIAnswer): boolean {
  if (isUnanswered(thread)) return true;
  if (aiAnswer && !aiAnswer.instructorEndorsed && aiAnswer.confidenceScore < 70) return true;
  return false;
}

export function hasLowConfidence(aiAnswer: AIAnswer): boolean {
  return aiAnswer.confidenceLevel === 'low' || aiAnswer.confidenceScore < 50;
}
```

---

## Section 5: React Query Hooks

### 5.1 New Hooks File

**File:** `/lib/api/instructor-hooks.ts`
**Estimated Lines:** 250-300

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ThreadWithPriority,
  FAQCluster,
  TopicTrend,
  ResponseTemplate,
  CreateResponseTemplateInput,
  BulkActionInput,
  EngagementMetrics,
} from "@/lib/models/instructor-types";
import { api } from "./client";

// ============================================
// Query Keys
// ============================================

const instructorQueryKeys = {
  priorityQueue: (userId: string, courseId?: string) =>
    courseId
      ? ["priorityQueue", userId, courseId] as const
      : ["priorityQueue", userId] as const,
  faqClusters: (courseId: string) => ["faqClusters", courseId] as const,
  topicTrends: (courseId: string) => ["topicTrends", courseId] as const,
  responseTemplates: (userId: string) => ["responseTemplates", userId] as const,
  engagementMetrics: (courseId: string) => ["engagementMetrics", courseId] as const,
};

// ============================================
// Priority Queue Hook
// ============================================

/**
 * Get priority-ranked threads for instructor triage
 */
export function usePriorityQueue(userId: string, courseId?: string) {
  return useQuery({
    queryKey: instructorQueryKeys.priorityQueue(userId, courseId),
    queryFn: () => api.getPriorityQueue(userId, courseId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================
// FAQ Clusters Hook
// ============================================

/**
 * Get FAQ clusters (frequently asked question patterns)
 */
export function useFAQClusters(courseId: string) {
  return useQuery({
    queryKey: instructorQueryKeys.faqClusters(courseId),
    queryFn: () => api.getFAQClusters(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes (expensive computation)
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// Topic Trends Hook
// ============================================

/**
 * Get topic trends (most discussed topics)
 */
export function useTopicTrends(courseId: string) {
  return useQuery({
    queryKey: instructorQueryKeys.topicTrends(courseId),
    queryFn: () => api.getTopicTrends(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// Response Templates Hooks
// ============================================

/**
 * Get user's response templates
 */
export function useResponseTemplates(userId: string) {
  return useQuery({
    queryKey: instructorQueryKeys.responseTemplates(userId),
    queryFn: () => api.getResponseTemplates(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes (rarely change)
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Create new response template
 */
export function useCreateResponseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResponseTemplateInput) =>
      api.createResponseTemplate(input),
    onSuccess: (newTemplate) => {
      // Invalidate templates query
      queryClient.invalidateQueries({
        queryKey: ["responseTemplates", newTemplate.userId],
      });
    },
  });
}

// ============================================
// Bulk Actions Hook
// ============================================

/**
 * Perform bulk action on multiple threads
 */
export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkActionInput) => api.bulkAction(input),
    onSuccess: (result, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["priorityQueue"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["courseThreads"] });

      // Show success toast (would be implemented)
      console.log(`Bulk ${variables.action} completed: ${result.affectedCount} threads`);
    },
  });
}

// ============================================
// Engagement Metrics Hook
// ============================================

/**
 * Get student engagement metrics for a course
 */
export function useStudentEngagement(courseId: string) {
  return useQuery({
    queryKey: instructorQueryKeys.engagementMetrics(courseId),
    queryFn: () => api.getStudentEngagement(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}
```

---

## Section 6: Implementation Order

### Phase 1: Foundation (2-3 hours)
1. Create types file (`instructor-types.ts`)
2. Create keyboard shortcuts hook (`use-keyboard-shortcuts.ts`)
3. Create instructor hooks file (`instructor-hooks.ts`)
4. Add mock API methods to `client.ts`

### Phase 2: Core Components (3-4 hours)
1. `QuickActionToolbar` (simple, sets foundation)
2. `PriorityQueuePanel` + `PriorityQueueItem` (most important)
3. `EndorsementPreviewModal` (needed for priority queue)

### Phase 3: Sidebar Components (2-3 hours)
1. `FAQClusterCard` (accordion pattern)
2. `TopicHeatmap` (visualization)
3. `StudentEngagementCard` (metrics)
4. `ResponseTemplatePicker` (dropdown)

### Phase 4: AI Agent (1-2 hours)
1. `InstructorAIAgent` (QuokkaTA) (reuses FloatingQuokka pattern)

### Phase 5: Integration (1 hour)
1. Wire all components into InstructorDashboard
2. Test keyboard shortcuts
3. Test bulk actions
4. Verify accessibility

---

## Section 7: Testing Scenarios

### Component-Level Tests

**QuickActionToolbar:**
- [ ] Selection count updates correctly
- [ ] Bulk action callbacks fire with correct threadIds
- [ ] Keyboard shortcuts display correctly
- [ ] Loading state disables buttons

**PriorityQueuePanel:**
- [ ] Threads render in priority order
- [ ] Selection toggles work
- [ ] Quick action buttons fire callbacks
- [ ] Empty state displays when no threads
- [ ] Loading skeleton shows correct structure

**FAQClusterCard:**
- [ ] Clusters expand/collapse correctly
- [ ] Keywords display properly
- [ ] Thread click navigates correctly
- [ ] Shows "+N more" when >3 threads

**TopicHeatmap:**
- [ ] Bar widths scale correctly (0-100%)
- [ ] Trend icons match direction (up/down/neutral)
- [ ] Topic click filters queue
- [ ] Rank badges show correct order

**EndorsementPreviewModal:**
- [ ] Opens with correct thread data
- [ ] Endorse button works
- [ ] Flag button works
- [ ] Already-endorsed state displays correctly
- [ ] Modal closes and restores focus

**ResponseTemplatePicker:**
- [ ] Templates load and display
- [ ] Template selection inserts content
- [ ] Create new template opens modal
- [ ] Empty state shows correctly

**StudentEngagementCard:**
- [ ] Participation rate calculates correctly
- [ ] Progress bar fills to correct percentage
- [ ] Top contributors display in order
- [ ] Engagement level determines color (high/med/low)

**InstructorAIAgent (QuokkaTA):**
- [ ] Keyboard shortcut (Cmd+I) opens/closes
- [ ] Context-aware responses work
- [ ] Quick prompts insert correctly
- [ ] Clear conversation resets messages
- [ ] State persists to localStorage

### Integration Tests

**Keyboard Navigation:**
- [ ] j/k navigate up/down in priority queue
- [ ] e endorses selected threads
- [ ] f flags selected threads
- [ ] ? opens help modal
- [ ] Shortcuts don't fire when input focused

**Bulk Actions:**
- [ ] Multi-select threads
- [ ] Bulk endorse all selected
- [ ] Bulk flag all selected
- [ ] Bulk resolve all selected
- [ ] Clear selection resets state

**Data Flow:**
- [ ] Priority queue updates after endorsement
- [ ] FAQ clusters refresh on new threads
- [ ] Topic trends update weekly
- [ ] Engagement metrics calculate correctly

### Accessibility Tests

- [ ] All interactive elements have aria-labels
- [ ] Keyboard navigation works without mouse
- [ ] Screen reader announces actions
- [ ] Focus management in modals
- [ ] Contrast ratios meet WCAG AA (4.5:1)
- [ ] Touch targets ≥44px on mobile

### Responsive Tests

- [ ] Mobile (360px): Stacked layout, collapsed quick actions
- [ ] Tablet (768px): 2-column grid
- [ ] Desktop (1024px+): 3-column grid, keyboard shortcuts visible

---

## Section 8: Risk Mitigation

### Performance Risks

**Risk:** Priority ranking with 100+ threads is slow
**Mitigation:**
- Pre-compute scores on backend (mock API)
- Use React Query caching (2-minute stale time)
- Limit display to top 50 threads
- Consider virtualization (react-window) if needed

**Risk:** Keyboard shortcuts conflict with browser/OS shortcuts
**Mitigation:**
- Use common patterns (j/k from Gmail)
- Don't override system shortcuts (Cmd+Q, Cmd+W)
- Allow users to disable shortcuts
- Show clear help modal (?)

### UX Risks

**Risk:** Too many keyboard shortcuts = confusion
**Mitigation:**
- Limit to 5 core shortcuts (j/k/e/f/?)
- Show visual hints (kbd badges)
- Provide help modal with full list
- Make shortcuts optional (user preference)

**Risk:** Bulk actions are destructive
**Mitigation:**
- Confirm destructive actions (flag, resolve)
- Use optimistic updates with rollback
- Show clear feedback (toast notifications)
- Log all bulk actions for audit

### Data Risks

**Risk:** FAQ clustering produces poor results
**Mitigation:**
- Use simple keyword matching (not ML)
- Focus on UI patterns, not algorithm
- Allow manual cluster creation
- Make clusters collapsible (easy to ignore)

---

## Conclusion

This plan provides complete specifications for 8 instructor-specific components with:
- ✅ Props interfaces (TypeScript strict mode)
- ✅ Component structure (200-250 lines each)
- ✅ Usage examples
- ✅ Keyboard shortcuts integration
- ✅ React Query hooks
- ✅ Type system extensions
- ✅ Testing scenarios
- ✅ Risk mitigation strategies

**Total estimated lines:** ~2,500-3,000 (new code)
**Total estimated time:** 8-10 hours
**Reusability:** Very high (extends existing patterns)

**Next step:** Update `context.md` Decisions section, then proceed with implementation.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Lines:** 800+

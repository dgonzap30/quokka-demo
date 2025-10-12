# QDS Styling Plan: Instructor Dashboard Components

## Overview

This plan provides exact QDS v2.0 Glassmorphism-compliant styling specifications for implementing 8 new instructor dashboard components and the InstructorDashboard page redesign.

**QDS Version:** 2.0 Glassmorphism Edition
**Compliance Target:** 10/10 (match FloatingQuokka exemplar)
**Reference Components:** FloatingQuokka, SidebarThreadCard, Button, Card

---

## Component 1: QuickActionToolbar

### Purpose & Context

Sticky toolbar with bulk actions for instructor workflows (endorse multiple, flag, resolve). Appears at top of question list, floats above content with strong glass effect for readability.

### File Location

**New File:** `components/instructor/quick-action-toolbar.tsx`

### Component Props Interface

```tsx
interface QuickActionToolbarProps {
  /** Selected thread IDs for bulk actions */
  selectedThreadIds: string[];

  /** Endorse selected threads */
  onEndorseSelected: () => void;

  /** Flag selected threads */
  onFlagSelected: () => void;

  /** Resolve selected threads */
  onResolveSelected: () => void;

  /** Clear selection */
  onClearSelection: () => void;

  /** Whether actions are in progress */
  isLoading?: boolean;
}
```

### Glass Structure

**Container:**
```tsx
<div className="sticky top-0 z-30 glass-panel-strong p-4 rounded-lg border-b border-[var(--border-glass)] shadow-e3">
  <div className="flex items-center justify-between gap-4">
    {/* Left: Selection count */}
    {/* Right: Action buttons */}
  </div>
</div>
```

**QDS Tokens:**
- **Position:** `sticky top-0 z-30` (floats above content)
- **Glass:** `glass-panel-strong` (backdrop-blur-lg + strong glass bg)
- **Padding:** `p-4` (16px, comfortable toolbar spacing)
- **Border:** `border-b border-[var(--border-glass)]` (bottom separator)
- **Shadow:** `shadow-e3` (high elevation for floating effect)
- **Radius:** `rounded-lg` (16px, standard card radius)
- **Layout:** `flex items-center justify-between gap-4` (16px between sections)

### Selection Count Section

**Markup:**
```tsx
<div className="flex items-center gap-3">
  <span className="text-sm font-semibold glass-text">
    {selectedThreadIds.length} selected
  </span>
  <Button
    variant="ghost"
    size="sm"
    onClick={onClearSelection}
    className="min-h-[44px]"
    aria-label="Clear selection"
  >
    <X className="h-4 w-4" />
    Clear
  </Button>
</div>
```

**QDS Tokens:**
- **Gap:** `gap-3` (12px) between count and button
- **Text:** `text-sm font-semibold glass-text` (14px, readable on glass)
- **Button:** `variant="ghost" size="sm"` (subtle clear action)
- **Touch target:** `min-h-[44px]` (touch-friendly)
- **Icon:** `h-4 w-4` (16px standard)

### Action Buttons Section

**Markup:**
```tsx
<div className="flex items-center gap-2">
  {/* Endorse (primary action) */}
  <Button
    variant="glass-primary"
    size="default"
    onClick={onEndorseSelected}
    disabled={isLoading || selectedThreadIds.length === 0}
    className="min-h-[44px]"
    aria-label={`Endorse ${selectedThreadIds.length} threads`}
  >
    <Check className="h-4 w-4" />
    <span className="hidden sm:inline">Endorse</span>
    <kbd className="hidden lg:inline ml-2 px-2 py-0.5 text-xs font-mono bg-primary-foreground/10 rounded">
      E
    </kbd>
  </Button>

  {/* Flag */}
  <Button
    variant="glass"
    size="default"
    onClick={onFlagSelected}
    disabled={isLoading || selectedThreadIds.length === 0}
    className="min-h-[44px]"
    aria-label={`Flag ${selectedThreadIds.length} threads`}
  >
    <Flag className="h-4 w-4" />
    <span className="hidden sm:inline">Flag</span>
    <kbd className="hidden lg:inline ml-2 px-2 py-0.5 text-xs font-mono bg-foreground/10 rounded">
      F
    </kbd>
  </Button>

  {/* Resolve */}
  <Button
    variant="glass-secondary"
    size="default"
    onClick={onResolveSelected}
    disabled={isLoading || selectedThreadIds.length === 0}
    className="min-h-[44px]"
    aria-label={`Resolve ${selectedThreadIds.length} threads`}
  >
    <CheckCircle2 className="h-4 w-4" />
    <span className="hidden sm:inline">Resolve</span>
    <kbd className="hidden lg:inline ml-2 px-2 py-0.5 text-xs font-mono bg-white/10 rounded">
      R
    </kbd>
  </Button>
</div>
```

**QDS Tokens:**
- **Button gap:** `gap-2` (8px) between actions
- **Variants:** `glass-primary` (endorse), `glass` (flag), `glass-secondary` (resolve)
- **Size:** `default` (h-10, 40px base) with `min-h-[44px]` for touch
- **Icons:** `h-4 w-4` (16px) standard
- **Text visibility:** `hidden sm:inline` (icon-only on mobile)
- **Keyboard hints:** `hidden lg:inline` (show shortcuts on desktop)
- **Kbd styling:** `px-2 py-0.5 text-xs font-mono rounded` with subtle bg

### Responsive Behavior

**Mobile (<640px):**
```tsx
// Hide text labels, show icons only
className="hidden sm:inline"

// Stack toolbar if needed
className="flex-col sm:flex-row gap-3 sm:gap-2"
```

**Desktop (1024px+):**
```tsx
// Show keyboard shortcuts
className="hidden lg:inline"

// Inline layout with comfortable spacing
className="flex items-center gap-2"
```

### Accessibility

**Keyboard Shortcuts:**
```tsx
// Add global event listener in parent component
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    if (selectedThreadIds.length === 0) return;

    switch (e.key.toLowerCase()) {
      case "e":
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onEndorseSelected();
        }
        break;
      case "f":
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onFlagSelected();
        }
        break;
      case "r":
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onResolveSelected();
        }
        break;
    }
  };

  document.addEventListener("keydown", handleKeyboard);
  return () => document.removeEventListener("keydown", handleKeyboard);
}, [selectedThreadIds, onEndorseSelected, onFlagSelected, onResolveSelected]);
```

**ARIA Attributes:**
```tsx
<div
  role="toolbar"
  aria-label="Quick actions for selected threads"
  aria-controls="thread-list"
>
  {/* Toolbar content */}
</div>
```

**Loading State:**
```tsx
{isLoading && (
  <div className="absolute inset-0 glass-panel-strong flex items-center justify-center rounded-lg">
    <div className="flex items-center gap-3">
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      <span className="text-sm glass-text">Processing...</span>
    </div>
  </div>
)}
```

---

## Component 2: PriorityQueuePanel

### Purpose & Context

Smart-ranked question list showing unanswered/flagged threads with priority indicators. Each item is clickable to view thread details.

### File Location

**New File:** `components/instructor/priority-queue-panel.tsx`

### Component Props Interface

```tsx
interface PriorityQueuePanelProps {
  /** Threads to display, pre-sorted by priority */
  threads: Thread[];

  /** Currently selected thread ID */
  selectedThreadId?: string;

  /** Click handler for thread selection */
  onThreadSelect: (threadId: string) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Empty state message */
  emptyMessage?: string;
}
```

### Panel Structure

**Container:**
```tsx
<div className="glass-panel p-6 rounded-xl space-y-3">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold glass-text">Priority Queue</h2>
    <Badge variant="outline" className="text-xs">{threads.length}</Badge>
  </div>

  <div className="space-y-3">
    {threads.map((thread) => (
      <PriorityThreadCard key={thread.id} {...} />
    ))}
  </div>
</div>
```

**QDS Tokens:**
- **Container:** `glass-panel p-6 rounded-xl` (standard panel)
- **List spacing:** `space-y-3` (12px) between items
- **Header margin:** `mb-4` (16px) below header
- **Title:** `text-lg font-semibold glass-text` (18px)
- **Badge:** `variant="outline" text-xs` (12px count)

### Priority Thread Card

**Markup:**
```tsx
<button
  onClick={() => onThreadSelect(thread.id)}
  className={cn(
    "w-full text-left p-4 rounded-lg transition-all duration-300",
    "border-l-4 border-l-transparent",
    "hover:glass-panel-strong hover:scale-[1.01] hover:shadow-e2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    selectedThreadId === thread.id && "glass-panel-strong border-l-primary shadow-e1",
    getPriorityBorderClass(thread.priority)
  )}
  aria-label={`${thread.title}, ${thread.priority} priority, ${thread.replies || 0} replies`}
>
  {/* Card content */}
</button>
```

**Priority Border Classes:**
```tsx
function getPriorityBorderClass(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "border-l-danger hover:border-l-danger";
    case "medium":
      return "border-l-warning hover:border-l-warning";
    case "low":
      return "border-l-secondary hover:border-l-secondary";
  }
}
```

**Card Content:**
```tsx
<div className="space-y-3">
  {/* Header row: Priority badge + Time */}
  <div className="flex items-center justify-between gap-2">
    <Badge
      className={cn(
        "text-xs font-semibold",
        priority === "high" && "bg-danger/10 text-danger border-danger/20",
        priority === "medium" && "bg-warning/10 text-warning border-warning/20",
        priority === "low" && "bg-secondary/10 text-secondary border-secondary/20"
      )}
    >
      {priority === "high" && <AlertCircle className="h-3 w-3 mr-1" />}
      {priority.toUpperCase()}
    </Badge>
    <span className="text-xs text-muted-foreground glass-text">
      {formatTimeAgo(thread.createdAt)}
    </span>
  </div>

  {/* Title */}
  <h3 className="text-sm font-semibold glass-text line-clamp-2 leading-snug">
    {thread.title}
  </h3>

  {/* Metadata row */}
  <div className="flex items-center gap-3 text-xs text-muted-foreground glass-text">
    <span className="flex items-center gap-1">
      <User className="h-3 w-3" />
      {thread.author.name}
    </span>
    <span className="opacity-50">•</span>
    <span className="flex items-center gap-1">
      <MessageSquare className="h-3 w-3" />
      {thread.replies || 0}
    </span>
    {thread.hasAIAnswer && (
      <>
        <span className="opacity-50">•</span>
        <AIBadge variant="compact" />
      </>
    )}
  </div>
</div>
```

**QDS Tokens:**
- **Card padding:** `p-4` (16px)
- **Border:** `border-l-4` (4px left accent, priority color)
- **Hover:** `hover:glass-panel-strong hover:scale-[1.01]`
- **Selected:** `glass-panel-strong border-l-primary shadow-e1`
- **Content spacing:** `space-y-3` (12px between rows)
- **Title:** `text-sm font-semibold line-clamp-2` (14px, 2-line truncation)
- **Meta:** `text-xs text-muted-foreground glass-text` (12px)
- **Icon:** `h-3 w-3` (12px small icons)

### Empty State

```tsx
{threads.length === 0 && (
  <div className="glass-panel p-12 rounded-xl text-center">
    <CheckCircle2 className="h-12 w-12 mx-auto text-success opacity-50 mb-4" />
    <p className="text-base font-medium glass-text mb-2">
      All caught up!
    </p>
    <p className="text-sm text-muted-foreground glass-text">
      {emptyMessage || "No questions need attention right now."}
    </p>
  </div>
)}
```

**QDS Tokens:**
- **Padding:** `p-12` (48px, spacious empty state)
- **Icon:** `h-12 w-12` (48px, prominent)
- **Text:** `text-base font-medium` (16px, emphasis)
- **Helper:** `text-sm text-muted-foreground` (14px, subtle)

### Responsive Behavior

**Mobile (<640px):**
- Maintain single column
- Increase spacing: `space-y-4` instead of `space-y-3`
- Reduce padding: `p-4` instead of `p-6` for container

**Desktop:**
- Dense list: `space-y-3`
- Full padding: `p-6`

---

## Component 3: FAQClusterCard

### Purpose & Context

Grouped similar questions with expandable accordion. Shows cluster title (e.g., "Binary Search Questions") with count badge, expands to show individual threads.

### File Location

**New File:** `components/instructor/faq-cluster-card.tsx`

### Component Props Interface

```tsx
interface FAQClusterCardProps {
  /** Cluster title (topic/theme) */
  title: string;

  /** Threads in this cluster */
  threads: Thread[];

  /** Whether this cluster is initially expanded */
  defaultExpanded?: boolean;

  /** Click handler for individual threads */
  onThreadClick: (threadId: string) => void;
}
```

### Card Structure

**Container:**
```tsx
<Card variant="glass-strong" className="overflow-hidden">
  {/* Expansion trigger */}
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="w-full p-6 text-left hover:bg-accent/5 transition-colors duration-200"
    aria-expanded={isExpanded}
    aria-controls={`cluster-${clusterId}`}
  >
    {/* Header content */}
  </button>

  {/* Expanded content */}
  <div
    id={`cluster-${clusterId}`}
    className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
    )}
  >
    {/* Cluster threads */}
  </div>
</Card>
```

**QDS Tokens:**
- **Card:** `variant="glass-strong"` (enhanced glass for prominence)
- **Trigger padding:** `p-6` (24px)
- **Hover:** `hover:bg-accent/5` (subtle highlight)
- **Transition:** `duration-200` (fast response) for trigger
- **Content transition:** `duration-300` (smooth expansion)

### Header (Collapsed State)

**Markup:**
```tsx
<div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3 flex-1">
    {/* Cluster icon */}
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <BookOpen className="h-5 w-5 text-primary" />
    </div>

    {/* Title and meta */}
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-semibold glass-text truncate">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground glass-text">
        {threads.length} related {threads.length === 1 ? "question" : "questions"}
      </p>
    </div>
  </div>

  {/* Badge and chevron */}
  <div className="flex items-center gap-3 shrink-0">
    <Badge variant="outline" className="text-xs font-semibold">
      {threads.length}
    </Badge>
    <ChevronDown
      className={cn(
        "h-5 w-5 text-muted-foreground transition-transform duration-300",
        isExpanded && "rotate-180"
      )}
    />
  </div>
</div>
```

**QDS Tokens:**
- **Layout:** `flex items-center justify-between gap-4` (16px)
- **Icon container:** `h-10 w-10 rounded-lg bg-primary/10` (40px square)
- **Icon:** `h-5 w-5 text-primary` (20px)
- **Title:** `text-base font-semibold glass-text truncate` (16px)
- **Meta:** `text-xs text-muted-foreground glass-text` (12px)
- **Badge:** `text-xs font-semibold` (12px)
- **Chevron:** `h-5 w-5` (20px) with rotate transition

### Expanded Content

**Markup:**
```tsx
<div className="border-t border-[var(--border-glass)] bg-glass-ultra/50">
  <div className="p-6 pt-4 space-y-3">
    {threads.map((thread) => (
      <button
        key={thread.id}
        onClick={() => onThreadClick(thread.id)}
        className="w-full text-left p-3 rounded-lg glass-panel hover:glass-panel-strong transition-all duration-200 hover:scale-[1.01]"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-sm font-medium glass-text line-clamp-2 flex-1">
            {thread.title}
          </h4>
          {thread.hasAIAnswer && (
            <AIBadge variant="compact" />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground glass-text">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {thread.author.name}
          </span>
          <span className="opacity-50">•</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {thread.replies || 0}
          </span>
          <span className="opacity-50">•</span>
          <time className="opacity-75">
            {formatTimeAgo(thread.createdAt)}
          </time>
        </div>
      </button>
    ))}
  </div>
</div>
```

**QDS Tokens:**
- **Border:** `border-t border-[var(--border-glass)]` (top separator)
- **Background:** `bg-glass-ultra/50` (very subtle tint)
- **Padding:** `p-6 pt-4` (24px sides/bottom, 16px top)
- **List spacing:** `space-y-3` (12px between items)
- **Item:** `glass-panel hover:glass-panel-strong` with scale
- **Item padding:** `p-3` (12px)
- **Title:** `text-sm font-medium line-clamp-2` (14px, 2 lines)
- **Meta:** `text-xs` (12px) with `h-3 w-3` icons

### Responsive Behavior

**Mobile (<640px):**
- Stack icon and content: `flex-col items-start`
- Reduce item padding: `p-2` instead of `p-3`

**Desktop:**
- Inline layout as shown
- Full padding

---

## Component 4: InstructorAIAgent (QuokkaTA)

### Purpose & Context

Floating AI assistant variant specifically for instructor workflows. Larger FAB, uses secondary color accent to differentiate from student mode, offers instructor-specific prompts.

### File Location

**New File:** `components/instructor/instructor-ai-agent.tsx`

### Component Props Interface

```tsx
interface InstructorAIAgentProps {
  /** Current course context */
  courseId: string;
  courseName: string;
  courseCode: string;

  /** Instructor-specific: quick access to stats */
  threadStats?: {
    unanswered: number;
    flagged: number;
    pendingEndorsement: number;
  };
}
```

### FAB Button (Minimized State)

**Markup:**
```tsx
<div className="fixed bottom-8 right-8 z-40">
  <Button
    onClick={handleExpand}
    className="h-16 w-16 rounded-full ai-gradient ai-glow shadow-e3 hover:shadow-e3 transition-all relative"
    aria-label="Open QuokkaTA Instructor Assistant"
  >
    <Sparkles className="h-7 w-7 text-white" />

    {/* Status badge - "Available" */}
    <span className="absolute -top-1 -right-1 status-online h-4 w-4 rounded-full border-2 border-background" />
  </Button>

  {/* Tooltip hint */}
  {isFirstVisit && (
    <div className="absolute -top-14 right-0 glass-panel px-4 py-2 rounded-lg shadow-e2 text-sm whitespace-nowrap">
      QuokkaTA is ready to help! 💼
    </div>
  )}
</div>
```

**QDS Tokens:**
- **Size:** `h-16 w-16` (64px, larger than student version)
- **Position:** `fixed bottom-8 right-8 z-40`
- **Gradient:** `ai-gradient` (purple-cyan gradient)
- **Glow:** `ai-glow` (purple shadow)
- **Shadow:** `shadow-e3` (high elevation)
- **Icon:** `h-7 w-7` (28px, larger)
- **Badge:** `status-online h-4 w-4` (16px availability indicator)
- **Tooltip:** `glass-panel px-4 py-2 rounded-lg` (hint bubble)

### Expanded Panel Structure

**Reuse FloatingQuokka structure with instructor customizations:**

```tsx
<Card variant="glass-strong" className="fixed bottom-8 right-8 z-40 w-[95vw] sm:w-[600px] lg:w-[700px] h-[80vh] sm:h-[75vh] lg:h-[70vh] max-h-[85vh] flex flex-col shadow-e3">
  {/* Header with instructor badge */}
  <CardHeader className="p-4 border-b border-[var(--border-glass)] flex flex-row items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full ai-gradient flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div>
        <CardTitle className="text-base glass-text flex items-center gap-2">
          QuokkaTA
          <Badge variant="secondary" className="text-xs">
            Instructor
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground glass-text">
          Instructor AI Assistant for {courseCode}
        </p>
      </div>
    </div>
    {/* Close button */}
  </CardHeader>

  {/* Same message structure as FloatingQuokka */}
  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
    {/* Messages */}
  </CardContent>

  {/* Input with instructor-specific quick prompts */}
  <div className="border-t border-[var(--border-glass)] p-4">
    {/* Quick prompts for instructors */}
  </div>
</Card>
```

**Differentiation from Student QuokkaIcon:**
- **Badge:** `Instructor` label in secondary color
- **Size:** Larger (64px vs 56px FAB)
- **Quick prompts:** Instructor-specific (see below)

### Instructor-Specific Quick Prompts

```tsx
const instructorPrompts = [
  "Show me unanswered questions",
  "Summarize today's activity",
  "Which topics need more coverage?",
  "Find similar answered questions",
  "Generate response template",
  "Review AI answer quality",
];
```

### Responsive Behavior

**Mobile (<640px):**
- Panel: `w-[95vw] h-[80vh]`
- FAB: `h-14 w-14` (56px to avoid blocking content)

**Desktop:**
- Panel: `lg:w-[700px] lg:h-[70vh]`
- FAB: `h-16 w-16` (64px full size)

### Accessibility

**Same as FloatingQuokka:**
- Focus trap with `<FocusScope>`
- ARIA: `role="dialog" aria-modal="true"`
- Keyboard: Escape to close, Tab navigation
- Focus restoration to FAB on close

---

## Component 5: TopicHeatmap

### Purpose & Context

Visual topic frequency chart showing which course topics have the most questions. Color intensity represents activity level.

### File Location

**New File:** `components/instructor/topic-heatmap.tsx`

### Component Props Interface

```tsx
interface TopicHeatmapProps {
  /** Topic data with frequency counts */
  topics: Array<{
    id: string;
    name: string;
    questionCount: number;
    trend: "up" | "down" | "stable";
  }>;

  /** Click handler for topic drill-down */
  onTopicClick?: (topicId: string) => void;

  /** Time range for data */
  timeRange?: "week" | "month" | "semester";
}
```

### Container Structure

**Markup:**
```tsx
<Card variant="glass" className="p-8">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-semibold glass-text">Topic Activity</h2>
    <Select value={timeRange} onValueChange={setTimeRange}>
      <SelectTrigger className="w-32 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass-panel-strong">
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="semester">All Time</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Heatmap grid */}
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {topics.map((topic) => (
      <TopicCell key={topic.id} {...topic} />
    ))}
  </div>

  {/* Legend */}
  <div className="mt-6 pt-4 border-t border-[var(--border-glass)]">
    {/* Color scale legend */}
  </div>
</Card>
```

**QDS Tokens:**
- **Container:** `variant="glass" p-8` (generous viz padding)
- **Header gap:** `mb-6` (24px below header)
- **Title:** `text-lg font-semibold glass-text` (18px)
- **Grid:** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3` (responsive, 12px gap)
- **Legend border:** `border-t border-[var(--border-glass)]` (top separator)

### Topic Cell

**Markup:**
```tsx
<button
  onClick={() => onTopicClick?.(topic.id)}
  className={cn(
    "relative p-4 rounded-lg text-left transition-all duration-300",
    "glass-panel hover:glass-panel-strong hover:scale-105",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    "min-h-[80px] sm:min-h-[100px]",
    getIntensityClass(topic.questionCount)
  )}
  aria-label={`${topic.name}, ${topic.questionCount} questions, ${topic.trend} trend`}
>
  {/* Topic name */}
  <div className="text-sm font-semibold glass-text mb-2 line-clamp-2">
    {topic.name}
  </div>

  {/* Question count */}
  <div className="text-2xl font-bold glass-text mb-1">
    {topic.questionCount}
  </div>

  {/* Trend indicator */}
  <div className="flex items-center gap-1 text-xs">
    {topic.trend === "up" && (
      <TrendingUp className="h-3 w-3 text-success" />
    )}
    {topic.trend === "down" && (
      <TrendingDown className="h-3 w-3 text-danger" />
    )}
    {topic.trend === "stable" && (
      <Minus className="h-3 w-3 text-muted-foreground" />
    )}
    <span className="text-muted-foreground glass-text capitalize">
      {topic.trend}
    </span>
  </div>
</button>
```

**Intensity Color Scale:**
```tsx
function getIntensityClass(count: number): string {
  // Use QDS chart colors with variable opacity
  if (count >= 20) return "bg-[var(--chart-1)]/30 border-[var(--chart-1)]";
  if (count >= 15) return "bg-[var(--chart-1)]/20 border-[var(--chart-1)]/70";
  if (count >= 10) return "bg-[var(--chart-2)]/20 border-[var(--chart-2)]/70";
  if (count >= 5) return "bg-[var(--chart-3)]/20 border-[var(--chart-3)]/70";
  return "bg-[var(--chart-4)]/10 border-[var(--chart-4)]/50";
}
```

**QDS Tokens:**
- **Cell:** `glass-panel hover:glass-panel-strong hover:scale-105`
- **Padding:** `p-4` (16px)
- **Min height:** `min-h-[80px] sm:min-h-[100px]` (touch-friendly)
- **Name:** `text-sm font-semibold line-clamp-2` (14px, 2 lines)
- **Count:** `text-2xl font-bold` (24px, prominent)
- **Trend:** `text-xs` (12px) with `h-3 w-3` icons

### Legend

**Markup:**
```tsx
<div className="flex items-center justify-between text-xs">
  <span className="text-muted-foreground glass-text">Activity Level:</span>
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1">
      <div className="h-4 w-8 rounded bg-[var(--chart-4)]/10 border border-[var(--chart-4)]/50" />
      <span className="text-muted-foreground glass-text">Low</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="h-4 w-8 rounded bg-[var(--chart-2)]/20 border border-[var(--chart-2)]/70" />
      <span className="text-muted-foreground glass-text">Medium</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="h-4 w-8 rounded bg-[var(--chart-1)]/30 border border-[var(--chart-1)]" />
      <span className="text-muted-foreground glass-text">High</span>
    </div>
  </div>
</div>
```

**QDS Tokens:**
- **Layout:** `flex items-center justify-between`
- **Text:** `text-xs text-muted-foreground glass-text` (12px)
- **Swatch:** `h-4 w-8 rounded` (16x32px color blocks)
- **Gap:** `gap-1` (4px) between swatch and label

---

## Component 6: EndorsementPreviewModal

### Purpose & Context

Quick review modal for AI answer endorsement. Shows thread question, AI answer, citations, and endorsement controls.

### File Location

**New File:** `components/instructor/endorsement-preview-modal.tsx`

### Component Props Interface

```tsx
interface EndorsementPreviewModalProps {
  /** Thread with AI answer to review */
  thread: Thread;
  aiAnswer: AIAnswer;

  /** Whether modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Endorse handler */
  onEndorse: (threadId: string) => void;

  /** Edit before endorsing */
  onEditAndEndorse?: (threadId: string, edits: string) => void;

  /** Loading state */
  isLoading?: boolean;
}
```

### Modal Structure

**Container:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-panel-strong">
    <DialogHeader className="pb-4 border-b border-[var(--border-glass)]">
      <DialogTitle className="heading-3 glass-text">
        Review AI Answer
      </DialogTitle>
      <DialogDescription className="text-base glass-text">
        Endorse this AI-generated response or suggest improvements
      </DialogDescription>
    </DialogHeader>

    {/* Content sections */}
    <div className="space-y-6 mt-4">
      {/* Question section */}
      {/* AI Answer section */}
      {/* Citations section */}
    </div>

    <DialogFooter className="gap-3 sm:gap-2 mt-6">
      {/* Action buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**QDS Tokens:**
- **Container:** `max-w-3xl max-h-[90vh] glass-panel-strong`
- **Header:** `pb-4 border-b border-[var(--border-glass)]`
- **Title:** `heading-3 glass-text` (text-2xl md:text-3xl)
- **Description:** `text-base glass-text` (16px)
- **Content:** `space-y-6 mt-4` (24px between sections, 16px top)
- **Footer:** `gap-3 sm:gap-2 mt-6` (responsive button gap)

### Question Section

```tsx
<div className="space-y-3">
  <h3 className="text-sm font-semibold text-muted-foreground glass-text uppercase tracking-wide">
    Student Question
  </h3>
  <div className="glass-panel p-6 rounded-2xl">
    <h4 className="text-lg font-semibold glass-text mb-3">
      {thread.title}
    </h4>
    {thread.content && (
      <p className="text-sm text-muted-foreground glass-text leading-relaxed whitespace-pre-wrap">
        {thread.content}
      </p>
    )}
  </div>
</div>
```

**QDS Tokens:**
- **Section spacing:** `space-y-3` (12px)
- **Label:** `text-sm font-semibold uppercase tracking-wide` (12px, small caps)
- **Panel:** `glass-panel p-6 rounded-2xl` (preview container)
- **Title:** `text-lg font-semibold glass-text mb-3` (18px)
- **Content:** `text-sm leading-relaxed` (14px, readable)

### AI Answer Section

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-muted-foreground glass-text uppercase tracking-wide">
      AI-Generated Answer
    </h3>
    <ConfidenceMeter level={aiAnswer.confidenceLevel} />
  </div>

  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-accent">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="h-5 w-5 text-accent" />
      <Badge variant="outline" className="text-xs">
        AI Answer
      </Badge>
    </div>

    <div className="prose prose-sm max-w-none glass-text">
      {aiAnswer.content}
    </div>
  </div>
</div>
```

**QDS Tokens:**
- **Border accent:** `border-l-4 border-l-accent` (4px left accent)
- **Icon:** `h-5 w-5 text-accent` (20px)
- **Badge:** `variant="outline" text-xs` (12px)
- **Prose:** `prose-sm max-w-none` (readable text formatting)

### Citations Section

```tsx
<div className="space-y-3">
  <h3 className="text-sm font-semibold text-muted-foreground glass-text uppercase tracking-wide">
    Sources ({aiAnswer.citations.length})
  </h3>
  <div className="space-y-2">
    {aiAnswer.citations.map((citation, idx) => (
      <a
        key={idx}
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass-panel p-4 rounded-lg hover:glass-panel-strong transition-all duration-200 hover:scale-[1.01]"
      >
        <div className="flex items-start gap-3">
          <ExternalLink className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium glass-text truncate">
              {citation.title}
            </p>
            <p className="text-xs text-muted-foreground glass-text truncate">
              {citation.url}
            </p>
          </div>
        </div>
      </a>
    ))}
  </div>
</div>
```

**QDS Tokens:**
- **Link card:** `glass-panel p-4 rounded-lg hover:glass-panel-strong hover:scale-[1.01]`
- **Icon:** `h-4 w-4 text-accent` (16px)
- **Title:** `text-sm font-medium truncate` (14px)
- **URL:** `text-xs text-muted-foreground truncate` (12px)

### Footer Actions

```tsx
<DialogFooter className="gap-3 sm:gap-2">
  <Button
    variant="outline"
    size="lg"
    onClick={onClose}
    disabled={isLoading}
  >
    Cancel
  </Button>

  <Button
    variant="glass"
    size="lg"
    onClick={() => setShowEditMode(true)}
    disabled={isLoading}
  >
    <Edit3 className="h-4 w-4" />
    Edit & Endorse
  </Button>

  <Button
    variant="glass-primary"
    size="lg"
    onClick={() => onEndorse(thread.id)}
    disabled={isLoading}
  >
    <Check className="h-4 w-4" />
    {isLoading ? "Endorsing..." : "Endorse Answer"}
  </Button>
</DialogFooter>
```

**QDS Tokens:**
- **Gap:** `gap-3 sm:gap-2` (responsive 12px/8px)
- **Size:** `lg` (h-11, 44px touch-friendly)
- **Variants:** `outline` (cancel), `glass` (edit), `glass-primary` (endorse)

### Accessibility

**Focus Management:**
```tsx
<FocusScope
  trapped={true}
  onMountAutoFocus={(e) => {
    e.preventDefault();
    // Focus first action button
  }}
>
  {/* Modal content */}
</FocusScope>
```

**ARIA:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="endorsement-title"
  aria-describedby="endorsement-description"
>
  {/* Modal content */}
</div>
```

---

## Component 7: ResponseTemplatePicker

### Purpose & Context

Dropdown for quick common reply templates. Instructors can select pre-written responses for common questions.

### File Location

**New File:** `components/instructor/response-template-picker.tsx`

### Component Props Interface

```tsx
interface ResponseTemplatePickerProps {
  /** Available templates */
  templates: Array<{
    id: string;
    title: string;
    content: string;
    category: "clarification" | "guidance" | "encouragement" | "resources";
  }>;

  /** Template selection handler */
  onSelectTemplate: (templateId: string, content: string) => void;

  /** Button variant */
  variant?: "glass" | "outline";
}
```

### Dropdown Structure

**Trigger:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant={variant || "glass"}
      size="default"
      className="min-h-[44px]"
      aria-label="Select response template"
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">Use Template</span>
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    className="w-80 glass-panel-strong p-2 shadow-e3"
    align="end"
  >
    {/* Template items */}
  </DropdownMenuContent>
</DropdownMenu>
```

**QDS Tokens:**
- **Button:** `variant="glass" size="default" min-h-[44px]`
- **Icon:** `h-4 w-4` (16px)
- **Text:** `hidden sm:inline` (responsive label)
- **Content:** `w-80 glass-panel-strong p-2 shadow-e3` (320px width)

### Template Items

**Markup:**
```tsx
<div className="space-y-1 max-h-[400px] overflow-y-auto">
  {/* Category headers */}
  {Object.entries(groupedTemplates).map(([category, items]) => (
    <div key={category} className="space-y-1">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground glass-text uppercase tracking-wide">
        {category}
      </div>

      {items.map((template) => (
        <DropdownMenuItem
          key={template.id}
          onClick={() => onSelectTemplate(template.id, template.content)}
          className="p-3 rounded-md cursor-pointer hover:bg-accent/10 transition-colors duration-200"
        >
          <div className="space-y-1">
            <div className="text-sm font-medium glass-text">
              {template.title}
            </div>
            <div className="text-xs text-muted-foreground glass-text line-clamp-2">
              {template.content}
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </div>
  ))}
</div>
```

**QDS Tokens:**
- **Container:** `space-y-1 max-h-[400px] overflow-y-auto` (scrollable)
- **Category:** `px-3 py-2 text-xs font-semibold uppercase tracking-wide`
- **Item:** `p-3 rounded-md hover:bg-accent/10` (12px padding, subtle hover)
- **Title:** `text-sm font-medium glass-text` (14px)
- **Preview:** `text-xs text-muted-foreground line-clamp-2` (12px, 2-line)

### Example Templates

```tsx
const defaultTemplates = [
  {
    id: "clarify-question",
    title: "Ask for Clarification",
    content: "Thanks for your question! To help you better, could you provide more details about [specific aspect]? This will help me give you a more precise answer.",
    category: "clarification",
  },
  {
    id: "refer-resources",
    title: "Refer to Course Materials",
    content: "Great question! This topic is covered in [Lecture/Chapter]. I recommend reviewing that material and then let me know if you have specific questions.",
    category: "resources",
  },
  {
    id: "encourage-thinking",
    title: "Encourage Problem-Solving",
    content: "You're on the right track! Before I give you the answer, can you walk me through your thought process? What have you tried so far?",
    category: "encouragement",
  },
];
```

### Responsive Behavior

**Mobile (<640px):**
- Dropdown: `w-[90vw]` instead of `w-80`
- Button text: Hidden (`hidden sm:inline`)

**Desktop:**
- Dropdown: `w-80` (320px)
- Button text: Visible

---

## Component 8: StudentEngagementCard

### Purpose & Context

Metric card showing engagement statistics with sparkline visualization and trend indicator.

### File Location

**New File:** `components/instructor/student-engagement-card.tsx`

### Component Props Interface

```tsx
interface StudentEngagementCardProps {
  /** Metric title */
  title: string;

  /** Current metric value */
  value: number;

  /** Trend direction */
  trend: "up" | "down" | "stable";

  /** Percentage change */
  changePercent: number;

  /** Historical data for sparkline */
  history: number[];

  /** Optional icon */
  icon?: React.ReactNode;

  /** Click handler for drill-down */
  onClick?: () => void;
}
```

### Card Structure

**Container:**
```tsx
<Card
  variant="glass-hover"
  className={cn(
    "cursor-pointer transition-all duration-300",
    onClick && "hover:shadow-e2 hover:-translate-y-1"
  )}
  onClick={onClick}
>
  <div className="flex flex-col gap-4">
    {/* Header row: Icon, Title, Trend */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground glass-text">
            {title}
          </h3>
          <p className="text-3xl font-bold glass-text mt-1">
            {value}
          </p>
        </div>
      </div>

      {/* Trend badge */}
      <Badge
        className={cn(
          "text-xs font-semibold",
          trend === "up" && "bg-success/10 text-success border-success/20",
          trend === "down" && "bg-danger/10 text-danger border-danger/20",
          trend === "stable" && "bg-secondary/10 text-secondary border-secondary/20"
        )}
      >
        {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
        {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
        {trend === "stable" && <Minus className="h-3 w-3 mr-1" />}
        {changePercent > 0 ? "+" : ""}{changePercent}%
      </Badge>
    </div>

    {/* Sparkline */}
    <div className="h-16">
      <Sparkline data={history} color="var(--accent)" />
    </div>
  </div>
</Card>
```

**QDS Tokens:**
- **Card:** `variant="glass-hover"` (interactive glass with lift)
- **Layout:** `flex flex-col gap-4` (16px between rows)
- **Icon box:** `h-10 w-10 rounded-lg bg-primary/10` (40px square)
- **Title:** `text-sm font-medium text-muted-foreground` (14px)
- **Value:** `text-3xl font-bold glass-text mt-1` (30px, prominent)
- **Badge:** `text-xs font-semibold` with color variants
- **Sparkline height:** `h-16` (64px for readable graph)

### Sparkline Component

**Simple SVG Implementation:**
```tsx
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className="opacity-75"
      />
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
}
```

**QDS Tokens:**
- **Stroke:** Use `var(--accent)` or `var(--primary)` for line color
- **Opacity:** `opacity-75` for line, `fillOpacity="0.1"` for area
- **Stroke width:** `strokeWidth="2"` (2px line)

### Responsive Grid Layout

**In Parent Component:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <StudentEngagementCard title="Active Students" value={42} trend="up" changePercent={12} {...} />
  <StudentEngagementCard title="Questions Posted" value={18} trend="stable" changePercent={0} {...} />
  <StudentEngagementCard title="AI Answers" value={15} trend="up" changePercent={25} {...} />
  <StudentEngagementCard title="Avg Response Time" value={3.2} trend="down" changePercent={-15} {...} />
</div>
```

**QDS Tokens:**
- **Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Gap:** `gap-4` (16px between cards)

---

## Page Layout: InstructorDashboard

### File Location

**Existing File:** `app/dashboard/page.tsx` (instructor conditional rendering)

### Layout Structure

**Container:**
```tsx
<div className="min-h-screen bg-background">
  {/* QuokkaTA Floating Agent */}
  <InstructorAIAgent {...} />

  {/* Main content */}
  <div className="max-w-7xl mx-auto p-6 space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="heading-2 mb-2">Instructor Dashboard</h1>
        <p className="text-base text-muted-foreground">
          {courseName} • {courseCode}
        </p>
      </div>
      <Button variant="glass-primary" size="lg">
        <Plus className="h-5 w-5" />
        New Announcement
      </Button>
    </div>

    {/* Quick stats row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StudentEngagementCard {...} />
      <StudentEngagementCard {...} />
      <StudentEngagementCard {...} />
      <StudentEngagementCard {...} />
    </div>

    {/* Main content grid */}
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Priority queue (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <QuickActionToolbar {...} />
        <PriorityQueuePanel {...} />
      </div>

      {/* Right: FAQ clusters (1 col) */}
      <div className="space-y-6">
        <FAQClusterCard {...} />
        <FAQClusterCard {...} />
      </div>
    </div>

    {/* Topic heatmap (full width) */}
    <TopicHeatmap {...} />
  </div>
</div>
```

**QDS Tokens:**
- **Page background:** `min-h-screen bg-background`
- **Container:** `max-w-7xl mx-auto p-6` (1280px max, 24px padding)
- **Page spacing:** `space-y-8` (32px between major sections)
- **Header:** `heading-2 mb-2` (text-3xl md:text-4xl)
- **Description:** `text-base text-muted-foreground` (16px)
- **Stats grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Main grid:** `grid lg:grid-cols-3 gap-6` (3-column with 24px gap)
- **Column spanning:** `lg:col-span-2` for priority queue

### Responsive Behavior

**Mobile (<640px):**
- Single column layout
- Stack all components vertically
- Reduce padding: `p-4` instead of `p-6`

**Tablet (640-768px):**
- 2-column stats grid
- Single column for main content
- Standard padding: `p-6`

**Desktop (1024px+):**
- 4-column stats grid
- 3-column main content grid (2:1 ratio)
- Generous padding and spacing

---

## Implementation Checklist

### Phase 1: Foundation Components (Week 1)

- [ ] **StudentEngagementCard**
  - [ ] Card structure with glass-hover variant
  - [ ] Metric display with large number
  - [ ] Trend badge with color variants
  - [ ] Sparkline SVG visualization
  - [ ] Responsive grid layout
  - [ ] Test in light/dark modes

- [ ] **QuickActionToolbar**
  - [ ] Sticky positioning with glass-panel-strong
  - [ ] Selection count display
  - [ ] Action buttons with glass variants
  - [ ] Keyboard shortcut hints
  - [ ] Loading state overlay
  - [ ] Accessibility: role="toolbar"

### Phase 2: Content Components (Week 2)

- [ ] **PriorityQueuePanel**
  - [ ] Glass panel container
  - [ ] Priority thread cards with border accents
  - [ ] Hover states with scale effect
  - [ ] Empty state design
  - [ ] Selection checkbox integration
  - [ ] Responsive spacing

- [ ] **FAQClusterCard**
  - [ ] Expandable accordion structure
  - [ ] Glass-strong card variant
  - [ ] Cluster header with icon and badge
  - [ ] Nested thread list
  - [ ] Expand/collapse animation
  - [ ] Responsive layout

### Phase 3: Advanced Features (Week 3)

- [ ] **TopicHeatmap**
  - [ ] Responsive grid layout
  - [ ] Topic cells with intensity colors
  - [ ] Hover states and tooltips
  - [ ] Legend with color scale
  - [ ] Time range selector
  - [ ] Click handlers for drill-down

- [ ] **InstructorAIAgent (QuokkaTA)**
  - [ ] Larger FAB button (64px)
  - [ ] Status badge indicator
  - [ ] Reuse FloatingQuokka structure
  - [ ] Instructor-specific prompts
  - [ ] Secondary color accent
  - [ ] Focus management

### Phase 4: Modals & Interactions (Week 4)

- [ ] **EndorsementPreviewModal**
  - [ ] Glass-panel-strong modal structure
  - [ ] Question preview section
  - [ ] AI answer display with accent border
  - [ ] Citations list
  - [ ] Action buttons (endorse, edit, cancel)
  - [ ] Focus trap and restoration

- [ ] **ResponseTemplatePicker**
  - [ ] Dropdown with glass-panel-strong
  - [ ] Category grouping
  - [ ] Template preview (2-line)
  - [ ] Selection handler
  - [ ] Scrollable content
  - [ ] Responsive width

### Phase 5: Integration & Polish

- [ ] **Dashboard Page Layout**
  - [ ] Integrate all components
  - [ ] 3-column responsive grid
  - [ ] QuokkaTA floating agent
  - [ ] Header with actions
  - [ ] Test responsive breakpoints
  - [ ] Verify glass layer count (max 3)

- [ ] **Quality Assurance**
  - [ ] Contrast ratios ≥ 4.5:1 (AA)
  - [ ] Touch targets ≥ 44px
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
  - [ ] Dark mode verification
  - [ ] Performance testing (glass layers)
  - [ ] Reduced motion support

---

## Token Reference Table

### Complete Token Usage Summary

| Element | Token | Value | Purpose |
|---------|-------|-------|---------|
| **Glass Surfaces** |
| Panel | `glass-panel` | blur-md + medium glass | Default panels |
| Strong panel | `glass-panel-strong` | blur-lg + strong glass | Elevated surfaces |
| Text shadow | `glass-text` | rgba shadow | Readability on glass |
| **Colors** |
| Primary | `--primary` | #8A6B3D / #C1A576 | Main actions |
| Secondary | `--secondary` | #5E7D4A / #96B380 | Supporting actions |
| Accent | `--accent` | #2D6CDF / #86A9F6 | Links, focus |
| Success | `--success` | #2E7D32 | Positive feedback |
| Warning | `--warning` | #B45309 | Attention needed |
| Danger | `--danger` | #D92D20 | Destructive actions |
| **Spacing (4pt grid)** |
| Tight | `gap-2` | 8px | Button groups |
| Default | `gap-3` | 12px | List items |
| Comfortable | `gap-4` | 16px | Sections |
| Generous | `gap-6` | 24px | Major sections |
| Spacious | `gap-8` | 32px | Page sections |
| **Typography** |
| Large number | `text-3xl font-bold` | 30px | Metrics |
| Heading | `text-lg font-semibold` | 18px | Titles |
| Body | `text-sm` | 14px | Content |
| Meta | `text-xs` | 12px | Labels, timestamps |
| **Shadows** |
| Card | `shadow-e1` | Subtle | Resting state |
| Elevated | `shadow-e2` | Medium | Hover state |
| Modal | `shadow-e3` | High | Floating elements |
| Glass | `shadow-glass-md` | Soft | Glass panels |
| **Radius** |
| Button | `rounded-lg` | 16px | Standard |
| Card | `rounded-xl` | 20px | Cards |
| Modal | `rounded-2xl` | 24px | Dialogs |
| Badge | `rounded-md` | 10px | Small elements |
| **Interactive** |
| Touch target | `min-h-[44px]` | 44px | Minimum size |
| Hover scale | `hover:scale-[1.01]` | 1% | Subtle lift |
| Focus ring | `ring-2 ring-primary/50` | 2px | Focus indicator |

---

**End of QDS Styling Plan: Instructor Dashboard Components**

**Implementation Status:** Ready for development
**QDS Compliance:** 10/10 target (match FloatingQuokka)
**Accessibility:** WCAG 2.2 AA minimum
**Performance:** Maximum 3 blur layers enforced
**Dark Mode:** Full semantic token support

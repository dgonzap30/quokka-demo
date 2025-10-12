# Component Architecture Research: Instructor Dashboard Components

**Task:** Design 8 instructor-specific components for dashboard re-imagining
**Date:** 2025-10-12
**Objective:** Analyze existing patterns and identify reusability opportunities

---

## Executive Summary

The QuokkaQ codebase follows consistent, high-quality component architecture principles:
- **Props-driven design:** All components accept data via props, zero hardcoded values
- **Composition patterns:** Small, focused components that compose well (shadcn/ui + custom)
- **TypeScript excellence:** Strict mode, explicit interfaces, discriminated unions
- **QDS compliance:** Consistent use of design tokens, glassmorphism, accessibility
- **Performance-aware:** Memoization, React Query caching, optimistic updates

**Key Finding:** Most patterns needed for instructor components already exist. Our job is to extend them intelligently, not reinvent.

---

## Section 1: Existing Component Patterns Analysis

### 1.1 Card-Based Components

#### Pattern: `EnhancedCourseCard`
**Location:** `/components/dashboard/enhanced-course-card.tsx`
**Lines of Code:** 190
**Reusability:** HIGH

**What it does well:**
- **Props-driven dual modes:** Accepts `viewMode: "student" | "instructor"` and conditionally renders metrics
- **Type-safe composition:** Uses type guards (`hasMetrics`, `hasActivity`) to narrow unions
- **Glassmorphism variants:** Leverages `Card variant="glass-hover"` for interactive feel
- **Loading states:** Dedicated skeleton UI with same dimensions as loaded state
- **Accessibility:** Semantic HTML (`<article>`, `role="listitem"`), ARIA labels
- **Responsive:** Uses grid layout that adapts to screen size

**Patterns to reuse:**
```typescript
// 1. Props interface with explicit variants
export interface EnhancedCourseCardProps {
  course: CourseWithActivity | CourseWithMetrics;
  viewMode: "student" | "instructor";
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

// 2. Type guards for discriminated unions
const hasMetrics = (c: typeof course): c is CourseWithMetrics => {
  return 'metrics' in c && c.metrics !== undefined;
};

// 3. Conditional rendering based on viewMode
{viewMode === "instructor" && metrics && (
  <div className="grid grid-cols-2 gap-2 text-center">
    {/* instructor-specific metrics */}
  </div>
)}
```

**Apply to instructor components:**
- `priority-queue-panel.tsx`: Similar card-based list with dual states (normal/bulk-select)
- `faq-cluster-card.tsx`: Card with collapsible content, similar loading pattern
- `student-engagement-card.tsx`: Metrics grid layout, similar to course card

---

#### Pattern: `StatCard`
**Location:** `/components/dashboard/stat-card.tsx`
**Lines of Code:** 183
**Reusability:** VERY HIGH

**What it does well:**
- **Visual variants system:** `variant: "default" | "warning" | "success" | "accent"` with corresponding glows
- **Trend indicators:** Direction icons (up/down/neutral) with semantic colors
- **Optional CTA:** Accepts callback for actionable metrics
- **Flexible composition:** Icon + label + value + trend + optional button

**Props interface:**
```typescript
export interface StatCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  cta?: { label: string; onClick: () => void; icon?: LucideIcon };
  variant?: "default" | "warning" | "success" | "accent";
  loading?: boolean;
  className?: string;
}
```

**Apply to instructor components:**
- **Direct reuse:** Can be used as-is for instructor dashboard stats
- **Pattern to extend:** `topic-heatmap.tsx` should follow similar variant system
- **CTA pattern:** `quick-action-toolbar.tsx` can use similar callback structure

---

#### Pattern: `TimelineActivity`
**Location:** `/components/dashboard/timeline-activity.tsx`
**Lines of Code:** 197
**Reusability:** MEDIUM

**What it does well:**
- **Empty state handling:** Custom message + icon
- **Memoized filtering:** `useMemo` for slicing activities
- **Date formatting:** Dual format (relative + ISO for screen readers)
- **Timeline visualization:** Visual timeline with connecting lines
- **Accessibility:** `<ol>` list, `aria-label`, `dateTime` attributes

**Pattern to reuse:**
```typescript
// Memoized data transformation
const displayedActivities = React.useMemo(
  () => activities.slice(0, maxItems),
  [activities, maxItems]
);

// Dual date formats for a11y
<time
  dateTime={activity.timestamp}
  aria-label={formatFullDate(activity.timestamp)}
>
  {formatRelativeTime(activity.timestamp)}
</time>
```

**Apply to instructor components:**
- `priority-queue-panel.tsx`: Similar list pattern with date formatting
- **Empty states:** All instructor components should use this pattern

---

### 1.2 Interactive Components

#### Pattern: `FloatingQuokka`
**Location:** `/components/course/floating-quokka.tsx`
**Lines of Code:** 461
**Reusability:** MEDIUM (pattern reusable, not component itself)

**What it does well:**
- **State management:** Three distinct states (hidden/minimized/expanded)
- **localStorage persistence:** Saves state per course
- **Focus management:** Uses `FocusScope` from Radix UI, restores focus on close
- **Keyboard shortcuts implicit:** Enter to send, Escape to close (via dialog)
- **Course-context awareness:** Adjusts responses based on `courseCode`
- **Accessibility:** Dialog with `role="dialog"`, `aria-modal`, proper headings

**Critical patterns for QuokkaTA:**
```typescript
// 1. Three-state management
const [state, setState] = useState<"hidden" | "minimized" | "expanded">("minimized");

// 2. localStorage persistence
const updateState = (newState: typeof state) => {
  setState(newState);
  localStorage.setItem(`quokka-state-${courseId}`, newState);
};

// 3. Focus management with Radix
<FocusScope
  trapped={state === "expanded"}
  onMountAutoFocus={(e) => {
    e.preventDefault();
    setTimeout(() => inputRef.current?.focus(), 100);
  }}
>
  {/* dialog content */}
</FocusScope>

// 4. Floating button (minimized state)
<Button
  ref={fabButtonRef}
  onClick={handleExpand}
  className="h-14 w-14 rounded-full ai-gradient ai-glow"
  aria-label="Open Quokka AI Assistant"
>
  <Sparkles className="h-6 w-6" />
</Button>
```

**Apply to instructor components:**
- `instructor-ai-agent.tsx` (QuokkaTA): Follow same three-state pattern, but change:
  - Context: Course-level instructor insights, NOT question answering
  - Position: Different Z-index/position to avoid conflict with FloatingQuokka
  - Visual identity: Different color scheme (primary/secondary vs AI purple gradient)
  - Shortcuts: Different keyboard triggers (Cmd+I for instructor mode)

---

### 1.3 Modal/Dialog Patterns

#### Pattern: `ConversationToThreadModal`
**Location:** `/components/course/conversation-to-thread-modal.tsx`
**Usage:** Referenced in FloatingQuokka

**What it does well:**
- **Radix Dialog primitive:** Uses `@radix-ui/react-dialog` for a11y
- **Preview before submit:** Shows formatted conversation before posting
- **Props-driven:** Accepts `messages`, `courseId`, `onSuccess` callback
- **Form validation:** Checks conversation validity before enabling submit

**Pattern to reuse:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ... data props
  onSuccess: () => void; // Callback after successful action
}

// Radix Dialog structure
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="glass-panel-strong">
    <DialogHeader>
      <DialogTitle>{/* ... */}</DialogTitle>
      <DialogDescription>{/* ... */}</DialogDescription>
    </DialogHeader>
    {/* form/content */}
    <DialogFooter>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={handleSubmit}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Apply to instructor components:**
- `endorsement-preview-modal.tsx`: Show AI answer with inline endorse/flag actions
- **Pattern:** Same structure, different content

---

## Section 2: shadcn/ui Primitives Available

### 2.1 Already Installed

**Total UI components:** 21 files (2,321 lines)

**Most relevant for instructor components:**

| Component | File | Use Cases |
|-----------|------|-----------|
| **Dialog** | `dialog.tsx` | Endorsement preview modal |
| **Sheet** | `sheet.tsx` | Alternative to dialog for bulk actions panel |
| **Dropdown Menu** | `dropdown-menu.tsx` | Response template picker, bulk actions menu |
| **Tabs** | `tabs.tsx` | Switch between priority queue views |
| **Badge** | `badge.tsx` | Thread status, priority indicators |
| **Card** | `card.tsx` | Base for all card components |
| **Button** | `button.tsx` | Actions, CTAs (20+ variants) |
| **Tooltip** | `tooltip.tsx` | Keyboard shortcut hints |
| **Accordion** | `accordion.tsx` | FAQ cluster expansion |
| **Skeleton** | `skeleton.tsx` | Loading states |
| **Empty State** | `empty-state.tsx` | No data messages |
| **Alert Dialog** | `alert-dialog.tsx` | Bulk action confirmations |

**Not installed but recommended:**
- **Command Palette:** For keyboard-driven quick actions (consider adding)
- **Popover:** For inline AI previews (alternative to modal)

---

### 2.2 Button Variants

**Available button variants** (from `button.tsx`):
```typescript
variant:
  | "default"        // Primary brown
  | "destructive"    // Red for dangerous actions
  | "outline"        // Glass border
  | "secondary"      // Olive green
  | "ghost"          // Transparent hover
  | "link"           // Text link
  | "ai"             // Purple gradient with shimmer
  | "ai-outline"     // Purple border
  | "glass-primary"  // Glassmorphic primary
  | "glass-secondary"// Glassmorphic secondary
  | "glass-accent"   // Glassmorphic accent
  | "glass"          // Neutral glass
```

**Apply to instructor components:**
- `quick-action-toolbar.tsx`: Use `"glass-primary"` for primary actions, `"glass"` for secondary
- `endorsement-preview-modal.tsx`: Use `"ai"` for AI-related actions, `"secondary"` for endorse
- `response-template-picker.tsx`: Use `"ghost"` for template items

---

### 2.3 Card Variants

**Available card variants** (from `card.tsx`):
```typescript
variant:
  | "default"        // Standard card
  | "ai"             // AI gradient with purple border
  | "ai-hero"        // Enhanced AI card with glow
  | "hover"          // Lifts on hover
  | "elevated"       // Permanent elevation
  | "glass"          // Glassmorphic
  | "glass-strong"   // More opaque glass
  | "glass-hover"    // Glass that strengthens on hover
  | "glass-liquid"   // Glass with liquid border animation
```

**Apply to instructor components:**
- `priority-queue-panel.tsx`: Use `"glass-hover"` for thread cards
- `faq-cluster-card.tsx`: Use `"glass"` for cluster container, `"glass-hover"` for individual questions
- `topic-heatmap.tsx`: Use `"glass"` for heatmap container
- `student-engagement-card.tsx`: Use `"glass"` for metrics cards

---

## Section 3: React Query Patterns

### 3.1 Existing Hooks

**Location:** `/lib/api/hooks.ts` (494 lines)

**Key patterns:**

```typescript
// 1. Query keys centralized
const queryKeys = {
  currentUser: ["currentUser"] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
  // ... 15 more
};

// 2. Query with enable flag
export function useInstructorDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.instructorDashboard(userId) : ["instructorDashboard"],
    queryFn: () => (userId ? api.getInstructorDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId, // Don't run if userId is undefined
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// 3. Mutation with optimistic updates
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EndorseAIAnswerInput) => api.endorseAIAnswer(input),
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });
      // Save previous state
      const previous = queryClient.getQueryData(queryKey);
      // Update cache optimistically
      queryClient.setQueryData(queryKey, (old) => ({ ...old, endorsed: true }));
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}
```

**Apply to instructor components:**
- All instructor components should use existing hooks where possible
- New hooks needed (see plan): `useBulkEndorse`, `useResponseTemplates`, `useTopicTrends`

---

### 3.2 Stale Time Strategy

**Current strategy:**
- **Fast-changing data:** 2 minutes (threads, posts)
- **Medium-changing data:** 5 minutes (dashboards, courses)
- **Slow-changing data:** 10 minutes (AI answers, insights)
- **Static data:** 15+ minutes (users, course metadata)

**Apply to instructor components:**
- Priority queue: 2 minutes (threads change frequently)
- Topic trends: 5 minutes (aggregated data)
- Response templates: 10 minutes (user-created, rarely change)

---

## Section 4: QDS Design Tokens

### 4.1 Color System

**From `globals.css`:**

**Primary palette:**
```css
--primary: #8A6B3D        /* Quokka Brown */
--primary-hover: #6F522C
--primary-pressed: #5C4525
--secondary: #5E7D4A      /* Rottnest Olive */
--accent: #2D6CDF         /* Clear Sky */
```

**Support colors:**
```css
--success: #2E7D32        /* Green (4.5:1 contrast on white) */
--warning: #B45309        /* Amber (4.5:1 contrast on white) */
--danger: #D92D20         /* Red */
```

**AI colors:**
```css
--ai-purple-500: #A855F7
--ai-indigo-500: #6366F1
--ai-cyan-500: #06B6D4
--ai-gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)
```

**Glassmorphism:**
```css
--glass-ultra: rgba(255, 255, 255, 0.4)
--glass-strong: rgba(255, 255, 255, 0.6)
--glass-medium: rgba(255, 255, 255, 0.7)
--glass-subtle: rgba(255, 255, 255, 0.85)
--border-glass: rgba(255, 255, 255, 0.18)
```

**Critical rule:** NEVER hardcode hex colors. Always use semantic tokens.

**Apply to instructor components:**
- `priority-queue-panel.tsx`: Use `--warning` for unanswered threads, `--success` for endorsed
- `topic-heatmap.tsx`: Use `chart-1` through `chart-5` for topic categories
- `student-engagement-card.tsx`: Use `--success` for high engagement, `--warning` for low

---

### 4.2 Spacing Scale

**4-point grid system:**
```
gap-1  = 4px
gap-2  = 8px
gap-3  = 12px
gap-4  = 16px
gap-6  = 24px
gap-8  = 32px
```

**Container utilities:**
```css
.container-narrow  /* max-w-4xl */
.container-wide    /* max-w-6xl (default for dashboards) */
.container-full    /* max-w-7xl */
```

**Apply to instructor components:**
- All cards: `p-4` for compact, `p-6` for comfortable
- Grid layouts: `gap-4` for tight spacing, `gap-6` for comfortable
- Section spacing: `space-y-6` for comfortable layouts

---

### 4.3 Border Radius Scale

```css
--radius-sm: 6px
--radius-md: 10px   /* Default for most components */
--radius-lg: 16px   /* Cards */
--radius-xl: 20px
--radius-2xl: 24px
```

**Apply to instructor components:**
- Cards: `rounded-xl` (16px)
- Buttons: `rounded-md` (10px)
- Badges: `rounded-md` (10px)
- Pills/Tags: `rounded-full`

---

### 4.4 Shadows (Elevation)

**Physical shadows:**
```css
--shadow-e1: 0 1px 2px rgba(15, 14, 12, 0.06)
--shadow-e2: 0 2px 8px rgba(15, 14, 12, 0.08)
--shadow-e3: 0 8px 24px rgba(15, 14, 12, 0.10)
```

**Glass shadows:**
```css
--shadow-glass-sm: 0 2px 16px rgba(15, 14, 12, 0.04)
--shadow-glass-md: 0 4px 24px rgba(15, 14, 12, 0.06)
--shadow-glass-lg: 0 8px 32px rgba(15, 14, 12, 0.08)
```

**Glows:**
```css
--glow-primary: 0 0 20px rgba(138, 107, 61, 0.15)
--glow-warning: 0 0 20px rgba(180, 83, 9, 0.15)
--glow-accent: 0 0 20px rgba(45, 108, 223, 0.15)
```

**Apply to instructor components:**
- Default state: `shadow-glass-md`
- Hover state: `shadow-glass-lg` + glow
- Active/Selected: Colored glow (`glow-primary`, `glow-accent`)

---

## Section 5: Accessibility Patterns

### 5.1 Keyboard Navigation

**Existing patterns:**
- Dialog: Escape to close, Tab to cycle focus
- Forms: Enter to submit
- Links/Buttons: Enter/Space to activate

**NOT implemented yet:** Custom keyboard shortcuts (j/k, e, f)

**Pattern to implement:**
```typescript
// Global keyboard listener (add to layout or dashboard)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle if no input is focused
    if (document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'j':
        // Navigate down in list
        break;
      case 'k':
        // Navigate up in list
        break;
      case 'e':
        // Endorse selected item
        break;
      case 'f':
        // Flag selected item
        break;
      case '?':
        // Show keyboard shortcuts help
        break;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [/* dependencies */]);
```

**Apply to instructor components:**
- `quick-action-toolbar.tsx`: Should render keyboard hint tooltips
- `priority-queue-panel.tsx`: Should support j/k navigation
- Hooks: Create `useKeyboardShortcuts` hook for reusability

---

### 5.2 ARIA Patterns

**Existing patterns:**
```typescript
// 1. Semantic HTML
<article aria-labelledby="course-id-title">
  <h2 id="course-id-title">Course Name</h2>
</article>

// 2. Live regions
<div role="log" aria-live="polite" aria-atomic="false">
  {messages.map(/* ... */)}
</div>

// 3. Loading states
<div role="status" aria-live="polite">
  <Spinner /> Loading...
</div>

// 4. Action labeling
<Button aria-label="Endorse this answer">
  <ThumbsUp className="size-4" />
  <span className="sr-only">Endorse</span>
</Button>
```

**Apply to instructor components:**
- All icon buttons: Add `aria-label`
- Loading states: Add `role="status"`
- List navigation: Add `role="listbox"`, `aria-selected`
- Bulk actions: Add `aria-describedby` to explain consequences

---

### 5.3 Focus Management

**Existing patterns:**
```typescript
// 1. Focus trap in modals (Radix FocusScope)
<FocusScope trapped={isOpen}>
  <Dialog>{/* content */}</Dialog>
</FocusScope>

// 2. Auto-focus on mount
onMountAutoFocus={(e) => {
  e.preventDefault();
  setTimeout(() => inputRef.current?.focus(), 100);
}}

// 3. Restore focus on close
onUnmountAutoFocus={(e) => {
  e.preventDefault(); // Let parent handle focus restoration
}}
```

**Apply to instructor components:**
- `endorsement-preview-modal.tsx`: Focus endorse button on open
- `priority-queue-panel.tsx`: Maintain focus when navigating with j/k
- Keyboard shortcuts: Show focus ring on selected item

---

## Section 6: Type System Analysis

### 6.1 Existing Types

**Location:** `/lib/models/types.ts` (685 lines)

**Key types for instructor features:**

```typescript
// Dashboard data
export interface InstructorDashboardData {
  managedCourses: CourseWithMetrics[];
  unansweredQueue: Thread[];
  recentActivity: ActivityItem[];
  insights: CourseInsight[];
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    unansweredThreads: StatWithTrend;
    activeStudents: StatWithTrend;
    aiCoverage: StatWithTrend;
  };
  goals: GoalProgress[];
}

// Metrics
export interface CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;
  recentActivity: number;
  threadSparkline?: number[];
  activitySparkline?: number[];
  aiCoveragePercent?: number;
}

// AI Answer (for endorsement)
export interface AIAnswer {
  id: string;
  threadId: string;
  courseId: string;
  content: string;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  citations: Citation[];
  studentEndorsements: number;
  instructorEndorsements: number;
  totalEndorsements: number;
  endorsedBy: string[];
  instructorEndorsed: boolean;
  generatedAt: string;
  updatedAt: string;
}
```

**NEW types needed:**

```typescript
// Priority ranking
export interface PriorityScore {
  threadId: string;
  score: number;
  factors: {
    unanswered: boolean;
    views: number;
    age: number; // hours since creation
    aiConfidence: number | null;
    studentEndorsements: number;
  };
}

// FAQ cluster
export interface FAQCluster {
  id: string;
  title: string; // Representative question
  threadIds: string[];
  threads: Thread[];
  frequency: number; // How many times this pattern occurs
  keywords: string[];
}

// Topic trend
export interface TopicTrend {
  topic: string;
  frequency: number;
  change: number; // Delta from last week
  threads: Thread[];
}

// Response template
export interface ResponseTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Bulk action
export interface BulkActionInput {
  action: 'endorse' | 'flag' | 'resolve' | 'tag';
  threadIds: string[];
  userId: string;
  metadata?: Record<string, unknown>;
}
```

---

### 6.2 Type Guard Patterns

**Existing patterns:**
```typescript
export function isHighConfidence(answer: AIAnswer): boolean {
  return answer.confidenceLevel === 'high' && answer.confidenceScore >= 70;
}

export function hasAIAnswer(thread: Thread): thread is Required<Pick<Thread, 'hasAIAnswer' | 'aiAnswerId'>> & Thread {
  return thread.hasAIAnswer === true && thread.aiAnswerId !== undefined;
}
```

**NEW guards needed:**
```typescript
export function isUnanswered(thread: Thread): boolean {
  return thread.status === 'open';
}

export function requiresAttention(thread: Thread, aiAnswer?: AIAnswer): boolean {
  if (isUnanswered(thread)) return true;
  if (aiAnswer && !aiAnswer.instructorEndorsed && aiAnswer.confidenceScore < 70) return true;
  return false;
}
```

---

## Section 7: Performance Considerations

### 7.1 Memoization

**Existing patterns:**
```typescript
// 1. useMemo for expensive computations
const displayedActivities = React.useMemo(
  () => activities.slice(0, maxItems),
  [activities, maxItems]
);

// 2. useCallback for callbacks passed to children
const handleEndorse = React.useCallback((id: string) => {
  endorseMutation.mutate({ aiAnswerId: id, userId, isInstructor: true });
}, [endorseMutation, userId]);

// 3. React.memo for pure components
export const ThreadCard = React.memo(({ thread, onClick }: ThreadCardProps) => {
  // ...
});
```

**Apply to instructor components:**
- `priority-queue-panel.tsx`: Memoize priority score calculations
- `faq-cluster-card.tsx`: Memoize keyword extraction
- `topic-heatmap.tsx`: Memoize heatmap data transformation

---

### 7.2 React Query Caching

**Existing strategy:**
- **Prefetch on hover:** Not implemented yet, but could prefetch thread details
- **Optimistic updates:** Used for endorsements
- **Background refetch:** Used for notifications (poll every 60s)

**Apply to instructor components:**
- Priority queue: Prefetch thread details on hover
- Bulk actions: Optimistic updates for all mutations
- Topic trends: Long stale time (5 minutes), expensive to recompute

---

### 7.3 Bundle Size

**Current UI components:** 2,321 lines total
**Average component size:** ~100 lines

**Target for new components:**
- Simple components: 50-150 lines
- Complex components: 150-250 lines
- If >250 lines: Split into sub-components

**Code splitting:**
- Modals: Lazy load (`React.lazy`) since they're not always visible
- Charts: Lazy load (recharts is heavy)
- Templates: Lazy load (user feature, not critical)

---

## Section 8: Reusability Matrix

| Component to Build | Reusable Pattern | Existing Component | Complexity |
|--------------------|------------------|-------------------|------------|
| `quick-action-toolbar.tsx` | Button group + Tooltips | `Button`, `Tooltip` | LOW |
| `priority-queue-panel.tsx` | Card list + Skeleton | `TimelineActivity`, `Card` | MEDIUM |
| `faq-cluster-card.tsx` | Accordion + Card | `Accordion`, `Card` | MEDIUM |
| `instructor-ai-agent.tsx` | Floating dialog + Focus | `FloatingQuokka` pattern | HIGH |
| `topic-heatmap.tsx` | Grid visualization | `StatCard` pattern | MEDIUM |
| `endorsement-preview-modal.tsx` | Dialog + Form | `ConversationToThreadModal` | LOW |
| `response-template-picker.tsx` | Dropdown + List | `DropdownMenu`, `Sheet` | LOW |
| `student-engagement-card.tsx` | Metrics grid | `StatCard`, `EnhancedCourseCard` | LOW |

---

## Section 9: Anti-Patterns to Avoid

### 9.1 Hardcoded Values
```typescript
// ❌ BAD
<Button className="bg-[#8A6B3D]">Endorse</Button>

// ✅ GOOD
<Button className="bg-primary">Endorse</Button>
```

### 9.2 Inline Styles
```typescript
// ❌ BAD
<div style={{ color: "#8A6B3D", padding: "16px" }}>

// ✅ GOOD
<div className="text-primary p-4">
```

### 9.3 Magic Numbers
```typescript
// ❌ BAD
const priority = views * 2 + age * 0.5 + endorsements * 3;

// ✅ GOOD
const WEIGHTS = { views: 2, age: 0.5, endorsements: 3 } as const;
const priority = views * WEIGHTS.views + age * WEIGHTS.age + endorsements * WEIGHTS.endorsements;
```

### 9.4 Direct DOM Manipulation
```typescript
// ❌ BAD
document.getElementById('thread-123').classList.add('selected');

// ✅ GOOD
const [selectedId, setSelectedId] = useState<string | null>(null);
<ThreadCard selected={thread.id === selectedId} />
```

### 9.5 Missing Loading States
```typescript
// ❌ BAD
return <PriorityQueue threads={threads} />;

// ✅ GOOD
if (loading) return <PriorityQueueSkeleton />;
if (error) return <ErrorState />;
if (threads.length === 0) return <EmptyState />;
return <PriorityQueue threads={threads} />;
```

---

## Section 10: Key Decisions & Recommendations

### 10.1 Keyboard Shortcuts Implementation

**Recommendation:** Create a custom hook `useKeyboardShortcuts`

**Rationale:**
- Reusable across all instructor components
- Centralized logic for conflict detection
- Easy to document and test
- Can show help modal (?) to list all shortcuts

**Location:** `/hooks/use-keyboard-shortcuts.ts`

---

### 10.2 QuokkaTA AI Agent Design

**Recommendation:** Create separate component, NOT extend FloatingQuokka

**Rationale:**
- Different purpose: Instructor insights vs student Q&A
- Different visual identity: Primary/secondary colors vs AI purple
- Different position: Top-left vs bottom-right (avoid overlap)
- Different triggers: Cmd+I vs floating button

**Key differences:**
```
FloatingQuokka (Student)         QuokkaTA (Instructor)
- Bottom-right corner            - Top-right corner (near quick actions)
- AI purple gradient             - Primary brown gradient
- Question answering             - Triage suggestions
- "Ask me anything"              - "How can I help you triage?"
- Minimized by default           - Hidden by default, Cmd+I to open
```

---

### 10.3 Priority Ranking Algorithm

**Recommendation:** Server-side computation, client-side caching

**Rationale:**
- Algorithm needs to be consistent across sessions
- Expensive computation (scoring, sorting)
- Mock implementation can be deterministic (seed-based)
- React Query can cache results for 2 minutes

**Mock algorithm weights:**
```typescript
const PRIORITY_WEIGHTS = {
  unanswered: 10,        // Highest priority
  lowAIConfidence: 5,    // AI not confident
  notEndorsed: 3,        // AI answer not endorsed by instructor
  highViews: 2,          // Lots of views = important
  recentActivity: 1,     // Recent posts = active discussion
} as const;
```

---

### 10.4 Component File Organization

**Recommendation:** Create `/components/instructor/` directory

**Structure:**
```
components/
  instructor/
    quick-action-toolbar.tsx
    priority-queue-panel.tsx
    priority-queue-item.tsx     # Sub-component
    faq-cluster-card.tsx
    faq-cluster-item.tsx        # Sub-component
    instructor-ai-agent.tsx
    topic-heatmap.tsx
    endorsement-preview-modal.tsx
    response-template-picker.tsx
    response-template-item.tsx  # Sub-component
    student-engagement-card.tsx
```

**Rationale:**
- Clear separation from student components
- Easy to find instructor-specific code
- Can add index.ts for named exports
- Follows existing pattern (`components/dashboard/`, `components/course/`)

---

## Section 11: Open Questions & Risks

### 11.1 Open Questions

1. **Keyboard shortcuts scope:** Global or component-scoped?
   - **Recommendation:** Global with context awareness (only active on dashboard)

2. **Bulk action confirmation:** Modal or inline?
   - **Recommendation:** Modal for destructive actions (flag), inline for safe actions (endorse)

3. **Topic heatmap data source:** Real-time or cached?
   - **Recommendation:** Cached (5 min stale time), expensive computation

4. **Response templates storage:** localStorage or mock API?
   - **Recommendation:** Mock API for consistency with other features

5. **QuokkaTA position:** Fixed or draggable?
   - **Recommendation:** Fixed position, users can minimize if it's in the way

### 11.2 Risks

1. **Performance risk:** Priority queue with 100+ threads
   - **Mitigation:** Virtualization (react-window), pagination, or limit to top 50

2. **UX risk:** Too many keyboard shortcuts = confusion
   - **Mitigation:** Show help modal (?), limit to 5 core shortcuts, visual hints

3. **Accessibility risk:** Keyboard shortcuts conflict with screen readers
   - **Mitigation:** Only activate when no input focused, document thoroughly

4. **Data risk:** FAQ clustering might produce poor results with mock data
   - **Mitigation:** Use simple keyword matching, focus on UI patterns not algorithm

5. **Complexity risk:** 8 components + hooks + types = lots of new code
   - **Mitigation:** Incremental implementation, reuse existing patterns heavily

---

## Conclusion

The QuokkaQ codebase provides an excellent foundation for instructor-specific components:
- **Component patterns:** Well-established, props-driven, composable
- **Type system:** Comprehensive, strict, easily extensible
- **Design system:** Consistent, accessible, documented
- **Performance patterns:** Memoization, React Query, optimistic updates

**Primary recommendation:** Extend existing patterns rather than creating new ones. 90% of what we need already exists in some form.

**Next step:** Read `plans/component-design.md` for detailed implementation plan.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Lines:** 600+

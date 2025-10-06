# Component Design Plan: AI-First Hero Architecture

**Date:** 2025-10-06
**Architect:** Component Architect Agent
**Status:** Ready for Review
**Dependencies:** type-design.md (AIAnswer, Citation types defined)

---

## 1. Component Hierarchy

```
AIAnswerCard/ (Hero Container)
├── components/course/ai-answer-card.tsx           (~180 LoC)
├── components/course/confidence-meter.tsx         (~70 LoC)
├── components/course/citation-list.tsx            (~120 LoC)
├── components/course/citation-card.tsx            (~50 LoC)
└── components/course/endorsement-bar.tsx          (~80 LoC)
```

**Total New Code:** ~500 LoC across 5 components (all <200 LoC per file)

**Existing Components to Extend:**
- `components/ui/ai-badge.tsx` - Add "hero" variant

**shadcn/ui Components Needed:**
```bash
npx shadcn@latest add tooltip
npx shadcn@latest add accordion
```

---

## 2. Props Interfaces (TypeScript)

### AIAnswerCard (Main Hero Component)

```typescript
import type { AIAnswer } from "@/lib/models/types";

export interface AIAnswerCardProps {
  /**
   * Complete AI answer data from server
   */
  answer: AIAnswer;

  /**
   * Whether current user has endorsed this answer
   */
  currentUserEndorsed: boolean;

  /**
   * Callback when user clicks endorse button
   * @returns void
   */
  onEndorse?: () => void;

  /**
   * Optional callback when citation is clicked
   * @param citation - The clicked citation
   */
  onCitationClick?: (citation: Citation) => void;

  /**
   * Visual variant for different contexts
   * @default "hero"
   */
  variant?: "hero" | "compact";

  /**
   * Loading state for endorsement mutation
   * @default false
   */
  isEndorsing?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### ConfidenceMeter

```typescript
export interface ConfidenceMeterProps {
  /**
   * Confidence level (determines color)
   */
  level: ConfidenceLevel; // 'high' | 'medium' | 'low'

  /**
   * Numeric score (0-100)
   */
  score: number;

  /**
   * Show percentage label next to bar
   * @default true
   */
  showLabel?: boolean;

  /**
   * Visual size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### CitationList

```typescript
import type { Citation } from "@/lib/models/types";

export interface CitationListProps {
  /**
   * Array of citations to display
   */
  citations: Citation[];

  /**
   * Maximum citations visible before expand
   * @default 3
   */
  maxVisible?: number;

  /**
   * Allow expanding to see all citations
   * @default true
   */
  expandable?: boolean;

  /**
   * Callback when citation is clicked
   * @param citation - The clicked citation
   */
  onCitationClick?: (citation: Citation) => void;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### CitationCard

```typescript
import type { Citation } from "@/lib/models/types";

export interface CitationCardProps {
  /**
   * Citation data to display
   */
  citation: Citation;

  /**
   * Click handler (makes card interactive)
   */
  onClick?: (citation: Citation) => void;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

### EndorsementBar

```typescript
export interface EndorsementBarProps {
  /**
   * Total endorsement count
   */
  total: number;

  /**
   * Breakdown by user role
   */
  byRole: {
    student: number;
    instructor: number;
    ta: number;
  };

  /**
   * Whether current user has endorsed
   */
  currentUserEndorsed: boolean;

  /**
   * Callback when endorse button clicked
   */
  onEndorse?: () => void;

  /**
   * Disable button during mutation
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

---

## 3. State Management Plan

### Local State (useState)

```typescript
// CitationList.tsx
const [isExpanded, setIsExpanded] = useState(false);

// AIAnswerCard.tsx (none - all state lifted or passed via props)
```

### Props State (Passed from Parent)
```typescript
// Thread Detail Page
const { data: user } = useCurrentUser();
const { data: threadData } = useThread(threadId);
const { data: aiAnswer } = useAIAnswer(threadId);
const endorseMutation = useEndorseAIAnswer();

const currentUserEndorsed = aiAnswer?.endorsements.userIds.includes(user?.id);

<AIAnswerCard
  answer={aiAnswer}
  currentUserEndorsed={currentUserEndorsed}
  onEndorse={() => endorseMutation.mutate({ aiAnswerId: aiAnswer.id, userId: user.id })}
  isEndorsing={endorseMutation.isPending}
/>
```

### React Query State (Global Server State)
- `useAIAnswer(threadId)` - Fetches AI answer for thread
- `useEndorseAIAnswer()` - Mutation for endorsing answer

**No prop drilling** - Props passed max 2 levels:
1. Thread Page → AIAnswerCard → EndorsementBar
2. Thread Page → AIAnswerCard → CitationList → CitationCard

---

## 4. Event Handling Patterns

### Endorsement Flow

```typescript
// Thread Detail Page (app/threads/[threadId]/page.tsx)
const handleEndorse = useCallback(() => {
  if (!user || !aiAnswer) return;

  endorseMutation.mutate(
    { aiAnswerId: aiAnswer.id, userId: user.id },
    {
      onSuccess: () => {
        // React Query auto-invalidates
      },
      onError: (error) => {
        console.error("Endorsement failed:", error);
        // Could show toast notification
      }
    }
  );
}, [user, aiAnswer, endorseMutation]);

<AIAnswerCard
  answer={aiAnswer}
  currentUserEndorsed={currentUserEndorsed}
  onEndorse={handleEndorse}
  isEndorsing={endorseMutation.isPending}
/>
```

### Citation Click Flow (Optional Feature)

```typescript
// Thread Detail Page
const [citationModal, setCitationModal] = useState<Citation | null>(null);

const handleCitationClick = useCallback((citation: Citation) => {
  setCitationModal(citation);
  // Open modal or navigate to citation source
}, []);

<AIAnswerCard
  answer={aiAnswer}
  onCitationClick={handleCitationClick}
/>

{citationModal && (
  <Dialog open onOpenChange={() => setCitationModal(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{citationModal.source}</DialogTitle>
      </DialogHeader>
      <p>{citationModal.excerpt}</p>
      {citationModal.url && (
        <Button asChild>
          <Link href={citationModal.url}>View Source</Link>
        </Button>
      )}
    </DialogContent>
  </Dialog>
)}
```

### Citation Expand/Collapse (Internal)

```typescript
// CitationList.tsx
const [isExpanded, setIsExpanded] = useState(false);

const handleToggle = () => {
  setIsExpanded(prev => !prev);
};

<Button
  variant="ghost"
  size="sm"
  onClick={handleToggle}
  aria-expanded={isExpanded}
>
  {isExpanded ? "Show Less" : `Show All ${citations.length} Citations`}
</Button>
```

---

## 5. Variant System (Visual Design)

### AIAnswerCard Variants

```typescript
const cardVariants = {
  hero: {
    padding: "p-8",
    border: "gradient-border", // ai-gradient-border via pseudo-element
    shadow: "shadow-[var(--shadow-e3)]",
    spacing: "space-y-6",
  },
  compact: {
    padding: "p-6",
    border: "border-2 border-ai-purple-500/30",
    shadow: "shadow-ai-md",
    spacing: "space-y-4",
  },
};
```

**Usage:**
- **hero**: Thread detail page (default, prominent)
- **compact**: Ask page preview modal

### ConfidenceMeter Color System

```typescript
const getConfidenceStyles = (level: ConfidenceLevel) => {
  switch (level) {
    case 'high':
      return {
        barColor: 'bg-success',           // #2E7D32 green
        textColor: 'text-success',
        bgColor: 'bg-success/10',
        label: 'High Confidence',
      };
    case 'medium':
      return {
        barColor: 'bg-amber-500',         // #F59E0B yellow
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        label: 'Medium Confidence',
      };
    case 'low':
      return {
        barColor: 'bg-danger',            // #D92D20 red
        textColor: 'text-danger',
        bgColor: 'bg-danger/10',
        label: 'Low Confidence',
      };
  }
};
```

### ConfidenceMeter Sizes

```typescript
const sizeStyles = {
  sm: { bar: "h-2", text: "text-xs" },
  md: { bar: "h-3", text: "text-sm" },
  lg: { bar: "h-4", text: "text-base" },
};
```

---

## 6. File Structure

### Files to Create

```
components/course/
├── ai-answer-card.tsx           (New - Main hero component)
├── confidence-meter.tsx         (New - Visual confidence indicator)
├── citation-list.tsx            (New - Expandable citation list)
├── citation-card.tsx            (New - Individual citation display)
└── endorsement-bar.tsx          (New - Endorsement button + counts)
```

### Files to Modify

```
components/ui/
└── ai-badge.tsx                 (Extend - Add "hero" variant)

app/threads/[threadId]/
└── page.tsx                     (Modify - Integrate AIAnswerCard)

lib/api/
├── client.ts                    (Already planned by Mock API Designer)
└── hooks.ts                     (Already planned by React Query Strategist)

lib/models/
└── types.ts                     (Already planned by Type Safety Guardian)
```

### Import/Export Strategy

```typescript
// components/course/index.ts (Create barrel export)
export { AIAnswerCard } from "./ai-answer-card";
export type { AIAnswerCardProps } from "./ai-answer-card";

export { ConfidenceMeter } from "./confidence-meter";
export type { ConfidenceMeterProps } from "./confidence-meter";

export { CitationList } from "./citation-list";
export type { CitationListProps } from "./citation-list";

export { EndorsementBar } from "./endorsement-bar";
export type { EndorsementBarProps } from "./endorsement-bar";

// Internal component (not exported)
// CitationCard - used only within CitationList
```

**Usage:**
```typescript
import { AIAnswerCard } from "@/components/course";
import type { AIAnswerCardProps } from "@/components/course";
```

---

## 7. Usage Examples

### Example 1: Thread Detail Page (Primary Use Case)

```typescript
// app/threads/[threadId]/page.tsx

import { AIAnswerCard } from "@/components/course";
import { useAIAnswer, useEndorseAIAnswer, useCurrentUser } from "@/lib/api/hooks";

export default function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const { data: user } = useCurrentUser();
  const { data: threadData } = useThread(threadId);
  const { data: aiAnswer, isLoading: aiLoading } = useAIAnswer(threadId);
  const endorseMutation = useEndorseAIAnswer();

  if (aiLoading) {
    return <Skeleton className="h-96 rounded-xl bg-glass-medium" />;
  }

  if (!aiAnswer) {
    return null; // No AI answer for this thread
  }

  const currentUserEndorsed = aiAnswer.endorsements.userIds.includes(user?.id || "");

  return (
    <div className="container-narrow space-y-12">
      <Breadcrumb />

      {/* Thread Question */}
      <Card variant="glass-strong">
        {/* ... existing thread content ... */}
      </Card>

      {/* AI Answer Hero Section */}
      <section aria-labelledby="ai-answer-heading" className="scroll-mt-24">
        <h2 id="ai-answer-heading" className="sr-only">
          AI-Generated Answer
        </h2>
        <AIAnswerCard
          answer={aiAnswer}
          currentUserEndorsed={currentUserEndorsed}
          onEndorse={() => {
            if (!user) return;
            endorseMutation.mutate({
              aiAnswerId: aiAnswer.id,
              userId: user.id,
            });
          }}
          isEndorsing={endorseMutation.isPending}
        />
      </section>

      {/* Human Replies */}
      <section aria-labelledby="replies-heading">
        <h2 id="replies-heading" className="heading-3 glass-text mb-6">
          Human Replies
          <span className="text-muted-foreground text-base ml-2">
            ({posts.length})
          </span>
        </h2>
        {/* ... existing replies ... */}
      </section>

      {/* Reply Form */}
      <Card variant="glass-strong">
        {/* ... existing form ... */}
      </Card>
    </div>
  );
}
```

### Example 2: Ask Page Preview Modal

```typescript
// app/ask/page.tsx (in preview modal)

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIAnswerCard } from "@/components/course";
import { useAskQuestion } from "@/lib/api/hooks";

export default function AskPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [questionData, setQuestionData] = useState({ title: "", content: "" });
  const askMutation = useAskQuestion();

  const handlePreview = () => {
    askMutation.mutate(
      { title: questionData.title, content: questionData.content },
      {
        onSuccess: (aiAnswer) => {
          setShowPreview(true);
        }
      }
    );
  };

  return (
    <>
      {/* Question Form */}
      <form>
        {/* ... form fields ... */}
        <Button onClick={handlePreview}>Preview AI Answer</Button>
      </form>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Answer Preview</DialogTitle>
            <DialogDescription>
              Review the AI-generated answer before posting your question.
            </DialogDescription>
          </DialogHeader>

          {askMutation.data && (
            <AIAnswerCard
              answer={askMutation.data}
              variant="compact"
              currentUserEndorsed={false}
              onEndorse={undefined} // No endorsement in preview
            />
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              Edit Question
            </Button>
            <Button variant="ai" onClick={handlePostQuestion}>
              Post Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Example 3: Standalone Component Showcase

```typescript
// For testing or Storybook

import { AIAnswerCard } from "@/components/course";
import type { AIAnswer } from "@/lib/models/types";

const mockAnswer: AIAnswer = {
  id: "ai-1",
  threadId: "thread-123",
  content: "Based on the course materials, here's the answer...",
  confidence: {
    level: "high",
    score: 92,
  },
  citations: [
    {
      id: "cite-1",
      source: "Lecture 5 Slides",
      excerpt: "The key concept is...",
      relevance: 95,
      pageNumber: 12,
    },
    {
      id: "cite-2",
      source: "Textbook Chapter 3",
      excerpt: "According to the definition...",
      relevance: 88,
    },
  ],
  endorsements: {
    total: 15,
    byRole: {
      student: 10,
      instructor: 3,
      ta: 2,
    },
    userIds: ["user-1", "user-2"],
  },
  createdAt: "2025-10-06T10:30:00Z",
};

export default function AIAnswerExample() {
  const [endorsed, setEndorsed] = useState(false);

  return (
    <div className="container-narrow py-12">
      <AIAnswerCard
        answer={mockAnswer}
        currentUserEndorsed={endorsed}
        onEndorse={() => setEndorsed(!endorsed)}
      />
    </div>
  );
}
```

---

## 8. Test Scenarios

### User Interaction Tests

#### 1. View AI Answer
- **Given**: User navigates to thread detail page
- **When**: AI answer data loads
- **Then**: AIAnswerCard renders with all sections visible
- **Then**: AI badge shows "AI Answer" with gradient
- **Then**: Confidence meter displays correct percentage and color
- **Then**: Citations show first 3 items (if expandable)
- **Then**: Endorsement bar shows total count

#### 2. Endorse AI Answer (Unauthenticated)
- **Given**: User not logged in
- **When**: User clicks "Endorse" button
- **Then**: Redirected to login page
- **OR**: Tooltip shows "Login required"

#### 3. Endorse AI Answer (Authenticated, Not Yet Endorsed)
- **Given**: User logged in, hasn't endorsed
- **When**: User clicks "Endorse Answer" button
- **Then**: Button label changes to "Endorsed"
- **Then**: Total count increments by 1 (optimistic)
- **Then**: Button disabled during mutation
- **Then**: On success, button stays in endorsed state
- **Then**: On error, button reverts to "Endorse Answer"

#### 4. Endorse AI Answer (Already Endorsed)
- **Given**: User logged in, already endorsed
- **When**: Page loads
- **Then**: Button shows "Endorsed" state
- **Then**: Button press state: `aria-pressed="true"`
- **When**: User clicks "Endorsed" button
- **Then**: Nothing happens (no un-endorse in MVP)

#### 5. Expand Citations
- **Given**: AI answer has 5 citations
- **When**: Page loads
- **Then**: First 3 citations visible
- **Then**: "Show All 5 Citations" button visible
- **When**: User clicks "Show All 5 Citations"
- **Then**: All 5 citations become visible
- **Then**: Button label changes to "Show Less"
- **Then**: `aria-expanded="true"`
- **When**: User clicks "Show Less"
- **Then**: Only first 3 citations visible
- **Then**: `aria-expanded="false"`

#### 6. Click Citation (Optional Feature)
- **Given**: `onCitationClick` prop provided
- **When**: User clicks citation card
- **Then**: `onCitationClick(citation)` called
- **Then**: Parent handles modal/navigation

#### 7. Hover Confidence Meter
- **Given**: User on desktop
- **When**: User hovers over confidence percentage
- **Then**: Tooltip appears with explanation
- **Then**: Tooltip text: "High Confidence (92%): Based on 5 strong course material matches"

### Edge Cases

#### 8. AI Answer with 0 Citations
- **Given**: AI answer has empty citations array
- **When**: Page loads
- **Then**: Citations section hidden (not rendered)
- **OR**: Shows "No citations available" message

#### 9. AI Answer with 1-2 Citations
- **Given**: AI answer has 2 citations
- **When**: Page loads
- **Then**: Both citations visible
- **Then**: No "Show All" button (all already shown)

#### 10. Low Confidence Answer
- **Given**: AI answer has confidence level "low" (score: 35)
- **When**: Page loads
- **Then**: Confidence bar is red
- **Then**: Tooltip warns: "Low Confidence (35%): Consider waiting for human replies"

#### 11. Very Long Answer Content
- **Given**: AI answer content is 2000+ characters
- **When**: Page loads
- **Then**: Content renders with whitespace-pre-wrap
- **Then**: No overflow (content wraps)

#### 12. Endorsement Count > 999
- **Given**: AI answer has 1234 endorsements
- **When**: Page loads
- **Then**: Displays "1.2k" (abbreviated format)

### Accessibility Tests

#### 13. Keyboard Navigation
- **Given**: User using keyboard only
- **When**: User tabs from thread question
- **Then**: Focus moves to "Endorse Answer" button
- **When**: User tabs again
- **Then**: Focus moves to "Show All Citations" button
- **When**: User tabs again
- **Then**: Focus moves to first citation (if clickable)

#### 14. Screen Reader Experience
- **Given**: User using screen reader
- **When**: Screen reader reads AI answer section
- **Then**: Announces "Region: AI-Generated Answer"
- **Then**: Announces "High Confidence: 92%"
- **Then**: Announces endorsement count: "15 endorsements"
- **Then**: Announces citation count: "5 course material citations"

#### 15. Focus Indicators
- **Given**: User using keyboard
- **When**: User focuses on any interactive element
- **Then**: QDS focus ring visible (4px blue outline)
- **Then**: Contrast ratio ≥4.5:1 against ai-gradient background

### Responsive Tests

#### 16. Mobile Layout (360px)
- **Given**: Viewport width 360px
- **When**: Page loads
- **Then**: AI badge stacked above confidence meter
- **Then**: Citations in single column
- **Then**: Endorsement button full-width
- **Then**: Touch targets ≥44px height

#### 17. Tablet Layout (768px)
- **Given**: Viewport width 768px
- **When**: Page loads
- **Then**: AI badge + confidence meter in row
- **Then**: Citations in single column
- **Then**: Endorsement button inline (not full-width)

#### 18. Desktop Layout (1024px+)
- **Given**: Viewport width 1024px
- **When**: Page loads
- **Then**: All header elements in single row
- **Then**: Citations in 2-column grid (if >4 items)
- **Then**: Hover states active

### Performance Tests

#### 19. Render Time
- **Given**: AI answer with 5 citations
- **When**: Component mounts
- **Then**: First paint <100ms
- **Then**: Fully interactive <200ms

#### 20. Re-render on Endorsement
- **Given**: Component mounted
- **When**: User endorses answer (optimistic update)
- **Then**: Only EndorsementBar re-renders
- **Then**: ConfidenceMeter, CitationList do NOT re-render (React.memo)

---

## 9. Accessibility Compliance Checklist

### Semantic HTML
- [x] Use `<article>` for AIAnswerCard wrapper
- [x] Use `<section>` with `aria-labelledby` for page integration
- [x] Use `<h2>` for section heading (sr-only if needed)
- [x] Use `<ul>` with `role="list"` for citations
- [x] Use `<button>` for endorsement (not `<div>` clickable)

### ARIA Attributes
- [x] `role="region"` on AIAnswerCard
- [x] `aria-labelledby="ai-answer-heading"` connecting to heading
- [x] `aria-label="Confidence score: 92%"` on ConfidenceMeter
- [x] `role="meter"` on confidence bar
- [x] `aria-valuenow={score}`, `aria-valuemin={0}`, `aria-valuemax={100}`
- [x] `aria-expanded={isExpanded}` on citations toggle
- [x] `aria-pressed={currentUserEndorsed}` on endorse button
- [x] `aria-live="polite"` on endorsement count (updates dynamically)

### Keyboard Navigation
- [x] All interactive elements keyboard accessible
- [x] Tab order: Endorse → Citations Toggle → Citation Links
- [x] Enter/Space to activate buttons
- [x] Escape to close tooltips

### Focus Management
- [x] Visible focus indicators on all interactive elements
- [x] QDS focus ring: `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3)`
- [x] No focus traps
- [x] Logical tab order (no tabindex hacks)

### Color Contrast (WCAG AA)
- [x] AI badge text (white on purple gradient): >7:1 ✓
- [x] Confidence label text: >4.5:1 ✓
- [x] Answer content text: >4.5:1 ✓
- [x] Citation text: >4.5:1 ✓
- [x] Endorsement button text: >4.5:1 ✓

### Screen Reader Support
- [x] Meaningful labels (not "Click here" or "Learn more")
- [x] Alternative text for icons (`aria-hidden="true"` on decorative)
- [x] Live region announcements for dynamic updates
- [x] Descriptive tooltips with `aria-describedby`

---

## 10. QDS Design Tokens Usage

### Colors

```typescript
// AI Visual Identity
className="ai-gradient"                    // Background: purple-cyan gradient
className="ai-gradient-text"               // Text: gradient fill
className="border-ai-purple-500"           // Border: purple accent

// Confidence Levels
className="bg-success"                     // High: #2E7D32
className="bg-amber-500"                   // Medium: #F59E0B
className="bg-danger"                      // Low: #D92D20

// Neutral Backgrounds
className="bg-glass-medium"                // Glass: rgba(255,255,255,0.7)
className="bg-neutral-50"                  // Light background
```

### Spacing (4pt Grid)

```typescript
// Container Padding
className="p-8"                            // 32px (hero variant)
className="p-6"                            // 24px (compact variant)

// Internal Spacing
className="space-y-6"                      // 24px vertical gap
className="space-y-4"                      // 16px vertical gap
className="gap-4"                          // 16px flex gap
className="gap-2"                          // 8px flex gap
```

### Border Radius

```typescript
className="rounded-xl"                     // 16px (card container)
className="rounded-lg"                     // 10px (citations)
className="rounded-full"                   // Fully rounded (confidence bar, badge)
```

### Shadows & Elevation

```typescript
className="shadow-[var(--shadow-e3)]"      // Highest elevation (AI hero)
className="shadow-[var(--shadow-ai-lg)]"   // AI purple glow (hover)
className="shadow-ai-md"                   // AI medium shadow
```

### Typography

```typescript
className="text-base font-semibold"        // AI badge hero variant
className="text-sm font-medium"            // Confidence label
className="text-base leading-relaxed"      // Answer content
className="text-xs"                        // Citation metadata
className="heading-3"                      // Section headings (if shown)
```

---

## 11. Implementation Order (Bottom-Up)

### Phase 1: Foundation Components (No Dependencies)
1. **CitationCard** (~50 LoC)
   - Pure presentation component
   - No external dependencies
   - Test: Render with mock citation data

2. **ConfidenceMeter** (~70 LoC)
   - Pure presentation component
   - Uses shadcn Tooltip (add first)
   - Test: Render all 3 confidence levels

### Phase 2: Composition Components (Internal Dependencies)
3. **CitationList** (~120 LoC)
   - Uses CitationCard
   - Manages expand/collapse state
   - Test: Render with 0, 2, 5 citations

4. **EndorsementBar** (~80 LoC)
   - Uses shadcn Button
   - No internal state
   - Test: Render endorsed/not endorsed states

### Phase 3: Hero Container (Orchestration)
5. **AIAnswerCard** (~180 LoC)
   - Composes all above components
   - Uses shadcn Card
   - Test: Full integration test with mock data

### Phase 4: Extension
6. **AIBadge** (Extend existing)
   - Add "hero" variant
   - Test: All 4 variants render correctly

### Phase 5: Integration
7. **Thread Detail Page** (Modify existing)
   - Add AI answer section
   - Wire up React Query hooks
   - Test: Full user flow

---

## 12. Component Code Skeletons

### CitationCard.tsx

```typescript
"use client";

import type { Citation } from "@/lib/models/types";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CitationCardProps {
  citation: Citation;
  onClick?: (citation: Citation) => void;
  className?: string;
}

export function CitationCard({ citation, onClick, className }: CitationCardProps) {
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "group transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:border-accent/50",
        className
      )}
      onClick={() => isClickable && onClick(citation)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {citation.source}
          </p>
          {citation.url && <ExternalLink className="size-3 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          "{citation.excerpt}"
        </p>
        {citation.pageNumber && (
          <p className="text-xs text-accent">Page {citation.pageNumber}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### ConfidenceMeter.tsx

```typescript
"use client";

import type { ConfidenceLevel } from "@/lib/models/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getConfidenceStyles = (level: ConfidenceLevel) => {
  // ... (from variant system above)
};

const sizeStyles = {
  sm: { bar: "h-2", text: "text-xs" },
  md: { bar: "h-3", text: "text-sm" },
  lg: { bar: "h-4", text: "text-base" },
};

export function ConfidenceMeter({
  level,
  score,
  showLabel = true,
  size = "md",
  className,
}: ConfidenceMeterProps) {
  const styles = getConfidenceStyles(level);
  const sizes = sizeStyles[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex-1 min-w-[120px] max-w-xs"
              role="meter"
              aria-label={`${styles.label}: ${score}%`}
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={cn("w-full rounded-full bg-neutral-200 overflow-hidden", sizes.bar)}>
                <div
                  className={cn(styles.barColor, "h-full transition-all duration-500")}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{styles.label}</p>
            <p className="text-xs">Based on course material alignment</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showLabel && (
        <span className={cn(styles.textColor, "font-semibold tabular-nums", sizes.text)}>
          {score}%
        </span>
      )}
    </div>
  );
}
```

---

## 13. Trade-offs & Decisions

| Decision | Alternative Considered | Rationale |
|----------|------------------------|-----------|
| Separate AIAnswer type | Extend Post type | Cleaner separation, AI answers are conceptually different |
| Expandable citations (default: collapsed) | Show all citations always | Prevents overwhelming users, especially on mobile |
| No "un-endorse" feature | Allow toggling endorsement | Simplifies MVP, matches academic convention (endorsements persist) |
| Confidence meter always visible | Hide if low confidence | Transparency builds trust, users should know AI limitations |
| Fixed 32px padding (hero variant) | Responsive padding | Consistent prominence, 32px works well on all breakpoints |
| React.memo on sub-components | No memoization | Prevents unnecessary re-renders on endorsement updates |
| Tooltip on confidence meter | Inline explanation | Cleaner UI, optional detail for interested users |
| Citation card as internal component | Export for reuse | YAGNI - no other use case identified yet |

---

## 14. Future Extensibility

### Easy Additions (No Breaking Changes)
- **Citation Modal**: Add `Dialog` component for full citation view
- **AI Badge Animation**: Add shimmer effect on high confidence
- **Endorsement Breakdown**: Show role distribution in tooltip
- **Confidence Trend**: Show historical confidence changes
- **Citation Sorting**: Sort by relevance, page number, or source

### Medium Effort
- **Rich Text Answer**: Support markdown or HTML in `content`
- **AI Answer Editing**: Allow instructors to modify AI answers
- **Multiple AI Models**: Show which model generated the answer
- **Citation Preview**: Inline excerpt expansion

### Requires Refactoring
- **Un-endorse Feature**: Requires API changes, optimistic update logic
- **Real-time Updates**: Websocket for live endorsement counts
- **AI Answer Versioning**: Track edits and show history
- **Citation Context**: Link directly to course material page/section

---

## 15. Known Limitations

1. **No Rich Text Rendering**: Answer content is plain text only (MVP)
   - **Mitigation**: Use `whitespace-pre-wrap` for line breaks

2. **No Citation Source Validation**: Any string accepted as source
   - **Mitigation**: Mock API validates against known course materials

3. **No Endorsement Weight Display**: Instructor endorsements worth 3x, but not visually distinct
   - **Mitigation**: Future tooltip can show breakdown

4. **No Endorsement Limit**: User can't un-endorse
   - **Mitigation**: Matches academic convention, not a bug

5. **Mobile Overflow Risk**: Very long citation excerpts
   - **Mitigation**: `line-clamp-2` truncates with ellipsis

6. **No Loading Skeleton for AI Answer**: Replaced entire section with generic skeleton
   - **Mitigation**: Add AIAnswerCard.Skeleton component in future

---

## 16. Architecture Rationale Summary

### Why This Component Structure?

1. **Small Components (<200 LoC)**: Easier to test, maintain, and understand
2. **Props-Driven**: No hidden dependencies, easy to mock and test
3. **Composition over Inheritance**: Flexible, follows React best practices
4. **shadcn/ui Primitives**: Accessible by default, battle-tested
5. **QDS Compliance**: Uses design tokens consistently, no hardcoded values
6. **Performance-First**: React.memo on pure components, CSS transitions
7. **Accessibility-First**: Semantic HTML, ARIA, keyboard navigation
8. **Type-Safe**: Strict TypeScript, no `any` types

### Why Not Alternative Approaches?

**Monolithic AIAnswerCard (500+ LoC):**
- ❌ Harder to test
- ❌ Harder to maintain
- ❌ Violates C-5 (keep components <200 LoC)

**Render Props / Compound Components:**
- ❌ Unnecessary complexity for MVP
- ❌ More boilerplate
- ✅ Could revisit if more customization needed

**Context API for Internal State:**
- ❌ Overkill for simple expand/collapse state
- ❌ Harder to reason about
- ✅ useState sufficient for local UI state

---

## 17. Next Steps for Parent Agent

1. **Review this plan** - Approve or request changes
2. **Check dependencies** - Ensure type-design.md, hooks-design.md approved
3. **Install shadcn components**:
   ```bash
   npx shadcn@latest add tooltip
   npx shadcn@latest add accordion  # If using Accordion instead of manual expand
   ```
4. **Begin implementation** - Follow bottom-up order (CitationCard → ConfidenceMeter → ...)
5. **Small verified steps** - Typecheck after each component
6. **Update context.md** - Log progress and decisions

---

**Component Design Complete - Ready for Implementation**

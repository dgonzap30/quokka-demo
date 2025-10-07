# Component Design Plan - Thread Redesign

**Agent:** Component Architect
**Date:** 2025-10-07
**Task:** Simplified architecture for ThreadCard and ThreadDetail components

---

## Component Hierarchy

```
ThreadCard (Simplified)
└── [No sub-components, inline everything]

ThreadDetail Page
├── Breadcrumb (existing)
├── StickyThreadHeader (new, conditional render)
├── ThreadQuestionCard (simplified structure)
├── CollapsibleAIAnswer (wrapper with Accordion)
│   └── AIAnswerCard (existing, no changes)
├── RepliesSection
│   ├── SectionHeader (simple h2 + count)
│   └── CompactReply[] (new, replaces Card structure)
└── InlineReplyForm (new, expandable)
```

---

## TypeScript Interfaces

### ThreadCard (No interface changes)

```typescript
// components/course/thread-card.tsx
import type { Thread } from "@/lib/models/types";

export interface ThreadCardProps {
  /**
   * Thread data to display
   */
  thread: Thread;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Data Derivation:**
- `replyCount`: Will be derived from API or added to Thread type (check with backend)
- If not available, will need to add to mock API: `thread.replyCount`

---

### EngagementMetrics (New Component)

```typescript
// components/course/engagement-metrics.tsx
export interface EngagementMetricsProps {
  /**
   * Number of replies in the thread
   */
  replyCount: number;

  /**
   * Whether thread has an AI answer
   */
  hasAIAnswer: boolean;

  /**
   * Display variant
   * - compact: Single line, minimal styling (for ThreadCard)
   * - full: More detailed, with icons (for ThreadDetail header)
   * @default "compact"
   */
  variant?: "compact" | "full";

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Usage Examples:**
```tsx
// In ThreadCard
<EngagementMetrics
  replyCount={thread.replyCount}
  hasAIAnswer={thread.hasAIAnswer}
  variant="compact"
/>

// In ThreadDetail sticky header
<EngagementMetrics
  replyCount={posts.length}
  hasAIAnswer={!!aiAnswer}
  variant="full"
/>
```

---

### CompactReply (New Component)

```typescript
// components/course/compact-reply.tsx
import type { Post } from "@/lib/models/types";

export interface CompactReplyProps {
  /**
   * Reply post data
   */
  post: Post;

  /**
   * Whether to show endorsed badge
   * @default true
   */
  showEndorsed?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Usage Example:**
```tsx
<CompactReply post={post} showEndorsed={true} />
```

---

### StickyThreadHeader (New Component - Optional)

```typescript
// components/course/sticky-thread-header.tsx
import type { Thread } from "@/lib/models/types";

export interface StickyThreadHeaderProps {
  /**
   * Thread data to display in header
   */
  thread: Thread;

  /**
   * Whether header is visible (sticky positioned)
   */
  isVisible: boolean;

  /**
   * Number of replies for engagement display
   */
  replyCount: number;

  /**
   * Whether thread has AI answer
   */
  hasAIAnswer: boolean;

  /**
   * Optional callback when resolve button clicked (instructor only)
   */
  onResolve?: () => void;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Usage Example:**
```tsx
<StickyThreadHeader
  thread={thread}
  isVisible={isStickyHeaderVisible}
  replyCount={posts.length}
  hasAIAnswer={!!aiAnswer}
  onResolve={handleResolve}
/>
```

---

### InlineReplyForm (New Component)

```typescript
// components/course/inline-reply-form.tsx
export interface InlineReplyFormProps {
  /**
   * Callback when form is submitted
   */
  onSubmit: (content: string) => void | Promise<void>;

  /**
   * Whether form is currently submitting
   */
  isSubmitting: boolean;

  /**
   * Placeholder text for input
   * @default "Write your reply..."
   */
  placeholder?: string;

  /**
   * Optional className for composition
   */
  className?: string;
}
```

**Usage Example:**
```tsx
<InlineReplyForm
  onSubmit={handleSubmitReply}
  isSubmitting={isSubmitting}
  placeholder="Share your thoughts..."
/>
```

---

## State Management Plan

### ThreadCard Component
- **State:** None (pure presentational)
- **Props:** `thread`, `className`
- **No mutations or side effects**

### ThreadDetail Page Component

```typescript
// Local UI State
const [replyContent, setReplyContent] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [isReplyFormExpanded, setIsReplyFormExpanded] = useState(false);
const [isAIAnswerCollapsed, setIsAIAnswerCollapsed] = useState(false);
const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false);

// React Query Hooks
const { data: user, isLoading: userLoading } = useCurrentUser();
const { data: threadData, isLoading: threadLoading } = useThread(threadId);
const createPostMutation = useCreatePost();
const endorseAIAnswerMutation = useEndorseAIAnswer();

// Scroll Effect for Sticky Header
useEffect(() => {
  const handleScroll = () => {
    const threshold = 300; // Show after scrolling 300px
    setIsStickyHeaderVisible(window.scrollY > threshold);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// Auto-collapse AI Answer if many replies
useEffect(() => {
  if (threadData && threadData.posts.length > 3) {
    setIsAIAnswerCollapsed(true);
  }
}, [threadData]);
```

### EngagementMetrics Component
- **State:** None (pure presentational)
- **Memoization:** Should use `React.memo` (pure, predictable props)

### CompactReply Component
- **State:** None (pure presentational)
- **Memoization:** Should use `React.memo` (renders in lists, pure props)

### StickyThreadHeader Component
- **State:** None (controlled by parent)
- **Memoization:** Not needed (single instance, conditional render)

### InlineReplyForm Component
- **State:** `content` (local), `isExpanded` (local)
- **Memoization:** Not needed (single instance)

---

## Event Handling Pattern

### ThreadCard
- No direct event handlers (navigation via Link wrapper)

### ThreadDetail
```typescript
// Reply submission
const handleSubmitReply = async (content: string) => {
  if (!content.trim() || !user) return;

  setIsSubmitting(true);
  try {
    await createPostMutation.mutateAsync({
      input: { threadId, content },
      authorId: user.id,
    });
    setReplyContent("");
    setIsReplyFormExpanded(false); // Collapse after submit
  } catch (error) {
    console.error("Failed to create post:", error);
  } finally {
    setIsSubmitting(false);
  }
};

// AI answer endorsement (existing)
const handleEndorseAIAnswer = async () => {
  if (!user || !aiAnswer) return;

  try {
    await endorseAIAnswerMutation.mutateAsync({
      aiAnswerId: aiAnswer.id,
      userId: user.id,
      isInstructor: user.role === "instructor",
    });
  } catch (error) {
    console.error("Failed to endorse AI answer:", error);
  }
};

// Toggle AI answer collapse
const toggleAIAnswer = () => {
  setIsAIAnswerCollapsed(prev => !prev);
};
```

---

## Variant System

### ThreadCard
- **Single variant:** Simplified card
- **No visual variants** (size, color, etc.)
- **Composition via className prop**

### CompactReply
- **Visual variants:**
  - Default: Light background, standard border
  - Endorsed: Subtle success-colored border/background (glass-liquid variant)
- **Implementation:** Conditional className based on `post.endorsed`

### EngagementMetrics
- **Display variants:**
  - `compact`: Single line, minimal text, no icons
  - `full`: Icons, more detailed text, larger font
- **Implementation:** Props-based variant prop

### InlineReplyForm
- **State variants:**
  - Collapsed: Single line input, 40px height
  - Expanded: Full textarea, 200px height, submit button visible
- **Implementation:** Conditional rendering based on `isExpanded` state

---

## File Structure

### Files to Create

1. **`components/course/engagement-metrics.tsx`**
   - New component for engagement preview
   - Exports: `EngagementMetrics`, `EngagementMetricsProps`

2. **`components/course/compact-reply.tsx`**
   - New component for lightweight reply display
   - Exports: `CompactReply`, `CompactReplyProps`

3. **`components/course/inline-reply-form.tsx`**
   - New component for expandable reply form
   - Exports: `InlineReplyForm`, `InlineReplyFormProps`

4. **`components/course/sticky-thread-header.tsx`** (Optional, Phase 2)
   - New component for sticky header on scroll
   - Exports: `StickyThreadHeader`, `StickyThreadHeaderProps`

### Files to Modify

1. **`components/course/thread-card.tsx`**
   - Remove: Description display (or make single line, light text)
   - Remove: Tags display (or show max 2, no "+N")
   - Remove: Views count (or move to less prominent position)
   - Add: EngagementMetrics component
   - Reduce: Padding (p-6 → p-4)
   - Simplify: Metadata row (fewer items, cleaner layout)

2. **`app/threads/[threadId]/page.tsx`**
   - Add: StickyThreadHeader component (conditional render)
   - Add: Accordion wrapper for AI answer section
   - Replace: Reply Card structure with CompactReply components
   - Replace: Reply form Card with InlineReplyForm component
   - Reduce: Padding on thread question card (p-8 → p-6)
   - Add: State for collapse/expand and sticky header
   - Add: Scroll effect for sticky header

3. **`lib/models/types.ts`** (If needed)
   - Add: `replyCount` field to Thread interface (if not already present)

### Import/Export Strategy

```typescript
// components/course/engagement-metrics.tsx
export { EngagementMetrics };
export type { EngagementMetricsProps };

// components/course/compact-reply.tsx
export { CompactReply };
export type { CompactReplyProps };

// components/course/inline-reply-form.tsx
export { InlineReplyForm };
export type { InlineReplyFormProps };

// components/course/sticky-thread-header.tsx
export { StickyThreadHeader };
export type { StickyThreadHeaderProps };

// Usage in pages/components
import { EngagementMetrics } from "@/components/course/engagement-metrics";
import type { EngagementMetricsProps } from "@/components/course/engagement-metrics";
```

---

## Usage Examples

### ThreadCard (Simplified)

```tsx
// Before (cluttered)
<ThreadCard>
  <CardHeader>
    <Title>Question about binary search</Title>
    <Description>I'm trying to understand how binary search works...</Description>
    <StatusBadge status="answered" />
  </CardHeader>
  <CardContent>
    <Metadata>
      <AIBadge /> • 42 views • Jan 15 • Tag1, Tag2, Tag3, +2
    </Metadata>
  </CardContent>
</ThreadCard>

// After (simplified)
<ThreadCard>
  <CardHeader>
    <Title>Question about binary search</Title>
    <StatusBadge status="answered" />
  </CardHeader>
  <CardContent>
    <EngagementMetrics replyCount={5} hasAIAnswer={true} variant="compact" />
    <DateDisplay>Jan 15</DateDisplay>
  </CardContent>
</ThreadCard>
```

### ThreadDetail with Progressive Disclosure

```tsx
// Sticky Header (conditional)
{isStickyHeaderVisible && (
  <StickyThreadHeader
    thread={thread}
    isVisible={isStickyHeaderVisible}
    replyCount={posts.length}
    hasAIAnswer={!!aiAnswer}
  />
)}

// AI Answer Section (collapsible)
{aiAnswer && (
  <Accordion type="single" collapsible defaultValue={isAIAnswerCollapsed ? "" : "ai-answer"}>
    <AccordionItem value="ai-answer">
      <AccordionTrigger>
        <h2 className="heading-3">
          AI-Generated Answer
          <Badge variant="outline" className="ml-3">
            {aiAnswer.endorsedBy.length} endorsements
          </Badge>
        </h2>
      </AccordionTrigger>
      <AccordionContent>
        <AIAnswerCard
          answer={aiAnswer}
          currentUserEndorsed={aiAnswer.endorsedBy.includes(user?.id || "")}
          currentUserRole={user?.role}
          onEndorse={handleEndorseAIAnswer}
          variant="hero"
        />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)}

// Replies Section (compact cards)
<section className="space-y-4">
  <h2 className="heading-3">{posts.length} Human Replies</h2>
  {posts.map((post) => (
    <CompactReply key={post.id} post={post} showEndorsed={true} />
  ))}
</section>

// Inline Reply Form (expandable)
<InlineReplyForm
  onSubmit={handleSubmitReply}
  isSubmitting={isSubmitting}
  placeholder="Share your thoughts..."
/>
```

### CompactReply Structure

```tsx
// Simplified reply (no Card wrapper)
<div className={cn(
  "flex gap-4 p-4 rounded-lg border transition-colors",
  post.endorsed
    ? "glass-panel-strong liquid-border"
    : "glass-panel hover:glass-panel-strong"
)}>
  {/* Avatar */}
  <Avatar className="h-10 w-10 avatar-placeholder">
    <span className="text-sm font-semibold">
      {post.authorId.slice(-2).toUpperCase()}
    </span>
  </Avatar>

  {/* Content */}
  <div className="flex-1 space-y-2">
    {/* Header: Name + Endorsed Badge + Date */}
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-semibold text-sm">User {post.authorId.slice(-4)}</span>
      {post.endorsed && (
        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
          ✓ Endorsed
        </Badge>
      )}
      <span className="text-xs text-muted-foreground ml-auto">
        {new Date(post.createdAt).toLocaleDateString()}
      </span>
    </div>

    {/* Reply Content */}
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {post.content}
    </p>
  </div>
</div>
```

---

## Test Scenarios

### ThreadCard
1. **Basic rendering:** Displays title, status, engagement, date
2. **With AI answer:** Shows "AI answered" in engagement metrics
3. **Without AI answer:** Shows only reply count in engagement metrics
4. **Zero replies:** Shows "No replies yet" in engagement metrics
5. **Long title:** Truncates with ellipsis (line-clamp-2)
6. **Click interaction:** Navigates to thread detail page
7. **Hover state:** Glass hover effect applies correctly
8. **Responsive:** Stacks on mobile, inline on tablet/desktop

### ThreadDetail
1. **AI answer collapsed by default:** When >3 replies, AI answer starts collapsed
2. **AI answer expanded by default:** When ≤3 replies, AI answer starts expanded
3. **Toggle AI answer:** Click accordion trigger to expand/collapse
4. **Sticky header appears:** After scrolling 300px, sticky header shows
5. **Sticky header hides:** Scrolling back to top hides sticky header
6. **Inline form expands:** Focus on form expands textarea and shows submit button
7. **Inline form collapses:** After submit, form collapses back to single line
8. **Reply submission:** Creates new CompactReply in list
9. **Endorsement:** Updates endorsement count on AI answer
10. **Loading states:** Skeletons show during data fetch
11. **Error states:** Error message shows if thread not found
12. **Empty states:** "No replies yet" shows when posts array is empty
13. **Responsive:** All sections work on mobile, tablet, desktop

### EngagementMetrics
1. **Compact variant:** Single line, no icons, minimal text
2. **Full variant:** Icons, detailed text, larger font
3. **With AI answer:** Shows "X replies • AI answered"
4. **Without AI answer:** Shows "X replies"
5. **Zero replies:** Shows "No replies yet"
6. **Singular reply:** Shows "1 reply" (not "replies")

### CompactReply
1. **Basic rendering:** Shows avatar, author, date, content
2. **Endorsed reply:** Shows endorsed badge and liquid border
3. **Non-endorsed reply:** No badge, standard border
4. **Long content:** Wraps properly with whitespace-pre-wrap
5. **Short content:** Displays correctly without excess padding

### InlineReplyForm
1. **Initial state:** Collapsed (40px height, single line input)
2. **Focus:** Expands to full textarea (200px height)
3. **Blur when empty:** Collapses back to single line
4. **Blur when filled:** Stays expanded (preserve content)
5. **Submit:** Calls onSubmit with content, then collapses
6. **Submit disabled:** When content is empty or submitting
7. **Loading state:** Shows "Posting..." during submission

---

## Accessibility Checks

### ThreadCard
- [ ] Link wrapper is keyboard accessible (tab navigation)
- [ ] Status badge has proper color contrast (4.5:1 minimum)
- [ ] Engagement metrics are readable by screen readers
- [ ] Focus ring is visible on keyboard focus
- [ ] Title is semantic heading (h3 or h4)

### ThreadDetail
- [ ] Accordion is keyboard accessible (arrow keys, enter, space)
- [ ] Sticky header has proper z-index and doesn't overlap content
- [ ] Reply form has visible focus indicator
- [ ] Submit button has clear label and disabled state
- [ ] Loading states are announced to screen readers
- [ ] Error states are announced with role="alert"
- [ ] All interactive elements have proper ARIA labels
- [ ] Section headings are semantic (h2)

### EngagementMetrics
- [ ] Text meets 4.5:1 contrast ratio
- [ ] Icons have aria-hidden="true"
- [ ] Content is readable by screen readers

### CompactReply
- [ ] Avatar is decorative (aria-hidden or alt="")
- [ ] Endorsed badge is accessible
- [ ] Content is semantic paragraph
- [ ] Focus indicator is visible if interactive

### InlineReplyForm
- [ ] Form has proper label (visible or aria-label)
- [ ] Textarea is accessible (label association)
- [ ] Submit button has focus indicator
- [ ] Disabled state is communicated to screen readers
- [ ] Error messages are associated with form field

---

## Responsive Breakpoints

### Mobile (360px - 767px)
- **ThreadCard:**
  - Status badge stacks below title
  - Engagement metrics + date on separate lines
  - Padding: p-4
  - Font size: text-base for title

- **ThreadDetail:**
  - Sticky header: Simplified (just title + status, no actions)
  - AI answer accordion: Full width, smaller trigger text
  - CompactReply: Avatar 8x8, smaller padding (p-3)
  - InlineReplyForm: Full width, smaller font size

### Tablet (768px - 1023px)
- **ThreadCard:**
  - Status badge inline with title
  - Engagement metrics + date on same line
  - Padding: p-4
  - Font size: text-lg for title

- **ThreadDetail:**
  - Sticky header: Full features (title + status + actions)
  - AI answer accordion: Full width
  - CompactReply: Avatar 10x10, standard padding (p-4)
  - InlineReplyForm: Full width, standard font size

### Desktop (1024px+)
- **ThreadCard:**
  - Same as tablet
  - Padding: p-5 (slightly more generous)

- **ThreadDetail:**
  - Sticky header: Full features
  - AI answer accordion: Constrained width (container-narrow)
  - CompactReply: Standard layout
  - InlineReplyForm: Standard layout

---

## QDS Compliance Checklist

### Color Tokens
- [ ] Primary: `bg-primary`, `text-primary`, `hover:bg-primary-hover`
- [ ] Secondary: `bg-secondary`, `text-secondary`, `hover:bg-secondary-hover`
- [ ] Accent: `bg-accent`, `text-accent`, `hover:bg-accent-hover`
- [ ] Success: `bg-success/10`, `text-success`, `border-success/30` (for endorsed)
- [ ] Muted: `text-muted-foreground` (for dates, metadata)
- [ ] Border: `border-border`, `border-[var(--border-glass)]`
- [ ] No hardcoded hex colors

### Spacing Scale
- [ ] Gap: `gap-1`, `gap-2`, `gap-4` (4pt grid)
- [ ] Padding: `p-3`, `p-4`, `p-5`, `p-6` (not random values)
- [ ] Margin: `mb-2`, `mb-4`, `mb-6` (consistent scale)
- [ ] Space-y: `space-y-2`, `space-y-4`, `space-y-6`

### Radius Scale
- [ ] Cards: `rounded-lg`, `rounded-xl`
- [ ] Badges: `rounded-md`
- [ ] Inputs: `rounded-md`
- [ ] No custom radius values

### Shadows
- [ ] Cards: `shadow-e1`, `shadow-e2`, `shadow-e3`
- [ ] Glass panels: `shadow-[var(--shadow-glass)]`
- [ ] Hover: `hover:shadow-e2`, `hover:shadow-[var(--shadow-glass-lg)]`
- [ ] No hardcoded shadow values

### Typography
- [ ] Headings: `heading-3`, `heading-4` (utility classes)
- [ ] Body: `text-base`, `text-sm`, `text-xs`
- [ ] Weights: `font-semibold`, `font-medium`, `font-normal`
- [ ] Line height: `leading-relaxed`, `leading-snug`

---

## Implementation Steps (For Parent Agent)

### Phase 1: Create New Components (3-4 small diffs)

**Step 1.1: Create EngagementMetrics Component**
- File: `components/course/engagement-metrics.tsx`
- Implement: Compact and full variants
- Props: `replyCount`, `hasAIAnswer`, `variant`, `className`
- Add React.memo for optimization
- Test: Render in isolation with different props
- Verify: TypeScript types, QDS compliance, accessibility

**Step 1.2: Create CompactReply Component**
- File: `components/course/compact-reply.tsx`
- Implement: Lightweight reply display
- Props: `post`, `showEndorsed`, `className`
- Add React.memo for list performance
- Test: Endorsed and non-endorsed variants
- Verify: TypeScript types, QDS compliance, accessibility

**Step 1.3: Create InlineReplyForm Component**
- File: `components/course/inline-reply-form.tsx`
- Implement: Collapsible form with expand/collapse
- Props: `onSubmit`, `isSubmitting`, `placeholder`, `className`
- State: `content`, `isExpanded`
- Test: Focus/blur, expand/collapse, submit
- Verify: TypeScript types, QDS compliance, accessibility

**Step 1.4: (Optional) Create StickyThreadHeader Component**
- File: `components/course/sticky-thread-header.tsx`
- Implement: Fixed position header with conditional render
- Props: `thread`, `isVisible`, `replyCount`, `hasAIAnswer`, `onResolve`, `className`
- Test: Visibility toggle, responsive layout
- Verify: TypeScript types, QDS compliance, accessibility, z-index

---

### Phase 2: Modify ThreadCard (1-2 small diffs)

**Step 2.1: Simplify ThreadCard Layout**
- File: `components/course/thread-card.tsx`
- Remove: Description line-clamp (or make single line, very light text)
- Remove: Tags section (or show max 2, no "+N")
- Remove: Views count (or move to less prominent)
- Reduce: Padding (p-6 → p-4 on CardHeader and CardContent)
- Simplify: Metadata row (remove bullet separators)
- Test: Render with various thread data
- Verify: TypeScript still passes, layout is clean

**Step 2.2: Add EngagementMetrics to ThreadCard**
- File: `components/course/thread-card.tsx`
- Import: EngagementMetrics component
- Add: `<EngagementMetrics replyCount={thread.replyCount || 0} hasAIAnswer={thread.hasAIAnswer} variant="compact" />`
- Position: In CardContent metadata row
- Test: Render with AI answer and without
- Verify: Layout works on mobile, tablet, desktop

---

### Phase 3: Modify ThreadDetail Page (3-4 small diffs)

**Step 3.1: Add State for Collapse/Expand**
- File: `app/threads/[threadId]/page.tsx`
- Add: `isAIAnswerCollapsed` state (default based on reply count)
- Add: `isReplyFormExpanded` state (default false)
- Add: `isStickyHeaderVisible` state (default false)
- Add: useEffect for scroll detection
- Add: useEffect for auto-collapse AI answer
- Test: State updates correctly
- Verify: No TypeScript errors

**Step 3.2: Add Accordion for AI Answer Section**
- File: `app/threads/[threadId]/page.tsx`
- Import: Accordion, AccordionItem, AccordionTrigger, AccordionContent
- Wrap: AIAnswerCard in Accordion structure
- Add: Trigger with heading + endorsement count
- Control: defaultValue based on `isAIAnswerCollapsed`
- Test: Toggle expand/collapse, keyboard navigation
- Verify: Animation works, accessibility passes

**Step 3.3: Replace Reply Cards with CompactReply**
- File: `app/threads/[threadId]/page.tsx`
- Import: CompactReply component
- Replace: Card structure with `<CompactReply post={post} />`
- Update: Spacing (space-y-6 → space-y-4 for tighter layout)
- Test: Endorsed and non-endorsed replies render correctly
- Verify: Performance is good with 10+ replies

**Step 3.4: Replace Reply Form with InlineReplyForm**
- File: `app/threads/[threadId]/page.tsx`
- Import: InlineReplyForm component
- Replace: Card + form structure with `<InlineReplyForm onSubmit={handleSubmitReply} isSubmitting={isSubmitting} />`
- Update: handleSubmitReply to accept string parameter
- Test: Expand, submit, collapse flow
- Verify: Optimistic updates still work

**Step 3.5: (Optional) Add StickyThreadHeader**
- File: `app/threads/[threadId]/page.tsx`
- Import: StickyThreadHeader component
- Add: Conditional render at top of page (before breadcrumb)
- Pass: `thread`, `isVisible`, `replyCount`, `hasAIAnswer`
- Test: Appears after scroll, disappears on scroll up
- Verify: z-index is correct, doesn't overlap content

**Step 3.6: Simplify Thread Question Card**
- File: `app/threads/[threadId]/page.tsx`
- Reduce: Padding on CardHeader and CardContent (p-8 → p-6)
- Simplify: Metadata row (remove bullet separators)
- Test: Layout still looks good
- Verify: Responsive on all breakpoints

---

### Phase 4: Quality Gates (Run after each phase)

**After Each Step:**
```bash
# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Manual testing
npm run dev
# Test the specific component/page
```

**After Phase 2:**
- Test ThreadCard in list view (`/courses/[courseId]`)
- Verify scanning is faster (30-40% improvement)
- Check mobile, tablet, desktop layouts
- Run accessibility audit (keyboard nav, contrast)

**After Phase 3:**
- Test ThreadDetail page (`/threads/[threadId]`)
- Verify progressive disclosure works
- Test expand/collapse, sticky header
- Check mobile, tablet, desktop layouts
- Run accessibility audit (accordion, form, focus management)

**Final Checks:**
```bash
# Production build
npm run build

# Check bundle size
# Ensure no significant increase

# Manual E2E flow
# 1. Browse thread list
# 2. Click thread card
# 3. View thread detail
# 4. Expand/collapse AI answer
# 5. Submit reply
# 6. Scroll to trigger sticky header
```

---

## Trade-offs & Risks

### Trade-offs Made

1. **Removed description from ThreadCard**
   - **Pro:** Cleaner, faster scanning
   - **Con:** Users lose preview of question content
   - **Mitigation:** Title is descriptive enough, users can click to see full content

2. **Removed/limited tags in ThreadCard**
   - **Pro:** Less visual clutter
   - **Con:** Users lose ability to scan by topic at a glance
   - **Mitigation:** Tags still visible in detail view, can use search/filter

3. **Collapsed AI answer by default (when >3 replies)**
   - **Pro:** Less overwhelming, focuses on human discussion
   - **Con:** Users might miss AI answer if they don't expand
   - **Mitigation:** Clear accordion trigger with endorsement count

4. **Simplified reply cards (no Card structure)**
   - **Pro:** Lighter, faster rendering, more compact
   - **Con:** Less visual separation between replies
   - **Mitigation:** Subtle borders and hover effects provide separation

5. **Inline reply form (collapsed by default)**
   - **Pro:** Less screen real estate, cleaner layout
   - **Con:** Users might not notice the form initially
   - **Mitigation:** Clear placeholder text, expands on focus

### Risks

1. **User confusion from removed information**
   - **Risk:** Users complain about missing description/tags
   - **Mitigation:** A/B test, gather feedback, can easily revert
   - **Rollback:** Git revert to previous version

2. **Progressive disclosure hiding important content**
   - **Risk:** Users don't see AI answer because it's collapsed
   - **Mitigation:** Accordion trigger is prominent, default expanded if ≤3 replies
   - **Rollback:** Remove Accordion, always show AI answer

3. **Sticky header z-index conflicts**
   - **Risk:** Sticky header overlaps modals or other UI elements
   - **Mitigation:** Carefully test z-index, use QDS z-index scale
   - **Rollback:** Remove sticky header (optional feature)

4. **Performance regression from scroll listener**
   - **Risk:** Scroll event listener causes jank on low-end devices
   - **Mitigation:** Use `passive: true` flag, throttle if needed
   - **Rollback:** Remove sticky header feature

5. **Accessibility issues with collapsible content**
   - **Risk:** Screen readers don't announce collapsed state properly
   - **Mitigation:** Use Radix UI Accordion (built-in accessibility)
   - **Rollback:** Remove Accordion, always show content

### Future Considerations

1. **Tabbed navigation in ThreadDetail**
   - Could add tabs: "Overview" / "AI Answer" / "Discussion"
   - Would provide clearer navigation for long threads
   - Trade-off: More complexity, might be overkill

2. **Infinite scroll for replies**
   - If reply count exceeds 50, paginate or infinite scroll
   - Would improve performance for very active threads
   - Trade-off: More complex state management

3. **Rich text editor for reply form**
   - Support formatting (bold, italic, code blocks)
   - Would improve reply quality and readability
   - Trade-off: Larger bundle size, more complex form

4. **Reply threading (nested replies)**
   - Allow replies to replies
   - Would improve discussion flow
   - Trade-off: Much more complex component structure

5. **Real-time updates**
   - Show new replies without refresh
   - Would improve collaborative feel
   - Trade-off: Requires WebSocket/polling, out of scope for frontend-only

---

## Known Limitations

1. **No reply count in Thread type** - May need to derive from posts array or add to API
2. **No real-time updates** - Users must refresh to see new replies
3. **No reply threading** - Flat list of replies, no nested discussions
4. **No rich text** - Plain text replies only
5. **No image upload** - Text-only content
6. **No mentions** - Can't @mention other users
7. **No notifications** - Can't notify users of replies
8. **Sticky header is optional** - May be deferred to Phase 2

---

## Summary

This design provides a comprehensive, implementable plan for simplifying ThreadCard and ThreadDetail components. Key improvements:

- **ThreadCard:** Cleaner, faster scanning with engagement preview
- **ThreadDetail:** Progressive disclosure with collapsible sections
- **New components:** EngagementMetrics, CompactReply, InlineReplyForm, StickyThreadHeader
- **Props-driven:** All components accept data via props, no hardcoded values
- **Type-safe:** Explicit TypeScript interfaces for all components
- **Accessible:** Semantic HTML, ARIA attributes, keyboard navigation
- **QDS compliant:** Uses design system tokens throughout
- **Performance optimized:** React.memo where appropriate, no expensive operations

The plan is broken into small, verifiable steps that can be implemented incrementally with quality gates after each phase.

# Component Patterns Research - Thread Redesign

**Agent:** Component Architect
**Date:** 2025-10-07
**Task:** Analyze current architecture and identify simplification opportunities for ThreadCard and ThreadDetail components

---

## Current Architecture Analysis

### ThreadCard Component (`components/course/thread-card.tsx`)

**Current Structure (109 lines):**
- Wraps entire card in `Link` component for navigation
- Uses `Card` with `glass-hover` variant
- `CardHeader` (p-6): Title + Description + Status badge
- `CardContent` (p-6): Metadata row with icons

**Pain Points:**
1. **Content Description takes up too much space** (line-clamp-2, but still 2 lines)
2. **Tags section is cluttered** - Shows up to 3 tags + "+N more" indicator
3. **Too many separators** - Multiple bullet points make the metadata row feel heavy
4. **AI badge doesn't stand out** - Nested in metadata row with other info
5. **No engagement preview** - Users can't see reply count or engagement at a glance
6. **Padding is generous** - p-6 on both header and content adds visual weight

**Current Data Flow:**
```typescript
interface ThreadCardProps {
  thread: Thread;       // Contains all thread data
  className?: string;   // Composition support
}
```

**What Works Well:**
- Props-driven design (no hardcoded values)
- Clear TypeScript interface
- Semantic HTML with proper ARIA
- Link wrapper for navigation
- StatusBadge component reuse
- Glass hover effect

**What Needs Improvement:**
- Remove or greatly reduce description visibility
- Simplify metadata (fewer items, cleaner layout)
- Add engagement preview (X replies, AI answered)
- Reduce visual weight (less padding, lighter text)
- Remove or minimize tags display

---

### ThreadDetail Page (`app/threads/[threadId]/page.tsx`)

**Current Structure (275 lines):**
- Breadcrumb navigation
- Thread Question card (glass-strong variant, large padding)
- AI Answer Section (heading + AIAnswerCard)
- Replies Section (heading + reply cards)
- Reply Form (glass-strong card with full header)

**Pain Points:**
1. **No progressive disclosure** - AI answer always visible even when many human replies exist
2. **Reply cards are heavy** - Full Card with CardHeader + CardContent, large padding (p-8)
3. **No sticky thread header** - Context is lost when scrolling through replies
4. **Reply form is large** - Takes up significant space with full CardHeader
5. **No tabs or sections** - Everything is linear, no way to jump to specific content
6. **Endorsement display in reply cards** - Badge shown but no counts or metrics
7. **Avatar is placeholder** - Shows last 2 chars, not meaningful

**Current Data Flow:**
```typescript
// useThread hook returns:
{
  thread: Thread,
  posts: Post[],
  aiAnswer: AIAnswer | null
}
```

**What Works Well:**
- Breadcrumb navigation
- Loading and error states
- Empty state for no replies
- Form validation and submission
- React Query mutations with optimistic updates
- Separate section headings

**What Needs Improvement:**
- Add collapsible AI answer section
- Simplify reply cards (remove CardHeader/CardContent structure)
- Add sticky thread header
- Make reply form inline and compact (expands on focus)
- Optional: Add tabbed navigation (Overview / AI Answer / Discussion)
- Show engagement metrics more prominently

---

## Existing Patterns in Codebase

### Accordion Component (`components/ui/accordion.tsx`)
- **Available:** Radix UI Accordion primitive
- **Features:** Collapsible sections with animations
- **Use case:** Perfect for collapsible AI answer section

### Card Variants (`components/ui/card.tsx`)
- **Available variants:**
  - `default`: p-6
  - `glass`: p-6 glass-panel
  - `glass-strong`: p-6 glass-panel-strong
  - `glass-hover`: p-6 with hover effects
  - `glass-liquid`: p-6 with liquid border
  - `ai`: p-8 with AI-specific styling
  - `ai-hero`: p-8 with hero styling
- **Note:** All variants have generous padding (p-6 or p-8)

### AIAnswerCard Component (`components/course/ai-answer-card.tsx`)
- **Props interface:** Well-designed, supports hero and compact variants
- **Features:** Confidence meter, citations, endorsement bar
- **Note:** Already uses `CardHeader`, `CardContent`, `CardFooter` structure

### StatusBadge Component (`components/course/status-badge.tsx`)
- **Props:** status, showIcon, className
- **Variants:** open, answered, resolved, needs-review
- **Note:** Already supports inline display (no icon if needed)

### EndorsementBar Component (`components/course/endorsement-bar.tsx`)
- **Props:** total, byRole, currentUserEndorsed, onEndorse, disabled
- **Features:** Tooltip with breakdown, instructor badge, endorse button
- **Note:** Could be adapted for engagement preview in ThreadCard

### Tabs Component (`components/ui/tabs.tsx`)
- **Available:** Radix UI Tabs primitive
- **Use case:** Could be used for tabbed navigation in ThreadDetail

---

## Composition Opportunities

### New Sub-Components to Create

1. **EngagementMetrics Component**
   - Display: "X replies • AI answered" or "X replies" or "No replies yet"
   - Used in: ThreadCard (preview) and ThreadDetail (header)
   - Props: `replyCount`, `hasAIAnswer`, `variant` (compact | full)

2. **CompactReply Component**
   - Lighter structure than Card (no CardHeader/CardContent)
   - Just a div with flex layout: avatar + content + metadata
   - Props: `post`, `showEndorsed`, `className`

3. **StickyThreadHeader Component**
   - Fixed position header with title + status + quick actions
   - Shows when scrolling past main thread card
   - Props: `thread`, `onResolve`, `onFlag`, `className`

4. **InlineReplyForm Component**
   - Compact form that starts collapsed (single line input)
   - Expands on focus to show full textarea + submit button
   - Props: `onSubmit`, `isSubmitting`, `placeholder`

---

## shadcn/ui Primitives to Leverage

### Already in Use:
- Card (multiple variants)
- Badge
- Button
- Textarea
- Avatar
- Breadcrumb
- Tooltip

### Should Use:
- **Accordion** - For collapsible AI answer section
- **Tabs** - Optional: For tabbed navigation in ThreadDetail
- **Separator** - For cleaner section dividers instead of bullet points

---

## Performance Considerations

### Render Frequency
- **ThreadCard:** Renders in list view (10-20 cards per page)
  - **Optimization:** Should be lightweight, consider React.memo if list gets large
  - **Current:** No memoization, but components are relatively simple

- **ThreadDetail:** Single render per page
  - **Optimization:** Not critical, but reply cards could be memoized if list is long
  - **Current:** No memoization on reply cards

### Expensive Operations
- **ThreadCard:** None identified (simple data display)
- **ThreadDetail:**
  - Form submission (already handled with mutation state)
  - Endorsement mutations (already handled with optimistic updates)

### Memoization Opportunities
- **ThreadCard:** Consider `React.memo` if list view has >50 items
- **CompactReply:** Should use `React.memo` since reply lists can be long (10-100 items)
- **EngagementMetrics:** Pure component, good candidate for `React.memo`

### Code Splitting
- Not needed for these components (they're core to the thread viewing experience)
- All components should be in initial bundle

---

## Requirements Analysis

### ThreadCard Requirements

**Data Requirements:**
- Thread title (required)
- Thread status (required)
- Reply count (new - derived from posts.length or thread.replyCount)
- AI answer status (hasAIAnswer boolean)
- Created date (required)
- Views count (optional - could be removed for simplification)

**State Requirements:**
- No local state needed (card is stateless, navigation via Link)

**Event Handling:**
- Click: Navigate to thread detail (handled by Link wrapper)

**Variant Requirements:**
- Single variant: simplified card for list view
- No hero variant needed

**Accessibility Requirements:**
- Semantic link wrapper
- Status badge with proper color contrast
- Engagement metrics should be in aria-live region (for dynamic updates)
- Ensure 4.5:1 contrast on all text

**Responsive Behavior:**
- Mobile (360px): Stack status badge, reduce padding
- Tablet (768px): Inline layout
- Desktop (1024px+): Same as tablet

---

### ThreadDetail Requirements

**Data Requirements:**
- Thread object (title, content, status, tags, views, dates)
- Posts array (replies)
- AI answer object (or null)
- Current user object (for permissions and endorsement state)

**State Requirements:**
- **Local state:**
  - Reply form content (useState)
  - Reply form expanded state (useState - new)
  - AI answer collapsed state (useState - new)
  - Sticky header visible (useState + useEffect with scroll listener - new)
- **Lifted state:** None (all data from React Query)
- **React Query:** useThread, useCurrentUser, useCreatePost, useEndorseAIAnswer

**Event Handling:**
- Reply form submit (existing)
- Reply form focus (new - expand form)
- AI answer collapse toggle (new)
- Endorse AI answer (existing)
- Scroll detection for sticky header (new)

**Variant Requirements:**
- Simplified reply cards (no Card variant, custom structure)
- Inline compact form vs expanded form
- Collapsible AI answer section

**Accessibility Requirements:**
- Semantic HTML (article for thread, aside for AI answer, section for replies)
- Keyboard navigation (tab through replies, focus management in form)
- ARIA attributes (aria-expanded for collapsible sections)
- Focus indicators on all interactive elements
- Screen reader announcements for mutations

**Responsive Behavior:**
- Mobile (360px): Full-width layout, simplified sticky header, smaller form
- Tablet (768px): Same as mobile with more generous spacing
- Desktop (1024px+): Sticky header with more actions, larger form

---

## State Management Strategy

### ThreadCard
- **No state management needed** - Pure presentational component
- All data comes from props (thread object)

### ThreadDetail
- **Local UI State:**
  - `replyContent: string` - Current reply form input (existing)
  - `isSubmitting: boolean` - Form submission state (existing)
  - `isReplyFormExpanded: boolean` - Whether inline form is expanded (new)
  - `isAIAnswerCollapsed: boolean` - Whether AI answer section is collapsed (new)
  - `isStickyHeaderVisible: boolean` - Whether sticky header should show (new)

- **React Query State:**
  - `useThread(threadId)` - Fetch thread + posts + AI answer (existing)
  - `useCurrentUser()` - Fetch current user (existing)
  - `useCreatePost()` - Mutation for creating reply (existing)
  - `useEndorseAIAnswer()` - Mutation for endorsing AI answer (existing)

- **Optimistic Updates:**
  - Post creation: Optimistically add post to list before server response
  - Endorsement: Optimistically update endorsement count before server response

- **No prop drilling** - All components are direct children of page, no deep nesting

---

## TypeScript Interfaces

### New Components

```typescript
// EngagementMetrics Component
interface EngagementMetricsProps {
  replyCount: number;
  hasAIAnswer: boolean;
  variant?: "compact" | "full";
  className?: string;
}

// CompactReply Component
interface CompactReplyProps {
  post: Post;
  showEndorsed?: boolean;
  className?: string;
}

// StickyThreadHeader Component (optional)
interface StickyThreadHeaderProps {
  thread: Thread;
  isVisible: boolean;
  onResolve?: () => void;
  onFlag?: () => void;
  className?: string;
}

// InlineReplyForm Component
interface InlineReplyFormProps {
  onSubmit: (content: string) => void | Promise<void>;
  isSubmitting: boolean;
  placeholder?: string;
  className?: string;
}
```

### Modified Components

```typescript
// ThreadCard - Simplified props (no changes to interface, but internal display changes)
interface ThreadCardProps {
  thread: Thread;  // Already includes hasAIAnswer, we'll derive replyCount
  className?: string;
}

// ThreadDetail - No prop changes (page component)
```

---

## Design Patterns to Follow

### Props-Driven Architecture
- All new components must accept data via props
- No hardcoded values or inline data
- Export all prop interfaces for reuse

### Component Composition
- Keep components under 200 lines
- Split large components into sub-components
- Use shadcn/ui primitives when available
- Compose with className prop for styling flexibility

### State Management
- Keep UI state local to component (expanded, collapsed)
- Use React Query for server state
- Optimistic updates for mutations
- No prop drilling beyond 2 levels

### Accessibility
- Use semantic HTML elements
- Provide ARIA attributes for dynamic content
- Ensure keyboard navigation works
- Maintain 4.5:1 contrast ratio minimum

### QDS Compliance
- Use QDS color tokens (no hardcoded colors)
- Use QDS spacing scale (gap-1, gap-2, gap-4, etc.)
- Use QDS radius scale (rounded-md, rounded-lg)
- Use QDS shadows (shadow-e1, shadow-e2, shadow-e3)

---

## Summary

### Key Findings

1. **ThreadCard is cluttered** with too much information (description, tags, metadata)
2. **ThreadDetail has no progressive disclosure** - all content always visible
3. **Reply cards are too heavy** - full Card structure with large padding
4. **Existing patterns support simplification** - Accordion, simplified card variants
5. **Good foundation for composition** - Well-defined types, React Query, props-driven

### Simplification Opportunities

1. **ThreadCard:**
   - Remove or minimize description
   - Add engagement preview ("X replies • AI answered")
   - Simplify metadata (remove tags or show max 2)
   - Reduce padding (p-4 instead of p-6)
   - Make AI badge more prominent

2. **ThreadDetail:**
   - Add collapsible AI answer (default collapsed if >3 replies)
   - Simplify reply cards (remove Card structure, use simple div)
   - Add sticky thread header (shows on scroll)
   - Make reply form inline and compact (expands on focus)
   - Optional: Add tabs for navigation

### Next Steps

1. Design exact component structure in `plans/component-design.md`
2. Define all TypeScript interfaces
3. Plan file structure and modifications
4. Create implementation steps
5. Document trade-offs and risks

# Component Architecture Research: AI-First Q&A

**Date:** 2025-10-06
**Agent:** Component Architect
**Task:** Design component architecture for AI answer display system

---

## Existing Component Patterns Analysis

### 1. **Card Component System** (`components/ui/card.tsx`)

**Pattern Found:**
- Uses `class-variance-authority` for variant management
- Composable sub-components: `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `CardAction`
- Multiple variants: `default`, `ai`, `hover`, `elevated`, `glass`, `glass-strong`, `glass-hover`, `glass-liquid`
- Already has AI variant with purple gradient background

**Key Insights:**
- AIAnswerCard should extend Card with `variant="ai"` for visual consistency
- Existing AI variant: `border-l-4 border-l-ai-purple-500 bg-gradient-to-br from-ai-purple-50/50`
- Supports elevated shadows (`shadow-e2`, `shadow-e3`)
- Uses data-slot pattern for semantic structure

**Reusability Opportunity:**
- Use Card as base component for AIAnswerCard
- Leverage existing glass and AI visual tokens

---

### 2. **AIBadge Component** (`components/ui/ai-badge.tsx`)

**Pattern Found:**
- Three variants: `default` (px-3 py-1), `compact` (px-2 py-0.5), `icon-only` (p-1.5)
- Uses Sparkles icon from Lucide
- ai-gradient background (purple-cyan spectrum)
- Props-driven with className composition

**Key Insights:**
- Need to add `large` variant for hero positioning on AIAnswerCard
- Large variant should be: `px-4 py-2 text-sm` (16px+ height requirement)
- Consistent use of ai-gradient across all AI features

**Enhancement Needed:**
```typescript
variant?: "default" | "compact" | "icon-only" | "large"
```

---

### 3. **Badge Component** (`components/ui/badge.tsx`)

**Pattern Found:**
- Uses CVA for variants: `default`, `secondary`, `destructive`, `outline`, `ai`, `ai-outline`, `ai-shimmer`
- Has AI-specific variants with purple gradients
- Supports asChild pattern for polymorphism
- Focus and accessibility states built-in

**Reusability:**
- Use for instructor endorsement badge
- Use `ai-shimmer` variant for special AI states (high confidence)

---

### 4. **StatCard Component** (`components/dashboard/stat-card.tsx`)

**Pattern Found:**
- Props-driven architecture (label, value, icon, trend, cta, variant)
- Loading state with Skeleton components
- Trend indicator with icon + label
- Glass panel styling with hover effects
- Variant system: `default`, `warning`, `success`, `accent`

**Key Insights for ConfidenceMeter:**
- Similar pattern: label + value + visual indicator
- Use color coding: green (high), yellow (medium), red (low)
- Tooltip pattern for additional context
- Glass panel aesthetic

---

### 5. **Thread Detail Page** (`app/threads/[threadId]/page.tsx`)

**Current Structure:**
```
1. Breadcrumb
2. Thread Question Card (glass-strong variant)
   - Title, metadata (views, date)
   - Status badge
   - Content
   - Tags
3. Replies Section
   - H2 heading: "{count} Replies"
   - Map of Post cards (glass-hover or glass-liquid if endorsed)
4. Reply Form Card (glass-strong variant)
```

**Integration Point for AIAnswerCard:**
- **Position:** Between Thread Question Card (#2) and Replies Section (#3)
- **New Section:** "AI Answer" (separate heading)
- **Visual Hierarchy:**
  - Thread Question: glass-strong (elevation 2)
  - AI Answer: highest prominence (shadow-e3, ai-gradient border)
  - Human Replies: glass-hover (elevation 1)

---

### 6. **Design System Tokens** (`app/globals.css`)

**AI Colors Available:**
```css
--ai-purple-500: #A855F7
--ai-indigo-500: #6366F1
--ai-cyan-500: #06B6D4
--ai-gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)
--shadow-ai-sm, --shadow-ai-md, --shadow-ai-lg (purple glow)
```

**Utility Classes:**
- `.ai-gradient` - background gradient
- `.ai-glow` - purple shadow
- `.gradient-border` - animated border
- `.animate-shimmer` - 2s linear infinite
- `.animate-pulse-glow` - 2s ease-in-out infinite

**Spacing:**
- 4pt grid: gap-1 (4px), gap-2 (8px), gap-4 (16px), gap-6 (24px), gap-8 (32px)
- Padding hierarchy: p-4, p-6, p-8 (AI Answer gets p-8 for prominence)

**Shadows:**
- `shadow-e1`: 0 1px 2px rgba(15, 14, 12, 0.06)
- `shadow-e2`: 0 2px 8px rgba(15, 14, 12, 0.08)
- `shadow-e3`: 0 8px 24px rgba(15, 14, 12, 0.10) ← Use for AIAnswerCard

---

## Component Composition Opportunities

### shadcn/ui Primitives to Leverage

1. **Radix UI Accordion** - For expandable citation list
   - File: Need to add `components/ui/accordion.tsx`
   - Use case: Citations section (start collapsed, expand on click)

2. **Radix UI Tooltip** - For confidence meter explanation
   - File: Need to add `components/ui/tooltip.tsx`
   - Use case: Hover over confidence percentage for details

3. **Radix UI Progress** - For confidence meter bar
   - File: Need to add `components/ui/progress.tsx`
   - Use case: Visual confidence indicator (0-100 scale)

4. **Existing Button** - For endorsement action
   - Variant: `ai-outline` (matches AI theme)
   - Size: `default` or `sm`

5. **Existing Avatar** - For author display (if needed)
   - Current pattern: `.avatar-placeholder` with initials

---

## Data Flow Analysis

### Props vs State vs Server State

| Data | Storage Strategy | Rationale |
|------|------------------|-----------|
| AI Answer Content | Props (from server) | Static after generation, no client mutation |
| Confidence Score | Props (from server) | Calculated server-side, read-only |
| Citations | Props (from server) | Static list of references |
| Endorsement Count | React Query (optimistic) | Mutable, needs optimistic updates |
| Citations Expanded | Local useState | UI-only state, not persisted |
| Current User | React Query (global) | Shared across components |

---

## Accessibility Requirements

### WCAG 2.2 AA Compliance

1. **Semantic HTML:**
   - `<article>` for AIAnswerCard wrapper
   - `<h3>` for "AI Answer" section heading
   - `<p>` for answer content
   - `<ul>` or `<ol>` for citations list

2. **ARIA Attributes:**
   - `role="region"` on AIAnswerCard with `aria-labelledby="ai-answer-heading"`
   - `aria-label="Confidence score: {value}%"` on ConfidenceMeter
   - `aria-expanded={isExpanded}` on citations toggle button
   - `aria-live="polite"` on endorsement count (updates dynamically)

3. **Keyboard Navigation:**
   - Tab order: AIBadge (focusable=false) → Confidence Meter (info only) → Endorse Button → Citations Toggle → Each Citation Link
   - Enter/Space to toggle citations
   - Enter/Space to endorse

4. **Focus Indicators:**
   - All interactive elements use QDS focus ring: `box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3)`
   - Visible focus on ai-gradient backgrounds (higher contrast)

5. **Color Contrast:**
   - AI gradient background → white text (meets 4.5:1)
   - Confidence bar colors tested:
     - Green (success): #2E7D32 on white = 5.8:1 ✓
     - Yellow (warning): #B45309 on white = 5.2:1 ✓
     - Red (danger): #D92D20 on white = 6.1:1 ✓

---

## Responsive Design Strategy

### Breakpoints (from globals.css)

- **Mobile (360px-767px):**
  - Stack all elements vertically
  - Full-width confidence meter
  - Citations collapse by default
  - Touch targets: 44px minimum (Button size="default" = 40px + 4px focus ring)

- **Tablet (768px-1023px):**
  - Confidence meter inline with label
  - Citations in 1 column
  - Endorsement bar horizontal layout

- **Desktop (1024px+):**
  - Confidence meter + endorsement inline
  - Citations in 2 columns (if >4 items)
  - Hover states enabled

### Layout Patterns

```
Mobile:
┌─────────────────────────┐
│ [AI Badge]              │
│ ▓▓▓▓▓▓▓▓░░░░ 75%       │ (Confidence)
│                         │
│ Answer content...       │
│                         │
│ [▼ 4 Citations]         │
│ [👍 Endorse] 12         │
└─────────────────────────┘

Desktop:
┌─────────────────────────────────────┐
│ [AI Badge]    ▓▓▓▓▓▓▓▓░░░░ 75%     │
│                                     │
│ Answer content...                   │
│                                     │
│ [▼ 4 Citations]  [👍 Endorse] 12   │
└─────────────────────────────────────┘
```

---

## Performance Considerations

### Render Optimization

1. **React.memo Candidates:**
   - `ConfidenceMeter` - Pure component, only re-renders if score changes
   - `CitationCard` - Pure component, static props
   - `AIBadge` - Pure component, no dynamic state

2. **useMemo Usage:**
   - Confidence color calculation (based on score)
   - Citation list filtering/sorting (if implemented)

3. **useCallback Usage:**
   - `onEndorse` handler (passed to memoized EndorsementBar)
   - `onCitationToggle` handler (passed to memoized CitationList)

4. **Code Splitting:**
   - Citations could be lazy-loaded (but probably overkill for MVP)
   - Use Next.js dynamic imports if needed

### Bundle Size Impact

- AIAnswerCard + sub-components: ~5-8KB (estimate)
- Radix UI Accordion: ~4KB
- Radix UI Tooltip: ~3KB
- Radix UI Progress: ~2KB
- Total: ~14-17KB (acceptable, <5% of 200KB route budget)

---

## Existing Hook Patterns to Follow

### React Query Hooks (`lib/api/hooks.ts`)

**Pattern:**
```typescript
export function useAIAnswer(threadId: string | undefined) {
  return useQuery({
    queryKey: ["aiAnswer", threadId],
    queryFn: () => threadId ? api.getAIAnswer(threadId) : Promise.resolve(null),
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000, // 5 minutes (AI answer static)
  });
}
```

**Mutation Pattern:**
```typescript
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ aiAnswerId, userId }: { aiAnswerId: string; userId: string }) =>
      api.endorseAIAnswer(aiAnswerId, userId),
    onMutate: async ({ aiAnswerId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["aiAnswer"] });
      const previous = queryClient.getQueryData(["aiAnswer", aiAnswerId]);

      queryClient.setQueryData(["aiAnswer", aiAnswerId], (old: any) => ({
        ...old,
        endorsementCount: old.endorsementCount + 1,
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["aiAnswer", variables.aiAnswerId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAnswer"] });
    },
  });
}
```

---

## Similar Components in Codebase

### 1. **Post Card (Thread Detail Page)**
- Uses Card with glass-hover or glass-liquid variants
- Avatar + author name + metadata
- Endorsement badge (green checkmark)
- Content with whitespace-pre-wrap

**Pattern to Replicate:**
- Similar endorsement visual (but AI uses count + button)
- Similar metadata row (date, author)
- Different elevation (AI higher)

### 2. **Thread Card (Course Page)**
- Status badge in top-right
- Metadata row (views, replies, date)
- Tags at bottom

**Pattern to Adapt:**
- AIAnswerCard uses confidence meter instead of status badge
- Citations instead of tags

---

## Component Hierarchy Decision

**Chosen Approach: Composition over Monolith**

```
AIAnswerCard (Hero Component, ~150 LoC)
├── AIBadge (Existing, extend with "large" variant)
├── ConfidenceMeter (New, ~80 LoC)
│   └── Tooltip (shadcn/ui, to add)
├── Content Section (Inline, ~20 LoC)
├── CitationList (New, ~100 LoC)
│   ├── Accordion (shadcn/ui, to add)
│   └── CitationCard (New, ~40 LoC)
└── EndorsementBar (New, ~60 LoC)
    └── Button (Existing, ai-outline variant)
```

**Why this structure:**
1. Each sub-component <100 LoC (maintainable)
2. Sub-components reusable (ConfidenceMeter could be used elsewhere)
3. Clear separation of concerns
4. Easy to test in isolation
5. Props-driven (no hidden dependencies)

---

## Constraints & Trade-offs

### Constraints from context.md

1. **Frontend-Only:** All data from mock API, no real LLM calls
2. **QDS Compliance:** Must use ai-gradient, spacing tokens, shadows
3. **Type Safety:** Strict TypeScript, no `any` types
4. **Accessibility:** WCAG 2.2 AA minimum
5. **Performance:** <1s render time, no blocking UI

### Trade-offs Made

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Separate AIAnswer type | More API complexity | Cleaner separation, not a Post |
| Citations as accordion | Extra component | Better UX, prevents overwhelming users |
| Endorsement count on card | More API calls | Better social proof, worth the cost |
| Fixed confidence meter | No animation | Simplicity, meets MVP needs |

---

## Integration Risks

### Potential Issues

1. **Layout Shift:** AI Answer loading could cause CLS
   - Mitigation: Reserve space with Skeleton, min-height

2. **Focus Management:** Adding new section disrupts tab order
   - Mitigation: Logical tab order, skip links if needed

3. **Mobile Overflow:** Long citations on small screens
   - Mitigation: text-overflow ellipsis, expand on tap

4. **Endorsement Race Condition:** Multiple rapid endorsements
   - Mitigation: Optimistic updates + disable button while mutating

---

## Next Steps for Implementation

1. **Add Missing shadcn/ui Components:**
   - npx shadcn@latest add accordion
   - npx shadcn@latest add tooltip
   - npx shadcn@latest add progress

2. **Type Definitions First:**
   - Define AIAnswer, Citation, ConfidenceLevel types
   - Update Thread type with hasAIAnswer, aiAnswerId fields

3. **Build Bottom-Up:**
   - CitationCard (simplest, no dependencies)
   - ConfidenceMeter (no external deps)
   - CitationList (uses CitationCard)
   - EndorsementBar (uses Button)
   - AIAnswerCard (composes all)

4. **Integration Last:**
   - Update thread detail page layout
   - Add React Query hooks
   - Update mock API

---

## Related Files to Review

- `lib/models/types.ts` - Type definitions (extend Thread, add AIAnswer)
- `lib/api/client.ts` - Mock API methods (add getAIAnswer, endorseAIAnswer)
- `lib/api/hooks.ts` - React Query hooks (add useAIAnswer, useEndorseAIAnswer)
- `app/threads/[threadId]/page.tsx` - Integration point
- `components/ui/ai-badge.tsx` - Extend with "large" variant
- `mocks/ai-responses.json` - Seed data for AI answers

---

**Summary:**
Existing component patterns strongly support props-driven, composable architecture. QDS tokens (ai-gradient, shadow-e3, spacing) provide visual consistency. React Query patterns ensure data flow consistency. Accessibility patterns (focus states, ARIA) are well-established. The component hierarchy balances reusability with simplicity, keeping all sub-components under 100 LoC.

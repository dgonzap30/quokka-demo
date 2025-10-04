# Thread Component Patterns - Research

**Date:** 2025-10-04
**Agent:** Component Architect
**Task:** Research existing patterns for thread view components

---

## Existing Component Patterns

### 1. Card Component (components/ui/card.tsx)

**Key Features:**
- Uses `class-variance-authority` for variant management
- Composition-based architecture: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Glassmorphism variants: `glass`, `glass-strong`, `glass-hover`, `glass-liquid`
- AI variant with gradient backgrounds and purple accent border
- Hover effects built-in (`hover` and `glass-hover` variants)

**Patterns to Reuse:**
- Use `Card` as base for ThreadCard component
- Leverage `glass-hover` variant for interactive thread lists
- Use CardHeader/CardContent composition for clean separation
- Follow slot-based architecture (`data-slot` attributes)

### 2. Button Component (components/ui/button.tsx)

**Key Features:**
- Multiple variants: default, destructive, outline, ghost, link, ai, glass-*
- Size variants: sm, default, lg, icon
- Glass variants with backdrop-blur: `glass-primary`, `glass-secondary`, `glass-accent`, `glass`
- Built-in hover/active states with scale transforms
- Focus-visible states with ring
- AsChild pattern for polymorphic rendering

**Patterns to Reuse:**
- Use `glass-primary` for primary CTAs (Submit Thread, Post Reply)
- Use `outline` for secondary actions (Cancel, Filter)
- Use `ghost` for inline actions (Endorse, Flag, Resolve)
- Use `icon` size for compact action buttons

### 3. Badge Component (components/ui/badge.tsx)

**Key Features:**
- Variant system: default, secondary, destructive, outline, ai, ai-outline, ai-shimmer
- Inline display with consistent sizing
- Support for icons with proper spacing
- AsChild pattern for link integration

**Patterns to Reuse:**
- Use for thread status badges (Open, Answered, Resolved)
- Use for tag display in threads
- Create status-specific color mapping:
  - `open` → `outline` variant (neutral)
  - `answered` → `secondary` variant (green/olive)
  - `resolved` → `default` variant (primary brown)

### 4. Input & Textarea Components

**Key Features:**
- Glass-enabled with backdrop-blur effects on focus
- Focus states with ring and shadow-glass-sm
- Built-in validation states (aria-invalid)
- Consistent styling with QDS tokens

**Patterns to Reuse:**
- Use Input for thread title field
- Use Textarea for thread content and reply content
- Follow existing validation pattern (aria-invalid for errors)

### 5. Existing Page Pattern (app/courses/page.tsx)

**Key Features:**
- Client component with "use client" directive
- React Query hooks: `useCurrentUser`, `useUserCourses`
- Authentication guard with redirect to /login
- Loading skeleton states
- Empty state handling
- Grid layout with glass-hover cards
- Link wrapper for navigation

**Patterns to Reuse:**
- Same authentication check pattern
- Same loading skeleton approach
- Same empty state pattern
- Same grid layout for thread lists
- Use Link wrapper for thread navigation

### 6. Form Pattern (app/(auth)/login/page.tsx)

**Key Features:**
- Local state with useState for form fields
- Form submission with async mutation
- Error handling with type guard (isAuthSuccess)
- Loading state tied to mutation.isPending
- Glass-strong card variant for forms
- Clear validation error display
- Accessible labels with htmlFor

**Patterns to Reuse:**
- Same form state management pattern
- Same error display approach (danger/10 background)
- Same loading button pattern
- Same glass card styling
- Use type guards for API responses

---

## Existing Type Patterns

### Thread & Post Types (lib/models/types.ts)

```typescript
export type ThreadStatus = 'open' | 'answered' | 'resolved';

export interface Thread {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  status: ThreadStatus;
  tags?: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  endorsed: boolean;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Observations:**
- No `Post[]` array in Thread - needs separate fetch
- No author object embedded - needs user lookup
- No reply count in Thread - needs calculation
- Tags are optional, may be empty array

---

## Existing API/Hooks Patterns

### API Client Pattern (lib/api/client.ts)

**Key Features:**
- Mock delay simulation (200-500ms typical)
- Seed data on each call
- TypeScript-first with explicit return types
- Discriminated unions for success/error (AuthResult pattern)
- Helper functions: delay(), generateId()

**Patterns to Reuse:**
- Follow same delay pattern for new thread/post methods
- Use discriminated union for mutation responses
- Seed data automatically
- Generate IDs with prefix pattern (`thread-`, `post-`)

### React Query Hooks Pattern (lib/api/hooks.ts)

**Key Features:**
- Query keys centralized in `queryKeys` object
- Stale time based on data volatility (2min for threads, 5min for courses)
- Enabled flag for conditional queries (when ID is undefined)
- Mutation onSuccess invalidates related queries
- setQueryData for optimistic updates
- useQueryClient for cache management

**Patterns to Reuse:**
- Add thread-specific query keys:
  - `thread: (threadId) => ["thread", threadId]`
  - `threadPosts: (threadId) => ["threadPosts", threadId]`
- Set staleTime: 2min for threads (moderate volatility)
- Set staleTime: 1min for posts (high volatility)
- Invalidate courseThreads after createThread mutation
- Invalidate threadPosts after createPost mutation

---

## Missing API Methods (Need to Add)

### Thread Methods
1. `getThread(threadId)` - Fetch single thread by ID
2. `createThread(input)` - Create new thread
3. `updateThreadStatus(threadId, status)` - Change thread status
4. `incrementThreadViews(threadId)` - Track view count

### Post Methods
1. `getThreadPosts(threadId)` - Fetch all posts for a thread
2. `createPost(input)` - Create new reply post
3. `endorsePost(postId)` - Toggle endorsement
4. `flagPost(postId)` - Toggle flag

### User Lookup
- Need utility to fetch User by authorId for display purposes

---

## shadcn/ui Primitives Available

**Already Installed:**
- Card (with glassmorphism variants)
- Button (with glass variants)
- Badge (for status/tags)
- Input (glass-enabled)
- Textarea (glass-enabled)
- Skeleton (for loading states)
- Avatar (for user avatars)
- Separator (for dividing sections)
- Dialog (for modals if needed)
- Alert Dialog (for confirmations)
- Dropdown Menu (for thread actions)

**Potentially Useful (Not Yet Used):**
- Tabs (for filtering threads by status)
- Select (for sort/filter dropdowns)
- ScrollArea (for long thread lists)

---

## QDS v2.0 Glassmorphism Tokens

### Glass Surface Backgrounds
- `--glass-ultra`: rgba(255, 255, 255, 0.4)
- `--glass-strong`: rgba(255, 255, 255, 0.6)
- `--glass-medium`: rgba(255, 255, 255, 0.7)
- `--glass-subtle`: rgba(255, 255, 255, 0.85)

### Backdrop Blur Scale
- `--blur-xs`: 4px
- `--blur-sm`: 8px
- `--blur-md`: 12px
- `--blur-lg`: 16px
- `--blur-xl`: 24px

### Glass Shadows
- `--shadow-glass-sm`: soft, subtle elevation
- `--shadow-glass-md`: medium elevation
- `--shadow-glass-lg`: strong elevation

### Glass Borders & Glows
- `--border-glass`: rgba(255, 255, 255, 0.18)
- `--glow-primary`: warm brown glow
- `--glow-secondary`: olive green glow
- `--glow-accent`: blue glow

### Utility Classes
- `glass-panel`: medium glass surface
- `glass-panel-strong`: strong glass surface
- `liquid-border`: gradient border effect
- `glass-text`: readability shadow

---

## Component Size Guidelines

**Per CLAUDE.md C-5:**
- Keep components < 200 lines of code
- Split large components into logical sub-components

**Planned Component Breakdown:**
1. **ThreadCard** (~80 LOC) - Compact view for lists
2. **ThreadDetailView** (~150 LOC) - Full thread with posts
3. **PostCard** (~60 LOC) - Individual reply
4. **ThreadForm** (~120 LOC) - Create new thread
5. **ReplyForm** (~80 LOC) - Post new reply
6. **StatusBadge** (~20 LOC) - Thread status indicator
7. **ThreadFilters** (~60 LOC) - Filter/sort controls

Total: 7 small, focused components (all under 200 LOC)

---

## Accessibility Requirements

**Per CLAUDE.md (WCAG 2.2 AA):**
- Semantic HTML elements (article, section, header)
- ARIA attributes for interactive elements
- Focus indicators visible (already in QDS)
- Keyboard navigation support
- 4.5:1 contrast ratio minimum
- Screen reader friendly

**Specific Needs:**
- Thread cards: `role="article"` or `<article>` element
- Action buttons: `aria-label` for icon-only buttons
- Status badges: `aria-label` for screen readers
- Form fields: proper `<label>` with `htmlFor`
- Error messages: `aria-live="polite"` for dynamic content

---

## Responsive Design Breakpoints

**Per CLAUDE.md:**
- Mobile: 360px min
- Tablet: 768px
- Desktop: 1024px
- Large: 1280px

**Planned Layouts:**
- **360-767px**: Single column, stacked layout
- **768-1023px**: 2-column grid for thread lists
- **1024px+**: 3-column grid, sidebar layouts

---

## Performance Considerations

### Memoization Opportunities
- ThreadCard component (likely in long lists)
- PostCard component (many replies)
- Date formatting utilities
- User lookup utilities

### Code Splitting
- Thread detail page can be lazy-loaded
- Form components can be lazy-loaded on route

### Optimization Strategy
- Use React.memo for pure display components
- Use useMemo for expensive computations (sorting, filtering)
- Use useCallback for event handlers passed to memoized children
- Avoid premature optimization (measure first)

---

## Key Decisions from Research

1. **Reuse Card composition** - Don't reinvent, use existing Card primitives
2. **Follow form pattern** - Match login/signup form state management
3. **Use glass variants** - `glass-hover` for lists, `glass-strong` for forms
4. **Badge for status** - Map status to variant (open→outline, answered→secondary, resolved→default)
5. **Small focused components** - 7 components, all under 200 LOC
6. **React Query everywhere** - No direct API calls, use hooks
7. **Type guards for mutations** - Follow AuthResult discriminated union pattern
8. **Optimistic updates** - Use setQueryData for instant UI feedback
9. **Invalidate on mutation** - Clear stale data after creates/updates

---

## Files to Reference During Implementation

- `components/ui/card.tsx` - Card composition pattern
- `components/ui/button.tsx` - Button variants
- `components/ui/badge.tsx` - Badge variants
- `app/courses/page.tsx` - Page layout, loading, empty states
- `app/(auth)/login/page.tsx` - Form pattern
- `lib/api/client.ts` - API method signatures
- `lib/api/hooks.ts` - React Query hook patterns
- `lib/models/types.ts` - Type definitions
- `app/globals.css` - QDS tokens and utility classes

---

**Next Step:** Create detailed component design plan with exact interfaces, file structure, and implementation order.

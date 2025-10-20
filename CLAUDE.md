# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Product Name:** QuokkaQ - Full-Stack Academic Q&A Platform

**Purpose:** A production-ready AI-powered academic Q&A platform with a Next.js frontend and Fastify backend. Features discussion threads, instructor moderation tools, AI-generated answers with citations (via Vercel AI SDK), and similar question suggestions. Supports gradual migration from mock data to real backend via feature flags.

**Development Philosophy:** Clean architecture with feature-flagged backend integration. Frontend uses modular API client layer for seamless mock/backend switching. Backend uses repository pattern with Drizzle ORM (SQLite dev, Postgres prod). Emphasizes type safety, component reusability, and production-ready patterns.

**Key Features:**
1. **Discussion Threads** - Browse, filter, and view Q&A threads with status tracking
2. **AI-Powered Answers** - Simulated AI responses with citations and confidence scoring
3. **Instructor Dashboard** - Metrics, moderation queue, and analytics overview
4. **Similar Questions** - Debounced search with similarity matching
5. **Role-Based UI** - Different views for students, instructors, and TAs
6. **Thread Endorsements** (Phase 3.1) - Prof/TA endorsements and student upvotes for quality signals
7. **Duplicate Detection** (Phase 3.2) - TF-IDF similarity matching prevents duplicate questions (80% threshold)
8. **ROI Metrics Dashboard** (Phase 3.4) - Time saved analytics, citation coverage, engagement metrics
9. **Enhanced AI Prompts** (Phase 3.5) - Absolute dates, ambiguity handling, better citations

---

## Agentic Operating Rules (IMPORTANT)

### Core Principles

1. **Plan First, Code Second**
   - Do NOT edit code until a plan exists on disk: `doccloud/tasks/<slug>/plans/*.md`
   - All plans must be reviewed and approved before implementation

2. **Sub-Agents = Planning Only**
   - If you delegate to a sub-agent, they MUST:
     - Read `doccloud/tasks/<slug>/context.md` first
     - Save research to `research/*.md`
     - Save implementation plans to `plans/*.md`
     - Update **Decisions** section in `context.md`
     - Return ONLY file paths + ≤10 bullet summary
     - **NEVER modify code**

3. **Parent Owns Execution**
   - This session (parent) performs all:
     - File writes and edits
     - Small, verified diffs
     - Tests and type checking
     - Commits and bugfix loops

4. **Context on Disk**
   - Maintain `doccloud/tasks/<slug>/context.md` as **source of truth**
   - Structure: Goal, Scope, Constraints, Decisions, Changelog
   - Update after every significant step

5. **Small Verified Steps**
   - After each diff: run typecheck, lint, applicable tests
   - Commit immediately if green
   - Never batch multiple changes before verification

6. **Respect QDS**
   - Use semantic tokens, spacing grid, radii, shadows
   - **NO hardcoded hex colors**

7. **Accessibility Always**
   - Semantic HTML, ARIA attributes
   - Focus states and keyboard navigation
   - Meet **WCAG 2.2 AA** minimum

8. **Backend Integration**
   - Use feature flags for gradual rollout
   - Frontend API client supports both mock and HTTP backends
   - Backend follows repository pattern with Drizzle ORM
   - Session management via HTTP-only cookies

---

## Agentic Workflow

### Folder Structure

```
doccloud/tasks/
  <task-slug>/
    context.md        # Canonical plan, constraints, decisions, changelog
    research/         # Raw notes/sources per agent
    plans/            # Step plans per agent (implementable)
    artifacts/        # Diagrams/specs/json drafts
```

### Task Lifecycle

1. **Kickoff (Parent)**
   - Create `context.md` with: Goal, Scope, Constraints, Acceptance, Risks, Rollback, Related files
   - Seed TODO list (5-8 items max)

2. **Research Plans (Sub-Agents - Optional)**
   - UI Planner: `plans/ui-plan.md` + `research/ui-sources.md`
     - **Tools Available**: Playwright MCP for browser automation, visual testing, and UI verification
   - AI SDK Planner: `plans/ai-sdk-plan.md` + `research/ai-notes.md`
   - Data/API Planner: `plans/api-plan.md` + `research/api-notes.md`
   - Each updates **Decisions** in `context.md` with 5 lines + file paths

3. **Implement (Parent)**
   - Apply smallest diffs per plan
   - Run tests/typecheck/lint after each diff
   - Commit with Conventional Commits
   - Update `context.md` Changelog

4. **Verify (Parent)**
   - Manual flows, a11y passes, responsive checks
   - Measure bundle size, check console errors

5. **Integrate (Parent)**
   - Wire additional plans if needed
   - Stay within frontend-only scope

6. **Close Task (Parent)**
   - Update `context.md`: outcome, known debt, next tasks
   - Link PR(s) and demo notes

### Acceptance Template

Copy to `context.md`:

```markdown
**Goal:** <single sentence>

**In-Scope:** <pages, components>

**Out-of-Scope:** <anything backend/auth/etc>

**Done When:**
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Demo script updated (README section)
```

### Parent→Sub-Agent Task Template

```markdown
**Task:** {objective}

**Read first:** `doccloud/tasks/{slug}/context.md`

**Deliverables:**
- Save research → `research/{agent}-{topic}.md`
- Save step plan → `plans/{agent}-plan.md` (file paths, signatures, tests, risks)
- Update **Decisions** in `context.md` with 5 lines + file paths
- Reply: "I wrote {plan_path}. Read it before proceeding." + ≤10 bullets

**Rules:** Do NOT edit code; planning/research only.
```

---

## Architecture & Tech Stack

### Core Principles
1. **Full-Stack Architecture** - Next.js frontend + Fastify backend with feature-flagged integration
2. **Type Safety** - TypeScript strict mode throughout (frontend + backend)
3. **Component Reusability** - Props-driven, no hardcoded values
4. **Production-Ready Backend** - Repository pattern, cursor pagination, session cookies

| Layer              | Choice                                | Reason                                    |
| ------------------ | ------------------------------------- | ----------------------------------------- |
| **Frontend Framework** | Next.js 15 + TypeScript           | App Router, Server Components, SSR        |
| **Backend Framework**  | Fastify + TypeScript              | Fast, type-safe, plugin architecture      |
| **Styling**        | Tailwind CSS v4                       | Utility-first, fast development           |
| **Design System**  | Quokka Design System (QDS) v1.0       | Warm, approachable, academic-grade        |
| **UI Components**  | shadcn/ui + Radix UI                  | Accessible, composable, customizable      |
| **State**          | React Query                           | Caching, mutations, optimistic updates    |
| **Database (Dev)** | SQLite + Drizzle ORM                  | Zero-config local development             |
| **Database (Prod)**| Postgres + Drizzle ORM                | Production scalability with AWS RDS       |
| **Data Layer**     | Feature-flagged (mock OR HTTP)        | Gradual backend migration                 |
| **Session Mgmt**   | HTTP-only signed cookies              | Secure, stateless, Lambda-compatible      |
| **AI/LLM**         | Vercel AI SDK (OpenAI/Anthropic/Google) | Streaming responses, tool calling, RAG |
| **Fonts**          | Geist Sans & Mono                     | Modern, readable, variable fonts          |
| **Icons**          | Lucide React                          | Lightweight, tree-shakeable               |

### Project Structure

```plaintext
quokka-demo/
├── app/                          # Next.js pages
│   ├── layout.tsx                # Root layout, providers
│   ├── page.tsx                  # Threads list (home)
│   ├── globals.css               # Design tokens, Tailwind
│   ├── ask/                      # New question form
│   ├── quokka/                   # AI chat interface
│   ├── instructor/               # Dashboard with metrics
│   └── threads/[id]/             # Thread detail + replies
├── components/                   # Feature components
│   ├── ai-answer-card.tsx
│   ├── nav-header.tsx
│   ├── post-item.tsx
│   ├── thread-card.tsx
│   └── ui/                       # shadcn/ui primitives
├── lib/
│   ├── api/
│   │   ├── client/               # Modular API clients (9 modules)
│   │   │   ├── index.ts          # Barrel export
│   │   │   ├── auth.ts           # Auth module (feature-flagged)
│   │   │   ├── threads.ts        # Threads module
│   │   │   ├── posts.ts          # Posts module
│   │   │   ├── courses.ts        # Courses module
│   │   │   ├── materials.ts      # Materials module
│   │   │   ├── ai-answers.ts     # AI answers module
│   │   │   ├── conversations.ts  # Conversations module
│   │   │   ├── instructor.ts     # Instructor module
│   │   │   ├── notifications.ts  # Notifications module
│   │   │   └── http.client.ts    # HTTP adapter (fetch wrapper)
│   │   └── hooks.ts              # React Query hooks (stable)
│   ├── config/
│   │   └── features.ts           # Feature flag system
│   ├── models/
│   │   └── types.ts              # Core data models (frontend)
│   ├── llm/                      # AI SDK integration
│   │   ├── ai-sdk-providers.ts   # OpenAI/Anthropic/Google
│   │   ├── tools/                # RAG tools (kb_search, kb_fetch)
│   │   └── utils/                # Citation parsing
│   ├── store/
│   │   └── localStore.ts         # localStorage mock (fallback)
│   └── utils.ts                  # Utilities (cn, formatters)
├── backend/                      # Fastify backend
│   ├── src/
│   │   ├── server.ts             # Fastify app entry
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema (18 tables)
│   │   │   ├── client.ts         # DB connection (SQLite/Postgres)
│   │   │   ├── seed.ts           # Seed script
│   │   │   └── migrate.ts        # Migration runner
│   │   ├── repositories/         # Repository pattern (9 repos)
│   │   │   ├── base.repository.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── threads.repository.ts
│   │   │   ├── posts.repository.ts
│   │   │   └── ...
│   │   ├── routes/v1/            # API endpoints (12/44 working)
│   │   │   ├── auth.routes.ts    # 3 endpoints
│   │   │   ├── threads.routes.ts # 4 endpoints
│   │   │   ├── posts.routes.ts   # 2 endpoints
│   │   │   ├── courses.routes.ts # 2 endpoints
│   │   │   └── ...
│   │   ├── plugins/              # Fastify plugins
│   │   │   ├── session.plugin.ts # Session cookies
│   │   │   ├── validation.plugin.ts # Zod validation
│   │   │   └── error.plugin.ts   # Error handling
│   │   ├── schemas/              # Zod schemas
│   │   │   ├── threads.schema.ts
│   │   │   └── ...
│   │   └── utils/
│   │       └── errors.ts         # Stable error codes
│   ├── drizzle/                  # Migrations
│   ├── dev.db                    # SQLite database (dev)
│   ├── package.json
│   └── tsconfig.json
├── mocks/                        # Seed data (migrated to backend)
│   ├── threads.json
│   ├── users.json
│   ├── ai-responses.json
│   └── course-materials.json
├── doccloud/                     # Agentic workflow context
│   ├── tasks/production-backend/
│   │   ├── context.md
│   │   ├── research/
│   │   ├── plans/
│   │   └── artifacts/
│   ├── TASK-TEMPLATE.md
│   └── AGENT-TASK-TEMPLATE.md
└── README.md
```

---

## Development Workflow

### Local Development

```bash
# Frontend (from root directory)
npm install                       # Install dependencies
npm run dev                       # Start dev server (localhost:3000)
npm run build                     # Build for production
npm start                         # Start production server
npm run lint                      # Lint code

# Backend (from backend/ directory)
cd backend
npm install                       # Install dependencies
npm run dev                       # Start Fastify server (localhost:3001)
npm run db:generate               # Generate migrations
npm run db:migrate                # Run migrations
npm run db:seed                   # Seed database with mock data
npm run build                     # Build for production
npm start                         # Start production server

# Full-stack development (run both in separate terminals)
# Terminal 1: npm run dev         # Frontend on :3000
# Terminal 2: cd backend && npm run dev  # Backend on :3001
```

### Key Routes

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/` | Threads List | Browse all threads, filter by status, view metadata |
| `/threads/[id]` | Thread Detail | View question, AI answer, replies, post new responses |
| `/ask` | New Question | Submit question, see similar threads, preview AI answer |
| `/quokka` | AI Chat | Private LLM conversations with course context, persistence |
| `/instructor` | Dashboard | View metrics, unanswered queue, moderation tools |

---

## Implementation Guidelines

### Before Coding

- **BP-1 (MUST)** Create task context in `doccloud/tasks/<slug>/context.md`
- **BP-2 (MUST)** Understand component hierarchy - no duplicate logic
- **BP-3 (MUST)** Check if shadcn/ui component exists before creating custom
- **BP-4 (SHOULD)** Review existing hooks before adding new data patterns
- **BP-5 (MUST)** Verify TypeScript types are imported correctly
- **BP-6 (SHOULD)** Check design tokens in `globals.css` for colors/spacing

### While Coding

- **C-1 (MUST)** Use TypeScript strict mode, no `any` types
- **C-2 (MUST)** Use `import type { ... }` for type-only imports
- **C-3 (MUST)** All components accept data via props, no hardcoded values
- **C-4 (MUST)** Use React Query hooks for data fetching, never direct API calls
- **C-5 (SHOULD)** Keep components small (<200 lines), split if needed
- **C-6 (MUST)** Use `cn()` utility for className composition
- **C-7 (SHOULD NOT)** Add real-time features - keep it request/response
- **C-8 (MUST)** Handle loading and error states in UI
- **C-9 (MUST)** Use semantic HTML and ARIA attributes for accessibility
- **C-10 (SHOULD)** Keep functions pure where possible
- **C-11 (MUST)** Follow existing naming conventions (camelCase, PascalCase)
- **C-12 (SHOULD NOT)** Over-engineer - simplicity over abstraction
- **C-13 (MUST)** Use Lucide icons consistently, import only needed icons
- **C-14 (MUST)** Responsive design - test mobile, tablet, desktop
- **C-15 (MUST)** Use QDS color tokens - never hardcode hex colors
- **C-16 (MUST)** Use QDS spacing scale (4pt grid: gap-1, gap-2, gap-4, etc.)
- **C-17 (MUST)** Use QDS radius scale (rounded-md, rounded-lg, rounded-xl)
- **C-18 (MUST)** Use QDS shadows (shadow-e1, shadow-e2, shadow-e3)
- **C-19 (MUST)** Ensure 4.5:1 contrast ratio minimum for text
- **C-20 (MUST)** Provide hover/focus/disabled states using QDS tokens

### Testing Conventions

- **T-1 (MUST)** Test all user flows end-to-end manually
- **T-2 (SHOULD)** Verify keyboard navigation works
- **T-3 (MUST)** Check loading states display correctly
- **T-4 (SHOULD)** Test with different screen sizes (360px, 768px, 1024px, 1280px)
- **T-5 (MUST)** Verify error handling works gracefully
- **T-6 (SHOULD)** Test accessibility with screen reader
- **T-7 (MUST)** Verify mock data seed is consistent
- **T-8 (MUST)** Verify color contrast meets WCAG AA (4.5:1 minimum)
- **T-9 (SHOULD)** Test light and dark modes
- **T-10 (MUST)** Ensure focus indicators are visible on all interactive elements

### Deployment

- **D-1 (MUST)** Run `npm run build` before deploying
- **D-2 (SHOULD)** Check for TypeScript errors: `npx tsc --noEmit`
- **D-3 (MUST)** Verify all routes render correctly in production build
- **D-4 (SHOULD)** Check bundle size is reasonable (<200KB per route)
- **D-5 (MUST)** Test in production mode: `npm run build && npm start`

---

## Mock API Contract

**Do NOT break these contracts** - they are the abstraction for backend swap.

### Methods (lib/api/client.ts)

| Method | Returns | Delay |
|--------|---------|-------|
| `getThreads()` | `Thread[]` | 200-500ms |
| `getThread(id)` | `Thread \| null` | 200-500ms |
| `createThread(input)` | `Thread` | 200-500ms |
| `createPost(input)` | `Post` | 200-500ms |
| `endorsePost(id)` | `void` | 100ms |
| `flagPost(id)` | `void` | 100ms |
| `resolveThread(id)` | `void` | 100ms |
| `askQuestion(input)` | `AiAnswer` | 800ms |
| `getSimilarThreads(query)` | `SimilarThread[]` | 200-500ms |
| `getInstructorMetrics(courseId, timeRange)` | `InstructorMetrics` | 300-500ms |
| `getUnansweredThreads()` | `Thread[]` | 200-500ms |
| `getCurrentUser()` | `User` | 200-500ms |
| `endorseThread(threadId, userId)` (Phase 3.1) | `void` | 100ms |
| `upvoteThread(threadId, userId)` (Phase 3.1) | `void` | 100ms |
| `removeUpvote(threadId, userId)` (Phase 3.1) | `void` | 100ms |
| `checkThreadDuplicates(input)` (Phase 3.2) | `SimilarThread[]` | 200-500ms |
| `mergeThreads(sourceId, targetId, userId)` (Phase 3.2) | `Thread` | 200-500ms |

### Hooks (lib/api/hooks.ts)

All hook names and signatures MUST remain stable:

```typescript
useThreads()                           // Fetches all threads
useThread(id)                          // Fetches single thread
useCreateThread()                      // Mutation for new thread
useCreatePost()                        // Mutation for new post
useEndorsePost()                       // Mutation for post endorsement
useFlagPost()                          // Mutation for flagging
useResolveThread()                     // Mutation for resolving
useAskQuestion()                       // Mutation for AI query
useSimilarThreads(query)               // Debounced similar search
useInstructorMetrics(courseId, range)  // Dashboard metrics (updated Phase 3.4)
useUnansweredThreads()                 // Open threads
useCurrentUser()                       // Current user
useEndorseThread()                     // Mutation for thread endorsement (Phase 3.1)
useUpvoteThread()                      // Mutation for upvoting (Phase 3.1)
useRemoveUpvote()                      // Mutation for removing upvote (Phase 3.1)
useCheckDuplicates()                   // Mutation for duplicate check (Phase 3.2)
useMergeThreads()                      // Mutation for merging threads (Phase 3.2)
```

---

## LLM Integration Architecture

**Status:** ✅ Complete (2025-10-17)

### Overview

The application supports two modes:
1. **LLM Mode** - Real AI responses using OpenAI/Anthropic/Google APIs (requires `.env.local`)
2. **Fallback Mode** - Template-based responses (default, no setup required)

### Conversation System

**Core Concept:** Private, persistent conversations stored in localStorage with automatic course context detection.

#### Key Hooks (lib/api/hooks.ts)

```typescript
// Conversation management
useAIConversations(userId)              // List all user conversations
useConversationMessages(conversationId) // Get messages for conversation
useCreateConversation()                 // Create new conversation
useSendMessage()                        // Send message + get AI response
useDeleteConversation()                 // Delete conversation
useConvertConversationToThread()        // Convert to public thread

// Course context
useCourseMaterials(courseId)            // Get course materials for context
```

#### Implementation Pattern

**Quokka Page (`/app/quokka/page.tsx`):**
```typescript
// 1. Auto-load or create conversation on mount
useEffect(() => {
  if (!user || activeConversationId) return;

  if (conversations && conversations.length > 0) {
    setActiveConversationId(conversations[0].id); // Load most recent
  } else {
    createConversation.mutate({
      userId: user.id,
      courseId: null, // null = multi-course context
      title: "Quokka Chat",
    });
  }
}, [user, conversations, activeConversationId]);

// 2. Fetch messages for active conversation
const { data: messages = [] } = useConversationMessages(activeConversationId);

// 3. Send message with optimistic update
sendMessage.mutate({
  conversationId: activeConversationId,
  content: messageContent,
  userId: user.id,
  role: "user",
});
```

**Assistant Modal (`components/ai/quokka-assistant-modal.tsx`):**
```typescript
// 1. Course-specific conversation (separate per course)
useEffect(() => {
  if (!isOpen || !user || !courseId) return;

  const existing = conversations?.find(c => c.courseId === courseId);
  if (existing) {
    setActiveConversationId(existing.id);
  } else {
    createConversation.mutate({
      userId: user.id,
      courseId: courseId, // Course-specific
      title: `${courseName} - AI Assistant`,
    });
  }
}, [isOpen, user, courseId, conversations]);
```

#### Performance Optimizations (Applied 2025-10-17)

**1. Removed 5-second polling** - Eliminated 720 requests/hour per conversation
```typescript
// ❌ OLD (wasteful)
refetchInterval: 5000

// ✅ NEW (rely on invalidations)
// No polling - mutations trigger invalidations
```

**2. Surgical cache invalidation** - Added `userId` field
```typescript
// lib/api/client.ts - Updated signature
export async function sendMessage(input: SendMessageInput): Promise<void> {
  // Now requires userId for targeted invalidation
}

// lib/api/hooks.ts - Targeted invalidation
queryClient.invalidateQueries({
  queryKey: ["aiConversations", userId]
});
```

**3. Optimistic updates** - Already implemented
```typescript
useSendMessage() // Automatically adds user message to UI immediately
```

#### LLM Context Builders

**Location:** `lib/llm/context/` (from Phase 1-8)

The backend automatically:
- Detects course from conversation's `courseId`
- Loads relevant course materials from `mocks/course-materials.json`
- Builds context with documents, topics, and metadata
- Passes context to LLM provider (OpenAI/Anthropic/Google)

**No client-side course detection needed** - Backend handles it.

#### Citation Display (Phase 2.6 - Added 2025-10-17)

**Status:** ✅ Complete

When AI responses reference course materials (via `kb_search` and `kb_fetch` tools), citations are automatically displayed with inline markers and a sources panel.

**Features:**

1. **Inline Citation Markers `[1] [2]`**
   - Highlighted with QDS accent tokens (`bg-accent/20`)
   - Clickable to scroll to source in panel
   - Keyboard navigable (Tab, Enter, Space)
   - Hover tooltip shows source title

2. **Sources Panel**
   - Collapsible panel below assistant messages
   - Shows citation number, title, and type
   - Links to inline markers via `data-citation-id` attributes
   - Defaults to expanded state

3. **Visual Indicators**
   - Accent border (`border-l-2 border-accent`) on cited messages
   - Sources section automatically stripped from message text
   - Clean separation of content and citations

**Implementation:**
```typescript
// Parse citations from AI response
const parsed = parseCitations(messageText);

// Render text with highlighted markers
<div className="text-sm">
  {renderTextWithCitations(parsed.contentWithoutSources, parsed.citations)}
</div>

// Display sources panel
{parsed.citations.length > 0 && (
  <SourcesPanel citations={parsed.citations} defaultExpanded={true} />
)}
```

**Files:**
- `lib/llm/utils/citations.ts` - Citation parser
- `components/ai/sources-panel.tsx` - Sources UI
- `components/ai/quokka-assistant-modal.tsx` - Integration

**LLM Prompt Format:**

The system prompt instructs the LLM to format citations as:
```
Binary search is O(log n) [1]. It divides the search space [2].

**Sources:**
1. Lecture 3: Binary Search (Type: lecture)
2. Week 2 Slides: Search Algorithms (Type: slide)
```

This format is automatically parsed and rendered in the UI.

#### Environment Setup

**Optional `.env.local`** (see `.env.local.example`):
```bash
# LLM Provider (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Provider selection
NEXT_PUBLIC_LLM_PROVIDER=openai  # or anthropic, google
NEXT_PUBLIC_USE_LLM=true
```

**Without `.env.local`:** Falls back to template-based responses.

#### Conversation → Thread Conversion

```typescript
const convertToThread = useConvertConversationToThread();

convertToThread.mutate({
  conversationId: activeConversationId,
  userId: user.id,
});
// Creates public thread with all messages
// Maintains bi-directional link
```

### QDS Compliance Notes

**Tailwind v4 Compatibility:**
- Custom utilities **cannot** be used in `@apply`
- Use direct CSS properties instead:

```css
/* ✅ GOOD: Direct properties */
.message-assistant {
  @apply backdrop-blur-md bg-glass-strong;
  border-color: var(--border-glass);  /* Direct */
  box-shadow: var(--shadow-glass-sm); /* Direct */
}

/* ❌ BAD: Custom utility in @apply */
.message-assistant {
  @apply backdrop-blur-md bg-glass-strong border-glass shadow-glass-sm;
}
```

**Shadow Utilities:** Define outside `@layer utilities`:
```css
/* Outside @layer utilities block */
.shadow-glass-sm {
  box-shadow: var(--shadow-glass-sm);
}
```

### Migration Notes

**From Template System to LLM:**
1. ✅ Old `getAIResponse()` function removed
2. ✅ Local message state replaced with React Query
3. ✅ Course detection moved to backend
4. ✅ Conversation persistence added
5. ✅ Optimistic updates implemented

**Backward Compatibility:**
- Template fallback still works without API keys
- All existing UX flows preserved
- No breaking changes to UI components

---

## Prompt Shortcuts

### QNEW - Project Orientation
```
Read CLAUDE.md, list critical files & flows, confirm mock API surface.
Don't edit files. Save findings to doccloud/tasks/_onboarding/research/overview.md
and summarize in 8 bullets.
```

### QPLAN - Plan First (No Edits)
```
For <feature>, search repo and propose 2-3 approaches.
Don't edit files. Save to doccloud/tasks/<slug>/plans/plan.md
with exact file paths, signatures, tests, risks.
Summarize (≤10 bullets) here.
```

### QCODE - Small Verified Diff
```
Implement step 1 of plan <path>. Keep diff minimal.
Run typecheck/lint/tests; show results.
Commit with Conventional Commit.
```

### QCHECK - Quality Gate
```
Run tsc, lint, and a11y/contrast checks for pages touched.
Report failures and propose smallest fixes.
```

### QDEPLOY - Prod Check
```
Build prod and validate all routes.
Report bundle sizes, console errors, hydration issues.
Propose one split point if any route >200KB.
```

### QAGENT - Delegate to Sub-Agent
```
Launch <UI/AI/API> planner sub-agent for <task>.
Read: doccloud/tasks/<slug>/context.md
Deliverables: research/*.md, plans/*.md, update Decisions
Rules: Planning only, no code edits
Reply: file path + ≤10 bullets
```

---

## Design System (QDS)

Full documentation in [QDS.md](QDS.md).

### Key Principles
1. **Clarity first** — Minimize cognitive load
2. **Warm professionalism** — Friendly without excess
3. **Grounded motion** — Subtle, purposeful animations
4. **Accessible by default** — WCAG 2.2 AA minimum
5. **System over pages** — Tokens power consistency

### Color Tokens (app/globals.css)

```css
/* Primary (Quokka Brown) */
--primary: #8A6B3D
--primary-hover: #6F522C

/* Secondary (Rottnest Olive) */
--secondary: #5E7D4A

/* Accent (Clear Sky) */
--accent: #2D6CDF

/* Support */
--success: #2E7D32
--warning: #B45309
--danger: #D92D20
```

### Usage Examples

```tsx
// ✅ GOOD: Semantic tokens
<Button className="bg-primary hover:bg-primary-hover">
  Primary Action
</Button>

// ❌ BAD: Hardcoded colors
<Button className="bg-[#8A6B3D]">
```

---

## Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
rm -rf .next && npm run dev
```

**TypeScript errors on build:**
```bash
npx tsc --noEmit
npm install
```

**React Query not updating:**
```typescript
const { mutate } = useCreatePost();
mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['threads'] });
  }
});
```

---

## Conventional Commits

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `chore:` - Infrastructure/config
- `refactor:` - Code restructuring
- `style:` - Formatting/styling
- `perf:` - Performance improvement

Example: `feat: add similar questions sidebar to ask page`

---

## Change Logging

Format: `YYYY-MM-DD | [Component] | Description`

Update `context.md` after each task:

```markdown
## Changelog

- `2025-10-17` | [Phase 3] | Thread endorsements, duplicate detection, ROI metrics dashboard, enhanced AI prompts
- `2025-10-04` | [Workflow] | Set up agentic development workflow with doccloud/
- `2025-10-03` | [Design System] | Applied QDS v1.0
- `2025-10-03` | [Documentation] | Created CLAUDE.md
```

---

## Additional Resources

- **[QDS.md](QDS.md)** - Complete Quokka Design System implementation guide
- **[doccloud/TASK-TEMPLATE.md](doccloud/TASK-TEMPLATE.md)** - Template for new tasks
- **[doccloud/AGENT-TASK-TEMPLATE.md](doccloud/AGENT-TASK-TEMPLATE.md)** - Template for sub-agent delegation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Query v5 Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

---

## Important Reminders

### Agentic Workflow
- **Plan on disk first** - No code edits without documented plan
- **Context persistence** - Update `context.md` after every step
- **Small verified steps** - Test/typecheck/lint after each diff
- **Sub-agents plan only** - Parent executes all code changes

### Technical Excellence
- **Type safety first** - No `any`, explicit interfaces
- **Component reusability** - Props-driven, no hardcoded values
- **Mock data integrity** - Deterministic, consistent seed
- **Accessibility** - Semantic HTML, ARIA, keyboard nav
- **Performance** - Small bundles, code splitting, lazy loading

### Development Philosophy
- **Keep it simple** - Frontend-only, in-memory state
- **Ready for backend** - Clean API abstraction
- **QDS first** - Use design system tokens, never hardcode
- **User experience** - Loading states, error handling, responsiveness
- **Maintainability** - Small components, pure functions, clear types

---

### Core Mantra

**Plan on disk → Implement in tiny verified steps → Keep mock API stable → Let Claude be your terminal-native co-pilot**

*You steer with tests, commits, and guardrails.*

---

*This guide is specific to the QuokkaQ frontend-only demo application built with the Quokka Design System (QDS) v1.0.*

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Product Name:** QuokkaQ Demo - Frontend-Only Academic Q&A Showcase

**Purpose:** A production-ready frontend demonstration of an AI-powered academic Q&A platform. Showcases discussion threads, instructor moderation tools, AI-generated answers with citations, and similar question suggestions - all without requiring backend infrastructure.

**Development Philosophy:** Frontend-first with mock data, designed for easy backend integration. Emphasizes component reusability, type safety, and clean separation of concerns.

**Key Features:**
1. **Discussion Threads** - Browse, filter, and view Q&A threads with status tracking
2. **AI-Powered Answers** - Simulated AI responses with citations and confidence scoring
3. **Instructor Dashboard** - Metrics, moderation queue, and analytics overview
4. **Similar Questions** - Debounced search with similarity matching
5. **Role-Based UI** - Different views for students, instructors, and TAs

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

8. **No Real Backend**
   - Stay within mock API boundaries
   - No network calls beyond project scope

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
1. **Frontend-Only** - No backend required, all data mocked in-memory
2. **Type Safety** - TypeScript strict mode throughout
3. **Component Reusability** - Props-driven, no hardcoded values
4. **Ready for Backend** - Clean API abstraction layer for easy swap

| Layer              | Choice                                | Reason                                    |
| ------------------ | ------------------------------------- | ----------------------------------------- |
| **Framework**      | Next.js 15 + TypeScript               | App Router, Server Components, SSR        |
| **Styling**        | Tailwind CSS v4                       | Utility-first, fast development           |
| **Design System**  | Quokka Design System (QDS) v1.0       | Warm, approachable, academic-grade        |
| **UI Components**  | shadcn/ui + Radix UI                  | Accessible, composable, customizable      |
| **State**          | React Query                           | Caching, mutations, optimistic updates    |
| **Data Layer**     | In-memory mock API                    | Simulates network delay, deterministic    |
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
│   │   ├── client.ts             # Mock API implementation
│   │   └── hooks.ts              # React Query hooks
│   ├── models/
│   │   └── types.ts              # Core data models
│   └── utils.ts                  # Utilities (cn, formatters)
├── mocks/                        # Seed data
│   ├── threads.json
│   ├── users.json
│   ├── ai-responses.json
│   └── kb-docs.json
├── doccloud/                     # Agentic workflow context
│   ├── tasks/<slug>/
│   │   ├── context.md
│   │   ├── research/
│   │   ├── plans/
│   │   └── artifacts/
│   ├── TASK-TEMPLATE.md
│   └── AGENT-TASK-TEMPLATE.md
├── scripts/
│   └── seed-demo.mjs
└── README.md
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (Turbopack enabled)
npm run dev                       # localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Reseed mock data (if needed)
npm run seed
```

### Key Routes

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/` | Threads List | Browse all threads, filter by status, view metadata |
| `/threads/[id]` | Thread Detail | View question, AI answer, replies, post new responses |
| `/ask` | New Question | Submit question, see similar threads, preview AI answer |
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
| `getInstructorMetrics()` | `InstructorMetrics` | 200-500ms |
| `getUnansweredThreads()` | `Thread[]` | 200-500ms |
| `getCurrentUser()` | `User` | 200-500ms |

### Hooks (lib/api/hooks.ts)

All hook names and signatures MUST remain stable:

```typescript
useThreads()              // Fetches all threads
useThread(id)             // Fetches single thread
useCreateThread()         // Mutation for new thread
useCreatePost()           // Mutation for new post
useEndorsePost()          // Mutation for endorsement
useFlagPost()             // Mutation for flagging
useResolveThread()        // Mutation for resolving
useAskQuestion()          // Mutation for AI query
useSimilarThreads(query)  // Debounced similar search
useInstructorMetrics()    // Dashboard metrics
useUnansweredThreads()    // Open threads
useCurrentUser()          // Current user
```

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

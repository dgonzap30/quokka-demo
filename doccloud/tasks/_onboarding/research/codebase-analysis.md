# Codebase Analysis for Specialized Agent Design

**Date:** 2025-10-04
**Purpose:** Identify project patterns, challenges, and opportunities for specialized sub-agents
**Analyzed by:** Agentic Workflow Setup

---

## Executive Summary

Analyzed QuokkaQ Demo codebase to identify specialized knowledge domains for sub-agent creation. Found 8 critical areas where specialized planning agents would provide maximum value:

1. **QDS Compliance** - Design system enforcement
2. **Accessibility** - WCAG 2.2 AA validation
3. **Component Architecture** - Reusable patterns
4. **Mock API Design** - Contract stability
5. **React Query** - Data fetching optimization
6. **Type Safety** - TypeScript strict mode
7. **Bundle Optimization** - Performance
8. **Integration Readiness** - Backend swap preparation

---

## Codebase Characteristics

### Technology Stack
- **Framework:** Next.js 15 (App Router) with Turbopack
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + QDS v1.0
- **Components:** shadcn/ui + Radix UI
- **State:** React Query (TanStack Query v5)
- **Data:** In-memory mock API
- **Fonts:** Geist Sans & Mono
- **Icons:** Lucide React

### Architecture Patterns

**Frontend-Only:**
- No real backend
- In-memory state (lost on refresh)
- Deterministic mock data
- Simulated network delays

**Component-Driven:**
- Props-driven design
- No hardcoded data
- Composition over inheritance
- <200 LoC per component

**Type-Safe:**
- TypeScript strict mode
- No `any` types
- Type-only imports
- Explicit interfaces

**Design System:**
- QDS v1.0 tokens
- 4pt spacing grid
- Semantic color tokens
- Dark mode support

---

## Key Files Analyzed

### Core Application
- `app/page.tsx` - Threads list (home)
- `app/threads/[id]/page.tsx` - Thread detail
- `app/ask/page.tsx` - New question form
- `app/instructor/page.tsx` - Dashboard

### Components
- `components/thread-card.tsx` - Thread preview
- `components/ai-answer-card.tsx` - AI response display
- `components/post-item.tsx` - Reply display
- `components/nav-header.tsx` - Navigation

### Data Layer
- `lib/api/client.ts` - Mock API implementation
- `lib/api/hooks.ts` - React Query hooks
- `lib/models/types.ts` - TypeScript interfaces
- `mocks/*.json` - Seed data

### Configuration
- `app/globals.css` - QDS tokens & Tailwind config
- `package.json` - Dependencies & scripts
- `tsconfig.json` - TypeScript configuration

---

## Patterns Identified

### 1. QDS Token Usage

**Pattern:**
```tsx
// ✅ Good: Semantic tokens
<Button className="bg-primary hover:bg-primary-hover">

// ❌ Bad: Hardcoded colors
<Button className="bg-[#8A6B3D]">
```

**Files:** All `*.tsx` components, `app/globals.css`

**Challenges:**
- Ensuring all components use tokens
- Dark mode compatibility
- Contrast ratio compliance (4.5:1 minimum)
- Consistent spacing (4pt grid)

**Agent Need:** **QDS Compliance Auditor**

### 2. Component Architecture

**Pattern:**
```tsx
// Props-driven component
interface ThreadCardProps {
  thread: Thread;
  linkPrefix?: string;
}

export function ThreadCard({ thread, linkPrefix }: ThreadCardProps) {
  // No hardcoded data, all via props
}
```

**Files:** `components/*.tsx`

**Challenges:**
- Maintaining props-driven design
- Avoiding hardcoded values
- Component composition
- State lifting decisions

**Agent Need:** **Component Architect**

### 3. Mock API Contract

**Pattern:**
```typescript
// Client method
async getThreads(): Promise<Thread[]> {
  await delay();
  return threads.map(hydrateThread).sort(...);
}

// React Query hook
export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads,
    queryFn: () => api.getThreads(),
  });
}
```

**Files:** `lib/api/client.ts`, `lib/api/hooks.ts`

**Challenges:**
- Maintaining contract stability
- Adding new endpoints
- Query key consistency
- Invalidation strategies

**Agent Need:** **Mock API Designer** + **React Query Strategist**

### 4. Type Safety

**Pattern:**
```typescript
// Type-only imports
import type { Thread, User, Post } from "@/lib/models/types";

// Strict interfaces
export interface Thread {
  id: string;
  title: string;
  author: User; // not User | null
  status: ThreadStatus; // union type
  // ...
}
```

**Files:** `lib/models/types.ts`, all `*.tsx`

**Challenges:**
- Avoiding `any` types
- Using `import type` for imports
- Discriminated unions
- Type guards

**Agent Need:** **Type Safety Guardian**

### 5. Accessibility

**Pattern:**
```tsx
// Semantic HTML + ARIA
<nav aria-label="Main navigation">
  <button aria-label="Open menu" aria-expanded={isOpen}>
    <Menu className="h-4 w-4" />
  </button>
</nav>
```

**Files:** All `*.tsx` components

**Challenges:**
- ARIA attributes completeness
- Keyboard navigation
- Focus management (traps, rings)
- Screen reader compatibility
- Color contrast

**Agent Need:** **Accessibility Validator**

### 6. React Query Patterns

**Pattern:**
```typescript
// Mutation with invalidation
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(variables.threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
    },
  });
}
```

**Files:** `lib/api/hooks.ts`

**Challenges:**
- Query key design
- Invalidation targeting
- Optimistic updates
- Stale time configuration

**Agent Need:** **React Query Strategist**

### 7. Bundle Size

**Current State:**
- Dev server: Turbopack enabled
- Build: Next.js 15 with automatic code splitting
- No explicit lazy loading
- All components eagerly loaded

**Challenges:**
- Potential for large bundles
- No dynamic imports yet
- Heavy dependencies (Radix UI suite)

**Agent Need:** **Bundle Optimizer**

### 8. Backend Integration Prep

**Current State:**
- Mock API fully abstracted in `lib/api/client.ts`
- Components use React Query hooks (no direct API calls)
- No environment variables yet
- No auth hooks

**Challenges:**
- Environment configuration
- Authentication integration points
- Error handling for real network
- CORS configuration

**Agent Need:** **Integration Readiness Checker**

---

## Design Decisions

### Why 8 Agents?

**Coverage:** Each agent covers a distinct knowledge domain
**Specialization:** Deep expertise in one area vs. shallow in many
**Composability:** Agents can work together (parallel or sequential)
**Maintainability:** Easy to update one agent without affecting others

### Agent Boundaries

| Agent | Focuses On | Does NOT Handle |
|-------|------------|-----------------|
| QDS Auditor | Design tokens, spacing | Logic, data flow |
| A11y Validator | WCAG compliance | Business logic |
| Component Architect | Structure, props | Styling, a11y |
| API Designer | Contracts, types | UI, presentation |
| React Query | Caching, invalidation | API implementation |
| Type Guardian | TypeScript | Runtime logic |
| Bundle Optimizer | Performance | Feature logic |
| Integration Checker | Backend prep | Current features |

### Agent Output Format

**Standardized across all agents:**

1. **Research** (`research/*.md`)
   - Current state analysis
   - Existing patterns
   - Issues found
   - Opportunities

2. **Implementation Plan** (`plans/*.md`)
   - Exact file paths
   - Code signatures
   - Step-by-step order
   - Test scenarios
   - Risks & mitigations

3. **Decisions Update** (`context.md`)
   - 5-line summary
   - Rationale
   - Trade-offs

4. **Reply** (to parent)
   - File paths created
   - ≤10 bullet summary

---

## Usage Recommendations

### By Development Phase

**Planning (Before Code):**
1. Component Architect - Design structure
2. Type Safety Guardian - Define types
3. Mock API Designer - Plan endpoints

**Implementation (During Code):**
1. QDS Compliance Auditor - Check styling
2. Accessibility Validator - Validate a11y
3. React Query Strategist - Optimize hooks

**Optimization (After Code):**
1. Bundle Optimizer - Reduce size
2. React Query Strategist - Improve caching
3. Type Safety Guardian - Fix type errors

**Pre-Deployment (Before Launch):**
1. Accessibility Validator - Full WCAG audit
2. QDS Compliance Auditor - Design review
3. Bundle Optimizer - Performance check
4. Integration Readiness Checker - Backend prep

### By Task Complexity

**Simple Task (1 agent):**
- Single component styling → QDS Auditor
- Single form accessibility → A11y Validator
- Single endpoint addition → API Designer

**Medium Task (2-3 agents):**
- New UI feature → Component Architect + QDS Auditor + A11y Validator
- New data feature → API Designer + Type Guardian + React Query Strategist

**Complex Task (4+ agents):**
- Major feature → All relevant agents
- Pre-launch audit → All quality agents (QDS, A11y, Bundle, Integration)

### Parallel vs. Sequential

**Parallel (same prompt):**
- Component Architect + Type Safety Guardian (design phase)
- QDS Auditor + A11y Validator (audit phase)

**Sequential (wait for results):**
1. Component Architect → designs structure
2. QDS Auditor → checks design compliance
3. A11y Validator → validates accessibility

---

## Quality Metrics

### QDS Compliance
- **Target:** 100% token usage (no hardcoded colors)
- **Measure:** Grep for hex codes, arbitrary values
- **Agent:** QDS Compliance Auditor

### Accessibility
- **Target:** WCAG 2.2 AA (4.5:1 text, 3:1 UI)
- **Measure:** Lighthouse, axe, keyboard testing
- **Agent:** Accessibility Validator

### Type Safety
- **Target:** 0 `any` types, 100% strict mode
- **Measure:** `npx tsc --noEmit`
- **Agent:** Type Safety Guardian

### Bundle Size
- **Target:** <200KB per route
- **Measure:** `next build` output
- **Agent:** Bundle Optimizer

### Code Quality
- **Target:** All components <200 LoC
- **Measure:** Line count per file
- **Agent:** Component Architect

---

## Risks & Mitigations

### Risk: Over-Planning
**Symptom:** Too much planning, not enough coding
**Mitigation:** Use agents for complex tasks only; simple tasks → direct implementation

### Risk: Agent Drift
**Symptom:** Agent recommendations diverge from codebase patterns
**Mitigation:** Agents must read existing code first; update agent templates with learned patterns

### Risk: Context Explosion
**Symptom:** Too many files in `research/` and `plans/`
**Mitigation:** Consolidate after task completion; use `/compact` to summarize

### Risk: Agent Conflicts
**Symptom:** One agent's plan contradicts another's
**Mitigation:** Sequential agents read previous plans; parent resolves conflicts

---

## Success Criteria

### Agent Effectiveness

**Good Agent:**
- Plans are followed >90% during implementation
- Issues caught before code is written
- Reduces bugfix iterations
- Improves final quality (measured by metrics)

**Bad Agent:**
- Plans ignored or heavily modified
- Misses obvious issues
- Slows down development
- No quality improvement

### Codebase Health

**Before Agents:**
- Inconsistent QDS usage
- Accessibility gaps
- Type safety violations
- Large bundle sizes

**After Agents:**
- 100% QDS compliance
- WCAG 2.2 AA achieved
- 0 `any` types
- All routes <200KB

---

## Next Steps

1. **Create Agents** - Document specialized agents in `SPECIALIZED-AGENTS.md` ✅
2. **Create Quick Reference** - Fast lookup guide in `AGENT-QUICK-REFERENCE.md` ✅
3. **Test Workflow** - Try agents on real task
4. **Refine Templates** - Update based on experience
5. **Add Examples** - Document successful agent uses
6. **Measure Impact** - Track metrics before/after agents

---

## Conclusions

**Key Findings:**
1. Codebase has clear patterns (QDS, props-driven, type-safe)
2. Common challenges fit into 8 specialized domains
3. Agents provide value through deep expertise + planning discipline
4. Agentic workflow enforces quality through pre-implementation audits

**Agent Value Proposition:**
- **QDS Auditor** - Prevents design system drift
- **A11y Validator** - Ensures WCAG compliance from start
- **Component Architect** - Maintains reusability patterns
- **API Designer** - Keeps backend swap path clear
- **React Query Strategist** - Optimizes data fetching
- **Type Guardian** - Enforces strict TypeScript
- **Bundle Optimizer** - Maintains performance
- **Integration Checker** - Validates backend readiness

**Recommended First Use:**
Try **Component Architect** + **QDS Auditor** + **A11y Validator** on next UI feature to validate workflow.

---

**Analysis complete.** See:
- [SPECIALIZED-AGENTS.md](../../SPECIALIZED-AGENTS.md) - Full agent specs
- [AGENT-QUICK-REFERENCE.md](../../AGENT-QUICK-REFERENCE.md) - Fast lookup

*Codebase analyzed: 2025-10-04*

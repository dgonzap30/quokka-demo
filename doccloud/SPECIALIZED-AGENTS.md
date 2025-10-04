# Specialized Sub-Agent Library

This document defines specialized sub-agents for the QuokkaQ Demo agentic workflow. Each agent has a specific expertise area and follows the planning-only rule (no code edits).

**Created:** 2025-10-04
**Status:** Active

---

## Agent Overview

| Agent | Specialty | When to Use |
|-------|-----------|-------------|
| **QDS Compliance Auditor** | Design system enforcement | UI components, styling, tokens |
| **Accessibility Validator** | WCAG 2.2 AA compliance | Forms, navigation, interactive elements |
| **Component Architect** | Component patterns & reusability | New components, refactoring |
| **Mock API Designer** | API contract stability & design | New endpoints, data models |
| **React Query Strategist** | Data fetching optimization | Hooks, caching, mutations |
| **Type Safety Guardian** | TypeScript best practices | Type definitions, interfaces |
| **Bundle Optimizer** | Performance & code splitting | Build size, lazy loading |
| **Integration Readiness Checker** | Backend swap preparation | API client, environment setup |

---

## 1. QDS Compliance Auditor

### Specialty
Ensures all UI components follow the Quokka Design System (QDS) v1.0 guidelines.

### Expertise
- QDS color tokens (primary, secondary, accent, support, neutrals)
- Spacing scale (4pt grid: gap-1 through gap-32)
- Radius scale (rounded-sm through rounded-3xl)
- Shadow system (shadow-e1, shadow-e2, shadow-e3)
- Typography hierarchy
- Dark mode compatibility
- Contrast ratios (WCAG AA: 4.5:1 minimum)

### When to Use
- Creating new UI components
- Refactoring existing components
- Adding new color variants
- Implementing responsive layouts
- Dark mode implementation

### Prompt Template

```markdown
Launch QDS Compliance Auditor sub-agent:

**Task:** Audit <component/page> for QDS v1.0 compliance

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/qds-audit-<component>.md`
   - Current QDS token usage
   - Non-compliant patterns found
   - Missing semantic tokens
   - Contrast ratio violations
   - Dark mode issues

2. **Implementation Plan** → `plans/qds-fixes.md`
   - File paths to modify
   - Token replacements (before/after)
   - Spacing adjustments
   - Shadow corrections
   - Dark mode additions
   - Priority order (high/medium/low)

3. **Update Decisions** in `context.md`
   - QDS compliance approach
   - Token choices & rationale
   - Trade-offs (if any)

**Checklist:**
- [ ] All colors use semantic tokens (no hardcoded hex)
- [ ] Spacing follows 4pt grid (gap-1, gap-2, gap-4, etc.)
- [ ] Radius uses QDS scale (rounded-md, rounded-lg, etc.)
- [ ] Shadows use QDS elevation (shadow-e1/e2/e3)
- [ ] Text contrast ≥ 4.5:1 (AA standard)
- [ ] Dark mode tokens defined
- [ ] Hover/focus/disabled states use QDS tokens
- [ ] No inline styles or arbitrary values

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/qds-fixes.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch QDS Compliance Auditor sub-agent:

Task: Audit ThreadCard component for QDS v1.0 compliance

Read: doccloud/tasks/thread-card-refactor/context.md

Check: Color tokens, spacing, shadows, dark mode, contrast ratios

Deliver: research/qds-audit-thread-card.md, plans/qds-fixes.md
```

---

## 2. Accessibility Validator

### Specialty
Validates WCAG 2.2 Level AA compliance for all interactive elements and user flows.

### Expertise
- Semantic HTML structure
- ARIA attributes (labels, roles, live regions)
- Keyboard navigation (Tab, Shift+Tab, Esc, Enter, Space)
- Focus management (visible focus rings, focus traps)
- Screen reader compatibility
- Color contrast (4.5:1 text, 3:1 UI components)
- Form accessibility
- Error messaging
- Skip links and landmarks

### When to Use
- Creating forms or interactive elements
- Building modals/dialogs/popovers
- Implementing navigation
- Adding keyboard shortcuts
- Creating dynamic content
- Pre-deployment audits

### Prompt Template

```markdown
Launch Accessibility Validator sub-agent:

**Task:** Validate <component/page> for WCAG 2.2 AA compliance

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/a11y-audit-<component>.md`
   - Semantic HTML structure analysis
   - ARIA attributes present/missing
   - Keyboard navigation flow
   - Focus management issues
   - Color contrast violations
   - Screen reader compatibility
   - Error states & messaging

2. **Implementation Plan** → `plans/a11y-fixes.md`
   - File paths to modify
   - Semantic HTML changes
   - ARIA attributes to add
   - Keyboard handlers needed
   - Focus management logic
   - Contrast improvements
   - Test scenarios for each fix
   - Priority order (critical/high/medium)

3. **Update Decisions** in `context.md`
   - A11y approach & patterns
   - ARIA strategy
   - Keyboard navigation design

**Checklist:**
- [ ] Semantic HTML elements used (nav, main, aside, etc.)
- [ ] Interactive elements have ARIA labels
- [ ] Keyboard navigation works (Tab, Esc, Enter)
- [ ] Focus indicators visible (4.5:1 contrast)
- [ ] Focus trap in modals/dialogs
- [ ] Error messages announced to screen readers
- [ ] Color not sole indicator of state
- [ ] Text contrast ≥ 4.5:1, UI ≥ 3:1
- [ ] Skip links for navigation
- [ ] Landmarks defined (role attributes)

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/a11y-fixes.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Accessibility Validator sub-agent:

Task: Validate AskQuestionModal for WCAG 2.2 AA compliance

Read: doccloud/tasks/ask-modal-a11y/context.md

Check: Focus trap, ARIA labels, keyboard nav, error handling

Deliver: research/a11y-audit-ask-modal.md, plans/a11y-fixes.md
```

---

## 3. Component Architect

### Specialty
Reviews and designs component architecture for reusability, composability, and props-driven patterns.

### Expertise
- Props-driven design (no hardcoded data)
- Component composition (shadcn/ui + Radix)
- State management (local vs lifted vs global)
- Event handling patterns (callbacks vs context)
- TypeScript interfaces (strict typing)
- Component size limits (<200 LoC)
- Render optimization (memo, useMemo, useCallback)
- Variant patterns (className composition)

### When to Use
- Designing new components
- Refactoring existing components
- Breaking down large components
- Creating component libraries
- Improving reusability
- Performance optimization

### Prompt Template

```markdown
Launch Component Architect sub-agent:

**Task:** Design/review <component> architecture

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/component-patterns-<name>.md`
   - Existing similar components
   - shadcn/ui primitives available
   - Composition opportunities
   - State requirements (local vs lifted)
   - Reusability potential
   - Performance considerations

2. **Implementation Plan** → `plans/component-design.md`
   - Component hierarchy (parent/children)
   - Props interface (TypeScript)
   - State management approach
   - Event handlers (callbacks)
   - Variant patterns (className)
   - Composition strategy
   - File paths (create/modify)
   - Test scenarios
   - Examples of usage

3. **Update Decisions** in `context.md`
   - Component architecture rationale
   - Composition vs monolith choice
   - State management strategy

**Checklist:**
- [ ] Props-driven (all data via props)
- [ ] No hardcoded values
- [ ] TypeScript interface for props
- [ ] Event handlers via callbacks
- [ ] Component <200 LoC
- [ ] Uses shadcn/ui primitives when possible
- [ ] Composable (can combine with others)
- [ ] Accessible (semantic HTML + ARIA)
- [ ] Responsive design considered
- [ ] Memoization if needed

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/component-design.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Component Architect sub-agent:

Task: Design SimilarQuestionsPanel component for /ask page

Read: doccloud/tasks/ask-similar-panel/context.md

Consider: Props interface, loading states, empty states, composition

Deliver: research/component-patterns-similar.md, plans/component-design.md
```

---

## 4. Mock API Designer

### Specialty
Plans mock API changes while maintaining contract stability for future backend integration.

### Expertise
- API contract design (REST patterns)
- TypeScript interface design
- Mock data patterns (deterministic, realistic)
- Network delay simulation
- React Query integration
- Query key design
- Invalidation strategies
- Error handling patterns
- Data hydration (author objects, relations)

### When to Use
- Adding new API endpoints
- Modifying existing endpoints
- Creating new data models
- Changing React Query hooks
- Updating query invalidation
- Designing error states

### Prompt Template

```markdown
Launch Mock API Designer sub-agent:

**Task:** Design mock API for <feature>

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/api-patterns-<feature>.md`
   - Existing API patterns in lib/api/client.ts
   - Similar endpoints & data models
   - React Query hook patterns
   - Query key conventions
   - Invalidation strategies
   - Mock data requirements

2. **Implementation Plan** → `plans/api-design.md`
   - New/modified TypeScript interfaces (lib/models/types.ts)
   - API methods (lib/api/client.ts)
     - Method signatures
     - Return types
     - Delay timings
     - Error cases
   - React Query hooks (lib/api/hooks.ts)
     - Hook names
     - Query keys
     - Invalidation logic
   - Mock data (mocks/*.json)
     - Data structure
     - Seed examples
   - File paths (exact locations)
   - Test scenarios
   - Backend integration notes

3. **Update Decisions** in `context.md`
   - API design rationale
   - Data model choices
   - Query key strategy

**Checklist:**
- [ ] TypeScript interfaces defined
- [ ] API method signatures clear
- [ ] Network delays realistic (200-500ms std, 800ms AI)
- [ ] Error cases handled
- [ ] React Query hook follows pattern
- [ ] Query keys consistent
- [ ] Invalidation logic correct
- [ ] Mock data deterministic
- [ ] Contract stable (backend-ready)
- [ ] Hydration strategy defined

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/api-design.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Mock API Designer sub-agent:

Task: Design API for thread bookmarking feature

Read: doccloud/tasks/thread-bookmarks/context.md

Consider: Data model, API methods, hooks, invalidation, mock data

Deliver: research/api-patterns-bookmarks.md, plans/api-design.md
```

---

## 5. React Query Strategist

### Specialty
Optimizes data fetching, caching, mutations, and invalidation with React Query (TanStack Query).

### Expertise
- Query key design (hierarchical, consistent)
- Cache invalidation strategies
- Optimistic updates
- Mutation patterns
- Stale time & cache time configuration
- Refetch strategies
- Error handling & retry logic
- Dependent queries
- Infinite queries (pagination)
- Prefetching

### When to Use
- Optimizing data fetching
- Implementing mutations
- Fixing stale data issues
- Adding optimistic updates
- Improving perceived performance
- Debugging cache issues

### Prompt Template

```markdown
Launch React Query Strategist sub-agent:

**Task:** Optimize React Query usage for <feature>

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/react-query-patterns.md`
   - Current query key structure
   - Existing invalidation patterns
   - Cache configuration
   - Mutation patterns
   - Optimization opportunities
   - Performance bottlenecks

2. **Implementation Plan** → `plans/react-query-optimization.md`
   - Query key refactoring (if needed)
   - Invalidation strategy
   - Optimistic update logic
   - Mutation error handling
   - Stale time configuration
   - Prefetching opportunities
   - Dependent query chains
   - File paths (lib/api/hooks.ts)
   - Test scenarios
   - Before/after performance notes

3. **Update Decisions** in `context.md`
   - React Query strategy
   - Invalidation approach
   - Optimistic update rationale

**Checklist:**
- [ ] Query keys hierarchical & consistent
- [ ] Invalidation targets correct queries
- [ ] Mutations invalidate related queries
- [ ] Optimistic updates where appropriate
- [ ] Error handling for mutations
- [ ] Retry logic configured
- [ ] Stale time reasonable
- [ ] No unnecessary refetches
- [ ] Dependent queries ordered correctly
- [ ] Prefetching considered

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/react-query-optimization.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch React Query Strategist sub-agent:

Task: Optimize thread list updates after posting reply

Read: doccloud/tasks/thread-list-update/context.md

Consider: Invalidation, optimistic updates, query keys

Deliver: research/react-query-patterns.md, plans/react-query-optimization.md
```

---

## 6. Type Safety Guardian

### Specialty
Enforces TypeScript strict mode best practices and type safety throughout the codebase.

### Expertise
- TypeScript strict mode compliance
- No `any` types (use `unknown` when needed)
- Type-only imports (`import type`)
- Interface vs Type design
- Discriminated unions
- Type guards & narrowing
- Generic constraints
- Utility types (Pick, Omit, Partial, etc.)
- Async type safety
- React prop types

### When to Use
- Adding new type definitions
- Refactoring types
- Fixing type errors
- Improving type inference
- Creating generic components
- Type safety audits

### Prompt Template

```markdown
Launch Type Safety Guardian sub-agent:

**Task:** Review/design types for <feature>

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/type-patterns-<feature>.md`
   - Existing type definitions
   - Related interfaces
   - Type import patterns
   - Common type utilities used
   - Type safety issues found
   - `any` usage (violations)

2. **Implementation Plan** → `plans/type-design.md`
   - New/modified interfaces (lib/models/types.ts)
   - Type-only imports to add
   - `any` → specific type replacements
   - Type guards needed
   - Generic constraints
   - Discriminated unions
   - Utility type usage
   - File paths to modify
   - Type test scenarios

3. **Update Decisions** in `context.md`
   - Type design rationale
   - Interface vs Type choice
   - Generic strategy

**Checklist:**
- [ ] No `any` types (use `unknown` or specific)
- [ ] Type-only imports used (`import type`)
- [ ] Interfaces for objects, Types for unions
- [ ] Discriminated unions for variants
- [ ] Type guards for narrowing
- [ ] Generics have constraints
- [ ] Utility types used appropriately
- [ ] Async types correct (Promise<T>)
- [ ] React prop types complete
- [ ] Strict mode compliant

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/type-design.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Type Safety Guardian sub-agent:

Task: Design types for notification system

Read: doccloud/tasks/notifications/context.md

Consider: Discriminated unions, type guards, strict mode

Deliver: research/type-patterns-notifications.md, plans/type-design.md
```

---

## 7. Bundle Optimizer

### Specialty
Analyzes and optimizes bundle size through code splitting, lazy loading, and tree-shaking.

### Expertise
- Next.js code splitting strategies
- Dynamic imports (`next/dynamic`)
- Route-based splitting
- Component lazy loading
- Tree-shaking analysis
- Dependency audit
- CSS optimization
- Image optimization
- Bundle analyzer usage
- Webpack bundle composition

### When to Use
- Bundle size >200KB per route
- Slow initial page load
- Large component libraries
- Adding heavy dependencies
- Pre-deployment optimization
- Performance audits

### Prompt Template

```markdown
Launch Bundle Optimizer sub-agent:

**Task:** Analyze and optimize bundle size for <route/component>

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/bundle-analysis-<route>.md`
   - Current bundle size (per route)
   - Largest dependencies
   - Code splitting opportunities
   - Lazy loading candidates
   - Tree-shaking inefficiencies
   - CSS bloat
   - Image optimization needs
   - Bundle analyzer output

2. **Implementation Plan** → `plans/bundle-optimization.md`
   - Dynamic import locations
   - Route splitting strategy
   - Component lazy loading
   - Dependency replacements (lighter alternatives)
   - CSS optimization
   - Image optimization
   - File paths to modify
   - Expected size reduction
   - Performance impact

3. **Update Decisions** in `context.md`
   - Bundle optimization strategy
   - Trade-offs (if any)
   - Target bundle size

**Checklist:**
- [ ] All routes <200KB
- [ ] Heavy components lazy loaded
- [ ] Dynamic imports used appropriately
- [ ] Dependencies tree-shakeable
- [ ] CSS optimized (no duplicates)
- [ ] Images optimized (next/image)
- [ ] Code splitting at route level
- [ ] Third-party bundles minimized
- [ ] Lighthouse score >90
- [ ] No circular dependencies

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/bundle-optimization.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Bundle Optimizer sub-agent:

Task: Optimize /instructor/dashboard bundle (currently 250KB)

Read: doccloud/tasks/dashboard-bundle-opt/context.md

Analyze: Dependencies, code splitting, lazy loading opportunities

Deliver: research/bundle-analysis-dashboard.md, plans/bundle-optimization.md
```

---

## 8. Integration Readiness Checker

### Specialty
Validates that the frontend is ready for backend integration (mock → real API swap).

### Expertise
- API client abstraction patterns
- Environment variable configuration
- Authentication hook points
- Error boundary design
- Loading state patterns
- Environment detection
- CORS handling
- Backend contract validation
- Migration path planning

### When to Use
- Preparing for backend integration
- Pre-launch readiness check
- API contract validation
- Environment configuration
- Migration planning

### Prompt Template

```markdown
Launch Integration Readiness Checker sub-agent:

**Task:** Validate backend integration readiness for <feature/app>

**Read first:** doccloud/tasks/<slug>/context.md

**Deliverables:**
1. **Research** → `research/integration-readiness.md`
   - Current mock API patterns
   - API client abstraction quality
   - Environment variable usage
   - Authentication hook points
   - Error handling coverage
   - Loading state patterns
   - Backend contract assumptions
   - Breaking points (hard dependencies)

2. **Implementation Plan** → `plans/backend-integration.md`
   - Environment variables needed
   - API client modifications (lib/api/client.ts)
   - Authentication integration points
   - Error boundary additions
   - Loading state improvements
   - CORS configuration notes
   - Migration steps (ordered)
   - Testing strategy
   - Rollback plan

3. **Update Decisions** in `context.md`
   - Integration strategy
   - Environment config approach
   - Migration timeline

**Checklist:**
- [ ] API client fully abstracted
- [ ] No direct mock data imports in components
- [ ] Environment variables documented
- [ ] Authentication hook points identified
- [ ] Error boundaries in place
- [ ] Loading states handled
- [ ] Backend contract documented
- [ ] Migration path clear
- [ ] Testing strategy defined
- [ ] Rollback plan exists

**Rules:** No code edits. Planning only.

**Reply:** "I wrote plans/backend-integration.md. Read it before proceeding." + ≤10 bullets
```

### Example Usage

```
Launch Integration Readiness Checker sub-agent:

Task: Validate entire app for backend integration

Read: doccloud/tasks/backend-swap-prep/context.md

Check: API abstraction, env config, auth hooks, error handling

Deliver: research/integration-readiness.md, plans/backend-integration.md
```

---

## Agent Selection Guide

### By Development Phase

**Planning Phase:**
- Component Architect (new features)
- Mock API Designer (new endpoints)
- Type Safety Guardian (data models)

**Implementation Phase:**
- QDS Compliance Auditor (styling)
- Accessibility Validator (forms, navigation)
- React Query Strategist (data fetching)

**Optimization Phase:**
- Bundle Optimizer (performance)
- React Query Strategist (caching)
- Type Safety Guardian (type errors)

**Pre-Deployment:**
- Accessibility Validator (full audit)
- QDS Compliance Auditor (design review)
- Bundle Optimizer (size check)
- Integration Readiness Checker (backend prep)

### By Task Type

**UI Component:**
1. Component Architect (design)
2. QDS Compliance Auditor (styling)
3. Accessibility Validator (a11y)

**Data Feature:**
1. Mock API Designer (endpoints)
2. Type Safety Guardian (types)
3. React Query Strategist (hooks)

**Performance Issue:**
1. Bundle Optimizer (size)
2. React Query Strategist (caching)

**Pre-Launch:**
1. Accessibility Validator (WCAG audit)
2. Bundle Optimizer (performance)
3. Integration Readiness Checker (backend prep)

---

## Best Practices

### When to Use Multiple Agents

**Parallel (same message):**
- Component Architect + QDS Auditor (new UI feature)
- Type Safety Guardian + Mock API Designer (new data model)
- Accessibility Validator + QDS Auditor (pre-deployment audit)

**Sequential:**
1. Component Architect → QDS Auditor → Accessibility Validator
2. Mock API Designer → Type Safety Guardian → React Query Strategist
3. Bundle Optimizer → Integration Readiness Checker

### Agent Communication

Agents can reference each other's output:
```markdown
Launch QDS Compliance Auditor:

Task: Audit component designed by Component Architect

Read:
- doccloud/tasks/<slug>/context.md
- doccloud/tasks/<slug>/plans/component-design.md

Validate: QDS compliance of proposed component
```

### Custom Agents

Create project-specific agents by copying template:
1. Define specialty
2. List expertise
3. Create prompt template
4. Add to this document

---

## Metrics

Track agent effectiveness:
- **Plans followed** (% implementation matches plan)
- **Issues prevented** (violations caught pre-implementation)
- **Time saved** (vs. trial-and-error)
- **Quality improvement** (a11y scores, bundle size, etc.)

---

**Remember:** All agents follow the **planning-only rule**. They research, design, and document—but never edit code. The parent session executes all changes.

*Updated: 2025-10-04*

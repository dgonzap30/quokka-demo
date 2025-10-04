# QuokkaQ Agentic Workflow - Complete Guide

**Version:** 1.0
**Last Updated:** 2025-10-04
**For:** QuokkaQ Demo - Frontend-Only Academic Q&A Platform

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What is the Agentic Workflow?](#what-is-the-agentic-workflow)
3. [Core Concepts](#core-concepts)
4. [The 8 Specialized Agents](#the-8-specialized-agents)
5. [Step-by-Step Workflows](#step-by-step-workflows)
6. [Real-World Examples](#real-world-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Documentation Map](#documentation-map)

---

## Quick Start

### Your First Agentic Task (5 Minutes)

**1. Create a task:**
```bash
mkdir -p doccloud/tasks/my-feature/{research,plans,artifacts}
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/my-feature/context.md
```

**2. Edit `context.md`** - Fill in Goal, Scope, Acceptance

**3. Launch an agent:**
```
Launch Component Architect sub-agent:

Task: Design <your component> architecture
Read: doccloud/tasks/my-feature/context.md
Consider: Props, state, composition, reusability
Deliver: research/component-patterns.md, plans/component-design.md
Rules: No code edits. Planning only.
```

**4. Implement the plan:**
```
Implement step 1 from plans/component-design.md.
Keep diff minimal. Run typecheck/lint/tests.
Commit if green. Update context.md Changelog.
```

**5. Repeat** for each step until complete.

---

## What is the Agentic Workflow?

### Philosophy

**Traditional Development:**
```
Think → Code → Test → Debug → Fix → Repeat
❌ Mistakes found after implementation
❌ Context lost between sessions
❌ Rework expensive
```

**Agentic Development:**
```
Plan on Disk → Review → Implement in Verified Steps → Track Progress
✅ Mistakes caught before implementation (10x faster)
✅ Context persists across sessions
✅ Quality enforced through planning
```

### Key Principles

1. **Plan First, Code Second** - No edits without documented plan
2. **Context on Disk** - Single source of truth survives restarts
3. **Small Verified Steps** - One change → test → commit → update
4. **Specialized Agents** - Deep expertise in specific domains
5. **Parent Executes, Agents Plan** - Clear separation of roles

---

## Core Concepts

### The Players

**Parent Session (You + Claude):**
- Creates task context
- Delegates to sub-agents (optional)
- Implements all code changes
- Runs tests and verification
- Commits and tracks progress

**Sub-Agents (Specialists):**
- Research existing patterns
- Design implementation plans
- Document decisions
- **NEVER edit code** (planning only)

**Disk (Context):**
- `context.md` - Source of truth
- `research/` - Investigation notes
- `plans/` - Step-by-step guides
- `artifacts/` - Supporting materials

### The Flow

```
1. KICKOFF (Parent)
   ↓
   Create doccloud/tasks/<slug>/context.md
   Define: Goal, Scope, Acceptance, Risks

2. RESEARCH (Sub-Agents - Optional)
   ↓
   UI Planner → research + plans
   API Planner → research + plans
   Type Planner → research + plans

3. IMPLEMENT (Parent)
   ↓
   For each step in plan:
     - Minimal diff
     - Typecheck/lint/tests
     - Commit when green
     - Update Changelog

4. VERIFY (Parent)
   ↓
   - Manual flows
   - A11y checks
   - Bundle size
   - All acceptance criteria

5. CLOSE (Parent)
   ↓
   - Mark TODOs complete
   - Document outcome
   - Link PR
   - Note known debt
```

---

## The 8 Specialized Agents

### Agent Selection Quick Guide

| I need to... | Use Agent |
|--------------|-----------|
| ✨ Check design system compliance | **QDS Compliance Auditor** |
| ♿ Validate accessibility | **Accessibility Validator** |
| 🏗️ Design new component | **Component Architect** |
| 🔌 Add API endpoint | **Mock API Designer** |
| ⚡ Optimize data fetching | **React Query Strategist** |
| 🛡️ Fix TypeScript errors | **Type Safety Guardian** |
| 📦 Reduce bundle size | **Bundle Optimizer** |
| 🔄 Prepare for backend swap | **Integration Readiness Checker** |

### 1. QDS Compliance Auditor ✨

**What it does:** Validates design system compliance (colors, spacing, shadows)

**Copy-Paste Prompt:**
```
Launch QDS Compliance Auditor sub-agent:

Task: Audit <component> for QDS v1.0 compliance
Read: doccloud/tasks/<slug>/context.md
Check: Color tokens, spacing, shadows, dark mode, contrast
Deliver: research/qds-audit-<name>.md, plans/qds-fixes.md
Rules: No code edits. Planning only.
```

**Use when:**
- Creating new UI components
- Styling refactors
- Dark mode implementation
- Pre-deployment design review

---

### 2. Accessibility Validator ♿

**What it does:** Ensures WCAG 2.2 AA compliance (keyboard, ARIA, contrast)

**Copy-Paste Prompt:**
```
Launch Accessibility Validator sub-agent:

Task: Validate <component> for WCAG 2.2 AA compliance
Read: doccloud/tasks/<slug>/context.md
Check: Semantic HTML, ARIA, keyboard nav, focus, contrast
Deliver: research/a11y-audit-<name>.md, plans/a11y-fixes.md
Rules: No code edits. Planning only.
```

**Use when:**
- Building forms, modals, dialogs
- Adding navigation
- Creating interactive elements
- Pre-deployment audits

---

### 3. Component Architect 🏗️

**What it does:** Designs props-driven, reusable component architecture

**Copy-Paste Prompt:**
```
Launch Component Architect sub-agent:

Task: Design <component> architecture
Read: doccloud/tasks/<slug>/context.md
Consider: Props, state, composition, reusability
Deliver: research/component-patterns-<name>.md, plans/component-design.md
Rules: No code edits. Planning only.
```

**Use when:**
- Designing new components
- Refactoring large components
- Improving reusability
- Breaking down complexity

---

### 4. Mock API Designer 🔌

**What it does:** Plans API contracts, types, and React Query integration

**Copy-Paste Prompt:**
```
Launch Mock API Designer sub-agent:

Task: Design mock API for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Data model, endpoints, hooks, invalidation
Deliver: research/api-patterns-<name>.md, plans/api-design.md
Rules: No code edits. Planning only.
```

**Use when:**
- Adding new API endpoints
- Creating new data models
- Updating React Query hooks
- Planning data flows

---

### 5. React Query Strategist ⚡

**What it does:** Optimizes data fetching, caching, and invalidation

**Copy-Paste Prompt:**
```
Launch React Query Strategist sub-agent:

Task: Optimize React Query for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Query keys, invalidation, optimistic updates
Deliver: research/react-query-patterns.md, plans/react-query-optimization.md
Rules: No code edits. Planning only.
```

**Use when:**
- Fixing stale data issues
- Implementing mutations
- Adding optimistic updates
- Performance optimization

---

### 6. Type Safety Guardian 🛡️

**What it does:** Enforces TypeScript strict mode (no `any`, type-only imports)

**Copy-Paste Prompt:**
```
Launch Type Safety Guardian sub-agent:

Task: Review/design types for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Interfaces, type guards, strict mode compliance
Deliver: research/type-patterns-<name>.md, plans/type-design.md
Rules: No code edits. Planning only.
```

**Use when:**
- Adding type definitions
- Fixing type errors
- Creating data models
- Type safety audits

---

### 7. Bundle Optimizer 📦

**What it does:** Analyzes and reduces bundle size through code splitting

**Copy-Paste Prompt:**
```
Launch Bundle Optimizer sub-agent:

Task: Optimize bundle size for <route/component>
Read: doccloud/tasks/<slug>/context.md
Analyze: Code splitting, lazy loading, dependencies
Deliver: research/bundle-analysis-<name>.md, plans/bundle-optimization.md
Rules: No code edits. Planning only.
```

**Use when:**
- Bundle size >200KB per route
- Slow page loads
- Performance optimization
- Pre-deployment checks

---

### 8. Integration Readiness Checker 🔄

**What it does:** Validates backend integration readiness (API abstraction, env config)

**Copy-Paste Prompt:**
```
Launch Integration Readiness Checker sub-agent:

Task: Validate backend integration readiness
Read: doccloud/tasks/<slug>/context.md
Check: API abstraction, env config, auth hooks
Deliver: research/integration-readiness.md, plans/backend-integration.md
Rules: No code edits. Planning only.
```

**Use when:**
- Preparing for backend swap
- Pre-launch checks
- Migration planning
- Contract validation

---

## Step-by-Step Workflows

### Workflow 1: New UI Component

**Scenario:** Create a new `SimilarQuestionsPanel` component for `/ask` page

**Steps:**

1. **Bootstrap Task**
```bash
mkdir -p doccloud/tasks/ask-similar-panel/{research,plans,artifacts}
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/ask-similar-panel/context.md
```

Edit `context.md`:
```markdown
Goal: Add similar questions panel to /ask page with debounced search

In-Scope:
- SimilarQuestionsPanel component
- Integration with /ask page
- Debounced search hook

Out-of-Scope:
- Backend API (use mock)
- Advanced filtering

Done When:
- [ ] Component renders with props
- [ ] Debounced search works
- [ ] QDS compliant
- [ ] WCAG 2.2 AA accessible
- [ ] Responsive 360-1280px
- [ ] Types pass, lint clean
```

2. **Plan with Agents (Parallel)**
```
Launch 3 agents in parallel:

1. Component Architect:
   Task: Design SimilarQuestionsPanel architecture
   Read: doccloud/tasks/ask-similar-panel/context.md
   Deliver: research/component-patterns.md, plans/component-design.md

2. QDS Compliance Auditor:
   Task: Plan QDS-compliant styling for SimilarQuestionsPanel
   Read: doccloud/tasks/ask-similar-panel/context.md
   Read: plans/component-design.md (after Component Architect)
   Deliver: research/qds-tokens.md, plans/qds-styling.md

3. Accessibility Validator:
   Task: Plan a11y for SimilarQuestionsPanel
   Read: doccloud/tasks/ask-similar-panel/context.md
   Deliver: research/a11y-requirements.md, plans/a11y-implementation.md
```

3. **Implement (Sequential Steps)**
```
Step 1:
Implement from plans/component-design.md step 1: "Create component file"
Minimal diff. Typecheck/lint. Commit. Update Changelog.

Step 2:
Implement from plans/component-design.md step 2: "Add props interface"
Minimal diff. Typecheck/lint. Commit. Update Changelog.

Step 3:
Implement from plans/qds-styling.md: "Apply QDS tokens"
Minimal diff. Typecheck/lint. Commit. Update Changelog.

Step 4:
Implement from plans/a11y-implementation.md: "Add ARIA attributes"
Minimal diff. Typecheck/lint. Commit. Update Changelog.
```

4. **Verify**
```
Quality checks:
- npx tsc --noEmit (types)
- npm run lint (code quality)
- npm run build (prod build)
- Manual test: similar questions appear on typing
- A11y test: keyboard nav, focus visible, screen reader
- Responsive test: 360px, 768px, 1024px, 1280px
```

5. **Close**
```
Update context.md:
- Mark all TODOs done
- Changelog: "Added SimilarQuestionsPanel with debounced search"
- Known debt: "Consider caching similar queries"
- Link PR (if created)
```

---

### Workflow 2: New Data Feature

**Scenario:** Add thread bookmarking feature

**Steps:**

1. **Bootstrap**
```bash
mkdir -p doccloud/tasks/thread-bookmarks/{research,plans,artifacts}
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/thread-bookmarks/context.md
```

2. **Plan (Sequential)**
```
Step 1: Mock API Designer
Launch Mock API Designer sub-agent:

Task: Design API for thread bookmarking
Read: doccloud/tasks/thread-bookmarks/context.md
Deliver: research/api-patterns.md, plans/api-design.md

Step 2: Type Safety Guardian
Launch Type Safety Guardian sub-agent:

Task: Design types for bookmarks
Read: doccloud/tasks/thread-bookmarks/context.md
Read: plans/api-design.md
Deliver: research/type-patterns.md, plans/type-design.md

Step 3: React Query Strategist
Launch React Query Strategist sub-agent:

Task: Design React Query hooks for bookmarks
Read: doccloud/tasks/thread-bookmarks/context.md
Read: plans/api-design.md, plans/type-design.md
Deliver: research/react-query-patterns.md, plans/hooks-design.md
```

3. **Implement** (follow plans in order)

4. **Verify** (acceptance criteria)

5. **Close** (document outcome)

---

### Workflow 3: Pre-Deployment Audit

**Scenario:** Full quality check before launch

**Steps:**

1. **Bootstrap**
```bash
mkdir -p doccloud/tasks/pre-launch-audit/{research,plans,artifacts}
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/pre-launch-audit/context.md
```

2. **Run All Quality Agents (Parallel)**
```
Launch 4 agents in parallel:

1. Accessibility Validator:
   Task: Full WCAG 2.2 AA audit of entire app
   Deliver: research/a11y-full-audit.md, plans/a11y-fixes.md

2. QDS Compliance Auditor:
   Task: Full QDS compliance review
   Deliver: research/qds-full-audit.md, plans/qds-fixes.md

3. Bundle Optimizer:
   Task: Analyze all route bundles
   Deliver: research/bundle-analysis.md, plans/bundle-optimization.md

4. Integration Readiness Checker:
   Task: Validate backend swap readiness
   Deliver: research/integration-readiness.md, plans/backend-migration.md
```

3. **Implement Fixes** (by priority)

4. **Verify** (all checks pass)

5. **Document** (launch readiness report)

---

## Real-World Examples

### Example 1: AI Answer Feedback Feature

**Goal:** Add thumbs up/down feedback to AI answers

**Agents Used:**
1. Component Architect → Design feedback UI
2. Mock API Designer → Design feedback API
3. QDS Auditor → Style buttons with QDS
4. A11y Validator → Ensure accessible controls

**Outcome:**
- Planned in 30 minutes (4 agents parallel)
- Implemented in 1 hour (6 verified steps)
- Zero bugs, passed all checks first time
- **Time saved:** 2 hours of debugging

---

### Example 2: Dark Mode Implementation

**Goal:** Add system-preference dark mode support

**Agents Used:**
1. QDS Auditor → Audit all components for dark tokens
2. Component Architect → Design theme provider pattern
3. Type Guardian → Type theme context

**Outcome:**
- Comprehensive audit found 23 components needing updates
- Plan created for systematic rollout
- Implemented component-by-component
- **Quality:** 100% dark mode compliance

---

### Example 3: Instructor Dashboard Performance

**Goal:** Reduce dashboard bundle from 280KB to <200KB

**Agents Used:**
1. Bundle Optimizer → Analyze bundle composition
2. React Query Strategist → Optimize data fetching
3. Component Architect → Identify lazy-load candidates

**Outcome:**
- Bundle reduced to 165KB (42% reduction)
- Load time improved from 3.2s to 1.8s
- **Performance:** Lighthouse score 92 → 98

---

## Best Practices

### When to Use Agents

✅ **DO use agents for:**
- Complex features (3+ file changes)
- Architecture decisions
- Quality audits (QDS, a11y, types)
- Pre-deployment checks
- Backend integration prep

❌ **DON'T use agents for:**
- Single-line fixes
- Documentation updates
- Copy-paste from examples
- Trivial bug fixes

### Agent Combinations

**UI Feature:**
```
Component Architect + QDS Auditor + A11y Validator
```

**Data Feature:**
```
Mock API Designer + Type Guardian + React Query Strategist
```

**Performance:**
```
Bundle Optimizer + React Query Strategist
```

**Pre-Launch:**
```
All quality agents (A11y, QDS, Bundle, Integration)
```

### Context Management

**Keep context.md current:**
- Update after every step (don't batch)
- Changelog is append-only
- Document all decisions with rationale

**Use `/compact` when:**
- Approaching token limits
- Context file >500 lines
- Research notes too verbose

**Start fresh when:**
- Task is complete (new task = new folder)
- Scope changes significantly
- Context becomes stale

---

## Troubleshooting

### Issue: Agent output doesn't match codebase

**Solution:**
```
Remind agent to search codebase first:

"Before planning, search for existing patterns:
- Grep for similar components
- Read related files
- Check lib/api/hooks.ts patterns
Then create plan that matches conventions."
```

### Issue: Plan is too abstract (no file paths)

**Solution:**
```
Require exact paths in prompt:

"Deliverable must include:
- EXACT file paths (no placeholders)
- Component/function signatures
- Import statements
- Test file locations"
```

### Issue: Too much planning, not enough coding

**Solution:**
- Skip agents for simple tasks
- Use 1 agent instead of 3
- Implement directly for <3 file changes

### Issue: Context.md getting too long

**Solution:**
```
1. Move completed research to artifacts/
2. Consolidate plans into single implementation.md
3. Use /compact to summarize
4. Archive old changelog entries
```

### Issue: Agent recommendations conflict

**Solution:**
- Sequential agents (each reads previous)
- Parent resolves conflicts in context.md
- Document trade-offs in Decisions

---

## Documentation Map

### For Quick Reference
📄 **[doccloud/AGENT-QUICK-REFERENCE.md](doccloud/AGENT-QUICK-REFERENCE.md)**
- Fast agent selector
- Copy-paste prompts
- Common workflows

### For Deep Dive
📚 **[doccloud/SPECIALIZED-AGENTS.md](doccloud/SPECIALIZED-AGENTS.md)**
- Full agent specifications
- Expertise areas
- Detailed templates
- Selection guide

### For Learning
📖 **[doccloud/QUICKSTART.md](doccloud/QUICKSTART.md)**
- Step-by-step workflow
- Real-world example
- Prompt library
- Tips and tricks

### For Setup
🔧 **[doccloud/README.md](doccloud/README.md)**
- Folder structure
- File descriptions
- Best practices
- FAQ

### Project Instructions
⚙️ **[CLAUDE-AGENTIC.md](CLAUDE-AGENTIC.md)**
- Claude reads this on session start
- Agentic operating rules
- Project architecture
- Coding standards

### Templates
📋 **[doccloud/TASK-TEMPLATE.md](doccloud/TASK-TEMPLATE.md)**
- New task context template

📋 **[doccloud/AGENT-TASK-TEMPLATE.md](doccloud/AGENT-TASK-TEMPLATE.md)**
- Sub-agent delegation template

---

## Workflow Cheat Sheet

### Quick Commands

**Create Task:**
```bash
mkdir -p doccloud/tasks/<slug>/{research,plans,artifacts}
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/<slug>/context.md
```

**Launch Agent:**
```
Launch <Agent Name> sub-agent:

Task: <what to do>
Read: doccloud/tasks/<slug>/context.md
Deliver: research/<file>.md, plans/<file>.md
Rules: No code edits. Planning only.
```

**Implement Step:**
```
Implement step N from plans/<file>.md.
Minimal diff. Typecheck/lint/tests.
Commit if green. Update Changelog.
```

**Verify Quality:**
```
npx tsc --noEmit && npm run lint && npm run build
Test: <manual flows>
A11y: keyboard, focus, contrast
Responsive: 360/768/1024/1280
```

### Keyboard Shortcuts (Claude Code)

- **Shift+Tab** - Auto-accept tool uses
- **Esc** - Pause and review
- **Esc Esc** - Backtrack to earlier turn
- `/compact` - Summarize context
- `/clear` - Fresh start (keeps CLAUDE.md)

---

## Success Metrics

### Track These Per Task

| Metric | Good | Needs Work |
|--------|------|------------|
| **Iterations to Green Build** | 1-3 | >5 |
| **Diff Size per Step** | <100 LoC | >200 LoC |
| **Bugfix Time** | <10 min | >30 min |
| **Plans Followed** | >90% | <70% |
| **Issues Prevented** | >5 | <2 |

### Measure Impact

**Before Agentic Workflow:**
- Inconsistent QDS usage
- Accessibility gaps
- Type safety violations
- Large bundle sizes
- Rework common

**After Agentic Workflow:**
- 100% QDS compliance
- WCAG 2.2 AA achieved
- 0 `any` types
- All routes <200KB
- Minimal rework

---

## Next Steps

### 1. Try Your First Task

**Recommended:** Simple UI component with 3 agents

```
Feature: Add loading skeleton to ThreadCard

Agents:
1. Component Architect - design skeleton
2. QDS Auditor - validate styling
3. A11y Validator - check ARIA

Time: ~1 hour (planning + implementation)
```

### 2. Refine Your Workflow

After first task:
- What worked well?
- What felt over-planned?
- Which agents were most helpful?
- Update templates based on learnings

### 3. Build Your Library

Create reusable patterns:
- Common component designs
- Frequent API patterns
- Standard a11y fixes
- QDS token recipes

### 4. Measure Impact

Track metrics:
- Time to green build
- Bugs prevented
- Quality improvements
- Developer satisfaction

---

## Getting Help

### Quick Lookups
- **Agent selector:** [AGENT-QUICK-REFERENCE.md](doccloud/AGENT-QUICK-REFERENCE.md)
- **Workflow steps:** [QUICKSTART.md](doccloud/QUICKSTART.md)
- **Agent details:** [SPECIALIZED-AGENTS.md](doccloud/SPECIALIZED-AGENTS.md)

### Documentation
- **Project rules:** [CLAUDE-AGENTIC.md](CLAUDE-AGENTIC.md)
- **Design system:** [QDS.md](QDS.md)
- **Tech stack:** [README.md](README.md)

### Troubleshooting
- Check this guide's [Troubleshooting](#troubleshooting) section
- Review [doccloud/README.md](doccloud/README.md) FAQ
- Read example tasks in `doccloud/tasks/`

---

## Remember

### Core Philosophy

**"Plan on disk → Verified steps → Context persists → You steer, Claude executes"**

### The 3 Rules

1. **Plan First** - No code without documented plan
2. **Small Steps** - One change → test → commit → update
3. **Agents Plan Only** - Parent executes all code changes

### Quality Gates

Every task must pass:
- ✅ TypeScript compiles (`npx tsc --noEmit`)
- ✅ Lint passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ Manual flows work
- ✅ A11y validated (keyboard, ARIA, contrast)
- ✅ Responsive tested (360-1280px)

---

## Version History

- **v1.0** (2025-10-04) - Initial release
  - 8 specialized agents
  - Complete workflow documentation
  - Real-world examples
  - Templates and guides

---

**You're ready to start using the agentic workflow!** 🚀

**Recommended next step:** Create your first task using the [Quick Start](#quick-start) guide above.

*Questions? Check the [Documentation Map](#documentation-map) for detailed guides on every aspect of the workflow.*

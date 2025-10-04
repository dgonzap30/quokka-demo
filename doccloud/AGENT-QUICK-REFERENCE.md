# Sub-Agent Quick Reference Card

Fast lookup for which specialized agent to use for your task.

---

## Quick Selector

| I need to... | Use Agent |
|--------------|-----------|
| Check design system compliance | **QDS Compliance Auditor** |
| Validate accessibility | **Accessibility Validator** |
| Design new component | **Component Architect** |
| Add API endpoint | **Mock API Designer** |
| Optimize data fetching | **React Query Strategist** |
| Fix TypeScript errors | **Type Safety Guardian** |
| Reduce bundle size | **Bundle Optimizer** |
| Prepare for backend swap | **Integration Readiness Checker** |

---

## Copy-Paste Prompts

### QDS Compliance Auditor
```
Launch QDS Compliance Auditor sub-agent:

Task: Audit <component> for QDS v1.0 compliance
Read: doccloud/tasks/<slug>/context.md
Check: Color tokens, spacing, shadows, dark mode, contrast
Deliver: research/qds-audit-<name>.md, plans/qds-fixes.md
Rules: No code edits. Planning only.
```

### Accessibility Validator
```
Launch Accessibility Validator sub-agent:

Task: Validate <component> for WCAG 2.2 AA compliance
Read: doccloud/tasks/<slug>/context.md
Check: Semantic HTML, ARIA, keyboard nav, focus, contrast
Deliver: research/a11y-audit-<name>.md, plans/a11y-fixes.md
Rules: No code edits. Planning only.
```

### Component Architect
```
Launch Component Architect sub-agent:

Task: Design <component> architecture
Read: doccloud/tasks/<slug>/context.md
Consider: Props, state, composition, reusability
Deliver: research/component-patterns-<name>.md, plans/component-design.md
Rules: No code edits. Planning only.
```

### Mock API Designer
```
Launch Mock API Designer sub-agent:

Task: Design mock API for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Data model, endpoints, hooks, invalidation
Deliver: research/api-patterns-<name>.md, plans/api-design.md
Rules: No code edits. Planning only.
```

### React Query Strategist
```
Launch React Query Strategist sub-agent:

Task: Optimize React Query for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Query keys, invalidation, optimistic updates
Deliver: research/react-query-patterns.md, plans/react-query-optimization.md
Rules: No code edits. Planning only.
```

### Type Safety Guardian
```
Launch Type Safety Guardian sub-agent:

Task: Review/design types for <feature>
Read: doccloud/tasks/<slug>/context.md
Consider: Interfaces, type guards, strict mode compliance
Deliver: research/type-patterns-<name>.md, plans/type-design.md
Rules: No code edits. Planning only.
```

### Bundle Optimizer
```
Launch Bundle Optimizer sub-agent:

Task: Optimize bundle size for <route/component>
Read: doccloud/tasks/<slug>/context.md
Analyze: Code splitting, lazy loading, dependencies
Deliver: research/bundle-analysis-<name>.md, plans/bundle-optimization.md
Rules: No code edits. Planning only.
```

### Integration Readiness Checker
```
Launch Integration Readiness Checker sub-agent:

Task: Validate backend integration readiness
Read: doccloud/tasks/<slug>/context.md
Check: API abstraction, env config, auth hooks
Deliver: research/integration-readiness.md, plans/backend-integration.md
Rules: No code edits. Planning only.
```

---

## Common Workflows

### New UI Component
```
1. Component Architect → Design architecture
2. QDS Compliance Auditor → Validate styling
3. Accessibility Validator → Check a11y
```

### New Data Feature
```
1. Mock API Designer → Design endpoints
2. Type Safety Guardian → Define types
3. React Query Strategist → Optimize hooks
```

### Pre-Deployment
```
1. Accessibility Validator → Full WCAG audit
2. QDS Compliance Auditor → Design review
3. Bundle Optimizer → Performance check
4. Integration Readiness Checker → Backend prep (if applicable)
```

### Performance Issue
```
1. Bundle Optimizer → Analyze size
2. React Query Strategist → Optimize caching
```

### Refactoring
```
1. Component Architect → Review architecture
2. Type Safety Guardian → Audit types
3. QDS Compliance Auditor → Check design compliance
```

---

## Agent Cheat Sheet

| Agent | Key Focus | Output |
|-------|-----------|--------|
| **QDS Auditor** | Color tokens, spacing, shadows | Token replacements |
| **A11y Validator** | ARIA, keyboard, contrast | WCAG fixes |
| **Component Architect** | Props, state, composition | Component design |
| **API Designer** | Endpoints, types, hooks | API spec |
| **React Query** | Keys, invalidation, cache | Query optimization |
| **Type Guardian** | Strict mode, no `any` | Type definitions |
| **Bundle Optimizer** | Size, splitting, lazy loading | Code splitting plan |
| **Integration Checker** | Backend swap readiness | Migration plan |

---

## When NOT to Use Agents

❌ **Simple one-line changes** - Just do it
❌ **Documentation updates** - Write directly
❌ **Trivial bug fixes** - Fix and commit
❌ **Copy-paste from examples** - Implement directly

✅ **Complex features** - Use agents
✅ **Architecture decisions** - Use agents
✅ **Quality audits** - Use agents
✅ **Multi-file changes** - Use agents

---

## Agent Rules Reminder

**All agents MUST:**
- Read `context.md` first
- Save research to `research/`
- Create implementation plan in `plans/`
- Update Decisions in `context.md`
- Reply with file paths + ≤10 bullets
- **NEVER edit code** (planning only)

**All agents MUST NOT:**
- ❌ Edit any code files
- ❌ Create new files (document what to create)
- ❌ Run build/test commands
- ❌ Use placeholders in file paths
- ❌ Skip research phase

---

## Full Documentation

See [SPECIALIZED-AGENTS.md](SPECIALIZED-AGENTS.md) for complete agent specifications, templates, and best practices.

---

*Quick reference v1.0 - Updated 2025-10-04*

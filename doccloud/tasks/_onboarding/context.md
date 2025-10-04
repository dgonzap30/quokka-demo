# Onboarding Task — Agentic Workflow Setup

**Goal:** Set up agentic development workflow structure for QuokkaQ Demo project.

**In-Scope:**
- Create `doccloud/tasks/` folder structure
- Update CLAUDE.md with agentic workflow rules
- Document task lifecycle and templates
- Create example task structure

**Out-of-Scope:**
- Code changes to application
- Backend integration
- New features

**Done When:**
- [x] `doccloud/` folder structure exists
- [x] CLAUDE-AGENTIC.md created with agentic rules
- [x] Task templates created (TASK, AGENT-TASK)
- [x] Workflow documentation complete (README, QUICKSTART)
- [x] Codebase analyzed for agent design
- [x] 8 specialized agents defined with prompts
- [x] Quick reference guide created
- [ ] First real task completed using workflow
- [ ] Workflow validated and refined

---

## Constraints

1. Frontend-only scope maintained
2. No breaking changes to existing mock API
3. All documentation follows existing project style
4. Backwards compatible with current development workflow

---

## Decisions

1. **Folder Structure** (`doccloud/tasks/<slug>/`)
   - `context.md` - canonical plan, constraints, decisions, changelog
   - `research/` - raw notes/sources per agent
   - `plans/` - step plans per agent (implementable)
   - `artifacts/` - diagrams/specs/json drafts

2. **Task Lifecycle**
   - Kickoff (Parent) → Research Plans (Sub-agents) → Implement (Parent) → Verify (Parent) → Integrate (Parent) → Close Task (Parent)

3. **Sub-Agent Rules**
   - Planning/research only, no code edits
   - Must read `context.md` first
   - Save deliverables to `research/` and `plans/`
   - Update Decisions section
   - Reply with file paths + ≤10 bullets

4. **Specialized Agents** (8 total - see `doccloud/SPECIALIZED-AGENTS.md`)
   - **QDS Compliance Auditor** - Design system enforcement
   - **Accessibility Validator** - WCAG 2.2 AA compliance
   - **Component Architect** - Component patterns & reusability
   - **Mock API Designer** - API contract stability
   - **React Query Strategist** - Data fetching optimization
   - **Type Safety Guardian** - TypeScript best practices
   - **Bundle Optimizer** - Performance & code splitting
   - **Integration Readiness Checker** - Backend swap preparation

---

## Risks & Rollback

**Risks:**
- Learning curve for new workflow
- Potential over-documentation for simple tasks
- Context switching between files

**Rollback:**
- Revert to previous CLAUDE.md if workflow doesn't fit
- Keep doccloud/ structure but mark as optional
- All changes are additive, no breaking changes

---

## Related Files

- `/CLAUDE.md` - Main Claude instruction file (to be updated)
- `/README.md` - Project readme (to add workflow section)
- `/QDS.md` - Design system documentation (reference)

---

## Changelog

- `2025-10-04` | [Setup] | Created doccloud folder structure
- `2025-10-04` | [Setup] | Created onboarding context.md
- `2025-10-04` | [Templates] | Created TASK-TEMPLATE.md and AGENT-TASK-TEMPLATE.md
- `2025-10-04` | [Documentation] | Created CLAUDE-AGENTIC.md with enhanced agentic workflow rules
- `2025-10-04` | [Documentation] | Created QUICKSTART.md with step-by-step workflow guide
- `2025-10-04` | [Documentation] | Created doccloud/README.md explaining folder structure and usage
- `2025-10-04` | [Analysis] | Analyzed codebase patterns, challenges, and opportunities
- `2025-10-04` | [Agents] | Created 8 specialized sub-agents with full specifications
- `2025-10-04` | [Documentation] | Created SPECIALIZED-AGENTS.md with agent prompts and usage
- `2025-10-04` | [Documentation] | Created AGENT-QUICK-REFERENCE.md for fast lookup
- `2025-10-04` | [Research] | Documented codebase analysis in research/codebase-analysis.md

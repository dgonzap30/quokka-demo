# Sub-Agent Task Template

Copy this template when delegating to a specialist sub-agent.

---

## Task: [Objective]

**Read first:** `doccloud/tasks/[slug]/context.md`

**Your role:** [UI Planner / AI SDK v5 Planner / Data/API Planner / Custom]

**Deliverables:**

1. **Research notes** → `doccloud/tasks/[slug]/research/[agent]-[topic].md`
   - Findings from codebase search
   - Existing patterns and conventions
   - Technology-specific considerations
   - Sources and references

2. **Implementation plan** → `doccloud/tasks/[slug]/plans/[agent]-plan.md`
   - Exact file paths to modify/create
   - Component/function signatures
   - Test scenarios
   - Risk assessment
   - Step-by-step implementation order

3. **Update Decisions** in `context.md`
   - Add 5-line summary under relevant category
   - Include file paths
   - Note any trade-offs

4. **Reply with:**
   - "I wrote [plan_path]. Read it before proceeding."
   - ≤10 bullet summary of key recommendations
   - No more than 10 lines total

---

## Rules (IMPORTANT)

1. **Do NOT edit code** — planning/research only
2. **Do NOT create new files** — document what should be created
3. **Do NOT run build/test commands** — parent handles that
4. **DO search codebase thoroughly** — understand existing patterns
5. **DO provide exact file paths** — no placeholders
6. **DO consider QDS compliance** — tokens, spacing, accessibility
7. **DO think about testing** — what needs to be tested and how
8. **DO assess risks** — what could break, how to mitigate

---

## Context

**Project:** QuokkaQ Demo — Frontend-Only Academic Q&A
**Stack:** Next.js 15, TypeScript strict, Tailwind v4, shadcn/ui, React Query, Mock API
**Design System:** Quokka Design System (QDS) v1.0
**Philosophy:** Props-driven components, type-safe, no hardcoded values, ready for backend

**Key Constraints:**
- Frontend-only (no real backend)
- In-memory mock API
- QDS compliance mandatory
- WCAG 2.2 AA accessibility
- Responsive design (mobile-first)
- Bundle size <200KB per route

---

## Example Output Structure

### research/ui-plan-sources.md
```markdown
# UI Research for [Feature]

## Existing Patterns
- Found similar component at `components/xyz.tsx`
- Uses shadcn/ui Dialog + Form
- Follows QDS spacing (gap-4, p-6)

## shadcn/ui Components Available
- Dialog, Form, Input, Button, Select
- All support Radix UI primitives

## QDS Tokens to Use
- Colors: --primary, --secondary, --accent
- Spacing: gap-4 (16px), p-6 (24px)
- Radius: rounded-lg (16px)
- Shadow: shadow-e2 (medium elevation)

## Accessibility Considerations
- Need focus trap in modal
- ARIA labels for form fields
- Keyboard navigation (Tab, Esc)
```

### plans/ui-plan.md
```markdown
# UI Implementation Plan for [Feature]

## Files to Modify
1. `components/new-component.tsx` (CREATE)
2. `app/page-name/page.tsx` (EDIT)
3. `lib/api/hooks.ts` (ADD hook)

## Component Signatures

### NewComponent.tsx
```typescript
interface NewComponentProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  error?: string;
}

export function NewComponent({ onSubmit, isLoading, error }: NewComponentProps) {
  // Uses shadcn/ui Dialog + Form
  // QDS tokens for styling
  // Accessible form with ARIA
}
```

## Implementation Steps
1. Create component scaffold with props interface
2. Add shadcn/ui Dialog + Form
3. Wire up form handling with React Hook Form
4. Add loading/error states
5. Apply QDS styling
6. Add accessibility attributes
7. Write component tests

## Tests Needed
- Renders with all prop combinations
- Form validation works
- Submit handler called correctly
- Loading state displays
- Error state displays
- Keyboard navigation
- Focus management

## Risks
- Form validation complexity → use Zod schema
- Modal z-index conflicts → verify with existing modals
- Mobile responsiveness → test at 360px width

## Dependencies
- None (uses existing shadcn/ui)
```

---

## Checklist Before Replying

- [ ] Read `context.md` thoroughly
- [ ] Searched codebase for existing patterns
- [ ] Created research notes with sources
- [ ] Created implementation plan with exact paths
- [ ] Updated Decisions in `context.md`
- [ ] Reply is ≤10 bullets + file path
- [ ] Did NOT edit any code files

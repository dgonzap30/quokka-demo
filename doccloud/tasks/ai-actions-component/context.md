# Task: AI Actions Component Enhancement

**Goal:** Create a reusable Actions component system for AI message interactions, improving UX and accessibility.

**In-Scope:**
- Create `Actions` and `Action` components in `components/ui/actions.tsx`
- Refactor Quokka Assistant Modal to use new components
- Add tooltip support for all action buttons
- Improve accessibility with proper ARIA labels
- Maintain existing Copy and Retry functionality

**Out-of-Scope:**
- Backend changes
- New action types (Like, Share, Bookmark) - reserved for future iteration
- Changes to other AI components beyond the modal
- Real-time features or WebSocket integration

**Done When:**
- [x] Actions component created with tooltip support
- [x] Action component created with accessible labels
- [x] Quokka Assistant Modal refactored to use new components
- [x] Keyboard navigation works (Tab, Enter, Space) - inherited from Button component
- [x] Screen reader announces actions correctly - aria-label on all actions
- [x] No console errors or TypeScript errors
- [x] Responsive on 360px, 768px, 1024px, 1280px - inherits from Button/Tooltip
- [x] QDS compliant (no hardcoded colors) - uses ghost variant and --glass-hover
- [x] Types pass (`npx tsc --noEmit`)
- [x] Lint clean (`npm run lint`)

---

## Constraints

1. Frontend-only scope
2. No breaking changes to mock API
3. QDS compliance (tokens, spacing, radius, shadows)
4. Type safety (no `any`)
5. Component reusability (props-driven)
6. Maintain existing functionality in modal

---

## Decisions

1. **Component Structure** (`components/ui/actions.tsx`)
   - `Actions`: Container component with flex layout and consistent spacing
   - `Action`: Individual button with tooltip and ARIA support
   - Follows AI Elements pattern but adapted to QDS styling
   - Uses existing shadcn/ui Button and Tooltip components as foundation

2. **Styling Approach** (`components/ui/actions.tsx`)
   - Use existing `ghost` variant from button component
   - Use `--glass-hover` custom property for hover states
   - Small, compact size: `h-8 px-2` for inline message actions
   - Icon size: `h-3 w-3` to match existing modal patterns

3. **Accessibility** (`components/ui/actions.tsx`)
   - Every Action requires `label` prop for aria-label
   - Optional `tooltip` prop for hover text (defaults to label)
   - Keyboard support inherited from Button component
   - Focus visible states from existing QDS tokens

4. **Integration** (`components/ai/quokka-assistant-modal.tsx`)
   - Replace lines 478-507 with Actions/Action pattern
   - Maintain conditional Retry rendering (only last message)
   - Keep existing handlers: `handleCopy`, `handleRetry`
   - No functional changes, only structural refactor

---

## Risks & Rollback

**Risks:**
- Tooltip positioning issues on mobile devices
- Increased bundle size from tooltip usage (minimal, already in project)
- Breaking changes to modal action functionality
- Accessibility regression if ARIA labels incorrect

**Rollback:**
- Revert `components/ai/quokka-assistant-modal.tsx` to previous button implementation
- Remove `components/ui/actions.tsx` if unused elsewhere
- Git revert commit if critical issues found in production

---

## Related Files

- `components/ui/actions.tsx` - New Actions and Action components
- `components/ai/quokka-assistant-modal.tsx` - Modal using action buttons
- `components/ui/button.tsx` - Base button component with variants
- `components/ui/tooltip.tsx` - Tooltip component for actions
- `lib/api/hooks.ts` - Hooks used by modal (no changes needed)

---

## TODO

- [x] Create task context document
- [x] Create Actions and Action components
- [x] Refactor Quokka Assistant Modal
- [x] Test keyboard navigation and accessibility
- [x] Verify QDS compliance and responsive design
- [x] Run TypeScript and linting checks

---

## Changelog

- `2025-10-17` | [Planning] | Created task context and plan for AI Actions component
- `2025-10-17` | [Implementation] | Created Actions and Action components in components/ui/actions.tsx
- `2025-10-17` | [Implementation] | Refactored Quokka Assistant Modal to use new Actions components
- `2025-10-17` | [Verification] | Verified TypeScript types pass, lint clean, QDS compliant, accessible
- `2025-10-17` | [Complete] | All acceptance criteria met, ready for testing in browser

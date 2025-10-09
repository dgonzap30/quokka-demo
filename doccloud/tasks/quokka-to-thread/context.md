# Task: Quokka Conversation to Thread

**Goal:** Enable users to convert valuable FloatingQuokka conversations into public threads for class sharing and endorsements.

**In-Scope:**
- Conversion utilities (`lib/utils/conversation-to-thread.ts`)
- ConversationToThreadModal component
- FloatingQuokka integration (button + flow)
- TypeScript types for conversation mapping
- QDS-compliant UI components
- Accessible interaction patterns

**Out-of-Scope:**
- Backend API changes (reuse existing `useCreateThread`)
- Conversation persistence beyond localStorage
- AI summarization (use simple formatting)
- Real-time collaboration features

**Done When:**
- [ ] User can click "Post as Thread" in Quokka chat (min 2 messages)
- [ ] Modal opens with preview of formatted conversation
- [ ] User can edit title, content, tags before posting
- [ ] Thread is created successfully using existing API
- [ ] User navigates to new thread or sees confirmation
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Manual flow tested end-to-end

---

## Constraints

1. Frontend-only scope
2. No breaking changes to mock API (reuse `useCreateThread`)
3. QDS compliance (tokens, spacing, radius, shadows)
4. Type safety (no `any`)
5. Component reusability (props-driven)
6. Minimum 2 messages to enable "Post as Thread"
7. Conversation formatting must be readable and maintainable

---

## Decisions

### Component Architect - UI/UX Design (2025-10-08)

Single-dialog modal (ConversationToThreadModal) follows AskQuestionModal pattern. Auto-generates title from first user message, formats conversation as "Role: Content" plain text. Button in FloatingQuokka footer (conditional: messages.length >= 2). Reuses useCreateThread hook, navigates to new thread on success. Glass panel styling, responsive (max-w-3xl), accessible (focus trap, ARIA).

**Files:** components/course/conversation-to-thread-modal.tsx (new), components/course/floating-quokka.tsx (modify), lib/utils/conversation-to-thread.ts (new)
**Details:** doccloud/tasks/quokka-to-thread/plans/component-design.md

### Type Safety Guardian - Type Design (2025-10-08)

Export Message interface from types.ts (remove local definition), add 5 conversion interfaces (ConversationMetadata, FormattedMessage, ConversationToThreadInput, ConversationToThreadResult), 2 type guards (isValidConversation, isMessage). All conversion utilities in lib/utils/conversation-to-thread.ts with explicit types, zero any usage, import type for type-only imports.

**Files:** lib/models/types.ts, lib/utils/conversation-to-thread.ts (new), components/course/floating-quokka.tsx
**Details:** doccloud/tasks/quokka-to-thread/plans/type-design.md

### QDS Compliance Auditor - Styling Design (2025-10-08)

FloatingQuokka is QDS exemplar (10/10). Reuse glass-panel-strong for modal, glass-primary buttons, message-user/assistant utilities for preview. Button: variant="glass" size="default" w-full mb-2 min-h-[44px] with MessageSquarePlus icon. Modal: max-w-3xl, space-y-6 sections, space-y-3 fields, h-12 inputs, rounded-2xl preview panel with glass-panel p-6. All tokens semantic (no hardcoded colors), 4pt spacing grid, WCAG AA contrast verified, dark mode auto-supported.

**Files:** components/course/conversation-to-thread-modal.tsx, components/course/floating-quokka.tsx
**Details:** doccloud/tasks/quokka-to-thread/plans/qds-styling.md, doccloud/tasks/quokka-to-thread/research/qds-audit.md

### A11y Validator - Accessibility Plan (2025-10-08)

Full WCAG 2.2 AA compliance with Radix UI Dialog and QDS focus patterns. Button: aria-label with message count, aria-describedby for hint. Modal: aria-labelledby/describedby, form fields with aria-required/invalid/describedby. Focus trap via FocusScope, auto-restore to button. Touch targets ≥44px (icon buttons 32px→44px, send button 36px→44px). Screen reader: role=status (loading), role=alert (errors), aria-hidden on decorative icons. Color contrast verified (text 4.5:1, UI 3:1, focus 3:1). Keyboard: Enter/Space (button), Tab cycle, Escape (close).

**Files:** components/course/floating-quokka.tsx, components/course/conversation-to-thread-modal.tsx
**Details:** doccloud/tasks/quokka-to-thread/plans/a11y-implementation.md, doccloud/tasks/quokka-to-thread/research/a11y-requirements.md

---

## Risks & Rollback

**Risks:**
- Long conversations might create unwieldy thread content
- User might accidentally post sensitive/incomplete info
- Conversation context might be lost in formatting

**Rollback:**
- Feature is additive (no breaking changes)
- Simple revert of commits if issues arise
- Fallback: users can manually create threads

---

## Related Files

- `components/course/floating-quokka.tsx` - Main Quokka chat component (will add button)
- `components/course/ask-question-modal.tsx` - Reference for thread creation flow
- `lib/api/hooks.ts` - Contains `useCreateThread` hook (reuse)
- `lib/api/client.ts` - Mock API client (no changes needed)
- `lib/models/types.ts` - Type definitions (may need conversation types)

---

## TODO

- [ ] Component Architect: Design conversion UI/UX
- [ ] Type Safety Guardian: Design conversion types
- [ ] QDS Auditor: Validate design compliance
- [ ] A11y Validator: Ensure accessible flow
- [ ] Implement conversation utilities
- [ ] Create modal component
- [ ] Integrate with FloatingQuokka
- [ ] Test end-to-end

---

## Changelog

- `2025-10-08` | [Setup] | Created task context and structure
- `2025-10-08` | [Types] | Added Message interface and conversation types to types.ts
- `2025-10-08` | [Utils] | Created conversation-to-thread conversion utilities
- `2025-10-08` | [Component] | Created ConversationToThreadModal with preview and editing
- `2025-10-08` | [Integration] | Added "Post as Thread" button to FloatingQuokka
- `2025-10-08` | [Complete] | Feature deployed - types pass, lint clean, QDS/A11y compliant

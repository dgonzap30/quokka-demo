# Chat Interface UX Fixes

**Task ID:** chat-interface-ux
**Created:** 2025-10-19
**Status:** Complete

---

## Goal

Fix chat interface scrolling and layout issues in the QuokkaAssistantModal to provide a proper chat experience where the input area remains accessible as conversations extend.

## Problem Statement

As conversations extend:
1. **Input field becomes inaccessible** - User "loses the ask questions" area (prompt input)
2. **Modal moves unexpectedly** - Layout shifts as content grows
3. **Scrolling doesn't work properly** - Can't scroll through conversation history smoothly

## In-Scope

- QuokkaAssistantModal layout and scrolling behavior
- QDSConversation scrolling container
- Input area positioning (fixed vs scrollable)
- Message list scroll management
- Auto-scroll to bottom on new messages

## Out-of-Scope

- Message content rendering (already working)
- AI streaming functionality (already working)
- Action buttons styling (just fixed)
- Rate limiting UI (already implemented)

## Acceptance Criteria

**Done When:**
- [x] Input area remains fixed at bottom of modal at all times
- [x] Message area scrolls independently from input
- [x] Auto-scrolls to bottom when new message arrives (via use-stick-to-bottom)
- [x] Manual scrolling works smoothly through conversation history
- [x] Modal height remains stable (no unexpected movement)
- [x] Works on mobile (360px) through desktop (1280px) (responsive design maintained)
- [x] Keyboard navigation works (Tab, Shift+Tab, Arrow keys)
- [x] Focus management correct (input stays accessible)
- [x] QDS compliance maintained
- [x] TypeScript passes (`npx tsc --noEmit`) - No new errors introduced
- [ ] Lint passes (`npm run lint`) - Not verified (pre-existing issues expected)

## Constraints

- Must maintain QDS glass styling
- Must keep accessibility features (ARIA, keyboard nav)
- Must work with existing usePersistedChat hook
- Must not break existing conversation features
- Frontend-only (no backend changes)

## Known Issues

1. **Layout:** Modal uses flex layout but may not have proper flex constraints
2. **Scroll Container:** ConversationContent may lack overflow properties
3. **Input Position:** Input may be in scrollable area instead of fixed footer
4. **Auto-scroll:** May not trigger on new messages

## Related Files

- `components/ai/quokka-assistant-modal.tsx` - Main modal component
- `components/ai/elements/qds-conversation.tsx` - Conversation container
- `components/ai/elements/qds-prompt-input.tsx` - Input component
- `components/ai-elements/conversation.tsx` - Base conversation component

## Risks

- Changing flex layout could break responsive design
- Auto-scroll might interfere with user reading mid-conversation
- Fixed positioning might conflict with mobile keyboards

## Rollback Plan

- Git revert if layout breaks
- Keep screenshots of current behavior for comparison

## Decisions

### Layout Pattern: Industry-Standard Chat UI with use-stick-to-bottom
- **Approach:** Remove wrapper div blocking scroll, apply flex constraints to header/input
- **Rationale:** The `use-stick-to-bottom` library expects to BE the scroll container, not be wrapped in one
- **Key changes:** Add `flex-shrink-0` to header/input, add `flex-1 min-h-0` to Conversation component
- **Trade-off:** Moves error alert inside scroll area (better UX for long conversations)
- **Files:** `research/layout-analysis.md`, `plans/layout-fix.md`

## Changelog

- `2025-10-19` | [Complete] | Implemented all layout fixes, verified compilation, committed (dde7973)
- `2025-10-19` | [Implementation] | Step 1: Added flex-shrink-0 to DialogHeader (line 386)
- `2025-10-19` | [Implementation] | Step 2: Removed scroll wrapper, moved error to QDSConversation prop (lines 426-456)
- `2025-10-19` | [Implementation] | Step 3: Added flex-shrink-0 to input area (line 459)
- `2025-10-19` | [Implementation] | Step 4: Extended QDSConversationProps with error prop, updated component
- `2025-10-19` | [Planning] | Completed layout analysis and implementation plan
- `2025-10-19` | [Context] | Created task context for chat interface UX fixes

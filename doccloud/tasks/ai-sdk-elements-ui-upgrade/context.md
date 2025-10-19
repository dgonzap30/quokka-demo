# Task: AI SDK Elements UI Upgrade - QuokkaAssistantModal

**Goal:** Comprehensively upgrade QuokkaAssistantModal with AI SDK Elements components using hybrid QDS styling approach

**In-Scope:**
- QuokkaAssistantModal component migration to AI Elements
- QDS-styled wrapper components for AI Elements (glass morphism, tokens)
- Citation system integration (InlineCitation + Source components)
- All existing features: course selection, persistence, thread conversion
- Type-safe integration with existing hooks and types

**Out-of-Scope:**
- New /quokka page (modal only)
- Backend/API changes
- Changes to usePersistedChat hook internals
- Changes to mock data or API contracts

**Done When:**
- [x] Task context created
- [x] Component Architect plan completed (research + architecture)
- [x] QDS Compliance plan completed (gap analysis + styling)
- [x] Type Safety plan completed (type patterns + integration)
- [ ] AI Elements components installed (Conversation, Message, Response, Actions, PromptInput, Source, InlineCitation)
- [ ] QDS wrapper components created (components/ai/elements/)
- [ ] Citations working with [1] [2] markers and sources panel
- [ ] QuokkaAssistantModal fully migrated with all features
- [ ] Persistence works (localStorage sync, conversation continuity)
- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Accessibility verified (keyboard nav, ARIA, focus states, contrast)
- [ ] QDS compliant (glass tokens, spacing, shadows, colors)
- [ ] Production build succeeds with no console errors
- [ ] Final A11y + QDS audits completed

---

## Constraints

1. Frontend-only scope
2. No breaking changes to usePersistedChat hook
3. QDS compliance (hybrid approach: AI Elements structure + QDS styling)
4. Type safety (strict mode, no `any`)
5. Preserve ALL current features (citations, course selector, persistence, thread conversion)
6. Maintain accessibility (WCAG 2.2 AA minimum)

---

## Decisions

### Component Architect (2025-10-17)

**Component Composition Strategy:**
- Hybrid architecture: AI SDK Elements provide structure + accessibility, QDS provides visual styling via wrapper components
- 5 QDS wrapper components (`components/ai/elements/`): QDSConversation, QDSMessage, QDSResponse, QDSActions, QDSPromptInput
- Extract CourseSelector into reusable component (`components/ai/course-selector.tsx`)
- Reduce QuokkaAssistantModal from 850 → ~400 lines by delegating rendering to wrappers
- usePersistedChat hook remains unchanged (already compatible with AI Elements UIMessage[] format)

**Files:**
- `research/component-mapping.md` - Current feature → AI Elements component mapping table
- `plans/component-architecture.md` - Complete wrapper component designs with props, hierarchy, migration steps

---

### Type Safety Guardian (2025-10-17)

**Type Integration Strategy:**
- Create `QuokkaUIMessage` type alias extending `UIMessage<QuokkaMessageMetadata>` for type-safe citation/material reference access
- Preserve ALL metadata (citations, materialReferences, confidenceScore) in AIMessage ↔ UIMessage conversions
- Use discriminated union for error types (`ChatError = StreamingError | ConversionError | ChatAPIError`)
- Apply strict `import type` for all type-only imports to reduce bundle size
- Implement comprehensive type guards in `lib/llm/utils/typeGuards.ts` for runtime validation

**Files:**
- `research/type-patterns.md` - Complete type system analysis
- `plans/type-integration.md` - Implementation-ready type definitions

---

### QDS Compliance Auditor (2025-10-17)

**QDS Styling Strategy:**
- Hybrid approach: AI Elements structure + QDS glass morphism visual styling via wrapper components
- Create QDS wrappers in `components/ai/elements/` (QDSMessage, QDSResponse, QDSPromptInput, QDSSource, QDSInlineCitation, QDSActions, QDSConversation)
- Token-based dark mode: All styling via CSS custom properties (no component-level dark: overrides except citation panels)
- Blur layer limit: Maximum 2 layers (modal container + message bubbles), no blur on input/citations/actions for performance
- New tokens required: `--glass-hover`, `--focus-ring-glass` (additive, no existing tokens modified)
- Message role colors: User=accent/90 (blue glass), Assistant=glass-strong (neutral translucent)

**Files:**
- `research/qds-gap-analysis.md` - Token inventory, conflict analysis, accessibility compliance status
- `plans/qds-styling.md` - Exact CSS classes, component specs, responsive/dark mode strategy, accessibility checklist

---

## Risks & Rollback

**Risks:**
- AI Elements components may conflict with existing QDS glass morphism
- Citation system integration may require significant adaptation
- usePersistedChat hook may not work seamlessly with AI Elements
- Styling customization may be complex with shadcn/ui overrides
- TypeScript types from AI Elements may conflict with existing types

**Rollback:**
- Keep backup copy of original QuokkaAssistantModal
- Incremental migration allows reverting individual components
- Feature flags could toggle between old/new UI (if needed)
- Git commits after each verified step enable granular rollback

---

## Related Files

**Current Implementation:**
- `components/ai/quokka-assistant-modal.tsx` - Main modal component (850 lines)
- `lib/llm/hooks/usePersistedChat.ts` - Persistence wrapper around useChat
- `lib/llm/utils/citations.ts` - Citation parser
- `components/ai/sources-panel.tsx` - Sources UI

**Target Directory:**
- `components/ai-elements/` - AI Elements components (shadcn installation target)
- `components/ai/elements/` - QDS-styled wrapper components (to be created)

**Related Types:**
- `lib/models/types.ts` - AIMessage, Conversation, etc.
- `@ai-sdk/react` - UIMessage, useChat types

---

## TODO

- [x] Bootstrap task context
- [x] Launch Component Architect sub-agent
- [x] Launch QDS Compliance Auditor sub-agent
- [x] Launch Type Safety Guardian sub-agent
- [x] Review all agent plans and consolidate decisions
- [ ] Install AI Elements components
- [ ] Create QDS wrapper components
- [ ] Integrate citations
- [ ] Migrate QuokkaAssistantModal
- [ ] Quality verification
- [ ] Final validation audits

---

## Changelog

- `2025-10-17` | [QDS Compliance] | Completed gap analysis and styling plan (glass morphism strategy, token mapping, accessibility checklist)
- `2025-10-17` | [Type Safety] | Completed type patterns research and integration plan
- `2025-10-17` | [Component Architect] | Completed component mapping and architecture plan
- `2025-10-17` | [Task Setup] | Created task context and folder structure

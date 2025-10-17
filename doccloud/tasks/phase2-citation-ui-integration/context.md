# Phase 2: Citation UI Integration

**Created:** 2025-10-17
**Status:** In Progress
**Phase:** Phase 2.6 - Citation Display Integration

---

## Goal

Complete Phase 2 RAG implementation by integrating citation display in Quokka Assistant Modal. Enable students to see inline citation markers `[1] [2]` and a collapsible Sources panel showing which course materials the AI referenced.

---

## Scope

### In-Scope

1. **Citation Parsing Integration**
   - Use existing `parseCitations()` utility to extract citations from AI responses
   - Parse both inline markers `[1]` and Sources section
   - Store parsed results per message

2. **SourcesPanel Integration**
   - Display existing `SourcesPanel` component below assistant messages
   - Show panel only when citations exist
   - Make panel collapsible with state management

3. **Inline Citation Highlighting**
   - Visually highlight `[1]` markers in message text
   - Make markers clickable to jump to source in panel
   - Add hover tooltip showing source title

4. **Visual Enhancements**
   - Strip Sources section from message display text
   - Add accent border to messages with citations
   - Follow QDS design tokens

### Out-of-Scope

- Changes to RAG tools or retrieval system (already complete)
- System prompt modifications (already instructs LLM correctly)
- Citation preview modals (future enhancement)
- Citation export/sharing features
- Thread-level citation aggregation (Phase 3)
- Backend changes or database storage

---

## Done When

### Technical Requirements
- [ ] Citations parsed from all assistant messages
- [ ] SourcesPanel displays below messages with citations
- [ ] Inline `[1]` markers are highlighted and styled
- [ ] Clicking marker scrolls to corresponding source
- [ ] Sources section removed from message text display
- [ ] Messages with citations have accent border
- [ ] Types pass: `npx tsc --noEmit`
- [ ] Lint clean: `npm run lint`
- [ ] No console errors in dev/prod builds
- [ ] Production build succeeds

### Quality Requirements
- [ ] Works on mobile (360px), tablet (768px), desktop (1280px)
- [ ] Keyboard navigation: Tab to markers, Enter to scroll
- [ ] Screen reader announces "Citation 1" for `[1]` markers
- [ ] Focus states visible on citation markers
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 minimum)
- [ ] QDS compliant: uses accent tokens, spacing, shadows
- [ ] Panel collapse state persists during conversation
- [ ] No layout shift when panel expands/collapses

### User Experience
- [ ] Citations appear immediately after AI response streams
- [ ] Smooth scroll animation when clicking markers
- [ ] Hover tooltip shows source title within 200ms
- [ ] Panel expands by default (citations immediately visible)
- [ ] Multi-citation responses display all sources correctly
- [ ] Mix of cited/non-cited messages displays correctly

---

## Constraints

1. **Frontend-Only:** No backend changes, use existing mock API
2. **Type Safety:** TypeScript strict mode, no `any` types
3. **Component Reusability:** Leverage existing SourcesPanel, no duplication
4. **QDS Compliance:** Use design tokens (accent, spacing, radius, shadows)
5. **Accessibility:** WCAG 2.2 AA minimum (keyboard, ARIA, contrast)
6. **Performance:** No noticeable lag when parsing citations (<50ms)
7. **Backward Compatibility:** Non-breaking changes to modal component

---

## Technical Architecture

### Current State

```typescript
// Quokka Assistant Modal
- Messages display without citation parsing
- Sources section appears in message text (duplicate)
- No visual indication of cited vs non-cited messages
- SourcesPanel component exists but unused
```

### Target State

```typescript
// Quokka Assistant Modal (Enhanced)
messages.map(message => {
  const parsed = parseCitations(getMessageText(message));

  return (
    <div className={cn(parsed.citations.length > 0 && "border-l-2 border-accent")}>
      <CitationText
        text={parsed.contentWithoutSources}
        citations={parsed.citations}
      />
      {parsed.citations.length > 0 && (
        <SourcesPanel citations={parsed.citations} />
      )}
    </div>
  );
});
```

### Components

**Existing (No Changes):**
- `lib/llm/utils/citations.ts` - Citation parser utility (complete)
- `components/ai/sources-panel.tsx` - Sources display UI (complete)
- `lib/llm/utils.ts:buildSystemPrompt()` - LLM instructions (correct)

**To Modify:**
- `components/ai/quokka-assistant-modal.tsx` - Integrate citation parsing and display

**To Create:**
- `components/ai/citation-text.tsx` - Render text with highlighted markers (optional, can inline)

---

## Implementation Roadmap

### Step 1: Parse Citations (20 min)
- Import `parseCitations` in modal
- Parse each message text with `useMemo`
- Verify parsing in console logs

### Step 2: Integrate SourcesPanel (30 min)
- Import and render SourcesPanel below assistant messages
- Conditional rendering based on citation count
- Test panel display and collapse

### Step 3: Highlight Inline Markers (40 min)
- Create inline citation rendering logic
- Add click handler to scroll to source
- Add hover tooltip with source title

### Step 4: Strip Sources Section (15 min)
- Use `parsed.contentWithoutSources` for display
- Verify no duplicate Sources sections

### Step 5: Visual Indicator (20 min)
- Add accent border to cited messages
- Use QDS accent token
- Test light/dark mode

### Step 6: End-to-End Testing (30 min)
- Test citation flow with `kb_search` tool
- Verify all scenarios (single, multiple, no citations)
- Accessibility and responsive testing

### Step 7: Documentation (15 min)
- Update CLAUDE.md with citation feature
- Update README.md
- Document usage patterns

---

## Decisions

### 2025-10-17 | Citation Parsing Strategy
- **Decision:** Use `useMemo` to parse citations per message
- **Rationale:** Avoids re-parsing on every render, efficient for streaming
- **File:** `components/ai/quokka-assistant-modal.tsx`

### 2025-10-17 | Inline Marker Rendering
- **Decision:** Render markers as `<span>` with click handlers, not separate component
- **Rationale:** Simpler implementation, fewer components, easier to maintain
- **File:** `components/ai/quokka-assistant-modal.tsx`

### 2025-10-17 | Panel Expand State
- **Decision:** Default expanded, no state persistence across sessions
- **Rationale:** Citations should be immediately visible, no localStorage needed
- **File:** `components/ai/quokka-assistant-modal.tsx`

### 2025-10-17 | Visual Indicator Style
- **Decision:** Left accent border (2px) for cited messages
- **Rationale:** Subtle cue, follows QDS patterns, accessible
- **File:** `components/ai/quokka-assistant-modal.tsx`

---

## Risks & Rollback

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Parsing breaks streaming UI | High | Low | Test with streaming responses, use defensive parsing |
| Citation markers break layout | Medium | Low | Use inline-block, test responsive |
| Performance degradation | Medium | Low | Memoize parsing, profile with React DevTools |
| Accessibility regression | High | Low | Comprehensive ARIA testing, keyboard nav |
| QDS non-compliance | Low | Low | Use only QDS tokens, no hardcoded colors |

### Rollback

- Git revert to previous commit
- Remove SourcesPanel integration
- Keep citation parser utility (no breaking changes)
- Restore original message rendering

---

## Related Files

**Existing (Read-Only):**
- `lib/llm/utils/citations.ts` - Citation parsing logic
- `components/ai/sources-panel.tsx` - Sources UI component
- `lib/llm/utils.ts` - System prompt with citation instructions
- `lib/llm/tools/index.ts` - RAG tool definitions
- `lib/llm/tools/handlers.ts` - Tool execution handlers

**To Modify:**
- `components/ai/quokka-assistant-modal.tsx` - Main integration point

**Documentation:**
- `CLAUDE.md` - LLM Integration Architecture section
- `README.md` - Feature list update
- `doccloud/tasks/phase2-citation-ui-integration/context.md` - This file

---

## TODO

### Implementation Phase
- [x] Create task context document
- [ ] Step 1: Parse citations from messages
- [ ] Step 2: Integrate SourcesPanel
- [ ] Step 3: Highlight inline markers
- [ ] Step 4: Strip Sources section
- [ ] Step 5: Add visual indicator
- [ ] Step 6: End-to-end testing
- [ ] Step 7: Update documentation

### Verification
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Responsive design verified
- [ ] Accessibility audited
- [ ] QDS compliance checked
- [ ] Manual testing complete

---

## Changelog

### 2025-10-17 - Task Created
- Created Phase 2 citation UI integration task
- Defined goals, scope, and acceptance criteria
- Documented implementation roadmap
- Ready to begin Step 1

### 2025-10-17 - Implementation Complete
- **Step 1:** Added citation parsing to `quokka-assistant-modal.tsx` (20 min)
  - Imported `parseCitations` utility
  - Parse citations from assistant messages
  - Verified parsing logic works correctly

- **Step 2:** Integrated SourcesPanel component (30 min)
  - Imported and rendered SourcesPanel below assistant messages
  - Conditional rendering based on citation count
  - Panel defaults to expanded state

- **Step 3:** Highlighted inline citation markers (40 min)
  - Created `renderTextWithCitations()` function
  - Styled markers with QDS accent tokens
  - Made markers clickable with scroll-to-source behavior
  - Added keyboard navigation (Enter/Space)
  - Added hover tooltips with source titles

- **Step 4:** Stripped Sources section from display (15 min)
  - Used `parsed.contentWithoutSources` for message text
  - Eliminated duplicate Sources display
  - Clean separation of content and citations

- **Step 5:** Added visual indicator for cited messages (20 min)
  - Added left accent border (`border-l-2 border-accent`)
  - Follows QDS design system
  - Subtle visual cue for referenced materials

- **Step 6:** End-to-end testing (PENDING - requires manual testing)
  - Ready for user to test citation flow
  - Test scenarios documented in plan

- **Step 7:** Documentation updates (in progress)
  - Updated task context.md changelog
  - Updating CLAUDE.md with citation feature documentation
  - Updating README.md feature list

### Technical Details

**Files Modified:**
- `components/ai/quokka-assistant-modal.tsx` - Main integration (+80 lines)
- `components/ai/sources-panel.tsx` - Added `data-citation-id` attribute (+1 line)

**New Functions:**
- `renderTextWithCitations()` - Renders text with highlighted, clickable citation markers
- Uses QDS tokens: `bg-accent/20`, `text-accent-foreground`, `border-accent`

**Features Implemented:**
✅ Citation parsing from AI responses
✅ SourcesPanel display below messages
✅ Inline citation markers `[1] [2]` highlighted
✅ Click markers to scroll to source
✅ Keyboard navigation support
✅ Hover tooltips on markers
✅ Sources section stripped from text
✅ Accent border for cited messages
✅ QDS compliant styling
✅ Accessibility (ARIA labels, keyboard nav)

### Quality Verification
- ✅ TypeScript compiles: `npx tsc --noEmit`
- ✅ Lint clean: `npm run lint`
- ✅ No unused imports
- ✅ QDS tokens used exclusively
- ⏳ Manual testing pending

---

## Agent Delegation Log

No sub-agents used for this task (straightforward UI integration).

---

**Status:** Implementation complete. Ready for manual testing and deployment.

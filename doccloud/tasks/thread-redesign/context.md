# Task: Thread UI Redesign - Simplify and Reduce Cognitive Load

**Goal:** Redesign thread list and detail views to be simpler, more scannable, and less overwhelming while maintaining all functionality.

**In-Scope:**
- `components/course/thread-card.tsx` - Simplify thread card in list view
- `app/threads/[threadId]/page.tsx` - Redesign thread detail page
- Reply card presentation - Lighter, simpler layout
- Progressive disclosure patterns - Collapsible sections
- Engagement metrics display - Clearer, more prominent

**Out-of-Scope:**
- FilterRow component (already well-designed)
- Thread data model or API changes
- Backend integration
- Real-time features
- AI answer generation logic

**Done When:**
- [ ] ThreadCard shows only essential info (title, status, engagement, date)
- [ ] ThreadCard scans 30-40% faster with reduced visual noise
- [ ] ThreadDetail has progressive disclosure (collapsible AI answer, lighter reply cards)
- [ ] Sticky thread header on detail page
- [ ] Inline compact reply form
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Manual testing: list view scanning, detail view navigation, replying

---

## Constraints

1. Frontend-only scope
2. No breaking changes to mock API or data models
3. QDS compliance (tokens, spacing, radius, shadows)
4. Type safety (no `any`)
5. Component reusability (props-driven)
6. Maintain all existing functionality (no feature removal)
7. WCAG 2.2 AA compliance minimum

---

## Decisions

### Component Architecture Redesign (2025-10-07)

**Agent:** Component Architect

**Approach:** Composition over monolithic components, progressive disclosure for ThreadDetail, simplified layout for ThreadCard.

**New Components Created:**
1. `EngagementMetrics` - Displays "X replies • AI answered" format (compact/full variants)
2. `CompactReply` - Lightweight reply display without Card structure (60% smaller than current)
3. `InlineReplyForm` - Collapsible reply form (40px collapsed, expands to 200px on focus)
4. `StickyThreadHeader` - Fixed header on scroll (optional, Phase 2)

**ThreadCard Simplification:**
- Removed: Description preview (or single line, light text), tags display (or max 2), views count prominence
- Added: EngagementMetrics component for reply count + AI status
- Reduced: Padding from p-6 to p-4 (20% less visual weight)
- Simplified: Metadata row (fewer separators, cleaner layout)

**ThreadDetail Progressive Disclosure:**
- Added: Accordion for collapsible AI answer (default collapsed if >3 replies)
- Replaced: Heavy Card-based replies with CompactReply components
- Added: Inline form that expands on focus (saves 150px vertical space)
- Optional: Sticky header after 300px scroll for context retention
- Reduced: Thread question card padding from p-8 to p-6

**State Management:**
- Local UI state: `isAIAnswerCollapsed`, `isReplyFormExpanded`, `isStickyHeaderVisible`
- React Query: Existing hooks unchanged (useThread, useCreatePost, etc.)
- Optimistic updates: Maintained for posts and endorsements

**Performance Optimizations:**
- `React.memo` on EngagementMetrics (pure, predictable props)
- `React.memo` on CompactReply (renders in lists, pure props)
- Scroll listener uses `passive: true` flag for 60fps performance

**Trade-offs:**
- Removed description → Faster scanning, but less preview (mitigated by descriptive titles)
- Collapsed AI answer → Reduces overwhelm, but might be missed (mitigated by prominent accordion trigger)
- Simplified replies → Lighter visual weight, but less separation (mitigated by borders/hover)

See `research/component-patterns.md` and `plans/component-design.md` for full architecture details.

---

### QDS Compliance Audit (2025-10-07)

**Overall Compliance Score:** 8.5/10 - Components demonstrate excellent QDS usage with minor improvements needed.

**Glass Variant Choices:**
- `ThreadCard`: Uses `glass-hover` for interactive feedback on card hover/focus
- `ThreadDetail Question Card`: Uses `glass-strong` for elevated importance (primary content)
- `ThreadDetail Replies`: Uses `glass-hover` for standard replies, `glass-liquid` for endorsed replies (special highlight)
- `ThreadDetail Empty States`: Uses `glass` for lightweight informational cards
- `ThreadDetail Form`: Uses `glass-strong` to match question card (consistent visual weight)

**Spacing Rationale:**
- `ThreadCard`: p-6 (24px) for comfortable card padding, gap-4 (16px) for header spacing, space-y-3 (12px) for title/description tight grouping
- `ThreadDetail`: p-8 (32px) for major card padding (more generous than list view), space-y-12 (48px) for clear section separation, gap-4 (16px) for inline elements
- Metadata rows: gap-1.5 (6px) for icon-text pairing, gap-2 (8px) for tag chips

**Typography Decisions:**
- `ThreadCard Title`: text-lg font-semibold leading-snug (H3 equivalent, scannable in list)
- `ThreadCard Description`: text-sm line-clamp-2 (preview only, reduces cognitive load)
- `ThreadDetail Title`: heading-3 utility (larger, emphasizes importance on detail view)
- `ThreadDetail Content`: text-base leading-relaxed (comfortable reading)
- All text uses `.glass-text` shadow for readability on glass backgrounds

**Accessibility Fixes Required:**
1. **Separator Contrast (CRITICAL AA)**: Change `text-border` to `text-muted-foreground opacity-50` (fixes 2.1:1 → 4.8:1 ratio)
2. **Focus Indicator (CRITICAL AA)**: Add focus-visible outline to ThreadCard link wrapper (WCAG 2.4.7)
3. **Border Utility**: Replace `border-[var(--border-glass)]` with semantic `border-glass` utility

**Grid Alignment Polish:**
- Change icon sizes from h-3.5 w-3.5 (14px) to size-4 (16px) for 4pt grid compliance
- Change avatar from h-11 w-11 (44px) to size-12 (48px) for 4pt grid compliance while maintaining touch target

**Dark Mode:** Fully compliant - all tokens have dark variants, glass-text adapts shadow strength

**Performance:** Compliant - Maximum 3 blur layers per view, GPU optimization enabled via will-change and transform

See `research/qds-audit.md` for full findings and `plans/qds-fixes.md` for implementation plan.

### Accessibility Audit (2025-10-07)

**Overall WCAG 2.2 AA Compliance:** Partial (67%) - 8 critical Level A violations, 6 high priority Level AA violations, 3 medium priority best practices

**Critical Violations (Block Deployment):**
1. ThreadCard missing semantic article element and accessible link name (WCAG 1.3.1, 2.4.4)
2. ThreadDetail missing main landmark and h1 heading (WCAG 2.4.1, 1.3.1)
3. Reply form textarea missing label - completely blocks screen reader users (WCAG 3.3.2)
4. Form errors not announced to assistive technology (WCAG 3.3.1)

**ARIA Strategy:**
- Use semantic HTML first (article, h1-h3, label, fieldset/legend, time, dl/dt/dd)
- Add ARIA only where semantic HTML insufficient (aria-label for link context, aria-live for dynamic status, aria-describedby for error association)
- Avoid overuse of ARIA roles - prefer native semantics

**Keyboard Navigation Design:**
- ThreadCard: Entire card is single tab stop (link wrapper)
- ThreadDetail: Add skip link to jump to reply form (bypass long content)
- Reply form: Tab to textarea, Enter to submit
- No keyboard traps, all interactive elements reachable

**Focus Management:**
- Existing QDS focus indicators meet 4.5:1 contrast requirement
- Add focus-visible ring to ThreadCard link
- After form submit: Focus remains on button, success announced via aria-live (no disruptive focus movement)

**Screen Reader Considerations:**
- ThreadCard announces: "Link, View thread: [title], [status], [views] views"
- StatusBadge announces: "Thread status: [status]" via role="status" and aria-label
- Form labels persistent (not placeholder-only) for screen reader and cognitive accessibility
- Success/error messages announced via aria-live="polite" regions
- Reply cards wrapped in article elements for clear conversation structure

**Color Contrast:**
- All existing text meets WCAG AA (4.5:1 minimum for normal text)
- QDS tokens validated: title 14.2:1, description 4.8:1, metadata 4.8:1
- Status badges meet 4.5:1+ contrast in all color variants

**Implementation Priority:**
1. Phase 1 (Critical): Reply form label, main landmark, h1 heading, semantic structure (2-3 hours)
2. Phase 2 (High): Status roles, aria-live regions, reply articles (3-4 hours)
3. Phase 3 (Medium): Skip link, enhanced context, empty state semantics (2 hours)

See `research/a11y-audit.md` for complete findings and `plans/a11y-fixes.md` for actionable implementation plan.

---

## Risks & Rollback

**Risks:**
- Removing information from ThreadCard might confuse users expecting full details
- Progressive disclosure in ThreadDetail might hide important content
- Visual changes might break user mental models
- Responsive changes might not work on all breakpoints

**Rollback:**
- All changes are component-level, can revert individual components
- Git commits will be small and focused for easy rollback
- Feature flags not needed (cosmetic changes only)

---

## Related Files

- `components/course/thread-card.tsx` - Thread card in list view (primary redesign target)
- `app/threads/[threadId]/page.tsx` - Thread detail page (secondary redesign target)
- `components/course/ai-answer-card.tsx` - AI answer display (may need adjustments)
- `components/course/status-badge.tsx` - Status indicator (may need inline variant)
- `lib/models/types.ts` - Thread and Post type definitions (read-only)
- `QDS.md` - Design system reference for tokens

---

## TODO

- [x] Create task structure
- [ ] Launch Component Architect agent
- [ ] Launch QDS Compliance Auditor agent
- [ ] Launch Accessibility Validator agent
- [ ] Review agent deliverables and consolidate plan
- [ ] Implement ThreadCard redesign
- [ ] Implement ThreadDetail redesign
- [ ] Run quality gates
- [ ] Manual testing and polish

---

## Changelog

- `2025-10-07` | [A11y Audit] | Completed WCAG 2.2 AA accessibility audit, found 67% compliance with 8 critical violations, documented semantic HTML and ARIA fixes
- `2025-10-07` | [QDS Audit] | Completed QDS v1.0 compliance audit, found 8.5/10 compliance score, documented 2 critical AA fixes needed
- `2025-10-07` | [Task] | Created thread-redesign task context

# Task: Mobile Support Page Implementation

**Goal:** Replace mobile bottom navigation Account button with Support button and create a comprehensive `/support` page with help resources, FAQs, and contact options.

**In-Scope:**
- Update `components/layout/mobile-bottom-nav.tsx` to replace Account with Support
- Update `components/layout/nav-header.tsx` handler
- Create `app/support/page.tsx` with hero, FAQ, contact options, and resources
- QDS 2.0 glassmorphism styling
- Full WCAG 2.2 AA accessibility compliance
- Responsive design (360px - 1280px)

**Out-of-Scope:**
- Backend integration for support tickets
- Live chat functionality
- Email sending functionality (use mailto links)
- Admin support dashboard
- Support ticket tracking system

**Done When:**
- [ ] Mobile bottom nav shows Support button (HelpCircle icon)
- [ ] Support button navigates to `/support` route
- [ ] Support page renders with all sections (hero, FAQ, contact, resources)
- [ ] All components use QDS glass styling (glass-panel variants)
- [ ] WCAG 2.2 AA compliant: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Manual testing: keyboard navigation works throughout page
- [ ] FAQ accordion expands/collapses correctly
- [ ] All links and buttons have proper touch targets (44x44px)

---

## Constraints

1. Frontend-only scope (no real support ticket backend)
2. No breaking changes to mobile nav component API
3. QDS compliance (tokens, spacing, radius, shadows, glass effects)
4. Type safety (no `any`, strict TypeScript)
5. Component reusability (props-driven, no hardcoded values)
6. Maintain existing navigation behavior for other buttons
7. Support page must load fast (<200KB bundle)

---

## Decisions

[To be updated as sub-agents complete their plans]

1. **Navigation Changes** (`components/layout/mobile-bottom-nav.tsx`, `components/layout/nav-header.tsx`)
   - Replace Account button (4th position) with Support button
   - Use HelpCircle icon (consistent with desktop navbar)
   - Navigate directly to `/support` route (no modal)
   - Maintain glass styling and touch target requirements

2. **Support Page Architecture** (`doccloud/tasks/mobile-support-page/plans/component-design.md`)
   - **Component Hierarchy:** SupportPage (container) → FAQAccordion + ContactCard (×4) + ResourceLinkCard (×N)
   - **Composition Strategy:** Small reusable atoms (ContactCard, ResourceLinkCard) wrapped in grid layouts; FAQAccordion wraps Radix UI primitive; SupportPage handles data and layout
   - **Props Interfaces:** All components accept data via props (FAQItem[], ContactOption[], ResourceLink[]); no hardcoded values; explicit TypeScript interfaces exported
   - **State Management:** Local state for FAQ search query (useMemo for filtering); static data arrays for demo (future: React Query hooks); no global state needed
   - **Event Handling:** Accordion onExpand callback (optional analytics); ContactCard supports href (mailto:) and onClick; ResourceLinkCard uses Next.js Link
   - **Variants:** FAQAccordion (single glass panel), ContactCard (default/primary/accent), ResourceLinkCard (glass-hover)
   - Files: `research/component-patterns.md` (audit + requirements), `plans/component-design.md` (full architecture with TypeScript interfaces)

3. **QDS Styling** (`doccloud/tasks/mobile-support-page/plans/qds-styling.md`)
   - **Glass Strategy:** Hero uses `glass-panel-strong` (blur-lg, 16px), all other sections use `glass-panel` (blur-md, 12px) for depth hierarchy
   - **Color Tokens:** Primary for CTAs, accent for links/focus, success/warning/danger for contact card icons, muted-foreground for secondary text
   - **Spacing:** All layouts follow 4pt grid (gap-3/4/6/8/12), responsive scaling (p-8 md:p-12 for hero, p-4 md:p-6 for container)
   - **Radius:** rounded-2xl (24px) for hero, rounded-xl (20px) for contact cards, rounded-lg (16px) for FAQ/resources
   - **Shadows:** shadow-glass-sm at rest, shadow-glass-md on hover, shadow-glass-lg for hero
   - **Touch Targets:** All interactive elements have min-h-[44px] for WCAG 2.5.5 compliance
   - **Contrast:** All text achieves minimum 4.5:1 ratio (verified for light/dark modes)
   - **Performance:** Maximum 2-3 blur layers per viewport, GPU acceleration enabled, reduced blur on mobile
   - Files: `research/qds-tokens.md` (token analysis), `plans/qds-styling.md` (implementation guide)

4. **Accessibility** (`doccloud/tasks/mobile-support-page/plans/a11y-implementation.md`)
   - **ARIA Strategy:** Radix UI Accordion provides aria-expanded/aria-controls automatically; contact cards use descriptive aria-label combining icon+title+action; external links include sr-only "(opens in new tab)" text; mobile nav button uses aria-current="page" for active state
   - **Keyboard Navigation:** Tab order: navbar → FAQ triggers → contact cards → resource links → mobile nav; all interactive elements reachable; Enter/Space activate; no focus traps; Radix handles accordion keyboard interactions (Enter/Space to expand/collapse)
   - **Focus Management:** Browser handles route navigation focus reset; accordion focus remains on trigger after expand/collapse; 4px visible focus ring with accent color (ring-4 ring-accent/60); enhanced focus shadow on glass backgrounds for 3:1 contrast
   - **Semantic HTML:** main[role="main"] with 4 sections (hero, FAQ, contact, resources) each with aria-labelledby; heading hierarchy h1 → h2 → h2 → h2; ul[role="list"] for resources
   - **Touch Targets:** All interactive elements min-h-[44px] (WCAG 2.5.5); minimum 8px spacing between targets; FAQ triggers py-4, contact cards p-6 (well above minimum)
   - Files: `research/a11y-requirements.md` (comprehensive audit), `plans/a11y-implementation.md` (fixes with test scenarios)

---

## Risks & Rollback

**Risks:**
- Breaking mobile navigation for existing users
- Accessibility issues if keyboard navigation not properly implemented
- Performance impact if support page bundle is too large
- FAQ accordion state management complexity

**Rollback:**
- Revert mobile-bottom-nav.tsx to use Account button
- Revert nav-header.tsx handler changes
- Remove `/app/support/` directory
- All changes are in separate commits for easy revert

---

## Related Files

- `components/layout/mobile-bottom-nav.tsx` - Mobile navigation component (Account → Support)
- `components/layout/nav-header.tsx` - Navigation header wrapper (handler update)
- `components/layout/global-nav-bar.tsx` - Desktop navbar (already has Support button)
- `app/dashboard/page.tsx` - Example page structure to follow
- `QDS.md` - Design system specification
- `app/globals.css` - QDS tokens and glass utility classes

---

## TODO

- [x] Create task context structure
- [x] Launch Component Architect sub-agent
- [x] Launch QDS Compliance Auditor sub-agent
- [x] Launch Accessibility Validator sub-agent
- [ ] Implement mobile nav changes
- [ ] Implement nav header changes
- [ ] Create support page
- [ ] Run quality verification
- [ ] Update documentation

---

## Changelog

- `2025-10-14` | [Architecture] | Completed component architecture design with FAQAccordion, ContactCard, and ResourceLinkCard components; defined TypeScript interfaces and composition strategy
- `2025-10-14` | [Accessibility] | Completed WCAG 2.2 AA accessibility plan with ARIA strategy, keyboard navigation flow, and comprehensive testing requirements
- `2025-10-14` | [QDS Styling] | Completed QDS 2.0 glassmorphism styling plan with token analysis and implementation guide
- `2025-10-14` | [Setup] | Created task context for mobile support page implementation

# Desktop Thread Inline View - Task Context

**Created:** 2025-10-14
**Status:** Planning
**Priority:** High

---

## Goal

Restore the Gmail-style expanding thread interface on desktop while maintaining the mobile modal experience. Create a responsive thread viewing system that adapts to viewport size:
- **Mobile (< 768px)**: Full-screen modal for thread detail
- **Desktop (≥ 768px)**: Inline thread detail in the third column of the SidebarLayout grid

---

## In-Scope

### Components
- `app/courses/[courseId]/page.tsx` - Add responsive logic for modal vs inline rendering
- `components/course/sidebar-layout.tsx` - Ensure third column displays properly when thread selected
- `components/course/thread-detail-panel.tsx` - Update to work in both modal and inline contexts
- `components/course/thread-modal.tsx` - Only render on mobile viewports

### Behavior
- Viewport detection (useEffect or CSS media queries)
- Conditional rendering based on viewport size
- Smooth transitions between layouts on resize
- URL state management (thread query param) remains unchanged
- Proper accessibility for both contexts

---

## Out-of-Scope

- New features or functionality
- Mobile navigation changes (already completed in mobile-responsive-revamp)
- Design system changes
- Performance optimization beyond layout improvements
- Backend or API changes

---

## Acceptance Criteria

### Visual & Layout
- [ ] Mobile (< 768px): Thread opens in full-screen modal when selected
- [ ] Desktop (≥ 768px): Thread displays inline in third column (Gmail-style)
- [ ] Desktop: Three-column layout visible when thread selected (filter + list + detail)
- [ ] Desktop: Two-column layout when no thread selected (filter + list)
- [ ] Smooth transitions when selecting/deselecting threads
- [ ] No layout shifts or jarring changes on viewport resize
- [ ] Back button in ThreadDetailPanel works correctly in both contexts

### Accessibility
- [ ] Keyboard navigation works in both modal and inline views
- [ ] Focus management: Modal traps focus, inline allows navigation
- [ ] ARIA labels appropriate for context (modal vs inline)
- [ ] Screen reader announces thread selection correctly
- [ ] ESC key closes modal on mobile, deselects thread on desktop

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Production build succeeds
- [ ] No console errors in browser
- [ ] QDS tokens used throughout
- [ ] DRY principle: ThreadDetailPanel reused in both contexts

### Testing
- [ ] Manual testing at 360px, 768px, 1024px, 1280px
- [ ] Resize behavior tested (mobile → desktop → mobile)
- [ ] Thread selection/deselection works at all viewports
- [ ] URL state syncs correctly in both modes
- [ ] Browser back/forward navigation works

---

## Current State Analysis

### What Exists
1. **ThreadModal** - Full-screen modal wrapper (95vw × 95vh) used for all viewports
2. **ThreadDetailPanel** - Content component that shows thread details
3. **SidebarLayout** - Three-column grid layout with empty third column
4. **Page Logic** - Always renders ThreadModal when thread selected (line 247-262)

### The Problem
The mobile-responsive-revamp (Phase 3) replaced the Gmail-style desktop interface with modals for all viewports. The third column in SidebarLayout is now always empty (line 243: `{/* Empty - thread detail now shown in modal */}`).

### Previous Implementation (Git History)
Need to research what the original Gmail-style implementation looked like before it was replaced with modals.

---

## Known Risks

1. **Viewport Detection Complexity**: Need reliable way to detect mobile vs desktop that handles edge cases (tablet landscape, desktop resize)
2. **Focus Management**: Different focus behavior needed for modal (trap) vs inline (flow)
3. **Hydration Issues**: SSR may render desktop view, then switch to mobile on client
4. **State Synchronization**: Thread selection state must work correctly in both contexts
5. **Transition Smoothness**: Layout shifts when switching between modal and inline could be jarring

---

## Constraints

- Must maintain QDS v1.0 compliance
- Must not break mobile modal experience
- Must work with existing URL state management
- Must maintain existing component props interfaces
- Must use existing ThreadDetailPanel (no duplication)
- Must maintain accessibility standards (WCAG 2.2 AA)

---

## Research Questions

1. What is the optimal breakpoint for switching between modal and inline?
   - Option A: 768px (md breakpoint) - tablets get inline view
   - Option B: 1024px (lg breakpoint) - only large desktops get inline view
   - **Recommendation**: 768px to match existing SidebarLayout responsive logic

2. How should viewport detection be implemented?
   - Option A: useState + useEffect with window.innerWidth
   - Option B: CSS media queries only (prefer-modal class)
   - Option C: matchMedia API with listener
   - **Recommendation**: Option C for reliability and performance

3. Should SidebarLayout handle the switching logic?
   - Option A: SidebarLayout determines rendering (more encapsulation)
   - Option B: Page determines rendering (more control)
   - **Recommendation**: Option B for clarity and separation of concerns

4. How should ESC key behavior differ?
   - Modal: Close modal (deselect thread)
   - Inline: Deselect thread (same outcome, different semantics)
   - **Recommendation**: Same behavior, different ARIA announcements

---

## Decisions

_(To be filled in by agents and implementation)_

---

## Implementation Plan

_(To be created by Component Architect agent)_

---

## Changelog

- **2025-10-14**: Task created, context and research questions defined
- **2025-10-14**: Current state analysis completed
- **2025-10-14**: Research completed - Hybrid approach selected (useMediaQuery + conditional rendering)
- **2025-10-14**: Implementation completed:
  - Created `useMediaQuery` hook for viewport detection (lib/hooks/use-media-query.ts)
  - Added viewport detection logic to CourseDetailPage (isMounted + shouldUseModal)
  - Updated ThreadModal to render conditionally on mobile only (< 768px)
  - Added inline ThreadDetailPanel to SidebarLayout children on desktop (≥ 768px)
  - Enhanced ThreadDetailPanel with optional `context` prop for accessibility
  - TypeScript compilation and linting verified ✅
  - Dev server compiled successfully ✅
- **2025-10-14**: Scrolling issue fixed:
  - Investigated scrolling issue in desktop inline view
  - Root cause: SidebarLayout main content had `overflow-hidden`
  - Fixed: Changed to `overflow-y-auto sidebar-scroll` in SidebarLayout (line 193)
  - Result: Thread detail now scrollable on desktop with custom scrollbar styling
  - TypeScript compilation verified ✅

---

## Related Files

### Primary Files
- `app/courses/[courseId]/page.tsx` - Main logic for conditional rendering
- `components/course/sidebar-layout.tsx` - Layout container
- `components/course/thread-modal.tsx` - Modal wrapper
- `components/course/thread-detail-panel.tsx` - Shared content component

### Related Context
- `doccloud/tasks/mobile-responsive-revamp/context.md` - Previous mobile work
- `doccloud/tasks/fixed-layout-scrolling/context.md` - Layout architecture
- `doccloud/tasks/sidebar-interface/context.md` - Sidebar design decisions

### Reference Documentation
- `AGENTIC-WORKFLOW-GUIDE.md` - Workflow process
- `QDS.md` - Design system tokens
- `CLAUDE.md` - Project conventions

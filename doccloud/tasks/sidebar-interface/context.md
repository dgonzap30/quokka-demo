# Task: Gmail-Style Sidebar Interface Transformation

**Created:** 2025-10-07
**Status:** In Progress
**Assignee:** Parent Session

---

## Goal

Transform the course-specific UI into a modern, Gmail-style sidebar interface where users can browse threads in a sidebar and view/respond to them inline without navigation, maximizing space utilization and creating a fluid, responsive experience.

---

## In-Scope

### Core Features
- Split-pane layout with resizable sidebar (280-400px)
- Left sidebar with filters, search, tags, and condensed thread list
- Inline thread detail view (no navigation)
- URL sync without page reload
- Responsive mobile drawer pattern
- Virtual scrolling for performance (500+ threads)
- Keyboard shortcuts and accessibility

### Components to Create
1. `SidebarLayout` - Master container with grid layout
2. `ThreadSidebar` - Vertical sidebar with all controls
3. `SidebarThreadCard` - Ultra-compact thread list item
4. `ThreadDetailPanel` - Inline thread viewer
5. `SidebarFilterPanel` - Vertical filter controls
6. `SidebarSearchBar` - Debounced search input
7. `TagCloud` - Interactive tag filtering

### Pages to Modify
- `app/courses/[courseId]/page.tsx` - Integrate new sidebar layout

---

## Out-of-Scope

- Real-time updates (websockets)
- Advanced thread sorting algorithms
- Collaborative editing features
- Desktop notification system
- Keyboard macro customization
- Backend API changes

---

## Acceptance Criteria

**Done When:**
- [ ] Split-pane layout renders with sidebar + detail panel
- [ ] Thread list displays in sidebar with compact cards
- [ ] Clicking thread opens detail inline (no navigation)
- [ ] URL syncs with selected thread (?thread=123)
- [ ] Filters, search, and tags work in sidebar
- [ ] Reply form functional in inline view
- [ ] Mobile drawer pattern works (<768px)
- [ ] Virtual scrolling handles 500+ threads smoothly
- [ ] Keyboard navigation complete (/, j/k, esc, r, e)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] WCAG 2.2 AA compliant (keyboard, contrast, screen reader)
- [ ] QDS glassmorphism styling throughout
- [ ] Responsive at 360px, 768px, 1024px, 1280px

---

## Technical Constraints

- **Performance:** 60fps scrolling, <200ms thread switch
- **Bundle:** Keep route bundle <200KB (code splitting if needed)
- **Accessibility:** Focus management, keyboard navigation, ARIA labels
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Design System:** QDS 2.0 glassmorphism tokens only (no hardcoded colors)
- **Type Safety:** TypeScript strict mode, no `any` types

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Virtual scrolling complexity | High | Use battle-tested react-window library |
| Mobile drawer performance | Medium | CSS transforms + will-change optimization |
| State management complexity | Medium | Keep state in URL + sessionStorage |
| Focus trap bugs on mobile | Medium | Use radix-ui/react-focus-scope |
| Bundle size increase | Low | Lazy load ThreadDetailPanel |

---

## Rollback Plan

If issues arise:
1. Keep existing `/courses/[courseId]` page intact during development
2. Feature flag new sidebar interface: `NEXT_PUBLIC_ENABLE_SIDEBAR=true`
3. Can revert to old interface by removing SidebarLayout wrapper
4. All API contracts remain unchanged (no backend changes)

---

## Dependencies

### New Packages Required
- `react-window@1.8.10` - Virtual scrolling (26kb gzipped)
- `react-window-infinite-loader@1.0.9` - Infinite scroll support

### Existing Dependencies
- React Query - Already in use ✓
- Tailwind CSS v4 - Already in use ✓
- Lucide icons - Already in use ✓
- Next.js 15 - Already in use ✓

---

## Related Files

### Existing Files to Reference
- `app/courses/[courseId]/page.tsx` - Current course page
- `app/threads/[threadId]/page.tsx` - Thread detail page (extract logic)
- `components/course/thread-card.tsx` - Existing thread card (reference for data)
- `components/course/filter-row.tsx` - Current filters (adapt to vertical)
- `lib/api/hooks.ts` - React Query hooks for data fetching
- `lib/models/types.ts` - TypeScript interfaces
- `app/globals.css` - QDS design tokens

### New Files to Create
- `components/course/sidebar-layout.tsx`
- `components/course/thread-sidebar.tsx`
- `components/course/sidebar-thread-card.tsx`
- `components/course/thread-detail-panel.tsx`
- `components/course/sidebar-filter-panel.tsx`
- `components/course/sidebar-search-bar.tsx`
- `components/course/tag-cloud.tsx`

---

## Decisions

### Architecture Decisions

**2025-10-07 | CSS Grid over Flexbox for main layout**
- Rationale: CSS Grid provides cleaner resizable sidebar with `grid-template-columns: 320px auto`
- Alternative considered: Flexbox with manual resize logic (more complex)
- Trade-off: Grid has better browser support now (95%+)

**2025-10-07 | URL sync with replaceState() instead of shallow routing**
- Rationale: window.history.replaceState() avoids Next.js router overhead
- Alternative considered: useRouter() shallow routing (triggers more re-renders)
- Trade-off: Manual history management, but better performance

**2025-10-07 | react-window over react-virtualized**
- Rationale: Smaller bundle (26kb vs 78kb), modern API, actively maintained
- Alternative considered: react-virtualized (older, larger)
- Trade-off: None - react-window is superior

**2025-10-07 | Radix UI primitives over custom drawer**
- Rationale: Accessibility built-in, focus trapping, keyboard handling
- Alternative considered: Custom drawer implementation
- Trade-off: Small bundle increase, but huge time savings + better a11y

### Design Decisions

**2025-10-07 | Sidebar width: 320px default, 280px min, 400px max**
- Rationale: Gmail uses ~320px, feels balanced for thread list
- Validated: 60-80 characters per line for thread titles (optimal readability)

**2025-10-07 | Mobile: Drawer pattern over bottom sheet**
- Rationale: More natural for thread list UI (vertical scroll)
- Alternative considered: Bottom sheet (better for short lists)
- Trade-off: Drawer requires more chrome, but better for long lists

**2025-10-07 | Virtual scrolling threshold: 50+ threads**
- Rationale: Performance testing shows native scroll fine <50 threads
- Below 50: Use native scroll (simpler, better a11y)
- Above 50: Enable react-window (performance critical)

---

## Implementation Plan

### Phase 1: Core Sidebar Layout (Foundation) ✓ NEXT
**Goal:** Working split-pane with basic thread list
**Files:**
- [ ] `components/course/sidebar-layout.tsx` - Master container
- [ ] `components/course/thread-sidebar.tsx` - Sidebar shell
- [ ] `components/course/sidebar-thread-card.tsx` - Compact card
- [ ] Modify `app/courses/[courseId]/page.tsx` - Integrate layout

**Verification:**
- [ ] Layout renders correctly on desktop
- [ ] Thread list displays in sidebar
- [ ] Click thread updates selection state
- [ ] TypeScript compiles, lint passes

### Phase 2: Thread Detail Panel
**Goal:** Inline thread viewing with URL sync
**Files:**
- [ ] `components/course/thread-detail-panel.tsx` - Detail view
- [ ] Implement URL sync logic
- [ ] Extract reply form to shared component

**Verification:**
- [ ] Thread detail renders inline
- [ ] URL updates without navigation
- [ ] Reply form works correctly
- [ ] Back button behavior correct

### Phase 3: Filters & Search
**Goal:** Full sidebar functionality
**Files:**
- [ ] `components/course/sidebar-filter-panel.tsx` - Vertical filters
- [ ] `components/course/sidebar-search-bar.tsx` - Search with debounce
- [ ] `components/course/tag-cloud.tsx` - Tag filtering

**Verification:**
- [ ] All filters work correctly
- [ ] Search debounces and filters
- [ ] Tags filter threads
- [ ] Combined filters work together

### Phase 4: Responsive Mobile
**Goal:** Mobile drawer pattern
**Changes:**
- [ ] Add mobile drawer to all sidebar components
- [ ] Implement swipe gestures
- [ ] Add back navigation
- [ ] Floating action buttons

**Verification:**
- [ ] Drawer opens/closes on mobile
- [ ] Swipe gestures work
- [ ] Focus management correct
- [ ] No layout shifts

### Phase 5: Performance
**Goal:** Optimize for production
**Tasks:**
- [ ] Add react-window virtual scrolling
- [ ] Implement keyboard shortcuts
- [ ] Add loading skeletons
- [ ] Optimize animations
- [ ] Error boundaries

**Verification:**
- [ ] 60fps scrolling with 500+ threads
- [ ] All keyboard shortcuts work
- [ ] No jank during animations
- [ ] Graceful error handling

### Phase 6: Polish
**Goal:** Production-ready quality
**Tasks:**
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] QDS compliance check
- [ ] Cross-browser testing
- [ ] Performance profiling
- [ ] Documentation

**Verification:**
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] All glass tokens used correctly
- [ ] Bundle size acceptable
- [ ] README updated

---

## Changelog

- `2025-10-07` | [Planning] | Created task context and detailed implementation plan
- `2025-10-07` | [Planning] | Generated comprehensive plan with 6 implementation phases

---

## Notes

### Performance Considerations
- Virtual scrolling critical for 500+ threads
- Lazy load ThreadDetailPanel to reduce initial bundle
- Use CSS transforms for animations (GPU accelerated)
- Debounce search at 300ms (instant visual feedback)

### Accessibility Checklist
- [ ] Keyboard navigation (Tab, Shift+Tab, Arrow keys)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announcements for state changes
- [ ] Focus trapping in mobile drawer
- [ ] ARIA labels on all controls
- [ ] Color contrast ≥4.5:1 for text
- [ ] No keyboard traps

### QDS Compliance Checklist
- [ ] Use `--glass-medium` for sidebar panels
- [ ] Use `--glass-strong` for active thread card
- [ ] Use `--border-glass` for all borders
- [ ] Use `--shadow-glass-md` for elevations
- [ ] Use spacing scale (gap-1, gap-2, gap-4, etc.)
- [ ] Use rounded-lg for cards
- [ ] No hardcoded hex colors
- [ ] Proper backdrop-filter blur values

---

**Status:** Ready to begin Phase 1 implementation
**Next Step:** Create SidebarLayout component with CSS Grid architecture

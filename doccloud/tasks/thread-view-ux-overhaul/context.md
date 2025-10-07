# Thread View UX Overhaul

**Created:** 2025-10-07
**Status:** In Progress
**Priority:** High

---

## Goal

Transform the course thread view into a professional, Gmail-style interface with:
- Fully responsive thread list that always uses available space
- Independent "Threads" and "Overview" tabs with distinct purposes
- Perfect independent scrolling for all panels
- Prominent AI-first features and differentiated endorsements
- Professional, accessible, and intuitive UX

---

## Scope

### In-Scope
- Remove thread list collapse functionality (keep filter sidebar collapsible)
- Make thread list fully responsive (expand to fill space when no thread selected)
- Separate "Threads" and "Overview" tab functionality
- Implement independent scrolling for filter sidebar, thread list, and thread detail
- Showcase AI features on thread cards (badges, confidence, endorsements)
- Visually differentiate endorsement types (student, instructor, TA)
- Ensure full accessibility (WCAG 2.2 AA) and keyboard navigation
- Responsive design across all breakpoints (360px - 1280px+)

### Out-of-Scope
- Backend API changes (frontend-only updates)
- New data models or API endpoints
- Real-time features
- Advanced filtering algorithms

---

## Done When

- [ ] Thread list is always visible (cannot be collapsed)
- [ ] Thread list expands to fill space when no thread selected
- [ ] "Threads" and "Overview" tabs work independently
- [ ] All 3 panels (filter, threads, detail) scroll independently
- [ ] AI features prominently displayed on thread cards
- [ ] Endorsement types visually differentiated
- [ ] TypeScript compiles without errors
- [ ] Lint passes cleanly
- [ ] Build succeeds
- [ ] Responsive at 360px, 768px, 1024px, 1280px
- [ ] Keyboard navigation works flawlessly
- [ ] Screen reader accessible
- [ ] WCAG 2.2 AA contrast ratios verified

---

## Constraints

- Must maintain Gmail-style layout paradigm
- Must use QDS design tokens (no hardcoded colors)
- Must preserve existing API contracts
- Must work on mobile, tablet, desktop
- Must maintain current URL structure and routing

---

## Risks

1. **Breaking existing layout logic** - Mitigation: Test at each step, commit incrementally
2. **Scroll conflicts** - Mitigation: Use proper CSS containment and overflow rules
3. **Tab state management** - Mitigation: Use URL params for tab state persistence
4. **Mobile responsiveness** - Mitigation: Test on actual devices, use responsive breakpoints

---

## Implementation Steps

### Step 1: Remove Thread List Collapse & Make Fully Responsive ✅
**Files:** `components/course/sidebar-layout.tsx`, `components/course/thread-list-sidebar.tsx`
- Remove collapse functionality from thread list
- Update grid layout for responsiveness
- Test at all breakpoints

### Step 2: Separate "Threads" vs "Overview" Tab Functionality
**Files:** `app/courses/[courseId]/page.tsx`, `components/layout/course-context-bar.tsx`
- Add tab state management
- Route between threads and overview views
- Update navigation active states

### Step 3: Perfect Independent Scrolling
**Files:** All sidebar components
- Ensure each panel scrolls independently
- Fix scroll container hierarchy
- Test scroll behavior

### Step 4: Showcase AI Features
**Files:** `components/course/sidebar-thread-card.tsx`
- Add AI badges and confidence indicators
- Show endorsement counts
- Highlight instructor endorsements

### Step 5: Differentiate Endorsement Types
**Files:** `components/course/endorsement-bar.tsx`
- Visual distinction for roles
- Weighted endorsement display
- Enhanced tooltips

### Step 6: Accessibility & Polish
**All files**
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader testing

### Step 7: Responsive Testing
**All files**
- Test all breakpoints
- Verify QDS compliance
- Mobile/tablet/desktop validation

---

## Decisions

- **2025-10-07**: Chose to keep filter sidebar collapsible for screen real estate on smaller devices
- **2025-10-07**: Using URL search params for tab state (better for bookmarking/sharing)
- **2025-10-07**: Thread list will expand dynamically when no thread is selected (Gmail-style)

---

## Related Files

**Core Layout:**
- `app/courses/[courseId]/page.tsx` - Main course page
- `components/course/sidebar-layout.tsx` - Layout container
- `components/course/filter-sidebar.tsx` - Left filter panel
- `components/course/thread-list-sidebar.tsx` - Middle thread list
- `components/course/thread-detail-panel.tsx` - Right detail panel

**Navigation:**
- `components/layout/course-context-bar.tsx` - Tab navigation
- `components/course/course-overview-panel.tsx` - Overview content

**Thread Components:**
- `components/course/sidebar-thread-card.tsx` - Compact thread card
- `components/course/thread-card.tsx` - Full thread card
- `components/course/endorsement-bar.tsx` - Endorsement display
- `components/course/ai-answer-card.tsx` - AI answer component

---

## Changelog

- `2025-10-07` | [Step 2] | Separated Threads/Overview tabs with URL-based routing
- `2025-10-07` | [Step 1] | Removed thread list collapse, made fully responsive
- `2025-10-07` | [Task] | Created task context for thread view UX overhaul

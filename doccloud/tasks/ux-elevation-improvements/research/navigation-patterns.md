# Navigation Patterns Research

**Task:** Enhanced Navigation System for QuokkaQ
**Date:** 2025-10-05
**Researcher:** Component Architect

---

## Executive Summary

Analyzed existing navigation patterns, routing structure, and component architecture to design an enhanced navigation system. Current implementation has only one visible nav link (Dashboard) with search functionality. Application needs clear, intuitive access to all major sections: Dashboard, Courses, Ask Question, and Threads.

---

## 1. Current Navigation Analysis

### Existing Implementation (`components/layout/nav-header.tsx`)

**Current Structure:**
- **Logo:** Links to `/dashboard` (44×44px touch target, accessible)
- **Navigation:** Only "Dashboard" link visible (lines 54-64)
- **Global Search:** Hidden on mobile, visible on desktop (max-w-md)
- **User Menu:** Dropdown with profile, dashboard link, logout

**Key Findings:**
- ✅ **Accessibility:** Uses `role="navigation"` and `aria-label="Main navigation"` (line 54)
- ✅ **Active States:** `isActive()` helper checks pathname (lines 34-36)
- ✅ **Glass Styling:** Uses `glass-panel-strong` and `border-glass` tokens
- ✅ **Responsive:** Hidden on auth pages (lines 25-27)
- ❌ **Limited Links:** Only Dashboard visible, missing Courses, Ask, Threads
- ❌ **No Mobile Nav:** No hamburger menu for mobile
- ❌ **No Breadcrumbs:** Deep pages lack context

**Active State Logic:**
```typescript
const isActive = (path: string) => {
  return pathname?.startsWith(path);
};
```
This works for top-level routes but needs refinement for nested routes (e.g., `/courses/[id]` should highlight "Courses").

---

## 2. Routing Structure Analysis

### Application Routes (from `app/` directory)

| Route | Page | Purpose | Navigation Need |
|-------|------|---------|-----------------|
| `/` | `page.tsx` | Redirect to `/dashboard` or `/login` | Not in nav |
| `/login` | `(auth)/login/page.tsx` | Authentication | Hidden on auth pages |
| `/dashboard` | `dashboard/page.tsx` | Role-based dashboard (student/instructor) | **Primary nav link** |
| `/courses` | `courses/page.tsx` | Redirects to `/dashboard` | **Potential nav link** |
| `/courses/[courseId]` | `courses/[courseId]/page.tsx` | Course detail with threads | **Breadcrumb context** |
| `/ask` | `ask/page.tsx` | New question form | **Primary nav link** |
| `/threads/[threadId]` | `threads/[threadId]/page.tsx` | Thread detail with replies | **Breadcrumb context** |
| `/quokka` | `quokka/page.tsx` | AI assistant page | Not in nav (accessed via FloatingQuokka) |

**Route Hierarchy for Breadcrumbs:**
```
Dashboard
Courses → Course Detail → Thread Detail
Ask Question
```

**Key Insights:**
- `/courses` redirects to `/dashboard` (courses shown inline on dashboard)
- Deep navigation exists: Dashboard → Course → Thread
- "Ask Question" is standalone but can be reached with `?courseId` param

---

## 3. Existing Breadcrumb Patterns

### Course Detail Page (`app/courses/[courseId]/page.tsx`)

Lines 127-134:
```tsx
<nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
  <Link href="/courses" className="hover:text-accent transition-colors">
    Courses
  </Link>
  <span>/</span>
  <span className="text-foreground">{course.code}</span>
</nav>
```

**Pattern:**
- ✅ Uses `aria-label="Breadcrumb"`
- ✅ Separates links with `/` character
- ✅ Current page is non-interactive text
- ✅ Hover states use `hover:text-accent`
- ❌ Links to `/courses` which redirects to `/dashboard`

### Thread Detail Page (`app/threads/[threadId]/page.tsx`)

Lines 108-118:
```tsx
<nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
  <Link href="/courses" className="hover:text-accent transition-colors">
    Courses
  </Link>
  <span>/</span>
  <Link href={`/courses/${thread.courseId}`} className="hover:text-accent transition-colors">
    Course
  </Link>
  <span>/</span>
  <span className="text-foreground">Thread</span>
</nav>
```

**Pattern:**
- ✅ Three-level breadcrumb (Courses → Course → Thread)
- ✅ Consistent styling with course page
- ❌ Generic "Course" label instead of course code/name
- ❌ Generic "Thread" label instead of thread title (truncated)

---

## 4. Component Composition Opportunities

### Existing UI Primitives

**Available in `components/ui/`:**
- `button.tsx` - Button component with QDS variants
- `badge.tsx` - Status badges
- `card.tsx` - Card with glass variants
- `dropdown-menu.tsx` - Radix UI dropdown (used in user menu)
- `dialog.tsx` - Modal dialogs
- `avatar.tsx` - User avatars
- `separator.tsx` - Visual dividers
- `skeleton.tsx` - Loading states
- `global-search.tsx` - Search functionality

**Missing Components:**
- ❌ **Tabs component** - Not in codebase (no shadcn/ui tabs installed)
- ❌ **Sheet component** - Not in codebase (needed for mobile drawer)
- ❌ **Breadcrumb component** - Exists as inline pattern, not reusable

**Recommended shadcn/ui Additions:**
1. **Tabs** - For horizontal desktop navigation (`npx shadcn@latest add tabs`)
2. **Sheet** - For mobile hamburger menu (`npx shadcn@latest add sheet`)

---

## 5. Similar Patterns in Codebase

### Global Search Pattern (`components/ui/global-search.tsx`)

**Relevant Patterns:**
- Uses `Dialog` for mobile search overlay
- Keyboard navigation with arrow keys
- Debounced search input
- Loading states with skeleton
- Empty states with helpful messages

**Lessons for Navigation:**
- Mobile overlay pattern works well for secondary actions
- Keyboard navigation improves accessibility
- Loading states should be instant (no jarring delays)

### Dashboard Navigation Patterns

**Student Dashboard (`app/dashboard/page.tsx`):**
- Course cards link to `/courses/[id]`
- Activity timeline shows recent posts
- Stats cards are non-interactive

**Instructor Dashboard:**
- Unanswered queue links to `/threads/[id]`
- Managed courses link to `/courses/[id]`

**Key Insight:** Dashboard already acts as navigation hub for courses. "Courses" nav link could show all courses or just redirect to dashboard.

---

## 6. Accessibility Requirements (WCAG 2.2 AA)

### Navigation Landmarks
- ✅ Uses `<nav role="navigation" aria-label="Main navigation">`
- ✅ Breadcrumbs use `aria-label="Breadcrumb"`
- ⚠️ Need to ensure unique labels if multiple navs exist

### Keyboard Navigation
- ✅ Current nav links are keyboard accessible
- ⚠️ Need arrow key navigation for tabs (recommended pattern)
- ⚠️ Need Escape key to close mobile menu
- ⚠️ Need focus trap in mobile menu when open

### Touch Targets
- ✅ Logo: 44×44px min (line 46 in nav-header.tsx)
- ✅ User avatar button: 44×44px (h-11 w-11 = 44px)
- ⚠️ Nav links: Currently `px-4 py-2 min-h-[44px]` - good height, width depends on text

### Color Contrast
- ✅ Active state: `text-primary bg-primary/10` (4.5:1+ on glass)
- ✅ Inactive state: `text-muted-foreground` (4.5:1+ on glass)
- ✅ Hover state: `hover:text-primary` (4.5:1+ on glass)
- ⚠️ Need to verify glass panel contrast with backdrop blur

### Screen Reader Considerations
- ✅ `aria-current="page"` on active links (line 57)
- ⚠️ Need `aria-label` on mobile menu button (e.g., "Open navigation menu")
- ⚠️ Need `aria-expanded` state on mobile menu button
- ⚠️ Need to announce current tab when navigating with arrows

---

## 7. Design System (QDS) Integration

### Glass Tokens (from `app/globals.css`)

**Available Glass Surfaces:**
```css
--glass-ultra: rgba(255, 255, 255, 0.4)    /* Ultra transparent */
--glass-strong: rgba(255, 255, 255, 0.6)   /* Strong glass */
--glass-medium: rgba(255, 255, 255, 0.7)   /* Default glass */
--glass-subtle: rgba(255, 255, 255, 0.85)  /* Subtle glass */
```

**Current Nav Uses:**
- `glass-panel-strong` - Main header background
- `border-[var(--border-glass)]` - Bottom border

**Recommendation:**
- **Desktop Tabs:** Use `glass-panel-strong` (current)
- **Active Tab Indicator:** Use `bg-primary/10` with `text-primary` (current pattern)
- **Mobile Sheet:** Use `glass-panel-strong` with `backdrop-blur-xl`

### Color Tokens

**Primary Actions (from `globals.css`):**
```css
--primary: #8A6B3D        /* Active tab, CTAs */
--primary-hover: #6F522C  /* Hover states */
--accent: #2D6CDF         /* Links, interactive elements */
```

**Text Colors:**
```css
--text: #2A2721                /* Foreground text */
--muted: #625C52               /* Muted text (labels) */
--text-muted-foreground: ...   /* Inactive nav items */
```

---

## 8. Mobile Navigation Best Practices

### Responsive Breakpoints

**Current Pattern (from nav-header.tsx):**
- **Mobile (<768px):** Nav links hidden (`hidden md:flex`)
- **Desktop (≥768px):** Nav links visible, search visible

**Recommendation:**
- **Mobile (<768px):** Hamburger menu (Sheet component)
- **Tablet (768px-1024px):** Compact tabs or hamburger
- **Desktop (≥1024px):** Full horizontal tabs

### Hamburger Menu Pattern

**Best Practices:**
1. **Position:** Top-left or top-right (typically left for consistency)
2. **Icon:** Three horizontal lines (Menu icon from Lucide)
3. **Size:** 44×44px minimum touch target
4. **Animation:** Smooth slide-in from left/right
5. **Backdrop:** Semi-transparent overlay to focus attention
6. **Close:** X icon, backdrop click, Escape key

### Mobile Menu Content

**Recommended Structure:**
```
[Logo] QuokkaQ          [X Close]
──────────────────────────────────
Dashboard
Courses
Ask Question
Threads (or "Browse Threads")
──────────────────────────────────
[User Profile Section]
Settings
Logout
```

---

## 9. Navigation Structure Recommendations

### Desktop Navigation (Tabs)

**Primary Links (Left to Right):**
1. **Dashboard** - `/dashboard` (default landing)
2. **Courses** - `/dashboard` (anchor to courses section) OR new `/courses` view
3. **Ask Question** - `/ask` (primary CTA)
4. **Threads** - `/threads` OR `/dashboard` (filter threads only)

**Secondary Elements:**
- **Search:** Global search (existing)
- **User Menu:** Profile dropdown (existing)

### Active State Logic

**Refinement Needed:**
```typescript
// Current (too broad)
const isActive = (path: string) => pathname?.startsWith(path);

// Recommended (more precise)
const isActive = (path: string) => {
  if (path === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/courses';
  }
  if (path === '/ask') {
    return pathname === '/ask';
  }
  if (path === '/courses') {
    return pathname?.startsWith('/courses/');
  }
  if (path === '/threads') {
    return pathname?.startsWith('/threads/');
  }
  return pathname === path;
};
```

### Breadcrumb System

**When to Show:**
- ❌ Dashboard page (no breadcrumbs, top-level)
- ❌ Ask page (no breadcrumbs, top-level)
- ✅ Course detail page (Dashboard → Course)
- ✅ Thread detail page (Dashboard → Course → Thread)

**Breadcrumb Levels:**
```
Dashboard → [Course Code] → [Thread Title (truncated)]
```

---

## 10. Performance Considerations

### Current Performance

**Nav Header:**
- Uses `"use client"` directive (client component)
- Hooks: `useRouter`, `usePathname`, `useCurrentUser`, `useLogout`
- Rendered on every page (except auth pages)

**Optimization Opportunities:**
- ✅ Already memoizes `isActive` calls (not recreated on each render)
- ⚠️ Could memoize navigation items array
- ⚠️ Mobile menu should lazy load Sheet component

### Bundle Size Impact

**Estimated Additions:**
- **Tabs component:** ~2-3 KB (minimal, Radix UI primitive)
- **Sheet component:** ~5-6 KB (includes overlay, animations)
- **Total Impact:** <10 KB gzipped (acceptable for core navigation)

**Recommendation:** Code-split mobile Sheet if possible (dynamic import).

---

## 11. Competitive Analysis (Academic Q&A Platforms)

### Common Patterns

**Piazza:**
- Horizontal tabs: Q&A, Resources, Stats
- Active tab: Underline indicator
- Mobile: Hamburger menu

**Ed Discussion:**
- Vertical sidebar navigation
- Course selector at top
- Threads in main content area

**Canvas Discussions:**
- Left sidebar navigation
- Breadcrumbs for nested discussions
- Mobile: Bottom tab bar

**QuokkaQ Differentiation:**
- Glassmorphism aesthetic (unique)
- Integrated AI assistant (FloatingQuokka)
- Simplified 4-tab structure (less overwhelming)

---

## 12. Key Design Decisions

### Primary Navigation Links

**Recommended:**
1. **Dashboard** - Central hub, always accessible
2. **Ask Question** - Primary CTA for students
3. **Browse Threads** - View all threads across courses (new feature)
4. ~~Courses~~ - **DEFER:** Courses already on dashboard, avoid duplication

**Rationale:**
- Dashboard = Course hub (no separate "Courses" needed)
- "Ask Question" = Clear CTA, encourages engagement
- "Browse Threads" = Discover content across all courses
- Keep to 3-4 links max (reduce cognitive load)

### Mobile Navigation Strategy

**Recommended:** Hamburger Menu (Sheet)
- **Why:** Standard pattern, familiar to users
- **Alternative Considered:** Bottom tab bar (rejected - harder to reach on large phones)

### Active State Indicator

**Recommended:** Background fill + text color
- **Current:** `bg-primary/10 text-primary` (good contrast)
- **Alternative Considered:** Underline only (rejected - harder to see on glass)

### Breadcrumb Implementation

**Recommended:** Reusable `<Breadcrumb>` component
- **Props:** `items: Array<{ label: string; href?: string }>`
- **Styling:** Consistent with existing inline patterns
- **Location:** Inside page content, not in global header

---

## 13. Risks & Mitigations

### Risk 1: Navigation Confusion
**Issue:** Users expect "Courses" link but it's on Dashboard
**Mitigation:** Add "Courses" link that scrolls to courses section on dashboard

### Risk 2: Mobile Menu Performance
**Issue:** Sheet component adds bundle size
**Mitigation:** Lazy load Sheet with dynamic import

### Risk 3: Breadcrumb Verbosity
**Issue:** Long course names and thread titles overflow
**Mitigation:** Truncate with ellipsis, show full text on hover (tooltip)

### Risk 4: Active State False Positives
**Issue:** `/courses/123` highlights "Courses" tab when no "Courses" tab exists
**Mitigation:** Refine `isActive()` logic to map nested routes to correct parent

### Risk 5: Keyboard Navigation Complexity
**Issue:** Arrow key navigation for tabs requires extra JS
**Mitigation:** Use Radix UI Tabs (includes keyboard nav out-of-box)

---

## 14. Related Components to Modify

### Primary Changes
1. **`components/layout/nav-header.tsx`** - Add tabs, mobile menu
2. **New:** `components/ui/tabs.tsx` - Install shadcn/ui tabs
3. **New:** `components/ui/sheet.tsx` - Install shadcn/ui sheet
4. **New:** `components/ui/breadcrumb.tsx` - Reusable breadcrumb component

### Secondary Changes
5. **`app/courses/[courseId]/page.tsx`** - Use new Breadcrumb component
6. **`app/threads/[threadId]/page.tsx`** - Use new Breadcrumb component
7. **`app/layout.tsx`** - No changes (NavHeader already included)

### Optional Enhancements
8. **New:** `app/threads/page.tsx` - "Browse All Threads" view (if adding link)

---

## 15. Open Questions for Design Phase

1. **Should "Courses" be a separate nav link or scroll to dashboard section?**
   - Recommendation: Scroll to dashboard section (avoid duplication)

2. **Should "Browse Threads" show all threads or only user's courses?**
   - Recommendation: User's enrolled courses only (context-aware)

3. **Should breadcrumbs show course code or full course name?**
   - Recommendation: Course code (shorter, less overflow)

4. **Should mobile menu include search or keep search separate?**
   - Recommendation: Keep separate (search is already accessible)

5. **Should tabs support URL hash navigation (#dashboard, #ask)?**
   - Recommendation: No, use full routes (better for SEO, history)

---

## Conclusion

Current navigation is functional but limited. Enhanced system should:
- **Add horizontal tabs** for Desktop (Dashboard, Ask, Threads)
- **Add hamburger menu** for Mobile (Sheet component)
- **Implement reusable Breadcrumb** component for deep navigation
- **Refine active state logic** for nested routes
- **Maintain QDS compliance** (glass tokens, contrast, touch targets)

All patterns exist in codebase or can be added via shadcn/ui. No breaking changes to routing or data layer required.

**Next Step:** Design component architecture in `plans/navigation-enhancement.md`.

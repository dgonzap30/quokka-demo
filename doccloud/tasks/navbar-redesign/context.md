# Task: Icon-Based Navbar Redesign with Enhanced Contrast

**Goal:** Transform the GlobalNavBar into a darker, icon-based navigation with support, settings, account, AI, and ask question icons, featuring hover animations and improved contrast while maintaining QDS design identity.

**In-Scope:**
- Convert "Ask Question" button to icon button
- Add icon buttons for: Support, Settings, Account, AI
- Implement hover animations for all nav icons
- Darken navbar background for better content contrast
- Ensure all icon buttons are keyboard accessible
- Maintain QDS glassmorphism aesthetic
- Update mobile navigation accordingly

**Out-of-Scope:**
- Backend routes for new nav items (use mock/placeholder hrefs)
- Advanced settings pages (buttons can link to /settings, /support, /account)
- Real-time AI chat integration (just an icon that opens a modal or page)
- Multi-level dropdown menus

**Done When:**
- [ ] All routes render without console errors in prod build
- [ ] a11y: keyboard nav + focus ring visible + AA contrast
- [ ] Responsive at 360/768/1024/1280
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] Demo script updated (README section)
- [ ] All icon buttons have proper aria-labels
- [ ] Hover animations are smooth and respect prefers-reduced-motion
- [ ] Navbar has improved contrast with darker background
- [ ] Mobile navigation reflects icon-based changes
- [ ] Search bar remains functional and visible

---

## Constraints

1. Frontend-only scope
2. No breaking changes to mock API
3. QDS compliance (tokens, spacing, radius, shadows)
4. Type safety (no `any`)
5. Component reusability (props-driven)
6. Use only Lucide React icons (already in project)
7. Maintain glassmorphism aesthetic from QDS 2.0
8. Support light and dark modes

---

## Decisions

### Background Approach (QDS Compliance Auditor - 2025-10-12)
**Decision:** Use `--glass-subtle` (85% opacity) with `--blur-xl` (24px) for navbar background
**Rationale:** Existing QDS token provides 25% more opacity than current `--glass-strong`, improving contrast while maintaining glassmorphism aesthetic. No new token creation needed.
**Files:** `doccloud/tasks/navbar-redesign/research/qds-navbar-audit.md`, `doccloud/tasks/navbar-redesign/plans/qds-styling.md`

### Hover Animation Strategy (QDS Compliance Auditor - 2025-10-12)
**Decision:** Scale (1.05×) + color-specific glow using QDS motion tokens (`--duration-medium`: 180ms, `--ease-in-out`)
**Rationale:** Provides tactile feedback without overwhelming. Uses existing `--glow-primary/secondary/accent` tokens. Respects `prefers-reduced-motion`.
**Implementation:** `.icon-button-glass` utility class with hover variants
**Files:** `doccloud/tasks/navbar-redesign/plans/qds-styling.md`

### Icon Selection (Component Architect - 2025-10-12)
**Decision:** MessageSquarePlus (Ask), Sparkles (AI), HelpCircle (Support), Settings (Settings), Keep Avatar (Account)
**Rationale:** Icons align with existing codebase patterns. Sparkles already established as AI identity. HelpCircle universal for support. Settings is recognizable gear icon. Avatar provides personalization.
**Files:** `doccloud/tasks/navbar-redesign/research/component-patterns-navbar.md`

### Layout Strategy (Component Architect - 2025-10-12)
**Decision:** Icon group (gap-3) on right with visual divider between action icons (Ask, AI) and utility icons (Support, Settings). Mobile uses hamburger menu with all actions in drawer.
**Rationale:** Groups by priority. 44x44px buttons + 12px gap = 56px center-to-center (adequate touch separation). Mobile drawer prevents cramming, maintains text labels for discoverability.
**Files:** `doccloud/tasks/navbar-redesign/plans/component-design.md`

### Mobile Approach (Component Architect - 2025-10-12)
**Decision:** Priority-based overflow - desktop shows all icons, mobile shows only hamburger + avatar with full drawer menu containing all actions.
**Rationale:** 5 icon buttons (220px) + existing elements (394px) = 614px exceeds mobile viewport (360px). Drawer pattern established in codebase, familiar UX, no horizontal scroll, maintains text labels for accessibility.
**Files:** `doccloud/tasks/navbar-redesign/research/component-patterns-navbar.md`

### ARIA Strategy (Accessibility Validator - 2025-10-12)
**Decision:** All icon buttons receive explicit `aria-label` + `sr-only` span fallback. Dropdown triggers include `aria-haspopup="true"` and `aria-expanded` state.
**Rationale:** Icon-only buttons lack accessible names without labels. Dual approach (aria-label + sr-only) ensures maximum screen reader compatibility.
**Files:** `research/a11y-icon-nav-audit.md`, `plans/a11y-implementation.md`

### Tooltip Approach (Accessibility Validator - 2025-10-12)
**Decision:** Radix Tooltip with 300ms delay on hover/focus. Tooltips appear on both hover and keyboard focus. Mobile viewports show condensed text labels instead of tooltips.
**Rationale:** 300ms delay prevents tooltip flash during rapid tabbing. Mobile users cannot hover, so text labels provide visual identification. Radix ensures proper ARIA attributes.
**Files:** `plans/a11y-implementation.md`

### Touch Target Size (Accessibility Validator - 2025-10-12)
**Decision:** All icon buttons use `min-h-[44px] min-w-[44px]` custom className to meet WCAG AAA (44×44px) touch targets
**Rationale:** Default Button `size="icon"` renders at 40×40px, which meets WCAG 2.2 AA (24px minimum) but falls short of AAA best practice. Custom sizing avoids breaking existing icon buttons elsewhere.
**Files:** `plans/a11y-implementation.md`

### Focus Indicator Enhancement (Accessibility Validator - 2025-10-12)
**Decision:** Icon buttons use enhanced focus ring: `focus-visible:ring-4 focus-visible:ring-accent/60` (light mode), `ring-accent/80` (dark mode), with 2px offset
**Rationale:** Darker navbar background may reduce default QDS focus indicator contrast. Enhanced ring ensures 3:1 minimum contrast (WCAG 2.4.13). 4px ring with offset provides clear visibility.
**Files:** `plans/a11y-implementation.md`

---

## Risks & Rollback

**Risks:**
- Icon-only navigation may reduce discoverability (mitigate with tooltips)
- Darker navbar might conflict with dark mode (need careful color selection)
- Too many icons in header might feel cluttered (prioritize essential actions)
- Mobile layout might be cramped with all icons (may need hamburger menu)

**Rollback:**
- Git revert to previous commit if navbar breaks responsiveness
- Keep original GlobalNavBar component as backup before editing
- Test on multiple screen sizes before committing

---

## Related Files

- `components/layout/global-nav-bar.tsx` - Main navbar component to redesign
- `components/layout/nav-header.tsx` - Wrapper that uses GlobalNavBar
- `components/layout/mobile-nav.tsx` - Mobile navigation to update
- `lib/utils/nav-config.tsx` - Navigation configuration
- `app/globals.css` - QDS color tokens and glassmorphism styles
- `QDS.md` - Design system reference for colors and tokens

---

## TODO

- [ ] Research: Identify best Lucide icons for each action (Support, Settings, Account, AI, Ask)
- [ ] Design: Plan icon button layout and spacing
- [ ] Design: Determine darker navbar background color using QDS tokens
- [ ] Design: Plan hover animation styles (scale, glow, etc.)
- [ ] Implement: Update GlobalNavBar with icon buttons
- [ ] Implement: Add hover animations with CSS/Tailwind
- [ ] Implement: Ensure accessibility (aria-labels, keyboard nav)
- [ ] Implement: Update mobile navigation
- [ ] Test: Verify responsiveness across breakpoints
- [ ] Test: Check accessibility with keyboard and screen reader
- [ ] Document: Update component props interfaces

---

## Changelog

- `2025-10-12` | [Contrast Fix for Neutral Icons] | Resolved visibility issues with neutral icon hover states
  - **Problem**: Transparent hover backgrounds caused neutral icons (Support, Settings, User) to blend with navbar
  - **Solution**: Added subtle colored backgrounds + color shifts on hover
    - **Support icon**: `hover:bg-accent/5` + `hover:text-accent` (blue highlight)
    - **Settings icon**: `hover:bg-primary/5` + `hover:text-primary` (brown highlight)
    - **User icon**: `hover:bg-secondary/5` + `hover:text-secondary` (olive highlight)
  - **Base icon color**: `text-foreground/80` ensures good contrast at rest
  - **Hover color**: Full opacity QDS semantic colors for clear visibility
  - **Mobile navigation**: Applied matching color treatments with group hover pattern
  - Result: All icons remain visible and distinctive on hover without blocky backgrounds
  - TypeScript: ✅ PASSED | Dev server: ✅ COMPILING
- `2025-10-12` | [Unified Icon Hover Animations] | Applied elegant hover animations across all navbar icons
  - **Ask Question icon**: Added orange/amber outline with triple-layered glow
    - Resting: `text-amber-600/70` with `drop-shadow(0 0 0.5px rgba(245,158,11,0.3))`
    - Hover: Triple glow (2px @ 80%, 6px @ 40%, 12px @ 20%) + 110% scale
  - **All icons now use**: `hover:bg-transparent` to eliminate blocky backgrounds
  - **Unified animation pattern**:
    - Button: 8% scale (`scale-[1.08]`)
    - Icon: 110% scale with 300ms ease-out transitions
    - Group pattern for coordinated hover states
  - **Special icon animations**:
    - AI Assistant (Sparkles): 12° rotation + triple purple glow
    - Settings (gear): 45° rotation on hover
    - Support/User: Simple scale without rotation
  - **Mobile navigation**: All buttons updated with transparent hover and matching transitions
  - Replaced all NavIconButton uses with custom Button implementations for granular control
  - Result: Consistent, elegant hover system across all navbar icons without blocky backgrounds
  - TypeScript: ✅ PASSED | Dev server: ✅ COMPILING
- `2025-10-12` | [AI Icon Elegant Glow Animation] | Perfected AI Assistant icon with elegant glow-focused hover
  - **Removed blocky hover background**: `hover:bg-transparent` prevents default ghost button blue block
  - **Resting state**: `drop-shadow(0 0 0.5px rgba(168,85,247,0.3))` - whisper-soft purple outline at 70% icon opacity
  - **Hover state**: Triple-layered glow creates radiant effect without background block
    - Inner: `2px @ 80%` - bright core glow
    - Middle: `6px @ 40%` - soft mid-range halo
    - Outer: `12px @ 20%` - subtle ambient glow
  - **Icon transformations on hover**:
    - Brightens to full opacity (`text-ai-purple-500`)
    - 8% scale increase (`scale-[1.08]`)
    - 12° rotation for playful spark
  - **300ms ease-out transition** for smooth, polished feel
  - Uses `group` pattern for coordinated button/icon hover states
  - Updated mobile navigation with transparent hover and matching glow
  - Result: Elegant, floating glow effect that radiates from the icon (no blocky background)
  - TypeScript: ✅ PASSED | Dev server: ✅ COMPILING
- `2025-10-12` | [Quokka Conversation Features] | Added Clear Conversation relocation and Post as Thread functionality
  - **Relocated Clear Conversation button** from header to footer action area (no longer overlaps with Dialog close button)
  - Changed to DropdownMenu pattern with MoreVertical icon for better UX (prevents accidental clears)
  - **Added "Post as Thread" feature** for sharing helpful AI conversations with peers and instructors
    - Only visible in course context (when `courseId` exists)
    - Requires at least 2 messages (user + AI response, excluding welcome)
    - Formats conversation as Q&A pairs with markdown headings
    - Auto-tags threads with "ai-conversation" + course code
    - Uses existing `useCreateThread` hook for consistency
    - Shows confirmation dialog and navigation option after posting
  - Footer now has action buttons row between quick prompts and input form
  - Updated AlertDialog description to suggest "Post as Thread" before clearing (course context only)
  - TypeScript: ✅ PASSED | Dev server: ✅ COMPILING | All routes working
- `2025-10-12` | [Quokka Modal Maximized] | Optimized Quokka AI Assistant modal for maximum screen usage
  - Maximized modal dimensions: `max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl h-[95vh]`
  - Responsive sizing: 95% viewport width on mobile, 90% on tablet, max-w-7xl on desktop
  - Height: 95% viewport height for immersive chat experience
  - Removed duplicate close icon (X button in header), keeping only Clear conversation button
  - Dialog component provides built-in close button for consistent UX
  - Verified with Playwright across multiple screen sizes (375px, 768px, 1440px)
  - Chat functionality tested: message sending, AI responses, auto-scroll all working
  - TypeScript: ✅ PASSED | Playwright: ✅ VERIFIED
- `2025-10-12` | [Profile Icon Conversion] | Converted profile/account section to icon button for consistency
  - Replaced Avatar dropdown trigger with User icon button
  - Matches NavIconButton styling: 44x44px touch target, scale hover animation, enhanced focus ring
  - Maintains dropdown menu functionality with user info and logout
  - Removed Avatar component import (no longer needed)
  - TypeScript: ✅ PASSED | Dev server: ✅ RUNNING
- `2025-10-12` | [AI Modal Integration Complete] | Converted AI Assistant to context-aware Dialog modal
  - Created `components/ai/quokka-assistant-modal.tsx` (new component, ~450 lines)
  - Modal opens from navbar AI icon button (no navigation, stays on page)
  - Context-aware based on current page:
    - **Dashboard**: General study assistant mode
    - **Course**: Course-specific assistant with courseCode and courseName
    - **Instructor**: Instructor support mode with teaching strategies
  - Uses Dialog pattern matching AskQuestionModal for consistency
  - Features: Chat history, quick prompts, clear conversation, auto-scroll
  - Accessibility: Focus trap, keyboard nav, aria-labels, screen reader support
  - Updated `components/layout/nav-header.tsx` with modal state management
  - AI button in desktop nav and mobile drawer now opens modal
  - TypeScript: ✅ PASSED | Dev server: ✅ RUNNING | All pages compiling
  - **Cleanup:** Removed FloatingQuokka from course pages (now consolidated in navbar)
- `2025-10-12` | [Implementation Complete] | Icon-based navbar redesign with darker background successfully implemented
  - Created `components/layout/nav-icon-button.tsx` (new reusable component)
  - Updated `components/layout/global-nav-bar.tsx` with icon buttons and darker glass background
  - Updated `components/layout/mobile-nav.tsx` with new action items
  - Updated `components/layout/nav-header.tsx` with all handler props
  - All icon buttons: 44x44px touch targets, aria-labels, tooltips, keyboard accessible
  - Hover animations: scale + glow using QDS tokens, respects prefers-reduced-motion
  - Darker navbar: `backdrop-blur-xl bg-glass-subtle` (85% opacity) for better contrast
  - TypeScript compilation: ✅ PASSED (no errors)
  - ESLint: ✅ PASSED (no errors in source code, only in .netlify build directory)
  - Dev server: ✅ RUNNING (all pages compiling successfully)
  - Ready for manual testing and responsive verification
- `2025-10-12` | [Workflow] | Created navbar redesign task context

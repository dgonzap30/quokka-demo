# Accessibility Compliance Plan: UI Styling Modernization

## Overview

**Goal:** Ensure all styling improvements maintain or enhance WCAG 2.2 Level AA compliance
**Target:** Zero accessibility regressions, fix existing gaps
**Testing Approach:** Automated + Manual + Screen Reader
**Success Criteria:** Lighthouse ≥95, axe violations = 0, manual testing passed

---

## Priority Order

### Phase 1: Critical Fixes (Blocking Issues)
1. Glass effect text readability verification
2. Focus indicator contrast on glass backgrounds
3. Touch target size enforcement (44×44px minimum)

### Phase 2: High Priority Fixes (Significant Barriers)
1. ARIA labels and attributes
2. Form validation accessibility
3. Dynamic content announcements
4. Skip navigation links

### Phase 3: Medium Priority Fixes (Improvements)
1. Semantic HTML enhancements
2. Color-only indicators
3. Heading hierarchy optimization
4. Screen reader optimizations

---

## File Modifications Required

### `/app/globals.css`

#### Fix 1: Enhanced Glass Text Shadow for Readability
**Priority:** Critical
**Current State:** Glass text shadow exists but may be insufficient for all blur levels
**Required Change:** Strengthen text-shadow for glass-strong variant

**Implementation:**
```css
/* Add after existing .glass-text class */
.glass-panel-strong .glass-text,
.glass-strong .glass-text {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* Ensure all text on glass backgrounds has shadow */
.glass-panel *,
.glass-panel-strong *,
[class*="glass-"] * {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Dark mode needs lighter shadow */
.dark .glass-panel *,
.dark .glass-panel-strong *,
.dark [class*="glass-"] * {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

**Test Scenario:**
- Apply glass backgrounds to cards and headings
- Verify text readability with Color Contrast Analyzer
- Test with low vision simulation tools
- Ensure text remains crisp and readable at all blur levels

---

#### Fix 2: Enhanced Focus Indicators for Glass Backgrounds
**Priority:** Critical
**Current State:** Focus indicators may not meet 3:1 contrast on glass backgrounds
**Required Change:** Add box-shadow based focus indicators with guaranteed contrast

**Implementation:**
```css
/* Enhance global focus-visible for glass backgrounds */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  /* Add box-shadow for glass backgrounds */
  box-shadow: 0 0 0 3px var(--background),
              0 0 0 5px var(--ring);
}

/* Specific focus for glass buttons */
.glass-panel button:focus-visible,
.glass-panel-strong button:focus-visible,
[class*="glass-"] button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3),
              var(--shadow-glass-md);
}

/* Dark mode glass focus */
.dark .glass-panel button:focus-visible,
.dark .glass-panel-strong button:focus-visible,
.dark [class*="glass-"] button:focus-visible {
  box-shadow: 0 0 0 4px rgba(134, 169, 246, 0.4),
              var(--shadow-glass-md);
}

/* Glass card focus */
.glass-panel:focus-within,
.glass-panel-strong:focus-within {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

**Test Scenario:**
- Tab through all interactive elements on glass backgrounds
- Verify focus ring visible with 3:1 contrast minimum
- Test in both light and dark modes
- Use keyboard navigation exclusively
- Test with Windows High Contrast Mode

---

#### Fix 3: Touch Target Size Enforcement
**Priority:** Critical
**Current State:** Some interactive elements below 44×44px minimum
**Required Change:** Add utility class to enforce minimum touch targets

**Implementation:**
```css
/* Touch target size enforcement */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Specific enforcement for common elements */
button:not(.touch-target-override) {
  min-height: 44px;
  min-width: 44px;
}

/* Links with sufficient padding */
a.nav-link {
  padding-top: 12px;
  padding-bottom: 12px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

/* Avatar and icon-only buttons */
.avatar-button,
.icon-button {
  height: 44px;
  width: 44px;
}

/* Dropdown menu items */
[role="menuitem"] {
  min-height: 44px;
  padding: 8px 16px;
}
```

**Test Scenario:**
- Measure all interactive elements with DevTools
- Test on mobile device (actual touch interaction)
- Verify spacing between adjacent touch targets (8px minimum)
- Test with motor disability simulation tools
- Verify no accidental taps on adjacent elements

---

### `/components/layout/nav-header.tsx`

#### Fix 1: Add Skip Navigation Link
**Priority:** High
**Current State:** No skip link to bypass navigation
**Required Change:** Add skip link as first focusable element

**Implementation:**
```tsx
// Add at the very top of the return statement
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
>
  Skip to main content
</a>
```

**CSS for sr-only class (add to globals.css if not present):**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

**Test Scenario:**
- Tab once from page load - skip link should appear
- Press Enter - focus should move to main content
- Verify skip link visible and styled correctly
- Test with screen reader announcement

---

#### Fix 2: Add aria-current to Active Navigation
**Priority:** High
**Current State:** Active navigation state indicated by color only
**Required Change:** Add aria-current="page" attribute

**Implementation:**
```tsx
// Update navigation links
<Link
  href="/courses"
  className={`transition-colors hover:text-accent ${
    isActive("/courses") ? "text-accent" : "text-muted-foreground"
  }`}
  aria-current={isActive("/courses") ? "page" : undefined}
>
  Courses
</Link>

// Repeat for all navigation links (/ask, /quokka)
```

**Test Scenario:**
- Navigate to each page
- Verify aria-current="page" set on active link
- Test with screen reader - should announce "current page"
- Visual indicator remains (color) plus semantic indicator

---

#### Fix 3: Increase Avatar Button Touch Target
**Priority:** Critical
**Current State:** Avatar button is 40×40px (4px short)
**Required Change:** Increase to 44×44px minimum

**Implementation:**
```tsx
// Change avatar button class
<Button variant="ghost" className="relative h-11 w-11 rounded-full">
  <Avatar className="h-11 w-11 bg-primary/20">
    <span className="text-sm font-semibold text-primary">
      {user.name.charAt(0).toUpperCase()}
    </span>
  </Avatar>
</Button>
```

**Test Scenario:**
- Measure button size in DevTools (should be 44×44px)
- Test on mobile device with actual touch
- Verify no visual regression
- Ensure adequate spacing from adjacent elements

---

#### Fix 4: Add aria-label to Logo Link
**Priority:** High
**Current State:** Logo link lacks descriptive label
**Required Change:** Add aria-label for screen readers

**Implementation:**
```tsx
<Link
  href="/courses"
  className="flex items-center space-x-2"
  aria-label="QuokkaQ home"
>
  <div className="flex items-center">
    <span className="text-2xl font-bold text-primary">Quokka</span>
    <span className="text-2xl font-bold text-accent">Q</span>
  </div>
</Link>
```

**Test Scenario:**
- Navigate to logo with screen reader
- Verify announcement: "QuokkaQ home, link"
- Test keyboard activation (Enter key)
- Verify navigation to home page

---

### `/app/courses/page.tsx`

#### Fix 1: Add Main Landmark and Heading Hierarchy
**Priority:** High
**Current State:** Implicit main region, could be more explicit
**Required Change:** Wrap content in explicit `<main>` tag with ID for skip link

**Implementation:**
```tsx
// Wrap main content
<main id="main-content" className="min-h-screen p-8">
  <div className="max-w-6xl mx-auto space-y-8">
    {/* Ensure h1 is first heading */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-primary glass-text">
          My Courses
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name}!
        </p>
      </div>
    </div>
    {/* Rest of content */}
  </div>
</main>
```

**Test Scenario:**
- Navigate by landmarks with screen reader (D key in NVDA)
- Verify "main" landmark announced
- Skip link should focus this element
- Verify h1 is first heading on page (after navigation)

---

#### Fix 2: Wrap Course Cards in Article Elements
**Priority:** Medium
**Current State:** Cards lack semantic structure
**Required Change:** Add `<article>` wrapper for each course

**Implementation:**
```tsx
{courses.map((course) => (
  <article key={course.id}>
    <Link href={`/courses/${course.id}`} aria-label={`View course ${course.code}: ${course.name}`}>
      <Card variant="glass-hover" className="h-full transition-all duration-200">
        {/* Card content */}
      </Card>
    </Link>
  </article>
))}
```

**Test Scenario:**
- Navigate by articles with screen reader (A key in NVDA)
- Verify each course announced as separate article
- Link description should include course code and name
- Test keyboard navigation through cards

---

#### Fix 3: Add Empty State Announcement
**Priority:** Medium
**Current State:** Empty state visible but not announced
**Required Change:** Add role="status" for screen reader announcement

**Implementation:**
```tsx
<Card variant="glass" className="p-12 text-center">
  <div role="status" aria-live="polite">
    <p className="text-muted-foreground">
      No courses found. You&apos;re not enrolled in any courses yet.
    </p>
  </div>
</Card>
```

**Test Scenario:**
- Load page with no courses
- Screen reader should announce empty state
- Verify polite announcement (doesn't interrupt)
- Visual appearance unchanged

---

### `/app/courses/[courseId]/page.tsx`

#### Fix 1: Add Breadcrumb Navigation Semantics
**Priority:** High
**Current State:** Breadcrumbs lack semantic markup
**Required Change:** Add nav landmark and proper structure

**Implementation:**
```tsx
<nav aria-label="Breadcrumb" className="mb-4">
  <ol className="flex items-center gap-2 text-sm text-muted-foreground">
    <li>
      <Link href="/courses" className="hover:text-accent">
        Courses
      </Link>
    </li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">
      <span>{course.code}</span>
    </li>
  </ol>
</nav>
```

**Test Scenario:**
- Navigate breadcrumbs with screen reader
- Verify "Breadcrumb navigation" announced
- Current page should be announced as "current page"
- Separator (/) should be hidden from screen readers

---

#### Fix 2: Add Status Badge Role and Context
**Priority:** Medium
**Current State:** Status badges lack semantic role
**Required Change:** Add role="status" and improve context

**Implementation:**
```tsx
<Badge
  className={getStatusBadge(thread.status)}
  role="status"
  aria-label={`Thread status: ${thread.status}`}
>
  {thread.status}
</Badge>
```

**Test Scenario:**
- Navigate to thread card with screen reader
- Verify status announced clearly
- Visual appearance unchanged
- Test all status variants (open, answered, resolved)

---

#### Fix 3: Semantic Time Elements for Dates
**Priority:** Medium
**Current State:** Dates displayed as plain text
**Required Change:** Use `<time>` element with datetime attribute

**Implementation:**
```tsx
<time dateTime={thread.createdAt} className="text-xs text-muted-foreground">
  {new Date(thread.createdAt).toLocaleDateString()}
</time>
```

**Test Scenario:**
- Inspect time element in DevTools
- Verify datetime attribute is ISO 8601 format
- Screen reader should announce date clearly
- Visual appearance unchanged

---

### `/app/threads/[threadId]/page.tsx`

#### Fix 1: Add aria-required to Reply Form
**Priority:** High
**Current State:** Required attribute present but not announced explicitly
**Required Change:** Add aria-required attribute

**Implementation:**
```tsx
<Textarea
  value={replyContent}
  onChange={(e) => setReplyContent(e.target.value)}
  placeholder="Write your reply..."
  rows={5}
  required
  aria-required="true"
  aria-label="Reply content"
/>
```

**Test Scenario:**
- Focus textarea with screen reader
- Verify "required" announced
- Test form submission without content
- Verify HTML5 validation works

---

#### Fix 2: Add Success/Error Announcements for Reply Submission
**Priority:** High
**Current State:** No feedback for screen reader users
**Required Change:** Add aria-live region for status messages

**Implementation:**
```tsx
// Add state for submission status
const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

// In handleSubmitReply
try {
  await createPostMutation.mutateAsync({...});
  setReplyContent("");
  setSubmitStatus('success');
  setTimeout(() => setSubmitStatus('idle'), 3000);
} catch (error) {
  setSubmitStatus('error');
  setTimeout(() => setSubmitStatus('idle'), 5000);
}

// Add announcement region in JSX
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {submitStatus === 'success' && "Reply posted successfully"}
  {submitStatus === 'error' && "Failed to post reply. Please try again."}
</div>
```

**Test Scenario:**
- Submit reply with screen reader active
- Verify success message announced
- Test error scenario (disconnect network)
- Verify error message announced
- Messages should clear after timeout

---

#### Fix 3: Wrap Posts in Article Elements
**Priority:** Medium
**Current State:** Posts lack semantic structure
**Required Change:** Add `<article>` wrapper with aria-label

**Implementation:**
```tsx
{posts.map((post) => (
  <article key={post.id} aria-label={`Reply from user ${post.authorId.slice(-4)}`}>
    <Card variant={post.endorsed ? "glass-liquid" : "glass"}>
      {/* Card content */}
    </Card>
  </article>
))}
```

**Test Scenario:**
- Navigate replies with screen reader (A key)
- Verify each reply announced as article
- Author information should be clear
- Endorsement status announced

---

### `/app/ask/page.tsx`

#### Fix 1: Add aria-required to All Required Fields
**Priority:** High
**Current State:** HTML required attribute only
**Required Change:** Add aria-required="true" to all required inputs

**Implementation:**
```tsx
<Select
  value={selectedCourseId}
  onValueChange={setSelectedCourseId}
  required
  aria-required="true"
>
  {/* Select content */}
</Select>

<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  required
  aria-required="true"
  aria-describedby="title-help"
  maxLength={200}
/>

<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  required
  aria-required="true"
  aria-label="Question details"
  rows={10}
/>
```

**Test Scenario:**
- Focus each field with screen reader
- Verify "required" announced for each
- Test form submission without fields
- Verify validation messages appear

---

#### Fix 2: Add Character Count Announcement
**Priority:** High
**Current State:** Character count visual only
**Required Change:** Add aria-live region for count updates

**Implementation:**
```tsx
// Visible character count
<p className="text-xs text-muted-foreground">
  {title.length}/200 characters
</p>

// Screen reader announcement (updates less frequently to avoid spam)
<span
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {title.length > 180 && `${200 - title.length} characters remaining`}
  {title.length === 200 && "Maximum characters reached"}
</span>
```

**Test Scenario:**
- Type in title field with screen reader
- Verify announcement when approaching limit (180 chars)
- Verify announcement at maximum (200 chars)
- Should not announce on every keystroke (too verbose)

---

#### Fix 3: Add Form Submission Status Announcements
**Priority:** High
**Current State:** No feedback during/after submission
**Required Change:** Add aria-live region for submission status

**Implementation:**
```tsx
// Add state for submission feedback
const [submitFeedback, setSubmitFeedback] = useState<string>('');

// In handleSubmit
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!selectedCourseId || !title.trim() || !content.trim() || !user) return;

  setIsSubmitting(true);
  setSubmitFeedback('Posting your question...');

  try {
    const newThread = await createThreadMutation.mutateAsync({...});
    setSubmitFeedback('Question posted successfully. Redirecting...');
    setTimeout(() => router.push(`/threads/${newThread.id}`), 1000);
  } catch (error) {
    console.error("Failed to create thread:", error);
    setSubmitFeedback('Failed to post question. Please try again.');
    setIsSubmitting(false);
  }
};

// Add announcement region
<div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
  {submitFeedback}
</div>
```

**Test Scenario:**
- Submit form with screen reader
- Verify "Posting your question..." announced
- Verify success message announced
- Test error scenario - verify error announced
- Use assertive for important status updates

---

### `/app/quokka/page.tsx`

#### Fix 1: Add Chat Message Region with Proper ARIA
**Priority:** High
**Current State:** Messages container lacks semantic role
**Required Change:** Add role="log" and aria-label

**Implementation:**
```tsx
<CardContent
  className="flex-1 overflow-y-auto p-4 space-y-4"
  role="log"
  aria-label="Chat message history"
  aria-live="polite"
  aria-atomic="false"
>
  {messages.map((message) => (
    <div
      key={message.id}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`Message from ${message.role === "user" ? "you" : "Quokka AI"}`}
    >
      {/* Message content */}
    </div>
  ))}
</CardContent>
```

**Test Scenario:**
- Open chat with screen reader
- Verify "Chat message history" announced
- New messages should be announced as they arrive
- Navigate messages with screen reader
- Verify role (user vs AI) announced

---

#### Fix 2: Add Thinking State Announcement
**Priority:** High
**Current State:** Thinking indicator visual only
**Required Change:** Add aria-live announcement

**Implementation:**
```tsx
{isThinking && (
  <div className="flex justify-start">
    <div
      className="bg-primary/10 text-foreground rounded-lg p-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-sm">Quokka is thinking...</p>
    </div>
  </div>
)}
```

**Test Scenario:**
- Send message with screen reader active
- Verify "Quokka is thinking..." announced
- Wait for response
- Verify response message announced
- Visual appearance unchanged

---

#### Fix 3: Add Keyboard Shortcut for Input Focus
**Priority:** Medium
**Current State:** No quick way to return focus to input
**Required Change:** Add Ctrl+/ or similar shortcut

**Implementation:**
```tsx
// Add useEffect for keyboard shortcut
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Ctrl+/ or Cmd+/ to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.focus();
    }
  };

  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, []);

// Add instruction to tips
<p className="font-semibold mb-2">💡 Tips:</p>
<ul className="space-y-1 list-disc list-inside">
  <li>Press Ctrl+/ (Cmd+/ on Mac) to focus message input</li>
  {/* Other tips */}
</ul>
```

**Test Scenario:**
- Navigate away from input field
- Press Ctrl+/ (or Cmd+/)
- Verify input field receives focus
- Screen reader should announce input label
- Works from anywhere on page

---

## Testing Checklists

### Contrast Ratio Verification Checklist

**Tools:** Color Contrast Analyzer, Chrome DevTools, axe DevTools

- [ ] **Primary color on white:** #8A6B3D on #FFFFFF = 5.1:1 (Target: ≥4.5:1) ✅
- [ ] **Primary on glass-medium:** #8A6B3D on ~#F2F2F2 = ~4.6:1 (Target: ≥4.5:1) ⚠️
- [ ] **Muted text on white:** #625C52 on #FFFFFF = 5.9:1 (Target: ≥4.5:1) ✅
- [ ] **Muted on glass-medium:** #625C52 on ~#F2F2F2 = ~5.3:1 (Target: ≥4.5:1) ✅
- [ ] **Body text on white:** #2A2721 on #FFFFFF = 14.7:1 (Target: ≥4.5:1) ✅
- [ ] **Body text on glass:** #2A2721 on ~#F2F2F2 = ~13.2:1 (Target: ≥4.5:1) ✅
- [ ] **Accent on white:** #2D6CDF on #FFFFFF = 6.1:1 (Target: ≥4.5:1) ✅
- [ ] **Focus ring on glass:** #2D6CDF on ~#F2F2F2 = ? (Target: ≥3:1) ⚠️
- [ ] **Badge: warning on warning/20:** #B45309 on rgba(180,83,9,0.2) = ? ⚠️
- [ ] **Badge: success on success/20:** #2E7D32 on rgba(46,125,50,0.2) = ? ⚠️
- [ ] **Badge: accent on accent/20:** #2D6CDF on rgba(45,108,223,0.2) = ? ⚠️
- [ ] **Dark mode primary:** #C1A576 on #12110F = 7.2:1 (Target: ≥4.5:1) ✅
- [ ] **Dark mode accent:** #86A9F6 on #12110F = 8.4:1 (Target: ≥4.5:1) ✅
- [ ] **Dark mode glass text:** All combinations ≥4.5:1 ⚠️

**Critical Items:**
- ⚠️ Items marked above must be measured with Color Contrast Analyzer
- ⚠️ Badge combinations need calculation or adjustment
- ⚠️ Focus indicators need verification on all glass backgrounds
- ⚠️ If any ratio < 4.5:1, increase text-shadow or adjust colors

---

### Keyboard Navigation Testing Checklist

**Test with:** Keyboard only (no mouse), Tab/Shift+Tab, Enter, Escape, Arrow keys

#### Navigation Header
- [ ] Tab to skip link (should be first focusable element)
- [ ] Skip link visible on focus
- [ ] Enter on skip link moves to main content
- [ ] Tab to logo link - activates with Enter
- [ ] Tab through navigation links (Courses, Ask, AI Chat)
- [ ] Active link has visible focus indicator
- [ ] Tab to user menu button
- [ ] Enter/Space opens dropdown
- [ ] Arrow keys navigate dropdown items
- [ ] Escape closes dropdown
- [ ] Focus returns to trigger after close
- [ ] All focus indicators visible and high contrast

#### Course List Page
- [ ] Focus moves from header to main content
- [ ] Tab through course cards in logical order
- [ ] Enter on card navigates to course
- [ ] Focus visible on all cards
- [ ] Empty state message reachable and announced
- [ ] No keyboard traps

#### Thread List Page
- [ ] Breadcrumb navigation keyboard accessible
- [ ] Tab through thread cards
- [ ] "Ask Question" button accessible
- [ ] Badge states announced properly
- [ ] Focus order follows visual layout

#### Thread Detail Page
- [ ] Tab through breadcrumb
- [ ] Tab to thread content
- [ ] Tab through replies in order
- [ ] Tab to reply form textarea
- [ ] Submit button accessible with Tab/Enter
- [ ] Focus visible throughout
- [ ] No traps in card layouts

#### Ask Question Form
- [ ] Tab to course select dropdown
- [ ] Arrow keys navigate options
- [ ] Enter selects option
- [ ] Tab to title input
- [ ] Tab to content textarea
- [ ] Tab to tags input (optional)
- [ ] Tab to submit button
- [ ] Tab to cancel button
- [ ] Enter submits form (from submit button)
- [ ] Focus remains on form during submission
- [ ] Error states reachable and announced

#### Quokka Chat
- [ ] Tab to quick prompt buttons
- [ ] Enter activates prompt
- [ ] Tab to message input
- [ ] Ctrl+/ (Cmd+/) focuses input from anywhere
- [ ] Enter sends message
- [ ] Message history not keyboard-navigable (scroll only) - acceptable for chat
- [ ] Focus visible on input and buttons

---

### Screen Reader Testing Checklist

**Test with:** NVDA (Windows/Firefox), VoiceOver (macOS/Safari), JAWS (Windows/Chrome)

#### Global Navigation
- [ ] Skip link announced and functional
- [ ] "QuokkaQ home" link announced correctly
- [ ] Navigation links announced (Courses, Ask Question, AI Chat)
- [ ] Active page indicated with "current page"
- [ ] User menu announced with expanded/collapsed state
- [ ] Dropdown items announced clearly
- [ ] Logout option announced with role

#### Headings & Landmarks
- [ ] H key navigates by headings (h1 → h2 → h3)
- [ ] D key navigates by landmarks (header → main → nav)
- [ ] Heading hierarchy logical (h1 per page, h2 for sections)
- [ ] Main content landmark announced
- [ ] Breadcrumb navigation landmark announced

#### Forms
- [ ] Form controls navigable with F key
- [ ] All labels announced clearly
- [ ] Required fields announced as "required"
- [ ] Character limits announced appropriately
- [ ] Error messages announced when they occur
- [ ] Success messages announced after submission
- [ ] Disabled state announced on disabled buttons

#### Cards & Lists
- [ ] Course cards announced with article role
- [ ] Thread cards announced with full context
- [ ] Status badges announced with role="status"
- [ ] Endorsement status announced
- [ ] Dates announced clearly

#### Chat Interface
- [ ] Chat message history announced as "log"
- [ ] New messages announced as they arrive
- [ ] Message role announced (user vs AI)
- [ ] Thinking indicator announced
- [ ] Quick prompts announced as buttons

#### Dynamic Content
- [ ] Loading states announced
- [ ] Empty states announced
- [ ] Form submission progress announced
- [ ] Error states announced
- [ ] Success confirmations announced

---

### Focus State Testing Checklist

**Test with:** Keyboard navigation, DevTools inspector, High Contrast Mode

#### Focus Visibility
- [ ] All interactive elements show focus indicator
- [ ] Focus ring meets 3:1 contrast against background
- [ ] Focus ring meets 3:1 contrast on glass backgrounds
- [ ] Focus visible in both light and dark modes
- [ ] Focus visible in Windows High Contrast Mode
- [ ] Custom focus styles don't hide focus indicators
- [ ] Focus not hidden by z-index issues

#### Focus Order
- [ ] Tab order follows visual layout (left-to-right, top-to-bottom)
- [ ] Skip link is first focusable element
- [ ] No unexpected focus jumps
- [ ] Focus order logical in card grids
- [ ] Form fields follow visual order
- [ ] Modal dialogs (if present) trap focus correctly

#### Focus Management
- [ ] Focus returns after closing dropdowns
- [ ] Focus moves to relevant content after navigation
- [ ] Focus not lost during dynamic updates
- [ ] Focus trapped in modals/dialogs
- [ ] Escape key closes overlays and returns focus
- [ ] Focus visible during form submission

#### Focus on Glass Backgrounds
- [ ] Glass-primary buttons have visible focus
- [ ] Glass-secondary buttons have visible focus
- [ ] Glass-accent buttons have visible focus
- [ ] Glass cards have visible focus-within state
- [ ] Focus indicators enhanced with box-shadow
- [ ] Focus contrast verified with Color Contrast Analyzer

---

### Touch Target Testing Checklist

**Test with:** Mobile device, Chrome DevTools device emulation, ruler/measure tool

#### Minimum Size (44×44px)
- [ ] All buttons ≥44×44px
- [ ] Avatar button in navigation = 44×44px
- [ ] Navigation links have adequate padding (≥12px vertical)
- [ ] Icon-only buttons ≥44×44px
- [ ] Card links have adequate size
- [ ] Dropdown menu items ≥44px height
- [ ] Form submit buttons ≥44×44px
- [ ] Close buttons ≥44×44px

#### Spacing Between Targets
- [ ] Adjacent buttons have ≥8px spacing
- [ ] Navigation links have adequate separation
- [ ] Card grid has adequate gutters
- [ ] Inline action buttons spaced appropriately
- [ ] Mobile menu items not too close

#### Mobile Testing
- [ ] Test actual touch on mobile device
- [ ] No accidental taps on adjacent elements
- [ ] Buttons easy to tap with thumb
- [ ] Links easy to tap without zooming
- [ ] Form controls easy to interact with

---

## Automated Testing Commands

### Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run accessibility audit on dev server
npm run dev
# In another terminal:
lighthouse http://localhost:3000 --only-categories=accessibility --view

# Repeat for all main routes:
lighthouse http://localhost:3000/courses --only-categories=accessibility
lighthouse http://localhost:3000/courses/cs101 --only-categories=accessibility
lighthouse http://localhost:3000/threads/1 --only-categories=accessibility
lighthouse http://localhost:3000/ask --only-categories=accessibility
lighthouse http://localhost:3000/quokka --only-categories=accessibility
```

**Target Score:** ≥95 for all pages

---

### axe DevTools (Chrome Extension)
```bash
# Install: chrome://extensions → Search "axe DevTools"
# Or use CLI:
npm install -D @axe-core/cli

# Run from command line
npx axe http://localhost:3000 --exit
```

**Target:** 0 violations on all pages

---

### WAVE (Web Accessibility Evaluation Tool)
```bash
# Use browser extension or:
# Visit https://wave.webaim.org/
# Enter http://localhost:3000
```

**Target:** 0 errors, 0 contrast errors

---

## Manual Testing Protocol

### Day 1: Keyboard Navigation
1. Start from homepage
2. Tab through entire application
3. Document all focus issues
4. Test all interactive elements
5. Verify skip links work
6. Test all keyboard shortcuts

### Day 2: Screen Reader (NVDA)
1. Install NVDA (Windows) or use VoiceOver (macOS)
2. Navigate each page from top to bottom
3. Test all headings and landmarks
4. Test all forms and inputs
5. Test dynamic content updates
6. Document all announcement issues

### Day 3: Color Contrast
1. Measure all text color combinations
2. Measure all UI component contrasts
3. Measure focus indicator contrasts
4. Test with glass backgrounds
5. Test badge color combinations
6. Document all failures

### Day 4: Touch Targets & Mobile
1. Measure all interactive elements
2. Test on actual mobile device
3. Verify spacing between targets
4. Test all gestures and taps
5. Document sizing issues

### Day 5: Dark Mode & Themes
1. Switch to dark mode
2. Repeat contrast measurements
3. Verify focus indicators visible
4. Test glass effects in dark mode
5. Document dark mode issues

---

## Success Criteria

### Automated Tests
- ✅ Lighthouse Accessibility Score ≥95 on all pages
- ✅ axe DevTools: 0 violations
- ✅ WAVE: 0 errors

### Manual Tests
- ✅ All keyboard navigation functional
- ✅ All content accessible via screen reader
- ✅ All focus indicators visible (3:1 contrast minimum)
- ✅ All text meets 4.5:1 contrast (3:1 for large text)
- ✅ All interactive elements ≥44×44px
- ✅ All forms accessible with proper labels and error handling
- ✅ All dynamic content announced to screen readers

### WCAG 2.2 Level AA Compliance
- ✅ All Level A criteria met
- ✅ All Level AA criteria met
- ✅ No regressions from styling changes
- ✅ Glass effects don't reduce accessibility

---

## Rollback Plan

If accessibility issues are found post-implementation:

1. **Document the issue** with screenshots and WCAG criteria reference
2. **Assess severity:** Critical/High/Medium
3. **Critical issues:** Revert specific component immediately
4. **High issues:** Fix within 24 hours
5. **Medium issues:** Fix within 1 week

**Revert Command:**
```bash
git revert <commit-hash> --no-commit
# Test the revert
npm run dev
# Verify issue resolved
git commit -m "revert: rollback accessibility regression in <component>"
```

---

## Documentation Requirements

After all fixes implemented:

1. Update `context.md` with accessibility decisions
2. Document color contrast ratios used
3. Document focus state implementation
4. Add accessibility testing to QA checklist
5. Create accessibility component guidelines
6. Document screen reader testing results

**Format:**
```markdown
## Accessibility Decisions

### Focus Indicators
- Used box-shadow based indicators on glass backgrounds
- Maintained 3:1 contrast minimum against all backgrounds
- Enhanced with text-shadow for glass text readability

### Color Contrast
- All text maintains 4.5:1 minimum contrast (AAA where possible)
- Glass backgrounds verified with text-shadow enhancement
- Badge combinations adjusted to meet contrast requirements

### Keyboard Navigation
- Added skip links for main content
- Enforced logical tab order throughout
- All interactive elements keyboard accessible

### Screen Reader Support
- Added ARIA labels and attributes throughout
- Implemented aria-live regions for dynamic content
- Used semantic HTML (article, time, nav) consistently
```

---

## Final Sign-Off Checklist

Before marking task complete:

- [ ] All contrast ratios measured and documented
- [ ] All keyboard navigation tested and functional
- [ ] All screen reader announcements verified
- [ ] All touch targets meet 44×44px minimum
- [ ] All forms accessible with proper validation
- [ ] All dynamic content announced appropriately
- [ ] Lighthouse score ≥95 on all pages
- [ ] axe DevTools shows 0 violations
- [ ] WAVE shows 0 errors
- [ ] Manual testing completed by at least one person
- [ ] Dark mode accessibility verified
- [ ] Documentation updated
- [ ] QA checklist updated
- [ ] No accessibility regressions from baseline

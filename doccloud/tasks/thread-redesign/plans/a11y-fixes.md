# Accessibility Fixes: Thread Components

**Priority Order:**
1. **Critical fixes** (8 violations) - Blocking deployment, WCAG Level A
2. **High priority fixes** (6 violations) - Must fix before release, WCAG Level AA
3. **Medium priority fixes** (3 issues) - Post-launch improvements

---

## File Modifications Required

### 1. `components/course/thread-card.tsx`

---

#### Fix 1: Add Semantic Article Element
**Priority:** Critical (WCAG 1.3.1 Level A)
**Current State:** Entire card wrapped in `<Link>` with no semantic container
**Required Change:** Wrap card content in `<article>` element within the link

**Implementation:**
```tsx
export function ThreadCard({ thread, className }: ThreadCardProps) {
  return (
    <Link
      href={`/threads/${thread.id}`}
      className={className}
      aria-label={`View thread: ${thread.title}, ${thread.status}, ${thread.views} views`}
    >
      <Card variant="glass-hover">
        <article>
          {/* All card content goes here */}
        </article>
      </Card>
    </Link>
  );
}
```

**Changes:**
- Add `<article>` wrapper inside Card component
- Add `aria-label` to Link with descriptive text including thread title, status, and metadata

**Test Scenario:**
- **Keyboard:** Tab to card, should hear "Link, View thread: [title], [status], [views] views"
- **Screen Reader:** NVDA should announce link purpose without entering
- **Visual:** No visual changes expected

---

#### Fix 2: Convert Title to Heading Element
**Priority:** Critical (WCAG 1.3.1 Level A)
**Current State:** `CardTitle` renders as `div`
**Required Change:** Use heading element for thread title

**Implementation:**
```tsx
<h2 className="text-lg font-semibold leading-snug line-clamp-2 glass-text">
  {thread.title}
</h2>
```

**Changes:**
- Replace `<CardTitle>` with `<h2>` element
- Maintain existing className for styling consistency
- Remove CardTitle import if no longer needed

**Alternative:** If CardTitle must remain for consistency with Card API:
```tsx
<CardTitle asChild>
  <h2 className="text-lg font-semibold leading-snug line-clamp-2 glass-text">
    {thread.title}
  </h2>
</CardTitle>
```

**Test Scenario:**
- **Screen Reader:** Navigate by headings (H key in NVDA), should list all thread titles
- **Keyboard:** No change in keyboard navigation
- **Visual:** No visual changes expected

---

#### Fix 3: Add Semantic List for Tags
**Priority:** High (WCAG 1.3.1 Level A)
**Current State:** Tags rendered in flex div
**Required Change:** Use unordered list for tags

**Implementation:**
```tsx
{thread.tags && thread.tags.length > 0 && (
  <>
    <span className="text-border" aria-hidden="true">•</span>
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
      <ul className="flex gap-2 flex-wrap list-none m-0 p-0" aria-label="Thread tags">
        {thread.tags.slice(0, 3).map((tag) => (
          <li key={tag}>
            <Badge variant="outline" className="text-xs">
              {tag}
            </Badge>
          </li>
        ))}
      </ul>
      {thread.tags.length > 3 && (
        <span className="text-muted-foreground" aria-label={`${thread.tags.length - 3} more tags`}>
          +{thread.tags.length - 3}
        </span>
      )}
    </div>
  </>
)}
```

**Changes:**
- Wrap tags in `<ul>` with `aria-label="Thread tags"`
- Each badge wrapped in `<li>`
- Add descriptive aria-label to overflow count
- Reset list styles with `list-none m-0 p-0`

**Test Scenario:**
- **Screen Reader:** Should announce "Thread tags, list, 3 items"
- **Visual:** No visual changes expected

---

#### Fix 4: Enhance StatusBadge ARIA
**Priority:** High (WCAG 4.1.2 Level A)
**Current State:** StatusBadge has no semantic role
**Required Change:** Pass aria-label to StatusBadge

**Implementation:**
```tsx
<StatusBadge
  status={thread.status}
  aria-label={`Thread status: ${thread.status}`}
/>
```

**Test Scenario:**
- **Screen Reader:** Should announce "Thread status: answered" (or current status)
- **Visual:** No changes

---

#### Fix 5: Add Context to Metadata
**Priority:** Medium
**Current State:** Metadata items announced separately
**Required Change:** Group metadata semantically

**Implementation:**
```tsx
<dl className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground glass-text">
  {/* AI Badge */}
  {thread.hasAIAnswer && (
    <>
      <div className="flex items-center gap-1.5">
        <AIBadge
          variant="compact"
          aria-label="This thread has an AI-generated answer"
        />
      </div>
      <span className="text-border" aria-hidden="true">•</span>
    </>
  )}

  {/* Views */}
  <div className="flex items-center gap-1.5">
    <dt className="sr-only">View count</dt>
    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
    <dd>{thread.views} views</dd>
  </div>

  <span className="text-border" aria-hidden="true">•</span>

  {/* Date */}
  <div className="flex items-center gap-1.5">
    <dt className="sr-only">Created on</dt>
    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
    <dd>
      <time dateTime={thread.createdAt}>
        {new Date(thread.createdAt).toLocaleDateString()}
      </time>
    </dd>
  </div>

  {/* Tags section... */}
</dl>
```

**Changes:**
- Use `<dl>` (description list) for metadata
- Add visually-hidden labels with `sr-only` class (needs to be added to globals.css)
- Use `<time>` element with `dateTime` attribute for dates
- Mark bullet separators with `aria-hidden="true"`

**CSS Addition to `app/globals.css`:**
```css
@layer utilities {
  /* Screen Reader Only - Visually Hidden but Accessible */
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
}
```

**Test Scenario:**
- **Screen Reader:** Should announce "View count, 42 views, Created on, October 5, 2025"
- **Visual:** No changes (sr-only is invisible)

---

### 2. `app/threads/[threadId]/page.tsx`

---

#### Fix 6: Add Main Landmark
**Priority:** Critical (WCAG 2.4.1 Level A)
**Current State:** Page wrapped in generic div
**Required Change:** Add `<main>` landmark

**Implementation:**
```tsx
return (
  <main role="main" className="min-h-screen p-8 md:p-12">
    <div className="container-narrow space-y-12">
      {/* All page content */}
    </div>
  </main>
);
```

**Changes:**
- Replace outermost `<div>` with `<main role="main">`
- Keep all styling classes intact

**Test Scenario:**
- **Screen Reader:** Navigate by landmarks (D key in NVDA), should jump to main content
- **Keyboard:** No change
- **Visual:** No visual changes

---

#### Fix 7: Convert Thread Title to H1
**Priority:** Critical (WCAG 1.3.1 Level A)
**Current State:** Thread title is `CardTitle` (div) with `heading-3` class
**Required Change:** Use `<h1>` element

**Implementation:**
```tsx
<CardHeader className="p-8">
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
    <div className="flex-1 space-y-3">
      <h1 className="text-2xl md:text-3xl font-bold leading-snug glass-text">
        {thread.title}
      </h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-subtle glass-text">
        <span><span className="sr-only">View count:</span> {thread.views} views</span>
        <span aria-hidden="true">•</span>
        <span>
          <span className="sr-only">Posted on</span>
          <time dateTime={thread.createdAt}>
            {new Date(thread.createdAt).toLocaleDateString()}
          </time>
        </span>
      </div>
    </div>
    <StatusBadge
      status={thread.status}
      aria-label={`Thread status: ${thread.status}`}
    />
  </div>
</CardHeader>
```

**Changes:**
- Replace `<CardTitle>` with `<h1>` element
- Use `heading-3` class styles directly (text-2xl md:text-3xl)
- Add `sr-only` labels to metadata
- Add `time` element with `dateTime`

**Test Scenario:**
- **Screen Reader:** Page should announce h1 as primary heading
- **Keyboard:** No change
- **Visual:** Should look identical (same sizing via heading-3 classes)

---

#### Fix 8: Add Label to Reply Form Textarea
**Priority:** Critical (WCAG 3.3.2 Level A)
**Current State:** Textarea has no label, only placeholder
**Required Change:** Add proper label element

**Implementation:**
```tsx
<form onSubmit={handleSubmitReply} className="space-y-6">
  <fieldset className="space-y-3 border-0 p-0 m-0">
    <legend className="sr-only">Post a reply to this thread</legend>
    <div className="space-y-2">
      <label
        htmlFor="reply-content"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Your reply
        <span className="text-danger ml-1" aria-label="required">*</span>
      </label>
      <Textarea
        id="reply-content"
        name="reply-content"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write your reply..."
        rows={8}
        className="min-h-[200px] text-base"
        required
        aria-required="true"
        aria-describedby={formError ? "reply-error" : undefined}
        aria-invalid={!!formError}
      />
      {formError && (
        <p
          id="reply-error"
          className="text-sm text-danger mt-2"
          role="alert"
        >
          {formError}
        </p>
      )}
    </div>
  </fieldset>

  <div className="flex justify-end pt-6 border-t border-[var(--border-glass)]">
    <Button
      type="submit"
      variant="glass-primary"
      size="lg"
      disabled={isSubmitting || !replyContent.trim()}
      aria-label={isSubmitting ? "Posting reply" : "Post reply"}
    >
      {isSubmitting ? "Posting..." : "Post Reply"}
    </Button>
  </div>
</form>
```

**Component State Changes:**
```tsx
// Add at top of component with other state
const [formError, setFormError] = useState<string | null>(null);

// Update handleSubmitReply
const handleSubmitReply = async (e: FormEvent) => {
  e.preventDefault();
  if (!replyContent.trim() || !user) return;

  setIsSubmitting(true);
  setFormError(null); // Clear any previous errors

  try {
    await createPostMutation.mutateAsync({
      input: {
        threadId,
        content: replyContent,
      },
      authorId: user.id,
    });
    setReplyContent("");
    setFormError(null);

    // Announce success to screen readers
    const successMessage = document.createElement('div');
    successMessage.setAttribute('role', 'status');
    successMessage.setAttribute('aria-live', 'polite');
    successMessage.textContent = 'Reply posted successfully';
    successMessage.className = 'sr-only';
    document.body.appendChild(successMessage);
    setTimeout(() => document.body.removeChild(successMessage), 3000);

  } catch (error) {
    console.error("Failed to create post:", error);
    setFormError("Failed to post reply. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

**Changes:**
- Add `<fieldset>` and `<legend>` (visually hidden) around form
- Add `<label>` element with `htmlFor="reply-content"`
- Add `id="reply-content"` to Textarea
- Add error state management
- Add `aria-describedby` to connect error message
- Add `aria-invalid` when error present
- Add `role="alert"` to error message
- Add `aria-label` to button for clearer state
- Add success announcement via temporary aria-live region

**Test Scenario:**
- **Screen Reader:** Focus textarea, should announce "Your reply, edit text, required"
- **Error State:** Should announce "Your reply, invalid entry, Failed to post reply. Please try again."
- **Success:** Should announce "Reply posted successfully" after submission
- **Keyboard:** Tab to label, Tab to textarea, Enter submits
- **Visual:** Label appears above textarea

---

#### Fix 9: Add aria-live Region for Form Status
**Priority:** High (WCAG 4.1.3 Level AA)
**Current State:** Form status changes not announced
**Required Change:** Add status region

**Implementation:**
```tsx
// Add after the form, before closing Card
{formStatus && (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {formStatus}
  </div>
)}
```

**Component State:**
```tsx
const [formStatus, setFormStatus] = useState<string>("");

// In handleSubmitReply success:
setFormStatus("Reply posted successfully");
setTimeout(() => setFormStatus(""), 3000);

// In handleSubmitReply error:
setFormStatus("Failed to post reply. Please try again.");
```

**Note:** This is an alternative to the temporary element approach in Fix 8. Choose one method.

**Test Scenario:**
- **Screen Reader:** After submit, should announce status without visual interruption
- **Visual:** No visual change (sr-only)

---

#### Fix 10: Convert Reply Cards to Semantic Articles
**Priority:** High (WCAG 1.3.1 Level A)
**Current State:** Reply cards are generic divs
**Required Change:** Use article element with proper heading structure

**Implementation:**
```tsx
{posts.length > 0 ? (
  <div className="space-y-6">
    {posts.map((post) => (
      <article
        key={post.id}
        aria-labelledby={`reply-${post.id}-author`}
      >
        <Card variant={post.endorsed ? "glass-liquid" : "glass-hover"}>
          <CardHeader className="p-8">
            <div className="flex items-start gap-4">
              <Avatar className="h-11 w-11 avatar-placeholder">
                <span className="text-sm font-semibold">
                  {post.authorId.slice(-2).toUpperCase()}
                </span>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id={`reply-${post.id}-author`}
                    className="font-semibold text-base"
                  >
                    User {post.authorId.slice(-4)}
                  </h3>
                  {post.endorsed && (
                    <Badge
                      variant="outline"
                      className="bg-success/10 text-success border-success/30"
                      aria-label="Endorsed by instructor"
                    >
                      ✓ Endorsed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-subtle glass-text">
                  <span className="sr-only">Posted on </span>
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleString()}
                  </time>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </CardContent>
        </Card>
      </article>
    ))}
  </div>
) : (
  {/* Empty state */}
)}
```

**Changes:**
- Wrap each reply in `<article>` element
- Add `aria-labelledby` pointing to author heading
- Convert author name to `<h3>` element
- Add descriptive aria-label to endorsed badge
- Add sr-only context to timestamp
- Use `<time>` element with `dateTime`

**Test Scenario:**
- **Screen Reader:** Navigate by articles, should announce each reply separately
- **Headings:** Navigate by h3, should list all reply authors
- **Visual:** No visual changes

---

#### Fix 11: Add Skip Link
**Priority:** Medium
**Current State:** No way to bypass breadcrumb and thread content
**Required Change:** Add skip link at top of page

**Implementation:**

**Create new component: `components/layout/skip-to-content.tsx`**
```tsx
"use client";

export function SkipToContent() {
  return (
    <a
      href="#reply-form"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-e2"
    >
      Skip to reply form
    </a>
  );
}
```

**Add to thread detail page:**
```tsx
return (
  <main role="main" className="min-h-screen p-8 md:p-12">
    <SkipToContent />
    <div className="container-narrow space-y-12">
      {/* ... content ... */}

      {/* Reply Form - add id */}
      <Card variant="glass-strong" id="reply-form">
        {/* ... form content ... */}
      </Card>
    </div>
  </main>
);
```

**CSS updates needed in globals.css:**
```css
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
- **Keyboard:** Press Tab immediately after page load, should show "Skip to reply form" link
- **Visual:** Link only visible when focused
- **Activation:** Pressing Enter should jump focus to reply form

---

#### Fix 12: Add Feedback for AI Answer Endorsement
**Priority:** High (WCAG 3.3.1 Level A)
**Current State:** No user feedback after endorsement
**Required Change:** Add status announcement

**Implementation:**
```tsx
const [endorseStatus, setEndorseStatus] = useState<string>("");

const handleEndorseAIAnswer = async () => {
  if (!user || !aiAnswer) return;

  try {
    await endorseAIAnswerMutation.mutateAsync({
      aiAnswerId: aiAnswer.id,
      userId: user.id,
      isInstructor: user.role === "instructor",
    });
    setEndorseStatus("AI answer endorsed successfully");
    setTimeout(() => setEndorseStatus(""), 3000);
  } catch (error) {
    console.error("Failed to endorse AI answer:", error);
    setEndorseStatus("Failed to endorse AI answer. Please try again.");
  }
};

// Add status region after AI answer section
{endorseStatus && (
  <div
    role="status"
    aria-live="polite"
    className="sr-only"
  >
    {endorseStatus}
  </div>
)}
```

**Test Scenario:**
- **Screen Reader:** After clicking endorse, should announce success or error
- **Visual:** No visual change (sr-only)

---

#### Fix 13: Add Semantic Structure to Empty States
**Priority:** Medium (WCAG 1.3.1 Level A)
**Current State:** Empty states are generic cards
**Required Change:** Add role="status" for announcements

**Implementation:**
```tsx
{/* Thread Not Found */}
<Card variant="glass" className="p-16 text-center" role="alert">
  {/* ... content ... */}
</Card>

{/* No Replies Yet */}
<Card variant="glass" className="p-16 text-center" role="status">
  {/* ... content ... */}
</Card>
```

**Changes:**
- Thread not found: Use `role="alert"` for immediate announcement
- No replies: Use `role="status"` for polite announcement

**Test Scenario:**
- **Screen Reader:** Should announce empty state when rendered
- **Visual:** No changes

---

### 3. `components/course/status-badge.tsx`

---

#### Fix 14: Add Semantic Role and Label
**Priority:** High (WCAG 4.1.2 Level A)
**Current State:** Badge is purely visual
**Required Change:** Add role and contextual label

**Implementation:**
```tsx
export interface StatusBadgeProps {
  status: ThreadStatus;
  showIcon?: boolean;
  className?: string;

  // New optional prop for custom aria-label
  "aria-label"?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
  "aria-label": ariaLabel,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // Generate default label if not provided
  const defaultLabel = `Thread status: ${config.label}`;

  return (
    <Badge
      className={cn(
        "flex items-center gap-1.5 font-medium border",
        config.className,
        className
      )}
      role="status"
      aria-label={ariaLabel || defaultLabel}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span aria-hidden="true">{config.label}</span>
    </Badge>
  );
}
```

**Changes:**
- Add `role="status"` to Badge
- Add `aria-label` with descriptive text
- Accept optional custom aria-label via props
- Mark visual text with `aria-hidden` to avoid double announcement

**Test Scenario:**
- **Screen Reader:** Should announce "Thread status: Answered" (or current status)
- **Visual:** No changes
- **Keyboard:** Not focusable (correct - status indicator only)

---

### 4. `components/ui/ai-badge.tsx`

---

#### Fix 15: Enhance Context-Specific Labels
**Priority:** Low (Enhancement)
**Current State:** Generic "AI-powered feature" label
**Required Change:** Allow custom aria-label via props (already supported!)

**Implementation in ThreadCard:**
```tsx
<AIBadge
  variant="compact"
  aria-label="This thread has an AI-generated answer"
/>
```

**No code changes needed in ai-badge.tsx** - component already supports custom aria-label!

**Test Scenario:**
- **Screen Reader:** Should announce contextual label instead of generic one
- **Visual:** No changes

---

### 5. `app/globals.css`

---

#### Fix 16: Add Screen Reader Only Utility
**Priority:** Critical (Required for multiple fixes)
**Current State:** No sr-only class available
**Required Change:** Add utility class

**Implementation:**
```css
@layer utilities {
  /* ... existing utilities ... */

  /* Screen Reader Only - Visually Hidden but Accessible */
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

  /* Focus-visible override for skip links */
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
}
```

**Test Scenario:**
- **Screen Reader:** Elements with sr-only should be announced
- **Visual:** Elements with sr-only should be invisible
- **Keyboard:** Skip links with focus:not-sr-only should become visible on focus

---

## Testing Checklist

### Manual Testing After Fixes

#### Keyboard Navigation
- [ ] Tab through thread list, each card receives focus
- [ ] Tab through thread detail page in logical order
- [ ] Skip link appears on first Tab press
- [ ] Skip link jumps to reply form when activated
- [ ] Reply form textarea receives focus
- [ ] Form submits via Enter key
- [ ] No keyboard traps anywhere
- [ ] Focus indicators visible on all interactive elements
- [ ] Shift+Tab reverses navigation correctly

#### Screen Reader Testing (NVDA on Chrome)
- [ ] Thread cards announced with title, status, metadata
- [ ] Navigate by headings (H) lists all thread titles
- [ ] Thread detail page has h1 for title
- [ ] Section headings are h2 (AI Answer, Replies)
- [ ] Reply author names are h3
- [ ] Navigate by articles (D) lists all replies
- [ ] Reply form label announced when focusing textarea
- [ ] Required field status announced
- [ ] Error messages announced in form
- [ ] Success message announced after posting
- [ ] Status badges announce status clearly
- [ ] AI badge announces presence of AI answer
- [ ] Empty states announced appropriately

#### VoiceOver Testing (Safari on macOS)
- [ ] Same checklist as NVDA
- [ ] Test rotor navigation by headings
- [ ] Test rotor navigation by landmarks
- [ ] Test rotor navigation by forms

#### Color Contrast
- [ ] All text passes WebAIM contrast checker
- [ ] Focus indicators visible on all backgrounds
- [ ] Status badges readable in light and dark modes

#### Form Validation
- [ ] Submit empty form, error announced
- [ ] Submit valid form, success announced
- [ ] Network error handled with announcement
- [ ] Button state changes announced

#### Responsive Testing
- [ ] All fixes work at 360px mobile
- [ ] All fixes work at 768px tablet
- [ ] All fixes work at 1280px desktop
- [ ] Touch targets meet 44x44px minimum

---

## Automated Testing Commands

### TypeScript Validation
```bash
npx tsc --noEmit
```
Expected: No type errors

### Linting
```bash
npm run lint
```
Expected: No accessibility warnings from eslint-plugin-jsx-a11y

### Build Check
```bash
npm run build
```
Expected: Clean production build

---

## Priority Implementation Order

### Phase 1: Critical Fixes (Block Deployment)
**Estimated Time:** 2-3 hours

1. Add sr-only utility class (Fix 16) - **5 minutes**
2. Add label to reply textarea (Fix 8) - **30 minutes**
3. Add main landmark (Fix 6) - **5 minutes**
4. Convert thread title to h1 (Fix 7) - **15 minutes**
5. Add semantic article to ThreadCard (Fix 1) - **20 minutes**
6. Convert ThreadCard title to h2 (Fix 2) - **15 minutes**
7. Add error handling to form (Fix 8 continued) - **45 minutes**

### Phase 2: High Priority Fixes (Pre-Release)
**Estimated Time:** 3-4 hours

1. Add StatusBadge role and label (Fix 14) - **30 minutes**
2. Convert reply cards to articles (Fix 10) - **45 minutes**
3. Add form status announcements (Fix 9) - **30 minutes**
4. Add AI answer endorsement feedback (Fix 12) - **30 minutes**
5. Add semantic list for tags (Fix 3) - **30 minutes**
6. Enhance StatusBadge ARIA in ThreadCard (Fix 4) - **15 minutes**
7. Add context to metadata (Fix 5) - **45 minutes**

### Phase 3: Medium Priority Fixes (Post-Launch)
**Estimated Time:** 2 hours

1. Add skip link (Fix 11) - **45 minutes**
2. Enhance AI badge labels (Fix 15) - **15 minutes**
3. Add semantic structure to empty states (Fix 13) - **30 minutes**

---

## Rollback Plan

### If Critical Issues Found

**Single Component Issue:**
```bash
git revert <commit-hash>
```

**Multiple Components:**
```bash
git revert <commit-range>
```

**Emergency Hotfix:**
1. Identify failing component
2. Revert specific file to previous version
3. Deploy hotfix
4. Investigate and fix properly

### Monitoring After Deployment

1. **Analytics:** Track error rates in form submissions
2. **User Reports:** Monitor for accessibility feedback
3. **Automated Tests:** Run axe-core on production
4. **Screen Reader Testing:** Verify with real users

---

## Success Criteria

### Functional Requirements
- [ ] All forms have visible labels
- [ ] All pages have h1 headings
- [ ] All interactive elements keyboard accessible
- [ ] All status changes announced to screen readers
- [ ] All error states communicated accessibly

### WCAG Compliance
- [ ] Zero Level A violations
- [ ] Zero Level AA violations
- [ ] Best practices followed for Level AAA

### Performance
- [ ] No negative impact on page load time
- [ ] Screen reader performance acceptable (<500ms lag)
- [ ] Keyboard navigation smooth (<100ms response)

---

## Documentation Updates Needed

### Component Documentation
- [ ] Update ThreadCard docs with accessibility features
- [ ] Update thread detail page docs with ARIA patterns
- [ ] Document sr-only class usage
- [ ] Document skip link pattern

### Developer Guidelines
- [ ] Add accessibility checklist to PR template
- [ ] Document form label requirements
- [ ] Document heading hierarchy rules
- [ ] Add screen reader testing guide

---

## Future Improvements

### Post-Launch Enhancements
1. **Live Region Manager:** Centralized aria-live announcement system
2. **Focus Management Library:** Reusable focus trap and restoration
3. **Keyboard Shortcuts:** Add keyboard shortcuts for power users
4. **High Contrast Mode:** Explicit high contrast theme support
5. **Reduced Motion:** Respect prefers-reduced-motion for animations

### Testing Infrastructure
1. **Automated A11y Tests:** Jest + jest-axe for component tests
2. **E2E A11y Tests:** Playwright with @axe-core/playwright
3. **CI/CD Integration:** Block merges with accessibility violations
4. **Screen Reader Testing:** Automated testing with Guidepup

---

## Resources

### WCAG 2.2 References
- [1.3.1 Info and Relationships (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)
- [2.4.1 Bypass Blocks (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
- [3.3.2 Labels or Instructions (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
- [4.1.2 Name, Role, Value (Level A)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- [4.1.3 Status Messages (Level AA)](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### ARIA Specification
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [aria-live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live)
- [aria-labelledby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/download/)

---

**End of Implementation Plan**

This plan provides complete, actionable fixes for all identified accessibility issues. Each fix includes code examples, test scenarios, and priority levels. Follow the phase order to ensure critical blockers are resolved first.

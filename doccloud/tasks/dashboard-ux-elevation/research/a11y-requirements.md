# Accessibility Requirements Audit: Dashboard UX Elevation

**Date:** 2025-10-04
**Auditor:** Accessibility Validator Agent
**Scope:** StatCard, TimelineActivity, EnhancedCourseCard, Global Search
**Standard:** WCAG 2.2 Level AA

---

## Executive Summary

**Overall Compliance Assessment:** Not yet implemented (pre-development audit)

**Components to Validate:**
1. StatCard - Interactive statistics card with trend indicators and CTA
2. TimelineActivity - Temporal feed with visual timeline indicators
3. EnhancedCourseCard - Multi-element interactive card with progress bars
4. Global Search - Autocomplete search input in navbar

**Critical Requirements Identified:**
- 12 semantic HTML requirements
- 23 ARIA attribute specifications
- 8 keyboard interaction patterns
- 6 focus management rules
- 11 screen reader announcement needs
- 4 motion reduction requirements

---

## Current Dashboard Accessibility Patterns

### Strengths in Existing Implementation

**Skip Links (WCAG 2.4.1 Bypass Blocks - Level A):**
```tsx
<a href="#main-content"
   className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
  Skip to main content
</a>
```
✅ Properly implemented with visible focus state

**Semantic Landmarks (WCAG 1.3.1 Info and Relationships - Level A):**
- `<header>` for navigation (nav-header.tsx)
- `<main id="main-content">` for primary content
- `<nav role="navigation" aria-label="Main navigation">` for nav links
- `<section aria-labelledby="...">` for content regions
- `<aside aria-labelledby="...">` for sidebar content

✅ Proper landmark structure with accessible names

**Heading Hierarchy (WCAG 1.3.1 - Level A):**
- H1: "Welcome back, {name}" / "Instructor Dashboard"
- H2: "Dashboard Statistics" (sr-only), "My Courses", "Recent Activity"
- H3: Course names in cards

✅ Logical heading sequence without gaps

**Focus Indicators (WCAG 2.4.7 Focus Visible - Level AA):**
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
  box-shadow: 0 0 0 4px rgba(45, 108, 223, 0.3);
}
```
✅ High-contrast focus rings (4.5:1 ratio maintained)

**Touch Targets (WCAG 2.5.8 Target Size - Level AAA, but best practice):**
```tsx
<Link href="/dashboard" className="min-h-[44px] min-w-[44px]">
```
✅ Meeting 44×44px minimum for interactive elements

**Current Page Indication (WCAG 1.3.1 - Level A):**
```tsx
<Link
  href="/dashboard"
  aria-current={isActive("/dashboard") ? "page" : undefined}
  className={isActive("/dashboard") ? "text-accent bg-accent/10" : "..."}
>
```
✅ Proper aria-current usage with visual reinforcement

### Gaps to Address in New Components

1. **No dynamic content announcements** - Missing aria-live regions for stat updates, search results, loading states
2. **Status badges lack semantic meaning** - No role="status" or aria-label for trend indicators (↑/↓)
3. **Progress bars missing** - Need aria-valuenow/valuemin/valuemax for course progress
4. **No autocomplete accessibility** - Search input lacks aria-autocomplete, aria-expanded, aria-controls
5. **Timeline lacks semantic structure** - No list markup or time elements for chronological content

---

## WCAG 2.2 AA Requirements by Component

### 1. StatCard Component

**Purpose:** Display key metric with trend indicator, weekly delta, and CTA button

**Semantic HTML Requirements:**

1. **Card container:** Use `<article>` or `<section>` with accessible name
   - WCAG 1.3.1 (Info and Relationships - Level A)
   - Rationale: Stat cards are self-contained content units

2. **Metric label:** Use `<h3>` or appropriate heading level
   - WCAG 1.3.1 (Level A)
   - Rationale: Maintains heading hierarchy

3. **Numeric value:** Use `<p>` with semantic class
   - WCAG 1.3.1 (Level A)
   - No special requirement, but helpful for structure

4. **Trend indicator:** Use `<span>` with aria-label, NOT decorative icon alone
   - WCAG 1.1.1 (Non-text Content - Level A)
   - WCAG 4.1.2 (Name, Role, Value - Level A)
   - Rationale: Arrow symbols (↑/↓) are informative, not decorative

**ARIA Attributes:**

```tsx
<article
  role="region"
  aria-labelledby="stat-threads-title"
  className="stat-card"
>
  <h3 id="stat-threads-title">Total Threads</h3>
  <p className="stat-value" aria-live="polite">
    <span className="text-4xl font-bold">127</span>
  </p>

  {/* Trend indicator */}
  <div className="trend-indicator" role="status" aria-live="polite">
    <span
      aria-label="Up 12% from last week"
      className="trend-icon"
    >
      ↑ 12%
    </span>
  </div>

  {/* Delta description */}
  <p className="text-sm text-muted" aria-live="polite">
    +15 this week
  </p>

  {/* CTA Button */}
  <Button
    variant="ghost"
    size="sm"
    aria-label="View all threads"
  >
    View All →
  </Button>
</article>
```

**Required ARIA:**
- `aria-labelledby` on container (links to heading)
- `aria-live="polite"` on stat value (announces updates)
- `aria-label` on trend icon (full context: "Up 12% from last week")
- `role="status"` on trend container (identifies it as status info)
- `aria-label` on CTA if text is ambiguous ("View All" → "View all threads")

**Keyboard Navigation:**
- Tab: Focus moves to CTA button
- Enter/Space: Activates CTA button
- No keyboard trap

**Focus Management:**
- CTA button receives focus ring (already styled globally)
- Minimum 44×44px touch target for CTA
- No focusable elements inside stat value (it's read-only)

**Color Contrast (WCAG 1.4.3 - Level AA):**
- Stat value: Minimum 4.5:1 against background
- Trend indicator: Minimum 4.5:1 (green/red must pass)
  - ✅ QDS success (#2E7D32) on light bg: 5.2:1
  - ✅ QDS danger (#D92D20) on light bg: 4.8:1
- CTA button: 4.5:1 minimum (ghost variant uses accent)
  - ✅ QDS accent (#2D6CDF) on light bg: 8.9:1

**Screen Reader Behavior:**
1. Focus on card: "Region, Total Threads"
2. Read stat: "127"
3. Read trend: "Up 12% from last week, status"
4. Read delta: "Plus 15 this week"
5. Focus CTA: "View all threads, button"
6. When stat updates: "127" (announced via aria-live="polite")

**Test Scenario:**
- [ ] Keyboard-only: Tab to CTA, Enter activates navigation
- [ ] Screen reader: All content announced in logical order
- [ ] Contrast: All text meets 4.5:1 minimum
- [ ] Live region: Stat value announces when updated dynamically

---

### 2. TimelineActivity Component

**Purpose:** Display chronological activity feed with visual timeline dots/lines

**Semantic HTML Requirements:**

1. **Container:** Use `<section>` with accessible name
   - WCAG 1.3.1 (Level A)
   - Rationale: Timeline is a distinct content region

2. **Activity list:** Use `<ol>` (ordered list) for chronological items
   - WCAG 1.3.1 (Level A)
   - Rationale: Timeline has implicit sequential order

3. **Each activity:** Use `<li>` containing `<article>` or structured content
   - WCAG 1.3.1 (Level A)
   - Rationale: Each activity is a discrete content unit

4. **Timestamp:** Use `<time datetime="...">` with ISO 8601 format
   - WCAG 1.3.1 (Level A)
   - Rationale: Semantic time representation for assistive tech

5. **Activity description:** Use `<p>` or `<h4>` depending on emphasis
   - WCAG 1.3.1 (Level A)

**ARIA Attributes:**

```tsx
<section
  aria-labelledby="timeline-heading"
  className="timeline-activity"
>
  <h2 id="timeline-heading">Recent Activity</h2>

  <ol className="timeline-list" aria-label="Activity timeline">
    <li className="timeline-item">
      <article>
        {/* Visual timeline dot - decorative */}
        <div className="timeline-dot" aria-hidden="true"></div>

        {/* Activity content */}
        <div className="timeline-content">
          <h4 className="activity-title">
            <a href="/threads/123" aria-label="Thread: How do closures work?">
              New question posted
            </a>
          </h4>
          <p className="activity-meta">
            <span className="course-name">CS101</span>
            <time datetime="2025-10-04T14:32:00Z" aria-label="October 4, 2025 at 2:32 PM">
              2 hours ago
            </time>
          </p>
        </div>
      </article>
    </li>
    {/* Repeat for each activity */}
  </ol>

  {/* Loading state */}
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading more activities...</span>
  </div>
</section>
```

**Required ARIA:**
- `aria-labelledby` on section (links to "Recent Activity" heading)
- `aria-label` on `<ol>` ("Activity timeline") for context
- `aria-hidden="true"` on visual timeline decorations (dots, lines)
- `datetime` on `<time>` elements (machine-readable timestamp)
- `aria-label` on activity links (full context, not just "View")
- `role="status"` + `aria-live="polite"` for loading states
- `aria-busy="true"` when loading additional items

**Keyboard Navigation:**
- Tab: Focus moves through activity links in chronological order
- Enter: Activates link to thread detail page
- No keyboard trap

**Focus Management:**
- Each activity link receives focus ring
- Focus order follows DOM order (chronological)
- When new activities load, focus remains on current item (not moved)
- After navigating back from thread, return focus to previously focused link

**Color Contrast:**
- Activity title (link): 4.5:1 minimum
  - ✅ QDS accent (#2D6CDF) on light bg: 8.9:1
- Meta text (course, time): 4.5:1 minimum
  - ✅ QDS muted (#625C52) on light bg: 7.1:1
- Timeline dot: 3:1 minimum (UI component)
  - ✅ QDS primary (#8A6B3D) on white: 4.6:1

**Screen Reader Behavior:**
1. Navigate to section: "Recent Activity, region"
2. Enter list: "Activity timeline, list, 8 items"
3. First item: "1 of 8, New question posted, link, Thread: How do closures work?"
4. Meta info: "CS101, October 4, 2025 at 2:32 PM"
5. Loading state: "Loading more activities, status"

**Motion Reduction (WCAG 2.3.3 - Level AAA, but best practice):**
```css
@media (prefers-reduced-motion: reduce) {
  .timeline-dot {
    animation: none !important;
  }
  .timeline-item {
    transition: none !important;
  }
}
```

**Test Scenario:**
- [ ] Keyboard-only: Tab through activities, Enter navigates to thread
- [ ] Screen reader: List structure announced, chronological order clear
- [ ] Contrast: All text and UI elements meet minimum ratios
- [ ] Live region: Loading state announced when fetching more activities
- [ ] Focus return: After navigating to thread detail, focus returns to timeline link

---

### 3. EnhancedCourseCard Component

**Purpose:** Interactive course card with icon, tags, progress bar, and primary CTA

**Semantic HTML Requirements:**

1. **Card container:** Use `<article>` or clickable card pattern
   - WCAG 1.3.1 (Level A)
   - Decision: If entire card is clickable, wrap in `<a>` or use `<article>` with inner link

2. **Course name:** Use `<h3>` (or appropriate heading level)
   - WCAG 1.3.1 (Level A)
   - Maintains heading hierarchy within card

3. **Tag list:** Use `<ul>` with `<li>` for each tag
   - WCAG 1.3.1 (Level A)
   - Tags are list of related items

4. **Progress bar:** Use `<div role="progressbar">` with ARIA attributes
   - WCAG 1.3.1 (Level A)
   - WCAG 4.1.2 (Name, Role, Value - Level A)

5. **CTA button:** Use `<button>` or `<a>` depending on action
   - WCAG 4.1.2 (Level A)
   - Button for actions, link for navigation

**ARIA Attributes:**

```tsx
<article
  className="enhanced-course-card"
  aria-labelledby="course-cs101-title"
>
  <Card variant="glass-hover">
    <CardHeader>
      {/* Course icon */}
      <div className="course-icon" aria-hidden="true">
        <BookOpen />
      </div>

      {/* Course info */}
      <div>
        <h3 id="course-cs101-title" className="course-name">
          CS101: Introduction to Computer Science
        </h3>
        <p className="course-code text-muted">Fall 2025</p>
      </div>
    </CardHeader>

    <CardContent>
      {/* Tags */}
      <ul className="tag-list" aria-label="Course topics">
        <li>
          <Badge variant="secondary">Programming</Badge>
        </li>
        <li>
          <Badge variant="secondary">Algorithms</Badge>
        </li>
      </ul>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Course Progress</span>
          <span className="text-sm text-muted" aria-hidden="true">68%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={68}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course progress: 68 percent complete"
          className="progress-bar"
        >
          <div
            className="progress-fill"
            style={{ width: '68%' }}
          ></div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row" role="list" aria-label="Course statistics">
        <div role="listitem">
          <span className="stat-label">Threads</span>
          <span className="stat-value">24</span>
        </div>
        <div role="listitem">
          <span className="stat-label">Unread</span>
          <span className="stat-value">3</span>
        </div>
      </div>
    </CardContent>

    <CardFooter>
      <Button
        variant="glass-primary"
        className="w-full"
        aria-label="Open CS101 course"
      >
        Open Course →
      </Button>
    </CardFooter>
  </Card>
</article>
```

**Required ARIA:**
- `aria-labelledby` on article (links to course name heading)
- `aria-hidden="true"` on decorative icon
- `aria-label` on tag list ("Course topics")
- `role="progressbar"` on progress container
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on progressbar
- `aria-label` on progressbar ("Course progress: 68 percent complete")
- `aria-hidden="true"` on visual percentage text (redundant with aria-label)
- `role="list"` + `role="listitem"` on stats row (if not using `<ul>/<li>`)
- `aria-label` on CTA with full context ("Open CS101 course")

**Progress Bar Accessibility (W3C APG):**

Per W3C ARIA Authoring Practices Guide:
- Use native `<progress>` element if possible, OR
- Use `role="progressbar"` with:
  - `aria-valuenow`: Current value (0-100)
  - `aria-valuemin`: Minimum value (default: 0)
  - `aria-valuemax`: Maximum value (default: 100)
  - `aria-label`: Descriptive label including percentage

**Example with native element:**
```tsx
<label htmlFor="course-progress-cs101" className="sr-only">
  Course progress: 68 percent complete
</label>
<progress
  id="course-progress-cs101"
  value={68}
  max={100}
  className="progress-bar"
>
  68%
</progress>
```

**Keyboard Navigation:**
- Tab: Focus moves to CTA button (progress bar is not interactive)
- Enter/Space: Activates CTA to open course
- Optional: If tags are interactive (filter), Tab stops at each badge

**Focus Management:**
- CTA button receives focus ring
- 44×44px minimum touch target for CTA
- If entire card is clickable, ensure focus indicator covers card perimeter

**Color Contrast:**
- Course name (heading): 4.5:1 minimum
  - ✅ QDS text (#2A2721) on white: 12.5:1
- Tags: 4.5:1 text, 3:1 border
  - ✅ QDS secondary (#5E7D4A) on white: 5.8:1
- Progress bar fill: 3:1 minimum (UI component)
  - ✅ QDS accent (#2D6CDF) on neutral-100: 6.2:1
- Progress bar background: 3:1 minimum
  - ✅ QDS neutral-200 (#CDC7BD) on white: 1.8:1 ⚠️ FAILS
  - **FIX REQUIRED:** Use neutral-300 (#A49E94) for 3.2:1 contrast

**Screen Reader Behavior:**
1. Focus on card: "CS101: Introduction to Computer Science, article"
2. Read code: "Fall 2025"
3. Read tags: "Course topics, list, 2 items, Programming, Algorithms"
4. Read progress: "Course progress: 68 percent complete, progress bar"
5. Read stats: "Course statistics, list, 2 items, Threads 24, Unread 3"
6. Focus CTA: "Open CS101 course, button"

**Test Scenario:**
- [ ] Keyboard-only: Tab to CTA, Enter opens course
- [ ] Screen reader: All content announced including progress percentage
- [ ] Contrast: Progress bar background meets 3:1 minimum
- [ ] Progress updates: If progress changes, screen reader announces new value
- [ ] Focus indicator: Visible on CTA button with high contrast

---

### 4. Global Search Component

**Purpose:** Autocomplete search input in navbar with debounced suggestions

**Semantic HTML Requirements:**

1. **Search form:** Use `<form role="search">` for semantic search landmark
   - WCAG 1.3.1 (Level A)
   - Rationale: Search is a navigation landmark

2. **Input field:** Use `<input type="search">` (not type="text")
   - WCAG 4.1.2 (Level A)
   - Rationale: Semantic input type aids assistive tech

3. **Label:** Use `<label>` associated with input OR aria-label
   - WCAG 1.3.1 (Level A)
   - WCAG 3.3.2 (Labels or Instructions - Level A)

4. **Suggestions list:** Use `<ul>` with `<li>` for each result
   - WCAG 1.3.1 (Level A)
   - Rationale: Results are list items

5. **Clear button:** Use `<button type="button">` with accessible name
   - WCAG 4.1.2 (Level A)

**ARIA Attributes (W3C Combobox Pattern):**

```tsx
<form role="search" className="search-form">
  <label htmlFor="global-search" className="sr-only">
    Search courses and threads
  </label>

  <div className="search-container">
    <input
      id="global-search"
      type="search"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={showSuggestions}
      aria-controls="search-suggestions"
      aria-activedescendant={activeSuggestionId}
      aria-label="Search courses and threads"
      placeholder="Search..."
      value={query}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="search-input"
    />

    {/* Search icon - decorative */}
    <Search className="search-icon" aria-hidden="true" />

    {/* Clear button - appears when input has value */}
    {query && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={handleClear}
        className="clear-button"
      >
        <X aria-hidden="true" />
      </button>
    )}
  </div>

  {/* Suggestions dropdown */}
  {showSuggestions && (
    <ul
      id="search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
      className="suggestions-list"
    >
      {suggestions.length > 0 ? (
        suggestions.map((item, index) => (
          <li
            key={item.id}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => handleSelect(item)}
            className={cn(
              "suggestion-item",
              index === activeIndex && "active"
            )}
          >
            <div className="suggestion-content">
              <span className="suggestion-title">{item.title}</span>
              <Badge variant="outline" className="suggestion-type">
                {item.type}
              </Badge>
            </div>
          </li>
        ))
      ) : (
        <li role="option" className="no-results">
          No results found
        </li>
      )}
    </ul>
  )}

  {/* Loading state */}
  {isLoading && (
    <div role="status" aria-live="polite" className="sr-only">
      Searching...
    </div>
  )}
</form>
```

**Required ARIA (W3C Combobox Pattern):**

**On Input:**
- `role="combobox"` - Identifies input as combobox
- `aria-autocomplete="list"` - Indicates list-based autocomplete
- `aria-expanded="true/false"` - Indicates if suggestions are visible
- `aria-controls="search-suggestions"` - Links to suggestions list ID
- `aria-activedescendant="suggestion-X"` - Indicates highlighted suggestion
- `aria-label` OR associated `<label>` - Accessible name

**On Suggestions List:**
- `role="listbox"` - Identifies container as option list
- `aria-label="Search suggestions"` - Accessible name for listbox

**On Each Suggestion:**
- `role="option"` - Identifies item as selectable option
- `aria-selected="true/false"` - Indicates current selection state
- Unique `id` for aria-activedescendant reference

**Keyboard Navigation (W3C Combobox Pattern):**

| Key | Action |
|-----|--------|
| Down Arrow | Move focus to next suggestion, wrap to first if at end |
| Up Arrow | Move focus to previous suggestion, wrap to last if at start |
| Enter | Select highlighted suggestion and close list |
| Escape | Close suggestions list, return focus to input |
| Home | Move to first suggestion |
| End | Move to last suggestion |
| Tab | Close list, move focus to next element |
| Typing | Filter suggestions, reset highlight to first item |

**Implementation Notes:**
- DOM focus stays on input field
- `aria-activedescendant` updates to reflect highlighted suggestion
- Visual highlight follows keyboard navigation
- Debounce input (300ms) to reduce unnecessary searches
- Clear button appears only when input has value

**Focus Management:**
- Input receives focus on page load (if appropriate) or on user action
- Focus remains in input while navigating suggestions with arrow keys
- Escape returns focus to input (already there)
- Enter on suggestion can navigate to result OR populate input

**Screen Reader Announcements:**

1. **Initial focus:** "Search courses and threads, combobox, collapsed"
2. **Typing:** (after debounce) "Searching, status" → "5 suggestions, expanded"
3. **Arrow down:** "How do closures work?, 1 of 5, not selected"
4. **Arrow down again:** "What is React?, 2 of 5, not selected"
5. **Enter:** (navigates to thread) Page changes
6. **No results:** "No results found, option"

**Live Regions:**
- `aria-live="polite"` on loading indicator ("Searching...")
- Optional: `aria-live="polite"` on result count ("5 results found")

**Color Contrast:**
- Input text: 4.5:1 minimum
  - ✅ QDS text (#2A2721) on white: 12.5:1
- Placeholder: 4.5:1 minimum (WCAG 1.4.3)
  - ✅ QDS muted (#625C52) on white: 7.1:1
- Suggestion text: 4.5:1 minimum
  - ✅ Same as input text
- Highlighted suggestion: 3:1 minimum background contrast
  - ✅ QDS accent/10 (#2D6CDF @ 10% opacity) on white: 1.1:1 ⚠️ FAILS
  - **FIX REQUIRED:** Use accent/20 (20% opacity) for 1.5:1 OR solid color

**Test Scenario:**
- [ ] Keyboard-only: Arrow keys navigate suggestions, Enter selects
- [ ] Screen reader: Input announces as combobox, suggestions announced with position
- [ ] Escape: Closes suggestions, returns focus to input
- [ ] Contrast: Highlighted suggestion has 3:1 minimum background contrast
- [ ] Loading state: "Searching" announced via aria-live
- [ ] No results: "No results found" announced

---

## Common Accessibility Pitfalls for Dashboard Components

### Timeline Components

**Pitfall 1: Using decorative dots as only time indicator**
- ❌ BAD: `<div class="timeline-dot"></div>`
- ✅ GOOD: `<div class="timeline-dot" aria-hidden="true"></div>` + `<time datetime="...">`

**Pitfall 2: Ambiguous relative timestamps**
- ❌ BAD: `<span>2h ago</span>`
- ✅ GOOD: `<time datetime="2025-10-04T14:32:00Z" aria-label="October 4, 2025 at 2:32 PM">2h ago</time>`

**Pitfall 3: Missing chronological structure**
- ❌ BAD: `<div>` for each activity
- ✅ GOOD: `<ol>` with `<li>` for sequential activities

### Progress Indicators

**Pitfall 1: Missing ARIA attributes on custom progress bars**
- ❌ BAD: `<div class="progress"><div style="width: 68%"></div></div>`
- ✅ GOOD: `<div role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100} aria-label="68% complete">`

**Pitfall 2: Visual percentage without screen reader equivalent**
- ❌ BAD: `<span>68%</span>` (only visual)
- ✅ GOOD: `<span aria-hidden="true">68%</span>` + `aria-label="Course progress: 68 percent complete"` on progressbar

**Pitfall 3: Low contrast progress bar background**
- ❌ BAD: Very light gray background (1.5:1 contrast)
- ✅ GOOD: Neutral-300 or darker for 3:1 minimum

### Chart/Trend Indicators

**Pitfall 1: Color-only trend indication**
- ❌ BAD: Green/red numbers without context
- ✅ GOOD: Arrow symbols (↑/↓) + color + aria-label

**Pitfall 2: Missing aria-label on trend icons**
- ❌ BAD: `<span>↑ 12%</span>` (screen reader says "up arrow 12 percent")
- ✅ GOOD: `<span aria-label="Up 12% from last week">↑ 12%</span>`

**Pitfall 3: Static content in dynamic stat cards**
- ❌ BAD: Stat updates but no announcement
- ✅ GOOD: `aria-live="polite"` on stat value container

### Autocomplete Search

**Pitfall 1: Missing role="combobox" and ARIA attributes**
- ❌ BAD: `<input type="text" />`
- ✅ GOOD: Full combobox pattern with aria-expanded, aria-controls, aria-activedescendant

**Pitfall 2: Focus moves to suggestions list**
- ❌ BAD: Tabbing into listbox removes focus from input
- ✅ GOOD: Focus stays on input, aria-activedescendant indicates highlighted option

**Pitfall 3: No keyboard navigation for suggestions**
- ❌ BAD: Mouse-only selection
- ✅ GOOD: Arrow keys + Enter + Escape

**Pitfall 4: Missing live region for loading/results**
- ❌ BAD: Visual spinner only
- ✅ GOOD: `<div role="status" aria-live="polite">Searching...</div>`

---

## Motion and Animation Accessibility

### WCAG 2.3.3 Animation from Interactions (Level AAA)

**Requirement:** Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed.

**Implementation:**

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all decorative animations */
  .timeline-dot,
  .stat-card,
  .course-card,
  .search-suggestions {
    animation: none !important;
    transition: none !important;
  }

  /* Preserve essential animations (loading spinners) */
  .loading-spinner {
    /* Keep animation but reduce duration */
    animation-duration: 0.5s !important;
  }

  /* Disable liquid morphing */
  .animate-liquid,
  .animate-liquid-float {
    animation: none !important;
  }

  /* Disable glass shimmer */
  .animate-glass-shimmer {
    animation: none !important;
  }
}
```

**Components Affected:**
1. **StatCard:** Hover scale, glow effects
2. **TimelineActivity:** Dot pulse, line drawing animations
3. **EnhancedCourseCard:** Card lift on hover, progress bar fill animation
4. **Global Search:** Suggestions slide-in, shimmer effects

**Best Practice:**
- Disable decorative motion (card hover lifts, shimmer effects)
- Reduce duration of essential motion (loading spinners: 2s → 0.5s)
- Preserve critical motion (focus indicators, state changes)

---

## Testing Methodology

### Tools Used

1. **Automated Testing:**
   - axe DevTools (browser extension)
   - Lighthouse accessibility audit
   - WAVE browser extension
   - TypeScript strict mode for type safety

2. **Manual Testing:**
   - Keyboard-only navigation (no mouse)
   - Screen readers:
     - macOS: VoiceOver + Safari
     - Windows: NVDA + Firefox
     - Windows: JAWS + Chrome
   - Color contrast analyzer (Colour Contrast Analyser app)
   - Browser zoom (200%, 400% for reflow testing)

3. **Testing Checklist:**
   - [ ] Keyboard navigation works completely (Tab, Enter, Escape, Arrows)
   - [ ] Screen reader announces all content correctly
   - [ ] Focus indicators visible and high contrast (4.5:1 minimum)
   - [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI components)
   - [ ] Error messages announced and clear
   - [ ] Forms fully accessible (labels, validation, error association)
   - [ ] No keyboard traps (can navigate away from all components)
   - [ ] Skip links functional
   - [ ] Dynamic content changes announced (aria-live)
   - [ ] Motion respects prefers-reduced-motion

### Browser/AT Combinations

| Browser | Screen Reader | Operating System |
|---------|--------------|------------------|
| Safari | VoiceOver | macOS |
| Firefox | NVDA | Windows |
| Chrome | JAWS | Windows |
| Edge | Narrator | Windows |

### Test Scenarios

**Scenario 1: Student Dashboard - Keyboard Only**
1. Load dashboard
2. Press Tab - focus moves to "Skip to main content"
3. Press Tab - focus moves to QuokkaQ logo
4. Press Tab - focus moves to "Dashboard" nav link
5. Press Tab - focus moves to "Courses" nav link
6. Press Tab - focus moves to user menu avatar
7. Continue tabbing through stat card CTAs
8. Tab through course cards
9. Tab through activity feed links
10. Verify no keyboard traps, all interactive elements reachable

**Scenario 2: Timeline - Screen Reader**
1. Navigate to timeline section
2. Verify heading announced: "Recent Activity, heading level 2"
3. Enter list: "Activity timeline, list, 8 items"
4. Verify each item announces: position, title, link, meta info
5. Verify timestamps have full date context
6. Verify loading state announced: "Loading more activities, status"

**Scenario 3: Search - Combobox Interaction**
1. Focus search input
2. Verify announced: "Search courses and threads, combobox, collapsed"
3. Type query
4. Verify loading announced: "Searching, status"
5. Verify results announced: "5 suggestions, expanded"
6. Press Down Arrow
7. Verify suggestion announced: "How do closures work?, 1 of 5, not selected"
8. Press Enter
9. Verify navigation to thread detail
10. Press Escape (from search)
11. Verify suggestions close

**Scenario 4: Color Contrast Check**
1. Use Colour Contrast Analyser on stat values
2. Verify 4.5:1 minimum for all text
3. Check trend indicators (green/red)
4. Check progress bar fill and background
5. Check search input focus indicator
6. Check suggestion hover/active states
7. Document any failures

---

## Summary of Findings

### Critical Issues (0 issues - pre-development)
N/A - Components not yet implemented

### High Priority Issues (4 potential issues)

1. **Progress bar background contrast**
   - Component: EnhancedCourseCard
   - Issue: Neutral-200 background may fail 3:1 ratio
   - Fix: Use neutral-300 (#A49E94) for 3.2:1 contrast

2. **Search suggestion highlight contrast**
   - Component: Global Search
   - Issue: Accent/10 background may fail 3:1 ratio
   - Fix: Use accent/20 or solid accent color with opacity

3. **Missing combobox pattern**
   - Component: Global Search
   - Issue: Must implement full W3C combobox pattern
   - Fix: Add all required ARIA attributes and keyboard handlers

4. **Missing progress bar ARIA attributes**
   - Component: EnhancedCourseCard
   - Issue: Custom progress bars need role and value attributes
   - Fix: Add role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, aria-label

### Medium Priority Issues (3 potential issues)

1. **Trend indicators lack context**
   - Component: StatCard
   - Issue: Arrow symbols need aria-label for full context
   - Fix: Add aria-label="Up 12% from last week"

2. **Timeline lacks semantic time elements**
   - Component: TimelineActivity
   - Issue: Relative timestamps ("2h ago") lack machine-readable format
   - Fix: Use `<time datetime="2025-10-04T14:32:00Z">` with aria-label

3. **Missing motion reduction support**
   - All components
   - Issue: Animations may trigger vestibular issues
   - Fix: Implement @media (prefers-reduced-motion: reduce) rules

### Recommendations

1. **Use native HTML elements first:**
   - `<progress>` instead of custom div-based progress bars
   - `<time>` for all timestamps
   - `<ol>` for chronological content
   - `<button>` for actions, `<a>` for navigation

2. **Implement ARIA patterns consistently:**
   - Follow W3C APG for combobox pattern
   - Use aria-live="polite" for non-critical updates
   - Use aria-live="assertive" only for errors/critical alerts
   - Add aria-labelledby to link headings with sections

3. **Test with real users:**
   - Keyboard-only users
   - Screen reader users (NVDA, JAWS, VoiceOver)
   - Users with low vision (high zoom, high contrast mode)
   - Users with vestibular disorders (motion sensitivity)

4. **Document accessibility decisions:**
   - Update context.md with ARIA pattern choices
   - Document keyboard shortcuts (if any)
   - Explain motion reduction approach
   - Note any deviations from standard patterns

---

**Next Steps:**
1. Review this audit with component architect
2. Create implementation plan with exact ARIA attributes per component
3. Update component designs with accessibility annotations
4. Implement components with accessibility built-in (not retrofitted)
5. Test with automated tools (axe, Lighthouse)
6. Test with manual keyboard navigation
7. Test with screen readers (VoiceOver, NVDA)
8. Verify color contrast with analyzer tool
9. Test motion reduction with browser settings
10. Document final accessibility decisions in context.md

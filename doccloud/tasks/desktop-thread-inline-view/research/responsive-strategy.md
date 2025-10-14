# Responsive Thread Display Strategy - Research

**Date:** 2025-10-14
**Agent:** Component Architect (Research)

---

## Current Implementation Analysis

### Component Structure

```
CourseDetailPage
├── SidebarLayout (3-column grid)
│   ├── FilterSidebar (left)
│   ├── ThreadListSidebar (middle)
│   └── children (right) - CURRENTLY EMPTY
└── ThreadModal (overlay)
    └── ThreadDetailPanel (content)
```

### Current Behavior
- **All Viewports**: Thread opens in ThreadModal (95vw × 95vh)
- **Desktop Issue**: Third column of SidebarLayout unused
- **Result**: No Gmail-style expanding interface

---

## Viewport Breakpoints

### Existing SidebarLayout Breakpoints
- Mobile: < 768px (1-column, drawer overlays)
- Tablet: 768-1023px (2-column)
- Desktop: ≥ 1024px (3-column)

### Recommended Threading Breakpoints
- **Mobile (< 768px)**: ThreadModal full-screen
- **Desktop (≥ 768px)**: Inline in SidebarLayout third column

**Rationale**: Aligns with existing SidebarLayout grid logic, tablets benefit from inline view

---

## Implementation Approaches

### Approach A: useMediaQuery Hook
```typescript
// Custom hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 767px)');
```

**Pros:**
- Clean, reusable hook
- Automatic updates on resize
- TypeScript friendly
- Matches CSS breakpoints exactly

**Cons:**
- Client-side only (hydration mismatch possible)
- Requires useEffect

### Approach B: CSS-Only (display classes)
```typescript
<div className="block md:hidden">
  <ThreadModal ... />
</div>
<div className="hidden md:block">
  <ThreadDetailPanel ... />
</div>
```

**Pros:**
- SSR friendly
- No JavaScript required
- Simpler implementation
- No hydration issues

**Cons:**
- Renders both components (hidden vs visible)
- Duplicate rendering of ThreadDetailPanel
- Less control over behavior differences

### Approach C: Hybrid (CSS + Conditional)
```typescript
const isMobile = useMediaQuery('(max-width: 767px)');

// Only render one at a time
{isMobile ? (
  <ThreadModal ... />
) : (
  <SidebarLayout>
    <ThreadDetailPanel />
  </SidebarLayout>
)}
```

**Pros:**
- Best of both worlds
- Only one instance rendered
- Full control over behavior
- Clean separation of concerns

**Cons:**
- Hydration mismatch on first render
- Requires suppressHydrationWarning or careful handling

---

## Recommended Approach: Hybrid with Hydration Safety

### Strategy
1. Use `useMediaQuery` hook for viewport detection
2. Add `isMounted` state to prevent hydration mismatch
3. Render desktop view during SSR (default)
4. Switch to correct view after hydration
5. Show loading skeleton during switch (optional)

### Code Pattern
```typescript
function CourseDetailContent() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and first render: show desktop view
  const shouldUseModal = isMounted && isMobile;

  return (
    <>
      {shouldUseModal ? (
        <ThreadModal ... />
      ) : (
        <SidebarLayout>
          {selectedThreadId && (
            <ThreadDetailPanel ... />
          )}
        </SidebarLayout>
      )}
    </>
  );
}
```

---

## Focus Management Strategy

### Modal Context (Mobile)
- Focus trap enabled
- ESC closes modal
- Focus returns to thread card after close
- ARIA: role="dialog", aria-modal="true"

### Inline Context (Desktop)
- No focus trap (natural tab order)
- ESC deselects thread (optional)
- Focus moves to detail panel on selection
- ARIA: role="region", aria-label="Thread detail"

### Implementation
```typescript
// ThreadDetailPanel accepts context prop
interface ThreadDetailPanelProps {
  threadId: string | null;
  onClose?: () => void;
  context?: 'modal' | 'inline'; // New prop
  className?: string;
}

// Adjust behavior based on context
const ariaRole = context === 'modal' ? undefined : 'region';
const ariaLabel = context === 'inline' ? 'Thread detail' : undefined;
```

---

## URL State Management

### Current Behavior (Keep Unchanged)
- Thread ID in query param: `?thread=123`
- Selecting thread: `window.history.replaceState` adds param
- Deselecting thread: removes param
- Works with browser back/forward

### No Changes Needed
- Modal and inline both use same URL state
- Thread selection logic remains identical
- Only rendering changes, not state management

---

## Transition & Animation Strategy

### Layout Shifts to Avoid
1. **Thread Selection**: Avoid jarring grid column appearance
2. **Viewport Resize**: Smooth transition between modal ↔ inline
3. **Thread Deselection**: Graceful column collapse

### Recommended Approach
1. SidebarLayout already has transition classes (`transition-all duration-300`)
2. Grid column changes are handled by existing CSS
3. Add fade-in animation for ThreadDetailPanel content
4. Modal already has enter/exit animations (Radix Dialog)

### Additional CSS (if needed)
```css
/* Smooth content fade-in */
.thread-detail-fade-in {
  animation: fadeIn 200ms ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## Accessibility Considerations

### Screen Reader Announcements
- **Thread Selected (Modal)**: "Thread detail dialog opened"
- **Thread Selected (Inline)**: "Thread detail loaded in main region"
- **Thread Deselected**: "Returned to thread list"

### ARIA Live Region
```typescript
// Add to page for announcements
<div role="status" aria-live="polite" className="sr-only">
  {selectedThreadId ? 'Thread detail loaded' : ''}
</div>
```

### Keyboard Navigation
- **Modal**: Tab cycles within modal, ESC closes
- **Inline**: Tab flows naturally through layout, ESC deselects (optional)
- Both: Arrow keys work in thread list

---

## Performance Considerations

### Rendering Optimization
- Only render ThreadModal on mobile (not hidden)
- Only render inline detail on desktop (not hidden)
- Prevents duplicate React tree rendering
- Reduces DOM size

### Lazy Loading (Future)
- Consider lazy loading ThreadDetailPanel for code splitting
- Small component, probably not needed initially
- Monitor bundle size

---

## Testing Strategy

### Manual Testing Matrix
| Viewport | Action | Expected Behavior |
|----------|--------|-------------------|
| 360px | Select thread | Modal opens full-screen |
| 768px | Select thread | Inline detail in 3rd column |
| 1024px | Select thread | Inline detail in 3rd column |
| 768px | Resize to 360px with thread open | Switches to modal smoothly |
| 360px | Resize to 768px with thread open | Switches to inline smoothly |
| 768px | Deselect thread | 3rd column collapses to 2-column |

### Automated Testing (Future)
- Playwright tests for viewport switching
- Visual regression tests
- Accessibility tests with axe-core

---

## Edge Cases to Handle

1. **Viewport Resize with Thread Open**
   - Mobile → Desktop: Close modal, show inline
   - Desktop → Mobile: Hide inline, show modal
   - Solution: useEffect on isMobile change

2. **SSR vs Client Rendering**
   - SSR renders desktop view (no window)
   - Client hydrates and may switch to mobile
   - Solution: suppressHydrationWarning or isMounted check

3. **Rapid Resize Events**
   - Multiple resize events in quick succession
   - Solution: matchMedia handles debouncing internally

4. **Thread Not Found**
   - Both modal and inline show error state
   - Solution: ThreadDetailPanel already handles this

5. **Browser Back/Forward**
   - Works same in both contexts
   - URL param drives selection state
   - No changes needed

---

## Migration Path

### Step 1: Create useMediaQuery Hook
- Location: `lib/hooks/use-media-query.ts`
- Reusable for other responsive features

### Step 2: Update CourseDetailPage
- Add viewport detection
- Add conditional rendering logic
- Pass ThreadDetailPanel to SidebarLayout on desktop

### Step 3: Update ThreadDetailPanel (Minor)
- Accept optional `context` prop
- Adjust ARIA attributes based on context
- No visual changes needed

### Step 4: Update ThreadModal (Minor)
- Only render on mobile
- No prop changes needed

### Step 5: Test & Verify
- Manual testing at all breakpoints
- Accessibility testing
- URL state verification

---

## Rollback Plan

If issues arise:
1. Remove conditional rendering
2. Revert to ThreadModal for all viewports
3. Changes are isolated to page.tsx
4. No component API changes required

---

## Estimated Effort

- Research: 1 hour (complete)
- Implementation: 2-3 hours
- Testing: 1 hour
- **Total**: 4-5 hours

---

## Open Questions

1. Should ESC key deselect thread in inline context?
   - **Recommendation**: Yes for consistency

2. Should focus move to detail panel on selection?
   - **Recommendation**: Yes for accessibility

3. Should we add loading state during viewport switch?
   - **Recommendation**: Not needed, transition is instant

4. Should tablets (768-1023px) use modal or inline?
   - **Recommendation**: Inline (more screen space)

---

## Next Steps

1. Create implementation plan with step-by-step file changes
2. Implement useMediaQuery hook
3. Update CourseDetailPage with conditional logic
4. Test thoroughly at all breakpoints
5. Verify accessibility with screen readers

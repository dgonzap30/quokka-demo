# QDS Styling Plan: ConversationHistorySidebar

## Component Structure & ClassNames

### 1. Sidebar Container (Desktop & Mobile)

**Desktop (Fixed Sidebar):**
```tsx
<aside
  className="
    w-[280px]
    h-full
    glass-panel-strong
    border-r border-glass
    shadow-glass-lg
    flex flex-col
    overflow-hidden
  "
  aria-label="Conversation history"
>
```

**Mobile (Slide-in Drawer):**
```tsx
{/* Backdrop Overlay */}
<div
  className="
    fixed inset-0
    bg-black/40
    backdrop-blur-sm
    z-40
    md:hidden
  "
  onClick={onClose}
  aria-hidden="true"
/>

{/* Sidebar */}
<aside
  className="
    fixed top-0 left-0
    w-[280px]
    h-full
    glass-panel-strong
    border-r border-glass
    shadow-glass-lg
    flex flex-col
    overflow-hidden
    z-50
    transition-transform duration-300 ease-out
    safe-left
    md:hidden
  "
  style={{
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
  }}
  aria-label="Conversation history"
>
```

**Breakdown:**
- `w-[280px]` - Fixed width matching `--mobile-sheet-width`
- `h-full` - Full viewport height
- `glass-panel-strong` - QDS glass utility (backdrop-blur-lg, bg-glass-strong)
- `border-r border-glass` - Right border with glass token
- `shadow-glass-lg` - Highest glass elevation
- `flex flex-col` - Vertical layout
- `overflow-hidden` - Prevent content overflow
- `z-50` (mobile) - Above page content, below modals
- `transition-transform duration-300 ease-out` - Smooth slide-in
- `safe-left` - iOS notch/safe area support

---

### 2. Sidebar Header Section

```tsx
<div
  className="
    flex-shrink-0
    border-b border-glass
    p-6
    space-y-3
  "
>
  {/* Header Title */}
  <h2 className="heading-4 glass-text">
    Conversations
  </h2>

  {/* New Conversation Button */}
  <button
    className="
      w-full
      flex items-center justify-center gap-2
      px-3 py-2
      min-h-[44px]
      bg-primary
      hover:bg-primary-hover
      active:bg-primary-pressed
      text-primary-foreground
      text-sm font-medium
      rounded-lg
      shadow-glass-sm
      hover:shadow-glass-md
      transition-all duration-180
      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    "
    aria-label="Start new conversation"
  >
    <Plus className="h-5 w-5" aria-hidden="true" />
    <span>New Conversation</span>
  </button>
</div>
```

**Breakdown:**

**Header Container:**
- `flex-shrink-0` - Prevent header from shrinking when list grows
- `border-b border-glass` - Bottom separator with glass token
- `p-6` - 24px padding (QDS standard sidebar padding)
- `space-y-3` - 12px vertical gap between elements

**Title:**
- `heading-4` - QDS heading utility (text-xl/2xl, font-semibold)
- `glass-text` - Text shadow for glass background readability

**New Button:**
- `w-full` - Full width of container
- `flex items-center justify-center gap-2` - Centered icon + text with 8px gap
- `px-3 py-2` - 12px horizontal, 8px vertical padding
- `min-h-[44px]` - WCAG 2.5.5 touch target size
- `bg-primary hover:bg-primary-hover active:bg-primary-pressed` - QDS color states
- `text-primary-foreground` - White text on primary background
- `text-sm font-medium` - Compact button text
- `rounded-lg` - 16px radius (prominent CTA)
- `shadow-glass-sm hover:shadow-glass-md` - Elevation on hover
- `transition-all duration-180` - QDS medium transition
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` - QDS focus state

---

### 3. Conversation List (Scrollable Area)

```tsx
<div
  className="
    flex-1
    overflow-y-auto
    sidebar-scroll
    px-2 py-2
  "
  role="list"
  aria-label="Conversation list"
>
  {/* Loading State */}
  {isLoading && (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 rounded-md glass-panel">
          <Skeleton className="h-4 w-full mb-2 bg-glass-medium" />
          <Skeleton className="h-3 w-3/4 bg-glass-medium" />
        </div>
      ))}
    </div>
  )}

  {/* Empty State */}
  {!isLoading && conversations.length === 0 && (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full glass-panel mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="heading-5 glass-text mb-2">No conversations yet</h3>
      <p className="text-sm text-muted-foreground glass-text leading-relaxed max-w-sm">
        Start a new conversation with Quokka to get help with your coursework.
      </p>
    </div>
  )}

  {/* Conversation Items */}
  {!isLoading && conversations.length > 0 && (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div key={conversation.id} role="listitem">
          {/* See next section for conversation item styling */}
        </div>
      ))}
    </div>
  )}
</div>
```

**Breakdown:**

**List Container:**
- `flex-1` - Take remaining vertical space
- `overflow-y-auto` - Enable vertical scrolling
- `sidebar-scroll` - QDS custom scrollbar styling
- `px-2 py-2` - Small padding for breathing room
- `role="list"` - Semantic HTML for screen readers

**Loading Skeletons:**
- `space-y-2` - 8px gap between skeleton items
- `p-3 rounded-md glass-panel` - Skeleton container matches item style
- `bg-glass-medium` - Skeleton bars use glass token

**Empty State:**
- `py-12 px-4` - Generous padding for centered content
- `w-16 h-16 rounded-full glass-panel` - Glass circle for icon
- `heading-5 glass-text` - QDS heading with glass readability
- `text-sm text-muted-foreground glass-text` - Secondary text with glass shadow

**Conversation List:**
- `space-y-2` - 8px gap between conversation items
- `role="listitem"` - Semantic HTML for each item

---

### 4. Conversation Item (Default State)

```tsx
<button
  className={cn(
    // Base styles
    "w-full text-left",
    "p-3 rounded-md",
    "border border-transparent",
    "transition-all duration-180",
    "min-h-[44px]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

    // Default state
    "bg-transparent",
    "hover:bg-primary/10",
    "hover:border-glass",
    "hover:shadow-glass-sm",

    // Active state
    isActive && [
      "bg-primary/20",
      "border-l-2 border-primary",
      "border-y border-r border-glass",
      "hover:bg-primary/20", // Prevent hover on active
      "hover:shadow-none",   // Prevent shadow on active
    ]
  )}
  onClick={() => onConversationSelect(conversation.id)}
  aria-label={`${conversation.title}, ${formatRelativeTime(conversation.updatedAt)}`}
  aria-current={isActive ? "page" : undefined}
>
  <div className="flex items-start gap-3">
    {/* Icon */}
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
      <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Title */}
      <p className="text-sm font-medium text-foreground glass-text truncate">
        {conversation.title}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-muted-foreground glass-text">
          {formatRelativeTime(conversation.updatedAt)}
        </p>

        {/* Unread Badge (if applicable) */}
        {conversation.unreadCount > 0 && (
          <span
            className="
              flex items-center justify-center
              h-5 w-5
              bg-primary
              text-primary-foreground
              text-xs font-semibold
              rounded-full
            "
            aria-label={`${conversation.unreadCount} unread messages`}
          >
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </div>

    {/* Actions Dropdown (Optional) */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            flex-shrink-0
            h-8 w-8
            flex items-center justify-center
            rounded-md
            hover:bg-primary/10
            transition-colors duration-120
            focus-visible:ring-2 focus-visible:ring-ring
          "
          onClick={(e) => e.stopPropagation()}
          aria-label="Conversation actions"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRename}>
          <Edit2 className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-danger focus:text-danger"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</button>
```

**Breakdown:**

**Button Container:**
- `w-full text-left` - Full width, left-aligned text
- `p-3 rounded-md` - 12px padding, 10px radius (list item scale)
- `border border-transparent` - Border space reserved for active state
- `transition-all duration-180` - Smooth state transitions
- `min-h-[44px]` - Touch target compliance
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` - QDS focus ring

**Default State:**
- `bg-transparent` - Transparent background
- `hover:bg-primary/10` - 10% primary tint on hover
- `hover:border-glass` - Glass border on hover
- `hover:shadow-glass-sm` - Subtle shadow lift on hover

**Active State:**
- `bg-primary/20` - 20% primary tint (stronger than hover)
- `border-l-2 border-primary` - 2px left border with primary color
- `border-y border-r border-glass` - Glass border on other sides
- `hover:bg-primary/20` - Prevent hover lightening on active
- `hover:shadow-none` - Prevent shadow on active

**Icon:**
- `w-8 h-8 rounded-full` - Circular icon container
- `bg-gradient-to-br from-primary to-accent` - QDS brand gradient
- `flex items-center justify-center` - Center icon
- `h-4 w-4 text-white` - Icon size and color

**Title:**
- `text-sm font-medium text-foreground glass-text` - Medium weight, foreground color
- `truncate` - Ellipsis overflow
- `glass-text` - Readability on glass background

**Metadata:**
- `flex items-center gap-2 mt-1` - Horizontal layout with 8px gap
- `text-xs text-muted-foreground glass-text` - Small, muted timestamp

**Unread Badge:**
- `h-5 w-5` - Compact size
- `bg-primary text-primary-foreground` - Primary color
- `text-xs font-semibold` - Bold count
- `rounded-full` - Circular badge

**Actions Button:**
- `h-8 w-8` - Compact icon button
- `hover:bg-primary/10` - Subtle hover state
- `transition-colors duration-120` - Fast transition (QDS fast duration)
- `onClick={(e) => e.stopPropagation()` - Prevent conversation selection

---

### 5. Mobile-Specific Enhancements

**Mobile Header (with Close Button):**
```tsx
<div className="flex-shrink-0 border-b border-glass p-4 space-y-3 md:p-6">
  <div className="flex items-start justify-between gap-3">
    <h2 className="heading-4 glass-text">
      Conversations
    </h2>

    {/* Close button (mobile only) */}
    <button
      className="
        flex-shrink-0
        h-10 w-10
        flex items-center justify-center
        rounded-md
        hover:bg-primary/10
        transition-colors duration-120
        focus-visible:ring-2 focus-visible:ring-ring
        md:hidden
      "
      onClick={onClose}
      aria-label="Close conversation history"
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  </div>

  {/* Rest of header... */}
</div>
```

**Mobile Swipe Gesture (Optional Enhancement):**
```tsx
// Use a library like react-swipeable or implement custom touch handlers
<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* Sidebar content */}
</div>
```

---

## Complete Component Example

```tsx
import { useState } from 'react';
import { MessageSquare, Plus, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export interface ConversationHistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
  isOpen?: boolean; // Mobile only
  onClose?: () => void; // Mobile only
}

export function ConversationHistorySidebar({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isLoading = false,
  isOpen = true, // Desktop always open
  onClose,
}: ConversationHistorySidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {!isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[280px] h-full glass-panel-strong border-r border-glass shadow-glass-lg flex flex-col overflow-hidden",
          // Desktop: always visible
          "hidden md:flex",
          // Mobile: slide-in drawer
          "md:static md:translate-x-0",
          "fixed top-0 left-0 z-50 safe-left",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Conversation history"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-glass p-4 md:p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="heading-4 glass-text">Conversations</h2>

            {/* Mobile close button */}
            <button
              className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              onClick={onClose}
              aria-label="Close conversation history"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] bg-primary hover:bg-primary-hover active:bg-primary-pressed text-primary-foreground text-sm font-medium rounded-lg shadow-glass-sm hover:shadow-glass-md transition-all duration-180 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onNewConversation}
            aria-label="Start new conversation"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div
          className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2"
          role="list"
          aria-label="Conversation list"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-md glass-panel">
                  <Skeleton className="h-4 w-full mb-2 bg-glass-medium" />
                  <Skeleton className="h-3 w-3/4 bg-glass-medium" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full glass-panel mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="heading-5 glass-text mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground glass-text leading-relaxed max-w-sm">
                Start a new conversation with Quokka to get help with your coursework.
              </p>
            </div>
          )}

          {/* Conversation Items */}
          {!isLoading && conversations.length > 0 && (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <div key={conversation.id} role="listitem">
                    <button
                      className={cn(
                        "w-full text-left p-3 rounded-md border transition-all duration-180 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        !isActive && "bg-transparent border-transparent hover:bg-primary/10 hover:border-glass hover:shadow-glass-sm",
                        isActive && "bg-primary/20 border-l-2 border-primary border-y border-r border-glass"
                      )}
                      onClick={() => onConversationSelect(conversation.id)}
                      aria-label={`${conversation.title}, ${formatRelativeTime(conversation.updatedAt)}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground glass-text truncate">
                            {conversation.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground glass-text">
                              {formatRelativeTime(conversation.updatedAt)}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span
                                className="flex items-center justify-center h-5 w-5 bg-primary text-primary-foreground text-xs font-semibold rounded-full"
                                aria-label={`${conversation.unreadCount} unread messages`}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors duration-120 focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Conversation actions"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onRenameConversation(conversation.id)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteConversation(conversation.id)}
                              className="text-danger focus:text-danger"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// Helper function (implement as needed)
function formatRelativeTime(date: Date): string {
  // Implementation: "Just now", "5m ago", "2h ago", "Yesterday", "Oct 15"
  return "5m ago";
}
```

---

## Responsive Behavior Summary

**Desktop (≥768px):**
- Sidebar always visible, fixed width 280px
- No backdrop overlay
- No close button
- Full blur (blur-lg) for glass-panel-strong

**Mobile (<768px):**
- Sidebar hidden by default
- Triggered by button in main header
- Slide-in from left with backdrop
- Close button in header
- Swipe-to-close gesture (optional)
- Reduced blur (blur-md) for performance

---

## Animation Specifications

**Slide-in (Mobile):**
```css
transition: transform 300ms ease-out;
transform: translateX(0); /* Open */
transform: translateX(-100%); /* Closed */
```

**Hover Effects:**
```css
transition: all 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
/* Applies to: background, border, shadow */
```

**Focus Ring:**
```css
transition: colors 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
/* Applies to: ring color, border color */
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

---

## Testing Checklist

- [ ] **Visual:**
  - [ ] Glass background visible and blurred correctly
  - [ ] Border-glass visible in light and dark modes
  - [ ] Shadows render correctly (no harsh edges)
  - [ ] Gradient icon backgrounds render smoothly
  - [ ] Hover states transition smoothly
  - [ ] Active state clearly distinguishable

- [ ] **Accessibility:**
  - [ ] All interactive elements focusable via keyboard
  - [ ] Focus ring visible on all elements
  - [ ] ARIA labels present and descriptive
  - [ ] Screen reader announces list items correctly
  - [ ] Touch targets ≥44px (test on mobile device)

- [ ] **Responsive:**
  - [ ] Desktop sidebar fixed and visible
  - [ ] Mobile sidebar slides in/out smoothly
  - [ ] Backdrop overlay covers page on mobile
  - [ ] Close button only visible on mobile
  - [ ] Swipe gesture works (if implemented)

- [ ] **Performance:**
  - [ ] Blur reduced on mobile (blur-md instead of blur-lg)
  - [ ] Animations disabled with prefers-reduced-motion
  - [ ] Scrolling smooth with custom scrollbar
  - [ ] No layout shift when opening/closing

- [ ] **Dark Mode:**
  - [ ] All glass tokens switch correctly
  - [ ] Text contrast maintained (≥4.5:1)
  - [ ] Focus rings visible in dark mode
  - [ ] Shadows visible but not harsh

---

## Implementation Order

1. **Phase 1: Structure**
   - Create component file
   - Add sidebar container with glass-panel-strong
   - Add header section with title

2. **Phase 2: New Conversation Button**
   - Add button with primary gradient
   - Add hover/active states
   - Add focus ring

3. **Phase 3: Conversation List**
   - Add scrollable container
   - Add loading skeletons
   - Add empty state

4. **Phase 4: Conversation Items**
   - Add default state styling
   - Add hover state
   - Add active state
   - Add dropdown actions

5. **Phase 5: Mobile Enhancements**
   - Add backdrop overlay
   - Add slide-in animation
   - Add close button
   - Add swipe gesture (optional)

6. **Phase 6: Polish**
   - Add reduced-motion support
   - Add keyboard navigation
   - Add ARIA labels
   - Test dark mode
   - Verify contrast ratios

---

## Files Modified

**New Files:**
- `components/ai/conversation-history-sidebar.tsx` (main component)

**No Changes Needed:**
- `app/globals.css` (all utilities already exist)

---

## Risks & Mitigations

**Risk 1: Mobile performance with blur**
- **Mitigation:** Reduce blur from lg to md on mobile (already specified)
- **Fallback:** Use `@supports` query to disable blur on unsupported browsers

**Risk 2: Sidebar width too narrow on small screens**
- **Mitigation:** 280px is standard for mobile sheets (matches Slack, Discord)
- **Fallback:** Test on 360px viewport (smallest common width)

**Risk 3: Hover states conflict with active state**
- **Mitigation:** Explicitly disable hover effects when active (already specified)
- **Verification:** Test with mouse and touch devices

---

## Next Steps

1. Review this plan with team
2. Implement component following className specifications
3. Run typecheck: `npx tsc --noEmit`
4. Run lint: `npm run lint`
5. Test in Storybook (if available)
6. Test in actual QuokkaQ pages
7. Verify with screen reader (VoiceOver/NVDA)
8. Test on mobile device (iOS/Android)
9. Commit with: `feat: add QDS-compliant conversation history sidebar`

# Component Architecture Research: Support Page

**Date:** 2025-10-14
**Task:** Mobile Support Page Implementation
**Researcher:** Component Architect

---

## 1. Existing Pattern Audit

### Similar Components in Codebase

#### Dashboard Page (`app/dashboard/page.tsx`)
- **Pattern:** Main page container with multiple sections
- **Structure:** Hero section → Multiple content sections → Stats overview
- **Layout:** Uses `container-wide` for max-width constraints
- **Glass Styling:** All cards use `glass-panel` or `glass-panel-strong`
- **Responsive:** Mobile-first with `md:` and `lg:` breakpoints
- **Accessibility:** Proper landmarks (`main`, `section`, `aside`), `aria-labelledby` for sections

**Key Takeaways:**
- Hero sections use `py-6 md:py-8` spacing
- Content sections wrapped in `section` with `space-y-4` or `space-y-6`
- Heading hierarchy: H1 for page title, H2 for section titles
- Glass text utility (`.glass-text`) for improved readability

#### Stat Card (`components/dashboard/stat-card.tsx`)
- **Props Pattern:** Explicit TypeScript interface with JSDoc comments
- **Structure:** Icon + Label + Value + Trend + Optional CTA
- **Variants:** `default | warning | success | accent` (using border-left accent)
- **Loading State:** Skeleton placeholders with `bg-glass-medium`
- **Glass Styling:** Uses `glass-panel` with variant-specific border accents

**Key Takeaways:**
- All props defined via interface (no hardcoded data)
- Supports `loading` prop for async states
- Uses `cn()` for className composition
- Exports interface for reuse
- Supports optional callbacks for CTAs

#### Enhanced Course Card (`components/dashboard/enhanced-course-card.tsx`)
- **Props Pattern:** TypeScript interface with view mode support
- **Structure:** Icon + Title + Description + Metrics Grid
- **Variants:** `glass-hover` for interactive cards
- **Responsive:** Minimum height (`min-h-56`), two-column metrics grid
- **Accessibility:** `article` wrapper, `aria-labelledby`, role="list" for metrics

**Key Takeaways:**
- Uses `Card` component with `variant="glass-hover"`
- Wraps in `Link` for navigation
- Hover scale effect: `hover:scale-[1.03]` (respects reduced motion)
- Metrics use tabular numbers (`tabular-nums`)
- Empty states handled with fallback UI

#### Timeline Activity (`components/dashboard/timeline-activity.tsx`)
- **Props Pattern:** Array of items + max items + loading + empty message
- **Structure:** Ordered list (`ol`) with timeline dots and connecting lines
- **Empty State:** Card with emoji + message
- **Accessibility:** `role="list"`, `aria-label`, proper `time` elements with ISO dates

**Key Takeaways:**
- List-based patterns use semantic HTML (`ol`, `li`)
- Empty states use `Card variant="glass"` with centered content
- Relative time display with full date for screen readers
- Loading skeleton uses 3 placeholder items

### shadcn/ui Primitives Available

#### Accordion (`components/ui/accordion.tsx`)
- **Primitive:** Radix UI Accordion
- **Features:** Collapsible, keyboard navigation, single/multiple expand modes
- **Styling:** Border-b on items, chevron rotation on expand
- **Accessibility:** Built-in ARIA roles, focus management

**Usage for FAQ:**
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Question?</AccordionTrigger>
    <AccordionContent>Answer</AccordionContent>
  </AccordionItem>
</Accordion>
```

#### Card (`components/ui/card.tsx`)
- **Variants:** `default | glass | glass-strong | glass-hover | glass-liquid | elevated | ai`
- **Glass Support:** Full glassmorphism variants with backdrop blur
- **Sub-components:** CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Composition:** Flexible layout system with gap spacing

**Usage for Support Sections:**
```tsx
<Card variant="glass">
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Empty State (`components/ui/empty-state.tsx`)
- **Props:** Icon | Emoji, Title, Description, Action, SecondaryAction
- **Variants:** `default | glass | elevated`
- **Features:** Optional CTA buttons, responsive padding
- **Accessibility:** `role="status"`, `aria-live="polite"`

**Usage for No Results:**
```tsx
<EmptyState
  emoji="🔍"
  title="No results found"
  description="Try adjusting your search terms"
  variant="glass"
/>
```

### Composition Opportunities

1. **FAQ Accordion Component**
   - Wrap Radix Accordion with QDS styling
   - Add glass-panel card container
   - Support loading state with skeletons
   - Handle empty state

2. **Contact Card Component**
   - Reuse Card with glass variant
   - Icon + Title + Description pattern (like StatCard)
   - Support href (mailto/link) or onClick callback
   - Hover effect with scale

3. **Resource Link Card**
   - Similar to EnhancedCourseCard structure
   - External link with icon
   - Glass-hover variant
   - Metrics/badge support (e.g., "Popular")

---

## 2. Requirements Analysis

### Data Requirements (Props)

#### SupportPage Component
```typescript
interface SupportPageProps {
  // FAQ data
  faqs: FAQItem[];

  // Contact options
  contactOptions: ContactOption[];

  // Resource links
  resources: ResourceLink[];

  // Optional search query (for FAQ filtering)
  searchQuery?: string;

  // Loading states
  faqsLoading?: boolean;
  contactLoading?: boolean;
  resourcesLoading?: boolean;
}
```

#### FAQAccordion Component
```typescript
interface FAQAccordionProps {
  items: FAQItem[];
  loading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
  defaultExpanded?: string; // Item ID to expand by default
  className?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string; // e.g., "Account", "Technical", "Billing"
  searchRank?: number; // For search result ordering
}
```

#### ContactCard Component
```typescript
interface ContactCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: {
    label: string;
    href?: string; // mailto:, https://
    onClick?: () => void;
  };
  variant?: "default" | "primary" | "accent";
  disabled?: boolean;
  className?: string;
}

interface ContactOption {
  id: string;
  type: "email" | "chat" | "docs" | "community";
  title: string;
  description: string;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon: LucideIcon;
  available?: boolean; // For "Chat" (e.g., office hours only)
}
```

#### ResourceLinkCard Component
```typescript
interface ResourceLinkCardProps {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  badge?: string; // e.g., "New", "Popular"
  external?: boolean; // Opens in new tab
  className?: string;
}

interface ResourceLink {
  id: string;
  title: string;
  description: string;
  href: string;
  category?: string;
  icon?: LucideIcon;
  badge?: string;
  external?: boolean;
}
```

### State Requirements

**Local State (Component-level):**
- `expandedFaqId: string | null` - Currently expanded FAQ item (accordion manages this)
- `searchQuery: string` - FAQ search input value

**Lifted State (Page-level):**
- None required (all data fetched at page level)

**Global State:**
- Not needed (support page is self-contained)

**Server State (React Query):**
- `useSupportFAQs()` - Fetches FAQ data
- `useSupportResources()` - Fetches resource links
- Contact options can be static (no API needed for frontend-only demo)

### Event Handling Needs

**FAQAccordion:**
- `onExpand(itemId: string)` - Track which FAQ is opened (analytics)
- `onSearch(query: string)` - Filter FAQs by keyword

**ContactCard:**
- `onClick()` - Handle card click (navigate or open modal)
- For mailto/href links: Browser handles natively

**ResourceLinkCard:**
- `onClick()` - Handle card click (track analytics, navigate)

**SupportPage:**
- `onSearchFAQ(query: string)` - Filter FAQ accordion
- `onContactOptionClick(option: ContactOption)` - Track which contact method used
- `onResourceClick(resource: ResourceLink)` - Track resource access

### Variant Requirements

**Visual Variants:**
- **FAQAccordion:** Single glass-panel card with border-b between items
- **ContactCard:** 3 variants (default, primary, accent) for visual hierarchy
- **ResourceLinkCard:** Glass-hover for interactive feel

**Behavioral Variants:**
- **ContactCard:** Supports both navigation (href) and callback (onClick)
- **ResourceLinkCard:** External links (new tab) vs internal (same tab)
- **FAQAccordion:** Single-expand vs multi-expand mode (use single for support)

### Accessibility Requirements

**WCAG 2.2 AA Compliance:**
- Minimum 4.5:1 contrast ratio for all text
- 44×44px minimum touch targets on mobile
- Keyboard navigation for all interactive elements
- Focus indicators visible at all times

**Semantic HTML:**
- `<main>` for page content
- `<section>` for each major area (Hero, FAQ, Contact, Resources)
- `<article>` for individual cards/items
- `<h1>` for page title, `<h2>` for section headings, `<h3>` for card titles

**ARIA Attributes:**
- Accordion: Built-in from Radix (aria-expanded, aria-controls)
- Links: `aria-label` for icon-only buttons
- Cards: `aria-labelledby` linking title to content
- Search: `aria-label="Search FAQs"`, `aria-describedby` for hint text

**Keyboard Navigation:**
- Tab order: Logo → Search → FAQs → Contact Cards → Resources → Footer
- Enter/Space to expand FAQ items
- Esc to close expanded FAQ
- Tab to navigate between accordion items

**Screen Reader Support:**
- All images/icons have `aria-hidden="true"` with text labels
- Time-based content (e.g., "Available Mon-Fri") uses proper markup
- Loading states announce with `aria-live="polite"`
- Empty states use `role="status"`

### Responsive Behavior Needs

**Mobile (360px - 767px):**
- Single-column layout for all sections
- FAQ accordion items expand to full width
- Contact cards stack vertically (1 column)
- Resource links stack vertically (1 column)
- Hero padding: `p-4`
- Touch targets: 44×44px minimum
- Reduced blur for performance (`blur-sm` instead of `blur-md`)

**Tablet (768px - 1023px):**
- FAQ accordion remains full-width
- Contact cards: 2-column grid
- Resource links: 2-column grid
- Hero padding: `p-6`

**Desktop (1024px+):**
- FAQ accordion remains full-width (better readability)
- Contact cards: 3-column grid
- Resource links: 2 or 3-column grid (depending on count)
- Hero padding: `p-8`
- Full backdrop blur effects

**Container Widths:**
- Use `container-wide` (max-w-6xl) for page content
- Constrain hero text to `max-w-3xl` for readability

---

## 3. Performance Considerations

### Render Frequency Expectations

**High Frequency (Every keystroke):**
- FAQ search input → Debounce with 300ms delay

**Medium Frequency (User interactions):**
- Accordion expand/collapse → Smooth animation (240ms duration)
- Card hover effects → Instant (120ms transition)

**Low Frequency (Once per page load):**
- FAQ data fetch → Cache with React Query (staleTime: 5min)
- Resource links fetch → Cache with React Query (staleTime: 10min)
- Contact options → Static data (no fetch needed)

### Expensive Operations to Optimize

1. **FAQ Search Filtering**
   - Use `useMemo` to filter FAQ array by search query
   - Debounce search input to avoid re-renders on every keystroke
   - Consider highlighting matching terms (if implemented)

2. **Accordion Animations**
   - Use CSS transitions (already handled by Radix)
   - Respect `prefers-reduced-motion` (disable animations)
   - Limit to single-expand mode to reduce DOM complexity

3. **Glass Blur Effects**
   - Limit to 3 blur layers max per view
   - Reduce blur intensity on mobile (`blur-sm` vs `blur-md`)
   - Use `will-change: backdrop-filter` for performance
   - Apply `contain: layout style paint` to glass elements

### Memoization Opportunities

**Components to Memoize:**
- `FAQAccordion` → Only re-render when `items` or `searchQuery` changes
- `ContactCard` → Pure component, memoize if many cards rendered
- `ResourceLinkCard` → Pure component, memoize if many cards rendered

**Data to Memoize:**
```tsx
// Filter FAQs by search query
const filteredFaqs = useMemo(() => {
  if (!searchQuery) return faqs;
  const query = searchQuery.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
  );
}, [faqs, searchQuery]);

// Map contact options to ContactCard props
const contactCards = useMemo(
  () => contactOptions.map((option) => ({
    id: option.id,
    icon: option.icon,
    title: option.title,
    description: option.description,
    action: option.action,
    disabled: !option.available,
  })),
  [contactOptions]
);
```

### Code Splitting Potential

**Not Needed for Support Page:**
- Page is relatively small (<50KB estimated)
- No heavy third-party libraries
- Accordion is from Radix (already in bundle)
- No dynamic imports required

**Future Optimization (if page grows):**
- Lazy load FAQ data if list exceeds 20 items
- Code-split resource links if external widgets added (e.g., live chat)

---

## 4. Design System Compliance (QDS 2.0)

### Glass Styling Requirements

**Page Background:**
- Use liquid mesh gradient: `[background:var(--liquid-mesh)]`
- Or solid background with glass panels on top

**Section Cards:**
- FAQ: `Card variant="glass"` with single panel
- Contact Cards: `Card variant="glass-hover"` for interactivity
- Resource Links: `Card variant="glass-hover"` for interactivity

**Backdrop Blur:**
- Desktop: `backdrop-blur-md` (12px)
- Mobile: `backdrop-blur-sm` (8px) for performance

**Glass Borders:**
- Use `border-glass` utility class
- Apply to all glass panels

**Glass Shadows:**
- Default: `shadow-glass-md`
- Hover: `shadow-glass-lg`
- Use softer shadows than traditional elevation

### Color Tokens

**Primary Actions:**
- Contact Email card: `border-l-primary` accent
- Submit button: `bg-primary hover:bg-primary-hover`

**Accent Actions:**
- Live chat card: `border-l-accent` accent
- Documentation link: `text-accent hover:text-accent-hover`

**Support Colors:**
- Success indicator (available): `text-success`
- Warning indicator (limited hours): `text-warning`

**Glass Text:**
- All text in glass panels: Add `.glass-text` utility for shadow

### Spacing Grid (4pt Base)

**Section Spacing:**
- Between sections: `space-y-12` (48px)
- Section padding: `py-6 md:py-8` (24px/32px)

**Card Spacing:**
- Internal padding: `p-4` on mobile, `p-6` on desktop
- Gap between cards: `gap-4` (16px)

**Typography Spacing:**
- Heading to description: `space-y-2` (8px)
- Paragraph spacing: `space-y-4` (16px)

### Radius Scale

**Cards:** `rounded-xl` (20px)
**Buttons:** `rounded-lg` (16px)
**Badges:** `rounded-md` (10px)
**Input (Search):** `rounded-lg` (16px)

### Shadow Scale

**FAQ Accordion:** `shadow-glass-md`
**Contact Cards:** `shadow-glass-md` → `hover:shadow-glass-lg`
**Resource Links:** `shadow-glass-md` → `hover:shadow-glass-lg`

---

## 5. Patterns to Follow

### From Dashboard Page
1. Hero section with large heading + subtitle
2. Container-wide for max-width constraints
3. Section landmarks with aria-labelledby
4. Mobile-first responsive breakpoints
5. Glass text utility for readability

### From Stat Card
1. Explicit TypeScript interfaces with JSDoc
2. Loading states with skeleton UI
3. Variant system using `cn()` composition
4. Optional callbacks for user actions
5. Export interfaces for reuse

### From Enhanced Course Card
1. Card wrapper with glass-hover variant
2. Icon + Title + Description structure
3. Link wrapper for navigation
4. Hover scale effect (respects reduced motion)
5. Empty state handling

### From Timeline Activity
1. Semantic list structure (ol/ul)
2. Empty state with emoji + message
3. Loading skeleton with 3 placeholders
4. Proper time elements with ISO dates

---

## 6. Patterns to Avoid

1. **Hardcoded Data:** Never embed FAQ text, contact details, or resource links in components
2. **Direct API Calls:** Always use React Query hooks, never fetch() inside components
3. **Inline Styles:** Use Tailwind classes and QDS tokens, never style={{}}
4. **Color Hardcoding:** Never use hex colors like `#8A6B3D`, always use tokens like `bg-primary`
5. **Deep Prop Drilling:** If more than 2 levels, consider composition or context
6. **Excessive Blur Layers:** Limit to 3 glass panels stacked at most
7. **Missing Loading States:** Every async data fetch needs loading UI
8. **Inaccessible Icons:** Always provide text labels or aria-label

---

## 7. Similar Support Pages (Reference)

While we don't have direct examples in this codebase, the support page should follow these industry patterns:

**Structure:**
1. Hero with search bar (prioritize self-service)
2. FAQ accordion (most common questions)
3. Contact options (email, chat, docs, community)
4. Additional resources (guides, videos, status page)

**Best Practices:**
- Search-first approach (FAQ search bar in hero)
- Contact options ranked by response time (instant → hours → days)
- Visual icons for each contact method (recognizable at a glance)
- Availability indicators (e.g., "Live chat: Mon-Fri 9am-5pm EST")
- External link icons for resources

---

## Conclusion

The support page architecture should follow existing dashboard patterns with:
- Props-driven components (no hardcoded data)
- QDS 2.0 glassmorphism styling throughout
- Semantic HTML with WCAG 2.2 AA compliance
- Mobile-first responsive design
- React Query for server state
- Memoization for search filtering
- shadcn/ui Accordion primitive for FAQ
- Reusable ContactCard and ResourceLinkCard components

All components must accept data via props, support loading states, and provide proper accessibility attributes. The page should feel cohesive with the existing dashboard while providing a dedicated support experience.

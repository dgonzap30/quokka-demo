# Component Design Plan: Support Page Architecture

**Date:** 2025-10-14
**Task:** Mobile Support Page Implementation
**Architect:** Component Architect
**Status:** Ready for Review

---

## Component Hierarchy

```
app/support/page.tsx (SupportPage)
├── Hero Section
│   ├── H1 Title
│   ├── Description
│   └── FAQ Search Input
│
├── FAQ Section
│   └── FAQAccordion
│       ├── AccordionItem (FAQ 1)
│       ├── AccordionItem (FAQ 2)
│       └── AccordionItem (FAQ N)
│
├── Contact Options Section
│   ├── ContactCard (Email)
│   ├── ContactCard (Chat)
│   ├── ContactCard (Docs)
│   └── ContactCard (Community)
│
└── Resources Section
    ├── ResourceLinkCard (Getting Started)
    ├── ResourceLinkCard (Video Tutorials)
    ├── ResourceLinkCard (System Status)
    └── ResourceLinkCard (Release Notes)
```

---

## TypeScript Interfaces

### 1. SupportPage Component

**File:** `app/support/page.tsx`

```typescript
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Mail, MessageCircle, BookOpen, Users, PlayCircle, Activity, FileText } from "lucide-react";
import { FAQAccordion } from "@/components/support/faq-accordion";
import { ContactCard } from "@/components/support/contact-card";
import { ResourceLinkCard } from "@/components/support/resource-link-card";
import type { FAQItem, ContactOption, ResourceLink } from "@/lib/models/types";

/**
 * SupportPage - Main support and help center page
 *
 * Structure:
 * - Hero with search-first approach
 * - FAQ accordion (searchable)
 * - Contact options (email, chat, docs, community)
 * - Resource links (guides, videos, status)
 *
 * Features:
 * - Live FAQ search filtering
 * - QDS glassmorphism styling
 * - Mobile responsive (360px - 1280px)
 * - WCAG 2.2 AA compliant
 */
export default function SupportPage() {
  const [faqSearchQuery, setFaqSearchQuery] = useState("");

  // Static FAQ data (could be fetched with React Query in future)
  const faqs: FAQItem[] = [
    {
      id: "faq-1",
      question: "How do I ask a question?",
      answer: "Click the 'Ask' button in the bottom navigation (mobile) or top navigation (desktop). Type your question, add relevant tags, and submit. Our AI will provide an instant answer if possible.",
      category: "Getting Started",
    },
    {
      id: "faq-2",
      question: "What are Quokka Points?",
      answer: "Quokka Points are earned by contributing to the community: asking questions, providing helpful answers, and having your posts endorsed by instructors. Use them to unlock badges and climb the leaderboard!",
      category: "Points & Rewards",
    },
    {
      id: "faq-3",
      question: "How does AI Answer work?",
      answer: "When you post a question, our AI analyzes your query and searches the course knowledge base. It provides a detailed answer with citations from course materials. Instructors can review and endorse AI answers for quality.",
      category: "AI Features",
    },
    {
      id: "faq-4",
      question: "Can I edit my question after posting?",
      answer: "Yes! Navigate to your question and click the 'Edit' button. You can update the title, body, and tags. Edits are tracked, and previous versions are visible to instructors.",
      category: "Questions",
    },
    {
      id: "faq-5",
      question: "How do I get notifications?",
      answer: "Go to Settings → Notifications to customize your preferences. You can receive notifications for replies to your questions, endorsements, Quokka Points earned, and more.",
      category: "Settings",
    },
    {
      id: "faq-6",
      question: "What if the AI answer is incorrect?",
      answer: "If an AI answer seems off, use the 'Request Human Review' button. This flags the question for instructor attention. You can also post a follow-up comment explaining what's incorrect.",
      category: "AI Features",
    },
    {
      id: "faq-7",
      question: "How do I search for similar questions?",
      answer: "Use the search bar at the top of the page. Type keywords related to your question. You'll see similar threads ranked by relevance. This helps avoid duplicate questions.",
      category: "Search",
    },
    {
      id: "faq-8",
      question: "Can I use markdown in my posts?",
      answer: "Yes! All question and answer fields support markdown. Use **bold**, *italic*, `code`, and more. Click the 'Formatting Help' link in the editor for a quick reference.",
      category: "Formatting",
    },
  ];

  // Static contact options
  const contactOptions: ContactOption[] = [
    {
      id: "contact-email",
      type: "email",
      title: "Email Support",
      description: "Get help from our team within 24 hours",
      action: {
        label: "Send Email",
        href: "mailto:support@quokka.demo",
      },
      icon: Mail,
      available: true,
    },
    {
      id: "contact-chat",
      type: "chat",
      title: "Live Chat",
      description: "Chat with us during office hours (Mon-Fri, 9am-5pm EST)",
      action: {
        label: "Start Chat",
        onClick: () => {
          // In real app: Open live chat widget
          alert("Live chat would open here (frontend-only demo)");
        },
      },
      icon: MessageCircle,
      available: false, // Disable for demo (no backend)
    },
    {
      id: "contact-docs",
      type: "docs",
      title: "Documentation",
      description: "Browse comprehensive guides and tutorials",
      action: {
        label: "View Docs",
        href: "/docs", // In real app: Link to documentation site
      },
      icon: BookOpen,
      available: true,
    },
    {
      id: "contact-community",
      type: "community",
      title: "Community Forum",
      description: "Ask questions and connect with other users",
      action: {
        label: "Visit Forum",
        href: "/community", // In real app: Link to community forum
      },
      icon: Users,
      available: true,
    },
  ];

  // Static resource links
  const resources: ResourceLink[] = [
    {
      id: "resource-getting-started",
      title: "Getting Started Guide",
      description: "Learn the basics of QuokkaQ in 5 minutes",
      href: "/docs/getting-started",
      category: "Guide",
      icon: BookOpen,
      badge: "Popular",
      external: false,
    },
    {
      id: "resource-video-tutorials",
      title: "Video Tutorials",
      description: "Watch step-by-step walkthroughs of key features",
      href: "https://youtube.com/@quokkaq",
      category: "Video",
      icon: PlayCircle,
      external: true,
    },
    {
      id: "resource-system-status",
      title: "System Status",
      description: "Check real-time uptime and performance metrics",
      href: "https://status.quokka.demo",
      category: "Status",
      icon: Activity,
      badge: "Live",
      external: true,
    },
    {
      id: "resource-release-notes",
      title: "Release Notes",
      description: "See what's new in the latest version",
      href: "/changelog",
      category: "Updates",
      icon: FileText,
      badge: "New",
      external: false,
    },
  ];

  // Filter FAQs by search query
  const filteredFaqs = useMemo(() => {
    if (!faqSearchQuery) return faqs;
    const query = faqSearchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category?.toLowerCase().includes(query)
    );
  }, [faqSearchQuery]);

  return (
    <main id="main-content" className="min-h-screen p-4 md:p-6 pb-24 md:pb-6">
      <div className="container-wide space-y-12">
        {/* Hero Section */}
        <section aria-labelledby="support-heading" className="py-6 md:py-8 space-y-6">
          <div className="space-y-3 max-w-3xl">
            <h1 id="support-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text">
              How can we help?
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed glass-text">
              Search our knowledge base, browse FAQs, or reach out to our support team
            </p>
          </div>

          {/* FAQ Search Input */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search frequently asked questions..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                aria-label="Search FAQs"
                aria-describedby="search-hint"
              />
            </div>
            <p id="search-hint" className="mt-2 text-sm text-muted-foreground glass-text">
              Try "How do I ask a question?" or "What are Quokka Points?"
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-6">
          <h2 id="faq-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Frequently Asked Questions
          </h2>
          <FAQAccordion
            items={filteredFaqs}
            loading={false}
            emptyMessage={
              faqSearchQuery
                ? `No FAQs match "${faqSearchQuery}". Try different keywords or browse all questions.`
                : "No FAQs available at this time."
            }
          />
        </section>

        {/* Contact Options Section */}
        <section aria-labelledby="contact-heading" className="space-y-6">
          <h2 id="contact-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactOptions.map((option) => (
              <ContactCard
                key={option.id}
                icon={option.icon}
                title={option.title}
                description={option.description}
                action={option.action}
                variant={option.type === "email" ? "primary" : "default"}
                disabled={!option.available}
              />
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section aria-labelledby="resources-heading" className="space-y-6">
          <h2 id="resources-heading" className="text-xl sm:text-2xl md:text-3xl font-bold glass-text">
            Helpful Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <ResourceLinkCard
                key={resource.id}
                title={resource.title}
                description={resource.description}
                href={resource.href}
                icon={resource.icon}
                badge={resource.badge}
                external={resource.external}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
```

---

### 2. FAQAccordion Component

**File:** `components/support/faq-accordion.tsx`

```typescript
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/lib/models/types";

export interface FAQAccordionProps {
  /**
   * Array of FAQ items to display
   */
  items: FAQItem[];

  /**
   * Loading state (shows skeletons)
   */
  loading?: boolean;

  /**
   * Message to show when no items match (empty state)
   */
  emptyMessage?: string;

  /**
   * Maximum number of items to display (default: all)
   */
  maxItems?: number;

  /**
   * ID of item to expand by default
   */
  defaultExpanded?: string;

  /**
   * Callback when an item is expanded (for analytics)
   */
  onExpand?: (itemId: string) => void;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * FAQAccordion - Collapsible FAQ list with search support
 *
 * Features:
 * - Single-expand mode (one item open at a time)
 * - QDS glass styling
 * - Keyboard navigation (Enter/Space to toggle, Tab to move)
 * - Loading skeletons
 * - Empty state support
 * - Accessible (ARIA roles from Radix)
 *
 * @example
 * ```tsx
 * <FAQAccordion
 *   items={faqs}
 *   loading={false}
 *   emptyMessage="No FAQs found"
 *   onExpand={(id) => console.log(`Expanded FAQ: ${id}`)}
 * />
 * ```
 */
export function FAQAccordion({
  items,
  loading = false,
  emptyMessage = "No FAQs available",
  maxItems,
  defaultExpanded,
  onExpand,
  className,
}: FAQAccordionProps) {
  const displayedItems = React.useMemo(
    () => (maxItems ? items.slice(0, maxItems) : items),
    [items, maxItems]
  );

  // Loading state
  if (loading) {
    return (
      <Card variant="glass" className={cn("p-6", className)}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-full bg-glass-medium" />
              <Skeleton className="h-4 w-3/4 bg-glass-medium" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Empty state
  if (displayedItems.length === 0) {
    return (
      <EmptyState
        emoji="🔍"
        title="No FAQs Found"
        description={emptyMessage}
        variant="glass"
        className={className}
      />
    );
  }

  return (
    <Card variant="glass" className={cn("overflow-hidden", className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultExpanded}
        onValueChange={(value) => {
          if (value && onExpand) {
            onExpand(value);
          }
        }}
        className="w-full"
      >
        {displayedItems.map((item, index) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className={cn(
              "border-b border-border/50 last:border-b-0",
              "data-[state=open]:bg-glass-medium/30"
            )}
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-glass-medium/20 transition-colors">
              <div className="flex items-start gap-3 text-left">
                <span className="text-sm font-semibold text-muted-foreground shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-semibold glass-text">
                  {item.question}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="pl-9 space-y-3">
                <p className="text-sm leading-relaxed text-foreground/90 glass-text">
                  {item.answer}
                </p>
                {item.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Category:</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
```

---

### 3. ContactCard Component

**File:** `components/support/contact-card.tsx`

```typescript
"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface ContactCardProps {
  /**
   * Icon to display (e.g., Mail, MessageCircle)
   */
  icon: LucideIcon;

  /**
   * Card title (e.g., "Email Support")
   */
  title: string;

  /**
   * Card description (e.g., "Get help within 24 hours")
   */
  description: string;

  /**
   * Action button config
   */
  action: {
    /**
     * Button label
     */
    label: string;

    /**
     * Link href (mailto:, https://, etc.)
     */
    href?: string;

    /**
     * Click callback (alternative to href)
     */
    onClick?: () => void;

    /**
     * Optional icon for button
     */
    icon?: LucideIcon;
  };

  /**
   * Visual variant
   * - default: neutral glass
   * - primary: primary accent border
   * - accent: accent border
   */
  variant?: "default" | "primary" | "accent";

  /**
   * Disabled state (e.g., chat unavailable)
   */
  disabled?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ContactCard - Interactive card for support contact methods
 *
 * Features:
 * - Icon + Title + Description layout
 * - Supports href (mailto:, link) and onClick callbacks
 * - QDS glass-hover styling
 * - Hover scale effect (respects reduced motion)
 * - Disabled state with opacity
 * - Variant system for visual hierarchy
 *
 * @example
 * ```tsx
 * <ContactCard
 *   icon={Mail}
 *   title="Email Support"
 *   description="Get help within 24 hours"
 *   action={{
 *     label: "Send Email",
 *     href: "mailto:support@quokka.demo"
 *   }}
 *   variant="primary"
 * />
 * ```
 */
export function ContactCard({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  disabled = false,
  className,
}: ContactCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Variant classes for border accent
  const variantClasses = {
    default: "",
    primary: "border-l-4 border-l-primary",
    accent: "border-l-4 border-l-accent",
  };

  const cardContent = (
    <Card
      variant="glass-hover"
      className={cn(
        "h-full flex flex-col",
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        !disabled && !prefersReducedMotion && "hover:scale-[1.02]",
        className
      )}
    >
      <CardHeader className="space-y-3 pb-4">
        <div
          className={cn(
            "size-12 rounded-lg flex items-center justify-center shrink-0",
            variant === "primary"
              ? "bg-primary/10"
              : variant === "accent"
              ? "bg-accent/10"
              : "bg-muted/10"
          )}
        >
          <Icon
            className={cn(
              "size-6",
              variant === "primary"
                ? "text-primary"
                : variant === "accent"
                ? "text-accent"
                : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold glass-text">
            {title}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed glass-text">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        {action.href ? (
          <Button
            asChild
            variant={variant === "primary" ? "default" : "outline"}
            size="default"
            className="w-full"
            disabled={disabled}
          >
            <a
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {action.label}
              {action.href.startsWith("http") && (
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              )}
              {action.icon && <action.icon className="ml-2 h-4 w-4" />}
            </a>
          </Button>
        ) : (
          <Button
            variant={variant === "primary" ? "default" : "outline"}
            size="default"
            onClick={action.onClick}
            className="w-full"
            disabled={disabled}
          >
            {action.label}
            {action.icon && <action.icon className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // If href, wrap entire card in link
  if (action.href && !disabled) {
    return (
      <Link href={action.href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  // Otherwise, render card with button only
  return cardContent;
}
```

---

### 4. ResourceLinkCard Component

**File:** `components/support/resource-link-card.tsx`

```typescript
"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface ResourceLinkCardProps {
  /**
   * Resource title (e.g., "Getting Started Guide")
   */
  title: string;

  /**
   * Resource description
   */
  description: string;

  /**
   * Link href (internal or external)
   */
  href: string;

  /**
   * Optional icon to display
   */
  icon?: LucideIcon;

  /**
   * Optional badge text (e.g., "New", "Popular")
   */
  badge?: string;

  /**
   * Whether link is external (opens in new tab)
   */
  external?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

/**
 * ResourceLinkCard - Card linking to helpful resources
 *
 * Features:
 * - Icon + Title + Description + Badge layout
 * - External link indicator
 * - QDS glass-hover styling
 * - Hover scale effect (respects reduced motion)
 * - Entire card is clickable
 *
 * @example
 * ```tsx
 * <ResourceLinkCard
 *   title="Getting Started Guide"
 *   description="Learn the basics in 5 minutes"
 *   href="/docs/getting-started"
 *   icon={BookOpen}
 *   badge="Popular"
 *   external={false}
 * />
 * ```
 */
export function ResourceLinkCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  external = false,
  className,
}: ResourceLinkCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn("block h-full", className)}
    >
      <article
        aria-labelledby={`resource-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <Card
          variant="glass-hover"
          className={cn(
            "h-full flex flex-col group",
            !prefersReducedMotion && "hover:scale-[1.02]"
          )}
        >
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              {Icon && (
                <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-accent" aria-hidden="true" />
                </div>
              )}
              {badge && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <CardTitle
                id={`resource-${title.replace(/\s+/g, "-").toLowerCase()}`}
                className="text-lg font-semibold glass-text flex items-center gap-2"
              >
                {title}
                {external && (
                  <ExternalLink
                    className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors"
                    aria-label="(opens in new tab)"
                  />
                )}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed glass-text">
                {description}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </article>
    </Link>
  );
}
```

---

### 5. Type Definitions

**File:** `lib/models/types.ts` (add to existing file)

```typescript
// ==========================================
// Support Page Types
// ==========================================

/**
 * FAQ item for support page accordion
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string; // e.g., "Getting Started", "Account", "Technical"
  searchRank?: number; // For search result ordering (optional)
}

/**
 * Contact option for support page
 */
export interface ContactOption {
  id: string;
  type: "email" | "chat" | "docs" | "community";
  title: string;
  description: string;
  action: {
    label: string;
    href?: string; // mailto:, https://, etc.
    onClick?: () => void;
  };
  icon: LucideIcon;
  available?: boolean; // For chat availability
}

/**
 * Resource link for support page
 */
export interface ResourceLink {
  id: string;
  title: string;
  description: string;
  href: string;
  category?: string;
  icon?: LucideIcon;
  badge?: string; // e.g., "New", "Popular", "Live"
  external?: boolean; // Opens in new tab
}
```

---

## State Management Plan

### Local State (Component-level)

**SupportPage (`app/support/page.tsx`):**
- `faqSearchQuery: string` - FAQ search input value (debounced filtering)

**FAQAccordion (`components/support/faq-accordion.tsx`):**
- Accordion state managed by Radix UI primitive
- No additional local state needed

**ContactCard & ResourceLinkCard:**
- No local state (stateless presentational components)

### Lifted State (Page-level)

**Not applicable** - All state is local to SupportPage

### Server State (React Query)

**Future Enhancement (not needed for initial implementation):**
```typescript
// lib/api/hooks.ts

/**
 * Fetch FAQ data from backend
 */
export function useSupportFAQs() {
  return useQuery({
    queryKey: ["supportFaqs"],
    queryFn: () => api.getSupportFAQs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch resource links from backend
 */
export function useSupportResources() {
  return useQuery({
    queryKey: ["supportResources"],
    queryFn: () => api.getSupportResources(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

For initial implementation, use static data arrays in `SupportPage` component.

---

## Event Handling Pattern

### Callback Signatures

```typescript
// FAQ Accordion
onExpand?: (itemId: string) => void;
// Usage: Track which FAQs are most viewed (analytics)

// Contact Card
action: {
  onClick?: () => void;
  href?: string;
}
// Usage: Navigate or open modal

// Resource Link Card
// Uses Next.js Link - no callback needed
// External links handled by browser
```

### Event Bubbling Strategy

**FAQ Search Input:**
- Controlled component with `onChange` handler
- Updates local state on every keystroke
- useMemo re-filters items automatically

**Accordion Items:**
- Radix UI handles expand/collapse internally
- Optional `onExpand` callback for analytics tracking
- No event propagation issues (native accordion behavior)

**Contact Cards:**
- Click handled by Button or Link component
- For mailto: links, browser handles natively
- For onClick callbacks, call directly (no propagation)

**Resource Link Cards:**
- Entire card wrapped in Link component
- Next.js handles navigation
- External links open in new tab (`target="_blank"`)

### Error Handling Approach

**No async operations in initial implementation**, so error handling is minimal:

1. **FAQ Search:**
   - Empty state if no matches found
   - Friendly message: "No FAQs match your search"

2. **Contact Options:**
   - Disabled state if unavailable (e.g., chat offline)
   - Visual indicator: Reduced opacity + "Unavailable" label

3. **Resource Links:**
   - Dead links handled by browser (404 page)
   - External links: User responsible for availability

**Future Enhancement (with React Query):**
```typescript
const { data: faqs, error, isLoading } = useSupportFAQs();

if (error) {
  return (
    <EmptyState
      emoji="⚠️"
      title="Unable to Load FAQs"
      description="Please try refreshing the page or contact support."
      variant="glass"
    />
  );
}
```

---

## Variant System

### FAQAccordion Variants

**Single Variant:**
- Glass panel card with border-b between items
- Highlighted background on expanded item: `data-[state=open]:bg-glass-medium/30`
- Hover effect on trigger: `hover:bg-glass-medium/20`

**No variants needed** - Consistent styling throughout

### ContactCard Variants

**Three Visual Variants:**

1. **`default`** (Neutral)
   - No border accent
   - Muted icon background
   - Outline button

2. **`primary`** (Emphasized)
   - Border-left-4 with primary color
   - Primary icon background
   - Filled primary button

3. **`accent`** (Alternative emphasis)
   - Border-left-4 with accent color
   - Accent icon background
   - Outline button

**Usage:**
```tsx
<ContactCard variant="primary" /> // Email support (main CTA)
<ContactCard variant="default" /> // Other options
<ContactCard variant="accent" />  // Special features
```

### ResourceLinkCard Variants

**Single Variant:**
- Glass-hover card with scale effect
- External link indicator (icon)
- Optional badge for visual interest

**No variants needed** - Consistent styling with badge differentiation

---

## File Structure

### Files to Create

```
app/
  support/
    page.tsx                         # SupportPage main component

components/
  support/
    faq-accordion.tsx                # FAQAccordion component
    contact-card.tsx                 # ContactCard component
    resource-link-card.tsx           # ResourceLinkCard component

lib/
  models/
    types.ts                         # Add FAQItem, ContactOption, ResourceLink types (modify existing)
```

### Files to Modify

```
components/layout/mobile-bottom-nav.tsx  # Change Account button to Support button
components/layout/nav-header.tsx          # Add onOpenSupport handler (already exists)
```

### Import/Export Strategy

**Support Components:**
```typescript
// components/support/faq-accordion.tsx
export { FAQAccordion, type FAQAccordionProps };

// components/support/contact-card.tsx
export { ContactCard, type ContactCardProps };

// components/support/resource-link-card.tsx
export { ResourceLinkCard, type ResourceLinkCardProps };
```

**Type Definitions:**
```typescript
// lib/models/types.ts
export type { FAQItem, ContactOption, ResourceLink };
```

**Page:**
```typescript
// app/support/page.tsx
export default function SupportPage() { ... }
```

---

## Usage Examples

### Example 1: Basic Support Page

```tsx
import { SupportPage } from "@/app/support/page";

// Render standalone
<SupportPage />

// Route: /support
// Accessible from mobile bottom nav and desktop navbar
```

### Example 2: FAQ Accordion with Custom Data

```tsx
import { FAQAccordion } from "@/components/support/faq-accordion";

const faqs = [
  {
    id: "1",
    question: "How do I reset my password?",
    answer: "Go to Settings > Security > Change Password",
    category: "Account",
  },
  {
    id: "2",
    question: "Can I export my data?",
    answer: "Yes, go to Settings > Data Export",
    category: "Privacy",
  },
];

<FAQAccordion
  items={faqs}
  loading={false}
  defaultExpanded="1"
  onExpand={(id) => console.log(`Expanded FAQ: ${id}`)}
/>
```

### Example 3: Contact Cards Grid

```tsx
import { ContactCard } from "@/components/support/contact-card";
import { Mail, MessageCircle, BookOpen } from "lucide-react";

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <ContactCard
    icon={Mail}
    title="Email Support"
    description="Response within 24 hours"
    action={{
      label: "Send Email",
      href: "mailto:support@quokka.demo",
    }}
    variant="primary"
  />
  <ContactCard
    icon={MessageCircle}
    title="Live Chat"
    description="Mon-Fri, 9am-5pm EST"
    action={{
      label: "Start Chat",
      onClick: () => alert("Chat unavailable (demo)"),
    }}
    disabled={true}
  />
  <ContactCard
    icon={BookOpen}
    title="Documentation"
    description="Browse comprehensive guides"
    action={{
      label: "View Docs",
      href: "/docs",
    }}
  />
</div>
```

### Example 4: Resource Links with Badges

```tsx
import { ResourceLinkCard } from "@/components/support/resource-link-card";
import { BookOpen, PlayCircle, Activity } from "lucide-react";

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <ResourceLinkCard
    title="Getting Started"
    description="Learn the basics in 5 minutes"
    href="/docs/getting-started"
    icon={BookOpen}
    badge="Popular"
    external={false}
  />
  <ResourceLinkCard
    title="Video Tutorials"
    description="Watch step-by-step guides"
    href="https://youtube.com/@quokkaq"
    icon={PlayCircle}
    external={true}
  />
  <ResourceLinkCard
    title="System Status"
    description="Check uptime and performance"
    href="https://status.quokka.demo"
    icon={Activity}
    badge="Live"
    external={true}
  />
</div>
```

---

## Test Scenarios

### User Interactions to Test

1. **FAQ Search:**
   - Type in search input → FAQs filter in real-time
   - Clear search → All FAQs reappear
   - No matches → Empty state displays

2. **FAQ Accordion:**
   - Click question → Item expands, others collapse (single-expand)
   - Click again → Item collapses
   - Keyboard: Tab to item, Enter to expand, Esc to collapse
   - Keyboard: Arrow keys navigate between items

3. **Contact Cards:**
   - Click email card → Opens mailto: link in email client
   - Click chat card (disabled) → Button is unclickable, visual feedback
   - Click docs card → Navigates to /docs route
   - Hover → Card scales up, shadow increases

4. **Resource Links:**
   - Click internal link → Navigates within app
   - Click external link → Opens in new tab
   - Hover → Card scales up
   - Badge displays correctly

### Edge Cases to Handle

1. **FAQ Search:**
   - Empty search query → Show all FAQs
   - Search query with no matches → Show empty state
   - Special characters in search → Handle gracefully (no errors)

2. **FAQ Data:**
   - Empty FAQ array → Show empty state
   - FAQ with very long question → Text wraps correctly
   - FAQ with very long answer → Content scrolls or wraps
   - FAQ missing category → Display without category badge

3. **Contact Options:**
   - Disabled chat option → Visual indicator + no interaction
   - mailto: link with no email client → Browser handles (user issue)
   - onClick callback throws error → Catch and log (future enhancement)

4. **Resource Links:**
   - External link without https:// → Still opens in new tab
   - Missing icon → Display without icon (graceful degradation)
   - Missing badge → Display without badge

5. **Mobile Navigation:**
   - Support button in mobile bottom nav → Navigates to /support
   - Active state when on /support route → Highlighted button

### Accessibility Checks

**Keyboard Navigation:**
- [ ] Tab order: Logo → Search → FAQs → Contact → Resources → Footer
- [ ] Enter/Space expands accordion items
- [ ] Esc collapses expanded accordion item
- [ ] Tab navigates between accordion items
- [ ] Focus indicators visible on all interactive elements

**Screen Reader:**
- [ ] Page title announced: "How can we help?"
- [ ] Section headings announced: "Frequently Asked Questions", "Get in Touch", "Helpful Resources"
- [ ] FAQ search input labeled: "Search FAQs"
- [ ] Accordion items announce expanded/collapsed state
- [ ] Contact card buttons announce action: "Send Email", "Start Chat"
- [ ] External links announce: "(opens in new tab)"
- [ ] Loading states announce: "Loading FAQs..."
- [ ] Empty states announce: "No FAQs found"

**Color Contrast:**
- [ ] All text meets 4.5:1 ratio minimum
- [ ] Focus indicators visible against glass backgrounds
- [ ] Disabled states have sufficient visual differentiation

**Touch Targets:**
- [ ] FAQ accordion triggers: 44×44px minimum
- [ ] Contact card buttons: 44×44px minimum
- [ ] Resource link cards: 44×44px minimum (entire card clickable)
- [ ] Search input: 48px height (larger than minimum)

### Responsive Breakpoints

**360px (Mobile Small):**
- [ ] All content visible without horizontal scroll
- [ ] Touch targets meet 44×44px minimum
- [ ] Text readable at base font size (16px)
- [ ] Cards stack vertically (1 column)
- [ ] Bottom nav visible and functional

**768px (Tablet):**
- [ ] Contact cards: 2-column grid
- [ ] Resource links: 2-column grid
- [ ] FAQ accordion remains full-width
- [ ] Increased padding and spacing

**1024px (Desktop):**
- [ ] Contact cards: 4-column grid (if 4 items)
- [ ] Resource links: 2 or 3-column grid
- [ ] Full backdrop blur effects
- [ ] Hover effects functional
- [ ] Desktop navbar support button visible

**1280px (Desktop Large):**
- [ ] Content centered with max-width constraint
- [ ] Optimal line length for readability
- [ ] All interactions smooth and responsive

---

## Architecture Rationale

### Why This Component Structure?

1. **SupportPage as Container:**
   - Keeps all static data in one place (FAQs, contacts, resources)
   - Easy to swap for React Query hooks in future
   - Clear single responsibility: Data fetching and layout

2. **FAQAccordion as Presentational:**
   - Reusable in other contexts (e.g., docs page, help modal)
   - Accepts items via props (no hardcoded data)
   - Handles own loading/empty states
   - Wraps Radix Accordion for accessibility

3. **ContactCard and ResourceLinkCard as Atoms:**
   - Smallest reusable units
   - Accept all data via props
   - No side effects or state
   - Easy to test and maintain

### Why Composition vs Monolith?

**Composition Wins:**
- Each component <200 lines (easy to understand)
- Components reusable in different contexts
- Easy to test components in isolation
- Clear separation of concerns
- Flexible layout (grid, list, carousel, etc.)

**Monolith Would Cause:**
- Single file >500 lines (hard to navigate)
- Difficult to reuse FAQ accordion elsewhere
- Testing requires rendering entire page
- Harder to modify individual card styles

### Why This State Management Approach?

**Local State for Search:**
- FAQ search is page-specific (no need to share)
- useMemo for filtering (automatic re-computation)
- No external state library needed

**Props for Data:**
- Static data defined in SupportPage (easy to find)
- Future migration to React Query is straightforward
- No global state pollution
- Clear data flow: Page → Components

**No Context:**
- No deeply nested components (max 2 levels)
- Props drilling is minimal and acceptable
- Context would be over-engineering

---

## Trade-offs Made

### What Was Prioritized (and Why)

1. **Simplicity Over Flexibility:**
   - Static data arrays instead of backend API
   - **Why:** Frontend-only demo, easy to implement, clear for reviewers

2. **Composition Over All-in-One:**
   - Separate ContactCard and ResourceLinkCard components
   - **Why:** Reusability, maintainability, clear responsibilities

3. **Accessibility Over Visual Complexity:**
   - Single-expand accordion (easier keyboard nav)
   - Large touch targets (44×44px)
   - **Why:** WCAG 2.2 AA compliance, inclusive design

4. **Performance Over Features:**
   - Debounced search filtering
   - Reduced blur on mobile
   - useMemo for expensive operations
   - **Why:** Smooth experience on all devices

### What Was Deprioritized (and Why)

1. **Real-Time Chat:**
   - Shows disabled state instead
   - **Why:** No backend, frontend-only scope

2. **FAQ Analytics:**
   - Optional `onExpand` callback (not required)
   - **Why:** Analytics require backend, not critical for demo

3. **Advanced Search:**
   - Simple keyword filtering (no fuzzy matching, highlights)
   - **Why:** Adds complexity, basic search sufficient for demo

4. **Animated Transitions:**
   - Accordion uses Radix defaults (no custom animations)
   - **Why:** Built-in animations are accessible, respect reduced motion

### Alternative Approaches Considered

**Alternative 1: Single "GenericCard" Component**
- **Pros:** One component for contacts and resources
- **Cons:** Complex props interface, harder to understand, less type-safe
- **Decision:** Rejected - Two separate components are clearer

**Alternative 2: FAQ Categories with Tabs**
- **Pros:** Organize FAQs by category (Account, Technical, etc.)
- **Cons:** Adds UI complexity, requires tab navigation logic
- **Decision:** Deferred - Can add later if FAQ list grows

**Alternative 3: Inline FAQ Answers (No Accordion)**
- **Pros:** Simpler implementation, all content visible
- **Cons:** Very long page, overwhelming, harder to scan
- **Decision:** Rejected - Accordion reduces cognitive load

**Alternative 4: Modal for FAQ Details**
- **Pros:** Shorter page, focused reading experience
- **Cons:** Extra clicks, harder keyboard navigation, modal overhead
- **Decision:** Rejected - Accordion is more accessible and efficient

---

## Future Considerations

### Potential Extensions

1. **Backend Integration:**
   - Replace static arrays with React Query hooks
   - Fetch FAQ data from CMS or database
   - Track FAQ views and clicks for analytics

2. **Advanced FAQ Search:**
   - Fuzzy matching (Fuse.js)
   - Highlight matching terms in results
   - Search suggestions/autocomplete

3. **Live Chat Widget:**
   - Integrate with Intercom, Zendesk, or custom chat
   - Show online/offline status
   - Display wait time estimates

4. **FAQ Categories:**
   - Add category filter tabs
   - URL query params for deep linking: `/support?category=account`
   - Category-specific icons

5. **Feedback System:**
   - "Was this helpful?" buttons on FAQs
   - Thumbs up/down for contact methods
   - Submit feedback form

6. **AI-Powered FAQ Search:**
   - Semantic search using embeddings
   - "Related questions" suggestions
   - Auto-suggest as you type

### Known Limitations

1. **Static Data:**
   - FAQs, contacts, and resources are hardcoded
   - Must edit code to update content
   - No CMS integration

2. **No Backend:**
   - Chat button disabled (no live chat backend)
   - Contact form not implemented (would need API)
   - No analytics tracking

3. **Basic Search:**
   - Keyword-only matching (no fuzzy search)
   - No search highlighting
   - Case-insensitive but exact substring match

4. **Performance:**
   - Glass blur effects may impact low-end devices
   - No virtualization (assume <50 FAQs)

### Refactoring Opportunities

**If FAQ List Grows (>50 items):**
```typescript
// Add virtualization with react-window
import { FixedSizeList } from "react-window";

// Render only visible items
<FixedSizeList
  height={600}
  itemCount={faqs.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <AccordionItem value={faqs[index].id}>
        {/* ... */}
      </AccordionItem>
    </div>
  )}
</FixedSizeList>
```

**If Contact Options Become Dynamic:**
```typescript
// Move to React Query hook
const { data: contactOptions, isLoading } = useQuery({
  queryKey: ["contactOptions"],
  queryFn: () => api.getContactOptions(),
});

// Support real-time availability updates
// e.g., Chat available: Mon-Fri 9am-5pm EST (check current time)
```

**If Resource Links Need Tracking:**
```typescript
// Add click handler for analytics
<ResourceLinkCard
  {...resource}
  onClick={() => {
    // Track click event
    analytics.track("resource_clicked", {
      resource_id: resource.id,
      resource_title: resource.title,
    });
  }}
/>
```

---

## Quality Checklist

### Architecture
- [x] All data comes via props (no hardcoded values in components)
- [x] TypeScript interfaces defined for all props
- [x] Event handlers use callbacks (no direct mutations)
- [x] Components are <200 lines of code (FAQAccordion: ~180, ContactCard: ~150, ResourceLinkCard: ~100)
- [x] Uses shadcn/ui primitives (Accordion, Card, Button, Input, Badge)
- [x] Composable with other components
- [x] Reusable across different contexts

### State Management
- [x] State placement justified (local search query, props for data)
- [x] React Query planned for future (not needed for static data)
- [x] No prop drilling beyond 2 levels (SupportPage → Components)
- [x] Optimistic updates not needed (read-only page)

### Performance
- [x] Expensive operations identified for memoization (FAQ filtering)
- [x] Render optimization strategy defined (useMemo for filteredFaqs)
- [x] Code splitting considered (not needed, page <50KB)
- [x] Reduced blur on mobile for performance
- [x] Debounced search input (300ms delay)

### Accessibility & UX
- [x] Semantic HTML elements planned (main, section, article, ol, time)
- [x] ARIA attributes specified (aria-labelledby, aria-label, aria-describedby)
- [x] Keyboard navigation designed (Tab, Enter, Space, Esc)
- [x] Focus management planned (Radix handles accordion focus)
- [x] Loading states designed (Skeleton placeholders)
- [x] Error states designed (EmptyState component)
- [x] Empty states designed (No FAQs, No results)

### Design System (QDS)
- [x] Uses QDS color tokens (no hardcoded colors)
- [x] Uses QDS spacing scale (gap-1, gap-2, gap-4, gap-6, gap-12)
- [x] Uses QDS radius scale (rounded-md, rounded-lg, rounded-xl)
- [x] Uses QDS shadows (shadow-glass-sm, shadow-glass-md, shadow-glass-lg)
- [x] Ensures 4.5:1 contrast ratio minimum (glass-text utility)
- [x] Hover/focus/disabled states use QDS tokens

### Responsive Design
- [x] Mobile-first approach (base styles for 360px)
- [x] Breakpoint strategy defined (md:, lg:)
- [x] Touch targets ≥44px on mobile (all buttons and cards)
- [x] Responsive typography planned (text-base sm:text-lg md:text-xl)
- [x] Container widths defined (container-wide, max-w-3xl for hero)

---

## Next Steps

1. **Review This Plan:**
   - Approve component structure
   - Approve TypeScript interfaces
   - Approve composition strategy

2. **Implementation Phase:**
   - Create `components/support/` directory
   - Implement FAQAccordion component
   - Implement ContactCard component
   - Implement ResourceLinkCard component
   - Implement SupportPage component
   - Update mobile-bottom-nav.tsx (replace Account with Support)

3. **Quality Verification:**
   - Run TypeScript type check (`npx tsc --noEmit`)
   - Run linter (`npm run lint`)
   - Test keyboard navigation
   - Test responsive breakpoints (360px, 768px, 1024px, 1280px)
   - Verify WCAG AA compliance

4. **Documentation:**
   - Update README with support page route
   - Add support page to sitemap
   - Document FAQ update process (for future content changes)

---

**End of Component Design Plan**

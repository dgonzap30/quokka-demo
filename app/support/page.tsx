"use client";

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail,
  MessageSquare,
  BookOpen,
  FileText,
  Video,
  Github,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/navigation/back-button";

/**
 * Support Page - Help resources, FAQs, and contact options
 *
 * Features:
 * - QDS 2.0 glassmorphism styling throughout
 * - FAQ accordion with search functionality
 * - Contact options with multiple channels
 * - Resource links to documentation and guides
 * - Full WCAG 2.2 AA accessibility compliance
 * - Responsive design (360px - 1280px)
 */
export default function SupportPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen p-4 md:p-6"
      role="main"
      aria-label="Support and Help"
    >
      <div className="container-wide space-y-8 md:space-y-12">
        {/* Back Navigation */}
        <BackButton />

        {/* Hero Section */}
        <section
          aria-labelledby="support-heading"
          className="py-8 md:py-12 space-y-4"
        >
          <Card
            variant="glass-strong"
            className="p-8 md:p-12 rounded-2xl shadow-[var(--shadow-glass-lg)]"
          >
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div
                className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/10 mb-4"
                aria-hidden="true"
              >
                <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-accent" />
              </div>
              <h1
                id="support-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-bold glass-text"
              >
                How can we help you?
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Find answers to common questions, contact our support team, or explore our documentation
              </p>
            </div>
          </Card>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-6">
          <div className="space-y-2">
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold glass-text"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Quick answers to common questions about QuokkaQ
            </p>
          </div>

          <Card
            variant="glass"
            className="p-6 md:p-8 rounded-xl shadow-[var(--shadow-glass-md)]"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-glass last:border-0"
                >
                  <AccordionTrigger
                    className={cn(
                      "py-4 text-left hover:no-underline",
                      "text-base md:text-lg font-semibold",
                      "hover:text-primary transition-colors",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 focus-visible:rounded-lg"
                    )}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* Contact Options Section */}
        <section aria-labelledby="contact-heading" className="space-y-6">
          <div className="space-y-2">
            <h2
              id="contact-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold glass-text"
            >
              Get in Touch
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose the best way to reach our support team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {contactOptions.map((option) => (
              <ContactCard key={option.title} {...option} />
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section aria-labelledby="resources-heading" className="space-y-6">
          <div className="space-y-2">
            <h2
              id="resources-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold glass-text"
            >
              Helpful Resources
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Explore guides, documentation, and video tutorials
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourceLinks.map((resource) => (
              <ResourceLinkCard key={resource.title} {...resource} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// ============================================
// Contact Card Component
// ============================================

interface ContactCardProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "accent";
}

function ContactCard({
  icon: Icon,
  iconColor,
  title,
  description,
  href,
  onClick,
  variant = "default",
}: ContactCardProps) {
  const variantStyles = {
    default: "hover:border-primary/20 hover:shadow-[var(--shadow-glass-md)]",
    primary: "hover:border-primary/30 hover:shadow-[var(--shadow-glass-md)]",
    accent: "hover:border-accent/30 hover:shadow-[var(--shadow-glass-md)]",
  };

  const content = (
    <>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg shrink-0",
            iconColor
          )}
          aria-hidden="true"
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-lg font-semibold glass-text">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </>
  );

  const baseClasses = cn(
    "block p-6 rounded-xl transition-all duration-300 ease-out",
    "glass-panel backdrop-blur-md border border-glass shadow-[var(--shadow-glass-sm)]",
    "hover:scale-[1.02] active:scale-[0.98]",
    "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60",
    "min-h-[44px]",
    variantStyles[variant]
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        aria-label={`${title}: ${description}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseClasses}
      aria-label={`${title}: ${description}`}
    >
      {content}
    </button>
  );
}

// ============================================
// Resource Link Card Component
// ============================================

interface ResourceLinkCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  badge?: string;
}

function ResourceLinkCard({
  icon: Icon,
  title,
  description,
  href,
  external = false,
  badge,
}: ResourceLinkCardProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "block p-6 rounded-lg group",
        "glass-panel backdrop-blur-md border border-glass shadow-[var(--shadow-glass-sm)]",
        "hover:shadow-[var(--shadow-glass-md)] hover:scale-[1.02] hover:border-accent/20",
        "active:scale-[0.98]",
        "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        "transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60",
        "min-h-[44px]"
      )}
      aria-label={`${title}: ${description}${external ? " (opens in new tab)" : ""}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 shrink-0 group-hover:bg-accent/15 transition-colors"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5 text-accent" />
          </div>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold glass-text group-hover:text-accent transition-colors">
              {title}
            </h3>
            {external && (
              <>
                <ExternalLink
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
                <span className="sr-only">(opens in new tab)</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Data
// ============================================

const faqData = [
  {
    question: "What is QuokkaQ and how does it work?",
    answer:
      "QuokkaQ is an AI-powered academic Q&A platform that helps students get instant answers to their course questions. Our AI analyzes your question, searches through course materials and knowledge base, and provides accurate answers with citations. Instructors can review and endorse AI answers to ensure quality.",
  },
  {
    question: "How do I ask a question?",
    answer:
      'Click the "Ask" button in the bottom navigation bar (mobile) or top navbar (desktop). Type your question, select the relevant course, and submit. Our AI will analyze your question and provide an answer within seconds. You can also browse similar questions to see if your question has already been answered.',
  },
  {
    question: "Can I trust the AI answers?",
    answer:
      "AI answers are generated based on course materials, knowledge base documents, and lecture transcripts. Each answer includes a confidence level (high, medium, low) and citations to source materials. Instructors review and can endorse AI answers to verify accuracy. Always use your judgment and ask for clarification if needed.",
  },
  {
    question: "How do I endorse or flag a post?",
    answer:
      "Students and instructors can endorse helpful answers by clicking the thumbs up icon. Instructors have additional moderation tools to flag inappropriate content or mark questions as resolved. Endorsed answers appear at the top of threads to help other students find quality responses quickly.",
  },
  {
    question: "What happens if my question isn't answered?",
    answer:
      "If the AI cannot provide a confident answer, your question will be flagged for instructor review. Instructors receive notifications about unanswered questions and will respond as soon as possible. You can also check the similar questions panel for related discussions.",
  },
  {
    question: "How do I earn Quokka Points?",
    answer:
      "Earn Quokka Points by participating in the community: asking questions, providing helpful answers, and having your contributions endorsed by instructors or peers. Points are displayed in the top navbar and contribute to leaderboards and achievement badges.",
  },
  {
    question: "Can I edit or delete my posts?",
    answer:
      "You can edit your posts within 15 minutes of posting. After that, contact your instructor if you need to modify content. Deletion is limited to prevent disruption of ongoing discussions. Instructors can delete inappropriate content at any time.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "QuokkaQ follows industry-standard security practices. Your questions and answers are visible to enrolled course members (students and instructors). Personal information is never shared with third parties. All data is encrypted in transit and at rest.",
  },
];

const contactOptions = [
  {
    icon: Mail,
    iconColor: "bg-primary/10 text-primary",
    title: "Email Support",
    description: "Get help via email within 24 hours",
    href: "mailto:support@quokkaq.com",
    variant: "primary" as const,
  },
  {
    icon: MessageSquare,
    iconColor: "bg-accent/10 text-accent",
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    onClick: () => alert("Live chat feature coming soon!"),
    variant: "accent" as const,
  },
  {
    icon: BookOpen,
    iconColor: "bg-secondary/10 text-secondary",
    title: "Documentation",
    description: "Browse our comprehensive help articles",
    href: "/docs",
    variant: "default" as const,
  },
  {
    icon: FileText,
    iconColor: "bg-warning/10 text-warning",
    title: "Submit a Ticket",
    description: "Report a bug or request a feature",
    href: "https://github.com/quokkaq/support/issues",
    variant: "default" as const,
  },
];

const resourceLinks = [
  {
    icon: BookOpen,
    title: "Getting Started Guide",
    description: "Learn the basics of using QuokkaQ",
    href: "/docs/getting-started",
    external: false,
    badge: "Popular",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    href: "https://youtube.com/@quokkaq",
    external: true,
  },
  {
    icon: FileText,
    title: "API Documentation",
    description: "Integrate QuokkaQ with your LMS",
    href: "/docs/api",
    external: false,
  },
  {
    icon: Github,
    title: "Open Source",
    description: "Contribute to QuokkaQ on GitHub",
    href: "https://github.com/quokkaq",
    external: true,
  },
  {
    icon: MessageSquare,
    title: "Community Forum",
    description: "Connect with other users and instructors",
    href: "https://community.quokkaq.com",
    external: true,
    badge: "New",
  },
  {
    icon: HelpCircle,
    title: "FAQ Archive",
    description: "Browse all frequently asked questions",
    href: "/docs/faq",
    external: false,
  },
];

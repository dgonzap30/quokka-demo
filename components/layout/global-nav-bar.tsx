"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/ui/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquarePlus,
  Sparkles,
  HelpCircle,
  Settings,
  User,
  Menu,
} from "lucide-react";
import { QuokkaPointsBadge } from "@/components/navbar/quokka-points-badge";
import { cn } from "@/lib/utils";
import type { QuokkaPointsData } from "@/lib/models/types";

export interface GlobalNavBarProps {
  /** Current user information */
  user: {
    name: string;
    email: string;
    role: string;
  };

  /** Logout handler */
  onLogout: () => void;

  /** Optional breadcrumb for course context */
  breadcrumb?: {
    label: string;
    href: string;
  };

  /** Ask Question handler - opens new question form/modal */
  onAskQuestion?: () => void;

  /** AI Assistant handler - opens AI chat interface */
  onOpenAIAssistant?: () => void;

  /** Support handler - navigates to support/help page */
  onOpenSupport?: () => void;

  /** Settings handler - navigates to settings page */
  onOpenSettings?: () => void;

  /** Optional Quokka Points data for navbar badge */
  quokkaPoints?: QuokkaPointsData;

  /** Optional handler to view detailed points breakdown */
  onViewPointsDetails?: () => void;

  /** Optional className for composition */
  className?: string;

  /** Mobile menu handler - opens mobile navigation drawer */
  onMenuClick?: () => void;
}

export function GlobalNavBar({
  user,
  onLogout,
  breadcrumb,
  onAskQuestion,
  onOpenAIAssistant,
  onOpenSupport,
  onOpenSettings,
  quokkaPoints,
  onViewPointsDetails,
  className,
  onMenuClick,
}: GlobalNavBarProps) {
  const router = useRouter();

  return (
    <>
      <nav
        className={cn(
          // Darker glass navbar: 85% opacity with stronger blur for better contrast
          "w-full z-50 backdrop-blur-xl bg-glass-subtle border-b border-glass shadow-[var(--shadow-glass-lg)] transition-shadow duration-200",
          className
        )}
        role="navigation"
        aria-label="Global navigation"
      >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left Section: Mobile Menu + Logo + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Button (visible on mobile only) */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className={cn(
                  "md:hidden min-h-[44px] min-w-[44px] h-11 w-11",
                  "transition-all duration-300 ease-out",
                  "hover:bg-primary/5 hover:scale-[1.08]",
                  "motion-reduce:hover:scale-100",
                  "focus-visible:ring-4 focus-visible:ring-accent/60"
                )}
                aria-label="Open mobile menu"
                aria-haspopup="true"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Open menu</span>
              </Button>
            )}

            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 text-xl font-bold tracking-tight"
              aria-label="QuokkAQ Home"
            >
              QuokkAQ
            </Link>

            {/* Breadcrumb (Desktop) */}
            {breadcrumb && (
              <nav aria-label="Breadcrumb" className="hidden md:flex items-center text-sm text-neutral-500 min-w-0">
                <Link href="/dashboard" className="hover:text-neutral-900 shrink-0">
                  Dashboard
                </Link>
                <span className="mx-2 text-neutral-300">/</span>
                <span className="truncate text-neutral-900">{breadcrumb.label}</span>
              </nav>
            )}

            {/* Breadcrumb (Mobile - Back Button) */}
            {breadcrumb && (
              <button
                onClick={() => router.push("/dashboard")}
                className="md:hidden text-sm text-neutral-700 hover:text-neutral-900"
                aria-label="Back to Dashboard"
              >
                ← {breadcrumb.label}
              </button>
            )}
          </div>

          {/* Center Section: Search */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <GlobalSearch placeholder="Search threads..." />
          </div>

          {/* Right Section: Icon Actions + Avatar */}
          <div className="flex items-center gap-3">
            {/* Icon Actions Group (Desktop Only) */}
            <div className="hidden md:flex items-center gap-3">
              {/* Ask Question Icon */}
              {onAskQuestion && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAskQuestion}
                  className={cn(
                    "min-h-[44px] min-w-[44px] h-11 w-11",
                    "transition-all duration-300 ease-out",
                    "hover:bg-transparent hover:scale-[1.08]",
                    "motion-reduce:hover:scale-100",
                    "focus-visible:ring-4 focus-visible:ring-accent/60",
                    "group"
                  )}
                  aria-label="Ask Question"
                >
                  <MessageSquarePlus
                    className={cn(
                      "h-5 w-5 text-amber-600/70",
                      "transition-all duration-300 ease-out",
                      "[filter:drop-shadow(0_0_0.5px_rgba(245,158,11,0.3))]",
                      "group-hover:text-amber-600",
                      "group-hover:[filter:drop-shadow(0_0_2px_rgba(245,158,11,0.8))_drop-shadow(0_0_6px_rgba(245,158,11,0.4))_drop-shadow(0_0_12px_rgba(245,158,11,0.2))]",
                      "group-hover:scale-110",
                      "motion-reduce:group-hover:scale-100"
                    )}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Ask Question</span>
                </Button>
              )}

              {/* AI Assistant Icon */}
              {onOpenAIAssistant && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenAIAssistant}
                  className={cn(
                    "min-h-[44px] min-w-[44px] h-11 w-11",
                    "transition-all duration-300 ease-out",
                    "hover:bg-transparent hover:scale-[1.08]",
                    "motion-reduce:hover:scale-100",
                    "focus-visible:ring-4 focus-visible:ring-accent/60",
                    "group"
                  )}
                  aria-label="AI Assistant"
                >
                  <Sparkles
                    className={cn(
                      "h-5 w-5 text-ai-purple-500/70",
                      "transition-all duration-300 ease-out",
                      "[filter:drop-shadow(0_0_0.5px_rgba(168,85,247,0.3))]",
                      "group-hover:text-ai-purple-500",
                      "group-hover:[filter:drop-shadow(0_0_2px_rgba(168,85,247,0.8))_drop-shadow(0_0_6px_rgba(168,85,247,0.4))_drop-shadow(0_0_12px_rgba(168,85,247,0.2))]",
                      "group-hover:rotate-12",
                      "motion-reduce:group-hover:rotate-0"
                    )}
                    aria-hidden="true"
                  />
                  <span className="sr-only">AI Assistant</span>
                </Button>
              )}

              {/* Visual Divider */}
              {(onOpenSupport || onOpenSettings) && (
                <div className="h-6 w-px bg-border" aria-hidden="true" />
              )}

              {/* Support Icon */}
              {onOpenSupport && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSupport}
                  className={cn(
                    "min-h-[44px] min-w-[44px] h-11 w-11",
                    "transition-all duration-300 ease-out",
                    "hover:bg-accent/5 hover:scale-[1.08]",
                    "motion-reduce:hover:scale-100",
                    "focus-visible:ring-4 focus-visible:ring-accent/60",
                    "group"
                  )}
                  aria-label="Support"
                >
                  <HelpCircle
                    className="h-5 w-5 text-foreground/80 transition-all duration-300 ease-out group-hover:text-accent group-hover:scale-110 motion-reduce:group-hover:scale-100"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Support</span>
                </Button>
              )}

              {/* Settings Icon */}
              {onOpenSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSettings}
                  className={cn(
                    "min-h-[44px] min-w-[44px] h-11 w-11",
                    "transition-all duration-300 ease-out",
                    "hover:bg-primary/5 hover:scale-[1.08]",
                    "motion-reduce:hover:scale-100",
                    "focus-visible:ring-4 focus-visible:ring-accent/60",
                    "group"
                  )}
                  aria-label="Settings"
                >
                  <Settings
                    className="h-5 w-5 text-foreground/80 transition-all duration-300 ease-out group-hover:text-primary group-hover:scale-110 group-hover:rotate-45 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Settings</span>
                </Button>
              )}
            </div>

            {/* Quokka Points Badge (Desktop Only) */}
            {quokkaPoints && (
              <>
                <div className="h-6 w-px bg-border" aria-hidden="true" />
                <QuokkaPointsBadge
                  {...quokkaPoints}
                  onViewDetails={onViewPointsDetails}
                  className="hidden md:flex"
                />
              </>
            )}

            {/* User Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "min-h-[44px] min-w-[44px] h-11 w-11",
                    "transition-all duration-300 ease-out",
                    "hover:bg-secondary/5 hover:scale-[1.08]",
                    "motion-reduce:hover:scale-100",
                    "focus-visible:ring-4 focus-visible:ring-accent/60",
                    "group"
                  )}
                  aria-label="Account menu"
                  aria-haspopup="true"
                >
                  <User
                    className="h-5 w-5 text-foreground/80 transition-all duration-300 ease-out group-hover:text-secondary group-hover:scale-110 motion-reduce:group-hover:scale-100"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-danger cursor-pointer"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/ui/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

  /** Optional Ask Question handler (for course context) */
  onAskQuestion?: () => void;

  /** Whether nav has scrolled (for shadow effect) */
  hasScrolled?: boolean;

  /** Optional className for composition */
  className?: string;
}

export function GlobalNavBar({
  user,
  onLogout,
  breadcrumb,
  onAskQuestion,
  hasScrolled = false,
  className,
}: GlobalNavBarProps) {
  const router = useRouter();

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full bg-white/70 backdrop-blur-lg border-b border-black/5 transition-shadow duration-200",
        hasScrolled && "shadow-sm",
        className
      )}
      role="navigation"
      aria-label="Global navigation"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left Section: Logo + Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center min-h-[44px] min-w-[44px]"
            >
              <span className="text-xl font-bold text-neutral-900">
                Quokka<span className="text-primary">Q</span>
              </span>
            </Link>

            {/* Breadcrumb (Desktop) */}
            {breadcrumb && (
              <>
                <ChevronRight
                  className="hidden md:block h-4 w-4 text-neutral-400"
                  aria-hidden="true"
                />
                <Link
                  href={breadcrumb.href}
                  className="hidden md:block text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              </>
            )}

            {/* Breadcrumb (Mobile - Back Button) */}
            {breadcrumb && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 text-neutral-700"
                onClick={() => router.push(breadcrumb.href)}
                aria-label={`Back to ${breadcrumb.label}`}
              >
                ← {breadcrumb.label}
              </Button>
            )}
          </div>

          {/* Center Section: Search */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <GlobalSearch placeholder="Search threads..." />
          </div>

          {/* Right Section: Ask Button + Avatar */}
          <div className="flex items-center gap-3">
            {/* Ask Question Button (Course Context Only) */}
            {onAskQuestion && (
              <Button
                onClick={onAskQuestion}
                className="hidden md:flex h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
                aria-label="Ask a question"
              >
                Ask Question
              </Button>
            )}

            {/* User Avatar Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar className="h-10 w-10 bg-neutral-100 border border-neutral-200">
                    <span className="text-sm font-semibold text-neutral-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
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
  );
}

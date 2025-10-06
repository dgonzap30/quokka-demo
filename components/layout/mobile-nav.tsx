"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  Menu,
  LayoutDashboard,
  MessageSquarePlus,
  MessagesSquare,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface MobileNavProps {
  /** Current active route path */
  currentPath: string;

  /** User information for profile section */
  user: {
    name: string;
    email: string;
    role: string;
  } | null;

  /** Logout handler */
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Ask Question",
    href: "/ask",
    icon: <MessageSquarePlus className="h-4 w-4" />,
  },
  {
    label: "Browse Threads",
    href: "/threads",
    icon: <MessagesSquare className="h-4 w-4" />,
  },
];

/**
 * Determines if a nav item is active based on current path
 */
function isActiveItem(itemHref: string, currentPath: string): boolean {
  if (itemHref === "/dashboard") {
    return currentPath === "/dashboard" ||
           currentPath.startsWith("/courses/") ||
           currentPath === "/courses";
  }

  if (itemHref === "/ask") {
    return currentPath === "/ask";
  }

  if (itemHref === "/threads") {
    return currentPath.startsWith("/threads");
  }

  return currentPath === itemHref;
}

export function MobileNav({ currentPath, user, onLogout }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[280px] glass-panel-strong backdrop-blur-xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">Quokka</span>
              <span className="text-2xl font-bold text-primary">Q</span>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mt-8" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]",
                    isActiveItem(item.href, currentPath)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-glass-medium hover:text-foreground"
                  )}
                  aria-current={isActiveItem(item.href, currentPath) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SheetClose>
            ))}
          </nav>

          {/* User Profile Section */}
          {user && (
            <>
              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <Avatar className="h-11 w-11 avatar-placeholder">
                    <span className="text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-danger min-h-[44px]"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

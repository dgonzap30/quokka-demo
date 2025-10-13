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
  LogOut,
  ArrowLeft,
  MessageSquarePlus,
  Sparkles,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "@/lib/utils/nav-config";

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

  /** Ask Question handler */
  onAskQuestion?: () => void;

  /** AI Assistant handler */
  onOpenAIAssistant?: () => void;

  /** Support handler */
  onOpenSupport?: () => void;

  /** Settings handler */
  onOpenSettings?: () => void;

  /** Optional navigation items - if not provided or empty, only shows user profile */
  items?: NavItem[];

  /** Optional course context for specialized course navigation */
  courseContext?: {
    courseId: string;
    courseCode: string;
    courseName: string;
  };
}

export function MobileNav({
  currentPath,
  user,
  onLogout,
  onAskQuestion,
  onOpenAIAssistant,
  onOpenSupport,
  onOpenSettings,
  items,
  courseContext,
}: MobileNavProps) {
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
            <SheetTitle className="flex items-center text-2xl font-bold tracking-tight">
              QuokkAQ
            </SheetTitle>
          </SheetHeader>

          {/* Course Back Button - only render if in course context */}
          {courseContext && (
            <>
              <div className="mt-6 px-2">
                <SheetClose asChild>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]",
                      "bg-primary/5 border border-primary/20",
                      "text-primary hover:bg-primary/10"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Back to Dashboard</span>
                      <span className="text-xs text-muted-foreground">{courseContext.courseCode} - {courseContext.courseName}</span>
                    </div>
                  </Link>
                </SheetClose>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Action Items - Ask Question, AI, Support, Settings */}
          {(onAskQuestion || onOpenAIAssistant || onOpenSupport || onOpenSettings) && (
            <>
              <nav className="flex flex-col gap-2 mt-6" aria-label="Quick actions">
                {onAskQuestion && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 min-h-[44px] text-base font-medium hover:bg-transparent transition-all duration-300"
                    onClick={() => {
                      setOpen(false);
                      onAskQuestion();
                    }}
                  >
                    <MessageSquarePlus className="h-5 w-5 text-amber-600/70 [filter:drop-shadow(0_0_0.5px_rgba(245,158,11,0.3))] transition-all duration-300" />
                    Ask Question
                  </Button>
                )}

                {onOpenAIAssistant && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 min-h-[44px] text-base font-medium hover:bg-transparent transition-all duration-300"
                    onClick={() => {
                      setOpen(false);
                      onOpenAIAssistant();
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-ai-purple-500/70 [filter:drop-shadow(0_0_0.5px_rgba(168,85,247,0.3))] transition-all duration-300" />
                    AI Assistant
                  </Button>
                )}

                {onOpenSupport && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 min-h-[44px] text-base font-medium hover:bg-accent/5 transition-all duration-300 group"
                    onClick={() => {
                      setOpen(false);
                      onOpenSupport();
                    }}
                  >
                    <HelpCircle className="h-5 w-5 text-foreground/80 group-hover:text-accent transition-all duration-300" />
                    Support
                  </Button>
                )}

                {onOpenSettings && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 min-h-[44px] text-base font-medium hover:bg-primary/5 transition-all duration-300 group"
                    onClick={() => {
                      setOpen(false);
                      onOpenSettings();
                    }}
                  >
                    <SettingsIcon className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-all duration-300" />
                    Settings
                  </Button>
                )}
              </nav>
              <Separator className="my-4" />
            </>
          )}

          {/* Navigation Links - only render if items provided */}
          {items && items.length > 0 && (
            <nav className="flex flex-col gap-2 mt-8" aria-label="Mobile navigation">
              {items.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]",
                      isNavItemActive(item.href, currentPath)
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-glass-medium hover:text-foreground"
                    )}
                    aria-current={isNavItemActive(item.href, currentPath) ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          )}

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

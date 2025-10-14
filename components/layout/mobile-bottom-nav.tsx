"use client";

import { Home, MessageSquarePlus, Sparkles, HelpCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileBottomNavProps {
  /** Current active route path */
  currentPath: string;

  /** Navigate to home/dashboard */
  onNavigateHome: () => void;

  /** Ask Question handler - opens modal/page (CONDITIONAL - only in course context) */
  onAskQuestion?: () => void;

  /** Open Courses modal handler (NEW - CONDITIONAL - only outside course context) */
  onOpenCourses?: () => void;

  /** AI Assistant handler - opens AI chat */
  onOpenAIAssistant?: () => void;

  /** Support handler - navigates to support page */
  onOpenSupport: () => void;
}

/**
 * MobileBottomNav - Native mobile app-style bottom navigation bar
 *
 * Features:
 * - Fixed bottom positioning with iOS safe area support
 * - 4 core navigation items: Home, Ask, AI, Support
 * - Glass morphism styling (QDS compliant)
 * - Active state highlighting
 * - 44px minimum touch targets (WCAG 2.5.5)
 * - Desktop hidden (md:hidden)
 *
 * @example
 * ```tsx
 * <MobileBottomNav
 *   currentPath="/dashboard"
 *   onNavigateHome={() => router.push("/dashboard")}
 *   onAskQuestion={() => setAskModalOpen(true)}
 *   onOpenAIAssistant={() => setAiModalOpen(true)}
 *   onOpenSupport={() => router.push("/support")}
 * />
 * ```
 */
export function MobileBottomNav({
  currentPath,
  onNavigateHome,
  onAskQuestion,
  onOpenCourses,
  onOpenAIAssistant,
  onOpenSupport,
}: MobileBottomNavProps) {
  const isHome = currentPath === "/dashboard" || currentPath === "/";
  const isSupport = currentPath === "/support";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="glass-panel-strong backdrop-blur-xl border-t border-glass shadow-[var(--shadow-glass-lg)]">
        <div className="grid grid-cols-4 gap-0 safe-bottom">
          {/* Home / Dashboard */}
          <button
            onClick={onNavigateHome}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
              "transition-all duration-300 ease-out",
              "hover:bg-primary/5 active:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
              isHome
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Home"
            aria-current={isHome ? "page" : undefined}
          >
            <Home
              className={cn(
                "h-6 w-6 transition-all duration-300",
                isHome && "scale-110"
              )}
              aria-hidden="true"
            />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Courses Button - Show when outside course context */}
          {onOpenCourses && (
            <button
              onClick={onOpenCourses}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
                "transition-all duration-300 ease-out",
                "hover:bg-secondary/5 active:bg-secondary/10",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60",
                "group"
              )}
              aria-label="Select Course"
              aria-haspopup="dialog"
            >
              <BookOpen
                className={cn(
                  "h-6 w-6 text-secondary/70",
                  "transition-all duration-300 ease-out",
                  "group-hover:text-secondary",
                  "group-hover:scale-110",
                  "group-active:scale-105",
                  "motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-secondary dark:text-secondary">
                Courses
              </span>
            </button>
          )}

          {/* Ask Question - Show when in course context */}
          {onAskQuestion && (
            <button
              onClick={onAskQuestion}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
                "transition-all duration-300 ease-out",
                "hover:bg-amber-50 dark:hover:bg-amber-950/20 active:bg-amber-100 dark:active:bg-amber-950/30",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-600/60",
                "group"
              )}
              aria-label="Ask Question"
            >
              <MessageSquarePlus
                className={cn(
                  "h-6 w-6 text-amber-600/70",
                  "transition-all duration-300 ease-out",
                  "[filter:drop-shadow(0_0_0.5px_rgba(245,158,11,0.3))]",
                  "group-hover:text-amber-600",
                  "group-hover:[filter:drop-shadow(0_0_2px_rgba(245,158,11,0.8))_drop-shadow(0_0_6px_rgba(245,158,11,0.4))]",
                  "group-hover:scale-110",
                  "group-active:scale-105",
                  "motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-500">
                Ask
              </span>
            </button>
          )}

          {/* AI Assistant */}
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
                "transition-all duration-300 ease-out",
                "hover:bg-ai-purple-50 dark:hover:bg-ai-purple-950/20 active:bg-ai-purple-100 dark:active:bg-ai-purple-950/30",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ai-purple-500/60",
                "group"
              )}
              aria-label="AI Assistant"
            >
              <Sparkles
                className={cn(
                  "h-6 w-6 text-ai-purple-500/70",
                  "transition-all duration-300 ease-out",
                  "[filter:drop-shadow(0_0_0.5px_rgba(168,85,247,0.3))]",
                  "group-hover:text-ai-purple-500",
                  "group-hover:[filter:drop-shadow(0_0_2px_rgba(168,85,247,0.8))_drop-shadow(0_0_6px_rgba(168,85,247,0.4))]",
                  "group-hover:rotate-12 group-hover:scale-110",
                  "group-active:scale-105 group-active:rotate-6",
                  "motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100 motion-reduce:group-active:rotate-0"
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-ai-purple-600 dark:text-ai-purple-400">
                AI
              </span>
            </button>
          )}

          {/* Support & Help */}
          <button
            onClick={onOpenSupport}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 min-h-[44px]",
              "transition-all duration-300 ease-out",
              "hover:bg-accent/5 active:bg-accent/10",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60",
              isSupport
                ? "text-accent bg-accent/10"
                : "text-muted-foreground hover:text-foreground",
              "group"
            )}
            aria-label="Support and Help"
            aria-current={isSupport ? "page" : undefined}
          >
            <HelpCircle
              className={cn(
                "h-6 w-6 transition-all duration-300 ease-out",
                isSupport
                  ? "text-accent scale-110"
                  : "text-muted-foreground group-hover:text-accent group-hover:scale-110",
                "group-active:scale-105",
                "motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
              )}
              aria-hidden="true"
            />
            <span className={cn(
              "text-xs font-medium transition-colors duration-300",
              isSupport
                ? "text-accent"
                : "text-muted-foreground group-hover:text-accent"
            )}>
              Support
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

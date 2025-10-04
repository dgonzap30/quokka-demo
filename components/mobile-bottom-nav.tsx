"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { MessageSquare, MessageSquarePlus, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: "Threads",
      icon: MessageSquare,
      href: "/",
      show: true,
    },
    {
      label: "Ask",
      icon: MessageSquarePlus,
      href: "/ask",
      show: true,
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/instructor",
      show: user?.role === "instructor",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-md shadow-lg">
      <div
        className="grid gap-1 px-2 pb-safe"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[56px] transition-colors rounded-lg",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-neutral-600 dark:text-neutral-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

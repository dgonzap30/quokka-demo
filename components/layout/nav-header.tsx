"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser, useLogout } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  // Don't show nav on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-panel-strong border-b border-[var(--border-glass)]">
      <div className="container-wide flex h-16 items-center justify-between px-6 md:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 min-h-[44px] min-w-[44px] -ml-3 pl-3">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary glass-text">Quokka</span>
            <span className="text-2xl font-bold text-accent glass-text">Q</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium" role="navigation" aria-label="Main navigation">
          <Link
            href="/dashboard"
            aria-current={isActive("/dashboard") ? "page" : undefined}
            className={`transition-colors hover:text-accent px-4 py-2 min-h-[44px] flex items-center rounded-md ${
              isActive("/dashboard") ? "text-accent bg-accent/10" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/courses"
            aria-current={isActive("/courses") ? "page" : undefined}
            className={`transition-colors hover:text-accent px-4 py-2 min-h-[44px] flex items-center rounded-md ${
              isActive("/courses") ? "text-accent bg-accent/10" : "text-muted-foreground"
            }`}
          >
            Courses
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full" aria-label="User menu">
                <Avatar className="h-11 w-11 avatar-placeholder">
                  <span className="text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
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
              <DropdownMenuItem asChild>
                <Link href="/courses">Courses</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-danger cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

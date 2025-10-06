"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser, useLogout, useCourse } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/ui/global-search";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { CourseNav } from "@/components/layout/course-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getNavContext } from "@/lib/utils/nav-config";
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

  // Detect navigation context (must be before early returns for hook)
  const navContext = getNavContext(pathname || '');

  // Fetch course data (hook must be called unconditionally, before early returns)
  const { data: course } = useCourse(navContext.courseId);

  // Don't show nav on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-panel-strong border-b border-[var(--border-glass)]">
      <div className="container-wide flex h-14 items-center gap-4 px-6 md:px-8">
        {/* Mobile Navigation */}
        <MobileNav
          currentPath={pathname || ""}
          user={user}
          onLogout={handleLogout}
          items={navContext.items}
          courseContext={navContext.context === 'course' && course ? {
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
          } : undefined}
        />

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 min-h-[44px] min-w-[44px]">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary glass-text">Quokka</span>
            <span className="text-2xl font-bold text-primary glass-text">Q</span>
          </div>
        </Link>

        {/* Desktop Navigation - Conditional rendering based on context */}
        {navContext.context === 'course' && course ? (
          <CourseNav
            courseCode={course.code}
            courseName={course.name}
            className="flex-shrink-0"
          />
        ) : (
          <DesktopNav
            currentPath={pathname || ""}
            className="flex-shrink-0"
            items={navContext.items}
          />
        )}

        {/* Global Search */}
        <div className="hidden md:block flex-1 max-w-md">
          <GlobalSearch placeholder="Search threads..." />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4 ml-auto">
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

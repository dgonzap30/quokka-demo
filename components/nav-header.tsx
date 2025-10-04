"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, MessageSquare, BookOpen, Bell, Search, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/session";

export function NavHeader() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = () => {
    clearSession();
    router.push("/auth");
  };

  // Determine correct routes based on user role
  const threadsRoute = user?.role === "instructor" ? "/instructor/threads" : "/student/threads";
  const dashboardRoute = "/instructor/dashboard";
  const coursesRoute = user?.role === "instructor" ? "/instructor/courses" : "/courses";

  return (
    <header className="sticky top-0 z-50 border-b bg-background backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? (user.role === "instructor" ? dashboardRoute : threadsRoute) : "/"} className="flex items-center gap-2 md:gap-2.5 group">
          <div className="text-xl md:text-2xl">🦘</div>
          <div className="text-xl md:text-2xl font-bold text-primary">
            QuokkaQ
          </div>
          <Badge variant="outline" className="ml-2 text-xs hidden md:inline-flex">
            Demo
          </Badge>
        </Link>

        {/* Main Navigation - Centered */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {user.role === "instructor" ? (
              <>
                {/* Dashboard Link - instructor home */}
                <Link href={dashboardRoute}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-4 rounded-lg transition-colors",
                      pathname === dashboardRoute
                        ? "bg-neutral-100 dark:bg-neutral-800 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </div>
                </Link>

                {/* Courses Link - instructor courses */}
                <Link href={coursesRoute}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-4 rounded-lg transition-colors",
                      pathname?.startsWith("/instructor/courses")
                        ? "bg-neutral-100 dark:bg-neutral-800 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium">Courses</span>
                  </div>
                </Link>

                {/* Threads Link - instructor threads */}
                <Link href={threadsRoute}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-4 rounded-lg transition-colors",
                      pathname?.startsWith("/instructor/threads")
                        ? "bg-neutral-100 dark:bg-neutral-800 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Threads</span>
                  </div>
                </Link>
              </>
            ) : (
              /* Student navigation - courses and threads */
              <>
                <Link href={coursesRoute}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-4 rounded-lg transition-colors",
                      pathname?.startsWith("/courses")
                        ? "bg-neutral-100 dark:bg-neutral-800 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium">Courses</span>
                  </div>
                </Link>

                <Link href={threadsRoute}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 h-10 px-4 rounded-lg transition-colors",
                      isActive(threadsRoute) || pathname === "/"
                        ? "bg-neutral-100 dark:bg-neutral-800 text-primary"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Threads</span>
                  </div>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right Section */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Utility Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-transparent"
                disabled
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-transparent relative"
                disabled
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-primary text-primary-foreground font-bold text-xs md:text-sm hover:bg-primary-hover p-0"
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="w-fit mt-1 capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

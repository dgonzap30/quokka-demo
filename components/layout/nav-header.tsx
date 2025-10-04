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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/courses" className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary">Quokka</span>
            <span className="text-2xl font-bold text-accent">Q</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/courses"
            className={`transition-colors hover:text-accent ${
              isActive("/courses") ? "text-accent" : "text-muted-foreground"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/ask"
            className={`transition-colors hover:text-accent ${
              isActive("/ask") ? "text-accent" : "text-muted-foreground"
            }`}
          >
            Ask Question
          </Link>
          <Link
            href="/quokka"
            className={`transition-colors hover:text-accent ${
              isActive("/quokka") ? "text-accent" : "text-muted-foreground"
            }`}
          >
            AI Chat
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 bg-primary/20">
                  <span className="text-sm font-semibold text-primary">
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
                <Link href="/courses">My Courses</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ask">Ask Question</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/quokka">AI Chat</Link>
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

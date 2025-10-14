"use client";

import * as React from "react";
import { User, LogOut, Bell, Moon, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

export interface ProfileSettingsDropdownProps {
  /**
   * Current authenticated user information
   */
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };

  /**
   * Callback when user clicks Logout button
   * Should handle logout mutation and redirect
   */
  onLogout: () => void;

  /**
   * Optional callback when user navigates to Profile page
   */
  onNavigateProfile?: () => void;

  /**
   * Optional callback when user navigates to Notifications settings
   */
  onNavigateNotifications?: () => void;

  /**
   * Optional callback when user navigates to Appearance settings
   */
  onNavigateAppearance?: () => void;

  /**
   * Optional callback when user navigates to Privacy settings
   */
  onNavigatePrivacy?: () => void;

  /**
   * Optional callback when user navigates to Help & Support
   */
  onNavigateHelp?: () => void;

  /**
   * Optional className for trigger button composition
   */
  className?: string;
}

/**
 * ProfileSettingsDropdown Component
 *
 * Redesigned dropdown with sectioned layout and full QDS 2.0 glassmorphism
 *
 * Features:
 * - Profile section: User avatar, name, email, role badge
 * - Settings section: Quick settings options
 * - Logout action with danger styling
 * - Keyboard accessible (Tab, Escape)
 * - WCAG 2.2 AA compliant
 * - QDS 2.0 design tokens (glass-panel, spacing, colors)
 */
export function ProfileSettingsDropdown({
  user,
  onLogout,
  onNavigateProfile,
  onNavigateNotifications,
  onNavigateAppearance,
  onNavigatePrivacy,
  onNavigateHelp,
  className,
}: ProfileSettingsDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "min-h-[44px] min-w-[44px] h-11 w-11",
            "transition-all duration-200",
            "hover:bg-muted/50",
            "focus-visible:ring-2 focus-visible:ring-accent/60",
            className
          )}
          aria-label="Account and Settings"
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          <User
            className="h-5 w-5 text-foreground/70"
            aria-hidden="true"
          />
          <span className="sr-only">Account and Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 glass-panel p-4"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4">
          {/* Profile Header Section */}
          <div className="space-y-3 pb-4 border-b border-border/50">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="size-12 avatar-placeholder" aria-hidden="true">
                {user.avatar && (
                  <AvatarImage src={user.avatar} alt="" />
                )}
                <AvatarFallback className="text-base font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold truncate glass-text" title={user.name}>
                  {user.name}
                </p>
                <p className="text-sm text-muted-foreground glass-text truncate" title={user.email}>
                  {user.email}
                </p>
                {user.role && (
                  <Badge variant="secondary" className="text-xs">
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* View Profile Button */}
            {onNavigateProfile && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigateProfile}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                View Profile
              </Button>
            )}
          </div>

          {/* Settings Options Section */}
          {(onNavigateNotifications || onNavigateAppearance || onNavigatePrivacy || onNavigateHelp) && (
            <nav aria-label="Settings options" className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground glass-text px-2">
                Settings
              </h3>
              <div className="space-y-1">
                {onNavigateNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onNavigateNotifications}
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    Notifications
                  </Button>
                )}
                {onNavigateAppearance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onNavigateAppearance}
                  >
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    Appearance
                  </Button>
                )}
                {onNavigatePrivacy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onNavigatePrivacy}
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Privacy
                  </Button>
                )}
                {onNavigateHelp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onNavigateHelp}
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    Help & Support
                  </Button>
                )}
              </div>
            </nav>
          )}

          {/* Logout Action Section */}
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

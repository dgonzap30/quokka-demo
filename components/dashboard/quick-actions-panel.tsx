"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { QuickActionButton } from "@/lib/models/types";

export interface QuickActionsPanelProps {
  /**
   * Array of actions to display
   */
  actions: QuickActionButton[];

  /**
   * Optional loading state
   */
  loading?: boolean;

  /**
   * Optional className for composition
   */
  className?: string;
}

export function QuickActionsPanel({
  actions,
  loading = false,
  className,
}: QuickActionsPanelProps) {
  if (loading) {
    return (
      <Card className={cn("glass-panel", className)}>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 bg-glass-medium rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="group" aria-label="Quick actions">
          {actions.map((action) => (
            <QuickActionButtonItem key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Internal QuickActionButton component
function QuickActionButtonItem({ action }: { action: QuickActionButton }) {
  const Icon = action.icon;
  const variantClasses = {
    default: "hover:bg-muted hover:border-primary/30",
    primary: "hover:bg-primary/10 hover:border-primary",
    success: "hover:bg-success/10 hover:border-success",
  };

  const content = (
    <>
      <div className="relative">
        <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-full bg-muted">
          <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
        </div>
        {action.badgeCount && action.badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            aria-label={`${action.badgeCount} ${action.label.toLowerCase()}`}
          >
            {action.badgeCount}
          </Badge>
        )}
      </div>
      <span className="text-sm font-medium text-center leading-tight">
        {action.label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex flex-col items-center justify-center gap-3 p-4 rounded-lg border bg-card transition-all",
    variantClasses[action.variant || "default"]
  );

  if (action.href) {
    return (
      <Link href={action.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={action.onClick} className={baseClasses}>
      {content}
    </button>
  );
}

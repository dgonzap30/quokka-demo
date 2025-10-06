"use client";

import type { Citation } from "@/lib/models/types";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CitationCardProps {
  citation: Citation;
  onClick?: (citation: Citation) => void;
  className?: string;
}

export function CitationCard({ citation, onClick, className }: CitationCardProps) {
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "group transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:border-accent/50",
        className
      )}
      onClick={() => isClickable && onClick(citation)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(citation);
        }
      }}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {citation.source}
          </p>
          {citation.link && (
            <ExternalLink
              className="size-3 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          &ldquo;{citation.excerpt}&rdquo;
        </p>
        <div className="flex items-center gap-2 text-xs">
          {citation.relevance && (
            <span className="text-muted-foreground">
              {citation.relevance}% relevant
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

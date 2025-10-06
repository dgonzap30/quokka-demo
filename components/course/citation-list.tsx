"use client";

import { useState } from "react";
import type { Citation } from "@/lib/models/types";
import { CitationCard } from "./citation-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CitationListProps {
  citations: Citation[];
  maxVisible?: number;
  expandable?: boolean;
  onCitationClick?: (citation: Citation) => void;
  className?: string;
}

export function CitationList({
  citations,
  maxVisible = 3,
  expandable = true,
  onCitationClick,
  className,
}: CitationListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (citations.length === 0) {
    return null;
  }

  const showExpandButton = expandable && citations.length > maxVisible;
  const visibleCitations = isExpanded
    ? citations
    : citations.slice(0, maxVisible);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Course Material Citations
          <span className="text-muted-foreground ml-2">
            ({citations.length})
          </span>
        </h3>
      </div>

      <ul role="list" className="space-y-3">
        {visibleCitations.map((citation) => (
          <li key={citation.id}>
            <CitationCard
              citation={citation}
              onClick={onCitationClick}
            />
          </li>
        ))}
      </ul>

      {showExpandButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="w-full"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-4 mr-2" aria-hidden="true" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="size-4 mr-2" aria-hidden="true" />
              Show All {citations.length} Citations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

"use client";

/**
 * QDSInlineCitation - QDS-styled inline citation marker [1] [2]
 *
 * Displays clickable citation numbers with QDS accent styling
 * Maintains accessibility with keyboard navigation and ARIA labels
 */

import { cn } from "@/lib/utils";
import type { QDSInlineCitationProps } from "./types";

export function QDSInlineCitation({
  citationId,
  title,
  onClick,
  className,
}: QDSInlineCitationProps) {
  const handleClick = () => {
    if (!onClick) return;
    onClick(citationId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      className={cn(
        "citation-marker inline-block px-1 py-0.5 mx-0.5 rounded text-xs font-semibold",
        "bg-accent/20 text-accent-foreground hover:bg-accent/30",
        "cursor-pointer transition-colors",
        className
      )}
      onClick={handleClick}
      title={title}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Citation ${citationId}: ${title}`}
    >
      [{citationId}]
    </span>
  );
}

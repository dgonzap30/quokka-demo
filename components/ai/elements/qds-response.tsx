"use client";

/**
 * QDSResponse - QDS-styled wrapper for AI Elements Response component
 *
 * Renders AI assistant message content with:
 * - Streaming markdown support via Response component
 * - Inline citation markers with QDS accent styling
 * - Integration with existing citation parser
 */

import { Response } from "@/components/ai-elements/response";
import { cn } from "@/lib/utils";
import { QDSInlineCitation } from "./qds-inline-citation";
import type { QDSResponseProps } from "./types";
import type { ReactNode } from "react";

/**
 * Render text with highlighted citation markers
 *
 * Converts inline [1] markers into styled, clickable QDSInlineCitation components
 */
function renderTextWithCitations(
  text: string,
  citations: QDSResponseProps["citations"] = []
): ReactNode {
  // No citations - return plain text for Response component
  if (citations.length === 0) {
    return text;
  }

  const citationIds = new Set(citations.map((c) => c.id));
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Find all [N] patterns and replace with QDSInlineCitation components
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const citationNum = parseInt(match[1], 10);

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add citation marker (only if it's a valid citation)
    if (citationIds.has(citationNum)) {
      const citation = citations.find((c) => c.id === citationNum);
      parts.push(
        <QDSInlineCitation
          key={`citation-${match.index}-${citationNum}`}
          citationId={citationNum}
          title={citation?.title || `Citation ${citationNum}`}
          type={citation?.type}
          url={citation?.url}
          onClick={(id) => {
            // Scroll to the sources panel
            const sourcesElement = document.querySelector(
              `[data-citation-id="${id}"]`
            );
            sourcesElement?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }}
        />
      );
    } else {
      // Invalid citation - keep as plain text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export function QDSResponse({
  content,
  citations = [],
  isStreaming = false,
  className,
}: QDSResponseProps) {
  /**
   * Strategy: Use Response (Streamdown) for markdown ONLY when no citations.
   * When citations exist, render manually with QDSInlineCitation components
   * to avoid mixing React elements with markdown strings.
   */

  if (citations.length === 0) {
    // No citations - use Response for streaming markdown
    return (
      <div className={cn("text-sm leading-relaxed", className)}>
        <Response>{content}</Response>
        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse" aria-hidden="true" />
        )}
      </div>
    );
  }

  // Has citations - render manually with citation components
  const contentWithCitations = renderTextWithCitations(content, citations);

  return (
    <div className={cn("text-sm leading-relaxed whitespace-pre-wrap", className)}>
      {contentWithCitations}
      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}

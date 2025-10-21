"use client";

/**
 * QDSResponse - QDS-styled wrapper for AI Elements Response component
 *
 * Renders AI assistant message content with:
 * - Streaming markdown support via Response component (Streamdown)
 * - Inline citation markers with QDS accent styling
 * - Proper markdown formatting for ALL messages (with and without citations)
 */

import { Response } from "@/components/ai-elements/response";
import { cn } from "@/lib/utils";
import { QDSInlineCitation } from "./qds-inline-citation";
import type { QDSResponseProps } from "./types";
import type { ReactNode, ComponentProps } from "react";

/**
 * Process text content to convert citation markers [N] into QDSInlineCitation components
 *
 * This function is used by custom component renderers to handle citations
 * within markdown content while preserving markdown formatting
 */
function processTextWithCitations(
  children: ReactNode,
  citations: QDSResponseProps["citations"] = []
): ReactNode {
  // No citations or no children - return as-is
  if (citations.length === 0 || !children) {
    return children;
  }

  // If children is not a string, return as-is (could be other React elements)
  if (typeof children !== "string") {
    return children;
  }

  const citationIds = new Set(citations.map((c) => c.id));
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Find all [N] patterns and replace with QDSInlineCitation components
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(children)) !== null) {
    const citationNum = parseInt(match[1], 10);

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(children.substring(lastIndex, match.index));
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
  if (lastIndex < children.length) {
    parts.push(children.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : children;
}

export function QDSResponse({
  content,
  citations = [],
  isStreaming = false,
  className,
}: QDSResponseProps) {
  /**
   * Strategy: ALWAYS use Response (Streamdown) for markdown rendering.
   * Use custom component renderers to process citation markers within text nodes.
   * This preserves markdown formatting (code blocks, lists, etc.) while supporting citations.
   */

  // Custom components for rendering markdown with citation support
  const customComponents: ComponentProps<typeof Response>["components"] = citations.length > 0 ? {
    // Process paragraphs for citations
    p: ({ children, ...props }) => (
      <p {...props}>{processTextWithCitations(children, citations)}</p>
    ),
    // Process list items for citations
    li: ({ children, ...props }) => (
      <li {...props}>{processTextWithCitations(children, citations)}</li>
    ),
    // Process inline code for citations (less common but possible)
    code: ({ children, ...props }) => (
      <code {...props}>{processTextWithCitations(children, citations)}</code>
    ),
    // Process strong/bold for citations
    strong: ({ children, ...props }) => (
      <strong {...props}>{processTextWithCitations(children, citations)}</strong>
    ),
    // Process em/italic for citations
    em: ({ children, ...props }) => (
      <em {...props}>{processTextWithCitations(children, citations)}</em>
    ),
  } : undefined;

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <Response components={customComponents}>
        {content}
      </Response>
      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}

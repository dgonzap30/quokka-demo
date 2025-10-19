// ============================================
// Shared API Utilities
// ============================================
//
// Helper functions used across API modules

/**
 * Simulates network delay for mock API
 *
 * @param ms - Optional milliseconds to delay (default: random 200-500ms)
 */
export function delay(ms?: number): Promise<void> {
  const baseDelay = ms ?? 200 + Math.random() * 300; // Default 200-500ms
  return new Promise((resolve) => setTimeout(resolve, baseDelay));
}

/**
 * Generates unique ID with prefix
 *
 * @param prefix - Prefix for the ID (e.g., "user", "thread", "post")
 * @returns Unique ID string
 *
 * @example
 * ```ts
 * const id = generateId("user"); // "user-1699999999999-abc123xyz"
 * ```
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract keywords from text (lowercase, >2 chars, common words removed)
 *
 * Used for search functionality and material indexing.
 *
 * @param text - Text to extract keywords from
 * @returns Array of keywords
 *
 * @example
 * ```ts
 * const keywords = extractKeywords("How does binary search work?");
 * // Returns: ["binary", "search", "work"]
 * ```
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

/**
 * Generate snippet from material content for search results
 *
 * Extracts a portion of content around matched keywords.
 *
 * @param content - Full content text
 * @param keywords - Keywords to highlight/center around
 * @param maxLength - Maximum snippet length
 * @returns Snippet with ... ellipsis if truncated
 *
 * @example
 * ```ts
 * const snippet = generateSnippet(content, ["binary", "search"], 150);
 * // Returns: "...explanation of binary search algorithm which..."
 * ```
 */
export function generateSnippet(content: string, keywords: string[], maxLength: number): string {
  const lowerContent = content.toLowerCase();

  // Find first occurrence of any keyword
  let startIdx = -1;
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword.toLowerCase());
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) {
    // No keyword found, return beginning
    return content.slice(0, maxLength).trim() + (content.length > maxLength ? '...' : '');
  }

  // Extract context around keyword
  const start = Math.max(0, startIdx - 50);
  const end = Math.min(content.length, start + maxLength);
  let snippet = content.slice(start, end).trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

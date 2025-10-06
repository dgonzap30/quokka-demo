/**
 * Search utility functions
 * Includes debouncing, text highlighting, and search result scoring
 */

import type { Thread } from '@/lib/models/types';

// ============================================
// Debouncing
// ============================================

/**
 * Creates a debounced version of a function
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// ============================================
// Text Highlighting
// ============================================

/**
 * Highlights search query matches in text
 *
 * @param text - Text to search in
 * @param query - Search query
 * @returns Text with highlighted matches
 *
 * @example
 * highlightMatches("How do closures work?", "closure")
 * // Returns: "How do <mark>closure</mark>s work?"
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// Search Result Scoring
// ============================================

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  type: 'thread' | 'course';
  courseName?: string;
  url: string;
}

/**
 * Calculate relevance score for a search result
 *
 * @param item - Item to score
 * @param query - Search query
 * @returns Relevance score (higher = more relevant)
 */
export function calculateRelevanceScore(
  item: { title: string; content: string },
  query: string
): number {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = item.title.toLowerCase();
  const lowerContent = item.content.toLowerCase();

  let score = 0;

  // Exact title match: +100 points
  if (lowerTitle === lowerQuery) score += 100;

  // Title starts with query: +50 points
  if (lowerTitle.startsWith(lowerQuery)) score += 50;

  // Title contains query: +30 points
  if (lowerTitle.includes(lowerQuery)) score += 30;

  // Content contains query: +10 points
  if (lowerContent.includes(lowerQuery)) score += 10;

  // Bonus for query at word boundary
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(lowerQuery)}`, 'i');
  if (wordBoundaryRegex.test(lowerTitle)) score += 20;

  return score;
}

/**
 * Filter and sort threads by search query
 *
 * @param threads - Array of threads to search
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 10)
 * @returns Sorted array of search results
 */
export function searchThreads(
  threads: Thread[],
  query: string,
  maxResults = 10
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = threads
    .map(thread => ({
      id: thread.id,
      title: thread.title,
      content: thread.content,
      score: calculateRelevanceScore(
        { title: thread.title, content: thread.content },
        query
      ),
      type: 'thread' as const,
      url: `/threads/${thread.id}`,
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return results;
}

// ============================================
// Query Helpers
// ============================================

/**
 * Normalize search query (trim, lowercase, remove extra spaces)
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if query is valid for search (minimum length, not just spaces)
 */
export function isValidQuery(query: string, minLength = 2): boolean {
  const normalized = normalizeQuery(query);
  return normalized.length >= minLength;
}

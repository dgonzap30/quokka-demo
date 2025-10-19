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

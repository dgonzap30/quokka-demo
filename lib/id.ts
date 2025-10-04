/**
 * Generate a unique ID using crypto.randomUUID()
 * Falls back to timestamp-based ID if crypto is not available
 */
export function generateId(prefix?: string): string {
  const uuid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return prefix ? `${prefix}-${uuid}` : uuid;
}

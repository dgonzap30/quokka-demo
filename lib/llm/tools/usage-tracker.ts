// ============================================
// Tool Usage Tracker - Persistent Storage
// ============================================
//
// Replaces in-memory Map with localStorage-backed tracking
// to ensure rate limits are enforced across restarts.

/**
 * Tool usage data structure
 */
interface ToolUsageData {
  searches: number;
  fetches: number;
  /** Timestamp when this turn started (for TTL) */
  timestamp: number;
}

/**
 * Storage key for tool usage tracking
 */
const STORAGE_KEY = 'quokkaq.toolUsage';

/**
 * Time-to-live for tool usage data (1 hour)
 */
const TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get tool usage data from localStorage
 */
function getStorageData(): Map<string, ToolUsageData> {
  if (typeof window === 'undefined') {
    // Server-side: return empty map (fall back to in-memory)
    return new Map();
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return new Map();

    const parsed = JSON.parse(data);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

/**
 * Save tool usage data to localStorage
 */
function saveStorageData(data: Map<string, ToolUsageData>): void {
  if (typeof window === 'undefined') return; // SSR guard

  try {
    // Convert Map to object for JSON serialization
    const obj = Object.fromEntries(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('[Tool Usage] Failed to persist tool usage:', error);
  }
}

/**
 * Get or initialize tool usage for a turn
 *
 * @param turnId - Unique identifier for this turn (timestamp-based)
 * @returns Tool usage data for this turn
 */
export function getToolUsage(turnId: string): { searches: number; fetches: number } {
  const data = getStorageData();

  if (!data.has(turnId)) {
    const newUsage: ToolUsageData = {
      searches: 0,
      fetches: 0,
      timestamp: Date.now(),
    };
    data.set(turnId, newUsage);
    saveStorageData(data);
  }

  const usage = data.get(turnId)!;
  return { searches: usage.searches, fetches: usage.fetches };
}

/**
 * Increment search count for a turn
 *
 * @param turnId - Unique identifier for this turn
 */
export function incrementSearches(turnId: string): void {
  const data = getStorageData();
  const usage = data.get(turnId) || { searches: 0, fetches: 0, timestamp: Date.now() };

  usage.searches += 1;
  data.set(turnId, usage);
  saveStorageData(data);
}

/**
 * Increment fetch count for a turn
 *
 * @param turnId - Unique identifier for this turn
 */
export function incrementFetches(turnId: string): void {
  const data = getStorageData();
  const usage = data.get(turnId) || { searches: 0, fetches: 0, timestamp: Date.now() };

  usage.fetches += 1;
  data.set(turnId, usage);
  saveStorageData(data);
}

/**
 * Clean up old turn usage data (TTL-based expiration)
 *
 * Removes entries older than TTL_MS (1 hour).
 * This prevents unbounded storage growth.
 *
 * @returns Number of entries cleaned up
 */
export function cleanupOldUsage(): number {
  const data = getStorageData();
  const now = Date.now();
  let cleanedCount = 0;

  for (const [turnId, usage] of data.entries()) {
    if (now - usage.timestamp > TTL_MS) {
      data.delete(turnId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    saveStorageData(data);
    console.log(`[Tool Usage] Cleaned up ${cleanedCount} expired entries`);
  }

  return cleanedCount;
}

/**
 * Get total storage usage for debugging
 */
export function getUsageStats(): {
  totalTurns: number;
  totalSearches: number;
  totalFetches: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  const data = getStorageData();

  let totalSearches = 0;
  let totalFetches = 0;
  let oldestTimestamp: number | null = null;
  let newestTimestamp: number | null = null;

  for (const usage of data.values()) {
    totalSearches += usage.searches;
    totalFetches += usage.fetches;

    if (oldestTimestamp === null || usage.timestamp < oldestTimestamp) {
      oldestTimestamp = usage.timestamp;
    }
    if (newestTimestamp === null || usage.timestamp > newestTimestamp) {
      newestTimestamp = usage.timestamp;
    }
  }

  return {
    totalTurns: data.size,
    totalSearches,
    totalFetches,
    oldestTimestamp,
    newestTimestamp,
  };
}

/**
 * Clear all tool usage data (for testing/debugging)
 */
export function clearAllUsage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

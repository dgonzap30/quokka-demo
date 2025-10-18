/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter with sliding window algorithm.
 * For production, consider using Redis or a proper rate limiting service.
 *
 * Features:
 * - Per-user rate limiting
 * - Configurable window and request limits
 * - Automatic cleanup of expired entries
 * - Returns retry-after timing for 429 responses
 */

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  requests: number;
  /** Time window (e.g., '1m', '1h') */
  window: string;
}

interface RateLimitEntry {
  /** Number of requests made in current window */
  count: number;
  /** Timestamp when the window resets (ms) */
  resetAt: number;
}

interface RateLimitStore {
  [userId: string]: RateLimitEntry;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until retry (only if !allowed) */
  retryAfter?: number;
  /** Current request count */
  count?: number;
  /** Max requests allowed */
  limit?: number;
}

/**
 * In-memory store for rate limit entries
 *
 * Note: This resets on server restart. For production, use Redis.
 */
const store: RateLimitStore = {};

/**
 * Parse window string into milliseconds
 *
 * Supported formats:
 * - '10s' → 10 seconds
 * - '5m' → 5 minutes
 * - '1h' → 1 hour
 *
 * @param window - Window string (e.g., '1m')
 * @returns Milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}. Use format like '1m', '10s', '1h'`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,      // seconds
    m: 60000,     // minutes
    h: 3600000,   // hours
  };

  return value * multipliers[unit];
}

/**
 * Create a rate limiter with specified configuration
 *
 * @param config - Rate limit configuration
 * @returns Rate limiter with check method
 *
 * @example
 * ```typescript
 * const limiter = rateLimit({ requests: 10, window: '1m' });
 * const result = await limiter.check('user-123');
 * if (!result.allowed) {
 *   return Response.json(
 *     { error: 'Rate limit exceeded' },
 *     {
 *       status: 429,
 *       headers: { 'Retry-After': result.retryAfter!.toString() }
 *     }
 *   );
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  const windowMs = parseWindow(config.window);

  return {
    /**
     * Check if a user is within rate limits
     *
     * @param userId - Unique user identifier
     * @returns Rate limit result with allowed status and retry timing
     */
    async check(userId: string): Promise<RateLimitResult> {
      const now = Date.now();
      const userLimit = store[userId];

      // No record or expired window → allow and reset
      if (!userLimit || now > userLimit.resetAt) {
        store[userId] = {
          count: 1,
          resetAt: now + windowMs,
        };
        return {
          allowed: true,
          count: 1,
          limit: config.requests,
        };
      }

      // Within window → check count
      if (userLimit.count < config.requests) {
        userLimit.count += 1;
        return {
          allowed: true,
          count: userLimit.count,
          limit: config.requests,
        };
      }

      // Limit exceeded → deny with retry timing
      const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        count: userLimit.count,
        limit: config.requests,
      };
    },

    /**
     * Reset rate limit for a specific user
     *
     * Useful for testing or administrative actions.
     *
     * @param userId - User to reset
     */
    reset(userId: string): void {
      delete store[userId];
    },

    /**
     * Get current rate limit status for a user
     *
     * @param userId - User to check
     * @returns Current count and reset time, or null if no record
     */
    status(userId: string): { count: number; resetAt: number } | null {
      const entry = store[userId];
      if (!entry) return null;

      const now = Date.now();
      if (now > entry.resetAt) {
        delete store[userId];
        return null;
      }

      return { count: entry.count, resetAt: entry.resetAt };
    },
  };
}

/**
 * Cleanup expired rate limit entries
 *
 * Prevents memory leaks by removing old entries from the store.
 * Should be called periodically (e.g., every 5 minutes).
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const userId in store) {
    if (store[userId].resetAt < now) {
      delete store[userId];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`);
  }
}

/**
 * Start automatic cleanup interval
 *
 * Call once during application startup.
 *
 * @param intervalMs - Cleanup interval in milliseconds (default: 5 minutes)
 * @returns Cleanup interval ID (use clearInterval to stop)
 */
export function startCleanupInterval(intervalMs = 300000): NodeJS.Timeout {
  console.log(`[Rate Limit] Starting cleanup interval (every ${intervalMs / 1000}s)`);
  return setInterval(cleanupExpiredEntries, intervalMs);
}

/**
 * Get current store size (for monitoring)
 *
 * @returns Number of active rate limit entries
 */
export function getStoreSize(): number {
  return Object.keys(store).length;
}

/**
 * Clear all rate limit entries
 *
 * Useful for testing or administrative reset.
 */
export function clearStore(): void {
  for (const key in store) {
    delete store[key];
  }
  console.log('[Rate Limit] Store cleared');
}

"use client";

/**
 * Rate Limit Tracking
 *
 * Simulates LLM API rate limiting for frontend-only demo.
 * Tracks requests per time window and provides limit status.
 *
 * In production, rate limits would be enforced server-side
 * with actual API provider limits (OpenAI, Anthropic, etc.)
 */

const RATE_LIMIT_STORAGE_KEY = "quokka_rate_limit";

// Demo rate limits (much lower than production for visibility)
const HOURLY_LIMIT = 50; // 50 requests per hour (simulated)
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export interface RateLimitStatus {
  /** Total requests in current window */
  requestCount: number;

  /** Maximum requests allowed per window */
  limit: number;

  /** Timestamp when current window started */
  windowStart: string;

  /** Timestamp when window will reset */
  windowEnd: string;

  /** Whether rate limit is currently exceeded */
  isLimited: boolean;

  /** Usage percentage (0-100) */
  usagePercent: number;

  /** Warning level: 'safe' | 'warning' | 'danger' | 'limited' */
  level: "safe" | "warning" | "danger" | "limited";
}

interface RateLimitData {
  requestCount: number;
  windowStart: string;
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): RateLimitStatus {
  if (typeof window === "undefined") {
    return getEmptyStatus();
  }

  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const now = Date.now();

    if (!stored) {
      return initializeWindow();
    }

    const data: RateLimitData = JSON.parse(stored);
    const windowStart = new Date(data.windowStart).getTime();
    const windowEnd = windowStart + WINDOW_MS;

    // Check if window has expired
    if (now >= windowEnd) {
      return initializeWindow();
    }

    // Calculate status
    const requestCount = data.requestCount;
    const isLimited = requestCount >= HOURLY_LIMIT;
    const usagePercent = Math.min(100, Math.round((requestCount / HOURLY_LIMIT) * 100));

    let level: RateLimitStatus["level"];
    if (isLimited) {
      level = "limited";
    } else if (usagePercent >= 90) {
      level = "danger";
    } else if (usagePercent >= 70) {
      level = "warning";
    } else {
      level = "safe";
    }

    return {
      requestCount,
      limit: HOURLY_LIMIT,
      windowStart: data.windowStart,
      windowEnd: new Date(windowEnd).toISOString(),
      isLimited,
      usagePercent,
      level,
    };
  } catch (error) {
    console.error("[RateLimit] Failed to load rate limit status:", error);
    return getEmptyStatus();
  }
}

/**
 * Initialize a new rate limit window
 */
function initializeWindow(): RateLimitStatus {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_MS);

  const data: RateLimitData = {
    requestCount: 0,
    windowStart: now.toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
  }

  return {
    requestCount: 0,
    limit: HOURLY_LIMIT,
    windowStart: now.toISOString(),
    windowEnd: windowEnd.toISOString(),
    isLimited: false,
    usagePercent: 0,
    level: "safe",
  };
}

/**
 * Get empty status (for SSR)
 */
function getEmptyStatus(): RateLimitStatus {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_MS);

  return {
    requestCount: 0,
    limit: HOURLY_LIMIT,
    windowStart: now.toISOString(),
    windowEnd: windowEnd.toISOString(),
    isLimited: false,
    usagePercent: 0,
    level: "safe",
  };
}

/**
 * Record a new API request
 * Returns true if request is allowed, false if rate limited
 */
export function trackRequest(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const status = getRateLimitStatus();

    // Check if already limited
    if (status.isLimited) {
      console.warn("[RateLimit] Rate limit exceeded. Try again after:", status.windowEnd);
      return false;
    }

    // Increment counter
    const data: RateLimitData = {
      requestCount: status.requestCount + 1,
      windowStart: status.windowStart,
    };

    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("[RateLimit] Failed to track request:", error);
    return true; // Allow request on error (fail open)
  }
}

/**
 * Reset rate limit (for testing/demo purposes)
 */
export function resetRateLimit(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
}

/**
 * Get time remaining until window resets
 */
export function getTimeUntilReset(): number {
  const status = getRateLimitStatus();
  const now = Date.now();
  const windowEnd = new Date(status.windowEnd).getTime();
  return Math.max(0, windowEnd - now);
}

/**
 * Format time until reset as human-readable string
 */
export function formatTimeUntilReset(): string {
  const ms = getTimeUntilReset();
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

"use client";

/**
 * AI Usage Metrics Tracking
 *
 * Tracks LLM API usage for cost monitoring and analytics.
 * Stored in localStorage for frontend-only demo.
 *
 * In production, this would be tracked server-side with actual
 * token counts from LLM providers.
 */

const METRICS_STORAGE_KEY = "quokka_ai_metrics";

export interface AIMetrics {
  /** Total conversations created */
  conversationsCreated: number;

  /** Total messages sent by users */
  messagesSent: number;

  /** Total AI responses generated */
  responsesGenerated: number;

  /** Total AI answer previews generated */
  previewsGenerated: number;

  /** Total threads created with AI */
  threadsCreated: number;

  /** Timestamp of first recorded metric */
  firstUsage: string;

  /** Timestamp of last recorded metric */
  lastUsage: string;
}

/**
 * Get all metrics from localStorage
 */
export function getMetrics(): AIMetrics {
  if (typeof window === "undefined") {
    return getEmptyMetrics();
  }

  try {
    const stored = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!stored) {
      return getEmptyMetrics();
    }

    const metrics = JSON.parse(stored) as AIMetrics;
    return metrics;
  } catch (error) {
    console.error("[Metrics] Failed to load metrics:", error);
    return getEmptyMetrics();
  }
}

/**
 * Initialize empty metrics
 */
function getEmptyMetrics(): AIMetrics {
  const now = new Date().toISOString();
  return {
    conversationsCreated: 0,
    messagesSent: 0,
    responsesGenerated: 0,
    previewsGenerated: 0,
    threadsCreated: 0,
    firstUsage: now,
    lastUsage: now,
  };
}

/**
 * Save metrics to localStorage
 */
function saveMetrics(metrics: AIMetrics): void {
  if (typeof window === "undefined") return;

  try {
    metrics.lastUsage = new Date().toISOString();
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error("[Metrics] Failed to save metrics:", error);
  }
}

/**
 * Track a new conversation created
 */
export function trackConversationCreated(): void {
  const metrics = getMetrics();
  metrics.conversationsCreated += 1;
  saveMetrics(metrics);
}

/**
 * Track a user message sent
 */
export function trackMessageSent(): void {
  const metrics = getMetrics();
  metrics.messagesSent += 1;
  saveMetrics(metrics);
}

/**
 * Track an AI response generated
 */
export function trackResponseGenerated(): void {
  const metrics = getMetrics();
  metrics.responsesGenerated += 1;
  saveMetrics(metrics);
}

/**
 * Track an AI preview generated
 */
export function trackPreviewGenerated(): void {
  const metrics = getMetrics();
  metrics.previewsGenerated += 1;
  saveMetrics(metrics);
}

/**
 * Track a thread created with AI
 */
export function trackThreadCreated(): void {
  const metrics = getMetrics();
  metrics.threadsCreated += 1;
  saveMetrics(metrics);
}

/**
 * Reset all metrics (for testing/demo purposes)
 */
export function resetMetrics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(METRICS_STORAGE_KEY);
}

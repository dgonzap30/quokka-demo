// ============================================
// Base LLM Provider Abstract Class
// ============================================

import type {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  TokenUsage,
} from "@/lib/models/types";

/**
 * Abstract base class for LLM providers
 *
 * Provides common functionality for all LLM providers including:
 * - Request validation
 * - Retry logic with exponential backoff
 * - Rate limiting
 * - Cost tracking
 * - Error handling
 *
 * Subclasses must implement:
 * - generateCompletion() - Core LLM API call
 * - estimateTokens() - Token estimation for cost tracking
 */
export abstract class BaseLLMProvider {
  protected config: LLMConfig;
  protected requestCount: number = 0;
  protected totalCost: number = 0;
  protected lastRequestTime: number = 0;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate completion with retry logic and error handling
   *
   * Public method that wraps the provider-specific implementation
   * with retry logic, rate limiting, and error handling.
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Validate request
    this.validateRequest(request);

    // Check rate limiting
    await this.enforceRateLimit();

    // Attempt generation with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Call provider-specific implementation
        const response = await this.generateCompletion(request);

        // Track metrics
        this.requestCount++;
        if (response.success) {
          this.totalCost += response.usage.estimatedCost;
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-retryable errors
        if (!this.isRetryableError(error)) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - return error response
    return {
      success: false,
      error: lastError?.message || "Unknown error occurred",
      code: this.getErrorCode(lastError),
      provider: this.config.provider,
      retryable: false,
    };
  }

  /**
   * Generate streaming completion
   *
   * Returns an async generator that yields chunks as they arrive.
   * Not all providers support streaming.
   */
  async *generateStream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    throw new Error(`Streaming not supported by ${this.config.provider} provider`);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      averageCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.requestCount = 0;
    this.totalCost = 0;
  }

  // ============================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================

  /**
   * Provider-specific completion generation
   *
   * Subclasses implement this to make actual API calls
   * to their respective LLM services.
   */
  protected abstract generateCompletion(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Estimate token count for cost calculation
   *
   * Approximate token count based on text length.
   * Different models have different tokenization schemes.
   */
  protected abstract estimateTokens(text: string): number;

  /**
   * Calculate cost based on token usage
   *
   * Each provider has different pricing models.
   */
  protected abstract calculateCost(usage: TokenUsage): number;

  // ============================================
  // Protected Helper Methods
  // ============================================

  /**
   * Validate LLM request
   */
  protected validateRequest(request: LLMRequest): void {
    if (!request.userPrompt || request.userPrompt.trim().length === 0) {
      throw new Error("User prompt is required");
    }

    if (request.maxTokens && (request.maxTokens < 1 || request.maxTokens > 4000)) {
      throw new Error("Max tokens must be between 1 and 4000");
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 1)) {
      throw new Error("Temperature must be between 0 and 1");
    }

    if (request.topP && (request.topP < 0 || request.topP > 1)) {
      throw new Error("Top P must be between 0 and 1");
    }
  }

  /**
   * Enforce rate limiting
   *
   * Ensures we don't exceed configured requests per minute
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / (this.config.maxTokens || 20); // Default 20 req/min

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Check if error is retryable
   */
  protected isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();

    // Retryable errors: rate limits, timeouts, network issues
    return (
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("429")
    );
  }

  /**
   * Get error code from error object
   */
  protected getErrorCode(error: unknown): string {
    if (!error) return "UNKNOWN_ERROR";

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("rate limit") || message.includes("429")) {
        return "RATE_LIMIT_EXCEEDED";
      }
      if (message.includes("timeout")) {
        return "TIMEOUT";
      }
      if (message.includes("authentication") || message.includes("401")) {
        return "AUTHENTICATION_ERROR";
      }
      if (message.includes("quota") || message.includes("billing")) {
        return "QUOTA_EXCEEDED";
      }
      if (message.includes("invalid") || message.includes("400")) {
        return "INVALID_REQUEST";
      }
    }

    return "UNKNOWN_ERROR";
  }

  /**
   * Build conversation history for context
   */
  protected buildConversationContext(request: LLMRequest): string {
    if (!request.conversationHistory || request.conversationHistory.length === 0) {
      return "";
    }

    return request.conversationHistory
      .map(msg => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }
}

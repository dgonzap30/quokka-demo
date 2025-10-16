// ============================================
// Anthropic Provider Implementation
// ============================================

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  TokenUsage,
} from "@/lib/models/types";

/**
 * Anthropic LLM Provider
 *
 * Supports Claude 3 models (Haiku, Sonnet, Opus).
 * Uses Anthropic Messages API.
 *
 * Pricing (as of 2025):
 * - Claude 3 Haiku: $0.25/1M input tokens, $1.25/1M output tokens
 * - Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens
 * - Claude 3 Opus: $15/1M input tokens, $75/1M output tokens
 */
export class AnthropicProvider extends BaseLLMProvider {
  private static readonly API_URL = "https://api.anthropic.com/v1/messages";
  private static readonly API_VERSION = "2023-06-01";

  /**
   * Generate completion using Anthropic API
   */
  protected async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Build messages array for Anthropic API
      const messages: Array<{ role: string; content: string }> = [];

      // Add conversation history
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        request.conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        });
      }

      // Add user prompt
      messages.push({
        role: "user",
        content: request.userPrompt,
      });

      // Make API request
      const response = await fetch(AnthropicProvider.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": AnthropicProvider.API_VERSION,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          system: request.systemPrompt || undefined,
          temperature: request.temperature ?? this.config.temperature,
          top_p: request.topP ?? this.config.topP,
          max_tokens: request.maxTokens ?? this.config.maxTokens,
        }),
      });

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `Anthropic API error: ${response.status} ${response.statusText}`
        );
      }

      // Parse response
      const data = await response.json();

      // Extract completion
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new Error("No completion returned from Anthropic");
      }

      // Extract token usage
      const usage: TokenUsage = {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        estimatedCost: this.calculateCost({
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: 0,
          estimatedCost: 0, // Will be calculated
        }),
      };

      return {
        success: true,
        content,
        model: this.config.model,
        provider: "anthropic",
        usage,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error; // Let base class handle retry logic
    }
  }

  /**
   * Estimate token count (approximate)
   *
   * Anthropic uses similar tokenization to GPT models:
   * - 1 token ≈ 4 characters in English
   * - 1 token ≈ 0.75 words
   */
  protected estimateTokens(text: string): number {
    // Simple estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on token usage
   *
   * Pricing for Claude 3 Haiku (default):
   * - Input: $0.25 per 1M tokens
   * - Output: $1.25 per 1M tokens
   */
  protected calculateCost(usage: TokenUsage): number {
    // Pricing per 1M tokens
    const pricing = this.getPricing(this.config.model);

    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Get pricing for specific model
   */
  private getPricing(model: string): { input: number; output: number } {
    // Pricing as of January 2025
    if (model.includes("claude-3-haiku")) {
      return { input: 0.25, output: 1.25 };
    }
    if (model.includes("claude-3-5-sonnet") || model.includes("claude-3.5-sonnet")) {
      return { input: 3.00, output: 15.00 };
    }
    if (model.includes("claude-3-sonnet")) {
      return { input: 3.00, output: 15.00 };
    }
    if (model.includes("claude-3-opus")) {
      return { input: 15.00, output: 75.00 };
    }

    // Default to Haiku pricing (most economical)
    return { input: 0.25, output: 1.25 };
  }
}

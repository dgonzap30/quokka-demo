// ============================================
// Anthropic Provider Implementation
// ============================================

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
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

      // Prepare system prompt with caching if enabled
      const systemPrompt = this.prepareSystemPrompt(request);

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
          system: systemPrompt,
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

      // Extract token usage (including cache metrics)
      const usage: TokenUsage = {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        cacheCreationTokens: data.usage?.cache_creation_input_tokens,
        cacheReadTokens: data.usage?.cache_read_input_tokens,
        estimatedCost: this.calculateCost({
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: 0,
          cacheCreationTokens: data.usage?.cache_creation_input_tokens,
          cacheReadTokens: data.usage?.cache_read_input_tokens,
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
   * Prepare system prompt with caching if enabled
   *
   * Anthropic prompt caching uses cache_control blocks to mark
   * content for caching. System prompts >1024 tokens benefit most.
   */
  private prepareSystemPrompt(request: LLMRequest): string | object {
    const enableCaching = request.enableCaching ?? true; // Default to enabled
    const systemPrompt = request.systemPrompt;

    // Only use caching for longer system prompts (saves cost/latency)
    const estimatedTokens = this.estimateTokens(systemPrompt);
    const shouldCache = enableCaching && estimatedTokens >= 1024;

    if (!shouldCache) {
      return systemPrompt; // Simple string format
    }

    // Use cache_control format for Anthropic
    // See: https://docs.anthropic.com/claude/docs/prompt-caching
    return [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ];
  }

  /**
   * Calculate cost based on token usage
   *
   * Pricing for Claude 3 Haiku (default):
   * - Input: $0.25 per 1M tokens
   * - Output: $1.25 per 1M tokens
   * - Cache writes: 1.25x input cost
   * - Cache reads: 90% discount (0.1x input cost)
   */
  protected calculateCost(usage: TokenUsage): number {
    // Pricing per 1M tokens
    const pricing = this.getPricing(this.config.model);

    // Standard input/output costs
    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    // Cache costs (Anthropic pricing model)
    let cacheCost = 0;
    if (usage.cacheCreationTokens) {
      // Cache writes cost 1.25x normal input
      cacheCost += (usage.cacheCreationTokens / 1_000_000) * pricing.input * 1.25;
    }
    if (usage.cacheReadTokens) {
      // Cache reads cost 0.1x normal input (90% discount!)
      cacheCost += (usage.cacheReadTokens / 1_000_000) * pricing.input * 0.1;
    }

    return inputCost + outputCost + cacheCost;
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

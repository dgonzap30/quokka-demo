// ============================================
// OpenAI Provider Implementation
// ============================================

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
  LLMRequest,
  LLMResponse,
  TokenUsage,
} from "@/lib/models/types";

/**
 * OpenAI LLM Provider
 *
 * Supports GPT-4o-mini and other OpenAI models.
 * Uses OpenAI Chat Completions API.
 *
 * Pricing (as of 2025):
 * - GPT-4o-mini: $0.15/1M input tokens, $0.60/1M output tokens
 * - GPT-4o: $5/1M input tokens, $15/1M output tokens
 */
export class OpenAIProvider extends BaseLLMProvider {
  private static readonly API_URL = "https://api.openai.com/v1/chat/completions";

  /**
   * Generate completion using OpenAI API
   */
  protected async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Build messages array for OpenAI API
      const messages: Array<{ role: string; content: string }> = [];

      // Add system prompt
      if (request.systemPrompt) {
        messages.push({
          role: "system",
          content: request.systemPrompt,
        });
      }

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
      const response = await fetch(OpenAIProvider.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
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
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      // Parse response
      const data = await response.json();

      // Extract completion
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No completion returned from OpenAI");
      }

      // Extract token usage
      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        estimatedCost: this.calculateCost({
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          estimatedCost: 0, // Will be calculated
        }),
      };

      return {
        success: true,
        content,
        model: this.config.model,
        provider: "openai",
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
   * OpenAI uses tiktoken, but for simplicity we use:
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
   * Pricing for GPT-4o-mini (default):
   * - Input: $0.15 per 1M tokens
   * - Output: $0.60 per 1M tokens
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
    if (model.includes("gpt-4o-mini")) {
      return { input: 0.15, output: 0.60 };
    }
    if (model.includes("gpt-4o")) {
      return { input: 5.00, output: 15.00 };
    }
    if (model.includes("gpt-4-turbo")) {
      return { input: 10.00, output: 30.00 };
    }
    if (model.includes("gpt-4")) {
      return { input: 30.00, output: 60.00 };
    }
    if (model.includes("gpt-3.5-turbo")) {
      return { input: 0.50, output: 1.50 };
    }

    // Default to GPT-4o-mini pricing
    return { input: 0.15, output: 0.60 };
  }
}

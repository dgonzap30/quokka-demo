// ============================================
// LLM Provider Public API
// ============================================

import { BaseLLMProvider } from "./BaseLLMProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { getEnvConfig, isLLMEnabled } from "@/lib/utils/env";
import type { LLMConfig, LLMProviderType } from "@/lib/models/types";

// Re-export types and utilities
export { BaseLLMProvider } from "./BaseLLMProvider";
export { OpenAIProvider } from "./OpenAIProvider";
export { AnthropicProvider } from "./AnthropicProvider";
export * from "./utils";

/**
 * Create LLM provider instance
 *
 * Factory function that creates the appropriate provider
 * based on configuration. Validates API keys and settings.
 *
 * @throws Error if LLM is not enabled or configuration is invalid
 */
export function createLLMProvider(providerType?: LLMProviderType): BaseLLMProvider {
  // Check if LLM is enabled
  if (!isLLMEnabled()) {
    throw new Error(
      "LLM integration is not enabled. Set NEXT_PUBLIC_USE_LLM=true in .env.local"
    );
  }

  const envConfig = getEnvConfig();

  // Use provided type or default from config
  const provider = providerType || envConfig.llmProvider;

  // Build LLM config
  const config: LLMConfig = {
    provider,
    apiKey: provider === "openai"
      ? envConfig.openaiApiKey || ""
      : envConfig.anthropicApiKey || "",
    model: provider === "openai"
      ? envConfig.openaiModel
      : envConfig.anthropicModel,
    temperature: envConfig.temperature,
    topP: envConfig.topP,
    maxTokens: envConfig.maxTokens,
  };

  // Validate API key
  if (!config.apiKey) {
    throw new Error(
      `API key not found for ${provider}. Check your .env.local configuration.`
    );
  }

  // Create provider instance
  switch (provider) {
    case "openai":
      return new OpenAIProvider(config);

    case "anthropic":
      return new AnthropicProvider(config);

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Get LLM provider with fallback chain
 *
 * Attempts to create primary provider, falls back to secondary if it fails.
 * Useful for handling API key issues or provider outages.
 */
export function createLLMProviderWithFallback(): BaseLLMProvider {
  const envConfig = getEnvConfig();

  try {
    // Try primary provider
    return createLLMProvider(envConfig.llmProvider);
  } catch (primaryError) {
    console.warn(`Primary LLM provider failed: ${primaryError}`);

    // Try fallback provider
    const fallbackProvider: LLMProviderType =
      envConfig.llmProvider === "openai" ? "anthropic" : "openai";

    try {
      console.log(`Attempting fallback to ${fallbackProvider}...`);
      return createLLMProvider(fallbackProvider);
    } catch (fallbackError) {
      // Both providers failed
      throw new Error(
        `Both LLM providers failed. Primary: ${primaryError}. Fallback: ${fallbackError}`
      );
    }
  }
}

/**
 * Cached provider instance (singleton pattern)
 *
 * Reuses the same provider instance across requests to maintain
 * metrics and rate limiting state.
 */
let cachedProvider: BaseLLMProvider | null = null;

/**
 * Get or create LLM provider instance
 *
 * Returns a cached provider instance if available, otherwise creates new.
 * Use this for most cases to benefit from rate limiting and metrics tracking.
 */
export function getLLMProvider(): BaseLLMProvider {
  if (!cachedProvider) {
    cachedProvider = createLLMProviderWithFallback();
  }
  return cachedProvider;
}

/**
 * Reset cached provider
 *
 * Forces creation of a new provider instance.
 * Useful for testing or configuration changes.
 */
export function resetLLMProvider(): void {
  cachedProvider = null;
}

/**
 * Check if LLM provider is available
 *
 * Returns true if LLM is enabled and provider can be created.
 * Does not throw errors - safe for conditional feature checks.
 */
export function isLLMProviderAvailable(): boolean {
  if (!isLLMEnabled()) {
    return false;
  }

  try {
    const envConfig = getEnvConfig();
    const hasOpenAI = !!(envConfig.openaiApiKey);
    const hasAnthropic = !!(envConfig.anthropicApiKey);

    return hasOpenAI || hasAnthropic;
  } catch {
    return false;
  }
}

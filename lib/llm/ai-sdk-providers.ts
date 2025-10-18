// ============================================
// AI SDK Provider Registry
// ============================================
//
// Replaces custom BaseLLMProvider with AI SDK's production-grade
// provider implementations. Supports OpenAI, Anthropic, and Google
// with automatic fallback chain.

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { getEnvConfig, isLLMEnabled } from '@/lib/utils/env';
import type { LLMProviderType } from '@/lib/models/types';

/**
 * AI SDK Model Instance
 *
 * Represents a configured LLM model from AI SDK.
 * Can be used with generateText, streamText, generateObject, etc.
 */
export type AISDKModel = LanguageModel;

/**
 * Create AI SDK provider instance
 *
 * Factory function that creates the appropriate AI SDK provider
 * based on configuration. Returns a model instance that can be
 * used with all AI SDK Core functions.
 *
 * @param providerType - Optional override for provider type
 * @returns Configured AI SDK model instance or null if not available
 */
export function createAISDKProvider(providerType?: LLMProviderType): AISDKModel | null {
  // Check if LLM is enabled
  if (!isLLMEnabled()) {
    console.log('[AI SDK] LLM integration disabled (NEXT_PUBLIC_USE_LLM=false)');
    return null;
  }

  const envConfig = getEnvConfig();

  // Use provided type or default from config
  const provider = providerType || envConfig.llmProvider;

  try {
    switch (provider) {
      case 'openai': {
        if (!envConfig.openaiApiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const openai = createOpenAI({
          apiKey: envConfig.openaiApiKey,
        });

        console.log(`[AI SDK] OpenAI provider created (model: ${envConfig.openaiModel})`);
        return openai(envConfig.openaiModel);
      }

      case 'anthropic': {
        if (!envConfig.anthropicApiKey) {
          throw new Error('Anthropic API key not configured');
        }

        const anthropic = createAnthropic({
          apiKey: envConfig.anthropicApiKey,
        });

        console.log(`[AI SDK] Anthropic provider created (model: ${envConfig.anthropicModel})`);
        return anthropic(envConfig.anthropicModel);
      }

      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[AI SDK] Failed to create ${provider} provider:`, error);
    return null;
  }
}

/**
 * Create AI SDK provider with fallback chain
 *
 * Attempts to create primary provider, falls back to secondary if it fails.
 * Useful for handling API key issues or provider outages.
 *
 * Fallback order:
 * 1. Primary provider (from config)
 * 2. Secondary provider (opposite of primary)
 * 3. null (triggers template fallback in application code)
 */
export function createAISDKProviderWithFallback(): AISDKModel | null {
  const envConfig = getEnvConfig();

  // Try primary provider
  const primaryModel = createAISDKProvider(envConfig.llmProvider);
  if (primaryModel) {
    return primaryModel;
  }

  console.warn('[AI SDK] Primary provider failed, attempting fallback...');

  // Try fallback provider
  const fallbackProvider: LLMProviderType =
    envConfig.llmProvider === 'openai' ? 'anthropic' : 'openai';

  const fallbackModel = createAISDKProvider(fallbackProvider);
  if (fallbackModel) {
    console.log(`[AI SDK] Successfully fell back to ${fallbackProvider}`);
    return fallbackModel;
  }

  console.warn('[AI SDK] All providers failed, falling back to template system');
  return null;
}

/**
 * Cached model instance (singleton pattern)
 *
 * Reuses the same model instance across requests to maintain
 * consistent behavior and avoid re-initialization overhead.
 */
let cachedModel: AISDKModel | null | undefined = undefined;

/**
 * Get or create AI SDK model instance
 *
 * Returns a cached model instance if available, otherwise creates new.
 * Use this for most cases to benefit from caching.
 *
 * @returns Configured AI SDK model instance or null if not available
 */
export function getAISDKModel(): AISDKModel | null {
  if (cachedModel === undefined) {
    cachedModel = createAISDKProviderWithFallback();
  }
  return cachedModel;
}

/**
 * Reset cached model
 *
 * Forces creation of a new model instance.
 * Useful for testing or configuration changes.
 */
export function resetAISDKModel(): void {
  cachedModel = undefined;
}

/**
 * Check if AI SDK provider is available
 *
 * Returns true if LLM is enabled and provider can be created.
 * Does not throw errors - safe for conditional feature checks.
 */
export function isAISDKAvailable(): boolean {
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

/**
 * Get model configuration for AI SDK calls
 *
 * Returns default configuration values (temperature, maxTokens, etc.)
 * that can be spread into generateText/streamText/generateObject calls.
 *
 * @returns Configuration object with temperature, maxTokens, topP
 */
export function getAISDKConfig() {
  const envConfig = getEnvConfig();

  return {
    temperature: envConfig.temperature,
    maxTokens: envConfig.maxTokens,
    topP: envConfig.topP,
  };
}

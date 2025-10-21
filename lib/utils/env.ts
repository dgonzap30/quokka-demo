// ============================================
// Environment Variable Utilities
// ============================================

/**
 * Type-safe environment variable access for LLM configuration
 *
 * SECURITY: API keys are server-side only (no NEXT_PUBLIC_ prefix).
 * Only API routes can access these keys - they are never sent to the browser.
 *
 * @see .env.local.example for configuration template
 */

/**
 * LLM provider type
 */
export type LLMProviderType = "openai" | "anthropic";

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  // Feature flags
  useLLM: boolean;
  llmProvider: LLMProviderType;

  // API keys
  openaiApiKey: string | null;
  anthropicApiKey: string | null;

  // Models
  openaiModel: string;
  anthropicModel: string;

  // LLM parameters
  maxTokens: number;
  temperature: number;
  topP: number;

  // Cost & rate limiting
  maxDailyCost: number;
  maxRequestsPerMinute: number;

  // Context configuration
  maxContextMaterials: number;
  minRelevanceScore: number;
  autoDetectThreshold: number;

  // Development options
  debugLLM: boolean;
  showCostTracking: boolean;
}

/**
 * Get environment variable with fallback
 *
 * SECURITY NOTES:
 * - API keys use server-side env vars (no NEXT_PUBLIC_ prefix) - only accessible in API routes
 * - Feature flags use NEXT_PUBLIC_ prefix - safe to expose to browser
 * - This function can only be called from server-side code (API routes, Server Components)
 */
function getEnv(key: string, fallback: string = ""): string {
  // Direct mapping for static replacement by Next.js build process
  const envMap: Record<string, string | undefined> = {
    // Feature flags (client-safe)
    'NEXT_PUBLIC_USE_LLM': process.env.NEXT_PUBLIC_USE_LLM,
    'NEXT_PUBLIC_LLM_PROVIDER': process.env.NEXT_PUBLIC_LLM_PROVIDER,

    // API keys (server-only) - NO NEXT_PUBLIC_ PREFIX
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,

    // Model configuration (client-safe)
    'NEXT_PUBLIC_OPENAI_MODEL': process.env.NEXT_PUBLIC_OPENAI_MODEL,
    'NEXT_PUBLIC_ANTHROPIC_MODEL': process.env.NEXT_PUBLIC_ANTHROPIC_MODEL,
    'NEXT_PUBLIC_MAX_TOKENS': process.env.NEXT_PUBLIC_MAX_TOKENS,
    'NEXT_PUBLIC_LLM_TEMPERATURE': process.env.NEXT_PUBLIC_LLM_TEMPERATURE,
    'NEXT_PUBLIC_LLM_TOP_P': process.env.NEXT_PUBLIC_LLM_TOP_P,

    // Cost & rate limiting (client-safe)
    'NEXT_PUBLIC_MAX_DAILY_COST': process.env.NEXT_PUBLIC_MAX_DAILY_COST,
    'NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE': process.env.NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE,

    // Context configuration (client-safe)
    'NEXT_PUBLIC_MAX_CONTEXT_MATERIALS': process.env.NEXT_PUBLIC_MAX_CONTEXT_MATERIALS,
    'NEXT_PUBLIC_MIN_RELEVANCE_SCORE': process.env.NEXT_PUBLIC_MIN_RELEVANCE_SCORE,
    'NEXT_PUBLIC_AUTO_DETECT_THRESHOLD': process.env.NEXT_PUBLIC_AUTO_DETECT_THRESHOLD,

    // Development options (client-safe)
    'NEXT_PUBLIC_DEBUG_LLM': process.env.NEXT_PUBLIC_DEBUG_LLM,
    'NEXT_PUBLIC_SHOW_COST_TRACKING': process.env.NEXT_PUBLIC_SHOW_COST_TRACKING,
  };

  return envMap[key] || fallback;
}

/**
 * Get boolean environment variable
 */
function getBoolEnv(key: string, fallback: boolean = false): boolean {
  const value = getEnv(key, String(fallback));
  return value === "true" || value === "1";
}

/**
 * Get number environment variable
 */
function getNumberEnv(key: string, fallback: number): number {
  const value = getEnv(key, String(fallback));
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Get LLM provider from environment
 */
function getLLMProvider(): LLMProviderType {
  const provider = getEnv("NEXT_PUBLIC_LLM_PROVIDER", "openai");
  if (provider !== "openai" && provider !== "anthropic") {
    console.warn(
      `Invalid LLM provider "${provider}", falling back to "openai"`
    );
    return "openai";
  }
  return provider;
}

/**
 * Load and validate environment configuration
 */
function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    // Feature flags
    useLLM: getBoolEnv("NEXT_PUBLIC_USE_LLM", false),
    llmProvider: getLLMProvider(),

    // API keys (server-only, nullable - only required if useLLM is true)
    openaiApiKey: getEnv("OPENAI_API_KEY") || null,
    anthropicApiKey: getEnv("ANTHROPIC_API_KEY") || null,

    // Models
    openaiModel: getEnv("NEXT_PUBLIC_OPENAI_MODEL", "gpt-4o-mini"),
    anthropicModel: getEnv(
      "NEXT_PUBLIC_ANTHROPIC_MODEL",
      "claude-3-haiku-20240307"
    ),

    // LLM parameters
    maxTokens: getNumberEnv("NEXT_PUBLIC_MAX_TOKENS", 2000),
    temperature: getNumberEnv("NEXT_PUBLIC_LLM_TEMPERATURE", 0.7),
    topP: getNumberEnv("NEXT_PUBLIC_LLM_TOP_P", 0.9),

    // Cost & rate limiting
    maxDailyCost: getNumberEnv("NEXT_PUBLIC_MAX_DAILY_COST", 10.0),
    maxRequestsPerMinute: getNumberEnv("NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE", 20),

    // Context configuration
    maxContextMaterials: getNumberEnv("NEXT_PUBLIC_MAX_CONTEXT_MATERIALS", 10),
    minRelevanceScore: getNumberEnv("NEXT_PUBLIC_MIN_RELEVANCE_SCORE", 30),
    autoDetectThreshold: getNumberEnv("NEXT_PUBLIC_AUTO_DETECT_THRESHOLD", 70),

    // Development options
    debugLLM: getBoolEnv("NEXT_PUBLIC_DEBUG_LLM", false),
    showCostTracking: getBoolEnv("NEXT_PUBLIC_SHOW_COST_TRACKING", false),
  };

  // Validate configuration if LLM is enabled
  if (config.useLLM) {
    validateLLMConfig(config);
  }

  return config;
}

/**
 * Validate LLM configuration
 *
 * Throws error if LLM is enabled but required configuration is missing
 */
function validateLLMConfig(config: EnvConfig): void {
  const errors: string[] = [];

  // Check API keys based on selected provider
  if (config.llmProvider === "openai" && !config.openaiApiKey) {
    errors.push(
      "OPENAI_API_KEY is required when using OpenAI provider (server-side only, no NEXT_PUBLIC_ prefix)"
    );
  }

  if (config.llmProvider === "anthropic" && !config.anthropicApiKey) {
    errors.push(
      "ANTHROPIC_API_KEY is required when using Anthropic provider (server-side only, no NEXT_PUBLIC_ prefix)"
    );
  }

  // Validate numeric ranges
  if (config.maxTokens < 100 || config.maxTokens > 4000) {
    errors.push("NEXT_PUBLIC_MAX_TOKENS must be between 100 and 4000");
  }

  if (config.temperature < 0 || config.temperature > 1) {
    errors.push("NEXT_PUBLIC_LLM_TEMPERATURE must be between 0 and 1");
  }

  if (config.topP < 0 || config.topP > 1) {
    errors.push("NEXT_PUBLIC_LLM_TOP_P must be between 0 and 1");
  }

  if (config.minRelevanceScore < 0 || config.minRelevanceScore > 100) {
    errors.push("NEXT_PUBLIC_MIN_RELEVANCE_SCORE must be between 0 and 100");
  }

  if (config.autoDetectThreshold < 0 || config.autoDetectThreshold > 100) {
    errors.push("NEXT_PUBLIC_AUTO_DETECT_THRESHOLD must be between 0 and 100");
  }

  // Throw if any errors
  if (errors.length > 0) {
    throw new Error(
      `LLM configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}\n\n` +
        `Please check your .env.local file. See .env.local.example for reference.`
    );
  }
}

/**
 * Get current environment configuration
 *
 * Configuration is loaded once and cached for performance.
 * To reload configuration, refresh the page.
 */
export function getEnvConfig(): EnvConfig {
  // Cache configuration (load once per session)
  if (!envConfigCache) {
    envConfigCache = loadEnvConfig();

    // Log configuration in development mode
    if (envConfigCache.debugLLM && process.env.NODE_ENV !== "production") {
      console.log("[ENV] LLM Configuration:", {
        useLLM: envConfigCache.useLLM,
        provider: envConfigCache.llmProvider,
        model:
          envConfigCache.llmProvider === "openai"
            ? envConfigCache.openaiModel
            : envConfigCache.anthropicModel,
        maxTokens: envConfigCache.maxTokens,
        temperature: envConfigCache.temperature,
        hasOpenAIKey: !!envConfigCache.openaiApiKey,
        hasAnthropicKey: !!envConfigCache.anthropicApiKey,
      });
    }
  }

  return envConfigCache;
}

/**
 * Check if LLM integration is enabled
 *
 * Convenience function for checking feature flag
 */
export function isLLMEnabled(): boolean {
  return getEnvConfig().useLLM;
}

/**
 * Get current LLM provider type
 *
 * Returns the configured provider (openai or anthropic)
 */
export function getCurrentLLMProvider(): LLMProviderType {
  return getEnvConfig().llmProvider;
}

/**
 * Get API key for current provider
 *
 * Returns the API key for the configured provider, or null if not set
 */
export function getCurrentAPIKey(): string | null {
  const config = getEnvConfig();
  return config.llmProvider === "openai"
    ? config.openaiApiKey
    : config.anthropicApiKey;
}

/**
 * Get model name for current provider
 *
 * Returns the configured model name for the current provider
 */
export function getCurrentModel(): string {
  const config = getEnvConfig();
  return config.llmProvider === "openai"
    ? config.openaiModel
    : config.anthropicModel;
}

/**
 * Security status flag
 *
 * False means API keys are server-side only (secure)
 * API keys are only accessible in API routes and Server Components
 */
export const CLIENT_SIDE_API_KEYS = false;

/**
 * Configuration cache (singleton pattern)
 */
let envConfigCache: EnvConfig | null = null;

/**
 * Reset configuration cache (for testing only)
 *
 * @internal
 */
export function resetEnvConfigCache(): void {
  envConfigCache = null;
}

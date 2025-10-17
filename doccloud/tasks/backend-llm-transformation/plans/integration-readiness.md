# Backend Integration Readiness Plan

**Created:** 2025-10-16
**Task:** Backend LLM Transformation
**Status:** Ready for Implementation

---

## Executive Summary

**Readiness Score:** 8.5/10 ✅

**Timeline:** 30 hours over 5 weeks (phased implementation)

**Critical Path:**
1. LLM Provider Layer (8h)
2. Context System (6h)
3. API Integration (8h)
4. Conversation Storage (4h)
5. Polish & Docs (4h)

**Zero Breaking Changes:** All migrations are backward-compatible

**Rollback Strategy:** Feature flags + template fallback

---

## Phase 1: Environment Setup

**Duration:** 2 hours
**Dependencies:** None
**Difficulty:** Low

### 1.1 Environment Variables

Create `.env.local` with:

```bash
# LLM Provider Configuration
NEXT_PUBLIC_USE_LLM=false                    # Feature flag (start false)
NEXT_PUBLIC_LLM_PROVIDER=openai              # 'openai' | 'anthropic'

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-demo-...       # Get from platform.openai.com
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini         # Recommended for cost/performance

# Anthropic Configuration (fallback)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...     # Get from console.anthropic.com
NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-haiku-20240307

# Feature Flags
NEXT_PUBLIC_ENABLE_STREAMING=false           # Enable streaming responses
NEXT_PUBLIC_ENABLE_MULTI_COURSE=true         # Enable multi-course context
NEXT_PUBLIC_MAX_CONTEXT_MATERIALS=10         # Max materials per context

# Cost Controls
NEXT_PUBLIC_MAX_TOKENS=2000                  # Max tokens per response
NEXT_PUBLIC_CACHE_TTL_PREVIEW=5000           # Preview cache ms (5s)
NEXT_PUBLIC_DEBOUNCE_MS=500                  # Preview debounce ms

# Monitoring (optional)
NEXT_PUBLIC_LOG_LLM_USAGE=true               # Log token usage
NEXT_PUBLIC_COST_ALERT_THRESHOLD=100         # Alert if daily cost > $100
```

### 1.2 Update `next.config.ts`

No changes needed - environment variables are automatically available via `process.env.NEXT_PUBLIC_*`.

### 1.3 Environment Detection

Add to `lib/utils/env.ts` (new file):

```typescript
/**
 * Environment configuration utilities
 *
 * Validates and provides typed access to environment variables.
 */

export const env = {
  // Feature flags
  useLLM: process.env.NEXT_PUBLIC_USE_LLM === 'true',
  llmProvider: (process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai') as 'openai' | 'anthropic',
  enableStreaming: process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true',
  enableMultiCourse: process.env.NEXT_PUBLIC_ENABLE_MULTI_COURSE === 'true',

  // LLM configuration
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
  },
  anthropic: {
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
    model: process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
  },

  // Limits
  maxContextMaterials: parseInt(process.env.NEXT_PUBLIC_MAX_CONTEXT_MATERIALS || '10', 10),
  maxTokens: parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS || '2000', 10),
  cacheT TLPreview: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL_PREVIEW || '5000', 10),
  debounceMs: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_MS || '500', 10),

  // Monitoring
  logUsage: process.env.NEXT_PUBLIC_LOG_LLM_USAGE === 'true',
  costAlertThreshold: parseInt(process.env.NEXT_PUBLIC_COST_ALERT_THRESHOLD || '100', 10),
} as const;

/**
 * Validate environment configuration
 * Throws error if required variables are missing
 */
export function validateEnv(): void {
  if (env.useLLM) {
    if (env.llmProvider === 'openai' && !env.openai.apiKey) {
      throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is required when USE_LLM=true');
    }
    if (env.llmProvider === 'anthropic' && !env.anthropic.apiKey) {
      throw new Error('NEXT_PUBLIC_ANTHROPIC_API_KEY is required when USE_LLM=true');
    }
  }
}

/**
 * Check if we're in demo mode (using placeholder keys)
 */
export function isDemoMode(): boolean {
  return env.openai.apiKey.includes('demo') || env.anthropic.apiKey.includes('demo');
}
```

### 1.4 Testing

```bash
# Test environment loading
npm run dev

# Should see in console:
# - Environment loaded
# - Feature flags status
# - Warning if in demo mode
```

**Acceptance Criteria:**
- [ ] `.env.local` created with all variables
- [ ] `lib/utils/env.ts` created and validated
- [ ] Dev server starts without errors
- [ ] Environment detection working

---

## Phase 2: Type System Extension

**Duration:** 2 hours
**Dependencies:** Phase 1
**Difficulty:** Low

### 2.1 Add LLM Types to `lib/models/types.ts`

Add at end of file (after line 1722):

```typescript
// ============================================
// LLM Provider Types
// ============================================

/**
 * Supported LLM providers
 */
export type LLMProviderType = 'openai' | 'anthropic';

/**
 * LLM chat message role
 */
export type LLMRole = 'system' | 'user' | 'assistant';

/**
 * LLM chat message
 */
export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/**
 * Input for LLM generation
 */
export interface LLMGenerateInput {
  /** Conversation messages (system prompt + user question + history) */
  messages: LLMMessage[];

  /** Temperature (0-2, higher = more creative) */
  temperature?: number;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Top-p sampling (0-1) */
  topP?: number;

  /** Stop sequences */
  stop?: string[];
}

/**
 * LLM generation response
 */
export interface LLMResponse {
  /** Generated text content */
  content: string;

  /** Total tokens used (prompt + completion) */
  tokensUsed: number;

  /** Model used for generation */
  model: string;

  /** Finish reason */
  finishReason: 'stop' | 'length' | 'error' | 'content_filter';

  /** Optional: Parsed citations from response */
  citations?: Citation[];
}

/**
 * LLM provider interface
 *
 * All LLM providers must implement this interface
 * for interchangeable usage.
 */
export interface LLMProvider {
  /** Provider name */
  name: LLMProviderType;

  /** Model identifier */
  model: string;

  /** Maximum context tokens supported */
  maxContextTokens: number;

  /**
   * Generate AI answer from messages
   */
  generateAnswer(input: LLMGenerateInput): Promise<LLMResponse>;

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string): number;

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean;
}

/**
 * LLM error types
 */
export type LLMErrorType =
  | 'rate_limit'
  | 'context_too_long'
  | 'provider_error'
  | 'timeout'
  | 'invalid_api_key'
  | 'network_error';

/**
 * LLM error with detailed information
 */
export interface LLMError extends Error {
  type: LLMErrorType;
  provider: LLMProviderType;
  retryAfter?: number;        // For rate limit errors (seconds)
  maxTokens?: number;          // For context_too_long errors
  statusCode?: number;         // HTTP status code
}

// ============================================
// Course Context Types
// ============================================

/**
 * Ranked course material with relevance score
 */
export interface RankedMaterial {
  material: CourseMaterial;
  relevanceScore: number;
  matchedKeywords: string[];
}

/**
 * Built course context for LLM
 */
export interface CourseContext {
  /** Course ID */
  courseId: string;

  /** Course name and code */
  courseName: string;
  courseCode: string;

  /** Ranked materials (sorted by relevance DESC) */
  materials: RankedMaterial[];

  /** Total tokens in context */
  totalTokens: number;

  /** Context text (formatted for LLM) */
  contextText: string;

  /** Timestamp when context was built */
  builtAt: string;
}

/**
 * Multi-course context (aggregates multiple courses)
 */
export interface MultiCourseContext {
  /** Array of course contexts */
  courses: CourseContext[];

  /** Total tokens across all contexts */
  totalTokens: number;

  /** Combined context text */
  contextText: string;

  /** Auto-detected primary course (most relevant) */
  primaryCourseId?: string;
}

// ============================================
// Conversation Storage Types
// ============================================

/**
 * Stored AI conversation (private per user)
 */
export interface AIConversation {
  /** Unique conversation ID */
  id: string;

  /** Owner user ID */
  userId: string;

  /** Optional: Associated course ID */
  courseId?: string;

  /** Conversation messages */
  messages: Message[];

  /** Metadata */
  metadata: ConversationMetadata;

  /** Conversation title (generated from first message) */
  title: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/**
 * Input for creating new conversation
 */
export interface CreateConversationInput {
  userId: string;
  courseId?: string;
  initialMessage: string;
}

// ============================================
// Enhanced AI Answer Types (Extend Existing)
// ============================================

/**
 * Extended AIAnswer with LLM metadata
 *
 * Note: These fields are added to existing AIAnswer interface
 * via declaration merging in a separate file.
 */
export interface AIAnswerLLMMetadata {
  /** LLM provider used */
  llmProvider?: LLMProviderType;

  /** LLM model used */
  llmModel?: string;

  /** Tokens used for generation */
  tokensUsed?: number;

  /** Generation time in milliseconds */
  generationTime?: number;

  /** Material IDs used for context */
  contextMaterialIds?: string[];

  /** Full conversation history (if multi-turn) */
  conversationHistory?: Message[];
}

// ============================================
// Type Guards for LLM Types
// ============================================

/**
 * Type guard for LLM error
 */
export function isLLMError(error: unknown): error is LLMError {
  if (!(error instanceof Error)) return false;

  const llmError = error as LLMError;
  return (
    typeof llmError.type === 'string' &&
    typeof llmError.provider === 'string' &&
    ['rate_limit', 'context_too_long', 'provider_error', 'timeout', 'invalid_api_key', 'network_error'].includes(llmError.type)
  );
}

/**
 * Type guard for LLM response
 */
export function isValidLLMResponse(obj: unknown): obj is LLMResponse {
  if (typeof obj !== 'object' || obj === null) return false;

  const response = obj as LLMResponse;
  return (
    typeof response.content === 'string' &&
    typeof response.tokensUsed === 'number' &&
    typeof response.model === 'string' &&
    ['stop', 'length', 'error', 'content_filter'].includes(response.finishReason)
  );
}

/**
 * Type guard for CourseContext
 */
export function isCourseContext(obj: unknown): obj is CourseContext {
  if (typeof obj !== 'object' || obj === null) return false;

  const context = obj as CourseContext;
  return (
    typeof context.courseId === 'string' &&
    typeof context.courseName === 'string' &&
    typeof context.courseCode === 'string' &&
    Array.isArray(context.materials) &&
    typeof context.totalTokens === 'number' &&
    typeof context.contextText === 'string'
  );
}
```

### 2.2 Update `GenerateAIAnswerInput` (Optional Extension)

Extend existing type with optional conversation context:

```typescript
// Add to GenerateAIAnswerInput interface (around line 501):

interface GenerateAIAnswerInput {
  // ... existing fields ...

  /** OPTIONAL: Conversation history for multi-turn */
  conversationHistory?: Message[];

  /** OPTIONAL: Enable multi-course context */
  enableMultiCourse?: boolean;

  /** OPTIONAL: Override max materials */
  maxMaterials?: number;
}
```

### 2.3 Testing

```bash
# Type check
npx tsc --noEmit

# Should pass with no errors
```

**Acceptance Criteria:**
- [ ] All new types added to `lib/models/types.ts`
- [ ] Type guards implemented
- [ ] TypeScript compiles without errors
- [ ] No breaking changes to existing types

---

## Phase 3: LLM Provider Layer

**Duration:** 8 hours
**Dependencies:** Phase 2
**Difficulty:** High

### 3.1 Create LLM Provider Interface

Create `lib/llm/provider.ts`:

```typescript
import type { LLMProvider, LLMGenerateInput, LLMResponse, LLMError, LLMProviderType } from '@/lib/models/types';

/**
 * Create LLM error with consistent structure
 */
export function createLLMError(
  type: LLMError['type'],
  provider: LLMProviderType,
  message: string,
  details?: Partial<LLMError>
): LLMError {
  const error = new Error(message) as LLMError;
  error.type = type;
  error.provider = provider;
  Object.assign(error, details);
  return error;
}

/**
 * Abstract base class for LLM providers
 *
 * Provides common functionality like token estimation,
 * error handling, and retry logic.
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: LLMProviderType;
  abstract model: string;
  abstract maxContextTokens: number;

  /**
   * Generate AI answer (must be implemented by subclass)
   */
  abstract generateAnswer(input: LLMGenerateInput): Promise<LLMResponse>;

  /**
   * Estimate token count (simple approximation)
   * Override in subclass for provider-specific tokenization
   */
  estimateTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if provider is configured
   */
  abstract isConfigured(): boolean;

  /**
   * Exponential backoff retry
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof Error && (error as LLMError).type) {
          const llmError = error as LLMError;
          if (['invalid_api_key', 'context_too_long'].includes(llmError.type)) {
            throw error; // Don't retry
          }
        }

        // Exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Format messages for API call
   */
  protected formatMessages(input: LLMGenerateInput): Array<{ role: string; content: string }> {
    return input.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}
```

### 3.2 Implement OpenAI Provider

Create `lib/llm/openai.ts`:

```typescript
import { BaseLLMProvider, createLLMError } from './provider';
import type { LLMGenerateInput, LLMResponse } from '@/lib/models/types';
import { env } from '@/lib/utils/env';

/**
 * OpenAI LLM provider
 *
 * Uses GPT-4o-mini by default for cost-effective generation.
 */
export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai' as const;
  model = env.openai.model;
  maxContextTokens = 128000; // GPT-4o-mini context window

  private apiKey = env.openai.apiKey;
  private baseURL = 'https://api.openai.com/v1';

  isConfigured(): boolean {
    return Boolean(this.apiKey && !this.apiKey.includes('demo'));
  }

  async generateAnswer(input: LLMGenerateInput): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw createLLMError(
        'invalid_api_key',
        'openai',
        'OpenAI API key not configured or in demo mode'
      );
    }

    return this.retryWithBackoff(async () => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: this.formatMessages(input),
            temperature: input.temperature ?? 0.7,
            max_tokens: input.maxTokens ?? env.maxTokens,
            top_p: input.topP ?? 1.0,
            stop: input.stop,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle rate limits
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw createLLMError(
              'rate_limit',
              'openai',
              'OpenAI rate limit exceeded',
              { statusCode: 429, retryAfter }
            );
          }

          // Handle invalid API key
          if (response.status === 401) {
            throw createLLMError(
              'invalid_api_key',
              'openai',
              'Invalid OpenAI API key',
              { statusCode: 401 }
            );
          }

          // Handle context too long
          if (errorData.error?.code === 'context_length_exceeded') {
            throw createLLMError(
              'context_too_long',
              'openai',
              'Context exceeds maximum token limit',
              { maxTokens: this.maxContextTokens }
            );
          }

          throw createLLMError(
            'provider_error',
            'openai',
            `OpenAI API error: ${errorData.error?.message || response.statusText}`,
            { statusCode: response.status }
          );
        }

        const data = await response.json();
        const choice = data.choices?.[0];

        if (!choice) {
          throw createLLMError(
            'provider_error',
            'openai',
            'No completion in OpenAI response'
          );
        }

        const generationTime = Date.now() - startTime;

        if (env.logUsage) {
          console.log(`[OpenAI] Generated response in ${generationTime}ms, used ${data.usage?.total_tokens || 0} tokens`);
        }

        return {
          content: choice.message.content,
          tokensUsed: data.usage?.total_tokens || 0,
          model: data.model,
          finishReason: choice.finish_reason === 'stop' ? 'stop' :
                       choice.finish_reason === 'length' ? 'length' :
                       choice.finish_reason === 'content_filter' ? 'content_filter' : 'error',
        };
      } catch (error) {
        if ((error as LLMError).type) {
          throw error; // Re-throw LLM errors
        }

        // Network or unknown errors
        throw createLLMError(
          'network_error',
          'openai',
          `Network error calling OpenAI: ${(error as Error).message}`
        );
      }
    });
  }

  /**
   * Estimate tokens using OpenAI's approximation
   * More accurate than base class
   */
  estimateTokens(text: string): number {
    // OpenAI: ~1 token per 4 chars for English
    // Account for special tokens and formatting
    return Math.ceil(text.length / 3.5);
  }
}

/**
 * Singleton instance
 */
export const openAIProvider = new OpenAIProvider();
```

### 3.3 Implement Anthropic Provider

Create `lib/llm/anthropic.ts`:

```typescript
import { BaseLLMProvider, createLLMError } from './provider';
import type { LLMGenerateInput, LLMResponse } from '@/lib/models/types';
import { env } from '@/lib/utils/env';

/**
 * Anthropic LLM provider
 *
 * Uses Claude 3 Haiku by default for cost-effective generation.
 */
export class AnthropicProvider extends BaseLLMProvider {
  name = 'anthropic' as const;
  model = env.anthropic.model;
  maxContextTokens = 200000; // Claude 3 Haiku context window

  private apiKey = env.anthropic.apiKey;
  private baseURL = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  isConfigured(): boolean {
    return Boolean(this.apiKey && !this.apiKey.includes('demo'));
  }

  async generateAnswer(input: LLMGenerateInput): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw createLLMError(
        'invalid_api_key',
        'anthropic',
        'Anthropic API key not configured or in demo mode'
      );
    }

    return this.retryWithBackoff(async () => {
      const startTime = Date.now();

      try {
        // Separate system message from conversation
        const systemMessage = input.messages.find(m => m.role === 'system');
        const conversationMessages = input.messages.filter(m => m.role !== 'system');

        const response = await fetch(`${this.baseURL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
          },
          body: JSON.stringify({
            model: this.model,
            system: systemMessage?.content,
            messages: conversationMessages.map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            })),
            temperature: input.temperature ?? 0.7,
            max_tokens: input.maxTokens ?? env.maxTokens,
            top_p: input.topP ?? 1.0,
            stop_sequences: input.stop,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle rate limits
          if (response.status === 429) {
            throw createLLMError(
              'rate_limit',
              'anthropic',
              'Anthropic rate limit exceeded',
              { statusCode: 429, retryAfter: 60 }
            );
          }

          // Handle invalid API key
          if (response.status === 401) {
            throw createLLMError(
              'invalid_api_key',
              'anthropic',
              'Invalid Anthropic API key',
              { statusCode: 401 }
            );
          }

          throw createLLMError(
            'provider_error',
            'anthropic',
            `Anthropic API error: ${errorData.error?.message || response.statusText}`,
            { statusCode: response.status }
          );
        }

        const data = await response.json();
        const generationTime = Date.now() - startTime;

        if (env.logUsage) {
          console.log(`[Anthropic] Generated response in ${generationTime}ms, used ${data.usage?.input_tokens + data.usage?.output_tokens || 0} tokens`);
        }

        return {
          content: data.content[0].text,
          tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          model: data.model,
          finishReason: data.stop_reason === 'end_turn' ? 'stop' :
                       data.stop_reason === 'max_tokens' ? 'length' :
                       data.stop_reason === 'stop_sequence' ? 'stop' : 'error',
        };
      } catch (error) {
        if ((error as LLMError).type) {
          throw error;
        }

        throw createLLMError(
          'network_error',
          'anthropic',
          `Network error calling Anthropic: ${(error as Error).message}`
        );
      }
    });
  }

  /**
   * Estimate tokens using Anthropic's approximation
   */
  estimateTokens(text: string): number {
    // Anthropic: ~1 token per 3.5 chars for English
    return Math.ceil(text.length / 3.5);
  }
}

/**
 * Singleton instance
 */
export const anthropicProvider = new AnthropicProvider();
```

### 3.4 Create Provider Factory

Create `lib/llm/index.ts`:

```typescript
import type { LLMProvider } from '@/lib/models/types';
import { openAIProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { env } from '@/lib/utils/env';

/**
 * Get configured LLM provider
 *
 * Returns the provider specified in environment variables,
 * or throws if not configured.
 */
export function getLLMProvider(): LLMProvider {
  const provider = env.llmProvider === 'openai' ? openAIProvider : anthropicProvider;

  if (!provider.isConfigured()) {
    throw new Error(`LLM provider "${provider.name}" is not configured. Check environment variables.`);
  }

  return provider;
}

/**
 * Get fallback provider (opposite of primary)
 *
 * Used for failover if primary provider fails.
 */
export function getFallbackProvider(): LLMProvider | null {
  const fallback = env.llmProvider === 'openai' ? anthropicProvider : openAIProvider;

  return fallback.isConfigured() ? fallback : null;
}

// Re-export providers
export { openAIProvider, anthropicProvider };
export * from './prompts';
```

### 3.5 Create Prompt Engineering Utilities

Create `lib/llm/prompts.ts`:

```typescript
import type { LLMMessage, CourseContext, CourseMaterial } from '@/lib/models/types';

/**
 * Build system prompt for AI assistant
 *
 * Establishes persona, guidelines, and citation requirements.
 */
export function buildSystemPrompt(courseContext: CourseContext): string {
  return `You are an AI teaching assistant for ${courseContext.courseName} (${courseContext.courseCode}). Your role is to help students understand course concepts by providing clear, accurate, and well-cited explanations.

**Guidelines:**
1. Answer questions using ONLY the course materials provided below
2. Cite specific sources when making claims (use format: [Source: Material Title])
3. If the materials don't contain enough information, acknowledge this limitation
4. Use analogies and examples to clarify complex concepts
5. Encourage students to review the cited materials for deeper understanding
6. Keep responses concise (300-500 words typical)
7. Use markdown formatting for code, equations, and lists

**Course Materials:**
${courseContext.contextText}

**Important:**
- Never make up information not present in the course materials
- Always cite your sources
- If unsure, acknowledge uncertainty and suggest relevant materials to review
- Maintain an encouraging, educational tone`;
}

/**
 * Build user prompt from question
 */
export function buildUserPrompt(title: string, content: string, tags?: string[]): string {
  let prompt = `**Question:** ${title}\n\n`;

  if (content && content !== title) {
    prompt += `**Details:** ${content}\n\n`;
  }

  if (tags && tags.length > 0) {
    prompt += `**Tags:** ${tags.join(', ')}\n\n`;
  }

  prompt += `Please provide a clear, well-cited answer using the course materials.`;

  return prompt;
}

/**
 * Build conversation messages for LLM
 */
export function buildConversationMessages(
  courseContext: CourseContext,
  title: string,
  content: string,
  tags?: string[]
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(courseContext),
    },
    {
      role: 'user',
      content: buildUserPrompt(title, content, tags),
    },
  ];
}

/**
 * Parse citations from LLM response
 *
 * Looks for [Source: ...] patterns and converts to Citation objects.
 */
export function parseCitations(
  content: string,
  materials: CourseMaterial[]
): Array<{ source: string; material: CourseMaterial | null }> {
  const citationRegex = /\[Source:\s*([^\]]+)\]/g;
  const citations: Array<{ source: string; material: CourseMaterial | null }> = [];

  let match;
  while ((match = citationRegex.exec(content)) !== null) {
    const sourceText = match[1].trim();

    // Try to find matching material by title
    const material = materials.find(m =>
      m.title.toLowerCase().includes(sourceText.toLowerCase()) ||
      sourceText.toLowerCase().includes(m.title.toLowerCase())
    ) || null;

    citations.push({ source: sourceText, material });
  }

  return citations;
}

/**
 * Calculate confidence score based on citation quality
 *
 * Higher scores when:
 * - Multiple citations
 * - Citations match actual materials
 * - Materials are highly relevant
 */
export function calculateConfidenceScore(
  citations: Array<{ source: string; material: CourseMaterial | null }>,
  contextMaterials: CourseMaterial[]
): { score: number; level: 'high' | 'medium' | 'low' } {
  if (citations.length === 0) {
    return { score: 30, level: 'low' }; // No citations = low confidence
  }

  // Count matched citations
  const matchedCitations = citations.filter(c => c.material !== null).length;
  const matchRatio = matchedCitations / citations.length;

  // Base score from citation count
  let score = 50 + Math.min(30, citations.length * 10);

  // Bonus for matching materials
  score += matchRatio * 20;

  // Cap at 95
  score = Math.min(95, score);

  // Determine level
  let level: 'high' | 'medium' | 'low';
  if (score >= 70) level = 'high';
  else if (score >= 40) level = 'medium';
  else level = 'low';

  return { score: Math.round(score), level };
}
```

### 3.6 Testing

Create test file `lib/llm/__tests__/provider.test.ts`:

```typescript
import { openAIProvider, anthropicProvider } from '../index';
import { env } from '@/lib/utils/env';

describe('LLM Providers', () => {
  test('OpenAI provider configuration', () => {
    expect(openAIProvider.name).toBe('openai');
    expect(openAIProvider.model).toBeTruthy();
    expect(openAIProvider.maxContextTokens).toBeGreaterThan(0);
  });

  test('Anthropic provider configuration', () => {
    expect(anthropicProvider.name).toBe('anthropic');
    expect(anthropicProvider.model).toBeTruthy();
    expect(anthropicProvider.maxContextTokens).toBeGreaterThan(0);
  });

  test('Token estimation', () => {
    const text = 'This is a test message with approximately twenty tokens here.';
    const tokens = openAIProvider.estimateTokens(text);
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(30);
  });

  // Note: Skip actual API calls in tests (mock or use VCR pattern)
  test.skip('Generate answer with OpenAI', async () => {
    const response = await openAIProvider.generateAnswer({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' },
      ],
    });

    expect(response.content).toBeTruthy();
    expect(response.tokensUsed).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria:**
- [ ] All provider files created
- [ ] Providers implement LLMProvider interface
- [ ] Error handling comprehensive
- [ ] Retry logic working
- [ ] Token estimation functional
- [ ] Tests passing (unit tests only, skip API calls)

---

## Phase 4: Course Context Builder

**Duration:** 6 hours
**Dependencies:** Phase 3
**Difficulty:** Medium

### 4.1 Create Context Builder

Create `lib/context/builder.ts`:

```typescript
import type { CourseMaterial, CourseContext, RankedMaterial, Course } from '@/lib/models/types';
import { extractKeywords } from '@/lib/api/client'; // Reuse existing helper
import { env } from '@/lib/utils/env';
import { getLLMProvider } from '@/lib/llm';

/**
 * Rank materials by relevance to question
 *
 * Uses keyword matching for now. In v2, could use embeddings.
 */
export function rankMaterialsByRelevance(
  materials: CourseMaterial[],
  questionKeywords: string[]
): RankedMaterial[] {
  return materials.map(material => {
    // Count keyword matches
    const matchedKeywords = questionKeywords.filter(qk =>
      material.keywords.some(mk => mk.includes(qk) || qk.includes(mk))
    );

    // Calculate relevance score (0-100)
    const keywordMatchRatio = questionKeywords.length > 0
      ? matchedKeywords.length / questionKeywords.length
      : 0;

    const relevanceScore = Math.round(keywordMatchRatio * 100);

    return {
      material,
      relevanceScore,
      matchedKeywords,
    };
  })
  .filter(rm => rm.relevanceScore > 0) // Only include relevant materials
  .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort DESC
}

/**
 * Build context text from materials
 *
 * Formats materials into a text block suitable for LLM system prompt.
 */
export function buildContextText(rankedMaterials: RankedMaterial[]): string {
  if (rankedMaterials.length === 0) {
    return 'No course materials available for this topic.';
  }

  let contextText = '';

  rankedMaterials.forEach((rm, index) => {
    const { material } = rm;

    contextText += `\n---\n`;
    contextText += `**Material ${index + 1}: ${material.title}**\n`;
    contextText += `Type: ${material.type}\n`;
    if (material.metadata.week) {
      contextText += `Week: ${material.metadata.week}\n`;
    }
    contextText += `\n${material.content}\n`;
  });

  return contextText.trim();
}

/**
 * Build course context for LLM
 *
 * Takes a question and course materials, ranks materials by relevance,
 * and builds a formatted context suitable for LLM system prompt.
 */
export async function buildCourseContext(
  course: Course,
  materials: CourseMaterial[],
  questionTitle: string,
  questionContent: string,
  tags?: string[]
): Promise<CourseContext> {
  // Extract keywords from question
  const questionText = `${questionTitle} ${questionContent} ${tags?.join(' ') || ''}`;
  const questionKeywords = extractKeywords(questionText);

  // Rank materials by relevance
  let rankedMaterials = rankMaterialsByRelevance(materials, questionKeywords);

  // Limit to top N materials (env.maxContextMaterials)
  rankedMaterials = rankedMaterials.slice(0, env.maxContextMaterials);

  // Build context text
  const contextText = buildContextText(rankedMaterials);

  // Estimate tokens
  const provider = getLLMProvider();
  const totalTokens = provider.estimateTokens(contextText);

  // Check if context exceeds limits
  if (totalTokens > provider.maxContextTokens * 0.7) { // Use 70% of max
    console.warn(`Context tokens (${totalTokens}) approaching limit (${provider.maxContextTokens}). Consider reducing maxContextMaterials.`);

    // Truncate materials if needed
    while (rankedMaterials.length > 1 && totalTokens > provider.maxContextTokens * 0.7) {
      rankedMaterials.pop();
      const newContextText = buildContextText(rankedMaterials);
      const newTokens = provider.estimateTokens(newContextText);
      if (newTokens < totalTokens) break;
    }
  }

  return {
    courseId: course.id,
    courseName: course.name,
    courseCode: course.code,
    materials: rankedMaterials,
    totalTokens,
    contextText,
    builtAt: new Date().toISOString(),
  };
}
```

### 4.2 Create Multi-Course Context (Optional)

Create `lib/context/multi-course.ts`:

```typescript
import type { Course, CourseMaterial, MultiCourseContext, CourseContext } from '@/lib/models/types';
import { buildCourseContext } from './builder';
import { extractKeywords } from '@/lib/api/client';

/**
 * Detect primary course from question keywords
 *
 * Uses keyword matching against course materials to determine
 * which course is most relevant to the question.
 */
export function detectPrimaryCourse(
  questionTitle: string,
  questionContent: string,
  tags: string[] | undefined,
  courseContexts: CourseContext[]
): string | undefined {
  const questionText = `${questionTitle} ${questionContent} ${tags?.join(' ') || ''}`;
  const questionKeywords = extractKeywords(questionText);

  // Score each course by material relevance
  const courseScores = courseContexts.map(context => {
    const totalRelevance = context.materials.reduce(
      (sum, rm) => sum + rm.relevanceScore,
      0
    );
    return { courseId: context.courseId, score: totalRelevance };
  });

  // Sort by score and return top course
  courseScores.sort((a, b) => b.score - a.score);

  return courseScores.length > 0 ? courseScores[0].courseId : undefined;
}

/**
 * Build multi-course context
 *
 * Aggregates materials from all enrolled courses and builds
 * a unified context. Useful for general Q&A where the course
 * isn't specified.
 */
export async function buildMultiCourseContext(
  courses: Course[],
  allMaterials: CourseMaterial[],
  questionTitle: string,
  questionContent: string,
  tags?: string[]
): Promise<MultiCourseContext> {
  // Build context for each course
  const courseContexts: CourseContext[] = [];

  for (const course of courses) {
    const courseMaterials = allMaterials.filter(m => m.courseId === course.id);
    const context = await buildCourseContext(
      course,
      courseMaterials,
      questionTitle,
      questionContent,
      tags
    );
    courseContexts.push(context);
  }

  // Filter out courses with no relevant materials
  const relevantContexts = courseContexts.filter(ctx => ctx.materials.length > 0);

  // Detect primary course
  const primaryCourseId = detectPrimaryCourse(
    questionTitle,
    questionContent,
    tags,
    relevantContexts
  );

  // Combine context texts
  const contextText = relevantContexts
    .map(ctx => `\n## ${ctx.courseName} (${ctx.courseCode})\n${ctx.contextText}`)
    .join('\n\n');

  // Calculate total tokens
  const totalTokens = relevantContexts.reduce((sum, ctx) => sum + ctx.totalTokens, 0);

  return {
    courses: relevantContexts,
    totalTokens,
    contextText,
    primaryCourseId,
  };
}
```

### 4.3 Testing

Create `lib/context/__tests__/builder.test.ts`:

```typescript
import { rankMaterialsByRelevance, buildContextText } from '../builder';
import type { CourseMaterial } from '@/lib/models/types';

describe('Context Builder', () => {
  const mockMaterials: CourseMaterial[] = [
    {
      id: 'm1',
      courseId: 'c1',
      type: 'lecture',
      title: 'Binary Search',
      content: 'Binary search is an efficient algorithm...',
      keywords: ['binary', 'search', 'algorithm', 'sorted'],
      metadata: { week: 1 },
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 'm2',
      courseId: 'c1',
      type: 'slide',
      title: 'Sorting Algorithms',
      content: 'Sorting algorithms include merge sort...',
      keywords: ['sorting', 'merge', 'quick', 'algorithm'],
      metadata: { week: 2 },
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  test('ranks materials by relevance', () => {
    const questionKeywords = ['binary', 'search', 'sorted'];
    const ranked = rankMaterialsByRelevance(mockMaterials, questionKeywords);

    expect(ranked.length).toBe(2);
    expect(ranked[0].material.id).toBe('m1'); // Binary Search should rank higher
    expect(ranked[0].relevanceScore).toBeGreaterThan(ranked[1].relevanceScore);
  });

  test('builds context text', () => {
    const ranked = rankMaterialsByRelevance(mockMaterials, ['algorithm']);
    const contextText = buildContextText(ranked);

    expect(contextText).toContain('Binary Search');
    expect(contextText).toContain('Sorting Algorithms');
    expect(contextText).toContain('Material 1:');
  });

  test('filters out irrelevant materials', () => {
    const questionKeywords = ['calculus', 'derivative']; // Not in materials
    const ranked = rankMaterialsByRelevance(mockMaterials, questionKeywords);

    expect(ranked.length).toBe(0); // No relevant materials
  });
});
```

**Acceptance Criteria:**
- [ ] Context builder implemented
- [ ] Material ranking working
- [ ] Context text formatting correct
- [ ] Token estimation integrated
- [ ] Multi-course support (optional) working
- [ ] Tests passing

---

## Phase 5: API Client Integration

**Duration:** 8 hours
**Dependencies:** Phase 4
**Difficulty:** High

### 5.1 Update `generateAIResponseWithMaterials()`

Modify `lib/api/client.ts` (lines 494-579):

```typescript
import { env } from '@/lib/utils/env';
import { getLLMProvider, getFallbackProvider } from '@/lib/llm';
import { buildCourseContext } from '@/lib/context/builder';
import { buildConversationMessages, parseCitations, calculateConfidenceScore } from '@/lib/llm/prompts';
import type { LLMError } from '@/lib/models/types';

/**
 * Generate AI response with course material references (LLM-powered)
 *
 * Replaces template-based generation with real LLM calls.
 * Falls back to template system if LLM is disabled or fails.
 */
async function generateAIResponseWithMaterials(
  courseId: string,
  courseCode: string,
  title: string,
  content: string,
  tags: string[]
): Promise<{
  content: string;
  confidence: { level: ConfidenceLevel; score: number };
  citations: Citation[];
}> {
  // Feature flag: Use LLM or fall back to templates
  if (!env.useLLM) {
    console.log('[AI] Using template-based generation (LLM disabled)');
    return generateAIResponse(courseCode, title, content, tags); // Existing template logic
  }

  try {
    // 1. Get course and materials
    const course = getCourseById(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const materials = await api.getCourseMaterials(courseId);
    if (materials.length === 0) {
      console.warn(`[AI] No materials found for course ${courseId}, using template fallback`);
      return generateAIResponse(courseCode, title, content, tags);
    }

    // 2. Build course context
    const courseContext = await buildCourseContext(
      course,
      materials,
      title,
      content,
      tags
    );

    if (courseContext.materials.length === 0) {
      console.warn(`[AI] No relevant materials found, using template fallback`);
      return generateAIResponse(courseCode, title, content, tags);
    }

    console.log(`[AI] Built context with ${courseContext.materials.length} materials (${courseContext.totalTokens} tokens)`);

    // 3. Build conversation messages
    const messages = buildConversationMessages(courseContext, title, content, tags);

    // 4. Call LLM with retry/fallback
    const provider = getLLMProvider();
    let llmResponse;

    try {
      llmResponse = await provider.generateAnswer({
        messages,
        temperature: 0.7,
        maxTokens: env.maxTokens,
      });
    } catch (error) {
      // Try fallback provider
      const fallback = getFallbackProvider();
      if (fallback && (error as LLMError).type !== 'invalid_api_key') {
        console.warn(`[AI] Primary provider failed, trying fallback: ${fallback.name}`);
        llmResponse = await fallback.generateAnswer({
          messages,
          temperature: 0.7,
          maxTokens: env.maxTokens,
        });
      } else {
        throw error; // No fallback or unrecoverable error
      }
    }

    console.log(`[AI] Generated response (${llmResponse.tokensUsed} tokens, ${llmResponse.model})`);

    // 5. Parse citations from response
    const parsedCitations = parseCitations(llmResponse.content, courseContext.materials);

    // 6. Build Citation[] objects
    const citations: Citation[] = parsedCitations.map((pc, index) => {
      const material = pc.material;
      const excerpt = material
        ? material.content.slice(0, 150).trim() + '...'
        : pc.source;

      return {
        id: generateId('cite'),
        sourceType: material ? mapMaterialTypeToCitationType(material.type) : 'lecture',
        source: pc.source,
        excerpt,
        relevance: material
          ? courseContext.materials.find(rm => rm.material.id === material.id)?.relevanceScore || 50
          : 50,
        link: undefined, // Mock
      };
    });

    // 7. Calculate confidence score
    const { score, level } = calculateConfidenceScore(
      parsedCitations,
      courseContext.materials
    );

    return {
      content: llmResponse.content,
      confidence: { level, score },
      citations,
    };

  } catch (error) {
    console.error('[AI] LLM generation failed, falling back to templates:', error);

    // Ultimate fallback: use template system
    return generateAIResponse(courseCode, title, content, tags);
  }
}
```

### 5.2 Update React Query Hooks

Modify `lib/api/hooks.ts`:

**Update `useGenerateAIPreview()` cache time (line 476):**

```typescript
export function useGenerateAIPreview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateAIAnswerInput) => api.generateAIPreview(input),
    onSuccess: (preview, input) => {
      // Cache preview with SHORT expiry (was 30s, now 5s due to LLM cost)
      const questionHash = hashQuestion(input.title + input.content);
      queryClient.setQueryData(queryKeys.aiPreview(questionHash), preview);

      // Set shorter stale time
      queryClient.setQueryDefaults(queryKeys.aiPreview(questionHash), {
        staleTime: env.cacheTTLPreview, // 5 seconds from env
      });
    },
  });
}
```

**Add debouncing to ask page** (component-level change):

In `app/ask/page.tsx`, add debouncing for preview:

```typescript
import { useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce'; // npm install lodash.debounce

// Inside component:
const debouncedGeneratePreview = useMemo(
  () => debounce((input: GenerateAIAnswerInput) => {
    generatePreview(input);
  }, env.debounceMs), // 500ms from env
  [generatePreview]
);

// Use debouncedGeneratePreview instead of generatePreview
```

### 5.3 Error Handling Enhancement

Add LLM-specific error handling to `lib/api/client.ts`:

```typescript
import { isLLMError } from '@/lib/models/types';

// In generateAIAnswer and generateAIPreview:
try {
  const result = await generateAIResponseWithMaterials(...);
  return createAIAnswer(result);
} catch (error) {
  if (isLLMError(error)) {
    // Handle LLM-specific errors
    switch (error.type) {
      case 'rate_limit':
        console.error(`[AI] Rate limit hit, retry after ${error.retryAfter}s`);
        throw new Error(`AI service is temporarily rate limited. Please try again in ${error.retryAfter} seconds.`);

      case 'context_too_long':
        console.error(`[AI] Context too long (${error.maxTokens} tokens)`);
        // Retry with fewer materials?
        throw new Error('Question context is too long. Please try a shorter question.');

      case 'invalid_api_key':
        console.error('[AI] Invalid API key');
        throw new Error('AI service is not configured correctly. Please contact support.');

      default:
        console.error('[AI] LLM error:', error);
        throw new Error('AI service encountered an error. Using fallback response.');
    }
  }

  // Generic error
  throw error;
}
```

### 5.4 Testing

Create integration test `lib/api/__tests__/llm-integration.test.ts`:

```typescript
import { api } from '../client';
import { env } from '@/lib/utils/env';

// Mock environment to disable LLM for tests
jest.mock('@/lib/utils/env', () => ({
  env: {
    ...jest.requireActual('@/lib/utils/env').env,
    useLLM: false, // Use templates for predictable tests
  },
}));

describe('AI Answer Generation', () => {
  test('generates AI answer with template fallback', async () => {
    const input = {
      threadId: 'test-thread',
      courseId: 'course-cs101',
      title: 'How does binary search work?',
      content: 'I need help understanding binary search algorithm.',
      tags: ['algorithms', 'search'],
    };

    const answer = await api.generateAIAnswer(input);

    expect(answer).toBeDefined();
    expect(answer.content).toBeTruthy();
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.confidenceLevel).toMatch(/high|medium|low/);
  });

  test('generates AI preview', async () => {
    const input = {
      threadId: 'preview',
      courseId: 'course-math221',
      title: 'What is integration by parts?',
      content: 'Explain the integration by parts formula.',
      tags: ['calculus', 'integration'],
    };

    const preview = await api.generateAIPreview(input);

    expect(preview).toBeDefined();
    expect(preview.content).toContain('integration');
    expect(preview.citations).toBeDefined();
  });
});

// TODO: Add LLM integration tests with mocked API responses
// Use VCR pattern or nock to record/replay API calls
```

**Acceptance Criteria:**
- [ ] `generateAIResponseWithMaterials()` updated to use LLM
- [ ] Feature flag working (LLM vs template)
- [ ] Fallback logic functional
- [ ] Error handling comprehensive
- [ ] Cache times updated
- [ ] Tests passing

---

## Phase 6: Conversation Storage (Optional)

**Duration:** 4 hours
**Dependencies:** Phase 5
**Difficulty:** Medium

### 6.1 Add Conversation Storage to LocalStore

Add to `lib/store/localStore.ts`:

```typescript
import type { AIConversation, Message } from "@/lib/models/types";

const KEYS = {
  // ... existing keys ...
  conversations: "quokkaq.conversations",
} as const;

// ============================================
// Conversation Data Access
// ============================================

/**
 * Get all conversations from localStorage
 */
export function getConversations(): AIConversation[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.conversations);
  if (!data) {
    localStorage.setItem(KEYS.conversations, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as AIConversation[];
  } catch {
    return [];
  }
}

/**
 * Get conversations for a specific user
 */
export function getConversationsByUser(userId: string): AIConversation[] {
  const conversations = getConversations();
  return conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get conversation by ID
 */
export function getConversationById(id: string): AIConversation | null {
  const conversations = getConversations();
  return conversations.find((c) => c.id === id) ?? null;
}

/**
 * Add new conversation
 */
export function addConversation(conversation: AIConversation): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  conversations.push(conversation);
  localStorage.setItem(KEYS.conversations, JSON.stringify(conversations));
}

/**
 * Update existing conversation
 */
export function updateConversation(id: string, updates: Partial<AIConversation>): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === id);

  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEYS.conversations, JSON.stringify(conversations));
  }
}

/**
 * Delete conversation
 */
export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;

  const conversations = getConversations();
  const filtered = conversations.filter((c) => c.id !== id);
  localStorage.setItem(KEYS.conversations, JSON.stringify(filtered));
}
```

### 6.2 Add Conversation Hooks

Add to `lib/api/hooks.ts`:

```typescript
/**
 * Get user's AI conversations
 */
export function useAIConversations(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? ['aiConversations', userId] : ['aiConversations'],
    queryFn: () => (userId ? api.getAIConversations(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });
}

/**
 * Get messages for a conversation
 */
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationId ? ['conversationMessages', conversationId] : ['conversationMessages'],
    queryFn: () => (conversationId ? api.getConversationMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Send message to conversation (mutation)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      api.sendMessageToConversation(conversationId, message),

    // Optimistic update
    onMutate: async ({ conversationId, message }) => {
      const queryKey = ['conversationMessages', conversationId];

      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData(queryKey);

      // Add optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      queryClient.setQueryData(queryKey, (old: Message[] | undefined) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, conversationId };
    },

    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['conversationMessages', context.conversationId],
          context.previousMessages
        );
      }
    },

    onSuccess: (data, variables, context) => {
      if (!context?.conversationId) return;

      // Invalidate to refetch with AI response
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', context.conversationId]
      });
      queryClient.invalidateQueries({
        queryKey: ['aiConversations', data.userId]
      });
    },
  });
}

/**
 * Convert conversation to thread
 */
export function useConvertConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, courseId }: { conversationId: string; courseId: string }) =>
      api.convertConversationToThread(conversationId, courseId),
    onSuccess: (thread, variables) => {
      // Invalidate course threads
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });

      // Invalidate conversation
      queryClient.invalidateQueries({ queryKey: ['aiConversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversationMessages', variables.conversationId] });
    },
  });
}
```

### 6.3 Add Conversation API Methods

Add to `lib/api/client.ts`:

```typescript
/**
 * Get user's AI conversations
 */
async getAIConversations(userId: string): Promise<AIConversation[]> {
  await delay(200);
  seedData();

  const conversations = getConversationsByUser(userId);
  return conversations;
},

/**
 * Get messages for a conversation
 */
async getConversationMessages(conversationId: string): Promise<Message[]> {
  await delay(200);
  seedData();

  const conversation = getConversationById(conversationId);
  return conversation?.messages || [];
},

/**
 * Send message to conversation and get AI response
 */
async sendMessageToConversation(
  conversationId: string,
  userMessage: string
): Promise<AIConversation> {
  await delay(1000); // Simulate LLM latency
  seedData();

  const conversation = getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  // Add user message
  const newUserMessage: Message = {
    id: generateId('msg'),
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  };

  // Generate AI response (reuse existing LLM logic)
  // TODO: Build course context and call LLM
  const aiResponseContent = "AI response would go here...";

  const aiMessage: Message = {
    id: generateId('msg'),
    role: 'assistant',
    content: aiResponseContent,
    timestamp: new Date(),
  };

  // Update conversation
  const updatedMessages = [...conversation.messages, newUserMessage, aiMessage];

  updateConversation(conversationId, {
    messages: updatedMessages,
    metadata: {
      ...conversation.metadata,
      messageCount: updatedMessages.length,
      lastMessageAt: new Date(),
    },
  });

  const updated = getConversationById(conversationId);
  if (!updated) throw new Error('Failed to update conversation');

  return updated;
},

/**
 * Convert conversation to public thread
 */
async convertConversationToThread(
  conversationId: string,
  courseId: string
): Promise<Thread> {
  await delay(300);
  seedData();

  const conversation = getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  // Build thread from conversation
  const threadTitle = conversation.title || conversation.messages[0]?.content.slice(0, 100);
  const threadContent = conversation.messages
    .map(m => `**${m.role === 'user' ? 'Student' : 'AI Assistant'}:** ${m.content}`)
    .join('\n\n');

  const newThread: Thread = {
    id: generateId('thread'),
    courseId,
    title: threadTitle,
    content: threadContent,
    authorId: conversation.userId,
    status: 'answered',
    tags: [],
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  addThread(newThread);

  // Delete conversation (converted to thread)
  deleteConversation(conversationId);

  return newThread;
},
```

**Acceptance Criteria:**
- [ ] Conversation storage implemented
- [ ] Conversation hooks working
- [ ] Send message functional
- [ ] Conversation → thread conversion working
- [ ] Tests passing

---

## Phase 7: Testing & Validation

**Duration:** 6 hours
**Dependencies:** All previous phases
**Difficulty:** Medium

### 7.1 Manual Testing Checklist

**LLM Provider Tests:**
- [ ] OpenAI provider generates answers successfully
- [ ] Anthropic provider generates answers successfully
- [ ] Fallback to alternate provider works
- [ ] Fallback to templates works when LLM disabled
- [ ] Error handling for rate limits
- [ ] Error handling for invalid API keys
- [ ] Error handling for network errors

**Context Building Tests:**
- [ ] Single-course context builds correctly
- [ ] Materials ranked by relevance
- [ ] Context text formatted properly
- [ ] Token estimation accurate
- [ ] Context truncation works when too large
- [ ] Multi-course context (if enabled)

**API Integration Tests:**
- [ ] `generateAIAnswer()` uses LLM when enabled
- [ ] `generateAIPreview()` uses LLM when enabled
- [ ] Citations parsed from LLM response
- [ ] Confidence scores calculated correctly
- [ ] Template fallback works
- [ ] Feature flag toggles correctly

**UI Integration Tests:**
- [ ] Ask page preview works with LLM
- [ ] Thread creation generates AI answer
- [ ] Loading states display correctly
- [ ] Error messages user-friendly
- [ ] Debouncing prevents rapid API calls

**Performance Tests:**
- [ ] AI generation completes in <3s
- [ ] Preview debounce prevents spam
- [ ] Cache reduces duplicate API calls
- [ ] Token usage logged correctly

### 7.2 Cost Monitoring

**Daily Cost Tracking:**

Create `lib/utils/cost-tracking.ts`:

```typescript
import { env } from './env';

interface UsageLog {
  timestamp: string;
  provider: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
}

/**
 * Log LLM usage to localStorage for cost tracking
 */
export function logLLMUsage(
  provider: string,
  model: string,
  tokensUsed: number
): void {
  if (!env.logUsage) return;

  // Rough cost estimates (as of 2025-01):
  // GPT-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens (avg: $0.375 / 1M)
  // Claude 3 Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens (avg: $0.75 / 1M)
  const costPer1MTokens = provider === 'openai' ? 0.375 : 0.75;
  const estimatedCost = (tokensUsed / 1_000_000) * costPer1MTokens;

  const log: UsageLog = {
    timestamp: new Date().toISOString(),
    provider,
    model,
    tokensUsed,
    estimatedCost,
  };

  // Store in localStorage
  const logs = getLLMUsageLogs();
  logs.push(log);

  // Keep only last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filtered = logs.filter(l => new Date(l.timestamp) >= sevenDaysAgo);

  localStorage.setItem('quokkaq.llmUsage', JSON.stringify(filtered));

  // Check daily cost threshold
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = filtered.filter(l => new Date(l.timestamp) >= todayStart);
  const todayCost = todayLogs.reduce((sum, l) => sum + l.estimatedCost, 0);

  if (todayCost > env.costAlertThreshold) {
    console.warn(`⚠️ LLM cost today ($${todayCost.toFixed(2)}) exceeds threshold ($${env.costAlertThreshold})`);
  }
}

/**
 * Get LLM usage logs from localStorage
 */
export function getLLMUsageLogs(): UsageLog[] {
  const data = localStorage.getItem('quokkaq.llmUsage');
  if (!data) return [];

  try {
    return JSON.parse(data) as UsageLog[];
  } catch {
    return [];
  }
}

/**
 * Get today's estimated cost
 */
export function getTodayCost(): number {
  const logs = getLLMUsageLogs();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = logs.filter(l => new Date(l.timestamp) >= todayStart);
  return todayLogs.reduce((sum, l) => sum + l.estimatedCost, 0);
}
```

**Usage in LLM providers:**

```typescript
import { logLLMUsage } from '@/lib/utils/cost-tracking';

// In OpenAIProvider.generateAnswer():
const response = await this.callOpenAI(...);
logLLMUsage('openai', this.model, response.tokensUsed);
return response;
```

### 7.3 Performance Profiling

**Metrics to Track:**

1. **Latency:**
   - AI generation time (target: <3s p95)
   - Context building time (target: <100ms)
   - Token estimation time (target: <20ms)

2. **Throughput:**
   - API calls per minute
   - Cache hit rate

3. **Cost:**
   - Tokens per request (avg)
   - Daily cost estimate
   - Cost per feature (preview vs generation)

**Logging:**

```typescript
// In lib/api/client.ts
const startTime = performance.now();
const result = await generateAIResponseWithMaterials(...);
const duration = performance.now() - startTime;

if (env.logUsage) {
  console.log(`[Performance] AI generation: ${duration.toFixed(0)}ms`);
}
```

**Acceptance Criteria:**
- [ ] All manual tests passing
- [ ] Performance within targets
- [ ] Cost tracking working
- [ ] Monitoring logs helpful
- [ ] No regressions in existing features

---

## Phase 8: Documentation & Handoff

**Duration:** 4 hours
**Dependencies:** Phase 7
**Difficulty:** Low

### 8.1 Update README.md

Add LLM setup section:

```markdown
## LLM Integration Setup

QuokkaQ uses AI to generate answers using real LLM providers (OpenAI or Anthropic).

### Quick Start

1. **Get API Keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/

2. **Configure Environment:**

Create `.env.local`:

\`\`\`bash
# Enable LLM (false = use templates)
NEXT_PUBLIC_USE_LLM=true

# Choose provider
NEXT_PUBLIC_LLM_PROVIDER=openai  # or 'anthropic'

# Add your API keys
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

# Optional: Tune settings
NEXT_PUBLIC_MAX_TOKENS=2000
NEXT_PUBLIC_MAX_CONTEXT_MATERIALS=10
\`\`\`

3. **Run Dev Server:**

\`\`\`bash
npm install
npm run dev
\`\`\`

### Cost Monitoring

- Token usage logged to console when `NEXT_PUBLIC_LOG_LLM_USAGE=true`
- Daily cost estimates in browser console
- Alert if daily cost exceeds `NEXT_PUBLIC_COST_ALERT_THRESHOLD`

### Security Warning

⚠️ **This is a demo architecture.** API keys are exposed in the client-side bundle.

**For production:**
- Move LLM calls to Next.js API routes or separate backend
- Store API keys server-side only
- Implement proper authentication and rate limiting

### Feature Flags

Toggle features in `.env.local`:

- `NEXT_PUBLIC_USE_LLM=false` → Disable LLM, use templates
- `NEXT_PUBLIC_ENABLE_STREAMING=false` → Disable streaming (future)
- `NEXT_PUBLIC_ENABLE_MULTI_COURSE=false` → Single-course only

### Troubleshooting

**"Invalid API key" error:**
- Check `.env.local` has correct keys
- Ensure keys don't include 'demo' placeholder
- Restart dev server after changing `.env.local`

**"Rate limit exceeded":**
- Reduce `NEXT_PUBLIC_MAX_TOKENS`
- Enable caching: longer `staleTime` in hooks
- Implement request queuing

**"Context too long":**
- Reduce `NEXT_PUBLIC_MAX_CONTEXT_MATERIALS`
- Shorter question titles/content
- Materials automatically truncated if needed
```

### 8.2 Update CLAUDE.md

Add LLM development guidelines:

```markdown
## LLM Integration Guidelines

### Working with LLM Providers

**DO:**
- ✅ Use feature flag (`env.useLLM`) for all LLM calls
- ✅ Implement fallback to templates
- ✅ Log token usage and costs
- ✅ Handle errors gracefully with retry logic
- ✅ Test with both OpenAI and Anthropic

**DON'T:**
- ❌ Call LLM APIs directly from components
- ❌ Skip error handling
- ❌ Ignore rate limits
- ❌ Hardcode API keys
- ❌ Make LLM calls in loops

### Adding New LLM Features

1. **Check feature flag:**
\`\`\`typescript
if (!env.useLLM) {
  // Fallback implementation
}
\`\`\`

2. **Build context:**
\`\`\`typescript
const context = await buildCourseContext(course, materials, question);
\`\`\`

3. **Call LLM with retry:**
\`\`\`typescript
try {
  const response = await provider.generateAnswer(input);
  logLLMUsage(provider.name, provider.model, response.tokensUsed);
  return response;
} catch (error) {
  const fallback = getFallbackProvider();
  if (fallback) return await fallback.generateAnswer(input);
  throw error;
}
\`\`\`

4. **Parse response:**
\`\`\`typescript
const citations = parseCitations(response.content, materials);
const confidence = calculateConfidenceScore(citations, materials);
\`\`\`

### Testing LLM Code

**Unit Tests:** Mock LLM providers
\`\`\`typescript
jest.mock('@/lib/llm', () => ({
  getLLMProvider: () => mockProvider,
}));
\`\`\`

**Integration Tests:** Use VCR pattern to record/replay API calls

**Manual Tests:** Use demo API keys (`sk-demo-...`) with template fallback
```

### 8.3 Create Migration Runbook

Create `doccloud/tasks/backend-llm-transformation/MIGRATION_RUNBOOK.md`:

```markdown
# LLM Migration Runbook

## Pre-Migration Checklist

- [ ] API keys obtained (OpenAI and Anthropic)
- [ ] `.env.local` configured
- [ ] Feature flag set to `false` initially
- [ ] Templates still working
- [ ] All tests passing

## Migration Steps

### Step 1: Deploy with Feature Flag OFF (1 hour)

1. Merge LLM code to main branch
2. Deploy to staging
3. Verify feature flag is `false`
4. Test template-based generation still works
5. Deploy to production

**Rollback:** Revert deployment

### Step 2: Enable for Dev/Testing (1 week)

1. Set `NEXT_PUBLIC_USE_LLM=true` locally
2. Test all AI features with real LLM
3. Monitor token usage and costs
4. Collect feedback from team

**Rollback:** Set `USE_LLM=false`

### Step 3: Enable for Staging (1 week)

1. Set feature flag to `true` on staging
2. Full QA testing
3. Performance testing
4. Cost analysis

**Rollback:** Set `USE_LLM=false` on staging

### Step 4: Gradual Production Rollout (2 weeks)

1. Enable for 10% of users (A/B test)
2. Monitor metrics:
   - Latency (target: <3s p95)
   - Error rate (target: <1%)
   - Cost (target: <$50/day)
   - User satisfaction
3. Increase to 50% if metrics good
4. Full rollout if no issues

**Rollback at any stage:** Set `USE_LLM=false`

## Monitoring

**Key Metrics:**
- API error rate
- Response latency (p50, p95, p99)
- Token usage per request
- Daily cost
- Cache hit rate

**Alerts:**
- Error rate >5% for 5 minutes
- Latency p95 >5s for 5 minutes
- Daily cost >$100
- Rate limit errors >10% of requests

## Troubleshooting

**High error rate:**
1. Check API key validity
2. Check rate limits
3. Enable fallback provider
4. Rollback to templates if critical

**High latency:**
1. Reduce `maxTokens`
2. Reduce `maxContextMaterials`
3. Enable caching with longer `staleTime`
4. Consider async generation

**High cost:**
1. Reduce `maxTokens`
2. Increase cache `staleTime`
3. Add request throttling
4. Review usage logs for patterns

## Rollback Procedure

**Immediate (< 5 minutes):**
\`\`\`bash
# Set feature flag to false
NEXT_PUBLIC_USE_LLM=false

# Redeploy or restart server
npm run build && npm start
\`\`\`

**Full Revert (< 1 hour):**
\`\`\`bash
git revert <commit-hash>
git push origin main
# Trigger production deployment
\`\`\`
```

**Acceptance Criteria:**
- [ ] README updated with setup instructions
- [ ] CLAUDE.md updated with LLM guidelines
- [ ] Migration runbook created
- [ ] All documentation reviewed
- [ ] Security warnings prominent

---

## Success Criteria

**Phase Completion:**
- [ ] All 8 phases completed
- [ ] Zero breaking changes to public API
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Feature flag working
- [ ] Fallback logic functional
- [ ] Documentation complete

**Performance:**
- [ ] AI generation <3s p95
- [ ] Context building <100ms
- [ ] Cache hit rate >50%
- [ ] Daily cost <$100 (demo)

**Quality:**
- [ ] Error handling comprehensive
- [ ] Logging informative
- [ ] Security warnings clear
- [ ] Rollback procedures tested

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Environment Setup | 2h | 2h |
| 2. Type System | 2h | 4h |
| 3. LLM Providers | 8h | 12h |
| 4. Context Builder | 6h | 18h |
| 5. API Integration | 8h | 26h |
| 6. Conversations (opt) | 4h | 30h |
| 7. Testing | 6h | 36h |
| 8. Documentation | 4h | **40h** |

**Total: 40 hours over 5-6 weeks** (phased implementation with testing)

---

## Rollback Strategy

**Level 1: Feature Flag (0 downtime)**
```bash
NEXT_PUBLIC_USE_LLM=false
```

**Level 2: Provider Swap (0 downtime)**
```bash
NEXT_PUBLIC_LLM_PROVIDER=anthropic  # If OpenAI fails
```

**Level 3: Template Fallback (automatic)**
- Built into code
- Activates on LLM errors
- No manual intervention

**Level 4: Full Revert (< 1 hour)**
```bash
git revert <commit>
git push origin main
```

---

**End of Integration Readiness Plan**

*Read this plan before proceeding with implementation.*

*Task: Backend LLM Transformation*
*Created: 2025-10-16*

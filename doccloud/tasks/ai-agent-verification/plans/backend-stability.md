# Backend Stability Plan

**Date:** 2025-10-17
**Priority:** Critical + High-Priority Improvements
**Estimated Time:** 6-9 hours total
**Goal:** Fix critical bugs, improve error handling, add production safeguards

---

## Phase 1: Critical Bug Fixes (MUST DO)

### 1.1: Fix Tool Turn Tracking (2 hours) ⚠️ **CRITICAL**

**Problem:** Tool usage limits not enforced due to broken turn ID generation.

**Current State (BROKEN):**
```typescript
// lib/llm/tools/handlers.ts L79
const turnId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// ❌ Every tool call generates NEW turn ID → limits never checked!
```

**Root Cause:** No request context to track conversation turn.

**Solution:** Pass turn ID from API route to tool handlers.

#### Step 1.1.1: Update API route to generate turn ID
```typescript
// app/api/chat/route.ts

// After parsing request body (L39-43)
const {
  messages,
  userId,
  courseId,
  conversationId, // Already in request
} = body;

// Generate stable turn ID (L44)
const turnId = `${conversationId || userId}-${messages.length}`;

// Pass to streamText via toolContext (L98-106)
const result = streamText({
  model,
  system: systemPrompt + courseContextInfo,
  messages: coreMessages,
  tools: ragTools as any,
  temperature: config.temperature,
  topP: config.topP,
  toolContext: { // ← NEW: Pass turn ID to tools
    turnId,
    conversationId,
    userId,
  },
});
```

**File:** `/app/api/chat/route.ts`
**Lines:** 44, 98-106

#### Step 1.1.2: Update tool handler signatures
```typescript
// lib/llm/tools/handlers.ts

// Update handleKBSearch signature (L49-75)
export async function handleKBSearch(
  params: {
    query: string;
    courseId?: string;
    maxResults: number;
  },
  context?: { // ← NEW: Accept context parameter
    turnId?: string;
    conversationId?: string;
    userId?: string;
  }
): Promise<{...}> {
  const { query, courseId, maxResults } = params;

  // Use provided turn ID or fallback to timestamp (L79)
  const turnId = context?.turnId ||
    `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Remove cleanupOldUsage() call (L80)
  // Will implement LRU cache in Phase 2

  // Rest of function unchanged...
}
```

**File:** `/lib/llm/tools/handlers.ts`
**Lines:** 49-75, 79-80

#### Step 1.1.3: Update handleKBFetch signature
```typescript
// lib/llm/tools/handlers.ts

// Update handleKBFetch signature (L204-217)
export async function handleKBFetch(
  params: {
    materialId: string;
  },
  context?: { // ← NEW: Accept context parameter
    turnId?: string;
    conversationId?: string;
    userId?: string;
  }
): Promise<{...}> {
  const { materialId } = params;

  // Use provided turn ID (L221)
  const turnId = context?.turnId ||
    `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Rest of function unchanged...
}
```

**File:** `/lib/llm/tools/handlers.ts`
**Lines:** 204-217, 221

#### Step 1.1.4: Update tool definitions to pass context
```typescript
// lib/llm/tools/index.ts

// Update kbSearchTool execute function (L49-57)
export const kbSearchTool = tool({
  description: "...",
  inputSchema: z.object({...}),
  execute: async ({ query, courseId, maxResults }, context) => { // ← NEW: Accept context
    const { handleKBSearch } = await import("./handlers");
    return handleKBSearch(
      { query, courseId, maxResults },
      context // ← NEW: Pass context to handler
    );
  },
});

// Update kbFetchTool execute function (L77-82)
export const kbFetchTool = tool({
  description: "...",
  inputSchema: z.object({...}),
  execute: async ({ materialId }, context) => { // ← NEW: Accept context
    const { handleKBFetch } = await import("./handlers");
    return handleKBFetch(
      { materialId },
      context // ← NEW: Pass context to handler
    );
  },
});
```

**File:** `/lib/llm/tools/index.ts`
**Lines:** 49-57, 77-82

#### Step 1.1.5: Test turn tracking
```bash
# Test case 1: Single search per turn
# Expected: Success
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is binary search?"}],
    "userId": "user-123",
    "conversationId": "conv-abc",
    "courseId": "course-cs101"
  }'

# Test case 2: Multiple searches in same turn
# Expected: Second search fails with error
# (This would require modifying the prompt to force multiple tool calls)

# Test case 3: Search in different turns
# Expected: Both succeed
# Turn 1
curl -X POST ... -d '{"messages": [{"role": "user", "content": "What is binary search?"}], ...}'
# Turn 2
curl -X POST ... -d '{"messages": [
  {"role": "user", "content": "What is binary search?"},
  {"role": "assistant", "content": "..."},
  {"role": "user", "content": "What about linear search?"}
], ...}'
```

**Success Criteria:**
- ✅ Turn ID generated at API route level
- ✅ Turn ID passed to tool handlers via context
- ✅ Same turn ID used for all tool calls in one message
- ✅ Different turn IDs for different messages
- ✅ Usage limits enforced correctly
- ✅ Console logs show turn IDs in tool handlers

---

### 1.2: Add Rate Limiting (1 hour) ⚠️ **CRITICAL FOR PRODUCTION**

**Problem:** No rate limiting on `/api/chat` endpoint.

**Risk:** API abuse, cost overruns, DDoS vulnerability.

**Solution:** Add simple in-memory rate limiting (upgrade to Redis in production).

#### Step 1.2.1: Install dependencies
```bash
npm install --save lru-cache
```

#### Step 1.2.2: Create rate limiter utility
```typescript
// lib/utils/rate-limit.ts

import { LRUCache } from 'lru-cache';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (use Redis in production)
const rateLimitCache = new LRUCache<string, RateLimitEntry>({
  max: 10000, // Track up to 10k users
  ttl: 60 * 1000, // 1 minute TTL
});

export interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number;    // Window size in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for identifier
 *
 * @param identifier - User ID, IP address, or other identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitCache.get(identifier);

  // No entry or expired - allow and create new entry
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimitCache.set(identifier, {
      count: 1,
      resetAt,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    // Limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitCache.set(identifier, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitCache.get(identifier);

  if (!entry || entry.resetAt <= now) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    success: entry.count < config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
```

**File:** `/lib/utils/rate-limit.ts` (NEW)
**Lines:** 1-98

#### Step 1.2.3: Apply rate limiting to API route
```typescript
// app/api/chat/route.ts

import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getEnvConfig } from '@/lib/utils/env';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages, userId } = body;

    // Validation
    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting (ADD THIS BLOCK)
    const envConfig = getEnvConfig();
    const rateLimit = checkRateLimit(userId, {
      maxRequests: envConfig.maxRequestsPerMinute || 10, // Default 10 req/min
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);

      return Response.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `You've made too many requests. Please wait ${retryAfter} seconds.`,
          retryAfter, // Seconds until reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000)),
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Log rate limit info (optional)
    if (envConfig.debugLLM) {
      console.log(`[AI Chat] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining for ${userId}`);
    }

    // Rest of function unchanged...
  } catch (error) {
    // ...
  }
}
```

**File:** `/app/api/chat/route.ts`
**Lines:** Add after L39-58 (after userId validation)

#### Step 1.2.4: Update environment config
```typescript
// lib/utils/env.ts

// Already has maxRequestsPerMinute in EnvConfig interface (L42)
// Already loaded in loadEnvConfig (L142)
// No changes needed - already implemented!
```

#### Step 1.2.5: Test rate limiting
```bash
# Test case 1: Within limit
# Expected: Success
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [{"role": "user", "content": "Hello"}],
      "userId": "test-user-123"
    }'
  sleep 1
done

# Test case 2: Exceed limit
# Expected: 429 error on request 11+
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "messages": [{"role": "user", "content": "Hello"}],
      "userId": "test-user-456"
    }'
done

# Test case 3: Wait for reset
# Expected: Success after waiting
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [...], "userId": "test-user-456"}'
sleep 60
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [...], "userId": "test-user-456"}'
```

**Success Criteria:**
- ✅ Rate limit enforced per user
- ✅ 429 status on limit exceeded
- ✅ Rate limit headers included in response
- ✅ Limit resets after window expires
- ✅ Different users have separate limits
- ✅ Rate limit configurable via env vars

---

### 1.3: Document Migration Path for Server-Side Keys (30 min)

**Problem:** Client-side API keys (NEXT_PUBLIC_*) are insecure for production.

**Solution:** Document migration strategy (architecture change deferred to production).

#### Step 1.3.1: Create production deployment guide
```markdown
# docs/production-deployment.md

# Production Deployment Guide

## Overview

This guide covers the migration from client-side API keys (demo setup) to server-side API keys (production setup).

---

## Current Architecture (Demo)

```
Frontend → NEXT_PUBLIC_OPENAI_API_KEY → OpenAI API
          (Exposed in browser bundle)
```

**Security Risk:** API keys visible in browser, can be extracted and abused.

---

## Production Architecture

```
Frontend → /api/chat (Server) → Server-side API key → OpenAI API
                    (Hidden in server environment)
```

**Security:** API keys never sent to browser, protected by server.

---

## Migration Steps

### 1. Update Environment Variables

**Before (Demo):**
```bash
# .env.local (CLIENT-SIDE - INSECURE)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

**After (Production):**
```bash
# .env.local (SERVER-SIDE - SECURE)
OPENAI_API_KEY=sk-...                    # ← No NEXT_PUBLIC_ prefix!
ANTHROPIC_API_KEY=sk-ant-...             # ← No NEXT_PUBLIC_ prefix!

# Keep these client-side (safe)
NEXT_PUBLIC_USE_LLM=true
NEXT_PUBLIC_LLM_PROVIDER=openai
```

### 2. Update Environment Config

```typescript
// lib/utils/env.ts

// Change getEnv() to access server-side vars
function getEnv(key: string, fallback: string = ""): string {
  const envMap: Record<string, string | undefined> = {
    // Remove NEXT_PUBLIC_ prefix for API keys
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,           // ← Changed
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,     // ← Changed

    // Keep NEXT_PUBLIC_ for client-accessible config
    'NEXT_PUBLIC_USE_LLM': process.env.NEXT_PUBLIC_USE_LLM,
    'NEXT_PUBLIC_LLM_PROVIDER': process.env.NEXT_PUBLIC_LLM_PROVIDER,
    // ...
  };

  return envMap[key] || fallback;
}

// Update loadEnvConfig to use new keys
function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    useLLM: getBoolEnv("NEXT_PUBLIC_USE_LLM", false),
    llmProvider: getLLMProvider(),

    // Use server-side keys
    openaiApiKey: getEnv("OPENAI_API_KEY") || null,         // ← Changed
    anthropicApiKey: getEnv("ANTHROPIC_API_KEY") || null,   // ← Changed

    // ...rest unchanged
  };

  return config;
}

// Update security warning flag
export const CLIENT_SIDE_API_KEYS = false; // ← Changed to false
```

### 3. Update AI SDK Providers

```typescript
// lib/llm/ai-sdk-providers.ts

// Already uses envConfig.openaiApiKey and envConfig.anthropicApiKey
// No changes needed! ✅
```

### 4. Update .env.local.example

```bash
# .env.local.example

# ============================================
# OpenAI Configuration (SERVER-SIDE)
# ============================================

# OpenAI API key (server-side only)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# ============================================
# Anthropic Configuration (SERVER-SIDE)
# ============================================

# Anthropic API key (server-side only)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Remove old NEXT_PUBLIC_OPENAI_API_KEY warnings
# Remove old NEXT_PUBLIC_ANTHROPIC_API_KEY warnings
```

### 5. Deploy to Production

**Vercel:**
```bash
# Add environment variables in Vercel dashboard
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production

# Deploy
vercel --prod
```

**Railway:**
```bash
# Add environment variables
railway variables set OPENAI_API_KEY=sk-...
railway variables set ANTHROPIC_API_KEY=sk-ant-...

# Deploy
railway up
```

**AWS/Docker:**
```bash
# Set environment variables in container/instance
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Build and deploy
npm run build
npm start
```

---

## Security Checklist

Before deploying to production:

- [ ] Remove NEXT_PUBLIC_ prefix from API keys
- [ ] Update env.ts to use server-side keys
- [ ] Verify keys not in browser bundle (check Network tab)
- [ ] Test API route with server-side keys
- [ ] Add rate limiting (see backend-stability.md Phase 1.2)
- [ ] Add authentication (verify userId)
- [ ] Enable CORS protection
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging (structured logs)
- [ ] Test error scenarios
- [ ] Review .env.local.example for sensitive data
- [ ] Add .env.local to .gitignore (already done)

---

## Rollback Plan

If production deployment fails:

1. Revert environment variable changes
2. Re-add NEXT_PUBLIC_ prefix to API keys
3. Deploy previous version
4. Investigate logs for errors
5. Test locally before re-deploying

---

## Monitoring

After deployment, monitor:

- API key usage (OpenAI/Anthropic dashboards)
- Error rates (Sentry or logs)
- Response times (New Relic or logs)
- Rate limit hits (custom metrics)
- Cost tracking (LLM provider billing)

---

## Support

For issues:
1. Check server logs for errors
2. Verify environment variables are set
3. Test with curl or Postman
4. Review API route error responses
5. Consult CLAUDE.md for troubleshooting
```

**File:** `/docs/production-deployment.md` (NEW)
**Lines:** 1-198

#### Step 1.3.2: Add UI security warning (deferred to Phase 2)

---

## Phase 2: High-Priority Improvements

### 2.1: Replace Tool Usage Store with LRU Cache (30 min)

**Problem:** Current Map grows indefinitely, causing memory leak.

**Solution:** Use LRU cache with TTL.

#### Step 2.1.1: Update tool handlers
```typescript
// lib/llm/tools/handlers.ts

import { LRUCache } from 'lru-cache';

// Replace Map with LRU cache (L20-22)
const toolUsageStore = new LRUCache<string, { searches: number; fetches: number }>({
  max: 1000,           // Keep last 1000 turns
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

// Remove cleanupOldUsage() function (L37-45) - no longer needed
```

**File:** `/lib/llm/tools/handlers.ts`
**Lines:** 20-22, delete 37-45

**Success Criteria:**
- ✅ Old entries automatically evicted
- ✅ Memory usage bounded to ~1000 entries
- ✅ TTL expires stale entries

---

### 2.2: Remove Legacy Provider Code (30 min)

**Problem:** Unused BaseLLMProvider code creates confusion.

**Solution:** Delete deprecated files.

#### Step 2.2.1: Delete legacy provider files
```bash
rm lib/llm/BaseLLMProvider.ts
rm lib/llm/OpenAIProvider.ts
rm lib/llm/AnthropicProvider.ts
```

#### Step 2.2.2: Update lib/llm/index.ts
```typescript
// lib/llm/index.ts

// Remove BaseLLMProvider exports and factory functions
// Keep only:
export * from "./utils";
export * from "./ai-sdk-providers"; // AI SDK is the production implementation
```

**File:** `/lib/llm/index.ts`
**Lines:** Remove L1-154, keep utils exports

#### Step 2.2.3: Search for references
```bash
# Search for any imports of legacy providers
grep -r "BaseLLMProvider" --exclude-dir=node_modules
grep -r "OpenAIProvider" --exclude-dir=node_modules
grep -r "AnthropicProvider" --exclude-dir=node_modules
grep -r "createLLMProvider" --exclude-dir=node_modules

# If any found, update to use AI SDK providers
```

**Success Criteria:**
- ✅ Legacy files deleted
- ✅ No references remain in codebase
- ✅ TypeScript compiles without errors
- ✅ App runs without errors

---

### 2.3: Add Structured Logging (1 hour)

**Problem:** Console.log lacks structure, hard to query.

**Solution:** Add Pino structured logger.

#### Step 2.3.1: Install dependencies
```bash
npm install --save pino pino-pretty
```

#### Step 2.3.2: Create logger utility
```typescript
// lib/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Use pino-pretty in development
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Export typed logger methods
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};
```

**File:** `/lib/utils/logger.ts` (NEW)

#### Step 2.3.3: Replace console.log in API route
```typescript
// app/api/chat/route.ts

import { log } from '@/lib/utils/logger';

// Replace console.error (L87-88)
log.warn({
  event: 'course_load_failed',
  courseId,
  error: error.message,
}, 'Failed to load course info');

// Replace console.error (L110)
log.error({
  event: 'chat_error',
  error: error.message,
  stack: error.stack,
}, 'Chat API error');

// Add request logging (after validation)
log.info({
  event: 'chat_request',
  userId,
  courseId,
  messageCount: messages.length,
});
```

**File:** `/app/api/chat/route.ts`
**Lines:** Replace console.error calls

#### Step 2.3.4: Replace console.log in providers
```typescript
// lib/llm/ai-sdk-providers.ts

import { log } from '@/lib/utils/logger';

// Replace console.log (L37, L57, L70)
log.info({
  event: 'llm_provider_created',
  provider: 'openai',
  model: envConfig.openaiModel,
});

// Replace console.warn (L103)
log.warn({
  event: 'llm_fallback',
  primaryProvider: envConfig.llmProvider,
  fallbackProvider,
});

// Replace console.warn (L115)
log.warn({
  event: 'llm_unavailable',
  message: 'All providers failed',
});
```

**File:** `/lib/llm/ai-sdk-providers.ts`

#### Step 2.3.5: Replace console.log in tool handlers
```typescript
// lib/llm/tools/handlers.ts

import { log } from '@/lib/utils/logger';

// Replace console.log (L93, L125, L177, L235, L263)
log.info({
  event: 'kb_search',
  query,
  courseId: courseId || 'all',
  maxResults,
  resultsFound: formattedMaterials.length,
});

log.info({
  event: 'kb_fetch',
  materialId,
  materialTitle: material.title,
});
```

**File:** `/lib/llm/tools/handlers.ts`

**Success Criteria:**
- ✅ All console.log/error replaced with structured logs
- ✅ Logs include event type and context
- ✅ Pretty-printed in development
- ✅ JSON in production (for log aggregation)

---

### 2.4: Improve Tool Error Handling (30 min)

**Problem:** Tool errors throw exceptions, not structured responses.

**Solution:** Return structured error objects.

#### Step 2.4.1: Update handleKBSearch error handling
```typescript
// lib/llm/tools/handlers.ts

export async function handleKBSearch(params, context) {
  try {
    // Check tool usage limits (L82-91)
    const usage = getToolUsage(turnId);
    if (usage.searches >= TOOL_LIMITS.maxSearchesPerTurn) {
      // Return structured error instead of throwing
      return {
        materials: [],
        totalFound: 0,
        searchParams: { query, courseId: null, maxResults },
        error: {
          code: 'TOOL_LIMIT_EXCEEDED',
          message: `You've already searched once this turn. Please continue the conversation and I can search again in your next message.`,
        },
      };
    }

    // ... existing logic

  } catch (error) {
    log.error({
      event: 'kb_search_error',
      query,
      courseId,
      error: error.message,
    }, 'Search failed');

    return {
      materials: [],
      totalFound: 0,
      searchParams: { query, courseId: null, maxResults },
      error: {
        code: 'SEARCH_ERROR',
        message: `Failed to search materials: ${error.message}`,
      },
    };
  }
}
```

**File:** `/lib/llm/tools/handlers.ts`
**Lines:** 82-91, add try/catch around L93-193

#### Step 2.4.2: Update handleKBFetch error handling
```typescript
// lib/llm/tools/handlers.ts

export async function handleKBFetch(params, context) {
  try {
    // Check tool usage limits (L224-233)
    const usage = getToolUsage(turnId);
    if (usage.fetches >= TOOL_LIMITS.maxFetchesPerTurn) {
      return {
        material: null,
        error: {
          code: 'TOOL_LIMIT_EXCEEDED',
          message: `You've already fetched one material this turn. Please continue the conversation and I can fetch again in your next message.`,
        },
      };
    }

    // ... existing logic

  } catch (error) {
    log.error({
      event: 'kb_fetch_error',
      materialId,
      error: error.message,
    }, 'Fetch failed');

    return {
      material: null,
      error: {
        code: 'FETCH_ERROR',
        message: `Failed to fetch material: ${error.message}`,
      },
    };
  }
}
```

**File:** `/lib/llm/tools/handlers.ts`
**Lines:** 224-233, add try/catch around L235-281

**Success Criteria:**
- ✅ Tool errors return structured objects
- ✅ Error messages user-friendly
- ✅ LLM can handle error responses gracefully
- ✅ Errors logged with context

---

### 2.5: Add Request Validation (30 min)

**Problem:** Message content not validated, could contain malicious input.

**Solution:** Add Zod schema validation.

#### Step 2.5.1: Create validation schemas
```typescript
// lib/models/validation.ts (NEW)

import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content too long (max 10,000 characters)'),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Too many messages (max 50)'),
  userId: z.string()
    .min(1, 'User ID is required')
    .max(100, 'User ID too long'),
  courseId: z.string()
    .max(100, 'Course ID too long')
    .optional(),
  conversationId: z.string()
    .max(100, 'Conversation ID too long')
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
```

**File:** `/lib/models/validation.ts` (NEW)

#### Step 2.5.2: Apply validation in API route
```typescript
// app/api/chat/route.ts

import { chatRequestSchema } from '@/lib/models/validation';
import { log } from '@/lib/utils/logger';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate request (REPLACE L46-58)
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');

      log.warn({
        event: 'validation_error',
        errors,
        body: JSON.stringify(body).substring(0, 200),
      }, 'Invalid request');

      return Response.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          message: errors,
        },
        { status: 400 }
      );
    }

    const { messages, userId, courseId, conversationId } = validationResult.data;

    // ... rest of function
  } catch (error) {
    // ...
  }
}
```

**File:** `/app/api/chat/route.ts`
**Lines:** Replace L46-58 with validation

**Success Criteria:**
- ✅ Invalid requests rejected with 400
- ✅ Clear error messages for validation failures
- ✅ Content length limits enforced
- ✅ XSS/injection risks mitigated

---

## Phase 3: Optional Enhancements

### 3.1: Add Monitoring and Performance Tracking (2 hours)

**Deferred:** Low priority for demo.

**Scope:**
- Add performance timing metrics
- Track token usage and costs
- Add Sentry error tracking
- Create dashboard for metrics

### 3.2: Create API Documentation (30 min)

**Solution:** Generate OpenAPI spec.

#### Step 3.2.1: Install dependencies
```bash
npm install --save-dev @apidevtools/swagger-cli
```

#### Step 3.2.2: Create OpenAPI spec
```yaml
# docs/openapi.yaml

openapi: 3.0.0
info:
  title: QuokkaQ AI Chat API
  version: 1.0.0
  description: Streaming AI chat with course material retrieval

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://quokkaq.vercel.app
    description: Production server

paths:
  /api/chat:
    post:
      summary: Streaming AI chat
      description: Stream AI responses with dynamic course material retrieval
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Streaming response
          content:
            text/event-stream:
              schema:
                type: string
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RateLimitError'
        '503':
          description: LLM unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    ChatRequest:
      type: object
      required:
        - messages
        - userId
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
          minItems: 1
          maxItems: 50
        userId:
          type: string
          minLength: 1
          maxLength: 100
        courseId:
          type: string
          maxLength: 100
        conversationId:
          type: string
          maxLength: 100

    Message:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum: [user, assistant]
        content:
          type: string
          minLength: 1
          maxLength: 10000

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
        message:
          type: string

    RateLimitError:
      allOf:
        - $ref: '#/components/schemas/ErrorResponse'
        - type: object
          properties:
            retryAfter:
              type: integer
              description: Seconds until rate limit resets
```

**File:** `/docs/openapi.yaml` (NEW)

---

## Testing Strategy

### Unit Tests

**Tool Handlers:**
- Test turn tracking with valid/invalid turn IDs
- Test usage limit enforcement
- Test error handling for missing materials
- Test structured error responses

**Rate Limiting:**
- Test within limit
- Test exceed limit
- Test reset after window
- Test different users

**Validation:**
- Test valid requests
- Test invalid messages (empty, too long, wrong role)
- Test invalid userId/courseId
- Test XSS attempts

### Integration Tests

**API Route:**
- Test full request flow with LLM
- Test fallback when LLM unavailable
- Test tool calling
- Test streaming response
- Test rate limiting
- Test error scenarios

### Manual Tests

**Browser Testing:**
1. Open Quokka chat modal
2. Send message with course context
3. Verify AI response with citations
4. Send 11 messages in 1 minute (test rate limit)
5. Check console for structured logs
6. Verify no API keys in Network tab

---

## Success Criteria

### Phase 1 (Critical)
- ✅ Tool turn tracking working correctly
- ✅ Rate limiting enforced
- ✅ Production deployment guide created

### Phase 2 (High Priority)
- ✅ LRU cache prevents memory leak
- ✅ Legacy provider code removed
- ✅ Structured logging implemented
- ✅ Tool errors handled gracefully
- ✅ Request validation prevents invalid input

### Phase 3 (Optional)
- ✅ API documentation generated
- ⏸ Monitoring deferred to production

---

## Timeline

| Phase | Task | Estimate | Total |
|-------|------|----------|-------|
| 1.1 | Fix tool turn tracking | 2h | 2h |
| 1.2 | Add rate limiting | 1h | 3h |
| 1.3 | Document migration path | 30m | 3.5h |
| 2.1 | LRU cache for tools | 30m | 4h |
| 2.2 | Remove legacy code | 30m | 4.5h |
| 2.3 | Structured logging | 1h | 5.5h |
| 2.4 | Tool error handling | 30m | 6h |
| 2.5 | Request validation | 30m | 6.5h |
| 3.1 | Monitoring (deferred) | - | 6.5h |
| 3.2 | API docs | 30m | 7h |

**Total: 7 hours (6.5h for critical + high priority)**

---

## Rollback Plan

If any phase fails:

1. **Stop immediately** - Don't continue to next phase
2. **Revert changes** - Use git to revert to last working state
3. **Investigate error** - Check logs, error messages, tests
4. **Fix issue** - Address root cause before continuing
5. **Re-test** - Verify fix works before moving forward

**Git Workflow:**
```bash
# Create branch for stability improvements
git checkout -b stability-improvements

# Commit after each phase
git add .
git commit -m "feat: [Phase X.Y] Description"

# If something breaks
git reset --hard HEAD~1  # Revert last commit
```

---

## Files Modified

### New Files
- `/lib/utils/rate-limit.ts` - Rate limiting utility
- `/lib/utils/logger.ts` - Structured logging
- `/lib/models/validation.ts` - Request validation schemas
- `/docs/production-deployment.md` - Deployment guide
- `/docs/openapi.yaml` - API documentation

### Modified Files
- `/app/api/chat/route.ts` - Add turn ID, rate limiting, validation, logging
- `/lib/llm/tools/handlers.ts` - Fix turn tracking, add error handling, LRU cache
- `/lib/llm/tools/index.ts` - Pass context to tool handlers
- `/lib/llm/ai-sdk-providers.ts` - Add structured logging
- `/lib/llm/index.ts` - Remove legacy provider exports

### Deleted Files
- `/lib/llm/BaseLLMProvider.ts` - Deprecated
- `/lib/llm/OpenAIProvider.ts` - Deprecated
- `/lib/llm/AnthropicProvider.ts` - Deprecated

---

## Post-Implementation Checklist

After completing all phases:

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Production build succeeds
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Git commits clean and descriptive
- [ ] CLAUDE.md updated with changes
- [ ] Production deployment plan reviewed
- [ ] Rollback plan tested

---

**END OF PLAN**

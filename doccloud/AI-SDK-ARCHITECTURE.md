# AI SDK Architecture

## Overview

This document explains the modern AI integration architecture using Vercel AI SDK, which replaced the legacy provider system during Phase 1 cleanup (October 2025).

## Current Architecture (AI SDK)

**Status:** ✅ Production (since Phase 1-8)

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/ai-sdk-providers.ts` | Provider factory using AI SDK | ~80 |
| `app/api/chat/route.ts` | Streaming chat endpoint | ~160 |
| `app/api/answer/route.ts` | Answer generation endpoint | ~140 |

### How It Works

**1. Provider Selection (`ai-sdk-providers.ts`)**

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export function getProvider() {
  const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai';

  switch (provider) {
    case 'openai': return openai('gpt-4o-mini');
    case 'anthropic': return anthropic('claude-3-5-sonnet-20241022');
    case 'google': return google('gemini-2.0-flash-exp');
  }
}
```

**2. Streaming Chat (`/api/chat`)**

```typescript
import { streamText } from 'ai';
import { getProvider } from '@/lib/ai-sdk-providers';

export async function POST(req: Request) {
  const { messages, conversationId, userId } = await req.json();

  // Build context with course materials
  const context = await buildConversationContext(conversationId);

  const result = streamText({
    model: getProvider(),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    tools: {
      kb_search: tool({ /* search course materials */ }),
      kb_fetch: tool({ /* fetch specific material */ }),
    },
  });

  return result.toDataStreamResponse();
}
```

**3. Client Integration (React Hooks)**

```typescript
// lib/api/hooks.ts
export function useSendMessage() {
  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      // Optimistic update - add user message immediately
      queryClient.setQueryData(['conversationMessages', input.conversationId],
        (old) => [...old, userMessage]
      );

      // Call API endpoint
      await sendMessage(input);
    },
    onSuccess: (_, variables) => {
      // Invalidate to refetch with AI response
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', variables.conversationId]
      });
    }
  });
}
```

### Key Features

1. **Provider-Agnostic**: Switch between OpenAI, Anthropic, Google via env var
2. **Streaming**: Real-time token streaming for better UX
3. **Tool Use**: `kb_search` and `kb_fetch` for course material retrieval
4. **Citations**: Automatic citation parsing from tool results
5. **Fallback**: Template-based responses when no API keys configured

### Environment Setup

```bash
# .env.local (optional - falls back to templates without)
NEXT_PUBLIC_LLM_PROVIDER=openai  # or anthropic, google
NEXT_PUBLIC_USE_LLM=true

# API Keys (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## Legacy Architecture (Removed)

**Status:** ❌ Deleted in Phase 1 (October 2025)

### What Was Removed

**Files Deleted (945 lines total):**

1. **lib/llm/BaseLLMProvider.ts** (-255 lines)
   - Abstract base class for LLM providers
   - Rate limiting, retry logic, cost tracking
   - Error handling and timeout management

2. **lib/llm/OpenAIProvider.ts** (-171 lines)
   - OpenAI-specific implementation
   - Manual HTTP calls to OpenAI API
   - Custom token counting

3. **lib/llm/AnthropicProvider.ts** (-214 lines)
   - Anthropic-specific implementation
   - Manual streaming logic
   - Custom message formatting

4. **lib/llm/grounding/** (-150 lines)
   - GroundingVerifier.ts - Citation verification
   - Never integrated into production

**Why It Was Removed:**

1. **Never Used**: Production routes exclusively used AI SDK
2. **Redundant**: AI SDK provides all functionality (streaming, tools, retries)
3. **Maintenance Burden**: Duplicate error handling, rate limiting, cost tracking
4. **Migration Complete**: Phase 1-8 had already migrated all features to AI SDK

### Migration Timeline

- **Phase 1-3**: Initial AI SDK integration for basic chat
- **Phase 4-6**: Added tool use (kb_search, kb_fetch)
- **Phase 7**: Citation parsing and display
- **Phase 8**: React Query optimization (removed polling)
- **Phase 9 Cleanup**: Removed legacy provider classes

## Context Building

**Location:** `lib/context/`

### Course-Specific Context

```typescript
// lib/context/CourseContextBuilder.ts
export class CourseContextBuilder {
  async buildContext(courseId: string, query: string) {
    // 1. Load course materials
    const materials = await loadCourseMaterials(courseId);

    // 2. Hybrid retrieval (BM25 + embeddings)
    const results = await this.retriever.search(query, {
      topK: 8,
      minScore: 0.3
    });

    // 3. Format for LLM prompt
    return {
      materials: results,
      metadata: { courseId, timestamp: new Date() }
    };
  }
}
```

### Multi-Course Context

```typescript
// lib/context/MultiCourseContextBuilder.ts
export class MultiCourseContextBuilder {
  async buildContext(query: string) {
    // 1. Detect relevant courses from query keywords
    const courses = this.detectCourses(query);

    // 2. Search across detected courses
    const results = await Promise.all(
      courses.map(c => this.courseBuilder.buildContext(c.id, query))
    );

    // 3. Merge and rank results
    return this.mergeResults(results);
  }
}
```

## Retrieval System

**Location:** `lib/retrieval/`

### Hybrid Retrieval (BM25 + Embeddings)

```typescript
// lib/retrieval/HybridRetriever.ts
export class HybridRetriever {
  async search(query: string, options: SearchOptions) {
    // 1. BM25 keyword search
    const bm25Results = this.bm25.search(query, options.topK * 2);

    // 2. Embedding-based semantic search
    const embeddingResults = await this.embeddings.search(query, options.topK * 2);

    // 3. RRF (Reciprocal Rank Fusion)
    const merged = this.fusionRanker.merge(bm25Results, embeddingResults);

    // 4. MMR (Maximal Marginal Relevance) diversification
    return this.diversify(merged, options.topK);
  }
}
```

### Features

- **BM25**: Statistical keyword matching (fast, exact matches)
- **Embeddings**: Semantic similarity (understands meaning)
- **RRF Fusion**: Combines both approaches with weighted ranking
- **MMR Diversification**: Reduces redundancy in results

## Performance Optimizations

### Phase 8: React Query Optimization (October 2025)

**Problem:** Excessive polling causing 720 requests/hour per conversation

**Solution:**

1. **Removed Polling**
   ```typescript
   // ❌ OLD
   useConversationMessages(id, { refetchInterval: 5000 })

   // ✅ NEW
   useConversationMessages(id) // No polling
   ```

2. **Surgical Invalidation**
   ```typescript
   // Added userId to sendMessage signature
   await sendMessage({ userId, conversationId, content });

   // Targeted invalidation
   queryClient.invalidateQueries({
     queryKey: ['aiConversations', userId]
   });
   ```

3. **Optimistic Updates**
   ```typescript
   // User message appears instantly
   queryClient.setQueryData(['conversationMessages', id],
     (old) => [...old, userMessage]
   );
   ```

**Results:**
- 89% reduction in API calls
- Instant UI feedback
- Maintained cache consistency

## Future Improvements

### Potential Enhancements

1. **Self-RAG Adaptive Routing** (~550 lines in `lib/retrieval/adaptive/`)
   - Currently disabled via feature flag
   - Decision needed: wire up or remove

2. **Prompt Templates** (~280 lines in `lib/llm/prompts/templates/`)
   - CS, Math, General templates defined but unused
   - Decision needed: implement course detection or remove

3. **Hierarchical Retrieval** (`lib/retrieval/hierarchical/`)
   - Status unknown
   - Needs investigation

4. **Response Streaming UI**
   - Current implementation buffers full response
   - Could add token-by-token streaming with `useChat` hook

5. **Tool Use Visualization**
   - Show when AI is searching course materials
   - Display search queries and results in real-time

## Testing

### Manual Verification

```bash
# 1. Start dev server
npm run dev

# 2. Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is binary search?"}],
    "conversationId": "test-123",
    "userId": "user-1"
  }'

# 3. Test answer endpoint
curl -X POST http://localhost:3000/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain quicksort",
    "courseId": "cs101"
  }'
```

### Production Build

```bash
npm run build
npm start
```

## Related Documentation

- **Phase 1 Audit Report**: `doccloud/tasks/ai-agent-verification/PHASE-1-AUDIT.md`
- **Quokka Design System**: `QDS.md`
- **Main Project Guide**: `CLAUDE.md`
- **LLM Integration**: `CLAUDE.md` (section: LLM Integration Architecture)

---

**Last Updated:** 2025-10-19
**Maintainer:** AI Service Team
**Status:** Production (AI SDK) | Legacy (Removed)

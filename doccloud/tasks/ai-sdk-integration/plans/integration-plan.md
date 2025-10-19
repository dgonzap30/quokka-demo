# AI SDK v5 Integration Plan

## Overview

This plan outlines the step-by-step process for integrating Vercel AI SDK v5 into QuokkaQ, replacing custom LLM provider implementations with production-grade abstractions while maintaining backward compatibility and existing functionality.

## Prerequisites

- [x] Research AI SDK v5 documentation completed
- [x] Context document created (`context.md`)
- [ ] Backup current implementation (git branch)
- [ ] Install required packages
- [ ] Configure environment variables

## Phase 1: Foundation (AI SDK Core) - 2-3 days

**Goal**: Replace custom providers with AI SDK Core without changing UI

### Step 1.1: Package Installation & Setup

**Files to modify**: `package.json`, `.env.local.example`

```bash
# Install core packages
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod

# Verify installation
npx tsc --noEmit
npm run lint
```

**Success criteria**:
- Packages installed without peer dependency conflicts
- TypeScript compiles successfully
- No lint errors introduced

### Step 1.2: Create AI SDK Provider Registry

**New file**: `lib/llm/providers.ts`

```typescript
// Replace custom factory with AI SDK providers
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getEnvConfig, isLLMEnabled } from '@/lib/utils/env';

export function createAISDKProvider() {
  // Factory for AI SDK providers
  // Returns configured model instance
}

export function getAISDKModel() {
  // Singleton pattern for model instance
  // Replaces getLLMProvider()
}
```

**Tasks**:
1. Create provider registry with factory pattern
2. Add environment variable detection
3. Implement fallback chain (primary → secondary → template)
4. Add model configuration (temperature, maxTokens, etc.)
5. Export unified model interface

**Success criteria**:
- Can instantiate OpenAI, Anthropic, Google models
- Fallback to template system when no API keys configured
- TypeScript types match existing `LLMProvider` interface

### Step 1.3: Create Route Handler for Chat

**New file**: `app/api/chat/route.ts`

```typescript
import { streamText, convertToModelMessages } from 'ai';
import { getAISDKModel } from '@/lib/llm/providers';
import { buildCourseContext } from '@/lib/context';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, conversationId, userId, courseId } = await req.json();

  // Build course context
  const context = courseId
    ? await buildCourseContext(...)
    : null;

  // Generate response with streaming
  const result = streamText({
    model: getAISDKModel(),
    system: buildSystemPrompt(context),
    messages: convertToModelMessages(messages),
    temperature: 0.7,
    maxTokens: 1000,
  });

  return result.toDataStreamResponse();
}
```

**Tasks**:
1. Create POST handler with Next.js App Router pattern
2. Parse request body (messages, conversationId, userId, courseId)
3. Load course context using existing builders
4. Build system prompt with course materials
5. Stream response using `streamText()`
6. Return `toDataStreamResponse()` for client consumption
7. Add error handling with fallback to template system
8. Implement request validation

**Success criteria**:
- Route handler responds to POST requests
- Streaming works in development
- Course context properly injected
- Errors return structured responses
- TypeScript types are correct

### Step 1.4: Create Route Handler for AI Answers

**New file**: `app/api/answer/route.ts`

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAISDKModel } from '@/lib/llm/providers';

const AIAnswerSchema = z.object({
  content: z.string(),
  confidence: z.object({
    level: z.enum(['low', 'medium', 'high']),
    score: z.number().min(0).max(100),
  }),
  citations: z.array(z.object({
    source: z.string(),
    sourceType: z.enum(['lecture', 'textbook', 'slides', 'lab', 'assignment', 'reading']),
    excerpt: z.string(),
    relevance: z.number(),
  })),
});

export async function POST(req: Request) {
  // Generate structured AI answer with citations
  const result = await generateObject({
    model: getAISDKModel(),
    schema: AIAnswerSchema,
    prompt: buildAnswerPrompt(...),
  });

  return Response.json(result.object);
}
```

**Tasks**:
1. Create POST handler for AI answer generation
2. Define Zod schema for structured output
3. Use `generateObject()` for type-safe citations
4. Build prompt with question + course context
5. Return structured JSON response
6. Add confidence scoring logic
7. Handle validation errors gracefully

**Success criteria**:
- Returns structured JSON matching `AIAnswer` type
- Citations properly formatted with relevance scores
- Confidence levels calculated correctly
- Zod schema validation catches malformed responses
- Falls back to template system on errors

### Step 1.5: Update Mock API Client

**File to modify**: `lib/api/client.ts:2261-2354` (sendMessage function)

**Tasks**:
1. Update `sendMessage()` to call `/api/chat` route
2. Keep fallback to template system
3. Parse streamed response chunks
4. Update conversation in localStorage
5. Maintain existing return type signature
6. Add error handling for stream failures

**Changes**:
```typescript
// OLD: Direct LLM provider call
const llmProvider = getLLMProvider();
const llmResponse = await llmProvider.generate({...});

// NEW: AI SDK route handler
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [...conversationHistory, { role: 'user', content: input.content }],
    conversationId: input.conversationId,
    userId: input.userId,
    courseId: conversation.courseId,
  }),
});

const reader = response.body?.getReader();
// Stream processing...
```

**Success criteria**:
- `sendMessage()` works with new route handler
- Template fallback still functional
- No breaking changes to return type
- Existing tests pass (if any)
- Error handling preserves user experience

## Phase 2: UI Integration (AI SDK UI) - 2-3 days

**Goal**: Replace custom conversation UI with `useChat` hook for streaming

### Step 2.1: Install AI SDK React

```bash
npm install @ai-sdk/react
```

### Step 2.2: Integrate useChat in Quokka Assistant Modal

**File to modify**: `components/ai/quokka-assistant-modal.tsx`

**Tasks**:
1. Import `useChat` from `@ai-sdk/react`
2. Replace manual message state with `useChat` state
3. Configure `useChat` with `/api/chat` endpoint
4. Pass conversationId, userId, courseId in body
5. Use `isLoading` for loading state
6. Use `messages` for message history
7. Use `handleSubmit` for form submission
8. Handle streaming UI updates automatically
9. Maintain localStorage persistence for conversation history
10. Test optimistic updates work correctly

**Changes**:
```typescript
// OLD: Manual state + React Query mutation
const [messages, setMessages] = useState<AIMessage[]>([]);
const sendMessage = useSendMessage();

// NEW: AI SDK useChat hook
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: {
    conversationId: activeConversationId,
    userId: user.id,
    courseId: courseId,
  },
  initialMessages: existingMessages, // From localStorage
  onFinish: (message) => {
    // Save to localStorage
    // Invalidate React Query cache
  },
});
```

**Success criteria**:
- Streaming works in real-time
- Messages display progressively
- Loading states show correctly
- Conversation persists to localStorage
- React Query cache invalidates properly
- No visual regressions

### Step 2.3: Update React Query Hooks

**File to modify**: `lib/api/hooks.ts:908-964`

**Tasks**:
1. Keep `useSendMessage` for backward compatibility
2. Add new hook `useAIChatStream()` wrapping `useChat`
3. Maintain surgical cache invalidations
4. Preserve optimistic update patterns
5. Update documentation comments

**Success criteria**:
- Both hooks coexist without conflicts
- Existing code using `useSendMessage` still works
- New code can use `useAIChatStream` for streaming
- Cache invalidations trigger correctly
- No performance regressions

## Phase 3: Advanced Features - 2-3 days

**Goal**: Add tool calling and structured outputs

### Step 3.1: Implement Course Material Search Tool

**New file**: `lib/llm/tools/course-materials.ts`

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { api } from '@/lib/api/client';

export const searchCourseMaterialsTool = tool({
  description: 'Search course materials by keywords to find relevant lectures, readings, and assignments',
  inputSchema: z.object({
    courseId: z.string(),
    query: z.string().min(3),
    limit: z.number().default(5),
  }),
  execute: async ({ courseId, query, limit }) => {
    const results = await api.searchCourseMaterials({
      courseId,
      query,
      limit,
    });
    return results.map(r => ({
      title: r.material.title,
      type: r.material.type,
      excerpt: r.snippet,
      relevance: r.relevanceScore,
    }));
  },
});
```

**Tasks**:
1. Define tool with Zod schema
2. Implement execute function using existing API
3. Add tool to route handlers
4. Test multi-step tool calls
5. Add error handling for tool failures
6. Document tool usage patterns

**Success criteria**:
- AI can autonomously search materials when needed
- Tool calls appear in conversation history
- Results improve AI answer quality
- No infinite loops or excessive tool calls
- Performance acceptable (<2s per tool call)

### Step 3.2: Add Citation Generation with generateObject

**New file**: `lib/llm/schemas/citation.ts`

```typescript
import { z } from 'zod';

export const CitationSchema = z.object({
  id: z.string(),
  sourceType: z.enum(['lecture', 'textbook', 'slides', 'lab', 'assignment', 'reading']),
  source: z.string(),
  excerpt: z.string(),
  relevance: z.number().min(0).max(100),
  link: z.string().optional(),
});

export const AIAnswerWithCitationsSchema = z.object({
  content: z.string(),
  confidence: z.object({
    level: z.enum(['low', 'medium', 'high']),
    score: z.number().min(0).max(100),
  }),
  citations: z.array(CitationSchema),
});
```

**Tasks**:
1. Create Zod schemas for citations
2. Update `/api/answer` route to use `generateObject`
3. Map schema output to existing `AIAnswer` type
4. Add validation error handling
5. Test with various question types

**Success criteria**:
- Citations properly structured and typed
- Confidence scores realistic
- Schema validation catches errors
- Performance comparable to current implementation
- Citations improve with course context

### Step 3.3: Implement stopWhen for Multi-Step Reasoning

**File to modify**: `app/api/chat/route.ts`

**Tasks**:
1. Import `stopWhen`, `stepCountIs` from AI SDK
2. Configure multi-step tool calls
3. Limit to 5 steps to prevent loops
4. Log intermediate steps for debugging
5. Test complex queries requiring multiple tools

**Changes**:
```typescript
const result = streamText({
  model: getAISDKModel(),
  tools: {
    searchCourseMaterials: searchCourseMaterialsTool,
    // Add more tools as needed
  },
  stopWhen: stepCountIs(5), // Max 5 tool calls
  system: buildSystemPrompt(context),
  messages: convertToModelMessages(messages),
});
```

**Success criteria**:
- AI can chain multiple tool calls
- Step limit prevents infinite loops
- Intermediate steps visible in conversation
- Performance acceptable (<10s for complex queries)
- User experience remains smooth

## Phase 4: Testing & Refinement - 2-3 days

**Goal**: Ensure production readiness and no regressions

### Step 4.1: Manual Testing Checklist

**Test Cases**:
- [ ] Quokka Assistant Modal opens and loads
- [ ] Conversation starts successfully
- [ ] Messages stream in real-time (character by character)
- [ ] Course context correctly injected (single course)
- [ ] Multi-course context works (no specific course)
- [ ] Citations generated and displayed
- [ ] Tool calls execute successfully
- [ ] Conversation persists to localStorage
- [ ] React Query cache invalidates properly
- [ ] Loading states display correctly
- [ ] Error handling works (no API keys)
- [ ] Template fallback system functional
- [ ] All existing features still work
- [ ] No console errors in dev mode
- [ ] No console errors in production build
- [ ] Performance acceptable (<2s first response)
- [ ] Bundle size within limits (<200KB per route)

### Step 4.2: Type Safety Validation

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Run linter
npm run lint

# Check for unused imports
npx eslint . --ext .ts,.tsx
```

**Success criteria**:
- Zero TypeScript errors
- Zero ESLint errors
- No unused AI SDK imports
- All types properly inferred

### Step 4.3: Performance Benchmarking

**Metrics to measure**:
1. **First response time** (user sends message → AI starts streaming)
   - Target: <2 seconds
   - Current baseline: ~800-1200ms
2. **Time to complete** (streaming starts → message complete)
   - Target: <5 seconds for typical response
3. **Bundle size** (route code + dependencies)
   - Target: <200KB per route
   - Current: ~150KB
4. **Cache invalidation time** (message complete → UI updated)
   - Target: <100ms

**Tools**:
- Chrome DevTools Performance tab
- Lighthouse for bundle analysis
- React DevTools Profiler

**Success criteria**:
- No performance regressions >10%
- Streaming improves perceived performance
- Bundle size increase <30KB

### Step 4.4: Documentation Updates

**Files to update**:
- `CLAUDE.md` - Update LLM integration section
- `README.md` - Add AI SDK setup instructions
- `.env.local.example` - Add example configuration
- `doccloud/tasks/ai-sdk-integration/README.md` - Final summary

**Success criteria**:
- Setup instructions accurate and complete
- Architecture diagrams updated
- Code examples reflect new patterns
- Migration guide available for future developers

## Phase 5: Deployment & Monitoring - 1 day

**Goal**: Deploy to production with monitoring and rollback plan

### Step 5.1: Pre-Deployment Checklist

- [ ] All tests passing
- [ ] TypeScript compiles cleanly
- [ ] Lint passes
- [ ] Bundle size within limits
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables documented
- [ ] Rollback plan documented
- [ ] Team review completed
- [ ] Backup of current implementation created

### Step 5.2: Staged Rollout

**Stage 1: Dev Environment**
- Deploy to local development
- Test all features manually
- Verify streaming works
- Check error handling

**Stage 2: Staging Environment** (if available)
- Deploy to staging
- Run smoke tests
- Check performance metrics
- Verify integrations

**Stage 3: Production** (feature flag if possible)
- Deploy to production
- Monitor error rates
- Watch performance metrics
- Collect user feedback

### Step 5.3: Monitoring & Alerts

**Key metrics to monitor**:
1. API error rates (should be <1%)
2. Average response time (should be <2s)
3. Stream failures (should be <5%)
4. Cache hit rates (should remain >80%)
5. User engagement (messages per session)

**Success criteria**:
- Error rates below thresholds
- Performance within targets
- No user complaints
- Positive feedback on streaming UX

## Rollback Triggers

**Immediate rollback if**:
- Error rate >5% for 10+ minutes
- Critical feature completely broken
- Security vulnerability discovered
- Performance degradation >50%

**Rollback procedure**:
1. Revert to previous git commit
2. Run `npm install` to restore packages
3. Clear Next.js cache (`rm -rf .next`)
4. Restart development server
5. Verify functionality restored
6. Post-mortem analysis

## Success Criteria Summary

**Integration is successful when**:
- ✅ All existing functionality preserved (no breaking changes)
- ✅ Streaming works in both dev and production
- ✅ Custom providers replaced with AI SDK
- ✅ Tool calling functional and useful
- ✅ Structured outputs improve citation quality
- ✅ Template fallback system remains intact
- ✅ React Query patterns maintained
- ✅ TypeScript types pass
- ✅ Lint clean
- ✅ Bundle size <200KB per route
- ✅ Performance within 10% of baseline
- ✅ Documentation updated
- ✅ Team trained on new patterns

## Estimated Timeline

- **Phase 1: Foundation** - 2-3 days
- **Phase 2: UI Integration** - 2-3 days
- **Phase 3: Advanced Features** - 2-3 days
- **Phase 4: Testing & Refinement** - 2-3 days
- **Phase 5: Deployment & Monitoring** - 1 day

**Total: 9-13 days** (approximately 2 weeks)

## Next Steps

1. **Confirm plan with team** - Review and approve integration strategy
2. **Create feature branch** - `feature/ai-sdk-integration`
3. **Begin Phase 1** - Install packages and create provider registry
4. **Daily standups** - Track progress, identify blockers
5. **Continuous documentation** - Update `context.md` with decisions and findings

## Open Questions

1. **Provider preference**: Should we default to OpenAI or Anthropic? (Decision: Use env config)
2. **Tool call limits**: What's the max number of tool calls per message? (Decision: 5)
3. **Streaming UI**: Should we show "thinking..." during tool calls? (Decision: Yes)
4. **Error display**: How to show tool call errors to users? (Decision: Inline message)
5. **Cost tracking**: Do we need to track token usage? (Decision: Not in Phase 1)

---

**Plan Status**: ✅ Ready for approval

**Created**: 2025-10-17
**Last Updated**: 2025-10-17
**Owner**: AI Development Team
**Reviewer**: TBD

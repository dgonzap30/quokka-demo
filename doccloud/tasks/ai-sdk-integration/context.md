# AI SDK v5 Integration - Context Document

## Goal

Seamlessly integrate Vercel AI SDK v5 into QuokkaQ to modernize the LLM integration layer, improve developer experience, enable real-time streaming responses, and simplify maintenance by replacing custom provider implementations with battle-tested abstractions.

## In-Scope

### Core Features
- **AI SDK Core Integration**
  - Replace custom `BaseLLMProvider`, `OpenAIProvider`, `AnthropicProvider` with AI SDK providers
  - Migrate from manual fetch calls to `generateText` and `streamText`
  - Implement `generateObject` for structured outputs (citations, confidence scores)
  - Add tool calling for course material search and context retrieval

- **AI SDK UI Integration**
  - Replace custom conversation system with `useChat` hook
  - Enable real-time streaming responses in Quokka Assistant Modal
  - Implement optimistic UI updates with built-in React hooks
  - Maintain conversation persistence with localStorage

- **Route Handlers**
  - Create `/api/chat/route.ts` for Quokka Assistant Modal conversations
  - Create `/api/answer/route.ts` for thread AI answer generation
  - Implement proper streaming with `toDataStreamResponse()`
  - Add middleware for course context injection

- **Backward Compatibility**
  - Keep template fallback system for `.env.local` not configured
  - Preserve existing React Query hooks and cache invalidation patterns
  - Maintain all existing API contracts in `lib/api/client.ts`
  - No breaking changes to UI components

### Components to Modify
- `lib/llm/` - Replace custom providers with AI SDK providers
- `lib/api/client.ts` - Update `sendMessage()` to use AI SDK route
- `lib/api/hooks.ts` - Integrate `useChat` in `useSendMessage()`
- `components/ai/quokka-assistant-modal.tsx` - Use AI SDK UI hooks
- `app/api/chat/route.ts` - New route handler for conversations
- `app/api/answer/route.ts` - New route handler for AI answer generation

## Out-of-Scope

- AI SDK RSC (experimental, not production-ready)
- Real-time WebSocket connections (beyond streaming)
- Multi-modal inputs (images, audio)
- Custom model fine-tuning
- Backend database integration (still mock API)
- Changes to authentication/authorization
- Migration away from React Query (keep existing pattern)

## Done When

- [x] Research completed and plan documented
- [ ] AI SDK packages installed (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- [ ] Route handlers created and tested (`/api/chat`, `/api/answer`)
- [ ] Custom providers replaced with AI SDK providers
- [ ] `useChat` hook integrated in conversation system
- [ ] Streaming responses working in Quokka Assistant Modal
- [ ] Tool calling implemented for course material search
- [ ] `generateObject` used for structured citation generation
- [ ] Template fallback system preserved
- [ ] All existing React Query hooks still functional
- [ ] TypeScript types pass (`npx tsc --noEmit`)
- [ ] Lint clean (`npm run lint`)
- [ ] All routes render without console errors in prod build
- [ ] Conversation persistence still works with localStorage
- [ ] Performance regression test (no slower than current implementation)
- [ ] Documentation updated (CLAUDE.md, README)

## Constraints

### Technical
- **Frontend-Only**: No backend database, all state in mock API + localStorage
- **Type Safety**: Maintain TypeScript strict mode compliance
- **React Query**: Keep existing React Query patterns for cache management
- **QDS Compliance**: Follow Quokka Design System for any UI changes
- **Accessibility**: Maintain WCAG 2.2 AA compliance
- **Performance**: Bundle size must stay <200KB per route

### Architectural
- **Gradual Migration**: Phase rollout to minimize risk
  - Phase 1: AI SDK Core only (no UI changes)
  - Phase 2: AI SDK UI for new features
  - Phase 3: Migrate existing features incrementally
- **Fallback Support**: Template system must remain functional
- **API Stability**: No breaking changes to `lib/api/client.ts` contracts
- **Provider Flexibility**: Support OpenAI, Anthropic, Google via AI SDK

### Testing
- Manual testing required for all conversation flows
- Verify streaming in dev and production builds
- Test with and without `.env.local` configuration
- Check cache invalidation patterns remain functional
- Validate localStorage persistence across sessions

## Decisions

### 2025-10-17 | Provider Architecture
- **Decision**: Use AI SDK provider registry pattern instead of custom singleton
- **Rationale**: AI SDK handles provider initialization, retry logic, and error handling better than our custom implementation
- **File Path**: `lib/llm/providers.ts` (new)

### 2025-10-17 | Streaming Strategy
- **Decision**: Use `streamText` with `toDataStreamResponse()` for all AI interactions
- **Rationale**: Better UX with real-time responses, standard pattern in AI SDK
- **File Path**: `app/api/chat/route.ts`, `app/api/answer/route.ts`

### 2025-10-17 | Tool Calling for Course Materials
- **Decision**: Implement `searchCourseMaterials` tool with Zod schema validation
- **Rationale**: AI can autonomously search materials when needed, reducing context size
- **File Path**: `lib/llm/tools/course-materials.ts` (new)

### 2025-10-17 | Structured Output for Citations
- **Decision**: Use `generateObject` with Zod schema for citation generation
- **Rationale**: Type-safe structured output, better validation than string parsing
- **File Path**: `lib/llm/schemas/citation.ts` (new)

### 2025-10-17 | Hook Integration Strategy
- **Decision**: Wrap AI SDK's `useChat` inside existing `useSendMessage` mutation
- **Rationale**: Preserve React Query patterns, maintain cache invalidation logic
- **File Path**: `lib/api/hooks.ts:908-964`

### 2025-10-17 | Conversation Persistence
- **Decision**: Continue using localStorage for conversation history, pass to AI SDK as initial messages
- **Rationale**: No backend available, AI SDK supports pre-populating conversation history
- **File Path**: `lib/store/localStore.ts` (existing)

## Risks

### High Risk
1. **Breaking Changes**
   - **Risk**: Accidental API contract changes breaking existing UI components
   - **Mitigation**: Comprehensive integration tests, gradual rollout
   - **Rollback**: Git revert to previous commit

2. **Performance Degradation**
   - **Risk**: AI SDK adds overhead, slows down response times
   - **Mitigation**: Benchmark before/after, use streaming to improve perceived performance
   - **Rollback**: Keep custom providers as fallback option

3. **Streaming Compatibility**
   - **Risk**: Streaming may not work in all deployment environments (Vercel, self-hosted)
   - **Mitigation**: Test in production-like environment, provide non-streaming fallback
   - **Rollback**: Disable streaming, use synchronous `generateText`

### Medium Risk
1. **Token Budget Exceeded**
   - **Risk**: Tool calling increases context size, exceeds model limits
   - **Mitigation**: Implement token counting, limit tool call depth
   - **Rollback**: Disable tool calling, use context builders only

2. **Cache Invalidation Issues**
   - **Risk**: AI SDK streaming may not trigger React Query invalidations correctly
   - **Mitigation**: Manual invalidation after stream completes, test thoroughly
   - **Rollback**: Return to synchronous pattern

3. **Provider Compatibility**
   - **Risk**: Not all providers support all AI SDK features (tool calling, streaming)
   - **Mitigation**: Feature detection, graceful degradation
   - **Rollback**: Use lowest common denominator features

### Low Risk
1. **Learning Curve**
   - **Risk**: Team unfamiliar with AI SDK patterns
   - **Mitigation**: Comprehensive documentation, code examples in doccloud/
   - **Rollback**: N/A (documentation issue)

2. **Bundle Size Increase**
   - **Risk**: AI SDK packages increase bundle size beyond 200KB limit
   - **Mitigation**: Tree-shaking, code splitting, lazy loading
   - **Rollback**: Remove unused AI SDK packages

## Rollback Plan

### Immediate Rollback (< 1 hour)
1. `git revert <commit-hash>` - Undo AI SDK integration
2. `npm install` - Restore package-lock.json
3. `rm -rf .next && npm run dev` - Clear cache
4. Verify custom providers still functional
5. Test critical flows (login, conversations, thread creation)

### Partial Rollback (Keep AI SDK Core, Remove UI)
1. Revert changes to `lib/api/hooks.ts`
2. Revert changes to `components/ai/quokka-assistant-modal.tsx`
3. Keep new route handlers but disable streaming
4. Use custom providers with AI SDK as optional enhancement

### Data Recovery
- **Conversations**: Backed up in localStorage, no data loss
- **Threads**: Mock data in memory, reseed if needed
- **Cache**: React Query cache rebuilds automatically

## Related Files

### Current Implementation
- `lib/llm/BaseLLMProvider.ts` - Abstract base class for providers
- `lib/llm/OpenAIProvider.ts` - OpenAI implementation with fetch
- `lib/llm/AnthropicProvider.ts` - Anthropic implementation with fetch
- `lib/llm/index.ts` - Provider factory and singleton
- `lib/api/client.ts:2261-2354` - sendMessage implementation
- `lib/api/hooks.ts:908-964` - useSendMessage mutation
- `components/ai/quokka-assistant-modal.tsx` - Conversation UI

### Context Builders
- `lib/context/index.ts` - Public API for context building
- `lib/context/CourseContextBuilder.ts` - Single course context
- `lib/context/MultiCourseContextBuilder.ts` - Multi-course context

### Mock API
- `lib/api/client.ts` - All API methods (stable contracts)
- `lib/store/localStore.ts` - localStorage persistence

## Next Tasks

After this integration is complete, consider:
1. **Phase 2: Advanced Tool Calling** - Add tools for thread search, user lookup
2. **Phase 3: Optimistic Updates** - Use AI SDK's built-in optimistic UI patterns
3. **Phase 4: Multi-Step Reasoning** - Implement `stopWhen` for complex queries
4. **Phase 5: Google Gemini Support** - Add @ai-sdk/google provider
5. **Phase 6: Streaming UI Components** - Explore AI SDK RSC when stable

## Changelog

- `2025-10-17` | [Research] | Completed AI SDK v5 research, documented findings
- `2025-10-17` | [Planning] | Created context.md, defined scope and constraints
- `2025-10-17` | [Decisions] | Documented key architectural decisions
- `2025-10-17` | [Phase 1] | Installed AI SDK packages (ai, @ai-sdk/react, @ai-sdk/openai, @ai-sdk/anthropic, zod)
- `2025-10-17` | [Phase 1] | Created AI SDK provider registry (lib/llm/ai-sdk-providers.ts)
- `2025-10-17` | [Phase 1] | Created /api/chat route handler with streaming support
- `2025-10-17` | [Phase 1] | Created /api/answer route handler with generateObject for structured citations
- `2025-10-17` | [Phase 1] | Created Zod schemas for citations (lib/llm/schemas/citation.ts)
- `2025-10-17` | [Phase 1] | Updated lib/api/client.ts sendMessage() to use AI SDK /api/chat route
- `2025-10-17` | [Phase 1] | ✅ **Phase 1 COMPLETE** - Backend streaming integration functional
- `2025-10-17` | [Phase 2] | **DEFERRED** - useChat hook API incompatible with current architecture, needs research
- `2025-10-17` | [Note] | Backend streams responses via toTextStreamResponse(), client accumulates before display
- `2025-10-17` | [Note] | Real-time streaming UI requires custom ReadableStream consumer or alternative hook pattern

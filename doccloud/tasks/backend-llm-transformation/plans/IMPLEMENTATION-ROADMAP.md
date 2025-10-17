# Backend LLM Transformation - Implementation Roadmap

**Created:** 2025-10-16
**Status:** Ready for Implementation
**Estimated Duration:** 40 hours (8-phase rollout)

---

## Executive Summary

### Agent Planning Results

All three specialized agents have completed comprehensive planning:

1. **Mock API Designer** ✅
   - 23 existing API methods audited
   - 48 new TypeScript types designed
   - 6 new API methods specified
   - 6 new React Query hooks planned
   - Zero breaking changes confirmed

2. **Type Safety Guardian** ✅
   - Current codebase: Zero `any` types found (excellent!)
   - Only 1 breaking change needed: `Message.timestamp` Date → string
   - 48 new types with discriminated unions and type guards
   - Single-file extension strategy maintains consistency

3. **Integration Readiness Checker** ✅
   - Readiness Score: **8.5/10** (excellent foundation)
   - 36 API methods ready for swap
   - 27 React Query hooks with proper patterns
   - 39KB of course materials ready for RAG
   - 8-phase migration plan with rollback strategies

### Consolidated Findings

✅ **Strengths:**
- Excellent API abstraction layer already in place
- Zero breaking changes to public API
- Course materials infrastructure ready (`getCourseMaterials`, `searchCourseMaterials`)
- Type system is exemplary (zero `any`, proper guards)
- React Query patterns are production-ready
- Mock data quality is excellent for LLM context

⚠️ **Challenges:**
- Template system must be replaced (CS_TEMPLATES, MATH_TEMPLATES)
- LLM latency 2-3x slower than mock (800ms → 1500-3000ms)
- Need rate limit handling and provider fallback
- Client-side API keys are demo-only (security warning needed)

---

## Implementation Phases

### Phase 1: Environment Setup (2 hours)

**Goal:** Configure environment for LLM integration

**Tasks:**
1. Create `.env.local.example` with template
2. Add environment variables:
   ```bash
   NEXT_PUBLIC_USE_LLM=false
   NEXT_PUBLIC_LLM_PROVIDER=openai
   NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key_here
   NEXT_PUBLIC_MAX_TOKENS=2000
   NEXT_PUBLIC_LLM_TEMPERATURE=0.7
   ```
3. Create `lib/utils/env.ts` for typed environment access
4. Add validation on startup
5. Update `.gitignore` to exclude `.env.local`

**Deliverables:**
- `lib/utils/env.ts`
- `.env.local.example`
- Updated README with setup instructions

**Validation:**
- Environment variables load correctly
- TypeScript autocomplete works for env values
- Missing keys throw helpful errors

---

### Phase 2: Type System Extension (2 hours)

**Goal:** Add all new TypeScript types to support LLM integration

**Tasks:**
1. Add **Conversation Types** to `lib/models/types.ts`:
   - `AIConversation`, `AIMessage`, `ConversationSession`
   - `CreateConversationInput`, `SendMessageInput`
   - `ConversationToThreadInput`, `ConversationToThreadResult`

2. Add **LLM Provider Types**:
   - `LLMProvider` interface, `LLMConfig`, `LLMRequest`
   - `LLMResponse` (discriminated union: success | error)
   - `LLMStreamChunk`, `TokenUsage`, `ProviderType`

3. Add **Context Types**:
   - `CourseContext`, `MultiCourseContext`, `ContextMaterial`
   - `CourseDetectionResult`, `ContextBuildOptions`

4. Add **LMS Types**:
   - `LMSClient` interface, `LMSContent`, `SyllabusData`
   - `LMSSyncResult`, `LMSWebhookPayload`

5. Add **Type Guards** for all new discriminated unions

6. **Breaking Change**: Update `Message.timestamp` from `Date` to `string`
   - Search codebase for all `Message` usage
   - Update to use `new Date(message.timestamp)` where needed

**Deliverables:**
- Updated `lib/models/types.ts` (~2500 lines total)
- All type guards implemented
- JSDoc comments for new types

**Validation:**
- `npx tsc --noEmit` passes with zero errors
- All type guards work correctly
- No circular dependencies introduced

---

### Phase 3: LLM Provider Layer (8 hours)

**Goal:** Implement generic LLM provider interface with OpenAI and Anthropic

**File Structure:**
```
lib/llm/
├── provider.ts       # Abstract base class
├── openai.ts         # OpenAI implementation
├── anthropic.ts      # Anthropic implementation
├── prompts.ts        # Prompt engineering utilities
├── utils.ts          # Token counting, cost tracking
└── index.ts          # Exports
```

**Tasks:**

1. **Create `lib/llm/provider.ts`** - Abstract base class:
   ```typescript
   export abstract class BaseLLMProvider {
     abstract generate(input: LLMRequest): Promise<LLMResponse>;
     abstract generateStream(input: LLMRequest): AsyncIterator<LLMStreamChunk>;
     abstract estimateTokens(text: string): number;
     abstract calculateCost(usage: TokenUsage): number;
   }
   ```

2. **Create `lib/llm/openai.ts`** - OpenAI implementation:
   - Use OpenAI SDK (`npm install openai`)
   - Implement `gpt-4o-mini` model (cheap + fast)
   - Error handling with retry logic (3 attempts, exponential backoff)
   - Rate limit detection and backoff
   - Token counting with `tiktoken`

3. **Create `lib/llm/anthropic.ts`** - Anthropic implementation:
   - Use Anthropic SDK (`npm install @anthropic-ai/sdk`)
   - Implement `claude-3-haiku-20240307` model
   - Same error handling patterns as OpenAI
   - Fallback provider when OpenAI fails

4. **Create `lib/llm/prompts.ts`** - Prompt utilities:
   - `buildSystemPrompt()` - Generate system prompt for academic Q&A
   - `buildUserPrompt()` - Format user question with context
   - `formatCourseContext()` - Convert course materials to text
   - `extractCitations()` - Parse citations from LLM response

5. **Create `lib/llm/utils.ts`** - Utility functions:
   - `estimateTokens()` - Rough token count (4 chars per token)
   - `calculateCost()` - Cost estimation per provider
   - `truncateContext()` - Trim context to fit token limits
   - `retryWithBackoff()` - Exponential backoff wrapper

**Deliverables:**
- Complete LLM provider layer (5 files)
- OpenAI and Anthropic working
- Retry logic and fallback tested

**Validation:**
- Both providers generate responses successfully
- Error handling works (invalid API key, rate limit)
- Cost calculation accurate
- Token estimation within 10% of actual

---

### Phase 4: Context Builder (6 hours)

**Goal:** Build course context from materials for LLM prompts

**File Structure:**
```
lib/context/
├── builder.ts        # Course context builder
├── detector.ts       # Course auto-detection
├── ranking.ts        # Material relevance scoring
└── index.ts          # Exports
```

**Tasks:**

1. **Create `lib/context/builder.ts`**:
   - `buildCourseContext(courseId, query)` - Single course context
   - `buildMultiCourseContext(courseIds, query)` - Aggregate multiple courses
   - Reuse existing `extractKeywords()` from `client.ts:118-126`
   - Reuse existing `calculateMatchRatio()` from `client.ts:131-134`

2. **Create `lib/context/detector.ts`**:
   - `detectRelevantCourse(query, enrolledCourses)` - Auto-detect course from query
   - Uses keyword matching against course materials
   - Returns `CourseDetectionResult` with confidence score
   - Confidence >70% = auto-select, <70% = ask user

3. **Create `lib/context/ranking.ts`**:
   - `rankMaterials(materials, keywords)` - Score materials by relevance
   - Returns `ContextMaterial[]` sorted by relevance (0-100)
   - Limit to top 5-10 materials to fit token budget
   - Prioritize: lecture > slides > assignment > reading

4. **Integration with existing code**:
   - Replace lines 494-579 in `lib/api/client.ts` (template system)
   - Call context builder → LLM provider → parse citations
   - Maintain same return type (`{ content, confidence, citations }`)

**Deliverables:**
- Complete context builder (3 files)
- Integration with `generateAIResponseWithMaterials()`
- Material ranking tested and accurate

**Validation:**
- Single-course context builds correctly
- Multi-course aggregation works
- Course auto-detection ≥85% accurate on test queries
- Context fits within 4000 token budget

---

### Phase 5: API Integration (8 hours)

**Goal:** Replace template-based AI with LLM calls

**Tasks:**

1. **Update `lib/api/client.ts` - `generateAIResponseWithMaterials()`**:
   ```typescript
   async function generateAIResponseWithMaterials(...) {
     // 1. Build context from course materials
     const context = await buildCourseContext(courseId, title + content);

     // 2. Call LLM provider
     const llmProvider = getLLMProvider(); // openai or anthropic
     const llmResponse = await llmProvider.generate({
       systemPrompt: buildSystemPrompt(),
       userPrompt: buildUserPrompt(title, content, context),
       maxTokens: 1000,
       temperature: 0.7,
     });

     // 3. Parse citations from response
     const citations = extractCitations(llmResponse.content, context.materials);

     // 4. Calculate confidence from material matches
     const confidenceScore = calculateConfidence(citations);

     return { content: llmResponse.content, confidence, citations };
   }
   ```

2. **Add feature flag support**:
   - Check `NEXT_PUBLIC_USE_LLM` environment variable
   - If `false`, use existing template system (fallback)
   - If `true`, use LLM provider chain

3. **Implement provider fallback chain**:
   - Try OpenAI first
   - On error/timeout/rate-limit → try Anthropic
   - On Anthropic error → fallback to templates
   - Log all fallback events for monitoring

4. **Update `generateAIAnswer()` and `generateAIPreview()`**:
   - Both call `generateAIResponseWithMaterials()` internally
   - Signatures unchanged (zero breaking changes)
   - Add LLM metadata to AIAnswer (model, tokens, cost)

5. **Update React Query cache times**:
   - AI answers: `staleTime: 10 min` (unchanged)
   - Course materials: `staleTime: 10 min` (used for context)
   - Conversations: `staleTime: 1 min` (more dynamic)

**Deliverables:**
- `generateAIResponseWithMaterials()` using LLM
- Feature flag working
- Provider fallback chain tested
- Zero breaking changes confirmed

**Validation:**
- LLM generates accurate responses with citations
- Fallback to templates works on LLM error
- API response shape unchanged
- React Query invalidation correct

---

### Phase 6: Conversation Storage (4 hours)

**Goal:** Add private conversation storage for users

**Tasks:**

1. **Update `lib/store/localStore.ts`** - Add conversation storage:
   ```typescript
   const conversations = new Map<string, AIConversation>();
   const messages = new Map<string, AIMessage[]>();

   export function getConversations(userId: string): AIConversation[] {...}
   export function addConversation(conversation: AIConversation): void {...}
   export function getConversationMessages(conversationId: string): AIMessage[] {...}
   export function addMessage(message: AIMessage): void {...}
   export function deleteConversation(conversationId: string): void {...}
   ```

2. **Update `lib/api/client.ts`** - Add conversation methods:
   - `createConversation(userId, courseId?, title?)`
   - `getUserConversations(userId)`
   - `getConversationMessages(conversationId)`
   - `sendMessage(conversationId, content, role)`
   - `deleteConversation(conversationId)`
   - `convertConversationToThread(conversationId, userId, courseId)`

3. **Add localStorage persistence**:
   - Save to `quokkaq.conversations` key
   - Save to `quokkaq.messages` key
   - Load on startup in `seedData()`
   - Maintain in-memory Maps for performance

4. **Implement conversation → thread conversion**:
   - Extract first user message as thread title
   - Combine all messages into thread content
   - Preserve AI responses as initial AI answer
   - Mark conversation as "converted" (optional field)

**Deliverables:**
- Conversation storage in `localStore.ts`
- 5 new API methods in `client.ts`
- localStorage persistence working
- Conversation → thread tested

**Validation:**
- Conversations persist across page refresh
- Messages ordered chronologically
- Privacy enforced (user only sees own conversations)
- Thread conversion preserves full context

---

### Phase 7: React Query Hooks (2 hours)

**Goal:** Add React Query hooks for conversation management

**Tasks:**

1. **Update `lib/api/hooks.ts`** - Add conversation hooks:
   ```typescript
   export function useAIConversations(userId: string | undefined) {
     return useQuery({
       queryKey: ['aiConversations', userId],
       queryFn: () => userId ? api.getUserConversations(userId) : [],
       enabled: !!userId,
       staleTime: 1 * 60 * 1000, // 1 minute
     });
   }

   export function useConversationMessages(conversationId: string | undefined) {
     return useQuery({
       queryKey: ['conversationMessages', conversationId],
       queryFn: () => conversationId ? api.getConversationMessages(conversationId) : [],
       enabled: !!conversationId,
       staleTime: 30 * 1000, // 30 seconds
       refetchInterval: 5 * 1000, // Poll every 5s for new messages
     });
   }

   export function useSendMessage() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ({ conversationId, content, role }) =>
         api.sendMessage(conversationId, content, role),
       onMutate: async ({ conversationId, content, role }) => {
         // Optimistic update
       },
       onSuccess: (newMessage, { conversationId }) => {
         queryClient.invalidateQueries({ queryKey: ['conversationMessages', conversationId] });
       },
     });
   }

   export function useConvertConversation() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ({ conversationId, userId, courseId }) =>
         api.convertConversationToThread(conversationId, userId, courseId),
       onSuccess: (result) => {
         queryClient.invalidateQueries({ queryKey: ['threads'] });
         queryClient.invalidateQueries({ queryKey: ['aiConversations'] });
       },
     });
   }
   ```

2. **Add optimistic updates for `useSendMessage()`**:
   - Immediately add message to cache
   - Show loading state while LLM generates response
   - Rollback on error

3. **Update query key documentation**:
   - Document new query keys in comments
   - Add to central `queryKeys` object

**Deliverables:**
- 4 new React Query hooks in `hooks.ts`
- Optimistic updates for send message
- Proper cache invalidation

**Validation:**
- Hooks fetch data correctly
- Optimistic updates provide instant feedback
- Cache invalidation triggers correctly
- No unnecessary refetches

---

### Phase 8: Testing & Documentation (6 hours)

**Goal:** Validate all functionality and document setup

**Tasks:**

1. **Integration Testing**:
   - Test all 6 new API methods
   - Test LLM provider switching (OpenAI ↔ Anthropic)
   - Test context building (single + multi-course)
   - Test conversation → thread conversion
   - Test feature flag (LLM on/off)

2. **Performance Testing**:
   - Measure LLM response latency (target: <2s 95th percentile)
   - Measure context building time (target: <500ms)
   - Test with 100+ messages in conversation
   - Bundle size analysis (target: <200KB per route)

3. **Cost Monitoring**:
   - Track token usage per request
   - Calculate daily cost estimates
   - Add cost alerts for >$10/day
   - Document cost optimization strategies

4. **Error Handling Testing**:
   - Test invalid API keys
   - Test rate limit scenarios
   - Test network timeouts
   - Test fallback chain (OpenAI → Anthropic → Templates)

5. **Update Documentation**:
   - Update `README.md` with LLM setup instructions
   - Update `CLAUDE.md` with LLM development guidelines
   - Create `.env.local.example` with all variables
   - Add security warnings for client-side API keys
   - Document rollback procedures

6. **Create Migration Runbook**:
   - Step-by-step deployment guide
   - Rollback procedures for each phase
   - Troubleshooting common issues
   - Cost monitoring dashboard setup

**Deliverables:**
- All integration tests passing
- Performance benchmarks documented
- Cost monitoring in place
- Complete documentation updated
- Migration runbook created

**Validation:**
- All acceptance criteria met
- Zero breaking changes confirmed
- Bundle size <200KB per route
- LLM responses <2s 95th percentile

---

## Implementation Order

Execute phases sequentially (no parallelization):

1. **Phase 1** → **Phase 2** (Environment + Types) - **4 hours**
   - Foundation for all other work
   - Types needed before implementation

2. **Phase 3** → **Phase 4** (LLM + Context) - **14 hours**
   - Core AI functionality
   - Can test LLM responses independently

3. **Phase 5** (API Integration) - **8 hours**
   - Replaces template system
   - Maintains API contracts

4. **Phase 6** → **Phase 7** (Conversations + Hooks) - **6 hours**
   - New feature layer
   - Depends on types and API

5. **Phase 8** (Testing + Docs) - **6 hours**
   - Final validation
   - Documentation for deployment

**Total: 38 hours** (rounded to 40 with buffer)

---

## Rollback Strategy

### Level 1: Feature Flag (Instant)
```bash
# .env.local
NEXT_PUBLIC_USE_LLM=false
```
- Reverts to template-based AI
- Zero downtime
- No code changes needed

### Level 2: Provider Swap (Instant)
```bash
# .env.local
NEXT_PUBLIC_LLM_PROVIDER=anthropic
```
- Switches from OpenAI to Anthropic
- Useful if one provider has issues
- No downtime

### Level 3: Template Fallback (Automatic)
- Built into code
- Activates on LLM errors
- No manual intervention needed
- Logs all fallback events

### Level 4: Full Revert (<1 hour)
```bash
git revert <commit-hash>
git push origin main
npm run build
```
- Nuclear option
- Requires rebuild and deploy
- Use only if Level 1-3 fail

---

## Success Criteria

### Technical Criteria
- ✅ TypeScript compiles with zero errors
- ✅ All React Query hooks have proper invalidation
- ✅ LLM provider layer functional (OpenAI + Anthropic)
- ✅ Course materials used for AI context
- ✅ Multi-course context aggregation works
- ✅ Course auto-detection ≥85% accuracy
- ✅ Conversation storage secure and private
- ✅ Conversation → thread conversion preserves context
- ✅ Zero breaking changes to existing components
- ✅ Bundle size <200KB per route

### Performance Criteria
- ✅ LLM response time <2s (95th percentile)
- ✅ Context building <500ms
- ✅ No memory leaks with 100+ messages
- ✅ React Query cache efficient

### Quality Criteria
- ✅ All integration tests pass
- ✅ Manual testing of all flows successful
- ✅ Accessibility (WCAG 2.2 AA) maintained
- ✅ QDS compliance for new UI
- ✅ Error handling graceful
- ✅ Documentation complete

---

## Next Steps

1. **Get Approval** - Review this roadmap and approve to proceed
2. **Set Up Environment** - Create API keys, configure `.env.local`
3. **Start Phase 1** - Begin with environment setup (2 hours)
4. **Daily Commits** - Small commits after each subsystem
5. **Weekly Check-ins** - Review progress and adjust timeline

---

## Timeline Estimate

| Week | Phases | Hours | Deliverables |
|------|--------|-------|--------------|
| **Week 1** | Phase 1-2 | 4h | Env setup, type extensions |
| **Week 2** | Phase 3 | 8h | LLM provider layer |
| **Week 3** | Phase 4-5 | 14h | Context builder, API integration |
| **Week 4** | Phase 6-7 | 6h | Conversations, hooks |
| **Week 5** | Phase 8 | 6h | Testing, documentation |
| **Buffer** | - | 2h | Unexpected issues |

**Total: 40 hours over 5-6 weeks**

---

## Risk Mitigation Summary

| Risk | Mitigation |
|------|------------|
| **LLM Latency** | Async generation, streaming, optimistic updates |
| **Rate Limits** | Queue, exponential backoff, fallback provider |
| **Context Size** | Token counting, material ranking, truncation |
| **Cost Overruns** | Request throttling, aggressive caching, monitoring |
| **Quality Issues** | Prompt engineering, testing, confidence scoring |
| **Breaking Changes** | Maintain API contracts, comprehensive testing |

---

## Conclusion

**Readiness Assessment: GO ✅**

All three planning agents agree: the codebase is **ready for LLM transformation** with minimal risk. The foundation is excellent, patterns are solid, and the migration path is clear.

**Key Strengths:**
1. Zero breaking changes to public API
2. Excellent abstraction layer already in place
3. Course materials ready for RAG
4. Type system extensible
5. Clear rollback strategy

**Recommendation:** Proceed with Phase 1 (Environment Setup) immediately.

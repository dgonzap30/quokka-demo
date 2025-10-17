# Backend LLM Transformation - Task Context

**Created:** 2025-10-16
**Status:** In Progress
**Complexity:** High - Multi-layered architectural transformation

---

## Goal

Transform the application's backend from template-based mock API into a production-ready LLM-powered system that:
- Uses real LLMs (OpenAI/Anthropic) for AI responses instead of keyword-matched templates
- Leverages course materials from LMS for context-aware answers
- Supports multi-course context in general view (aggregates all enrolled courses)
- Auto-detects relevant course from user queries
- Stores private AI conversations per user with conversation → thread conversion

---

## In-Scope

### Core Features
1. **LLM Integration Layer**
   - Generic `LLMProvider` interface
   - OpenAI implementation (primary)
   - Anthropic implementation (fallback/alternative)
   - Prompt engineering utilities
   - Token counting and cost tracking
   - Streaming response support

2. **Course Context System**
   - Single-course context builder (uses course materials)
   - Multi-course context builder (aggregates enrolled courses)
   - Course auto-detection from query keywords
   - Context ranking by relevance
   - Semantic search for material retrieval

3. **LMS Integration**
   - Generic LMS client interface (adapter pattern)
   - Simulated Canvas LMS adapter for demo
   - Content sync service (pull syllabi, schedules, materials)
   - Content update webhooks (future: real-time sync)

4. **AI Conversation System**
   - Private conversation storage per user
   - Session management with context tracking
   - Conversation history retrieval
   - Conversation → Thread conversion
   - Privacy enforcement (conversations never public unless converted)

5. **Database Schema**
   - `ai_conversations` table: User conversation sessions
   - `ai_messages` table: Individual messages in conversations
   - `lms_content` table: Cached LMS materials
   - `context_cache` table: Pre-computed course contexts
   - Migration scripts from current mock data

### API Endpoints (New)
- `POST /api/ai/conversations` - Create new conversation session
- `GET /api/ai/conversations/:userId` - List user's conversations
- `POST /api/ai/conversations/:id/messages` - Send message to conversation
- `GET /api/ai/conversations/:id/messages` - Get conversation history
- `POST /api/ai/conversations/:id/convert-to-thread` - Publish conversation as thread
- `POST /api/courses/:id/sync-lms` - Trigger LMS content sync

### API Endpoints (Updated)
- `POST /api/ai/generate` - Replace template logic with LLM calls
- `POST /api/ai/preview` - Use real LLM for ask page previews
- `GET /api/courses/:id/materials` - Add LMS sync integration
- `POST /api/materials/search` - Add semantic search with embeddings

### React Query Hooks (New)
- `useAIConversations(userId)` - Fetch user conversations
- `useConversationMessages(conversationId)` - Stream messages
- `useSendMessage()` - Send message mutation with optimistic updates
- `useConvertConversation()` - Convert conversation to thread
- `useSyncCourseMaterials()` - Trigger LMS sync

---

## Out-of-Scope

❌ **Not Included:**
- Real LMS OAuth integration (use simulated adapter)
- Vector database for semantic search (use simple keyword matching for now)
- Real-time WebSocket streaming (use polling)
- LLM response caching (future optimization)
- Multi-tenant support (single demo environment)
- User authentication changes (use existing mock auth)
- Production deployment configuration (focus on architecture)

---

## Constraints

1. **Zero Breaking Changes**: Existing UI components must continue working
2. **Mock API Compatibility**: Must maintain API surface for frontend-only demo
3. **Type Safety**: TypeScript strict mode compliance throughout
4. **Bundle Size**: Keep route bundles <200KB (code splitting for LLM client)
5. **Performance**: LLM responses <2s 95th percentile
6. **Accessibility**: Maintain WCAG 2.2 AA compliance
7. **QDS Compliance**: New UI uses design tokens only

---

## Acceptance Criteria

**Done When:**
- [ ] LLM provider layer functional with OpenAI and Anthropic
- [ ] Course materials used for AI context (no hardcoded templates)
- [ ] Multi-course context works in general view
- [ ] Course auto-detection ≥85% accuracy on test queries
- [ ] Conversation storage secure and private
- [ ] Conversation → Thread conversion maintains full context
- [ ] Zero breaking changes to existing components
- [ ] TypeScript compiles with no errors
- [ ] All React Query hooks have proper invalidation
- [ ] Integration tests pass for all new endpoints
- [ ] Bundle size <200KB per route
- [ ] Manual testing of all user flows successful

---

## Risks & Mitigation

### Risk 1: LLM API Rate Limits
**Mitigation:**
- Implement exponential backoff with retries
- Fallback to alternative provider (Anthropic if OpenAI fails)
- Request queuing with priority
- User-facing error messages for rate limit scenarios

### Risk 2: LLM Response Quality
**Mitigation:**
- Comprehensive prompt engineering with examples
- Temperature/top_p tuning for consistency
- Confidence scoring based on material relevance
- Instructor review workflow for low-confidence answers

### Risk 3: Context Size Limits
**Mitigation:**
- Context ranking to prioritize most relevant materials
- Token counting before API calls
- Context truncation strategies (keep most relevant)
- Fallback to single-course context if multi-course exceeds limits

### Risk 4: Frontend-Backend Mismatch
**Mitigation:**
- Maintain existing API contracts exactly
- Add new endpoints separately
- Comprehensive integration testing
- Gradual rollout with feature flags

### Risk 5: Performance Degradation
**Mitigation:**
- Async/await for all LLM calls
- Parallel context building for multi-course
- React Query caching aggressive (staleTime tuned)
- Loading states for all LLM operations

---

## Rollback Plan

If critical issues arise:
1. **Phase 1**: Revert to template-based AI responses (keep LLM layer but disable)
2. **Phase 2**: Keep conversation storage but disable auto-sync
3. **Phase 3**: Full rollback to previous commit (database migrations reversed)

**Rollback Triggers:**
- LLM response time >5s consistently
- Error rate >10% on AI endpoints
- Breaking changes discovered in production
- Cost overruns (>$100/day for demo environment)

---

## Related Files

### Core Implementation
- `lib/api/client.ts` - API client (needs LLM integration)
- `lib/api/hooks.ts` - React Query hooks (new conversation hooks)
- `lib/models/types.ts` - TypeScript types (add conversation types)
- `lib/store/localStore.ts` - In-memory store (add conversations)

### LLM Provider (New)
- `lib/llm/provider.ts` - Generic LLM interface
- `lib/llm/openai.ts` - OpenAI implementation
- `lib/llm/anthropic.ts` - Anthropic implementation
- `lib/llm/prompts.ts` - Prompt engineering utilities

### Context System (New)
- `lib/context/builder.ts` - Course context builder
- `lib/context/detector.ts` - Course auto-detection
- `lib/context/ranking.ts` - Material relevance scoring

### LMS Integration (New)
- `lib/lms/client.ts` - Generic LMS interface
- `lib/lms/canvas.ts` - Canvas LMS adapter (simulated)
- `lib/lms/sync.ts` - Content sync service

### Database (New)
- `lib/db/schema.ts` - Database schema definitions
- `lib/db/migrations.ts` - Migration scripts

### Mock Data
- `mocks/course-materials.json` - Course materials (already exists)
- `mocks/conversations.json` - AI conversations (new)
- `mocks/lms-content.json` - Simulated LMS data (new)

---

## Decisions

### Decision Log

#### 2025-10-16: LLM Provider Selection
**Decision:** Use OpenAI as primary, Anthropic as fallback
**Rationale:** OpenAI has better documentation and cheaper pricing for GPT-4o-mini. Anthropic provides good fallback with Claude 3 Haiku.
**Alternatives Considered:** Google Gemini (less mature API), Local LLaMA (too slow for demo)

#### 2025-10-16: Context Strategy
**Decision:** Build context on-demand, cache for 10 minutes
**Rationale:** Materials change infrequently, caching reduces LLM context building latency. 10 min balances freshness vs performance.
**Alternatives Considered:** Pre-compute all contexts (too memory intensive), No caching (too slow)

#### 2025-10-16: Conversation Storage
**Decision:** Store conversations in local store (in-memory) for demo, design for real database
**Rationale:** Maintains frontend-only demo requirement while architecting for production. Easy migration path.
**Alternatives Considered:** LocalStorage (too limited), Always use DB (breaks frontend-only requirement)

#### 2025-10-16: Semantic Search
**Decision:** Defer vector embeddings to v2, use keyword matching for now
**Rationale:** Keyword matching already works well in current system. Vector DB adds complexity without immediate value for demo.
**Alternatives Considered:** Implement immediately (scope creep), Use external service (cost/complexity)

#### 2025-10-16: Type System Design (Type Safety Guardian)
**Decision:** Extend existing `lib/models/types.ts` with 48 new types, maintain single-file pattern
**Rationale:** Current type system is exemplary (zero `any` types, proper guards, good docs). Adding to existing file maintains consistency and avoids circular dependencies.
**Key Findings:**
- Current codebase already follows strict mode best practices
- Only 1 breaking change needed: `Message.timestamp` from `Date` to `string` (ISO 8601)
- All new types designed with discriminated unions, type guards, and JSDoc
- File paths: `research/type-patterns.md`, `plans/type-design.md`

#### 2025-10-16: API Design & Conversation Storage (Mock API Designer)
**Decision:** Add 6 new API methods + 6 React Query hooks for conversation system, modify 2 existing AI methods
**Rationale:** Zero breaking changes strategy - all new endpoints are additive, existing signatures remain identical. Template-based AI generation replaced internally with LLM calls (with fallback to templates on error).
**Key Findings:**
- Course materials infrastructure already exists (`getCourseMaterials`, `searchCourseMaterials`)
- Keyword extraction and material scoring logic can be reused for LLM context
- React Query hooks follow existing patterns (optimistic updates, proper invalidation)
- localStorage storage maintains frontend-only demo requirement
- File paths: `research/api-patterns.md`, `plans/api-design.md`
**New Endpoints:**
- `createConversation`, `getUserConversations`, `getConversationMessages`, `sendMessage`, `deleteConversation`, `convertConversationToThread`
**Modified Endpoints:**
- `generateAIAnswer`, `generateAIPreview` (internal implementation only, signatures unchanged)

#### 2025-10-16: Integration Readiness & Migration Strategy (Integration Readiness Checker)
**Decision:** Phased 40-hour migration with feature flags, zero breaking changes, 8-phase rollout
**Readiness Score:** 8.5/10 - Excellent API abstraction, ready for backend swap
**Critical Findings:**
- ✅ Clean API abstraction layer (`lib/api/client.ts`) with 36 methods ready for swap
- ✅ React Query hooks (27 hooks) use proper cache invalidation patterns
- ✅ Type system comprehensive (1,722 lines, zero `any` types)
- ✅ Course materials (39KB, 36 items) perfect for RAG context
- ✅ Mock data quality excellent - rich content for LLM context
- ⚠️ Template system (CS_TEMPLATES, MATH_TEMPLATES) must be removed
- ⚠️ LLM latency 2-3x slower than mock (800ms → 1500-3000ms)
**Migration Strategy:**
- Phase 1: Environment setup (2h) - `.env.local`, feature flags
- Phase 2: Type extensions (2h) - Add LLM, context, conversation types
- Phase 3: LLM providers (8h) - OpenAI + Anthropic implementations
- Phase 4: Context builder (6h) - Material ranking, context formatting
- Phase 5: API integration (8h) - Replace `generateAIResponseWithMaterials()`
- Phase 6: Conversation storage (4h) - localStorage + hooks
- Phase 7: Testing (6h) - Integration, performance, cost monitoring
- Phase 8: Documentation (4h) - README, CLAUDE.md, runbooks
**Rollback Strategy:** Feature flag (instant), provider swap (instant), template fallback (automatic), git revert (< 1 hour)
**File paths:** `research/current-api-audit.md`, `plans/integration-readiness.md`

---

## Changelog

### 2025-10-17 - Phase 8 Complete: Testing & Documentation
- Updated README.md with expanded LLM integration details
- Enhanced "How It Works" section with architecture details
- Added conversation endpoints to API documentation
- Created comprehensive MIGRATION-RUNBOOK.md (5 phases, 40 hours)
- Migration runbook includes database schema, API routes, deployment checklist
- All documentation finalized for production handoff

### 2025-10-17 - Phase 7 Complete: React Query Hooks
- Implemented 6 conversation hooks in lib/api/hooks.ts
- useAIConversations(userId) - fetch conversations with 1-min stale time
- useConversationMessages(conversationId) - fetch messages with 5s polling
- useCreateConversation() - mutation with cache invalidation
- useSendMessage() - mutation with optimistic updates
- useDeleteConversation() - mutation with optimistic removal
- useConvertConversationToThread() - convert to public thread
- All hooks follow existing patterns (optimistic updates, proper invalidation)
- TypeScript typecheck passes with no errors

### 2025-10-17 - Phase 6 Complete: Conversation Storage
- Extended localStore.ts with 10 new conversation functions
- Added aiConversations and conversationMessages to localStorage
- Implemented cascade delete (conversation → messages)
- Auto-update messageCount and timestamps on message add
- Updated client.ts with 6 new conversation API methods
- Conversation-to-thread conversion preserves full context
- TypeScript typecheck passes after fixing 3 type mismatches

### 2025-10-17 - Phase 5 Complete: API Integration with LLM
- Replaced generateAIResponseWithMaterials() with LLM-powered version
- Integrated buildCourseContext() for material ranking
- Call getLLMProvider().generate() with system/user prompts
- Extract citations from ranked materials
- Calculate confidence from material relevance scores
- Graceful fallback to templates on any error
- TypeScript typecheck passes after fixing materialId type

### 2025-10-17 - Phase 4 Complete: Context Builder System
- Created CourseContextBuilder (lib/context/CourseContextBuilder.ts - 213 lines)
- Created MultiCourseContextBuilder (lib/context/MultiCourseContextBuilder.ts - 289 lines)
- Created public API with convenience functions (lib/context/index.ts - 221 lines)
- Course detection algorithm: code mention (100 pts), keywords (10 pts), content (5 pts)
- Material ranking: 60% keyword matches, 40% content matches
- Token budget management with proportional allocation
- TypeScript typecheck passes after fixing builtAt and material type errors

### 2025-10-17 - Phase 3 Complete: LLM Provider Layer
- Created BaseLLMProvider abstract class (lib/llm/BaseLLMProvider.ts - 255 lines)
- Created OpenAIProvider with GPT-4o-mini support (lib/llm/OpenAIProvider.ts - 172 lines)
- Created AnthropicProvider with Claude 3 Haiku (lib/llm/AnthropicProvider.ts - 165 lines)
- Implemented retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
- Added rate limiting enforcement and cost tracking
- Created prompt engineering utilities (lib/llm/utils.ts - 246 lines)
- Created factory functions with fallback chain (lib/llm/index.ts - 155 lines)
- TypeScript typecheck passes with no errors

### 2025-10-17 - Phase 2 Complete: Type System Extension
- Extended types.ts with 48 new types (1,722 → 2,100+ lines)
- Added LLM provider types (LLMConfig, LLMRequest, LLMResponse)
- Added context builder types (CourseContext, MultiCourseContext, ContextBuildOptions)
- Added conversation types (AIConversation, AIMessage, SendMessageInput)
- All types use discriminated unions with type guards
- Zero breaking changes to existing types
- TypeScript strict mode compliance throughout

### 2025-10-17 - Phase 1 Complete: Environment Setup
- Created .env.local.example with comprehensive LLM configuration
- Added 20+ environment variables for LLM, context, cost tracking
- Feature flags: NEXT_PUBLIC_USE_LLM, NEXT_PUBLIC_LLM_PROVIDER
- Security warnings for client-side API keys documented
- Configuration guide in README.md

### 2025-10-16 - Task Created
- Initial task context created
- Scope defined with clear in/out boundaries
- Risks identified with mitigation strategies
- Three sub-agents delegated for planning: Mock API Designer, Type Safety Guardian, Integration Readiness Checker

---

## Next Steps

1. **Parallel Agent Planning** (Next 30 min):
   - Mock API Designer: Design API contracts, database schema, endpoint signatures
   - Type Safety Guardian: Design types for conversations, LLM providers, LMS integration
   - Integration Readiness Checker: Audit current API, plan migration, identify breaking changes

2. **Review & Consolidate** (30 min):
   - Review all agent plans for consistency
   - Resolve conflicts between agents
   - Create unified implementation roadmap

3. **Implementation** (8-12 hours):
   - Implement in order: Database → LLM → Context → LMS → Conversations → API → Hooks
   - Small commits after each subsystem
   - Continuous typecheck/lint validation

4. **Testing & Validation** (2-3 hours):
   - Integration tests for all new endpoints
   - Manual testing of all user flows
   - Performance profiling
   - Bundle size analysis

---

## Sub-Agent Delegations

### Mock API Designer (Launched)
**Task:** Design complete API contracts for LLM integration, conversation system, and LMS sync
**Deliverables:**
- `plans/api-design.md` - All endpoint signatures, database schema
- `research/api-patterns.md` - Existing API audit

### Type Safety Guardian (Launched)
**Task:** Design TypeScript types for all new subsystems
**Deliverables:**
- `plans/type-design.md` - Complete type definitions
- `research/type-patterns.md` - Existing type audit

### Integration Readiness Checker (Launched)
**Task:** Validate backend integration readiness and create migration plan
**Deliverables:**
- `plans/integration-readiness.md` - Migration roadmap
- `research/current-api-audit.md` - API contract analysis

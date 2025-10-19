# AI Service Comprehensive Cleanup - Task Context

**Created:** 2025-10-19
**Type:** Code Quality & Bug Fixes
**Priority:** 🔴 HIGH (Blocks critical features)

---

## Goal

Comprehensive cleanup of AI service architecture to:
1. **Fix broken /api/answer endpoint** (blocks thread creation with AI)
2. **Remove 500+ lines of dead code** (template fallback system)
3. **Fix AI chat UI** (Turbopack caching issue preventing modal from loading)
4. **Standardize error handling** across API routes
5. **Improve code organization** (split monolithic client.ts)

---

## In-Scope

### Critical Fixes (Sprint 1 - Must Do)
- ✅ Fix /api/answer endpoint (use hybrid retrieval like kb_search tool)
- ✅ Remove dead template generation code (~400 lines)
- ✅ Fix AI chat modal not rendering (Turbopack cache issue)
- ✅ Standardize API error responses
- ✅ Update documentation to reflect changes

### Code Quality (Sprint 2 - Should Do)
- ⚡ Split lib/api/client.ts (2,500 lines → 6 modules)
- ⚡ Replace simple hash-based embeddings with Transformers.js
- ⚡ Add integration tests for AI endpoints
- ⚡ Improve tool usage tracking (move to request context)

---

## Out-of-Scope

- Backend integration (frontend-only demo)
- Real embedding model implementation (use Transformers.js)
- Redis setup (keep in-memory for demo)
- Performance profiling (future sprint)
- UI redesign (focus on functionality)

---

## Done When

**Sprint 1 Acceptance Criteria:**
- [x] /api/answer returns 200 with structured AI answer
- [x] Thread creation with AI answer works end-to-end
- [x] AI chat modal renders and functions correctly
- [x] 0 dead code (removed generateAIResponse* functions)
- [x] All API routes use standardized error format
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] All routes load without console errors in dev (verification pending)
- [ ] Documentation updated (CLAUDE.md, audit report) (in progress)

**Sprint 2 Acceptance Criteria:**
- [ ] lib/api/client.ts split into focused modules
- [ ] Semantic search quality improved (Transformers.js)
- [ ] Integration tests pass (>50% coverage on AI routes)
- [ ] Code review completed

---

## Issues Identified

### 🔴 CRITICAL: Broken /api/answer Endpoint
**File:** `app/api/answer/route.ts:86-99`
**Issue:** Returns HTTP 501, blocks thread creation
**Root Cause:** Phase 3 cleanup removed `buildCourseContext()` without refactoring
**Impact:** Users cannot create threads with AI-generated answers
**Fix:** Use `createHybridRetriever()` directly (like kb_search tool)

### 🔴 CRITICAL: AI Chat Modal Not Rendering
**File:** `components/ai/quokka-assistant-modal.tsx`
**Issue:** Next.js dev server shows "Module not found" error (repeated)
**Root Cause:** Turbopack cache stale or dev server started before file existed
**Impact:** AI chat UI doesn't load, users see blank screen
**Fix:** Restart dev server, clear .next cache if needed

### 🔴 HIGH: Dead Template Code (400+ Lines)
**File:** `lib/api/client.ts:464-675`
**Functions:**
- `generateAIResponse()` (50 lines) - UNUSED
- `generateAIResponseWithTemplates()` (133 lines) - UNUSED
- `generateAIResponseWithMaterials()` (wrapper, always calls templates)
**Impact:** Code bloat, developer confusion
**Fix:** Delete all three functions, update call sites

### ⚠️ MEDIUM: Inconsistent Error Responses
**Files:** `app/api/chat/route.ts`, `app/api/answer/route.ts`
**Issue:** Different error response schemas
- Chat: `{ error, code, message }`
- Answer: `{ success: false, error, code, message }`
**Fix:** Create shared `apiError()` helper

### ⚠️ MEDIUM: Monolithic Client File
**File:** `lib/api/client.ts` (2,500 lines)
**Issue:** Single file with threads, posts, AI, materials, conversations
**Fix:** Split into `client/` directory with 6 modules

### ⚠️ LOW: Simple Hash-Based Embeddings
**File:** `lib/retrieval/EmbeddingRetriever.ts:156-200`
**Issue:** Demo-quality hash-based "embeddings", not semantically meaningful
**Fix:** Replace with Transformers.js (all-MiniLM-L6-v2)

---

## Constraints

- **No real backend** - Keep mock API boundaries
- **Frontend-only** - All changes client/API route layer
- **Small verified steps** - Test/typecheck after each change
- **Maintain backward compatibility** - Don't break existing UI
- **Follow QDS** - Any UI changes use design tokens
- **Accessibility** - Maintain WCAG 2.2 AA compliance

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking thread creation | HIGH | MEDIUM | Test thread creation flow thoroughly |
| Turbopack cache persists | MEDIUM | LOW | Document restart procedure |
| Retrieval quality degrades | MEDIUM | LOW | Compare results before/after |
| Type errors from refactor | HIGH | MEDIUM | Run tsc after each change |
| Missing error cases | MEDIUM | MEDIUM | Add error handling tests |

---

## Rollback Plan

If critical issues occur:
1. **Revert commit** - All changes in separate commits
2. **Keep audit report** - Document what was attempted
3. **Restore from git** - `git revert <commit-hash>`
4. **Clear .next/** - Rebuild cache: `rm -rf .next && npm run dev`

---

## Related Files

**API Routes:**
- `app/api/answer/route.ts` - Broken, needs hybrid retrieval
- `app/api/chat/route.ts` - Working, reference implementation

**Core Services:**
- `lib/api/client.ts` - Monolithic, contains dead code
- `lib/llm/tools/handlers.ts` - Working retrieval implementation
- `lib/retrieval/` - Hybrid retrieval system (2,400 lines)

**UI Components:**
- `components/ai/quokka-assistant-modal.tsx` - Modal component
- `components/layout/nav-header.tsx` - Imports modal

**Config:**
- `.env.local` - LLM API keys (user has valid OpenAI key)
- `lib/utils/env.ts` - Environment config parser

---

## Decisions

### Decision 1: Fix /api/answer vs Deprecate
**Options:**
- A: Fix with hybrid retrieval (2-4 hours)
- B: Deprecate, redirect to /api/chat (1 hour)

**Choice:** Fix (Option A)
**Rationale:**
- Structured answers useful for thread creation
- generateObject() provides type safety
- Different use case than streaming chat
- 200 lines of commented code shows intent to keep

### Decision 2: Simple Embeddings - Replace Now or Later?
**Options:**
- A: Replace with Transformers.js now (4-6 hours)
- B: Document limitation, replace later

**Choice:** Later (Option B - Sprint 2)
**Rationale:**
- Not blocking critical features
- Hybrid search (BM25 + embeddings) already works
- Focus Sprint 1 on bug fixes
- Transformers.js adds complexity

### Decision 3: client.ts - Split Now or Later?
**Options:**
- A: Split into modules now (1 day)
- B: Clean dead code, split later

**Choice:** Later (Option B - Sprint 2)
**Rationale:**
- Removing 400 lines makes file more manageable
- No functional benefit to splitting for Sprint 1
- Risk of introducing bugs during refactor
- Focus on critical fixes first

---

## Implementation Steps

### Sprint 1: Critical Fixes (1-2 days)

**Step 1: Fix AI Chat Modal Loading (30 min)**
1. Kill all dev servers
2. Delete `.next/` cache
3. Restart dev server
4. Verify modal loads without errors
5. Test chat functionality

**Step 2: Fix /api/answer Endpoint (2-4 hours)**
1. Read `/api/chat/route.ts` as reference
2. Import `createHybridRetriever` from lib/retrieval
3. Replace commented code with retrieval logic
4. Use `generateObject()` with AIAnswerSchema
5. Test with course materials
6. Verify thread creation works

**Step 3: Remove Dead Template Code (1-2 hours)**
1. Delete `generateAIResponse()` (lines 464-514)
2. Delete `generateAIResponseWithTemplates()` (lines 542-675)
3. Update `generateAIResponseWithMaterials()` to call /api/answer
4. Update imports and references
5. Run typecheck, verify builds

**Step 4: Standardize Error Responses (1 hour)**
1. Create `lib/api/errors.ts` with `apiError()` helper
2. Update `/api/chat/route.ts` to use helper
3. Update `/api/answer/route.ts` to use helper
4. Document error response schema

**Step 5: Update Documentation (30 min)**
1. Update audit report with completed items
2. Update CLAUDE.md with removed code notes
3. Add migration notes for future developers

### Sprint 2: Code Quality (3-5 days)

**Step 6: Split client.ts (1 day)**
- Create `lib/api/client/` directory
- Split into: threads.ts, posts.ts, conversations.ts, materials.ts, users.ts
- Update imports in hooks.ts

**Step 7: Improve Embeddings (4-6 hours)**
- Install `@xenova/transformers`
- Create `createTransformersEmbedding()` function
- Update EmbeddingRetriever to use real model
- Test semantic search quality

**Step 8: Add Integration Tests (2-3 days)**
- Create `tests/api/` directory
- Test /api/chat with tool calling
- Test /api/answer with retrieval
- Test error cases and edge cases

---

## Metrics

**Current State:**
- Lines of Code: 7,350
- Dead Code: 500 lines (6.8%)
- Broken Endpoints: 2 (/api/answer returns 501, modal won't load)
- Test Coverage: 0%
- Health Score: 6/10

**Target State (After Sprint 1):**
- Lines of Code: 6,850 (-500)
- Dead Code: 0 lines (0%)
- Broken Endpoints: 0
- Test Coverage: 0% (Sprint 2)
- Health Score: 8/10

**Target State (After Sprint 2):**
- Lines of Code: 6,500 (-850)
- Dead Code: 0 lines (0%)
- Broken Endpoints: 0
- Test Coverage: >50%
- Health Score: 9/10

---

## Changelog

- `2025-10-19` | [Planning] | Task created, audit findings incorporated
- `2025-10-19` | [Research] | Identified AI chat modal Turbopack caching issue
- `2025-10-19` | [Planning] | Sprint plan created with prioritization
- `2025-10-19` | [Sprint 1] | Fixed AI chat modal (cleared Turbopack cache, restart dev server)
- `2025-10-19` | [Sprint 1] | Fixed /api/answer endpoint with hybrid retrieval (BM25 + RRF + MMR)
- `2025-10-19` | [Sprint 1] | Removed 160 lines of dead template code, updated call sites
- `2025-10-19` | [Sprint 1] | Standardized API error responses (created lib/api/errors.ts)

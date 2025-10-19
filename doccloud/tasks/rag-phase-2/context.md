# RAG Enhancement: Phase 2 - Adaptive Retrieval & Query Enhancement

**Created:** 2025-10-17
**Status:** Planning
**Phase:** Phase 2 - Advanced RAG Features

---

## Goal

Enhance QuokkaQ's RAG system with adaptive retrieval (Self-RAG), hierarchical context (RAPTOR), and query expansion (PRF) to achieve 20%+ further improvement in retrieval relevance beyond Phase 1 baseline.

---

## Scope

### In-Scope (Phase 2)

1. **Self-RAG (Adaptive Retrieval)**
   - Query confidence scoring
   - Routing logic (retrieve more vs use cached)
   - Confidence-based cache TTL

2. **RAPTOR (Hierarchical Retrieval)**
   - Multi-level document abstractions
   - Document clustering
   - Hierarchical summarization
   - Context traversal

3. **PRF (Query Expansion)**
   - Pseudo-Relevance Feedback
   - Term extraction from top results
   - Query reformulation

4. **Cross-Encoder Reranking** (Optional)
   - Implement cross-encoder reranker
   - Top-K precision improvement

### Out-of-Scope (Phase 2)

- Evaluation harness (RAG triad) → Phase 3
- Metrics dashboard → Phase 3
- Multi-modal retrieval (images, videos) → Future
- Backend database changes → Still frontend-only
- Real-time evaluation → Phase 3

---

## Done When

### Technical Requirements
- [ ] Self-RAG routes 80%+ of high-confidence queries without additional retrieval
- [ ] RAPTOR improves context coherence (measured on 20 test questions)
- [ ] PRF expands 60%+ of queries with relevant terms
- [ ] Reranker improves top-3 precision by 15%+ (if enabled)
- [ ] Total latency remains <2s (95th percentile)
- [ ] Types pass: `npx tsc --noEmit`
- [ ] Lint clean: `npm run lint`
- [ ] Production build succeeds
- [ ] All bundle sizes <200KB per route

### Quality Requirements
- [ ] Retrieval relevance improved by 20%+ vs Phase 1 baseline
- [ ] Query routing accuracy: 80%+ correct decisions
- [ ] Context coherence improved with RAPTOR
- [ ] Query coverage: 10%+ more terms matched via PRF
- [ ] Cost neutral or improved (cache savings offset new calls)

---

## Constraints

1. **Performance Budget:** <2s total latency for AI answer generation
2. **Cost Budget:** Cache savings must offset any increased LLM costs
3. **Type Safety:** TypeScript strict mode throughout
4. **Backward Compatibility:** Existing hooks and API contracts unchanged
5. **Frontend-Only:** No backend database changes (in-memory only)
6. **Maintain Fallback:** System must gracefully degrade if features unavailable

---

## Technical Architecture

### Current State (Phase 1 Baseline)

```typescript
Query
  ↓
[BM25Retriever, EmbeddingRetriever] (parallel)
  ↓
RRF fusion (k=60)
  ↓
MMR diversification (λ=0.7)
  ↓
Dynamic excerpts (±350 chars)
  ↓
CoursePromptBuilder
  ↓
LLM (with caching)
  ↓
GroundingVerifier
  ↓
Answer
```

### Target State (Phase 2)

```typescript
Query
  ↓
ConfidenceScorer (Self-RAG) → High confidence? Use cache : Continue
  ↓
QueryExpander (PRF) → Expand with related terms
  ↓
[BM25Retriever, EmbeddingRetriever, HierarchyTraverser] (parallel)
  ↓
RRF fusion
  ↓
CrossEncoderReranker (optional) → Top-K precision boost
  ↓
MMR diversification
  ↓
HierarchySummarizer (RAPTOR) → Build multi-level context
  ↓
Dynamic excerpts
  ↓
CoursePromptBuilder
  ↓
LLM (with caching)
  ↓
GroundingVerifier
  ↓
Answer (with confidence + routing metadata)
```

---

## Implementation Roadmap

### Phase 2.1: Self-RAG (Adaptive Retrieval) - Days 1-2

**Files to Create:**
- `lib/retrieval/adaptive/ConfidenceScorer.ts`
- `lib/retrieval/adaptive/AdaptiveRouter.ts`
- `lib/retrieval/adaptive/types.ts`
- `lib/retrieval/adaptive/index.ts`

**Files to Modify:**
- `lib/context/CourseContextBuilder.ts` - Add confidence check
- `lib/models/types.ts` - Add confidence field to AIAnswer

**Verification:**
- Test confidence scores on 50 queries
- Measure cache hit improvement (expect 15%+ fewer retrievals)
- Validate routing accuracy (80%+ correct decisions)

### Phase 2.2: RAPTOR (Hierarchical Retrieval) - Days 3-4

**Files to Create:**
- `lib/retrieval/hierarchical/DocumentClusterer.ts`
- `lib/retrieval/hierarchical/HierarchySummarizer.ts`
- `lib/retrieval/hierarchical/HierarchyTraverser.ts`
- `lib/retrieval/hierarchical/types.ts`
- `lib/retrieval/hierarchical/index.ts`

**Files to Modify:**
- `lib/context/CourseContextBuilder.ts` - Use hierarchical context
- `lib/models/types.ts` - Add hierarchy metadata

**Verification:**
- Test hierarchy construction
- Measure context coherence improvement
- Validate summary quality (sample 10 clusters)

### Phase 2.3: PRF (Query Expansion) - Day 5

**Files to Create:**
- `lib/retrieval/expansion/QueryExpander.ts`
- `lib/retrieval/expansion/TermSelector.ts`
- `lib/retrieval/expansion/types.ts`
- `lib/retrieval/expansion/index.ts`

**Files to Modify:**
- `lib/retrieval/HybridRetriever.ts` - Expand query before retrieval
- `lib/retrieval/types.ts` - Add expansion metadata

**Verification:**
- Test expansion on 30 queries
- Measure retrieval improvement
- Validate no degradation on already-good queries

### Phase 2.4: Cross-Encoder Reranking - Day 6

**Files to Create:**
- `lib/retrieval/reranking/CrossEncoderReranker.ts`
- `lib/retrieval/reranking/types.ts`

**Files to Modify:**
- `lib/retrieval/HybridRetriever.ts` - Add optional reranking
- `lib/retrieval/types.ts` - Update HybridRetrievalConfig

**Verification:**
- Measure top-3 precision improvement
- Measure latency impact (<300ms)
- A/B test with/without reranking

### Phase 2.5: Integration & Testing - Day 7

**Tasks:**
- End-to-end pipeline testing
- Performance profiling
- Cost analysis
- Documentation updates
- Changelog updates

---

## Decisions

### PRF (Query Expansion) - Decided 2025-10-17

**Research:** `research/prf-patterns.md`
**Plan:** `plans/prf-design.md`

1. **PRF Algorithm:** Rocchio-based PRF (simple + effective, 10-15% improvement on TREC)
2. **Top-K Pseudo-Relevant Docs:** 5 documents (balance quality/speed)
3. **Max Expansion Terms:** 7 terms (TREC optimal range: 5-10)
4. **Min Term Score:** 0.3 (filter low-quality candidates)
5. **Term Extraction:** Query-biased TF-IDF (speed + quality balance)
6. **Term Selection:** Diversity-based with MMR (λ=0.7, reduce redundancy)
7. **Query Reformulation:** Hybrid strategy (adaptive: append/reweight/substitute based on query length + confidence)
8. **Expansion Threshold:** 0.65 confidence (expand if below)
9. **Original Query Weight:** 0.8 (favor original, prevent drift)
10. **Expansion Weight:** 0.2
11. **Cache Strategy:** 5-minute TTL, LRU eviction, max 1000 entries
12. **Expected Performance:** <100ms expansion overhead, 60%+ expansion rate, 10%+ coverage improvement

**Rationale:**
- Rocchio is well-established with proven effectiveness (vs RM3 which is complex/slow)
- Query-biased TF-IDF balances speed (no embeddings) and quality (maintains query focus)
- Diversity selection reduces redundant synonyms (e.g., "algorithm" + "algorithms")
- Hybrid reformulation adapts to query quality (short/vague → aggressive, long/specific → minimal)
- Caching is critical for <2s latency target (avoid recomputation)

### Self-RAG (Adaptive Retrieval) - Decided 2025-10-17

**Research:** `research/self-rag-patterns.md`
**Plan:** `plans/self-rag-design.md`

1. **Confidence Scoring Algorithm:** Ensemble of lexical (40%), semantic (40%), historical (20%) features
2. **Lexical Features:** Query length, specificity, course code detection, week numbers, technical terms, generic pronouns
3. **Semantic Features:** Keyword coverage (% query terms in corpus), ambiguity score, topic focus
4. **Historical Features:** Past query success, similarity to past queries, user topic familiarity, cache hit probability
5. **Confidence Thresholds:** High=80, Low=50 (medium is 50-79)
6. **Routing Actions:** use-cache (high+cache hit), retrieve-standard (high/medium), retrieve-expanded (medium), retrieve-aggressive (low)
7. **Cache Strategy:** Confidence-based TTL (high=24h, medium=12h, low=6h), LRU eviction, max 1000 entries
8. **Cache Key:** Normalized query + course context hash (deterministic)
9. **Fuzzy Matching:** Optional embedding similarity for cache lookup (cosine > 0.95)
10. **Performance Budget:** <50ms confidence scoring, <5ms routing decision, <5ms cache lookup
11. **Expected Metrics:** 80%+ routing accuracy, 60-80% cache hit rate, 80% cost savings from cache

**Rationale:**
- Heuristic-based confidence (not LLM-based) keeps latency <50ms and cost zero
- Ensemble scoring balances query quality signals (lexical + semantic + historical)
- Three-tier routing adapts to confidence (high=cache, medium=standard, low=aggressive)
- Confidence-based TTL optimizes cache freshness (high confidence = longer TTL)
- Cache hit rate 60-80% saves ~$0.002/query × 80% = massive cost reduction

### RAPTOR (Hierarchical Retrieval) - Decided 2025-10-17

**Research:** `research/raptor-patterns.md`
**Plan:** `plans/raptor-design.md`

1. **Clustering Algorithm:** Agglomerative hierarchical with average linkage (natural hierarchy, deterministic, good coherence)
2. **Distance Metric:** Cosine similarity on embeddings
3. **Stopping Criteria:** Distance threshold 0.5 (similarity < 0.5 = stop merging)
4. **Cluster Size:** Min 2, Max 7 (avoid singletons and giant clusters)
5. **Summarization:** Abstractive with LLM (Anthropic Claude 3.5 Sonnet)
6. **Summary Length:** 200-400 words per cluster
7. **Coherence Validation:** Embedding similarity between summary and cluster centroid (threshold 0.7)
8. **Fallback Strategy:** Extractive concatenation if LLM fails or coherence < 0.7
9. **Batching:** 5 clusters per batch (parallel LLM calls)
10. **Caching:** Summary cache (Map<clusterKey, summary>) with no TTL (summaries are deterministic)
11. **Traversal Strategy:** Top-down breadth-first with pruning (explore high-level first, prune irrelevant branches)
12. **Top-K Per Level:** 3 nodes (balance coverage vs performance)
13. **Min Relevance Score:** 0.6 (prune nodes below threshold)
14. **Hierarchy Depth:** Auto-stop when 1 cluster remains or max 10 levels
15. **Storage:** In-memory Map<courseId, HierarchyTree> (rebuild on material changes)
16. **Pre-computation:** Build hierarchy during material indexing (offline)
17. **Integration:** Augment HybridRetriever with hierarchy results (weight 0.3)
18. **Expected Performance:** <10s construction for 50 docs, <100ms traversal, +20% coherence on high-level queries

**Rationale:**
- Hierarchical clustering naturally produces tree structure (no recursion needed)
- Average linkage balances compact vs chain-like clusters
- Abstractive summaries are more coherent than extractive (worth LLM cost)
- Top-down traversal prunes early, reduces search space
- Pre-computation amortizes construction cost across many queries
- Hierarchy weight 0.3 complements BM25/embedding (not dominant)

**Key Decisions Remaining:**

4. **Reranker Model:** Which cross-encoder? (Propose: `ms-marco-MiniLM-L-6-v2`)

---

## Risks & Rollback

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Increased latency | Poor UX (>2s) | Medium | Aggressive caching, optional reranking, parallel ops |
| Higher LLM costs | Budget concerns | Low | Cache expanded queries, confidence routing saves calls |
| Complexity creep | Hard to maintain | Medium | Modular components, comprehensive documentation |
| Accuracy regression | Worse than Phase 1 | Low | A/B testing, rollback plan, feature flags |
| Memory usage spike | Browser crashes | Low | Lazy loading, cleanup old hierarchies, limits |

### Rollback

- Feature flags for each Phase 2 feature (can disable independently)
- Phase 1 system remains intact and functional
- No breaking changes to existing APIs
- Graceful degradation if features fail

---

## Related Files

**Phase 1 Foundation (Read-Only):**
- `lib/retrieval/BM25Retriever.ts` - Sparse retrieval
- `lib/retrieval/EmbeddingRetriever.ts` - Dense retrieval
- `lib/retrieval/HybridRetriever.ts` - RRF fusion (will modify)
- `lib/retrieval/MMRDiversifier.ts` - Diversification
- `lib/retrieval/types.ts` - Retrieval interfaces (will extend)
- `lib/context/CourseContextBuilder.ts` - Context building (will modify)
- `lib/models/types.ts` - Core types (will extend)

**Phase 2 New Files:**
- `lib/retrieval/adaptive/*` - Self-RAG implementation
- `lib/retrieval/hierarchical/*` - RAPTOR implementation
- `lib/retrieval/expansion/*` - PRF implementation
- `lib/retrieval/reranking/*` - Cross-encoder implementation

**Documentation:**
- `doccloud/tasks/rag-phase-2/USAGE.md` - Phase 2 usage guide (to create)
- `doccloud/tasks/rag-phase-2/QUICK-REFERENCE.md` - Phase 2 cheat sheet (to create)

---

## TODO

### Planning Phase (Days 0)
- [ ] Launch Type Safety Guardian for Self-RAG design
- [ ] Launch Type Safety Guardian for RAPTOR design
- [ ] Launch Type Safety Guardian for PRF design
- [ ] (Optional) Launch React Query Strategist for cache strategy
- [ ] Review all plans and resolve conflicts
- [ ] Document final decisions in this file

### Implementation Phase (Days 1-7)
- [ ] Implement Self-RAG (Days 1-2)
- [ ] Implement RAPTOR (Days 3-4)
- [ ] Implement PRF (Day 5)
- [ ] Implement Reranking (Day 6)
- [ ] Integration & Testing (Day 7)
- [ ] Update documentation
- [ ] Performance benchmarking
- [ ] Cost analysis
- [ ] A/B testing vs Phase 1 baseline

---

## Changelog

### 2025-10-17 - Task Created
- Created Phase 2 task structure
- Defined goals, scope, and acceptance criteria
- Identified key decisions and risks
- Ready to launch planning agents

---

## Agent Delegation Log

### Completed Agents

#### 1. Type Safety Guardian - PRF Design (2025-10-17)

**Deliverables:**
- `research/prf-patterns.md` - PRF algorithm research (Rocchio, RM3, Bo1), term extraction techniques, selection strategies, reformulation methods
- `plans/prf-design.md` - Complete implementation plan with TypeScript interfaces, class designs, integration plan, test strategy

**Summary:**
- **Algorithm:** Rocchio-based PRF (proven effective, 10-15% TREC improvement)
- **Term Extraction:** Query-biased TF-IDF (no embeddings needed, maintains query focus)
- **Term Selection:** Diversity-based MMR (λ=0.7, reduces redundant synonyms)
- **Reformulation:** Hybrid adaptive strategy (append/reweight/substitute based on query quality)
- **Two-Pass Retrieval:** First pass → extract terms → second pass with expanded query
- **Caching:** 5-min TTL, LRU eviction, max 1000 entries (critical for <2s latency)
- **Classes:** QueryExpander, TermExtractor, TermSelector, QueryReformulator
- **Files to Create:** `lib/retrieval/expansion/{types,QueryExpander,TermExtractor,TermSelector,QueryReformulator,index}.ts`
- **Files to Modify:** `lib/retrieval/HybridRetriever.ts` (two-pass flow), `lib/retrieval/types.ts` (expansion metadata)
- **Expected Metrics:** 60%+ expansion rate, 10%+ coverage improvement, <100ms overhead

**Decisions Updated in Context:** All PRF parameters finalized (see Decisions section)

**Status:** ✅ Planning complete. Ready for implementation.

#### 2. Type Safety Guardian - Self-RAG Design (2025-10-17)

**Deliverables:**
- `research/self-rag-patterns.md` - Self-RAG algorithm research, confidence scoring techniques, routing strategies, cache integration patterns
- `plans/self-rag-design.md` - Complete implementation plan with TypeScript interfaces, ConfidenceScorer class, AdaptiveRouter class, integration plan, test strategy

**Summary:**
- **Confidence Algorithm:** Ensemble scoring (lexical 40% + semantic 40% + historical 20%)
- **Lexical Features:** Query length, specificity, course codes, week numbers, technical terms, pronouns
- **Semantic Features:** Keyword coverage, ambiguity detection, topic focus
- **Historical Features:** Past query success, similarity matching, user familiarity, cache probability
- **Routing Strategy:** Three-tier (high=cache, medium=standard, low=aggressive retrieval)
- **Cache Design:** Confidence-based TTL (high=24h, medium=12h, low=6h), LRU eviction, normalized keys
- **Performance:** <50ms confidence scoring, <5ms routing, <5ms cache lookup
- **Classes:** ConfidenceScorer, AdaptiveRouter, SelfRAGMetrics
- **Files to Create:** `lib/retrieval/adaptive/{types,ConfidenceScorer,AdaptiveRouter,utils,metrics,index}.ts`
- **Files to Modify:** `lib/context/CourseContextBuilder.ts` (integrate Self-RAG), `lib/models/types.ts` (add confidenceMetadata)
- **Expected Metrics:** 80%+ routing accuracy, 60-80% cache hit rate, 80% cost savings

**Decisions Updated in Context:** All Self-RAG parameters finalized (see Decisions section)

**Status:** ✅ Planning complete. Ready for implementation.

#### 3. Type Safety Guardian - RAPTOR Design (2025-10-17)

**Deliverables:**
- `research/raptor-patterns.md` - RAPTOR algorithm research, clustering techniques comparison, summarization strategies, traversal algorithms
- `plans/raptor-design.md` - Complete implementation plan with TypeScript interfaces, DocumentClusterer class, HierarchySummarizer class, HierarchyTraverser class, HierarchyBuilder orchestrator, integration plan, test strategy

**Summary:**
- **Algorithm:** RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval) with multi-level document hierarchy
- **Clustering:** Agglomerative hierarchical with average linkage, cosine similarity, distance threshold 0.5
- **Cluster Constraints:** Min size 2, max size 7 (balanced, coherent clusters)
- **Summarization:** Abstractive with LLM (Claude 3.5 Sonnet), 200-400 words, batched (5 per batch)
- **Coherence Validation:** Embedding similarity > 0.7 (fallback to extractive if low)
- **Traversal:** Top-down breadth-first with pruning, top-K=3 per level, min relevance 0.6
- **Storage:** In-memory Map<courseId, HierarchyTree>, pre-computed during indexing
- **Classes:** DocumentClusterer, HierarchySummarizer, HierarchyTraverser, HierarchyBuilder
- **Files to Create:** `lib/retrieval/hierarchical/{types,DocumentClusterer,HierarchySummarizer,HierarchyTraverser,HierarchyBuilder,index}.ts`
- **Files to Modify:** `lib/retrieval/HybridRetriever.ts` (add hierarchy results), `lib/retrieval/types.ts` (hierarchy config), `lib/context/CourseContextBuilder.ts` (build hierarchies)
- **Expected Metrics:** <10s construction for 50 docs, <100ms traversal, +20% coherence on high-level queries

**Decisions Updated in Context:** All RAPTOR parameters finalized (see Decisions section)

**Status:** ✅ Planning complete. Ready for implementation.

### Pending Agents

4. **React Query Strategist** - Cache strategy (optional, may skip - Self-RAG handles caching)

---

**Status:** All core Phase 2 planning complete (Self-RAG, PRF, RAPTOR). Ready to begin implementation or review plans.

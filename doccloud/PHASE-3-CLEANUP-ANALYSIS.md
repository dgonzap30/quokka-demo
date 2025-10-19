# Phase 3 Cleanup Analysis: Retrieval Systems & Prompt Templates

**Date:** 2025-10-19
**Status:** Analysis Complete
**Scope:** lib/retrieval/, lib/llm/prompts/

---

## Executive Summary

Analysis revealed **~2,020 lines of sophisticated but unused RAG enhancement code** across three major systems:

1. **Prompt Templates** (280 lines) - Course-specific prompts never integrated
2. **Self-RAG Adaptive Routing** (550 lines) - Confidence-based routing with 80% cost savings potential
3. **RAPTOR Hierarchical Retrieval** (800 lines) - Tree-based retrieval never wired up
4. **Query Expansion (PRF)** (390 lines) - Pseudo-relevance feedback unused

**Directory Impact:**
- `lib/retrieval/`: 180KB (includes 3 unused subsystems)
- `lib/llm/prompts/`: 32KB (templates + builder unused)

**Production Stack (What's Actually Used):**
- ✅ Vercel AI SDK (`streamText`, tools)
- ✅ RAG tools (`kb_search`, `kb_fetch`)
- ✅ HybridRetriever (BM25 + embeddings + RRF + MMR)
- ✅ Basic system prompts via `buildSystemPrompt`

---

## System 1: Prompt Templates (UNUSED)

### What They Are

Course-specific prompt templates that adapt the AI's teaching style based on subject:

```typescript
// lib/llm/prompts/templates.ts
export const CS_TEMPLATE: PromptTemplate = {
  subject: "Computer Science",
  systemPrompt: `You are Quokka, specializing in Computer Science...
    Teaching Style:
    - Break down complex algorithms into clear steps
    - Provide code examples with inline comments
    - Emphasize best practices, time/space complexity
    - Use analogies for abstract concepts`,
  formattingGuidelines: `
    - Use syntax-highlighted code blocks
    - State time complexity with Big O notation
    - Include test cases and example inputs/outputs`,
  examples: `...binary search example...`
};

export const MATH_TEMPLATE = { /* LaTeX, step-by-step proofs */ };
export const GENERAL_TEMPLATE = { /* Generic academic support */ };
```

### Key Components

| File | Lines | Purpose | Used? |
|------|-------|---------|-------|
| `templates.ts` | 280 | CS, Math, General templates | ❌ No |
| `CoursePromptBuilder.ts` | 165 | Builds prompts from templates | ❌ No |
| `detectCourseTemplate()` | Function | Auto-detects subject from course code | ❌ No |

### Detection Logic

```typescript
function detectCourseTemplate(course: Course): PromptTemplate {
  if (courseCode.startsWith("cs") || courseName.includes("algorithm"))
    return CS_TEMPLATE;

  if (courseCode.startsWith("math") || courseName.includes("calculus"))
    return MATH_TEMPLATE;

  return GENERAL_TEMPLATE;
}
```

### Current Usage

**Search Results:**
```bash
$ grep -r "CoursePromptBuilder|detectCourseTemplate|buildPromptPair" app/
# No results - NEVER imported in app/ routes
```

**Reality:**
- Production uses generic `buildSystemPrompt()` from `lib/llm/utils.ts`
- No course-specific customization
- Templates sit unused despite being well-designed

### Value Assessment

**Potential Benefits:**
- Better code examples for CS courses (syntax-highlighted, complexity analysis)
- Step-by-step math solutions with LaTeX
- Subject-appropriate teaching styles
- Improved student learning outcomes

**Complexity:**
- 445 lines total (templates + builder)
- Requires course detection integration
- Minimal API changes needed

**Decision Options:**
1. **Remove** - Save 445 lines, acknowledge generic prompts work fine
2. **Integrate** - Wire up in `/api/chat` and `/api/answer` routes
3. **Defer** - Keep for future enhancement, document as "planned feature"

---

## System 2: Self-RAG Adaptive Routing (UNUSED)

### What It Is

Confidence-based query routing with caching for cost optimization:

```
Query → Confidence Score → Routing Decision
                             ↓
            ┌────────────────┼─────────────────┐
            ↓                ↓                 ↓
    High (80+%)      Medium (50-79%)    Low (<50%)
    Use Cache        Standard Search    Aggressive Search
    (if available)   (BM25 + embeddings) (3x materials, expanded)
```

### Architecture

**Three-Tier Routing Strategy:**

```typescript
// lib/retrieval/adaptive/AdaptiveRouter.ts
const action = determineAction(confidenceScore);

switch (confidenceScore.level) {
  case "high":   // 80+: Cache or standard retrieval
  case "medium": // 50-79: Standard or expanded retrieval
  case "low":    // <50: Aggressive retrieval (3x materials)
}
```

**Confidence Scoring Factors:**

```typescript
// lib/retrieval/adaptive/ConfidenceScorer.ts
class ConfidenceScorer {
  scoreQuery(query: string, history?: QueryHistoryEntry[]): ConfidenceScore {
    // Factors:
    // 1. Query length & structure (questions vs statements)
    // 2. Technical term density (corpus TF-IDF)
    // 3. Corpus coverage (% query terms in materials)
    // 4. Historical patterns (if similar queries succeeded)

    return {
      score: 0-100,
      level: "high" | "medium" | "low",
      factors: { queryStructure, termCoverage, historicalSuccess }
    };
  }
}
```

### Key Components

| File | Lines | Purpose | Used? |
|------|-------|---------|-------|
| `AdaptiveRouter.ts` | 379 | Routes based on confidence | ❌ No |
| `ConfidenceScorer.ts` | ~150 | Scores query confidence | ❌ No |
| `types.ts` | ~80 | Type definitions | ❌ No |

**Total: ~550 lines**

### Integration Status

**Feature Flag Exists:**

```typescript
// lib/context/CourseContextBuilder.ts (line 50)
private enableAdaptiveRouting: boolean = false;

constructor(course, materials, options) {
  this.enableAdaptiveRouting = options?.enableAdaptiveRouting ?? false; // ← NEVER true

  if (this.enableAdaptiveRouting) {
    this.confidenceScorer = new ConfidenceScorer();
    this.adaptiveRouter = new AdaptiveRouter(this.confidenceScorer);
  }
}
```

**Problem:**
- `CourseContextBuilder` is **NEVER instantiated** in production
- API routes use `kb_search` and `kb_fetch` tools directly
- No path to enable the feature flag

### Claimed Benefits (from design docs)

**From `doccloud/tasks/rag-phase-2/plans/self-rag-design.md`:**

> **80% Cost Savings via Caching**
> - High-confidence queries (e.g., "What is quicksort?") → Cache hit after first ask
> - Medium-confidence queries → Standard retrieval
> - Low-confidence queries → Aggressive retrieval with expansion

**Metrics Tracking:**

```typescript
type SelfRAGMetrics = {
  routing: {
    cacheHits: number;        // Queries served from cache
    standardRetrievals: number;
    expandedRetrievals: number;
    aggressiveRetrievals: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;         // Cache effectiveness
    size: number;
  };
  costSavings: {
    queriesSaved: number;
    estimatedDollarsSaved: number; // Rough: $0.001 per query
  };
};
```

### Value Assessment

**Potential Benefits:**
- 80% cost reduction for repeated queries (e.g., "What is binary search?")
- Adaptive retrieval depth (low-confidence → 3x materials)
- Query confidence metrics for monitoring
- Cache hit rate tracking

**Complexity:**
- 550 lines of sophisticated logic
- Requires CourseContextBuilder integration
- Needs cache invalidation strategy
- May be overkill for current scale

**Decision Options:**
1. **Remove** - Save 550 lines, acknowledge caching not needed yet
2. **Integrate** - Refactor API routes to use CourseContextBuilder with flag
3. **Defer** - Keep for when scale demands caching

---

## System 3: RAPTOR Hierarchical Retrieval (UNUSED)

### What It Is

**RAPTOR** (Recursive Abstractive Processing for Tree-Organized Retrieval) builds a multi-level tree of course materials where:
- **Leaf nodes** = Original course materials (lectures, readings)
- **Internal nodes** = AI-generated summaries of child clusters
- **Tree traversal** = Retrieve at multiple levels for broader context

```
                    [Root: CS101 Summary]
                     /                 \
        [Weeks 1-4 Summary]      [Weeks 5-8 Summary]
         /          \              /           \
    [Week 1-2]   [Week 3-4]   [Week 5-6]   [Week 7-8]
     /    \       /    \       /    \       /    \
  L1  L2  L3  L4  L5  L6  L7  L8  L9  L10  L11  L12

  L = Leaf (lecture, reading, etc.)
```

### Algorithm

```typescript
// lib/retrieval/hierarchical/HierarchyBuilder.ts
class HierarchyBuilder {
  async buildHierarchy(materials: CourseMaterial[]): Promise<HierarchyTree> {
    // 1. Create leaf nodes from materials
    let currentLevel = createLeafNodes(materials);

    // 2. Iteratively build hierarchy
    while (currentLevel.length >= minNodesPerLevel && level < maxLevels) {
      // a. Cluster nodes using k-means on embeddings
      const clusters = this.clusterer.clusterDocuments(currentLevel);

      // b. For each cluster, generate summary via LLM
      for (const cluster of clusters) {
        const summary = await this.summarizer.summarizeCluster(cluster);
        const internalNode = createInternalNode(cluster, summary);
        nextLevel.push(internalNode);
      }

      currentLevel = nextLevel;
      level++;
    }

    // 3. Return tree with parent-child links
    return buildTree(leafNodes, internalNodes);
  }
}
```

### Key Components

| File | Lines | Purpose | Used? |
|------|-------|---------|-------|
| `HierarchyBuilder.ts` | 332 | Builds RAPTOR tree | ❌ No |
| `DocumentClusterer.ts` | ~200 | K-means clustering | ❌ No |
| `HierarchySummarizer.ts` | ~200 | LLM-based summarization | ❌ No |
| `HierarchyTraverser.ts` | ~150 | Tree search | ❌ No |
| `types.ts` | ~50 | Type definitions | ❌ No |

**Total: ~800 lines**

### Design Features

**From `doccloud/tasks/rag-phase-2/plans/raptor-design.md`:**

1. **Clustering Algorithm:** K-means on document embeddings
2. **Summarization:** LLM generates concise summaries of each cluster
3. **Tree Search:** Multi-level retrieval (can fetch from level 0, 1, or 2)
4. **Benefits:**
   - Broader context for ambiguous queries (search higher levels)
   - Faster search for specific queries (search leaf level only)
   - Better understanding of course structure

**Example Use Case:**

```typescript
// Student asks: "What topics were covered in the first month?"
// Traditional retrieval: Returns individual lectures
// RAPTOR retrieval: Returns "Weeks 1-4 Summary" internal node
//                  → Gives cohesive overview instead of fragments
```

### Current Usage

**Search Results:**
```bash
$ grep -r "HierarchyBuilder|HierarchyTraverser|buildHierarchy" app/ lib/
# Only found in:
# - lib/retrieval/hierarchical/ (definitions)
# - doccloud/tasks/rag-phase-2/ (design docs)
# - NO production usage
```

**Reality:**
- Tree never built
- Traversal logic never called
- Complex system with no integration path

### Value Assessment

**Potential Benefits:**
- Better handling of broad queries ("What did we cover this month?")
- Course structure understanding
- Multi-granularity retrieval (leaf vs internal nodes)

**Complexity:**
- 800 lines of hierarchical logic
- Requires LLM calls for summarization (cost)
- Embedding generation for all materials
- Tree maintenance on material updates
- High implementation overhead

**Decision Options:**
1. **Remove** - Save 800 lines, acknowledge flat retrieval works well
2. **Research** - Study if hierarchical helps for academic Q&A
3. **Defer** - Archive for future research project

---

## System 4: Query Expansion (PRF) (UNUSED)

### What It Is

**Pseudo-Relevance Feedback (PRF)** using Rocchio algorithm:

```
Original Query: "binary search"
                ↓
Step 1: Initial search → Top 3 results
Step 2: Extract terms from top results
        → ["algorithm", "divide", "conquer", "log", "sorted"]
Step 3: Compute TF-IDF weights for candidate terms
Step 4: Select top N terms using MMR (relevance + diversity)
Expanded Query: "binary search algorithm divide conquer sorted"
                ↓
Step 5: Re-search with expanded query → Better recall
```

### Algorithm

```typescript
// lib/retrieval/expansion/QueryExpander.ts
class QueryExpander {
  expandQuery(query: string, topKMaterials: CourseMaterial[]): QueryExpansionResult {
    // 1. Extract candidate terms from top-K retrieved materials
    const candidateTerms = extractCandidateTerms(query, topKMaterials);

    // 2. Compute term weights using TF-IDF or query-biased scoring
    const weightedTerms = computeWeights(candidateTerms, this.config.termWeighting);

    // 3. Select expansion terms using MMR (Maximal Marginal Relevance)
    //    MMR balances relevance and diversity:
    //    Score(term) = λ * relevance - (1-λ) * similarity(term, selected)
    const expansionTerms = selectWithMMR(weightedTerms, this.config.expansionTerms);

    // 4. Append to original query
    return `${query} ${expansionTerms.join(" ")}`;
  }
}
```

### Key Components

| File | Lines | Purpose | Used? |
|------|-------|---------|-------|
| `QueryExpander.ts` | 387 | Rocchio algorithm, MMR | ❌ No |
| `types.ts` | ~50 | Type definitions | ❌ No |

**Total: ~390 lines**

### Design Features

**From `doccloud/tasks/rag-phase-2/plans/prf-design.md`:**

**Term Weighting Options:**
- `tfidf`: Standard TF-IDF weights
- `query-biased`: Boost terms appearing in multiple relevant docs
- `bm25`: Simplified BM25 scoring

**MMR Selection:**
- Prevents adding similar expansion terms
- Balances relevance and diversity
- Configurable λ parameter (default: 0.7)

**Example:**

```typescript
// Query: "quicksort"
// Top result mentions: "quicksort", "pivot", "partition", "divide-and-conquer", "recursive"
// Candidate terms: ["pivot", "partition", "divide-and-conquer", "recursive"]
// MMR selects: ["pivot", "divide-and-conquer"] (diverse, relevant)
// Expanded query: "quicksort pivot divide-and-conquer"
```

### Current Usage

**Search Results:**
```bash
$ grep -r "QueryExpander|expandQuery" app/ lib/context lib/api
# Only found in:
# - lib/retrieval/expansion/ (definitions)
# - doccloud/ (design docs)
# - NO production usage
```

**Reality:**
- Never instantiated
- No integration with HybridRetriever
- Well-designed but orphaned

### Value Assessment

**Potential Benefits:**
- Improved recall for sparse queries ("quicksort" → adds "pivot", "partition")
- Handles vocabulary mismatch (student says "fast sort" → adds "quicksort")
- Automatic query refinement

**Complexity:**
- 390 lines of expansion logic
- Requires corpus statistics (IDF computation)
- Needs integration with retrieval pipeline
- Risk of query drift (adding irrelevant terms)

**Decision Options:**
1. **Remove** - Save 390 lines, acknowledge embeddings handle vocabulary mismatch
2. **Integrate** - Add to HybridRetriever as optional expansion step
3. **Defer** - Keep for when recall issues arise

---

## Production Stack (What's Actually Used)

### Current Architecture

```
User Question
      ↓
  /api/chat (Vercel AI SDK)
      ↓
  streamText({ tools: ragTools })
      ↓
  ┌─────────────────────────────┐
  │ kb_search Tool              │
  │ - Calls handleKBSearch()    │
  │ - Uses HybridRetriever      │
  │   - BM25Retriever (sparse)  │
  │   - EmbeddingRetriever (dense)│
  │   - RRF Fusion              │
  │   - MMR Diversification     │
  │ - Returns top-k materials   │
  └─────────────────────────────┘
      ↓
  LLM generates response with citations
      ↓
  StreamingTextResponse
```

### Active Components

| Component | Lines | Purpose | Status |
|-----------|-------|---------|--------|
| `app/api/chat/route.ts` | 160 | Streaming chat endpoint | ✅ Used |
| `lib/llm/tools/index.ts` | 121 | kb_search, kb_fetch | ✅ Used |
| `lib/llm/tools/handlers.ts` | ~300 | Tool execution logic | ✅ Used |
| `HybridRetriever.ts` | 269 | BM25 + embeddings + RRF | ✅ Used |
| `BM25Retriever.ts` | ~200 | Sparse retrieval | ✅ Used |
| `EmbeddingRetriever.ts` | ~150 | Dense retrieval | ✅ Used |
| `MMRDiversifier.ts` | ~100 | Reduce redundancy | ✅ Used |
| `buildSystemPrompt()` | Function | Generic system prompt | ✅ Used |

**Total Active: ~1,300 lines**

### Why It Works Well

1. **Hybrid Retrieval:** Combines BM25 (exact matches) + embeddings (semantic)
2. **RRF Fusion:** Rank-based fusion (no score normalization headaches)
3. **MMR:** Reduces redundant materials in results
4. **Tool-Based:** LLM decides when to search (not every message)
5. **Simple:** No complex caching, routing, or hierarchies

---

## Cleanup Recommendations

### Option A: Aggressive Cleanup (Recommended)

**Remove all unused systems.**

**What to Delete:**

```bash
# Prompt Templates (445 lines)
rm lib/llm/prompts/templates.ts
rm lib/llm/prompts/CoursePromptBuilder.ts
# Keep: schemas.ts, index.ts (update exports)

# Self-RAG Adaptive Routing (550 lines)
rm -rf lib/retrieval/adaptive/

# RAPTOR Hierarchical (800 lines)
rm -rf lib/retrieval/hierarchical/

# Query Expansion (390 lines)
rm -rf lib/retrieval/expansion/

# Context Builders (unused)
rm lib/context/CourseContextBuilder.ts
rm lib/context/MultiCourseContextBuilder.ts
# Keep: index.ts (update exports)
```

**Total Removed: ~2,185 lines**

**Benefits:**
- Simpler codebase (52 TypeScript files → ~35 files)
- Reduced maintenance burden
- Clearer architecture (production = Vercel AI SDK + HybridRetriever)
- Smaller bundle size

**Risks:**
- Loss of sophisticated features (can restore from git)
- May regret if scale demands caching/hierarchies
- Effort spent on design (sunk cost fallacy)

**Mitigation:**
- Archive design docs in `doccloud/archive/rag-advanced-systems.md`
- Keep git history for reference
- Re-evaluate if performance issues arise

---

### Option B: Selective Integration

**Keep systems that provide immediate value, remove others.**

**Integrate:**

1. **Prompt Templates** (445 lines)
   - **Effort:** Low (1-2 hours)
   - **Value:** High (better teaching for CS/Math courses)
   - **Changes:**
     ```typescript
     // app/api/chat/route.ts
     import { buildPromptPair } from '@/lib/llm/prompts';

     const course = await api.getCourse(courseId);
     const { systemPrompt } = buildPromptPair(course, userMessage, null);

     const result = streamText({
       model,
       messages: [{ role: 'system', content: systemPrompt }, ...messages],
       tools: ragTools,
     });
     ```

**Remove:**

2. **Self-RAG Adaptive Routing** (550 lines)
   - **Reason:** Caching not needed at current scale
   - **Restore if:** Query volume >10k/day or costs spike

3. **RAPTOR Hierarchical** (800 lines)
   - **Reason:** Flat retrieval sufficient for current queries
   - **Restore if:** Users complain about broad query handling

4. **Query Expansion** (390 lines)
   - **Reason:** Embeddings already handle vocabulary mismatch
   - **Restore if:** Recall metrics drop below 70%

**Total Removed: ~1,740 lines**
**Total Integrated: 445 lines**

---

### Option C: Documentation Only (Defer Decision)

**Keep all systems, document as "planned features."**

**Actions:**

1. Update `doccloud/AI-SDK-ARCHITECTURE.md` with section:
   ```markdown
   ## Advanced Features (Not Yet Integrated)

   ### Prompt Templates
   Status: Ready, needs API route integration
   Effort: 1-2 hours
   Value: Better teaching for CS/Math courses

   ### Self-RAG Adaptive Routing
   Status: Ready, needs CourseContextBuilder wiring
   Effort: 4-6 hours
   Value: 80% cost savings via caching

   ### RAPTOR Hierarchical
   Status: Ready, needs research on academic Q&A
   Effort: 8-12 hours
   Value: Better broad query handling

   ### Query Expansion
   Status: Ready, needs HybridRetriever integration
   Effort: 2-3 hours
   Value: Improved recall for sparse queries
   ```

2. Add `lib/README.md` with feature flags:
   ```markdown
   ## Feature Flags

   - `USE_PROMPT_TEMPLATES`: Enable course-specific prompts
   - `ENABLE_SELF_RAG`: Enable adaptive routing with caching
   - `ENABLE_HIERARCHICAL_RETRIEVAL`: Enable RAPTOR tree search
   - `ENABLE_QUERY_EXPANSION`: Enable PRF query expansion
   ```

**Benefits:**
- No code deletion
- Options preserved for future
- Clear documentation of what's available

**Risks:**
- Dead code continues to confuse
- Maintenance burden remains
- Bundle size stays large

---

## Decision Matrix

| Criterion | Option A (Remove) | Option B (Selective) | Option C (Defer) |
|-----------|-------------------|----------------------|------------------|
| **Code Reduction** | -2,185 lines | -1,740 lines | 0 lines |
| **Maintenance** | ✅ Low | ⚠️ Medium | ❌ High |
| **Flexibility** | ⚠️ Must restore from git | ✅ Best of both | ✅ All options open |
| **Clarity** | ✅ Production = what's used | ⚠️ Mixed | ❌ Confusing |
| **Time to Execute** | 1-2 hours | 3-4 hours | 30 minutes |
| **Risk** | ⚠️ May need features later | ✅ Balances needs | ⚠️ Technical debt |

---

## Recommended Action Plan

### Phase 3A: Aggressive Cleanup (Recommended)

**Rationale:**
- Current production stack (HybridRetriever + Vercel AI SDK) is working well
- No performance issues requiring caching or hierarchies
- Unused code creates confusion and maintenance burden
- All systems can be restored from git if needed

**Execution Steps:**

1. **Create Archive Document** (30 minutes)
   ```bash
   cp doccloud/AI-SDK-ARCHITECTURE.md doccloud/archive/
   # Add section documenting deleted systems with git commit references
   ```

2. **Delete Unused Systems** (1 hour)
   ```bash
   git rm -rf lib/retrieval/adaptive/
   git rm -rf lib/retrieval/hierarchical/
   git rm -rf lib/retrieval/expansion/
   git rm lib/llm/prompts/templates.ts
   git rm lib/llm/prompts/CoursePromptBuilder.ts
   git rm lib/context/CourseContextBuilder.ts
   git rm lib/context/MultiCourseContextBuilder.ts
   ```

3. **Update Exports** (30 minutes)
   ```typescript
   // lib/retrieval/index.ts - remove adaptive, hierarchical, expansion exports
   // lib/llm/prompts/index.ts - remove template exports
   // lib/context/index.ts - remove context builder exports
   ```

4. **Update Documentation** (30 minutes)
   - Add "Deleted Systems" section to `doccloud/AI-SDK-ARCHITECTURE.md`
   - List git commits where systems can be restored
   - Document decision rationale

5. **Test & Commit** (30 minutes)
   ```bash
   npm run build  # Verify no import errors
   npm run dev    # Test /api/chat still works
   git commit -m "refactor: Phase 3 cleanup - remove 2,185 lines of unused RAG systems"
   ```

**Total Time: 3-4 hours**

---

## Conclusion

The codebase contains **~2,185 lines of sophisticated but unused RAG enhancement code**. While these systems showcase advanced research (RAPTOR, Self-RAG, PRF), they add complexity without current value.

**Recommendation:** Execute **Phase 3A (Aggressive Cleanup)** to:
- Remove unused prompt templates, Self-RAG, RAPTOR, and query expansion
- Reduce codebase from 52 to ~35 TypeScript files
- Improve maintainability and clarity
- Archive systems for future restoration if needed

**Fallback:** If stakeholders disagree, execute **Option C (Documentation Only)** to defer decision while improving clarity.

---

**Next Steps:**
1. Review this analysis with team
2. Choose cleanup option (A, B, or C)
3. Execute cleanup plan
4. Update architecture documentation
5. Close Phase 3

**Files to Review:**
- `lib/retrieval/adaptive/` (Self-RAG)
- `lib/retrieval/hierarchical/` (RAPTOR)
- `lib/retrieval/expansion/` (Query Expansion)
- `lib/llm/prompts/templates.ts` (Prompt Templates)
- `lib/context/CourseContextBuilder.ts` (Integration point)

**Git Archaeology:**
```bash
# When systems were added:
git log --oneline --all -- lib/retrieval/adaptive/
git log --oneline --all -- lib/retrieval/hierarchical/
git log --oneline --all -- lib/retrieval/expansion/
git log --oneline --all -- lib/llm/prompts/templates.ts
```

# PRF Query Expansion - Implementation Plan

**Created:** 2025-10-17
**Agent:** Type Safety Guardian
**Phase:** RAG Phase 2.3 - Query Expansion
**Research:** See `research/prf-patterns.md`

---

## Design Overview

Implement a Rocchio-based Pseudo-Relevance Feedback (PRF) system that expands queries with relevant terms extracted from top initial retrieval results. The system will use a two-pass retrieval strategy:

1. **First Pass:** Retrieve top-K pseudo-relevant documents with original query
2. **Term Extraction:** Extract and score candidate expansion terms from top-K
3. **Term Selection:** Select best expansion terms (diversity-based)
4. **Query Reformulation:** Combine original + expansion terms (hybrid strategy)
5. **Second Pass:** Retrieve with expanded query

**Target Metrics (from context.md):**
- Expand **60%+** of queries
- Improve **query coverage by 10%+** (more terms matched)
- Maintain **<2s total latency** (expansion + retrieval)
- Cache expanded queries to avoid recomputation

---

## TypeScript Interface Definitions

### File: `lib/retrieval/expansion/types.ts`

```typescript
// ============================================
// PRF Query Expansion Types
// ============================================

import type { RetrievalResult } from "@/lib/retrieval/types";

/**
 * Expansion term with score and metadata
 *
 * Represents a candidate term for query expansion
 * extracted from pseudo-relevant documents.
 */
export interface ExpansionTerm {
  /** The term itself */
  term: string;

  /** Relevance score (0-1, higher = more relevant) */
  score: number;

  /** Source document IDs where this term appeared */
  sourceDocIds: string[];

  /** Frequency in pseudo-relevant set */
  frequency: number;

  /** TF-IDF score in pseudo-relevant set */
  tfidfScore: number;

  /** Optional: Similarity to original query (if using embeddings) */
  querySimilarity?: number;
}

/**
 * Expanded query with metadata
 *
 * Result of query expansion process, ready for retrieval.
 */
export interface ExpandedQuery {
  /** Original query string */
  original: string;

  /** Selected expansion terms */
  expansionTerms: ExpansionTerm[];

  /** Reformulated query string */
  reformulated: string;

  /** Reformulation strategy used */
  strategy: "append" | "reweight" | "substitute" | "none";

  /** Metadata about expansion process */
  metadata: {
    /** Whether expansion was performed */
    expanded: boolean;

    /** Number of candidate terms considered */
    candidateCount: number;

    /** Initial retrieval confidence score (0-1) */
    initialConfidence: number;

    /** Number of pseudo-relevant docs used */
    pseudoRelevantCount: number;

    /** Time spent on expansion (ms) */
    expansionTime: number;

    /** Cache hit (if from cache) */
    cacheHit?: boolean;
  };
}

/**
 * PRF configuration
 *
 * Parameters for query expansion system.
 */
export interface PRFConfig {
  /** Number of top documents to consider pseudo-relevant (default: 3-5) */
  topK: number;

  /** Maximum expansion terms to add (default: 5-7) */
  maxExpansionTerms: number;

  /** Minimum term score threshold (0-1, default: 0.3) */
  minTermScore: number;

  /** PRF method to use (default: "rocchio") */
  method: "rocchio" | "rm3" | "bo1";

  /** Original query weight in reformulation (default: 0.8) */
  originalWeight: number;

  /** Expansion terms weight in reformulation (default: 0.2) */
  expansionWeight: number;

  /** Confidence threshold for expansion decision (default: 0.65) */
  expansionThreshold: number;

  /** Enable query caching (default: true) */
  enableCache: boolean;

  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL: number;

  /** Enable diversity-based term selection (default: true) */
  useDiversity: boolean;

  /** Diversity lambda parameter (0-1, default: 0.7) */
  diversityLambda: number;
}

/**
 * Term extraction result
 *
 * Output from term extraction phase.
 */
export interface TermExtractionResult {
  /** Extracted terms with scores */
  terms: ExpansionTerm[];

  /** Source document ID */
  sourceDocId: string;

  /** Extraction method used */
  method: "tfidf" | "query-biased";

  /** Extraction time (ms) */
  extractionTime: number;
}

/**
 * Query expansion cache entry
 *
 * Cached expanded query with timestamp.
 */
export interface QueryCacheEntry {
  /** Cache key (query hash) */
  key: string;

  /** Expanded query */
  expandedQuery: ExpandedQuery;

  /** Timestamp when cached */
  cachedAt: number;

  /** TTL in milliseconds */
  ttl: number;
}

/**
 * Expansion decision result
 *
 * Decision whether to expand query and why.
 */
export interface ExpansionDecision {
  /** Whether to expand */
  shouldExpand: boolean;

  /** Confidence score from initial retrieval (0-1) */
  confidence: number;

  /** Query length (word count) */
  queryLength: number;

  /** Reason for decision */
  reason: string;

  /** Decision factors */
  factors: {
    shortQuery: boolean;      // < 4 words
    lowConfidence: boolean;   // < threshold
    poorCoverage: boolean;    // Low term overlap with results
  };
}
```

---

## Class Designs

### 1. QueryExpander Class

**File:** `lib/retrieval/expansion/QueryExpander.ts`

**Responsibility:** Orchestrate query expansion process

**Signature:**
```typescript
export class QueryExpander {
  private config: Required<PRFConfig>;
  private termExtractor: TermExtractor;
  private termSelector: TermSelector;
  private queryCache: Map<string, QueryCacheEntry>;

  constructor(config?: Partial<PRFConfig>);

  /**
   * Expand query using PRF
   *
   * @param query - Original query string
   * @param initialResults - Top-K results from first retrieval pass
   * @returns Expanded query with metadata
   */
  async expand(
    query: string,
    initialResults: RetrievalResult[]
  ): Promise<ExpandedQuery>;

  /**
   * Extract pseudo-relevant documents from initial results
   *
   * @param results - Initial retrieval results
   * @param k - Number of top docs to consider
   * @returns Top-K pseudo-relevant results
   */
  extractPseudoRelevantDocs(
    results: RetrievalResult[],
    k: number
  ): RetrievalResult[];

  /**
   * Decide whether to expand query
   *
   * @param query - Original query
   * @param initialResults - Initial retrieval results
   * @returns Expansion decision with reasoning
   */
  shouldExpand(
    query: string,
    initialResults: RetrievalResult[]
  ): ExpansionDecision;

  /**
   * Get expanded query from cache
   *
   * @param query - Query to look up
   * @returns Cached result or null
   */
  private getCachedQuery(query: string): ExpandedQuery | null;

  /**
   * Cache expanded query
   *
   * @param query - Original query
   * @param expandedQuery - Expanded query to cache
   */
  private cacheQuery(query: string, expandedQuery: ExpandedQuery): void;

  /**
   * Clear expired cache entries
   */
  private cleanCache(): void;

  /**
   * Hash query for cache key
   */
  private hashQuery(query: string): string;

  /**
   * Get configuration
   */
  getConfig(): PRFConfig;

  /**
   * Update configuration
   */
  setConfig(config: Partial<PRFConfig>): void;
}
```

**Implementation Notes:**
- Default config values from research (topK: 5, maxTerms: 7, threshold: 0.65)
- Cache uses LRU eviction (max 1000 entries)
- Cache cleanup runs on every 10th expansion call
- Query hash uses simple MD5 of normalized query string

---

### 2. TermExtractor Class

**File:** `lib/retrieval/expansion/TermExtractor.ts`

**Responsibility:** Extract and score candidate terms from pseudo-relevant docs

**Signature:**
```typescript
export class TermExtractor {
  private corpusStats: CorpusStats;

  constructor(corpusStats: CorpusStats);

  /**
   * Extract terms from pseudo-relevant documents
   *
   * @param query - Original query
   * @param pseudoRelevantDocs - Top-K pseudo-relevant results
   * @param method - Extraction method
   * @returns Extracted terms with scores
   */
  extractTerms(
    query: string,
    pseudoRelevantDocs: RetrievalResult[],
    method: "tfidf" | "query-biased"
  ): TermExtractionResult[];

  /**
   * Score term using TF-IDF in pseudo-relevant set
   *
   * @param term - Term to score
   * @param pseudoRelevantDocs - Pseudo-relevant documents
   * @returns TF-IDF score
   */
  private scoreTFIDF(
    term: string,
    pseudoRelevantDocs: RetrievalResult[]
  ): number;

  /**
   * Score term using query-biased approach
   *
   * Combines TF-IDF with query term similarity.
   *
   * @param term - Term to score
   * @param query - Original query
   * @param pseudoRelevantDocs - Pseudo-relevant documents
   * @returns Query-biased score
   */
  private scoreQueryBiased(
    term: string,
    query: string,
    pseudoRelevantDocs: RetrievalResult[]
  ): number;

  /**
   * Tokenize text (same as BM25Retriever.tokenize)
   */
  private tokenize(text: string): string[];

  /**
   * Calculate term frequency in document set
   */
  private calculateTermFrequency(
    term: string,
    docs: RetrievalResult[]
  ): number;

  /**
   * Calculate IDF for term
   */
  private calculateIDF(term: string): number;

  /**
   * Filter candidate terms (remove stop words, query terms, too short/long)
   */
  private filterCandidates(
    candidates: ExpansionTerm[],
    queryTerms: string[]
  ): ExpansionTerm[];
}
```

**Implementation Notes:**
- Reuse BM25Retriever's corpusStats for IDF calculation
- Query-biased scoring: `score = tfidf * (1 + queryOverlap)` where `queryOverlap` is Jaccard similarity
- Filter candidates: remove stop words, original query terms, terms < 3 chars, terms > 20 chars
- Normalize scores to 0-1 range

---

### 3. TermSelector Class

**File:** `lib/retrieval/expansion/TermSelector.ts`

**Responsibility:** Select best expansion terms from candidates (with diversity)

**Signature:**
```typescript
export class TermSelector {
  private config: {
    maxTerms: number;
    minScore: number;
    useDiversity: boolean;
    diversityLambda: number;
  };

  constructor(config: {
    maxTerms: number;
    minScore: number;
    useDiversity: boolean;
    diversityLambda: number;
  });

  /**
   * Select expansion terms from candidates
   *
   * @param candidates - All candidate terms
   * @param originalQuery - Original query string
   * @returns Selected expansion terms (ranked)
   */
  selectTerms(
    candidates: ExpansionTerm[],
    originalQuery: string
  ): ExpansionTerm[];

  /**
   * Rank terms by relevance score
   *
   * @param candidates - Candidate terms
   * @returns Sorted terms (highest score first)
   */
  private rankByRelevance(candidates: ExpansionTerm[]): ExpansionTerm[];

  /**
   * Apply diversity-based selection (MMR for terms)
   *
   * @param candidates - Candidate terms (sorted by relevance)
   * @param maxTerms - Maximum terms to select
   * @param lambda - Diversity parameter (0-1)
   * @returns Diversified term selection
   */
  private filterByDiversity(
    candidates: ExpansionTerm[],
    maxTerms: number,
    lambda: number
  ): ExpansionTerm[];

  /**
   * Calculate term similarity (simple edit distance or character overlap)
   *
   * @param term1 - First term
   * @param term2 - Second term
   * @returns Similarity score (0-1)
   */
  private termSimilarity(term1: string, term2: string): number;

  /**
   * Apply minimum score threshold
   *
   * @param candidates - Candidate terms
   * @param minScore - Minimum score threshold
   * @returns Filtered terms
   */
  private applyThreshold(
    candidates: ExpansionTerm[],
    minScore: number
  ): ExpansionTerm[];
}
```

**Implementation Notes:**
- Diversity selection uses MMR algorithm adapted for terms
- Term similarity: Jaccard similarity on character bigrams (fast, no embeddings needed)
- MMR formula: `score(t) = λ * relevance(t) - (1-λ) * max_similarity(t, selected)`
- Default λ = 0.7 (favor relevance over diversity)

---

### 4. QueryReformulator Class

**File:** `lib/retrieval/expansion/QueryReformulator.ts`

**Responsibility:** Combine original query with expansion terms

**Signature:**
```typescript
export class QueryReformulator {
  private config: {
    originalWeight: number;
    expansionWeight: number;
  };

  constructor(config: {
    originalWeight: number;
    expansionWeight: number;
  });

  /**
   * Reformulate query with expansion terms
   *
   * @param originalQuery - Original query string
   * @param expansionTerms - Selected expansion terms
   * @param decision - Expansion decision (determines strategy)
   * @returns Reformulated query string and strategy used
   */
  reformulate(
    originalQuery: string,
    expansionTerms: ExpansionTerm[],
    decision: ExpansionDecision
  ): { reformulated: string; strategy: ExpandedQuery["strategy"] };

  /**
   * Append expansion terms to query
   */
  private appendTerms(
    originalQuery: string,
    expansionTerms: ExpansionTerm[]
  ): string;

  /**
   * Reweight original and expansion terms
   *
   * Implementation: Repeat original terms N times, expansion terms M times
   * based on weights (e.g., 0.8/0.2 → repeat original 4x, expansion 1x)
   */
  private reweightTerms(
    originalQuery: string,
    expansionTerms: ExpansionTerm[],
    originalWeight: number,
    expansionWeight: number
  ): string;

  /**
   * Substitute low-quality query terms with expansion terms
   */
  private substituteTerms(
    originalQuery: string,
    expansionTerms: ExpansionTerm[]
  ): string;

  /**
   * Determine reformulation strategy from decision
   */
  private selectStrategy(decision: ExpansionDecision): ExpandedQuery["strategy"];
}
```

**Implementation Notes:**
- **Strategy selection logic:**
  ```typescript
  if (queryLength < 3 && confidence < 0.5) return "substitute";
  else if (queryLength >= 7 && confidence > 0.7) return "append";
  else return "reweight"; // Default
  ```
- **Reweighting:** Repeat terms to approximate weights (e.g., 0.8 → repeat 4x, 0.2 → repeat 1x)
- **Substitution:** Identify low-quality terms (low IDF, short length) and replace with top expansion terms

---

## Integration Plan

### Two-Pass Retrieval Flow

**File to Modify:** `lib/retrieval/HybridRetriever.ts`

**Changes:**
1. Add optional `queryExpander` to constructor
2. Modify `retrieve()` method to support two-pass retrieval
3. Add metrics tracking for expansion

**Pseudocode:**
```typescript
class HybridRetriever {
  private queryExpander?: QueryExpander;

  async retrieve(query: string, limit: number): Promise<RetrievalResult[]> {
    let finalQuery = query;
    let expansionMetadata = null;

    // Optional: Expand query if expander is configured
    if (this.queryExpander) {
      // First pass: Get initial results
      const initialResults = await this.retrieveInternal(query, this.config.topK || 5);

      // Expand query
      const expandedQuery = await this.queryExpander.expand(query, initialResults);

      if (expandedQuery.metadata.expanded) {
        finalQuery = expandedQuery.reformulated;
        expansionMetadata = expandedQuery.metadata;
        console.log(`[HybridRetriever] Query expanded: "${query}" → "${finalQuery}"`);
      }
    }

    // Second pass (or only pass if no expansion): Retrieve with final query
    const results = await this.retrieveInternal(finalQuery, limit);

    // Add expansion metadata to results
    if (expansionMetadata) {
      results.forEach(r => {
        r.metadata = {
          ...r.metadata,
          queryExpanded: true,
          expansionMetadata
        };
      });
    }

    return results;
  }

  // Rename existing retrieve() to retrieveInternal()
  private async retrieveInternal(query: string, limit: number): Promise<RetrievalResult[]> {
    // ... existing implementation
  }
}
```

---

### Files to Create

#### 1. `/lib/retrieval/expansion/types.ts`
- All TypeScript interface definitions (see above)

#### 2. `/lib/retrieval/expansion/QueryExpander.ts`
- QueryExpander class implementation
- Query caching logic
- Expansion decision logic

#### 3. `/lib/retrieval/expansion/TermExtractor.ts`
- TermExtractor class implementation
- TF-IDF scoring
- Query-biased scoring
- Term filtering

#### 4. `/lib/retrieval/expansion/TermSelector.ts`
- TermSelector class implementation
- Diversity-based selection (MMR for terms)
- Threshold filtering

#### 5. `/lib/retrieval/expansion/QueryReformulator.ts`
- QueryReformulator class implementation
- Append, reweight, substitute strategies
- Strategy selection logic

#### 6. `/lib/retrieval/expansion/index.ts`
- Export all public classes and types
- Re-export convenience functions

---

### Files to Modify

#### 1. `/lib/retrieval/HybridRetriever.ts`
**Changes:**
- Add `queryExpander?: QueryExpander` to constructor
- Modify `retrieve()` to support two-pass retrieval
- Add `retrieveInternal()` (rename existing `retrieve()`)
- Add expansion metadata to results
- Update metrics tracking

**Lines to modify:** ~69-110 (retrieve method)

**New constructor signature:**
```typescript
constructor(
  bm25Retriever: IRetriever,
  embeddingRetriever: IRetriever,
  materials: CourseMaterial[],
  config?: HybridRetrievalConfig,
  queryExpander?: QueryExpander  // NEW
)
```

#### 2. `/lib/retrieval/types.ts`
**Changes:**
- Add `queryExpanded?: boolean` to `RetrievalResult.metadata`
- Add `expansionMetadata?: object` to `RetrievalResult.metadata`
- Import and re-export PRF types

**Lines to add:** After line 14 (RetrievalResult interface)

#### 3. `/lib/context/CourseContextBuilder.ts` (Optional)
**Changes:**
- Instantiate QueryExpander
- Pass to HybridRetriever constructor
- Add expansion config to builder options

**Lines to modify:** Wherever HybridRetriever is instantiated

---

## Test Strategy

### Unit Tests

**Test File:** `lib/retrieval/expansion/__tests__/QueryExpander.test.ts`

**Test Cases:**
1. **Expansion Decision Logic**
   - Short query (< 4 words) + low confidence → expand
   - Long query (> 7 words) + high confidence → skip
   - Medium query + medium confidence → expand if < threshold

2. **Term Extraction**
   - Extract terms from pseudo-relevant docs
   - TF-IDF scoring correctness
   - Query-biased scoring correctness
   - Filter stop words and original query terms

3. **Term Selection**
   - Select top-K by score
   - Diversity-based selection reduces redundancy
   - Minimum score threshold filtering

4. **Query Reformulation**
   - Append strategy: concatenates correctly
   - Reweight strategy: repeats terms proportionally
   - Substitute strategy: replaces low-quality terms

5. **Caching**
   - Same query returns cached result
   - Cache expiration after TTL
   - Cache cleanup removes expired entries

### Integration Tests

**Test File:** `lib/retrieval/__tests__/HybridRetriever-PRF.test.ts`

**Test Cases:**
1. **Two-Pass Retrieval**
   - First pass retrieves initial results
   - Query is expanded
   - Second pass retrieves with expanded query
   - Results include expansion metadata

2. **Expansion Rate**
   - 60%+ of test queries are expanded
   - Short/vague queries consistently expanded
   - Long/specific queries mostly skipped

3. **Coverage Improvement**
   - Expanded queries match more documents
   - Term coverage increased by 10%+

4. **Latency Check**
   - Total latency (expansion + retrieval) < 2s
   - Expansion overhead < 100ms

### Manual Test Queries

**Dataset:** 30 test queries from QuokkaQ domain

**Expected Expansion Examples:**

| Original Query | Should Expand? | Expected Expansion Terms |
|----------------|----------------|--------------------------|
| "binary tree" | Yes (short) | algorithm, traversal, insertion, deletion, bst |
| "How do I implement quicksort in Python with detailed comments?" | No (long, specific) | - |
| "recursion" | Yes (vague) | function, base case, recursive call, stack, fibonacci |
| "AVL tree rotation pseudocode with step-by-step explanation" | No (detailed) | - |
| "graph algorithms" | Yes (broad) | dijkstra, bfs, dfs, shortest path, adjacency |

**Measurement:**
- Expansion rate: % of queries expanded
- Coverage improvement: Average % increase in matched terms
- Latency: Average and 95th percentile

---

## Performance Considerations

### Latency Budget

**Target:** <100ms expansion overhead

**Breakdown:**
- Initial retrieval (first pass): ~50ms (included in HybridRetriever)
- Term extraction: ~20ms (tokenization + TF-IDF)
- Term selection: ~10ms (diversity MMR)
- Query reformulation: ~5ms (string manipulation)
- Cache lookup: ~1ms (Map.get)
- **Total expansion overhead:** ~35ms (excluding first pass)

**Optimization:**
- Cache expanded queries (avoid recomputation)
- Limit pseudo-relevant docs to 3-5 (reduce extraction cost)
- Use simple term similarity (character bigrams, not embeddings)
- Pre-filter candidates before diversity selection

---

### Caching Strategy

**Cache Structure:**
```typescript
Map<queryHash, QueryCacheEntry>
```

**Cache Key:** MD5 hash of normalized query (lowercase, trimmed, deduplicated whitespace)

**Eviction Policy:**
- TTL: 5 minutes (configurable)
- LRU: Max 1000 entries
- Cleanup: Every 10th expansion call

**Cache Hit Rate (Expected):**
- Cold start: 0%
- After 10 queries: 20-30% (repeated terms)
- Steady state: 40-50% (common student queries)

**Storage Cost:**
- Average entry size: ~500 bytes (query + terms + metadata)
- Max cache size: 1000 entries × 500 bytes = ~500KB
- Acceptable for in-memory storage

---

### Memory Budget

**Per-Query Memory:**
- Pseudo-relevant docs: 5 docs × 2KB = ~10KB
- Candidate terms: 50 terms × 100 bytes = ~5KB
- Selected terms: 7 terms × 100 bytes = ~700 bytes
- **Total:** ~16KB per query (temporary)

**Cache Memory:**
- 1000 cached queries × 500 bytes = ~500KB (persistent)

**Total Memory Impact:** <1MB (negligible)

---

## Step-by-Step Implementation Order

### Phase 1: Core Infrastructure (Day 5.1)
1. Create `lib/retrieval/expansion/types.ts` (all interfaces)
2. Create `lib/retrieval/expansion/TermExtractor.ts`
   - Implement TF-IDF scoring
   - Implement tokenization (reuse BM25 logic)
   - Implement term filtering
3. Write unit tests for TermExtractor

### Phase 2: Term Selection (Day 5.2)
4. Create `lib/retrieval/expansion/TermSelector.ts`
   - Implement relevance ranking
   - Implement diversity-based selection (MMR)
   - Implement threshold filtering
5. Write unit tests for TermSelector

### Phase 3: Query Reformulation (Day 5.3)
6. Create `lib/retrieval/expansion/QueryReformulator.ts`
   - Implement append, reweight, substitute strategies
   - Implement strategy selection logic
7. Write unit tests for QueryReformulator

### Phase 4: Expansion Orchestration (Day 5.4)
8. Create `lib/retrieval/expansion/QueryExpander.ts`
   - Implement expansion decision logic
   - Implement caching (Map-based)
   - Integrate TermExtractor, TermSelector, QueryReformulator
9. Write unit tests for QueryExpander

### Phase 5: Integration (Day 5.5)
10. Modify `lib/retrieval/HybridRetriever.ts`
    - Add two-pass retrieval flow
    - Add expansion metadata to results
11. Modify `lib/retrieval/types.ts`
    - Add expansion metadata fields
12. Create `lib/retrieval/expansion/index.ts`
    - Export all classes and types

### Phase 6: Testing & Validation (Day 5.6)
13. Write integration tests
14. Manual testing with 30 test queries
15. Measure expansion rate, coverage, latency
16. Tune parameters if needed (threshold, topK, maxTerms)

### Phase 7: Documentation (Day 5.7)
17. Add JSDoc comments to all classes/methods
18. Create usage examples
19. Update CLAUDE.md with PRF section

---

## Configuration Defaults

**Recommended Starting Values:**

```typescript
const DEFAULT_PRF_CONFIG: Required<PRFConfig> = {
  topK: 5,                       // 5 pseudo-relevant docs (balance quality/speed)
  maxExpansionTerms: 7,          // 7 expansion terms (TREC optimal range)
  minTermScore: 0.3,             // Filter low-quality terms
  method: "rocchio",             // Rocchio algorithm (simple + effective)
  originalWeight: 0.8,           // Favor original query (80/20)
  expansionWeight: 0.2,
  expansionThreshold: 0.65,      // Expand if confidence < 0.65
  enableCache: true,             // Cache for performance
  cacheTTL: 300000,              // 5 minutes TTL
  useDiversity: true,            // Reduce redundancy
  diversityLambda: 0.7,          // Favor relevance over diversity
};
```

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Query drift (expansion changes intent) | Poor results | Medium | Confidence-based decision, favor original query (0.8 weight) |
| Latency spike (>2s total) | Poor UX | Low | Cache expanded queries, limit topK to 5, simple term similarity |
| Low expansion rate (<60%) | Missing goal | Medium | Tune threshold to 0.65, test on diverse queries |
| Cache memory bloat | OOM | Low | LRU eviction, max 1000 entries, 5-min TTL |
| Noisy expansion terms | Irrelevant results | Medium | Diversity selection, min score threshold (0.3), filter stop words |

---

## Success Metrics

**From context.md:**
- ✅ **Expansion Rate:** 60%+ of queries expanded
- ✅ **Coverage Improvement:** 10%+ more terms matched
- ✅ **Latency:** <2s total (expansion + retrieval)
- ✅ **Cache Hit Rate:** 40%+ after warmup

**Additional Metrics:**
- **Expansion Quality:** 80%+ of expansion terms relevant (manual review)
- **Query Drift:** <10% of expansions degrade results (A/B test)
- **Memory Usage:** <1MB total (cache + processing)

---

## Rollback Plan

**If PRF degrades performance:**
1. Disable by setting `queryExpander = undefined` in HybridRetriever
2. No code removal needed (graceful fallback)
3. Feature flag in config: `ENABLE_PRF=false`

**If latency exceeds budget:**
1. Reduce `topK` to 3 (from 5)
2. Reduce `maxExpansionTerms` to 5 (from 7)
3. Disable diversity selection (`useDiversity=false`)

**If expansion rate too low:**
1. Lower `expansionThreshold` to 0.6 (from 0.65)
2. Increase `maxExpansionTerms` to 10
3. Reduce `minTermScore` to 0.2 (from 0.3)

---

## Next Steps

1. **Review this plan** with parent agent
2. **Implement Phase 1** (types + TermExtractor)
3. **Test incrementally** after each phase
4. **Tune parameters** based on test results
5. **Document findings** in context.md

---

**Status:** Design complete. Ready for implementation.

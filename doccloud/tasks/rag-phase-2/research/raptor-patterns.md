# RAPTOR Research: Hierarchical Retrieval Patterns

**Research Date:** 2025-10-17
**Agent:** Type Safety Guardian
**Task:** RAG Phase 2 - RAPTOR Design

---

## Overview

RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval) creates multi-level document hierarchies through iterative clustering and summarization, enabling retrieval at multiple abstraction levels.

**Core Insight:** Different queries benefit from different abstraction levels. High-level questions need summaries, specific questions need raw documents.

---

## 1. RAPTOR Algorithm Fundamentals

### 1.1 Basic Algorithm

```
Input: Documents D = {d₁, d₂, ..., dₙ}
Output: Hierarchical tree T with L levels

Level 0: Raw documents (leaf nodes)

For each level L (starting at 0):
  1. Embed all nodes at level L
  2. Cluster nodes using embeddings
  3. For each cluster:
     - Generate abstractive summary (LLM)
     - Create parent node with summary
  4. If only one cluster, stop
  5. Else, recurse on summaries (L+1)

Query Traversal:
  1. Embed query
  2. Start at root or highest level
  3. For each level:
     - Score all nodes at this level
     - Select top-K most relevant
  4. Return nodes from multiple levels
```

### 1.2 Key Properties

- **Multi-scale**: Captures information at different granularities
- **Lossy compression**: Each level loses details but gains coherence
- **Query-adaptive**: High-level vs specific queries access different levels
- **Offline construction**: Build hierarchy once, use many times
- **Online traversal**: Fast search through pre-built structure

### 1.3 Complexity Analysis

**Construction:**
- Embedding: O(n × d) where d = embedding dimension
- Clustering: O(n² log n) hierarchical, O(nk²) for k-means
- Summarization: O(n × L) LLM calls where L = levels
- **Total**: O(n² log n) dominated by clustering

**Query:**
- Traverse L levels with K nodes each
- **Total**: O(L × K) where L ≈ log n
- **Practical**: <100ms with L=3-4, K=5-10

**Memory:**
- Each node stores summary text + embedding
- **Total**: O(n × s) where s = avg summary size
- **Estimate**: 100 docs × 4 levels × 500 chars ≈ 200KB

---

## 2. Document Clustering Techniques

### 2.1 Agglomerative Hierarchical Clustering (RECOMMENDED)

**How it works:**
```
1. Start with N singleton clusters (one doc each)
2. Repeat:
   - Find two most similar clusters
   - Merge them
   - Update distance matrix
3. Stop when K clusters remain (or all merged)
```

**Advantages:**
- Natural hierarchy structure (dendrogram)
- No need to specify K clusters upfront
- Works well with diverse document sets
- Deterministic results

**Disadvantages:**
- O(n² log n) complexity
- Requires distance threshold or K clusters

**Distance Metrics:**
- **Single linkage**: min distance between points (chains)
- **Complete linkage**: max distance between points (compact)
- **Average linkage**: mean distance (balanced) ← **RECOMMENDED**
- **Ward's method**: minimize variance (compact, coherent)

**Stopping Criteria:**
```typescript
// Threshold-based (fixed distance)
if (minDistance > threshold) stop;

// Count-based (fixed K clusters)
if (numClusters <= K) stop;

// Dynamic (silhouette score)
if (silhouetteScore < 0.5) stop;
```

### 2.2 K-Means Clustering (Alternative)

**How it works:**
```
1. Choose K random centroids
2. Repeat until convergence:
   - Assign each doc to nearest centroid
   - Recompute centroids as cluster means
```

**Advantages:**
- Fast: O(nkT) where T = iterations (usually T < 100)
- Simple to implement
- Works well with spherical clusters

**Disadvantages:**
- Must specify K upfront
- Random initialization (non-deterministic)
- Sensitive to outliers
- Poor with irregular shapes

**K Selection Heuristics:**
```typescript
// Elbow method (diminishing returns)
K = argmin(k) where inertia decrease < threshold

// Square root rule (rule of thumb)
K = Math.ceil(Math.sqrt(n / 2))

// Fixed range (practical)
K = Math.max(2, Math.min(10, n / 5))
```

### 2.3 DBSCAN (Density-Based) - Not Recommended

**Why not:**
- Doesn't naturally produce hierarchy
- Needs distance threshold (epsilon)
- Creates outlier clusters (noise)
- Unbalanced cluster sizes

### 2.4 Comparison for QuokkaQ

| Criterion | Hierarchical (Avg Link) | K-Means | DBSCAN |
|-----------|-------------------------|---------|--------|
| **Hierarchy** | ✅ Natural | ❌ Need recursion | ❌ Flat only |
| **Determinism** | ✅ Yes | ❌ Random init | ✅ Yes |
| **Parameter Tuning** | ⚠️ Threshold | ❌ Needs K | ❌ Needs epsilon |
| **Complexity** | ⚠️ O(n² log n) | ✅ O(nkT) | ⚠️ O(n log n) |
| **Coherence** | ✅ Good | ✅ Good | ❌ Variable |
| **Small Corpus** | ✅ Works | ✅ Works | ❌ Poor |

**Recommendation:** Agglomerative hierarchical with average linkage
- Natural hierarchy (no recursion needed)
- Deterministic results (reproducible)
- Good coherence (balanced clusters)
- Acceptable complexity for <100 docs per course

---

## 3. Multi-Level Summarization Strategies

### 3.1 Abstractive Summarization (RECOMMENDED)

**Approach:** Use LLM to generate coherent summaries

**Prompt Template:**
```
Summarize the following {cluster_size} course materials into a
cohesive overview. Focus on main themes, key concepts, and
relationships. Be concise but comprehensive.

Materials:
{material_1_title}: {material_1_excerpt}
{material_2_title}: {material_2_excerpt}
...

Generate a summary (200-400 words):
```

**Advantages:**
- Coherent, readable summaries
- Captures semantic relationships
- Can generalize across documents
- Natural language (good for retrieval)

**Disadvantages:**
- Requires LLM calls (cost + latency)
- Non-deterministic (varies per run)
- Risk of hallucination (must verify against docs)

**Optimization:**
```typescript
// Batch summarization (reduce LLM calls)
const batchSize = 5; // Summarize 5 clusters per call

// Prompt caching (Anthropic)
// Cache course metadata + instructions (>1024 tokens)
const systemPrompt = `Course: ${courseName}\n${instructions}`;
// Only pay for cache writes once, reads are 90% cheaper

// Token limits
const maxInputTokens = 8000;  // Per cluster summary
const maxOutputTokens = 500;  // Per summary
```

### 3.2 Extractive Summarization (Alternative)

**Approach:** Select key sentences from documents

**Techniques:**
- TextRank (graph-based importance)
- TF-IDF sentence scoring
- Position-based (first/last sentences)
- Centroid-based (closest to cluster centroid)

**Advantages:**
- Fast (no LLM needed)
- Deterministic
- Factually accurate (uses original text)
- Zero cost

**Disadvantages:**
- Less coherent (choppy)
- May miss connections
- Redundant across sentences
- Poor readability

**When to use:**
- Development/testing (fast iteration)
- Cost-constrained scenarios
- Factual accuracy paramount

### 3.3 Hybrid Approach (Best of Both)

```typescript
// 1. Extractive pre-selection (fast)
const keyExcerpts = extractKeyExcerpts(documents, maxExcerpts: 3);

// 2. Abstractive synthesis (accurate)
const summary = await llm.summarize({
  prompt: `Synthesize these key excerpts into a coherent summary:\n${keyExcerpts}`,
  maxTokens: 400,
});

return summary;
```

**Benefits:**
- Reduced LLM input tokens (cheaper)
- Grounded in original text (accurate)
- Coherent output (readable)

### 3.4 Summary Quality Metrics

**Coherence Score:**
```typescript
// Embedding similarity between summary and cluster centroid
coherence = cosineSimilarity(summaryEmbedding, clusterCentroidEmbedding);

// Threshold: coherence > 0.7 → good summary
```

**Coverage Score:**
```typescript
// Keyword overlap between summary and documents
coverage = |summaryKeywords ∩ documentKeywords| / |documentKeywords|;

// Threshold: coverage > 0.5 → adequate coverage
```

**Compression Ratio:**
```typescript
// Summary length vs original content
compression = summaryTokens / totalDocumentTokens;

// Target: 0.1-0.2 (10-20% of original length)
```

---

## 4. Hierarchy Traversal Algorithms

### 4.1 Top-Down Breadth-First (RECOMMENDED)

**Algorithm:**
```typescript
function traverse(query: Embedding, tree: HierarchyTree, maxNodes: number): DocumentNode[] {
  const results: DocumentNode[] = [];
  const queue: DocumentNode[] = [tree.root];

  while (queue.length > 0 && results.length < maxNodes) {
    // Get nodes at current level
    const currentLevel = queue.splice(0, queue.length);

    // Score all nodes
    const scored = currentLevel.map(node => ({
      node,
      score: cosineSimilarity(query, node.embedding),
    })).sort((a, b) => b.score - a.score);

    // Select top-K nodes
    const topK = Math.min(3, scored.length);
    const selected = scored.slice(0, topK);

    // Add to results and queue children
    for (const { node, score } of selected) {
      if (score > 0.6) { // Relevance threshold
        results.push(node);
        queue.push(...node.children);
      }
    }
  }

  return results.slice(0, maxNodes);
}
```

**Advantages:**
- Natural top-down reasoning
- Prunes irrelevant branches early
- Returns diverse levels
- Bounded complexity O(L × K)

**Disadvantages:**
- May miss specific details early
- Depends on summary quality

### 4.2 Bottom-Up Aggregation (Alternative)

**Algorithm:**
```typescript
function traverse(query: Embedding, tree: HierarchyTree, maxNodes: number): DocumentNode[] {
  // Start at leaves (raw documents)
  const leaves = getLeafNodes(tree);

  // Score and select top leaves
  const topLeaves = scoreAndSort(leaves, query).slice(0, maxNodes);

  // Walk up ancestors
  const results = new Set<DocumentNode>(topLeaves);
  for (const leaf of topLeaves) {
    let node = leaf.parent;
    while (node && results.size < maxNodes * 1.5) {
      results.add(node);
      node = node.parent;
    }
  }

  return Array.from(results);
}
```

**Advantages:**
- Always includes specific details
- Good for fact-lookup queries
- Adds context via ancestors

**Disadvantages:**
- More nodes to score (slower)
- May include irrelevant ancestors

### 4.3 Hybrid Multi-Path (Best for Mixed Queries)

**Algorithm:**
```typescript
function traverse(query: Embedding, tree: HierarchyTree, maxNodes: number): DocumentNode[] {
  // 1. Top-down for high-level context
  const topDown = topDownTraversal(query, tree, maxNodes / 2);

  // 2. Bottom-up for specific details
  const bottomUp = bottomUpTraversal(query, tree, maxNodes / 2);

  // 3. Deduplicate and merge
  const merged = deduplicateByLevel(topDown, bottomUp);

  // 4. Rerank by combined score
  return rerank(merged, query).slice(0, maxNodes);
}
```

**Advantages:**
- Handles both query types
- Balanced coverage
- Higher recall

**Disadvantages:**
- More complex
- Higher latency

### 4.4 Query-Type Routing (Intelligent Selection)

```typescript
function detectQueryType(query: string): 'overview' | 'specific' {
  const overviewKeywords = ['explain', 'overview', 'what is', 'how does', 'compare'];
  const specificKeywords = ['when', 'where', 'who', 'which', 'example', 'code'];

  const overviewScore = countMatches(query, overviewKeywords);
  const specificScore = countMatches(query, specificKeywords);

  return overviewScore > specificScore ? 'overview' : 'specific';
}

function adaptiveTraversal(query: string, tree: HierarchyTree): DocumentNode[] {
  const type = detectQueryType(query);

  if (type === 'overview') {
    // Prefer higher levels (summaries)
    return topDownTraversal(query, tree, startLevel: 1);
  } else {
    // Prefer lower levels (details)
    return bottomUpTraversal(query, tree);
  }
}
```

---

## 5. Academic References

### 5.1 Core Papers

1. **RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval**
   - Sarthi et al., 2024
   - Key contribution: Multi-level abstraction improves long-context retrieval
   - Result: 20% improvement over flat retrieval on QA tasks

2. **Hierarchical Clustering for Document Organization**
   - Manning & Schütze, 1999 (Foundations of Statistical NLP)
   - Standard reference for clustering algorithms

3. **Document Summarization Techniques**
   - Nenkova & McKeown, 2012 (Survey paper)
   - Covers extractive and abstractive approaches

### 5.2 Related Techniques

- **Document Clustering**: Van Rijsbergen (Information Retrieval, 1979)
- **Semantic Hierarchies**: WordNet (Miller, 1995)
- **Recursive Summarization**: BERTSum (Liu & Lapata, 2019)

### 5.3 QuokkaQ-Specific Considerations

**Corpus Size:**
- Small corpus (10-50 docs per course)
- Hierarchy depth: 2-3 levels sufficient
- Clustering: 3-5 docs per cluster

**Query Characteristics:**
- Mixed: High-level ("explain recursion") + specific ("line 12 error")
- Student queries often vague (need context)
- Instructor queries more specific (need precision)

**Performance Constraints:**
- <2s total latency (including traversal)
- Pre-compute hierarchies (offline)
- Cache summaries (avoid re-generation)

---

## 6. Implementation Considerations

### 6.1 When to Rebuild Hierarchy

**Triggers:**
- New course material added
- Material updated
- Low coherence scores detected
- Manual refresh requested

**Strategy:**
```typescript
// Incremental rebuild (fast)
if (newDocCount < totalDocCount * 0.1) {
  // <10% new docs → insert into existing tree
  insertIntoHierarchy(newDocs, existingTree);
} else {
  // ≥10% new docs → rebuild from scratch
  rebuildHierarchy(allDocs);
}
```

### 6.2 Storage Format

```typescript
// In-memory tree structure
interface HierarchyTree {
  courseId: string;
  root: DocumentNode;
  levels: DocumentNode[][];
  metadata: {
    builtAt: string;
    docCount: number;
    levelCount: number;
    avgCoherence: number;
  };
}

// Serialization (optional, for caching)
// Store in localStorage or IndexedDB for persistence
const serialized = JSON.stringify(tree);
localStorage.setItem(`hierarchy-${courseId}`, serialized);
```

### 6.3 Integration with Existing Retrieval

```typescript
// Hybrid approach: Combine RAPTOR with BM25/Embedding
const hierarchyResults = hierarchyTraverser.traverse(query, limit: 5);
const flatResults = hybridRetriever.retrieve(query, limit: 5);

// Merge and deduplicate
const merged = mergeResults(hierarchyResults, flatResults);

// Rerank (optional cross-encoder)
const final = reranker.rerank(query, merged, limit: 10);
```

---

## 7. Expected Improvements

### 7.1 Retrieval Quality

**Coherence:**
- +20% on high-level questions ("explain binary search")
- +0% on specific questions ("line 42 error") → flat retrieval already good

**Coverage:**
- +15% on multi-topic questions (hierarchy provides context)
- +10% on vague queries (summaries help clarify intent)

### 7.2 Performance

**Latency:**
- Hierarchy traversal: +50-100ms
- Total with caching: <2s (within budget)

**Cost:**
- Summary generation: $0.001 per cluster (one-time)
- 50 docs → 10 clusters → $0.01 per course
- Retrieval: $0 (no LLM calls, use embeddings)

---

## Summary

**RAPTOR for QuokkaQ:**
- **Clustering**: Agglomerative hierarchical with average linkage
- **Summarization**: Abstractive with LLM (batched + cached)
- **Traversal**: Top-down breadth-first with pruning
- **Integration**: Augment existing BM25+Embedding retrieval
- **Expected Gain**: +20% coherence on high-level queries
- **Complexity**: O(n² log n) construction (offline), O(L × K) query (fast)

**Next Steps:** Design TypeScript interfaces and implementation plan.

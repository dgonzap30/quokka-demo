# PRF (Pseudo-Relevance Feedback) Research

**Created:** 2025-10-17
**Agent:** Type Safety Guardian
**Phase:** RAG Phase 2 - Query Expansion

---

## Overview

Pseudo-Relevance Feedback (PRF) is an automatic query expansion technique that improves retrieval recall by enriching the original query with terms extracted from top-ranked initial results. Unlike explicit relevance feedback (which requires user interaction), PRF assumes the top-K retrieved documents are relevant and uses them to expand the query.

**Key Insight:** PRF addresses the vocabulary mismatch problem where users' query terms differ from document terms, even when semantically equivalent.

---

## PRF Algorithm Families

### 1. Rocchio Algorithm

**Origin:** Classic relevance feedback algorithm (Rocchio, 1971)

**Formula:**
```
Q_new = α * Q_original + β * (1/|Dr|) * Σ(D_relevant) - γ * (1/|Dnr|) * Σ(D_nonrelevant)
```

Where:
- `α` = weight for original query (typical: 1.0)
- `β` = weight for relevant docs (typical: 0.75)
- `γ` = weight for non-relevant docs (typical: 0.15)
- `Dr` = set of relevant documents
- `Dnr` = set of non-relevant documents

**Adaptation for PRF (Blind Rocchio):**
- Assume top-K results are relevant (Dr = top-K)
- Ignore non-relevant docs (γ = 0)
- Extract high TF-IDF terms from Dr
- Add weighted terms to query

**Pros:**
- Well-established theory
- Proven effectiveness (10-20% improvement on TREC benchmarks)
- Simple to implement
- Works with any retrieval model

**Cons:**
- Assumes top-K are truly relevant (risky assumption)
- Can drift query meaning if initial results are poor
- Sensitive to K parameter

---

### 2. RM3 (Relevance Model 3)

**Origin:** Language modeling approach (Lavrenko & Croft, 2001)

**Concept:**
- Estimate relevance model from top-K pseudo-relevant docs
- Interpolate original query with relevance model
- Uses term frequency and query likelihood

**Formula:**
```
P(w|R) = Σ_d∈topK P(w|d) * P(q|d) * P(d)
```

Where:
- `P(w|R)` = probability of term w given relevance
- `P(w|d)` = term probability in document d
- `P(q|d)` = query likelihood in d
- `P(d)` = document prior (uniform)

**Interpolation:**
```
Q_new = λ * Q_original + (1-λ) * RM
```

Typical λ: 0.7-0.9 (favor original query)

**Pros:**
- Strong theoretical foundation (probabilistic)
- State-of-the-art results on benchmarks
- Smooth integration with language models
- Handles term dependencies

**Cons:**
- Computationally expensive (document scoring)
- Complex implementation
- Requires language model infrastructure
- May be overkill for simple RAG systems

---

### 3. Bo1/Bo2 (Bose-Einstein Statistics)

**Origin:** Divergence From Randomness (DFR) framework (Amati & Van Rijsbergen, 2002)

**Concept:**
- Use information theory to score terms
- Bo1: Term frequency in top-K vs collection
- Bo2: Term frequency + normalization

**Formula (Bo1):**
```
weight(t) = tf_t * log2((tf_t + 0.5) / (F_t / N))
```

Where:
- `tf_t` = term frequency in top-K
- `F_t` = term frequency in collection
- `N` = total collection size

**Pros:**
- Information-theoretic foundation
- Good empirical results
- Automatic term weighting
- Fast computation

**Cons:**
- Less known/tested than Rocchio or RM3
- Requires collection statistics
- Tuning parameters less intuitive

---

## Term Extraction Techniques

### 1. TF-IDF Scoring

**Method:** Score terms by TF-IDF in pseudo-relevant documents

**Formula:**
```
score(t) = tf(t, Dr) * idf(t)
```

Where:
- `tf(t, Dr)` = term frequency in pseudo-relevant set
- `idf(t)` = inverse document frequency in collection

**Pros:**
- Simple, fast
- Filters common words (via IDF)
- Standard IR technique

**Cons:**
- Ignores term position/context
- Treats all pseudo-relevant docs equally
- No semantic understanding

---

### 2. TextRank

**Method:** Graph-based ranking of terms/phrases (Mihalcea & Tarau, 2004)

**Concept:**
- Build co-occurrence graph of terms
- Apply PageRank to find central terms
- Extract top-ranked terms as expansion candidates

**Pros:**
- Captures term relationships
- Unsupervised (no training needed)
- Can extract multi-word phrases
- Context-aware

**Cons:**
- Slower than TF-IDF
- Needs co-occurrence window tuning
- May extract irrelevant central terms

---

### 3. KeyBERT

**Method:** BERT-based semantic keyword extraction (Grootendorst, 2020)

**Concept:**
- Embed document and candidate terms with BERT
- Measure cosine similarity between doc and terms
- Select terms most similar to document meaning

**Pros:**
- Semantically aware
- Handles synonyms and paraphrases
- Modern transformer-based
- High quality extractions

**Cons:**
- Requires BERT model (adds latency)
- More complex infrastructure
- May be slow for real-time use
- Need to manage model size

---

### 4. Query-Biased Extraction

**Method:** Score terms by relevance to BOTH query and pseudo-relevant docs

**Formula:**
```
score(t) = sim(t, query) * importance(t, Dr)
```

Where:
- `sim(t, query)` = semantic similarity to query (e.g., embedding cosine)
- `importance(t, Dr)` = TF-IDF or frequency in Dr

**Pros:**
- Maintains query focus
- Reduces query drift
- Combines multiple signals
- Better than pure frequency

**Cons:**
- Requires embedding model for similarity
- More complex computation
- Need to tune combination weights

---

## Term Selection Strategies

### 1. Top-K by Score

**Method:** Select K highest-scored terms from candidates

**Parameters:**
- K = 5-10 (typical range)
- Min score threshold (filter low-quality)

**Pros:**
- Simple, deterministic
- Predictable behavior
- Fast

**Cons:**
- May select redundant terms
- No diversity guarantee
- Ignores term relationships

---

### 2. Diversity-Based Selection (MMR for Terms)

**Method:** Apply Maximal Marginal Relevance to term selection

**Algorithm:**
```
1. Select highest-scored term t1
2. For each remaining term ti:
   score(ti) = λ * relevance(ti) - (1-λ) * max_similarity(ti, selected)
3. Select term with highest score
4. Repeat until K terms selected
```

**Pros:**
- Reduces redundancy (avoids synonyms)
- Balanced relevance + diversity
- Proven effective in document retrieval

**Cons:**
- Slower (O(K²) comparisons)
- Requires term similarity computation
- May skip highly relevant synonyms

---

### 3. Coverage-Based Selection

**Method:** Select terms that maximize coverage of pseudo-relevant docs

**Algorithm:**
```
1. Track which docs each term appears in
2. Greedily select terms covering most uncovered docs
3. Stop when coverage plateau or K reached
```

**Pros:**
- Ensures broad coverage
- Reduces redundancy
- Good for diverse topics

**Cons:**
- May select rare terms
- No quality guarantee
- Ignores term importance

---

### 4. Threshold-Based Selection

**Method:** Select all terms above a score threshold

**Parameters:**
- Min score threshold (e.g., 0.5 * max_score)
- Max terms limit (safety cap)

**Pros:**
- Adaptive (variable expansion size)
- Quality guarantee (threshold)
- Handles varying query complexity

**Cons:**
- Unpredictable expansion size
- May select too few or too many
- Threshold tuning required

---

## Query Reformulation Methods

### 1. Append (Additive)

**Method:** Concatenate expansion terms to original query

**Formula:**
```
Q_new = Q_original + " " + t1 + " " + t2 + ... + tK
```

**Example:**
```
Original: "binary search tree"
Expanded: "binary search tree algorithm insertion traversal"
```

**Pros:**
- Simplest approach
- Preserves original query
- Works with any retrieval method
- No re-weighting needed

**Cons:**
- Treats all terms equally (no weighting)
- Can dilute original query signal
- May retrieve off-topic results

---

### 2. Reweight (Structured)

**Method:** Assign weights to original vs expansion terms

**Formula:**
```
Q_new = (w_orig * Q_original) + (w_exp * expansion_terms)
```

Typical weights:
- `w_orig` = 0.7-0.9 (favor original)
- `w_exp` = 0.1-0.3

**Implementation:**
- Use query parser with term weights
- OR: Repeat terms (e.g., original 3x, expansion 1x)

**Pros:**
- Maintains original query importance
- Prevents query drift
- Tunable balance
- Better precision than append

**Cons:**
- Requires weighted query support
- More complex
- Need to tune weights

---

### 3. Substitute (Replace)

**Method:** Replace low-quality query terms with better expansion terms

**When to use:**
- Original query is very short (1-2 words)
- Query has typos or ambiguous terms
- Expansion terms are clearly superior

**Algorithm:**
```
1. Score original query terms by quality
2. Identify low-quality terms (low IDF, typos)
3. Replace with top expansion terms
4. Keep high-quality original terms
```

**Pros:**
- Fixes poor queries
- Improves recall for vague queries
- Handles typos/stemming

**Cons:**
- Risky (may lose query intent)
- Hard to determine "low quality"
- Can drastically change meaning

---

### 4. Hybrid (Conditional)

**Method:** Choose strategy based on query characteristics

**Decision Logic:**
```typescript
if (queryLength < 3 && confidenceScore < 0.5) {
  // Short, low-confidence: aggressive expansion
  return substitute(query, expansionTerms);
} else if (queryLength >= 5 && confidenceScore > 0.7) {
  // Long, high-confidence: minimal expansion
  return append(query, expansionTerms.slice(0, 2));
} else {
  // Default: balanced reweighting
  return reweight(query, expansionTerms, 0.8, 0.2);
}
```

**Pros:**
- Adaptive to query quality
- Best of all methods
- Maximizes effectiveness
- Reduces query drift risk

**Cons:**
- Complex implementation
- Requires confidence scoring
- More decision points to tune

---

## When to Expand vs Keep Original

### Expansion Decision Factors

**1. Initial Retrieval Quality**
- **Expand if:** Top results have low relevance scores (e.g., < 0.5)
- **Skip if:** High confidence in top results (e.g., > 0.8)

**2. Query Length**
- **Expand if:** Query is short (1-3 words) → likely underspecified
- **Skip if:** Query is long (8+ words) → already detailed

**3. Term Overlap**
- **Expand if:** Low term overlap between query and top results
- **Skip if:** High term overlap → query already matches well

**4. Domain Coverage**
- **Expand if:** Query spans multiple topics (e.g., "data structures python")
- **Skip if:** Query is highly specific (e.g., "AVL tree rotation pseudocode")

**5. User History (Optional)**
- **Expand if:** User's previous queries were exploratory
- **Skip if:** User is known expert (based on profile)

### Recommended Expansion Criteria

```typescript
function shouldExpand(
  query: string,
  initialResults: RetrievalResult[]
): boolean {
  const queryLength = query.split(/\s+/).length;
  const avgScore = initialResults.slice(0, 5).reduce((sum, r) => sum + r.score, 0) / 5;

  // Short query with mediocre results: expand
  if (queryLength < 4 && avgScore < 0.6) return true;

  // Long query with good results: skip
  if (queryLength > 7 && avgScore > 0.7) return false;

  // Default: expand if below confidence threshold
  return avgScore < 0.65;
}
```

---

## Academic References

### Foundational Papers

1. **Rocchio, J. J. (1971)**
   *"Relevance feedback in information retrieval"*
   The SMART Retrieval System
   - Original Rocchio algorithm
   - Theoretical foundation for PRF

2. **Lavrenko, V., & Croft, W. B. (2001)**
   *"Relevance-based language models"*
   SIGIR 2001
   - Introduced RM3 relevance model
   - State-of-the-art PRF for language models

3. **Cormack, G. V., Clarke, C. L., & Buettcher, S. (2009)**
   *"Reciprocal rank fusion outperforms Condorcet and individual rank learning methods"*
   SIGIR 2009
   - RRF effectiveness proven
   - Relevant for fusion + expansion

4. **Amati, G., & Van Rijsbergen, C. J. (2002)**
   *"Probabilistic models of information retrieval based on measuring the divergence from randomness"*
   TOIS 2002
   - DFR framework (Bo1/Bo2)
   - Information-theoretic term weighting

### Modern Applications

5. **Azad, H. K., & Deepak, A. (2019)**
   *"Query expansion techniques for information retrieval: a survey"*
   Information Processing & Management
   - Comprehensive PRF survey
   - Comparison of techniques

6. **Zamani, H., & Croft, W. B. (2020)**
   *"Learning a query term weighting function with BERT"*
   SIGIR 2020
   - Neural query expansion
   - BERT for term selection

7. **Grootendorst, M. (2020)**
   *"KeyBERT: Minimal keyword extraction with BERT"*
   GitHub: MaartenGr/KeyBERT
   - Modern keyword extraction
   - Semantic term selection

### Benchmarks & Evaluations

8. **Carpineto, C., & Romano, G. (2012)**
   *"A survey of automatic query expansion in information retrieval"*
   ACM Computing Surveys
   - Meta-analysis of PRF effectiveness
   - Typical gains: 8-15% improvement in MAP
   - Risk: 5-10% chance of query drift

9. **TREC Robust Track (2004-2005)**
   - PRF consistently effective on robust queries
   - Best results: Rocchio with 5-10 expansion terms
   - Optimal K parameter: 3-5 pseudo-relevant docs

---

## Key Takeaways for QuokkaQ

### Recommended Approach

**Algorithm:** Rocchio-based PRF (simplicity + effectiveness)

**Term Extraction:** Query-biased TF-IDF (balance speed + quality)

**Term Selection:** Diversity-based with top-K (reduce redundancy)

**Reformulation:** Hybrid (adaptive to query quality)

**Decision Logic:** Expand if confidence < 0.65 or queryLength < 4

**Parameters:**
- Top-K pseudo-relevant docs: **3-5**
- Max expansion terms: **5-7**
- Min term score threshold: **0.3** (normalized)
- Original query weight: **0.8**
- Expansion weight: **0.2**

### Expected Performance

**Improvement:** 10-15% increase in recall (based on TREC benchmarks)

**Query Coverage:** 60%+ of queries expanded (target from context.md)

**Latency Impact:** <100ms additional (two-pass retrieval + term extraction)

**Risk Mitigation:**
- Cache expanded queries (avoid recomputation)
- Confidence-based expansion decision (reduce drift)
- Limit expansion size (prevent noise)

---

**Status:** Research complete. Ready for design phase.

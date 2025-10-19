# RAG Enhancement - Quick Reference

One-page cheat sheet for the new hybrid retrieval system.

---

## 🚀 Quick Start (3 Steps)

```typescript
// 1. Build context with hybrid retrieval
const builder = new CourseContextBuilder(course, materials);
const context = await builder.buildContext(question);

// 2. Generate answer with prompt caching
const provider = new AnthropicProvider({ apiKey, model });
const response = await provider.generate({
  systemPrompt: context.contextText,
  userPrompt: question,
});

// 3. Verify grounding
const verifier = new GroundingVerifier(provider);
const grounding = await verifier.verify({
  answer: response.content,
  materials: context.materials,
});
```

---

## 📦 Import Paths

```typescript
// Context building
import { CourseContextBuilder } from "@/lib/context/CourseContextBuilder";
import { MultiCourseContextBuilder } from "@/lib/context/MultiCourseContextBuilder";

// Prompts
import { CoursePromptBuilder } from "@/lib/llm/prompts/CoursePromptBuilder";
import { parseStructuredOutput } from "@/lib/llm/prompts/schemas";

// LLM Providers
import { AnthropicProvider } from "@/lib/llm/AnthropicProvider";
import { OpenAIProvider } from "@/lib/llm/OpenAIProvider";

// Grounding
import { GroundingVerifier } from "@/lib/llm/grounding";
```

---

## ⚙️ Configuration Defaults

| Feature | Default | Recommended |
|---------|---------|-------------|
| Max materials | 5 | 3-7 |
| Min relevance | 30 | 20-40 |
| Max tokens | 2000 | 1500-3000 |
| Grounding threshold | 0.7 | 0.6-0.8 |
| RRF k parameter | 60 | 60 (standard) |
| MMR lambda | 0.7 | 0.6-0.8 |
| Cache min tokens | 1024 | 1024+ |

---

## 🎯 Common Use Cases

### Use Case 1: Basic Q&A
```typescript
const context = await builder.buildContext(question);
const response = await provider.generate({
  systemPrompt: context.contextText,
  userPrompt: question,
});
```

### Use Case 2: With Grounding Check
```typescript
const context = await builder.buildContext(question);
const response = await provider.generate({ /* ... */ });
const grounding = await verifier.verify({
  answer: response.content,
  materials: context.materials,
});

if (!grounding.isGrounded) {
  // Fallback to hint-only response
}
```

### Use Case 3: Structured Output
```typescript
const promptBuilder = new CoursePromptBuilder();
const systemPrompt = promptBuilder.buildSystemPrompt(course, context, {
  enableStructuredOutput: true,
});

const response = await provider.generate({ systemPrompt, userPrompt });
const parsed = parseStructuredOutput(response.content);

// parsed = { answer, bullets, citations, confidence }
```

### Use Case 4: Multi-Course Search
```typescript
const multiBuilder = new MultiCourseContextBuilder(courses, allMaterials);
const context = await multiBuilder.buildContext(question, {
  maxCoursesToSearch: 3,
  maxMaterialsPerCourse: 3,
});
```

---

## 🔍 Retrieval Pipeline

```
User Question
     ↓
[BM25 Retriever]    ←→    [Embedding Retriever]
     ↓                            ↓
  Sparse Results            Dense Results
     ↓                            ↓
        [RRF Fusion - k=60]
               ↓
        [MMR Diversification - λ=0.7]
               ↓
        [Filter by minRelevance]
               ↓
        [Dynamic Excerpts ±350 chars]
               ↓
        Top N Materials
```

---

## 💰 Cost Optimization

### Anthropic Prompt Caching

```typescript
// First call: Cache write (1.25x cost)
const response1 = await provider.generate({
  systemPrompt, // >1024 tokens
  userPrompt: "Question 1",
  enableCaching: true,
});
// Cost: ~$0.0037 (1.25x normal)

// Second call: Cache read (0.1x cost)
const response2 = await provider.generate({
  systemPrompt, // Same prompt - cached!
  userPrompt: "Question 2",
  enableCaching: true,
});
// Cost: ~$0.0004 (90% discount!) 💰
```

**Cache Hit Rate = Savings:**
- 50% hit rate → 45% cost reduction
- 75% hit rate → 67.5% cost reduction
- 90% hit rate → 81% cost reduction

---

## 📊 Grounding Score Interpretation

| Score | Level | Action |
|-------|-------|--------|
| 0.8+ | Well-grounded | ✅ Show full answer |
| 0.5-0.79 | Partially-grounded | ⚠️ Show with warning |
| <0.5 | Poorly-grounded | ❌ Show hint only |

```typescript
if (grounding.score >= 0.8) {
  return { type: "full-answer", content: answer };
} else if (grounding.score >= 0.5) {
  return { type: "answer-with-warning", content: answer };
} else {
  return { type: "hint-only", content: generateHint(question) };
}
```

---

## 🐛 Quick Debugging

### Check Retrieval Quality
```typescript
const context = await builder.buildContext(question);
console.log(`Found ${context.materials.length} materials`);
context.materials.forEach(m => {
  console.log(`- ${m.title}: ${m.relevanceScore}%`);
});
```

### Check Cache Status
```typescript
const response = await provider.generate({ /* ... */ });
console.log({
  cacheHit: !!response.usage.cacheReadTokens,
  cacheRead: response.usage.cacheReadTokens,
  cacheWrite: response.usage.cacheCreationTokens,
  cost: response.usage.estimatedCost,
});
```

### Check Grounding Details
```typescript
const grounding = await verifier.verify({ /* ... */ });
console.log(`Score: ${grounding.score}`);
console.log(`Level: ${grounding.level}`);
console.log(`Supported: ${grounding.supportedClaims.length}`);
console.log(`Unsupported: ${grounding.unsupportedClaims.length}`);

grounding.unsupportedClaims.forEach(c => {
  console.log(`❌ ${c.claim} (${c.severity})`);
});
```

---

## ⚡ Performance Tips

1. **Reuse Builders** - Initialize once, reuse for multiple queries
   ```typescript
   const builder = new CourseContextBuilder(course, materials);
   // Reuse for many queries
   ```

2. **Batch Queries** - Process multiple questions in parallel
   ```typescript
   const contexts = await Promise.all(
     questions.map(q => builder.buildContext(q))
   );
   ```

3. **Cache Aggressively** - Use same system prompt across queries
   ```typescript
   const systemPrompt = promptBuilder.buildSystemPrompt(course, context);
   // Use for many user questions
   ```

4. **Lower Min Relevance** - Get more candidates for fusion
   ```typescript
   const context = await builder.buildContext(question, {
     minRelevance: 20, // Lower threshold = more candidates
   });
   ```

---

## 🔧 Tuning Guide

### Too Few Materials Retrieved?
- ✅ Lower `minRelevance` (try 20 instead of 30)
- ✅ Increase `maxMaterials` (try 7 instead of 5)
- ✅ Check material keywords and embeddings

### Too Many False Positives?
- ✅ Raise `minRelevance` (try 40 instead of 30)
- ✅ Increase `mmrLambda` for more diversity (try 0.8)
- ✅ Use `priorityTypes` to filter by material type

### Grounding Failures?
- ✅ Lower `threshold` (try 0.6 instead of 0.7)
- ✅ Provide more context materials
- ✅ Review `unsupportedClaims` to understand issues

### High Latency?
- ✅ Reduce `maxMaterials` (try 3 instead of 5)
- ✅ Reduce `maxTokens` (try 1500 instead of 2000)
- ✅ Enable prompt caching (90%+ queries should cache hit)

---

## 📝 Type Signatures

```typescript
// Context building
builder.buildContext(
  question: string,
  options?: {
    maxMaterials?: number;      // Default: 5
    minRelevance?: number;      // Default: 30
    maxTokens?: number;         // Default: 2000
    priorityTypes?: string[];   // Default: []
  }
): Promise<CourseContext>

// Grounding verification
verifier.verify(
  input: {
    question?: string;
    answer: string;
    materials: MaterialReference[];
    threshold?: number;         // Default: 0.7
  }
): Promise<GroundingResult>

// LLM generation
provider.generate(
  request: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    enableCaching?: boolean;    // Default: true
  }
): Promise<LLMResponse>
```

---

## 🎓 Learning Path

1. **Start Simple** - Use basic context building
2. **Add Caching** - Enable prompt caching for cost savings
3. **Add Grounding** - Verify answer quality
4. **Add Structure** - Use structured JSON output
5. **Tune Parameters** - Optimize for your use case

---

**Full Documentation:** See `USAGE.md` for detailed examples and explanations.

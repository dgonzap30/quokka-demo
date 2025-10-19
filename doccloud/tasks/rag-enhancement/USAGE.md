# RAG Enhancement - Usage Guide

**Created:** 2025-10-17
**Status:** Phase 1 Complete

This guide demonstrates how to use the new hybrid retrieval, prompt caching, and citation grounding features.

---

## Quick Start

### 1. Using Hybrid Retrieval

The hybrid retrieval system is automatically integrated into `CourseContextBuilder`. No manual setup required!

```typescript
import { CourseContextBuilder } from "@/lib/context/CourseContextBuilder";

// Create builder (automatically initializes hybrid retrieval)
const builder = new CourseContextBuilder(course, materials);

// Build context with hybrid retrieval
const context = await builder.buildContext(
  "What is the time complexity of quicksort?",
  {
    maxMaterials: 5,
    minRelevance: 30,
    maxTokens: 2000,
    priorityTypes: ["lecture", "reading"]
  }
);

// Context now contains:
// - Ranked materials (BM25 + embeddings + RRF fusion)
// - Dynamic span-aware excerpts
// - Course metadata
console.log(context.materials); // Top 5 most relevant materials
console.log(context.contextText); // Formatted context with excerpts
```

**What Happens Behind the Scenes:**
1. **BM25 Retriever** finds keyword matches
2. **Embedding Retriever** finds semantically similar content
3. **RRF Fusion** merges results (rank-based, no normalization needed)
4. **MMR Diversifier** removes redundant materials
5. **Dynamic Excerpts** extract relevant ±350 char windows

---

## 2. Using Course-Aware Prompts

The `CoursePromptBuilder` automatically selects the right template based on course type:

```typescript
import { CoursePromptBuilder } from "@/lib/llm/prompts/CoursePromptBuilder";

const promptBuilder = new CoursePromptBuilder();

// Auto-detects course type (CS, Math, or General)
const systemPrompt = promptBuilder.buildSystemPrompt(
  course,
  context,
  {
    includeExamples: true,
    enableStructuredOutput: true,
  }
);

// For CS courses, uses CS-specific template with code examples
// For Math courses, uses LaTeX-friendly template
// Otherwise, uses general academic template
```

**Structured Output Schema:**

The LLM will return JSON matching this format:

```json
{
  "answer": "Main response text (200-400 words)...",
  "bullets": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "citations": [
    {
      "materialId": "mat_123",
      "excerpt": "Relevant quote from material",
      "relevance": 95
    }
  ],
  "confidence": {
    "level": "high",
    "score": 85
  }
}
```

---

## 3. Using Prompt Caching

Prompt caching is enabled by default for all LLM calls with system prompts >1024 tokens.

### Anthropic Example

```typescript
import { AnthropicProvider } from "@/lib/llm/AnthropicProvider";

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-3-haiku-20240307",
  temperature: 0.7,
  maxTokens: 1000,
});

const response = await provider.generate({
  systemPrompt: longSystemPrompt, // >1024 tokens - will be cached!
  userPrompt: "What is quicksort?",
  enableCaching: true, // Default: true
});

// First call: cache write (1.25x cost)
// Subsequent calls: cache read (0.1x cost - 90% discount!)

console.log(response.usage.cacheCreationTokens); // First call only
console.log(response.usage.cacheReadTokens); // Subsequent calls
console.log(response.usage.estimatedCost); // Accounts for cache pricing
```

### OpenAI Example

```typescript
import { OpenAIProvider } from "@/lib/llm/OpenAIProvider";

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000,
});

// OpenAI handles caching automatically server-side
// No code changes needed - just works!
const response = await provider.generate({
  systemPrompt: longSystemPrompt,
  userPrompt: "What is quicksort?",
});
```

**Best Practices:**
- ✅ Cache system prompts (static course context)
- ✅ Cache prompts >1024 tokens (Anthropic threshold)
- ❌ Don't cache user prompts (always changing)
- ❌ Don't cache verification calls (one-off)

---

## 4. Using Citation Grounding Verifier

Verify that AI-generated answers are properly grounded in course materials:

```typescript
import { GroundingVerifier } from "@/lib/llm/grounding";
import { AnthropicProvider } from "@/lib/llm/AnthropicProvider";

// Create verifier (uses LLM-as-judge pattern)
const provider = new AnthropicProvider({ /* config */ });
const verifier = new GroundingVerifier(provider, {
  threshold: 0.7,        // 70% claims must be supported
  strictMode: false,     // Allow some unsupported claims
  temperature: 0.0,      // Deterministic verification
});

// Verify an AI answer against materials
const result = await verifier.verify({
  question: "What is the time complexity of quicksort?",
  answer: aiGeneratedAnswer,
  materials: rankedMaterials,
  threshold: 0.7, // Optional: override default
});

// Check grounding result
console.log(result.score); // 0.85 (85% of claims supported)
console.log(result.isGrounded); // true (passes 0.7 threshold)
console.log(result.level); // "well-grounded"

// Inspect unsupported claims
result.unsupportedClaims.forEach(claim => {
  console.log(`❌ "${claim.claim}"`);
  console.log(`   Reason: ${claim.reason}`);
  console.log(`   Severity: ${claim.severity}`);
});

// Inspect supported claims
result.supportedClaims.forEach(claim => {
  console.log(`✅ "${claim.claim}"`);
  console.log(`   Confidence: ${claim.confidence * 100}%`);
});
```

**Grounding Levels:**
- `well-grounded`: score ≥ 0.8 (80%+ claims supported)
- `partially-grounded`: score ≥ 0.5 (50-79% claims supported)
- `poorly-grounded`: score < 0.5 (<50% claims supported)

**Strict Mode:**

```typescript
const verifier = new GroundingVerifier(provider, {
  strictMode: true, // Fail on ANY unsupported claim
});

const result = await verifier.verify({ /* ... */ });

// result.isGrounded === true only if ALL claims are supported
// Useful for high-stakes educational content
```

---

## 5. Complete End-to-End Example

Here's how to use all features together in a Q&A pipeline:

```typescript
import { CourseContextBuilder } from "@/lib/context/CourseContextBuilder";
import { CoursePromptBuilder } from "@/lib/llm/prompts/CoursePromptBuilder";
import { AnthropicProvider } from "@/lib/llm/AnthropicProvider";
import { GroundingVerifier } from "@/lib/llm/grounding";
import { parseStructuredOutput } from "@/lib/llm/prompts/schemas";

async function generateAIAnswer(
  course: Course,
  materials: CourseMaterial[],
  question: string
) {
  // 1. Build context with hybrid retrieval
  const contextBuilder = new CourseContextBuilder(course, materials);
  const context = await contextBuilder.buildContext(question, {
    maxMaterials: 5,
    minRelevance: 30,
  });

  if (context.materials.length === 0) {
    return { error: "No relevant materials found" };
  }

  // 2. Build course-aware system prompt
  const promptBuilder = new CoursePromptBuilder();
  const systemPrompt = promptBuilder.buildSystemPrompt(course, context, {
    includeExamples: true,
    enableStructuredOutput: true,
  });

  // 3. Generate answer with prompt caching
  const provider = new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-3-haiku-20240307",
    temperature: 0.7,
    maxTokens: 2000,
  });

  const response = await provider.generate({
    systemPrompt, // Will be cached if >1024 tokens
    userPrompt: question,
    enableCaching: true,
  });

  if (!response.success) {
    return { error: response.error };
  }

  // 4. Parse structured output
  const parsed = parseStructuredOutput(response.content);
  if (!parsed) {
    return { error: "Failed to parse structured output" };
  }

  // 5. Verify grounding
  const verifier = new GroundingVerifier(provider, {
    threshold: 0.7,
    strictMode: false,
  });

  const grounding = await verifier.verify({
    question,
    answer: parsed.answer,
    materials: context.materials,
  });

  // 6. Return complete result
  return {
    answer: parsed.answer,
    bullets: parsed.bullets,
    citations: parsed.citations,
    confidence: parsed.confidence,
    grounding: {
      score: grounding.score,
      isGrounded: grounding.isGrounded,
      level: grounding.level,
      summary: grounding.summary,
      unsupportedClaims: grounding.unsupportedClaims,
    },
    metadata: {
      materialsUsed: context.materials.length,
      tokensUsed: response.usage.totalTokens,
      cost: response.usage.estimatedCost,
      cacheHit: !!response.usage.cacheReadTokens,
    },
  };
}

// Usage
const result = await generateAIAnswer(course, materials, "What is quicksort?");

if (result.error) {
  console.error("Error:", result.error);
} else {
  console.log("Answer:", result.answer);
  console.log("Confidence:", result.confidence.level);
  console.log("Grounding:", result.grounding.level);
  console.log("Cost:", `$${result.metadata.cost.toFixed(4)}`);
}
```

---

## Configuration Options

### Hybrid Retrieval Config

```typescript
const context = await builder.buildContext(question, {
  maxMaterials: 5,      // Max materials to return
  minRelevance: 30,     // Min relevance score (0-100)
  maxTokens: 2000,      // Max context tokens
  priorityTypes: [      // Prioritize certain material types
    "lecture",
    "reading",
    "homework"
  ],
});
```

### Grounding Config

```typescript
const verifier = new GroundingVerifier(provider, {
  threshold: 0.7,           // Min score to pass (0-1)
  strictMode: false,        // Fail on any unsupported claim
  temperature: 0.0,         // LLM temperature for verification
});
```

### Prompt Builder Config

```typescript
const systemPrompt = promptBuilder.buildSystemPrompt(course, context, {
  includeExamples: true,          // Include example Q&A pairs
  enableStructuredOutput: true,   // Request JSON output
  tone: "professional",           // Response tone
});
```

---

## Performance Monitoring

### Hybrid Retrieval Metrics

```typescript
const context = await builder.buildContext(question);

// Metrics are logged to console:
// [HybridRetriever] Query: "What is quicksort..." | Results: 5 | Time: 45.23ms
// [CourseContextBuilder] Initialized hybrid retrieval for CS101
```

### LLM Cost Tracking

```typescript
const response = await provider.generate({ /* ... */ });

console.log("Token Usage:", {
  promptTokens: response.usage.promptTokens,
  completionTokens: response.usage.completionTokens,
  cacheCreationTokens: response.usage.cacheCreationTokens, // First call
  cacheReadTokens: response.usage.cacheReadTokens,         // Subsequent calls
  estimatedCost: response.usage.estimatedCost,
});

// Example output:
// {
//   promptTokens: 0,              // Served from cache
//   completionTokens: 250,
//   cacheCreationTokens: 0,       // Already cached
//   cacheReadTokens: 1500,        // Read from cache (90% discount!)
//   estimatedCost: 0.000412       // $0.0004 (vs $0.0037 without cache)
// }
```

---

## Troubleshooting

### Issue: "No relevant materials found"

**Cause:** Query doesn't match any materials (BM25 or embeddings)

**Solution:**
```typescript
// Lower the minRelevance threshold
const context = await builder.buildContext(question, {
  minRelevance: 20, // Instead of 30
});
```

### Issue: "Grounding score too low"

**Cause:** AI answer includes claims not supported by materials

**Solution:**
```typescript
// Lower threshold or inspect unsupported claims
const grounding = await verifier.verify({
  question,
  answer,
  materials,
  threshold: 0.5, // Lower threshold
});

// Review what's unsupported
grounding.unsupportedClaims.forEach(claim => {
  console.log(`Unsupported: ${claim.claim}`);
  console.log(`Reason: ${claim.reason}`);
});
```

### Issue: "Cache not working"

**Cause:** System prompt <1024 tokens (Anthropic) or caching disabled

**Solution:**
```typescript
// Ensure system prompt is long enough
const systemPrompt = promptBuilder.buildSystemPrompt(course, context, {
  includeExamples: true, // Adds examples to increase token count
});

// Verify caching is enabled
const response = await provider.generate({
  systemPrompt,
  userPrompt: question,
  enableCaching: true, // Explicitly enable
});
```

---

## Next Steps

With Phase 1 complete, you can now:

1. **Test retrieval quality** - Compare hybrid vs keyword-only on test questions
2. **Measure cost savings** - Track cache hit rates and cost reduction
3. **Tune thresholds** - Adjust grounding threshold based on use case
4. **Extend templates** - Add domain-specific course templates
5. **Implement Phase 2** - Adaptive retrieval, hierarchical context

---

**Need Help?** See:
- `doccloud/tasks/rag-enhancement/context.md` - Implementation details
- `lib/retrieval/types.ts` - Retrieval interfaces
- `lib/llm/grounding/types.ts` - Grounding interfaces
- `lib/llm/prompts/schemas.ts` - Output schemas

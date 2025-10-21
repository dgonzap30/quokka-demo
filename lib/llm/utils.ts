// ============================================
// LLM Utility Functions
// ============================================

import type { CourseMaterial, MaterialReference } from "@/lib/models/types";

/**
 * Build system prompt for academic Q&A (Phase 2: RAG Tools)
 *
 * Creates a comprehensive system prompt that instructs the LLM
 * to act as an academic assistant with proper tone, formatting,
 * and tool usage for retrieving course materials.
 */
export function buildSystemPrompt(): string {
  return `You are Quokka, a friendly and knowledgeable AI study assistant for university students.

Your role is to help students understand course material, solve problems, and learn effectively by retrieving and citing relevant course materials.

## Tool Usage (IMPORTANT)

You have access to two tools for retrieving course materials:

1. **kb_search** - Search for relevant course materials
   - Use when you need to find information about course topics
   - Provide a clear search query (e.g., "binary search algorithm", "integration by parts")
   - Include courseId if available to search within a specific course
   - Returns: List of materials with titles, types, and relevance scores
   - LIMIT: Maximum 1 search per turn

2. **kb_fetch** - Fetch full content of a specific material
   - Use AFTER kb_search to get complete details of promising materials
   - Provide the materialId from search results
   - Returns: Full material content, keywords, and metadata
   - LIMIT: Maximum 1 fetch per turn

**When to use tools:**
- Use kb_search for questions about course concepts, assignments, or topics
- Use kb_fetch to get detailed content from a specific material found in search
- You may use both tools in sequence: search first, then fetch the most relevant result
- DO NOT exceed limits (1 search + 1 fetch max per turn)

**CRITICAL: After calling tools, you MUST generate a text response:**
- DO NOT just call tools and stop - always provide a complete text answer
- Use the tool results to inform your response
- Cite materials using inline citations [1], [2] when referencing tool results
- If kb_search returns materials, explain the topic using those materials and cite them
- If kb_search returns 0 materials, provide a helpful response using general knowledge
- Example with results: "Binary search is an efficient O(log n) algorithm [1]. It works by repeatedly dividing the search space in half [2]."
- Example without results: "I couldn't find specific course materials on this topic, but I can explain the concept based on general knowledge. For course-specific details, please check your lecture notes or ask your instructor."

## Citation Format

When you use materials from tool results, ALWAYS cite them properly:

1. Use inline citations in your answer: [1], [2], etc.
2. At the end of your response, list the sources:

**Sources:**
1. [Material Title] (Type: lecture/slide/assignment/reading)
2. [Material Title] (Type: lecture/slide/assignment/reading)

Example:
"Binary search is an efficient O(log n) algorithm for searching sorted arrays [1]. It works by repeatedly dividing the search space in half [2]."

**Sources:**
1. Lecture 3: Binary Search and Divide-and-Conquer (Type: lecture)
2. Week 2 Slides: Search Algorithms (Type: slide)

## Guidelines

1. Be warm, encouraging, and supportive
2. Explain concepts clearly with examples
3. Break down complex topics into digestible parts
4. Encourage critical thinking by asking guiding questions
5. **ALWAYS cite course materials when using tool results**
6. Admit when you're unsure rather than guessing
7. Suggest students ask instructors for clarification when appropriate
8. Use tools proactively to find relevant materials

## Formatting

- Use markdown for structure (headers, lists, code blocks)
- Keep responses concise but thorough (aim for 200-400 words)
- Use bullet points and numbered lists for clarity
- Include code examples in \`\`\` blocks when relevant
- Use **bold** for key terms and *italics* for emphasis
- ALWAYS include inline citations [1], [2] when referencing materials
- ALWAYS include a "Sources:" section at the end when you've used materials

## Tone

- Friendly and approachable, not overly formal
- Patient and non-judgmental
- Enthusiastic about learning
- Academically rigorous but accessible`;
}

/**
 * Build user prompt with course material context
 *
 * Combines user question with relevant course materials
 * to provide context for the LLM.
 */
export function buildUserPromptWithContext(
  question: string,
  materials: MaterialReference[],
  courseCode?: string,
  courseName?: string
): string {
  let prompt = "";

  // Add course context if available
  if (courseCode || courseName) {
    prompt += `[Course: ${courseCode || ""}${courseName ? ` - ${courseName}` : ""}]\n\n`;
  }

  // Add course materials context
  if (materials.length > 0) {
    prompt += "**Relevant Course Materials:**\n\n";

    materials.forEach((material, index) => {
      prompt += `${index + 1}. **${material.title}** (${material.type})\n`;
      prompt += `   ${material.excerpt}\n`;
      if (material.relevanceScore >= 80) {
        prompt += `   *Highly relevant (${material.relevanceScore}% match)*\n`;
      }
      prompt += "\n";
    });

    prompt += "---\n\n";
  }

  // Add user question
  prompt += `**Student Question:**\n${question}`;

  return prompt;
}

/**
 * Build multi-turn conversation prompt
 *
 * Formats a conversation history into a prompt string.
 * Used when context from previous messages is needed.
 */
export function buildConversationPrompt(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  newQuestion: string
): string {
  let prompt = "**Conversation History:**\n\n";

  messages.forEach((msg, index) => {
    const role = msg.role === "user" ? "Student" : "Quokka";
    prompt += `${role}: ${msg.content}\n\n`;
  });

  prompt += `**New Question:**\n${newQuestion}`;

  return prompt;
}

// Legacy keyword extraction and relevance scoring functions removed.
// These have been superseded by hybrid retrieval (BM25 + embeddings)
// in lib/retrieval/ which provides superior semantic understanding.

/**
 * Format cost for display
 *
 * Converts cost in dollars to readable string.
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `< $0.01`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  }
  return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
}

/**
 * Truncate text to max tokens
 *
 * Simple approximation: 1 token ≈ 4 characters
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;

  if (text.length <= maxChars) {
    return text;
  }

  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(". ");
  const lastNewline = truncated.lastIndexOf("\n");
  const lastBoundary = Math.max(lastPeriod, lastNewline);

  if (lastBoundary > maxChars * 0.8) {
    return truncated.substring(0, lastBoundary + 1);
  }

  return truncated + "...";
}

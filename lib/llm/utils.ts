// ============================================
// LLM Utility Functions
// ============================================

import type { CourseMaterial, MaterialReference } from "@/lib/models/types";

/**
 * Build system prompt for academic Q&A
 *
 * Creates a comprehensive system prompt that instructs the LLM
 * to act as an academic assistant with proper tone and formatting.
 */
export function buildSystemPrompt(): string {
  return `You are Quokka, a friendly and knowledgeable AI study assistant for university students.

Your role is to help students understand course material, solve problems, and learn effectively.

Guidelines:
1. Be warm, encouraging, and supportive
2. Explain concepts clearly with examples
3. Break down complex topics into digestible parts
4. Encourage critical thinking by asking guiding questions
5. Reference provided course materials when relevant
6. Admit when you're unsure rather than guessing
7. Suggest students ask instructors for clarification when appropriate

Formatting:
- Use markdown for structure (headers, lists, code blocks)
- Keep responses concise but thorough (aim for 200-400 words)
- Use bullet points and numbered lists for clarity
- Include code examples in \`\`\` blocks when relevant
- Use **bold** for key terms and *italics* for emphasis

Tone:
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

/**
 * Extract keywords from text for material matching
 *
 * Removes common words and returns meaningful keywords.
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "may", "might", "can", "this", "that",
    "these", "those", "what", "which", "who", "when", "where", "why", "how",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
}

/**
 * Calculate material relevance score
 *
 * Scores a material based on keyword matches with the query.
 * Returns a score from 0-100.
 */
export function calculateRelevanceScore(
  queryKeywords: string[],
  materialKeywords: string[],
  materialContent: string
): number {
  if (queryKeywords.length === 0) return 0;

  // Count keyword matches in material keywords
  const keywordMatches = queryKeywords.filter(q =>
    materialKeywords.some(m => m.includes(q) || q.includes(m))
  ).length;

  // Count keyword matches in material content
  const contentLower = materialContent.toLowerCase();
  const contentMatches = queryKeywords.filter(q =>
    contentLower.includes(q)
  ).length;

  // Keyword matches are weighted higher than content matches
  const keywordScore = (keywordMatches / queryKeywords.length) * 60;
  const contentScore = (contentMatches / queryKeywords.length) * 40;

  return Math.min(100, Math.round(keywordScore + contentScore));
}

/**
 * Rank course materials by relevance
 *
 * Sorts materials by relevance score and returns top N.
 */
export function rankMaterials(
  materials: CourseMaterial[],
  query: string,
  limit: number = 10
): Array<CourseMaterial & { relevanceScore: number; matchedKeywords: string[] }> {
  const queryKeywords = extractKeywords(query);

  const scored = materials.map(material => {
    const relevanceScore = calculateRelevanceScore(
      queryKeywords,
      material.keywords,
      material.content
    );

    const matchedKeywords = queryKeywords.filter(q =>
      material.keywords.some(m => m.includes(q) || q.includes(m)) ||
      material.content.toLowerCase().includes(q)
    );

    return {
      ...material,
      relevanceScore,
      matchedKeywords,
    };
  });

  return scored
    .filter(m => m.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

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

// ============================================
// Structured Output Schemas for AI Responses
// ============================================

/**
 * Structured AI answer format
 *
 * Ensures consistent, parseable responses from the LLM
 * with proper citations and confidence indicators.
 */
export interface StructuredAIAnswer {
  answer: string; // Main response (200-400 words, markdown formatted)
  bullets: string[]; // Key takeaways (3-5 bullet points)
  citations: Citation[]; // Sources used in the answer
  confidence: Confidence; // How confident the AI is in the response
  reasoning?: string; // Optional: Chain of thought or explanation
}

/**
 * Citation reference to course material
 */
export interface Citation {
  materialId: string; // ID of the course material
  excerpt: string; // Relevant excerpt from the material
  relevance: number; // Relevance score 0-100
}

/**
 * Confidence assessment
 */
export interface Confidence {
  level: "high" | "medium" | "low"; // Categorical confidence
  score: number; // Numeric score 0-100
  reason?: string; // Why this confidence level
}

/**
 * JSON Schema for structured output
 *
 * Used with OpenAI's structured output feature or as
 * formatting instructions for other providers.
 */
export const STRUCTURED_ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description:
        "Main response to the question. 200-400 words. Use markdown formatting (bold, italics, code blocks, lists). Be clear, concise, and educational.",
    },
    bullets: {
      type: "array",
      description: "3-5 key takeaways or important points. Each should be a complete sentence.",
      items: {
        type: "string",
      },
      minItems: 3,
      maxItems: 5,
    },
    citations: {
      type: "array",
      description: "Course materials referenced in the answer. Include ALL materials you used.",
      items: {
        type: "object",
        properties: {
          materialId: {
            type: "string",
            description: "ID of the course material",
          },
          excerpt: {
            type: "string",
            description:
              "Specific excerpt from the material that supports your answer (50-150 words)",
          },
          relevance: {
            type: "number",
            description: "How relevant this material is to the answer (0-100)",
            minimum: 0,
            maximum: 100,
          },
        },
        required: ["materialId", "excerpt", "relevance"],
      },
    },
    confidence: {
      type: "object",
      description: "Your confidence in this answer based on the available materials",
      properties: {
        level: {
          type: "string",
          enum: ["high", "medium", "low"],
          description:
            "high: Answer directly supported by materials. medium: Reasonable inference from materials. low: Limited material coverage or requires assumptions.",
        },
        score: {
          type: "number",
          description: "Numeric confidence score (0-100)",
          minimum: 0,
          maximum: 100,
        },
        reason: {
          type: "string",
          description: "Brief explanation for this confidence level",
        },
      },
      required: ["level", "score"],
    },
    reasoning: {
      type: "string",
      description: "Optional: Your step-by-step reasoning or thought process",
    },
  },
  required: ["answer", "bullets", "citations", "confidence"],
} as const;

/**
 * Get formatted JSON schema instructions
 *
 * Generates a prompt section that instructs the LLM
 * to return structured JSON output.
 */
export function getStructuredOutputInstructions(): string {
  return `
**IMPORTANT: You MUST respond with valid JSON matching this exact schema:**

\`\`\`json
{
  "answer": "Main response (200-400 words, markdown formatting)",
  "bullets": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "citations": [
    {
      "materialId": "material-id-here",
      "excerpt": "Relevant excerpt from the material",
      "relevance": 85
    }
  ],
  "confidence": {
    "level": "high|medium|low",
    "score": 85,
    "reason": "Why you have this confidence level"
  }
}
\`\`\`

**Critical Rules:**
1. Return ONLY valid JSON - no extra text before or after
2. Include 3-5 bullets (not more, not less)
3. Cite ALL materials you reference in your answer
4. Be honest about confidence - mark as "low" if materials are insufficient
5. Use markdown in the "answer" field (bold, italics, code blocks, lists)
`;
}

/**
 * Validate structured answer
 *
 * Check if a response matches the expected schema.
 */
export function validateStructuredAnswer(data: unknown): data is StructuredAIAnswer {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.answer !== "string") return false;
  if (!Array.isArray(obj.bullets) || obj.bullets.length < 3 || obj.bullets.length > 5) {
    return false;
  }
  if (!Array.isArray(obj.citations)) return false;
  if (!obj.confidence || typeof obj.confidence !== "object") return false;

  // Validate confidence
  const confidence = obj.confidence as Record<string, unknown>;
  if (!["high", "medium", "low"].includes(confidence.level as string)) return false;
  if (typeof confidence.score !== "number" || confidence.score < 0 || confidence.score > 100) {
    return false;
  }

  return true;
}

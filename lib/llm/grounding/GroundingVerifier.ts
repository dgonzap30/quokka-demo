// ============================================
// Citation Grounding Verifier
// ============================================

import type { BaseLLMProvider } from "../BaseLLMProvider";
import type {
  GroundingResult,
  GroundingCheckInput,
  GroundingConfig,
  GroundedClaim,
  UnsupportedClaim,
} from "./types";
import { DEFAULT_GROUNDING_CONFIG } from "./types";

/**
 * Citation Grounding Verifier
 *
 * Validates that AI-generated answers are properly grounded
 * in provided course materials using an LLM-as-judge pattern.
 *
 * Approach:
 * 1. Extract claims from the AI answer
 * 2. For each claim, check if it's supported by materials
 * 3. Calculate overall grounding score
 * 4. Return verification result
 *
 * This prevents hallucinations and ensures answers are evidence-based.
 */
export class GroundingVerifier {
  private llmProvider: BaseLLMProvider;
  private config: GroundingConfig;

  constructor(llmProvider: BaseLLMProvider, config?: Partial<GroundingConfig>) {
    this.llmProvider = llmProvider;
    this.config = { ...DEFAULT_GROUNDING_CONFIG, ...config };
  }

  /**
   * Verify that an answer is grounded in course materials
   *
   * @param input - Answer and materials to verify
   * @returns Grounding verification result
   */
  async verify(input: GroundingCheckInput): Promise<GroundingResult> {
    const threshold = input.threshold ?? this.config.threshold;

    try {
      // Build verification prompt
      const verificationPrompt = this.buildVerificationPrompt(input);

      // Call LLM to assess grounding
      const response = await this.llmProvider.generate({
        systemPrompt: this.getSystemPrompt(),
        userPrompt: verificationPrompt,
        temperature: this.config.temperature,
        maxTokens: 2000,
        enableCaching: false, // Don't cache verification calls
      });

      if (!response.success) {
        throw new Error(`Grounding verification failed: ${response.error}`);
      }

      // Parse LLM response
      const parsed = this.parseVerificationResponse(response.content);

      // Calculate overall grounding score
      const totalClaims = parsed.supportedClaims.length + parsed.unsupportedClaims.length;
      const score =
        totalClaims > 0 ? parsed.supportedClaims.length / totalClaims : 0;

      // Determine grounding level
      let level: "well-grounded" | "partially-grounded" | "poorly-grounded";
      if (score >= 0.8) {
        level = "well-grounded";
      } else if (score >= 0.5) {
        level = "partially-grounded";
      } else {
        level = "poorly-grounded";
      }

      // Check if passes threshold
      const isGrounded = this.config.strictMode
        ? parsed.unsupportedClaims.length === 0
        : score >= threshold;

      return {
        score,
        isGrounded,
        level,
        supportedClaims: parsed.supportedClaims,
        unsupportedClaims: parsed.unsupportedClaims,
        summary: this.generateSummary(score, parsed.unsupportedClaims.length),
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[GroundingVerifier] Verification error:", error);

      // Return conservative result on error
      return {
        score: 0.5,
        isGrounded: false,
        level: "partially-grounded",
        supportedClaims: [],
        unsupportedClaims: [],
        summary: "Grounding verification failed - error during analysis",
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Build verification prompt for LLM judge
   */
  private buildVerificationPrompt(input: GroundingCheckInput): string {
    let prompt = "";

    // Add question context if provided
    if (input.question) {
      prompt += `**Original Question:**\n${input.question}\n\n`;
    }

    // Add materials provided as context
    prompt += `**Course Materials Provided:**\n\n`;
    input.materials.forEach((material, index) => {
      prompt += `${index + 1}. **${material.title}** (${material.type})\n`;
      prompt += `   Excerpt: ${material.excerpt}\n\n`;
    });

    prompt += `---\n\n`;

    // Add answer to verify
    prompt += `**AI-Generated Answer to Verify:**\n\n${input.answer}\n\n`;

    prompt += `---\n\n`;

    // Add verification instructions
    prompt += `**Task:**\n`;
    prompt += `Analyze the AI-generated answer and determine which claims are supported by the provided course materials.\n\n`;

    prompt += `For each factual claim in the answer:\n`;
    prompt += `1. Check if it is directly supported by the course materials\n`;
    prompt += `2. If supported, note which material(s) support it\n`;
    prompt += `3. If unsupported, explain why and assess severity\n\n`;

    prompt += `Return your analysis in JSON format:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "supportedClaims": [\n`;
    prompt += `    {\n`;
    prompt += `      "claim": "The specific claim text",\n`;
    prompt += `      "supportingMaterialIndices": [0, 1],\n`;
    prompt += `      "confidence": 0.95\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "unsupportedClaims": [\n`;
    prompt += `    {\n`;
    prompt += `      "claim": "The unsupported claim text",\n`;
    prompt += `      "reason": "Why this claim lacks support",\n`;
    prompt += `      "severity": "high|medium|low"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n`;

    return prompt;
  }

  /**
   * System prompt for grounding verification
   */
  private getSystemPrompt(): string {
    return `You are a rigorous academic fact-checker tasked with verifying that AI-generated answers are properly grounded in provided course materials.

Your role is to:
1. Identify factual claims in the AI-generated answer
2. Check each claim against the provided course materials
3. Mark claims as supported or unsupported
4. Be strict - only mark claims as supported if they are directly stated or clearly implied in the materials

Guidelines:
- A claim is SUPPORTED if it is directly stated in or clearly follows from the materials
- A claim is UNSUPPORTED if it requires external knowledge or makes assumptions beyond the materials
- Be conservative - when in doubt, mark as unsupported
- Distinguish between high-severity unsupported claims (core facts) and low-severity ones (minor details)

Return ONLY valid JSON matching the specified schema.`;
  }

  /**
   * Parse LLM verification response
   */
  private parseVerificationResponse(content: string): {
    supportedClaims: GroundedClaim[];
    unsupportedClaims: UnsupportedClaim[];
  } {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/) ||
                       content.match(/```\s*\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonString);

      // Transform parsed data to match our types
      const supportedClaims: GroundedClaim[] = (parsed.supportedClaims || []).map(
        (claim: {
          claim: string;
          supportingMaterialIndices?: number[];
          confidence: number;
        }) => ({
          claim: claim.claim,
          supportingMaterials: [], // Would need material references passed in
          confidence: claim.confidence,
        })
      );

      const unsupportedClaims: UnsupportedClaim[] = (parsed.unsupportedClaims || []).map(
        (claim: { claim: string; reason: string; severity: "high" | "medium" | "low" }) => ({
          claim: claim.claim,
          reason: claim.reason,
          severity: claim.severity,
        })
      );

      return { supportedClaims, unsupportedClaims };
    } catch (error) {
      console.error("[GroundingVerifier] Failed to parse verification response:", error);

      // Return empty result on parse error
      return {
        supportedClaims: [],
        unsupportedClaims: [],
      };
    }
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(score: number, unsupportedCount: number): string {
    if (score >= 0.8) {
      return `Answer is well-grounded in course materials (${Math.round(score * 100)}% of claims supported).`;
    } else if (score >= 0.5) {
      return `Answer is partially grounded. ${unsupportedCount} claim(s) lack clear support from materials.`;
    } else {
      return `Answer is poorly grounded. Majority of claims lack support from course materials.`;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GroundingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GroundingConfig {
    return { ...this.config };
  }
}

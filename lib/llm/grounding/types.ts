// ============================================
// Citation Grounding Types
// ============================================

import type { MaterialReference } from "@/lib/models/types";

/**
 * Grounding check result
 *
 * Assesses whether an AI-generated answer is properly
 * grounded in the provided course materials.
 */
export interface GroundingResult {
  /** Overall grounding score (0-1, higher = better grounded) */
  score: number;

  /** Whether the answer passes grounding threshold */
  isGrounded: boolean;

  /** Categorical assessment */
  level: "well-grounded" | "partially-grounded" | "poorly-grounded";

  /** Claims that are supported by materials */
  supportedClaims: GroundedClaim[];

  /** Claims that lack support in materials */
  unsupportedClaims: UnsupportedClaim[];

  /** Overall assessment summary */
  summary: string;

  /** Timestamp of verification */
  verifiedAt: string;
}

/**
 * A claim that is supported by course materials
 */
export interface GroundedClaim {
  /** The claim text from the answer */
  claim: string;

  /** Material(s) that support this claim */
  supportingMaterials: MaterialReference[];

  /** Confidence that this is correctly grounded (0-1) */
  confidence: number;
}

/**
 * A claim that lacks support in course materials
 */
export interface UnsupportedClaim {
  /** The claim text from the answer */
  claim: string;

  /** Reason why this claim is unsupported */
  reason: string;

  /** Severity: how critical is this unsupported claim? */
  severity: "high" | "medium" | "low";
}

/**
 * Input for grounding verification
 */
export interface GroundingCheckInput {
  /** The AI-generated answer to verify */
  answer: string;

  /** Course materials that were provided as context */
  materials: MaterialReference[];

  /** Optional: The original question (for relevance check) */
  question?: string;

  /** Grounding threshold (0-1, default: 0.7) */
  threshold?: number;
}

/**
 * Configuration for grounding verifier
 */
export interface GroundingConfig {
  /** Minimum score to consider answer well-grounded (0-1) */
  threshold: number;

  /** Whether to use strict mode (fails on any unsupported claim) */
  strictMode: boolean;

  /** Model to use for verification */
  verificationModel?: string;

  /** Temperature for verification LLM call */
  temperature?: number;
}

/**
 * Default grounding configuration
 */
export const DEFAULT_GROUNDING_CONFIG: GroundingConfig = {
  threshold: 0.7,
  strictMode: false,
  temperature: 0.0, // Deterministic verification
};

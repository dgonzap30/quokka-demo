// ============================================
// Citation Grounding Module - Public API
// ============================================

// Export types
export type {
  GroundingResult,
  GroundedClaim,
  UnsupportedClaim,
  GroundingCheckInput,
  GroundingConfig,
} from "./types";
export { DEFAULT_GROUNDING_CONFIG } from "./types";

// Export verifier
export { GroundingVerifier } from "./GroundingVerifier";

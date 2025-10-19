// ============================================
// LLM Utilities - Exports
// ============================================

// Re-export citation utilities
export {
  parseCitations,
  hasCitations,
  extractMaterialId,
  formatCitations,
  highlightCitations,
  validateCitations,
  type Citation,
  type ParsedCitations,
} from './citations';

// Re-export core utilities from parent
// Note: extractKeywords, calculateRelevanceScore, rankMaterials removed
// These were superseded by hybrid retrieval system
export {
  buildSystemPrompt,
  buildUserPromptWithContext,
  buildConversationPrompt,
  formatCost,
  formatTokens,
  truncateToTokenLimit,
} from '../utils';

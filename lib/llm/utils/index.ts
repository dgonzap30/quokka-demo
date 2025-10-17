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
export {
  buildSystemPrompt,
  buildUserPromptWithContext,
  buildConversationPrompt,
  extractKeywords,
  calculateRelevanceScore,
  rankMaterials,
  formatCost,
  formatTokens,
  truncateToTokenLimit,
} from '../utils';
